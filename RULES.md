# Workspace Rules — Tông Môn 8D: Tu Tiên Chi Lộ

1. **Zero Comments in Code**: Never write comments (`//`, `/* */`, `#`, `<!-- -->`) in any source code file or code block. Self-documenting identifiers and strict TypeScript typing are mandatory.
2. **Canonical Fidelity**: All 17 cultivation realms and 10 legendary NPCs must strictly match `MASTER_PROMPT.md` and `packages/game-data/`. Never invent a definitive realm for `dam_lon_tien_tu` (`UNKNOWN`).
3. **Server Authority**: Browser clients submit intents only (`move`, `interactPortal`, `attack`, `skill`, `buyItem`, `cookRecipe`, `submitQuest`, `claimMeditation`, `breakthrough`, `partyAction`). The Colyseus server validates range, cooldowns, collisions, inventory, currency, and idempotency keys inside transactional persistence.
4. **Playfield First**: Phaser 4 WebGL/Canvas owns the playfield. DOM HUD must be compact, thematic, and never obscure the center playfield during normal movement.
5. **Cohesive Pixel Art & Tiled Maps**: Use nearest-neighbor (`pixelArt: true`) rendering, 32x32 world tiles, 48x64 character frames with shared bottom-center anchor `(0.5, 0.9)`, and genuine Tiled JSON (`.tmj`) layered maps with working two-way portals (`tan_thu_thon` ↔ `thanh_truc_lam`).
