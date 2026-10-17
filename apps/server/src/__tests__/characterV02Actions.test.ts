import { afterEach, describe, expect, it } from "vitest";
import type { Client } from "colyseus";
import type {
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  DestinyDefinitionMetadata,
  GuestAuthResultPayload
} from "@tong-mon-8d/shared";
import {
  LEGENDARY_NPCS,
  S1E_STARTER_DESTINY_CATALOG,
  S1E_STARTER_DESTINY_CATALOG_VERSION,
  computeCandidateBaselineStatSnapshot
} from "@tong-mon-8d/game-data";
import {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  GameDatabase,
  rollInnateDestinyTripleFromCatalog
} from "../db.js";
import { AuthoritativeWorldEngine } from "../worldEngine.js";
import { ZoneRoom, configureServerSingletons } from "../zoneRoom.js";

const SYNTHETIC_DESTINY_CATALOG: Readonly<
  Record<string, DestinyDefinitionMetadata>
> = Object.freeze({
  van_vi_dao_thai: {
    id: "van_vi_dao_thai",
    displayNameVi: "Vạn Vị Đạo Thai",
    rarity: "than",
    kind: "legendary_signature",
    legendaryNpcId: "phi_de",
    ownerApprovalState: "APPROVED"
  },
  kiem_tam_thong_minh: {
    id: "kiem_tam_thong_minh",
    displayNameVi: "Kiếm Tâm Thông Minh",
    rarity: "than",
    kind: "legendary_signature",
    legendaryNpcId: "anh_7",
    ownerApprovalState: "PROPOSED"
  },
  tien_thien_dao_the: {
    id: "tien_thien_dao_the",
    displayNameVi: "Tiên Thiên Đạo Thể",
    rarity: "than",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  linh_mach_thien_phu: {
    id: "linh_mach_thien_phu",
    displayNameVi: "Linh Mạch Thiên Phú",
    rarity: "tien",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  kim_cang_ban_the: {
    id: "kim_cang_ban_the",
    displayNameVi: "Kim Cang Bản Thể",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  thanh_phong_than_bo: {
    id: "thanh_phong_than_bo",
    displayNameVi: "Thanh Phong Thân Bộ",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  bach_thao_linh_khi: {
    id: "bach_thao_linh_khi",
    displayNameVi: "Bách Thảo Linh Khí",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  hau_thien_kiem_y: {
    id: "hau_thien_kiem_y",
    displayNameVi: "Hậu Thiên Kiếm Ý",
    rarity: "hoang",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  hau_thien_dan_tam: {
    id: "hau_thien_dan_tam",
    displayNameVi: "Hậu Thiên Đan Tâm",
    rarity: "tien",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  hau_thien_tran_phap: {
    id: "hau_thien_tran_phap",
    displayNameVi: "Hậu Thiên Trận Pháp",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  },
  hau_thien_thanh_tam: {
    id: "hau_thien_thanh_tam",
    displayNameVi: "Hậu Thiên Thanh Tâm",
    rarity: "pham",
    kind: "ordinary",
    legendaryNpcId: null,
    ownerApprovalState: "PROPOSED"
  }
});

const SYNTHETIC_ACTION_OPTIONS = Object.freeze({
  destinyCatalog: SYNTHETIC_DESTINY_CATALOG,
  allowNonApprovedCatalogInTests: true
});

describe("S1-D Character v0.2 Authoritative Server Actions & Guest Identity", () => {
  const openDatabases: GameDatabase[] = [];
  const activeShutdowns: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (activeShutdowns.length > 0) {
      const stop = activeShutdowns.pop();
      if (stop) {
        await stop();
      }
    }
    while (openDatabases.length > 0) {
      const db = openDatabases.pop();
      if (db) {
        await db.close();
      }
    }
  });

  async function createIsolatedDb(): Promise<GameDatabase> {
    const db = new GameDatabase({ dataDir: "memory://" });
    await db.init();
    openDatabases.push(db);
    return db;
  }

  it("rolls against the 16-trait S1E_STARTER_DESTINY_CATALOG by default and fails closed with CATALOG_NOT_READY when fewer than 3 eligible traits exist", async () => {
    const db = await createIsolatedDb();
    const issued = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_000_000 });

    const draftRes = await db.characterV02Actions.createCharacterDraft(
      issued.accountId,
      {
        requestId: "req_draft_default_cat",
        name: "Hàn Lập"
      },
      { nowMs: 1_700_000_000_100 }
    );
    expect(draftRes.ok).toBe(true);
    expect(Object.keys(APPROVED_PRODUCTION_DESTINY_CATALOG)).toHaveLength(16);

    const incompleteRollRes = await db.characterV02Actions.rollInnateDestiny(
      issued.accountId,
      {
        requestId: "req_roll_incomplete_cat"
      },
      {
        nowMs: 1_700_000_000_150,
        destinyCatalog: {
          van_vi_dao_thai: APPROVED_PRODUCTION_DESTINY_CATALOG.van_vi_dao_thai
        }
      }
    );
    expect(incompleteRollRes.ok).toBe(false);
    expect(incompleteRollRes.code).toBe("CATALOG_NOT_READY");

    const persistedAfterFail = await db.getCharacterV02ByAccount(issued.accountId);
    expect(persistedAfterFail?.identity.creationState).toBe("draft");
    expect(persistedAfterFail?.destiny).toBeNull();
    expect(persistedAfterFail?.identity.revision).toBe(1);

    const defaultRollRes = await db.characterV02Actions.rollInnateDestiny(
      issued.accountId,
      {
        requestId: "req_roll_default_cat"
      },
      { nowMs: 1_700_000_000_200 }
    );
    expect(defaultRollRes.ok).toBe(true);
    expect(defaultRollRes.rollDraft?.candidateTraitIds).toHaveLength(3);
  });

  it("verifies guest credentials in constant time and enforces single active session ownership per account", async () => {
    const db = await createIsolatedDb();
    const issued = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_000_000 });

    const validVerify = await db.guestIdentity.verifyGuestToken(issued.guestToken);
    expect(validVerify).toEqual({
      ok: true,
      accountId: issued.accountId
    });

    const tamperedSecret = `${issued.accountId}.${"f".repeat(64)}`;
    const badSecretVerify = await db.guestIdentity.verifyGuestToken(tamperedSecret);
    expect(badSecretVerify.ok).toBe(false);
    if (!badSecretVerify.ok) {
      expect(badSecretVerify.code).toBe("INVALID_GUEST_CREDENTIAL");
    }

    const unknownAccountToken = `acct_v02_${"a".repeat(24)}.${"b".repeat(64)}`;
    const unknownVerify = await db.guestIdentity.verifyGuestToken(unknownAccountToken);
    expect(unknownVerify.ok).toBe(false);

    const malformedVerify = await db.guestIdentity.verifyGuestToken("not-a-valid-token");
    expect(malformedVerify.ok).toBe(false);

    const unauthCheck = db.guestIdentity.assertVerifiedSession("sess_unverified");
    expect(unauthCheck.ok).toBe(false);
    if (!unauthCheck.ok) {
      expect(unauthCheck.code).toBe("UNAUTHENTICATED_V02_SESSION");
    }

    await db.guestIdentity.authenticateAndBindSession("sess_1", issued.guestToken);
    expect(db.guestIdentity.assertVerifiedSession("sess_1")).toEqual({
      ok: true,
      accountId: issued.accountId
    });

    await db.guestIdentity.authenticateAndBindSession("sess_2", issued.guestToken);
    const supersededCheck = db.guestIdentity.assertVerifiedSession("sess_1");
    expect(supersededCheck.ok).toBe(false);
    if (!supersededCheck.ok) {
      expect(supersededCheck.code).toBe("SESSION_SUPERSEDED");
    }
    expect(db.guestIdentity.assertVerifiedSession("sess_2")).toEqual({
      ok: true,
      accountId: issued.accountId
    });
  });

  it("completes full draft -> reroll -> confirm -> EXP grant -> attribute allocation -> Hậu Thiên equip/unequip lifecycle", async () => {
    const db = await createIsolatedDb();
    const issued = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_010_000 });

    const draftRes = await db.characterV02Actions.createCharacterDraft(
      issued.accountId,
      {
        requestId: "req_create_1",
        name: "Bạch Tiểu Thuần",
        appearanceId: "hero_kiem_tu"
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_100 }
    );
    expect(draftRes.ok).toBe(true);
    expect(draftRes.character?.identity.creationState).toBe("draft");
    expect(draftRes.character?.levelProgress.level).toBe(1);

    const dupDraftRes = await db.characterV02Actions.createCharacterDraft(
      issued.accountId,
      {
        requestId: "req_create_2",
        name: "Bạch Tiểu Thuần 2"
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_200 }
    );
    expect(dupDraftRes.ok).toBe(false);
    expect(dupDraftRes.code).toBe("DUPLICATE_ACCOUNT_CHARACTER");

    const roll1 = await db.characterV02Actions.rollInnateDestiny(
      issued.accountId,
      { requestId: "req_roll_1" },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_300 }
    );
    expect(roll1.ok).toBe(true);
    expect(roll1.rollDraft?.candidateTraitIds).toHaveLength(3);
    const firstNonce = roll1.rollDraft!.rollNonce;

    const roll2 = await db.characterV02Actions.rollInnateDestiny(
      issued.accountId,
      { requestId: "req_roll_2" },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_400 }
    );
    expect(roll2.ok).toBe(true);
    const secondNonce = roll2.rollDraft!.rollNonce;
    expect(secondNonce).not.toBe(firstNonce);

    const staleConfirm = await db.characterV02Actions.confirmInnateDestiny(
      issued.accountId,
      {
        requestId: "req_confirm_stale",
        rollNonce: firstNonce
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_500 }
    );
    expect(staleConfirm.ok).toBe(false);
    expect(staleConfirm.code).toBe("SUPERSEDED_ROLL_NONCE");

    const confirmRes = await db.characterV02Actions.confirmInnateDestiny(
      issued.accountId,
      {
        requestId: "req_confirm_active",
        rollNonce: secondNonce
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_600 }
    );
    expect(confirmRes.ok).toBe(true);
    expect(confirmRes.character?.identity.creationState).toBe("confirmed");
    expect(confirmRes.character?.destiny?.innate).toEqual(
      roll2.rollDraft!.candidateTraitIds
    );

    const replayConfirm = await db.characterV02Actions.confirmInnateDestiny(
      issued.accountId,
      {
        requestId: "req_confirm_replay",
        rollNonce: secondNonce
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_700 }
    );
    expect(replayConfirm.ok).toBe(false);
    expect(replayConfirm.code).toBe("ROLL_NONCE_ALREADY_CONSUMED");

    const rerollAfterConfirm = await db.characterV02Actions.rollInnateDestiny(
      issued.accountId,
      { requestId: "req_roll_after_confirm" },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_800 }
    );
    expect(rerollAfterConfirm.ok).toBe(false);
    expect(rerollAfterConfirm.code).toBe("CHARACTER_ALREADY_CONFIRMED");

    const expRes = await db.characterV02Actions.awardCharacterExpServerOnly(
      {
        accountId: issued.accountId,
        requestId: "srv_exp_1",
        expDelta: 500
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_010_900 }
    );
    expect(expRes.ok).toBe(true);
    expect(expRes.character?.levelProgress.level).toBe(3);
    expect(expRes.character?.levelProgress.freeAttributePoints).toBe(2);

    const alloc1 = await db.characterV02Actions.allocateAttributePoint(
      issued.accountId,
      {
        requestId: "req_alloc_1",
        attributeId: "the_phach"
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_011_000 }
    );
    expect(alloc1.ok).toBe(true);
    expect(alloc1.character?.levelProgress.allocated.the_phach).toBe(1);
    expect(alloc1.character?.levelProgress.freeAttributePoints).toBe(1);
    expect(alloc1.character?.resources.currentHp).toBe(220);
    expect(alloc1.character?.derivedStats.maxHp).toBeGreaterThan(220);

    const acquiredTraitId = [
      "hau_thien_kiem_y",
      "hau_thien_dan_tam",
      "hau_thien_tran_phap",
      "hau_thien_thanh_tam"
    ].find((id) => !confirmRes.character!.destiny!.innate.includes(id))!;

    const grant1 = await db.characterV02Actions.grantAcquiredDestinyTraitServerOnly(
      {
        accountId: issued.accountId,
        requestId: "srv_grant_ht_1",
        traitId: acquiredTraitId
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_011_100 }
    );
    expect(grant1.ok).toBe(true);
    expect(grant1.character?.destiny?.acquiredTraitIds).toEqual([
      acquiredTraitId
    ]);

    const equip1 = await db.characterV02Actions.equipAcquiredDestinyTrait(
      issued.accountId,
      {
        requestId: "req_equip_1",
        slotIndex: 0,
        traitId: acquiredTraitId
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_011_200 }
    );
    expect(equip1.ok).toBe(true);
    expect(equip1.character?.destiny?.activeAcquiredSlots).toEqual([
      acquiredTraitId,
      null,
      null
    ]);

    const dupSlotEquip = await db.characterV02Actions.equipAcquiredDestinyTrait(
      issued.accountId,
      {
        requestId: "req_equip_dup_slot",
        slotIndex: 1,
        traitId: acquiredTraitId
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_011_300 }
    );
    expect(dupSlotEquip.ok).toBe(false);
    expect(dupSlotEquip.code).toBe("DESTINY_TRAIT_ALREADY_EQUIPPED");

    const unequip1 = await db.characterV02Actions.unequipAcquiredDestinyTrait(
      issued.accountId,
      {
        requestId: "req_unequip_1",
        slotIndex: 0
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_011_400 }
    );
    expect(unequip1.ok).toBe(true);
    expect(unequip1.character?.destiny?.activeAcquiredSlots).toEqual([
      null,
      null,
      null
    ]);
    expect(unequip1.character?.destiny?.acquiredTraitIds).toEqual([
      acquiredTraitId
    ]);
  });

  it("rejects forged client payload keys, foreign/expired nonces, second Legendary signature, and concurrent double-confirmation", async () => {
    const db = await createIsolatedDb();
    const acctA = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_020_000 });
    const acctB = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_020_050 });

    const forgedCreate = await db.characterV02Actions.createCharacterDraft(
      acctA.accountId,
      {
        requestId: "req_forged_create",
        name: "Kẻ Gian",
        level: 99
      },
      SYNTHETIC_ACTION_OPTIONS
    );
    expect(forgedCreate.ok).toBe(false);
    expect(forgedCreate.code).toBe("FORGED_INPUT_REJECTED");

    await db.characterV02Actions.createCharacterDraft(
      acctA.accountId,
      { requestId: "req_a_draft", name: "Đạo Hữu A" },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_020_100 }
    );
    await db.characterV02Actions.createCharacterDraft(
      acctB.accountId,
      { requestId: "req_b_draft", name: "Đạo Hữu B" },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_020_150 }
    );

    const forgedRoll = await db.characterV02Actions.rollInnateDestiny(
      acctA.accountId,
      {
        requestId: "req_forged_roll",
        lockedSlots: [0]
      },
      SYNTHETIC_ACTION_OPTIONS
    );
    expect(forgedRoll.ok).toBe(false);
    expect(forgedRoll.code).toBe("FORGED_INPUT_REJECTED");

    const forgedConfirm = await db.characterV02Actions.confirmInnateDestiny(
      acctA.accountId,
      {
        requestId: "req_forged_confirm",
        rollNonce: "roll_v02_fake",
        candidateTraitIds: ["van_vi_dao_thai", "kim_cang_ban_the", "bach_thao_linh_khi"]
      },
      SYNTHETIC_ACTION_OPTIONS
    );
    expect(forgedConfirm.ok).toBe(false);
    expect(forgedConfirm.code).toBe("FORGED_INPUT_REJECTED");

    const rollAExpired = await db.characterV02Actions.rollInnateDestiny(
      acctA.accountId,
      { requestId: "req_roll_a_exp" },
      {
        ...SYNTHETIC_ACTION_OPTIONS,
        nowMs: 1_700_000_020_200,
        rollDraftTtlMs: 1000
      }
    );
    expect(rollAExpired.ok).toBe(true);

    const foreignAttempt = await db.characterV02Actions.confirmInnateDestiny(
      acctB.accountId,
      {
        requestId: "req_b_steal_nonce",
        rollNonce: rollAExpired.rollDraft!.rollNonce
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_020_300 }
    );
    expect(foreignAttempt.ok).toBe(false);
    expect(foreignAttempt.code).toBe("FOREIGN_ROLL_NONCE");

    const expiredAttempt = await db.characterV02Actions.confirmInnateDestiny(
      acctA.accountId,
      {
        requestId: "req_a_confirm_expired",
        rollNonce: rollAExpired.rollDraft!.rollNonce
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_025_000 }
    );
    expect(expiredAttempt.ok).toBe(false);
    expect(expiredAttempt.code).toBe("EXPIRED_ROLL_NONCE");

    const rollARace = await db.characterV02Actions.rollInnateDestiny(
      acctA.accountId,
      { requestId: "req_roll_a_race" },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_026_000 }
    );
    const raceNonce = rollARace.rollDraft!.rollNonce;

    const [race1, race2] = await Promise.all([
      db.characterV02Actions.confirmInnateDestiny(
        acctA.accountId,
        { requestId: "req_race_confirm_1", rollNonce: raceNonce },
        { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_026_100 }
      ),
      db.characterV02Actions.confirmInnateDestiny(
        acctA.accountId,
        { requestId: "req_race_confirm_2", rollNonce: raceNonce },
        { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_026_100 }
      )
    ]);

    const successes = [race1, race2].filter((r) => r.ok);
    const failures = [race1, race2].filter((r) => !r.ok);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].code).toBe("ROLL_NONCE_ALREADY_CONSUMED");

    const dupRequest = await db.characterV02Actions.confirmInnateDestiny(
      acctA.accountId,
      { requestId: "req_race_confirm_1", rollNonce: raceNonce },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_026_200 }
    );
    expect(dupRequest.ok).toBe(false);
    expect(dupRequest.code).toBe("DUPLICATE_REQUEST");

    const confirmedChar = await db.getCharacterV02ByAccount(
      acctA.accountId,
      SYNTHETIC_ACTION_OPTIONS
    );
    expect(confirmedChar?.identity.revision).toBe(2);

    const hasInnateSig = confirmedChar!.destiny!.innate.some(
      (id) => SYNTHETIC_DESTINY_CATALOG[id]?.legendaryNpcId !== null
    );
    if (!hasInnateSig) {
      const firstSigGrant =
        await db.characterV02Actions.grantAcquiredDestinyTraitServerOnly(
          {
            accountId: acctA.accountId,
            requestId: "srv_sig_1",
            traitId: "van_vi_dao_thai"
          },
          SYNTHETIC_ACTION_OPTIONS
        );
      expect(firstSigGrant.ok).toBe(true);
    }

    const secondSigId = confirmedChar!.destiny!.innate.includes("kiem_tam_thong_minh")
      ? "van_vi_dao_thai"
      : "kiem_tam_thong_minh";
    const secondSigGrant =
      await db.characterV02Actions.grantAcquiredDestinyTraitServerOnly(
        {
          accountId: acctA.accountId,
          requestId: "srv_sig_2_conflict",
          traitId: secondSigId
        },
        SYNTHETIC_ACTION_OPTIONS
      );
    expect(secondSigGrant.ok).toBe(false);
    expect(secondSigGrant.code).toBe("SIGNATURE_CONFLICT");
  });

  it("enforces at-most-one Thần Phẩm signature across CSPRNG innate rolls even when multiple signatures exist in catalog", () => {
    for (let i = 0; i < 40; i += 1) {
      const res = rollInnateDestinyTripleFromCatalog(SYNTHETIC_DESTINY_CATALOG, {
        allowNonApprovedInCatalog: true
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        const unique = new Set(res.candidateTraitIds);
        expect(unique.size).toBe(3);
        const sigCount = res.candidateTraitIds.filter(
          (id) => SYNTHETIC_DESTINY_CATALOG[id].legendaryNpcId !== null
        ).length;
        expect(sigCount).toBeLessThanOrEqual(1);
      }
    }
  });

  it("enforces authenticated session ownership, rejects client EXP grants, and preserves DB/memory state on failed actions in ZoneRoom", async () => {
    const db = await createIsolatedDb();
    db.setCharacterV02ActionDefaults(SYNTHETIC_ACTION_OPTIONS);
    const engine = new AuthoritativeWorldEngine(db);
    configureServerSingletons(db, engine);

    const room = new ZoneRoom();
    room.onCreate({ zoneId: "tan_thu_thon" });

    const createMockClient = (sessionId: string) => {
      const sent: Array<{ type: string; message: unknown }> = [];
      return {
        sessionId,
        sent,
        send(type: string | number | symbol, message?: unknown) {
          sent.push({ type: String(type), message });
        },
        lastMessage<T>(type: string): T | undefined {
          for (let i = sent.length - 1; i >= 0; i -= 1) {
            if (sent[i].type === type) {
              return sent[i].message as T;
            }
          }
          return undefined;
        }
      };
    };

    const issued = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_030_000 });

    const forgedTokenClient = createMockClient("sess_forged_token");
    await room.onJoin(forgedTokenClient as unknown as Client, {
      guestToken: `${issued.accountId}.${"0".repeat(64)}`,
      nickname: "Giả Token"
    });
    const forgedJoinAuth = forgedTokenClient.lastMessage<GuestAuthResultPayload>("v02_auth_result");
    expect(forgedJoinAuth?.ok).toBe(false);
    expect(forgedJoinAuth?.code).toBe("INVALID_GUEST_CREDENTIAL");

    await room.handleClientMessage(forgedTokenClient, "v02_create_character_draft", {
      requestId: "req_forged_token_room_draft",
      name: "Kẻ Giả Token"
    });
    const forgedTokenActionRes =
      forgedTokenClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(forgedTokenActionRes?.ok).toBe(false);
    expect(forgedTokenActionRes?.code).toBe("UNAUTHENTICATED_V02_SESSION");
    await room.onLeave(forgedTokenClient as unknown as Client);

    const legacySpoofClient = createMockClient("sess_legacy_spoof");
    await room.onJoin(legacySpoofClient as unknown as Client, {
      accountId: issued.accountId,
      nickname: "Giả Mạo"
    });
    await room.handleClientMessage(legacySpoofClient, "v02_create_character_draft", {
      requestId: "req_unauth_room_draft",
      name: "Kẻ Giả Mạo"
    });
    const unauthResult =
      legacySpoofClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(unauthResult?.ok).toBe(false);
    expect(unauthResult?.code).toBe("UNAUTHENTICATED_V02_SESSION");
    await room.onLeave(legacySpoofClient as unknown as Client);

    const verifiedClient = createMockClient("sess_verified_owner");
    await room.onJoin(verifiedClient as unknown as Client, {
      guestToken: issued.guestToken,
      nickname: "Chính Chủ"
    });
    const joinAuth = verifiedClient.lastMessage<GuestAuthResultPayload>("v02_auth_result");
    expect(joinAuth?.ok).toBe(true);
    expect(joinAuth?.accountId).toBe(issued.accountId);

    await room.handleClientMessage(verifiedClient, "v02_grant_exp", {
      requestId: "req_client_exp_hack",
      expDelta: "999999"
    });
    const clientExpAttempt =
      verifiedClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(clientExpAttempt?.ok).toBe(false);
    expect(clientExpAttempt?.code).toBe("CLIENT_EXP_GRANT_FORBIDDEN");

    await room.handleClientMessage(verifiedClient, "v02_grant_acquired_destiny", {
      requestId: "req_client_destiny_hack",
      traitId: "van_vi_dao_thai"
    });
    const clientDestinyAttempt =
      verifiedClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(clientDestinyAttempt?.ok).toBe(false);
    expect(clientDestinyAttempt?.code).toBe("CLIENT_DESTINY_GRANT_FORBIDDEN");

    await room.handleClientMessage(verifiedClient, "v02_create_character_draft", {
      requestId: "req_ws_draft_1",
      name: "Mạnh Hạo"
    });
    const draftRes =
      verifiedClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(draftRes?.ok).toBe(true);

    await room.handleClientMessage(verifiedClient, "v02_roll_innate_destiny", {
      requestId: "req_ws_roll_1"
    });
    const rollRes =
      verifiedClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(rollRes?.ok).toBe(true);
    expect(rollRes?.rollDraft?.rollNonce).toBeDefined();

    await room.handleClientMessage(verifiedClient, "v02_confirm_innate_destiny", {
      requestId: "req_ws_confirm_1",
      rollNonce: rollRes!.rollDraft!.rollNonce
    });
    const confirmRes =
      verifiedClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(confirmRes?.ok).toBe(true);
    expect(confirmRes?.character?.identity.creationState).toBe("confirmed");

    const cachedBeforeInvalidAlloc: CharacterV02SnapshotPayload | undefined =
      room.getActiveCharacterV02(issued.accountId);
    expect(cachedBeforeInvalidAlloc?.identity.revision).toBe(2);

    await room.handleClientMessage(verifiedClient, "v02_allocate_attribute", {
      requestId: "req_ws_alloc_no_points",
      attributeId: "luc_dao"
    });
    const invalidAlloc =
      verifiedClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(invalidAlloc?.ok).toBe(false);
    expect(invalidAlloc?.code).toBe("NO_FREE_ATTRIBUTE_POINTS");

    const cachedAfterInvalidAlloc = room.getActiveCharacterV02(issued.accountId);
    const dbAfterInvalidAlloc = await db.getCharacterV02ByAccount(
      issued.accountId,
      SYNTHETIC_ACTION_OPTIONS
    );
    expect(cachedAfterInvalidAlloc?.identity.revision).toBe(2);
    expect(dbAfterInvalidAlloc?.identity.revision).toBe(2);

    const competingClient = createMockClient("sess_competing_owner");
    await room.onJoin(competingClient as unknown as Client, {
      guestToken: issued.guestToken,
      nickname: "Chính Chủ Phiên Mới"
    });

    await room.handleClientMessage(verifiedClient, "v02_allocate_attribute", {
      requestId: "req_superseded_session",
      attributeId: "luc_dao"
    });
    const supersededRes =
      verifiedClient.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(supersededRes?.ok).toBe(false);
    expect(supersededRes?.code).toBe("SESSION_SUPERSEDED");

    await room.onLeave(verifiedClient as unknown as Client);
    await room.onLeave(competingClient as unknown as Client);
  });

  it("enforces Phàm Nhân Lv 10 non-Saint cap no-bank baseline and rejects invalid attribute keys, unowned traits, and invalid slot indices", async () => {
    const db = await createIsolatedDb();
    const issued = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_040_000 });

    await db.characterV02Actions.createCharacterDraft(
      issued.accountId,
      { requestId: "req_cap_draft", name: "Từ Khuyết" },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_040_100 }
    );
    const rollRes = await db.characterV02Actions.rollInnateDestiny(
      issued.accountId,
      { requestId: "req_cap_roll" },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_040_200 }
    );
    await db.characterV02Actions.confirmInnateDestiny(
      issued.accountId,
      {
        requestId: "req_cap_confirm",
        rollNonce: rollRes.rollDraft!.rollNonce
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_040_300 }
    );

    const capExpRes = await db.characterV02Actions.awardCharacterExpServerOnly(
      {
        accountId: issued.accountId,
        requestId: "srv_cap_exp_huge",
        expDelta: "1000000"
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_040_400 }
    );
    expect(capExpRes.ok).toBe(true);
    expect(capExpRes.character?.levelProgress.level).toBe(10);
    expect(capExpRes.character?.levelProgress.expTowardNext).toBe("0");
    expect(capExpRes.character?.levelProgress.freeAttributePoints).toBe(9);

    const badAttrKeyRes = await db.characterV02Actions.allocateAttributePoint(
      issued.accountId,
      {
        requestId: "req_bad_attr_key",
        attributeId: "not_a_real_stat"
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_040_500 }
    );
    expect(badAttrKeyRes.ok).toBe(false);
    expect(badAttrKeyRes.code).toBe("INVALID_ATTRIBUTE_KEY");

    const unownedEquipRes = await db.characterV02Actions.equipAcquiredDestinyTrait(
      issued.accountId,
      {
        requestId: "req_unowned_equip",
        slotIndex: 0,
        traitId: "hau_thien_kiem_y"
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_040_600 }
    );
    expect(unownedEquipRes.ok).toBe(false);
    expect(unownedEquipRes.code).toBe("DESTINY_TRAIT_NOT_OWNED");

    const badSlotEquipRes = await db.characterV02Actions.equipAcquiredDestinyTrait(
      issued.accountId,
      {
        requestId: "req_bad_slot_equip",
        slotIndex: 3,
        traitId: "hau_thien_kiem_y"
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_040_700 }
    );
    expect(badSlotEquipRes.ok).toBe(false);
    expect(badSlotEquipRes.code).toBe("INVALID_DESTINY_SLOT_INDEX");

    const badSlotUnequipRes = await db.characterV02Actions.unequipAcquiredDestinyTrait(
      issued.accountId,
      {
        requestId: "req_bad_slot_unequip",
        slotIndex: -1
      },
      { ...SYNTHETIC_ACTION_OPTIONS, nowMs: 1_700_000_040_800 }
    );
    expect(badSlotUnequipRes.ok).toBe(false);
    expect(badSlotUnequipRes.code).toBe("INVALID_DESTINY_SLOT_INDEX");
  });

  it("validates S1-E starter destiny catalog integrity, 60/40 Thần inner split, and preserves dam_lon_tien_tu.realmId = UNKNOWN", () => {
    const entries = Object.values(S1E_STARTER_DESTINY_CATALOG);
    expect(entries).toHaveLength(16);
    expect(S1E_STARTER_DESTINY_CATALOG_VERSION).toBe("s1e-starter-v1.0");
    expect(APPROVED_PRODUCTION_DESTINY_CATALOG).toBe(S1E_STARTER_DESTINY_CATALOG);

    const ordinaryEntries = entries.filter((e) => e.kind === "ordinary");
    const signatureEntries = entries.filter((e) => e.kind === "legendary_signature");
    expect(ordinaryEntries).toHaveLength(14);
    expect(signatureEntries).toHaveLength(2);

    expect(ordinaryEntries.filter((e) => e.rarity === "pham")).toHaveLength(6);
    expect(ordinaryEntries.filter((e) => e.rarity === "hoang")).toHaveLength(4);
    expect(ordinaryEntries.filter((e) => e.rarity === "tien")).toHaveLength(3);
    expect(ordinaryEntries.filter((e) => e.rarity === "than").map((e) => e.id)).toEqual([
      "luc_hop_linh_cot"
    ]);

    expect(S1E_STARTER_DESTINY_CATALOG.van_vi_dao_thai.legendaryNpcId).toBe("phi_de");
    expect(
      S1E_STARTER_DESTINY_CATALOG.van_vi_dao_thai.flatPreRealmAttributeBonuses
    ).toEqual({
      linh_tinh: 4,
      ngo_tinh: 4
    });

    expect(S1E_STARTER_DESTINY_CATALOG.huyen_anh_dao_thai.legendaryNpcId).toBe(
      "dam_lon_tien_tu"
    );
    expect(S1E_STARTER_DESTINY_CATALOG.huyen_anh_dao_thai.narrativeState).toBe(
      "NOT_DESIGNED"
    );
    expect(
      S1E_STARTER_DESTINY_CATALOG.huyen_anh_dao_thai.flatPreRealmAttributeBonuses
    ).toEqual({
      than_phap: 4,
      than_thuc: 4
    });
    const damLon = LEGENDARY_NPCS.find((n) => n.id === "dam_lon_tien_tu");
    expect(damLon?.realmId).toBe("UNKNOWN");

    expect(CANDIDATE_THAN_SIGNATURE_WEIGHT).toBe(60);
    expect(CANDIDATE_THAN_ORDINARY_WEIGHT).toBe(40);
  });

  it("discards all three initial candidates when a forced triple contains 2 Legendary signatures or duplicate IDs and returns a new independent triple", () => {
    const scriptedRollsTwoSignatures: number[] = [
      99, 0, 0,
      99, 0, 1,
      0, 0,
      70, 0,
      90, 0,
      0, 4,
      0, 0,
      0, 1
    ];
    let idx = 0;
    const forcedTwoSigRes = rollInnateDestinyTripleFromCatalog(
      S1E_STARTER_DESTINY_CATALOG,
      {
        randomIntFn: (maxExclusive: number) => {
          const val = scriptedRollsTwoSignatures[idx] ?? 0;
          idx += 1;
          return val % maxExclusive;
        }
      }
    );

    expect(forcedTwoSigRes.ok).toBe(true);
    if (forcedTwoSigRes.ok) {
      expect(forcedTwoSigRes.attemptsUsed).toBe(2);
      expect(forcedTwoSigRes.rejectedCandidates).toEqual([
        ["van_vi_dao_thai", "huyen_anh_dao_thai", "thach_cot_so_sinh"]
      ]);
      expect(forcedTwoSigRes.candidateTraitIds).toEqual([
        "kim_cang_can_cot",
        "thai_hu_than_niem",
        "tinh_tam_ngung_than"
      ]);
    }

    const scriptedRollsDuplicate: number[] = [
      0, 0,
      0, 0,
      0, 1,
      99, 60, 0,
      99, 0, 1,
      0, 2
    ];
    let dupIdx = 0;
    const forcedDupRes = rollInnateDestinyTripleFromCatalog(
      S1E_STARTER_DESTINY_CATALOG,
      {
        randomIntFn: (maxExclusive: number) => {
          const val = scriptedRollsDuplicate[dupIdx] ?? 0;
          dupIdx += 1;
          return val % maxExclusive;
        }
      }
    );

    expect(forcedDupRes.ok).toBe(true);
    if (forcedDupRes.ok) {
      expect(forcedDupRes.attemptsUsed).toBe(2);
      expect(forcedDupRes.rejectedCandidates).toEqual([
        ["thach_cot_so_sinh", "thach_cot_so_sinh", "man_luc_so_khai"]
      ]);
      expect(forcedDupRes.candidateTraitIds).toEqual([
        "luc_hop_linh_cot",
        "huyen_anh_dao_thai",
        "linh_tuc_so_sinh"
      ]);
    }
  });

  it("applies confirmed innate and active Hậu Thiên pre-realm attribute bonuses, ignores unconfirmed drafts and unequipped traits, and clamps HP/MP without free healing", async () => {
    const db = await createIsolatedDb();
    const issued = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_050_000 });

    const draftRes = await db.characterV02Actions.createCharacterDraft(
      issued.accountId,
      {
        requestId: "req_s1e_stat_draft",
        name: "Lý Thất Dạ",
        appearanceId: "hoa_tran"
      },
      { nowMs: 1_700_000_050_100 }
    );
    expect(draftRes.ok).toBe(true);
    expect(draftRes.character?.derivedStats.maxHp).toBe(220);
    expect(draftRes.character?.derivedStats.maxMp).toBe(140);
    expect(draftRes.character?.attributes?.destinyBonuses).toEqual({
      the_phach: 0,
      luc_dao: 0,
      linh_tinh: 0,
      than_phap: 0,
      than_thuc: 0,
      ngo_tinh: 0
    });

    const scriptedRollForConfirm = [
      99, 0, 0,
      99, 60, 0,
      0, 0
    ];
    let rIdx = 0;
    const rollRes = await db.characterV02Actions.rollInnateDestiny(
      issued.accountId,
      { requestId: "req_s1e_stat_roll" },
      {
        nowMs: 1_700_000_050_200,
        randomIntFn: (maxExclusive: number) => {
          const v = scriptedRollForConfirm[rIdx] ?? 0;
          rIdx += 1;
          return v % maxExclusive;
        }
      }
    );
    expect(rollRes.ok).toBe(true);
    expect(rollRes.rollDraft?.candidateTraitIds).toEqual([
      "van_vi_dao_thai",
      "luc_hop_linh_cot",
      "thach_cot_so_sinh"
    ]);
    expect(rollRes.character?.derivedStats.maxHp).toBe(220);

    const confirmRes = await db.characterV02Actions.confirmInnateDestiny(
      issued.accountId,
      {
        requestId: "req_s1e_stat_confirm",
        rollNonce: rollRes.rollDraft!.rollNonce
      },
      { nowMs: 1_700_000_050_300 }
    );
    expect(confirmRes.ok).toBe(true);
    expect(confirmRes.character?.attributes?.destinyBonuses).toEqual({
      the_phach: 2,
      luc_dao: 1,
      linh_tinh: 5,
      than_phap: 1,
      than_thuc: 1,
      ngo_tinh: 5
    });
    expect(confirmRes.character?.derivedStats.maxHp).toBe(244);
    expect(confirmRes.character?.derivedStats.maxMp).toBe(190);
    expect(confirmRes.character?.resources.currentHp).toBe(220);
    expect(confirmRes.character?.resources.currentMp).toBe(140);

    const baseSaveState = {
      accountId: issued.accountId,
      characterId: confirmRes.character!.identity.characterId,
      nickname: "Lý Thất Dạ",
      discipline: "kiem_tu" as const,
      zoneId: "tan_thu_thon" as const,
      x: 150,
      y: 160,
      direction: "down" as const,
      realmId: "pham_nhan" as const,
      realmStage: 1,
      tuVi: 40,
      hp: 240,
      maxHp: 244,
      mp: 175,
      maxMp: 180,
      attack: confirmRes.character!.derivedStats.physicalAttack,
      defense: confirmRes.character!.derivedStats.physicalDefense,
      linhThach: 65,
      equippedTitle: "Tân Nhập Môn Đệ Tử",
      equippedInheritance: null,
      inventory: [],
      quests: {},
      reputation: {},
      buffs: [],
      meditationStartedAt: 1_700_000_000_000,
      lastMeditationClaimAt: 1_700_000_000_000,
      partyId: null
    };

    await db.characterV02Actions.syncRuntimeWorldState(issued.accountId, baseSaveState);

    const grantHt = await db.characterV02Actions.grantAcquiredDestinyTraitServerOnly(
      {
        accountId: issued.accountId,
        requestId: "srv_s1e_grant_ht_kim_cang",
        traitId: "kim_cang_can_cot"
      },
      { nowMs: 1_700_000_050_400 }
    );
    expect(grantHt.ok).toBe(true);
    expect(grantHt.character?.derivedStats.maxHp).toBe(244);
    expect(grantHt.character?.resources.currentHp).toBe(240);

    const secondSigConflict =
      await db.characterV02Actions.grantAcquiredDestinyTraitServerOnly(
        {
          accountId: issued.accountId,
          requestId: "srv_s1e_grant_conflict_huyen_anh",
          traitId: "huyen_anh_dao_thai"
        },
        { nowMs: 1_700_000_050_450 }
      );
    expect(secondSigConflict.ok).toBe(false);
    expect(secondSigConflict.code).toBe("SIGNATURE_CONFLICT");

    const equipHt = await db.characterV02Actions.equipAcquiredDestinyTrait(
      issued.accountId,
      {
        requestId: "req_s1e_equip_kim_cang",
        slotIndex: 0,
        traitId: "kim_cang_can_cot"
      },
      { nowMs: 1_700_000_050_500 }
    );
    expect(equipHt.ok).toBe(true);
    expect(equipHt.character?.derivedStats.maxHp).toBe(268);
    expect(equipHt.character?.resources.currentHp).toBe(240);

    await db.characterV02Actions.syncRuntimeWorldState(issued.accountId, {
      ...baseSaveState,
      hp: 266,
      maxHp: 268
    });

    const unequipHt = await db.characterV02Actions.unequipAcquiredDestinyTrait(
      issued.accountId,
      {
        requestId: "req_s1e_unequip_kim_cang",
        slotIndex: 0
      },
      { nowMs: 1_700_000_050_600 }
    );
    expect(unequipHt.ok).toBe(true);
    expect(unequipHt.character?.derivedStats.maxHp).toBe(244);
    expect(unequipHt.character?.resources.currentHp).toBe(244);

    const directCalc = computeCandidateBaselineStatSnapshot({
      realmId: "pham_nhan",
      realmStage: 1,
      levelProgress: confirmRes.character!.levelProgress,
      destiny: {
        innate: ["van_vi_dao_thai", "luc_hop_linh_cot", "thach_cot_so_sinh"],
        innateConfirmedAtMs: 1_700_000_050_300,
        acquiredTraitIds: ["kim_cang_can_cot"],
        activeAcquiredSlots: [null, null, null],
        collectionRevision: 2
      }
    });
    expect(directCalc.ok).toBe(true);
    if (directCalc.ok) {
      expect(directCalc.snapshot.derivedStats.maxHp).toBe(244);
    }
  });

  it("prevents unconfirmed v0.2 sessions from creating legacy rows or world avatars and spawns confirmed v0.2 characters cleanly with two-guest isolation", async () => {
    const db = await createIsolatedDb();
    const engine = new AuthoritativeWorldEngine(db);
    configureServerSingletons(db, engine);

    const room = new ZoneRoom();
    room.onCreate({ zoneId: "tan_thu_thon" });

    const createMockClient = (sessionId: string) => {
      const sent: Array<{ type: string; message: unknown }> = [];
      return {
        sessionId,
        sent,
        send(type: string | number | symbol, message?: unknown) {
          sent.push({ type: String(type), message });
        },
        lastMessage<T>(type: string): T | undefined {
          for (let i = sent.length - 1; i >= 0; i -= 1) {
            if (sent[i].type === type) {
              return sent[i].message as T;
            }
          }
          return undefined;
        }
      };
    };

    const guestA = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_060_000 });
    const guestB = await db.guestIdentity.issueGuestCredential({ nowMs: 1_700_000_060_050 });

    const clientA = createMockClient("sess_s1e_guest_a");
    await room.onJoin(clientA as unknown as Client, {
      guestToken: guestA.guestToken
    });

    expect(room.getOnlinePlayerCount()).toBe(0);
    expect(Object.keys(room.buildWorldSnapshot().players)).toHaveLength(0);
    expect(await db.getCharacterByAccount(guestA.accountId)).toBeNull();
    expect(clientA.lastMessage("self_state")).toBeUndefined();

    await room.handleClientMessage(clientA, "v02_create_character_draft", {
      requestId: "req_a_draft_isolation",
      name: "Tiêu Viêm",
      appearanceId: "ngoc_tam"
    });
    expect(room.getOnlinePlayerCount()).toBe(0);
    expect(await db.getCharacterByAccount(guestA.accountId)).toBeNull();

    await room.handleClientMessage(clientA, "v02_roll_innate_destiny", {
      requestId: "req_a_roll_isolation"
    });
    const rollARes =
      clientA.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(rollARes?.ok).toBe(true);
    expect(room.getOnlinePlayerCount()).toBe(0);

    const clientB = createMockClient("sess_s1e_guest_b");
    await room.onJoin(clientB as unknown as Client, {
      guestToken: guestB.guestToken
    });
    expect(room.getOnlinePlayerCount()).toBe(0);
    expect(await db.getCharacterByAccount(guestB.accountId)).toBeNull();

    await room.handleClientMessage(clientA, "v02_confirm_innate_destiny", {
      requestId: "req_a_confirm_isolation",
      rollNonce: rollARes!.rollDraft!.rollNonce
    });
    const confirmARes =
      clientA.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    expect(confirmARes?.ok).toBe(true);
    expect(room.getOnlinePlayerCount()).toBe(1);
    expect(await db.getCharacterByAccount(guestA.accountId)).toBeNull();

    const snapAfterAConfirm = room.buildWorldSnapshot();
    const charAId = confirmARes!.character!.identity.characterId;
    expect(snapAfterAConfirm.players[charAId]).toBeDefined();
    expect(snapAfterAConfirm.players[charAId].nickname).toBe("Tiêu Viêm");
    expect(snapAfterAConfirm.players[charAId].appearanceId).toBe("ngoc_tam");
    expect(snapAfterAConfirm.players[charAId].level).toBe(1);

    await room.handleClientMessage(clientB, "v02_create_character_draft", {
      requestId: "req_b_draft_isolation",
      name: "Lâm Động",
      appearanceId: "anh_7"
    });
    await room.handleClientMessage(clientB, "v02_roll_innate_destiny", {
      requestId: "req_b_roll_isolation"
    });
    const rollBRes =
      clientB.lastMessage<CharacterV02ActionResultPayload>("v02_action_result");
    await room.handleClientMessage(clientB, "v02_confirm_innate_destiny", {
      requestId: "req_b_confirm_isolation",
      rollNonce: rollBRes!.rollDraft!.rollNonce
    });
    expect(room.getOnlinePlayerCount()).toBe(2);
    expect(await db.getCharacterByAccount(guestB.accountId)).toBeNull();

    await room.onLeave(clientA as unknown as Client);
    await room.onLeave(clientB as unknown as Client);
  });
});
