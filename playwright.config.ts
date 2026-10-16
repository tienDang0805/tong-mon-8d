import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: [
    {
      command: "npm run dev:server",
      url: "http://127.0.0.1:2567/health",
      reuseExistingServer: true,
      timeout: 20000
    },
    {
      command: "npm run dev:client",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      timeout: 20000
    }
  ]
});
