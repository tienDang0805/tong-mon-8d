---
name: cultivation-balance
description: Quantitatively design and review Tu Vi progression, realm requirements, active vs offline cultivation, food buffs, loot, drops, prices and legendary inheritances for Tông Môn 8D. Use for mechanics, rewards and economy changes.
---

# Cultivation & Game Balance

## Playstyle constraints

Support 5-min daily check-ins, 15–30-min solo sessions and 20–45-min group boss sessions. Offline meditation accumulates at most 8h per claim cycle with server time. Cooking is optional for Phì Đế disciples: bought and cooked qualifying dishes both work. No pay-to-win. High realm must unlock content, not only numbers.

## Simulation method

1. Keep all tuning constants in versioned game-data JSON/TypeScript configs.
2. Model 15m/day, 60m/day, 3h/day, offline-focused, cooking-focused, merchant and four-person party players.
3. Estimate Tu Vi to next stage, resource acquisition, expected boss drops, inventory inflation, trade profitability and skill effectiveness over weeks.
4. Check economy faucets/sinks; no unlimited resource loops or duplicate claim paths.
5. For Vaal risks show cost, numerical probability and alternatives. No irreversible deletion of character progress. For Phì Đế food restrict stacking one meal/one beverage/one medicine and cap effects. For RMT use only fictional earnable gold.
6. Report numeric evidence and proposals; never say balance is proven without playtests.

## First playable targets

Initial breakthrough by 15–30 min, three food items, two recipes, one vendor transaction, one enemy, one authentic quest reward, clear cost/value. High-tier 17 realms exist in data now but need not be playable immediately.
