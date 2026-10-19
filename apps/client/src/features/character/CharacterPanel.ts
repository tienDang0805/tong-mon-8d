import type {
  BaseAttributeKey,
  CharacterSaveState,
  CharacterV02SnapshotPayload
} from "@tong-mon-8d/shared";
import {
  APPROVED_CHARACTER_V02_APPEARANCES,
  BASE_ATTRIBUTE_KEYS,
  BASE_ATTRIBUTE_LABELS_VI,
  DESTINY_RARITY_LABELS_VI,
  LEGENDARY_NPCS,
  REALM_PROGRESSION,
  S1E_STARTER_DESTINY_CATALOG,
  formatDestinyTraitBonusSummaryVi,
  formatRealmDisplay,
  getCandidateExpToNextLevelDecimal,
  getRealmRequiredTuVi,
  isAtNonSaintMajorRealmLevelCap
} from "@tong-mon-8d/game-data";
import {
  V01B_UI_CHROME_URLS,
  resolveAttributeIconUrl,
  resolveDestinyTraitIconUrl,
  resolveStarterPortraitUrl
} from "../../game/assets/RuntimeAssetBindings.js";
import type { GameNetworkClient } from "../../network/GameNetworkClient.js";

export interface CharacterPanelHost {
  modalHost: HTMLElement;
  net: GameNetworkClient;
  onCloseModal: () => void;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HEXAGRAM_VERTEX_CLASSES: Record<BaseAttributeKey, string> = {
  the_phach: "hex-vertex-top",
  luc_dao: "hex-vertex-top-left",
  linh_tinh: "hex-vertex-top-right",
  than_phap: "hex-vertex-bottom-left",
  than_thuc: "hex-vertex-bottom-right",
  ngo_tinh: "hex-vertex-bottom"
};

export function renderCharacterPanelModal(
  host: CharacterPanelHost,
  selfState?: CharacterSaveState | null,
  selfStateV02?: CharacterV02SnapshotPayload | null
): void {
  const p = selfState ?? host.net.selfState;
  const v02 = selfStateV02 ?? host.net.selfStateV02;
  const realmId = v02?.cultivation.realmId ?? p?.realmId ?? "pham_nhan";
  const realmStage = v02?.cultivation.realmStage ?? p?.realmStage ?? 1;
  const reqTuVi = getRealmRequiredTuVi(realmId, realmStage);
  const realmLabel = formatRealmDisplay(realmId, realmStage);

  const curRealmIdx = REALM_PROGRESSION.findIndex((r) => r.id === realmId);
  const nextRealmDef =
    curRealmIdx >= 0 && curRealmIdx + 1 < REALM_PROGRESSION.length
      ? REALM_PROGRESSION[curRealmIdx + 1]
      : null;
  const nextRealmNameVi = nextRealmDef?.nameVi ?? "Đỉnh Phong";

  const level = v02?.levelProgress.level ?? p?.level ?? 1;
  const majorCapLevel =
    realmId === "pham_nhan" ? 10 : Math.max(10, 10 + Math.max(1, curRealmIdx) * 20);
  const expNow = v02?.levelProgress.expTowardNext ?? "0";
  const expNext = getCandidateExpToNextLevelDecimal(level) ?? "100";
  const atCap = isAtNonSaintMajorRealmLevelCap(realmId, level);
  const expPct = atCap
    ? 100
    : Math.min(100, Math.round((Number(expNow) / Math.max(1, Number(expNext))) * 100));
  const curTuVi = p?.tuVi ?? Number(v02?.cultivation.tuVi ?? 0);
  const tuViPct = Math.min(100, Math.round((curTuVi / Math.max(1, reqTuVi)) * 100));
  const freePts = v02?.levelProgress.freeAttributePoints ?? 0;

  const appDef =
    APPROVED_CHARACTER_V02_APPEARANCES.find(
      (a) => a.id === (v02?.identity.appearanceId ?? p?.appearanceId)
    ) ?? APPROVED_CHARACTER_V02_APPEARANCES[0]!;
  const portraitSrc = resolveStarterPortraitUrl(appDef.id, appDef.portraitUrl);

  const originAttrs = v02?.attributes?.origin ?? {
    the_phach: 5,
    luc_dao: 5,
    linh_tinh: 5,
    than_phap: 5,
    than_thuc: 5,
    ngo_tinh: 5
  };
  const destinyBonuses = v02?.attributes?.destinyBonuses ?? {
    the_phach: 0,
    luc_dao: 0,
    linh_tinh: 0,
    than_phap: 0,
    than_thuc: 0,
    ngo_tinh: 0
  };
  const effectiveAttrs = v02?.attributes?.effective ?? originAttrs;

  const hexagramVerticesHtml = BASE_ATTRIBUTE_KEYS.map((key) => {
    const labelVi = BASE_ATTRIBUTE_LABELS_VI[key];
    const origVal = originAttrs[key];
    const allocVal = v02?.levelProgress.allocated[key] ?? 0;
    const destVal = destinyBonuses[key];
    const effVal = effectiveAttrs[key];
    const iconUrl = resolveAttributeIconUrl(key, 64);
    const plusBtnImg =
      freePts > 0 ? V01B_UI_CHROME_URLS.buttonPlusReady : V01B_UI_CHROME_URLS.buttonPlusDisabled;
    const vertexClass = HEXAGRAM_VERTEX_CLASSES[key];

    return `
      <div
        class="v01b-hex-vertex item-card char-attr-card ${vertexClass}"
        data-attr-card="${key}"
      >
        <div class="v01b-hex-label">${escapeHtml(labelVi)}</div>
        <div class="v01b-hex-medallion-wrap">
          <img class="v01b-hex-medallion-img" src="${iconUrl}" alt="${escapeHtml(labelVi)}" />
          <span class="char-attr-effective v01b-hex-value">${effVal}</span>
          <button
            type="button"
            class="btn-allocate-attr v01b-btn-plus-alloc ${freePts > 0 ? "ready" : "disabled"}"
            data-testid="allocate-attr-${key}"
            data-attr="${key}"
            title="Cộng +1 ${escapeHtml(labelVi)}"
            style="background-image:url('${plusBtnImg}')"
            ${freePts > 0 ? "" : "disabled"}
          >+</button>
        </div>
        <div class="v01b-hex-breakdown">
          Gốc ${origVal}${allocVal > 0 ? ` (+${allocVal})` : ""}${destVal !== 0 ? ` • Mệnh +${destVal}` : ""}
        </div>
      </div>
    `;
  }).join("");

  const innateIds = v02?.destiny?.innate ?? [];
  const innateCardsHtml =
    innateIds.length === 3
      ? innateIds
          .map((traitId, idx) => {
            const def = S1E_STARTER_DESTINY_CATALOG[traitId];
            const rarity = def?.rarity ?? "pham";
            const rarityLabel = DESTINY_RARITY_LABELS_VI[rarity];
            const emblemUrl = resolveDestinyTraitIconUrl(traitId, 64);
            const bonusText = def ? formatDestinyTraitBonusSummaryVi(def) : "";
            const npc = def?.legendaryNpcId
              ? LEGENDARY_NPCS.find((n) => n.id === def.legendaryNpcId)
              : null;
            return `
              <div
                class="item-card char-destiny-slot v01b-triptych-innate-card rarity-${escapeHtml(rarity)}"
                data-innate-slot="${idx}"
                data-trait-id="${escapeHtml(traitId)}"
              >
                <div class="cc-destiny-emblem-row">
                  <div
                    class="cc-destiny-socket-frame"
                    style="background-image:url('${V01B_UI_CHROME_URLS.socketTienThienLocked}')"
                  >
                    <img class="cc-destiny-emblem-img" src="${escapeHtml(emblemUrl)}" alt="${escapeHtml(def?.displayNameVi ?? traitId)}" />
                  </div>
                  <div class="v01b-innate-meta">
                    <div class="item-card-title">${escapeHtml(def?.displayNameVi ?? traitId)}</div>
                    <div class="v01b-innate-rarity">[${escapeHtml(rarityLabel)} • Tiên Thiên Ấn Định]</div>
                  </div>
                </div>
                ${
                  npc
                    ? `<div class="cc-signature-badge">✦ Mệnh Cách Chân Truyền • ${escapeHtml(npc.nameVi)}</div>`
                    : ""
                }
                <div class="cc-destiny-bonus">✦ ${escapeHtml(bonusText)}</div>
              </div>
            `;
          })
          .join("")
      : `<div class="item-card"><div class="item-card-desc">Chưa xác nhận Tiên Thiên Khí Vận.</div></div>`;

  const activeHtSlots = v02?.destiny?.activeAcquiredSlots ?? [null, null, null];
  const ownedHtIds = v02?.destiny?.acquiredTraitIds ?? [];
  const activeHtHtml = activeHtSlots
    .map((slotTraitId, slotIdx) => {
      if (!slotTraitId) {
        return `
          <div class="item-card char-ht-slot empty" data-ht-slot="${slotIdx}">
            <div class="char-attr-head">
              <div
                class="char-ht-socket empty"
                style="background-image:url('${V01B_UI_CHROME_URLS.socketHauThienEquippable}')"
              ></div>
              <div>
                <div class="item-card-title">Hậu Thiên Ô ${slotIdx + 1}: Trống</div>
                <div class="item-card-desc">Tinh đài sẵn sàng dung nạp Hậu Thiên Khí Vận.</div>
              </div>
            </div>
          </div>
        `;
      }
      const def = S1E_STARTER_DESTINY_CATALOG[slotTraitId];
      const rarityLabel = def ? DESTINY_RARITY_LABELS_VI[def.rarity] : "Hậu Thiên";
      const bonusText = def ? formatDestinyTraitBonusSummaryVi(def) : "";
      const htEmblemUrl = resolveDestinyTraitIconUrl(slotTraitId, 64);
      return `
        <div
          class="item-card char-ht-slot active"
          data-ht-slot="${slotIdx}"
          data-trait-id="${escapeHtml(slotTraitId)}"
        >
          <div class="char-attr-head">
            <div
              class="char-ht-socket active"
              style="background-image:url('${V01B_UI_CHROME_URLS.socketHauThienActive}')"
            >
              <img src="${escapeHtml(htEmblemUrl)}" alt="${escapeHtml(def?.displayNameVi ?? slotTraitId)}" />
            </div>
            <div>
              <div class="item-card-title">Ô ${slotIdx + 1}: [${escapeHtml(rarityLabel)}] ${escapeHtml(def?.displayNameVi ?? slotTraitId)}</div>
              <div class="item-card-desc">✦ ${escapeHtml(bonusText)}</div>
            </div>
          </div>
          <button type="button" class="hud-btn v01b-btn-jade btn-unequip-ht" data-slot="${slotIdx}">Gỡ Bỏ</button>
        </div>
      `;
    })
    .join("");

  const ownedHtHtml =
    ownedHtIds.length === 0
      ? `<div class="v01b-ht-empty-note">Kho tàng Hậu Thiên: Chưa lĩnh ngộ thêm Hậu Thiên Khí Vận trong hành trình.</div>`
      : ownedHtIds
          .map((traitId) => {
            const def = S1E_STARTER_DESTINY_CATALOG[traitId];
            const alreadyEquipped = activeHtSlots.includes(traitId);
            const firstEmptySlot = activeHtSlots.findIndex((s) => s === null);
            const targetSlot = firstEmptySlot >= 0 ? firstEmptySlot : 0;
            const htIconUrl = resolveDestinyTraitIconUrl(traitId, 32);
            return `
              <div class="item-card v01b-owned-ht-card" data-owned-ht="${escapeHtml(traitId)}">
                <div class="char-attr-head">
                  <img class="char-attr-icon" src="${escapeHtml(htIconUrl)}" alt="${escapeHtml(def?.displayNameVi ?? traitId)}" />
                  <div>
                    <div class="item-card-title">${escapeHtml(def?.displayNameVi ?? traitId)}</div>
                    <div class="item-card-desc">${escapeHtml(def ? formatDestinyTraitBonusSummaryVi(def) : "")}</div>
                  </div>
                </div>
                <button
                  type="button"
                  class="hud-btn primary v01b-btn-jade btn-equip-ht"
                  data-trait="${escapeHtml(traitId)}"
                  data-slot="${targetSlot}"
                  ${alreadyEquipped ? "disabled" : ""}
                >
                  ${alreadyEquipped ? "Đang Trang Bị" : `Trang Bị (Ô ${targetSlot + 1})`}
                </button>
              </div>
            `;
          })
          .join("");

  const dStats = v02?.derivedStats;
  const curHp = p?.hp ?? v02?.resources.currentHp ?? 0;
  const maxHp = dStats?.maxHp ?? p?.maxHp ?? 0;
  const curMp = p?.mp ?? v02?.resources.currentMp ?? 0;
  const maxMp = dStats?.maxMp ?? p?.maxMp ?? 0;
  const physAtk = dStats?.physicalAttack ?? p?.attack ?? 0;
  const spirAtk = dStats?.spiritualAttack ?? p?.attack ?? 0;
  const physDef = dStats?.physicalDefense ?? p?.defense ?? 0;
  const spirDef = dStats?.spiritualDefense ?? p?.defense ?? 0;

  const gd023Tooltip =
    realmId === "pham_nhan" && level >= 10
      ? "Yêu cầu Đột Phá Luyện Khí (GD-023): Cần cơ duyên Gặp Tiên Nhân Ẩn Danh trong Nhiệm Vụ Chính Tuyến, Công Pháp Khởi Đầu và Đan Dược Đột Phá."
      : "Tích lũy đủ Tu Vi và điều kiện cảnh giới để đột phá.";

  host.modalHost.innerHTML = `
    <div class="hud-modal-backdrop" id="modal-backdrop">
      <div
        class="hud-modal v01b-triptych-modal v01b-panel-celestial-jade"
        id="cultivation-modal"
        data-testid="character-cultivation-panel"
      >
        <div class="v01b-triptych-header">
          <div class="v01b-triptych-crest-wrap">
            <img class="v01b-triptych-crest-bg" src="${V01B_UI_CHROME_URLS.panelHeaderBannerCrest}" alt="" />
            <div class="v01b-triptych-crest-titles">
              <div class="v01b-triptych-main-title">THIÊN CUNG NỘI THỊ ĐỒ</div>
              <div class="v01b-triptych-sub-title" id="char-modal-name">
                ${escapeHtml(v02?.identity.name ?? p?.nickname ?? "Đạo Hữu")} • Cấp ${level} • 【${escapeHtml(realmLabel)}】
              </div>
            </div>
          </div>
          <button type="button" class="hud-btn v01b-btn-jade" id="btn-close-modal" data-testid="close-character-panel-btn">Đóng [X]</button>
        </div>

        <div class="v01b-triptych-wings">
          <section class="v01b-triptych-wing v01b-wing-left" id="char-v02-summary">
            <div class="v01b-wing-title">✦ Tu Luyện &amp; Cảnh Giới ✦</div>
            <div
              class="v01b-meditation-wheel-stage"
              style="background-image:url('${V01B_UI_CHROME_URLS.cultivationMeditationStarWheel}')"
            >
              <div class="v01b-meditation-portrait-halo">
                <img src="${escapeHtml(portraitSrc)}" alt="${escapeHtml(appDef.displayNameVi)}" />
              </div>
            </div>

            <div class="v01b-progression-block" id="char-modal-progression">
              <div class="v01b-prog-row-head">
                <span>Cấp: Lv ${level} / ${majorCapLevel} — ${escapeHtml(realmLabel)}</span>
                <span>${atCap ? "Đỉnh Phong" : `${expNow} / ${expNext}`}</span>
              </div>
              <div class="bar-track bar-track-exp">
                <div class="bar-fill exp" style="width:${expPct}%"></div>
                <div class="bar-text">EXP: ${atCap ? `Đạt đỉnh phong cảnh giới (${expNow})` : `${expNow} / ${expNext}`}</div>
              </div>

              <div class="v01b-prog-row-head" style="margin-top:6px;">
                <span>Cảnh Giới: ${escapeHtml(realmLabel)} → ${escapeHtml(nextRealmNameVi)}</span>
              </div>
              <div class="v01b-dantian-core-row">
                <img class="char-dantian-orb" src="${V01B_UI_CHROME_URLS.orbDantianStarCore}" alt="" />
                <div class="bar-track bar-track-tuvi" style="flex:1;">
                  <div class="bar-fill tuvi" style="width:${tuViPct}%"></div>
                  <div class="bar-text">Tu Vi: ${curTuVi} / ${reqTuVi}</div>
                </div>
              </div>
              <div class="v01b-gd023-note">${escapeHtml(gd023Tooltip)}</div>
            </div>

            <div class="v01b-wing-actions">
              <button
                type="button"
                class="hud-btn gold v01b-btn-cinnabar"
                id="btn-modal-breakthrough"
                data-testid="char-breakthrough-btn"
                title="${escapeHtml(gd023Tooltip)}"
              >
                <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.sealDaoCinnabar}" alt="" />
                <span>Đột Phá Cảnh Giới</span>
              </button>
              <button
                type="button"
                class="hud-btn primary v01b-btn-jade"
                id="btn-modal-meditate"
                data-testid="char-meditate-btn"
              >
                <img class="v01b-btn-seal-icon" src="${V01B_UI_CHROME_URLS.orbTuViCore32}" alt="" />
                <span>Bế Quan Tịnh Tu (Tối Đa 8 Giờ)</span>
              </button>
            </div>
          </section>

          <section class="v01b-triptych-wing v01b-wing-center">
            <div class="v01b-wing-title">
              ✦ Lục Hợp Thuộc Tính Gốc ✦
              <span class="v01b-free-pts-badge">Điểm Tiềm Năng Khả Dụng: <strong id="char-free-attr-points">${freePts}</strong></span>
            </div>
            <div
              class="v01b-hexagram-board"
              id="char-attributes-grid"
              style="background-image:url('${V01B_UI_CHROME_URLS.cultivationMeridianHexagramPlate}')"
            >
              ${hexagramVerticesHtml}
            </div>
            <div class="v01b-derived-stats-strip">
              <span>Sinh Lực: <strong>${curHp}/${maxHp}</strong></span>
              <span>Linh Lực: <strong>${curMp}/${maxMp}</strong></span>
              <span>Công Vật Lý: <strong>${physAtk}</strong></span>
              <span>Công Pháp Thuật: <strong>${spirAtk}</strong></span>
              <span>Thủ Vật Lý: <strong>${physDef}</strong></span>
              <span>Thủ Pháp Thuật: <strong>${spirDef}</strong></span>
            </div>
            <div class="v01b-party-compact-bar">
              <span>Tổ Đội: ${p?.partyId ? escapeHtml(p.partyId) : "Chưa lập đội"}</span>
              <div class="v01b-party-btns">
                <button type="button" class="hud-btn v01b-btn-jade" id="btn-party-create">Lập Đội</button>
                <button type="button" class="hud-btn v01b-btn-jade" id="btn-party-join">Gia Nhập</button>
                <button type="button" class="hud-btn v01b-btn-jade" id="btn-party-leave">Rời Đội</button>
              </div>
            </div>
          </section>

          <section class="v01b-triptych-wing v01b-wing-right">
            <div class="v01b-wing-title">✦ Thiên Mệnh Tinh Đài ✦</div>
            <div class="v01b-destiny-subhead">Tiên Thiên Khí Vận (3 Ô Ấn Định)</div>
            <div class="v01b-innate-list" id="char-innate-destiny-grid">
              ${innateCardsHtml}
            </div>
            <div class="v01b-destiny-subhead" style="margin-top:8px;">Hậu Thiên Khí Vận (3 Ô Tinh Đài)</div>
            <div class="v01b-ht-list" id="ht-active-slots">
              ${activeHtHtml}
            </div>
            <div class="v01b-ht-owned-list" id="ht-owned-collection">
              ${ownedHtHtml}
            </div>
          </section>
        </div>
      </div>
    </div>
  `;

  host.modalHost.querySelector("#btn-close-modal")?.addEventListener("click", () => {
    host.onCloseModal();
  });
  host.modalHost.querySelector("#modal-backdrop")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "modal-backdrop") {
      host.onCloseModal();
    }
  });
  host.modalHost.querySelectorAll(".btn-allocate-attr").forEach((btn) => {
    btn.addEventListener("click", () => {
      const attrKey = (btn as HTMLElement).dataset.attr as BaseAttributeKey | undefined;
      if (attrKey) {
        host.net.sendAllocateAttributePointV02(attrKey);
      }
    });
  });
  host.modalHost.querySelectorAll(".btn-unequip-ht").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slotIdx = Number((btn as HTMLElement).dataset.slot);
      if (slotIdx === 0 || slotIdx === 1 || slotIdx === 2) {
        host.net.sendUnequipAcquiredDestinyV02(slotIdx);
      }
    });
  });
  host.modalHost.querySelectorAll(".btn-equip-ht").forEach((btn) => {
    btn.addEventListener("click", () => {
      const traitId = (btn as HTMLElement).dataset.trait;
      const slotIdx = Number((btn as HTMLElement).dataset.slot);
      if (traitId && (slotIdx === 0 || slotIdx === 1 || slotIdx === 2)) {
        host.net.sendEquipAcquiredDestinyV02(slotIdx, traitId);
      }
    });
  });
  host.modalHost.querySelector("#btn-modal-meditate")?.addEventListener("click", () => {
    host.net.sendClaimMeditation();
  });
  host.modalHost.querySelector("#btn-modal-breakthrough")?.addEventListener("click", () => {
    host.net.sendBreakthrough();
  });
  host.modalHost.querySelector("#btn-party-create")?.addEventListener("click", () => {
    host.net.sendPartyAction("create");
  });
  host.modalHost.querySelector("#btn-party-join")?.addEventListener("click", () => {
    host.net.sendPartyAction("join");
  });
  host.modalHost.querySelector("#btn-party-leave")?.addEventListener("click", () => {
    host.net.sendPartyAction("leave");
  });
}
