# Verified Skill Research and Setup

Verified web locations (October 2026). These are public project references; their presence does not mean automatically installed.

## Recommended small stack

**Base / runtime**
- Official Phaser 4 skills (strongest API authority): https://github.com/phaserjs/phaser/tree/master/skills — selectively use `game-setup-and-config`, `scenes`, `tilemaps`, `loading-assets`, `sprites-and-images`, and relevant animation. These describe PHASER 4 only.
- Phaser 2D architecture: https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/phaser-2d-game/SKILL.md
- Game architecture: https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/web-game-foundations/SKILL.md
- Canonical docs: https://phaser.io/ , https://docs.colyseus.io/learn/tutorial/phaser , https://docs.mapeditor.org/en/latest/reference/json-map-format/

**Assets / animation / maps**
- Pixel fundamentals: https://github.com/ProkStudio/skills/blob/main/skills/game/2d/pixel-art-fundamentals/SKILL.md
- Sprite animations: https://github.com/ProkStudio/skills/blob/main/skills/game/2d/sprite-animation/SKILL.md
- Tilesets: https://github.com/ProkStudio/skills/blob/main/skills/game/2d/tilesets-and-environments/SKILL.md
- Art export: https://github.com/ProkStudio/skills/blob/main/skills/game/2d/game-art-pipeline/SKILL.md
- Sprite pipeline: https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/sprite-pipeline/SKILL.md (its helper scripts are referenced relative to the original repository and may not exist if only SKILL.md is copied; don't assume otherwise).
- Aseprite CLI: https://www.aseprite.com/docs/cli/
- Starter licensed assets: https://kenney.nl/assets/roguelike-rpg-pack (CC0; starter content, not production xianxia character portraits).

**Design / Multiplayer / QA**
- Game designer: https://github.com/edhahn/agent-skills/blob/main/game-designer/SKILL.md
- Multiplayer: https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/game-development/multiplayer/SKILL.md
- Game UI: https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-ui-frontend/SKILL.md
- Playtest: https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-playtest/SKILL.md
- Browser automation: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/tools/skills/playwright-cli/SKILL.md

## Install guidance (safe and transparent)

Antigravity IDE loads project scoped skills from `<workspace-root>/.agents/skills/<skill-folder>/SKILL.md`. Antigravity CLI and IDE have different global paths. Official: https://www.antigravity.google/docs/skills?tab=ide .

**Manual installation is the most predictable approach:** inspect any skill's license and complete `SKILL.md`, then copy the containing folder (including relative resources/scripts only when reviewed) into `.agents/skills/<descriptive-folder>/` within the new project. Do not assume a `SKILL.md` is an executable plug-in or that the referenced external image generator is connected.

Optional ecosystem installer: Google's codelab describes Vercel's `npx skills` CLI, but you should verify destination and skill resolution for your installed Antigravity version before running it: https://codelabs.developers.google.com/getting-started-with-antigravity-skills?hl=en

Start with the four original workspace skills bundled here; add external specialist skills selectively after reading them, not dozens blindly.
