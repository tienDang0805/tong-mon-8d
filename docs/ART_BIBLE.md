# Art Bible — Tông Môn 8D: Tu Tiên Chi Lộ

> **Phase 1 Status Notice:** This document records the Phase 0 technical capability proof, reference visual direction, and verified runtime specifications. It will be expanded and submitted for formal human creative sign-off during **Phase 1** (`docs/ART_BIBLE.md`).

## 1. Creative & Technical Approval Lifecycle States

All visual directions and individual game assets are governed by five strictly separated states. **Automated technical verification (`npm run verify:assets`, `quality_audit.py`) NEVER substitutes for human art approval:**

1. **`PROPOSED`**: Concept direction, style guide, or candidate artwork generated and awaiting human review.
2. **`TECHNICALLY_VERIFIED`**: Asset passes automated dimension, alpha transparency, frame distinctness, palette, and provenance SHA-256 checks (`verify_manifest.ts` / `quality_audit.py`), and loads cleanly in Phaser 4, but has **not** received explicit human creative sign-off. *(Note: `"status": "approved"` in `assets/manifest.json` v2.0.0 and `"status": "pass"` in `assets/provenance.json` v2.0.0 denote `TECHNICALLY_VERIFIED` pipeline status only.)*
3. **`HUMAN_APPROVED`**: Explicitly reviewed and approved at actual in-game zoom by the human project owner, with approval recorded in the Human Creative Decisions Ledger (`AGENTS.md` / `docs/ART_BIBLE.md`).
4. **`REJECTED`**: Evaluated and rejected for visual direction, readability, or lore fidelity (may be retained in `assets/concepts/` or `docs/evidence/` purely as historical comparison evidence).
5. **`PLACEHOLDER`**: Temporary or legacy asset (`48x64` single-frame affine-transformed sprites, shared sprite aliases for `thai_tai` and `gia_bao`, or programmatically drawn tiles/VFX in `build_assets.py`) kept only to maintain playability until `HUMAN_APPROVED` generative replacements are produced.

---

## 2. Capability Proof Record
- **Provider / Tool**: Built-in Antigravity `image-generator` subagent (`TypeName: "image-generator"`) paired with local Python + `Pillow` deterministic pixel-art normalization, Agent Sprite Forge (`assemble_frames.py`), and sprite/atlas compilation (`packages/art-tools/build_assets.py`).
- **External Paid API Status**: No external paid API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, `FAL_KEY`, `ARK_API_KEY`, `PIXELLAB_API_KEY`) are configured, and per project rules no paid external API calls may be made without explicit owner authorization.
- **First Capability Proof Output**: `assets/concepts/capability_proof_phi_de.jpg` (depicting Phì Đế in black-and-gold dragon robes with floating bronze cauldron and golden dragon flame on `#FF00FF` chroma-key background) and Phase 0 `4x4` multi-pose grids in `assets/source_ai/`.
- **Limitations & Pipeline Observations**: Static `4x4` AI grids stripped via chroma-key and normalized to `80x96` frames pass technical audit checks (`TECHNICALLY_VERIFIED`), but exhibit static cell-to-cell garment/proportion variance and coexist with legacy `48x64` sprites and procedurally drawn tiles in `bat_hoang_tileset.png`. The overall in-game visual presentation remains **pending human creative review and approval**.

---

## 3. Reference Art Direction Candidates (Pending Human Approval)

> **Governance Correction:** Candidate A was previously marked `APPROVED & LOCKED` by an autonomous agent during Milestone A. Because the project owner has not accepted the current visual presentation quality as final, Candidate A is classified as **`TECHNICALLY_VERIFIED` / `PROPOSED` (Reference Direction Pending Renewed Human Approval)**.

| Candidate | File | Visual Direction | Technical & Lore Critique | Current Governance State |
|---|---|---|---|---|
| **Candidate A** | `assets/concepts/candidate_a_classic_xianxia.jpg` | **Classic Crisp 16/32-bit Xianxia Top-Down RPG**: Warm stone pathways, dark-slate curved roofs, emerald bamboo, warm lantern glow, 3-value shading, dark outlines, readable chibi-heroic proportions. | Strong value separation between walkable ground, collidable architecture/trees, and character silhouettes; supports both `Tân Thủ Thôn` and `Thanh Trúc Lâm`. | **`PROPOSED` / `TECHNICALLY_VERIFIED`** *(Reference direction pending human approval)* |
| **Candidate B** | `assets/concepts/candidate_b_dark_inkwash.jpg` | **Dark Ink-Wash Mythic Xianxia**: Monochrome grey/black ink with stark crimson accents. | Atmospheric for a late-game demonic dungeon (`Huyết Ma Động`), but poor readability for an inviting starter village and flattens Phì Đế's golden culinary motifs and ChatDVT's jade-cyan identity. | **`REJECTED`** *(Retained as historical evidence)* |
| **Candidate C** | `assets/concepts/candidate_c_pastel_chibi.jpg` | **Pastel Super-Deformed Chibi**: Ultra-bright candy pastel palette, soft low-contrast outlines, isometric toy-like proportions. | Lacks value contrast against gameplay VFX; undermines the majestic Saint Emperor presence of Tam Đế (`Phì Đế`, `RMT Đế`, `Vaal Đế`). | **`REJECTED`** *(Retained as historical evidence)* |

---

## 4. Verified Runtime Technical Specifications (Dual-Resolution Coexistence)

- **Logical World Grid**: `32x32` pixels per tile (`maps/tan_thu_thon.tmj` `40x30` tiles, `maps/thanh_truc_lam.tmj` `44x32` tiles).
- **Upgraded Phase 0 Multi-Pose Character Sprites (`hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu`)**:
  - **Logical Frame Size**: `80x96` pixels per frame.
  - **Runtime Spritesheet**: `480x1920` pixels (`6` columns × `20` rows: 5 animation states [`idle` 4f, `walk` 6f, `attack` 4f, `cast` 4f, `hurt` 4f] × 4 directions [`down`, `left`, `right`, `up`]).
  - **Shared Foot Anchor**: `(0.5, 0.9167)` (`x = 40, y = 88` in `80x96` frame), rendered at `scale = 0.82` in `apps/client/src/WorldScene.ts`.
  - **Exported Atlases**: `assets/atlases/<id>_atlas.png` + `assets/atlases/<id>_atlas.json` + per-frame PNGs in `assets/atlases/<id>/frames/`.
- **Preserved Legacy v1 Character & Creature Sprites (`chatdvt`, `merchant_truong`, `hoa_tran`, `truc_lang`, `thanh_lan_xa`, `rmt_de`, `vaal_de`, `anh_7`, `ngoc_tam`)**:
  - **Logical Frame Size**: `48x64` pixels per frame (preserved in `assets/sprites/` and backed up in `assets/sprites/legacy_v1/`).
  - **Runtime Spritesheet**: `288x1024` pixels (`6` columns × `16` rows: 4 animation states [`idle` 4f, `walk` 6f, `attack` 4f, `cast` 4f] × 4 directions [`down`, `left`, `right`, `up`]).
  - **Shared Foot Anchor**: `(0.5, 0.90)` (`x = 24, y = 58` in `48x64` frame), rendered at `scale = 1.0` in `apps/client/src/WorldScene.ts`.
  - **Unproduced Character Aliases (`PLACEHOLDER`)**: `thai_tai` currently aliases `hoa_tran` (`spriteKey: "hoa_tran"`, `portraitKey: "portrait_hoa_tran"`) and `gia_bao` currently aliases `hero_kiem_tu` (`spriteKey: "hero_kiem_tu"`, `portraitKey: "portrait_hero_kiem_tu"`) in `packages/game-data/src/index.ts`.
- **Combat & Environment VFX Sheets**:
  - `assets/vfx/combat_vfx.png`: `256x256` pixels (`64x64` frame, `4x4` grid from AI source `assets/source_ai/vfx_combat_4x4.png`, `TECHNICALLY_VERIFIED`).
  - `assets/vfx/portal_ring.png` & `assets/vfx/phi_de_blessing.png`: `256x64` pixels (`64x64` frame, `4x1` strip, `PLACEHOLDER` programmatically drawn art).
- **Portraits**: `160x160` RGBA PNG with transparent background and nearest-neighbor pixel clusters (`10` portraits currently on disk; `thai_tai` and `gia_bao` dedicated portraits pending).
- **Renderer Settings**: Phaser `4.2.1` with `pixelArt: true`, `antialias: false`, `roundPixels: true`, and `Phaser.Scale.RESIZE` viewport with integer-friendly camera zoom (`1.5x–2.0x` desktop, `1.25x` mobile).

## 5. Core World Reference Palette
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
