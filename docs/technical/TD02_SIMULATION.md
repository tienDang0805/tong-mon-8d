# TD-02 — Deterministic Combat Sanity Simulation

> Version: TD-02 DRAFT v0.4 | **Formula-model evidence, not gameplay acceptance** | Reproducible script: `tools/td02_simulate.py`.

## 1. Purpose and design provenance

The user's balance intent is: same-map monsters have fixed power, a Tiên-quality cohesive build can fight a representative difficult monster with effort, Thần builds have more comfortable farming, and ordinary Luyện Khí cannot farm Trúc Cơ enemies. Phàm builds must still have easier starter paths and cannot be excluded from the game.

The four synthetic build profiles below are **already-computed derived stats** for same-level Luyện Khí examples. They are not `StatsFromRarity(Phàm|Hoàng|Tiên|Thần)` and should NEVER become global-tier multipliers. This simulation intentionally excludes the real item catalog, Level EXP, MP consumption, buffs, movement and PvP.

## 2. Simulation rules

- `K = 40 × 1.5 ^ targetRealmIndex`.
- `damage = floor(ATK × SkillCoefficient × PathBonus × K/(K+TargetDEF) × OutgoingPressure)`; `PathBonus=1.0` for all cases (Stage1).
- When attacking an enemy **one realm higher**, `OutgoingPressure=0.45`.
- When that higher-realm enemy strikes the player, its damage is multiplied by `1.65` once.
- A player hits once/second beginning at `t=0`; monster attacks once every 2.5 seconds beginning at `t=2.5`.
- No cooldown skills rotation, crit, dodge, MP exhaustion, consumables, shields, AoE, regen or party.
- At exact coincident timestamps player skill hit resolves before monster strike.

## 3. Synthetic builds

| Archetype | HP | Attack | Defense | Single-target coefficient |
|---|---:|---:|---:|---:|
| Phàm-oriented | 660 | 100 | 48 | 1.00 |
| Hoàng-oriented | 850 | 130 | 62 | 1.15 |
| Tiên-oriented | 1000 | 165 | 80 | 1.40 |
| Thần-oriented | 1250 | 220 | 100 | 1.70 |

## 4. Same realm — difficult Luyện Khí challenge

Enemy: `realmIndex=1`, HP `2400`, ATK `160`, DEF `80`.

| Archetype | Damage/hit outgoing | Damage/hit incoming | Outcome | Fight time | End result |
|---|---:|---:|---|---:|---|
| Phàm | 42 | 88 | LOSS | 20.0s | enemy has 63.2% HP |
| Hoàng | 64 | 78 | LOSS | 27.5s | enemy has 25.3% HP |
| Tiên | 98 | 68 | WIN | 25s | player has 38.8% HP |
| Thần | 160 | 60 | WIN | 15s | player has 76.0% HP |

This aligns with the intended **representative challenge**. It is *not* an instruction that all Luyện Khí monsters have HP 2400: Tân Thủ Thôn/outer Thanh Trúc Lâm must allow Phàm builds to grow safely. Ordinary enemies should be calibrated to appropriate lower threat.

## 5. Monster one cultivation realm higher

Enemy: Trúc Cơ `realmIndex=2`, HP `4200`, ATK `230`, DEF `125`.

| Archetype | Damage/hit outgoing | Damage/hit incoming | Outcome | Fight time | Enemy HP remaining on player death |
|---|---:|---:|---|---:|---:|
| Phàm | 18 | 209 | LOSS | 10.0s | 95.3% |
| Hoàng | 28 | 186 | LOSS | 12.5s | 91.3% |
| Tiên | 43 | 161 | LOSS | 17.5s | 81.6% |
| Thần | 70 | 141 | LOSS | 22.5s | 61.7% |

The **strongest sample still loses solo**, so casual higher-realm AFK farm is unattractive. Extreme consumables, authored counters, rare Thần mechanics or party teamwork may allow exceptional isolated victories later. Don't mislabel the example as an inviolable realm hard lock.

## 6. Required next-round simulations before real tuning

1. **Starter monster**: Phàm Lv1–10 can farm without Tiên Thiên reroll or legendary signature, receiving meaningful EXP.
2. **Multiple levels in one realm**: Luyện Khí Lv11, Lv20, Lv30 vs staged-zone enemies.
3. **Six martial builds**: Kiếm single-target, Đao AOE, Chỉ precision, Chưởng control, Thể sustain and Pháp AOE, with resource/cooldown effects.
4. **Three Dao trial gates**: equalized combat verifies learning/strategy rather than major-realm gate.
5. **MP/potions**: measuring cost per hour; strong builds may choose harder zone for efficient reward.
6. **Different gear and destiny combinations**: modifiers bounded, negative feedback loops and passives not multiplicatively exploding.
7. **17 realms + Lv351+**: no overflow, same-realm mitigation remains interpretable and realm transition makes sense.
8. **Shared monsters/party**: fair server credit, lock rewards once, avoid damaging two players with a single phantom event.

**Status**: arithmetic reproducible in Python, runtime TypeScript server has **not** implemented this specification. No owner approval of numeric damage/pressure or final monster stats has been requested yet.
