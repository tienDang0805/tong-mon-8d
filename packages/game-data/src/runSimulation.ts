import {
  COMBAT_MITIGATION_K,
  computeActualDamage,
  computeOfflineMeditationReward,
  getNextRealmAndStage,
  getRealmRequiredTuVi,
  INITIAL_DISCIPLINE_STATS,
  ITEMS_REGISTRY,
  MONSTERS_REGISTRY,
  OFFLINE_MEDITATION_CAP_SECONDS,
  QUESTS_REGISTRY,
  REALM_PROGRESSION,
  SKILLS_REGISTRY
} from "./index.js";

export interface SimulationProfileResult {
  profileName: string;
  activeMinutesPerDay: number;
  offlineHoursClaimed: number;
  minutesToFirstBreakthrough: number;
  tuViAfterDay1: number;
  linhThachNetAfterDay1: number;
  reachedRealmDisplay: string;
}

export function runPlaystyleSimulations(): SimulationProfileResult[] {
  const profiles = [
    { name: "Check-in 5m + Offline 8h", activeMin: 5, offlineHours: 8, mobsPerMin: 1.0, completesQuest: true },
    { name: "Solo 15m + Offline 8h", activeMin: 15, offlineHours: 8, mobsPerMin: 1.8, completesQuest: true },
    { name: "Active 60m + Offline 8h", activeMin: 60, offlineHours: 8, mobsPerMin: 2.2, completesQuest: true },
    { name: "Hardcore 180m + Party", activeMin: 180, offlineHours: 8, mobsPerMin: 2.8, completesQuest: true }
  ];

  const wolf = MONSTERS_REGISTRY.truc_lang;
  const quest = QUESTS_REGISTRY.phi_de_ch1_huong_thom;
  const noodleCost = ITEMS_REGISTRY.mi_linh_thach_thanh_truc.buyPriceLinhThach ?? 25;

  return profiles.map((p) => {
    let realmId = REALM_PROGRESSION[0].id;
    let stage = 1;
    let tuVi = 0;
    let linhThach = 60;
    let minutesToFirstBreakthrough = -1;

    if (p.completesQuest) {
      linhThach -= noodleCost;
      tuVi += quest.rewardTuVi;
      linhThach += quest.rewardLinhThach;
    }

    for (let m = 1; m <= p.activeMin; m++) {
      const kills = p.mobsPerMin;
      tuVi += Math.round(kills * wolf.tuViReward);
      linhThach += Math.round(kills * wolf.linhThachReward);
      const req = getRealmRequiredTuVi(realmId, stage);
      if (tuVi >= req) {
        const next = getNextRealmAndStage(realmId, stage);
        if (next) {
          tuVi -= req;
          realmId = next.realmId;
          stage = next.stage;
          if (minutesToFirstBreakthrough < 0) {
            minutesToFirstBreakthrough = m;
          }
        }
      }
    }

    const offlineReward = computeOfflineMeditationReward(
      p.offlineHours * 3600,
      realmId,
      1.25
    );
    tuVi += offlineReward.tuViGained;

    while (true) {
      const req = getRealmRequiredTuVi(realmId, stage);
      const next = getNextRealmAndStage(realmId, stage);
      if (!next || tuVi < req) {
        break;
      }
      tuVi -= req;
      realmId = next.realmId;
      stage = next.stage;
    }

    const def = REALM_PROGRESSION.find((r) => r.id === realmId) ?? REALM_PROGRESSION[0];
    return {
      profileName: p.name,
      activeMinutesPerDay: p.activeMin,
      offlineHoursClaimed: offlineReward.cappedSeconds / 3600,
      minutesToFirstBreakthrough: minutesToFirstBreakthrough < 0 ? 1 : minutesToFirstBreakthrough,
      tuViAfterDay1: tuVi,
      linhThachNetAfterDay1: linhThach,
      reachedRealmDisplay: `${def.nameVi} Tầng ${stage}`
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const results = runPlaystyleSimulations();
  const slashDmg = computeActualDamage(
    INITIAL_DISCIPLINE_STATS.kiem_tu.attack,
    SKILLS_REGISTRY.basic_slash.coefficient,
    MONSTERS_REGISTRY.truc_lang.defense,
    SKILLS_REGISTRY.basic_slash.minDamage
  );
  console.log(
    JSON.stringify(
      {
        combatMitigationK: COMBAT_MITIGATION_K,
        offlineCapSeconds: OFFLINE_MEDITATION_CAP_SECONDS,
        kiemTuSlashDamageVsTrucLang: slashDmg,
        simulations: results
      },
      null,
      2
    )
  );
}
