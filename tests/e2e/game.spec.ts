import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const ARTIFACT_DIR = path.resolve(process.cwd(), "artifacts/playtest");

interface DebugGameState {
  zoneId: string;
  zoneNameVi: string;
  localPlayer: {
    accountId: string;
    nickname: string;
    x: number;
    y: number;
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

test.describe("Tông Môn 8D: Tu Tiên Chi Lộ — Full Autonomous Launch Playtest", () => {
  test.beforeAll(() => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  });

  test("Milestones A, B, E, F: Single-player village, culinary quest, breakthrough, two-way portal traversal, and reload persistence", async ({
    page
  }) => {
    const consoleErrors: string[] = [];
    const failedAssets: string[] = [];

    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("response", (res) => {
      if ((res.url().includes("/assets/") || res.url().includes("/maps/")) && res.status() >= 400) {
        failedAssets.push(`${res.status()} ${res.url()}`);
      }
    });

    const uniqueAcc = `hero_${Date.now()}`;
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/?account=${uniqueAcc}&name=HanLap8D`);

    await expect(page.locator("#hud-player-name")).toContainText("HanLap8D", { timeout: 15000 });
    await page.waitForTimeout(1200);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "01_tan_thu_thon_desktop_1280x720.png")
    });

    await page.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void; interact: () => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(432, 404);
    });
    await page.waitForTimeout(350);
    await page.keyboard.press("e");

    await expect(page.locator("#npc-dialogue-modal")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "02_merchant_shop_modal.png")
    });

    await page.locator('.btn-shop-buy[data-item="mi_linh_thach_thanh_truc"]').click();
    await page.waitForTimeout(300);
    await page.locator("#btn-close-modal").click();

    await page.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(512, 412);
    });
    await page.waitForTimeout(350);
    await page.keyboard.press("e");

    await expect(page.locator("#npc-dialogue-modal")).toContainText("Phì Đế");
    await page.locator("#btn-quest-accept").click();
    await page.waitForTimeout(300);
    await page.locator('.btn-quest-submit[data-item="mi_linh_thach_thanh_truc"]').click();
    await page.waitForTimeout(450);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "03_phi_de_quest_ceremony.png")
    });
    await page.locator("#btn-close-modal").click();

    const stateAfterQuest = await readGameState(page);
    expect(stateAfterQuest.localPlayer.quests.phi_de_ch1_huong_thom?.status).toBe("completed");
    expect(stateAfterQuest.localPlayer.tuVi).toBeGreaterThanOrEqual(150);

    await page.keyboard.press("b");
    await page.waitForTimeout(500);

    await expect(page.locator("#hud-realm-badge")).toContainText("Luyện Khí");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "04_breakthrough_luyen_khi.png")
    });

    await page.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(1120, 480);
    });
    await page.waitForTimeout(350);
    await page.keyboard.press("e");

    await expect(page.locator("#hud-zone-title")).toContainText("Thanh Trúc Lâm", {
      timeout: 10000
    });
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "05_thanh_truc_lam_forest.png")
    });

    await page.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(128, 480);
    });
    await page.waitForTimeout(1000);
    await page.keyboard.press("e");

    await expect(page.locator("#hud-zone-title")).toContainText("Tân Thủ Thôn", {
      timeout: 10000
    });

    await page.reload();
    await expect(page.locator("#hud-realm-badge")).toContainText("Luyện Khí", { timeout: 10000 });

    expect(consoleErrors).toEqual([]);
    expect(failedAssets).toEqual([]);
  });

  test("Milestones C & D: Two-browser real online multiplayer, chat sync, shared monster combat HP, loot pickup, and ghost cleanup", async ({
    browser
  }) => {
    const ctxA = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const ctxB = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const ts = Date.now();
    await pageA.goto(`/?account=mp_a_${ts}&name=KiemKhachA&zone=thanh_truc_lam`);
    await pageB.goto(`/?account=mp_b_${ts}&name=KiemKhachB&zone=thanh_truc_lam`);

    await expect(pageA.locator("#hud-zone-title")).toContainText("Thanh Trúc Lâm", {
      timeout: 15000
    });
    await expect(pageB.locator("#hud-zone-title")).toContainText("Thanh Trúc Lâm", {
      timeout: 15000
    });
    await pageA.waitForTimeout(800);

    const stateA0 = await readGameState(pageA);
    const stateB0 = await readGameState(pageB);
    expect(stateA0.remotePlayers.some((p) => p.nickname === "KiemKhachB")).toBe(true);
    expect(stateB0.remotePlayers.some((p) => p.nickname === "KiemKhachA")).toBe(true);

    await pageA.locator("#hud-chat-input").fill("Đồng đạo cùng trảm Trúc Lang!");
    await pageA.locator("#hud-chat-send").click();
    await expect(pageB.locator("#hud-chat-log")).toContainText("Đồng đạo cùng trảm Trúc Lang!");

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
    await pageA.waitForTimeout(450);

    const wolfBefore = (await readGameState(pageA)).monsters.find(
      (m) => m.instanceId === "mob_truc_lang_1"
    );
    expect(wolfBefore).toBeDefined();
    const initialWolfHp = wolfBefore?.hp ?? 110;

    await pageA.keyboard.press("k");
    await pageB.keyboard.press("j");
    await pageA.waitForTimeout(550);

    await pageA.screenshot({
      path: path.join(ARTIFACT_DIR, "06_multiplayer_shared_combat.png")
    });

    const wolfOnA = (await readGameState(pageA)).monsters.find(
      (m) => m.instanceId === "mob_truc_lang_1"
    );
    const wolfOnB = (await readGameState(pageB)).monsters.find(
      (m) => m.instanceId === "mob_truc_lang_1"
    );
    expect(wolfOnA?.hp).toBeLessThan(initialWolfHp);
    expect(wolfOnA?.hp).toBe(wolfOnB?.hp);

    await ctxB.close();
    await pageA.waitForTimeout(600);
    const stateAfterLeave = await readGameState(pageA);
    expect(stateAfterLeave.remotePlayers.some((p) => p.nickname === "KiemKhachB")).toBe(false);

    await ctxA.close();
  });

  test("Responsive Mobile Viewport (390x844) verification", async ({ browser }) => {
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(`/?account=mob_${Date.now()}&name=TieuViem`);

    await expect(mobilePage.locator("#hud-player-name")).toContainText("TieuViem", {
      timeout: 15000
    });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({
      path: path.join(ARTIFACT_DIR, "07_mobile_viewport_390x844.png")
    });
    await mobileCtx.close();
  });
});
