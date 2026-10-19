import type {
  ActionResultPayload,
  BreakthroughIntentPayload,
  CharacterSaveState,
  ClaimMeditationIntentPayload,
  PortalApprovedPayload,
  PortalIntentPayload
} from "@tong-mon-8d/shared";
import {
  computeOfflineMeditationReward,
  formatRealmDisplay,
  getNextRealmAndStage,
  getRealmRequiredTuVi,
  ITEMS_REGISTRY,
  REALM_PROGRESSION,
  ZONES_REGISTRY
} from "@tong-mon-8d/game-data";
import type {
  LegacyWorldPersistencePort,
  LegacyWorldRuntimeStatePort
} from "../../infrastructure/database/LegacyWorldPorts.js";

export class LegacyMeditationService {
  constructor(
    private readonly persistence: LegacyWorldPersistencePort,
    private readonly runtimeState: LegacyWorldRuntimeStatePort
  ) {}

  async handlePortalIntent(
    player: CharacterSaveState,
    intent: PortalIntentPayload
  ): Promise<{ result: ActionResultPayload; approval?: PortalApprovedPayload }> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
    if (dup) {
      return { result: dup };
    }

    const now = this.runtimeState.now();
    const lockUntil = this.runtimeState.portalLocks.get(player.characterId) ?? 0;
    if (now < lockUntil) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "PORTAL_COOLDOWN",
          messageVi: "Truyền Tống Trận đang ổn định không gian, vui lòng chờ giây lát."
        }
      };
    }

    const zone = ZONES_REGISTRY[player.zoneId];
    const portal = zone.portals.find((p) => p.id === intent.portalId);
    if (!portal) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "INVALID_PORTAL",
          messageVi: "Không tìm thấy Truyền Tống Trận tại khu vực hiện tại."
        }
      };
    }

    const dist = Math.hypot(player.x - portal.x, player.y - portal.y);
    if (dist > portal.radiusPx) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "OUT_OF_RANGE",
          messageVi: "Ngươi đứng quá xa Truyền Tống Trận."
        }
      };
    }

    this.runtimeState.portalLocks.set(player.characterId, now + 900);
    player.zoneId = portal.targetZoneId;
    player.x = portal.targetX;
    player.y = portal.targetY;
    await this.persistence.persistPlayerRuntimeState(player);

    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "PORTAL_OK",
      messageVi: `Đã truyền tống tới ${ZONES_REGISTRY[portal.targetZoneId].nameVi}.`
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "portal",
      result
    );

    return {
      result,
      approval: {
        portalId: portal.id,
        targetZoneId: portal.targetZoneId,
        targetSpawnId: portal.targetSpawnId,
        spawnX: portal.targetX,
        spawnY: portal.targetY
      }
    };
  }

  async handleClaimMeditation(
    player: CharacterSaveState,
    intent: ClaimMeditationIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const now = this.runtimeState.now();
    const elapsedSec = Math.floor((now - player.lastMeditationClaimAt) / 1000);
    if (elapsedSec < 10) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "MEDITATION_TOO_SOON",
        messageVi:
          "Vừa mới thu hoạch linh khí xong, hãy tĩnh tọa thêm ít nhất 10 giây."
      };
    }

    const eff = this.runtimeState.getEffectiveStats(player);
    const { cappedSeconds, tuViGained } = computeOfflineMeditationReward(
      elapsedSec,
      player.realmId,
      eff.tuViMultiplier
    );

    player.lastMeditationClaimAt = now;
    player.meditationStartedAt = now;
    player.tuVi += tuViGained;
    await this.persistence.persistPlayerRuntimeState(player);

    const minutes = Math.max(1, Math.round(cappedSeconds / 60));
    const cappedNote = elapsedSec > 8 * 3600 ? " (đã giới hạn tối đa 8 giờ)" : "";
    const res: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "MEDITATION_CLAIMED",
      messageVi: `Thu hoạch bế quan ${minutes} phút${cappedNote}: nhận +${tuViGained} Tu Vi!`
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "claim_meditation",
      res
    );
    return res;
  }

  async handleBreakthrough(
    player: CharacterSaveState,
    intent: BreakthroughIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const reqTuVi = getRealmRequiredTuVi(player.realmId, player.realmStage);
    if (player.tuVi < reqTuVi) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "INSUFFICIENT_TU_VI",
        messageVi: `Chưa đủ Tu Vi để đột phá (cần ${reqTuVi}, hiện có ${player.tuVi}).`
      };
    }

    const next = getNextRealmAndStage(player.realmId, player.realmStage);
    if (!next) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "MAX_REALM",
        messageVi: "Ngươi đã đạt tới đỉnh cao cảnh giới hiện tại."
      };
    }

    const targetRealmDef = REALM_PROGRESSION.find((r) => r.id === next.realmId);
    if (
      next.isMajorBreakthrough &&
      targetRealmDef?.breakthroughItemId &&
      targetRealmDef.breakthroughItemCount > 0
    ) {
      if (
        this.runtimeState.getItemCount(player, targetRealmDef.breakthroughItemId) <
        targetRealmDef.breakthroughItemCount
      ) {
        const itemName =
          ITEMS_REGISTRY[targetRealmDef.breakthroughItemId]?.nameVi ??
          targetRealmDef.breakthroughItemId;
        return {
          requestId: intent.requestId,
          ok: false,
          code: "MISSING_BREAKTHROUGH_ITEM",
          messageVi: `Đột phá đại cảnh giới ${targetRealmDef.nameVi} cần ${targetRealmDef.breakthroughItemCount}x ${itemName}.`
        };
      }
      this.runtimeState.removeItemFromInventory(
        player,
        targetRealmDef.breakthroughItemId,
        targetRealmDef.breakthroughItemCount
      );
    }

    player.tuVi -= reqTuVi;
    player.realmId = next.realmId;
    player.realmStage = next.stage;

    const rDef = targetRealmDef ?? REALM_PROGRESSION[1];
    player.maxHp += rDef.hpBonusPerStage || 30;
    player.maxMp += rDef.mpBonusPerStage || 15;
    player.attack += rDef.attackBonusPerStage || 5;
    player.defense += rDef.defenseBonusPerStage || 3;
    player.hp = player.maxHp;
    player.mp = player.maxMp;

    await this.persistence.persistPlayerRuntimeState(player);

    const display = formatRealmDisplay(player.realmId, player.realmStage);
    const res: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "BREAKTHROUGH_OK",
      messageVi: `Đột phá thành công lên cảnh giới 【${display}】! Khí huyết và linh lực đại tăng!`,
      ceremony: "breakthrough_success"
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "breakthrough",
      res
    );
    return res;
  }
}
