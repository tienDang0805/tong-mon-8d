# TD-05 · AI Asset Production Pipeline — Genuine Art to Phaser-Ready Assets

> v0.7 · OWNER_REVIEW_REQUIRED. Extends, never replaces, `AGENTS.md`, `RULES.md`, `docs/ART_BIBLE.md`, `docs/CHARACTER_VISUAL_BIBLE.md` and `.agents/skills/ai-art-production/SKILL.md`. Design-only: no generation or code execution authorized by this specification alone.

## 1. Separate artwork quality from technical validity

Existing Phase 0 sprites prove a route: real Antigravity image generation → source preservation → slicing into Phaser sheets → deterministic processing and integrity checks. They **do not** prove stable costume anatomy across frames or good in-game style. Automated dimensions/alpha/sheet checks grant `TECHNICALLY_VERIFIED` only. Actual world-zoom human inspection is required to grant `HUMAN_APPROVED`. Candidate A classic 16/32-bit Xianxia remains a **reference**, not an approved final style.

All new *final* art must originate in genuine generative image model output or approved AI-generated originals. **No Python/Pillow/SVG/Canvas/codeart2d code-painted production art, including generated algorithmic terrain or vector shapes** without separate explicit owner authorization. Code may crop, quantize, remove backing, align, package, author placement and render a scene made from approved image sources. If an authorized image-generation route is unavailable, stop and report. External paid APIs require separate user authorization; never silently spend.

## 2. Ordered, auditable production job

1. **Resolve source of truth:** read `AGENTS.md`, `DECISIONS.md`, TD-01→TD-04 contracts, accepted lore and visual bibles; classify requested object and release intent.
2. **Prepare content brief:** stable `contentId`, subject, location, plot spoiler class, interactable type, rarity, gameplay action, `visualProfileId`; list all required `assetRole`s. Identify a screenshot sequence that will prove this object actually exists in the playfield.
3. **Approve direction first:** create/reuse a human-approved character/biome master reference or get explicit art-direction approval. For iconic figures and high-cost batch art, do a **single** reference before a batch.
4. **Choose production route:** verify native `image-generator` capability in current environment; use image edit/character reference only when actually available. Check skills' helper scripts from repository at execution time rather than assuming filename.
5. **Generate actual originals:** one coherent subject/prop/tileset or controlled poses with fixed camera angle, silhouette, perspective, light direction and background key. No generic stock images, clipart or random duplicated props.
6. **Log provider metadata and source:** preserve untouched source files and checksums under `assets/source_ai/` or `assets/concepts/`. Note creator agent, input art brief, generation route, approval ref, tool/model metadata if available and usage rights constraints; never fabricate seed or determinism.
7. **Visual source QA:** inspect outlines, pose consistency, intended directional rear/side views, silhouettes at target zoom, costume continuity, scene readability, independent identity for all ten NPCs; reject malformed generations before wasting time slicing.
8. **Process only:** chroma-key cleanup, alpha threshold, palette ramp alignment, outline cleanup, frame segmentation, registration, idle/walk/attack/cast/hurt mapping, atlas/tileset packaging; no procedural creation of missing original poses.
9. **Assemble semantic outputs:** `assets/sprites/`, `assets/portraits/`, `assets/tilesets/`, `assets/props/`, `assets/vfx/`, `assets/icons/` (proposed directory if needed), `assets/atlases/`, and previews. Maintain consistent, versioned `assetId` across outputs. Do not overwrite raw source or legacy backup.
10. **Integrate rendering:** declare actual Phaser asset key, frame metadata, origin/collider and animation states; attach Tiled map/GID or world binding to content ID. Verify world scale and occlusion; avoid actor floating, tile seams and wrong roof layering.
11. **Automated technical QA:** asset manifest, dimensions, valid frame indices, alpha/solid backing, provenance hashes, missing texture detection, collision and map validator, animation loop sanity, pixel-art renderer settings, performance and build.
12. **Playtest with real game:** desktop 1280×720 and mobile 390×844 captures, camera zoom representative, interaction screenshots, GIF/short sequence with at least idle, traversal and key ability where applicable; screenshot must be actual running scene, not mock generated marketing art.
13. **Owner visual review:** present source, contact sheet, animation, world crop and before/after. Record granular `HUMAN_APPROVED`/`REJECTED` state for asset **and scene binding**. No autonomous upgrade to approved.
14. **Release/handoff:** content pack can become RELEASED only after mechanics, UX, render, narrative and approval gates pass; update status, asset registry, source hash, pack/version dependency and evidence URLs. Await owner commit/push policy.

## 3. Object family templates

### Actors (human and creatures)

- Canonical runtime proof: **80×96 pixels/frame**, **480×1920** sheet (six columns, 20 rows = four directions × five states), foot origin `(0.5, 0.9167)` ~ `(40,88)`, `scale=0.82` as existing integration; these are existing compatibility constraints, **not proof every actor must share identical anatomy or size**.
- Legacy coexistence: `48×64` frames in `288×1024`, origin `(0.5,0.90)` and scale 1.0. Keep clearly tagged PLACEHOLDER until replaced.
- Creature size/hitbox may need separately approved frame geometry; never stretch ChatDVT into a humanoid frame just to satisfy a shared template.
- Pose assembly must preserve distinctive clothes/headwear/handedness/weapon across 4 directions. Automatic mirroring is not sufficient for asymmetric Legendary costume or creature anatomy.
- For 4-direction 5-state template: idle 4f, walk 6f, attack 4f, cast 4f, hurt 4f. **Death** may use dedicated animation or approved alternate state; do not fake a humanoid hurt frame as quadruped death.
- Need unique master sheets for `thai_tai` and `gia_bao`; no final alias sprites. Initial three upgraded sources `hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu` remain TECHNICALLY_VERIFIED pending owner review.

### Tilesets and environments

- Grid **32×32 world tiles**, generated from designed cohesive biome materials, edge/corner/transition coverage, building roof/wall set, bamboo/tree/stone/water and props, then *assembled* into Tiled-compatible tile sheets. Scripts may place existing generated tiles but not paint texture originals.
- Author compact biome sample **before scaling**: village street + inn/shop entrance + bamboo edge, test repeated tiling and true spatial depth. Avoid monochrome filler or repeating identical stamp art across entire map.
- Visual material tiling and image seams are human-visible checks; technical tile dimensions alone cannot validate coherence.

### Objects, inventory and skill VFX

- Icons must encode unique identity, quality and type; no iconless item rows. For an item used in world (ground drop, equip weapon, consumable, NPC display), render representation in **all relevant contexts**, not merely an inventory thumbnail.
- Skills require source-generated icon + motion/impact/telegraph sources. Script-scheduled particles are allowed when derived from approved generative source sprites/VFX, not as newly code-painted final artwork.
- A crafting station needs a physically placed prop (cauldron, forge, apothecary) and source-based visual feedback. Dialogue alone cannot represent cooking a dish or crafting an item.

## 4. Animation consistency fallback policy

When static `4×4` grids drift in costume/head angle, **do not claim PASS merely because slices have correct size**. Recommended decision ladder: (a) generate one owner-approved hero master still, (b) lock pose reference and generate *smaller pose families*, (c) hand-audit connected anatomy and contact sheet, (d) optionally evaluate an owner-approved image-to-video route when legally/technically available, (e) limit the release scope until stable frames exist. No magic model claim and no procedural sprite substitute.

## 5. Provenance and safe regeneration

A provenance manifest records source image relative paths and SHA-256, transformation script/tool version, output SHA-256, asset `renderProfile`, generation/technical/approval states and exact code/Tiled references. Update or extend `assets/provenance.json` and `assets/manifest.json` without replacing their historic meaning. Store visual `HUMAN_APPROVED` in separate explicit governance field/ledger; the older `status: "approved"` technical flag **does not mean human creative sign-off**. Legacy originals and `.agents/skills` remain preserved. `npm run generate:art` should never destroy hand-reviewed work; forced regeneration remains owner-authorized only.
