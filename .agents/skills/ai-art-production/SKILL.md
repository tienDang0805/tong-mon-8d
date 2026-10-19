---
name: ai-art-production
description: End-to-end generative AI art production, post-processing, Phaser/Tiled integration, provenance tracking, and human creative approval workflow for Tông Môn 8D. Use whenever planning, generating, upgrading, or validating characters, NPCs, monsters, buildings, tilesets, props, icons, UI art, VFX, or backgrounds.
---

# AI Art Production Workflow — Tông Môn 8D: Tu Tiên Chi Lộ

## Non-Negotiable Production Rules (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`)

1. **Genuine Generative Artwork via Argon Native `image-generator` Only**:
   All new final visual artwork (characters, NPCs, monsters, buildings, terrain/ground tiles, environmental props, trees/bamboo, item/skill icons, UI decorative frames, VFX source sheets, and backgrounds) MUST originate from the Argon host's built-in `image-generator` subagent with exact Core Kit reference images attached, or from owner-supplied approved generative source artwork (`AGENTS.md` Section 4.1, `RULES.md` Rule 6).
   - Current verified capability status: `NATIVE_IMAGE_TOOL_VERIFIED_IN_HOST` (`image-generator` subagent verified across `VISUAL-01`, `VISUAL-02A/B`, and `HERO-ANIMSET-01`).
2. **No External API or CLI Media Providers**:
   Never invoke external paid image/video APIs (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `FAL_KEY`, `ARK_API_KEY`) or external media CLIs (`codex`, `grok`), **regardless of whether credentials are configured**. Never invoke `.agents/skills/generate2dmedia/scripts/route_media.py`, `generate_media.py`, `cli_media.py`, or `.agents/skills/video2dsprite/SKILL.md`.
3. **No Procedural / Geometric Replacement & Fail-Closed `BLOCKED` Rule**:
   Python, Pillow, Node.js, SVG, or Canvas drawing scripts (`ImageDraw`, `.agents/skills/codeart2d/SKILL.md`) may NEVER be used to synthesize final production artwork (`AGENTS.md` Section 4.2, `RULES.md` Rule 6). When native image generation is unavailable or fails after bounded transient retries, **return `BLOCKED` immediately** instead of inventing an output or falling back to code-drawn art.
4. **Separation of Role vs. Creative Approval & Pure Core Kit Validator Scope**:
   Automated checks (`packages/art-tools/verify_manifest.ts` + `packages/art-tools/corekit/validateCorekit.ts`, `.agents/skills/pixel-art/scripts/quality_audit.py`) confer `TECHNICALLY_VERIFIED` status only (`RULES.md` Rule 6). Only the human project owner can grant `HUMAN_APPROVED` status (`AGENTS.md` Section 5). Asset `role` (`master_reference`, `production_candidate`, `runtime`, `legacy_required`, `archive_only`) is tracked separately from `creativeApprovalState` (`PROPOSED`, `TECHNICALLY_VERIFIED`, `HUMAN_APPROVED`, `REJECTED`, `PLACEHOLDER`). Current `verify_manifest.ts` + `validateCorekit.ts` enforcement scope:
   - Enforces `assets/corekit/v01b/catalog.json` active master uniqueness, SHA-256 digests, portable repository paths, symlink/traversal containment, approval metadata, profile geometry projection (`apps/client/src/game/assets/runtimeAnimationProjection.json`), Tiled `.tmj` image dependency closure, and native provider/method allowlists for new production entries (`argon_native_image_generator`).
   - Note that a JSON provider declaration is structural provenance metadata, not cryptographic proof of pixel origin or automated aesthetic judgment.
5. **Disabled Procedural Generator Entrypoints (`build_assets.py` / `generate:art*`)**:
   Both `npm run generate:art` / `npm run generate:art:force` and `python packages/art-tools/build_assets.py` (with or without `--force`) are permanently disabled fail-closed entrypoints (`exit code 2` before any filesystem write). The historical Phase 0 script is preserved as non-executable historical provenance at `packages/art-tools/legacy/build_assets.py` and must never be executed.

---

## Compatible Installed Skills & Permitted Local Scripts (`docs/technical/AGENT_SKILL_ROUTER.md`)

Do not duplicate existing scripts; orchestrate only these approved workspace skills and local post-processing scripts:
- **Art Direction & Canon**: `.agents/skills/pixel-art-director/SKILL.md` (`assets/corekit/v01b/catalog.json`, `assets/corekit/v01b/COREKIT_INDEX.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`)
- **Read-Only Local Environment Diagnostics (Optional)**: `.agents/skills/generate2dmedia/scripts/forge_doctor.py` (`--host-tools image_gen --no-exec --json` only; never `route_media.py`)
- **Multi-Pose Sprite Slicing & Registration (Post-Processing Only)**: `.agents/skills/generate2dsprite/SKILL.md` (`.agents/skills/generate2dsprite/scripts/assemble_frames.py`, `.agents/skills/generate2dsprite/scripts/scale_frames.py`, `.agents/skills/generate2dsprite/scripts/palette_tool.py`, `.agents/skills/generate2dsprite/scripts/pixel_reduce.py`, `.agents/skills/generate2dsprite/scripts/sheet_qc.py`). *(Never invoke `packages/art-tools/build_assets.py` or `packages/art-tools/legacy/build_assets.py`.)*
- **Map & Tileset Post-Processing**: `.agents/skills/generate2dmap/SKILL.md` (`.agents/skills/generate2dmap/scripts/extract_prop_pack.py`, `.agents/skills/generate2dmap/scripts/extract_terrain_tiles.py`, `.agents/skills/generate2dmap/scripts/map_nav.py`, `.agents/skills/generate2dmap/scripts/compose_layered_preview.py`, `.agents/skills/generate2dmap/scripts/export_tiled.py`) and `.agents/skills/world-and-map-qa/SKILL.md`
- **Pixel Audit, Atlas Packing & GIF Previews**: `.agents/skills/pixel-art/SKILL.md` (`.agents/skills/pixel-art/scripts/quality_audit.py`, `.agents/skills/pixel-art/scripts/atlas_pack.py`, `.agents/skills/pixel-art/scripts/gif_export.py`, `.agents/skills/pixel-art/scripts/palette_extract.py`, `.agents/skills/pixel-art/scripts/palette_remap.py`)
- **Phaser 4 Integration**: `.agents/skills/phaser4-loading-assets/SKILL.md`, `.agents/skills/phaser4-sprites-and-images/SKILL.md`, `.agents/skills/phaser4-animations/SKILL.md`, `.agents/skills/phaser4-tilemaps/SKILL.md`
- **In-Game Visual Verification**: `.agents/skills/game-playtest/SKILL.md` (`tests/e2e/runPlaytest.ts`, `tests/e2e/runArchFoundationVerification.ts`)

---

## 12-Step Production Workflow (`Core Kit Resolution -> Native Genimage -> Deterministic Post-Processing -> QA -> Owner Decision`)

### Step 1 — Resolve Core Kit Catalog, Art Bible, Visual Contract, and Lore
- Inspect `assets/corekit/v01b/catalog.json`, `assets/corekit/v01b/COREKIT_INDEX.md`, `AGENTS.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `docs/GAME_LORE.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, and `packages/game-data/src/index.ts`.
- Confirm canonical identity locks (`DEC-006`..`DEC-009`):
  - **Style Direction**: `V01-B — THIÊN MỆNH TIÊN CUNG (Three-Tier Progression Grandeur)` with `Tân Thủ Thôn` grounded at Tier I (`v01b.style.thien_menh_tien_cung` @ `1.0.0`, `DEC-006`, `DEC-007`).
  - **`hero_kiem_tu` (`Thanh Vân Đạo Đồ`)**: Owner-approved current Desktop `HERO-ANIMSET-01` master (`v01b.char.hero_kiem_tu` @ `2.0.0-hero-animset-01`, `DEC-009`: dark-brown high ponytail with teal-jade tie, no jade crown, white inner sleeves under sleeveless teal-jade outer vest with gold trim, `source_h04`..`source_h10` lineage; supersedes the old kit Hero and `source_h01`/`source_h02`).
  - **`phi_de` (`Phì Đế`)**: Owner-corrected chubby/round-bellied saintly mascot cultivator wearing a fluffy cream bear-head hood (`Mũ Gấu Tiên Thánh`) with round bear ears, rectangular glasses, white-jade/celadon luxury saint robes with imperial-gold trim, holding a golden boiled chicken drumstick (`Đùi Gà Luộc`, no tea/broth cup, `v01b.npc.phi_de` @ `2.0.0-bear-hood-chicken`, `DEC-008` — never the rejected black-and-gold emperor crown/beard version).
  - **`rmt_de` (`RMT Đế`)**: Owner-corrected crimson-red and imperial-gold `Thần Tài` wealth-god sovereign wearing a winged official hat (`Mão Thần Tài Cánh Chuồn`), holding a boat-shaped gold sycee ingot (`Kim Nguyên Bảo`) and golden abacus (`Bàn Tính Hoàng Kim`, `v01b.npc.rmt_de` @ `2.0.0-than-tai`, `DEC-008`).
  - **`chatdvt`**: Jade-cyan quadruped spirit beast (`Linh Thú Thanh Ngọc`, `v01b.creature.chatdvt` @ `1.0.0`), never human/bipedal.
  - **`dam_lon_tien_tu`**: Realm MUST remain `UNKNOWN` (`Bất Minh`, `v01b.npc.dam_lon_tien_tu` @ `1.0.0`).

### Step 2 — Define Concrete Production Brief with Master & Profile IDs
- Specify the exact asset ID, category, target `profileId` from `assets/corekit/v01b/profiles/{animation,ui-tokens,world-art}.json` (`full_80x96_20row`, `full_80x96_20row_8walk`, `locomotion_80x96_8row`, `stationary_npc_80x96_4f`, or preserved `legacy_48x64_16row`), and exact active `referenceId@version` from `assets/corekit/v01b/catalog.json`.
- Record the initial role as `production_candidate` and creative approval state as `PROPOSED`.

### Step 3 — Resolve Active Visual Masters Strictly via `assets/corekit/v01b/catalog.json`
- Resolve all visual master references exclusively through `assets/corekit/v01b/catalog.json` (`activeReferences`, requiring `creativeApprovalState: "HUMAN_APPROVED"`).
- **Never** free-browse `assets/archive/history/concepts/`, `assets/archive/history/`, or arbitrary `assets/source_ai/` files as active masters.
- **Never** select `assets/archive/history/**`, `archive_pre_correction`, `OLD (REJECTED)` comparison board panes, `source_h01`/`source_h02`, or historical `Candidate A` (`candidate_a_classic_xianxia.jpg`) as an active master reference.

### Step 4 — Execute Real Generative Image Creation (Host Built-in `image-generator` Only)
- Invoke the Argon host's native `image-generator` subagent (`invoke_subagent` with `TypeName: "image-generator"`), attaching the exact resolved Core Kit master reference images from `assets/corekit/v01b/references/**`.
- Produce controlled multi-pose directional locomotion (`down`, `left`, `right`, `up`) and combat/cast/hurt action sheets on clean solid chroma-key/ownership backing. Never fake multi-frame motion by applying affine warps, stretches, or shears to a single static frame.
- Never call `route_media.py`, external APIs, external CLIs, or `video2dsprite`. If the Argon native `image-generator` is unavailable or fails after bounded transient retries, **return `BLOCKED` immediately**—never fall back to procedural drawing (`codeart2d` or `ImageDraw`).

### Step 5 — Preserve Raw Source Image & Native Tool Evidence
- Save unmodified raw generative outputs directly under `assets/source_ai/<asset_stem>.png`.
- Record the exact SHA-256 digest, `generationProvider: "argon_native_image_generator"`, `generationMethod: "native_image_generator_subagent"`, native subagent conversation/trace evidence, and referenced `referenceId@version` in `assets/provenance.json`.

### Step 6 — Validate Art Direction and Identity Consistency
- Visually inspect the raw generated output against the resolved Core Kit master reference in `assets/corekit/v01b/references/**`, `docs/ART_BIBLE.md`, and `docs/CHARACTER_VISUAL_BIBLE.md`:
  - Does the silhouette read clearly at `1x` gameplay zoom?
  - Are directional views (`down`, `left`, `right`, `up`) genuine front, profile, and rear/back depictions?
  - Does the character match the exact locked identity in `assets/corekit/v01b/catalog.json`?

### Step 7 — Process the Source into Production Assets (Deterministic Non-Generative Post-Processing Only)
- Run only explicitly audited, non-generative local post-processing scripts (`.agents/skills/generate2dsprite/scripts/assemble_frames.py`, `.agents/skills/generate2dsprite/scripts/scale_frames.py`, `.agents/skills/generate2dsprite/scripts/palette_tool.py`, `.agents/skills/generate2dsprite/scripts/pixel_reduce.py`, chroma spill suppression, binary alpha thresholding, standing height-lock registration onto the logical frame canvas, palette normalization, and isolated orphan-pixel pruning).
- **Never** execute `packages/art-tools/build_assets.py` or `packages/art-tools/legacy/build_assets.py`.
- Archive any unique superseded asset into `assets/archive/history/` with `role: "archive_only"` and `cannotBeUsedAsActiveMaster: true` in `assets/archive/history/archive_manifest.json`.

### Step 8 — Produce Animations, Atlas, or Tileset as Required
- Compile the runtime spritesheet (`assets/sprites/<id>.png`), packed atlas (`assets/atlases/<id>_atlas.png` + `.json`), and animated GIF previews (`assets/previews/<id>_*.gif`).
- For environment art, assemble `32x32` tilesets (`assets/tilesets/`) or prop PNGs (`assets/props/`) from genuine generated environment sources.

### Step 9 — Integrate into Phaser 4 / Tiled via Modular Asset Seams
- Register or update bindings in `apps/client/src/game/assets/RuntimeAssetBindings.ts`, `apps/client/src/game/assets/SpriteProfiles.ts` (backed by `apps/client/src/game/assets/runtimeAnimationProjection.json` compiled from `assets/corekit/v01b/profiles/animation.json`), and `apps/client/src/game/combat/AnimationRegistry.ts`, or Tiled `.tmj` maps (`maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`).

### Step 10 — Verify Visually in the Running Game
- Run `npm run verify:assets` (`packages/art-tools/verify_manifest.ts` + `packages/art-tools/corekit/validateCorekit.ts`), `.agents/skills/pixel-art/scripts/quality_audit.py`, and `.agents/skills/generate2dsprite/scripts/sheet_qc.py`.
- Launch the isolated runtime verification (`tests/e2e/runArchFoundationVerification.ts` or `tests/e2e/runPlaytest.ts`) and verify desktop (`1280x720`) and mobile (`390x844`) rendering with zero missing textures or HTTP 404s.

### Step 11 — Record Portable Provenance & Role/Approval Separation
- Update `assets/manifest.json` and `assets/provenance.json` using **portable relative repository paths only**.
- Set `role: "runtime"` and `creativeApprovalState: "TECHNICALLY_VERIFIED"` (never self-promote a newly generated runtime asset to `HUMAN_APPROVED` without explicit owner sign-off).

### Step 12 — Obtain Human Approval
- Present the raw source sheet, comparison sheet, animated GIF previews, and in-game screenshots to the human project owner.
- Only after the project owner explicitly approves an asset or visual reference in conversation may its `creativeApprovalState` be promoted to `HUMAN_APPROVED` in `assets/corekit/v01b/catalog.json`, `assets/manifest.json`, `AGENTS.md` Section 5, and `docs/ART_BIBLE.md`.
