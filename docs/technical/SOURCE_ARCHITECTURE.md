# Tông Môn 8D — Source Architecture (Owner-Approved Direction)

> **Trạng thái:** OWNER-APPROVED ARCHITECTURE DIRECTION — Selective `PRE-S1F` modularization committed at `b82e20b148ad08544c3efd1003d1111364a45e51` (`b82e20b`). Unbuilt target directories and post-MVP gameplay examples remain `TARGET / EXTENSION POINTS`, not implemented features.
> **Cơ sở audit:** `master@a3de0549350e003019d17cef47833a8aa2943b38` (`S1-E`) và refactor chọn lọc `PRE-S1F` tại `b82e20b148ad08544c3efd1003d1111364a45e51` (`b82e20b`), đối chiếu `AGENTS.md`, `RULES.md`, `docs/DECISIONS.md`, TD-01…TD-05, `docs/CONTENT_PIPELINE.md`, game/UX/visual docs và workspace skills.
> **Phạm vi duyệt:** Chủ dự án đã duyệt hướng *modular source architecture*, *scope-based allowlist*, *refactor Character có chọn lọc* (`b82e20b`), và *đồng bộ status docs* (`DOC-CLEAN-01`). **Bản kiến trúc mục tiêu này không tự ủy quyền thực thi các hệ thống hậu MVP**, không chỉnh 40 frozen TD Markdown, không thay đổi gameplay canon.

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

## 3. Cây thư mục mục tiêu — tạo dần theo tính năng

Các thư mục dưới đây là **target layout**, không phải lệnh tạo hàng trăm file rỗng ngay. `src/index.ts` vẫn là entrypoint/compatibility re-export sau khi tách; code cũ được dịch chuyển có test, không rewrite tất cả.

```text
apps/
  client/
    src/
      main.ts
      app/
        GameBootstrap.ts
        GameSession.ts
      game/
        WorldScene.ts
        world/
          MapView.ts
          ActorViewSystem.ts
          InteractionMarkers.ts
          CameraView.ts
        combat/
          CombatVisuals.ts
          AnimationRegistry.ts
          VfxPool.ts
        input/
          PlayerInput.ts
      network/
        GameNetworkClient.ts
        roomMessageRouter.ts
      features/
        character/
          CharacterCreationView.ts
          CharacterPanel.ts
        quests/
          QuestTracker.ts
          QuestJournal.ts
        cultivation/
          CultivationPanel.ts
        inventory/
          InventoryPanel.ts
        shops/
          ShopPanel.ts
      ui/
        HudShell.ts
        ModalHost.ts
        common/
      styles/
        hud.css
        character.css

  server/
    src/
      index.ts
      transport/
        colyseus/
          ZoneRoom.ts
          handlers/
        http/
      features/
        character/
          CharacterService.ts
          CharacterRepository.ts
          CharacterValidation.ts
          CharacterSnapshot.ts
        destiny/
          DestinyRoller.ts
          DestinyOwnership.ts
        cultivation/
        combat/
        quests/
        activities/
        navigation/
        world/
        inventory/
        economy/
        crafting/
      infrastructure/
        database/
          DbHost.ts
          SqlTransaction.ts
          PGliteAdapter.ts
          PgAdapter.ts
          migrations/
        auth/
          GuestIdentity.ts
        time/
          Clock.ts
        idempotency/
          RequestReceiptStore.ts
      runtime/
        world/
          WorldRuntime.ts
          ZoneRuntime.ts
          MonsterRuntime.ts

packages/
  shared/
    src/
      ids/
      protocols/
        character.ts
        combat.ts
        world.ts
        quest.ts
      snapshots/
      index.ts

  game-data/
    src/
      definitions/
        quests.ts
        techniques.ts
        recipes.ts
        events.ts
      catalogs/
        realms.ts
        destinies.ts
        techniques.ts
        items.ts
        monsters.ts
        npcs.ts
        zones.ts
      content/
        main-story/
          chapter-01/
            quests.ts
            dialogue.ts
            placements.ts
        regions/
          tan-thu-thon/
          thanh-truc-lam/
        legendary/
          phi-de/
        professions/
        events/
      rules/
        characterProgression.ts
        statPipeline.ts
        destinyModifiers.ts
        conditionEvaluator.ts
      registry/
        registerContentPacks.ts
        validateContentPacks.ts
      index.ts

  art-tools/

maps/
assets/
docs/
  technical/
    SOURCE_ARCHITECTURE.md
  implementation/
tests/
  e2e/
```

**Lưu ý module layout:** Một feature nhỏ có thể chỉ có `index.ts` và `*.test.ts`; không bắt buộc đủ tầng Controller/Service/Repository. Đưa DB adapter vào infrastructure có thể là bước sau, không bắt tạo khung trống. `packages/game-data/src/rules/` trước mắt chứa pure functions; nếu công thức/progression lớn đáng kể có thể tách `packages/game-rules/` ở một quyết định kiến trúc riêng. Không bắt dựng package mới chỉ để đạt mẫu cây thư mục.

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

**Không tạo import vòng:** Ở `PRE-S1F` (`b82e20b`), import vòng trực tiếp `td01Numeric.ts ↔ index.ts` đã được gỡ bỏ: `packages/game-data/src/td01Numeric.ts` hiện import trực tiếp từ `./catalogs/destinies.js` và `./rules/characterContracts.js`, còn `packages/game-data/src/index.ts` re-export các leaf modules đó. Quy tắc bắt buộc cho các module tiếp theo: chuyển shared pure validations sang leaf modules, cấm nội bộ import barrel `index.ts` của chính package. Kiểm tra import-cycle tự động trong CI vẫn là mục tiêu tương lai.

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

**Phần visual đã được thiết kế bắt buộc xuyên S1–S8**, không đợi S7: `VISUAL_CONTENT_CONTRACT`, `WORLD_SCENE_ASSEMBLY`, `ANIMATION_VFX_FEEDBACK`, `UX_WORLD_FIRST`, và 12-beat `TD05_VERTICAL_SLICE_ACCEPTANCE` A–L. S7 là production-art/human approval pack gate; S8 là tích hợp trình diễn sản phẩm. Hiện S1-E có overlay/HUD và world sprite, không đồng nghĩa visual production sign-off.

**Separation:**
- `WorldScene` điều phối Phaser lifecycle, zone root/camera và visual systems, không đích thân giữ logic mọi entity.
- `MapView` load layer Tiled, world ground/occlusion; `ActorViewSystem` giữ entityId→SpriteView mapping, Y-sort, interpolation, visibility; `CombatVisuals` dựng windup/contact/hurt/death từ server event; `VfxPool` tái sử dụng objects; `InteractionMarkers` quản lý quest/shop/portal indicators.
- DOM UI cho chữ/option/long lists: Character, Q journal, inventory, shop; đóng overlay vẫn thấy map 2D vận hành đúng. Không thay gameplay bằng popup.
- `VisualBindingDef` nối stable content ID → manifest asset keys + animation + Tiled object/coordinates đã authored; thiếu asset phải DRAFT/PLACEHOLDER có nhãn, không fake approved visual.

**Performance plan (acceptance metric cần owner duyệt hardware):** instrument frame-time p50/p95, FPS, memory, texture count, draw calls (nếu khả dụng), sprite counts, active particle/tween counts, network snapshot frequency/size, update allocations. Baseline test 1280×720 và 390×844; test đại diện town/forest trong cảnh đông, nhiều monster/VFX. Chỉ thay tối ưu khi có profiling: pool VFX/number popups, cull offscreen objects, avoid creating sprites on every snapshot, delta/interpolation instead of teleporting, map layer/camera partition, lazy load zone art, cap particles/FX, visible feedback gần người chơi. Không tự khẳng định đạt 60 FPS do hiện chưa có đo profiling trên target device. Các threshold FPS/hardware là owner calibration gate, không canon sẵn.

**Production art:** nguồn genuinely generated/approved, raw source + SHA, deterministic slicing/post-process, asset manifest/visual binding QA, human gameplay-zoom approval; không chạy `build_assets.py` toàn phần hay code-painted art khi chưa có cho phép.

## 8. Trạng thái modularization thực tế tại `b82e20b` (`PRE-S1F`) vs. Retained Compatibility vs. Target-Only

| Phân loại | Đường dẫn / Thành phần | Trạng thái thực tế trên đĩa (`b82e20b`) |
|---|---|---|
| **Implemented at `b82e20b` (`PRE-S1F`)** | `packages/game-data/src/catalogs/realms.ts`, `packages/game-data/src/catalogs/destinies.ts`, `packages/game-data/src/rules/characterContracts.ts` | Đã tách thành leaf modules độc lập; `packages/game-data/src/td01Numeric.ts` import trực tiếp từ `./catalogs/destinies.js` và `./rules/characterContracts.js` (đã loại bỏ import vòng trực tiếp `td01Numeric.ts ↔ index.ts`). |
| **Implemented at `b82e20b` (`PRE-S1F`)** | `apps/server/src/features/destiny/DestinyRoller.ts`, `apps/server/src/features/character/CharacterSnapshot.ts`, `apps/client/src/features/character/CharacterPanel.ts` | Đã tách `rollInnateDestinyTripleFromCatalog` (+ trọng số `50/30/15/5` & `60/40`), `toCharacterV02Snapshot`, và `renderCharacterPanelModal` (`[C]` modal). |
| **Retained Compatibility / Mixed Modules (`b82e20b`)** | `packages/game-data/src/index.ts` (`2100 → 885` dòng Git), `apps/server/src/characterV02Actions.ts` (`2037 → 1778` dòng Git), `apps/client/src/hud.ts` (`925 → 660` dòng Git) | `game-data/src/index.ts` re-export các leaf modules nhưng vẫn giữ catalogs/logic `v0.1` (chưa phải pure barrel). `characterV02Actions.ts` re-export `DestinyRoller`/`CharacterSnapshot` và vẫn giữ `CharacterV02ActionService` + transaction/idempotency flow (`1778` dòng; báo cáo trước ghi `~627` dòng là sai — **không** mở thêm đợt refactor chỉ để ép giảm LOC). `hud.ts` uỷ quyền `[C]` modal sang `CharacterPanel.ts` và giữ phần HUD còn lại (`660` dòng). |
| **Retained Runtime Foundations** | `apps/server/src/characterV02Repository.ts` (`1346` dòng), `apps/server/src/db.ts`, `apps/server/src/worldEngine.ts`, `apps/server/src/zoneRoom.ts` | Giữ nguyên ổn định cho `S1`; không tách `db.ts` hay rewrite `worldEngine.ts` big-bang trước visual/`S1-F`. |
| **Target-Only / Chưa triển khai** | `CharacterService.ts`, `CharacterValidation.ts`, `DestinyOwnership.ts`, `infrastructure/database/*`, `runtime/world/*`, `packages/game-data/src/content/*`, `registry/*`, `.github/workflows` CI, đo tải/FPS | Chỉ là hướng kiến trúc mục tiêu khi triển khai các slice tương ứng (`S2`–`S8`) hoặc khi được giao task riêng; **chưa tồn tại** tại `b82e20b`. |

**Quy tắc cho các bước tiếp theo (`VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F` và `S2`–`S6`):**
- Không lặp lại việc tách `realms`/`destinies`/`characterContracts`/`DestinyRoller`/`CharacterSnapshot`/`CharacterPanel` đã hoàn tất ở `b82e20b`, và không refactor thêm `characterV02Actions.ts` chỉ để giảm số dòng trước `VISUAL-01`..`S1-F`.
- Từ `S2`–`S6`, mỗi slice tạo feature domain module ngay lúc implement rồi dời phần tương ứng khỏi `worldEngine.ts` theo từng behavior có contract test; không rewrite big-bang.
- **Quality heuristic:** nếu file ≥500–800 LOC, đánh giá tách theo trách nhiệm khi chỉnh sửa domain đó; không hard-fail chỉ vì số dòng. Cờ đỏ: SQL trong transport, UI action cộng stats, duplicate reward paths, `if` theo từng quest/NPC trong world engine, circular import, mutable singleton mới, server payload tùy tiện, code ảnh hưởng nhiều TD owners.

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
- `scripts/verify-doc-sync.mjs` (`npm run verify:doc-sync`) thực hiện kiểm tra cơ học: xác minh 40 file Freeze nguyên vẹn so với `39c41a6ddb77b93284c56da7ec053f4309ee4943`, kiểm tra sự tồn tại của các file kiến trúc/archive/locator bắt buộc, và kiểm tra cú pháp inline JavaScript của `docs/tong-mon-8d-project-atlas.html`. Công cụ này **không** phải bộ phân tích ngữ nghĩa toàn văn và không dùng regex blacklist cứng để chặn lịch sử hợp lệ hoặc cấm định dạng `S1-F` tương lai; việc đối chiếu nhất quán trạng thái giữa các tài liệu là bước self-review có phạm vi của agent trong mỗi task.
- Phân biệt sự thật thời điểm *before commit* và *after remote closeout*, đặc biệt Atlas snapshot.

## 11. CI/tests, versioning và đặc thù multiplayer RPG

- Kiểm thử thuần: catalog/schema validation, Condition/Effect interpreter, RNG, modifiers, deterministic rules.
- Contract: messages, protocol versions, client/server compatibility, stable content IDs, content pack dependency references.
- DB: local isolated PGlite, atomic reward grant, concurrency/replay, migration smoke, restart/reconnect, no live DB.
- Integration: Colyseus server actions, Quest FSM legal event credit, one-source reward delivery, multi-tab controller lease, owner-only/private space ACL.
- Browser: two clients, 1280×720/390×844, Tiled world visuals, actual interaction, screenshot, performance profile at representative scale.
- Import boundaries and no-cycle check, TS typecheck/build, asset provenance/manifest, changed-path scope/frozen 40 docs.
- Data versions: `ContentPackDef.id/version`, ruleset version, persisted schema version, saved quest acceptedVersion, immutable stable IDs. Old content pack removal requires compatibility story; versioned changes never silently rewrite ongoing quests.
- Target GitHub Actions: install locked deps, typecheck, focused/full tests by impact, production build+asset validation, `verify:doc-sync` and `verify:architecture` when tools exist; artifact export from failing CI. No CI is currently proved present at audited HEAD (`.github/workflows` absent from tree).

## 12. Trạng thái duyệt và lộ trình thực hiện

- **Đã hoàn tất tại `b82e20b` (`PRE-S1F`) và `DOC-CLEAN-01`:** tích hợp `SOURCE_ARCHITECTURE.md`, quy tắc scope-based allowlist (§9), tách chọn lọc leaf catalogs/rules (`realms.ts`, `destinies.ts`, `characterContracts.ts`), gỡ import vòng trực tiếp `td01Numeric.ts ↔ index.ts`, tách `DestinyRoller.ts`, `CharacterSnapshot.ts`, `CharacterPanel.ts`, và chuẩn hóa `verify:doc-sync` cơ học + dọn tài liệu lịch sử sang `docs/archive/legacy/*`.
- **Chưa phải scope triển khai:** các hệ farm/housing/pets/events/crafting/leaderboards trong bảng §6 chỉ là extension-point ví dụ; không tạo code/state/database schema cho chúng khi chưa có task được owner duyệt.
- **Chuỗi ưu tiên tiếp theo của owner (`docs/NEXT_ACTIONS.md`):** `DOC-CLEAN-01 -> VISUAL-01 (3 bộ concept UI/world đồng bộ để owner chọn) -> VISUAL-02 (bộ asset mẫu + animation thực cho S1 để owner duyệt tích hợp) -> VISUAL-03 (tích hợp Phaser/Tiled + đo nghiệm trải nghiệm/FPS thực tế để owner duyệt) -> S1-F (nghiệm thu đóng S1 với 2 client + file-backed restart)`. Từ `S2` trở đi áp dụng tạo feature modules theo từng slice.
- **Không yêu cầu đóng băng folder tree:** kế hoạch là quy tắc dependency/ownership và cách mở rộng; cứ mỗi hệ mới được duyệt, bổ sung content pack hoặc feature đúng owner, review trong task đó.

### Source anchors

- `AGENTS.md` §2; `RULES.md` Rules 3–6
- `docs/technical/TD_FREEZE_CONTRACT_MAP.md`; `docs/technical/TD_FREEZE_APPROVALS.md`
- `docs/systems/CONTENT_REGISTRY.md`, `QUEST_ENGINE.md`, `QUEST_CONTENT.md`, `TECHNIQUES.md`, `WORLD_CONTENT.md`
- `docs/systems/VISUAL_CONTENT_CONTRACT.md`, `docs/pipelines/{WORLD_SCENE_ASSEMBLY,ANIMATION_VFX_FEEDBACK,UX_WORLD_FIRST,AI_ASSET_PRODUCTION}.md`
- `docs/technical/TD05_VERTICAL_SLICE_ACCEPTANCE.md` (A–L)
- `.agents/skills/{rpg,mmorpg-server-integrity,game-ui-frontend,game-playtest,phaser4-scenes,phaser4-animations,phaser4-tilemaps,world-and-map-qa,ai-art-production,pixel-art-director}/SKILL.md`, routed through `AGENT_SKILL_ROUTER.md`
- Source code `master@b82e20b`: `apps/{server,client}/src`, `packages/{shared,game-data}/src`, `tests/e2e`.
