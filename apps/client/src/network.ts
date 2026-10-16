import { Client, type Room } from "@colyseus/sdk";
import type {
  ActionResultPayload,
  AttackIntentPayload,
  CharacterSaveState,
  ChatMessagePayload,
  CombatDisciplineId,
  CombatEventPayload,
  Direction,
  PortalApprovedPayload,
  RoomWorldSnapshot,
  ZoneId
} from "@tong-mon-8d/shared";

export interface NetworkCallbacks {
  onSelfState: (state: CharacterSaveState) => void;
  onWorldSnapshot: (snapshot: RoomWorldSnapshot) => void;
  onActionResult: (result: ActionResultPayload) => void;
  onCombatEvent: (event: CombatEventPayload) => void;
  onChatMessage: (msg: ChatMessagePayload) => void;
  onZoneChanged: (zoneId: ZoneId, spawnX: number, spawnY: number) => void;
}

export class GameNetworkClient {
  private client: Client;
  private room: Room | null = null;
  private callbacks: NetworkCallbacks;
  private accountId: string;
  private nickname: string;
  private discipline: CombatDisciplineId;
  private currentZoneId: ZoneId = "tan_thu_thon";
  private moveSeq = 0;
  private reqCounter = 0;
  private switchingZone = false;

  public selfState: CharacterSaveState | null = null;
  public worldSnapshot: RoomWorldSnapshot | null = null;

  constructor(callbacks: NetworkCallbacks) {
    this.callbacks = callbacks;
    const serverEndpoint =
      (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SERVER_URL ??
      "http://127.0.0.1:2567";
    this.client = new Client(serverEndpoint);

    const params = new URLSearchParams(window.location.search);
    const urlAcc = params.get("account")?.trim();
    const storedAcc = sessionStorage.getItem("tm8d_account") ?? localStorage.getItem("tm8d_account");
    this.accountId = urlAcc || storedAcc || `acc_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("tm8d_account", this.accountId);
    if (!urlAcc) {
      localStorage.setItem("tm8d_account", this.accountId);
    }

    const urlName = params.get("name")?.trim();
    const storedName = sessionStorage.getItem("tm8d_name");
    this.nickname = urlName || storedName || `Đạo Hữu ${this.accountId.slice(-4).toUpperCase()}`;
    sessionStorage.setItem("tm8d_name", this.nickname);

    const urlDisc = params.get("discipline") as CombatDisciplineId | null;
    this.discipline =
      urlDisc === "phap_tu" || urlDisc === "the_tu" ? urlDisc : "kiem_tu";

    const urlZone = params.get("zone") as ZoneId | null;
    if (urlZone === "thanh_truc_lam" || urlZone === "tan_thu_thon") {
      this.currentZoneId = urlZone;
    }
  }

  public getAccountId(): string {
    return this.accountId;
  }

  public getCurrentZoneId(): ZoneId {
    return this.currentZoneId;
  }

  private nextRequestId(prefix: string): string {
    this.reqCounter += 1;
    return `${prefix}_${this.accountId}_${Date.now()}_${this.reqCounter}`;
  }

  public async connect(zoneId?: ZoneId, spawnId?: string): Promise<void> {
    const targetZone = zoneId ?? this.currentZoneId;
    if (this.room) {
      try {
        await this.room.leave(true);
      } catch {
        this.room = null;
      }
      this.room = null;
    }

    this.currentZoneId = targetZone;
    const joinedRoom = await this.client.joinOrCreate(targetZone, {
      zoneId: targetZone,
      accountId: this.accountId,
      nickname: this.nickname,
      discipline: this.discipline,
      spawnId
    });
    this.room = joinedRoom;
    this.bindRoomHandlers(joinedRoom);
  }

  private bindRoomHandlers(room: Room): void {
    room.onMessage("self_state", (state: CharacterSaveState) => {
      this.selfState = state;
      this.currentZoneId = state.zoneId;
      this.callbacks.onSelfState(state);
    });

    room.onMessage("world_snapshot", (snapshot: RoomWorldSnapshot) => {
      this.worldSnapshot = snapshot;
      this.callbacks.onWorldSnapshot(snapshot);
    });

    room.onMessage("action_result", (result: ActionResultPayload) => {
      this.callbacks.onActionResult(result);
    });

    room.onMessage("combat_event", (event: CombatEventPayload) => {
      this.callbacks.onCombatEvent(event);
    });

    room.onMessage("chat_message", (msg: ChatMessagePayload) => {
      this.callbacks.onChatMessage(msg);
    });

    room.onMessage("portal_approved", async (approval: PortalApprovedPayload) => {
      if (this.switchingZone) return;
      this.switchingZone = true;
      try {
        await this.connect(approval.targetZoneId, approval.targetSpawnId);
        this.callbacks.onZoneChanged(approval.targetZoneId, approval.spawnX, approval.spawnY);
      } finally {
        this.switchingZone = false;
      }
    });
  }

  public sendMove(x: number, y: number, vx: number, vy: number, direction: Direction): void {
    if (!this.room || this.switchingZone) return;
    this.moveSeq += 1;
    this.room.send("move", {
      seq: this.moveSeq,
      x: Math.round(x),
      y: Math.round(y),
      vx,
      vy,
      direction
    });
  }

  public sendPortal(portalId: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("portal", {
      portalId,
      requestId: this.nextRequestId("portal")
    });
  }

  public sendAttack(
    skillId: AttackIntentPayload["skillId"],
    direction: Direction,
    targetInstanceId?: string
  ): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("attack", {
      skillId,
      direction,
      targetInstanceId,
      requestId: this.nextRequestId("atk")
    });
  }

  public sendPickupDrop(dropId: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("pickup_drop", {
      dropId,
      requestId: this.nextRequestId("pickup")
    });
  }

  public sendShopBuy(itemId: string, quantity = 1, customRequestId?: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("shop_buy", {
      npcId: "merchant_truong",
      itemId,
      quantity,
      requestId: customRequestId ?? this.nextRequestId("buy")
    });
  }

  public sendCookRecipe(recipeId: string, customRequestId?: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("cook_recipe", {
      recipeId,
      requestId: customRequestId ?? this.nextRequestId("cook")
    });
  }

  public sendUseItem(itemId: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("use_item", {
      itemId,
      requestId: this.nextRequestId("use")
    });
  }

  public sendQuestAction(
    npcId: string,
    questId: string,
    action: "accept" | "submit",
    submittedItemId?: string
  ): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("quest_action", {
      npcId,
      questId,
      action,
      submittedItemId,
      requestId: this.nextRequestId("quest")
    });
  }

  public sendClaimMeditation(customRequestId?: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("claim_meditation", {
      requestId: customRequestId ?? this.nextRequestId("med")
    });
  }

  public sendBreakthrough(customRequestId?: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("breakthrough", {
      requestId: customRequestId ?? this.nextRequestId("brk")
    });
  }

  public sendPartyAction(action: "create" | "join" | "leave", targetPartyId?: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("party_action", {
      action,
      targetPartyId,
      requestId: this.nextRequestId("party")
    });
  }

  public sendChat(text: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("chat", { text });
  }
}
