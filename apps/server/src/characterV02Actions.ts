import crypto from "node:crypto";
import type {
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  DestinyCollection,
  DestinyDefinitionMetadata,
  DestinyRollDraft
} from "@tong-mon-8d/shared";
import {
  allocateSingleAttributePoint,
  applyCandidateCharacterExpGrant,
  computeCandidateBaselineStatSnapshot,
  isApprovedCharacterV02AppearanceId,
  isLevelAllowedForRealm,
  isValidRealmStage,
  TD01_CANDIDATE_RULESET_VERSION,
  validateDestinyCollection
} from "@tong-mon-8d/game-data";
import {
  CharacterV02PersistenceError,
  CharacterV02Repository,
  createInitialCharacterV02State,
  hydrateCharacterV02Row,
  type CharacterV02PersistedState,
  type CharacterV02RepositoryHost
} from "./characterV02Repository.js";
import type { SqlQueryRunner, SqlTransaction } from "./db.js";
import { toCharacterV02Snapshot } from "./features/character/CharacterSnapshot.js";
import {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_INNATE_TIER_WEIGHTS,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  DEFAULT_MAX_INNATE_ROLL_ATTEMPTS,
  rollInnateDestinyTripleFromCatalog,
  type InnateDestinyRollResult,
  type RollInnateDestinyOptions
} from "./features/destiny/DestinyRoller.js";

export {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_INNATE_TIER_WEIGHTS,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  DEFAULT_MAX_INNATE_ROLL_ATTEMPTS,
  rollInnateDestinyTripleFromCatalog,
  toCharacterV02Snapshot,
  type InnateDestinyRollResult,
  type RollInnateDestinyOptions
};

export const CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS character_v02_roll_drafts (
    roll_nonce TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters_v02(character_id),
    account_id TEXT NOT NULL REFERENCES accounts(account_id),
    candidate_traits_json JSONB NOT NULL,
    issued_at_ms BIGINT NOT NULL CHECK (issued_at_ms > 0),
    expires_at_ms BIGINT NOT NULL CHECK (expires_at_ms >= issued_at_ms),
    status TEXT NOT NULL CHECK (status IN ('active', 'superseded', 'consumed'))
  );
`;

export const DEFAULT_ROLL_DRAFT_TTL_MS = 15 * 60 * 1000;

export interface CharacterV02ActionOptions {
  destinyCatalog?: Readonly<Record<string, DestinyDefinitionMetadata>>;
  allowNonApprovedCatalogInTests?: boolean;
  nowMs?: number;
  rollDraftTtlMs?: number;
  randomIntFn?: (maxExclusive: number) => number;
  maxRollAttempts?: number;
}

export interface ServerOnlyGrantAcquiredDestinyParams {
  accountId: string;
  requestId: string;
  traitId: string;
}

export interface ServerOnlyAwardCharacterExpParams {
  accountId: string;
  requestId: string;
  expDelta: bigint | number | string;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isNonEmptyTrimmedString(value: unknown, maxLen: number): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed === value && trimmed.length <= maxLen;
}

const FORBIDDEN_CLIENT_PAYLOAD_KEYS = new Set<string>([
  "accountId",
  "characterId",
  "level",
  "expTowardNext",
  "expDelta",
  "freeAttributePoints",
  "allocated",
  "earnedPermanent",
  "tuVi",
  "realmId",
  "realmStage",
  "destiny",
  "innate",
  "candidateTraitIds",
  "acquiredTraitIds",
  "activeAcquiredSlots",
  "lockedSlots",
  "lockedSlotIndices",
  "seed",
  "rngSeed",
  "tierWeights",
  "revision",
  "creationState",
  "linhThach",
  "inventory",
  "resources",
  "currentHp",
  "currentMp"
]);

function validateAllowedClientIntentKeys(
  rawIntent: unknown,
  allowedKeys: readonly string[]
): { ok: true; payload: Record<string, unknown>; requestId: string } | {
  ok: false;
  requestId: string;
  code: "FORGED_INPUT_REJECTED" | "INVALID_INTENT_PAYLOAD";
  messageVi: string;
} {
  if (!isPlainRecord(rawIntent)) {
    return {
      ok: false,
      requestId: "",
      code: "INVALID_INTENT_PAYLOAD",
      messageVi: "Dữ liệu yêu cầu gửi lên không hợp lệ."
    };
  }
  const rawReqId =
    typeof rawIntent.requestId === "string" ? rawIntent.requestId.trim().slice(0, 128) : "";
  const allowedSet = new Set<string>(allowedKeys);

  for (const key of Object.keys(rawIntent)) {
    if (FORBIDDEN_CLIENT_PAYLOAD_KEYS.has(key) || !allowedSet.has(key)) {
      return {
        ok: false,
        requestId: rawReqId,
        code: "FORGED_INPUT_REJECTED",
        messageVi: `Trường dữ liệu '${key}' không được phép do máy khách tự gửi.`
      };
    }
  }

  if (!isNonEmptyTrimmedString(rawIntent.requestId, 128)) {
    return {
      ok: false,
      requestId: rawReqId,
      code: "INVALID_INTENT_PAYLOAD",
      messageVi: "Mã định danh yêu cầu (requestId) không hợp lệ."
    };
  }

  return {
    ok: true,
    payload: rawIntent,
    requestId: rawIntent.requestId
  };
}

export class CharacterV02ActionService {
  constructor(
    private readonly host: CharacterV02RepositoryHost,
    private readonly repository: CharacterV02Repository
  ) {}

  private runAtomic<T>(
    tx: SqlTransaction | undefined,
    fn: (runner: SqlQueryRunner, activeTx: SqlTransaction) => Promise<T>
  ): Promise<T> {
    if (tx !== undefined) {
      const runner = this.host.resolveQueryRunner(tx);
      return fn(runner, tx);
    }
    return this.host.withTransaction(async (managedTx) => {
      const runner = this.host.resolveQueryRunner(managedTx);
      return fn(runner, managedTx);
    });
  }

  private resolveCatalog(
    options?: CharacterV02ActionOptions
  ): Readonly<Record<string, DestinyDefinitionMetadata>> {
    return options?.destinyCatalog ?? APPROVED_PRODUCTION_DESTINY_CATALOG;
  }

  private resolveNowMs(options?: CharacterV02ActionOptions): number {
    if (
      options?.nowMs !== undefined &&
      Number.isSafeInteger(options.nowMs) &&
      options.nowMs > 0
    ) {
      return options.nowMs;
    }
    return Date.now();
  }

  private buildScopedIdempotencyKey(
    accountId: string,
    actionType: string,
    requestId: string
  ): string {
    return `v02:${accountId}:${actionType}:${requestId}`;
  }

  private async checkScopedIdempotency(
    runner: SqlQueryRunner,
    scopedKey: string,
    requestId: string
  ): Promise<CharacterV02ActionResultPayload | null> {
    const res = await runner.query<{ result_json: CharacterV02ActionResultPayload }>(
      `SELECT result_json FROM idempotency_ledger WHERE request_id = $1 LIMIT 1`,
      [scopedKey]
    );
    if (res.rows.length === 0) {
      return null;
    }
    const prior = res.rows[0].result_json;
    return {
      ...prior,
      requestId,
      ok: false,
      code: "DUPLICATE_REQUEST",
      messageVi: "Yêu cầu trùng lặp đã bị máy chủ từ chối."
    };
  }

  private async recordScopedIdempotency(
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

  private async lockCharacterByAccount(
    runner: SqlQueryRunner,
    accountId: string,
    catalog?: Readonly<Record<string, DestinyDefinitionMetadata>>
  ): Promise<CharacterV02PersistedState | null> {
    const res = await runner.query<Record<string, unknown>>(
      `SELECT
        character_id,
        account_id,
        name,
        appearance_id,
        creation_state,
        revision,
        schema_version,
        ruleset_version,
        level,
        exp_toward_next::text AS exp_toward_next_text,
        free_attribute_points,
        allocated_attributes_json,
        earned_permanent_attributes_json,
        realm_id,
        realm_stage,
        tu_vi::text AS tu_vi_text,
        innate_destiny_json,
        innate_confirmed_at_ms,
        acquired_destiny_ids_json,
        active_acquired_slots_json,
        destiny_collection_revision,
        current_hp,
        current_mp,
        zone_id,
        x,
        y,
        direction,
        linh_thach,
        equipped_title,
        equipped_inheritance,
        inventory_json,
        quests_json,
        reputation_json,
        buffs_json,
        meditation_started_at_ms,
        last_meditation_claim_at_ms,
        created_at_ms,
        updated_at_ms
       FROM characters_v02
       WHERE account_id = $1
       FOR UPDATE`,
      [accountId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return hydrateCharacterV02Row(res.rows[0], { destinyCatalog: catalog });
  }

  async createCharacterDraft(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
      return {
        requestId: "",
        ok: false,
        code: "UNAUTHENTICATED_V02_SESSION",
        messageVi: "Danh tính tài khoản phiên chưa được xác thực."
      };
    }

    const keyCheck = validateAllowedClientIntentKeys(rawIntent, [
      "requestId",
      "name",
      "appearanceId"
    ]);
    if (!keyCheck.ok) {
      return {
        requestId: keyCheck.requestId,
        ok: false,
        code: keyCheck.code,
        messageVi: keyCheck.messageVi
      };
    }

    const { payload, requestId } = keyCheck;
    const rawName = typeof payload.name === "string" ? payload.name.trim() : "";
    if (rawName.length < 2 || rawName.length > 24 || rawName !== payload.name) {
      return {
        requestId,
        ok: false,
        code: "INVALID_CHARACTER_NAME",
        messageVi: "Đạo hiệu phải từ 2 đến 24 ký tự và không chứa khoảng trắng thừa ở hai đầu."
      };
    }

    let appearanceId = "hero_kiem_tu";
    if (payload.appearanceId !== undefined) {
      if (
        !isNonEmptyTrimmedString(payload.appearanceId, 64) ||
        !isApprovedCharacterV02AppearanceId(payload.appearanceId)
      ) {
        return {
          requestId,
          ok: false,
          code: "INVALID_APPEARANCE_ID",
          messageVi: "Ngoại hình khởi tạo (appearanceId) không thuộc danh mục phê duyệt."
        };
      }
      appearanceId = payload.appearanceId;
    }

    const nowMs = this.resolveNowMs(options);
    const catalog = this.resolveCatalog(options);
    const scopedKey = this.buildScopedIdempotencyKey(
      cleanAccount,
      "create_draft",
      requestId
    );

    try {
      return await this.runAtomic(tx, async (runner, activeTx) => {
        const dup = await this.checkScopedIdempotency(runner, scopedKey, requestId);
        if (dup) {
          return dup;
        }

        const existing = await this.lockCharacterByAccount(
          runner,
          cleanAccount,
          catalog
        );
        if (existing !== null) {
          return {
            requestId,
            ok: false,
            code: "DUPLICATE_ACCOUNT_CHARACTER",
            messageVi: "Tài khoản này đã sở hữu một nhân vật v0.2."
          };
        }

        const characterId = `char_v02_${crypto.randomBytes(12).toString("hex")}`;
        const initialDraft = createInitialCharacterV02State({
          characterId,
          accountId: cleanAccount,
          name: rawName,
          appearanceId,
          createdAtMs: nowMs,
          creationState: "draft",
          rulesetVersion: TD01_CANDIDATE_RULESET_VERSION
        });

        const created = await this.repository.createCharacter(
          initialDraft,
          { destinyCatalog: catalog },
          activeTx
        );

        const result: CharacterV02ActionResultPayload = {
          requestId,
          ok: true,
          code: "OK",
          messageVi: "Đã khởi tạo bản nháp nhân vật v0.2 thành công.",
          character: toCharacterV02Snapshot(created, catalog)
        };

        await this.recordScopedIdempotency(
          runner,
          scopedKey,
          created.identity.characterId,
          "create_draft",
          result,
          nowMs
        );
        return result;
      });
    } catch (err) {
      if (err instanceof CharacterV02PersistenceError) {
        return {
          requestId,
          ok: false,
          code: err.code,
          messageVi: err.message
        };
      }
      throw err;
    }
  }

  async rollInnateDestiny(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
      return {
        requestId: "",
        ok: false,
        code: "UNAUTHENTICATED_V02_SESSION",
        messageVi: "Danh tính tài khoản phiên chưa được xác thực."
      };
    }

    const keyCheck = validateAllowedClientIntentKeys(rawIntent, ["requestId"]);
    if (!keyCheck.ok) {
      return {
        requestId: keyCheck.requestId,
        ok: false,
        code: keyCheck.code,
        messageVi: keyCheck.messageVi
      };
    }

    const { requestId } = keyCheck;
    const nowMs = this.resolveNowMs(options);
    const ttlMs = options?.rollDraftTtlMs ?? DEFAULT_ROLL_DRAFT_TTL_MS;
    const catalog = this.resolveCatalog(options);
    const scopedKey = this.buildScopedIdempotencyKey(
      cleanAccount,
      "roll_innate",
      requestId
    );

    return this.runAtomic(tx, async (runner) => {
      const dup = await this.checkScopedIdempotency(runner, scopedKey, requestId);
      if (dup) {
        return dup;
      }

      const character = await this.lockCharacterByAccount(
        runner,
        cleanAccount,
        catalog
      );
      if (!character) {
        return {
          requestId,
          ok: false,
          code: "CHARACTER_NOT_FOUND",
          messageVi: "Không tìm thấy bản nháp nhân vật v0.2 cho tài khoản này."
        };
      }

      if (character.identity.creationState !== "draft") {
        return {
          requestId,
          ok: false,
          code: "CHARACTER_ALREADY_CONFIRMED",
          messageVi: "Nhân vật đã xác nhận Tiên Thiên Khí Vận, không thể gieo lại."
        };
      }

      const rollOutcome = rollInnateDestinyTripleFromCatalog(catalog, {
        allowNonApprovedInCatalog: options?.allowNonApprovedCatalogInTests === true,
        randomIntFn: options?.randomIntFn,
        maxAttempts: options?.maxRollAttempts
      });
      if (!rollOutcome.ok) {
        return {
          requestId,
          ok: false,
          code: rollOutcome.code,
          messageVi:
            "Danh mục Tiên Thiên Khí Vận được phê duyệt chưa đủ tối thiểu 3 mệnh cách hợp lệ."
        };
      }

      await runner.query(
        `UPDATE character_v02_roll_drafts
         SET status = 'superseded'
         WHERE character_id = $1 AND account_id = $2 AND status = 'active'`,
        [character.identity.characterId, cleanAccount]
      );

      const rollNonce = `roll_v02_${crypto.randomBytes(16).toString("hex")}`;
      const expiresAtMs = nowMs + ttlMs;

      await runner.query(
        `INSERT INTO character_v02_roll_drafts (
           roll_nonce,
           character_id,
           account_id,
           candidate_traits_json,
           issued_at_ms,
           expires_at_ms,
           status
         ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'active')`,
        [
          rollNonce,
          character.identity.characterId,
          cleanAccount,
          JSON.stringify(rollOutcome.candidateTraitIds),
          nowMs,
          expiresAtMs
        ]
      );

      const result: CharacterV02ActionResultPayload = {
        requestId,
        ok: true,
        code: "OK",
        messageVi: "Đã gieo 3 Tiên Thiên Khí Vận thành công.",
        character: toCharacterV02Snapshot(character, catalog),
        rollDraft: {
          characterCreationId: character.identity.characterId,
          rollNonce,
          candidateTraitIds: rollOutcome.candidateTraitIds,
          expiresAtMs
        }
      };

      await this.recordScopedIdempotency(
        runner,
        scopedKey,
        character.identity.characterId,
        "roll_innate",
        result,
        nowMs
      );
      return result;
    });
  }

  async confirmInnateDestiny(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
      return {
        requestId: "",
        ok: false,
        code: "UNAUTHENTICATED_V02_SESSION",
        messageVi: "Danh tính tài khoản phiên chưa được xác thực."
      };
    }

    const keyCheck = validateAllowedClientIntentKeys(rawIntent, [
      "requestId",
      "rollNonce"
    ]);
    if (!keyCheck.ok) {
      return {
        requestId: keyCheck.requestId,
        ok: false,
        code: keyCheck.code,
        messageVi: keyCheck.messageVi
      };
    }

    const { payload, requestId } = keyCheck;
    if (!isNonEmptyTrimmedString(payload.rollNonce, 128)) {
      return {
        requestId,
        ok: false,
        code: "INVALID_ROLL_NONCE",
        messageVi: "Mã phiên gieo mệnh cách (rollNonce) không hợp lệ."
      };
    }
    const rollNonce = payload.rollNonce;
    const nowMs = this.resolveNowMs(options);
    const catalog = this.resolveCatalog(options);
    const scopedKey = this.buildScopedIdempotencyKey(
      cleanAccount,
      "confirm_innate",
      requestId
    );

    try {
      return await this.runAtomic(tx, async (runner, activeTx) => {
        const dup = await this.checkScopedIdempotency(runner, scopedKey, requestId);
        if (dup) {
          return dup;
        }

        const character = await this.lockCharacterByAccount(
          runner,
          cleanAccount,
          catalog
        );
        if (!character) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_FOUND",
            messageVi: "Không tìm thấy nhân vật v0.2 của tài khoản này."
          };
        }

        const nonceRes = await runner.query<{
          roll_nonce: string;
          character_id: string;
          account_id: string;
          candidate_traits_json: [string, string, string];
          issued_at_ms: string | number;
          expires_at_ms: string | number;
          status: "active" | "superseded" | "consumed";
        }>(
          `SELECT
             roll_nonce,
             character_id,
             account_id,
             candidate_traits_json,
             issued_at_ms,
             expires_at_ms,
             status
           FROM character_v02_roll_drafts
           WHERE roll_nonce = $1
           FOR UPDATE`,
          [rollNonce]
        );

        if (nonceRes.rows.length === 0) {
          return {
            requestId,
            ok: false,
            code: "INVALID_ROLL_NONCE",
            messageVi: "Mã phiên gieo mệnh cách không tồn tại."
          };
        }

        const draftRow = nonceRes.rows[0];
        if (
          String(draftRow.account_id) !== cleanAccount ||
          String(draftRow.character_id) !== character.identity.characterId
        ) {
          return {
            requestId,
            ok: false,
            code: "FOREIGN_ROLL_NONCE",
            messageVi: "Mã phiên gieo mệnh cách thuộc về tài khoản hoặc nhân vật khác."
          };
        }

        if (draftRow.status === "consumed") {
          return {
            requestId,
            ok: false,
            code: "ROLL_NONCE_ALREADY_CONSUMED",
            messageVi: "Mã phiên gieo mệnh cách này đã được xác nhận trước đó."
          };
        }

        if (character.identity.creationState !== "draft") {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_ALREADY_CONFIRMED",
            messageVi: "Nhân vật đã hoàn tất xác nhận Tiên Thiên Khí Vận."
          };
        }

        if (draftRow.status === "superseded") {
          return {
            requestId,
            ok: false,
            code: "SUPERSEDED_ROLL_NONCE",
            messageVi: "Mã phiên gieo mệnh cách này đã bị thay thế bởi lượt gieo mới hơn."
          };
        }

        const expiresAtMs = Number(draftRow.expires_at_ms);
        if (nowMs > expiresAtMs) {
          return {
            requestId,
            ok: false,
            code: "EXPIRED_ROLL_NONCE",
            messageVi: "Mã phiên gieo mệnh cách đã hết hạn."
          };
        }

        const consumeRes = await runner.query<{ roll_nonce: string }>(
          `UPDATE character_v02_roll_drafts
           SET status = 'consumed'
           WHERE roll_nonce = $1 AND status = 'active'
           RETURNING roll_nonce`,
          [rollNonce]
        );
        if (consumeRes.rows.length === 0) {
          return {
            requestId,
            ok: false,
            code: "ROLL_NONCE_ALREADY_CONSUMED",
            messageVi: "Mã phiên gieo mệnh cách đã được tiêu thụ bởi yêu cầu song song."
          };
        }

        const candidateTuple = draftRow.candidate_traits_json;
        const confirmedAtMs = Math.max(nowMs, character.identity.createdAtMs);
        const confirmedDestiny: DestinyCollection = {
          innate: [candidateTuple[0], candidateTuple[1], candidateTuple[2]],
          innateConfirmedAtMs: confirmedAtMs,
          acquiredTraitIds: [],
          activeAcquiredSlots: [null, null, null],
          collectionRevision: 1
        };

        const statSnap = computeCandidateBaselineStatSnapshot({
          realmId: character.cultivation.realmId,
          realmStage: character.cultivation.realmStage,
          levelProgress: character.levelProgress,
          destiny: confirmedDestiny,
          destinyCatalog: catalog
        });
        const maxHp = statSnap.ok
          ? statSnap.snapshot.derivedStats.maxHp
          : character.resources.currentHp;
        const maxMp = statSnap.ok
          ? statSnap.snapshot.derivedStats.maxMp
          : character.resources.currentMp;

        const nextState: CharacterV02PersistedState = {
          ...character,
          identity: {
            ...character.identity,
            creationState: "confirmed",
            revision: character.identity.revision + 1
          },
          destiny: confirmedDestiny,
          resources: {
            currentHp: Math.min(character.resources.currentHp, maxHp),
            currentMp: Math.min(character.resources.currentMp, maxMp)
          },
          updatedAtMs: Math.max(confirmedAtMs, character.updatedAtMs)
        };

        const updated = await this.repository.updateCharacter(
          {
            expectedRevision: character.identity.revision,
            nextState
          },
          { destinyCatalog: catalog },
          activeTx
        );

        const result: CharacterV02ActionResultPayload = {
          requestId,
          ok: true,
          code: "OK",
          messageVi: "Đã xác nhận bộ 3 Tiên Thiên Khí Vận bất biến.",
          character: toCharacterV02Snapshot(updated, catalog)
        };

        await this.recordScopedIdempotency(
          runner,
          scopedKey,
          updated.identity.characterId,
          "confirm_innate",
          result,
          nowMs
        );
        return result;
      });
    } catch (err) {
      if (err instanceof CharacterV02PersistenceError) {
        return {
          requestId,
          ok: false,
          code: err.code,
          messageVi: err.message
        };
      }
      throw err;
    }
  }

  async allocateAttributePoint(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
      return {
        requestId: "",
        ok: false,
        code: "UNAUTHENTICATED_V02_SESSION",
        messageVi: "Danh tính tài khoản phiên chưa được xác thực."
      };
    }

    const keyCheck = validateAllowedClientIntentKeys(rawIntent, [
      "requestId",
      "attributeId"
    ]);
    if (!keyCheck.ok) {
      return {
        requestId: keyCheck.requestId,
        ok: false,
        code: keyCheck.code,
        messageVi: keyCheck.messageVi
      };
    }

    const { payload, requestId } = keyCheck;
    const nowMs = this.resolveNowMs(options);
    const catalog = this.resolveCatalog(options);
    const scopedKey = this.buildScopedIdempotencyKey(
      cleanAccount,
      "allocate_attribute",
      requestId
    );

    try {
      return await this.runAtomic(tx, async (runner, activeTx) => {
        const dup = await this.checkScopedIdempotency(runner, scopedKey, requestId);
        if (dup) {
          return dup;
        }

        const character = await this.lockCharacterByAccount(
          runner,
          cleanAccount,
          catalog
        );
        if (!character) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_FOUND",
            messageVi: "Không tìm thấy nhân vật v0.2 của tài khoản này."
          };
        }

        if (character.identity.creationState !== "confirmed") {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_CONFIRMED",
            messageVi: "Nhân vật phải xác nhận Tiên Thiên Khí Vận trước khi phân bổ căn cốt."
          };
        }

        const allocOutcome = allocateSingleAttributePoint(
          character.levelProgress,
          payload.attributeId
        );
        if (!allocOutcome.ok) {
          return {
            requestId,
            ok: false,
            code:
              allocOutcome.code === "INSUFFICIENT_FREE_POINTS"
                ? "NO_FREE_ATTRIBUTE_POINTS"
                : allocOutcome.code,
            messageVi: "Không thể phân bổ điểm thuộc tính theo yêu cầu."
          };
        }

        const nextStatSnap = computeCandidateBaselineStatSnapshot({
          realmId: character.cultivation.realmId,
          realmStage: character.cultivation.realmStage,
          levelProgress: allocOutcome.next,
          destiny: character.destiny,
          destinyCatalog: catalog
        });
        const maxHp = nextStatSnap.ok
          ? nextStatSnap.snapshot.derivedStats.maxHp
          : character.resources.currentHp;
        const maxMp = nextStatSnap.ok
          ? nextStatSnap.snapshot.derivedStats.maxMp
          : character.resources.currentMp;

        const nextState: CharacterV02PersistedState = {
          ...character,
          identity: {
            ...character.identity,
            revision: character.identity.revision + 1
          },
          levelProgress: allocOutcome.next,
          resources: {
            currentHp: Math.min(character.resources.currentHp, maxHp),
            currentMp: Math.min(character.resources.currentMp, maxMp)
          },
          updatedAtMs: Math.max(nowMs, character.updatedAtMs)
        };

        const updated = await this.repository.updateCharacter(
          {
            expectedRevision: character.identity.revision,
            nextState
          },
          { destinyCatalog: catalog },
          activeTx
        );

        const result: CharacterV02ActionResultPayload = {
          requestId,
          ok: true,
          code: "OK",
          messageVi: "Đã phân bổ +1 điểm thuộc tính thành công.",
          character: toCharacterV02Snapshot(updated, catalog)
        };

        await this.recordScopedIdempotency(
          runner,
          scopedKey,
          updated.identity.characterId,
          "allocate_attribute",
          result,
          nowMs
        );
        return result;
      });
    } catch (err) {
      if (err instanceof CharacterV02PersistenceError) {
        return {
          requestId,
          ok: false,
          code: err.code,
          messageVi: err.message
        };
      }
      throw err;
    }
  }

  async equipAcquiredDestinyTrait(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
      return {
        requestId: "",
        ok: false,
        code: "UNAUTHENTICATED_V02_SESSION",
        messageVi: "Danh tính tài khoản phiên chưa được xác thực."
      };
    }

    const keyCheck = validateAllowedClientIntentKeys(rawIntent, [
      "requestId",
      "slotIndex",
      "traitId"
    ]);
    if (!keyCheck.ok) {
      return {
        requestId: keyCheck.requestId,
        ok: false,
        code: keyCheck.code,
        messageVi: keyCheck.messageVi
      };
    }

    const { payload, requestId } = keyCheck;
    if (
      payload.slotIndex !== 0 &&
      payload.slotIndex !== 1 &&
      payload.slotIndex !== 2
    ) {
      return {
        requestId,
        ok: false,
        code: "INVALID_DESTINY_SLOT_INDEX",
        messageVi: "Vị trí ô Hậu Thiên Khí Vận chỉ hợp lệ từ 0 đến 2."
      };
    }
    const slotIndex = payload.slotIndex;

    if (!isNonEmptyTrimmedString(payload.traitId, 128)) {
      return {
        requestId,
        ok: false,
        code: "INVALID_DESTINY_TRAIT_ID",
        messageVi: "Mã Hậu Thiên Khí Vận (traitId) không hợp lệ."
      };
    }
    const traitId = payload.traitId;

    const nowMs = this.resolveNowMs(options);
    const catalog = this.resolveCatalog(options);
    const scopedKey = this.buildScopedIdempotencyKey(
      cleanAccount,
      "equip_destiny",
      requestId
    );

    try {
      return await this.runAtomic(tx, async (runner, activeTx) => {
        const dup = await this.checkScopedIdempotency(runner, scopedKey, requestId);
        if (dup) {
          return dup;
        }

        const character = await this.lockCharacterByAccount(
          runner,
          cleanAccount,
          catalog
        );
        if (!character) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_FOUND",
            messageVi: "Không tìm thấy nhân vật v0.2 của tài khoản này."
          };
        }

        if (character.identity.creationState !== "confirmed" || !character.destiny) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_CONFIRMED",
            messageVi: "Nhân vật phải xác nhận Tiên Thiên Khí Vận trước khi trang bị Hậu Thiên."
          };
        }

        if (!character.destiny.acquiredTraitIds.includes(traitId)) {
          return {
            requestId,
            ok: false,
            code: "DESTINY_TRAIT_NOT_OWNED",
            messageVi: "Nhân vật chưa lĩnh ngộ Hậu Thiên Khí Vận này."
          };
        }

        const nextActive: [string | null, string | null, string | null] = [
          character.destiny.activeAcquiredSlots[0],
          character.destiny.activeAcquiredSlots[1],
          character.destiny.activeAcquiredSlots[2]
        ];

        for (let i = 0; i < 3; i += 1) {
          if (i !== slotIndex && nextActive[i] === traitId) {
            return {
              requestId,
              ok: false,
              code: "DESTINY_TRAIT_ALREADY_EQUIPPED",
              messageVi: "Mệnh cách Hậu Thiên này đang được gắn ở một ô khác."
            };
          }
        }

        nextActive[slotIndex] = traitId;
        const nextDestiny: DestinyCollection = {
          innate: [...character.destiny.innate] as [string, string, string],
          innateConfirmedAtMs: character.destiny.innateConfirmedAtMs,
          acquiredTraitIds: [...character.destiny.acquiredTraitIds],
          activeAcquiredSlots: nextActive,
          collectionRevision: character.destiny.collectionRevision + 1
        };

        const statSnap = computeCandidateBaselineStatSnapshot({
          realmId: character.cultivation.realmId,
          realmStage: character.cultivation.realmStage,
          levelProgress: character.levelProgress,
          destiny: nextDestiny,
          destinyCatalog: catalog
        });
        const maxHp = statSnap.ok
          ? statSnap.snapshot.derivedStats.maxHp
          : character.resources.currentHp;
        const maxMp = statSnap.ok
          ? statSnap.snapshot.derivedStats.maxMp
          : character.resources.currentMp;

        const nextState: CharacterV02PersistedState = {
          ...character,
          identity: {
            ...character.identity,
            revision: character.identity.revision + 1
          },
          destiny: nextDestiny,
          resources: {
            currentHp: Math.min(character.resources.currentHp, maxHp),
            currentMp: Math.min(character.resources.currentMp, maxMp)
          },
          updatedAtMs: Math.max(nowMs, character.updatedAtMs)
        };

        const updated = await this.repository.updateCharacter(
          {
            expectedRevision: character.identity.revision,
            nextState
          },
          { destinyCatalog: catalog },
          activeTx
        );

        const result: CharacterV02ActionResultPayload = {
          requestId,
          ok: true,
          code: "OK",
          messageVi: "Đã gắn Hậu Thiên Khí Vận vào ô kích hoạt.",
          character: toCharacterV02Snapshot(updated, catalog)
        };

        await this.recordScopedIdempotency(
          runner,
          scopedKey,
          updated.identity.characterId,
          "equip_destiny",
          result,
          nowMs
        );
        return result;
      });
    } catch (err) {
      if (err instanceof CharacterV02PersistenceError) {
        return {
          requestId,
          ok: false,
          code: err.code,
          messageVi: err.message
        };
      }
      throw err;
    }
  }

  async unequipAcquiredDestinyTrait(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
      return {
        requestId: "",
        ok: false,
        code: "UNAUTHENTICATED_V02_SESSION",
        messageVi: "Danh tính tài khoản phiên chưa được xác thực."
      };
    }

    const keyCheck = validateAllowedClientIntentKeys(rawIntent, [
      "requestId",
      "slotIndex"
    ]);
    if (!keyCheck.ok) {
      return {
        requestId: keyCheck.requestId,
        ok: false,
        code: keyCheck.code,
        messageVi: keyCheck.messageVi
      };
    }

    const { payload, requestId } = keyCheck;
    if (
      payload.slotIndex !== 0 &&
      payload.slotIndex !== 1 &&
      payload.slotIndex !== 2
    ) {
      return {
        requestId,
        ok: false,
        code: "INVALID_DESTINY_SLOT_INDEX",
        messageVi: "Vị trí ô Hậu Thiên Khí Vận chỉ hợp lệ từ 0 đến 2."
      };
    }
    const slotIndex = payload.slotIndex;

    const nowMs = this.resolveNowMs(options);
    const catalog = this.resolveCatalog(options);
    const scopedKey = this.buildScopedIdempotencyKey(
      cleanAccount,
      "unequip_destiny",
      requestId
    );

    try {
      return await this.runAtomic(tx, async (runner, activeTx) => {
        const dup = await this.checkScopedIdempotency(runner, scopedKey, requestId);
        if (dup) {
          return dup;
        }

        const character = await this.lockCharacterByAccount(
          runner,
          cleanAccount,
          catalog
        );
        if (!character) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_FOUND",
            messageVi: "Không tìm thấy nhân vật v0.2 của tài khoản này."
          };
        }

        if (character.identity.creationState !== "confirmed" || !character.destiny) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_CONFIRMED",
            messageVi: "Nhân vật phải xác nhận Tiên Thiên Khí Vận trước khi tháo Hậu Thiên."
          };
        }

        const nextActive: [string | null, string | null, string | null] = [
          character.destiny.activeAcquiredSlots[0],
          character.destiny.activeAcquiredSlots[1],
          character.destiny.activeAcquiredSlots[2]
        ];
        nextActive[slotIndex] = null;

        const nextDestiny: DestinyCollection = {
          innate: [...character.destiny.innate] as [string, string, string],
          innateConfirmedAtMs: character.destiny.innateConfirmedAtMs,
          acquiredTraitIds: [...character.destiny.acquiredTraitIds],
          activeAcquiredSlots: nextActive,
          collectionRevision: character.destiny.collectionRevision + 1
        };

        const statSnap = computeCandidateBaselineStatSnapshot({
          realmId: character.cultivation.realmId,
          realmStage: character.cultivation.realmStage,
          levelProgress: character.levelProgress,
          destiny: nextDestiny,
          destinyCatalog: catalog
        });
        const maxHp = statSnap.ok
          ? statSnap.snapshot.derivedStats.maxHp
          : character.resources.currentHp;
        const maxMp = statSnap.ok
          ? statSnap.snapshot.derivedStats.maxMp
          : character.resources.currentMp;

        const nextState: CharacterV02PersistedState = {
          ...character,
          identity: {
            ...character.identity,
            revision: character.identity.revision + 1
          },
          destiny: nextDestiny,
          resources: {
            currentHp: Math.min(character.resources.currentHp, maxHp),
            currentMp: Math.min(character.resources.currentMp, maxMp)
          },
          updatedAtMs: Math.max(nowMs, character.updatedAtMs)
        };

        const updated = await this.repository.updateCharacter(
          {
            expectedRevision: character.identity.revision,
            nextState
          },
          { destinyCatalog: catalog },
          activeTx
        );

        const result: CharacterV02ActionResultPayload = {
          requestId,
          ok: true,
          code: "OK",
          messageVi: "Đã tháo Hậu Thiên Khí Vận khỏi ô kích hoạt (vẫn giữ sở hữu).",
          character: toCharacterV02Snapshot(updated, catalog)
        };

        await this.recordScopedIdempotency(
          runner,
          scopedKey,
          updated.identity.characterId,
          "unequip_destiny",
          result,
          nowMs
        );
        return result;
      });
    } catch (err) {
      if (err instanceof CharacterV02PersistenceError) {
        return {
          requestId,
          ok: false,
          code: err.code,
          messageVi: err.message
        };
      }
      throw err;
    }
  }

  async grantAcquiredDestinyTraitServerOnly(
    params: ServerOnlyGrantAcquiredDestinyParams,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    const cleanAccount = typeof params?.accountId === "string" ? params.accountId.trim() : "";
    const requestId = typeof params?.requestId === "string" ? params.requestId.trim() : "";
    const traitId = typeof params?.traitId === "string" ? params.traitId.trim() : "";

    if (!isNonEmptyTrimmedString(cleanAccount, 128) || !isNonEmptyTrimmedString(requestId, 128)) {
      return {
        requestId,
        ok: false,
        code: "INVALID_INTENT_PAYLOAD",
        messageVi: "Thông tin cấp Hậu Thiên Khí Vận máy chủ không hợp lệ."
      };
    }
    if (!isNonEmptyTrimmedString(traitId, 128)) {
      return {
        requestId,
        ok: false,
        code: "INVALID_DESTINY_TRAIT_ID",
        messageVi: "Mã Hậu Thiên Khí Vận không hợp lệ."
      };
    }

    const nowMs = this.resolveNowMs(options);
    const catalog = this.resolveCatalog(options);
    const scopedKey = this.buildScopedIdempotencyKey(
      cleanAccount,
      "server_grant_destiny",
      requestId
    );

    try {
      return await this.runAtomic(tx, async (runner, activeTx) => {
        const dup = await this.checkScopedIdempotency(runner, scopedKey, requestId);
        if (dup) {
          return dup;
        }

        const character = await this.lockCharacterByAccount(
          runner,
          cleanAccount,
          catalog
        );
        if (!character) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_FOUND",
            messageVi: "Không tìm thấy nhân vật v0.2 của tài khoản này."
          };
        }

        if (character.identity.creationState !== "confirmed" || !character.destiny) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_CONFIRMED",
            messageVi: "Nhân vật phải xác nhận Tiên Thiên Khí Vận trước khi nhận Hậu Thiên."
          };
        }

        const candidateDestiny: DestinyCollection = {
          innate: [...character.destiny.innate] as [string, string, string],
          innateConfirmedAtMs: character.destiny.innateConfirmedAtMs,
          acquiredTraitIds: [...character.destiny.acquiredTraitIds, traitId],
          activeAcquiredSlots: [...character.destiny.activeAcquiredSlots] as [
            string | null,
            string | null,
            string | null
          ],
          collectionRevision: character.destiny.collectionRevision + 1
        };

        const destinyCheck = validateDestinyCollection(candidateDestiny, catalog);
        if (!destinyCheck.ok) {
          const mappedCode =
            destinyCheck.code === "MULTIPLE_LEGENDARY_SIGNATURES"
              ? "SIGNATURE_CONFLICT"
              : destinyCheck.code;
          return {
            requestId,
            ok: false,
            code: mappedCode,
            messageVi: `Không thể cấp Hậu Thiên Khí Vận (${mappedCode}).`
          };
        }

        const nextState: CharacterV02PersistedState = {
          ...character,
          identity: {
            ...character.identity,
            revision: character.identity.revision + 1
          },
          destiny: candidateDestiny,
          updatedAtMs: Math.max(nowMs, character.updatedAtMs)
        };

        const updated = await this.repository.updateCharacter(
          {
            expectedRevision: character.identity.revision,
            nextState
          },
          { destinyCatalog: catalog },
          activeTx
        );

        const result: CharacterV02ActionResultPayload = {
          requestId,
          ok: true,
          code: "OK",
          messageVi: "Máy chủ đã cấp Hậu Thiên Khí Vận vào bộ sưu tập.",
          character: toCharacterV02Snapshot(updated, catalog)
        };

        await this.recordScopedIdempotency(
          runner,
          scopedKey,
          updated.identity.characterId,
          "server_grant_destiny",
          result,
          nowMs
        );
        return result;
      });
    } catch (err) {
      if (err instanceof CharacterV02PersistenceError) {
        return {
          requestId,
          ok: false,
          code: err.code,
          messageVi: err.message
        };
      }
      throw err;
    }
  }

  async awardCharacterExpServerOnly(
    params: ServerOnlyAwardCharacterExpParams,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    const cleanAccount = typeof params?.accountId === "string" ? params.accountId.trim() : "";
    const requestId = typeof params?.requestId === "string" ? params.requestId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128) || !isNonEmptyTrimmedString(requestId, 128)) {
      return {
        requestId,
        ok: false,
        code: "INVALID_INTENT_PAYLOAD",
        messageVi: "Thông tin cấp EXP máy chủ không hợp lệ."
      };
    }

    const nowMs = this.resolveNowMs(options);
    const catalog = this.resolveCatalog(options);
    const scopedKey = this.buildScopedIdempotencyKey(
      cleanAccount,
      "server_award_exp",
      requestId
    );

    try {
      return await this.runAtomic(tx, async (runner, activeTx) => {
        const dup = await this.checkScopedIdempotency(runner, scopedKey, requestId);
        if (dup) {
          return dup;
        }

        const character = await this.lockCharacterByAccount(
          runner,
          cleanAccount,
          catalog
        );
        if (!character) {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_FOUND",
            messageVi: "Không tìm thấy nhân vật v0.2 của tài khoản này."
          };
        }

        if (character.identity.creationState !== "confirmed") {
          return {
            requestId,
            ok: false,
            code: "CHARACTER_NOT_CONFIRMED",
            messageVi: "Nhân vật ở trạng thái nháp không thể nhận EXP."
          };
        }

        const normalizedExpGrant =
          typeof params.expDelta === "number" &&
          Number.isSafeInteger(params.expDelta) &&
          params.expDelta >= 0
            ? BigInt(params.expDelta)
            : params.expDelta;

        const expRes = applyCandidateCharacterExpGrant(
          character.levelProgress,
          character.cultivation.realmId,
          normalizedExpGrant
        );
        if (!expRes.ok) {
          return {
            requestId,
            ok: false,
            code: expRes.code,
            messageVi: `Không thể cộng EXP cho nhân vật (${expRes.code}).`
          };
        }

        const statSnap = computeCandidateBaselineStatSnapshot({
          realmId: character.cultivation.realmId,
          realmStage: character.cultivation.realmStage,
          levelProgress: expRes.nextProgress,
          destiny: character.destiny,
          destinyCatalog: catalog
        });
        const maxHp = statSnap.ok
          ? statSnap.snapshot.derivedStats.maxHp
          : character.resources.currentHp;
        const maxMp = statSnap.ok
          ? statSnap.snapshot.derivedStats.maxMp
          : character.resources.currentMp;

        const nextState: CharacterV02PersistedState = {
          ...character,
          identity: {
            ...character.identity,
            revision: character.identity.revision + 1
          },
          levelProgress: expRes.nextProgress,
          resources: {
            currentHp: Math.min(character.resources.currentHp, maxHp),
            currentMp: Math.min(character.resources.currentMp, maxMp)
          },
          updatedAtMs: Math.max(nowMs, character.updatedAtMs)
        };

        const updated = await this.repository.updateCharacter(
          {
            expectedRevision: character.identity.revision,
            nextState
          },
          { destinyCatalog: catalog },
          activeTx
        );

        const result: CharacterV02ActionResultPayload = {
          requestId,
          ok: true,
          code: "OK",
          messageVi:
            expRes.levelsGained > 0
              ? `Nhận EXP thành công, thăng lên Cấp ${updated.levelProgress.level}.`
              : "Nhận EXP thành công.",
          character: toCharacterV02Snapshot(updated, catalog)
        };

        await this.recordScopedIdempotency(
          runner,
          scopedKey,
          updated.identity.characterId,
          "server_award_exp",
          result,
          nowMs
        );
        return result;
      });
    } catch (err) {
      if (err instanceof CharacterV02PersistenceError) {
        return {
          requestId,
          ok: false,
          code: err.code,
          messageVi: err.message
        };
      }
      throw err;
    }
  }

  async getActiveRollDraftForCharacter(
    accountId: string,
    characterId: string,
    nowMs = Date.now(),
    tx?: SqlTransaction
  ): Promise<DestinyRollDraft | null> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    const cleanChar = typeof characterId === "string" ? characterId.trim() : "";
    if (!cleanAccount || !cleanChar) {
      return null;
    }
    const runner = this.host.resolveQueryRunner(tx);
    const res = await runner.query<{
      roll_nonce: string;
      character_id: string;
      candidate_traits_json: [string, string, string];
      expires_at_ms: string | number;
    }>(
      `SELECT roll_nonce, character_id, candidate_traits_json, expires_at_ms
       FROM character_v02_roll_drafts
       WHERE account_id = $1
         AND character_id = $2
         AND status = 'active'
         AND expires_at_ms > $3
       ORDER BY issued_at_ms DESC
       LIMIT 1`,
      [cleanAccount, cleanChar, nowMs]
    );
    if (res.rows.length === 0) {
      return null;
    }
    const row = res.rows[0];
    return {
      characterCreationId: String(row.character_id),
      rollNonce: String(row.roll_nonce),
      candidateTraitIds: [
        row.candidate_traits_json[0],
        row.candidate_traits_json[1],
        row.candidate_traits_json[2]
      ],
      expiresAtMs: Number(row.expires_at_ms)
    };
  }

  async syncRuntimeWorldState(
    accountId: string,
    runtimeState: CharacterSaveState,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02SnapshotPayload | null> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
      return null;
    }
    const nowMs = this.resolveNowMs(options);
    const catalog = this.resolveCatalog(options);

    return this.runAtomic(tx, async (runner, activeTx) => {
      const character = await this.lockCharacterByAccount(
        runner,
        cleanAccount,
        catalog
      );
      if (!character || character.identity.creationState !== "confirmed") {
        return null;
      }

      const canAdoptRealm =
        isValidRealmStage(runtimeState.realmId, runtimeState.realmStage) &&
        isLevelAllowedForRealm(runtimeState.realmId, character.levelProgress.level);
      const nextRealmId = canAdoptRealm
        ? runtimeState.realmId
        : character.cultivation.realmId;
      const nextRealmStage = canAdoptRealm
        ? runtimeState.realmStage
        : character.cultivation.realmStage;
      const nextTuVi = String(Math.max(0, Math.floor(runtimeState.tuVi)));

      const statSnap = computeCandidateBaselineStatSnapshot({
        realmId: nextRealmId,
        realmStage: nextRealmStage,
        levelProgress: character.levelProgress,
        destiny: character.destiny,
        destinyCatalog: catalog
      });
      const maxHp = statSnap.ok
        ? statSnap.snapshot.derivedStats.maxHp
        : character.resources.currentHp;
      const maxMp = statSnap.ok
        ? statSnap.snapshot.derivedStats.maxMp
        : character.resources.currentMp;

      const nextState: CharacterV02PersistedState = {
        ...character,
        identity: {
          ...character.identity,
          revision: character.identity.revision + 1
        },
        cultivation: {
          realmId: nextRealmId,
          realmStage: nextRealmStage,
          tuVi: nextTuVi
        },
        resources: {
          currentHp: Math.max(0, Math.min(Math.round(runtimeState.hp), maxHp)),
          currentMp: Math.max(0, Math.min(Math.round(runtimeState.mp), maxMp))
        },
        world: {
          zoneId: runtimeState.zoneId,
          x: Math.round(runtimeState.x),
          y: Math.round(runtimeState.y),
          direction: runtimeState.direction,
          linhThach: Math.max(0, Math.round(runtimeState.linhThach)),
          equippedTitle: runtimeState.equippedTitle || character.world.equippedTitle,
          equippedInheritance: runtimeState.equippedInheritance ?? null,
          inventory: runtimeState.inventory.map((it) => ({ ...it })),
          quests: { ...runtimeState.quests },
          reputation: { ...runtimeState.reputation },
          buffs: runtimeState.buffs.map((b) => ({ ...b })),
          meditationStartedAtMs: Math.max(
            0,
            Math.round(runtimeState.meditationStartedAt)
          ),
          lastMeditationClaimAtMs: Math.max(
            0,
            Math.round(runtimeState.lastMeditationClaimAt)
          )
        },
        updatedAtMs: Math.max(nowMs, character.updatedAtMs)
      };

      const updated = await this.repository.updateCharacter(
        {
          expectedRevision: character.identity.revision,
          nextState
        },
        { destinyCatalog: catalog },
        activeTx
      );
      return toCharacterV02Snapshot(updated, catalog);
    });
  }
}
