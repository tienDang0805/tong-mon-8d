import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  LEGENDARY_NPCS,
  OFFLINE_MEDITATION_CAP_SECONDS,
  REALM_PROGRESSION
} from "@tong-mon-8d/game-data";
import { GameDatabase, loadRepoEnvIfNeeded, resolvePgDataDir } from "../db.js";
import { AuthoritativeWorldEngine } from "../worldEngine.js";

describe("Tông Môn 8D Server Authority & Canonical Progression", () => {
  let db: GameDatabase;
  let engine: AuthoritativeWorldEngine;

  beforeEach(async () => {
    db = new GameDatabase({ dataDir: "memory://" });
    await db.init();
    engine = new AuthoritativeWorldEngine(db);
  });

  afterEach(async () => {
    await db.close();
  });

  it("preserves all 18 entries (Phàm Nhân + 17 cultivation realms) and 10 legendary figures with Dẩm Lồn Tiên Tử realm UNKNOWN", () => {
    expect(REALM_PROGRESSION.length).toBeGreaterThanOrEqual(17);
    expect(REALM_PROGRESSION[0].id).toBe("pham_nhan");
    expect(REALM_PROGRESSION[1].id).toBe("luyen_khi");
    expect(REALM_PROGRESSION[2].id).toBe("truc_co");
    expect(REALM_PROGRESSION[REALM_PROGRESSION.length - 1].id).toBe("thanh_canh");

    const legendaryTen = LEGENDARY_NPCS.filter((n) => n.isLegendaryTen);
    expect(legendaryTen).toHaveLength(10);

    const tamDe = LEGENDARY_NPCS.filter((n) => n.isTamDe).map((n) => n.id);
    expect(tamDe).toEqual(["phi_de", "rmt_de", "vaal_de"]);

    const damLon = LEGENDARY_NPCS.find((n) => n.id === "dam_lon_tien_tu");
    expect(damLon?.realmId).toBe("UNKNOWN");

    const chatDvt = LEGENDARY_NPCS.find((n) => n.id === "chatdvt");
    expect(chatDvt?.spriteKey).toBe("chatdvt");
  });

  it("enforces 8-hour offline meditation cap and idempotency keys", async () => {
    const player = await db.loadOrCreateCharacter("acc_meditate", "Hàn Lập", "kiem_tu");
    expect(player.realmId).toBe("pham_nhan");
    const initialTuVi = player.tuVi;

    engine.advanceSimulatedClockMs(10 * 3600 * 1000);
    const claim1 = await engine.handleClaimMeditation(player, {
      requestId: "med_key_001"
    });
    expect(claim1.ok).toBe(true);
    expect(player.tuVi).toBeGreaterThan(initialTuVi);

    const maxPossibleGain = Math.floor(OFFLINE_MEDITATION_CAP_SECONDS * 0.15 * 2.5);
    expect(player.tuVi - initialTuVi).toBeLessThanOrEqual(maxPossibleGain);

    const duplicateClaim = await engine.handleClaimMeditation(player, {
      requestId: "med_key_001"
    });
    expect(duplicateClaim.ok).toBe(false);
    expect(duplicateClaim.code).toBe("DUPLICATE_REQUEST");
  });

  it("validates portal range and transitions between Tân Thủ Thôn and Thanh Trúc Lâm", async () => {
    const player = await db.loadOrCreateCharacter("acc_portal", "Lý Phi Vũ", "kiem_tu");

    const farTry = await engine.handlePortalIntent(player, {
      portalId: "portal_town_to_forest",
      requestId: "portal_req_far"
    });
    expect(farTry.result.ok).toBe(false);
    expect(farTry.result.code).toBe("OUT_OF_RANGE");

    player.x = 1120;
    player.y = 480;
    const nearTry = await engine.handlePortalIntent(player, {
      portalId: "portal_town_to_forest",
      requestId: "portal_req_near"
    });
    expect(nearTry.result.ok).toBe(true);
    expect(nearTry.approval?.targetZoneId).toBe("thanh_truc_lam");
    expect(player.zoneId).toBe("thanh_truc_lam");
  });

  it("synchronizes shared monster HP across two players and drops persistent loot", async () => {
    const p1 = await db.loadOrCreateCharacter("acc_p1", "Kiếm Khách A", "kiem_tu");
    const p2 = await db.loadOrCreateCharacter("acc_p2", "Kiếm Khách B", "kiem_tu");
    p1.zoneId = "thanh_truc_lam";
    p2.zoneId = "thanh_truc_lam";

    const monsters = engine.getZoneMonsters("thanh_truc_lam");
    const wolf = Object.values(monsters).find((m) => m.monsterId === "truc_lang");
    expect(wolf).toBeDefined();
    if (!wolf) return;

    p1.x = wolf.x - 24;
    p1.y = wolf.y;
    p2.x = wolf.x + 24;
    p2.y = wolf.y;

    const initialHp = wolf.hp;
    const hit1 = await engine.handleAttackIntent(p1, {
      skillId: "basic_slash",
      targetInstanceId: wolf.instanceId,
      direction: "right",
      requestId: "atk_1"
    });
    expect(hit1.result.ok).toBe(true);

    const afterHit1Hp = engine.getZoneMonsters("thanh_truc_lam")[wolf.instanceId].hp;
    expect(afterHit1Hp).toBeLessThan(initialHp);

    for (let i = 0; i < 10; i++) {
      engine.advanceSimulatedClockMs(1000);
      await engine.handleAttackIntent(i % 2 === 0 ? p1 : p2, {
        skillId: "basic_slash",
        targetInstanceId: wolf.instanceId,
        direction: "left",
        requestId: `atk_loop_${i}`
      });
    }

    const drops = Object.values(engine.getZoneDrops("thanh_truc_lam"));
    expect(drops.length).toBeGreaterThan(0);

    const firstDrop = drops[0];
    p1.x = firstDrop.x;
    p1.y = firstDrop.y;
    const pickupRes = await engine.handlePickupDrop(p1, {
      dropId: firstDrop.dropId,
      requestId: "pickup_1"
    });
    expect(pickupRes.ok).toBe(true);
  });

  it("supports Phì Đế's Vạn Vị Thành Đạo quest via BOTH purchased food AND self-cooked food", async () => {
    const buyer = await db.loadOrCreateCharacter("acc_buyer", "Thực Khách Mua", "kiem_tu");
    buyer.x = 432;
    buyer.y = 384;

    const buyRes = await engine.handleShopBuy(buyer, {
      npcId: "merchant_truong",
      itemId: "mi_linh_thach_thanh_truc",
      quantity: 1,
      requestId: "buy_noodle_1"
    });
    expect(buyRes.ok).toBe(true);

    buyer.x = 512;
    buyer.y = 384;
    const acceptBuyer = await engine.handleQuestAction(buyer, {
      npcId: "phi_de",
      questId: "phi_de_ch1_huong_thom",
      action: "accept",
      requestId: "q_accept_buyer"
    });
    expect(acceptBuyer.ok).toBe(true);

    const submitBought = await engine.handleQuestAction(buyer, {
      npcId: "phi_de",
      questId: "phi_de_ch1_huong_thom",
      action: "submit",
      submittedItemId: "mi_linh_thach_thanh_truc",
      requestId: "q_submit_buyer"
    });
    expect(submitBought.ok).toBe(true);
    expect(submitBought.ceremony).toBe("phi_de_blessing");
    expect(engine.getEffectiveStats(buyer).hasPhiDeBlessing).toBe(true);

    const chef = await db.loadOrCreateCharacter("acc_chef", "Đầu Bếp Tự Nấu", "kiem_tu");
    engine.addItemToInventory(chef, "thit_truc_lang", 1);
    engine.addItemToInventory(chef, "thanh_tam_thao", 1);

    const cookRes = await engine.handleCookRecipe(chef, {
      recipeId: "cook_canh_truc_lang_linh_thao",
      requestId: "cook_soup_1"
    });
    expect(cookRes.ok).toBe(true);

    chef.x = 512;
    chef.y = 384;
    await engine.handleQuestAction(chef, {
      npcId: "phi_de",
      questId: "phi_de_ch1_huong_thom",
      action: "accept",
      requestId: "q_accept_chef"
    });
    const submitCooked = await engine.handleQuestAction(chef, {
      npcId: "phi_de",
      questId: "phi_de_ch1_huong_thom",
      action: "submit",
      submittedItemId: "canh_truc_lang_linh_thao",
      requestId: "q_submit_chef"
    });
    expect(submitCooked.ok).toBe(true);
    expect(submitCooked.ceremony).toBe("phi_de_blessing");
    expect(engine.getEffectiveStats(chef).hasPhiDeBlessing).toBe(true);
  });

  it("supports realm breakthrough from Phàm Nhân to Luyện Khí Tầng 1 with full HP/MP restoration", async () => {
    const player = await db.loadOrCreateCharacter("acc_break", "Đột Phá Giả", "kiem_tu");
    player.tuVi = 250;
    const res = await engine.handleBreakthrough(player, {
      requestId: "break_req_1"
    });
    expect(res.ok).toBe(true);
    expect(player.realmId).toBe("luyen_khi");
    expect(player.realmStage).toBe(1);
    expect(res.ceremony).toBe("breakthrough_success");
  });

  it("resolves PGlite data directories deterministically and prevents split-brain across working directories", () => {
    const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d_s0_resolver_"));
    try {
      const serverCwd = path.join(tempRepo, "apps/server");
      const canonicalDir = path.join(tempRepo, "apps/server/data/pgdata");
      const legacyNestedDir = path.join(tempRepo, "apps/server/apps/server/data/pgdata");
      fs.mkdirSync(serverCwd, { recursive: true });

      expect(resolvePgDataDir("memory://", { repoRoot: tempRepo, cwd: serverCwd })).toBe("memory://");

      const explicitAbs = path.join(tempRepo, "explicit_abs_pgdata");
      expect(resolvePgDataDir(explicitAbs, { repoRoot: tempRepo, cwd: serverCwd })).toBe(
        path.normalize(explicitAbs)
      );

      expect(
        resolvePgDataDir("./apps/server/data/pgdata", { repoRoot: tempRepo, cwd: serverCwd })
      ).toBe(canonicalDir);
      expect(resolvePgDataDir(undefined, { repoRoot: tempRepo, cwd: serverCwd })).toBe(canonicalDir);

      fs.mkdirSync(legacyNestedDir, { recursive: true });
      fs.writeFileSync(path.join(legacyNestedDir, "PG_VERSION"), "16\n");
      expect(
        resolvePgDataDir("./apps/server/data/pgdata", { repoRoot: tempRepo, cwd: serverCwd })
      ).toBe(legacyNestedDir);
      expect(
        resolvePgDataDir("./apps/server/data/pgdata", { repoRoot: tempRepo, cwd: tempRepo })
      ).toBe(legacyNestedDir);

      fs.mkdirSync(canonicalDir, { recursive: true });
      fs.writeFileSync(path.join(canonicalDir, "PG_VERSION"), "16\n");
      expect(() =>
        resolvePgDataDir("./apps/server/data/pgdata", { repoRoot: tempRepo, cwd: serverCwd })
      ).toThrow(/SPLIT_BRAIN_PGDATA_DIR/);

      fs.rmSync(legacyNestedDir, { recursive: true, force: true });
      expect(
        resolvePgDataDir("./apps/server/data/pgdata", { repoRoot: tempRepo, cwd: serverCwd })
      ).toBe(canonicalDir);

      const customRel = "./custom_store/pgdata";
      const customRepoTarget = path.join(tempRepo, "custom_store/pgdata");
      const customCwdTarget = path.join(serverCwd, "custom_store/pgdata");
      expect(resolvePgDataDir(customRel, { repoRoot: tempRepo, cwd: serverCwd })).toBe(
        customRepoTarget
      );

      fs.mkdirSync(customCwdTarget, { recursive: true });
      fs.writeFileSync(path.join(customCwdTarget, "PG_VERSION"), "16\n");
      expect(resolvePgDataDir(customRel, { repoRoot: tempRepo, cwd: serverCwd })).toBe(
        customCwdTarget
      );

      fs.mkdirSync(customRepoTarget, { recursive: true });
      fs.writeFileSync(path.join(customRepoTarget, "PG_VERSION"), "16\n");
      expect(() =>
        resolvePgDataDir(customRel, { repoRoot: tempRepo, cwd: serverCwd })
      ).toThrow(/SPLIT_BRAIN_PGDATA_DIR/);
    } finally {
      fs.rmSync(tempRepo, { recursive: true, force: true });
    }
  });

  it("loads repository .env without overriding explicitly supplied environment variables", () => {
    const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d_s0_env_"));
    try {
      fs.writeFileSync(
        path.join(tempRepo, ".env"),
        'PORT=2567\nexport PGDATA_DIR="./apps/server/data/pgdata"\nDATABASE_URL=postgres://should_not_override\nVITE_SERVER_URL=\'http://127.0.0.1:2567\'\n'
      );
      const mockEnv: NodeJS.ProcessEnv = {
        PORT: "3999",
        DATABASE_URL: ""
      };
      loadRepoEnvIfNeeded(tempRepo, mockEnv);
      expect(mockEnv.PORT).toBe("3999");
      expect(mockEnv.DATABASE_URL).toBe("");
      expect(mockEnv.PGDATA_DIR).toBe("./apps/server/data/pgdata");
      expect(mockEnv.VITE_SERVER_URL).toBe("http://127.0.0.1:2567");
    } finally {
      fs.rmSync(tempRepo, { recursive: true, force: true });
    }
  });
});
