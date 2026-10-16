---
name: ai-art-production
description: End-to-end generative AI art production, post-processing, Phaser/Tiled integration, provenance tracking, and human creative approval workflow for Tông Môn 8D. Use whenever planning, generating, upgrading, or validating characters, NPCs, monsters, buildings, tilesets, props, icons, UI art, VFX, or backgrounds.
---

# AI Art Production Workflow — Tông Môn 8D: Tu Tiên Chi Lộ

## Non-Negotiable Production Rules

1. **Genuine Generative Artwork Only**:
   All new final visual artwork (characters, NPCs, monsters, buildings, terrain/ground tiles, environmental props, trees/bamboo, item/skill icons, UI decorative frames, VFX source sheets, and backgrounds) MUST originate from genuine generative image model output or approved AI-generated source artwork.
2. **No Procedural / Geometric Replacement**:
   Python, Pillow, Node.js, SVG, or Canvas drawing scripts (`ImageDraw`, `codeart2d`) may NEVER be used to synthesize final production artwork. There is **no automatic fallback** to procedural art if an image generator route is unavailable.
3. **No Unauthorized Paid API Calls**:
   Never invoke paid external image or video providers (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, `FAL_KEY`, `ARK_API_KEY`) without explicit authorization from the human project owner. Use the host environment's authorized native `image-generator` subagent or owner-authorized `generate2dmedia` routes.
4. **Separation of Technical Verification and Human Approval**:
   Automated checks (`verify_manifest.ts`, `quality_audit.py`) confer `TECHNICALLY_VERIFIED` status only. Only the human project owner can grant `HUMAN_APPROVED` status after reviewing the asset at actual in-game zoom.

---

## Compatible Installed Skills to Orchestrate

Do not duplicate existing scripts; invoke and combine these installed workspace skills at the appropriate stage:
- **Art Direction & Canon**: `.agents/skills/pixel-art-director/SKILL.md` (`docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`)
- **Capability & Route Check**: `.agents/skills/generate2dmedia/SKILL.md` (`scripts/forge_doctor.py`, `scripts/route_media.py`)
- **Multi-Pose Sprite Slicing & Registration**: `.agents/skills/generate2dsprite/SKILL.md` (`scripts/assemble_frames.py`, `scripts/ownership_pipeline.py`)
- **Video-to-Sprite (When Authorized)**: `.agents/skills/video2dsprite/SKILL.md` (`scripts/video2dsprite.py`, `scripts/register_clip.py`)
- **Map & Tileset Planning**: `.agents/skills/generate2dmap/SKILL.md` and `.agents/skills/world-and-map-qa/SKILL.md`
- **Pixel Audit, Atlas Packing & GIF Previews**: `.agents/skills/pixel-art/SKILL.md` (`scripts/quality_audit.py`, `scripts/atlas_pack.py`, `scripts/gif_export.py`)
- **Phaser 4 Integration**: `.agents/skills/phaser4-loading-assets/SKILL.md`, `.agents/skills/phaser4-sprites-and-images/SKILL.md`, `.agents/skills/phaser4-animations/SKILL.md`, `.agents/skills/phaser4-tilemaps/SKILL.md`
- **In-Game Visual Verification**: `.agents/skills/game-playtest/SKILL.md`

---

## 12-Step Production Workflow

### Step 1 — Read Approved Art Bible and Lore
- Inspect `AGENTS.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `docs/GAME_LORE.md` (when authored), and `packages/game-data/src/index.ts`.
- Confirm canonical constraints: e.g., `dam_lon_tien_tu` realm is `UNKNOWN`, `chatdvt` is a jade-cyan quadruped spirit beast, `phi_de` is a black-and-gold culinary Saint Emperor with divine cauldron (`Cửu Long Thần Đỉnh`), and every legendary figure has a distinct silhouette, palette, and iconic prop.

### Step 2 — Define Required Artwork
- Specify the exact asset ID, category (`portrait`, `character_spritesheet`, `creature_spritesheet`, `environment_prop`, `tileset`, `vfx_spritesheet`, `ui_art`), target logical resolution (`80x96` character frames in `480x1920` sheet, `160x160` portrait, `32x32` tile grid, `64x64` VFX cell), required animation rows/directions, and shared anchor (`(0.5, 0.9167)` / `(40, 88)` for `80x96` characters).
- Record the initial state as `PROPOSED`.

### Step 3 — Select Verified Source References
- Locate approved style references and existing character portraits/sheets in `assets/portraits/`, `assets/source_ai/`, and `assets/concepts/` to maintain consistent lighting (`45°` top-left), outline weight, proportion scale, and color ramps across `Tân Thủ Thôn` and `Thanh Trúc Lâm`.

### Step 4 — Execute Real Generative Image Creation
- Verify available generation routes via `generate2dmedia` (`forge_doctor.py`) or invoke the host's native `image-generator` subagent.
- For characters/creatures, generate controlled multi-pose grids (`4x4` directional locomotion + `4x4` combat/cast/hurt action sheets on clean solid chroma-key backing) or owner-authorized image-to-video clips anchored to an approved master still.
- If no authorized generative route is available, **STOP and report to the user**—never fall back to procedural drawing.

### Step 5 — Preserve the Raw Source Image
- Save unmodified raw generative outputs directly under `assets/source_ai/<asset_stem>.png` (or `assets/concepts/` for concept boards).
- Compute and record the exact SHA-256 digest of every raw source file so deterministic re-packaging remains reproducible across workspaces.

### Step 6 — Validate Art Direction and Consistency
- Before running batch assembly, visually inspect the raw generated output against `docs/ART_BIBLE.md` and `docs/CHARACTER_VISUAL_BIBLE.md`:
  - Does the silhouette read clearly at `1x` gameplay zoom?
  - Are directional views (`down`, `left`, `right`, `up`) genuine front, profile, and rear/back depictions rather than flat horizontal flips of asymmetric props?
  - Are canonical motifs (cauldron, seven swords, lotus, jade-cyan beast anatomy, etc.) faithful?

### Step 7 — Process the Source into Production Assets
- Run deterministic post-processing scripts (`generate2dsprite/scripts/assemble_frames.py` with connected-component ownership slicing, chroma spill suppression, binary alpha thresholding `alpha >= 96 -> 255`, standing height-lock registration onto the logical frame canvas, octree palette quantization, and isolated orphan-pixel pruning).
- Preserve any replaced legacy asset under `assets/sprites/legacy_v1/` before writing the new runtime file.

### Step 8 — Produce Animations, Atlas, or Tileset as Required
- Compile the runtime spritesheet (`assets/sprites/<id>.png`, `480x1920` for 5-state `80x96` characters), packed atlas (`assets/atlases/<id>_atlas.png` + `.json` via `pixel-art/scripts/atlas_pack.py`), animated GIF previews (`assets/previews/<id>_*.gif` via `pixel-art/scripts/gif_export.py`), and before/after comparison sheets (`assets/previews/<id>_before_after.png`).
- For environment art, assemble `32x32` tilesets (`assets/tilesets/`) or prop PNGs (`assets/props/`) from genuine generated environment sources.

### Step 9 — Integrate into Phaser 4 / Tiled
- Register the asset key, frame dimensions, anchor origin, and animation rows in `apps/client/src/WorldScene.ts` (or Tiled `.tmj` maps in `maps/`), ensuring backward compatibility with any remaining legacy `48x64` entities and proper Y-sorted depth occlusion (`AbovePlayer` vs foot collider).

### Step 10 — Verify Visually in the Running Game
- Run `npm run verify:assets` and `pixel-art/scripts/quality_audit.py`.
- Launch the game and capture real in-engine screenshots at `1280x720` desktop and `390x844` mobile viewports (`game-playtest`) showing idle, walk, combat/cast animations, and world contrast against surrounding tiles.

### Step 11 — Record Portable Provenance
- Update `assets/manifest.json` and `assets/provenance.json` using **portable relative repository paths only** (never machine-specific `/Users/...` or `C:\Users\...` paths).
- Record `generationProvider`, `generationMethod`, `sourceReferenceImage`, `sourceAiFiles` (with `sha256`), `postProcessingSteps`, `exportedSpritesheet`, `previewGifs`, `beforeAfterSheet`, and `validationResults`.
- Set the creative governance state to `TECHNICALLY_VERIFIED`.

### Step 12 — Obtain Human Approval
- Present the raw source sheet, before/after comparison sheet, animated GIF previews, and in-game screenshots to the human project owner.
- Only after the project owner explicitly approves the asset in conversation may its governance state be promoted from `TECHNICALLY_VERIFIED` to `HUMAN_APPROVED` in the Human Creative Decisions Ledger (`AGENTS.md` / `docs/ART_BIBLE.md`).
