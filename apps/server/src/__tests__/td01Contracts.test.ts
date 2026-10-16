import { describe, expect, it } from "vitest";
import type {
  BaseAttributes,
  CharacterLevelProgress,
  DestinyCollection,
  DestinyDefinitionMetadata,
  DestinyRollDraft
} from "@tong-mon-8d/shared";
import {
  allocateSingleAttributePoint,
  BASE_ATTRIBUTE_KEYS,
  CANONICAL_LEGENDARY_NPC_IDS,
  createZeroBaseAttributes,
  DESTINY_RARITIES,
  formatExpDecimalString,
  getOwnedDestinyTraitIds,
  getRealmLevelBand,
  hasOwnedDestinyTrait,
  isAtNonSaintMajorRealmLevelCap,
  isBaseAttributeKey,
  isLevelAllowedForRealm,
  isNonNegativeDecimalIntString,
  isValidRealmStage,
  meetsMajorRealmBreakthroughLevelAndStagePrerequisite,
  parseExpDecimalString,
  REALM_PROGRESSION,
  sumBaseAttributes,
  validateBaseAttributes,
  validateCharacterLevelProgress,
  validateDestinyCollection,
  validateDestinyDefinitionMetadata,
  validateDestinyRollDraftShape,
  validateDestinyTripleIds
} from "@tong-mon-8d/game-data";

const TEST_SYNTHETIC_DESTINY_CATALOG: Readonly<Record<string, DestinyDefinitionMetadata>> = Object.freeze({
  test_pham_1: Object.freeze({
    id: "test_pham_1",
    displayNameVi: "Thử Nghiệm Phàm Mệnh Nhất",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  }),
  test_pham_2: Object.freeze({
    id: "test_pham_2",
    displayNameVi: "Thử Nghiệm Phàm Mệnh Nhị",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  }),
  test_hoang_1: Object.freeze({
    id: "test_hoang_1",
    displayNameVi: "Thử Nghiệm Hoàng Mệnh Nhất",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  }),
  test_tien_1: Object.freeze({
    id: "test_tien_1",
    displayNameVi: "Thử Nghiệm Tiên Mệnh Nhất",
    rarity: "tien",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  }),
  test_generic_than_1: Object.freeze({
    id: "test_generic_than_1",
    displayNameVi: "Thử Nghiệm Phổ Thông Thần Mệnh Nhất",
    rarity: "than",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  }),
  test_generic_than_2: Object.freeze({
    id: "test_generic_than_2",
    displayNameVi: "Thử Nghiệm Phổ Thông Thần Mệnh Nhị",
    rarity: "than",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  }),
  van_vi_dao_thai: Object.freeze({
    id: "van_vi_dao_thai",
    displayNameVi: "Vạn Vị Đạo Thai",
    rarity: "than",
    kind: "legendary_signature",
    legendaryNpcId: "phi_de",
    ownerApprovalState: "APPROVED"
  }),
  test_sig_rmt_de: Object.freeze({
    id: "test_sig_rmt_de",
    displayNameVi: "Thử Nghiệm Độc Hữu RMT Đế",
    rarity: "than",
    kind: "legendary_signature",
    legendaryNpcId: "rmt_de",
    ownerApprovalState: "PROPOSED"
  })
});

describe("TD-01 S1-B1a Pure Character, Destiny, and Realm Structural Contracts", () => {
  it("verifies canonical six base attribute keys and rejects non-canonical or malformed attribute maps", () => {
    expect(BASE_ATTRIBUTE_KEYS).toEqual([
      "the_phach",
      "luc_dao",
      "linh_tinh",
      "than_phap",
      "than_thuc",
      "ngo_tinh"
    ]);
    for (const key of BASE_ATTRIBUTE_KEYS) {
      expect(isBaseAttributeKey(key)).toBe(true);
    }
    expect(isBaseAttributeKey("linh_can")).toBe(false);
    expect(isBaseAttributeKey("co_duyen")).toBe(false);
    expect(isBaseAttributeKey("crit")).toBe(false);
    expect(isBaseAttributeKey(10)).toBe(false);

    const zero: BaseAttributes = createZeroBaseAttributes();
    expect(sumBaseAttributes(zero)).toBe(0);
    expect(validateBaseAttributes(zero)).toEqual({ ok: true, value: zero });

    const missingKey = {
      the_phach: 0,
      luc_dao: 0,
      linh_tinh: 0,
      than_phap: 0,
      than_thuc: 0
    };
    expect(validateBaseAttributes(missingKey)).toEqual({
      ok: false,
      code: "MISSING_ATTRIBUTE_KEY"
    });

    const extraKey = {
      ...zero,
      linh_can: 1
    };
    expect(validateBaseAttributes(extraKey)).toEqual({
      ok: false,
      code: "EXTRA_ATTRIBUTE_KEY"
    });

    expect(validateBaseAttributes({ ...zero, the_phach: -1 })).toEqual({
      ok: false,
      code: "INVALID_ATTRIBUTE_VALUE"
    });
    expect(validateBaseAttributes({ ...zero, luc_dao: 1.5 })).toEqual({
      ok: false,
      code: "INVALID_ATTRIBUTE_VALUE"
    });
    expect(validateBaseAttributes({ ...zero, linh_tinh: Number.NaN })).toEqual({
      ok: false,
      code: "INVALID_ATTRIBUTE_VALUE"
    });
    expect(validateBaseAttributes({ ...zero, than_phap: Number.POSITIVE_INFINITY })).toEqual({
      ok: false,
      code: "INVALID_ATTRIBUTE_VALUE"
    });
    expect(validateBaseAttributes(null)).toEqual({
      ok: false,
      code: "INVALID_ATTRIBUTES_OBJECT"
    });
    expect(validateBaseAttributes([])).toEqual({
      ok: false,
      code: "INVALID_ATTRIBUTES_OBJECT"
    });
  });

  it("verifies decimal-string EXP validation, precision-safe bigint parsing, and formatting", () => {
    expect(isNonNegativeDecimalIntString("0")).toBe(true);
    expect(isNonNegativeDecimalIntString("138")).toBe(true);
    const maxNumeric38 = "99999999999999999999999999999999999999";
    expect(isNonNegativeDecimalIntString(maxNumeric38)).toBe(true);

    expect(parseExpDecimalString("0")).toBe(0n);
    expect(parseExpDecimalString(maxNumeric38)).toBe(BigInt(maxNumeric38));
    expect(formatExpDecimalString(BigInt(maxNumeric38))).toBe(maxNumeric38);
    expect(formatExpDecimalString(0n)).toBe("0");

    for (const invalid of ["", " ", "-1", "+10", "00", "01", "12.34", "1e6", "NaN", "Infinity", 100, null]) {
      expect(isNonNegativeDecimalIntString(invalid)).toBe(false);
      expect(parseExpDecimalString(invalid)).toBeNull();
    }
    expect(formatExpDecimalString(-1n)).toBeNull();
    expect(formatExpDecimalString(123)).toBeNull();
  });

  it("verifies Level 1 zero-point invariant, earnedPermanent separation, and pure single-point allocation without input mutation", () => {
    const level1Progress: CharacterLevelProgress = Object.freeze({
      level: 1,
      expTowardNext: "0",
      freeAttributePoints: 0,
      allocated: Object.freeze(createZeroBaseAttributes()),
      earnedPermanent: Object.freeze({
        ...createZeroBaseAttributes(),
        ngo_tinh: 3
      })
    });

    expect(validateCharacterLevelProgress(level1Progress)).toEqual({ ok: true });
    expect(allocateSingleAttributePoint(level1Progress, "the_phach")).toEqual({
      ok: false,
      code: "INSUFFICIENT_FREE_POINTS"
    });

    const level3Progress: CharacterLevelProgress = Object.freeze({
      level: 3,
      expTowardNext: "450",
      freeAttributePoints: 2,
      allocated: Object.freeze(createZeroBaseAttributes()),
      earnedPermanent: Object.freeze({
        ...createZeroBaseAttributes(),
        than_thuc: 5
      })
    });

    const snapshotBefore = JSON.stringify(level3Progress);
    const step1 = allocateSingleAttributePoint(level3Progress, "the_phach");
    expect(JSON.stringify(level3Progress)).toBe(snapshotBefore);
    expect(step1.ok).toBe(true);
    if (!step1.ok) {
      throw new Error("Expected step1 allocation to succeed");
    }
    expect(step1.next.freeAttributePoints).toBe(1);
    expect(step1.next.allocated.the_phach).toBe(1);
    expect(sumBaseAttributes(step1.next.allocated) + step1.next.freeAttributePoints).toBe(
      step1.next.level - 1
    );
    expect(validateCharacterLevelProgress(step1.next)).toEqual({ ok: true });

    const step2 = allocateSingleAttributePoint(step1.next, "luc_dao");
    expect(step2.ok).toBe(true);
    if (!step2.ok) {
      throw new Error("Expected step2 allocation to succeed");
    }
    expect(step2.next.freeAttributePoints).toBe(0);
    expect(step2.next.allocated.the_phach).toBe(1);
    expect(step2.next.allocated.luc_dao).toBe(1);
    expect(validateCharacterLevelProgress(step2.next)).toEqual({ ok: true });

    expect(allocateSingleAttributePoint(step2.next, "linh_tinh")).toEqual({
      ok: false,
      code: "INSUFFICIENT_FREE_POINTS"
    });
    expect(allocateSingleAttributePoint(level3Progress, "invalid_stat")).toEqual({
      ok: false,
      code: "INVALID_ATTRIBUTE_KEY"
    });

    const brokenInvariant: CharacterLevelProgress = {
      level: 5,
      expTowardNext: "0",
      freeAttributePoints: 2,
      allocated: {
        ...createZeroBaseAttributes(),
        the_phach: 1
      },
      earnedPermanent: createZeroBaseAttributes()
    };
    expect(validateCharacterLevelProgress(brokenInvariant)).toEqual({
      ok: false,
      code: "LEVEL_POINT_INVARIANT_MISMATCH"
    });
    expect(allocateSingleAttributePoint(brokenInvariant, "the_phach")).toEqual({
      ok: false,
      code: "INVALID_PROGRESS_STATE"
    });
  });

  it("verifies Destiny definition metadata rules, three-slot uniqueness, one-signature maximum, and generic Than coexistence", () => {
    expect(DESTINY_RARITIES).toEqual(["pham", "hoang", "tien", "than"]);
    expect(CANONICAL_LEGENDARY_NPC_IDS).toHaveLength(10);
    expect(CANONICAL_LEGENDARY_NPC_IDS).toContain("phi_de");
    expect(CANONICAL_LEGENDARY_NPC_IDS).not.toContain("merchant_truong");

    for (const def of Object.values(TEST_SYNTHETIC_DESTINY_CATALOG)) {
      expect(validateDestinyDefinitionMetadata(def)).toEqual({ ok: true });
    }

    expect(
      validateDestinyDefinitionMetadata({
        id: "bad_sig_tier",
        displayNameVi: "Sai Phẩm Chất",
        rarity: "tien",
        kind: "legendary_signature",
        legendaryNpcId: "phi_de",
        ownerApprovalState: "PROPOSED"
      })
    ).toEqual({ ok: false, code: "SIGNATURE_MUST_BE_THAN_RARITY" });

    expect(
      validateDestinyDefinitionMetadata({
        id: "bad_sig_npc",
        displayNameVi: "Sai NPC",
        rarity: "than",
        kind: "legendary_signature",
        legendaryNpcId: "merchant_truong",
        ownerApprovalState: "PROPOSED"
      })
    ).toEqual({ ok: false, code: "SIGNATURE_REQUIRES_CANONICAL_NPC_ID" });

    expect(
      validateDestinyDefinitionMetadata({
        id: "bad_ordinary_npc",
        displayNameVi: "Phổ Thông Gắn NPC",
        rarity: "than",
        kind: "ordinary",
        legendaryNpcId: "phi_de",
        ownerApprovalState: "PROPOSED"
      })
    ).toEqual({ ok: false, code: "ORDINARY_TRAIT_CANNOT_BIND_LEGENDARY_NPC" });

    expect(
      validateDestinyDefinitionMetadata({
        id: "bad_approval_state",
        displayNameVi: "Sai Trạng Thái Phê Duyệt",
        rarity: "pham",
        kind: "ordinary",
        legendaryNpcId: null,
        ownerApprovalState: "DESIGN_BASELINE"
      })
    ).toEqual({ ok: false, code: "INVALID_APPROVAL_STATE" });

    const validTripleWithSigAndTwoGenericThan = Object.freeze([
      "van_vi_dao_thai",
      "test_generic_than_1",
      "test_generic_than_2"
    ]);
    expect(
      validateDestinyTripleIds(validTripleWithSigAndTwoGenericThan, TEST_SYNTHETIC_DESTINY_CATALOG)
    ).toEqual({
      ok: true,
      signatureTraitId: "van_vi_dao_thai"
    });

    expect(
      validateDestinyTripleIds(
        ["test_pham_1", "test_pham_1", "test_hoang_1"],
        TEST_SYNTHETIC_DESTINY_CATALOG
      )
    ).toEqual({ ok: false, code: "DUPLICATE_TRAIT_IN_TRIPLE" });

    expect(
      validateDestinyTripleIds(
        ["van_vi_dao_thai", "test_sig_rmt_de", "test_pham_1"],
        TEST_SYNTHETIC_DESTINY_CATALOG
      )
    ).toEqual({ ok: false, code: "MULTIPLE_LEGENDARY_SIGNATURES" });

    const validDraft: DestinyRollDraft = Object.freeze<DestinyRollDraft>({
      characterCreationId: "create_001",
      rollNonce: "opaque_nonce_abc_123",
      candidateTraitIds: ["test_pham_1", "test_generic_than_1", "van_vi_dao_thai"],
      expiresAtMs: 1760000000000
    });
    expect(validateDestinyRollDraftShape(validDraft, TEST_SYNTHETIC_DESTINY_CATALOG)).toEqual({
      ok: true,
      signatureTraitId: "van_vi_dao_thai"
    });
    expect(
      validateDestinyRollDraftShape(
        { ...validDraft, rollNonce: "   " },
        TEST_SYNTHETIC_DESTINY_CATALOG
      )
    ).toEqual({ ok: false, code: "INVALID_ROLL_NONCE" });
  });

  it("verifies DestinyCollection ownership union, active acquired slot constraints, and signature exclusivity across innate and acquired traits", () => {
    const validCollection: DestinyCollection = Object.freeze<DestinyCollection>({
      innate: ["test_pham_1", "test_hoang_1", "test_generic_than_1"],
      innateConfirmedAtMs: 1760000000000,
      acquiredTraitIds: ["van_vi_dao_thai", "test_tien_1", "test_generic_than_2"],
      activeAcquiredSlots: ["test_tien_1", null, "test_generic_than_2"],
      collectionRevision: 2
    });

    const inputBefore = JSON.stringify(validCollection);
    expect(validateDestinyCollection(validCollection, TEST_SYNTHETIC_DESTINY_CATALOG)).toEqual({
      ok: true,
      ownedLegendarySignatureId: "van_vi_dao_thai"
    });
    expect(hasOwnedDestinyTrait(validCollection, "van_vi_dao_thai")).toBe(true);
    expect(hasOwnedDestinyTrait(validCollection, "test_pham_1")).toBe(true);
    expect(hasOwnedDestinyTrait(validCollection, "test_sig_rmt_de")).toBe(false);
    expect(getOwnedDestinyTraitIds(validCollection).size).toBe(6);
    expect(JSON.stringify(validCollection)).toBe(inputBefore);

    const secondSignatureInAcquired: DestinyCollection = {
      ...validCollection,
      innate: ["van_vi_dao_thai", "test_pham_1", "test_hoang_1"],
      acquiredTraitIds: ["test_sig_rmt_de", "test_tien_1"],
      activeAcquiredSlots: ["test_tien_1", null, null]
    };
    expect(
      validateDestinyCollection(secondSignatureInAcquired, TEST_SYNTHETIC_DESTINY_CATALOG)
    ).toEqual({
      ok: false,
      code: "MULTIPLE_LEGENDARY_SIGNATURES"
    });

    const innateEquippedInAcquiredSlot: DestinyCollection = {
      ...validCollection,
      activeAcquiredSlots: ["test_pham_1", null, null]
    };
    expect(
      validateDestinyCollection(innateEquippedInAcquiredSlot, TEST_SYNTHETIC_DESTINY_CATALOG)
    ).toEqual({
      ok: false,
      code: "UNOWNED_ACTIVE_SLOT_TRAIT"
    });

    const unownedEquippedSlot: DestinyCollection = {
      ...validCollection,
      activeAcquiredSlots: ["test_pham_2", null, null]
    };
    expect(validateDestinyCollection(unownedEquippedSlot, TEST_SYNTHETIC_DESTINY_CATALOG)).toEqual({
      ok: false,
      code: "UNOWNED_ACTIVE_SLOT_TRAIT"
    });

    const duplicateActiveSlot: DestinyCollection = {
      ...validCollection,
      activeAcquiredSlots: ["test_tien_1", "test_tien_1", null]
    };
    expect(validateDestinyCollection(duplicateActiveSlot, TEST_SYNTHETIC_DESTINY_CATALOG)).toEqual({
      ok: false,
      code: "DUPLICATE_ACTIVE_SLOT_TRAIT"
    });

    const overlapInnateAndAcquired: DestinyCollection = {
      ...validCollection,
      acquiredTraitIds: ["test_pham_1", "test_tien_1"],
      activeAcquiredSlots: ["test_tien_1", null, null]
    };
    expect(
      validateDestinyCollection(overlapInnateAndAcquired, TEST_SYNTHETIC_DESTINY_CATALOG)
    ).toEqual({
      ok: false,
      code: "INNATE_ACQUIRED_OVERLAP"
    });
  });

  it("verifies 18-entry realm progression level bands, post-breakthrough boundary levels, unlimited Saint levels, and fail-closed inputs", () => {
    expect(REALM_PROGRESSION).toHaveLength(18);
    expect(REALM_PROGRESSION[0]?.id).toBe("pham_nhan");
    expect(REALM_PROGRESSION[1]?.id).toBe("luyen_khi");
    expect(REALM_PROGRESSION[17]?.id).toBe("thanh_canh");

    expect(getRealmLevelBand("pham_nhan")).toEqual({
      realmId: "pham_nhan",
      orderIndex: 0,
      stageCount: 1,
      minLevel: 1,
      maxLevel: 10,
      postBreakthroughMinLevel: 1
    });
    expect(getRealmLevelBand("luyen_khi")).toEqual({
      realmId: "luyen_khi",
      orderIndex: 1,
      stageCount: 9,
      minLevel: 11,
      maxLevel: 30,
      postBreakthroughMinLevel: 10
    });
    expect(getRealmLevelBand("truc_co")).toEqual({
      realmId: "truc_co",
      orderIndex: 2,
      stageCount: 4,
      minLevel: 31,
      maxLevel: 50,
      postBreakthroughMinLevel: 30
    });
    expect(getRealmLevelBand("ban_thanh")).toEqual({
      realmId: "ban_thanh",
      orderIndex: 16,
      stageCount: 4,
      minLevel: 311,
      maxLevel: 330,
      postBreakthroughMinLevel: 310
    });
    expect(getRealmLevelBand("thanh_canh")).toEqual({
      realmId: "thanh_canh",
      orderIndex: 17,
      stageCount: 4,
      minLevel: 331,
      maxLevel: null,
      postBreakthroughMinLevel: 330
    });

    expect(isLevelAllowedForRealm("pham_nhan", 1)).toBe(true);
    expect(isLevelAllowedForRealm("pham_nhan", 10)).toBe(true);
    expect(isLevelAllowedForRealm("pham_nhan", 0)).toBe(false);
    expect(isLevelAllowedForRealm("pham_nhan", 11)).toBe(false);

    expect(isLevelAllowedForRealm("luyen_khi", 10)).toBe(true);
    expect(isLevelAllowedForRealm("luyen_khi", 11)).toBe(true);
    expect(isLevelAllowedForRealm("luyen_khi", 30)).toBe(true);
    expect(isLevelAllowedForRealm("luyen_khi", 9)).toBe(false);
    expect(isLevelAllowedForRealm("luyen_khi", 31)).toBe(false);

    expect(isLevelAllowedForRealm("truc_co", 30)).toBe(true);
    expect(isLevelAllowedForRealm("truc_co", 50)).toBe(true);
    expect(isLevelAllowedForRealm("truc_co", 29)).toBe(false);
    expect(isLevelAllowedForRealm("truc_co", 51)).toBe(false);

    expect(isLevelAllowedForRealm("thanh_canh", 330)).toBe(true);
    expect(isLevelAllowedForRealm("thanh_canh", 350)).toBe(true);
    expect(isLevelAllowedForRealm("thanh_canh", 351)).toBe(true);
    expect(isLevelAllowedForRealm("thanh_canh", 10000)).toBe(true);
    expect(isLevelAllowedForRealm("thanh_canh", 329)).toBe(false);

    expect(isAtNonSaintMajorRealmLevelCap("pham_nhan", 10)).toBe(true);
    expect(isAtNonSaintMajorRealmLevelCap("luyen_khi", 30)).toBe(true);
    expect(isAtNonSaintMajorRealmLevelCap("thanh_canh", 350)).toBe(false);
    expect(isAtNonSaintMajorRealmLevelCap("thanh_canh", 351)).toBe(false);

    expect(meetsMajorRealmBreakthroughLevelAndStagePrerequisite("luyen_khi", 9, 15)).toBe(false);
    expect(meetsMajorRealmBreakthroughLevelAndStagePrerequisite("luyen_khi", 7, 30)).toBe(false);
    expect(meetsMajorRealmBreakthroughLevelAndStagePrerequisite("luyen_khi", 9, 30)).toBe(true);
    expect(meetsMajorRealmBreakthroughLevelAndStagePrerequisite("thanh_canh", 4, 350)).toBe(false);

    expect(getRealmLevelBand("dai_thanh")).toBeNull();
    expect(getRealmLevelBand("UNKNOWN")).toBeNull();
    expect(getRealmLevelBand(null)).toBeNull();
    expect(isValidRealmStage("luyen_khi", 0)).toBe(false);
    expect(isValidRealmStage("luyen_khi", 10)).toBe(false);
    expect(isValidRealmStage("luyen_khi", 1.5)).toBe(false);
    expect(isLevelAllowedForRealm("luyen_khi", 15.5)).toBe(false);
    expect(isLevelAllowedForRealm("UNKNOWN", 1)).toBe(false);
  });
});
