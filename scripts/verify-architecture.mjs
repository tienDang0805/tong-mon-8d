import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const DEFAULT_ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function collectTsFiles(dirAbs, rootDir) {
  if (!fs.existsSync(dirAbs)) {
    return [];
  }
  const results = [];
  const walk = (cur) => {
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "dist" || entry.name === "node_modules" || entry.name === "__tests__") {
          continue;
        }
        walk(full);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
        !entry.name.endsWith(".test.ts") &&
        !entry.name.endsWith(".d.ts")
      ) {
        results.push(toPosix(path.relative(rootDir, full)));
      }
    }
  };
  walk(dirAbs);
  return results.sort();
}

export function extractFileImports(fileRelPosix, sourceText) {
  const sf = ts.createSourceFile(
    fileRelPosix,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const imports = [];

  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      const spec = stmt.moduleSpecifier.text;
      const clause = stmt.importClause;
      let isTypeOnly = false;
      if (clause) {
        if (clause.isTypeOnly) {
          isTypeOnly = true;
        } else if (
          !clause.name &&
          clause.namedBindings &&
          ts.isNamedImports(clause.namedBindings) &&
          clause.namedBindings.elements.length > 0 &&
          clause.namedBindings.elements.every((el) => el.isTypeOnly)
        ) {
          isTypeOnly = true;
        }
      }
      imports.push({ specifier: spec, isTypeOnly, kind: "import" });
    } else if (
      ts.isExportDeclaration(stmt) &&
      stmt.moduleSpecifier &&
      ts.isStringLiteral(stmt.moduleSpecifier)
    ) {
      const spec = stmt.moduleSpecifier.text;
      let isTypeOnly = Boolean(stmt.isTypeOnly);
      if (
        !isTypeOnly &&
        stmt.exportClause &&
        ts.isNamedExports(stmt.exportClause) &&
        stmt.exportClause.elements.length > 0 &&
        stmt.exportClause.elements.every((el) => el.isTypeOnly)
      ) {
        isTypeOnly = true;
      }
      imports.push({ specifier: spec, isTypeOnly, kind: "export" });
    }
  }

  return imports;
}

function resolveRelativeSpecifier(rootDir, fromFileRel, specifier) {
  if (!specifier.startsWith(".")) {
    return null;
  }
  const fromDir = path.dirname(path.join(rootDir, fromFileRel));
  const stripped = specifier.replace(/\.(js|mjs|cjs)$/, "");
  const candidates = [
    `${stripped}.ts`,
    `${stripped}.tsx`,
    stripped,
    path.join(stripped, "index.ts")
  ];
  for (const cand of candidates) {
    const absCand = path.resolve(fromDir, cand);
    if (fs.existsSync(absCand) && fs.statSync(absCand).isFile()) {
      return toPosix(path.relative(rootDir, absCand));
    }
  }
  return toPosix(path.relative(rootDir, path.resolve(fromDir, `${stripped}.ts`)));
}

function checkLayerViolations(fileRel, imp, resolvedRel) {
  const violations = [];
  const spec = imp.specifier;
  const target = resolvedRel ?? spec;

  if (fileRel.startsWith("packages/shared/src/")) {
    if (
      spec.startsWith("@tong-mon-8d/") ||
      target.startsWith("packages/game-data/") ||
      target.startsWith("apps/server/") ||
      target.startsWith("apps/client/")
    ) {
      violations.push({
        rule: "SHARED_LEAF_PURITY",
        from: fileRel,
        to: target,
        message: "packages/shared must not import game-data, server, or client"
      });
    }
  }

  if (fileRel.startsWith("packages/game-data/src/")) {
    if (
      spec === "@tong-mon-8d/server" ||
      spec === "@tong-mon-8d/client" ||
      spec === "phaser" ||
      spec === "colyseus" ||
      spec === "express" ||
      spec === "pg" ||
      spec === "@electric-sql/pglite" ||
      target.startsWith("apps/server/") ||
      target.startsWith("apps/client/")
    ) {
      violations.push({
        rule: "GAME_DATA_DOMAIN_PURITY",
        from: fileRel,
        to: target,
        message: "packages/game-data must only depend on @tong-mon-8d/shared or Node built-ins"
      });
    }
  }

  if (fileRel.startsWith("apps/client/src/")) {
    if (
      spec === "@tong-mon-8d/server" ||
      spec === "colyseus" ||
      spec === "express" ||
      spec === "pg" ||
      spec === "@electric-sql/pglite" ||
      target.startsWith("apps/server/")
    ) {
      violations.push({
        rule: "CLIENT_NO_SERVER_IMPORT",
        from: fileRel,
        to: target,
        message: "apps/client must never import server modules or database drivers"
      });
    }
  }

  if (fileRel.startsWith("apps/server/src/")) {
    if (
      spec === "@tong-mon-8d/client" ||
      spec === "phaser" ||
      target.startsWith("apps/client/")
    ) {
      violations.push({
        rule: "SERVER_NO_CLIENT_IMPORT",
        from: fileRel,
        to: target,
        message: "apps/server must never import client or Phaser modules"
      });
    }
  }

  if (fileRel.startsWith("apps/server/src/infrastructure/")) {
    if (
      target.startsWith("apps/server/src/features/") ||
      target.startsWith("apps/server/src/runtime/") ||
      target.startsWith("apps/server/src/transport/") ||
      target.startsWith("apps/server/src/app/")
    ) {
      violations.push({
        rule: "INFRA_LEAF_BOUNDARY",
        from: fileRel,
        to: target,
        message: "apps/server/src/infrastructure must not import features, runtime, transport, or app"
      });
    }
  }

  if (fileRel.startsWith("apps/server/src/features/")) {
    if (
      spec === "pg" ||
      spec === "@electric-sql/pglite" ||
      target === "apps/server/src/db.ts" ||
      target === "apps/server/src/index.ts" ||
      target === "apps/server/src/worldEngine.ts" ||
      target === "apps/server/src/zoneRoom.ts" ||
      target === "apps/server/src/infrastructure/database/PgAdapter.ts" ||
      target.startsWith("apps/server/src/transport/") ||
      target.startsWith("apps/server/src/app/")
    ) {
      violations.push({
        rule: "SERVER_FEATURE_ISOLATION",
        from: fileRel,
        to: target,
        message:
          "Server features must depend on leaf ports, never root barrels, concrete PG adapters, or transport"
      });
    }
  }

  if (
    fileRel.startsWith("apps/client/src/features/") ||
    fileRel.startsWith("apps/client/src/ui/")
  ) {
    if (
      !imp.isTypeOnly &&
      (target === "apps/client/src/WorldScene.ts" ||
        target === "apps/client/src/game/WorldScene.ts")
    ) {
      violations.push({
        rule: "CLIENT_UI_NO_CONCRETE_WORLDSCENE",
        from: fileRel,
        to: target,
        message: "Client UI/feature modules must use ui/ports.ts or game/assets rather than concrete WorldScene"
      });
    }
  }

  if (fileRel.startsWith("apps/client/src/game/assets/")) {
    if (spec === "node:fs" || spec === "fs") {
      violations.push({
        rule: "CLIENT_ASSETS_NO_FS_SCAN",
        from: fileRel,
        to: spec,
        message: "Client runtime asset modules must not scan filesystem directories at runtime"
      });
    }
  }

  return violations;
}

export function findRuntimeCycles(runtimeGraph) {
  const visited = new Set();
  const inStack = new Set();
  const stack = [];
  const cycles = [];
  const recordedCycleSignatures = new Set();

  const dfs = (node) => {
    visited.add(node);
    inStack.add(node);
    stack.push(node);

    const neighbors = runtimeGraph.get(node) ?? [];
    for (const next of neighbors) {
      if (!runtimeGraph.has(next)) {
        continue;
      }
      if (!visited.has(next)) {
        dfs(next);
      } else if (inStack.has(next)) {
        const idx = stack.indexOf(next);
        const cyclePath = [...stack.slice(idx), next];
        const minNode = [...cyclePath.slice(0, -1)].sort()[0];
        const minIdx = cyclePath.indexOf(minNode);
        const normalized = [
          ...cyclePath.slice(minIdx, -1),
          ...cyclePath.slice(0, minIdx),
          minNode
        ].join(" -> ");
        if (!recordedCycleSignatures.has(normalized)) {
          recordedCycleSignatures.add(normalized);
          cycles.push(cyclePath);
        }
      }
    }

    stack.pop();
    inStack.delete(node);
  };

  for (const node of [...runtimeGraph.keys()].sort()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

export const REQUIRED_OWNED_MODULES = [
  "packages/shared/src/ids/index.ts",
  "packages/shared/src/protocols/character.ts",
  "packages/shared/src/protocols/combat.ts",
  "packages/shared/src/protocols/quest.ts",
  "packages/shared/src/protocols/world.ts",
  "packages/shared/src/snapshots/index.ts",
  "packages/game-data/src/catalogs/npcs.ts",
  "packages/game-data/src/catalogs/items.ts",
  "packages/game-data/src/catalogs/recipes.ts",
  "packages/game-data/src/catalogs/techniques.ts",
  "packages/game-data/src/catalogs/monsters.ts",
  "packages/game-data/src/catalogs/zones.ts",
  "packages/game-data/src/catalogs/quests.ts",
  "packages/game-data/src/rules/td01Numeric.ts",
  "packages/game-data/src/rules/legacyProgression.ts",
  "packages/game-data/src/rules/legacySimulator.ts",
  "apps/server/src/app/createGameServer.ts",
  "apps/server/src/transport/colyseus/ZoneRoom.ts",
  "apps/server/src/transport/http/registerHttpRoutes.ts",
  "apps/server/src/infrastructure/database/DbPorts.ts",
  "apps/server/src/infrastructure/database/PgAdapter.ts",
  "apps/server/src/infrastructure/database/LegacyWorldPorts.ts",
  "apps/server/src/infrastructure/auth/GuestIdentity.ts",
  "apps/server/src/infrastructure/time/Clock.ts",
  "apps/server/src/infrastructure/idempotency/RequestReceiptStore.ts",
  "apps/server/src/features/destiny/DestinyOwnership.ts",
  "apps/server/src/features/character/CharacterValidation.ts",
  "apps/server/src/features/character/CharacterRepository.ts",
  "apps/server/src/features/character/CharacterCreationCommands.ts",
  "apps/server/src/features/character/CharacterProgressionCommands.ts",
  "apps/server/src/features/character/CharacterService.ts",
  "apps/server/src/features/character/CharacterSnapshot.ts",
  "apps/server/src/runtime/world/ZoneCollision.ts",
  "apps/server/src/runtime/world/MonsterRuntime.ts",
  "apps/server/src/runtime/world/WorldRuntime.ts",
  "apps/server/src/features/combat/LegacyCombatService.ts",
  "apps/server/src/features/economy/LegacyCommerceService.ts",
  "apps/server/src/features/quests/LegacyQuestService.ts",
  "apps/server/src/features/cultivation/LegacyMeditationService.ts",
  "apps/client/src/app/GameBootstrap.ts",
  "apps/client/src/game/WorldScene.ts",
  "apps/client/src/game/assets/SpriteProfiles.ts",
  "apps/client/src/game/assets/RuntimeAssetBindings.ts",
  "apps/client/src/game/combat/AnimationRegistry.ts",
  "apps/client/src/game/combat/CombatVisuals.ts",
  "apps/client/src/game/world/MapView.ts",
  "apps/client/src/game/world/ActorViewSystem.ts",
  "apps/client/src/game/world/CameraView.ts",
  "apps/client/src/game/world/MinimapView.ts",
  "apps/client/src/game/input/PlayerInput.ts",
  "apps/client/src/game/debug/WorldDebugController.ts",
  "apps/client/src/ui/ports.ts",
  "apps/client/src/ui/HudShell.ts",
  "apps/client/src/network/GameNetworkClient.ts",
  "apps/client/src/features/character/CharacterCreationView.ts"
];

export const COMPATIBILITY_BARREL_MAX_LINES = {
  "apps/server/src/characterV02Repository.ts": 25,
  "apps/server/src/characterV02Actions.ts": 25,
  "apps/server/src/guestIdentity.ts": 25,
  "apps/server/src/worldEngine.ts": 25,
  "apps/server/src/zoneRoom.ts": 25,
  "apps/server/src/index.ts": 40,
  "apps/client/src/WorldScene.ts": 20,
  "apps/client/src/hud.ts": 20,
  "apps/client/src/network.ts": 20,
  "apps/client/src/characterCreation.ts": 20,
  "apps/client/src/main.ts": 20
};

export function verifyArchitecture(options = {}) {
  const rootDir = path.resolve(options.rootDir ?? DEFAULT_ROOT_DIR);
  const scanRoots = options.scanRoots ?? [
    "packages/shared/src",
    "packages/game-data/src",
    "apps/server/src",
    "apps/client/src"
  ];
  const enforceOwnedModules = options.enforceOwnedModules ?? true;

  const files = [];
  for (const sr of scanRoots) {
    files.push(...collectTsFiles(path.join(rootDir, sr), rootDir));
  }

  const violations = [];
  const runtimeGraph = new Map();

  for (const fileRel of files) {
    const absPath = path.join(rootDir, fileRel);
    const content = fs.readFileSync(absPath, "utf-8");
    const imports = extractFileImports(fileRel, content);
    const runtimeTargets = [];

    for (const imp of imports) {
      const resolvedRel = resolveRelativeSpecifier(rootDir, fileRel, imp.specifier);
      if (resolvedRel && !fs.existsSync(path.join(rootDir, resolvedRel))) {
        violations.push({
          rule: "UNRESOLVED_RELATIVE_IMPORT",
          from: fileRel,
          to: imp.specifier,
          message: `Relative import ${imp.specifier} does not resolve to an existing file (${resolvedRel})`
        });
      }
      violations.push(...checkLayerViolations(fileRel, imp, resolvedRel));
      if (!imp.isTypeOnly && resolvedRel) {
        runtimeTargets.push(resolvedRel);
      }
    }

    runtimeGraph.set(fileRel, runtimeTargets);
  }

  const cycles = findRuntimeCycles(runtimeGraph);
  for (const cycle of cycles) {
    violations.push({
      rule: "RUNTIME_IMPORT_CYCLE",
      from: cycle[0],
      to: cycle.join(" -> "),
      message: `Runtime import cycle detected: ${cycle.join(" -> ")}`
    });
  }

  if (enforceOwnedModules) {
    for (const reqMod of REQUIRED_OWNED_MODULES) {
      if (!fs.existsSync(path.join(rootDir, reqMod))) {
        violations.push({
          rule: "MISSING_OWNED_MODULE",
          from: reqMod,
          to: reqMod,
          message: `Required extracted module is missing: ${reqMod}`
        });
      }
    }

    for (const [barrelRel, maxLines] of Object.entries(COMPATIBILITY_BARREL_MAX_LINES)) {
      const absBarrel = path.join(rootDir, barrelRel);
      if (fs.existsSync(absBarrel)) {
        const lineCount = fs.readFileSync(absBarrel, "utf-8").split(/\r?\n/).length;
        if (lineCount > maxLines) {
          violations.push({
            rule: "DUPLICATE_MONOLITH_RETAINED_IN_BARREL",
            from: barrelRel,
            to: barrelRel,
            message: `Compatibility barrel ${barrelRel} has ${lineCount} lines (max ${maxLines})`
          });
        }
      }
    }
  }

  return {
    ok: violations.length === 0,
    scannedFileCount: files.length,
    cycleCount: cycles.length,
    violations
  };
}

const isDirectMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectMain) {
  const report = verifyArchitecture();
  if (!report.ok) {
    process.stderr.write(
      `ARCHITECTURE_VERIFICATION_FAILED violations=${report.violations.length}\n`
    );
    for (const v of report.violations) {
      process.stderr.write(`  - [${v.rule}] ${v.from} -> ${v.to}: ${v.message}\n`);
    }
    process.exit(1);
  }
  process.stdout.write(
    `ARCHITECTURE_VERIFIED files=${report.scannedFileCount} cycles=${report.cycleCount} violations=0\n`
  );
}
