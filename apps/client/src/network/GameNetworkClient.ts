import { Client, type Room } from "@colyseus/sdk";
import type {
  ActionResultPayload,
  AttackIntentPayload,
  BaseAttributeKey,
  CharacterRosterEntryDto,
  CharacterRosterResponsePayload,
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  ChatMessagePayload,
  CombatDisciplineId,
  CombatEventPayload,
  CreateCharacterV02DraftIntentPayload,
  DestinyRollDraft,
  Direction,
  GuestAuthResultPayload,
  PortalApprovedPayload,
  RoomWorldSnapshot,
  SelectCharacterForWorldEntryResultPayload,
  ZoneId
} from "@tong-mon-8d/shared";

export interface NetworkCallbacks {
  onSelfState: (state: CharacterSaveState) => void;
  onSelfStateV02?: (state: CharacterV02SnapshotPayload) => void;
  onGuestAuthResult?: (result: GuestAuthResultPayload) => void;
  onCharacterV02ActionResult?: (result: CharacterV02ActionResultPayload) => void;
  onRosterUpdated?: (roster: CharacterRosterResponsePayload) => void;
  onLeftWorldToMenu?: () => void;
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
  private legacyGuestTokenStorageKey: string;
  private accountIdStorageKey: string;
  private lastSelectedCharacterStorageKey: string;
  private guestToken: string | null = null;
  private selectedCharacterId: string | null = null;

  public selfState: CharacterSaveState | null = null;
  public selfStateV02: CharacterV02SnapshotPayload | null = null;
  public activeRollDraft: DestinyRollDraft | null = null;
  public lastGuestAuthResult: GuestAuthResultPayload | null = null;
  public worldSnapshot: RoomWorldSnapshot | null = null;
  public rosterCharacters: CharacterRosterEntryDto[] = [];

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
      ? `tong_mon_8d_v02_guest_token_${guestSlot}`
      : "tong_mon_8d_v02_guest_token";
    this.legacyGuestTokenStorageKey = guestSlot
      ? `tm8d_v02_guest_token_${guestSlot}`
      : "tm8d_v02_guest_token";
    this.accountIdStorageKey = guestSlot
      ? `tong_mon_8d_v02_account_id_${guestSlot}`
      : "tong_mon_8d_v02_account_id";
    this.lastSelectedCharacterStorageKey = guestSlot
      ? `tong_mon_8d_v02_last_selected_character_id_${guestSlot}`
      : "tong_mon_8d_v02_last_selected_character_id";

    const urlGuestToken = params.get("guestToken")?.trim();
    if (urlGuestToken) {
      this.saveGuestToken(urlGuestToken);
    } else {
      const storedToken =
        localStorage.getItem(this.guestTokenStorageKey) ??
        localStorage.getItem(this.legacyGuestTokenStorageKey);
      if (storedToken && storedToken.trim().length > 0) {
        this.saveGuestToken(storedToken.trim());
      }
    }

    const storedV02Acc = localStorage.getItem(this.accountIdStorageKey);
    const storedAcc =
      storedV02Acc ??
      sessionStorage.getItem("tm8d_account") ??
      localStorage.getItem("tm8d_account");
    this.accountId =
      urlAcc || storedAcc || `acc_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("tm8d_account", this.accountId);
    if (!urlAcc) {
      localStorage.setItem("tm8d_account", this.accountId);
    }

    this.selectedCharacterId =
      localStorage.getItem(this.lastSelectedCharacterStorageKey) ?? null;

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

  private saveGuestToken(token: string): void {
    this.guestToken = token;
    localStorage.setItem(this.guestTokenStorageKey, token);
    localStorage.setItem(this.legacyGuestTokenStorageKey, token);
  }

  private saveAccountId(accountId: string): void {
    this.accountId = accountId;
    localStorage.setItem(this.accountIdStorageKey, accountId);
    sessionStorage.setItem("tm8d_v02_account", accountId);
  }

  public setSelectedCharacterId(characterId: string | null): void {
    this.selectedCharacterId = characterId;
    if (characterId) {
      localStorage.setItem(this.lastSelectedCharacterStorageKey, characterId);
    } else {
      localStorage.removeItem(this.lastSelectedCharacterStorageKey);
    }
  }

  public getSelectedCharacterId(): string | null {
    return (
      this.selectedCharacterId ??
      this.selfStateV02?.identity.characterId ??
      this.selfState?.characterId ??
      null
    );
  }

  public isV02Mode(): boolean {
    return !this.legacyMode;
  }

  public isConnectedToWorldRoom(): boolean {
    return Boolean(this.room && this.selfState);
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

  public nextClientRequestId(prefix: string): string {
    return this.nextRequestId(prefix);
  }

  private nextRequestId(prefix: string): string {
    this.reqCounter += 1;
    const accPart = (this.selfStateV02?.identity.accountId ?? this.accountId).slice(-12);
    return `${prefix}_${accPart}_${Date.now()}_${this.reqCounter}`;
  }

  public async authenticateGuestHttp(): Promise<GuestAuthResultPayload> {
    if (this.guestToken && this.guestToken.trim().length > 0) {
      try {
        const verifyResp = await fetch(`${this.httpEndpoint}/api/v02/auth/guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: this.nextRequestId("guest_verify"),
            guestToken: this.guestToken
          })
        });
        const verifyData = (await verifyResp.json()) as GuestAuthResultPayload;
        if (verifyData.ok && verifyData.accountId) {
          this.saveAccountId(verifyData.accountId);
          if (verifyData.guestToken) {
            this.saveGuestToken(verifyData.guestToken);
          }
          if (verifyData.activeRollDraft !== undefined) {
            this.activeRollDraft = verifyData.activeRollDraft ?? null;
          }
          this.lastGuestAuthResult = verifyData;
          this.callbacks.onGuestAuthResult?.(verifyData);
          return verifyData;
        }
      } catch {
        this.lastGuestAuthResult = null;
      }
    }

    const issueResp = await fetch(`${this.httpEndpoint}/api/v02/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: this.nextRequestId("guest_issue") })
    });
    const issueData = (await issueResp.json()) as GuestAuthResultPayload;
    if (issueData.ok && issueData.guestToken && issueData.accountId) {
      this.saveGuestToken(issueData.guestToken);
      this.saveAccountId(issueData.accountId);
      this.activeRollDraft = issueData.activeRollDraft ?? null;
    }
    this.lastGuestAuthResult = issueData;
    this.callbacks.onGuestAuthResult?.(issueData);
    return issueData;
  }

  private async ensureGuestTokenIssued(): Promise<string> {
    if (this.guestToken && this.guestToken.trim().length > 0) {
      return this.guestToken;
    }
    const authRes = await this.authenticateGuestHttp();
    if (authRes.ok && this.guestToken) {
      return this.guestToken;
    }
    throw new Error(authRes.messageVi || "Không thể khởi tạo danh tính khách v0.2.");
  }

  public async fetchCharacterRosterHttp(): Promise<CharacterRosterResponsePayload> {
    const token = await this.ensureGuestTokenIssued();
    const resp = await fetch(`${this.httpEndpoint}/api/v02/characters/roster`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const data = (await resp.json()) as CharacterRosterResponsePayload;
    if (data.ok) {
      if (data.accountId) {
        this.saveAccountId(data.accountId);
      }
      this.rosterCharacters = Array.isArray(data.characters) ? data.characters : [];
      if (
        this.selectedCharacterId &&
        this.rosterCharacters.some((c) => c.characterId === this.selectedCharacterId)
      ) {
        this.setSelectedCharacterId(this.selectedCharacterId);
      } else if (
        data.lastSelectedCharacterId &&
        this.rosterCharacters.some((c) => c.characterId === data.lastSelectedCharacterId)
      ) {
        this.setSelectedCharacterId(data.lastSelectedCharacterId);
      } else if (this.rosterCharacters.length > 0) {
        this.setSelectedCharacterId(this.rosterCharacters[0]!.characterId);
      } else {
        this.setSelectedCharacterId(null);
      }
      this.callbacks.onRosterUpdated?.(data);
    }
    return data;
  }

  public async createCharacterDraftHttp(
    intent: CreateCharacterV02DraftIntentPayload
  ): Promise<CharacterV02ActionResultPayload> {
    const token = await this.ensureGuestTokenIssued();
    const payload: CreateCharacterV02DraftIntentPayload = {
      requestId: intent.requestId || this.nextRequestId("v02_draft"),
      name: intent.name,
      appearanceId: intent.appearanceId
    };
    const resp = await fetch(`${this.httpEndpoint}/api/v02/characters/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = (await resp.json()) as CharacterV02ActionResultPayload;
    this.applyV02ActionResult(data);
    return data;
  }

  public async rollInnateDestinyHttp(
    characterId: string,
    requestId?: string
  ): Promise<CharacterV02ActionResultPayload> {
    const token = await this.ensureGuestTokenIssued();
    const reqId = requestId || this.nextRequestId("v02_roll");
    const resp = await fetch(
      `${this.httpEndpoint}/api/v02/characters/${encodeURIComponent(characterId)}/reroll`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: reqId,
          characterId
        })
      }
    );
    const data = (await resp.json()) as CharacterV02ActionResultPayload;
    this.applyV02ActionResult(data);
    return data;
  }

  public async confirmInnateDestinyHttp(
    characterId: string,
    rollNonce: string,
    requestId?: string
  ): Promise<CharacterV02ActionResultPayload> {
    const token = await this.ensureGuestTokenIssued();
    const reqId = requestId || this.nextRequestId("v02_confirm");
    const resp = await fetch(
      `${this.httpEndpoint}/api/v02/characters/${encodeURIComponent(characterId)}/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: reqId,
          characterId,
          rollNonce
        })
      }
    );
    const data = (await resp.json()) as CharacterV02ActionResultPayload;
    this.applyV02ActionResult(data);
    return data;
  }

  public async selectCharacterForWorldEntryHttp(
    characterId: string,
    requestId?: string
  ): Promise<SelectCharacterForWorldEntryResultPayload> {
    const token = await this.ensureGuestTokenIssued();
    const reqId = requestId || this.nextRequestId("v02_select");
    const resp = await fetch(
      `${this.httpEndpoint}/api/v02/characters/${encodeURIComponent(characterId)}/select`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: reqId,
          characterId
        })
      }
    );
    const data = (await resp.json()) as SelectCharacterForWorldEntryResultPayload;
    if (data.ok && data.character) {
      this.selfStateV02 = data.character;
      this.saveAccountId(data.character.identity.accountId);
      this.nickname = data.character.identity.name;
      this.setSelectedCharacterId(data.character.identity.characterId);
      if (data.targetZoneId) {
        this.currentZoneId = data.targetZoneId;
      } else if (data.character.world?.zoneId) {
        this.currentZoneId = data.character.world.zoneId;
      }
      this.callbacks.onSelfStateV02?.(data.character);
    }
    return data;
  }

  public async enterWorldWithCharacter(
    characterId: string,
    targetZoneId?: ZoneId,
    spawnId?: string
  ): Promise<void> {
    const selectRes = await this.selectCharacterForWorldEntryHttp(characterId);
    if (!selectRes.ok || !selectRes.character) {
      throw new Error(
        selectRes.messageVi || "Không thể chọn nhân vật để tiến vào Bát Hoang."
      );
    }
    if (selectRes.character.identity.creationState !== "confirmed") {
      throw new Error("Nhân vật chưa ấn định Tiên Thiên Khí Vận, không thể vào thế giới.");
    }
    const resolvedZone =
      targetZoneId ??
      selectRes.targetZoneId ??
      selectRes.character.world.zoneId ??
      this.currentZoneId;
    await this.connect(resolvedZone, spawnId, characterId);
  }

  public async leaveWorldToMenu(): Promise<void> {
    if (this.room) {
      try {
        this.room.send("v02_leave_world", {
          requestId: this.nextRequestId("v02_leave"),
          characterId: this.getSelectedCharacterId() ?? undefined
        });
      } catch {
        this.room = this.room;
      }
      try {
        await this.room.leave(true);
      } catch {
        this.room = null;
      }
      this.room = null;
    }
    this.selfState = null;
    this.selfStateV02 = null;
    this.worldSnapshot = null;
    this.activeRollDraft = null;
    this.callbacks.onLeftWorldToMenu?.();
  }

  private applyV02ActionResult(result: CharacterV02ActionResultPayload): void {
    if (result.ok) {
      if (result.character) {
        this.selfStateV02 = result.character;
        this.saveAccountId(result.character.identity.accountId);
        this.nickname = result.character.identity.name;
        this.setSelectedCharacterId(result.character.identity.characterId);
      }
      if (result.rollDraft) {
        this.activeRollDraft = result.rollDraft;
      } else if (result.character?.identity.creationState === "confirmed") {
        this.activeRollDraft = null;
      }
    }
    this.callbacks.onCharacterV02ActionResult?.(result);
  }

  public async resetInvalidGuestSession(): Promise<void> {
    localStorage.removeItem(this.guestTokenStorageKey);
    localStorage.removeItem(this.legacyGuestTokenStorageKey);
    localStorage.removeItem(this.accountIdStorageKey);
    localStorage.removeItem(this.lastSelectedCharacterStorageKey);
    sessionStorage.removeItem("tm8d_v02_account");
    this.guestToken = null;
    this.selectedCharacterId = null;
    this.selfState = null;
    this.selfStateV02 = null;
    this.activeRollDraft = null;
    this.lastGuestAuthResult = null;
    this.rosterCharacters = [];
    await this.authenticateGuestHttp();
  }

  public async connect(
    zoneId?: ZoneId,
    spawnId?: string,
    characterIdOverride?: string
  ): Promise<void> {
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
      const charId =
        characterIdOverride ??
        this.selfStateV02?.identity.characterId ??
        this.selectedCharacterId ??
        undefined;
      if (charId) {
        this.setSelectedCharacterId(charId);
      }
      const joinedRoom = await this.client.joinOrCreate(targetZone, {
        zoneId: targetZone,
        guestToken: token,
        characterId: charId,
        spawnId
      });
      this.room = joinedRoom;
      this.bindRoomHandlers(joinedRoom);
      if (!this.lastGuestAuthResult) {
        joinedRoom.send("v02_auth_guest", {
          guestToken: token,
          characterId: charId
        });
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
      if (state.characterId) {
        this.setSelectedCharacterId(state.characterId);
      }
      this.callbacks.onSelfState(state);
    });

    room.onMessage("self_state_v02", (state: CharacterV02SnapshotPayload) => {
      this.selfStateV02 = state;
      this.saveAccountId(state.identity.accountId);
      this.nickname = state.identity.name;
      this.setSelectedCharacterId(state.identity.characterId);
      if (state.identity.creationState === "confirmed") {
        this.activeRollDraft = null;
      }
      this.callbacks.onSelfStateV02?.(state);
    });

    room.onMessage("v02_auth_result", (result: GuestAuthResultPayload) => {
      this.lastGuestAuthResult = result;
      if (result.ok) {
        if (result.accountId) {
          this.saveAccountId(result.accountId);
        }
        if (result.guestToken) {
          this.saveGuestToken(result.guestToken);
        }
        if (result.activeRollDraft !== undefined) {
          this.activeRollDraft = result.activeRollDraft ?? null;
        }
      }
      this.callbacks.onGuestAuthResult?.(result);
    });

    room.onMessage("v02_action_result", (result: CharacterV02ActionResultPayload) => {
      this.applyV02ActionResult(result);
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
        await this.connect(
          approval.targetZoneId,
          approval.targetSpawnId,
          this.getSelectedCharacterId() ?? undefined
        );
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
    const requestId = this.nextRequestId("v02_draft");
    if (this.room && !this.switchingZone) {
      this.room.send("v02_create_character_draft", {
        requestId,
        name,
        appearanceId
      });
      return;
    }
    void this.createCharacterDraftHttp({
      requestId,
      name,
      appearanceId
    });
  }

  public sendRollInnateDestinyV02(characterId?: string): void {
    const resolvedCharId =
      characterId ??
      this.selfStateV02?.identity.characterId ??
      this.selectedCharacterId ??
      undefined;
    const requestId = this.nextRequestId("v02_roll");
    if (this.room && !this.switchingZone) {
      this.room.send("v02_roll_innate_destiny", {
        requestId,
        characterId: resolvedCharId
      });
      return;
    }
    if (resolvedCharId) {
      void this.rollInnateDestinyHttp(resolvedCharId, requestId);
    }
  }

  public sendConfirmInnateDestinyV02(rollNonce: string, characterId?: string): void {
    const resolvedCharId =
      characterId ??
      this.selfStateV02?.identity.characterId ??
      this.selectedCharacterId ??
      undefined;
    const requestId = this.nextRequestId("v02_confirm");
    if (this.room && !this.switchingZone) {
      this.room.send("v02_confirm_innate_destiny", {
        requestId,
        rollNonce,
        characterId: resolvedCharId
      });
      return;
    }
    if (resolvedCharId) {
      void this.confirmInnateDestinyHttp(resolvedCharId, rollNonce, requestId);
    }
  }

  public sendAllocateAttributePointV02(attributeId: BaseAttributeKey): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_allocate_attribute", {
      requestId: this.nextRequestId("v02_alloc"),
      attributeId,
      characterId: this.selfStateV02?.identity.characterId ?? this.selectedCharacterId ?? undefined
    });
  }

  public sendEquipAcquiredDestinyV02(slotIndex: 0 | 1 | 2, traitId: string): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_equip_acquired_destiny", {
      requestId: this.nextRequestId("v02_equip"),
      slotIndex,
      traitId,
      characterId: this.selfStateV02?.identity.characterId ?? this.selectedCharacterId ?? undefined
    });
  }

  public sendUnequipAcquiredDestinyV02(slotIndex: 0 | 1 | 2): void {
    if (!this.room || this.switchingZone) return;
    this.room.send("v02_unequip_acquired_destiny", {
      requestId: this.nextRequestId("v02_unequip"),
      slotIndex,
      characterId: this.selfStateV02?.identity.characterId ?? this.selectedCharacterId ?? undefined
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
