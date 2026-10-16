# TD-05 · World-First Vertical Slice — Scene-by-Scene Acceptance

> v0.7 · OWNER_REVIEW_REQUIRED · Documentation only. Defines concrete evidence required to demonstrate a *game*, not an app with RPG popups. Does not assert that any scene, asset, shop, AFK behavior, or new quest is currently implemented.

## 1. Objective and scope

Prove that the first **Phàm Nhân Lv 1–10 → Luyện Khí entry** sequence is visibly playable inside two connected Phaser/Tiled zones, with at least one deliberate physical town merchant hub and one manually accepted quest. The existing project is a prototype, not a production art baseline. This spec describes acceptance criteria for **future implementation**.

Primary reference: owner-approved `docs/DECISIONS.md`, Game Design v0.2, TD-01→04, current `docs/ART_BIBLE.md` and `.agents/skills/ai-art-production/SKILL.md`. Never overwrite source work by running the forced art build without owner approval.

## 2. Required world-first walk-through

| Step | Player action in actual browser | Mandatory world representation | Source of behavior | Evidence ID |
|---|---|---|---|---|
| A | Create new character, roll 3 Tiên Thiên, confirm once | Designed illustrated destiny icons + a visible authored player sprite spawning in Tân Thủ Thôn | TD-01: immutable 3, reroll-all, max one Legendary signature | `SLICE-01` |
| B | Walk through Tân Thủ Thôn | Complete layered village scenery: distinct buildings, paths, signage, NPCs, props, depth and short animations | TD-04 zones; TD-05 generated art | `SLICE-02` |
| C | Walk to Lão Trù Trương, use shop | Identifiable noodle stall/cook/steam; item icons in an **intentional** shop panel; returned to the world after closing | TD-04 food shop & shop engine; no automatic trade | `SLICE-03` |
| D | Enter or approach Tụ Bảo Các and specialist counters | Distinct building facade, doorway or reachable counters, category displays, vendor actors, illustrated item/scroll/gear; BUY/SELL and search/filter available only after manual interact | TD-04 `NPC_SHOPS.md`; shared server transaction service | `SLICE-04` |
| E | Open quest via `Q`, select objective, activate auto-navigation | Highlight on spatially existing NPC/quest board; character follows collision-valid route and stops near it; **no dialogue, accept or hand-in auto-exec** | TD-03 NAVIGATION/QUEST_ENGINE | `SLICE-05` |
| F | Move through portal into Thanh Trúc Lâm | Unique bamboo/stream scene, portal transition VFX, valid spawn, camera and occlusion | TD-03 route & TD-04 world graph | `SLICE-06` |
| G | Start online Auto Farm in legitimate monster area | Visible animated player approach/attack, real monster telegraphs/hurt/death, readable hit effects; one effective loot-delivery presentation; compact HUD | TD-02 combat, TD-03 online automation, TD-04 loot, TD-05 visuals | `SLICE-07` |
| H | Kill an eligible monster for an already accepted quest | Objective counter advances without automated quest turn-in; world marker/readiness feedback updates | TD-03 validated events | `SLICE-08` |
| I | Disconnect one browser and reconnect | Auto activity is stopped, no catch-up damage/loot/EXP; the second connected client sees correct world HP and actors | TD-03 online presence; server authority | `SLICE-09` |
| J | Return to quest giver, interact and submit yourself | NPC gesture/quest emblem, explicit manual confirmation, illustrated rewards, no redundant loot issue | TD-03 manual quests; TD-04 rewards | `SLICE-10` |
| K | Reach Mortal Lv10 and complete masked-immortal breakthrough | Separate level/EXP and Tu Vi; authored in-world masked immortal scene, starter Công Pháp manual illustration, pill icon, explicit breakthrough action and aura/ceremony | TD-01 Lv cap/realm/EXP; Game Design GD-023 | `SLICE-11` |
| L | Publicly interact with Phì Đế regardless of destiny roll | Legendary's recognizably distinct silhouette, scene framing and readable dialogue, normal food event accessible; no auto Chân Truyền | GD-006/015/016/041/045; TD-04 public/secret split | `SLICE-12` |

**No fake completion:** A slideshow of concept art, a menu-only prototype, single-player mock scene or screenshot of a standalone shop UI **does not** satisfy the above.

## 3. Exact evidence package for a candidate milestone

Create future artifacts in `artifacts/playtest/td05/<run-id>/` (not expected to exist today), with a human-readable `evidence.md` describing environment, local commit SHA, actual command results, build ID, camera zoom, character snapshot and which assets remain placeholders. Proposed evidence names:

- `01_village_world_1280x720.png`: idle world with shop facade, NPCs, terrain and all overlay panels closed.
- `02_merchant_approach.png`: walking up to Lão Trù Trương and his steaming noodle shop.
- `03_tu_bao_cac_world.png`: trade hub exterior, entrance and physical specialist sellers/counters.
- `04_shop_buy_sell.png`: manual NPC trade with illustrated inventory and readable search/filter.
- `05_quest_navigate_stop.png`: end of auto-navigation next to spatial quest objective; no auto dialog.
- `06_forest_world_1280x720.png`: actual forest biome and registered monster spawns.
- `07_combat.gif` or a short browser recording: correct cast/contact/hurt/death and source-generated VFX.
- `08_loot_claim.png`: one authoritative reward, either direct or ground method, not both.
- `09_quest_handin.png`: real NPC manual turn-in and pictured reward.
- `10_masked_breakthrough.png`: in-world breakthrough ceremony; masked identity remains hidden.
- `11_mobile_390x844.png`: real running scene and any intentionally opened overlays.
- `12_two_browser_shared_hp.png`: same shared monster HP/state in two browsers.
- `13_before_after_asset_comparison.png`: at least one upgraded producer-approved replacement compared to prototype scene.

Visual captures must come from the **running application**. Generated concept art may appear as supplementary material but must be labeled CONCEPT and not be used as proof of in-engine integration.

## 4. Visual quality and functional gates

### Production visual gate (`CREATIVE`, owner decision)

- New final assets originate from genuine generated imagery or explicitly approved AI source originals; provenance/checksums retained.
- **Candidate A is still a proposal/reference**, not a globally approved art style, and technical `PASS` does not confer creative approval.
- Visual style, anatomy, item icons, animation, map palette and environment composition judged **at actual game zoom** and within normal HUD constraints.
- Characters stand on the ground correctly; roofs/trees occlude believably; walkable paths and skill telegraphs remain legible; foreground objects do not become unintentional collision walls.
- Each visible new `ContentDef` has `VisualBindingDef` → actual declared asset/scene binding → inspection evidence → explicit approval.
- Placeholders may continue to support current prototype, but a milestone requiring production art cannot be marked RELEASED while a mandated visual role is placeholder.

### Gameplay and safety gate (`TECHNICAL`, code-phase tests)

- Two real browsers connected to authoritative Colyseus room; monster state and registered combat events agree.
- Auto Farm only for currently controlling online session; disconnect cannot earn rewards or quest credit.
- NPC BUY/SELL manual, per-vendor catalog checked, shared ShopService; no player market/listing/auction implementation.
- Every kill/loot/shop/quest state transition exactly once; no client-supplied price/damage/reward authority.
- No Legendary signature sold in ordinary shop, no automatic Chân Truyền or public main-quest signature lock.
- Shader/particle/UI performance profiled in full village/forest at production representative zoom; performance thresholds are subject to owner-approved target hardware matrix (no invented FPS certification).

## 5. Concrete reject conditions

Reject the slice if any of the following holds: only CSS boxes render the town; all shops are generic floating modal buttons; generated art never appears in Tiled/Phaser; all characters use one recolored template; ChatDVT is humanoid; market performs player-to-player trades; quest hand-in executes automatically on arrival; auto farm keeps simulating combat offline; tech audit passes but no running screenshots/GIFs exist; unreleased villain/Phì Đế identity spoiler is shown to first-level players.

## 6. Milestone sign-off form (template, not a real approval)

| Check | Actual status | Evidence | Owner sign-off |
|---|---|---|---|
| Content/schema accepted | NOT_EXECUTED | — | PENDING |
| Server/Colyseus behavior | NOT_EXECUTED | — | PENDING |
| Asset provenance + technical checks | NOT_EXECUTED | — | PENDING |
| Game screenshots/animations | NOT_EXECUTED | — | PENDING |
| Human approval of art + scene UX | NOT_EXECUTED | — | PENDING |

**Do not mark any row PASS solely because this document exists.**
