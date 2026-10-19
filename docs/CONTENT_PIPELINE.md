# Scalable Content Production Pipeline — Contract and Gates v0.2

> 2026-10-16 | DESIGN BASELINE, not claim of a fully implemented automatic pipeline.

## Why this exists

The owner wants to request “add one NPC/domain/skill/region/quest” in future sessions and have agents consistently assemble **data → gameplay behavior → artwork/animation → Phaser/Tiled integration → validation**, while keeping creative control. Phase 0 supplied AI sprite production proof and 30 workspace skills, **not** a turnkey, automated RPG content factory.

## Standard gated workflow

1. **Request + context route**: Agent reads `AGENTS.md`, `DECISIONS.md`, `CONTEXT_INDEX.md`, phase status, relevant lore/system/art specs.
2. **Dependency analysis**: Identify required IDs, existing assets, quests, game rules, data migrations, UI links and touched modules; produce a change-impact table.
3. **Typed content specification**: Stable IDs, conditions, rewards, target realm/Level, rarity and player-visible text. If any content choice alters canon/approved rules, pause for owner review.
4. **Mechanics validation**: Schema/cross-reference checks, exclusion constraints, cap/stacking and exploit tests. Do not allow a second Legendary signature.
5. **Core Kit & Asset Manifest Lookup**: Resolve active visual masters and production profiles in `assets/corekit/v01b/catalog.json` and `assets/corekit/v01b/profiles/{animation,ui-tokens,world-art}.json`; list portraits, sprites, animation states, item icons, VFX, tiles, props, and audio necessary; reuse approved assets only where visually and thematically faithful, and never pull from `assets/archive/history/**`.
6. **Genuine Native Image Generation**: Invoke the Argon host's built-in `image-generator` subagent (`TypeName: "image-generator"`) with exact Core Kit reference images attached; preserve unmodified raw AI output under `assets/source_ai/` with SHA-256 checksum, `generationProvider: "argon_native_image_generator"`, `generationMethod: "native_image_generator_subagent"`, and referenced `referenceId@version`. **No automatic code-drawn production fallback (`codeart2d`, `ImageDraw`, or disabled `build_assets.py`), no fake motion from affine warps of a single still, and no external API/CLI media calls.**
7. **Deterministic Post-Processing**: Chroma cleanup, alignment, slicing, nearest-neighbor scaling, atlas/tileset/VFX packaging, and reproducible provenance in `assets/manifest.json` and `assets/provenance.json`. Scripts may assemble, **not originate** finished art.
8. **Implementation**: Add content registry entries (`packages/game-data/src/catalogs/*`), pure rules/validators (`packages/game-data/src/rules/*`), domain server services (`apps/server/src/features/<domain>/*`), persistence ports (`apps/server/src/infrastructure/database/*`), Phaser render/asset bindings (`apps/client/src/game/assets/*`, `apps/client/src/game/combat/AnimationRegistry.ts`, `apps/client/src/game/world/*`), client panels (`apps/client/src/features/<domain>/*`, `apps/client/src/ui/*`), and Tiled metadata in accordance with `docs/technical/SOURCE_ARCHITECTURE.md` (`npm run verify:architecture`). Scope code only to the approved task.
9. **Automated gates**: Select checks by actual content/code/asset impact using AGENT_EXECUTION_CONTRACT Section 3. New player-visible content requires relevant schema/ID, Core Kit/asset (`npm run verify:assets`), architecture (`npm run verify:architecture`), and in-game checks; changed reward/condition logic requires its transaction/invariant tests. Use full applicable TD acceptance at slice release. A later docs-only or test-harness-only correction does not rerun the entire content pipeline. Build already includes asset verification and deterministic runtime asset packaging (`scripts/package-runtime-assets.mjs`); a required unavailable E2E is reported BLOCKED/NOT_RUN rather than silently waived.
10. **In-game review**: screenshots, animation/GIF at actual gameplay zoom, real in-world usability and multiplayer verification.
11. **Human creative approval**: Only owner marks artwork `HUMAN_APPROVED`; code pass/manifest pass ≠ approval. Present gaps honestly.
12. **Release/handoff**: Update referenced specs, content index, changelog/status and evidence, run `npm run verify:doc-sync` (which mechanically verifies the 40 frozen TD files against `39c41a6`, required architecture/archive/locator files, removed active paths, and Project Atlas inline `<script>` syntax via `new vm.Script(...)`, while semantic status consistency across docs is verified via scoped agent self-review), and follow the task card's commit/push policy.

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

Follow **`docs/technical/SOURCE_ARCHITECTURE.md`**: leaf catalogs under `packages/game-data/src/catalogs/*` (`realms.ts`, `destinies.ts`, `npcs.ts`, `world.ts`, `items.ts`, `recipes.ts`, `quests.ts`, `techniques.ts`, `appearances.ts`) and pure rules under `packages/game-data/src/rules/*` (`characterContracts.ts`, `characterProgression.ts`, `statPipeline.ts`, `destinyModifiers.ts`, `legacyProgression.ts`) define NPC, item, technique, Dao path, quest, zone, achievements and AI asset refs without circular dependencies, re-exported through `packages/game-data/src/index.ts`. Conditions (`hasDestiny`, `affinityAtLeast`, `hasItem`, `daoAtLeast`, `questCompleted`, etc.) and effects (`grantReward`, `unlockQuest`, `setFlag`) should be data-driven with a small vetted evaluator. Shared IDs are generated/validated centrally. Server domain logic lives under `apps/server/src/features/<domain>/*` (`character/*`, `destiny/{DestinyRoller,DestinyOwnership}.ts`, `combat/LegacyCombatService.ts`, `economy/LegacyCommerceService.ts`, `quests/LegacyQuestService.ts`) and client feature panels/views live under `apps/client/src/features/<domain>/*` (`character/CharacterCreationView.ts`, `character/CharacterPanel.ts`, `shops/HudShell.ts`), `apps/client/src/ui/*`, and `apps/client/src/game/*`. Do not build microservices or an ECS.

## AI-art skill integration & Core Kit `v01b` workflow

Use existing `.agents/skills/ai-art-production/SKILL.md`, `assets/corekit/v01b/catalog.json`, and `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`; do not recreate or overwrite them. Current Phaser/VFX sprite layout comes from `assets/corekit/v01b/profiles/animation.json` (`apps/client/src/game/assets/runtimeAnimationProjection.json`: `full_80x96_20row` `480×1920`, `full_80x96_20row_8walk` `640×1920`, `locomotion_80x96_8row` `480×768`, `stationary_npc_80x96_4f` `320×96`, plus preserved `legacy_48x64_16row` `288×1024`). Only `hero_kiem_tu` (`DEC-009`, `v01b.char.hero_kiem_tu` @ `2.0.0-hero-animset-01`) has `character_identity_and_runtime_animset` `HUMAN_APPROVED` status in `assets/manifest.json`; the remaining `VISUAL-03-W` runtime assets carry `creativeApprovalState: "TECHNICALLY_VERIFIED"` backed by `HUMAN_APPROVED` `V01-B` Core Kit references (`DEC-006`..`DEC-008`) pending `VISUAL-03-U`/`Q` in-engine sign-off. Legacy procedural entrypoints (`packages/art-tools/build_assets.py` and `npm run generate:art*`) are permanently disabled fail-closed guards (`exit code 2`).


## Testing tiers

- **Unit**: stat modifiers, Level caps, destiny mutual exclusion, mastery trial gates, independent quest state, deterministic attack.
- **Property / simulation**: no level past realm cap without breakthrough, no overlapping offline/online rewards, item conservation, acceptable per-map farm efficiency across Phàm/Hoàng/Tiên/Thần build samples.
- **Integration**: persistence/reconnect, rollback/idempotency, live monster HP visibility, two clients, quest kill credit, auto-navigation stops before interaction.
- **Visual**: real client captures, consistent silhouette and palette, readable attack/skill animation, sprites feet anchors, mobile viewport.

## Delivery format for future Argon tasks

Use one owner-dispatched task and one completion report. Argon owns internal implementation/QA; routine external planner review and ZIP exports are not mandatory. Human canon/creative decisions and unresolved affected dependencies retain their approval gates.

Each task request: goal; approved decision IDs; precise files/docs; scope/out-of-scope; dependencies; acceptance tests; art requirements; required screenshots; approval gate; commit policy. No giant autonomous “finish the entire game” prompt.
