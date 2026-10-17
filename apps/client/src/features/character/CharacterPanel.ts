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
  S1E_STARTER_DESTINY_CATALOG,
  formatDestinyTraitBonusSummaryVi,
  formatRealmDisplay,
  getCandidateExpToNextLevelDecimal,
  getRealmRequiredTuVi,
  isAtNonSaintMajorRealmLevelCap
} from "@tong-mon-8d/game-data";
import type { GameNetworkClient } from "../../network.js";

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
  const level = v02?.levelProgress.level ?? p?.level ?? 1;
  const expNow = v02?.levelProgress.expTowardNext ?? "0";
  const expNext = getCandidateExpToNextLevelDecimal(level) ?? "100";
  const atCap = isAtNonSaintMajorRealmLevelCap(realmId, level);
  const freePts = v02?.levelProgress.freeAttributePoints ?? 0;

  const appDef =
    APPROVED_CHARACTER_V02_APPEARANCES.find(
      (a) => a.id === (v02?.identity.appearanceId ?? p?.appearanceId)
    ) ?? APPROVED_CHARACTER_V02_APPEARANCES[0];

  const originAttrs = v02?.attributes?.origin ?? {
    the_phach: 10,
    luc_dao: 10,
    linh_tinh: 10,
    than_phap: 10,
    than_thuc: 10,
    ngo_tinh: 10
  };
  const destinyBonuses = v02?.attributes?.destinyBonuses ?? {
    the_phach: 0,
    luc_dao: 0,
    linh_tinh: 0,
    than_phap: 0,
    than_thuc: 0,
    ngo_tinh: 0
  };
  const preRealmAttrs = v02?.attributes?.preRealm ?? originAttrs;
  const effectiveAttrs = v02?.attributes?.effective ?? originAttrs;

  const attrCardsHtml = BASE_ATTRIBUTE_KEYS.map((key) => {
    const labelVi = BASE_ATTRIBUTE_LABELS_VI[key];
    const origVal = originAttrs[key];
    const destVal = destinyBonuses[key];
    const preVal = preRealmAttrs[key];
    const effVal = effectiveAttrs[key];
    return `
      <div class="item-card char-attr-card" data-attr-card="${key}">
        <div>
          <div class="item-card-title">${escapeHtml(labelVi)}: <span class="char-attr-effective">${effVal}</span></div>
          <div class="item-card-desc">
            Gốc: ${origVal} • Khí Vận: +${destVal} • Trước Cảnh Giới: ${preVal}
          </div>
        </div>
        <button
          type="button"
          class="hud-btn ${freePts > 0 ? "gold" : ""} btn-allocate-attr"
          data-attr="${key}"
          ${freePts > 0 ? "" : "disabled"}
        >
          +1 ${escapeHtml(labelVi)}
        </button>
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
            const bonusText = def
              ? formatDestinyTraitBonusSummaryVi(def)
              : "";
            const npc = def?.legendaryNpcId
              ? LEGENDARY_NPCS.find((n) => n.id === def.legendaryNpcId)
              : null;
            return `
              <div class="item-card char-destiny-slot rarity-${escapeHtml(rarity)}" data-innate-slot="${idx}" data-trait-id="${escapeHtml(traitId)}">
                <div class="item-card-title">
                  [${escapeHtml(rarityLabel)}] ${escapeHtml(def?.displayNameVi ?? traitId)}
                </div>
                ${
                  npc
                    ? `<div class="cc-signature-badge">✦ Mệnh Cách Chân Truyền • ${escapeHtml(npc.nameVi)}</div>`
                    : ""
                }
                <div class="item-card-desc">${escapeHtml(def?.descriptionVi ?? "")}</div>
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
          <div class="item-card" data-ht-slot="${slotIdx}">
            <div class="item-card-title">Hậu Thiên Ô ${slotIdx + 1}: Trống</div>
            <div class="item-card-desc">Có thể trang bị Hậu Thiên Khí Vận đã lĩnh ngộ.</div>
          </div>
        `;
      }
      const def = S1E_STARTER_DESTINY_CATALOG[slotTraitId];
      const rarityLabel = def ? DESTINY_RARITY_LABELS_VI[def.rarity] : "Hậu Thiên";
      const bonusText = def ? formatDestinyTraitBonusSummaryVi(def) : "";
      return `
        <div class="item-card" data-ht-slot="${slotIdx}" data-trait-id="${escapeHtml(slotTraitId)}">
          <div>
            <div class="item-card-title">Ô ${slotIdx + 1}: [${escapeHtml(rarityLabel)}] ${escapeHtml(def?.displayNameVi ?? slotTraitId)}</div>
            <div class="item-card-desc">✦ ${escapeHtml(bonusText)}</div>
          </div>
          <button type="button" class="hud-btn btn-unequip-ht" data-slot="${slotIdx}">Gỡ Bỏ</button>
        </div>
      `;
    })
    .join("");

  const ownedHtHtml =
    ownedHtIds.length === 0
      ? `<div class="item-card"><div class="item-card-desc">Chưa lĩnh ngộ thêm Hậu Thiên Khí Vận trong hành trình.</div></div>`
      : ownedHtIds
          .map((traitId) => {
            const def = S1E_STARTER_DESTINY_CATALOG[traitId];
            const alreadyEquipped = activeHtSlots.includes(traitId);
            const firstEmptySlot = activeHtSlots.findIndex((s) => s === null);
            const targetSlot = firstEmptySlot >= 0 ? firstEmptySlot : 0;
            return `
              <div class="item-card" data-owned-ht="${escapeHtml(traitId)}">
                <div>
                  <div class="item-card-title">${escapeHtml(def?.displayNameVi ?? traitId)}</div>
                  <div class="item-card-desc">${escapeHtml(def ? formatDestinyTraitBonusSummaryVi(def) : "")}</div>
                </div>
                <button
                  type="button"
                  class="hud-btn primary btn-equip-ht"
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
  const moveSpd = dStats?.moveSpeedRating ?? 100;
  const cultRate = dStats?.cultivationRateRating ?? 100;

  host.modalHost.innerHTML = `
    <div class="hud-modal-backdrop" id="modal-backdrop">
      <div class="hud-modal hud-modal-wide" id="cultivation-modal">
        <div class="modal-header">
          <span class="modal-title">Nhân Vật • Căn Cốt Thuộc Tính • Tiên Thiên & Hậu Thiên Khí Vận [C]</span>
          <button class="hud-btn" id="btn-close-modal">Đóng [ESC]</button>
        </div>
        <div class="npc-dialogue-layout" id="char-v02-summary">
          <div class="npc-portrait-box">
            <img src="${escapeHtml(appDef.portraitUrl)}" alt="${escapeHtml(appDef.displayNameVi)}" />
          </div>
          <div class="npc-dialogue-body">
            <div class="item-card-title" id="char-modal-name">
              ${escapeHtml(v02?.identity.name ?? p?.nickname ?? "Đạo Hữu")} • Cấp ${level} • 【${escapeHtml(realmLabel)}】
            </div>
            <div class="item-card-desc" id="char-modal-progression">
              Hình tướng: ${escapeHtml(appDef.displayNameVi)} • Kinh nghiệm (EXP): ${atCap ? `Đạt đỉnh phong cảnh giới (${expNow})` : `${expNow} / ${expNext}`} • Tu Vi: ${p?.tuVi ?? v02?.cultivation.tuVi ?? 0} / ${reqTuVi}<br/>
              Điểm thuộc tính tự do: <strong id="char-free-attr-points">${freePts}</strong> • Khí Huyết: ${curHp}/${maxHp} • Linh Lực: ${curMp}/${maxMp}<br/>
              Vật Công: ${physAtk} • Pháp Công: ${spirAtk} • Vật Phòng: ${physDef} • Pháp Phòng: ${spirDef} • Thân Pháp: ${moveSpd} • Tu Luyện: ${cultRate}
            </div>
            <div class="hud-btn-group" style="justify-content:flex-start; margin-top:4px;">
              <button class="hud-btn primary" id="btn-modal-meditate">Thu Hoạch Bế Quan [M]</button>
              <button class="hud-btn gold" id="btn-modal-breakthrough">Đột Phá Cảnh Giới [B]</button>
            </div>
          </div>
        </div>

        <div class="modal-title" style="font-size:13px;">Lục Đại Thuộc Tính Gốc (Điểm Tự Do Khả Dụng: ${freePts})</div>
        <div class="grid-cards" id="char-attributes-grid">
          ${attrCardsHtml}
        </div>

        <div class="modal-title" style="font-size:13px;">Tiên Thiên Nghịch Thiên Cải Mệnh (3 Ô Cố Định)</div>
        <div class="grid-cards" id="char-innate-destiny-grid">
          ${innateCardsHtml}
        </div>

        <div class="modal-title" style="font-size:13px;">Hậu Thiên Khí Vận Đang Kích Hoạt (Tối Đa 3 Ô)</div>
        <div class="grid-cards" id="ht-active-slots">
          ${activeHtHtml}
        </div>

        <div class="modal-title" style="font-size:13px;">Kho Tàng Hậu Thiên Khí Vận Đã Lĩnh Ngộ (${ownedHtIds.length})</div>
        <div class="grid-cards" id="ht-owned-collection">
          ${ownedHtHtml}
        </div>

        <div class="item-card">
          <div class="item-card-title">Tổ Đội Đồng Đạo (${p?.partyId ? `Đang trong đội ${escapeHtml(p.partyId)}` : "Chưa lập đội"})</div>
          <div class="item-card-desc">Kết bạn cùng đạo hữu trong khu vực để săn Trúc Lang và Thanh Lân Xà tại Thanh Trúc Lâm.</div>
          <div class="hud-btn-group" style="justify-content:flex-start; margin-top:6px;">
            <button class="hud-btn primary" id="btn-party-create">Lập Tổ Đội</button>
            <button class="hud-btn" id="btn-party-join">Gia Nhập Đội Gần Nhất</button>
            <button class="hud-btn" id="btn-party-leave">Rời Tổ Đội</button>
          </div>
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
