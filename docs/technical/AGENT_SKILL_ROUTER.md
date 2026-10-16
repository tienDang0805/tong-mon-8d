# Agent Skill Router & 30-Skill Audit Registry — Tông Môn 8D

> Status: `G0 BUILD/VERIFY PASS — OWNER REVIEW PENDING` | Base Commit: `6e38c246cabcd020efe137863838d6a61e7b1a72` | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Routing Principles & Fail-Closed Path Policy

1. **Task-Scoped Skill Loading & Mandatory Manifests (`S1`–`S8`)**: Every `S1`–`S8` task `PLAN` must explicitly declare a **Context Manifest**, a **Skill Manifest**, and a **Per-Task Approved Source File Allowlist** (`docs/technical/AGENT_EXECUTION_CONTRACT.md`). Agents must load **only** the skills mapped to the active task in the **Skill Manifest**—never all 30 skills at once.
2. **No Automatic `PLAN → BUILD` Continuation & No Blanket Slice Edit Permission**: **`PLAN` cannot automatically continue to `BUILD` without explicit project-owner approval.** Furthermore, **a slice-wide source list in Section 3 does NOT authorize editing all listed files**; it is a verified candidate pool from which each individual task must select and lock a minimal **Per-Task Approved Source File Allowlist**.
3. **Project Governance Overrides Skill Instructions**: Per `AGENTS.md` Section 1 and `RULES.md` (Rules 1–6), project rules (`AGENTS.md`, `RULES.md`), `docs/DECISIONS.md`, and `TD-01`..`TD-05` (`docs/technical/TD_FREEZE_CONTRACT_MAP.md`) strictly override any conflicting default in `.agents/skills/*/SKILL.md`.
4. **Fail-Closed Path Verification**: Every document, source file, and script path referenced in a task plan must exist in the repository tree (or be explicitly marked as a `PLANNED_NEW_FILE`). If a required specification or script path is missing or system ownership is ambiguous, the agent must stop and report `BLOCKED` rather than guessing or substituting filenames.
5. **Continuous `TD-05` Visual Responsibility (`S1`–`S8`)**: `TD-05` (`docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/UX_WORLD_FIRST.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`) applies across **every player-visible feature in `S1`–`S6`**, including `TD-05` visual review obligations, not only in `S7`.

---

## 2. Complete 30-Skill Classification Registry (`.agents/skills/*/SKILL.md`)

All 30 installed workspace skills are classified into five operational tiers:
- `ACTIVE (CORE)`: Project-specific Tông Môn 8D governance, balance, server authority, map QA, and art orchestration skills.
- `ACTIVE (TASK-SCOPED)`: Engine-specific Phaser 4, HUD, and Playwright playtest skills loaded when touching matching client/test layers.
- `ACTIVE (POST-PROCESSING SCRIPTS ONLY)`: Skills whose local Python/Pillow post-processing, slicing, QA, and Tiled export scripts are permitted, while their external API/CLI generation routes, video handoffs, procedural fallbacks, and Godot/LDtk exports are disabled.
- `REFERENCE-ONLY`: Conceptual or superseded skills retained for reference only; never use their generic formulas or Godot/Unity code snippets in place of `TD-01`..`TD-05`.
- `DISABLED FOR PRODUCTION`: Forbidden external paid API/CLI media routers, image-to-video pipelines, procedural code-art generators, and throwaway greybox prototyping skills.

| # | Skill Path | Declared `name` | Classification | Permitted Scope & Approved Scripts | Disabled / Overridden Portions & Known Advisories |
|---|---|---|---|---|---|
| 1 | `.agents/skills/ai-art-production/SKILL.md` | `ai-art-production` | `ACTIVE (CORE)` | Primary art workflow orchestrator bound to `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, audited non-generative post-processing scripts, and `packages/art-tools/verify_manifest.ts` (character source SHA checks and asset dimensions/alpha/frame checks implemented to current validator scope; all provenance paths portable not comprehensively enforced; provider/method allowlist not yet implemented; future enforcement is a separately approved tooling task). | **Never execute `python packages/art-tools/build_assets.py` as a whole production asset generation/post-processing command, including with `--force`**; treat existing `build_assets.py` as legacy tooling requiring command-level audit/refactor before production execution. External API/CLI generation (`route_media.py`) and `video2dsprite` routes are disabled; native `image-generator` is status `NATIVE_IMAGE_TOOL_DISCOVERED — END_TO_END_NOT_YET_VERIFIED`. |
| 2 | `.agents/skills/pixel-art-director/SKILL.md` | `pixel-art-director` | `ACTIVE (CORE)` | Visual direction, `Candidate A` xianxia reference direction (`DEC-002`: currently a `PROPOSED` visual reference, not a `HUMAN_APPROVED` style lock; an art production proof must receive owner creative approval before scaling asset production), 10 Legends silhouettes (`chatdvt` jade-cyan quadruped beast, `dam_lon_tien_tu` `UNKNOWN` realm). | Ignore line 16 mention of `generate2dmedia` and video-derived clips; all runtime sheets are static grid spritesheets (`480x1920` / `288x1024`). |
| 3 | `.agents/skills/cultivation-balance/SKILL.md` | `cultivation-balance` | `ACTIVE (CORE)` | Quantitative progression modeling (`packages/game-data/src/index.ts`, `packages/game-data/src/runSimulation.ts`). | Subordinate to `docs/DECISIONS.md` and `TD-01`..`TD-04` (`docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/COMBAT.md`); overrides legacy v0.1 15-minute/3-dish note. |
| 4 | `.agents/skills/mmorpg-server-integrity/SKILL.md` | `mmorpg-server-integrity` | `ACTIVE (CORE)` | Authoritative Colyseus `0.18.x` server validation, movement, portals, shared mobs, combat, quests, shop, idempotency, and PGlite/PG persistence (`apps/server/src/*`). | Mandatory for all `S1`–`S8` server, protocol, and database tasks (`RULES.md` Rule 3). |
| 5 | `.agents/skills/world-and-map-qa/SKILL.md` | `world-and-map-qa` | `ACTIVE (CORE)` | Tiled JSON (`maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`), collision layers, portals, Y-sorted depth occlusion, and two-browser traversal QA. | Mandatory for all map, zone, portal, NPC placement, and `S2`/`S4`/`S5`/`S6`/`S7`/`S8` tasks (`RULES.md` Rule 5). |
| 6 | `.agents/skills/pixel-art/SKILL.md` | `pixel-art` | `ACTIVE (POST-PROCESSING SCRIPTS ONLY)` | Permitted scripts: `.agents/skills/pixel-art/scripts/quality_audit.py`, `atlas_pack.py`, `gif_export.py`, `palette_extract.py`, `palette_remap.py`, `outline_generator.py`, `sprite_resize.py`, `batch_audit.py`, `export_indexed.py`. | Do not use `noise_generator.py`, `dither.py`, or `sprite_mirror.py` to procedurally synthesize missing character/environment art or horizontally flip asymmetric canonical props. |
| 7 | `.agents/skills/generate2dsprite/SKILL.md` | `generate2dsprite` | `ACTIVE (POST-PROCESSING SCRIPTS ONLY)` | Permitted scripts: `.agents/skills/generate2dsprite/scripts/assemble_frames.py`, `generate2dsprite.py` (`process` mode only), `sheet_qc.py`, `scale_frames.py`, `palette_tool.py`, `pixel_reduce.py`, `plan_guide.py`, `make_anchor_layout.py`, `make_layout_guide.py`. | **Disabled**: `master_still.py` (`generate`/`edit`), `route_media.py` calls, `"configured key is owner's consent"` rule, mandatory `video2dsprite` handoff, `HD finish by default`, `codeart2d` fallback, and `export_engine.py` (Godot). |
| 8 | `.agents/skills/generate2dmap/SKILL.md` | `generate2dmap` | `ACTIVE (POST-PROCESSING SCRIPTS ONLY)` | Permitted scripts: `.agents/skills/generate2dmap/scripts/extract_prop_pack.py`, `extract_terrain_tiles.py`, `compose_layered_preview.py`, `map_bundle.py`, `map_nav.py`, `build_scene_preview.py`, `validate_layout.py`, `export_tiled.py` (`--embedded-variant`). | **Disabled**: `route_media.py` calls, `codeart2d` fallback, `export_godot.py`, `export_ldtk.py`, and side-scrolling/HD-2D plate workflows. |
| 9 | `.agents/skills/generate2dmedia/SKILL.md` | `generate2dmedia` | `DISABLED FOR PRODUCTION` | Only `.agents/skills/generate2dmedia/scripts/forge_doctor.py` (`--host-tools image_gen --no-exec --json`) may be run as a read-only local Python environment check. | **BLOCKED**: Never run `route_media.py`, `generate_media.py`, `cli_media.py`, `media_config.py`, or `media_providers.py`. External paid APIs and external CLIs (`codex`, `grok`) are forbidden (`AGENTS.md` Section 4). |
| 10 | `.agents/skills/video2dsprite/SKILL.md` | `video2dsprite` | `DISABLED FOR PRODUCTION` | None. | **BLOCKED**: Calls external video APIs/CLIs (`route_media.py video`), requires `ffmpeg` (not installed on host), and outputs WebM/MP4 instead of Tông Môn 8D Phaser spritesheets. |
| 11 | `.agents/skills/codeart2d/SKILL.md` | `codeart2d` | `DISABLED FOR PRODUCTION` | None (unless explicitly authorized in writing by the project owner for a non-production test). | **BLOCKED**: Procedural/code-drawn production art is strictly prohibited by `AGENTS.md` Section 4.2 and `RULES.md` Rule 6. |
| 12 | `.agents/skills/phaser4-game-setup-and-config/SKILL.md` | `game-setup-and-config` | `ACTIVE (TASK-SCOPED)` | Phaser 4 `GameConfig`, `pixelArt: true`, renderer, and scaling (`apps/client/src/main.ts`). | None. |
| 13 | `.agents/skills/phaser4-loading-assets/SKILL.md` | `loading-assets` | `ACTIVE (TASK-SCOPED)` | Phaser 4 `LoaderPlugin` (`this.load.spritesheet`, `image`, `tilemapTiledJSON`, `audio` in `apps/client/src/WorldScene.ts`). | Advisory: internal skill text mentions a relative `references/REFERENCE.md` file that is not bundled in `.agents/skills/phaser4-loading-assets/`; do not attempt to open it. |
| 14 | `.agents/skills/phaser4-scenes/SKILL.md` | `scenes` | `ACTIVE (TASK-SCOPED)` | Phaser 4 `Scene` lifecycle (`init`, `preload`, `create`, `update`) and transitions (`apps/client/src/WorldScene.ts`). | Advisory: internal skill text mentions an unbundled `references/REFERENCE.md`; do not attempt to open it. |
| 15 | `.agents/skills/phaser4-sprites-and-images/SKILL.md` | `sprites-and-images` | `ACTIVE (TASK-SCOPED)` | Phaser 4 `Sprite`/`Image` creation, origin `(0.5, 0.9167)` / `(0.5, 0.90)`, Y-sorted depth, tint, and alpha (`apps/client/src/WorldScene.ts`). | Advisory: internal skill text contains a malformed relative link on line 416; do not attempt to open it. |
| 16 | `.agents/skills/phaser4-animations/SKILL.md` | `animations` | `ACTIVE (TASK-SCOPED)` | Phaser 4 `AnimationManager`, directional row registration, `play`/`chain`, and animation events (`apps/client/src/WorldScene.ts`). | Governed by `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`. |
| 17 | `.agents/skills/phaser4-tilemaps/SKILL.md` | `tilemaps` | `ACTIVE (TASK-SCOPED)` | Phaser 4 Tiled JSON map loading, layers, GIDs, and tile properties (`apps/client/src/WorldScene.ts`, `maps/*.tmj`). | Use together with `.agents/skills/world-and-map-qa/SKILL.md`. |
| 18 | `.agents/skills/phaser4-physics-arcade/SKILL.md` | `physics-arcade` | `REFERENCE-ONLY` | Reference only for Phaser 4 Arcade API syntax if ever needed. | Tông Môn 8D uses server-authoritative tile collision (`apps/server/src/worldEngine.ts` + `apps/client/src/WorldScene.ts`), not client-authoritative Arcade physics. Internal `references/REFERENCE.md` is unbundled. |
| 19 | `.agents/skills/phaser4-v3-to-v4-migration/SKILL.md` | `v3-to-v4-migration` | `REFERENCE-ONLY` | Reference only when diagnosing Phaser 3 vs Phaser 4 API differences. | Runtime already runs Phaser `4.2.1`. |
| 20 | `.agents/skills/phaser-core/SKILL.md` | `phaser-core` | `REFERENCE-ONLY` | Bundled reference: `.agents/skills/phaser-core/references/scene-flow.md`. | Duplicated and superseded by `phaser4-game-setup-and-config`, `phaser4-scenes`, and `phaser4-loading-assets`. |
| 21 | `.agents/skills/phaser-arcade-physics/SKILL.md` | `phaser-arcade-physics` | `REFERENCE-ONLY` | Bundled reference: `.agents/skills/phaser-arcade-physics/references/bodies-and-collision.md`. | Duplicated by `phaser4-physics-arcade` and focused on platformer gravity; do not route for MMO movement. |
| 22 | `.agents/skills/game-playtest/SKILL.md` | `game-playtest` | `ACTIVE (TASK-SCOPED)` | Playwright browser smoke/E2E verification (`tests/e2e/runPlaytest.ts`, `tests/e2e/game.spec.ts`, desktop `1280x720` + mobile `390x844` captures in `artifacts/playtest/runs/<run-id>/`). | Ignore 3D/React Three Fiber/SpectorJS bullets and unbundled parent-relative `../../references/*` links inside the skill text. |
| 23 | `.agents/skills/game-ui-frontend/SKILL.md` | `game-ui-frontend` | `ACTIVE (TASK-SCOPED)` | DOM HUD overlay (`apps/client/src/hud.ts`, `apps/client/src/style.css`) over Phaser WebGL playfield (`<= 20–25%` viewport coverage per `RULES.md` Rule 4 and `docs/pipelines/UX_WORLD_FIRST.md`). | Ignore 3D pointer-lock/React Three Fiber bullets and unbundled `../../references/*` links inside the skill text. |
| 24 | `.agents/skills/create-game-assets/SKILL.md` | `create-game-assets` | `REFERENCE-ONLY` | Optional helper scripts: `.agents/skills/create-game-assets/scripts/asset_report.py`, `build_preview_sheet.py`; bundled refs in `.agents/skills/create-game-assets/references/*.md`. | Superseded by `.agents/skills/ai-art-production/SKILL.md` and `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`. Ignore unbundled `../../references/*` links. |
| 25 | `.agents/skills/sprite-pipeline/SKILL.md` | `sprite-pipeline` | `REFERENCE-ONLY` | Optional helper scripts: `.agents/skills/sprite-pipeline/scripts/build_sprite_edit_canvas.py`, `normalize_sprite_strip.py`, `render_sprite_preview_sheet.py`. | Superseded by explicitly audited, non-generative `generate2dsprite` post-processing scripts (`assemble_frames.py`, `scale_frames.py`, `palette_tool.py`, `pixel_reduce.py`, `sheet_qc.py`); never run legacy `packages/art-tools/build_assets.py` as a whole command. Ignore non-existent `imagegen` skill mention and unbundled `../../references/*` link. |
| 26 | `.agents/skills/game-feel/SKILL.md` | `game-feel` | `REFERENCE-ONLY` | Conceptual reference for trauma shake, hit-stop, and easing (`.agents/skills/game-feel/references/feedback-recipes.md`). | Subordinate to `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`; ignore Godot 4.7 GDScript and Unity 6.3 C# code blocks. |
| 27 | `.agents/skills/game-ui-ux/SKILL.md` | `game-ui-ux` | `REFERENCE-ONLY` | Conceptual UI layout reference (`.agents/skills/game-ui-ux/references/layout-and-flow.md`). | Subordinate to `docs/UX_DESIGN.md`, `docs/pipelines/UX_WORLD_FIRST.md`, and `.agents/skills/game-ui-frontend/SKILL.md`. |
| 28 | `.agents/skills/level-design/SKILL.md` | `level-design` | `REFERENCE-ONLY` | Conceptual pacing reference (`.agents/skills/level-design/references/pacing-and-flow.md`). | Subordinate to `docs/WORLD_DESIGN.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, and `.agents/skills/world-and-map-qa/SKILL.md`. |
| 29 | `.agents/skills/rpg/SKILL.md` | `rpg` | `REFERENCE-ONLY` | Conceptual RPG reference (`.agents/skills/rpg/references/stats-combat-quests.md`). | Never use generic JRPG formulas from `rpg`; strictly enforce `TD-01`..`TD-04` (`docs/systems/*.md`). |
| 30 | `.agents/skills/prototype-fast/SKILL.md` | `prototype-fast` | `DISABLED FOR PRODUCTION` | None. | **BLOCKED**: Greybox primitives and throwaway fake mechanics violate `AGENTS.md`, `RULES.md` Rules 5–6, and `docs/systems/VISUAL_CONTENT_CONTRACT.md`. |

---

## 3. Concrete Slice Routing Matrix (`S1`, `S3`, `S7` Detailed Exemplars)

> [!IMPORTANT]
> For every task in `S1`–`S8`, the agent's `PLAN` must produce a task-specific **Context Manifest**, **Skill Manifest**, and **Per-Task Approved Source File Allowlist**, and stop for owner approval before `BUILD`. **A slice-wide source list below does NOT authorize editing all listed files.**

### 3.1 Slice `S1` — Character Schema v0.2 & Migration (`TD-01` + `TD-05` HUD/Visual Contract)

- **System Ownership (`docs/technical/TD_FREEZE_CONTRACT_MAP.md`)**:
  - **TD-01** owns Character Level (`1–350+`), `Phàm Nhân` (starter state) + 17 major cultivation realms (`Luyện Khí` through `Thánh Cảnh`) = 18 ordered entries (with `Đại Thánh` and `Cổ Thần` as lore only per `GD-044`), 6 origin stats (`Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính`), `+1` free stat point per level, separate Character EXP vs `Tu Vi`, no excessive EXP overflow banking at capped non-Saint realms, 3 immutable `Tiên Thiên` + 3 active `Hậu Thiên` destinies (`Phàm, Hoàng, Tiên, Thần`), and at-most-1-of-10 Legendary `Thần Phẩm` signature exclusivity across all innate and acquired traits.
  - **TD-05** owns the playfield-first Character/Destiny HUD presentation, visual bindings, and visual review obligations for `S1` player-visible state (`docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/UX_WORLD_FIRST.md`).
- **Context Manifest Candidate Pool (Verified Existing Paths)**:
  - `docs/DECISIONS.md` (`GD-010`–`GD-023`, `GD-028`, `GD-044`)
  - `docs/systems/CHARACTER.md`
  - `docs/systems/CULTIVATION.md`
  - `docs/systems/DESTINY.md`
  - `docs/technical/TD01_SIMULATION.md`
  - `docs/technical/TD01_MIGRATION_TESTS.md`
  - `docs/systems/VISUAL_CONTENT_CONTRACT.md`
  - `docs/pipelines/UX_WORLD_FIRST.md`
- **Slice-Wide Candidate Source Pool (Not a Blanket Edit Authorization — Each Task Requires a Per-Task Approved Source File Allowlist)**:
  - `packages/shared/src/index.ts`
  - `packages/game-data/src/index.ts`
  - `packages/game-data/src/runSimulation.ts`
  - `apps/server/src/db.ts`
  - `apps/server/src/worldEngine.ts`
  - `apps/server/src/zoneRoom.ts`
  - `apps/server/src/__tests__/server.test.ts`
  - `apps/client/src/hud.ts`
  - `apps/client/src/network.ts`
  - `apps/client/src/WorldScene.ts`
  - `apps/client/src/style.css`
- **Skill Manifest Candidate Pool (Active Skills Routed)**:
  - `.agents/skills/mmorpg-server-integrity/SKILL.md`
  - `.agents/skills/cultivation-balance/SKILL.md`
  - `.agents/skills/game-ui-frontend/SKILL.md`
  - `.agents/skills/phaser4-scenes/SKILL.md`
  - `.agents/skills/game-playtest/SKILL.md`
- **Forbidden Skills / Routes**:
  - `.agents/skills/rpg/SKILL.md`, `.agents/skills/prototype-fast/SKILL.md`, `.agents/skills/codeart2d/SKILL.md`, `.agents/skills/generate2dmedia/SKILL.md`, `.agents/skills/video2dsprite/SKILL.md`

---

### 3.2 Slice `S3` — `TD-02` Common Legal Combat Action, Dao XP & Progression Trial Gate (`TD-02` + `TD-01` + `TD-05`)

- **System Ownership (`docs/technical/TD_FREEZE_CONTRACT_MAP.md`)**:
  - **TD-02** is the sole owner of combat/damage/mitigation/realm oppression math (`docs/systems/COMBAT.md`), `Công pháp` and `Võ kỹ` registration/ownership/slots across 6 tiers (`Phàm, Linh, Hoàng, Địa, Thiên, Thần` in `docs/systems/TECHNIQUES.md`), and the 6 independent Dao mastery paths (`Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu`) × 10 `Đạo Cảnh` stages with `3→4`, `6→7`, and `9→10` trial gates (`docs/systems/DAO_MASTERY.md`).
  - **TD-01** supplies authoritative character stat/realm snapshots consumed by `TD-02` (`docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`).
  - **TD-05** owns the in-world skill cast animations, hit VFX, HUD feedback, and visual review obligations (`docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/pipelines/UX_WORLD_FIRST.md`).
- **Context Manifest Candidate Pool (Verified Existing Paths)**:
  - `docs/DECISIONS.md` (`GD-024`–`GD-027`, `GD-030`–`GD-032`)
  - `docs/systems/COMBAT.md`
  - `docs/systems/TECHNIQUES.md`
  - `docs/systems/DAO_MASTERY.md`
  - `docs/technical/TD02_SIMULATION.md`
  - `docs/technical/TD02_MIGRATION_TESTS.md`
  - `docs/systems/CHARACTER.md`
  - `docs/systems/CULTIVATION.md`
  - `docs/systems/VISUAL_CONTENT_CONTRACT.md`
  - `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`
  - `docs/pipelines/UX_WORLD_FIRST.md`
- **Slice-Wide Candidate Source Pool (Not a Blanket Edit Authorization — Each Task Requires a Per-Task Approved Source File Allowlist)**:
  - `packages/shared/src/index.ts`
  - `packages/game-data/src/index.ts`
  - `packages/game-data/src/runSimulation.ts`
  - `apps/server/src/db.ts`
  - `apps/server/src/worldEngine.ts`
  - `apps/server/src/zoneRoom.ts`
  - `apps/server/src/__tests__/server.test.ts`
  - `apps/client/src/WorldScene.ts`
  - `apps/client/src/hud.ts`
  - `apps/client/src/network.ts`
  - `apps/client/src/audio.ts`
- **Skill Manifest Candidate Pool (Active Skills Routed)**:
  - `.agents/skills/mmorpg-server-integrity/SKILL.md`
  - `.agents/skills/cultivation-balance/SKILL.md`
  - `.agents/skills/phaser4-animations/SKILL.md`
  - `.agents/skills/phaser4-sprites-and-images/SKILL.md`
  - `.agents/skills/game-ui-frontend/SKILL.md`
  - `.agents/skills/game-playtest/SKILL.md`
- **Reference-Only / Forbidden Skills**:
  - `.agents/skills/game-feel/SKILL.md` (`REFERENCE-ONLY` for trauma/hit-stop math; ignore Godot/Unity code)
  - Forbidden: `.agents/skills/rpg/SKILL.md`, `.agents/skills/phaser4-physics-arcade/SKILL.md`, `.agents/skills/prototype-fast/SKILL.md`

---

### 3.3 Slice `S7` — First Full Generated Art Pack / Zone & User-Approved Visual Gate (`TD-05`)

- **System Ownership (`docs/technical/TD_FREEZE_CONTRACT_MAP.md`)**:
  - **TD-05** owns the visual content contract (`docs/systems/VISUAL_CONTENT_CONTRACT.md`), native generative art production (`docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`), animation/VFX feedback (`docs/pipelines/ANIMATION_VFX_FEEDBACK.md`), Tiled/Phaser scene assembly (`docs/pipelines/WORLD_SCENE_ASSEMBLY.md`), and vertical slice visual acceptance (`docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md`).
  - **Visual Reference & Proof Gate**: `Candidate A` (`DEC-002`) is currently a `PROPOSED` visual reference (`PROPOSED` / `TECHNICALLY_VERIFIED`), not a fully `HUMAN_APPROVED` style lock. An initial art production proof must receive owner creative approval (`HUMAN_APPROVED`) before scaling asset production across characters, maps, or items.
- **Context Manifest Candidate Pool (Verified Existing Paths)**:
  - `docs/ART_BIBLE.md`
  - `docs/CHARACTER_VISUAL_BIBLE.md`
  - `docs/systems/VISUAL_CONTENT_CONTRACT.md`
  - `docs/pipelines/AI_ASSET_PRODUCTION.md`
  - `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`
  - `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`
  - `docs/pipelines/CONTENT_ART_BRIEF_TEMPLATE.md`
  - `docs/pipelines/UX_WORLD_FIRST.md`
  - `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`
  - `docs/technical/TD05_CROSS_TD_CONSISTENCY.md`
  - `docs/technical/TD05_MIGRATION_TESTS.md`
  - `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md`
- **Slice-Wide Candidate Source & Tooling Pool (Not a Blanket Edit Authorization — Each Task Requires a Per-Task Approved Source File Allowlist)**:
  - `packages/art-tools/build_assets.py` *(legacy monolithic tooling containing procedural `ImageDraw` tileset/VFX generation and full manifest/map rewrites — **never execute as a whole command**, with or without `--force`; candidate for separately approved command-level audit/refactor only)*
  - `packages/art-tools/verify_manifest.ts` *(currently implements character source SHA checks and asset dimensions/alpha/frame checks to current validator scope; portable provenance paths across all fields are not comprehensively enforced and provider/method allowlists are not yet implemented — future enforcement is a separately approved tooling task)*
  - `assets/manifest.json`
  - `assets/provenance.json`
  - `maps/tan_thu_thon.tmj`
  - `maps/thanh_truc_lam.tmj`
  - `apps/client/src/WorldScene.ts`
  - `apps/client/src/hud.ts`
  - `tests/e2e/runPlaytest.ts`
- **Skill Manifest Candidate Pool (Active Skills & Permitted Post-Processing Scripts Routed)**:
  - `.agents/skills/pixel-art-director/SKILL.md`
  - `.agents/skills/ai-art-production/SKILL.md`
  - `.agents/skills/generate2dsprite/SKILL.md` (`POST-PROCESSING SCRIPTS ONLY`: `.agents/skills/generate2dsprite/scripts/assemble_frames.py`, `sheet_qc.py`, `scale_frames.py`, `palette_tool.py`, `pixel_reduce.py`)
  - `.agents/skills/generate2dmap/SKILL.md` (`POST-PROCESSING SCRIPTS ONLY`: `.agents/skills/generate2dmap/scripts/extract_prop_pack.py`, `extract_terrain_tiles.py`, `map_nav.py`, `compose_layered_preview.py`, `export_tiled.py`)
  - `.agents/skills/pixel-art/SKILL.md` (`POST-PROCESSING SCRIPTS ONLY`: `.agents/skills/pixel-art/scripts/quality_audit.py`, `atlas_pack.py`, `gif_export.py`, `palette_extract.py`, `palette_remap.py`)
  - `.agents/skills/phaser4-loading-assets/SKILL.md`, `.agents/skills/phaser4-tilemaps/SKILL.md`, `.agents/skills/phaser4-sprites-and-images/SKILL.md`, `.agents/skills/phaser4-animations/SKILL.md`
  - `.agents/skills/world-and-map-qa/SKILL.md`
  - `.agents/skills/game-playtest/SKILL.md`
- **Forbidden Skills / Routes**:
  - Whole-command execution of `python packages/art-tools/build_assets.py` (including with `--force` / `npm run generate:art` / `npm run generate:art:force`)
  - `.agents/skills/generate2dmedia/SKILL.md` (`route_media.py`, `generate_media.py`, `cli_media.py`)
  - `.agents/skills/video2dsprite/SKILL.md`
  - `.agents/skills/codeart2d/SKILL.md`
  - `.agents/skills/prototype-fast/SKILL.md`

---

## 4. Summary Routing Table Across All Implementation Slices (`S0`–`S8`)

| Slice | Primary Domain Owner(s) | Required Canonical Specs (`docs/`) | Active Skills Routed |
|---|---|---|---|
| `S0` (Committed `6e38c24`) | Foundation / DB / Ops | `docs/DEVELOPMENT_SETUP.md`, `docs/technical/TD01_MIGRATION_TESTS.md`, `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md` | `mmorpg-server-integrity`, `world-and-map-qa`, `game-playtest` |
| `S1` | **TD-01** + **TD-05** (HUD/visual bindings) | `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD01_MIGRATION_TESTS.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/UX_WORLD_FIRST.md` | `mmorpg-server-integrity`, `cultivation-balance`, `game-ui-frontend`, `phaser4-scenes`, `game-playtest` |
| `S2` | **TD-01** + **TD-03** (Quest Engine/FSM) + **TD-05** (Mentor encounter visuals/HUD) | `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/QUEST_ENGINE.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD03_CONSISTENCY_MATRIX.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/UX_WORLD_FIRST.md` | `mmorpg-server-integrity`, `cultivation-balance`, `world-and-map-qa`, `game-ui-frontend`, `phaser4-sprites-and-images`, `game-playtest` |
| `S3` | **TD-02** + **TD-01** + **TD-05** (Cast poses/hit VFX) | `docs/systems/COMBAT.md`, `docs/systems/TECHNIQUES.md`, `docs/systems/DAO_MASTERY.md`, `docs/technical/TD02_SIMULATION.md`, `docs/technical/TD02_MIGRATION_TESTS.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md` | `mmorpg-server-integrity`, `cultivation-balance`, `phaser4-animations`, `phaser4-sprites-and-images`, `game-ui-frontend`, `game-playtest` |
| `S4` | **TD-03** (Auto Farm, Navigation, Quest FSM) + **TD-02** + **TD-05** (Route/HUD visuals) | `docs/systems/AUTO_FARM.md`, `docs/systems/NAVIGATION.md`, `docs/systems/QUEST_ENGINE.md`, `docs/technical/TD03_CONSISTENCY_MATRIX.md`, `docs/technical/TD03_PROTOCOL_MIGRATION_TESTS.md`, `docs/technical/TD03_REFERENCE_SIMULATION.md`, `docs/systems/COMBAT.md`, `docs/pipelines/UX_WORLD_FIRST.md` | `mmorpg-server-integrity`, `world-and-map-qa`, `phaser4-tilemaps`, `game-ui-frontend`, `game-playtest` |
| `S5` | **TD-04** (Content/Items/Food/Affinity/Quest Content) + **TD-01..03** + **TD-05** (World/Item visuals) | `docs/systems/CONTENT_REGISTRY.md`, `docs/systems/ITEMS_ECONOMY.md`, `docs/systems/FOOD_CATALOG.md`, `docs/systems/NPC_AFFINITY.md`, `docs/systems/WORLD_CONTENT.md`, `docs/systems/QUEST_CONTENT.md`, `docs/technical/TD04_CONSISTENCY_FREEZE.md`, `docs/technical/TD04_MIGRATION_TESTS.md`, `docs/technical/TD04_REFERENCE_CHECKS.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md` | `mmorpg-server-integrity`, `cultivation-balance`, `world-and-map-qa`, `phaser4-sprites-and-images`, `game-ui-frontend`, `game-playtest` |
| `S6` | **TD-04** (`NPC_SHOPS.md`) + **TD-03** (Manual interaction) + **TD-05** (Physical `Tụ Bảo Các` building/vendor/UI) | `docs/systems/NPC_SHOPS.md`, `docs/systems/ITEMS_ECONOMY.md`, `docs/systems/FOOD_CATALOG.md`, `docs/technical/TD04_CONSISTENCY_FREEZE.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, `docs/pipelines/UX_WORLD_FIRST.md` | `mmorpg-server-integrity`, `cultivation-balance`, `world-and-map-qa`, `phaser4-tilemaps`, `game-ui-frontend`, `game-playtest` |
| `S7` | **TD-05** (Full generated art pack/zone & owner visual gate) | `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/pipelines/CONTENT_ART_BRIEF_TEMPLATE.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, `docs/technical/TD05_CROSS_TD_CONSISTENCY.md`, `docs/technical/TD05_MIGRATION_TESTS.md`, `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md` | `pixel-art-director`, `ai-art-production`, `generate2dsprite` (post-processing scripts), `generate2dmap` (post-processing scripts), `pixel-art` (post-processing scripts), `phaser4-loading-assets`, `phaser4-tilemaps`, `phaser4-sprites-and-images`, `phaser4-animations`, `world-and-map-qa`, `game-playtest` |
| `S8` | **All TDs (`TD-01`–`TD-05`)** | `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md`, `docs/technical/TD_FREEZE_GATES.md`, `docs/technical/TD_FREEZE_APPROVALS.md` | `mmorpg-server-integrity`, `cultivation-balance`, `world-and-map-qa`, `game-ui-frontend`, `game-playtest` |
