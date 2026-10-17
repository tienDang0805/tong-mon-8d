# Tông Môn 8D — Active Workspace Startup & Session Entrypoint

This file is the single concise startup route for `tienDang0805/tong-mon-8d` (a browser 2D top-down pixel-art xianxia RPG for 8–20 friends, built with Phaser 4 / Tiled + Colyseus + PostgreSQL/PGlite). Do not create a new repository or execute historical Phase 0/1 bootstrap instructions.

## 1. Session Resume Sequence

1. **Verify Git & Working Tree**: Check local `HEAD`, `origin/master`, and `git status --short` in the real repository. Never overwrite local work or player databases (`apps/server/data/pgdata`) with a stale snapshot.
2. **Load Core Governance & Current Priority**:
   - [`AGENTS.md`](AGENTS.md) and [`RULES.md`](RULES.md) — Source-of-Truth Hierarchy, Canonical Constraints, and AI Art Production Policy.
   - [`docs/NEXT_ACTIONS.md`](docs/NEXT_ACTIONS.md) — Active owner priority sequence (`DOC-CLEAN-01 -> VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F`).
   - [`docs/technical/AGENT_EXECUTION_CONTRACT.md`](docs/technical/AGENT_EXECUTION_CONTRACT.md) — Planner/executor workflow (`PLAN_ONLY` vs `EXECUTE`), scope-based allowlists, and impact-based verification matrix.
3. **Route Task Context Selectively**:
   - [`docs/CONTEXT_INDEX.md`](docs/CONTEXT_INDEX.md) and [`docs/technical/AGENT_SKILL_ROUTER.md`](docs/technical/AGENT_SKILL_ROUTER.md) — Load only the domain specs and skills (`max 3`) needed for the active task.
   - [`docs/implementation/FEATURE_LEDGER.md`](docs/implementation/FEATURE_LEDGER.md) and [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — Verified commit SHAs, test evidence, and current implementation snapshot.
   - [`docs/MASTER_PROJECT_PLAN.md`](docs/MASTER_PROJECT_PLAN.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md) — Slice `S1`–`S8` milestone navigation.
   - [`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md) — Consult only when runtime setup, database safety, or isolated E2E execution is required. Do not automatically run full test suites or `npm run dev` on session resume.

## 2. Active Source & Architecture Locations

Route source structure and module boundaries through [`docs/technical/SOURCE_ARCHITECTURE.md`](docs/technical/SOURCE_ARCHITECTURE.md):

- **Shared Protocol & Contracts**: [`packages/shared/src/index.ts`](packages/shared/src/index.ts)
- **Canonical Game Data & Pure Rules**: [`packages/game-data/src/catalogs/realms.ts`](packages/game-data/src/catalogs/realms.ts), [`packages/game-data/src/catalogs/destinies.ts`](packages/game-data/src/catalogs/destinies.ts), [`packages/game-data/src/rules/characterContracts.ts`](packages/game-data/src/rules/characterContracts.ts), [`packages/game-data/src/td01Numeric.ts`](packages/game-data/src/td01Numeric.ts), and [`packages/game-data/src/index.ts`](packages/game-data/src/index.ts)
- **Authoritative Server (`Colyseus` + `PGlite`/`pg`)**: [`apps/server/src/index.ts`](apps/server/src/index.ts), [`apps/server/src/zoneRoom.ts`](apps/server/src/zoneRoom.ts), [`apps/server/src/worldEngine.ts`](apps/server/src/worldEngine.ts), [`apps/server/src/db.ts`](apps/server/src/db.ts), [`apps/server/src/characterV02Repository.ts`](apps/server/src/characterV02Repository.ts), [`apps/server/src/characterV02Actions.ts`](apps/server/src/characterV02Actions.ts), [`apps/server/src/guestIdentity.ts`](apps/server/src/guestIdentity.ts), and [`apps/server/src/features/`](apps/server/src/features/)
- **Browser Client (`Phaser 4` + DOM HUD)**: [`apps/client/src/main.ts`](apps/client/src/main.ts), [`apps/client/src/WorldScene.ts`](apps/client/src/WorldScene.ts), [`apps/client/src/characterCreation.ts`](apps/client/src/characterCreation.ts), [`apps/client/src/hud.ts`](apps/client/src/hud.ts), [`apps/client/src/features/character/CharacterPanel.ts`](apps/client/src/features/character/CharacterPanel.ts), [`apps/client/src/network.ts`](apps/client/src/network.ts), [`apps/client/src/audio.ts`](apps/client/src/audio.ts), and [`apps/client/src/style.css`](apps/client/src/style.css)
- **Runtime Maps & Asset Manifest**: `maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`, `assets/manifest.json`, `assets/provenance.json`, and validator [`packages/art-tools/verify_manifest.ts`](packages/art-tools/verify_manifest.ts) (never execute legacy whole-command `packages/art-tools/build_assets.py` or `npm run generate:art*`).

## 3. Historical Archives (Non-Executable Provenance Only)

Unmodified historical bootstrap prompts, Phase 1A audits, initial v0.1 milestone tables, and early skill notes are archived in [`docs/archive/legacy/`](docs/archive/legacy/) (`MASTER_PROMPT.md`, `CONTEXT_AUDIT.md`, `IMPLEMENTATION_STATUS.md`, `EXTERNAL_SKILLS.md`), with short locator stubs at [`MASTER_PROMPT.md`](MASTER_PROMPT.md), [`docs/CONTEXT_AUDIT.md`](docs/CONTEXT_AUDIT.md), and [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).
