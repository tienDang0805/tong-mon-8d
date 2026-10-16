# TD-01 — Formula Simulation & Sanity Checks

> Generated from the **TD-01 proposed numeric rules**, not from the running game's TypeScript implementation. **Arithmetic checks PASS ≠ gameplay balance PASS**. Seeded simulated roll pool uses synthetic trait IDs since the content catalog is not yet approved.

## 1. Character EXP: sample cost per next level

| Current Level | EXP to reach next level |
|---:|---:|
| 1 | 138 |
| 5 | 450 |
| 9 | 1,018 |
| 10 | 1,200 |
| 11 | 1,398 |
| 20 | 3,900 |
| 30 | 8,200 |
| 31 | 8,718 |
| 100 | 83,100 |
| 330 | 881,200 |
| 350 | 990,600 |
| 351 | 996,240 |
| 400 | 1,297,100 |
| 500 | 2,060,100 |
| 1,000 | 8,875,100 |

EXP from Lv1→Lv10 with no lost excess: **4,530**. This is a formula-only estimate, not an assertion about EXP/hour or playtime. EXP monotonic for `L=1..10,000`: **True**.

## 2. Realm-stage factor monotonicity

Stage factor strictly increases within every multi-stage realm: **True**. Rollover from last stage of realm `r` to stage1 of `r+1` never lowers the factor: **True**. Validated for realm indices 0..17 with `[1,9,4×16]` stages. This excludes all gear/trait/food effects.

## 3. Sample derived stats (no gear/buff/trait)

| Character state | Origin + points | Realm factor | HP | MP | Physical ATK | Physical DEF |
|---|---|---:|---:|---:|---:|---:|
| Lv1 Phàm Nhân | T=10, L=10, I=10 | 1.0000 | 220 | 140 | 25 | 12 |
| Lv11 Luyện Khí 1 | T=14, L=14, I=12 | 1.5000 | 352 | 220 | 47 | 24 |
| Lv30 Luyện Khí 9 | T=22, L=22, I=15 | 1.9500 | 604 | 330 | 89 | 46 |
| Lv30 Trúc Cơ 1 (vừa đột phá) | T=22, L=22, I=15 | 2.2500 | 688 | 370 | 103 | 53 |

Lv11 example allocates **10 points total** (+4 Thể Phách, +4 Lực Đạo, +2 Linh Tính). Lv30 example allocates **29 points** (+12 Thể Phách, +12 Lực Đạo, +5 Linh Tính). These are hypothetical stat-distribution choices, not a recommended build. Trúc Cơ at Lv30 is a **valid post-breakthrough boundary state**; the next earned EXP level is Lv31.

## 4. One million valid three-trait rolls — synthetic catalog

RNG seed: `20261016`. Per non-Legendary tier the simulator used synthetic pool sizes (Phàm 25, Hoàng 20, Tiên 20, generic Thần 18, Legendary signature 10); these counts are testing scaffolding, **not** content promises. All three candidates are redrawn if there is a duplicate trait ID or more than one Legendary signature.

- Valid batches: **1,000,000**; rejected candidate batches (extra redraws): **51,428**.
- Chance of ≥1 Legendary signature after validation: **8.822%**; any named signature `sig0`: **0.882%**; at least one Thần: **14.539%**.
- Observed distribution of slot rarity after **conditional validation**:

| Tier | Observed slot fraction |
|---|---:|
| Phàm | 49.657% |
| Hoàng | 30.068% |
| Tiên | 15.264% |
| Thần | 5.011% |

Because invalid triples are rejected, real *conditional* probabilities differ slightly from per-slot raw weights. Both are documented, so later UI must not claim these are mathematically identical. No manual slot locks and no paid rerolls were modeled.

## 5. Meaning of these results

- **Passed:** integer EXP polynomial positivity/monotonicity over tested range; factor monotonicity at all currently defined stages; representative stat arithmetic; valid roll distribution sanity.
- **Not tested:** live TypeScript implementation, PostgreSQL migrations, server idempotency, monster TTK, damage mitigation, Dao mastery speed, offline rewards, playtest feel, full trait catalog or real game EXP/hour.
- **Not approved by player:** `1.50^realmIndex` realm growth, `10` origin attribute points, HP/MP/ATK/DEF coefficients, percent caps, EXP polynomial, no XP bank at level cap.
