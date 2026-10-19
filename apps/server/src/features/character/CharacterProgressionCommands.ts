import type {
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  DestinyCollection,
  DestinyDefinitionMetadata
} from "@tong-mon-8d/shared";
import {
  allocateSingleAttributePoint,
  applyCandidateCharacterExpGrant,
  computeCandidateBaselineStatSnapshot,
  isLevelAllowedForRealm,
  isValidRealmStage,
  validateDestinyCollection
} from "@tong-mon-8d/game-data";
import type { SqlTransaction } from "../../infrastructure/database/DbPorts.js";
import {
  buildScopedV02IdempotencyKey,
  checkScopedV02Idempotency,
  recordScopedV02Idempotency
} from "../../infrastructure/idempotency/RequestReceiptStore.js";
import type { AtomicV02Runner } from "./CharacterCreationCommands.js";
import type { CharacterV02Repository } from "./CharacterRepository.js";
import type {
  ServerOnlyAwardCharacterExpParams,
  ServerOnlyGrantAcquiredDestinyParams
} from "./CharacterService.js";
import { toCharacterV02Snapshot } from "./CharacterSnapshot.js";
import {
  CharacterV02PersistenceError,
  isNonEmptyTrimmedString,
  validateAllowedClientIntentKeys,
  type CharacterV02PersistedState
} from "./CharacterValidation.js";

export async function executeAllocateAttributePoint(params: {
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
    "attributeId",
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
  const scopedKey = buildScopedV02IdempotencyKey(
    cleanAccount,
    "allocate_attribute",
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
          preferredCreationState: "confirmed"
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
        messageVi: "Đã phân bổ +1 điểm thuộc tính thành công.",
        character: toCharacterV02Snapshot(updated, catalog)
      };

      await recordScopedV02Idempotency(
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

export async function executeEquipAcquiredDestinyTrait(params: {
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
    "slotIndex",
    "traitId",
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
  const requestedCharId = payload.characterId;
  const keyCharId =
    typeof requestedCharId === "string" ? requestedCharId.trim() : "";

  const scopedKey = buildScopedV02IdempotencyKey(
    cleanAccount,
    "equip_destiny",
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
          preferredCreationState: "confirmed"
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
        messageVi: "Đã gắn Hậu Thiên Khí Vận vào ô kích hoạt.",
        character: toCharacterV02Snapshot(updated, catalog)
      };

      await recordScopedV02Idempotency(
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

export async function executeUnequipAcquiredDestinyTrait(params: {
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
    "slotIndex",
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
  const requestedCharId = payload.characterId;
  const keyCharId =
    typeof requestedCharId === "string" ? requestedCharId.trim() : "";

  const scopedKey = buildScopedV02IdempotencyKey(
    cleanAccount,
    "unequip_destiny",
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
          preferredCreationState: "confirmed"
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
        messageVi: "Đã tháo Hậu Thiên Khí Vận khỏi ô kích hoạt (vẫn giữ sở hữu).",
        character: toCharacterV02Snapshot(updated, catalog)
      };

      await recordScopedV02Idempotency(
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

export async function executeGrantAcquiredDestinyTraitServerOnly(params: {
  runAtomic: AtomicV02Runner;
  repository: CharacterV02Repository;
  grantParams: ServerOnlyGrantAcquiredDestinyParams;
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>;
  nowMs: number;
  tx?: SqlTransaction;
}): Promise<CharacterV02ActionResultPayload> {
  const { runAtomic, repository, grantParams, catalog, nowMs, tx } = params;
  const cleanAccount =
    typeof grantParams?.accountId === "string" ? grantParams.accountId.trim() : "";
  const requestId =
    typeof grantParams?.requestId === "string" ? grantParams.requestId.trim() : "";
  const traitId =
    typeof grantParams?.traitId === "string" ? grantParams.traitId.trim() : "";
  const requestedCharId = grantParams?.characterId;
  const keyCharId =
    typeof requestedCharId === "string" ? requestedCharId.trim() : "";

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

  const scopedKey = buildScopedV02IdempotencyKey(
    cleanAccount,
    "server_grant_destiny",
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
          preferredCreationState: "confirmed"
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
        messageVi: "Máy chủ đã cấp Hậu Thiên Khí Vận vào bộ sưu tập.",
        character: toCharacterV02Snapshot(updated, catalog)
      };

      await recordScopedV02Idempotency(
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

export async function executeAwardCharacterExpServerOnly(params: {
  runAtomic: AtomicV02Runner;
  repository: CharacterV02Repository;
  awardParams: ServerOnlyAwardCharacterExpParams;
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>;
  nowMs: number;
  tx?: SqlTransaction;
}): Promise<CharacterV02ActionResultPayload> {
  const { runAtomic, repository, awardParams, catalog, nowMs, tx } = params;
  const cleanAccount =
    typeof awardParams?.accountId === "string" ? awardParams.accountId.trim() : "";
  const requestId =
    typeof awardParams?.requestId === "string" ? awardParams.requestId.trim() : "";
  const requestedCharId = awardParams?.characterId;
  const keyCharId =
    typeof requestedCharId === "string" ? requestedCharId.trim() : "";
  if (!isNonEmptyTrimmedString(cleanAccount, 128) || !isNonEmptyTrimmedString(requestId, 128)) {
    return {
      requestId,
      ok: false,
      code: "INVALID_INTENT_PAYLOAD",
      messageVi: "Thông tin cấp EXP máy chủ không hợp lệ."
    };
  }

  const scopedKey = buildScopedV02IdempotencyKey(
    cleanAccount,
    "server_award_exp",
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
          preferredCreationState: "confirmed"
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

      if (character.identity.creationState !== "confirmed") {
        return {
          requestId,
          ok: false,
          code: "CHARACTER_NOT_CONFIRMED",
          messageVi: "Nhân vật ở trạng thái nháp không thể nhận EXP."
        };
      }

      const normalizedExpGrant =
        typeof awardParams.expDelta === "number" &&
        Number.isSafeInteger(awardParams.expDelta) &&
        awardParams.expDelta >= 0
          ? BigInt(awardParams.expDelta)
          : awardParams.expDelta;

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
        messageVi:
          expRes.levelsGained > 0
            ? `Nhận EXP thành công, thăng lên Cấp ${updated.levelProgress.level}.`
            : "Nhận EXP thành công.",
        character: toCharacterV02Snapshot(updated, catalog)
      };

      await recordScopedV02Idempotency(
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

export async function executeSyncRuntimeWorldState(params: {
  runAtomic: AtomicV02Runner;
  repository: CharacterV02Repository;
  accountId: string;
  runtimeState: CharacterSaveState;
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>;
  nowMs: number;
  tx?: SqlTransaction;
}): Promise<CharacterV02SnapshotPayload | null> {
  const { runAtomic, repository, accountId, runtimeState, catalog, nowMs, tx } = params;
  const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
  if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
    return null;
  }

  return runAtomic(tx, async (runner, activeTx) => {
    const explicitCharId =
      typeof runtimeState?.characterId === "string" &&
      runtimeState.characterId.startsWith("char_v02_")
        ? runtimeState.characterId.trim()
        : undefined;

    const character = explicitCharId
      ? await repository.lockByCharacterId(runner, explicitCharId, {
          destinyCatalog: catalog
        })
      : await repository.lockByAccountId(runner, cleanAccount, {
          destinyCatalog: catalog,
          preferredCreationState: "confirmed"
        });

    if (
      !character ||
      character.identity.accountId !== cleanAccount ||
      character.identity.creationState !== "confirmed"
    ) {
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

    const updated = await repository.updateCharacter(
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
