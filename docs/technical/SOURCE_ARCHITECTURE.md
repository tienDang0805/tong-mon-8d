# Tông Môn 8D — Source Architecture (Owner-Approved & Implemented Current-Game Modular Monolith)

> **Trạng thái:** `IMPLEMENTED AT CURRENT-GAME SCOPE` (`ARCH-FOUNDATION-02` + `COREKIT-CANON-02` + `S1-ENTRY-VISUAL-REBUILD-01` trên nền `VISUAL-03-W` `7b386cea7ef075c6f358539ddea155cd1634db5b` + `HERO-ANIMSET-01` `DEC-009`). Các hệ thống hậu MVP (`S2`–`S8` và bảng §6) vẫn là `TARGET / EXTENSION POINTS`, chưa triển khai.
> **Cơ sở audit:** `master@7b386cea7ef075c6f358539ddea155cd1634db5b` (`VISUAL-03-W`) cùng working tree `ARCH-FOUNDATION-02` + `COREKIT-CANON-02` + `S1-ENTRY-VISUAL-REBUILD-01`, đối chiếu `AGENTS.md`, `RULES.md`, `docs/DECISIONS.md` (`GD-001`–`GD-047`), TD-01…TD-05, `docs/CONTENT_PIPELINE.md`, `assets/corekit/v01b/catalog.json`, và `scripts/verify-architecture.mjs`.
> **Phạm vi duyệt:** Chủ dự án đã duyệt và giao thực thi *modular source architecture cho toàn bộ hệ thống hiện hữu* (`ARCH-FOUNDATION-02`), *cài đặt bộ Core Kit V01-B + dọn dẹp legacy* (`COREKIT-CANON-02`), và *luồng vào game + đa nhân vật trên cùng tài khoản + tái dựng giao diện S1 theo V01-B* (`S1-ENTRY-VISUAL-REBUILD-01`, đang chờ chủ dự án duyệt thị giác các màn hình mới). **Bản kiến trúc này không tự ủy quyền thực thi các hệ thống hậu MVP (`S2`–`S8`)**, không chỉnh 40 frozen TD Markdown.

## 1. Mục tiêu và các bất biến

Trò chơi: browser 2D top-down pixel-art tu tiên trong Bát Hoang, Phaser 4/Tiled + Colyseus + PostgreSQL/PGlite; 8–20 bạn bè cùng chơi ban đầu. Người chơi có build định mệnh/thuộc tính/cảnh giới/công pháp/võ kỹ, nhiệm vụ thủ công, chiến đấu/AFK online-only, thế giới NPC và nhiều hệ phụ về sau. Thế giới trực quan là phần cốt lõi; popup là công cụ bổ sung. Không thiết kế server microservices/ECS phức tạp trước khi có bằng chứng cần.

**Giữ nguyên trách nhiệm TD:** TD-01 Character/EXP/Tu Vi/Destiny; TD-02 damage/Dao/Techniques; TD-03 online activity, navigation, Quest FSM; TD-04 authored content/economy/items/NPC/shop; TD-05 biểu hiện hình ảnh + quy trình art. Ranh giới này áp dụng cả khi module nằm trong cùng repo/server. Chỉ owner mới duyệt thay đổi canon, production art và thao tác dữ liệu thật.

**Mục tiêu kỹ thuật:** thêm nội dung mới chủ yếu bằng data packs + validation + visuals + tests; thêm cơ chế mới bằng feature module độc lập, không dồn code vào `worldEngine.ts`, `zoneRoom.ts` hay `game-data/index.ts`. Tham chiếu bằng **stable ID** chứ không tham chiếu tên tiếng Việt hoặc tọa độ tùy hứng. Đảm bảo tính toàn vẹn server và version của save/content.

## 2. Kiến trúc thực thi: Modular Monolith + Content Packs + Authoritative Events

```text
Browser Phaser/DOM
  Intent (authenticated, requestId)
       ↓
Colyseus transport (ZoneRoom + typed routes)
       ↓
Application command/service (actor, permission, validation)
       ↓
Single domain owner (TD-01..04; deterministic rules)
       ↓
Single DB transaction + idempotency/event receipt
       ↓
Committed authoritative event + versioned state/snapshot
       ↓
Replicated view model → Phaser World + HUD (TD-05)

TD-04 Content Pack → validated IDs/conditions/rewards → authoritative domain
TD-05 Visual Binding + Asset Manifest → authored Tiled/Phaser presentation
```

- **Definition** (dữ liệu bất biến): QuestDef, TechniqueDef, RecipeDef, MonsterDef, NPC, Zone, EventDef, VisualProfile. Không chứa script tùy ý, không mutate player state.
- **Mutable State** (tồn tại trong DB / runtime được kiểm soát): Character, QuestInstance, Inventory, OwnedTechnique, CraftJob, HomesteadPlot, PetInstance, WorldEventInstance. Chỉ server được ghi; phiên bản dữ liệu tách biệt catalog.
- **Intent** (yêu cầu người chơi): acceptQuest, chooseDialogue, equipTechnique, startCraft, mountPet... có auth + authorization + nonce/idempotency.
- **Domain Event** (sự kiện server xác thực đã xảy ra): `MonsterKilled`, `ItemObtained`, `QuestAccepted`, `QuestTurnedIn`, `CraftCompleted`, `WorldPhaseChanged` (chỉ định nghĩa khi thực sự triển khai). Sự kiện không đồng nghĩa quyền tự nhận reward; mọi consumer phải kiểm tra trạng thái/prerequisite và idempotency.
- **Visual Cue**: view model hoặc event presentation (`CombatHit`, `QuestMarkerChanged`, `CraftStationActive`) để client render. Visual không quyết định kết quả gameplay.

**Luồng reward:** không có nhiều service cùng trực tiếp `grantItem()`/`grantExp()` tùy tiện. Một Reward/Entitlement authority tạo hóa đơn nguồn `sourceEventId`, kiểm tra quyền hưởng và commit đúng một lần. Ban đầu xử lý cùng transaction PGlite/PostgreSQL, chỉ cân nhắc outbox khi thật sự có consumer bền vững bất đồng bộ; không cần Kafka/Redis/microservices lúc này.

## 3. Cây thư mục đã triển khai (`ARCH-FOUNDATION-02`, `COREKIT-CANON-02` & `S1-ENTRY-VISUAL-REBUILD-01`) + điểm mở rộng

Các module của game hiện tại (`Character v0.2` `S1-A`..`S1-E`, `VISUAL-03-W`, `HERO-ANIMSET-01`, `S1-ENTRY-VISUAL-REBUILD-01`, và hệ thống `v0.1` giữ lại) đã được tách thành các feature/catalog/transport/infrastructure modules thực thụ, trong khi các đường dẫn gốc (`apps/server/src/{db,worldEngine,zoneRoom,characterV02Actions,characterV02Repository,guestIdentity}.ts` và `apps/client/src/{WorldScene,hud,network,characterCreation,audio}.ts`) được giữ làm compatibility locators mỏng phục vụ import cũ và kiểm thử.

```text
apps/
  client/
    src/
      main.ts
      styles.css
      app/
        GameBootstrap.ts
      game/
        WorldScene.ts
        assets/
          RuntimeAssetBindings.ts
          SpriteProfiles.ts
          runtimeAnimationProjection.json
        world/
          MapView.ts
          ActorViewSystem.ts
          CameraView.ts
          MinimapView.ts
        combat/
          CombatVisuals.ts
          AnimationRegistry.ts
        input/
          PlayerInput.ts
        debug/
          WorldDebugController.ts
      network/
        GameNetworkClient.ts
      features/
        entry/
          EntryFlowController.ts
          TitleAndRosterViews.ts
        character/
          CharacterCreationView.ts
          CharacterPanel.ts
        shops/
          HudShell.ts
      ui/
        HudShell.ts
        ports.ts
      audio/
        audio.ts
      WorldScene.ts
      hud.ts
      network.ts
      characterCreation.ts
      audio.ts

  server/
    src/
      index.ts
      app/
        createGameServer.ts
      transport/
        colyseus/
          ZoneRoom.ts
        http/
          registerHttpRoutes.ts
          registerCharacterHttpRoutes.ts
      features/
        character/
          CharacterService.ts
          CharacterCreationCommands.ts
          CharacterProgressionCommands.ts
          CharacterRepository.ts
          CharacterValidation.ts
          CharacterSnapshot.ts
        destiny/
          DestinyRoller.ts
          DestinyOwnership.ts
        combat/
          LegacyCombatService.ts
        quests/
          LegacyQuestService.ts
        economy/
          LegacyCommerceService.ts
      infrastructure/
        database/
          DbPorts.ts
          PgAdapter.ts
          LegacyWorldPorts.ts
          RequestReceiptStore.ts
          migrations/
            multiCharacterV02Migration.ts
      runtime/
        world/
          WorldRuntime.ts
          MonsterRuntime.ts
      db.ts
      worldEngine.ts
      zoneRoom.ts
      characterV02Actions.ts
      characterV02Repository.ts
      guestIdentity.ts

packages/
  shared/
    src/
      protocols/
        entry/
          index.ts
        character.ts
        legacyWorld.ts
        common.ts
      types/
        character.ts
        legacyWorld.ts
      index.ts

  game-data/
    src/
      catalogs/
        realms.ts
        destinies.ts
        appearances.ts
        npcs.ts
        items.ts
        recipes.ts
        world.ts
        quests.ts
        techniques.ts
      rules/
        characterContracts.ts
        characterProgression.ts
        statPipeline.ts
        destinyModifiers.ts
        legacyProgression.ts
      td01Numeric.ts
      runSimulation.ts
      index.ts

  art-tools/
    verify_manifest.ts
    build_assets.py
    corekit/
      validateCorekit.ts
      index.ts
    legacy/
      build_assets.py

maps/
assets/
  corekit/
    v01b/
      catalog.json
      COREKIT_INDEX.md
      profiles/
      references/
  ui/
  archive/
    history/
scripts/
  verify-architecture.mjs
  package-runtime-assets.mjs
  verify-doc-sync.mjs
tests/
  e2e/
```

**Lưu ý module layout:** Các feature mới ở `S2`–`S8` (`content/main-story/*`, `features/activities/*`, `features/crafting/*`, v.v.) chỉ được tạo khi slice tương ứng được thực thi.

## 4. Quy tắc dependency và ownership

| Thành phần | Được import | Không được làm |
|---|---|---|
| `packages/shared` | Types, IDs, schemas thuần; không phụ thuộc apps | Import DB, Phaser, Colyseus runtime, server secrets |
| `packages/game-data` | Shared types + pure rules/catalogs | Import `apps/client`, `apps/server`; side effects/IO khi import catalog |
| Client `features/` | Public contracts, public catalog projection, network facade, UI/view helpers | Ghi DB, quyết định damage/reward/quest completion, import server |
| Client `game/` | Asset manifest, public snapshots, presentation events, Phaser | Tự phát thưởng/đổi quest state; thay server physics authority |
| Server `transport/` | Verify session, normalize intent, call one application action | Business rules, SQL CRUD, loot roll trực tiếp trong `ZoneRoom` |
| Server `features/` | Domain rules và typed ports/repository, transaction/unit-of-work khi cần | Cross-write domain khác bằng SQL raw; nội dung NPC if-else hardcode |
| Server `infrastructure/` | Driver, auth, clock, persistence, request ledger | Chứa game-design constants, gameplay quyết định |
| `content/` | Declarative definitions từ registry/contracts | Dynamic `eval`, executable JS untrusted, mutate state hoặc trực tiếp gửi SQL |

**Kiểm tra tự động import boundaries & zero-cycle (`npm run verify:architecture`):** `scripts/verify-architecture.mjs` (cùng bộ test âm tính `scripts/tests/verify-architecture.test.mjs`) kiểm tra toàn bộ đồ thị import thực tế của `packages/shared`, `packages/game-data`, `apps/server`, và `apps/client`:
- `0` chu trình import (`0` circular dependencies).
- Cấm nội bộ package import lại barrel `src/index.ts` của chính package đó.
- Cấm `packages/shared` import bất kỳ workspace package nào khác; cấm `packages/game-data` import `apps/*`; cấm `apps/client` và `apps/server` import lẫn nhau.
- Cấm SQL trực tiếp trong `apps/server/src/transport/**`.

**Giữ một nguồn sự thật:** Shared contracts là API, server data source là sự thật runtime, content catalog là source of authored facts, TD specs là luật thiết kế. Không lưu thêm derived attack trong save nếu có thể tính từ nguồn stat/equipment/buff; không nhân đôi Quest FSM vào content pack hoặc Auto Farm.

## 5. Cách mở rộng content: thêm nhiệm vụ, võ kỹ, công pháp mà không phình engine

### Ví dụ A — Thêm nhiệm vụ Chương 1

1. Viết `QuestDef` mới trong `content/main-story/chapter-01/quests.ts` với stable ID, version, 5-category chuẩn (ví dụ `main`), condition tree, objective refs, rewardTable ID, manual submit. Không viết `if (questId === ...)` trong `ZoneRoom`.
2. Dialogue/branch ở file pack cùng chương; stable NPC/location IDs; không leak special/Legendary info.
3. Sử dụng **Quest FSM duy nhất của TD-03**, credit từ một server committed event có source ID; auto-kill online có thể tăng counter nếu quest đang ACTIVE; đối thoại/chọn/nhận/trả luôn thủ công.
4. Bổ sung/world-bind NPC/object marker ở `content/regions` + Tiled object ID nếu có nội dung mới; nối render role/asset reference theo TD-05.
5. Validator kiểm tra điều kiện, phần thưởng, target IDs, prerequisite Main Quest không chứa signature gate, visual binding; test new pack + Playwright một hành trình thật.
6. Nếu chỉ thêm một quest dùng các objective/effect kind có sẵn, **không sửa QuestEngine, ZoneRoom, worldEngine**. Chỉ tạo feature code mới khi có action primitive chưa được hỗ trợ và owner duyệt semantics.

### Ví dụ B — Thêm Công pháp / Võ kỹ

- `TechniqueDef` ở catalog tương ứng; các trường: kind `cultivation_method` hay `martial_skill`, một trong sáu phẩm, requirements, Dao path nếu là võ kỹ, cost/cooldown/typed EffectDef, art/VFX keys. Không nhầm sáu phẩm kỹ thuật với bốn phẩm Destiny.
- Công pháp tác động cultivation/stat snapshot bằng approved typed modifiers; võ kỹ invoke TD-02 common combat resolver. Không tự implement một damage formula trong từng skill; cùng resolver cho manual cast và online Auto Farm.
- Tạo visual icon + cast/impact animation nếu là kỹ năng xuất hiện trong thế giới; client chỉ play theo server action/event. Không để một kỹ năng chỉ có tooltip và damage log.

### Ví dụ C — Thêm nghề phụ hoặc hệ thống không có trong MVP

Tạo feature module mới `features/<capability>` chỉ sau khi owner duyệt cơ chế. Gắn vào những primitives đã có: `RecipeDef`, `StationDef`, `InventoryTransaction`, `ConditionDef`, `RewardReceipt`, `WorldLocation/Instance`, `VisualBinding`. Không tạo `global professions god service` cho mọi nghề. Luyện đan có thể dùng chung **craft job/ingredients/station API** với nấu ăn; khác biệt về thành công, phẩm cấp, thời gian… đặt trong rule module riêng theo quyền duyệt. Chế tạo trang bị có rule/gear slot riêng; không buộc dùng chung một enum phẩm cấp với công pháp.

## 6. Extension points tương lai — kiến trúc sẵn sàng, nội dung CHƯA được duyệt

| Ý tưởng sau MVP | Extension/module dự kiến | Dữ liệu/điều kiện/visual tối thiểu |
|---|---|---|
| Động phủ cá nhân, nhà cửa | `features/housing` hoặc `homestead`; `world/instances` | `PlotInstance`, owner/visitor ACL, instanceId, furnishing/decor, persist layout, interiors/maps/objects |
| Trồng trọt, thảo dược | `features/farming` + crafting/resources | plot, growth stage, clock dependency, harvest receipt, sprite states; **không tự cấp offline combat rewards** |
| Luyện đan | `features/crafting/alchemy` | recipe/station/ingredients/job, outcome authority, cauldron + VFX |
| Luyện khí, phù thuật, nghề phụ | `features/crafting/<specialty>` | shared crafting port, specialty rules, profession progression chưa duyệt |
| Nấu ăn | `features/crafting/cooking` + `content/food` | cookbook, kitchen station, QualityDef, Food Catalog discovery, Phì Đế compatibility |
| Bí Cảnh chiến đấu | `features/instances` + `features/combat` | instance lifecycle, gate, party, enemies, shared combat, rewards |
| Bí Cảnh giải đố | `features/instances` + `features/interactions` | scripted typed puzzles, explicit manual choices, no auto-skip |
| Linh thú | `features/companions` | owned pet, summon/loadout/AI policy, server actor, approved sprite/animation |
| Vật cưỡi | `features/mounts` + world movement | mount entitlement, movement cap, actor visual/speed, collision/portal restrictions |
| Xa phu/điểm chuyển vùng | `features/travel` + world graph + NPC shop | server-authorized paid travel, interaction/price/transition, visual station |
| Bảng xếp hạng | `features/leaderboards` (read model) | authoritative metrics, periodic snapshots, ties, anti-cheat, pagination; không viết vào Character source of truth |
| Sự kiện theo server time | `features/world-time` + `features/events` | one authoritative clock, time windows, event instance IDs, restart-safe activation, zone spawn/visual |
| Ngày/đêm, trăng tròn | `world-time` + `world/spawn policies` + `ConditionDef` | **phân biệt** in-game day/night, real UTC timestamp, lunar phase; server kiểm tra, client chỉ nhận visual phase |
| Hậu Thiên kích hoạt đêm trăng | `features/destiny` + `conditionEvaluator` + committed reward receipt | ownership/gate/time window, one-grant invariant, visual ceremony; nội dung chỉ sau khi owner duyệt |

**Cực kỳ quan trọng với thời gian:** `WorldClock` là nguồn server testable (`now()` injectable), nhưng phải quyết định riêng liệu "ngày/đêm" là game-time nhanh, ngày thực hay lịch sự kiện; **không tự đồng nhất với đồng hồ trình duyệt**. Một sự kiện chỉ được áp dụng nếu source-event/time window được server xác minh; client không thể tua giờ lấy thưởng. `periodKey`/`scheduleId` phiên bản hóa, resume/restart idempotent. Không auto chơi nhiệm vụ và không tự quyết offline activities mới khi chưa được duyệt.

## 7. Biểu diễn hình ảnh TD-05 & hiệu năng runtime

**Phần visual đã được thiết kế bắt buộc xuyên S1–S8**, không đợi S7: `VISUAL_CONTENT_CONTRACT`, `WORLD_SCENE_ASSEMBLY`, `ANIMATION_VFX_FEEDBACK`, `UX_WORLD_FIRST`, và 12-beat `TD05_VERTICAL_SLICE_ACCEPTANCE` A–L. S7 là production-art/human approval pack gate; S8 là tích hợp trình diễn sản phẩm.

**Separation (`apps/client/src/game/**` & `apps/client/src/ui/**`):**
- `WorldScene` (`apps/client/src/game/WorldScene.ts`) điều phối Phaser lifecycle và uỷ quyền sang `MapView`, `ActorViewSystem`, `CameraView`, `MinimapView`, `WorldAssetLoader`, `AnimationRegistry`, `CombatVisuals`, `PlayerInputController`, và `WorldDebugHook`.
- `MapView` load layer Tiled, world ground/occlusion và prop/building landmarks (`building_tan_thu_tu_duong`, `building_tu_bao_cac`, `building_hong_tran_cac`, `prop_*`); `ActorViewSystem` giữ entityId→SpriteView mapping, Y-sort, interpolation, visibility; `CombatVisuals` dựng windup/contact/hurt/death từ server event; `CameraView` và `MinimapView` thực thi `CAMERA_AND_MINIMAP_CONTRACT.md`.
- `HudController` (`apps/client/src/ui/HudShell.ts`) và `HudPorts` (`apps/client/src/ui/ports.ts`) điều phối các panel DOM (`CharacterCreationView`, `CharacterPanel`, `ShopPanel`); đóng overlay vẫn thấy map 2D vận hành đúng.
- `SpriteProfiles.ts` tiêu thụ `runtimeAnimationProjection.json` được biên dịch từ `assets/corekit/v01b/profiles/animation.json` và được kiểm tra bởi `packages/art-tools/corekit/validateCorekit.ts`.
- `scripts/package-runtime-assets.mjs` (`npm run package:runtime-assets`, tích hợp trong `npm run build`) đóng gói tất cả runtime `/assets/...` và `/maps/...` vào `apps/client/dist/` để production build tự chủ (`0` lỗi 404).

**Multi-Session Load & Runtime Verification (`ARCH-FOUNDATION-02` / `ARCH-COREKIT-R1`):** Xác minh tự động với 20 phiên Colyseus đồng thời trong `ZoneRoom` + 2 trình duyệt thực (`1280x720` desktop & `390x844` mobile) qua `tests/e2e/runArchFoundationVerification.ts` (`artifacts/architecture/ARCH-FOUNDATION-02/verification_report.json`): toàn bộ Vitest suite pass (`58/58` tests across 6 files), `0` lỗi console/pageerror, `0` HTTP 404 trên clean `dist`. Đo đạc FPS/frame-time thực tế với đầy đủ metadata môi trường được thực hiện ở bước `VISUAL-03-Q` sau khi hoàn tất tích hợp `VISUAL-03-U`.

**Production art (`COREKIT-CANON-02` / `ARCH-COREKIT-R1`):** Toàn bộ 50 runtime assets hiện hành và 15 reference masters (`HUMAN_APPROVED`) được khóa trong `assets/corekit/v01b/catalog.json` và kiểm tra tự động qua `npm run verify:assets` (`verify_manifest.ts` + `validateCorekit.ts`). `packages/art-tools/build_assets.py` đã bị vô hiệu hóa (`exit code 2`).

## 8. Trạng thái modularization thực tế (`ARCH-FOUNDATION-02` + `COREKIT-CANON-02` + `ARCH-COREKIT-R1`) vs. Compatibility Locators vs. Target-Only

| Phân loại | Đường dẫn / Thành phần | Trạng thái thực tế trên đĩa |
|---|---|---|
| **Implemented (`packages/shared` & `packages/game-data`)** | `packages/shared/src/protocols/{character,legacyWorld,common}.ts`, `packages/shared/src/types/{character,legacyWorld}.ts`, `packages/game-data/src/catalogs/{realms,destinies,appearances,npcs,items,recipes,world,quests,techniques}.ts`, `packages/game-data/src/rules/{characterContracts,characterProgression,statPipeline,destinyModifiers,legacyProgression}.ts`, `packages/game-data/src/td01Numeric.ts` | Đã tách hoàn chỉnh toàn bộ protocol types, catalogs, và pure rules; `packages/shared/src/index.ts` và `packages/game-data/src/index.ts` là pure re-export barrels (`0` circular imports). |
| **Implemented (`apps/server`)** | `apps/server/src/app/createGameServer.ts`, `apps/server/src/infrastructure/database/{DbPorts,PgAdapter,LegacyWorldPorts}.ts`, `apps/server/src/features/character/{CharacterService,CharacterCreationCommands,CharacterProgressionCommands,CharacterRepository,CharacterValidation,CharacterSnapshot}.ts`, `apps/server/src/features/destiny/{DestinyRoller,DestinyOwnership}.ts`, `apps/server/src/features/combat/LegacyCombatService.ts`, `apps/server/src/features/economy/LegacyCommerceService.ts`, `apps/server/src/features/quests/LegacyQuestService.ts`, `apps/server/src/runtime/world/WorldRuntime.ts`, `apps/server/src/transport/colyseus/ZoneRoom.ts`, `apps/server/src/transport/http/registerHttpRoutes.ts` | Đã tách hoàn chỉnh persistence (`DbPorts`, `PgAdapter`, `LegacyWorldPorts`), domain services theo narrow typed ports, `WorldRuntime` orchestrator, và `ZoneRoom` transport (`0` SQL trực tiếp). `POST /api/test/advance-clock` không được đăng ký theo mặc định (`404`) trừ khi bật tường minh `enableTestClockApi: true` / `ENABLE_TEST_CLOCK_API=true`. |
| **Implemented (`apps/client`)** | `apps/client/src/app/GameBootstrap.ts`, `apps/client/src/network/GameNetworkClient.ts`, `apps/client/src/game/{WorldScene,assets/*,world/*,combat/*,input/PlayerInputController,debug/WorldDebugHook}.ts`, `apps/client/src/features/character/{CharacterCreationView,CharacterPanel}.ts`, `apps/client/src/ui/{HudShell,ports}.ts`, `apps/client/src/audio.ts`, `apps/client/src/style.css` | Đã tách Phaser `WorldScene` sang các hệ thống con (`MapView`, `ActorViewSystem`, `CameraView`, `MinimapView`, `WorldAssetLoader`, `AnimationRegistry`, `CombatVisuals`, `PlayerInputController`, `WorldDebugHook`) và `HudController` sang các feature panels (`CharacterCreationView`, `CharacterPanel`, `ShopPanel`). Debug globals (`window.__tongMonWorldScene` / `window.__tongMonHud`) chỉ bật ở `DEV` hoặc khi có `?e2e=1`. |
| **Implemented (`assets/corekit/v01b` & Validators)** | `assets/corekit/v01b/catalog.json`, `packages/art-tools/corekit/validateCorekit.ts`, `scripts/verify-architecture.mjs`, `scripts/package-runtime-assets.mjs`, `scripts/tests/{verify-architecture,package-runtime-assets,verify-corekit}.test.mjs` | Đã cài đặt bộ Core Kit V01-B chuẩn tắc, dọn 334 file rác/trùng lặp (+ 6 alias slot ánh xạ về file socket chuẩn trong `batch_a_ui_atlas_mapping.json`), lưu trữ 25 file lịch sử vào `assets/archive/history/`, khóa `build_assets.py` (`exit code 2`), và tích hợp bộ kiểm tra kiến trúc + đóng gói static assets. |
| **Retained Thin Compatibility Locators** | `apps/server/src/{db,worldEngine,zoneRoom,characterV02Actions,characterV02Repository,guestIdentity}.ts`, `apps/client/src/{WorldScene,hud,network,characterCreation,audio}.ts` | Giữ làm các file re-export mỏng để bảo toàn hoàn toàn tương thích ngược với bộ test hiện hữu. |
| **Target-Only / Chưa triển khai (`S2`–`S8`)** | `packages/game-data/src/content/*`, `packages/game-data/src/definitions/{quests,techniques,recipes,events}.ts` (v0.2), `apps/server/src/features/{activities,crafting}/*`, `.github/workflows` CI | Chỉ là hướng kiến trúc mục tiêu khi triển khai các slice `S2`–`S8` hoặc khi được giao task riêng. |

## 9. Scope-Based Allowlist — owner đã duyệt hướng vận hành

```yaml
TASK:
  mode: EXECUTE
  code_scope:
    edit_existing:
      - apps/server/src/characterV02Actions.ts
      - apps/client/src/hud.ts
    create_within:
      - apps/server/src/features/character/**
      - apps/server/src/features/destiny/**
      - apps/client/src/features/character/**
      - packages/game-data/src/catalogs/**
      - packages/game-data/src/rules/**
    protect:
      - docs/systems/**
      - frozen-technical-design-specs
      - player-databases
      - unrelated-features
  docs_sync:
    required_on_milestone_or_arch_change:
      - docs/implementation/FEATURE_LEDGER.md
      - docs/PROJECT_STATUS.md
      - docs/NEXT_ACTIONS.md
      - docs/MASTER_PROJECT_PLAN.md
      - docs/ROADMAP.md
      - docs/tong-mon-8d-project-atlas.html
      - docs/CONTEXT_INDEX.md
    implementation_policy:
      - docs/technical/SOURCE_ARCHITECTURE.md
      - docs/technical/AGENT_EXECUTION_CONTRACT.md
  skills:
    primary:
      - mmorpg-server-integrity
    fallback: minimal_safe_task_relevant
  commit_policy: COMMIT_AND_PUSH_AFTER_CHECKS
```

`create_within` **không** phải quyền tạo mọi thứ trong folder, chỉ những file thực sự cần để đạt acceptance đã duyệt; không cho tự thay gameplay canon, frozen TD, live data, production art, external APIs. Argon báo danh sách path thực tế và kiểm tra `git diff --name-only` trước stage. Khi cần mở sang một feature khác, schema migration nguy hiểm, public API break, hoặc bảo vệ khác → stop/escalate đúng phần bị vướng. Hãy cung cấp *scope allowlist* hợp lý (không hạn chế tạo file con hợp lệ) thay vì chỉ cho chỉnh file dài hiện có.

## 10. DOC SYNC pipeline — chống stale roadmap một cách có cấu trúc

**Single authoritative status chain:** Git commit/CI evidence → `FEATURE_LEDGER` (bằng chứng, task, lịch sử) → `PROJECT_STATUS` (snapshot hiện tại) → `NEXT_ACTIONS` (blocker/next) → `MASTER_PROJECT_PLAN` (mốc/phase) → `ROADMAP` (milestone navigation) → Atlas (tổng quan trực quan). Không để tài liệu dưới cùng phủ định dữ liệu Git và ledger. Thiết kế/canon vẫn thuộc DECISIONS/TD; status không được tự thay canon.

**Minimum required sync triggers:**
- Mỗi task gameplay có checkpoint: FEATURE_LEDGER, PROJECT_STATUS, NEXT_ACTIONS; nếu gate/slice phase thay đổi còn MASTER_PROJECT_PLAN, ROADMAP, Atlas. Với phần kiến trúc/phụ thuộc thay đổi phải xét MASTER_PROJECT_PLAN và CONTEXT_INDEX.
- Nếu doc **cần** đổi mà không được sửa theo scope → `DOC_SYNC_BLOCKED` nêu rõ path và lý do **trước closeout**, không quietly skip; owner-approved docs scope phải bao gồm đường dẫn đó ở lượt dispatch. Không nên mở quyền `docs/**` vô điều kiện.
- Commit chưa tồn tại khi đang soạn ledger: `SELF_COMMIT` là hợp lệ *trước push*, nhưng báo cáo sau push phải ghi SHA thực; commit kế tiếp có thay đổi thực sự sẽ backfill SHA của commit trước (không tạo commit rỗng chỉ để ghi SHA). MASTER_PROJECT_PLAN/ROADMAP nên dùng **phase status** chứ không tự chôn SHA từng subtask vào nhiều chỗ.
- `scripts/verify-doc-sync.mjs` (`npm run verify:doc-sync`) thực hiện kiểm tra cơ học: xác minh 40 file Freeze nguyên vẹn so với `39c41a6ddb77b93284c56da7ec053f4309ee4943`, kiểm tra sự tồn tại của các file kiến trúc/archive/locator bắt buộc, và kiểm tra cú pháp inline JavaScript của `docs/tong-mon-8d-project-atlas.html` qua `new vm.Script(...)`. Công cụ này **không** phải bộ phân tích ngữ nghĩa toàn văn và không dùng regex blacklist cứng để chặn lịch sử hợp lệ hoặc cấm định dạng `S1-F` tương lai; việc đối chiếu nhất quán trạng thái giữa các tài liệu là bước self-review có phạm vi của agent trong mỗi task.
- Phân biệt sự thật thời điểm *before commit* và *after remote closeout*, đặc biệt Atlas snapshot.

## 11. CI/tests, versioning và đặc thù multiplayer RPG

- Kiểm thử thuần: catalog/schema validation, Condition/Effect interpreter, RNG, modifiers, deterministic rules.
- Contract: messages, protocol versions, client/server compatibility, stable content IDs, content pack dependency references.
- DB: local isolated PGlite, atomic reward grant, concurrency/replay, migration smoke, restart/reconnect, no live DB.
- Integration: Colyseus server actions, Quest FSM legal event credit, one-source reward delivery, multi-tab controller lease, owner-only/private space ACL.
- Browser: two clients, 1280×720/390×844, Tiled world visuals, actual interaction, screenshot, performance profile at representative scale (`tests/e2e/runArchFoundationVerification.ts`).
- Import boundaries and no-cycle check (`npm run verify:architecture`), TS typecheck/build (`npm run typecheck`, `npm run build`), asset provenance/manifest + Core Kit (`npm run verify:assets`), changed-path scope/frozen 40 docs (`npm run verify:doc-sync`).
- Data versions: `ContentPackDef.id/version`, ruleset version, persisted schema version, saved quest acceptedVersion, immutable stable IDs. Old content pack removal requires compatibility story; versioned changes never silently rewrite ongoing quests.
- Target GitHub Actions: install locked deps, typecheck, focused/full tests by impact, production build+asset validation, `verify:doc-sync` and `verify:architecture` when tools exist; artifact export from failing CI. No CI is currently proved present at audited HEAD (`.github/workflows` absent from tree).

## 12. Trạng thái duyệt và lộ trình thực hiện

- **Đã hoàn tất tại `7b386ce` (`VISUAL-03-W`) + `HERO-ANIMSET-01` (`DEC-009`) + `ARCH-FOUNDATION-02` + `COREKIT-CANON-02` + `ARCH-COREKIT-R1` (`NO_COMMIT`):** hoàn thành tách kiến trúc modular monolith cho toàn bộ tính năng hiện hữu (`packages/shared`, `packages/game-data`, `apps/server`, `apps/client`), tích hợp `scripts/verify-architecture.mjs` + `scripts/package-runtime-assets.mjs`, khoá `/api/test/advance-clock` sau `enableTestClockApi: true` / `ENABLE_TEST_CLOCK_API=true` (`404` mặc định), cài đặt `assets/corekit/v01b/catalog.json` + `packages/art-tools/corekit/validateCorekit.ts`, vô hiệu hóa `packages/art-tools/build_assets.py` (`exit code 2`), và dọn sạch 334 file rác/trùng lặp + lưu trữ lịch sử vào `assets/archive/history/`.
- **Chưa phải scope triển khai:** các hệ farm/housing/pets/events/crafting/leaderboards trong bảng §6 và các hệ `S2`–`S8` chưa triển khai; không tạo code/state/database schema cho chúng khi chưa có task được owner duyệt.
- **Chuỗi thực thi `S1-VISUAL-TO-ACCEPTANCE` (`docs/NEXT_ACTIONS.md`):** `ARCH-COREKIT-R1` -> `VISUAL-03-U` (tích hợp UI V01-B cho Character Creation, tiên thiên destiny roll, `[C]` panel và HUD chrome) -> `VISUAL-03-Q` (đo đạc thực tế chất lượng hình ảnh/FPS của `VISUAL-03`) -> `S1-F` (technical proof với 2 client + file-backed restart) -> trình owner quyết định cổng cuối `S1_EXPERIENCE_AND_ACCEPTANCE`. Từ `S2` trở đi tiếp tục mở rộng trên khung modular đã thiết lập.

### Source anchors

- `AGENTS.md` §2; `RULES.md` Rules 3–6
- `docs/technical/TD_FREEZE_CONTRACT_MAP.md`; `docs/technical/TD_FREEZE_APPROVALS.md`
- `docs/systems/CONTENT_REGISTRY.md`, `QUEST_ENGINE.md`, `QUEST_CONTENT.md`, `TECHNIQUES.md`, `WORLD_CONTENT.md`
- `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/{WORLD_SCENE_ASSEMBLY,ANIMATION_VFX_FEEDBACK,UX_WORLD_FIRST,AI_ASSET_PRODUCTION}.md`
- `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md` (A–L)
- `.agents/skills/{rpg,mmorpg-server-integrity,game-ui-frontend,game-playtest,phaser4-scenes,phaser4-animations,phaser4-tilemaps,world-and-map-qa,ai-art-production,pixel-art-director}/SKILL.md`, routed through `AGENT_SKILL_ROUTER.md`
- Source code (`7b386ce` + `ARCH-FOUNDATION-02` + `COREKIT-CANON-02` + `ARCH-COREKIT-R1`): `apps/{server,client}/src`, `packages/{shared,game-data,art-tools}`, `assets/corekit/v01b`, `scripts/*`, `tests/e2e`.
