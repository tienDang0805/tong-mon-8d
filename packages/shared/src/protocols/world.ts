import type { Direction, ZoneId } from "../ids/index.js";

export interface MoveIntentPayload {
  seq: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: Direction;
}

export interface PortalIntentPayload {
  portalId: string;
  requestId: string;
}

export interface PortalApprovedPayload {
  portalId: string;
  targetZoneId: ZoneId;
  targetSpawnId: string;
  spawnX: number;
  spawnY: number;
}

export interface ShopBuyIntentPayload {
  npcId: string;
  itemId: string;
  quantity: number;
  requestId: string;
}

export interface CookRecipeIntentPayload {
  recipeId: string;
  requestId: string;
}

export interface PickupDropIntentPayload {
  dropId: string;
  requestId: string;
}

export interface PartyActionIntentPayload {
  action: "create" | "join" | "leave";
  targetPartyId?: string;
  requestId: string;
}

export interface ChatMessagePayload {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}
