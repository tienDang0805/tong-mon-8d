# Roadmap — Tông Môn 8D, Design-to-Production

> v0.2 | 2026-10-16 | Current foundation: `master@7914c2a` Phase 1A audit commit; subsequent commits update this checkpoint.

## Status as of baseline packaging

| Stage | Status | Evidence / caveat |
|---|---|---|
| Phase 0 AI sprites / initial multiplayer technical prototype | TECHNICALLY_VERIFIED per legacy reports | Phaser/Colyseus, two Tiled zones, 3 advanced sprites, legacy art; not final visual acceptance |
| Phase 1A workspace recovery/context reconciliation | COMMITTED | `7914c2a`; newly added `CONTEXT_AUDIT.md`, `ai-art-production` and governance fixes. Some stale docs remain. |
| **Phase 1B.0 owner-approved game design documentation** | **THIS PACKAGE — TO INTEGRATE/REVIEW** | New docs establish 2026-10-16 AFK RPG and Main Quest design. |
| Phase 1B.1 Character + progression technical specs | NOT STARTED | Formulas/contracts/simulations not approved |
| Phase 1B.2 Combat + Dao + technique specifications | NOT STARTED | Build-dependent auto-farm and 6 mastery paths |
| Phase 1B.3 World/item/quest/affinity narrative contracts | NOT STARTED | Food Catalog prerequisite for Phì Đế trigger |
| Phase 1B.4 Content registries + technical production tools | NOT STARTED | Validate automation through actual content |
| Playable AFK vertical slice | NOT STARTED under new design | Existing action prototype is separate baseline |

## Immediate Phase 1B.0 delivery

1. Safely import this Markdown baseline without deleting Phase 1A historical evidence, existing code, art or raw sources.
2. Patch `AGENTS.md` source-of-truth priority / human decision ledger, and `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md` to point at current Game Design v0.2; fix documentation that still claims the Windows `index.ts` pathname bug is not patched.
3. **Do not change gameplay code or `.env` in this docs-only phase.** Report `PGDATA_DIR` relative-path issue as a separate targeted fix; do not alter private local DB data.
4. Validate file names/links, exact 10 NPC and 17 realm IDs, consistency of approved vs proposed decisions, and no unauthorized art.
5. Run safe docs checks; code build tests are optional during docs-only work but reported honestly if not executed.
6. Stop for human design review. Owner will commit/push after acceptance.

## Subsequent gated technical design

### TD-01 Character, Destiny, Level, Realm

Define authoritative `Character`, `Attributes`, `LevelProgress`, `RealmProgress`, `DestinyCollection`, `Affinities`. Decide migration from current data and define deterministic formula order, cap/overflow, starting quest bypass prevention and security test cases.

### TD-02 Techniques, Dao Mastery & Combat

Define six mastery paths × 10 stages, proof-of-mastery Bí Cảnh 3→4/6→7/9→10, two technique categories and their quality/requirements, skill loadouts, damage/defense, monster realm suppression, map-based Tiên-quality balance and simulations.

### TD-03 Online Auto Farm, Navigation & Quest

Define Colyseus server-connected presence semantics, auto target/path/cooldown states, legitimate loot/kill credit, manual quest hand-in, `Q` journal, auto-travel stopping at objective, bế quan as distinct capped offline cultivation.

### TD-04 World, Item, Affinity and Content Contract

Typed registries for zones/maps, buildings/động phủ, loot, food/pills, gifts, reputation, story flags, achievements/Hậu Thiên and six-chapter optional Phì Đế path; ensure public vs exclusive activities.

### TD-05 AI Asset Integration and Art Sign-Off

Improve the first *one* zone's tileset/props and key characters through genuine generative image sources, reproducible packaging, in-game screenshots and human art approval. Retain preexisting placeholders until replaced.

## First playable production vertical slice (only after specs)

Create character/roll → start Mortal Lv 1 → user manually follows Main Quest and uses auto-navigation → online AFK farm valid monsters and gain EXP/Dao progress/loot → Lv 10 → masked immortal gives technique + breakthrough pill → player manually breaks to Luyện Khí → public Phì Đế food/affinity event → one optional signature-specific clue, not automatic discipleship. Multiplayer clients sync HP and monsters, persistence survives reconnect, offline farm gives no rewards, offline meditation retains designed cap.

## Expansion after a high-quality slice

More authored regions and domains, combat/point-click Bí Cảnh, all ten Legendary six-chapter side routes, advanced technique/item catalogs, group boss and the dimensional-war Main Quest. Production map/character art scales from accepted pipeline, not procedural placeholder generation.

## Release gates

- DESIGN gate: owner approves system spec; `DECISIONS.md` updated, no proposed names silently promoted.
- TECHNICAL gate: deterministic test pass + actual launched multiplayer playtest.
- CREATIVE gate: game-zoom screenshot, animation and asset provenance accepted by owner.
- CONTENT gate: narrative makes sense; no Legendary inheritance gating Main Quest.

**Phase boundary**: This baseline package is documentation only. It must never be described as a completed gameplay implementation.
