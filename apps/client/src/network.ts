import { Client, type Room } from "@colyseus/sdk";
import type {
  ActionResultPayload,
  AttackIntentPayload,
  BaseAttributeKey,
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  ChatMessagePayload,
  CombatDisciplineId,
  CombatEventPayload,
  DestinyRollDraft,
  Direction,
  GuestAuthResultPayload,
  PortalApprovedPayload,
  RoomWorldSnapshot,
  ZoneId
} from "@tong-mon-8d/shared";

export interface NetworkCallbacks {
  onSelfState: (state: CharacterSaveState) => void;
  onSelfStateV02?: (state: CharacterV02SnapshotPayload) => void;
  onGuestAuthResult?: (result: GuestAuthResultPayload) => void;
  onCharacterV02ActionResult?: (result: CharacterV02ActionResultPayload) => void;
  onWorldSnapshot: (snapshot: RoomWorldSnapshot) => void;
  onActionResult: (result: ActionResultPayload) => void;
  onCombatEvent: (event: CombatEventPayload) => void;
  onChatMessage: (msg: ChatMessagePayload) => void;
  onZoneChanged: (zoneId: ZoneId, spawnX: number, spawnY: number) => void;
}

export class GameNetworkClient {
  private client: Client;
  private serverEndpoint: string;
  private httpEndpoint: string;
  private room: Room | null = null;
  private callbacks: NetworkCallbacks;
  private accountId: string;
  private nickname: string;
  private discipline: CombatDisciplineId;
  private currentZoneId: ZoneId = "tan_thu_thon";
  private moveSeq = 0;
  private reqCounter = 0;
  private switchingZone = false;
  private legacyMode: boolean;
  private guestTokenStorageKey: string;
  private guestToken: string | null = null;

  public selfState: CharacterSaveState | null = null;
  public selfStateV02: CharacterV02SnapshotPayload | null = null;
  public activeRollDraft: DestinyRollDraft | null = null;
  public lastGuestAuthResult: GuestAuthResultPayload | null = null;
  public worldSnapshot: RoomWorldSnapshot | null = null;

  constructor(callbacks: NetworkCallbacks) {
    this.callbacks = callbacks;
    const params = new URLSearchParams(window.location.search);
    const urlServerPort = params.get("serverPort")?.trim();
    const runtimeOverride = (
      window as unknown as { __TM8D_SERVER_URL__?: string }
    ).__TM8D_SERVER_URL__;
    const envEndpoint =
      (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SERVER_URL;
    const rawEndpoint =
      (urlServerPort ? `http://${window.location.hostname}:${urlServerPort}` : "") ||
      runtimeOverride ||
      envEndpoint ||
      `http://${window.location.hostname || "127.0.0.1"}:2567`;
    this.serverEndpoint = rawEndpoint;
    this.httpEndpoint = rawEndpoint
      .replace(/^ws:/i, "http:")
      .replace(/^wss:/i, "https:");
    this.client = new Client(this.serverEndpoint);

    const urlAcc = params.get("account")?.trim();
    const forceLegacy = params.get("legacy") === "1";
    this.legacyMode = Boolean(urlAcc) || forceLegacy;

    const guestSlot = params.get("guestSlot")?.trim();
    this.guestTokenStorageKey = guestSlot
      ? `tm8d_v02_guest_token_${guestSlot}`
      : "tm8d_v02_guest_token";

    const urlGuestToken = params.get("guestToken")?.trim();
    if (urlGuestToken) {
      this.guestToken = urlGuestToken;
      localStorage.setItem(this.guestTokenStorageKey, urlGuestToken);
    } else {
      this.guestToken = localStorage.getItem(this.guestTokenStorageKey);
    }

    const storedAcc =
      sessionStorage.getItem("tm8d_account") ?? localStorage.getItem("tm8d_account");
    this.accountId =
      urlAcc || storedAcc || `acc_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("tm8d_account", this.accountId);
    if (!urlAcc) {
      localStorage.setItem("tm8d_account", this.accountId);
    }

    const urlName = params.get("name")?.trim();
    const storedName = sessionStorage.getItem("tm8d_name");
    this.nickname =
      urlName || storedName || `Đạo Hữu ${this.accountId.slice(-4).toUpperCase()}`;
    sessionStorage.setItem("tm8d_name", this.nickname);

    const urlDisc = params.get("discipline") as CombatDisciplineId | null;
    this.discipline =
      urlDisc === "phap_tu" || urlDisc === "the_tu" ? urlDisc : "kiem_tu";

    const urlZone = params.get("zone") as ZoneId | null;
    if (urlZone === "thanh_truc_lam" || urlZone === "tan_thu_thon") {
      this.currentZoneId = urlZone;
    }
  }

  public isV02Mode(): boolean {
    return !this.legacyMode;
  }

  public getAccountId(): string {
    return this.selfStateV02?.identity.accountId ?? this.accountId;
  }

  public getGuestToken(): string | null {
    return this.guestToken;
  }

  public getCurrentZoneId(): ZoneId {
    return this.currentZoneId;
  }

  private nextRequestId(prefix: string): string {
    this.reqCounter += 1;
    const accPart = (this.selfStateV02?.identity.accountId ?? this.accountId).slice(-12);
    return `${prefix}_${accPart}_${Date.now()}_${this.reqCounter}`;
  }

  private async ensureGuestTokenIssued(): Promise<string> {
    if (this.guestToken && this.guestToken.trim().length > 0) {
      return this.guestToken;
    }
    const resp = await fetch(`${this.httpEndpoint}/api/v02/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: this.nextRequestId("guest_init") })
    });
    const data = (await resp.json()) as GuestAuthResultPayload;
    if (data.ok && data.guestToken && data.accountId) {
      this.guestToken = data.guestToken;
      this.accountId = data.accountId;
      localStorage.setItem(this.guestTokenStorageKey, data.guestToken);
      sessionStorage.setItem("tm8d_v02_account", data.accountId);
      return data.guestToken;
    }
    throw new Error(data.messageVi || "Không thể khởi tạo danh tính khách v0.2.");
  }

  public async resetInvalidGuestSession(): Promise<void> {
    localStorage.removeItem(this.guestTokenStorageKey);
    sessionStorage.removeItem("tm8d_v02_account");
    this.guestToken = null;
    this.selfState = null;
    this.selfStateV02 = null;
    this.activeRollDraft = null;
    this.lastGuestAuthResult = null;
    await this.ensureGuestTokenIssued();
    await this.connect(this.currentZoneId);
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
    if (this.isV02Mode()) {
      const token = await this.ensureGuestTokenIssued();
      const joinedRoom = await this.client.joinOrCreate(targetZone, {
        zoneId: targetZone,
        guestToken: token,
        spawnId
      });
      this.room = joinedRoom;
      this.bindRoomHandlers(joinedRoom);
      if (!this.lastGuestAuthResult) {
        joinedRoom.send("v02_auth_guest", { guestToken: token });
      }
      return;
    }

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

    room.onMessage("self_state_v02", (state: CharacterV02SnapshotPayload) => {
      this.selfStateV02 = state;
      this.accountId = state.identity.accountId;
      this.nickname = state.identity.name;
      if (state.identity.creationState === "confirmed") {
        this.activeRollDraft = null;
      }
      this.callbacks.onSelfStateV02?.(state);
    });

    room.onMessage("v02_auth_result", (result: GuestAuthResultPayload) => {
      this.lastGuestAuthResult = result;
      if (result.ok) {
        if (result.accountId) {
          this.accountId = result.accountId;
        }
        if (result.guestToken) {
          this.guestToken = result.guestToken;
          localStorage.setItem(this.guestTokenStorageKey, result.guestToken);
        }
        if (result.activeRollDraft !== undefined) {
          this.activeRollDraft = result.activeRollDraft ?? null;
        }
      }
      this.callbacks.onGuestAuthResult?.(result);
    });

    room.onMessage("v02_action_result", (result: CharacterV02ActionResultPayload) => {
      if (result.ok) {
        if (result.character) {
          this.selfStateV02 = result.character;
          this.accountId = result.character.identity.accountId;
          this.nickname = result.character.identity.name;
        }
        if (result.rollDraft) {
          this.activeRollDraft = result.rollDraft;
        } else if (result.character?.identity.creationState === "confirmed") {
          this.activeRollDraft = null;
        }
      }
      this.callbacks.onCharacterV02ActionResult?.(result);
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
        this.callbacks.onZoneChanged(
          approval.targetZoneId,
          approval.spawnX,
          approval.spawnY
        );
      } finally {
        this.switchingZone = false;
      }
    });
  }

  public sendCreateCharacterDraftV02(name: string, appearanceId: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_create_character_draft", {
      requestId: this.nextRequestId("v02_draft"),
      name,
      appearanceId
    });
  }

  public sendRollInnateDestinyV02(): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_roll_innate_destiny", {
      requestId: this.nextRequestId("v02_roll")
    });
  }

  public sendConfirmInnateDestinyV02(rollNonce: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_confirm_innate_destiny", {
      requestId: this.nextRequestId("v02_confirm"),
      rollNonce
    });
  }

  public sendAllocateAttributePointV02(attributeId: BaseAttributeKey): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_allocate_attribute", {
      requestId: this.nextRequestId("v02_alloc"),
      attributeId
    });
  }

  public sendEquipAcquiredDestinyV02(slotIndex: 0 | 1 | 2, traitId: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_equip_acquired_destiny", {
      requestId: this.nextRequestId("v02_equip"),
      slotIndex,
      traitId
    });
  }

  public sendUnequipAcquiredDestinyV02(slotIndex: 0 | 1 | 2): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_unequip_acquired_destiny", {
      requestId: this.nextRequestId("v02_unequip"),
      slotIndex
    });
  }

  public sendMove(
    x: number,
    y: number,
    vx: number,
    vy: number,
    direction: Direction
  ): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
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
    if (!this.room || this.switchingZone || !this.selfState) return;
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
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("attack", {
      skillId,
      direction,
      targetInstanceId,
      requestId: this.nextRequestId("atk")
    });
  }

  public sendPickupDrop(dropId: string): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("pickup_drop", {
      dropId,
      requestId: this.nextRequestId("pickup")
    });
  }

  public sendShopBuy(itemId: string, quantity = 1, customRequestId?: string): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("shop_buy", {
      npcId: "merchant_truong",
      itemId,
      quantity,
      requestId: customRequestId ?? this.nextRequestId("buy")
    });
  }

  public sendCookRecipe(recipeId: string, customRequestId?: string): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("cook_recipe", {
      recipeId,
      requestId: customRequestId ?? this.nextRequestId("cook")
    });
  }

  public sendUseItem(itemId: string): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
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
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("quest_action", {
      npcId,
      questId,
      action,
      submittedItemId,
      requestId: this.nextRequestId("quest")
    });
  }

  public sendClaimMeditation(customRequestId?: string): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("claim_meditation", {
      requestId: customRequestId ?? this.nextRequestId("med")
    });
  }

  public sendBreakthrough(customRequestId?: string): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("breakthrough", {
      requestId: customRequestId ?? this.nextRequestId("brk")
    });
  }

  public sendPartyAction(
    action: "create" | "join" | "leave",
    targetPartyId?: string
  ): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("party_action", {
      action,
      targetPartyId,
      requestId: this.nextRequestId("party")
    });
  }

  public sendChat(text: string): void {
    if (!this.room || this.switchingZone || !this.selfState) return;
    this.room.send("chat", { text });
  }
}
