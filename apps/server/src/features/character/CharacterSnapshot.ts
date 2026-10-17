import type {
  CharacterV02SnapshotPayload,
  DestinyDefinitionMetadata
} from "@tong-mon-8d/shared";
import { computeCandidateBaselineStatSnapshot } from "@tong-mon-8d/game-data";
import type { CharacterV02PersistedState } from "../../characterV02Repository.js";
import { APPROVED_PRODUCTION_DESTINY_CATALOG } from "../destiny/DestinyRoller.js";

export function toCharacterV02Snapshot(
  state: CharacterV02PersistedState,
  destinyCatalog: Readonly<Record<string, DestinyDefinitionMetadata>> = APPROVED_PRODUCTION_DESTINY_CATALOG
): CharacterV02SnapshotPayload {
  const activeDestiny =
    state.identity.creationState === "confirmed" ? state.destiny : null;
  const statResult = computeCandidateBaselineStatSnapshot({
    realmId: state.cultivation.realmId,
    realmStage: state.cultivation.realmStage,
    levelProgress: state.levelProgress,
    destiny: activeDestiny,
    destinyCatalog
  });
  const derivedStats = statResult.ok
    ? statResult.snapshot.derivedStats
    : {
        maxHp: state.resources.currentHp,
        maxMp: state.resources.currentMp,
        physicalAttack: 0,
        spiritualAttack: 0,
        physicalDefense: 0,
        spiritualDefense: 0,
        moveSpeedRating: 100,
        cultivationRateRating: 100
      };

  const clampedHp = Math.max(0, Math.min(state.resources.currentHp, derivedStats.maxHp));
  const clampedMp = Math.max(0, Math.min(state.resources.currentMp, derivedStats.maxMp));

  return {
    schemaVersion: state.schemaVersion,
    rulesetVersion: state.rulesetVersion,
    identity: { ...state.identity },
    levelProgress: {
      level: state.levelProgress.level,
      expTowardNext: state.levelProgress.expTowardNext,
      freeAttributePoints: state.levelProgress.freeAttributePoints,
      allocated: { ...state.levelProgress.allocated },
      earnedPermanent: { ...state.levelProgress.earnedPermanent }
    },
    cultivation: { ...state.cultivation },
    destiny:
      state.destiny !== null
        ? {
            innate: [...state.destiny.innate] as [string, string, string],
            innateConfirmedAtMs: state.destiny.innateConfirmedAtMs,
            acquiredTraitIds: [...state.destiny.acquiredTraitIds],
            activeAcquiredSlots: [...state.destiny.activeAcquiredSlots] as [
              string | null,
              string | null,
              string | null
            ],
            collectionRevision: state.destiny.collectionRevision
          }
        : null,
    attributes: statResult.ok
      ? {
          origin: { ...statResult.snapshot.originAttributes },
          destinyBonuses: { ...statResult.snapshot.destinyAttributeBonuses },
          preRealm: { ...statResult.snapshot.preRealmAttributes },
          effective: { ...statResult.snapshot.effectiveAttributes },
          realmFactor: statResult.snapshot.realmFactor
        }
      : undefined,
    resources: {
      currentHp: clampedHp,
      currentMp: clampedMp
    },
    derivedStats,
    world: {
      zoneId: state.world.zoneId,
      x: state.world.x,
      y: state.world.y,
      direction: state.world.direction,
      linhThach: state.world.linhThach,
      equippedTitle: state.world.equippedTitle,
      equippedInheritance: state.world.equippedInheritance,
      inventory: state.world.inventory.map((it) => ({ ...it })),
      quests: { ...state.world.quests },
      reputation: { ...state.world.reputation },
      buffs: state.world.buffs.map((b) => ({ ...b })),
      meditationStartedAtMs: state.world.meditationStartedAtMs,
      lastMeditationClaimAtMs: state.world.lastMeditationClaimAtMs
    },
    updatedAtMs: state.updatedAtMs
  };
}
