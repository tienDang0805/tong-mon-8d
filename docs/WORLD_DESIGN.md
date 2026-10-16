# World & Map Design — Baseline v0.2

> Date: 2026-10-16 | Status: APPROVED geography principles; future coordinates/locations remain PROPOSED.

## World organization

**Bát Hoang Tu Tiên Giới** contains many distinct, interconnected maps. Build one *vertical slice* deeply before spreading superficial terrain everywhere. Every zone has stable `zoneId`, biome, target realm band, map geometry, spawn, landmarks, collision/portals, resource nodes, NPCs, quest hooks, ambient art/audio, loot table and authorized entry conditions.

Zones are **not** dynamically matched to every player's combat power: monster strength belongs to the zone. Higher-realm monsters generally beat lower-realm characters. A build of comparable realm with cohesive Tiên-quality gear/destiny/technique should manage standard enemies with some challenge.

## Initial existing zones

| Zone | Stable ID | Known implementation from Phase 1A | Desired role |
|---|---|---|---|
| Tân Thủ Thôn | `tan_thu_thon` | Existing Tiled `.tmj`, ~40×30 tiles, 32px grid | Mortal tutorial, ordinary food vendor, first local/main quests, public Legendary hints, safe interactions |
| Thanh Trúc Lâm | `thanh_truc_lam` | Existing Tiled `.tmj`, ~44×32 tiles, 32px grid | Beginner monsters (`truc_lang`, `thanh_lan_xa`), gatherables, anomaly, early legitimate online Auto Farm |

The existing maps are technical prototypes; their ground tiles and many props/sprites are placeholders awaiting generated art and human creative approval. The existing zone transitions should be preserved during the design phase.

## Planned zone graph, not locked geography

`Tân Thủ Thôn` ⇄ `Thanh Trúc Lâm` (already implemented) and later link to `Tông Môn 8D` center, other Bát Hoang regions, town bazaars, Legendary domains, and instance gates. Other names/portal order are **PROPOSED**, not final world geography.

Map kinds:

- `overworld_zone`: village/forest/plain/city with multiplayer shared population.
- `interior`: inn, home, merchant, cultivation chamber.
- `legendary_domain`: one personal residence/động phủ/đạo trường for each Legendary (10 future thematic destinations, not all built now).
- `combat_instance`: wave/arena/boss/Dao trials with AFK combat capability under server rules.
- `point_click_instance`: manual room/choice/object interactions, puzzles and exploration; character decisions never auto-executed.
- `story_instance`: optional private or party narrative encounters/cutscenes.

**Phì Đế domain** is first future Legendary space to design with culinary motifs, divine cooking equipment and exploration. All players may visit permitted public sections; signature-specific trials are gated by **Vạn Vị Đạo Thai**, NPC affinity and special triggers. Discovering a cave/entry is not the same as being eligible to enter the inheritance chamber.

## Tiled/Phaser contract

- Standard 32×32 tile grid, JSON `.tmj`, recognizable art rather than colored block filler.
- Preserve Ground, Paths, GroundDetails, Collision, Interactables, AbovePlayer, Portals (and add NPC/monster/resource/object spawn metadata as needed). Actual map formats must be checked against existing Tiled files before changing serialization.
- Solid collision and interaction triggers are server-validated; client graphics are not trusted for movement or teleport authority.
- Bottom-center character feet/occlusion, Y-sort, environmental multi-layer depth. Sprite size/spec comes from current `RULES.md` / `ART_BIBLE.md` and human asset approvals.
- Zone portal transitions have valid destination point, source/destination authorization, reverse navigation or intentionally explained one-way transport, spawn safety, collision reachability.
- Use zone data registration, **not** a separate large hand-coded scene for every map. Phaser presentation and Colyseus world simulation should remain decoupled.

## Auto Navigation vs quests

`navigateToQuestObjective(questId, objectiveId)` is a **travel assistance intent**: find route using authorized map graph, move to goal, stop near interaction range. If route unknown/locked, show reason. Do not automatically talk, submit item, choose option, open instance, or accept reward. Manual story decisions are a feature, not a bug.

## World growth / acceptance

Before adding each production map, specify target realm band, tactical auto-farm hotspots and risk, waypoint/portal connections, landmark silhouette, NPC/spawn requirements, environment visual pack and sound. Run collisions, reachability, player entry/exit, two-client coexistence, screenshot checks and gameplay readability tests. No new finalized terrain via code-drawn `PIL.ImageDraw` assets; use genuine AI source art and provenance per `ai-art-production` skill.
