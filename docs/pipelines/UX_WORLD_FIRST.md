# TD-05 · World-First Interaction & UX Presentation

> v0.7 · DESIGN_BASELINE. Complements `docs/UX_DESIGN.md` and TD-03, not a replacement for manual quest and AFK rules.

## 1. Principles for a game, not a spreadsheet

- The **playfield is primary**. Every gameplay loop should have an animated world response. HUD is compact, contextual and secondary.
- Menus are allowed for complex inventory/shop/skill/stat/detail tasks. The owner rejects **menu-only feature delivery**, not menus per se. The world should look like a complete scene even when all overlays are closed.
- A UI action originates from a location/interaction: trade at a **real physical** NPC/market, read a tome with an illustrated scroll, inspect quest near a board/NPC, visit Bí Cảnh via an actual entrance, receive milestone with a brief scene/VFX cue.
- Avoid permanent dense stacked panels, generic rounded cards, unstyled tables, random web icons and giant text logs. The user's primary experience should be spatial movement, visible activity and coherent pixel art.
- Render decorative UI illustrations from approved generative sources; CSS draws typography, layout and functional controls, **not substitute final pixel-art motifs**.

## 2. UI budgets and player actions (proposed layout, to be playtested)

| State | Always-visible content | Temporary detail surface | World feedback |
|---|---|---|---|
| Normal movement | Status/realm/HP/MP top-left, minimap top-right, compact quest tracker, small bottom hotbar, unobtrusive chat | None | Animated inhabitants, hazards, merchants, ambiance |
| Online Auto Farm | Discreet ON/STOP and target, 1–2 efficiency indicators; no scrolling log | Optional settings panel on click | Auto attacks/hit VFX, loot, nearby monster health and animation |
| Manual quest tracking | Compact title/goal + marker | `Q` journal only when requested | NPC marker, quest board/map arrow, location and manual interaction |
| Trading | Compact context prompt next to vendor/counter | Intentional buy/sell overlay with search/filter, item icons, price and confirmation; show world behind or return to world cleanly | Vendor animation/counter/item preview, earned/paid feedback |
| Cultivation/breakthrough | Realm/EXP/tu vi hints | Dedicated training/cultivation surface when requested | Character meditation/breakthrough animation, source-based aura |
| Bí Cảnh | World viewport and context icons | Optional small hint/dialog when interacting | Illustrated chamber, visible objects/branch paths/hazard animations |

Desktop baseline screenshot 1280×720. Mobile reference 390×844 used to identify tap targets/panel obstruction, but release capability is staged and not promised automatically. Respect focus: `Q` never toggles quest journal while input/chat is active. Player must manually `BUY`, `SELL`, submit quests, use choice options or start skill study.

## 3. Concrete demo journeys: acceptance stories

### Journey A — Shop is a place

1. Player spawns at Tân Thủ Thôn; a visible roof/sign/lantern identifies **Tụ Bảo Các**.
2. Player moves to entrance/counter. The screen shows shelves, categorized goods and specialized shopkeeper art.
3. Interact manually; shop detail screen displays product icons and categories **Đan Dược**, **Công Pháp**, **Võ Kỹ**, **Trang Bị**, **Linh Trù/Tạp Hóa** with text search and proper category filters.
4. Player selects an item, sees its illustration/price/requirements, confirms BUY. Server transaction from TD-04 credits exactly once; no automatic spending.
5. Closing overlay returns immediately to the same animated scene. Player can also go to specialized NPC stalls using the **same underlying ShopService** with filtered offers.

### Journey B — Quest isn't a menu-only game

1. Highlight quest in small tracker; press `Q` for full journal when desired.
2. Click auto-navigation: character follows valid TD-03 path to a visible NPC, board, entrance or object.
3. At objective, character stops and a small interaction marker appears. The player manually talks/accepts/turns in.
4. For a legitimate already-active kill task, online Auto Farm counts actual server kills; progress marker updates unobtrusively.
5. Quest reward appears with artified item/token and world completion cue, never solely as a raw notification dump.

### Journey C — Combat has presence

1. Player visibly walks to Thanh Trúc Lâm; foliage, water, wildlife and lighting establish different biome.
2. Player starts Auto Farm while online; character visibly targets, moves, casts and hits, creatures telegraph/hurt/die, source-generated VFX and world drop or direct reward appear.
3. Server disconnect terminates combat and UI shows PAUSED/STOPPED; no hidden offline kills occur.

### Journey D — Legendary story not just a portrait

1. A Legendary NPC occupies authored world space, with unique animated silhouette and setting; public dialogue is open to any player.
2. Special Chân Truyền interactions appear only to eligible signature owners; there is no auto-quest.
3. Six-chapter unique content eventually includes real spatial quest objects, illustrated scenes or Bí Cảnh; six identical popup quests are not a complete content line.
4. Phì Đế's hidden late-game identity is **not** telegraphed through early unreleased title art or public UI data.

## 4. Shop overlay is allowed — popup-only gameplay is not

A functional inventory/shop grid is reasonable for many items, especially sorting and filtering. But it must be **anchored to a physical merchant/world building** and accompanied by semantic art icons, world item preview, vendor identity and feedback. Do not interpret 'no popup game' as 'no menu at all'. Do not implement player-to-player trading, listing, auction or escrow as part of the approved NPC buy/sell scope.

## 5. Visual review acceptance

`UXV-01` closed-HUD screenshot has enough detailed game world to read as RPG environment. `UXV-02` no center-screen persistent admin dashboard. `UXV-03` a new quest has a visible target landmark. `UXV-04` a manual transaction cannot be triggered by clicking auto navigation or Auto Farm. `UXV-05` UI includes unique item and skill art, not text-only rows. `UXV-06` responsive overlay does not permanently trap player in a panel. `UXV-07` world remains legible with effects and quest markers in desktop/mobile samples. `UXV-08` Vietnamese diacritics are tested in real game fonts. `UXV-09` art approval records UI skin/scene separately from icon technical verification.
