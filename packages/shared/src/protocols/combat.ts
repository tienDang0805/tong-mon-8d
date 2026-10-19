import type {
  BuffSlotCategory,
  Direction,
  FoodQualityTier
} from "../ids/index.js";

export interface ActiveBuff {
  buffId: string;
  name: string;
  slot: BuffSlotCategory;
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
  tuViMultiplier: number;
  expiresAt: number;
}

export interface InventoryItemStack {
  itemId: string;
  quantity: number;
  quality?: FoodQualityTier;
}

export interface AttackIntentPayload {
  skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang";
  targetInstanceId?: string;
  direction: Direction;
  requestId: string;
}

export interface UseItemIntentPayload {
  itemId: string;
  requestId: string;
}

export interface ClaimMeditationIntentPayload {
  requestId: string;
}

export interface BreakthroughIntentPayload {
  requestId: string;
}

export interface CombatEventPayload {
  attackerId: string;
  targetId: string;
  skillId: string;
  damage: number;
  targetHp: number;
  targetMaxHp: number;
  x: number;
  y: number;
  killed: boolean;
}

export interface ActionResultPayload {
  requestId: string;
  ok: boolean;
  code: string;
  messageVi: string;
  ceremony?: "phi_de_blessing" | "breakthrough_success";
}
