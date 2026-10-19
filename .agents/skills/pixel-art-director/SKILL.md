---
name: pixel-art-director
description: Direct coherent, lore-faithful pixel art for Tông Môn 8D characters, sprites, animated strips, tilesets and VFX. Use before producing or approving any production art, especially the ten legendary cultivator portraits.
---

# Pixel Art Director

## Production brief

Read `assets/corekit/v01b/catalog.json`, `assets/corekit/v01b/COREKIT_INDEX.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `packages/game-data/src/index.ts`, and `.agents/skills/ai-art-production/SKILL.md`. Resolve all active visual masters through `assets/corekit/v01b/catalog.json` under the owner-approved **`V01-B — THIÊN MỆNH TIÊN CUNG`** direction (`DEC-006`..`DEC-009`) with Three-Tier Progression Grandeur (`Tân Thủ Thôn` = Tier I Grounded Starter Village). Never browse `assets/archive/history/`, `assets/concepts/`, or `archive_pre_correction` as active masters.

## Workflow

1. Resolve each character's or asset's active `referenceId@version` (`creativeApprovalState === "HUMAN_APPROVED"` with a matching `approvalLedger` record) and `profileId` in `assets/corekit/v01b/catalog.json` and `docs/CHARACTER_VISUAL_BIBLE.md`.
2. Generate new artwork exclusively via the Argon host's built-in `image-generator` subagent (`ai-art-production` / `ARGON_NATIVE_ASSET_PROFILE.md`) with exact Core Kit reference images attached. Never call `route_media.py`, external paid APIs/CLIs, `codeart2d`, or procedural `ImageDraw`.
3. For animation, build multi-pose directional sheets anchored to the resolved Core Kit master reference; normalize exact profile dimensions from `assets/corekit/v01b/profiles/animation.json` (`full_80x96_20row_8walk` `640x1920` for 8-walk-frame Hero sheets, `full_80x96_20row` `480x1920`, `locomotion_80x96_8row` `480x768`, `stationary_npc_80x96_4f` `320x96` at foot anchor `(0.5, 0.9167)` / `(40, 88)`, plus preserved `legacy_48x64_16row` `288x1024` at `(0.5, 0.90)`).
4. Preview static contact sheet AND in-engine animation at final play zoom (`1280x720` desktop and `390x844` mobile), verifying recognizability, silhouette, animation continuity, and technical validity.
5. Maintain strict separation between asset `role` (`master_reference`, `production_candidate`, `runtime`, `legacy_required`, `archive_only`) and `creativeApprovalState` (`PROPOSED`, `TECHNICALLY_VERIFIED`, `HUMAN_APPROVED`, `REJECTED`, `PLACEHOLDER`). Automated validator pass (`TECHNICALLY_VERIFIED`) never substitutes for `HUMAN_APPROVED` sign-off by the project owner.

## Lore & Owner-Approved Identity Differentiation (`DEC-008`, `DEC-009`)

- **`hero_kiem_tu` (`Thanh Vân Đạo Đồ`)**: Owner-approved Desktop `HERO-ANIMSET-01` master (`ref.character.hero_kiem_tu@2.0.0-hero-animset-01`, `DEC-009`) — warm dark-brown hair in a clean high ponytail with a simple teal-jade tie (no jade crown, no long twin ribbons), crisp white inner sleeves under a sleeveless teal-jade outer vest with burnished gold trim, dark slate-navy belt, and sword scabbard at hip (`source_h04`..`source_h10` lineage; supersedes the old kit Hero and `source_h01`/`source_h02`). The current workspace preserves the 6-walk-frame `480x1920` artifact (`ecf6604b...` / `1de6fc60...`) while the later owner-confirmed 8-walk-frame Hero input is tracked as `MISSING_APPROVED_HERO_INPUT` (`full_80x96_20row_8walk`).
- **`phi_de` (`Phì Đế`)**: Owner-corrected chubby/round-bellied saintly mascot cultivator wearing a fluffy cream-ivory bear-head hood (`Mũ Gấu Tiên Thánh`) with round bear ears, rectangular glasses, white-jade/celadon luxury saint robes with imperial-gold trim, holding a golden boiled chicken drumstick (`Đùi Gà Luộc`, `ref.character.phi_de@1.1.0`, `DEC-008` — never the rejected black-and-gold emperor crown/beard design or a tea cup).
- **`rmt_de` (`RMT Đế`)**: Owner-corrected crimson-red and imperial-gold `Thần Tài` wealth-god sovereign wearing a winged official hat (`Mão Thần Tài Cánh Chuồn`), holding a boat-shaped gold sycee ingot (`Kim Nguyên Bảo`) and golden abacus (`Bàn Tính Hoàng Kim`, `ref.character.rmt_de@1.1.0`, `DEC-008`).
- **Other Canonical Figures**: `chatdvt` is a jade-cyan quadruped spirit **beast** (`Linh Thú Thanh Ngọc`, never human); `dam_lon_tien_tu` is an independently powerful lotus/heart immortal (`UNKNOWN` realm); `ngoc_tam` (`npc_ngoc_tam`) is karmic misfortune (`Xui Xẻo Chân Quân`) distinct from Starter #3 `ngoc_tam` (`Thanh Ngọc Linh Tu`); `thai_tai` is the white-bearded artifact appraiser (`Thiên Nhãn Giám Bảo`); `anh_7` is the seven-sword ranger; `gia_bao` is the pale celestial immortal; `hoa_tran` is the sage-green wanderer; `vaal_de` is the purple/crimson fate calamity sovereign. Never reuse the same face/body model and only recolor clothes.

## Rules

Use nearest-neighbor rendering (`pixelArt: true`) and consistent pixels-per-world-unit. Never execute disabled procedural entrypoints (`packages/art-tools/build_assets.py` or `npm run generate:art*`), never use `OLD (REJECTED)` comparison panes or `archive_pre_correction` files as masters, and never fake animation frames via affine warps of a single static still.
