# TD-FREEZE-CONTRACT-MAP — One accountable owner per system

| Canonical concern | Specification owner | Consumed by / contract boundary | Failure mode forbidden |
|---|---|---|---|
| Base attributes, level, EXP cap, realm, Tu Vi, immutable source factors | TD-01 `systems/CHARACTER.md`, `systems/CULTIVATION.md` | TD-02 damage snapshots, TD-03 legal kill XP, TD-05 HUD | Ad hoc permanent final ATK updates, EXP cross-credit to Tu Vi, bypass quest breakthrough |
| Three Tiên Thiên/three active Hậu Thiên and Legendary signature exclusivity | TD-01 `systems/DESTINY.md` | TD-03 special quest eligibility, TD-04 conditions, TD-05 destiny icon | Second protected signature via loot/quest/shop/reconnect |
| Six paths × ten stages, Dao XP/trials | TD-02 `systems/DAO_MASTERY.md` | TD-03 validated cast events, TD-05 visual trials | Automating trials, realm-only hard cap on Dao, weak-mob spam XP exploit |
| Công pháp / Võ kỹ registration, ownership and equipped slots | TD-02 `systems/TECHNIQUES.md` | TD-04 shop manuals, TD-05 cast visuals and tome art | Bought manual auto-learning bypasses requirements; Thánh seventh technique tier |
| Combat, monster realm oppression, death events | TD-02 `systems/COMBAT.md` | TD-03 scheduler, TD-04 reward/loot definitions, TD-05 hit VFX | Second damage path in Auto Farm, client trusts damage, duplicate kill |
| Connected auto combat activity | TD-03 `systems/AUTO_FARM.md` | TD-02 battle API, TD-04 reward authorization, TD-05 animation | Disconnect farm progress, tab takeover duplicate rewards |
| Auto-navigation and portal use | TD-03 `systems/NAVIGATION.md` | TD-04 world graph and Tiled metadata, TD-05 route visuals | Auto talk, NPC BUY/SELL or secret route bypass |
| Quest lifecycle/manual choices/reward credit | TD-03 `systems/QUEST_ENGINE.md` | TD-04 authored content, TD-05 quest objects/UI | Auto Quest or automatic turn-in on encounter kill |
| Fixed zones, content registries, mobs/items and quest authored facts | TD-04 `systems/WORLD_CONTENT.md`, `ITEMS_ECONOMY.md`, `QUEST_CONTENT.md`, `CONTENT_REGISTRY.md` | TD-01/02 formulas & TD-03 engines; TD-05 visuals | Duplicate item reward, unapproved level scaling, unreachable scripted scene |
| Food Catalog, NPC affinity, private six-chapter routes | TD-04 `systems/FOOD_CATALOG.md`, `NPC_AFFINITY.md` | TD-01 trait ownership + TD-03 quest state; TD-05 props | Entire Food Catalog gate assumed, ordinary dish instantly awards Chân Truyền |
| NPC-only commerce and vendor catalogs | **TD-04** `systems/NPC_SHOPS.md` (originally authored in TD-05 bundle from approved addendum) | TD-03 manual interaction; TD-05 physical store, item icon, vendor sprite | P2P trade, remote purchase, purchasing global item price not listed as offer |
| Source-generated art, world visuals, physical props and scene assembly | TD-05 `systems/VISUAL_CONTENT_CONTRACT.md` + `pipelines/*` | Every released player-visible TD-01..04 feature | Text-only popup, unreviewed legacy art marked final, marketing mock instead of game capture |

## Architecture to implement without duplicate systems

`Client Intent → Server controller/presence (TD-03) → Domain action (TD-01/TD-02/TD-04) → Single atomic event/reward ledger (TD-01/TD-03/TD-04) → Server validated snapshots → Phaser/Tiled visible object (TD-05)`.

`ShopOfferDef` chooses allowed item, price and vendor in TD-04; purchasing a manual creates an **owned item**; learning that manual uses a **separate TD-02 validation action**. A shop panel can filter category but cannot invent stock, client prices, buffs or mastery eligibility. Both a whole-hub listing and specialist NPC views must call the same `ShopService`.

`ContentDef` is DRAFT until mechanics, genuine art/provenance, in-game visibility and human approval all pass. A backend price rule does not require its own sprite; a shop/price event still has clear feedback attached to a rendered physical shop.
