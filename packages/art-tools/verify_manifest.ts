import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(import.meta.dirname, "../..");
const manifestPath = path.join(rootDir, "assets/manifest.json");
const provenancePath = path.join(rootDir, "assets/provenance.json");

if (!fs.existsSync(manifestPath)) {
  throw new Error("Missing assets/manifest.json");
}

if (!fs.existsSync(provenancePath)) {
  throw new Error("Missing assets/provenance.json");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const provenance = JSON.parse(fs.readFileSync(provenancePath, "utf8"));

function runPythonCheck(args: string[]): void {
  const candidates = process.platform === "win32" ? ["python", "python3"] : ["python3", "python"];
  let lastErr: unknown;
  for (const bin of candidates) {
    try {
      execFileSync(bin, args, { stdio: "inherit" });
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

for (const asset of manifest.assets) {
  const fullPath = path.join(rootDir, asset.file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing asset file: ${asset.file}`);
  }
  const pyCheck = `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGBA")
w, h = im.size
if w != int(sys.argv[2]) or h != int(sys.argv[3]):
    raise SystemExit(f"Dimension mismatch for {sys.argv[1]}: got {w}x{h}")
alpha = im.getchannel("A")
lo, hi = alpha.getextrema()
if sys.argv[4] == "true" and lo > 0:
    raise SystemExit(f"Asset {sys.argv[1]} must have transparent background pixels")
if hi == 0:
    raise SystemExit(f"Asset {sys.argv[1]} is completely empty/transparent")
if int(sys.argv[2]) == 480 and int(sys.argv[3]) == 1920:
    for row, count in [(0, 4), (4, 6), (8, 4), (12, 4), (16, 4)]:
        frames = [im.crop((col * 80, row * 96, (col + 1) * 80, (row + 1) * 96)).tobytes() for col in range(count)]
        if len(set(frames)) < 2:
            raise SystemExit(f"Row {row} in {sys.argv[1]} lacks distinct animated frames")
elif int(sys.argv[2]) == 480 and int(sys.argv[3]) == 768:
    for row, count in [(0, 4), (1, 4), (2, 4), (3, 4), (4, 4), (5, 4), (6, 4), (7, 4)]:
        frames = [im.crop((col * 80, row * 96, (col + 1) * 80, (row + 1) * 96)).tobytes() for col in range(count)]
        if len(set(frames)) < 2:
            raise SystemExit(f"Row {row} in {sys.argv[1]} lacks distinct animated frames")
elif int(sys.argv[2]) == 320 and int(sys.argv[3]) == 96:
    frames = [im.crop((col * 80, 0, (col + 1) * 80, 96)).tobytes() for col in range(4)]
    if len(set(frames)) < 2:
        raise SystemExit(f"Stationary NPC strip {sys.argv[1]} lacks distinct animated frames")
`;
  const needTrans =
    asset.category === "portrait" ||
    asset.category === "character_spritesheet" ||
    asset.category === "creature_spritesheet" ||
    asset.category === "vfx_spritesheet"
      ? "true"
      : "false";
  runPythonCheck(["-c", pyCheck, fullPath, String(asset.width), String(asset.height), needTrans]);
}

for (const charProv of provenance.characters ?? []) {
  for (const src of charProv.sourceAiFiles ?? []) {
    const srcPath = path.join(rootDir, src.path);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing AI source file in provenance: ${src.path}`);
    }
    const actualSha = crypto.createHash("sha256").update(fs.readFileSync(srcPath)).digest("hex");
    if (actualSha !== src.sha256) {
      throw new Error(`SHA-256 mismatch for ${src.path}`);
    }
  }
  for (const rel of [
    charProv.exportedSpritesheet,
    charProv.exportedAtlas,
    charProv.exportedAtlasMetadata,
    charProv.beforeAfterSheet,
    ...Object.values(charProv.previewGifs ?? {})
  ]) {
    if (typeof rel === "string" && !fs.existsSync(path.join(rootDir, rel))) {
      throw new Error(`Missing provenance artifact: ${rel}`);
    }
  }
  if (charProv.validationResults?.qualityAudit?.status !== "pass") {
    throw new Error(`Quality audit did not pass for ${charProv.characterId}`);
  }
}

for (const [cid, promoted] of Object.entries<Record<string, string>>(provenance.visual03wPromotedAssets?.characters ?? {})) {
  for (const [pathField, shaField] of [
    ["sourceLocomotionGrid", "sourceLocomotionSha256"],
    ["sourceCombatGrid", "sourceCombatSha256"],
    ["runtimeSpritesheet", "runtimeSpritesheetSha256"]
  ] as const) {
    const relPath = promoted[pathField];
    const expectedSha = promoted[shaField];
    const absPath = path.join(rootDir, relPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Missing VISUAL-03-W promoted file for ${cid}: ${relPath}`);
    }
    const actualSha = crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
    if (actualSha !== expectedSha) {
      throw new Error(`SHA-256 mismatch for VISUAL-03-W promoted file ${relPath}`);
    }
  }
}

for (const m of manifest.maps) {
  const mapPath = path.join(rootDir, m.file);
  if (!fs.existsSync(mapPath)) {
    throw new Error(`Missing map file: ${m.file}`);
  }
  const mapJson = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  if (mapJson.width !== m.widthTiles || mapJson.height !== m.heightTiles) {
    throw new Error(`Map dimension mismatch in ${m.file}`);
  }
  const requiredLayers = ["Ground", "Paths", "GroundDetails", "Collision", "Interactables", "AbovePlayer", "Portals"];
  for (const reqLayer of requiredLayers) {
    if (!mapJson.layers.some((l: { name: string }) => l.name === reqLayer)) {
      throw new Error(`Missing layer ${reqLayer} in ${m.file}`);
    }
  }
}

console.log(
  JSON.stringify({
    verifiedAssets: manifest.assets.length,
    verifiedProvenanceCharacters: (provenance.characters ?? []).length,
    verifiedVisual03wCharacters: Object.keys(provenance.visual03wPromotedAssets?.characters ?? {}).length,
    verifiedMaps: manifest.maps.length,
    status: "OK"
  })
);
