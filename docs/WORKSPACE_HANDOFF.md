# TÔNG MÔN 8D: TU TIÊN CHI LỘ — WORKSPACE HANDOFF GUIDE

## 1. Project Purpose

**Tông Môn 8D: Tu Tiên Chi Lộ** is a browser-based 2D pixel-art Xianxia (Tu Tiên) MMORPG built with a Phaser `4.2.1` client and an authoritative Colyseus `0.18.x` + PostgreSQL server. It implements the canonical universe defined in `MASTER_PROMPT.md`:
- **17 Cultivation Realms** (`Phàm Nhân` + 17 realms from `Luyện Khí` through `Thánh Cảnh`).
- **10 Legendary Figures** (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`).
- **Phì Đế's Ẩm Thực Đại Đạo** (Culinary Dao progression via both shop purchasing and cauldron cooking).
- **True Disciple (Chân Truyền Đệ Tử) Questlines** and real-time shared multiplayer zones (`Tân Thủ Thôn` & `Thanh Trúc Lâm`).

---

## 2. Existing Architecture & Monorepo Layout

- `packages/shared/` — Shared TypeScript protocol contracts, network payload types, and deterministic constants (`src/index.ts`).
- `packages/game-data/` — Canonical data definitions for realms, legendary NPCs, items, recipes, quests, enemies, zones, and quantitative balance simulations (`src/index.ts`, `src/simulator.ts`, `src/game-data.test.ts`).
- `packages/art-tools/` — AI sprite post-processing pipeline (`build_assets.py`) and manifest/provenance integrity verifier (`verify_manifest.ts`).
- `apps/server/` — Colyseus `0.18.x` authoritative multiplayer server (`src/index.ts`, `src/rooms/WorldRoom.ts`) and PostgreSQL/PGlite persistence (`src/db/repository.ts`).
- `apps/client/` — Phaser `4.2.1` + TypeScript + Vite browser client (`src/main.ts`, `src/WorldScene.ts`, `src/HudController.ts`, `src/AudioSynth.ts`).
- `assets/` — All runtime and source artwork tracked in Git:
  - `assets/source_ai/` — Raw `4x4` AI multi-pose locomotion, combat, and VFX sheets + `sliced/` per-frame outputs from `ownership_pipeline.py`.
  - `assets/concepts/` — Milestone A/B AI concept art, portraits, overworld cast grids, and landmark grids.
  - `assets/sprites/` — Runtime spritesheets (`80x96` upgraded + `48x64` legacy) and `assets/sprites/legacy_v1/` backups.
  - `assets/atlases/` — Aseprite JSON (`.aseprite.json`) and Phaser 4 multi-atlas JSON (`.phaser.json`) for upgraded sprites.
  - `assets/previews/` — Animated GIF previews (`*_idle_walk_preview.gif`, `*_combat_preview.gif`) and before/after comparison sheets.
  - `assets/portraits/`, `assets/props/`, `assets/tilesets/`, `assets/vfx/`.
  - `assets/manifest.json` & `assets/provenance.json`.
- `maps/` — Tiled JSON maps (`maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`).
- `tests/e2e/` — Playwright two-browser multiplayer E2E suite (`multiplayer.spec.ts`).
- `docs/evidence/phase-0/` — Preserved Phase 0 contact sheets, before/after sheets, and `forge_doctor_verified.json`.

---

## 3. Installed Agent Skills (29 Skills in `.agents/skills/`)

All 29 skills and their non-generated Python/shell scripts are tracked in Git under `.agents/skills/`:

1. `cultivation-balance` — Quantitative Tu Vi, realm, food buff, and economy balance rules.
2. `mmorpg-server-integrity` — Colyseus authoritative state, room transitions, combat, and persistence rules.
3. `pixel-art-director` — Xianxia pixel-art direction and canonical silhouette checklist for the 10 legends.
4. `world-and-map-qa` — Tiled map layer, collision, camera, and bidirectional portal QA.
5. `phaser-core` — Phaser scene lifecycle, asset loader, and camera patterns.
6. `phaser-arcade-physics` — Top-down movement and collision resolution patterns.
7. `create-game-assets` — Visual asset planning, style bible, and validation workflow.
8. `rpg` — Stats, inventory, equipment, quest, dialogue, and save/load architecture.
9. `game-feel` — Hit-stop, screen shake, knockback, and combat juice techniques.
10. `level-design` — Top-down RPG blockout, pacing, and encounter layout principles.
11. `game-ui-ux` — Responsive HUD anchors, modal stacks, and event-driven UI updates.
12. `prototype-fast` — Vertical slice scoping and validation rules.
13. `generate2dmedia` — Art-route layer (`route_media.py`, `forge_doctor.py`, spend ledger).
14. `generate2dsprite` — Multi-pose sprite slicing, registration, and packaging (`ownership_pipeline.py`, `package_sprites.py`).
15. `video2dsprite` — Video-to-sprite pipeline (`process_clip.py`, `pack_mp4.py`).
16. `generate2dmap` — 2D map planning and Tiled collision/reachability checks (`map_pipeline.py`).
17. `codeart2d` — Explicit-only fallback code-drawn art tools.
18. `pixel-art` — Pixel-art audit, palette analysis, sheet packing, and GIF export (`quality_audit.py`, `analyze_palette.py`, `pack_spritesheet.py`, `export_gif.py`, `resize_sprites.py`).
19. `sprite-pipeline` — Sprite strip normalization and anchor locking.
20. `game-playtest` — Browser playtest and screenshot QA workflow.
21. `game-ui-frontend` — Browser RPG HUD layout and playfield protection.
22. `phaser4-animations` — Phaser 4 `AnimationManager` and spritesheet config.
23. `phaser4-game-setup-and-config` — Phaser 4 `GameConfig` and pixelArt rendering setup.
24. `phaser4-loading-assets` — Phaser 4 `LoaderPlugin` asset loading.
25. `phaser4-physics-arcade` — Phaser 4 Arcade Physics reference.
26. `phaser4-scenes` — Phaser 4 Scene lifecycle reference.
27. `phaser4-sprites-and-images` — Phaser 4 Sprite/Image transform and depth reference.
28. `phaser4-tilemaps` — Phaser 4 Tilemap and `TilemapGPULayer` reference.
29. `phaser4-v3-to-v4-migration` — Phaser 3 to Phaser 4 breaking changes guide.

---

## 4. Approved Architectural & Canon Decisions

- **Strict Code Formatting Rule (`RULES.md` & `AGENTS.md`):** Zero comments (`//`, `/* */`, `#`, `<!-- -->`) in any code file or markdown code block.
- **Canonical Lore Integrity:**
  - All 17 realms preserved in exact order.
  - All 10 legendary figures preserved with canonical titles and identities.
  - `dam_lon_tien_tu` realm MUST remain `"UNKNOWN"` (`Bất Minh`).
  - `chatdvt` MUST remain a jade-cyan quadruped spirit beast (`Linh Thú Thanh Ngọc`).
  - Phì Đế's **Ẩm Thực Đại Đạo** supports both buying and self-cooking spiritual dishes.
- **Protected Artwork Pipeline:**
  - `npm run build` runs `verify:assets` + TypeScript/Vite compilation and NEVER overwrites artwork.
  - `npm run generate:art` skips overwriting any existing sprites, portraits, props, tilesets, VFX, or maps (`FORCE_REBUILD = False`).
  - Only `npm run generate:art:force` (`python3 packages/art-tools/build_assets.py --force`) rebuilds runtime sheets from the preserved `assets/source_ai/` and `assets/concepts/` sources.

---

## 5. Pending Creative & Technical Decisions for Phase 1

1. **Remaining 10 Overworld Sprites Upgrade Plan:**
   - Schedule `80x96` multi-pose AI sheet generation (`locomotion_4x4` + `combat_4x4`) for `rmt_de`, `vaal_de`, `hoa_tran`, `anh_7`, `ngoc_tam`, `thai_tai`, `gia_bao`, `merchant_truong`, `chatdvt`, `truc_lang`, and `thanh_lan_xa`.
2. **External Image-to-Video Provider Decision (Optional):**
   - Decide whether to authorize an external video/image API key (`XAI_API_KEY`, `FAL_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`) in `.env` on the new machine to enable `video2dsprite` temporal clip generation, or continue using Antigravity's native `image-generator` subagent with `4x4` multi-pose grids.
3. **Phase 1 Design Documentation:**
   - Formalize the unified Game Vision, Lore & True Disciple Quest Narrative Design, Master Art Bible, and AI Asset Production Policy before starting Phase 2 content expansion.
