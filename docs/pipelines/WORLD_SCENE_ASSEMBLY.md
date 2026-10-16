# TD-05 · Scene Assembly — A Real Traversable Xianxia World

> v0.7 · DESIGN_BASELINE. Scene visuals are an extension of TD-04 authored world content and TD-03 spatial/quest authority, not a new collision/navigation engine.

## 1. World-first design target

The visual scene is rendered in **Phaser 4** from authored Tiled map content; the server remains authoritative for simulation and collision. Walking through **Tân Thủ Thôn** should communicate trade, daily life, quests and cultivation even when no menu is open. **Thanh Trúc Lâm** should communicate wilderness, monsters, herbs, risk and navigation through an animated landscape rather than static green squares. These are the first two real zone IDs; new maps, coordinates and NPC locations beyond them remain DRAFT until authored and validated.

A screenshot of the village must convey where to find NPC trade without reading a quest paragraph: a **Tụ Bảo Các** facade and merchants with themed counters, a steaming noodle stall for Lão Trù Trương, a quest board, readable roads, bamboo groves, portals, and ambient life. World landmarks serve as quest/auto-navigation anchors.

## 2. Spatial rendering/layer contracts

- Source map: Tiled JSON `.tmj`; tile size **32×32**. Existing `tan_thu_thon.tmj` is **40×30**, `thanh_truc_lam.tmj` is **44×32**. No speculative coordinates inserted into existing maps during docs phase.
- Logical separation: `Ground`, `Paths`, `GroundDetails`, `Collision`, `Interactables`, `AbovePlayer`, `Portals` plus optional `NPCSpawns`, `MonsterSpawns`, `Decoration`, `Resources` as authoring requires. Preserve actual loader's layer contract; do not add names without checking code.
- Y-sort foot origin and static roof/occlusion: character may stand behind tree/roof while feet remain collision-authoritative. Portal radius, solid walls, door gaps and nav edges must match TD-03; render mask is not collision authority.
- Walkway affordances: village entrance → Tụ Bảo Các → NPC counters/quest board → portal → Thanh Trúc Lâm monsters. The player must be able to **walk this route in engine**; decorative market props cannot obstruct the only accessible corridor.
- Responsive camera: reference **1280×720** and **390×844**. At gameplay zoom, character scale, clickable interactions, text markers and enemy telegraphs must remain distinguishable; never approve from 100% screenshot of an isolated concept board.

## 3. Landmark breakdown: Tụ Bảo Các as a physically meaningful location

**Release profile `town_trade_hub`** (additional VisualBinding profile for scene assembly):

| Spatial element | Generated visual assets / bindings | What the player actually does |
|---|---|---|
| Street frontage | Roof/wall/steps/entrance tiles, signboard/lantern art, props, ambient trader traffic | Spot it while walking; click exterior sign or open door |
| Lobby / common counters | Counter, rugs, shelves, item displays, room floor/walls where an interior exists | Enter physically or interact at reachable stall; Tiled location determines access |
| Đan Dược Các | Colored medicine vessels, medicine rack, illustrated pill category sign, seller actor | Manually open medicine offers, BUY/SELL only |
| Tàng Kinh Các | Manual scroll/book rack, ink brushes, category banner, merchant actor | Manually browse regular Công Pháp/Võ Kỹ allowed by TD-02/04 |
| Binh Khí Các | Weapon rack, forge display, shields/robes art, smith actor | Manually browse gear, see item icons and equip preview |
| Linh Trù/Tạp Hóa | Steaming pot, food shelves, sign, unique vendor/cook props | Buy food/ingredients, optionally continue to Lão Trù's stall |
| Shared trade UI | Illustrated item icons, readable buy/sell feedback, category filters, price, stock, manual confirmation | UI is a **detail layer triggered by the physical shop**, not the only depiction of the shop |

Specialist vendors use **the same ShopService** from TD-04; visual variation belongs to vendor/scene assets. A player can only interact within legitimate zone/range, and auto-navigation never buys/sells or opens the transaction for them. `RMT Đế` remains a lore figure, not a real-money cashier, and `Thái Tài` remains an appraisal figure rather than a generic free vendor.

**MVP realism constraint:** A convincing building+counter scene is required; constructing four fully explorable separate interiors can be deferred if the owner approves an in-world clustered market. Do not silently claim a fake door leads to completed interior. Propose either a single lobby with counters or exterior specialist stalls and submit the chosen layout for user review.

## 4. Content-driven world rendering

- `NpcContentDef` → actor sprite/portrait + spawn registration + interaction marker + event animation.
- `ShopDef`/`VendorDef` → facade/counter sign + world coordinate + priced catalog + BUY/SELL UI binding.
- `QuestDef` → an eligible world NPC/board/prop/region marker, progress icon, reachable stopping point, completion effect. Opening `Q` remains supplementary.
- `ItemDef` with `worldDropEnabled` → actual drop sprite/ground highlight with ownership policy from TD-04; no invisible pile of loot.
- `SkillDef` → cast/telegraph/projectile/hit/death VFX and server event-binding from TD-02; damage never depends on client animation timings.
- `InstanceContentDef` → coherent illustrated room/encounter and navigable interaction points, not a text-only multiple-choice menu.
- `FoodCatalogEntryDef` → food illustration/plate or recognizable in-scene food prop; purchased and cooked variants share canonical identity where approved; counted once in TD-04.
- `ZoneContentDef` → approved tileset materials + repeated variations + landmarks, zone signage, two-way portals, ambience, not a uniform programmatic ground texture.

## 5. Scene art composition rubric (human judgment)

1. Foreground, midground and background depth are clear; 2D top-down perspective does not conflict within the same street.
2. Navigable paths are readable, free of ambiguous blocked pixels, and memorable through landmarks.
3. Warm village lanterns vs cool bamboo grove atmosphere are visually distinct but share outline, palette and scale logic.
4. Character/NPC/item silhouettes stand apart from ground; bloom/particles do not cover hitbox or dialogue marker.
5. Shops look **like buildings and businesses**, not buttons floating in a featureless canvas.
6. Ground details exhibit authored variation; no procedurally sketched filler tiles passed as final.
7. Main quest and optional Legendary clues are communicated spatially; secret late-game storyline artwork is not accidentally shown publicly.

## 6. Scene verification

- `SCN-01` walk spawn → food stall → Tụ Bảo Các physically without teleport/admin controls.
- `SCN-02` browse/purchase/sell only when manually interacting within server-valid range.
- `SCN-03` pathfinding to quest board stops, does not open/accept a quest.
- `SCN-04` portal roundtrip town ↔ forest preserves correct spawn, occlusion and view.
- `SCN-05` shared monster attack has synchronized HP + legible telegraph/hit and exactly-once loot representation.
- `SCN-06` at actual zoom, no missing generated source/texture and no blocked market doorway.
- `SCN-07` desktop/mobile screenshot compares usable playfield area; expanded shop UI can overlay gameplay **only during intentional trading**, and closes cleanly.
- `SCN-08` new room/region content cannot ship without authored Tiled/world geometry and a human-reviewed scene capture.
