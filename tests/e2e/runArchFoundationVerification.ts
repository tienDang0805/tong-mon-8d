import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { Client as ColyseusClient } from "@colyseus/sdk";
import { chromium, type Page } from "playwright";
import { startGameServer } from "../../apps/server/src/index.js";
import {
  buildDirectionalFrameRange,
  getProfileDimensions,
  resolveSpriteProfileId
} from "../../apps/client/src/game/assets/SpriteProfiles.js";

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, "apps/client/dist");
const OUT_DIR = path.join(ROOT_DIR, "artifacts/architecture/ARCH-FOUNDATION-02");

async function findFreePort(startPort: number): Promise<number> {
  for (let p = startPort; p < startPort + 100; p++) {
    const isFreeDual = await new Promise<boolean>((resolve) => {
      const srv = net.createServer();
      srv.once("error", () => resolve(false));
      srv.once("listening", () => srv.close(() => resolve(true)));
      srv.listen(p);
    });
    if (!isFreeDual) {
      continue;
    }
    const isFreeV4 = await new Promise<boolean>((resolve) => {
      const srv = net.createServer();
      srv.once("error", () => resolve(false));
      srv.once("listening", () => srv.close(() => resolve(true)));
      srv.listen(p, "127.0.0.1");
    });
    if (isFreeV4) {
      return p;
    }
  }
  throw new Error(`No free port near ${startPort}`);
}

function startStaticDistServer(distDir: string, port: number): Promise<{
  close: () => Promise<void>;
  servedPaths: string[];
  notFoundPaths: string[];
}> {
  const mimeMap: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".tmj": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  };

  const servedPaths: string[] = [];
  const notFoundPaths: string[] = [];

  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const rawUrl = (req.url ?? "/").split("?")[0] || "/";
      const relUrl = rawUrl === "/" ? "index.html" : rawUrl.replace(/^\/+/, "");
      const targetAbs = path.resolve(distDir, relUrl);
      const relToDist = path.relative(distDir, targetAbs);

      if (
        relToDist.startsWith("..") ||
        path.isAbsolute(relToDist) ||
        !fs.existsSync(targetAbs) ||
        fs.statSync(targetAbs).isDirectory()
      ) {
        if (relUrl !== "favicon.ico") {
          notFoundPaths.push(rawUrl);
        }
        res.statusCode = 404;
        res.end("Not Found");
        return;
      }

      servedPaths.push(rawUrl);
      const ext = path.extname(targetAbs).toLowerCase();
      res.setHeader("Content-Type", mimeMap[ext] ?? "application/octet-stream");
      res.setHeader("Cache-Control", "no-store");
      res.statusCode = 200;
      res.end(fs.readFileSync(targetAbs));
    });

    srv.once("error", reject);
    srv.listen(port, "127.0.0.1", () => {
      resolve({
        servedPaths,
        notFoundPaths,
        close: () =>
          new Promise<void>((resClose) => {
            srv.closeAllConnections?.();
            srv.close(() => resClose());
          })
      });
    });
  });
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    try {
      return await chromium.launch({ headless: true, channel: "chrome" });
    } catch {
      return await chromium.launch({ headless: true, channel: "msedge" });
    }
  }
}

async function waitForCondition(
  check: () => Promise<boolean>,
  timeoutMs = 10000,
  label = "condition"
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for ${label}`);
}

async function readGameState(page: Page): Promise<Record<string, unknown>> {
  const raw = await page.evaluate(() => {
    const fn = (window as unknown as { render_game_to_text?: () => string })
      .render_game_to_text;
    return fn ? fn() : "{}";
  });
  return JSON.parse(raw) as Record<string, unknown>;
}

async function runTwentySessionExercise(
  wsUrl: string,
  httpUrl: string
): Promise<{
  sessionCount: number;
  zoneMix: { tan_thu_thon: number; thanh_truc_lam: number };
  durationMs: number;
  totalMovesSent: number;
  totalSnapshotsReceived: number;
  eventLoopLagMaxMs: number;
  eventLoopLagAvgMs: number;
  failures: string[];
}> {
  const sessionCount = 20;
  const tanThuCount = 12;
  const thanhTrucCount = 8;
  const failures: string[] = [];
  let totalMovesSent = 0;
  let totalSnapshotsReceived = 0;

  const lagSamples: number[] = [];
  let lastTick = performance.now();
  const lagTimer = setInterval(() => {
    const now = performance.now();
    const lag = Math.max(0, now - lastTick - 50);
    lagSamples.push(lag);
    lastTick = now;
  }, 50);

  const startMs = performance.now();
  const clients: Array<{
    room: Awaited<ReturnType<ColyseusClient["joinOrCreate"]>>;
    zoneId: "tan_thu_thon" | "thanh_truc_lam";
    x: number;
    y: number;
  }> = [];

  try {
    await Promise.all(
      Array.from({ length: sessionCount }, async (_, i) => {
        const zoneId = i < tanThuCount ? "tan_thu_thon" : "thanh_truc_lam";
        const client = new ColyseusClient(httpUrl);
        const room = await client.joinOrCreate(zoneId, {
          zoneId,
          accountId: `sim20_acc_${i}_${Date.now()}`,
          nickname: `ĐạoHữuSim${i + 1}`,
          discipline: "kiem_tu"
        });
        room.onMessage("world_snapshot", () => {
          totalSnapshotsReceived += 1;
        });
        room.onMessage("self_state", () => {});
        room.onMessage("action_result", () => {});
        room.onMessage("combat_event", () => {});
        room.onMessage("chat_message", () => {});
        const baseX = zoneId === "tan_thu_thon" ? 1536 + (i % 4) * 28 : 420 + (i % 4) * 28;
        const baseY = zoneId === "tan_thu_thon" ? 1200 + (i % 3) * 24 : 480 + (i % 3) * 24;
        clients.push({ room, zoneId, x: baseX, y: baseY });
      })
    );

    const dirs = ["down", "left", "right", "up"] as const;
    for (let step = 0; step < 12; step++) {
      for (let idx = 0; idx < clients.length; idx++) {
        const c = clients[idx]!;
        const dir = dirs[(step + idx) % dirs.length]!;
        const dx = dir === "left" ? -12 : dir === "right" ? 12 : 0;
        const dy = dir === "up" ? -12 : dir === "down" ? 12 : 0;
        c.x += dx;
        c.y += dy;
        c.room.send("move", {
          x: c.x,
          y: c.y,
          vx: dx,
          vy: dy,
          direction: dir,
          seq: step + 1
        });
        totalMovesSent += 1;
        if (step % 4 === 0 && c.zoneId === "thanh_truc_lam") {
          c.room.send("attack", {
            skillId: "basic_slash",
            direction: dir
          });
        }
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    const healthRes = await fetch(`${httpUrl}/health`);
    const healthJson = (await healthRes.json()) as {
      status: string;
      zones: {
        tan_thu_thon: { playersOnline: number };
        thanh_truc_lam: { playersOnline: number };
      };
    };
    if (healthJson.status !== "ok") {
      failures.push(`Unexpected health status: ${healthJson.status}`);
    }
    if (healthJson.zones.tan_thu_thon.playersOnline < tanThuCount) {
      failures.push(
        `Expected >= ${tanThuCount} online in tan_thu_thon, got ${healthJson.zones.tan_thu_thon.playersOnline}`
      );
    }
    if (healthJson.zones.thanh_truc_lam.playersOnline < thanhTrucCount) {
      failures.push(
        `Expected >= ${thanhTrucCount} online in thanh_truc_lam, got ${healthJson.zones.thanh_truc_lam.playersOnline}`
      );
    }
    if (totalSnapshotsReceived < sessionCount * 4) {
      failures.push(
        `Expected >= ${sessionCount * 4} snapshots across 20 sessions, got ${totalSnapshotsReceived}`
      );
    }
  } catch (err) {
    failures.push(String(err));
  } finally {
    clearInterval(lagTimer);
    await Promise.all(
      clients.map((c) =>
        Promise.race([
          Promise.resolve(c.room.leave(true)).catch(() => {}),
          new Promise<void>((r) => setTimeout(r, 200))
        ])
      )
    );
  }

  const durationMs = Math.round(performance.now() - startMs);
  const eventLoopLagMaxMs =
    lagSamples.length > 0 ? Math.round(Math.max(...lagSamples) * 100) / 100 : 0;
  const eventLoopLagAvgMs =
    lagSamples.length > 0
      ? Math.round(
          (lagSamples.reduce((a, b) => a + b, 0) / lagSamples.length) * 100
        ) / 100
      : 0;

  return {
    sessionCount,
    zoneMix: {
      tan_thu_thon: tanThuCount,
      thanh_truc_lam: thanhTrucCount
    },
    durationMs,
    totalMovesSent,
    totalSnapshotsReceived,
    eventLoopLagMaxMs,
    eventLoopLagAvgMs,
    failures
  };
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  delete process.env.DATABASE_URL;
  process.env.PGDATA_DIR = "memory://";

  if (!fs.existsSync( path.join(DIST_DIR, "index.html"))) {
    throw new Error("apps/client/dist/index.html missing. Run npm run build first.");
  }

  const serverPort = await findFreePort(2667);
  const distPort = await findFreePort(4173);
  const serverHttpUrl = `http://127.0.0.1:${serverPort}`;
  const serverWsUrl = `ws://127.0.0.1:${serverPort}`;
  const distBaseUrl = `http://127.0.0.1:${distPort}`;

  const gameSrv = await startGameServer(serverPort, {
    dataDir: "memory://",
    connectionString: "",
    enableTestClockApi: true
  });
  assert.equal(gameSrv.db.getDataDir(), "memory://");

  const distSrv = await startStaticDistServer(DIST_DIR, distPort);
  let browser: Awaited<ReturnType<typeof launchBrowser>> | undefined;

  try {
    browser = await launchBrowser();

    process.stdout.write("[STEP 1] Launching browser and checking production debug hooks...\n");
    const prodCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const prodPage = await prodCtx.newPage();
    await prodPage.goto(
      `${distBaseUrl}/?guestSlot=prod_check_${Date.now()}&serverPort=${serverPort}`
    );
    await waitForCondition(
      async () => await prodPage.locator("#btn-entry-start-play").isVisible(),
      10000,
      "Production clean-dist overlay ready"
    );
    const prodHooksExposed = await prodPage.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      return Boolean(win.__TONG_MON_DEBUG__ || win.render_game_to_text);
    });
    assert.equal(
      prodHooksExposed,
      false,
      "Production build without ?e2e=1 must not expose __TONG_MON_DEBUG__ or render_game_to_text"
    );
    await prodCtx.close();
    process.stdout.write("[STEP 2] Production debug hooks check passed. Opening page1...\n");

    const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page1 = await ctx1.newPage();
    const consoleErrors: string[] = [];
    const failedAssets: string[] = [];
    page1.on("pageerror", (err) => {
      process.stderr.write(`[PAGEERROR] ${err.stack ?? err.message}\n`);
      consoleErrors.push(err.message);
    });
    page1.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        process.stderr.write(`[BROWSER_${msg.type().toUpperCase()}] ${msg.text()}\n`);
      }
    });
    page1.on("response", (res) => {
      if (
        (res.url().includes("/assets/") || res.url().includes("/maps/")) &&
        res.status() >= 400
      ) {
        process.stderr.write(`[ASSET_404] ${res.status()} ${res.url()}\n`);
        failedAssets.push(`${res.status()} ${res.url()}`);
      }
    });

    const slot1 = `arch02_p1_${Date.now()}`;
    await page1.goto(
      `${distBaseUrl}/?guestSlot=${slot1}&e2e=1&serverPort=${serverPort}`
    );
    await waitForCondition(
      async () =>
        (await page1.locator("#btn-entry-start-play").isVisible()) &&
        (await page1.evaluate(() =>
          Boolean((window as unknown as Record<string, unknown>).render_game_to_text)
        )),
      12000,
      "Title screen and Phaser WorldScene visible on clean-dist"
    );
    await page1.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => await page1.locator("#btn-cc-create-draft").isVisible(),
      10000,
      "Draft creation visible after Bắt Đầu Chơi"
    );
    process.stdout.write("[STEP 3] Draft creation visible. Creating draft & rolling Tiên Thiên...\n");
    await page1.locator("#cc-input-name").fill("Hàn Lập Kiếm");
    await page1.locator('.cc-appearance-card[data-appearance-id="hero_kiem_tu"]').click();
    await page1.locator("#btn-cc-create-draft").click();

    await waitForCondition(
      async () => (await page1.locator(".cc-destiny-card").count()) === 3,
      8000,
      "3 Tiên Thiên cards visible"
    );
    const stRoll1 = await readGameState(page1);
    const nonce1 = (stRoll1.v02ActiveRollDraft as { rollNonce: string }).rollNonce;
    await page1.locator("#btn-cc-reroll").click();
    await waitForCondition(
      async () => {
        const st = await readGameState(page1);
        const draft = st.v02ActiveRollDraft as { rollNonce?: string } | null;
        return Boolean(draft?.rollNonce && draft.rollNonce !== nonce1);
      },
      6000,
      "Reroll updated nonce"
    );

    process.stdout.write("[STEP 4] Confirming character...\n");
    await page1.locator("#btn-cc-open-confirm").click();
    await waitForCondition(
      async () => await page1.locator("#btn-cc-confirm").isVisible(),
      5000,
      "Irreversible confirmation modal visible"
    );
    await page1.locator("#btn-cc-confirm").click();
    await waitForCondition(
      async () => {
        const hasName = ((await page1.locator("#hud-player-name").textContent()) ?? "").includes(
          "Hàn Lập Kiếm"
        );
        if (!hasName) return false;
        const st = await readGameState(page1);
        return st.localAvatarVisible === true;
      },
      10000,
      "Confirmed character spawned in Tân Thủ Thôn with visible avatar"
    );

    process.stdout.write("[STEP 5] Awarding server EXP & Hậu Thiên destiny...\n");
    const stSpawn = await readGameState(page1);
    const v02CharSpawn = stSpawn.v02Character as {
      identity: { accountId: string; characterId: string };
      destiny: { innate: string[] };
    };
    const accountId1 = v02CharSpawn.identity.accountId;
    const characterId1 = v02CharSpawn.identity.characterId;
    const innateSet = new Set(v02CharSpawn.destiny.innate);
    const { S1E_STARTER_DESTINY_CATALOG } = await import("@tong-mon-8d/game-data");
    const pickedHtTrait =
      Object.values(S1E_STARTER_DESTINY_CATALOG).find(
        (t) => t.kind === "ordinary" && !innateSet.has(t.id)
      )?.id ?? Object.keys(S1E_STARTER_DESTINY_CATALOG)[0]!;

    const expRes = await gameSrv.db.characterV02Actions.awardCharacterExpServerOnly({
      accountId: accountId1,
      characterId: characterId1,
      requestId: `arch02_exp_${Date.now()}`,
      expDelta: 500
    });
    assert.equal(expRes.ok, true, expRes.messageVi);

    const htRes = await gameSrv.db.characterV02Actions.grantAcquiredDestinyTraitServerOnly({
      accountId: accountId1,
      characterId: characterId1,
      requestId: `arch02_ht_${Date.now()}`,
      traitId: pickedHtTrait
    });
    assert.equal(htRes.ok, true, htRes.messageVi);

    process.stdout.write("[STEP 6] Reloading page1 (TITLE -> ROSTER -> Enter World) and testing [C] panel...\n");
    await page1.reload();
    await waitForCondition(
      async () => await page1.locator("#btn-entry-start-play").isVisible(),
      10000,
      "Reload lands on TITLE"
    );
    await page1.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => await page1.locator("#btn-roster-enter-world").isVisible(),
      10000,
      "Bắt Đầu Chơi opens ROSTER for populated account"
    );
    await page1.locator("#btn-roster-enter-world").click();
    await waitForCondition(
      async () => {
        const hasName = ((await page1.locator("#hud-player-name").textContent()) ?? "").includes(
          "Hàn Lập Kiếm"
        );
        if (!hasName) return false;
        const st = await readGameState(page1);
        return st.localAvatarVisible === true;
      },
      12000,
      "Reloaded character and WorldScene avatar after server EXP/Destiny grant"
    );

    await page1.keyboard.press("c");
    await waitForCondition(
      async () => await page1.locator("#cultivation-modal").isVisible(),
      5000,
      "[C] panel open"
    );
    await page1.locator('.btn-allocate-attr[data-attr="luc_dao"]').click();
    await waitForCondition(
      async () => {
        const st = await readGameState(page1);
        const ch = st.v02Character as {
          levelProgress: { allocated: { luc_dao: number } };
        };
        return ch.levelProgress.allocated.luc_dao >= 1;
      },
      5000,
      "Allocated +1 Lực Đạo in [C] panel"
    );

    const equipBtn = page1.locator(
      `.btn-equip-ht[data-trait="${pickedHtTrait}"]`
    );
    if ((await equipBtn.count()) > 0) {
      await equipBtn.click();
      await waitForCondition(
        async () => {
          const st = await readGameState(page1);
          const ch = st.v02Character as {
            destiny: { activeAcquiredSlots: Array<string | null> };
          };
          return ch.destiny.activeAcquiredSlots.includes(pickedHtTrait);
        },
        5000,
        "Equipped Hậu Thiên destiny in slot 0"
      );
    }
    await page1.locator("#btn-close-modal").click();

    process.stdout.write("[STEP 7] Testing 4-direction Hero animations & combat...\n");
    const walkObserved: Record<string, string> = {};
    for (const [key, expectedAnim] of [
      ["d", "hero_kiem_tu_walk_right"],
      ["a", "hero_kiem_tu_walk_left"],
      ["w", "hero_kiem_tu_walk_up"],
      ["s", "hero_kiem_tu_walk_down"]
    ] as const) {
      await page1.keyboard.down(key);
      await page1.waitForTimeout(160);
      const stW = await readGameState(page1);
      const actualAnim = (stW.localPlayer as { spriteAnimKey: string }).spriteAnimKey;
      walkObserved[key] = actualAnim;
      assert.equal(actualAnim, expectedAnim);
      await page1.keyboard.up(key);
    }

    await page1.keyboard.press("j");
    await page1.waitForTimeout(90);
    const stAtk = await readGameState(page1);
    assert.equal(
      (stAtk.localPlayer as { spriteAnimKey: string }).spriteAnimKey,
      "hero_kiem_tu_attack_down"
    );
    await page1.waitForTimeout(350);

    process.stdout.write("[STEP 8] Testing camera/minimap & two-zone portal round-trip...\n");
    const camAndMinimap = await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: {
          getCameraTelemetry: () => Record<string, unknown>;
          getMinimapTelemetry: () => Record<string, unknown>;
        };
      }).__TONG_MON_DEBUG__;
      return {
        camera: dbg.getCameraTelemetry(),
        minimap: dbg.getMinimapTelemetry()
      };
    });
    assert.ok(camAndMinimap.camera);
    assert.ok(camAndMinimap.minimap);

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(2768, 1200);
    });
    await page1.waitForTimeout(250);
    await page1.keyboard.press("e");
    await waitForCondition(
      async () =>
        ((await page1.locator("#hud-zone-title").textContent()) ?? "").includes(
          "Thanh Trúc Lâm"
        ),
      8000,
      "Portal transition to Thanh Trúc Lâm"
    );

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(128, 480);
    });
    await page1.waitForTimeout(950);
    await page1.keyboard.press("e");
    await waitForCondition(
      async () =>
        ((await page1.locator("#hud-zone-title").textContent()) ?? "").includes(
          "Tân Thủ Thôn"
        ),
      8000,
      "Portal return to Tân Thủ Thôn"
    );

    process.stdout.write("[STEP 9] Testing second client mutual visibility...\n");
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await ctx2.newPage();
    const slot2 = `arch02_p2_${Date.now()}`;
    await page2.goto(
      `${distBaseUrl}/?guestSlot=${slot2}&e2e=1&serverPort=${serverPort}`
    );
    await waitForCondition(
      async () => await page2.locator("#btn-entry-start-play").isVisible(),
      8000,
      "Second client title ready"
    );
    await page2.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => await page2.locator("#btn-cc-create-draft").isVisible(),
      8000,
      "Second client draft ready"
    );
    await page2.locator("#cc-input-name").fill("Tiểu Viêm Hỏa");
    await page2.locator('.cc-appearance-card[data-appearance-id="anh_7"]').click();
    await page2.locator("#btn-cc-create-draft").click();
    await waitForCondition(
      async () => await page2.locator("#btn-cc-open-confirm").isVisible(),
      8000,
      "Second client open confirm ready"
    );
    await page2.locator("#btn-cc-open-confirm").click();
    await waitForCondition(
      async () => await page2.locator("#btn-cc-confirm").isVisible(),
      5000,
      "Second client confirm modal ready"
    );
    await page2.locator("#btn-cc-confirm").click();
    await waitForCondition(async () => {
      const s1 = await readGameState(page1);
      const s2 = await readGameState(page2);
      const r1 = (s1.remotePlayers as Array<{ nickname: string }>) ?? [];
      const r2 = (s2.remotePlayers as Array<{ nickname: string }>) ?? [];
      return (
        r1.some((p) => p.nickname === "Tiểu Viêm Hỏa") &&
        r2.some((p) => p.nickname === "Hàn Lập Kiếm")
      );
    }, 10000, "Two-client mutual visibility on clean-dist");

    await ctx2.close();
    await ctx1.close();

    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(failedAssets, []);
    assert.deepEqual(distSrv.notFoundPaths, []);

    process.stdout.write("[STEP 10] Running 20-session simulated load exercise...\n");
    const loadExercise = await runTwentySessionExercise(serverWsUrl, serverHttpUrl);
    assert.deepEqual(loadExercise.failures, []);

    const heroSpritePath = path.join(ROOT_DIR, "assets/sprites/hero_kiem_tu.png");
    const heroPortraitPath = path.join(ROOT_DIR, "assets/portraits/portrait_hero_kiem_tu.png");
    const heroSpriteSha256 = crypto
      .createHash("sha256")
      .update(fs.readFileSync(heroSpritePath))
      .digest("hex");
    const heroPortraitSha256 = crypto
      .createHash("sha256")
      .update(fs.readFileSync(heroPortraitPath))
      .digest("hex");
    const activeHeroProfileId = resolveSpriteProfileId("hero_kiem_tu");
    const activeHeroDims = getProfileDimensions(activeHeroProfileId);
    const ready8WalkDims = getProfileDimensions("full_80x96_20row_8walk");
    const walkDown6Range = buildDirectionalFrameRange("full_80x96_20row", "walk", "down");
    const walkDown8Range = buildDirectionalFrameRange("full_80x96_20row_8walk", "walk", "down");
    assert.deepEqual(walkDown6Range, { start: 24, end: 29, frameRate: 10, repeat: -1 });
    assert.deepEqual(walkDown8Range, { start: 32, end: 39, frameRate: 10, repeat: -1 });

    const report = {
      taskId: "ARCH-FOUNDATION-02",
      verifiedAt: new Date().toISOString(),
      environment: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpus: os.cpus().length
      },
      databaseIsolation: {
        dataDir: gameSrv.db.getDataDir(),
        connectionString: "",
        testClockOptIn: true
      },
      heroProfileAndBindingVerification: {
        activeHeroProfileId,
        activeHeroDims,
        ready8WalkProfileId: "full_80x96_20row_8walk",
        ready8WalkDims,
        walkDown6Range,
        walkDown8Range,
        heroSpriteSha256,
        heroPortraitSha256,
        eightFrameHeroInputState: "MISSING_APPROVED_HERO_INPUT"
      },
      cleanDistSmoke: {
        distDir: "apps/client/dist",
        productionDebugHooksHiddenWithoutFlag: !prodHooksExposed,
        servedAssetCount: distSrv.servedPaths.length,
        notFoundCount: distSrv.notFoundPaths.length,
        consoleErrorCount: consoleErrors.length,
        failedAssetCount: failedAssets.length,
        walkObserved,
        cameraTelemetryVerified: true,
        minimapTelemetryVerified: true,
        twoZonePortalTraversalVerified: true,
        characterCreationAndCPanelVerified: true,
        reconnectVerified: true,
        twoClientsMutualVisibilityVerified: true
      },
      twentySessionExercise: loadExercise
    };

    const reportPath = path.join(OUT_DIR, "verification_report.json");
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(
      `ARCH-FOUNDATION-02 Verification Error (before cleanup): ${String((err as Error)?.stack ?? err)}\n`
    );
    process.exit(1);
  } finally {
    if (browser) {
      await Promise.race([
        browser.close().catch(() => {}),
        new Promise<void>((r) => setTimeout(r, 1500))
      ]);
    }
    await distSrv.close();
    await gameSrv.shutdown();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    process.stderr.write(
      `ARCH-FOUNDATION-02 Verification Failed: ${String(err?.stack ?? err)}\n`
    );
    process.exit(1);
  });
