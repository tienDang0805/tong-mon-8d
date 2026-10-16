# UX Design — Online AFK Cultivation RPG

> Baseline v0.2 | 2026-10-16 | Interaction design APPROVED; visual palette/screenshots NOT HUMAN_APPROVED.

## Screen philosophy

The **Phaser playfield occupies the center** and communicates a living pixel-art world. DOM overlays are light and thematic (scroll/jade/wood) rather than a web dashboard. Design first for desktop (1280×720 reference), then responsive/mobile (390×844 reference); full mobile support may be staged.

## Always-visible HUD (concept)

| Region | Information |
|---|---|
| Top-left | Portrait, Character Lv, major realm/realm stage, HP/Linh Lực bars, EXP/Tu Vi entrypoints |
| Top-right | Zone name, compact minimap/map button, event/party access |
| Right side | **Small highlighted quest tracker**; show 1 main and limited additional tracked tasks; title, progress, location hint |
| Bottom-center | Current auto skill loadout, combat state, medicine triggers; **Auto Farm ON/OFF** |
| Bottom-left | Chat/friends/party, minimal obstruction |
| Context near character | One interaction marker and concise prompt for NPC, portal, gathering or manual quest hand-in |

## Quest journal — must follow OWNER-APPROVED behavior

- Press **`Q`** to open full journal.
- Tabs/categories: **Chính tuyến / Phụ tuyến / Đặc biệt / Hằng ngày / Bảng nhiệm vụ thành trấn**.
- Quest list shows availability, selected highlight, short objective, progress, state, reward, NPC/map marker.
- Clicking quest in compact tracker highlights it and can start **Auto Navigation TO location**.
- **No Auto Quest engine** that talks to NPCs, accepts/completes a quest, auto-selects story consequences or auto-runs point-and-click puzzles.
- On arriving at NPC, navigation stops and player must interact; accepted quest kill counters can advance while **online auto combat** kills eligible monsters.
- If travel has no valid route or objective location is hidden/unrevealed, show an understandable message instead of teleporting or skipping story discovery.

## Auto Farm panel

A small configure panel, not multiple dashboards: target selection (`safe/same-realm/challenge` candidate modes), skill use priority, HP/MP consumable thresholds, potion enable toggle, picked-up loot filters if added later, current zone safety note, **Start/Stop**. Define default safe policy and protect against potion spam. Allow reviewing per-session loot/EXP/Dao EXP efficiency.

**Presence semantics**: Auto Farm is only active while authenticated/connected. A disconnect stops further server simulation under validated grace/expiry policy; no offline combat rewards.

## Cultivation screen

Separate visually: `Character Level + EXP + available point(s)`, `Realm / stage + Tu Vi / breakthrough readiness`, `Dao paths 1–10`, `Công pháp main method`, `Hậu Thiên collected / 3 active`. Do not merge Dao mastery with 17 realm ladder.

The **Phàm Nhân→Luyện Khí** breakthrough screen must explicitly indicate that the masked immortal's **Main Quest**, starter công pháp and breakthrough pill prerequisites have been met. Never offer ordinary EXP-only bypass.

## Character creation

- Name/appearance → roll **three Tiên Thiên** → read quality/effect and any protected Legendary signature → **reroll whole trio infinitely, no per-slot lock** → explicit confirm with irreversible warning.
- Ten signature ID mutual-exclusion applies to displayed combinations and confirmed server result; do not show two different Legendary signatures in same trio.
- Three fixed innate foundations are separate from later collected Hậu Thiên; display exactly **3 Hậu Thiên active slots**.

## Story dialog and approval

Interaction panels allow read/skip-replay of noncritical dialogue where appropriate. Decisions with persistent consequences require explicit click/confirmation; never let idle automation decide. If a Legendary is present in universal Main Story, show their public interaction even to players ineligible for their private path. Locked special quest may show an appropriately vague clue instead of revealing secret requirements prematurely.

## Art & game-view verification

Exact UI pixel-art style is not approved simply because a mock or technical screenshot exists. Test small and large text, Vietnamese diacritics, zoom/contrast, tooltips, inventory grids, modal focus, keyboard input collisions (`Q` while chat focused), accessibility/reduced motion. Validate actual in-engine 1280×720 and 390×844 captures before promoting art to HUMAN_APPROVED.
