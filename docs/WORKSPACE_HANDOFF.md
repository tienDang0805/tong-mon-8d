# Tông Môn 8D — Workspace Handoff Entry

This file routes a new session; it does not duplicate changing feature status or execute the historical Phase 0 / Phase 1 bootstrap. The project is a browser 2D pixel-art xianxia RPG for approximately 8–20 friends, with authoritative Colyseus/PostgreSQL persistence and a Phaser/Tiled world.

## Resume

1. Locate the real repository; verify HEAD, remote and working-tree changes. Do not replace local work with a stale ZIP/snapshot.
2. Read AGENTS.md, RULES.md, docs/NEXT_ACTIONS.md and docs/technical/AGENT_EXECUTION_CONTRACT.md. Use docs/CONTEXT_INDEX.md for task-specific design/skill routing.
3. Use docs/implementation/FEATURE_LEDGER.md for task evidence and Git to resolve committed status/SELF_COMMIT. docs/PROJECT_STATUS.md is the current implementation snapshot; MASTER_PROJECT_PLAN/ROADMAP explain milestone scope.
4. Carry forward the owner's exact authorized scope. Do not reopen accepted/committed work merely because a new chat began. Select checks by impact; do not automatically build or start a dev server.
5. ChatGPT and the owner plan; Argon executes and self-verifies. Use one concise completion report and the dispatched commit policy. Export a ZIP only on request or when evidence transfer requires it. Preserve owner creative/data decisions.

## Active source locations

Server: apps/server/src/index.ts, zoneRoom.ts, worldEngine.ts and db.ts. Client: apps/client/src/main.ts, WorldScene.ts, hud.ts, style.css, network.ts and audio.ts. Shared contracts/data: packages/shared/src/index.ts and packages/game-data/src/index.ts. Runtime maps: maps/*.tmj. Actual relative paths are resolved from the repository root; individual basenames here describe their listed directories.

Use docs/DEVELOPMENT_SETUP.md for an authorized runtime operation and the explicit isolated test setup. Do not copy secrets or player databases into review packets. The legacy whole-command build_assets.py and both generate:art aliases remain prohibited by AGENTS, regardless of older setup descriptions.

Historical prototype/art evidence remains in docs/IMPLEMENTATION_STATUS.md and docs/CONTEXT_AUDIT.md. Their old completion labels, three-class mechanics and Candidate A claims are not the latest v0.2 implementation or human creative approval. Preserve AGENTS/DECISIONS/TD ownership and the distinction between approved, baseline, proposed and unresolved design.
