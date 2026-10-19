import type {
  ActionResultPayload,
  AttackIntentPayload,
  BreakthroughIntentPayload,
  CharacterSaveState,
  CharacterV02SnapshotPayload,
  ClaimMeditationIntentPayload,
  CombatEventPayload,
  CookRecipeIntentPayload,
  Direction,
  GroundLootSnapshot,
  MonsterSnapshot,
  MoveIntentPayload,
  PartyActionIntentPayload,
  PartyStateSnapshot,
  PickupDropIntentPayload,
  PortalApprovedPayload,
  PortalIntentPayload,
  QuestActionIntentPayload,
  ShopBuyIntentPayload,
  UseItemIntentPayload,
  ZoneId
} from "@tong-mon-8d/shared";
import { AuthoritativeClock } from "../../infrastructure/time/Clock.js";
import type {
  LegacyWorldPersistencePort,
  LegacyWorldRuntimeStatePort
} from "../../infrastructure/database/LegacyWorldPorts.js";
import { ZoneCollisionRegistry, type ZoneCollisionGrid } from "./ZoneCollision.js";
import { MonsterRuntimeManager, type ServerMonsterRuntime } from "./MonsterRuntime.js";
import { LegacyCombatService } from "../../features/combat/LegacyCombatService.js";
import { LegacyCommerceService } from "../../features/economy/LegacyCommerceService.js";
import { LegacyQuestService } from "../../features/quests/LegacyQuestService.js";
import { LegacyMeditationService } from "../../features/cultivation/LegacyMeditationService.js";

export interface WorldEngineDatabaseHost {
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
  saveCharacterState(state: CharacterSaveState): Promise<void>;
  getCharacterV02ActionDefaults(): unknown;
  readonly characterV02Actions: {
    syncRuntimeWorldState(
      accountId: string,
      runtimeState: CharacterSaveState,
      options?: unknown
    ): Promise<CharacterV02SnapshotPayload | null>;
  };
}

export class AuthoritativeWorldEngine
  implements LegacyWorldPersistencePort, LegacyWorldRuntimeStatePort
{
  private readonly db: WorldEngineDatabaseHost;
  public readonly clock: AuthoritativeClock;
  public readonly collision: ZoneCollisionRegistry;
  public readonly monsterRuntime: MonsterRuntimeManager;
  public readonly legacyCombat: LegacyCombatService;
  public readonly legacyCommerce: LegacyCommerceService;
  public readonly legacyQuests: LegacyQuestService;
  public readonly legacyMeditation: LegacyMeditationService;

  public readonly collisionGrids: Record<ZoneId, ZoneCollisionGrid>;
  public readonly connectedWalkableTiles: Record<ZoneId, Set<number>>;
  public readonly monsters: Map<string, ServerMonsterRuntime>;
  public readonly drops: Map<string, GroundLootSnapshot>;
  public readonly parties: Map<string, PartyStateSnapshot>;
  public readonly skillCooldowns: Map<string, number>;
  public readonly portalLocks: Map<string, number>;

  constructor(db: WorldEngineDatabaseHost, rootDir?: string) {
    this.db = db;
    this.clock = new AuthoritativeClock();
    this.collision = new ZoneCollisionRegistry(rootDir);
    this.monsterRuntime = new MonsterRuntimeManager(this.clock, this.collision);

    this.collisionGrids = this.collision.collisionGrids;
    this.connectedWalkableTiles = this.collision.connectedWalkableTiles;
    this.monsters = this.monsterRuntime.monsters;
    this.drops = this.monsterRuntime.drops;
    this.parties = this.monsterRuntime.parties;
    this.skillCooldowns = this.monsterRuntime.skillCooldowns;
    this.portalLocks = this.monsterRuntime.portalLocks;

    this.legacyCombat = new LegacyCombatService(this, this);
    this.legacyCommerce = new LegacyCommerceService(this, this);
    this.legacyQuests = new LegacyQuestService(this, this);
    this.legacyMeditation = new LegacyMeditationService(this, this);
  }

  now(): number {
    return this.clock.now();
  }

  advanceSimulatedClockMs(deltaMs: number): void {
    this.clock.advanceSimulatedClockMs(deltaMs);
  }

  async checkIdempotency(requestId: string): Promise<ActionResultPayload | null> {
    return this.db.checkIdempotency(requestId);
  }

  async recordIdempotency(
    requestId: string,
    characterId: string,
    actionType: string,
    result: ActionResultPayload
  ): Promise<void> {
    await this.db.recordIdempotency(requestId, characterId, actionType, result);
  }

  async logEconomyEvent(
    characterId: string,
    eventType: string,
    linhThachDelta: number,
    itemId?: string | null,
    itemQuantity?: number
  ): Promise<void> {
    await this.db.logEconomyEvent(
      characterId,
      eventType,
      linhThachDelta,
      itemId,
      itemQuantity
    );
  }

  async persistPlayerRuntimeState(player: CharacterSaveState): Promise<void> {
    if (
      player.identity?.creationState === "confirmed" ||
      player.characterId.startsWith("char_v02_")
    ) {
      await this.db.characterV02Actions.syncRuntimeWorldState(
        player.accountId,
        player,
        this.db.getCharacterV02ActionDefaults()
      );
      return;
    }
    await this.db.saveCharacterState(player);
  }

  isWalkable(zoneId: ZoneId, worldX: number, worldY: number): boolean {
    return this.collision.isWalkable(zoneId, worldX, worldY);
  }

  isConnectedWalkable(zoneId: ZoneId, worldX: number, worldY: number): boolean {
    return this.collision.isConnectedWalkable(zoneId, worldX, worldY);
  }

  resolveSafeZoneCoordinates(
    zoneId: ZoneId,
    worldX: number,
    worldY: number,
    options?: { isKnownCurrentMapVersion?: boolean }
  ): { x: number; y: number; migrated: boolean; reason: string } {
    return this.collision.resolveSafeZoneCoordinates(zoneId, worldX, worldY, options);
  }

  validateMovement(
    player: CharacterSaveState,
    intent: MoveIntentPayload
  ): { x: number; y: number; direction: Direction; moved: boolean } {
    return this.collision.validateMovement(player, intent);
  }

  async handlePortalIntent(
    player: CharacterSaveState,
    intent: PortalIntentPayload
  ): Promise<{ result: ActionResultPayload; approval?: PortalApprovedPayload }> {
    return this.legacyMeditation.handlePortalIntent(player, intent);
  }

  getEffectiveStats(player: CharacterSaveState): {
    attack: number;
    defense: number;
    tuViMultiplier: number;
    hasPhiDeBlessing: boolean;
  } {
    return this.monsterRuntime.getEffectiveStats(player);
  }

  async handleAttackIntent(
    player: CharacterSaveState,
    intent: AttackIntentPayload
  ): Promise<{ result: ActionResultPayload; combatEvent?: CombatEventPayload }> {
    return this.legacyCombat.handleAttackIntent(player, intent);
  }

  async handlePickupDrop(
    player: CharacterSaveState,
    intent: PickupDropIntentPayload
  ): Promise<ActionResultPayload> {
    return this.legacyCombat.handlePickupDrop(player, intent);
  }

  async handleShopBuy(
    player: CharacterSaveState,
    intent: ShopBuyIntentPayload
  ): Promise<ActionResultPayload> {
    return this.legacyCommerce.handleShopBuy(player, intent);
  }

  async handleCookRecipe(
    player: CharacterSaveState,
    intent: CookRecipeIntentPayload
  ): Promise<ActionResultPayload> {
    return this.legacyCommerce.handleCookRecipe(player, intent);
  }

  async handleUseItem(
    player: CharacterSaveState,
    intent: UseItemIntentPayload
  ): Promise<ActionResultPayload> {
    return this.legacyCommerce.handleUseItem(player, intent);
  }

  async handleQuestAction(
    player: CharacterSaveState,
    intent: QuestActionIntentPayload
  ): Promise<ActionResultPayload> {
    return this.legacyQuests.handleQuestAction(player, intent);
  }

  async handleClaimMeditation(
    player: CharacterSaveState,
    intent: ClaimMeditationIntentPayload
  ): Promise<ActionResultPayload> {
    return this.legacyMeditation.handleClaimMeditation(player, intent);
  }

  async handleBreakthrough(
    player: CharacterSaveState,
    intent: BreakthroughIntentPayload
  ): Promise<ActionResultPayload> {
    return this.legacyMeditation.handleBreakthrough(player, intent);
  }

  handlePartyAction(
    player: CharacterSaveState,
    intent: PartyActionIntentPayload
  ): ActionResultPayload {
    return this.legacyCombat.handlePartyAction(player, intent);
  }

  tickZoneMonsters(
    zoneId: ZoneId,
    activePlayers: Map<string, CharacterSaveState>
  ): CombatEventPayload[] {
    return this.monsterRuntime.tickZoneMonsters(zoneId, activePlayers);
  }

  clearMonsterTargetsForAccount(
    zoneId: ZoneId,
    accountId: string,
    characterId?: string
  ): void {
    this.monsterRuntime.clearTargetForAccount(zoneId, accountId, characterId);
  }

  getZoneMonsters(zoneId: ZoneId): Record<string, MonsterSnapshot> {
    return this.monsterRuntime.getZoneMonsters(zoneId);
  }

  getZoneDrops(zoneId: ZoneId): Record<string, GroundLootSnapshot> {
    return this.monsterRuntime.getZoneDrops(zoneId);
  }

  getPartiesSnapshot(): Record<string, PartyStateSnapshot> {
    return this.monsterRuntime.getPartiesSnapshot();
  }

  getItemCount(player: CharacterSaveState, itemId: string): number {
    return this.monsterRuntime.getItemCount(player, itemId);
  }

  addItemToInventory(player: CharacterSaveState, itemId: string, quantity: number): void {
    this.monsterRuntime.addItemToInventory(player, itemId, quantity);
  }

  removeItemFromInventory(player: CharacterSaveState, itemId: string, quantity: number): void {
    this.monsterRuntime.removeItemFromInventory(player, itemId, quantity);
  }
}

export { ZoneCollisionRegistry, MonsterRuntimeManager };
export type { ServerMonsterRuntime, ZoneCollisionGrid };
