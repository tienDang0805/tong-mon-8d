import path from "node:path";
import fs from "node:fs";
import { AsyncLocalStorage } from "node:async_hooks";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import type {
  ActionResultPayload,
  CharacterSaveState,
  CombatDisciplineId
} from "@tong-mon-8d/shared";
import { INITIAL_DISCIPLINE_STATS, ZONES_REGISTRY } from "@tong-mon-8d/game-data";
import {
  CHARACTER_V02_SCHEMA_VERSION,
  CHARACTERS_V02_TABLE_DDL,
  CharacterV02PersistenceError,
  CharacterV02Repository,
  createInitialCharacterV02State,
  hydrateCharacterV02Row,
  validateCharacterV02PersistedState,
  type CharacterV02CombatResources,
  type CharacterV02CultivationState,
  type CharacterV02ErrorCode,
  type CharacterV02PersistedState,
  type CharacterV02RepositoryHost,
  type CharacterV02UpdateInput,
  type CharacterV02ValidationOptions,
  type CharacterV02ValidationResult,
  type CharacterV02WorldAndEconomyState,
  type CreateInitialCharacterV02Params
} from "./characterV02Repository.js";
import {
  GUEST_CREDENTIALS_TABLE_DDL,
  GuestIdentityError,
  GuestIdentityService,
  type AssertVerifiedSessionResult,
  type GuestIdentityErrorCode,
  type IssuedGuestCredential,
  type VerifiedGuestSession,
  type VerifyGuestTokenResult
} from "./guestIdentity.js";
import {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_INNATE_TIER_WEIGHTS,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL,
  CharacterV02ActionService,
  DEFAULT_ROLL_DRAFT_TTL_MS,
  rollInnateDestinyTripleFromCatalog,
  toCharacterV02Snapshot,
  type CharacterV02ActionOptions,
  type InnateDestinyRollResult,
  type RollInnateDestinyOptions,
  type ServerOnlyAwardCharacterExpParams,
  type ServerOnlyGrantAcquiredDestinyParams
} from "./characterV02Actions.js";

export {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_INNATE_TIER_WEIGHTS,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL,
  CHARACTER_V02_SCHEMA_VERSION,
  CHARACTERS_V02_TABLE_DDL,
  CharacterV02ActionService,
  CharacterV02PersistenceError,
  CharacterV02Repository,
  DEFAULT_ROLL_DRAFT_TTL_MS,
  GUEST_CREDENTIALS_TABLE_DDL,
  GuestIdentityError,
  GuestIdentityService,
  createInitialCharacterV02State,
  hydrateCharacterV02Row,
  rollInnateDestinyTripleFromCatalog,
  toCharacterV02Snapshot,
  validateCharacterV02PersistedState,
  type AssertVerifiedSessionResult,
  type CharacterV02ActionOptions,
  type CharacterV02CombatResources,
  type CharacterV02CultivationState,
  type CharacterV02ErrorCode,
  type CharacterV02PersistedState,
  type CharacterV02RepositoryHost,
  type CharacterV02UpdateInput,
  type CharacterV02ValidationOptions,
  type CharacterV02ValidationResult,
  type CharacterV02WorldAndEconomyState,
  type CreateInitialCharacterV02Params,
  type GuestIdentityErrorCode,
  type InnateDestinyRollResult,
  type IssuedGuestCredential,
  type RollInnateDestinyOptions,
  type ServerOnlyAwardCharacterExpParams,
  type ServerOnlyGrantAcquiredDestinyParams,
  type VerifiedGuestSession,
  type VerifyGuestTokenResult
};

export type TransactionErrorCode =
  | "NESTED_TRANSACTION_FORBIDDEN"
  | "MISSING_TRANSACTION_RUNNER"
  | "FOREIGN_TRANSACTION_RUNNER"
  | "MISMATCHED_TRANSACTION_RUNNER"
  | "TRANSACTION_CLOSED"
  | "TRANSACTION_ABORTED_BY_QUERY_ERROR"
  | "UNWAITED_TRANSACTION_QUERY"
  | "ADAPTER_POISONED"
  | "DATABASE_CLOSING"
  | "DATABASE_CLOSED"
  | "FORBIDDEN_TRANSACTION_CONTROL_SQL";

export class TransactionUsageError extends Error {
  readonly code: TransactionErrorCode;

  constructor(
    code: TransactionErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "TransactionUsageError";
    this.code = code;
  }
}

export interface SqlQueryRunner {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[] }>;
}

export interface SqlTransaction extends SqlQueryRunner {
  readonly closed: boolean;
}

export interface SqlExecutor extends SqlQueryRunner {
  withTransaction<T>(fn: (tx: SqlTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface PGliteTransactionDriverLike {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[] }>;
}

export interface PGliteDriverLike {
  readonly waitReady?: Promise<void>;
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[] }>;
  transaction<T>(
    callback: (tx: PGliteTransactionDriverLike) => Promise<T>
  ): Promise<T>;
  close(): Promise<void>;
  readonly closed?: boolean;
}

export interface PgPoolClientLike {
  query(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: unknown[] }>;
  release(err?: Error | boolean): void;
}

export interface PgPoolLike {
  connect(): Promise<PgPoolClientLike>;
  query(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
}

const FORBIDDEN_TX_CONTROL_SQL_PREFIX =
  /^\s*\(*\s*(BEGIN|START\s+TRANSACTION|COMMIT|END|ROLLBACK|ABORT|SAVEPOINT|RELEASE(\s+SAVEPOINT)?|PREPARE\s+TRANSACTION|COMMIT\s+PREPARED|ROLLBACK\s+PREPARED|SET\s+(LOCAL\s+|SESSION\s+CHARACTERISTICS\s+AS\s+)?TRANSACTION)\b/i;

function isForbiddenTransactionControlSql(sql: string): boolean {
  if (
    sql.includes("--") ||
    sql.includes("\x2f\x2a") ||
    sql.includes("\x2a\x2f")
  ) {
    return true;
  }
  const trimmed = sql.trim();
  const body = trimmed.endsWith(";")
    ? trimmed.slice(0, -1).trim()
    : trimmed;
  if (body.includes(";")) {
    return true;
  }
  return FORBIDDEN_TX_CONTROL_SQL_PREFIX.test(body);
}

function toError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  return new Error(String(err));
}

class TransactionContextGuard {
  private readonly txContext = new AsyncLocalStorage<{
    runner: ManagedTransactionRunner;
  }>();
  private readonly ownedRunners = new WeakSet<SqlTransaction>();

  getActiveRunner(): ManagedTransactionRunner | undefined {
    return this.txContext.getStore()?.runner;
  }

  registerRunner(runner: ManagedTransactionRunner): void {
    this.ownedRunners.add(runner);
  }

  isOwnedRunner(tx: SqlTransaction): boolean {
    return this.ownedRunners.has(tx);
  }

  runWithRunner<T>(
    runner: ManagedTransactionRunner,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.txContext.run({ runner }, fn);
  }

  assertRootOperationAllowed(
    kind: "query" | "withTransaction" | "close" | "init"
  ): void {
    const active = this.getActiveRunner();
    if (active !== undefined) {
      if (kind === "withTransaction") {
        throw new TransactionUsageError(
          "NESTED_TRANSACTION_FORBIDDEN",
          "Nested withTransaction calls are forbidden."
        );
      }
      if (kind === "close") {
        throw new TransactionUsageError(
          "NESTED_TRANSACTION_FORBIDDEN",
          "Cannot close database from inside an active transaction context."
        );
      }
      throw new TransactionUsageError(
        "MISSING_TRANSACTION_RUNNER",
        `Root database ${kind} called without tx inside an active transaction context.`
      );
    }
  }

  validateExplicitRunner(tx: SqlTransaction): SqlTransaction {
    if (!this.ownedRunners.has(tx)) {
      throw new TransactionUsageError(
        "FOREIGN_TRANSACTION_RUNNER",
        "Transaction runner does not belong to this database instance."
      );
    }
    if (tx.closed) {
      throw new TransactionUsageError(
        "TRANSACTION_CLOSED",
        "Cannot execute query on a settled or closed transaction."
      );
    }
    const active = this.getActiveRunner();
    if (active !== tx) {
      throw new TransactionUsageError(
        "MISMATCHED_TRANSACTION_RUNNER",
        "Provided transaction runner does not match the active transaction context."
      );
    }
    return tx;
  }
}

class ManagedTransactionRunner implements SqlTransaction {
  private settling = false;
  private isClosed = false;
  private firstQueryError: unknown = null;
  private readonly activeQueries = new Set<Promise<void>>();

  constructor(
    private readonly guard: TransactionContextGuard,
    private readonly driverQuery: <T = Record<string, unknown>>(
      sql: string,
      params: unknown[]
    ) => Promise<{ rows: T[] }>
  ) {}

  get closed(): boolean {
    return this.settling || this.isClosed;
  }

  query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ rows: T[] }> {
    if (this.settling || this.isClosed) {
      return Promise.reject(
        new TransactionUsageError(
          "TRANSACTION_CLOSED",
          "Cannot execute query on a settled or closed transaction."
        )
      );
    }
    const active = this.guard.getActiveRunner();
    if (active !== this) {
      return Promise.reject(
        new TransactionUsageError(
          "MISMATCHED_TRANSACTION_RUNNER",
          "Transaction runner invoked outside its active transaction context."
        )
      );
    }
    if (isForbiddenTransactionControlSql(sql)) {
      const misuseError = new TransactionUsageError(
        "FORBIDDEN_TRANSACTION_CONTROL_SQL",
        "Manual transaction control SQL is forbidden inside withTransaction."
      );
      if (this.firstQueryError === null) {
        this.firstQueryError = misuseError;
      }
      return Promise.reject(misuseError);
    }

    let callerPromise: Promise<{ rows: T[] }>;
    try {
      callerPromise = Promise.resolve(this.driverQuery<T>(sql, params));
    } catch (syncErr) {
      callerPromise = Promise.reject(syncErr);
    }

    const settlementTracker: Promise<void> = callerPromise.then(
      () => {
        this.activeQueries.delete(settlementTracker);
      },
      (err: unknown) => {
        if (this.firstQueryError === null) {
          this.firstQueryError = err;
        }
        this.activeQueries.delete(settlementTracker);
      }
    );

    this.activeQueries.add(settlementTracker);
    return callerPromise;
  }

  async executeCallback<T>(
    fn: (tx: SqlTransaction) => Promise<T>
  ): Promise<T> {
    let callbackResult!: T;
    let callbackFailed = false;
    let callbackError: unknown = null;

    try {
      callbackResult = await this.guard.runWithRunner(this, async () => {
        try {
          return await fn(this);
        } finally {
          this.settling = true;
        }
      });
    } catch (err) {
      callbackFailed = true;
      callbackError = err;
    }

    this.settling = true;
    const hadPendingAtExit = this.activeQueries.size > 0;
    if (hadPendingAtExit) {
      await Promise.all([...this.activeQueries]);
    }
    this.isClosed = true;

    if (callbackFailed) {
      throw callbackError;
    }
    if (hadPendingAtExit) {
      throw new TransactionUsageError(
        "UNWAITED_TRANSACTION_QUERY",
        "Transaction callback settled while one or more tx.query() calls were still pending.",
        this.firstQueryError !== null
          ? { cause: this.firstQueryError }
          : undefined
      );
    }
    if (this.firstQueryError !== null) {
      throw new TransactionUsageError(
        "TRANSACTION_ABORTED_BY_QUERY_ERROR",
        "Transaction cannot commit because a query failed inside the transaction.",
        { cause: this.firstQueryError }
      );
    }

    return callbackResult;
  }

  markClosed(): void {
    this.settling = true;
    this.isClosed = true;
  }
}

interface InternalSqlExecutor extends SqlExecutor {
  readonly guard: TransactionContextGuard;
  assertHealthyForRootSelection(): void;
}

export class PGliteAdapter implements InternalSqlExecutor {
  private readonly db: PGliteDriverLike;
  readonly guard = new TransactionContextGuard();
  private rootOpTail: Promise<void> = Promise.resolve();
  private poisonedError: Error | null = null;
  private closing = false;
  private closed = false;
  private closePromise: Promise<void> | null = null;

  constructor(dataDir?: string, driver?: PGliteDriverLike) {
    if (driver) {
      this.db = driver;
    } else if (dataDir && dataDir !== "memory://") {
      fs.mkdirSync(dataDir, { recursive: true });
      this.db = new PGlite(dataDir);
    } else {
      this.db = new PGlite();
    }
  }

  assertHealthyForRootSelection(): void {
    if (this.poisonedError !== null) {
      throw new TransactionUsageError(
        "ADAPTER_POISONED",
        "PGliteAdapter is closed to further operations after an unrecoverable transaction protocol failure.",
        { cause: this.poisonedError }
      );
    }
    if (this.closed) {
      throw new TransactionUsageError("DATABASE_CLOSED", "Database is closed.");
    }
    if (this.closing) {
      throw new TransactionUsageError(
        "DATABASE_CLOSING",
        "Database is closing and cannot accept new operations."
      );
    }
  }

  private assertHealthyAtDequeue(): void {
    if (this.poisonedError !== null) {
      throw new TransactionUsageError(
        "ADAPTER_POISONED",
        "PGliteAdapter is closed to further operations after an unrecoverable transaction protocol failure.",
        { cause: this.poisonedError }
      );
    }
    if (this.closed) {
      throw new TransactionUsageError("DATABASE_CLOSED", "Database is closed.");
    }
  }

  private enqueueRootOp<T>(task: () => Promise<T>): Promise<T> {
    const run = this.rootOpTail.then(task, task);
    this.rootOpTail = run.then(
      () => undefined,
      () => undefined
     );
    return run;
  }

  query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ rows: T[] }> {
    try {
      this.guard.assertRootOperationAllowed("query");
      this.assertHealthyForRootSelection();
    } catch (err) {
      return Promise.reject(err);
    }

    return this.enqueueRootOp(async () => {
      this.assertHealthyAtDequeue();
      const res = await this.db.query<T>(sql, params);
      return { rows: res.rows };
    });
  }

  withTransaction<T>(fn: (tx: SqlTransaction) => Promise<T>): Promise<T> {
    try {
      this.guard.assertRootOperationAllowed("withTransaction");
      this.assertHealthyForRootSelection();
    } catch (err) {
      return Promise.reject(err);
    }

    return this.enqueueRootOp(async () => {
      this.assertHealthyAtDequeue();

      let innerCallbackEntered = false;
      let innerCallbackSucceeded = false;
      let callbackFailure: unknown = null;
      const rollbackSentinel = { token: Symbol("pgliteRollbackSentinel") };
      let activeRunner = null as ManagedTransactionRunner | null;

      try {
        return await this.db.transaction(async (pgliteTx) => {
          innerCallbackEntered = true;
          const createdRunner = new ManagedTransactionRunner(
            this.guard,
            async <R = Record<string, unknown>>(
              qSql: string,
              qParams: unknown[]
            ): Promise<{ rows: R[] }> => {
              const res = await pgliteTx.query<R>(qSql, qParams);
              return { rows: res.rows };
            }
          );
          activeRunner = createdRunner;
          this.guard.registerRunner(createdRunner);

          try {
            const value = await createdRunner.executeCallback(fn);
            innerCallbackSucceeded = true;
            return value;
          } catch (err) {
            callbackFailure = err;
            throw rollbackSentinel;
          }
        });
      } catch (outerErr) {
        if (activeRunner !== null) {
          activeRunner.markClosed();
        }
        if (!innerCallbackEntered) {
          this.poisonedError = toError(outerErr);
          throw outerErr;
        }
        if (innerCallbackSucceeded) {
          this.poisonedError = toError(outerErr);
          throw outerErr;
        }
        if (outerErr === rollbackSentinel) {
          throw callbackFailure;
        }
        const combinedError = new AggregateError(
          [callbackFailure, outerErr],
          "Transaction callback failed and PGlite native ROLLBACK also failed.",
          { cause: callbackFailure }
        );
        this.poisonedError = combinedError;
        throw combinedError;
      }
    });
  }

  close(): Promise<void> {
    try {
      this.guard.assertRootOperationAllowed("close");
    } catch (err) {
      return Promise.reject(err);
    }

    if (this.closePromise !== null) {
      return this.closePromise;
    }

    this.closing = true;
    this.closePromise = this.enqueueRootOp(async () => {
      if (this.closed) {
        return;
      }
      this.closed = true;
      try {
        if (!this.db.closed) {
          if (this.db.waitReady) {
            await this.db.waitReady;
          }
          await this.db.close();
        }
      } catch (closeErr) {
        if (this.poisonedError !== null) {
          this.poisonedError = new AggregateError(
            [this.poisonedError, closeErr],
            "PGliteAdapter was poisoned and teardown also encountered an error.",
            { cause: this.poisonedError }
          );
          return;
        }
        throw closeErr;
      }
    });

    return this.closePromise;
  }
}

export class PgPoolAdapter implements InternalSqlExecutor {
  private readonly pool: PgPoolLike;
  readonly guard = new TransactionContextGuard();
  private readonly activeRootOps = new Set<Promise<void>>();
  private closing = false;
  private closed = false;
  private closePromise: Promise<void> | null = null;

  constructor(connectionString: string, pool?: PgPoolLike) {
    this.pool = pool ?? new pg.Pool({ connectionString });
  }

  assertHealthyForRootSelection(): void {
    if (this.closed) {
      throw new TransactionUsageError("DATABASE_CLOSED", "Database is closed.");
    }
    if (this.closing) {
      throw new TransactionUsageError(
        "DATABASE_CLOSING",
        "Database is closing and cannot accept new operations."
      );
    }
  }

  private trackRootOp<T>(op: () => Promise<T>): Promise<T> {
    const promise = op();
    const tracker = promise.then(
      () => {
        this.activeRootOps.delete(tracker);
      },
      () => {
        this.activeRootOps.delete(tracker);
      }
    );
    this.activeRootOps.add(tracker);
    return promise;
  }

  query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ rows: T[] }> {
    try {
      this.guard.assertRootOperationAllowed("query");
      this.assertHealthyForRootSelection();
    } catch (err) {
      return Promise.reject(err);
    }

    return this.trackRootOp(async () => {
      if (this.closed) {
        throw new TransactionUsageError("DATABASE_CLOSED", "Database is closed.");
      }
      const res = await this.pool.query(sql, params);
      return { rows: res.rows as T[] };
    });
  }

  withTransaction<T>(fn: (tx: SqlTransaction) => Promise<T>): Promise<T> {
    try {
      this.guard.assertRootOperationAllowed("withTransaction");
      this.assertHealthyForRootSelection();
    } catch (err) {
      return Promise.reject(err);
    }

    return this.trackRootOp(async () => {
      if (this.closed) {
        throw new TransactionUsageError("DATABASE_CLOSED", "Database is closed.");
      }

      const client = await this.pool.connect();
      let released = false;
      const releaseClientOnce = (releaseErr?: Error | boolean): void => {
        if (!released) {
          released = true;
          client.release(releaseErr);
        }
      };

      try {
        await client.query("BEGIN");
      } catch (beginErr) {
        releaseClientOnce(toError(beginErr));
        throw beginErr;
      }

      const runner = new ManagedTransactionRunner(
        this.guard,
        async <R = Record<string, unknown>>(
          qSql: string,
          qParams: unknown[]
        ): Promise<{ rows: R[] }> => {
          const res = await client.query(qSql, qParams);
          return { rows: res.rows as R[] };
        }
      );
      this.guard.registerRunner(runner);

      let value!: T;
      try {
        value = await runner.executeCallback(fn);
      } catch (txErr) {
        runner.markClosed();
        try {
          await client.query("ROLLBACK");
        } catch (rbErr) {
          const rollbackError = toError(rbErr);
          releaseClientOnce(rollbackError);
          throw new AggregateError(
            [txErr, rollbackError],
            "Transaction callback failed and PostgreSQL ROLLBACK also failed.",
            { cause: txErr }
          );
        }
        releaseClientOnce();
        throw txErr;
      }

      try {
        await client.query("COMMIT");
      } catch (commitErr) {
        runner.markClosed();
        releaseClientOnce(toError(commitErr));
        throw commitErr;
      }

      releaseClientOnce();
      return value;
    });
  }

  close(): Promise<void> {
    try {
      this.guard.assertRootOperationAllowed("close");
    } catch (err) {
      return Promise.reject(err);
    }

    if (this.closePromise !== null) {
      return this.closePromise;
    }

    this.closing = true;
    this.closePromise = (async () => {
      if (this.activeRootOps.size > 0) {
        await Promise.all([...this.activeRootOps]);
      }
      if (!this.closed) {
        this.closed = true;
        await this.pool.end();
      }
    })();

    return this.closePromise;
  }
}

export interface ResolvePgDataDirOptions {
  repoRoot?: string;
  canonicalDir?: string;
  legacyNestedDir?: string;
  cwd?: string;
}

export function isPgDataInitialized(dirPath: string): boolean {
  return fs.existsSync(path.join(dirPath, "PG_VERSION"));
}

export function resolvePgDataDir(
  rawDataDir?: string,
  options?: ResolvePgDataDirOptions
): string {
  const trimmed = (rawDataDir ?? "").trim();
  if (trimmed === "memory://") {
    return "memory://";
  }

  if (trimmed.length > 0 && path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }

  const repoRoot = path.resolve(
    options?.repoRoot ?? path.resolve(import.meta.dirname, "../../..")
  );
  const cwd = path.resolve(options?.cwd ?? process.cwd());
  const canonicalDir = path.resolve(
    options?.canonicalDir ?? path.join(repoRoot, "apps/server/data/pgdata")
  );
  const legacyNestedDir = path.resolve(
    options?.legacyNestedDir ??
      path.join(repoRoot, "apps/server/apps/server/data/pgdata")
  );

  const repoRelativeTarget = trimmed
    ? path.resolve(repoRoot, trimmed)
    : canonicalDir;
  const cwdRelativeTarget = trimmed ? path.resolve(cwd, trimmed) : canonicalDir;

  const isDefaultOrCanonicalTarget =
    trimmed === "" ||
    repoRelativeTarget === canonicalDir ||
    cwdRelativeTarget === canonicalDir ||
    repoRelativeTarget === legacyNestedDir ||
    cwdRelativeTarget === legacyNestedDir;

  if (isDefaultOrCanonicalTarget) {
    const canonicalInit = isPgDataInitialized(canonicalDir);
    const legacyInit = isPgDataInitialized(legacyNestedDir);

    if (canonicalInit && legacyInit) {
      throw new Error(
        `SPLIT_BRAIN_PGDATA_DIR: Both canonical (${canonicalDir}) and legacy (${legacyNestedDir}) PGlite directories are initialized. Consolidate or set an explicit absolute PGDATA_DIR.`
      );
    }
    if (legacyInit) {
      return legacyNestedDir;
    }
    return canonicalDir;
  }

  const repoTargetInit = isPgDataInitialized(repoRelativeTarget);
  const cwdTargetInit =
    cwdRelativeTarget !== repoRelativeTarget &&
    isPgDataInitialized(cwdRelativeTarget);

  if (repoTargetInit && cwdTargetInit) {
    throw new Error(
      `SPLIT_BRAIN_PGDATA_DIR: Both repo-relative (${repoRelativeTarget}) and cwd-relative (${cwdRelativeTarget}) PGlite directories are initialized for PGDATA_DIR=${trimmed}.`
    );
  }
  if (cwdTargetInit) {
    return cwdRelativeTarget;
  }
  return repoRelativeTarget;
}

export function loadRepoEnvIfNeeded(
  repoRoot = path.resolve(import.meta.dirname, "../../.."),
  targetEnv: NodeJS.ProcessEnv = process.env
): void {
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.charCodeAt(0) === 35) {
      continue;
    }
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) {
      continue;
    }
    const rawKey = line.slice(0, eqIndex).trim();
    const key = rawKey.startsWith("export ") ? rawKey.slice(7).trim() : rawKey;
    if (!key) {
      continue;
    }
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (
      targetEnv[key] === undefined &&
      !Object.prototype.hasOwnProperty.call(targetEnv, key)
    ) {
      targetEnv[key] = value;
    }
  }
}

export class GameDatabase {
  private executor: InternalSqlExecutor;
  private resolvedDataDir: string | null;
  private defaultCharacterV02ActionOptions: CharacterV02ActionOptions = {};
  readonly charactersV02: CharacterV02Repository;
  readonly guestIdentity: GuestIdentityService;
  readonly characterV02Actions: CharacterV02ActionService;

  constructor(options?: {
    dataDir?: string;
    connectionString?: string;
    repoRoot?: string;
    cwd?: string;
  }) {
    const explicitDataDir = (options?.dataDir ?? "").trim();
    const rawConn =
      explicitDataDir === "memory://"
        ? (options?.connectionString ?? "")
        : (options?.connectionString ?? process.env.DATABASE_URL ?? "");
    const conn = rawConn.trim();
    if (conn) {
      this.resolvedDataDir = null;
      this.executor = new PgPoolAdapter(conn);
    } else {
      const targetDir = resolvePgDataDir(
        options?.dataDir ?? process.env.PGDATA_DIR,
        {
          repoRoot: options?.repoRoot,
          cwd: options?.cwd
        }
      );
      this.resolvedDataDir = targetDir;
      this.executor = new PGliteAdapter(targetDir);
    }
    const repositoryHost: CharacterV02RepositoryHost = {
      resolveQueryRunner: (tx?: SqlTransaction) => this.resolveQueryRunner(tx),
      withTransaction: <T>(fn: (tx: SqlTransaction) => Promise<T>) =>
        this.withTransaction(fn)
    };
    this.charactersV02 = new CharacterV02Repository(repositoryHost);
    this.guestIdentity = new GuestIdentityService(repositoryHost);
    this.characterV02Actions = new CharacterV02ActionService(
      repositoryHost,
      this.charactersV02
    );
  }

  getDataDir(): string | null {
    return this.resolvedDataDir;
  }

  setCharacterV02ActionDefaults(options: CharacterV02ActionOptions): void {
    this.defaultCharacterV02ActionOptions = { ...options };
  }

  getCharacterV02ActionDefaults(): CharacterV02ActionOptions {
    return { ...this.defaultCharacterV02ActionOptions };
  }

  private resolveQueryRunner(tx?: SqlTransaction): SqlQueryRunner {
    if (tx !== undefined) {
      return this.executor.guard.validateExplicitRunner(tx);
    }
    this.executor.guard.assertRootOperationAllowed("query");
    this.executor.assertHealthyForRootSelection();
    return this.executor;
  }

  withTransaction<T>(fn: (tx: SqlTransaction) => Promise<T>): Promise<T> {
    return this.executor.withTransaction(fn);
  }

  async init(): Promise<void> {
    this.executor.guard.assertRootOperationAllowed("init");
    this.executor.assertHealthyForRootSelection();
    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id TEXT PRIMARY KEY,
        created_at BIGINT NOT NULL
      );
    `);
    await this.executor.query(GUEST_CREDENTIALS_TABLE_DDL);
    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS characters (
        character_id TEXT PRIMARY KEY,
        account_id TEXT UNIQUE NOT NULL,
        nickname TEXT NOT NULL,
        discipline TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        direction TEXT NOT NULL,
        realm_id TEXT NOT NULL,
        realm_stage INTEGER NOT NULL,
        tu_vi INTEGER NOT NULL,
        hp INTEGER NOT NULL,
        max_hp INTEGER NOT NULL,
        mp INTEGER NOT NULL,
        max_mp INTEGER NOT NULL,
        attack INTEGER NOT NULL,
        defense INTEGER NOT NULL,
        linh_thach INTEGER NOT NULL,
        equipped_title TEXT NOT NULL,
        equipped_inheritance TEXT,
        inventory_json JSONB NOT NULL,
        quests_json JSONB NOT NULL,
        reputation_json JSONB NOT NULL,
        buffs_json JSONB NOT NULL,
        meditation_started_at BIGINT NOT NULL,
        last_meditation_claim_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);
    await this.executor.query(CHARACTERS_V02_TABLE_DDL);
    await this.executor.query(CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL);
    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS idempotency_ledger (
        request_id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        result_json JSONB NOT NULL,
        created_at BIGINT NOT NULL
      );
    `);
    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS economy_audit_log (
        id SERIAL PRIMARY KEY,
        character_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        delta_linh_thach INTEGER NOT NULL,
        item_id TEXT,
        quantity INTEGER,
        created_at BIGINT NOT NULL
      );
    `);
  }

  async createCharacterV02(
    state: unknown,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState> {
    return this.charactersV02.createCharacter(state, options, tx);
  }

  async getCharacterV02ById(
    characterId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    return this.charactersV02.getByCharacterId(characterId, options, tx);
  }

  async getCharacterV02ByAccount(
    accountId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    return this.charactersV02.getByAccountId(accountId, options, tx);
  }

  async updateCharacterV02(
    input: CharacterV02UpdateInput,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState> {
    return this.charactersV02.updateCharacter(input, options, tx);
  }

  async loadOrCreateCharacter(
    accountId: string,
    nickname: string,
    discipline: CombatDisciplineId = "kiem_tu",
    tx?: SqlTransaction
  ): Promise<CharacterSaveState> {
    const runner = this.resolveQueryRunner(tx);
    const cleanAccount = accountId.trim().slice(0, 64) || "guest_default";
    const cleanNick = nickname.trim().slice(0, 24) || "Đạo Hữu Vô Danh";
    const validDisc: CombatDisciplineId =
      discipline in INITIAL_DISCIPLINE_STATS ? discipline : "kiem_tu";

    const existing = await runner.query<Record<string, unknown>>(
      `SELECT * FROM characters WHERE account_id = $1 LIMIT 1`,
      [cleanAccount]
    );
    if (existing.rows.length > 0) {
      return this.rowToState(existing.rows[0]);
    }

    const now = Date.now();
    await runner.query(
      `INSERT INTO accounts (account_id, created_at) VALUES ($1, $2) ON CONFLICT (account_id) DO NOTHING`,
      [cleanAccount, now]
    );

    const baseStats = INITIAL_DISCIPLINE_STATS[validDisc];
    const spawn = ZONES_REGISTRY.tan_thu_thon.defaultSpawn;
    const initialState: CharacterSaveState = {
      accountId: cleanAccount,
      characterId: `char_${cleanAccount}`,
      nickname: cleanNick,
      discipline: validDisc,
      zoneId: "tan_thu_thon",
      x: spawn.x,
      y: spawn.y,
      direction: "down",
      realmId: "pham_nhan",
      realmStage: 1,
      tuVi: 40,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      mp: baseStats.mp,
      maxMp: baseStats.mp,
      attack: baseStats.attack,
      defense: baseStats.defense,
      linhThach: 65,
      equippedTitle: "Tân Nhập Môn Đệ Tử",
      equippedInheritance: null,
      inventory: [
        { itemId: "thanh_van_kiem_so_cap", quantity: 1 },
        { itemId: "bot_linh_mach", quantity: 1 }
      ],
      quests: {},
      reputation: { phi_de: 0, chatdvt: 0, hoa_tran: 0 },
      buffs: [],
      meditationStartedAt: now - 1800 * 1000,
      lastMeditationClaimAt: now - 1800 * 1000,
      partyId: null
    };

    await this.saveCharacterState(initialState, tx);
    return initialState;
  }

  async getCharacterByAccount(
    accountId: string,
    tx?: SqlTransaction
  ): Promise<CharacterSaveState | null> {
    const runner = this.resolveQueryRunner(tx);
    const res = await runner.query<Record<string, unknown>>(
      `SELECT * FROM characters WHERE account_id = $1 LIMIT 1`,
      [accountId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return this.rowToState(res.rows[0]);
  }

  async saveCharacterState(
    state: CharacterSaveState,
    tx?: SqlTransaction
  ): Promise<void> {
    const runner = this.resolveQueryRunner(tx);
    const now = Date.now();
    await runner.query(
      `
      INSERT INTO characters (
        character_id, account_id, nickname, discipline, zone_id, x, y, direction,
        realm_id, realm_stage, tu_vi, hp, max_hp, mp, max_mp, attack, defense,
        linh_thach, equipped_title, equipped_inheritance,
        inventory_json, quests_json, reputation_json, buffs_json,
        meditation_started_at, last_meditation_claim_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20,
        $21::jsonb, $22::jsonb, $23::jsonb, $24::jsonb,
        $25, $26, $27
      )
      ON CONFLICT (character_id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        discipline = EXCLUDED.discipline,
        zone_id = EXCLUDED.zone_id,
        x = EXCLUDED.x,
        y = EXCLUDED.y,
        direction = EXCLUDED.direction,
        realm_id = EXCLUDED.realm_id,
        realm_stage = EXCLUDED.realm_stage,
        tu_vi = EXCLUDED.tu_vi,
        hp = EXCLUDED.hp,
        max_hp = EXCLUDED.max_hp,
        mp = EXCLUDED.mp,
        max_mp = EXCLUDED.max_mp,
        attack = EXCLUDED.attack,
        defense = EXCLUDED.defense,
        linh_thach = EXCLUDED.linh_thach,
        equipped_title = EXCLUDED.equipped_title,
        equipped_inheritance = EXCLUDED.equipped_inheritance,
        inventory_json = EXCLUDED.inventory_json,
        quests_json = EXCLUDED.quests_json,
        reputation_json = EXCLUDED.reputation_json,
        buffs_json = EXCLUDED.buffs_json,
        meditation_started_at = EXCLUDED.meditation_started_at,
        last_meditation_claim_at = EXCLUDED.last_meditation_claim_at,
        updated_at = EXCLUDED.updated_at;
      `,
      [
        state.characterId,
        state.accountId,
        state.nickname,
        state.discipline,
        state.zoneId,
        Math.round(state.x),
        Math.round(state.y),
        state.direction,
        state.realmId,
        state.realmStage,
        Math.round(state.tuVi),
        Math.round(state.hp),
        Math.round(state.maxHp),
        Math.round(state.mp),
        Math.round(state.maxMp),
        Math.round(state.attack),
        Math.round(state.defense),
        Math.round(state.linhThach),
        state.equippedTitle,
        state.equippedInheritance,
        JSON.stringify(state.inventory),
        JSON.stringify(state.quests),
        JSON.stringify(state.reputation),
        JSON.stringify(state.buffs),
        state.meditationStartedAt,
        state.lastMeditationClaimAt,
        now
      ]
    );
  }

  async checkIdempotency(
    requestId: string,
    tx?: SqlTransaction
  ): Promise<ActionResultPayload | null> {
    const runner = this.resolveQueryRunner(tx);
    if (!requestId) {
      return null;
    }
    const res = await runner.query<{ result_json: ActionResultPayload }>(
      `SELECT result_json FROM idempotency_ledger WHERE request_id = $1 LIMIT 1`,
      [requestId]
    );
    if (res.rows.length > 0) {
      return {
        ...res.rows[0].result_json,
        ok: false,
        code: "DUPLICATE_REQUEST",
        messageVi: "Yêu cầu trùng lặp đã bị từ chối bởi máy chủ."
      };
    }
    return null;
  }

  async recordIdempotency(
    requestId: string,
    characterId: string,
    actionType: string,
    result: ActionResultPayload,
    tx?: SqlTransaction
  ): Promise<void> {
    const runner = this.resolveQueryRunner(tx);
    if (!requestId) {
      return;
    }
    await runner.query(
      `INSERT INTO idempotency_ledger (request_id, character_id, action_type, result_json, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (request_id) DO NOTHING`,
      [requestId, characterId, actionType, JSON.stringify(result), Date.now()]
    );
  }

  async logEconomyEvent(
    characterId: string,
    eventType: string,
    deltaLinhThach: number,
    itemId?: string,
    quantity?: number,
    tx?: SqlTransaction
  ): Promise<void> {
    const runner = this.resolveQueryRunner(tx);
    await runner.query(
      `INSERT INTO economy_audit_log (character_id, event_type, delta_linh_thach, item_id, quantity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [characterId, eventType, deltaLinhThach, itemId ?? null, quantity ?? null, Date.now()]
    );
  }

  async close(): Promise<void> {
    await this.executor.close();
  }

  private rowToState(row: Record<string, unknown>): CharacterSaveState {
    return {
      accountId: String(row.account_id),
      characterId: String(row.character_id),
      nickname: String(row.nickname),
      discipline: String(row.discipline) as CombatDisciplineId,
      zoneId: String(row.zone_id) as CharacterSaveState["zoneId"],
      x: Number(row.x),
      y: Number(row.y),
      direction: String(row.direction) as CharacterSaveState["direction"],
      realmId: String(row.realm_id) as CharacterSaveState["realmId"],
      realmStage: Number(row.realm_stage),
      tuVi: Number(row.tu_vi),
      hp: Number(row.hp),
      maxHp: Number(row.max_hp),
      mp: Number(row.mp),
      maxMp: Number(row.max_mp),
      attack: Number(row.attack),
      defense: Number(row.defense),
      linhThach: Number(row.linh_thach),
      equippedTitle: String(row.equipped_title),
      equippedInheritance: row.equipped_inheritance ? String(row.equipped_inheritance) : null,
      inventory: (row.inventory_json as CharacterSaveState["inventory"]) ?? [],
      quests: (row.quests_json as CharacterSaveState["quests"]) ?? {},
      reputation: (row.reputation_json as CharacterSaveState["reputation"]) ?? {},
      buffs: (row.buffs_json as CharacterSaveState["buffs"]) ?? [],
      meditationStartedAt: Number(row.meditation_started_at),
      lastMeditationClaimAt: Number(row.last_meditation_claim_at),
      partyId: null
    };
  }
}
