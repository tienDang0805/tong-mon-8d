# TD-03 — Reference Simulation and Scope of Evidence

> v0.5 | 2026-10-16 | Numeric scheduler parameters `DESIGN_BASELINE`. This is a lightweight Python reference model, **not** an executed Colyseus test, combat performance benchmark or production game proof.

## 1. Reproducible command

From the extracted TD-03 package root:

```bash
python tools/td03_reference_checks.py
```

The script uses a small **isolated reference actor/event model**, not repository server modules. It checks presence/mode ordering, quest acceptance/turn-in, duplicate monster-life event handling, Level-10 XP cap (simplified), simple blocked 4-neighbor grid path, and planning-evaluation count. It is meant to catch specification inconsistencies and is **not proof that the actual GitHub game implements these rules**.

## 2. Result: deterministic checks in this package

| Check | Status | Interpretation |
|---|---|---|
| Same monster life credited once | PASS | The reference event set refuses a duplicate kill ID |
| Manual quest turn-in and event order | PASS | Kill before acceptance ignored; objective-ready not submitted automatically |
| Disconnect/reconnect | PASS | Old epoch rejected, reconnect is IDLE, no catch-up, explicit restart required |
| Character Lv10 cap | PASS | Toy event does not add Character EXP when Lv10 is capped |
| Farm vs Navigation | PASS | Starting navigation invalidates farm behavior |
| 4-neighbor map collision | PASS | Deterministic A* avoids blocked tiles and returns no path for full wall |
| 20 actor scheduler estimate | PASS | Only connected, auto-farming actors receive planning evaluations |

## 3. Session-presence scenario and arithmetic

**Simulation assumptions (not production policy):** 20 actors, a maximum of 5 planner evaluations per second per active character, 90 seconds total, 10 characters disconnected during seconds 30–60, and those 10 explicitly restart farming after reconnect at second 60.

| Time | Connected active actors | Planner evaluations |
|---|---:|---:|
| 0–30 seconds | 20 | `20 × 30 × 5 = 3,000` |
| 30–60 seconds | 10 | `10 × 30 × 5 = 1,500` |
| 60–90 seconds | 20 | `20 × 30 × 5 = 3,000` |
| **Total** | — | **7,500** |

Without disconnects, it would be `20×90×5=9,000`. The difference of 1,500 demonstrates that the **planner** did not run for disconnected actors. It does not tell us the number of legal attacks/hits/kills — TD-02 skill cooldowns and target availability determine that. It is **not** a promise of server CPU throughput, memory usage or packet rate.

The test models 5Hz as a bounded candidate and is not permission to issue 5 attacks/second. For a skill with cooldown 2,200ms, its allowed rate is controlled by that cooldown, cast time, action ordering and MP, not by planner ticks. For Dao progression, a meaningful valid attack may receive **at most one per-path credit per 2,000ms** under TD-02's candidate rule, even when an AoE hit damages multiple enemies.

## 4. Cross-check with TD-01 and TD-02

| Mechanics | Reuse without redefining |
|---|---|
| Character EXP | TD-01 Level bands; zero gain at current non-Saint realm Level cap, discarded overflow; bigint/decimal storage |
| Tu Vi / meditation | TD-01 independent track, 8h offline cap, no AFK Tu Vi farming by default unless content explicitly grants Tu Vi |
| Dao combat EXP | TD-02 path-specific relevant action XP, technique comfort stages, trivial monster reduction, 2s throttle, mandatory 3→4/6→7/9→10 trials |
| Damage | TD-02 realm pressure, authored technique coefficient/cast/range/MP/CD; do not add generic rarity multiplier |
| Character power | TD-01 derived stats from six source attributes, destiny, gear, techniques and cultivation; no persisted accumulating final ATK |
| Quest credit | One committed kill event → explicit eligible objective counter; manual acceptance/turn-in; never automatic Legendary apprenticeship |

## 5. Evidence not yet established

- **NOT VERIFIED:** server-side real Colyseus disconnect timing, multi-tab control epoch under network partitions, distributed fencing, real room CPU and persistence durability, authority over movement/path/portals, actual quest UI, kill/loot/EXP/hour, AI art approval, co-op reward accounting.
- **NOT BALANCED:** how many kills/hour are possible with four monster spawns in Thanh Trúc Lâm, EXP/hour against TD-01 curve (Lv1..350+), Dao XP/hour vs stages 1..10, potion costs in online AFK, time required for six-chapter True Disciple. These require TD-04 authored content and integration/actual playtests.
- **NOT AUTHORIZED:** deployment, code, DB schema changes, auto gameplay implementation, art generation, Git commit/push.

## 6. Future test harness criteria

Once Argon has received an owner-approved frozen specification and separate implementation approval, use real two-browser Playwright + Colyseus tests: start farm, observe authoritative monster HP and inventory, forcibly close controlling browser, wait 30+ seconds beyond connection expiry, verify no further kill/reward ledger rows, reconnect idle and no historical catch-up; check concurrent tabs/packets, quest count ordering and UI. Verify on both the PGlite local test adapter and external PostgreSQL where configured. Keep production-like anonymous logs as evidence; never disclose passwords or user save data in screenshots.
