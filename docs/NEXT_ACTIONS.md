# Next Actions & Expansion Roadmap — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Completed in Autonomous Vertical Slice Launch (Milestones A–F)
- Full monorepo (`packages/shared`, `packages/game-data`, `packages/art-tools`, `apps/server`, `apps/client`).
- Original AI-assisted pixel-art portraits, 4-directional animated character/beast spritesheets (`48x64`), environment landmarks, and `32x32` tileset validated by `assets/manifest.json`.
- Two distinct layered Tiled JSON zones (`Tân Thủ Thôn` and `Thanh Trúc Lâm`) with Y-sort occlusion and two-way portal transitions.
- Authoritative Colyseus `0.18.9` server + PostgreSQL (`@electric-sql/pglite` / `pg`) persistence, idempotency ledger, and economy audit log.
- Phì Đế's **Vạn Vị Thành Đạo** Chapter 1 quest accepting both purchased and self-cooked dishes, plus breakthrough to `Luyện Khí` and `Trúc Cơ`.

## 2. Next Content Milestones (Post-Vertical Slice)
1. **Zone 3 — Vạn Bảo Các & Kim Đan Bí Cảnh**:
   - Expand eastern portal network from `Thanh Trúc Lâm` into `Vạn Bảo Các` (market hub for `RMT Đế` and `Thái Tài` appraisal mechanics) and `Huyết Lôi Sơn` (`Vaal Đế` high-risk mutation trials).
2. **Chapters 2–5 of Chân Truyền Đệ Tử Questlines**:
   - Unlock `Phì Đế` Chapter 2 (`Bát Trân Linh Thú Yến`) and `ChatDVT`'s spirit-beast contract trials (`Thánh Thú Vấn Tâm`) once players reach `Trúc Cơ Sơ Kỳ`.
3. **Sect Boss & Cross-Party Instance Rooms**:
   - Add scheduled sect boss spawns (`Hắc Trúc Yêu Vương`) requiring 2–4 party members using the existing authoritative party state in `AuthoritativeWorldEngine`.
