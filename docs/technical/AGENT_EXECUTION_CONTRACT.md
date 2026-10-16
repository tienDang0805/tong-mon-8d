# Agent Execution Contract — Tông Môn 8D: Tu Tiên Chi Lộ

> Status: `G0 BUILD/VERIFY PASS — OWNER REVIEW PENDING` | Base Commit: `6e38c246cabcd020efe137863838d6a61e7b1a72` | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Purpose & Authority Position

This contract governs how autonomous and interactive coding agents execute tasks inside `tienDang0805/tong-mon-8d` from post-`S0` governance (`G0`) through vertical slice implementation (`S1`–`S8` in `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`).

When resolving conflicts between documents or installed skills, agents MUST obey the priority hierarchy in `AGENTS.md` Section 1:
1. `AGENTS.md` and `RULES.md` (Rule 1 Zero Comments in Code, Rule 2 Canonical Fidelity, Rule 3 Server Authority, Rule 4 Playfield First, Rule 5 Cohesive Pixel Art & Tiled Maps, Rule 6 Genuine Generative Art & Human Creative Approval).
2. `docs/CONTEXT_INDEX.md`, `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/ROADMAP.md`, `docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, `docs/WORKSPACE_HANDOFF.md`, and `docs/NEXT_ACTIONS.md`.
3. `docs/DECISIONS.md` (`GD-001`–`GD-046`), `docs/technical/TD_FREEZE_APPROVALS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, `docs/technical/TD_FREEZE_GATES.md`, and the Human Creative Decisions Ledger in `AGENTS.md` Section 5.
4. `docs/GAME_LORE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `packages/game-data/src/index.ts`, `packages/shared/src/index.ts`, and canonical identity sections (Sections 5–7) of `MASTER_PROMPT.md`.
5. Phase 1B.0 Baseline v0.2 (`docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/CONTENT_PIPELINE.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`) and Technical Design Freeze v1.0 (`docs/systems/*.md`, `docs/pipelines/*.md`, `docs/technical/TD01..TD05_*.md`).
6. `.agents/skills/*/SKILL.md` as filtered and constrained by `docs/technical/AGENT_SKILL_ROUTER.md`.
7. Archived prompts and historical status reports (`MASTER_PROMPT.md` Sections 0, 8–16, `START_HERE.md`, `docs/IMPLEMENTATION_STATUS.md`).

> [!IMPORTANT]
> Documentation policy alone is **not** a runtime security barrier. This contract defines mandatory operational discipline and verification gates, while future technical enforcement requires explicit command/tool allowlists, denial of external media routes, provenance validation, and automated test coverage (see Section 5).

---

## 2. Single-Owner System Boundaries (`docs/technical/TD_FREEZE_CONTRACT_MAP.md`)

Every implementation slice (`S1`–`S8`) MUST preserve strict single-owner domain responsibility across `TD-01` through `TD-05`:

| Domain Owner | Authoritative Specifications | Exclusive System Responsibilities | Forbidden Cross-Boundary Violations |
|---|---|---|---|
| **TD-01** | `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD01_MIGRATION_TESTS.md` | Character Level (`1–350+`), 6 origin stats (`Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính`), `+1` free point per level, separate Character EXP vs `Tu Vi`, no excessive EXP overflow banking at capped non-Saint realms, `Phàm Nhân` (starter state) + 17 major cultivation realms (`Luyện Khí` through `Thánh Cảnh`) = 18 ordered entries (with `Đại Thánh` and `Cổ Thần` as lore only per `GD-044`), 3 immutable `Tiên Thiên` + 3 active `Hậu Thiên` destinies across 4 tiers (`Phàm, Hoàng, Tiên, Thần`), and at-most-1-of-10 Legendary `Thần Phẩm` signature exclusivity across all innate and acquired traits. | Ad hoc permanent stat mutations outside `TD-01`; cross-crediting Character EXP into `Tu Vi`; bypassing the `Phàm Nhân` Lv 10 Main Quest breakthrough gate (`GD-023`); granting a second Legendary signature destiny via loot, quest, shop, or reconnect. |
| **TD-02** | `docs/systems/DAO_MASTERY.md`, `docs/systems/TECHNIQUES.md`, `docs/systems/COMBAT.md`, `docs/technical/TD02_SIMULATION.md`, `docs/technical/TD02_MIGRATION_TESTS.md` | Sole combat/damage/mitigation/monster realm oppression math engine; `Công pháp` and `Võ kỹ` registration, ownership, and equipped slots across 6 tiers (`Phàm, Linh, Hoàng, Địa, Thiên, Thần`); 6 independent Dao mastery paths (`Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu`) × 10 stages (`Đạo Cảnh`), Dao XP credit, and trial gates at `3→4`, `6→7`, and `9→10`. | Implementing a second damage or reward path in Auto Farm; trusting client-reported damage; inventing a seventh `Thánh` technique tier; substituting `Đan/Khí/Phù` professions for the 6 Dao paths; auto-learning purchased manuals without separate `TD-02` validation; automating `Bí Cảnh` trials. |
| **TD-03** | `docs/systems/AUTO_FARM.md`, `docs/systems/NAVIGATION.md`, `docs/systems/QUEST_ENGINE.md`, `docs/technical/TD03_CONSISTENCY_MATRIX.md`, `docs/technical/TD03_PROTOCOL_MIGRATION_TESTS.md`, `docs/technical/TD03_REFERENCE_SIMULATION.md` | Connected-only `AutoFarmController` scheduling legal actions while online; single active controller per character; `AutoNavController` safe pathing and portal traversal stopping at target coordinates; **Quest Engine / Quest FSM** (`QUEST_ENGINE.md`), objective tracking, manual dialogue/accept/turn-in/choice validation; separate capped (`<= 8h`) offline `Bế Quan` meditation. | Offline monster kills or offline combat loot/EXP; duplicate rewards across two open browser tabs; auto-talking, auto-accepting, auto-completing quests, or auto-selecting dialogue choices; auto-buying/selling during navigation or farm; reassigning Quest FSM ownership to `TD-04`. |
| **TD-04** | `docs/systems/CONTENT_REGISTRY.md`, `docs/systems/ITEMS_ECONOMY.md`, `docs/systems/NPC_SHOPS.md`, `docs/systems/FOOD_CATALOG.md`, `docs/systems/NPC_AFFINITY.md`, `docs/systems/WORLD_CONTENT.md`, `docs/systems/QUEST_CONTENT.md`, `docs/technical/TD04_CONSISTENCY_FREEZE.md`, `docs/technical/TD04_MIGRATION_TESTS.md`, `docs/technical/TD04_REFERENCE_CHECKS.md` | Authored quest content (`QUEST_CONTENT.md`), fixed zone/world/item/economy catalogs, single-channel reward delivery (never granting the same item as both direct inventory grant and ground loot), **Food Catalog** and NPC affinity (`NPC_AFFINITY.md`), 6-chapter True Disciple (`Chân Truyền`) content gates, and **NPC-only commerce** (`NPC_SHOPS.md`) via physical in-world **Tụ Bảo Các** and specialist vendors sharing one server-authoritative `ShopService` (`BUY`/`SELL` only). | Player-to-player (P2P) trading, listings, consignment, escrow, or auctions; remote shop purchases without physical NPC/hub proximity; gating the Main Quest behind Legendary signature ownership; assuming a fixed dish count for Phì Đế before the Food Catalog threshold is resolved. |
| **TD-05** | `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/pipelines/CONTENT_ART_BRIEF_TEMPLATE.md`, `docs/pipelines/UX_WORLD_FIRST.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, `docs/technical/TD05_CROSS_TD_CONSISTENCY.md`, `docs/technical/TD05_MIGRATION_TESTS.md`, `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md` | Mandatory `VisualBindingDef` contract for every player-visible content object across **all slices (`S1`–`S8`)**, genuine generative art production (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`), audited non-generative post-processing, Phaser 4 / Tiled `.tmj` in-world rendering, playfield-first HUD (`apps/client/src/hud.ts`, `apps/client/src/WorldScene.ts`), and `TECHNICALLY_VERIFIED` → `HUMAN_APPROVED` release gates (`Candidate A` is currently a `PROPOSED` visual reference, not a `HUMAN_APPROVED` style lock; an art production proof requires owner creative approval before scaling production). | Postponing `TD-05` visual/UX responsibilities for `S1`–`S6` player-visible features until `S7`; shipping text-only popup gameplay features without in-world representation; executing `python packages/art-tools/build_assets.py` as a whole command; using procedural/code-drawn art (`codeart2d`) as final production artwork; promoting `TECHNICALLY_VERIFIED` / `PROPOSED` assets to `HUMAN_APPROVED` without owner sign-off. |

---

## 3. Mandatory 5-Stage Slice Execution Lifecycle

Every task or implementation slice (`S1`–`S8`) MUST follow this ordered 5-stage workflow:

### Stage 1 — `PLAN` (Strictly Read-Only Preflight, Manifests & Scope Lock)
1. Verify `git rev-parse HEAD` and `git status --short -uall`.
2. Read the slice contract in `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, `docs/technical/TD_FREEZE_GATES.md`, and the exact `TD-01`..`TD-05` domain specifications.
3. Every `S1`–`S8` task plan MUST explicitly declare three mandatory manifests:
   - **Context Manifest**: Exact canonical specification files (`docs/systems/*`, `docs/pipelines/*`, `docs/technical/*`) and owner-approved `GD-*` decision IDs read for the task.
   - **Skill Manifest**: Exact active skills (`.agents/skills/*/SKILL.md`) and permitted post-processing scripts loaded via `docs/technical/AGENT_SKILL_ROUTER.md`, plus explicitly excluded/forbidden skills.
   - **Per-Task Approved Source File Allowlist**: The minimal, exact list of existing or planned files authorized to be modified or created in that specific task. **A slice-wide candidate source list in `docs/technical/AGENT_SKILL_ROUTER.md` does NOT authorize editing all listed files.**
4. **Strictly Read-Only `PLAN` Persistence Rule**: Stage 1 `PLAN` is strictly read-only and must not perform filesystem writes. If the task touches persistence (`apps/server/src/db.ts`), `PLAN` must identify the non-destructive offline backup and throwaway restore method for `apps/server/apps/server/data/pgdata` and its required approvals, while any actual offline database backup/restore requiring filesystem writes occurs **only within a separately approved safety preflight before schema mutations**.
5. Present the scoped `PLAN` (`Context Manifest`, `Skill Manifest`, `Per-Task Approved Source File Allowlist`, backup/restore preflight method if persistence is touched, invariants preserved, `TD-05` visual review obligations for any player-visible elements, and verification commands). **`PLAN` cannot automatically continue to `BUILD` without explicit project-owner approval.**

### Stage 2 — `BUILD` (Approved Safety Preflight & Scoped Implementation)
1. Execute `BUILD` only after the project owner explicitly approves the `PLAN`. If the approved task touches persistence (`apps/server/src/db.ts`), execute the separately approved non-destructive offline database backup and throwaway restore verification of `apps/server/apps/server/data/pgdata` first—before making any schema or migration edits—and stop immediately if backup/restore verification fails. Modify **only** files listed in the **Per-Task Approved Source File Allowlist** (never edit outside the approved allowlist or treat a slice-wide candidate source list as blanket edit permission).
2. Enforce **Rule 1 (`RULES.md`)**: zero comments (`//`, `/* */`, `#`, `<!-- -->`) in any source code file or markdown fenced code block.
3. Enforce **Rule 3 (`RULES.md`)**: all gameplay mutations execute on the authoritative Colyseus server (`apps/server/src/worldEngine.ts`, `apps/server/src/zoneRoom.ts`, `apps/server/src/db.ts`); browser clients (`apps/client/src/WorldScene.ts`, `apps/client/src/hud.ts`, `apps/client/src/network.ts`) submit intents and render authoritative state.
4. Enforce **TD-05 (`docs/systems/VISUAL_CONTENT_CONTRACT.md`)** continuously across `S1`–`S8`: all player-visible work in `S1`–`S6` includes `TD-05` visual binding and visual review obligations (`docs/pipelines/UX_WORLD_FIRST.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`) rather than deferring visual integration or review to `S7`.

### Stage 3 — `REVIEW` (Self-Audit Against Hard Gates)
1. Verify that all 40 frozen Technical Design Freeze v1.0 files (`docs/systems/*.md`, the 5 frozen `docs/pipelines/*.md` files, and the 18 frozen `docs/technical/TD*` files) have zero diff against commit `39c41a6ddb77b93284c56da7ec053f4309ee4943`.
2. Verify that tracked historical playtest screenshots (`artifacts/playtest/01_*.png` through `07_*.png`) and existing PGlite user saves (`apps/server/apps/server/data/pgdata`) were not overwritten or deleted.
3. Scan all new or modified files to confirm zero comments inside source code or markdown code blocks (`RULES.md` Rule 1).
4. Audit status labels: never promote `DESIGN_BASELINE`, `PROPOSED`, or `UNRESOLVED` decisions in `docs/DECISIONS.md`, and never promote `TECHNICALLY_VERIFIED` or `PROPOSED` visual assets (`Candidate A`, Phase 0 PoC sprites) to `HUMAN_APPROVED` (`RULES.md` Rule 6).

### Stage 4 — `VERIFY` (Deterministic Automated & Runtime Checks)
Execute and record actual stdout and exit codes for:
1. `git diff --check`
2. `npm run verify:assets`
3. `npm test`
4. `npm run typecheck`
5. `npm run build`
6. When runtime, server, client, map, or visual changes occur: `npm run test:e2e` (using isolated `memory://` storage and writing per-run evidence exclusively to `artifacts/playtest/runs/<run-id>/`).

### Stage 5 — `COMMIT READY` (Evidence Report & Owner Sign-Off Gate)
1. Record slice status in `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, and `docs/ROADMAP.md` as `<SLICE> BUILD/VERIFY PASS — OWNER REVIEW PENDING` only after all executed checks pass.
2. Report the exact changed-file list, `git status --short -uall`, test/build outputs, and any open risks.
3. Stop and wait for explicit project-owner approval before running `git commit`, `git push`, or starting the next slice.

---

## 4. Hard Stop Conditions (Fail-Closed Rules)

An agent MUST immediately stop and report `BLOCKED` (without inventing fallbacks or workarounds) if any of the following conditions occur:
1. **Missing Path or Unclear Ownership**: Any required specification, source file, or script path does not exist on disk, or system ownership conflicts with `docs/technical/TD_FREEZE_CONTRACT_MAP.md`.
2. **Database Safety / Split-Brain Failure**: Both legacy (`apps/server/apps/server/data/pgdata`) and canonical (`apps/server/data/pgdata`) PGlite directories are initialized (`SPLIT_BRAIN_PGDATA_DIR`), or an offline backup + throwaway restore cannot be verified during an approved safety preflight prior to a schema migration.
3. **Unavailable Native Image Generator or Unsafe Asset Command During Art Production**: If an authorized art-generation task cannot invoke the Argon host's native `image-generator` subagent, the agent must return `BLOCKED` (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`). It must never invoke `python packages/art-tools/build_assets.py` as a whole command (including with `--force`), `.agents/skills/generate2dmedia/scripts/route_media.py`, external paid APIs, external CLIs (`codex`, `grok`), `video2dsprite`, or `codeart2d`.
4. **Frozen Specification Mutation**: Any task attempts to alter the 40 frozen Technical Design Freeze v1.0 Markdown files without an explicit freeze-amendment instruction from the project owner.

---

## 5. Future Technical Enforcement Roadmap & Pre-Deployment Security Gates

Because documentation governance alone is not a runtime security barrier, future technical enforcement tasks (outside `G0` docs-only scope) must implement:
1. **Command-Level Audit/Refactor of `packages/art-tools/build_assets.py` & Tool Allowlists**:
   - Never execute `python packages/art-tools/build_assets.py` as a whole production asset generation/post-processing command, including with `--force` (`npm run generate:art` / `npm run generate:art:force`), because its `main()` invokes `build_portraits_and_sprites()`, `build_tileset()`, `build_vfx_and_contact_sheet()`, `build_tiled_maps()`, rewrites manifest/provenance, and contains procedural `ImageDraw` tileset/VFX generation.
   - Treat existing `packages/art-tools/build_assets.py` as legacy tooling requiring command-level audit/refactor before production execution. Only explicitly audited, non-generative post-processing commands (`.agents/skills/generate2dsprite/scripts/assemble_frames.py`, `.agents/skills/pixel-art/scripts/quality_audit.py`, etc.) may be invoked for approved production art, while denying execution of `.agents/skills/generate2dmedia/scripts/route_media.py`, `generate_media.py`, `cli_media.py`, `.agents/skills/video2dsprite/scripts/*`, and `.agents/skills/codeart2d/scripts/*`.
2. **Provenance Schema Enforcement & `packages/art-tools/verify_manifest.ts` Scope**:
   - Current `packages/art-tools/verify_manifest.ts` enforcement status:
     - Existing character source SHA checks: implemented.
     - Asset dimensions/alpha/frame checks: implemented to current validator scope.
     - All provenance paths portable: not comprehensively enforced (some historical provenance fields contain machine-specific paths).
     - Provider/method allowlist: not yet implemented.
     - Future enforcement remains a separately approved tooling task (with unit test coverage around `assets/provenance.json` and `verify_manifest.ts`).
3. **Pre-Deployment Server Security Gate (`/api/test/advance-clock`)**:
   - In `apps/server/src/index.ts`, `POST /api/test/advance-clock` is currently mounted unconditionally without authentication or an environment guard, allowing callers to advance `getSharedEngine().advanceSimulatedClockMs(deltaMs)`.
   - Before any public or staging deployment, this endpoint MUST be gated behind an explicit test-only flag (`NODE_ENV === "test"` or `ENABLE_TEST_CLOCK_API === "true"`) and covered by automated security regression tests.
