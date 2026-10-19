import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { verifyArchitecture } from "../verify-architecture.mjs";

test("real workspace passes verifyArchitecture with zero cycles and zero violations", () => {
  const report = verifyArchitecture();
  assert.equal(
    report.ok,
    true,
    `Expected zero violations, got: ${JSON.stringify(report.violations, null, 2)}`
  );
  assert.equal(report.cycleCount, 0);
  assert.ok(report.scannedFileCount >= 55);
});

test("verifyArchitecture detects forbidden cross-layer imports in disposable fixture", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d-arch-test-"));
  try {
    fs.mkdirSync(path.join(tmpDir, "packages/shared/src"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "apps/client/src"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "apps/server/src/features/character"), {
      recursive: true
    });
    fs.mkdirSync(path.join(tmpDir, "apps/server/src/infrastructure/database"), {
      recursive: true
    });

    fs.writeFileSync(
      path.join(tmpDir, "packages/shared/src/bad.ts"),
      `import { REALMS_ORDERED } from "@tong-mon-8d/game-data";\nexport const x = REALMS_ORDERED;\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, "apps/client/src/badClient.ts"),
      `import { Pool } from "pg";\nexport const p = Pool;\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, "apps/server/src/infrastructure/database/PgAdapter.ts"),
      `export const adapter = true;\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, "apps/server/src/features/character/badFeature.ts"),
      `import { adapter } from "../../infrastructure/database/PgAdapter.js";\nexport const f = adapter;\n`
    );

    const report = verifyArchitecture({
      rootDir: tmpDir,
      enforceOwnedModules: false
    });

    assert.equal(report.ok, false);
    const rules = new Set(report.violations.map((v) => v.rule));
    assert.ok(rules.has("SHARED_LEAF_PURITY"));
    assert.ok(rules.has("CLIENT_NO_SERVER_IMPORT"));
    assert.ok(rules.has("SERVER_FEATURE_ISOLATION"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("verifyArchitecture detects runtime import cycles while allowing type-only cycles", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d-arch-cycle-"));
  try {
    fs.mkdirSync(path.join(tmpDir, "apps/server/src/runtime"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, "apps/server/src/runtime/a.ts"),
      `import { bVal } from "./b.js";\nexport const aVal = bVal + 1;\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, "apps/server/src/runtime/b.ts"),
      `import { aVal } from "./a.js";\nexport const bVal = aVal + 1;\n`
    );

    const cycleReport = verifyArchitecture({
      rootDir: tmpDir,
      enforceOwnedModules: false
    });
    assert.equal(cycleReport.ok, false);
    assert.equal(cycleReport.cycleCount, 1);
    assert.ok(
      cycleReport.violations.some((v) => v.rule === "RUNTIME_IMPORT_CYCLE")
    );

    fs.writeFileSync(
      path.join(tmpDir, "apps/server/src/runtime/b.ts"),
      `import type { aVal } from "./a.js";\nexport const bVal: typeof aVal = 1;\n`
    );
    const typeOnlyReport = verifyArchitecture({
      rootDir: tmpDir,
      enforceOwnedModules: false
    });
    assert.equal(typeOnlyReport.ok, true);
    assert.equal(typeOnlyReport.cycleCount, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
