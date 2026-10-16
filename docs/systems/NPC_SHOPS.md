# TD-04 Owner-Approved Addendum — NPC Shops and Tụ Bảo Các

> Canonical replacement/clarification of `TD04_SHOP_MARKET_PROPOSAL.md` for **TD-04 approved scope**, 2026-10-16. **APPROVED DIRECTION**: NPC BUY/SELL only; specialized vendors and physical Tụ Bảo Các using one ShopService. Draft contracts and stock/prices remain DESIGN_BASELINE pending implementation design validation. This document must be packaged with TD-04 at Design Freeze, not duplicated as a separate gameplay engine.

## 1. Gameplay scope — no player trading

- **Tụ Bảo Các**: physically present building or coherent market complex in each authored major town; player walks in or approaches a staffed counter to browse the currently accessible local NPC catalog.
- **Specialist NPCs**: Đan Dược Các, Tàng Kinh Các (separate Công Pháp/Võ Kỹ filters), Binh Khí Các, Linh Trù/Tạp Hóa and region-appropriate specialists. A specialist opens an approved restricted catalog subset, not a new transaction service.
- **Lão Trù Trương** existing food shop preserved. His `merchant_truong` ID stays stable; general town hub may aggregate applicable visible offers if approved.
- Search/filter: type, rarity for **its proper domain** (four-tier destiny never applies to items, six-tier technique quality applies only to Công Pháp/Võ Kỹ), price, required Level/realm/stats/Dao, usable/affordable, name, available stock. Item icon and illustrative inspect preview mandatory in TD-05.
- Trading is ALWAYS manual: click/interact and confirm BUY or SELL. Auto navigation arrives and stops. Auto Farm cannot trade or spend.
- **Out of scope:** player-to-player transfers, listings, consignment, auction/bids, escrow and real-money trading. Do not create database tables, routes or UI for a player market. Any future P2P proposal requires new owner decision, economy/abuse design and a separate phase.

## 2. One authorized ShopService and stable catalogs

A per-town `ShopDef` has `id`, `zoneId`, `locationId`, `offerIds`, `accessConditionId`, `mode:town_hub|npc_stall`; `VendorDef` has `id`, `npcId`, `shopId`, `specialtyCategories[]`, interaction location; `ShopOfferDef` has `id`, `shopId`, `vendorId?`, `itemId`, `currencyId=linh_thach`, safe integer buy/sell price, version, stock policy, max qty, prerequisites and `DRAFT|RELEASED|DISABLED` status.

**ItemDefinition does not imply sale availability** merely because `buyPriceLinhThach != null`. Sale eligibility is an explicit `RELEASED` offer at a valid location. The prototype's hard-coded `merchant_truong` `handleShopBuy()` is a migration target, not a reason to replace canonical IDs or silently add markets.

An NPC sale credits Linh Thạch and removes eligible owned quantity in one server transaction; a purchase deducts Linh Thạch and adds items in one transaction. Only the server sets currency, authoritative price, inventory, stock and receipts; all retries are idempotent. Price/version changes require user reconfirmation, never silent charge. SQL concurrency must make two-tab duplicate purchases impossible.

Rare Thần-quality Công Pháp/Võ Kỹ are not normal vendor stock. Legendary NPC signature mệnh cách cannot be sold as ordinary merchant items. RMT Đế uses fictional Linh Thạch only and is NOT a cash shop; Vaal Đế's fictional risk mechanics are separate from common merchants. Buying a manual grants an owned item; learning/using its technique is a separate validated action under TD-02, not instant forced learn.

## 3. TD-05 visual obligations per shop

`ShopDef` needs an external entrance/counter world binding plus **a source-generated facade, shop sign, shelf/merchandise decoration, interaction marker and player-to-counter navigation**. `VendorDef` needs the proper actor and portrait. `ShopOfferDef` points to a valid approved item icon and preview, which may also have equipment/world/drop roles. `SELL` has readable price/item feedback and is restricted to eligible owned items. **A universal shop modal without physical shop scenery does not satisfy this approved feature.**

## 4. Selected tests

`SHOP-01` merchant catalog cannot sell arbitrary items by global price; `SHOP-02` no remote buy/sell; `SHOP-03` correct restricted specialist catalog; `SHOP-04` currency/items atomic on both actions; `SHOP-05` concurrent two-tab transaction safe; `SHOP-06` signature never in ordinary offer; `SHOP-07` Thần manuals not normal stock; `SHOP-08` changing town changes authored offers; `SHOP-09` no auto buying/selling; `SHOP-10` visible facade/vendor/icon and real client screenshot required; `SHOP-11` no P2P flow, endpoints or player listing in approved scope; `SHOP-12` no floating geometric/placeholder Tụ Bảo Các considered production ready.

## 5. Out-of-scope numerical decisions

Prices, taxes, regional stock cadence, finite restocks, vendor sell-back price, bulk limits, equipment quality rules, whether the first town uses one hall or multiple stalls: **not locked by this addendum**. Prototype buy prices are historical values; benchmark against TD-03 farm income and TD-04 currency sinks during implementation. No other TD's formulas may be overwritten by this spec.
