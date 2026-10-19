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

export interface CharacterV02RepositoryHost {
  resolveQueryRunner(tx?: SqlTransaction): SqlQueryRunner;
  withTransaction<T>(fn: (tx: SqlTransaction) => Promise<T>): Promise<T>;
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
