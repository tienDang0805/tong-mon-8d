# AGENTS.md — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Documentation & Source-of-Truth Hierarchy

When resolving conflicts between documents, prompts, or historical reports, agents MUST follow this strict priority order (highest to lowest):

1. **Project Rules & Safety Boundaries**: `AGENTS.md` and `RULES.md` (including the AI Art Production Policy, zero-comment rule, and safety gates).
2. **Current Phase & Verified Implementation Status**: `docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, `docs/WORKSPACE_HANDOFF.md`, and `docs/NEXT_ACTIONS.md`.
3. **Human-Approved Creative & Gameplay Decisions**: Explicit human project-owner approvals recorded in the **Human Creative Decisions Ledger** (Section 5 below) and inside Phase 1 design specs.
4. **Canonical Lore & Character Identities**: `packages/game-data/src/index.ts`, `packages/shared/src/index.ts`, and canonical sections (Sections 5–7) of `MASTER_PROMPT.md`.
5. **Game, Narrative, World, UX & Art Design Specifications**: Phase 1 specification documents (`docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/ART_BIBLE.md`, `docs/UX_DESIGN.md`, `docs/CHARACTER_VISUAL_BIBLE.md`).
6. **Domain-Specific Agent Skills**: `.agents/skills/*/SKILL.md` (starting with `.agents/skills/ai-art-production/SKILL.md`, `pixel-art-director`, `world-and-map-qa`, `mmorpg-server-integrity`, `cultivation-balance`).
7. **Archived Master Prompts & Historical Implementation Reports**: Bootstrap instructions in `MASTER_PROMPT.md` (Sections 0, 14, 16), `START_HERE.md`, and historical completion tables in `docs/IMPLEMENTATION_STATUS.md`.

**Critical Distinction**:
- Always distinguish **design intent** from **actual implementation status**.
- Never treat a historical milestone completion report (`docs/IMPLEMENTATION_STATUS.md`) or an automated validator pass (`npm run verify:assets`, `quality_audit.py`) as proof of human-approved gameplay or visual quality.

---

## 2. Project Boundaries & Monorepo Architecture

- `packages/shared/`: Shared TypeScript protocol contracts, message payloads, and deterministic constants.
- `packages/game-data/`: Canonical source of truth for the 17 cultivation realms (`Phàm Nhân` + 17 realms), 10 legendary NPCs, zones, portals, enemies, items, culinary recipes, quests, and balance simulation models.
- `packages/art-tools/`: Deterministic pixel-art post-processing (`build_assets.py`) and `assets/manifest.json` + `assets/provenance.json` integrity verifier (`verify_manifest.ts`).
- `apps/server/`: Authoritative Node.js + Colyseus (`0.18.x`) multiplayer server (`src/index.ts`, `src/zoneRoom.ts`, `src/worldEngine.ts`) with embedded/external PostgreSQL (`@electric-sql/pglite` / `pg` in `src/db.ts`) persistence, spatial collision validation, monster AI simulation, combat, culinary/shop, quest, party, and offline cultivation services.
- `apps/client/`: Phaser `4.2.1` + TypeScript + Vite browser client (`src/main.ts`, `src/WorldScene.ts`, `src/ui.ts`, `src/network.ts`, `src/audio.ts`) with Tiled JSON map rendering, Y-sorted depth occlusion, dual-resolution 4-directional sprite animations (`80x96` multi-pose in `480x1920` sheets + preserved legacy `48x64` in `288x1024` sheets), client interpolation, synthesized WebAudio sound effects, and compact xianxia HUD.
- `assets/` & `maps/`: Source AI grids (`assets/source_ai/`), concept sheets (`assets/concepts/`), runtime sprites/portraits/props/tilesets/VFX, `manifest.json`, `provenance.json`, and Tiled JSON maps (`maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`).

---

## 3. Canonical Constraints

- Preserve all 17 cultivation realms in exact order (`Phàm Nhân` plus 17 realms from `Luyện Khí` to `Thánh Cảnh`).
- Preserve all 10 legendary figures (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`).
- `dam_lon_tien_tu` realm MUST remain `"UNKNOWN"` (`Bất Minh`).
- `chatdvt` MUST be depicted and animated as a jade-cyan quadruped spirit beast (`Linh Thú Thanh Ngọc`), never a generic human mage.
- Phì Đế's culinary path (`Ẩm Thực Đại Đạo`) allows BOTH purchasing and self-cooking qualifying spiritual dishes.
- Zero comments (`//`, `/* */`, `#`, `<!-- -->`) in any source code file or markdown code block, per `RULES.md`.

---

## 4. Non-Negotiable AI Art Production Policy

1. **Genuine Generative Origin Required**:
   ALL NEW FINAL VISUAL ARTWORK must originate from genuine generative image model output or from approved AI-generated source artwork. This includes:
   - Character sprites
   - NPCs and monsters
   - Buildings and architecture
   - Terrain and ground textures
   - Environmental props
   - Trees and bamboo
   - Item and skill illustrations
   - UI decorative artwork
   - VFX source images
   - Backgrounds
2. **Prohibition on Procedural / Code-Drawn Production Art**:
   - Python, Pillow, Node.js, SVG, or Canvas drawing scripts may **NOT** replace genuine generated artwork with geometric or procedural production art.
   - The installed `codeart2d` skill must **NOT** be used to generate final production artwork without explicit project-owner authorization.
   - There is **NO automatic fallback** to procedural art when image generation is unavailable.
3. **Permitted Script Usage (Post-Processing & Packaging Only)**:
   Scripts (`packages/art-tools/build_assets.py`, Agent Sprite Forge, `pixel-art/scripts/*`) remain permitted strictly for:
   - Post-processing and scaling
   - Chroma-key / transparency cleanup
   - Palette quantization and corrections
   - Frame alignment, slicing, and extraction
   - Animation atlas packing and GIF preview generation
   - Tileset assembly from generated tile/prop sources
   - Tiled map placement and collision layer authoring
   - Asset manifest/provenance validation (`verify_manifest.ts`)
   - Technical gameplay rendering
4. **Placeholder & Legacy Asset Preservation**:
   - Preserve existing placeholders and legacy `48x64` assets until `HUMAN_APPROVED` generative replacements have been produced and approved.
   - Never run destructive asset regeneration (`npm run generate:art:force`) or paid external image/video APIs without explicit project-owner authorization.

---

## 5. Creative Approval States & Human Decisions Ledger

All visual directions and individual assets must be tracked using five distinct lifecycle states:
- `PROPOSED`: Generated or designed, awaiting human review.
- `TECHNICALLY_VERIFIED`: Passes automated dimensions, transparency, frame count, and SHA-256 checks (`verify_manifest.ts` / `quality_audit.py`), but has **not** received human creative approval.
- `HUMAN_APPROVED`: Explicitly reviewed and approved by the human project owner at actual gameplay zoom.
- `REJECTED`: Rejected for style, readability, or lore reasons.
- `PLACEHOLDER`: Temporary/legacy asset retained solely to keep the build playable until a `HUMAN_APPROVED` asset replaces it.

**Mechanism for Recording Human-Approved Creative Decisions**:
- Never promote `TECHNICALLY_VERIFIED` (`status: "approved"` in `manifest.json` or `status: "pass"` in `provenance.json`) to `HUMAN_APPROVED` autonomously.
- An asset or design direction enters `HUMAN_APPROVED` **only** when the project owner explicitly approves it in conversation and an entry is recorded in the ledger table below (and mirrored in `docs/ART_BIBLE.md`):

| Decision ID | Date | Scope / Asset / Doc | State | Approved By | Notes |
|---|---|---|---|---|---|
| `DEC-001` | 2026-10-16 | Canonical 17 Realms & 10 Legends Lore Baseline | `HUMAN_APPROVED` | Project Owner | Locked via `MASTER_PROMPT.md` & Phase 1A instructions |
| `DEC-002` | 2026-10-16 | Candidate A Visual Direction (`candidate_a_classic_xianxia.jpg`) | `PROPOSED` / `TECHNICALLY_VERIFIED` | Pending Human Owner | Previously locked by agent; reset to reference direction pending renewed human approval |
| `DEC-003` | 2026-10-16 | Phase 0 Multi-Pose PoC Sprites (`hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu`, `combat_vfx`) | `TECHNICALLY_VERIFIED` | Pending Human Owner | `480x1920` (`80x96` frames) verified in engine; awaiting Phase 1–2 human visual sign-off |

---

## 6. Safe Tool Usage, Quality Gates & How to Resume

- **Current Active Priority**: **Phase 1 — Unified Game Vision, Game Lore, Game Design, Narrative Design, World Design, Art Bible, UX Design, and AI Asset Production Policy** (see `docs/CONTEXT_AUDIT.md` and `docs/NEXT_ACTIONS.md`). Do NOT jump ahead to Zone 3 or new feature implementation before Phase 1 approval.
- **How to Resume**:
  1. Read `AGENTS.md`, `RULES.md`, `docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, and `docs/NEXT_ACTIONS.md`.
  2. Run `npm run verify:assets && npm test && npm run typecheck && npm run build` to verify workspace health.
  3. Start server + client with `npm run dev` (see `docs/DEVELOPMENT_SETUP.md` for Windows/macOS notes).
