# Tông Môn 8D — Implementation & Verification Feature Ledger

> Status: Active Engineering Ledger (`S1-B2` `COMMITTED` at `0543b71`; `GOV-REPORT` `COMMITTED` at `f06c510`; `GOV-REPORT-H1` Synchronized) | Base Commit: `f06c510d43049104d8feb76d4dcf4890ea0eea6c` | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Purpose & Ledger Governance Rules

This ledger records what each completed or reviewed task in `tienDang0805/tong-mon-8d` **actually implemented and verified on disk**, strictly separated from design-only specifications (`docs/DECISIONS.md`, `docs/systems/*`, `docs/pipelines/*`, `docs/technical/*`).

1. **Evidence-Grounded Entries Only**: Every entry must cite real repository paths, actual verification commands/outputs, and verified Git commit SHAs on `origin/master`.
2. **Design vs. Implementation Separation**: Never record a gameplay system as implemented when only specifications, read-only plans, or pure TypeScript contract/validator subsets exist.
3. **Commit SHA Closeout Rule (`docs/technical/AGENT_EXECUTION_CONTRACT.md`)**:
   - Completed prior commits record their exact immutable Git SHA (`6e38c24`, `39d71c0`, `b04ebdc`, `0e9cc8d`, `0543b71`, `f06c510`).
   - Because a commit cannot contain its own future SHA, the active task being committed records `Commit SHA: SELF_COMMIT (reported at REMOTE CLOSEOUT after push)` and `Status: VERIFIED_READY_FOR_COMMIT`, which is then backfilled with the exact SHA during the next authorized `DOC SYNC`.

---

## 2. Current Slice & Sub-Slice Status Summary

| Slice / Sub-Task | Scope Summary | Current Status | Verified Commit SHA |
|---|---|---|---|
| `S0` | Foundation, PGlite split-brain safety, `.env` loader, isolated E2E runs | `COMMITTED` | `6e38c246cabcd020efe137863838d6a61e7b1a72` (`6e38c24`) |
| `G0` | Agent workflow governance, 30-skill router & Argon native asset profile | `COMMITTED` | `39d71c06a830f5f2d9ae2d64b09cb18aa3efebc4` (`39d71c0`) |
| `S1` (Overall) | Character schema v0.2 & migration (`TD-01` + `TD-05` HUD/visual bindings) | `IN PROGRESS, NOT COMPLETE` | Partial (`S1-B1a` at `b04ebdc`; `S1-B2` at `0543b71`) |
| `S1-A` | Character v0.2 migration plan & strict Design Evidence Matrix | `READ-ONLY PLAN / DESIGN EVIDENCE REVIEWED` | `NONE` (Read-only plan at base `39d71c0`) |
| `S1-B1a` | Pure Character, Destiny metadata & 18-entry realm level-band contracts | `COMMITTED` | `b04ebdc72ffede9edb678008ed30d002c73b5cc6` (`b04ebdc`) |
| `CTX-1` | Documentation reconciliation, `DOC SYNC` gate, Feature Ledger & Master Project Plan | `COMMITTED` | `0e9cc8d58618021a4c723efbc5fbc1860386b67c` (`0e9cc8d`) |
| `S1-B1b` | Proposed next pure numeric/formula task (`TD-01` candidate curves/weights if authorized) | `PROPOSED NEXT PURE NUMERIC TASK, NOT IMPLEMENTED` | `NONE` |
| `S1-B2` | Database transaction infrastructure & atomic unit-of-work helpers | `COMMITTED` | `0543b7157264ce672d2582d0bfa0a071ba855a42` (`0543b71`) |
| `GOV-REPORT` | Persistent Antigravity review-handoff rule & reusable review packet exporter | `COMMITTED` | `f06c510d43049104d8feb76d4dcf4890ea0eea6c` (`f06c510`) |
| `GOV-REPORT-H1` | Review packet exporter hardening (untracked detection, path/reparse safety, clean `CLOSEOUT`) | `VERIFIED_READY_FOR_COMMIT` (local/uncommitted) | `SELF_COMMIT` (Base `f06c510`) |
| `S1-C` | PostgreSQL `v0.1 -> v0.2` schema, approved offline backup/restore preflight & migration | `SCHEMA / BACKUP / MIGRATION, NOT IMPLEMENTED` | `NONE` |
| `S1-D` | Authoritative Colyseus server actions (creation/reroll/confirm/allocate) | `AUTHORITATIVE SERVER ACTIONS, NOT IMPLEMENTED` | `NONE` |
| `S1-E` | Playfield-first client/HUD Character v0.2 & Destiny UI integration (`TD-05`) | `CLIENT/HUD, NOT IMPLEMENTED` | `NONE` |
| `S1-F` | Two-browser E2E acceptance & persistence/restart verification for `S1` | `E2E ACCEPTANCE, NOT IMPLEMENTED` | `NONE` |
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
    - Database transaction infrastructure (`S1-B2`), PostgreSQL `v0.1 -> v0.2` schema/backup/migration (`S1-C`), authoritative Colyseus server handlers (`S1-D`), client/HUD wiring (`S1-E`), and E2E acceptance (`S1-F`) remain **`NOT IMPLEMENTED`**.
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
    - `Character v0.2` runtime gameplay, `S1-B1b` (`PROPOSED NEXT PURE NUMERIC TASK, NOT IMPLEMENTED`), `S1-C` (`SCHEMA / BACKUP / MIGRATION, NOT IMPLEMENTED`), `S1-D` (`AUTHORITATIVE SERVER ACTIONS, NOT IMPLEMENTED`), `S1-E` (`CLIENT/HUD, NOT IMPLEMENTED`), `S1-F` (`E2E ACCEPTANCE, NOT IMPLEMENTED`), and Slices `S2`–`S8` (`NOT STARTED`) remain **`NOT IMPLEMENTED`**.
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
  - Commit SHA: `SELF_COMMIT` (local/uncommitted; reported at `REMOTE CLOSEOUT` after owner approval and push)
  - Files: `scripts/export-review-packet.ps1`, `scripts/tests/export-review-packet.test.ps1`, `.agents/rules/review-handoff.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/implementation/FEATURE_LEDGER.md`
- **Tests & Verification Evidence**:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/tests/export-review-packet.test.ps1` (`17/17` disposable-fixture tests `ALL_PASSED`, exit `0`), `git diff --check` (exit `0`), `npm run verify:assets` (exit `0`), `npm test` (`3` suites, `23/23` tests passing, exit `0`), `npm run typecheck` (exit `0`), `npm run build` (exit `0`), `LIVE_PG_INTEGRATION: NOT_RUN`.
- **Known Limitations & Deferred Scope (`DOC_SYNC_DEFERRED`)**:
  - **`DOC_SYNC_DEFERRED`**: `docs/PROJECT_STATUS.md` is outside the `GOV-REPORT-H1` Documentation Allowlist; backfilling `GOV-REPORT` (`f06c510`) and recording `GOV-REPORT-H1` in `docs/PROJECT_STATUS.md` is deferred to the next task or `CTX-*` checkpoint where `docs/PROJECT_STATUS.md` is authorized.
  - Path, root, and reparse-point validation does not guarantee arbitrary file contents are free of secrets. Does not implement `S1-B1b` or `S1-C` gameplay/database changes.
- **Current Status & Next Dependency**: `VERIFIED_READY_FOR_COMMIT` (local/uncommitted `SELF_COMMIT` at Base `f06c510`) → Owner review and commit/push approval.
