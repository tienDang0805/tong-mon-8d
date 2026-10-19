import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

export const FORBIDDEN_RUNTIME_PREFIXES = [
  "assets/source_ai/",
  "assets/raw_source_ai/",
  "assets/concepts/",
  "assets/archive/",
  "assets/corekit/",
  "assets/previews/",
  "assets/atlases/",
  "assets/sprites/gifs/",
  "assets/sprites/legacy_v1/"
];

export const FORBIDDEN_RUNTIME_EXACT = new Set([
  "assets/contact_sheet_preview.png",
  "assets/provenance.json"
]);

export const ALLOWED_RUNTIME_PREFIXES = [
  "assets/portraits/",
  "assets/sprites/",
  "assets/props/",
  "assets/tilesets/",
  "assets/vfx/",
  "assets/ui/",
  "maps/"
];

function toPosixPath(p) {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

function sha256File(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

export function isForbiddenRuntimeAssetPath(relPosix) {
  const norm = toPosixPath(relPosix);
  if (FORBIDDEN_RUNTIME_EXACT.has(norm)) {
    return true;
  }
  return FORBIDDEN_RUNTIME_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

export function isAllowedRuntimeAssetPath(relPosix) {
  const norm = toPosixPath(relPosix);
  if (isForbiddenRuntimeAssetPath(norm)) {
    return false;
  }
  return ALLOWED_RUNTIME_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

export function assertSafeWorkspaceAssetPath(rootDir, relPath) {
  if (!relPath || typeof relPath !== "string") {
    throw new Error("INVALID_ASSET_PATH: Empty or non-string path");
  }
  if (path.isAbsolute(relPath) || relPath.startsWith("/") || relPath.startsWith("\\")) {
    throw new Error(`ABSOLUTE_ASSET_PATH_FORBIDDEN: ${relPath}`);
  }
  const cleanRel = toPosixPath(relPath);
  const segments = cleanRel.split("/");
  if (segments.some((seg) => seg === "..")) {
    throw new Error(`PATH_TRAVERSAL_FORBIDDEN: ${relPath}`);
  }
  const absRoot = path.resolve(rootDir);
  const absTarget = path.resolve(absRoot, cleanRel);
  const relFromRoot = path.relative(absRoot, absTarget);
  if (relFromRoot.startsWith("..") || path.isAbsolute(relFromRoot)) {
    throw new Error(`PATH_ESCAPES_WORKSPACE: ${relPath}`);
  }
  if (!fs.existsSync(absTarget)) {
    throw new Error(`MISSING_RUNTIME_ASSET: ${cleanRel}`);
  }
  const stat = fs.lstatSync(absTarget);
  if (stat.isSymbolicLink()) {
    const realRoot = fs.realpathSync(absRoot);
    const realTarget = fs.realpathSync(absTarget);
    const realRel = path.relative(realRoot, realTarget);
    if (realRel.startsWith("..") || path.isAbsolute(realRel)) {
      throw new Error(`SYMLINK_ESCAPES_WORKSPACE: ${cleanRel}`);
    }
  }
  if (stat.isDirectory()) {
    throw new Error(`EXPECTED_FILE_NOT_DIRECTORY: ${cleanRel}`);
  }
  return { cleanRel: toPosixPath(relFromRoot), absTarget };
}

function collectFilesRecursively(rootDir, subDir, filterFn) {
  const absSub = path.join(rootDir, subDir);
  if (!fs.existsSync(absSub)) {
    return [];
  }
  const results = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const rel = toPosixPath(path.relative(rootDir, full));
        if (!filterFn || filterFn(rel)) {
          results.push(rel);
        }
      }
    }
  };
  walk(absSub);
  return results.sort();
}

function parseTsxImageReferences(rootDir, tsxRelPath) {
  const { absTarget } = assertSafeWorkspaceAssetPath(rootDir, tsxRelPath);
  const content = fs.readFileSync(absTarget, "utf-8");
  const tsxDir = path.dirname(absTarget);
  const absRoot = path.resolve(rootDir);
  const refs = [];
  const regex = /<image\b[^>]*\bsource=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawSource = match[1];
    const resolvedAbs = path.resolve(tsxDir, rawSource);
    const relFromRoot = toPosixPath(path.relative(absRoot, resolvedAbs));
    if (relFromRoot.startsWith("..")) {
      throw new Error(`TSX_IMAGE_ESCAPES_WORKSPACE: ${rawSource} in ${tsxRelPath}`);
    }
    assertSafeWorkspaceAssetPath(rootDir, relFromRoot);
    refs.push(relFromRoot);
  }
  return refs;
}

export function resolveTiledMapDependencies(rootDir, mapRelPath) {
  const { cleanRel, absTarget } = assertSafeWorkspaceAssetPath(rootDir, mapRelPath);
  const rawJson = JSON.parse(fs.readFileSync(absTarget, "utf-8"));
  const mapDir = path.dirname(absTarget);
  const absRoot = path.resolve(rootDir);
  const deps = [cleanRel];

  for (const ts of rawJson.tilesets ?? []) {
    if (typeof ts.image === "string" && ts.image.trim().length > 0) {
      const resolvedAbs = path.resolve(mapDir, ts.image);
      const relFromRoot = toPosixPath(path.relative(absRoot, resolvedAbs));
      if (relFromRoot.startsWith("..")) {
        throw new Error(`TILED_IMAGE_ESCAPES_WORKSPACE: ${ts.image} in ${cleanRel}`);
      }
      assertSafeWorkspaceAssetPath(rootDir, relFromRoot);
      if (isForbiddenRuntimeAssetPath(relFromRoot)) {
        throw new Error(`FORBIDDEN_RUNTIME_ASSET_IN_MAP: ${relFromRoot}`);
      }
      deps.push(relFromRoot);
    }
    if (typeof ts.source === "string" && ts.source.trim().length > 0) {
      const resolvedTsxAbs = path.resolve(mapDir, ts.source);
      const tsxRel = toPosixPath(path.relative(absRoot, resolvedTsxAbs));
      if (tsxRel.startsWith("..")) {
        throw new Error(`TILED_TSX_ESCAPES_WORKSPACE: ${ts.source} in ${cleanRel}`);
      }
      assertSafeWorkspaceAssetPath(rootDir, tsxRel);
      deps.push(tsxRel);
      for (const imgRel of parseTsxImageReferences(rootDir, tsxRel)) {
        if (isForbiddenRuntimeAssetPath(imgRel)) {
          throw new Error(`FORBIDDEN_RUNTIME_ASSET_IN_TSX: ${imgRel}`);
        }
        deps.push(imgRel);
      }
    }
  }

  return deps;
}

export function resolveRuntimeAssetClosure(options = {}) {
  const rootDir = path.resolve(options.rootDir ?? DEFAULT_ROOT_DIR);
  const manifestRel = options.manifestRelPath ?? "assets/manifest.json";
  const { absTarget: manifestAbs } = assertSafeWorkspaceAssetPath(rootDir, manifestRel);
  const manifest = JSON.parse(fs.readFileSync(manifestAbs, "utf-8"));

  const closureSet = new Set();

  for (const entry of manifest.assets ?? []) {
    if (!entry || typeof entry.file !== "string") {
      continue;
    }
    const rel = toPosixPath(entry.file);
    if (entry.category === "preview_sheet" || isForbiddenRuntimeAssetPath(rel)) {
      continue;
    }
    if (!isAllowedRuntimeAssetPath(rel)) {
      throw new Error(`DISALLOWED_RUNTIME_MANIFEST_ASSET: ${rel}`);
    }
    const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, rel);
    closureSet.add(cleanRel);
  }

  for (const mapEntry of manifest.maps ?? []) {
    if (!mapEntry || typeof mapEntry.file !== "string") {
      continue;
    }
    for (const dep of resolveTiledMapDependencies(rootDir, mapEntry.file)) {
      closureSet.add(dep);
    }
  }

  for (const portraitRel of collectFilesRecursively(
    rootDir,
    "assets/portraits",
    (r) => r.endsWith(".png") && !isForbiddenRuntimeAssetPath(r)
  )) {
    const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, portraitRel);
    closureSet.add(cleanRel);
  }

  for (const spriteRel of collectFilesRecursively(
    rootDir,
    "assets/sprites",
    (r) => r.endsWith(".png") && !isForbiddenRuntimeAssetPath(r)
  )) {
    const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, spriteRel);
    closureSet.add(cleanRel);
  }

  for (const propRel of collectFilesRecursively(
    rootDir,
    "assets/props",
    (r) => r.endsWith(".png") && !isForbiddenRuntimeAssetPath(r)
  )) {
    const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, propRel);
    closureSet.add(cleanRel);
  }

  for (const vfxRel of collectFilesRecursively(
    rootDir,
    "assets/vfx",
    (r) => r.endsWith(".png") && !isForbiddenRuntimeAssetPath(r)
  )) {
    const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, vfxRel);
    closureSet.add(cleanRel);
  }

  for (const uiRel of collectFilesRecursively(
    rootDir,
    "assets/ui",
    (r) =>
      (r.endsWith(".png") || r.endsWith(".jpg") || r.endsWith(".json")) &&
      !isForbiddenRuntimeAssetPath(r)
  )) {
    const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, uiRel);
    closureSet.add(cleanRel);
  }

  const spriteProfilesPath = path.join(
    rootDir,
    "apps/client/src/game/assets/SpriteProfiles.ts"
  );
  if (fs.existsSync(spriteProfilesPath)) {
    const spText = fs.readFileSync(spriteProfilesPath, "utf-8");
    const spRegex = /spriteKey:\s*["']([a-z0-9_]+)["']/g;
    let match;
    while ((match = spRegex.exec(spText)) !== null) {
      const rel = `assets/sprites/${match[1]}.png`;
      const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, rel);
      closureSet.add(cleanRel);
    }
  }

  const bindingsPath = path.join(
    rootDir,
    "apps/client/src/game/assets/RuntimeAssetBindings.ts"
  );
  if (fs.existsSync(bindingsPath)) {
    const rbText = fs.readFileSync(bindingsPath, "utf-8");
    const propBlockMatch = rbText.match(/PROP_KEYS\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
    if (propBlockMatch) {
      const pkRegex = /["']([a-z0-9_]+)["']/g;
      let match;
      while ((match = pkRegex.exec(propBlockMatch[1])) !== null) {
        const rel = `assets/props/${match[1]}.png`;
        const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, rel);
        closureSet.add(cleanRel);
      }
    }
    const urlRegex = /url:\s*["']\/?((?:assets|maps)\/[^"']+)["']/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(rbText)) !== null) {
      const rel = toPosixPath(urlMatch[1]);
      if (rel.endsWith(".tmj")) {
        for (const dep of resolveTiledMapDependencies(rootDir, rel)) {
          closureSet.add(dep);
        }
      } else {
        const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, rel);
        closureSet.add(cleanRel);
      }
    }
  }

  if (Array.isArray(options.extraRuntimePaths)) {
    for (const rawExtra of options.extraRuntimePaths) {
      const { cleanRel } = assertSafeWorkspaceAssetPath(rootDir, rawExtra);
      if (isForbiddenRuntimeAssetPath(cleanRel) || !isAllowedRuntimeAssetPath(cleanRel)) {
        throw new Error(`FORBIDDEN_RUNTIME_ASSET_REQUESTED: ${cleanRel}`);
      }
      closureSet.add(cleanRel);
    }
  }

  const files = Array.from(closureSet)
    .sort()
    .map((relPath) => {
      const { absTarget } = assertSafeWorkspaceAssetPath(rootDir, relPath);
      const stat = fs.statSync(absTarget);
      return {
        path: relPath,
        bytes: stat.size,
        sha256: sha256File(absTarget)
      };
    });

  return {
    rootDir,
    manifestVersion: String(manifest.version ?? "1.0.0"),
    fileCount: files.length,
    files
  };
}

export function packageRuntimeAssets(options = {}) {
  const closure = resolveRuntimeAssetClosure(options);
  const outDir = path.resolve(
    options.outDir ?? path.join(closure.rootDir, "apps/client/dist")
  );
  fs.mkdirSync(outDir, { recursive: true });

  for (const item of closure.files) {
    const srcAbs = path.join(closure.rootDir, item.path);
    const destAbs = path.resolve(outDir, item.path);
    const relToOut = path.relative(outDir, destAbs);
    if (relToOut.startsWith("..") || path.isAbsolute(relToOut)) {
      throw new Error(`OUTPUT_PATH_ESCAPES_DIST: ${item.path}`);
    }
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    fs.copyFileSync(srcAbs, destAbs);
  }

  const runtimeProjection = {
    version: closure.manifestVersion,
    packagedCount: closure.fileCount,
    files: closure.files
  };
  const projectionPath = path.join(outDir, "runtime-asset-manifest.json");
  fs.writeFileSync(
    projectionPath,
    `${JSON.stringify(runtimeProjection, null, 2)}\n`,
    "utf-8"
  );

  return {
    outDir,
    projectionPath,
    packagedCount: closure.fileCount,
    files: closure.files
  };
}

const isDirectMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectMain) {
  const result = packageRuntimeAssets();
  process.stdout.write(
    `PACKAGED_RUNTIME_ASSETS count=${result.packagedCount} outDir=${result.outDir}\n`
  );
}
