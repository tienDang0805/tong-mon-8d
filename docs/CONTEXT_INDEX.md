# Context Index — Where an agent should read first

> Version: Game Design Baseline v0.2 | Date: 2026-10-16 | Status: DESIGN BASELINE

## Reading order for every session

1. `AGENTS.md` and `RULES.md` (security, canon, art provenance, quality gates).
2. **`docs/DECISIONS.md`** (new approved gameplay direction supersedes legacy conflicting gameplay).
3. `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTIONS.md`, `docs/ROADMAP.md` (what exists, next safe phase, what is design-only).
4. `docs/GAME_VISION.md` / `docs/GAME_DESIGN.md` when changing a game system.
5. Domain specification, code and relevant `.agents/skills/*/SKILL.md` only for the active task.

**Conflict policy**: Safety/canon boundaries remain highest. Owner-approved gameplay decisions in `docs/DECISIONS.md` override historical gameplay/bootstrap instructions where explicitly inconsistent. `packages/game-data/src/index.ts` is current implementation data, not automatic approval of outdated mechanics. Never erase canonical IDs or make undocumented lore changes.

## Document responsibilities

| Document | Owns | Does not own |
|---|---|---|
| `docs/DECISIONS.md` | Approved/non-approved decision register | Detailed algorithms or current code correctness |
| `docs/GAME_VISION.md` | Identity, audience, short/long loops, anti-goals | Formula parameters |
| `docs/GAME_LORE.md` | Canon cosmology, NPC identity, confirmed and proposed plot | Source code schemas |
| `docs/GAME_DESIGN.md` | All core system interactions, proposed rules, reward loops | Detailed formula and data contracts (future `docs/systems/`) |
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

## Task-based routing

| Task type | Additional required reading |
|---|---|
| Character/EXP/Cảnh Giới | `GAME_DESIGN.md`, `DECISIONS.md`, future `systems/CHARACTER.md`, `systems/CULTIVATION.md`, `packages/game-data/src/index.ts` |
| Destiny/Chân Truyền | `DECISIONS.md`, `NARRATIVE_DESIGN.md`, future `systems/DESTINY.md`, `systems/QUEST_AFFINITY.md` |
| Combat/Auto Farm | `GAME_DESIGN.md`, `UX_DESIGN.md`, future `systems/COMBAT.md`, `systems/AUTO_FARM.md`, `apps/server/src/worldEngine.ts` |
| Công pháp/Võ kỹ/Đạo Cảnh | `GAME_DESIGN.md`, future `systems/TECHNIQUES.md`, `systems/DAO_MASTERY.md` |
| Quest/story | `NARRATIVE_DESIGN.md`, `GAME_LORE.md`, future story/quest content specs, `packages/game-data/src/index.ts` |
| Map/zone/động phủ | `WORLD_DESIGN.md`, `ART_BIBLE.md`, `.agents/skills/world-and-map-qa/SKILL.md` |
| Art/animation/UI icons | `ART_BIBLE.md`, `CHARACTER_VISUAL_BIBLE.md`, `.agents/skills/ai-art-production/SKILL.md`, `CONTENT_PIPELINE.md` |
| Production release/test | `PROJECT_STATUS.md`, `ROADMAP.md`, `AGENTS.md`, repo test scripts |

Future `docs/systems/*` paths are **planned**, NOT existing deliverables in this baseline; do not reference them as present until authored.

## Safe session handoff

Record in `PROJECT_STATUS.md`: current SHA, implemented modules, tests performed, known regressions, and next pending scoped step. In `DECISIONS.md`, never silently convert `PROPOSED` into `APPROVED`. Update docs without rewriting historical audit proof.
