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
