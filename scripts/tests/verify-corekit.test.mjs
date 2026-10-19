import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  assertSafeRepoPath,
  deriveRuntimeAnimationProjection,
  resolveActiveCorekitReference,
  validateCorekitRepository,
  validateProductionJobSpec
} from "../../packages/art-tools/corekit/validateCorekit.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

function sha256Text(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function writeJsonWithSha(absPath, obj) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  const text = JSON.stringify(obj, null, 2) + "\n";
  fs.writeFileSync(absPath, text, "utf8");
  return sha256Text(text);
}

function createSyntheticCorekitWorkspace() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d-corekit-test-"));
  const writeBytes = (relPath, content) => {
    const abs = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
    return {
      path: relPath,
      sha256: sha256Text(content),
      bytes: Buffer.byteLength(content),
      role: "master_reference"
    };
  };

  const heroSprite = writeBytes("assets/sprites/hero_kiem_tu.png", "hero-sprite-20row");
  const heroPortrait = writeBytes("assets/portraits/portrait_hero_kiem_tu.png", "hero-portrait");
  const heroSource = writeBytes("assets/source_ai/source_04_hero_and_chatdvt_multipose_sprite_proof.png", "hero-source04");
  const phiSprite = writeBytes("assets/sprites/phi_de.png", "phi-sprite-4f");
  const rmtSprite = writeBytes("assets/sprites/rmt_de.png", "rmt-sprite-4f");
  const tilesetImg = writeBytes("assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png", "tileset-v01b");
  const nineSliceImg = writeBytes("assets/ui/frames_9slice/panel_tier1_grounded_wood_jade_9slice.png", "9slice-img");

  const animProfile = {
    profileGroupId: "v01b.profiles.animation",
    version: "1.0.0",
    profiles: {
      full_80x96_20row: {
        profileId: "full_80x96_20row",
        kind: "full_80x96_20row",
        sheetWidth: 480,
        sheetHeight: 1920,
        frameWidth: 80,
        frameHeight: 96,
        supportedDirections: ["down", "left", "right", "up"],
        supportedStates: ["idle", "walk", "attack", "cast", "hurt"]
      },
      stationary_npc_80x96_4f: {
        profileId: "stationary_npc_80x96_4f",
        kind: "stationary_npc_80x96_4f",
        sheetWidth: 320,
        sheetHeight: 96,
        frameWidth: 80,
        frameHeight: 96,
        supportedDirections: ["down"],
        supportedStates: ["idle"]
      }
    },
    spriteBindings: {
      hero_kiem_tu: { profileId: "full_80x96_20row", referenceId: "v01b.char.hero_kiem_tu", role: "runtime" },
      phi_de: { profileId: "stationary_npc_80x96_4f", referenceId: "v01b.npc.phi_de", role: "runtime" },
      rmt_de: { profileId: "stationary_npc_80x96_4f", referenceId: "v01b.npc.rmt_de", role: "runtime" }
    }
  };
  const animHash = writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/profiles/animation.json"), animProfile);

  const runtimeProjectionRel = "apps/client/src/game/assets/runtimeAnimationProjection.json";
  const runtimeProjectionObj = {
    schemaVersion: "1.0.0",
    sourceCatalog: "assets/corekit/v01b/catalog.json",
    sourceAnimationProfile: "assets/corekit/v01b/profiles/animation.json",
    sourceAnimationProfileSha256: animHash,
    profiles: {
      full_80x96_20row: {
        kind: "full_80x96_20row",
        frameWidth: 80,
        frameHeight: 96,
        supportedStates: ["idle", "walk", "attack", "cast", "hurt"],
        supportedDirections: ["down", "left", "right", "up"],
        sheetWidth: 480,
        sheetHeight: 1920
      },
      stationary_npc_80x96_4f: {
        kind: "stationary_npc_80x96_4f",
        frameWidth: 80,
        frameHeight: 96,
        supportedStates: ["idle"],
        supportedDirections: ["down"],
        sheetWidth: 320,
        sheetHeight: 96
      }
    },
    spriteBindings: animProfile.spriteBindings
  };
  const projHash = writeJsonWithSha(path.join(tmpDir, runtimeProjectionRel), runtimeProjectionObj);

  const uiProfile = {
    profileGroupId: "v01b.profiles.ui_tokens",
    version: "1.0.0",
    nineSliceFrames: {
      panel_tier1: {
        imagePath: nineSliceImg.path,
        insets: { left: 40, right: 40, top: 36, bottom: 36 }
      }
    }
  };
  const uiHash = writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/profiles/ui-tokens.json"), uiProfile);

  const worldProfile = {
    profileGroupId: "v01b.profiles.world_art",
    version: "1.0.0",
    logicalTileGrid: { tileWidth: 32, tileHeight: 32 }
  };
  const worldHash = writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/profiles/world-art.json"), worldProfile);

  const mapJson = {
    width: 4,
    height: 4,
    tilewidth: 32,
    tileheight: 32,
    tilesets: [
      {
        firstgid: 1,
        name: "tan_thu_thon_v01b_tileset_32x32",
        image: "../assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png"
      }
    ],
    layers: []
  };
  writeJsonWithSha(path.join(tmpDir, "maps/tan_thu_thon.tmj"), mapJson);

  const catalog = {
    catalogId: "synthetic-corekit-v01b",
    version: "1.0.0",
    styleDirection: "V01-B — THIÊN MỆNH TIÊN CUNG",
    profiles: {
      animation: {
        profileGroupId: "v01b.profiles.animation",
        path: "assets/corekit/v01b/profiles/animation.json",
        sha256: animHash
      },
      uiTokens: {
        profileGroupId: "v01b.profiles.ui_tokens",
        path: "assets/corekit/v01b/profiles/ui-tokens.json",
        sha256: uiHash
      },
      worldArt: {
        profileGroupId: "v01b.profiles.world_art",
        path: "assets/corekit/v01b/profiles/world-art.json",
        sha256: worldHash
      }
    },
    runtimeProjection: {
      path: runtimeProjectionRel,
      sha256: projHash
    },
    approvalLedger: [
      {
        decisionId: "DEC-008",
        date: "2026-10-18",
        scope: "VISUAL-02B Kit & NPC Differentiation",
        state: "HUMAN_APPROVED",
        approvedBy: "Project Owner"
      },
      {
        decisionId: "DEC-009",
        date: "2026-10-18",
        scope: "HERO-ANIMSET-01 Desktop Hero Master",
        state: "HUMAN_APPROVED",
        approvedBy: "Project Owner"
      }
    ],
    allowedNativeGenerationProviders: ["Antigravity native image-generator subagent"],
    forbiddenProceduralMethods: ["codeart2d", "ImageDraw", "Canvas2D_procedural"],
    forbiddenMasterPatterns: [
      "archive_pre_correction",
      "assets/archive/history/",
      "source_08_hero_4dir_idle_walk_sheet_v01b.png",
      "source_h01_hero_source04_4dir_locomotion_v01b.png"
    ],
    references: [
      {
        referenceId: "v01b.char.hero_kiem_tu",
        version: "2.0.0-hero-animset-01",
        active: true,
        kind: "character_identity",
        role: "master_reference",
        creativeApprovalState: "HUMAN_APPROVED",
        approvalRecordId: "DEC-009",
        approvalScope: "character_identity_and_runtime_animset",
        approvedDate: "2026-10-18",
        approvalSource: "Owner HERO-ANIMSET-01 approval",
        profileId: "full_80x96_20row",
        masterFiles: [heroSprite, heroPortrait],
        sourceLineage: [heroSource],
        runtimeBindings: ["portrait_hero_kiem_tu", "sprite_hero_kiem_tu"]
      },
      {
        referenceId: "v01b.npc.phi_de",
        version: "2.0.0-bear-hood-chicken",
        active: true,
        kind: "npc_identity",
        role: "master_reference",
        creativeApprovalState: "HUMAN_APPROVED",
        approvalRecordId: "DEC-008",
        approvalScope: "character_identity_and_kit_sample",
        approvedDate: "2026-10-18",
        approvalSource: "Owner correction board",
        profileId: "stationary_npc_80x96_4f",
        masterFiles: [phiSprite],
        sourceLineage: [phiSprite],
        runtimeBindings: ["sprite_phi_de"]
      },
      {
        referenceId: "v01b.npc.rmt_de",
        version: "2.0.0-than-tai",
        active: true,
        kind: "npc_identity",
        role: "master_reference",
        creativeApprovalState: "HUMAN_APPROVED",
        approvalRecordId: "DEC-008",
        approvalScope: "character_identity_and_kit_sample",
        approvedDate: "2026-10-18",
        approvalSource: "Owner correction board",
        profileId: "stationary_npc_80x96_4f",
        masterFiles: [rmtSprite],
        sourceLineage: [rmtSprite],
        runtimeBindings: ["sprite_rmt_de"]
      }
    ],
    supersededReferences: [
      {
        referenceId: "legacy.style.candidate_a",
        version: "0.1.0",
        active: false,
        role: "archive_only",
        creativeApprovalState: "REJECTED"
      }
    ],
    legacyRequiredExceptions: []
  };
  writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catalog);

  const manifest = {
    version: "2.1.0",
    styleDirection: "V01-B — THIÊN MỆNH TIÊN CUNG",
    corekitCatalog: "assets/corekit/v01b/catalog.json",
    assets: [
      {
        assetId: "portrait_hero_kiem_tu",
        file: "assets/portraits/portrait_hero_kiem_tu.png",
        category: "portrait",
        role: "runtime",
        creativeApprovalState: "HUMAN_APPROVED",
        width: 160,
        height: 160
      },
      {
        assetId: "sprite_hero_kiem_tu",
        file: "assets/sprites/hero_kiem_tu.png",
        category: "character_spritesheet",
        characterId: "hero_kiem_tu",
        role: "runtime",
        creativeApprovalState: "HUMAN_APPROVED",
        width: 480,
        height: 1920,
        frameWidth: 80,
        frameHeight: 96
      },
      {
        assetId: "sprite_phi_de",
        file: "assets/sprites/phi_de.png",
        category: "character_spritesheet",
        characterId: "phi_de",
        role: "runtime",
        creativeApprovalState: "TECHNICALLY_VERIFIED",
        width: 320,
        height: 96,
        frameWidth: 80,
        frameHeight: 96
      },
      {
        assetId: "sprite_rmt_de",
        file: "assets/sprites/rmt_de.png",
        category: "character_spritesheet",
        characterId: "rmt_de",
        role: "runtime",
        creativeApprovalState: "TECHNICALLY_VERIFIED",
        width: 320,
        height: 96,
        frameWidth: 80,
        frameHeight: 96
      },
      {
        assetId: "tileset_tan_thu_thon_v01b",
        file: testTilesetPath(tilesetImg),
        category: "tileset",
        role: "runtime",
        creativeApprovalState: "TECHNICALLY_VERIFIED",
        width: 256,
        height: 192
      }
    ],
    maps: [
      {
        zoneId: "tan_thu_thon",
        file: "maps/tan_thu_thon.tmj",
        widthTiles: 4,
        heightTiles: 4
      }
    ]
  };
  function testTilesetPath(img) {
    return img.path;
  }
  writeJsonWithSha(path.join(tmpDir, "assets/manifest.json"), manifest);

  const provenance = {
    version: "2.1.0",
    characters: [
      {
        characterId: "hero_kiem_tu",
        corekitReferenceId: "v01b.char.hero_kiem_tu",
        generationProvider: "Antigravity native image-generator subagent",
        generationMethod: "Native directional sprite sheet generation",
        sourceAiFiles: [
          {
            path: heroSource.path,
            sha256: heroSource.sha256
          }
        ]
      }
    ]
  };
  writeJsonWithSha(path.join(tmpDir, "assets/provenance.json"), provenance);

  return { tmpDir, catalog, manifest, provenance };
}

test("real repository Core Kit v01b passes validation and resolves owner-approved Hero/Phì Đế/RMT Đế overrides", () => {
  const res = validateCorekitRepository({ rootDir: repoRoot });
  assert.equal(res.valid, true, JSON.stringify(res.errors));
  assert.ok(res.summary.activeReferenceCount >= 10);

  const catalog = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "assets/corekit/v01b/catalog.json"), "utf8")
  );
  const hero = resolveActiveCorekitReference(catalog, "v01b.char.hero_kiem_tu");
  assert.equal(hero.version, "2.0.0-hero-animset-01");
  assert.equal(hero.approvalRecordId, "DEC-009");

  const phi = resolveActiveCorekitReference(catalog, "v01b.npc.phi_de");
  assert.equal(phi.version, "2.0.0-bear-hood-chicken");
  assert.equal(phi.approvalRecordId, "DEC-008");
  assert.ok(
    phi.sourceLineage.some((s) =>
      s.path.includes("source_b11_phi_de_chubby_luxury_chicken_v01b.png")
    )
  );
  assert.ok(phi.identitySpec.props.includes("Đùi Gà Luộc Hoàng Kim"));
  assert.ok(!phi.identitySpec.props.includes("and spiritual broth cup"));

  const rmt = resolveActiveCorekitReference(catalog, "v01b.npc.rmt_de");
  assert.equal(rmt.version, "2.0.0-than-tai");
  assert.equal(rmt.approvalRecordId, "DEC-008");
  assert.ok(
    rmt.sourceLineage.some((s) =>
      s.path.includes("source_b10_phi_de_and_rmt_de_differentiation_v01b.png")
    )
  );

  assert.throws(
    () => resolveActiveCorekitReference(catalog, "legacy.style.candidate_a"),
    /SUPERSEDED_REFERENCE_FORBIDDEN/
  );
  assert.throws(
    () => resolveActiveCorekitReference(catalog, "v01b.char.nonexistent"),
    /MISSING_ACTIVE_REFERENCE/
  );
});

test("negative fixtures: missing master, bad hash, duplicate active version, rejected/archive master, missing approval", () => {
  const { tmpDir, catalog } = createSyntheticCorekitWorkspace();
  try {
    assert.equal(validateCorekitRepository({ rootDir: tmpDir }).valid, true);

    const catMissingMaster = structuredClone(catalog);
    catMissingMaster.references[0].masterFiles.push({
      path: "assets/sprites/missing_master.png",
      sha256: "0".repeat(64),
      role: "master_reference"
    });
    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catMissingMaster);
    let res = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "MISSING_MASTER_FILE"));

    const catBadHash = structuredClone(catalog);
    catBadHash.references[0].masterFiles[0].sha256 = "f".repeat(64);
    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catBadHash);
    res = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "MASTER_HASH_MISMATCH"));

    const catDupActive = structuredClone(catalog);
    catDupActive.references.push(structuredClone(catalog.references[0]));
    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catDupActive);
    res = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "DUPLICATE_ACTIVE_VERSION"));

    const catArchiveMaster = structuredClone(catalog);
    catArchiveMaster.references[1].masterFiles[0].path =
      "assets/archive/history/pre_correction_npcs/npc_phi_de_idle_4f_pre_correction.png";
    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catArchiveMaster);
    res = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "FORBIDDEN_ARCHIVE_OR_REJECTED_MASTER"));

    const catMissingApproval = structuredClone(catalog);
    catMissingApproval.references[0].approvalRecordId = "DEC-999-UNKNOWN";
    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catMissingApproval);
    res = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "MISSING_APPROVAL_RECORD"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("negative fixtures: probe-corekit counterexamples (PROPOSED active master, invalid newProductionJobs profile/source, invalid runtimeAnimationProjection)", () => {
  const { tmpDir, catalog, provenance } = createSyntheticCorekitWorkspace();
  try {
    assert.equal(validateCorekitRepository({ rootDir: tmpDir }).valid, true);

    for (const invalidState of ["PROPOSED", "TECHNICALLY_VERIFIED", "REJECTED", "PLACEHOLDER"]) {
      const catInvalidState = structuredClone(catalog);
      catInvalidState.references[0].creativeApprovalState = invalidState;
      assert.throws(
        () => resolveActiveCorekitReference(catInvalidState, catInvalidState.references[0].referenceId),
        /NON_HUMAN_APPROVED_ACTIVE_MASTER/
      );
      writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catInvalidState);
      const stateRes = validateCorekitRepository({ rootDir: tmpDir });
      assert.equal(stateRes.valid, false);
      assert.ok(stateRes.errors.some((e) => e.code === "NON_HUMAN_APPROVED_ACTIVE_MASTER"));
    }

    const catUnapprovedLedger = structuredClone(catalog);
    catUnapprovedLedger.approvalLedger[1].state = "PROPOSED";
    assert.throws(
      () => resolveActiveCorekitReference(catUnapprovedLedger, "v01b.char.hero_kiem_tu"),
      /MISSING_APPROVAL_RECORD/
    );
    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catUnapprovedLedger);
    const ledgerRes = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(ledgerRes.valid, false);
    assert.ok(ledgerRes.errors.some((e) => e.code === "MISSING_APPROVAL_RECORD"));

    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catalog);

    const invalidJob = {
      jobId: "review_missing_profile_and_source",
      referenceId: catalog.references[0].referenceId,
      profileId: "THIS_PROFILE_DOES_NOT_EXIST",
      generationProvider: "Antigravity native image-generator subagent",
      generationMethod: "Native directional sprite sheet generation",
      sourceFiles: [
        {
          path: "assets/source_ai/THIS_FILE_DOES_NOT_EXIST.png",
          sha256: "a".repeat(64)
        }
      ]
    };
    const directJobErrors = validateProductionJobSpec(catalog, invalidJob);
    assert.ok(directJobErrors.some((e) => e.code === "UNKNOWN_PRODUCTION_JOB_PROFILE"));
    assert.ok(directJobErrors.some((e) => e.code === "MISSING_PRODUCTION_SOURCE_FILE"));

    const provBadJob = structuredClone(provenance);
    provBadJob.newProductionJobs = [invalidJob];
    writeJsonWithSha(path.join(tmpDir, "assets/provenance.json"), provBadJob);
    const repoJobRes = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(repoJobRes.valid, false);
    assert.ok(repoJobRes.errors.some((e) => e.code === "UNKNOWN_PRODUCTION_JOB_PROFILE"));
    assert.ok(repoJobRes.errors.some((e) => e.code === "MISSING_PRODUCTION_SOURCE_FILE"));

    writeJsonWithSha(path.join(tmpDir, "assets/provenance.json"), provenance);

    const projRel = "apps/client/src/game/assets/runtimeAnimationProjection.json";
    fs.writeFileSync(
      path.join(tmpDir, projRel),
      '{"profiles":{"full_80x96_20row":{"frameWidth":1}},"spriteBindings":{}}',
      "utf8"
    );
    const catBadProj = structuredClone(catalog);
    catBadProj.runtimeProjection = { path: projRel, sha256: "0".repeat(64) };
    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catBadProj);
    const projRes = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(projRes.valid, false);
    assert.ok(projRes.errors.some((e) => e.code === "RUNTIME_PROJECTION_HASH_MISMATCH"));
    assert.ok(projRes.errors.some((e) => e.code === "STALE_RUNTIME_PROJECTION_SOURCE_HASH"));
    assert.ok(projRes.errors.some((e) => e.code === "RUNTIME_PROJECTION_CONTENT_MISMATCH"));

    writeJsonWithSha(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), catalog);
    const animData = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "assets/corekit/v01b/profiles/animation.json"), "utf8")
    );
    writeJsonWithSha(
      path.join(tmpDir, projRel),
      deriveRuntimeAnimationProjection(animData, catalog.profiles.animation.sha256)
    );
    assert.equal(validateCorekitRepository({ rootDir: tmpDir }).valid, true);

    const uiMapPath = path.join(tmpDir, "assets/ui/batch_a_ui_atlas_mapping.json");
    writeJsonWithSha(uiMapPath, {
      hudChrome: [{ id: "dangling_hud", path: "assets/ui/nonexistent_dangling.png" }]
    });
    const uiMapRes = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(uiMapRes.valid, false);
    assert.ok(uiMapRes.errors.some((e) => e.code === "MISSING_UI_ATLAS_MAPPING_ASSET"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("negative fixtures: path traversal, absolute path, and symlink escape", () => {
  const { tmpDir } = createSyntheticCorekitWorkspace();
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d-outside-"));
  const outsideFile = path.join(outsideDir, "secret.png");
  fs.writeFileSync(outsideFile, "outside-bytes", "utf8");
  try {
    const errs1 = [];
    assert.equal(assertSafeRepoPath(tmpDir, "../outside.png", errs1, "traversal"), null);
    assert.ok(errs1.some((e) => e.code === "PATH_TRAVERSAL_FORBIDDEN"));

    const errs2 = [];
    assert.equal(assertSafeRepoPath(tmpDir, "C:/Windows/System32/cmd.exe", errs2, "abs"), null);
    assert.ok(errs2.some((e) => e.code === "NON_PORTABLE_OR_ABSOLUTE_PATH"));

    const symlinkPath = path.join(tmpDir, "assets/sprites/escaped_link.png");
    let symlinkCreated = false;
    try {
      fs.symlinkSync(outsideFile, symlinkPath);
      symlinkCreated = true;
    } catch {
      symlinkCreated = false;
    }
    if (symlinkCreated) {
      const errs3 = [];
      assert.equal(
        assertSafeRepoPath(tmpDir, "assets/sprites/escaped_link.png", errs3, "symlink"),
        null
      );
      assert.ok(errs3.some((e) => e.code === "SYMLINK_ESCAPE_FORBIDDEN"));
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(outsideDir, { recursive: true, force: true });
  }
});

test("negative fixtures: disallowed provider, procedural method, mismatched geometry, broken Tiled ref, missing runtime binding", () => {
  const { tmpDir, catalog, manifest } = createSyntheticCorekitWorkspace();
  try {
    const badProviderErrors = validateProductionJobSpec(catalog, {
      jobId: "job-bad-provider",
      referenceId: "v01b.char.hero_kiem_tu",
      profileId: "full_80x96_20row",
      generationProvider: "External Unverified CLI Router",
      generationMethod: "Sprite sheet generation",
      sourceFiles: [{ path: "assets/source_ai/test.png", sha256: "a".repeat(64) }]
    });
    assert.ok(badProviderErrors.some((e) => e.code === "DISALLOWED_GENERATION_PROVIDER"));

    const proceduralErrors = validateProductionJobSpec(catalog, {
      jobId: "job-procedural",
      referenceId: "v01b.char.hero_kiem_tu",
      profileId: "full_80x96_20row",
      generationProvider: "Antigravity native image-generator subagent",
      generationMethod: "Pillow ImageDraw procedural sprite synthesis",
      sourceFiles: [{ path: "assets/source_ai/test.png", sha256: "a".repeat(64) }]
    });
    assert.ok(proceduralErrors.some((e) => e.code === "FORBIDDEN_PROCEDURAL_METHOD"));

    const badGeomManifest = structuredClone(manifest);
    badGeomManifest.assets[1].width = 288;
    badGeomManifest.assets[1].height = 1024;
    writeJsonWithSha(path.join(tmpDir, "assets/manifest.json"), badGeomManifest);
    let res = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "MISMATCHED_SPRITE_PROFILE_GEOMETRY"));

    const missingBindingManifest = structuredClone(manifest);
    missingBindingManifest.assets = missingBindingManifest.assets.filter(
      (a) => a.assetId !== "sprite_rmt_de"
    );
    writeJsonWithSha(path.join(tmpDir, "assets/manifest.json"), missingBindingManifest);
    res = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "MISSING_RUNTIME_BINDING"));

    writeJsonWithSha(path.join(tmpDir, "assets/manifest.json"), manifest);
    const brokenMap = {
      width: 4,
      height: 4,
      tilewidth: 32,
      tileheight: 32,
      tilesets: [
        {
          firstgid: 1,
          name: "broken_tileset",
          image: "../assets/tilesets/nonexistent_tileset.png"
        }
      ],
      layers: []
    };
    writeJsonWithSha(path.join(tmpDir, "maps/tan_thu_thon.tmj"), brokenMap);
    res = validateCorekitRepository({ rootDir: tmpDir });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.code === "BROKEN_TILED_IMAGE_REFERENCE"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("disabled procedural build_assets.py fails before any filesystem mutation with and without --force", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d-no-write-"));
  const sentinelPath = path.join(tmpDir, "sentinel.txt");
  fs.writeFileSync(sentinelPath, "untouched", "utf8");
  const scriptAbs = path.join(repoRoot, "packages/art-tools/build_assets.py");
  try {
    for (const args of [[scriptAbs], [scriptAbs, "--force"]]) {
      const proc = spawnSync("python", args, {
        cwd: tmpDir,
        encoding: "utf8"
      });
      assert.notEqual(proc.status, 0);
      assert.ok(proc.stderr.includes("BLOCKED_LEGACY_PROCEDURAL_GENERATOR"));
      const entries = fs.readdirSync(tmpDir);
      assert.deepEqual(entries, ["sentinel.txt"]);
      assert.equal(fs.readFileSync(sentinelPath, "utf8"), "untouched");
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
