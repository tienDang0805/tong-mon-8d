import { MONSTERS_REGISTRY } from "./catalogs/monsters.js";
import { SKILLS_REGISTRY } from "./catalogs/techniques.js";
import {
  COMBAT_MITIGATION_K,
  computeActualDamage,
  INITIAL_DISCIPLINE_STATS,
  OFFLINE_MEDITATION_CAP_SECONDS
} from "./rules/legacyProgression.js";
import {
  runPlaystyleSimulations,
  type SimulationProfileResult
} from "./rules/legacySimulator.js";

export { runPlaystyleSimulations, type SimulationProfileResult };

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
