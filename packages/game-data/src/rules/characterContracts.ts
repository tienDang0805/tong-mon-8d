import type {
  BaseAttributeKey,
  BaseAttributes,
  CanonicalRealmId,
  CharacterLevelProgress
} from "@tong-mon-8d/shared";
import { REALM_PROGRESSION } from "../catalogs/realms.js";

export const BASE_ATTRIBUTE_KEYS: readonly BaseAttributeKey[] = Object.freeze([
  "the_phach",
  "luc_dao",
  "linh_tinh",
  "than_phap",
  "than_thuc",
  "ngo_tinh"
]);

export function isBaseAttributeKey(value: unknown): value is BaseAttributeKey {
  return typeof value === "string" && (BASE_ATTRIBUTE_KEYS as readonly string[]).includes(value);
}

export function createZeroBaseAttributes(): BaseAttributes {
  return {
    the_phach: 0,
    luc_dao: 0,
    linh_tinh: 0,
    than_phap: 0,
    than_thuc: 0,
    ngo_tinh: 0
  };
}

export function sumBaseAttributes(attrs: BaseAttributes): number {
  return (
    attrs.the_phach +
    attrs.luc_dao +
    attrs.linh_tinh +
    attrs.than_phap +
    attrs.than_thuc +
    attrs.ngo_tinh
  );
}

export type BaseAttributesValidationResult =
  | { ok: true; value: BaseAttributes }
  | {
      ok: false;
      code:
        | "INVALID_ATTRIBUTES_OBJECT"
        | "MISSING_ATTRIBUTE_KEY"
        | "EXTRA_ATTRIBUTE_KEY"
        | "INVALID_ATTRIBUTE_VALUE";
    };

export function validateBaseAttributes(attrs: unknown): BaseAttributesValidationResult {
  if (typeof attrs !== "object" || attrs === null || Array.isArray(attrs)) {
    return { ok: false, code: "INVALID_ATTRIBUTES_OBJECT" };
  }
  const record = attrs as Record<string, unknown>;
  const keys = Object.keys(record);
  for (const reqKey of BASE_ATTRIBUTE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(record, reqKey)) {
      return { ok: false, code: "MISSING_ATTRIBUTE_KEY" };
    }
  }
  for (const k of keys) {
    if (!isBaseAttributeKey(k)) {
      return { ok: false, code: "EXTRA_ATTRIBUTE_KEY" };
    }
  }
  const out = createZeroBaseAttributes();
  for (const reqKey of BASE_ATTRIBUTE_KEYS) {
    const rawVal = record[reqKey];
    if (typeof rawVal !== "number" || !Number.isSafeInteger(rawVal) || rawVal < 0) {
      return { ok: false, code: "INVALID_ATTRIBUTE_VALUE" };
    }
    out[reqKey] = rawVal;
  }
  return { ok: true, value: out };
}

const NON_NEGATIVE_DECIMAL_INT_PATTERN = /^(0|[1-9]\d*)$/;

export function isNonNegativeDecimalIntString(value: unknown): value is string {
  return typeof value === "string" && NON_NEGATIVE_DECIMAL_INT_PATTERN.test(value);
}

export function parseExpDecimalString(value: unknown): bigint | null {
  if (!isNonNegativeDecimalIntString(value)) {
    return null;
  }
  return BigInt(value);
}

export function formatExpDecimalString(value: unknown): string | null {
  if (typeof value !== "bigint" || value < 0n) {
    return null;
  }
  return value.toString(10);
}

export type CharacterLevelProgressValidationResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "INVALID_PROGRESS_OBJECT"
        | "INVALID_LEVEL"
        | "INVALID_EXP_DECIMAL_STRING"
        | "INVALID_FREE_POINTS"
        | "INVALID_ALLOCATED_ATTRIBUTES"
        | "INVALID_EARNED_PERMANENT_ATTRIBUTES"
        | "LEVEL_POINT_INVARIANT_MISMATCH";
    };

export function validateCharacterLevelProgress(
  progress: unknown
): CharacterLevelProgressValidationResult {
  if (typeof progress !== "object" || progress === null || Array.isArray(progress)) {
    return { ok: false, code: "INVALID_PROGRESS_OBJECT" };
  }
  const p = progress as Record<string, unknown>;
  if (typeof p.level !== "number" || !Number.isSafeInteger(p.level) || p.level < 1) {
    return { ok: false, code: "INVALID_LEVEL" };
  }
  if (!isNonNegativeDecimalIntString(p.expTowardNext)) {
    return { ok: false, code: "INVALID_EXP_DECIMAL_STRING" };
  }
  if (
    typeof p.freeAttributePoints !== "number" ||
    !Number.isSafeInteger(p.freeAttributePoints) ||
    p.freeAttributePoints < 0
  ) {
    return { ok: false, code: "INVALID_FREE_POINTS" };
  }
  const allocCheck = validateBaseAttributes(p.allocated);
  if (!allocCheck.ok) {
    return { ok: false, code: "INVALID_ALLOCATED_ATTRIBUTES" };
  }
  const earnedCheck = validateBaseAttributes(p.earnedPermanent);
  if (!earnedCheck.ok) {
    return { ok: false, code: "INVALID_EARNED_PERMANENT_ATTRIBUTES" };
  }
  const totalFromLevel = sumBaseAttributes(allocCheck.value) + p.freeAttributePoints;
  if (totalFromLevel !== p.level - 1) {
    return { ok: false, code: "LEVEL_POINT_INVARIANT_MISMATCH" };
  }
  return { ok: true };
}

export type AllocateSingleAttributeResult =
  | { ok: true; next: CharacterLevelProgress }
  | {
      ok: false;
      code:
        | "INVALID_PROGRESS_STATE"
        | "INVALID_ATTRIBUTE_KEY"
        | "INSUFFICIENT_FREE_POINTS";
    };

export function allocateSingleAttributePoint(
  progress: CharacterLevelProgress,
  key: unknown
): AllocateSingleAttributeResult {
  const valid = validateCharacterLevelProgress(progress);
  if (!valid.ok) {
    return { ok: false, code: "INVALID_PROGRESS_STATE" };
  }
  if (!isBaseAttributeKey(key)) {
    return { ok: false, code: "INVALID_ATTRIBUTE_KEY" };
  }
  if (progress.freeAttributePoints < 1) {
    return { ok: false, code: "INSUFFICIENT_FREE_POINTS" };
  }
  const nextAllocated: BaseAttributes = {
    ...progress.allocated,
    [key]: progress.allocated[key] + 1
  };
  const nextEarnedPermanent: BaseAttributes = {
    ...progress.earnedPermanent
  };
  return {
    ok: true,
    next: {
      level: progress.level,
      expTowardNext: progress.expTowardNext,
      freeAttributePoints: progress.freeAttributePoints - 1,
      allocated: nextAllocated,
      earnedPermanent: nextEarnedPermanent
    }
  };
}

export interface RealmLevelBand {
  realmId: CanonicalRealmId;
  orderIndex: number;
  stageCount: number;
  minLevel: number;
  maxLevel: number | null;
  postBreakthroughMinLevel: number;
}

export function getRealmLevelBand(realmId: unknown): RealmLevelBand | null {
  if (typeof realmId !== "string") {
    return null;
  }
  const def = REALM_PROGRESSION.find((r) => r.id === realmId);
  if (!def) {
    return null;
  }
  if (def.orderIndex === 0) {
    return {
      realmId: def.id,
      orderIndex: 0,
      stageCount: def.stageCount,
      minLevel: 1,
      maxLevel: 10,
      postBreakthroughMinLevel: 1
    };
  }
  const isSaintRealm = def.id === "thanh_canh";
  const minLevel = 11 + 20 * (def.orderIndex - 1);
  const maxLevel = isSaintRealm ? null : 30 + 20 * (def.orderIndex - 1);
  return {
    realmId: def.id,
    orderIndex: def.orderIndex,
    stageCount: def.stageCount,
    minLevel,
    maxLevel,
    postBreakthroughMinLevel: minLevel - 1
  };
}

export function isValidRealmStage(realmId: unknown, realmStage: unknown): boolean {
  const band = getRealmLevelBand(realmId);
  if (!band || typeof realmStage !== "number" || !Number.isSafeInteger(realmStage)) {
    return false;
  }
  return realmStage >= 1 && realmStage <= band.stageCount;
}

export function isLevelAllowedForRealm(realmId: unknown, level: unknown): boolean {
  const band = getRealmLevelBand(realmId);
  if (!band || typeof level !== "number" || !Number.isSafeInteger(level)) {
    return false;
  }
  if (level < band.postBreakthroughMinLevel) {
    return false;
  }
  if (band.maxLevel !== null && level > band.maxLevel) {
    return false;
  }
  return true;
}

export function isAtNonSaintMajorRealmLevelCap(realmId: unknown, level: unknown): boolean {
  const band = getRealmLevelBand(realmId);
  if (!band || typeof level !== "number" || !Number.isSafeInteger(level)) {
    return false;
  }
  return band.maxLevel !== null && level === band.maxLevel;
}

export function meetsMajorRealmBreakthroughLevelAndStagePrerequisite(
  realmId: unknown,
  realmStage: unknown,
  level: unknown
): boolean {
  const band = getRealmLevelBand(realmId);
  if (!band || band.maxLevel === null) {
    return false;
  }
  if (!isValidRealmStage(realmId, realmStage) || !isLevelAllowedForRealm(realmId, level)) {
    return false;
  }
  return realmStage === band.stageCount && level === band.maxLevel;
}
