# SYS-QUEST-CONTENT — Authored Quest Packs, Repeat Rules, Story Gates

> TD-04 v0.6 | OWNER_REVIEW_REQUIRED. TD-03 `QUEST_ENGINE.md` is the SINGLE engine and state machine. TD-04 supplies `QuestDef`, prerequisite `ConditionDef`, `RewardTableDef` and location/content references. No Auto Quest, ever (`GD-003`, `GD-004`).

## 1. Quest lifecycle and user participation: invariant

Five categories exactly: `main`, `side`, `special`, `daily`, `town_board`. The quest engine's `LOCKED→AVAILABLE→ACTIVE→OBJECTIVES_READY→COMPLETED` and explicit `FAILED/EXPIRED` states belong to TD-03; **do not redefine them**. All acceptance and turn-in are manual. TD-03 uniquely consumes server events; TD-04 does not define an extra `onMonsterKilled → giveReward()` hook. `visit` may count a factual authorized arrival, but cannot count `talk` or auto turn in.

Story dialogue, NPC gifts, legendary chapters and point-and-click decisions require explicit human interaction even when navigation or combat is automated. Each character carries its own quest acceptance/event provenance, choice flags and reward state. Server validates target NPC/board distance on hand-in, not just button presses.

## 2. Quest content data contract

**Use the schema in TD-03 `QuestDef` unchanged**; TD-04 populates it and standard catalogs behind its IDs:

- `QuestDef.prerequisite`: references one content-validated `ConditionDef` tree, with `all`, `any`, `not`, typed predicates.
- `QuestObjectiveDef.targetIds`: reference valid monster, item, NPC, location, instance or choice IDs appropriate to `kind`; arbitrary user strings rejected.
- `QuestObjectiveDef.locationRef`: server registry ID, not raw coordinates. Hidden location remains hidden until explicit discovery condition.
- `QuestDef.rewardTableId`: versioned `RewardTableDef` with manual claim semantics.
- `QuestDef.acceptedQuestVersion`: TD-03 freezes prior quest definition for an already-accepted quest (or schedules a migration).
- `QuestDef.repeatPolicy`: `once` / `daily` / `town_board_period`, with unique `periodKey` and `acceptanceId`.

**Content validation:** Main Quest prerequisite trees may test Level/realm/story progress but may **never** test `hasLegendarySignature` or `isTrueDisciple`. Exclusive True Disciple side lines MUST test exact matching owned signature and favor/special trigger, but cannot retroactively block public NPC interaction. Make this check machine-readable as a validator, not merely lore text.

## 3. First playable quest package — design candidates, NOT fully scripted

| Stable ID proposal | Category | Manual player action | Legitimate automatic credit | Reward gate |
|---|---|---|---|---|
| `main_pham_01_arrival` | main | Begin dialogue/town orientation | Explicit `visit` starter marker if authored | Manual town NPC submission |
| `main_pham_02_truc_lam_anomaly` | main | Choose to investigate forest and accept | Online farm `kill`/authorized `visit` credits | Return and manually report anomaly |
| `main_pham_03_masked_immortal` | main | Reach concealed event, dialogue/trial choice, accept starter cultivation technique and breakthrough pill | Fight portions can use legal combat auto skills, **not** the conversation | Set `masked_immortal_trial_completed` server-only on actual manual quest completion, grant approved starter method/pill |
| `side_town_food_intro` | side | Choose buy or cook, deliver to Phì Đế | Authenticated `obtain` can count if authored, never auto-gift | Public blessing + favor only, not True Disciple |
| `daily_forest_patrol` | daily | Manually accept town board/NPC | Correct monster `kill` objective from online farm | Manually claim once per authored reset period |
| `town_board_ingredient_delivery` | town_board | Accept, manually deliver valid herb/material | Item `obtain` credit from valid online rewards | Bounded earned currency, no legendary signature |
| `special_phi_de_private_01` | special | **Only** after matching owned signature + favor + approved food special trigger; manual first chapter | Eligible combat objectives if present | First of SIX chapters, not a status grant |

The existing v0.1 `phi_de_ch1_huong_thom` is **already an implemented public food-delivery quest ID**, not a completed private Chân Truyền chain. Migration may map it to `side_town_food_intro` public meaning by alias/flag but preserve prior completion/rewards. Do not overwrite or delete history. The new masked-immortal ID is proposed, and the identity of that immortal must remain **UNKNOWN**; Phì Đế late-game incarnation is **not** confirmation of the masked mentor.

## 4. Daily and town-board reset — server-owned DESIGN_BASELINE

- Candidate reset period: **daily at 00:00 Asia/Ho_Chi_Minh (UTC+7)**, computed on server, not browser timezone. Explicitly not owner-approved until reviewed; key periods as `YYYY-MM-DD@Asia_Ho_Chi_Minh`, or an equivalent canonical period ID.
- One accepted repeat instance per `(characterId, questId, periodKey)`; manual accept then manual turn-in. Retry same instance does not double reward. New period allows authored re-accept only if previous instance status resolves or expires under explicit rule.
- Claim remains safe across midnight: a player with `OBJECTIVES_READY` at 23:59 should not lose earned reward without a documented expiration/grace policy. **Proposed safe default**: allow manual claim of pending rewards after reset with a retained prior-period acceptanceId; don't allow the same previous period to mint a second instance.
- Town board display/replenishment, repeat count, reward inflation limits and reset timezone require owner review. No paid refresh or reward doubling by relog.

## 5. NPC private side lines and macro narrative

All ten Legendary NPCs appear in public Main Quest, and exactly ten optional signature-only six-chapter paths are a long-term **content** ambition. Do NOT autogenerate 60 repetitive quests in TD-04. Require for each eventual authoring package: six distinct objective designs, dialogue decisions, appropriate level/Dao tasks, actual rewards and narrative payoff. The catalog can reserve stable arc IDs, but reserved content cannot be mistaken as published/playable.

`TRUE_DISCIPLE` is awarded by one server-side, manually claimed conclusion after all six chapter completion proofs. `one_legendary_signature_total` holds across innate/acquired. No global `realmAtLeast` precondition for all routes. Phì Đế Food Catalog discovery threshold remains `UNRESOLVED`. Universal final Main Quest must be completable without any such optional private arc; all ten appear in its public path. Seven macro arcs and named dimensional antagonist are `PROPOSED`, not canon IDs.

## 6. Quest release QA and test IDs

`QUEST-C01` Main Quest has no signature/private apprentice gate in any transitive prerequisite. `QUEST-C02` no auto accept/submission for every quest category. `QUEST-C03` kill/obtain only from authoritative eligible TD-03 events after manual acceptance. `QUEST-C04` masked immortal hard gate only after manual story completion, starter method+pill and Lv10. `QUEST-C05` legacy Phì Đế public quest remains accessible without trait. `QUEST-C06` repeated daily claim once per period, preserving unclaimed prior rewards according to policy. `QUEST-C07` time-zone boundary server canonical. `QUEST-C08` hidden objective doesn't leak exact location. `QUEST-C09` no generic kill quest grants Legendary signature. `QUEST-C10` private NPC six chapters cannot auto-mark complete on public narrative scenes. `QUEST-C11` each referenced objective/reward/location exists and matches category. `QUEST-C12` no unauthorized late-game Phì Đế revelation in starter dialogue.
