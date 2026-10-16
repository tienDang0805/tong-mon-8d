# TÔNG MÔN 8D: TU TIÊN CHI LỘ — WORKSPACE HANDOFF GUIDE

## 1. Project Purpose

**Tông Môn 8D: Tu Tiên Chi Lộ** is a browser-based 2D pixel-art Xianxia (Tu Tiên) MMORPG built with a Phaser `4.2.1` client and an authoritative Colyseus `0.18.x` + PostgreSQL (`@electric-sql/pglite` / `pg`) server. It implements the canonical universe defined in `MASTER_PROMPT.md` and `packages/game-data/src/index.ts`:
- **17 Cultivation Realms** (`Phàm Nhân` + 17 realms from `Luyện Khí` through `Thánh Cảnh`).
- **10 Legendary Figures** (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`).
- **Phì Đế's Ẩm Thực Đại Đạo** (Culinary Dao progression via both shop purchasing and cauldron cooking).
- **True Disciple (Chân Truyền Đệ Tử) Questlines** and real-time shared multiplayer zones (`Tân Thủ Thôn` & `Thanh Trúc Lâm`).

---

## 2. Existing Architecture & Verified Monorepo Layout

- `packages/shared/` — Shared TypeScript protocol contracts, network payload types, and deterministic constants (`src/index.ts`).
- `packages/game-data/` — Canonical data definitions for realms, legendary NPCs, items, recipes, quests, enemies, zones, and quantitative balance simulations (`src/index.ts`, `src/runSimulation.ts`).
- `packages/art-tools/` — AI sprite post-processing pipeline (`build_assets.py`) and manifest/provenance integrity verifier (`verify_manifest.ts`).
- `apps/server/` — Colyseus `0.18.x` authoritative multiplayer server (`src/index.ts`, `src/zoneRoom.ts`, `src/worldEngine.ts`), PostgreSQL/PGlite persistence (`src/db.ts`), and integration tests (`src/__tests__/server.test.ts`).
- `apps/client/` — Phaser `4.2.1` + TypeScript + Vite browser client (`src/main.ts`, `src/WorldScene.ts`, `src/ui.ts`, `src/network.ts`, `src/audio.ts`, `src/styles.css`).
- `assets/` — All runtime and source artwork tracked in Git:
  - `assets/source_ai/` — Raw `4x4` AI multi-pose locomotion, combat, and VFX sheets + `sliced/` per-frame outputs from `assemble_frames.py`.
  - `assets/concepts/` — Milestone A/B AI concept art, portraits, overworld cast grids, and landmark grids.
  - `assets/sprites/` — Runtime spritesheets (`3` upgraded `80x96` in `480x1920` sheets + `9` preserved legacy `48x64` in `288x1024` sheets) and `assets/sprites/legacy_v1/` backups.
  - `assets/atlases/` — Packed atlas sheets (`*_atlas.png`), metadata (`*_atlas.json`), and per-frame PNG directories (`<id>/frames/`).
  - `assets/previews/` — Animated GIF previews (`*_all_states.gif`, `*_idle.gif`, `*_walk.gif`, `*_attack.gif`, `*_cast.gif`, `*_hurt.gif`) and before/after comparison sheets (`*_before_after.png`).
  - `assets/portraits/` (`10` `160x160` PNGs), `assets/props/` (`8` prop PNGs), `assets/tilesets/bat_hoang_tileset.png` (`512x256`), `assets/vfx/` (`combat_vfx.png`, `portal_ring.png`, `phi_de_blessing.png`).
  - `assets/manifest.json` & `assets/provenance.json`.
- `maps/` — Tiled JSON maps (`maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`).
- `tests/e2e/` — Playwright two-browser multiplayer E2E runner (`tests/e2e/runPlaytest.ts`).
- `docs/` — Project documentation, status reports, context audit (`docs/CONTEXT_AUDIT.md`), and preserved Phase 0 evidence (`docs/evidence/phase-0/`).

---

## 3. Installed Agent Skills (30 Skills in `.agents/skills/`)

All 30 skills and their reviewed helper scripts are tracked in Git under `.agents/skills/`:

1. `ai-art-production` — End-to-end 12-step generative AI art production, post-processing, provenance, and human approval workflow.
2. `cultivation-balance` — Quantitative Tu Vi, realm, food buff, and economy balance rules.
3. `mmorpg-server-integrity` — Colyseus authoritative state, room transitions, combat, and persistence rules.
4. `pixel-art-director` — Xianxia pixel-art direction and canonical silhouette checklist for the 10 legends.
5. `world-and-map-qa` — Tiled map layer, collision, camera, and bidirectional portal QA.
6. `phaser-core` — Phaser scene lifecycle, asset loader, and camera patterns.
7. `phaser-arcade-physics` — Top-down movement and collision resolution patterns.
8. `create-game-assets` — Visual asset planning, style bible, and validation workflow.
9. `rpg` — Stats, inventory, equipment, quest, dialogue, and save/load architecture.
10. `game-feel` — Hit-stop, screen shake, knockback, and combat juice techniques.
11. `level-design` — Top-down RPG blockout, pacing, and encounter layout principles.
12. `game-ui-ux` — Responsive HUD anchors, modal stacks, and event-driven UI updates.
13. `prototype-fast` — Vertical slice scoping and validation rules.
14. `generate2dmedia` — Art-route layer (`route_media.py`, `forge_doctor.py`, spend ledger).
15. `generate2dsprite` — Multi-pose sprite slicing, registration, and packaging (`assemble_frames.py`, `ownership_pipeline.py`).
16. `video2dsprite` — Video-to-sprite pipeline (`video2dsprite.py`, `register_clip.py`).
17. `generate2dmap` — 2D map planning and Tiled collision/reachability checks (`map_pipeline.py`).
18. `codeart2d` — Explicit-only fallback code-drawn art tools *(prohibited for final production artwork without explicit project-owner authorization)*.
19. `pixel-art` — Pixel-art audit, palette analysis, sheet packing, and GIF export (`quality_audit.py`, `atlas_pack.py`, `gif_export.py`, `sprite_resize.py`).
20. `sprite-pipeline` — Sprite strip normalization and anchor locking.
21. `game-playtest` — Browser playtest and screenshot QA workflow.
22. `game-ui-frontend` — Browser RPG HUD layout and playfield protection.
23. `phaser4-animations` — Phaser 4 `AnimationManager` and spritesheet config.
24. `phaser4-game-setup-and-config` — Phaser 4 `GameConfig` and `pixelArt` rendering setup.
25. `phaser4-loading-assets` — Phaser 4 `LoaderPlugin` asset loading.
26. `phaser4-physics-arcade` — Phaser 4 Arcade Physics reference.
27. `phaser4-scenes` — Phaser 4 Scene lifecycle reference.
28. `phaser4-sprites-and-images` — Phaser 4 Sprite/Image transform and depth reference.
29. `phaser4-tilemaps` — Phaser 4 Tilemap and `TilemapGPULayer` reference.
30. `phaser4-v3-to-v4-migration` — Phaser 3 to Phaser 4 breaking changes guide.

---

## 4. Approved Architectural, Canon & Art Policy Decisions

- **Context Hierarchy (`AGENTS.md`):** Rules & safety boundaries (`AGENTS.md`, `RULES.md`) → Current phase & verified status (`docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`) → Human-approved creative decisions → Canonical lore (`packages/game-data/`) → Phase 1 design specs → Agent Skills → Archived bootstrap docs (`MASTER_PROMPT.md`, `START_HERE.md`, `docs/IMPLEMENTATION_STATUS.md`).
- **Strict Code Formatting Rule (`RULES.md` & `AGENTS.md`):** Zero comments (`//`, `/* */`, `#`, `<!-- -->`) in any code file or markdown code block.
- **Canonical Lore Integrity:**
  - All 17 realms preserved in exact order (`Phàm Nhân` + 17 realms).
  - All 10 legendary figures preserved with canonical titles and identities.
  - `dam_lon_tien_tu` realm MUST remain `"UNKNOWN"` (`Bất Minh`).
  - `chatdvt` MUST remain a jade-cyan quadruped spirit beast (`Linh Thú Thanh Ngọc`).
  - Phì Đế's **Ẩm Thực Đại Đạo** supports both buying and self-cooking spiritual dishes.
- **AI Art Production & Creative Approval Policy:**
  - All new final visual artwork must originate from genuine generative image model output or approved AI-generated source artwork (never procedural/geometric drawing or unauthorized `codeart2d`).
  - Creative states (`PROPOSED`, `TECHNICALLY_VERIFIED`, `HUMAN_APPROVED`, `REJECTED`, `PLACEHOLDER`) are strictly separated; automated `verify:assets` pass never equals `HUMAN_APPROVED`.
  - `npm run build` runs `verify:assets` + TypeScript/Vite compilation and NEVER overwrites artwork.

---

## 5. Next Immediate Step (Phase 1)

1. **Author & Review Phase 1 Design Specifications (`docs/NEXT_ACTIONS.md` & `docs/CONTEXT_AUDIT.md`):**
   - Complete `docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/ART_BIBLE.md`, `docs/UX_DESIGN.md`, and formal asset provenance/creative approval rules.
2. **Wait for Human Creative Sign-Off Before Phase 2 Asset Generation:**
   - Do not generate or replace sprites, tilesets, UI, or maps until Phase 1 specifications and visual direction receive `HUMAN_APPROVED` sign-off from the project owner.
