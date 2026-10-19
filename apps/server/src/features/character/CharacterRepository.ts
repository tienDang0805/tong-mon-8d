import type {
  CanonicalRealmId,
  CharacterCreationState,
  DestinyCollection,
  Direction,
  ZoneId
} from "@tong-mon-8d/shared";
import type {
  CharacterV02RepositoryHost,
  SqlQueryRunner,
  SqlTransaction
} from "../../infrastructure/database/DbPorts.js";
import {
  CharacterV02PersistenceError,
  isNonEmptyTrimmedString,
  isPositiveSafeInt,
  validateCharacterV02PersistedState,
  type CharacterV02PersistedState,
  type CharacterV02ValidationOptions
} from "./CharacterValidation.js";

export type { CharacterV02RepositoryHost };

export const CHARACTERS_V02_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS characters_v02 (
    character_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(account_id),
    name TEXT NOT NULL,
    appearance_id TEXT NOT NULL,
    creation_state TEXT NOT NULL CHECK (creation_state IN ('draft', 'confirmed')),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    schema_version INTEGER NOT NULL DEFAULT 2 CHECK (schema_version = 2),
    ruleset_version TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1),
    exp_toward_next NUMERIC(38, 0) NOT NULL CHECK (exp_toward_next >= 0),
    free_attribute_points INTEGER NOT NULL CHECK (free_attribute_points >= 0),
    allocated_attributes_json JSONB NOT NULL,
    earned_permanent_attributes_json JSONB NOT NULL,
    realm_id TEXT NOT NULL,
    realm_stage INTEGER NOT NULL CHECK (realm_stage >= 1),
    tu_vi NUMERIC(38, 0) NOT NULL CHECK (tu_vi >= 0),
    innate_destiny_json JSONB,
    innate_confirmed_at_ms BIGINT,
    acquired_destiny_ids_json JSONB NOT NULL,
    active_acquired_slots_json JSONB NOT NULL,
    destiny_collection_revision INTEGER NOT NULL CHECK (destiny_collection_revision >= 0),
    current_hp INTEGER NOT NULL CHECK (current_hp >= 0),
    current_mp INTEGER NOT NULL CHECK (current_mp >= 0),
    zone_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('down', 'left', 'right', 'up')),
    linh_thach INTEGER NOT NULL CHECK (linh_thach >= 0),
    equipped_title TEXT NOT NULL,
    equipped_inheritance TEXT,
    inventory_json JSONB NOT NULL,
    quests_json JSONB NOT NULL,
    reputation_json JSONB NOT NULL,
    buffs_json JSONB NOT NULL,
    meditation_started_at_ms BIGINT NOT NULL CHECK (meditation_started_at_ms >= 0),
    last_meditation_claim_at_ms BIGINT NOT NULL CHECK (last_meditation_claim_at_ms >= 0),
    created_at_ms BIGINT NOT NULL CHECK (created_at_ms > 0),
    updated_at_ms BIGINT NOT NULL CHECK (updated_at_ms > 0),
    CHECK (
      (
        creation_state = 'draft'
        AND innate_destiny_json IS NULL
        AND innate_confirmed_at_ms IS NULL
        AND destiny_collection_revision = 0
      )
      OR
      (
        creation_state = 'confirmed'
        AND innate_destiny_json IS NOT NULL
        AND innate_confirmed_at_ms IS NOT NULL
        AND innate_confirmed_at_ms > 0
        AND destiny_collection_revision >= 1
      )
    )
  );
`;

export const CHARACTERS_V02_ACCOUNT_INDEX_DDL = `
  CREATE INDEX IF NOT EXISTS idx_characters_v02_account_created
    ON characters_v02 (account_id, created_at_ms ASC, character_id ASC);
`;

export const SELECT_CHARACTER_V02_COLUMNS = `
  character_id,
  account_id,
  name,
  appearance_id,
  creation_state,
  revision,
  schema_version,
  ruleset_version,
  level,
  exp_toward_next::text AS exp_toward_next_text,
  free_attribute_points,
  allocated_attributes_json,
  earned_permanent_attributes_json,
  realm_id,
  realm_stage,
  tu_vi::text AS tu_vi_text,
  innate_destiny_json,
  innate_confirmed_at_ms,
  acquired_destiny_ids_json,
  active_acquired_slots_json,
  destiny_collection_revision,
  current_hp,
  current_mp,
  zone_id,
  x,
  y,
  direction,
  linh_thach,
  equipped_title,
  equipped_inheritance,
  inventory_json,
  quests_json,
  reputation_json,
  buffs_json,
  meditation_started_at_ms,
  last_meditation_claim_at_ms,
  created_at_ms,
  updated_at_ms
`;

export function hydrateCharacterV02Row(
  row: Record<string, unknown>,
  options?: CharacterV02ValidationOptions
): CharacterV02PersistedState {
  const creationState = String(row.creation_state) as CharacterCreationState;
  let destiny: DestinyCollection | null = null;
  if (creationState === "confirmed") {
    destiny = {
      innate: row.innate_destiny_json as [string, string, string],
      innateConfirmedAtMs: Number(row.innate_confirmed_at_ms),
      acquiredTraitIds: (row.acquired_destiny_ids_json as string[]) ?? [],
      activeAcquiredSlots: row.active_acquired_slots_json as [
        string | null,
        string | null,
        string | null
      ],
      collectionRevision: Number(row.destiny_collection_revision)
    };
  }

  const candidate: unknown = {
    schemaVersion: Number(row.schema_version),
    rulesetVersion: String(row.ruleset_version),
    identity: {
      characterId: String(row.character_id),
      accountId: String(row.account_id),
      name: String(row.name),
      appearanceId: String(row.appearance_id),
      createdAtMs: Number(row.created_at_ms),
      creationState,
      revision: Number(row.revision)
    },
    levelProgress: {
      level: Number(row.level),
      expTowardNext: String(row.exp_toward_next_text ?? row.exp_toward_next),
      freeAttributePoints: Number(row.free_attribute_points),
      allocated: row.allocated_attributes_json,
      earnedPermanent: row.earned_permanent_attributes_json
    },
    cultivation: {
      realmId: String(row.realm_id) as CanonicalRealmId,
      realmStage: Number(row.realm_stage),
      tuVi: String(row.tu_vi_text ?? row.tu_vi)
    },
    destiny,
    resources: {
      currentHp: Number(row.current_hp),
      currentMp: Number(row.current_mp)
    },
    world: {
      zoneId: String(row.zone_id) as ZoneId,
      x: Number(row.x),
      y: Number(row.y),
      direction: String(row.direction) as Direction,
      linhThach: Number(row.linh_thach),
      equippedTitle: String(row.equipped_title),
      equippedInheritance:
        row.equipped_inheritance !== null && row.equipped_inheritance !== undefined
          ? String(row.equipped_inheritance)
          : null,
      inventory: row.inventory_json,
      quests: row.quests_json,
      reputation: row.reputation_json,
      buffs: row.buffs_json,
      meditationStartedAtMs: Number(row.meditation_started_at_ms),
      lastMeditationClaimAtMs: Number(row.last_meditation_claim_at_ms)
    },
    updatedAtMs: Number(row.updated_at_ms)
  };

  const validated = validateCharacterV02PersistedState(candidate, options);
  if (!validated.ok) {
    throw new CharacterV02PersistenceError(
      "CORRUPTED_PERSISTED_STATE",
      `Persisted characters_v02 row failed validation (${validated.code}): ${validated.detail}`
    );
  }
  return validated.value;
}

export interface CharacterV02UpdateInput {
  expectedRevision: number;
  nextState: unknown;
}

export type ResolvedLockedTargetCharacter =
  | {
      ok: true;
      character: CharacterV02PersistedState;
    }
  | {
      ok: false;
      code: "CHARACTER_NOT_FOUND" | "CHARACTER_OWNERSHIP_FORBIDDEN";
      messageVi: string;
    };

export class CharacterV02Repository {
  constructor(private readonly host: CharacterV02RepositoryHost) {}

  private runAtomic<T>(
    tx: SqlTransaction | undefined,
    fn: (runner: SqlQueryRunner) => Promise<T>
  ): Promise<T> {
    if (tx !== undefined) {
      const runner = this.host.resolveQueryRunner(tx);
      return fn(runner);
    }
    return this.host.withTransaction(async (managedTx) => {
      const runner = this.host.resolveQueryRunner(managedTx);
      return fn(runner);
    });
  }

  async createCharacter(
    state: unknown,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState> {
    const check = validateCharacterV02PersistedState(state, options);
    if (!check.ok) {
      throw new CharacterV02PersistenceError(check.code, check.detail);
    }
    const valid = check.value;
    if (valid.identity.revision !== 1) {
      throw new CharacterV02PersistenceError(
        "INVALID_INITIAL_REVISION",
        "Initial Character v0.2 creation requires identity.revision === 1."
      );
    }

    return this.runAtomic(tx, async (runner) => {
      const existingById = await runner.query<{ character_id: string }>(
        `SELECT character_id FROM characters_v02 WHERE character_id = $1 LIMIT 1`,
        [valid.identity.characterId]
      );
      if (existingById.rows.length > 0) {
        throw new CharacterV02PersistenceError(
          "DUPLICATE_CHARACTER_ID",
          `Character v0.2 with character_id '${valid.identity.characterId}' already exists.`
        );
      }

      await runner.query(
        `INSERT INTO accounts (account_id, created_at) VALUES ($1, $2) ON CONFLICT (account_id) DO NOTHING`,
        [valid.identity.accountId, valid.identity.createdAtMs]
      );

      const innateJson =
        valid.destiny !== null ? JSON.stringify(valid.destiny.innate) : null;
      const innateConfirmedAtMs =
        valid.destiny !== null ? valid.destiny.innateConfirmedAtMs : null;
      const acquiredIdsJson = JSON.stringify(
        valid.destiny !== null ? valid.destiny.acquiredTraitIds : []
      );
      const activeSlotsJson = JSON.stringify(
        valid.destiny !== null ? valid.destiny.activeAcquiredSlots : [null, null, null]
      );
      const destinyRevision =
        valid.destiny !== null ? valid.destiny.collectionRevision : 0;

      const res = await runner.query<Record<string, unknown>>(
        `
        INSERT INTO characters_v02 (
          character_id,
          account_id,
          name,
          appearance_id,
          creation_state,
          revision,
          schema_version,
          ruleset_version,
          level,
          exp_toward_next,
          free_attribute_points,
          allocated_attributes_json,
          earned_permanent_attributes_json,
          realm_id,
          realm_stage,
          tu_vi,
          innate_destiny_json,
          innate_confirmed_at_ms,
          acquired_destiny_ids_json,
          active_acquired_slots_json,
          destiny_collection_revision,
          current_hp,
          current_mp,
          zone_id,
          x,
          y,
          direction,
          linh_thach,
          equipped_title,
          equipped_inheritance,
          inventory_json,
          quests_json,
          reputation_json,
          buffs_json,
          meditation_started_at_ms,
          last_meditation_claim_at_ms,
          created_at_ms,
          updated_at_ms
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10::numeric(38,0), $11, $12::jsonb, $13::jsonb,
          $14, $15, $16::numeric(38,0),
          $17::jsonb, $18, $19::jsonb, $20::jsonb, $21,
          $22, $23,
          $24, $25, $26, $27, $28, $29, $30,
          $31::jsonb, $32::jsonb, $33::jsonb, $34::jsonb,
          $35, $36, $37, $38
        )
        RETURNING ${SELECT_CHARACTER_V02_COLUMNS}
        `,
        [
          valid.identity.characterId,
          valid.identity.accountId,
          valid.identity.name,
          valid.identity.appearanceId,
          valid.identity.creationState,
          valid.identity.revision,
          valid.schemaVersion,
          valid.rulesetVersion,
          valid.levelProgress.level,
          valid.levelProgress.expTowardNext,
          valid.levelProgress.freeAttributePoints,
          JSON.stringify(valid.levelProgress.allocated),
          JSON.stringify(valid.levelProgress.earnedPermanent),
          valid.cultivation.realmId,
          valid.cultivation.realmStage,
          valid.cultivation.tuVi,
          innateJson,
          innateConfirmedAtMs,
          acquiredIdsJson,
          activeSlotsJson,
          destinyRevision,
          valid.resources.currentHp,
          valid.resources.currentMp,
          valid.world.zoneId,
          valid.world.x,
          valid.world.y,
          valid.world.direction,
          valid.world.linhThach,
          valid.world.equippedTitle,
          valid.world.equippedInheritance,
          JSON.stringify(valid.world.inventory),
          JSON.stringify(valid.world.quests),
          JSON.stringify(valid.world.reputation),
          JSON.stringify(valid.world.buffs),
          valid.world.meditationStartedAtMs,
          valid.world.lastMeditationClaimAtMs,
          valid.identity.createdAtMs,
          valid.updatedAtMs
        ]
      );

      return hydrateCharacterV02Row(res.rows[0], options);
    });
  }

  async getByCharacterId(
    characterId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    const runner = this.host.resolveQueryRunner(tx);
    if (!isNonEmptyTrimmedString(characterId, 128)) {
      return null;
    }
    const res = await runner.query<Record<string, unknown>>(
      `SELECT ${SELECT_CHARACTER_V02_COLUMNS} FROM characters_v02 WHERE character_id = $1 LIMIT 1`,
      [characterId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return hydrateCharacterV02Row(res.rows[0], options);
  }

  async getOwnedCharacterById(
    accountId: string,
    characterId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    if (
      !isNonEmptyTrimmedString(accountId, 128) ||
      !isNonEmptyTrimmedString(characterId, 128)
    ) {
      return null;
    }
    const found = await this.getByCharacterId(characterId, options, tx);
    if (!found || found.identity.accountId !== accountId) {
      return null;
    }
    return found;
  }

  async getByAccountId(
    accountId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    const runner = this.host.resolveQueryRunner(tx);
    if (!isNonEmptyTrimmedString(accountId, 128)) {
      return null;
    }
    const res = await runner.query<Record<string, unknown>>(
      `SELECT ${SELECT_CHARACTER_V02_COLUMNS}
       FROM characters_v02
       WHERE account_id = $1
       ORDER BY created_at_ms DESC, character_id DESC
       LIMIT 1`,
      [accountId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return hydrateCharacterV02Row(res.rows[0], options);
  }

  async listCharactersByAccount(
    accountId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState[]> {
    const runner = this.host.resolveQueryRunner(tx);
    if (!isNonEmptyTrimmedString(accountId, 128)) {
      return [];
    }
    const res = await runner.query<Record<string, unknown>>(
      `SELECT ${SELECT_CHARACTER_V02_COLUMNS}
       FROM characters_v02
       WHERE account_id = $1
       ORDER BY created_at_ms ASC, character_id ASC`,
      [accountId]
    );
    return res.rows.map((row) => hydrateCharacterV02Row(row, options));
  }

  async lockByCharacterId(
    runner: SqlQueryRunner,
    characterId: string,
    options?: CharacterV02ValidationOptions
  ): Promise<CharacterV02PersistedState | null> {
    if (!isNonEmptyTrimmedString(characterId, 128)) {
      return null;
    }
    const res = await runner.query<Record<string, unknown>>(
      `SELECT ${SELECT_CHARACTER_V02_COLUMNS}
       FROM characters_v02
       WHERE character_id = $1
       LIMIT 1
       FOR UPDATE`,
      [characterId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return hydrateCharacterV02Row(res.rows[0], options);
  }

  async lockByAccountId(
    runner: SqlQueryRunner,
    accountId: string,
    options?: CharacterV02ValidationOptions & {
      preferredCreationState?: "draft" | "confirmed";
    }
  ): Promise<CharacterV02PersistedState | null> {
    const preferred = options?.preferredCreationState;
    const orderClause =
      preferred === "draft"
        ? `CASE WHEN creation_state = 'draft' THEN 0 ELSE 1 END ASC, created_at_ms DESC, character_id DESC`
        : preferred === "confirmed"
          ? `CASE WHEN creation_state = 'confirmed' THEN 0 ELSE 1 END ASC, created_at_ms DESC, character_id DESC`
          : `created_at_ms DESC, character_id DESC`;
    const res = await runner.query<Record<string, unknown>>(
      `SELECT ${SELECT_CHARACTER_V02_COLUMNS}
       FROM characters_v02
       WHERE account_id = $1
       ORDER BY ${orderClause}
       LIMIT 1
       FOR UPDATE`,
      [accountId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return hydrateCharacterV02Row(res.rows[0], options);
  }

  async resolveLockedTargetCharacter(
    runner: SqlQueryRunner,
    accountId: string,
    requestedCharacterId: unknown,
    options?: CharacterV02ValidationOptions & {
      preferredCreationState?: "draft" | "confirmed";
    }
  ): Promise<ResolvedLockedTargetCharacter> {
    if (requestedCharacterId !== undefined) {
      if (!isNonEmptyTrimmedString(requestedCharacterId, 128)) {
        return {
          ok: false,
          code: "CHARACTER_NOT_FOUND",
          messageVi: "Không tìm thấy nhân vật v0.2 theo yêu cầu."
        };
      }
      const byId = await this.lockByCharacterId(runner, requestedCharacterId, options);
      if (!byId) {
        return {
          ok: false,
          code: "CHARACTER_NOT_FOUND",
          messageVi: "Không tìm thấy nhân vật v0.2 theo yêu cầu."
        };
      }
      if (byId.identity.accountId !== accountId) {
        return {
          ok: false,
          code: "CHARACTER_OWNERSHIP_FORBIDDEN",
          messageVi: "Nhân vật không thuộc quyền sở hữu của tài khoản hiện tại."
        };
      }
      return {
        ok: true,
        character: byId
      };
    }

    const byAcc = await this.lockByAccountId(runner, accountId, options);
    if (!byAcc) {
      return {
        ok: false,
        code: "CHARACTER_NOT_FOUND",
        messageVi: "Không tìm thấy nhân vật v0.2 của tài khoản này."
      };
    }
    return {
      ok: true,
      character: byAcc
    };
  }

  async updateCharacter(
    input: CharacterV02UpdateInput,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState> {
    if (!isPositiveSafeInt(input?.expectedRevision)) {
      throw new CharacterV02PersistenceError(
        "REVISION_MISMATCH",
        "expectedRevision must be a positive safe integer."
      );
    }
    const check = validateCharacterV02PersistedState(input.nextState, options);
    if (!check.ok) {
      throw new CharacterV02PersistenceError(check.code, check.detail);
    }
    const validNext = check.value;
    if (validNext.identity.revision !== input.expectedRevision + 1) {
      throw new CharacterV02PersistenceError(
        "REVISION_MISMATCH",
        `nextState.identity.revision (${validNext.identity.revision}) must equal expectedRevision + 1 (${input.expectedRevision + 1}).`
      );
    }

    return this.runAtomic(tx, async (runner) => {
      const existingRes = await runner.query<Record<string, unknown>>(
        `SELECT ${SELECT_CHARACTER_V02_COLUMNS} FROM characters_v02 WHERE character_id = $1 FOR UPDATE`,
        [validNext.identity.characterId]
      );
      if (existingRes.rows.length === 0) {
        throw new CharacterV02PersistenceError(
          "CHARACTER_NOT_FOUND",
          `Character v0.2 '${validNext.identity.characterId}' was not found.`
        );
      }

      const existing = hydrateCharacterV02Row(existingRes.rows[0], options);
      if (
        existing.identity.accountId !== validNext.identity.accountId ||
        existing.identity.createdAtMs !== validNext.identity.createdAtMs
      ) {
        throw new CharacterV02PersistenceError(
          "IMMUTABLE_IDENTITY_VIOLATION",
          "accountId and createdAtMs are immutable after Character v0.2 creation."
        );
      }

      if (existing.identity.revision !== input.expectedRevision) {
        throw new CharacterV02PersistenceError(
          "REVISION_CONFLICT",
          `Expected revision ${input.expectedRevision}, but persisted revision is ${existing.identity.revision}.`
        );
      }

      if (existing.identity.creationState === "confirmed") {
        if (validNext.identity.creationState !== "confirmed") {
          throw new CharacterV02PersistenceError(
            "IMMUTABLE_CREATION_STATE_VIOLATION",
            "Confirmed Character v0.2 cannot revert creationState to draft."
          );
        }
        if (
          existing.destiny === null ||
          validNext.destiny === null ||
          existing.destiny.innate[0] !== validNext.destiny.innate[0] ||
          existing.destiny.innate[1] !== validNext.destiny.innate[1] ||
          existing.destiny.innate[2] !== validNext.destiny.innate[2] ||
          existing.destiny.innateConfirmedAtMs !== validNext.destiny.innateConfirmedAtMs
        ) {
          throw new CharacterV02PersistenceError(
            "IMMUTABLE_INNATE_DESTINY_VIOLATION",
            "Confirmed innate Tiên Thiên Destiny slots and confirmation timestamp are immutable."
          );
        }
        if (validNext.destiny.collectionRevision < existing.destiny.collectionRevision) {
          throw new CharacterV02PersistenceError(
            "DESTINY_REVISION_REGRESSION",
            "Destiny collectionRevision cannot decrease."
          );
        }
      }

      const innateJson =
        validNext.destiny !== null ? JSON.stringify(validNext.destiny.innate) : null;
      const innateConfirmedAtMs =
        validNext.destiny !== null ? validNext.destiny.innateConfirmedAtMs : null;
      const acquiredIdsJson = JSON.stringify(
        validNext.destiny !== null ? validNext.destiny.acquiredTraitIds : []
      );
      const activeSlotsJson = JSON.stringify(
        validNext.destiny !== null ? validNext.destiny.activeAcquiredSlots : [null, null, null]
      );
      const destinyRevision =
        validNext.destiny !== null ? validNext.destiny.collectionRevision : 0;

      const updateRes = await runner.query<Record<string, unknown>>(
        `
        UPDATE characters_v02 SET
          name = $4,
          appearance_id = $5,
          creation_state = $6,
          revision = $7,
          ruleset_version = $8,
          level = $9,
          exp_toward_next = $10::numeric(38,0),
          free_attribute_points = $11,
          allocated_attributes_json = $12::jsonb,
          earned_permanent_attributes_json = $13::jsonb,
          realm_id = $14,
          realm_stage = $15,
          tu_vi = $16::numeric(38,0),
          innate_destiny_json = $17::jsonb,
          innate_confirmed_at_ms = $18,
          acquired_destiny_ids_json = $19::jsonb,
          active_acquired_slots_json = $20::jsonb,
          destiny_collection_revision = $21,
          current_hp = $22,
          current_mp = $23,
          zone_id = $24,
          x = $25,
          y = $26,
          direction = $27,
          linh_thach = $28,
          equipped_title = $29,
          equipped_inheritance = $30,
          inventory_json = $31::jsonb,
          quests_json = $32::jsonb,
          reputation_json = $33::jsonb,
          buffs_json = $34::jsonb,
          meditation_started_at_ms = $35,
          last_meditation_claim_at_ms = $36,
          updated_at_ms = $37
        WHERE character_id = $1
          AND account_id = $2
          AND revision = $3
        RETURNING ${SELECT_CHARACTER_V02_COLUMNS}
        `,
        [
          validNext.identity.characterId,
          validNext.identity.accountId,
          input.expectedRevision,
          validNext.identity.name,
          validNext.identity.appearanceId,
          validNext.identity.creationState,
          validNext.identity.revision,
          validNext.rulesetVersion,
          validNext.levelProgress.level,
          validNext.levelProgress.expTowardNext,
          validNext.levelProgress.freeAttributePoints,
          JSON.stringify(validNext.levelProgress.allocated),
          JSON.stringify(validNext.levelProgress.earnedPermanent),
          validNext.cultivation.realmId,
          validNext.cultivation.realmStage,
          validNext.cultivation.tuVi,
          innateJson,
          innateConfirmedAtMs,
          acquiredIdsJson,
          activeSlotsJson,
          destinyRevision,
          validNext.resources.currentHp,
          validNext.resources.currentMp,
          validNext.world.zoneId,
          validNext.world.x,
          validNext.world.y,
          validNext.world.direction,
          validNext.world.linhThach,
          validNext.world.equippedTitle,
          validNext.world.equippedInheritance,
          JSON.stringify(validNext.world.inventory),
          JSON.stringify(validNext.world.quests),
          JSON.stringify(validNext.world.reputation),
          JSON.stringify(validNext.world.buffs),
          validNext.world.meditationStartedAtMs,
          validNext.world.lastMeditationClaimAtMs,
          validNext.updatedAtMs
        ]
      );

      if (updateRes.rows.length === 0) {
        throw new CharacterV02PersistenceError(
          "REVISION_CONFLICT",
          `Concurrent update conflict on Character v0.2 '${validNext.identity.characterId}' at revision ${input.expectedRevision}.`
        );
      }

      return hydrateCharacterV02Row(updateRes.rows[0], options);
    });
  }
}
