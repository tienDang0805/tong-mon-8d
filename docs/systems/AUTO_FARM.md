# SYS-AUTO-FARM — Online-Only Automatic Combat

> TD-03 v0.5 | **OWNER_REVIEW_REQUIRED** | Authority `GD-002`, `GD-005`, `GD-020..027`, `GD-030..034`.
> Depends on TD-01 `CHARACTER.md`, `CULTIVATION.md`, `DESTINY.md`; TD-02 `COMBAT.md`, `TECHNIQUES.md`, `DAO_MASTERY.md`. May not reinterpret any approved constraint.

## 1. Scope and absolute boundaries

**APPROVED:** Character can automatically search for valid nearby monsters, move toward targets, execute learned/equipped martial skills with normal resource/cooldown/range constraints, use explicitly configured healing consumables, claim legitimate combat rewards and pick up eligible drops **only while an authenticated, controlling browser is connected to the authoritative server**. No connected player ⇒ no auto combat, Character EXP, Dao combat EXP, loot, currency or quest kill progress; **never replay disconnected combat time after reconnect**. Ordinary manual combat and auto combat use the **same** combat/reward handler from TD-02.

**APPROVED:** No auto-accepting, auto-submitting, auto-dialogue, auto-deciding quests; moving to a quest NPC is navigation, not quest execution (see `NAVIGATION.md`, `QUEST_ENGINE.md`). Online auto kills may increment *already accepted* kill quests, but the player still interacts/submits manually.

**APPROVED:** Offline `bế quan` may earn bounded Tu Vi for up to eight hours, as a **separate mode** from combat. No Dao combat XP offline. **DESIGN_BASELINE for review:** offline meditation must be intentionally started, rather than automatically granting old passive claims on every disconnect. Exact migration from old time-based implementation is owned jointly by TD-01/03.

**NOT IN TD-03:** new damage/crit/Dao EXP formula (TD-02), monster stats & spawn economy (TD-02/04), equipment quality/loot tables/party reward shares (TD-04), animation generation (TD-05), botting via fake browsers or simulated online presence.

## 2. One authority, one activity at a time

`CharacterActivityMode = IDLE | AUTO_FARM | AUTO_NAVIGATE | MANUAL_INTERACTION | INSTANCE | MEDITATION`.

- `AUTO_FARM` and `AUTO_NAVIGATE` **mutually exclusive**. Switching to quest travel suspends farming immediately, without killing/claiming a previously selected enemy by a second pipeline.
- Entering an NPC dialogue, consequential quest selection, a point-and-click puzzle, a protected menu with a manual irreversible action, a major breakthrough, or a separately governed instance **pauses/disables** auto-farm by explicit server policy. Opening the `Q` journal only **does not accept/execute a quest**, and need not stop combat by itself; starting navigation from the journal *does* switch mode.
- Manual movement or explicitly pressing Stop interrupts automation. Manual attack and auto-attack cannot run two independent cooldown/loot engines: both submit into one serialized server action queue.
- On character death, auth revocation, disconnection, session control loss, server handoff or zone unload: prevent all future automated attack resolutions. Already committed valid events stay committed.
- No automatic resurrection, purchases, quest hand-in, or risky boss initiation without an authored/manual policy.

`AUTO_FARM` is a requested server activity, **not** a client timer that issues attacks while minimized. The client may request an activity and change configuration, but never dictate hit result or how many ticks passed.

## 3. Presence, connection lifecycle, multi-tab policy

**Presence is server-verified, not inferred from a user's nickname, client-provided `isOnline`, device clock or localStorage.** A controller has verified account/character ownership, an active Colyseus session registered on the authoritative room, and the active `controllerEpoch` for that character. Only that epoch may control auto modes. A second browser tab may view or must request an explicit takeover; it must not double farm. Authentication itself is a separate security prerequisite — existing guest account/nickname strings are insufficient as ownership proof for durable deployment.

### Server state transitions

| Event | Required server behavior |
|---|---|
| Authenticated initial room join | Validate actor, attach new controller epoch if authorized, default `IDLE`. No automatic farm resume after relog. |
| Start Auto Farm request | Validate active controller, zone permit, alive state, policy revision, eligible loadout; enter `AUTO_FARM`. |
| Connection closes / room `onLeave` | In the same authoritative ordering point, cancel queued noncommitted auto actions, invalidate controller epoch, stop actor auto loop. |
| Network timeout | Treat as disconnect once transport/server room declares the connection absent; **no reward-producing grace period** after that point. Detection latency is a network property, not bonus offline combat. |
| Reconnect | New control epoch, resume `IDLE`; show last summary, user decides whether to start AFK again. **No catch-up attacks.** |
| Multi-tab takeover | Previous epoch loses authority **before** replacement becomes active; serialized and auditable; no overlap. |
| Server crash/restart | Persist committed events/state; do **not** persist auto mode as runnable work; all actors start `IDLE` on new join. |

**DESIGN_BASELINE:** No guaranteed background farming if a mobile browser suspends or loses transport; a genuinely connected browser can continue while unfocused if the server connection remains alive. Do not treat a browser tab's own self-reported heartbeat as authoritative proof of network liveness.

## 4. Auto-farm state machine

Inner state is scoped to a live `AUTO_FARM` activity:

```
READY -> SEARCH_TARGET -> MOVE_TO_TARGET -> SELECT_SKILL -> CASTING
   ^          |                |                 |          |
   |          +---- NO_TARGET -+-- NO_PATH ------+          |
   |                                             v          v
   +----------- LOOT_PICKUP <- COMBAT_RESULT <- RECOVERY
                                  |
                                  +-> TARGET_DEAD -> SEARCH_TARGET
                                  +-> ACTOR_DEAD  -> STOPPED
                                  +-> INVALID     -> REASSESS

ANY_STATE -> STOPPED on disconnect / new controller / manual stop / forbidden mode
```

Rules: update state in a serialized actor step; each cast consumes the **same** TD-02 cooldown/MP/action validation as manual combat; never create additional synthetic combat events merely because the scheduler woke. `CASTING` schedules at most one outstanding execution token and is canceled if its epoch becomes stale before resolution. If a target dies, leaves range, becomes protected or is blocked, revalidate when execution resolves. Stale target resolution is a failure, not a free hit.

No-target behavior is **bounded idle/backoff**, not global searching/teleporting to unlimited maps. Out of medicine/MP may fall back to legal basic skill *only if that skill is known/equipped*; never use the prototype's invalid-skill fallback. HP below configured safe floor triggers a stop/retreat per explicit approved mode, not suicidal farm forever.

## 5. Policy contract — server-validated, not executable script

Illustrative domain contract (no TypeScript implementation authorized):

```ts
export type TargetPolicy = "safe" | "same_realm_or_lower" | "challenge_opt_in";
export type RecoveryPolicy = "pause_at_low_hp" | "use_owned_consumable_then_pause";

export interface AutoFarmConfig {
  targetPolicy: TargetPolicy;
  permittedMonsterIds: string[];
  excludedMonsterIds: string[];
  excludeElitesAndBosses: boolean;
  maxPursuitDistancePx: number;
  chosenSkillPriorityIds: string[];
  healBelowHpPercent: number;
  restoreMpBelowPercent: number;
  recoveryPolicy: RecoveryPolicy;
  allowGroundLootPickup: boolean;
  revision: number;
}

export interface AutoFarmRuntime {
  characterId: string;
  controllerEpoch: string;
  activityId: string;
  state: "search" | "approach" | "cast" | "recover" | "loot" | "paused";
  targetSpawnInstanceId: string | null;
  outstandingCastId: string | null;
  lastDecisionAtMs: number;
  pausedReason: string | null;
}
```

`safe` is the initial candidate preset: no elites, no bosses, no higher-major-realm enemies, respect authored noncombat/safe zones, stop at low HP. Target scoring example (not locked): legal/visible/in-range zone target only → safety eligibility → path reachable → low travel time → reachable attack range → stable `spawnInstanceId` tie-break. No magically omniscient target selection through fogged/unvisited map sections; enemy awareness follows existing zone visibility rules.

Proposed owner-adjustable bounded defaults: `healBelowHpPercent=35`, `restoreMpBelowPercent=20`, `maxPursuitDistancePx=320` (10 current 32px tiles), `excludeElitesAndBosses=true`; these are **DESIGN_BASELINE**, not approved numbers. Consumables must be owned, authorized, not quest-reserved, with cooldown/slot limitations. Never silently buy consumables with Linh Thạch.

`chosenSkillPriorityIds` must be a permutation/subset of *equipped legal* active Võ Kỹ from TD-02, max four active slots plus equipped basic attack. Unknown, unlearned or unauthorized skills must be **rejected**, not rewritten to `basic_slash`. A Công pháp is not scheduled as an attack. Technique quality does not add an extra generic runtime damage multiplier. A valid relevant hit may earn Dao XP subject to **TD-02's 2,000ms per-path credit throttle** and challenge relevance; no fabricated Dao XP from idle time or multihit multiplication.

## 6. Scheduler and transactional event flow

**DESIGN_BASELINE:** Evaluate active farm actors at up to **5 decisions per second per actor** (`200ms` planning interval), separate from existing movement/physics/network tick. At 20 concurrent players this is at most **100 planning evaluations/s**, not 100 skill hits/s. Use one event loop or modest scheduler, **no independent interval per character**. Hard caps on outstanding path requests and cast resolutions prevent server overload. Combat remains constrained by real skill casting/recovery/CD and enemy AI tick.

Canonical chain (one resolved combat event, source identical for manual and auto):

`PresenceValid → ActivityEpochValid → TargetValid → SkillKnown&Equipped → Range/LOS/Resource/CooldownValid → Single HitResolution → MonsterDeathEvent? → ExactlyOnce RewardAttribution → CharacterEXP/TuViConfigured/ItemOrDrop/Currency → DaoCredit if eligible → QuestObjectiveCredit if active → Outbox/ClientSnapshot`.

**Exactly-once logical reward semantics:** Each monster life has stable `(zoneInstance, monsterSpawnId, spawnGeneration)`. Death produces one `killEventId`, authoritatively owned by server; receipt and unique reward `(killEventId, characterId, rewardKind)` persisted in the same transaction or durable outbox/unique-ledger pattern. Reconnect, duplicated packet, room restart or competing group damage **cannot** mint another kill reward. RequestId alone is not a reliable key for server-created kill events.

TD-01 EXP cap remains authoritative: any valid kill at non-Saint current realm level cap earns **zero Character EXP** (not banked), but may legitimately grant other eligible rewards/Dao XP. Never silently convert blocked Character EXP into Tu Vi. TD-02 combat damage, realm pressure, crit, Dao stage skill coefficient, per-path skill-use credit rule and anti-trivial-monster logic are reused verbatim, not redefined here.

TD-04 owns the final **one-of** loot delivery policy; until then, enforce a hard contract: an authored loot entry cannot be both credited directly into inventory **and** placed on ground as another acquirable instance. Auto pickup is only the same legal server pickup event as manual pickup; if ground-drop mode selected, eligible owner/range/expiry/filters apply. No pickup of other player's reserved loot.

## 7. AFK safety, fairness and party interactions

- No PvP targeting in v1. Auto target cannot initiate dialogue/trade, attack friendly NPCs, steal reserved quest items or enter inaccessible locked instances.
- Local farm bounds/zone events and anti-AFK trivial monster reward relevance must use TD-02 authoritative enemy threat, not player-submitted target level.
- Scarce spawns in shared zones are shared, not cloned because a player wants to farm; the initial forest currently contains only four mob spawns. TD-04 owns content balancing and eligible party contribution rules. Never scale monster stats to each player's rolled destiny.
- Co-op combat credit, threat/aggro, kill-stealing, optional party sharing and resource drops are TD-04 contracts; no unconditional award to every nearby AFK party member.
- On logout: clear volatile AI state but preserve committed gameplay, current position, HP/MP, eligible cooldown persistence (if implemented) and stop record. If an uncommitted attack was scheduled but not resolved before disconnect, **cancel it**. Resolve event ordering via serialized server event loop; no compensation grants from client logs.

## 8. Runtime observability and acceptance

Telemetry (privacy-safe) by server: `characterId`, `controllerEpoch`, `activityId`, state transition/reason, sampled search latency, path failures, skill use failure, combat event count, kill/event reward count, consumables used and actual online connected duration. Session summary: verified kills, Character EXP, Dao XP, Tu Vi configured awards, loot, consumables, pause reasons and time online. No user-supplied telemetry counts used for rewards.

Required tests:

| ID | Scenario | Required result |
|---|---|---|
| AFK-01 | Disconnect while `AUTO_FARM`, idle two hours | No additional hits, drops, Character/Dao EXP, quest count or combat loot after authoritative disconnect |
| AFK-02 | Reconnect twice after disconnect | `IDLE` by default; no catch-up attacks or rewards |
| AFK-03 | Two browsers same character request farm simultaneously | One authoritative controller epoch only; no double combat |
| AFK-04 | Cancel mid-cast, epoch invalidated before resolution | No future attack/damage/reward from canceled cast |
| AFK-05 | Client forges damage/reward event or `skillId` | Ignored/rejected; no reward minted |
| AFK-06 | Skill unlearned/unloaded/on cooldown/not enough MP | No successful cast or free fallback |
| AFK-07 | Lv10 Phàm at cap farms valid mobs | Loot and allowed Dao XP possible, Character EXP remains 0 |
| AFK-08 | AoE hits multiple mobs quickly | TD-02 Dao XP throttles by path/action, not each target; kill reward once per mob life |
| AFK-09 | Auto pickup vs manual pickup race | Exactly one ownership-checked inventory grant per drop |
| AFK-10 | Low HP / no potions | Safe pause; no unauthorized shop purchase or auto resurrect |
| AFK-11 | 20 online connected controllers, same room | Planning load ≤100 actor evaluations/s baseline, no extra hit bypass |
| AFK-12 | Old `tuViReward` mob and new EXP | Clearly authored independent currencies; no duplicate conversion |
| AFK-13 | Empty/invalid target list and blocked path | Bounded idle/backoff and informative status, not spin/teleport |
| AFK-14 | Manual movement/quest interaction overrides Auto Farm | At most one mode and no automated quest submission |

## 9. Deferred decisions / design boundary

Open for technical/gameplay review: exact disconnect detection latency, max pursuit distance, potion thresholds, auto priority UI, whether player must explicitly select meditation before logoff, full party reward attribution, ground vs direct loot presentation, recovery/healing economics. Final values to be integrated with TD-04 and TD-05 UI. **No source changes are authorized by this document.**
