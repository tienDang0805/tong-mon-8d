import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const defaultRepoRoot = path.resolve(scriptDir, "..");

export const FROZEN_TD_COMMIT = "39c41a6ddb77b93284c56da7ec053f4309ee4943";

export const REQUIRED_FILES = [
  "docs/technical/SOURCE_ARCHITECTURE.md",
  "packages/game-data/src/catalogs/realms.ts",
  "packages/game-data/src/catalogs/destinies.ts",
  "packages/game-data/src/rules/characterContracts.ts",
  "apps/server/src/features/destiny/DestinyRoller.ts",
  "apps/server/src/features/character/CharacterSnapshot.ts",
  "apps/client/src/features/character/CharacterPanel.ts",
  "START_HERE.md",
  "MASTER_PROMPT.md",
  "docs/CONTEXT_AUDIT.md",
  "docs/IMPLEMENTATION_STATUS.md",
  "docs/archive/legacy/MASTER_PROMPT.md",
  "docs/archive/legacy/CONTEXT_AUDIT.md",
  "docs/archive/legacy/IMPLEMENTATION_STATUS.md",
  "docs/archive/legacy/EXTERNAL_SKILLS.md",
  "docs/MASTER_PROJECT_PLAN.md",
  "docs/ROADMAP.md",
  "docs/PROJECT_STATUS.md",
  "docs/NEXT_ACTIONS.md",
  "docs/implementation/FEATURE_LEDGER.md",
  "docs/tong-mon-8d-project-atlas.html"
];

export const REMOVED_ACTIVE_FILES = [
  "EXTERNAL_SKILLS.md",
  "docs/WORKSPACE_HANDOFF.md"
];

export function verifyGitFrozenTdFiles(rootDir = defaultRepoRoot) {
  const failures = [];
  try {
    const frozenFilesRaw = execFileSync(
      "git",
      [
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "-r",
        FROZEN_TD_COMMIT,
        "--",
        "docs/systems",
        "docs/pipelines",
        "docs/technical"
      ],
      { cwd: rootDir, encoding: "utf8" }
    )
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (frozenFilesRaw.length !== 40) {
      failures.push(
        `Expected 40 frozen TD files in ${FROZEN_TD_COMMIT}, found ${frozenFilesRaw.length}.`
      );
    } else {
      const diffOut = execFileSync(
        "git",
        ["diff", "--name-only", FROZEN_TD_COMMIT, "--", ...frozenFilesRaw],
        { cwd: rootDir, encoding: "utf8" }
      ).trim();
      if (diffOut.length > 0) {
        failures.push(
          `Frozen Technical Design Freeze v1.0 files modified relative to ${FROZEN_TD_COMMIT}:\n${diffOut}`
        );
      }
    }
  } catch (err) {
    failures.push(
      `Failed to verify frozen TD files against ${FROZEN_TD_COMMIT}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
  return failures;
}

export function runDocSyncVerification(options = {}) {
  const rootDir = options.rootDir ?? defaultRepoRoot;
  const requiredFiles = options.requiredFiles ?? REQUIRED_FILES;
  const removedActiveFiles = options.removedActiveFiles ?? REMOVED_ACTIVE_FILES;
  const verifyFrozen = options.verifyFrozenTdFiles ?? verifyGitFrozenTdFiles;
  const failures = [];

  for (const relPath of requiredFiles) {
    const absPath = path.join(rootDir, relPath);
    if (!fs.existsSync(absPath)) {
      failures.push(`Missing required file: ${relPath}`);
    }
  }

  for (const relPath of removedActiveFiles) {
    const absPath = path.join(rootDir, relPath);
    if (fs.existsSync(absPath)) {
      failures.push(`Removed active file must not exist at active path: ${relPath}`);
    }
  }

  const frozenFailures = verifyFrozen(rootDir);
  for (const item of frozenFailures) {
    failures.push(item);
  }

  const atlasPath = path.join(rootDir, "docs/tong-mon-8d-project-atlas.html");
  if (fs.existsSync(atlasPath)) {
    const atlasHtml = fs.readFileSync(atlasPath, "utf8");
    const scriptMatches = [...atlasHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
    if (scriptMatches.length === 0) {
      failures.push("docs/tong-mon-8d-project-atlas.html contains no inline <script> block.");
    } else {
      for (let idx = 0; idx < scriptMatches.length; idx += 1) {
        const scriptBody = scriptMatches[idx][1];
        try {
          new vm.Script(scriptBody);
        } catch (err) {
          failures.push(
            `Inline script syntax error in docs/tong-mon-8d-project-atlas.html (block ${
              idx + 1
            }): ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
  }

  return {
    ok: failures.length === 0,
    failures
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === scriptPath) {
  const result = runDocSyncVerification();
  if (!result.ok) {
    console.error("DOC_SYNC_VERIFICATION_FAILED");
    for (const item of result.failures) {
      console.error(` - ${item}`);
    }
    process.exit(1);
  }

  console.log(
    "DOC_SYNC_VERIFICATION_OK: 40 frozen TD files intact, required modular/active/archive files present, removed active files absent, and Project Atlas inline script syntax valid (mechanical check only; semantic status consistency is verified by scoped agent review)."
  );
}
