import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { describe, expect, it, vi } from "vitest";
import {
  GameDatabase,
  PGliteAdapter,
  PgPoolAdapter,
  TransactionUsageError,
  type PGliteDriverLike,
  type PGliteTransactionDriverLike,
  type PgPoolClientLike,
  type PgPoolLike,
  type SqlTransaction
} from "../db.js";
import type { ActionResultPayload } from "@tong-mon-8d/shared";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T = void>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

interface SupervisedProbeStreamLike {
  on(event: "data", listener: (chunk: Buffer | string) => void): unknown;
  off(event: "data", listener: (chunk: Buffer | string) => void): unknown;
}

interface SupervisedProbeChildLike {
  readonly pid?: number;
  readonly exitCode?: number | null;
  readonly signalCode?: NodeJS.Signals | null;
  readonly stdout: SupervisedProbeStreamLike;
  readonly stderr: SupervisedProbeStreamLike;
  on(event: "error", listener: (err: Error) => void): unknown;
  once(event: "spawn", listener: () => void): unknown;
  once(
    event: "exit" | "close",
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): unknown;
  off(event: "spawn", listener: () => void): unknown;
  off(
    event: "exit" | "close",
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): unknown;
  off(event: "error", listener: (err: Error) => void): unknown;
  kill(signal?: NodeJS.Signals | number): boolean;
}

interface SupervisedProbeResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  spawnFailed: boolean;
  exitConfirmed: boolean;
  closeObserved: boolean;
  stdout: string;
  stderr: string;
}

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const DB_MODULE_URL = pathToFileURL(
  path.resolve(import.meta.dirname, "../db.ts")
).href;

async function runSupervisedNodeProbe(options: {
  script: string;
  env?: Record<string, string>;
  deadlineMs?: number;
  killConfirmMs?: number;
  closeFallbackMs?: number;
  spawnChild?: () => SupervisedProbeChildLike;
}): Promise<SupervisedProbeResult> {
  const deadlineMs = options.deadlineMs ?? 15000;
  const killConfirmMs = options.killConfirmMs ?? 2500;
  const closeFallbackMs = options.closeFallbackMs ?? 500;

  const child: SupervisedProbeChildLike = options.spawnChild
    ? options.spawnChild()
    : spawn(
        process.execPath,
        ["--import", "tsx", "--input-type=module", "-e", options.script],
        {
          cwd: REPO_ROOT,
          env: {
            ...process.env,
            ...options.env
          },
          stdio: ["ignore", "pipe", "pipe"]
        }
      );

  let stdout = "";
  let stderr = "";
  let timedOut = false;
  let spawned = typeof child.pid === "number" && child.pid > 0;
  let spawnFailed = false;
  let exitConfirmed = false;
  let closeObserved = false;
  let exitCode: number | null = null;
  let signal: NodeJS.Signals | null = null;

  const completionDeferred = createDeferred<void>();
  let killConfirmTimer: NodeJS.Timeout | undefined;
  let closeFallbackTimer: NodeJS.Timeout | undefined;

  const startCloseFallbackTimer = (): void => {
    if (closeObserved || closeFallbackTimer !== undefined) {
      return;
    }
    closeFallbackTimer = setTimeout(() => {
      completionDeferred.resolve();
    }, closeFallbackMs);
  };

  const onStdout = (chunk: Buffer | string): void => {
    stdout += typeof chunk === "string" ? chunk : chunk.toString("utf-8");
  };
  const onStderr = (chunk: Buffer | string): void => {
    stderr += typeof chunk === "string" ? chunk : chunk.toString("utf-8");
  };

  const onSpawn = (): void => {
    if (!spawnFailed) {
      spawned = true;
    }
  };

  const onExit = (code: number | null, sig: NodeJS.Signals | null): void => {
    if (spawnFailed) {
      return;
    }
    spawned = true;
    exitConfirmed = true;
    exitCode = code;
    signal = sig;
    if (killConfirmTimer !== undefined) {
      clearTimeout(killConfirmTimer);
      killConfirmTimer = undefined;
    }
    if (closeObserved) {
      completionDeferred.resolve();
      return;
    }
    startCloseFallbackTimer();
  };

  const onClose = (code: number | null, sig: NodeJS.Signals | null): void => {
    closeObserved = true;
    if (
      spawned &&
      !spawnFailed &&
      !exitConfirmed &&
      (code !== null ||
        sig !== null ||
        (child.exitCode !== undefined && child.exitCode !== null) ||
        (child.signalCode !== undefined && child.signalCode !== null))
    ) {
      exitConfirmed = true;
      exitCode = code ?? child.exitCode ?? null;
      signal = sig ?? child.signalCode ?? null;
    }
    if (killConfirmTimer !== undefined) {
      clearTimeout(killConfirmTimer);
      killConfirmTimer = undefined;
    }
    if (closeFallbackTimer !== undefined) {
      clearTimeout(closeFallbackTimer);
      closeFallbackTimer = undefined;
    }
    completionDeferred.resolve();
  };

  const onError = (err: Error): void => {
    if (!spawned && (child.pid === undefined || child.pid <= 0)) {
      spawnFailed = true;
      exitConfirmed = false;
      exitCode = null;
      signal = null;
      stderr += `\nSPAWN_ERROR: ${err.message}`;
      if (closeObserved) {
        completionDeferred.resolve();
      } else {
        startCloseFallbackTimer();
      }
      return;
    }
    stderr += `\nPOST_SPAWN_ERROR: ${err.message}`;
  };

  child.stdout.on("data", onStdout);
  child.stderr.on("data", onStderr);
  child.once("spawn", onSpawn);
  child.once("exit", onExit);
  child.once("close", onClose);
  child.on("error", onError);

  const deadlineTimer = setTimeout(() => {
    if (exitConfirmed || spawnFailed) {
      return;
    }
    timedOut = true;
    if (killConfirmTimer === undefined) {
      killConfirmTimer = setTimeout(() => {
        completionDeferred.resolve();
      }, killConfirmMs);
    }
    try {
      const killAccepted = child.kill();
      if (!killAccepted) {
        stderr += "\nKILL_UNCONFIRMED: child.kill() returned false";
      }
    } catch (killErr) {
      const msg =
        killErr instanceof Error ? killErr.message : String(killErr);
      stderr += `\nKILL_ERROR: ${msg}`;
    }
  }, deadlineMs);

  try {
    await completionDeferred.promise;
  } finally {
    clearTimeout(deadlineTimer);
    if (killConfirmTimer !== undefined) {
      clearTimeout(killConfirmTimer);
    }
    if (closeFallbackTimer !== undefined) {
      clearTimeout(closeFallbackTimer);
    }
    child.stdout.off("data", onStdout);
    child.stderr.off("data", onStderr);
    child.off("spawn", onSpawn);
    child.off("exit", onExit);
    child.off("close", onClose);
    child.off("error", onError);
  }

  return {
    exitCode,
    signal,
    timedOut,
    spawnFailed,
    exitConfirmed,
    closeObserved,
    stdout,
    stderr
  };
}

async function runTempDirGuardedProbe(options: {
  tmpDir: string;
  script: string;
  deadlineMs?: number;
  killConfirmMs?: number;
  closeFallbackMs?: number;
  spawnChild?: () => SupervisedProbeChildLike;
}): Promise<SupervisedProbeResult> {
  let canRemoveTmpDir = false;
  try {
    const probeResult = await runSupervisedNodeProbe({
      script: options.script,
      env: {
        TEST_TMP_PGDATA_DIR: options.tmpDir
      },
      deadlineMs: options.deadlineMs,
      killConfirmMs: options.killConfirmMs,
      closeFallbackMs: options.closeFallbackMs,
      spawnChild: options.spawnChild
    });

    if (probeResult.spawnFailed) {
      canRemoveTmpDir = true;
      throw new Error(
        `Subprocess failed to spawn before process creation (${options.tmpDir}): ${probeResult.stderr.trim()}`
      );
    }

    if (!probeResult.exitConfirmed) {
      throw new Error(
        `Subprocess termination unconfirmed (timedOut=${probeResult.timedOut}); preserving temporary PGlite directory: ${options.tmpDir}`
      );
    }

    canRemoveTmpDir = true;

    if (probeResult.timedOut || probeResult.exitCode !== 0) {
      throw new Error(
        `Subprocess exited abnormally after confirmed termination (timedOut=${probeResult.timedOut}, exitCode=${String(probeResult.exitCode)}, signal=${String(probeResult.signal)}): ${probeResult.stderr.trim()}`
      );
    }

    return probeResult;
  } finally {
    if (canRemoveTmpDir && fs.existsSync(options.tmpDir)) {
      fs.rmSync(options.tmpDir, { recursive: true, force: true });
    }
  }
}

describe("S1-B2 Database Transaction Infrastructure", () => {
  it(
    "T01: commits multi-statement work atomically across accounts, characters, idempotency_ledger, and economy_audit_log",
    async () => {
      const db = new GameDatabase({
        dataDir: "memory://",
        connectionString: ""
      });
      expect(db.getDataDir()).toBe("memory://");
      await db.init();

      try {
        const actionResult: ActionResultPayload = {
          requestId: "req_1",
          ok: true,
          code: "OK",
          messageVi: "Thành công."
        };

        const committedState = await db.withTransaction(async (tx) => {
          const created = await db.loadOrCreateCharacter(
            "acc_tx_1",
            "Đạo Hữu A",
            "kiem_tu",
            tx
          );
          const updated = {
            ...created,
            linhThach: created.linhThach + 50,
            tuVi: created.tuVi + 120
          };
          await db.saveCharacterState(updated, tx);
          await db.recordIdempotency(
            "req_1",
            updated.characterId,
            "test_op",
            actionResult,
            tx
          );
          await db.logEconomyEvent(
            updated.characterId,
            "test_op",
            50,
            "bot_linh_mach",
            2,
            tx
          );

          const inTxIdempotency = await db.checkIdempotency("req_1", tx);
          expect(inTxIdempotency).toEqual({
            requestId: "req_1",
            ok: false,
            code: "DUPLICATE_REQUEST",
            messageVi: "Yêu cầu trùng lặp đã bị từ chối bởi máy chủ."
          });

          return updated;
        });

        const persistedChar = await db.getCharacterByAccount("acc_tx_1");
        expect(persistedChar).not.toBeNull();
        expect(persistedChar?.linhThach).toBe(committedState.linhThach);
        expect(persistedChar?.tuVi).toBe(committedState.tuVi);

        const postCommitIdempotency = await db.checkIdempotency("req_1");
        expect(postCommitIdempotency).toEqual({
          requestId: "req_1",
          ok: false,
          code: "DUPLICATE_REQUEST",
          messageVi: "Yêu cầu trùng lặp đã bị từ chối bởi máy chủ."
        });

        await db.withTransaction(async (tx) => {
          const accountsRes = await tx.query<{ account_id: string }>(
            "SELECT account_id FROM accounts WHERE account_id = $1",
            ["acc_tx_1"]
          );
          expect(accountsRes.rows).toHaveLength(1);

          const economyRes = await tx.query<{
            character_id: string;
            event_type: string;
            delta_linh_thach: number;
            item_id: string;
            quantity: number;
          }>(
            "SELECT character_id, event_type, delta_linh_thach, item_id, quantity FROM economy_audit_log WHERE character_id = $1",
            [committedState.characterId]
          );
          expect(economyRes.rows).toEqual([
            {
              character_id: committedState.characterId,
              event_type: "test_op",
              delta_linh_thach: 50,
              item_id: "bot_linh_mach",
              quantity: 2
            }
          ]);
        });
      } finally {
        await db.close();
      }
    },
    15000
  );

  it(
    "T02: rolls back all writes on callback exception and executes queued valid work without poisoning",
    async () => {
      const db = new GameDatabase({
        dataDir: "memory://",
        connectionString: ""
      });
      expect(db.getDataDir()).toBe("memory://");
      await db.init();

      try {
        const [res1, res2] = await Promise.allSettled([
          db.withTransaction(async (tx) => {
            const created = await db.loadOrCreateCharacter(
              "acc_rb_1",
              "Đạo Hữu Rollback",
              "kiem_tu",
              tx
            );
            await db.saveCharacterState(
              { ...created, linhThach: 999 },
              tx
            );
            await db.recordIdempotency(
              "req_rb_1",
              created.characterId,
              "rb_op",
              {
                requestId: "req_rb_1",
                ok: true,
                code: "OK",
                messageVi: "Tạm thời."
              },
              tx
            );
            await db.logEconomyEvent(
              created.characterId,
              "rb_op",
              934,
              undefined,
              undefined,
              tx
            );
            throw new Error("SIMULATED_FAILURE");
          }),
          db.withTransaction(async (tx) => {
            const validChar = await db.loadOrCreateCharacter(
              "acc_valid_2",
              "Đạo Hữu Thành Công",
              "phap_tu",
              tx
            );
            await db.recordIdempotency(
              "req_valid_2",
              validChar.characterId,
              "valid_op",
              {
                requestId: "req_valid_2",
                ok: true,
                code: "OK",
                messageVi: "Đã lưu."
              },
              tx
            );
            return validChar;
          })
        ]);

        expect(res1.status).toBe("rejected");
        if (res1.status === "rejected") {
          expect((res1.reason as Error).message).toBe("SIMULATED_FAILURE");
        }

        expect(res2.status).toBe("fulfilled");

        expect(await db.getCharacterByAccount("acc_rb_1")).toBeNull();
        expect(await db.checkIdempotency("req_rb_1")).toBeNull();

        const validLoaded = await db.getCharacterByAccount("acc_valid_2");
        expect(validLoaded).not.toBeNull();
        expect(validLoaded?.nickname).toBe("Đạo Hữu Thành Công");
        expect(await db.checkIdempotency("req_valid_2")).not.toBeNull();

        await db.withTransaction(async (tx) => {
          const rbAccounts = await tx.query(
            "SELECT account_id FROM accounts WHERE account_id = $1",
            ["acc_rb_1"]
          );
          expect(rbAccounts.rows).toHaveLength(0);

          const rbEconomy = await tx.query(
            "SELECT id FROM economy_audit_log WHERE character_id = $1",
            ["char_acc_rb_1"]
          );
          expect(rbEconomy.rows).toHaveLength(0);
        });
      } finally {
        await db.close();
      }
    },
    15000
  );

  it(
    "T03: preserves ON CONFLICT DO NOTHING in recordIdempotency while rolling back raw 23505 unique constraint violations",
    async () => {
      const db = new GameDatabase({
        dataDir: "memory://",
        connectionString: ""
      });
      expect(db.getDataDir()).toBe("memory://");
      await db.init();

      try {
        const charA = await db.withTransaction(async (tx) => {
          const created = await db.loadOrCreateCharacter(
            "acc_a",
            "Đạo Hữu A",
            "kiem_tu",
            tx
          );
          const firstResult: ActionResultPayload = {
            requestId: "req_idem_noop",
            ok: true,
            code: "FIRST_OK",
            messageVi: "Lần đầu."
          };
          const secondResult: ActionResultPayload = {
            requestId: "req_idem_noop",
            ok: true,
            code: "SECOND_IGNORED",
            messageVi: "Lần hai."
          };
          await db.recordIdempotency(
            "req_idem_noop",
            created.characterId,
            "noop_test",
            firstResult,
            tx
          );
          await db.recordIdempotency(
            "req_idem_noop",
            created.characterId,
            "noop_test",
            secondResult,
            tx
          );
          return created;
        });

        const dupCheck = await db.checkIdempotency("req_idem_noop");
        expect(dupCheck?.requestId).toBe("req_idem_noop");
        expect(dupCheck?.code).toBe("DUPLICATE_REQUEST");

        await expect(
          db.withTransaction(async (tx) => {
            await db.saveCharacterState(
              { ...charA, linhThach: 5555 },
              tx
            );
            await db.recordIdempotency(
              "req_23505",
              charA.characterId,
              "conflict_op",
              {
                requestId: "req_23505",
                ok: true,
                code: "OK",
                messageVi: "Không được lưu."
              },
              tx
            );
            await db.logEconomyEvent(
              charA.characterId,
              "conflict_op",
              5490,
              undefined,
              undefined,
              tx
            );
            await tx.query(
              "INSERT INTO accounts (account_id, created_at) VALUES ($1, $2)",
              ["acc_a", 1]
            );
          })
        ).rejects.toThrow();

        const reloadedA = await db.getCharacterByAccount("acc_a");
        expect(reloadedA?.linhThach).toBe(charA.linhThach);
        expect(await db.checkIdempotency("req_23505")).toBeNull();
      } finally {
        await db.close();
      }
    },
    15000
  );

  it(
    "T04: aborts and rolls back when a failed query is caught and swallowed inside the callback on both PGliteAdapter and PgPoolAdapter",
    async () => {
      const db = new GameDatabase({
        dataDir: "memory://",
        connectionString: ""
      });
      expect(db.getDataDir()).toBe("memory://");
      await db.init();

      try {
        const initial = await db.loadOrCreateCharacter(
          "acc_swallow",
          "Đạo Hữu Swallow",
          "the_tu"
        );

        let caughtError: unknown = null;
        try {
          await db.withTransaction(async (tx) => {
            await db.saveCharacterState(
              { ...initial, linhThach: 888 },
              tx
            );
            try {
              await tx.query("SELECT * FROM nonexistent_table_s1b2");
            } catch {
              return "swallowed";
            }
            return "unreachable";
          });
        } catch (err) {
          caughtError = err;
        }

        expect(caughtError).toBeInstanceOf(TransactionUsageError);
        expect((caughtError as TransactionUsageError).code).toBe(
          "TRANSACTION_ABORTED_BY_QUERY_ERROR"
        );
        expect((caughtError as TransactionUsageError).cause).toBeDefined();

        const afterRollback = await db.getCharacterByAccount("acc_swallow");
        expect(afterRollback?.linhThach).toBe(initial.linhThach);

        const forbiddenControlInputs = [
          "  ROLLBACK ; ",
          "\x2f\x2a note \x2a\x2f COMMIT",
          "SELECT 1; COMMIT;",
          "-- note\nROLLBACK",
          "SELECT 1; ROLLBACK",
          "COMMIT \x2f\x2a trailing \x2a\x2f",
          "(COMMIT)",
          "SAVEPOINT sp_bypass",
          "RELEASE SAVEPOINT sp_bypass"
        ];

        for (const badSql of forbiddenControlInputs) {
          let uncaughtControlErr: unknown = null;
          try {
            await db.withTransaction(async (tx) => {
              await db.saveCharacterState(
                { ...initial, linhThach: 999 },
                tx
              );
              await tx.query(badSql);
              return "unreachable";
            });
          } catch (err) {
            uncaughtControlErr = err;
          }
          expect(uncaughtControlErr).toBeInstanceOf(TransactionUsageError);
          expect((uncaughtControlErr as TransactionUsageError).code).toBe(
            "FORBIDDEN_TRANSACTION_CONTROL_SQL"
          );
          const afterUncaught = await db.getCharacterByAccount("acc_swallow");
          expect(afterUncaught?.linhThach).toBe(initial.linhThach);

          let swallowedControlErr: unknown = null;
          try {
            await db.withTransaction(async (tx) => {
              await db.saveCharacterState(
                { ...initial, linhThach: 999 },
                tx
              );
              try {
                await tx.query(badSql);
              } catch {
                return "caught_control_sql";
              }
              return "ok";
            });
          } catch (err) {
            swallowedControlErr = err;
          }
          expect(swallowedControlErr).toBeInstanceOf(TransactionUsageError);
          expect((swallowedControlErr as TransactionUsageError).code).toBe(
            "TRANSACTION_ABORTED_BY_QUERY_ERROR"
          );
          expect(
            (
              (swallowedControlErr as TransactionUsageError)
                .cause as TransactionUsageError
            ).code
          ).toBe("FORBIDDEN_TRANSACTION_CONTROL_SQL");
          const afterSwallowed = await db.getCharacterByAccount("acc_swallow");
          expect(afterSwallowed?.linhThach).toBe(initial.linhThach);
        }
      } finally {
        await db.close();
      }

      const pgliteDriverQueries: string[] = [];
      let pgliteCommitted = false;
      const mockPgliteDriver: PGliteDriverLike = {
        waitReady: Promise.resolve(),
        async query() {
          return { rows: [] };
        },
        async transaction<T>(
          cb: (tx: PGliteTransactionDriverLike) => Promise<T>
        ): Promise<T> {
          const res = await cb({
            async query<R = Record<string, unknown>>(sql: string) {
              pgliteDriverQueries.push(sql);
              return { rows: [] as R[] };
            }
          });
          pgliteCommitted = true;
          return res;
        },
        async close() {}
      };
      const pgliteGuardAdapter = new PGliteAdapter(
        "memory://",
        mockPgliteDriver
      );
      for (const badSql of [
        "\x2f\x2a note \x2a\x2f COMMIT",
        "SELECT 1; COMMIT;",
        "-- note\nROLLBACK"
      ]) {
        pgliteDriverQueries.length = 0;
        pgliteCommitted = false;
        let pgliteBypassErr: unknown = null;
        try {
          await pgliteGuardAdapter.withTransaction(async (tx) => {
            await tx.query("UPDATE characters SET linh_thach = 777");
            try {
              await tx.query(badSql);
            } catch {
              return "swallowed_pglite_bypass";
            }
            return "ok";
          });
        } catch (err) {
          pgliteBypassErr = err;
        }
        expect(pgliteBypassErr).toBeInstanceOf(TransactionUsageError);
        expect((pgliteBypassErr as TransactionUsageError).code).toBe(
          "TRANSACTION_ABORTED_BY_QUERY_ERROR"
        );
        expect(
          (
            (pgliteBypassErr as TransactionUsageError)
              .cause as TransactionUsageError
          ).code
        ).toBe("FORBIDDEN_TRANSACTION_CONTROL_SQL");
        expect(pgliteDriverQueries).toEqual([
          "UPDATE characters SET linh_thach = 777"
        ]);
        expect(pgliteCommitted).toBe(false);
      }
      await pgliteGuardAdapter.close();

      const executedSql: string[] = [];
      let releaseCount = 0;
      let releaseArg: unknown;
      const mockClient: PgPoolClientLike = {
        async query(sql: string) {
          executedSql.push(sql);
          if (sql === "SELECT * FROM broken_pg_table") {
            throw new Error("PG_SYNTAX_OR_MISSING_TABLE");
          }
          return { rows: [] };
        },
        release(err?: Error | boolean) {
          releaseCount += 1;
          releaseArg = err;
        }
      };
      const mockPool: PgPoolLike = {
        async connect() {
          return mockClient;
        },
        async query() {
          throw new Error("POOL_QUERY_MUST_NOT_BE_USED_IN_TX");
        },
        async end() {}
      };

      const pgAdapter = new PgPoolAdapter(
        "postgresql://mock.local/test",
        mockPool
      );
      let pgCaught: unknown = null;
      try {
        await pgAdapter.withTransaction(async (tx) => {
          await tx.query("UPDATE characters SET linh_thach = 100");
          try {
            await tx.query("SELECT * FROM broken_pg_table");
          } catch {
            return "ignored_in_callback";
          }
          return "ok";
        });
      } catch (err) {
        pgCaught = err;
      }

      expect(pgCaught).toBeInstanceOf(TransactionUsageError);
      expect((pgCaught as TransactionUsageError).code).toBe(
        "TRANSACTION_ABORTED_BY_QUERY_ERROR"
      );
      expect(executedSql).toEqual([
        "BEGIN",
        "UPDATE characters SET linh_thach = 100",
        "SELECT * FROM broken_pg_table",
        "ROLLBACK"
      ]);
      expect(releaseCount).toBe(1);
      expect(releaseArg).toBeUndefined();

      for (const badSql of [
        "\x2f\x2a note \x2a\x2f COMMIT",
        "SELECT 1; COMMIT;",
        "-- note\nROLLBACK"
      ]) {
        executedSql.length = 0;
        releaseCount = 0;
        releaseArg = undefined;
        let pgBypassErr: unknown = null;
        try {
          await pgAdapter.withTransaction(async (tx) => {
            await tx.query("UPDATE characters SET linh_thach = 777");
            try {
              await tx.query(badSql);
            } catch {
              return "swallowed_pg_bypass";
            }
            return "ok";
          });
        } catch (err) {
          pgBypassErr = err;
        }
        expect(pgBypassErr).toBeInstanceOf(TransactionUsageError);
        expect((pgBypassErr as TransactionUsageError).code).toBe(
          "TRANSACTION_ABORTED_BY_QUERY_ERROR"
        );
        expect(
          ((pgBypassErr as TransactionUsageError).cause as TransactionUsageError)
            .code
        ).toBe("FORBIDDEN_TRANSACTION_CONTROL_SQL");
        expect(executedSql).toEqual([
          "BEGIN",
          "UPDATE characters SET linh_thach = 777",
          "ROLLBACK"
        ]);
        expect(releaseCount).toBe(1);
        expect(releaseArg).toBeUndefined();
      }

      await pgAdapter.close();
    },
    15000
  );

  it(
    "T05: rejects nested withTransaction, missing tx, foreign tx, mismatched tx, closed tx, and in-transaction close/init promptly without deadlock",
    async () => {
      const db1 = new GameDatabase({
        dataDir: "memory://",
        connectionString: ""
      });
      const db2 = new GameDatabase({
        dataDir: "memory://",
        connectionString: ""
      });
      expect(db1.getDataDir()).toBe("memory://");
      expect(db2.getDataDir()).toBe("memory://");
      await db1.init();
      await db2.init();

      let leakedTx!: SqlTransaction;

      try {
        await db1.withTransaction(async (tx1) => {
          leakedTx = tx1;

          await expect(
            db1.withTransaction(async () => "nested")
          ).rejects.toMatchObject({
            name: "TransactionUsageError",
            code: "NESTED_TRANSACTION_FORBIDDEN"
          });

          await expect(
            db1.getCharacterByAccount("acc_any")
          ).rejects.toMatchObject({
            name: "TransactionUsageError",
            code: "MISSING_TRANSACTION_RUNNER"
          });

          await expect(
            db1.checkIdempotency("")
          ).rejects.toMatchObject({
            name: "TransactionUsageError",
            code: "MISSING_TRANSACTION_RUNNER"
          });

          await expect(db1.init()).rejects.toMatchObject({
            name: "TransactionUsageError",
            code: "MISSING_TRANSACTION_RUNNER"
          });

          await expect(db1.close()).rejects.toMatchObject({
            name: "TransactionUsageError",
            code: "NESTED_TRANSACTION_FORBIDDEN"
          });

          await expect(
            db2.getCharacterByAccount("acc_any", tx1)
          ).rejects.toMatchObject({
            name: "TransactionUsageError",
            code: "FOREIGN_TRANSACTION_RUNNER"
          });

          await db1.loadOrCreateCharacter(
            "acc_after_guards",
            "Đạo Hữu Guard",
            "kiem_tu",
            tx1
          );
        });

        expect(leakedTx.closed).toBe(true);
        await expect(leakedTx.query("SELECT 1")).rejects.toMatchObject({
          name: "TransactionUsageError",
          code: "TRANSACTION_CLOSED"
        });
        await expect(
          db1.getCharacterByAccount("acc_after_guards", leakedTx)
        ).rejects.toMatchObject({
          name: "TransactionUsageError",
          code: "TRANSACTION_CLOSED"
        });

        let capturedOpenTxA: SqlTransaction | undefined;
        const txAReady = createDeferred<void>();
        const allowTxAToFinish = createDeferred<void>();

        const txAPromise = db1.withTransaction(async (txA) => {
          capturedOpenTxA = txA;
          txAReady.resolve();
          await allowTxAToFinish.promise;
          return "txA_done";
        });

        await txAReady.promise;
        expect(capturedOpenTxA).toBeDefined();

        await expect(
          db1.getCharacterByAccount("acc_after_guards", capturedOpenTxA)
        ).rejects.toMatchObject({
          name: "TransactionUsageError",
          code: "MISMATCHED_TRANSACTION_RUNNER"
        });

        await expect(
          capturedOpenTxA!.query("SELECT 1")
        ).rejects.toMatchObject({
          name: "TransactionUsageError",
          code: "MISMATCHED_TRANSACTION_RUNNER"
        });

        allowTxAToFinish.resolve();
        await expect(txAPromise).resolves.toBe("txA_done");
      } finally {
        await db1.close();
        await db2.close();
      }

      const probeScript = `
        import assert from "node:assert/strict";
        import { GameDatabase } from ${JSON.stringify(DB_MODULE_URL)};

        const db = new GameDatabase({ dataDir: "memory://", connectionString: "" });
        assert.equal(db.getDataDir(), "memory://");
        await db.init();

        await db.withTransaction(async (tx) => {
          await assert.rejects(
            () => db.withTransaction(async () => "nested"),
            (err) => err && err.code === "NESTED_TRANSACTION_FORBIDDEN"
          );
          await assert.rejects(
            () => db.getCharacterByAccount("acc"),
            (err) => err && err.code === "MISSING_TRANSACTION_RUNNER"
          );
          await assert.rejects(
            () => db.close(),
            (err) => err && err.code === "NESTED_TRANSACTION_FORBIDDEN"
          );
          const created = await db.loadOrCreateCharacter("sub_acc", "Sub", "kiem_tu", tx);
          assert.equal(created.accountId, "sub_acc");
        });

        await db.close();
        process.stdout.write("SUBPROCESS_GUARD_OK");
      `;

      const probeResult = await runSupervisedNodeProbe({
        script: probeScript,
        deadlineMs: 15000
      });
      expect(probeResult.timedOut).toBe(false);
      expect(probeResult.exitConfirmed).toBe(true);
      expect(probeResult.exitCode).toBe(0);
      expect(probeResult.stdout).toContain("SUBPROCESS_GUARD_OK");
    },
    25000
  );

  it(
    "T06: drains pending queries at callback exit using a deferred barrier, enforces primary callback error precedence, and produces zero unhandled rejections on both adapters",
    async () => {
      const unhandledRejections: unknown[] = [];
      const onUnhandledRejection = (reason: unknown): void => {
        unhandledRejections.push(reason);
      };
      process.on("unhandledRejection", onUnhandledRejection);

      try {
        for (const adapterKind of ["pglite", "pg"] as const) {
          for (const barrierMode of [
            "resolve",
            "reject",
            "primary_callback_error"
          ] as const) {
            const events: string[] = [];
            const barrier = createDeferred<{ rows: unknown[] }>();
            const queryStarted = createDeferred<void>();
            const callbackExited = createDeferred<void>();
            let lateTxRef!: SqlTransaction;

            const runScenario = async (
              withTx: <T>(fn: (tx: SqlTransaction) => Promise<T>) => Promise<T>
            ): Promise<void> => {
              const txPromise = withTx(async (tx) => {
                lateTxRef = tx;
                events.push("callback:start");
                try {
                  void tx.query("SELECT * FROM barrier_query");
                  await queryStarted.promise;
                  events.push("callback:exit");
                  if (barrierMode === "primary_callback_error") {
                    throw new Error("PRIMARY_CALLBACK_BOOM");
                  }
                  return "callback_value";
                } finally {
                  callbackExited.resolve();
                }
              });

              await callbackExited.promise;
              await Promise.resolve();

              await expect(
                lateTxRef.query("SELECT * FROM post_settle_query")
              ).rejects.toMatchObject({
                name: "TransactionUsageError",
                code: "TRANSACTION_CLOSED"
              });

              expect(events).toEqual([
                "driver:BEGIN",
                "callback:start",
                "driver:query:start",
                "callback:exit"
              ]);

              if (barrierMode === "resolve") {
                barrier.resolve({ rows: [{ ok: 1 }] });
              } else if (barrierMode === "reject") {
                barrier.reject(new Error("PENDING_BARRIER_REJECTED"));
              } else {
                barrier.reject(new Error("SECONDARY_BARRIER_ERROR"));
              }

              let txError: unknown = null;
              try {
                await txPromise;
              } catch (err) {
                txError = err;
              }

              expect(txError).not.toBeNull();
              if (barrierMode === "primary_callback_error") {
                expect((txError as Error).message).toBe("PRIMARY_CALLBACK_BOOM");
              } else {
                expect(txError).toBeInstanceOf(TransactionUsageError);
                expect((txError as TransactionUsageError).code).toBe(
                  "UNWAITED_TRANSACTION_QUERY"
                );
                if (barrierMode === "reject") {
                  expect(
                    ((txError as TransactionUsageError).cause as Error).message
                  ).toBe("PENDING_BARRIER_REJECTED");
                }
              }

              expect(events).toEqual([
                "driver:BEGIN",
                "callback:start",
                "driver:query:start",
                "callback:exit",
                "driver:query:settled",
                "driver:ROLLBACK",
                "driver:release_or_finish"
              ]);
            };

            if (adapterKind === "pglite") {
              const mockDriver: PGliteDriverLike = {
                async query() {
                  return { rows: [] };
                },
                async transaction<T>(
                  cb: (tx: PGliteTransactionDriverLike) => Promise<T>
                ): Promise<T> {
                  events.push("driver:BEGIN");
                  const txDriver: PGliteTransactionDriverLike = {
                    async query<R = Record<string, unknown>>() {
                      events.push("driver:query:start");
                      queryStarted.resolve();
                      try {
                        const res = await barrier.promise;
                        return { rows: res.rows as R[] };
                      } finally {
                        events.push("driver:query:settled");
                      }
                    }
                  };
                  try {
                    const out = await cb(txDriver);
                    events.push("driver:COMMIT");
                    events.push("driver:release_or_finish");
                    return out;
                  } catch (err) {
                    events.push("driver:ROLLBACK");
                    events.push("driver:release_or_finish");
                    throw err;
                  }
                },
                async close() {}
              };
              const adapter = new PGliteAdapter("memory://", mockDriver);
              await runScenario((fn) => adapter.withTransaction(fn));
              await adapter.close();
            } else {
              const mockClient: PgPoolClientLike = {
                async query(sql: string) {
                  if (sql === "BEGIN") {
                    events.push("driver:BEGIN");
                    return { rows: [] };
                  }
                  if (sql === "ROLLBACK") {
                    events.push("driver:ROLLBACK");
                    return { rows: [] };
                  }
                  if (sql === "COMMIT") {
                    events.push("driver:COMMIT");
                    return { rows: [] };
                  }
                  events.push("driver:query:start");
                  queryStarted.resolve();
                  try {
                    return await barrier.promise;
                  } finally {
                    events.push("driver:query:settled");
                  }
                },
                release() {
                  events.push("driver:release_or_finish");
                }
              };
              const mockPool: PgPoolLike = {
                async connect() {
                  return mockClient;
                },
                async query() {
                  throw new Error("UNEXPECTED_POOL_QUERY");
                },
                async end() {}
              };
              const adapter = new PgPoolAdapter(
                "postgresql://mock.local/test",
                mockPool
              );
              await runScenario((fn) => adapter.withTransaction(fn));
              await adapter.close();
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 25));
        expect(unhandledRejections).toEqual([]);
      } finally {
        process.off("unhandledRejection", onUnhandledRejection);
      }
    },
    15000
  );

  it(
    "T07: persists committed transactions across file-backed PGlite close/reopen and blocks DATABASE_URL leaks before any pg network call",
    async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d-s1b2-"));

      const connectSpy = vi
        .spyOn(pg.Pool.prototype, "connect")
        .mockImplementation(() => {
          throw new Error("FORBIDDEN_PG_POOL_CONNECT_ATTEMPT");
        });
      const querySpy = vi
        .spyOn(pg.Pool.prototype, "query")
        .mockImplementation(() => {
          throw new Error("FORBIDDEN_PG_POOL_QUERY_ATTEMPT");
        });

      const previousDatabaseUrl = process.env.DATABASE_URL;

      try {
        process.env.DATABASE_URL =
          "postgresql://invalid.local:1/forbid_external_pg";
        const inProcCheckDb = new GameDatabase({
          dataDir: "memory://",
          connectionString: ""
        });
        expect(inProcCheckDb.getDataDir()).toBe("memory://");
        await inProcCheckDb.close();
        expect(connectSpy).not.toHaveBeenCalled();
        expect(querySpy).not.toHaveBeenCalled();
      } finally {
        if (previousDatabaseUrl === undefined) {
          delete process.env.DATABASE_URL;
        } else {
          process.env.DATABASE_URL = previousDatabaseUrl;
        }
        connectSpy.mockRestore();
        querySpy.mockRestore();
      }

      const durabilityScript = `
        import assert from "node:assert/strict";
        import pg from "pg";
        import { GameDatabase } from ${JSON.stringify(DB_MODULE_URL)};

        const targetDir = process.env.TEST_TMP_PGDATA_DIR;
        assert.ok(targetDir && targetDir.length > 0);

        const originalDbUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = "postgresql://invalid.local:1/forbid_external_pg";

        let pgTouched = 0;
        pg.Pool.prototype.connect = async function () {
          pgTouched += 1;
          throw new Error("FORBIDDEN_SUBPROCESS_PG_CONNECT");
        };
        pg.Pool.prototype.query = async function () {
          pgTouched += 1;
          throw new Error("FORBIDDEN_SUBPROCESS_PG_QUERY");
        };

        try {
          const db1 = new GameDatabase({
            dataDir: targetDir,
            connectionString: ""
          });
          assert.equal(db1.getDataDir(), targetDir);
          await db1.init();

          await db1.withTransaction(async (tx) => {
            const created = await db1.loadOrCreateCharacter(
              "acc_durable",
              "Đạo Hữu Bền Vững",
              "kiem_tu",
              tx
            );
            await db1.saveCharacterState(
              { ...created, linhThach: 777 },
              tx
            );
            await db1.recordIdempotency(
              "req_durable_ok",
              created.characterId,
              "durable_op",
              {
                requestId: "req_durable_ok",
                ok: true,
                code: "OK",
                messageVi: "Đã lưu bền vững."
              },
              tx
            );
          });

          await assert.rejects(
            () =>
              db1.withTransaction(async (tx) => {
                const current = await db1.getCharacterByAccount("acc_durable", tx);
                assert.ok(current);
                await db1.saveCharacterState(
                  { ...current, linhThach: 111 },
                  tx
                );
                await db1.recordIdempotency(
                  "req_durable_rb",
                  current.characterId,
                  "durable_rb",
                  {
                    requestId: "req_durable_rb",
                    ok: true,
                    code: "OK",
                    messageVi: "Rollback."
                  },
                  tx
                );
                throw new Error("ROLLBACK_DURABLE_TEST");
              }),
            /ROLLBACK_DURABLE_TEST/
          );

          await db1.close();

          const db2 = new GameDatabase({
            dataDir: targetDir,
            connectionString: ""
          });
          assert.equal(db2.getDataDir(), targetDir);
          await db2.init();

          const reopened = await db2.getCharacterByAccount("acc_durable");
          assert.ok(reopened);
          assert.equal(reopened.linhThach, 777);

          const committedIdem = await db2.checkIdempotency("req_durable_ok");
          assert.ok(committedIdem);
          assert.equal(committedIdem.code, "DUPLICATE_REQUEST");

          const rolledBackIdem = await db2.checkIdempotency("req_durable_rb");
          assert.equal(rolledBackIdem, null);

          await db2.close();
          assert.equal(pgTouched, 0);
        } finally {
          if (originalDbUrl === undefined) {
            delete process.env.DATABASE_URL;
          } else {
            process.env.DATABASE_URL = originalDbUrl;
          }
        }

        process.stdout.write("DURABLE_PGLITE_OK");
      `;

      const probeResult = await runTempDirGuardedProbe({
        tmpDir,
        script: durabilityScript,
        deadlineMs: 15000
      });

      expect(probeResult.spawnFailed).toBe(false);
      expect(probeResult.timedOut).toBe(false);
      expect(probeResult.exitConfirmed).toBe(true);
      expect(probeResult.closeObserved).toBe(true);
      expect(probeResult.exitCode).toBe(0);
      expect(probeResult.stdout).toContain("DURABLE_PGLITE_OK");
      expect(fs.existsSync(tmpDir)).toBe(false);

      interface FakeChildHarness {
        child: SupervisedProbeChildLike;
        emitter: EventEmitter;
        stdoutEmitter: EventEmitter;
        stderrEmitter: EventEmitter;
        killCalls: Array<NodeJS.Signals | number | undefined>;
        assertZeroListeners: () => void;
      }

      const createFakeChildHarness = (options?: {
        pid?: number;
        onKill?: (
          emitter: EventEmitter,
          stdoutEmitter: EventEmitter,
          stderrEmitter: EventEmitter
        ) => boolean;
      }): FakeChildHarness => {
        const emitter = new EventEmitter();
        const stdoutEmitter = new EventEmitter();
        const stderrEmitter = new EventEmitter();
        const killCalls: Array<NodeJS.Signals | number | undefined> = [];

        const child: SupervisedProbeChildLike = {
          pid: options?.pid,
          exitCode: null,
          signalCode: null,
          stdout: {
            on: (ev, fn) => stdoutEmitter.on(ev, fn),
            off: (ev, fn) => stdoutEmitter.off(ev, fn)
          },
          stderr: {
            on: (ev, fn) => stderrEmitter.on(ev, fn),
            off: (ev, fn) => stderrEmitter.off(ev, fn)
          },
          on: (ev, fn) => emitter.on(ev, fn),
          once: (ev, fn) => emitter.once(ev, fn as (...args: unknown[]) => void),
          off: (ev, fn) => emitter.off(ev, fn as (...args: unknown[]) => void),
          kill: (sig) => {
            killCalls.push(sig);
            if (options?.onKill) {
              return options.onKill(emitter, stdoutEmitter, stderrEmitter);
            }
            return true;
          }
        };

        return {
          child,
          emitter,
          stdoutEmitter,
          stderrEmitter,
          killCalls,
          assertZeroListeners: () => {
            expect(emitter.listenerCount("spawn")).toBe(0);
            expect(emitter.listenerCount("exit")).toBe(0);
            expect(emitter.listenerCount("close")).toBe(0);
            expect(emitter.listenerCount("error")).toBe(0);
            expect(stdoutEmitter.listenerCount("data")).toBe(0);
            expect(stderrEmitter.listenerCount("data")).toBe(0);
          }
        };
      };

      const uncertainErrTmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "tm8d-s1b2-uncertain-err-")
      );
      try {
        let postSpawnHarness!: FakeChildHarness;
        await expect(
          runTempDirGuardedProbe({
            tmpDir: uncertainErrTmpDir,
            script: "",
            deadlineMs: 25,
            killConfirmMs: 25,
            closeFallbackMs: 20,
            spawnChild: () => {
              postSpawnHarness = createFakeChildHarness({
                pid: 41001,
                onKill: (em) => {
                  em.emit("error", new Error("KILL_EPERM_AFTER_SPAWN"));
                  return false;
                }
              });
              queueMicrotask(() => {
                postSpawnHarness.emitter.emit("spawn");
                postSpawnHarness.emitter.emit(
                  "error",
                  new Error("POST_SPAWN_CHANNEL_ERR")
                );
              });
              return postSpawnHarness.child;
            }
          })
        ).rejects.toThrow(uncertainErrTmpDir);

        expect(fs.existsSync(uncertainErrTmpDir)).toBe(true);
        postSpawnHarness.assertZeroListeners();

        const directPostSpawnRes = await runSupervisedNodeProbe({
          script: "",
          deadlineMs: 25,
          killConfirmMs: 25,
          closeFallbackMs: 20,
          spawnChild: () => {
            const h = createFakeChildHarness({
              pid: 41011,
              onKill: () => false
            });
            queueMicrotask(() => {
              h.emitter.emit("spawn");
              h.emitter.emit("error", new Error("POST_SPAWN_NO_EXIT"));
            });
            return h.child;
          }
        });
        expect(directPostSpawnRes.spawnFailed).toBe(false);
        expect(directPostSpawnRes.exitConfirmed).toBe(false);
        expect(directPostSpawnRes.closeObserved).toBe(false);
        expect(directPostSpawnRes.timedOut).toBe(true);
        expect(directPostSpawnRes.exitCode).toBeNull();
        expect(directPostSpawnRes.stderr).toContain(
          "POST_SPAWN_ERROR: POST_SPAWN_NO_EXIT"
        );
        expect(directPostSpawnRes.stderr).not.toMatch(/(?:^|\n)SPAWN_ERROR:/);
      } finally {
        if (fs.existsSync(uncertainErrTmpDir)) {
          fs.rmSync(uncertainErrTmpDir, { recursive: true, force: true });
        }
      }

      let exitThenCloseHarness!: FakeChildHarness;
      const exitThenCloseRes = await runSupervisedNodeProbe({
        script: "",
        deadlineMs: 500,
        killConfirmMs: 100,
        closeFallbackMs: 200,
        spawnChild: () => {
          exitThenCloseHarness = createFakeChildHarness({ pid: 41002 });
          queueMicrotask(() => {
            exitThenCloseHarness.emitter.emit("spawn");
            exitThenCloseHarness.stdoutEmitter.emit(
              "data",
              Buffer.from("STDOUT_BEFORE_EXIT|")
            );
            exitThenCloseHarness.emitter.emit("exit", 0, null);
            setTimeout(() => {
              exitThenCloseHarness.stdoutEmitter.emit(
                "data",
                Buffer.from("STDOUT_AFTER_EXIT")
              );
              exitThenCloseHarness.stderrEmitter.emit(
                "data",
                Buffer.from("STDERR_AFTER_EXIT")
              );
              exitThenCloseHarness.emitter.emit("close", 0, null);
            }, 15);
          });
          return exitThenCloseHarness.child;
        }
      });
      expect(exitThenCloseRes.spawnFailed).toBe(false);
      expect(exitThenCloseRes.timedOut).toBe(false);
      expect(exitThenCloseRes.exitConfirmed).toBe(true);
      expect(exitThenCloseRes.closeObserved).toBe(true);
      expect(exitThenCloseRes.exitCode).toBe(0);
      expect(exitThenCloseRes.stdout).toBe(
        "STDOUT_BEFORE_EXIT|STDOUT_AFTER_EXIT"
      );
      expect(exitThenCloseRes.stderr).toBe("STDERR_AFTER_EXIT");
      exitThenCloseHarness.assertZeroListeners();

      let exitFallbackHarness!: FakeChildHarness;
      const exitFallbackRes = await runSupervisedNodeProbe({
        script: "",
        deadlineMs: 500,
        killConfirmMs: 100,
        closeFallbackMs: 25,
        spawnChild: () => {
          exitFallbackHarness = createFakeChildHarness({ pid: 41003 });
          queueMicrotask(() => {
            exitFallbackHarness.emitter.emit("spawn");
            exitFallbackHarness.stdoutEmitter.emit(
              "data",
              Buffer.from("FALLBACK_STDOUT")
            );
            exitFallbackHarness.emitter.emit("exit", 0, null);
          });
          return exitFallbackHarness.child;
        }
      });
      expect(exitFallbackRes.spawnFailed).toBe(false);
      expect(exitFallbackRes.timedOut).toBe(false);
      expect(exitFallbackRes.exitConfirmed).toBe(true);
      expect(exitFallbackRes.closeObserved).toBe(false);
      expect(exitFallbackRes.exitCode).toBe(0);
      expect(exitFallbackRes.stdout).toBe("FALLBACK_STDOUT");
      exitFallbackHarness.assertZeroListeners();

      let failedSpawnHarness!: FakeChildHarness;
      const failedSpawnRes = await runSupervisedNodeProbe({
        script: "",
        deadlineMs: 500,
        killConfirmMs: 100,
        closeFallbackMs: 30,
        spawnChild: () => {
          failedSpawnHarness = createFakeChildHarness({ pid: undefined });
          queueMicrotask(() => {
            failedSpawnHarness.emitter.emit(
              "error",
              new Error("spawn ENOENT_NO_PROCESS")
            );
            failedSpawnHarness.emitter.emit("close", -4058, null);
          });
          return failedSpawnHarness.child;
        }
      });
      expect(failedSpawnRes.spawnFailed).toBe(true);
      expect(failedSpawnRes.exitConfirmed).toBe(false);
      expect(failedSpawnRes.timedOut).toBe(false);
      expect(failedSpawnRes.exitCode).toBeNull();
      expect(failedSpawnRes.stderr).toContain(
        "SPAWN_ERROR: spawn ENOENT_NO_PROCESS"
      );
      expect(failedSpawnRes.stderr).not.toContain("POST_SPAWN_ERROR:");
      failedSpawnHarness.assertZeroListeners();

      const confirmedTimeoutTmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "tm8d-s1b2-confirmed-timeout-")
      );
      let confirmedTimeoutHarness!: FakeChildHarness;
      await expect(
        runTempDirGuardedProbe({
          tmpDir: confirmedTimeoutTmpDir,
          script: "",
          deadlineMs: 25,
          killConfirmMs: 200,
          closeFallbackMs: 30,
          spawnChild: () => {
            confirmedTimeoutHarness = createFakeChildHarness({
              pid: 41004,
              onKill: (em, outEm) => {
                outEm.emit("data", Buffer.from("KILLED_OUTPUT"));
                em.emit("exit", null, "SIGTERM");
                em.emit("close", null, "SIGTERM");
                return true;
              }
            });
            queueMicrotask(() => {
              confirmedTimeoutHarness.emitter.emit("spawn");
            });
            return confirmedTimeoutHarness.child;
          }
        })
      ).rejects.toThrow("Subprocess exited abnormally after confirmed termination");
      expect(fs.existsSync(confirmedTimeoutTmpDir)).toBe(false);
      expect(confirmedTimeoutHarness.killCalls).toHaveLength(1);
      confirmedTimeoutHarness.assertZeroListeners();

      const directConfirmedTimeoutRes = await runSupervisedNodeProbe({
        script: "",
        deadlineMs: 25,
        killConfirmMs: 200,
        closeFallbackMs: 30,
        spawnChild: () => {
          const h = createFakeChildHarness({
            pid: 41014,
            onKill: (em) => {
              em.emit("exit", null, "SIGTERM");
              em.emit("close", null, "SIGTERM");
              return true;
            }
          });
          queueMicrotask(() => {
            h.emitter.emit("spawn");
          });
          return h.child;
        }
      });
      expect(directConfirmedTimeoutRes.spawnFailed).toBe(false);
      expect(directConfirmedTimeoutRes.timedOut).toBe(true);
      expect(directConfirmedTimeoutRes.exitConfirmed).toBe(true);
      expect(directConfirmedTimeoutRes.closeObserved).toBe(true);
      expect(directConfirmedTimeoutRes.signal).toBe("SIGTERM");
      expect(directConfirmedTimeoutRes.exitCode).toBeNull();

      const uncertainTimeoutTmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "tm8d-s1b2-uncertain-timeout-")
      );
      try {
        let unconfirmedTimeoutHarness!: FakeChildHarness;
        await expect(
          runTempDirGuardedProbe({
            tmpDir: uncertainTimeoutTmpDir,
            script: "",
            deadlineMs: 25,
            killConfirmMs: 25,
            closeFallbackMs: 20,
            spawnChild: () => {
              unconfirmedTimeoutHarness = createFakeChildHarness({
                pid: 41005,
                onKill: () => {
                  throw new Error("KILL_ACCESS_DENIED");
                }
              });
              queueMicrotask(() => {
                unconfirmedTimeoutHarness.emitter.emit("spawn");
              });
              return unconfirmedTimeoutHarness.child;
            }
          })
        ).rejects.toThrow(uncertainTimeoutTmpDir);

        expect(fs.existsSync(uncertainTimeoutTmpDir)).toBe(true);
        expect(unconfirmedTimeoutHarness.killCalls).toHaveLength(1);
        unconfirmedTimeoutHarness.assertZeroListeners();

        const directUnconfirmedTimeoutRes = await runSupervisedNodeProbe({
          script: "",
          deadlineMs: 25,
          killConfirmMs: 25,
          closeFallbackMs: 20,
          spawnChild: () => {
            const h = createFakeChildHarness({
              pid: 41015,
              onKill: () => {
                throw new Error("KILL_THROW_UNCONFIRMED");
              }
            });
            queueMicrotask(() => {
              h.emitter.emit("spawn");
            });
            return h.child;
          }
        });
        expect(directUnconfirmedTimeoutRes.spawnFailed).toBe(false);
        expect(directUnconfirmedTimeoutRes.timedOut).toBe(true);
        expect(directUnconfirmedTimeoutRes.exitConfirmed).toBe(false);
        expect(directUnconfirmedTimeoutRes.closeObserved).toBe(false);
        expect(directUnconfirmedTimeoutRes.exitCode).toBeNull();
        expect(directUnconfirmedTimeoutRes.stderr).toContain(
          "KILL_ERROR: KILL_THROW_UNCONFIRMED"
        );
      } finally {
        if (fs.existsSync(uncertainTimeoutTmpDir)) {
          fs.rmSync(uncertainTimeoutTmpDir, { recursive: true, force: true });
        }
      }
    },
    25000
  );

  it(
    "T08: enforces PgPoolAdapter single-client checkout, acquisition failure, statement order, broken-client disposal, and external close ordering",
    async () => {
      const acquireErr = new Error("POOL_CONNECT_FAILED");
      const failingConnectPool: PgPoolLike = {
        async connect() {
          throw acquireErr;
        },
        async query() {
          throw new Error("UNEXPECTED_POOL_QUERY");
        },
        async end() {}
      };
      const failingConnectAdapter = new PgPoolAdapter(
        "postgresql://mock.local/fail",
        failingConnectPool
      );
      await expect(
        failingConnectAdapter.withTransaction(async () => "never")
      ).rejects.toBe(acquireErr);
      await failingConnectAdapter.close();

      const runPoolScenario = async (mode: "commit" | "begin_fail" | "commit_fail" | "rollback_fail") => {
        const sqlLog: string[] = [];
        const releaseCalls: Array<Error | boolean | undefined> = [];
        let poolQueryCalls = 0;
        let leakedRunner: SqlTransaction | undefined;

        const client: PgPoolClientLike = {
          async query(sql: string) {
            sqlLog.push(sql);
            if (mode === "begin_fail" && sql === "BEGIN") {
              throw new Error("BEGIN_WIRE_ERROR");
            }
            if (mode === "commit_fail" && sql === "COMMIT") {
              throw new Error("COMMIT_WIRE_ERROR");
            }
            if (mode === "rollback_fail" && sql === "ROLLBACK") {
              throw new Error("ROLLBACK_WIRE_ERROR");
            }
            return { rows: [{ ok: 1 }] };
          },
          release(err?: Error | boolean) {
            releaseCalls.push(err);
          }
        };

        const pool: PgPoolLike = {
          async connect() {
            return client;
          },
          async query() {
            poolQueryCalls += 1;
            return { rows: [] };
          },
          async end() {}
        };

        const adapter = new PgPoolAdapter("postgresql://mock.local/test", pool);
        let outcomeError: unknown = null;
        let outcomeValue: unknown = null;

        try {
          outcomeValue = await adapter.withTransaction(async (tx) => {
            leakedRunner = tx;
            await tx.query("SELECT 1");
            if (mode === "rollback_fail") {
              throw new Error("PRIMARY_TX_ERROR");
            }
            return "tx_success";
          });
        } catch (err) {
          outcomeError = err;
        }

        expect(poolQueryCalls).toBe(0);
        expect(releaseCalls).toHaveLength(1);

        if (leakedRunner) {
          await expect(leakedRunner.query("SELECT 2")).rejects.toMatchObject({
            name: "TransactionUsageError",
            code: "TRANSACTION_CLOSED"
          });
        }

        await adapter.close();
        return { sqlLog, releaseCalls, outcomeError, outcomeValue };
      };

      const commitRes = await runPoolScenario("commit");
      expect(commitRes.outcomeError).toBeNull();
      expect(commitRes.outcomeValue).toBe("tx_success");
      expect(commitRes.sqlLog).toEqual(["BEGIN", "SELECT 1", "COMMIT"]);
      expect(commitRes.releaseCalls[0]).toBeUndefined();

      const beginFailRes = await runPoolScenario("begin_fail");
      expect((beginFailRes.outcomeError as Error).message).toBe("BEGIN_WIRE_ERROR");
      expect(beginFailRes.sqlLog).toEqual(["BEGIN"]);
      expect((beginFailRes.releaseCalls[0] as Error).message).toBe(
        "BEGIN_WIRE_ERROR"
      );

      const commitFailRes = await runPoolScenario("commit_fail");
      expect((commitFailRes.outcomeError as Error).message).toBe(
        "COMMIT_WIRE_ERROR"
      );
      expect(commitFailRes.sqlLog).toEqual(["BEGIN", "SELECT 1", "COMMIT"]);
      expect((commitFailRes.releaseCalls[0] as Error).message).toBe(
        "COMMIT_WIRE_ERROR"
      );

      const rbFailRes = await runPoolScenario("rollback_fail");
      expect(rbFailRes.outcomeError).toBeInstanceOf(AggregateError);
      const agg = rbFailRes.outcomeError as AggregateError;
      expect((agg.errors[0] as Error).message).toBe("PRIMARY_TX_ERROR");
      expect((agg.errors[1] as Error).message).toBe("ROLLBACK_WIRE_ERROR");
      expect((agg.cause as Error).message).toBe("PRIMARY_TX_ERROR");
      expect(rbFailRes.sqlLog).toEqual(["BEGIN", "SELECT 1", "ROLLBACK"]);
      expect((rbFailRes.releaseCalls[0] as Error).message).toBe(
        "ROLLBACK_WIRE_ERROR"
      );

      const closeEvents: string[] = [];
      const inFlightGate = createDeferred<void>();
      const txEntered = createDeferred<void>();
      let endCalls = 0;

      const closePool: PgPoolLike = {
        async connect() {
          return {
            async query(sql: string) {
              closeEvents.push(`client:${sql}`);
              return { rows: [] };
            },
            release() {
              closeEvents.push("client:release");
            }
          };
        },
        async query() {
          closeEvents.push("pool:query");
          return { rows: [] };
        },
        async end() {
          endCalls += 1;
          closeEvents.push("pool:end");
        }
      };

      const closingAdapter = new PgPoolAdapter(
        "postgresql://mock.local/close",
        closePool
      );
      const activeTxPromise = closingAdapter.withTransaction(async (tx) => {
        await tx.query("SELECT 1");
        txEntered.resolve();
        await inFlightGate.promise;
        return "finished_before_end";
      });

      await txEntered.promise;

      const closeP1 = closingAdapter.close();
      const closeP2 = closingAdapter.close();
      expect(closeP1).toBe(closeP2);

      await expect(closingAdapter.query("SELECT 2")).rejects.toMatchObject({
        name: "TransactionUsageError",
        code: "DATABASE_CLOSING"
      });

      inFlightGate.resolve();
      await expect(activeTxPromise).resolves.toBe("finished_before_end");
      await closeP1;

      expect(endCalls).toBe(1);
      expect(closeEvents).toEqual([
        "client:BEGIN",
        "client:SELECT 1",
        "client:COMMIT",
        "client:release",
        "pool:end"
      ]);

      await expect(closingAdapter.query("SELECT 3")).rejects.toMatchObject({
        name: "TransactionUsageError",
        code: "DATABASE_CLOSED"
      });
    },
    15000
  );

  it(
    "T09: serializes concurrent PGlite operations and poisons the queue before dequeuing waiting work on terminal BEGIN/COMMIT/ROLLBACK failures",
    async () => {
      const db = new GameDatabase({
        dataDir: "memory://",
        connectionString: ""
      });
      expect(db.getDataDir()).toBe("memory://");
      await db.init();

      try {
        const [charA, charB] = await Promise.all([
          db.withTransaction((tx) =>
            db.loadOrCreateCharacter("acc_conc_a", "Đạo Hữu A", "kiem_tu", tx)
          ),
          db.withTransaction((tx) =>
            db.loadOrCreateCharacter("acc_conc_b", "Đạo Hữu B", "phap_tu", tx)
          )
        ]);
        expect(charA.accountId).toBe("acc_conc_a");
        expect(charB.accountId).toBe("acc_conc_b");

        const [updatedA, concurrentReadB] = await Promise.all([
          db.withTransaction(async (tx) => {
            const nextA = { ...charA, linhThach: 321 };
            await db.saveCharacterState(nextA, tx);
            return nextA;
          }),
          db.getCharacterByAccount("acc_conc_b")
        ]);
        expect(updatedA.linhThach).toBe(321);
        expect(concurrentReadB?.accountId).toBe("acc_conc_b");
        expect((await db.getCharacterByAccount("acc_conc_a"))?.linhThach).toBe(
          321
        );
      } finally {
        await db.close();
      }

      for (const faultMode of [
        "begin_fault",
        "commit_fault",
        "rollback_fault"
      ] as const) {
        const faultBarrier = createDeferred<void>();
        const insideTx = createDeferred<void>();
        let driverQueryCount = 0;
        let driverTxCount = 0;
        let driverCloseCount = 0;

        const mockPglite: PGliteDriverLike = {
          async query() {
            driverQueryCount += 1;
            return { rows: [] };
          },
          async transaction<T>(
            cb: (tx: PGliteTransactionDriverLike) => Promise<T>
          ): Promise<T> {
            driverTxCount += 1;
            if (faultMode === "begin_fault") {
              insideTx.resolve();
              await faultBarrier.promise;
              throw new Error("NATIVE_BEGIN_FAULT");
            }
            const txDriver: PGliteTransactionDriverLike = {
              async query<R = Record<string, unknown>>() {
                return { rows: [] as R[] };
              }
            };
            try {
              insideTx.resolve();
              await faultBarrier.promise;
              const val = await cb(txDriver);
              if (faultMode === "commit_fault") {
                throw new Error("NATIVE_COMMIT_FAULT");
              }
              return val;
            } catch (err) {
              if (faultMode === "rollback_fault") {
                throw new Error("NATIVE_ROLLBACK_FAULT");
              }
              throw err;
            }
          },
          async close() {
            driverCloseCount += 1;
            if (faultMode === "rollback_fault") {
              throw new Error("SECONDARY_CLOSE_FAULT");
            }
          }
        };

        const adapter = new PGliteAdapter("memory://", mockPglite);

        const firstTx = adapter.withTransaction(async (tx) => {
          await tx.query("SELECT 1");
          if (faultMode === "rollback_fault") {
            throw new Error("ORIGINAL_CALLBACK_FAULT");
          }
          return "ok";
        });

        await insideTx.promise;

        const queuedQuery = adapter.query("SELECT 2");
        const queuedSecondTx = adapter.withTransaction(async () => "second");

        faultBarrier.resolve();

        let firstErr: unknown = null;
        try {
          await firstTx;
        } catch (err) {
          firstErr = err;
        }

        expect(firstErr).not.toBeNull();
        if (faultMode === "begin_fault") {
          expect((firstErr as Error).message).toBe("NATIVE_BEGIN_FAULT");
        } else if (faultMode === "commit_fault") {
          expect((firstErr as Error).message).toBe("NATIVE_COMMIT_FAULT");
        } else {
          expect(firstErr).toBeInstanceOf(AggregateError);
          const agg = firstErr as AggregateError;
          expect((agg.errors[0] as Error).message).toBe(
            "ORIGINAL_CALLBACK_FAULT"
          );
          expect((agg.errors[1] as Error).message).toBe(
            "NATIVE_ROLLBACK_FAULT"
          );
          expect((agg.cause as Error).message).toBe("ORIGINAL_CALLBACK_FAULT");
        }

        await expect(queuedQuery).rejects.toMatchObject({
          name: "TransactionUsageError",
          code: "ADAPTER_POISONED"
        });
        await expect(queuedSecondTx).rejects.toMatchObject({
          name: "TransactionUsageError",
          code: "ADAPTER_POISONED"
        });

        expect(driverQueryCount).toBe(0);
        expect(driverTxCount).toBe(1);

        const closeP1 = adapter.close();
        const closeP2 = adapter.close();
        expect(closeP1).toBe(closeP2);
        await closeP1;
        expect(driverCloseCount).toBe(1);

        let postCloseErr: unknown = null;
        try {
          await adapter.query("SELECT 3");
        } catch (err) {
          postCloseErr = err;
        }
        expect(postCloseErr).toBeInstanceOf(TransactionUsageError);
        expect((postCloseErr as TransactionUsageError).code).toBe(
          "ADAPTER_POISONED"
        );
        if (faultMode === "rollback_fault") {
          const postCause = (postCloseErr as TransactionUsageError)
            .cause as AggregateError;
          expect(postCause).toBeInstanceOf(AggregateError);
          expect((postCause.errors[1] as Error).message).toBe(
            "SECONDARY_CLOSE_FAULT"
          );
        }
      }
    },
    15000
  );

  it(
    "T10: does not delete _fsm/_vm files or execute hidden WAL/VACUUM/CHECKPOINT recovery queries on file-backed open, query, or transaction",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "tm8d-pglite-no-autorepair-")
      );
      try {
        fs.mkdirSync(path.join(tmpDir, "base", "1"), { recursive: true });
        fs.mkdirSync(path.join(tmpDir, "global"), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, "PG_VERSION"), "16\n", "utf-8");
        const fsmFile = path.join(tmpDir, "base", "1", "12345_fsm");
        const vmFile = path.join(tmpDir, "global", "1262_vm");
        fs.writeFileSync(fsmFile, Buffer.alloc(16, 1));
        fs.writeFileSync(vmFile, Buffer.alloc(16, 2));

        const executedQueries: string[] = [];
        const mockDriver: PGliteDriverLike = {
          waitReady: Promise.resolve(),
          async query<T = Record<string, unknown>>(sql: string) {
            executedQueries.push(sql);
            return { rows: [] as T[] };
          },
          async transaction<T>(
            cb: (tx: PGliteTransactionDriverLike) => Promise<T>
          ): Promise<T> {
            return cb({
              async query<R = Record<string, unknown>>(sql: string) {
                executedQueries.push(`tx:${sql}`);
                return { rows: [] as R[] };
              }
            });
          },
          async close() {}
        };

        const adapter = new PGliteAdapter(tmpDir, mockDriver);
        await adapter.query("SELECT 1");
        await adapter.withTransaction(async (tx) => {
          await tx.query("SELECT 2");
        });
        await adapter.close();

        expect(fs.existsSync(fsmFile)).toBe(true);
        expect(fs.existsSync(vmFile)).toBe(true);
        expect(executedQueries).toEqual(["SELECT 1", "tx:SELECT 2"]);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    },
    15000
  );
});
