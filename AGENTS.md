# AGENTS.md — Tông Môn 8D: Tu Tiên Chi Lộ

## 1. Documentation & Source-of-Truth Hierarchy

When resolving conflicts between documents, prompts, or historical reports, agents MUST follow this strict priority order (highest to lowest):

1. **Project Rules & Safety Boundaries**: `AGENTS.md` and `RULES.md` (Rule 1 Zero Comments in Code, Rule 2 Canonical Fidelity, Rule 3 Server Authority, Rule 4 Playfield First, Rule 5 Cohesive Pixel Art & Tiled Maps, Rule 6 Genuine Generative Art & Human Creative Approval).
2. **Current Phase, Context Index, Execution Governance & Verified Implementation Status**: `docs/CONTEXT_INDEX.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/implementation/FEATURE_LEDGER.md`, `docs/technical/TD_FREEZE_OVERVIEW.md`, `docs/technical/SOURCE_ARCHITECTURE.md`, `docs/technical/AGENT_EXECUTION_CONTRACT.md`, `docs/technical/AGENT_SKILL_ROUTER.md`, `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`, `docs/ROADMAP.md`, `docs/CONTEXT_AUDIT.md`, `docs/PROJECT_STATUS.md`, `docs/WORKSPACE_HANDOFF.md`, and `docs/NEXT_ACTIONS.md`.
3. **Human-Approved Creative, Gameplay & Technical Scope Decisions**:
   - `docs/DECISIONS.md` (authoritative register of `GD-001` through `GD-046`, strictly preserving the distinctions between `APPROVED`, `DESIGN_BASELINE`, `PROPOSED`, `UNRESOLVED`, and `LEGACY`),
   - `docs/technical/TD_FREEZE_APPROVALS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`, and `docs/technical/TD_FREEZE_GATES.md` (Technical Design Freeze v1.0 owner-accepted scope vs provisional/open gates), and
   - the **Human Creative Decisions Ledger** (Section 5 below).
4. **Canonical Lore & Character Identities**: `docs/GAME_LORE.md`, `docs/CHARACTER_VISUAL_BIBLE.md`, `packages/game-data/src/index.ts`, `packages/shared/src/index.ts`, and canonical identity sections (Sections 5–7) of `MASTER_PROMPT.md` *(note: legacy 3-class, action-combat, and open-apprenticeship mechanics in `MASTER_PROMPT.md` are `LEGACY` where superseded by `docs/DECISIONS.md`)*.
5. **Phase 1B.0 Baseline v0.2 & Technical Design Freeze v1.0 Specifications (`DESIGN APPROVED / NOT IMPLEMENTED`)**:
   - Baseline v0.2: `docs/GAME_VISION.md`, `docs/GAME_LORE.md`, `docs/GAME_DESIGN.md`, `docs/NARRATIVE_DESIGN.md`, `docs/WORLD_DESIGN.md`, `docs/UX_DESIGN.md`, `docs/CONTENT_PIPELINE.md`, `docs/ART_BIBLE.md`, and `docs/CHARACTER_VISUAL_BIBLE.md`.
   - Technical Design Freeze v1.0 (35 domain/technical/pipeline specs + 5 freeze guides): `docs/systems/*.md` (including **`docs/systems/NPC_SHOPS.md`** as the sole accepted NPC-only shop specification), `docs/pipelines/*.md`, and `docs/technical/*.md`. *(Note: component files intentionally preserve historical `REVIEW_REQUIRED` / `DRAFT` headers verbatim to maintain verified SHA-256 hashes; `docs/technical/TD_FREEZE_APPROVALS.md` governs their accepted technical-design review state without promoting internal `DESIGN_BASELINE`/`PROPOSED`/`UNRESOLVED` values or visual assets.)*
6. **Domain-Specific Agent Skills**: `.agents/skills/*/SKILL.md` as classified and routed by `docs/technical/AGENT_SKILL_ROUTER.md` and `docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md` (starting with `.agents/skills/ai-art-production/SKILL.md`, `pixel-art-director`, `world-and-map-qa`, `mmorpg-server-integrity`, `cultivation-balance`).
7. **Archived Master Prompts & Historical Implementation Reports**: Bootstrap instructions and superseded v0.1 mechanics in `MASTER_PROMPT.md` (Sections 0, 8–16), `START_HERE.md`, and historical completion tables in `docs/IMPLEMENTATION_STATUS.md`.

**Critical Distinction**:
- Always distinguish **design intent** (`docs/DECISIONS.md`, Phase 1B.0 Baseline v0.2, and Technical Design Freeze v1.0 `docs/systems/*`, `docs/pipelines/*`, `docs/technical/*`) from **actual implementation status** (current v0.1 prototype code in `apps/` and `packages/`).
- Never treat a historical milestone completion report (`docs/IMPLEMENTATION_STATUS.md`), an accepted Technical Design document (`TD-01`..`TD-05`), or an automated validator pass (`npm run verify:assets`, `quality_audit.py`) as proof of finished gameplay implementation, final production numeric balance, or `HUMAN_APPROVED` visual quality.

---

## 2. Project Boundaries & Monorepo Architecture

Route source organization, domain feature directories, and dependency rules through **`docs/technical/SOURCE_ARCHITECTURE.md`**:

- `packages/shared/`: Shared TypeScript protocol contracts, message payloads, and deterministic constants.
- `packages/game-data/`: Canonical source of truth for `Phàm Nhân` (starter state) + 17 major cultivation realms (`Luyện Khí` through `Thánh Cảnh`) = 18 ordered entries, 10 legendary NPCs, zones, portals, enemies, items, culinary recipes, quests, and balance simulation models (`src/catalogs/*`, `src/rules/*`, `src/td01Numeric.ts`, `src/index.ts`).
- `packages/art-tools/`: Legacy monolithic prototype asset script (`build_assets.py` — contains procedural `ImageDraw` tileset/VFX generation and full manifest/map rewrites; **never execute as a whole production command**, with or without `--force`, pending separately approved command-level audit/refactor) and `assets/manifest.json` + `assets/provenance.json` verifier (`verify_manifest.ts` — implements character source SHA checks and asset dimensions/alpha/frame checks to current validator scope; portable provenance paths across all fields are not comprehensively enforced and provider/method allowlists are not yet implemented).
- `apps/server/`: Authoritative Node.js + Colyseus (`0.18.x`) multiplayer server (`src/index.ts`, `src/zoneRoom.ts`, `src/worldEngine.ts`, `src/features/**`) with embedded/external PostgreSQL (`@electric-sql/pglite` / `pg` in `src/db.ts`) persistence, spatial collision validation, monster AI simulation, combat, culinary/shop, quest, party, and offline cultivation services.
- `apps/client/`: Phaser `4.2.1` + TypeScript + Vite browser client (`src/main.ts`, `src/WorldScene.ts`, `src/hud.ts`, `src/network.ts`, `src/audio.ts`, `src/features/**`) with Tiled JSON map rendering, Y-sorted depth occlusion, dual-resolution 4-directional sprite animations (`80x96` multi-pose in `480x1920` sheets + preserved legacy `48x64` in `288x1024` sheets), client interpolation, synthesized WebAudio sound effects, and compact xianxia HUD.
- `assets/` & `maps/`: Source AI grids (`assets/source_ai/`), concept sheets (`assets/concepts/`), runtime sprites/portraits/props/tilesets/VFX, `manifest.json`, `provenance.json`, and Tiled JSON maps (`maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj`).

---

## 3. Canonical Constraints

- Preserve `Phàm Nhân` (starter state) + 17 major cultivation realms (`Luyện Khí` through `Thánh Cảnh`) = 18 ordered entries in exact order (per `GD-044`, `Thánh Cảnh` is the last playable major realm, while `Đại Thánh` and `Cổ Thần` exist as lore only).
- Preserve all 10 legendary figures (`phi_de`, `rmt_de`, `vaal_de`, `chatdvt`, `dam_lon_tien_tu`, `ngoc_tam`, `thai_tai`, `anh_7`, `gia_bao`, `hoa_tran`).
- `dam_lon_tien_tu` realm MUST remain `"UNKNOWN"` (`Bất Minh`).
- `chatdvt` MUST be depicted and animated as a jade-cyan quadruped spirit beast (`Linh Thú Thanh Ngọc`), never a generic human mage.
- Phì Đế's culinary path (`Ẩm Thực Đại Đạo`, `GD-016`, `GD-045`) allows BOTH purchasing and self-cooking qualifying spiritual dishes. His exclusive True Disciple signature destiny is **Vạn Vị Đạo Thai** (`GD-016`); a food-related special trigger is required (`GD-015`, `GD-045`), but the exact dish count/threshold is `UNRESOLVED` pending the **Food Catalog** (neither `"eat 80 dishes"` nor `"unlock the entire Food Catalog"` is approved).
- **Approved Baseline v0.2 & Technical Design Freeze v1.0 Rules (`docs/DECISIONS.md`, `docs/technical/TD_FREEZE_APPROVALS.md`)**:
  - **Online-Only Auto Farm & Capped Offline Meditation (`GD-002`, `GD-005`, `TD-03`)**: Auto combat / farming operates **strictly while the player is online and connected** to the authoritative server; disconnecting or transport loss stops legal combat simulation (no offline monster kills or offline combat loot/EXP; offline progression is separate capped `Bế Quan` meditation for `Tu Vi`, currently `<= 8` hours).
  - **Manual Quest Execution & Auto-Navigation Only (`GD-003`, `GD-004`, `TD-03`)**: Quest journal (`Q`) and compact tracker support **Auto-Navigation** to known objective coordinates, where the character stops for manual player interaction. **NO Auto-Quest execution** (no auto-talking, auto-accepting, auto-completing, auto-selecting story choices, or auto-solving point-and-click puzzles).
  - **Character Level (`1–350+`), 6 Base Stats & Realm Separation (`GD-020`–`GD-023`, `GD-028`, `TD-01`)**: `Phàm Nhân` spans Levels `1–10` and each of the 17 major realms adds 20 Character Levels (`Lv 11–350`, with `Thánh Cảnh` continuing at `Lv 351+` in the same major realm under `GD-020`, `GD-044`). Character EXP and `Tu Vi` are separate tracks. Each actual Level gained awards `+1` free point (`GD-021`) across the 6 origin stats (`GD-028`, `DESIGN_BASELINE`: **Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính**). Under the owner-accepted `TD-01` baseline (`docs/systems/CHARACTER.md`, `TD_FREEZE_APPROVALS.md`), there is **no excessive EXP overflow banking** at a capped non-Saint major realm. Breaking through from `Phàm Nhân` Lv 10 to `Luyện Khí` requires the Main Quest encounter with a masked/unknown immortal, a starter `công pháp`, and a breakthrough pill (`GD-023`; the immortal's identity is **OPEN/unconfirmed** and must not be labeled Phì Đế).
  - **6 Independent Dao Mastery Paths (`GD-024`–`GD-027`, `TD-02`) & Technique Tiers (`GD-030`–`GD-032`, `TD-02`)**: Exactly six independent mastery paths: **Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu** (10 `Đạo Cảnh` each, progressing independently of major cultivation realm; stages 3→4, 6→7, and 9→10 require path-specific combat or point-and-click `Bí Cảnh` trials per `GD-025`; stage labels `Sơ Thức`..`Chứng Đạo` remain `PROPOSED`). Do not substitute `Đan/Khí/Phù` professions for these six paths. Both `Công pháp` (`GD-030`) and `Võ kỹ` (`GD-031`) use **six rarity tiers** (`GD-032`: **Phàm, Linh, Hoàng, Địa, Thiên, Thần** — never invent a seventh `Thánh` tier).
  - **Destinies (`GD-010`–`GD-018`, `TD-01`) & Exclusive True Disciple Sequence (`GD-006`, `GD-014`–`GD-016`, `GD-040`–`GD-041`, `TD-04`)**: Character creation rolls 3 immutable `Tiên Thiên Nghịch Thiên Cải Mệnh` at once (unlimited full-trio rerolls, no slot locking, `GD-010`–`GD-011`) plus exactly 3 active `Hậu Thiên` slots from an unlimited acquired collection (`GD-013`). Destiny traits use **four rarity tiers** (`GD-012`: **Phàm, Hoàng, Tiên, Thần**). A character may own **at most ONE** of the 10 Legendary-specific `Thần Phẩm` signature destinies across **all innate (`Tiên Thiên`) and acquired (`Hậu Thiên`) traits** (`GD-014`, `GD-018`). The **Main Quest** is playable by all characters without any signature or True Disciple status (`GD-006`, `GD-040`), whereas each Legendary NPC's optional 6-chapter **True Disciple (`Chân Truyền`)** route follows the strict sequence (`GD-015`): **matching signature ownership → NPC affinity → special trigger condition → exclusive questline → completing all 6 chapters → True Disciple** (with no unconditional realm prerequisite).
  - **Single-Owner System Boundaries & NPC-Only Commerce (`TD-01`–`TD-05`, `docs/systems/NPC_SHOPS.md`, `docs/technical/TD_FREEZE_CONTRACT_MAP.md`)**:
    - `TD-01` owns Character, Level, Realm, Cultivation, and Destiny; `TD-02` is the sole combat/damage/technique/Dao mastery and credit math engine; `TD-03` owns connected Auto Farm, Auto-Navigation, Quest Engine/FSM (`docs/systems/QUEST_ENGINE.md`), and manual interactions without implementing a second damage or reward path; `TD-04` owns authored quest content (`docs/systems/QUEST_CONTENT.md`), item/economy/world catalogs, NPC affinity, and NPC Shop (`docs/systems/NPC_SHOPS.md`) and never awards the same item as both direct inventory grant and ground loot; `TD-05` owns the visual content contract, image production, in-world rendering, and creative release gates across all player-visible features in `S1`–`S8`.
    - **Approved NPC-Only Commerce (`docs/systems/NPC_SHOPS.md`)**: In-world physical **Tụ Bảo Các** and specialist NPCs (`Đan Dược Các`, `Tàng Kinh Các`, `Binh Khí Các`, `Linh Trù/Tạp Hóa`, preserving `merchant_truong` / `Lão Trù Trương`) backed by a single server-authoritative `ShopService` and authored `ShopOfferDef` entries with searchable/filterable manual `BUY`/`SELL`. Auto Farm, Auto Navigation, and quests must **NEVER** automatically buy or sell. **NO player-to-player (P2P) marketplace, listings, consignment, escrow, or auctions.**
    - **Visual Content Contract (`TD-05`, `docs/systems/VISUAL_CONTENT_CONTRACT.md`)**: Every player-visible content object requires an authored `VisualBindingDef` and genuine generative art → post-processed atlas/tileset → Phaser/Tiled in-world integration → real gameplay screenshot/review pathway. Popup-only text features fail the production release gate.
  - **Proposed Narrative Scaffolding Protection (`GD-042`, `GD-046`)**: While the Main Quest premise, all 10 Legends' appearances, the cross-dimensional invasion finale, and the late-game reveal that Phì Đế is an incarnation of **Ăn Uống Thiên Tôn** (`GD-043`) are `APPROVED`, the era title (`Thiên Kiêu Kỷ Nguyên`), invading plane (`Hư Tịch Giới`), antagonist (`Tịch Diệt Thánh Quân — Dạ Vô Uyên`), the **seven macro story arcs** (`I. Phàm Nhân Vấn Đạo` .. `VII. Thánh Nhân Chi Chiến`), and Dao stage 1–10 titles remain `PROPOSED` until explicitly approved by the project owner.
- Zero comments (`//`, `/* */`, `#`, `<!-- -->`) in any source code file or markdown code block, per `RULES.md` Rule 1.

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
3. **Permitted Script Usage (Explicitly Audited Non-Generative Post-Processing & Packaging Only)**:
   Only explicitly audited, non-generative post-processing commands (`.agents/skills/generate2dsprite/scripts/assemble_frames.py`, `.agents/skills/pixel-art/scripts/*`, `.agents/skills/generate2dmap/scripts/*`, `packages/art-tools/verify_manifest.ts`) remain permitted strictly for:
   - Post-processing and scaling
   - Chroma-key / transparency cleanup
   - Palette quantization and corrections
   - Frame alignment, slicing, and extraction
   - Animation atlas packing and GIF preview generation
   - Tileset assembly from generated tile/prop sources
   - Tiled map placement and collision layer authoring
   - Asset manifest/provenance validation (`verify_manifest.ts`)
   - Technical gameplay rendering
   - **Prohibition on Whole-Command `packages/art-tools/build_assets.py` Execution**: Never execute `python packages/art-tools/build_assets.py` as a whole production asset generation/post-processing command, including with `--force` (`npm run generate:art` / `npm run generate:art:force`), because its `main()` invokes `build_portraits_and_sprites()`, `build_tileset()`, `build_vfx_and_contact_sheet()`, `build_tiled_maps()`, rewrites manifest/provenance, and contains procedural `ImageDraw` tileset/VFX generation. Treat existing `packages/art-tools/build_assets.py` as legacy tooling requiring command-level audit/refactor before production execution.
4. **Placeholder & Legacy Asset Preservation**:
   - Preserve existing placeholders and legacy `48x64` assets until `HUMAN_APPROVED` generative replacements have been produced and approved.
   - Never run destructive asset regeneration (`npm run generate:art:force` / `python packages/art-tools/build_assets.py`) or paid external image/video APIs without explicit project-owner authorization (`docs/pipelines/ARGON_NATIVE_ASSET_PROFILE.md`).

---

## 5. Creative Approval States & Human Decisions Ledger

All visual directions and individual assets must be tracked using five distinct lifecycle states:
- `PROPOSED`: Generated or designed, awaiting human review.
- `TECHNICALLY_VERIFIED`: Passes automated dimensions, transparency, frame count, and SHA-256 checks (`verify_manifest.ts` / `quality_audit.py`), but has **not** received human creative approval. *(Current `packages/art-tools/verify_manifest.ts` enforcement scope: existing character source SHA checks and asset dimensions/alpha/frame checks are implemented to current validator scope; portable provenance paths across all fields are not comprehensively enforced and provider/method allowlists are not yet implemented — future enforcement remains a separately approved tooling task.)*
- `HUMAN_APPROVED`: Explicitly reviewed and approved by the human project owner at actual gameplay zoom.
- `REJECTED`: Rejected for style, readability, or lore reasons.
- `PLACEHOLDER`: Temporary/legacy asset retained solely to keep the build playable until a `HUMAN_APPROVED` asset replaces it.

**Mechanism for Recording Human-Approved Creative Decisions**:
- Never promote `TECHNICALLY_VERIFIED` (`status: "approved"` in `manifest.json` or `status: "pass"` in `provenance.json`) to `HUMAN_APPROVED` autonomously (`RULES.md` Rule 6).
- An asset or design direction enters `HUMAN_APPROVED` **only** when the project owner explicitly approves it in conversation and an entry is recorded in the ledger table below (and mirrored in `docs/ART_BIBLE.md` / `docs/DECISIONS.md` / `docs/technical/TD_FREEZE_APPROVALS.md`):

| Decision ID | Date | Scope / Asset / Doc | State | Approved By | Notes |
|---|---|---|---|---|---|
| `DEC-001` | 2026-10-16 | Canonical `Phàm Nhân` + 17 Major Realms (= 18 Ordered Entries) & 10 Legends Lore Baseline | `HUMAN_APPROVED` | Project Owner | Locked via `MASTER_PROMPT.md` & Phase 1A instructions |
| `DEC-002` | 2026-10-16 | Candidate A Visual Direction (`candidate_a_classic_xianxia.jpg`) | `PROPOSED` / `TECHNICALLY_VERIFIED` | Pending Human Owner | Currently a `PROPOSED` visual reference (not a fully `HUMAN_APPROVED` style lock); an art production proof must receive owner creative approval (`HUMAN_APPROVED`) before scaling asset production |
| `DEC-003` | 2026-10-16 | Phase 0 Multi-Pose PoC Sprites (`hero_kiem_tu`, `phi_de`, `dam_lon_tien_tu`, `combat_vfx`) | `TECHNICALLY_VERIFIED` | Pending Human Owner | `480x1920` (`80x96` frames) verified in engine; awaiting Phase 1–2 human visual sign-off |
| `DEC-004` | 2026-10-16 | Game Design Baseline v0.2 (`docs/DECISIONS.md` & 10 Phase 1B.0 docs) | `HUMAN_APPROVED` / `DESIGN_BASELINE` / `PROPOSED` (per `DECISIONS.md`) | Project Owner | `GD-001`–`GD-006`, `GD-010`–`GD-016`, `GD-020`–`GD-027`, `GD-030`–`GD-036`, `GD-040`–`GD-045` are `APPROVED`; `GD-017`, `GD-018`, `GD-028`, `GD-037` are `DESIGN_BASELINE`; `GD-046` (era/plane/villain names & 7 macro arcs) and Dao stage 1–10 names remain `PROPOSED` |
| `DEC-005` | 2026-10-16 | Technical Design Freeze v1.0 (`TD-01` v0.3, `TD-02` v0.4, `TD-03` v0.5, `TD-04` v0.6 + `NPC_SHOPS.md`, `TD-05` v0.7 — 40 `docs/` files) | `TECHNICAL_DESIGN_ACCEPTED` (`DESIGN APPROVED / NOT IMPLEMENTED`; per `TD_FREEZE_APPROVALS.md`) | Project Owner | Component files preserve historical `REVIEW_REQUIRED` headers for SHA-256 integrity; sample numbers, `GD-046` names/arcs, Food Catalog threshold, shop prices, and `Candidate A` / PoC art remain `DESIGN_BASELINE` / `PROPOSED` / `UNRESOLVED` / `TECHNICALLY_VERIFIED` (not final balance or `HUMAN_APPROVED` art) |

---

## 6. Planner / Executor Responsibilities and Resume

- The owner and ChatGPT choose direction and scoped task acceptance. Argon is the autonomous implementation agent: code, self-review, relevant checks, in-scope fixes and affected-doc synchronization. ChatGPT is not a mandatory implementation-review stage after every task.
- Use AGENT_EXECUTION_CONTRACT Section 3 as the single everyday workflow and verification policy. Owner-issued EXECUTE task cards authorize the stated implementation scope. PLAN_ONLY stops at the plan. Explicit commit/push policy belongs in the task card and prior authorization persists; a template does not authorize anything by itself.
- Start with Git/working-tree state, these rules, NEXT_ACTIONS and the execution contract. Route only needed specs/skills through CONTEXT_INDEX/AGENT_SKILL_ROUTER. Reuse unchanged context. Do not automatically run tests/build or npm run dev on resume.
- FEATURE_LEDGER owns task evidence/commit identities, PROJECT_STATUS the current snapshot, and NEXT_ACTIONS priorities. Governance/routing docs avoid duplicating changing task status.
- One completion report normally closes the task. Packets are requested or needed for evidence transfer, not mandatory per stage. Follow .agents/rules/review-handoff.md. Do not reopen completed work without new evidence or an explicit review request. Preserve owner canon/art/data decisions and all frozen design boundaries.
