# Tông Môn 8D — Next Actions

## 1. Current priority and execution boundary

S1 is IN PROGRESS, NOT COMPLETE. `S1-B1a` contracts (`b04ebdc`), `S1-B2` transaction infrastructure (`0543b71`), `GOV-REPORT` (`f06c510`), `GOV-REPORT-H1` (`0c00374`), `GOV-FLOW-V2` (`fdd8e8b`), `S1-B1b` pure numeric progression/stat simulation helpers (`cb360e8`), and `S1-C` fresh `Character v0.2` persistence foundation (`bf2d24f`) are `COMMITTED`. Exact task evidence belongs to `docs/implementation/FEATURE_LEDGER.md`; do not reopen committed work without a new demonstrated defect.

`S1-D` authoritative `Character v0.2` server actions, server-generated guest credential bootstrap (`POST /api/v02/auth/guest` + `guest_credentials`), Project Atlas V2 (`docs/tong-mon-8d-project-atlas.html`), and explicit skill routing (`AGENT_SKILL_ROUTER.md` §2A) are implemented locally (`VERIFIED_READY_FOR_COMMIT` / `SELF_COMMIT` at base `bf2d24ffdf51e64cb4fb2ff984a8c008dfd12aaa`): complete closeout under this task's `COMMIT_AND_PUSH_AFTER_CHECKS` policy, then proceed to owner/planner dispatch of `S1-E`.

Next proposed gameplay task: **`S1-E` — Playfield-First Client/HUD `Character v0.2` & Destiny UI Integration (`TD-01` + `TD-05`)**. Wire `apps/client/src/network.ts`, `apps/client/src/hud.ts`, and `apps/client/src/WorldScene.ts` to `POST /api/v02/auth/guest` and the `ZoneRoom` `v02_*` message channels for `Character v0.2` draft creation, full-trio `Tiên Thiên` Destiny reroll/confirmation, 6-attribute point allocation, and 3-slot `Hậu Thiên` Destiny management while keeping `>= 75%` of the Phaser playfield unobstructed (`RULES.md` Rule 4). Note: production `v02_roll_innate_destiny` requires owner approval of at least 3 `APPROVED` innate Destiny traits (including >= 2 ordinary traits) beyond `van_vi_dao_thai`.

Client/HUD `Character v0.2` gameplay (`S1-E`..`S1-F`) and Slices `S2`..`S8` remain unimplemented. `Candidate A` and production art still require human approval (`HUMAN_APPROVED`). For the complete slice sequence use `docs/MASTER_PROJECT_PLAN.md` and `docs/ROADMAP.md`; `TD-05` continues across all player-visible slices.

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
