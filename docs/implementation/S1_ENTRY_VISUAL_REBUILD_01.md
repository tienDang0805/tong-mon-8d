# S1-ENTRY-VISUAL-REBUILD-01 — Fullscreen V01-B Entry Flow, Multi-Character Roster & S1 Presentation Rebuild

- **Task ID**: `S1-ENTRY-VISUAL-REBUILD-01`
- **Date**: `2026-10-19`
- **Status**: `IMPLEMENTED_TECHNICALLY_VERIFIED_PENDING_OWNER_VISUAL_REVIEW`
- **Commit Policy**: `NO_COMMIT / NO_PUSH / NO_DEPLOYMENT`
- **Owner Decision**: `GD-047` (`APPROVED` — Multiple Characters per Account, Fullscreen Pre-World Entry Lifecycle `TITLE -> ROSTER/CREATE -> DESTINY_ROLL -> ENTERING_WORLD -> IN_WORLD`, and In-Game `[ESC]` System Menu Return to Character Management / Title)

---

## 1. Scope & Problem Statement

Following `VISUAL-03-INTEGRATION-01`, the project owner reviewed the live UI and requested `S1-ENTRY-VISUAL-REBUILD-01` to resolve five concrete structural and visual gaps:

1. **Pre-World Entry Lifecycle Separation**: Previously, `GameBootstrap.ts` immediately connected to the Colyseus `ZoneRoom` on page load and rendered character creation as a translucent overlay on top of the running village map. The rebuilt lifecycle introduces an explicit state machine (`TITLE -> ROSTER -> CREATE -> DESTINY_ROLL -> ENTERING_WORLD -> IN_WORLD`) where normal page loads land on `TITLE` with `0` spawned world actors and no automatic Colyseus room join until an owned, confirmed character is explicitly selected.
2. **Multiple Characters per Authenticated Account (`GD-047`)**: Previously, `characters_v02` enforced `account_id TEXT UNIQUE`, restricting each account to a single row. `S1-ENTRY-VISUAL-REBUILD-01` makes `character_id` the durable primary gameplay identity and `account_id` a non-unique ownership foreign key with an explicit idempotent migration (`multiCharacterV02Migration.ts`), character-scoped world state (`player_world_state_v02`), character-scoped request receipts (`character_action_receipts_v02`), and pre-world HTTP routes (`/api/character/roster`, `/api/character/select`, `/api/character/draft`, `/api/character/roll`, `/api/character/confirm`).
3. **Persisted Zone & Coordinate Resume**: Confirmed characters enter `Tân Thủ Thôn` at a safe starter spawn on initial confirmation, while returning confirmed characters resume their persisted `zoneId` and `(x, y)` coordinates when selected from `ROSTER`. Unconfirmed `"draft"` characters cannot enter the world (`CHARACTER_NOT_CONFIRMED`) and resume `DESTINY_ROLL`.
4. **In-Game `[ESC]` System Menu**: Pressing `[ESC]` (when no modal is open) or clicking `Hệ Thống [ESC]` opens the in-game system menu (`Tiếp Tục Hành Trình`, `Đổi Nhân Vật / Quản Lý Đạo Thân`, `Tạo Nhân Vật Mới`, `Bật/Tắt Âm Thanh`, `Về Màn Hình Chính`), cleanly leaving the active `ZoneRoom` when returning to `ROSTER` or `TITLE` while preserving the guest account credential.
5. **Authentic V01-B (`Thiên Mệnh Tiên Cung`) Composition**: Replaced generic dark translucent form overlays and stacked modal cards with three-tier V01-B material hierarchy, native generated entry/ceremony backdrops (`entry_title_terrace_bg_v01b.png`, `entry_destiny_astrolabe_bg_v01b.png`), animated 2D canvas sprite previews on the inscribed lotus pedestal (`cc_lotus_pedestal_v01b.png`), three tall rarity-scaled `Tiên Thiên` edict steles with an explicit irreversible confirmation modal, the 3-column `[C] Thiên Cung Nội Thị Đồ` cultivation codex with meridian star chart (`c_panel_meridian_star_chart_v01b.png`), the `[I] Túi Càn Khôn` reliquary grid + Ivory Silk inspection scroll + `Linh Trù Bát Hoang` culinary sub-tab, and the `[E]` NPC Ivory Silk dialogue/shop scroll.

---

## 2. Architecture & Implementation Summary

### 2.1 Shared Protocol & Lifecycle Contracts (`packages/shared`)
- `packages/shared/src/protocols/entry/index.ts`: Defines `EntryFlowState` (`"TITLE" | "ROSTER" | "CREATE" | "DESTINY_ROLL" | "ENTERING_WORLD" | "IN_WORLD"`), `CharacterRosterEntryDto`, and HTTP request/response contracts (`FetchCharacterRosterResultPayload`, `SelectCharacterRequestPayload`, `SelectCharacterResultPayload`, `CreateCharacterDraftHttpRequestPayload`, `RollInnateDestinyHttpRequestPayload`, `ConfirmInnateDestinyHttpRequestPayload`).
- `packages/shared/src/protocols/character.ts`: Adds optional `characterId?: string` targeting to `CreateCharacterDraftPayload`, `RollInnateDestinyPayload`, `ConfirmInnateDestinyPayload`, `AllocateAttributePointsPayload`, and `SetActiveAcquiredDestinyPayload`, plus `"CHARACTER_NOT_CONFIRMED"` error code.

### 2.2 Multi-Character Persistence & Server Authority (`apps/server`)
- `apps/server/src/infrastructure/database/migrations/multiCharacterV02Migration.ts`: Idempotently drops legacy `characters_v02_account_id_key` uniqueness constraints, adds `(account_id, updated_at DESC)` and `(account_id, character_id)` indexes, creates `player_world_state_v02` (`character_id PRIMARY KEY`, `account_id`, `zone_id`, `x`, `y`, `hp`, `max_hp`, `tu_vi`, `spirit_stones`, `inventory_json`, `active_buffs_json`, `quests_json`), backfills existing confirmed characters from legacy `players` rows when matched, and upgrades `character_action_receipts_v02` to composite primary key `(account_id, character_id, action_kind, request_id)` using `"__account__"` sentinel for pre-character draft creation.
- `apps/server/src/infrastructure/database/LegacyWorldPorts.ts`: Persists and loads per-character world state via `loadCharacterWorldState(accountId, characterId)` and `saveCharacterWorldState(accountId, characterId, state)` while keeping `apps/server/src/infrastructure/database/PgAdapter.ts` untouched (`05400e8ff0d2ff33d80eef60bc32c606299187e288ef84a9415a90a954cb5a51`).
- `apps/server/src/transport/http/registerCharacterHttpRoutes.ts`: Exposes authenticated HTTP endpoints (`POST /api/guest/auth`, `GET /api/character/roster`, `POST /api/character/select`, `POST /api/character/draft`, `POST /api/character/roll`, `POST /api/character/confirm`) backed by `GuestIdentityStore` and `CharacterService`.
- `apps/server/src/transport/colyseus/ZoneRoom.ts` & `apps/server/src/runtime/world/WorldRuntime.ts`: Enforces confirmed-character world entry (`CHARACTER_NOT_CONFIRMED` rejection before confirmation), binds runtime player state by `characterId`, and persists zone/coordinates on portal transition and room leave.

### 2.3 Client Entry Flow & V01-B Presentation (`apps/client`)
- `apps/client/src/app/entry/EntryStateMachine.ts`: Deterministic `EntryFlowState` controller publishing global E2E/debug telemetry (`window.__TONG_MON_ENTRY_STATE__`).
- `apps/client/src/features/entry/SpritePreviewCanvas.ts`: 2D canvas directional sprite animator slicing runtime `hero_kiem_tu`, `hoa_tran`, `ngoc_tam`, and `anh_7` sheets across `down/up/left/right` and `idle/walk` modes.
- `apps/client/src/features/entry/TitleAndRosterViews.ts`: Fullscreen V01-B `TITLE`, `ROSTER`, and `ENTERING_WORLD` views.
- `apps/client/src/features/character/CharacterCreationView.ts`: Fullscreen `CREATE` (`Thiên Mệnh Khởi Nguyên Đài`) and `DESTINY_ROLL` (`Tiên Thiên Nghịch Thiên Cải Mệnh`) with irreversible confirmation modal (`#destiny-confirm-modal-backdrop`).
- `apps/client/src/features/character/CharacterPanel.ts`: 3-column `[C] Thiên Cung Nội Thị Đồ` with dantian meditation dais, meridian star chart (`c_panel_meridian_star_chart_v01b.png`), and horizontal rarity-framed destiny plaques.
- `apps/client/src/features/shops/InventoryAndShopModalView.ts` & `apps/client/src/ui/HudShell.ts`: V01-B reliquary `[I]` grid + Ivory Silk inspection scroll + `Linh Trù Chế Biến` tab, NPC Ivory Silk dialogue/shop scroll `[E]`, top-left HUD crest, top-right astrolabe minimap, right-hand `[Q]` quest scroll, bottom-center lotus skillbar dock, and `[ESC]` system menu (`#esc-system-menu-backdrop`).

---

## 3. Native V01-B Art Generation & Provenance (`TECHNICALLY_VERIFIED`)

Three raw 16:9 text-free V01-B source sheets were generated via the built-in `image-generator` subagent (`conversationId: b664f32e-0884-42d8-b922-08cfb3c26cd0`) with Core Kit references attached, sliced into 5 runtime UI assets, and registered in `assets/corekit/v01b/catalog.json`, `assets/manifest.json`, and `assets/provenance.json` with `creativeApprovalState: "TECHNICALLY_VERIFIED"`:

1. `assets/ui/entry/bg_title_and_creation_terrace_v01b.png` (`1376x768`) — derived from `assets/source_ai/S1_ENTRY_VISUAL_REBUILD_01/source_e01_title_and_creation_terrace_backdrop_v01b.png`
2. `assets/ui/entry/bg_destiny_astrolabe_chamber_v01b.png` (`1376x768`) — derived from `assets/source_ai/S1_ENTRY_VISUAL_REBUILD_01/source_e02_destiny_astrolabe_chamber_backdrop_v01b.png`
3. `assets/ui/presentation/cultivation_meditation_star_wheel_v01b.png` (`320x320`) — derived from `assets/source_ai/S1_ENTRY_VISUAL_REBUILD_01/source_e03_cultivation_panel_plates_and_emblems_v01b.png`
4. `assets/ui/presentation/cultivation_meridian_hexagram_plate_v01b.png` (`320x320`) — derived from `assets/source_ai/S1_ENTRY_VISUAL_REBUILD_01/source_e03_cultivation_panel_plates_and_emblems_v01b.png`
5. `assets/ui/presentation/header_banner_crest_v01b.png` (`480x112`) — derived from `assets/source_ai/S1_ENTRY_VISUAL_REBUILD_01/source_e03_cultivation_panel_plates_and_emblems_v01b.png`

Additionally, the 8 owner-approved V01-B screen concepts were copied into `assets/corekit/v01b/references/ui/screens/01_main_world_hud.png` .. `08_mobile_gameplay_layout.png` and registered under `v01b.ui.approved_screen_concepts` (`1.0.0`, `HUMAN_APPROVED`).

---

## 4. Verification Evidence

- **Unit & Integration Tests (`npm test`)**: `8/8` test files (`62/62` tests) passed, including `apps/server/src/__tests__/characterRoster.test.ts` (`9/9` tests covering multi-character creation, draft isolation, idempotent migration, and persisted zone/position resume).
- **Entry & Multi-Character Playwright E2E (`tests/e2e/entry/runEntryAndMultiCharacterVerification.ts`)**: Verified `TITLE` zero-world-actor state, empty-account direct route to `CREATE`, 3confirmed + 1 draft characters on the same account, persisted `Thanh Trúc Lâm` resume vs. `Tân Thủ Thôn` resume, `[C]`, `[I]`, `[E]`, `[ESC]` system menu switching, and responsive viewports (`1920x1080`, `1280x720`, `860x540`, `390x844`) with `consoleErrorCount: 0` and `failedAssetCount: 0`.
- **Screenshots & Comparison Sheets**: Saved in `artifacts/S1-ENTRY-VISUAL-REBUILD-01/screenshots/` and `artifacts/S1-ENTRY-VISUAL-REBUILD-01/comparison_sheets/`.
