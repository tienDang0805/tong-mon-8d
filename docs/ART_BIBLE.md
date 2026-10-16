# Art Bible — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Capability Proof Record
- **Provider / Tool**: Built-in Antigravity `image-generator` subagent (`TypeName: "image-generator"`) paired with local Python `3.14.4` + `Pillow 12.1.1` deterministic pixel-art normalization and sprite/tileset compilation (`packages/art-tools`).
- **External Paid API Status**: `https://api.pixellab.ai/v2/docs` was inspected; no `PIXELLAB_API_KEY` is present in the environment, and per autonomous rules no paid external API calls were made.
- **First Capability Proof Output**: `assets/concepts/capability_proof_phi_de.jpg` (generated in ~38s, depicting Phì Đế in black-and-gold dragon robes with floating bronze cauldron and golden dragon flame on `#FF00FF` chroma-key background).
- **Limitations & Pipeline Mitigation**: `image-generator` outputs high-resolution JPEG files with minor chroma-key edge compression. Our `packages/art-tools` pipeline deterministically strips `#FF00FF` backgrounds with HSV/RGB de-fringing, quantizes to crisp nearest-neighbor pixel clusters (`160x160` portraits), and compiles locked-anchor `48x64` 4-directional animation strips and `32x32` seamless tilesets with zero frame drift.

## 2. Autonomous Art Direction Lock (3 Candidates Critiqued)

| Candidate | File | Visual Direction | Critique vs Canon & Viewport | Decision |
|---|---|---|---|---|
| **Candidate A** | `assets/concepts/candidate_a_classic_xianxia.jpg` | **Classic Crisp 16/32-bit Xianxia Top-Down RPG**: Warm stone pathways, dark-slate curved roofs, emerald bamboo, warm lantern glow, 3-value shading, dark outlines, readable chibi-heroic proportions. | **4.8/5**: Strongest value separation between walkable ground (mid-warm stone/grass), collidable architecture/trees (deep slate/emerald), and characters/VFX (high-saturation azure, imperial black-gold, jade-cyan). Supports both warm culinary village (`Tân Thủ Thôn`) and misty bamboo forest (`Thanh Trúc Lâm`). | **APPROVED & LOCKED** |
| **Candidate B** | `assets/concepts/candidate_b_dark_inkwash.jpg` | **Dark Ink-Wash Mythic Xianxia**: Monochrome grey/black ink with stark crimson accents. | **3.1/5**: Atmospheric for a late-game demonic dungeon (`Huyết Ma Động`), but fails readability for an inviting starter village and flattens Phì Đế's golden culinary motifs and ChatDVT's jade-cyan identity. | **REJECTED** (retained as evidence) |
| **Candidate C** | `assets/concepts/candidate_c_pastel_chibi.jpg` | **Pastel Super-Deformed Chibi**: Ultra-bright candy pastel palette, soft low-contrast outlines, isometric toy-like proportions. | **2.8/5**: Lacks value contrast against gameplay VFX; undermines the majestic Saint Emperor presence of Tam Đế (`Phì Đế`, `RMT Đế`, `Vaal Đế`). | **REJECTED** (retained as evidence) |

## 3. Locked Technical & Visual Specifications
- **Logical World Grid**: `32x32` pixels per tile (`maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`).
- **Overworld Character Frame**: `48x64` pixels per frame (`32px–40px` character height inside frame to allow weapon/aura/headgear headroom).
- **Shared Character Anchor**: Bottom-center feet anchor `(0.5, 0.90)` (`x = 24, y = 58` in `48x64` frame) with grounded elliptical contact shadow.
- **Physics Collider Box**: `20x14` pixels centered at feet `(offsetX = 14, offsetY = 46)` so characters walk naturally behind roof eaves and bamboo canopies (`AbovePlayer` depth layer) without snagging on transparent sprite padding.
- **Portraits**: `160x160` RGBA PNG with transparent background, crisp nearest-neighbor pixel clusters, and 3-value lighting from top-left (`45°`).
- **Renderer Settings**: Phaser `4.2.1` with `pixelArt: true`, `antialias: false`, `roundPixels: true`, and `Phaser.Scale.RESIZE` viewport with integer-friendly camera zoom (`1.5x–2.0x` desktop, `1.25x` mobile).

## 4. Core World Palette
- **Tân Thủ Thôn (Warm Hearth & Jade Sanctuary)**:
  - Stone Path Ramp: `#a89f91` (light), `#8c8273` (base), `#6b6255` (shadow)
  - Village Grass Ramp: `#5c9e57` (light), `#468242` (base), `#31612e` (shadow)
  - Temple Slate Roof Ramp: `#4a5d73` (light), `#324254` (base), `#1f2b38` (shadow)
  - Culinary Gold / Lantern Glow: `#ffd86b` (core), `#f29f38` (warm mid), `#b85d19` (deep ember)
- **Thanh Trúc Lâm (Misty Emerald Spirit Grove)**:
  - Bamboo Foliage Ramp: `#4ec978` (canopy highlight), `#2da35c` (mid), `#196e3b` (deep shade)
  - Forest Moss Ground: `#3a7554` (light), `#2a593f` (base), `#1c3d2b` (shadow)
  - Spirit Stream Water: `#5ce1e6` (foam), `#2da8b8` (base), `#1b6d7d` (deep)
  - Spatial Portal Jade/Gold: `#63ffda` (jade arc), `#ffd166` (runic ring), `#112a36` (void core)
