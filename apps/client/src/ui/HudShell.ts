import type {
  ActionResultPayload,
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  ChatMessagePayload,
  EntryFlowState,
  RoomWorldSnapshot
} from "@tong-mon-8d/shared";
import {
  LEGENDARY_NPCS,
  QUESTS_REGISTRY,
  ZONES_REGISTRY,
  formatRealmDisplay,
  getCandidateExpToNextLevelDecimal,
  getRealmRequiredTuVi,
  isAtNonSaintMajorRealmLevelCap,
  type LegendaryNpcDefinition
} from "@tong-mon-8d/game-data";
import { renderCharacterPanelModal } from "../features/character/CharacterPanel.js";
import {
  V01B_UI_CHROME_URLS,
  resolveAttributeIconUrl,
  resolveItemIconUrl,
  resolveStarterPortraitUrl
} from "../game/assets/RuntimeAssetBindings.js";
import {
  MinimapView,
  type MinimapDynamicInput,
  type MinimapStaticTileData,
  type MinimapTelemetry
} from "../game/world/MinimapView.js";
import type { GameNetworkClient } from "../network/GameNetworkClient.js";
import type { SoundController } from "../audio.js";
import type { HudWorldMinimapPort, WorldSceneHudPort } from "./ports.js";
import {
  renderEscSystemMenuModalHtml,
  renderInventoryModalHtml,
  renderNpcDialogueModalHtml,
  type InventoryCategoryTab
} from "./presentation/InventoryAndShopModalView.js";

export interface HudExitHandlers {
  getEntryFlowState?: () => EntryFlowState;
  onSwitchCharacterToRoster?: () => Promise<void>;
  onReturnToTitle?: () => Promise<void>;
}

export class HudOverlayController implements HudWorldMinimapPort {
  private root: HTMLElement;
  private net: GameNetworkClient;
  private soundCtrl: SoundController;
  private getScene: () => WorldSceneHudPort | null;
  private exitHandlers: HudExitHandlers;

  private activeModal: "none" | "npc" | "inventory" | "cultivation" | "esc_menu" = "none";
  private inventoryTab: InventoryCategoryTab = "all";
  private selectedInventoryItemId: string | null = null;
  private equippedWeaponId: string | null | undefined = undefined;
  private selectedNpc: LegendaryNpcDefinition | null = null;
  private escSettingsOpen = false;
  private autoFarmOnlineEnabled = false;
  private questTrackerCollapsed = false;

  private chatLines: Array<{ kind: "normal" | "system" | "combat"; text: string }> = [
    {
      kind: "system",
      text: "Chào mừng tới Thiên Mệnh Tiên Cung! Nhấn WASD di chuyển, [C] Nội Thị Đồ, [I] Túi Càn Khôn, [E] Đàm Đạo, [ESC] Hệ Thống."
    }
  ];

  private elTopLeftBuffs!: HTMLElement;
  private elTopCenterBar!: HTMLElement;
  private elTopLeft!: HTMLElement;
  private elTopRight!: HTMLElement;
  private elMinimapMount!: HTMLElement;
  private elTopRightControls!: HTMLElement;
  private elRightQuestScroll!: HTMLElement;
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
    getScene: () => WorldSceneHudPort | null,
    exitHandlers: HudExitHandlers = {}
  ) {
    this.root = root;
    this.net = net;
    this.soundCtrl = soundCtrl;
    this.getScene = getScene;
    this.exitHandlers = exitHandlers;
    this.mountBaseStructure();
    this.bindGlobalShortcuts();
  }

  public isBlockingOverlayOpen(): boolean {
    if (!this.isInWorldState()) {
      return true;
    }
    return this.activeModal !== "none";
  }

  private isInWorldState(): boolean {
    if (!this.net.isV02Mode()) {
      return true;
    }
    if (this.exitHandlers.getEntryFlowState) {
      return this.exitHandlers.getEntryFlowState() === "IN_WORLD";
    }
    return (
      this.net.selfStateV02?.identity.creationState === "confirmed" &&
      Boolean(this.net.selfState)
    );
  }

  private mountBaseStructure(): void {
    const iconSkill1 = resolveItemIconUrl("thanh_van_kiem_so_cap", 64);
    const iconSkill2 = resolveAttributeIconUrl("than_phap", 64);
    const iconSkill3 = resolveAttributeIconUrl("the_phach", 64);
    const iconInteract = resolveAttributeIconUrl("than_thuc", 64);

    this.root.innerHTML = `
      <div class="hud-top-left-buffs" id="hud-top-left-buffs"></div>
      <div class="hud-top-center-bar" id="hud-top-center-bar"></div>
      <div class="hud-panel hud-top-left" id="hud-top-left"></div>
      <div class="hud-panel hud-top-right" id="hud-top-right">
        <div class="hud-minimap-mount" id="hud-minimap-mount"></div>
        <div class="hud-top-right-controls" id="hud-top-right-controls"></div>
      </div>
      <div class="hud-panel hud-right-quest-scroll" id="hud-right-quest-scroll"></div>
      <div class="hud-panel hud-bottom-left" id="hud-bottom-left">
        <div class="chat-log" id="hud-chat-log"></div>
        <div class="chat-input-row">
          <input class="chat-input" id="hud-chat-input" type="text" maxlength="120" placeholder="Truyền âm tông môn..." />
          <button class="hud-btn v01b-btn-jade" id="hud-chat-send">Gửi</button>
        </div>
      </div>
      <div class="hud-panel hud-bottom-center" id="hud-bottom-center">
        <div class="hud-poe2-upper-utility-row">
          <div class="hud-poe2-micro-btns">
            <button
              type="button"
              class="skill-slot hud-micro-slot"
              id="btn-open-cultivation"
              data-action="panel_c"
              data-testid="hud-quick-c-btn"
              title="Thiên Cung Nội Thị Đồ [C]"
            >
              <span class="hud-micro-glyph">C</span>
              <span class="hud-micro-key">[C]</span>
            </button>
            <button
              type="button"
              class="skill-slot hud-micro-slot"
              id="btn-open-inventory"
              data-action="panel_i"
              data-testid="hud-quick-i-btn"
              title="Túi Càn Khôn [I]"
            >
              <span class="hud-micro-glyph">I</span>
              <span class="hud-micro-key">[I]</span>
            </button>
            <button
              type="button"
              class="skill-slot hud-micro-slot"
              data-action="panel_q"
              data-testid="hud-quick-q-btn"
              title="Tự Hành Dẫn Đường [Q]"
            >
              <span class="hud-micro-glyph">Q</span>
              <span class="hud-micro-key">[Q]</span>
            </button>
            <button
              type="button"
              class="skill-slot hud-micro-slot"
              id="btn-open-esc-menu"
              data-action="panel_esc"
              data-testid="hud-system-menu-btn"
              title="Thiên Mệnh Hệ Thống [ESC]"
            >
              <span class="hud-micro-glyph">☰</span>
              <span class="hud-micro-key">[ESC]</span>
            </button>
            <button
              type="button"
              class="hud-micro-slot"
              id="btn-toggle-mute"
              title="Bật / Tắt Âm Thanh"
            >
              <span class="hud-micro-glyph" id="hud-mute-glyph">🔊</span>
              <span class="hud-micro-key">Âm</span>
            </button>
          </div>
          <div class="hud-poe2-currency-plaque" id="hud-linh-thach">
            <img class="hud-inline-icon" src="${V01B_UI_CHROME_URLS.currencyLinhThach32}" alt="" />
            <span class="hud-currency-val">0</span>
            <span class="hud-currency-unit">Linh Thạch</span>
          </div>
        </div>
        <div class="hud-lotus-dock-row hud-poe2-skill-row">
          <div class="skill-slot hud-poe2-skill-box" data-action="skill_j" data-testid="hud-skill-slot-1" title="[1 / J] Kiếm Quyết: Thanh Vân Trảm">
            <div class="hud-skill-icon-well skill-well-cyan">
              <img class="hud-skill-art" src="${iconSkill1}" alt="Thanh Vân Trảm" />
            </div>
            <span class="skill-key">[1 / J]</span>
            <span class="skill-name">Thanh Vân Trảm</span>
          </div>
          <div class="skill-slot hud-poe2-skill-box" data-action="skill_k" data-testid="hud-skill-slot-2" title="[2 / K] Đao Phong: Kiếm Khí Ưng">
            <div class="hud-skill-icon-well skill-well-jade">
              <img class="hud-skill-art" src="${iconSkill2}" alt="Kiếm Khí Ưng" />
            </div>
            <span class="skill-key">[2 / K]</span>
            <span class="skill-name">Kiếm Khí Ưng</span>
          </div>
          <div class="skill-slot hud-poe2-skill-box" data-action="skill_l" data-testid="hud-skill-slot-3" title="[3 / L] Chưởng Ấn: Hộ Thể Kim Quang">
            <div class="hud-skill-icon-well skill-well-gold">
              <img class="hud-skill-art" src="${iconSkill3}" alt="Hộ Thể Kim Quang" />
            </div>
            <span class="skill-key">[3 / L]</span>
            <span class="skill-name">Hộ Thể Kim Quang</span>
          </div>
          <div class="skill-slot hud-poe2-skill-box" data-action="interact_e" data-testid="hud-interact-slot" title="[E / F] Tương Tác & Nhặt Vật Phẩm">
            <div class="hud-skill-icon-well skill-well-spirit">
              <img class="hud-skill-art" src="${iconInteract}" alt="Tương Tác" />
            </div>
            <span class="skill-key">[E / F]</span>
            <span class="skill-name">Tương Tác</span>
          </div>
          <button
            type="button"
            class="hud-autofarm-seal hud-poe2-skill-box"
            id="btn-hud-autofarm"
            data-testid="hud-autofarm-toggle-btn"
            title="Tự Động Chiến Đấu (Online)"
          >
            <div class="hud-skill-icon-well skill-well-lotus">
              <img class="hud-skill-art" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="Auto-Farm" />
            </div>
            <span class="skill-key" id="hud-autofarm-label">Auto-Farm</span>
            <span class="skill-name" id="hud-autofarm-sub">Online</span>
          </button>
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

    this.elTopLeftBuffs = this.root.querySelector("#hud-top-left-buffs") as HTMLElement;
    this.elTopCenterBar = this.root.querySelector("#hud-top-center-bar") as HTMLElement;
    this.elTopLeft = this.root.querySelector("#hud-top-left") as HTMLElement;
    this.elTopRight = this.root.querySelector("#hud-top-right") as HTMLElement;
    this.elMinimapMount = this.root.querySelector("#hud-minimap-mount") as HTMLElement;
    this.elTopRightControls = this.root.querySelector("#hud-top-right-controls") as HTMLElement;
    this.elRightQuestScroll = this.root.querySelector("#hud-right-quest-scroll") as HTMLElement;
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

    this.root.querySelector("#btn-hud-autofarm")?.addEventListener("click", () => {
      this.autoFarmOnlineEnabled = !this.autoFarmOnlineEnabled;
      const btn = this.root.querySelector("#btn-hud-autofarm");
      const lbl = this.root.querySelector("#hud-autofarm-label");
      const sub = this.root.querySelector("#hud-autofarm-sub");
      btn?.classList.toggle("active", this.autoFarmOnlineEnabled);
      if (lbl) {
        lbl.textContent = this.autoFarmOnlineEnabled ? "Auto: BẬT" : "Auto-Farm";
      }
      if (sub) {
        sub.textContent = this.autoFarmOnlineEnabled ? "Đang Đánh" : "Online";
      }
      if (this.autoFarmOnlineEnabled) {
        this.getScene()?.triggerSkill("basic_slash");
      }
    });

    this.root.querySelector("#btn-toggle-mute")?.addEventListener("click", () => {
      this.soundCtrl.toggleMute();
      this.refreshPanels();
    });

    this.root.querySelectorAll(".skill-slot").forEach((slot) => {
      slot.addEventListener("click", () => {
        const act = (slot as HTMLElement).dataset.action;
        const scene = this.getScene();
        if (act === "skill_j") scene?.triggerSkill("basic_slash");
        else if (act === "skill_k") scene?.triggerSkill("kiem_khi_ung");
        else if (act === "skill_l") scene?.triggerSkill("ho_the_kim_quang");
        else if (act === "interact_e") {
          scene?.triggerPickupNearestDrop();
          scene?.triggerContextualInteract();
        } else if (act === "pickup_f") scene?.triggerPickupNearestDrop();
        else if (act === "meditate_m") this.net.sendClaimMeditation();
        else if (act === "breakthrough_b") this.net.sendBreakthrough();
        else if (act === "panel_c") this.toggleModal("cultivation");
        else if (act === "panel_i") this.toggleModal("inventory");
        else if (act === "panel_q") this.triggerQuestAutoNavigate();
        else if (act === "panel_esc") this.toggleModal("esc_menu");
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
      if (!this.isInWorldState()) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (this.activeModal !== "none") {
          this.closeModal();
        } else {
          this.toggleModal("esc_menu");
        }
        return;
      }
      if (e.key === "i" || e.key === "I") {
        this.toggleModal("inventory");
      } else if (e.key === "c" || e.key === "C") {
        this.toggleModal("cultivation");
      } else if (e.key === "q" || e.key === "Q") {
        this.triggerQuestAutoNavigate();
      } else if (e.key === "m" || e.key === "M") {
        this.net.sendClaimMeditation();
      } else if (e.key === "b" || e.key === "B") {
        this.net.sendBreakthrough();
      }
    });
  }

  private triggerQuestAutoNavigate(): void {
    if (!this.isInWorldState()) return;
    const p = this.net.selfState;
    const phiQuest = QUESTS_REGISTRY.phi_de_ch1_huong_thom;
    const qStatus = p?.quests[phiQuest.id]?.status ?? "not_started";
    const hasEligibleDish = phiQuest.eligibleItemIds.some((id) =>
      (p?.inventory ?? []).some((st) => st.itemId === id && st.quantity > 0)
    );
    const targetNpcId =
      qStatus === "active" && !hasEligibleDish ? "merchant_truong" : "phi_de";
    const targetNpc = LEGENDARY_NPCS.find((n) => n.id === targetNpcId);
    if (targetNpc) {
      this.appendLog(
        "system",
        `[Tự Hành Dẫn Đường] Đang di chuyển tới ${targetNpc.nameVi} (${targetNpc.spawnX}, ${targetNpc.spawnY}) — sẽ dừng lại để đạo hữu tự tương tác [E].`
      );
      this.getScene()?.navigateToWorldPoint(targetNpc.spawnX, targetNpc.spawnY + 56);
    }
  }

  public openNpcDialogue(npc: LegendaryNpcDefinition): void {
    this.selectedNpc = npc;
    this.activeModal = "npc";
    this.renderModal();
  }

  public toggleModal(kind: "inventory" | "cultivation" | "esc_menu"): void {
    if (this.activeModal === kind) {
      this.closeModal();
    } else {
      this.activeModal = kind;
      if (kind === "esc_menu") {
        this.escSettingsOpen = false;
      }
      this.renderModal();
    }
  }

  public closeModal(): void {
    this.activeModal = "none";
    this.selectedNpc = null;
    this.escSettingsOpen = false;
    this.root.classList.remove("modal-open");
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
    const inWorld = this.isInWorldState();
    const hudDisplay = inWorld ? "" : "none";
    this.elTopLeftBuffs.style.display = hudDisplay;
    this.elTopCenterBar.style.display = hudDisplay;
    this.elTopLeft.style.display = hudDisplay;
    this.elTopRight.style.display = hudDisplay;
    this.elRightQuestScroll.style.display = hudDisplay;
    this.elBottomLeft.style.display = hudDisplay;
    this.elBottomCenter.style.display = hudDisplay;
    if (!inWorld) {
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
    const activeBuffs = p?.buffs ?? [];
    const buffRowsHtml =
      activeBuffs.length > 0
        ? activeBuffs
            .map(
              (b) => `
                <div class="hud-poe2-buff-row">
                  <div class="hud-poe2-buff-box buff-box-jade">
                    <img src="${V01B_UI_CHROME_URLS.orbTuViCore32}" alt="" />
                  </div>
                  <span class="buff-pill hud-poe2-buff-text">${this.escapeHtml(b.name)}</span>
                </div>
              `
            )
            .join("")
        : `
            <div class="hud-poe2-buff-row">
              <div class="hud-poe2-buff-box buff-box-jade">
                <img src="${V01B_UI_CHROME_URLS.orbTuViCore32}" alt="" />
              </div>
              <span class="buff-pill hud-poe2-buff-text">Hộ Thể Linh Khí • ${this.escapeHtml(realmBadge)}</span>
            </div>
          `;

    const freePtsRowHtml =
      freePts > 0
        ? `
            <div class="hud-poe2-buff-row hud-poe2-buff-clickable" id="hud-free-points-pill" title="Nhấn để mở Thiên Cung Nội Thị Đồ [C]">
              <div class="hud-poe2-buff-box buff-box-pts">+${freePts}</div>
              <span class="buff-pill hud-poe2-buff-text">+${freePts} Điểm Tiềm Năng [C]</span>
            </div>
          `
        : "";

    this.elTopLeftBuffs.innerHTML = `
      <div class="hud-buffs-row" id="hud-buffs-row">
        ${buffRowsHtml}
        ${freePtsRowHtml}
      </div>
    `;
    this.elTopLeftBuffs.querySelector("#hud-free-points-pill")?.addEventListener("click", () => {
      this.toggleModal("cultivation");
    });

    const zoneId = this.net.getCurrentZoneId();
    const zoneDef = ZONES_REGISTRY[zoneId];
    const px = p?.x ?? v02?.world.x ?? zoneDef.defaultSpawn.x;
    const py = p?.y ?? v02?.world.y ?? zoneDef.defaultSpawn.y;
    const monsters = Object.values(snap?.monsters ?? {}).filter((m) => m.hp > 0);
    let nearestMonster: (typeof monsters)[number] | null = null;
    let nearestDist = 460;
    for (const m of monsters) {
      const d = Math.hypot(m.x - px, m.y - py);
      if (d < nearestDist) {
        nearestDist = d;
        nearestMonster = m;
      }
    }

    const topBarLabel = nearestMonster
      ? `${nearestMonster.nameVi} — HP ${nearestMonster.hp} / ${nearestMonster.maxHp}`
      : `${zoneDef.nameVi} • 【${realmBadge}】`;
    const topBarFillPct = nearestMonster
      ? Math.min(100, Math.round((nearestMonster.hp / Math.max(1, nearestMonster.maxHp)) * 100))
      : hpPct;

    this.elTopCenterBar.innerHTML = `
      <div class="hud-poe2-boss-plate">
        <span class="hud-poe2-boss-finial left">❖</span>
        <div class="hud-poe2-boss-track">
          <div class="hud-poe2-boss-crown">◆</div>
          <div class="hud-poe2-boss-fill" style="width:${topBarFillPct}%"></div>
          <span class="hud-poe2-boss-label">${this.escapeHtml(topBarLabel)}</span>
        </div>
        <span class="hud-poe2-boss-finial right">❖</span>
      </div>
    `;

    const appearanceId = v02?.identity.appearanceId ?? p?.appearanceId ?? "hero_kiem_tu";
    const portraitSrc = resolveStarterPortraitUrl(appearanceId);
    const phiQuest = QUESTS_REGISTRY.phi_de_ch1_huong_thom;
    const qStatus = p?.quests[phiQuest.id]?.status ?? "not_started";
    const questMarkerIcon =
      qStatus === "completed"
        ? V01B_UI_CHROME_URLS.questMarkerTurnin
        : qStatus === "active"
          ? V01B_UI_CHROME_URLS.questMarkerActive
          : V01B_UI_CHROME_URLS.questMarkerAvailable;
    const questStatusLabel =
      qStatus === "completed"
        ? "Đã hoàn thành"
        : qStatus === "active"
          ? "Đang thực hiện — Gặp Lão Trù Trương / Phì Đế"
          : "Khả dụng — Gặp Phì Đế [E]";

    const expArcDash = Math.round(4.65 * expPct);
    const tuViArcDash = Math.round(4.27 * tuViPct);

    this.elTopLeft.innerHTML = `
      <div class="hud-dantian-corner-stack">
        <div class="hud-dantian-identity-ribbon">
          <div class="hud-portrait-socket">
            <div class="hud-portrait-inner">
              <img src="${this.escapeHtml(portraitSrc)}" alt="${this.escapeHtml(playerName)}" />
            </div>
            <span class="hud-portrait-lv-badge">Lv.${level}</span>
          </div>
          <div class="hud-dantian-name-plaque">
            <span class="hud-player-name" id="hud-player-name">${this.escapeHtml(playerName)}</span>
            <span class="hud-realm-badge" id="hud-realm-badge">Cấp ${level} • ${this.escapeHtml(realmBadge)}</span>
          </div>
        </div>
        <div class="hud-dantian-orb-row">
          <div class="hud-dantian-globe-container">
            <svg class="hud-dantian-ring-svg" viewBox="0 0 160 160" aria-hidden="true">
              <circle class="ring-track-exp" cx="80" cy="80" r="74" />
              <circle class="ring-fill-exp" cx="80" cy="80" r="74" stroke-dasharray="${expArcDash} 465" />
              <circle class="ring-track-tuvi" cx="80" cy="80" r="68" />
              <circle class="ring-fill-tuvi" cx="80" cy="80" r="68" stroke-dasharray="${tuViArcDash} 427" />
            </svg>
            <div class="hud-dantian-inner-sphere">
              <div class="hud-dantian-half hp-half bar-track-hp">
                <div class="bar-fill hp hud-orb-liquid" style="height:${hpPct}%"></div>
                <div class="hud-orb-readout">
                  <span class="hud-orb-title">HP</span>
                  <div class="bar-text hud-orb-val" id="hud-hp-text">${curHp}/${maxHp}</div>
                </div>
              </div>
              <div class="hud-dantian-half mp-half bar-track-mp">
                <div class="bar-fill mp hud-orb-liquid" style="height:${mpPct}%"></div>
                <div class="hud-orb-readout">
                  <span class="hud-orb-title">Linh Lực</span>
                  <div class="bar-text hud-orb-val" id="hud-mp-text">${curMp}/${maxMp}</div>
                </div>
              </div>
              <svg class="hud-dantian-yinyang-svg" viewBox="0 0 128 128" aria-hidden="true">
                <path d="M 64,0 A 32,32 0 0,0 64,64 A 32,32 0 0,1 64,128" fill="none" stroke="#f5cf70" stroke-width="2.5" />
                <circle cx="54" cy="30" r="4.5" fill="rgba(51, 154, 240, 0.85)" stroke="#f5cf70" stroke-width="1.2" />
                <circle cx="74" cy="98" r="4.5" fill="rgba(224, 49, 49, 0.85)" stroke="#f5cf70" stroke-width="1.2" />
              </svg>
              <div class="hud-dantian-glass-shine"></div>
            </div>
          </div>
          <div class="hud-dantian-ring-callout">
            <div class="bar-track bar-track-tuvi hud-ring-mini-track">
              <div class="bar-fill tuvi" style="width:${tuViPct}%"></div>
              <span class="bar-text" id="hud-tuvi-text">Tu Vi ${curTuVi}/${reqTuVi}</span>
            </div>
            <div class="bar-track bar-track-exp hud-ring-mini-track">
              <div class="bar-fill exp" style="width:${expPct}%"></div>
              <span class="bar-text" id="hud-exp-text">${atLevelCap ? "Đỉnh Phong" : `EXP ${expNowStr}/${expNextStr}`}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const linhThachVal = p?.linhThach ?? v02?.world.linhThach ?? 0;
    const currencyPlaque = this.elBottomCenter.querySelector("#hud-linh-thach");
    if (currencyPlaque) {
      currencyPlaque.innerHTML = `
        <img class="hud-inline-icon" src="${V01B_UI_CHROME_URLS.currencyLinhThach32}" alt="" />
        <span class="hud-currency-val">${linhThachVal}</span>
        <span class="hud-currency-unit">Linh Thạch</span>
      `;
    }
    const muteGlyph = this.elBottomCenter.querySelector("#hud-mute-glyph");
    if (muteGlyph) {
      muteGlyph.textContent = this.soundCtrl.isMuted() ? "🔇" : "🔊";
    }
    const cBtn = this.elBottomCenter.querySelector("#btn-open-cultivation");
    cBtn?.classList.toggle("has-free-pts", freePts > 0);

    const onlineCount = Object.keys(snap?.players ?? {}).length || 1;
    const zoneMetaText = `Đạo hữu: ${onlineCount} • (${Math.round(px)}, ${Math.round(py)})`;

    this.elTopRightControls.innerHTML = `
      <div class="zone-title" id="hud-zone-title">${this.escapeHtml(zoneDef.nameVi)}</div>
      <div class="zone-meta" id="hud-zone-meta">${zoneMetaText}</div>
    `;

    if (!_snap || !this.elRightQuestScroll.innerHTML) {
      this.elRightQuestScroll.innerHTML = `
        <div class="hud-quest-scroll-head">
          <img class="hud-quest-marker-icon" src="${questMarkerIcon}" alt="" />
          <span class="hud-quest-scroll-title">Thiên Mệnh Chỉ Dẫn [Q]</span>
          <button type="button" class="hud-quest-collapse-btn" id="btn-collapse-quest">${this.questTrackerCollapsed ? "▼" : "▲"}</button>
        </div>
        ${
          this.questTrackerCollapsed
            ? ""
            : `
              <div class="hud-quest-tracker" id="hud-quest-tracker">
                <div class="hud-quest-tracker-text">${this.escapeHtml(phiQuest.titleVi)}</div>
                <div class="hud-quest-tracker-sub">${questStatusLabel}</div>
                <button
                  type="button"
                  class="hud-btn v01b-btn-jade hud-autonav-btn"
                  id="btn-hud-quest-autonav"
                  data-testid="hud-quest-autonav-btn"
                >[Tự Hành]</button>
              </div>
            `
        }
      `;
      this.elRightQuestScroll.querySelector("#btn-collapse-quest")?.addEventListener("click", () => {
        this.questTrackerCollapsed = !this.questTrackerCollapsed;
        this.refreshPanels();
      });
      this.elRightQuestScroll.querySelector("#btn-hud-quest-autonav")?.addEventListener("click", () => {
        this.triggerQuestAutoNavigate();
      });
    }

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
    this.elTopRight.classList.toggle("is-expanded", this.minimapView.getTelemetry().isExpanded);

    if (this.activeModal === "cultivation" && _self) {
      const modalTuViFill = this.elModalHost.querySelector(
        "#char-modal-tuvi-fill"
      ) as HTMLElement | null;
      const modalTuViText = this.elModalHost.querySelector(
        "#char-modal-tuvi-text"
      ) as HTMLElement | null;
      if (modalTuViFill && modalTuViText) {
        modalTuViFill.style.width = `${tuViPct}%`;
        modalTuViText.textContent = `Tu Vi: ${curTuVi} / ${reqTuVi}`;
        return;
      }
    }

    if (this.activeModal !== "none" && !_snap && !_self) {
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
    const next = this.minimapView.toggleExpanded(forceState);
    this.elTopRight.classList.toggle("is-expanded", next);
    return next;
  }

  public getMinimapTelemetry(): MinimapTelemetry {
    return this.minimapView.getTelemetry();
  }

  private renderModal(): void {
    if (this.activeModal === "none") {
      this.root.classList.remove("modal-open");
      this.elModalHost.innerHTML = "";
      return;
    }

    const prevModalEl = this.elModalHost.querySelector(".hud-modal") as HTMLElement | null;
    const savedModalScrollTop = prevModalEl ? prevModalEl.scrollTop : 0;

    this.root.classList.add("modal-open");

    if (this.activeModal === "npc" && this.selectedNpc) {
      this.renderNpcModal(this.selectedNpc);
    } else if (this.activeModal === "inventory") {
      this.renderInventoryAndCulinaryModal();
    } else if (this.activeModal === "cultivation") {
      this.renderCultivationModal();
    } else if (this.activeModal === "esc_menu") {
      this.renderEscSystemMenuModal();
    }

    const nextModalEl = this.elModalHost.querySelector(".hud-modal") as HTMLElement | null;
    if (nextModalEl && savedModalScrollTop > 0) {
      nextModalEl.scrollTop = savedModalScrollTop;
    }
  }

  private renderNpcModal(npc: LegendaryNpcDefinition): void {
    const phiQuest = QUESTS_REGISTRY.phi_de_ch1_huong_thom;
    this.elModalHost.innerHTML = renderNpcDialogueModalHtml(npc, this.net.selfState);

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
    this.elModalHost.innerHTML = renderInventoryModalHtml({
      selfState: this.net.selfState,
      selfStateV02: this.net.selfStateV02,
      activeTab: this.inventoryTab,
      selectedItemId: this.selectedInventoryItemId,
      equippedWeaponId: this.equippedWeaponId
    });

    this.bindModalClose();
    this.elModalHost.querySelectorAll(".v01b-tab-btn").forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        const nextTab = (tabBtn as HTMLElement).dataset.invTab as
          | InventoryCategoryTab
          | undefined;
        if (nextTab) {
          this.inventoryTab = nextTab;
          this.renderInventoryAndCulinaryModal();
        }
      });
    });
    this.elModalHost.querySelectorAll("[data-inv-item]").forEach((slotEl) => {
      slotEl.addEventListener("click", (ev) => {
        if ((ev.target as HTMLElement).classList.contains("btn-use-item")) {
          return;
        }
        const itemId = (slotEl as HTMLElement).dataset.invItem;
        if (itemId) {
          this.selectedInventoryItemId = itemId;
          this.renderInventoryAndCulinaryModal();
        }
      });
    });
    this.elModalHost.querySelectorAll("[data-equip-slot]").forEach((eqSlot) => {
      eqSlot.addEventListener("click", () => {
        const slotKey = (eqSlot as HTMLElement).dataset.equipSlot;
        if (slotKey === "binh_khi") {
          this.selectedInventoryItemId = "thanh_van_kiem_so_cap";
          this.renderInventoryAndCulinaryModal();
        }
      });
    });
    this.elModalHost.querySelectorAll(".btn-equip-item").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const itemId = (btn as HTMLElement).dataset.item;
        if (!itemId) return;
        const currentlyEquipped =
          this.equippedWeaponId !== undefined ? this.equippedWeaponId : "thanh_van_kiem_so_cap";
        if (currentlyEquipped === itemId) {
          this.equippedWeaponId = null;
          this.appendLog("system", `[Pháp Bảo] Đã tháo trang bị ${itemId}.`);
        } else {
          this.equippedWeaponId = itemId;
          this.appendLog("system", `[Pháp Bảo] Đã trang bị ${itemId} (+10 Công Kích).`);
        }
        this.renderInventoryAndCulinaryModal();
      });
    });
    this.elModalHost.querySelectorAll(".btn-use-item").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
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
  }

  private renderCultivationModal(): void {
    renderCharacterPanelModal({
      modalHost: this.elModalHost,
      net: this.net,
      onCloseModal: () => this.closeModal()
    });
  }

  private renderEscSystemMenuModal(): void {
    const p = this.net.selfState;
    const v02 = this.net.selfStateV02;
    const charName = v02?.identity.name ?? p?.nickname ?? "Đạo Hữu";
    const realmId = v02?.cultivation.realmId ?? p?.realmId ?? "pham_nhan";
    const realmStage = v02?.cultivation.realmStage ?? p?.realmStage ?? 1;
    const realmDisplay = formatRealmDisplay(realmId, realmStage);

    this.elModalHost.innerHTML = renderEscSystemMenuModalHtml({
      characterName: charName,
      realmDisplay,
      isMuted: this.soundCtrl.isMuted(),
      isMinimapExpanded: this.minimapView.getTelemetry().isExpanded,
      settingsSubViewOpen: this.escSettingsOpen
    });

    this.bindModalClose();
    this.elModalHost.querySelector("#btn-esc-resume")?.addEventListener("click", () => {
      this.closeModal();
    });
    this.elModalHost
      .querySelector("#btn-esc-switch-character")
      ?.addEventListener("click", () => {
        this.closeModal();
        void this.exitHandlers.onSwitchCharacterToRoster?.();
      });
    this.elModalHost.querySelector("#btn-esc-settings")?.addEventListener("click", () => {
      this.escSettingsOpen = !this.escSettingsOpen;
      this.renderEscSystemMenuModal();
    });
    this.elModalHost.querySelector("#btn-esc-toggle-mute")?.addEventListener("click", () => {
      this.soundCtrl.toggleMute();
      this.refreshPanels();
      this.renderEscSystemMenuModal();
    });
    this.elModalHost.querySelector("#btn-esc-toggle-minimap")?.addEventListener("click", () => {
      this.toggleMinimapSize();
      this.renderEscSystemMenuModal();
    });
    this.elModalHost.querySelector("#btn-esc-return-title")?.addEventListener("click", () => {
      this.closeModal();
      void this.exitHandlers.onReturnToTitle?.();
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
