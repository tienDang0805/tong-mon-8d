# TD-03 — Game Design & TD-01..05 Consistency Register

> v0.5 | **REVIEW_REQUIRED** | Purpose: protect the owner's accepted canon during multi-phase design and eventual single-package Design Freeze. This records TD-03's dependencies, not implementation status.

## 1. Source hierarchy for TD-03

1. `AGENTS.md`/`RULES.md` — security, approved production rules and canon protection.
2. `docs/DECISIONS.md` baseline v0.2 — APPROVED gameplay and NPC/realm invariants (Git baseline `d4e6e17`).
3. Owner-approved TD-01 v0.3, TD-02 v0.4 — accepted proposals as **numeric design baselines**, still subject to end-to-end balancing and technical design freeze.
4. `docs/GAME_DESIGN.md`, `NARRATIVE_DESIGN.md`, `WORLD_DESIGN.md`, `UX_DESIGN.md`, `CONTENT_PIPELINE.md` — owned game design and proposed narrative scaffolding.
5. Legacy code (`packages/shared/`, `packages/game-data/`, `apps/server/`, `apps/client/`) — existing implementation evidence but not permission to override later decisions.

Never auto-promote a PROPOSED antagonist name, art candidate, numeric threshold, NPC realm or hidden mentor identity. `dam_lon_tien_tu` remains `UNKNOWN`; ChatDVT remains a quadruped jade-cyan spirit beast; ten Legendary IDs and all 17 realms remain unchanged.

## 2. Immutable cross-system invariants

| Rule | Reference | TD-03 implementation meaning |
|---|---|---|
| Online-only Auto Farm | `GD-002`, `GAME_DESIGN.md`, TD-03 `AUTO_FARM.md` | Authoritative connected controller required. No offline attack/EXP/Dao XP/loot/kill counter or catch-up. |
| No Auto Quest | `GD-003`, `NARRATIVE_DESIGN.md`, TD-03 `QUEST_ENGINE.md` | NPC/dialogue/accept/submit/choices/puzzle performed by human. |
| Route only | `GD-004`, `WORLD_DESIGN.md`, TD-03 `NAVIGATION.md` | Auto navigation stops near objective; visit credit only for explicitly authored visits. |
| Capped offline bế quan | `GD-005`, TD-01 `CULTIVATION.md` | Separate meditative session max 8h with no concurrent online farm. |
| Global progression | `GD-020..023`, TD-01 `CULTIVATION.md` | Character EXP separated from Tu Vi, Lv1–350+; Level cap blocking except Saint, new major realm keeps level on breakthrough; Lv10 masked mentor/pill/method gate. |
| Six origin stats | `GD-028`, TD-01 `CHARACTER.md` | Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính. No alternative Linh Căn or Cơ Duyên stat. |
| Destiny ownership | `GD-010..018`, TD-01 `DESTINY.md` | 3 immutable Tiên Thiên; 3 active Hậu Thiên; one Legendary signature total across innate/acquired; no auto replacement/auto signature grant. |
| Six martial Dao paths | `GD-024..027`, TD-02 `DAO_MASTERY.md` | Kiếm, Đao, Chỉ, Chưởng, Thể Tu, Pháp Tu, ten stages; trials 3→4, 6→7, 9→10; no realm-hard-gate. |
| Technique ranks | `GD-030..032`, TD-02 `TECHNIQUES.md` | Công pháp != attack, Võ Kỹ uses six grades Phàm/Linh/Hoàng/Địa/Thiên/Thần; no seventh `Thánh` grade. |
| Fixed monster tiers | `GD-033..034`, TD-02 `COMBAT.md` | Enemy stats authored per zone; no adaptive scaling to destiny build, no absolute impossible cross-realm damage. |
| Two Bí Cảnh formats | `GD-035`, TD-02 `DAO_MASTERY.md` | Auto combat skills permissible in combat trial; interactive point-click puzzles require player. |
| Universal Main Quest | `GD-006`, `GD-040..044` | All 10 Legendary appear to everyone; ten signature-exclusive six-chapter side paths only; main ending reveals Phì Đế/Ăn Uống Thiên Tôn. |
| Culinary/public vs signature | `GD-016`, `GD-045`, TD-01 `DESTINY.md` | Purchased OR cooked qualifying food works publicly, no automatic Chân Truyền; food count remains UNRESOLVED. |
| Art sources | `AGENTS.md`, TD-05 future | New production art genuinely AI-sourced and human-approved; TD-03 cannot generate UI art via procedural fallback. |

## 3. Phase dependency matrix and ownership

| Domain contract | TD-01 (approved) | TD-02 (approved) | TD-03 (here) | TD-04 (future) | TD-05 (future) |
|---|---|---|---|---|---|
| Character/realm/EXP | **Owns** | Consumes | Validated kill/quest grants | Authored reward amounts | Displays |
| Destiny & Chân Truyền prerequisites | Owns trait uniqueness/slots | Technique source consumes | Engine checks quest gates | **Owns** special triggers, affinity & 6-chapter catalogs | UI assets/dialogue art |
| Combat/stats and Dao XP | Stats sources | **Owns** formula, path XP, trial gates | Same validated action scheduler, no formula rewrite | Monsters, rewards, party policy | Sprites, VFX, visual QA |
| Character online presence | Character identity | Shared kill handler | **Owns** controlling epoch and activity modes | Multiple zone/world events | AFK status presentation |
| Quest routing/collision | Character zone identity | Encounter hazards | **Owns** path and stop rules | **Owns** zone graph/route metadata | Route visual presentation |
| Manual quests / events | Level gate | Kill and mastery events | **Owns** generic event credit & submission | **Owns** content, objective catalogs, food triggers | Quest tracker/journal final UX |
| Item/loot/potions | Character inventory state | Combat reward entitlement contract | Pickup/credit integration | **Owns** loot tables, consumables, crafting, equipment and drop mode | Icons, drop sprites |
| Bế quan | **Owns** Tu Vi/time cap | No offline Dao gain | **Owns** exclusion from live farm and eligibility state | Cultivation items and cave upgrades | Bế quan visuals |
| Asset pipeline | No role | Skill/VFX requirements | UI interaction requirements only | Content/asset references | **Owns** generated art integration and sign-off |

**TD-03 must not write definitive Food Catalog counts, NPC affinity numbers, monster HP/EXP/hour, portal trigger location data or final UI pixels.** Those are precisely TD-04/TD-05 decisions.

## 4. Design assumptions to revisit, not silently lock

| ID | Candidate | Why revisit |
|---|---|---|
| T3-OPEN-01 | Connected room controller epoch, one active controller/tab; reconnect stays IDLE | Auth/session product design and network timeouts need real two-browser proof |
| T3-OPEN-02 | Scheduler target 5Hz/actor with 20 friends (~100 evaluations/sec) | Validate CPU/latency and combat tick interplay on actual Colyseus instance |
| T3-OPEN-03 | Safe default: target same/lower realm, exclude bosses, 35% HP / 20% MP thresholds, 320px pursuit | Needs economics, map size, scarcity and survival playtests |
| T3-OPEN-04 | Player explicitly starts bế quan before logging out | Old prototype claims elapsed time without explicit start; product UX needs owner sign-off |
| T3-OPEN-05 | Public unlocked travel portals may be crossed automatically; gated/story portals stop | Must align with portal UX and real map requirements |
| T3-OPEN-06 | Objective `visit` may increment on server-confirmed arrival | Strictly factual movement, not auto-dialogue or hand-in; needs quest-author approval |
| T3-OPEN-07 | Party kill credit, contribution window, per-member loot, monster spawn density | TD-04 design and server risk testing |
| T3-OPEN-08 | Daily reset timezone/period and hidden quest discovery | TD-04 authored content and server-time policy |

None of these are new user-approved canon by default. They are **reviewable technical defaults**, not reasons to stall TD-04 design.

## 5. Single bundle workflow / Design Freeze

- **Current state:** TD-01 approved in conversation; TD-02 approved in conversation; TD-03 awaits review. All docs exist as local artifact ZIPs and **have not yet been integrated into Git**. Git `d4e6e17` remains the Game Design Baseline v0.2 code/docs reference.
- Next: owner review TD-03 → author TD-04 (world, items, food catalog, affinity and quest content contracts) → TD-05 (art/UX pipeline and sign-off).
- After TD-05: merge all approved files into one **Technical Design Freeze** ZIP with deterministic SHA-256 manifest, this cross-phase register, a resolved-owner-decision ledger and a one-turn **docs-only** Argon integration prompt. Do not include duplicate versions under the same repo path.
- Argon integration: read current Git + baseline, import docs, validate IDs/reference links and exact owner statuses, **do not code**, report results, owner reviews/pushes.
- Only afterwards: approve small implementation tasks in order TD-01 foundation → TD-02 combat → TD-03 activity/quest → TD-04 authored content → TD-05 art, each Plan → Build → Review → Verify.

## 6. Consistency gate checklist for Design Freeze

The final package fails freeze if ANY of these remain: a secondary auto combat damage/reward codepath, offline monster simulation, automatic quest turns/choices, signature awarded by public Phì Đế dish quest, different six Dao paths, incompatible EXP Level cap, technique rarity mistaken for destiny rarity, fixed mandatory realm for all Dao/Chân Truyền, no documented migration of old `equippedInheritance`, no server-owned quest source IDs, duplicate direct+ground loot, production artwork lacking human source/approval, or a proposal presented as approved canon.

**Document status:** DRAFT for owner review. Tests in TD-03 `REFERENCE_SIMULATION.md` are isolated illustrative checks, **not production test evidence**.
