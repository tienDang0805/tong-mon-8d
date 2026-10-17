# Tông Môn 8D — Next Actions

## 1. Current priority and execution boundary

S1 is IN PROGRESS, NOT COMPLETE. `S1-B1a` contracts (`b04ebdc`), `S1-B2` transaction infrastructure (`0543b71`), `GOV-REPORT` (`f06c510`), `GOV-REPORT-H1` (`0c00374`), `GOV-FLOW-V2` (`fdd8e8b`), `S1-B1b` pure numeric progression/stat simulation helpers (`cb360e8`), `S1-C` fresh `Character v0.2` persistence foundation (`bf2d24f`), and `S1-D` authoritative `Character v0.2` server actions, Project Atlas V2 & explicit skill routing (`897197a`) are `COMMITTED`. Exact task evidence belongs to `docs/implementation/FEATURE_LEDGER.md`; do not reopen committed work without a new demonstrated defect.

`S1-E` Playable Character Creation, 16-trait Starter Destiny Catalog (`docs/implementation/S1E_STARTER_DESTINY_CATALOG.md`, including 14 ordinary traits + `van_vi_dao_thai` for `phi_de` + development-trial `huyen_anh_dao_thai` for `dam_lon_tien_tu`), `60/40` `Thần` signature/ordinary weights (`FIX A`), full-triple independent rejection sampling (`FIX B`), 4 canonical appearance options, `[C]` 6-attribute / Destiny HUD, and world spawn isolation are implemented locally (`VERIFIED_READY_FOR_COMMIT` / `SELF_COMMIT` at base `897197a268f3c906ac624cac89fa65782a38b034`): complete closeout under this task's `COMMIT_AND_PUSH_AFTER_CHECKS` policy, then proceed to owner/planner dispatch of `S1-F`.

Next proposed gameplay task: **`S1-F` — Character Base Closeout & Two-Browser / Restart Acceptance Gate (`TD-01` + `TD-05`)**. Verify end-to-end `Character v0.2` concurrency, reroll/confirm race safety, replay deduplication, attribute allocation/equip invariants, two-browser multiplayer state isolation/visibility, and file-backed PGlite restart persistence to close Slice `S1` (`Character Base` gate).

Slice `S1` closeout acceptance (`S1-F`) and Slices `S2`..`S8` remain unimplemented. `Candidate A` and production art still require human approval (`HUMAN_APPROVED`), and the 14 ordinary traits + `huyen_anh_dao_thai` remain `DESIGN_BASELINE` / development-trial values rather than final production balance. For the complete slice sequence use `docs/MASTER_PROJECT_PLAN.md` and `docs/ROADMAP.md`; `TD-05` continues across all player-visible slices.

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
