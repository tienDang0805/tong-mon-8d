# TD-03 — Server Protocol, Migration and Verification Plan

> TD-03 v0.5 • `OWNER_REVIEW_REQUIRED` • **DOCUMENTATION ONLY**. Not a code change request.
> Existing baseline: GitHub `master@d4e6e17` (2026-10-16 Phase 1B.0), canonical `GD-002..006`. Respect TD-01 v0.3 and TD-02 v0.4 decisions.

## 1. Current code reality vs proposed contracts

| Existing file/symbol | Verified current behavior | TD-03 impact when implementation is authorized |
|---|---|---|
| `packages/shared/src/index.ts` `AttackIntentPayload` | Type allows only 3 skill IDs, with `targetInstanceId`, `direction`, `requestId` | Add authenticated auto mode/config intents and server activity snapshots; keep manual attack compatibility until migration |
| `apps/server/src/worldEngine.ts` `handleAttackIntent()` | Chooses nearest monster if not specified, uses skill fallback, resolves damage/kill and issues rewards | Extract **one** authoritative `executeCombatAction`, share between manual and auto scheduler; reject unknown/unlearned skills per TD-02 |
| `apps/server/src/worldEngine.ts` kill rewards | Adds loot-table entries directly to inventory, spawns extra first-entry ground drop, adds Tu Vi and currency; no Character EXP/Dao XP | TD-01/02/04 unified event/reward ledger. No new server-generated kill event should duplicate old grants |
| `apps/server/src/worldEngine.ts` `handlePickupDrop()` | Range check, then removes ground drop and gives inventory item | Add ownership/expiry/atomic claim event; same path for manual/auto pickup |
| `apps/server/src/worldEngine.ts` `handleQuestAction()` | Public Phì Đế dish quest, `accept/submit`, status 3 states; may set `equippedInheritance=phi_de` | General quest templates/events; preserve public route, do not auto-complete/signature-confer Chân Truyền |
| `apps/server/src/worldEngine.ts` `handleClaimMeditation()` | Computes by elapsed time since last claim, even if not an explicit meditation mode | Move toward explicit meditation session and exclusive activity guard; preserve backed-up historical state |
| `apps/server/src/zoneRoom.ts` + Colyseus | Online room, input dispatch, shared snapshots, room lifecycle | Single controlling session/epoch per character with `onJoin/onLeave` and authoritative scheduling, not browser-interval attack spam |
| `apps/server/src/db.ts` | Character JSONB quests, single account character; state upsert and idempotency record are separate calls | Atomic reward/quest credit/outbox ledger and revision-aware updates; maintain old data through migration |
| `maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj` | Tiled maps with collision/portals; 32px grid and two-way transition | Validated server path/zone graph using existing geometry; no arbitrary coordinate teleport |
| `apps/client/src/WorldScene.ts` / UI | Direct input-centric presentation | Render server activity/path/quest-state snapshots, `Q` journal, highlight, Start/Stop AFK, request intents only |

**Security gap requiring a separate implementation gate:** Current prototype account identity is derived from account strings/nickname; a production-quality version requires actual authenticated account/session authorization. A valid Colyseus connection alone is not sufficient proof of ownership. No speculative auth service in this docs phase.

## 2. Suggested protocol (illustrative, not implementation source)

```ts
export type CharacterActivityMode =
  | "IDLE" | "AUTO_FARM" | "AUTO_NAVIGATE"
  | "MANUAL_INTERACTION" | "INSTANCE" | "MEDITATION";

export type ClientActivityIntent =
  | { kind: "start_auto_farm"; policyRevision: number; requestId: string }
  | { kind: "stop_activity"; requestId: string }
  | { kind: "configure_auto_farm"; config: AutoFarmConfig; requestId: string }
  | { kind: "navigate_to_quest_objective"; questId: string; objectiveId: string; expectedQuestRevision: number; requestId: string }
  | { kind: "accept_quest"; questId: string; requestId: string }
  | { kind: "submit_quest"; questId: string; acceptanceId: string; requestId: string };

export interface CharacterActivitySnapshot {
  characterId: string;
  mode: CharacterActivityMode;
  activityRevision: number;
  statusCode: string;
  navigation: NavigationSnapshot | null;
  autoFarmState: string | null;
  sessionVerifiedTotals: {
    kills: number;
    characterExp: string;
    daoMilliExp: string;
    awardedTuVi: string;
  };
}
```

The contract is a candidate; binding schemas and message names should follow current Colyseus idioms once implementation approved. **Never broadcast sensitive per-character quest/story or secret destination data to other clients**. Public room state may show position/animation/combat VFX; send private quest journal, contents of destiny and activity config to the authorized character only.

### Version and ordering rules

- `activityRevision` increments on every activity mode transition; controller epoch invalidates all previously queued commands.
- `expectedQuestRevision` and `acceptanceId` reject stale quest mutations.
- `requestId` deduplicates client-originated intents; `serverEventId` deduplicates server-authorized kill, inventory and quest counter grants.
- Client progress snapshots may be stale; a write with stale revision is rejected and full state refreshed. Never "last write wins" with currency/exp/quest states.
- Existing `AttackIntentPayload` manual J/K/L can be adapted to new registry but must not allow direct skill damage or any forged offline input.

## 3. Database and event proposal (no migrations performed)

| Logical storage | Identity/constraint | Purpose |
|---|---|---|
| `character_activity_policy` | PK character | Safe preference persisted; **activity running state must not resume after restart** |
| `active_controller` | character + epoch with a unique controlling lease | Prevent two tabs running same actor (volatile room + durable coordination for multi-worker, exact owner TBD) |
| `combat_event_ledger` | Unique `killEventId` / `combatActionId` | Exactly-once server hit/death resolution (event chain) |
| `reward_entitlements` | Unique `(killEventId,characterId,rewardKind[,entryId])` | No double drop/EXP/currency |
| `quest_acceptances` | Unique `acceptanceId`, `(characterId,questId,periodKey)` per policy | One accepted instance; versioned authored template |
| `quest_objective_credit` | Unique `(characterId,acceptanceId,objectiveId,sourceEventId)` | Replayed events can't repeat counters |
| `quest_reward_claims` | Unique `acceptanceId` and reward action id | Manual turn-in exactly once |
| `meditation_sessions` | Unique `sessionId`, claimed interval guard | Offline Tu Vi accrual only while authorized state; no overlap with online farm |
| `outbox` (optional) | Unique event ID | Replay-safe delivery of committed state/events to rooms/UI |

**Transaction boundary:** committing a kill, its eligible entitlements and the objective credit needs a single serializable/locked transaction or durable-outbox design with individual unique constraints. Avoid holding database transaction open for the entire animated cast; prevalidate and reserve cast in actor state, then transact the resolution. Joining two servers for same character requires an ownership lease/epoch with fencing tokens, not an in-process Map alone. DB constraints cannot be replaced by "we checked a boolean".

**Rewards:** TD-01 `expTowardNext` is a decimal string/bigint domain concept, not JS floating-point. Quest reward EXP uses the same validated grant routine; do not replicate level-up logic. TD-02 only credits Dao XP after a relevant valid execution and its `2000ms` path throttle. TD-04 decides whether a loot entry is ground-based or direct and party credit share, but never both for one entry. TD-05 implements feedback for session totals.

## 4. Implementation sequencing AFTER Design Freeze / owner approval

1. **Preflight:** backup PGlite/PostgreSQL and verify restore on throwaway database, audit existing data and legacy Phì Đế quest, read all frozen specs, run existing tests.
2. **TD-01 foundation:** character progression and source-stat migration, creation/destiny/authenticated actor state; explicit owner selection of new-char migration policy (already approved in design, still requires safe operational execution approval).
3. **TD-02 unified combat:** `executeCombatAction` validates technique/Dao, monster realm, damage, XP event, reward event; eliminate legacy duplicate loot behavior; test server-authoritative multiplayer.
4. **TD-03 connected activity:** presence/controller, one scheduler, start/stop auto farm, same combat path, no offline catch-up, session summary.
5. **TD-03 navigation:** authoritative path, same/2-zone routes, stop at interaction; cancel/manual precedence.
6. **TD-03 quest engine:** typed objective events and manual hand-in; first masked-immortal Main Quest gate and selected starter objectives; preserve legacy Phì Đế public event.
7. **TD-04 content:** quests/food/items/affinity, rewards, party policies and full world graph when specs have owner approval.
8. **TD-05 presentation:** art/UX asset pipeline with actual in-game screenshots and human approval.

This is an *implementation roadmap*, not an instruction to write code as part of TD-03 design, and not authorization to call paid asset providers.

## 5. Cross-feature, regression and adversarial test suite

| Test ID | Focus | Verification |
|---|---|---|
| INT-01 | Double-tab | One controlling epoch; spectator cannot farm/claim |
| INT-02 | Lag/reconnect | No attack or movement catch-up, no offline Character/Dao XP or quest progress |
| INT-03 | Level cap | Mob EXP blocked at Lv10/30 until valid major breakthrough; quest EXP same rule |
| INT-04 | Six Dao paths | Auto uses matching equipped skill only; TD-02 throttle and path stage trials respected |
| INT-05 | Technique kind | Công pháp never treated as auto-attack; 4 active skill slots plus 1 basic candidate |
| INT-06 | Skill spoofing | Forged/unlearned/silent fallback rejected |
| INT-07 | Monster race | 2 players/2 intents killing same life produce one death event, authorized entitlements only |
| INT-08 | Loot duplication | Direct vs ground drop exactly-once logical entitlement; no duplicate manual/auto pickup |
| INT-09 | Quest accept race | Kill before acceptance does not count, kill after acceptance counts once |
| INT-10 | Quest turn-in | No auto-submit even when objectives ready; manual submit once |
| INT-11 | 10 Legendary routes | Signature from Tiên Thiên or Hậu Thiên can qualify; no duplicate/second signature; public story accessible |
| INT-12 | Phì Đế legacy data | Public food event persists, `equippedInheritance` not magical True Disciple grant |
| INT-13 | Breakthrough Lv10 | Masked immortal quest, method, pill, Tu Vi, Level cap all required; navigation arrival alone insufficient |
| INT-14 | Offline meditation | At most eight hours eligible Tu Vi claim; no concurrent online farm grant or repeated claim |
| INT-15 | Cross-zone route | Collision and portal checks, no teleport; hidden/locked zone stops without spoilers |
| INT-16 | 20-player room | No duplicate auto scheduler on multi-worker takeover; actor updates bounded |
| INT-17 | Quest reward atomicity | Interrupted DB transaction/retry gives zero or exactly one reward, never partial split |
| INT-18 | UI | Real `Q` journal, tracker small, buttons distinct, Vietnamese readable 1280×720/390×844 |
| INT-19 | Game legacy | `verify:assets`, unit/integration, `typecheck`, build and 2-browser smoke test remain green |
| INT-20 | Secret story | Masked mentor identity unasserted; Phì Đế higher-plane reveal not leaked by route/quest snapshots |

## 6. Proof requirements for future Argon implementation

- Save actual commands, logs, screen recordings/screenshots and tests; report *what ran*, not what is planned.
- Make server session disconnect/reconnect observable in logs and a two-browser playtest. Browser-closed 30–120s test needs to show **no newly committed combat reward**, not just UI stopping animation.
- Verify there is **one reward path** and one `sourceEventId` between combat and quest counters.
- Document `npm run dev` server health, bounded scheduler activity, admin debug logs but no sensitive user data/secrets.
- Phì Đế public quest should continue to accept bought or cooked qualifying food; Chân Truyền only after one matching owned signature + affinity + special trigger + six completed chapters.

## 7. Risk register and required reviews

| Risk | Severity | Mitigation |
|---|---|---|
| Auto XP while disconnected due to grace/reconnection simulation | Critical | Epoch fencing, no catch-up, close-driven stop |
| Guest identity/same account simultaneous controllers | Critical | Authenticated ownership before durable game; single-writer lease |
| Combat reward duplicated by manual + auto handlers | Critical | One combat event/transaction; TD-02/04 migration |
| Hidden quest locations leaked by auto-navigation | High | Server-side discovery conditions; spoiler-safe errors |
| Unbounded A* and event scheduler blocking multiplayer | High | Rate/budget limiting, small-map tests, cached map graph |
| Offline meditation and online farm overlapping | High | Exclusive activity intervals, server-time claims |
| Intro Level breakthrough bypass | Critical | TD-01 gate and server-only manual quest flags |
| Existing saves overwritten by new schema | Critical | Additive migration, backed-up restore dry run |

## 8. What is NOT approved

No implementation, schema write, new map, new art, new Legendary signature naming, silent NPC realm changes, full 60-quest expansion, payments/PvP, proxy-account bot systems, or new offline reward kinds. TD-03 awaits owner design review and later combined TD-01..05 freeze.
