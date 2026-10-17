# Tông Môn 8D — Next Actions

## 1. Current priority and execution boundary

S1 is IN PROGRESS, NOT COMPLETE. S1-B1a contracts and S1-B2 transaction infrastructure are committed; B2 is 0543b7157264ce672d2582d0bfa0a071ba855a42. GOV-REPORT and GOV-REPORT-H1 are committed at f06c510 and 0c00374. Exact task evidence belongs to docs/implementation/FEATURE_LEDGER.md; do not reopen committed B2 or exporter work without a new demonstrated defect.

The `GOV-FLOW-V2` operating model (owner + ChatGPT plan, Argon implements autonomously with focused impact-based checks, minimal in-task doc sync, and the dispatched commit policy) is implemented locally (`VERIFIED_READY_FOR_COMMIT` / `SELF_COMMIT` at base `0c00374cec4a489c523f5a8becb66bfa683210fa`): complete closeout under this task's `COMMIT_AND_PUSH_AFTER_CHECKS` policy, then proceed to owner/planner planning of `S1-B1b`. Routine independent planner review and mandatory per-task ZIPs are removed. Do not create another governance-tool hardening task solely to simplify a report, add generic validators, or pursue optional refactors.

Next proposed gameplay task: **S1-B1b PLAN**, separate from B2. Owner inputs carried from the 2026-10-17 handoff: six origin stats of 10; TD-01 EXP polynomial as a test baseline; 50/30/15/5 rarity and 60/40 within Thần for simulation only; no EXP banking at non-Saint cap. Final derived-stat/realm-factor/TuVi/reward balance, production RNG/catalog and BUILD are not approved by these inputs. Preserve Vietnamese identifiers and distinguish baseline from final balance.

Read packages/shared/src/index.ts, packages/game-data/src/index.ts, the relevant TD-01 numeric/approval sections and current tests for that plan. Propose pure-function boundaries, edge cases and seeded simulation that actually calls the new functions; do not claim the legacy simulator proves them. Follow the scoped PLAN/BUILD approval in AGENT_EXECUTION_CONTRACT. Do not start B1b BUILD from this priority list alone.

Before S1-C, resolve the owner save-migration policy and the required numeric/runtime contracts. Runtime Character v0.2, S1-C..F and S2..S8 remain unimplemented. Candidate A and production art still require human approval. For the complete slice sequence use MASTER_PROJECT_PLAN and ROADMAP; TD-05 continues across all player-visible slices.

For every task, carry forward owner authorization, select the impact-based check profile, fix known blockers internally and return one completion report. The planner uses the result to plan the next task; ZIPs and independent reviews are exceptional, not routine gates. A docs-only correction does not require game tests, build or dev-server startup. Native art production rules apply when art work is actually requested.

---

## 2. Historical Prototype Baseline & Deferred Expansion Backlog (Do Not Execute Before `TD-01`–`TD-05` Approval)

### 2.1 Existing Technical Prototype on Disk (v0.1 Baseline)
- Full monorepo (`packages/shared`, `packages/game-data`, `packages/art-tools`, `apps/server`, `apps/client`).
- Phase 0 AI multi-pose `80x96` (`480x1920`) upgrade PoC for `hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu`, and `combat_vfx` (`256x256`), coexisting with 9 legacy `48x64` (`288x1024`) sprites (`TECHNICALLY_VERIFIED`, pending `HUMAN_APPROVED`).
- Two playable layered Tiled JSON zones (`Tân Thủ Thôn` and `Thanh Trúc Lâm`) with Y-sort occlusion and two-way portal transitions.
- Authoritative Colyseus `0.18.9` server + PostgreSQL (`@electric-sql/pglite` / `pg`) persistence, idempotency ledger, and economy audit log.
- Legacy v0.1 3-class (`Kiếm Tu`, `Pháp Tu`, `Thể Tu`) combat and open Chapter 1 Phì Đế quest *(superseded in design by `docs/DECISIONS.md` Baseline v0.2; code preserved until `TD-01`–`TD-04` implementation)*.

### 2.2 Deferred Future Content Milestones (Post-Vertical-Slice & Post-Art Approval)
1. **[Deferred] Complete Generative Art Upgrade for Existing Zones** (`rmt_de`, `vaal_de`, `hoa_tran`, `anh_7`, `ngoc_tam`, `merchant_truong`, `chatdvt`, `truc_lang`, `thanh_lan_xa`, dedicated `thai_tai` / `gia_bao` sets, and generative replacement of procedural tiles in `bat_hoang_tileset.png`).
2. **[Deferred] First Legendary Domain (`Phì Đế Domain`) & Subsequent Bát Hoang Regions**.
3. **[Deferred] Optional 6-Chapter `Chân Truyền Đệ Tử` Routes for All 10 Legendary Masters**.
4. **[Deferred] Co-Op Party Instances, Sect Bosses & Cross-Dimensional Main Quest Finale**.
