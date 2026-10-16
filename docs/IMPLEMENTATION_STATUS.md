# Implementation Status — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Milestone Verification Matrix

| Milestone | Scope | Status | Evidence |
|---|---|---|---|
| **Preflight & Skills** | Audit environment, review & install official Phaser 4 skills (`02d8931b626d9764c133cbb3fbf99966c03c757c`), OpenAI Game Studio skills (`0722921d5542fc593105c27bd52630babd8b8c2a`), and workspace skills | **PASS** | `.agents/skills/*/SKILL.md`, `AGENTS.md`, `RULES.md` |
| **Milestone A** | Verified foundation, capability proof (`Phì Đế` pixel art), 3 visual candidates critiqued & locked (`Candidate A`), `assets/manifest.json` validator | **PASS** | `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `assets/contact_sheet_preview.png`, `npm run verify:assets` |
| **Milestone B** | Two playable Tiled JSON maps (`Tân Thủ Thôn` & `Thanh Trúc Lâm`), 4-dir animated sprites (`48x64`), Y-sort + `AbovePlayer` occlusion, NPC dialogue, two-way portal traversal (`Town → Forest → Town`) | **PASS** | `maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`, `apps/client/src/WorldScene.ts`, `artifacts/playtest/01_tan_thu_thon_desktop_1280x720.png`, `artifacts/playtest/05_thanh_truc_lam_forest.png` |
| **Milestone C** | Real online multiplayer via Colyseus (`0.18.9`) + PostgreSQL (`@electric-sql/pglite` / `pg`), two independent browsers seeing each other, chat sync, portal room transitions, ghost-avatar cleanup | **PASS** | `apps/server/src/zoneRoom.ts`, `apps/server/src/db.ts`, `artifacts/playtest/06_multiplayer_shared_combat.png` |
| **Milestone D** | Server-authoritative combat (`Trúc Lang`, `Thanh Lân Xà`), shared monster HP across browsers, basic slash (`J`) + skill (`K`), telegraphs, loot drops & persistent inventory | **PASS** | `apps/server/src/worldEngine.ts`, `apps/server/src/__tests__/server.test.ts`, `tests/e2e/game.spec.ts` |
| **Milestone E** | Culinary merchant (`Lão Trù Trương`), ≥3 purchasable items, self-cooking recipes (`Thần Đỉnh`), and Phì Đế's **Vạn Vị Thành Đạo** quest accepting EITHER bought OR self-cooked dishes + golden blessing ceremony + `ChatDVT` spirit beast | **PASS** | `artifacts/playtest/02_merchant_shop_modal.png`, `artifacts/playtest/03_phi_de_quest_ceremony.png`, `apps/server/src/__tests__/server.test.ts` |
| **Milestone F** | Canonical 17 cultivation realms (`Phàm Nhân` → `Luyện Khí` → `Trúc Cơ` ... → `Thánh Cảnh`), 8-hour server-capped offline meditation, idempotency ledger, party system, playstyle simulations | **PASS** | `packages/game-data/src/runSimulation.ts`, `artifacts/playtest/04_breakthrough_luyen_khi.png`, `artifacts/playtest/07_mobile_viewport_390x844.png` |

## 2. Canonical Fidelity Verification

- **17 Cultivation Realms**: Preserved in `packages/game-data/src/index.ts` (`REALM_PROGRESSION`), from `Phàm Nhân` through `Luyện Khí` (9 stages), `Trúc Cơ`, `Kim Đan`, `Nguyên Anh`, `Hóa Thần`, `Luyện Hư`, `Hợp Thể`, `Độ Kiếp`, `Bán Tiên`, `Chân Tiên`, `Thái Ất Kim Tiên`, `Đại La Kim Tiên`, `Trảm Nhất Đao`, `Trảm Nhị Đao`, `Trảm Tam Đao`, `Bán Thánh`, and `Thánh Cảnh`.
- **10 Legendary Figures & Tam Đế**:
  - Tam Đế (`Thánh Cảnh`): `Phì Đế — Đặng Văn Tiến` (Ẩm Thực Đại Đạo), `RMT Đế — Phạm Phan Trọng Khải` (Kim Tiền Đại Đạo, in-game Linh Thạch only), `Vaal Đế — Trần Vũ Hoàng Tâm` (Vận Mệnh Tất Tay Đại Đạo).
  - `ChatDVT`: Jade-cyan celestial qilin-fox spirit beast (`Thánh Thú`), rendered as a distinct quadruped sprite and portrait.
  - `Dẩm Lồn Tiên Tử`: Canonical `realmId: "UNKNOWN"` (`Bất Minh (Không Rõ Cảnh Giới)`).
  - Remaining canonical figures: `Ngọc Tâm` (`Bán Thánh`), `Thái Tài` (`Bán Thánh`), `Anh 7 — Đoàn Quang Huy` (`Bán Thánh`), `Gia Bảo` (`Đại La Kim Tiên`), `Hòa Trần` (`Thái Ất Kim Tiên`), plus village culinary vendor `Lão Trù Trương`.
