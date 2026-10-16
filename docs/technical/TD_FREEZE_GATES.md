# TD-FREEZE-GATES — Unresolved implementation, balance, content and creative gates

**Important:** Docs freeze is not a gameplay/art release. Everything here is blocking only the affected feature's implementation or release, not this documentation import.

## Needs numbers or explicit content decisions

1. TD-01 EXP/hour and monster quest rewards vs quadratic EXP curve; huge-level arithmetic and storage (BigInt vs decimal); migration from existing save data, with old database backups retained. No silent reset.
2. TD-01 realm/stage-derived stats versus TD-02 damage and stage suppression: ensure a *single source* for physical/spiritual attack/defense and avoid double multiplying realm factor; test at Lv10/11, Lv30, Lv330, Lv350/351.
3. TD-02 critical hit/defense/penetration, build tier monster TTK, potion economy and party outcomes; illustrative simulated monster HP are not live content.
4. TD-03 actual Colyseus timing, one-controller/two tabs, no offline rewards, reconnect, pathfinding/portal approvals, visit event semantics and meditation online/offline exclusion.
5. TD-04 NPC affection ranges, Food Catalog special trigger threshold for Phì Đế (`UNRESOLVED`), possible 18 example foods **not** a published universal list, each rare reward author approval.
6. TD-04 equipment quality hierarchy, price/stock/restock cadence, sell-back loops and currency inflation under online AFK farming; only authored NPC shop offers may be sold. Any P2P trade requires **separate future owner approval**; not in accepted scope.
7. TD-04 party combat credit and item distribution; prevent duplicate direct+ground reward and unauthorized reserved pickup.
8. TD-05 human-selected pixel-art direction; Phase 0 Candidate A and 80×96 proof sprites remain `TECHNICALLY_VERIFIED` only and visually unapproved. Test real generator availability; don't assume a paid video route.
9. TD-05 visual contract for actual NPC stores, quái, võ kỹ, đồ vật, nhiệm vụ, effects and art provenance. A screen of generic colored cards with text is a **failure**, even if server tests pass.
10. Canon narrative identity: keep Dẩm Lồn Tiên Tử realm UNKNOWN, ChatDVT quadruped, masked mentor identity OPEN, late Phì Đế = Ăn Uống Thiên Tôn reveal appropriately secret. `GD-046` villain names/proposed seven arcs not promoted.

## Release evidence that does NOT yet exist

No TD-01..05 gameplay implementation, migration, revised Combat/Auto Farm engine, production Tụ Bảo Các scene, newly generated asset pack, final art sign-off or comprehensive Playwright two-browser verification is provided by this ZIP. Historical v0.1 prototype remains technical background.

## Owner approval boundaries

Documentation acceptance permits a **docs-only import**. It does not authorize deleting saves, disabling existing code, provisioning paid APIs, regenerating or overwriting existing asset sources, implementing a P2P market or making scripts paint geometric final art. Implementation needs separately scoped approval and test/evidence checkpoints.
