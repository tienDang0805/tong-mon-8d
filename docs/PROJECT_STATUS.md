# TÔNG MÔN 8D: TU TIÊN CHI LỘ — PROJECT STATUS (PHASE 0 FINALIZED)

## 1. Current Verified Checkpoint

- **Phase 0 AI Sprite Production Pipeline Checkpoint Commit:** `934f728`
- **Branch:** `master`
- **Manifest Version:** `2.0.0` (`assets/manifest.json`)
- **Provenance Version:** `2.0.0` (`assets/provenance.json`)
- **Style Direction:** Candidate A — Classic Crisp 16/32-bit Xianxia Top-Down RPG (AI Multi-Pose Pipeline)
- **Logical Tile Grid:** `32x32` px
- **Upgraded Character Frame Size:** `80x96` px (`480x672` sheet, 7 rows × 6 columns, foot anchor `(0.5, 0.896)`)
- **Legacy v1 Character/Monster Frame Size:** `48x64` px (`288x448` sheet, 7 rows × 6 columns, foot anchor `(0.5, 0.875)`)

---

## 2. Implemented Gameplay & Engine Systems

1. **Shared Protocol & Canonical Game Data (`packages/shared`, `packages/game-data`)**:
   - Canonical 17 cultivation realms (`Phàm Nhân` + 17 realms from `Luyện Khí` through `Thánh Cảnh`) with exact `tuViRequired`, HP, Spirit, attack, defense, and speed curves.
   - Canonical 10 legendary figures (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`) plus village culinary merchant `merchant_truong`.
   - `dam_lon_tien_tu` realm strictly preserved as `"UNKNOWN"` (`Bất Minh`).
   - `chatdvt` strictly depicted and animated as a jade-cyan quadruped spirit beast (`Linh Thú Thanh Ngọc`).
   - Phì Đế's **Ẩm Thực Đại Đạo** supporting both shop purchase and self-cooking (`Cauldron / Thần Đỉnh`) of spiritual dishes (`Phở Linh Khí`, `Thịt Linh Thú Nướng`, `Tửu Linh Bảo`, `Đại Tiệc Phì Đế`).
   - Quantitative progression simulator (`packages/game-data/src/simulator.ts`) verifying realms, culinary buffs, and offline cultivation caps.
2. **Authoritative Multiplayer Server (`apps/server`)**:
   - Node.js + Colyseus `0.18.x` authoritative `WorldRoom` (`apps/server/src/rooms/WorldRoom.ts`) with server-side movement validation, tile collision checking, zone portal transitions (`tan_thu_thon` ↔ `thanh_truc_lam`), shared mob AI & respawns (`truc_lang`, `thanh_lan_xa`), real-time melee/skill combat, loot drops, quests, 2–4 player party Tu Vi bonus, and offline cultivation claim (`<= 8h` cap).
   - Persistent PostgreSQL storage (`apps/server/src/db/repository.ts`) using embedded `@electric-sql/pglite` by default or external `pg` via `DATABASE_URL`.
3. **Phaser 4 Browser Client (`apps/client`)**:
   - Phaser `4.2.1` + TypeScript + Vite client (`apps/client/src/WorldScene.ts`, `HudController.ts`, `AudioSynth.ts`).
   - Genuine Tiled `.tmj` multi-layer rendering (`Ground`, `Paths`, `GroundDetails`, `Collision`, `Interactables`, `AbovePlayer`, `Portals`) with Y-sorted depth occlusion.
   - Dynamic multi-resolution sprite registration supporting `80x96` upgraded characters alongside `48x64` legacy characters and decoupled `64x64` combat VFX (`assets/vfx/combat_vfx.png`).

---

## 3. Actual Phase 0 Results (AI Sprite Production Pipeline Upgrade)

### 3.1 Installed & Validated Skills (29 Total in `.agents/skills/`)
- **Project-Specific Skills (4):** `cultivation-balance`, `mmorpg-server-integrity`, `pixel-art-director`, `world-and-map-qa`.
- **Phaser 4 & Pipeline Skills (9):** `phaser4-animations`, `phaser4-game-setup-and-config`, `phaser4-loading-assets`, `phaser4-physics-arcade`, `phaser4-scenes`, `phaser4-sprites-and-images`, `phaser4-tilemaps`, `phaser4-v3-to-v4-migration`, `sprite-pipeline`, `game-playtest`, `game-ui-frontend`.
- **GameDev Skills Collection (8):** `phaser-core`, `phaser-arcade-physics`, `create-game-assets`, `rpg`, `game-feel`, `level-design`, `game-ui-ux`, `prototype-fast`.
- **Agent Sprite Forge Collection (5):** `generate2dmedia`, `generate2dsprite`, `video2dsprite`, `generate2dmap`, `codeart2d`.
- **Pixel Art Professional Skill (1):** `pixel-art`.

### 3.2 Upgraded Proof-of-Concept Characters (3 Characters + 1 Combat VFX Sheet)
Generated via Antigravity native `image-generator` subagent (`4x4` locomotion + `4x4` combat/action source grids stored in `assets/source_ai/`), sliced via Agent Sprite Forge `ownership_pipeline.py`, normalized into `80x96` frames (`480x672` sheet), exported with Aseprite JSON + Phaser 4 multi-atlas metadata (`assets/atlases/*.phaser.json`), and audited via `pixel-art/scripts/quality_audit.py`:

| Character / Asset | Runtime Sheet | Dimensions | Source AI Grids (`assets/source_ai/`) | Quality Audit Score |
| :--- | :--- | :--- | :--- | :--- |
| **Phì Đế** (`phi_de`) | `assets/sprites/phi_de.png` | `480x672` (`80x96` frame) | `phi_de_locomotion_4x4.png`, `phi_de_combat_4x4.png` | `85/100` (`PASS`) |
| **Dẩm Lồn Tiên Tử** (`dam_lon_tien_tu`) | `assets/sprites/dam_lon_tien_tu.png` | `480x672` (`80x96` frame) | `dam_lon_tien_tu_locomotion_4x4.png`, `dam_lon_tien_tu_combat_4x4.png` | `85/100` (`PASS`) |
| **Hero Kiếm Tu** (`hero_kiem_tu`) | `assets/sprites/hero_kiem_tu.png` | `480x672` (`80x96` frame) | `hero_kiem_tu_locomotion_4x4.png`, `hero_kiem_tu_combat_4x4.png` | `85/100` (`PASS`) |
| **Combat VFX** (`vfx_combat_sheet`) | `assets/vfx/combat_vfx.png` | `256x256` (`64x64` frame) | `vfx_combat_4x4.png` | `85/100` (`PASS`) |

All three upgraded characters have preserved v1 backups in `assets/sprites/legacy_v1/` and before/after visual comparisons in `assets/previews/` and `docs/evidence/phase-0/`.

---

## 4. Remaining Legacy Assets (`48x64` Single-Image Derived)

The following 10 overworld sprites remain on the Milestone B `48x64` pipeline (`POST-PROCESSED ART (from AI-GENERATED SOURCE ART)` extracted from `assets/concepts/xianxia_overworld_cast_*.jpg` with 2D affine sub-part animation) and are scheduled for multi-pose AI upgrades in subsequent phases:
- **Legendary NPCs (7):** `rmt_de`, `vaal_de`, `hoa_tran`, `anh_7`, `ngoc_tam`, `thai_tai`, `gia_bao`
- **Village Merchant (1):** `merchant_truong`
- **Spirit Beast & Monsters (2+1):** `chatdvt` (spirit beast), `truc_lang`, `thanh_lan_xa`

---

## 5. Known Technical & Visual Quality Issues

1. **Image-to-Video Route (`video2dsprite`) Unavailable Without External Credentials:**
   - `forge_doctor.py` (`docs/evidence/phase-0/forge_doctor_verified.json`) confirmed `status: "no-route"` (exit code `3`) because no external paid API keys (`XAI_API_KEY`, `FAL_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ARK_API_KEY`) or local `codex`/`grok` CLIs are configured.
2. **Static Multi-Pose Grid Variance:**
   - Because `image-generator` produces static `4x4` sheets rather than temporal video clips, subtle per-cell proportion and garment-detail variations occur between frames even after bottom-center foot-anchor locking `(40, 86)` and bounding-box normalization.
3. **Palette Compaction Trade-Off:**
   - Quantizing complex AI Xianxia robes into 32–48 indexed colors triggers a non-blocking `palette_size` warning (`85/100 PASS`) in `quality_audit.py`. Reducing below 16 colors degrades facial and ornament readability at `80x96`.
4. **Mixed Scale Coexistence During Transition:**
   - The 3 upgraded `80x96` characters coexist on screen with the 10 legacy `48x64` sprites until the remaining cast is upgraded.

---

## 6. Next Planned Phase (Phase 1)

**Phase 1 — Unified Game Design, Lore, Narrative Design, Art Bible & AI Asset Policy**:
- Formalize the unified Game Vision, canonical Lore & True Disciple narrative structure, Master Art Bible, and AI Asset Production Policy before scaling asset upgrades to the remaining NPCs, monsters, tilesets, and UI.
