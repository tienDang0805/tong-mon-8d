# Next Actions & Phase 1B Roadmap — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Current Active Priority: Phase 1B.0 Integrated → Gated Technical Design (`TD-01`–`TD-05`)

> **Phase Boundary & Priority Notice:** **Phase 1B.0 (Game Design Baseline v0.2 Documentation Integration)** has imported the 10 owner-approved baseline documents into `docs/` (`docs/DECISIONS.md`, `docs/CONTEXT_INDEX.md`, `docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/CONTENT_PIPELINE.md`, `docs/ROADMAP.md`). All gameplay implementation, runtime code refactors, and new asset generation remain **paused** until the project owner reviews/commits Phase 1B.0 and explicitly authorizes **Technical Design 01 (`TD-01`)**.

### 1.1 Integrated Phase 1B.0 Specification Suite (Baseline v0.2)

1. **`docs/DECISIONS.md`** — Authoritative register of gameplay and narrative decisions (`GD-001`–`GD-006`, `GD-010`–`GD-018`, `GD-020`–`GD-028`, `GD-030`–`GD-037`, `GD-040`–`GD-046`), explicitly distinguishing `APPROVED`, `DESIGN_BASELINE` (`GD-017`, `GD-018`, `GD-028`, `GD-037`), `PROPOSED` (`GD-046` era/plane/villain names and 7 macro story arcs, plus Dao stage 1–10 names), `UNRESOLVED`, and `LEGACY`.
2. **`docs/CONTEXT_INDEX.md`** — Document map and reading order by task (gameplay/progression, quest/narrative/NPC, map/zone/navigation, art/sprites/UI, server/DB/ops).
3. **`docs/GAME_VISION.md`** — Online AFK Cultivation RPG core pillars, connected presence semantics (online-only Auto Farm + capped offline `Bế Quan` meditation), build identity before numeric grind, and anti-goals (no auto-quest story skip, no offline monster farm, no procedural placeholder art as final).
4. **`docs/GAME_LORE.md`** — Canonical cosmology of **Bát Hoang Tu Tiên Giới** and **Tông Môn 8D**, the 17 playable cultivation realms (`Phàm Nhân` → `Thánh Cảnh`, with `Đại Thánh` and `Cổ Thần` as lore only per `GD-044`), `Tam Đế Chi Ước`, the 10 Legendary Cultivators (`dam_lon_tien_tu` strictly `UNKNOWN`, `chatdvt` strictly a jade-cyan quadruped spirit beast), and the 10 mutually exclusive `Thần Phẩm` Signature Destinies (at most one owned per character across both `Tiên Thiên` and `Hậu Thiên`, `GD-014`).
5. **`docs/GAME_DESIGN.md`** — Authoritative mechanical baseline: 6 primary base stats (`GD-028` `DESIGN_BASELINE`: **Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính**, `+1` free point per level under `GD-021`), Character Level `1–350+` (`Phàm Nhân` `1–10` + 17 realms × 20 levels, `GD-020`), 3 immutable `Tiên Thiên` + 3 active `Hậu Thiên` destinies across **4 rarity tiers** (`Phàm, Hoàng, Tiên, Thần`, `GD-010`–`GD-013`), **6 independent 10-stage Dao mastery paths** (`GD-024`: **Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu**), `Công pháp` (`GD-030`) and `Võ kỹ` (`GD-031`) across **6 rarity tiers** (`GD-032`: **Phàm, Linh, Hoàng, Địa, Thiên, Thần**), online-only Auto Farm (`GD-002`), and manual quest execution (`Q` journal + auto-navigation only, `GD-003`–`GD-004`).
6. **`docs/NARRATIVE_DESIGN.md`** — Universal Main Quest from `Phàm Nhân` to playable `Thánh Cảnh` (`GD-040`–`GD-043`, with **seven `PROPOSED` macro arcs** `I. Phàm Nhân Vấn Đạo` .. `VII. Thánh Nhân Chi Chiến` under `GD-046` and the `Phàm Nhân` Lv 10 masked immortal's identity kept **OPEN/unconfirmed** under `GD-023`) vs optional 6-chapter **True Disciple (`Chân Truyền`)** side routes (`GD-015`, `GD-041`) following the strict sequence: **matching signature ownership → NPC affinity → special trigger → exclusive questline → completing all 6 chapters → True Disciple** (for Phì Đế: `Vạn Vị Đạo Thai` signature + affinity + food-related special trigger whose exact dish threshold remains `UNRESOLVED` pending the **Food Catalog** per `GD-016`, `GD-045`).
7. **`docs/WORLD_DESIGN.md`** — Zone-based power model (`GD-033`, `GD-034`), `Tân Thủ Thôn` and `Thanh Trúc Lâm` prototype status, map types (`overworld_zone`, `interior`, `legendary_domain`, `combat_instance`, `point_click_instance`, `story_instance`), Phì Đế's domain as the first future Legendary space, and `navigateToQuestObjective` travel-assistance contract.
8. **`docs/UX_DESIGN.md`** — Playfield-first HUD layout, `Q` Quest Journal (`Chính tuyến / Phụ tuyến / Đặc biệt / Hằng ngày / Bảng nhiệm vụ thành trấn`), Auto Farm configuration panel, Cultivation screen separating Level/Realm/Dao/Destinies, and infinite full-trio `Tiên Thiên` reroll flow.
9. **`docs/CONTENT_PIPELINE.md`** — 12-step gated content workflow, type-safe catalogs (`NPC`, `Võ kỹ`, `Công pháp`, `item`, `zone/map`, `quest`, `Legendary domain`), declarative server conditions/effects, and testing tiers.
10. **`docs/ROADMAP.md`**, **`docs/ART_BIBLE.md`**, & **`.agents/skills/ai-art-production/SKILL.md`** — Gated Design-to-Production sequence, 5-state creative approval lifecycle (`PROPOSED`, `TECHNICALLY_VERIFIED`, `HUMAN_APPROVED`, `REJECTED`, `PLACEHOLDER`), and non-negotiable generative origin policy.

### 1.2 Subsequent Gated Technical Design Sequence (`docs/ROADMAP.md` — Do Not Start Without Owner Approval)

1. **`TD-01` — Character, Destiny, Level & Realm Technical Spec**: Authoritative `Character`, `Attributes`, `LevelProgress`, `RealmProgress`, `DestinyCollection`, `Affinities`, deterministic formula order, and Mortal Lv 10 Main Quest breakthrough gate.
2. **`TD-02` — Techniques, Dao Mastery & Combat Spec**: 6 mastery paths (`Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu`) × 10 stages, path-specific `Bí Cảnh` trials at stages 3→4, 6→7, and 9→10, `Công pháp` and `Võ kỹ` (6 tiers: `Phàm, Linh, Hoàng, Địa, Thiên, Thần`), skill loadouts, and zone-based `Tiên Phẩm` combat balance simulations.
3. **`TD-03` — Online Auto Farm, Navigation & Quest Spec**: Colyseus connected presence semantics for Auto Farm, manual quest hand-in, `Q` journal, `navigateToQuestObjective` stopping at objective interaction range, and capped offline `Bế Quan` meditation.
4. **`TD-04` — World, Item, Affinity & Content Contract Spec**: Typed registries for zones, buildings/động phủ, items, food/pills (**Food Catalog** prerequisite for Phì Đế trigger), gifts, affinity, story flags, `Hậu Thiên` achievements, and Phì Đế's optional 6-chapter True Disciple route.
5. **`TD-05` — AI Asset Integration & Art Sign-Off**: Generative upgrade of the first zone's tileset/props and key characters with reproducible packaging and `HUMAN_APPROVED` sign-off at gameplay zoom.

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
