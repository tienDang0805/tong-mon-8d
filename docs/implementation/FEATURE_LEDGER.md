# Tông Môn 8D — Implementation & Verification Feature Ledger

> Active engineering ledger | Last verified remote: `b82e20b148ad08544c3efd1003d1111364a45e51` | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Purpose & Ledger Governance Rules

This ledger records what each completed or reviewed task in `tienDang0805/tong-mon-8d` **actually implemented and verified on disk**, strictly separated from design-only specifications (`docs/DECISIONS.md`, `docs/systems/*`, `docs/pipelines/*`, `docs/technical/*`).

1. **Evidence-Grounded Entries Only**: Every entry must cite real repository paths, actual verification commands/outputs, and verified Git commit SHAs on `origin/master`.
2. **Design vs. Implementation Separation**: Never record a gameplay system as implemented when only specifications, read-only plans, or pure TypeScript contract/validator subsets exist.
3. **Commit SHA Closeout Rule (`docs/technical/AGENT_EXECUTION_CONTRACT.md`)**:
   - Completed prior commits record their exact immutable Git SHA (`6e38c24`, `39d71c0`, `b04ebdc`, `0e9cc8d`, `0543b71`, `f06c510`, `0c00374`, `fdd8e8b`, `cb360e8`, `bf2d24f`, `897197a`, `a3de054`, `b82e20b`).
   - Because a commit cannot contain its own future SHA, the active task being committed records `Commit SHA: SELF_COMMIT (reported at REMOTE CLOSEOUT after push)` and `Status: VERIFIED_READY_FOR_COMMIT`, which is then backfilled with the exact SHA during the next authorized `DOC SYNC`.

---

## 2. Current Slice & Sub-Slice Status Summary

| Slice / Sub-Task | Scope Summary | Current Status | Verified Commit SHA |
|---|---|---|---|
| `S0` | Foundation, PGlite split-brain safety, `.env` loader, isolated E2E runs | `COMMITTED` | `6e38c246cabcd020efe137863838d6a61e7b1a72` (`6e38c24`) |
| `G0` | Agent workflow governance, 30-skill router & Argon native asset profile | `COMMITTED` | `39d71c06a830f5f2d9ae2d64b09cb18aa3efebc4` (`39d71c0`) |
| `S1` (Overall) | Character schema v0.2, `S1` visual sequence & persistence (`TD-01` + `TD-05` HUD/visual bindings) | `IN PROGRESS, NOT COMPLETE` | Partial (`S1-B1a` at `b04ebdc`; `S1-B2` at `0543b71`; `S1-B1b` at `cb360e8`; `S1-C` at `bf2d24f`; `S1-D` at `897197a`; `S1-E` at `a3de054`; `PRE-S1F` at `b82e20b`; `DOC-CLEAN-01` at `SELF_COMMIT`; `VISUAL-01..03` & `S1-F` open) |
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
| `DOC-CLEAN-01` | Post-`PRE-S1F` doc reconciliation, legacy bootstrap archive (`docs/archive/legacy/*`) with locator stubs, bounded mechanical `verify:doc-sync` + fixture tests, and `VISUAL-01..03 -> S1-F` sequence | `VERIFIED_READY_FOR_COMMIT` (local/uncommitted) | `SELF_COMMIT` (Base `b82e20b148ad08544c3efd1003d1111364a45e51`) |
| `VISUAL-01` → `VISUAL-03` | Scoped `S1` visual direction sets (`VISUAL-01`), sample asset pack & continuous animations (`VISUAL-02`), and Phaser/Tiled integration & measured frame-time/FPS review (`VISUAL-03`) | `NOT STARTED` | `NONE` |
| `S1-F` | Two-browser E2E acceptance & file-backed isolated PGlite restart verification for `S1` | `E2E ACCEPTANCE, NOT IMPLEMENTED` | `NONE` |
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
  - Commit SHA: `SELF_COMMIT` (reported at closeout after push under `COMMIT_POLICY: COMMIT_AND_PUSH_AFTER_CHECKS`)
  - Files (`21` edited documentation paths + `2` edited utility/HTML paths + `4` created archive paths + `1` created utility test path + `2` deleted active paths = `30` total allowlisted paths): `AGENTS.md`, `RULES.md`, `START_HERE.md`, `MASTER_PROMPT.md`, `docs/ART_BIBLE.md`, `docs/CONTENT_PIPELINE.md`, `docs/CONTEXT_AUDIT.md`, `docs/CONTEXT_INDEX.md`, `docs/DECISIONS.md`, `docs/DEVELOPMENT_SETUP.md`, `docs/GAME_DESIGN.md`, `docs/GAME_LORE.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/tong-mon-8d-project-atlas.html`, `scripts/verify-doc-sync.mjs`, `scripts/tests/verify-doc-sync.test.mjs`, `docs/archive/legacy/MASTER_PROMPT.md`, `docs/archive/legacy/CONTEXT_AUDIT.md`, `docs/archive/legacy/IMPLEMENTATION_STATUS.md`, `docs/archive/legacy/EXTERNAL_SKILLS.md`, plus removed `EXTERNAL_SKILLS.md` and `docs/WORKSPACE_HANDOFF.md`.
- **Tests & Verification Evidence**:
  - `DOC SYNC` + standalone utility fixture verification profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2): 4 archived files verified byte-identical to `HEAD` (`b82e20b`) blobs (`7269e36...`, `95fb32d...`, `02346d5...`, `fdc601e...`), 40 frozen TD files verified (`0` diff lines vs `39c41a6ddb77b93284c56da7ec053f4309ee4943`), `node --check scripts/verify-doc-sync.mjs` (exit `0`), `node scripts/verify-doc-sync.mjs` (exit `0`), `node scripts/tests/verify-doc-sync.test.mjs` (`PASS`, exit `0`), Rule 1 zero-comment check across modified scripts, HTML, and Markdown code blocks (`0` violations), `git diff --cached --check` (exit `0`). Game runtime/build/E2E/sim/exporter suites: `NOT_APPLICABLE` (reused unchanged `b82e20b` and `0c00374` evidence).
- **Known Limitations & Deferred Scope**:
  - Documentation and standalone doc-sync utility cleanup only; does not modify gameplay runtime, database schemas, or visual assets. Semantic status consistency across docs remains a scoped agent self-review rather than an NLP/regex machine proof.
- **Current Status & Next Dependency**: `VERIFIED_READY_FOR_COMMIT` (`SELF_COMMIT` at Base `b82e20b148ad08544c3efd1003d1111364a45e51`) → Commit & push under `COMMIT_AND_PUSH_AFTER_CHECKS`, then await owner/planner dispatch of **`VISUAL-01`** (`VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F`).
