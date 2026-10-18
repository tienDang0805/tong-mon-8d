# VISUAL-03 INTEGRATION PLAN — S1 Core Asset Kit, 96×72 Tân Thủ Thôn & V01-B UI/HUD (`VISUAL-03-P` R1)

- **Document ID**: `IMPL-VISUAL-03-PLAN`
- **Task**: `VISUAL-03-P` (`PLAN_AND_DOCS_ONLY` — Final Corrections Pass)
- **Status**: `READY_FOR_VISUAL_03_W_AUTHORIZATION` (No runtime source, maps, DB, or assets modified)
- **Visual Direction**: `V01-B — THIÊN MỆNH TIÊN CUNG` (Three-Tier Grandeur System; `Tân Thủ Thôn` = Tier I Grounded Starter Village)
- **Companion Technical Contract**: `docs/technical/CAMERA_AND_MINIMAP_CONTRACT.md`
- **Governing Contracts**: `AGENTS.md`, `RULES.md` (Rule 1–6), `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/pipelines/WORLD_SCENE_ASSEMBLY.md`, `docs/pipelines/UX_WORLD_FIRST.md`, `docs/pipelines/ANIMATION_VFX_FEEDBACK.md`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md`

---

## 1. Creative Approval Reconciliation, Evidence Matrix & Guardrails

### 1.1 Reconciliation of `VISUAL-02B` + `VISUAL-02B-CORRECTION` Status with Owner Creative Decision
1. **Owner Production Direction Decision (`VISUAL-01` → `VISUAL-02A` → `VISUAL-02B-CORRECTION` → `VISUAL-03-P`)**:
   - The project owner selected **`V01-B — Thiên Mệnh Tiên Cung`** (`VISUAL-01`), accepted the **`96 × 72` (`3072 × 2304 px`) `Tân Thủ Thôn` blueprint** and **technical production proof** (`VISUAL-02A` / `VISUAL-02A-R1-CLOSE`), and explicitly confirmed in `VISUAL-03-P` Plan Review:
     > *"The VISUAL-02B NPC differentiation is visually acceptable as a production direction."*
   - This includes the differentiated identities for **`phi_de`** (Chubby Bear-Hat Saint Mascot in Luxury White-Jade & Imperial-Gold Robes holding a Boiled Chicken Drumstick `Đùi Gà Luộc`) and **`rmt_de`** (Wealthy `Thần Tài` Merchant Lord in Vermilion-Red & Imperial-Gold Brocade holding `Kim Nguyên Bảo` and `Bàn Tính Hoàng Kim`).
2. **Lifecycle State Reconciliation (`AGENTS.md` §5 & `RULES.md` Rule 6)**:
   - All `307` files (`19` raw AI source sheets) in `VISUAL_02B_S1_CORE_KIT` have passed automated technical verification (`TECHNICALLY_VERIFIED`, `overallTechnicalQa: "PASS"`) and are **Owner-Accepted as the Production Visual Direction** for `VISUAL-03` integration planning.
   - Per `AGENTS.md` Section 5 and `RULES.md` Rule 6, Argon **never autonomously promotes `TECHNICALLY_VERIFIED` candidates to `HUMAN_APPROVED`**. During `VISUAL-03-W` and `VISUAL-03-U`, these assets are integrated into the runtime (`assets/manifest.json` / `assets/provenance.json` tracked as `TECHNICALLY_VERIFIED` production candidates under the accepted direction), and final promotion to **`HUMAN_APPROVED` (`DEC-006` in `AGENTS.md` and `docs/ART_BIBLE.md`)** is recorded only after the owner reviews the live in-engine Phaser 4 screenshots at actual gameplay zoom in `VISUAL-03-Q`.

### 1.2 Proven Existing Source Behavior vs. Proposed `VISUAL-03` Additions vs. Deferred Future APIs

| Subsystem / Feature | Status Classification | Proven Repository Evidence (`HEAD = 51d4caf2ae4ae101e41b0f31192a77feb65`) | `VISUAL-03` Action |
|---|---|---|---|
| **Phaser Canvas & Scaling** | **EXISTING (Proven)** | `apps/client/src/main.ts` lines 61–74: `Phaser.Scale.RESIZE`, `pixelArt: true`, `roundPixels: true`. | Keep `Scale.RESIZE`, `pixelArt: true`, `roundPixels: true`; add `CameraView.computeResponsiveCameraProfile` so `720p`/`1080p`/`4K` viewports never expose the whole map. |
| **Camera Bounds & Follow** | **EXISTING (Proven)** | `apps/client/src/WorldScene.ts` lines 547–550 & 721: `cameras.main.setBounds(0, 0, worldW, worldH)` and `startFollow(this.localVisual.sprite, true, 0.14, 0.14)`. | Encapsulate in `CameraView.ts` with torso offset `(0, -24)`, immediate `centerOn` snap on spawn/zone switch, and adaptive zoom on resize. |
| **Direct Ground Click-to-Move** | **EXISTING (Proven)** | `apps/client/src/WorldScene.ts` lines 302–307 & 1029–1048: `this.pointerTarget = { x: worldPt.x, y: worldPt.y }` steps linearly toward cursor click. | Keep existing `pointerTarget` ground walk; isolate HUD/minimap pointer events via `e.stopPropagation()`. |
| **Auto-Navigation (`startAutoNav`, `autoNavTarget`)** | **DEFERRED (`S4` — NOT in Repo)** | Specified in `docs/systems/QUEST_ENGINE.md` (`TD-03`) for Slice 4 (`S4`). **Does NOT exist** anywhere in `apps/client/src/**` or `apps/server/src/**`. | **Do NOT assume `startAutoNav` exists and do NOT implement S4 auto-navigation or auto-questing in `VISUAL-03`.** |
| **Minimap (`MinimapView`)** | **PROPOSED (`VISUAL-03-W`)** | Currently absent from `apps/client/src/hud.ts` (`#hud-top-right` only holds `.hud-pill` buttons on lines 59–65). | Implement essential S1 read-only `MinimapView.ts` with static cached zone geography + dynamic player, viewport bounds & canonical NPC/portal/cauldron markers. |
| **Global Keyboard Shortcuts** | **EXISTING (Proven)** | `WorldScene.ts` lines 169–300 (`WASD`/Arrows, `J`, `K`, `L`, `E`, `F`); `hud.ts` lines 173–197 (`Escape`, `I`, `C`, `M` = `sendClaimMeditation()`, `B` = `sendBreakthrough()`). | **Preserve 100% of existing shortcuts unchanged.** Do not remap `M` or prohibit a future optional map UI. |
| **Tilemap & Prop Depth / Y-Sort** | **EXISTING (With Proven Defects on `96×72`)** | `WorldScene.ts` line 473 (`AbovePlayer` depth `2200` < southern `y = 2304`), lines 569–572 (`prop_peach_tree` `depthOffset = 40`), lines 644–668 (`nameLabel` `depth = y + 121`). | Enforce 12-stratum depth budget (`CAMERA_AND_MINIMAP_CONTRACT.md` §4.2): bridges at `depth = 6`, vertical props anchored at southern collision base $Y_{\text{base}}$ with `depthOffset = 0`, `AbovePlayer = 4000`, nameplates at `4100+`. |
| **Persisted Coordinate Load on Join** | **EXISTING (Partial Guard Proven)** | `apps/server/src/zoneRoom.ts` lines 488–494 (v0.1) & lines 643–659 (v0.2 `spawnOrSyncConfirmedCharacterV02`) check `!this.engine.isWalkable(this.zoneId, x, y)` and fall back to `zoneDef.defaultSpawn`. | Upgrade to non-destructive `resolveSafeZoneCoordinates` (`Section 3.4`): map exact legacy `40×30` spawn constants, nudge blocked coordinates via nearest-walkable-tile ring search (`1..6` tiles) before falling back to `defaultSpawn`, and emit a non-silent system notice. |
| **Debug Teleport (`teleportLocal`)** | **EXISTING (Linear Stepper Proven)** | `WorldScene.ts` lines 1178–1192 steps in a straight line of `<= 28 px` increments, which gets blocked by streams on `96×72`. | Upgrade `teleportLocal(x, y)` to step along the 4-neighbor BFS shortest path over `this.collisionGrid`. |
| **NPC Shop & Culinary Rules** | **EXISTING (Proven)** | `apps/server/src/worldEngine.ts` lines 513–640 (`handleShopBuy` checks `dist <= 160` to `merchant_truong` on line 526; `handleCookRecipe` validates recipe ingredients). | Keep server rules 100% untouched; separate client UI so `Lão Trù Trương` shop opens via world-anchored NPC interaction while `[I]` holds Inventory & Culinary tabs. |

---

## 2. Source-Grounded Asset Readiness & Canonical Sprite Identity Mapping

### 2.1 Batch A — `V01-B` UI Core System (`batch_a_ui_core/` → `assets/ui/v01b/` & `assets/icons/v01b/`)

All Batch A UI frames, buttons, sockets, gauges, and icons are 100% text-free RGBA PNGs (`textFreeRasterVerified: true`, `maxCornerPixelDiffAcrossAllTestedSizes: 0`).

| Asset Family | Source Kit Path (`VISUAL_02B_S1_CORE_KIT/batch_a_ui_core/...`) | Target Runtime Path (`assets/...` & `apps/client/public/assets/...`) | Canonical Consumer / Binding |
|---|---|---|---|
| **9-Slice Frames (6)** | `frames_9slice/panel_tier1_grounded_wood_jade_9slice.png` (`312×180`, border `28px`) | `/assets/ui/v01b/frames/panel_tier1_grounded_wood_jade_9slice.png` | Grounded `Phàm Nhân` starter village modals (`#inventory-modal`, `#npc-dialogue-modal` for `merchant_truong`) |
| | `frames_9slice/panel_tier2_celestial_navy_jade_9slice.png` (`312×180`, border `28px`) | `/assets/ui/v01b/frames/panel_tier2_celestial_navy_jade_9slice.png` | Character Creation (`#cc-draft-section`, `#cc-rolled-section`) & `[C]` Character/Cultivation Panel (`#cultivation-modal`) |
| | `frames_9slice/panel_tier2_celestial_ivory_scroll_9slice.png` (`312×180`, border `28px`) | `/assets/ui/v01b/frames/panel_tier2_celestial_ivory_scroll_9slice.png` | NPC Dialogue speech scroll & item inspection sub-panel |
| | `frames_9slice/panel_tier3_supreme_dragon_gold_9slice.png` (`312×180`, border `28px`) | `/assets/ui/v01b/frames/panel_tier3_supreme_dragon_gold_9slice.png` | `Thần Phẩm` Destiny highlight / Legendary Elder (`Tam Đế`) decree header & ceremony banner |
| | `frames_9slice/panel_quest_tracker_scroll_9slice.png` (`240×310`, border `24px`) | `/assets/ui/v01b/frames/panel_quest_tracker_scroll_9slice.png` | Compact right-side Quest Tracker scroll |
| | `frames_9slice/panel_tooltip_callout_9slice.png` (`240×150`, border `20px`) | `/assets/ui/v01b/frames/panel_tooltip_callout_9slice.png` | Item, Destiny, and Attribute hover/tap tooltips |
| **HUD Chrome (8)** | `hud_chrome/hud_top_left_crest_frame.png` (`420×160`) | `/assets/ui/v01b/hud/hud_top_left_crest_frame.png` | `#hud-top-left` player status crest & portrait socket |
| | `hud_chrome/hud_minimap_astrolabe_ring.png` (`240×240`) | `/assets/ui/v01b/hud/hud_minimap_astrolabe_ring.png` | `#hud-top-right` `MinimapView` astrolabe frame (`CAMERA_AND_MINIMAP_CONTRACT.md` §5) |
| | `hud_chrome/hud_skillbar_lotus_dock.png` (`560×110`) | `/assets/ui/v01b/hud/hud_skillbar_lotus_dock.png` | `#hud-bottom-center` 6-slot action/skill dock |
| | `hud_chrome/bar_hp_ruby.png`, `bar_linh_luc_azure.png`, `bar_tu_vi_cyan_gold.png`, `bar_exp_silver_gold.png`, `orb_dantian_star_core.png` | `/assets/ui/v01b/hud/bar_*.png`, `orb_dantian_star_core.png` | Separate HP (`Khí Huyết`), MP (`Linh Lực`), `Tu Vi`, and Character `EXP` bars (`GD-020`–`GD-022`) |
| **Buttons, Tabs & Seals (15)** | `buttons_and_tabs/btn_jade_gold_{default,hover,pressed,disabled}.png`, `btn_cinnabar_{default,hover,pressed,disabled}.png`, `btn_plus_alloc_{ready,disabled}.png`, `seal_dao_{gold_lotus,cinnabar}.png`, `tab_header_{active_gold_jade,inactive_wood_jade,hover_azure_jade}.png` | `/assets/ui/v01b/controls/*.png` | All `.hud-btn`, `.btn-allocate-attr`, `.cc-btn-lg`, and modal filter tabs |
| **Character Creation & `[C]` Panel Chrome (15)** | `character_creation_and_c_panel/cc_appearance_card_{selected,unselected}.png`, `cc_name_scroll_input_frame.png`, `cc_pedestal_lotus_dais.png`, `destiny_card_{pham,hoang,tien,than}.png`, `socket_destiny_tien_thien_locked.png`, `socket_destiny_hau_thien_{equippable,active}.png` | `/assets/ui/v01b/character/*.png` | `CharacterCreationOverlayController` (`apps/client/src/characterCreation.ts`) & `CharacterPanel` (`apps/client/src/features/character/CharacterPanel.ts`) |
| **Item Rarity Slots (6)** | `slots_and_rarity_frames/slot_item_{pham,linh,hoang,dia,thien,than}_64.png` | `/assets/ui/v01b/slots/slot_item_*_64.png` | 6 canonical item/technique rarity borders (`GD-032`: `Phàm`, `Linh`, `Hoàng`, `Địa`, `Thiên`, `Thần`) |
| **Quest & Prompt Markers (6)** | `quest_and_prompts/interact_prompt_pill_{gold_jade,azure_jade}.png`, `quest_marker_{available_excl,active_question,turnin_seal}.png`, `quest_nav_waypoint_star.png` | `/assets/ui/v01b/prompts/*.png` | In-world contextual `[E]`/`[F]` prompt & NPC quest markers (`quest_nav_waypoint_star.png` staged for future `S4`) |
| **6 Origin Attribute Icons (`32×32` & `64×64`)** | `icons_{32x32,64x64}/attr_{the_phach,luc_dao,linh_tinh,than_phap,than_thuc,ngo_tinh}_{32,64}.png` | `/assets/icons/v01b/attr_*_{32,64}.png` | Exact `BASE_ATTRIBUTE_KEYS` (`the_phach`, `luc_dao`, `linh_tinh`, `than_phap`, `than_thuc`, `ngo_tinh`) in `[C]` panel |
| **11 Canonical `ITEMS_REGISTRY` Icons (`32×32` & `64×64`)** | `icons_{32x32,64x64}/item_{mi_linh_thach_thanh_truc,banh_bao_linh_thu,canh_truc_lang_linh_thao,tra_thanh_tam_tinh_khi,tu_khi_dan_so_cap,bot_linh_mach,thanh_tam_thao,thit_truc_lang,nanh_truc_lang,vay_thanh_lan,thanh_van_kiem_so_cap}_{32,64}.png` | `/assets/icons/v01b/item_*_{32,64}.png` | 1:1 coverage of all 11 items in `ITEMS_REGISTRY` (`packages/game-data/src/index.ts` lines 282–423) |

#### Deterministic Icon Resolution for All 16 Traits in `S1E_STARTER_DESTINY_CATALOG`
In `packages/game-data/src/catalogs/destinies.ts` (lines 98–316), `S1E_STARTER_DESTINY_CATALOG` defines 16 starter destiny traits across the 4 canonical rarities (`pham`, `hoang`, `tien`, `than`). Each trait card is framed by its rarity border (`destiny_card_{pham,hoang,tien,than}.png`) and resolves its `64×64` emblem icon deterministically:
- **5 Dedicated Destiny Emblem Icons**:
  - `van_vi_dao_thai` (`Thần Phẩm` Signature — `phi_de`) → `destiny_van_vi_dao_thai_64.png`
  - `thai_hu_than_niem` (`Tiên Phẩm`) → `destiny_thai_hu_than_niem_64.png`
  - `minh_khong_ngo_dao` (`Tiên Phẩm`) → `destiny_minh_khong_ngo_dao_64.png`
  - `kim_cang_can_cot` (`Hoàng Phẩm`) → `destiny_kim_cang_can_cot_64.png`
  - `thach_cot_so_sinh` (`Phàm Phẩm`) → `destiny_thach_cot_so_sinh_64.png`
- **11 Remaining Starter Catalog Traits (Mapped to Primary Attribute / Core Emblem + Rarity Frame)**:
  - `man_luc_so_khai` (`Phàm` • `luc_dao +1`) & `ho_tieu_chien_mach` (`Hoàng` • `luc_dao +2`) → `attr_luc_dao_64.png`
  - `linh_tuc_so_sinh` (`Phàm` • `linh_tinh +1`) & `thanh_linh_chi_mach` (`Hoàng` • `linh_tinh +2`) → `attr_linh_tinh_64.png`
  - `khinh_than_so_hoc` (`Phàm` • `than_phap +1`) & `luu_anh_linh_bo` (`Hoàng` • `than_phap +2`) → `attr_than_phap_64.png`
  - `tinh_tam_ngung_than` (`Phàm` • `than_thuc +1`) → `attr_than_thuc_64.png`
  - `nhat_niem_khai_ngo` (`Phàm` • `ngo_tinh +1`) → `attr_ngo_tinh_64.png`
  - `hon_nguyen_dao_cot` (`Tiên` • `the_phach +2, linh_tinh +2`) → `attr_the_phach_64.png`
  - `luc_hop_linh_cot` (`Thần` • all 6 attributes `+1`) → `orb_tu_vi_core_64.png`
  - `huyen_anh_dao_thai` (`Thần` Signature — `dam_lon_tien_tu`) → `destiny_thai_hu_than_niem_64.png`

---

### 2.2 Batch B & Batch C — Canonical Sprite & Portrait Identity Mapping (`ngoc_tam` vs `npc_ngoc_tam`, and `thai_tai`)

#### A. Explicit De-Collision & De-Aliasing Rules (Preserving Canonical IDs & Gameplay Semantics)
1. **Separating Starter Appearance #3 (`ngoc_tam`) from Town Legendary NPC #6 (`npc_ngoc_tam`)**:
   - **Proven Existing Collision**:
     - In `packages/shared/src/index.ts` and `apps/server/src/characterV02Actions.ts`, `APPROVED_CHARACTER_V02_APPEARANCES` is `["hero_kiem_tu", "hoa_tran", "ngoc_tam", "anh_7"]`. Starter Appearance #3 (`Thanh Ngọc Linh Tu`) uses `appearanceId: "ngoc_tam"`.
     - In `packages/game-data/src/index.ts` (lines 151–164), Legendary NPC #6 (`Xui Xẻo Chân Quân — Ngọc Tâm`) has `id: "ngoc_tam"`, `spriteKey: "ngoc_tam"`, and `portraitKey: "portrait_ngoc_tam"`.
   - **Non-Breaking Visual Separation**:
     - **Canonical Gameplay IDs Preserved**: `APPROVED_CHARACTER_V02_APPEARANCES` keeps `"ngoc_tam"`, and `LEGENDARY_NPCS[5]` keeps `id: "ngoc_tam"`. Zero database rows, quest references, or shared protocol types change.
     - **Distinct Visual Keys**:
       - **Starter Appearance #3 (`Thanh Ngọc Linh Tu`)**: Keeps `spriteKey: "ngoc_tam"` → `assets/sprites/ngoc_tam.png` (`480×768` 4-direction `locomotion_80x96_8row` scholar sheet) and uses `portrait_starter_ngoc_tam.png` (`assets/portraits/portrait_starter_ngoc_tam.png`, `160×160`) in Character Creation and HUD player portrait.
       - **Legendary NPC #6 (`Xui Xẻo Chân Quân — Ngọc Tâm`)**: Updates `LEGENDARY_NPCS[5].spriteKey` in `packages/game-data/src/index.ts` to **`"npc_ngoc_tam"`** → `assets/sprites/npc_ngoc_tam.png` (`320×96` 4-frame `stationary_npc_80x96_4f` jinxed-cultivator strip) and `portraitKey: "portrait_ngoc_tam"` → `assets/portraits/portrait_ngoc_tam.png` (`160×160`).
     - **Debug Hook Compatibility (`WorldScene.ts` lines 1193–1204)**:
       - `setNpcAnim(npcId, state, dir)` looks up `const npc = LEGENDARY_NPCS.find(n => n.id === npcId)` and plays `${npc.spriteKey}_${state}_${dir}`. Thus `setNpcAnim("ngoc_tam", "idle", "down")` plays `npc_ngoc_tam_idle_down` on the town NPC without affecting any player whose `appearanceId` is `"ngoc_tam"`.
2. **De-Aliasing Legendary NPC #7 (`thai_tai` — `Thái Tài • Thiên Nhãn Giám Bảo`)**:
   - **Proven Existing Alias**: In `packages/game-data/src/index.ts` (lines 166–179), `LEGENDARY_NPCS[6]` (`id: "thai_tai"`) currently aliases `spriteKey: "hoa_tran"` and `portraitKey: "portrait_hoa_tran"`.
   - **Dedicated Visual Binding**: Update `LEGENDARY_NPCS[6]` to **`spriteKey: "thai_tai"`** (`assets/sprites/thai_tai.png`, `320×96` 4-frame `stationary_npc_80x96_4f` strip) and **`portraitKey: "portrait_thai_tai"`** (`assets/portraits/portrait_thai_tai.png`, `160×160`) while keeping `id: "thai_tai"` and all lore/dialogue fields untouched.

#### B. Complete Character, Creature & NPC Sprite Mapping Table

| Canonical ID | Role in S1 | Visual `spriteKey` | Target Runtime Sheet (`assets/sprites/...`) | Sheet Size (`cols × rows` @ `80×96`) | Portrait File (`assets/portraits/...`) | Notes |
|---|---|---|---|---|---|---|
| `hero_kiem_tu` | Starter Appearance #1 (`Thanh Vân Đạo Đồ`) & `gia_bao` fallback | `"hero_kiem_tu"` | `assets/sprites/hero_kiem_tu.png` | `480×1920` (`6×20`: full 4-dir `idle`, `walk`, `attack`, `cast`, `hurt`) | `portrait_hero_kiem_tu.png` | Full 20-row humanoid contract (`FootDeltaY = 0` at `Y = 87`) |
| `hoa_tran` | Starter Appearance #2 (`Thanh Phong Hành Giả`) & `Thanh Trúc Lâm` NPC `Hòa Trần` | `"hoa_tran"` | `assets/sprites/hoa_tran.png` | `480×768` (`6×8`: 4-dir `idle` rows `0..3` + `walk` rows `4..7`) | `portrait_hoa_tran.png` | `locomotion_80x96_8row` profile |
| `ngoc_tam` (Starter #3) | Starter Appearance #3 (`Thanh Ngọc Linh Tu`) | `"ngoc_tam"` | `assets/sprites/ngoc_tam.png` | `480×768` (`6×8`: 4-dir `idle` rows `0..3` + `walk` rows `4..7`) | `portrait_starter_ngoc_tam.png` | `locomotion_80x96_8row` profile for players with `appearanceId === "ngoc_tam"` |
| `anh_7` | Starter Appearance #4 (`Huyền Kiếm Du Hiệp`) & `Thanh Trúc Lâm` NPC `Anh 7` | `"anh_7"` | `assets/sprites/anh_7.png` | `480×768` (`6×8`: 4-dir `idle` rows `0..3` + `walk` rows `4..7`) | `portrait_anh_7.png` | `locomotion_80x96_8row` profile |
| `chatdvt` | Legendary NPC #4 (`Hộ Pháp Linh Thú • Linh Thú Thanh Ngọc`) | `"chatdvt"` | `assets/sprites/chatdvt.png` | `480×768` (`6×8`: 4-dir quadruped `idle` + `walk`) | `portrait_chatdvt.png` | **Strictly four-legged quadruped beast** (`RULES.md` Rule 2) |
| `phi_de` | Legendary NPC #1 (`Phì Đế — Đặng Văn Tiến`, `Tân Thủ Thôn`) | `"phi_de"` | `assets/sprites/phi_de.png` | `320×96` (`4×1`: 4-frame `80×96` idle strip) | `portrait_phi_de.png` | **Chubby bear-hat saint mascot in luxury white-jade/gold robes holding `Đùi Gà Luộc`** |
| `rmt_de` | Legendary NPC #2 (`RMT Đế — Phạm Phan Trọng Khải`, `Tân Thủ Thôn`) | `"rmt_de"` | `assets/sprites/rmt_de.png` | `320×96` (`4×1`: 4-frame `80×96` idle strip) | `portrait_rmt_de.png` | **Wealthy `Thần Tài` merchant lord in winged red-gold hat & crimson-gold brocade** |
| `merchant_truong` | Specialist Culinary NPC (`Lão Trù Trương`, `Tân Thủ Thôn`) | `"merchant_truong"` | `assets/sprites/merchant_truong.png` | `320×96` (`4×1`: 4-frame `80×96` idle strip) | `portrait_merchant_truong.png` | Elderly spiritual noodle chef (`Trúc Cơ Hậu Kỳ`) |
| `dam_lon_tien_tu` | Legendary NPC #5 (`Dẩm Lồn Tiên Tử`, `Tân Thủ Thôn`, `realmId: "UNKNOWN"`) | `"dam_lon_tien_tu"` | `assets/sprites/dam_lon_tien_tu.png` | `320×96` (`4×1`: 4-frame `80×96` idle strip) | `portrait_dam_lon_tien_tu.png` | Realm badge remains `"UNKNOWN"` (`Bất Minh`) |
| `ngoc_tam` (Town NPC #6) | Legendary NPC #6 (`Xui Xẻo Chân Quân — Ngọc Tâm`, `Tân Thủ Thôn`) | **`"npc_ngoc_tam"`** | `assets/sprites/npc_ngoc_tam.png` | `320×96` (`4×1`: 4-frame `80×96` idle strip) | `portrait_ngoc_tam.png` | Distinct `spriteKey: "npc_ngoc_tam"` on `LEGENDARY_NPCS[5]`; canonical `id: "ngoc_tam"` preserved |
| `thai_tai` | Legendary NPC #7 (`Thái Tài — Thiên Nhãn Giám Bảo`, `Tân Thủ Thôn`) | **`"thai_tai"`** | `assets/sprites/thai_tai.png` | `320×96` (`4×1`: 4-frame `80×96` idle strip) | `portrait_thai_tai.png` | Dedicated `spriteKey: "thai_tai"` & `portraitKey: "portrait_thai_tai"` on `LEGENDARY_NPCS[6]` |

#### C. Multi-Format Spritesheet Registration in `WorldScene.ts` and `verify_manifest.ts`
In `VISUAL-03-W`, `WorldScene.ts` and `packages/art-tools/verify_manifest.ts` classify sprite sheets into four explicit layout profiles:
1. **`full_80x96_20row` (`480×1920`, `6 cols × 20 rows`)**: `hero_kiem_tu` — rows `0..3` `idle` (4f), rows `4..7` `walk` (6f), rows `8..11` `attack` (4f), rows `12..15` `cast` (4f), rows `16..19` `hurt` (4f).
2. **`locomotion_80x96_8row` (`480×768`, `6 cols × 8 rows`)**: `hoa_tran`, `ngoc_tam`, `anh_7`, `chatdvt` — rows `0..3` `idle` (4f across `down/left/right/up`), rows `4..7` `walk` (6f across `down/left/right/up`). For `attack`, `cast`, and `hurt` animation keys (`${sk}_attack_${dir}`, etc.), register frames from the matching directional `walk`/`idle` row (`row = 4 + DIR_INDEX[dir]`) so pressing `[J]`/`[K]` or `setNpcAnim` plays a valid directional pose with `combat_vfx` until `S3` combat sheets are produced.
3. **`stationary_npc_80x96_4f` (`320×96`, `4 cols × 1 row`)**: `phi_de`, `rmt_de`, `merchant_truong`, `dam_lon_tien_tu`, `npc_ngoc_tam`, `thai_tai` — 4 unique `80×96` frames `[0, 1, 2, 3]` registered across `${sk}_{idle|walk|attack|cast|hurt}_{down|left|right/up}` so all `WorldScene` animation calls and `runPlaytest.ts` debug hooks execute with zero missing-frame warnings.
4. **`legacy_48x64_16row` (`288×1024`, `6 cols × 16 rows`)**: Preserved for `Thanh Trúc Lâm` monsters (`truc_lang`, `thanh_lan_xa`) and `vaal_de` (`RULES.md` Rule 5).

---

## 3. Modular World, `96 × 72` Tiled Migration & Safe Coordinate Resolution Plan

### 3.1 Tiled Map Contract (`maps/tan_thu_thon.tmj`)
- **Grid Dimensions**: `width: 96`, `height: 72`, `tilewidth: 32`, `tileheight: 32` (`3072 × 2304` logical world pixels).
- **Tileset Binding**:
  - Runtime tileset copied from `batch_c_tan_thu_thon_modular_world/tilesets/tan_thu_thon_v01b_tileset_32x32.png` (`256 × 192 px`, `8 columns × 6 rows = 48 tiles` of `32 × 32 px`) to `assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png` (and mirrored to `apps/client/public/assets/tilesets/`).
  - Legacy `assets/tilesets/bat_hoang_tileset.png` (`512 × 256 px`) is **preserved untouched** for `maps/thanh_truc_lam.tmj`.
- **Required Tiled Layers (Preserving `verify_manifest.ts` Line 93 Contract)**:
  1. `Ground` (`tilelayer`, `96×72`, depth `1`): Base meadow grass (`GID 1..4`), water channels (`GID 9..10`), perimeter cliff base (`GID 13..14`).
  2. `Paths` (`tilelayer`, `96×72`, depth `2`): Mossy flagstone roads (`GID 5`), courtyard cobblestones (`GID 6`), central white-jade & brass Bagua dais (`GID 7`), stone steps (`GID 8`), walkable bridge timber planks (`GID 12`), compacted earth footpaths (`GID 15`), and East Portal teleport array stone (`GID 16`).
  3. `GroundDetails` (`tilelayer`, `96×72`, depth `3`): Grass-to-flagstone autotile transitions (`GID 17..36`) and mossy stone stream bank edges (`GID 37..48`).
  4. `Collision` (`tilelayer`, `96×72`, depth `4`, `visible: false` in client): Exact `6,912`-cell walkability matrix from `VISUAL_02A_PROOF/r1_expanded_map_96x72/tan_thu_thon_96x72_collision_and_bfs.json` (`5,357` walkable `0` cells = `77.5%`, `1,555` blocked non-zero cells = `22.5%`).
  5. `Interactables` (`tilelayer`, `96×72`, depth `5`): Interactive altar/stall floor markers.
  6. `AbovePlayer` (`tilelayer`, `96×72`, depth `4000`): Overhead canopy/roof tiles.
  7. `Portals` (`objectgroup` / `tilelayer`): Portal metadata layer required by `verify_manifest.ts`.

### 3.2 Canonical Coordinate Migration Table (`packages/game-data/src/index.ts`)

All coordinates below come from the BFS-verified `VISUAL-02A-R1-CLOSE` layout specification (`tan_thu_thon_96x72_layout_spec.json`), where every target is proven reachable from `village_center` `(48, 38)` via 4-neighbor BFS:

| Registry Entry | Field in `packages/game-data/src/index.ts` | Legacy `40×30` `(x, y)` px | New `96×72` Tile `(tx, ty)` | New `96×72` World `(x, y)` px | BFS Path from `village_center` |
|---|---|---:|---:|---:|---|
| **`ZONES_REGISTRY.tan_thu_thon`** | `widthTiles × heightTiles` | `40 × 30` | `96 × 72` | `3072 × 2304` | `5,357` walkable tiles (`77.5%`) |
| `defaultSpawn` (`village_center`) | `tan_thu_thon.defaultSpawn` & `spawns.village_center` | `(640, 512)` | `(48, 38)` | **`(1552, 1232)`** | Origin (`0` tiles) |
| `from_thanh_truc_lam` | `tan_thu_thon.spawns.from_thanh_truc_lam` | `(1036, 480)` | `(81, 37)` | **`(2608, 1200)`** | `34` tiles (`1088 px`, via East Bridge) |
| `portal_town_to_forest` | `tan_thu_thon.portals[0].x, y` | `(1120, 480)` | `(86, 37)` | **`(2768, 1200)`** | `39` tiles (`1248 px`, `radiusPx: 92`) |
| **`portal_forest_to_town` Return Target** | **`thanh_truc_lam.portals[0].targetX, targetY`** | **`(1036, 480)`** | **`(81, 37)`** | **`(2608, 1200)`** | **Matches `from_thanh_truc_lam` so returning from forest lands at East Portal pad** |
| **NPC #1: `phi_de`** | `LEGENDARY_NPCS[0]` (`spawnX, spawnY`) | `(536, 368)` | `(46, 33)` | **`(1488, 1072)`** | `7` tiles (`224 px`, Central Plaza beside `Cửu Long Thần Đỉnh`) |
| **NPC #2: `chatdvt`** | `LEGENDARY_NPCS[3]` (`spawnX, spawnY`) | `(668, 404)` | `(51, 34)` | **`(1648, 1104)`** | `7` tiles (`224 px`, Central Plaza east of `Phì Đế`) |
| **NPC #3: `merchant_truong`** | `LEGENDARY_NPCS[10]` (`spawnX, spawnY`) | `(384, 392)` | `(35, 35)` | **`(1136, 1136)`** | `16` tiles (`512 px`, Culinary Street beside `Quán Mì Linh Thiện`) |
| **NPC #4: `rmt_de`** | `LEGENDARY_NPCS[1]` (`spawnX, spawnY`) | `(816, 296)` | `(66, 21)` | **`(2128, 688)`** | `35` tiles (`1120 px`, Northeast `Tụ Bảo Các` Ward via East/North Bridge) |
| **NPC #5: `thai_tai`** | `LEGENDARY_NPCS[6]` (`spawnX, spawnY`, `spriteKey: "thai_tai"`) | `(832, 608)` | `(74, 22)` | **`(2384, 720)`** | `42` tiles (`1344 px`, Northeast `Tụ Bảo Các` Ward) |
| **NPC #6: `dam_lon_tien_tu`** | `LEGENDARY_NPCS[4]` (`spawnX, spawnY`) | `(256, 336)` | `(18, 23)` | **`(592, 752)`** | `45` tiles (`1440 px`, Northwest Peach Garden via West Creek Bridge) |
| **NPC #7: `ngoc_tam`** | `LEGENDARY_NPCS[5]` (`spawnX, spawnY`, `spriteKey: "npc_ngoc_tam"`) | `(256, 640)` | `(20, 54)` | **`(656, 1744)`** | `44` tiles (`1408 px`, Southwest Courtyard via West Creek Bridge) |

> **Canonical Naming Guardrail**: Descriptive district labels from the layout blueprint (`Quảng Trường Đỉnh Linh`, `Phố Linh Trù`, `Hồng Trần Đào Viên`, `Nhân Quả Hạng`, `Tân Thủ Từ Đường`, `Hồng Trần Các`) remain internal layout references. Runtime UI and `ZONES_REGISTRY` preserve the canonical zone name **`Tân Thủ Thôn`** and canonical landmark names (**`Cửu Long Thần Đỉnh`**, **`Quán Mì Linh Thiện`**, **`Tụ Bảo Các`**, **`Truyền Tống Trận → Thanh Trúc Lâm`**).

### 3.3 Standalone World Landmarks, Bridges & Y-Sort Baseline Placement
Per `docs/technical/CAMERA_AND_MINIMAP_CONTRACT.md` Section 4.2, all 16 standalone RGBA props from `batch_c_tan_thu_thon_modular_world/buildings_and_landmarks/` are placed in `tan_thu_thon` with strict separation between **Surface Deck Strata (`depth = 6`)** and **Vertical Y-Sorted Props (`depth = baseContactY`, `depthOffset = 0`)**:
1. **Walkable Stream Bridges (`depth = 6`, Surface Deck Stratum — Never Y-Sorted Against Actors)**:
   - `prop_bridge_horizontal` / `prop_arched_bridge` at West Creek `(848, 1168)` (`tx=24..29, ty=35..38`), North Stream `(1840, 720)` (`tx=55..60, ty=21..24`), and East Stream `(1840, 1168)` (`tx=55..60, ty=35..38`).
2. **Vertical Architecture & Interactive Landmarks (Anchored at Southern Edge of Blocked Collision Footprint $Y_{\text{base}} = (ty_{\text{blocked\_south}} + 1) \times 32$, `depthOffset = 0`)**:
   - `building_tan_thu_tu_duong`: blocked footprint `tx=44..51, ty=20..22` → southern base $Y_{\text{base}} = 23 \times 32 = 736$, placed at `(1536, 736)`, `depth = 736`.
   - `prop_than_dinh` (`Cửu Long Thần Đỉnh`): blocked footprint `tx=47..48, ty=30..31` → southern base $Y_{\text{base}} = 32 \times 32 = 1024$, placed at `(1536, 1024)`, `depth = 1024` + `phi_de_blessing` steam/fire VFX (`depth = 1048`).
   - `prop_noodle_stall` (`Quán Mì Linh Thiện`): blocked footprint `tx=31..34, ty=32..33` → southern base $Y_{\text{base}} = 34 \times 32 = 1088$, placed at `(1056, 1088)`, `depth = 1088`.
   - `building_tu_bao_cac` (`Tụ Bảo Các`): blocked footprint `tx=67..73, ty=14..16` → southern base $Y_{\text{base}} = 17 \times 32 = 544$, placed at `(2240, 544)`, `depth = 544`.
   - `building_hong_tran_cac`: blocked footprint `tx=16..20, ty=16..18` → southern base $Y_{\text{base}} = 19 \times 32 = 608$, placed at `(592, 608)`, `depth = 608`.
   - `prop_portal_arch` (`Truyền Tống Trận`): blocked pillars `tx=85..86, ty=34` → southern base $Y_{\text{base}} = 35 \times 32 = 1120$, placed at `(2768, 1120)`, `depth = 1120` + `portal_ring` floor spin at `(2768, 1200)`, `depth = 6`.
3. **Trees, Bamboo & Courtyard Props (`depthOffset = 0` at Trunk/Base Contact Line $Y_{\text{base}}$)**:
   - `prop_peach_tree`, `prop_bamboo_cluster`, `prop_stone_lantern`, `prop_village_stele`, `prop_incense_brazier`, `prop_jade_rock`, `prop_wooden_fence`, and `prop_spirit_herb` are placed with `depthOffset = 0` at their base contact line so standing south of any trunk (`y > Y_base`) always renders the player in front of the tree, and walking north (`y < Y_base`) renders the player behind the canopy (`OCC-03`).

### 3.4 Safe, Non-Destructive Strategy for Persisted Player Coordinates (`40×30` → `96×72`)

To protect existing persisted characters in PostgreSQL / PGlite (`characters` and `character_v02` tables) without destructive DB operations or silent mass relocation:
1. **Strict Prohibition on Bulk / Destructive DB Operations**:
   - Do **NOT** execute any startup SQL `UPDATE`, `DELETE`, or schema migration across stored character rows. `apps/server/src/characterV02Repository.ts` and `apps/server/src/characterV02Actions.ts` remain untouched.
2. **Per-Character On-Join Coordinate Resolution (`worldEngine.resolveSafeZoneCoordinates(zoneId, x, y)`)**:
   When a single character joins a `ZoneRoom` session (`onJoin` or `spawnOrSyncConfirmedCharacterV02` in `apps/server/src/zoneRoom.ts`), `worldEngine.resolveSafeZoneCoordinates(zoneId, x, y)` evaluates their persisted `(x, y)` in four ordered, non-destructive steps:
   - **Step A — Semantic Mapping of Exact Legacy `40×30` Named Spawn Constants (Only in `tan_thu_thon`)**:
     - If `zoneId === "tan_thu_thon"` and `(x, y)` equals the exact legacy `40×30` `village_center` spawn `(640, 512)` (which lands inside the blocked footprint `tx=20, ty=16` of `building_hong_tran_cac` on the `96×72` map), map it to the new `village_center` `(1552, 1232)` (`reason: "LEGACY_DEFAULT_SPAWN_MAPPED"`).
     - If `zoneId === "tan_thu_thon"` and `(x, y)` equals the exact legacy `40×30` `from_thanh_truc_lam` return spawn `(1036, 480)`, map it to the new `from_thanh_truc_lam` `(2608, 1200)` (`reason: "LEGACY_PORTAL_SPAWN_MAPPED"`).
   - **Step B — Preserve All Walkable In-Bounds Coordinates As-Is**:
     - For any other persisted `(x, y)` within `[0..worldW, 0..worldH)` where `this.isWalkable(zoneId, x, y)` is `true`, **preserve `(x, y)` unchanged (`adjusted: false`)**.
   - **Step C — Local Nearest-Walkable-Tile Ring Nudge (`radius = 1..6` tiles) Before Any Fallback**:
     - If `(x, y)` is within `[0..worldW, 0..worldH)` but lands on a blocked tile (`!this.isWalkable(zoneId, x, y)`), search outward in concentric tile rings $r = 1, 2, \dots, 6$ (`32..192 px`) around $(tx_0, ty_0) = (\lfloor x / 32 \rfloor, \lfloor y / 32 \rfloor)$ for the closest walkable tile $(tx, ty)$ by Euclidean distance, and nudge the character to its tile center `(tx * 32 + 16, ty * 32 + 16)` (`reason: "NUDGED_TO_NEAREST_WALKABLE_TILE"`). This keeps the player in their exact same local area rather than teleporting them across the map.
   - **Step D — Out-of-Bounds / Unrecoverable Fallback**:
     - Only if `(x, y)` is outside `[0..worldW, 0..worldH)` or no walkable tile exists within `6` tiles does it fall back to `ZONES_REGISTRY[zoneId].defaultSpawn` (`reason: "OUT_OF_BOUNDS_DEFAULT_SPAWN"`).
3. **Explicit Non-Silent Notice on Adjustment**:
   - Whenever `adjusted === true` (`reason !== "UNCHANGED"`), `zoneRoom` sends an explicit `action_result` notice (`ok: true`, `code: "POSITION_ADJUSTED_SAFE_TILE"`, `messageVi: "Địa hình Tân Thủ Thôn vừa mở rộng, vị trí của đạo hữu đã được dẫn về điểm đứng an toàn."`) and persists the single character's resolved `(x, y)` via the existing `syncRuntimeWorldState` / `saveCharacterState` call already present in `zoneRoom.ts` lines 496 and 706.
4. **BFS-Guided `__TONG_MON_DEBUG__.teleportLocal(x, y)` in `apps/client/src/WorldScene.ts`**:
   - On the `96×72` map with streams and buildings, straight-line interpolation in `teleportLocal` (lines 1178–1192) would collide with stream water. Updating `teleportLocal(x, y)` to step along the 4-neighbor BFS shortest path on `this.collisionGrid` ensures every step is walkable (`<= 32 px`) and accepted by `AuthoritativeWorldEngine.validateMovement`.

---

## 4. UI/HUD Separation & `V01-B` Component Integration Plan (`VISUAL-03-U`)

Per Owner Decision #4 from `VISUAL-01` (*"Approve separating inventory, character, party and world-anchored NPC shops into coherent interfaces. Do not alter cooking-location rules without explicit gameplay contract approval"*):

### 4.1 Coherent Interface Separation (Replacing the Monolithic Dashboard Popup)
Currently, pressing `[I]` in `apps/client/src/hud.ts` (lines 528–632) opens a single combined modal (`Hành Trang • Quán Mì Lão Trù Trương • Thần Đỉnh Nấu Nướng`) that dumps the player's inventory, cooking recipes, and `Lão Trù Trương`'s noodle shop into one long HTML list regardless of where the player is standing.

In `VISUAL-03-U`, we separate these into world-grounded `V01-B` interfaces while keeping all existing network intents (`sendUseItem`, `sendCookRecipe`, `sendShopBuy`, `sendPartyAction`), all existing keyboard shortcuts (`I`, `C`, `M`, `B`, `Escape`, `WASD`, `J`, `K`, `L`, `E`, `F`), and all DOM test selectors intact:
1. **`[I]` Inventory & Culinary Bag Modal (`#inventory-modal` — `Túi Càn Khôn`)**:
   - Styled with `panel_tier1_grounded_wood_jade_9slice.png` (`border-image` / 9-slice CSS) and `64×64` rarity slot frames (`slot_item_{pham..than}_64.png`) + real item icons (`item_*_64.png`).
   - Uses category filter tabs (`tab_header_active_gold_jade.png` / `tab_header_inactive_wood_jade.png`):
     - **Tab 1: `Túi Trữ Vật` (Inventory Grid & Item Inspector)**: Shows owned items with `item_*_64.png` icons, stack counts, `Linh Thạch` counter (`currency_linh_thach_32.png`), and `Thưởng Thức / Dùng` (`.btn-use-item`).
     - **Tab 2: `Thần Đỉnh Chế Biến` (Culinary Recipes)**: Shows `RECIPES_REGISTRY` with ingredient icons and `Khởi Lửa Chế Biến` (`.btn-cook-recipe`), preserving the exact server cooking contract.
   - **Removed from `[I]`**: `Lão Trù Trương`'s remote shop list is no longer embedded inside the player's personal `[I]` bag (since `worldEngine.handleShopBuy` already rejects purchases when `dist > 160 px` from `merchant_truong` on line 526).
2. **World-Anchored NPC Dialogue & Shop Modal (`#npc-dialogue-modal`)**:
   - Triggered by walking within interaction range (`<= 135 px`) of an NPC in the world and pressing `[E]` (or clicking the contextual prompt / NPC).
   - Framed with `panel_tier2_celestial_ivory_scroll_9slice.png` (and `panel_tier3_supreme_dragon_gold_9slice.png` header for `Tam Đế`), displaying the NPC's `160×160` `V01-B` portrait (`portrait_phi_de.png`, `portrait_rmt_de.png`, `portrait_merchant_truong.png`, `portrait_thai_tai.png`, etc.).
   - When interacting with **`merchant_truong` (`Lão Trù Trương`)** at `(1136, 1136)`, renders the dedicated **`Quán Mì Linh Thiện` Shop Ledger** with `item_*_64.png` icons, `Linh Thạch` prices, and `.btn-shop-buy` buttons.
   - When interacting with **`phi_de` (`Phì Đế`)** at `(1488, 1072)`, renders the `Vạn Vị Thành Đạo` quest acceptance/submission scroll (`.btn-quest-submit`, `#btn-quest-accept`).
3. **`[C]` Character, Attributes, Destiny & Party Compendium (`#cultivation-modal`)**:
   - Framed with `panel_tier2_celestial_navy_jade_9slice.png`.
   - Displays the `160×160` starter portrait (`portrait_hero_kiem_tu`, `portrait_hoa_tran`, `portrait_starter_ngoc_tam`, `portrait_anh_7`), `orb_dantian_star_core.png`, separate Character Level (`EXP`) and Cultivation Realm (`Tu Vi`) bars (`bar_exp_silver_gold.png`, `bar_tu_vi_cyan_gold.png`), the 6 Origin Attributes with `attr_*_32.png` medallions and `btn_plus_alloc_{ready,disabled}.png` buttons, the 3 immutable `Tiên Thiên` sockets (`socket_destiny_tien_thien_locked.png` + `destiny_card_{pham..than}.png` + trait emblem icons), the 3 active `Hậu Thiên` sockets (`socket_destiny_hau_thien_{active,equippable}.png`), and a dedicated **Tổ Đội (`Party`)** sub-tab/drawer (`#btn-party-create`, `#btn-party-join`, `#btn-party-leave`).
4. **Two-Step `S1-E` Character Creation & `Tiên Thiên` Roll (`#character-creation-overlay`)**:
   - Step 1 (`#cc-draft-section`): Uses `cc_name_scroll_input_frame.png`, `cc_appearance_card_{selected,unselected}.png`, `cc_pedestal_lotus_dais.png`, and the 4 upgraded `160×160` starter portraits (`portrait_hero_kiem_tu`, `portrait_hoa_tran`, `portrait_starter_ngoc_tam`, `portrait_anh_7`).
   - Step 2 (`#cc-rolled-section`): Uses the 4 rarity-scaled destiny card frames (`destiny_card_pham.png`, `destiny_card_hoang.png`, `destiny_card_tien.png`, `destiny_card_than.png`) and trait emblem icons, with whole-trio reroll (`#btn-cc-reroll`, `btn_jade_gold_default.png`) and irreversible confirm (`#btn-cc-confirm`, `btn_cinnabar_default.png` + `seal_dao_cinnabar.png`), strictly with **zero lock icons**.

---

## 5. Bounded 3-Task Execution Sequence (`VISUAL-03-W`, `VISUAL-03-U`, `VISUAL-03-Q`)

To keep diffs clean, verifiable, and strictly within `docs/technical/SOURCE_ARCHITECTURE.md` boundaries, `VISUAL-03` is divided into three sequential execution tasks after owner authorization:

---

### Task 1: `VISUAL-03-W` — World, Map (`96×72`), Adaptive Camera, Essential S1 Minimap & Sprite Runtime Integration

- **Intent**: Import Batch B & Batch C world/sprite/tileset/VFX assets (plus the minimap ring), upgrade `maps/tan_thu_thon.tmj` to the BFS-verified `96×72` layout, migrate `ZONES_REGISTRY` and `LEGENDARY_NPCS` coordinates (including `thai_tai` and `npc_ngoc_tam` visual key separation and `portal_forest_to_town` return target), implement `CameraView` (`computeResponsiveCameraProfile` for `720p`/`1080p`/`4K`/mobile) and essential S1 `MinimapView` (static geography cache + dynamic player/viewport/NPC/portal markers, no S4 auto-nav), enforce the 12-stratum Y-sort occlusion budget (`OCC-01`..`OCC-06`), implement non-destructive `resolveSafeZoneCoordinates` on join, and update server/unit test coordinate fixtures.
- **Asset Imports (`assets/` & `apps/client/public/assets/`)**:
  - `assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png`
  - `assets/props/` (`building_tan_thu_tu_duong.png`, `building_tu_bao_cac.png`, `building_hong_tran_cac.png`, `prop_noodle_stall.png`, `prop_than_dinh.png`, `prop_portal_arch.png`, `prop_peach_tree.png`, `prop_bamboo_cluster.png`, `prop_stone_lantern.png`, `prop_arched_bridge.png`, `prop_bridge_horizontal.png`, `prop_village_stele.png`, `prop_spirit_herb.png`, `prop_incense_brazier.png`, `prop_jade_rock.png`, `prop_wooden_fence.png`)
  - `assets/sprites/` (`hero_kiem_tu.png` `480×1920`, `hoa_tran.png` `480×768`, `ngoc_tam.png` `480×768`, `anh_7.png` `480×768`, `chatdvt.png` `480×768`, `phi_de.png` `320×96` chubby bear-hat + `đùi gà luộc`, `rmt_de.png` `320×96` `Thần Tài`, `merchant_truong.png` `320×96`, `dam_lon_tien_tu.png` `320×96`, `npc_ngoc_tam.png` `320×96`, `thai_tai.png` `320×96`)
  - `assets/portraits/` (`portrait_hero_kiem_tu.png`, `portrait_hoa_tran.png`, `portrait_starter_ngoc_tam.png`, `portrait_ngoc_tam.png`, `portrait_anh_7.png`, `portrait_phi_de.png`, `portrait_rmt_de.png`, `portrait_chatdvt.png`, `portrait_merchant_truong.png`, `portrait_dam_lon_tien_tu.png`, `portrait_thai_tai.png`)
  - `assets/vfx/` (`portal_ring.png` `256×64`, `phi_de_blessing.png` `256×64` from `than_dinh_blessing_fire_64x64_4f.png`)
  - `assets/ui/v01b/hud/hud_minimap_astrolabe_ring.png`
  - `assets/source_ai/` (archival of raw generator sheets `source_01`..`source_08`, `source_b01`..`source_b11` for `provenance.json` SHA-256 verification)
- **File Allowlist**:
  - `edit_existing`:
    - `maps/tan_thu_thon.tmj`
    - `packages/game-data/src/index.ts`
    - `packages/art-tools/verify_manifest.ts`
    - `assets/manifest.json`
    - `assets/provenance.json`
    - `apps/server/src/worldEngine.ts`
    - `apps/server/src/zoneRoom.ts`
    - `apps/server/src/__tests__/server.test.ts`
    - `apps/client/src/WorldScene.ts`
    - `apps/client/src/hud.ts`
    - `apps/client/src/style.css`
  - `create_within`:
    - `apps/client/src/game/world/CameraView.ts`
    - `apps/client/src/game/world/MinimapView.ts`
    - `assets/**`
    - `apps/client/public/assets/**`
  - `protect` (Must NOT Modify):
    - `maps/thanh_truc_lam.tmj`
    - `apps/server/src/characterV02Actions.ts`
    - `apps/server/src/characterV02Repository.ts`
    - `docs/systems/**`, `docs/pipelines/**`, `docs/technical/TD*`
- **Verification Profile**:
  - `npm run verify:assets` (`exit 0`)
  - `npm run typecheck` (`exit 0`)
  - `npm test` (`vitest run` — including unit tests for `computeResponsiveCameraProfile` at `720p`/`1080p`/`4K`/mobile and `resolveSafeZoneCoordinates` for legacy spawn mapping + nearest-walkable-tile ring nudge)
  - `npm run build` (`exit 0`)

---

### Task 2: `VISUAL-03-U` — `V01-B` HUD, Character Creation, `[C]` Panel, `[I]` Bag & World-Anchored Shop UI Integration

- **Intent**: Import all Batch A `V01-B` UI frames, buttons, sockets, gauges, and `32×32`/`64×64` icons; upgrade the top-left HUD crest, bottom-center skill dock, Quest Tracker scroll, 2-step Character Creation (`DRAFT` + `ROLLED`), `[C]` Character/Cultivation/Destiny panel, separated `[I]` Inventory/Culinary modal, and world-anchored NPC Dialogue/Shop modal (`Lão Trù Trương` & `Phì Đế`) while preserving all DOM IDs, all keyboard shortcuts (`I`, `C`, `M`, `B`, `Escape`), and `>= 70%` unobstructed playfield.
- **Asset Imports (`assets/` & `apps/client/public/assets/`)**:
  - `assets/ui/v01b/frames/*.png` (6 nine-slice frames)
  - `assets/ui/v01b/hud/*.png` (crest, skillbar dock, 4 bars, dantian orb)
  - `assets/ui/v01b/controls/*.png` (15 buttons, seals, tabs)
  - `assets/ui/v01b/character/*.png` (appearance cards, scroll input, lotus dais, 4 destiny rarity cards, `Tiên Thiên` & `Hậu Thiên` sockets)
  - `assets/ui/v01b/slots/*.png` (6 item rarity slot frames)
  - `assets/ui/v01b/prompts/*.png` (6 interaction pills & quest markers)
  - `assets/icons/v01b/*.png` (6 attribute icons, 11 `ITEMS_REGISTRY` icons, 5 destiny emblem icons, `Linh Thạch` & `Tu Vi` orbs in `32×32` and `64×64`)
- **File Allowlist**:
  - `edit_existing`:
    - `apps/client/src/hud.ts`
    - `apps/client/src/characterCreation.ts`
    - `apps/client/src/features/character/CharacterPanel.ts`
    - `apps/client/src/style.css`
    - `assets/manifest.json`
    - `assets/provenance.json`
  - `create_within`:
    - `apps/client/src/ui/v01bAssets.ts`
    - `assets/ui/v01b/**`
    - `assets/icons/v01b/**`
    - `apps/client/public/assets/ui/v01b/**`
    - `apps/client/public/assets/icons/v01b/**`
  - `protect` (Must NOT Modify):
    - `apps/server/**`
    - `packages/game-data/**`
    - `packages/shared/**`
- **Verification Profile**:
  - `npm run verify:assets` (`exit 0`)
  - `npm run typecheck` (`exit 0`)
  - `npm test` (`exit 0`)
  - `npm run build` (`exit 0`)

---

### Task 3: `VISUAL-03-Q` — Live In-Engine Playwright E2E Playtest (`720p`, `1080p`, `4K`, Mobile), Occlusion/Minimap QA & Documentation Sync

- **Intent**: Update `tests/e2e/runPlaytest.ts` to test the expanded `96×72` `Tân Thủ Thôn` coordinates, verify `CAM-01`..`CAM-08` (across `1280×720`, `1920×1080`, `3840×2160`, and `390×844`), `OCC-01`..`OCC-06` (multi-district Y-sort occlusion for buildings, trees, bridges, cauldron, and southern rows), and `MM-01`..`MM-07` in live headless Chromium, capture actual in-engine Phaser 4 + `V01-B` HUD screenshots and multi-pose GIFs, and synchronize affected project documentation.
- **File Allowlist**:
  - `edit_existing`:
    - `tests/e2e/runPlaytest.ts`
    - `AGENTS.md`
    - `docs/ART_BIBLE.md`
    - `docs/CHARACTER_VISUAL_BIBLE.md`
    - `docs/implementation/FEATURE_LEDGER.md`
    - `docs/PROJECT_STATUS.md`
    - `docs/NEXT_ACTIONS.md`
    - `docs/MASTER_PROJECT_PLAN.md`
    - `docs/ROADMAP.md`
    - `docs/tong-mon-8d-project-atlas.html`
    - `docs/technical/CAMERA_AND_MINIMAP_CONTRACT.md`
    - `docs/implementation/VISUAL_03_INTEGRATION_PLAN.md`
- **Verification Profile**:
  - `npm run verify:assets` (`exit 0`)
  - `npm run typecheck` (`exit 0`)
  - `npm test` (`exit 0`)
  - `npm run build` (`exit 0`)
  - `npm run test:e2e` (`ALL_GATES_PASSED`, `0` console errors, `0` failed `/assets/` or `/maps/` network requests, live screenshots `01`..`13` + `720p`/`1080p`/`4K`/mobile camera, occlusion & minimap verification screenshots)
  - `npm run verify:doc-sync` (`exit 0`)

---

## 6. Existing Documentation Requiring Sync After `VISUAL-03` Integration (`VISUAL-03-Q`)

Per task instructions, the following existing repository documents are **not** modified during `VISUAL-03-P`, and will be updated in `VISUAL-03-Q` once integration and live E2E verification complete:

| Document Path | Planned Post-Integration Update (`VISUAL-03-Q`) |
|---|---|
| `AGENTS.md` | Record owner creative decisions (`V01-B` selection & `VISUAL-02B` + `VISUAL-02B-CORRECTION` S1 Core Art Kit status; update `Tân Thủ Thôn` `96×72` map status and sprite resolution summary in §2 and §5). |
| `docs/ART_BIBLE.md` | Update active visual direction from `Candidate A` to owner-selected **`V01-B — Thiên Mệnh Tiên Cung`** with the Three-Tier Grandeur System, `96×72` `Tân Thủ Thôn` tile contract, and Human Creative Decisions Ledger mirror. |
| `docs/CHARACTER_VISUAL_BIBLE.md` | Update `phi_de` (Chubby Bear-Hat Saint Mascot in Luxury White-Jade/Gold Robes w/ Boiled Chicken Drumstick `Đùi Gà Luộc`), `rmt_de` (Wealthy `Thần Tài` Merchant Lord in Crimson-Gold Brocade), `thai_tai` (dedicated `80×96` appraiser sprite & portrait), `ngoc_tam` (`ngoc_tam` starter #3 vs `npc_ngoc_tam` town NPC), and `chatdvt` (`80×96`/`96×96` 4-dir quadruped). |
| `docs/implementation/FEATURE_LEDGER.md` | Record `VISUAL-01`, `VISUAL-02A`, `VISUAL-02B`, `VISUAL-02B-CORRECTION`, `VISUAL-03-P`, and `VISUAL-03` (`W`/`U`/`Q`) implementation evidence, commit SHAs, and check results. |
| `docs/PROJECT_STATUS.md` | Update current runtime snapshot to reflect `V01-B` UI/HUD, `96×72` `Tân Thủ Thôn` world, adaptive camera/minimap runtime, and `S1-F` readiness. |
| `docs/NEXT_ACTIONS.md` | Advance active task pointer from `VISUAL-01..03` to `S1-F` (Final Slice 1 Verification & Closeout). |
| `docs/MASTER_PROJECT_PLAN.md` | Update Visual Gate (`VISUAL-01`..`VISUAL-03`) status from pending to completed and point to `S1-F`. |
| `docs/ROADMAP.md` | Mark S1 Visual Foundation & `96×72` `Tân Thủ Thôn` upgrade complete in Slice 1 progress. |
| `docs/tong-mon-8d-project-atlas.html` | Sync visual architecture cards and Slice 1 progress badges with `PROJECT_STATUS.md` and `FEATURE_LEDGER.md`. |

---

## 7. `VISUAL-03-P` Final Corrections Acceptance Checklist

| # | Owner Review Finding | Contract / Plan Section | Status |
|---:|---|---|---|
| 1 | **Adaptive Camera Zoom (`1280×720`, `1920×1080`, `3840×2160` & Mobile `390×844`)** | `CAMERA_AND_MINIMAP_CONTRACT.md` §3.1–§3.3 (`computeResponsiveCameraProfile`: `1.25×` @ `720p` = `1024×576` world px; exact `2.0×` integer @ `1080p` = `960×540` world px; exact `4.0×` integer @ `4K` = `960×540` world px; exact `1.0×` integer @ `390×844` = `390×844` world px; `<= 8.33%` of `tan_thu_thon` and `<= 40.91%` of `thanh_truc_lam` visible at all resolutions) | **RESOLVED** |
| 2 | **Essential S1 Minimap Scope (No Unproven `startAutoNav` or `S4` Auto-Nav)** | `CAMERA_AND_MINIMAP_CONTRACT.md` §1.2 & §5.1–§5.3; `VISUAL_03_INTEGRATION_PLAN.md` §1.2 (Static cached geography + dynamic player, viewport bounds & canonical NPC/cauldron/portal pins only; `startAutoNav` proven absent in repo and deferred to `S4`) | **RESOLVED** |
| 3 | **Y-Sort & World Occlusion Rules + Multi-District Tests** | `CAMERA_AND_MINIMAP_CONTRACT.md` §4.2 & §6.2 (`OCC-01`..`OCC-06`); `VISUAL_03_INTEGRATION_PLAN.md` §3.3 (Walkable bridges at surface `depth = 6`; vertical buildings/trees anchored at southern collision footprint $Y_{\text{base}}$ with `depthOffset = 0`; `AbovePlayer = 4000`; nameplates at `4100+`) | **RESOLVED** |
| 4 | **Safe, Non-Destructive Persisted Coordinate Strategy (`40×30` → `96×72`)** | `VISUAL_03_INTEGRATION_PLAN.md` §3.4 (Zero bulk/destructive DB operations; per-character on-join `resolveSafeZoneCoordinates`: semantic mapping for exact legacy `(640, 512)` & `(1036, 480)` constants, 100% preservation of walkable coordinates, `1..6` tile ring nudge for blocked coordinates before `defaultSpawn` fallback, plus explicit Vietnamese system notice) | **RESOLVED** |
| 5 | **Full-Map UI vs. Normal Gameplay Viewport & Preserved Keyboard Shortcuts** | `CAMERA_AND_MINIMAP_CONTRACT.md` §1.1 & §4.4; `VISUAL_03_INTEGRATION_PLAN.md` §1.2 & §4.1 (Prohibits fitting whole world into live gameplay viewport; does NOT permanently prohibit a separate optional map UI in future slices; preserves all existing shortcuts including `M` = `sendClaimMeditation()`) | **RESOLVED** |
| 6 | **Distinct Sprite Identity Mapping (`ngoc_tam` vs `npc_ngoc_tam`, and `thai_tai`)** | `VISUAL_03_INTEGRATION_PLAN.md` §2.2.A & §2.2.B (Starter #3 keeps `appearanceId: "ngoc_tam"` / `spriteKey: "ngoc_tam"` + `portrait_starter_ngoc_tam.png`; Town NPC #6 keeps `id: "ngoc_tam"` with `spriteKey: "npc_ngoc_tam"` + `portrait_ngoc_tam.png`; Town NPC #7 `thai_tai` uses dedicated `spriteKey: "thai_tai"` + `portrait_thai_tai.png`) | **RESOLVED** |
| 7 | **Proven Source Evidence vs. Proposed APIs & `VISUAL-02B` Approval Reconciliation** | `CAMERA_AND_MINIMAP_CONTRACT.md` §1.2; `VISUAL_03_INTEGRATION_PLAN.md` §1.1 & §1.2 (Line-referenced table separating proven repo behavior from proposed `VISUAL-03` modules and deferred `S4` APIs; reconciles owner production-direction acceptance of `VISUAL-02B` NPC differentiation with live gameplay `HUMAN_APPROVED` gate in `VISUAL-03-Q`) | **RESOLVED** |
