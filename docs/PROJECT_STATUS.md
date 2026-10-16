# TÔNG MÔN 8D: TU TIÊN CHI LỘ — PROJECT STATUS (PHASE 1A, 1B.0, TD FREEZE v1.0 & SLICE S0 RECONCILED)

## 1. Current Verified Checkpoint

- **Phase 0 Art Pipeline Commit:** `934f728` (`feat(art-pipeline): upgrade AI multi-pose sprite pipeline for 3 PoC characters and combat VFX`)
- **Phase 0 Migration Handoff Commit:** `21ae81e` (`chore(migration): finalize Phase 0 workspace migration, asset pipeline protection, and handoff docs`)
- **Phase 1A Context Audit Commit:** `e0eab60` (author-amended `7914c2a`, `update Phase 1 audit`)
- **Phase 1B.0 Baseline v0.2 Commit:** `d4e6e17` (`d4e6e17b5a9e88d9e717e33ebfe3e218b5c39486`, `docs(phase-1b.0): integrate Game Design Baseline v0.2 and reconcile canonical design consistency`)
- **Technical Design Freeze v1.0 Commit (Current Base HEAD):** `39c41a6` (`39c41a6ddb77b93284c56da7ec053f4309ee4943`, `docs: integrate Technical Design Freeze v1.0`)
- **Branch:** `master` (`origin/master` → `https://github.com/tienDang0805/tong-mon-8d`)
- **Current Active Phase:** **Slice `S0` (`S0 BUILD/VERIFY PASS — OWNER REVIEW PENDING`: Offline PGlite Backup + Throwaway Restore Verified, Deterministic `resolvePgDataDir` Split-Brain Protection, Safe `.env` Loading, Isolated Two-Browser `test:e2e` in `artifacts/playtest/runs/<run-id>/`) → Awaiting Human Owner Review before Slice `S1` (`TD-01` in `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`)**
- **Manifest Version:** `2.0.0` (`assets/manifest.json`, 35 verified assets + 2 Tiled maps)
- **Provenance Version:** `2.0.0` (`assets/provenance.json`, portable relative paths verified)
- **Reference Style Direction:** Candidate A — Classic Crisp 16/32-bit Xianxia Top-Down RPG (`PROPOSED` / `TECHNICALLY_VERIFIED`, pending `HUMAN_APPROVED` owner sign-off)
- **Logical Tile Grid:** `32x32` px (`maps/tan_thu_thon.tmj` `40x30`, `maps/thanh_truc_lam.tmj` `44x32`)
- **Upgraded Phase 0 Character Frame Size:** `80x96` px (`480x1920` sheet, 20 rows × 6 columns, foot anchor `(0.5, 0.9167)` / `(40, 88)`, rendered at `scale = 0.82`)
- **Preserved Legacy v1 Character/Monster Frame Size:** `48x64` px (`288x1024` sheet, 16 rows × 6 columns, foot anchor `(0.5, 0.90)` / `(24, 58)`, rendered at `scale = 1.0`)

---

## 2. Implemented Gameplay & Engine Systems (Verified on Disk — Legacy v0.1 Technical Prototype)

> **Design Intent vs. Implementation Status Notice:** The runtime code in `apps/` and `packages/` currently implements the **v0.1 technical prototype** (3-discipline `Kiếm Tu`/`Pháp Tu`/`Thể Tu` manual combat and open Phì Đế Chapter 1 quest). In **Phase 1B.0** and **Technical Design Freeze v1.0**, the project owner approved **Game Design Baseline v0.2** (`docs/DECISIONS.md`) and the 40 technical specifications (`TD-01`–`TD-05` under `docs/systems/`, `docs/pipelines/`, `docs/technical/` as **`DESIGN APPROVED / NOT IMPLEMENTED`**), establishing an **Online AFK Cultivation RPG** with online-only Auto Farm (`GD-002`), manual quest execution + auto-navigation only (`GD-003`, `GD-004`), Character Level `1–350+` (`Phàm Nhân` `1–10` + 17 realms × 20 levels, `GD-020`), 6 independent 10-stage Dao mastery paths (`Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu`, `GD-024`), 3 immutable `Tiên Thiên` + 3 active `Hậu Thiên` destinies (`GD-010`–`GD-013`), a universal Main Quest for all players (`GD-006`, `GD-040`), at-most-1-of-10 exclusive Legendary Signature destiny ownership (across both `Tiên Thiên` and `Hậu Thiên`, `GD-014`, `GD-015`) as the first prerequisite for optional 6-chapter True Disciple routes, and NPC-only BUY/SELL shops (`docs/systems/NPC_SHOPS.md` under TD-04 authority, with no P2P trading/listings/auctions/escrow). Runtime migration will occur only in owner-authorized slices (`S0`–`S8` in `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`).

1. **Shared Protocol & Canonical Game Data (`packages/shared`, `packages/game-data`)**:
   - Canonical 17 cultivation realms (`Phàm Nhân` + 17 realms from `Luyện Khí` through `Thánh Cảnh`) in `packages/game-data/src/index.ts` with exact Tu Vi requirements, HP, MP, attack, defense, and offline meditation curves.
   - Canonical 10 legendary figures (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`) plus village culinary merchant `merchant_truong`.
   - `dam_lon_tien_tu` realm strictly preserved as `"UNKNOWN"` (`Bất Minh (Không Rõ Cảnh Giới)`).
   - `chatdvt` strictly depicted and animated as a jade-cyan quadruped spirit beast (`Thánh Cảnh (Thánh Thú)`).
   - Phì Đế's **Ẩm Thực Đại Đạo** supporting both shop purchase (`Lão Trù Trương`) and self-cooking (`Thần Đỉnh`) of spiritual dishes (`mi_linh_mach`, `pho_linh_khi`, `thit_linh_thu_nuong`, `tuu_linh_bao`).
   - Quantitative progression simulator (`packages/game-data/src/runSimulation.ts`).
2. **Authoritative Multiplayer Server (`apps/server`)**:
   - Node.js + Colyseus `0.18.x` authoritative `ZoneRoom` (`apps/server/src/zoneRoom.ts`) and `AuthoritativeWorldEngine` (`apps/server/src/worldEngine.ts`) with server-side movement validation, tile collision checking, zone portal transitions (`tan_thu_thon` ↔ `thanh_truc_lam`), shared mob AI & respawns (`truc_lang`, `thanh_lan_xa`), real-time melee/skill combat, loot drops, quests, 2–4 player party Tu Vi bonus, and offline cultivation claim (`<= 8h` cap).
   - Persistent PostgreSQL storage (`apps/server/src/db.ts`) using embedded `@electric-sql/pglite` by default or external `pg` via `DATABASE_URL`, with `idempotency_ledger`, `economy_audit_log`, and deterministic `resolvePgDataDir` split-brain protection.
3. **Phaser 4 Browser Client (`apps/client`)**:
   - Phaser `4.2.1` + TypeScript + Vite client (`apps/client/src/main.ts`, `apps/client/src/WorldScene.ts`, `apps/client/src/ui.ts`, `apps/client/src/network.ts`, `apps/client/src/audio.ts`).
   - Genuine Tiled `.tmj` multi-layer rendering (`Ground`, `Paths`, `GroundDetails`, `Collision`, `Interactables`, `AbovePlayer`, `Portals`) with Y-sorted depth occlusion.
   - Dual-resolution sprite registration supporting `80x96` (`480x1920`) upgraded characters alongside `48x64` (`288x1024`) legacy characters and `64x64` combat VFX (`assets/vfx/combat_vfx.png`).

---

## 3. Actual Phase 0 Results & Phase 1A Governance Status

### 3.1 Installed & Validated Workspace Skills (30 Total in `.agents/skills/`)
- **Project-Specific & Governance Skills (5):** `ai-art-production`, `cultivation-balance`, `mmorpg-server-integrity`, `pixel-art-director`, `world-and-map-qa`.
- **Phaser 4 & Pipeline Skills (11):** `phaser4-animations`, `phaser4-game-setup-and-config`, `phaser4-loading-assets`, `phaser4-physics-arcade`, `phaser4-scenes`, `phaser4-sprites-and-images`, `phaser4-tilemaps`, `phaser4-v3-to-v4-migration`, `sprite-pipeline`, `game-playtest`, `game-ui-frontend`.
- **GameDev Skills Collection (8):** `phaser-core`, `phaser-arcade-physics`, `create-game-assets`, `rpg`, `game-feel`, `level-design`, `game-ui-ux`, `prototype-fast`.
- **Agent Sprite Forge Collection (5):** `generate2dmedia`, `generate2dsprite`, `video2dsprite`, `generate2dmap`, `codeart2d` *(explicit owner-authorized fallback only; prohibited for final production art)*.
- **Pixel Art Professional Skill (1):** `pixel-art`.

### 3.2 Upgraded Proof-of-Concept Assets (3 Characters + 1 Combat VFX Sheet)
Generated via Antigravity native `image-generator` subagent (`4x4` locomotion + `4x4` combat/action source grids stored in `assets/source_ai/`), sliced via Agent Sprite Forge `assemble_frames.py`, normalized into `80x96` frames (`480x1920` sheet, 20 rows × 6 cols), exported with packed atlases (`assets/atlases/*_atlas.png` + `*_atlas.json`) and GIF previews (`assets/previews/*.gif`), and audited via `pixel-art/scripts/quality_audit.py`:

| Character / Asset | Runtime Sheet | Verified Dimensions | Source AI Grids (`assets/source_ai/`) | Technical Audit | Creative Approval State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Kiếm Tu** (`hero_kiem_tu`) | `assets/sprites/hero_kiem_tu.png` | `480x1920` (`80x96` frame, 20×6) | `hero_kiem_tu_locomotion_4x4.png`, `hero_kiem_tu_combat_4x4.png` | `PASS` (64 colors, 0 orphans) | `TECHNICALLY_VERIFIED` *(Pending `HUMAN_APPROVED`)* |
| **Phì Đế** (`phi_de`) | `assets/sprites/phi_de.png` | `480x1920` (`80x96` frame, 20×6) | `phi_de_locomotion_4x4.png`, `phi_de_combat_4x4.png` | `PASS` (64 colors, 0 orphans) | `TECHNICALLY_VERIFIED` *(Pending `HUMAN_APPROVED`)* |
| **Dẩm Lồn Tiên Tử** (`dam_lon_tien_tu`) | `assets/sprites/dam_lon_tien_tu.png` | `480x1920` (`80x96` frame, 20×6) | `dam_lon_tien_tu_locomotion_4x4.png`, `dam_lon_tien_tu_combat_4x4.png` | `PASS` (64 colors, 0 orphans) | `TECHNICALLY_VERIFIED` *(Pending `HUMAN_APPROVED`)* |
| **Combat VFX** (`vfx_combat_sheet`) | `assets/vfx/combat_vfx.png` | `256x256` (`64x64` frame, 4×4) | `vfx_combat_4x4.png` | `PASS` (63 colors, 0 orphans) | `TECHNICALLY_VERIFIED` *(Pending `HUMAN_APPROVED`)* |

All three upgraded characters have preserved v1 backups in `assets/sprites/legacy_v1/` and before/after visual comparisons in `assets/previews/` and `docs/evidence/phase-0/`.

---

## 4. Remaining Legacy & Placeholder Assets Requiring Future Generative Upgrade

1. **9 Legacy `48x64` Single-Image-Derived Spritesheets (`288x1024`, 16 rows × 6 cols, `PLACEHOLDER` / `TECHNICALLY_VERIFIED`)**:
   Extracted from single static quadrants in `assets/concepts/overworld_cast_grid_1..3.jpg` with programmatic 2D crop/bob/flip animation in `packages/art-tools/build_assets.py`:
   - **Legendary NPCs (5):** `rmt_de`, `vaal_de`, `hoa_tran`, `anh_7`, `ngoc_tam`
   - **Village Merchant (1):** `merchant_truong`
   - **Spirit Beast & Monsters (3):** `chatdvt` (spirit beast), `truc_lang`, `thanh_lan_xa`
2. **2 Unproduced Legendary Character Visual Sets (`PLACEHOLDER` Aliases in `packages/game-data/src/index.ts`)**:
   - `thai_tai`: currently reuses `spriteKey: "hoa_tran"` and `portraitKey: "portrait_hoa_tran"`.
   - `gia_bao`: currently reuses `spriteKey: "hero_kiem_tu"` and `portraitKey: "portrait_hero_kiem_tu"`.
3. **Procedurally Drawn Tiles & VFX (`PLACEHOLDER` Programmatic Art in `packages/art-tools/build_assets.py`)**:
   - `assets/tilesets/bat_hoang_tileset.png` (`512x256`): terrain tiles 1–14 and 22 are drawn via `PIL.ImageDraw` primitives (`make_tile`), with AI-derived props stamped into tiles 15–21 and 23–24.
   - `assets/vfx/portal_ring.png` & `assets/vfx/phi_de_blessing.png` (`256x64`): drawn via `PIL.ImageDraw` ellipses.

---

## 5. Known Technical & Visual Quality Issues

1. **Human Creative Approval Pending:**
   - The project owner has not accepted the current overall gameplay visual presentation (`Candidate A` reference tiles, static-grid frame variance, and legacy `48x64` affine sprites) as final production quality.
2. **Static Multi-Pose Grid Variance:**
   - Because `image-generator` produces static `4x4` sheets rather than temporal video clips, subtle per-cell proportion and garment-detail variations occur between frames even after bottom-center foot-anchor locking `(40, 88)` and bounding-box normalization.
3. **Mixed Scale Coexistence During Transition:**
   - The 3 upgraded `80x96` (`scale = 0.82`) characters coexist on screen with the 9 legacy `48x64` (`scale = 1.0`) sprites and 2 aliased NPCs until the remaining cast is upgraded under the Phase 1 Art Bible.
4. **Windows `npm run dev:server` Entry Check & Deterministic `PGDATA_DIR` Resolution (`S0 BUILD/VERIFY PASS — OWNER REVIEW PENDING`):**
   - **Patched Entry Check (`7914c2a` / `e0eab60`):** `apps/server/src/index.ts` normalizes Windows backslashes before checking `endsWith("src/index.ts")` or `endsWith("dist/index.js")`, and loads `<repo>/.env` via `loadRepoEnvIfNeeded()` prior to reading `PORT` or DB settings without overriding explicitly supplied environment variables.
   - **Deterministic `resolvePgDataDir` (`S0`):** `apps/server/src/db.ts` resolves `PGDATA_DIR` deterministically across working directories: preserves existing legacy nested saves at `apps/server/apps/server/data/pgdata` when only the legacy directory is initialized, uses canonical `apps/server/data/pgdata` on fresh setups or when only canonical is initialized, and fails closed with `SPLIT_BRAIN_PGDATA_DIR` if both are initialized.

---

## 6. Current Active Priority (Slice `S0`: `S0 BUILD/VERIFY PASS — OWNER REVIEW PENDING`)

**Slice `S0` — Foundation, PGlite Backup & Environment Safety (`S0 BUILD/VERIFY PASS — OWNER REVIEW PENDING`)**:
- Offline backup of `apps/server/apps/server/data/pgdata` created under `apps/server/data/backups/` and validated via throwaway restore.
- Deterministic `resolvePgDataDir` split-brain protection, safe `.env` loading, and isolated two-browser `npm run test:e2e` (`memory://` storage + gitignored per-run `artifacts/playtest/runs/<run-id>/` output) implemented and verified.
- **Next Gate**: Wait for explicit project-owner review, approval, and commit/push of `S0` before starting **Slice `S1` (`Character schema v0.2 and migration with 6 origin stats, Level/EXP/Tu Vi, 3 immutable Tiên Thiên`)** per `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`.
