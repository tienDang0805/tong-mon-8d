# TD-FREEZE-OVERVIEW — V1.0 Technical Documentation Baseline

> Approved in conversation 2026-10-16. Documentation-only baseline; **code implementation status remains unchanged**. Source Git baseline: `d4e6e17b5a9e88d9e717e33ebfe3e218b5c39486`.

## Reading order for Argon and reviewers

1. `AGENTS.md`, `RULES.md`, `docs/DECISIONS.md`, `docs/CONTEXT_INDEX.md`, `docs/PROJECT_STATUS.md` **in the live repo**.
2. This `TD_FREEZE_OVERVIEW.md`, `TD_FREEZE_APPROVALS.md`, `TD_FREEZE_CONTRACT_MAP.md` and `TD_FREEZE_GATES.md`.
3. For the active task, only the relevant `docs/systems/` and `docs/pipelines/` specs plus pertinent technical migration/test notes.
4. The historical `MASTER_PROMPT.md` and code can be consulted to understand legacy behavior. Never let legacy 3-class gameplay override the new six Dao paths.

## Approved scope by TD

- **TD-01:** Character Level, independently earned EXP and Tu Vi, realm/breakthrough gates, stat sources/derivation, Tiên Thiên/Hậu Thiên, protected signature ownership. 17 cultivation realms + Phàm Nhân, ending Thánh Cảnh Lv350 with Lv351+ same realm.
- **TD-02:** six martial Dao masteries, ten Dao stages, 3 mandatory trial gates (3→4, 6→7, 9→10), Công pháp/Võ kỹ and combat with server-owned damage/monster progression; sample numeric coefficients are baselines.
- **TD-03:** connected-only Auto Farm, legitimate kill/loot/Dao credit, safe navigator, **manual** quest accept/submit/choices, offline bế quan separately limited to 8h.
- **TD-04:** zone graph, items/economy, affinity, NPCs, Food Catalog, quests/content registries, loot one-delivery. Owner-added **Tụ Bảo Các + specialist NPC BUY/SELL**, excluding player markets.
- **TD-05:** every player-visible content type gets `VisualBindingDef` and required asset roles; generated source artwork → preserved source/provenance → post-process/atlas → Phaser/Tiled render/animation → real screenshot/playtest → owner visual review. Shop is a walkable visible building/counter, not floating popup UI.

## Authoritative contracts (not parallel engines)

TD-01 is sole source for Level/stat/destiny calculations. TD-02 is sole source for damage, skill legality and Dao credit. TD-03 schedules authorized connected actions and manual quest transitions, never a second combat path. TD-04 authors data, rewards/catalogs/shop offers and predicates, never its own combat or quest mechanics. TD-05 renders server events and world content, never owns reward truth. Shop has ONE `ShopService`, NPC access paths can filter a common catalog.

## Review acceptance and artifacts

Owner reviewed/approved all five phases **as technical design**; the design freeze does **not** mean the game is finished. See `TD_FREEZE_APPROVALS.md` for exact statuses, `TD_FREEZE_GATES.md` for missing tuning/art/implementation evidence and `TD_FREEZE_IMPLEMENTATION_PATH.md` for staged migration.

## Historical review header policy

Individual component docs retain verbatim original `DRAFT`, `REVIEW_REQUIRED`, `OWNER_REVIEW_REQUIRED` stamps to preserve reviewed file hashes. Those are **pre-approval historical authoring stamps**. This Freeze approval ledger takes precedence for overall *design review state* only, while `PROPOSED`, `DESIGN_BASELINE`, `UNRESOLVED` internal details retain their original limited status. If editors want to normalize headers later, perform a separate, disclosed docs-only patch with new checksums rather than silent content changes.
