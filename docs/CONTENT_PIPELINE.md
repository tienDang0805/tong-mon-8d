# Scalable Content Production Pipeline — Contract and Gates v0.2

> 2026-10-16 | DESIGN BASELINE, not claim of a fully implemented automatic pipeline.

## Why this exists

The owner wants to request “add one NPC/domain/skill/region/quest” in future sessions and have agents consistently assemble **data → gameplay behavior → artwork/animation → Phaser/Tiled integration → validation**, while keeping creative control. Phase 0 supplied AI sprite production proof and 30 workspace skills, **not** a turnkey, automated RPG content factory.

## Standard gated workflow

1. **Request + context route**: Agent reads `AGENTS.md`, `DECISIONS.md`, `CONTEXT_INDEX.md`, phase status, relevant lore/system/art specs.
2. **Dependency analysis**: Identify required IDs, existing assets, quests, game rules, data migrations, UI links and touched modules; produce a change-impact table.
3. **Typed content specification**: Stable IDs, conditions, rewards, target realm/Level, rarity and player-visible text. If any content choice alters canon/approved rules, pause for owner review.
4. **Mechanics validation**: Schema/cross-reference checks, exclusion constraints, cap/stacking and exploit tests. Do not allow a second Legendary signature.
5. **Asset manifest**: List portraits, sprites, animation states, item icons, VFX, tiles, props and audio necessary; reuse approved assets only where visually/thematically correct.
6. **Genuine image generation**: Native Antigravity image generator or specifically authorized provider; keep raw AI source and its checksum. **No automatic code-drawn production fallback** and no unapproved paid calls.
7. **Deterministic post-processing**: Chroma cleanup, alignment, slicing, atlas/tileset/VFX packaging and reproducible provenance. Scripts may assemble, **not originate** finished art.
8. **Implementation**: Add content registry entries, game rules, triggers, server validation, persistence, Phaser render, animation integration and Tiled metadata. Scope code only to the approved task.
9. **Automated gates**: schema/typecheck, existing `npm run verify:assets`, `npm test`, `npm run typecheck`, `npm run build`, real browser `npm run test:e2e` when usable, plus relevant specialized simulation.
10. **In-game review**: screenshots, animation/GIF at actual gameplay zoom, real in-world usability and multiplayer verification.
11. **Human creative approval**: Only owner marks artwork `HUMAN_APPROVED`; code pass/manifest pass ≠ approval. Present gaps honestly.
12. **Release/handoff**: Update referenced specs, content index, changelog/status and evidence, then await owner commit/push policy.

## How different content types flow

| Type | Data prerequisites | Behavior needed | Art work | Required focused check |
|---|---|---|---|---|
| New NPC | `npcId`, lore, realm, affinity, dialogue, location | Quest/interaction predicates | Portrait, multi-direction sprite/poses | Canon, unlock gates, non-duplicate rewards |
| New Võ kỹ | quality, Dao path, stat/mastery requirements, cost/cooldown | Server skill math + AFK priority | Icon, animation/VFX | Combat simulation & auto-farm valid use |
| New Công pháp | quality, stat/realm requirements, Tu Vi or passive modifiers | Main cultivation loadout logic | Tome/icon, relevant aura | Stacking limits, progression impact |
| New item | item type, amount, flags/trade policy, effect | Server transaction/reward | Inventory icon | Duplication, consumption, stack validity |
| New zone/map | zone graph, risk band, spawn+portal config | Server room/spatial navigation | Generative tileset, biome, props | Collision, route, map transitions, fair mob difficulty |
| New quest | quest ID, type, predicates, objectives/rewards | Server condition engine, **manual** interaction | Markers/optional cutscene art | No unintended auto-quest, choice persistence |
| Legendary domain | matching signature and affinity/trigger gates | World + exclusive quest state | Domain architecture, NPC and VFX | Public access vs exclusive gate separation |

## Reusable mechanics — preferable to scripts per NPC

A type-safe catalog defines NPC, item, technique, Dao path, quest, zone, achievements and AI asset refs. Conditions (`hasDestiny`, `affinityAtLeast`, `hasItem`, `daoAtLeast`, `questCompleted`, etc.) and effects (`grantReward`, `unlockQuest`, `setFlag`) should be data-driven with a small vetted evaluator. Shared IDs are generated/validated centrally. Migrations preserve old save data with versioned schemas. Do not build ten services or a complex ECS before the first slice proves need.

## AI-art skill integration

Use existing `.agents/skills/ai-art-production/SKILL.md`; do not recreate or overwrite it. Current Phaser/VFX sprite layout comes from `RULES.md` and actual manifest (`80×96` in `480×1920` for upgraded characters, with preserved legacy transition). Existing art remains *technical proof / placeholder* until human approved. The pipeline must not claim an external video route exists unless capability is verified for that actual session.

## Testing tiers

- **Unit**: stat modifiers, Level caps, destiny mutual exclusion, mastery trial gates, independent quest state, deterministic attack.
- **Property / simulation**: no level past realm cap without breakthrough, no overlapping offline/online rewards, item conservation, acceptable per-map farm efficiency across Phàm/Hoàng/Tiên/Thần build samples.
- **Integration**: persistence/reconnect, rollback/idempotency, live monster HP visibility, two clients, quest kill credit, auto-navigation stops before interaction.
- **Visual**: real client captures, consistent silhouette and palette, readable attack/skill animation, sprites feet anchors, mobile viewport.

## Delivery format for future Argon tasks

Each task request: goal; approved decision IDs; precise files/docs; scope/out-of-scope; dependencies; acceptance tests; art requirements; required screenshots; approval gate; commit policy. No giant autonomous “finish the entire game” prompt.
