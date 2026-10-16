# SYS-COMBAT — Server-Authoritative PvE, Realm Pressure and Monster Balance

> TD-02 DRAFT v0.4 | `DESIGN_BASELINE` only for numerical coefficients | Maintains `GD-002`, `GD-020`–`GD-028`, `GD-030`–`GD-035`. Combat and monster catalogs are **not** approved game implementation as of this draft.
> Integrates proposed TD-01 `StatSnapshot`/realm-factor design. TD-03 designs auto targeting and connection presence; TD-04 designs loot and economy. No automated quest completion.

## 1. Core philosophy and encounter tiers

The physical game world is real: 2D pixel characters actually travel on authored maps, cast spells, attack shared server-owned monsters and display hits/loot. Players choose build, skills, zone, healing thresholds and target policy. **The server executes legal combat only while the player remains online.** Players still choose and manually complete quests; auto-navigation only reaches objective locations.

**Monster strength does NOT scale to whoever is looking at it**. An encounter has a fixed level band, realm/stage, authored stats and role (`starter`, `common`, `elite`, `boss`, `instance`), shared across connected players. The same visible Trúc Lang has the same HP and rules to all clients at one encounter instance. Zone difficulty targets a coherent **Tiên-quality build** of the appropriate realm/level, while beginner training paths must remain viable for Phàm/Hoàng players; not every creature should be Tiên-tier hard.

Do NOT calculate strength as a naive average of destiny/technique/equipment rarity. Real performance is measured through win rate, time-to-kill, potion usage, survival, EXP/hour, loot/hour and (later) party roles.

## 2. Data and typed API sketches

```ts
export type DamageSchool = "physical" | "spiritual";
export type MonsterRole = "starter" | "common" | "elite" | "boss" | "instance";

export interface CombatActorSnapshot {
  characterId: string;
  realmIndex: number;
  level: number;
  currentHp: number;
  currentMp: number;
  physicalAttack: number;
  spiritualAttack: number;
  physicalDefense: number;
  spiritualDefense: number;
  effectiveThanPhap: number;
  daoStages: Record<DaoPathId, number>;
  rulesetVersion: string;
}

export interface MonsterCombatDef {
  id: string;
  nameVi: string;
  realmId: string;
  realmStage: number;
  levelBand: [number, number];
  role: MonsterRole;
  maxHp: number;
  physicalAttack: number;
  spiritualAttack: number;
  physicalDefense: number;
  spiritualDefense: number;
  actionIntervalMs: number;
  attackPatternIds: string[];
  lootTableId: string;
  expReward: number;
  daoThreatRating: number;
  respawnMs: number;
}

export interface CombatResolution {
  eventId: string;
  attackerId: string;
  targetId: string;
  techniqueId: string;
  damageSchool: DamageSchool;
  dealtDamage: number;
  wasCrit: boolean;
  hpAfter: number;
  killed: boolean;
  rulesetVersion: string;
}
```

The above defines the new architecture's target shape, not an instruction to overwrite the prototype immediately. In production, monster snapshots include authoritative instance/zone coordinates, AI telegraphs, attack state, aggro, collision, respawn state, and a deterministic RNG seed. `daoStages` may be derived from a separate character aggregate. Server does not accept `physicalAttack`, `crit`, `targetHp`, `monsterRealm` or `damage` values from the client.

## 3. Damage calculation order — candidate v0.4

1. Validate authenticated actor and live connection, target existence/aliveness/zone, legal range/line of sight and accessible path; check skill learned+equipped, current action/cooldown, resource cost and global action rate.
2. Obtain *immutable* derived stats from TD-01 `Stat Calculation Engine`; determine one damage school (physical or spiritual) from the authored effect; for a dual-type effect, resolve each separately and sum once.
3. Compute raw attack from the corresponding TD-01 derived stat, already including legal gear, technique-passive, trait and consumable bonuses.
4. Multiply by authored **skill coefficient** and the applicable **single Dao-path skill execution coefficient**. Do not multiply by a separate generic rarity factor if quality already influenced the authored coefficient.
5. Apply defense mitigation using a **realm-normalized armor constant** to avoid defense becoming near-invulnerability at Thánh Cảnh merely because TD-01 attributes grow exponentially with `RealmFactor`.
6. Apply explicit **realm suppression** when a lower-realm attacker targets a higher-realm defender. Apply separately to incoming monster attacks, never a hidden total `CombatPower` adjustment.
7. Resolve authored typed buffs/shields and bounded crit/evasion/status (when enabled); floor/clamp the final integer damage and mutate server HP once. Apply rewards only on verified kill/contribution rules.
8. Emit one `CombatResolution` event to players; client animates and displays, but never decides hit numbers, EXP or loot.

Candidate, **no crit, shields or elemental effects**:

`K(targetRealmIndex) = 40 × (1.50 ^ targetRealmIndex)`

`MitigationFactor = K / (K + max(0, TargetRelevantDefense))`

`PathCoeff(pathStage) = 1 + 0.025 × (pathStage − 1)`

`OutgoingPressure = (attackerRealmIndex < defenderRealmIndex) ? 0.45 ^ (defenderRealmIndex − attackerRealmIndex) : 1`

`FinalHit = max(1, floor(Attack × SkillCoefficient × PathCoeff × MitigationFactor × OutgoingPressure × OtherBoundedModifiers))`

For **monster hitting a player one or more major realms below it**, add `IncomingThreat = 1.65 ^ positiveRealmGap` to the monster's damage outcome. Do not apply both outgoing penalty and incoming threat multiplier to the **same hit**. This monster-pressure policy is PvE-only and excludes explicitly normalized Dao trial instances.

`40`, `1.50`, `0.45`, `1.65`, `0.025` and the minimum damage `1` are **numeric baselines to calibrate**, not user-approved canon. The `1.50` aligns this exercise with TD-01's proposed realm-factor curve but does not mean all late-game numbers are balanced. Keep coefficients in a versioned `CombatRuleset`, not scattered magic numbers.

### Why normalize armor constant by defender realm?

TD-01 proposed attribute factor `1.50 ^ realmIndex`. If high-realm DEF increases 1,000× while a fixed armor constant remains `100`, mitigation can approach 100% and make normal same-realm encounters unusably slow. Scaling `K` by realm index keeps mitigation in an interpretable range for **same-realm** builds, while higher-realm monster pressure still produces the expected power gap. Test against the 17-realms table with actual player and monster stat profiles before implementation.

### Optional accuracy and crit — candidate, NOT part of first simulation

- Initially treat valid PvE attacks as hittable when range/line-of-sight/cast predicates pass; no hidden random miss on starter monsters. Attack animations and enemy warning/defensive effects still matter.
- Proposed `baseCritChance = clamp(0.05 + 0.002 × (effectiveThanPhap / max(1, actorRealmFactor) − 10) + 0.002 × (currentDaoStage − 1), 0.03, 0.30)`; `critMultiplier = 1.5`. Normalizing by realm factor prevents Crit from automatically capping when merely breaking a cultivation realm. Crit applies once after main reduction; server-seeded RNG only. **No crit in deterministic balance tests below.**
- Hit/miss/evasion, elemental types, DoT, shields, stagger and PvP balancing need a subsequent explicit effect-order test suite. Do not invent client-controlled chances.

## 4. Monster map design, progression and anti-exploit

A single map can contain multiple explicitly authored **subzones** with fixed threat bands, never player-adaptive mobs. For the first slice:

- `Tân Thủ Thôn`: safe hub, no shared ambient hostile mobs, main quest and artisan interactions.
- `Thanh Trúc Lâm` **outer**: starter beasts eligible for Phàm Nhân Lv1–10. A basic Phàm build must be able to progress without rerolling, without signature and without spending money.
- `Thanh Trúc Lâm` **inner**: authored Luyện Khí bands with common and optional elite challenges. One representative **Tiên-quality challenge** may be difficult for Phàm/Hoàng, viable but risky for Tiên, comparatively comfortable for Thần.
- A Trúc Cơ enemy appearing as an elite/boss at the edge of that map remains exceptionally difficult for ordinary Luyện Khí solo farming; a rare high-quality build with serious consumables or party coordination may try it. Never scale the enemy down to a low-level player's build.

Monsters provide **Character EXP** and loot when killed through a legitimate online action; Tu Vi primarily comes from bế quan/cultivation sources but some authored monsters/events may grant modest Tu Vi if so defined. **A higher-tier monster never guarantees more net EXP/hour** if the build is constantly dying/using costly pills. Rewards should be based on zone target level, monster threat and scarcity, with diminishing returns against trivial mobs if economic farming exploits emerge; never tune to force reroll of Tiên Thiên.

Defeating a monster that is one major realm above the player is a feat, not the default route. If `gap ≥ 2`, the proposed pressure curves and authored stat progression make solo victory extremely unlikely. For gap 1, exceptional buffs, party and skill counters can allow isolated wins. No hard `if lower realm then damage=0` rule.

## 5. Deterministic simulation: representative Luyện Khí challenge

The scenario below is an **isolated synthetic example**, not values from the current actual `truc_lang` or `thanh_lan_xa` content. Build values already combine TD-01 stat+gear+passive effects; we do NOT infer raw tier from the sum of item rarities.

All attackers are Luyện Khí (`realmIndex=1`, similar target Level band), Dao path Stage 1, legal repeated single-target skill casts **once/second**. Mob attacks every **2.5s**, first attack at `t=2.5s`; each attack is resolved before the next second's player action except exact timestamp ties (player acts first). No crit, healing, regeneration, dodge, death penalty or skill MP exhaustion. Damage is floored per hit. Combat stops on first death.

| Representative build | HP | ATK | DEF | Skill coefficient |
|---|---:|---:|---:|---:|
| Phàm-oriented | 660 | 100 | 48 | 1.00 |
| Hoàng-oriented | 850 | 130 | 62 | 1.15 |
| Tiên-oriented | 1,000 | 165 | 80 | 1.40 |
| Thần-oriented | 1,250 | 220 | 100 | 1.70 |

**Challenge enemy A**: Luyện Khí (`r=1`), HP `2,400`, ATK `160`, DEF `80`. **Challenge enemy B**: Trúc Cơ (`r=2`), HP `4,200`, ATK `230`, DEF `125`. The monsters are authored synthetic benchmark targets and not mandatory stats for Thanh Trúc Lâm production.

| Build | Same-realm enemy A | Time | Remaining HP (if win) | Higher-realm enemy B | Time |
|---|---|---:|---:|---|---:|
| Phàm | LOSE | 20.0s | — | LOSE | 10.0s |
| Hoàng | LOSE | 27.5s | — | LOSE | 12.5s |
| Tiên | WIN | 25s | 388 / 1,000 (38.8%) | LOSE | 17.5s |
| Thần | WIN | 15s | 950 / 1,250 (76.0%) | LOSE | 22.5s |

This demonstrates the **requested relative feel** without defining any universal quality tier index. Changing HP/ATK/DEF, AoE, movement, MP or healing will affect results. In particular, the demonstration is a difficult challenge mob; ordinary starter monsters must be easier and viable for Phàm builds. Simulation script is bundled at `tools/td02_simulate.py` for reproducibility.

## 6. Combat output measures and balance acceptance

For each map threat band and four *cohesive* representative builds, evaluate:

| Metric | Target intent (review only) |
|---|---|
| Win/survival rate | Starter path: Phàm must progress; challenge: Tiên can win with risk |
| Time-to-kill | Distinguishes Hoàng/Tiên/Thần efficiency without one-hit all mobs |
| HP/potions | Difficult fights produce meaningful survival tradeoffs, no forced purchases |
| EXP/hour | Account for travel/respawn/MP/potion use, not just `expPerKill` |
| Dao XP/hour | Limited by legal casts, technique quality, threat relevance and trials |
| Over-realm fight | Lower realm auto farming higher realm must be poor/unviable; exceptional wins possible |
| Multiplayer attribution | Shared HP, valid hit attribution, no double-loot, no disconnect farming |

The historical target ratios **45% / 70% / 100% / 140%** are *rough power-feel anchors*, NOT damage multipliers to plug into the server. Reject any tuning that directly maps a rarity label to universal damage output.

## 7. Server lifecycle and rewards

Single logical combat pipeline for manual and auto intents:

`AuthoritativeActionValidated → TechniqueExecuted → HitResolved → HPChanged → MonsterKilled? → RewardAttribution → CharacterEXP/InventoryEvent → DaoMasteryCredit? → QuestCounterIfActive?`

Atomic/durable boundaries: use unique action/event IDs to avoid duplicate reward claims; server update of monster death and its attributed rewards must be idempotent under retries. One monster death grants exactly the configured rewards to eligible contributors under a documented party policy. When damage shares are used, cap credit windows; avoid kill-stealing exploit and AFK leech. The effects are applied transactionally where practical, with restart-safe ledger patterns; in-memory pre-lock alone is insufficient for duplicate grants across server workers.

**Current prototype hazards observed from `apps/server/src/worldEngine.ts`**:

- An invalid `skillId` falls back to `basic_slash`, rather than being rejected, which is not a safe future techniques contract.
- On monster kill, the code adds every loot-table entry directly to inventory at its `minQty`, regardless of `chance`/`maxQty`; it also spawns a ground drop from the first table entry. This creates a **potential extra reward / duplicate acquisition** if the drop is picked up. It must be reconciled in TD-04 and should not become the final loot policy.
- Current kill grants `tuViReward` and currency but no separate Character EXP or Dao credit; TD-01/02 progression is **not implemented**.
- Current `MonsterDefinition` lacks major realm/stage/level band; realm suppression and map-tier balance require schema migration.
- The current actor stores `attack`, `defense`, `maxHp`, `maxMp` as source-like mutable values; TD-01 recalculation must be integrated first to prevent drifting sums.
- The current `db.ts` `saveCharacterState` and `recordIdempotency` operations are separate; they are **not proof of one transaction across reward+state+ledger**. Design a transaction/locking strategy before running online auto combat at scale.

These findings are a **code review**, not a claim that the current prototype has an audited exploit in production. Preserve legacy achievements/inventory unless data migration is explicitly authorized. Do not edit source as part of TD-02 documentation.

## 8. PvE vs PvP and trial normalization

Version 1 aims at cooperative friends, PvE challenge and shared-world farm; do not prioritize PvP. PvP damage and realm pressure need a dedicated balance ruleset if later enabled. Dao trial combat can opt into fixed `normalizedCombatPolicy` and equalized/max-bounded trial actor stats so mastery requirements don't become disguised cultivation gates, while still validating learned/equipped/used martial skills.

## 9. Acceptance tests

`CBT-01` Physical/spiritual defense selects correct attack/defense pair.  
`CBT-02` Realm-normalized `K` produces nonzero finite damage for representative realms 0–17.  
`CBT-03` Same-realm damage monotonic when ATK increases and DEF unchanged.  
`CBT-04` One-realm-higher monster suppresses low-realm attacker as expected, no hard immunity.  
`CBT-05` Invalid skill, range, dead target, missing MP or blocked cooldown return errors with zero damage.  
`CBT-06` Client-supplied damage, crit or fake monster level never change server calculations.  
`CBT-07` Concurrent hits to shared monster cannot generate two death/reward events.  
`CBT-08` One AoE effect with multiple targets cannot multiply mastery XP per target.  
`CBT-09` Ground drops and direct rewards do not issue the same configured loot twice.  
`CBT-10` Logout/disconnect stops auto-farm; no EXP/loot offline.  
`CBT-11` Historical `basic_slash/kiem_khi_ung/ho_the_kim_quang` IDs remain migration-safe.  
`CBT-12` Starter encounters beatable by base Phàm player; Tiên-tier challenge matches simulated intent.  
`CBT-13` PvE talent modifiers are bounded, no infinite attack speed/crit/defense feedback.  
`CBT-14` Normalized trial combat never silently grants Stage4/7/10 without completion proof.

## 10. What TD-02 does not authorize

Do not build Auto Farm logic (TD-03), automate quests (never approved), implement full item/equipment/loot catalogs (TD-04), modify visuals (TD-05), start paid image providers, add PvP, or rewrite data/schema without a separate coding approval. This is a *technical specification draft* pending explicit owner sign-off.
