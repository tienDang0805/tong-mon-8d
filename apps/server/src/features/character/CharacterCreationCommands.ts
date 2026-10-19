import crypto from "node:crypto";
import type {
  CharacterV02ActionResultPayload,
  DestinyCollection,
  DestinyDefinitionMetadata,
  DestinyRollDraft
} from "@tong-mon-8d/shared";
import {
  computeCandidateBaselineStatSnapshot,
  isApprovedCharacterV02AppearanceId,
  TD01_CANDIDATE_RULESET_VERSION
} from "@tong-mon-8d/game-data";
import type {
  SqlQueryRunner,
  SqlTransaction
} from "../../infrastructure/database/DbPorts.js";
import {
  buildScopedV02IdempotencyKey,
  checkScopedV02Idempotency,
  insertActionReceipt,
  readActionReceipt,
  recordScopedV02Idempotency
} from "../../infrastructure/idempotency/RequestReceiptStore.js";
import { rollInnateDestinyTripleFromCatalog } from "../destiny/DestinyRoller.js";
import type { CharacterV02Repository } from "./CharacterRepository.js";
import { toCharacterV02Snapshot } from "./CharacterSnapshot.js";
import {
  CharacterV02PersistenceError,
  createInitialCharacterV02State,
  isNonEmptyTrimmedString,
  validateAllowedClientIntentKeys,
  type CharacterV02PersistedState
} from "./CharacterValidation.js";
import type { CharacterV02ActionOptions } from "./CharacterService.js";

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

export const CHARACTER_V02_ROLL_DRAFTS_INDEX_DDL = `
  CREATE INDEX IF NOT EXISTS idx_character_v02_roll_drafts_account_char
    ON character_v02_roll_drafts (account_id, character_id);
`;

export const DEFAULT_ROLL_DRAFT_TTL_MS = 15 * 60 * 1000;

export type AtomicV02Runner = <T>(
  tx: SqlTransaction | undefined,
  fn: (runner: SqlQueryRunner, activeTx: SqlTransaction) => Promise<T>
) => Promise<T>;

export async function executeCreateCharacterDraft(params: {
  runAtomic: AtomicV02Runner;
  repository: CharacterV02Repository;
  accountId: string;
  rawIntent: unknown;
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>;
  nowMs: number;
  tx?: SqlTransaction;
}): Promise<CharacterV02ActionResultPayload> {
  const { runAtomic, repository, accountId, rawIntent, catalog, nowMs, tx } = params;
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

  try {
    return await runAtomic(tx, async (runner, activeTx) => {
      const priorReceipt = await readActionReceipt(
        runner,
        cleanAccount,
        "create_draft",
        requestId
      );
      if (priorReceipt) {
        return priorReceipt;
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

      const created = await repository.createCharacter(
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

      await insertActionReceipt(runner, {
        accountId: cleanAccount,
        characterId: created.identity.characterId,
        actionType: "create_draft",
        requestId,
        responseJson: result,
        createdAtMs: nowMs
      });
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

export async function executeRollInnateDestiny(params: {
  runAtomic: AtomicV02Runner;
  repository: CharacterV02Repository;
  accountId: string;
  rawIntent: unknown;
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>;
  nowMs: number;
  options?: CharacterV02ActionOptions;
  tx?: SqlTransaction;
}): Promise<CharacterV02ActionResultPayload> {
  const { runAtomic, repository, accountId, rawIntent, catalog, nowMs, options, tx } = params;
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
    "characterId"
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
  const requestedCharId = payload.characterId;
  const keyCharId =
    typeof requestedCharId === "string" ? requestedCharId.trim() : "";
  const ttlMs = options?.rollDraftTtlMs ?? DEFAULT_ROLL_DRAFT_TTL_MS;
  const scopedKey = buildScopedV02IdempotencyKey(
    cleanAccount,
    "roll_innate",
    requestId,
    keyCharId
  );

  return runAtomic(tx, async (runner) => {
    const dup = await checkScopedV02Idempotency(runner, scopedKey, requestId);
    if (dup) {
      return dup;
    }

    const targetRes = await repository.resolveLockedTargetCharacter(
      runner,
      cleanAccount,
      requestedCharId,
      {
        destinyCatalog: catalog,
        preferredCreationState: "draft"
      }
    );
    if (!targetRes.ok) {
      return {
        requestId,
        ok: false,
        code: targetRes.code,
        messageVi: targetRes.messageVi
      };
    }
    const character = targetRes.character;

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

    await recordScopedV02Idempotency(
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

export async function executeConfirmInnateDestiny(params: {
  runAtomic: AtomicV02Runner;
  repository: CharacterV02Repository;
  accountId: string;
  rawIntent: unknown;
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>;
  nowMs: number;
  tx?: SqlTransaction;
}): Promise<CharacterV02ActionResultPayload> {
  const { runAtomic, repository, accountId, rawIntent, catalog, nowMs, tx } = params;
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
    "rollNonce",
    "characterId"
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
  const requestedCharId = payload.characterId;
  const keyCharId =
    typeof requestedCharId === "string" ? requestedCharId.trim() : "";
  const scopedKey = buildScopedV02IdempotencyKey(
    cleanAccount,
    "confirm_innate",
    requestId,
    keyCharId
  );

  try {
    return await runAtomic(tx, async (runner, activeTx) => {
      const dup = await checkScopedV02Idempotency(runner, scopedKey, requestId);
      if (dup) {
        return dup;
      }

      const targetRes = await repository.resolveLockedTargetCharacter(
        runner,
        cleanAccount,
        requestedCharId,
        {
          destinyCatalog: catalog,
          preferredCreationState: "draft"
        }
      );
      if (!targetRes.ok) {
        return {
          requestId,
          ok: false,
          code: targetRes.code,
          messageVi: targetRes.messageVi
        };
      }
      let character = targetRes.character;

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
        requestedCharId === undefined &&
        String(draftRow.account_id) === cleanAccount &&
        String(draftRow.character_id) !== character.identity.characterId
      ) {
        const matchedChar = await repository.lockByCharacterId(
          runner,
          String(draftRow.character_id),
          { destinyCatalog: catalog }
        );
        if (matchedChar && matchedChar.identity.accountId === cleanAccount) {
          character = matchedChar;
        }
      }
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

      const updated = await repository.updateCharacter(
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

      await recordScopedV02Idempotency(
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

export async function queryActiveRollDraftForCharacter(
  runner: SqlQueryRunner,
  accountId: string,
  characterId: string,
  nowMs: number
): Promise<DestinyRollDraft | null> {
  const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
  const cleanChar = typeof characterId === "string" ? characterId.trim() : "";
  if (!cleanAccount || !cleanChar) {
    return null;
  }
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
