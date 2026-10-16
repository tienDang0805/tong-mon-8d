import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(import.meta.dirname, "../..");
const manifestPath = path.join(rootDir, "assets/manifest.json");

if (!fs.existsSync(manifestPath)) {
  throw new Error("Missing assets/manifest.json");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

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
`;
  const needTrans =
    asset.category === "portrait" ||
    asset.category === "character_spritesheet" ||
    asset.category === "creature_spritesheet"
      ? "true"
      : "false";
  execFileSync("python3", ["-c", pyCheck, fullPath, String(asset.width), String(asset.height), needTrans], {
    stdio: "inherit"
  });
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
  const requiredLayers = ["Ground", "Paths", "Collision", "Interactables", "AbovePlayer", "Portals"];
  for (const reqLayer of requiredLayers) {
    if (!mapJson.layers.some((l: { name: string }) => l.name === reqLayer)) {
      throw new Error(`Missing layer ${reqLayer} in ${m.file}`);
    }
  }
}

console.log(
  JSON.stringify({
    verifiedAssets: manifest.assets.length,
    verifiedMaps: manifest.maps.length,
    status: "OK"
  })
);
