# Tông Môn 8D — Next Actions

## 1. Current priority and owner-chosen execution sequence (`DOC-CLEAN-01 -> VISUAL-01 -> VISUAL-02 -> VISUAL-03 -> S1-F`)

Slice `S1` is **IN PROGRESS, NOT COMPLETE**. `S1-B1a` (`b04ebdc`), `S1-B2` (`0543b71`), `GOV-REPORT` (`f06c510`), `GOV-REPORT-H1` (`0c00374`), `GOV-FLOW-V2` (`fdd8e8b`), `S1-B1b` (`cb360e8`), `S1-C` (`bf2d24f`), `S1-D` (`897197a`), `S1-E` (`a3de054`), `PRE-S1F` (`b82e20b`), `DOC-CLEAN-01` (`51d4caf2ae4ae101e41b0f31192a7319e06d965e`), and `VISUAL-03-P` (`4679f49bfc100374808f6ca6b1714bfaf31d8701`) are **`COMMITTED`**. **`VISUAL-03-W` (World Integration, Camera & Minimap)** is **`VERIFIED_READY_FOR_COMMIT` (`SELF_COMMIT` at base `4679f49`)**. Exact task evidence belongs to `docs/implementation/FEATURE_LEDGER.md`.

### Ordered Next Priorities

1. **Completed Stage — `VISUAL-03-W` (`VERIFIED_READY_FOR_COMMIT` / `SELF_COMMIT`)**:
   - Real `96×72` (`3072×2304 px`) Tiled `maps/tan_thu_thon.tmj` (`5,357` walkable / `1,555` blocked), responsive `CameraView.ts` across `720p`/`1080p`/`1440p`/`4K`/`390×844`, persistent read-only `MinimapView.ts` in `#hud-minimap-mount`, 11 `80×96` starter/NPC sprites (`full_80x96_20row`, `locomotion_80x96_8row`, `stationary_npc_80x96_4f`) including differentiated `phi_de` and `rmt_de` plus de-aliased `npc_ngoc_tam` and `thai_tai`, Y-sorted roof/nameplate occlusion, and non-destructive `resolveSafeZoneCoordinates` migration.
   - **Next**: Proceed to `VISUAL-03-U` when dispatched by the owner/planner.
2. **Priority 2 — `VISUAL-03-U` (UI/HUD 9-Slice, Character Creation & `[C]` Panel Visual Integration, `NOT STARTED`)**:
   - Integrate the approved `V01-B` Batch A 9-slice frames, HUD chrome, buttons/seals, attribute/item/destiny icons, and portrait frames into `hud.ts`, `characterCreation.ts`, and `CharacterPanel.ts` while preserving `>= 75%` unobstructed playfield.
3. **Priority 3 — `VISUAL-03-Q` (Measured Frame-Time / FPS Experience Review & `HUMAN_APPROVED` Sign-Off, `NOT STARTED`)**:
   - Record measured animation/frame-time/FPS evidence on the integrated `96×72` scene and present final `VISUAL-03` package for owner `HUMAN_APPROVED` sign-off (`AGENTS.md` §5 and `docs/ART_BIBLE.md`).
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
