import type {
  CharacterRosterEntryDto,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  DestinyRarity,
  DestinyRollDraft,
  Direction,
  EntryFlowState,
  GuestAuthResultPayload
} from "@tong-mon-8d/shared";
import {
  APPROVED_CHARACTER_V02_APPEARANCES,
  BASE_ATTRIBUTE_KEYS,
  BASE_ATTRIBUTE_LABELS_VI,
  LEGENDARY_NPCS,
  S1E_STARTER_DESTINY_CATALOG,
  formatDestinyTraitBonusSummaryVi
} from "@tong-mon-8d/game-data";
import {
  V01B_UI_CHROME_URLS,
  resolveAttributeIconUrl,
  resolveDestinyCardFrameUrl,
  resolveDestinyTraitIconUrl,
  resolveStarterPortraitUrl
} from "../../game/assets/RuntimeAssetBindings.js";
import type { GameNetworkClient } from "../../network/GameNetworkClient.js";
import type { SoundController } from "../../audio.js";
import type { EntryStateMachine } from "../../app/entry/EntryStateMachine.js";
import { SpritePreviewAnimator } from "../entry/SpritePreviewCanvas.js";
import {
  renderEnteringWorldScreenHtml,
  renderRosterScreenHtml,
  renderTitleScreenHtml
} from "../entry/TitleAndRosterViews.js";

const RARITY_CROWN_LABELS_VI: Record<DestinyRarity, string> = {
  than: "THẦN PHẨM — ĐẾ KIM HỒNG NGỌC",
  tien: "TIÊN PHẨM — TIÊN NGỌC LAM QUANG",
  hoang: "HOÀNG PHẨM — HOÀNG KIM",
  pham: "PHÀM PHẨM — BẠCH THẠCH"
};

export class CharacterCreationOverlayController {
  private hostEl: HTMLElement;
  private net: GameNetworkClient;
  private soundCtrl: SoundController;
  private stateMachine?: EntryStateMachine;
  private onStateChangedCallback?: (state: EntryFlowState) => void;
  private spriteAnimator = new SpritePreviewAnimator();

  private draftNameInput = "Hàn Lập";
  private selectedAppearanceId = APPROVED_CHARACTER_V02_APPEARANCES[0]!.id;
  private previewDirection: Direction = "down";
  private previewAnimMode: "idle" | "walk" = "idle";
  private activeDraftCharacterId: string | null = null;
  private activeDraftCharacterName = "Hàn Lập";
  private activeDraftAppearanceId = APPROVED_CHARACTER_V02_APPEARANCES[0]!.id;
  private confirmModalOpen = false;
  private rosterDeleteTargetCharacterId: string | null = null;
  private titleSettingsOpen = false;
  private statusBanner: { kind: "info" | "error" | "ok"; text: string } | null = null;
  private busyAction = false;

  constructor(
    parentRoot: HTMLElement,
    net: GameNetworkClient,
    soundCtrl: SoundController,
    stateMachine?: EntryStateMachine,
    onStateChangedCallback?: (state: EntryFlowState) => void
  ) {
    this.net = net;
    this.soundCtrl = soundCtrl;
    this.stateMachine = stateMachine;
    this.onStateChangedCallback = onStateChangedCallback;

    const existing = parentRoot.querySelector("#character-creation-host") as HTMLElement | null;
    if (existing) {
      this.hostEl = existing;
    } else {
      this.hostEl = document.createElement("div");
      this.hostEl.id = "character-creation-host";
      parentRoot.appendChild(this.hostEl);
    }
    this.syncVisibilityAndRender();
  }

  public getEntryFlowState(): EntryFlowState {
    if (!this.net.isV02Mode()) {
      return "IN_WORLD";
    }
    if (this.stateMachine) {
      return this.stateMachine.getState();
    }
    const confirmed = this.net.selfStateV02?.identity.creationState === "confirmed";
    return confirmed ? "IN_WORLD" : "TITLE";
  }

  public transitionTo(nextState: EntryFlowState): void {
    this.confirmModalOpen = false;
    this.rosterDeleteTargetCharacterId = null;
    this.titleSettingsOpen = false;
    if (this.stateMachine) {
      this.stateMachine.setState(nextState);
    }
    this.onStateChangedCallback?.(nextState);
    this.syncVisibilityAndRender();
  }

  public isCreationOverlayActive(): boolean {
    if (!this.net.isV02Mode()) {
      return false;
    }
    return this.getEntryFlowState() !== "IN_WORLD";
  }

  public onWorldEntered(): void {
    this.busyAction = false;
    this.statusBanner = null;
    this.confirmModalOpen = false;
    this.rosterDeleteTargetCharacterId = null;
    this.spriteAnimator.stop();
    if (this.getEntryFlowState() !== "IN_WORLD") {
      this.transitionTo("IN_WORLD");
    } else {
      this.syncVisibilityAndRender();
    }
  }

  public async openRosterFromWorld(): Promise<void> {
    this.busyAction = true;
    this.statusBanner = null;
    this.transitionTo("ROSTER");
    try {
      await this.net.fetchCharacterRosterHttp();
    } catch (err) {
      this.statusBanner = {
        kind: "error",
        text: String((err as Error)?.message ?? err)
      };
    } finally {
      this.busyAction = false;
      this.syncVisibilityAndRender();
    }
  }

  public openTitleFromWorld(): void {
    this.busyAction = false;
    this.statusBanner = null;
    this.transitionTo("TITLE");
  }

  public onGuestAuthResult(result: GuestAuthResultPayload): void {
    this.busyAction = false;
    if (!result.ok) {
      this.statusBanner = {
        kind: "error",
        text: result.messageVi || "Xác thực phiên khách v0.2 thất bại."
      };
    }
    this.syncVisibilityAndRender();
  }

  public onSelfStateV02(state: CharacterV02SnapshotPayload): void {
    this.busyAction = false;
    this.activeDraftCharacterId = state.identity.characterId;
    if (state.identity.name) {
      this.activeDraftCharacterName = state.identity.name;
      this.draftNameInput = state.identity.name;
    }
    if (state.identity.appearanceId) {
      this.activeDraftAppearanceId = state.identity.appearanceId;
      this.selectedAppearanceId = state.identity.appearanceId;
    }
    this.syncVisibilityAndRender();
  }

  public onCharacterV02ActionResult(result: CharacterV02ActionResultPayload): void {
    this.onActionResultV02(result);
  }

  public onActionResultV02(result: CharacterV02ActionResultPayload): void {
    this.busyAction = false;
    if (!result.ok) {
      this.statusBanner = {
        kind: "error",
        text: result.messageVi
      };
      this.syncVisibilityAndRender();
      return;
    }

    if (result.character) {
      this.activeDraftCharacterId = result.character.identity.characterId;
      this.activeDraftCharacterName = result.character.identity.name;
      this.activeDraftAppearanceId = result.character.identity.appearanceId;
      this.draftNameInput = result.character.identity.name;
      this.selectedAppearanceId = result.character.identity.appearanceId;
    }

    if (result.rollDraft) {
      this.soundCtrl.playCoin();
    }
    this.statusBanner = {
      kind: "ok",
      text: result.messageVi
    };
    this.syncVisibilityAndRender();
  }

  public syncVisibilityAndRender(): void {
    if (!this.isCreationOverlayActive()) {
      this.spriteAnimator.stop();
      this.hostEl.innerHTML = "";
      this.hostEl.style.display = "none";
      this.stateMachine?.publishGlobalTelemetry();
      return;
    }

    this.hostEl.style.display = "flex";
    const flowState = this.getEntryFlowState();
    this.stateMachine?.publishGlobalTelemetry();

    if (flowState === "TITLE") {
      this.spriteAnimator.stop();
      this.renderTitleStep();
      return;
    }

    if (flowState === "ROSTER") {
      this.renderRosterStep();
      return;
    }

    if (flowState === "CREATE") {
      this.renderUnifiedCreateAndDestinyStep(null);
      return;
    }

    if (flowState === "DESTINY_ROLL") {
      this.renderUnifiedCreateAndDestinyStep(this.net.activeRollDraft);
      return;
    }

    if (flowState === "ENTERING_WORLD") {
      this.spriteAnimator.stop();
      this.hostEl.innerHTML = renderEnteringWorldScreenHtml(this.activeDraftCharacterName);
      return;
    }
  }

  private renderTitleStep(): void {
    this.hostEl.innerHTML = renderTitleScreenHtml({
      busy: this.busyAction,
      isMuted: this.soundCtrl.isMuted(),
      settingsOpen: this.titleSettingsOpen,
      statusBanner: this.statusBanner,
      accountId: this.net.getAccountId()
    });

    this.hostEl.querySelector("#btn-entry-start-play")?.addEventListener("click", () => {
      void this.handleStartPlayClick();
    });

    this.hostEl.querySelector("#btn-entry-title-settings")?.addEventListener("click", () => {
      this.titleSettingsOpen = true;
      this.renderTitleStep();
    });

    this.hostEl.querySelector("#btn-title-toggle-audio")?.addEventListener("click", () => {
      this.soundCtrl.toggleMute();
      this.renderTitleStep();
    });

    this.hostEl.querySelector("#btn-title-close-settings")?.addEventListener("click", () => {
      this.titleSettingsOpen = false;
      this.renderTitleStep();
    });
  }

  private async handleStartPlayClick(): Promise<void> {
    if (this.busyAction) return;
    this.busyAction = true;
    this.statusBanner = {
      kind: "info",
      text: "Đang xác thực danh tính khách và tải danh sách đạo thân..."
    };
    this.renderTitleStep();

    try {
      const authRes = await this.net.authenticateGuestHttp();
      if (!authRes.ok) {
        this.busyAction = false;
        this.statusBanner = {
          kind: "error",
          text: authRes.messageVi || "Không thể xác thực danh tính khách."
        };
        this.renderTitleStep();
        return;
      }

      const rosterRes = await this.net.fetchCharacterRosterHttp();
      this.busyAction = false;
      this.statusBanner = null;

      if (!rosterRes.ok) {
        this.statusBanner = {
          kind: "error",
          text: rosterRes.messageVi || "Không thể tải danh sách đạo thân."
        };
        this.renderTitleStep();
        return;
      }

      if (rosterRes.characters.length === 0) {
        this.activeDraftCharacterId = null;
        this.net.activeRollDraft = null;
        this.draftNameInput = "Hàn Lập";
        this.selectedAppearanceId = APPROVED_CHARACTER_V02_APPEARANCES[0]!.id;
        this.transitionTo("CREATE");
      } else {
        const preferred =
          rosterRes.characters.find(
            (c) => c.characterId === this.net.getSelectedCharacterId()
          ) ?? rosterRes.characters[0]!;
        this.net.setSelectedCharacterId(preferred.characterId);
        this.transitionTo("ROSTER");
      }
    } catch (err) {
      this.busyAction = false;
      this.statusBanner = {
        kind: "error",
        text: String((err as Error)?.message ?? err)
      };
      this.renderTitleStep();
    }
  }

  private renderRosterStep(): void {
    const characters = this.net.rosterCharacters;
    const selectedId =
      this.net.getSelectedCharacterId() ?? characters[0]?.characterId ?? null;
    const selectedChar =
      characters.find((c) => c.characterId === selectedId) ?? characters[0] ?? null;
    const deleteConfirmChar =
      characters.find((c) => c.characterId === this.rosterDeleteTargetCharacterId) ??
      null;

    this.hostEl.innerHTML = renderRosterScreenHtml({
      characters,
      selectedCharacterId: selectedChar?.characterId ?? null,
      previewDirection: this.previewDirection,
      busy: this.busyAction,
      statusBanner: this.statusBanner,
      deleteConfirmCharacter: deleteConfirmChar
    });

    const previewCanvas = this.hostEl.querySelector(
      "#entry-sprite-preview-canvas"
    ) as HTMLCanvasElement | null;
    if (previewCanvas && selectedChar) {
      this.spriteAnimator.attach(
        previewCanvas,
        selectedChar.appearanceId,
        this.previewDirection,
        "idle"
      );
    }

    this.hostEl.querySelectorAll("[data-testid='roster-character-card']").forEach((card) => {
      card.addEventListener("click", () => {
        const cid = (card as HTMLElement).dataset.characterId;
        if (cid) {
          this.net.setSelectedCharacterId(cid);
          this.statusBanner = null;
          this.stateMachine?.publishGlobalTelemetry();
          this.renderRosterStep();
        }
      });
    });

    this.hostEl.querySelectorAll("[data-preview-dir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = (btn as HTMLElement).dataset.previewDir as Direction | undefined;
        if (dir) {
          this.previewDirection = dir;
          this.renderRosterStep();
        }
      });
    });

    this.hostEl.querySelector("#btn-roster-enter-world")?.addEventListener("click", () => {
      if (selectedChar) {
        void this.handleRosterEnterWorld(selectedChar);
      }
    });

    this.hostEl.querySelector("#btn-roster-resume-draft")?.addEventListener("click", () => {
      if (selectedChar) {
        void this.handleRosterResumeDraft(selectedChar);
      }
    });

    this.hostEl.querySelector("#btn-roster-delete-char")?.addEventListener("click", () => {
      if (this.busyAction || !selectedChar) return;
      this.rosterDeleteTargetCharacterId = selectedChar.characterId;
      this.renderRosterStep();
    });

    this.hostEl.querySelector("#btn-roster-cancel-delete")?.addEventListener("click", () => {
      if (this.busyAction) return;
      this.rosterDeleteTargetCharacterId = null;
      this.renderRosterStep();
    });

    this.hostEl.querySelector("#btn-roster-confirm-delete")?.addEventListener("click", () => {
      if (this.busyAction || !this.rosterDeleteTargetCharacterId) return;
      void this.handleRosterDeleteCharacter(this.rosterDeleteTargetCharacterId);
    });

    this.hostEl.querySelector("#btn-roster-create-new")?.addEventListener("click", () => {
      if (this.busyAction) return;
      this.statusBanner = null;
      this.activeDraftCharacterId = null;
      this.net.activeRollDraft = null;
      this.draftNameInput = `Đạo Đồ ${characters.length + 1}`;
      this.selectedAppearanceId = APPROVED_CHARACTER_V02_APPEARANCES[0]!.id;
      this.transitionTo("CREATE");
    });

    this.hostEl.querySelector("#btn-roster-back-title")?.addEventListener("click", () => {
      if (this.busyAction) return;
      this.statusBanner = null;
      this.transitionTo("TITLE");
    });
  }

  private async handleRosterDeleteCharacter(characterId: string): Promise<void> {
    if (this.busyAction) return;
    this.busyAction = true;
    this.rosterDeleteTargetCharacterId = null;
    this.statusBanner = {
      kind: "info",
      text: "Đang xoá đạo thân khỏi danh sách..."
    };
    this.renderRosterStep();

    try {
      const delRes = await this.net.deleteCharacterHttp(characterId);
      if (!delRes.ok) {
        this.busyAction = false;
        this.statusBanner = {
          kind: "error",
          text: delRes.messageVi || "Không thể xoá đạo thân."
        };
        this.renderRosterStep();
        return;
      }

      await this.net.fetchCharacterRosterHttp();
      this.busyAction = false;
      this.statusBanner = {
        kind: "ok",
        text: delRes.messageVi || "Đã xoá đạo thân thành công."
      };
      if (this.net.rosterCharacters.length === 0) {
        this.transitionTo("TITLE");
      } else {
        this.stateMachine?.publishGlobalTelemetry();
        this.renderRosterStep();
      }
    } catch (err) {
      this.busyAction = false;
      this.statusBanner = {
        kind: "error",
        text: String((err as Error)?.message ?? err)
      };
      this.renderRosterStep();
    }
  }

  private async handleRosterEnterWorld(charEntry: CharacterRosterEntryDto): Promise<void> {
    if (this.busyAction) return;
    this.busyAction = true;
    this.activeDraftCharacterId = charEntry.characterId;
    this.activeDraftCharacterName = charEntry.name;
    this.activeDraftAppearanceId = charEntry.appearanceId;
    this.net.setSelectedCharacterId(charEntry.characterId);
    this.transitionTo("ENTERING_WORLD");

    try {
      await this.net.enterWorldWithCharacter(charEntry.characterId, charEntry.zoneId);
    } catch (err) {
      this.busyAction = false;
      this.statusBanner = {
        kind: "error",
        text: String((err as Error)?.message ?? err)
      };
      this.transitionTo("ROSTER");
    }
  }

  private async handleRosterResumeDraft(charEntry: CharacterRosterEntryDto): Promise<void> {
    if (this.busyAction) return;
    this.busyAction = true;
    this.activeDraftCharacterId = charEntry.characterId;
    this.activeDraftCharacterName = charEntry.name;
    this.activeDraftAppearanceId = charEntry.appearanceId;
    this.draftNameInput = charEntry.name;
    this.selectedAppearanceId = charEntry.appearanceId;
    this.net.setSelectedCharacterId(charEntry.characterId);

    if (charEntry.activeRollDraft) {
      this.net.activeRollDraft = charEntry.activeRollDraft;
      this.busyAction = false;
      this.statusBanner = null;
      this.transitionTo("DESTINY_ROLL");
      return;
    }

    this.statusBanner = {
      kind: "info",
      text: "Đang mở lại tinh bàn Tiên Thiên Khí Vận cho bản nháp..."
    };
    this.renderRosterStep();

    try {
      const rollRes = await this.net.rollInnateDestinyHttp(charEntry.characterId);
      this.busyAction = false;
      if (!rollRes.ok) {
        this.statusBanner = {
          kind: "error",
          text: rollRes.messageVi || "Không thể gieo Tiên Thiên Khí Vận."
        };
        this.renderRosterStep();
        return;
      }
      this.statusBanner = null;
      this.transitionTo("DESTINY_ROLL");
    } catch (err) {
      this.busyAction = false;
      this.statusBanner = {
        kind: "error",
        text: String((err as Error)?.message ?? err)
      };
      this.renderRosterStep();
    }
  }

  private renderCreateStep(): void {
    this.renderUnifiedCreateAndDestinyStep(null);
  }

  private renderDestinyRollStep(rollDraft: DestinyRollDraft | null): void {
    this.renderUnifiedCreateAndDestinyStep(rollDraft);
  }

  private renderUnifiedCreateAndDestinyStep(rollDraft: DestinyRollDraft | null): void {
    const flowState = this.getEntryFlowState();
    const isRolledMode =
      flowState === "DESTINY_ROLL" &&
      Boolean(
        rollDraft &&
          Array.isArray(rollDraft.candidateTraitIds) &&
          rollDraft.candidateTraitIds.length === 3
      );

    const effectiveAppearanceId = this.selectedAppearanceId;
    const effectiveName = this.draftNameInput;

    const selectedApp =
      APPROVED_CHARACTER_V02_APPEARANCES.find((a) => a.id === effectiveAppearanceId) ??
      APPROVED_CHARACTER_V02_APPEARANCES[0]!;

    const appearancesHtml = APPROVED_CHARACTER_V02_APPEARANCES.map((app) => {
      const isSelected = app.id === selectedApp.id;
      const portraitSrc = resolveStarterPortraitUrl(app.id, app.portraitUrl);
      const cardFrameUrl = isSelected
        ? V01B_UI_CHROME_URLS.ccAppearanceCardSelected
        : V01B_UI_CHROME_URLS.ccAppearanceCardUnselected;
      return `
        <button
          type="button"
          class="cc-appearance-card ${isSelected ? "selected is-selected" : ""}"
          aria-pressed="${isSelected ? "true" : "false"}"
          data-testid="create-appearance-card"
          data-appearance-id="${this.escapeHtml(app.id)}"
          style="background-image:url('${cardFrameUrl}')"
        >
          <div class="cc-appearance-portrait">
            <img src="${this.escapeHtml(portraitSrc)}" alt="${this.escapeHtml(app.displayNameVi)}" />
            <img class="cc-appearance-dais" src="${V01B_UI_CHROME_URLS.ccLotusPedestal}" alt="" />
          </div>
          <div class="cc-appearance-meta">
            <div class="cc-appearance-name">${this.escapeHtml(app.displayNameVi)}</div>
            <div class="cc-appearance-desc">${this.escapeHtml(app.subtitleVi)}</div>
          </div>
        </button>
      `;
    }).join("");

    const bonusMap: Record<string, number> = {};
    if (isRolledMode && rollDraft) {
      for (const tid of rollDraft.candidateTraitIds) {
        const def = S1E_STARTER_DESTINY_CATALOG[tid];
        if (def?.flatPreRealmAttributeBonuses) {
          for (const [k, v] of Object.entries(def.flatPreRealmAttributeBonuses)) {
            if (typeof v === "number") {
              bonusMap[k] = (bonusMap[k] ?? 0) + v;
            }
          }
        }
      }
    }

    const originAttrsGridHtml = BASE_ATTRIBUTE_KEYS.map((key) => {
      const label = BASE_ATTRIBUTE_LABELS_VI[key];
      const iconUrl = resolveAttributeIconUrl(key, 32);
      const bonus = bonusMap[key] ?? 0;
      const total = 10 + bonus;
      const bonusSpan =
        bonus > 0 ? `<span class="cc-merged-attr-bonus">(+${bonus})</span>` : "";
      return `
        <div class="cc-merged-attr-cell ${bonus > 0 ? "has-bonus" : ""}">
          <div class="cc-merged-attr-head">
            <img src="${iconUrl}" alt="${this.escapeHtml(label)}" />
            <span>${this.escapeHtml(label)}</span>
          </div>
          <div class="cc-merged-attr-val">
            <strong>${total}</strong> ${bonusSpan}
          </div>
        </div>
      `;
    }).join("");

    const bannerHtml = this.statusBanner
      ? `<div class="cc-status-banner ${this.statusBanner.kind}" id="cc-status-banner" style="display:block;">${this.escapeHtml(this.statusBanner.text)}</div>`
      : "";

    let cardsHtml = "";
    if (isRolledMode && rollDraft) {
      cardsHtml = rollDraft.candidateTraitIds
        .map((traitId, idx) => {
          const def = S1E_STARTER_DESTINY_CATALOG[traitId];
          const rarity: DestinyRarity = def?.rarity ?? "pham";
          const crownLabel = RARITY_CROWN_LABELS_VI[rarity];
          const cardFrameUrl = resolveDestinyCardFrameUrl(rarity);
          const emblemUrl = resolveDestinyTraitIconUrl(traitId, 64);
          const bonusSummary = def
            ? formatDestinyTraitBonusSummaryVi(def)
            : "Chưa có dữ liệu";
          let signatureBadgeHtml = "";
          if (def?.legendaryNpcId) {
            const npc = LEGENDARY_NPCS.find((n) => n.id === def.legendaryNpcId);
            const npcName = npc?.nameVi ?? def.legendaryNpcId;
            signatureBadgeHtml = `
              <div class="cc-signature-badge" data-legendary-npc="${this.escapeHtml(def.legendaryNpcId)}">
                [Độc Nhất Chân Truyền • ${this.escapeHtml(npcName)}]
              </div>
            `;
          }
          return `
            <div
              class="cc-destiny-card cc-merged-destiny-row v01b-destiny-edict-card rarity-${this.escapeHtml(rarity)}"
              data-testid="destiny-roll-card"
              data-slot-index="${idx}"
              data-trait-id="${this.escapeHtml(traitId)}"
              data-rarity="${this.escapeHtml(rarity)}"
              style="background-image:url('${cardFrameUrl}')"
            >
              <div class="cc-merged-destiny-emblem-col">
                <div class="v01b-edict-medallion-halo">
                  <img class="v01b-edict-emblem-img" src="${this.escapeHtml(emblemUrl)}" alt="${this.escapeHtml(def?.displayNameVi ?? traitId)}" />
                </div>
                <span class="v01b-edict-slot-num">${idx + 1}</span>
              </div>
              <div class="cc-merged-destiny-info-col">
                <div class="v01b-edict-rarity-sub">[${this.escapeHtml(crownLabel)}]</div>
                <div class="cc-destiny-name">${this.escapeHtml(def?.displayNameVi ?? traitId)}</div>
                ${signatureBadgeHtml}
                <div class="cc-destiny-desc">${this.escapeHtml(def?.descriptionVi ?? "")}</div>
                <div class="cc-destiny-bonus">+ ${this.escapeHtml(bonusSummary)}</div>
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      cardsHtml = [0, 1, 2]
        .map(
          (idx) => `
          <div
            class="cc-destiny-unrolled-slot cc-merged-destiny-row v01b-destiny-edict-card unrolled"
            data-slot-index="${idx}"
            style="background-image:url('${resolveDestinyCardFrameUrl("pham")}')"
          >
            <div class="cc-merged-destiny-emblem-col">
              <div class="v01b-edict-medallion-halo">
                <img class="v01b-edict-emblem-img" src="${V01B_UI_CHROME_URLS.orbTuViCore64}" alt="" />
              </div>
              <span class="v01b-edict-slot-num">${idx + 1}</span>
            </div>
            <div class="cc-merged-destiny-info-col">
              <div class="v01b-edict-rarity-sub">[Ô MỆNH CÁCH ${idx + 1} • CHƯA GIEO]</div>
              <div class="cc-destiny-name">Thiên Cơ Ẩn Tàng</div>
              <div class="cc-destiny-desc">Nhấn "Xoay Chuyển Tinh Bàn — Gieo Lại Cả 3" bên dưới để câu thông thiên đạo, đồng loạt hiển lộ 3 mệnh cách khởi đầu.</div>
              <div class="cc-destiny-bonus">+ Chờ xoay chuyển tinh bàn</div>
            </div>
          </div>
        `
        )
        .join("");
    }

    const hasActiveNonce = Boolean(isRolledMode && rollDraft?.rollNonce);
    const stepCode = hasActiveNonce ? "ROLLED" : "DRAFT";

    const confirmModalHtml =
      this.confirmModalOpen && rollDraft
        ? `
          <div class="v01b-confirm-modal-backdrop" id="destiny-confirm-modal-backdrop">
            <div class="v01b-confirm-modal v01b-panel-tier3-dragon" data-testid="destiny-confirm-modal">
              <div class="v01b-banner-header">
                <img class="v01b-banner-crest-img" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
                <span class="v01b-banner-title">XÁC NHẬN ẤN ĐỊNH TIÊN THIÊN KHÍ VẬN — BẤT KHẢ NGHỊCH</span>
              </div>
              <div class="v01b-confirm-body">
                <p>Một khi đã khắc 3 Tiên Thiên Khí Vận vào bản mệnh của <strong>${this.escapeHtml(effectiveName)}</strong>, thiên cơ sẽ vĩnh viễn không thể thay đổi.</p>
                <div class="v01b-confirm-traits-summary">
                  ${rollDraft.candidateTraitIds
                    .map((tid) => {
                      const d = S1E_STARTER_DESTINY_CATALOG[tid];
                      return `<span class="roster-destiny-pill rarity-${d?.rarity ?? "pham"}">${this.escapeHtml(d?.displayNameVi ?? tid)}</span>`;
                    })
                    .join("")}
                </div>
              </div>
              <div class="v01b-confirm-actions">
                <button
                  type="button"
                  class="hud-btn gold cc-btn-lg v01b-btn-cinnabar"
                  id="btn-cc-confirm"
                  data-testid="destiny-confirm-forever-btn"
                  ${this.busyAction ? "disabled" : ""}
                >
                  <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoCinnabar}" alt="" />
                  <span>Xác Nhận Ấn Định &amp; Bước Vào Bát Hoang</span>
                </button>
                <button
                  type="button"
                  class="hud-btn cc-btn-lg v01b-btn-jade"
                  id="btn-cc-cancel-confirm"
                  data-testid="destiny-cancel-confirm-btn"
                  ${this.busyAction ? "disabled" : ""}
                >
                  <span>Suy Nghĩ Lại</span>
                </button>
              </div>
            </div>
          </div>
        `
        : "";

    const rollButtonHtml = isRolledMode
      ? `
        <button
          type="button"
          class="hud-btn primary cc-btn-lg v01b-btn-jade cc-merged-reroll-btn"
          id="btn-cc-reroll"
          data-testid="destiny-reroll-all-btn"
          ${this.busyAction ? "disabled" : ""}
        >
          <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="" />
          <span>Xoay Chuyển Tinh Bàn — Gieo Lại Cả 3</span>
        </button>
      `
      : `
        <button
          type="button"
          class="hud-btn primary cc-btn-lg v01b-btn-jade cc-merged-reroll-btn"
          id="btn-cc-create-draft"
          data-testid="create-submit-draft-btn"
          ${this.busyAction ? "disabled" : ""}
        >
          <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="" />
          <span>Xoay Chuyển Tinh Bàn — Gieo Lại Cả 3</span>
        </button>
      `;

    const backButtonId = isRolledMode ? "btn-cc-back-roster" : "btn-cc-back";
    const backButtonTestId = isRolledMode ? "destiny-back-roster-btn" : "create-back-btn";

    this.hostEl.innerHTML = `
      <div
        class="entry-screen entry-create-screen cc-merged-triptych-screen"
        id="cc-draft-section"
        data-testid="entry-create-screen"
        data-step="${stepCode}"
        style="background-image:url('${V01B_UI_CHROME_URLS.entryDestinyAstrolabeBackdrop}')"
      >
        <div class="entry-top-banner">
          <img class="entry-top-banner-img" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
          <div class="entry-top-banner-titles">
            <div class="entry-top-banner-main">THIÊN MỆNH KHỞI NGUYÊN &amp; NGHỊCH THIÊN CẢI MỆNH</div>
            <div class="entry-top-banner-sub">Định Danh Đạo Hiệu • Chọn Hình Tướng • Gieo Cùng Lúc 3 Tiên Thiên Khí Vận</div>
          </div>
        </div>
        ${bannerHtml}
        <div class="cc-merged-triptych-grid">
          <div class="cc-merged-left-col v01b-panel-celestial-jade">
            <div class="cc-form-row">
              <label class="cc-label" for="cc-input-name">Đạo Danh:</label>
              <div class="cc-name-scroll-wrap" style="background-image:url('${V01B_UI_CHROME_URLS.ccNameScrollInput}')">
                <input
                  id="cc-input-name"
                  data-testid="create-name-input"
                  class="cc-input"
                  type="text"
                  maxlength="24"
                  value="${this.escapeHtml(effectiveName)}"
                  placeholder="Nhập đạo danh (2–16 ký tự)..."
                />
              </div>
            </div>
            <div class="cc-form-row cc-merged-appearances-wrap">
              <div class="cc-appearance-grid" id="cc-appearance-grid">
                ${appearancesHtml}
              </div>
            </div>
          </div>

          <div class="cc-merged-center-col">
            <div class="cc-merged-dais-stage">
              <div class="cc-merged-astrolabe-halo">
                <div class="cc-dais-pedestal-wrap">
                  <canvas
                    id="entry-sprite-preview-canvas"
                    class="cc-dais-sprite-canvas"
                    width="148"
                    height="176"
                  ></canvas>
                  <img class="cc-dais-pedestal-img" src="${V01B_UI_CHROME_URLS.ccLotusPedestal}" alt="" />
                </div>
              </div>
              <div class="cc-direction-controls">
                <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${this.previewDirection === "down" ? "active" : ""}" data-preview-dir="down">Nam</button>
                <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${this.previewDirection === "up" ? "active" : ""}" data-preview-dir="up">Bắc</button>
                <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${this.previewDirection === "left" ? "active" : ""}" data-preview-dir="left">Tây</button>
                <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${this.previewDirection === "right" ? "active" : ""}" data-preview-dir="right">Đông</button>
                <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${this.previewAnimMode === "walk" ? "active" : ""}" id="btn-toggle-preview-walk">
                  ${this.previewAnimMode === "walk" ? "Đang Bộ Hành" : "Bộ Hành"}
                </button>
              </div>
            </div>
            <div class="cc-merged-attrs-box">
              <div class="cc-merged-attrs-title">Lục Hợp Thuộc Tính Gốc (Phàm Nhân • Cấp 1)</div>
              <div class="cc-merged-attrs-grid">
                ${originAttrsGridHtml}
              </div>
            </div>
          </div>

          <div
            class="cc-merged-right-col"
            id="cc-rolled-section"
            data-testid="entry-destiny-roll-screen"
          >
            <div class="cc-merged-destiny-stack" id="cc-destiny-grid">
              ${cardsHtml}
            </div>
            <div class="cc-merged-reroll-dock">
              ${rollButtonHtml}
            </div>
          </div>
        </div>

        <div class="cc-merged-footer-bar">
          <button
            type="button"
            class="hud-btn cc-btn-lg v01b-btn-jade cc-merged-back-btn"
            id="${backButtonId}"
            data-testid="${backButtonTestId}"
            ${this.busyAction ? "disabled" : ""}
          >
            <span>Quay Lại Danh Sách</span>
          </button>
          <button
            type="button"
            class="hud-btn gold cc-btn-lg v01b-btn-cinnabar cc-merged-confirm-btn"
            id="btn-cc-open-confirm"
            data-testid="destiny-open-confirm-modal-btn"
            ${this.busyAction ? "disabled" : ""}
          >
            <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoCinnabar}" alt="" />
            <span>Ấn Định Thiên Mệnh — Bước Vào Bát Hoang</span>
          </button>
        </div>
        ${confirmModalHtml}
      </div>
    `;

    const previewCanvas = this.hostEl.querySelector(
      "#entry-sprite-preview-canvas"
    ) as HTMLCanvasElement | null;
    this.spriteAnimator.attach(
      previewCanvas,
      selectedApp.id,
      this.previewDirection,
      this.previewAnimMode
    );

    const nameInput = this.hostEl.querySelector("#cc-input-name") as HTMLInputElement | null;
    nameInput?.addEventListener("input", () => {
      this.draftNameInput = nameInput.value;
      this.activeDraftCharacterName = nameInput.value;
    });

    this.hostEl.querySelectorAll(".cc-appearance-card").forEach((card) => {
      card.addEventListener("click", () => {
        const appId = (card as HTMLElement).dataset.appearanceId;
        if (appId) {
          this.selectedAppearanceId = appId;
          this.activeDraftAppearanceId = appId;
          if (nameInput) {
            this.draftNameInput = nameInput.value;
            this.activeDraftCharacterName = nameInput.value;
          }
          this.renderUnifiedCreateAndDestinyStep(rollDraft);
        }
      });
    });

    this.hostEl.querySelectorAll("[data-preview-dir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = (btn as HTMLElement).dataset.previewDir as Direction | undefined;
        if (dir) {
          this.previewDirection = dir;
          if (nameInput) {
            this.draftNameInput = nameInput.value;
          }
          this.renderUnifiedCreateAndDestinyStep(rollDraft);
        }
      });
    });

    this.hostEl.querySelector("#btn-toggle-preview-walk")?.addEventListener("click", () => {
      this.previewAnimMode = this.previewAnimMode === "idle" ? "walk" : "idle";
      if (nameInput) {
        this.draftNameInput = nameInput.value;
      }
      this.renderUnifiedCreateAndDestinyStep(rollDraft);
    });

    const submitDraft = () => {
      void this.handleSubmitCreateDraft(nameInput?.value ?? this.draftNameInput);
    };

    this.hostEl.querySelector("#btn-cc-create-draft")?.addEventListener("click", submitDraft);
    nameInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isRolledMode) {
          void this.handleRerollAll();
        } else {
          submitDraft();
        }
      }
    });

    this.hostEl.querySelector("#btn-cc-reroll")?.addEventListener("click", () => {
      void this.handleRerollAll();
    });

    this.hostEl.querySelector("#btn-cc-open-confirm")?.addEventListener("click", () => {
      if (this.busyAction) return;
      if (nameInput) {
        this.draftNameInput = nameInput.value;
        this.activeDraftCharacterName = nameInput.value;
      }
      if (!isRolledMode || !rollDraft?.rollNonce) {
        submitDraft();
        return;
      }
      const cleanName = this.draftNameInput.trim();
      if (cleanName.length < 2 || cleanName.length > 24) {
        this.statusBanner = {
          kind: "error",
          text: "Đạo danh phải có độ dài từ 2 đến 24 ký tự."
        };
        this.renderUnifiedCreateAndDestinyStep(rollDraft);
        return;
      }
      this.draftNameInput = cleanName;
      this.activeDraftCharacterName = cleanName;
      this.confirmModalOpen = true;
      this.renderUnifiedCreateAndDestinyStep(rollDraft);
    });

    this.hostEl.querySelector("#btn-cc-cancel-confirm")?.addEventListener("click", () => {
      this.confirmModalOpen = false;
      this.renderUnifiedCreateAndDestinyStep(rollDraft);
    });

    this.hostEl.querySelector("#btn-cc-confirm")?.addEventListener("click", () => {
      if (rollDraft?.rollNonce) {
        void this.handleConfirmForever(rollDraft.rollNonce);
      }
    });

    this.hostEl.querySelector("#btn-cc-back")?.addEventListener("click", () => {
      void this.handleDiscardDraftAndBack();
    });

    this.hostEl.querySelector("#btn-cc-back-roster")?.addEventListener("click", () => {
      void this.handleDiscardDraftAndBack();
    });
  }

  private async handleDiscardDraftAndBack(): Promise<void> {
    if (this.busyAction) return;
    this.busyAction = true;
    this.statusBanner = null;
    this.confirmModalOpen = false;

    const draftIdToDiscard = this.activeDraftCharacterId;
    this.activeDraftCharacterId = null;
    this.net.activeRollDraft = null;

    try {
      if (draftIdToDiscard) {
        await this.net.deleteCharacterHttp(draftIdToDiscard);
      }
      await this.net.fetchCharacterRosterHttp();
    } catch {
      this.activeDraftCharacterId = null;
    } finally {
      this.busyAction = false;
    }

    if (this.net.rosterCharacters.length > 0) {
      this.transitionTo("ROSTER");
    } else {
      this.transitionTo("TITLE");
    }
  }

  private async handleSubmitCreateDraft(rawName: string): Promise<void> {
    if (this.busyAction) return;
    const cleanName = rawName.trim();
    this.draftNameInput = cleanName;
    if (cleanName.length < 2 || cleanName.length > 24) {
      this.statusBanner = {
        kind: "error",
        text: "Đạo danh phải có độ dài từ 2 đến 24 ký tự."
      };
      this.renderCreateStep();
      return;
    }

    this.busyAction = true;
    this.statusBanner = {
      kind: "info",
      text: "Đang khởi tạo bản nháp đạo thân và xoay chuyển tinh bàn Tiên Thiên..."
    };
    this.renderCreateStep();

    try {
      const draftRes = await this.net.createCharacterDraftHttp({
        requestId: this.net.nextClientRequestId("v02_draft"),
        name: cleanName,
        appearanceId: this.selectedAppearanceId
      });

      if (!draftRes.ok || !draftRes.character) {
        this.busyAction = false;
        this.statusBanner = {
          kind: "error",
          text: draftRes.messageVi || "Không thể khởi tạo bản nháp nhân vật."
        };
        this.renderCreateStep();
        return;
      }

      const newCharId = draftRes.character.identity.characterId;
      this.activeDraftCharacterId = newCharId;
      this.activeDraftCharacterName = draftRes.character.identity.name;
      this.activeDraftAppearanceId = draftRes.character.identity.appearanceId;

      if (!draftRes.rollDraft) {
        const rollRes = await this.net.rollInnateDestinyHttp(
          newCharId,
          this.net.nextClientRequestId("v02_roll"),
          {
            name: cleanName,
            appearanceId: this.selectedAppearanceId
          }
        );
        if (!rollRes.ok) {
          this.busyAction = false;
          this.statusBanner = {
            kind: "error",
            text: rollRes.messageVi || "Không thể gieo 3 Tiên Thiên Khí Vận."
          };
          this.transitionTo("DESTINY_ROLL");
          return;
        }
      }

      this.net.setSelectedCharacterId(newCharId);
      this.busyAction = false;
      this.statusBanner = null;
      this.transitionTo("DESTINY_ROLL");
    } catch (err) {
      this.busyAction = false;
      this.statusBanner = {
        kind: "error",
        text: String((err as Error)?.message ?? err)
      };
      this.renderCreateStep();
    }
  }

  private async handleRerollAll(): Promise<void> {
    if (this.busyAction) return;
    const charId =
      this.activeDraftCharacterId ??
      this.net.selfStateV02?.identity.characterId ??
      this.net.getSelectedCharacterId();
    if (!charId) return;

    const cleanName = this.draftNameInput.trim();
    if (cleanName.length < 2 || cleanName.length > 24) {
      this.statusBanner = {
        kind: "error",
        text: "Đạo danh phải có độ dài từ 2 đến 24 ký tự."
      };
      this.renderDestinyRollStep(this.net.activeRollDraft);
      return;
    }
    this.draftNameInput = cleanName;
    this.activeDraftCharacterName = cleanName;
    this.activeDraftAppearanceId = this.selectedAppearanceId;

    this.busyAction = true;
    this.confirmModalOpen = false;
    this.statusBanner = {
      kind: "info",
      text: "Đang xoay chuyển tinh bàn, gieo lại đồng loạt 3 Tiên Thiên Khí Vận..."
    };
    this.renderDestinyRollStep(this.net.activeRollDraft);

    try {
      const res = await this.net.rollInnateDestinyHttp(charId, undefined, {
        name: cleanName,
        appearanceId: this.selectedAppearanceId
      });
      this.busyAction = false;
      if (!res.ok) {
        this.statusBanner = {
          kind: "error",
          text: res.messageVi || "Không thể gieo lại Tiên Thiên Khí Vận."
        };
      } else {
        this.soundCtrl.playCoin();
        this.statusBanner = {
          kind: "ok",
          text: res.messageVi
        };
      }
      this.renderDestinyRollStep(this.net.activeRollDraft);
    } catch (err) {
      this.busyAction = false;
      this.statusBanner = {
        kind: "error",
        text: String((err as Error)?.message ?? err)
      };
      this.renderDestinyRollStep(this.net.activeRollDraft);
    }
  }

  private async handleConfirmForever(rollNonce: string): Promise<void> {
    if (this.busyAction) return;
    const charId =
      this.activeDraftCharacterId ??
      this.net.selfStateV02?.identity.characterId ??
      this.net.getSelectedCharacterId();
    if (!charId) return;

    const cleanName = this.draftNameInput.trim();
    if (cleanName.length < 2 || cleanName.length > 24) {
      this.statusBanner = {
        kind: "error",
        text: "Đạo danh phải có độ dài từ 2 đến 24 ký tự."
      };
      this.renderDestinyRollStep(this.net.activeRollDraft);
      return;
    }
    this.draftNameInput = cleanName;
    this.activeDraftCharacterName = cleanName;
    this.activeDraftAppearanceId = this.selectedAppearanceId;

    this.busyAction = true;
    this.confirmModalOpen = false;
    this.statusBanner = {
      kind: "info",
      text: "Đang ấn định Tiên Thiên Khí Vận vĩnh viễn và khai mở Truyền Tống Trận..."
    };
    this.renderDestinyRollStep(this.net.activeRollDraft);

    try {
      const confirmRes = await this.net.confirmInnateDestinyHttp(
        charId,
        rollNonce,
        undefined,
        {
          name: cleanName,
          appearanceId: this.selectedAppearanceId
        }
      );
      if (!confirmRes.ok) {
        this.busyAction = false;
        this.statusBanner = {
          kind: "error",
          text: confirmRes.messageVi || "Không thể ấn định Tiên Thiên Khí Vận."
        };
        this.renderDestinyRollStep(this.net.activeRollDraft);
        return;
      }

      this.soundCtrl.playCeremony();
      await this.net.fetchCharacterRosterHttp();
      this.transitionTo("ENTERING_WORLD");
      await this.net.enterWorldWithCharacter(charId);
    } catch (err) {
      this.busyAction = false;
      this.statusBanner = {
        kind: "error",
        text: String((err as Error)?.message ?? err)
      };
      this.transitionTo("DESTINY_ROLL");
    }
  }

  private escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
