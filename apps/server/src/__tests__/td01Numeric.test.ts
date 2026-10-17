import { describe, expect, it } from "vitest";
import type { BaseAttributes, CharacterLevelProgress } from "@tong-mon-8d/shared";
import {
  allocateSingleAttributePoint,
  applyCandidateCharacterExpGrant,
  CANDIDATE_ORIGIN_BASE_ATTRIBUTE,
  computeCandidateBaselineStatSnapshot,
  computeCandidateDerivedStatsFromEffectiveAttributes,
  computeCandidateEffectiveBaseAttributes,
  computeCandidateExpToNextLevel,
  computeCandidateRealmStageFactor,
  computeCandidateTotalExpForLevelSpan,
  computeOfflineMeditationReward,
  createCandidateOriginBaseAttributes,
  createZeroBaseAttributes,
  getCandidateExpToNextLevelBigInt,
  getCandidateExpToNextLevelDecimal,
  getCandidateRealmStageFactor,
  getNextRealmAndStage,
  getRealmRequiredTuVi,
  MAX_SUPPORTED_EXP_BIGINT,
  REALM_PROGRESSION,
  sumBaseAttributes,
  TD01_CANDIDATE_NUMERIC_APPROVAL_STATE,
  TD01_CANDIDATE_RULESET_VERSION,
  validateCharacterLevelProgress
} from "@tong-mon-8d/game-data";

function createFrozenProgress(
  level: number,
  expTowardNext: string,
  freeAttributePoints: number,
  allocatedOverrides: Partial<BaseAttributes> = {},
  earnedPermanentOverrides: Partial<BaseAttributes> = {}
): CharacterLevelProgress {
  const allocated: BaseAttributes = Object.freeze({
    ...createZeroBaseAttributes(),
    ...allocatedOverrides
  });
  const earnedPermanent: BaseAttributes = Object.freeze({
    ...createZeroBaseAttributes(),
    ...earnedPermanentOverrides
  });
  return Object.freeze({
    level,
    expTowardNext,
    freeAttributePoints,
    allocated,
    earnedPermanent
  });
}

describe("TD-01 S1-B1b Pure Numeric Progression & Candidate Stat Simulation Foundation", () => {
  it("matches documented EXP cost samples at Lv1, 9, 10, 30, 350, 351, 1000 and across TD01_SIMULATION.md", () => {
    const documentedSamples: ReadonlyArray< readonly [number, bigint, string] > = [
      [1, 138n, "138"],
      [5, 450n, "450"],
      [9, 1018n, "1018"],
      [10, 1200n, "1200"],
      [11, 1398n, "1398"],
      [20, 3900n, "3900"],
      [30, 8200n, "8200"],
      [31, 8718n, "8718"],
      [100, 83100n, "83100"],
      [330, 881200n, "881200"],
      [350, 990600n, "990600"],
      [351, 996240n, "996240"],
      [400, 1297100n, "1297100"],
      [500, 2060100n, "2060100"],
      [1000, 8875100n, "8875100"]
    ];

    for (const [level, expectedBigInt, expectedDecimal] of documentedSamples) {
      const res = computeCandidateExpToNextLevel(level);
      expect(res).toEqual({
        ok: true,
        level,
        expToNext: expectedBigInt,
        expToNextDecimal: expectedDecimal
      });
      expect(getCandidateExpToNextLevelBigInt(level)).toBe(expectedBigInt);
      expect(getCandidateExpToNextLevelDecimal(level)).toBe(expectedDecimal);
    }
  });

  it("establishes strict EXP cost monotonicity across Lv1..10000 and exact Lv1->10 total EXP cost = 4530", () => {
    let previousCost = 0n;
    let sumLv1To10 = 0n;

    for (let level = 1; level <= 10_000; level += 1) {
      const cost = getCandidateExpToNextLevelBigInt(level);
      expect(cost).not.toBeNull();
      if (cost === null) {
        throw new Error(`Unexpected null EXP cost at level ${level}`);
      }
      expect(cost > previousCost).toBe(true);
      previousCost = cost;
      if (level < 10) {
        sumLv1To10 += cost;
      }
    }

    expect(sumLv1To10).toBe(4530n);
    const spanRes = computeCandidateTotalExpForLevelSpan(1, 10);
    expect(spanRes).toEqual({
      ok: true,
      fromLevel: 1,
      toLevel: 10,
      totalExp: 4530n,
      totalExpDecimal: "4530"
    });
    expect(computeCandidateTotalExpForLevelSpan(10, 10)).toEqual({
      ok: true,
      fromLevel: 10,
      toLevel: 10,
      totalExp: 0n,
      totalExpDecimal: "0"
    });
  });

  it("grants exactly one free attribute point per actual Level gained across multi-level grants without mutating inputs", () => {
    const startLv1 = createFrozenProgress(1, "0", 0);
    const beforeJson = JSON.stringify(startLv1);

    const exactToLv5Cost = computeCandidateTotalExpForLevelSpan(1, 5);
    expect(exactToLv5Cost.ok).toBe(true);
    if (!exactToLv5Cost.ok) {
      throw new Error("Expected valid span 1->5");
    }

    const grantWithRemainder = exactToLv5Cost.totalExp + 77n;
    const outcome = applyCandidateCharacterExpGrant(startLv1, "pham_nhan", grantWithRemainder);
    expect(JSON.stringify(startLv1)).toBe(beforeJson);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("Expected multi-level EXP grant to succeed");
    }

    expect(outcome.previousLevel).toBe(1);
    expect(outcome.newLevel).toBe(5);
    expect(outcome.levelsGained).toBe(4);
    expect(outcome.freeAttributePointsGained).toBe(4);
    expect(outcome.nextProgress.level).toBe(5);
    expect(outcome.nextProgress.freeAttributePoints).toBe(4);
    expect(outcome.nextProgress.expTowardNext).toBe("77");
    expect(outcome.expConsumedDecimal).toBe(exactToLv5Cost.totalExpDecimal);
    expect(outcome.expDiscardedAtCapDecimal).toBe("0");
    expect(outcome.expToNextLevelDecimal).toBe("450");
    expect(outcome.stopReason).toBe("INSUFFICIENT_EXP_FOR_NEXT");
    expect(outcome.cappedAtNonSaintRealm).toBe(false);
    expect(validateCharacterLevelProgress(outcome.nextProgress)).toEqual({ ok: true });
    expect(
      sumBaseAttributes(outcome.nextProgress.allocated) + outcome.nextProgress.freeAttributePoints
    ).toBe(outcome.nextProgress.level - 1);
  });

  it("enforces Phàm Nhân Lv10 and Luyện Khí Lv30 caps and discards overflow EXP under candidate no-banking policy", () => {
    const phamNhanLv9 = createFrozenProgress(9, "350", 2, {
      the_phach: 3,
      luc_dao: 3
    });
    const lv9Before = JSON.stringify(phamNhanLv9);

    const hitLv10Cap = applyCandidateCharacterExpGrant(phamNhanLv9, "pham_nhan", "800");
    expect(JSON.stringify(phamNhanLv9)).toBe(lv9Before);
    expect(hitLv10Cap).toEqual({
      ok: true,
      nextProgress: {
        level: 10,
        expTowardNext: "0",
        freeAttributePoints: 3,
        allocated: {
          ...createZeroBaseAttributes(),
          the_phach: 3,
          luc_dao: 3
        },
        earnedPermanent: createZeroBaseAttributes()
      },
      previousLevel: 9,
      newLevel: 10,
      levelsGained: 1,
      freeAttributePointsGained: 1,
      expGrantedDecimal: "800",
      expConsumedDecimal: "1018",
      expDiscardedAtCapDecimal: "132",
      expToNextLevelDecimal: null,
      stopReason: "LEVEL_CAPPED",
      cappedAtNonSaintRealm: true
    });

    if (!hitLv10Cap.ok) {
      throw new Error("Expected Lv9->10 cap transition to succeed");
    }

    const blockedAtLv10 = applyCandidateCharacterExpGrant(
      hitLv10Cap.nextProgress,
      "pham_nhan",
      "5000"
    );
    expect(blockedAtLv10).toEqual({
      ok: true,
      nextProgress: hitLv10Cap.nextProgress,
      previousLevel: 10,
      newLevel: 10,
      levelsGained: 0,
      freeAttributePointsGained: 0,
      expGrantedDecimal: "5000",
      expConsumedDecimal: "0",
      expDiscardedAtCapDecimal: "5000",
      expToNextLevelDecimal: null,
      stopReason: "LEVEL_CAPPED",
      cappedAtNonSaintRealm: true
    });

    const luyenKhiLv29 = createFrozenProgress(29, "7000", 0, {
      the_phach: 14,
      luc_dao: 14
    });
    const costLv29To30 = getCandidateExpToNextLevelBigInt(29);
    expect(costLv29To30).toBe(7698n);

    const hitLv30Cap = applyCandidateCharacterExpGrant(luyenKhiLv29, "luyen_khi", "2000");
    expect(hitLv30Cap.ok).toBe(true);
    if (!hitLv30Cap.ok) {
      throw new Error("Expected Lv29->30 cap transition to succeed");
    }
    expect(hitLv30Cap.newLevel).toBe(30);
    expect(hitLv30Cap.levelsGained).toBe(1);
    expect(hitLv30Cap.freeAttributePointsGained).toBe(1);
    expect(hitLv30Cap.nextProgress.expTowardNext).toBe("0");
    expect(hitLv30Cap.expConsumedDecimal).toBe("7698");
    expect(hitLv30Cap.expDiscardedAtCapDecimal).toBe("1302");
    expect(hitLv30Cap.expToNextLevelDecimal).toBeNull();
    expect(hitLv30Cap.stopReason).toBe("LEVEL_CAPPED");
    expect(hitLv30Cap.cappedAtNonSaintRealm).toBe(true);
  });

  it("allows Lv10 character after valid Luyện Khí realm transition to progress to Lv11 on a subsequent reward", () => {
    const postBreakthroughLv10 = createFrozenProgress(10, "0", 1, {
      the_phach: 4,
      luc_dao: 3,
      linh_tinh: 1
    });

    const advanceToLv11 = applyCandidateCharacterExpGrant(
      postBreakthroughLv10,
      "luyen_khi",
      "1500"
    );
    expect(advanceToLv11).toEqual({
      ok: true,
      nextProgress: {
        level: 11,
        expTowardNext: "300",
        freeAttributePoints: 2,
        allocated: {
          ...createZeroBaseAttributes(),
          the_phach: 4,
          luc_dao: 3,
          linh_tinh: 1
        },
        earnedPermanent: createZeroBaseAttributes()
      },
      previousLevel: 10,
      newLevel: 11,
      levelsGained: 1,
      freeAttributePointsGained: 1,
      expGrantedDecimal: "1500",
      expConsumedDecimal: "1200",
      expDiscardedAtCapDecimal: "0",
      expToNextLevelDecimal: "1398",
      stopReason: "INSUFFICIENT_EXP_FOR_NEXT",
      cappedAtNonSaintRealm: false
    });
  });

  it("allows unlimited Saint progression Lv350->351 and beyond in Thánh Cảnh with no invented new realm", () => {
    const saintLv350 = createFrozenProgress(350, "0", 49, {
      the_phach: 100,
      luc_dao: 100,
      linh_tinh: 100
    });

    const toLv351 = applyCandidateCharacterExpGrant(saintLv350, "thanh_canh", 1_000_000n);
    expect(toLv351.ok).toBe(true);
    if (!toLv351.ok) {
      throw new Error("Expected Saint Lv350->351 advancement to succeed");
    }
    expect(toLv351.newLevel).toBe(351);
    expect(toLv351.levelsGained).toBe(1);
    expect(toLv351.freeAttributePointsGained).toBe(1);
    expect(toLv351.nextProgress.expTowardNext).toBe("9400");
    expect(toLv351.expConsumedDecimal).toBe("990600");
    expect(toLv351.expDiscardedAtCapDecimal).toBe("0");
    expect(toLv351.expToNextLevelDecimal).toBe("996240");
    expect(toLv351.stopReason).toBe("INSUFFICIENT_EXP_FOR_NEXT");
    expect(toLv351.cappedAtNonSaintRealm).toBe(false);

    const toLv353Cost = computeCandidateTotalExpForLevelSpan(351, 353);
    expect(toLv353Cost.ok).toBe(true);
    if (!toLv353Cost.ok) {
      throw new Error("Expected span 351->353 to succeed");
    }
    const toLv353 = applyCandidateCharacterExpGrant(
      toLv351.nextProgress,
      "thanh_canh",
      toLv353Cost.totalExp
    );
    expect(toLv353.ok).toBe(true);
    if (!toLv353.ok) {
      throw new Error("Expected Saint Lv351->353 advancement to succeed");
    }
    expect(toLv353.newLevel).toBe(353);
    expect(toLv353.levelsGained).toBe(2);
    expect(toLv353.nextProgress.expTowardNext).toBe("9400");
    expect(REALM_PROGRESSION[REALM_PROGRESSION.length - 1]?.id).toBe("thanh_canh");
  });

  it("preserves exact BigInt precision beyond IEEE-754 double safe integer limits without floating-point loss", () => {
    const highSaintLevel = 100_000_000;
    const costRes = computeCandidateExpToNextLevel(highSaintLevel);
    expect(costRes.ok).toBe(true);
    if (!costRes.ok) {
      throw new Error("Expected highSaintLevel EXP calculation to succeed");
    }
    const l = 100_000_000n;
    const excess = l - 350n;
    const expectedExact = 100n + 30n * l + 8n * l * l + 2n * excess * excess;
    expect(costRes.expToNext).toBe(expectedExact);
    expect(costRes.expToNext > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(BigInt(Number(expectedExact))).not.toBe(expectedExact);

    const highSaintProgress = createFrozenProgress(highSaintLevel, "0", highSaintLevel - 1);
    const exactAdvance = applyCandidateCharacterExpGrant(
      highSaintProgress,
      "thanh_canh",
      expectedExact + 19n
    );
    expect(exactAdvance.ok).toBe(true);
    if (!exactAdvance.ok) {
      throw new Error("Expected high-precision BigInt grant at highSaintLevel to succeed");
    }
    expect(exactAdvance.newLevel).toBe(highSaintLevel + 1);
    expect(exactAdvance.nextProgress.expTowardNext).toBe("19");
    expect(exactAdvance.expConsumedDecimal).toBe(expectedExact.toString(10));
  });

  it("verifies realm-stage factor monotonicity across all 18 realms and major-realm rollovers", () => {
    expect(REALM_PROGRESSION).toHaveLength(18);
    let previousRealmLastFactor = 0;

    for (const realm of REALM_PROGRESSION) {
      let previousStageFactor = 0;
      for (let stage = 1; stage <= realm.stageCount; stage += 1) {
        const res = computeCandidateRealmStageFactor(realm.id, stage);
        expect(res.ok).toBe(true);
        if (!res.ok) {
          throw new Error(`Expected valid realm factor for ${realm.id} stage ${stage}`);
        }
        expect(getCandidateRealmStageFactor(realm.id, stage)).toBe(res.factor);
        if (stage === 1 && realm.orderIndex > 0) {
          expect(res.factor > previousRealmLastFactor).toBe(true);
        }
        if (stage > 1) {
          expect(res.factor > previousStageFactor).toBe(true);
        }
        previousStageFactor = res.factor;
      }
      previousRealmLastFactor = previousStageFactor;
    }

    expect(getCandidateRealmStageFactor("pham_nhan", 1)).toBe(1.0);
    expect(getCandidateRealmStageFactor("luyen_khi", 1)).toBe(1.5);
    expect(getCandidateRealmStageFactor("luyen_khi", 9)).toBe(1.95);
    expect(getCandidateRealmStageFactor("truc_co", 1)).toBe(2.25);
  });

  it("matches baseline candidate stat samples in TD01_SIMULATION.md and CHARACTER.md including real Lv11/Lv30 allocations", () => {
    expect(CANDIDATE_ORIGIN_BASE_ATTRIBUTE).toBe(10);
    expect(createCandidateOriginBaseAttributes()).toEqual({
      the_phach: 10,
      luc_dao: 10,
      linh_tinh: 10,
      than_phap: 10,
      than_thuc: 10,
      ngo_tinh: 10
    });

    const lv1PhamNhan = computeCandidateBaselineStatSnapshot({
      realmId: "pham_nhan",
      realmStage: 1,
      levelProgress: createFrozenProgress(1, "0", 0)
    });
    expect(lv1PhamNhan.ok).toBe(true);
    if (!lv1PhamNhan.ok) {
      throw new Error("Expected Lv1 Pham Nhan stat snapshot to succeed");
    }
    expect(lv1PhamNhan.snapshot.rulesetVersion).toBe(TD01_CANDIDATE_RULESET_VERSION);
    expect(lv1PhamNhan.snapshot.approvalState).toBe(TD01_CANDIDATE_NUMERIC_APPROVAL_STATE);
    expect(lv1PhamNhan.snapshot.realmFactor).toBe(1.0);
    expect(lv1PhamNhan.snapshot.derivedStats).toEqual({
      maxHp: 220,
      maxMp: 140,
      physicalAttack: 25,
      spiritualAttack: 25,
      physicalDefense: 12,
      spiritualDefense: 12,
      moveSpeedRating: 105,
      cultivationRateRating: 105
    });

    const isolatedHypotheticalEff = computeCandidateEffectiveBaseAttributes(
      createCandidateOriginBaseAttributes(),
      "luyen_khi",
      1
    );
    expect(isolatedHypotheticalEff).toEqual({
      ok: true,
      realmFactor: 1.5,
      effectiveAttributes: {
        the_phach: 15,
        luc_dao: 15,
        linh_tinh: 15,
        than_phap: 15,
        than_thuc: 15,
        ngo_tinh: 15
      }
    });
    if (!isolatedHypotheticalEff.ok) {
      throw new Error("Expected isolated hypothetical effective attributes to succeed");
    }
    const isolatedHypotheticalDerived = computeCandidateDerivedStatsFromEffectiveAttributes(
      isolatedHypotheticalEff.effectiveAttributes
    );
    expect(isolatedHypotheticalDerived).toEqual({
      ok: true,
      derivedStats: {
        maxHp: 280,
        maxMp: 190,
        physicalAttack: 35,
        spiritualAttack: 35,
        physicalDefense: 17,
        spiritualDefense: 17,
        moveSpeedRating: 107,
        cultivationRateRating: 107
      }
    });

    const lv11LuyenKhi1 = computeCandidateBaselineStatSnapshot({
      realmId: "luyen_khi",
      realmStage: 1,
      levelProgress: createFrozenProgress(11, "0", 0, {
        the_phach: 4,
        luc_dao: 4,
        linh_tinh: 2
      })
    });
    expect(lv11LuyenKhi1.ok).toBe(true);
    if (!lv11LuyenKhi1.ok) {
      throw new Error("Expected Lv11 Luyen Khi 1 snapshot to succeed");
    }
    expect(lv11LuyenKhi1.snapshot.realmFactor).toBe(1.5);
    expect(lv11LuyenKhi1.snapshot.derivedStats.maxHp).toBe(352);
    expect(lv11LuyenKhi1.snapshot.derivedStats.maxMp).toBe(220);
    expect(lv11LuyenKhi1.snapshot.derivedStats.physicalAttack).toBe(47);
    expect(lv11LuyenKhi1.snapshot.derivedStats.physicalDefense).toBe(24);

    const lv30Allocations: Partial<BaseAttributes> = {
      the_phach: 12,
      luc_dao: 12,
      linh_tinh: 5
    };
    const lv30LuyenKhi9 = computeCandidateBaselineStatSnapshot({
      realmId: "luyen_khi",
      realmStage: 9,
      levelProgress: createFrozenProgress(30, "0", 0, lv30Allocations)
    });
    expect(lv30LuyenKhi9.ok).toBe(true);
    if (!lv30LuyenKhi9.ok) {
      throw new Error("Expected Lv30 Luyen Khi 9 snapshot to succeed");
    }
    expect(lv30LuyenKhi9.snapshot.realmFactor).toBe(1.95);
    expect(lv30LuyenKhi9.snapshot.derivedStats.maxHp).toBe(604);
    expect(lv30LuyenKhi9.snapshot.derivedStats.maxMp).toBe(330);
    expect(lv30LuyenKhi9.snapshot.derivedStats.physicalAttack).toBe(89);
    expect(lv30LuyenKhi9.snapshot.derivedStats.physicalDefense).toBe(46);

    const lv30TrucCo1 = computeCandidateBaselineStatSnapshot({
      realmId: "truc_co",
      realmStage: 1,
      levelProgress: createFrozenProgress(30, "0", 0, lv30Allocations)
    });
    expect(lv30TrucCo1.ok).toBe(true);
    if (!lv30TrucCo1.ok) {
      throw new Error("Expected Lv30 Truc Co 1 post-breakthrough snapshot to succeed");
    }
    expect(lv30TrucCo1.snapshot.realmFactor).toBe(2.25);
    expect(lv30TrucCo1.snapshot.derivedStats.maxHp).toBe(688);
    expect(lv30TrucCo1.snapshot.derivedStats.maxMp).toBe(370);
    expect(lv30TrucCo1.snapshot.derivedStats.physicalAttack).toBe(103);
    expect(lv30TrucCo1.snapshot.derivedStats.physicalDefense).toBe(53);
  });

  it("is deterministic across repeated calls, does not mutate inputs, and preserves legacy Tu Vi APIs", () => {
    const progress = createFrozenProgress(11, "250", 1, {
      the_phach: 4,
      luc_dao: 4,
      linh_tinh: 1
    });
    const inputObj = Object.freeze({
      realmId: "luyen_khi" as const,
      realmStage: 3,
      levelProgress: progress
    });
    const snapshotBefore = JSON.stringify(inputObj);

    const expRun1 = applyCandidateCharacterExpGrant(progress, "luyen_khi", "3000");
    const expRun2 = applyCandidateCharacterExpGrant(progress, "luyen_khi", "3000");
    expect(expRun1).toEqual(expRun2);

    const statRun1 = computeCandidateBaselineStatSnapshot(inputObj);
    const statRun2 = computeCandidateBaselineStatSnapshot(inputObj);
    expect(statRun1).toEqual(statRun2);
    expect(JSON.stringify(inputObj)).toBe(snapshotBefore);

    if (!expRun1.ok) {
      throw new Error("Expected expRun1 to succeed");
    }
    const allocRes = allocateSingleAttributePoint(expRun1.nextProgress, "the_phach");
    expect(allocRes.ok).toBe(true);

    expect(getRealmRequiredTuVi("pham_nhan", 1)).toBe(120);
    expect(getRealmRequiredTuVi("luyen_khi", 1)).toBe(180);
    expect(getNextRealmAndStage("pham_nhan", 1)).toEqual({
      realmId: "luyen_khi",
      stage: 1,
      isMajorBreakthrough: true
    });
    expect(computeOfflineMeditationReward(3600, "pham_nhan", 1.0)).toEqual({
      cappedSeconds: 3600,
      tuViGained: 540
    });
  });

  it("rejects malformed, negative, non-integer, out-of-band, and overflow inputs fail-closed", () => {
    for (const invalidLevel of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "1", null]) {
      expect(computeCandidateExpToNextLevel(invalidLevel)).toEqual({
        ok: false,
        code: "INVALID_LEVEL"
      });
      expect(getCandidateExpToNextLevelBigInt(invalidLevel)).toBeNull();
      expect(getCandidateExpToNextLevelDecimal(invalidLevel)).toBeNull();
    }

    expect(computeCandidateTotalExpForLevelSpan(10, 5)).toEqual({
      ok: false,
      code: "INVALID_LEVEL_SPAN"
    });
    expect(computeCandidateTotalExpForLevelSpan(0, 5)).toEqual({
      ok: false,
      code: "INVALID_LEVEL"
    });

    const validLv1 = createFrozenProgress(1, "0", 0);
    for (const invalidGrant of [
      "",
      "-1",
      "-100",
      "12.5",
      "01",
      "1e5",
      "NaN",
      -1n,
      100,
      -5,
      1.5,
      Number.NaN,
      null,
      undefined
    ]) {
      expect(applyCandidateCharacterExpGrant(validLv1, "pham_nhan", invalidGrant)).toEqual({
        ok: false,
        code: "INVALID_EXP_GRANT"
      });
    }

    expect(
      applyCandidateCharacterExpGrant(validLv1, "pham_nhan", MAX_SUPPORTED_EXP_BIGINT + 1n)
    ).toEqual({
      ok: false,
      code: "EXP_NUMERIC_OVERFLOW"
    });

    expect(applyCandidateCharacterExpGrant(validLv1, "dai_thanh", "100")).toEqual({
      ok: false,
      code: "INVALID_REALM_ID"
    });
    expect(applyCandidateCharacterExpGrant(validLv1, "UNKNOWN", "100")).toEqual({
      ok: false,
      code: "INVALID_REALM_ID"
    });
    expect(applyCandidateCharacterExpGrant(validLv1, "luyen_khi", "100")).toEqual({
      ok: false,
      code: "LEVEL_NOT_ALLOWED_FOR_REALM"
    });

    const nonZeroAtCap = createFrozenProgress(10, "50", 9);
    expect(applyCandidateCharacterExpGrant(nonZeroAtCap, "pham_nhan", "100")).toEqual({
      ok: false,
      code: "NON_ZERO_EXP_AT_REALM_CAP"
    });

    expect(computeCandidateRealmStageFactor("UNKNOWN", 1)).toEqual({
      ok: false,
      code: "INVALID_REALM_ID"
    });
    expect(computeCandidateRealmStageFactor("luyen_khi", 0)).toEqual({
      ok: false,
      code: "INVALID_REALM_STAGE"
    });
    expect(computeCandidateRealmStageFactor("luyen_khi", 10)).toEqual({
      ok: false,
      code: "INVALID_REALM_STAGE"
    });
    expect(computeCandidateRealmStageFactor("luyen_khi", 1.5)).toEqual({
      ok: false,
      code: "INVALID_REALM_STAGE"
    });

    expect(
      computeCandidateEffectiveBaseAttributes({ the_phach: -1 }, "pham_nhan", 1)
    ).toEqual({
      ok: false,
      code: "INVALID_PRE_REALM_ATTRIBUTES"
    });
    expect(computeCandidateDerivedStatsFromEffectiveAttributes(null)).toEqual({
      ok: false,
      code: "INVALID_EFFECTIVE_ATTRIBUTES"
    });

    expect(
      computeCandidateBaselineStatSnapshot({
        realmId: "luyen_khi",
        realmStage: 1,
        level: 11,
        freeAttributePoints: 0,
        allocated: createZeroBaseAttributes()
      })
    ).toEqual({
      ok: false,
      code: "INVALID_PROGRESS_STATE"
    });

    expect(
      computeCandidateBaselineStatSnapshot({
        realmId: "truc_co",
        realmStage: 1,
        levelProgress: createFrozenProgress(15, "0", 14)
      })
    ).toEqual({
      ok: false,
      code: "LEVEL_NOT_ALLOWED_FOR_REALM"
    });
  });
});
