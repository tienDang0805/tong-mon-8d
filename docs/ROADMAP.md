# Roadmap — Tông Môn 8D, Design-to-Production

> v0.2 + Technical Design Freeze v1.0 + Slice `S0` + Gate `G0` + Slice `S1-B1a` (`CTX-1` synced) | 2026-10-17 | Current foundation: `master@b04ebdc72ffede9edb678008ed30d002c73b5cc6` (`S1-B1a` commit; `G0` `39d71c0`; `S0` `6e38c24`; Freeze baseline `39c41a6`).

## Status as of Technical Design Freeze v1.0, `S0`, `G0` & `S1-B1a`

| Stage | Status | Evidence / caveat |
|---|---|---|
| Phase 0 AI sprites / initial multiplayer technical prototype | `TECHNICALLY_VERIFIED` per legacy reports | Phaser/Colyseus, two Tiled zones, 3 advanced sprites, legacy art; not final visual acceptance |
| Phase 1A workspace recovery/context reconciliation | `COMMITTED` | `7914c2a` / `e0eab60`; added `docs/CONTEXT_AUDIT.md`, `.agents/skills/ai-art-production/SKILL.md` and governance fixes |
| Phase 1B.0 owner-approved game design documentation | `COMMITTED` | `d4e6e17`; 10 Baseline v0.2 docs (`docs/DECISIONS.md`, `docs/GAME_DESIGN.md`, etc.) |
| **Phase 1B.1–1B.5 Technical Design Freeze v1.0 (`TD-01`–`TD-05` + `docs/systems/NPC_SHOPS.md`)** | **`COMMITTED` (`39c41a6`, `DESIGN APPROVED / NOT IMPLEMENTED`)** | 40 Markdown files under `docs/systems/`, `docs/pipelines/`, `docs/technical/` (`docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/TD_FREEZE_APPROVALS.md`). Provisional numbers/art are NOT promoted to final balance or `HUMAN_APPROVED` art |
| **Slice `S0` (Foundation, PGlite Backup & Environment Safety)** | **`COMMITTED` (`6e38c24`)** | Offline PGlite backup + throwaway restore verified; deterministic `resolvePgDataDir` split-brain protection; safe `.env` loading; isolated two-browser `test:e2e` verified in `artifacts/playtest/runs/<run-id>/` |
| **Gate `G0` (Agent Workflow Governance & Skill Optimization)** | **`COMMITTED` (`39d71c0`)** | Added `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, and `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md` (`NATIVE_IMAGE_TOOL_DISCOVERED — END_TO_END_NOT_YET_VERIFIED`); reconciled 6 governance/index docs |
| **Slice `S1` (`Character schema v0.2 and migration`)** | **`IN PROGRESS, NOT COMPLETE`** | `S1-A` (`READ-ONLY PLAN / DESIGN EVIDENCE REVIEWED`); `S1-B1a` (`COMMITTED` at `b04ebdc` — pure `TD-01` contracts & `DestinyDefinitionMetadata` validators only, **not** runtime `Character v0.2` gameplay); `CTX-1` (`VERIFIED_READY_FOR_COMMIT`); `S1-B1b` (`PROPOSED NEXT PURE NUMERIC TASK, NOT IMPLEMENTED`), `S1-B2` (`TRANSACTION INFRASTRUCTURE, NOT IMPLEMENTED`), `S1-C` (`SCHEMA / BACKUP / MIGRATION, NOT IMPLEMENTED`), `S1-D` (`AUTHORITATIVE SERVER ACTIONS, NOT IMPLEMENTED`), `S1-E` (`CLIENT/HUD, NOT IMPLEMENTED`), `S1-F` (`E2E ACCEPTANCE, NOT IMPLEMENTED`) |
| Remaining vertical slice (`S2`–`S8` in `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md` & `docs/MASTER_PROJECT_PLAN.md`) | `NOT STARTED` | Each slice/sub-task requires explicit owner authorization under the 9-stage `DOC SYNC` lifecycle (`docs/technical/AGENT_EXECUTION_CONTRACT.md`) |

## Phase 1B.0, Technical Design Freeze v1.0, `S0`, `G0` & `S1-B1a` Milestones

1. Safely imported Game Design Baseline v0.2 (`d4e6e17`) and Technical Design Freeze v1.0 (`39c41a6`, 40 files in `docs/systems/`, `docs/pipelines/`, `docs/technical/`) without deleting Phase 1A historical evidence, existing code, art, or raw sources.
2. Reconciled `AGENTS.md`, `docs/CONTEXT_INDEX.md`, `docs/DECISIONS.md`, `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md`, and `docs/ROADMAP.md` to reference `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/TD_FREEZE_APPROVALS.md`, and the authoritative `S0`–`S8` sequence in `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`.
3. Executed and committed **Slice `S0`** (`6e38c24`): verified offline PGlite backup + throwaway restore, implemented deterministic `resolvePgDataDir` (preserving existing `apps/server/apps/server/data/pgdata` in place, using canonical `apps/server/data/pgdata` on fresh setups, and failing closed on split-brain), added safe `.env` loading in `apps/server/src/index.ts`, and isolated `npm run test:e2e` (`memory://` storage + gitignored `artifacts/playtest/runs/<run-id>/` per-run output).
4. Executed and committed **Gate `G0`** (`39d71c0`): audited all 30 installed skills in `.agents/skills/*/SKILL.md`, authored `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, and `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, and verified all 40 frozen Technical Design Markdown files against commit `39c41a6ddb77b93284c56da7ec053f4309ee4943` (note: the external archive's `FREEZE_MANIFEST.json` is not tracked in the repository).
5. Completed **`S1-A`** (`READ-ONLY PLAN / DESIGN EVIDENCE REVIEWED`) and committed **`S1-B1a`** (`b04ebdc`, pure `TD-01` structural contracts and `DestinyDefinitionMetadata` validators in `packages/shared/src/index.ts`, `packages/game-data/src/index.ts`, and `apps/server/src/__tests__/td01Contracts.test.ts`), followed by **`CTX-1`** (`docs/MASTER_PROJECT_PLAN.md`, `docs/implementation/FEATURE_LEDGER.md`, and the 9-stage `DOC SYNC` contract). Stop for human owner review and commit/push approval before starting `S1-B1b` or `S1-B2`.

## Integrated Technical Design Domains (`DESIGN APPROVED / NOT IMPLEMENTED`)

See `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/TD_FREEZE_APPROVALS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, and `docs/technical/TD_FREEZE_GATES.md` for binding scope and open gates:

### TD-01 Character, Destiny, Level, Realm (`v0.3`)
- Specs: `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD01_MIGRATION_TESTS.md`.
- Defines authoritative 6 origin stats (`Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính`), Character Level `1–350+` (`+1` free point per level across `Phàm Nhân` starter state + 17 major cultivation realms `Luyện Khí` through `Thánh Cảnh` = 18 ordered entries), independent EXP vs `Tu Vi`, no excessive EXP overflow banking at capped non-Saint realms, 3 immutable `Tiên Thiên` + 3 active `Hậu Thiên` (`Phàm/Hoàng/Tiên/Thần`), and at-most-1-of-10 Legendary signature exclusivity across all innate/acquired sources.

### TD-02 Techniques, Dao Mastery & Combat (`v0.4`)
- Specs: `docs/systems/DAO_MASTERY.md`, `docs/systems/TECHNIQUES.md`, `docs/systems/COMBAT.md`, `docs/technical/TD02_SIMULATION.md`, `docs/technical/TD02_MIGRATION_TESTS.md`.
- Defines 6 martial Dao paths (`Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu`) × 10 stages, mandatory path-specific `Bí Cảnh` trials at 3→4, 6→7, and 9→10, `Công pháp` and `Võ kỹ` across 6 tiers (`Phàm, Linh, Hoàng, Địa, Thiên, Thần`), and sole server-authoritative combat/damage/Dao credit math.

### TD-03 Online Auto Farm, Navigation & Quest (`v0.5`)
- Specs: `docs/systems/AUTO_FARM.md`, `docs/systems/NAVIGATION.md`, `docs/systems/QUEST_ENGINE.md`, `docs/technical/TD03_CONSISTENCY_MATRIX.md`, `docs/technical/TD03_PROTOCOL_MIGRATION_TESTS.md`, `docs/technical/TD03_REFERENCE_SIMULATION.md`.
- Defines connected-only Auto Farm (disconnect/transport loss halts legal combat), single-controller session ownership, safe path navigation stopping at objective coordinates, manual-only quest accept/dialogue/turn-in/choices, and separate 8h-capped offline `Bế Quan` meditation.

### TD-04 World, Item, Affinity, Food Catalog & NPC Shops (`v0.6` + Approved Addendum)
- Specs: `docs/systems/WORLD_CONTENT.md`, `docs/systems/ITEMS_ECONOMY.md`, `docs/systems/FOOD_CATALOG.md`, `docs/systems/NPC_AFFINITY.md`, `docs/systems/QUEST_CONTENT.md`, `docs/systems/CONTENT_REGISTRY.md`, **`docs/systems/NPC_SHOPS.md`**, `docs/technical/TD04_CONSISTENCY_FREEZE.md`, `docs/technical/TD04_MIGRATION_TESTS.md`, `docs/technical/TD04_REFERENCE_CHECKS.md`.
- Defines typed content registries, single-delivery reward grants (never both direct and ground loot for the same reward), public Main Quest vs signature-gated 6-chapter True Disciple routes, and **NPC-only commerce** via physical in-world **Tụ Bảo Các** + specialist vendors sharing one `ShopService` (manual `BUY`/`SELL` only; **NO P2P marketplace**).

### TD-05 Visual Content Contract, Scene Assembly & AI Asset Pipeline (`v0.7`)
- Specs: `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/pipelines/UX_WORLD_FIRST.md`, `docs/pipelines/CONTENT_ART_BRIEF_TEMPLATE.md`, `docs/technical/TD05_CROSS_TD_CONSISTENCY.md`, `docs/technical/TD05_MIGRATION_TESTS.md`, `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md`.
- Requires an authored `VisualBindingDef` and genuine generative source → audited non-generative post-processed atlas/tileset → Phaser/Tiled world representation for every player-visible content object (popup-only features fail release gates; `Candidate A` is currently a `PROPOSED` visual reference and an art production proof requires owner `HUMAN_APPROVED` sign-off at gameplay zoom before scaling production; never execute legacy `python packages/art-tools/build_assets.py` as a whole command).

## First playable production vertical slice (`S0`–`S8` in `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`, only after owner authorization)

Create character/roll → start Mortal Lv 1 → user manually follows Main Quest and uses auto-navigation → online AFK farm valid monsters and gain EXP/Dao progress/loot → Lv 10 → masked immortal gives technique + breakthrough pill → player manually breaks to Luyện Khí → physical Tụ Bảo Các / Lão Trù Trương manual NPC BUY/SELL & public Phì Đế food/affinity event → one optional signature-specific clue, not automatic discipleship. Multiplayer clients sync HP and monsters, persistence survives reconnect, offline farm gives no rewards, offline meditation retains designed cap.

## Expansion after a high-quality slice

More authored regions and domains, combat/point-click Bí Cảnh, all ten Legendary six-chapter side routes, advanced technique/item catalogs, group boss and the dimensional-war Main Quest. Production map/character art scales from accepted pipeline, not procedural placeholder generation.

## Release gates

- DESIGN gate: owner approves system spec (`TD_FREEZE_APPROVALS.md`); `DECISIONS.md` preserved, no proposed names or provisional numbers silently promoted.
- TECHNICAL gate: deterministic test pass + actual launched multiplayer playtest.
- CREATIVE gate: game-zoom screenshot, animation and asset provenance accepted by owner (`HUMAN_APPROVED`).
- CONTENT gate: narrative makes sense; no Legendary inheritance gating Main Quest.

**Phase boundary**: Both Game Design Baseline v0.2 and Technical Design Freeze v1.0 are **documentation only (`DESIGN APPROVED / NOT IMPLEMENTED`)**. They must never be described as a completed gameplay implementation.
