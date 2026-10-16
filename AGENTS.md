# AGENTS.md — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Project Boundaries & Architecture
- `packages/shared/`: Shared TypeScript protocol contracts, message payloads, and deterministic constants.
- `packages/game-data/`: Canonical source of truth for the 17 cultivation realms, 10 legendary NPCs, zones, portals, enemies, items, culinary recipes, quests, and balance simulation models.
- `packages/art-tools/`: Deterministic pixel-art asset generation, chroma-key extraction, sprite strip normalization, contact-sheet builder, and `assets/manifest.json` integrity verifier.
- `apps/server/`: Authoritative Node.js + Colyseus (`0.18.x`) multiplayer server with embedded/external PostgreSQL (`@electric-sql/pglite` / `pg`) persistence, spatial collision validation, monster AI simulation, combat, culinary/shop, quest, party, and offline cultivation services.
- `apps/client/`: Phaser `4.2.1` + TypeScript + Vite browser client with Tiled JSON map rendering, Y-sorted depth occlusion, 4-directional sprite animations, client interpolation, synthesized WebAudio sound effects, and compact xianxia HUD.
- `assets/` & `maps/`: Runtime and source pixel art, `manifest.json`, and Tiled JSON maps (`tan_thu_thon.tmj`, `thanh_truc_lam.tmj`).

## 2. Canonical Constraints
- Preserve all 17 cultivation realms in exact order (`Phàm Nhân` plus 17 realms from `Luyện Khí` to `Thánh Cảnh`).
- Preserve all 10 legendary figures (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`).
- `dam_lon_tien_tu` realm MUST remain `"UNKNOWN"` (`Bất Minh`).
- `chatdvt` MUST be depicted and animated as a jade-cyan spirit beast, never a generic human mage.
- Phì Đế's culinary path (`Ẩm Thực Đại Đạo`) allows BOTH purchasing and self-cooking qualifying spiritual dishes.
- No comments (`//`, `/* */`, `#`, `<!-- -->`) in any code file, per `RULES.md`.

## 3. Safe Tool Usage & Quality Gates
- Do not call paid external APIs or cloud provisioning without explicit owner authorization.
- Every milestone requires:
  1. Passing asset manifest and map validator (`npm run verify:assets`).
  2. Passing unit, balance simulation, and server authority integration tests (`npm test`).
  3. Passing build (`npm run build`).
  4. Real Playwright two-browser verification and visual screenshots (`npm run test:e2e`) saved under `artifacts/playtest/`.

## 4. How to Resume
- Inspect `docs/IMPLEMENTATION_STATUS.md` and `docs/NEXT_ACTIONS.md`.
- Run `npm run verify:assets && npm test` to verify current state.
- Start server + client with `npm run dev` (or `npm run dev:server` and `npm run dev:client`).
