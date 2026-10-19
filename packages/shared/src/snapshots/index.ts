import type {
  AnimState,
  CanonicalRealmId,
  CharacterCreationState,
  CombatDisciplineId,
  Direction,
  ZoneId
} from "../ids/index.js";
import type {
  BaseAttributes,
  CharacterIdentity,
  CharacterLevelProgress,
  CharacterV02SnapshotPayload,
  DestinyCollection
} from "../protocols/character.js";
import type { ActiveBuff, InventoryItemStack } from "../protocols/combat.js";
import type { QuestProgressState } from "../protocols/quest.js";

export type { CharacterV02SnapshotPayload };

export interface CharacterSaveState {
  accountId: string;
  characterId: string;
  nickname: string;
  discipline: CombatDisciplineId;
  appearanceId?: string;
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  realmId: CanonicalRealmId;
  realmStage: number;
  tuVi: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  linhThach: number;
  equippedTitle: string;
  equippedInheritance: string | null;
  inventory: InventoryItemStack[];
  quests: Record<string, QuestProgressState>;
  reputation: Record<string, number>;
  buffs: ActiveBuff[];
  meditationStartedAt: number;
  lastMeditationClaimAt: number;
  partyId: string | null;
  level?: number;
  creationState?: CharacterCreationState;
  attributes?: BaseAttributes;
  identity?: CharacterIdentity;
  levelProgress?: CharacterLevelProgress;
  destiny?: DestinyCollection | null;
  rulesetVersion?: string;
}

export interface RemotePlayerSnapshot {
  sessionId: string;
  characterId: string;
  nickname: string;
  discipline: CombatDisciplineId;
  appearanceId?: string;
  level?: number;
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  anim: AnimState;
  hp: number;
  maxHp: number;
  realmId: CanonicalRealmId;
  realmStage: number;
  equippedTitle: string;
  hasPhiDeBlessing: boolean;
  partyId: string | null;
}

export interface MonsterSnapshot {
  instanceId: string;
  monsterId: string;
  name: string;
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  state: "idle" | "patrol" | "aggro" | "attack" | "telegraph" | "dead";
  hp: number;
  maxHp: number;
  telegraphUntil: number;
  respawnAt: number;
}

export interface GroundLootSnapshot {
  dropId: string;
  itemId: string;
  quantity: number;
  ownerCharacterId: string;
  x: number;
  y: number;
  expiresAt: number;
}

export interface PartyStateSnapshot {
  partyId: string;
  leaderCharacterId: string;
  memberIds: string[];
  memberNames: string[];
}

export interface RoomWorldSnapshot {
  zoneId: ZoneId;
  serverTime: number;
  players: Record<string, RemotePlayerSnapshot>;
  monsters: Record<string, MonsterSnapshot>;
  drops: Record<string, GroundLootSnapshot>;
  parties: Record<string, PartyStateSnapshot>;
}
