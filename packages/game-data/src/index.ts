import type {
  BuffSlotCategory,
  CanonicalRealmId,
  CombatDisciplineId,
  FoodQualityTier,
  NpcRealmId,
  ZoneId
} from "@tong-mon-8d/shared";
import { REALM_PROGRESSION, type RealmDefinition } from "./catalogs/realms.js";

export { REALM_PROGRESSION, type RealmDefinition };

export interface LegendaryNpcDefinition {
  id: string;
  nameVi: string;
  titleVi: string;
  realmId: NpcRealmId;
  realmDisplayVi: string;
  daoNameVi: string;
  isLegendaryTen: boolean;
  isTamDe: boolean;
  spriteKey: string;
  portraitKey: string;
  zoneId: ZoneId;
  spawnX: number;
  spawnY: number;
  greetingLinesVi: string[];
  questlineTitleVi: string;
  inheritanceSkillNameVi: string;
}

export const LEGENDARY_NPCS: LegendaryNpcDefinition[] = [
  {
    id: "phi_de",
    nameVi: "Phì Đế — Đặng Văn Tiến",
    titleVi: "Ẩm Thực Đại Đạo Chí Tôn • Khai Sơn Tổ Sư 8D",
    realmId: "thanh_canh",
    realmDisplayVi: "Thánh Cảnh",
    daoNameVi: "Ẩm Thực Đại Đạo",
    isLegendaryTen: true,
    isTamDe: true,
    spriteKey: "phi_de",
    portraitKey: "portrait_phi_de",
    zoneId: "tan_thu_thon",
    spawnX: 536,
    spawnY: 368,
    greetingLinesVi: [
      "Hương vị nhân gian chính là linh cơ chân thật nhất của Đại Đạo.",
      "Đừng tưởng bổn tọa chỉ ngồi thưởng mì nơi Tân Thủ Thôn mà xem nhẹ Ẩm Thực Đại Đạo!",
      "Dù ngươi tự tay nấu nướng hay bỏ Linh Thạch mua lấy một bát mì ngon của Lão Trù Trương, chỉ cần có tấm lòng kính trọng mỹ vị, bổn tọa đều ban cơ duyên!"
    ],
    questlineTitleVi: "Vạn Vị Thành Đạo: Một Bữa Ăn Định Tiên Duyên",
    inheritanceSkillNameVi: "Phì Thiên Thực Đạo Kinh"
  },
  {
    id: "rmt_de",
    nameVi: "RMT Đế — Phạm Phan Trọng Khải",
    titleVi: "Kim Tiền Đại Đạo Chí Tôn",
    realmId: "thanh_canh",
    realmDisplayVi: "Thánh Cảnh",
    daoNameVi: "Kim Tiền Đại Đạo",
    isLegendaryTen: true,
    isTamDe: true,
    spriteKey: "rmt_de",
    portraitKey: "portrait_rmt_de",
    zoneId: "tan_thu_thon",
    spawnX: 816,
    spawnY: 296,
    greetingLinesVi: [
      "Dùng Linh Thạch mua Tiên Lộ không phải là lười biếng, mà là hiểu rõ quy luật vận chuyển của vạn vật!",
      "Nhớ kỹ: ở Bát Hoang này chỉ dùng Linh Thạch kiếm được trong thiên địa, tuyệt đối không có chuyện nạp tiền giả tạo!"
    ],
    questlineTitleVi: "Kim Tiền Thông Thiên: Dùng Tiền Mua Tiên Lộ",
    inheritanceSkillNameVi: "Vạn Kim Thông Thiên Kinh"
  },
  {
    id: "vaal_de",
    nameVi: "Vaal Đế — Trần Vũ Hoàng Tâm",
    titleVi: "Vận Mệnh Tất Tay Đại Đạo Chí Tôn",
    realmId: "thanh_canh",
    realmDisplayVi: "Thánh Cảnh",
    daoNameVi: "Vận Mệnh / Tất Tay Đại Đạo",
    isLegendaryTen: true,
    isTamDe: true,
    spriteKey: "vaal_de",
    portraitKey: "portrait_vaal_de",
    zoneId: "thanh_truc_lam",
    spawnX: 960,
    spawnY: 288,
    greetingLinesVi: [
      "1 ăn cả 2 ăn lồn! Thiên mệnh trước mặt, kẻ dám đặt cược với đạo tâm mới hiểu thế nào là nghịch thiên!",
      "Tất nhiên mọi xác suất biến dị của bổn tọa đều minh bạch, ngươi luôn có quyền chọn đường an toàn!"
    ],
    questlineTitleVi: "Nhất Niệm Tất Tay: Nghịch Thiên Cải Mệnh",
    inheritanceSkillNameVi: "Vạn Kiếp Vaal Thiên Kinh"
  },
  {
    id: "chatdvt",
    nameVi: "ChatDVT",
    titleVi: "Hộ Pháp Linh Thú • Vạn Linh Khế Ước",
    realmId: "thanh_canh",
    realmDisplayVi: "Thánh Cảnh (Thánh Thú)",
    daoNameVi: "Vạn Linh Khế Ước Đại Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "chatdvt",
    portraitKey: "portrait_chatdvt",
    zoneId: "tan_thu_thon",
    spawnX: 668,
    spawnY: 404,
    greetingLinesVi: [
      "Gâu... à nhầm, bổn Thánh Thú là ChatDVT của Phì Đế đại nhân, không phải con chó cảnh đâu nhé!",
      "Nhìn tu vi của ngươi kìa, chưa đánh nổi con Trúc Lang mà đã tính chuyện phi thăng à? Mau kiếm bát Mì Linh Mạch dâng lên Phì Đế đi!"
    ],
    questlineTitleVi: "Thánh Thú Vấn Tâm: Vạn Linh Quy Tông",
    inheritanceSkillNameVi: "Vạn Linh Thánh Khế"
  },
  {
    id: "dam_lon_tien_tu",
    nameVi: "Dẩm Lồn Tiên Tử",
    titleVi: "Hồng Trần Tâm Đạo Tiên Tử • Đạo Lữ của Phì Đế",
    realmId: "UNKNOWN",
    realmDisplayVi: "Bất Minh (Không Rõ Cảnh Giới)",
    daoNameVi: "Hồng Trần Tâm Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "dam_lon_tien_tu",
    portraitKey: "portrait_dam_lon_tien_tu",
    zoneId: "tan_thu_thon",
    spawnX: 256,
    spawnY: 336,
    greetingLinesVi: [
      "Hồng trần vạn kiếp, giữ được một niệm chân tâm mới là điều khó nhất.",
      "Đặng Văn Tiến suốt ngày chỉ nhớ chuyện đại yến, nhưng cũng nhờ cái bụng chân thành ấy mà thiếp đồng hành cùng chàng qua bao kỷ nguyên."
    ],
    questlineTitleVi: "Hồng Trần Vạn Kiếp: Nhất Niệm Chân Tâm",
    inheritanceSkillNameVi: "Hồng Trần Tâm Kinh"
  },
  {
    id: "ngoc_tam",
    nameVi: "Xui Xẻo Chân Quân — Ngọc Tâm",
    titleVi: "Nhân Quả Nghịch Hành Bán Thánh",
    realmId: "ban_thanh",
    realmDisplayVi: "Bán Thánh",
    daoNameVi: "Nhân Quả Xui Xẻo Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "ngoc_tam",
    portraitKey: "portrait_ngoc_tam",
    zoneId: "tan_thu_thon",
    spawnX: 256,
    spawnY: 640,
    greetingLinesVi: [
      "Đứng cách ta ba trượng ra... Hôm nay ta vừa bước chân ra cửa đã bị chim linh thú ỉa trúng đầu.",
      "Đừng nhầm ta với lão Vaal Đế Trần Vũ Hoàng Tâm kia, vận xui của ta là nhân quả định lượng!"
    ],
    questlineTitleVi: "Vạn Kiếp Xui Xẻo: Nhân Quả Nghịch Hành",
    inheritanceSkillNameVi: "Đại Xui Xẻo Thuật"
  },
  {
    id: "thai_tai",
    nameVi: "Thái Tài",
    titleVi: "Thiên Nhãn Giám Bảo Bán Thánh",
    realmId: "ban_thanh",
    realmDisplayVi: "Bán Thánh",
    daoNameVi: "Giám Bảo Cổ Khí Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "hoa_tran",
    portraitKey: "portrait_hoa_tran",
    zoneId: "tan_thu_thon",
    spawnX: 832,
    spawnY: 608,
    greetingLinesVi: [
      "RMT Đế chỉ nhìn giá cả, còn lão phu nhìn thấu linh hồn và lịch sử ẩn trong từng món cổ bảo."
    ],
    questlineTitleVi: "Thiên Hạ Vạn Bảo: Chân Giả Khó Phân",
    inheritanceSkillNameVi: "Thiên Nhãn Giám Bảo"
  },
  {
    id: "anh_7",
    nameVi: "Anh 7 — Đoàn Quang Huy",
    titleVi: "Thất Kiếm Phá Thiên Bán Thánh",
    realmId: "ban_thanh",
    realmDisplayVi: "Bán Thánh",
    daoNameVi: "Thất Kiếm Đại Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "anh_7",
    portraitKey: "portrait_anh_7",
    zoneId: "thanh_truc_lam",
    spawnX: 480,
    spawnY: 256,
    greetingLinesVi: [
      "Bảy thanh kiếm của ta chỉ xuất vỏ khi gặp kẻ có kiếm tâm kiên định."
    ],
    questlineTitleVi: "Thất Kiếm Phá Thiên: Một Kiếm Định Càn Khôn",
    inheritanceSkillNameVi: "Thất Kiếm Liên Hoàn"
  },
  {
    id: "gia_bao",
    nameVi: "Gia Bảo",
    titleVi: "Đại La Vô Cực Tiên Nhân",
    realmId: "dai_la_kim_tien",
    realmDisplayVi: "Đại La Kim Tiên",
    daoNameVi: "Đại La Vô Cực Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "hero_kiem_tu",
    portraitKey: "portrait_hero_kiem_tu",
    zoneId: "thanh_truc_lam",
    spawnX: 1120,
    spawnY: 688,
    greetingLinesVi: [
      "Ta dừng ở đỉnh phong Đại La Kim Tiên đã lâu, chỉ đợi tìm ra minh văn Trảm Nhất Đao."
    ],
    questlineTitleVi: "Đại La Vô Cực: Trảm Đạo Cầu Sinh",
    inheritanceSkillNameVi: "Đại La Tiên Ấn"
  },
  {
    id: "hoa_tran",
    nameVi: "Hòa Trần",
    titleVi: "Thanh Phong Tiêu Dao • Thái Ất Kim Tiên",
    realmId: "thai_at_kim_tien",
    realmDisplayVi: "Thái Ất Kim Tiên",
    daoNameVi: "Thanh Phong Vô Danh Đạo",
    isLegendaryTen: true,
    isTamDe: false,
    spriteKey: "hoa_tran",
    portraitKey: "portrait_hoa_tran",
    zoneId: "thanh_truc_lam",
    spawnX: 288,
    spawnY: 432,
    greetingLinesVi: [
      "Gió thổi qua rừng trúc không lưu lại dấu vết. Đạo hữu từ Tân Thủ Thôn bước qua Truyền Tống Trận tới đây, có cảm nhận được linh khí khác biệt chăng?",
      "Trong Thanh Trúc Lâm có Trúc Lang và Thanh Lân Xà canh giữ Thanh Tâm Thảo. Hãy cẩn thận bước chân."
    ],
    questlineTitleVi: "Thanh Phong Tiêu Dao: Đại Đạo Vô Danh",
    inheritanceSkillNameVi: "Thanh Phong Bộ"
  },
  {
    id: "merchant_truong",
    nameVi: "Lão Trù Trương",
    titleVi: "Chưởng Quầy Quán Mì Linh Thiện",
    realmId: "truc_co",
    realmDisplayVi: "Trúc Cơ Hậu Kỳ",
    daoNameVi: "Linh Trù Thế Gia",
    isLegendaryTen: false,
    isTamDe: false,
    spriteKey: "merchant_truong",
    portraitKey: "portrait_merchant_truong",
    zoneId: "tan_thu_thon",
    spawnX: 384,
    spawnY: 392,
    greetingLinesVi: [
      "Mì Linh Mạch nóng hổi, Bánh Bao Linh Thú thơm lừng đây! Mua ăn liền cũng đắc đạo, mà mua nguyên liệu về tự nấu bên Thần Đỉnh cũng thành tài!",
      "Vị tiền bối mặc hắc kim bào ngồi cạnh quán lão phu chính là Phì Đế đại nhân đấy, mau dâng một món ngon để cầu cơ duyên!"
    ],
    questlineTitleVi: "Ẩm Thực Nhập Môn",
    inheritanceSkillNameVi: "Không"
  }
];

export interface ItemDefinition {
  id: string;
  nameVi: string;
  category: "food" | "beverage" | "pill" | "ingredient" | "material" | "equipment";
  descriptionVi: string;
  buyPriceLinhThach: number | null;
  sellPriceLinhThach: number;
  maxStack: number;
  qualifiesForPhiDeQuest: boolean;
  buffSlot?: BuffSlotCategory;
  buffDurationSec?: number;
  attackBonus?: number;
  defenseBonus?: number;
  hpRestore?: number;
  tuViGrant?: number;
  tuViMultiplier?: number;
}

export const ITEMS_REGISTRY: Record<string, ItemDefinition> = {
  mi_linh_thach_thanh_truc: {
    id: "mi_linh_thach_thanh_truc",
    nameVi: "Mì Linh Mạch Thanh Trúc",
    category: "food",
    descriptionVi: "Sợi mì nhào từ Bột Linh Mạch nấu cùng măng trúc non, hương thơm ngào ngạt đạt chuẩn dâng lên Phì Đế.",
    buyPriceLinhThach: 25,
    sellPriceLinhThach: 12,
    maxStack: 50,
    qualifiesForPhiDeQuest: true,
    buffSlot: "meal",
    buffDurationSec: 600,
    attackBonus: 8,
    defenseBonus: 4,
    hpRestore: 60,
    tuViMultiplier: 1.25
  },
  banh_bao_linh_thu: {
    id: "banh_bao_linh_thu",
    nameVi: "Bánh Bao Linh Thú",
    category: "food",
    descriptionVi: "Bánh bao nhân thịt linh thú hấp chín trong lồng trúc, bổ dưỡng khí huyết và hợp khẩu vị Phì Đế.",
    buyPriceLinhThach: 35,
    sellPriceLinhThach: 16,
    maxStack: 50,
    qualifiesForPhiDeQuest: true,
    buffSlot: "meal",
    buffDurationSec: 900,
    attackBonus: 12,
    defenseBonus: 6,
    hpRestore: 90,
    tuViMultiplier: 1.3
  },
  canh_truc_lang_linh_thao: {
    id: "canh_truc_lang_linh_thao",
    nameVi: "Canh Trúc Lang Linh Thảo",
    category: "food",
    descriptionVi: "Món canh thượng phẩm ninh từ Thịt Trúc Lang và Thanh Tâm Thảo, đại bổ nguyên khí.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 28,
    maxStack: 50,
    qualifiesForPhiDeQuest: true,
    buffSlot: "meal",
    buffDurationSec: 1200,
    attackBonus: 15,
    defenseBonus: 8,
    hpRestore: 120,
    tuViMultiplier: 1.4
  },
  tra_thanh_tam_tinh_khi: {
    id: "tra_thanh_tam_tinh_khi",
    nameVi: "Trà Thanh Tâm Tinh Khí",
    category: "beverage",
    descriptionVi: "Linh trà ủ từ lá trúc non và sương sớm, giúp định tâm ngưng thần (thay thế mỹ tửu an toàn).",
    buyPriceLinhThach: 20,
    sellPriceLinhThach: 10,
    maxStack: 50,
    qualifiesForPhiDeQuest: false,
    buffSlot: "beverage",
    buffDurationSec: 600,
    attackBonus: 4,
    defenseBonus: 5,
    hpRestore: 30,
    tuViMultiplier: 1.15
  },
  tu_khi_dan_so_cap: {
    id: "tu_khi_dan_so_cap",
    nameVi: "Tụ Khí Đan Sơ Cấp",
    category: "pill",
    descriptionVi: "Đan dược cơ bản giúp tăng 65 Tu Vi tức thì và trợ lực đột phá cảnh giới.",
    buyPriceLinhThach: 40,
    sellPriceLinhThach: 20,
    maxStack: 99,
    qualifiesForPhiDeQuest: false,
    buffSlot: "pill",
    buffDurationSec: 300,
    hpRestore: 50,
    tuViGrant: 65,
    tuViMultiplier: 1.2
  },
  bot_linh_mach: {
    id: "bot_linh_mach",
    nameVi: "Bột Linh Mạch",
    category: "ingredient",
    descriptionVi: "Bột lúa mạch thấm đẫm linh khí đồng nội, nguyên liệu chính để chế biến Mì Linh Mạch.",
    buyPriceLinhThach: 10,
    sellPriceLinhThach: 5,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  thanh_tam_thao: {
    id: "thanh_tam_thao",
    nameVi: "Thanh Tâm Thảo",
    category: "ingredient",
    descriptionVi: "Linh thảo mọc trong Thanh Trúc Lâm, dùng để nấu linh thiện hoặc luyện đan.",
    buyPriceLinhThach: 12,
    sellPriceLinhThach: 6,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  thit_truc_lang: {
    id: "thit_truc_lang",
    nameVi: "Thịt Trúc Lang",
    category: "ingredient",
    descriptionVi: "Thịt săn chắc thu được khi đánh bại Trúc Lang ở Thanh Trúc Lâm, giàu tinh huyết.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 14,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  nanh_truc_lang: {
    id: "nanh_truc_lang",
    nameVi: "Nanh Trúc Lang",
    category: "material",
    descriptionVi: "Nanh sắc nhọn của Trúc Lang, có thể bán lấy Linh Thạch hoặc rèn pháp khí.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 15,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  vay_thanh_lan: {
    id: "vay_thanh_lan",
    nameVi: "Vảy Thanh Lân Xà",
    category: "material",
    descriptionVi: "Lân phiến xanh biếc của Thanh Lân Xà, chứa linh lực mộc-thủy.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 18,
    maxStack: 99,
    qualifiesForPhiDeQuest: false
  },
  thanh_van_kiem_so_cap: {
    id: "thanh_van_kiem_so_cap",
    nameVi: "Thanh Vân Kiếm (Khởi Đầu)",
    category: "equipment",
    descriptionVi: "Trường kiếm nhập môn của đệ tử Tông Môn 8D.",
    buyPriceLinhThach: null,
    sellPriceLinhThach: 30,
    maxStack: 1,
    qualifiesForPhiDeQuest: false,
    attackBonus: 10
  }
};

export interface CulinaryRecipeDefinition {
  id: string;
  nameVi: string;
  outputItemId: string;
  outputQuantity: number;
  defaultQuality: FoodQualityTier;
  ingredients: Array<{ itemId: string; quantity: number }>;
  tuViReward: number;
}

export const RECIPES_REGISTRY: Record<string, CulinaryRecipeDefinition> = {
  cook_mi_linh_thach_thanh_truc: {
    id: "cook_mi_linh_thach_thanh_truc",
    nameVi: "Nấu Mì Linh Mạch Thanh Trúc",
    outputItemId: "mi_linh_thach_thanh_truc",
    outputQuantity: 1,
    defaultQuality: "ngon_mieng",
    ingredients: [
      { itemId: "bot_linh_mach", quantity: 1 },
      { itemId: "thanh_tam_thao", quantity: 1 }
    ],
    tuViReward: 25
  },
  cook_canh_truc_lang_linh_thao: {
    id: "cook_canh_truc_lang_linh_thao",
    nameVi: "Ninh Canh Trúc Lang Linh Thảo",
    outputItemId: "canh_truc_lang_linh_thao",
    outputQuantity: 1,
    defaultQuality: "thuong_pham",
    ingredients: [
      { itemId: "thit_truc_lang", quantity: 1 },
      { itemId: "thanh_tam_thao", quantity: 1 }
    ],
    tuViReward: 40
  }
};

export interface SkillDefinition {
  id: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang";
  nameVi: string;
  keybindLabel: string;
  cooldownMs: number;
  mpCost: number;
  rangePx: number;
  coefficient: number;
  minDamage: number;
}

export const SKILLS_REGISTRY: Record<string, SkillDefinition> = {
  basic_slash: {
    id: "basic_slash",
    nameVi: "Thanh Vân Trảm",
    keybindLabel: "J",
    cooldownMs: 450,
    mpCost: 0,
    rangePx: 92,
    coefficient: 1.0,
    minDamage: 8
  },
  kiem_khi_ung: {
    id: "kiem_khi_ung",
    nameVi: "Kiếm Khí Phá Không",
    keybindLabel: "K",
    cooldownMs: 2200,
    mpCost: 12,
    rangePx: 145,
    coefficient: 1.75,
    minDamage: 18
  },
  ho_the_kim_quang: {
    id: "ho_the_kim_quang",
    nameVi: "Mỹ Vị Hóa Linh Trận",
    keybindLabel: "L",
    cooldownMs: 4000,
    mpCost: 18,
    rangePx: 120,
    coefficient: 1.5,
    minDamage: 15
  }
};

export interface MonsterDefinition {
  id: string;
  nameVi: string;
  spriteKey: string;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeedPxPerSec: number;
  aggroRangePx: number;
  attackRangePx: number;
  leashRangePx: number;
  telegraphMs: number;
  attackCooldownMs: number;
  respawnMs: number;
  tuViReward: number;
  linhThachReward: number;
  lootTable: Array<{ itemId: string; chance: number; minQty: number; maxQty: number }>;
}

export const MONSTERS_REGISTRY: Record<string, MonsterDefinition> = {
  truc_lang: {
    id: "truc_lang",
    nameVi: "Trúc Lang",
    spriteKey: "truc_lang",
    maxHp: 110,
    attack: 14,
    defense: 6,
    moveSpeedPxPerSec: 84,
    aggroRangePx: 150,
    attackRangePx: 54,
    leashRangePx: 260,
    telegraphMs: 650,
    attackCooldownMs: 1800,
    respawnMs: 7000,
    tuViReward: 38,
    linhThachReward: 18,
    lootTable: [
      { itemId: "thit_truc_lang", chance: 1.0, minQty: 1, maxQty: 1 },
      { itemId: "thanh_tam_thao", chance: 0.75, minQty: 1, maxQty: 2 },
      { itemId: "nanh_truc_lang", chance: 0.5, minQty: 1, maxQty: 1 }
    ]
  },
  thanh_lan_xa: {
    id: "thanh_lan_xa",
    nameVi: "Thanh Lân Xà",
    spriteKey: "thanh_lan_xa",
    maxHp: 145,
    attack: 18,
    defense: 8,
    moveSpeedPxPerSec: 76,
    aggroRangePx: 140,
    attackRangePx: 62,
    leashRangePx: 240,
    telegraphMs: 700,
    attackCooldownMs: 2000,
    respawnMs: 8500,
    tuViReward: 52,
    linhThachReward: 24,
    lootTable: [
      { itemId: "vay_thanh_lan", chance: 1.0, minQty: 1, maxQty: 1 },
      { itemId: "thanh_tam_thao", chance: 0.85, minQty: 1, maxQty: 2 }
    ]
  }
};

export interface PortalDefinition {
  id: string;
  labelVi: string;
  sourceZoneId: ZoneId;
  x: number;
  y: number;
  radiusPx: number;
  targetZoneId: ZoneId;
  targetSpawnId: string;
  targetX: number;
  targetY: number;
}

export interface ZoneDefinition {
  id: ZoneId;
  nameVi: string;
  subtitleVi: string;
  mapFile: string;
  widthTiles: number;
  heightTiles: number;
  tileSize: number;
  isSafeZone: boolean;
  defaultSpawn: { id: string; x: number; y: number };
  spawns: Record<string, { x: number; y: number }>;
  portals: PortalDefinition[];
  monsterSpawns: Array<{ instanceId: string; monsterId: string; x: number; y: number }>;
}

export const ZONES_REGISTRY: Record<ZoneId, ZoneDefinition> = {
  tan_thu_thon: {
    id: "tan_thu_thon",
    nameVi: "Tân Thủ Thôn",
    subtitleVi: "Thôn trang linh khí quy tụ dưới chân Bát Đại Thiên Tông",
    mapFile: "maps/tan_thu_thon.tmj",
    widthTiles: 40,
    heightTiles: 30,
    tileSize: 32,
    isSafeZone: true,
    defaultSpawn: { id: "village_center", x: 640, y: 512 },
    spawns: {
      village_center: { x: 640, y: 512 },
      from_thanh_truc_lam: { x: 1036, y: 480 }
    },
    portals: [
      {
        id: "portal_town_to_forest",
        labelVi: "Truyền Tống Trận → Thanh Trúc Lâm",
        sourceZoneId: "tan_thu_thon",
        x: 1120,
        y: 480,
        radiusPx: 92,
        targetZoneId: "thanh_truc_lam",
        targetSpawnId: "from_tan_thu_thon",
        targetX: 212,
        targetY: 480
      }
    ],
    monsterSpawns: []
  },
  thanh_truc_lam: {
    id: "thanh_truc_lam",
    nameVi: "Thanh Trúc Lâm",
    subtitleVi: "Rừng trúc ngàn năm ẩn chứa linh thú và tiên thảo",
    mapFile: "maps/thanh_truc_lam.tmj",
    widthTiles: 44,
    heightTiles: 32,
    tileSize: 32,
    isSafeZone: false,
    defaultSpawn: { id: "from_tan_thu_thon", x: 212, y: 480 },
    spawns: {
      from_tan_thu_thon: { x: 212, y: 480 },
      forest_shrine: { x: 640, y: 480 }
    },
    portals: [
      {
        id: "portal_forest_to_town",
        labelVi: "Truyền Tống Trận → Tân Thủ Thôn",
        sourceZoneId: "thanh_truc_lam",
        x: 128,
        y: 480,
        radiusPx: 92,
        targetZoneId: "tan_thu_thon",
        targetSpawnId: "from_thanh_truc_lam",
        targetX: 1036,
        targetY: 480
      }
    ],
    monsterSpawns: [
      { instanceId: "mob_truc_lang_1", monsterId: "truc_lang", x: 544, y: 480 },
      { instanceId: "mob_truc_lang_2", monsterId: "truc_lang", x: 768, y: 576 },
      { instanceId: "mob_thanh_lan_xa_1", monsterId: "thanh_lan_xa", x: 896, y: 416 },
      { instanceId: "mob_thanh_lan_xa_2", monsterId: "thanh_lan_xa", x: 672, y: 736 }
    ]
  }
};

export interface QuestDefinition {
  id: string;
  chapterIndex: number;
  npcId: string;
  titleVi: string;
  summaryVi: string;
  acceptDialogueVi: string;
  submitDialogueVi: string;
  eligibleItemIds: string[];
  rewardTuVi: number;
  rewardLinhThach: number;
  rewardItemId?: string;
  rewardItemQty?: number;
  rewardTitleVi?: string;
  grantsPhiDeBlessing: boolean;
}

export const QUESTS_REGISTRY: Record<string, QuestDefinition> = {
  phi_de_ch1_huong_thom: {
    id: "phi_de_ch1_huong_thom",
    chapterIndex: 1,
    npcId: "phi_de",
    titleVi: "Vạn Vị Thành Đạo (Chương 1): Hương Thơm Tân Thủ Thôn",
    summaryVi: "Mua một món ăn hợp lệ tại Quán Mì Lão Trù Trương HOẶC tự nấu bên Thần Đỉnh rồi dâng lên Phì Đế.",
    acceptDialogueVi: "Khá lắm! Muốn bước vào Ẩm Thực Đại Đạo của bổn tọa, hãy mang tới đây một bát Mì Linh Mạch Thanh Trúc, Bánh Bao Linh Thú hoặc Canh Trúc Lang Linh Thảo. Ngươi tự nấu hay mua sẵn ở chỗ Lão Trù Trương đều được công nhận!",
    submitDialogueVi: "Hảo hương vị! Linh khí hòa quyện trong từng sợi mì, bất kể là ngươi tự nấu hay biết chọn mua đúng mỹ vị nhân gian, đạo tâm ấy xứng đáng nhận Thực Đạo Kim Quang Chúc Phúc của bổn tọa!",
    eligibleItemIds: [
      "mi_linh_thach_thanh_truc",
      "banh_bao_linh_thu",
      "canh_truc_lang_linh_thao"
    ],
    rewardTuVi: 150,
    rewardLinhThach: 60,
    rewardItemId: "tu_khi_dan_so_cap",
    rewardItemQty: 1,
    rewardTitleVi: "Thực Đạo Hữu Duyên Nhân",
    grantsPhiDeBlessing: true
  }
};

export const INITIAL_DISCIPLINE_STATS: Record<
  CombatDisciplineId,
  { nameVi: string; hp: number; mp: number; attack: number; defense: number }
> = {
  kiem_tu: {
    nameVi: "Kiếm Tu",
    hp: 160,
    mp: 80,
    attack: 24,
    defense: 10
  },
  phap_tu: {
    nameVi: "Pháp Tu",
    hp: 140,
    mp: 120,
    attack: 27,
    defense: 8
  },
  the_tu: {
    nameVi: "Thể Tu",
    hp: 210,
    mp: 65,
    attack: 20,
    defense: 15
  }
};

export const COMBAT_MITIGATION_K = 40;
export const OFFLINE_MEDITATION_CAP_SECONDS = 8 * 3600;

export function computeActualDamage(
  attackerAttack: number,
  skillCoefficient: number,
  targetDefense: number,
  minDamage: number
): number {
  const rawDamage = attackerAttack * skillCoefficient;
  const mitigation = targetDefense / (targetDefense + COMBAT_MITIGATION_K);
  return Math.max(minDamage, Math.round(rawDamage * (1 - mitigation)));
}

export function getRealmRequiredTuVi(realmId: CanonicalRealmId, stage: number): number {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId) ?? REALM_PROGRESSION[0];
  const clampedStage = Math.max(1, Math.min(def.stageCount, stage));
  return Math.round(def.baseTuViPerStage * Math.pow(def.stageTuViMultiplier, clampedStage - 1));
}

export function getNextRealmAndStage(
  realmId: CanonicalRealmId,
  stage: number
): { realmId: CanonicalRealmId; stage: number; isMajorBreakthrough: boolean } | null {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId);
  if (!def) {
    return null;
  }
  if (stage < def.stageCount) {
    return { realmId, stage: stage + 1, isMajorBreakthrough: false };
  }
  const nextRealm = REALM_PROGRESSION.find((r) => r.orderIndex === def.orderIndex + 1);
  if (!nextRealm) {
    return null;
  }
  return { realmId: nextRealm.id, stage: 1, isMajorBreakthrough: true };
}

export function computeOfflineMeditationReward(
  elapsedSeconds: number,
  realmId: CanonicalRealmId,
  tuViMultiplier: number
): { cappedSeconds: number; tuViGained: number } {
  const safeElapsed = Math.max(0, Math.floor(elapsedSeconds));
  const cappedSeconds = Math.min(safeElapsed, OFFLINE_MEDITATION_CAP_SECONDS);
  const def = REALM_PROGRESSION.find((r) => r.id === realmId) ?? REALM_PROGRESSION[0];
  const boundedMult = Math.max(1.0, Math.min(2.5, tuViMultiplier));
  const tuViGained = Math.floor(cappedSeconds * def.baseMeditationRatePerSec * boundedMult);
  return { cappedSeconds, tuViGained };
}

export function formatRealmDisplay(realmId: CanonicalRealmId, stage: number): string {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId);
  if (!def) {
    return "Phàm Nhân";
  }
  const subLabel = def.subStageLabels[Math.max(0, Math.min(def.subStageLabels.length - 1, stage - 1))] ?? "";
  return subLabel ? `${def.nameVi} • ${subLabel}` : def.nameVi;
}

export {
  allocateSingleAttributePoint,
  BASE_ATTRIBUTE_KEYS,
  createZeroBaseAttributes,
  formatExpDecimalString,
  getRealmLevelBand,
  isAtNonSaintMajorRealmLevelCap,
  isBaseAttributeKey,
  isLevelAllowedForRealm,
  isNonNegativeDecimalIntString,
  isValidRealmStage,
  meetsMajorRealmBreakthroughLevelAndStagePrerequisite,
  parseExpDecimalString,
  sumBaseAttributes,
  validateBaseAttributes,
  validateCharacterLevelProgress
} from "./rules/characterContracts.js";

export type {
  AllocateSingleAttributeResult,
  BaseAttributesValidationResult,
  CharacterLevelProgressValidationResult,
  RealmLevelBand
} from "./rules/characterContracts.js";

export {
  APPROVED_CHARACTER_V02_APPEARANCES,
  BASE_ATTRIBUTE_LABELS_VI,
  CANONICAL_LEGENDARY_NPC_IDS,
  computeActiveDestinyPreRealmAttributeBonuses,
  DESTINY_RARITIES,
  DESTINY_RARITY_LABELS_VI,
  formatDestinyTraitBonusSummaryVi,
  getOwnedDestinyTraitIds,
  hasOwnedDestinyTrait,
  isApprovedCharacterV02AppearanceId,
  isDestinyRarity,
  S1E_STARTER_DESTINY_CATALOG,
  S1E_STARTER_DESTINY_CATALOG_VERSION,
  validateDestinyCollection,
  validateDestinyDefinitionMetadata,
  validateDestinyRollDraftShape,
  validateDestinyTripleIds
} from "./catalogs/destinies.js";

export type {
  DestinyCollectionValidationResult,
  DestinyDefinitionMetadataValidationResult,
  DestinyRollDraftShapeValidationResult,
  DestinyTripleValidationResult
} from "./catalogs/destinies.js";

export {
  applyCandidateCharacterExpGrant,
  CANDIDATE_DERIVED_STAT_COEFFICIENTS,
  CANDIDATE_ORIGIN_BASE_ATTRIBUTE,
  CANDIDATE_REALM_BASE_GROWTH,
  CANDIDATE_REALM_STAGE_SPAN_BONUS,
  CANDIDATE_SAINT_ACCELERATION_START_LEVEL,
  computeCandidateBaselineStatSnapshot,
  computeCandidateDerivedStatsFromEffectiveAttributes,
  computeCandidateEffectiveBaseAttributes,
  computeCandidateExpToNextLevel,
  computeCandidateRealmStageFactor,
  computeCandidateTotalExpForLevelSpan,
  createCandidateOriginBaseAttributes,
  getCandidateExpToNextLevelBigInt,
  getCandidateExpToNextLevelDecimal,
  getCandidateRealmStageFactor,
  MAX_SINGLE_GRANT_LEVEL_ADVANCEMENTS,
  MAX_SUPPORTED_EXP_BIGINT,
  MAX_SUPPORTED_EXP_DECIMAL_DIGITS,
  TD01_CANDIDATE_NUMERIC_APPROVAL_STATE,
  TD01_CANDIDATE_RULESET_VERSION
} from "./td01Numeric.js";

export type {
  CandidateBaselineStatSnapshot,
  CandidateBaselineStatSnapshotErrorCode,
  CandidateBaselineStatSnapshotResult,
  CandidateCharacterExpGrantResult,
  CandidateCharacterExpGrantSuccess,
  CandidateDerivedStats,
  CandidateDerivedStatsResult,
  CandidateEffectiveBaseAttributesResult,
  CandidateExpCostValidationCode,
  CandidateExpGrantErrorCode,
  CandidateExpGrantStopReason,
  CandidateExpToNextResult,
  CandidateLevelSpanExpCostResult,
  CandidateRealmStageFactorResult
} from "./td01Numeric.js";
