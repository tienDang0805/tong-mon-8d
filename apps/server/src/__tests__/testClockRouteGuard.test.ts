import http from "node:http";
import express from "express";
import { describe, expect, it } from "vitest";
import {
  isTestClockApiExplicitlyEnabled,
  registerHttpRoutes
} from "../transport/http/registerHttpRoutes.js";
import { GameDatabase } from "../db.js";
import { AuthoritativeWorldEngine } from "../runtime/world/WorldRuntime.js";

async function postJson(
  url: string,
  body: Record<string, unknown>
): Promise<{ status: number; text: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return {
    status: res.status,
    text: await res.text()
  };
}

describe("test clock HTTP route guard", () => {
  it("never infers test clock authorization from DATABASE_URL or default env", () => {
    expect(isTestClockApiExplicitlyEnabled(undefined, {})).toBe(false);
    expect(
      isTestClockApiExplicitlyEnabled(undefined, {
        DATABASE_URL: "postgresql://localhost:5432/test_db",
        VITEST: "true"
      })
    ).toBe(false);
    expect(
      isTestClockApiExplicitlyEnabled(undefined, {
        ENABLE_TEST_CLOCK_API: "true"
      })
    ).toBe(true);
    expect(
      isTestClockApiExplicitlyEnabled(false, {
        ENABLE_TEST_CLOCK_API: "true"
      })
    ).toBe(false);
    expect(isTestClockApiExplicitlyEnabled(true, {})).toBe(true);
  });

  it("rejects /api/test/advance-clock with 404 by default without mutating server time", async () => {
    const db = new GameDatabase({ connectionString: "", dataDir: "memory://" });
    const engine = new AuthoritativeWorldEngine(db);
    const app = express();
    registerHttpRoutes({
      app,
      db,
      getEngine: () => engine,
      getActiveZoneRoom: () => undefined,
      enableTestClockApi: false
    });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const before = engine.now();
      const response = await postJson(
        `http://127.0.0.1:${port}/api/test/advance-clock`,
        { deltaMs: 600000 }
      );
      const after = engine.now();
      expect(response.status).toBe(404);
      expect(after - before).toBeLessThan(5000);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("mounts /api/test/advance-clock only when explicitly opted in", async () => {
    const db = new GameDatabase({ connectionString: "", dataDir: "memory://" });
    const engine = new AuthoritativeWorldEngine(db);
    const app = express();
    registerHttpRoutes({
      app,
      db,
      getEngine: () => engine,
      getActiveZoneRoom: () => undefined,
      enableTestClockApi: true
    });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const before = engine.now();
      const response = await postJson(
        `http://127.0.0.1:${port}/api/test/advance-clock`,
        { deltaMs: 600000 }
      );
      const after = engine.now();
      expect(response.status).toBe(200);
      expect(after - before).toBeGreaterThanOrEqual(595000);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
