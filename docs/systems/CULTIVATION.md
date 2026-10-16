# SYS-CULTIVATION — Character EXP, Tu Vi, Realm & Breakthrough

> TD-01 • Technical design proposal v0.3 • **REVIEW_REQUIRED**  
> Design decisions `GD-020..023`, `GD-044`, `GD-005`. Current data reference `packages/game-data/src/index.ts` (`REALM_PROGRESSION`, `getRealmRequiredTuVi`, `getNextRealmAndStage`, `computeOfflineMeditationReward`).

## 1. Two distinct resources, two parallel progress bars

| Track | Earned by | Used for | Constraint |
|---|---|---|---|
| Character EXP | Legitimate monster combat, quests, exploration/event rewards | Level up, gain 1 free attribute point per Level | Hard Level cap for current major realm except at Thánh Cảnh |
| Tu Vi | Bế Quan, Công pháp, pills, eligible opportunities/quests | Advance minor realm stages and perform major breakthrough | Requires stage-specific Tu Vi and breakthrough prerequisites |

**No conversion from EXP to Tu Vi or vice versa by default.** A specific authored consumable may award one resource independently; this must not implicitly produce the other. Dao EXP for the six martial paths is a **third** progression track owned by TD-02.

## 2. Immutable realm ordering and Character Level bands

`Phàm Nhân` (index `0`) is a pre-cultivation intro state, **not** one of the 17 major cultivation realms. Keep canonical ID and exact order from existing `REALM_PROGRESSION`.

| Realm index | Realm name | Character Levels | Stage count in current code |
|---:|---|---:|---:|
| 0 | Phàm Nhân | 1–10 | 1 |
| 1 | Luyện Khí | 11–30 | 9 |
| 2 | Trúc Cơ | 31–50 | 4 |
| 3 | Kim Đan | 51–70 | 4 |
| 4 | Nguyên Anh | 71–90 | 4 |
| 5 | Hóa Thần | 91–110 | 4 |
| 6 | Luyện Hư | 111–130 | 4 |
| 7 | Hợp Thể | 131–150 | 4 |
| 8 | Độ Kiếp | 151–170 | 4 |
| 9 | Bán Tiên | 171–190 | 4 |
| 10 | Chân Tiên | 191–210 | 4 |
| 11 | Thái Ất Kim Tiên | 211–230 | 4 |
| 12 | Đại La Kim Tiên | 231–250 | 4 |
| 13 | Trảm Nhất Đao | 251–270 | 4 |
| 14 | Trảm Nhị Đao | 271–290 | 4 |
| 15 | Trảm Tam Đao | 291–310 | 4 |
| 16 | Bán Thánh | 311–330 | 4 |
| 17 | Thánh Cảnh | 331–350, then 351+ | 4 |

For a non-Saint index `r >= 1`, `minLevel(r) = 11 + 20*(r-1)`, `maxLevel(r) = 30 + 20*(r-1)`. For Phàm Nhân, `min=1`, `max=10`. At Thánh Cảnh, `maxLevel = null` by approved design; 350 is the **end of its initial 20-Level band, not a cap**.

Do not interpret `stageCount=4` for other realms as a reason to invent 20 distinct minor stages; the existing named Sơ/Trung/Hậu/Đỉnh Phong stage scheme remains a valid baseline until content review. A realm stage and a Character Level are separate concepts.

## 3. Realm stage independence and major breakthrough gate

**Proposed implementable rule**:

- Minor stage advancement (`realmStage s → s+1`) is driven by **Tu Vi** and any approved item/trial requirements. It does **not** require Character Level to hit a specific minor-stage band.
- Players may reach Luyện Khí stage 9 while still at Level 15 if they have earned sufficient Tu Vi. They still cannot enter Trúc Cơ until Level **30**.
- Major realm advancement requires **both** `(level == currentRealm.maxLevel)` **and** `(realmStage == currentRealm.stageCount)`, plus required Tu Vi, quest/unlock flags and consumed items.
- If a Level-30 Luyện Khí is still stage 7, Level stays at 30 while Tu Vi cultivation continues. If a Level-15 Luyện Khí is already stage 9, their Tu Vi remains available but they must accumulate EXP to Level 30.
- For the last playable realm Thánh Cảnh: normal minor stages may still advance to stage 4; there is **no major breakthrough** to Đại Thánh. Level may continue 351, 352, ... with escalating EXP without further major realm changes.

This preserves independent growth *currencies* without allowing Tu Vi alone to leap across multiple major realms, which would bypass map bands and invalidate the intended level cap.

## 4. Character EXP curve — integer simulation candidate

The owner approved the cap structure and increasing cost; **not** specific numbers. Candidate per-Level cost for moving from Level `L` to `L+1`:

`expToNext(L) = 100 + 30*L + 8*L*L + 2*max(0,L-350)^2`, for integer `L >= 1`.

This is a simple integer polynomial: deterministic, monotonically increasing, no artificial barrier after Level 350. It does **not** have an exponential term that would become unusable as Level approaches 1,000+. **Practical numeric storage bounds still exist**; a real software system cannot represent literally infinite integer magnitudes. Use an integer-safe implementation and guard supported database ranges without adding a gameplay maximum.

| Current Level | EXP needed for next Level | Note |
|---:|---:|---|
| 1 | 138 | First milestone |
| 5 | 450 | Mortal intro |
| 10 | 1,200 | **Not awardable yet** until Luyện Khí breakthrough |
| 11 | 1,398 | Luyện Khí |
| 20 | 3,900 | Luyện Khí |
| 30 | 8,200 | **Not awardable yet** until Trúc Cơ breakthrough |
| 31 | 8,718 | Trúc Cơ |
| 100 | 83,100 | Mid-game example |
| 330 | 881,200 | Bán Thánh major cap |
| 350 | 990,600 | Thánh Cảnh, Level 351 is **allowed** |
| 351 | 996,240 | Unlimited Saint progression |
| 400 | 1,297,100 | Increasing curve |
| 500 | 2,060,100 | Increasing curve |
| 1,000 | 8,875,100 | No gameplay hard cap |

`expTowardNext` is a non-negative integer stored as a **decimal string** over the wire and in the domain model; use `bigint` internally for additive/cost arithmetic. SQL storage candidate: `NUMERIC(38,0)` if peak volumes fit, with explicit overflow error/review before reaching storage limits. Do not JSON-serialize a raw JS BigInt.

### 4.1 XP award algorithm

1. Validate server-authenticated event, target eligibility and unique reward source to prevent replay/AFK exploit.
2. If `currentLevel` is at a **non-Saint major realm cap**, award **zero Character EXP**, with reason `LEVEL_CAPPED`; reward other eligible resources/items normally.
3. Otherwise add validated EXP as bigint to `expTowardNext`.
4. While progress >= `expToNext(currentLevel)` and currentLevel is eligible to advance: subtract cost, increase Level by 1, add 1 unspent attribute point, recompute cap and repeat.
5. On reaching a non-Saint realm cap, **discard any overflow EXP in this event** and set `expTowardNext=0`. Future EXP awards are blocked until breakthrough. This policy is a **DESIGN_BASELINE requiring owner/playtest review**, not a previously approved decision; alternate banked-EXP models were considered but allow immediate multi-level skip after breakthrough.
6. Commit stat points, level, EXP, reward ledger and source event atomically. Repeated source event must not re-award.

Example: Phàm Nhân Level 9 with 350 stored EXP defeats a quest monster granting 800 EXP. If cost from Lv9→10 is `1,018`, Level becomes 10, gains one point, and 132 excess EXP is discarded by the baseline cap rule. User sees `Lv10 — Cần đột phá Luyện Khí để tiếp tục tăng Level`.

If user prefers carryover, revise **only this one policy** with a bounded bank before coding, plus tests.

## 5. Tu Vi & breakthrough flow

Use current realm-stage definitions from `packages/game-data/src/index.ts` as initial **legacy parameters**, not as final approved long-term balance. The existing `getRealmRequiredTuVi(realmId, stage)` has a deterministic numeric curve per realm. TD-01 adds stage/level/quest validation and changes stat computation, without automatically rewriting all Tu Vi costs.

```ts
export interface CultivationProgress {
  realmId: CanonicalRealmId;
  realmStage: number;
  tuVi: string;
  breakthroughHistory: Array<{ realmId: CanonicalRealmId; stage: number; actionId: string }>;
  activeMeditationSessionId: string | null;
}

export type BreakthroughOutcome =
  | { ok: true; nextRealmId: CanonicalRealmId; nextStage: number }
  | { ok: false; reason: "INSUFFICIENT_TU_VI" | "LEVEL_CAP_NOT_REACHED" | "QUEST_FLAG_MISSING" | "PILL_MISSING" | "INVALID_STAGE" | "MAX_REALM" };
```

### 5.1 Phàm Nhân → Luyện Khí: hard story gate

The ONLY designed opening gate is the owner's approved **Main Quest** with a **masked immortal of unknown identity**, beginner Công pháp and breakthrough pill:

`level == 10` **AND** `realmId==pham_nhan` **AND** `realmStage==1` **AND** `mainQuestFlag("masked_immortal_trial_completed")` **AND** `knowsStarterCultivationMethod` **AND** `ownsAtLeastOne(validStarterBreakthroughPill)` **AND** `TuVi >= required`.

The story flag and item IDs are **technical placeholders**, not approved final item/quest IDs. The quest engine must award the pill and method to the player through validated actions. The user manually confirms breakthrough; consuming the pill and advancing realm are one atomic transaction. **No client-trusted quest flag and no bypass through the old `breakthrough` intent.** If conditions fail, preserve inventory and Tu Vi.

### 5.2 Later minor/major breakthroughs

`minor`: require valid `(realmId, currentStage < stageCount)`, enough Tu Vi and any content-specific authored requirement. Deduct Tu Vi; stage +1; recompute stats. **Level stays unchanged**.

`major`: require `(level == maxLevel(realmId))`, `(stage == stageCount)`, valid next realm, Tu Vi, authored pill/quest/condition requirements. Deduct Tu Vi and consume materials atomically, set `(nextRealmId, stage=1)`, keep current Character Level at its previous cap (e.g., `30`), expand allowed leveling up to `50`, recalculate stats, refill resources once. The **next EXP award** promotes Lv30→31; the breakthrough does not silently grant a free Level or stat point.

`saint`: never allow a `nextRealmId` beyond Thánh Cảnh. Minor stages can complete; `Level 350→351` is normal EXP advancement and requires **no new major breakthrough**.

## 6. Offline Bế Quan vs online farming

- Offline meditation remains **distinct from Auto Farm** (`GD-005`) with current 8-hour cap. When disconnected, combat EXP, Dao combat EXP, loot and quests do not progress.
- Prefer an explicit server-authorized meditation session/state with `startedAt`, `lastClaimAt`, `claimedThrough`, valid modifiers and transaction id. Do not simultaneously accrue offline meditation during active online farm.
- Current implementation uses `lastMeditationClaimAt` elapsed time and `computeOfflineMeditationReward` even when no explicit meditation activity was selected. Migrating this to an exclusive activity requires TD-03 online-presence semantics and a transitional allowance for old saves; **do not rewrite without TD-03 sign-off**.
- Zero negative elapsed time, cap 8 hours each claim window (subject to anti-replay policy), use server time, not client wall-clock. Multiple tabs / retry must not generate parallel claims.

## 7. Save/migration invariants & tests

- `realmIndex` must be 0..17; `realmStage` must be 1..`stageCount`. Any existing out-of-range data should be quarantined, not silently coerced.
- Level must be inside the realm's **post-breakthrough boundary band**: for realm `r>=1`, allowed Level is `[minLevel(r)-1, maxLevel(r)]`, because a successful major breakthrough changes realm while preserving the previous cap Level (e.g. Luyện Khí at Lv10, Trúc Cơ at Lv30); for Phàm Nhân `[1,10]`, and for Thánh Cảnh `[330,+∞)`. Migration must choose a valid starting Level for old characters.
- `tuVi >= 0` and `expTowardNext >= 0`, integer-safe; never write Infinity, NaN or negative values.
- Only server may grant progress, test twice with same idempotency token, verify exactly-once behavior; cross-tab locking/transaction required.
- The Level/realm relationship is a **cap/unlock relation**, not `level = realmIndex*20 + minorStage`.

`CUL-01` Character Level 10 cannot become 11 before completed masked-immortal quest/realms; `CUL-02` quest flag alone without pill/method rejected; `CUL-03` Lv10 valid breakthrough enters Luyện Khí while remaining Lv10; `CUL-04` Lv10→11 works after realm advancement; `CUL-05` early stage 9 at Lv15 allowed but Trúc Cơ denied; `CUL-06` Lv30 stage9 can enter Trúc Cơ, next level capped at Lv50; `CUL-07` Lv30 stage7 cannot enter Trúc Cơ; `CUL-08` Lv350→351 succeeds in Thánh Cảnh; `CUL-09` no gameplay hard cap at 351; `CUL-10` no EXP credit after cap; `CUL-11` simultaneous breakpoint requests award once; `CUL-12` offline farm gives no EXP/loot while legitimate capped meditation can accrue Tu Vi.

## 8. What is deliberately deferred

Exact monster/quest EXP source rates, balanced Tu Vi cost tables for all 17 realms, Dao path XP, realm suppression, high-level EXP/hour goals, item crafting sources and meditative buff stacking belong to TD-02/TD-03/TD-04. Do not claim polynomial curve makes the game balanced without simulations using actual kill rate and reward sources.
