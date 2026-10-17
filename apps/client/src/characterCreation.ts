import type {
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  DestinyRollDraft,
  GuestAuthResultPayload
} from "@tong-mon-8d/shared";
import {
  APPROVED_CHARACTER_V02_APPEARANCES,
  DESTINY_RARITY_LABELS_VI,
  LEGENDARY_NPCS,
  S1E_STARTER_DESTINY_CATALOG,
  formatDestinyTraitBonusSummaryVi
} from "@tong-mon-8d/game-data";
import type { GameNetworkClient } from "./network.js";
import type { SoundController } from "./audio.js";

export class CharacterCreationOverlayController {
  private hostEl: HTMLElement;
  private net: GameNetworkClient;
  private soundCtrl: SoundController;
  private draftNameInput = "Hàn Lập";
  private selectedAppearanceId = APPROVED_CHARACTER_V02_APPEARANCES[0].id;
  private statusBanner: { kind: "info" | "error" | "ok"; text: string } | null = null;
  private busyAction = false;

  constructor(
    parentRoot: HTMLElement,
    net: GameNetworkClient,
    soundCtrl: SoundController
  ) {
    this.net = net;
    this.soundCtrl = soundCtrl;
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

  public isCreationOverlayActive(): boolean {
    if (!this.net.isV02Mode()) {
      return false;
    }
    const confirmed =
      this.net.selfStateV02?.identity.creationState === "confirmed";
    return !confirmed;
  }

  public onGuestAuthResult(result: GuestAuthResultPayload): void {
    this.busyAction = false;
    if (!result.ok) {
      this.statusBanner = {
        kind: "error",
        text: result.messageVi || "Xác thực phiên khách v0.2 thất bại."
      };
    } else {
      this.statusBanner = null;
    }
    this.syncVisibilityAndRender();
  }

  public onSelfStateV02(state: CharacterV02SnapshotPayload): void {
    this.busyAction = false;
    if (state.identity.name) {
      this.draftNameInput = state.identity.name;
    }
    if (state.identity.appearanceId) {
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

    if (result.character?.identity.creationState === "confirmed") {
      this.soundCtrl.playCeremony();
      this.statusBanner = null;
      this.syncVisibilityAndRender();
      return;
    }

    if (
      result.character?.identity.creationState === "draft" &&
      !result.rollDraft &&
      !this.net.activeRollDraft
    ) {
      this.busyAction = true;
      this.statusBanner = {
        kind: "info",
        text: "Đã khởi tạo bản nháp! Đang gieo 3 Tiên Thiên Khí Vận đầu tiên..."
      };
      this.syncVisibilityAndRender();
      this.net.sendRollInnateDestinyV02();
      return;
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
      this.hostEl.innerHTML = "";
      this.hostEl.style.display = "none";
      return;
    }

    this.hostEl.style.display = "flex";
    const authRes = this.net.lastGuestAuthResult;
    if (authRes && !authRes.ok) {
      this.renderInvalidCredentialRecovery(authRes);
      return;
    }

    const charV02 = this.net.selfStateV02;
    if (!charV02) {
      this.renderDraftStep();
      return;
    }

    if (charV02.identity.creationState === "draft") {
      this.renderDestinyRollStep(charV02, this.net.activeRollDraft);
    }
  }

  private renderInvalidCredentialRecovery(authRes: GuestAuthResultPayload): void {
    this.hostEl.innerHTML = `
      <div class="cc-overlay-backdrop" id="character-creation-overlay">
        <div class="cc-modal cc-recovery-modal" id="cc-recovery-section">
          <div class="cc-header">
            <div class="cc-title">Khôi Phục Danh Tính Khách v0.2</div>
            <div class="cc-subtitle">Chứng chỉ lưu trên trình duyệt không hợp lệ hoặc đã bị thu hồi (${this.escapeHtml(authRes.code)})</div>
          </div>
          <div class="cc-status-banner error" id="cc-status-banner" style="display:block;">
            ${this.escapeHtml(authRes.messageVi || "Không thể xác thực chứng chỉ khách v0.2.")}
          </div>
          <div class="cc-origin-note">
            Hệ thống bảo mật không tự động ghi đè phiên hiện tại. Nhấn nút bên dưới để xóa chứng chỉ lỗi và khởi tạo phiên khách v0.2 mới.
          </div>
          <div class="cc-actions-row">
            <button class="hud-btn gold cc-btn-lg" id="btn-cc-reset-guest" ${this.busyAction ? "disabled" : ""}>
              Khởi Tạo Lại Phiên Khách v0.2
            </button>
          </div>
        </div>
      </div>
    `;

    this.hostEl.querySelector("#btn-cc-reset-guest")?.addEventListener("click", () => {
      if (this.busyAction) return;
      this.busyAction = true;
      this.statusBanner = {
        kind: "info",
        text: "Đang cấp mới chứng chỉ danh tính khách v0.2..."
      };
      this.syncVisibilityAndRender();
      void this.net.resetInvalidGuestSession().catch((err) => {
        this.busyAction = false;
        this.statusBanner = {
          kind: "error",
          text: String(err?.message ?? err)
        };
        this.syncVisibilityAndRender();
      });
    });
  }

  private renderDraftStep(): void {
    const appearancesHtml = APPROVED_CHARACTER_V02_APPEARANCES.map((app) => {
      const activeClass = app.id === this.selectedAppearanceId ? "selected" : "";
      return `
        <button
          type="button"
          class="cc-appearance-card ${activeClass}"
          data-appearance-id="${this.escapeHtml(app.id)}"
        >
          <div class="cc-appearance-portrait">
            <img src="${this.escapeHtml(app.portraitUrl)}" alt="${this.escapeHtml(app.displayNameVi)}" />
          </div>
          <div class="cc-appearance-meta">
            <div class="cc-appearance-name">${this.escapeHtml(app.displayNameVi)}</div>
            <div class="cc-appearance-desc">${this.escapeHtml(app.subtitleVi)}</div>
          </div>
        </button>
      `;
    }).join("");

    const bannerHtml = this.statusBanner
      ? `<div class="cc-status-banner ${this.statusBanner.kind}" id="cc-status-banner" style="display:block;">${this.escapeHtml(this.statusBanner.text)}</div>`
      : "";

    this.hostEl.innerHTML = `
      <div class="cc-overlay-backdrop" id="character-creation-overlay">
        <div class="cc-modal" id="cc-draft-section" data-step="DRAFT">
          <div class="cc-header">
            <div class="cc-kicker">Bước 1 / 2 • Khởi Tạo Bản Nháp (DRAFT)</div>
            <div class="cc-title">Nhập Môn Tông Môn 8D — Định Danh Đạo Đồ</div>
            <div class="cc-subtitle">Khởi đầu cảnh giới Phàm Nhân (Cấp 1) • Chọn đạo hiệu và hình tướng trước khi gieo Tiên Thiên Khí Vận</div>
          </div>
          ${bannerHtml}
          <div class="cc-section">
            <div class="cc-form-row">
              <label class="cc-label" for="cc-input-name">Đạo Hiệu Nhân Vật (2–24 ký tự)</label>
              <input
                id="cc-input-name"
                class="cc-input"
                type="text"
                maxlength="24"
                value="${this.escapeHtml(this.draftNameInput)}"
                placeholder="Nhập đạo hiệu của ngươi..."
              />
            </div>
            <div class="cc-form-row">
              <div class="cc-label">Chọn Hình Tướng Khởi Đầu</div>
              <div class="cc-appearance-grid" id="cc-appearance-grid">
                ${appearancesHtml}
              </div>
            </div>
            <div class="cc-origin-note">
              Căn cốt khởi điểm: Thể Phách 10 • Lực Đạo 10 • Linh Tính 10 • Thân Pháp 10 • Thần Thức 10 • Ngộ Tính 10
            </div>
          </div>
          <div class="cc-actions-row">
            <button
              type="button"
              class="hud-btn gold cc-btn-lg"
              id="btn-cc-create-draft"
              ${this.busyAction ? "disabled" : ""}
            >
              Khởi Tạo Bản Nháp & Bước Vào Gieo Mệnh
            </button>
          </div>
        </div>
      </div>
    `;

    const nameInput = this.hostEl.querySelector("#cc-input-name") as HTMLInputElement | null;
    nameInput?.addEventListener("input", () => {
      this.draftNameInput = nameInput.value;
    });

    this.hostEl.querySelectorAll(".cc-appearance-card").forEach((card) => {
      card.addEventListener("click", () => {
        const appId = (card as HTMLElement).dataset.appearanceId;
        if (appId) {
          this.selectedAppearanceId = appId;
          if (nameInput) {
            this.draftNameInput = nameInput.value;
          }
          this.renderDraftStep();
        }
      });
    });

    const submitDraft = () => {
      if (this.busyAction) return;
      const cleanName = (nameInput?.value ?? this.draftNameInput).trim();
      this.draftNameInput = cleanName;
      if (cleanName.length < 2 || cleanName.length > 24) {
        this.statusBanner = {
          kind: "error",
          text: "Đạo hiệu phải có độ dài từ 2 đến 24 ký tự."
        };
        this.renderDraftStep();
        return;
      }
      this.busyAction = true;
      this.statusBanner = {
        kind: "info",
        text: "Đang khởi tạo bản nháp nhân vật trên máy chủ..."
      };
      this.renderDraftStep();
      this.net.sendCreateCharacterDraftV02(cleanName, this.selectedAppearanceId);
    };

    this.hostEl.querySelector("#btn-cc-create-draft")?.addEventListener("click", submitDraft);
    nameInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitDraft();
      }
    });
  }

  private renderDestinyRollStep(
    charV02: CharacterV02SnapshotPayload,
    rollDraft: DestinyRollDraft | null
  ): void {
    const appDef =
      APPROVED_CHARACTER_V02_APPEARANCES.find(
        (a) => a.id === charV02.identity.appearanceId
      ) ?? APPROVED_CHARACTER_V02_APPEARANCES[0];

    const bannerHtml = this.statusBanner
      ? `<div class="cc-status-banner ${this.statusBanner.kind}" id="cc-status-banner" style="display:block;">${this.escapeHtml(this.statusBanner.text)}</div>`
      : "";

    let cardsHtml = "";
    if (rollDraft && Array.isArray(rollDraft.candidateTraitIds) && rollDraft.candidateTraitIds.length === 3) {
      cardsHtml = rollDraft.candidateTraitIds
        .map((traitId, idx) => {
          const def = S1E_STARTER_DESTINY_CATALOG[traitId];
          const rarity = def?.rarity ?? "pham";
          const rarityLabel = DESTINY_RARITY_LABELS_VI[rarity];
          const bonusSummary = def
            ? formatDestinyTraitBonusSummaryVi(def)
            : "Chưa có dữ liệu";
          let signatureBadgeHtml = "";
          if (def?.legendaryNpcId) {
            const npc = LEGENDARY_NPCS.find((n) => n.id === def.legendaryNpcId);
            const npcName = npc?.nameVi ?? def.legendaryNpcId;
            const trialNote =
              def.narrativeState === "NOT_DESIGNED" ? " • Thử Nghiệm S1-E" : "";
            signatureBadgeHtml = `
              <div class="cc-signature-badge" data-legendary-npc="${this.escapeHtml(def.legendaryNpcId)}">
                ✦ Mệnh Cách Chân Truyền • ${this.escapeHtml(npcName)}${trialNote}
              </div>
            `;
          }
          return `
            <div
              class="cc-destiny-card rarity-${this.escapeHtml(rarity)}"
              data-slot-index="${idx}"
              data-trait-id="${this.escapeHtml(traitId)}"
              data-rarity="${this.escapeHtml(rarity)}"
            >
              <div class="cc-destiny-card-top">
                <span class="cc-destiny-slot">Tiên Thiên Ô ${idx + 1}</span>
                <span class="cc-destiny-rarity">${this.escapeHtml(rarityLabel)}</span>
              </div>
              <div class="cc-destiny-name">${this.escapeHtml(def?.displayNameVi ?? traitId)}</div>
              ${signatureBadgeHtml}
              <div class="cc-destiny-desc">${this.escapeHtml(def?.descriptionVi ?? "")}</div>
              <div class="cc-destiny-bonus">✦ ${this.escapeHtml(bonusSummary)}</div>
            </div>
          `;
        })
        .join("");
    } else {
      cardsHtml = [0, 1, 2]
        .map(
          (idx) => `
          <div class="cc-destiny-card unrolled" data-slot-index="${idx}">
            <div class="cc-destiny-card-top">
              <span class="cc-destiny-slot">Tiên Thiên Ô ${idx + 1}</span>
              <span class="cc-destiny-rarity">Chưa Gieo</span>
            </div>
            <div class="cc-destiny-name">Thiên Cơ Ẩn Tàng</div>
            <div class="cc-destiny-desc">Nhấn "Gieo Tiên Thiên Khí Vận" để câu thông thiên đạo, đồng loạt hiển lộ 3 mệnh cách khởi đầu.</div>
          </div>
        `
        )
        .join("");
    }

    const hasActiveNonce = Boolean(rollDraft?.rollNonce);
    const stepCode = hasActiveNonce ? "ROLLED" : "DRAFT";

    this.hostEl.innerHTML = `
      <div class="cc-overlay-backdrop" id="character-creation-overlay">
        <div class="cc-modal" id="cc-rolled-section" data-step="${stepCode}">
          <div class="cc-header">
            <div class="cc-kicker">Bước 2 / 2 • Tiên Thiên Nghịch Thiên Cải Mệnh (${stepCode})</div>
            <div class="cc-title">Đài Gieo Tiên Thiên Khí Vận</div>
            <div class="cc-subtitle">Gieo đồng loạt 3 mệnh cách (không khóa từng ô) • Tối đa 1 Mệnh Cách Chân Truyền Thần Phẩm</div>
          </div>
          <div class="cc-section">
            <div class="cc-draft-summary-bar" id="cc-draft-summary-bar">
              <div>
                <strong style="color:var(--gold-bright);">${this.escapeHtml(charV02.identity.name)}</strong>
                <span class="cc-rule-note"> • ${this.escapeHtml(appDef.displayNameVi)} • Phàm Nhân Cấp 1</span>
              </div>
              <div class="cc-step-pill active" id="cc-active-nonce">
                ${hasActiveNonce ? `Phiên gieo: ${this.escapeHtml(rollDraft!.rollNonce.slice(0, 18))}...` : "Chưa có lượt gieo"}
              </div>
            </div>
            ${bannerHtml}
            <div class="cc-destiny-grid" id="cc-destiny-grid">
              ${cardsHtml}
            </div>
          </div>
          <div class="cc-actions-row">
            <button
              type="button"
              class="hud-btn primary cc-btn-lg"
              id="btn-cc-reroll"
              ${this.busyAction ? "disabled" : ""}
            >
              ${hasActiveNonce ? "Gieo Lại Toàn Bộ 3 Ô" : "Gieo Tiên Thiên Khí Vận (3 Ô)"}
            </button>
            <button
              type="button"
              class="hud-btn gold cc-btn-lg"
              id="btn-cc-confirm"
              ${!hasActiveNonce || this.busyAction ? "disabled" : ""}
            >
              Xác Nhận Tiên Thiên Khí Vận & Nhập Thế
            </button>
          </div>
        </div>
      </div>
    `;

    this.hostEl.querySelector("#btn-cc-reroll")?.addEventListener("click", () => {
      if (this.busyAction) return;
      this.busyAction = true;
      this.statusBanner = {
        kind: "info",
        text: "Đang gieo 3 Tiên Thiên Khí Vận từ máy chủ..."
      };
      this.renderDestinyRollStep(charV02, rollDraft);
      this.net.sendRollInnateDestinyV02();
    });

    this.hostEl.querySelector("#btn-cc-confirm")?.addEventListener("click", () => {
      if (this.busyAction || !rollDraft?.rollNonce) return;
      this.busyAction = true;
      this.statusBanner = {
        kind: "info",
        text: "Đang xác nhận Tiên Thiên Khí Vận và tiến vào Tân Thủ Thôn..."
      };
      this.renderDestinyRollStep(charV02, rollDraft);
      this.net.sendConfirmInnateDestinyV02(rollDraft.rollNonce);
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
