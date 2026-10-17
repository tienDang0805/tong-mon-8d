# Agent Execution Contract — Tông Môn 8D: Tu Tiên Chi Lộ

> Operational policy | Current commit identities: docs/implementation/FEATURE_LEDGER.md | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Purpose & Authority Position

This contract governs how autonomous and interactive coding agents execute tasks inside `tienDang0805/tong-mon-8d` from post-`S0` governance (`G0` / `CTX-1`) through vertical slice implementation (`S1`–`S8` in `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`).

When resolving conflicts between documents or installed skills, agents MUST obey the priority hierarchy in `AGENTS.md` Section 1:
1. `AGENTS.md` and `RULES.md` (Rule 1 Zero Comments in Code, Rule 2 Canonical Fidelity, Rule 3 Server Authority, Rule 4 Playfield First, Rule 5 Cohesive Pixel Art & Tiled Maps, Rule 6 Genuine Generative Art & Human Creative Approval).
2. `docs/CONTEXT_INDEX.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/ROADMAP.md`, `docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, `docs/WORKSPACE_HANDOFF.md`, and `docs/NEXT_ACTIONS.md`.
3. `docs/DECISIONS.md` (`GD-001`–`GD-046`), `docs/technical/TD_FREEZE_APPROVALS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, `docs/technical/TD_FREEZE_GATES.md`, and the Human Creative Decisions Ledger in `AGENTS.md` Section 5.
4. `docs/GAME_LORE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `packages/game-data/src/index.ts`, `packages/shared/src/index.ts`, and canonical identity sections (Sections 5–7) of `MASTER_PROMPT.md`.
5. Phase 1B.0 Baseline v0.2 (`docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/CONTENT_PIPELINE.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`) and Technical Design Freeze v1.0 (`docs/systems/*.md`, `docs/pipelines/*.md`, `docs/technical/TD01..TD05_*.md`).
6. `.agents/skills/*/SKILL.md` as filtered and constrained by `docs/technical/AGENT_SKILL_ROUTER.md`.
7. Archived prompts and historical status reports (`MASTER_PROMPT.md` Sections 0, 8–16, `START_HERE.md`, `docs/IMPLEMENTATION_STATUS.md`).

> [!IMPORTANT]
> Documentation policy alone is **not** a runtime security barrier, and CI-enforced `DOC SYNC` automation does not yet exist. This contract defines mandatory operational discipline and verification gates, while future technical enforcement requires explicit command/tool allowlists, denial of external media routes, provenance validation, and automated CI/test coverage (see Section 5).

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

## 3. Owner + Planner → Argon Execution → Progress and Next Task

The owner and ChatGPT plan the game. Argon implements the owner's dispatched tasks autonomously. ChatGPT is not a mandatory technical approval stage after each edit or task. This section replaces the old nine-stage approval interpretation: planning, execution and closeout are the three working phases. Self-review, relevant tests and documentation are responsibilities inside execution, not separate conversations or compulsory review packets. Frozen TD acceptance and owner canon/art/data decisions remain binding.

### 3.1 Plan and dispatch once

The owner and planner choose the player/system outcome, current base, boundaries, relevant specs and acceptance criteria. Use one concise executable task card with exact Code and Documentation Allowlists, the applicable verification profile and explicit commit policy. A small task needs no separate long PLAN document, source quotation matrix or external plan review. Detailed design work is appropriate only when an unresolved design/architecture choice materially affects the task.

- MODE: EXECUTE authorizes implementation when the owner issues or forwards the card. MODE: PLAN_ONLY authorizes planning only. Drafts, repository examples, copied reports and bundled templates do not authorize execution by themselves.
- COMMIT_POLICY: COMMIT_AND_PUSH_AFTER_CHECKS explicitly authorizes an ordinary scoped commit and push after acceptance and required checks pass. STOP_BEFORE_COMMIT stops at a ready change. When no commit/push authorization exists, do not infer it; stop at that boundary without repeating implementation review. Existing explicit authorization for the same scope persists.
- A file allowlist is a ceiling, not a requirement to edit every listed path. Include needed status-doc paths in the initial task. A slice candidate list is not an edit allowlist. No next feature is authorized by the roadmap alone.
- Verify local HEAD, live remote at task entry and working-tree ownership. Preserve unrelated work and use isolation when necessary. Read only relevant rules/specs/skills and reuse unchanged context. Docs or independent tooling work may use Skill Manifest: NONE. Do not start dev services or application tests merely because a session opened.
- PLAN_ONLY may write plan/evidence artifacts to approved locations outside the implementation repo. It does not modify implementation files, player data or infrastructure.

### 3.2 Argon completes the scoped task

Implement, self-review, run the applicable checks, fix concrete failures and synchronize affected docs without asking the owner/planner to approve each internal step. Choose routine implementation details within the approved architecture and scope. Do not bounce an actionable EXECUTE card back as a new PLAN-only report.

Review the complete task change once before closeout. Collect known blockers together. After corrections, review the changed area and affected dependencies; reopen accepted code only for new evidence or a changed dependency. A blocker is a demonstrated correctness, acceptance, data/authority or required-evidence failure. Optional refactors, stylistic preferences and unrelated future work are advisory. If the same failure survives two focused attempts, diagnose the cause and pursue a concrete resolution or identify the external blocker; repeating a full test suite is not diagnosis. New demonstrated serious defects still require correction.

Use the smallest sufficient verification profile:

| Changed behavior | Required evidence | Not automatic |
|---|---|---|
| Read-only planning/review | Source/Git state and concrete task boundaries | Application tests, build, dev server, DB |
| Docs/governance/status only | Diff/whitespace, new or changed path/command references, policy/status consistency and protected paths | Game tests/typecheck/build/assets/E2E; new tests that mirror Markdown wording |
| Test/harness only | Changed tests and relevant type checks; meaningful negative cases for changed harness behavior | Unrelated application build or full E2E |
| Independent tooling/scripts | Syntax and focused disposable fixtures for changed behavior, including relevant path/error/destructive-operation boundaries | Unrelated game suite/build/assets |
| Pure contracts/numeric logic | Affected unit/contract tests, typecheck, consumer/build check when exports change; seeded simulation only when it exercises the new model | Browser E2E before runtime integration; treating the legacy simulator as evidence for formulas it never calls |
| Runtime server/client/integration | Affected tests, typecheck/build and focused browser/integration proof | Unrelated scenarios after every small edit |
| Shared persistence, rewards/economy, auth/session, protocol or migration | Full existing test suite, typecheck/build, relevant isolated integration and negative cases; applicable gameplay smoke before closeout | Live player DB tests or automatic PG access from DATABASE_URL |
| Art/map/UI/content | Relevant schema/ID/provenance/assets and in-game proof at actual zoom; runtime checks when bindings or rewards change | Regenerating unchanged art or unrelated DB tests |
| Slice/release acceptance | Applicable frozen TD gates, full required checks and relevant two-browser/restart/reconnect/visual evidence | Claiming prototype/unit-test evidence proves the new vertical slice |

Mixed tasks use the union of affected profiles. Explicit task criteria and applicable frozen TD requirements still apply. Run focused checks during edits, then one required pass when relevant inputs stabilize. npm run build already includes verify:assets; do not duplicate it on unchanged inputs. Existing focused Vitest invocation: npm test -- <test-file>. Other commands remain available when applicable: npm run typecheck, npm run build, npm run test:sim, npm run test:e2e, and powershell -NoProfile -File scripts/tests/export-review-packet.test.ps1.

Reuse a passing result when relevant source/test inputs, dependencies/lockfile, config, generated inputs and meaningful environment are unchanged. Retain the original run identity and label it reused, never freshly executed. Docs/report-only edits invalidate docs/report checks, not unrelated runtime evidence. No new caching/verification framework is required to follow this rule. Record executed/reused checks and actual results; NOT_APPLICABLE is different from relevant-but-NOT_RUN or FAILED. A required environment-blocked check remains open; passing unrelated checks cannot replace it.

For occupied test ports, do not kill the owner's process or attach to its database. Use supported isolated configuration or an authorized documented alternative; otherwise report the specific environment blocker. Preserve other valid evidence.

All DB tests use explicit isolated storage. External PostgreSQL needs TEST_DATABASE_URL, explicit isolated opt-in and a verified test target; never fall back to DATABASE_URL. Actual migration of existing saves requires its approved offline backup and throwaway restore preflight. A helper, test or docs edit does not itself require opening or backing up player databases.

Player-visible work carries the applicable TD-05 in-world binding/feedback and visual evidence. Human art approval, canon changes, frozen-spec amendments and live-data operations retain their separate decisions. Technical checks cannot grant them.

Keep DOC SYNC inside the task:

- FEATURE_LEDGER owns task evidence, checks, limitations and immutable prior commit IDs. PROJECT_STATUS owns the current snapshot; NEXT_ACTIONS owns priorities and blockers. Update only affected authorized documents.
- MASTER_PROJECT_PLAN/ROADMAP change for milestones. AGENTS/CONTEXT_INDEX/router own rules and routes, not duplicate per-task state lists.
- SELF_COMMIT is legitimate before the new commit exists. Resolve it from Git at closeout and backfill during a later already-authorized doc change; do not create a commit solely to write its own SHA.
- If an essential doc update is outside scope, report the exact affected path/decision at the existing task boundary. Do not invent consistency or silently expand scope. Unchanged docs need no edits or separate CTX task.

At final scope check, account for all changed/new paths, preserve unrelated work and confirm the forty frozen files are unchanged. Check affected references, not every historical/proposed/example path in the repository. Missing optional bundled-skill references are not global blockers. Never open saved data merely to demonstrate that docs did not change it.

### 3.3 Close out once; planner continues planning

When acceptance and applicable checks pass, follow the dispatched commit policy. If COMMIT_AND_PUSH_AFTER_CHECKS is authorized, verify the expected remote base, stage only task paths, run git diff --cached --check, commit, push normally and verify full local/remote SHA. Do not ask for duplicate permission. Reconcile remote changes without resetting unrelated work or force pushing. If permission/network/branch protection blocks push, retain the verified local result and report that specific blocker; do not restart development. If commit was not authorized, report READY_FOR_COMMIT once.

Return one concise completion report: task/status; implemented outcome and important limits; base/current commit and remote verification if pushed; changed scope; required checks with executed/reused/NOT_RUN distinctions; updated docs; unresolved owner decision, if any. Keep raw logs/diffs in artifacts. No mandatory PLAN ZIP, per-stage ZIP, SHA-only DOC SYNC commit, routine independent ChatGPT approval, or separate closeout-review conversation.

The planner consumes the report, verifies live commit identity when relevant, updates progress and discusses the next task. It does not rerun the implementation suite or audit every diff by default. Targeted source review is appropriate when requested, evidence conflicts, acceptance is missing, or a concrete high-risk concern remains. Reports remain agent-reported evidence unless independently verified.

Use scripts/export-review-packet.ps1 only when the owner/reviewer requests a packet or evidence must be transferred to someone without repository/artifact access. For that exporter, first verify ActualChangedPaths is a subset of the owner-approved allowlist, then pass the exact actual subset as CLI -TaskAllowlist and include all task untracked files through -NewFiles. Do not edit unused allowlisted files to satisfy the tool, omit changed files, package unrelated data, or weaken path protections. A requested packet must match the final scoped state. Exporter CLI stage labels such as OWNER_APPROVAL are transport labels, not additional approval gates.

Escalate only a real scope expansion, unresolved owner design/creative/data decision, missing required capability/input, unsafe operation or concrete blocker that cannot be resolved within the task. State the precise decision and a recommended resolution. Continue independent authorized work; do not ask the owner to supervise routine debugging. The next feature starts only from the owner's next dispatched task.

---

## 4. Hard Stop Conditions (Fail-Closed Rules)

An agent MUST immediately stop and report `BLOCKED` (without inventing fallbacks or workarounds) if any of the following conditions occur:
1. **Missing Required Input or Unclear Ownership**: Pause the affected operation when an actually required input is unavailable or ownership conflicts with `docs/technical/TD_FREEZE_CONTRACT_MAP.md`. First check the current source/router for a moved path or documented alternative. Missing optional/archived/illustrative skill references are not global blockers. Do not invent a required input, rewrite canon or bypass a database/art boundary; continue independent authorized work where possible.
2. **Database Safety / Split-Brain Failure**: Both legacy (`apps/server/apps/server/data/pgdata`) and canonical (`apps/server/data/pgdata`) PGlite directories are initialized (`SPLIT_BRAIN_PGDATA_DIR`), or an offline backup + throwaway restore cannot be verified during an approved safety preflight prior to a schema migration.
3. **Unavailable Native Image Generator or Unsafe Asset Command During Art Production**: If an authorized art-generation task cannot invoke the Argon host's native `image-generator` subagent, the agent must return `BLOCKED` (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`). It must never invoke `python packages/art-tools/build_assets.py` as a whole command (including with `--force`), `.agents/skills/generate2dmedia/scripts/route_media.py`, external paid APIs, external CLIs (`codex`, `grok`), `video2dsprite`, or `codeart2d`.
4. **Frozen Specification Mutation**: Any task attempts to alter the 40 frozen Technical Design Freeze v1.0 Markdown files without an explicit freeze-amendment instruction from the project owner.

---

## 5. Future Technical Enforcement Roadmap & Pre-Deployment Security Gates

Because documentation governance alone is not a runtime security barrier and CI-enforced `DOC SYNC` automation does not yet exist, future technical enforcement tasks (outside `G0` / `CTX-1` docs-only scope) must implement:
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
4. **Automated `DOC SYNC` & Context Consistency Verification Tooling**:
   - Currently, `DOC SYNC` and `CONTEXT CONSISTENCY CHECK` (40-file TD Freeze diff check, Markdown repo-path validator, zero-comment code-block scanner, and stale-status check) are executed as agent verification commands rather than an automated CI script. Future tooling work (when authorized by the owner) may package these checks into a read-only `npm run verify:docs` script.
