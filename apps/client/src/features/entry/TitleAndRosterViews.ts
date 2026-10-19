import type { CharacterRosterEntryDto, Direction } from "@tong-mon-8d/shared";
import {
  APPROVED_CHARACTER_V02_APPEARANCES,
  DESTINY_RARITY_LABELS_VI,
  S1E_STARTER_DESTINY_CATALOG,
  ZONES_REGISTRY,
  formatRealmDisplay
} from "@tong-mon-8d/game-data";
import {
  V01B_UI_CHROME_URLS,
  resolveDestinyTraitIconUrl,
  resolveStarterPortraitUrl
} from "../../game/assets/RuntimeAssetBindings.js";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface TitleScreenRenderOptions {
  busy: boolean;
  isMuted: boolean;
  settingsOpen: boolean;
  statusBanner: { kind: "info" | "error" | "ok"; text: string } | null;
  accountId: string | null;
}

export function renderTitleScreenHtml(opts: TitleScreenRenderOptions): string {
  const bannerHtml = opts.statusBanner
    ? `<div class="cc-status-banner ${opts.statusBanner.kind}" id="cc-status-banner" style="display:block;">${escapeHtml(opts.statusBanner.text)}</div>`
    : "";

  const settingsModalHtml = opts.settingsOpen
    ? `
      <div class="v01b-confirm-modal-backdrop" id="title-settings-backdrop">
        <div class="v01b-confirm-modal v01b-panel-tier2-navy" data-testid="entry-title-settings-modal">
          <div class="v01b-banner-header">
            <img class="v01b-banner-crest-img" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
            <span class="v01b-banner-title">CÀI ĐẶT ÂM THANH &amp; GIAO DIỆN</span>
          </div>
          <div class="v01b-confirm-body">
            <p>Điều chỉnh âm thanh cổ cầm và hiệu ứng pháp bảo trong hành trình tu tiên.</p>
            <div class="v01b-settings-row">
              <span>Âm Thanh Linh Giới:</span>
              <button type="button" class="hud-btn v01b-btn-jade" id="btn-title-toggle-audio" data-testid="title-toggle-audio-btn">
                ${opts.isMuted ? "🔇 Đang Tắt — Nhấn Để Bật" : "🔊 Đang Bật — Nhấn Để Tắt"}
              </button>
            </div>
            <div class="v01b-settings-row">
              <span>Phiên Danh Tính Khách:</span>
              <span class="v01b-account-pill">${escapeHtml(opts.accountId ?? "Sẵn sàng khởi tạo")}</span>
            </div>
          </div>
          <div class="v01b-confirm-actions">
            <button type="button" class="hud-btn gold cc-btn-lg v01b-btn-cinnabar" id="btn-title-close-settings" data-testid="title-close-settings-btn">
              Đóng Cài Đặt
            </button>
          </div>
        </div>
      </div>
    `
    : "";

  return `
    <div
      class="entry-screen entry-title-screen"
      id="entry-title-screen"
      data-testid="entry-title-screen"
      style="background-image:url('${V01B_UI_CHROME_URLS.entryTitleTerraceBackdrop}')"
    >
      <div class="entry-title-vignette"></div>
      <div class="entry-title-centerpiece">
        <div class="entry-title-emblem-ring">
          <img class="entry-title-seal-orb" src="${V01B_UI_CHROME_URLS.orbDantianStarCore}" alt="" />
        </div>
        <div class="entry-title-crest-wrap">
          <img class="entry-title-crest-bg" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
          <div class="entry-title-crest-content">
            <div class="entry-title-kicker">THIÊN MỆNH TIÊN CUNG • V01-B</div>
            <h1 class="entry-title-heading">TÔNG MÔN 8D: TU TIÊN CHI LỘ</h1>
            <div class="entry-title-subheading">TÔNG MÔN 8D: TU TIÊN CHI LỘ — THIÊN MỆNH TIÊN CUNG</div>
          </div>
        </div>
        <div class="entry-title-lore-plaque v01b-panel-tier2-navy">
          <p>Bước lên Thiên Mệnh Khởi Nguyên Đài, định danh đạo hiệu, gieo 3 Tiên Thiên Nghịch Thiên Cải Mệnh và khai mở hành trình vấn đạo giữa Bát Hoang.</p>
          ${bannerHtml}
          <div class="entry-title-cta-group">
            <button
              type="button"
              class="hud-btn gold entry-cta-primary v01b-btn-cinnabar"
              id="btn-entry-start-play"
              data-testid="entry-start-play-btn"
              ${opts.busy ? "disabled" : ""}
            >
              <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoCinnabar}" alt="" />
              <span>${opts.busy ? "Đang Câu Thông Thiên Đạo..." : "Bắt Đầu Chơi"}</span>
            </button>
            <button
              type="button"
              class="hud-btn entry-cta-secondary v01b-btn-jade"
              id="btn-entry-title-settings"
              data-testid="entry-title-settings-btn"
              ${opts.busy ? "disabled" : ""}
            >
              <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="" />
              <span>Cài Đặt Âm Thanh / Giao Diện</span>
            </button>
          </div>
        </div>
      </div>
      <div class="entry-title-footer">
        <span>Cảnh Giới Khởi Đầu: Phàm Nhân • 17 Đại Cảnh Giới Tu Tiên (Luyện Khí → Thánh Cảnh)</span>
      </div>
      ${settingsModalHtml}
    </div>
  `;
}

export interface RosterScreenRenderOptions {
  characters: CharacterRosterEntryDto[];
  selectedCharacterId: string | null;
  previewDirection: Direction;
  busy: boolean;
  statusBanner: { kind: "info" | "error" | "ok"; text: string } | null;
}

export function renderRosterScreenHtml(opts: RosterScreenRenderOptions): string {
  const selected =
    opts.characters.find((c) => c.characterId === opts.selectedCharacterId) ??
    opts.characters[0] ??
    null;

  const cardsHtml = opts.characters
    .map((c) => {
      const isSelected = selected?.characterId === c.characterId;
      const appDef =
        APPROVED_CHARACTER_V02_APPEARANCES.find((a) => a.id === c.appearanceId) ??
        APPROVED_CHARACTER_V02_APPEARANCES[0]!;
      const portraitSrc = resolveStarterPortraitUrl(c.appearanceId, appDef.portraitUrl);
      const realmLabel = formatRealmDisplay(c.realmId, c.realmStage);
      const zoneName = ZONES_REGISTRY[c.zoneId]?.nameVi ?? "Tân Thủ Thôn";
      const isConfirmed = c.creationState === "confirmed";
      const stateBadgeText = isConfirmed
        ? "Đã Ấn Định"
        : "Đang Khởi Tạo (Chưa Ấn Định)";
      const stateBadgeClass = isConfirmed ? "confirmed" : "draft";

      return `
        <button
          type="button"
          class="roster-char-card ${isSelected ? "selected" : ""}"
          data-testid="roster-character-card"
          data-character-id="${escapeHtml(c.characterId)}"
        >
          <div class="roster-char-portrait">
            <img src="${escapeHtml(portraitSrc)}" alt="${escapeHtml(c.name)}" />
          </div>
          <div class="roster-char-info">
            <div class="roster-char-top-row">
              <span class="roster-char-name">${escapeHtml(c.name)}</span>
              <span class="roster-char-level">Cấp ${c.level}</span>
            </div>
            <div class="roster-char-realm-row">
              <span class="roster-char-realm">${escapeHtml(realmLabel)}</span>
              <span class="roster-char-zone">${escapeHtml(zoneName)}</span>
            </div>
            <div class="roster-char-status-row">
              <span class="roster-status-badge ${stateBadgeClass}">${stateBadgeText}</span>
            </div>
          </div>
        </button>
      `;
    })
    .join("");

  const bannerHtml = opts.statusBanner
    ? `<div class="cc-status-banner ${opts.statusBanner.kind}" id="cc-status-banner" style="display:block;">${escapeHtml(opts.statusBanner.text)}</div>`
    : "";

  let stageHtml = "";
  let primaryActionBtnHtml = "";
  if (selected) {
    const appDef =
      APPROVED_CHARACTER_V02_APPEARANCES.find((a) => a.id === selected.appearanceId) ??
      APPROVED_CHARACTER_V02_APPEARANCES[0]!;
    const portraitSrc = resolveStarterPortraitUrl(selected.appearanceId, appDef.portraitUrl);
    const realmLabel = formatRealmDisplay(selected.realmId, selected.realmStage);
    const zoneName = ZONES_REGISTRY[selected.zoneId]?.nameVi ?? "Tân Thủ Thôn";
    const isConfirmed = selected.creationState === "confirmed";

    const innateHtml =
      isConfirmed && selected.innateTraitIds && selected.innateTraitIds.length === 3
        ? selected.innateTraitIds
            .map((traitId) => {
              const def = S1E_STARTER_DESTINY_CATALOG[traitId];
              const rarity = def?.rarity ?? "pham";
              const rarityLabel = DESTINY_RARITY_LABELS_VI[rarity];
              const iconUrl = resolveDestinyTraitIconUrl(traitId, 32);
              return `
                <span class="roster-destiny-pill rarity-${escapeHtml(rarity)}">
                  <img src="${escapeHtml(iconUrl)}" alt="" />
                  <span>[${escapeHtml(rarityLabel)}] ${escapeHtml(def?.displayNameVi ?? traitId)}</span>
                </span>
              `;
            })
            .join("")
        : `<span class="roster-destiny-pending">Chưa ấn định Tiên Thiên Khí Vận — Nhấn "Tiếp Tục Khởi Tạo — Gieo Tiên Thiên" để hoàn tất.</span>`;

    stageHtml = `
      <div class="roster-stage-header">
        <div class="roster-stage-name">${escapeHtml(selected.name)}</div>
        <div class="roster-stage-subtitle">
          ${escapeHtml(appDef.displayNameVi)} • Cấp ${selected.level} • 【${escapeHtml(realmLabel)}】 • ${escapeHtml(zoneName)} (${Math.round(selected.x)}, ${Math.round(selected.y)})
        </div>
      </div>
      <div class="cc-dais-showcase">
        <div class="cc-dais-portrait-crest">
          <img src="${escapeHtml(portraitSrc)}" alt="${escapeHtml(selected.name)}" />
        </div>
        <div class="cc-dais-pedestal-wrap">
          <canvas
            id="entry-sprite-preview-canvas"
            class="cc-dais-sprite-canvas"
            width="160"
            height="192"
          ></canvas>
          <img class="cc-dais-pedestal-img" src="${V01B_UI_CHROME_URLS.ccLotusPedestal}" alt="" />
        </div>
        <div class="cc-direction-controls">
          <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${opts.previewDirection === "down" ? "active" : ""}" data-preview-dir="down">Nam</button>
          <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${opts.previewDirection === "up" ? "active" : ""}" data-preview-dir="up">Bắc</button>
          <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${opts.previewDirection === "left" ? "active" : ""}" data-preview-dir="left">Tây</button>
          <button type="button" class="hud-btn v01b-btn-jade cc-dir-btn ${opts.previewDirection === "right" ? "active" : ""}" data-preview-dir="right">Đông</button>
        </div>
      </div>
      <div class="roster-stage-destiny-box">
        <div class="roster-stage-destiny-title">Tiên Thiên Khí Vận Đã Ấn Định:</div>
        <div class="roster-stage-destiny-list">${innateHtml}</div>
      </div>
    `;

    if (isConfirmed) {
      primaryActionBtnHtml = `
        <button
          type="button"
          class="hud-btn gold cc-btn-lg v01b-btn-cinnabar"
          id="btn-roster-enter-world"
          data-testid="roster-enter-world-btn"
          ${opts.busy ? "disabled" : ""}
        >
          <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoCinnabar}" alt="" />
          <span>Vào Thế Giới</span>
        </button>
      `;
    } else {
      primaryActionBtnHtml = `
        <button
          type="button"
          class="hud-btn gold cc-btn-lg v01b-btn-cinnabar"
          id="btn-roster-resume-draft"
          data-testid="roster-resume-draft-btn"
          ${opts.busy ? "disabled" : ""}
        >
          <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="" />
          <span>Tiếp Tục Khởi Tạo — Gieo Tiên Thiên</span>
        </button>
      `;
    }
  }

  return `
    <div
      class="entry-screen entry-roster-screen"
      id="entry-roster-screen"
      data-testid="entry-roster-screen"
      style="background-image:url('${V01B_UI_CHROME_URLS.entryTitleTerraceBackdrop}')"
    >
      <div class="entry-top-banner">
        <img class="entry-top-banner-img" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
        <div class="entry-top-banner-titles">
          <div class="entry-top-banner-main">DANH SÁCH ĐẠO THÂN — QUẢN LÝ NHÂN VẬT</div>
          <div class="entry-top-banner-sub">Chọn đạo thân để tiến vào Bát Hoang hoặc khởi tạo đạo thân mới trên cùng tài khoản</div>
        </div>
      </div>
      ${bannerHtml}
      <div class="entry-split-layout">
        <div class="entry-left-plaque v01b-panel-celestial-jade">
          <div class="entry-plaque-title">Danh Sách Đạo Thân (${opts.characters.length})</div>
          <div class="roster-card-list" id="roster-card-list">
            ${cardsHtml}
          </div>
          <div class="roster-left-footer">
            <button
              type="button"
              class="hud-btn primary cc-btn-lg v01b-btn-jade"
              id="btn-roster-create-new"
              data-testid="roster-create-new-btn"
              ${opts.busy ? "disabled" : ""}
            >
              <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="" />
              <span>Tạo Nhân Vật Mới</span>
            </button>
          </div>
        </div>
        <div class="entry-right-stage">
          ${stageHtml}
          <div class="entry-stage-action-bar">
            ${primaryActionBtnHtml}
            <button
              type="button"
              class="hud-btn cc-btn-lg v01b-btn-jade"
              id="btn-roster-back-title"
              data-testid="roster-back-title-btn"
              ${opts.busy ? "disabled" : ""}
            >
              <span>Về Màn Hình Chính</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderEnteringWorldScreenHtml(characterName: string): string {
  return `
    <div
      class="entry-screen entry-entering-world-screen"
      id="entry-entering-world-screen"
      data-testid="entry-entering-world-screen"
      style="background-image:url('${V01B_UI_CHROME_URLS.entryDestinyAstrolabeBackdrop}')"
    >
      <div class="entry-title-centerpiece">
        <div class="entry-title-emblem-ring">
          <img class="entry-title-seal-orb" src="${V01B_UI_CHROME_URLS.orbDantianStarCore}" alt="" />
        </div>
        <div class="entry-title-lore-plaque v01b-panel-tier2-navy">
          <div class="entry-top-banner-main">ĐANG KHAI MỞ TRUYỀN TỐNG TRẬN...</div>
          <p>Đạo thân <strong>${escapeHtml(characterName || "Đạo Hữu")}</strong> đang tiến vào Bát Hoang — Tân Thủ Thôn.</p>
        </div>
      </div>
    </div>
  `;
}
