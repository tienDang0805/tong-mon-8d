import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { DestinyCollection, DestinyDefinitionMetadata } from "@tong-mon-8d/shared";
import {
  createZeroBaseAttributes,
  TD01_CANDIDATE_RULESET_VERSION
} from "@tong-mon-8d/game-data";
import {
  CHARACTER_V02_SCHEMA_VERSION,
  CharacterV02PersistenceError,
  createInitialCharacterV02State,
  GameDatabase,
  TransactionUsageError,
  validateCharacterV02PersistedState,
  type CharacterV02PersistedState
} from "../db.js";

const SAMPLE_DESTINY_CATALOG: Readonly<Record<string, DestinyDefinitionMetadata>> = Object.freeze({
  tl_manh_me: {
    id: "tl_manh_me",
    displayNameVi: "Mạnh Mẽ Bẩm Sinh",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  tl_linh_nhan: {
    id: "tl_linh_nhan",
    displayNameVi: "Linh Nhãn Thông Minh",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  tl_kiem_tam: {
    id: "tl_kiem_tam",
    displayNameVi: "Kiếm Tâm Thông Minh",
    rarity: "tien",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  tl_van_vi_dao_thai: {
    id: "tl_van_vi_dao_thai",
    displayNameVi: "Vạn Vị Đạo Thai",
    rarity: "than",
    kind: "legendary_signature",
    legendaryNpcId: "phi_de",
    ownerApprovalState: "APPROVED"
  },
  tl_thanh_ngoc_linh_khe: {
    id: "tl_thanh_ngoc_linh_khe",
    displayNameVi: "Thanh Ngọc Linh Khế",
    rarity: "than",
    kind: "legendary_signature",
    legendaryNpcId: "chatdvt",
    ownerApprovalState: "PROPOSED"
  },
  ht_thiet_cot: {
    id: "ht_thiet_cot",
    displayNameVi: "Thiết Cốt Cảnh",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  ht_linh_tuc: {
    id: "ht_linh_tuc",
    displayNameVi: "Linh Tức Thuật",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  ht_thien_nhai_bo: {
    id: "ht_thien_nhai_bo",
    displayNameVi: "Thiên Nhai Bộ",
    rarity: "tien",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  }
});

function buildConfirmedDestiny(): DestinyCollection {
  return {
    innate: ["tl_manh_me", "tl_linh_nhan", "tl_van_vi_dao_thai"],
    innateConfirmedAtMs: 1_760_000_100_000,
    acquiredTraitIds: ["ht_thiet_cot", "ht_linh_tuc"],
    activeAcquiredSlots: ["ht_thiet_cot", null, "ht_linh_tuc"],
    collectionRevision: 1
  };
}

describe("Character v0.2 Persistence Foundation (S1-C)", () => {
  const openDatabases: GameDatabase[] = [];
  const tempDirs: string[] = [];

  afterEach(async () => {
    while (openDatabases.length > 0) {
      const db = openDatabases.pop();
      if (db) {
        await db.close();
      }
    }
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir && fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  async function createMemoryDb(): Promise<GameDatabase> {
    const db = new GameDatabase({ dataDir: "memory://" });
    openDatabases.push(db);
    await db.init();
    return db;
  }

  it("initializes characters_v02 idempotently without redundant derived stat columns", async () => {
    const db = await createMemoryDb();
    await db.init();

    const cols = await db.withTransaction(async (tx) => {
      return tx.query<{ column_name: string; data_type: string; numeric_precision: number | null }>(
        `SELECT column_name, data_type, numeric_precision
         FROM information_schema.columns
         WHERE table_name = 'characters_v02'
         ORDER BY ordinal_position`
      );
    });

    const columnMap = new Map(
      cols.rows.map((r) => [r.column_name, { dataType: r.data_type, precision: r.numeric_precision }])
    );

    expect(columnMap.has("character_id")).toBe(true);
    expect(columnMap.has("account_id")).toBe(true);
    expect(columnMap.has("creation_state")).toBe(true);
    expect(columnMap.has("revision")).toBe(true);
    expect(columnMap.get("exp_toward_next")?.dataType).toBe("numeric");
    expect(columnMap.get("exp_toward_next")?.precision).toBe(38);
    expect(columnMap.get("tu_vi")?.dataType).toBe("numeric");
    expect(columnMap.get("tu_vi")?.precision).toBe(38);
    expect(columnMap.has("current_hp")).toBe(true);
    expect(columnMap.has("current_mp")).toBe(true);

    expect(columnMap.has("max_hp")).toBe(false);
    expect(columnMap.has("max_mp")).toBe(false);
    expect(columnMap.has("attack")).toBe(false);
    expect(columnMap.has("defense")).toBe(false);
  });

  it("creates, loads, and transitions a draft Character v0.2 to confirmed state", async () => {
    const db = await createMemoryDb();
    const draftState = createInitialCharacterV02State({
      characterId: "char_v02_draft_01",
      accountId: "acc_v02_01",
      name: "Mạc Phàm",
      appearanceId: "hero_kiem_tu",
      createdAtMs: 1_760_000_000_000,
      creationState: "draft"
    });

    const created = await db.createCharacterV02(draftState, {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });
    expect(created).toEqual(draftState);
    expect(created.schemaVersion).toBe(CHARACTER_V02_SCHEMA_VERSION);
    expect(created.rulesetVersion).toBe(TD01_CANDIDATE_RULESET_VERSION);
    expect(created.identity.creationState).toBe("draft");
    expect(created.identity.revision).toBe(1);
    expect(created.destiny).toBeNull();

    const byId = await db.getCharacterV02ById("char_v02_draft_01", {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });
    const byAcc = await db.getCharacterV02ByAccount("acc_v02_01", {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });
    expect(byId).toEqual(created);
    expect(byAcc).toEqual(created);

    const confirmedDestiny = buildConfirmedDestiny();
    const confirmedNext: CharacterV02PersistedState = {
      ...created,
      identity: {
        ...created.identity,
        creationState: "confirmed",
        revision: 2
      },
      destiny: confirmedDestiny,
      updatedAtMs: 1_760_000_100_000
    };

    const updated = await db.updateCharacterV02(
      {
        expectedRevision: 1,
        nextState: confirmedNext
      },
      { destinyCatalog: SAMPLE_DESTINY_CATALOG }
    );

    expect(updated.identity.creationState).toBe("confirmed");
    expect(updated.identity.revision).toBe(2);
    expect(updated.destiny).toEqual(confirmedDestiny);
  });

  it("persists across file-backed PGlite close/reopen and round-trips 38-digit decimal EXP and Tu Vi", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm8d-s1c-pglite-"));
    tempDirs.push(tmpDir);

    const db1 = new GameDatabase({ dataDir: tmpDir });
    await db1.init();

    const baseDraft = createInitialCharacterV02State({
      characterId: "char_saint_360",
      accountId: "acc_saint_360",
      name: "Huyền Thiên Thánh Tổ",
      createdAtMs: 1_760_000_000_000,
      creationState: "confirmed",
      destiny: buildConfirmedDestiny()
    });

    const highPrecisionState: CharacterV02PersistedState = {
      ...baseDraft,
      levelProgress: {
        level: 360,
        expTowardNext: "12345678901234567890123456789012345678",
        freeAttributePoints: 9,
        allocated: {
          the_phach: 70,
          luc_dao: 65,
          linh_tinh: 60,
          than_phap: 55,
          than_thuc: 50,
          ngo_tinh: 50
        },
        earnedPermanent: {
          the_phach: 12,
          luc_dao: 8,
          linh_tinh: 15,
          than_phap: 6,
          than_thuc: 10,
          ngo_tinh: 9
        }
      },
      cultivation: {
        realmId: "thanh_canh",
        realmStage: 4,
        tuVi: "98765432109876543210987654321098765432"
      },
      resources: {
        currentHp: 850000,
        currentMp: 420000
      },
      world: {
        ...baseDraft.world,
        zoneId: "thanh_truc_lam",
        x: 24,
        y: 18,
        direction: "right",
        linhThach: 125000,
        equippedTitle: "Thánh Cảnh Đại Năng",
        equippedInheritance: "phi_de",
        inventory: [
          { itemId: "thanh_van_kiem_so_cap", quantity: 1 },
          { itemId: "bot_linh_mach", quantity: 25, quality: "tien_tru" }
        ],
        quests: {
          main_q1: {
            questId: "main_q1",
            status: "completed",
            stepIndex: 3,
            objectiveCount: 3,
            completedAt: 1_760_000_050_000
          }
        },
        reputation: { phi_de: 999, chatdvt: 450, hoa_tran: 120 },
        buffs: [
          {
            buffId: "buff_linh_ thiện",
            name: "Linh Thiện Đại Bổ",
            slot: "meal",
            attackBonus: 120,
            defenseBonus: 80,
            hpBonus: 500,
            tuViMultiplier: 1.5,
            expiresAt: 1_760_009_000_000
          }
        ]
      },
      updatedAtMs: 1_760_000_200_000
    };

    await db1.createCharacterV02(highPrecisionState, {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });
    await db1.close();

    const db2 = new GameDatabase({ dataDir: tmpDir });
    openDatabases.push(db2);
    await db2.init();

    const reloaded = await db2.getCharacterV02ById("char_saint_360", {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });
    expect(reloaded).toEqual(highPrecisionState);
    expect(reloaded?.levelProgress.expTowardNext).toBe(
      "12345678901234567890123456789012345678"
    );
    expect(reloaded?.cultivation.tuVi).toBe(
      "98765432109876543210987654321098765432"
    );
  }, 15_000);

  it("rejects duplicate characterId while allowing multiple characters per accountId without overwriting existing state", async () => {
    const db = await createMemoryDb();
    const first = createInitialCharacterV02State({
      characterId: "char_unique_1",
      accountId: "acc_unique_1",
      name: "Đạo Hữu Nhất",
      createdAtMs: 1_760_000_000_000,
      creationState: "confirmed",
      destiny: buildConfirmedDestiny()
    });
    await db.createCharacterV02(first, { destinyCatalog: SAMPLE_DESTINY_CATALOG });

    const sameCharIdDifferentAcc = createInitialCharacterV02State({
      characterId: "char_unique_1",
      accountId: "acc_unique_2",
      name: "Kẻ Mạo Danh",
      createdAtMs: 1_760_000_010_000,
      creationState: "draft"
    });
    await expect(db.createCharacterV02(sameCharIdDifferentAcc)).rejects.toMatchObject({
      name: "CharacterV02PersistenceError",
      code: "DUPLICATE_CHARACTER_ID"
    });

    const differentCharIdSameAcc = createInitialCharacterV02State({
      characterId: "char_unique_2",
      accountId: "acc_unique_1",
      name: "Phân Thân Hợp Pháp",
      createdAtMs: 1_760_000_020_000,
      creationState: "draft"
    });
    const secondCreated = await db.createCharacterV02(differentCharIdSameAcc);
    expect(secondCreated.identity.characterId).toBe("char_unique_2");

    const firstPersisted = await db.getCharacterV02ById("char_unique_1", {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });
    expect(firstPersisted).toEqual(first);

    const allForAccount = await db.listCharactersV02ByAccount("acc_unique_1", {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });
    expect(allForAccount.map((c) => c.identity.characterId)).toEqual([
      "char_unique_1",
      "char_unique_2"
    ]);
  });

  it("enforces optimistic concurrency and immutability of confirmed Tiên Thiên Destiny and identity", async () => {
    const db = await createMemoryDb();
    const initial = createInitialCharacterV02State({
      characterId: "char_imm_1",
      accountId: "acc_imm_1",
      name: "Lâm Động",
      createdAtMs: 1_760_000_000_000,
      creationState: "confirmed",
      destiny: buildConfirmedDestiny()
    });
    const created = await db.createCharacterV02(initial, {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });

    await expect(
      db.updateCharacterV02({
        expectedRevision: 1,
        nextState: {
          ...created,
          identity: { ...created.identity, revision: 3 }
        }
      })
    ).rejects.toMatchObject({
      name: "CharacterV02PersistenceError",
      code: "REVISION_MISMATCH"
    });

    await expect(
      db.updateCharacterV02({
        expectedRevision: 2,
        nextState: {
          ...created,
          identity: { ...created.identity, revision: 3 }
        }
      })
    ).rejects.toMatchObject({
      name: "CharacterV02PersistenceError",
      code: "REVISION_CONFLICT"
    });

    await expect(
      db.updateCharacterV02({
        expectedRevision: 1,
        nextState: {
          ...created,
          identity: {
            ...created.identity,
            accountId: "acc_hijack",
            revision: 2
          }
        }
      })
    ).rejects.toMatchObject({
      name: "CharacterV02PersistenceError",
      code: "IMMUTABLE_IDENTITY_VIOLATION"
    });

    await expect(
      db.updateCharacterV02({
        expectedRevision: 1,
        nextState: {
          ...created,
          identity: {
            ...created.identity,
            creationState: "draft",
            revision: 2
          },
          destiny: null
        }
      })
    ).rejects.toMatchObject({
      name: "CharacterV02PersistenceError",
      code: "IMMUTABLE_CREATION_STATE_VIOLATION"
    });

    await expect(
      db.updateCharacterV02({
        expectedRevision: 1,
        nextState: {
          ...created,
          identity: { ...created.identity, revision: 2 },
          destiny: {
            ...created.destiny!,
            innate: ["tl_manh_me", "tl_linh_nhan", "tl_kiem_tam"]
          }
        }
      })
    ).rejects.toMatchObject({
      name: "CharacterV02PersistenceError",
      code: "IMMUTABLE_INNATE_DESTINY_VIOLATION"
    });

    const validHauThienUpdate = await db.updateCharacterV02(
      {
        expectedRevision: 1,
        nextState: {
          ...created,
          identity: { ...created.identity, revision: 2 },
          destiny: {
            ...created.destiny!,
            acquiredTraitIds: ["ht_thiet_cot", "ht_linh_tuc", "ht_thien_nhai_bo"],
            activeAcquiredSlots: ["ht_thiet_cot", "ht_thien_nhai_bo", "ht_linh_tuc"],
            collectionRevision: 2
          },
          updatedAtMs: 1_760_000_300_000
        }
      },
      { destinyCatalog: SAMPLE_DESTINY_CATALOG }
    );
    expect(validHauThienUpdate.identity.revision).toBe(2);
    expect(validHauThienUpdate.destiny?.collectionRevision).toBe(2);
    expect(validHauThienUpdate.destiny?.activeAcquiredSlots).toEqual([
      "ht_thiet_cot",
      "ht_thien_nhai_bo",
      "ht_linh_tuc"
    ]);

    await expect(
      db.updateCharacterV02({
        expectedRevision: 2,
        nextState: {
          ...validHauThienUpdate,
          identity: { ...validHauThienUpdate.identity, revision: 3 },
          destiny: {
            ...validHauThienUpdate.destiny!,
            collectionRevision: 1
          }
        }
      })
    ).rejects.toMatchObject({
      name: "CharacterV02PersistenceError",
      code: "DESTINY_REVISION_REGRESSION"
    });
  });

  it("rejects invalid Level/point invariants, realm bands, cap overflow EXP, and multiple Legendary signatures", () => {
    const base = createInitialCharacterV02State({
      characterId: "char_val_1",
      accountId: "acc_val_1",
      name: "Kiểm Định Giả",
      createdAtMs: 1_760_000_000_000,
      creationState: "confirmed",
      destiny: buildConfirmedDestiny()
    });

    const badPoints = validateCharacterV02PersistedState({
      ...base,
      levelProgress: {
        ...base.levelProgress,
        level: 5,
        freeAttributePoints: 2,
        allocated: createZeroBaseAttributes()
      }
    });
    expect(badPoints).toEqual({
      ok: false,
      code: "INVALID_LEVEL_PROGRESS",
      detail: expect.stringContaining("LEVEL_POINT_INVARIANT_MISMATCH")
    });

    const badRealmBand = validateCharacterV02PersistedState({
      ...base,
      levelProgress: {
        ...base.levelProgress,
        level: 11,
        freeAttributePoints: 10
      },
      cultivation: {
        realmId: "pham_nhan",
        realmStage: 1,
        tuVi: "100"
      }
    });
    expect(badRealmBand.ok).toBe(false);
    if (!badRealmBand.ok) {
      expect(badRealmBand.code).toBe("LEVEL_NOT_ALLOWED_FOR_REALM");
    }

    const badCapOverflow = validateCharacterV02PersistedState({
      ...base,
      levelProgress: {
        ...base.levelProgress,
        level: 10,
        expTowardNext: "1",
        freeAttributePoints: 9
      },
      cultivation: {
        realmId: "pham_nhan",
        realmStage: 1,
        tuVi: "120"
      }
    });
    expect(badCapOverflow.ok).toBe(false);
    if (!badCapOverflow.ok) {
      expect(badCapOverflow.code).toBe("NON_ZERO_EXP_AT_REALM_CAP");
    }

    const twoSignatures = validateCharacterV02PersistedState(
      {
        ...base,
        destiny: {
          ...base.destiny!,
          innate: ["tl_manh_me", "tl_van_vi_dao_thai", "tl_thanh_ngoc_linh_khe"]
        }
      },
      { destinyCatalog: SAMPLE_DESTINY_CATALOG }
    );
    expect(twoSignatures.ok).toBe(false);
    if (!twoSignatures.ok) {
      expect(twoSignatures.code).toBe("INVALID_DESTINY_STATE");
      expect(twoSignatures.detail).toContain("MULTIPLE_LEGENDARY_SIGNATURES");
    }
  });

  it("rolls back atomic Character v0.2 writes on transaction failure and enforces MISSING_TRANSACTION_RUNNER", async () => {
    const db = await createMemoryDb();
    const initial = createInitialCharacterV02State({
      characterId: "char_tx_1",
      accountId: "acc_tx_1",
      name: "Tiêu Viêm",
      createdAtMs: 1_760_000_000_000,
      creationState: "confirmed",
      destiny: buildConfirmedDestiny()
    });
    const created = await db.createCharacterV02(initial, {
      destinyCatalog: SAMPLE_DESTINY_CATALOG
    });

    await expect(
      db.withTransaction(async () => {
        await db.getCharacterV02ById("char_tx_1");
      })
    ).rejects.toBeInstanceOf(TransactionUsageError);

    await expect(
      db.withTransaction(async () => {
        await db.getCharacterV02ById("char_tx_1");
      })
    ).rejects.toMatchObject({
      code: "MISSING_TRANSACTION_RUNNER"
    });

    await expect(
      db.withTransaction(async (tx) => {
        await db.updateCharacterV02(
          {
            expectedRevision: 1,
            nextState: {
              ...created,
              identity: { ...created.identity, revision: 2 },
              levelProgress: {
                ...created.levelProgress,
                level: 2,
                freeAttributePoints: 1
              },
              updatedAtMs: 1_760_000_500_000
            }
          },
          { destinyCatalog: SAMPLE_DESTINY_CATALOG },
          tx
        );
        await db.recordIdempotency(
          "req_rollback_01",
          "char_tx_1",
          "allocate_stats",
          {
            requestId: "req_rollback_01",
            ok: true,
            code: "OK",
            messageVi: "Thành công"
          },
          tx
        );
        await db.logEconomyEvent("char_tx_1", "test_grant", 500, undefined, undefined, tx);
        throw new Error("SIMULATED_DOWNSTREAM_FAILURE");
      })
    ).rejects.toThrow("SIMULATED_DOWNSTREAM_FAILURE");

    const afterRollback = await db.getCharacterV02ById("char_tx_1");
    expect(afterRollback).toEqual(created);
    expect(afterRollback?.identity.revision).toBe(1);
    expect(afterRollback?.levelProgress.level).toBe(1);

    const idemCheck = await db.checkIdempotency("req_rollback_01");
    expect(idemCheck).toBeNull();
  });

  it("coexists cleanly with legacy v0.1 characters table in the same database", async () => {
    const db = await createMemoryDb();
    const legacyChar = await db.loadOrCreateCharacter("acc_coexist", "Cổ Tu Sĩ", "kiem_tu");
    expect(legacyChar.accountId).toBe("acc_coexist");

    const v02Char = createInitialCharacterV02State({
      characterId: "char_v02_coexist",
      accountId: "acc_coexist",
      name: "Tân Tu Sĩ",
      createdAtMs: 1_760_000_000_000,
      creationState: "draft"
    });
    const savedV02 = await db.createCharacterV02(v02Char);
    expect(savedV02.identity.characterId).toBe("char_v02_coexist");

    const loadedLegacy = await db.getCharacterByAccount("acc_coexist");
    const loadedV02 = await db.getCharacterV02ByAccount("acc_coexist");
    expect(loadedLegacy?.nickname).toBe("Cổ Tu Sĩ");
    expect(loadedV02?.identity.name).toBe("Tân Tu Sĩ");
  });
});
