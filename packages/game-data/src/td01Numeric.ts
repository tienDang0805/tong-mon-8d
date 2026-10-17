import type {
  BaseAttributes,
  CanonicalRealmId,
  CharacterLevelProgress,
  DestinyCollection,
  DestinyDefinitionMetadata
} from "@tong-mon-8d/shared";
import { computeActiveDestinyPreRealmAttributeBonuses } from "./catalogs/destinies.js";
import {
  BASE_ATTRIBUTE_KEYS,
  createZeroBaseAttributes,
  formatExpDecimalString,
  getRealmLevelBand,
  isAtNonSaintMajorRealmLevelCap,
  isLevelAllowedForRealm,
  isValidRealmStage,
  parseExpDecimalString,
  validateBaseAttributes,
  validateCharacterLevelProgress
} from "./rules/characterContracts.js";

export const TD01_CANDIDATE_RULESET_VERSION = "td01-candidate-v0.3" as const;

export const TD01_CANDIDATE_NUMERIC_APPROVAL_STATE = "DESIGN_BASELINE" as const;

export const MAX_SUPPORTED_EXP_DECIMAL_DIGITS = 38;

export const MAX_SUPPORTED_EXP_BIGINT = 10n ** 38n - 1n;

export const MAX_SINGLE_GRANT_LEVEL_ADVANCEMENTS = 100_000;

export const CANDIDATE_ORIGIN_BASE_ATTRIBUTE = 10;

export const CANDIDATE_SAINT_ACCELERATION_START_LEVEL = 350;

export const CANDIDATE_REALM_BASE_GROWTH = 1.5;

export const CANDIDATE_REALM_STAGE_SPAN_BONUS = 0.3;

export const CANDIDATE_DERIVED_STAT_COEFFICIENTS = Object.freeze({
  baseHp: 100,
  hpPerThePhach: 12,
  baseMp: 40,
  mpPerLinhTinh: 10,
  basePhysicalAttack: 5,
  physicalAttackPerLucDao: 2,
  baseSpiritualAttack: 5,
  spiritualAttackPerLinhTinh: 2,
  basePhysicalDefense: 2,
  physicalDefenseThePhachWeight: 0.8,
  physicalDefenseLucDaoWeight: 0.25,
  baseSpiritualDefense: 2,
  spiritualDefenseThanThucWeight: 0.75,
  spiritualDefenseLinhTinhWeight: 0.3,
  baseMoveSpeedRating: 100,
  moveSpeedRatingPerThanPhap: 0.5,
  baseCultivationRateRating: 100,
  cultivationRateRatingPerNgoTinh: 0.5
});

export interface CandidateDerivedStats {
  maxHp: number;
  maxMp: number;
  physicalAttack: number;
  spiritualAttack: number;
  physicalDefense: number;
  spiritualDefense: number;
  moveSpeedRating: number;
  cultivationRateRating: number;
}

export type CandidateExpCostValidationCode = "INVALID_LEVEL" | "EXP_NUMERIC_OVERFLOW";

export type CandidateExpToNextResult =
  | {
      ok: true;
      level: number;
      expToNext: bigint;
      expToNextDecimal: string;
    }
  | {
      ok: false;
      code: CandidateExpCostValidationCode;
    };

export function computeCandidateExpToNextLevel(level: unknown): CandidateExpToNextResult {
  if (typeof level !== "number" || !Number.isSafeInteger(level) || level < 1) {
    return { ok: false, code: "INVALID_LEVEL" };
  }
  const l = BigInt(level);
  const saintThreshold = BigInt(CANDIDATE_SAINT_ACCELERATION_START_LEVEL);
  const saintExcess = l > saintThreshold ? l - saintThreshold : 0n;
  const expToNext = 100n + 30n * l + 8n * l * l + 2n * saintExcess * saintExcess;
  if (expToNext > MAX_SUPPORTED_EXP_BIGINT) {
    return { ok: false, code: "EXP_NUMERIC_OVERFLOW" };
  }
  return {
    ok: true,
    level,
    expToNext,
    expToNextDecimal: expToNext.toString(10)
  };
}

export function getCandidateExpToNextLevelBigInt(level: unknown): bigint | null {
  const res = computeCandidateExpToNextLevel(level);
  return res.ok ? res.expToNext : null;
}

export function getCandidateExpToNextLevelDecimal(level: unknown): string | null {
  const res = computeCandidateExpToNextLevel(level);
  return res.ok ? res.expToNextDecimal : null;
}

function computeCumulativeExpBeforeLevelBigInt(level: number): bigint {
  const n = BigInt(level - 1);
  if (n <= 0n) {
    return 0n;
  }
  const linearSum = (n * (n + 1n)) / 2n;
  const squareSum = (n * (n + 1n) * (2n * n + 1n)) / 6n;
  const saintThreshold = BigInt(CANDIDATE_SAINT_ACCELERATION_START_LEVEL);
  const m = n > saintThreshold ? n - saintThreshold : 0n;
  const saintSquareSum = (m * (m + 1n) * (2n * m + 1n)) / 6n;
  return 100n * n + 30n * linearSum + 8n * squareSum + 2n * saintSquareSum;
}

export type CandidateLevelSpanExpCostResult =
  | {
      ok: true;
      fromLevel: number;
      toLevel: number;
      totalExp: bigint;
      totalExpDecimal: string;
    }
  | {
      ok: false;
      code: "INVALID_LEVEL" | "INVALID_LEVEL_SPAN" | "EXP_NUMERIC_OVERFLOW";
    };

export function computeCandidateTotalExpForLevelSpan(
  fromLevel: unknown,
  toLevel: unknown
): CandidateLevelSpanExpCostResult {
  if (
    typeof fromLevel !== "number" ||
    !Number.isSafeInteger(fromLevel) ||
    fromLevel < 1 ||
    typeof toLevel !== "number" ||
    !Number.isSafeInteger(toLevel) ||
    toLevel < 1
  ) {
    return { ok: false, code: "INVALID_LEVEL" };
  }
  if (toLevel < fromLevel) {
    return { ok: false, code: "INVALID_LEVEL_SPAN" };
  }
  const totalExp =
    computeCumulativeExpBeforeLevelBigInt(toLevel) -
    computeCumulativeExpBeforeLevelBigInt(fromLevel);
  if (totalExp > MAX_SUPPORTED_EXP_BIGINT) {
    return { ok: false, code: "EXP_NUMERIC_OVERFLOW" };
  }
  return {
    ok: true,
    fromLevel,
    toLevel,
    totalExp,
    totalExpDecimal: totalExp.toString(10)
  };
}

function parseCandidateExpGrantInput(expGrant: unknown): bigint | null {
  if (typeof expGrant === "bigint") {
    return expGrant >= 0n ? expGrant : null;
  }
  if (typeof expGrant === "string") {
    return parseExpDecimalString(expGrant);
  }
  return null;
}

export type CandidateExpGrantStopReason = "LEVEL_CAPPED" | "INSUFFICIENT_EXP_FOR_NEXT";

export type CandidateExpGrantErrorCode =
  | "INVALID_PROGRESS_STATE"
  | "INVALID_REALM_ID"
  | "LEVEL_NOT_ALLOWED_FOR_REALM"
  | "NON_ZERO_EXP_AT_REALM_CAP"
  | "INVALID_EXP_GRANT"
  | "EXP_NUMERIC_OVERFLOW";

export interface CandidateCharacterExpGrantSuccess {
  ok: true;
  nextProgress: CharacterLevelProgress;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  freeAttributePointsGained: number;
  expGrantedDecimal: string;
  expConsumedDecimal: string;
  expDiscardedAtCapDecimal: string;
  expToNextLevelDecimal: string | null;
  stopReason: CandidateExpGrantStopReason;
  cappedAtNonSaintRealm: boolean;
}

export type CandidateCharacterExpGrantResult =
  | CandidateCharacterExpGrantSuccess
  | {
      ok: false;
      code: CandidateExpGrantErrorCode;
    };

export function applyCandidateCharacterExpGrant(
  progress: unknown,
  realmId: unknown,
  expGrant: unknown
): CandidateCharacterExpGrantResult {
  const progressCheck = validateCharacterLevelProgress(progress);
  if (!progressCheck.ok) {
    return { ok: false, code: "INVALID_PROGRESS_STATE" };
  }
  const validProgress = progress as CharacterLevelProgress;
  const band = getRealmLevelBand(realmId);
  if (!band) {
    return { ok: false, code: "INVALID_REALM_ID" };
  }
  if (!isLevelAllowedForRealm(band.realmId, validProgress.level)) {
    return { ok: false, code: "LEVEL_NOT_ALLOWED_FOR_REALM" };
  }
  const storedExp = parseExpDecimalString(validProgress.expTowardNext);
  if (storedExp === null || storedExp > MAX_SUPPORTED_EXP_BIGINT) {
    return { ok: false, code: "EXP_NUMERIC_OVERFLOW" };
  }
  const grantBigInt = parseCandidateExpGrantInput(expGrant);
  if (grantBigInt === null) {
    return { ok: false, code: "INVALID_EXP_GRANT" };
  }
  if (grantBigInt > MAX_SUPPORTED_EXP_BIGINT) {
    return { ok: false, code: "EXP_NUMERIC_OVERFLOW" };
  }
  const atInitialCap = isAtNonSaintMajorRealmLevelCap(band.realmId, validProgress.level);
  if (atInitialCap && storedExp !== 0n) {
    return { ok: false, code: "NON_ZERO_EXP_AT_REALM_CAP" };
  }

  const nextAllocated: BaseAttributes = { ...validProgress.allocated };
  const nextEarnedPermanent: BaseAttributes = { ...validProgress.earnedPermanent };
  const expGrantedDecimal = formatExpDecimalString(grantBigInt) ?? "0";

  if (atInitialCap) {
    return {
      ok: true,
      nextProgress: {
        level: validProgress.level,
        expTowardNext: "0",
        freeAttributePoints: validProgress.freeAttributePoints,
        allocated: nextAllocated,
        earnedPermanent: nextEarnedPermanent
      },
      previousLevel: validProgress.level,
      newLevel: validProgress.level,
      levelsGained: 0,
      freeAttributePointsGained: 0,
      expGrantedDecimal,
      expConsumedDecimal: "0",
      expDiscardedAtCapDecimal: expGrantedDecimal,
      expToNextLevelDecimal: null,
      stopReason: "LEVEL_CAPPED",
      cappedAtNonSaintRealm: true
    };
  }

  let pool = storedExp + grantBigInt;
  if (pool > MAX_SUPPORTED_EXP_BIGINT) {
    return { ok: false, code: "EXP_NUMERIC_OVERFLOW" };
  }

  let currentLevel = validProgress.level;
  let currentFreePoints = validProgress.freeAttributePoints;
  let levelsGained = 0;
  let expConsumed = 0n;

  while (!isAtNonSaintMajorRealmLevelCap(band.realmId, currentLevel)) {
    const costRes = computeCandidateExpToNextLevel(currentLevel);
    if (!costRes.ok) {
      return { ok: false, code: "EXP_NUMERIC_OVERFLOW" };
    }
    if (pool < costRes.expToNext) {
      break;
    }
    if (
      levelsGained >= MAX_SINGLE_GRANT_LEVEL_ADVANCEMENTS ||
      !Number.isSafeInteger(currentLevel + 1) ||
      !Number.isSafeInteger(currentFreePoints + 1)
    ) {
      return { ok: false, code: "EXP_NUMERIC_OVERFLOW" };
    }
    pool -= costRes.expToNext;
    expConsumed += costRes.expToNext;
    currentLevel += 1;
    currentFreePoints += 1;
    levelsGained += 1;
  }

  const reachedNonSaintCap = isAtNonSaintMajorRealmLevelCap(band.realmId, currentLevel);
  const expDiscarded = reachedNonSaintCap ? pool : 0n;
  const finalExpTowardNext = reachedNonSaintCap ? 0n : pool;

  let expToNextLevelDecimal: string | null = null;
  if (!reachedNonSaintCap) {
    const nextCostRes = computeCandidateExpToNextLevel(currentLevel);
    if (!nextCostRes.ok) {
      return { ok: false, code: "EXP_NUMERIC_OVERFLOW" };
    }
    expToNextLevelDecimal = nextCostRes.expToNextDecimal;
  }

  return {
    ok: true,
    nextProgress: {
      level: currentLevel,
      expTowardNext: finalExpTowardNext.toString(10),
      freeAttributePoints: currentFreePoints,
      allocated: nextAllocated,
      earnedPermanent: nextEarnedPermanent
    },
    previousLevel: validProgress.level,
    newLevel: currentLevel,
    levelsGained,
    freeAttributePointsGained: levelsGained,
    expGrantedDecimal,
    expConsumedDecimal: expConsumed.toString(10),
    expDiscardedAtCapDecimal: expDiscarded.toString(10),
    expToNextLevelDecimal,
    stopReason: reachedNonSaintCap ? "LEVEL_CAPPED" : "INSUFFICIENT_EXP_FOR_NEXT",
    cappedAtNonSaintRealm: reachedNonSaintCap
  };
}

export function createCandidateOriginBaseAttributes(): BaseAttributes {
  return {
    the_phach: CANDIDATE_ORIGIN_BASE_ATTRIBUTE,
    luc_dao: CANDIDATE_ORIGIN_BASE_ATTRIBUTE,
    linh_tinh: CANDIDATE_ORIGIN_BASE_ATTRIBUTE,
    than_phap: CANDIDATE_ORIGIN_BASE_ATTRIBUTE,
    than_thuc: CANDIDATE_ORIGIN_BASE_ATTRIBUTE,
    ngo_tinh: CANDIDATE_ORIGIN_BASE_ATTRIBUTE
  };
}

function computeRealmStageRationalFactor(
  orderIndex: number,
  realmStage: number,
  stageCount: number
): { numerator: bigint; denominator: bigint } {
  const r = BigInt(orderIndex);
  const stageSpan = BigInt(Math.max(1, stageCount - 1));
  const stageOffset = BigInt(realmStage - 1);
  const numerator = 3n ** r * (10n * stageSpan + 3n * stageOffset);
  const denominator = 2n ** r * (10n * stageSpan);
  return { numerator, denominator };
}

export type CandidateRealmStageFactorResult =
  | {
      ok: true;
      realmId: CanonicalRealmId;
      realmStage: number;
      orderIndex: number;
      stageCount: number;
      factor: number;
    }
  | {
      ok: false;
      code: "INVALID_REALM_ID" | "INVALID_REALM_STAGE";
    };

export function computeCandidateRealmStageFactor(
  realmId: unknown,
  realmStage: unknown
): CandidateRealmStageFactorResult {
  const band = getRealmLevelBand(realmId);
  if (!band) {
    return { ok: false, code: "INVALID_REALM_ID" };
  }
  if (!isValidRealmStage(band.realmId, realmStage)) {
    return { ok: false, code: "INVALID_REALM_STAGE" };
  }
  const validStage = realmStage as number;
  const { numerator, denominator } = computeRealmStageRationalFactor(
    band.orderIndex,
    validStage,
    band.stageCount
  );
  const factor = Number(numerator) / Number(denominator);
  return {
    ok: true,
    realmId: band.realmId,
    realmStage: validStage,
    orderIndex: band.orderIndex,
    stageCount: band.stageCount,
    factor
  };
}

export function getCandidateRealmStageFactor(
  realmId: unknown,
  realmStage: unknown
): number | null {
  const res = computeCandidateRealmStageFactor(realmId, realmStage);
  return res.ok ? res.factor : null;
}

export type CandidateEffectiveBaseAttributesResult =
  | {
      ok: true;
      realmFactor: number;
      effectiveAttributes: BaseAttributes;
    }
  | {
      ok: false;
      code: "INVALID_PRE_REALM_ATTRIBUTES" | "INVALID_REALM_ID" | "INVALID_REALM_STAGE";
    };

export function computeCandidateEffectiveBaseAttributes(
  preRealmAttributes: unknown,
  realmId: unknown,
  realmStage: unknown
): CandidateEffectiveBaseAttributesResult {
  const attrCheck = validateBaseAttributes(preRealmAttributes);
  if (!attrCheck.ok) {
    return { ok: false, code: "INVALID_PRE_REALM_ATTRIBUTES" };
  }
  const factorRes = computeCandidateRealmStageFactor(realmId, realmStage);
  if (!factorRes.ok) {
    return { ok: false, code: factorRes.code };
  }
  const { numerator, denominator } = computeRealmStageRationalFactor(
    factorRes.orderIndex,
    factorRes.realmStage,
    factorRes.stageCount
  );
  const effectiveAttributes = createZeroBaseAttributes();
  for (const key of BASE_ATTRIBUTE_KEYS) {
    const preVal = BigInt(attrCheck.value[key]);
    const scaled = (preVal * numerator) / denominator;
    effectiveAttributes[key] = Number(scaled);
  }
  return {
    ok: true,
    realmFactor: factorRes.factor,
    effectiveAttributes
  };
}

export type CandidateDerivedStatsResult =
  | {
      ok: true;
      derivedStats: CandidateDerivedStats;
    }
  | {
      ok: false;
      code: "INVALID_EFFECTIVE_ATTRIBUTES";
    };

export function computeCandidateDerivedStatsFromEffectiveAttributes(
  effectiveAttributes: unknown
): CandidateDerivedStatsResult {
  const attrCheck = validateBaseAttributes(effectiveAttributes);
  if (!attrCheck.ok) {
    return { ok: false, code: "INVALID_EFFECTIVE_ATTRIBUTES" };
  }
  const eff = attrCheck.value;
  const maxHp = 100 + 12 * eff.the_phach;
  const maxMp = 40 + 10 * eff.linh_tinh;
  const physicalAttack = 5 + 2 * eff.luc_dao;
  const spiritualAttack = 5 + 2 * eff.linh_tinh;
  const physicalDefense = 2 + Math.floor((80 * eff.the_phach + 25 * eff.luc_dao) / 100);
  const spiritualDefense = 2 + Math.floor((75 * eff.than_thuc + 30 * eff.linh_tinh) / 100);
  const moveSpeedRating = 100 + Math.floor((50 * eff.than_phap) / 100);
  const cultivationRateRating = 100 + Math.floor((50 * eff.ngo_tinh) / 100);

  return {
    ok: true,
    derivedStats: {
      maxHp,
      maxMp,
      physicalAttack,
      spiritualAttack,
      physicalDefense,
      spiritualDefense,
      moveSpeedRating,
      cultivationRateRating
    }
  };
}

export interface CandidateBaselineStatSnapshot {
  rulesetVersion: typeof TD01_CANDIDATE_RULESET_VERSION;
  approvalState: typeof TD01_CANDIDATE_NUMERIC_APPROVAL_STATE;
  realmId: CanonicalRealmId;
  realmStage: number;
  level: number;
  realmFactor: number;
  originAttributes: BaseAttributes;
  destinyAttributeBonuses: BaseAttributes;
  preRealmAttributes: BaseAttributes;
  effectiveAttributes: BaseAttributes;
  derivedStats: CandidateDerivedStats;
}

export type CandidateBaselineStatSnapshotErrorCode =
  | "INVALID_SNAPSHOT_INPUT"
  | "INVALID_REALM_ID"
  | "INVALID_REALM_STAGE"
  | "INVALID_PROGRESS_STATE"
  | "LEVEL_NOT_ALLOWED_FOR_REALM";

export type CandidateBaselineStatSnapshotResult =
  | {
      ok: true;
      snapshot: CandidateBaselineStatSnapshot;
    }
  | {
      ok: false;
      code: CandidateBaselineStatSnapshotErrorCode;
    };

export function computeCandidateBaselineStatSnapshot(
  input: unknown
): CandidateBaselineStatSnapshotResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, code: "INVALID_SNAPSHOT_INPUT" };
  }
  const raw = input as Record<string, unknown>;
  const factorRes = computeCandidateRealmStageFactor(raw.realmId, raw.realmStage);
  if (!factorRes.ok) {
    return { ok: false, code: factorRes.code };
  }

  let progressCandidate: unknown = raw.levelProgress;
  if (progressCandidate === undefined) {
    progressCandidate = {
      level: raw.level,
      expTowardNext: raw.expTowardNext === undefined ? "0" : raw.expTowardNext,
      freeAttributePoints: raw.freeAttributePoints === undefined ? 0 : raw.freeAttributePoints,
      allocated: raw.allocated,
      earnedPermanent:
        raw.earnedPermanent === undefined ? createZeroBaseAttributes() : raw.earnedPermanent
    };
  }

  const progressCheck = validateCharacterLevelProgress(progressCandidate);
  if (!progressCheck.ok) {
    return { ok: false, code: "INVALID_PROGRESS_STATE" };
  }
  const validProgress = progressCandidate as CharacterLevelProgress;
  if (!isLevelAllowedForRealm(factorRes.realmId, validProgress.level)) {
    return { ok: false, code: "LEVEL_NOT_ALLOWED_FOR_REALM" };
  }

  const originAttributes = createCandidateOriginBaseAttributes();
  const destinyAttributeBonuses = computeActiveDestinyPreRealmAttributeBonuses(
    (raw.destiny as DestinyCollection | null | undefined) ?? null,
    raw.destinyCatalog as Readonly<Record<string, DestinyDefinitionMetadata>> | undefined
  );
  const preRealmAttributes = createZeroBaseAttributes();
  for (const key of BASE_ATTRIBUTE_KEYS) {
    const sumVal =
      originAttributes[key] +
      validProgress.allocated[key] +
      validProgress.earnedPermanent[key] +
      destinyAttributeBonuses[key];
    if (!Number.isSafeInteger(sumVal) || sumVal < 0) {
      return { ok: false, code: "INVALID_PROGRESS_STATE" };
    }
    preRealmAttributes[key] = sumVal;
  }

  const effectiveRes = computeCandidateEffectiveBaseAttributes(
    preRealmAttributes,
    factorRes.realmId,
    factorRes.realmStage
  );
  if (!effectiveRes.ok) {
    return { ok: false, code: "INVALID_PROGRESS_STATE" };
  }

  const derivedRes = computeCandidateDerivedStatsFromEffectiveAttributes(
    effectiveRes.effectiveAttributes
  );
  if (!derivedRes.ok) {
    return { ok: false, code: "INVALID_PROGRESS_STATE" };
  }

  return {
    ok: true,
    snapshot: {
      rulesetVersion: TD01_CANDIDATE_RULESET_VERSION,
      approvalState: TD01_CANDIDATE_NUMERIC_APPROVAL_STATE,
      realmId: factorRes.realmId,
      realmStage: factorRes.realmStage,
      level: validProgress.level,
      realmFactor: effectiveRes.realmFactor,
      originAttributes,
      destinyAttributeBonuses,
      preRealmAttributes,
      effectiveAttributes: effectiveRes.effectiveAttributes,
      derivedStats: derivedRes.derivedStats
    }
  };
}
