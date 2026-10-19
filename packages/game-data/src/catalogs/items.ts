import type { BuffSlotCategory } from "@tong-mon-8d/shared";

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
