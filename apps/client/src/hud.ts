import type {
  ActionResultPayload,
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  ChatMessagePayload,
  RoomWorldSnapshot
} from "@tong-mon-8d/shared";
import {
  ITEMS_REGISTRY,
  QUESTS_REGISTRY,
  RECIPES_REGISTRY,
  ZONES_REGISTRY,
  formatRealmDisplay,
  getCandidateExpToNextLevelDecimal,
  getRealmRequiredTuVi,
  isAtNonSaintMajorRealmLevelCap,
  type LegendaryNpcDefinition
} from "@tong-mon-8d/game-data";
import { renderCharacterPanelModal } from "./features/character/CharacterPanel.js";
import {
  MinimapView,
  type MinimapDynamicInput,
  type MinimapStaticTileData,
  type MinimapTelemetry
} from "./game/world/MinimapView.js";
import type { GameNetworkClient } from "./network.js";
import type { SoundController } from "./audio.js";
import type { WorldScene } from "./WorldScene.js";

export class HudOverlayController {
  private root: HTMLElement;
  private net: GameNetworkClient;
  private soundCtrl: SoundController;
  private getScene: () => WorldScene | null;

  private activeModal: "none" | "npc" | "inventory" | "cultivation" = "none";
  private selectedNpc: LegendaryNpcDefinition | null = null;
  private chatLines: Array<{ kind: "normal" | "system" | "combat"; text: string }> = [
    {
      kind: "system",
      text: "Chào mừng tới Bát Hoang! Nhấn WASD để di chuyển, [C] Nhân Vật & Khí Vận, [E] đàm đạo / qua Truyền Tống Trận, [J]/[K] xuất chiêu."
    }
  ];

  private elTopLeft!: HTMLElement;
  private elTopRight!: HTMLElement;
  private elMinimapMount!: HTMLElement;
  private elTopRightControls!: HTMLElement;
  private elBottomLeft!: HTMLElement;
  private elBottomCenter!: HTMLElement;
  private elMobileDpad!: HTMLElement;
  private elChatLog!: HTMLElement;
  private elModalHost!: HTMLElement;
  private elBannerHost!: HTMLElement;
  private minimapView!: MinimapView;

  constructor(
    root: HTMLElement,
    net: GameNetworkClient,
    soundCtrl: SoundController,
    getScene: () => WorldScene | null
  ) {
    this.root = root;
    this.net = net;
    this.soundCtrl = soundCtrl;
    this.getScene = getScene;
    this.mountBaseStructure();
    this.bindGlobalShortcuts();
  }

  private mountBaseStructure(): void {
    this.root.innerHTML = `
      <div class="hud-panel hud-top-left" id="hud-top-left"></div>
      <div class="hud-panel hud-top-right" id="hud-top-right">
        <div class="hud-minimap-mount" id="hud-minimap-mount"></div>
        <div class="hud-top-right-controls" id="hud-top-right-controls"></div>
      </div>
      <div class="hud-panel hud-bottom-left" id="hud-bottom-left">
        <div class="chat-log" id="hud-chat-log"></div>
        <div class="chat-input-row">
          <input class="chat-input" id="hud-chat-input" type="text" maxlength="120" placeholder="Truyền âm tông môn..." />
          <button class="hud-btn" id="hud-chat-send">Gửi</button>
        </div>
      </div>
      <div class="hud-panel hud-bottom-center" id="hud-bottom-center">
        <div class="skill-slot" data-action="skill_j">
          <span class="skill-key">[J] Công Kích</span>
          <span class="skill-name">Thanh Vân Trảm</span>
        </div>
        <div class="skill-slot" data-action="skill_k">
          <span class="skill-key">[K] Tuyệt Kỹ</span>
          <span class="skill-name">Kiếm Khí Ưng</span>
        </div>
        <div class="skill-slot" data-action="interact_e">
          <span class="skill-key">[E] Tương Tác</span>
          <span class="skill-name">Đàm Đạo / Cổng</span>
        </div>
        <div class="skill-slot" data-action="pickup_f">
          <span class="skill-key">[F] Nhặt</span>
          <span class="skill-name">Chiến Lợi Phẩm</span>
        </div>
        <div class="skill-slot" data-action="meditate_m">
          <span class="skill-key">[M] Bế Quan</span>
          <span class="skill-name">Thu Hoạch Tu Vi</span>
        </div>
        <div class="skill-slot" data-action="breakthrough_b">
          <span class="skill-key">[B] Đột Phá</span>
          <span class="skill-name">Phá Cảnh Giới</span>
        </div>
      </div>
      <div class="mobile-dpad" id="hud-mobile-dpad">
        <div></div>
        <button class="hud-btn" data-dir="up">▲</button>
        <div></div>
        <button class="hud-btn" data-dir="left">◀</button>
        <button class="hud-btn" data-dir="down">▼</button>
        <button class="hud-btn" data-dir="right">▶</button>
      </div>
      <div id="hud-banner-host"></div>
      <div id="hud-modal-host"></div>
    `;

    this.elTopLeft = this.root.querySelector("#hud-top-left") as HTMLElement;
    this.elTopRight = this.root.querySelector("#hud-top-right") as HTMLElement;
    this.elMinimapMount = this.root.querySelector("#hud-minimap-mount") as HTMLElement;
    this.elTopRightControls = this.root.querySelector("#hud-top-right-controls") as HTMLElement;
    this.elBottomLeft = this.root.querySelector("#hud-bottom-left") as HTMLElement;
    this.elBottomCenter = this.root.querySelector("#hud-bottom-center") as HTMLElement;
    this.elMobileDpad = this.root.querySelector("#hud-mobile-dpad") as HTMLElement;
    this.elChatLog = this.root.querySelector("#hud-chat-log") as HTMLElement;
    this.elModalHost = this.root.querySelector("#hud-modal-host") as HTMLElement;
    this.elBannerHost = this.root.querySelector("#hud-banner-host") as HTMLElement;
    this.minimapView = new MinimapView(this.elMinimapMount);

    const chatInput = this.root.querySelector("#hud-chat-input") as HTMLInputElement;
    const chatSend = this.root.querySelector("#hud-chat-send") as HTMLButtonElement;
    const submitChat = () => {
      const txt = chatInput.value.trim();
      if (txt) {
        this.net.sendChat(txt);
        chatInput.value = "";
      }
      chatInput.blur();
    };
    chatSend.addEventListener("click", submitChat);
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitChat();
      }
    });

    this.root.querySelectorAll(".skill-slot").forEach((slot) => {
      slot.addEventListener("click", () => {
        const act = (slot as HTMLElement).dataset.action;
        const scene = this.getScene();
        if (act === "skill_j") scene?.triggerSkill("basic_slash");
        else if (act === "skill_k") scene?.triggerSkill("kiem_khi_ung");
        else if (act === "interact_e") scene?.triggerContextualInteract();
        else if (act === "pickup_f") scene?.triggerPickupNearestDrop();
        else if (act === "meditate_m") this.net.sendClaimMeditation();
        else if (act === "breakthrough_b") this.net.sendBreakthrough();
      });
    });

    const dpad = this.root.querySelector("#hud-mobile-dpad");
    dpad?.querySelectorAll("button[data-dir]").forEach((btn) => {
      const dir = (btn as HTMLElement).dataset.dir;
      const startMove = () => {
        const sc = this.getScene();
        if (!sc) return;
        if (dir === "up") sc.setTouchVector(0, -1);
        else if (dir === "down") sc.setTouchVector(0, 1);
        else if (dir === "left") sc.setTouchVector(-1, 0);
        else if (dir === "right") sc.setTouchVector(1, 0);
      };
      const stopMove = () => this.getScene()?.setTouchVector(0, 0);
      btn.addEventListener("pointerdown", startMove);
      btn.addEventListener("pointerup", stopMove);
      btn.addEventListener("pointerleave", stopMove);
    });

    this.renderChatLog();
    this.refreshPanels();
  }

  private bindGlobalShortcuts(): void {
    window.addEventListener("keydown", (e) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return;
      }
      if (
        this.net.isV02Mode() &&
        this.net.selfStateV02?.identity.creationState !== "confirmed"
      ) {
        return;
      }
      if (e.key === "Escape" && this.activeModal !== "none") {
        this.closeModal();
      } else if (e.key === "i" || e.key === "I") {
        this.toggleModal("inventory");
      } else if (e.key === "c" || e.key === "C") {
        this.toggleModal("cultivation");
      } else if (e.key === "m" || e.key === "M") {
        this.net.sendClaimMeditation();
      } else if (e.key === "b" || e.key === "B") {
        this.net.sendBreakthrough();
      }
    });
  }

  public openNpcDialogue(npc: LegendaryNpcDefinition): void {
    this.selectedNpc = npc;
    this.activeModal = "npc";
    this.renderModal();
  }

  public toggleModal(kind: "inventory" | "cultivation"): void {
    if (this.activeModal === kind) {
      this.closeModal();
    } else {
      this.activeModal = kind;
      this.renderModal();
    }
  }

  public closeModal(): void {
    this.activeModal = "none";
    this.selectedNpc = null;
    this.elModalHost.innerHTML = "";
  }

  public onActionResult(res: ActionResultPayload): void {
    this.appendLog(res.ok ? "system" : "combat", res.messageVi);
    if (res.ceremony === "phi_de_blessing") {
      this.getScene()?.playCeremonyEffect();
      this.showCeremonyBanner(
        "✦ THỰC ĐẠO KIM QUANG CHÚC PHÚC • PHÌ ĐẾ BAN CƠ DUYÊN (+35% Tốc Độ Tu Luyện) ✦"
      );
    } else if (res.ceremony === "breakthrough_success") {
      this.getScene()?.playCeremonyEffect();
      this.showCeremonyBanner(`✦ ĐỘT PHÁ THÀNH CÔNG! ${res.messageVi} ✦`);
    }
    this.refreshPanels();
    if (this.activeModal !== "none") {
      this.renderModal();
    }
  }

  public onCharacterV02ActionResult(res: CharacterV02ActionResultPayload): void {
    this.appendLog(res.ok ? "system" : "combat", res.messageVi);
    this.refreshPanels();
    if (this.activeModal !== "none") {
      this.renderModal();
    }
  }

  public onChatMessage(msg: ChatMessagePayload): void {
    this.appendLog("normal", `[${msg.senderName}]: ${msg.text}`);
  }

  public appendLog(kind: "normal" | "system" | "combat", text: string): void {
    this.chatLines.push({ kind, text });
    if (this.chatLines.length > 30) {
      this.chatLines.shift();
    }
    this.renderChatLog();
  }

  private showCeremonyBanner(text: string): void {
    this.elBannerHost.innerHTML = `<div class="ceremony-banner" id="ceremony-banner">${text}</div>`;
    setTimeout(() => {
      if (this.elBannerHost) {
        this.elBannerHost.innerHTML = "";
      }
    }, 4500);
  }

  private renderChatLog(): void {
    if (!this.elChatLog) return;
    this.elChatLog.innerHTML = this.chatLines
      .map((l) => `<div class="chat-line ${l.kind}">${this.escapeHtml(l.text)}</div>`)
      .join("");
    this.elChatLog.scrollTop = this.elChatLog.scrollHeight;
  }

  public refreshPanels(
    _self?: CharacterSaveState,
    _snap?: RoomWorldSnapshot,
    _selfV02?: CharacterV02SnapshotPayload
  ): void {
    const inCreation =
      this.net.isV02Mode() &&
      this.net.selfStateV02?.identity.creationState !== "confirmed";
    const hudDisplay = inCreation ? "none" : "";
    this.elTopLeft.style.display = hudDisplay;
    this.elTopRight.style.display = hudDisplay;
    this.elBottomLeft.style.display = hudDisplay;
    this.elBottomCenter.style.display = hudDisplay;
    if (inCreation) {
      this.elMobileDpad.style.display = "none";
      this.closeModal();
      return;
    } else {
      this.elMobileDpad.style.display = "";
    }

    const p = this.net.selfState;
    const v02 = this.net.selfStateV02;
    const snap = this.net.worldSnapshot;
    const realmId = v02?.cultivation.realmId ?? p?.realmId ?? "pham_nhan";
    const realmStage = v02?.cultivation.realmStage ?? p?.realmStage ?? 1;
    const reqTuVi = getRealmRequiredTuVi(realmId, realmStage);
    const curHp = p?.hp ?? v02?.resources.currentHp ?? 0;
    const maxHp = p?.maxHp ?? v02?.derivedStats.maxHp ?? 1;
    const curMp = p?.mp ?? v02?.resources.currentMp ?? 0;
    const maxMp = p?.maxMp ?? v02?.derivedStats.maxMp ?? 1;
    const curTuVi = p?.tuVi ?? Number(v02?.cultivation.tuVi ?? 0);

    const hpPct = Math.min(100, Math.round((curHp / Math.max(1, maxHp)) * 100));
    const mpPct = Math.min(100, Math.round((curMp / Math.max(1, maxMp)) * 100));
    const tuViPct = Math.min(100, Math.round((curTuVi / Math.max(1, reqTuVi)) * 100));

    const level = v02?.levelProgress.level ?? p?.level ?? 1;
    const expNowStr = v02?.levelProgress.expTowardNext ?? "0";
    const expNextStr = getCandidateExpToNextLevelDecimal(level) ?? "100";
    const atLevelCap = isAtNonSaintMajorRealmLevelCap(realmId, level);
    const expPct = atLevelCap
      ? 100
      : Math.min(
          100,
          Math.round((Number(expNowStr) / Math.max(1, Number(expNextStr))) * 100)
        );
    const freePts = v02?.levelProgress.freeAttributePoints ?? 0;

    const playerName = v02?.identity.name ?? p?.nickname ?? "Đang kết nối...";
    const realmBadge = formatRealmDisplay(realmId, realmStage);
    const buffsHtml = (p?.buffs ?? [])
      .map((b) => `<span class="buff-pill">${this.escapeHtml(b.name)}</span>`)
      .join("");
    const freePtsHtml =
      freePts > 0
        ? `<span class="buff-pill" id="hud-free-points-pill">+${freePts} Điểm Thuộc Tính [C]</span>`
        : "";

    this.elTopLeft.innerHTML = `
      <div class="hud-player-header">
        <span class="hud-player-name" id="hud-player-name">${this.escapeHtml(playerName)}</span>
        <span class="hud-realm-badge" id="hud-realm-badge">Cấp ${level} • ${this.escapeHtml(realmBadge)}</span>
      </div>
      <div class="hud-title-row">
        <span>${this.escapeHtml(p?.equippedTitle ?? v02?.world.equippedTitle ?? "Tân Nhập Môn Đệ Tử")}</span>
        <span class="hud-currency" id="hud-linh-thach">💎 ${p?.linhThach ?? v02?.world.linhThach ?? 0} Linh Thạch</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">Khí Huyết</span>
        <div class="bar-track">
          <div class="bar-fill hp" style="width:${hpPct}%"></div>
          <div class="bar-text" id="hud-hp-text">${curHp} / ${maxHp}</div>
        </div>
      </div>
      <div class="bar-row">
        <span class="bar-label">Linh Lực</span>
        <div class="bar-track">
          <div class="bar-fill mp" style="width:${mpPct}%"></div>
          <div class="bar-text" id="hud-mp-text">${curMp} / ${maxMp}</div>
        </div>
      </div>
      <div class="bar-row">
        <span class="bar-label">Tu Vi</span>
        <div class="bar-track">
          <div class="bar-fill tuvi" style="width:${tuViPct}%"></div>
          <div class="bar-text" id="hud-tuvi-text">${curTuVi} / ${reqTuVi}</div>
        </div>
      </div>
      <div class="bar-row">
        <span class="bar-label">Kinh Nghiệm</span>
        <div class="bar-track">
          <div class="bar-fill exp" style="width:${expPct}%"></div>
          <div class="bar-text" id="hud-exp-text">${atLevelCap ? "Đỉnh Phong Cảnh Giới" : `${expNowStr} / ${expNextStr}`}</div>
        </div>
      </div>
      ${buffsHtml || freePtsHtml ? `<div class="hud-buffs-row" id="hud-buffs-row">${freePtsHtml}${buffsHtml}</div>` : ""}
    `;

    const zoneId = this.net.getCurrentZoneId();
    const zoneDef = ZONES_REGISTRY[zoneId];
    const onlineCount = Object.keys(snap?.players ?? {}).length || 1;

    this.elTopRightControls.innerHTML = `
      <div class="zone-title" id="hud-zone-title">${this.escapeHtml(zoneDef.nameVi)}</div>
      <div class="zone-meta" id="hud-zone-meta">Đạo hữu tại khu vực: ${onlineCount} • (${Math.round(p?.x ?? v02?.world.x ?? 0)}, ${Math.round(p?.y ?? v02?.world.y ?? 0)})</div>
      <div class="hud-btn-group">
        <button class="hud-btn" id="btn-open-inventory">Hành Trang & Ẩm Thực [I]</button>
        <button class="hud-btn gold" id="btn-open-cultivation">Nhân Vật & Khí Vận [C]</button>
        <button class="hud-btn" id="btn-toggle-mute">${this.soundCtrl.isMuted() ? "🔇 Tắt Tiếng" : "🔊 Âm Thanh"}</button>
      </div>
    `;

    this.elTopRightControls.querySelector("#btn-open-inventory")?.addEventListener("click", () => {
      this.toggleModal("inventory");
    });
    this.elTopRightControls.querySelector("#btn-open-cultivation")?.addEventListener("click", () => {
      this.toggleModal("cultivation");
    });
    this.elTopRightControls.querySelector("#btn-toggle-mute")?.addEventListener("click", () => {
      this.soundCtrl.toggleMute();
      this.refreshPanels();
    });

    const scene = this.getScene();
    const camTelemetry = scene?.getCameraTelemetry() ?? null;
    const myCharId = p?.characterId ?? v02?.identity.characterId ?? "";
    const remotes = Object.values(snap?.players ?? {}).filter((rp) => rp.characterId !== myCharId);
    this.minimapView.updateDynamic({
      zoneId,
      playerX: p?.x ?? v02?.world.x ?? zoneDef.defaultSpawn.x,
      playerY: p?.y ?? v02?.world.y ?? zoneDef.defaultSpawn.y,
      playerDirection: p?.direction ?? v02?.world.direction ?? "down",
      cameraTelemetry: camTelemetry,
      remotePlayers: remotes
    });

    if (this.activeModal !== "none") {
      this.renderModal();
    }
  }

  public setMinimapStaticTileData(data: MinimapStaticTileData): void {
    this.minimapView.setStaticTileData(data);
  }

  public updateMinimapDynamic(input: MinimapDynamicInput): void {
    this.minimapView.updateDynamic(input);
  }

  public toggleMinimapSize(forceState?: boolean): boolean {
    return this.minimapView.toggleExpanded(forceState);
  }

  public getMinimapTelemetry(): MinimapTelemetry {
    return this.minimapView.getTelemetry();
  }

  private renderModal(): void {
    if (this.activeModal === "none") {
      this.elModalHost.innerHTML = "";
      return;
    }

    if (this.activeModal === "npc" && this.selectedNpc) {
      this.renderNpcModal(this.selectedNpc);
      return;
    }

    if (this.activeModal === "inventory") {
      this.renderInventoryAndCulinaryModal();
      return;
    }

    if (this.activeModal === "cultivation") {
      this.renderCultivationModal();
    }
  }

  private renderNpcModal(npc: LegendaryNpcDefinition): void {
    const p = this.net.selfState;
    const phiQuest = QUESTS_REGISTRY.phi_de_ch1_huong_thom;
    const qState = p?.quests[phiQuest.id]?.status ?? "not_started";

    let actionsHtml = "";
    if (npc.id === "phi_de") {
      const eligibleOwned = phiQuest.eligibleItemIds.filter((id) =>
        (p?.inventory ?? []).some((st) => st.itemId === id && st.quantity > 0)
      );
      actionsHtml = `
        <div class="item-card">
          <div class="item-card-title">${this.escapeHtml(phiQuest.titleVi)} (${qState === "completed" ? "Đã Hoàn Thành" : qState === "active" ? "Đang Thực Hiện" : "Chưa Nhận"})</div>
          <div class="item-card-desc">${this.escapeHtml(phiQuest.summaryVi)}</div>
          <div class="hud-btn-group" style="justify-content:flex-start; margin-top:6px;">
            ${
              qState === "not_started"
                ? `<button class="hud-btn primary" id="btn-quest-accept">Nhận Cơ Duyên Vạn Vị Thành Đạo</button>`
                : ""
            }
            ${
              qState !== "completed"
                ? eligibleOwned
                    .map(
                      (itemId) =>
                        `<button class="hud-btn gold btn-quest-submit" data-item="${itemId}">Dâng ${this.escapeHtml(ITEMS_REGISTRY[itemId].nameVi)}</button>`
                    )
                    .join("") || `<button class="hud-btn" id="btn-quest-submit-any">Dâng Món Ăn Lên Phì Đế</button>`
                : `<span class="buff-pill">✦ Đã nhận Thực Đạo Kim Quang Chúc Phúc</span>`
            }
          </div>
        </div>
      `;
    } else if (npc.id === "merchant_truong") {
      const shopItems = Object.values(ITEMS_REGISTRY).filter((i) => i.buyPriceLinhThach !== null);
      actionsHtml = `
        <div class="modal-title" style="font-size:13px;">Quán Mì Linh Thiện — Mua Món Ăn Hoặc Nguyên Liệu</div>
        <div class="grid-cards">
          ${shopItems
            .map(
              (item) => `
            <div class="item-card">
              <div>
                <div class="item-card-title">${this.escapeHtml(item.nameVi)}</div>
                <div class="item-card-desc">${this.escapeHtml(item.descriptionVi)}</div>
              </div>
              <button class="hud-btn gold btn-shop-buy" data-item="${item.id}">
                Mua (${item.buyPriceLinhThach} Linh Thạch)
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    this.elModalHost.innerHTML = `
      <div class="hud-modal-backdrop" id="modal-backdrop">
        <div class="hud-modal" id="npc-dialogue-modal">
          <div class="modal-header">
            <span class="modal-title">${this.escapeHtml(npc.nameVi)} — ${this.escapeHtml(npc.titleVi)}</span>
            <button class="hud-btn" id="btn-close-modal">Đóng [ESC]</button>
          </div>
          <div class="npc-dialogue-layout">
            <div class="npc-portrait-box">
              <img src="/assets/portraits/${npc.portraitKey}.png" alt="${this.escapeHtml(npc.nameVi)}" />
            </div>
            <div class="npc-dialogue-body">
              <div class="npc-meta-line">Cảnh Giới: 【${this.escapeHtml(npc.realmDisplayVi)}】 • Đại Đạo: ${this.escapeHtml(npc.daoNameVi)}</div>
              ${npc.greetingLinesVi
                .map((line) => `<div class="npc-speech-box">“${this.escapeHtml(line)}”</div>`)
                .join("")}
            </div>
          </div>
          ${actionsHtml}
        </div>
      </div>
    `;

    this.bindModalClose();
    this.elModalHost.querySelector("#btn-quest-accept")?.addEventListener("click", () => {
      this.net.sendQuestAction("phi_de", phiQuest.id, "accept");
    });
    this.elModalHost.querySelector("#btn-quest-submit-any")?.addEventListener("click", () => {
      this.net.sendQuestAction("phi_de", phiQuest.id, "submit");
    });
    this.elModalHost.querySelectorAll(".btn-quest-submit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = (btn as HTMLElement).dataset.item;
        this.net.sendQuestAction("phi_de", phiQuest.id, "submit", itemId);
      });
    });
    this.elModalHost.querySelectorAll(".btn-shop-buy").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = (btn as HTMLElement).dataset.item;
        if (itemId) {
          this.soundCtrl.playCoin();
          this.net.sendShopBuy(itemId, 1);
        }
      });
    });
  }

  private renderInventoryAndCulinaryModal(): void {
    const p = this.net.selfState;
    const inv = p?.inventory ?? [];
    const shopItems = Object.values(ITEMS_REGISTRY).filter((i) => i.buyPriceLinhThach !== null);
    const recipes = Object.values(RECIPES_REGISTRY);

    this.elModalHost.innerHTML = `
      <div class="hud-modal-backdrop" id="modal-backdrop">
        <div class="hud-modal" id="inventory-modal">
          <div class="modal-header">
            <span class="modal-title">Hành Trang • Quán Mì Lão Trù Trương • Thần Đỉnh Nấu Nướng</span>
            <button class="hud-btn" id="btn-close-modal">Đóng [ESC]</button>
          </div>
          <div class="modal-title" style="font-size:13px;">Túi Trữ Vật (${inv.length} ô • 💎 ${p?.linhThach ?? 0} Linh Thạch)</div>
          <div class="grid-cards">
            ${
              inv.length === 0
                ? `<div class="item-card"><div class="item-card-desc">Hành trang trống.</div></div>`
                : inv
                    .map((st) => {
                      const def = ITEMS_REGISTRY[st.itemId];
                      const canUse =
                        def &&
                        (def.category === "food" ||
                          def.category === "beverage" ||
                          def.category === "pill");
                      return `
                        <div class="item-card" data-inv-item="${st.itemId}">
                          <div>
                            <div class="item-card-title">${this.escapeHtml(def?.nameVi ?? st.itemId)} x${st.quantity}</div>
                            <div class="item-card-desc">${this.escapeHtml(def?.descriptionVi ?? "")}</div>
                          </div>
                          ${
                            canUse
                              ? `<button class="hud-btn primary btn-use-item" data-item="${st.itemId}">Thưởng Thức / Dùng</button>`
                              : ""
                          }
                        </div>
                      `;
                    })
                    .join("")
            }
          </div>
          <div class="modal-title" style="font-size:13px;">Thần Đỉnh Tự Nấu (Ẩm Thực Đại Đạo)</div>
          <div class="grid-cards">
            ${recipes
              .map((r) => {
                const ingText = r.ingredients
                  .map((ing) => `${ing.quantity}x ${ITEMS_REGISTRY[ing.itemId]?.nameVi ?? ing.itemId}`)
                  .join(" + ");
                return `
                  <div class="item-card">
                    <div>
                      <div class="item-card-title">${this.escapeHtml(r.nameVi)}</div>
                      <div class="item-card-desc">Nguyên liệu: ${this.escapeHtml(ingText)} • Thưởng +${r.tuViReward} Tu Vi</div>
                    </div>
                    <button class="hud-btn gold btn-cook-recipe" data-recipe="${r.id}">Khởi Lửa Chế Biến</button>
                  </div>
                `;
              })
              .join("")}
          </div>
          <div class="modal-title" style="font-size:13px;">Quán Mì Lão Trù Trương (Mua Trực Tiếp Tại Tân Thủ Thôn)</div>
          <div class="grid-cards">
            ${shopItems
              .map(
                (item) => `
              <div class="item-card">
                <div>
                  <div class="item-card-title">${this.escapeHtml(item.nameVi)}</div>
                  <div class="item-card-desc">Giá: ${item.buyPriceLinhThach} Linh Thạch</div>
                </div>
                <button class="hud-btn btn-shop-buy" data-item="${item.id}">Mua Ngay</button>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    this.bindModalClose();
    this.elModalHost.querySelectorAll(".btn-use-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = (btn as HTMLElement).dataset.item;
        if (itemId) this.net.sendUseItem(itemId);
      });
    });
    this.elModalHost.querySelectorAll(".btn-cook-recipe").forEach((btn) => {
      btn.addEventListener("click", () => {
        const recipeId = (btn as HTMLElement).dataset.recipe;
        if (recipeId) this.net.sendCookRecipe(recipeId);
      });
    });
    this.elModalHost.querySelectorAll(".btn-shop-buy").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = (btn as HTMLElement).dataset.item;
        if (itemId) {
          this.soundCtrl.playCoin();
          this.net.sendShopBuy(itemId, 1);
        }
      });
    });
  }

  private renderCultivationModal(): void {
    renderCharacterPanelModal({
      modalHost: this.elModalHost,
      net: this.net,
      onCloseModal: () => this.closeModal()
    });
  }

  private bindModalClose(): void {
    this.elModalHost.querySelector("#btn-close-modal")?.addEventListener("click", () => {
      this.closeModal();
    });
    this.elModalHost.querySelector("#modal-backdrop")?.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id === "modal-backdrop") {
        this.closeModal();
      }
    });
  }

  private escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
