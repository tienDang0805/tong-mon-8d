# SYS-CHARACTER — Character & Attribute Model

> TD-01 • Technical design proposal v0.3 • 2026-10-16 • **REVIEW_REQUIRED** (not approved implementation)  
> Baseline: `master@d4e6e17` • Authoritative decisions: `docs/DECISIONS.md` (`GD-010..018`, `GD-020..023`, `GD-028`, `GD-030..034`).  
> Dependencies: `docs/systems/CULTIVATION.md`, `docs/systems/DESTINY.md`, `docs/technical/TD01_MIGRATION_TESTS.md`.

## 1. Problem in existing code

- `packages/shared/src/index.ts` uses one `CharacterSaveState` mixing persistence, live HP/MP and client/game state; it has realm/stage/Tu Vi but **no Character Level, EXP, six base attributes, destiny slots or creation confirmation state**.
- `apps/server/src/db.ts` stores `attack`, `defense`, `max_hp`, `max_mp` directly in `characters`. In `apps/server/src/worldEngine.ts`, `handleBreakthrough` mutates all those stored final values; `getEffectiveStats` mutates expired buffs when reading them.
- The current `discipline: "kiem_tu" | "phap_tu" | "the_tu"` means an initial playstyle, not one of the six independent Dao mastery paths. Do not interpret it as a locked class.

**Design requirement:** persist canonical **sources** of power; derive stats with a pure deterministic function. Current HP/MP, EXP, Tu Vi and quest/destiny states remain persistable dynamic values. Replace legacy fields only after a data migration, not by wiping saves.

## 2. Character aggregate boundaries

```ts
export type BaseAttributeKey =
  | "the_phach" | "luc_dao" | "linh_tinh"
  | "than_phap" | "than_thuc" | "ngo_tinh";

export type BaseAttributes = Record<BaseAttributeKey, number>;

export interface CharacterIdentity {
  characterId: string;
  accountId: string;
  name: string;
  appearanceId: string;
  createdAtMs: number;
  creationState: "draft" | "confirmed";
  revision: number;
}

export interface CharacterLevelProgress {
  level: number;
  expTowardNext: string;
  freeAttributePoints: number;
  allocated: BaseAttributes;
  earnedPermanent: BaseAttributes;
}

export interface CharacterCombatResources {
  currentHp: number;
  currentMp: number;
}

export interface DerivedStats {
  maxHp: number;
  maxMp: number;
  physicalAttack: number;
  spiritualAttack: number;
  physicalDefense: number;
  spiritualDefense: number;
  moveSpeedRating: number;
  cultivationRateRating: number;
}

export interface CharacterAggregate {
  identity: CharacterIdentity;
  level: CharacterLevelProgress;
  cultivation: CultivationProgress;
  destiny: DestinyCollection;
  resources: CharacterCombatResources;
  equipmentIds: string[];
  equippedTechniqueIds: string[];
  equippedMainCultivationMethodId: string | null;
  activeBuffs: ActiveBuffState[];
  worldState: CharacterWorldState;
}
```

`CultivationProgress`, `DestinyCollection`, `ActiveBuffState` and `CharacterWorldState` are imported interfaces from their respective future modules. **Do not eagerly build independent services**: the above is a logical aggregate design, not a requirement for microservices or separate network packets for every field.

Each character has six **independent** base stats: **Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính**. `Linh Căn` / `Cơ Duyên` are not alternate base stats. No fixed class restriction; six Dao mastery XP paths are defined in TD-02.

## 3. Origin and points

**Designer baseline:** all six origin attributes = `10` at Level 1. They are equal for everyone; the three Tiên Thiên Destiny rolls distinguish starting builds. The origin value is **not an already-approved numeric rule**, and can be tuned before implementation.

- Every **actual increase of Character Level by 1** grants **one unspent attribute point**. At Level 1, `freeAttributePoints = 0`; at Level `L`, the **total earned from leveling** is exactly `L - 1`.
- The server receives intent `allocateAttribute(key, 1)` and validates `key` belongs to the six keys, point availability, and revision. A batch allocation can be a future convenience, still atomic.
- `sum(allocated) + freeAttributePoints = level - 1` is invariant, **excluding** explicitly named non-level bonus grants. Any permanent bonus stat is stored in `earnedPermanent`, never masquerades as a point from Level.
- No direct free-point allocation into crit, cooldown, HP, ATK or DEF.
- For an already-created or migrated character, origin stats are read from a versioned `StatRuleset`, not recalculated from a player's name or selected old discipline.

## 4. Deterministic stat computation

Define a stat pipeline with **explicit source types**, rather than implicit `attack += X` inside quest/realm code:

1. Load current ruleset version and canonical character aggregate.
2. Load the active **three immutable Tiên Thiên** + up to **three equipped Hậu Thiên**, active cultivation method, equipped Võ Kỹ passives, valid gear and non-expired buffs.
3. Validate eligibility/ownership of each source and normalize/de-duplicate all modifiers (`modifierId`, `sourceId`, `stackGroup`, `statKey`, `scope`, `value`).
4. Calculate **effective base attributes** with realm-stage scale.
5. Calculate derived HP/MP/physical-spiritual attack/defense and utility ratings.
6. Apply **derived-stat** flats and bounded percent modifiers exactly once; clamp floors/caps, round once per stage using `floor` for non-negative values.
7. Return a fresh immutable `StatSnapshot`; never persist accumulated `DerivedStats` as the source of truth. Update `currentHp/currentMp` separately according to resource policy.

### 4.1 Realm factor — candidate, NOT canon

Let `r` be realm index: Phàm Nhân `0`, Luyện Khí `1`, ..., Thánh Cảnh `17`. Let `s` be stage (1-based), `n` stage count from `REALM_PROGRESSION`. Candidate:

`RealmFactor(r,s,n) = 1.50^r * [1 + 0.30 * (s-1)/max(1,n-1)]`.

If `n=1`, the minor-stage term is **1.0**. For a fixed realm index, the factor grows with stage; crossing from the last stage of realm `r` to first stage of `r+1` increases factor (1.5 > 1.3), so stats never drop at major breakthrough. At Thánh Cảnh the factor remains finite and can be computed without overflow for the 17-realm catalog. **This is an isolated simulation candidate**, not a claim that the existing Tu Vi curve or monster stats are compatible.

### 4.2 Attribute sources and order — candidate

`preRealm = OriginBase(10) + Allocated + EarnedPermanent + ValidPreRealmTraitFlat`

`postRealm = floor(preRealm * RealmFactor) + EquipmentFlat + TechniqueFlat + ValidPostRealmTraitFlat`

`EffectiveAttribute = floor(postRealm * [1 + boundedAttributePercent])`

Baseline per-attribute `boundedAttributePercent = clamp(sum(valid modifiers in additive bucket), -0.50, +0.60)`; **candidate cap** subject to sim. All flat and percent sources require a typed `scope` (`pre_realm_attribute`, `post_realm_attribute`, `derived_stat`, `combat_outcome`, `cultivation_rate`), rather than applying every modifier globally. Any signature's unique mechanic must have its own typed effect, not just an enormous universal multiplier.

### 4.3 Derived stats — candidate starting coefficients

For effective attributes `T` = Thể Phách, `L` = Lực Đạo, `I` = Linh Tính, `A` = Thân Pháp, `S` = Thần Thức, `W` = Ngộ Tính:

| Stat | Base candidate formula before derived modifiers |
|---|---|
| Max HP | `floor(100 + 12*T)` |
| Max MP | `floor(40 + 10*I)` |
| Physical attack | `floor(5 + 2*L)` |
| Spiritual attack | `floor(5 + 2*I)` |
| Physical defense | `floor(2 + 0.80*T + 0.25*L)` |
| Spiritual defense | `floor(2 + 0.75*S + 0.30*I)` |
| Move speed rating | `floor(100 + 0.50*A)` — **NOT** world units/s |
| Cultivation rating | `floor(100 + 0.50*W)` — **NOT** an uncapped percent multiplier |

Do **not** infer crit chance, dodge probability, hit rate, skill damage coefficient, physical/spiritual resistances or monster suppression from these placeholders. TD-02 owns those formulas. Ngộ Tính must be useful for learning/cultivation without trivially outperforming combat stats through stacking.

### 4.4 Derived stat modifier caps — candidate

Derived-stat percent modifiers with the same `statKey` add within a bounded bucket (initial design cap `-50%..+100%`). Distinguish permanent character effects from temporary food/pill/equipment effects by source and approved stack group. Clamp maximum movement/skill speeds by TD-02 rules; no infinite attacks per second. Server-side validation of expiration is done without modifying stats as a side effect of rendering them.

**HP/MP resource policy (candidate):** on gear/trait change, keep current absolute HP/MP but clamp to the new max; **do not heal via repeated equip/unequip**. On successful major realm breakthrough, heal both resources to their recalculated maxima once. On a natural Level up or minor-stage breakthrough, clamp only, no automatic full heal until approved. On relog, restore persisted dynamic resources and clamp.

## 5. Worked calculation without equipment or buffs

Starting Level 1, Phàm Nhân r=0, stage1, six origin stats 10 each: `T=L=I=A=S=W=10`, `HP=220`, `MP=140`, `PhysicalATK=25`, `SpiritualATK=25`, `PhysicalDEF=12`, `SpiritualDEF=12`.

If the same unallocated base values are hypothetically present on entering Luyện Khí stage 1 (`r=1`, factor `1.5`): each effective stat = 15; HP=280, MP=190, PhysicalATK=35, PhysicalDEF=17. **Real characters will have earned points from leveling, so this is only an isolated realm-factor demonstration.**

When testing an actual Level 11 character, insert exactly 10 points allocated since Level 1 and calculate with its real build. Never present the hypothetical example as a balanced Level-11 build.

## 6. Save, networking and security requirements

- Persist stable `characterId`, `accountId`, identity, realm, stage, EXP, Level, allocated/free points, Tu Vi, destiny ownership/equip state, current HP/MP, inventory, quest flags; **derive** stats when requested. Cache snapshots only as disposable read models keyed by `characterRevision`, `rulesetVersion`, and buff time boundary.
- Use **server-authenticated** ownership of character and account. Current `loadOrCreateCharacter(accountId, nickname, discipline)` does not establish a strong authentication protocol on its own; do not treat arbitrary client strings as trusted identity.
- Reject negative/NaN/non-integer stat grants and unsupported keys; never accept client-supplied `maxHp`, `physicalAttack`, `level`, `realmFactor` or rolled destiny IDs as authoritative.
- Actions that spend points, grant EXP, perform breakthrough or activate Hậu Thiên require idempotency key scoped to `(characterId, actionType, requestId)` and atomic persistence.
- Version the ruleset and any saved state schema; keep calculated snapshots reproducible from sources. Every gameplay migration must have backup and rollback.

## 7. Acceptance tests for TD-01

`CHR-01` Level1 base origin and zero free points.  
`CHR-02` `+1 Level` = `+1 free point`, never two under retry.  
`CHR-03` Invalid attribute key or over-allocation rejected.  
`CHR-04` Sum of allocated + free points equals earned points after repeated saves/restarts.  
`CHR-05` Removing equipment returns derived stats to pre-equipment result, no permanent drift.  
`CHR-06` Trait replacement deactivates passive bonuses immediately; stored traits remain owned.  
`CHR-07` Major breakthrough factor monotonic (no stat drop at stage rollover).  
`CHR-08` Buff expiry and reconnect do not duplicate or permanently embed effects.  
`CHR-09` Current HP cannot exceed recalculated max; no gear-swap healing exploit.  
`CHR-10` Client-forged stat/XP and cross-account mutation rejected.

## 8. Open technical decisions

- Initial six origin values (`10`) and coefficients/caps above require balance simulations with monsters and technique-quality distributions.
- Derived crit/evasion/accuracy/cooldown formulas belong to TD-02.
- Final save-table split/JSONB plan and conversion of existing `attack`, `defense`, `discipline` fields require migration approval; see `TD01_MIGRATION_TESTS.md`.
