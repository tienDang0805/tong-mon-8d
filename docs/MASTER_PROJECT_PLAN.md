# Tông Môn 8D: Tu Tiên Chi Lộ — Master Project Plan

> Status: Master Navigation & Milestone Plan (`S1-B2` Synchronized) | Base Commit: `0e9cc8d58618021a4c723efbc5fbc1860386b67c` | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Purpose & Three-Way Truth Separation

This document provides the high-level project map connecting historical foundation work, the `S0`–`S8` production vertical slice sequence, and post-`S8` expansion horizons. Rather than duplicating domain specifications, it routes directly to authoritative files in `docs/` and enforces strict separation across three truth states:

1. **`IMPLEMENTATION STATUS` (What Actually Runs or Exists in Code on Disk)**:
   - Tracked in `docs/PROJECT_STATUS.md` and `docs/implementation/FEATURE_LEDGER.md`.
   - Currently comprises the **Phase 0 / v0.1 technical prototype** (`apps/server`, `apps/client`, `packages/shared`, `packages/game-data`), **Slice `S0` (`6e38c24`)**, **Gate `G0` (`39d71c0`)**, **Checkpoint `CTX-1` (`0e9cc8d`)**, **Sub-Slice `S1-B1a` (`b04ebdc`)** pure TypeScript contracts and validators, and **Sub-Slice `S1-B2` (local/uncommitted `VERIFIED_READY_FOR_COMMIT` / `SELF_COMMIT`)** database transaction infrastructure (`apps/server/src/db.ts`, `apps/server/src/__tests__/dbTransactions.test.ts`).
   - **Runtime `Character v0.2` gameplay, `S1-B1b`, `S1-C`..`S1-F`, Slices `S2`–`S8`, database migration, Destiny rolling, Dao mastery, online Auto Farm, auto-navigation, Quest FSM, and physical `Tụ Bảo Các` NPC shops are NOT YET IMPLEMENTED.**
2. **`APPROVED SCOPE` (`DESIGN APPROVED / NOT IMPLEMENTED`)**:
   - Governed by `docs/DECISIONS.md` (`APPROVED` rows: `GD-001`–`GD-006`, `GD-010`–`GD-016`, `GD-020`–`GD-027`, `GD-030`–`GD-036`, `GD-040`–`GD-045`) and `docs/technical/TD_FREEZE_APPROVALS.md` (Technical Design Freeze v1.0 across `TD-01`–`TD-05`, 40 files at commit `39c41a6`).
3. **`DESIGN_BASELINE` / `PROPOSED` / `UNRESOLVED` Scope (Not Yet Finalized or Ratified)**:
   - **`DESIGN_BASELINE`** (`GD-017`, `GD-018`, `GD-028`, `GD-037`, plus sample numeric curves, origin stat values, Destiny weights, shop prices, and monster tables inside `TD-01`–`TD-04`): provisional designer defaults requiring simulation and explicit owner approval before production lock.
   - **`PROPOSED`** (`GD-046` era title `Thiên Kiêu Kỷ Nguyên`, invading plane `Hư Tịch Giới`, antagonist `Tịch Diệt Thánh Quân — Dạ Vô Uyên`, the seven Main Quest macro story arcs in `docs/NARRATIVE_DESIGN.md`, Dao stage 1–10 names in `docs/systems/DAO_MASTERY.md`, and unratified Destiny trait catalog entries in `docs/systems/DESTINY.md`): writer/designer scaffolding, **not** owner-approved canon.
   - **`UNRESOLVED`** (`GD-022` non-Saint level-cap overflow handling details, `GD-023` masked immortal identity, `GD-045` exact Phì Đế Food Catalog dish count threshold): open design gates tracked in `docs/technical/TD_FREEZE_GATES.md`.
   - **Visual Creative State (`AGENTS.md` §5, `RULES.md` Rule 6)**: `Candidate A` (`assets/concepts/candidate_a_classic_xianxia.jpg`, `DEC-002`) is a `PROPOSED` visual reference (`PROPOSED` / `TECHNICALLY_VERIFIED`), and Phase 0 PoC sprites (`DEC-003`) are `TECHNICALLY_VERIFIED` only; neither is `HUMAN_APPROVED` final production art.

---

## 2. Completed Foundation & Governance Phases

| Phase / Gate | Status | Verified Commit | Canonical References | Summary of Delivered Scope |
|---|---|---|---|---|
| **Phase 0** — Technical Prototype & Multi-Pose Sprite PoC | `TECHNICALLY_VERIFIED` (Legacy v0.1 Runtime) | `934f728` / `21ae81e` | `docs/PROJECT_STATUS.md`, `docs/IMPLEMENTATION_STATUS.md` | Playable Colyseus + PGlite + Phaser 4 v0.1 prototype, 2 Tiled zones (`maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`), 3 PoC `80x96` (`480x1920`) sheets + 9 legacy `48x64` (`288x1024`) sheets (`PLACEHOLDER` / `TECHNICALLY_VERIFIED`). |
| **Phase 1A** — Workspace Audit & Generative Art Rules | `COMMITTED` | `7914c2a` / `e0eab60` | `AGENTS.md`, `RULES.md`, `docs/CONTEXT_AUDIT.md`, `.agents/skills/ai-art-production/SKILL.md` | Source-of-truth hierarchy, 6 workspace rules, 5-state creative approval ledger, and generative art policy. |
| **Phase 1B.0** — Game Design Baseline v0.2 | `COMMITTED` (`DESIGN APPROVED / NOT IMPLEMENTED`) | `d4e6e17` | `docs/DECISIONS.md`, `docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/CONTENT_PIPELINE.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md` | Authoritative `GD-001`–`GD-046` decision register and 10 baseline design documents. |
| **Phase 1B.1–1B.5** — Technical Design Freeze v1.0 (`TD-01`–`TD-05`) | `COMMITTED` (`DESIGN APPROVED / NOT IMPLEMENTED`) | `39c41a6` | `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/TD_FREEZE_APPROVALS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, `docs/technical/TD_FREEZE_GATES.md`, `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`, `docs/systems/*.md` (17), `docs/pipelines/*.md` (5), `docs/technical/TD01..TD05_*.md` (13) | 40 frozen technical specifications defining single-owner boundaries across `TD-01` through `TD-05` (including `docs/systems/NPC_SHOPS.md`). |
| **Slice `S0`** — Foundation, PGlite Backup & Environment Safety | `COMMITTED` | `6e38c24` | `docs/DEVELOPMENT_SETUP.md`, `docs/implementation/FEATURE_LEDGER.md` §3.1 | Deterministic `resolvePgDataDir` split-brain protection, non-overriding `.env` loader, isolated `memory://` E2E playtest runs, and offline PGlite backup + throwaway restore proof. |
| **Gate `G0`** — Agent Workflow Governance & Skill Optimization | `COMMITTED` | `39d71c0` | `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/implementation/FEATURE_LEDGER.md` §3.2 | 30-skill classification & slice router, fail-closed Argon native `image-generator` profile, ban on whole-command `build_assets.py` execution, and execution lifecycle contract. |
| **Checkpoint `CTX-1`** — Documentation Reconciliation & `DOC SYNC` Gate | `COMMITTED` | `0e9cc8d` | `docs/MASTER_PROJECT_PLAN.md`, `docs/implementation/FEATURE_LEDGER.md` §3.5, `docs/technical/AGENT_EXECUTION_CONTRACT.md` | 9-stage `DOC SYNC` contract, Master Project Plan, Feature Ledger, and status/path reconciliation across governance docs. |

---

## 3. Approved First Production Vertical Slice Sequence (`S1`–`S8`)

Governed by `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, and `docs/technical/AGENT_EXECUTION_CONTRACT.md`. Each slice or sub-slice requires an explicit owner-approved `PLAN` before `BUILD`.

### 3.1 Slice `S1` — Character Schema v0.2 & Migration (`TD-01` + `TD-05` HUD) — **Status: `IN PROGRESS, NOT COMPLETE`**
- **Canonical Specs**: `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD01_MIGRATION_TESTS.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/UX_WORLD_FIRST.md`.
- **Sub-Slice Breakdown & Exact Status**:
  - **`S1-A` (`READ-ONLY PLAN / DESIGN EVIDENCE REVIEWED`)**: Source-grounded `TD-01` audit and Design Evidence Matrix (`docs/implementation/FEATURE_LEDGER.md` §3.3).
  - **`S1-B1a` (`COMMITTED` at `b04ebdc`)**: Pure TypeScript contracts and validators in `packages/shared/src/index.ts`, `packages/game-data/src/index.ts`, and `apps/server/src/__tests__/td01Contracts.test.ts` (`docs/implementation/FEATURE_LEDGER.md` §3.4).
  - **`S1-B1b` (`PROPOSED NEXT PURE NUMERIC TASK, NOT IMPLEMENTED`)**: Pure numeric/formula helpers for `TD-01` candidate curves/weights once reviewed and authorized by owner.
  - **`S1-B2` (local/uncommitted `VERIFIED_READY_FOR_COMMIT` / `SELF_COMMIT` at Base `0e9cc8d`)**: Database transaction infrastructure (`withTransaction` / atomic unit-of-work support in `apps/server/src/db.ts` and `9` test cases in `apps/server/src/__tests__/dbTransactions.test.ts`; `docs/implementation/FEATURE_LEDGER.md` §3.6).
  - **`S1-C` (`SCHEMA / BACKUP / MIGRATION, NOT IMPLEMENTED`)**: Separately approved non-destructive offline PGlite backup/restore preflight + PostgreSQL `v0.1 -> v0.2` schema migration (`legacy_migration_pending` preservation, zero save loss).
  - **`S1-D` (`AUTHORITATIVE SERVER ACTIONS, NOT IMPLEMENTED`)**: Colyseus server handlers for character creation, CSPRNG `Tiên Thiên` trio rolling/confirmation (`rollNonce`), single-point attribute allocation (`AllocateAttributeIntent`), and `Hậu Thiên` slot equip (`EquipAcquiredDestinyIntent`).
  - **`S1-E` (`CLIENT/HUD, NOT IMPLEMENTED`)**: Playfield-first HUD (`apps/client/src/hud.ts`) and creation/Destiny modal wiring under `TD-05` (`docs/pipelines/UX_WORLD_FIRST.md`).
  - **`S1-F` (`E2E ACCEPTANCE, NOT IMPLEMENTED`)**: Two-browser E2E acceptance and server restart persistence verification for `S1`.

### 3.2 Slices `S2` through `S8` — **Status: `NOT STARTED`**

| Slice | Domain Owners | Canonical Specs (`docs/`) | Core Acceptance Gate (`TD_FREEZE_IMPLEMENTATION_PATH.md`) | Status |
|---|---|---|---|---|
| **`S2`** | `TD-01` + `TD-03` (Quest FSM) + `TD-05` | `CHARACTER.md`, `CULTIVATION.md`, `QUEST_ENGINE.md`, `VISUAL_CONTENT_CONTRACT.md` | Deterministic stat recomputation and `Phàm Nhân` Lv 10 → `Luyện Khí` breakthrough after manual masked-immortal Main Quest encounter (`GD-023`, identity kept **OPEN**), starter `Công pháp` + breakthrough pill, manual breakthrough, no level skip. | `NOT STARTED` |
| **`S3`** | `TD-02` + `TD-01` + `TD-05` | `COMBAT.md`, `TECHNIQUES.md`, `DAO_MASTERY.md`, `TD02_SIMULATION.md`, `ANIMATION_VFX_FEEDBACK.md` | Common server-authoritative combat action (identical damage math for manual and scheduled casts), 6 Dao paths (`Kiếm, Đao, Chỉ, Chưởng, Thể, Pháp`), `3→4` refuses advancement without trial, real in-world animations at target. | `NOT STARTED` |
| **`S4`** | `TD-03` + `TD-02` + `TD-05` | `AUTO_FARM.md`, `NAVIGATION.md`, `QUEST_ENGINE.md`, `TD03_CONSISTENCY_MATRIX.md`, `UX_WORLD_FIRST.md` | Connected-only Auto Farm (`GD-002`; disconnect halts combat, zero offline monster kills), single active controller per character across two tabs, map-safe auto-navigation stopping at destination (`GD-004`), manual quest interaction (`GD-003`). | `NOT STARTED` |
| **`S5`** | `TD-04` + `TD-01..03` + `TD-05` | `CONTENT_REGISTRY.md`, `ITEMS_ECONOMY.md`, `FOOD_CATALOG.md`, `NPC_AFFINITY.md`, `WORLD_CONTENT.md`, `QUEST_CONTENT.md` | Single-channel committed item reward delivery (never both direct grant and ground loot), distinct story states, public Main Quest not gated by signature destiny, synchronized monster HP across browsers. | `NOT STARTED` |
| **`S6`** | `TD-04` (`NPC_SHOPS.md`) + `TD-03` + `TD-05` | `NPC_SHOPS.md`, `ITEMS_ECONOMY.md`, `FOOD_CATALOG.md`, `WORLD_SCENE_ASSEMBLY.md`, `UX_WORLD_FIRST.md` | Physical in-world `Tụ Bảo Các` building + `Lão Trù Trương` + specialist NPCs, manual `BUY`/`SELL` with search/filter via single `ShopService`, no remote trading, no P2P market, gameplay screenshots with shop closed/open. | `NOT STARTED` |
| **`S7`** | `TD-05` | `ART_BIBLE.md`, `CHARACTER_VISUAL_BIBLE.md`, `VISUAL_CONTENT_CONTRACT.md`, `AI_ASSET_PRODUCTION.md`, `ARGON_NATIVE_ASSET_PROFILE.md`, `TD05_VERTICAL_SLICE_ACCEPTANCE.md` | First full genuine generative art pack/zone with raw source provenance, audited post-processing, Phaser/Tiled integration, actual scene capture, and explicit owner `HUMAN_APPROVED` sign-off. | `NOT STARTED` |
| **`S8`** | `TD-01`–`TD-05` (All TDs) | `TD05_VERTICAL_SLICE_ACCEPTANCE.md`, `TD_FREEZE_GATES.md`, `TD_FREEZE_APPROVALS.md` | 12-beat human playthrough acceptance of the complete first production vertical slice in-world across two real browsers. | `NOT STARTED` |

---

## 4. Post-`S8` Expansion Backlog (Proposed Future Horizons — Not Frozen Milestones)

All post-`S8` work below is deferred until after `S1`–`S8` vertical slice completion and owner `HUMAN_APPROVED` visual sign-off. Any phase groupings below are organizational only, **not** mandatory frozen milestones:

1. **World, Biome & `Bí Cảnh` Expansion (`docs/WORLD_DESIGN.md`, `docs/systems/WORLD_CONTENT.md`)**:
   - **Approved Architecture (`GD-033`–`GD-036`)**: Interconnected Bát Hoang overworld zones, interior buildings, NPC residences (`động phủ`), **Combat `Bí Cảnh`**, and **Point-and-Click `Bí Cảnh`** (including mandatory Dao mastery trial instances at stages `3→4`, `6→7`, and `9→10` per `GD-025`), with fixed zone difficulty tuned around a cohesive `Tiên Phẩm` build (`GD-034`).
   - **Pending Content & Art**: Specific post-slice zone maps, coordinates, monster rosters, and generative tileset/prop packs remain to be authored and approved per zone via `docs/CONTENT_PIPELINE.md`.
2. **Legendary Domains & Ten 6-Chapter True Disciple (`Chân Truyền`) Routes (`docs/NARRATIVE_DESIGN.md`, `docs/systems/NPC_AFFINITY.md`, `docs/systems/QUEST_CONTENT.md`)**:
   - **Approved Architecture (`GD-014`–`GD-016`, `GD-041`, `GD-045`)**:
     - Ten optional 6-chapter Special Questlines, one for each canonical Legendary NPC (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`).
     - Strict state machine (`GD-015`): `UNBOUND/INELIGIBLE → SIGNATURE_OWNED → AFFINITY_MET → SPECIAL_TRIGGER_MET → SPECIAL_QUESTLINE_UNLOCKED → ALL_SIX_CHAPTERS_COMPLETED → TRUE_DISCIPLE`.
     - **Phì Đế (`Ẩm Thực Đại Đạo`) First Candidate (`GD-016`, `GD-045`)**: Requires signature **Vạn Vị Đạo Thai**, affinity primarily via gifts, and a food-breadth special trigger supporting both purchased and self-cooked dishes.
   - **Unresolved / Proposed Details**: The exact dish threshold for Phì Đế's trigger is `UNRESOLVED` pending the **Food Catalog** (`GD-045`), the remaining 9 Legendary signature destiny names/modifiers are `PROPOSED` (`docs/systems/DESTINY.md`), and the 60 chapter scripts are not yet authored.
3. **Universal Main Quest Toward Playable `Thánh Cảnh` (`docs/NARRATIVE_DESIGN.md`, `docs/GAME_LORE.md`)**:
   - **Approved Narrative Spine (`GD-006`, `GD-040`–`GD-044`)**:
     - Accessible to every character from `Phàm Nhân` (`Lv 1–10`) to the last playable major realm **`Thánh Cảnh` (`Lv 331–350+`)** without requiring any Legendary signature or True Disciple status (`GD-006`, `GD-040`).
     - Features all 10 Legendary NPCs (`GD-041`), escalates to a cross-dimensional invasion finale (`GD-042`), and includes the late-game reveal that Phì Đế is an incarnation of **Ăn Uống Thiên Tôn** (`GD-043`).
     - Higher realms (**`Đại Thánh`**, **`Cổ Thần`**) and higher planes exist strictly as offscreen lore (`GD-044`).
   - **Proposed Narrative Scaffolding (`GD-046` — `PROPOSED`, Not Owner-Canon)**:
     - The era title (`Thiên Kiêu Kỷ Nguyên`), invading plane (`Hư Tịch Giới`), primary antagonist (`Tịch Diệt Thánh Quân — Dạ Vô Uyên`), and the seven macro story arc titles (`I. Phàm Nhân Vấn Đạo` through `VII. Thánh Nhân Chi Chiến` in `docs/NARRATIVE_DESIGN.md`) remain `PROPOSED` writer scaffolding awaiting explicit owner ratification.
4. **Co-Op PvE & Private Alpha/Beta Operations (`docs/GAME_VISION.md`, `docs/DEVELOPMENT_SETUP.md`)**:
   - **Target Scale (`GD-001`)**: Private multiplayer sessions for friends (`~8–20` concurrent players), zero monetization or pay-to-win.
   - **Co-Op PvE Rules**: Shared overworld zones, 2–4 player parties, shared boss encounters, and combat instances, while preserving per-character quest states, story choices, and signature exclusivity (`docs/NARRATIVE_DESIGN.md`).
   - **Pre-Alpha Operational & Security Gates (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §5)**:
     - Gate `POST /api/test/advance-clock` in `apps/server/src/index.ts` behind a test-only guard before any shared/staging host exposure.
     - Complete command-level audit/refactor of `packages/art-tools/build_assets.py` and upgrade `packages/art-tools/verify_manifest.ts` to enforce portable provenance paths and provider allowlists.

---

## 5. Release & Milestone Promotion Gates (`docs/ROADMAP.md`, `docs/technical/TD_FREEZE_GATES.md`)

No slice (`S1`–`S8`) or post-`S8` expansion item may be marked complete without satisfying all four gates:
1. **`DESIGN` Gate**: Matches `docs/DECISIONS.md` and `docs/technical/TD_FREEZE_APPROVALS.md` without silently promoting `DESIGN_BASELINE`, `PROPOSED`, or `UNRESOLVED` items.
2. **`TECHNICAL` Gate**: Passes `git diff --check`, `npm run verify:assets`, `npm test`, `npm run typecheck`, `npm run build`, and (when runtime/UI changes occur) isolated two-browser `npm run test:e2e`.
3. **`CREATIVE` Gate**: Player-visible assets and in-world scenes pass technical verification (`TECHNICALLY_VERIFIED`) **and** receive explicit human project-owner approval at actual gameplay zoom (`HUMAN_APPROVED` in `AGENTS.md` §5).
4. **`DOC SYNC` & `REMOTE CLOSEOUT` Gate**: Synchronized in `docs/implementation/FEATURE_LEDGER.md` and relevant status docs under `docs/technical/AGENT_EXECUTION_CONTRACT.md`, approved by the owner, and verified on `origin/master`.
