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
  resolveEquipmentSlotIconUrl,
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
  | "weapon"
  | "pill"
  | "food"
  | "ingredient"
  | "cook";

function matchesCategoryTab(def: ItemDefinition | undefined, tab: InventoryCategoryTab): boolean {
  if (!def || tab === "all" || tab === "cook") return true;
  if (tab === "food") return def.category === "food" || def.category === "beverage";
  if (tab === "pill") return def.category === "pill";
  if (tab === "ingredient") return def.category === "ingredient" || def.category === "material";
  if (tab === "weapon") return def.category === "equipment";
  return true;
}

export interface PaperdollSlotSpec {
  slotKey: string;
  labelVi: string;
  positionClass: string;
  defaultBonusVi: string;
  defaultDescVi: string;
}

export const PAPERDOLL_EQUIPMENT_SLOTS: readonly PaperdollSlotSpec[] = [
  {
    slotKey: "phap_bao",
    labelVi: "Pháp Bảo",
    positionClass: "pd-slot-top",
    defaultBonusVi: "+15 Linh Lực • Hộ Đạo Linh Quang",
    defaultDescVi: "Hồ lô bản mệnh ôn dưỡng trong đan điền, trấn giữ thần hồn và tụ nạp linh khí thiên địa."
  },
  {
    slotKey: "mao_quan",
    labelVi: "Mão Quán",
    positionClass: "pd-slot-left-1",
    defaultBonusVi: "+6 Phòng Ngự Pháp Thuật",
    defaultDescVi: "Kim quan ngọc đới buộc tóc của đệ tử nội môn, giúp thanh tâm ngưng thần."
  },
  {
    slotKey: "dao_bao",
    labelVi: "Đạo Bào",
    positionClass: "pd-slot-left-2",
    defaultBonusVi: "+12 Phòng Ngự • +30 Sinh Lực",
    defaultDescVi: "Thanh Vân Đạo Y dệt từ tơ linh tằm Bát Hoang, nhẹ tựa mây trôi, hộ thể trước yêu tà."
  },
  {
    slotKey: "chien_hai",
    labelVi: "Chiến Hài",
    positionClass: "pd-slot-left-3",
    defaultBonusVi: "+4 Thân Pháp • Bộ Hành Thanh Phong",
    defaultDescVi: "Hài vải thêu vân văn tẩm linh dịch, giúp bước chân nhẹ nhàng vững chãi."
  },
  {
    slotKey: "binh_khi",
    labelVi: "Binh Khí",
    positionClass: "pd-slot-right-1",
    defaultBonusVi: "+10 Công Kích",
    defaultDescVi: "Trường kiếm nhập môn của đệ tử Tông Môn 8D."
  },
  {
    slotKey: "ho_uyen",
    labelVi: "Hộ Uyển",
    positionClass: "pd-slot-right-2",
    defaultBonusVi: "+5 Công Vật Lý • +4 Phòng Ngự",
    defaultDescVi: "Hộ uyển khảm ngọc bích gia cố cổ tay khi vung kiếm và bắt ấn quyết."
  },
  {
    slotKey: "yeu_dai",
    labelVi: "Yêu Đái",
    positionClass: "pd-slot-right-3",
    defaultBonusVi: "+25 Sinh Lực • Khóa Linh Khí",
    defaultDescVi: "Đai lưng kim tuyến thắt chặt đạo bào, giữ khí tức đan điền không tán loạn."
  },
  {
    slotKey: "ngoc_boi",
    labelVi: "Ngọc Bội",
    positionClass: "pd-slot-bottom",
    defaultBonusVi: "+8 Linh Tính • Tịnh Tâm",
    defaultDescVi: "Ngọc bội Thanh Vân truyền đời, phát ra linh quang ôn nhuận bảo vệ tâm mạch."
  }
];

export interface InventoryModalRenderOptions {
  selfState: CharacterSaveState | null;
  selfStateV02: CharacterV02SnapshotPayload | null;
  activeTab: InventoryCategoryTab;
  selectedItemId: string | null;
  equippedWeaponId?: string | null;
}

export function renderInventoryModalHtml(opts: InventoryModalRenderOptions): string {
  const inv = opts.selfState?.inventory ?? opts.selfStateV02?.world.inventory ?? [];
  const linhThach =
    opts.selfState?.linhThach ?? opts.selfStateV02?.world.linhThach ?? 0;

  const filteredInv = inv.filter((st) =>
    matchesCategoryTab(ITEMS_REGISTRY[st.itemId], opts.activeTab)
  );

  const hasStarterSword = inv.some((st) => st.itemId === "thanh_van_kiem_so_cap" && st.quantity > 0);
  const effectiveEquippedWeaponId =
    opts.equippedWeaponId !== undefined
      ? opts.equippedWeaponId
      : hasStarterSword
        ? "thanh_van_kiem_so_cap"
        : null;

  const selectedStack =
    filteredInv.find((st) => st.itemId === opts.selectedItemId) ??
    inv.find((st) => st.itemId === opts.selectedItemId) ??
    filteredInv[0] ??
    inv[0] ??
    null;
  const selectedDef = selectedStack ? ITEMS_REGISTRY[selectedStack.itemId] : undefined;

  const tabs: Array<{ id: InventoryCategoryTab; label: string; categoryAttr?: string }> = [
    { id: "all", label: "Tất Cả" },
    { id: "weapon", label: "Pháp Bảo" },
    { id: "pill", label: "Đan Dược" },
    { id: "food", label: "Linh Thiện" },
    { id: "ingredient", label: "Nguyên Liệu" },
    { id: "cook", label: "Linh Trù", categoryAttr: "cooking" }
  ];

  const tabsHtml = tabs
    .map((t) => {
      const isActive = opts.activeTab === t.id;
      return `
        <button
          type="button"
          class="v01b-tab-btn ${isActive ? "active" : ""}"
          data-inv-tab="${t.id}"
          ${t.categoryAttr ? `data-inv-category="${t.categoryAttr}"` : ""}
          data-testid="inventory-tab-${t.id}"
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

  const paperdollSlotsHtml = PAPERDOLL_EQUIPMENT_SLOTS.map((slot) => {
    const isWeaponEquipped =
      slot.slotKey === "binh_khi" && Boolean(effectiveEquippedWeaponId);
    const iconUrl =
      isWeaponEquipped && effectiveEquippedWeaponId
        ? resolveItemIconUrl(effectiveEquippedWeaponId, 64)
        : resolveEquipmentSlotIconUrl(slot.slotKey, 64);
    const frameUrl = isWeaponEquipped
      ? "/assets/ui/slots_and_rarity_frames/slot_item_linh_64.png"
      : "/assets/ui/slots_and_rarity_frames/slot_item_hoang_64.png";

    return `
      <div
        class="v01b-paperdoll-slot-wrap ${slot.positionClass} ${isWeaponEquipped ? "is-equipped" : ""}"
        data-equip-slot="${slot.slotKey}"
        data-testid="paperdoll-slot-${slot.slotKey}"
        title="${escapeHtml(slot.labelVi)}: ${escapeHtml(slot.defaultBonusVi)}"
      >
        <div
          class="v01b-paperdoll-slot-box"
          style="background-image:url('${frameUrl}')"
        >
          <img class="v01b-paperdoll-slot-icon" src="${iconUrl}" alt="${escapeHtml(slot.labelVi)}" />
        </div>
        <span class="v01b-paperdoll-slot-label">${escapeHtml(slot.labelVi)}</span>
      </div>
    `;
  }).join("");

  let rightInspectionHtml = "";
  if (selectedStack && selectedDef) {
    const slotFrameUrl = resolveItemSlotFrameUrl(selectedStack.itemId);
    const iconUrl = resolveItemIconUrl(selectedStack.itemId, 64);
    const canUse =
      selectedDef.category === "food" ||
      selectedDef.category === "beverage" ||
      selectedDef.category === "pill";
    const isEquipment = selectedDef.category === "equipment";
    const isCurrentlyEquipped = effectiveEquippedWeaponId === selectedStack.itemId;

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
      <div class="v01b-inspect-rarity-pill">
        Số lượng: x${selectedStack.quantity}${isCurrentlyEquipped ? " • [Đang Trang Bị]" : ""}
      </div>
      <div class="v01b-inspect-title">${escapeHtml(selectedDef.nameVi)}</div>
      <div class="v01b-inspect-desc">${escapeHtml(selectedDef.descriptionVi)}</div>
      <div class="v01b-inspect-effects">✦ ${escapeHtml(effectSummary)}</div>
      <div class="v01b-inspect-actions v01b-inspect-dual-btns">
        <button
          type="button"
          class="hud-btn gold v01b-scroll-action-btn btn-equip-item"
          id="btn-equip-selected-item"
          data-item="${escapeHtml(selectedStack.itemId)}"
          data-testid="inventory-equip-selected-btn"
          ${isEquipment ? "" : "disabled"}
        >
          <span>${isEquipment && isCurrentlyEquipped ? "Tháo Trang Bị" : "Trang Bị"}</span>
        </button>
        <button
          type="button"
          class="hud-btn gold btn-use-item v01b-scroll-action-btn"
          id="btn-use-selected-item"
          data-item="${escapeHtml(selectedStack.itemId)}"
          data-testid="inventory-use-selected-btn"
          ${canUse ? "" : "disabled"}
        >
          <span>Sử Dụng</span>
        </button>
      </div>
    `;
  } else {
    rightInspectionHtml = `
      <div class="v01b-inspect-empty">
        <img src="${V01B_UI_CHROME_URLS.orbTuViCore64}" alt="" />
        <div class="v01b-inspect-title">Túi Càn Khôn</div>
        <div class="v01b-inspect-desc">Chọn một vật phẩm trong 30 ô bảo khố bên trái hoặc ô trang bị ở giữa để xem chi tiết.</div>
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

  const showCookOverlay = opts.activeTab === "cook";

  return `
    <div class="hud-modal-backdrop" id="modal-backdrop">
      <div
        class="hud-modal v01b-reliquary-modal v01b-i-option-c-modal v01b-panel-celestial-jade"
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

        <div class="v01b-reliquary-body v01b-i-option-c-body">
          <section class="v01b-i-left-bag-col">
            <div class="v01b-tab-bar v01b-i-left-tabs" id="inventory-tab-bar">
              ${tabsHtml}
            </div>

            <div class="v01b-i-bag-panel-box">
              ${
                showCookOverlay
                  ? `
                    <div class="v01b-cook-cauldron-panel">
                      <div class="v01b-destiny-subhead">✦ Bếp Linh Trù Bát Hoang (Ẩm Thực Đại Đạo) ✦</div>
                      <div class="v01b-cook-grid" id="inventory-cook-grid">
                        ${cookRecipesHtml}
                      </div>
                    </div>
                  `
                  : `
                    <div class="v01b-reliquary-grid" id="inventory-bag-grid">
                      ${gridCells.join("")}
                    </div>
                  `
              }
            </div>

            <div class="v01b-reliquary-footer v01b-i-left-footer">
              <div class="v01b-footer-currency">
                <img class="hud-inline-icon" src="${V01B_UI_CHROME_URLS.currencyLinhThach32}" alt="" />
                <strong>${linhThach} Linh Thạch</strong>
              </div>
              <div class="v01b-footer-slots">
                <span>👜 <strong>${inv.length} / 30 Ô</strong></span>
              </div>
            </div>
          </section>

          <section
            class="v01b-i-center-paperdoll-col"
            id="inventory-equipment-paperdoll"
            data-testid="inventory-equipment-paperdoll"
          >
            <div class="v01b-paperdoll-circuit-ring"></div>
            <div
              class="v01b-paperdoll-lotus-figure"
              style="background-image:url('${V01B_UI_CHROME_URLS.inventoryPaperdollLotusStage}')"
            ></div>
            ${paperdollSlotsHtml}
          </section>

          <section class="v01b-reliquary-inspect-scroll v01b-i-right-scroll-col">
            ${rightInspectionHtml}
          </section>
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

          <div class="v01b-npc-ivory-scroll">
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
        <div class="v01b-triptych-header v01b-esc-header">
          <div class="v01b-triptych-crest-wrap">
            <img class="v01b-triptych-crest-bg" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
            <div class="v01b-triptych-crest-titles">
              <div class="v01b-triptych-main-title">THIÊN MỆNH HỆ THỐNG</div>
              <div class="v01b-triptych-sub-title">${escapeHtml(opts.characterName)} • 【${escapeHtml(opts.realmDisplay)}】</div>
            </div>
          </div>
          <button type="button" class="hud-btn v01b-btn-jade v01b-esc-close-btn" id="btn-close-modal">Đóng [ESC]</button>
        </div>

        <div class="v01b-esc-status-card">
          <div class="v01b-esc-status-head">
            <img class="hud-inline-icon" src="${V01B_UI_CHROME_URLS.orbDantianStarCore}" alt="" />
            <span>Đạo Thân Đang Hành Tẩu: <strong>${escapeHtml(opts.characterName)}</strong></span>
          </div>
          <div class="v01b-esc-hotkeys-grid">
            <span><strong>[C]</strong> Nội Thị Đồ</span>
            <span><strong>[I]</strong> Túi Càn Khôn</span>
            <span><strong>[Q]</strong> Tự Hành Chỉ Dẫn</span>
            <span><strong>[E / F]</strong> Đàm Đạo / Nhặt</span>
          </div>
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
