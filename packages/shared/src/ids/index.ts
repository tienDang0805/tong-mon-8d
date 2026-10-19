export type ZoneId = "tan_thu_thon" | "thanh_truc_lam";

export type Direction = "down" | "left" | "right" | "up";

export type AnimState = "idle" | "walk" | "attack" | "cast" | "hurt";

export type CombatDisciplineId = "kiem_tu" | "phap_tu" | "the_tu";

export type CanonicalRealmId =
  | "pham_nhan"
  | "luyen_khi"
  | "truc_co"
  | "kim_dan"
  | "nguyen_anh"
  | "hoa_than"
  | "luyen_hu"
  | "hop_the"
  | "do_kiep"
  | "ban_tien"
  | "chan_tien"
  | "thai_at_kim_tien"
  | "dai_la_kim_tien"
  | "tram_nhat_dao"
  | "tram_nhi_dao"
  | "tram_tam_dao"
  | "ban_thanh"
  | "thanh_canh";

export type NpcRealmId = CanonicalRealmId | "UNKNOWN";

export type DiscipleTier =
  | "stranger"
  | "huu_duyen"
  | "duoc_chu_y"
  | "ky_danh"
  | "noi_mon"
  | "chan_truyen";

export type FoodQualityTier =
  | "binh_thuong"
  | "ngon_mieng"
  | "thuong_pham"
  | "cuc_pham"
  | "tien_tru"
  | "thanh_yen";

export type BuffSlotCategory = "meal" | "beverage" | "pill" | "blessing";

export type BaseAttributeKey =
  | "the_phach"
  | "luc_dao"
  | "linh_tinh"
  | "than_phap"
  | "than_thuc"
  | "ngo_tinh";

export type CharacterCreationState = "draft" | "confirmed";

export type DestinyRarity = "pham" | "hoang" | "tien" | "than";

export type DestinyKind = "ordinary" | "legendary_signature";
