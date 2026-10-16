---
name: pixel-art-director
description: Direct coherent, lore-faithful pixel art for Tông Môn 8D characters, sprites, animated strips, tilesets and VFX. Use before producing or approving any production art, especially the ten legendary cultivator portraits.
---

# Pixel Art Director

## Production brief

Read `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md` (and `docs/CHARACTERS.md` if later split out in Phase 1, alongside canonical definitions in `packages/game-data/src/index.ts`), and `.agents/skills/ai-art-production/SKILL.md`. Create production assets only after locking tile grid, gameplay zoom, shading direction, palettes, and sprite anchors. Distinguish portrait presentation from overworld silhouette while preserving unique costume/face motifs.

## Workflow

1. Define each character's hair/face, clothing outline, palette, iconic prop, and story power based on `docs/CHARACTER_VISUAL_BIBLE.md` and `packages/game-data/src/index.ts`.
2. Prepare candidate concepts via genuine generative AI image output (`ai-art-production` / `generate2dmedia`). Ask the human project owner to approve art direction before producing a whole set.
3. Acquire verified-license packs, or generate actual PNG frames with an authorized generative image tool. Never claim that code or procedural scripts alone have generated studio-quality artwork.
4. For animation, build a complete multi-pose strip or video-derived clip anchored to an approved seed reference; avoid independent frame drift; normalize exact frame dimensions (`80x96` frames in `480x1920` sheets at anchor `(0.5, 0.9167)` for upgraded multi-pose sprites; `48x64` frames in `288x1024` sheets at anchor `(0.5, 0.90)` for preserved legacy sprites), alpha, direction, and timing.
5. Preview static contact sheet AND in-engine animation at final play zoom, score 1–5 on recognizability, consistency, silhouette, animation, and technical validity.
6. Maintain strict creative lifecycle states in documentation and provenance: `PROPOSED`, `TECHNICALLY_VERIFIED`, `HUMAN_APPROVED`, `REJECTED`, and `PLACEHOLDER`. Automated validator pass (`TECHNICALLY_VERIFIED`) never substitutes for `HUMAN_APPROVED` sign-off by the project owner.

## Lore differentiation

Phì Đế is a black/gold culinary Saint Emperor with divine cauldron (not generic chef). RMT Đế gold/obsidian wealth sovereign. Vaal Đế purple/crimson fate calamity. ChatDVT is jade cyan spirit **beast**, not human. Dẩm Lồn Tiên Tử independently powerful lotus/heart specialist (`UNKNOWN` realm). Ngọc Tâm is karmic misfortune, Thái Tài artifact appraisal, Anh 7 seven sword master, Gia Bảo pale celestial immortal, Hòa Trần understated sage wanderer. Never reuse same face model and only recolor clothes.

## Rules

Use nearest-neighbor rendering and consistent pixels-per-world-unit. Do not invent unavailable image APIs, download unlicensed commercial sprites, run unreviewed third-party scripts, substitute procedural/geometric Python/Canvas drawing for final production art, or mark static stickers as character animation.
