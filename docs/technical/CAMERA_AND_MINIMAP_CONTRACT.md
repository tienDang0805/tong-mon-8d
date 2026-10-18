# CAMERA AND MINIMAP CONTRACT — Tông Môn 8D (`VISUAL-03-P` R1)

- **Document ID**: `TECH-CAM-MM-01`
- **Task**: `VISUAL-03-P` (`PLAN_AND_DOCS_ONLY` — Final Corrections Pass)
- **Status**: `READY_FOR_VISUAL_03_W_AUTHORIZATION` (No runtime source modified)
- **Visual Direction**: `V01-B — THIÊN MỆNH TIÊN CUNG` (Three-Tier Grandeur System; `Tân Thủ Thôn` = Tier I Grounded Starter Village)
- **Governing Contracts**: `AGENTS.md`, `RULES.md` (Rule 1, Rule 3, Rule 4, Rule 5, Rule 6), `docs/ART_BIBLE.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, `docs/pipelines/UX_WORLD_FIRST.md`, `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md`

---

## 1. Purpose, Scope & Proven Source vs. Proposed Contract

### 1.1 Core Principles
1. **Explorable Multi-Screen 2D Top-Down World (Never Fitting the Whole World in the Gameplay Viewport)**:
   - The expanded `Tân Thủ Thôn` (`tan_thu_thon`) spans **`96 × 72` logical tiles at `32 × 32 px` (`3072 × 2304` world pixels)** — `5.76×` the area of the `40 × 30` (`1280 × 960 px`) prototype baseline.
   - Because the Phaser client uses `Phaser.Scale.RESIZE` (`apps/client/src/main.ts` lines 61–74), a fixed `1.0×` camera zoom would expose `1920 × 1080 px` (`30%` of the map) on FHD and `3840 × 2160 px` (`100%` of width and `93.75%` of height) on a 4K `3840 × 2160` monitor.
   - Therefore, the normal gameplay camera MUST use an **Adaptive Responsive Zoom Profile** (`Section 3.3`) so that at **`1280 × 720`, `1920 × 1080`, `2560 × 1440`, and `3840 × 2160`**, the visible world window (`camera.worldView`) remains bounded to a single readable village district (`960 × 540 px` to `1024 × 576 px`, i.e., `30 × 16.875` to `32 × 18` tiles = **`7.32%–8.33%` of `Tân Thủ Thôn`**). The full map MUST NEVER automatically fit into the normal gameplay viewport.
2. **Playfield First & Optional Map UI Distinction (`RULES.md` Rule 4 & `UX_WORLD_FIRST.md`)**:
   - At least **`70%` of the viewport** (`>= 75%` target) must remain unobstructed live Phaser 4 world canvas during normal exploration and combat.
   - Fitting the whole world into the live gameplay viewport is permanently prohibited. However, this contract **does NOT permanently prohibit a separate, optional world-map or zone-atlas UI interface** in a future slice, provided any future map overlay is an explicit optional UI view and never replaces the live scrolled gameplay camera or overwrites existing keyboard shortcuts (`Section 4.4`).
3. **Server Authority & Deterministic Logical Grid (`RULES.md` Rule 3 & Rule 5)**:
   - Camera zoom, camera scroll (`scrollX`, `scrollY`), and minimap rendering are strictly **client-side presentation projections**.
   - All movement intents (`sendMove`), collision checks (`Math.floor(worldX / 32)`, `Math.floor(worldY / 32)`), NPC interaction ranges (`<= 135..165 px`), shop ranges (`<= 160 px`), drop pickup ranges (`<= 105..110 px`), and portal triggers (`radiusPx = 92 px`) operate exclusively in **unscaled logical world pixels (`0..3072`, `0..2304`)** validated by `AuthoritativeWorldEngine` in `apps/server/src/worldEngine.ts`.

### 1.2 Proven Existing Source Behavior vs. Proposed `VISUAL-03-W` Contract vs. Deferred `S4` Scope

| Capability / API | Classification | Exact Source Evidence / Location | Scope Decision |
|---|---|---|---|
| `Phaser.Scale.RESIZE` + `pixelArt: true` + `roundPixels: true` | **EXISTING (Proven in Repo)** | `apps/client/src/main.ts` lines 61–74 | Retained; paired with adaptive zoom on `scale.on("resize")` so 1080p/4K viewports do not expose the whole world. |
| `cameras.main.setBounds(0, 0, worldW, worldH)` & `startFollow(localVisual.sprite, true, 0.14, 0.14)` | **EXISTING (Proven in Repo)** | `apps/client/src/WorldScene.ts` lines 547–550 & line 721 | Retained and wrapped in `CameraView.ts` with `centerOn` snap on spawn/zone switch and adaptive zoom. |
| Direct ground click-to-move (`this.pointerTarget = { x: worldPt.x, y: worldPt.y }`) | **EXISTING (Proven in Repo)** | `apps/client/src/WorldScene.ts` lines 302–307 & lines 1029–1048 | Retained as straight-line local pointer walk; HUD elements stop propagation so UI clicks do not set `pointerTarget`. |
| Global keyboard shortcuts (`WASD`/Arrows, `J`, `K`, `L`, `E`, `F`, `I`, `C`, `M`, `B`, `Escape`) | **EXISTING (Proven in Repo)** | `apps/client/src/WorldScene.ts` lines 169–300; `apps/client/src/hud.ts` lines 173–197 (`M` = `sendClaimMeditation()`, `B` = `sendBreakthrough()`) | **Preserved 100% unchanged**; `M` remains bound to `sendClaimMeditation()`. |
| `CameraView` (`computeResponsiveCameraZoom`, resize listener, bounds clamp) | **PROPOSED (`VISUAL-03-W`)** | New module `apps/client/src/game/world/CameraView.ts` invoked by `WorldScene.ts` | Implemented in `VISUAL-03-W`. |
| `MinimapView` (Essential S1 static geography cache + dynamic player, viewport box & canonical NPC/portal markers) | **PROPOSED (`VISUAL-03-W`)** | New module `apps/client/src/game/world/MinimapView.ts` mounted in `#hud-top-right` (`apps/client/src/hud.ts`) | Implemented in `VISUAL-03-W` as a read-only orientation surface. |
| `startAutoNav(worldX, worldY)` / `autoNavTarget` / Minimap click-to-navigate / Quest waypoint path lines | **DEFERRED (`S4` Future Scope — NOT in Repo)** | Specified in `docs/systems/QUEST_ENGINE.md` (`TD-03`) and `docs/ROADMAP.md` (`S4`); **does NOT exist** in `apps/client/src/WorldScene.ts` | **Strictly excluded from `VISUAL-03-W`**. Do not assume `startAutoNav` exists or implement S4 auto-navigation during `VISUAL-03`. |

---

## 2. World-to-Camera Geometry & Zone Dimensions

### 2.1 Canonical S1 Zone Geometry Table

| Zone ID | Zone Name | Logical Grid (`widthTiles × heightTiles`) | Tile Size (`tileSize`) | Logical World Size (`worldW × worldH` px) | Total Tiles / Layer | Default Spawn `(tx, ty)` → `(x, y)` px | Portal `(tx, ty)` → `(x, y)` px |
|---|---|---:|---:|---:|---:|---|---|
| `tan_thu_thon` (Legacy Prototype) | Tân Thủ Thôn (Legacy) | `40 × 30` | `32 × 32 px` | `1280 × 960 px` | `1,200` | `(20, 16)` → `(640, 512)` | `(35, 15)` → `(1120, 480)` |
| **`tan_thu_thon` (`VISUAL-03` Target)** | **Tân Thủ Thôn (Expanded)** | **`96 × 72`** | **`32 × 32 px`** | **`3072 × 2304 px`** | **`6,912`** | **`(48, 38)` → `(1552, 1232)`** | **`(86, 37)` → `(2768, 1200)`** |
| `thanh_truc_lam` (Retained S1 Combat Zone) | Thanh Trúc Lâm | `44 × 32` | `32 × 32 px` | `1408 × 1024 px` | `1,408` | `(6.6, 15)` → `(212, 480)` | `(4, 15)` → `(128, 480)` |

---

## 3. Adaptive Responsive Camera Profile (`1280×720`, `1920×1080`, `2560×1440`, `3840×2160` & Mobile)

### 3.1 Why Fixed `1.0×` Zoom Fails Under `Phaser.Scale.RESIZE`
In `apps/client/src/main.ts` (lines 65–68), Phaser uses `Phaser.Scale.RESIZE`, meaning `camera.width` and `camera.height` equal the CSS pixel dimensions of `#phaser-container`. Because Phaser computes visible world dimensions as:
$$\text{viewportWorldW} = \frac{\text{camera.width}}{\text{camera.zoom}}, \quad \text{viewportWorldH} = \frac{\text{camera.height}}{\text{camera.zoom}}$$
a fixed `camera.zoom = 1.0` would produce:
- On `1280 × 720`: `1280 × 720` world px (`40 × 22.5` tiles = `13.02%` of `tan_thu_thon`).
- On `1920 × 1080`: `1920 × 1080` world px (`60 × 33.75` tiles = `29.30%` of `tan_thu_thon`, and **larger than the entire `1408 × 1024` `thanh_truc_lam` combat zone!**).
- On `3840 × 2160` (4K): `3840 × 2160` world px (**wider than the entire `3072 × 2304` `tan_thu_thon` village** and `93.75%` of its height!).

### 3.2 Hard World-Viewport Ceiling & Pixel-Art Preservation Rules
To guarantee a limited, readable world view at every resolution while preserving crisp nearest-neighbor pixel art:
1. **Hard Visible World Window Ceiling (Normal Gameplay)**:
   - Across all desktop/landscape viewports (`1280 × 720`, `1920 × 1080`, `2560 × 1440`, `3840 × 2160`), the visible world area MUST satisfy:
     $$\text{viewportWorldW} \le 1024\text{ px } (32\text{ tiles}), \quad \text{viewportWorldH} \le 576\text{ px } (18\text{ tiles})$$
   - This guarantees that:
     - At most **`8.33%` (`576 / 6912` tiles)** of `Tân Thủ Thôn` (`3072 × 2304 px`) is visible at once on any desktop monitor (`720p`, `1080p`, `1440p`, or `4K`).
     - At most **`41.02%` (`576 / 1408` tiles)** of `Thanh Trúc Lâm` (`1408 × 1024 px`) is visible at once, so **even the smaller `44 × 32` combat zone scrolls horizontally and vertically on 1080p and 4K without ever fitting inside the viewport**.
2. **Integer Zoom Preference on High-Resolution Displays (`1080p`, `1440p`, `4K`)**:
   - On `1920 × 1080` (`2.0×` zoom), `2560 × 1440` (`3.0×` zoom), and `3840 × 2160` (`4.0×` zoom), the camera uses **exact integer zoom multipliers (`2×`, `3×`, `4×`)** so every `32 × 32` tile and `80 × 96` sprite texel maps to an exact $N \times N$ integer block of physical screen pixels with zero sub-pixel shimmer.
   - On `1280 × 720`, `zoom = 1.25×` frames `1024 × 576` world px (`32 × 18` tiles = `8.33%` of map) with `pixelArt: true` (`GL_NEAREST`) and `roundPixels: true`.
   - On `390 × 844` mobile portrait, `zoom = 1.00×` (exact `1×` integer pixel scale) frames `390 × 844` world px (`12.2 × 26.4` tiles = `4.66%` of map).

### 3.3 Deterministic Responsive Zoom Function & Multi-Resolution Table

```ts
export interface ResponsiveCameraProfile {
  zoom: number;
  viewportWorldW: number;
  viewportWorldH: number;
  visibleTilesX: number;
  visibleTilesY: number;
}

export function computeResponsiveCameraProfile(
  viewportWidth: number,
  viewportHeight: number
): ResponsiveCameraProfile {
  const safeW = Math.max(320, viewportWidth);
  const safeH = Math.max(320, viewportHeight);
  const minDim = Math.min(safeW, safeH);

  let zoom = 1.0;
  if (minDim < 500) {
    const mobileMinZoom = Math.max(safeW / 844, safeH / 844, 1.0);
    zoom = Math.ceil(mobileMinZoom * 4) / 4;
  } else {
    const targetWorldW = 1024;
    const targetWorldH = 576;
    const rawZoom = Math.max(safeW / targetWorldW, safeH / targetWorldH, 1.25);
    if (safeW >= 1800 && safeH >= 1000) {
      zoom = Math.max(2.0, Math.ceil(rawZoom));
    } else {
      zoom = Math.ceil(rawZoom * 4) / 4;
    }
  }

  const viewportWorldW = Math.round(safeW / zoom);
  const viewportWorldH = Math.round(safeH / zoom);
  return {
    zoom,
    viewportWorldW,
    viewportWorldH,
    visibleTilesX: Number((viewportWorldW / 32).toFixed(2)),
    visibleTilesY: Number((viewportWorldH / 32).toFixed(2))
  };
}
```

#### Multi-Resolution Verification Table (`Tân Thủ Thôn` `3072 × 2304 px` & `Thanh Trúc Lâm` `1408 × 1024 px`)

| Viewport Resolution (CSS px) | Computed `camera.zoom` | Pixel Scaling Mode | Visible World Window (`viewportWorldW × viewportWorldH` px) | Visible Tiles (`cols × rows`) | % of `96×72` `Tân Thủ Thôn` Visible | % of `44×32` `Thanh Trúc Lâm` Visible | Scroll Range in `Tân Thủ Thôn` (`ΔX × ΔY` px) |
|---|---:|---|---|---:|---:|---:|---|
| **Mobile Portrait `390 × 844`** | **`1.00×`** | Exact `1×` integer | `390 × 844 px` | `12.19 × 26.38` (`322` tiles) | **`4.65%`** | `23.40%` | `2682 × 1460 px` |
| **Mobile Landscape `844 × 390`** | **`1.00×`** | Exact `1×` integer | `844 × 390 px` | `26.38 × 12.19` (`322` tiles) | **`4.65%`** | `23.40%` | `2228 × 1914 px` |
| **Desktop HD `1280 × 720`** | **`1.25×`** | Quarter-step `GL_NEAREST` | **`1024 × 576 px`** | **`32.00 × 18.00` (`576` tiles)** | **`8.33%`** | **`40.91%`** | **`2048 × 1728 px`** |
| **Desktop FHD `1920 × 1080`** | **`2.00×`** | **Exact `2×` integer** | **`960 × 540 px`** | **`30.00 × 16.88` (`506` tiles)** | **`7.32%`** | **`35.96%`** | **`2112 × 1764 px`** |
| **Desktop QHD `2560 × 1440`** | **`3.00×`** | **Exact `3×` integer** | **`853 × 480 px`** | **`26.67 × 15.00` (`400` tiles)** | **`5.79%`** | **`28.41%`** | **`2219 × 1824 px`** |
| **Desktop 4K UHD `3840 × 2160`** | **`4.00×`** | **Exact `4×` integer** | **`960 × 540 px`** | **`30.00 × 16.88` (`506` tiles)** | **`7.32%`** | **`35.96%`** | **`2112 × 1764 px`** |

### 3.4 Camera Follow, Snap & Edge Clamping Rules (`CameraView.ts`)
- **Follow Target & Offset**: `cameras.main.startFollow(localVisual.sprite, true, 0.14, 0.14, 0, -24)` so `roundPixels = true` is enforced on the camera follow and the focal point sits on the character's torso (`y - 24`) rather than their feet.
- **Immediate Snap on Spawn / Zone Switch / Large Position Correction**: Immediately after `buildZoneWorld(zoneId)`, `switchZone(zoneId, spawnX, spawnY)`, or a server reconciliation jump `> 72 px` in `syncSelfState`, call `cameras.main.centerOn(localX, localY - 24)` so the camera never sweeps across the map from `(0, 0)`.
- **Four-Edge World Clamping**: `cameras.main.setBounds(0, 0, worldW, worldH)` (`3072 × 2304` in `tan_thu_thon`, `1408 × 1024` in `thanh_truc_lam`). Because `viewportWorldW <= 1024 < 1408 < 3072` and `viewportWorldH <= 844 < 1024 < 2304` at every resolution in the table above, Phaser strictly clamps `scrollX` to `[0, worldW - viewportWorldW]` and `scrollY` to `[0, worldH - viewportWorldH]` with zero out-of-bounds void.

---

## 4. Coordinate Conversion, Y-Sort Occlusion Rules & Keyboard Shortcuts

### 4.1 Five-Space Coordinate Conversion Formulas
Let $(sx, sy)$ be DOM/canvas pointer coordinates in CSS px, $(cw, ch)$ be `camera.width` and `camera.height`, $z$ be `camera.zoom`, and $(\text{scrollX}, \text{scrollY})$ be camera top-left scroll coordinates in logical world pixels:
1. **Screen Pointer $(sx, sy)$ → Logical World $(wx, wy)$** (`this.cameras.main.getWorldPoint(sx, sy)`, `WorldScene.ts` line 305):
   $$wx = \text{scrollX} + \frac{cw}{2} + \frac{sx - \frac{cw}{2}}{z}, \quad wy = \text{scrollY} + \frac{ch}{2} + \frac{sy - \frac{ch}{2}}{z}$$
2. **Visible World Frustum (`camera.worldView`)**:
   $$wx_{\min} = \text{camera.worldView.x}, \quad wy_{\min} = \text{camera.worldView.y}, \quad vw = \frac{cw}{z}, \quad vh = \frac{ch}{z}$$
3. **Logical World $(wx, wy)$ → Logical Tile $(tx, ty)$**:
   $$tx = \lfloor wx / 32 \rfloor, \quad ty = \lfloor wy / 32 \rfloor, \quad wx_{\text{center}}(tx) = tx \times 32 + 16, \quad wy_{\text{center}}(ty) = ty \times 32 + 16$$

### 4.2 World Layering, Baseline Anchors & Y-Sort Occlusion Specification

#### A. Root Causes Found in Existing `WorldScene.ts`
Inspecting `apps/client/src/WorldScene.ts` lines 467–698 revealed three distinct occlusion defects when scaling to the `96 × 72` (`3072 × 2304 px`) village:
1. **`AbovePlayer` Depth Overflow in Southern Rows (`y > 2079`)**:
   - Line 473 hardcodes `{ name: "AbovePlayer", depth: 2200 }`. On the `96 × 72` map (`worldH = 2304 px`), entities in southern rows (`ty = 65..71`, $y \in [2080, 2304]$) have sprite depth $y > 2080$ and nameplate depth $y + 121 \in [2201, 2425]$, exceeding `2200`.
2. **Positive `depthOffset` on Trees (`placeHighCraftLandmarks` lines 569–572 & 593)**:
   - Legacy `addProp("prop_peach_tree", x, y, 1.05, 40)` sets `depth = y + 40`. When a player stands **in front (south)** of a tree trunk at `playerY = y + 20`, `player.sprite.depth (y + 20) < tree.depth (y + 40)`, causing the tree canopy/trunk to erroneously cover a player standing in front of it.
3. **Nameplate Bleeding Through Tall Roofs & Walkable Bridge Sorting**:
   - Setting `nameLabel.depth = y + 121` inside the same numeric range as Y-sorted buildings (`depth = y`) causes a player's nameplate to intersect mid-roof when walking behind a pavilion (`buildingHeight > 121 px`).
   - Walkable stream bridges (`prop_bridge_horizontal`, `prop_arched_bridge`) are flat ground structures; if added via `setDepth(y)`, the northern half of the bridge (`playerY < bridgeCenterY`) would render on top of the player's legs.

#### B. Mandatory Layering, Anchor & Collision-Footprint Rules for `VISUAL-03-W`

1. **Rule 1 — Walkable Bridges & Ground Rings Are Surface Strata (Never Y-Sorted Against Actors)**:
   - Walkable bridges (`prop_bridge_horizontal`, `prop_arched_bridge`) MUST be placed in the **Bridge Deck Stratum (`depth = 6`)**, strictly above `Ground` (`1`), `Paths` (`2`), and `GroundDetails` (`3` / water channels), and strictly below all ground rings (`depth >= 10`) and Y-sorted actors (`depth >= 32`). A player crossing any bridge at any $(tx, ty)$ always has `player.sprite.depth > bridge.depth`.
2. **Rule 2 — True Foot/Base-Threshold Y-Sort (`depth = baseContactY`, `depthOffset = 0`)**:
   - Every Y-sorted actor (`localVisual.sprite`, `remoteVisuals`, `npcVisuals`, `monsterVisuals`) uses `origin(0.5, 0.9167)` (`80 × 96` frame foot line at $Y = 88$) or `origin(0.5, 0.9)` (`48 × 64` legacy frame) and sets **`sprite.setDepth(y)`**.
   - Every vertical occluding world prop (`building_tan_thu_tu_duong`, `building_tu_bao_cac`, `building_hong_tran_cac`, `prop_noodle_stall`, `prop_than_dinh`, `prop_portal_arch`, `prop_peach_tree`, `prop_bamboo_cluster`, `prop_stone_lantern`, `prop_village_stele`, `prop_incense_brazier`, `prop_jade_rock`, `prop_wooden_fence`) MUST anchor its image origin at the **southern edge of its blocked ground collision footprint $Y_{\text{base}} = (ty_{\text{blocked\_south}} + 1) \times 32$** (`origin(0.5, baseAnchorRatio)`) with **`depth = Y_base` (`depthOffset = 0`)**:
     - **When the player walks SOUTH (in front) of the prop's blocked footprint**: $y_{\text{player}} > Y_{\text{base}} \implies \text{depth}_{\text{player}} > \text{depth}_{\text{prop}}$. The player sprite renders **in front of** the prop facade/trunk.
     - **When the player walks NORTH (behind) the prop's blocked footprint**: $y_{\text{player}} < ty_{\text{blocked\_north}} \times 32 < Y_{\text{base}} \implies \text{depth}_{\text{player}} < \text{depth}_{\text{prop}}$. The upper roof eaves or tree canopy render **in front of (occlude)** the player's body.
     - **Blocked Footprint Interior**: Because tiles $[tx_1..tx_2] \times [ty_1..ty_2]$ have `Collision = 1` in `tan_thu_thon.tmj`, no player or NPC can stand inside the wall/trunk base where sort-order inversion could occur.
3. **Rule 3 — Deterministic 12-Stratum Scene Depth Table (`worldH <= 3200 px`)**:

| Stratum | Scene Object / Layer | Target Depth Formula | Numeric Range on `96×72` (`worldH = 2304`) | Occlusion Guarantee |
|---|---|---|---:|---|
| 1. Base Terrain | `Ground` tilelayer | `1` | `1` | Lowest world canvas layer |
| 2. Roads & Plazas | `Paths` tilelayer | `2` | `2` | Above grass/water |
| 3. Terrain Transitions | `GroundDetails` tilelayer | `3` | `3` | Autotile edges & stream banks |
| 4. Logical Collision | `Collision` tilelayer (`visible: false`) | `4` | `4` | Hidden in client; read into `collisionGrid` |
| 5. Floor Markers | `Interactables` tilelayer | `5` | `5` | Floor runes & stall mats |
| 6. Walkable Bridges & Portal Rings | `prop_bridge_horizontal`, `prop_arched_bridge`, `portal_ring` | `6` .. `7` | `6` .. `7` | Always above stream water (`1..3`) and below all actor feet (`>= 32`) |
| 7. Ground Telegraphs & Drops | `telegraphRing`, `auraRing`, `dropVisuals.icon` | `Math.max(8, y - 3)` .. `Math.max(9, y - 1)` | `8` .. `2303` | Flat under the owning actor's feet |
| 8. **Y-Sorted World Actors & Vertical Props** | **Players, NPCs, Monsters, Buildings, Stalls, Cauldron, Portal Arch, Trees, Bamboo, Lanterns, Steles, Rocks, Fences** | **`y` (`baseContactY`, `depthOffset = 0`)** | **`32` .. `2304`** | **Exact Y-sort occlusion across all 72 tile rows** |
| 9. Active Combat & Cauldron VFX | `combat_vfx`, `phi_de_blessing` (`than_dinh` steam/fire) | `y + 24` | `56` .. `2328` | Renders immediately in front of the acting character or cauldron basin |
| 10. Overhead Tile Layer | `AbovePlayer` tilelayer | **`4000`** | `4000` | Strictly above all Y-sorted actors/props (`max = 2328`) across all 72 rows |
| 11. World Nameplates & HP Bars | `hpBg`, `hpFill`, `subLabel`, `nameLabel`, `dropVisuals.label`, portal `label` | **`4100 + Math.round(y * 0.05) + subOrder` (`0..3`)** | `4100` .. `4220` | Never clipped half-way through a building roof; deterministic back-to-front label stacking |
| 12. Floating Damage & `[E]`/`[F]` Prompt | `dmgText`, `interactPromptText` | **`4500` / `4600`** | `4500` .. `4600` | Topmost in-canvas combat/interaction feedback |

### 4.3 Window Resize Handling (`Phaser.Scale.RESIZE`)
When `this.scale.on("resize", (gameSize) => ...)` fires:
1. `CameraView` computes `profile = computeResponsiveCameraProfile(gameSize.width, gameSize.height)`.
2. Calls `cameras.main.setZoom(profile.zoom)` and `cameras.main.setBounds(0, 0, worldW, worldH)`.
3. Notifies `MinimapView` to update the camera viewport rectangle $(rx, ry, rw, rh)$.

### 4.4 Preservation of All Existing Keyboard Shortcuts
All keyboard bindings currently implemented in `apps/client/src/WorldScene.ts` (lines 169–300) and `apps/client/src/hud.ts` (lines 173–197) MUST remain 100% intact during `VISUAL-03`:
- `W, A, S, D` and `ArrowUp, ArrowDown, ArrowLeft, ArrowRight`: 4-direction movement (`WorldScene.ts`)
- `J`: Basic attack `basic_slash` (`WorldScene.ts`)
- `K`: Skill `kiem_khi_ung` (`WorldScene.ts`)
- `L`: Skill `ho_the_kim_quang` (`WorldScene.ts`)
- `E`: Contextual interact with nearest portal or NPC (`WorldScene.ts`)
- `F`: Pick up nearest ground item drop (`WorldScene.ts`)
- `I`: Toggle Inventory modal (`hud.ts`)
- `C`: Toggle Character / Cultivation modal (`hud.ts`)
- `M`: Claim Meditation `this.net.sendClaimMeditation()` (`hud.ts` line 191 — **MUST NOT be overwritten**)
- `B`: Attempt Realm Breakthrough `this.net.sendBreakthrough()` (`hud.ts` line 193)
- `Escape`: Close active HUD modal (`hud.ts` line 185)

---

## 5. Essential S1 Minimap Contract (`Tinh Bàn Tiểu Bản Đồ` — `VISUAL-03-W` Scope)

### 5.1 Strictly Scoped S1 Minimap Responsibilities
During `VISUAL-03-W`, `MinimapView` (`apps/client/src/game/world/MinimapView.ts`) implements **only the essential S1 orientation contract**:
1. **Included in `VISUAL-03-W`**:
   - V01-B astrolabe frame (`hud_minimap_astrolabe_ring.png`, `240 × 240 px`) mounted in `#hud-top-right` (`168 × 168 CSS px` desktop; `112 × 112 CSS px` collapsible on `< 900px` mobile).
   - Static/cached zone geography canvas (`StaticMinimapCanvas`, `192 × 144 px`) built **once per zone load** (`buildZoneWorld(zoneId)`) from `tan_thu_thon.tmj` / `thanh_truc_lam.tmj` tile layers and building footprints.
   - Dynamic overlay canvas (`MinimapOverlayCanvas`) rendering:
     - Current camera viewport bounds rectangle (`camera.worldView`).
     - Local player position and 4-direction facing indicator (`localX`, `localY`, `localDir`).
     - Permitted canonical landmark markers: zone NPCs from `LEGENDARY_NPCS`, `Cửu Long Thần Đỉnh` in `tan_thu_thon`, zone portals from `ZONES_REGISTRY[currentZoneId].portals`, and visible remote players from `RoomWorldSnapshot.players`.
   - Zone title label (`Tân Thủ Thôn` / `Thanh Trúc Lâm`) and live logical tile coordinate readout `(tx, ty)`.
   - Pointer isolation: `pointerdown` / `click` on the minimap container calls `e.stopPropagation()` so interacting with or collapsing the minimap never triggers ground movement (`this.pointerTarget`) in `WorldScene`.
2. **Explicitly Excluded from `VISUAL-03-W` (Deferred to `S4`)**:
   - **NO `startAutoNav(worldX, worldY)` calls**: `WorldScene.ts` does not have an auto-navigation engine in S1.
   - **NO minimap click-to-navigate or breadcrumb path plotting**.
   - **NO auto-quest or secret trigger markers** (`GD-003`, `GD-004`, `GD-015`).

### 5.2 Two-Layer Cached Rendering & Coordinate Math
1. **Static Geography Layer (`StaticMinimapCanvas`, `M_w = 144`, `M_h = 108` CSS px; `192 × 144` internal bitmap)**:
   - Rendered **once** when `buildZoneWorld(zoneId)` runs (`staticCacheRebuilds` increments only on zone change).
   - Color key per tile $(tx, ty)$:
     - Walkable meadow/grass (`Ground` GIDs `1..4`) → `#233b2e`
     - Stone roads, courtyards, Bagua dais & walkable bridges (`Paths` GIDs `5..8, 12, 15..16`) → `#c8be9e`
     - Stream water (`Ground` GIDs `9..10` where `Collision != 0` and not bridge) → `#2b7a9b`
     - Blocked perimeter cliffs & building footprints (`Collision != 0`) → `#161d2b` / `#5c4d3c`
2. **Dynamic Overlay Transform (`MinimapOverlayCanvas`)**:
   $$mx(wx) = \text{clamp}\left(\frac{wx}{\text{worldW}} \times M_w,\; 0,\; M_w\right), \quad my(wy) = \text{clamp}\left(\frac{wy}{\text{worldH}} \times M_h,\; 0,\; M_h\right)$$
   $$rx = \frac{\text{camera.worldView.x}}{\text{worldW}} \times M_w, \quad ry = \frac{\text{camera.worldView.y}}{\text{worldH}} \times M_h, \quad rw = \frac{\text{camera.worldView.width}}{\text{worldW}} \times M_w, \quad rh = \frac{\text{camera.worldView.height}}{\text{worldH}} \times M_h$$

### 5.3 S1 Minimap Marker Legend

| Marker Type | Proven Runtime Data Source | Minimap Visual | S1 Visibility Rule |
|---|---|---|---|
| **Local Player** | `worldScene.localX`, `localY`, `localDir` | Cyan-jade dot (`#63e6be`) + white rim + 4-dir heading tick | Visible whenever `localVisual.sprite.visible === true` |
| **Camera Viewport Bounds** | `cameras.main.worldView` | `1px` gold rectangle (`rgba(255, 212, 82, 0.8)`) | Always visible; reflects adaptive zoom at `720p`/`1080p`/`4K`/mobile |
| **Zone NPCs** | `LEGENDARY_NPCS.filter(n => n.zoneId === currentZoneId)` | Gold pin (`#ffd452`) for Legendary NPCs; warm amber pin (`#ffa94d`) for `merchant_truong` | Always visible for canonical zone NPCs; hover/tap shows `npc.nameVi` |
| **Cauldron Landmark** | `Cửu Long Thần Đỉnh` `(1552, 1008)` | Bronze-gold dot (`#ff922b`) | Visible when `currentZoneId === "tan_thu_thon"` |
| **Zone Portals** | `ZONES_REGISTRY[currentZoneId].portals` | Cyan-azure ring (`#3bc9db`) | Visible for `portal_town_to_forest` / `portal_forest_to_town` |
| **Remote Players** | `worldSnapshot.players` | Sky-blue dot (`#4dabf7`) | Visible for active remote players in the same zone |

---

## 6. Measurable Camera, Occlusion & Minimap Acceptance Tests (`VISUAL-03-Q`)

### 6.1 Adaptive Camera & Multi-Resolution Suite (`CAM-01` .. `CAM-08`)

| Test ID | Verification Target | Deterministic Pass Criterion |
|---|---|---|
| `CAM-01` | **Adaptive Zoom Across `720p`, `1080p`, `4K` & Mobile (No Whole-Map Fit)** | In `tan_thu_thon` (`3072 × 2304`), `computeResponsiveCameraProfile` and live Phaser `camera.worldView` satisfy: at `1280×720` (`zoom = 1.25`, `worldView = 1024×576`), at `1920×1080` (`zoom = 2.0`, `worldView = 960×540`), at `3840×2160` (`zoom = 4.0`, `worldView = 960×540`), and at `390×844` (`zoom = 1.0`, `worldView = 390×844`). At all 4 resolutions, visible map area is `<= 8.33%` of `tan_thu_thon` and `<= 40.91%` of `thanh_truc_lam`. |
| `CAM-02` | **Smooth Follow & Movement Tracking** | Walking from `village_center` `(1552, 1232)` to `merchant_truong` `(1136, 1136)` updates `camera.scrollX` and `camera.scrollY` monotonically while keeping the local player centered within `±64 px` (away from map edges). |
| `CAM-03` | **Four-Edge World Bounds Clamping** | Moving near West (`x = 96`), East (`x = 2976`), North (`y = 96`), and South (`y = 2208`) perimeter bounds clamps `camera.worldView.x >= 0`, `camera.worldView.right <= 3072`, `camera.worldView.y >= 0`, `camera.worldView.bottom <= 2304` with zero out-of-bounds void at `720p`, `1080p`, `4K`, and mobile. |
| `CAM-04` | **Pointer Click-to-Move Accuracy Under Scroll & Zoom** | When `camera.scrollX > 400` and `camera.zoom >= 1.25`, `cameras.main.getWorldPoint(sx, sy)` matches $wx = \text{scrollX} + cw/2 + (sx - cw/2)/z$ within `< 1 px`. |
| `CAM-05` | **HUD & Minimap Pointer Isolation** | Clicking `#hud-top-left`, `#hud-top-right` (minimap), `#hud-bottom-center`, or any open modal does NOT set `worldScene.pointerTarget`. |
| `CAM-06` | **Keyboard Shortcut Preservation** | Pressing `I`, `C`, `M` (`sendClaimMeditation`), `B` (`sendBreakthrough`), `E`, `F`, `J`, `K`, `L`, and `Escape` triggers their exact existing handlers with zero regressions. |
| `CAM-07` | **Live `Scale.RESIZE` Adaptation** | Resizing viewport `1280×720` → `1920×1080` → `3840×2160` → `390×844` dynamically updates `camera.zoom` (`1.25` → `2.0` → `4.0` → `1.0`) and keeps unobstructed playfield `>= 70%`. |
| `CAM-08` | **Two-Way Zone Transition Reset (`tan_thu_thon` ↔ `thanh_truc_lam`)** | Entering `portal_town_to_forest` at `(2768, 1200)` transitions to `thanh_truc_lam` (`bounds = 1408×1024`) centered on `(212, 480)`; returning via `portal_forest_to_town` restores `tan_thu_thon` (`bounds = 3072×2304`) centered on `(2608, 1200)`. |

### 6.2 Multi-District Y-Sort & Occlusion Verification Suite (`OCC-01` .. `OCC-06`)

| Test ID | Verification Target | Deterministic Pass Criterion |
|---|---|---|
| `OCC-01` | **Central Plaza (`Cửu Long Thần Đỉnh` & `Phì Đế`)** | Player south of cauldron (`y = 1056 > 1008`) has `player.sprite.depth > than_dinh.depth`; player north of cauldron (`y = 944 < 1008`) has `player.sprite.depth < than_dinh.depth`. |
| `OCC-02` | **Buildings (`Tân Thủ Từ Đường`, `Tụ Bảo Các`, `Hồng Trần Các`)** | For all 3 village buildings, standing on the walkable tile immediately north of the roof eaves (`y < buildingBaseY`) yields `player.sprite.depth < building.depth` (roof occludes player), while standing on the southern entrance steps (`y > buildingBaseY`) yields `player.sprite.depth > building.depth` (player in front of facade). |
| `OCC-03` | **Trees & Bamboo (`prop_peach_tree`, `prop_bamboo_cluster`)** | All tree and bamboo props have `depthOffset === 0` anchored at trunk base $Y_{\text{base}}$. Standing 1 tile south of any tree trunk (`y = Y_base + 16`) yields `player.sprite.depth > tree.depth` (never occluded by canopy when standing in front); standing 1 tile north of the trunk (`y = Y_base - 32`) yields `player.sprite.depth < tree.depth` (occluded by canopy). |
| `OCC-04` | **Walkable Stream Bridges (West, North & East Bridges)** | Across all walkable bridge tiles on all 3 bridges, `bridge.depth === 6 < player.sprite.depth` (`player.y >= 672`), so bridge planks never render over the player's feet. |
| `OCC-05` | **Southern District Depth Budget (`y = 1744..2208`)** | At `ngoc_tam` (`y = 1744`) and the southern perimeter road (`y = 2208`, `ty = 69`), `player.sprite.depth (2208) < AbovePlayer.depth (4000) < nameLabel.depth (4210..4214) < dmgText.depth (4500) < interactPromptText.depth (4600)`. |
| `OCC-06` | **East Portal Arch & Ring (`prop_portal_arch`, `portal_ring`)** | `portal_ring.depth (6) < player.sprite.depth`, and standing at the portal trigger `(2768, 1200)` (`y = 1200 > archBaseY 1168`) renders the player in front of the arch pillars. |

### 6.3 Essential S1 Minimap Verification Suite (`MM-01` .. `MM-07`)

| Test ID | Verification Target | Deterministic Pass Criterion |
|---|---|---|
| `MM-01` | **Static Geography Cache (`1` Build Per Zone Load)** | `StaticMinimapCanvas` rebuild count equals `1` after entering `tan_thu_thon` and walking 300 frames (`staticCacheRebuilds === 1`). |
| `MM-02` | **Player Marker Affine Accuracy** | At `village_center` `(1552, 1232)`, `merchant_truong` `(1136, 1136)`, `rmt_de` `(2128, 688)`, and `portal_town_to_forest` `(2768, 1200)`, player minimap coordinates $(mx, my)$ match $(wx / 3072 \times M_w,\; wy / 2304 \times M_h)$ within `±1.0 px`. |
| `MM-03` | **Camera Viewport Bounds Synchronization** | Minimap viewport rectangle $(rx, ry, rw, rh)$ matches `camera.worldView` normalized by `(worldW, worldH)` across `1280×720`, `1920×1080`, `3840×2160`, and `390×844`. |
| `MM-04` | **Permitted S1 Landmark Pins** | All 7 `Tân Thủ Thôn` NPCs + `Cửu Long Thần Đỉnh` + `portal_town_to_forest` render at their exact `ZONES_REGISTRY` / `LEGENDARY_NPCS` coordinates. |
| `MM-05` | **Zone Transition Reconfiguration** | Switching to `thanh_truc_lam` updates minimap title to `Thanh Trúc Lâm`, normalizes by `(1408, 1024)`, and plots the 4 `Thanh Trúc Lâm` NPCs and return portal. |
| `MM-06` | **S1 Scope & No Secret Leakage** | Minimap invokes zero `startAutoNav` calls, plots zero unrevealed secret triggers, and swallows pointer clicks without setting `worldScene.pointerTarget`. |
| `MM-07` | **Debug Telemetry Hook (`render_game_to_text`)** | `window.render_game_to_text()` exposes `camera: { zoom, scrollX, scrollY, worldViewW, worldViewH, worldBoundsW, worldBoundsH }` and `minimap: { zoneId, playerNormX, playerNormY, staticCacheRebuilds, markerCount }`. |
