import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@tong-mon-8d/shared": path.resolve(rootDir, "packages/shared/src/index.ts"),
      "@tong-mon-8d/game-data": path.resolve(rootDir, "packages/game-data/src/index.ts"),
      "@tong-mon/shared": path.resolve(rootDir, "packages/shared/src/index.ts"),
      "@tong-mon/game-data": path.resolve(rootDir, "packages/game-data/src/index.ts")
    }
  },
  test: {
    include: ["apps/server/src/__tests__/**/*.test.ts"]
  }
});
