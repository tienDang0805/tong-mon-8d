# SYS-QUEST-ENGINE — Manual Questing, Journal, and Server Credit

> TD-03 v0.5 | **OWNER_REVIEW_REQUIRED** | Authority `GD-003`, `GD-004`, `GD-006`, `GD-015`, `GD-023`, `GD-040..045`.
> This file defines mechanics. Narrative content stays in `NARRATIVE_DESIGN.md`; typed registries, gifts and exact quests are TD-04.

## 1. Five quest categories; one human-driven story

| Category ID | Vietnamese | Rules |
|---|---|---|
| `main` | Chính tuyến | Universal path for all players, Level 1 → playable Thánh Cảnh; never requires Legendary signature/Chân Truyền. |
| `side` | Phụ tuyến | Authored local, professional, relationship, exploration content. |
| `special` | Đặc biệt | Hidden/world-event/Legendary six-chapter side paths; gates explicitly authored. |
| `daily` | Hằng ngày | Repeatable bounded rewards and server-time-defined reset; no offline auto claim. |
| `town_board` | Bảng nhiệm vụ thành trấn | Manually accepted local contracts and manually claimed rewards. |

**APPROVED:** User personally chooses/accepts quest, NPC dialogue options, irreversible story branches, puzzle actions and hand-in/claim. `Auto Farm` can satisfy kills from eligible accepted quests while online, and authenticated loot/pickup events may satisfy `collect`/`obtain` if specified. `Auto Navigation` only moves and stops. `Q` shows full quest journal; compact right-edge tracker highlights current tracked quest. Never call this an automatic quest system.

## 2. Quest lifecycle contract

Quest state is per-character, never a shared single mutable storyline across the room:

```
LOCKED --availability revealed--> AVAILABLE
AVAILABLE --manual accept--> ACTIVE
ACTIVE --server event credit--> OBJECTIVES_READY
OBJECTIVES_READY --manual NPC/board interaction & submit--> COMPLETED
ACTIVE --authored failure--> FAILED / EXPIRED
COMPLETED --authored daily reset--> AVAILABLE (new repeat instance)
```

- `AVAILABLE` means eligible to start; NPC or quest board still requires the player's click. Story NPCs may provide information to players with no corresponding signature; showing dialogue does not unlock a protected path.
- `OBJECTIVES_READY` ≠ `COMPLETED`; player must submit/claim manually unless a separately approved event explicitly contains a manual player's finishing action.
- On client disconnect, the quest remains at last committed state and cannot gain credit from simulated offline actions. Offline cultivation grants Tu Vi only. No automatic quest hand-in after login.
- Daily and town-board quests use a *versioned repeat instance* (`questId`, `periodKey`, `acceptanceId`) so reset does not reuse an old completion reward token; all reset clocks are server-controlled. Expiration must not delete earned but unclaimed special/main rewards; those policies are explicit per template.

## 3. Typed, data-driven schema candidate

```ts
export type QuestCategory = "main" | "side" | "special" | "daily" | "town_board";
export type QuestObjectiveKind =
  | "kill" | "obtain" | "collect" | "visit" | "talk" | "deliver"
  | "craft" | "interact" | "choose" | "dungeon_clear" | "survive";

export interface QuestObjectiveDef {
  id: string;
  kind: QuestObjectiveKind;
  requiredCount: number;
  targetIds: string[];
  locationRef: string | null;
  isHiddenUntilDiscovered: boolean;
  creditPolicy: "verified_event" | "manual_interaction_only";
}

export interface QuestDef {
  id: string;
  version: number;
  category: QuestCategory;
  nameVi: string;
  prerequisite: ConditionDef;
  objectives: QuestObjectiveDef[];
  completionMode: "manual_submit";
  turnInNpcId: string | null;
  rewardTableId: string;
  repeatPolicy: "once" | "daily" | "town_board_period";
  storyVisibility: "public" | "secret" | "legendary_signature_only";
}

export interface QuestProgress {
  characterId: string;
  questId: string;
  acceptedQuestVersion: number;
  acceptanceId: string;
  status: "ACTIVE" | "OBJECTIVES_READY" | "COMPLETED" | "FAILED" | "EXPIRED";
  objectiveCounters: Record<string, number>;
  revision: number;
}
```

`ConditionDef` and `rewardTableId` refer to TD-04 registries and MUST be declarative, typed and server-evaluated, no code loaded from player content. Stable IDs are mandatory for migration. Quest definitions may have multi-stage branches/flags, but client-provided `progress` is never trusted. `acceptedQuestVersion` freezes an authored definition at acceptance or triggers a controlled version migration, not silent objective replacement.

## 4. Event credit matrix — exact distinction

| Kind | Can valid online Auto Farm increment it? | Can Auto Navigation increment it? | Manual action still required? |
|---|---|---|---|
| `kill` | **Yes**, upon legitimate server kill/contribution event, only if quest already ACTIVE | No | Manual acceptance and turn-in |
| `obtain` | **Yes** if inventory is awarded legitimately by that kill/reward source | No | Manual acceptance and turn-in |
| `collect` loot drop | **Yes** if valid auto-pickup is enabled and player owns the drop | No | Manual acceptance and turn-in |
| `visit` authored location | Movement by either mode can arrive | **Yes**, position validated server-side | Manual acceptance; turn-in if required |
| `talk` | No | No, navigation only gets near NPC | **Yes** |
| `deliver` | No | No | **Yes**, server consumes authored item |
| `choose` / story branch | No | No | **Yes**, deliberate player choice |
| `craft` / `interact` / gathering node | No, unless separately player-interacted | No | **Yes** |
| `dungeon_clear` | Boss combat can be automatic **inside an entered instance**, but no auto-entry/turn-in | No | Player enters and completes required manual instance conditions |
| `survive` | Possible if explicitly-authored valid instance combat run | No | Player manually starts/enters activity when required |

**Important:** Location `visit` credit is factual position verification, not auto-accepting or auto-submitting. Do not treat `arrivedAtNpc` as a `talk` event. An item dropped from a monster may count as `obtain` or `collect` only **once** after authenticated entitlement/inventory/pickup, not once for drop creation and once for pickup.

## 5. Server award, deduplication, ordering

A single authoritative event stream serves all accepted quests for a character:

`MonsterDeathCommitted(killEventId) → EligibleCharacterEntitlement → QuestObjectiveEligibility → InsertObjectiveCredit(acceptanceId,objectiveId,sourceEventId) → UpdateCounter → MarkOBJECTIVES_READY`.

- Before crediting, check the quest was accepted **before the source event**; compare authoritative sequenced event timestamps, not client clock. A kill before pressing Accept cannot later retroactively complete the quest.
- `kill` credit comes from the same finalized TD-02 combat/TD-03 Auto Farm `killEventId` used for Character EXP/Dao credit. No second quest-only kill simulation. If party sharing is authored later in TD-04, participants must have verified eligibility — no infinite proximity/leech rewards.
- Unique key `(characterId, acceptanceId, objectiveId, sourceEventId)` prevents retries, duplicate packets, multiple processing workers and reconnect from incrementing a counter twice. Objective count cannot exceed the authored maximum unless explicitly tracked independently for achievements.
- Reward claim is a **manual interaction** tied to `acceptanceId`, valid NPC/board proximity and state; in one atomic unit ensure reward event unique, apply Character EXP (using TD-01 Level cap behavior), any Tu Vi/items/currency and state COMPLETE. Quest completion cannot bypass Lv10 main quest/breakthrough flags.
- The masking immortal starting quest is a **Main Quest hard gate** for Phàm Nhân → Luyện Khí. It must verify manually completed trial, grant starter Công pháp and pill and set a persisted server-only story flag, with no auto-completion from walking to the NPC. `majorBreakthrough` consumes correct authorized pill after TD-01 validation.

## 6. Legendary Chân Truyền remains isolated from universal content

`GD-014`/`GD-015` must remain unchanged:

`matching owned Legendary signature (Tiên Thiên OR Hậu Thiên, equipped OR not) → NPC affinity → special trigger → unlock exclusive six-chapter side chain → complete all six → Chân Truyền status`.

**None** of these gates may block Main Quest, normal realms, common maps or regular growth. The six chapters are personally accepted, acted upon and turned in. Ordinary Phì Đế culinary public activities accept **purchased or self-cooked** qualifying food and never directly grant signature/Chân Truyền. Specific special-trigger dish count is **UNRESOLVED** until TD-04 Food Catalog. No universal hard `realmAtLeast` prerequisite may be added to all 10 routes; particular chapter content may request it only after owner approval.

A publicly visible Legendary has distinct dialogue/quest entrypoints: `PUBLIC_MAIN`, `PUBLIC_FAVOR`, `PRIVATE_DISCIPLE`. Eligibility of `PRIVATE_DISCIPLE` is independently server checked; an NPC's `equippedInheritance="phi_de"` from legacy public quest is not a True Disciple certificate.

## 7. Narrative/UX contracts

- Quest journal via `Q`; categories exactly the five approved. Compact HUD side tracker shows selected quest and bounded secondary quests. `Q` and clicks never auto-run steps; they only show, track, route, and explicitly submitted user actions.
- Track quest `available/active/objectives-ready` and rewards clearly; don't visually label `OBJECTIVES_READY` as rewarded.
- Real decision dialogue persists `storyFlag`, `choiceId`, `selectedAtMs`, revision. Can't resubmit a different irreversible option due to lag/double-click. Text and NPC identity belong to narrative content; the masked immortal's real identity must remain unknown until owner writes it.
- Hidden objectives return spoiler-safe approximate descriptions; route UI cannot leak secret NPC positions, unvisited zones or late-game Phì Đế secret.
- Quest progress snapshots are per-character and sanitized for other players; room broadcast shares animations/world state, not another person's secret story state.
- Narrative 7 macro arcs and antagonist names in v0.2 are **PROPOSED**, not hard-coded in engine logic. NPC IDs/17 realms remain canonical.

## 8. Known prototype mismatches and migration

Current prototype: `QuestProgressState` (`status not_started/active/completed`, `stepIndex`, `objectiveCount`) and `QuestActionIntentPayload` (`accept|submit|advance`) are too narrow for multi-objective, branches and daily periods. `apps/server/src/worldEngine.ts` `handleQuestAction` currently supports `phi_de_ch1_huong_thom`, validates nearby NPC, credits public purchased/cooked food and grants blessing; it also sets `equippedInheritance="phi_de"`. Keep its public food event but remove the implicit private inheritance meaning **after** separately-approved migration. Do not mutate existing quest history automatically during docs import.

TD-04 must define: quest objective target registries, Food Catalog and rewards, NPC affinity thresholds/gifts, special triggers, daily reset rules and exact main chapter content; TD-03 establishes generic engine only. Do **not** fabricate 60 unique six-chapter scripts or add NPC side quests automatically.

## 9. Acceptance tests

| ID | Scenario | Expected |
|---|---|---|
| QST-01 | Player never accepts quest; online auto kills matching mob | No quest counter increases |
| QST-02 | Player accepts kill quest, auto kills matching eligible mob | Counter +1 once; still no auto hand-in |
| QST-03 | Duplicate kill event, reconnect/replay | Same quest objective credited once |
| QST-04 | Quest reached objectives ready; no NPC interaction | Remains ready, no rewards granted |
| QST-05 | Auto route to NPC and arrive | `talk`/`deliver`/`submit` counters remain unchanged |
| QST-06 | Manual dialogue and turn-in with valid proximity/item | Complete once; duplicate request returns original outcome |
| QST-07 | Different story branch selected simultaneously from two tabs | One authoritative choice, no conflicting flags |
| QST-08 | Daily quest reset | New `acceptanceId`, old rewards cannot replay |
| QST-09 | Invalid/hidden objective location | No spoiler reveal in route response |
| QST-10 | Player without signature meets public Phì Đế | Public food event works; private disciple remains unavailable |
| QST-11 | Signature owned as inactive Hậu Thiên | Counts for eligibility, not autogrant Chân Truyền |
| QST-12 | Early immortal encounter without manual story trial/pill | Major breakthrough denied regardless of travel/EXP |
| QST-13 | Lv10 Mortal quest reward grants Character EXP | No EXP banking beyond cap; other valid rewards intact |
| QST-14 | Quest patch removes objective or changes required counts | Versioned migration/reapproval; no silent progress loss |
| QST-15 | Online auto loot + obtain quest | Exactly one credit from authoritative inventory grant |
| QST-16 | Quest event on disconnect boundary | Events after epoch invalidation do not advance counters |

## 10. Non-goals

No automation of quest execution, conversation, point-click puzzle solving, accepting secret tasks, picking consequential branches, paying quest fees or making narrative decisions. No replacement of universal Main Quest with any exclusive Legendary line. TD-04 owns content; TD-05 owns the final themed UI/animation assets.
