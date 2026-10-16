# Next Actions & Phase 1 Roadmap — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Current Active Priority: Phase 1 — Unified Design, Lore, Art Bible, UX & Production Policy

> **Priority Alignment Notice:** All new feature coding, new zone creation (e.g., Zone 3), and new asset generation are **paused** until **Phase 1** is completed and explicitly approved (`HUMAN_APPROVED`) by the project owner.

### Phase 1 Deliverables & Execution Sequence

1. **`docs/GAME_VISION.md`** — Core pillars, target audience (8–20 concurrent friends), hybrid session loops (2–5m check-in, 15–30m solo, 20–45m co-op), anti-goals (no pay-to-win, no dashboard-first UI, no procedural placeholder art passed off as final), and vertical-slice vs long-term scope.
2. **`docs/GAME_LORE.md`** — Canonical cosmology of **Bát Hoang Tu Tiên Giới** and **Bát Đại Thiên Tông (Tông Môn 8D)**, the exact 17 cultivation realms (`Phàm Nhân` → `Thánh Cảnh`), `Tam Đế Chi Ước` (`Phì Đế`, `RMT Đế`, `Vaal Đế`), and the 10 Legendary Cultivators (with `dam_lon_tien_tu` strictly `UNKNOWN` and `chatdvt` strictly a jade-cyan spirit beast).
3. **`docs/GAME_DESIGN.md`** — Authoritative mechanical specifications for combat disciplines (`Kiếm Tu`, `Pháp Tu`, `Thể Tu`), damage/mitigation formulas, Tu Vi progression & breakthroughs, 8-hour capped offline meditation, Phì Đế's dual-path culinary system (buying AND self-cooking), buff slot rules (1 meal + 1 beverage + 1 pill), RMT in-game economy sinks/faucets, and Vaal bounded risk mechanics.
4. **`docs/NARRATIVE_DESIGN.md`** — True Disciple (`Chân Truyền Đệ Tử`) relationship progression (`Stranger → Hữu Duyên → Được Chú Ý → Ký Danh → Nội Môn → Chân Truyền`), single equipped inheritance rule, dialogue tone in Vietnamese, and the 6-chapter narrative structure for each of the 10 Legendary Masters plus secret arcs (`Tam Đế Chứng Đạo`, `Hồng Trần Đế Yến`).
5. **`docs/WORLD_DESIGN.md`** — Spatial architecture of `Tân Thủ Thôn` and `Thanh Trúc Lâm`, Tiled `.tmj` layer standards, collision vs `AbovePlayer` occlusion rules, landmark placement, NPC/monster spawn topology, bidirectional portal validation gates, and future zone topology.
6. **`docs/ART_BIBLE.md` (Master Upgrade)** — Visual style direction for human approval, palette ramps, lighting (`45°` top-left), dual-resolution transition roadmap (`80x96` in `480x1920` sheets at anchor `(0.5, 0.9167)` replacing remaining legacy `48x64` in `288x1024` sheets and unproduced aliases `thai_tai` / `gia_bao`), genuine generative tileset/prop replacement plan, and the 5-state creative approval rubric (`PROPOSED`, `TECHNICALLY_VERIFIED`, `HUMAN_APPROVED`, `REJECTED`, `PLACEHOLDER`).
7. **`docs/UX_DESIGN.md`** — Playfield-first viewport budget, compact xianxia HUD anchors (top-left status, bottom-center hotbar, top-right minimap, bottom-left chat, side quest tracker), contextual `[E]` / `[F]` world prompts, modal/input focus rules, Vietnamese typography, and desktop (`1280x720`) / mobile (`390x844`) responsive scaling.
8. **Asset Provenance & Creative Approval Governance (`AGENTS.md`, `.agents/skills/ai-art-production/SKILL.md`, `assets/provenance.json`)** — Non-negotiable generative-origin enforcement, prohibition of procedural production art, portable relative path provenance, and the Human Creative Decisions Ledger.

---

## 2. Archived / Deferred Post-Phase-1 Expansion Backlog (Historical — Do Not Execute Before Phase 1 & Art Approval)

### 2.1 Completed in Historical Vertical Slice & Phase 0 (Technical Baseline)
- Full monorepo (`packages/shared`, `packages/game-data`, `packages/art-tools`, `apps/server`, `apps/client`).
- Phase 0 AI multi-pose `80x96` (`480x1920`) upgrade PoC for `hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu`, and `combat_vfx` (`256x256`), coexisting with 9 legacy `48x64` (`288x1024`) sprites (`TECHNICALLY_VERIFIED`, pending `HUMAN_APPROVED`).
- Two playable layered Tiled JSON zones (`Tân Thủ Thôn` and `Thanh Trúc Lâm`) with Y-sort occlusion and two-way portal transitions.
- Authoritative Colyseus `0.18.9` server + PostgreSQL (`@electric-sql/pglite` / `pg`) persistence, idempotency ledger, and economy audit log.
- Phì Đế's **Vạn Vị Thành Đạo** Chapter 1 quest accepting both purchased and self-cooked dishes, plus breakthrough to `Luyện Khí` and `Trúc Cơ`.

### 2.2 Deferred Future Content Milestones (Post-Phase 1 & Post-Art Upgrade)
1. **[Deferred] Complete Generative Art Upgrade for Existing Zones**:
   - Upgrade remaining 9 legacy `48x64` sprites (`rmt_de`, `vaal_de`, `hoa_tran`, `anh_7`, `ngoc_tam`, `merchant_truong`, `chatdvt`, `truc_lang`, `thanh_lan_xa`), create dedicated portraits/sprites for `thai_tai` and `gia_bao`, and replace procedurally drawn tiles in `bat_hoang_tileset.png` using `.agents/skills/ai-art-production/SKILL.md`.
2. **[Deferred] Zone 3 — Vạn Bảo Các & Kim Đan Bí Cảnh**:
   - Expand eastern portal network from `Thanh Trúc Lâm` into `Vạn Bảo Các` (market hub for `RMT Đế` and `Thái Tài` appraisal mechanics) and `Huyết Lôi Sơn` (`Vaal Đế` high-risk mutation trials).
3. **[Deferred] Chapters 2–6 of Chân Truyền Đệ Tử Questlines**:
   - Unlock `Phì Đế` Chapters 2–6 and `ChatDVT`'s spirit-beast contract trials (`Thánh Thú Vấn Tâm`) after Narrative Design sign-off.
4. **[Deferred] Sect Boss & Cross-Party Instance Rooms**:
   - Add scheduled sect boss spawns (`Huyết Ma Động` / `Hắc Trúc Yêu Vương`) requiring 2–4 party members using the authoritative party state in `AuthoritativeWorldEngine`.
