# Art Bible — Tông Môn 8D: Tu Tiên Chi Lộ

> **Status Notice (`COREKIT-CANON-02` / `ARCH-COREKIT-R1` on `VISUAL-03-W` `7b386cea7ef075c6f358539ddea155cd1634db5b`):** This document defines the owner-approved **`V01-B — THIÊN MỆNH TIÊN CUNG`** visual direction (`DEC-006`..`DEC-009`), links all active visual masters through [`assets/corekit/v01b/catalog.json`](../assets/corekit/v01b/catalog.json) and [`assets/corekit/v01b/COREKIT_INDEX.md`](../assets/corekit/v01b/COREKIT_INDEX.md), separates asset `role` from `creativeApprovalState`, and mirrors the Human Creative Decisions Ledger (`AGENTS.md` Section 5) without mutating frozen `TD_FREEZE_APPROVALS.md` (`39c41a6`).

## 1. Asset Roles vs. Creative Approval Lifecycle States

Asset **`role`** (`master_reference`, `production_candidate`, `runtime`, `legacy_required`, `archive_only`) is tracked separately from **`creativeApprovalState`**. **Automated technical verification (`npm run verify:assets`, `quality_audit.py`) NEVER substitutes for human art approval:**

1. **`PROPOSED`**: Concept direction, style guide, or candidate artwork generated and awaiting human review.
2. **`TECHNICALLY_VERIFIED`**: Asset passes automated Core Kit catalog, dimension, alpha transparency, frame distinctness, Tiled dependency closure, and provenance SHA-256 checks (`verify_manifest.ts` + `packages/art-tools/corekit/validateCorekit.ts`), and loads cleanly in Phaser 4, but has **not** received explicit in-engine human creative sign-off. *(Note: `"status": "approved"` in `assets/manifest.json` and `"status": "pass"` in `assets/provenance.json` are retained strictly for backward compatibility alongside explicit `role` and `creativeApprovalState` fields.)*
3. **`HUMAN_APPROVED`**: Explicitly reviewed and approved by the human project owner (`approvalScope: "direction_and_s1_core_kit_sample"` for V01-B Core Kit reference masters `DEC-006`..`DEC-008`, and `approvalScope: "runtime_character_master"` for the Desktop Hero `DEC-009`), recorded in `AGENTS.md` Section 5 and Section 6 below.
4. **`REJECTED`**: Evaluated and rejected for visual direction, readability, or lore fidelity (isolated under `assets/archive/history/` with `role: "archive_only"` and `cannotBeUsedAsActiveMaster: true`).
5. **`PLACEHOLDER`**: Temporary or legacy asset (`role: "legacy_required"` in `assets/manifest.json` and `assets/corekit/v01b/catalog.json`: `bat_hoang_tileset.png`, `truc_lang.png`, `thanh_lan_xa.png`, `vaal_de.png`, `combat_vfx.png`, `portrait_vaal_de.png`, `portrait_gia_bao.png`) kept only to maintain playability until `HUMAN_APPROVED` V01-B generative replacements are produced.

---

## 2. Historical Phase 0 Capability Proof & Disabled Legacy Tooling
- **Historical Phase 0 Context**: During Phase 0 bootstrap, the Antigravity `image-generator` subagent (`TypeName: "image-generator"`) was paired with local Python + `Pillow` normalization and the legacy monolithic prototype script `packages/art-tools/build_assets.py`.
- **Disabled Procedural Entrypoints (`build_assets.py` / `generate:art*`)**: Both `python packages/art-tools/build_assets.py` (with or without `--force`) and `npm run generate:art` / `npm run generate:art:force` are permanently disabled fail-closed entrypoints (`exit code 2` before any filesystem write). The original Phase 0 script is archived as non-executable historical provenance at `packages/art-tools/legacy/build_assets.py`.
- **External Paid API Status**: Paid external API routes (`OpenAI`, `Google Gemini`, `xAI`, `BytePlus ModelArk`, `fal.ai`, `PixelLab`) and external CLI media wrappers (`codex`, `grok`, `route_media.py`) are prohibited for production asset generation (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`).

---

## 3. Historical Archives vs. Active `V01-B` Core Kit & `S1` Sequence

### 3.1 Archived Milestone A Candidates (`assets/archive/history/concepts/`)

> **Archive Boundary:** Historical `Candidate A`, `Candidate B`, `Candidate C`, and `capability_proof_phi_de.jpg` have been migrated out of active workspace paths into `assets/archive/history/concepts/` (`role: "archive_only"`, `cannotBeUsedAsActiveMaster: true` in `assets/archive/history/archive_manifest.json`). They are retained strictly for historical provenance and must never be used as active visual masters.

| Historical Archive File | Former Direction | Current Governance State |
|---|---|---|
| `assets/archive/history/concepts/candidate_a_classic_xianxia.jpg` | Classic 16/32-bit Xianxia Top-Down RPG (`DEC-002`) | **`archive_only`** *(Superseded by `V01-B` `DEC-006`)* |
| `assets/archive/history/concepts/candidate_b_dark_inkwash.jpg` | Dark Ink-Wash Mythic Xianxia | **`REJECTED` / `archive_only`** |
| `assets/archive/history/concepts/candidate_c_pastel_chibi.jpg` | Pastel Super-Deformed Chibi | **`REJECTED` / `archive_only`** |
| `assets/archive/history/concepts/capability_proof_phi_de.jpg` | Phase 0 Phì Đế Capability Proof (`DEC-003`) | **`archive_only`** *(Superseded by `DEC-008`)* |

### 3.2 Active `S1` Visual & Architecture Sequence (`VISUAL-01` → `VISUAL-03-W` → `HERO-ANIMSET-01` → `ARCH-FOUNDATION-02` → `COREKIT-CANON-02` → `ARCH-COREKIT-R1` → `VISUAL-03-U` → `VISUAL-03-Q` → `S1-F`)

| Task | Deliverable & Repository Evidence | Status & Approval Scope |
|---|---|---|
| **`VISUAL-01`** | Three new coherent visual direction sets (`V01-A`, `V01-B`, `V01-C`). | **`HUMAN_APPROVED` (`DEC-006`)**: Owner selected **`V01-B — THIÊN MỆNH TIÊN CUNG`** with Three-Tier Progression Grandeur (`Tân Thủ Thôn` = Tier I Grounded Starter Village). |
| **`VISUAL-02` & `VISUAL-02B-CORRECTION`** | Scoped `S1` Core Asset Kit (`VISUAL_02B_S1_CORE_KIT.zip`, SHA-256 `f09fec0d...`) + corrected **`phi_de`** (chubby cream bear hood `Mũ Gấu Tiên Thánh`, glasses, white-jade/celadon luxury saint robes with gold trim, holding `Đùi Gà Luộc`) and **`rmt_de`** (crimson/gold winged `Thần Tài` hat, wealth-god robes, gold ingot & abacus). | **`HUMAN_APPROVED` (`DEC-007`, `DEC-008`, `direction_and_s1_core_kit_sample`)**: Registered in `assets/corekit/v01b/catalog.json`. `OLD (REJECTED)` panes and `archive_pre_correction` files are isolated in `assets/archive/history/`. |
| **`VISUAL-03-P` & `VISUAL-03-W`** | `VISUAL-03-P` (`4679f49`) + `VISUAL-03-W` (`7b386cea7ef075c6f358539ddea155cd1634db5b`): `96×72` `maps/tan_thu_thon.tmj`, `CameraView.ts`, `MinimapView.ts`, 11 `80×96` starter/NPC sprites, 16 props/buildings/bridges, and 12-stratum Y-sort occlusion. | **`COMMITTED` (`7b386ce`)**: Runtime assets tracked as `TECHNICALLY_VERIFIED` pending full `VISUAL-03-U`/`Q` sign-off, except `hero_kiem_tu` (`DEC-009`). |
| **`HERO-ANIMSET-01`** | Complete 4-direction × 5-state (`idle`, `walk`, `attack`, `cast`, `hurt`) rebuild of `hero_kiem_tu` (`ref.character.hero_kiem_tu@2.0.0-hero-animset-01`; current on-disk 6-walk-frame `480×1920` `assets/sprites/hero_kiem_tu.png` `ecf6604b...`, `assets/portraits/portrait_hero_kiem_tu.png` `1de6fc60...`, `source_h04`..`source_h10` lineage). | **`HUMAN_APPROVED` (`DEC-009`, `runtime_character_master`)**: Owner approved Desktop Hero as master; later owner-confirmed 8-walk-frame Hero artifact is tracked as `MISSING_APPROVED_HERO_INPUT` (`full_80x96_20row_8walk` profile ready). |
| **`ARCH-FOUNDATION-02`, `COREKIT-CANON-02` & `ARCH-COREKIT-R1`** | Modular client/server/game-data/shared extraction (`scripts/verify-architecture.mjs`, `scripts/package-runtime-assets.mjs`), `assets/corekit/v01b/` registry + profiles + reference library, reusable Batch A UI import into `assets/ui/**`, pure Core Kit validator (`packages/art-tools/corekit/validateCorekit.ts`), disabled procedural entrypoints, and dependency-backed asset cleanup. | **`TECHNICAL_CHECKPOINT_VERIFIED` (`NO_COMMIT`)**: `ARCH-COREKIT-R1` fixes verified (`MISSING_APPROVED_HERO_INPUT` noted for 8-walk-frame Hero input). |
| **`VISUAL-03-U` & `VISUAL-03-Q`** | Wire imported `assets/ui/**` Batch A components into HUD/Character Creation/`[C]`/`[I]`/NPC shop modals (`VISUAL-03-U`), then run full multi-resolution Playwright E2E & measured FPS/frame-time closeout (`VISUAL-03-Q`). | **`IN PROGRESS / PENDING OWNER EXPERIENCE GATE`** (followed by **`S1-F`** Slice `S1` closeout gate). |

---

## 4. Verified Runtime Technical Specifications (Profile-Driven — `RULES.md` Rule 5)

Runtime sprite geometry is single-sourced in [`assets/corekit/v01b/profiles/animation.json`](../assets/corekit/v01b/profiles/animation.json), compiled to [`apps/client/src/game/assets/runtimeAnimationProjection.json`](../apps/client/src/game/assets/runtimeAnimationProjection.json), consumed by [`apps/client/src/game/assets/SpriteProfiles.ts`](../apps/client/src/game/assets/SpriteProfiles.ts) and [`apps/client/src/game/combat/AnimationRegistry.ts`](../apps/client/src/game/combat/AnimationRegistry.ts), and validated by [`packages/art-tools/corekit/validateCorekit.ts`](../packages/art-tools/corekit/validateCorekit.ts) (`55` verified manifest assets, `16` active Core Kit references, `7` `legacy_required` exceptions, `2` Tiled maps):

- **Logical World Grid**: `32x32` pixels per tile:
  - `maps/tan_thu_thon.tmj`: **`96x72` tiles (`3072x2304` px)** using `assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png` (`256x192`, 48 tiles of `32x32` px; `5,357` walkable tiles, `1,555` blocked tiles).
  - `maps/thanh_truc_lam.tmj`: **`44x32` tiles (`1408x1024` px)** using `assets/tilesets/bat_hoang_tileset.png` (`role: "legacy_required"`).
- **Profile 1 — `full_80x96_20row` & `full_80x96_20row_8walk` (`hero_kiem_tu` — `HUMAN_APPROVED` `DEC-009`)**:
  - **Runtime Spritesheet**: Currently `full_80x96_20row` (`480x1920` pixels, `6` columns × `20` rows of `80x96` frames: 5 states [`idle` 4f, `walk` 6f, `attack` 4f, `cast` 4f, `hurt` 4f] × 4 directions [`down`, `left`, `right`, `up`]) on disk (`ecf6604b...`), with `full_80x96_20row_8walk` (`640x1920` pixels, `8` columns × `20` rows: `walk` 8f) defined in `profiles/animation.json` and supported dynamically by `AnimationRegistry.ts` for the later owner-confirmed 8-walk-frame Hero input (`MISSING_APPROVED_HERO_INPUT`); foot anchor `(0.5, 0.9167)` (`x = 40, y = 88`), rendered at `scale = 0.82`.
- **Profile 2 — `locomotion_80x96_8row` (`hoa_tran`, Starter `ngoc_tam`, `anh_7`, Quadruped `chatdvt`)**:
  - **Runtime Spritesheet**: `480x768` pixels (`6` columns × `8` rows of `80x96` frames: 4-direction `idle` rows `0..3` + 4-direction `walk` rows `4..7`), foot anchor `(0.5, 0.9167)`, rendered at `scale = 0.82`. Non-locomotion states (`attack`/`cast`/`hurt`) deterministically fall back to same-direction `idle_<dir>`.
- **Profile 3 — `stationary_npc_80x96_4f` (`phi_de`, `rmt_de`, `merchant_truong`, `dam_lon_tien_tu`, `npc_ngoc_tam`, `thai_tai`)**:
  - **Runtime Spritesheet**: `320x96` pixels (`4` columns × `1` row of `80x96` frames: 4-frame `idle_down` strip), foot anchor `(0.5, 0.9167)`, rendered at `scale = 0.82`.
- **Profile 4 — Preserved `legacy_48x64_16row` (`truc_lang`, `thanh_lan_xa`, `vaal_de` — `role: "legacy_required"`)**:
  - **Runtime Spritesheet**: `288x1024` pixels (`6` columns × `16` rows of `48x64` frames), foot anchor `(0.5, 0.90)` (`x = 24, y = 58`), rendered at `scale = 1.0`. `gia_bao` in `Thanh Trúc Lâm` retains `spriteKey: "hero_kiem_tu"` until its dedicated sheet is produced.
- **World Landmarks, Architecture, Props & VFX**:
  - Grounded Tier I buildings & props in `assets/props/` (`building_tan_thu_tu_duong.png`, `building_tu_bao_cac.png`, `building_hong_tran_cac.png`, `prop_noodle_stall.png`, `prop_than_dinh.png`, `prop_portal_arch.png`, `prop_peach_tree.png`, `prop_bamboo_cluster.png`, `prop_stone_lantern.png`, `prop_arched_bridge.png`, `prop_bridge_horizontal.png`, `prop_village_stele.png`, `prop_spirit_herb.png`, `prop_incense_brazier.png`, `prop_jade_rock.png`, `prop_wooden_fence.png`) — the byte-identical duplicate `building_tu_duong.png` was removed in `COREKIT-CANON-02` after migrating `MapView.ts` and `RuntimeAssetBindings.ts` to `building_tan_thu_tu_duong`.
- **Portraits, Reusable Batch A UI Library & `S1-ENTRY-VISUAL-REBUILD-01` Entry/Presentation Assets**:
  - `160x160` RGBA PNGs in `assets/portraits/` (`12` portraits including `portrait_ngoc_tam.png`, `portrait_npc_ngoc_tam.png`, and `portrait_thai_tai.png`).
  - Imported reusable `V01-B` Batch A UI families in `assets/ui/{buttons_and_tabs,character_creation_and_c_panel,frames_9slice,hud_chrome,icons_32x32,icons_64x64,quest_and_prompts,slots_and_rarity_frames}/` plus `assets/ui/hud_minimap_astrolabe_ring.png` and `assets/ui/batch_a_ui_atlas_mapping.json`.
  - Owner-approved 8 screen concepts registered in `assets/corekit/v01b/references/ui/screens/` (`v01b.ui.approved_screen_concepts`), plus 5 text-free native `V01-B` entry/presentation UI assets generated via `image-generator` (`b664f32e-0884-42d8-b922-08cfb3c26cd0`) in `assets/ui/entry/` (`bg_title_and_creation_terrace_v01b.png`, `bg_destiny_astrolabe_chamber_v01b.png`) and `assets/ui/presentation/` (`cultivation_meditation_star_wheel_v01b.png`, `cultivation_meridian_hexagram_plate_v01b.png`, `header_banner_crest_v01b.png`) at `creativeApprovalState: "TECHNICALLY_VERIFIED"` pending owner visual review (`docs/implementation/S1_ENTRY_VISUAL_REBUILD_01.md`).

---

## 5. Approved `V01-B — THIÊN MỆNH TIÊN CUNG` Color & Material System (`DEC-006`)

Defined in [`assets/corekit/v01b/profiles/ui-tokens.json`](../assets/corekit/v01b/profiles/ui-tokens.json) and [`assets/corekit/v01b/profiles/world-art.json`](../assets/corekit/v01b/profiles/world-art.json):

- **Three-Tier Progression Grandeur**:
  - **Tier I (`Phàm Nhân` / `Tân Thủ Thôn` Grounded Starter Village)**: Warm weathered timber (`#6B4C35`), mossy grey-jade flagstone (`#7E8C85`, `#5E6B64`), emerald valley grass (`#5C9E57`, `#468242`, `#31612E`), turquoise mountain stream (`#4BC4C9`, `#2DA8B8`), and a modest pale white-jade octagonal central Bagua dais (`#ECEAE2`) with weathered brass-gold trim (`#C9A24B`).
  - **Tier II (`Tu Sĩ` Celestial Sect Chrome)**: Polished celestial white jade (`#F4F1EA`, `#D8D2C5`), deep astral-navy glass (`#101B33`, `#162442`), warm ivory silk scroll (`#F5EFE0`), and burnished imperial gold filigree (`#E5B85B`, `#B8862D`).
  - **Tier III (`Thần Phẩm` / `Tam Đế` Supreme Decree)**: Imperial dragon gold (`#FFD43B`, `#D49B1A`), sacred cinnabar crimson (`#D92B2B`, `#9E1C1C`), and luminous cyan-gold starlight (`#63E6BE`, `#8CF4EB`).

---

## 6. Mirrored Human Creative Decisions Ledger (`AGENTS.md` Section 5)

| Decision ID | Date | Scope / Asset / Doc | State | Approved By | Notes |
|---|---|---|---|---|---|
| `DEC-001` | 2026-10-16 | Canonical `Phàm Nhân` + 17 Major Realms (= 18 Ordered Entries) & 10 Legends Lore Baseline | `HUMAN_APPROVED` | Project Owner | Locked via `MASTER_PROMPT.md` & Phase 1A instructions |
| `DEC-002` | 2026-10-16 | Candidate A Visual Direction (`candidate_a_classic_xianxia.jpg`) | `PROPOSED` / `TECHNICALLY_VERIFIED` *(Historical)* | Superseded by `DEC-006` | Archived in `assets/archive/history/concepts/candidate_a_classic_xianxia.jpg`; superseded by `V01-B` (`DEC-006`) |
| `DEC-003` | 2026-10-16 | Phase 0 Multi-Pose PoC Sprites (`hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu`, `combat_vfx`) | `TECHNICALLY_VERIFIED` *(Historical)* | Superseded by `DEC-007`–`DEC-009` | Superseded for `hero_kiem_tu`, `phi_de`, and `dam_lon_tien_tu`; `combat_vfx` remains `legacy_required` (`PLACEHOLDER`) |
| `DEC-004` | 2026-10-16 | Game Design Baseline v0.2 (`docs/DECISIONS.md` & 10 Phase 1B.0 docs) | `HUMAN_APPROVED` / `DESIGN_BASELINE` / `PROPOSED` | Project Owner | Per `docs/DECISIONS.md` |
| `DEC-005` | 2026-10-16 | Technical Design Freeze v1.0 (`TD-01`..`TD-05` — 40 `docs/` files) | `TECHNICAL_DESIGN_ACCEPTED` | Project Owner | Per `docs/technical/TD_FREEZE_APPROVALS.md` (`39c41a6`) |
| `DEC-006` | 2026-10-18 | `VISUAL-01` Art Direction Lock: **`V01-B — THIÊN MỆNH TIÊN CUNG`** with Three-Tier Progression Grandeur (`Tân Thủ Thôn` = Tier I Grounded Starter Village) | `HUMAN_APPROVED` (`direction_and_s1_core_kit_sample`) | Project Owner | Registered as `ref.style.v01b_thien_menh@1.0.0` in `assets/corekit/v01b/catalog.json` |
| `DEC-007` | 2026-10-18 | `VISUAL-02B` Scoped `S1` Core Asset Kit (`VISUAL_02B_S1_CORE_KIT.zip`, SHA-256 `f09fec0d5acce19a296874e81475b866ade67905ed997a620848dfd43559abd2`) | `HUMAN_APPROVED` (`direction_and_s1_core_kit_sample`) | Project Owner | Reference sample approval in `assets/corekit/v01b/catalog.json`; distinct from final integrated runtime sign-off (`VISUAL-03-U`/`Q`) |
| `DEC-008` | 2026-10-18 | `VISUAL-02B-CORRECTION` Identity Lock for **`phi_de`** (chubby cream bear hood `Mũ Gấu Tiên Thánh`, glasses, white-jade/celadon luxury saint robes with gold trim, holding `Đùi Gà Luộc`) and **`rmt_de`** (crimson/gold winged `Thần Tài` hat, wealth-god face/robes, gold sycee ingot & abacus) | `HUMAN_APPROVED` (`direction_and_s1_core_kit_sample`) | Project Owner | Registered as `ref.character.phi_de@1.1.0` (`source_b11`) and `ref.character.rmt_de@1.1.0` (`source_b10`); `OLD (REJECTED)` panes and `archive_pre_correction` isolated in `assets/archive/history/` |
| `DEC-009` | 2026-10-18 | `HERO-ANIMSET-01` Desktop Hero Master Lock (`ref.character.hero_kiem_tu@2.0.0-hero-animset-01`): current workspace retains 6-walk-frame `assets/sprites/hero_kiem_tu.png` (`ecf6604b...`), `assets/portraits/portrait_hero_kiem_tu.png` (`1de6fc60...`), `assets/atlases/hero_kiem_tu_atlas.json` (`cb31f1ea...`), and `source_h04`..`source_h10` lineage | `HUMAN_APPROVED` (`runtime_character_master`) | Project Owner | Supersedes the old Hero in `VISUAL_02B_S1_CORE_KIT.zip` and `source_h01`/`source_h02` variants; later owner-confirmed 8-walk-frame Hero input is tracked as `MISSING_APPROVED_HERO_INPUT` (`full_80x96_20row_8walk`) |
