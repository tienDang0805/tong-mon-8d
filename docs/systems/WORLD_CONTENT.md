# SYS-WORLD-CONTENT — World Graph, Zones, Instances and Location Registry

> TD-04 v0.6 | OWNER_REVIEW_REQUIRED. Data topology and authoring only; TD-03 owns actual route execution, collision arbitration and connection activity state. `GD-033`, `GD-035`, `GD-036` apply.

## 1. Existing reality vs future proposal

| World | Exists in prototype | TD-04 model | Gate |
|---|---|---|---|
| `tan_thu_thon` | 40×30 Tiled cells at 32px, village/merchant/NPC spawn, safe zone, public portal | **Public hub**, no auto hostile farming; quests/narrative interactive | Safe-zone constraint server-side |
| `thanh_truc_lam` | 44×32 Tiled cells at 32px, 2 kinds of mobs and bidirectional portal | **Mixed-threat outdoor map** with candidate *outer Phàm* / *inner Luyện Khí* authored encounter areas | Explicit encounter polygons, **not** player-adaptive difficulty |
| `van_bao_cac`, `huyet_ma_dong`, `huyet_loi_son`, Legendary domains | Referenced in historic lore/backlog | Future registry IDs and region summaries only **PROPOSED** | Not present/playable until separate content and art approvals |
| Higher planes | Lore | Story scenes/cinematics only until owner expands scope | Never imply 18th playable realm beyond Thánh Cảnh |

**No fictional coordinates:** Future regions have no accepted map bounds/spawns/portal positions. Do not populate placeholder coordinates in an `APPROVED` production zone registry. Retain the current two-way portal implementation until migrated through a reviewed map change.

## 2. Typed authoring contracts (illustrative TypeScript, NO code implementation)

```ts
export type ZoneKind = "overworld_zone" | "interior" | "legendary_domain" | "combat_instance" | "point_click_instance" | "story_instance";
export type AccessMode = "public" | "discovered" | "conditional" | "private_story";
export type PortalAction = "auto_pass_public" | "require_interact" | "require_choice";

export interface LocationDef {
  id: string;
  zoneId: string;
  tiledObjectId: string;
  approachRadiusPx: number;
  revealConditionId: string | null;
  safeToAutonavigate: boolean;
  labelsVi: { revealed: string; concealed: string };
}
export interface EncounterAreaDef {
  id: string;
  zoneId: string;
  tiledRegionObjectId: string;
  targetRealmId: string;
  targetLevelMin: number;
  targetLevelMax: number;
  allowedMonsterIds: string[];
  kind: "starter" | "common" | "challenge" | "elite" | "boss";
  autoFarmAllowed: boolean;
}
export interface PortalEdgeDef {
  id: string;
  sourceZoneId: string;
  destinationZoneId: string;
  sourceLocationId: string;
  destinationSpawnLocationId: string;
  accessConditionId: string;
  navigationAction: PortalAction;
}
export interface ZoneContentDef {
  id: string;
  kind: ZoneKind;
  accessMode: AccessMode;
  mapAssetId: string | null;
  locationIds: string[];
  encounterAreaIds: string[];
  portalIds: string[];
  questLocationIds: string[];
  defaultAccessConditionId: string;
}
export interface InstanceContentDef {
  id: string;
  kind: "combat_instance" | "point_click_instance" | "story_instance";
  entryConditionId: string;
  exitLocationId: string;
  completionEventId: string;
  normalizedCombatRulesetId: string | null;
  expiryAndReconnectPolicyId: string;
  checkpointPolicyId: string;
}
```

The `LocationDef.id` and `TiledObjectId` are stable logical identifiers; underlying pixel coordinates are authored in Tiled and **validated against the actual map layer objects**. Do not send hidden coordinates to clients. `ZoneId` union in the current shared protocol contains exactly `tan_thu_thon` and `thanh_truc_lam`; expanding requires deliberate, versioned protocol and room support — not just adding a string to a content file.

## 3. TD-03 navigation compatibility

`QuestObjectiveDef.locationRef` resolves to one server-authorized `LocationDef.id` after accepted quest, story reveal flag, party/world permission and authored objective conditions are checked. Route graph: `currentZone → permitted PortalEdgeDef* → objectiveZone → approach tiles`.

- **Proposed public portal auto-pass** is allowed only for `auto_pass_public` with current permission and unblocked route; the real server must execute the authoritative room transition. `require_interact` or `require_choice` always stops and asks the human player. This is **DESIGN_BASELINE**, not previously approved canon.
- `arrive` is never `talk`, `submit`, `choose`, `craft`, `deliver`, private dialogue or quest accept; `visit` may gain exactly-once factual credit if the active quest explicitly defines a valid visited region (`GD-004`, TD-03 NAV-11).
- Concealed places use `labelsVi.concealed` only. `revealConditionId` false → no path or location exposure. A late-game spoiler, especially Phì Đế/Ăn Uống Thiên Tôn, never leaks through waypoint labels.
- Unreachable portal edges and stale versions invalidate route; never teleport or invent a shortcut. Map keys and collision depend on TD-05's approved art and the actual Tiled objects.

## 4. Fixed threat, accessibility and instance rules

Each encounter area has fixed realm/Level bands and authored monster stats; **do not scale threat from the player's current level or Tiên Thiên reroll**. TD-02's representative Tiên-oriented challenge tuning is **not** the only monster difficulty: starter area must be survivable and farmable by a normal Phàm build.

Combat Bí Cảnh may allow TD-03 configured active skill automation **inside an instance the player manually entered**; TD-02 owns trial stat normalization. Point-and-click Bí Cảnh requires real choices/puzzles, including TD-02 3→4 / 6→7 / 9→10 mastery gate events. Instances never auto-enter/auto-complete based on selecting a quest.

Legendary NPCs appear in **shared public Main Quest space** regardless of signature. Their optional private Chân Truyền domain may require the matching signature but must never block a mandatory public route or global realm growth. Separate public NPC's world spawn from its private instance entry.

## 5. Proposed first slice content topology — not deployed

`tan_thu_thon`: anonymous masked immortal quest introduction and manual dialogue, village quest board, food vendor/cauldron, public Phì Đế introduction. `thanh_truc_lam`: candidate outer forest starter hunting area (Phàm Lv1–10), forest anomaly `visit` marker, candidate inner Luyện Khí challenge; quests route from town via existing bidirectional portal.

After TD-05 signs off actual art/maps, author stable Tiled object IDs rather than embedded unverified `x/y` guesses. Current `truc_lang` and `thanh_lan_xa` are **legacy monster IDs** and may be reused in appropriately tuned areas. Their current numbers are not TD-02 target-build balancing results.

## 6. Validation acceptance

`WORLD-01`: `zoneId`, `locationId`, `portalId` unique and all endpoints exist. `WORLD-02`: portal graph permits round trip for the two legacy zones. `WORLD-03`: locked/secret portals not auto-pass. `WORLD-04`: objectives never reveal undiscovered locations. `WORLD-05`: all combat zones have authorized encounter areas and safe-zone prevents ambient farm. `WORLD-06`: no player-based rubberband scaling. `WORLD-07`: inaccessible quest location must fail author validation or be explicitly scripted. `WORLD-08`: no exclusive Legendary realm area blocks public Main Quest. `WORLD-09`: instance trial requires a valid server-authored completion event; point-click choices manual. `WORLD-10`: Tiled location approach lies on a reachable walkable tile with no wall clipping.
