import type { CanonicalRealmId, CombatDisciplineId } from "@tong-mon-8d/shared";
import { REALM_PROGRESSION } from "../catalogs/realms.js";

export const INITIAL_DISCIPLINE_STATS: Record<
  CombatDisciplineId,
  { nameVi: string; hp: number; mp: number; attack: number; defense: number }
> = {
  kiem_tu: {
    nameVi: "Kiếm Tu",
    hp: 160,
    mp: 80,
    attack: 24,
    defense: 10
  },
  phap_tu: {
    nameVi: "Pháp Tu",
    hp: 140,
    mp: 120,
    attack: 27,
    defense: 8
  },
  the_tu: {
    nameVi: "Thể Tu",
    hp: 210,
    mp: 65,
    attack: 20,
    defense: 15
  }
};

export const COMBAT_MITIGATION_K = 40;
export const OFFLINE_MEDITATION_CAP_SECONDS = 8 * 3600;

export function computeActualDamage(
  attackerAttack: number,
  skillCoefficient: number,
  targetDefense: number,
  minDamage: number
): number {
  const rawDamage = attackerAttack * skillCoefficient;
  const mitigation = targetDefense / (targetDefense + COMBAT_MITIGATION_K);
  return Math.max(minDamage, Math.round(rawDamage * (1 - mitigation)));
}

export function getRealmRequiredTuVi(realmId: CanonicalRealmId, stage: number): number {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId) ?? REALM_PROGRESSION[0];
  const clampedStage = Math.max(1, Math.min(def.stageCount, stage));
  return Math.round(def.baseTuViPerStage * Math.pow(def.stageTuViMultiplier, clampedStage - 1));
}

export function getNextRealmAndStage(
  realmId: CanonicalRealmId,
  stage: number
): { realmId: CanonicalRealmId; stage: number; isMajorBreakthrough: boolean } | null {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId);
  if (!def) {
    return null;
  }
  if (stage < def.stageCount) {
    return { realmId, stage: stage + 1, isMajorBreakthrough: false };
  }
  const nextRealm = REALM_PROGRESSION.find((r) => r.orderIndex === def.orderIndex + 1);
  if (!nextRealm) {
    return null;
  }
  return { realmId: nextRealm.id, stage: 1, isMajorBreakthrough: true };
}

export function computeOfflineMeditationReward(
  elapsedSeconds: number,
  realmId: CanonicalRealmId,
  tuViMultiplier: number
): { cappedSeconds: number; tuViGained: number } {
  const safeElapsed = Math.max(0, Math.floor(elapsedSeconds));
  const cappedSeconds = Math.min(safeElapsed, OFFLINE_MEDITATION_CAP_SECONDS);
  const def = REALM_PROGRESSION.find((r) => r.id === realmId) ?? REALM_PROGRESSION[0];
  const boundedMult = Math.max(1.0, Math.min(2.5, tuViMultiplier));
  const tuViGained = Math.floor(cappedSeconds * def.baseMeditationRatePerSec * boundedMult);
  return { cappedSeconds, tuViGained };
}

export function formatRealmDisplay(realmId: CanonicalRealmId, stage: number): string {
  const def = REALM_PROGRESSION.find((r) => r.id === realmId);
  if (!def) {
    return "Phàm Nhân";
  }
  const subLabel = def.subStageLabels[Math.max(0, Math.min(def.subStageLabels.length - 1, stage - 1))] ?? "";
  return subLabel ? `${def.nameVi} • ${subLabel}` : def.nameVi;
}
