# Argon Native Asset Production Profile — Tông Môn 8D

> Status: `ACTIVE_COREKIT_ENFORCED` (`COREKIT-CANON-02` on `VISUAL-03-W` `7b386cea7ef075c6f358539ddea155cd1634db5b`) | Capability Status: `NATIVE_IMAGE_TOOL_VERIFIED_IN_HOST` | Freeze Baseline: `39c41a6ddb77b93284c56da7ec053f4309ee4943`

## 1. Capability Status, Core Kit `v01b` Registry & `VISUAL-01..03` State

- **Current Verified Capability State**: `NATIVE_IMAGE_TOOL_VERIFIED_IN_HOST` (the Argon host's built-in `image-generator` subagent has been verified end-to-end across `VISUAL-01`, `VISUAL-02A/B`, `VISUAL-02B-CORRECTION`, and `HERO-ANIMSET-01`).
- **Canonical Reference Registry (`assets/corekit/v01b/catalog.json`)**:
  - Active visual direction: **`V01-B — THIÊN MỆNH TIÊN CUNG (Three-Tier Progression Grandeur)`** (`DEC-006`).
  - Active visual masters (`15` `HUMAN_APPROVED` entries) and `7` explicit `legacy_required` exceptions are registered in [`assets/corekit/v01b/catalog.json`](../../assets/corekit/v01b/catalog.json) with real reference crops/boards in `assets/corekit/v01b/references/**` and structured production profiles in `assets/corekit/v01b/profiles/{animation,ui-tokens,world-art}.json`.
  - Historical `Candidate A/B/C`, `capability_proof_phi_de.jpg`, `archive_pre_correction`, and `OLD (REJECTED)` comparison panes are isolated in `assets/archive/history/` (`role: "archive_only"`, `cannotBeUsedAsActiveMaster: true`) and must never be used as active visual masters.
- **Current `S1` Visual & Foundation Sequence**:
  1. **`VISUAL-01` (`DEC-006`)**: Completed — owner selected `V01-B — THIÊN MỆNH TIÊN CUNG`.
  2. **`VISUAL-02` & `VISUAL-02B-CORRECTION` (`DEC-007`, `DEC-008`)**: Completed — owner approved the `VISUAL_02B_S1_CORE_KIT.zip` sample pack and the corrected `phi_de` (chubby cream bear hood + `Đùi Gà Luộc`, no tea/broth cup) and `rmt_de` (`Thần Tài` winged hat + gold ingot/abacus) identities.
  3. **`VISUAL-03-P` (`4679f49`) & `VISUAL-03-W` (`7b386ce`)**: Committed — integrated `96×72` `maps/tan_thu_thon.tmj`, `CameraView.ts`, `MinimapView.ts`, 11 `80×96` starter/NPC sprites, and 16 world props/bridges.
  4. **`HERO-ANIMSET-01` (`DEC-009`)**: Completed — owner explicitly approved the rebuilt Desktop `hero_kiem_tu` (`v01b.char.hero_kiem_tu` @ `2.0.0-hero-animset-01`, `source_h04`..`source_h10` lineage; `MISSING_APPROVED_HERO_INPUT` remains open for the later owner-confirmed 8-walk-frame Hero artifact) as the active Hero master, superseding the old kit Hero and `source_h01`/`source_h02`.
  5. **`ARCH-FOUNDATION-02`, `COREKIT-CANON-02`, `ARCH-COREKIT-R1`, `VISUAL-03-U/Q` & `S1-F`**: Implemented & verified (`NO_COMMIT` at base `7b386ce`) — modular source extraction, `assets/corekit/v01b/` installation, reusable Batch A UI import (`assets/ui/**`), pure Core Kit validator (`18/18` tests), disabled procedural entrypoints, dependency-backed cleanup, `VISUAL-03-U/Q` HUD/FPS/occlusion proof, and `S1-F` (`S1F_01`..`S1F_06` `PASS`) technical proof; awaiting owner `S1_EXPERIENCE_AND_ACCEPTANCE` sign-off.

---

## 2. Non-Negotiable Generation, Master Lookup & Transformation Policy

1. **Catalog-Only Master Lookup & Host Native Generation Only**:
   - Every new production asset task MUST resolve its active `referenceId@version` and `profileId` from `assets/corekit/v01b/catalog.json` and `assets/corekit/v01b/profiles/*.json`, and invoke ONLY the Argon host's built-in `image-generator` subagent (`TypeName: "image-generator"`) with exact Core Kit reference images attached.
   - Never free-browse `assets/archive/history/`, `assets/archive/history/concepts/`, or arbitrary `assets/source_ai/` files as active masters.
2. **Absolute Ban on External API & CLI Media Providers**:
   - External paid API providers (`OpenAI`, `Google Gemini`, `xAI`, `BytePlus ModelArk`, `fal.ai`) and external CLI media tools (`codex`, `grok`) are **strictly forbidden** for production asset generation, **regardless of whether API keys or CLI credentials are configured**.
   - Never invoke `.agents/skills/generate2dmedia/scripts/route_media.py`, `generate_media.py`, `cli_media.py`, `media_config.py`, `media_providers.py`, or `.agents/skills/video2dsprite/**`.
3. **Prohibition on Procedural Art & Fake Affine Motion**:
   - Never invoke `.agents/skills/codeart2d/**` or Python/Pillow/SVG/Canvas procedural drawing (`ImageDraw`) to synthesize final production artwork (`AGENTS.md` Section 4.2, `RULES.md` Rule 6).
   - Never fabricate multi-frame animation sequences by applying affine warps, stretches, flips, or shears to a single static frame.
   - **Disabled Procedural Entrypoints**: Both `python packages/art-tools/build_assets.py` (with or without `--force`) and `npm run generate:art` / `npm run generate:art:force` are permanently disabled fail-closed entrypoints (`exit code 2` before any filesystem write). The historical Phase 0 script is archived at `packages/art-tools/legacy/build_assets.py` as non-executable provenance.
4. **Permitted Deterministic Post-Processing & Packaging**:
   - Audited non-generative post-processing scripts (`.agents/skills/generate2dsprite/scripts/*`, `.agents/skills/pixel-art/scripts/*`, `.agents/skills/generate2dmap/scripts/*`, `scripts/package-runtime-assets.mjs`) are permitted strictly for deterministic crop/slicing, chroma-key/alpha cleanup, nearest-neighbor scaling, palette normalization, foot-anchor registration, atlas/GIF packaging, and Tiled map assembly from approved generated sources.
   - Ordinary DOM/CSS layout, text labels, progress bars, diagnostic geometry, and QA annotations are not new production illustration assets.
5. **Fail-Closed `BLOCKED` Behavior**:
   - When the Argon native `image-generator` subagent is unavailable or fails after bounded transient retries, halt immediately and return **`BLOCKED`** — never fall back to procedural drawing.

---

## 3. Core Kit Resolution → Native Pose Sheets → Modular Runtime Integration Workflow

1. **Stage 1 — Core Kit Resolution & Concrete Brief**:
   - Resolve the exact active `referenceId@version` in `assets/corekit/v01b/catalog.json` and target `profileId` in `assets/corekit/v01b/profiles/{animation,ui-tokens,world-art}.json`.
   - Record initial role as `production_candidate` and creative approval state as `PROPOSED`.
2. **Stage 2 — Native `image-generator` Execution with Attached Master References**:
   - Invoke `invoke_subagent` (`TypeName: "image-generator"`) with the resolved reference images from `assets/corekit/v01b/references/**` attached.
   - Preserve unmodified raw generative outputs under `assets/source_ai/` with SHA-256 checksums.
3. **Stage 3 — Profile-Driven Geometry & Creature Anatomy**:
   - Single-sourced in `assets/corekit/v01b/profiles/animation.json` and compiled to `apps/client/src/game/assets/runtimeAnimationProjection.json`:
     - `full_80x96_20row`: `480x1920` (`6x20` of `80x96` frames, foot anchor `(0.5, 0.9167)` / `(40, 88)`).
     - `full_80x96_20row_8walk`: `640x1920` (`8x20` of `80x96` frames, `walk.framesPerRow = 8`, foot anchor `(0.5, 0.9167)` / `(40, 88)` for the later owner-approved 8-walk-frame Hero profile).
     - `locomotion_80x96_8row`: `480x768` (`6x8` of `80x96` frames, foot anchor `(0.5, 0.9167)`).
     - `stationary_npc_80x96_4f`: `320x96` (`4x1` of `80x96` frames, foot anchor `(0.5, 0.9167)`).
     - `legacy_48x64_16row`: `288x1024` (`6x16` of `48x64` frames, foot anchor `(0.5, 0.90)` / `(24, 58)`, `role: "legacy_required"`).
   - **`chatdvt` (`Linh Thú Thanh Ngọc`)** MUST always be generated and animated as a four-legged quadruped spirit beast (`v01b.creature.chatdvt` @ `1.0.0`), never human or bipedal.
4. **Stage 4 — Deterministic Post-Processing & Provenance Recording**:
   - Slice, chroma-clean, register, and pack frames using audited non-generative scripts.
   - Record truthful `generationProvider: "argon_native_image_generator"`, `generationMethod: "native_image_generator_subagent"`, native tool trace/run evidence, referenced `referenceId@version`, `sourceFiles` SHA-256 digests, and transformation steps in `assets/provenance.json`. Never invent a fake native run ID for historical pre-trace assets (label historical entries truthfully).
5. **Stage 5 — Modular Runtime Wiring, Validator Check & Owner Approval Gate**:
   - Wire runtime assets through `apps/client/src/game/assets/RuntimeAssetBindings.ts`, `apps/client/src/game/assets/SpriteProfiles.ts`, and `apps/client/src/game/combat/AnimationRegistry.ts`.
   - Run `npm run verify:assets` (`packages/art-tools/verify_manifest.ts` + `packages/art-tools/corekit/validateCorekit.ts`).
   - Passing automated checks confers `TECHNICALLY_VERIFIED` status only; only the project owner can grant `HUMAN_APPROVED` status.

---

## 4. Pure Core Kit Validator Enforcement & Honest Limitations (`packages/art-tools/corekit/validateCorekit.ts`)

### 4.1 Enforced by `npm run verify:assets` (`verify_manifest.ts` + `validateCorekit.ts`)
- **Catalog & Active Master Governance**: Validates `assets/corekit/v01b/catalog.json` version, schema, unique `referenceId` / `version`, exactly one active version per `referenceId`, valid `role` (`master_reference`) and `creativeApprovalState` (`HUMAN_APPROVED` with `approvalRecordId`, `approvedBy`, `approvedDate`, `approvalScope`), portable relative paths, symlink/traversal containment, and exact file SHA-256 digests.
- **Precedence & Rejection Boundaries**: Enforces that `v01b.char.hero_kiem_tu` (`major >= 2`, currently `2.0.0-hero-animset-01`) resolves to the accepted Desktop Hero (`ecf6604b...` / `1de6fc60...`), `v01b.npc.phi_de` (`2.0.0-bear-hood-chicken`) and `v01b.npc.rmt_de` (`2.0.0-than-tai`) resolve to the corrected `source_b11` / `source_b10` masters, and rejects any reference pointing into `assets/archive/history/**`, `archive_pre_correction`, or `OLD (REJECTED)` comparison panes.
- **Single-Owned Profile Projection & Runtime Bindings**: Verifies that `apps/client/src/game/assets/runtimeAnimationProjection.json` matches `assets/corekit/v01b/profiles/animation.json` (`sourceAnimationProfileSha256` and deep content match), all `profiles/ui-tokens.json` and `assets/ui/batch_a_ui_atlas_mapping.json` paths exist, all runtime character sheets match their profile dimensions/frame counts, and all `manifest.json` / Tiled `.tmj` image dependencies resolve cleanly within the repository.
- **Provider/Method Allowlist for New Production Records**: Enforces `generationProvider === "argon_native_image_generator"`, `generationMethod === "native_image_generator_subagent"`, valid `profileId`, and verified `sourceFiles` SHA-256 digests on new production entries in `assets/provenance.json`, while keeping explicit bounded exceptions for historical `legacy_required` entries.

### 4.2 Honest Structural Limitations
- **Provenance Metadata vs. Cryptographic Pixel Proof**: A JSON `generationProvider` / `generationMethod` declaration and trace record provide structural governance and auditability, not cryptographic proof of what model synthesized raw pixels.
- **Technical Validation vs. Aesthetic Judgment**: Automated dimension, alpha, hash, and frame-distinctness checks verify technical compliance (`TECHNICALLY_VERIFIED`) and cannot automatically judge artistic quality or replace `HUMAN_APPROVED` sign-off by the project owner.
