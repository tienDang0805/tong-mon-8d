# Tông Môn 8D — Human-Approved Decisions Register

> Version: **Game Design Baseline v0.2** | Date: **2026-10-16** | Design owner: **Project Owner**
> Repository checkpoint consulted: `master@7914c2a` (Phase 1A). This file documents **design decisions**, not implementation claims.

## How to interpret statuses

- **APPROVED**: Explicitly specified/accepted by the project owner in design discussions; do not override silently.
- **DESIGN_BASELINE**: Designer-selected provisional defaults under owner delegation; implement only after technical review/simulation, can be tuned without changing the game's identity.
- **PROPOSED**: Narrative/content/mechanics suggestion not yet ratified; cannot be treated as canonical fact.
- **UNRESOLVED**: Needs a later focused specification or playtest.
- **LEGACY**: Older instructions or code exist, but a later APPROVED decision supersedes their intended behavior. Preserve actual code until a migration is authorized.

For claims of implementation, read `docs/PROJECT_STATUS.md` and inspect code/tests. For visual creative approvals, continue using the five-state system in `AGENTS.md`/`docs/ART_BIBLE.md`.

## A. Core game, AFK and quest interaction

| ID | Status | Binding decision | Notes |
|---|---|---|---|
| GD-001 | APPROVED | Browser-based multiplayer 2D pixel-art Xianxia RPG set in **Bát Hoang Tu Tiên Giới** / **Tông Môn 8D**. | Designed initially for friends; never introduce monetization/pay-to-win. |
| GD-002 | APPROVED | **Online AFK combat/farming** is a primary playstyle: player configures skills, target preferences and healing; character automatically fights/loots while connected. | Closing browser/disconnect **stops auto farm**; no offline monster EXP/loot simulation. |
| GD-003 | APPROVED | **NO Auto Quest execution.** A compact highlighted quest tracker and `Q` journal show Main, Side, Special, Daily and Town Quest Board tasks. | Player accepts/interacts/completes quests and makes decisions. |
| GD-004 | APPROVED | **Auto-navigation only** assists travel to a tracked quest objective/locale, stopping at destination. | No automated dialogue, submissions or story choices. Online auto kills may legitimately contribute to already-active kill objectives. |
| GD-005 | APPROVED | Offline **bế quan/meditation** is a separate activity from auto farm, retaining the existing capped offline meditation concept (currently ≤ 8 hours). | No automatic quest advancement offline. Detailed offline eligibility/reward policy is TECHNICAL DESIGN pending. |
| GD-006 | APPROVED | Main quest and ordinary farming/leveling are fully playable **without ever becoming a Chân Truyền**. | Legendary inheritance is an optional advancement side route. |

## B. Mệnh cách / destiny

| ID | Status | Binding decision | Notes |
|---|---|---|---|
| GD-010 | APPROVED | Character creation rolls **3 Tiên Thiên Nghịch Thiên Cải Mệnh** at once; unlimited rerolls of the whole set; **no locking individual slots**. | No paid or limited reroll mechanic. |
| GD-011 | APPROVED | Once the character is confirmed, its **three Tiên Thiên never change**. | Server persists result atomically. |
| GD-012 | APPROVED | Destiny rarity is **Phàm → Hoàng → Tiên → Thần** (4 tiers). | Different from technique rarity. |
| GD-013 | APPROVED | Many Hậu Thiên mệnh cách may be acquired through achievements/adventures; **exactly 3 active Hậu Thiên slots**. | Collection ownership ≠ activated modifiers. |
| GD-014 | APPROVED | Exactly **10 distinct Legendary-specific Thần Phẩm signature destinies**, each bound uniquely to one of the 10 Legendary NPCs. | At most **one** of these signatures may ever be owned by a character (innate or acquired). |
| GD-015 | APPROVED | Signature alone is insufficient for True Disciple: **matching signature → NPC affinity → special trigger condition → NPC-specific exclusive questline → finish entire questline → True Disciple**. | Signature identity cannot be bypassed by simply gifting items. |
| GD-016 | APPROVED | For **Phì Đế**, the signature is **Vạn Vị Đạo Thai**. His ordinary food/story activities remain available to everyone. | First Legendary route to build deeply. |
| GD-017 | DESIGN_BASELINE | Per-slot initial rarity distribution: **Phàm 50%, Hoàng 30%, Tiên 15%, Thần 5%**; inside Thần, 60% Legendary category / 40% general category. | Enforce one Legendary signature maximum per 3-roll batch, no duplicate IDs; measure adjusted probabilities before shipping. |
| GD-018 | DESIGN_BASELINE | All 3 Tiên Thiên effects act as permanent innate foundations; Hậu Thiên modifiers are applied only from the 3 equipped slots; owning a signature always counts toward True Disciple eligibility even if not activated in a slot. | Confirm model during data-contract design. |

## C. Character progression and Dao

| ID | Status | Binding decision | Notes |
|---|---|---|---|
| GD-020 | APPROVED | **Phàm Nhân Lv 1–10** then **17 major realms × 20 Character Levels each**: Luyện Khí Lv 11–30 → ... → Thánh Cảnh Lv 331–350. At **Lv 351+** Saint realm continues with no level ceiling, increasing EXP cost. | Character EXP and Tu Vi are independent tracks. |
| GD-021 | APPROVED | Each actual Character Level increase awards **1 freely allocated base-attribute point**. | Realm-stage progress/breakthrough scales core stats derived from base attributes. |
| GD-022 | APPROVED | Reaching the realm's Level cap blocks further Level advancement until realm breakthrough; activity may continue. | Overflow EXP handling is UNRESOLVED. |
| GD-023 | APPROVED | Phàm Nhân → Luyện Khí requires a **Main Quest**: player meets a **masked/unknown immortal**, receives a beginner cultivation method and a breakthrough pill, completes the trial and breaks through. | Immortal identity is **not confirmed**; do not automatically label them Phì Đế. |
| GD-024 | APPROVED | Six independent mastery paths: **Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu**. Each has **10 Đạo Cảnh** and may progress independent of major cultivation realm. | Luyện Khí achieving top sword mastery is allowed **in principle**, but exceptionally difficult. |
| GD-025 | APPROVED | Every 3 mastery levels, advancement requires a **path-specific Bí Cảnh trial**: 3→4, 6→7, 9→10. | Trials may be combat or point-and-click. EXP alone cannot bypass. |
| GD-026 | APPROVED | Dao mastery EXP can come from using relevant võ kỹ on eligible targets, training, special pills and adventures. At higher mastery, weak techniques are far less efficient. | Anti-spam and EXP curve are DESIGN_BASELINE. |
| GD-027 | APPROVED | Achievements (kills, breakthrough, high Dao mastery, cooking, etc.) may grant Hậu Thiên destinies or other rewards; reaching Kiếm Đạo 10 yields **Kiếm Tiên** achievement and a specific acquired destiny reward. | Exact catalogs/thresholds to be designed. |
| GD-028 | DESIGN_BASELINE | Six primary base stats: **Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính**. | Derived HP, MP, physical/magical attack/defense, crit, etc. Need simulation. |

## D. Skills, equipment, combat, world

| ID | Status | Binding decision | Notes |
|---|---|---|---|
| GD-030 | APPROVED | **Công pháp**: cultivation-oriented techniques that add passives, base/derived stats and cultivation efficiency, with learning requirements. | Not simply an active combat skill. |
| GD-031 | APPROVED | **Võ kỹ**: activated combat skills, optionally with passive stat effects, with requirements based on stats and relevant Dao mastery. | Spell/skill progression and auto-farm skill patterns are required. |
| GD-032 | APPROVED | BOTH công pháp and võ kỹ use **six tiers**: **Phàm, Linh, Hoàng, Địa, Thiên, Thần**. | Thần techniques chiefly earned from True Disciple or extraordinarily rare world adventures; never ordinary shop drops. |
| GD-033 | APPROVED | Monsters have **fixed map/zone difficulty**, not adaptive to each player. Higher major-realm monsters normally overwhelm lower-realm players. | Exceptional over-realm victories may be possible with powerful build, consumables or team; no simple hard immunity. |
| GD-034 | APPROVED | Character strength derives from the whole build (Tiên Thiên, Hậu Thiên, công pháp, võ kỹ, gear, stats and realm); representative zone threat is tuned around a cohesive **Tiên Phẩm-quality build**. | Relative Phàm/Hoàng/Tiên/Thần difficulty bands are targets for simulator, NOT a universal global tier computed by naive average. |
| GD-035 | APPROVED | Two dungeon forms: **Combat Bí Cảnh** and **Point-and-Click Bí Cảnh**. | Meaningful choices always remain with player; never auto-skip owner decisions. |
| GD-036 | APPROVED | Multiple interconnected future maps/zones, buildings, NPC private residences/động phủ, gates/portals and instances. Start at **Tân Thủ Thôn**, then **Thanh Trúc Lâm**. | Build only first slice in depth. |
| GD-037 | DESIGN_BASELINE | Typed data-driven items, six equipment slots, skill slots, stat modifiers, rewards, NPC relations and generic condition engine; server-authoritative state. | Contracts/formulas must be reviewed in technical design. |

## E. Lore & narrative

| ID | Status | Binding decision | Notes |
|---|---|---|---|
| GD-040 | APPROVED | **Main Quest** follows protagonist from Phàm Nhân to the playable limit **Thánh Cảnh**. A great era begins: **Tiên Lộ opens, countless thiên kiêu emerge, Bát Hoang destabilizes**. | Questline continues for all, irrespective of legendary signature. |
| GD-041 | APPROVED | All 10 Legendary NPCs appear and matter in Main Quest; their **10 distinct six-chapter True Disciple paths are separate optional Side/Special Questlines**. | Secret exclusive routes must not prevent finishing Main Quest. |
| GD-042 | APPROVED | Escalating antagonists: early beasts/threats → large conflicts → **cross-dimensional invasion** at the finale by a major NPC antagonist from a neighboring plane. | Names/details of invading plane and antagonist not yet approved. |
| GD-043 | APPROVED | Near endgame, protagonist learns **Phì Đế is only an incarnation of Ăn Uống Thiên Tôn** residing in this plane. | Main Quest reveals it for everyone; special disciple path offers optional extra context. |
| GD-044 | APPROVED | **Thánh Cảnh is the last playable major realm** in the current game. Beyond it, **Đại Thánh**, **Cổ Thần**, higher planes and planar travel exist as expansive lore only. | Unlimited Saint Character Level does not create new playable realm. |
| GD-045 | APPROVED | Phì Đế's culinary path permits qualifying food either **purchased or cooked**. Affinity grows **chiefly from gifts**, plus special events and player choices. | Number of unique dishes for special trigger is UNRESOLVED pending Food Catalog; "80 dishes" was illustration. |
| GD-046 | PROPOSED | Era title **Thiên Kiêu Kỷ Nguyên**, invading plane **Hư Tịch Giới**, antagonist **Tịch Diệt Thánh Quân — Dạ Vô Uyên**, seven macro story arcs. | Names are writer proposals, not owner-canon. |

## F. Existing canonical identities and production rules

- Preserve all ten canonical NPC IDs and their names/realms from `packages/game-data/src/index.ts`, notably `dam_lon_tien_tu.realmId = "UNKNOWN"` and quadrupedal jade-cyan `chatdvt` as Phì Đế's Saint Beast.
- Tam Đế: Phì Đế, RMT Đế, Vaal Đế (all Saint realm); RMT economy uses **fictional in-game currency only**, Vaal fate/refinement likewise does not create real-money gambling.
- New FINAL art must come from genuine generative AI sources, with provenance and **human visual approval**, per `AGENTS.md`, `docs/ART_BIBLE.md` and `.agents/skills/ai-art-production/SKILL.md`.
- Old `MASTER_PROMPT.md` sections about direct manual-combat-first, only three disciplines, generic True Disciple via reputation and single-equipped-master inheritance are **LEGACY where they contradict GD-002, GD-014, GD-015, GD-024, GD-031, GD-041**. Preserve useful world lore but do not implement superseded gameplay rules.

## Open design details before implementation

1. Exact EXP/tu vi/Dao mastery curves, minor-stage mapping to 20 Character Levels, level-cap overflow and persistence changes.
2. Quantified 6-stat formulas and modifier stack/cap policy; simulation-based monster balance and offline meditation calculations.
3. Auto-combat targeting/recovery/pathfinding/online presence, ability timing and party/loot attribution.
4. True Disciple special thresholds (Food Catalog first), quests, signature destiny effects and acquisition paths.
5. DAO 10-stage name labels (designer proposals), trial mechanics and reward catalogs.
6. Content registries/schema, migrations and automated AI production acceptance criteria.

**Rule for agents**: When an APPROVED decision conflicts with LEGACY implementation, produce a migration impact report and seek scoped implementation approval. Do NOT silently rewrite the owner-approved game design to fit old code.

---

## G. Technical Design Freeze v1.0 Pointer (2026-10-16)

- The 40 technical design and coordination specifications imported under `docs/systems/*` (17 files), `docs/pipelines/*` (5 files), and `docs/technical/*` (18 files, anchored by `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/TD_FREEZE_APPROVALS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, `docs/technical/TD_FREEZE_GATES.md`, and `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`) constitute the owner-accepted **Technical Design Freeze v1.0 (`TD-01` v0.3, `TD-02` v0.4, `TD-03` v0.5, `TD-04` v0.6 + `docs/systems/NPC_SHOPS.md` NPC-only commerce addendum, and `TD-05` v0.7)** on top of commit `d4e6e17b5a9e88d9e717e33ebfe3e218b5c39486`.
- **Scope & Status Governance**:
  - All 35 original component TD files retain their historical `DRAFT` / `REVIEW_REQUIRED` / `OWNER_REVIEW_REQUIRED` headers verbatim to preserve verified SHA-256 content hashes (`FREEZE_MANIFEST.json`); `docs/technical/TD_FREEZE_APPROVALS.md` governs their overall **technical design acceptance (`DESIGN APPROVED / NOT IMPLEMENTED`)**.
  - Acceptance of the TD Freeze **does NOT** promote internal `DESIGN_BASELINE`, `PROPOSED`, or `UNRESOLVED` items (such as sample numeric coefficients/curves, `GD-046` macro-arc/era/villain names, the `UNRESOLVED` Phì Đế Food Catalog dish threshold, NPC affinity caps, shop prices/stock, or `Candidate A` / Phase 0 `TECHNICALLY_VERIFIED` sprites) into final production balance or `HUMAN_APPROVED` visual artwork.
