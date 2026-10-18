# Art Bible — Tông Môn 8D: Tu Tiên Chi Lộ

> **Status Notice (`DOC-CLEAN-01` after `PRE-S1F` `b82e20b`):** This document separates **(1) historical Phase 0 capability proof**, **(2) current verified runtime rendering compatibility (`RULES.md` Rule 5)**, **(3) the owner-directed `S1` visual execution sequence (`VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F`)**, and **(4) explicit `HUMAN_APPROVED` creative decisions**. Routine creative approvals are recorded in `AGENTS.md` Section 5 and this document without mutating frozen `TD_FREEZE_APPROVALS.md` (`39c41a6`).

## 1. Creative & Technical Approval Lifecycle States

All visual directions and individual game assets are governed by five strictly separated states. **Automated technical verification (`npm run verify:assets`, `quality_audit.py`) NEVER substitutes for human art approval:**

1. **`PROPOSED`**: Concept direction, style guide, or candidate artwork generated and awaiting human review.
2. **`TECHNICALLY_VERIFIED`**: Asset passes automated dimension, alpha transparency, frame distinctness, palette, and provenance SHA-256 checks (`verify_manifest.ts` / `quality_audit.py`), and loads cleanly in Phaser 4, but has **not** received explicit human creative sign-off. *(Note: `"status": "approved"` in `assets/manifest.json` v2.0.0 and `"status": "pass"` in `assets/provenance.json` v2.0.0 denote `TECHNICALLY_VERIFIED` pipeline status only.)*
3. **`HUMAN_APPROVED`**: Explicitly reviewed and approved at actual in-game zoom by the human project owner, with approval recorded in the Human Creative Decisions Ledger (`AGENTS.md` Section 5 and `docs/ART_BIBLE.md`).
4. **`REJECTED`**: Evaluated and rejected for visual direction, readability, or lore fidelity (may be retained in `assets/concepts/` or `docs/evidence/` purely as historical comparison evidence).
5. **`PLACEHOLDER`**: Temporary or legacy asset (`48x64` single-frame affine-transformed sprites, shared sprite aliases for `thai_tai` and `gia_bao`, or programmatically drawn tiles/VFX in `build_assets.py`) kept only to maintain playability until `HUMAN_APPROVED` generative replacements are produced.

---

## 2. Historical Phase 0 Capability Proof Record (Non-Executable Legacy Reference)
- **Historical Phase 0 Context**: During Phase 0 bootstrap, the Antigravity `image-generator` subagent (`TypeName: "image-generator"`) was paired with local Python + `Pillow` normalization, Agent Sprite Forge (`assemble_frames.py`), and the legacy monolithic prototype script `packages/art-tools/build_assets.py`.
- **Whole-Command Prohibition on `build_assets.py`**: `packages/art-tools/build_assets.py` is recorded here strictly as **historical Phase 0 provenance**. Per `AGENTS.md` Section 4.3 and `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, **never execute `python packages/art-tools/build_assets.py` (or `npm run generate:art` / `npm run generate:art:force`) as a whole production command**, because it contains procedural `ImageDraw` tileset/VFX generation and overwrites manifests/maps.
- **External Paid API Status**: Paid external API routes (`OpenAI`, `Google Gemini`, `xAI`, `BytePlus ModelArk`, `fal.ai`, `PixelLab`) and external CLI media wrappers (`codex`, `grok`, `route_media.py`) are prohibited for production asset generation (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`).
- **Historical Phase 0 Outputs**: `assets/concepts/capability_proof_phi_de.jpg` and Phase 0 `4x4` multi-pose grids in `assets/source_ai/`.
- **Limitations & Pipeline Observations**: Static `4x4` AI grids stripped via chroma-key and normalized to `80x96` frames pass technical audit checks (`TECHNICALLY_VERIFIED`), but exhibit static cell-to-cell garment/proportion variance and coexist with legacy `48x64` sprites and procedurally drawn tiles in `bat_hoang_tileset.png`. The overall in-game visual presentation remains **pending human creative review and approval** through the `VISUAL-01 -> VISUAL-02 -> VISUAL-03` workflow below.

---

## 3. Historical Reference Candidates vs. Active `S1` Visual Sequence (`VISUAL-01` → `VISUAL-03`)

### 3.1 Historical Milestone A Candidates (Retained Reference Only)

> **Governance Correction:** Historical `Candidate A` was previously marked `APPROVED & LOCKED` by an autonomous agent during Milestone A. Because the project owner has not accepted the current visual presentation quality as final, `Candidate A` is classified as **`PROPOSED` / `TECHNICALLY_VERIFIED` (Historical Reference Direction Pending Renewed Human Approval)**—not a production style lock. Historical `Candidate A`, `Candidate B`, and `Candidate C` are **not** the three new concept sets to be produced in `VISUAL-01`.

| Historical Candidate | File | Visual Direction | Technical & Lore Critique | Current Governance State |
|---|---|---|---|---|
| **Candidate A** | `assets/concepts/candidate_a_classic_xianxia.jpg` | **Classic Crisp 16/32-bit Xianxia Top-Down RPG**: Warm stone pathways, dark-slate curved roofs, emerald bamboo, warm lantern glow, 3-value shading, dark outlines, readable chibi-heroic proportions. | Strong value separation between walkable ground, collidable architecture/trees, and character silhouettes; supports both `Tân Thủ Thôn` and `Thanh Trúc Lâm`. | **`PROPOSED` / `TECHNICALLY_VERIFIED`** *(Historical reference direction; not a style lock)* |
| **Candidate B** | `assets/concepts/candidate_b_dark_inkwash.jpg` | **Dark Ink-Wash Mythic Xianxia**: Monochrome grey/black ink with stark crimson accents. | Atmospheric for a late-game demonic dungeon (`Huyết Ma Động`), but poor readability for an inviting starter village and flattens Phì Đế's golden culinary motifs and ChatDVT's jade-cyan identity. | **`REJECTED`** *(Retained as historical evidence)* |
| **Candidate C** | `assets/concepts/candidate_c_pastel_chibi.jpg` | **Pastel Super-Deformed Chibi**: Ultra-bright candy pastel palette, soft low-contrast outlines, isometric toy-like proportions. | Lacks value contrast against gameplay VFX; undermines the majestic Saint Emperor presence of Tam Đế (`Phì Đế`, `RMT Đế`, `Vaal Đế`). | **`REJECTED`** *(Retained as historical evidence)* |

### 3.2 Active `S1` Visual Execution Sequence (`VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F`)

Before running the `S1-F` Slice `S1` acceptance gate, visual work proceeds through three owner-reviewed stages scoped strictly to Slice `S1` (without requiring all 10 Legends, all future regions, or `S2`–`S8` content):

| Task | Deliverable for Owner Review | Approval Gate & Scope Boundary |
|---|---|---|
| **`VISUAL-01`** | **Three new coherent visual direction sets** (`V01-A`, `V01-B`, `V01-C`) under fresh IDs/versions distinct from historical `Candidate A/B/C`. | **Owner selected `V01-B — Thiên Mệnh Tiên Cung`** with Three-Tier Grandeur System (`Tân Thủ Thôn` = Tier I Grounded Starter Village). |
| **`VISUAL-02`** | **Scoped `S1` Core Asset Kit & `96×72` `Tân Thủ Thôn` Blueprint** (`VISUAL-02A`, `VISUAL-02A-R1-CLOSE`, `VISUAL-02B`, `VISUAL-02B-CORRECTION`), including differentiated `phi_de` (chubby bear-hat saint mascot holding `Đùi Gà Luộc`) and `rmt_de` (`Thần Tài` merchant lord). | **Owner approved the `VISUAL-02B` Core Art Kit** (including corrected `phi_de` and `rmt_de`) for `VISUAL-03` integration. |
| **`VISUAL-03`** | **Staged Phaser 4 / Tiled Integration (`VISUAL-03-P` → `VISUAL-03-W` → `VISUAL-03-U` → `VISUAL-03-Q`)**: `VISUAL-03-P` (`COMMITTED` at `4679f49`); **`VISUAL-03-W` (`IMPLEMENTED_AWAITING_OWNER_RUNTIME_REVIEW`)** integrates `96×72` `maps/tan_thu_thon.tmj`, `CameraView.ts`, `MinimapView.ts`, 11 `80×96` starter/NPC sprites (`full_80x96_20row`, `locomotion_80x96_8row`, `stationary_npc_80x96_4f`), buildings/props/bridges, and Y-sorted roof/nameplate occlusion; `VISUAL-03-U` (UI/HUD 9-slice & icons) and `VISUAL-03-Q` (FPS/frame-time closeout & `HUMAN_APPROVED` sign-off) follow next. | **Owner runtime review gate after `VISUAL-03-W`**, followed by `VISUAL-03-U` and `VISUAL-03-Q`. |
| **`S1-F`** | **Slice `S1` (`Character Base`) Acceptance & Closeout Gate**: creation/reroll/confirm concurrency races, replay/idempotency, stat allocation & destiny equip invariants, two-browser multiplayer visibility, reconnect, file-backed isolated PGlite restart persistence, and current `VISUAL-03` visual evidence. | **Owner accepts `S1-F` closeout.** In-memory-only E2E (`memory://`) never substitutes for file-backed restart proof. |

---

## 4. Verified Runtime Technical Specifications (Multi-Profile Coexistence — `RULES.md` Rule 5)

Current runtime rendering geometry in `apps/client/src/WorldScene.ts` and `packages/art-tools/verify_manifest.ts` (`48` verified manifest assets, `11` `VISUAL-03-W` character sheets, `2` Tiled maps):

- **Logical World Grid**: `32x32` pixels per tile:
  - `maps/tan_thu_thon.tmj`: **`96x72` tiles (`3072x2304` px)** using `assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png` (`256x192`, 48 tiles of `32x32` px; `5,357` walkable tiles, `1,555` blocked tiles).
  - `maps/thanh_truc_lam.tmj`: **`44x32` tiles (`1408x1024` px)** using `assets/tilesets/bat_hoang_tileset.png`.
- **Profile 1 — `full_80x96_20row` (`hero_kiem_tu`)**:
  - **Runtime Spritesheet**: `480x1920` pixels (`6` columns × `20` rows of `80x96` frames: 5 states [`idle` 4f, `walk` 6f, `attack` 4f, `cast` 4f, `hurt` 4f] × 4 directions [`down`, `left`, `right`, `up`]), foot anchor `(0.5, 0.9167)` (`x = 40, y = 88`), rendered at `scale = 0.82`.
- **Profile 2 — `locomotion_80x96_8row` (`hoa_tran`, Starter `ngoc_tam`, `anh_7`, Quadruped `chatdvt`)**:
  - **Runtime Spritesheet**: `480x768` pixels (`6` columns × `8` rows of `80x96` frames: 4-direction `idle` rows `0..3` + 4-direction `walk` rows `4..7`), foot anchor `(0.5, 0.9167)`, rendered at `scale = 0.82`. Non-locomotion states (`attack`/`cast`/`hurt`) deterministically fall back to same-direction `idle_<dir>` (`S3_COMBAT_ACTION_SHEET_DEFERRED`).
- **Profile 3 — `stationary_npc_80x96_4f` (`phi_de`, `rmt_de`, `merchant_truong`, `dam_lon_tien_tu`, `npc_ngoc_tam`, `thai_tai`)**:
  - **Runtime Spritesheet**: `320x96` pixels (`4` columns × `1` row of `80x96` frames: 4-frame `idle_down` strip), foot anchor `(0.5, 0.9167)`, rendered at `scale = 0.82`. Dedicated `npc_ngoc_tam` (`Xui Xẻo Chân Quân`) and `thai_tai` (`Thái Tài`) sheets eliminate the former `ngoc_tam` starter collision and `hoa_tran` alias while preserving canonical NPC IDs (`"ngoc_tam"`, `"thai_tai"`).
- **Profile 4 — Preserved `legacy_48x64_16row` (`truc_lang`, `thanh_lan_xa`, `vaal_de`)**:
  - **Runtime Spritesheet**: `288x1024` pixels (`6` columns × `16` rows of `48x64` frames), foot anchor `(0.5, 0.90)` (`x = 24, y = 58`), rendered at `scale = 1.0`. `gia_bao` in `Thanh Trúc Lâm` retains `spriteKey: "hero_kiem_tu"` until its dedicated sheet is produced.
- **World Landmarks, Architecture, Props & VFX**:
  - Grounded Tier I buildings & props in `assets/props/` (`building_tan_thu_tu_duong.png`, `building_tu_bao_cac.png`, `building_hong_tran_cac.png`, `prop_noodle_stall.png`, `prop_than_dinh.png`, `prop_portal_arch.png`, `prop_peach_tree.png`, `prop_bamboo_cluster.png`, `prop_stone_lantern.png`, `prop_arched_bridge.png`, `prop_bridge_horizontal.png`, `prop_village_stele.png`, `prop_spirit_herb.png`, `prop_incense_brazier.png`, `prop_jade_rock.png`, `prop_wooden_fence.png`) with Y-sorted occlusion anchored at each structure's southern blocked footprint base $Y_{\text{base}}$.
  - VFX sheets in `assets/vfx/`: `combat_vfx.png` (`256x256`), `portal_ring.png` (`256x64`), `phi_de_blessing.png` (`256x64`).
- **Portraits**: `160x160` RGBA PNGs in `assets/portraits/` (`12` portraits including dedicated `portrait_thai_tai.png`, `portrait_npc_ngoc_tam.png`, and `portrait_ngoc_tam.png`).
- **Camera & Minimap (`CameraView.ts` & `MinimapView.ts`)**: Phaser `4.2.1` with `pixelArt: true`, `antialias: false`, `roundPixels: true`, `Phaser.Scale.RESIZE`, adaptive camera zoom (`1.0×` at `1280x720`, `1.25×` at `1920x1080`, `1.5×` at `2560x1440`, `2.0833×` at `3840x2160`, `1.0×` at `390x844` mobile) keeping visible world $\le 60\% \times 45\%$ of `Tân Thủ Thôn`, and persistent read-only `MinimapView` in `#hud-minimap-mount`.

## 5. Reference World Palette (`Candidate A` Baseline — Subject to `VISUAL-01` Direction Selection)
- **Tân Thủ Thôn (Warm Hearth & Jade Sanctuary)**:
  - Stone Path Ramp: `#a89f91` (light), `#8c8273` (base), `#6b6255` (shadow)
  - Village Grass Ramp: `#5c9e57` (light), `#468242` (base), `#31612e` (shadow)
  - Temple Slate Roof Ramp: `#4a5d73` (light), `#324254` (base), `#1f2b38` (shadow)
  - Culinary Gold / Lantern Glow: `#ffd86b` (core), `#f29f38` (warm mid), `#b85d19` (deep ember)
- **Thanh Trúc Lâm (Misty Emerald Spirit Grove)**:
  - Bamboo Foliage Ramp: `#4ec978` (canopy highlight), `#2da35c` (mid), `#196e3b` (deep shade)
  - Forest Moss Ground: `#3a7554` (light), `#2a593f` (base), `#1c3d2b` (shadow)
  - Spirit Stream Water: `#5ce1e6` (foam), `#2da8b8` (base), `#1b6d7d` (deep)
  - Spatial Portal Jade/Gold: `#63ffda` (jade arc), `#ffd166` (runic ring), `#112a36` (void core)
