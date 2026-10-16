import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(clientDir, "../..");

function serveWorkspaceAssetsPlugin(): Plugin {
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".json": "application/json",
    ".tmj": "application/json"
  };

  const handler = (
    req: { url?: string },
    res: {
      setHeader: (k: string, v: string) => void;
      statusCode: number;
      end: (data?: Buffer | string) => void;
    },
    next: () => void
  ) => {
    const rawUrl = req.url?.split("?")[0] ?? "";
    if (!rawUrl.startsWith("/assets/") && !rawUrl.startsWith("/maps/")) {
      next();
      return;
    }
    const targetPath = path.join(rootDir, rawUrl);
    if (!targetPath.startsWith(rootDir) || !fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
      next();
      return;
    }
    const ext = path.extname(targetPath).toLowerCase();
    res.setHeader("Content-Type", mimeMap[ext] ?? "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.statusCode = 200;
    res.end(fs.readFileSync(targetPath));
  };

  return {
    name: "serve-workspace-assets",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  root: clientDir,
  plugins: [serveWorkspaceAssetsPlugin()],
  resolve: {
    alias: {
      "@tong-mon-8d/shared": path.resolve(rootDir, "packages/shared/src/index.ts"),
      "@tong-mon-8d/game-data": path.resolve(rootDir, "packages/game-data/src/index.ts")
    }
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
    fs: {
      allow: [rootDir]
    }
  },
  preview: {
    port: 5173,
    host: "127.0.0.1"
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
