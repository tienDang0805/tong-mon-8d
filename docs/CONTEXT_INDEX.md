# Context Index — Where an agent should read first

> Version: Game Design Baseline v0.2 | Date: 2026-10-16 | Status: DESIGN BASELINE

## Reading order for every session

1. `AGENTS.md` and `RULES.md` (security, canon, art provenance, quality gates).
2. **`docs/DECISIONS.md`** (new approved gameplay direction supersedes legacy conflicting gameplay).
3. **`docs/technical/TD_FREEZE_OVERVIEW.md`**, **`docs/technical/TD_FREEZE_APPROVALS.md`**, **`docs/technical/TD_FREEZE_CONTRACT_MAP.md`**, and **`docs/technical/TD_FREEZE_GATES.md`** (Technical Design Freeze v1.0 scope, single-owner contract boundaries, and open gates).
4. `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, `docs/ROADMAP.md`, `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md` (what exists on disk, next safe phase, what is **DESIGN APPROVED / NOT IMPLEMENTED**).
5. `docs/GAME_VISION.md` / `docs/GAME_DESIGN.md` plus the relevant `docs/systems/*`, `docs/pipelines/*`, and `docs/technical/TD01..TD05_*` specifications and `.agents/skills/*/SKILL.md` only for the active task.

**Conflict policy**: Safety/canon boundaries remain highest. Owner-approved gameplay decisions in `docs/DECISIONS.md` and technical scope approvals in `docs/technical/TD_FREEZE_APPROVALS.md` override historical gameplay/bootstrap instructions where explicitly inconsistent. `packages/game-data/src/index.ts` is current implementation data, not automatic approval of outdated mechanics. Never erase canonical IDs or make undocumented lore changes.

## Document responsibilities

| Document | Owns | Does not own |
|---|---|---|
| `docs/DECISIONS.md` | Approved/non-approved decision register | Detailed algorithms or current code correctness |
| `docs/technical/TD_FREEZE_*.md` | Cross-TD freeze overview, approvals ledger, contract ownership map, open gates, and `S0`–`S8` implementation path | Claim that TD-01..05 code or final art is implemented |
| `docs/systems/*.md` (17 specs) | Domain technical design contracts for `TD-01`..`TD-05` (`DESIGN APPROVED / NOT IMPLEMENTED`) | Final production numeric tuning or `HUMAN_APPROVED` art sign-off |
| `docs/pipelines/*.md` (5 specs) | Visual content, AI asset production, scene assembly, VFX, and world-first UX pipelines (`DESIGN APPROVED / NOT IMPLEMENTED`) | Autonomous promotion of `TECHNICALLY_VERIFIED` art to `HUMAN_APPROVED` |
| `docs/technical/TD01..TD05_*.md` (13 specs) | Reference simulations, consistency matrices, migration plans, and vertical-slice acceptance criteria (`DESIGN APPROVED / NOT IMPLEMENTED`) | Authorization to delete local DB saves or run unapproved migrations |
| `docs/GAME_VISION.md` | Identity, audience, short/long loops, anti-goals | Formula parameters |
| `docs/GAME_LORE.md` | Canon cosmology, NPC identity, confirmed and proposed plot | Source code schemas |
| `docs/GAME_DESIGN.md` | All core system interactions, proposed rules, reward loops | Detailed formula and data contracts (`docs/systems/*`) |
| `docs/NARRATIVE_DESIGN.md` | Main/Side/Special quest topology and Chân Truyền gating | Claim that 60 full quests were implemented |
| `docs/WORLD_DESIGN.md` | Zone topology, structures, map types, difficulty ownership | Final Tiled coordinates of undeveloped zones |
| `docs/UX_DESIGN.md` | HUD/quest/AFK navigation and UI behavior | Approved visual assets |
| `docs/CONTENT_PIPELINE.md` | Content addition dependency workflow, artifact checks | AI provider availability/consumption approval |
| `docs/ROADMAP.md` | Phase boundaries, gates, acceptance | Historical milestone verification |
| `docs/ART_BIBLE.md` + `docs/CHARACTER_VISUAL_BIBLE.md` | Visual spec and creative review | Owner-approved RPG formulas |
| `docs/CONTEXT_AUDIT.md` | Phase 1A historical audit | Latest game vision |
| `docs/PROJECT_STATUS.md` | Actually implemented and verified | Future designed-only promises |
| `docs/IMPLEMENTATION_STATUS.md` | Archived technical baseline | Human visual or gameplay approval |
| `MASTER_PROMPT.md` | Canonical historical world lore, prior quest candidates | Execute archived bootstrap instructions |

## Task-based routing (Technical Design Freeze v1.0 — All `docs/systems/*` & `docs/pipelines/*` Are `DESIGN APPROVED / NOT IMPLEMENTED`)

| Task type | Additional required reading |
|---|---|
| Character/EXP/Cảnh Giới (`TD-01`) | `GAME_DESIGN.md`, `DECISIONS.md`, `docs/systems/CHARACTER.md`, `docs/systems/CULTIVATION.md`, `docs/technical/TD01_SIMULATION.md`, `docs/technical/TD01_MIGRATION_TESTS.md`, `packages/game-data/src/index.ts` |
| Destiny/Chân Truyền (`TD-01` + `TD-04`) | `DECISIONS.md`, `NARRATIVE_DESIGN.md`, `docs/systems/DESTINY.md`, `docs/systems/NPC_AFFINITY.md`, `docs/systems/FOOD_CATALOG.md`, `docs/systems/QUEST_CONTENT.md` |
| Công pháp/Võ kỹ/Đạo Cảnh (`TD-02`) | `GAME_DESIGN.md`, `docs/systems/DAO_MASTERY.md`, `docs/systems/TECHNIQUES.md`, `docs/technical/TD02_SIMULATION.md`, `docs/technical/TD02_MIGRATION_TESTS.md` |
| Combat/Auto Farm/Navigation (`TD-02` + `TD-03`) | `GAME_DESIGN.md`, `UX_DESIGN.md`, `docs/systems/COMBAT.md`, `docs/systems/AUTO_FARM.md`, `docs/systems/NAVIGATION.md`, `docs/technical/TD03_CONSISTENCY_MATRIX.md`, `docs/technical/TD03_PROTOCOL_MIGRATION_TESTS.md`, `docs/technical/TD03_REFERENCE_SIMULATION.md`, `apps/server/src/worldEngine.ts` |
| Quest engine/story/world content (`TD-03` + `TD-04`) | `NARRATIVE_DESIGN.md`, `GAME_LORE.md`, `docs/systems/QUEST_ENGINE.md`, `docs/systems/QUEST_CONTENT.md`, `docs/systems/WORLD_CONTENT.md`, `docs/systems/CONTENT_REGISTRY.md`, `docs/technical/TD04_CONSISTENCY_FREEZE.md`, `docs/technical/TD04_MIGRATION_TESTS.md`, `docs/technical/TD04_REFERENCE_CHECKS.md` |
| Economy/Items/Tụ Bảo Các NPC Shops (`TD-04`) | `docs/systems/ITEMS_ECONOMY.md`, **`docs/systems/NPC_SHOPS.md`** *(sole accepted NPC-only BUY/SELL shop spec; no P2P market)*, `docs/systems/FOOD_CATALOG.md` |
| Map/zone/động phủ & scene assembly (`TD-04` + `TD-05`) | `WORLD_DESIGN.md`, `ART_BIBLE.md`, `docs/systems/WORLD_CONTENT.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, `docs/pipelines/UX_WORLD_FIRST.md`, `.agents/skills/world-and-map-qa/SKILL.md` |
| Art/animation/VFX/visual bindings (`TD-05`) | `ART_BIBLE.md`, `CHARACTER_VISUAL_BIBLE.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/AI_ASSET_PRODUCTION.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/pipelines/CONTENT_ART_BRIEF_TEMPLATE.md`, `docs/technical/TD05_CROSS_TD_CONSISTENCY.md`, `docs/technical/TD05_MIGRATION_TESTS.md`, `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md`, `.agents/skills/ai-art-production/SKILL.md` |
| Production release/test | `PROJECT_STATUS.md`, `ROADMAP.md`, `docs/technical/TD_FREEZE_GATES.md`, `docs/technical/TD_FREEZE_IMPLEMENTATION_PATH.md`, `AGENTS.md`, repo test scripts |

All 40 imported `docs/systems/*`, `docs/pipelines/*`, and `docs/technical/*` files are **DESIGN APPROVED / NOT IMPLEMENTED** technical specifications. Individual component files preserve their historical `REVIEW_REQUIRED` / `DRAFT` headers verbatim to maintain verified SHA-256 checksums (`docs/technical/TD_FREEZE_OVERVIEW.md`).

## Safe session handoff

Record in `PROJECT_STATUS.md`: current SHA, implemented modules, tests performed, known regressions, and next pending scoped step. In `DECISIONS.md` and `TD_FREEZE_APPROVALS.md`, never silently convert `PROPOSED` or `UNRESOLVED` into `APPROVED`, and never promote `TECHNICALLY_VERIFIED` art to `HUMAN_APPROVED`. Update docs without rewriting historical audit proof.
