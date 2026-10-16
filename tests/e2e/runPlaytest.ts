import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { createServer as createViteServer } from "vite";
import { startGameServer } from "../../apps/server/src/index.js";

const ROOT_DIR = process.cwd();
const ARTIFACT_DIR = path.join(ROOT_DIR, "artifacts/playtest");
const POC_FRAMES_DIR = path.join(ARTIFACT_DIR, "poc_frames");

interface DebugGameState {
  zoneId: string;
  zoneNameVi: string;
  localPlayer: {
    accountId: string;
    nickname: string;
    x: number;
    y: number;
    direction: string;
    anim: string;
    spriteAnimKey: string;
    spriteFrameIndex: number;
    realmId: string;
    realmStage: number;
    tuVi: number;
    linhThach: number;
    hp: number;
    maxHp: number;
    inventory: Array<{ itemId: string; quantity: number }>;
    quests: Record<string, { status: string }>;
    buffs: Array<{ buffId: string; name: string }>;
  };
  remotePlayers: Array<{ characterId: string; nickname: string; x: number; y: number }>;
  monsters: Array<{
    instanceId: string;
    monsterId: string;
    name: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    state: string;
  }>;
  drops: Array<{ dropId: string; itemId: string; x: number; y: number }>;
}

async function readGameState(page: Page): Promise<DebugGameState> {
  const raw = await page.evaluate(() => {
    const fn = (window as unknown as { render_game_to_text?: () => string }).render_game_to_text;
    return fn ? fn() : "{}";
  });
  return JSON.parse(raw) as DebugGameState;
}

async function waitForCondition(
  check: () => Promise<boolean>,
  timeoutMs = 10000,
  label = "condition"
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error(`Timeout waiting for ${label}`);
}

async function main(): Promise<void> {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.rmSync(POC_FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(POC_FRAMES_DIR, { recursive: true });
  process.env.PGDATA_DIR = "memory://";

  const gameSrv = await startGameServer(2567);
  const viteSrv = await createViteServer({
    configFile: path.join(ROOT_DIR, "apps/client/vite.config.ts"),
    server: { port: 5173, host: "127.0.0.1" }
  });
  await viteSrv.listen();

  const browser = await chromium.launch({ headless: true });

  try {
    const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page1 = await ctx1.newPage();

    const consoleErrors: string[] = [];
    const failedAssets: string[] = [];
    page1.on("pageerror", (err) => consoleErrors.push(err.message));
    page1.on("response", (res) => {
      if ((res.url().includes("/assets/") || res.url().includes("/maps/")) && res.status() >= 400) {
        failedAssets.push(`${res.status()} ${res.url()}`);
      }
    });

    const uniqueAcc = `hero_${Date.now()}`;
    await page1.goto(`http://127.0.0.1:5173/?account=${uniqueAcc}&name=HanLap8D`);
    await waitForCondition(
      async () => ((await page1.locator("#hud-player-name").textContent()) ?? "").includes("HanLap8D"),
      12000,
      "HanLap8D HUD ready"
    );
    await page1.waitForTimeout(900);

    await page1.screenshot({
      path: path.join(ARTIFACT_DIR, "01_tan_thu_thon_desktop_1280x720.png")
    });

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: {
          teleportLocal: (x: number, y: number, dir?: string) => void;
          setNpcAnim: (npcId: string, state: string, dir: string, durationMs?: number) => void;
          triggerHurt: () => void;
        };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(574, 412, "down");
      dbg.setNpcAnim("phi_de", "idle", "down", 2500);
      dbg.setNpcAnim("dam_lon_tien_tu", "idle", "down", 2500);
    });
    await page1.waitForTimeout(180);

    let frameCounter = 0;
    const snapCrop = async () => {
      const idx = String(frameCounter++).padStart(2, "0");
      await page1.screenshot({
        path: path.join(POC_FRAMES_DIR, `frame_${idx}.png`),
        clip: { x: 360, y: 160, width: 560, height: 360 }
      });
    };

    await snapCrop();

    for (const [key, expectedAnim] of [
      ["d", "hero_kiem_tu_walk_right"],
      ["a", "hero_kiem_tu_walk_left"],
      ["w", "hero_kiem_tu_walk_up"],
      ["s", "hero_kiem_tu_walk_down"]
    ] as const) {
      await page1.keyboard.down(key);
      await page1.waitForTimeout(140);
      const stWalk = await readGameState(page1);
      assert.equal(stWalk.localPlayer.spriteAnimKey, expectedAnim);
      await snapCrop();
      await page1.waitForTimeout(140);
      await snapCrop();
      await page1.keyboard.up(key);
    }

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: {
          teleportLocal: (x: number, y: number, dir?: string) => void;
          setNpcAnim: (npcId: string, state: string, dir: string, durationMs?: number) => void;
        };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(574, 412, "down");
      dbg.setNpcAnim("phi_de", "attack", "down", 1800);
      dbg.setNpcAnim("dam_lon_tien_tu", "cast", "down", 1800);
    });
    await page1.keyboard.press("j");
    await page1.waitForTimeout(90);
    const stAtk = await readGameState(page1);
    assert.equal(stAtk.localPlayer.spriteAnimKey, "hero_kiem_tu_attack_down");
    await snapCrop();
    await page1.waitForTimeout(110);
    await snapCrop();

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: {
          setNpcAnim: (npcId: string, state: string, dir: string, durationMs?: number) => void;
        };
      }).__TONG_MON_DEBUG__;
      dbg.setNpcAnim("phi_de", "cast", "down", 1800);
      dbg.setNpcAnim("dam_lon_tien_tu", "attack", "right", 1800);
    });
    await page1.keyboard.press("k");
    await page1.waitForTimeout(90);
    const stCast = await readGameState(page1);
    assert.equal(stCast.localPlayer.spriteAnimKey, "hero_kiem_tu_cast_down");
    await snapCrop();
    await page1.screenshot({
      path: path.join(ARTIFACT_DIR, "08_poc_sprites_showcase.png")
    });
    await page1.waitForTimeout(110);
    await snapCrop();

    await page1.keyboard.press("l");
    await page1.waitForTimeout(100);
    await snapCrop();

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { triggerHurt: () => void };
      }).__TONG_MON_DEBUG__;
      dbg.triggerHurt();
    });
    await page1.waitForTimeout(90);
    const stHurt = await readGameState(page1);
    assert.equal(stHurt.localPlayer.spriteAnimKey, "hero_kiem_tu_hurt_down");
    await snapCrop();

    execFileSync(
      "python3",
      [
        path.join(ROOT_DIR, ".agents/skills/pixel-art/scripts/gif_export.py"),
        "--frames-dir",
        POC_FRAMES_DIR,
        "--fps",
        "6",
        "--output",
        path.join(ROOT_DIR, "assets/previews/phaser_gameplay_poc_capture.gif"),
        "--json"
      ],
      { stdio: "inherit" }
    );

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(432, 404);
    });
    await page1.waitForTimeout(250);
    await page1.keyboard.press("e");

    await waitForCondition(
      async () => await page1.locator("#npc-dialogue-modal").isVisible(),
      5000,
      "Merchant dialogue modal"
    );
    await page1.screenshot({
      path: path.join(ARTIFACT_DIR, "02_merchant_shop_modal.png")
    });

    await page1.locator('.btn-shop-buy[data-item="mi_linh_thach_thanh_truc"]').click();
    await page1.waitForTimeout(250);
    await page1.locator("#btn-close-modal").click();

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(512, 412);
    });
    await page1.waitForTimeout(250);
    await page1.keyboard.press("e");

    await waitForCondition(
      async () =>
        ((await page1.locator("#npc-dialogue-modal").textContent()) ?? "").includes("Phì Đế"),
      5000,
      "Phi De dialogue modal"
    );
    await page1.locator("#btn-quest-accept").click();
    await page1.waitForTimeout(250);
    await page1.locator('.btn-quest-submit[data-item="mi_linh_thach_thanh_truc"]').click();
    await page1.waitForTimeout(350);

    await page1.screenshot({
      path: path.join(ARTIFACT_DIR, "03_phi_de_quest_ceremony.png")
    });
    await page1.locator("#btn-close-modal").click();

    const stateAfterQuest = await readGameState(page1);
    assert.equal(stateAfterQuest.localPlayer.quests.phi_de_ch1_huong_thom?.status, "completed");
    assert.ok(stateAfterQuest.localPlayer.tuVi >= 150);

    await page1.keyboard.press("b");
    await waitForCondition(
      async () => ((await page1.locator("#hud-realm-badge").textContent()) ?? "").includes("Luyện Khí"),
      5000,
      "Breakthrough to Luyen Khi"
    );
    await page1.waitForTimeout(300);
    await page1.screenshot({
      path: path.join(ARTIFACT_DIR, "04_breakthrough_luyen_khi.png")
    });

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(1120, 480);
    });
    await page1.waitForTimeout(250);
    await page1.keyboard.press("e");

    await waitForCondition(
      async () =>
        ((await page1.locator("#hud-zone-title").textContent()) ?? "").includes("Thanh Trúc Lâm"),
      8000,
      "Portal transition to Thanh Truc Lam"
    );
    await page1.waitForTimeout(600);
    await page1.screenshot({
      path: path.join(ARTIFACT_DIR, "05_thanh_truc_lam_forest.png")
    });

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
        ((await page1.locator("#hud-zone-title").textContent()) ?? "").includes("Tân Thủ Thôn"),
      8000,
      "Portal return to Tan Thu Thon"
    );

    await page1.reload();
    await waitForCondition(
      async () => ((await page1.locator("#hud-realm-badge").textContent()) ?? "").includes("Luyện Khí"),
      8000,
      "Reload persistence of Luyen Khi"
    );

    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(failedAssets, []);
    await ctx1.close();

    const ctxA = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const ctxB = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const ts = Date.now();
    await pageA.goto(`http://127.0.0.1:5173/?account=mp_a_${ts}&name=KiemKhachA&zone=thanh_truc_lam`);
    await pageB.goto(`http://127.0.0.1:5173/?account=mp_b_${ts}&name=KiemKhachB&zone=thanh_truc_lam`);

    await waitForCondition(async () => {
      const sA = await readGameState(pageA);
      const sB = await readGameState(pageB);
      return (
        sA.remotePlayers.some((p) => p.nickname === "KiemKhachB") &&
        sB.remotePlayers.some((p) => p.nickname === "KiemKhachA")
      );
    }, 10000, "Mutual multiplayer visibility");

    await pageA.locator("#hud-chat-input").fill("Đồng đạo cùng trảm Trúc Lang!");
    await pageA.locator("#hud-chat-send").click();
    await waitForCondition(
      async () =>
        ((await pageB.locator("#hud-chat-log").textContent()) ?? "").includes(
          "Đồng đạo cùng trảm Trúc Lang!"
        ),
      5000,
      "Chat broadcast"
    );

    await pageA.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(520, 480);
    });
    await pageB.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(568, 480);
    });
    await pageA.waitForTimeout(350);

    const wolfBefore = (await readGameState(pageA)).monsters.find(
      (m) => m.instanceId === "mob_truc_lang_1"
    );
    const initialWolfHp = wolfBefore?.hp ?? 110;

    await pageA.keyboard.press("k");
    await pageB.keyboard.press("j");
    await pageA.waitForTimeout(450);

    await pageA.screenshot({
      path: path.join(ARTIFACT_DIR, "06_multiplayer_shared_combat.png")
    });

    const wolfOnA = (await readGameState(pageA)).monsters.find(
      (m) => m.instanceId === "mob_truc_lang_1"
    );
    const wolfOnB = (await readGameState(pageB)).monsters.find(
      (m) => m.instanceId === "mob_truc_lang_1"
    );
    assert.ok((wolfOnA?.hp ?? 110) < initialWolfHp);
    assert.equal(wolfOnA?.hp, wolfOnB?.hp);

    await ctxB.close();
    await waitForCondition(async () => {
      const sA = await readGameState(pageA);
      return !sA.remotePlayers.some((p) => p.nickname === "KiemKhachB");
    }, 6000, "Ghost avatar cleanup on disconnect");
    await ctxA.close();

    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(`http://127.0.0.1:5173/?account=mob_${Date.now()}&name=TieuViem`);
    await waitForCondition(
      async () =>
        ((await mobilePage.locator("#hud-player-name").textContent()) ?? "").includes("TieuViem"),
      10000,
      "Mobile HUD ready"
    );
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({
      path: path.join(ARTIFACT_DIR, "07_mobile_viewport_390x844.png")
    });
    await mobileCtx.close();

    process.stdout.write(
      JSON.stringify(
        {
          playtestStatus: "ALL_GATES_PASSED",
          screenshotsGenerated: [
            "01_tan_thu_thon_desktop_1280x720.png",
            "02_merchant_shop_modal.png",
            "03_phi_de_quest_ceremony.png",
            "04_breakthrough_luyen_khi.png",
            "05_thanh_truc_lam_forest.png",
            "06_multiplayer_shared_combat.png",
            "07_mobile_viewport_390x844.png"
          ]
        },
        null,
        2
      ) + "\n"
    );
  } finally {
    await browser.close();
    await viteSrv.close();
    await gameSrv.shutdown();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    process.stderr.write(`E2E Playtest Failed: ${String(err?.stack ?? err)}\n`);
    process.exit(1);
  });
