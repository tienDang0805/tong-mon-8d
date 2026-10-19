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
import { toCharacterV02Snapshot } from "../../features/character/CharacterSnapshot.js";
import type { GameDatabase } from "../../db.js";
import type { AuthoritativeWorldEngine } from "../../runtime/world/WorldRuntime.js";

export interface ZoneRoomJoinOptions {
  zoneId?: ZoneId;
  accountId?: string;
  guestToken?: string;
  characterId?: string;
  deferWorldSpawn?: boolean;
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
  private sessionToCharacterId = new Map<string, string>();
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
        this.engine.clearMonsterTargetsForAccount(
          this.zoneId,
          player.accountId,
          player.characterId
        );
        this.activePlayers.delete(player.accountId);
        this.playerAnims.delete(player.accountId);
        this.sessionToAccount.delete(client.sessionId);
        this.sessionToCharacterId.delete(client.sessionId);
        client.send("portal_approved", approval);
        this.broadcast("world_snapshot", this.buildWorldSnapshot());
      }
    });

    this.onMessage("attack", async (client: Client, intent: AttackIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const { result, combatEvent } = await this.engine.handleAttackIntent(player, intent);
      this.playerAnims.set(player.accountId, intent.skillId === "basic_slash" ? "attack" : "cast");
      await this.refreshV02SnapshotForPlayer(client, player);
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
      await this.refreshV02SnapshotForPlayer(client, player);
      client.send("self_state", player);
      client.send("action_result", result);
    });

    this.onMessage("use_item", async (client: Client, intent: UseItemIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handleUseItem(player, intent);
      await this.refreshV02SnapshotForPlayer(client, player);
      client.send("self_state", player);
      client.send("action_result", result);
      this.broadcast("world_snapshot", this.buildWorldSnapshot());
    });

    this.onMessage("quest_action", async (client: Client, intent: QuestActionIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handleQuestAction(player, intent);
      await this.refreshV02SnapshotForPlayer(client, player);
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
        await this.refreshV02SnapshotForPlayer(client, player);
        client.send("self_state", player);
        client.send("action_result", result);
        this.broadcast("world_snapshot", this.buildWorldSnapshot());
      }
    );

    this.onMessage("breakthrough", async (client: Client, intent: BreakthroughIntentPayload) => {
      const player = this.getPlayerBySession(client.sessionId);
      if (!player) return;
      const result = await this.engine.handleBreakthrough(player, intent);
      await this.refreshV02SnapshotForPlayer(client, player);
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
      async (
        client: Client,
        payload?: {
          guestToken?: unknown;
          characterId?: unknown;
          deferWorldSpawn?: unknown;
        }
      ) => {
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
          const actionDefaults = this.db.getCharacterV02ActionDefaults();
          const requestedCharId =
            typeof payload.characterId === "string" &&
            payload.characterId.trim().length > 0
              ? payload.characterId.trim()
              : undefined;

          if (requestedCharId) {
            const ownedChar = await this.db.getOwnedCharacterV02ById(
              verified.accountId,
              requestedCharId,
              {
                destinyCatalog: actionDefaults.destinyCatalog
              }
            );
            if (!ownedChar) {
              const otherChar = await this.db.getCharacterV02ById(requestedCharId, {
                destinyCatalog: actionDefaults.destinyCatalog
              });
              const okMsg: GuestAuthResultPayload = {
                ok: true,
                code: "OK",
                messageVi: "Đã xác thực và liên kết phiên v0.2 thành công.",
                accountId: verified.accountId,
                activeRollDraft: null
              };
              client.send("v02_auth_result", okMsg);
              client.send("v02_action_result", {
                requestId: "",
                ok: false,
                code: otherChar
                  ? "CHARACTER_OWNERSHIP_FORBIDDEN"
                  : "CHARACTER_NOT_FOUND",
                messageVi: otherChar
                  ? "Nhân vật không thuộc quyền sở hữu của tài khoản này."
                  : "Không tìm thấy nhân vật v0.2 được chỉ định."
              } satisfies CharacterV02ActionResultPayload);
              return;
            }

            this.sessionToCharacterId.set(
              client.sessionId,
              ownedChar.identity.characterId
            );
            const snap = toCharacterV02Snapshot(
              ownedChar,
              actionDefaults.destinyCatalog
            );
            this.activeCharactersV02.set(verified.accountId, snap);
            client.send("self_state_v02", snap);
            const activeRollDraft =
              ownedChar.identity.creationState === "draft"
                ? await this.db.characterV02Actions.getActiveRollDraftForCharacter(
                    verified.accountId,
                    ownedChar.identity.characterId
                  )
                : null;
            const okMsg: GuestAuthResultPayload = {
              ok: true,
              code: "OK",
              messageVi: "Đã xác thực và liên kết phiên v0.2 thành công.",
              accountId: verified.accountId,
              activeRollDraft
            };
            client.send("v02_auth_result", okMsg);
            if (payload.deferWorldSpawn === true) {
              return;
            }
            if (snap.identity.creationState !== "confirmed") {
              client.send("v02_action_result", {
                requestId: "",
                ok: false,
                code: "CHARACTER_NOT_CONFIRMED",
                messageVi:
                  "Nhân vật chưa hoàn tất xác nhận Tiên Thiên Khí Vận, không thể tiến vào Bát Hoang."
              } satisfies CharacterV02ActionResultPayload);
              return;
            }
            await this.spawnOrSyncConfirmedCharacterV02(client, snap);
            return;
          }

          const existingChar = await this.db.getCharacterV02ByAccount(
            verified.accountId,
            {
              destinyCatalog: actionDefaults.destinyCatalog
            }
          );
          let activeRollDraft = null;
          let snap: CharacterV02SnapshotPayload | null = null;
          if (existingChar) {
            this.sessionToCharacterId.set(
              client.sessionId,
              existingChar.identity.characterId
            );
            snap = toCharacterV02Snapshot(existingChar, actionDefaults.destinyCatalog);
            this.activeCharactersV02.set(verified.accountId, snap);
            client.send("self_state_v02", snap);
            if (existingChar.identity.creationState === "draft") {
              activeRollDraft =
                await this.db.characterV02Actions.getActiveRollDraftForCharacter(
                  verified.accountId,
                  existingChar.identity.characterId
                );
            }
          }
          const okMsg: GuestAuthResultPayload = {
            ok: true,
            code: "OK",
            messageVi: "Đã xác thực và liên kết phiên v0.2 thành công.",
            accountId: verified.accountId,
            activeRollDraft
          };
          client.send("v02_auth_result", okMsg);
          if (
            payload.deferWorldSpawn !== true &&
            snap &&
            snap.identity.creationState === "confirmed"
          ) {
            await this.spawnOrSyncConfirmedCharacterV02(client, snap);
          }
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
          guestToken: issued.guestToken,
          activeRollDraft: null
        };
        client.send("v02_auth_result", issuedMsg);
      }
    );

    this.registerClientMessage(
      "v02_create_character_draft",
      async (client: Client, rawIntent: unknown) => {
        await this.executeVerifiedV02Action(
          client,
          rawIntent,
          (accountId) =>
            this.db.characterV02Actions.createCharacterDraft(
              accountId,
              rawIntent,
              this.db.getCharacterV02ActionDefaults()
            ),
          { spawnOnConfirm: false }
        );
      }
    );

    this.registerClientMessage(
      "v02_roll_innate_destiny",
      async (client: Client, rawIntent: unknown) => {
        const intentWithCharacter = this.withSessionBoundCharacterId(
          client.sessionId,
          rawIntent
        );
        await this.executeVerifiedV02Action(
          client,
          intentWithCharacter,
          (accountId) =>
            this.db.characterV02Actions.rollInnateDestiny(
              accountId,
              intentWithCharacter,
              this.db.getCharacterV02ActionDefaults()
            ),
          { spawnOnConfirm: false }
        );
      }
    );

    this.registerClientMessage(
      "v02_confirm_innate_destiny",
      async (client: Client, rawIntent: unknown) => {
        const intentWithCharacter = this.withSessionBoundCharacterId(
          client.sessionId,
          rawIntent
        );
        await this.executeVerifiedV02Action(client, intentWithCharacter, (accountId) =>
          this.db.characterV02Actions.confirmInnateDestiny(
            accountId,
            intentWithCharacter,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_allocate_attribute",
      async (client: Client, rawIntent: unknown) => {
        const intentWithCharacter = this.withSessionBoundCharacterId(
          client.sessionId,
          rawIntent
        );
        await this.executeVerifiedV02Action(client, intentWithCharacter, (accountId) =>
          this.db.characterV02Actions.allocateAttributePoint(
            accountId,
            intentWithCharacter,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_equip_acquired_destiny",
      async (client: Client, rawIntent: unknown) => {
        const intentWithCharacter = this.withSessionBoundCharacterId(
          client.sessionId,
          rawIntent
        );
        await this.executeVerifiedV02Action(client, intentWithCharacter, (accountId) =>
          this.db.characterV02Actions.equipAcquiredDestinyTrait(
            accountId,
            intentWithCharacter,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_unequip_acquired_destiny",
      async (client: Client, rawIntent: unknown) => {
        const intentWithCharacter = this.withSessionBoundCharacterId(
          client.sessionId,
          rawIntent
        );
        await this.executeVerifiedV02Action(client, intentWithCharacter, (accountId) =>
          this.db.characterV02Actions.unequipAcquiredDestinyTrait(
            accountId,
            intentWithCharacter,
            this.db.getCharacterV02ActionDefaults()
          )
        );
      }
    );

    this.registerClientMessage(
      "v02_leave_world",
      async (client: Client) => {
        const accountId =
          this.sessionToAccount.get(client.sessionId) ??
          this.db.guestIdentity.getVerifiedAccountForSession(client.sessionId);
        let leftCharacterId: string | null = null;
        if (accountId) {
          const player = this.activePlayers.get(accountId);
          if (player) {
            leftCharacterId = player.characterId;
            if (player.characterId.startsWith("char_v02_")) {
              await this.db.characterV02Actions.syncRuntimeWorldState(
                player.accountId,
                player,
                this.db.getCharacterV02ActionDefaults()
              );
            } else {
              await this.db.saveCharacterState(player);
            }
            this.engine.clearMonsterTargetsForAccount(
              this.zoneId,
              accountId,
              player.characterId
            );
            this.activePlayers.delete(accountId);
            this.playerAnims.delete(accountId);
          }
          this.sessionToAccount.delete(client.sessionId);
        }
        client.send("v02_left_world", {
          ok: true,
          characterId: leftCharacterId
        });
        const snap = this.buildWorldSnapshot();
        client.send("world_snapshot", snap);
        if (this.clients && this.clients.length > 0) {
          this.broadcast("world_snapshot", snap);
        }
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
        client.send("world_snapshot", this.buildWorldSnapshot());
        return;
      }

      const resolvedAccountId = authRes.accountId;
      const actionDefaults = this.db.getCharacterV02ActionDefaults();
      const requestedCharacterId =
        typeof options.characterId === "string" &&
        options.characterId.trim().length > 0
          ? options.characterId.trim()
          : undefined;

      if (requestedCharacterId) {
        const ownedChar = await this.db.getOwnedCharacterV02ById(
          resolvedAccountId,
          requestedCharacterId,
          {
            destinyCatalog: actionDefaults.destinyCatalog
          }
        );
        if (!ownedChar) {
          const otherChar = await this.db.getCharacterV02ById(requestedCharacterId, {
            destinyCatalog: actionDefaults.destinyCatalog
          });
          const okAuth: GuestAuthResultPayload = {
            ok: true,
            code: "OK",
            messageVi: "Đã xác thực danh tính khách v0.2 khi vào phòng.",
            accountId: authRes.accountId,
            activeRollDraft: null
          };
          client.send("v02_auth_result", okAuth);
          client.send("v02_action_result", {
            requestId: "",
            ok: false,
            code: otherChar
              ? "CHARACTER_OWNERSHIP_FORBIDDEN"
              : "CHARACTER_NOT_FOUND",
            messageVi: otherChar
              ? "Nhân vật không thuộc quyền sở hữu của tài khoản này."
              : "Không tìm thấy nhân vật v0.2 được chỉ định."
          } satisfies CharacterV02ActionResultPayload);
          client.send("world_snapshot", this.buildWorldSnapshot());
          return;
        }

        this.sessionToCharacterId.set(
          client.sessionId,
          ownedChar.identity.characterId
        );
        const snapV02 = toCharacterV02Snapshot(
          ownedChar,
          actionDefaults.destinyCatalog
        );
        this.activeCharactersV02.set(resolvedAccountId, snapV02);
        client.send("self_state_v02", snapV02);
        const activeRollDraft =
          ownedChar.identity.creationState === "draft"
            ? await this.db.characterV02Actions.getActiveRollDraftForCharacter(
                resolvedAccountId,
                ownedChar.identity.characterId
              )
            : null;
        const okAuth: GuestAuthResultPayload = {
          ok: true,
          code: "OK",
          messageVi: "Đã xác thực danh tính khách v0.2 khi vào phòng.",
          accountId: authRes.accountId,
          activeRollDraft
        };
        client.send("v02_auth_result", okAuth);

        if (options.deferWorldSpawn === true) {
          client.send("world_snapshot", this.buildWorldSnapshot());
          return;
        }
        if (snapV02.identity.creationState !== "confirmed") {
          client.send("v02_action_result", {
            requestId: "",
            ok: false,
            code: "CHARACTER_NOT_CONFIRMED",
            messageVi:
              "Nhân vật chưa hoàn tất xác nhận Tiên Thiên Khí Vận, không thể tiến vào Bát Hoang."
          } satisfies CharacterV02ActionResultPayload);
          client.send("world_snapshot", this.buildWorldSnapshot());
          return;
        }
        await this.spawnOrSyncConfirmedCharacterV02(client, snapV02, options?.spawnId);
        return;
      }

      const existingV02 = await this.db.getCharacterV02ByAccount(
        resolvedAccountId,
        {
          destinyCatalog: actionDefaults.destinyCatalog
        }
      );
      let activeRollDraft = null;
      let snapV02: CharacterV02SnapshotPayload | null = null;
      if (existingV02) {
        this.sessionToCharacterId.set(
          client.sessionId,
          existingV02.identity.characterId
        );
        snapV02 = toCharacterV02Snapshot(existingV02, actionDefaults.destinyCatalog);
        this.activeCharactersV02.set(resolvedAccountId, snapV02);
        client.send("self_state_v02", snapV02);
        if (existingV02.identity.creationState === "draft") {
          activeRollDraft =
            await this.db.characterV02Actions.getActiveRollDraftForCharacter(
              resolvedAccountId,
              existingV02.identity.characterId
            );
        }
      }

      const okAuth: GuestAuthResultPayload = {
        ok: true,
        code: "OK",
        messageVi: "Đã xác thực danh tính khách v0.2 khi vào phòng.",
        accountId: authRes.accountId,
        activeRollDraft
      };
      client.send("v02_auth_result", okAuth);

      if (
        options.deferWorldSpawn !== true &&
        snapV02 &&
        snapV02.identity.creationState === "confirmed"
      ) {
        await this.spawnOrSyncConfirmedCharacterV02(client, snapV02, options?.spawnId);
      } else {
        client.send("world_snapshot", this.buildWorldSnapshot());
      }
      return;
    }

    const resolvedAccountId = (options?.accountId ?? `guest_${client.sessionId}`)
      .trim()
      .slice(0, 64);
    const nickname = (options?.nickname ?? `Đạo Hữu ${client.sessionId.slice(0, 4)}`)
      .trim()
      .slice(0, 24);
    const discipline: CombatDisciplineId = options?.discipline ?? "kiem_tu";

    for (const [oldSid, oldAcc] of this.sessionToAccount.entries()) {
      if (oldAcc === resolvedAccountId && oldSid !== client.sessionId) {
        this.sessionToAccount.delete(oldSid);
        this.sessionToCharacterId.delete(oldSid);
      }
    }

    const player = await this.db.loadOrCreateCharacter(
      resolvedAccountId,
      nickname,
      discipline
    );
    const zoneDef = ZONES_REGISTRY[this.zoneId];
    player.zoneId = this.zoneId;

    if (options?.spawnId && zoneDef.spawns[options.spawnId]) {
      player.x = zoneDef.spawns[options.spawnId].x;
      player.y = zoneDef.spawns[options.spawnId].y;
    } else {
      const safeCoords = this.engine.resolveSafeZoneCoordinates(
        this.zoneId,
        player.x,
        player.y
      );
      player.x = safeCoords.x;
      player.y = safeCoords.y;
    }

    await this.db.saveCharacterState(player);

    this.sessionToAccount.set(client.sessionId, player.accountId);
    this.sessionToCharacterId.set(client.sessionId, player.characterId);
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
    const verifiedAcc = this.db.guestIdentity.getVerifiedAccountForSession(
      client.sessionId
    );
    this.db.guestIdentity.unbindSession(client.sessionId);

    const accountId = this.sessionToAccount.get(client.sessionId);
    const boundCharacterId = this.sessionToCharacterId.get(client.sessionId);
    this.sessionToAccount.delete(client.sessionId);
    this.sessionToCharacterId.delete(client.sessionId);

    const hasOtherActiveSessionForVerifiedAcc = verifiedAcc
      ? Array.from(this.sessionToAccount.values()).includes(verifiedAcc)
      : false;
    if (verifiedAcc && !hasOtherActiveSessionForVerifiedAcc) {
      this.activeCharactersV02.delete(verifiedAcc);
    }

    const hasOtherActiveSessionForAccount = accountId
      ? Array.from(this.sessionToAccount.values()).includes(accountId)
      : false;
    if (accountId && !hasOtherActiveSessionForAccount) {
      const player = this.activePlayers.get(accountId);
      if (
        player &&
        (!boundCharacterId || player.characterId === boundCharacterId)
      ) {
        if (player.characterId.startsWith("char_v02_")) {
          await this.db.characterV02Actions.syncRuntimeWorldState(
            player.accountId,
            player,
            this.db.getCharacterV02ActionDefaults()
          );
        } else {
          await this.db.saveCharacterState(player);
        }
        this.engine.clearMonsterTargetsForAccount(
          this.zoneId,
          accountId,
          player.characterId
        );
        this.activePlayers.delete(accountId);
        this.playerAnims.delete(accountId);
      }
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

  private withSessionBoundCharacterId(
    sessionId: string,
    rawIntent: unknown
  ): unknown {
    if (
      typeof rawIntent !== "object" ||
      rawIntent === null ||
      Array.isArray(rawIntent)
    ) {
      return rawIntent;
    }
    const obj = rawIntent as Record<string, unknown>;
    if (obj.characterId !== undefined) {
      return rawIntent;
    }
    const boundCharacterId = this.sessionToCharacterId.get(sessionId);
    if (!boundCharacterId) {
      return rawIntent;
    }
    return {
      ...obj,
      characterId: boundCharacterId
    };
  }

  private async executeVerifiedV02Action(
    client: Client,
    rawIntent: unknown,
    actionFn: (accountId: string) => Promise<CharacterV02ActionResultPayload>,
    options?: { spawnOnConfirm?: boolean }
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

    const activePlayer = this.activePlayers.get(sessionCheck.accountId);
    const cachedV02 = this.activeCharactersV02.get(sessionCheck.accountId);
    if (
      activePlayer &&
      activePlayer.characterId.startsWith("char_v02_") &&
      cachedV02 &&
      activePlayer.characterId === cachedV02.identity.characterId &&
      (activePlayer.hp !== cachedV02.resources.currentHp ||
        activePlayer.mp !== cachedV02.resources.currentMp ||
        activePlayer.zoneId !== cachedV02.world.zoneId ||
        activePlayer.x !== cachedV02.world.x ||
        activePlayer.y !== cachedV02.world.y)
    ) {
      await this.db.characterV02Actions.syncRuntimeWorldState(
        sessionCheck.accountId,
        activePlayer,
        this.db.getCharacterV02ActionDefaults()
      );
    }

    const result = await actionFn(sessionCheck.accountId);
    if (result.ok && result.character) {
      this.sessionToCharacterId.set(
        client.sessionId,
        result.character.identity.characterId
      );
      this.activeCharactersV02.set(sessionCheck.accountId, result.character);
      client.send("self_state_v02", result.character);
      if (
        result.character.identity.creationState === "confirmed" &&
        options?.spawnOnConfirm !== false
      ) {
        await this.spawnOrSyncConfirmedCharacterV02(client, result.character);
      }
    }
    client.send("v02_action_result", result);
  }

  private async evictSupersededAccountSessions(
    accountId: string,
    currentSessionId: string,
    nextCharacterId: string
  ): Promise<void> {
    for (const room of activeRooms.values()) {
      const existingPlayer = room.activePlayers.get(accountId);
      const staleSessions: string[] = [];
      for (const [sid, acc] of room.sessionToAccount.entries()) {
        if (acc === accountId && (room !== this || sid !== currentSessionId)) {
          staleSessions.push(sid);
        }
      }

      if (
        existingPlayer &&
        (room !== this || existingPlayer.characterId !== nextCharacterId)
      ) {
        if (existingPlayer.characterId.startsWith("char_v02_")) {
          await room.db.characterV02Actions.syncRuntimeWorldState(
            existingPlayer.accountId,
            existingPlayer,
            room.db.getCharacterV02ActionDefaults()
          );
        } else {
          await room.db.saveCharacterState(existingPlayer);
        }
        room.engine.clearMonsterTargetsForAccount(
          room.zoneId,
          accountId,
          existingPlayer.characterId
        );
        room.activePlayers.delete(accountId);
        room.playerAnims.delete(accountId);
      }

      for (const oldSid of staleSessions) {
        room.sessionToAccount.delete(oldSid);
        room.sessionToCharacterId.delete(oldSid);
      }

      if (room !== this && (staleSessions.length > 0 || existingPlayer)) {
        if (room.clients && room.clients.length > 0) {
          room.broadcast("world_snapshot", room.buildWorldSnapshot());
        }
      }
    }
  }

  private async spawnOrSyncConfirmedCharacterV02(
    client: Client,
    snapV02: CharacterV02SnapshotPayload,
    spawnId?: string
  ): Promise<void> {
    const accountId = snapV02.identity.accountId;
    await this.evictSupersededAccountSessions(
      accountId,
      client.sessionId,
      snapV02.identity.characterId
    );

    const currentRuntime = this.activePlayers.get(accountId);
    const existingRuntime =
      currentRuntime &&
      currentRuntime.characterId === snapV02.identity.characterId
        ? currentRuntime
        : undefined;
    const zoneDef = ZONES_REGISTRY[this.zoneId];
    let x = snapV02.world.x;
    let y = snapV02.world.y;

    if (spawnId && zoneDef.spawns[spawnId]) {
      x = zoneDef.spawns[spawnId].x;
      y = zoneDef.spawns[spawnId].y;
    } else if (
      existingRuntime &&
      existingRuntime.zoneId === this.zoneId &&
      this.engine.isConnectedWalkable(this.zoneId, existingRuntime.x, existingRuntime.y)
    ) {
      x = existingRuntime.x;
      y = existingRuntime.y;
    } else if (snapV02.world.zoneId !== this.zoneId) {
      x = zoneDef.defaultSpawn.x;
      y = zoneDef.defaultSpawn.y;
    } else {
      const safeCoords = this.engine.resolveSafeZoneCoordinates(this.zoneId, x, y);
      x = safeCoords.x;
      y = safeCoords.y;
    }

    const player: CharacterSaveState = {
      accountId,
      characterId: snapV02.identity.characterId,
      nickname: snapV02.identity.name,
      appearanceId: snapV02.identity.appearanceId,
      discipline: existingRuntime?.discipline ?? "kiem_tu",
      zoneId: this.zoneId,
      x,
      y,
      direction: existingRuntime?.direction ?? snapV02.world.direction,
      realmId: snapV02.cultivation.realmId,
      realmStage: snapV02.cultivation.realmStage,
      tuVi: Math.max(0, Math.floor(Number(snapV02.cultivation.tuVi) || 0)),
      level: snapV02.levelProgress.level,
      hp: snapV02.resources.currentHp,
      maxHp: snapV02.derivedStats.maxHp,
      mp: snapV02.resources.currentMp,
      maxMp: snapV02.derivedStats.maxMp,
      attack: snapV02.derivedStats.physicalAttack,
      defense: snapV02.derivedStats.physicalDefense,
      linhThach: existingRuntime?.linhThach ?? snapV02.world.linhThach,
      equippedTitle: existingRuntime?.equippedTitle ?? snapV02.world.equippedTitle,
      equippedInheritance:
        existingRuntime?.equippedInheritance ?? snapV02.world.equippedInheritance,
      inventory: existingRuntime?.inventory ?? snapV02.world.inventory,
      quests: existingRuntime?.quests ?? snapV02.world.quests,
      reputation: existingRuntime?.reputation ?? snapV02.world.reputation,
      buffs: existingRuntime?.buffs ?? snapV02.world.buffs,
      meditationStartedAt:
        existingRuntime?.meditationStartedAt ?? snapV02.world.meditationStartedAtMs,
      lastMeditationClaimAt:
        existingRuntime?.lastMeditationClaimAt ?? snapV02.world.lastMeditationClaimAtMs,
      partyId: existingRuntime?.partyId ?? null,
      creationState: snapV02.identity.creationState,
      identity: snapV02.identity,
      levelProgress: snapV02.levelProgress,
      attributes: snapV02.attributes?.origin,
      destiny: snapV02.destiny
    };

    if (
      snapV02.world.zoneId !== this.zoneId ||
      snapV02.world.x !== x ||
      snapV02.world.y !== y
    ) {
      const synced = await this.db.characterV02Actions.syncRuntimeWorldState(
        accountId,
        player,
        this.db.getCharacterV02ActionDefaults()
      );
      if (synced) {
        this.activeCharactersV02.set(accountId, synced);
        client.send("self_state_v02", synced);
      }
    }

    this.sessionToAccount.set(client.sessionId, player.accountId);
    this.sessionToCharacterId.set(client.sessionId, player.characterId);
    this.activePlayers.set(player.accountId, player);
    if (!this.playerAnims.has(player.accountId)) {
      this.playerAnims.set(player.accountId, "idle");
    }

    client.send("self_state", player);
    const worldSnap = this.buildWorldSnapshot();
    client.send("world_snapshot", worldSnap);
    if (this.clients && this.clients.length > 0) {
      this.broadcast("world_snapshot", worldSnap);
    }
  }

  private async refreshV02SnapshotForPlayer(
    client: Client,
    player: CharacterSaveState
  ): Promise<void> {
    if (!player.characterId.startsWith("char_v02_")) {
      return;
    }
    const actionDefaults = this.db.getCharacterV02ActionDefaults();
    const updatedV02 = await this.db.getOwnedCharacterV02ById(
      player.accountId,
      player.characterId,
      {
        destinyCatalog: actionDefaults.destinyCatalog
      }
    );
    if (!updatedV02) {
      return;
    }
    const snapV02 = toCharacterV02Snapshot(updatedV02, actionDefaults.destinyCatalog);
    player.maxHp = snapV02.derivedStats.maxHp;
    player.maxMp = snapV02.derivedStats.maxMp;
    player.hp = snapV02.resources.currentHp;
    player.mp = snapV02.resources.currentMp;
    player.attack = snapV02.derivedStats.physicalAttack;
    player.defense = snapV02.derivedStats.physicalDefense;
    player.level = snapV02.levelProgress.level;
    player.levelProgress = snapV02.levelProgress;
    player.attributes = snapV02.attributes?.origin;
    player.destiny = snapV02.destiny;
    this.activeCharactersV02.set(player.accountId, snapV02);
    client.send("self_state_v02", snapV02);
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
        appearanceId: p.appearanceId,
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
        level: p.level ?? p.levelProgress?.level,
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
