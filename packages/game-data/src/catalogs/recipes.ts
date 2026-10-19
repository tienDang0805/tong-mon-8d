import type { FoodQualityTier } from "@tong-mon-8d/shared";

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
