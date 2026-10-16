# TD-02 — Integration, Migration Risk and Verification Matrix

> Technical design review only. Existing base commit inspected: `d4e6e17`. No server source, client source, database, art or gameplay code is modified by this package.

## 1. Current repository evidence (read-only GitHub inspection)

| Current location | Observed reality | Intended future contract | Risk |
|---|---|---|---|
| `packages/shared/src/index.ts` | `CombatDisciplineId = kiem_tu|phap_tu|the_tu`; fixed three `AttackIntentPayload.skillId` union | Six DaoPath IDs, open registry IDs validated server-side, non-exclusive paths | Legacy class leakage, protocol transition |
| `packages/game-data/src/index.ts` | `SKILLS_REGISTRY` contains `basic_slash`, `kiem_khi_ung`, `ho_the_kim_quang` without tier/path | Two technique kinds, six tiers and typed effects | Old content mapping uncertain |
| `packages/game-data/src/index.ts` | Monsters store HP/attack/defense, cooldowns and loot, but no realm/stage or Character EXP | Authored realm/level/role, dual defense stats, EXP and threat rating | Cannot implement pressure or Dao challenge credit safely |
| `apps/server/src/worldEngine.ts` | `handleAttackIntent` computes one attack/defense damage, CD, MP and targeted monster; server HP authoritative | Multi-school effect pipeline, Dao-skill credit, server auto mode | Hard-coded single-player assumptions |
| `apps/server/src/worldEngine.ts` | Unknown `skillId` becomes `basic_slash` | Unknown or unauthorized skill rejected; legacy aliases still valid where explicitly learned | Forged client intent gets unintended basic attack |
| `apps/server/src/worldEngine.ts` | Monster kill directly adds every loot entry at minQty and also creates a collectible first-table ground item | Typed loot roll and exactly-once claims across direct/ground delivery modes | Potential double award; ignored drop chances |
| `apps/server/src/db.ts` | JSONB inventory and legacy mutable stats; per-action idempotency ledger | Versioned technique/Dao ownership state, atomic progression grants | Races with concurrent combat, restart |
| TD-01 approved *design*, not yet merged code | Six-stat recomputation, Level and destiny are specifications | TD-02 must integrate with TD-01 model *after code design* | Avoid implementing TD-02 on old mutable source of stats |

Inspect again after owner pushes TD-01 technical docs; report any changed filenames rather than assuming unchanged Git HEAD.

## 2. Suggested implementation sequencing (separate future coding phases)

| Sequence | Proposed change | Preconditions | Safe rollout |
|---|---|---|---|
| A | Add `DaoPathDef`, `TechniqueDef`, `MonsterCombatDef`, typed effects and ruleset validation | Approved TD-01 stats + TD-02 design | Additive packages; keep old aliases |
| B | Persist `knownTechniques`, loadout, Dao progress and trial state | Backup/test data and approved migration | Schema version + dual-read compatibility |
| C | Route current manually pressed legacy attacks through common resolver | Frozen golden tests of old prototype | Compatibility adapter preserves behavior until new tuning selected |
| D | Implement new damage schools, stage effects, realm suppression and monster definitions | Simulation tolerances approved | Test on isolated seeded fixtures, versioned balance config |
| E | Add Dao EXP event credit and stage/trial transitions | Trial fixtures, anti-spam and idempotency schema | Concurrent/reconnect negative tests |
| F | Feed common combat resolver into online Auto Farm (TD-03) | Connection presence and policy spec | Feature flag; no offline reward engine |
| G | Reconcile loot chance, direct vs ground reward and contributor credit | TD-04 item/loot contracts | Account for existing user inventory; non-destructive tests |

No instruction here authorizes modifying production code, the existing `.env`, database contents or any assets. A later Argon implementation task must be scoped, reviewed, then executed.

## 3. Mandatory invariants and technical edge cases

### Six martial paths

- A character can learn more than one path; switching equipped skill does **not** erase earned Dao stages or accidentally grant all path bonuses to unrelated skills.
- Per-use Dao XP is granted based on **server-resolved** technique ID and target, not an arbitrary `pathId` submitted by browser.
- Stage `3→4`, `6→7`, `9→10` requires specific trial completion evidence and exact-once reward.

### Two techniques / rarity

- Both `Công pháp` and `Võ kỹ` use `Phàm, Linh, Hoàng, Địa, Thiên, Thần`; no `Thánh` quality silently appears. Destiny keeps its separate four-tier table.
- No passive stats leak from learned-but-not-equipped skills.
- A technique cannot be used through custom WS messages without ownership, cooldown/MP, valid target and live game session.
- No perk/skill can remove cooldown below the floor or generate unlimited effects on an idle dummy.

### Server and multiplayer

- Damage, monster kill, Character EXP, currency, loot, Dao XP and relevant quest counters are derived from **one authenticated authoritative event chain** and saved idempotently.
- Two players hitting the last HP point cannot each trigger a monster's world-death reward twice.
- Client disconnect/reconnect may refresh current snapshots, **not** simulate offline kills.
- A monster dying at the moment a player disconnects needs a defined event-resolution cutoff; do not reward post-disconnect actions not already committed by the server.
- A party can aid against one-realm-higher monsters, but shared loot and group credit rules must be explicit, not an unintended duplicate payout.

### Migration

- Existing Phase 0/1A player records cannot be treated as if they had truly earned TD-02 Dao XP from past manual attacks. Do **not** fabricate past stage10 achievements from historical timestamps.
- Preserve old `basic_slash`, `kiem_khi_ung`, `ho_the_kim_quang` IDs as data aliases or one-time migration map only after reviewing initial 3-discipline starter behavior.
- Preserve historical item inventory and Phì Đế public-blessing quest. Do not use `equippedInheritance = phi_de` as a proof of protected signature/True Disciple.
- Do not delete old monster drops or reset accounts. Require test backup, migration plan, rollback and owner sign-off before changing SQL.

## 4. Automated test plan

| Test suite | Required cases |
|---|---|
| Technique registry | `TECH-01`–`TECH-10`, validators reject mixed technique/destiny quality and missing DaoPath refs |
| Dao mastery | `DAO-01`–`DAO-12`; XP zero on invalid casts, locked trial stages not auto-advanced |
| Combat arithmetic | `CBT-01`–`CBT-04`; deterministic seeded repeated damage with no NaN/overflow |
| Skill combat | `CBT-05`, `CBT-06`, `CBT-11`, `CBT-13`; cooldown, MP, ownership, rate limit |
| Combat economy | `CBT-07`–`CBT-09`; kill/loot/event dedup and AoE mastery invariants |
| Online presence | `CBT-10`; disconnect prevents future auto-hit/rewards, bế quan remains independent |
| Zone balance | `CBT-12`; Phàm can defeat starter creatures and hard Tiên challenge has expected feel |
| Trial normalization | `CBT-14`; no realm hard gate for Dao10; special combat instance checks |
| Persistence | Reload mid-cooldown/trial, concurrent combat events, atomic XP+inventory changes |
| Security | Client forged skill/crit/target realm, replayed request ID, speed spam, unauthorized character IDs |

Tests for PvP are not part of this phase. A visually compelling Phaser demo alone is not a substitute for authoritative tests.

## 5. Concrete acceptance gates for a future implementation handoff

**DESIGN**: owner signs off numeric coefficients/ranges and data contracts.  
**STATIC**: `npm run verify:assets`, `npm test`, `npm run typecheck`, `npm run build` pass after real code modifications.  
**MULTIPLAYER**: test two browser windows attacking same monster; separate XP/Dao and loot eligible credits without double-issue; recorded screenshots/video.  
**BALANCE**: seeded cross-realm simulations and four-build encounter table; starter Phàm remains viable.  
**CONTENT**: first existing zone shows appropriate enemy labels/HP; no invented Thần signatures or premature legendary rewards.  
**SAFETY**: no new generated artwork without genuine AI source and human visual review; no destructive database migrations without separate approval.

## 6. Remaining work allocation

- TD-01 still owns core attribute derivation, Level EXP, realm Tu Vi, destiny source and migration approval.
- TD-02 owns technique loadout, stage XP, trial gates, effect execution contract, damage and monster pressure.
- TD-03 owns presence, Auto Farm scheduler, auto pathfinding and quest tracker navigation.
- TD-04 owns item/equipment/food/gifts and all final loot, rewards, achievements and content prerequisites.
- TD-05 owns AI artwork, animated sprites, map integration and visual signoff.
