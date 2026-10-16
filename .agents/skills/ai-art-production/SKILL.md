---
name: ai-art-production
description: End-to-end generative AI art production, post-processing, Phaser/Tiled integration, provenance tracking, and human creative approval workflow for Tông Môn 8D. Use whenever planning, generating, upgrading, or validating characters, NPCs, monsters, buildings, tilesets, props, icons, UI art, VFX, or backgrounds.
---

# AI Art Production Workflow — Tông Môn 8D: Tu Tiên Chi Lộ

## Non-Negotiable Production Rules (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`)

1. **Genuine Generative Artwork via Argon Native `image-generator` Only**:
   All new final visual artwork (characters, NPCs, monsters, buildings, terrain/ground tiles, environmental props, trees/bamboo, item/skill icons, UI decorative frames, VFX source sheets, and backgrounds) MUST originate from the Argon host's built-in `image-generator` subagent or owner-supplied approved generative source artwork (`AGENTS.md` Section 4.1, `RULES.md` Rule 6).
   - Current verified capability status: `NATIVE_IMAGE_TOOL_DISCOVERED — END_TO_END_NOT_YET_VERIFIED`.
2. **No External API or CLI Media Providers**:
   Never invoke external paid image/video APIs (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `FAL_KEY`, `ARK_API_KEY`) or external media CLIs (`codex`, `grok`), **regardless of whether credentials are configured**. Never invoke `.agents/skills/generate2dmedia/scripts/route_media.py`, `generate_media.py`, `cli_media.py`, or `.agents/skills/video2dsprite/SKILL.md`.
3. **No Procedural / Geometric Replacement & Fail-Closed `BLOCKED` Rule**:
   Python, Pillow, Node.js, SVG, or Canvas drawing scripts (`ImageDraw`, `.agents/skills/codeart2d/SKILL.md`) may NEVER be used to synthesize final production artwork (`AGENTS.md` Section 4.2, `RULES.md` Rule 6). When native image generation is unavailable or fails, **return `BLOCKED` immediately** instead of inventing an output or falling back to code-drawn art.
4. **Separation of Technical Verification, Provenance Scope, and Human Approval**:
   Automated checks (`packages/art-tools/verify_manifest.ts`, `.agents/skills/pixel-art/scripts/quality_audit.py`) confer `TECHNICALLY_VERIFIED` status only (`RULES.md` Rule 6). Only the human project owner can grant `HUMAN_APPROVED` status after reviewing the asset at actual in-game zoom (`AGENTS.md` Section 5). Current `packages/art-tools/verify_manifest.ts` enforcement scope:
   - Existing character source SHA checks: implemented.
   - Asset dimensions/alpha/frame checks: implemented to current validator scope.
   - All provenance paths portable: not comprehensively enforced (some historical provenance fields contain machine-specific paths).
   - Provider/method allowlist: not yet implemented.
   - Future enforcement remains a separately approved tooling task.
5. **Prohibition on Whole-Command `packages/art-tools/build_assets.py` Execution**:
   Never execute `python packages/art-tools/build_assets.py` as a whole production asset generation/post-processing command, including with `--force` (`npm run generate:art` / `npm run generate:art:force`), because its `main()` invokes procedural `ImageDraw` tileset/VFX generation (`build_tileset()`, `build_vfx_and_contact_sheet()`) and rewrites Tiled maps and manifest/provenance files. Treat existing `packages/art-tools/build_assets.py` as legacy tooling requiring command-level audit/refactor before production execution. Only explicitly audited, non-generative post-processing commands may be invoked for approved production art.

---

## Compatible Installed Skills & Permitted Local Scripts (`docs/technical/AGENT_SKILL_ROUTER.md`)

Do not duplicate existing scripts; orchestrate only these approved workspace skills and local post-processing scripts:
- **Art Direction & Canon**: `.agents/skills/pixel-art-director/SKILL.md` (`docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`)
- **Read-Only Local Environment Diagnostics (Optional)**: `.agents/skills/generate2dmedia/scripts/forge_doctor.py` (`--host-tools image_gen --no-exec --json` only; never `route_media.py`)
- **Multi-Pose Sprite Slicing & Registration (Post-Processing Only)**: `.agents/skills/generate2dsprite/SKILL.md` (`.agents/skills/generate2dsprite/scripts/assemble_frames.py`, `.agents/skills/generate2dsprite/scripts/scale_frames.py`, `.agents/skills/generate2dsprite/scripts/palette_tool.py`, `.agents/skills/generate2dsprite/scripts/pixel_reduce.py`, `.agents/skills/generate2dsprite/scripts/sheet_qc.py`). *(Note: `packages/art-tools/build_assets.py` is legacy monolithic tooling requiring command-level audit/refactor before production execution and must never be invoked as a whole command.)*
- **Map & Tileset Post-Processing**: `.agents/skills/generate2dmap/SKILL.md` (`.agents/skills/generate2dmap/scripts/extract_prop_pack.py`, `.agents/skills/generate2dmap/scripts/extract_terrain_tiles.py`, `.agents/skills/generate2dmap/scripts/map_nav.py`, `.agents/skills/generate2dmap/scripts/compose_layered_preview.py`, `.agents/skills/generate2dmap/scripts/export_tiled.py`) and `.agents/skills/world-and-map-qa/SKILL.md`
- **Pixel Audit, Atlas Packing & GIF Previews**: `.agents/skills/pixel-art/SKILL.md` (`.agents/skills/pixel-art/scripts/quality_audit.py`, `.agents/skills/pixel-art/scripts/atlas_pack.py`, `.agents/skills/pixel-art/scripts/gif_export.py`, `.agents/skills/pixel-art/scripts/palette_extract.py`, `.agents/skills/pixel-art/scripts/palette_remap.py`)
- **Phaser 4 Integration**: `.agents/skills/phaser4-loading-assets/SKILL.md`, `.agents/skills/phaser4-sprites-and-images/SKILL.md`, `.agents/skills/phaser4-animations/SKILL.md`, `.agents/skills/phaser4-tilemaps/SKILL.md`
- **In-Game Visual Verification**: `.agents/skills/game-playtest/SKILL.md` (`tests/e2e/runPlaytest.ts`)

---

## 12-Step Production Workflow

### Step 1 — Read Approved Art Bible, Visual Contract, and Lore
- Inspect `AGENTS.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `docs/GAME_LORE.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, and `packages/game-data/src/index.ts`.
- Confirm canonical constraints: `dam_lon_tien_tu` realm is `UNKNOWN`, `chatdvt` is a jade-cyan quadruped spirit beast (`Linh Thú Thanh Ngọc`), `phi_de` is a black-and-gold culinary Saint Emperor with divine cauldron (`Cửu Long Thần Đỉnh`), and every legendary figure has a distinct silhouette, palette, and iconic prop.

### Step 2 — Define Required Artwork & Geometry
- Specify the exact asset ID, category (`portrait`, `character_spritesheet`, `creature_spritesheet`, `environment_prop`, `tileset`, `vfx_spritesheet`, `ui_art`), target logical resolution (`80x96` humanoid character frames in `480x1920` sheet, `160x160` portrait, `32x32` tile grid, `64x64` VFX cell), required animation rows/directions, and shared anchor (`(0.5, 0.9167)` / `(40, 88)` for `80x96` humanoid characters).
- Creature-specific asset geometry is allowed where appropriate: `chatdvt` is a quadruped and must be designed and animated with quadruped proportions and gait rather than forced into a humanoid template.
- Record the initial state as `PROPOSED`.

### Step 3 — Select Verified Source References
- Locate visual references and existing character portraits/sheets in `assets/portraits/`, `assets/source_ai/`, and `assets/concepts/` to maintain consistent lighting (`45°` top-left), outline weight, proportion scale, and color ramps across `Tân Thủ Thôn` and `Thanh Trúc Lâm`.
- Note that `Candidate A` (`assets/concepts/style_candidates/candidate_a_classic_xianxia.jpg`, `DEC-002`) is currently a `PROPOSED` visual reference (`PROPOSED` / `TECHNICALLY_VERIFIED`), not a fully `HUMAN_APPROVED` style lock. An art production proof must receive owner creative approval (`HUMAN_APPROVED`) before scaling asset production across all characters, maps, or items.

### Step 4 — Execute Real Generative Image Creation (Master Still + Native Pose Sheets)
- Invoke the Argon host's native `image-generator` subagent (`invoke_subagent` with `TypeName: "image-generator"`).
- Produce or lock a master reference still first, then generate controlled multi-pose directional locomotion (`down`, `left`, `right`, `up`) and combat/cast/hurt action sheets on clean solid chroma-key/ownership backing.
- Never call `route_media.py`, external APIs, external CLIs, or `video2dsprite`. If the Argon native `image-generator` is unavailable or fails, **return `BLOCKED` immediately**—never fall back to procedural drawing (`codeart2d`).

### Step 5 — Preserve the Raw Source Image
- Save unmodified raw generative outputs directly under `assets/source_ai/<asset_stem>.png` (or `assets/concepts/` for concept boards).
- Compute and record the exact SHA-256 digest of every raw source file so deterministic re-packaging remains reproducible across workspaces.

### Step 6 — Validate Art Direction and Consistency
- Before running batch assembly, visually inspect the raw generated output against `docs/ART_BIBLE.md` and `docs/CHARACTER_VISUAL_BIBLE.md`:
  - Does the silhouette read clearly at `1x` gameplay zoom?
  - Are directional views (`down`, `left`, `right`, `up`) genuine front, profile, and rear/back depictions rather than flat horizontal flips of asymmetric props?
  - Are canonical motifs (cauldron, seven swords, lotus, `chatdvt` jade-cyan quadruped beast anatomy, etc.) faithful?

### Step 7 — Process the Source into Production Assets
- Run only explicitly audited, non-generative local post-processing scripts (`.agents/skills/generate2dsprite/scripts/assemble_frames.py` with `--slice ownership`, `.agents/skills/generate2dsprite/scripts/scale_frames.py`, `.agents/skills/generate2dsprite/scripts/palette_tool.py`, `.agents/skills/generate2dsprite/scripts/pixel_reduce.py`, chroma spill suppression, binary alpha thresholding `alpha >= 96 -> 255`, standing height-lock registration onto the logical frame canvas, octree palette quantization, and isolated orphan-pixel pruning).
- **Never** execute `python packages/art-tools/build_assets.py` as a whole production asset generation/post-processing command, including with `--force`; treat existing `packages/art-tools/build_assets.py` as legacy tooling requiring command-level audit/refactor before production execution.
- Preserve any replaced legacy asset under `assets/sprites/legacy_v1/` before writing the new runtime file.

### Step 8 — Produce Animations, Atlas, or Tileset as Required
- Compile the runtime spritesheet (`assets/sprites/<id>.png`, `480x1920` for 5-state `80x96` humanoid characters or approved creature sheet geometry), packed atlas (`assets/atlases/<id>_atlas.png` + `.json` via `.agents/skills/pixel-art/scripts/atlas_pack.py`), animated GIF previews (`assets/previews/<id>_*.gif` via `.agents/skills/pixel-art/scripts/gif_export.py`), and before/after comparison sheets (`assets/previews/<id>_before_after.png`).
- For environment art, assemble `32x32` tilesets (`assets/tilesets/`) or prop PNGs (`assets/props/`) from genuine generated environment sources using `.agents/skills/generate2dmap/scripts/extract_terrain_tiles.py` and `.agents/skills/generate2dmap/scripts/extract_prop_pack.py`.

### Step 9 — Integrate into Phaser 4 / Tiled
- Register the asset key, frame dimensions, anchor origin, and animation rows in `apps/client/src/WorldScene.ts` and `apps/client/src/hud.ts` (or Tiled `.tmj` maps in `maps/tan_thu_thon.tmj` and `maps/thanh_truc_lam.tmj`), ensuring backward compatibility with any remaining legacy `48x64` entities and proper Y-sorted depth occlusion (`AbovePlayer` vs foot collider).

### Step 10 — Verify Visually in the Running Game
- Run `npm run verify:assets` (`packages/art-tools/verify_manifest.ts`), `.agents/skills/pixel-art/scripts/quality_audit.py`, and `.agents/skills/generate2dsprite/scripts/sheet_qc.py`.
- Launch the game and capture real in-engine screenshots at `1280x720` desktop and `390x844` mobile viewports (`tests/e2e/runPlaytest.ts` writing to `artifacts/playtest/runs/<run-id>/`) showing idle, walk, combat/cast animations, and world contrast against surrounding tiles.

### Step 11 — Record Portable Provenance
- Update `assets/manifest.json` and `assets/provenance.json` using **portable relative repository paths only** (never machine-specific `/Users/...` or `C:\Users\...` paths). Note that while new provenance entries must follow this rule by instruction, `packages/art-tools/verify_manifest.ts` does not yet comprehensively enforce portable relative paths across all provenance fields or a generation-provider/method allowlist (which remain a separately approved future tooling task).
- Record `generationProvider`, `generationMethod`, `sourceReferenceImage`, `sourceAiFiles` (with `sha256`), `postProcessingSteps`, `exportedSpritesheet`, `previewGifs`, `beforeAfterSheet`, and `validationResults`.
- Set the creative governance state to `TECHNICALLY_VERIFIED`.

### Step 12 — Obtain Human Approval
- Present the raw source sheet, before/after comparison sheet, animated GIF previews, and in-game screenshots to the human project owner.
- Remember that `Candidate A` (`DEC-002`) is currently a `PROPOSED` visual reference and an initial art production proof must receive explicit owner creative approval (`HUMAN_APPROVED`) before scaling production across characters, tilesets, props, or UI.
- Only after the project owner explicitly approves an asset or visual direction in conversation may its governance state be promoted from `TECHNICALLY_VERIFIED` / `PROPOSED` to `HUMAN_APPROVED` in the Human Creative Decisions Ledger (`AGENTS.md` Section 5 / `docs/ART_BIBLE.md`).
