# Tông Môn 8D — Implementation & Verification Feature Ledger

> Active engineering ledger | Last verified remote: `7b386cea7ef075c6f358539ddea155cd1634db5b` | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Purpose & Ledger Governance Rules

This ledger records what each completed or reviewed task in `tienDang0805/tong-mon-8d` **actually implemented and verified on disk**, strictly separated from design-only specifications (`docs/DECISIONS.md`, `docs/systems/*`, `docs/pipelines/*`, `docs/technical/*`).

1. **Evidence-Grounded Entries Only**: Every entry must cite real repository paths, actual verification commands/outputs, and verified Git commit SHAs on `origin/master`.
2. **Design vs. Implementation Separation**: Never record a gameplay system as implemented when only specifications, read-only plans, or pure TypeScript contract/validator subsets exist.
3. **Commit SHA Closeout Rule (`docs/technical/AGENT_EXECUTION_CONTRACT.md`)**:
   - Completed prior commits record their exact immutable Git SHA (`6e38c24`, `39d71c0`, `b04ebdc`, `0e9cc8d`, `0543b71`, `f06c510`, `0c00374`, `fdd8e8b`, `cb360e8`, `bf2d24f`, `897197a`, `a3de054`, `b82e20b`, `51d4caf`, `4679f49`, `7b386ce`).
   - Because a commit cannot contain its own future SHA, the active task being committed records `Commit SHA: SELF_COMMIT (reported at REMOTE CLOSEOUT after push)` and `Status: VERIFIED_READY_FOR_COMMIT`, which is then backfilled with the exact SHA during the next authorized `DOC SYNC`. Tasks with `COMMIT_POLICY: NO_COMMIT` record `NO_COMMIT` on the verified remote base.

---

## 2. Current Slice & Sub-Slice Status Summary

| Slice / Sub-Task | Scope Summary | Current Status | Verified Commit SHA |
|---|---|---|---|
| `S0` | Foundation, PGlite split-brain safety, `.env` loader, isolated E2E runs | `COMMITTED` | `6e38c246cabcd020efe137863838d6a61e7b1a72` (`6e38c24`) |
| `G0` | Agent workflow governance, 30-skill router & Argon native asset profile | `COMMITTED` | `39d71c06a830f5f2d9ae2d64b09cb18aa3efebc4` (`39d71c0`) |
| `S1` (Overall) | Character schema v0.2, multi-character account roster (`GD-047`), pre-world entry lifecycle, `S1` visual sequence, modular architecture, V01-B Core Kit & persistence (`TD-01` + `TD-05` HUD/visual bindings) | `IMPLEMENTED_TECHNICALLY_VERIFIED_PENDING_OWNER_VISUAL_REVIEW` | `S1-B1a`..`VISUAL-03-W` through `7b386ce` (`COMMITTED`); `HERO-ANIMSET-01` (`MISSING_APPROVED_HERO_INPUT` for 8-walk-frame Hero input), `ARCH-FOUNDATION-02`, `COREKIT-CANON-02`, `ARCH-COREKIT-R1`, and `S1-ENTRY-VISUAL-REBUILD-01` verified in working tree (`NO_COMMIT`) |
| `S1-A` | Character v0.2 migration plan & strict Design Evidence Matrix | `READ-ONLY PLAN / DESIGN EVIDENCE REVIEWED` | `NONE` (Read-only plan at base `39d71c0`) |
| `S1-B1a` | Pure Character, Destiny metadata & 18-entry realm level-band contracts | `COMMITTED` | `b04ebdc72ffede9edb678008ed30d002c73b5cc6` (`b04ebdc`) |
| `CTX-1` | Documentation reconciliation, `DOC SYNC` gate, Feature Ledger & Master Project Plan | `COMMITTED` | `0e9cc8d58618021a4c723efbc5fbc1860386b67c` (`0e9cc8d`) |
| `S1-B1b` | Pure `TD-01` numeric Character EXP/Level progression & candidate realm-scaled stat helpers | `COMMITTED` | `cb360e80e7801950b6fa954bf17f48e9b8306716` (`cb360e8`) |
| `S1-B2` | Database transaction infrastructure & atomic unit-of-work helpers | `COMMITTED` | `0543b7157264ce672d2582d0bfa0a071ba855a42` (`0543b71`) |
| `GOV-REPORT` | Persistent Antigravity review-handoff rule & reusable review packet exporter | `COMMITTED` | `f06c510d43049104d8feb76d4dcf4890ea0eea6c` (`f06c510`) |
| `GOV-REPORT-H1` | Review packet exporter hardening (untracked detection, path/reparse safety, clean `CLOSEOUT`) | `COMMITTED` | `0c00374cec4a489c523f5a8becb66bfa683210fa` (`0c00374`) |
| `GOV-FLOW-V2` | Streamlined 3-phase planner/executor workflow, impact-based verification matrix & status de-duplication | `COMMITTED` | `fdd8e8bbd315638c16f68180fb01868550aecc30` (`fdd8e8b`) |
| `S1-C` | Fresh Character v0.2 persistence foundation (`characters_v02` DDL & `CharacterV02Repository`; owner-approved fresh-start policy) | `COMMITTED` | `bf2d24ffdf51e64cb4fb2ff984a8c008dfd12aaa` (`bf2d24f`) |
| `S1-D` | Authoritative Character v0.2 server actions, server-generated guest credential bootstrap, Project Atlas V2 & explicit skill routing | `COMMITTED` | `897197a268f3c906ac624cac89fa65782a38b034` (`897197a`) |
| `S1-E` | Playable Character Creation, 16-trait Starter Destiny Catalog (`luc_hop_linh_cot` / `Lục Hợp Linh Cốt`), 4 appearances, [C] 6-attribute HUD & world spawn isolation (`TD-01` + `TD-05`) | `COMMITTED` | `a3de0549350e003019d17cef47833a8aa2943b38` (`a3de054`) |
| `PRE-S1F` | Modular-monolith source architecture (`SOURCE_ARCHITECTURE.md`), scope-based allowlists, selective Character/Destiny leaf refactor (`index.ts` `2100 -> 885`, `characterV02Actions.ts` `2037 -> 1778`, `hud.ts` `925 -> 660`) & `verify:doc-sync` | `COMMITTED` | `b82e20b148ad08544c3efd1003d1111364a45e51` (`b82e20b`) |
| `DOC-CLEAN-01` | Post-`PRE-S1F` doc reconciliation, legacy bootstrap archive (`docs/archive/legacy/*`) with locator stubs, bounded mechanical `verify:doc-sync` + fixture tests, and `VISUAL-01..03 -> S1-F` sequence | `COMMITTED` | `51d4caf2ae4ae101e41b0f31192a7319e06d965e` (`51d4caf`) |
| `VISUAL-01` → `VISUAL-02B-CORRECTION` | Owner-selected `V01-B` direction (`VISUAL-01`), `96×72` `Tân Thủ Thôn` blueprint (`VISUAL-02A-R1-CLOSE`), and `S1` Core Asset Kit with differentiated `phi_de` & `rmt_de` (`VISUAL-02B-CORRECTION`, `DEC-006`..`DEC-008`) | `OWNER_APPROVED_FOR_VISUAL_03_INTEGRATION` | Artifact packages (`NO_COMMIT`) |
| `VISUAL-03-P` | Integration Architecture & Camera/Minimap Contract (`CAMERA_AND_MINIMAP_CONTRACT.md`, `VISUAL_03_INTEGRATION_PLAN.md`) | `COMMITTED` | `4679f49bfc100374808f6ca6b1714bfaf31d8701` (`4679f49`) |
| `VISUAL-03-W` | World Integration, Camera & Minimap (`96×72` `tan_thu_thon.tmj`, `CameraView.ts`, `MinimapView.ts`, 11 `80×96` starter/NPC sprites, Y-sort occlusion, `resolveSafeZoneCoordinates`) | `COMMITTED` | `7b386cea7ef075c6f358539ddea155cd1634db5b` (`7b386ce`) |
| `HERO-ANIMSET-01` | Owner-approved active Desktop `hero_kiem_tu` (`DEC-009`, `ref.character.hero_kiem_tu@2.0.0-hero-animset-01`: `source_h04`..`source_h10`, on-disk 6-walk-frame `480×1920` `ecf6604b...`, `portrait_hero_kiem_tu.png` `1de6fc60...`; later 8-walk-frame Hero input tracked as `MISSING_APPROVED_HERO_INPUT` with `full_80x96_20row_8walk` profile support ready) | `OWNER_APPROVED_ACTIVE_DESKTOP_MASTER` (`MISSING_APPROVED_HERO_INPUT` for 8-walk-frame input) | `NO_COMMIT` (Base `7b386ce`) |
| `ARCH-FOUNDATION-02` | Full modular-monolith extraction (`packages/shared`, `packages/game-data`, `apps/server`, `apps/client`), static runtime packager (`package-runtime-assets.mjs`), architecture verifier (`verify-architecture.mjs`), gated `/api/test/advance-clock` & 20-session load verification | `TECHNICAL_ACCEPTANCE_COMPLETE` | `NO_COMMIT` (Base `7b386ce`) |
| `COREKIT-CANON-02` & `ARCH-COREKIT-R1` | Canonical V01-B Core Kit (`assets/corekit/v01b/catalog.json`, `runtimeAnimationProjection.json`), Batch A UI core import (`assets/ui/**`, `assets/ui/batch_a_ui_atlas_mapping.json`), dependency-backed cleanup (`334` deleted, `2` replaced in-place preview GIFs, `25` archived in `assets/archive/history/`), pure Core Kit validator (`validateCorekit.ts`), disabled procedural `build_assets.py` (exit `2`), and `ARCH-COREKIT-R1` validation/binding/DOC SYNC corrections | `TECHNICAL_CHECKPOINT_VERIFIED` | `NO_COMMIT` (Base `7b386ce`) |
| `VISUAL-03-U` & `VISUAL-03-Q` | Earlier modal-over-map UI/HUD pass (`REJECTED` by owner on visual review and rebuilt in `S1-ENTRY-VISUAL-REBUILD-01`) | `SUPERSEDED_BY_S1_ENTRY_VISUAL_REBUILD_01` | `NO_COMMIT` (Base `7b386ce`) |
| `S1-ENTRY-VISUAL-REBUILD-01` | Pre-world entry state machine (`TITLE -> ROSTER/CREATE -> DESTINY_ROLL -> ENTERING_WORLD -> IN_WORLD`), multi-character per account (`GD-047`, idempotent migration `multiCharacterV02Migration.ts`), HTTP roster/draft/roll/confirm/select routes, persisted zone/position resume, `[ESC]` System Menu, 5 native `V01-B` UI/presentation assets (`assets/ui/entry/*`, `assets/ui/presentation/*`), and true CSS 9-slice `border-image` S1 HUD/panels | `IMPLEMENTED_TECHNICALLY_VERIFIED_PENDING_OWNER_VISUAL_REVIEW` | `NO_COMMIT` (Base `7b386ce`) |
| `S1-F` | Final Slice `S1` closeout following owner visual review of `S1-ENTRY-VISUAL-REBUILD-01` | `PENDING_OWNER_VISUAL_REVIEW` | `NO_COMMIT` (Base `7b386ce`) |
| `S2`–`S8` | Remaining vertical slice implementation slices (`docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`) | `NOT STARTED` | `NONE` |

---

## 3. Detailed Task Records

### 3.1 `S0` — Foundation, PGlite Split-Brain Safety, `.env` Loader & Isolated E2E Verification
- **Associated Slice**: `S0` (`docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`)
- **Design & Technical References**: `docs/DEVELOPMENT_SETUP.md`, `docs/technical/TD01_MIGRATION_TESTS.md` (`APPROVED`)
- **Actual Implementation Scope**:
  - Implemented deterministic `resolvePgDataDir` in `apps/server/src/db.ts` (preserves existing legacy `apps/server/apps/server/data/pgdata` when only the legacy directory is initialized, uses canonical `apps/server/data/pgdata` on fresh setups, and fails closed with `SPLIT_BRAIN_PGDATA_DIR` if both are initialized).
  - Implemented `loadRepoEnvIfNeeded()` in `apps/server/src/index.ts` to load `<repo>/.env` without overriding explicitly exported environment variables, plus Windows path separator normalization for main-module startup detection.
  - Updated `tests/e2e/runPlaytest.ts` and `.gitignore` so E2E smoke tests run against `PGDATA_DIR=memory://` and write per-run captures to `artifacts/playtest/runs/<run-id>/` without overwriting tracked historical playtest screenshots (`artifacts/playtest/01_*.png`..`07_*.png`).
  - Verified non-destructive offline PGlite backup under `apps/server/data/backups/` and throwaway restore.
- **Changed Files & Verified Commit SHA**:
  - Commit: `6e38c246cabcd020efe137863838d6a61e7b1a72` (`6e38c24`)
  - Files: `.gitignore`, `apps/server/src/__tests__/server.test.ts`, `apps/server/src/db.ts`, `apps/server/src/index.ts`, `docs/DEVELOPMENT_SETUP.md`, `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `tests/e2e/runPlaytest.ts`
- **Tests & Verification Evidence**:
  - `npm run verify:assets` (exit `0`), `npm test` (`8/8` pass in `apps/server/src/__tests__/server.test.ts`, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (exit `0`), `npm run test:e2e` (exit `0`).
- **Known Limitations & Deferred Scope**:
  - Does not implement `Character v0.2` schema or migration (`S1-C`); does not add an environment guard to `POST /api/test/advance-clock` in `apps/server/src/index.ts` (tracked as a pre-deployment security gate in `docs/technical/AGENT_EXECUTION_CONTRACT.md` §5.3).
- **Current Status & Next Dependency**: `COMMITTED` (`6e38c24`) → `G0`.

---

### 3.2 `G0` — Agent Workflow Governance, 30-Skill Router & Argon Native Asset Profile
- **Associated Slice**: `G0` (Pre-`S1` Governance Gate)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rules 1–6), `docs/DECISIONS.md`, `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/TD_FREEZE_APPROVALS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, `docs/technical/TD_FREEZE_GATES.md` (`APPROVED`)
- **Actual Implementation Scope**:
  - Created `docs/technical/AGENT_EXECUTION_CONTRACT.md` defining single-owner `TD-01`..`TD-05` boundaries, read-only `PLAN` rules, fail-closed stop conditions, and future technical enforcement gates.
  - Created `docs/technical/AGENT_SKILL_ROUTER.md` classifying all 30 workspace skills in `.agents/skills/*/SKILL.md` (`ACTIVE (CORE)`, `ACTIVE (TASK-SCOPED)`, `ACTIVE (POST-PROCESSING SCRIPTS ONLY)`, `REFERENCE-ONLY`, `DISABLED FOR PRODUCTION`) and mapping verified repository paths per slice (`S0`–`S8`).
  - Created `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md` locking the Argon native `image-generator` master still + directional pose sheet workflow (`NATIVE_IMAGE_TOOL_DISCOVERED — END_TO_END_NOT_YET_VERIFIED`), banning external paid API/CLI/video/procedural `codeart2d` routes and whole-command `python packages/art-tools/build_assets.py` execution, and documenting current `packages/art-tools/verify_manifest.ts` enforcement scope.
- **Changed Files & Verified Commit SHA**:
  - Commit: `39d71c06a830f5f2d9ae2d64b09cb18aa3efebc4` (`39d71c0`)
  - Files: `.agents/skills/ai-art-production/SKILL.md`, `AGENTS.md`, `docs/CONTEXT_INDEX.md`, `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`
- **Tests & Verification Evidence**:
  - 40 frozen TD files verified (`0` diff lines vs `39c41a6`); `git diff --cached --check` (exit `0`), `npm run verify:assets` (exit `0`), `npm test` (`8/8` pass, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (exit `0`).
- **Known Limitations & Deferred Scope**:
  - Documentation and skill-instruction governance only; runtime command allowlisting, `packages/art-tools/build_assets.py` refactoring, and `packages/art-tools/verify_manifest.ts` portable-path/provider allowlist enforcement remain separately approved future tooling tasks.
- **Current Status & Next Dependency**: `COMMITTED` (`39d71c0`) → `S1-A`.

---

### 3.3 `S1-A` — Character v0.2 Migration Plan & Strict Design Evidence Matrix
- **Associated Slice**: `S1` (`TD-01` Planning & Source-Grounding Gate)
- **Design & Technical References**: `docs/DECISIONS.md` (`GD-001`, `GD-010`–`GD-018`, `GD-020`–`GD-023`, `GD-028`, `GD-044`), `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD01_MIGRATION_TESTS.md`, `docs/technical/TD_FREEZE_APPROVALS.md`
- **Actual Implementation Scope**:
  - Read-only source audit of `packages/shared/src/index.ts`, `packages/game-data/src/index.ts`, `apps/server/src/db.ts`, `apps/server/src/worldEngine.ts`, and `apps/server/src/zoneRoom.ts` against frozen `TD-01` specifications.
  - Established the `TD-01` Design Evidence Matrix separating `APPROVED` structural contracts from `DESIGN_BASELINE` candidate parameters (initial origin attributes `10` each, candidate EXP polynomial `100 + 30*L + 8*L*L + 2*max(0,L-350)^2`, candidate Destiny rarity weights `Phàm 50% / Hoàng 30% / Tiên 15% / Thần 5%`) and `PROPOSED` Destiny trait catalog entries (where only `Vạn Vị Đạo Thai` is `APPROVED` in `GD-016`), and identified that `apps/server/src/db.ts` currently lacks a general transaction wrapper (`withTransaction`), requiring `S1-B2` transaction infrastructure before `S1-C` schema migration.
- **Changed Files & Verified Commit SHA**:
  - Commit: `NONE` (Strictly read-only plan & evidence review at base `39d71c06a830f5f2d9ae2d64b09cb18aa3efebc4`).
- **Tests & Verification Evidence**:
  - Read-only Design Evidence Matrix accepted by project owner for source-grounding.
- **Known Limitations & Deferred Scope**:
  - Plan and evidence audit only; zero code or documentation files modified.
- **Current Status & Next Dependency**: `READ-ONLY PLAN / DESIGN EVIDENCE REVIEWED` → `S1-B1a`.

---

### 3.4 `S1-B1a` — Pure Character, Destiny Metadata & 18-Entry Realm Level-Band Contracts
- **Associated Slice**: `S1` (`TD-01` Pure Contracts Sub-Slice)
- **Design & Technical References**: `docs/DECISIONS.md` (`GD-001`, `GD-010`–`GD-016`, `GD-018`, `GD-020`–`GD-022`, `GD-028`, `GD-044`), `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`
- **Actual Implementation Scope**:
  - In `packages/shared/src/index.ts`: Preserved all existing `v0.1` symbols (`CanonicalRealmId`, `InventoryItemStack`, `QuestProgressState`, and all 24 existing fields of `CharacterSaveState`) and exported `BaseAttributeKey`, `BaseAttributes`, `CharacterCreationState`, `CharacterIdentity`, `CharacterLevelProgress` (`expTowardNext: string`), `DestinyRarity`, `DestinyKind`, `DestinyDefinitionMetadata` (metadata-only subset, reserving `DestinyDefinition` for future owner-approved modifier/effect contracts), `DestinyCollection`, independent `DestinyRollDraft` (not attached to `CharacterSaveState`), and optional `v0.2` extension fields on `CharacterSaveState`.
  - In `packages/game-data/src/index.ts`: Exported pure validators and helpers (`BASE_ATTRIBUTE_KEYS`, `isBaseAttributeKey`, `createZeroBaseAttributes`, `sumBaseAttributes`, `validateBaseAttributes`, `isNonNegativeDecimalIntString`, `parseExpDecimalString`, `formatExpDecimalString`, `validateCharacterLevelProgress`, single-point `allocateSingleAttributePoint`, `DESTINY_RARITIES`, `CANONICAL_LEGENDARY_NPC_IDS` excluding `merchant_truong`, `validateDestinyDefinitionMetadata`, `validateDestinyTripleIds`, `validateDestinyRollDraftShape`, `getOwnedDestinyTraitIds`, `hasOwnedDestinyTrait`, `validateDestinyCollection`, `getRealmLevelBand`, `isValidRealmStage`, `isLevelAllowedForRealm`, `isAtNonSaintMajorRealmLevelCap`, and `meetsMajorRealmBreakthroughLevelAndStagePrerequisite`).
  - In `apps/server/src/__tests__/td01Contracts.test.ts`: Added 6 deterministic unit-test cases using synthetic test-only Destiny metadata fixtures.
- **Changed Files & Verified Commit SHA**:
  - Commit: `b04ebdc72ffede9edb678008ed30d002c73b5cc6` (`b04ebdc`)
  - Files: `packages/shared/src/index.ts`, `packages/game-data/src/index.ts`, `apps/server/src/__tests__/td01Contracts.test.ts`
- **Tests & Verification Evidence**:
  - `git diff --check` (exit `0`), `npm run verify:assets` (exit `0`), `npm test` (`2` test files, `14/14` tests passing: `6` in `td01Contracts.test.ts` + `8` in `server.test.ts`, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (exit `0`), `npm run test:sim` (exit `0`).
- **Known Limitations & Deferred Scope**:
  - **Pure Contracts & Validators Only — Runtime `Character v0.2` Is NOT Implemented**:
    - Candidate numeric baselines (`origin = 10`, EXP polynomial curve, `Tu Vi` stage curves, Destiny `50/30/15/5` tier weights) are **not** locked or exported (`S1-B1b`).
    - Complete `DestinyDefinition` modifier/effect schemas, production Destiny trait catalog, and server CSPRNG rolling are **not** implemented. Accepting `"PROPOSED"` in `validateDestinyDefinitionMetadata` validates structural metadata shape for unit tests only and does **not** authorize `"PROPOSED"` traits for production roll or persistence.
    - At the `S1-B1a` checkpoint (`b04ebdc`), database transactions (`S1-B2`, later committed at `0543b71`), numeric helpers (`S1-B1b`, `cb360e8`), persistence (`S1-C`, `bf2d24f`), server actions (`S1-D`, `897197a`), and client/HUD (`S1-E`, `a3de054`) were deferred to subsequent sub-slices; `S1-F` (`E2E ACCEPTANCE`) remains **`NOT IMPLEMENTED`**.
- **Current Status & Next Dependency**: `COMMITTED` (`b04ebdc`) → `CTX-1` → owner decision on `S1-B1b` / `S1-B2`.

---

### 3.5 `CTX-1` — Documentation Reconciliation, `DOC SYNC` Gate, Feature Ledger & Master Project Plan
- **Associated Slice**: `CTX-1` (Cross-Slice Governance & Context Synchronization Checkpoint)
- **Design & Technical References**: `AGENTS.md`, `RULES.md`, `docs/CONTEXT_INDEX.md`, `docs/DECISIONS.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`
- **Actual Implementation Scope**:
  - Created `docs/implementation/FEATURE_LEDGER.md` and `docs/MASTER_PROJECT_PLAN.md`.
  - Upgraded `docs/technical/AGENT_EXECUTION_CONTRACT.md` with the 9-stage `PLAN → BUILD → REVIEW → VERIFY → DOC SYNC → CONTEXT CONSISTENCY CHECK → OWNER APPROVAL → COMMIT/PUSH → REMOTE CLOSEOUT` workflow, separate Code vs Documentation Allowlists, mandatory Documentation Impact Assessment, `DOC_SYNC_DEFERRED` tracking, and Two-Phase Remote Closeout SHA rules.
  - Reconciled status classifications across `AGENTS.md`, `docs/CONTEXT_INDEX.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, `docs/ROADMAP.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, and `.agents/skills/ai-art-production/SKILL.md`.
  - Fixed two stale `Candidate A` subdirectory reference paths to point to the verified existing file `assets/concepts/candidate_a_classic_xianxia.jpg` in `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md` and `.agents/skills/ai-art-production/SKILL.md`.
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `b04ebdc72ffede9edb678008ed30d002c73b5cc6` (`b04ebdc`)
  - Commit: `0e9cc8d58618021a4c723efbc5fbc1860386b67c` (`0e9cc8d`, `docs(ctx-1): synchronize project context and add documentation lifecycle`)
  - Files (11 Documentation Allowlist paths; `0` code paths): `docs/implementation/FEATURE_LEDGER.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `AGENTS.md`, `docs/CONTEXT_INDEX.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, `docs/ROADMAP.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `.agents/skills/ai-art-production/SKILL.md`
- **Tests & Verification Evidence**:
  - 40 frozen TD files verified (`0` diff lines vs `39c41a6`); path validation check (`0` missing repo paths); stale status and `Candidate A` path checks (`0` violations); `git diff --check` (exit `0`), `npm run verify:assets` (exit `0`), `npm test` (`14/14` pass, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (exit `0`).
- **Known Limitations & Deferred Scope**:
  - Updates documentation and governance instructions only; CI-enforced `DOC SYNC` automation is not yet implemented.
- **Current Status & Next Dependency**: `COMMITTED` (`0e9cc8d`) → `S1-B2`.

---

### 3.6 `S1-B2` — Database Transaction Infrastructure & Atomic Unit-of-Work Helpers
- **Associated Slice**: `S1` (`TD-01` Transaction Infrastructure Sub-Slice)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rules 1, 3), `docs/systems/CHARACTER.md`, `docs/technical/TD01_MIGRATION_TESTS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, `docs/technical/TD_FREEZE_GATES.md`
- **Actual Implementation Scope**:
  - In `apps/server/src/db.ts`:
    - Exported `TransactionErrorCode`, `TransactionUsageError`, `SqlQueryRunner`, `SqlTransaction`, `SqlExecutor`, `PGliteTransactionDriverLike`, `PGliteDriverLike`, `PgPoolClientLike`, and `PgPoolLike`.
    - Implemented per-instance `TransactionContextGuard` using `AsyncLocalStorage` and a `WeakSet<SqlTransaction>` runner registry to forbid nested `withTransaction` and `close()` calls inside an active transaction context (`NESTED_TRANSACTION_FORBIDDEN`), reject root `query` and `init()` calls or `GameDatabase` helper calls omitting `tx` inside an active transaction context (`MISSING_TRANSACTION_RUNNER`), and enforce strict explicit-runner ownership, liveness, and active-context matching (`FOREIGN_TRANSACTION_RUNNER`, `TRANSACTION_CLOSED`, `MISMATCHED_TRANSACTION_RUNNER`).
    - Implemented `ManagedTransactionRunner` with a non-`async` `query()` returning the tracked caller promise directly, fail-closed manual transaction-control SQL misuse rejection (`FORBIDDEN_TRANSACTION_CONTROL_SQL`, rejecting SQL comments `--` / `/*` / `*/`, multi-statement semicolons `;`, and transaction-control prefixes before reaching either transaction driver), pending-at-exit query drain (`UNWAITED_TRANSACTION_QUERY`), swallowed SQL error detection (`TRANSACTION_ABORTED_BY_QUERY_ERROR`), and primary callback error precedence.
    - Implemented `PGliteAdapter` with a per-adapter FIFO `rootOpTail` queue, dual poison guards at both submission and dequeue (`ADAPTER_POISONED`), `rollbackSentinel` outcome classification around `db.transaction()`, and `waitReady`-aware `close()` teardown (`DATABASE_CLOSING`, `DATABASE_CLOSED`) that preserves `ADAPTER_POISONED` diagnostics.
    - Implemented `PgPoolAdapter` with single `PoolClient` checkout per transaction, `releaseClientOnce` guarantee, broken-client disposal on `BEGIN`/`COMMIT`/`ROLLBACK` protocol errors, and `activeRootOps` drain before `pool.end()`.
    - Extended `GameDatabase` with `withTransaction`, `resolveQueryRunner(tx)`, `init()` root guard, and optional `tx?: SqlTransaction` threading on `loadOrCreateCharacter`, `getCharacterByAccount`, `saveCharacterState`, `checkIdempotency`, `recordIdempotency`, and `logEconomyEvent`, while preserving `getDataDir(): string | null` and unchanged legacy behavior when `tx` is omitted outside a transaction.
  - In `apps/server/src/__tests__/dbTransactions.test.ts`: Added 9 deterministic integration/unit test cases (`T01`–`T09`) including negative transaction-control SQL bypass coverage (`/* note */ COMMIT`, `SELECT 1; COMMIT;`, `-- note\nROLLBACK` never reaching `PGliteAdapter` or `PgPoolAdapter` transaction drivers and never permitting an early `COMMIT`) plus child-process `runSupervisedNodeProbe` / `runTempDirGuardedProbe` deadlock protection and negative child-process lifecycle coverage (confirming child termination strictly via `exit` or `close` events so post-spawn `error` without `exit`/`close` never sets `exitConfirmed`, preserving temporary PGlite directories on uncertain child termination, collecting `stdout`/`stderr` through `close` with bounded fallback, and testing all 5 probe lifecycle paths).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `0e9cc8d58618021a4c723efbc5fbc1860386b67c` (`0e9cc8d`)
  - Commit: `0543b7157264ce672d2582d0bfa0a071ba855a42` (`0543b71`, `feat(s1-b2): add guarded database transaction infrastructure`)
  - Files (2 Code Allowlist paths + 8 Documentation Allowlist paths): `apps/server/src/db.ts`, `apps/server/src/__tests__/dbTransactions.test.ts`, `docs/implementation/FEATURE_LEDGER.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, `docs/MASTER_PROJECT_PLAN.md`, `AGENTS.md`, `docs/CONTEXT_INDEX.md`, `docs/ROADMAP.md`, `docs/technical/AGENT_SKILL_ROUTER.md`
- **Tests & Verification Evidence**:
  - `git diff --check` (exit `0`), `npm run verify:assets` (exit `0`), `npm test` (`3` test files, `23/23` test cases passing: `6` in `td01Contracts.test.ts`, `8` in `server.test.ts`, `9` in `dbTransactions.test.ts`, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (exit `0`); standard `npm run test:e2e` aborted at port preflight (`assertPortFree(5173)`, exit `1`) due to an existing external dev server on `2567`/`5173`, and the isolated `memory://` E2E succeeded using a temporary adapted runner on ports `2589`/`5189` (exit `0`, `playtestStatus: "ALL_GATES_PASSED"`); `LIVE_PG_INTEGRATION: NOT_RUN (non-blocking for S1-B2)`.
- **Known Limitations & Deferred Scope**:
  - **Transaction Infrastructure Only — Runtime `Character v0.2` & Schema Migration Are NOT Implemented**:
    - Existing `accounts`, `characters`, `idempotency_ledger`, and `economy_audit_log` DDL and columns in `apps/server/src/db.ts` are unchanged.
    - At the `S1-B2` checkpoint (`0543b71`), `S1-B1b` (later committed at `cb360e8`), `S1-C` (`bf2d24f`), `S1-D` (`897197a`), and `S1-E` (`a3de054`) were deferred to subsequent sub-slices; `S1-F` (`E2E ACCEPTANCE, NOT IMPLEMENTED`) and Slices `S2`–`S8` (`NOT STARTED`) remain **`NOT IMPLEMENTED`**.
- **Current Status & Next Dependency**: `COMMITTED` (`0543b71`) → `GOV-REPORT` / `S1-B1b` or `S1-C`.

---

### 3.7 `GOV-REPORT` — Persistent Review Handoff Rule & Reusable Review Packet Exporter
- **Associated Slice**: `GOV-REPORT` (Cross-Slice Governance & Review Handoff Tooling)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rule 1), `docs/technical/AGENT_EXECUTION_CONTRACT.md`
- **Actual Implementation Scope**:
  - Created `.agents/rules/review-handoff.md` (`trigger: always_on`) enforcing concise chat reporting (no full source, long diff, or raw log dumps in chat), mandatory pre-review packet generation via `scripts/export-review-packet.ps1`, truthful verification reporting, strict owner approval gates, and explicit listing of the review packet ZIP path, SHA-256, and contents for independent ChatGPT review.
  - Created `scripts/export-review-packet.ps1`, a dependency-free Windows PowerShell helper that generates `<TASK_ID>_REVIEW_PACKET.zip` under the system temporary directory outside the Git working tree, packaging `<TASK_ID>_tracked_diff.patch` (byte-preserving UTF-8 via `git diff --binary --output`), explicitly selected new/untracked files (`-NewFiles`), `<TASK_ID>_verification_evidence.md` (or `<TASK_ID>_plan.md` for `PLAN` stage), and `<TASK_ID>_manifest.json` (UTF-8 without BOM), while failing closed on invalid task IDs, missing evidence files, sensitive/forbidden paths (`.env`, `pgdata`, `.git`, `node_modules`, secrets/databases), or archive SHA-256 mismatches, and verifying that the Git index and working tree remain unchanged.
  - Synchronized `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/implementation/FEATURE_LEDGER.md`, and `docs/PROJECT_STATUS.md` (including backfilling `S1-B2`'s verified remote commit SHA `0543b71`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `0543b7157264ce672d2582d0bfa0a071ba855a42` (`0543b71`)
  - Commit: `f06c510d43049104d8feb76d4dcf4890ea0eea6c` (`f06c510`, `chore(gov-report): add concise review handoff rule and review packet exporter`)
  - Files: `.agents/rules/review-handoff.md`, `scripts/export-review-packet.ps1`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/PROJECT_STATUS.md`
- **Tests & Verification Evidence**:
  - Positive & negative smoke tests of `scripts/export-review-packet.ps1` (valid ZIP creation, real UTF-8 Git patch + Vietnamese character preservation, explicitly selected new files, matching per-entry SHA-256 verification against `<TASK_ID>_manifest.json`, `PLAN`-mode validation, and fail-closed rejection of nonexistent files, invalid task IDs, `.env`, `pgdata`, `node_modules`, `.git`, and in-repo output directories while leaving Git index/working tree untouched); `git diff --check` (exit `0`), `npm run verify:assets` (exit `0`), `npm test` (`23/23` pass, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (exit `0`).
- **Known Limitations & Deferred Scope**:
  - Governance and review-packaging tooling only; three P2 exporter limitations hardened in `GOV-REPORT-H1` (§3.8).
- **Current Status & Next Dependency**: `COMMITTED` (`f06c510`) → `GOV-REPORT-H1`.

---

### 3.8 `GOV-REPORT-H1` — Review Packet Exporter Hardening (`FIX 1`, `FIX 2`, `FIX 3`)
- **Associated Slice**: `GOV-REPORT-H1` (Targeted Exporter Hardening & Disposable Fixture Test Suite)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rule 1), `.agents/rules/review-handoff.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`
- **Actual Implementation Scope**:
  - **FIX 1 (`MISSING_UNTRACKED_TASK_FILE` & `-TaskAllowlist`)**: Added Git status cross-checking (`git status --porcelain=v1 -uall`) and `-TaskAllowlist` validation in `scripts/export-review-packet.ps1` so any `??` untracked file in the working tree or `-TaskAllowlist` omitted from `-NewFiles` fails closed with `MISSING_UNTRACKED_TASK_FILE`, unapproved changed files fail closed with `UNAPPROVED_TASK_FILE`, and unrelated untracked files are never silently packaged.
  - **FIX 2 (Canonical Path Boundaries, Reparse-Point Chain Guards & Scoped `-AdditionalFiles`)**: Added `Assert-NoReparsePointChain` (walking ancestor chains to reject symlinks, junctions, and reparse points across inputs, repo paths, and output directories), `Resolve-ApprovedExistingFile` (disallowing arbitrary external `-AdditionalFiles` and `-EvidenceFile`/`-PlanFile` paths outside canonical repository and trusted temporary/artifact evidence roots), `Assert-SafeArchiveEntryPath` (preventing ZIP entry traversal and collisions), duplicate input/leaf-name rejection (`DUPLICATE_INPUT_FILE`, `DUPLICATE_ADDITIONAL_FILE`), and explicit `contentSafetyDisclaimer` metadata noting that path validation does not guarantee arbitrary file contents are free of secrets.
  - **FIX 3 (Clean `CLOSEOUT` Packet Mode)**: Added `-Stage CLOSEOUT` support on a clean working tree (`-CloseoutCommit`, `-RemoteName`, `-RemoteBranch`, `-ExpectedRemoteSha`), generating `<TASK_ID>_tracked_diff.patch` and changed-file lists from the commit against its verified first parent, verifying remote SHA via read-only `git ls-remote` (and local tracking ref when present) without pushing or mutating history, recording `localCommitSha`, `parentSha`, and `verifiedRemoteSha` in `<TASK_ID>_manifest.json`, and failing closed on dirty trees or remote SHA mismatches.
  - Created `scripts/tests/export-review-packet.test.ps1` (`17` disposable-fixture positive and negative test cases outside the live repository).
  - Updated `.agents/rules/review-handoff.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, and `docs/implementation/FEATURE_LEDGER.md` (including backfilling `GOV-REPORT` commit `f06c510`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `f06c510d43049104d8feb76d4dcf4890ea0eea6c` (`f06c510`)
  - Commit: `0c00374cec4a489c523f5a8becb66bfa683210fa` (`chore(gov-report-h1): harden review packet exporter and add fixture tests`)
  - Files: `scripts/export-review-packet.ps1`, `scripts/tests/export-review-packet.test.ps1`, `.agents/rules/review-handoff.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/implementation/FEATURE_LEDGER.md`
- **Tests & Verification Evidence**:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/tests/export-review-packet.test.ps1` (`17/17` disposable-fixture tests `ALL_PASSED`, exit `0`), `git diff --check` (exit `0`), `npm run verify:assets` (exit `0`), `npm test` (`3` suites, `23/23` tests passing, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (exit `0`), `LIVE_PG_INTEGRATION: NOT_RUN`.
- **Known Limitations & Historical DOC SYNC Deferral**:
  - At the GOV-REPORT-H1 checkpoint, PROJECT_STATUS synchronization was deferred because it was outside that task allowlist. This later docs reconciliation backfills the verified GOV-REPORT and GOV-REPORT-H1 commit identities; the original command results above remain historical evidence.
  - Path, root, and reparse-point validation does not guarantee arbitrary file contents are free of secrets. Does not implement `S1-B1b` or `S1-C` gameplay/database changes.
- **Current Status & Next Dependency**: `COMMITTED` (`0c00374`) → `GOV-FLOW-V2`.

---

### 3.9 `GOV-FLOW-V2` — Streamlined Planner/Executor Workflow & Impact-Based Verification Policy
- **Associated Slice**: `GOV-FLOW-V2` (Cross-Slice Workflow & Governance Documentation Amendment)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rules 1–6), `.agents/rules/review-handoff.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`
- **Actual Implementation Scope**:
  - Applied `GOV_FLOW_V2_DOCS_ONLY.patch` and completed closeout across the 14-file Documentation Allowlist (`AGENTS.md`, `.agents/rules/review-handoff.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, `docs/CONTEXT_INDEX.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/ROADMAP.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/DEVELOPMENT_SETUP.md`, `docs/WORKSPACE_HANDOFF.md`, `START_HERE.md`, `docs/CONTENT_PIPELINE.md`).
  - Installed the 3-phase operating model (Owner + Planner dispatch → autonomous Argon execution with self-review, impact-based verification matrix, and in-task `DOC SYNC` → concise closeout under the task card's explicit commit policy), removed routine per-task planner review and mandatory per-stage ZIP gates (preserving `scripts/export-review-packet.ps1` for explicit requests or external evidence transfer), de-duplicated changing task status from routing/navigation docs, and backfilled `GOV-REPORT` (`f06c510d43049104d8feb76d4dcf4890ea0eea6c`) and `GOV-REPORT-H1` (`0c00374cec4a489c523f5a8becb66bfa683210fa`) in `docs/PROJECT_STATUS.md`.
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `0c00374cec4a489c523f5a8becb66bfa683210fa` (`0c00374`)
  - Commit: `fdd8e8bbd315638c16f68180fb01868550aecc30` (`fdd8e8b`, `docs(gov-flow-v2): install streamlined planner-executor workflow and sync status`)
  - Files (`14` Documentation Allowlist paths; `0` code paths): `.agents/rules/review-handoff.md`, `AGENTS.md`, `START_HERE.md`, `docs/CONTENT_PIPELINE.md`, `docs/CONTEXT_INDEX.md`, `docs/DEVELOPMENT_SETUP.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/WORKSPACE_HANDOFF.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`
- **Tests & Verification Evidence**:
  - Docs-only verification profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2): `git apply --check --whitespace=error-all` (`PASS`, exit `0`), `git diff --check` (exit `0`), changed paths strictly within the 14-file Documentation Allowlist (`0` code/test/script/asset edits), 40 frozen TD files verified against `39c41a6ddb77b93284c56da7ec053f4309ee4943` and `BASELINE_VERIFICATION.json` (`40/40` blob hashes unchanged, `0` diffs), new/changed path and command references verified against repository source (`PASS`). Runtime/test/build/E2E/DB checks: `NOT_APPLICABLE` (documentation-only amendment; prior `scripts/tests/export-review-packet.test.ps1` `17/17 PASS` at `0c00374` remains unchanged historical evidence, not rerun).
- **Known Limitations & Deferred Scope**:
  - Documentation and operating-workflow amendment only; does not implement `S1-B1b` or `S1-C`..`S1-F` runtime `Character v0.2` gameplay or database migration.
- **Current Status & Next Dependency**: `COMMITTED` (`fdd8e8b`) → `S1-B1b`.

---

### 3.10 `S1-B1b` — Pure Numeric Progression & Candidate Stat Simulation Foundation
- **Associated Slice**: `S1` (`TD-01` Pure Numeric Progression & Candidate Stat Sub-Slice)
- **Design & Technical References**: `docs/DECISIONS.md` (`GD-020`, `GD-021`, `GD-022`, `GD-028`, `GD-044`), `docs/systems/CULTIVATION.md` (§2–§5), `docs/systems/CHARACTER.md` (§3–§5), `docs/technical/TD01_SIMULATION.md` (§1–§3), `docs/technical/TD_FREEZE_GATES.md`
- **Actual Implementation Scope**:
  - Created `packages/game-data/src/td01Numeric.ts` and re-exported its public API from `packages/game-data/src/index.ts`.
  - Implemented pure integer-safe `BigInt` Character EXP cost helpers (`computeCandidateExpToNextLevel`, `getCandidateExpToNextLevelBigInt`, `getCandidateExpToNextLevelDecimal`, `computeCandidateTotalExpForLevelSpan`) for `expToNext(L) = 100 + 30*L + 8*L*L + 2*max(0,L-350)^2` within `NUMERIC(38,0)` (`MAX_SUPPORTED_EXP_BIGINT`) software safety bounds.
  - Implemented pure Character EXP grant progression (`applyCandidateCharacterExpGrant`) reusing `CharacterLevelProgress` and realm level-band contracts (`getRealmLevelBand`, `isLevelAllowedForRealm`, `isAtNonSaintMajorRealmLevelCap`), enforcing `+1` free base-attribute point per actual Level gained, non-Saint major realm Level caps (`Phàm Nhân` Lv10, `Luyện Khí` Lv30, etc.), candidate no-banking overflow disposal (`expTowardNext = "0"` on reaching or while at a non-Saint cap), post-breakthrough boundary progression (e.g. `Luyện Khí` Lv10 → Lv11), and unlimited `Thánh Cảnh` progression (`Lv 350 -> 351+`) without mutating inputs or coupling to `Tu Vi`.
  - Implemented pure candidate realm-stage factor and baseline derived-stat projection helpers for simulation (`createCandidateOriginBaseAttributes`, `computeCandidateRealmStageFactor`, `getCandidateRealmStageFactor`, `computeCandidateEffectiveBaseAttributes`, `computeCandidateDerivedStatsFromEffectiveAttributes`, `computeCandidateBaselineStatSnapshot`), explicitly tagged as `DESIGN_BASELINE` (`TD01_CANDIDATE_RULESET_VERSION = "td01-candidate-v0.3"`, `TD01_CANDIDATE_NUMERIC_APPROVAL_STATE = "DESIGN_BASELINE"`), while preserving existing legacy `Tu Vi` stage curves (`getRealmRequiredTuVi`, `getNextRealmAndStage`, `computeOfflineMeditationReward`) and runtime combat untouched.
  - Added `apps/server/src/__tests__/td01Numeric.test.ts` (`11` deterministic test cases covering `TD01_SIMULATION.md` EXP/factor/stat samples, `Lv1..10000` monotonicity, `Lv1->10 = 4530`, multi-level grants, `Phàm Nhân` Lv10 & `Luyện Khí` Lv30 caps + overflow disposal, post-breakthrough `Lv10->11`, `Thánh Cảnh` `Lv350->351+`, `BigInt` precision above `Number.MAX_SAFE_INTEGER`, realm-factor monotonicity across all 18 realms, input immutability, and fail-closed rejection of invalid inputs).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `fdd8e8bbd315638c16f68180fb01868550aecc30` (`fdd8e8b`)
  - Commit: `cb360e80e7801950b6fa954bf17f48e9b8306716` (`cb360e8`, `feat(s1-b1b): add TD-01 pure numeric progression and candidate stat helpers`)
  - Files (`3` Code Allowlist paths + `2` Documentation Allowlist paths): `packages/game-data/src/td01Numeric.ts`, `packages/game-data/src/index.ts`, `apps/server/src/__tests__/td01Numeric.test.ts`, `docs/implementation/FEATURE_LEDGER.md`, `docs/PROJECT_STATUS.md`
- **Tests & Verification Evidence**:
  - `PURE CONTRACTS / NUMERIC` verification profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2): `npx vitest run apps/server/src/__tests__/td01Numeric.test.ts apps/server/src/__tests__/td01Contracts.test.ts` (`2` test files, `17/17` tests passing: `11` in `td01Numeric.test.ts` + `6` in `td01Contracts.test.ts`, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (including `npm run verify:assets`, exit `0`), `git diff --check` (exit `0`), 40 frozen TD files verified (`0` modified). Non-applicable checks (`dbTransactions.test.ts` / `server.test.ts` / `export-review-packet.test.ps1` / `test:e2e` / live PostgreSQL): `NOT_RUN` / reused prior passing evidence at unchanged inputs (`0543b71` for `db.ts`, `0c00374` for exporter).
- **Known Limitations & Deferred Scope**:
  - **Pure Numeric & Candidate Simulation Helpers Only — Runtime `Character v0.2` & Production Balance Are NOT Implemented**:
    - The EXP polynomial (`100 + 30*L + 8*L*L + 2*max(0,L-350)^2`), origin attribute value (`10`), candidate realm factor (`1.50^r * [1 + 0.30*(s-1)/max(1,n-1)]`), derived stat coefficients, and non-Saint cap overflow disposal remain `DESIGN_BASELINE` simulation candidates, not owner-approved final production balance.
    - Does not implement equipment/Destiny/technique/buff modifier pipelines, combat damage formulas (`TD-02`), Destiny rarity weight rolling (`GD-017`), event authorization/idempotency/persistence, `S1-C` (`SCHEMA / BACKUP / MIGRATION`), `S1-D` (`AUTHORITATIVE SERVER ACTIONS`), `S1-E` (`CLIENT/HUD`), or `S1-F` (`E2E ACCEPTANCE`).
- **Current Status & Next Dependency**: `COMMITTED` (`cb360e8`) → `S1-C`.

---

### 3.11 `S1-C` — Fresh Character v0.2 Persistence Foundation
- **Associated Slice**: `S1` (`TD-01` Persistent Schema & Repository Sub-Slice)
- **Design & Technical References**: `docs/DECISIONS.md` (`GD-001`, `GD-010`–`GD-018`, `GD-020`–`GD-022`, `GD-028`, `GD-044`), `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_MIGRATION_TESTS.md`, `docs/technical/TD_FREEZE_GATES.md`
- **Owner-Approved Fresh-Start Policy & Local PGlite Handling**:
  - The project owner explicitly approved a **FRESH START policy** for `Character v0.2`: existing `v0.1` prototype character saves have no gameplay value, so `S1-C` does not implement legacy-character backfill, progression preservation, compensation, or compatibility conversion, while keeping the 40 frozen Technical Design files untouched.
  - Local development PGlite inspection verified that canonical `apps/server/data/pgdata` is uninitialized, while legacy nested `apps/server/apps/server/data/pgdata` is initialized and actively held by a live local dev server process (`PID 8752` listening on port `2567`). Per `docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2 and `S1-C` database safety rules, the running owner process was not terminated and neither `apps/server/apps/server/data/pgdata` nor `apps/server/data/backups/` was deleted while in active use. Instead, `characters_v02` initializes as a dedicated fresh v0.2 table in `GameDatabase.init()` alongside the temporarily preserved legacy `v0.1` `characters` table (until `S1-D` cuts runtime handlers over), and all verification runs in isolated `memory://` and temporary throwaway file-backed PGlite directories.
- **Actual Implementation Scope**:
  - Created `apps/server/src/characterV02Repository.ts` and wired it into `apps/server/src/db.ts` (`GameDatabase.init()`, `GameDatabase.charactersV02`, `createCharacterV02`, `getCharacterV02ById`, `getCharacterV02ByAccount`, `updateCharacterV02`).
  - Defined `CHARACTERS_V02_TABLE_DDL` (`CREATE TABLE IF NOT EXISTS characters_v02`) with `character_id TEXT PRIMARY KEY`, `account_id TEXT UNIQUE NOT NULL REFERENCES accounts(account_id)`, `creation_state` (`'draft' | 'confirmed'`), optimistic concurrency `revision INTEGER NOT NULL CHECK (revision >= 1)`, `schema_version = 2`, `ruleset_version`, `level`, `exp_toward_next NUMERIC(38, 0)`, `free_attribute_points`, `allocated_attributes_json`, `earned_permanent_attributes_json`, `realm_id`, `realm_stage`, `tu_vi NUMERIC(38, 0)`, Destiny columns (`innate_destiny_json`, `innate_confirmed_at_ms`, `acquired_destiny_ids_json`, `active_acquired_slots_json`, `destiny_collection_revision`) with a SQL `CHECK` constraint enforcing `draft` vs `confirmed` innate state, `current_hp` / `current_mp` (with **zero redundant `max_hp` / `max_mp` / `attack` / `defense` columns**), and world/economy state columns.
  - Implemented `validateCharacterV02PersistedState`, `createInitialCharacterV02State`, `hydrateCharacterV02Row` (using `exp_toward_next::text` and `tu_vi::text` for lossless 38-digit decimal-string round-tripping), and `CharacterV02Repository` (`createCharacter`, `getByCharacterId`, `getByAccountId`, `updateCharacter`), integrating directly with `S1-B2`'s `withTransaction` / `resolveQueryRunner(tx)` and enforcing unique `characterId`/`accountId`, `expectedRevision` optimistic concurrency (`SELECT ... FOR UPDATE`), immutable `accountId`/`createdAtMs`, immutable confirmed `creationState`, and immutable confirmed 3-slot `Tiên Thiên` innate Destiny tuple.
  - Created `apps/server/src/__tests__/characterV02Persistence.test.ts` (`8` isolated unit/integration test cases covering idempotent DDL without redundant derived stat columns, draft creation and confirmation transition, file-backed PGlite close/reopen with 38-digit decimal `expTowardNext`/`tuVi`, duplicate `characterId`/`accountId` rejection, concurrency and confirmed `Tiên Thiên` immutability, validation failure paths, transactional rollback + `MISSING_TRANSACTION_RUNNER` enforcement, and coexistence with legacy `v0.1` `characters`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `cb360e80e7801950b6fa954bf17f48e9b8306716` (`cb360e8`)
  - Commit: `bf2d24ffdf51e64cb4fb2ff984a8c008dfd12aaa` (`bf2d24f`, `feat(s1-c): add fresh character v0.2 persistence foundation`)
  - Files (`3` Code Allowlist paths + `3` Documentation Allowlist paths): `apps/server/src/db.ts`, `apps/server/src/characterV02Repository.ts`, `apps/server/src/__tests__/characterV02Persistence.test.ts`, `docs/implementation/FEATURE_LEDGER.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`
- **Tests & Verification Evidence**:
  - `DB / TRANSACTION / PERSISTENCE` verification profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2): `npm test` (`5` test suites, `42/42` tests passing: `8` in `characterV02Persistence.test.ts`, `9` in `dbTransactions.test.ts`, `8` in `server.test.ts`, `11` in `td01Numeric.test.ts`, `6` in `td01Contracts.test.ts`, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (including `npm run verify:assets`, exit `0`), `git diff --check` (exit `0`), 40 frozen TD files verified (`0` modified). Non-applicable checks (`test:e2e` / live external PostgreSQL): `NOT_RUN`.
- **Known Limitations & Deferred Scope**:
  - **Persistence Foundation Only — Runtime `Character v0.2` Gameplay Is NOT Yet Wired**:
    - `worldEngine.ts`, `zoneRoom.ts`, and `hud.ts` still use the legacy `v0.1` `characters` table until `S1-D` (`AUTHORITATIVE SERVER ACTIONS`) and `S1-E` (`CLIENT/HUD`).
    - At the `S1-C` checkpoint (`bf2d24f`), `S1-D` Colyseus handlers (later committed at `897197a`) and `S1-E` client/HUD + 16-trait starter catalog (`a3de054`) were deferred to subsequent sub-slices; `S1-F` E2E acceptance remains **`NOT IMPLEMENTED`**.
- **Current Status & Next Dependency**: `COMMITTED` (`bf2d24f`) → `S1-D`.

---

### 3.12 `S1-D` — Character v0.2 Authoritative Server Actions, Guest Credential Bootstrap, Project Atlas V2 & Skill Routing
- **Associated Slice**: `S1` (`TD-01` Authoritative Server Actions Sub-Slice + Project Atlas V2 + Skill Routing)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rules 1, 2, 3), `docs/DECISIONS.md` (`GD-010`–`GD-018`, `GD-020`–`GD-023`, `GD-028`, `GD-044`), `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, `docs/technical/TD_FREEZE_GATES.md`, `.agents/skills/mmorpg-server-integrity/SKILL.md`
- **Actual Implementation Scope**:
  - **Part A — Authoritative Character v0.2 Server Actions & Server-Generated Guest Credential Bootstrap**:
    - Extended `packages/shared/src/index.ts` with `Character v0.2` protocol payloads and `v02_*` message contracts (`GuestAuthBootstrapResponse`, `CharacterV02SnapshotPayload`, `CharacterV02ActionCode`, `CharacterV02CreateDraftIntent`, `CharacterV02RollInnateDestinyIntent`, `CharacterV02ConfirmInnateDestinyIntent`, `CharacterV02AllocateAttributePointIntent`, `CharacterV02EquipAcquiredDestinyIntent`, `CharacterV02UnequipAcquiredDestinyIntent`, `CharacterV02ActionResultPayload`, `v02_snapshot`, `v02_action_result`) while keeping all legacy `v0.1` symbols intact.
    - Created `apps/server/src/guestIdentity.ts` (`GUEST_CREDENTIALS_TABLE_DDL` + `GuestIdentityService`) and exposed `POST /api/v02/auth/guest` in `apps/server/src/index.ts`. The server generates a 256-bit CSPRNG `guestToken`, stores only its SHA-256 digest in `guest_credentials(account_id, token_sha256, created_at_ms, last_seen_at_ms)`, and binds `ZoneRoom` `v0.2` sessions strictly from the verified `options.guestToken` (`authenticatedV02AccountId`), never trusting client-supplied `accountId` for `Character v0.2` operations.
    - Created `apps/server/src/characterV02Actions.ts` (`CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL`, `APPROVED_PRODUCTION_DESTINY_CATALOG` containing only owner-approved `van_vi_dao_thai`, `rollInnateDestinyTripleFromCatalog`, `toCharacterV02Snapshot`, and `CharacterV02ActionService`) and wired it into `apps/server/src/db.ts` and `apps/server/src/zoneRoom.ts`.
    - Implemented authoritative handlers for `createCharacterDraft`, `rollInnateDestiny` (using `crypto.randomInt` CSPRNG, full-trio rerolls with zero slot locking per `GD-010`/`GD-011`, candidate `50/30/15/5` tier weights + `60/40` `Thần` ordinary/signature split, and fail-closed `CATALOG_NOT_READY` on the current 1-trait production catalog until >= 3 `APPROVED` innate traits exist), `confirmInnateDestiny` (consuming single-use server-issued `rollNonce` from `character_v02_roll_drafts` and locking the 3-slot `Tiên Thiên` tuple immutably), `allocateAttributePoint` (`+1` free point per request via `allocateSingleAttributePoint`, `GD-021`), `equipAcquiredDestinyTrait` / `unequipAcquiredDestinyTrait` (3 active `Hậu Thiên` slots from owned `acquiredTraitIds`, `GD-013`), and server-only `grantAcquiredDestinyTraitServerOnly` (enforcing at-most-1-of-10 Legendary Signature ownership across innate + acquired traits per `GD-014`/`GD-018`) and `awardCharacterExpServerOnly` (using `applyCandidateCharacterExpGrant` with `Phàm Nhân` Lv10 cap and candidate no-banking overflow disposal, and **no** client socket route).
    - Enforced strict client payload allowlists (`FORGED_INPUT_REJECTED` on any forged `accountId`, `characterId`, `level`, `expDelta`, `tuVi`, `candidateTraitIds`, `lockedSlots`, `seed`, or `allocated` fields) and account/action-scoped `idempotency_ledger` deduplication (`v02:<accountId>:<actionType>:<requestId>`).
    - Added `apps/server/src/__tests__/characterV02Actions.test.ts` (`7` integration test cases covering full draft/reroll/confirm/allocate lifecycle + file-backed PGlite restart persistence, production `CATALOG_NOT_READY` fail-closed behavior, negative security/forged-input/duplicate-request/foreign-nonce/post-confirm-reroll guards, `Hậu Thiên` equip/unequip & `SIGNATURE_CONFLICT`, server-only EXP progression + `Phàm Nhân` Lv10 cap & overflow disposal, unauthenticated/forged `accountId` rejection + legacy `v0.1` coexistence, and Colyseus `ZoneRoom` `v02_*` message dispatch).
  - **Part B — Project Atlas V2 Integration**:
    - Integrated `docs/tong-mon-8d-project-atlas.html` as a tracked interactive architecture/governance visual companion (subordinate to Markdown sources of truth, with zero HTML/CSS/JS comments per `RULES.md` Rule 1) and registered it in `docs/CONTEXT_INDEX.md`.
  - **Part C — Mandatory Skill Manifest & Automatic Fallback Routing**:
    - Updated `docs/technical/AGENT_SKILL_ROUTER.md` (§2A) and `docs/technical/AGENT_EXECUTION_CONTRACT.md` (§2.2, §3.1, §3.3) so tasks may include a `Skill Manifest` (`PRIMARY` + optional) and automatically fall back to path-based routing (`max 3` skills per task) when omitted, with concise `Skills loaded: ... (explicit | fallback)` closeout reporting.
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `bf2d24ffdf51e64cb4fb2ff984a8c008dfd12aaa` (`bf2d24f`)
  - Commit: `897197a268f3c906ac624cac89fa65782a38b034` (`897197a`, `feat(s1-d): add character v0.2 authoritative server actions, project atlas, and skill routing`)
  - Files (`7` Code Allowlist paths + `7` Documentation Allowlist paths): `packages/shared/src/index.ts`, `apps/server/src/index.ts`, `apps/server/src/zoneRoom.ts`, `apps/server/src/db.ts`, `apps/server/src/characterV02Actions.ts`, `apps/server/src/guestIdentity.ts`, `apps/server/src/__tests__/characterV02Actions.test.ts`, `docs/tong-mon-8d-project-atlas.html`, `docs/CONTEXT_INDEX.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`
- **Tests & Verification Evidence**:
  - `SERVER / COLYSEUS /MULTIPLAYER` + `DB / TRANSACTION / PERSISTENCE` verification profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2): `npm test` (`6` test suites, `49/49` tests passing: `7` in `characterV02Actions.test.ts`, `8` in `characterV02Persistence.test.ts`, `9` in `dbTransactions.test.ts`, `8` in `server.test.ts`, `11` in `td01Numeric.test.ts`, `6` in `td01Contracts.test.ts`, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (including `npm run verify:assets`, exit `0`), Atlas inline JavaScript syntax check (`node --check`, exit `0`), `git diff --check` (exit `0`), 40 frozen TD files verified (`0` modified). Non-applicable checks (`test:e2e` / live external PostgreSQL): `NOT_RUN`.
- **Known Limitations & Deferred Scope**:
  - **Authoritative Server Actions Only — Client/HUD (`S1-E`) & Production Destiny Catalog Expansion Addressed in `S1-E`**:
    - At `S1-D`, `APPROVED_PRODUCTION_DESTINY_CATALOG` contained only `van_vi_dao_thai` (`GD-016`), so default `v02_roll_innate_destiny` failed closed with `CATALOG_NOT_READY` until `S1-E` (§3.13) integrated the owner-approved 16-trait starter catalog.
    - Pre-deployment security gate for unauthenticated `POST /api/test/advance-clock` remains tracked in `docs/technical/AGENT_EXECUTION_CONTRACT.md` §5.3.
- **Current Status & Next Dependency**: `COMMITTED` (`897197a`) → `S1-E` (`CLIENT/HUD`).

---

### 3.13 `S1-E` — Playable Character Creation, 16-Trait Starter Destiny Catalog & Destiny/Attribute HUD
- **Associated Slice**: `S1` (`TD-01` + `TD-05` Playable Character Creation & Destiny/Attribute HUD Sub-Slice)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rules 1–6), `docs/DECISIONS.md` (`GD-001`, `GD-010`–`GD-018`, `GD-020`–`GD-023`, `GD-028`, `GD-044`), `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/UX_DESIGN.md`, `docs/implementation/S1E_STARTER_DESTINY_CATALOG.md`, `.agents/skills/game-ui-frontend/SKILL.md`, `.agents/skills/mmorpg-server-integrity/SKILL.md`, `.agents/skills/game-playtest/SKILL.md`
- **Actual Implementation Scope**:
  - **16-Trait Starter Destiny Catalog & Flat Pre-Realm Attribute Bonuses (`packages/shared/src/index.ts`, `packages/game-data/src/index.ts`, `packages/game-data/src/td01Numeric.ts`)**:
    - Added `DestinyStarterDefinition`, `S1E_STARTER_DESTINY_CATALOG` (`16` traits: `6` `Phàm` ordinary, `4` `Hoàng` ordinary, `3` `Tiên` ordinary, `1` `Thần` ordinary `luc_hop_linh_cot` / `Lục Hợp Linh Cốt`, plus `van_vi_dao_thai` for `phi_de` and development-trial `huyen_anh_dao_thai` for `dam_lon_tien_tu` while preserving `dam_lon_tien_tu.realmId = "UNKNOWN"`), `APPROVED_CHARACTER_V02_APPEARANCES` (`hero_kiem_tu`, `hoa_tran`, `ngoc_tam`, `anh_7`), and `computeActiveDestinyPreRealmAttributeBonuses`.
    - Folded flat pre-realm Destiny attribute bonuses (`innateTraitIds` when confirmed + active `Hậu Thiên` slots) into `computeCandidateBaselineStatSnapshot` (`preRealm = origin + allocated + earnedPermanent + destinyAttributeBonuses`, then multiplied once by `realmFactor`), and exposed `attributes` breakdown (`origin`, `destinyBonuses`, `preRealm`, `effective`, `realmFactor`) on `CharacterV02SnapshotPayload`.
  - **Authoritative Roll Math Fixes (`FIX A` & `FIX B`) & World Spawn Isolation (`apps/server/src/characterV02Actions.ts`, `apps/server/src/zoneRoom.ts`, `apps/server/src/worldEngine.ts`)**:
    - Fixed `CANDIDATE_THAN_SIGNATURE_WEIGHT = 60` / `CANDIDATE_THAN_ORDINARY_WEIGHT = 40` (`FIX A`, matching `docs/DECISIONS.md` `GD-017` and `docs/systems/DESTINY.md`) and implemented full-triple independent rejection sampling (`FIX B`, redrawing the entire 3-slot candidate triple whenever duplicate trait IDs or `> 1` Legendary Signature occurs).
    - Updated `POST /api/v02/auth/guest` and `ZoneRoom` `v02_snapshot` to return `activeRollDraft` (`rollNonce`, `candidateTraitIds`, `rolledAtMs`, `expiresAtMs`) so unconfirmed `ROLLED` drafts survive page reloads.
    - Isolated `v0.2` sessions from legacy `v0.1` sessions in `ZoneRoom` so unconfirmed `v0.2` sessions never create legacy `characters` rows or spawn world avatars, and confirmed `v0.2` characters spawn into `activePlayers` in `Tân Thủ Thôn` with their selected `appearanceId`, sync world movement/combat state back to `characters_v02`, and broadcast `appearanceId`/`level`/`creationState` on `RemotePlayerSnapshot`.
  - **Playfield-First Character Creation Overlay & `[C]` HUD (`apps/client/src/characterCreation.ts`, `apps/client/src/hud.ts`, `apps/client/src/network.ts`, `apps/client/src/WorldScene.ts`, `apps/client/src/main.ts`, `apps/client/src/style.css`)**:
    - Created `CharacterCreationOverlayController` supporting the `DRAFT -> ROLLED -> CONFIRMED` flow, name input (`2–24` chars), 4 canonical appearance cards, 3-slot `Tiên Thiên Nghịch Thiên Cải Mệnh` altar with unlimited full-trio rerolls (`Gieo Lại Cả 3`), single-use `rollNonce` confirmation (`Xác Nhận Tiên Thiên & Nhập Thế`), and explicit invalid-credential recovery (`#cc-recovery-section`: retry connection or explicitly clear stale local guest credentials and create a new guest session).
    - Updated `WorldScene.ts` to hide the local avatar while unconfirmed in `v0.2` mode, render selected `appearanceId` sprites (`80x96` or `48x64`) for local and remote players, and expose `v02Mode`, `v02Character`, `v02ActiveRollDraft`, `localAvatarVisible`, and `localAppearanceKey` in `window.render_game_to_text()`.
    - Updated `hud.ts` with top-left Level + EXP bar (`Lv.X · expTowardNext/expToNext`) + unallocated attribute points badge while keeping `>= 75%` of the Phaser playfield unobstructed (`RULES.md` Rule 4), and updated `[C]` modal with all 6 base attributes (`Thể Phách`, `Lực Đạo`, `Linh Tính`, `Thân Pháp`, `Thần Thức`, `Ngộ Tính`), single-point `+1` buttons (`v02_allocate_attribute_point`), derived stats, 3 confirmed `Tiên Thiên` badges, and 3 active `Hậu Thiên` slots (`equip`/`unequip`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `897197a268f3c906ac624cac89fa65782a38b034` (`897197a`)
  - Commit: `a3de0549350e003019d17cef47833a8aa2943b38` (`a3de054`, `feat(s1-e): add playable character creation, starter destiny catalog, and attribute/destiny hud`)
  - Files (`15` Code Allowlist paths + `7` Documentation Allowlist paths): `packages/shared/src/index.ts`, `packages/game-data/src/index.ts`, `packages/game-data/src/td01Numeric.ts`, `apps/server/src/characterV02Actions.ts`, `apps/server/src/zoneRoom.ts`, `apps/server/src/worldEngine.ts`, `apps/server/src/__tests__/characterV02Actions.test.ts`, `apps/client/src/network.ts`, `apps/client/src/hud.ts`, `apps/client/src/characterCreation.ts`, `apps/client/src/WorldScene.ts`, `apps/client/src/main.ts`, `apps/client/src/style.css`, `tests/e2e/game.spec.ts`, `tests/e2e/runPlaytest.ts`, `docs/implementation/S1E_STARTER_DESTINY_CATALOG.md`, `docs/DECISIONS.md`, `docs/CONTEXT_INDEX.md`, `docs/tong-mon-8d-project-atlas.html`, `docs/implementation/FEATURE_LEDGER.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`
- **Tests & Verification Evidence**:
  - `CLIENT / HUD / PHASER / E2E` + `SERVER / COLYSEUS / MULTIPLAYER` verification profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2): `npm test` (`6` test suites, `53/53` server tests passing: `11` in `characterV02Actions.test.ts`, `8` in `characterV02Persistence.test.ts`, `9` in `dbTransactions.test.ts`, `8` in `server.test.ts`, `11` in `td01Numeric.test.ts`, `6` in `td01Contracts.test.ts`, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (including `npm run verify:assets`, exit `0`), real browser E2E playtest on isolated ports `2591`/`5191` (`PLAYTEST_RUN_ID=s1e_verification`, `playtestStatus: "ALL_GATES_PASSED"`, `0` console/page errors, verifying Desktop `1280x720` `DRAFT -> ROLLED -> REROLL -> CONFIRMED -> Tân Thủ Thôn spawn -> [C] panel -> reload persistence`, invalid `guestToken` recovery screen, two-guest isolation, and Mobile `390x844` layout + playfield visibility `>= 75%`), `git diff --check` (exit `0`), 40 frozen TD files verified (`0` modified).
- **Known Limitations & Deferred Scope**:
  - **Starter Catalog & Candidate Numerics Remain `DESIGN_BASELINE` / Development Trial**:
    - The 14 ordinary innate traits and their flat pre-realm attribute bonuses are `DESIGN_BASELINE` starter values; `huyen_anh_dao_thai` (`dam_lon_tien_tu`) is authorized strictly for development-trial verification (`Narrative: NOT DESIGNED`, `dam_lon_tien_tu.realmId = "UNKNOWN"` preserved).
    - Visual presentation remains `TECHNICALLY_VERIFIED` (not `HUMAN_APPROVED`).
    - Slice `S1` closeout acceptance gate (`S1-F`) and Slices `S2`–`S8` remain next.
- **Current Status & Next Dependency**: `COMMITTED` (`a3de054`) → `PRE-S1F` / `S1-F` (`E2E ACCEPTANCE`).

---

### 3.14 `PRE-S1F` — Source Architecture, Character/Destiny Modular Refactor & Documentation Pipeline Hardening
- **Associated Slice**: `S1` (Pre-`S1-F` Architecture, Selective Modularization & Documentation Pipeline Hardening)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rules 1–6), `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/CONTEXT_INDEX.md`, `docs/CONTENT_PIPELINE.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/ROADMAP.md`, `.agents/skills/mmorpg-server-integrity/SKILL.md`, `.agents/skills/game-ui-frontend/SKILL.md`, `.agents/skills/game-playtest/SKILL.md`
- **Actual Implementation Scope**:
  - **Part A — Source Architecture & Governance (`docs/technical/SOURCE_ARCHITECTURE.md`, `AGENTS.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/CONTEXT_INDEX.md`, `docs/CONTENT_PIPELINE.md`)**:
    - Integrated `docs/technical/SOURCE_ARCHITECTURE.md` defining the modular-monolith source architecture (`packages/shared`, `packages/game-data`, `packages/art-tools`, `apps/server/src/features/<domain>/*`, `apps/client/src/features/<domain>/*`), data-driven content pack layout (`src/catalogs/*`, `src/rules/*`), scope-based allowlists (`EDIT_EXISTING`, `CREATE_WITHIN`, `DOC_SYNC`), and incremental extraction guardrails without speculative placeholder directories.
    - Updated `AGENTS.md` §2, `docs/technical/AGENT_EXECUTION_CONTRACT.md` (§2.2, §3.3, §4, §4.6), `docs/CONTEXT_INDEX.md` (§3, §4, §5), and `docs/CONTENT_PIPELINE.md` (§2.1) with scope-based allowlist rules, modular-monolith package paths, and the sustainable documentation synchronization policy (`SELF_COMMIT` + previous-task commit SHA backfill + `npm run verify:doc-sync`).
  - **Part B — Selective Character/Destiny Refactor & Exact Git Blob Line Counts (`a3de054 -> b82e20b`, including blank lines, excluding trailing newline)**:
    - Extracted `packages/game-data/src/catalogs/realms.ts` (`RealmDefinition`, `REALM_PROGRESSION`), `packages/game-data/src/rules/characterContracts.ts` (6-attribute, EXP decimal string, level-point, and realm level-band validators/helpers), and `packages/game-data/src/catalogs/destinies.ts` (`S1E_STARTER_DESTINY_CATALOG`, `APPROVED_CHARACTER_V02_APPEARANCES`, Destiny rarity/label constants, pre-realm bonus calculators, and Destiny collection/roll-draft validators).
    - Updated `packages/game-data/src/td01Numeric.ts` to import directly from `./catalogs/destinies.js` and `./rules/characterContracts.js` instead of `./index.js`, eliminating the direct `td01Numeric.ts ↔ index.ts` circular dependency while preserving all barrel re-exports in `packages/game-data/src/index.ts` (`2100 -> 885` lines; still retains legacy `v0.1` catalogs/formulas/simulator helpers alongside barrel re-exports).
    - Extracted `apps/server/src/features/destiny/DestinyRoller.ts` (`rollInnateDestinyTripleFromCatalog` + tier/signature weights) and `apps/server/src/features/character/CharacterSnapshot.ts` (`toCharacterV02Snapshot`), re-exporting them from `apps/server/src/characterV02Actions.ts` (`2037 -> 1778` lines; `characterV02Actions.ts` still retains `CharacterV02ActionService` and transaction orchestration—the prior report's `~627` figure was inaccurate, and a separate `CharacterService.ts` is not yet extracted).
    - Extracted `apps/client/src/features/character/CharacterPanel.ts` (`renderCharacterPanelModal` for the `[C]` `Character v0.2` 6-attribute and Destiny modal) and delegated `HudController.renderCultivationModal()` in `apps/client/src/hud.ts` (`925 -> 660` lines).
  - **Part C — Documentation Pipeline Hardening (`docs/MASTER_PROJECT_PLAN.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/tong-mon-8d-project-atlas.html`, `docs/DEVELOPMENT_SETUP.md`, `scripts/verify-doc-sync.mjs`, `package.json`)**:
    - Reconciled stale milestone statuses (`S1-B1b`, `S1-C`, `S1-D`, `S1-E`) across `MASTER_PROJECT_PLAN.md` and `ROADMAP.md`, backfilled `S1-E` commit `a3de054` (`a3de0549350e003019d17cef47833a8aa2943b38`), corrected `luc_hop_linh_cot` in `FEATURE_LEDGER.md` §3.13, and added `scripts/verify-doc-sync.mjs` (`npm run verify:doc-sync`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `a3de0549350e003019d17cef47833a8aa2943b38` (`a3de054`)
  - Commit: `b82e20b148ad08544c3efd1003d1111364a45e51` (`b82e20b`, `refactor(pre-s1f): modularize character and harden architecture governance`)
  - Files (`12` Code/Script paths + `12` Documentation paths): `packages/game-data/src/catalogs/realms.ts`, `packages/game-data/src/catalogs/destinies.ts`, `packages/game-data/src/rules/characterContracts.ts`, `packages/game-data/src/td01Numeric.ts`, `packages/game-data/src/index.ts`, `apps/server/src/features/destiny/DestinyRoller.ts`, `apps/server/src/features/character/CharacterSnapshot.ts`, `apps/server/src/characterV02Actions.ts`, `apps/client/src/features/character/CharacterPanel.ts`, `apps/client/src/hud.ts`, `scripts/verify-doc-sync.mjs`, `package.json`, `docs/technical/SOURCE_ARCHITECTURE.md`, `AGENTS.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/CONTEXT_INDEX.md`, `docs/CONTENT_PIPELINE.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/tong-mon-8d-project-atlas.html`, `docs/DEVELOPMENT_SETUP.md`
- **Tests & Verification Evidence**:
  - `CLIENT / HUD / PHASER / E2E` + `SERVER / COLYSEUS / MULTIPLAYER` + `DOC SYNC` verification profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2, Argon-reported at `b82e20b`): `npm test` (`6` test suites, `53/53` server tests passing, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (including `npm run verify:assets`, exit `0`), `npm run verify:doc-sync` (exit `0`), real browser E2E playtest (`PLAYTEST_RUN_ID=pre_s1f_verification`, `dbDataDir: "memory://"`, `playtestStatus: "ALL_GATES_PASSED"`, `0` console/page errors across Desktop `1280x720` and Mobile `390x844`; note that `memory://` E2E does not replace `S1-F` file-backed isolated PGlite restart proof), `git diff --check` (exit `0`), 40 frozen TD files verified (`0` modified).
- **Known Limitations & Deferred Scope**:
  - **Bounded Refactor Only — Zero Gameplay Behavior Change**:
    - `PRE-S1F` preserves `S1-E` runtime gameplay behavior identically; `index.ts` (`885` lines) and `characterV02Actions.ts` (`1778` lines) remain mixed/retained modules, and a separate `CharacterService.ts`, full target tree, CI workflows, load testing, and runtime FPS proofs are not yet implemented.
- **Current Status & Next Dependency**: `COMMITTED` (`b82e20b`) → `DOC-CLEAN-01`.

---

### 3.15 `DOC-CLEAN-01` — Post-`PRE-S1F` Documentation Reconciliation, Legacy Bootstrap Archiving & Bounded Doc-Sync Utility
- **Associated Slice**: `S1` (Post-`PRE-S1F` Documentation Reconciliation Before `VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F`)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rules 1–6), `START_HERE.md`, `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/CONTEXT_INDEX.md`, `docs/ART_BIBLE.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md` (`Skill Manifest: NONE`)
- **Actual Implementation Scope**:
  - **Byte-Identical Legacy Archiving & Active Entrypoint Cleanup**:
    - Archived 4 historical documents byte-for-byte from `HEAD` (`b82e20b148ad08544c3efd1003d1111364a45e51`) under `docs/archive/legacy/`:
      - `docs/archive/legacy/MASTER_PROMPT.md` (blob `7269e3669d413cd83fe8b636a8b94655e5660a1b`)
      - `docs/archive/legacy/CONTEXT_AUDIT.md` (blob `95fb32de3148bd27a02ff6d57b2ee87760cb453b`)
      - `docs/archive/legacy/IMPLEMENTATION_STATUS.md` (blob `02346d5f1f15095e834917d2bc7dcf265d66a62c`)
      - `docs/archive/legacy/EXTERNAL_SKILLS.md` (blob `fdc601eebf7962bc798ded3e8d9305d72c436df2`)
    - Replaced `MASTER_PROMPT.md`, `docs/CONTEXT_AUDIT.md`, and `docs/IMPLEMENTATION_STATUS.md` with short non-executable historical locator stubs so frozen `TD_FREEZE_OVERVIEW.md` and historical links continue to resolve cleanly.
    - Consolidated resume and active code layout pointers into `START_HERE.md` and `docs/CONTEXT_INDEX.md`, and removed redundant `EXTERNAL_SKILLS.md` and `docs/WORKSPACE_HANDOFF.md` (`git rm`).
  - **Source Architecture, Design, Art & Status Reconciliation**:
    - Updated `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/PROJECT_STATUS.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/ROADMAP.md`, `docs/NEXT_ACTIONS.md`, `docs/implementation/FEATURE_LEDGER.md`, and `docs/tong-mon-8d-project-atlas.html` to backfill `PRE-S1F` (`b82e20b`), record exact Git blob line counts (`packages/game-data/src/index.ts` `2100 -> 885`, `apps/server/src/characterV02Actions.ts` `2037 -> 1778`, `apps/client/src/hud.ts` `925 -> 660`), separate implemented `S1` modules from retained compatibility and target-only extension points, and establish the owner's chosen sequence **`DOC-CLEAN-01 -> VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F`**.
    - Updated `AGENTS.md`, `RULES.md` (Rule 2 canonical routing only), `docs/DECISIONS.md` (`GD-022` no-banking alignment), `docs/GAME_DESIGN.md`, `docs/GAME_LORE.md` (`phi_de` approved vs `dam_lon_tien_tu` `S1-E` trial `huyen_anh_dao_thai` vs 8 unratified signatures), `docs/ART_BIBLE.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/CONTENT_PIPELINE.md`, `docs/DEVELOPMENT_SETUP.md`, and `docs/technical/AGENT_EXECUTION_CONTRACT.md` (fixing `SOURCE_ARCHITECTURE.md` §9 anchor and honest `verify:doc-sync` scope).
  - **Bounded Mechanical `scripts/verify-doc-sync.mjs` & Disposable Fixture Tests**:
    - Simplified `scripts/verify-doc-sync.mjs` to remove the brittle `STALE_MILESTONE_PATTERNS` regex blacklist that penalized legitimate historical text (`"S1-E NOT IMPLEMENTED"`) and future valid states (`"S1-F (ACCEPTED)"`), retaining honest mechanical checks: (1) 40 frozen TD files against `39c41a6ddb77b93284c56da7ec053f4309ee4943`, (2) required architecture, archive (`docs/archive/legacy/*`), locator stub, and active status files present + removed active paths (`EXTERNAL_SKILLS.md`, `docs/WORKSPACE_HANDOFF.md`) absent, and (3) valid inline `<script>` syntax in `docs/tong-mon-8d-project-atlas.html` via `vm.Script`.
    - Added `scripts/tests/verify-doc-sync.test.mjs` with disposable temporary-directory fixture tests covering valid historical/future strings, missing required file detection, frozen-file diff failure, removed-file reappearance failure, and invalid inline `<script>` syntax failure without touching the live repository.
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `b82e20b148ad08544c3efd1003d1111364a45e51` (`b82e20b`)
  - Commit: `51d4caf2ae4ae101e41b0f31192a7319e06d965e` (`51d4caf`, `docs(doc-clean-01): reconcile post-pre-s1f docs, archive legacy bootstrap docs, and bound doc-sync checker`)
  - Files (`21` edited documentation paths + `2` edited utility/HTML paths + `4` created archive paths + `1` created utility test path + `2` deleted active paths = `30` total allowlisted paths): `AGENTS.md`, `RULES.md`, `START_HERE.md`, `MASTER_PROMPT.md`, `docs/ART_BIBLE.md`, `docs/CONTENT_PIPELINE.md`, `docs/CONTEXT_AUDIT.md`, `docs/CONTEXT_INDEX.md`, `docs/DECISIONS.md`, `docs/DEVELOPMENT_SETUP.md`, `docs/GAME_DESIGN.md`, `docs/GAME_LORE.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/tong-mon-8d-project-atlas.html`, `scripts/verify-doc-sync.mjs`, `scripts/tests/verify-doc-sync.test.mjs`, `docs/archive/legacy/MASTER_PROMPT.md`, `docs/archive/legacy/CONTEXT_AUDIT.md`, `docs/archive/legacy/IMPLEMENTATION_STATUS.md`, `docs/archive/legacy/EXTERNAL_SKILLS.md`, plus removed `EXTERNAL_SKILLS.md` and `docs/WORKSPACE_HANDOFF.md`.
- **Tests & Verification Evidence**:
  - `DOC SYNC` + standalone utility fixture verification profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2): 4 archived files verified byte-identical to `HEAD` (`b82e20b`) blobs (`7269e36...`, `95fb32d...`, `02346d5...`, `fdc601e...`), 40 frozen TD files verified (`0` diff lines vs `39c41a6ddb77b93284c56da7ec053f4309ee4943`), `node --check scripts/verify-doc-sync.mjs` (exit `0`), `node scripts/verify-doc-sync.mjs` (exit `0`), `node scripts/tests/verify-doc-sync.test.mjs` (`PASS`, exit `0`), Rule 1 zero-comment check across modified scripts, HTML, and Markdown code blocks (`0` violations), `git diff --cached --check` (exit `0`). Game runtime/build/E2E/sim/exporter suites: `NOT_APPLICABLE` (reused unchanged `b82e20b` and `0c00374` evidence).
- **Known Limitations & Deferred Scope**:
  - Documentation and standalone doc-sync utility cleanup only; does not modify gameplay runtime, database schemas, or visual assets. Semantic status consistency across docs remains a scoped agent self-review rather than an NLP/regex machine proof.
- **Current Status & Next Dependency**: `COMMITTED` (`51d4caf`) → `VISUAL-01` → `VISUAL-02` → `VISUAL-03-P`.

---

### 3.16 `VISUAL-03-P` — Integration Architecture & Camera/Minimap Contract
- **Associated Slice**: `S1` (`VISUAL-03` Planning & Contract Gate)
- **Design & Technical References**: `AGENTS.md`, `RULES.md` (Rules 1–6), `docs/ART_BIBLE.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, `docs/pipelines/UX_WORLD_FIRST.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md`
- **Actual Implementation Scope**:
  - Authored `docs/technical/CAMERA_AND_MINIMAP_CONTRACT.md` and `docs/implementation/VISUAL_03_INTEGRATION_PLAN.md` defining the responsive camera zoom profile (`1280x720`, `1920x1080`, `2560x1440`, `3840x2160`, `390x844`), essential read-only `S1` `MinimapView` contract (without assuming `S4` `startAutoNav`), Y-sort and roof/nameplate occlusion rules, non-destructive `resolveSafeZoneCoordinates` persisted coordinate compatibility for the `40×30 → 96×72` transition, `ngoc_tam` vs `npc_ngoc_tam` and `thai_tai` visual key separation, and the staged `VISUAL-03-W → VISUAL-03-U → VISUAL-03-Q` execution plan.
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `51d4caf2ae4ae101e41b0f31192a7319e06d965e` (`51d4caf`)
  - Commit: `4679f49bfc100374808f6ca6b1714bfaf31d8701` (`4679f49`, `docs(visual-03-p): add camera/minimap contract and S1 visual integration plan`)
  - Files: `docs/technical/CAMERA_AND_MINIMAP_CONTRACT.md`, `docs/implementation/VISUAL_03_INTEGRATION_PLAN.md`
- **Tests & Verification Evidence**:
  - `npm run verify:doc-sync` (exit `0`), Rule 1 zero-comment check (`0` violations), `git diff --cached --check` (exit `0`), 40 frozen TD files verified (`0` modified).
- **Current Status & Next Dependency**: `COMMITTED` (`4679f49`) → `VISUAL-03-W`.

---

### 3.17 `VISUAL-03-W` — World Integration, Camera & Minimap
- **Associated Slice**: `S1` (`VISUAL-03` Stage 1 World, Camera & Minimap Runtime Integration)
- **Design & Technical References**: `docs/technical/CAMERA_AND_MINIMAP_CONTRACT.md`, `docs/implementation/VISUAL_03_INTEGRATION_PLAN.md`, `docs/ART_BIBLE.md`, `AGENTS.md`, `RULES.md` (Rules 1–6)
- **Actual Implementation Scope**:
  - **Modular `96×72` (`3072×2304 px`) Tiled `Tân Thủ Thôn` & Asset Promotion**:
    - Promoted approved `VISUAL-02B` / `VISUAL-02A-R1` assets into `assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png` (`256×192`, 48 tiles of `32×32 px`), `assets/props/` (`building_tan_thu_tu_duong.png`, `building_tu_bao_cac.png`, `building_hong_tran_cac.png`, `prop_noodle_stall.png`, `prop_than_dinh.png`, `prop_portal_arch.png`, `prop_peach_tree.png`, `prop_bamboo_cluster.png`, `prop_stone_lantern.png`, `prop_arched_bridge.png`, `prop_bridge_horizontal.png`, `prop_village_stele.png`, `prop_spirit_herb.png`, `prop_incense_brazier.png`, `prop_jade_rock.png`, `prop_wooden_fence.png`), `assets/sprites/` (11 character/creature sheets + preview GIFs now consolidated in `assets/previews/`), `assets/portraits/` (12 portraits including dedicated `portrait_thai_tai.png` and `portrait_npc_ngoc_tam.png`), `assets/vfx/`, `assets/ui/hud_minimap_astrolabe_ring.png`, `assets/source_ai/`, `assets/manifest.json`, and `assets/provenance.json`.
    - Built `maps/tan_thu_thon.tmj` (`96×72` tiles at `32×32 px`, `5,357` walkable / `1,555` blocked tiles, 100% single-component BFS reachability across West/North/East bridges, 7 NPCs, cauldron, and portal).
    - Synced `ZONES_REGISTRY` and `LEGENDARY_NPCS` in `packages/game-data/src/index.ts` (`tan_thu_thon` `96×72`, `village_center: (1552, 1232)`, `from_thanh_truc_lam: (2608, 1200)`, `portal_town_to_forest` at `(2768, 1200)`, `portal_forest_to_town.targetX/Y` at `(2608, 1200)`, `LEGENDARY_NPCS[5]` `id: "ngoc_tam"` using `spriteKey: "npc_ngoc_tam"` & `portraitKey: "portrait_npc_ngoc_tam"`, and `LEGENDARY_NPCS[6]` `id: "thai_tai"` using `spriteKey: "thai_tai"` & `portraitKey: "portrait_thai_tai"`).
  - **Responsive `CameraView.ts` & Persistent `MinimapView.ts`**:
    - Implemented `apps/client/src/game/world/CameraView.ts` (`computeResponsiveCameraProfile` enforcing adaptive zoom `1.0×` at `1280×720`, `1.25×` at `1920×1080`, `1.5×` at `2560×1440`, `2.0833×` at `3840×2160`, and `1.0×` at `390×844` mobile so visible world never exceeds `60% × 45%` of `Tân Thủ Thôn`, with hard zoom clamp).
    - Implemented `apps/client/src/game/world/MinimapView.ts` mounted once in `#hud-minimap-mount` (`apps/client/src/hud.ts`, `apps/client/src/style.css`), keeping `staticCanvas` cached (`mountCount === 1`, `staticDrawCount === 1` throughout same-zone movement and expand/collapse toggles, rebuilding only on zone transitions) and updating dynamic player/camera/NPC/portal/cauldron markers without modifying `hud.ts` `innerHTML`.
  - **Honest 4-Profile Animation Registration, Y-Sort Occlusion & Non-Destructive Coordinate Compatibility**:
    - Implemented explicit `full_80x96_20row`, `locomotion_80x96_8row`, `stationary_npc_80x96_4f`, and `legacy_48x64_16row` animation registration and fallback logging in `apps/client/src/WorldScene.ts` and `packages/art-tools/verify_manifest.ts`.
    - Fixed Y-sort and roof/nameplate occlusion in `apps/client/src/WorldScene.ts` so buildings/props/trees sort at their southern blocked footprint base $Y_{\text{base}}$ (`depth = baseY`), bridges render at surface `depth = 6`, and entity bundles sort together (`sprite = y`, `hpBg = y + 0.1`, `hpFill = y + 0.2`, `subLabel = y + 0.3`, `nameLabel = y + 0.4`) so roofs/canopies cleanly occlude both sprites and nameplates when behind structures.
    - Implemented `resolveSafeZoneCoordinates` and BFS `connectedWalkableTiles` in `apps/server/src/worldEngine.ts` and `apps/server/src/zoneRoom.ts` (preserving valid walkable saves, migrating legacy `(640, 512)` → `(1552, 1232)` and `(1120, 480)` → `(2608, 1200)`, nudging blocked/island coordinates via ring search `1..6` tiles, or falling back to `defaultSpawn` with unit test coverage in `apps/server/src/__tests__/server.test.ts`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `4679f49bfc100374808f6ca6b1714bfaf31d8701` (`4679f49`)
  - Commit: `7b386cea7ef075c6f358539ddea155cd1634db5b` (`7b386ce`, `feat(visual-03-w): integrate 96x72 Tan Thu Thon, responsive camera, minimap, and 11 S1 sprites`)
- **Tests & Verification Evidence**:
  - `npm run verify:assets` → `{"verifiedAssets":48,"verifiedProvenanceCharacters":3,"verifiedVisual03wCharacters":11,"verifiedMaps":2,"status":"OK"}` (exit `0`).
  - `npm run typecheck` (exit `0`), `npm run build` (exit `0`), `npx vitest run --no-file-parallelism` (`6/6` test suites, `54/54` tests passing, exit `0`), `npm run verify:doc-sync` (exit `0`).
  - Playwright live runtime verification (`VISUAL_03_W_SMOKE_TEST_REPORT.json` + 15 screenshots + 4 review boards + runtime GIF): `spawnPass: true`, `zoomClampPass: true`, `minimapPass: true` (`mountCount: 1`, `staticDrawCount: 1` across same-zone walks & expand toggle, `2` in `thanh_truc_lam`, `3` on return to `tan_thu_thon`), `bridgePass: true`, `occlusionPass: true`, `npcPass: true`, `portalPass: true`, `charPanelPass: true`, `consoleErrors: 0`, `pageErrors: 0`.
- **Current Status & Next Dependency**: `COMMITTED` (`7b386ce`) → `HERO-ANIMSET-01` → `ARCH-FOUNDATION-02` → `COREKIT-CANON-02`.

---

### 3.18 `HERO-ANIMSET-01` — Owner-Approved Active Desktop `hero_kiem_tu` 20-Row Animation Master (`DEC-009`)
- **Associated Slice**: `S1` (`TD-05` Hero Master Replacement & `DEC-009` Creative Lock)
- **Design & Technical References**: `AGENTS.md` §5 (`DEC-009`), `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `assets/corekit/v01b/catalog.json`
- **Actual Implementation Scope**:
  - Generated and assembled the owner-approved active Desktop `hero_kiem_tu` (`Thanh Vân Đạo Đồ`, `ref.character.hero_kiem_tu@2.0.0-hero-animset-01`) `full_80x96_20row` (`480×1920`, 20 rows × 6 cols) spritesheet (`assets/sprites/hero_kiem_tu.png`, SHA-256 `ecf6604b5a820c9edf073ddf2bceadfb0356c92c635b925b091dcf5faedc2128`), packed atlas (`assets/atlases/hero_kiem_tu_atlas.png` + `hero_kiem_tu_atlas.json`), preview GIFs (`assets/previews/hero_kiem_tu_{walk,attack,cast}.gif`), and portrait (`assets/portraits/portrait_hero_kiem_tu.png`, SHA-256 `1de6fc6029fd2efe1dfa855fd73d1931308290060a41071f6e19b856333f8823`) from active raw AI sources `assets/source_ai/source_h04..source_h10`.
  - Archived superseded `source_h01..source_h03` drafts under `assets/archive/history/rejected_sources/`.
  - **Later Owner-Confirmed 8-Walk-Frame Hero Input (`MISSING_APPROVED_HERO_INPUT`)**: Per `ARCH-COREKIT-R1`, the later owner-confirmed 8-walk-frame Hero source/runtime artifact is not present in the local workspace or session backups; the workspace preserves the verified `ecf6604b...` / `1de6fc60...` 6-walk-frame artifact while `assets/corekit/v01b/profiles/animation.json` (`full_80x96_20row_8walk` `640×1920`), `apps/client/src/game/assets/SpriteProfiles.ts`, and `apps/client/src/game/combat/AnimationRegistry.ts` support dynamic 8-walk-frame geometry without hardcoding `* 6` or `+ 5`.
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `7b386cea7ef075c6f358539ddea155cd1634db5b` (`7b386ce`)
  - Commit SHA: `NO_COMMIT` (Working-tree baseline preserved per owner instructions)
- **Current Status & Next Dependency**: `OWNER_APPROVED_ACTIVE_DESKTOP_MASTER` (`HUMAN_APPROVED` under `DEC-009`; 8-walk-frame input `MISSING_APPROVED_HERO_INPUT`) → `ARCH-FOUNDATION-02` & `COREKIT-CANON-02`.

---

### 3.19 `ARCH-FOUNDATION-02` — Full Current-Game Modular Monolith Extraction, Static Packaging & Architecture Verifier
- **Associated Slice**: `S1` (`SOURCE_ARCHITECTURE.md` Full Current-Runtime Modularization & Security Gate)
- **Design & Technical References**: `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/CAMERA_AND_MINIMAP_CONTRACT.md`
- **Actual Implementation Scope**:
  - **Shared & Game-Data Extraction**: Extracted `packages/shared/src/protocols/{character,legacyWorld,common}.ts` and `types/{character,legacyWorld}.ts` (`packages/shared/src/index.ts` compatibility barrel), plus `packages/game-data/src/catalogs/{realms,destinies,npcs,world,items,recipes,quests,techniques,appearances}.ts` and `rules/{characterContracts,td01Numeric,legacyProgression,legacySimulator}.ts` (`packages/game-data/src/index.ts` compatibility barrel).
  - **Authoritative Server Modularization & Test Clock Gate**: Extracted `apps/server/src/app/createGameServer.ts`, `transport/http/registerHttpRoutes.ts`, `transport/colyseus/ZoneRoom.ts`, `runtime/world/WorldRuntime.ts`, `features/character/{CharacterService,CharacterCreationCommands,CharacterProgressionCommands,CharacterValidation,CharacterRepository,CharacterSnapshot}.ts`, `features/destiny/{DestinyRoller,DestinyOwnership}.ts`, `features/combat/LegacyCombatService.ts`, `features/economy/LegacyCommerceService.ts`, `features/quests/LegacyQuestService.ts`, and `infrastructure/database/{DbPorts,PgAdapter,LegacyWorldPorts}.ts`, with compatibility locators (`db.ts`, `characterV02Repository.ts`, `characterV02Actions.ts`, `worldEngine.ts`, `zoneRoom.ts`, `guestIdentity.ts`). Gated `POST /api/test/advance-clock` behind `enableTestClockApi: true` or `ENABLE_TEST_CLOCK_API=true` (route omitted / returns `HTTP 404` by default).
  - **Client Modularization, Static Packaging & Architecture Verifier**: Extracted `apps/client/src/app/GameBootstrap.ts`, `game/WorldScene.ts`, `game/assets/{RuntimeAssetBindings,SpriteProfiles,runtimeAnimationProjection.json}`, `game/combat/{AnimationRegistry,CombatVisuals}.ts`, `game/world/{MapView,ActorViewSystem,CameraView,MinimapView}.ts`, `game/input/PlayerInput.ts`, `game/debug/WorldDebugController.ts`, `ui/{HudShell,ports}.ts`, `features/character/{CharacterCreationView,CharacterPanel}.ts`, `features/shops/HudShell.ts`, `network/GameNetworkClient.ts`, `audio/audio.ts`, and `style.css`, with compatibility locators (`WorldScene.ts`, `hud.ts`, `characterCreation.ts`, `network.ts`, `audio.ts`). Added `scripts/package-runtime-assets.mjs` (`scripts/tests/package-runtime-assets.test.mjs`) and `scripts/verify-architecture.mjs` (`scripts/tests/verify-architecture.test.mjs`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `7b386cea7ef075c6f358539ddea155cd1634db5b` (`7b386ce`)
  - Commit SHA: `NO_COMMIT` (`COMMIT_POLICY: NO_COMMIT`)
- **Tests & Verification Evidence**:
  - `npm run verify:architecture` (exit `0`, `0` runtime cycles, `0` boundary violations), `npm run typecheck` (exit `0`), `npm test` (`6` suites, `58/58` server tests passing including `T10` in `dbTransactions.test.ts`, exit `0`), `npm run build` (runtime dependency closure packaged into `apps/client/dist/`, exit `0`), `node --import tsx tests/e2e/runArchFoundationVerification.ts` (clean-dist static server with `0` HTTP 404s, `0` console/page errors, `productionDebugHooksHiddenWithoutFlag: true`, `testClockDefault404: true`, `testClockOptIn200: true`, and `20/20` concurrent multiplayer sessions passing in `artifacts/architecture/ARCH-FOUNDATION-02/verification_report.json`).
- **Current Status & Next Dependency**: `TECHNICAL_ACCEPTANCE_COMPLETE` (`NO_COMMIT` at base `7b386ce`) → `COREKIT-CANON-02` & `ARCH-COREKIT-R1`.

---

### 3.20 `COREKIT-CANON-02` & `ARCH-COREKIT-R1` — Canonical V01-B Core Kit (`assets/corekit/v01b/`), Batch A UI Import, Dependency-Backed Cleanup & Validator Hardening
- **Associated Slice**: `S1` (`TD-05` Core Kit Canonicalization, Native-Image Enforcement, Legacy Asset Cleanup & Audit R1 Corrections)
- **Design & Technical References**: `AGENTS.md` §4–§5 (`DEC-006`..`DEC-009`), `RULES.md` (Rules 1, 5, 6), `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `docs/CONTENT_PIPELINE.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/implementation/VISUAL_03_INTEGRATION_PLAN.md`
- **Actual Implementation Scope**:
  - **Canonical `assets/corekit/v01b/` Library & Runtime Projection**: Authored `assets/corekit/v01b/catalog.json`, `COREKIT_INDEX.md`, `profiles/{animation,ui-tokens,world-art}.json`, and `references/{style,characters,creatures,world,ui,vfx}/`, compiled `apps/client/src/game/assets/runtimeAnimationProjection.json`, and wired `apps/client/src/game/assets/SpriteProfiles.ts` and `apps/client/src/game/combat/AnimationRegistry.ts` (supporting both `full_80x96_20row` and `full_80x96_20row_8walk`).
  - **Missing Raw AI Sources & Batch A UI Core Import**: Imported 5 missing raw AI source PNGs into `assets/source_ai/` and imported reusable Batch A UI families into `assets/ui/{buttons_and_tabs,character_creation_and_c_panel,frames_9slice,hud_chrome,icons_32x32,icons_64x64,quest_and_prompts,slots_and_rarity_frames}/` plus `assets/ui/hud_minimap_astrolabe_ring.png` and normalized `assets/ui/batch_a_ui_atlas_mapping.json` (mapping the 6 deduplicated slot aliases `socket_tien_thien_slot_1..3` and `socket_hau_thien_slot_1..3` to canonical socket files). Migrated `MapView.ts` and `RuntimeAssetBindings.ts` to use `building_tan_thu_tu_duong` (retiring duplicate `building_tu_duong.png`).
  - **Dependency-Backed Cleanup & Historical Archive**: Consolidated 25 unique historical/rejection artifacts into `assets/archive/history/` (`archive_manifest.json`, `ARCHIVE_INDEX.md`), consolidated 14 preview GIFs into `assets/previews/`, deleted `334` duplicate/obsolete files across `assets/**`, `docs/evidence/phase-0/**`, and `artifacts/playtest/**` plus `2` replaced in-place preview GIFs (`artifacts/corekit/COREKIT-CANON-02/cleanup_migration_log.json`), and reconciled `assets/manifest.json` (`50` assets) and `assets/provenance.json`.
  - **Pure Core Kit Validator Hardening (`ARCH-COREKIT-R1`) & Disabled Procedural Generator**: Implemented `packages/art-tools/corekit/validateCorekit.ts` + `index.ts` (`verify_manifest.ts` integration + 6 test suites in `scripts/tests/verify-corekit.test.mjs`) enforcing `HUMAN_APPROVED` + `approvalLedger` verification for active masters, `job.profileId` and `sourceFiles` SHA-256 verification on `newProductionJobs`, `catalog.runtimeProjection` file/hash/semantic equality against `deriveRuntimeAnimationProjection`, `ui-tokens.json` and `batch_a_ui_atlas_mapping.json` path existence, and major version `>= 2` override checks. Restored `apps/server/src/infrastructure/database/PgAdapter.ts` to the exact reviewed `S1-B2` baseline (`05400e8f...`) with regression test `T10` in `apps/server/src/__tests__/dbTransactions.test.ts`. Archived `packages/art-tools/legacy/build_assets.py` and replaced `packages/art-tools/build_assets.py` with a fail-closed guard exiting `2` (`LEGACY_PROCEDURAL_ASSET_BUILDER_DISABLED`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `7b386cea7ef075c6f358539ddea155cd1634db5b` (`7b386ce`)
  - Commit SHA: `NO_COMMIT` (`COMMIT_POLICY: NO_COMMIT`)
- **Tests & Verification Evidence**:
  - `npm run verify:assets` → `{"verifiedAssets":50,"verifiedCorekitActiveReferences":15,"verifiedCorekitLegacyExceptions":7,"verifiedProvenanceCharacters":3,"verifiedVisual03wCharacters":11,"verifiedMaps":2,"status":"OK"}` (exit `0`), `python packages/art-tools/build_assets.py` (exit `2`, fail-closed), `node --import tsx --test scripts/tests/*.test.mjs` (`12/12` tests passing across `verify-corekit`, `verify-architecture`, `package-runtime-assets`, `verify-doc-sync`), `npm run verify:architecture` (exit `0`), `npm run verify:doc-sync` (exit `0`), `npm run typecheck` (exit `0`), `npm test` (`58/58` passing, exit `0`), `npm run build` (exit `0`), and `artifacts/corekit/COREKIT-CANON-02/verification_summary.json`.
- **Current Status & Next Dependency**: `TECHNICAL_CHECKPOINT_VERIFIED` (`NO_COMMIT` at base `7b386ce`; 8-walk-frame Hero input `MISSING_APPROVED_HERO_INPUT`) → `VISUAL-03-U` → `VISUAL-03-Q` → `S1-F`.

---

### 3.21 `VISUAL-03-U` & `VISUAL-03-Q` — `V01-B` UI/HUD 9-Slice & Icon Integration and Measured Runtime Performance/Experience Verification
- **Associated Slice**: `S1` (`TD-05` Stage 2 UI/HUD Integration & Stage 3 Measured Runtime Quality Verification)
- **Design & Technical References**: `docs/implementation/VISUAL_03_INTEGRATION_PLAN.md` (§2.1, §4, §5), `docs/technical/CAMERA_AND_MINIMAP_CONTRACT.md`, `docs/ART_BIBLE.md`, `docs/UX_DESIGN.md`, `assets/corekit/v01b/profiles/ui-tokens.json`, `AGENTS.md` §5, `RULES.md` (Rules 1, 4, 5, 6)
- **Actual Implementation Scope**:
  - **`VISUAL-03-U` (`V01-B` Batch A UI/HUD Integration)**:
    - Integrated Batch A `V01-B` 9-slice frames (`panel_tier1_grounded_wood_jade_9slice_840x520.png`, `panel_tier2_celestial_navy_jade_9slice_840x520.png`, `panel_tier2_celestial_ivory_scroll_9slice_840x520.png`, `panel_tier3_supreme_dragon_gold_9slice_840x520.png`, `panel_quest_tracker_scroll_9slice.png`, `panel_tooltip_callout_9slice.png`), HUD chrome (`hud_top_left_crest_frame.png`, `hud_minimap_astrolabe_ring.png`, `hud_skillbar_lotus_dock.png`, `bar_hp_ruby.png`, `bar_linh_luc_azure.png`, `bar_tu_vi_cyan_gold.png`, `bar_exp_silver_gold.png`, `orb_dantian_star_core.png`), buttons/tabs/seals, character creation cards/pedestal/destiny cards/sockets, item rarity slot frames, quest/interaction prompts, and `32×32`/`64×64` attribute/item/destiny icons across `apps/client/src/game/assets/RuntimeAssetBindings.ts`, `apps/client/src/ui/HudShell.ts`, `apps/client/src/features/character/CharacterCreationView.ts`, `apps/client/src/features/character/CharacterPanel.ts`, and `apps/client/src/style.css`.
    - Enforced single-modal exclusivity (`openExclusiveModal` closing `[C]` when `[I]` opens and vice versa), separated world-anchored NPC shop (`Lão Trù Trương` at `#npc-dialogue-modal`) from personal `[I]` inventory/cooking bag, eliminated `20Hz` DOM replacement while modals are open (`lastModalRenderSignature`), displayed allocated attribute bonuses `(+N)` alongside origin values in `[C]`, and compacted mobile `390×844` HUD overlays.
  - **`VISUAL-03-Q` (Measured Frame-Time / FPS & Playfield Budget Verification)**:
    - Recorded real Playwright Headless Chromium performance and layout measurements on `WorldScene` (`tan_thu_thon` `96×72`) in `artifacts/playtest/runs/visual_03_q_verification/VISUAL_03_Q_REPORT.json` (`13th Gen Intel(R) Core(TM) i5-13400F`, Windows `10.0.26200`, Node `v22.16.0`):
      - **Desktop `1280×720` (Active Movement & Combat, `3104 ms`, `662` frames)**: `avgFps: 213.25`, `meanFrameTimeMs: 4.69`, `p95FrameTimeMs: 4.3`, `unobstructedRatio: 0.799` (`79.9% >= 78%`).
      - **Desktop `1920×1080` (Steady World, `3100 ms`, `717` frames)**: `avgFps: 231.27`, `meanFrameTimeMs: 4.32`, `p95FrameTimeMs: 4.3`, `unobstructedRatio: 0.9107` (`91.07% >= 78%`).
      - **Mobile `390×844` (Touch HUD Active, `3100 ms`, `737` frames)**: `avgFps: 237.74`, `meanFrameTimeMs: 4.21`, `p95FrameTimeMs: 4.3`, `unobstructedRatio: 0.7421` (`74.21% >= 72%`).
    - Verified `consoleErrorsCount: 0`, `pageErrorsCount: 0`, `failedAssetsCount: 0`, all 4 starter portraits loaded (`naturalWidth: 160`), `minimapMountCount: 1`, `minimapStaticDrawCount: 1`, `occlusionCheck` (`behindOccludedByCauldron: true`, `inFrontCoversCauldron: true`), and `animContract` (`14` profiles, `112` registered anim keys, `0` fallbacks).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `7b386cea7ef075c6f358539ddea155cd1634db5b` (`7b386ce`)
  - Commit SHA: `NO_COMMIT` (`COMMIT_POLICY: NO_COMMIT`)
- **Current Status & Next Dependency**: `SUPERSEDED_BY_S1_ENTRY_VISUAL_REBUILD_01` (owner rejected the modal-over-map entry and generic stacked panel presentation; rebuilt in `S1-ENTRY-VISUAL-REBUILD-01`).

---

### 3.22 `S1-F` — Character Base Closeout & Two-Browser / File-Backed Restart Acceptance Verification
- **Associated Slice**: `S1` (`TD-01` + `TD-05` Final Slice `S1` Technical Acceptance Gate)
- **Design & Technical References**: `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_MIGRATION_TESTS.md`, `docs/technical/TD_FREEZE_GATES.md`, `docs/MASTER_PROJECT_PLAN.md` §3.1
- **Actual Implementation Scope & Acceptance Proofs (`artifacts/playtest/runs/s1f_acceptance/S1F_ACCEPTANCE_REPORT.json`)**:
  - **`S1F_01_twoGuestIsolationAndMutualVisibility` (`PASS`)**: Verified two concurrent browser contexts (`guestSlotA` vs `guestSlotB`) isolate unconfirmed drafts (`localAvatarVisible: false`, invisible to confirmed world players) and synchronize mutual visibility, `appearanceId`, and world coordinates immediately upon confirmation.
  - **`S1F_02_concurrentDraftRerollConfirmRaces` (`PASS`)**: Verified concurrent duplicate `create_draft` requests allow at most `1` creation (`concurrentDraftSuccessCount: 1`), concurrent full-trio rerolls supersede earlier `rollNonce` values so confirming a stale nonce fails closed with `SUPERSEDED_ROLL_NONCE`, and concurrent `confirm_innate` calls with the active nonce succeed at most once (`concurrentConfirmSuccessCount: 1`) while subsequent rerolls after confirmation fail closed (`INVALID_CREATION_STATE`).
  - **`S1F_03_replayIdempotencyDeduplication` (`PASS`)**: Verified replaying identical `requestId` payloads across `confirm_innate`, `server_award_exp`, and `allocate_attribute` is rejected with `DUPLICATE_REQUEST` and produces zero state double-mutation.
  - **`S1F_04_allocationEquipAndRealmCapInvariants` (`PASS`)**: Verified single-point attribute allocation (`+1` per request), `Hậu Thiên` 3-slot equip/unequip, at-most-1-of-10 Legendary Signature exclusivity (`SIGNATURE_CONFLICT` when granting `huyen_anh_dao_thai` to a character already owning `van_vi_dao_thai`), and `Phàm Nhân` Lv10 cap with no-banking overflow disposal (`level: 10, expTowardNext: "0"`).
  - **`S1F_05_reconnectAndInvalidTokenRecovery` (`PASS`)**: Verified clean browser reload preserves confirmed `Character v0.2` state, and corrupted local `guestToken` triggers `#cc-recovery-section` allowing explicit credential reset into a fresh guest session.
  - **`S1F_06_fileBackedIsolatedServerRestart` (`PASS`)**: Verified full server shutdown (`gameServer1.shutdown()`) and cold restart (`gameServer2 = startGameServer(...)`) against the same isolated file-backed PGlite directory (`s1f-restart-*`, not `memory://`), preserving `characterId`, `name: "ĐạoTônBấtDiệt"`, `appearanceId: "anh_7"`, `level: 7`, `freeAttributePoints: 4`, `allocated: { luc_dao: 1, than_thuc: 1 }`, immutable `innateTraitIds`, and `activeAcquiredSlots: ["minh_khong_ngo_dao", null, null]` across restart and live browser reconnect.
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `7b386cea7ef075c6f358539ddea155cd1634db5b` (`7b386ce`)
  - Commit SHA: `NO_COMMIT` (`COMMIT_POLICY: NO_COMMIT`)
- **Current Status & Next Dependency**: `PENDING_OWNER_VISUAL_REVIEW` (re-verified alongside `S1-ENTRY-VISUAL-REBUILD-01`) → Owner visual review → Slice `S2`.

---

### 3.23 `S1-ENTRY-VISUAL-REBUILD-01` — Pre-World Entry Lifecycle, Multi-Character Account Roster (`GD-047`), Native V01-B Presentation Assets & True 9-Slice UI Rebuild
- **Associated Slice**: `S1` (`TD-01` Multi-Character Persistence & Pre-World HTTP Authority + `TD-05` `V01-B` Entry/HUD/Panel Visual Rebuild)
- **Design & Technical References**: `docs/implementation/S1_ENTRY_VISUAL_REBUILD_01.md`, `docs/DECISIONS.md` (`GD-047`), `docs/UX_DESIGN.md`, `docs/ART_BIBLE.md`, `assets/corekit/v01b/catalog.json` (`v01b.ui.approved_screen_concepts`), `assets/corekit/v01b/references/ui/screens/01_main_world_hud.png` .. `08_mobile_gameplay_layout.png`
- **Actual Implementation Scope**:
  - **Explicit Pre-World Entry Lifecycle (`apps/client/src/features/entry/{EntryFlowController,TitleAndRosterViews}.ts`, `apps/client/src/app/GameBootstrap.ts`)**:
    - Replaced modal-over-village startup with the deterministic state machine `TITLE → ROSTER → CREATE → DESTINY_ROLL → ENTERING_WORLD → IN_WORLD`.
    - Normal page load lands on `TITLE` (`TÔNG MÔN 8D: TU TIÊN CHI LỘ — THIÊN MỆNH TIÊN CUNG`) with `0` world actors and zero Colyseus room joins (`noAutoEnterWorldOnReloadVerified: true`).
    - `Bắt Đầu Chơi` authenticates/reuses `GuestIdentity`, fetches `/api/v02/characters`, and routes an empty account directly to `CREATE` (`emptyAccountDirectToCreateVerified: true`) or a populated account to `ROSTER` (`populatedAccountRoutesToRosterVerified: true`).
    - In-game `[ESC]` System Menu (`Thiên Mệnh Hệ Thống`) provides Resume, Switch/Manage Character (`Đổi Nhân Vật / Quản Lý Đạo Thân` → clean Colyseus disconnect + `ROSTER`), Settings, and Return to Title (`Về Màn Hình Chính`) without erasing the account credential.
  - **Multi-Character Per Account & Idempotent Schema Migration (`multiCharacterV02Migration.ts`, `CharacterRepository.ts`, `registerCharacterHttpRoutes.ts`, `ZoneRoom.ts`)**:
    - Added idempotent `runMultiCharacterV02Migration` dropping legacy `characters_v02_account_id_key` / single-character `account_id` PK on `character_destiny_roll_drafts_v02` and `characters` (`v0.1` bridge keyed by `character_id`), adding `last_selected_character_id` on `accounts` and `zone_id, x, y` on `characters_v02`, and keying `character_request_receipts_v02` by `(account_id, character_id, action_type, request_id)`.
    - Added authenticated HTTP pre-world routes (`POST /api/v02/auth/guest`, `GET /api/v02/characters`, `POST /api/v02/characters/draft`, `PATCH /api/v02/characters/:characterId/draft`, `POST /api/v02/characters/:characterId/roll`, `POST /api/v02/characters/:characterId/confirm`, `POST /api/v02/characters/:characterId/select`) backed by the same domain commands as realtime actions.
    - Confirmed characters enter `Tân Thủ Thôn` on initial confirmation and resume their persisted `zone_id` and `(x, y)` coordinates on subsequent selections (`existingCharacterZonePositionResumeVerified: true`); unconfirmed `"draft"` characters are rejected from world entry (`CHARACTER_NOT_CONFIRMED`) and resume `DESTINY_ROLL`.
    - Protected `apps/server/src/infrastructure/database/PgAdapter.ts` (`05400e8ff0d2ff33d80eef60bc32c606299187e288ef84a9415a90a954cb5a51`) and owner live DB (`apps/server/apps/server/data/pgdata`) remained 100% untouched.
  - **Native `V01-B` Art Generation & True CSS 9-Slice `border-image` S1 Presentation (`image-generator` `b664f32e-0884-42d8-b922-08cfb3c26cd0`)**:
    - Registered the 8 owner-approved screen concepts (`v01b.ui.approved_screen_concepts`) and generated 3 text-free raw AI sheets in `assets/source_ai/S1_ENTRY_VISUAL_REBUILD_01/`, slicing 5 runtime UI assets into `assets/ui/entry/` (`bg_title_and_creation_terrace_v01b.png`, `bg_destiny_astrolabe_chamber_v01b.png`) and `assets/ui/presentation/` (`cultivation_meditation_star_wheel_v01b.png`, `cultivation_meridian_hexagram_plate_v01b.png`, `header_banner_crest_v01b.png`) at `creativeApprovalState: "TECHNICALLY_VERIFIED"`.
    - Rebuilt `CharacterCreationView.ts`, `CharacterPanel.ts`, `HudShell.ts`, and `style.css` using true CSS 9-slice `border-image` (`panel_tier2_celestial_navy_jade_9slice.png`, `panel_tier1_grounded_wood_jade_9slice.png`, `panel_tier2_celestial_ivory_scroll_9slice.png`, `panel_tier3_supreme_dragon_gold_9slice.png`, `panel_quest_tracker_scroll_9slice.png`), removing the `0.92–0.96` dark gradient wash, internal `rollNonce` text leak, and 13 mismatched asset paths (`failedAssetCount: 0`, `notFoundCount: 0`).
- **Changed Files & Verified Commit SHA**:
  - Base Commit: `7b386cea7ef075c6f358539ddea155cd1634db5b` (`7b386ce`)
  - Commit SHA: `NO_COMMIT` (`COMMIT_POLICY: NO_COMMIT / NO_PUSH / NO_DEPLOYMENT`)
- **Tests & Verification Evidence**:
  - `npm run verify:assets` → `{"verifiedAssets":55,"verifiedCorekitActiveReferences":16,"verifiedCorekitLegacyExceptions":7,"verifiedProvenanceCharacters":3,"verifiedVisual03wCharacters":11,"verifiedMaps":2,"status":"OK"}` (exit `0`).
  - `npm run verify:architecture` → `ARCHITECTURE_VERIFIED files=85 cycles=0 violations=0` (exit `0`).
  - `npm run typecheck` (exit `0`), `npm test` (`8/8` test files, `62/62` tests passing including `characterRoster.test.ts`, exit `0`), `node --import tsx --test scripts/tests/*.test.mjs` (`12/12` passing, exit `0`), `npm run build` + `node scripts/package-runtime-assets.mjs` (`176` runtime assets packaged, exit `0`).
  - `npm run test:e2e` (`tests/e2e/runPlaytest.ts` → `ALL_GATES_PASSED`, exit `0`), `node --import tsx tests/e2e/entry/runEntryAndMultiCharacterVerification.ts` (`consoleErrorCount: 0`, `failedAssetCount: 0`, exit `0`), and `node --import tsx tests/e2e/runArchFoundationVerification.ts` (`servedAssetCount: 321`, `notFoundCount: 0`, `consoleErrorCount: 0`, `failedAssetCount: 0`, exit `0`), plus 8 side-by-side concept-vs-runtime comparison sheets in `artifacts/S1-ENTRY-VISUAL-REBUILD-01/comparison_sheets/`.
- **Current Status & Next Dependency**: `IMPLEMENTED_TECHNICALLY_VERIFIED_PENDING_OWNER_VISUAL_REVIEW` (`NO_COMMIT` at base `7b386ce`) → Owner visual review of the rebuilt entry/S1 presentation and 5 new `TECHNICALLY_VERIFIED` UI assets.
