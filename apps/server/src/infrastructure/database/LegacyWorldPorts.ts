import type {
  ActionResultPayload,
  CharacterSaveState,
  GroundLootSnapshot,
  MonsterSnapshot,
  PartyStateSnapshot
} from "@tong-mon-8d/shared";

export const LEGACY_CHARACTERS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS characters (
    character_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    discipline TEXT NOT NULL,
    zone_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    direction TEXT NOT NULL,
    realm_id TEXT NOT NULL,
    realm_stage INTEGER NOT NULL,
    tu_vi INTEGER NOT NULL,
    hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    mp INTEGER NOT NULL,
    max_mp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    linh_thach INTEGER NOT NULL,
    equipped_title TEXT NOT NULL,
    equipped_inheritance TEXT,
    inventory_json JSONB NOT NULL,
    quests_json JSONB NOT NULL,
    reputation_json JSONB NOT NULL,
    buffs_json JSONB NOT NULL,
    meditation_started_at BIGINT NOT NULL,
    last_meditation_claim_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  );
`;

export const LEGACY_CHARACTERS_ACCOUNT_INDEX_DDL = `
  CREATE INDEX IF NOT EXISTS idx_characters_account_id ON characters (account_id);
`;

export interface ServerMonsterRuntimeState extends MonsterSnapshot {
  spawnX: number;
  spawnY: number;
  lastAttackAt: number;
  targetAccountId: string | null;
  targetCharacterId?: string | null;
}

export interface LegacyWorldPersistencePort {
  checkIdempotency(requestId: string): Promise<ActionResultPayload | null>;
  recordIdempotency(
    requestId: string,
    characterId: string,
    actionType: string,
    result: ActionResultPayload
  ): Promise<void>;
  logEconomyEvent(
    characterId: string,
    eventType: string,
    linhThachDelta: number,
    itemId?: string | null,
    itemQuantity?: number
  ): Promise<void>;
  persistPlayerRuntimeState(player: CharacterSaveState): Promise<void>;
}

export interface LegacyWorldRuntimeStatePort {
  readonly monsters: Map<string, ServerMonsterRuntimeState>;
  readonly drops: Map<string, GroundLootSnapshot>;
  readonly parties: Map<string, PartyStateSnapshot>;
  readonly skillCooldowns: Map<string, number>;
  readonly portalLocks: Map<string, number>;
  now(): number;
  getEffectiveStats(player: CharacterSaveState): {
    attack: number;
    defense: number;
    tuViMultiplier: number;
    hasPhiDeBlessing: boolean;
  };
  getItemCount(player: CharacterSaveState, itemId: string): number;
  addItemToInventory(player: CharacterSaveState, itemId: string, quantity: number): void;
  removeItemFromInventory(player: CharacterSaveState, itemId: string, quantity: number): void;
}
