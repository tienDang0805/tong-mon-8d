import type {
  ActiveBuff,
  BuffSlotCategory,
  CanonicalRealmId,
  CharacterCreationState,
  CharacterIdentity,
  CharacterLevelProgress,
  DestinyCollection,
  DestinyDefinitionMetadata,
  Direction,
  FoodQualityTier,
  InventoryItemStack,
  QuestProgressState,
  ZoneId
} from "@tong-mon-8d/shared";
import {
  computeCandidateBaselineStatSnapshot,
  createZeroBaseAttributes,
  getRealmLevelBand,
  isAtNonSaintMajorRealmLevelCap,
  isLevelAllowedForRealm,
  isNonNegativeDecimalIntString,
  isValidRealmStage,
  ITEMS_REGISTRY,
  MAX_SUPPORTED_EXP_BIGINT,
  parseExpDecimalString,
  TD01_CANDIDATE_RULESET_VERSION,
  validateCharacterLevelProgress,
  ZONES_REGISTRY
} from "@tong-mon-8d/game-data";
import { validateDestinyCollectionStructure } from "../destiny/DestinyOwnership.js";

export const CHARACTER_V02_SCHEMA_VERSION = 2 as const;

const VALID_DIRECTIONS: readonly Direction[] = Object.freeze([
  "down",
  "left",
  "right",
  "up"
]);

const VALID_FOOD_QUALITIES: readonly FoodQualityTier[] = Object.freeze([
  "binh_thuong",
  "ngon_mieng",
  "thuong_pham",
  "cuc_pham",
  "tien_tru",
  "thanh_yen"
]);

const VALID_BUFF_SLOTS: readonly BuffSlotCategory[] = Object.freeze([
  "meal",
  "beverage",
  "pill",
  "blessing"
]);

export type CharacterV02ErrorCode =
  | "INVALID_STATE_OBJECT"
  | "INVALID_SCHEMA_VERSION"
  | "INVALID_RULESET_VERSION"
  | "INVALID_UPDATED_AT"
  | "INVALID_IDENTITY"
  | "INVALID_LEVEL_PROGRESS"
  | "EXP_NUMERIC_OVERFLOW"
  | "NON_ZERO_EXP_AT_REALM_CAP"
  | "INVALID_CULTIVATION_STATE"
  | "LEVEL_NOT_ALLOWED_FOR_REALM"
  | "INVALID_DRAFT_PROGRESSION_STATE"
  | "INVALID_DESTINY_STATE"
  | "INVALID_COMBAT_RESOURCES"
  | "INVALID_WORLD_STATE"
  | "INVALID_INITIAL_REVISION"
  | "DUPLICATE_CHARACTER_ID"
  | "DUPLICATE_ACCOUNT_CHARACTER"
  | "CHARACTER_NOT_FOUND"
  | "REVISION_MISMATCH"
  | "REVISION_CONFLICT"
  | "IMMUTABLE_IDENTITY_VIOLATION"
  | "IMMUTABLE_CREATION_STATE_VIOLATION"
  | "IMMUTABLE_INNATE_DESTINY_VIOLATION"
  | "DESTINY_REVISION_REGRESSION"
  | "CORRUPTED_PERSISTED_STATE";

export class CharacterV02PersistenceError extends Error {
  readonly code: CharacterV02ErrorCode;

  constructor(
    code: CharacterV02ErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "CharacterV02PersistenceError";
    this.code = code;
  }
}

export interface CharacterV02CultivationState {
  realmId: CanonicalRealmId;
  realmStage: number;
  tuVi: string;
}

export interface CharacterV02CombatResources {
  currentHp: number;
  currentMp: number;
}

export interface CharacterV02WorldAndEconomyState {
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  linhThach: number;
  equippedTitle: string;
  equippedInheritance: string | null;
  inventory: InventoryItemStack[];
  quests: Record<string, QuestProgressState>;
  reputation: Record<string, number>;
  buffs: ActiveBuff[];
  meditationStartedAtMs: number;
  lastMeditationClaimAtMs: number;
}

export interface CharacterV02PersistedState {
  schemaVersion: typeof CHARACTER_V02_SCHEMA_VERSION;
  rulesetVersion: string;
  identity: CharacterIdentity;
  levelProgress: CharacterLevelProgress;
  cultivation: CharacterV02CultivationState;
  destiny: DestinyCollection | null;
  resources: CharacterV02CombatResources;
  world: CharacterV02WorldAndEconomyState;
  updatedAtMs: number;
}

export interface CharacterV02ValidationOptions {
  destinyCatalog?: Readonly<Record<string, DestinyDefinitionMetadata>>;
}

export type CharacterV02ValidationResult =
  | {
      ok: true;
      value: CharacterV02PersistedState;
    }
  | {
      ok: false;
      code: CharacterV02ErrorCode;
      detail: string;
    };

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function isNonEmptyTrimmedString(value: unknown, maxLength: number): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed === value && value.length <= maxLength;
}

export function isPositiveSafeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function isNonNegativeSafeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export const FORBIDDEN_CLIENT_PAYLOAD_KEYS = new Set<string>([
  "accountId",
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

export function validateAllowedClientIntentKeys(
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

function validateWorldAndEconomyState(
  world: unknown
): { ok: true; value: CharacterV02WorldAndEconomyState } | { ok: false; detail: string } {
  if (typeof world !== "object" || world === null || Array.isArray(world)) {
    return { ok: false, detail: "world state must be an object." };
  }
  const w = world as Record<string, unknown>;
  if (typeof w.zoneId !== "string" || !Object.prototype.hasOwnProperty.call(ZONES_REGISTRY, w.zoneId)) {
    return { ok: false, detail: "world.zoneId must be a canonical ZoneId." };
  }
  const zoneId = w.zoneId as ZoneId;
  if (typeof w.x !== "number" || !Number.isSafeInteger(w.x)) {
    return { ok: false, detail: "world.x must be a safe integer." };
  }
  if (typeof w.y !== "number" || !Number.isSafeInteger(w.y)) {
    return { ok: false, detail: "world.y must be a safe integer." };
  }
  if (
    typeof w.direction !== "string" ||
    !(VALID_DIRECTIONS as readonly string[]).includes(w.direction)
  ) {
    return { ok: false, detail: "world.direction is invalid." };
  }
  const direction = w.direction as Direction;
  if (!isNonNegativeSafeInt(w.linhThach)) {
    return { ok: false, detail: "world.linhThach must be a non-negative safe integer." };
  }
  if (!isNonEmptyTrimmedString(w.equippedTitle, 96)) {
    return { ok: false, detail: "world.equippedTitle must be a non-empty trimmed string." };
  }
  if (w.equippedInheritance !== null && !isNonEmptyTrimmedString(w.equippedInheritance, 64)) {
    return {
      ok: false,
      detail: "world.equippedInheritance must be null or a non-empty trimmed string."
    };
  }
  if (!Array.isArray(w.inventory)) {
    return { ok: false, detail: "world.inventory must be an array." };
  }
  const inventory: InventoryItemStack[] = [];
  for (const rawItem of w.inventory) {
    if (typeof rawItem !== "object" || rawItem === null || Array.isArray(rawItem)) {
      return { ok: false, detail: "inventory entry must be an object." };
    }
    const item = rawItem as Record<string, unknown>;
    if (
      typeof item.itemId !== "string" ||
      !Object.prototype.hasOwnProperty.call(ITEMS_REGISTRY, item.itemId)
    ) {
      return { ok: false, detail: "inventory itemId must exist in ITEMS_REGISTRY." };
    }
    if (!isPositiveSafeInt(item.quantity)) {
      return { ok: false, detail: "inventory quantity must be a positive safe integer." };
    }
    if (
      item.quality !== undefined &&
      (typeof item.quality !== "string" ||
        !(VALID_FOOD_QUALITIES as readonly string[]).includes(item.quality))
    ) {
      return { ok: false, detail: "inventory item quality is invalid." };
    }
    const clonedStack: InventoryItemStack = {
      itemId: item.itemId,
      quantity: item.quantity
    };
    if (item.quality !== undefined) {
      clonedStack.quality = item.quality as FoodQualityTier;
    }
    inventory.push(clonedStack);
  }

  if (typeof w.quests !== "object" || w.quests === null || Array.isArray(w.quests)) {
    return { ok: false, detail: "world.quests must be an object map." };
  }
  const quests: Record<string, QuestProgressState> = {};
  for (const [qKey, rawQ] of Object.entries(w.quests as Record<string, unknown>)) {
    if (!isNonEmptyTrimmedString(qKey, 128)) {
      return { ok: false, detail: "quest key must be a non-empty string." };
    }
    if (typeof rawQ !== "object" || rawQ === null || Array.isArray(rawQ)) {
      return { ok: false, detail: "quest progress entry must be an object." };
    }
    const q = rawQ as Record<string, unknown>;
    if (q.questId !== qKey) {
      return { ok: false, detail: "questProgress.questId must match its map key." };
    }
    if (q.status !== "not_started" && q.status !== "active" && q.status !== "completed") {
      return { ok: false, detail: "questProgress.status is invalid." };
    }
    if (!isNonNegativeSafeInt(q.stepIndex) || !isNonNegativeSafeInt(q.objectiveCount)) {
      return { ok: false, detail: "questProgress stepIndex and objectiveCount must be >= 0." };
    }
    if (q.completedAt !== undefined && !isPositiveSafeInt(q.completedAt)) {
      return { ok: false, detail: "questProgress.completedAt must be a positive safe integer." };
    }
    const clonedQuest: QuestProgressState = {
      questId: qKey,
      status: q.status,
      stepIndex: q.stepIndex,
      objectiveCount: q.objectiveCount
    };
    if (q.completedAt !== undefined) {
      clonedQuest.completedAt = q.completedAt;
    }
    quests[qKey] = clonedQuest;
  }

  if (typeof w.reputation !== "object" || w.reputation === null || Array.isArray(w.reputation)) {
    return { ok: false, detail: "world.reputation must be an object map." };
  }
  const reputation: Record<string, number> = {};
  for (const [npcId, rawRep] of Object.entries(w.reputation as Record<string, unknown>)) {
    if (!isNonEmptyTrimmedString(npcId, 64) || !isNonNegativeSafeInt(rawRep)) {
      return { ok: false, detail: "reputation entries must map NPC ID to non-negative integer." };
    }
    reputation[npcId] = rawRep;
  }

  if (!Array.isArray(w.buffs)) {
    return { ok: false, detail: "world.buffs must be an array." };
  }
  const buffs: ActiveBuff[] = [];
  for (const rawBuff of w.buffs) {
    if (typeof rawBuff !== "object" || rawBuff === null || Array.isArray(rawBuff)) {
      return { ok: false, detail: "buff entry must be an object." };
    }
    const b = rawBuff as Record<string, unknown>;
    if (
      !isNonEmptyTrimmedString(b.buffId, 128) ||
      !isNonEmptyTrimmedString(b.name, 128) ||
      typeof b.slot !== "string" ||
      !(VALID_BUFF_SLOTS as readonly string[]).includes(b.slot) ||
      typeof b.attackBonus !== "number" ||
      !Number.isSafeInteger(b.attackBonus) ||
      typeof b.defenseBonus !== "number" ||
      !Number.isSafeInteger(b.defenseBonus) ||
      typeof b.hpBonus !== "number" ||
      !Number.isSafeInteger(b.hpBonus) ||
      typeof b.tuViMultiplier !== "number" ||
      !Number.isFinite(b.tuViMultiplier) ||
      b.tuViMultiplier <= 0 ||
      !isPositiveSafeInt(b.expiresAt)
    ) {
      return { ok: false, detail: "buff entry has invalid fields." };
    }
    buffs.push({
      buffId: b.buffId,
      name: b.name,
      slot: b.slot as BuffSlotCategory,
      attackBonus: b.attackBonus,
      defenseBonus: b.defenseBonus,
      hpBonus: b.hpBonus,
      tuViMultiplier: b.tuViMultiplier,
      expiresAt: b.expiresAt
    });
  }

  if (
    !isNonNegativeSafeInt(w.meditationStartedAtMs) ||
    !isNonNegativeSafeInt(w.lastMeditationClaimAtMs)
  ) {
    return {
      ok: false,
      detail: "meditationStartedAtMs and lastMeditationClaimAtMs must be non-negative safe integers."
    };
  }

  return {
    ok: true,
    value: {
      zoneId,
      x: w.x,
      y: w.y,
      direction,
      linhThach: w.linhThach,
      equippedTitle: w.equippedTitle,
      equippedInheritance: (w.equippedInheritance as string | null) ?? null,
      inventory,
      quests,
      reputation,
      buffs,
      meditationStartedAtMs: w.meditationStartedAtMs,
      lastMeditationClaimAtMs: w.lastMeditationClaimAtMs
    }
  };
}

export function validateCharacterV02PersistedState(
  state: unknown,
  options?: CharacterV02ValidationOptions
): CharacterV02ValidationResult {
  if (typeof state !== "object" || state === null || Array.isArray(state)) {
    return {
      ok: false,
      code: "INVALID_STATE_OBJECT",
      detail: "Character v0.2 state must be a non-null object."
    };
  }
  const s = state as Record<string, unknown>;
  if (s.schemaVersion !== CHARACTER_V02_SCHEMA_VERSION) {
    return {
      ok: false,
      code: "INVALID_SCHEMA_VERSION",
      detail: `schemaVersion must equal ${CHARACTER_V02_SCHEMA_VERSION}.`
    };
  }
  if (!isNonEmptyTrimmedString(s.rulesetVersion, 64)) {
    return {
      ok: false,
      code: "INVALID_RULESET_VERSION",
      detail: "rulesetVersion must be a non-empty trimmed string."
    };
  }
  if (!isPositiveSafeInt(s.updatedAtMs)) {
    return {
      ok: false,
      code: "INVALID_UPDATED_AT",
      detail: "updatedAtMs must be a positive safe integer."
    };
  }

  if (typeof s.identity !== "object" || s.identity === null || Array.isArray(s.identity)) {
    return {
      ok: false,
      code: "INVALID_IDENTITY",
      detail: "identity must be an object."
    };
  }
  const idObj = s.identity as Record<string, unknown>;
  if (
    !isNonEmptyTrimmedString(idObj.characterId, 128) ||
    !isNonEmptyTrimmedString(idObj.accountId, 128) ||
    !isNonEmptyTrimmedString(idObj.name, 48) ||
    !isNonEmptyTrimmedString(idObj.appearanceId, 64) ||
    !isPositiveSafeInt(idObj.createdAtMs) ||
    (idObj.creationState !== "draft" && idObj.creationState !== "confirmed") ||
    !isPositiveSafeInt(idObj.revision)
  ) {
    return {
      ok: false,
      code: "INVALID_IDENTITY",
      detail: "identity fields are invalid."
    };
  }
  if (s.updatedAtMs < idObj.createdAtMs) {
    return {
      ok: false,
      code: "INVALID_UPDATED_AT",
      detail: "updatedAtMs cannot be earlier than identity.createdAtMs."
    };
  }

  const lpCheck = validateCharacterLevelProgress(s.levelProgress);
  if (!lpCheck.ok) {
    return {
      ok: false,
      code: "INVALID_LEVEL_PROGRESS",
      detail: `levelProgress validation failed: ${lpCheck.code}`
    };
  }
  const validLp = s.levelProgress as CharacterLevelProgress;
  const expBigInt = parseExpDecimalString(validLp.expTowardNext);
  if (expBigInt === null || expBigInt > MAX_SUPPORTED_EXP_BIGINT) {
    return {
      ok: false,
      code: "EXP_NUMERIC_OVERFLOW",
      detail: "expTowardNext exceeds NUMERIC(38,0) bounds."
    };
  }

  if (typeof s.cultivation !== "object" || s.cultivation === null || Array.isArray(s.cultivation)) {
    return {
      ok: false,
      code: "INVALID_CULTIVATION_STATE",
      detail: "cultivation must be an object."
    };
  }
  const cult = s.cultivation as Record<string, unknown>;
  const band = getRealmLevelBand(cult.realmId);
  if (!band || !isValidRealmStage(band.realmId, cult.realmStage)) {
    return {
      ok: false,
      code: "INVALID_CULTIVATION_STATE",
      detail: "cultivation.realmId or cultivation.realmStage is invalid."
    };
  }
  if (!isNonNegativeDecimalIntString(cult.tuVi)) {
    return {
      ok: false,
      code: "INVALID_CULTIVATION_STATE",
      detail: "cultivation.tuVi must be a non-negative integer decimal string."
    };
  }
  const tuViBigInt = parseExpDecimalString(cult.tuVi);
  if (tuViBigInt === null || tuViBigInt > MAX_SUPPORTED_EXP_BIGINT) {
    return {
      ok: false,
      code: "INVALID_CULTIVATION_STATE",
      detail: "cultivation.tuVi exceeds NUMERIC(38,0) bounds."
    };
  }
  if (!isLevelAllowedForRealm(band.realmId, validLp.level)) {
    return {
      ok: false,
      code: "LEVEL_NOT_ALLOWED_FOR_REALM",
      detail: `Level ${validLp.level} is outside the allowed band for realm ${band.realmId}.`
    };
  }
  if (isAtNonSaintMajorRealmLevelCap(band.realmId, validLp.level) && expBigInt !== 0n) {
    return {
      ok: false,
      code: "NON_ZERO_EXP_AT_REALM_CAP",
      detail: "expTowardNext must be '0' when at a non-Saint major realm Level cap."
    };
  }

  const creationState = idObj.creationState as CharacterCreationState;
  let validatedDestiny: DestinyCollection | null = null;
  if (creationState === "draft") {
    if (s.destiny !== null && s.destiny !== undefined) {
      return {
        ok: false,
        code: "INVALID_DESTINY_STATE",
        detail: "Draft characters cannot persist a confirmed DestinyCollection."
      };
    }
    if (
      validLp.level !== 1 ||
      validLp.expTowardNext !== "0" ||
      band.realmId !== "pham_nhan" ||
      cult.realmStage !== 1 ||
      cult.tuVi !== "0"
    ) {
      return {
        ok: false,
        code: "INVALID_DRAFT_PROGRESSION_STATE",
        detail: "Draft characters must remain at Level 1 Phàm Nhân stage 1 with 0 EXP and 0 Tu Vi."
      };
    }
  } else {
    const destinyCheck = validateDestinyCollectionStructure(s.destiny, options?.destinyCatalog);
    if (!destinyCheck.ok) {
      return {
        ok: false,
        code: "INVALID_DESTINY_STATE",
        detail: destinyCheck.detail
      };
    }
    validatedDestiny = destinyCheck.value;
  }

  if (typeof s.resources !== "object" || s.resources === null || Array.isArray(s.resources)) {
    return {
      ok: false,
      code: "INVALID_COMBAT_RESOURCES",
      detail: "resources must be an object."
    };
  }
  const resObj = s.resources as Record<string, unknown>;
  if (!isNonNegativeSafeInt(resObj.currentHp) || !isNonNegativeSafeInt(resObj.currentMp)) {
    return {
      ok: false,
      code: "INVALID_COMBAT_RESOURCES",
      detail: "currentHp and currentMp must be non-negative safe integers."
    };
  }

  const worldCheck = validateWorldAndEconomyState(s.world);
  if (!worldCheck.ok) {
    return {
      ok: false,
      code: "INVALID_WORLD_STATE",
      detail: worldCheck.detail
    };
  }

  return {
    ok: true,
    value: {
      schemaVersion: CHARACTER_V02_SCHEMA_VERSION,
      rulesetVersion: s.rulesetVersion,
      identity: {
        characterId: idObj.characterId,
        accountId: idObj.accountId,
        name: idObj.name,
        appearanceId: idObj.appearanceId,
        createdAtMs: idObj.createdAtMs,
        creationState,
        revision: idObj.revision
      },
      levelProgress: {
        level: validLp.level,
        expTowardNext: validLp.expTowardNext,
        freeAttributePoints: validLp.freeAttributePoints,
        allocated: { ...validLp.allocated },
        earnedPermanent: { ...validLp.earnedPermanent }
      },
      cultivation: {
        realmId: band.realmId,
        realmStage: cult.realmStage as number,
        tuVi: cult.tuVi
      },
      destiny: validatedDestiny,
      resources: {
        currentHp: resObj.currentHp,
        currentMp: resObj.currentMp
      },
      world: worldCheck.value,
      updatedAtMs: s.updatedAtMs
    }
  };
}

export interface CreateInitialCharacterV02Params {
  characterId: string;
  accountId: string;
  name: string;
  appearanceId?: string;
  createdAtMs?: number;
  creationState?: CharacterCreationState;
  destiny?: DestinyCollection | null;
  rulesetVersion?: string;
}

export function createInitialCharacterV02State(
  params: CreateInitialCharacterV02Params
): CharacterV02PersistedState {
  const nowMs = params.createdAtMs ?? Date.now();
  const creationState: CharacterCreationState = params.creationState ?? "draft";
  const levelProgress: CharacterLevelProgress = {
    level: 1,
    expTowardNext: "0",
    freeAttributePoints: 0,
    allocated: createZeroBaseAttributes(),
    earnedPermanent: createZeroBaseAttributes()
  };
  const statSnap = computeCandidateBaselineStatSnapshot({
    realmId: "pham_nhan",
    realmStage: 1,
    levelProgress
  });
  const initialHp = statSnap.ok ? statSnap.snapshot.derivedStats.maxHp : 220;
  const initialMp = statSnap.ok ? statSnap.snapshot.derivedStats.maxMp : 140;
  const spawn = ZONES_REGISTRY.tan_thu_thon.defaultSpawn;

  return {
    schemaVersion: CHARACTER_V02_SCHEMA_VERSION,
    rulesetVersion: params.rulesetVersion ?? TD01_CANDIDATE_RULESET_VERSION,
    identity: {
      characterId: params.characterId,
      accountId: params.accountId,
      name: params.name,
      appearanceId: params.appearanceId ?? "hero_kiem_tu",
      createdAtMs: nowMs,
      creationState,
      revision: 1
    },
    levelProgress,
    cultivation: {
      realmId: "pham_nhan",
      realmStage: 1,
      tuVi: "0"
    },
    destiny: creationState === "confirmed" ? (params.destiny ?? null) : null,
    resources: {
      currentHp: initialHp,
      currentMp: initialMp
    },
    world: {
      zoneId: "tan_thu_thon",
      x: spawn.x,
      y: spawn.y,
      direction: "down",
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
      meditationStartedAtMs: nowMs,
      lastMeditationClaimAtMs: nowMs
    },
    updatedAtMs: nowMs
  };
}
