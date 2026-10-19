import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "http";
import type { Client } from "colyseus";
import { PGlite } from "@electric-sql/pglite";
import { ZONES_REGISTRY } from "@tong-mon-8d/game-data";
import type {
  CharacterRosterResponsePayload,
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  GuestAuthResultPayload,
  RoomWorldSnapshot,
  SelectCharacterForWorldEntryResultPayload
} from "@tong-mon-8d/shared";
import { GameDatabase, PGliteAdapter } from "../db.js";
import {
  inspectMultiCharacterSchemaState,
  runMultiCharacterV02Migration
} from "../infrastructure/database/migrations/multiCharacterV02Migration.js";
import { AuthoritativeWorldEngine } from "../runtime/world/WorldRuntime.js";
import {
  ZoneRoom,
  configureServerSingletons,
  getActiveZoneRoom
} from "../transport/colyseus/ZoneRoom.js";
import { registerHttpRoutes } from "../transport/http/registerHttpRoutes.js";

const TEST_SECRET = "test-multi-char-roster-secret-2026";

interface MockClientMessage {
  type: string;
  payload: unknown;
}

class MockColyseusClient {
  public readonly sessionId: string;
  public readonly messages: MockClientMessage[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  send(type: string, payload?: unknown): void {
    this.messages.push({ type, payload });
  }

  lastMessage<T = unknown>(type: string): T | undefined {
    for (let i = this.messages.length - 1; i >= 0; i -= 1) {
      if (this.messages[i]!.type === type) {
        return this.messages[i]!.payload as T;
      }
    }
    return undefined;
  }
}

describe(
  "Multi-Character Roster, Pre-World HTTP Routes, Handoff & Migration",
  { timeout: 15_000 },
  () => {
  const openDbs: GameDatabase[] = [];
  const openServers: Server[] = [];

  afterEach(async () => {
    while (openServers.length > 0) {
      const srv = openServers.pop();
      if (srv) {
        await new Promise<void>((resolve) => srv.close(() => resolve()));
      }
    }
    while (openDbs.length > 0) {
      const db = openDbs.pop();
      if (db) {
        await db.close();
      }
    }
  });

  async function createTestHarness() {
    const db = new GameDatabase({ dataDir: "memory://" });
    await db.init();
    openDbs.push(db);

    const engine = new AuthoritativeWorldEngine(db);
    configureServerSingletons(db, engine);

    const room = new ZoneRoom();
    (room as unknown as { clients: Client[]; broadcast: () => void }).clients = [];
    (room as unknown as { broadcast: () => void }).broadcast = () => {};
    room.onCreate({ zoneId: "tan_thu_thon" });

    const app = express();
    registerHttpRoutes({
      app,
      db,
      getEngine: () => engine,
      getActiveZoneRoom: (z) => getActiveZoneRoom(z)
    });

    const server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    openServers.push(server);
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const baseUrl = `http://127.0.0.1:${port}`;

    return { db, engine, room, baseUrl };
  }

  it("supports creating multiple characters on the same account, resuming drafts, and listing roster via HTTP", async () => {
    const { baseUrl } = await createTestHarness();

    const authResp = await fetch(`${baseUrl}/api/v02/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: "req_guest_issue_1" })
    });
    const authJson = (await authResp.json()) as GuestAuthResultPayload;
    expect(authJson.ok).toBe(true);
    const token = authJson.guestToken!;
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    const emptyRosterResp = await fetch(`${baseUrl}/api/v02/characters/roster`, {
      method: "GET",
      headers: authHeaders
    });
    const emptyRoster = (await emptyRosterResp.json()) as CharacterRosterResponsePayload;
    expect(emptyRoster.ok).toBe(true);
    expect(emptyRoster.characters).toHaveLength(0);
    expect(emptyRoster.lastSelectedCharacterId).toBeNull();

    const draft1Resp = await fetch(`${baseUrl}/api/v02/characters/draft`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        requestId: "req_draft_char_1",
        name: "Hàn Lập",
        appearanceId: "hero_kiem_tu"
      })
    });
    const draft1 = (await draft1Resp.json()) as CharacterV02ActionResultPayload;
    expect(draft1.ok).toBe(true);
    const char1Id = draft1.character!.identity.characterId;

    const roll1Resp = await fetch(
      `${baseUrl}/api/v02/characters/${encodeURIComponent(char1Id)}/reroll`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          requestId: "req_roll_char_1",
          characterId: char1Id
        })
      }
    );
    const roll1 = (await roll1Resp.json()) as CharacterV02ActionResultPayload;
    expect(roll1.ok).toBe(true);
    expect(roll1.rollDraft?.characterCreationId).toBe(char1Id);

    const confirm1Resp = await fetch(
      `${baseUrl}/api/v02/characters/${encodeURIComponent(char1Id)}/confirm`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          requestId: "req_confirm_char_1",
          characterId: char1Id,
          rollNonce: roll1.rollDraft!.rollNonce
        })
      }
    );
    const confirm1 = (await confirm1Resp.json()) as CharacterV02ActionResultPayload;
    expect(confirm1.ok).toBe(true);
    expect(confirm1.character?.identity.creationState).toBe("confirmed");

    const draft2Resp = await fetch(`${baseUrl}/api/v02/characters/draft`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        requestId: "req_draft_char_2",
        name: "Nam Cung Uyển",
        appearanceId: "ngoc_tam"
      })
    });
    const draft2 = (await draft2Resp.json()) as CharacterV02ActionResultPayload;
    expect(draft2.ok).toBe(true);
    const char2Id = draft2.character!.identity.characterId;
    expect(char2Id).not.toBe(char1Id);

    const roll2Resp = await fetch(
      `${baseUrl}/api/v02/characters/${encodeURIComponent(char2Id)}/reroll`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          requestId: "req_roll_char_2",
          characterId: char2Id
        })
      }
    );
    const roll2 = (await roll2Resp.json()) as CharacterV02ActionResultPayload;
    expect(roll2.ok).toBe(true);

    const rosterResp = await fetch(`${baseUrl}/api/v02/characters/roster`, {
      method: "GET",
      headers: authHeaders
    });
    const roster = (await rosterResp.json()) as CharacterRosterResponsePayload;
    expect(roster.ok).toBe(true);
    expect(roster.characters).toHaveLength(2);
    expect(roster.lastSelectedCharacterId).toBe(char1Id);

    const entry1 = roster.characters.find((c) => c.characterId === char1Id)!;
    const entry2 = roster.characters.find((c) => c.characterId === char2Id)!;
    expect(entry1.creationState).toBe("confirmed");
    expect(entry1.innateTraitIds).toHaveLength(3);
    expect(entry1.activeRollDraft).toBeNull();

    expect(entry2.creationState).toBe("draft");
    expect(entry2.innateTraitIds).toBeNull();
    expect(entry2.activeRollDraft?.rollNonce).toBe(roll2.rollDraft!.rollNonce);

    const confirm2Resp = await fetch(
      `${baseUrl}/api/v02/characters/${encodeURIComponent(char2Id)}/confirm`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          requestId: "req_confirm_char_2",
          characterId: char2Id,
          rollNonce: entry2.activeRollDraft!.rollNonce
        })
      }
    );
    const confirm2 = (await confirm2Resp.json()) as CharacterV02ActionResultPayload;
    expect(confirm2.ok).toBe(true);
    expect(confirm2.character?.identity.creationState).toBe("confirmed");
  });

  it("rejects selecting or spawning an unconfirmed draft character and enforces ownership across accounts", async () => {
    const { baseUrl, room } = await createTestHarness();

    const authAResp = await fetch(`${baseUrl}/api/v02/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const authA = (await authAResp.json()) as GuestAuthResultPayload;
    const tokenA = authA.guestToken!;

    const authBResp = await fetch(`${baseUrl}/api/v02/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const authB = (await authBResp.json()) as GuestAuthResultPayload;
    const tokenB = authB.guestToken!;

    const draftAResp = await fetch(`${baseUrl}/api/v02/characters/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        requestId: "req_draft_a1",
        name: "Đạo Hữu A1",
        appearanceId: "hero_kiem_tu"
      })
    });
    const draftA = (await draftAResp.json()) as CharacterV02ActionResultPayload;
    const charAId = draftA.character!.identity.characterId;

    const unconfirmedSelectResp = await fetch(
      `${baseUrl}/api/v02/characters/${encodeURIComponent(charAId)}/select`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          requestId: "req_select_unconfirmed",
          characterId: charAId
        })
      }
    );
    expect(unconfirmedSelectResp.status).toBe(409);
    const unconfirmedSelect =
      (await unconfirmedSelectResp.json()) as SelectCharacterForWorldEntryResultPayload;
    expect(unconfirmedSelect.ok).toBe(false);
    expect(unconfirmedSelect.code).toBe("CHARACTER_NOT_CONFIRMED");

    const clientUnconfirmed = new MockColyseusClient("sess_unconfirmed_a");
    await room.onJoin(clientUnconfirmed as unknown as Client, {
      zoneId: "tan_thu_thon",
      guestToken: tokenA,
      characterId: charAId
    });
    expect(room.getOnlinePlayerCount()).toBe(0);
    expect(
      clientUnconfirmed.lastMessage<CharacterV02ActionResultPayload>("v02_action_result")
        ?.code
    ).toBe("CHARACTER_NOT_CONFIRMED");
    await room.onLeave(clientUnconfirmed as unknown as Client);

    const hijackedRerollResp = await fetch(
      `${baseUrl}/api/v02/characters/${encodeURIComponent(charAId)}/reroll`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({
          requestId: "req_hijack_reroll",
          characterId: charAId
        })
      }
    );
    expect(hijackedRerollResp.status).toBe(403);
    const hijackedReroll =
      (await hijackedRerollResp.json()) as CharacterV02ActionResultPayload;
    expect(hijackedReroll.ok).toBe(false);
    expect(hijackedReroll.code).toBe("CHARACTER_OWNERSHIP_FORBIDDEN");

    const hijackedSelectResp = await fetch(
      `${baseUrl}/api/v02/characters/${encodeURIComponent(charAId)}/select`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({
          requestId: "req_hijack_select",
          characterId: charAId
        })
      }
    );
    expect(hijackedSelectResp.status).toBe(403);
    const hijackedSelect =
      (await hijackedSelectResp.json()) as SelectCharacterForWorldEntryResultPayload;
    expect(hijackedSelect.ok).toBe(false);
    expect(hijackedSelect.code).toBe("CHARACTER_OWNERSHIP_FORBIDDEN");

    const clientHijack = new MockColyseusClient("sess_hijack_b");
    await room.onJoin(clientHijack as unknown as Client, {
      zoneId: "tan_thu_thon",
      guestToken: tokenB,
      characterId: charAId
    });
    expect(room.getOnlinePlayerCount()).toBe(0);
    expect(
      clientHijack.lastMessage<CharacterV02ActionResultPayload>("v02_action_result")
        ?.code
    ).toBe("CHARACTER_OWNERSHIP_FORBIDDEN");
    await room.onLeave(clientHijack as unknown as Client);
  });

  it("cleanly switches characters on the same account without state bleed, monster target leak, or stale onLeave eviction", async () => {
    const { db, engine, room, baseUrl } = await createTestHarness();

    const authResp = await fetch(`${baseUrl}/api/v02/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const auth = (await authResp.json()) as GuestAuthResultPayload;
    const token = auth.guestToken!;
    const accountId = auth.accountId!;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    const createAndConfirm = async (key: string, name: string, appearanceId: string) => {
      const draftRes = await (
        await fetch(`${baseUrl}/api/v02/characters/draft`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            requestId: `draft_${key}`,
            name,
            appearanceId
          })
        })
      ).json();
      const charId = draftRes.character.identity.characterId as string;
      const rollRes = await (
        await fetch(
          `${baseUrl}/api/v02/characters/${encodeURIComponent(charId)}/reroll`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ requestId: `roll_${key}`, characterId: charId })
          }
        )
      ).json();
      const confirmRes = await (
        await fetch(
          `${baseUrl}/api/v02/characters/${encodeURIComponent(charId)}/confirm`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              requestId: `confirm_${key}`,
              characterId: charId,
              rollNonce: rollRes.rollDraft.rollNonce
            })
          }
        )
      ).json();
      expect(confirmRes.ok).toBe(true);
      return charId;
    };

    const charAId = await createAndConfirm("a", "Kiếm Khách A", "hero_kiem_tu");
    const charBId = await createAndConfirm("b", "Pháp Sư B", "ngoc_tam");

    const selectA = (await (
      await fetch(
        `${baseUrl}/api/v02/characters/${encodeURIComponent(charAId)}/select`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ requestId: "sel_a", characterId: charAId })
        }
      )
    ).json()) as SelectCharacterForWorldEntryResultPayload;
    expect(selectA.ok).toBe(true);
    expect(selectA.character?.identity.characterId).toBe(charAId);

    const clientA = new MockColyseusClient("sess_char_a");
    await room.onJoin(clientA as unknown as Client, {
      zoneId: "tan_thu_thon",
      guestToken: token,
      characterId: charAId
    });
    expect(room.getOnlinePlayerCount()).toBe(1);
    const selfA = clientA.lastMessage<CharacterSaveState>("self_state")!;
    expect(selfA.characterId).toBe(charAId);
    expect(selfA.nickname).toBe("Kiếm Khách A");

    selfA.linhThach = 777;
    const monster = Array.from(engine.monsters.values())[0]!;
    monster.zoneId = "tan_thu_thon";
    monster.targetAccountId = accountId;
    monster.targetCharacterId = charAId;

    const clientB = new MockColyseusClient("sess_char_b");
    await room.onJoin(clientB as unknown as Client, {
      zoneId: "tan_thu_thon",
      guestToken: token,
      characterId: charBId
    });

    expect(room.getOnlinePlayerCount()).toBe(1);
    const selfB = clientB.lastMessage<CharacterSaveState>("self_state")!;
    expect(selfB.characterId).toBe(charBId);
    expect(selfB.nickname).toBe("Pháp Sư B");
    expect(selfB.linhThach).not.toBe(777);
    expect(monster.targetAccountId).toBeNull();
    expect(monster.targetCharacterId).toBeNull();

    const persistedA = await db.getOwnedCharacterV02ById(accountId, charAId);
    expect(persistedA?.world.linhThach).toBe(777);

    await room.onLeave(clientA as unknown as Client);
    expect(room.getOnlinePlayerCount()).toBe(1);
    const worldSnapAfterStaleLeave = room.buildWorldSnapshot();
    expect(Object.keys(worldSnapAfterStaleLeave.players)).toEqual([charBId]);

    const expRes = await db.characterV02Actions.awardCharacterExpServerOnly({
      accountId,
      characterId: charAId,
      requestId: "req_char_a_exp",
      expDelta: 5000
    });
    expect(expRes.ok).toBe(true);
    const refreshedA = await db.getOwnedCharacterV02ById(accountId, charAId);
    const refreshedB = await db.getOwnedCharacterV02ById(accountId, charBId);
    expect(refreshedA!.levelProgress.level).toBeGreaterThan(1);
    expect(refreshedB!.levelProgress.level).toBe(1);

    await room.handleClientMessage(
      clientB as unknown as Client,
      "v02_leave_world",
      {}
    );
    expect(room.getOnlinePlayerCount()).toBe(0);
    await room.onLeave(clientB as unknown as Client);
  });

  it("inspects and migrates legacy single-character UNIQUE(account_id) schema idempotently without losing existing rows", async () => {
    const adapter = new PGliteAdapter("memory://");

    await adapter.query(`
      CREATE TABLE characters (
        character_id TEXT PRIMARY KEY,
        account_id TEXT UNIQUE NOT NULL,
        nickname TEXT NOT NULL,
        discipline TEXT NOT NULL DEFAULT 'kiem_tu',
        zone_id TEXT NOT NULL DEFAULT 'tan_thu_thon',
        x INTEGER NOT NULL DEFAULT 15,
        y INTEGER NOT NULL DEFAULT 15,
        direction TEXT NOT NULL DEFAULT 'down',
        realm_id TEXT NOT NULL DEFAULT 'pham_nhan',
        realm_stage INTEGER NOT NULL DEFAULT 1,
        tu_vi INTEGER NOT NULL DEFAULT 0,
        hp INTEGER NOT NULL DEFAULT 120,
        max_hp INTEGER NOT NULL DEFAULT 120,
        mp INTEGER NOT NULL DEFAULT 60,
        max_mp INTEGER NOT NULL DEFAULT 60,
        attack INTEGER NOT NULL DEFAULT 15,
        defense INTEGER NOT NULL DEFAULT 8,
        linh_thach INTEGER NOT NULL DEFAULT 50,
        equipped_title TEXT NOT NULL DEFAULT 'Tân Đệ Tử Bát Hoang',
        equipped_inheritance TEXT,
        inventory_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        quests_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        reputation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        buffs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        meditation_started_at BIGINT NOT NULL DEFAULT 0,
        last_meditation_claim_at BIGINT NOT NULL DEFAULT 0,
        updated_at BIGINT NOT NULL DEFAULT 0
      )
    `);
    await adapter.query(`
      CREATE TABLE characters_v02 (
        character_id TEXT PRIMARY KEY,
        account_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        appearance_id TEXT NOT NULL DEFAULT 'hero_kiem_tu',
        creation_state TEXT NOT NULL,
        level INTEGER NOT NULL,
        exp_toward_next NUMERIC(38, 0) NOT NULL,
        free_attribute_points INTEGER NOT NULL,
        allocated_attributes_json JSONB NOT NULL,
        earned_permanent_attributes_json JSONB NOT NULL,
        realm_id TEXT NOT NULL,
        realm_stage INTEGER NOT NULL,
        tu_vi NUMERIC(38, 0) NOT NULL,
        destiny_json JSONB,
        current_hp INTEGER NOT NULL DEFAULT 100,
        current_mp INTEGER NOT NULL DEFAULT 50,
        zone_id TEXT NOT NULL DEFAULT 'tan_thu_thon',
        x INTEGER NOT NULL DEFAULT 320,
        y INTEGER NOT NULL DEFAULT 368,
        direction TEXT NOT NULL DEFAULT 'down',
        linh_thach INTEGER NOT NULL DEFAULT 50,
        equipped_title TEXT NOT NULL DEFAULT 'Phàm Nhân Sơ Nhập',
        equipped_inheritance TEXT,
        inventory_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        quests_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        reputation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        buffs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        meditation_started_at_ms BIGINT NOT NULL DEFAULT 0,
        last_meditation_claim_at_ms BIGINT NOT NULL DEFAULT 0,
        revision INTEGER NOT NULL,
        created_at_ms BIGINT NOT NULL,
        updated_at_ms BIGINT NOT NULL
      )
    `);
    await adapter.query(`
      INSERT INTO characters_v02 (
        character_id,
        account_id,
        name,
        appearance_id,
        creation_state,
        level,
        exp_toward_next,
        free_attribute_points,
        allocated_attributes_json,
        earned_permanent_attributes_json,
        realm_id,
        realm_stage,
        tu_vi,
        destiny_json,
        revision,
        created_at_ms,
        updated_at_ms
      ) VALUES (
        'char_v02_legacy_1',
        'acc_legacy_1',
        'Tiền Bối Cũ',
        'hero_kiem_tu',
        'confirmed',
        5,
        '100',
        4,
        '{"the_phach":0,"luc_dao":0,"linh_tinh":0,"than_phap":0,"than_thuc":0,"ngo_tinh":0}'::jsonb,
        '{"the_phach":0,"luc_dao":0,"linh_tinh":0,"than_phap":0,"than_thuc":0,"ngo_tinh":0}'::jsonb,
        'pham_nhan',
        0,
        '0',
        '{"innate":["kiet_ao_bat_khuan","thien_sinh_kiem_cot","van_vi_dao_thai"],"innateConfirmedAtMs":1700000000000,"acquiredTraitIds":[],"activeAcquiredSlots":[null,null,null],"collectionRevision":1}'::jsonb,
        2,
        1700000000000,
        1700000000000
      )
    `);

    const guardedDb = new GameDatabase({
      dataDir: "memory://",
      executor: adapter
    });
    await expect(guardedDb.init()).rejects.toThrow(
      /LEGACY_SINGLE_CHARACTER_SCHEMA_MIGRATION_REQUIRED/
    );

    const beforeInspection = await inspectMultiCharacterSchemaState(adapter);
    expect(beforeInspection.hasUniqueAccountConstraintOnCharactersV02).toBe(true);
    expect(beforeInspection.hasUniqueAccountConstraintOnLegacyCharacters).toBe(true);
    expect(beforeInspection.existingCharactersV02Count).toBe(1);
    expect(beforeInspection.isLegacySingleCharSchema).toBe(true);

    const dryRunReport = await runMultiCharacterV02Migration(adapter, { dryRun: true });
    expect(dryRunReport.dryRun).toBe(true);
    expect(dryRunReport.migrated).toBe(false);

    const afterDryRun = await inspectMultiCharacterSchemaState(adapter);
    expect(afterDryRun.isLegacySingleCharSchema).toBe(true);

    const applyReport = await runMultiCharacterV02Migration(adapter, { dryRun: false });
    expect(applyReport.dryRun).toBe(false);
    expect(applyReport.migrated).toBe(true);
    const afterInspection = await inspectMultiCharacterSchemaState(adapter);
    expect(afterInspection.isLegacySingleCharSchema).toBe(false);
    expect(afterInspection.existingCharactersV02Count).toBe(1);

    const secondApply = await runMultiCharacterV02Migration(adapter, { dryRun: false });
    expect(secondApply.migrated).toBe(false);

    await adapter.query(`
      INSERT INTO characters_v02 (
        character_id,
        account_id,
        name,
        appearance_id,
        creation_state,
        level,
        exp_toward_next,
        free_attribute_points,
        allocated_attributes_json,
        earned_permanent_attributes_json,
        realm_id,
        realm_stage,
        tu_vi,
        destiny_json,
        revision,
        created_at_ms,
        updated_at_ms
      ) VALUES (
        'char_v02_legacy_2',
        'acc_legacy_1',
        'Hậu Bối Mới',
        'ngoc_tam',
        'draft',
        1,
        '0',
        0,
        '{"the_phach":0,"luc_dao":0,"linh_tinh":0,"than_phap":0,"than_thuc":0,"ngo_tinh":0}'::jsonb,
        '{"the_phach":0,"luc_dao":0,"linh_tinh":0,"than_phap":0,"than_thuc":0,"ngo_tinh":0}'::jsonb,
        'pham_nhan',
        0,
        '0',
        NULL,
        1,
        1700000010000,
        1700000010000
      )
    `);

    const countRes = await adapter.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM characters_v02 WHERE account_id = 'acc_legacy_1'`
    );
    expect(Number(countRes.rows[0]?.cnt)).toBe(2);

    await adapter.close();
  });
});
