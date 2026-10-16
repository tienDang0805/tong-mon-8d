import { Room, type Client } from "colyseus";
import type {
  AnimState,
  AttackIntentPayload,
  BreakthroughIntentPayload,
  CharacterSaveState,
  ChatMessagePayload,
  ClaimMeditationIntentPayload,
  CombatDisciplineId,
  CookRecipeIntentPayload,
  MoveIntentPayload,
  PartyActionIntentPayload,
  PickupDropIntentPayload,
  PortalIntentPayload,
  QuestActionIntentPayload,
  RemotePlayerSnapshot,
  RoomWorldSnapshot,
  ShopBuyIntentPayload,
  UseItemIntentPayload,
  ZoneId
} from "@tong-mon-8d/shared";
import { ZONES_REGISTRY } from "@tong-mon-8d/game-data";
import type { GameDatabase } from "./db.js";
import { AuthoritativeWorldEngine } from "./worldEngine.js";

export interface ZoneRoomJoinOptions {
  zoneId?: ZoneId;
  accountId?: string;
  nickname?: string;
  discipline?: CombatDisciplineId;
  spawnId?: string;
}

let sharedDb: GameDatabase | null = null;
let sharedEngine: AuthoritativeWorldEngine | null = null;
const activeRooms = new Map<ZoneId, ZoneRoom>();

export function configureServerSingletons(
  db: GameDatabase,
  engine: AuthoritativeWorldEngine
): void {
  sharedDb = db;
  sharedEngine = engine;
  activeRooms.clear();
}

export function getSharedEngine(): AuthoritativeWorldEngine {
  if (!sharedEngine) {
    throw new Error("AuthoritativeWorldEngine not initialized");
  }
  return sharedEngine;
}

export function getActiveZoneRoom(zoneId: ZoneId): ZoneRoom | undefined {
  return activeRooms.get(zoneId);
}

export class ZoneRoom extends Room {
  public zoneId: ZoneId = "tan_thu_thon";
  private db!: GameDatabase;
  private engine!: AuthoritativeWorldEngine;
  private activePlayers = new Map<string, CharacterSaveState>();
  private sessionToAccount = new Map<string, string>();
  private playerAnims = new Map<string, AnimState>();
  private snapshotAccumMs = 0;

  onCreate(options?: ZoneRoomJoinOptions): void {
    if (!sharedDb || !sharedEngine) {
      throw new Error("Server singletons not initialized before Room creation");
    }
    this.db = sharedDb;
    this.engine = sharedEngine;
    this.zoneId = options?.zoneId === "thanh_truc_lam" ? "thanh_truc_lam" : "tan_thu_thon";
    this.maxClients = 64;
    this.autoDispose = false;
    activeRooms.set(this.zoneId, this);

    this.onMessage("move", (client: Client, intent: MoveIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const res = this.engine.validateMovement(player, intent);
      this.playerAnims.set(player.accountId, res.moved ? "walk" : "idle");
    });

    this.onMessage("portal", async (client: Client, intent: PortalIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const { result, approval } = await this.engine.handlePortalIntent(player, intent);
      client.send("action_result", result);
      if (approval) {
        this.activePlayers.delete(player.accountId);
        this.playerAnims.delete(player.accountId);
        this.sessionToAccount.delete(client.sessionId);
        client.send("portal_approved", approval);
        this.broadcast("world_snapshot", this.buildWorldSnapshot());
      }
    });

    this.onMessage("attack", async (client: Client, intent: AttackIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const { result, combatEvent } = await this.engine.handleAttackIntent(player, intent);
      this.playerAnims.set(player.accountId, intent.skillId === "basic_slash" ? "attack" : "cast");
      client.send("self_state", player);
      client.send("action_result", result);
      if (combatEvent) {
        this.broadcast("combat_event", combatEvent);
      }
      this.broadcast("world_snapshot", this.buildWorldSnapshot());
    });

    this.onMessage("pickup_drop", async (client: Client, intent: PickupDropIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handlePickupDrop(player, intent);
      client.send("self_state", player);
      client.send("action_result", result);
      this.broadcast("world_snapshot", this.buildWorldSnapshot());
    });

    this.onMessage("shop_buy", async (client: Client, intent: ShopBuyIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handleShopBuy(player, intent);
      client.send("self_state", player);
      client.send("action_result", result);
    });

    this.onMessage("cook_recipe", async (client: Client, intent: CookRecipeIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handleCookRecipe(player, intent);
      client.send("self_state", player);
      client.send("action_result", result);
    });

    this.onMessage("use_item", async (client: Client, intent: UseItemIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handleUseItem(player, intent);
      client.send("self_state", player);
      client.send("action_result", result);
      this.broadcast("world_snapshot", this.buildWorldSnapshot());
    });

    this.onMessage("quest_action", async (client: Client, intent: QuestActionIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handleQuestAction(player, intent);
      client.send("self_state", player);
      client.send("action_result", result);
      this.broadcast("world_snapshot", this.buildWorldSnapshot());
    });

    this.onMessage(
      "claim_meditation",
      async (client: Client, intent: ClaimMeditationIntentPayload) => {
        const player = this.getPlayerBySession(client.sessionId);
        if (!player) return;
        const result = await this.engine.handleClaimMeditation(player, intent);
        client.send("self_state", player);
        client.send("action_result", result);
        this.broadcast("world_snapshot", this.buildWorldSnapshot());
      }
    );

    this.onMessage("breakthrough", async (client: Client, intent: BreakthroughIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handleBreakthrough(player, intent);
      client.send("self_state", player);
      client.send("action_result", result);
      this.broadcast("world_snapshot", this.buildWorldSnapshot());
    });

    this.onMessage("party_action", (client: Client, intent: PartyActionIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = this.engine.handlePartyAction(player, intent);
      client.send("self_state", player);
      client.send("action_result", result);
      this.broadcast("world_snapshot", this.buildWorldSnapshot());
    });

    this.onMessage("chat", (client: Client, payload: { text?: string }) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const clean = (payload?.text ?? "").trim().slice(0, 140);
      if (!clean) return;
      const chatMsg: ChatMessagePayload = {
        senderId: player.characterId,
        senderName: player.nickname,
        text: clean,
        timestamp: this.engine.now()
      };
      this.broadcast("chat_message", chatMsg);
    });

    this.setSimulationInterval((deltaMs: number) => {
      const monsterEvents = this.engine.tickZoneMonsters(this.zoneId, this.activePlayers);
      for (const ev of monsterEvents) {
        this.broadcast("combat_event", ev);
      }
      this.snapshotAccumMs += deltaMs;
      if (this.snapshotAccumMs >= 100) {
        this.snapshotAccumMs = 0;
        this.broadcast("world_snapshot", this.buildWorldSnapshot());
        for (const [sid, accId] of this.sessionToAccount.entries()) {
          const p = this.activePlayers.get(accId);
          if (p) {
            const c = this.clients.find((cl) => cl.sessionId === sid);
            c?.send("self_state", p);
          }
        }
      }
    }, 50);
  }

  async onJoin(client: Client, options?: ZoneRoomJoinOptions): Promise<void> {
    const accountId = (options?.accountId ?? `guest_${client.sessionId}`).trim().slice(0, 64);
    const nickname = (options?.nickname ?? `Đạo Hữu ${client.sessionId.slice(0, 4)}`).trim().slice(0, 24);
    const discipline: CombatDisciplineId = options?.discipline ?? "kiem_tu";

    for (const [oldSid, oldAcc] of this.sessionToAccount.entries()) {
      if (oldAcc === accountId && oldSid !== client.sessionId) {
        this.sessionToAccount.delete(oldSid);
      }
    }

    const player = await this.db.loadOrCreateCharacter(accountId, nickname, discipline);
    const zoneDef = ZONES_REGISTRY[this.zoneId];
    player.zoneId = this.zoneId;

    if (options?.spawnId && zoneDef.spawns[options.spawnId]) {
      player.x = zoneDef.spawns[options.spawnId].x;
      player.y = zoneDef.spawns[options.spawnId].y;
    } else if (!this.engine.isWalkable(this.zoneId, player.x, player.y)) {
      player.x = zoneDef.defaultSpawn.x;
      player.y = zoneDef.defaultSpawn.y;
    }

    await this.db.saveCharacterState(player);

    this.sessionToAccount.set(client.sessionId, player.accountId);
    this.activePlayers.set(player.accountId, player);
    this.playerAnims.set(player.accountId, "idle");

    client.send("self_state", player);
    const snap = this.buildWorldSnapshot();
    client.send("world_snapshot", snap);
    this.broadcast("world_snapshot", snap);
  }

  async onLeave(client: Client): Promise<void> {
    const accountId = this.sessionToAccount.get(client.sessionId);
    this.sessionToAccount.delete(client.sessionId);
    if (accountId) {
      const player = this.activePlayers.get(accountId);
      if (player) {
        await this.db.saveCharacterState(player);
      }
      this.activePlayers.delete(accountId);
      this.playerAnims.delete(accountId);
    }
    this.broadcast("world_snapshot", this.buildWorldSnapshot());
  }

  public getOnlinePlayerCount(): number {
    return this.activePlayers.size;
  }

  private getPlayerBySession(sessionId: string): CharacterSaveState | undefined {
    const acc = this.sessionToAccount.get(sessionId);
    return acc ? this.activePlayers.get(acc) : undefined;
  }

  public buildWorldSnapshot(): RoomWorldSnapshot {
    const players: Record<string, RemotePlayerSnapshot> = {};
    for (const [sid, accId] of this.sessionToAccount.entries()) {
      const p = this.activePlayers.get(accId);
      if (!p) continue;
      const eff = this.engine.getEffectiveStats(p);
      players[p.characterId] = {
        sessionId: sid,
        characterId: p.characterId,
        nickname: p.nickname,
        discipline: p.discipline,
        zoneId: this.zoneId,
        x: p.x,
        y: p.y,
        direction: p.direction,
        anim: this.playerAnims.get(accId) ?? "idle",
        hp: p.hp,
        maxHp: p.maxHp,
        realmId: p.realmId,
        realmStage: p.realmStage,
        equippedTitle: p.equippedTitle,
        hasPhiDeBlessing: eff.hasPhiDeBlessing,
        partyId: p.partyId
      };
    }

    return {
      zoneId: this.zoneId,
      serverTime: this.engine.now(),
      players,
      monsters: this.engine.getZoneMonsters(this.zoneId),
      drops: this.engine.getZoneDrops(this.zoneId),
      parties: this.engine.getPartiesSnapshot()
    };
  }
}
