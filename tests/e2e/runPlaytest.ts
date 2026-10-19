import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { createServer as createViteServer } from "vite";
import { startGameServer } from "../../apps/server/src/index.js";

const ROOT_DIR = process.cwd();
const RUN_ID =
  process.env.PLAYTEST_RUN_ID?.trim() ||
  `run_${new Date().toISOString().replace(/[:.]/g, "-")}`;
const ARTIFACT_DIR = path.join(ROOT_DIR, "artifacts/playtest/runs", RUN_ID);
const POC_FRAMES_DIR = path.join(ARTIFACT_DIR, "poc_frames");

async function assertPortFree(port: number, host = "127.0.0.1"): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tester = net.createServer();
    tester.once("error", (err) => {
      reject(
        new Error(
          `E2E port conflict on ${host}:${port} (${String(err)}). Stop any running server before executing test:e2e.`
        )
      );
    });
    tester.once("listening", () => {
      tester.close(() => resolve());
    });
    tester.listen(port, host);
  });
}

interface DebugGameState {
  zoneId: string;
  zoneNameVi: string;
  v02Mode?: boolean;
  v02Character?: {
    identity: {
      characterId: string;
      accountId: string;
      name: string;
      appearanceId: string;
      creationState: "draft" | "confirmed";
    };
    levelProgress: {
      level: number;
      freeAttributePoints: number;
    };
    cultivation: {
      realmId: string;
      realmStage: number;
    };
    destiny: {
      innate: [string, string, string];
      activeAcquiredSlots: [string | null, string | null, string | null];
    } | null;
  } | null;
  v02ActiveRollDraft?: {
    characterCreationId: string;
    rollNonce: string;
    candidateTraitIds: [string, string, string];
    expiresAtMs: number;
  } | null;
  localAvatarVisible?: boolean;
  localAppearanceKey?: string;
  localPlayer: {
    accountId: string;
    nickname: string;
    appearanceId?: string;
    level?: number;
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
  remotePlayers: Array<{ characterId: string; nickname: string; appearanceId?: string; x: number; y: number }>;
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

async function launchPlaytestBrowser() {
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

async function main(): Promise<void> {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.rmSync(POC_FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(POC_FRAMES_DIR, { recursive: true });
  delete process.env.DATABASE_URL;
  process.env.PGDATA_DIR = "memory://";

  const serverPort = Number(process.env.PLAYTEST_SERVER_PORT || 2567);
  const clientPort = Number(process.env.PLAYTEST_CLIENT_PORT || 5173);
  const serverHttpUrl = `http://127.0.0.1:${serverPort}`;
  process.env.VITE_SERVER_URL = serverHttpUrl;

  await assertPortFree(serverPort);
  await assertPortFree(clientPort);

  const gameSrv = await startGameServer(serverPort, {
    dataDir: "memory://",
    connectionString: "",
    enableTestClockApi: true
  });
  assert.equal(gameSrv.db.getDataDir(), "memory://");

  const viteSrv = await createViteServer({
    configFile: path.join(ROOT_DIR, "apps/client/vite.config.ts"),
    define: {
      "import.meta.env.VITE_SERVER_URL": JSON.stringify(serverHttpUrl)
    },
    server: { port: clientPort, host: "127.0.0.1", strictPort: true }
  });
  await viteSrv.listen();
  const clientBaseUrl = `http://127.0.0.1:${clientPort}`;

  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    browser = await launchPlaytestBrowser();
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
    await page1.goto(`${clientBaseUrl}/?account=${uniqueAcc}&name=HanLap8D&e2e=1`);
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
      dbg.teleportLocal(1536, 1180, "down");
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
      dbg.teleportLocal(1536, 1180, "down");
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
    await page1.waitForTimeout(320);

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { triggerHurt: () => void };
      }).__TONG_MON_DEBUG__;
      dbg.triggerHurt();
    });
    await waitForCondition(
      async () => (await readGameState(page1)).localPlayer.spriteAnimKey === "hero_kiem_tu_hurt_down",
      1500,
      "hero_kiem_tu_hurt_down anim"
    );
    const stHurt = await readGameState(page1);
    assert.equal(stHurt.localPlayer.spriteAnimKey, "hero_kiem_tu_hurt_down");
    await snapCrop();

    const gifOutputPath =
      process.env.UPDATE_PREVIEW_GIF === "1"
        ? path.join(ROOT_DIR, "assets/previews/phaser_gameplay_poc_capture.gif")
        : path.join(ARTIFACT_DIR, "phaser_gameplay_poc_capture.gif");

    const venvWinPython = path.join(ROOT_DIR, ".venv/Scripts/python.exe");
    const venvPosixPython = path.join(ROOT_DIR, ".venv/bin/python");
    const pythonBin = fs.existsSync(venvWinPython)
      ? venvWinPython
      : fs.existsSync(venvPosixPython)
        ? venvPosixPython
        : process.platform === "win32"
          ? "python"
          : "python3";

    execFileSync(
      pythonBin,
      [
        path.join(ROOT_DIR, ".agents/skills/pixel-art/scripts/gif_export.py"),
        "--frames-dir",
        POC_FRAMES_DIR,
        "--fps",
        "6",
        "--output",
        gifOutputPath,
        "--json"
      ],
      { stdio: "inherit" }
    );

    await page1.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(1056, 1200);
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
      dbg.teleportLocal(1536, 1140);
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
      dbg.teleportLocal(2768, 1200);
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
    await pageA.goto(`${clientBaseUrl}/?account=mp_a_${ts}&name=KiemKhachA&zone=thanh_truc_lam`);
    await pageB.goto(`${clientBaseUrl}/?account=mp_b_${ts}&name=KiemKhachB&zone=thanh_truc_lam`);

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
    await mobilePage.goto(`${clientBaseUrl}/?account=mob_${Date.now()}&name=TieuViem`);
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

    const ctxS1E = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const pageS1E = await ctxS1E.newPage();
    const s1eErrors: string[] = [];
    pageS1E.on("pageerror", (err) => s1eErrors.push(err.message));

    await pageS1E.goto(`${clientBaseUrl}/?guestSlot=s1e_desktop_${Date.now()}`);
    await waitForCondition(
      async () => await pageS1E.locator("#btn-entry-start-play").isVisible(),
      10000,
      "S1-E Title screen visible"
    );
    await pageS1E.waitForTimeout(300);

    const preConfirmState = await readGameState(pageS1E);
    assert.equal(preConfirmState.v02Mode, true);
    assert.equal(preConfirmState.localAvatarVisible, false);

    await pageS1E.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => await pageS1E.locator("#cc-draft-section").isVisible(),
      8000,
      "S1-E Character Creation draft section visible"
    );

    await pageS1E.locator("#cc-input-name").fill("Lâm Động 8D");
    await pageS1E.locator('.cc-appearance-card[data-appearance-id="hoa_tran"]').click();
    await pageS1E.locator("#btn-cc-create-draft").click();

    await waitForCondition(
      async () => await pageS1E.locator("#cc-rolled-section").isVisible(),
      8000,
      "S1-E Rolled section visible"
    );
    await waitForCondition(
      async () => (await pageS1E.locator(".cc-destiny-card").count()) === 3,
      5000,
      "S1-E 3 Tiên Thiên cards rendered"
    );

    const rolledState1 = await readGameState(pageS1E);
    assert.ok(rolledState1.v02ActiveRollDraft);
    assert.equal(new Set(rolledState1.v02ActiveRollDraft.candidateTraitIds).size, 3);
    assert.equal(rolledState1.localAvatarVisible, false);
    const firstNonce = rolledState1.v02ActiveRollDraft.rollNonce;

    await pageS1E.screenshot({
      path: path.join(ARTIFACT_DIR, "09_s1e_character_creation_desktop_1280x720.png")
    });

    await pageS1E.locator("#btn-cc-reroll").click();
    await waitForCondition(
      async () => {
        const st = await readGameState(pageS1E);
        return Boolean(st.v02ActiveRollDraft && st.v02ActiveRollDraft.rollNonce !== firstNonce);
      },
      5000,
      "S1-E full-trio reroll nonce updated"
    );
    const rolledState2 = await readGameState(pageS1E);
    assert.ok(rolledState2.v02ActiveRollDraft);
    assert.equal(new Set(rolledState2.v02ActiveRollDraft.candidateTraitIds).size, 3);

    await pageS1E.locator("#btn-cc-open-confirm").click();
    await waitForCondition(
      async () => await pageS1E.locator("#btn-cc-confirm").isVisible(),
      5000,
      "S1-E Confirm modal visible"
    );
    await pageS1E.locator("#btn-cc-confirm").click();
    await waitForCondition(
      async () => ((await pageS1E.locator("#hud-player-name").textContent()) ?? "").includes("Lâm Động 8D"),
      8000,
      "S1-E HUD shows Lâm Động 8D"
    );
    await pageS1E.waitForTimeout(500);

    const confirmedState = await readGameState(pageS1E);
    assert.equal(confirmedState.localAvatarVisible, true);
    assert.equal(confirmedState.localAppearanceKey, "hoa_tran");
    assert.equal(confirmedState.v02Character?.identity.creationState, "confirmed");
    assert.equal(confirmedState.v02Character?.levelProgress.level, 1);
    assert.equal(confirmedState.v02Character?.cultivation.realmId, "pham_nhan");
    assert.deepEqual(
      confirmedState.v02Character?.destiny?.innate,
      rolledState2.v02ActiveRollDraft?.candidateTraitIds
    );

    await pageS1E.screenshot({
      path: path.join(ARTIFACT_DIR, "10_s1e_spawned_tan_thu_thon_1280x720.png")
    });

    await pageS1E.keyboard.press("c");
    await waitForCondition(
      async () => await pageS1E.locator("#cultivation-modal").isVisible(),
      5000,
      "S1-E [C] character panel visible"
    );
    const cPanelText = (await pageS1E.locator("#cultivation-modal").textContent()) ?? "";
    assert.ok(cPanelText.includes("Lâm Động 8D"));
    assert.ok(cPanelText.includes("Thể Phách"));
    assert.ok(cPanelText.includes("Ngộ Tính"));
    assert.ok(cPanelText.includes("Tiên Thiên"));
    await pageS1E.screenshot({
      path: path.join(ARTIFACT_DIR, "11_s1e_character_c_panel_1280x720.png")
    });
    await pageS1E.locator("#btn-close-modal").click();

    const confirmedCharacterId = confirmedState.v02Character?.identity.characterId;
    await pageS1E.reload();
    await waitForCondition(
      async () => await pageS1E.locator("#btn-entry-start-play").isVisible(),
      8000,
      "S1-E reload lands on TITLE"
    );
    await pageS1E.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => await pageS1E.locator("#btn-roster-enter-world").isVisible(),
      8000,
      "S1-E Bắt Đầu Chơi opens ROSTER"
    );
    await pageS1E.locator("#btn-roster-enter-world").click();
    await waitForCondition(
      async () => ((await pageS1E.locator("#hud-player-name").textContent()) ?? "").includes("Lâm Động 8D"),
      8000,
      "S1-E reload reconnects confirmed character from ROSTER"
    );
    const reloadedState = await readGameState(pageS1E);
    assert.equal(reloadedState.v02Character?.identity.characterId, confirmedCharacterId);
    assert.deepEqual(
      reloadedState.v02Character?.destiny?.innate,
      confirmedState.v02Character?.destiny?.innate
    );
    assert.deepEqual(s1eErrors, []);
    await ctxS1E.close();

    const ctxCorrupt = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const pageCorrupt = await ctxCorrupt.newPage();
    const corruptSlot = `s1e_corrupt_${Date.now()}`;
    await pageCorrupt.addInitScript((slot: string) => {
      if (!window.sessionStorage.getItem("seeded_corrupt_token")) {
        window.sessionStorage.setItem("seeded_corrupt_token", "1");
        window.localStorage.setItem(
          `tm8d_v02_guest_token_${slot}`,
          "invalid_secret_token_xyz"
        );
      }
    }, corruptSlot);
    await pageCorrupt.goto(`${clientBaseUrl}/?guestSlot=${corruptSlot}`);
    await waitForCondition(
      async () => await pageCorrupt.locator("#btn-entry-start-play").isVisible(),
      8000,
      "S1-E corrupt token lands on TITLE"
    );
    await pageCorrupt.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => await pageCorrupt.locator("#cc-draft-section").isVisible(),
      8000,
      "S1-E recovery re-issues guest token and opens draft creation"
    );
    await ctxCorrupt.close();

    const ctxIsoA = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const ctxIsoB = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const pageIsoA = await ctxIsoA.newPage();
    const pageIsoB = await ctxIsoB.newPage();
    const isoTs = Date.now();
    await pageIsoA.goto(`${clientBaseUrl}/?guestSlot=iso_a_${isoTs}`);
    await pageIsoB.goto(`${clientBaseUrl}/?guestSlot=iso_b_${isoTs}`);
    await waitForCondition(
      async () =>
        (await pageIsoA.locator("#btn-entry-start-play").isVisible()) &&
        (await pageIsoB.locator("#btn-entry-start-play").isVisible()),
      8000,
      "Two-guest title screens ready"
    );
    await pageIsoA.locator("#btn-entry-start-play").click();
    await pageIsoB.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () =>
        (await pageIsoA.locator("#btn-cc-create-draft").isVisible()) &&
        (await pageIsoB.locator("#btn-cc-create-draft").isVisible()),
      8000,
      "Two-guest draft screens ready"
    );
    await pageIsoA.locator("#cc-input-name").fill("ĐạoHữuGiáp");
    await pageIsoA.locator("#btn-cc-create-draft").click();
    await pageIsoB.locator("#cc-input-name").fill("ĐạoHữuẤt");
    await pageIsoB.locator('.cc-appearance-card[data-appearance-id="ngoc_tam"]').click();
    await pageIsoB.locator("#btn-cc-create-draft").click();
    await waitForCondition(
      async () =>
        (await pageIsoA.locator("#btn-cc-open-confirm").isVisible()) &&
        (await pageIsoB.locator("#btn-cc-open-confirm").isVisible()),
      8000,
      "Two-guest roll screens ready"
    );
    await pageIsoA.locator("#btn-cc-open-confirm").click();
    await pageIsoB.locator("#btn-cc-open-confirm").click();
    await waitForCondition(
      async () =>
        (await pageIsoA.locator("#btn-cc-confirm").isVisible()) &&
        (await pageIsoB.locator("#btn-cc-confirm").isVisible()),
      5000,
      "Two-guest confirm modals ready"
    );
    await pageIsoA.locator("#btn-cc-confirm").click();
    await pageIsoB.locator("#btn-cc-confirm").click();
    await waitForCondition(async () => {
      const stA = await readGameState(pageIsoA);
      const stB = await readGameState(pageIsoB);
      return (
        stA.v02Character?.identity.creationState === "confirmed" &&
        stB.v02Character?.identity.creationState === "confirmed" &&
        stA.remotePlayers.some((p) => p.nickname === "ĐạoHữuẤt" && p.appearanceId === "ngoc_tam") &&
        stB.remotePlayers.some((p) => p.nickname === "ĐạoHữuGiáp")
      );
    }, 10000, "Two-guest confirmed isolation and mutual world visibility");
    const stIsoA = await readGameState(pageIsoA);
    const stIsoB = await readGameState(pageIsoB);
    assert.notEqual(stIsoA.v02Character?.identity.accountId, stIsoB.v02Character?.identity.accountId);
    assert.notEqual(stIsoA.v02Character?.identity.characterId, stIsoB.v02Character?.identity.characterId);
    await ctxIsoA.close();
    await ctxIsoB.close();

    const mobileS1ECtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobileS1EPage = await mobileS1ECtx.newPage();
    await mobileS1EPage.goto(`${clientBaseUrl}/?guestSlot=s1e_mob_${Date.now()}`);
    await waitForCondition(
      async () => await mobileS1EPage.locator("#btn-entry-start-play").isVisible(),
      8000,
      "Mobile S1-E title ready"
    );
    await mobileS1EPage.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => await mobileS1EPage.locator("#btn-cc-create-draft").isVisible(),
      8000,
      "Mobile S1-E creation ready"
    );
    await mobileS1EPage.locator("#cc-input-name").fill("TiểuViêmV02");
    await mobileS1EPage.locator('.cc-appearance-card[data-appearance-id="anh_7"]').click();
    await mobileS1EPage.locator("#btn-cc-create-draft").click();
    await waitForCondition(
      async () => (await mobileS1EPage.locator(".cc-destiny-card").count()) === 3,
      8000,
      "Mobile S1-E 3 destiny cards visible"
    );
    await mobileS1EPage.screenshot({
      path: path.join(ARTIFACT_DIR, "12_s1e_mobile_creation_390x844.png")
    });
    await mobileS1EPage.locator("#btn-cc-open-confirm").click();
    await waitForCondition(
      async () => await mobileS1EPage.locator("#btn-cc-confirm").isVisible(),
      5000,
      "Mobile S1-E confirm modal visible"
    );
    await mobileS1EPage.locator("#btn-cc-confirm").click();
    await waitForCondition(
      async () =>
        ((await mobileS1EPage.locator("#hud-player-name").textContent()) ?? "").includes("TiểuViêmV02"),
      8000,
      "Mobile S1-E HUD spawned"
    );
    await mobileS1EPage.waitForTimeout(400);
    await mobileS1EPage.screenshot({
      path: path.join(ARTIFACT_DIR, "13_s1e_mobile_spawned_390x844.png")
    });
    await mobileS1ECtx.close();

    const relArtifactDir = path.relative(ROOT_DIR, ARTIFACT_DIR).replace(/\\/g, "/");
    process.stdout.write(
      JSON.stringify(
        {
          playtestStatus: "ALL_GATES_PASSED",
          dbDataDir: gameSrv.db.getDataDir(),
          artifactRunDir: relArtifactDir,
          gifOutputPath: path.relative(ROOT_DIR, gifOutputPath).replace(/\\/g, "/"),
          screenshotsGenerated: [
            `${relArtifactDir}/01_tan_thu_thon_desktop_1280x720.png`,
            `${relArtifactDir}/02_merchant_shop_modal.png`,
            `${relArtifactDir}/03_phi_de_quest_ceremony.png`,
            `${relArtifactDir}/04_breakthrough_luyen_khi.png`,
            `${relArtifactDir}/05_thanh_truc_lam_forest.png`,
            `${relArtifactDir}/06_multiplayer_shared_combat.png`,
            `${relArtifactDir}/07_mobile_viewport_390x844.png`,
            `${relArtifactDir}/08_poc_sprites_showcase.png`,
            `${relArtifactDir}/09_s1e_character_creation_desktop_1280x720.png`,
            `${relArtifactDir}/10_s1e_spawned_tan_thu_thon_1280x720.png`,
            `${relArtifactDir}/11_s1e_character_c_panel_1280x720.png`,
            `${relArtifactDir}/12_s1e_mobile_creation_390x844.png`,
            `${relArtifactDir}/13_s1e_mobile_spawned_390x844.png`
          ]
        },
        null,
        2
      ) + "\n"
    );
  } finally {
    if (browser) {
      await browser.close();
    }
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
