import path from "node:path";
import fs from "node:fs";
import { AsyncLocalStorage } from "node:async_hooks";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import {
  TransactionUsageError,
  type PGliteDriverLike,
  type PgPoolLike,
  type SqlExecutor,
  type SqlTransaction
} from "./DbPorts.js";

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

export class TransactionContextGuard {
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

export class ManagedTransactionRunner implements SqlTransaction {
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

export interface InternalSqlExecutor extends SqlExecutor {
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
    options?.repoRoot ?? path.resolve(import.meta.dirname, "../../../../..")
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
  repoRoot = path.resolve(import.meta.dirname, "../../../../.."),
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
