# TD-05 · Cross-TD Consistency & Design Freeze Handoff

> v0.7 · Prepared after owner accepted TD-01 v0.3, TD-02 v0.4, TD-03 v0.5 and TD-04 v0.6 **plus NPC-only shop addendum**. TD-05 is still pending owner approval. This file is a reconciliation checklist, not a second source of gameplay formulas.

## 1. Contract ownership — one engine for each thing

| Domain / event | Authoritative owner | TD-05 visual integration obligation | Forbidden by TD-05 |
|---|---|---|---|
| Origin six stats, Character Level, EXP, Tu Vi, realm/stage | TD-01 `CHARACTER`, `CULTIVATION` | Two distinctly readable progress channels; level-up, realm breakthrough and allocated-stat feedback | Alternative stats, formula, Level cap, auto-breakthrough |
| Tiên Thiên (immutable 3), Hậu Thiên active 3, 10 signatures | TD-01 `DESTINY` | Distinct destiny/emblem art with 4 exact quality tiers and correct exclusive branch UI | Visual roll showing two Legendary signatures, tradeable NPC signature |
| Six Dao paths, martial achievements, trial milestones | TD-02 `DAO_MASTERY` | Unique path motifs, 10-step progression symbols and illustrated 3→4 / 6→7 / 9→10 Bí Cảnh encounters | `Đan/Khí/Phù` substituted for Kiếm/Đao/Chỉ/Chưởng/Thể/Pháp |
| Công Pháp and Võ Kỹ, 6 technique ranks | TD-02 `TECHNIQUES` | Illustrated scrolls/manuals, equipped active-skill icons and source-generated cast/hit VFX | Invented seventh `Thánh` technique grade or alternate damage engine |
| Damage, monster difficulty and skill usage | TD-02 `COMBAT` | Consume server-authoritative events for hit/miss/crit/telegraph/death presentation | Client VFX awarding damage/EXP/loot |
| Online combat activity, reconnect/one controlling tab | TD-03 `AUTO_FARM` | Character animation reflects active server state; clear STOPPED/PENDING visual, no idle offline illusion | Background browser farm simulator, UI button bypassing presence |
| Pathfinding and zone crossing | TD-03 `NAVIGATION` | Real walk/traversal/arrival marker consistent with valid server path and physical obstacle map | Quest teleport, auto-talk or auto-purchase at destination |
| Manual quest lifecycle and credit events | TD-03 `QUEST_ENGINE` | Quest board/NPC/object/region world anchors, optional Q journal, completion cues | Automatic quest accept/hand-in, choice or puzzle |
| Zone, enemy spawn, item/loot, NPC relationship, Food Catalog, quest content | TD-04 systems/registries | Generated scenery, actors, world items, icons, objective landmarks and portrait/scene bindings | Phantom world locations, visual items without stable IDs, second loot grant |
| NPC-only Tụ Bảo Các & specialized vendors, BUY/SELL | TD-04 `NPC_SHOPS` (approved addendum) | Facade, counter, readable NPC merchants, illustrated offers, intentional filtered trade panel | Player-to-player exchange, escrow, auction, listing, RMT checkout |
| Art origin, pixel consistency, game integration, approval | TD-05 pipelines + existing `AGENTS` & Art Bible | Genuine source image → validated atlas/tileset → world screenshot → owner visual approval | Python-generated geometric "final" art, silent approval, image-only marketing mock as proof |
| Canon public/optional, 17 realms, 10 NPC and spoiler boundary | Game Design v0.2 + decisions | Art and NPC dialogue/scene visibility must respect character identity and secret reveals | Extra playable realm, named masked mentor, spoiler in starter UI |

## 2. Baselines inherited unchanged, not re-approved here

- **TD-01:** 6 baselines: `Thể Phách`, `Lực Đạo`, `Linh Tính`, `Thân Pháp`, `Thần Thức`, `Ngộ Tính`. Character Lv 1–10 Phàm + 17 realms ×20 through Lv350 + unbounded Saint Level. EXP banking at non-Saint realm cap is not allowed under owner's accepted TD-01 baseline; no replacement curve. Bế quan gives Tu Vi, separate from EXP.
- **TD-02:** 6 martial Dao: `Kiếm Đạo`, `Đao Đạo`, `Chỉ Đạo`, `Chưởng Đạo`, `Thể Tu`, `Pháp Tu`, ten stages, trials 3→4/6→7/9→10, and exactly Phàm/Linh/Hoàng/Địa/Thiên/Thần technique ranks. TD-05 does not supply new stat/damage constants or assume different threat tiers.
- **TD-03:** server controls only-on-connected Auto Farm and no auto-quest, route-to-objective only. `Q` journal supplemental to world. Any NPC/portal action remains user-driven unless expressly authorized in future decisions.
- **TD-04:** NPC-only buy/sell and filtered per-town Shop Catalog; physical Tụ Bảo Các and specialist vendors. Item/destiny rarity must not be conflated. Direct vs ground loot exactly one delivery per committed reward. Food Catalog unique identity and Phì Đế threshold unresolved.
- **Lore:** all 10 Legendary NPCs appear in public main narrative, six-chapter exclusive side quest triggered only via correct signature, affection & secret trial. `dam_lon_tien_tu.realmId` UNKNOWN; ChatDVT jade-cyan quadruped. Main Quest finale secret Phì Đế = Ăn Uống Thiên Tôn; no early splash art revealing it. `GD-046` era/villain/7-arc names remain PROPOSED.

## 3. New, approved scope vs proposals vs unresolved

| Decision/reference | Scope status | What Design Freeze should preserve |
|---|---|---|
| Owner's directive that every new **player-facing** content object has visual rendering/art pipeline | OWNER_APPROVED DIRECTION | Make release/blocking `VisualBindingDef` requirement; server-only records are exempt but must map visible consequences |
| Physical Tụ Bảo Các + specialist NPC vendors | OWNER_APPROVED DIRECTION (TD-04) | One shared ShopService; manual BUY/SELL; no P2P shop |
| Game-world over UI overlay, not zero overlays | OWNER_APPROVED DIRECTION | Screenshots with panels closed AND controlled UI interactions; never replace gameplay with only popup text |
| `80×96` humanoid sprite sheet and `32×32` tiles | VERIFIED HISTORICAL COMPATIBILITY | Use as initial integration contract; art silhouettes/creature rigs may have author-approved distinct sizes |
| Reference palette Candidate A | PROPOSED/TECHNICALLY_VERIFIED | No owner art sign-off implied by approval of TD-05 documents |
| Physical Tụ Bảo Các uses one hall or several exterior stalls | DESIGN_BASELINE / OPEN | Choose by reviewed first-slice layout; no fabricated interiors |
| Ambience intensity, animation timing, UI screen-space targets | DESIGN_BASELINE | Validate at real gameplay zoom; no invented universal FPS or device coverage |
| Food Chân Truyền exact dish count | UNRESOLVED (TD-04) | Never assume 18, 80 or full Food Catalog required |
| NPC affinity numeric threshold, gear rarity, stock/prices, daily reset | UNRESOLVED / PROPOSED (TD-04) | Remain owner-gated, not invented by visual production |
| New skills/items/NPC names/biomes, high-plane villain art | PROPOSED / CONTENT_DRAFT | Need approved content brief before generating production art |

## 4. Input fingerprints and safe freeze policy

A reproducible input fingerprint file `TD05_INPUT_FINGERPRINTS.json` must list SHA-256 for every current local Game Design / TD-01 / TD-02 / TD-03 / TD-04 Markdown and the owner-approved `TD04_SHOP_MARKET_PROPOSAL.md`. This assures the TD-05 package consumes the same specifications that were reviewed.

**Freeze reconciliation steps:**

1. Verify all input fingerprints against local attached versions, and compare Game Design Baseline v0.2 with the actual Git HEAD before importing. Do not claim current Git source is unchanged solely from local hashes.
2. Select **one** resulting repo path per spec (`docs/systems/NPC_SHOPS.md` represents accepted TD-04 addendum; do not also import an obsolete `SHOP_MARKET.md` containing P2P scope).
3. Record a Freeze decision ledger containing `APPROVED`, `DESIGN_BASELINE`, `PROPOSED`, `UNRESOLVED`, `LEGACY`; do not promote artwork statuses to `HUMAN_APPROVED`.
4. Reconcile cross-references, ID/name counts, and source schema assumptions. The existing `AGENTS.md` and `RULES.md` remain protected by current governance; only edit them during the later authorized docs-only integration.
5. Import final docs to repo once after TD-05 owner sign-off; Argon changes no `apps/`, `packages/`, `assets/`, `maps/`, DB, secrets or current skill scripts. Owner reviews and pushes.
6. Only after docs on Git: implement multiple small Plan→Build→Review→Verify tasks, each with concrete in-game asset/evidence acceptance. No 'one turn build the whole MMORPG'.

## 5. Open blockers for later visual production

1. Actual owner selection of an art direction after comparing in-game Candidate A and alternatives; initial PoC sprites are only technically verified.
2. True viable AI image generation route in the Antigravity execution session. A skill installed locally does not itself guarantee provider, credentials or quality.
3. Approved first market layout (single Tụ Bảo Các hall vs reachable outdoor counters) and authored Tiled collision geometry.
4. Owner review of the first generated **sample art pack**: one character animation, market facade/counter, ground tile transitions, item icon and skill VFX in one real screenshot/recording.
5. End-to-end real-playability with multiple browsers and a functioning manual NPC transaction, navigation and online-only AFK combat.

These are future **production gates**, not reasons to deny acceptance of the TD-05 specification if the owner approves the document scope.
