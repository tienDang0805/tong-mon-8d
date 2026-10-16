# SYS-DAO-MASTERY — Six Independent Paths, Ten Stages and Trials

> Version: TD-02 DRAFT v0.4. Governed by `GD-024`–`GD-027`. Names, exact EXP/caps and trial designs below are `PROPOSED` or `DESIGN_BASELINE`; they must never be auto-promoted to owner-approved canon.

## 1. Six paths, no cultivation realm prerequisite

| DaoPathId | Display | Definition | Stage-10 example |
|---|---|---|---|
| `kiem` | Kiếm Đạo | Sword and sword-intent martial techniques | `Kiếm Tiên` **APPROVED** |
| `dao` | Đao Đạo | Heavy/slashing blade martial techniques | `Đao Thánh` PROPOSED |
| `chi` | Chỉ Đạo | Finger techniques and precise point strikes | `Chỉ Tôn` PROPOSED |
| `chuong` | Chưởng Đạo | Palm techniques and impulse/control | `Chưởng Tôn` PROPOSED |
| `the_tu` | Thể Tu | Physical body refinement in combat | `Bất Diệt Thể Tôn` PROPOSED |
| `phap_tu` | Pháp Tu | Offensive/defensive magical arts | `Vạn Pháp Chân Nhân` PROPOSED |

**Not** `Đan Đạo`, `Khí Đạo`, `Phù Đạo`: those are potential professions/proficiencies, NOT substitutes for the six owner-approved combat Dao paths. A character may raise all six independently. Do not bind `daoStage` to `CharacterLevel`, `realmStage` or the legacy 3-option combat `discipline`.

**Important example**: a Luyện Khí Lv 20 may legally own Kiếm Đạo Cảnh 10 if it has legitimately gained all nine stage thresholds and cleared three path trials. It remains Luyện Khí for HP, pressure versus Trúc Cơ monsters and major-realm story gates. In practice, the time and technique requirements make this extraordinary; the engine must **not** hide a realm-level gate.

## 2. Proposed ten Dao-stage names (NOT user approved)

| Stage | Candidate name | Design milestone |
|---:|---|---|
| 1 | Sơ Thức | First successful study/use |
| 2 | Nhập Môn | Elementary control |
| 3 | Tiểu Thành | Technical foundation |
| 4 | Đại Thành | Trial I passed, new expression |
| 5 | Viên Mãn | Refined execution |
| 6 | Hóa Cảnh | Unforced mastery |
| 7 | Nhập Ý | Trial II passed, the path gains conceptual intent |
| 8 | Thông Huyền | Profound path insights |
| 9 | Quy Nhất | Martial method unified |
| 10 | Chứng Đạo | Trial III passed, path achievement |

## 3. State machine and required trials

```
Stage 1 --EXP--> Stage 2 --EXP--> Stage 3
Stage 3 --EXP threshold--> TRIAL_I_READY --clear trial I--> Stage 4
Stage 4 --EXP--> Stage 5 --EXP--> Stage 6
Stage 6 --EXP threshold--> TRIAL_II_READY --clear trial II--> Stage 7
Stage 7 --EXP--> Stage 8 --EXP--> Stage 9
Stage 9 --EXP threshold--> TRIAL_III_READY --clear trial III--> Stage 10
```

The three actual thresholds are **3→4**, **6→7**, **9→10**. Merely reaching the EXP requirement **cannot** advance one of these stages. Each trial is path-specific and may be combat or point-and-click; player makes puzzle/plot choices manually, but combat skills may follow the existing Auto Combat pattern. A trial can normalize some combat stats or supply an authored trial weapon so understanding of the path matters more than the player's raw realm. Its requirements must not implicitly check `realm >= N` for a general Dao path.

Server stores `trialStatus` and `completionClaimId` separately and atomically. A player may leave a ready trial and resume later without losing eligibility. Re-entering/replaying must never duplicate the stage reward. Dao Stage 10 is the current maximum; EXP at Stage 10 does not create Stage 11.

## 4. Draft state and data contract

```ts
export interface DaoPathProgress {
  characterId: string;
  pathId: DaoPathId;
  stage: number;
  progressMilliXp: string;
  trialState: "none" | "ready_i" | "ready_ii" | "ready_iii" | "in_trial" | "cleared";
  activeTrialInstanceId: string | null;
  completedTrialIds: string[];
  revision: number;
}

export interface DaoTrialDef {
  id: string;
  pathId: DaoPathId;
  targetStage: 4 | 7 | 10;
  kind: "combat_instance" | "point_click_instance";
  entranceConditions: ConditionDef[];
  normalizedCombatPolicy?: string;
  completionConditions: ConditionDef[];
  rewardIds: string[];
}
```

`ConditionDef` refers to a future typed registry contract, not executable client JS. Use `progressMilliXp` as a non-negative decimal representation of fixed-point milli-XP to avoid silently rounding low-quality XP to zero. Server stage progress is **cumulative within the current stage**; when threshold is reached, cap at threshold and stop accruing until trial clear (candidate, matches TD-01 capped progression philosophy). Non-trial stage transitions consume required current-stage XP and carry no unbounded bank. Explicit quest/pill grants should declare an overflow policy; no accidental auto-skip trials.

The stage progression is independent of character level, but **combat pressure** remains dependent on cultivation realm, gear and stats. This prevents Dao10 from automatically becoming invincible in an unadvanced body.

## 5. Proposed EXP curve (per stage, not cumulative)

| Advancement | Minimum Dao XP required | Trial? |
|---|---:|---|
| 1→2 | 100 | No |
| 2→3 | 260 | No |
| 3→4 | 650 | **Trial I** |
| 4→5 | 1,600 | No |
| 5→6 | 4,100 | No |
| 6→7 | 10,500 | **Trial II** |
| 7→8 | 27,000 | No |
| 8→9 | 72,000 | No |
| 9→10 | 200,000 | **Trial III** |

This is deliberately much harder at high stage. Do **not** assume a calendar completion time before TD-03's valid actions/minute and playtest. Requirement sums across 1→10 = **316,210 Dao XP** per path, excluding trial time; all six totals do not share a hidden global Dao-XP pool. At most one trial advancement per verified completion event.

## 6. Anti-spam Dao XP crediting — candidate algorithm

`GrantedDaoMilliXp = floor(BaseActionXp × 1000 × RelevantActionFactor × TechniqueEfficiency × ChallengeRelevance × BuffFactor)`

- **BaseActionXp**: initially `1.0` for a legitimate effective martial execution. Different authored activities (training, rare pills, exploration epiphanies) have separate, explicit reward budgets, and are not disguised monster hits.
- **RelevantActionFactor**: `1` when the action successfully creates a meaningful valid effect. A no-target cast, blocked range, dead mob, invulnerable dummy or fake client event grants **0**.
- **TechniqueEfficiency**: depends on quality and Dao stage. Candidate `max(0.05, 0.70 ^ max(0, currentStage - qualityComfortStage))`; comfort stages: Phàm 3, Linh 4, Hoàng 5, Địa 6, Thiên 8, Thần 9. Even a low-grade Võ Kỹ remains legally usable at Dao 9; it becomes very inefficient rather than banned.
- **ChallengeRelevance**: grounded in authenticated zone/monster threat vs current actor strength. Candidate `clamp(0.10, 1.0, sqrt(enemyThreat / max(1, playerThreat)))`; this prevents continuous grinding one-hit beginner enemies from matching dangerous practice. This ratio must use a stable, documented battle threat metric and be calibrated against balanced build simulations — **it is not a fixed map or character realm gate**.
- **BuffFactor**: bounded multiplication from explicitly permitted training/cultivation sources, proposed cap `1.5` for repeatedly farmed combat gains. One-off authored pills/fortunes add direct XP via separate audited reward transactions.
- **Credit throttle**: no more than one mastery credit per path per character every **2,000ms** from monster-combat actions, regardless of AoE enemy count or number of zero-CD casts. Actual cooldown eligibility must also pass. Do not grant 10 ticks for striking 10 mobs simultaneously.

The challenge relevance metric is a calibration candidate. Because high mastery itself can raise actor effectiveness, calculate threat consistently so it does not paradoxically discourage all high-stage practice. Large-authored encounters, trials and one-off rewards offer parallel mastery growth; trivial repeatable combat alone should not become the best route to Cảnh 10.

All online AFK combat credits use the **same server event gate** as manual attacks. No Dao XP is created by client animation, replaying a packet, disconnect or offline farm simulation. Offline `bế quan` remains Tu Vi-only unless a later explicitly approved exception is designed; current design does not authorize offline Dao XP.

## 7. Dao Stage vs combat power

A path provides a small **quality-of-execution bonus only when an equipped/valid skill matches it**. Candidate `PathCoefficient(stage) = 1 + 0.025 × (stage - 1)`, yielding +0% at Stage1 through +22.5% at Stage10. This coefficient applies *once per matching executed technique*, and does **not** multiply all six path stages into a universal attack stat. Stage 4/7/10 may unlock authored technique behavior rather than limitless stackable global passives.

The bonus should not erase one-major-realm combat suppression. A top Kiếm Đạo Luyện Khí is an impressive swordsman within Luyện Khí physical limitations, not automatically Trúc Cơ, Thánh Cảnh or immortal.

## 8. Trial examples — speculative content

| Gate | Combat archetype | Point-and-click archetype |
|---|---|---|
| Kiếm Stage3→4 | Defeat an arranged sparring sword formation with normalized weapon | Arrange sword inscriptions into correct lineage |
| Đao Stage6→7 | Survive waves with deliberate cleave timing | Choose which ancient blade bindings to break |
| Chỉ Stage9→10 | Defeat a swift single-target master in a normalized duel | Locate hidden meridians on a spiritual mechanism |
| Chưởng Stage3→4 | Interrupt an enemy channel using palm knockback | Activate palm seals in the right sequence |
| Thể Stage6→7 | Survive a sealed damage test with a chosen defensive build | Identify safe breathing/body-refinement sequence |
| Pháp Stage9→10 | Counter an elemental spell rotation | Resolve a small ancient rune formation |

No trial is complete content yet. Point-and-click trial decisions must be made by the player; no auto solver. Combat trial may execute equipped skills automatically, according to rules and server validation.

## 9. Acceptance tests

`DAO-01` Six paths with 10 stages; Stage1 initial state or explicitly defined first-unlock state.  
`DAO-02` The same character may progress multiple paths, without permanent class lock.  
`DAO-03` No progression to stage4/7/10 without its corresponding cleared trial.  
`DAO-04` A Luyện Khí character with enough legitimate credit and trials may reach Kiếm Đạo stage10; zero universal realm-stage check.  
`DAO-05` Skill from wrong path gives zero credit to the target path.  
`DAO-06` No-target / duplicate / replay / invalid-cooldown casts give zero XP.  
`DAO-07` AoE generates at most one path credit per valid execution.  
`DAO-08` A low-tier technique at high stage is allowed but inefficient (nonzero progress for valid threat).  
`DAO-09` Trial repeat, reward retry and reconnect cannot duplicate a stage or Stage10 achievement.  
`DAO-10` Derived stats recalculate cleanly on path-change and skill-swap, with no stacking of different Dao paths on one technique.  
`DAO-11` Stage cap 10, no EXP overrun, no Level or realm auto-increase from mastery.  
`DAO-12` Offline duration and merely playing an animation produce zero Dao XP.

## 10. Open owner review and next phases

The 10 names, per-stage XP, credit throttle, quality efficiency and trial mechanics remain proposed. TD-03 owns exact online Auto Combat schedule; TD-04 owns materials, books, consumables, reward acquisition. Full `Kiếm Tiên` Hậu Thiên reward parameters are not authorized yet. Do not invent a protected Legendary signature as an achievement reward.
