# TD-04 — Cross-TD Consistency Matrix and Design Freeze Handoff

> TD-04 v0.6 | Owner review required. This supplements TD-03's `TD03_CONSISTENCY_MATRIX.md`, and protects Baseline v0.2 decisions. It must become a **single reconciled matrix** in Technical Design Freeze v1.0, not a competing source of truth.

## 1. Ownership matrix — no duplicated engine

| Operation | Final rules owner | TD-04 supplies only | Forbidden duplication |
|---|---|---|---|
| Character Level EXP, six base stats, Realm/Tu Vi | **TD-01** | Reward EXP/Tu Vi quantities and authored item/modifier IDs | Alternative Level formula or EXP banking at cap |
| 3 Tiên Thiên, Hậu Thiên, 10 signature exclusion | **TD-01** | Catalog linkage and eligibility predicates | `grantSignature` from generic loot/public quest |
| Martial six Dao and 10 stages/trials | **TD-02** | Instance IDs and authored trial content refs | Seven Dao paths, automatic trial bypass |
| Combat/kill and skill cooldown/damage | **TD-02** | Fixed monster stats by encounter-area, loot tables/rewards | Separate Auto Farm damage or reward codepath |
| Online-only actor modes / connection epoch | **TD-03** | Allowed zones, target metadata, potions policy | Offline farm or second quest automation |
| Navigation / collision / portal passage | **TD-03** | World graph, approach location, portal permission type | Teleport by client-submitted waypoint |
| Quest state/credit/manual claim | **TD-03** | QuestDef templates/rewards/reset rules | Auto accept, auto hand-in, bypass conversation |
| Items, economy/loot, Food Catalog, gifts | **TD-04** | Itself owns domain catalog + one-of drop delivery specification | Duplicate inventory & ground award for same roll |
| Story/lore | **Game Design v0.2** and human decisions | Authored draft content under existing narrative | Secret Phì Đế reveal in beginner zone or assume masked mentor identity |
| Genuine AI art, sprite atlas/Tiled aesthetic approval | **TD-05 / AGENTS.md** | Stable art IDs and asset briefs | Procedurally created final art / automatic approval |

## 2. Design decisions that cannot change silently

- `GD-002/003/004/005`: Farm online only; quest manual; auto-route only; offline bế quan ≤8h separated.
- `GD-010..018`: 3 immutable innate rolled as set, 3 active Hậu Thiên slots, four Destiny rarity tiers; **one of ten** Legendary signatures across **innate+acquired**. General Thần traits distinct.
- `GD-020..023`: Phàm Lv1–10 and 17 realms × 20 level bands through Thánh Lv350, 351+ unlimited only Thánh; EXP separate Tu Vi, one point per actual level, no EXP banking if at capped realm per **owner-approved TD-01**; Lv10 masked immortal mandatory.
- `GD-024..028`: exactly six martial paths: Kiếm, Đao, Chỉ, Chưởng, Thể Tu, Pháp Tu; ten stages with 3→4, 6→7, 9→10 trials; six stats Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính. Candidate stage names not automatically approved.
- `GD-030..032`: separate Công Pháp and Võ Kỹ, each six ranks Phàm, Linh, Hoàng, Địa, Thiên, Thần; equipment rarity **separate and unresolved**.
- `GD-033..037`: no dynamic monster scaling; representative Tiên-quality challenge, beginner farm accessible; two instance forms; two initial maps, more future zones planned.
- `GD-040..046`: universal Main Quest across 10 Legends, separate optional six-chapter private routes, culminates Thánh and reveals Phì Đế = incarnation of Ăn Uống Thiên Tôn. Higher realms remain lore-only; `GD-046` names and seven-act scaffolding PROPOSED.
- `GD-045`: purchased or cooked qualifying food both valid for public Phì Đế; food special-trigger threshold UNRESOLVED pending catalog/owner review.
- Canon: `dam_lon_tien_tu` realm UNKNOWN, ChatDVT jade-cyan quadruped beast, no invented realm/identity; fake-money RMT/Vaal fantasy only, no real-money payment/gambling.

## 3. Design resolutions and deliberately unresolved decisions

| ID | Proposed resolution | Status | Freeze action |
|---|---|---|---|
| T4-OPEN-01 | Food Catalog holds unique discoveries with source provenance and catalog revision; 18 seed concepts only | DESIGN_BASELINE | Owner approves taxonomy; threshold stays UNRESOLVED |
| T4-OPEN-02 | One loot delivery mode per reward roll, direct XOR ground | DESIGN_BASELINE, security imperative | Validate implementation + source event ledger; owner chooses presentation priority |
| T4-OPEN-03 | NPC favor 0..1000 vs -1000..1000, gift diminishing returns/cooldown | UNRESOLVED NUMERIC | Must not quietly hardcode universal True Disciple gate |
| T4-OPEN-04 | Town daily reset Asia/Ho_Chi_Minh 00:00, safe claim past midnight | DESIGN_BASELINE | Validate player's desired reset time and TTL before coding |
| T4-OPEN-05 | Party reward contributors (damage/support, proximity), individual claims | DESIGN_BASELINE | Exact thresholds and shared vs personal loot TBD |
| T4-OPEN-06 | Open unlocked public portal auto-pass in navigation | TD-03 DESIGN_BASELINE | User approval/first slice playtest with portal UX |
| T4-OPEN-07 | Equipment has 6 slots; equipment rarity ladder undefined | TD-01 DESIGN_BASELINE | Define and simulate gear after player review, never assume technique grade |
| T4-OPEN-08 | Distinct proposed new food and first-slice quest IDs | PROPOSED CONTENT | Owner approves names, art and balance before publishing |
| T4-OPEN-09 | TD-01 numeric stat/EXP factors; TD-02 damage/threat/test builds; TD-03 scheduler defaults | PREVIOUS OWNER-APPROVED REVIEW BASELINES | Remain unchanged in TD-04; Design Freeze merges final versions |
| T4-OPEN-10 | New world area IDs for uncreated maps | PROPOSED | Never create fake Tiled positions/rooms or label released |

## 4. Design Freeze integration gate (after TD-05)

1. **One copy** of each accepted TD doc in `docs/systems/` or `docs/technical/`; freeze manifest with SHA-256, dependency graph, repo base SHA, and explicit decisions accepted during review. Do not include parallel contradictory versions of same path.
2. Machine diff verifies TD-01, TD-02 and TD-03 approved docs remain byte-for-byte unless change separately re-approved; TD-04 never edits them by force. All new content baselines carry APPROVED/BASELINE/PROPOSED statuses.
3. Cross-reference checks against original `docs/DECISIONS.md`, ten NPC IDs, 17 cultivation realms, six Dao paths, four Destiny tiers, six Technique tiers and TD-03 quest categories.
4. TD-05 must cover AI image source provenance/human art review, source `80×96`/`480×1920` and legacy `48×64` coexistence, Tiled layers, quest tracker and Q UX, animated monsters/skills and gameplay zoom screenshots.
5. Docs-only Argon import in **one turn** after all five TDs owner-approved. It must safely compare Git `master`, import files without touching `apps/`,`packages/`,`assets/`,`maps/` or `.env`; update AGENTS/context/index/status and show tests and `git status`; **no commit/push** until the owner checks it.
6. Subsequent implementation sliced Plan → Build → Review → Verify: TD-01 domain/identity, TD-02 combat, TD-03 online activities, TD-04 reward/content, TD-05 art/playtest. Do not ask Argon to implement the whole MMORPG in one turn.

## 5. Proposed owner approval at TD-04

Approval to continue TD-05 means approval of **design direction and interfaces**, not blanket acceptance of unreviewed high-level item prices, NPC favor thresholds, new region/narrative names, future equipment quality tiers, or Food Catalog special-trigger numerical condition. These remain marked for later focused balance/story decisions.
