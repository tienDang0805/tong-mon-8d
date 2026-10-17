import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const FROZEN_TD_COMMIT = "39c41a6ddb77b93284c56da7ec053f4309ee4943";

const ACTIVE_DOC_PATHS = [
  "docs/MASTER_PROJECT_PLAN.md",
  "docs/ROADMAP.md",
  "docs/PROJECT_STATUS.md",
  "docs/NEXT_ACTIONS.md",
  "docs/implementation/FEATURE_LEDGER.md",
  "docs/tong-mon-8d-project-atlas.html"
];

const REQUIRED_ARCHITECTURE_FILES = [
  "docs/technical/SOURCE_ARCHITECTURE.md",
  "packages/game-data/src/catalogs/realms.ts",
  "packages/game-data/src/catalogs/destinies.ts",
  "packages/game-data/src/rules/characterContracts.ts",
  "apps/server/src/features/destiny/DestinyRoller.ts",
  "apps/server/src/features/character/CharacterSnapshot.ts",
  "apps/client/src/features/character/CharacterPanel.ts"
];

const STALE_MILESTONE_PATTERNS = [
  {
    label: "S1-B1b marked as NOT IMPLEMENTED or PROPOSED NEXT",
    regex: /`?S1-B1b`?[^\n|;.]{0,80}\b(?:NOT IMPLEMENTED|PROPOSED NEXT)\b/i
  },
  {
    label: "S1-C marked as NOT IMPLEMENTED or PROPOSED NEXT",
    regex: /`?S1-C`?[^\n|;.]{0,80}\b(?:NOT IMPLEMENTED|PROPOSED NEXT)\b/i
  },
  {
    label: "S1-D marked as NOT IMPLEMENTED or PROPOSED NEXT",
    regex: /`?S1-D`?[^\n|;.]{0,80}\b(?:NOT IMPLEMENTED|PROPOSED NEXT)\b/i
  },
  {
    label: "S1-E marked as NOT IMPLEMENTED or PROPOSED NEXT",
    regex: /`?S1-E`?[^\n|;.]{0,80}\b(?:NOT IMPLEMENTED|PROPOSED NEXT)\b/i
  },
  {
    label: "Stale cung_than_nhap_hoa trait identifier",
    regex: /\bcung_than_nhap_hoa\b/i
  },
  {
    label: "S1-F prematurely marked as COMMITTED or ACCEPTED",
    regex: /`?S1-F`?\s*\((?:COMMITTED|ACCEPTED)\)/i
  }
];

const failures = [];

for (const relPath of REQUIRED_ARCHITECTURE_FILES) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) {
    failures.push(`Missing required modular architecture file: ${relPath}`);
  }
}

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
    { cwd: repoRoot, encoding: "utf8" }
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
      { cwd: repoRoot, encoding: "utf8" }
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

for (const relPath of ACTIVE_DOC_PATHS) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) {
    failures.push(`Missing active status/governance document: ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(absPath, "utf8");
  for (const rule of STALE_MILESTONE_PATTERNS) {
    const match = content.match(rule.regex);
    if (match) {
      failures.push(
        `Stale status pattern in ${relPath} (${rule.label}): "${match[0]}"`
      );
    }
  }
}

const atlasPath = path.join(repoRoot, "docs/tong-mon-8d-project-atlas.html");
if (fs.existsSync(atlasPath)) {
  const atlasHtml = fs.readFileSync(atlasPath, "utf8");
  const scriptMatches = [...atlasHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  if (scriptMatches.length === 0) {
    failures.push("docs/tong-mon-8d-project-atlas.html contains no inline <script> block.");
  } else {
    for (let idx = 0; idx < scriptMatches.length; idx += 1) {
      const scriptBody = scriptMatches[idx][1];
      try {
        new Function(scriptBody);
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

if (failures.length > 0) {
  console.error("DOC_SYNC_VERIFICATION_FAILED");
  for (const item of failures) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

console.log(
  "DOC_SYNC_VERIFICATION_OK: 40 frozen TD files intact, required modular files present, active milestone docs synchronized, and Project Atlas script syntax valid."
);
