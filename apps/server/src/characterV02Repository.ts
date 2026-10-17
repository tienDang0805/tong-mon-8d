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
  validateDestinyCollection,
  ZONES_REGISTRY
} from "@tong-mon-8d/game-data";
import type { SqlQueryRunner, SqlTransaction } from "./db.js";

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

function isNonEmptyTrimmedString(value: unknown, maxLength: number): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed === value && value.length <= maxLength;
}

function isPositiveSafeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeSafeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function validateDestinyCollectionStructure(
  destiny: unknown,
  destinyCatalog?: Readonly<Record<string, DestinyDefinitionMetadata>>
): { ok: true; value: DestinyCollection } | { ok: false; detail: string } {
  if (typeof destiny !== "object" || destiny === null || Array.isArray(destiny)) {
    return { ok: false, detail: "destiny must be a non-null object when confirmed." };
  }
  const raw = destiny as Record<string, unknown>;
  if (!Array.isArray(raw.innate) || raw.innate.length !== 3) {
    return { ok: false, detail: "destiny.innate must be a 3-element tuple." };
  }
  const innateSet = new Set<string>();
  const innateTuple: [string, string, string] = ["", "", ""];
  for (let i = 0; i < 3; i += 1) {
    const id = raw.innate[i];
    if (!isNonEmptyTrimmedString(id, 128)) {
      return { ok: false, detail: "destiny.innate trait IDs must be non-empty strings." };
    }
    if (innateSet.has(id)) {
      return { ok: false, detail: "destiny.innate cannot contain duplicate trait IDs." };
    }
    innateSet.add(id);
    innateTuple[i] = id;
  }
  if (!isPositiveSafeInt(raw.innateConfirmedAtMs)) {
    return { ok: false, detail: "destiny.innateConfirmedAtMs must be a positive safe integer." };
  }
  if (!isPositiveSafeInt(raw.collectionRevision)) {
    return { ok: false, detail: "destiny.collectionRevision must be a positive safe integer." };
  }
  if (!Array.isArray(raw.acquiredTraitIds)) {
    return { ok: false, detail: "destiny.acquiredTraitIds must be an array." };
  }
  const acquiredSet = new Set<string>();
  const acquiredList: string[] = [];
  for (const rawId of raw.acquiredTraitIds) {
    if (!isNonEmptyTrimmedString(rawId, 128)) {
      return { ok: false, detail: "acquiredTraitIds entries must be non-empty strings." };
    }
    if (innateSet.has(rawId)) {
      return { ok: false, detail: "acquiredTraitIds cannot overlap with innate traits." };
    }
    if (acquiredSet.has(rawId)) {
      return { ok: false, detail: "acquiredTraitIds cannot contain duplicates." };
    }
    acquiredSet.add(rawId);
    acquiredList.push(rawId);
  }
  if (!Array.isArray(raw.activeAcquiredSlots) || raw.activeAcquiredSlots.length !== 3) {
    return { ok: false, detail: "destiny.activeAcquiredSlots must be a 3-element tuple." };
  }
  const activeSeen = new Set<string>();
  const activeTuple: [string | null, string | null, string | null] = [null, null, null];
  for (let i = 0; i < 3; i += 1) {
    const slotVal = raw.activeAcquiredSlots[i];
    if (slotVal === null) {
      activeTuple[i] = null;
      continue;
    }
    if (typeof slotVal !== "string" || !acquiredSet.has(slotVal)) {
      return {
        ok: false,
        detail: "activeAcquiredSlots entries must be null or owned in acquiredTraitIds."
      };
    }
    if (activeSeen.has(slotVal)) {
      return {
        ok: false,
        detail: "activeAcquiredSlots cannot equip the same trait in multiple slots."
      };
    }
    activeSeen.add(slotVal);
    activeTuple[i] = slotVal;
  }

  const normalized: DestinyCollection = {
    innate: innateTuple,
    innateConfirmedAtMs: raw.innateConfirmedAtMs,
    acquiredTraitIds: acquiredList,
    activeAcquiredSlots: activeTuple,
    collectionRevision: raw.collectionRevision
  };

  if (destinyCatalog !== undefined) {
    const catalogCheck = validateDestinyCollection(normalized, destinyCatalog);
    if (!catalogCheck.ok) {
      return {
        ok: false,
        detail: `Destiny catalog validation failed with code ${catalogCheck.code}.`
      };
    }
  }

  return { ok: true, value: normalized };
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

export const CHARACTERS_V02_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS characters_v02 (
    character_id TEXT PRIMARY KEY,
    account_id TEXT UNIQUE NOT NULL REFERENCES accounts(account_id),
    name TEXT NOT NULL,
    appearance_id TEXT NOT NULL,
    creation_state TEXT NOT NULL CHECK (creation_state IN ('draft', 'confirmed')),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    schema_version INTEGER NOT NULL DEFAULT 2 CHECK (schema_version = 2),
    ruleset_version TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1),
    exp_toward_next NUMERIC(38, 0) NOT NULL CHECK (exp_toward_next >= 0),
    free_attribute_points INTEGER NOT NULL CHECK (free_attribute_points >= 0),
    allocated_attributes_json JSONB NOT NULL,
    earned_permanent_attributes_json JSONB NOT NULL,
    realm_id TEXT NOT NULL,
    realm_stage INTEGER NOT NULL CHECK (realm_stage >= 1),
    tu_vi NUMERIC(38, 0) NOT NULL CHECK (tu_vi >= 0),
    innate_destiny_json JSONB,
    innate_confirmed_at_ms BIGINT,
    acquired_destiny_ids_json JSONB NOT NULL,
    active_acquired_slots_json JSONB NOT NULL,
    destiny_collection_revision INTEGER NOT NULL CHECK (destiny_collection_revision >= 0),
    current_hp INTEGER NOT NULL CHECK (current_hp >= 0),
    current_mp INTEGER NOT NULL CHECK (current_mp >= 0),
    zone_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('down', 'left', 'right', 'up')),
    linh_thach INTEGER NOT NULL CHECK (linh_thach >= 0),
    equipped_title TEXT NOT NULL,
    equipped_inheritance TEXT,
    inventory_json JSONB NOT NULL,
    quests_json JSONB NOT NULL,
    reputation_json JSONB NOT NULL,
    buffs_json JSONB NOT NULL,
    meditation_started_at_ms BIGINT NOT NULL CHECK (meditation_started_at_ms >= 0),
    last_meditation_claim_at_ms BIGINT NOT NULL CHECK (last_meditation_claim_at_ms >= 0),
    created_at_ms BIGINT NOT NULL CHECK (created_at_ms > 0),
    updated_at_ms BIGINT NOT NULL CHECK (updated_at_ms > 0),
    CHECK (
      (
        creation_state = 'draft'
        AND innate_destiny_json IS NULL
        AND innate_confirmed_at_ms IS NULL
        AND destiny_collection_revision = 0
      )
      OR
      (
        creation_state = 'confirmed'
        AND innate_destiny_json IS NOT NULL
        AND innate_confirmed_at_ms IS NOT NULL
        AND innate_confirmed_at_ms > 0
        AND destiny_collection_revision >= 1
      )
    )
  );
`;

const SELECT_CHARACTER_V02_COLUMNS = `
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
`;

export function hydrateCharacterV02Row(
  row: Record<string, unknown>,
  options?: CharacterV02ValidationOptions
): CharacterV02PersistedState {
  const creationState = String(row.creation_state) as CharacterCreationState;
  let destiny: DestinyCollection | null = null;
  if (creationState === "confirmed") {
    destiny = {
      innate: row.innate_destiny_json as [string, string, string],
      innateConfirmedAtMs: Number(row.innate_confirmed_at_ms),
      acquiredTraitIds: (row.acquired_destiny_ids_json as string[]) ?? [],
      activeAcquiredSlots: row.active_acquired_slots_json as [
        string | null,
        string | null,
        string | null
      ],
      collectionRevision: Number(row.destiny_collection_revision)
    };
  }

  const candidate: unknown = {
    schemaVersion: Number(row.schema_version),
    rulesetVersion: String(row.ruleset_version),
    identity: {
      characterId: String(row.character_id),
      accountId: String(row.account_id),
      name: String(row.name),
      appearanceId: String(row.appearance_id),
      createdAtMs: Number(row.created_at_ms),
      creationState,
      revision: Number(row.revision)
    },
    levelProgress: {
      level: Number(row.level),
      expTowardNext: String(row.exp_toward_next_text ?? row.exp_toward_next),
      freeAttributePoints: Number(row.free_attribute_points),
      allocated: row.allocated_attributes_json,
      earnedPermanent: row.earned_permanent_attributes_json
    },
    cultivation: {
      realmId: String(row.realm_id) as CanonicalRealmId,
      realmStage: Number(row.realm_stage),
      tuVi: String(row.tu_vi_text ?? row.tu_vi)
    },
    destiny,
    resources: {
      currentHp: Number(row.current_hp),
      currentMp: Number(row.current_mp)
    },
    world: {
      zoneId: String(row.zone_id) as ZoneId,
      x: Number(row.x),
      y: Number(row.y),
      direction: String(row.direction) as Direction,
      linhThach: Number(row.linh_thach),
      equippedTitle: String(row.equipped_title),
      equippedInheritance:
        row.equipped_inheritance !== null && row.equipped_inheritance !== undefined
          ? String(row.equipped_inheritance)
          : null,
      inventory: row.inventory_json,
      quests: row.quests_json,
      reputation: row.reputation_json,
      buffs: row.buffs_json,
      meditationStartedAtMs: Number(row.meditation_started_at_ms),
      lastMeditationClaimAtMs: Number(row.last_meditation_claim_at_ms)
    },
    updatedAtMs: Number(row.updated_at_ms)
  };

  const validated = validateCharacterV02PersistedState(candidate, options);
  if (!validated.ok) {
    throw new CharacterV02PersistenceError(
      "CORRUPTED_PERSISTED_STATE",
      `Persisted characters_v02 row failed validation (${validated.code}): ${validated.detail}`
    );
  }
  return validated.value;
}

export interface CharacterV02UpdateInput {
  expectedRevision: number;
  nextState: unknown;
}

export interface CharacterV02RepositoryHost {
  resolveQueryRunner(tx?: SqlTransaction): SqlQueryRunner;
  withTransaction<T>(fn: (tx: SqlTransaction) => Promise<T>): Promise<T>;
}

export class CharacterV02Repository {
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

  async createCharacter(
    state: unknown,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState> {
    const check = validateCharacterV02PersistedState(state, options);
    if (!check.ok) {
      throw new CharacterV02PersistenceError(check.code, check.detail);
    }
    const valid = check.value;
    if (valid.identity.revision !== 1) {
      throw new CharacterV02PersistenceError(
        "INVALID_INITIAL_REVISION",
        "Initial Character v0.2 creation requires identity.revision === 1."
      );
    }

    return this.runAtomic(tx, async (runner) => {
      const existingById = await runner.query<{ character_id: string }>(
        `SELECT character_id FROM characters_v02 WHERE character_id = $1 LIMIT 1`,
        [valid.identity.characterId]
      );
      if (existingById.rows.length > 0) {
        throw new CharacterV02PersistenceError(
          "DUPLICATE_CHARACTER_ID",
          `Character v0.2 with character_id '${valid.identity.characterId}' already exists.`
        );
      }

      const existingByAccount = await runner.query<{ account_id: string }>(
        `SELECT account_id FROM characters_v02 WHERE account_id = $1 LIMIT 1`,
        [valid.identity.accountId]
      );
      if (existingByAccount.rows.length > 0) {
        throw new CharacterV02PersistenceError(
          "DUPLICATE_ACCOUNT_CHARACTER",
          `Account '${valid.identity.accountId}' already owns a Character v0.2 record.`
        );
      }

      await runner.query(
        `INSERT INTO accounts (account_id, created_at) VALUES ($1, $2) ON CONFLICT (account_id) DO NOTHING`,
        [valid.identity.accountId, valid.identity.createdAtMs]
      );

      const innateJson =
        valid.destiny !== null ? JSON.stringify(valid.destiny.innate) : null;
      const innateConfirmedAtMs =
        valid.destiny !== null ? valid.destiny.innateConfirmedAtMs : null;
      const acquiredIdsJson = JSON.stringify(
        valid.destiny !== null ? valid.destiny.acquiredTraitIds : []
      );
      const activeSlotsJson = JSON.stringify(
        valid.destiny !== null ? valid.destiny.activeAcquiredSlots : [null, null, null]
      );
      const destinyRevision =
        valid.destiny !== null ? valid.destiny.collectionRevision : 0;

      const res = await runner.query<Record<string, unknown>>(
        `
        INSERT INTO characters_v02 (
          character_id,
          account_id,
          name,
          appearance_id,
          creation_state,
          revision,
          schema_version,
          ruleset_version,
          level,
          exp_toward_next,
          free_attribute_points,
          allocated_attributes_json,
          earned_permanent_attributes_json,
          realm_id,
          realm_stage,
          tu_vi,
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
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10::numeric(38,0), $11, $12::jsonb, $13::jsonb,
          $14, $15, $16::numeric(38,0),
          $17::jsonb, $18, $19::jsonb, $20::jsonb, $21,
          $22, $23,
          $24, $25, $26, $27, $28, $29, $30,
          $31::jsonb, $32::jsonb, $33::jsonb, $34::jsonb,
          $35, $36, $37, $38
        )
        RETURNING ${SELECT_CHARACTER_V02_COLUMNS}
        `,
        [
          valid.identity.characterId,
          valid.identity.accountId,
          valid.identity.name,
          valid.identity.appearanceId,
          valid.identity.creationState,
          valid.identity.revision,
          valid.schemaVersion,
          valid.rulesetVersion,
          valid.levelProgress.level,
          valid.levelProgress.expTowardNext,
          valid.levelProgress.freeAttributePoints,
          JSON.stringify(valid.levelProgress.allocated),
          JSON.stringify(valid.levelProgress.earnedPermanent),
          valid.cultivation.realmId,
          valid.cultivation.realmStage,
          valid.cultivation.tuVi,
          innateJson,
          innateConfirmedAtMs,
          acquiredIdsJson,
          activeSlotsJson,
          destinyRevision,
          valid.resources.currentHp,
          valid.resources.currentMp,
          valid.world.zoneId,
          valid.world.x,
          valid.world.y,
          valid.world.direction,
          valid.world.linhThach,
          valid.world.equippedTitle,
          valid.world.equippedInheritance,
          JSON.stringify(valid.world.inventory),
          JSON.stringify(valid.world.quests),
          JSON.stringify(valid.world.reputation),
          JSON.stringify(valid.world.buffs),
          valid.world.meditationStartedAtMs,
          valid.world.lastMeditationClaimAtMs,
          valid.identity.createdAtMs,
          valid.updatedAtMs
        ]
      );

      return hydrateCharacterV02Row(res.rows[0], options);
    });
  }

  async getByCharacterId(
    characterId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    const runner = this.host.resolveQueryRunner(tx);
    if (!isNonEmptyTrimmedString(characterId, 128)) {
      return null;
    }
    const res = await runner.query<Record<string, unknown>>(
      `SELECT ${SELECT_CHARACTER_V02_COLUMNS} FROM characters_v02 WHERE character_id = $1 LIMIT 1`,
      [characterId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return hydrateCharacterV02Row(res.rows[0], options);
  }

  async getByAccountId(
    accountId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    const runner = this.host.resolveQueryRunner(tx);
    if (!isNonEmptyTrimmedString(accountId, 128)) {
      return null;
    }
    const res = await runner.query<Record<string, unknown>>(
      `SELECT ${SELECT_CHARACTER_V02_COLUMNS} FROM characters_v02 WHERE account_id = $1 LIMIT 1`,
      [accountId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return hydrateCharacterV02Row(res.rows[0], options);
  }

  async updateCharacter(
    input: CharacterV02UpdateInput,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState> {
    if (!isPositiveSafeInt(input?.expectedRevision)) {
      throw new CharacterV02PersistenceError(
        "REVISION_MISMATCH",
        "expectedRevision must be a positive safe integer."
      );
    }
    const check = validateCharacterV02PersistedState(input.nextState, options);
    if (!check.ok) {
      throw new CharacterV02PersistenceError(check.code, check.detail);
    }
    const validNext = check.value;
    if (validNext.identity.revision !== input.expectedRevision + 1) {
      throw new CharacterV02PersistenceError(
        "REVISION_MISMATCH",
        `nextState.identity.revision (${validNext.identity.revision}) must equal expectedRevision + 1 (${input.expectedRevision + 1}).`
      );
    }

    return this.runAtomic(tx, async (runner) => {
      const existingRes = await runner.query<Record<string, unknown>>(
        `SELECT ${SELECT_CHARACTER_V02_COLUMNS} FROM characters_v02 WHERE character_id = $1 FOR UPDATE`,
        [validNext.identity.characterId]
      );
      if (existingRes.rows.length === 0) {
        throw new CharacterV02PersistenceError(
          "CHARACTER_NOT_FOUND",
          `Character v0.2 '${validNext.identity.characterId}' was not found.`
        );
      }

      const existing = hydrateCharacterV02Row(existingRes.rows[0], options);
      if (
        existing.identity.accountId !== validNext.identity.accountId ||
        existing.identity.createdAtMs !== validNext.identity.createdAtMs
      ) {
        throw new CharacterV02PersistenceError(
          "IMMUTABLE_IDENTITY_VIOLATION",
          "accountId and createdAtMs are immutable after Character v0.2 creation."
        );
      }

      if (existing.identity.revision !== input.expectedRevision) {
        throw new CharacterV02PersistenceError(
          "REVISION_CONFLICT",
          `Expected revision ${input.expectedRevision}, but persisted revision is ${existing.identity.revision}.`
        );
      }

      if (existing.identity.creationState === "confirmed") {
        if (validNext.identity.creationState !== "confirmed") {
          throw new CharacterV02PersistenceError(
            "IMMUTABLE_CREATION_STATE_VIOLATION",
            "Confirmed Character v0.2 cannot revert creationState to draft."
          );
        }
        if (
          existing.destiny === null ||
          validNext.destiny === null ||
          existing.destiny.innate[0] !== validNext.destiny.innate[0] ||
          existing.destiny.innate[1] !== validNext.destiny.innate[1] ||
          existing.destiny.innate[2] !== validNext.destiny.innate[2] ||
          existing.destiny.innateConfirmedAtMs !== validNext.destiny.innateConfirmedAtMs
        ) {
          throw new CharacterV02PersistenceError(
            "IMMUTABLE_INNATE_DESTINY_VIOLATION",
            "Confirmed innate Tiên Thiên Destiny slots and confirmation timestamp are immutable."
          );
        }
        if (validNext.destiny.collectionRevision < existing.destiny.collectionRevision) {
          throw new CharacterV02PersistenceError(
            "DESTINY_REVISION_REGRESSION",
            "Destiny collectionRevision cannot decrease."
          );
        }
      }

      const innateJson =
        validNext.destiny !== null ? JSON.stringify(validNext.destiny.innate) : null;
      const innateConfirmedAtMs =
        validNext.destiny !== null ? validNext.destiny.innateConfirmedAtMs : null;
      const acquiredIdsJson = JSON.stringify(
        validNext.destiny !== null ? validNext.destiny.acquiredTraitIds : []
      );
      const activeSlotsJson = JSON.stringify(
        validNext.destiny !== null ? validNext.destiny.activeAcquiredSlots : [null, null, null]
      );
      const destinyRevision =
        validNext.destiny !== null ? validNext.destiny.collectionRevision : 0;

      const updateRes = await runner.query<Record<string, unknown>>(
        `
        UPDATE characters_v02 SET
          name = $4,
          appearance_id = $5,
          creation_state = $6,
          revision = $7,
          ruleset_version = $8,
          level = $9,
          exp_toward_next = $10::numeric(38,0),
          free_attribute_points = $11,
          allocated_attributes_json = $12::jsonb,
          earned_permanent_attributes_json = $13::jsonb,
          realm_id = $14,
          realm_stage = $15,
          tu_vi = $16::numeric(38,0),
          innate_destiny_json = $17::jsonb,
          innate_confirmed_at_ms = $18,
          acquired_destiny_ids_json = $19::jsonb,
          active_acquired_slots_json = $20::jsonb,
          destiny_collection_revision = $21,
          current_hp = $22,
          current_mp = $23,
          zone_id = $24,
          x = $25,
          y = $26,
          direction = $27,
          linh_thach = $28,
          equipped_title = $29,
          equipped_inheritance = $30,
          inventory_json = $31::jsonb,
          quests_json = $32::jsonb,
          reputation_json = $33::jsonb,
          buffs_json = $34::jsonb,
          meditation_started_at_ms = $35,
          last_meditation_claim_at_ms = $36,
          updated_at_ms = $37
        WHERE character_id = $1
          AND account_id = $2
          AND revision = $3
        RETURNING ${SELECT_CHARACTER_V02_COLUMNS}
        `,
        [
          validNext.identity.characterId,
          validNext.identity.accountId,
          input.expectedRevision,
          validNext.identity.name,
          validNext.identity.appearanceId,
          validNext.identity.creationState,
          validNext.identity.revision,
          validNext.rulesetVersion,
          validNext.levelProgress.level,
          validNext.levelProgress.expTowardNext,
          validNext.levelProgress.freeAttributePoints,
          JSON.stringify(validNext.levelProgress.allocated),
          JSON.stringify(validNext.levelProgress.earnedPermanent),
          validNext.cultivation.realmId,
          validNext.cultivation.realmStage,
          validNext.cultivation.tuVi,
          innateJson,
          innateConfirmedAtMs,
          acquiredIdsJson,
          activeSlotsJson,
          destinyRevision,
          validNext.resources.currentHp,
          validNext.resources.currentMp,
          validNext.world.zoneId,
          validNext.world.x,
          validNext.world.y,
          validNext.world.direction,
          validNext.world.linhThach,
          validNext.world.equippedTitle,
          validNext.world.equippedInheritance,
          JSON.stringify(validNext.world.inventory),
          JSON.stringify(validNext.world.quests),
          JSON.stringify(validNext.world.reputation),
          JSON.stringify(validNext.world.buffs),
          validNext.world.meditationStartedAtMs,
          validNext.world.lastMeditationClaimAtMs,
          validNext.updatedAtMs
        ]
      );

      if (updateRes.rows.length === 0) {
        throw new CharacterV02PersistenceError(
          "REVISION_CONFLICT",
          `Concurrent update conflict on Character v0.2 '${validNext.identity.characterId}' at revision ${input.expectedRevision}.`
        );
      }

      return hydrateCharacterV02Row(updateRes.rows[0], options);
    });
  }
}
