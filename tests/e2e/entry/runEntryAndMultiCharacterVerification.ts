import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { createServer as createViteServer } from "vite";
import { startGameServer } from "../../../apps/server/src/index.js";

const ROOT_DIR = process.cwd();
const OUT_DIR = path.join(ROOT_DIR, "artifacts/S1-ENTRY-VISUAL-REBUILD-01");
const SCREENSHOTS_DIR = path.join(OUT_DIR, "screenshots");

async function findFreePort(startPort: number): Promise<number> {
  for (let p = startPort; p < startPort + 100; p++) {
    const isFree = await new Promise<boolean>((resolve) => {
      const srv = net.createServer();
      srv.once("error", () => resolve(false));
      srv.once("listening", () => srv.close(() => resolve(true)));
      srv.listen(p, "127.0.0.1");
    });
    if (isFree) {
      return p;
    }
  }
  throw new Error(`No free port near ${startPort}`);
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
  timeoutMs = 12000,
  label = "condition"
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for ${label}`);
}

interface EntryTelemetry {
  state: string;
  accountId: string | null;
  selectedCharacterId: string | null;
  rosterCount: number;
  inWorld: boolean;
  worldActorCount: number;
}

async function readEntryState(page: Page): Promise<EntryTelemetry> {
  return await page.evaluate(() => {
    const win = window as unknown as {
      __TONG_MON_ENTRY_STATE__?: EntryTelemetry;
    };
    return (
      win.__TONG_MON_ENTRY_STATE__ ?? {
        state: "UNKNOWN",
        accountId: null,
        selectedCharacterId: null,
        rosterCount: 0,
        inWorld: false,
        worldActorCount: 0
      }
    );
  });
}

async function readGameState(page: Page): Promise<Record<string, any>> {
  const raw = await page.evaluate(() => {
    const fn = (window as unknown as { render_game_to_text?: () => string })
      .render_game_to_text;
    return fn ? fn() : "{}";
  });
  return JSON.parse(raw) as Record<string, any>;
}

async function main(): Promise<void> {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  delete process.env.DATABASE_URL;
  process.env.PGDATA_DIR = "memory://";

  const serverPort = await findFreePort(2767);
  const clientPort = await findFreePort(5273);
  const serverHttpUrl = `http://127.0.0.1:${serverPort}`;
  process.env.VITE_SERVER_URL = serverHttpUrl;

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

  let browser: Awaited<ReturnType<typeof launchBrowser>> | undefined;

  try {
    browser = await launchBrowser();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();

    const consoleErrors: string[] = [];
    const failedAssets: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("response", (res) => {
      if (
        (res.url().includes("/assets/") || res.url().includes("/maps/")) &&
        res.status() >= 400
      ) {
        failedAssets.push(`${res.status()} ${res.url()}`);
      }
    });

    const slot = `entry_rebuild_${Date.now()}`;
    await page.goto(`${clientBaseUrl}/?guestSlot=${slot}&e2e=1&serverPort=${serverPort}`);

    await waitForCondition(
      async () => await page.locator("#entry-title-screen").isVisible(),
      10000,
      "Title screen visible on initial load"
    );
    await page.waitForTimeout(400);

    const titleEntryState = await readEntryState(page);
    assert.equal(titleEntryState.state, "TITLE");
    assert.equal(titleEntryState.inWorld, false);
    assert.equal(titleEntryState.worldActorCount, 0);

    const healthOnTitle = (await (await fetch(`${serverHttpUrl}/health`)).json()) as {
      zones: {
        tan_thu_thon: { playersOnline: number };
        thanh_truc_lam: { playersOnline: number };
      };
    };
    assert.equal(healthOnTitle.zones.tan_thu_thon.playersOnline, 0);
    assert.equal(healthOnTitle.zones.thanh_truc_lam.playersOnline, 0);

    await page.keyboard.press("w");
    await page.keyboard.press("j");
    await page.waitForTimeout(150);
    const afterTitleInputState = await readEntryState(page);
    assert.equal(afterTitleInputState.inWorld, false);
    assert.equal(afterTitleInputState.worldActorCount, 0);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "00a_title_screen_1280x720.png")
    });

    await page.locator("#btn-entry-title-settings").click();
    await waitForCondition(
      async () => await page.locator('[data-testid="entry-title-settings-modal"]').isVisible(),
      5000,
      "Title settings modal open"
    );
    await page.locator("#btn-title-close-settings").click();

    await page.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => await page.locator("#cc-draft-section").isVisible(),
      8000,
      "Empty account routes directly from Bắt Đầu Chơi to CREATE"
    );
    await page.waitForTimeout(450);

    const createEntryState = await readEntryState(page);
    assert.equal(createEntryState.state, "CREATE");
    assert.equal(createEntryState.inWorld, false);
    assert.equal(createEntryState.worldActorCount, 0);
    assert.ok(createEntryState.accountId);
    const primaryAccountId = createEntryState.accountId;

    await page.locator("#cc-input-name").fill("Hàn Lập Kiếm");
    await page.locator('.cc-appearance-card[data-appearance-id="hero_kiem_tu"]').click();
    await page.locator('[data-preview-dir="right"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-preview-dir="down"]').click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02_character_creation_1280x720.png")
    });

    await page.locator("#btn-cc-create-draft").click();
    await waitForCondition(
      async () =>
        (await page.locator("#cc-rolled-section").isVisible()) &&
        (await page.locator(".cc-destiny-card").count()) === 3,
      8000,
      "Destiny roll scene visible with 3 cards"
    );
    await page.waitForTimeout(400);

    const rollEntryState = await readEntryState(page);
    assert.equal(rollEntryState.state, "DESTINY_ROLL");
    assert.equal(rollEntryState.inWorld, false);
    assert.equal(rollEntryState.worldActorCount, 0);

    const stRoll1 = await readGameState(page);
    const nonce1 = stRoll1.v02ActiveRollDraft?.rollNonce;
    assert.ok(nonce1);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03_tien_thien_destiny_roll_1280x720.png")
    });

    await page.locator("#btn-cc-reroll").click();
    await waitForCondition(
      async () => {
        const st = await readGameState(page);
        return Boolean(
          st.v02ActiveRollDraft?.rollNonce &&
            st.v02ActiveRollDraft.rollNonce !== nonce1
        );
      },
      6000,
      "Full-trio reroll updates nonce"
    );

    await page.locator('.cc-appearance-card[data-appearance-id="hoa_tran"]').click();
    await waitForCondition(
      async () =>
        await page
          .locator('.cc-appearance-card[data-appearance-id="hoa_tran"]')
          .evaluate((el) => el.classList.contains("is-selected")),
      3000,
      "Can switch appearance to hoa_tran after rolling destiny"
    );
    await page.locator('.cc-appearance-card[data-appearance-id="hero_kiem_tu"]').click();
    await waitForCondition(
      async () =>
        await page
          .locator('.cc-appearance-card[data-appearance-id="hero_kiem_tu"]')
          .evaluate((el) => el.classList.contains("is-selected")),
      3000,
      "Can switch appearance back to hero_kiem_tu after rolling destiny"
    );

    await page.locator("#btn-cc-open-confirm").click();
    await waitForCondition(
      async () => await page.locator('[data-testid="destiny-confirm-modal"]').isVisible(),
      5000,
      "Irreversible confirmation modal visible"
    );
    await page.waitForTimeout(250);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03b_destiny_confirm_modal_1280x720.png")
    });

    await page.locator("#btn-cc-confirm").click();
    await waitForCondition(
      async () => {
        const es = await readEntryState(page);
        const st = await readGameState(page);
        return (
          es.state === "IN_WORLD" &&
          es.inWorld === true &&
          st.localAvatarVisible === true &&
          ((await page.locator("#hud-player-name").textContent()) ?? "").includes(
            "Hàn Lập Kiếm"
          )
        );
      },
      12000,
      "Confirmed Character 1 enters Tân Thủ Thôn"
    );
    await page.waitForTimeout(600);

    const stInWorld1 = await readGameState(page);
    const char1Id = stInWorld1.v02Character.identity.characterId as string;
    assert.equal(stInWorld1.v02Character.identity.accountId, primaryAccountId);
    assert.equal(stInWorld1.v02Character.identity.creationState, "confirmed");
    assert.equal(stInWorld1.v02Character.identity.appearanceId, "hero_kiem_tu");
    assert.equal(stInWorld1.zoneId, "tan_thu_thon");

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01_main_world_hud_1280x720.png")
    });

    await page.locator("#btn-toggle-minimap-size").click();
    await page.waitForTimeout(250);
    const minimapAndQuestRects = await page.evaluate(() => {
      const mm = document.querySelector("#hud-top-right")?.getBoundingClientRect();
      const qs = document.querySelector("#hud-right-quest-scroll")?.getBoundingClientRect();
      return {
        mmBottom: mm ? mm.bottom : 0,
        qsTop: qs ? qs.top : 0
      };
    });
    assert.ok(
      minimapAndQuestRects.mmBottom <= minimapAndQuestRects.qsTop + 2,
      `Expanded minimap (${minimapAndQuestRects.mmBottom}) must not overlap quest tracker (${minimapAndQuestRects.qsTop})`
    );
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01b_expanded_minimap_no_quest_overlap_1280x720.png")
    });
    await page.locator("#btn-toggle-minimap-size").click();
    await page.waitForTimeout(200);

    const { S1E_STARTER_DESTINY_CATALOG } = await import("@tong-mon-8d/game-data");
    const innateSet1 = new Set<string>(stInWorld1.v02Character.destiny.innate);
    const pickedHtTrait =
      Object.values(S1E_STARTER_DESTINY_CATALOG).find(
        (t) => t.kind === "ordinary" && !innateSet1.has(t.id)
      )?.id ?? Object.keys(S1E_STARTER_DESTINY_CATALOG)[0]!;

    await gameSrv.db.characterV02Actions.awardCharacterExpServerOnly({
      accountId: primaryAccountId,
      characterId: char1Id,
      requestId: `e2e_exp_c1_${Date.now()}`,
      expDelta: 500
    });
    await gameSrv.db.characterV02Actions.grantAcquiredDestinyTraitServerOnly({
      accountId: primaryAccountId,
      characterId: char1Id,
      requestId: `e2e_ht_c1_${Date.now()}`,
      traitId: pickedHtTrait
    });

    await page.keyboard.press("j");
    await page.waitForTimeout(350);

    await page.keyboard.press("c");
    await waitForCondition(
      async () => await page.locator("#cultivation-modal").isVisible(),
      5000,
      "[C] Thiên Cung Nội Thị Đồ panel open"
    );
    await page.waitForTimeout(350);

    await page.locator('[data-testid="allocate-attr-luc_dao"]').click();
    await waitForCondition(
      async () => {
        const st = await readGameState(page);
        return (st.v02Character?.levelProgress?.allocated?.luc_dao ?? 0) >= 1;
      },
      5000,
      "Allocated +1 Lực Đạo on 6-pointed hexagram"
    );

    const equipBtn = page.locator(`.btn-equip-ht[data-trait="${pickedHtTrait}"]`);
    if ((await equipBtn.count()) > 0) {
      await equipBtn.click();
      await page.waitForTimeout(250);
    }

    const cPanelVisibility = await page.evaluate(() => {
      const selectors = [
        "#char-attributes-grid",
        "#btn-modal-breakthrough",
        "#btn-modal-meditate",
        "#btn-party-create",
        "#char-innate-destiny-grid",
        "#ht-active-slots"
      ];
      return selectors.every((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= 720;
      });
    });
    assert.ok(cPanelVisibility, "[C] Option C renders all attributes, breakthrough, meditate, party, and destiny controls in viewport with zero scrolling");

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04_character_cultivation_panel_1280x720.png")
    });
    await page.locator("#btn-close-modal").click();

    await page.keyboard.press("i");
    await waitForCondition(
      async () => await page.locator("#inventory-modal").isVisible(),
      5000,
      "[I] Túi Càn Khôn panel open"
    );
    await page.waitForTimeout(350);
    const iPanelLayoutOk = await page.evaluate(() => {
      const bag = document.querySelector("#inventory-bag-grid") as HTMLElement | null;
      const doll = document.querySelector("#inventory-equipment-paperdoll") as HTMLElement | null;
      const inspect = document.querySelector(".v01b-reliquary-inspect-scroll") as HTMLElement | null;
      const equipSlots = document.querySelectorAll("#inventory-equipment-paperdoll [data-equip-slot]");
      if (!bag || !doll || !inspect || equipSlots.length !== 8) return false;
      const br = bag.getBoundingClientRect();
      const dr = doll.getBoundingClientRect();
      const ir = inspect.getBoundingClientRect();
      return br.left < dr.left && dr.left < ir.left && dr.bottom <= 720;
    });
    assert.ok(iPanelLayoutOk, "[I] Option C renders Left Bag Grid, Center 8-Slot Paperdoll, and Right Inspector Scroll in viewport");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05_inventory_linh_tru_panel_1280x720.png")
    });

    const cookTab = page.locator('[data-inv-category="cooking"]');
    if ((await cookTab.count()) > 0) {
      await cookTab.click();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "05b_linh_tru_cooking_tab_1280x720.png")
      });
    }
    await page.locator("#btn-close-modal").click();

    await page.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(1136, 1136);
    });
    await page.waitForTimeout(250);
    await page.keyboard.press("e");
    await waitForCondition(
      async () => await page.locator("#npc-dialogue-modal").isVisible(),
      5000,
      "Lão Trù Trương NPC shop dialogue open"
    );
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06a_npc_shop_merchant_truong_1280x720.png")
    });
    await page.locator("#btn-close-modal").click();

    await page.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(624, 720);
    });
    await page.waitForTimeout(250);
    await page.keyboard.press("e");
    await waitForCondition(
      async () => await page.locator("#npc-dialogue-modal").isVisible(),
      5000,
      "Dẩm Lồn Tiên Tử NPC dialogue open"
    );
    const damLonText = (await page.locator("#npc-dialogue-modal").textContent()) ?? "";
    assert.ok(damLonText.includes("UNKNOWN") || damLonText.includes("Bất Minh"));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06_npc_dialogue_and_shop_1280x720.png")
    });
    await page.locator("#btn-close-modal").click();

    await page.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(2768, 1200);
    });
    await page.waitForTimeout(250);
    await page.keyboard.press("e");
    await waitForCondition(
      async () =>
        ((await page.locator("#hud-zone-title").textContent()) ?? "").includes(
          "Thanh Trúc Lâm"
        ),
      8000,
      "Character 1 traveled to Thanh Trúc Lâm"
    );
    await page.evaluate(() => {
      const dbg = (window as unknown as {
        __TONG_MON_DEBUG__: { teleportLocal: (x: number, y: number) => void };
      }).__TONG_MON_DEBUG__;
      dbg.teleportLocal(448, 480);
    });
    await page.waitForTimeout(300);

    await page.keyboard.press("Escape");
    await waitForCondition(
      async () => await page.locator('[data-testid="ingame-esc-menu"]').isVisible(),
      5000,
      "In-game ESC system menu open"
    );
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07_ingame_esc_system_menu_1280x720.png")
    });

    await page.locator('[data-testid="esc-switch-character-btn"]').click();
    await waitForCondition(
      async () => {
        const es = await readEntryState(page);
        return es.state === "ROSTER" && es.inWorld === false && es.worldActorCount === 0;
      },
      8000,
      "Switched from world to ROSTER cleanly"
    );

    const createConfirmedCharacterFromRoster = async (
      charName: string,
      appearanceId: string,
      switchAppearanceAfterRoll = false
    ): Promise<string> => {
      await page.locator("#btn-roster-create-new").click();
      await waitForCondition(
        async () => await page.locator("#cc-draft-section").isVisible(),
        6000,
        `CREATE visible for ${charName}`
      );
      await page.locator("#cc-input-name").fill(charName);
      if (!switchAppearanceAfterRoll) {
        await page
          .locator(`.cc-appearance-card[data-appearance-id="${appearanceId}"]`)
          .click();
      }
      await page.locator("#btn-cc-create-draft").click();
      await waitForCondition(
        async () => (await page.locator(".cc-destiny-card").count()) === 3,
        8000,
        `DESTINY_ROLL visible for ${charName}`
      );
      if (switchAppearanceAfterRoll) {
        await page
          .locator(`.cc-appearance-card[data-appearance-id="${appearanceId}"]`)
          .click();
        await waitForCondition(
          async () =>
            await page
              .locator(`.cc-appearance-card[data-appearance-id="${appearanceId}"]`)
              .evaluate((el) => el.classList.contains("is-selected")),
          3000,
          `Switched appearance to ${appearanceId} after rolling destiny`
        );
      }
      await page.locator("#btn-cc-open-confirm").click();
      await waitForCondition(
        async () => await page.locator("#btn-cc-confirm").isVisible(),
        5000,
        `Confirm modal visible for ${charName}`
      );
      await page.locator("#btn-cc-confirm").click();
      await waitForCondition(
        async () => {
          const es = await readEntryState(page);
          return (
            es.state === "IN_WORLD" &&
            ((await page.locator("#hud-player-name").textContent()) ?? "").includes(
              charName
            )
          );
        },
        12000,
        `${charName} spawned in Tân Thủ Thôn`
      );
      const st = await readGameState(page);
      assert.equal(st.v02Character.identity.accountId, primaryAccountId);
      assert.equal(st.v02Character.identity.appearanceId, appearanceId);
      assert.equal(st.zoneId, "tan_thu_thon");
      const newCid = st.v02Character.identity.characterId as string;
      await page.keyboard.press("Escape");
      await waitForCondition(
        async () => await page.locator('[data-testid="esc-switch-character-btn"]').isVisible(),
        5000,
        "ESC menu open"
      );
      await page.locator('[data-testid="esc-switch-character-btn"]').click();
      await waitForCondition(
        async () => (await readEntryState(page)).state === "ROSTER",
        8000,
        "Back on ROSTER"
      );
      return newCid;
    };

    const char2Id = await createConfirmedCharacterFromRoster(
      "Thanh Phong Khách",
      "hoa_tran",
      false
    );
    const char3Id = await createConfirmedCharacterFromRoster(
      "Ngọc Tâm Tiên",
      "ngoc_tam",
      true
    );

    await page.locator("#btn-roster-create-new").click();
    await waitForCondition(
      async () => await page.locator("#cc-draft-section").isVisible(),
      6000,
      "CREATE visible for unconfirmed draft test"
    );
    await page.locator("#cc-input-name").fill("Huyền Kiếm Nháp");
    await page.locator('.cc-appearance-card[data-appearance-id="anh_7"]').click();
    await page.locator("#btn-cc-create-draft").click();
    await waitForCondition(
      async () => (await page.locator(".cc-destiny-card").count()) === 3,
      8000,
      "DESTINY_ROLL visible for unconfirmed draft test"
    );

    await page.locator("#btn-cc-back-roster").click();
    await waitForCondition(
      async () => {
        const es = await readEntryState(page);
        return es.state === "ROSTER" && es.rosterCount === 3;
      },
      8000,
      "Backing out before confirming discards unconfirmed draft and keeps rosterCount at 3"
    );

    const char4ToDeleteId = await createConfirmedCharacterFromRoster(
      "Huyền Kiếm Thử Xoá",
      "anh_7",
      false
    );
    await waitForCondition(
      async () => (await readEntryState(page)).rosterCount === 4,
      5000,
      "Roster has 4 confirmed characters before deletion"
    );

    await page
      .locator(`[data-testid="roster-character-card"][data-character-id="${char4ToDeleteId}"]`)
      .click();
    await page.locator("#btn-roster-delete-char").click();
    await waitForCondition(
      async () => await page.locator('[data-testid="roster-delete-confirm-modal"]').isVisible(),
      5000,
      "Delete character confirmation modal open on ROSTER"
    );
    await page.locator("#btn-roster-confirm-delete").click();
    await waitForCondition(
      async () => {
        const es = await readEntryState(page);
        return es.state === "ROSTER" && es.rosterCount === 3;
      },
      8000,
      "Deleted character removed from ROSTER and rosterCount returns to 3"
    );
    await page.waitForTimeout(350);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "00b_roster_screen_multi_character_1280x720.png")
    });

    await page
      .locator(`[data-testid="roster-character-card"][data-character-id="${char1Id}"]`)
      .click();
    await waitForCondition(
      async () => await page.locator("#btn-roster-enter-world").isVisible(),
      5000,
      "Selecting confirmed Character 1 shows Vào Thế Giới button"
    );
    await page.locator("#btn-roster-enter-world").click();

    await waitForCondition(
      async () => {
        const es = await readEntryState(page);
        const st = await readGameState(page);
        return (
          es.state === "IN_WORLD" &&
          st.v02Character?.identity?.characterId === char1Id &&
          st.zoneId === "thanh_truc_lam"
        );
      },
      12000,
      "Character 1 resumes in persisted zone Thanh Trúc Lâm (not reset to village)"
    );
    const stResumed1 = await readGameState(page);
    assert.equal(stResumed1.zoneId, "thanh_truc_lam");
    assert.equal(stResumed1.v02Character.levelProgress.level, 3);

    await page.reload();
    await waitForCondition(
      async () => {
        const es = await readEntryState(page);
        return es.state === "TITLE" && es.inWorld === false && es.worldActorCount === 0;
      },
      10000,
      "Normal reload lands on TITLE without auto-spawning character"
    );
    await page.locator("#btn-entry-start-play").click();
    await waitForCondition(
      async () => {
        const es = await readEntryState(page);
        return es.state === "ROSTER" && es.rosterCount === 3;
      },
      8000,
      "Bắt Đầu Chơi after reload opens ROSTER with all 3 confirmed characters"
    );

    await page
      .locator(`[data-testid="roster-character-card"][data-character-id="${char2Id}"]`)
      .click();
    await page.locator("#btn-roster-enter-world").click();
    await waitForCondition(
      async () => {
        const es = await readEntryState(page);
        const st = await readGameState(page);
        return (
          es.state === "IN_WORLD" &&
          st.v02Character?.identity?.characterId === char2Id &&
          st.zoneId === "tan_thu_thon"
        );
      },
      12000,
      "Character 2 enters Tân Thủ Thôn"
    );

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "09_responsive_world_hud_1920x1080.png")
    });

    await page.setViewportSize({ width: 860, height: 540 });
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "10_responsive_world_hud_860x540.png")
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08_mobile_gameplay_layout_390x844.png")
    });

    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(failedAssets, []);

    const summary = {
      taskId: "S1-ENTRY-VISUAL-REBUILD-01",
      verifiedAt: new Date().toISOString(),
      accountId: primaryAccountId,
      charactersVerifiedOnSameAccount: [char1Id, char2Id, char3Id, char4ToDeleteId],
      titleScreenZeroWorldActorVerified: true,
      emptyAccountDirectToCreateVerified: true,
      populatedAccountRoutesToRosterVerified: true,
      noAutoEnterWorldOnReloadVerified: true,
      existingCharacterZonePositionResumeVerified: true,
      inGameEscMenuSwitchAndReturnVerified: true,
      switchAppearanceAfterDestinyRollVerified: true,
      discardUnconfirmedDraftOnBackVerified: true,
      deleteCharacterFromRosterVerified: true,
      expandedMinimapNoQuestOverlapVerified: true,
      consoleErrorCount: consoleErrors.length,
      failedAssetCount: failedAssets.length
    };
    fs.writeFileSync(
      path.join(OUT_DIR, "e2e_entry_verification_report.json"),
      `${JSON.stringify(summary, null, 2)}\n`
    );
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
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
    process.stderr.write(`Entry E2E Verification Failed: ${String(err?.stack ?? err)}\n`);
    process.exit(1);
  });
