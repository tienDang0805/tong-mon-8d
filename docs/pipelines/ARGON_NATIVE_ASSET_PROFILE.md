# Argon Native Asset Production Profile — Tông Môn 8D

> Status: `COMMITTED` (`G0`: `39d71c0`; Updated in `CTX-1` at Base Commit `b04ebdc72ffede9edb678008ed30d002c73b5cc6`) | Capability Status: `NATIVE_IMAGE_TOOL_DISCOVERED — END_TO_END_NOT_YET_VERIFIED` | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Capability Status, Style Reference State & Scope

- **Current Verified Capability State**: `NATIVE_IMAGE_TOOL_DISCOVERED — END_TO_END_NOT_YET_VERIFIED`
- During the `G0` audit, the Argon host's built-in `image-generator` subagent (`invoke_subagent` with `TypeName: "image-generator"`) and the local `.venv` Python post-processing environment (`Python 3.12.10`, `Pillow 12.3.0`, `numpy 2.5.4`, `scipy 1.18.1`) were verified as present on disk, while `ffmpeg` and `resvg-py` were confirmed absent.
- Because `G0` was a read-only governance and routing gate, an end-to-end production asset generation run has **not** been executed in `G0`. The first live end-to-end pipeline proof under this profile will be executed only in a separately approved task.
- **`Candidate A` Visual Reference Status (`DEC-002` in `AGENTS.md`)**: `Candidate A` (`assets/concepts/candidate_a_classic_xianxia.jpg`) is currently a **`PROPOSED` visual reference** (`PROPOSED` / `TECHNICALLY_VERIFIED`), **not** a fully `HUMAN_APPROVED` style lock. Any initial art production proof must receive explicit owner creative approval (`HUMAN_APPROVED`) before scaling asset production across characters, zones, or catalogs.

---

## 2. Non-Negotiable Generation & Routing Policy

1. **Authorized Native Generation Only**:
   - All new final visual artwork (`assets/source_ai/*.png` and `assets/concepts/*.png`) MUST originate from the Argon host's built-in `image-generator` subagent or owner-supplied approved generative source files (`AGENTS.md` Section 4.1, `RULES.md` Rule 6).
2. **Absolute Ban on External API & CLI Media Providers**:
   - External paid API providers (`OpenAI`, `Google Gemini`, `xAI`, `BytePlus ModelArk`, `fal.ai`) and external CLI media tools (`codex`, `grok`) are **strictly forbidden** for production asset generation, **regardless of whether API keys or CLI credentials are configured** in the environment or `%APPDATA%\agent-sprite-forge\config.json`.
   - The third-party skill rule *"A configured key is the owner's standing consent"* in `.agents/skills/generate2dmedia/SKILL.md` and `.agents/skills/generate2dsprite/SKILL.md` is **explicitly overridden and nullified** by `AGENTS.md` Section 4.4.
3. **Prohibited Scripts, Legacy Monolithic Tooling & Skills**:
   - Never invoke `.agents/skills/generate2dmedia/scripts/route_media.py`, `generate_media.py`, `cli_media.py`, `media_config.py`, or `media_providers.py`.
   - Never invoke `.agents/skills/video2dsprite/SKILL.md` or any `.agents/skills/video2dsprite/scripts/*.py` script.
   - Never invoke `.agents/skills/codeart2d/SKILL.md` or any `.agents/skills/codeart2d/scripts/*.py` script for final production artwork, and never allow automatic fallback to procedural/code-drawn art (`AGENTS.md` Section 4.2, `RULES.md` Rule 6).
   - **Never execute `python packages/art-tools/build_assets.py` as a whole production asset generation/post-processing command, including with `--force` (`npm run generate:art` / `npm run generate:art:force`).** `packages/art-tools/build_assets.py` is **not** a post-processing-only script: its `main()` invokes `build_portraits_and_sprites()`, `build_tileset()`, `build_vfx_and_contact_sheet()`, and `build_tiled_maps()`, rewrites `assets/manifest.json` and `assets/provenance.json`, and contains procedural `PIL.ImageDraw` tileset/VFX generation (`make_tile`, ellipses). Treat `packages/art-tools/build_assets.py` as **legacy tooling requiring command-level audit/refactor before production execution**. Only explicitly audited, non-generative post-processing commands may be invoked for approved production art.
4. **Fail-Closed `BLOCKED` Behavior**:
   - When the Argon native `image-generator` subagent is unavailable, errors, or fails art-direction validation after bounded retries, the agent MUST immediately halt the art task and return `BLOCKED` rather than inventing procedural replacements or calling external media routes.

---

## 3. Master Still + Native Directional Pose Sheets Workflow

Because `video2dsprite` and external image-to-video APIs are disabled, Tông Môn 8D produces all character, creature, NPC, prop, tile, UI, and VFX assets through a deterministic **Master Still + Native Directional Pose Grid + Audited Non-Generative Post-Processing** pipeline:

1. **Stage 1 — Art Brief & Visual Binding Contract (`TD-05`)**:
   - Author the asset brief and `VisualBindingDef` following `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/CONTENT_ART_BRIEF_TEMPLATE.md`, `docs/ART_BIBLE.md`, and `docs/CHARACTER_VISUAL_BIBLE.md`.
   - Record initial creative status as `PROPOSED`.
2. **Stage 2 — Master Still Generation (Identity & Palette Anchor)**:
   - Invoke the Argon native `image-generator` subagent to produce or refine the character/creature/object master reference still aligned with the `Candidate A` xianxia pixel-art reference direction (`PROPOSED` visual reference in `DEC-002`; `45°` top-left warm sunlight, crisp dark-umbral/indigo-charcoal pixel outlines, high-contrast solid chroma/ownership backing).
3. **Stage 3 — Native Directional Pose Sheets & Creature-Specific Geometry**:
   - Generate multi-pose directional locomotion (`down`, `left`, `right`, `up`) and combat/cast/hurt action grids via the native `image-generator` subagent, saving unmodified raw outputs directly under `assets/source_ai/` with recorded SHA-256 checksums.
   - **Humanoid Standard**: `80x96` logical frame canvas packed into `480x1920` runtime sheets (`6` columns × `20` rows, bottom-center foot anchor `(0.5, 0.9167)` / `(40, 88)`), while preserving legacy `48x64` (`288x1024`, `6` columns × `16` rows, anchor `(0.5, 0.90)` / `(24, 58)`) compatibility (`RULES.md` Rule 5).
   - **Creature-Specific Geometry (`chatdvt` & Non-Humanoid Beasts)**: Creature-specific frame geometry, bounding boxes, and locomotion pose layouts are explicitly permitted where appropriate. In particular, **`chatdvt` (`Linh Thú Thanh Ngọc`) is a jade-cyan quadruped spirit beast** (`AGENTS.md` Section 3, `RULES.md` Rule 2) and MUST be generated and animated with authentic quadruped anatomy and gait—never forced into a humanoid bipedal template.
4. **Stage 4 — Audited Non-Generative Local Post-Processing & Packaging**:
   - Invoke **only** explicitly audited, non-generative local Python/Pillow post-processing and packaging commands (`AGENTS.md` Section 4.3):
     - `.agents/skills/generate2dsprite/scripts/assemble_frames.py` (connected-component ownership slicing, chroma spill suppression, binary alpha thresholding, foot-anchor registration)
     - `.agents/skills/generate2dsprite/scripts/scale_frames.py`, `palette_tool.py`, `pixel_reduce.py`, `sheet_qc.py`
     - `.agents/skills/pixel-art/scripts/quality_audit.py`, `atlas_pack.py`, `gif_export.py`, `palette_extract.py`, `palette_remap.py`
     - `.agents/skills/generate2dmap/scripts/extract_prop_pack.py`, `extract_terrain_tiles.py`, `map_nav.py`, `compose_layered_preview.py`, `export_tiled.py`
   - Do **not** run `python packages/art-tools/build_assets.py` (with or without `--force`) as a whole command; any reuse of logic from `packages/art-tools/build_assets.py` requires a separately approved command-level audit/refactor that strips all procedural `ImageDraw` generation and full-manifest/map overwrites.
5. **Stage 5 — In-World Phaser 4 / Tiled Integration & Two-Tier Approval Gate**:
   - Wire runtime sheets/tilesets into `apps/client/src/WorldScene.ts`, `apps/client/src/hud.ts`, and `maps/tan_thu_thon.tmj` / `maps/thanh_truc_lam.tmj`.
   - Validate technical integrity with `npm run verify:assets` (`packages/art-tools/verify_manifest.ts`), `.agents/skills/pixel-art/scripts/quality_audit.py`, and Playwright in-world captures (`tests/e2e/runPlaytest.ts` at `1280x720` desktop and `390x844` mobile in `artifacts/playtest/runs/<run-id>/`).
   - Passing automated checks confers **`TECHNICALLY_VERIFIED`** status only (`AGENTS.md` Section 5, `RULES.md` Rule 6). Promotion to **`HUMAN_APPROVED`** requires explicit sign-off by the human project owner after reviewing actual gameplay captures, and the first art production proof must receive owner creative approval before scaling production.

---

## 4. Current Validator Scope vs. Future Technical Enforcement

Documentation rules alone are not a runtime security barrier. Furthermore, the current implementation of `packages/art-tools/verify_manifest.ts` has the following exact verification boundaries:

### 4.1 Current `packages/art-tools/verify_manifest.ts` Scope
- **Existing character source SHA checks**: **Implemented** (verifies `sourceAiFiles` existence and SHA-256 digests for the character entries in `assets/provenance.json`).
- **Asset dimensions/alpha/frame checks**: **Implemented to current validator scope** (verifies PNG dimensions, alpha transparency bounds, and distinct frame counts across rows `0, 4, 8, 12, 16` for `480x1920` sheets).
- **All provenance paths portable**: **Not comprehensively enforced** (some historical provenance fields in `assets/provenance.json` still contain machine-specific paths and are not rejected by `verify_manifest.ts`).
- **Provider/method allowlist**: **Not yet implemented** (`verify_manifest.ts` does not currently validate `generationProvider` or `generationMethod` against an allowlist).
- **Future enforcement**: Remains a **separately approved tooling task** outside `G0`.

### 4.2 Future Technical Enforcement Roadmap (Separately Approved Tooling Task)
1. **Explicit Command & Tool Allowlists**: Restrict asset build tasks to the audited non-generative post-processing scripts listed in Section 3 Stage 4 and the Argon native `image-generator` subagent, while refactoring `packages/art-tools/build_assets.py` to separate non-generative packaging from legacy procedural `ImageDraw` code.
2. **Denial of External Media Tool Routes**: Disable or stub `.agents/skills/generate2dmedia/scripts/route_media.py`, `generate_media.py`, `cli_media.py`, `.agents/skills/video2dsprite/scripts/*`, and `.agents/skills/codeart2d/scripts/*` so any attempted execution exits non-zero before reading credentials or spawning external processes.
3. **Comprehensive Provenance & Provider Allowlist Validation**: Upgrade `packages/art-tools/verify_manifest.ts` (when authorized by the owner) to enforce portable relative paths across **all** provenance fields and validate `generationProvider` / `generationMethod` against an explicit native-only allowlist.
4. **Safe Automated Test Coverage**: Add deterministic unit tests for provenance schema validation and command-route allowlisting without relying on brittle filesystem side-effect checks.
