# AGENTS.md — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Documentation & Source-of-Truth Hierarchy

When resolving conflicts between documents, prompts, or historical reports, agents MUST follow this strict priority order (highest to lowest):

1. **Project Rules & Safety Boundaries**: `AGENTS.md` and `RULES.md` (including the AI Art Production Policy, zero-comment rule, and safety gates).
2. **Current Phase, Context Index & Verified Implementation Status**: `docs/CONTEXT_INDEX.md`, `docs/ROADMAP.md`, `docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, `docs/WORKSPACE_HANDOFF.md`, and `docs/NEXT_ACTIONS.md`.
3. **Human-Approved Creative & Gameplay Decisions**: `docs/DECISIONS.md` (authoritative register of `GD-001` through `GD-046`, strictly preserving the distinctions between `APPROVED`, `DESIGN_BASELINE`, `PROPOSED`, `UNRESOLVED`, and `LEGACY`) and the **Human Creative Decisions Ledger** (Section 5 below).
4. **Canonical Lore & Character Identities**: `docs/GAME_LORE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `packages/game-data/src/index.ts`, `packages/shared/src/index.ts`, and canonical identity sections (Sections 5–7) of `MASTER_PROMPT.md` *(note: legacy 3-class, action-combat, and open-apprenticeship mechanics in `MASTER_PROMPT.md` are `LEGACY` where superseded by `docs/DECISIONS.md`)*.
5. **Phase 1B.0 Game, Narrative, World, UX, Art & Content Pipeline Specifications (Baseline v0.2)**: `docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/CONTENT_PIPELINE.md`, `docs/ART_BIBLE.md`, and `docs/CHARACTER_VISUAL_BIBLE.md`.
6. **Domain-Specific Agent Skills**: `.agents/skills/*/SKILL.md` (starting with `.agents/skills/ai-art-production/SKILL.md`, `pixel-art-director`, `world-and-map-qa`, `mmorpg-server-integrity`, `cultivation-balance`).
7. **Archived Master Prompts & Historical Implementation Reports**: Bootstrap instructions and superseded v0.1 mechanics in `MASTER_PROMPT.md` (Sections 0, 8–16), `START_HERE.md`, and historical completion tables in `docs/IMPLEMENTATION_STATUS.md`.

**Critical Distinction**:
- Always distinguish **design intent** (`docs/DECISIONS.md` and Phase 1B.0 Baseline v0.2 docs) from **actual implementation status** (current v0.1 prototype code in `apps/` and `packages/`).
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

- Preserve all 17 cultivation realms in exact order (`Phàm Nhân` plus 17 realms from `Luyện Khí` to `Thánh Cảnh`; per `GD-044`, `Thánh Cảnh` is the last playable major realm, while `Đại Thánh` and `Cổ Thần` exist as lore only).
- Preserve all 10 legendary figures (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`).
- `dam_lon_tien_tu` realm MUST remain `"UNKNOWN"` (`Bất Minh`).
- `chatdvt` MUST be depicted and animated as a jade-cyan quadruped spirit beast (`Linh Thú Thanh Ngọc`), never a generic human mage.
- Phì Đế's culinary path (`Ẩm Thực Đại Đạo`, `GD-016`, `GD-045`) allows BOTH purchasing and self-cooking qualifying spiritual dishes. His exclusive True Disciple signature destiny is **Vạn Vị Đạo Thai** (`GD-016`); a food-related special trigger is required (`GD-015`, `GD-045`), but the exact dish count/threshold is `UNRESOLVED` pending the **Food Catalog** (neither `"eat 80 dishes"` nor `"unlock the entire Food Catalog"` is approved).
- **Approved Baseline v0.2 Gameplay & Narrative Rules (`docs/DECISIONS.md`)**:
  - **Online-Only Auto Farm & Capped Offline Meditation (`GD-002`, `GD-005`)**: Auto combat / farming operates **strictly while the player is online and connected** to the authoritative server; disconnecting stops combat simulation (no offline monster kills or offline combat loot/EXP; offline progression is separate capped `Bế Quan` meditation for `Tu Vi`, currently `<= 8` hours).
  - **Manual Quest Execution & Auto-Navigation Only (`GD-003`, `GD-004`)**: Quest journal (`Q`) and compact tracker support **Auto-Navigation** to known objective coordinates, where the character stops for manual player interaction. **NO Auto-Quest execution** (no auto-talking, auto-accepting, auto-completing, auto-selecting story choices, or auto-solving point-and-click puzzles).
  - **Character Level (`1–350+`), 6 Base Stats & Realm Separation (`GD-020`–`GD-023`, `GD-028`)**: `Phàm Nhân` spans Levels `1–10` and each of the 17 major realms adds 20 Character Levels (`Lv 11–350`, with `Thánh Cảnh` continuing at `Lv 351+` under `GD-020`, `GD-044`). Each level awards `+1` free point (`GD-021`) across the 6 baseline stats (`GD-028`, `DESIGN_BASELINE`: **Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính**). Breaking through from `Phàm Nhân` Lv 10 to `Luyện Khí` requires the Main Quest encounter with a masked/unknown immortal, a starter `công pháp`, and a breakthrough pill (`GD-023`; the immortal's identity is **OPEN/unconfirmed** and must not be labeled Phì Đế).
  - **6 Independent Dao Mastery Paths (`GD-024`–`GD-027`) & Technique Tiers (`GD-030`–`GD-032`)**: Exactly six independent mastery paths: **Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu** (10 `Đạo Cảnh` each, progressing independently of major cultivation realm; stages 3→4, 6→7, and 9→10 require path-specific combat or point-and-click `Bí Cảnh` trials per `GD-025`; stage labels `Sơ Thức`..`Chứng Đạo` remain `PROPOSED`). Both `Công pháp` (`GD-030`) and `Võ kỹ` (`GD-031`) use **six rarity tiers** (`GD-032`: **Phàm, Linh, Hoàng, Địa, Thiên, Thần**). Supersedes the legacy 3-class lock.
  - **Destinies (`GD-010`–`GD-018`) & Exclusive True Disciple Sequence (`GD-006`, `GD-014`–`GD-016`, `GD-040`–`GD-041`)**: Character creation rolls 3 immutable `Tiên Thiên Nghịch Thiên Cải Mệnh` at once (unlimited full-trio rerolls, no slot locking, `GD-010`–`GD-011`) plus exactly 3 active `Hậu Thiên` slots from an unlimited acquired collection (`GD-013`). Destiny traits use **four rarity tiers** (`GD-012`: **Phàm, Hoàng, Tiên, Thần**). A character may own **at most ONE** of the 10 Legendary-specific `Thần Phẩm` signature destinies across **all innate (`Tiên Thiên`) and acquired (`Hậu Thiên`) traits** (`GD-014`, `GD-018`). The **Main Quest** is playable by all characters without any signature or True Disciple status (`GD-006`, `GD-040`), whereas each Legendary NPC's optional 6-chapter **True Disciple (`Chân Truyền`)** route follows the strict sequence (`GD-015`): **matching signature ownership → NPC affinity → special trigger condition → exclusive questline → completing all 6 chapters → True Disciple** (with no unconditional realm prerequisite).
  - **Proposed Narrative Scaffolding Protection (`GD-042`, `GD-046`)**: While the Main Quest premise, all 10 Legends' appearances, the cross-dimensional invasion finale, and the late-game reveal that Phì Đế is an incarnation of **Ăn Uống Thiên Tôn** (`GD-043`) are `APPROVED`, the era title (`Thiên Kiêu Kỷ Nguyên`), invading plane (`Hư Tịch Giới`), antagonist (`Tịch Diệt Thánh Quân — Dạ Vô Uyên`), the **seven macro story arcs** (`I. Phàm Nhân Vấn Đạo` .. `VII. Thánh Nhân Chi Chiến`), and Dao stage 1–10 titles remain `PROPOSED` until explicitly approved by the project owner.
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
- An asset or design direction enters `HUMAN_APPROVED` **only** when the project owner explicitly approves it in conversation and an entry is recorded in the ledger table below (and mirrored in `docs/ART_BIBLE.md` / `docs/DECISIONS.md`):

| Decision ID | Date | Scope / Asset / Doc | State | Approved By | Notes |
|---|---|---|---|---|---|
| `DEC-001` | 2026-10-16 | Canonical 17 Realms & 10 Legends Lore Baseline | `HUMAN_APPROVED` | Project Owner | Locked via `MASTER_PROMPT.md` & Phase 1A instructions |
| `DEC-002` | 2026-10-16 | Candidate A Visual Direction (`candidate_a_classic_xianxia.jpg`) | `PROPOSED` / `TECHNICALLY_VERIFIED` | Pending Human Owner | Previously locked by agent; reset to reference direction pending renewed human approval |
| `DEC-003` | 2026-10-16 | Phase 0 Multi-Pose PoC Sprites (`hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu`, `combat_vfx`) | `TECHNICALLY_VERIFIED` | Pending Human Owner | `480x1920` (`80x96` frames) verified in engine; awaiting Phase 1–2 human visual sign-off |
| `DEC-004` | 2026-10-16 | Game Design Baseline v0.2 (`docs/DECISIONS.md` & 10 Phase 1B.0 docs) | `HUMAN_APPROVED` / `DESIGN_BASELINE` / `PROPOSED` (per `DECISIONS.md`) | Project Owner | `GD-001`–`GD-006`, `GD-010`–`GD-016`, `GD-020`–`GD-027`, `GD-030`–`GD-036`, `GD-040`–`GD-045` are `APPROVED`; `GD-017`, `GD-018`, `GD-028`, `GD-037` are `DESIGN_BASELINE`; `GD-046` (era/plane/villain names & 7 macro arcs) and Dao stage 1–10 names remain `PROPOSED` |

---

## 6. Safe Tool Usage, Quality Gates & How to Resume

- **Current Active Priority**: **Phase 1B.0 — Game Design Baseline v0.2 Documentation Integration & Context Reconciliation** (completed in `docs/`, awaiting human owner review before starting gated **Technical Design `TD-01`..`TD-05`** per `docs/ROADMAP.md` and `docs/NEXT_ACTIONS.md`). Do NOT implement new gameplay systems, modify `apps/` or `packages/`, or jump ahead to `TD-01` before explicit owner approval.
- **How to Resume**:
  1. Read `AGENTS.md`, `RULES.md`, `docs/CONTEXT_INDEX.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, and `docs/NEXT_ACTIONS.md`.
  2. Run `npm run verify:assets && npm test && npm run typecheck && npm run build` to verify workspace health.
  3. Start server + client with `npm run dev` (see `docs/DEVELOPMENT_SETUP.md` for Windows/macOS notes).
