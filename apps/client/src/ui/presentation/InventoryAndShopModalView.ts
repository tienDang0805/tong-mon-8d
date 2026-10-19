import type { CharacterSaveState, CharacterV02SnapshotPayload } from "@tong-mon-8d/shared";
import {
  ITEMS_REGISTRY,
  QUESTS_REGISTRY,
  RECIPES_REGISTRY,
  type ItemDefinition,
  type LegendaryNpcDefinition
} from "@tong-mon-8d/game-data";
import {
  V01B_UI_CHROME_URLS,
  resolveItemIconUrl,
  resolveItemSlotFrameUrl,
  resolveNpcPortraitUrl
} from "../../game/assets/RuntimeAssetBindings.js";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type InventoryCategoryTab =
  | "all"
  | "food"
  | "pill"
  | "ingredient"
  | "weapon"
  | "cook";

function matchesCategoryTab(def: ItemDefinition | undefined, tab: InventoryCategoryTab): boolean {
  if (!def || tab === "all" || tab === "cook") return true;
  if (tab === "food") return def.category === "food" || def.category === "beverage";
  if (tab === "pill") return def.category === "pill";
  if (tab === "ingredient") return def.category === "ingredient" || def.category === "material";
  if (tab === "weapon") return def.category === "equipment";
  return true;
}

export interface InventoryModalRenderOptions {
  selfState: CharacterSaveState | null;
  selfStateV02: CharacterV02SnapshotPayload | null;
  activeTab: InventoryCategoryTab;
  selectedItemId: string | null;
}

export function renderInventoryModalHtml(opts: InventoryModalRenderOptions): string {
  const inv = opts.selfState?.inventory ?? opts.selfStateV02?.world.inventory ?? [];
  const linhThach =
    opts.selfState?.linhThach ?? opts.selfStateV02?.world.linhThach ?? 0;

  const filteredInv = inv.filter((st) =>
    matchesCategoryTab(ITEMS_REGISTRY[st.itemId], opts.activeTab)
  );

  const selectedStack =
    filteredInv.find((st) => st.itemId === opts.selectedItemId) ??
    filteredInv[0] ??
    inv[0] ??
    null;
  const selectedDef = selectedStack ? ITEMS_REGISTRY[selectedStack.itemId] : undefined;

  const tabs: Array<{ id: InventoryCategoryTab; label: string }> = [
    { id: "all", label: "Tất Cả" },
    { id: "food", label: "Linh Thiện" },
    { id: "pill", label: "Đan Dược" },
    { id: "ingredient", label: "Nguyên Liệu" },
    { id: "weapon", label: "Pháp Bảo" },
    { id: "cook", label: "Linh Trù Chế Biến" }
  ];

  const tabsHtml = tabs
    .map((t) => {
      const isActive = opts.activeTab === t.id;
      const bgImg = isActive
        ? V01B_UI_CHROME_URLS.tabClaspActive
        : V01B_UI_CHROME_URLS.tabClaspInactive;
      return `
        <button
          type="button"
          class="v01b-tab-btn ${isActive ? "active" : ""}"
          data-inv-tab="${t.id}"
          data-testid="inventory-tab-${t.id}"
          style="background-image:url('${bgImg}')"
        >${escapeHtml(t.label)}</button>
      `;
    })
    .join("");

  const totalVisibleSlots = 30;
  const gridCells: string[] = [];
  for (let i = 0; i < totalVisibleSlots; i++) {
    const st = filteredInv[i];
    if (st) {
      const def = ITEMS_REGISTRY[st.itemId];
      const slotFrameUrl = resolveItemSlotFrameUrl(st.itemId);
      const iconUrl = resolveItemIconUrl(st.itemId, 64);
      const isSelected = selectedStack?.itemId === st.itemId;
      const canUse =
        def &&
        (def.category === "food" ||
          def.category === "beverage" ||
          def.category === "pill");
      gridCells.push(`
        <div
          class="v01b-reliquary-slot item-card ${isSelected ? "selected" : ""}"
          data-inv-item="${escapeHtml(st.itemId)}"
          data-testid="inventory-slot-${i}"
          style="background-image:url('${slotFrameUrl}')"
          title="${escapeHtml(def?.nameVi ?? st.itemId)} x${st.quantity}"
        >
          <img class="v01b-reliquary-slot-icon" src="${iconUrl}" alt="${escapeHtml(def?.nameVi ?? st.itemId)}" />
          <span class="v01b-reliquary-qty">x${st.quantity}</span>
          ${
            canUse
              ? `<button type="button" class="btn-use-item v01b-slot-quick-use" data-item="${escapeHtml(st.itemId)}" title="Sử dụng ${escapeHtml(def?.nameVi ?? st.itemId)}">Dùng</button>`
              : ""
          }
        </div>
      `);
    } else {
      gridCells.push(`
        <div
          class="v01b-reliquary-slot empty"
          data-testid="inventory-slot-${i}"
          style="background-image:url('/assets/ui/slots_and_rarity_frames/slot_item_pham_64.png')"
        ></div>
      `);
    }
  }

  let rightInspectionHtml = "";
  if (selectedStack && selectedDef) {
    const slotFrameUrl = resolveItemSlotFrameUrl(selectedStack.itemId);
    const iconUrl = resolveItemIconUrl(selectedStack.itemId, 64);
    const canUse =
      selectedDef.category === "food" ||
      selectedDef.category === "beverage" ||
      selectedDef.category === "pill";
    const effectParts: string[] = [];
    if (selectedDef.tuViGrant && selectedDef.tuViGrant > 0) {
      effectParts.push(`+${selectedDef.tuViGrant} Tu Vi Tức Thời`);
    }
    if (selectedDef.hpRestore && selectedDef.hpRestore > 0) {
      effectParts.push(`+${selectedDef.hpRestore} Sinh Lực`);
    }
    if (selectedDef.attackBonus && selectedDef.attackBonus > 0) {
      effectParts.push(`+${selectedDef.attackBonus} Công Kích`);
    }
    if (selectedDef.defenseBonus && selectedDef.defenseBonus > 0) {
      effectParts.push(`+${selectedDef.defenseBonus} Phòng Ngự`);
    }
    if (selectedDef.tuViMultiplier && selectedDef.tuViMultiplier > 1) {
      effectParts.push(`x${selectedDef.tuViMultiplier} Tốc Độ Tu Luyện`);
    }
    const effectSummary =
      effectParts.length > 0
        ? effectParts.join(" • ")
        : "Vật phẩm nguyên liệu / pháp bảo hộ thân";

    rightInspectionHtml = `
      <div class="v01b-inspect-icon-frame" style="background-image:url('${slotFrameUrl}')">
        <img src="${iconUrl}" alt="${escapeHtml(selectedDef.nameVi)}" />
      </div>
      <div class="v01b-inspect-rarity-pill">Số lượng: x${selectedStack.quantity}</div>
      <div class="v01b-inspect-title">${escapeHtml(selectedDef.nameVi)}</div>
      <div class="v01b-inspect-desc">${escapeHtml(selectedDef.descriptionVi)}</div>
      <div class="v01b-inspect-effects">✦ ${escapeHtml(effectSummary)}</div>
      <div class="v01b-inspect-actions">
        ${
          canUse
            ? `
              <button
                type="button"
                class="hud-btn gold btn-use-item v01b-btn-cinnabar"
                data-item="${escapeHtml(selectedStack.itemId)}"
                data-testid="inventory-use-selected-btn"
              >
                <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="" />
                <span>Sử Dụng</span>
              </button>
            `
            : `<span class="v01b-inspect-nonconsumable">Vật phẩm chế biến / hộ thân</span>`
        }
      </div>
    `;
  } else {
    rightInspectionHtml = `
      <div class="v01b-inspect-empty">
        <img src="${V01B_UI_CHROME_URLS.orbTuViCore64}" alt="" />
        <div class="v01b-inspect-title">Túi Càn Khôn</div>
        <div class="v01b-inspect-desc">Chọn một vật phẩm trong 30 ô bảo khố bên trái để xem chi tiết công hiệu, hoặc tới Quán Mì Linh Thiện của Lão Trù Trương [E].</div>
      </div>
    `;
  }

  const recipes = Object.values(RECIPES_REGISTRY);
  const cookRecipesHtml = recipes
    .map((r) => {
      const ingHtml = r.ingredients
        .map((ing) => {
          const owned =
            inv.find((s) => s.itemId === ing.itemId)?.quantity ?? 0;
          const ingName = ITEMS_REGISTRY[ing.itemId]?.nameVi ?? ing.itemId;
          const ingIcon = resolveItemIconUrl(ing.itemId, 32);
          return `<span class="v01b-recipe-ing-pill ${owned >= ing.quantity ? "ready" : "missing"}"><img src="${ingIcon}" alt="" /> ${escapeHtml(ingName)} (${owned}/${ing.quantity})</span>`;
        })
        .join("");
      const dishIconUrl = resolveItemIconUrl(r.outputItemId, 64);
      const dishSlotUrl = resolveItemSlotFrameUrl(r.outputItemId);
      return `
        <div class="item-card v01b-item-card v01b-recipe-row" data-recipe-card="${escapeHtml(r.id)}">
          <div class="v01b-item-row">
            <div class="v01b-item-slot" style="background-image:url('${dishSlotUrl}')">
              <img src="${dishIconUrl}" alt="${escapeHtml(r.nameVi)}" />
            </div>
            <div style="flex:1;">
              <div class="item-card-title">${escapeHtml(r.nameVi)} (+${r.tuViReward} Tu Vi)</div>
              <div class="v01b-recipe-ing-list">${ingHtml}</div>
            </div>
          </div>
          <button type="button" class="hud-btn gold btn-cook-recipe v01b-btn-cinnabar" data-recipe="${escapeHtml(r.id)}">
            Nấu Linh Thiện
          </button>
        </div>
      `;
    })
    .join("");

  const showCookSection = opts.activeTab === "cook" || opts.activeTab === "all";

  return `
    <div class="hud-modal-backdrop" id="modal-backdrop">
      <div
        class="hud-modal v01b-reliquary-modal v01b-panel-celestial-jade"
        id="inventory-modal"
        data-testid="inventory-reliquary-modal"
      >
        <div class="v01b-triptych-header">
          <div class="v01b-triptych-crest-wrap">
            <img class="v01b-triptych-crest-bg" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
            <div class="v01b-triptych-crest-titles">
              <div class="v01b-triptych-main-title">TÚI CÀN KHÔN — TIÊN CUNG BẢO KHỐ</div>
              <div class="v01b-triptych-sub-title">Hành Trang Linh Vật &amp; Bếp Linh Trù Bát Hoang [I]</div>
            </div>
          </div>
          <button type="button" class="hud-btn v01b-btn-jade" id="btn-close-modal" data-testid="close-inventory-modal-btn">Đóng [ESC]</button>
        </div>

        <div class="v01b-tab-bar" id="inventory-tab-bar">
          ${tabsHtml}
        </div>

        <div class="v01b-reliquary-body">
          <div class="v01b-reliquary-left">
            <div class="v01b-reliquary-grid" id="inventory-bag-grid">
              ${gridCells.join("")}
            </div>
            ${
              showCookSection
                ? `
                  <div class="v01b-cook-cauldron-panel">
                    <div class="v01b-destiny-subhead">✦ Bếp Linh Trù Bát Hoang (Ẩm Thực Đại Đạo) ✦</div>
                    <div class="v01b-cook-grid" id="inventory-cook-grid">
                      ${cookRecipesHtml}
                    </div>
                  </div>
                `
                : ""
            }
          </div>

          <div
            class="v01b-reliquary-inspect-scroll"
            style="background-image:url('${V01B_UI_CHROME_URLS.frameIvoryScroll}')"
          >
            ${rightInspectionHtml}
          </div>
        </div>

        <div class="v01b-reliquary-footer">
          <div class="v01b-footer-currency">
            <img class="hud-inline-icon" src="${V01B_UI_CHROME_URLS.currencyLinhThach32}" alt="" />
            <strong>${linhThach} Linh Thạch</strong>
          </div>
          <div class="v01b-footer-slots">
            <span>Dung Lượng Bảo Khố: <strong>${inv.length} / 30 Ô</strong></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderNpcDialogueModalHtml(
  npc: LegendaryNpcDefinition,
  selfState: CharacterSaveState | null
): string {
  const phiQuest = QUESTS_REGISTRY.phi_de_ch1_huong_thom;
  const qState = selfState?.quests[phiQuest.id]?.status ?? "not_started";
  const qMarkerIcon =
    qState === "completed"
      ? V01B_UI_CHROME_URLS.questMarkerTurnin
      : qState === "active"
        ? V01B_UI_CHROME_URLS.questMarkerActive
        : V01B_UI_CHROME_URLS.questMarkerAvailable;

  const portraitUrl = resolveNpcPortraitUrl(npc.id);
  const realmBadgeText =
    npc.id === "dam_lon_tien_tu"
      ? "[Cảnh Giới: UNKNOWN / Bất Minh]"
      : `[Cảnh Giới: ${npc.realmDisplayVi}]`;

  let actionsHtml = "";
  if (npc.id === "phi_de") {
    const eligibleOwned = phiQuest.eligibleItemIds.filter((id) =>
      (selfState?.inventory ?? []).some((st) => st.itemId === id && st.quantity > 0)
    );
    actionsHtml = `
      <div class="item-card v01b-quest-card">
        <div class="v01b-quest-card-head">
          <img class="hud-quest-marker-icon" src="${qMarkerIcon}" alt="" />
          <div class="item-card-title">${escapeHtml(phiQuest.titleVi)} (${qState === "completed" ? "Đã Hoàn Thành" : qState === "active" ? "Đang Thực Hiện" : "Chưa Nhận"})</div>
        </div>
        <div class="item-card-desc">${escapeHtml(phiQuest.summaryVi)}</div>
        <div class="hud-btn-group" style="justify-content:flex-start; margin-top:6px;">
          ${
            qState === "not_started"
              ? `<button type="button" class="hud-btn primary v01b-btn-jade" id="btn-quest-accept" data-testid="npc-quest-accept-btn">Nhận Cơ Duyên Vạn Vị Thành Đạo</button>`
              : ""
          }
          ${
            qState !== "completed"
              ? eligibleOwned
                  .map(
                    (itemId) =>
                      `<button type="button" class="hud-btn gold btn-quest-submit v01b-btn-cinnabar" data-item="${itemId}" data-testid="npc-quest-submit-${itemId}">Dâng ${escapeHtml(ITEMS_REGISTRY[itemId]?.nameVi ?? itemId)}</button>`
                  )
                  .join("") || `<button type="button" class="hud-btn v01b-btn-jade" id="btn-quest-submit-any">Dâng Món Ăn Lên Phì Đế</button>`
              : `<span class="buff-pill">✦ Đã nhận Thực Đạo Kim Quang Chúc Phúc</span>`
          }
        </div>
      </div>
    `;
  } else if (npc.id === "merchant_truong") {
    const shopItems = Object.values(ITEMS_REGISTRY).filter((i) => i.buyPriceLinhThach !== null);
    actionsHtml = `
      <div class="v01b-shop-section">
        <div class="v01b-destiny-subhead">✦ Quán Mì Linh Thiện — Giao Dịch Thủ Công ✦</div>
        <div class="v01b-shop-rows">
          ${shopItems
            .map((item) => {
              const slotFrameUrl = resolveItemSlotFrameUrl(item.id);
              const itemIconUrl = resolveItemIconUrl(item.id, 64);
              return `
                <div class="item-card v01b-item-card v01b-shop-row" data-shop-item="${escapeHtml(item.id)}">
                  <div class="v01b-item-row">
                    <div class="v01b-item-slot" style="background-image:url('${slotFrameUrl}')">
                      <img src="${itemIconUrl}" alt="${escapeHtml(item.nameVi)}" />
                    </div>
                    <div style="flex:1;">
                      <div class="item-card-title">${escapeHtml(item.nameVi)}</div>
                      <div class="item-card-desc">${escapeHtml(item.descriptionVi)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="hud-btn gold btn-shop-buy v01b-btn-cinnabar"
                    data-item="${escapeHtml(item.id)}"
                    data-testid="shop-buy-${escapeHtml(item.id)}"
                  >
                    <img class="hud-inline-icon" src="${V01B_UI_CHROME_URLS.currencyLinhThach32}" alt="" />
                    <span>Mua (${item.buyPriceLinhThach} Linh Thạch)</span>
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  return `
    <div class="hud-modal-backdrop" id="modal-backdrop">
      <div
        class="hud-modal v01b-npc-dialogue-modal v01b-panel-celestial-jade"
        id="npc-dialogue-modal"
        data-testid="npc-dialogue-modal"
      >
        <div class="v01b-triptych-header">
          <div class="v01b-triptych-crest-wrap">
            <img class="v01b-triptych-crest-bg" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
            <div class="v01b-triptych-crest-titles">
              <div class="v01b-triptych-main-title">${escapeHtml(npc.nameVi)} — ${escapeHtml(npc.titleVi)}</div>
              <div class="v01b-triptych-sub-title">${escapeHtml(realmBadgeText)} • Đại Đạo: ${escapeHtml(npc.daoNameVi)}</div>
            </div>
          </div>
          <button type="button" class="hud-btn v01b-btn-jade" id="btn-close-modal" data-testid="close-npc-modal-btn">Đóng [ESC]</button>
        </div>

        <div class="v01b-npc-dialogue-columns">
          <div class="v01b-npc-lotus-portrait-stage">
            <div class="v01b-npc-lotus-halo">
              <img src="${escapeHtml(portraitUrl)}" alt="${escapeHtml(npc.nameVi)}" />
            </div>
            <div class="v01b-npc-name-plaque">${escapeHtml(npc.nameVi)}</div>
            <div class="v01b-npc-realm-plaque" data-testid="npc-realm-badge">${escapeHtml(realmBadgeText)}</div>
          </div>

          <div
            class="v01b-npc-ivory-scroll"
            style="background-image:url('${V01B_UI_CHROME_URLS.frameIvoryScroll}')"
          >
            <div class="v01b-npc-scroll-realm-head">${escapeHtml(realmBadgeText)}</div>
            ${npc.greetingLinesVi
              .map((line) => `<div class="npc-speech-box">“${escapeHtml(line)}”</div>`)
              .join("")}
            ${actionsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

export interface EscSystemMenuRenderOptions {
  characterName: string;
  realmDisplay: string;
  isMuted: boolean;
  isMinimapExpanded: boolean;
  settingsSubViewOpen: boolean;
}

export function renderEscSystemMenuModalHtml(opts: EscSystemMenuRenderOptions): string {
  const settingsSubPanelHtml = opts.settingsSubViewOpen
    ? `
      <div class="v01b-esc-settings-box" data-testid="esc-settings-subpanel">
        <div class="v01b-settings-row">
          <span>Âm Thanh &amp; Cổ Cầm:</span>
          <button type="button" class="hud-btn v01b-btn-jade" id="btn-esc-toggle-mute" data-testid="esc-toggle-audio-btn">
            ${opts.isMuted ? "🔇 Đang Tắt (Nhấn Để Bật)" : "🔊 Đang Bật (Nhấn Để Tắt)"}
          </button>
        </div>
        <div class="v01b-settings-row">
          <span>Kích Thước La Bàn Bản Đồ:</span>
          <button type="button" class="hud-btn v01b-btn-jade" id="btn-esc-toggle-minimap" data-testid="esc-toggle-minimap-btn">
            ${opts.isMinimapExpanded ? "Thu Nhỏ Bản Đồ" : "Phóng To Bản Đồ"}
          </button>
        </div>
      </div>
    `
    : "";

  return `
    <div class="hud-modal-backdrop" id="modal-backdrop">
      <div
        class="hud-modal v01b-esc-menu-modal v01b-panel-celestial-jade"
        id="ingame-esc-menu"
        data-testid="ingame-esc-menu"
      >
        <div class="v01b-triptych-header">
          <div class="v01b-triptych-crest-wrap">
            <img class="v01b-triptych-crest-bg" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
            <div class="v01b-triptych-crest-titles">
              <div class="v01b-triptych-main-title">THIÊN MỆNH HỆ THỐNG</div>
              <div class="v01b-triptych-sub-title">${escapeHtml(opts.characterName)} • 【${escapeHtml(opts.realmDisplay)}】</div>
            </div>
          </div>
          <button type="button" class="hud-btn v01b-btn-jade" id="btn-close-modal">Đóng [ESC]</button>
        </div>

        <div class="v01b-esc-actions-list">
          <button
            type="button"
            class="hud-btn gold cc-btn-lg v01b-btn-cinnabar v01b-esc-action-btn"
            id="btn-esc-resume"
            data-testid="esc-resume-btn"
          >
            <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="" />
            <span>Tiếp Tục Hành Trình</span>
          </button>
          <button
            type="button"
            class="hud-btn primary cc-btn-lg v01b-btn-jade v01b-esc-action-btn"
            id="btn-esc-switch-character"
            data-testid="esc-switch-character-btn"
          >
            <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoGoldLotus}" alt="" />
            <span>Đổi Nhân Vật / Quản Lý Đạo Thân</span>
          </button>
          <button
            type="button"
            class="hud-btn cc-btn-lg v01b-btn-jade v01b-esc-action-btn"
            id="btn-esc-settings"
            data-testid="esc-settings-btn"
          >
            <span>Cài Đặt Âm Thanh &amp; Hiển Thị</span>
          </button>
          ${settingsSubPanelHtml}
          <button
            type="button"
            class="hud-btn cc-btn-lg v01b-btn-cinnabar v01b-esc-action-btn"
            id="btn-esc-return-title"
            data-testid="esc-return-title-btn"
          >
            <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoCinnabar}" alt="" />
            <span>Về Màn Hình Chính</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
