# TD-04 — Reference Contract Checks (Model Only)

> TD-04 v0.6 | This package includes `tools/td04_reference_checks.py`. It validates stand-alone **contract fixtures** and Markdown consistency, NOT real Phaser/Colyseus tests. No code or database changes were made.

## Invariants exercised

1. A single `killEventId` + `rollIndex` + `characterId` delivers via XOR (`DIRECT_INVENTORY` or `GROUND_RESERVED`), not both; repeated claims rejected.
2. A reserved drop belongs only to the correct character until an authored party policy authorizes otherwise.
3. `FoodCatalog` unique discovery counts once for buy/cook and many copies of one ID; other dishes count independently.
4. A character without the matching Legendary signature cannot unlock private quests despite favorable NPC affinity; Hậu Thiên ownership qualifies whether equipped or not; all six private chapters required.
5. Main Quest package cannot have a matching-signature requirement; no automatic quest submit.
6. TD04's 10 Legendary NPC IDs, 17 realms, six Dao paths, four Destiny rarities, six technique rarities and five quest categories match the Game Design v0.2 and prior TD specs.
7. New content remains DRAFT/PROPOSED; Food Catalog special-trigger threshold is NOT assigned an accidental numeric value.

## Reproduce

```bash
python3 tools/td04_reference_checks.py
```

The test constructs synthetic item/quest events, not actual database rows. It demonstrates properties of the proposed design; later implementation must run real concurrency and server integration tests in `TD04_MIGRATION_TESTS.md` before production.
