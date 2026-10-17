import crypto from "node:crypto";
import type { CharacterV02RepositoryHost } from "./characterV02Repository.js";
import type { SqlQueryRunner, SqlTransaction } from "./db.js";

export const GUEST_CREDENTIALS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS guest_credentials (
    account_id TEXT PRIMARY KEY REFERENCES accounts(account_id),
    credential_secret_hash TEXT NOT NULL,
    created_at_ms BIGINT NOT NULL CHECK (created_at_ms > 0),
    last_used_at_ms BIGINT NOT NULL CHECK (last_used_at_ms > 0)
  );
`;

export type GuestIdentityErrorCode =
  | "INVALID_GUEST_CREDENTIAL"
  | "UNAUTHENTICATED_V02_SESSION"
  | "SESSION_SUPERSEDED"
  | "INVALID_SESSION_ID";

export class GuestIdentityError extends Error {
  readonly code: GuestIdentityErrorCode;

  constructor(code: GuestIdentityErrorCode, message: string) {
    super(message);
    this.name = "GuestIdentityError";
    this.code = code;
  }
}

export interface IssuedGuestCredential {
  accountId: string;
  guestToken: string;
  createdAtMs: number;
}

export interface VerifiedGuestSession {
  sessionId: string;
  accountId: string;
  verifiedAtMs: number;
}

export type VerifyGuestTokenResult =
  | {
      ok: true;
      accountId: string;
    }
  | {
      ok: false;
      code: "INVALID_GUEST_CREDENTIAL";
      detail: string;
    };

export type AssertVerifiedSessionResult =
  | {
      ok: true;
      accountId: string;
    }
  | {
      ok: false;
      code: "UNAUTHENTICATED_V02_SESSION" | "SESSION_SUPERSEDED";
      messageVi: string;
    };

const ACCOUNT_ID_PATTERN = /^acct_v02_[0-9a-f]{24}$/;
const SECRET_HEX_PATTERN = /^[0-9a-f]{64}$/;

function hashSecretHex(secretHex: string): string {
  return crypto.createHash("sha256").update(secretHex, "utf8").digest("hex");
}

function parseGuestToken(
  rawToken: unknown
): { accountId: string; secretHex: string } | null {
  if (typeof rawToken !== "string") {
    return null;
  }
  const trimmed = rawToken.trim();
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx <= 0 || trimmed.indexOf(".", dotIdx + 1) !== -1) {
    return null;
  }
  const accountId = trimmed.slice(0, dotIdx);
  const secretHex = trimmed.slice(dotIdx + 1);
  if (!ACCOUNT_ID_PATTERN.test(accountId) || !SECRET_HEX_PATTERN.test(secretHex)) {
    return null;
  }
  return { accountId, secretHex };
}

function constantTimeHexEquals(expectedHex: string, actualHex: string): boolean {
  if (
    expectedHex.length !== 64 ||
    actualHex.length !== 64 ||
    !SECRET_HEX_PATTERN.test(expectedHex) ||
    !SECRET_HEX_PATTERN.test(actualHex)
  ) {
    return false;
  }
  const expectedBuf = Buffer.from(expectedHex, "hex");
  const actualBuf = Buffer.from(actualHex, "hex");
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export class GuestIdentityService {
  private readonly sessionToAccount = new Map<string, VerifiedGuestSession>();
  private readonly accountToActiveSession = new Map<string, string>();
  private readonly supersededSessions = new Map<string, string>();

  constructor(private readonly host: CharacterV02RepositoryHost) {}

  private runAtomic<T>(
    tx: SqlTransaction | undefined,
    fn: (runner: SqlQueryRunner) => Promise<T>
  ): Promise<T> {
    if (tx !== undefined) {
      const runner = this.host.resolveQueryRunner(tx);
      return fn(runner);
    }
    return this.host.withTransaction(async (managedTx) => {
      const runner = this.host.resolveQueryRunner(managedTx);
      return fn(runner);
    });
  }

  async issueGuestCredential(
    options?: { nowMs?: number },
    tx?: SqlTransaction
  ): Promise<IssuedGuestCredential> {
    const nowMs =
      options?.nowMs !== undefined &&
      Number.isSafeInteger(options.nowMs) &&
      options.nowMs > 0
        ? options.nowMs
        : Date.now();
    const accountId = `acct_v02_${crypto.randomBytes(12).toString("hex")}`;
    const secretHex = crypto.randomBytes(32).toString("hex");
    const secretHash = hashSecretHex(secretHex);
    const guestToken = `${accountId}.${secretHex}`;

    await this.runAtomic(tx, async (runner) => {
      await runner.query(
        `INSERT INTO accounts (account_id, created_at) VALUES ($1, $2)`,
        [accountId, nowMs]
      );
      await runner.query(
        `INSERT INTO guest_credentials (account_id, credential_secret_hash, created_at_ms, last_used_at_ms)
         VALUES ($1, $2, $3, $4)`,
        [accountId, secretHash, nowMs, nowMs]
      );
    });

    return {
      accountId,
      guestToken,
      createdAtMs: nowMs
    };
  }

  async verifyGuestToken(
    rawToken: unknown,
    options?: { nowMs?: number },
    tx?: SqlTransaction
  ): Promise<VerifyGuestTokenResult> {
    const parsed = parseGuestToken(rawToken);
    if (!parsed) {
      return {
        ok: false,
        code: "INVALID_GUEST_CREDENTIAL",
        detail: "Guest token format is invalid."
      };
    }

    const nowMs =
      options?.nowMs !== undefined &&
      Number.isSafeInteger(options.nowMs) &&
      options.nowMs > 0
        ? options.nowMs
        : Date.now();

    return this.runAtomic(tx, async (runner) => {
      const res = await runner.query<{ credential_secret_hash: string }>(
        `SELECT credential_secret_hash FROM guest_credentials WHERE account_id = $1 LIMIT 1`,
        [parsed.accountId]
      );
      if (res.rows.length === 0) {
        return {
          ok: false,
          code: "INVALID_GUEST_CREDENTIAL",
          detail: "Guest credential account was not found."
        };
      }

      const candidateHash = hashSecretHex(parsed.secretHex);
      const storedHash = String(res.rows[0].credential_secret_hash);
      if (!constantTimeHexEquals(storedHash, candidateHash)) {
        return {
          ok: false,
          code: "INVALID_GUEST_CREDENTIAL",
          detail: "Guest credential secret verification failed."
        };
      }

      await runner.query(
        `UPDATE guest_credentials SET last_used_at_ms = $2 WHERE account_id = $1`,
        [parsed.accountId, nowMs]
      );

      return {
        ok: true,
        accountId: parsed.accountId
      };
    });
  }

  bindVerifiedSession(
    sessionId: string,
    accountId: string,
    nowMs = Date.now()
  ): VerifiedGuestSession {
    const cleanSessionId = typeof sessionId === "string" ? sessionId.trim() : "";
    if (!cleanSessionId) {
      throw new GuestIdentityError("INVALID_SESSION_ID", "sessionId must be a non-empty string.");
    }

    const previousAccountForSession = this.sessionToAccount.get(cleanSessionId);
    if (
      previousAccountForSession &&
      previousAccountForSession.accountId !== accountId &&
      this.accountToActiveSession.get(previousAccountForSession.accountId) === cleanSessionId
    ) {
      this.accountToActiveSession.delete(previousAccountForSession.accountId);
    }

    const existingActiveSessionId = this.accountToActiveSession.get(accountId);
    if (existingActiveSessionId && existingActiveSessionId !== cleanSessionId) {
      this.sessionToAccount.delete(existingActiveSessionId);
      this.supersededSessions.set(existingActiveSessionId, accountId);
    }

    const entry: VerifiedGuestSession = {
      sessionId: cleanSessionId,
      accountId,
      verifiedAtMs: nowMs
    };
    this.supersededSessions.delete(cleanSessionId);
    this.sessionToAccount.set(cleanSessionId, entry);
    this.accountToActiveSession.set(accountId, cleanSessionId);
    return entry;
  }

  async authenticateAndBindSession(
    sessionId: string,
    rawToken: unknown,
    options?: { nowMs?: number },
    tx?: SqlTransaction
  ): Promise<VerifyGuestTokenResult> {
    const cleanSessionId = typeof sessionId === "string" ? sessionId.trim() : "";
    if (!cleanSessionId) {
      return {
        ok: false,
        code: "INVALID_GUEST_CREDENTIAL",
        detail: "sessionId must be a non-empty string."
      };
    }
    const verified = await this.verifyGuestToken(rawToken, options, tx);
    if (!verified.ok) {
      return verified;
    }
    this.bindVerifiedSession(
      cleanSessionId,
      verified.accountId,
      options?.nowMs ?? Date.now()
    );
    return verified;
  }

  unbindSession(sessionId: string): void {
    const cleanSessionId = typeof sessionId === "string" ? sessionId.trim() : "";
    if (!cleanSessionId) {
      return;
    }
    const entry = this.sessionToAccount.get(cleanSessionId);
    this.sessionToAccount.delete(cleanSessionId);
    this.supersededSessions.delete(cleanSessionId);
    if (entry && this.accountToActiveSession.get(entry.accountId) === cleanSessionId) {
      this.accountToActiveSession.delete(entry.accountId);
    }
  }

  getVerifiedAccountForSession(sessionId: string): string | null {
    const cleanSessionId = typeof sessionId === "string" ? sessionId.trim() : "";
    if (!cleanSessionId) {
      return null;
    }
    const entry = this.sessionToAccount.get(cleanSessionId);
    if (!entry) {
      return null;
    }
    if (this.accountToActiveSession.get(entry.accountId) !== cleanSessionId) {
      return null;
    }
    return entry.accountId;
  }

  assertVerifiedSession(sessionId: string): AssertVerifiedSessionResult {
    const cleanSessionId = typeof sessionId === "string" ? sessionId.trim() : "";
    if (!cleanSessionId) {
      return {
        ok: false,
        code: "UNAUTHENTICATED_V02_SESSION",
        messageVi: "Phiên kết nối không hợp lệ."
      };
    }
    if (this.supersededSessions.has(cleanSessionId)) {
      return {
        ok: false,
        code: "SESSION_SUPERSEDED",
        messageVi: "Phiên đăng nhập này đã bị thay thế bởi kết nối mới hơn của cùng tài khoản."
      };
    }
    const accountId = this.getVerifiedAccountForSession(cleanSessionId);
    if (!accountId) {
      return {
        ok: false,
        code: "UNAUTHENTICATED_V02_SESSION",
        messageVi: "Phiên kết nối chưa xác thực danh tính v0.2 hợp lệ."
      };
    }
    return {
      ok: true,
      accountId
    };
  }
}
