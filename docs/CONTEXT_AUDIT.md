# TÔNG MÔN 8D: TU TIÊN CHI LỘ — PHASE 1A CONTEXT AUDIT & PHASE 1 PLAN

## 1. What the Project Currently Is

**Tông Môn 8D: Tu Tiên Chi Lộ** (`https://github.com/tienDang0805/tong-mon-8d`) is an existing, functional 2D top-down pixel-art Xianxia (Tu Tiên) multiplayer RPG monorepo built with:
- **Client (`apps/client/`)**: Phaser `4.2.1` + TypeScript + Vite (`src/main.ts`, `src/WorldScene.ts`, `src/ui.ts`, `src/network.ts`, `src/audio.ts`, `src/styles.css`) rendering two Tiled JSON maps (`maps/tan_thu_thon.tmj` at `40x30` tiles and `maps/thanh_truc_lam.tmj` at `44x32` tiles, `32x32` px grid), Y-sorted depth occlusion, 4-directional sprite animations, synthesized WebAudio SFX, and a DOM HUD overlay.
- **Server (`apps/server/`)**: Authoritative Node.js + Colyseus `0.18.x` server (`src/index.ts`, `src/zoneRoom.ts`, `src/worldEngine.ts`) with embedded `@electric-sql/pglite` (or external `pg`) persistence (`src/db.ts`), server-validated movement/collision, bidirectional portal room transitions (`tan_thu_thon` ↔ `thanh_truc_lam`), shared monster AI (`truc_lang`, `thanh_lan_xa`), real-time melee/skill combat, loot drops, culinary shop/cauldron cooking, Phì Đế Chapter 1 quest, 2–4 player party Tu Vi bonus, 8-hour capped offline meditation, idempotency ledger, and economy audit log.
- **Shared & Canonical Data (`packages/shared/`, `packages/game-data/`)**: Shared network contracts (`packages/shared/src/index.ts`), canonical 17 cultivation realms (`Phàm Nhân` + 17 realms), 10 legendary NPCs, items, recipes, quests, and progression simulator (`packages/game-data/src/index.ts`, `packages/game-data/src/runSimulation.ts`).
- **Art Tools (`packages/art-tools/`)**: Post-processing and packaging script (`build_assets.py`) plus manifest/provenance integrity validator (`verify_manifest.ts`).

---

## 2. What Phase 0 Actually Produced

At commit `934f728` (and migration commit `21ae81e`, current `master` HEAD):
1. **Installed Workspace Skills**: Installed 29 skills under `.agents/skills/` (expanded to **30** in Phase 1A with `.agents/skills/ai-art-production/SKILL.md`), including official Phaser 4 skills, GameDev skills, Agent Sprite Forge (`generate2dmedia`, `generate2dsprite`, `video2dsprite`, `generate2dmap`, `codeart2d`), and `pixel-art`.
2. **Multi-Pose AI Pipeline PoC (3 Characters + 1 Combat VFX Sheet)**:
   - Generated `4x4` directional locomotion and `4x4` combat/cast/hurt source sheets via the native `image-generator` subagent, preserved in `assets/source_ai/`.
   - Sliced and registered frames into `80x96` logical cells (`480x1920` runtime sheets, 6 columns × 20 rows, foot anchor `(0.5, 0.9167)` / `(40, 88)`) for:
     - `hero_kiem_tu` (`assets/sprites/hero_kiem_tu.png`)
     - `phi_de` (`assets/sprites/phi_de.png`)
     - `dam_lon_tien_tu` (`assets/sprites/dam_lon_tien_tu.png`)
   - Produced `assets/vfx/combat_vfx.png` (`256x256`, `64x64` frames in `4x4` grid) from `assets/source_ai/vfx_combat_4x4.png`.
   - Exported packed atlases (`assets/atlases/<id>_atlas.png` + `.json`), individual frame PNGs (`assets/atlases/<id>/frames/`), animated GIF previews (`assets/previews/*.gif`), and before/after sheets (`assets/previews/*_before_after.png` and `docs/evidence/phase-0/`).
   - Preserved legacy `48x64` (`288x1024`) backups for those 3 characters in `assets/sprites/legacy_v1/`.
3. **What Phase 0 Did NOT Do**:
   - Did not upgrade the remaining **9** legacy `48x64` (`288x1024`) sprites (`rmt_de`, `vaal_de`, `hoa_tran`, `anh_7`, `ngoc_tam`, `merchant_truong`, `chatdvt`, `truc_lang`, `thanh_lan_xa`), which remain single-frame AI quadrant extracts animated via programmatic 2D crop/bob/flip in `build_assets.py`.
   - Did not produce dedicated portraits or sprites for `thai_tai` (currently aliased to `hoa_tran`) or `gia_bao` (currently aliased to `hero_kiem_tu`).
   - Did not replace the procedurally drawn base terrain tiles (`make_tile` using `PIL.ImageDraw` in `build_assets.py`) inside `assets/tilesets/bat_hoang_tileset.png` or the procedurally drawn VFX rings (`portal_ring.png`, `phi_de_blessing.png`).
   - Did not obtain human project-owner creative approval (`HUMAN_APPROVED`) for the visual presentation.

---

## 3. Existing Source-of-Truth Documents & Hierarchy

Per `AGENTS.md`, the authoritative documentation hierarchy is:
1. **Project Rules & Safety Boundaries**: `AGENTS.md`, `RULES.md`
2. **Current Phase & Verified Implementation Status**: `docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, `docs/WORKSPACE_HANDOFF.md`, `docs/NEXT_ACTIONS.md`
3. **Human-Approved Creative & Gameplay Decisions**: Human Creative Decisions Ledger in `AGENTS.md` (mirrored in `docs/ART_BIBLE.md`)
4. **Canonical Lore & Character Identities**: `packages/game-data/src/index.ts`, `packages/shared/src/index.ts`, and canonical lore sections (Sections 5–7) of `MASTER_PROMPT.md`
5. **Phase 1 Design Specifications**: `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, and the upcoming Phase 1 specs (`docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`)
6. **Domain-Specific Agent Skills**: `.agents/skills/*/SKILL.md`
7. **Archived Bootstrap Prompts & Historical Reports**: `MASTER_PROMPT.md` (Sections 0, 14, 16), `START_HERE.md`, `docs/IMPLEMENTATION_STATUS.md`

---

## 4. Conflicting and Outdated Instructions Verified & Reconciled in Phase 1A

| Conflict ID | Verified Finding in Repository | Resolution Applied in Phase 1A |
|---|---|---|
| **Conflict A — Obsolete New-Project Instructions** | `MASTER_PROMPT.md` (lines 3, 325, 395, 404) and `START_HERE.md` (lines 5, 14–19) contained `"NEW PROJECT ONLY"` and `"Create a NEW, empty tong-mon-8d project"` instructions. | Added explicit historical archive banners to `MASTER_PROMPT.md` and `START_HERE.md` forbidding project recreation while preserving Sections 2–12 as canonical lore/design reference. |
| **Conflict B — Incorrect Task Priority** | `AGENTS.md` pointed to `docs/NEXT_ACTIONS.md`, which prioritized Zone 3 (`Vạn Bảo Các & Kim Đan Bí Cảnh`), Chapters 2–5 quests, and Sect Bosses ahead of Phase 1 design and art approval. | Updated `AGENTS.md` and `docs/NEXT_ACTIONS.md` to set **Phase 1** as the active priority and archived Zone 3 / expansion items under a deferred post-Phase-1 backlog. |
| **Conflict C — Sprite Metadata & Path Inconsistency** | `docs/PROJECT_STATUS.md` claimed upgraded sheets were `480x672` (`7×6`, anchor `(0.5, 0.896)`) and legacy sheets were `288x448` (`7×6`, anchor `(0.5, 0.875)`), and referenced nonexistent file paths (`WorldRoom.ts`, `repository.ts`, `HudController.ts`). `RULES.md` and `docs/ART_BIBLE.md` only listed `48x64`. | Verified actual files and `WorldScene.ts`: upgraded sheets are `80x96` frames in `480x1920` (`6×20`, anchor `(0.5, 0.9167)` / `(40, 88)`, `scale = 0.82`); legacy sheets are `48x64` frames in `288x1024` (`6×16`, anchor `(0.5, 0.90)` / `(24, 58)`, `scale = 1.0`). Updated `docs/PROJECT_STATUS.md`, `docs/WORKSPACE_HANDOFF.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, and `RULES.md`. |
| **Conflict D — Unapproved Art Direction** | `docs/ART_BIBLE.md` marked `Candidate A` as `APPROVED & LOCKED` (self-assigned by an earlier agent), and `manifest.json` marked all 35 assets `"status": "approved"`. | Established the 5-state lifecycle (`PROPOSED`, `TECHNICALLY_VERIFIED`, `HUMAN_APPROVED`, `REJECTED`, `PLACEHOLDER`) in `AGENTS.md` and `docs/ART_BIBLE.md`. Reclassified `Candidate A` and Phase 0 PoC assets as `TECHNICALLY_VERIFIED` / `PROPOSED` pending human approval. |
| **Conflict E — Missing Context References** | `.agents/skills/pixel-art-director/SKILL.md` line 10 referenced `docs/CHARACTERS.md`, which does not exist in `docs/`. | Updated `.agents/skills/pixel-art-director/SKILL.md` to reference `docs/CHARACTER_VISUAL_BIBLE.md` and `packages/game-data/src/index.ts`. |
| **Conflict F — Machine-Specific Metadata** | `assets/provenance.json` lines 64, 147, 230, 275 contained `/Users/qmacstore/Desktop/tong-mon-8d/...` in `validationResults.qualityAudit.file`. | Replaced `validationResults.qualityAudit.file` with portable relative paths (`assets/sprites/...`, `assets/vfx/...`) while preserving `historicalOriginPath` for audit traceability. Verified with `npm run verify:assets`. |
| **Conflict G — Local Database Safety** | `.env.example` sets `PGDATA_DIR=./apps/server/data/pgdata`, which creates `apps/server/apps/server/data/pgdata` when `npm run dev:server` runs inside `apps/server/`. `docs/DEVELOPMENT_SETUP.md` also referenced `.pgdata/`. Neither `apps/server/apps/` nor `.pgdata/` was in `.gitignore`. | Updated `.gitignore` to ignore `apps/server/data/`, `apps/server/apps/`, `.pgdata/`, `**/.pgdata/`, and `**/pgdata/`. Existing local database files were preserved untouched. |

---

## 5. Existing Canonical Lore (Verified in Code & Docs)

- **World & Supreme Sect**: **Bát Hoang Tu Tiên Giới** and **Bát Đại Thiên Tông (Tông Môn 8D)**.
- **17 Cultivation Realms**: Players begin as `Phàm Nhân` (`orderIndex: 0`) and progress through 17 canonical realms (`orderIndex: 1..17` in `packages/game-data/src/index.ts`):
  1. `Luyện Khí` (9 stages: `Tầng 1` – `Tầng 9`)
  2. `Trúc Cơ` (`Sơ Kỳ`, `Trung Kỳ`, `Hậu Kỳ`, `Đỉnh Phong`)
  3. `Kim Đan`
  4. `Nguyên Anh`
  5. `Hóa Thần`
  6. `Luyện Hư`
  7. `Hợp Thể`
  8. `Độ Kiếp`
  9. `Bán Tiên`
  10. `Chân Tiên`
  11. `Thái Ất Kim Tiên`
  12. `Đại La Kim Tiên`
  13. `Trảm Nhất Đao`
  14. `Trảm Nhị Đao`
  15. `Trảm Tam Đao`
  16. `Bán Thánh`
  17. `Thánh Cảnh` (`Sơ Kỳ`, `Trung Kỳ`, `Hậu Kỳ`, `Chí Tôn Đỉnh Phong`)
- **10 Legendary Cultivators & Tam Đế**:
  - **Tam Đế Huyền Thoại (`Thánh Cảnh`, sworn equals under `Tam Đế Chi Ước`)**:
    1. `phi_de` (**Phì Đế — Đặng Văn Tiến**): Supreme founder, `Ẩm Thực Đại Đạo`; accepts both purchased and self-cooked spiritual dishes.
    2. `rmt_de` (**RMT Đế — Phạm Phan Trọng Khải**): `Kim Tiền Đại Đạo`; in-game `Linh Thạch` economy only, zero real-money transactions.
    3. `vaal_de` (**Vaal Đế — Trần Vũ Hoàng Tâm**): `Vận Mệnh / Tất Tay Đại Đạo`; catchphrase `"1 ăn cả 2 ăn lồn"`, transparent bounded risk with safe alternatives.
  - **Other 7 Canonical Legends**:
    4. `chatdvt` (**ChatDVT**): `Thánh Cảnh (Thánh Thú)`, Phì Đế's jade-cyan quadruped spirit beast (`Vạn Linh Khế Ước Đại Đạo`), never human.
    5. `dam_lon_tien_tu` (**Dẩm Lồn Tiên Tử**): Phì Đế's Dao partner (`Hồng Trần Tâm Đạo`), canonical realm strictly `"UNKNOWN"` (`Bất Minh`).
    6. `ngoc_tam` (**Xui Xẻo Chân Quân — Ngọc Tâm**): `Bán Thánh`, `Nhân Quả Xui Xẻo Đạo` (distinct from Trần Vũ Hoàng Tâm).
    7. `thai_tai` (**Thái Tài**): `Bán Thánh`, `Giám Bảo Cổ Khí Đạo` (relic appraisal, distinct from RMT Đế).
    8. `anh_7` (**Anh 7 — Đoàn Quang Huy**): `Bán Thánh`, `Thất Kiếm Đại Đạo`.
    9. `gia_bao` (**Gia Bảo**): `Đại La Kim Tiên`, `Đại La Vô Cực Đạo` (seeking `Trảm Nhất Đao`).
    10. `hoa_tran` (**Hòa Trần**): `Thái Ất Kim Tiên`, `Thanh Phong Vô Danh Đạo` (wandering hidden immortal).

---

## 6. Missing Design Documents (To Be Authored in Phase 1)

While `MASTER_PROMPT.md` contains raw bootstrap notes and `docs/ART_BIBLE.md` + `docs/CHARACTER_VISUAL_BIBLE.md` contain technical tables, the repository currently lacks the dedicated, human-reviewed Phase 1 specification suite referenced across the architecture:
1. `docs/GAME_VISION.md` *(Missing)*
2. `docs/GAME_LORE.md` *(Missing — currently scattered between `MASTER_PROMPT.md` and `packages/game-data/src/index.ts`)*
3. `docs/GAME_DESIGN.md` *(Missing — mechanics currently embedded directly in `worldEngine.ts` and `runSimulation.ts`)*
4. `docs/NARRATIVE_DESIGN.md` *(Missing — only Chapter 1 of Phì Đế is implemented; the 6-chapter structure for all 10 masters and apprenticeship state machine need formal design)*
5. `docs/WORLD_DESIGN.md` *(Missing — spatial layout, tile rules, and zone progression are not yet formalized in a dedicated spec)*
6. `docs/UX_DESIGN.md` *(Missing — HUD layout, modal governance, and mobile/desktop ergonomics are not yet documented in a standalone spec)*
7. Expanded `docs/ART_BIBLE.md` *(Needs full Phase 1 upgrade covering genuine generative tileset/prop/character standards and human approval rubrics)*

---

## 7. Current Visual Quality Problems (Verified Inspection)

1. **Procedural Terrain Tiles in `bat_hoang_tileset.png`**:
   - Inspection of `packages/art-tools/build_assets.py` (lines 805–947) confirms that base terrain tiles (grass, stone path, forest moss, water, bridge, walls, rocks — tiles 1–14 and 22) are drawn procedurally using `PIL.ImageDraw` (`rectangle`, `line`, `ellipse`) rather than genuine generative artwork. Under the Phase 1A AI Art Production Policy, all new final terrain and ground textures must come from genuine generative output.
2. **Procedural VFX Sheets (`portal_ring.png`, `phi_de_blessing.png`)**:
   - Lines 967–990 of `build_assets.py` draw `portal_ring.png` and `phi_de_blessing.png` using `PIL.ImageDraw` concentric ellipses (`PROGRAMMATICALLY DRAWN ART`).
3. **9 Legacy `48x64` Sprites Use Single-Image Affine Warping**:
   - `chatdvt`, `merchant_truong`, `hoa_tran`, `truc_lang`, `thanh_lan_xa`, `rmt_de`, `vaal_de`, `anh_7`, and `ngoc_tam` (`288x1024`) are generated by slicing a single static front-facing AI concept quadrant, horizontally flipping for left/right, recoloring skin pixels (`make_back_view`) for the up/back view, and shifting leg/torso crops by `±1..2` px (`animate_sprite_frame`). This produces stiff "paper-doll bobbing" rather than true 4-directional locomotion.
4. **2 Legendary NPCs Lack Dedicated Artwork (`PLACEHOLDER` Aliases)**:
   - In `packages/game-data/src/index.ts`, `thai_tai` reuses `hoa_tran`'s sprite and portrait, and `gia_bao` reuses `hero_kiem_tu`'s sprite and portrait.
5. **Multi-Pose Static Grid Variance & Mixed Resolution Coexistence**:
   - The 3 Phase 0 upgraded characters (`hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu` at `80x96` scaled by `0.82`) coexist on the same playfield with `48x64` (`scale = 1.0`) legacy sprites and exhibit minor cell-to-cell costume/proportion jitter inherent to static `4x4` grid generation.

---

## 8. Pending Human Decisions

1. **Approval or Revision of Reference Visual Direction (`DEC-002`)**:
   - Does the project owner want to retain, refine, or replace the `Candidate A` ("Classic Crisp 16/32-bit Xianxia Top-Down RPG") visual direction for Phase 1 `docs/ART_BIBLE.md`?
2. **Evaluation of Phase 0 `80x96` PoC Sprites (`DEC-003`)**:
   - Do `hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu` (`480x1920`), and `combat_vfx` (`256x256`) meet the owner's visual bar at gameplay zoom, or should their prompt/slicing/registration parameters be adjusted in `docs/ART_BIBLE.md` before producing the remaining cast?
3. **Generative Route Selection for Phase 2 Asset Production**:
   - Should future asset batches continue using the built-in Antigravity `image-generator` subagent (`host_image` / `host_image_edit`), or does the owner wish to authorize a specific external image/video API key in `.env` for `generate2dmedia` / `video2dsprite`?
4. **Windows `apps/server/src/index.ts` Entry Check Fix**:
   - Confirm authorization to apply the 3-line cross-platform path normalization (`process.argv[1].replace(/\\/g, "/")`) in `apps/server/src/index.ts` during code-touching phases so `npm run dev` runs natively on Windows without manual workarounds.

---

## 9. Phase 1 Implementation Plan & Document Responsibilities (Stage 8)

Phase 1 will author and align 8 core specifications before any Phase 2 asset generation or feature coding begins:

| Order | Document / Artifact | Core Responsibilities | Upstream Dependencies |
|---|---|---|---|
| **1** | `docs/GAME_VISION.md` | Defines the high-level creative vision, target player group (8–20 friends), 3 session loops (2–5m check-in, 15–30m solo, 20–45m co-op), core pillars (living world, playful canonical reverence, fair co-op progression), and hard anti-goals. | `AGENTS.md`, `MASTER_PROMPT.md` (Sections 0, 2) |
| **2** | `docs/GAME_LORE.md` | Consolidates canonical cosmology of **Bát Hoang Tu Tiên Giới**, **Tông Môn 8D**, the 17 Cultivation Realms (`Phàm Nhân` → `Thánh Cảnh`), `Tam Đế Chi Ước`, and the biographies, Dao philosophies, relationships, and constraints of all 10 Legendary Figures (`dam_lon_tien_tu` = `UNKNOWN`, `chatdvt` = spirit beast). | `docs/GAME_VISION.md`, `packages/game-data/src/index.ts`, `MASTER_PROMPT.md` (Section 5) |
| **3** | `docs/GAME_DESIGN.md` | Specifies authoritative gameplay mechanics: 3 combat disciplines (`Kiếm Tu`, `Pháp Tu`, `Thể Tu`), combat formulas, monster AI states, Tu Vi curve & breakthroughs, 8h offline meditation cap, Phì Đế culinary system (both purchased and cooked foods valid), 3 buff slots (meal/beverage/pill), RMT `Linh Thạch` economy sinks, and Vaal bounded risk mechanics. | `docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `packages/game-data/src/index.ts`, `.agents/skills/cultivation-balance/SKILL.md` |
| **4** | `docs/NARRATIVE_DESIGN.md` | Defines the `Chân Truyền Đệ Tử` apprenticeship progression (`Stranger → Hữu Duyên → Được Chú Ý → Ký Danh → Nội Môn → Chân Truyền`), single-equipped-inheritance rule, Vietnamese dialogue voice per legend, and the 6-chapter quest outlines for all 10 masters + 2 secret arcs (`Tam Đế Chứng Đạo`, `Hồng Trần Đế Yến`). | `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `MASTER_PROMPT.md` (Section 6) |
| **5** | `docs/WORLD_DESIGN.md` | Specifies spatial level design for `Tân Thủ Thôn` and `Thanh Trúc Lâm` (plus planned topology for `Huyết Ma Động` and `Vạn Bảo Các`), `32x32` Tiled `.tmj` layer contracts, collision vs `AbovePlayer` occlusion, landmark coordinates, NPC/monster spawn distribution, and bidirectional portal rules. | `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `.agents/skills/world-and-map-qa/SKILL.md` |
| **6** | `docs/ART_BIBLE.md` *(Phase 1 Full Spec)* | Establishes the human-reviewable visual style guide, color palettes, lighting, silhouette rules, `80x96` (`480x1920`) character animation spec, genuine generative tileset/prop replacement standards (replacing `PIL.ImageDraw` tiles/VFX), and character-by-character art briefs (referenced with `docs/CHARACTER_VISUAL_BIBLE.md`). | `docs/GAME_LORE.md`, `docs/WORLD_DESIGN.md`, `.agents/skills/pixel-art-director/SKILL.md` |
| **7** | `docs/UX_DESIGN.md` | Defines the playfield-first HUD architecture, screen-space budget, compact xianxia theme (scroll/jade/wood), keybindings (`WASD`, `J/K/L`, `E`, `F`, `I/Q/M/Esc`), modal state locking, Vietnamese typography, and responsive scaling (`1280x720` desktop & `390x844` mobile). | `docs/GAME_DESIGN.md`, `docs/ART_BIBLE.md`, `.agents/skills/game-ui-frontend/SKILL.md`, `.agents/skills/game-ui-ux/SKILL.md` |
| **8** | **Asset Provenance & Creative Approval Rules** (`AGENTS.md`, `docs/ART_BIBLE.md`, `.agents/skills/ai-art-production/SKILL.md`) | Enforces the non-negotiable generative origin policy, 12-step production pipeline, portable relative paths in `assets/provenance.json`, 5 lifecycle states (`PROPOSED`, `TECHNICALLY_VERIFIED`, `HUMAN_APPROVED`, `REJECTED`, `PLACEHOLDER`), and the Human Creative Decisions Ledger. | `AGENTS.md`, `RULES.md` |

---

## 10. Recommended Execution Order for Phase 1

1. **Step 1A (Completed in this task)**: Reconcile workspace context, fix conflicts A–G, establish Context Hierarchy and AI Art Production Policy in `AGENTS.md`, create `.agents/skills/ai-art-production/SKILL.md`, and produce `docs/CONTEXT_AUDIT.md`.
2. **Step 1B (Core Vision, Lore & Mechanics)**: Author `docs/GAME_VISION.md`, `docs/GAME_LORE.md`, and `docs/GAME_DESIGN.md`, verifying 100% alignment with `packages/game-data/src/index.ts`.
3. **Step 1C (Narrative & Spatial World Design)**: Author `docs/NARRATIVE_DESIGN.md` (all 10 masters' 6-chapter blueprints + apprenticeship rules) and `docs/WORLD_DESIGN.md` (`Tân Thủ Thôn`, `Thanh Trúc Lâm`, and future zone architecture).
4. **Step 1D (Visual Direction & UX Specification)**: Expand `docs/ART_BIBLE.md` (with `docs/CHARACTER_VISUAL_BIBLE.md`) and author `docs/UX_DESIGN.md`.
5. **Step 1E (Human Owner Gate)**: Present the completed Phase 1 documentation suite for explicit human review and record approved decisions in the **Human Creative Decisions Ledger** (`AGENTS.md` / `docs/ART_BIBLE.md`) before starting Phase 2 generative art production.
