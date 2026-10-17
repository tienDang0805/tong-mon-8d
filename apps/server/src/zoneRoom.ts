import { Room, type Client } from "colyseus";
import type {
  AnimState,
  AttackIntentPayload,
  BreakthroughIntentPayload,
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  ChatMessagePayload,
  ClaimMeditationIntentPayload,
  CombatDisciplineId,
  CookRecipeIntentPayload,
  GuestAuthResultPayload,
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
import { toCharacterV02Snapshot, type GameDatabase } from "./db.js";
import { AuthoritativeWorldEngine } from "./worldEngine.js";

export interface ZoneRoomJoinOptions {
  zoneId?: ZoneId;
  accountId?: string;
  guestToken?: string;
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
  private activeCharactersV02 = new Map<string, CharacterV02SnapshotPayload>();
  private clientMessageHandlers = new Map<
    string,
    (client: Client, payload: unknown) => unknown
  >();
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

    this.registerClientMessage(
      "v02_auth_guest",
      async (client: Client, payload?: { guestToken?: unknown }) => {
        if (payload && payload.guestToken !== undefined) {
          const verified = await this.db.guestIdentity.authenticateAndBindSession(
            client.sessionId,
            payload.guestToken
          );
          if (!verified.ok) {
            const failMsg: GuestAuthResultPayload = {
              ok: false,
              code: verified.code,
              messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ."
            };
            client.send("v02_auth_result", failMsg);
            return;
          }
          const existingChar = await this.db.getCharacterV02ByAccount(
            verified.accountId,
            {
              destinyCatalog: this.db.getCharacterV02ActionDefaults().destinyCatalog
            }
          );
          if (existingChar) {
            const snap = toCharacterV02Snapshot(existingChar);
            this.activeCharactersV02.set(verified.accountId, snap);
            client.send("self_state_v02", snap);
          }
          const okMsg: GuestAuthResultPayload = {
            ok: true,
            code: "OK",
            messageVi: "Đã xác thực và liên kết phiên v0.2 thành công.",
            accountId: verified.accountId
          };
          client.send("v02_auth_result", okMsg);
          return;
        }

        const issued = await this.db.guestIdentity.issueGuestCredential();
        this.db.guestIdentity.bindVerifiedSession(
          client.sessionId,
          issued.accountId
        );
        const issuedMsg: GuestAuthResultPayload = {
          ok: true,
          code: "OK",
          messageVi: "Đã cấp mới và liên kết danh tính khách v0.2 thành công.",
          accountId: issued.accountId,
          guestToken: issued.guestToken
        };
        client.send("v02_auth_result", issuedMsg);
      }
    );

    this.registerClientMessage(
      "v02_create_character_draft",
      async (client: Client, rawIntent: unknown) => {
        await this.executeVerifiedV02Action(client, rawIntent, (accountId) =>
          this.db.characterV02Actions.createCharacterDraft(
            accountId,
            rawIntent,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_roll_innate_destiny",
      async (client: Client, rawIntent: unknown) => {
        await this.executeVerifiedV02Action(client, rawIntent, (accountId) =>
          this.db.characterV02Actions.rollInnateDestiny(
            accountId,
            rawIntent,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_confirm_innate_destiny",
      async (client: Client, rawIntent: unknown) => {
        await this.executeVerifiedV02Action(client, rawIntent, (accountId) =>
          this.db.characterV02Actions.confirmInnateDestiny(
            accountId,
            rawIntent,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_allocate_attribute",
      async (client: Client, rawIntent: unknown) => {
        await this.executeVerifiedV02Action(client, rawIntent, (accountId) =>
          this.db.characterV02Actions.allocateAttributePoint(
            accountId,
            rawIntent,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_equip_acquired_destiny",
      async (client: Client, rawIntent: unknown) => {
        await this.executeVerifiedV02Action(client, rawIntent, (accountId) =>
          this.db.characterV02Actions.equipAcquiredDestinyTrait(
            accountId,
            rawIntent,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_unequip_acquired_destiny",
      async (client: Client, rawIntent: unknown) => {
        await this.executeVerifiedV02Action(client, rawIntent, (accountId) =>
          this.db.characterV02Actions.unequipAcquiredDestinyTrait(
            accountId,
            rawIntent,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    const rejectClientExpGrant = (client: Client, rawIntent: unknown) => {
      const reqId =
        typeof (rawIntent as Record<string, unknown>)?.requestId === "string"
          ? String((rawIntent as Record<string, unknown>).requestId).slice(0, 128)
          : "";
      const rejection: CharacterV02ActionResultPayload = {
        requestId: reqId,
        ok: false,
        code: "CLIENT_EXP_GRANT_FORBIDDEN",
        messageVi: "Máy khách không có quyền tự cộng EXP cho nhân vật."
      };
      client.send("v02_action_result", rejection);
    };

    this.registerClientMessage("v02_grant_exp", rejectClientExpGrant);
    this.registerClientMessage("grant_exp", rejectClientExpGrant);

    this.registerClientMessage(
      "v02_grant_acquired_destiny",
      (client: Client, rawIntent: unknown) => {
        const reqId =
          typeof (rawIntent as Record<string, unknown>)?.requestId === "string"
            ? String((rawIntent as Record<string, unknown>).requestId).slice(0, 128)
            : "";
        const rejection: CharacterV02ActionResultPayload = {
          requestId: reqId,
          ok: false,
          code: "CLIENT_DESTINY_GRANT_FORBIDDEN",
          messageVi: "Máy khách không có quyền tự cấp Hậu Thiên Khí Vận."
        };
        client.send("v02_action_result", rejection);
      }
    );

    if (this.clock) {
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
  }

  async onJoin(client: Client, options?: ZoneRoomJoinOptions): Promise<void> {
    let resolvedAccountId: string;
    if (options?.guestToken !== undefined) {
      const authRes = await this.db.guestIdentity.authenticateAndBindSession(
        client.sessionId,
        options.guestToken
      );
      if (!authRes.ok) {
        const failAuth: GuestAuthResultPayload = {
          ok: false,
          code: authRes.code,
          messageVi: "Chứng chỉ danh tính khách v0.2 không hợp lệ."
        };
        client.send("v02_auth_result", failAuth);
        resolvedAccountId = `unverified_${client.sessionId}`.slice(0, 64);
      } else {
        resolvedAccountId = authRes.accountId;
        const okAuth: GuestAuthResultPayload = {
          ok: true,
          code: "OK",
          messageVi: "Đã xác thực danh tính khách v0.2 khi vào phòng.",
          accountId: authRes.accountId
        };
        client.send("v02_auth_result", okAuth);
        const existingV02 = await this.db.getCharacterV02ByAccount(
          resolvedAccountId,
          {
            destinyCatalog: this.db.getCharacterV02ActionDefaults().destinyCatalog
          }
        );
        if (existingV02) {
          const snapV02 = toCharacterV02Snapshot(existingV02);
          this.activeCharactersV02.set(resolvedAccountId, snapV02);
          client.send("self_state_v02", snapV02);
        }
      }
    } else {
      resolvedAccountId = (options?.accountId ?? `guest_${client.sessionId}`).trim().slice(0, 64);
    }

    const nickname = (options?.nickname ?? `Đạo Hữu ${client.sessionId.slice(0, 4)}`).trim().slice(0, 24);
    const discipline: CombatDisciplineId = options?.discipline ?? "kiem_tu";

    for (const [oldSid, oldAcc] of this.sessionToAccount.entries()) {
      if (oldAcc === resolvedAccountId && oldSid !== client.sessionId) {
        this.sessionToAccount.delete(oldSid);
      }
    }

    const player = await this.db.loadOrCreateCharacter(resolvedAccountId, nickname, discipline);
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
    if (this.clients && this.clients.length > 0) {
      this.broadcast("world_snapshot", snap);
    }
  }

  async onLeave(client: Client): Promise<void> {
    const verifiedAcc = this.db.guestIdentity.getVerifiedAccountForSession(client.sessionId);
    this.db.guestIdentity.unbindSession(client.sessionId);
    if (verifiedAcc) {
      this.activeCharactersV02.delete(verifiedAcc);
    }

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
    if (this.clients && this.clients.length > 0) {
      this.broadcast("world_snapshot", this.buildWorldSnapshot());
    }
  }

  public getOnlinePlayerCount(): number {
    return this.activePlayers.size;
  }

  public getActiveCharacterV02(accountId: string): CharacterV02SnapshotPayload | undefined {
    return this.activeCharactersV02.get(accountId);
  }

  public async handleClientMessage(
    client: Pick<Client, "sessionId" | "send">,
    type: string,
    payload?: unknown
  ): Promise<void> {
    const handler = this.clientMessageHandlers.get(type);
    if (handler) {
      await handler(client as Client, payload);
    }
  }

  private registerClientMessage<T = unknown>(
    type: string,
    callback: (client: Client, payload: T) => unknown
  ): void {
    this.clientMessageHandlers.set(
      type,
      callback as (client: Client, payload: unknown) => unknown
    );
    if (typeof this.onMessage === "function") {
      try {
        this.onMessage(type, callback);
      } catch {
        return;
      }
    }
  }

  private async executeVerifiedV02Action(
    client: Client,
    rawIntent: unknown,
    actionFn: (accountId: string) => Promise<CharacterV02ActionResultPayload>
  ): Promise<void> {
    const reqId =
      typeof (rawIntent as Record<string, unknown>)?.requestId === "string"
        ? String((rawIntent as Record<string, unknown>).requestId).slice(0, 128)
        : "";
    const sessionCheck = this.db.guestIdentity.assertVerifiedSession(client.sessionId);
    if (!sessionCheck.ok) {
      client.send("v02_action_result", {
        requestId: reqId,
        ok: false,
        code: sessionCheck.code,
        messageVi: sessionCheck.messageVi
      } satisfies CharacterV02ActionResultPayload);
      return;
    }

    const result = await actionFn(sessionCheck.accountId);
    if (result.ok && result.character) {
      this.activeCharactersV02.set(sessionCheck.accountId, result.character);
      client.send("self_state_v02", result.character);
    }
    client.send("v02_action_result", result);
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
