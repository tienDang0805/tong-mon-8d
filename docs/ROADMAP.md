# Roadmap — Tông Môn 8D, Design-to-Production

> v0.2 + Technical Design Freeze v1.0 | 2026-10-16 | Current foundation: `master@d4e6e17b5a9e88d9e717e33ebfe3e218b5c39486` (Phase 1B.0 commit).

## Status as of Technical Design Freeze v1.0 integration

| Stage | Status | Evidence / caveat |
|---|---|---|
| Phase 0 AI sprites / initial multiplayer technical prototype | `TECHNICALLY_VERIFIED` per legacy reports | Phaser/Colyseus, two Tiled zones, 3 advanced sprites, legacy art; not final visual acceptance |
| Phase 1A workspace recovery/context reconciliation | `COMMITTED` | `7914c2a` / `e0eab60`; added `CONTEXT_AUDIT.md`, `ai-art-production` and governance fixes |
| Phase 1B.0 owner-approved game design documentation | `COMMITTED` | `d4e6e17`; 10 Baseline v0.2 docs (`DECISIONS.md`, `GAME_DESIGN.md`, etc.) |
| **Phase 1B.1–1B.5 Technical Design Freeze v1.0 (`TD-01`–`TD-05` + `NPC_SHOPS.md`)** | **`DESIGN APPROVED / NOT IMPLEMENTED` (THIS FREEZE)** | 40 Markdown files under `docs/systems/`, `docs/pipelines/`, `docs/technical/` (`TD_FREEZE_OVERVIEW.md`, `TD_FREEZE_APPROVALS.md`). Provisional numbers/art are NOT promoted to final balance or `HUMAN_APPROVED` art |
| Playable AFK vertical slice (`S0`–`S8` in `TD_FREEZE_IMPLEMENTATION_PATH.md`) | `NOT STARTED` under new design | Existing v0.1 action prototype is separate legacy baseline; implementation slices require explicit owner authorization after Freeze push |

## Completed Phase 1B.0 & Technical Design Freeze v1.0 Documentation Milestones

1. Safely imported Game Design Baseline v0.2 (`d4e6e17`) and Technical Design Freeze v1.0 (40 files in `docs/systems/`, `docs/pipelines/`, `docs/technical/`) without deleting Phase 1A historical evidence, existing code, art, or raw sources.
2. Reconciled `AGENTS.md`, `docs/CONTEXT_INDEX.md`, `docs/DECISIONS.md`, `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md`, and `docs/ROADMAP.md` to reference `docs/technical/TD_FREEZE_OVERVIEW.md` and `docs/technical/TD_FREEZE_APPROVALS.md`.
3. **No gameplay code, assets, maps, database, or `.env` modified during documentation phases.** Relative `PGDATA_DIR` handling and prototype save backup/archival remain tracked for `Slice S0`/`S1` (`docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`).
4. Verified all 40 imported Markdown paths and SHA-256 hashes against `FREEZE_MANIFEST.json`.
5. Stop after Technical Design Freeze v1.0 documentation integration for human review and Git push before starting any implementation slice.

## Integrated Technical Design Domains (`DESIGN APPROVED / NOT IMPLEMENTED`)

See `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/TD_FREEZE_APPROVALS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, and `docs/technical/TD_FREEZE_GATES.md` for binding scope and open gates:

### TD-01 Character, Destiny, Level, Realm (`v0.3`)
- Specs: `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD01_MIGRATION_TESTS.md`.
- Defines authoritative 6 origin stats (`Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính`), Character Level `1–350+` (`+1` free point per level), independent EXP vs `Tu Vi`, no excessive EXP overflow banking at capped non-Saint realms, 3 immutable `Tiên Thiên` + 3 active `Hậu Thiên` (`Phàm/Hoàng/Tiên/Thần`), and at-most-1-of-10 Legendary signature exclusivity across all innate/acquired sources.

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
- Requires an authored `VisualBindingDef` and genuine generative source → post-processed atlas/tileset → Phaser/Tiled world representation for every player-visible content object (popup-only features fail release gates; `HUMAN_APPROVED` sign-off required at gameplay zoom).

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
