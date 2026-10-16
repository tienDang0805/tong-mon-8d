# TD-FREEZE-IMPLEMENTATION-PATH — Plan → Build → Review → Verify

> Roadmap for later programming only. **NOT** an executable instruction during Argon docs import.

## Post-docs integration sequence

| Slice | Thin demonstrable vertical feature | Specs read | Acceptance |
|---|---|---|---|
| S0 | Verify original v0.1 game dev loop, backing up PGlite and fixing remaining environment configuration safely | Current Git + migration docs | Two browsers; source snapshot and test evidence; no destructive DB action |
| S1 | Character schema v0.2 and migration with 6 origin stats, Level/EXP/Tu Vi, 3 immutable Tiên Thiên | TD-01 | Controlled simulated Level reward, no second Legendary, restart persisted, 1 point per level; no prototype save loss |
| S2 | Deterministic stat recomputation and realm breakthrough Phàm→Luyện Khí after manual masked mentor Main Quest | TD-01 + TD-03 quest contract | Player sees real mentor encounter, gets beginning Công pháp/pill, manually breakthroughs, no level skip |
| S3 | TD-02 common legal combat action, Dao XP and progression trial gate | TD-02 + TD-01 | Same damage via manual and scheduled casts, six paths, 3→4 refuses without trial, real animations at target |
| S4 | Online-only Auto Farm + one-character controller, map-safe path navigation, manual quest | TD-03 + TD-02 | Disconnect halts; no offline kills; auto only travels, task requires manual turn-in; two-tab test |
| S5 | Content item/loot/favor/Food Catalog and initial authored town quest/forest enemy | TD-04 + TD-01..03 | One committed item reward, distinct story states, quest not gated by signature, same monster HP across browsers |
| S6 | NPC-only Tụ Bảo Các, Lão Trù Trương + specialists, BUY/SELL with search/filter | TD-04 NPC_SHOPS + TD-05 | In-world accessible building + NPC; no remote sale/no P2P; price/stock validated; screenshot w/shop closed/open |
| S7 | First full generated art pack/zone and user-approved visual gate | TD-05 + existing Art Bible / AI skill | Genuine source+provenance, sprite/tileset/VFX/market facade, actual scene capture; owner art sign-off |
| S8 | 12-beat human playthrough acceptance of first production vertical slice | All TDs | Creator approves interactive world, skills, quest, Tụ Bảo Các, farm, Level and breakthrough, not just text panels |

## Implementation handoff contract per slice

Each Argon task must state: exact slice, owner-approved decision IDs, affected spec/doc paths, files likely touched, forbidden changes, dependency/migration risks, tests and evidence, **visual artifacts required**. Require Plan → Build → Review → Verify, with an approval checkpoint at the top of each slice. A skill asset-generation step is never proof that the resulting asset looks good; final scene capture and owner review remain mandatory.

## Suggested repo doc changes during docs-only import

Append to `docs/CONTEXT_INDEX.md` a link to `docs/technical/TD_FREEZE_OVERVIEW.md` and task routing by TD domain; mark all source `docs/systems/` and `docs/pipelines/` specs as **DESIGN APPROVED / NOT IMPLEMENTED**. Update `docs/NEXT_ACTIONS.md`, `docs/PROJECT_STATUS.md`, and `docs/ROADMAP.md` to say Documentation Freeze v1.0 complete once imported, **not** that gameplay features are finished. In `docs/DECISIONS.md`, append a scoped pointer to `docs/technical/TD_FREEZE_APPROVALS.md`, without changing any existing GD rows or silently promoting PROPOSED numbers/names. Update `AGENTS.md` context reading order minimally to include the Freeze overview. Historical audit docs should not be overwritten.
