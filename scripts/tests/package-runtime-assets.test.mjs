import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  FORBIDDEN_RUNTIME_PREFIXES,
  packageRuntimeAssets,
  resolveRuntimeAssetClosure
} from "../package-runtime-assets.mjs";

function createDisposableWorkspace() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d-pkg-assets-"));
  fs.mkdirSync(path.join(tmpDir, "assets/portraits"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "assets/sprites"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "assets/tilesets"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "assets/ui"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "assets/source_ai"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "assets/concepts"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "assets/archive/history/legacy_v1"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "assets/corekit/v01b"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "maps"), { recursive: true });

  fs.writeFileSync(path.join(tmpDir, "assets/portraits/portrait_hero_kiem_tu.png"), "portrait-bytes");
  fs.writeFileSync(path.join(tmpDir, "assets/sprites/hero_kiem_tu.png"), "sprite-bytes");
  fs.writeFileSync(path.join(tmpDir, "assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png"), "tileset-bytes");
  fs.writeFileSync(path.join(tmpDir, "assets/ui/hud_minimap_astrolabe_ring.png"), "ui-bytes");
  fs.writeFileSync(path.join(tmpDir, "assets/source_ai/raw_master.png"), "secret-raw-ai-master");
  fs.writeFileSync(path.join(tmpDir, "assets/concepts/concept_board.png"), "concept-bytes");
  fs.writeFileSync(path.join(tmpDir, "assets/archive/history/legacy_v1/hero_kiem_tu.png"), "archive-v1-bytes");
  fs.writeFileSync(path.join(tmpDir, "assets/corekit/v01b/catalog.json"), "{}");
  fs.writeFileSync(path.join(tmpDir, "assets/contact_sheet_preview.png"), "preview-bytes");

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
  fs.writeFileSync(
    path.join(tmpDir, "maps/tan_thu_thon.tmj"),
    JSON.stringify(mapJson, null, 2)
  );

  const manifestJson = {
    version: "2.0.0",
    assets: [
      {
        assetId: "portrait_hero_kiem_tu",
        file: "assets/portraits/portrait_hero_kiem_tu.png",
        category: "portrait"
      },
      {
        assetId: "sprite_hero_kiem_tu",
        file: "assets/sprites/hero_kiem_tu.png",
        category: "character_spritesheet"
      },
      {
        assetId: "contact_sheet_preview",
        file: "assets/contact_sheet_preview.png",
        category: "preview_sheet"
      }
    ],
    maps: [
      {
        zoneId: "tan_thu_thon",
        file: "maps/tan_thu_thon.tmj"
      }
    ]
  };
  fs.writeFileSync(
    path.join(tmpDir, "assets/manifest.json"),
    JSON.stringify(manifestJson, null, 2)
  );

  return tmpDir;
}

test("packageRuntimeAssets packages runtime closure and excludes source_ai, concepts, and previews", () => {
  const tmpDir = createDisposableWorkspace();
  const outDir = path.join(tmpDir, "dist");
  try {
    const res = packageRuntimeAssets({ rootDir: tmpDir, outDir });
    assert.equal(res.packagedCount, 5);
    assert.ok(fs.existsSync(path.join(outDir, "assets/portraits/portrait_hero_kiem_tu.png")));
    assert.ok(fs.existsSync(path.join(outDir, "assets/sprites/hero_kiem_tu.png")));
    assert.ok(
      fs.existsSync(path.join(outDir, "assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png"))
    );
    assert.ok(fs.existsSync(path.join(outDir, "assets/ui/hud_minimap_astrolabe_ring.png")));
    assert.ok(fs.existsSync(path.join(outDir, "maps/tan_thu_thon.tmj")));
    assert.equal(fs.existsSync(path.join(outDir, "assets/source_ai/raw_master.png")), false);
    assert.equal(fs.existsSync(path.join(outDir, "assets/concepts/concept_board.png")), false);
    assert.equal(fs.existsSync(path.join(outDir, "assets/contact_sheet_preview.png")), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("resolveRuntimeAssetClosure rejects missing runtime assets and path traversal", () => {
  const tmpDir = createDisposableWorkspace();
  try {
    assert.throws(
      () =>
        resolveRuntimeAssetClosure({
          rootDir: tmpDir,
          extraRuntimePaths: ["../outside.png"]
        }),
      /PATH_TRAVERSAL_FORBIDDEN/
    );

    assert.throws(
      () =>
        resolveRuntimeAssetClosure({
          rootDir: tmpDir,
          extraRuntimePaths: ["assets/sprites/missing_actor.png"]
        }),
      /MISSING_RUNTIME_ASSET/
    );

    assert.throws(
      () =>
        resolveRuntimeAssetClosure({
          rootDir: tmpDir,
          extraRuntimePaths: ["assets/source_ai/raw_master.png"]
        }),
      /FORBIDDEN_RUNTIME_ASSET_REQUESTED/
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("real workspace runtime closure excludes all forbidden prefixes", () => {
  const closure = resolveRuntimeAssetClosure();
  assert.ok(closure.fileCount >= 40);
  for (const item of closure.files) {
    for (const prefix of FORBIDDEN_RUNTIME_PREFIXES) {
      assert.equal(
        item.path.startsWith(prefix),
        false,
        `Forbidden prefix ${prefix} found in ${item.path}`
      );
    }
  }
});
