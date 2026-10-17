import type {
  BaseAttributeKey,
  BaseAttributes,
  CharacterAppearanceOption,
  DestinyCollection,
  DestinyDefinitionMetadata,
  DestinyRarity,
  DestinyStarterDefinition
} from "@tong-mon-8d/shared";
import {
  BASE_ATTRIBUTE_KEYS,
  createZeroBaseAttributes
} from "../rules/characterContracts.js";

export const DESTINY_RARITIES: readonly DestinyRarity[] = Object.freeze([
  "pham",
  "hoang",
  "tien",
  "than"
]);

export function isDestinyRarity(value: unknown): value is DestinyRarity {
  return typeof value === "string" && (DESTINY_RARITIES as readonly string[]).includes(value);
}

export const CANONICAL_LEGENDARY_NPC_IDS: readonly string[] = Object.freeze([
  "phi_de",
  "rmt_de",
  "vaal_de",
  "chatdvt",
  "dam_lon_tien_tu",
  "ngoc_tam",
  "thai_tai",
  "anh_7",
  "gia_bao",
  "hoa_tran"
]);

export const BASE_ATTRIBUTE_LABELS_VI: Readonly<Record<BaseAttributeKey, string>> =
  Object.freeze({
    the_phach: "Thể Phách",
    luc_dao: "Lực Đạo",
    linh_tinh: "Linh Tính",
    than_phap: "Thân Pháp",
    than_thuc: "Thần Thức",
    ngo_tinh: "Ngộ Tính"
  });

export const DESTINY_RARITY_LABELS_VI: Readonly<Record<DestinyRarity, string>> =
  Object.freeze({
    pham: "Phàm Phẩm",
    hoang: "Hoàng Phẩm",
    tien: "Tiên Phẩm",
    than: "Thần Phẩm"
  });

export const APPROVED_CHARACTER_V02_APPEARANCES: readonly CharacterAppearanceOption[] =
  Object.freeze([
    Object.freeze({
      id: "hero_kiem_tu",
      displayNameVi: "Thanh Vân Đạo Đồ",
      subtitleVi: "Áo lam vân văn • Khí chất chính thống nhập môn",
      spriteKey: "hero_kiem_tu",
      portraitUrl: "/assets/portraits/portrait_hero_kiem_tu.png"
    }),
    Object.freeze({
      id: "hoa_tran",
      displayNameVi: "Thanh Phong Hành Giả",
      subtitleVi: "Áo choàng trúc xanh • Phong thái tiêu dao tự tại",
      spriteKey: "hoa_tran",
      portraitUrl: "/assets/portraits/portrait_hoa_tran.png"
    }),
    Object.freeze({
      id: "ngoc_tam",
      displayNameVi: "Thanh Ngọc Linh Tu",
      subtitleVi: "Bạch y ngọc bội • Linh vận thanh khiết ôn hòa",
      spriteKey: "ngoc_tam",
      portraitUrl: "/assets/portraits/portrait_ngoc_tam.png"
    }),
    Object.freeze({
      id: "anh_7",
      displayNameVi: "Huyền Kiếm Du Hiệp",
      subtitleVi: "Hắc bào sắc bén • Phong sương vạn dặm độc hành",
      spriteKey: "anh_7",
      portraitUrl: "/assets/portraits/portrait_anh_7.png"
    })
  ]);

export function isApprovedCharacterV02AppearanceId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    APPROVED_CHARACTER_V02_APPEARANCES.some((opt) => opt.id === value)
  );
}

export const S1E_STARTER_DESTINY_CATALOG_VERSION = "s1e-starter-v1.0" as const;

export const S1E_STARTER_DESTINY_CATALOG: Readonly<
  Record<string, DestinyStarterDefinition>
> = Object.freeze({
  thach_cot_so_sinh: Object.freeze({
    id: "thach_cot_so_sinh",
    displayNameVi: "Thạch Cốt Sơ Sinh",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Thân thể cứng cáp hơn người thường, chịu đựng va đập cơ bản tốt hơn.",
    flatPreRealmAttributeBonuses: Object.freeze({ the_phach: 1 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  man_luc_so_khai: Object.freeze({
    id: "man_luc_so_khai",
    displayNameVi: "Man Lực Sơ Khai",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Khí huyết dồi dào, sức vóc bẩm sinh mạnh mẽ nơi thôn dã.",
    flatPreRealmAttributeBonuses: Object.freeze({ luc_dao: 1 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  linh_tuc_so_sinh: Object.freeze({
    id: "linh_tuc_so_sinh",
    displayNameVi: "Linh Tức Sơ Sinh",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Hơi thở tự nhiên hòa nhịp cùng linh khí thiên địa quanh mình.",
    flatPreRealmAttributeBonuses: Object.freeze({ linh_tinh: 1 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  khinh_than_so_hoc: Object.freeze({
    id: "khinh_than_so_hoc",
    displayNameVi: "Khinh Thân Sơ Học",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Bước chân thanh thoát nhẹ nhàng, dễ bề né tránh hiểm nguy.",
    flatPreRealmAttributeBonuses: Object.freeze({ than_phap: 1 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  tinh_tam_ngung_than: Object.freeze({
    id: "tinh_tam_ngung_than",
    displayNameVi: "Tĩnh Tâm Ngưng Thần",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Tâm trí vững vàng ít bị ngoại cảnh làm xao động.",
    flatPreRealmAttributeBonuses: Object.freeze({ than_thuc: 1 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  nhat_niem_khai_ngo: Object.freeze({
    id: "nhat_niem_khai_ngo",
    displayNameVi: "Nhất Niệm Khai Ngộ",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Tư chất lanh lợi, đôi khi thoáng bắt được đạo lý ẩn trong vạn vật.",
    flatPreRealmAttributeBonuses: Object.freeze({ ngo_tinh: 1 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  kim_cang_can_cot: Object.freeze({
    id: "kim_cang_can_cot",
    displayNameVi: "Kim Cang Cân Cốt",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Gân cốt rắn chắc tựa đồng thau, khí huyết cuồn cuộn hộ thể.",
    flatPreRealmAttributeBonuses: Object.freeze({ the_phach: 2 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  ho_tieu_chien_mach: Object.freeze({
    id: "ho_tieu_chien_mach",
    displayNameVi: "Hổ Tiếu Chiến Mạch",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Kinh mạch ẩn chứa chiến ý mãnh hổ, mỗi đòn xuất thủ đều tăng thêm uy lực.",
    flatPreRealmAttributeBonuses: Object.freeze({ luc_dao: 2 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  thanh_linh_chi_mach: Object.freeze({
    id: "thanh_linh_chi_mach",
    displayNameVi: "Thanh Linh Chi Mạch",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Linh mạch trong trẻo thông suốt, dung nạp linh khí nhanh nhạy.",
    flatPreRealmAttributeBonuses: Object.freeze({ linh_tinh: 2 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  luu_anh_linh_bo: Object.freeze({
    id: "luu_anh_linh_bo",
    displayNameVi: "Lưu Ảnh Linh Bộ",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Thân pháp linh hoạt như gió lướt mặt hồ, để lại tàn ảnh mờ ảo.",
    flatPreRealmAttributeBonuses: Object.freeze({ than_phap: 2 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  thai_hu_than_niem: Object.freeze({
    id: "thai_hu_than_niem",
    displayNameVi: "Thái Hư Thần Niệm",
    rarity: "tien",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Thần thức rộng mở tựa bầu trời đêm, cảm nhận rõ từng biến động vi diệu.",
    flatPreRealmAttributeBonuses: Object.freeze({ than_thuc: 4 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  minh_khong_ngo_dao: Object.freeze({
    id: "minh_khong_ngo_dao",
    displayNameVi: "Minh Không Ngộ Đạo",
    rarity: "tien",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Tâm cảnh như gương sáng không bụi, lĩnh ngộ huyền cơ nhanh hơn hẳn đồng môn.",
    flatPreRealmAttributeBonuses: Object.freeze({ ngo_tinh: 4 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  hon_nguyen_dao_cot: Object.freeze({
    id: "hon_nguyen_dao_cot",
    displayNameVi: "Hỗn Nguyên Đạo Cốt",
    rarity: "tien",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Thể chất và linh căn dung hợp hài hòa, kiêm tu cả nhục thân lẫn linh lực.",
    flatPreRealmAttributeBonuses: Object.freeze({ the_phach: 2, linh_tinh: 2 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  luc_hop_linh_cot: Object.freeze({
    id: "luc_hop_linh_cot",
    displayNameVi: "Lục Hợp Linh Cốt",
    rarity: "than",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Thần cốt hiếm có hội tụ lục hợp tiên thiên, toàn bộ sáu căn cốt đều được nâng cao.",
    flatPreRealmAttributeBonuses: Object.freeze({
      the_phach: 1,
      luc_dao: 1,
      linh_tinh: 1,
      than_phap: 1,
      than_thuc: 1,
      ngo_tinh: 1
    }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "DESIGN_BASELINE"
  }),
  van_vi_dao_thai: Object.freeze({
    id: "van_vi_dao_thai",
    displayNameVi: "Vạn Vị Đạo Thai",
    rarity: "than",
    kind: "legendary_signature",
    legendaryNpcId: "phi_de",
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Mệnh cách Chân Truyền độc quyền gắn với Phì Đế • Cảm thụ vạn vị nhân gian hóa thành đại đạo.",
    flatPreRealmAttributeBonuses: Object.freeze({ linh_tinh: 4, ngo_tinh: 4 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "APPROVED"
  }),
  huyen_anh_dao_thai: Object.freeze({
    id: "huyen_anh_dao_thai",
    displayNameVi: "Huyễn Ảnh Đạo Thai",
    rarity: "than",
    kind: "legendary_signature",
    legendaryNpcId: "dam_lon_tien_tu",
    ownerApprovalState: "APPROVED",
    descriptionVi:
      "Mệnh cách Chân Truyền thử nghiệm gắn với Dẩm Lồn Tiên Tử (Cốt truyện: CHƯA THIẾT KẾ).",
    flatPreRealmAttributeBonuses: Object.freeze({ than_phap: 4, than_thuc: 4 }),
    bonusApprovalState: "DESIGN_BASELINE",
    narrativeState: "NOT_DESIGNED"
  })
});

export function formatDestinyTraitBonusSummaryVi(
  traitOrId: string | DestinyStarterDefinition
): string {
  const def =
    typeof traitOrId === "string"
      ? S1E_STARTER_DESTINY_CATALOG[traitOrId]
      : traitOrId;
  if (!def || !def.flatPreRealmAttributeBonuses) {
    return "Chưa có chỉ số cộng thêm";
  }
  const bonuses = def.flatPreRealmAttributeBonuses;
  const allPlusOne = BASE_ATTRIBUTE_KEYS.every((k) => bonuses[k] === 1);
  if (allPlusOne) {
    return "Toàn bộ 6 thuộc tính gốc +1";
  }
  const parts: string[] = [];
  for (const key of BASE_ATTRIBUTE_KEYS) {
    const val = bonuses[key];
    if (typeof val === "number" && Number.isSafeInteger(val) && val > 0) {
      parts.push(`${BASE_ATTRIBUTE_LABELS_VI[key]} +${val}`);
    }
  }
  return parts.length > 0 ? parts.join(" • ") : "Chưa có chỉ số cộng thêm";
}

export function computeActiveDestinyPreRealmAttributeBonuses(
  destiny: DestinyCollection | null | undefined,
  catalog?: Readonly<Record<string, DestinyDefinitionMetadata>>
): BaseAttributes {
  const out = createZeroBaseAttributes();
  if (!destiny || typeof destiny !== "object") {
    return out;
  }
  const activeTraitIds = new Set<string>();
  if (Array.isArray(destiny.innate) && destiny.innate.length === 3) {
    for (const id of destiny.innate) {
      if (typeof id === "string" && id.trim().length > 0) {
        activeTraitIds.add(id);
      }
    }
  }
  const ownedAcquired = new Set<string>(
    Array.isArray(destiny.acquiredTraitIds)
      ? destiny.acquiredTraitIds.filter((id): id is string => typeof id === "string")
      : []
  );
  if (Array.isArray(destiny.activeAcquiredSlots) && destiny.activeAcquiredSlots.length === 3) {
    for (const slotId of destiny.activeAcquiredSlots) {
      if (typeof slotId === "string" && ownedAcquired.has(slotId)) {
        activeTraitIds.add(slotId);
      }
    }
  }
  for (const traitId of activeTraitIds) {
    const candidateDef = (catalog?.[traitId] ?? S1E_STARTER_DESTINY_CATALOG[traitId]) as
      | Partial<DestinyStarterDefinition>
      | undefined;
    const starterFallback = S1E_STARTER_DESTINY_CATALOG[traitId];
    const bonusMap =
      candidateDef?.flatPreRealmAttributeBonuses ??
      starterFallback?.flatPreRealmAttributeBonuses;
    if (!bonusMap || typeof bonusMap !== "object") {
      continue;
    }
    for (const key of BASE_ATTRIBUTE_KEYS) {
      const bonusVal = bonusMap[key];
      if (typeof bonusVal === "number" && Number.isSafeInteger(bonusVal) && bonusVal > 0) {
        out[key] += bonusVal;
      }
    }
  }
  return out;
}

export type DestinyDefinitionMetadataValidationResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "INVALID_DEFINITION_OBJECT"
        | "INVALID_TRAIT_ID"
        | "INVALID_DISPLAY_NAME"
        | "INVALID_RARITY"
        | "INVALID_KIND"
        | "INVALID_APPROVAL_STATE"
        | "SIGNATURE_MUST_BE_THAN_RARITY"
        | "SIGNATURE_REQUIRES_CANONICAL_NPC_ID"
        | "ORDINARY_TRAIT_CANNOT_BIND_LEGENDARY_NPC";
    };

export function validateDestinyDefinitionMetadata(
  def: unknown
): DestinyDefinitionMetadataValidationResult {
  if (typeof def !== "object" || def === null || Array.isArray(def)) {
    return { ok: false, code: "INVALID_DEFINITION_OBJECT" };
  }
  const d = def as Record<string, unknown>;
  if (typeof d.id !== "string" || d.id.trim().length === 0) {
    return { ok: false, code: "INVALID_TRAIT_ID" };
  }
  if (typeof d.displayNameVi !== "string" || d.displayNameVi.trim().length === 0) {
    return { ok: false, code: "INVALID_DISPLAY_NAME" };
  }
  if (typeof d.rarity !== "string" || !(DESTINY_RARITIES as readonly string[]).includes(d.rarity)) {
    return { ok: false, code: "INVALID_RARITY" };
  }
  if (d.kind !== "ordinary" && d.kind !== "legendary_signature") {
    return { ok: false, code: "INVALID_KIND" };
  }
  if (d.ownerApprovalState !== "APPROVED" && d.ownerApprovalState !== "PROPOSED") {
    return { ok: false, code: "INVALID_APPROVAL_STATE" };
  }
  if (d.kind === "legendary_signature") {
    if (d.rarity !== "than") {
      return { ok: false, code: "SIGNATURE_MUST_BE_THAN_RARITY" };
    }
    if (
      typeof d.legendaryNpcId !== "string" ||
      !CANONICAL_LEGENDARY_NPC_IDS.includes(d.legendaryNpcId)
    ) {
      return { ok: false, code: "SIGNATURE_REQUIRES_CANONICAL_NPC_ID" };
    }
  } else {
    if (d.legendaryNpcId !== null) {
      return { ok: false, code: "ORDINARY_TRAIT_CANNOT_BIND_LEGENDARY_NPC" };
    }
  }
  return { ok: true };
}

export type DestinyTripleValidationResult =
  | { ok: true; signatureTraitId: string | null }
  | {
      ok: false;
      code:
        | "INVALID_TRIPLE_LENGTH"
        | "UNKNOWN_OR_INVALID_TRAIT"
        | "DUPLICATE_TRAIT_IN_TRIPLE"
        | "MULTIPLE_LEGENDARY_SIGNATURES";
    };

function lookupValidatedDestinyTrait(
  traitId: unknown,
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>
): DestinyDefinitionMetadata | null {
  if (typeof traitId !== "string" || traitId.trim().length === 0) {
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(catalog, traitId)) {
    return null;
  }
  const def = catalog[traitId];
  if (!def || def.id !== traitId) {
    return null;
  }
  const check = validateDestinyDefinitionMetadata(def);
  return check.ok ? def : null;
}

export function validateDestinyTripleIds(
  traitIds: unknown,
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>
): DestinyTripleValidationResult {
  if (!Array.isArray(traitIds) || traitIds.length !== 3) {
    return { ok: false, code: "INVALID_TRIPLE_LENGTH" };
  }
  const seen = new Set<string>();
  let signatureTraitId: string | null = null;
  for (const rawId of traitIds) {
    const def = lookupValidatedDestinyTrait(rawId, catalog);
    if (!def) {
      return { ok: false, code: "UNKNOWN_OR_INVALID_TRAIT" };
    }
    if (seen.has(def.id)) {
      return { ok: false, code: "DUPLICATE_TRAIT_IN_TRIPLE" };
    }
    seen.add(def.id);
    if (def.kind === "legendary_signature") {
      if (signatureTraitId !== null) {
        return { ok: false, code: "MULTIPLE_LEGENDARY_SIGNATURES" };
      }
      signatureTraitId = def.id;
    }
  }
  return { ok: true, signatureTraitId };
}

export type DestinyRollDraftShapeValidationResult =
  | { ok: true; signatureTraitId: string | null }
  | {
      ok: false;
      code:
        | "INVALID_DRAFT_OBJECT"
        | "INVALID_CREATION_ID"
        | "INVALID_ROLL_NONCE"
        | "INVALID_EXPIRES_AT"
        | "INVALID_TRIPLE_LENGTH"
        | "UNKNOWN_OR_INVALID_TRAIT"
        | "DUPLICATE_TRAIT_IN_TRIPLE"
        | "MULTIPLE_LEGENDARY_SIGNATURES";
    };

export function validateDestinyRollDraftShape(
  draft: unknown,
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>
): DestinyRollDraftShapeValidationResult {
  if (typeof draft !== "object" || draft === null || Array.isArray(draft)) {
    return { ok: false, code: "INVALID_DRAFT_OBJECT" };
  }
  const d = draft as Record<string, unknown>;
  if (typeof d.characterCreationId !== "string" || d.characterCreationId.trim().length === 0) {
    return { ok: false, code: "INVALID_CREATION_ID" };
  }
  if (typeof d.rollNonce !== "string" || d.rollNonce.trim().length === 0) {
    return { ok: false, code: "INVALID_ROLL_NONCE" };
  }
  if (typeof d.expiresAtMs !== "number" || !Number.isSafeInteger(d.expiresAtMs) || d.expiresAtMs <= 0) {
    return { ok: false, code: "INVALID_EXPIRES_AT" };
  }
  return validateDestinyTripleIds(d.candidateTraitIds, catalog);
}

export function getOwnedDestinyTraitIds(collection: DestinyCollection): Set<string> {
  return new Set<string>([...collection.innate, ...collection.acquiredTraitIds]);
}

export function hasOwnedDestinyTrait(collection: DestinyCollection, traitId: string): boolean {
  if (typeof traitId !== "string" || traitId.trim().length === 0) {
    return false;
  }
  return getOwnedDestinyTraitIds(collection).has(traitId);
}

export type DestinyCollectionValidationResult =
  | { ok: true; ownedLegendarySignatureId: string | null }
  | {
      ok: false;
      code:
        | "INVALID_COLLECTION_OBJECT"
        | "INVALID_TRIPLE_LENGTH"
        | "UNKNOWN_OR_INVALID_TRAIT"
        | "DUPLICATE_TRAIT_IN_TRIPLE"
        | "INVALID_CONFIRM_TIMESTAMP"
        | "INVALID_COLLECTION_REVISION"
        | "INVALID_ACQUIRED_LIST"
        | "DUPLICATE_ACQUIRED_TRAIT"
        | "INNATE_ACQUIRED_OVERLAP"
        | "MULTIPLE_LEGENDARY_SIGNATURES"
        | "INVALID_ACTIVE_SLOTS_TUPLE"
        | "UNOWNED_ACTIVE_SLOT_TRAIT"
        | "DUPLICATE_ACTIVE_SLOT_TRAIT";
    };

export function validateDestinyCollection(
  collection: unknown,
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>
): DestinyCollectionValidationResult {
  if (typeof collection !== "object" || collection === null || Array.isArray(collection)) {
    return { ok: false, code: "INVALID_COLLECTION_OBJECT" };
  }
  const c = collection as Record<string, unknown>;
  const innateRes = validateDestinyTripleIds(c.innate, catalog);
  if (!innateRes.ok) {
    return innateRes;
  }
  if (
    typeof c.innateConfirmedAtMs !== "number" ||
    !Number.isSafeInteger(c.innateConfirmedAtMs) ||
    c.innateConfirmedAtMs <= 0
  ) {
    return { ok: false, code: "INVALID_CONFIRM_TIMESTAMP" };
  }
  if (
    typeof c.collectionRevision !== "number" ||
    !Number.isSafeInteger(c.collectionRevision) ||
    c.collectionRevision < 1
  ) {
    return { ok: false, code: "INVALID_COLLECTION_REVISION" };
  }
  if (!Array.isArray(c.acquiredTraitIds)) {
    return { ok: false, code: "INVALID_ACQUIRED_LIST" };
  }
  const innateSet = new Set<string>(c.innate as string[]);
  const acquiredSet = new Set<string>();
  let ownedSignatureId = innateRes.signatureTraitId;

  for (const rawId of c.acquiredTraitIds) {
    const def = lookupValidatedDestinyTrait(rawId, catalog);
    if (!def) {
      return { ok: false, code: "UNKNOWN_OR_INVALID_TRAIT" };
    }
    if (innateSet.has(def.id)) {
      return { ok: false, code: "INNATE_ACQUIRED_OVERLAP" };
    }
    if (acquiredSet.has(def.id)) {
      return { ok: false, code: "DUPLICATE_ACQUIRED_TRAIT" };
    }
    acquiredSet.add(def.id);
    if (def.kind === "legendary_signature") {
      if (ownedSignatureId !== null) {
        return { ok: false, code: "MULTIPLE_LEGENDARY_SIGNATURES" };
      }
      ownedSignatureId = def.id;
    }
  }

  if (!Array.isArray(c.activeAcquiredSlots) || c.activeAcquiredSlots.length !== 3) {
    return { ok: false, code: "INVALID_ACTIVE_SLOTS_TUPLE" };
  }
  const activeSeen = new Set<string>();
  for (const slotVal of c.activeAcquiredSlots) {
    if (slotVal === null) {
      continue;
    }
    if (typeof slotVal !== "string" || !acquiredSet.has(slotVal)) {
      return { ok: false, code: "UNOWNED_ACTIVE_SLOT_TRAIT" };
    }
    if (activeSeen.has(slotVal)) {
      return { ok: false, code: "DUPLICATE_ACTIVE_SLOT_TRAIT" };
    }
    activeSeen.add(slotVal);
  }

  return { ok: true, ownedLegendarySignatureId: ownedSignatureId };
}
