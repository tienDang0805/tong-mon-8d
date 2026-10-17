import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  REMOVED_ACTIVE_FILES,
  REQUIRED_FILES,
  runDocSyncVerification
} from "../verify-doc-sync.mjs";

function createDisposableWorkspace(customize) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doc-sync-fixture-"));
  for (const relPath of REQUIRED_FILES) {
    const absPath = path.join(tempRoot, relPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    if (relPath === "docs/tong-mon-8d-project-atlas.html") {
      fs.writeFileSync(
        absPath,
        "<!DOCTYPE html><html><body><script>(() => { const ok = 1; return ok; })();</script></body></html>",
        "utf8"
      );
    } else {
      fs.writeFileSync(
        absPath,
        "Historical context: S1-E was NOT IMPLEMENTED before a3de054; future gate S1-F (ACCEPTED) requires file-backed PGlite restart.\n",
        "utf8"
      );
    }
  }
  if (customize) {
    customize(tempRoot);
  }
  return tempRoot;
}

test("disposable fixture with legitimate historical and future prose passes mechanical verification", () => {
  const tempRoot = createDisposableWorkspace();
  try {
    const result = runDocSyncVerification({
      rootDir: tempRoot,
      verifyFrozenTdFiles: () => []
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.failures, []);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("missing required archive or modular file fails verification", () => {
  const tempRoot = createDisposableWorkspace((root) => {
    fs.rmSync(path.join(root, "docs/archive/legacy/MASTER_PROMPT.md"));
  });
  try {
    const result = runDocSyncVerification({
      rootDir: tempRoot,
      verifyFrozenTdFiles: () => []
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.failures.some((msg) =>
        msg.includes("Missing required file: docs/archive/legacy/MASTER_PROMPT.md")
      )
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("reintroducing removed active file fails verification", () => {
  for (const removedRelPath of REMOVED_ACTIVE_FILES) {
    const tempRoot = createDisposableWorkspace((root) => {
      const absPath = path.join(root, removedRelPath);
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, "stale active file\n", "utf8");
    });
    try {
      const result = runDocSyncVerification({
        rootDir: tempRoot,
        verifyFrozenTdFiles: () => []
      });
      assert.equal(result.ok, false);
      assert.ok(
        result.failures.some((msg) =>
          msg.includes(`Removed active file must not exist at active path: ${removedRelPath}`)
        )
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});

test("frozen TD modification failure is reported", () => {
  const tempRoot = createDisposableWorkspace();
  try {
    const result = runDocSyncVerification({
      rootDir: tempRoot,
      verifyFrozenTdFiles: () => [
        "Frozen Technical Design Freeze v1.0 files modified relative to 39c41a6ddb77b93284c56da7ec053f4309ee4943:\ndocs/systems/CHARACTER.md"
      ]
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.failures.some((msg) => msg.includes("docs/systems/CHARACTER.md"))
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("invalid inline script syntax in project atlas HTML fails verification", () => {
  const tempRoot = createDisposableWorkspace((root) => {
    fs.writeFileSync(
      path.join(root, "docs/tong-mon-8d-project-atlas.html"),
      "<!DOCTYPE html><html><body><script>const broken = (;</script></body></html>",
      "utf8"
    );
  });
  try {
    const result = runDocSyncVerification({
      rootDir: tempRoot,
      verifyFrozenTdFiles: () => []
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.failures.some((msg) =>
        msg.includes("Inline script syntax error in docs/tong-mon-8d-project-atlas.html")
      )
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("real repository passes runDocSyncVerification", () => {
  const result = runDocSyncVerification();
  assert.equal(result.ok, true, result.failures.join("\n"));
});
