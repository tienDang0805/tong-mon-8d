# TD-01 — Repo Impact, Migration Plan, Security & Verification Matrix

> Technical design proposal • **REVIEW_REQUIRED**, NOT an implementation instruction. Examined remote `master@d4e6e17` source and `docs/DECISIONS.md`; no code was modified for this deliverable.

## 1. Grounded repository impact inventory

| File | Observed implementation | Required future change |
|---|---|---|
| `packages/shared/src/index.ts` | `CombatDisciplineId` has just 3 values; `CharacterSaveState` has `realmId/realmStage/tuVi` and persisted HP/MP/ATK/DEF; no Character EXP/Level, six base stats or destiny collection | Add versioned character aggregate/protocol types, preserve compatibility until migration |
| `packages/game-data/src/index.ts` | 18 entries total (Phàm Nhân + 17 major), Luyện Khí `stageCount=9`, other major realms `stageCount=4`; `getRealmRequiredTuVi`, `getNextRealmAndStage`, `computeOfflineMeditationReward` | Retain canonical IDs, derive realm index/stages via registry, add level ranges/formula registry; preserve existing Tu Vi behavior as legacy parameters pending balance |
| `apps/server/src/db.ts` | `characters` has one row per `account_id`, numeric Tu Vi and persisted final stats; `loadOrCreateCharacter` immediately makes a hero using initial 3-class stats | Introduce explicit creation flow, additive migrations and rollback, atomic Level/trait changes, new ownership/version fields |
| `apps/server/src/worldEngine.ts` | `handleBreakthrough` spends Tu Vi, advances stage/realm, directly increments maxHP/MP/ATK/DEF; no Level gate or masked-immortal quest gate | Route through validated cultivation engine and pure stat recompute; stage/Level gate prevents bypass |
| `apps/server/src/worldEngine.ts` | Public `phi_de_ch1_huong_thom` quest can set `equippedInheritance="phi_de"` and grant buff merely via food submission | Preserve ordinary food quest; do **not** interpret this as signature acquisition or Chân Truyền completion |
| `apps/server/src/worldEngine.ts` | `getEffectiveStats` filters expired buffs by mutating player data | Make stat calculation pure, cleanup in dedicated server state transition |
| `apps/server/src/db.ts` | Idempotency ledger has `request_id` global PK; saves use upsert | Add scoped action ids and atomic uniqueness/revision guarantees for XP, spend, creation, breakthrough, signature grants |
| `apps/client/src/WorldScene.ts` and UI code | Prototype primarily supports direct movement/basic skill actions | Eventually show two bars + base attributes + character creation and roll flow, deferred out of TD-01 docs integration |

## 2. Recommended migration approach: additive / reversible

Never drop existing character saves or silently grant a second Legendary signature. Current repo is for a small friends' prototype, but **assume real progress may exist**.

### M0 — backups, inspection and compatibility ledger

Before writing code, back up PGlite/PostgreSQL and record anonymized counts of existing `characters`, realm distributions, highest `tu_vi` and public Phì Đế quest completions. Do not commit `.env`, SQL dumps or personal save data. Validate recovery by restoring a throwaway copy.

### M1 — schema expansion only

Add a schema version and new progression fields alongside existing columns, for example `level`, `exp_toward_next NUMERIC(38,0)`, `unspent_attribute_points`, `allocated_attributes_json`, `earned_permanent_json`, `creation_state`, `ruleset_version`, `revision`; add separately keyed destiny rows/JSONB with validations. Do not overwrite old attack/defense yet. Write separate read adapters for `legacy/v1` and `v0.2`, gated by feature flag, and backfill in idempotent batches.

### M2 — how to deal with existing characters (REQUIRES owner sign-off)

There is **no trustworthy historical Character EXP**, no saved Tiên Thiên roll and no six-attribute allocation. These cannot be recovered from Tu Vi/stage/old ATK numbers without inventing a player's prior choices. Present a migration policy to owner:

- **Option A (recommended for a tiny private prototype):** archive backed-up old save, ask each friend to create a **new v0.2 character** and roll Tiên Thiên, optionally grant explicitly approved cosmetic / early-game compensation. No fabricated old EXP, does not erase archive.
- **Option B (continuity-focused):** retain identity/items/quest history, set a provisional Level at realm lower boundary and grant all Level-derived points as **unallocated**, then require a fresh one-time Tiên Thiên creation ritual. Confirm that old major-realm progression is respected and handle the realm-boundary Level exception; present a before/after summary for each character.
- **Option C:** provide opt-in per-character choice between fresh start and continuity. Most complex, only if owners need it.

Do NOT assume Option A is approved merely because it is recommended. If old `equippedInheritance=phi_de`, preserve as legacy cosmetic/blessing status only, not a True Disciple flag.

### M3 — stat read-model transition

Compute all stats from 6 base stats + realm factor + legal modifiers, server-authoritative; read old fields only as a compatibility fallback for old flagged characters. Verify HP/MP clamp and no equipment/trait change grants extra healing. Add regression tests comparing old save consistency and new output, knowing exact new numbers will differ intentionally.

### M4 — switch writes, audit, rollback

Move writes for Level/EXP/cultivation/destiny to transactional repository methods; avoid exposing a parallel writable legacy and new stat representation. Ensure multi-tab concurrency using row-level locks/optimistic CAS revision. After a monitored window and owner approval, remove legacy read/write paths in a **separate** cleanup commit, not the first migration.

## 3. Transaction boundaries and anti-cheat

The Colyseus server owns truth; the client sends intent only. Atomic server operations:

| Action | Must validate | Atomic writes |
|---|---|---|
| `confirmCreation` | Authenticated account, nonce, 3 IDs valid/no conflict, only once | identity + 3 innate + timestamp + nonce consumed |
| `grantExp` | Source legitimately awarded, character alive/eligible per TD-02, unique sourceEventId | Level, EXP, free points, reward ledger |
| `allocateAttribute` | Existing char, available points, valid stat key, nonnegative integer | allocated values, free points, revision |
| `advanceMinorStage` | Valid stage, sufficient Tu Vi, required resources/trials | Tu Vi spend, new stage, resources, revision |
| `majorBreakthrough` | Max Level, final minor stage, Tu Vi, item + flags, realm successor | Tu Vi & item spend, realm change, HP/MP policy, audit |
| `grantDestiny` | Authored grant, signed server event, ownership/signature exclusion | collection + ownership row + reward ledger |
| `setAcquiredSlot` | Active slots 0..2, ownership, no duplicate equip | equipment slot, revision |

For all, transaction has **idempotency** and serializes competing operations per character. Do not rely on checking `requestId` in one SQL query then mutating in a second query without transaction/lock. Prefer a unique server award event key for EXP farming so 1 kill cannot produce 2 claims from duplicated network messages.

Do not accept client-supplied `characterId` without checking account/session authorization; guest nickname is not durable proof of identity. Consent around migration and private saves should be retained.

## 4. Acceptance test matrix

| Area | Required proof |
|---|---|
| Structural | Phàm Nhân + 17 realms exact order, 10 immutable canonical Legendary NPC identities preserved |
| Creation | Unlimited whole-set rerolls; confirmed innate triple immutable and saved exactly once |
| Attributes | Level `L` gives exactly `L-1` points earned by leveling; allocate/return/reconnect maintain invariant |
| EXP | Lv1->10 costs and block; Lv10→11 only after intro breakthrough; Lv30 caps before Trúc Cơ; Saint 350→351 works |
| Tu Vi | 9-stage Luyện Khí + remaining 4-stage realms; independent stage progression, major gate checks both tracks |
| Stats | Pure rebuild, monotonic realm stages and major advancement; no permanent stacking when re-equip/buff expires |
| Destiny | No two distinct signatures from creation, quests, rewards or concurrent grants; unequipped owned signature satisfies disciple gate |
| Narrative | Masked immortal quest + starter method + breakthrough pill are mandatory; ordinary Phì Đế dish quest cannot confer Chân Truyền |
| Security | One server event awards once; no forged EXP/realm/trait; parallel multi-tab requests serialize; no cross-account update |
| Existing saves | Backed-up legacy character migration choice honored; no data loss or silent illegal inheritance |
| Network | Server snapshots and any progress notifications reflect canonical state, frontend never authoritatively calculates rewards |
| Regression | Asset verification, typecheck, build, server tests, multiplayer browser smoke tests still pass |

## 5. Simulation and QA plan, not yet a PASS claim

Required before numeric approval:

- Sweep `Level 1..1,000` for monotonic `expToNext`, allowable realm/level boundary states, point totals, and realm factor monotonicity.
- Use seeded 1,000,000-roll Monte Carlo: test rarity distribution and collision-rejection behavior, three-slot distinctness and one-signature maximum.
- Build **representative characters** with hypothetical mixed Phàm/Hoàng/Tiên/Thần quality loadouts. Measure effective derived stats and test future TD-02 combat against same-level monsters, higher-realm mobs, boss and AOE farming; calibrate map difficulty against a cohesive Tiên-quality character, not an average-rarity number.
- Run 2-client concurrency tests: simultaneous XP rewards, two breakthrough clicks, reroll/confirm race, signature-grant conflict and duplicate quest completion.
- Run DB backup/restore + migration dry-run; no real-user data altered during technical design.

Numeric proof can validate arithmetic but cannot alone establish satisfying gameplay. Human visual and playtest approval remain distinct from all these checks.

## 6. Phase boundary

`TD-01 DESIGN REVIEW` is the **only deliverable of this package**. No TypeScript/SQL gameplay implementation, repository changes or Git push are authorized by this document. After owner approval, Argon should first integrate these Markdown specs as a **docs-only commit** and produce a scoped implementation plan; only code after separate approval.
