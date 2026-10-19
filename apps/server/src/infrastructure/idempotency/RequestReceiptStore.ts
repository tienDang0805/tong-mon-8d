import type {
  ActionResultPayload,
  CharacterV02ActionResultPayload
} from "@tong-mon-8d/shared";
import type { SqlQueryRunner } from "../database/DbPorts.js";

export const IDEMPOTENCY_LEDGER_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS idempotency_ledger (
    request_id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL DEFAULT '',
    action_type TEXT NOT NULL,
    result_json JSONB NOT NULL,
    created_at BIGINT NOT NULL
  );
`;

export const ECONOMY_AUDIT_LOG_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS economy_audit_log (
    id SERIAL PRIMARY KEY,
    character_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    delta_linh_thach INTEGER NOT NULL,
    item_id TEXT,
    quantity INTEGER,
    created_at BIGINT NOT NULL
  );
`;

export function buildScopedV02IdempotencyKey(
  accountId: string,
  actionType: string,
  requestId: string,
  characterId = ""
): string {
  const cleanCharId = typeof characterId === "string" ? characterId.trim() : "";
  if (cleanCharId) {
    return `v02:${accountId}:${cleanCharId}:${actionType}:${requestId}`;
  }
  return `v02:${accountId}:${actionType}:${requestId}`;
}

export async function readActionReceipt(
  runner: SqlQueryRunner,
  accountId: string,
  actionType: string,
  requestId: string,
  characterId = ""
): Promise<CharacterV02ActionResultPayload | null> {
  const scopedKey = buildScopedV02IdempotencyKey(
    accountId,
    actionType,
    requestId,
    characterId
  );
  const res = await runner.query<{ result_json: CharacterV02ActionResultPayload }>(
    `SELECT result_json FROM idempotency_ledger WHERE request_id = $1 LIMIT 1`,
    [scopedKey]
  );
  if (res.rows.length === 0) {
    return null;
  }
  return {
    ...res.rows[0].result_json,
    requestId
  };
}

export async function insertActionReceipt(
  runner: SqlQueryRunner,
  params: {
    accountId: string;
    characterId?: string;
    actionType: string;
    requestId: string;
    responseJson: CharacterV02ActionResultPayload;
    createdAtMs: number;
  }
): Promise<void> {
  const cleanCharId =
    typeof params.characterId === "string" ? params.characterId.trim() : "";
  const keyCharId = params.actionType === "create_draft" ? "" : cleanCharId;
  const scopedKey = buildScopedV02IdempotencyKey(
    params.accountId,
    params.actionType,
    params.requestId,
    keyCharId
  );
  await runner.query(
    `INSERT INTO idempotency_ledger (request_id, character_id, action_type, result_json, created_at)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     ON CONFLICT (request_id) DO NOTHING`,
    [
      scopedKey,
      cleanCharId,
      params.actionType,
      JSON.stringify(params.responseJson),
      params.createdAtMs
    ]
  );
}

export async function checkScopedV02Idempotency(
  runner: SqlQueryRunner,
  scopedKey: string,
  requestId: string,
  options?: { replayAsSuccess?: boolean }
): Promise<CharacterV02ActionResultPayload | null> {
  const res = await runner.query<{ result_json: CharacterV02ActionResultPayload }>(
    `SELECT result_json FROM idempotency_ledger WHERE request_id = $1 LIMIT 1`,
    [scopedKey]
  );
  if (res.rows.length === 0) {
    return null;
  }
  const prior = res.rows[0].result_json;
  if (options?.replayAsSuccess === true) {
    return {
      ...prior,
      requestId
    };
  }
  return {
    ...prior,
    requestId,
    ok: false,
    code: "DUPLICATE_REQUEST",
    messageVi: "Yêu cầu trùng lặp đã bị máy chủ từ chối."
  };
}

export async function recordScopedV02Idempotency(
  runner: SqlQueryRunner,
  scopedKey: string,
  characterId: string,
  actionType: string,
  result: CharacterV02ActionResultPayload,
  nowMs: number
): Promise<void> {
  await runner.query(
    `INSERT INTO idempotency_ledger (request_id, character_id, action_type, result_json, created_at)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     ON CONFLICT (request_id) DO NOTHING`,
    [scopedKey, characterId, actionType, JSON.stringify(result), nowMs]
  );
}

export async function checkLegacyIdempotency(
  runner: SqlQueryRunner,
  requestId: string
): Promise<ActionResultPayload | null> {
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

export async function recordLegacyIdempotency(
  runner: SqlQueryRunner,
  requestId: string,
  characterId: string,
  actionType: string,
  result: ActionResultPayload
): Promise<void> {
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

export async function insertEconomyAuditLog(
  runner: SqlQueryRunner,
  characterId: string,
  eventType: string,
  deltaLinhThach: number,
  itemId?: string | null,
  quantity?: number
): Promise<void> {
  await runner.query(
    `INSERT INTO economy_audit_log (character_id, event_type, delta_linh_thach, item_id, quantity, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [characterId, eventType, deltaLinhThach, itemId ?? null, quantity ?? null, Date.now()]
  );
}
