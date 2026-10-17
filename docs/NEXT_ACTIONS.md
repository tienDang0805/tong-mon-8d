# Tông Môn 8D — Next Actions

## 1. Current priority and execution boundary

S1 is IN PROGRESS, NOT COMPLETE. `S1-B1a` contracts (`b04ebdc`), `S1-B2` transaction infrastructure (`0543b71`), `GOV-REPORT` (`f06c510`), `GOV-REPORT-H1` (`0c00374`), `GOV-FLOW-V2` (`fdd8e8b`), and `S1-B1b` pure numeric progression/stat simulation helpers (`cb360e8`) are `COMMITTED`. Exact task evidence belongs to `docs/implementation/FEATURE_LEDGER.md`; do not reopen committed work without a new demonstrated defect.

`S1-C` fresh `Character v0.2` persistence foundation (`characters_v02` DDL & `CharacterV02Repository` in `apps/server/src/characterV02Repository.ts` and `apps/server/src/db.ts` under the owner-approved fresh-start policy) is implemented locally (`VERIFIED_READY_FOR_COMMIT` / `SELF_COMMIT` at base `cb360e80e7801950b6fa954bf17f48e9b8306716`): complete closeout under this task's `COMMIT_AND_PUSH_AFTER_CHECKS` policy, then proceed to owner/planner dispatch of `S1-D`.

Next proposed gameplay task: **`S1-D` — Authoritative Colyseus Server Actions (`Character v0.2`)**. Wire authoritative server handlers in `apps/server` (`worldEngine.ts` / `zoneRoom.ts`) on top of `S1-B1a` contracts, `S1-B1b` numeric progression, `S1-B2` transactions, and `S1-C` `CharacterV02Repository` for Character v0.2 creation, unlimited full-trio `Tiên Thiên` innate Destiny rerolls (no slot locking, `GD-011`), innate Destiny confirmation, free base-attribute point allocation (`+1` per actual Level gained, `GD-021`), and authoritative EXP/state persistence.

Runtime `Character v0.2` gameplay (`S1-D`..`S1-F`) and Slices `S2`..`S8` remain unimplemented. `Candidate A` and production art still require human approval (`HUMAN_APPROVED`). For the complete slice sequence use `docs/MASTER_PROJECT_PLAN.md` and `docs/ROADMAP.md`; `TD-05` continues across all player-visible slices.

For every task, carry forward owner authorization, select the impact-based check profile (`docs/technical/AGENT_EXECUTION_CONTRACT.md` §3.2), fix known blockers internally, and return one concise completion report. The planner uses the result to plan the next task; ZIPs and independent reviews are exceptional, not routine gates. A docs-only correction does not require game tests, build, or dev-server startup. Native art production rules apply when art work is actually requested.

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
