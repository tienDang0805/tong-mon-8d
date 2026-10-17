# Tông Môn 8D — Next Actions

## 1. Current priority and owner-chosen execution sequence (`DOC-CLEAN-01 -> VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F`)

Slice `S1` is **IN PROGRESS, NOT COMPLETE**. `S1-B1a` contracts (`b04ebdc`), `S1-B2` transaction infrastructure (`0543b71`), `GOV-REPORT` (`f06c510`), `GOV-REPORT-H1` (`0c00374`), `GOV-FLOW-V2` (`fdd8e8b`), `S1-B1b` pure numeric progression/stat simulation helpers (`cb360e8`), `S1-C` fresh `Character v0.2` persistence foundation (`bf2d24f`), `S1-D` authoritative `Character v0.2` server actions, Project Atlas V2 & explicit skill routing (`897197a`), `S1-E` Playable Character Creation, 16-trait Starter Destiny Catalog & `[C]` 6-attribute / Destiny HUD (`a3de054`), and `PRE-S1F` modular-monolith source architecture & selective Character/Destiny leaf extraction (`b82e20b148ad08544c3efd1003d1111364a45e51`) are **`COMMITTED`**. Exact task evidence and Git line counts (`index.ts` `2100 -> 885`, `characterV02Actions.ts` `2037 -> 1778`, `hud.ts` `925 -> 660`) belong to `docs/implementation/FEATURE_LEDGER.md`; do not reopen committed work without a new demonstrated defect.

**Current Closeout (`DOC-CLEAN-01`, `SELF_COMMIT` at base `b82e20b`)**: Reconcile active documentation after `PRE-S1F`, archive historical Phase 0/1A bootstrap/audit docs byte-for-byte under `docs/archive/legacy/*` with locator stubs, remove `EXTERNAL_SKILLS.md` and `docs/WORKSPACE_HANDOFF.md` from the active tree, bound `scripts/verify-doc-sync.mjs` to truthful mechanical checks with disposable fixture tests (`scripts/tests/verify-doc-sync.test.mjs`), commit, and push. Stop after `DOC-CLEAN-01` closeout and await owner/planner dispatch of `VISUAL-01`.

### Ordered Next Priorities

1. **Priority 1 — `VISUAL-01` (Three New Coherent `S1` Visual Direction Sets for Owner Selection, `NOT STARTED`)**:
   - Verify live host `image-generator` capability at task start (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`).
   - Produce **three new visual direction sets** under fresh IDs/versions distinct from historical `Candidate A/B/C`. Each set presents a unified world view + compact HUD + Character Creation (`Tiên Thiên` 3-trait roll) + `[C]` Character/Destiny panel, including mobile readability (`390x844`) and current Rule 5 geometry.
   - **Gate**: Project owner selects the visual direction (planner advises; concept mocks do not prove runtime or FPS).
2. **Priority 2 — `VISUAL-02` (Scoped `S1` Sample Asset Pack & Continuous Animation Frames for Owner Approval, `NOT STARTED`)**:
   - Produce a representative `S1` sample asset pack in the owner-selected `VISUAL-01` direction: `S1` hero/appearance assets in scope, UI panels/buttons, stat/rarity/destiny icons, starter tiles/props, sample NPC/monster/VFX needed for the `S1` scene, continuous frame-to-frame animation sheets, and raw AI sources + SHA-256 provenance.
   - **Gate**: Project owner approves the sample art and animations before scaling (scoped to `S1`; does not require all 10 Legends, all regions, or `S2`–`S8` content).
3. **Priority 3 — `VISUAL-03` (Phaser 4 / Tiled Integration & Measured Frame-Time / FPS Experience Review, `NOT STARTED`)**:
   - Integrate approved `VISUAL-02` assets into Phaser 4 / Tiled (`WorldScene.ts`, `hud.ts`, `CharacterPanel.ts`, Tiled maps), verify real animations, working Character Creation and `[C]` panel, playfield readability (`>= 75%` unobstructed), and responsive desktop/mobile focus, and record measured animation/frame-time/FPS evidence on the stated scene and device.
   - **Gate**: Project owner approves the in-game visual experience (`HUMAN_APPROVED` recorded in `AGENTS.md` §5 and `docs/ART_BIBLE.md`).
4. **Priority 4 — `S1-F` (Character Base Closeout & Two-Browser / File-Backed Restart Acceptance Gate, `NOT YET ACCEPTED`)**:
   - Verify end-to-end `Character v0.2` creation/reroll/confirm concurrency races, replay/idempotency deduplication, attribute allocation/equip invariants, two-browser multiplayer state isolation/visibility, reconnect, file-backed isolated PGlite restart persistence (`memory://` E2E does not substitute), and current `VISUAL-03` visual evidence.
   - **Gate**: Owner accepts `S1-F` closeout of Slice `S1`.
5. **Priority 5 — Subsequent Vertical Slices (`S2`–`S8`, `NOT STARTED`)**:
   - Proceed through `S2` (Cultivation & Breakthrough), `S3` (Combat, Techniques & Dao Mastery), `S4` (Connected Auto Farm, Navigation & Quest FSM), `S5` (World, Items, Food, Affinity & Quests), `S6` (`Tụ Bảo Các` NPC Shops), `S7` (Full Slice Art Pack), and `S8` (12-Beat Vertical Slice Playthrough) per `docs/MASTER_PROJECT_PLAN.md` and `docs/ROADMAP.md`.

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
