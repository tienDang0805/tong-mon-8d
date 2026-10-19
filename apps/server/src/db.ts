import type {
  ActionResultPayload,
  CharacterRosterEntryDto,
  CharacterSaveState,
  CombatDisciplineId
} from "@tong-mon-8d/shared";
import { INITIAL_DISCIPLINE_STATS, ZONES_REGISTRY } from "@tong-mon-8d/game-data";
import {
  TransactionUsageError,
  type CharacterV02RepositoryHost,
  type PGliteDriverLike,
  type PGliteTransactionDriverLike,
  type PgPoolClientLike,
  type PgPoolLike,
  type SqlExecutor,
  type SqlQueryRunner,
  type SqlTransaction,
  type TransactionErrorCode
} from "./infrastructure/database/DbPorts.js";
import {
  LEGACY_CHARACTERS_ACCOUNT_INDEX_DDL,
  LEGACY_CHARACTERS_TABLE_DDL
} from "./infrastructure/database/LegacyWorldPorts.js";
import {
  inspectMultiCharacterSchemaState,
  runMultiCharacterV02Migration,
  type MultiCharacterMigrationResult,
  type MultiCharacterSchemaInspectionResult
} from "./infrastructure/database/migrations/multiCharacterV02Migration.js";
import {
  isPgDataInitialized,
  loadRepoEnvIfNeeded,
  PGliteAdapter,
  PgPoolAdapter,
  resolvePgDataDir,
  type InternalSqlExecutor,
  type ResolvePgDataDirOptions
} from "./infrastructure/database/PgAdapter.js";
import {
  GUEST_CREDENTIALS_TABLE_DDL,
  GuestIdentityError,
  GuestIdentityService,
  type AssertVerifiedSessionResult,
  type GuestIdentityErrorCode,
  type IssuedGuestCredential,
  type VerifiedGuestSession,
  type VerifyGuestTokenResult
} from "./infrastructure/auth/GuestIdentity.js";
import {
  checkLegacyIdempotency,
  ECONOMY_AUDIT_LOG_TABLE_DDL,
  IDEMPOTENCY_LEDGER_TABLE_DDL,
  insertActionReceipt,
  insertEconomyAuditLog,
  readActionReceipt,
  recordLegacyIdempotency
} from "./infrastructure/idempotency/RequestReceiptStore.js";
import {
  CHARACTERS_V02_ACCOUNT_INDEX_DDL,
  CHARACTERS_V02_TABLE_DDL,
  CharacterV02Repository,
  hydrateCharacterV02Row,
  type CharacterV02UpdateInput
} from "./features/character/CharacterRepository.js";
import {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_INNATE_TIER_WEIGHTS,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  CHARACTER_V02_ROLL_DRAFTS_INDEX_DDL,
  CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL,
  CharacterV02ActionService,
  DEFAULT_ROLL_DRAFT_TTL_MS,
  rollInnateDestinyTripleFromCatalog,
  toCharacterV02Snapshot,
  type CharacterV02ActionOptions,
  type InnateDestinyRollResult,
  type OwnedCharacterSnapshotLookupResult,
  type RollInnateDestinyOptions,
  type ServerOnlyAwardCharacterExpParams,
  type ServerOnlyGrantAcquiredDestinyParams
} from "./features/character/CharacterService.js";
import {
  CHARACTER_V02_SCHEMA_VERSION,
  CharacterV02PersistenceError,
  createInitialCharacterV02State,
  validateCharacterV02PersistedState,
  type CharacterV02CombatResources,
  type CharacterV02CultivationState,
  type CharacterV02ErrorCode,
  type CharacterV02PersistedState,
  type CharacterV02ValidationOptions,
  type CharacterV02ValidationResult,
  type CharacterV02WorldAndEconomyState,
  type CreateInitialCharacterV02Params
} from "./features/character/CharacterValidation.js";

export {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_INNATE_TIER_WEIGHTS,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL,
  CHARACTER_V02_SCHEMA_VERSION,
  CHARACTERS_V02_TABLE_DDL,
  CharacterV02ActionService,
  CharacterV02PersistenceError,
  CharacterV02Repository,
  DEFAULT_ROLL_DRAFT_TTL_MS,
  GUEST_CREDENTIALS_TABLE_DDL,
  GuestIdentityError,
  GuestIdentityService,
  LEGACY_CHARACTERS_TABLE_DDL,
  PGliteAdapter,
  PgPoolAdapter,
  TransactionUsageError,
  createInitialCharacterV02State,
  hydrateCharacterV02Row,
  insertActionReceipt,
  inspectMultiCharacterSchemaState,
  isPgDataInitialized,
  loadRepoEnvIfNeeded,
  readActionReceipt,
  resolvePgDataDir,
  rollInnateDestinyTripleFromCatalog,
  runMultiCharacterV02Migration,
  toCharacterV02Snapshot,
  validateCharacterV02PersistedState,
  type AssertVerifiedSessionResult,
  type CharacterV02ActionOptions,
  type CharacterV02CombatResources,
  type CharacterV02CultivationState,
  type CharacterV02ErrorCode,
  type CharacterV02PersistedState,
  type CharacterV02RepositoryHost,
  type CharacterV02UpdateInput,
  type CharacterV02ValidationOptions,
  type CharacterV02ValidationResult,
  type CharacterV02WorldAndEconomyState,
  type CreateInitialCharacterV02Params,
  type GuestIdentityErrorCode,
  type InnateDestinyRollResult,
  type IssuedGuestCredential,
  type MultiCharacterMigrationResult,
  type MultiCharacterSchemaInspectionResult,
  type OwnedCharacterSnapshotLookupResult,
  type PGliteDriverLike,
  type PGliteTransactionDriverLike,
  type PgPoolClientLike,
  type PgPoolLike,
  type ResolvePgDataDirOptions,
  type RollInnateDestinyOptions,
  type ServerOnlyAwardCharacterExpParams,
  type ServerOnlyGrantAcquiredDestinyParams,
  type SqlExecutor,
  type SqlQueryRunner,
  type SqlTransaction,
  type TransactionErrorCode,
  type VerifiedGuestSession,
  type VerifyGuestTokenResult
};

export class GameDatabase {
  private executor: InternalSqlExecutor;
  private resolvedDataDir: string | null;
  private autoMigrateLegacyMultiCharacterSchema: boolean;
  private defaultCharacterV02ActionOptions: CharacterV02ActionOptions = {};
  readonly charactersV02: CharacterV02Repository;
  readonly guestIdentity: GuestIdentityService;
  readonly characterV02Actions: CharacterV02ActionService;

  constructor(options?: {
    dataDir?: string;
    connectionString?: string;
    repoRoot?: string;
    cwd?: string;
    autoMigrateLegacyMultiCharacterSchema?: boolean;
    executor?: InternalSqlExecutor;
  }) {
    this.autoMigrateLegacyMultiCharacterSchema =
      options?.autoMigrateLegacyMultiCharacterSchema === true;
    const explicitDataDir = (options?.dataDir ?? "").trim();
    const rawConn =
      explicitDataDir === "memory://"
        ? (options?.connectionString ?? "")
        : (options?.connectionString ?? process.env.DATABASE_URL ?? "");
    const conn = rawConn.trim();
    if (options?.executor) {
      this.resolvedDataDir = null;
      this.executor = options.executor;
    } else if (conn) {
      this.resolvedDataDir = null;
      this.executor = new PgPoolAdapter(conn);
    } else {
      const targetDir = resolvePgDataDir(
        options?.dataDir ?? process.env.PGDATA_DIR,
        {
          repoRoot: options?.repoRoot,
          cwd: options?.cwd
        }
      );
      this.resolvedDataDir = targetDir;
      this.executor = new PGliteAdapter(targetDir);
    }
    const repositoryHost: CharacterV02RepositoryHost = {
      resolveQueryRunner: (tx?: SqlTransaction) => this.resolveQueryRunner(tx),
      withTransaction: <T>(fn: (tx: SqlTransaction) => Promise<T>) =>
        this.withTransaction(fn)
    };
    this.charactersV02 = new CharacterV02Repository(repositoryHost);
    this.guestIdentity = new GuestIdentityService(repositoryHost);
    this.characterV02Actions = new CharacterV02ActionService(
      repositoryHost,
      this.charactersV02
    );
  }

  getDataDir(): string | null {
    return this.resolvedDataDir;
  }

  setCharacterV02ActionDefaults(options: CharacterV02ActionOptions): void {
    this.defaultCharacterV02ActionOptions = { ...options };
  }

  getCharacterV02ActionDefaults(): CharacterV02ActionOptions {
    return { ...this.defaultCharacterV02ActionOptions };
  }

  private resolveQueryRunner(tx?: SqlTransaction): SqlQueryRunner {
    if (tx !== undefined) {
      return this.executor.guard.validateExplicitRunner(tx);
    }
    this.executor.guard.assertRootOperationAllowed("query");
    this.executor.assertHealthyForRootSelection();
    return this.executor;
  }

  withTransaction<T>(fn: (tx: SqlTransaction) => Promise<T>): Promise<T> {
    return this.executor.withTransaction(fn);
  }

  async init(options?: {
    autoMigrateLegacyMultiCharacterSchema?: boolean;
  }): Promise<void> {
    this.executor.guard.assertRootOperationAllowed("init");
    this.executor.assertHealthyForRootSelection();
    const preExistingTables = await this.executor.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('characters_v02', 'character_v02_roll_drafts', 'idempotency_ledger', 'characters')`
    );
    const hadPreExistingTables = preExistingTables.rows.length > 0;

    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id TEXT PRIMARY KEY,
        created_at BIGINT NOT NULL
      );
    `);
    await this.executor.query(GUEST_CREDENTIALS_TABLE_DDL);
    await this.executor.query(LEGACY_CHARACTERS_TABLE_DDL);
    await this.executor.query(LEGACY_CHARACTERS_ACCOUNT_INDEX_DDL);
    await this.executor.query(CHARACTERS_V02_TABLE_DDL);
    await this.executor.query(CHARACTERS_V02_ACCOUNT_INDEX_DDL);
    await this.executor.query(CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL);
    await this.executor.query(CHARACTER_V02_ROLL_DRAFTS_INDEX_DDL);
    await this.executor.query(IDEMPOTENCY_LEDGER_TABLE_DDL);
    await this.executor.query(ECONOMY_AUDIT_LOG_TABLE_DDL);

    if (hadPreExistingTables) {
      const schemaState = await inspectMultiCharacterSchemaState(this.executor);
      if (schemaState.isLegacySingleCharSchema) {
        const allowAutoMigrate =
          (options?.autoMigrateLegacyMultiCharacterSchema ??
            this.autoMigrateLegacyMultiCharacterSchema) === true;
        if (schemaState.existingCharactersV02Count > 0 && !allowAutoMigrate) {
          throw new Error(
            "LEGACY_SINGLE_CHARACTER_SCHEMA_MIGRATION_REQUIRED: Existing characters_v02 rows detected on legacy single-character schema. Run migrateToMultiCharacterSchema() explicitly."
          );
        }
        await runMultiCharacterV02Migration(this.executor, { dryRun: false });
      }
    }
  }

  async inspectMultiCharacterSchema(
    tx?: SqlTransaction
  ): Promise<MultiCharacterSchemaInspectionResult> {
    const runner = this.resolveQueryRunner(tx);
    return inspectMultiCharacterSchemaState(runner);
  }

  async migrateToMultiCharacterSchema(
    options?: { dryRun?: boolean },
    tx?: SqlTransaction
  ): Promise<MultiCharacterMigrationResult> {
    if (tx !== undefined) {
      const runner = this.resolveQueryRunner(tx);
      return runMultiCharacterV02Migration(runner, options);
    }
    return this.withTransaction(async (managedTx) => {
      const runner = this.resolveQueryRunner(managedTx);
      return runMultiCharacterV02Migration(runner, options);
    });
  }

  async createCharacterV02(
    state: unknown,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState> {
    return this.charactersV02.createCharacter(state, options, tx);
  }

  async getCharacterV02ById(
    characterId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    return this.charactersV02.getByCharacterId(characterId, options, tx);
  }

  async getOwnedCharacterV02ById(
    accountId: string,
    characterId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    return this.charactersV02.getOwnedCharacterById(accountId, characterId, options, tx);
  }

  async getCharacterV02ByAccount(
    accountId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState | null> {
    return this.charactersV02.getByAccountId(accountId, options, tx);
  }

  async listCharactersV02ByAccount(
    accountId: string,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState[]> {
    return this.charactersV02.listCharactersByAccount(accountId, options, tx);
  }

  async listCharacterRoster(
    accountId: string,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterRosterEntryDto[]> {
    return this.characterV02Actions.listCharacterRoster(
      accountId,
      options ?? this.getCharacterV02ActionDefaults(),
      tx
    );
  }

  async updateCharacterV02(
    input: CharacterV02UpdateInput,
    options?: CharacterV02ValidationOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02PersistedState> {
    return this.charactersV02.updateCharacter(input, options, tx);
  }

  async loadOrCreateCharacter(
    accountId: string,
    nickname: string,
    discipline: CombatDisciplineId = "kiem_tu",
    txOrCharacterId?: SqlTransaction | string,
    maybeTx?: SqlTransaction
  ): Promise<CharacterSaveState> {
    const explicitCharId =
      typeof txOrCharacterId === "string" ? txOrCharacterId.trim() : undefined;
    const tx =
      typeof txOrCharacterId === "string" ? maybeTx : txOrCharacterId;
    const runner = this.resolveQueryRunner(tx);
    const cleanAccount = accountId.trim().slice(0, 64) || "guest_default";
    const cleanNick = nickname.trim().slice(0, 24) || "Đạo Hữu Vô Danh";
    const validDisc: CombatDisciplineId =
      discipline in INITIAL_DISCIPLINE_STATS ? discipline : "kiem_tu";

    const existing = explicitCharId
      ? await runner.query<Record<string, unknown>>(
          `SELECT * FROM characters WHERE character_id = $1 AND account_id = $2 LIMIT 1`,
          [explicitCharId, cleanAccount]
        )
      : await runner.query<Record<string, unknown>>(
          `SELECT * FROM characters WHERE account_id = $1 ORDER BY updated_at DESC, character_id ASC LIMIT 1`,
          [cleanAccount]
        );
    if (existing.rows.length > 0) {
      return this.rowToState(existing.rows[0]);
    }

    const now = Date.now();
    await runner.query(
      `INSERT INTO accounts (account_id, created_at) VALUES ($1, $2) ON CONFLICT (account_id) DO NOTHING`,
      [cleanAccount, now]
    );

    const baseStats = INITIAL_DISCIPLINE_STATS[validDisc];
    const spawn = ZONES_REGISTRY.tan_thu_thon.defaultSpawn;
    const initialState: CharacterSaveState = {
      accountId: cleanAccount,
      characterId: explicitCharId || `char_${cleanAccount}`,
      nickname: cleanNick,
      discipline: validDisc,
      zoneId: "tan_thu_thon",
      x: spawn.x,
      y: spawn.y,
      direction: "down",
      realmId: "pham_nhan",
      realmStage: 1,
      tuVi: 40,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      mp: baseStats.mp,
      maxMp: baseStats.mp,
      attack: baseStats.attack,
      defense: baseStats.defense,
      linhThach: 65,
      equippedTitle: "Tân Nhập Môn Đệ Tử",
      equippedInheritance: null,
      inventory: [
        { itemId: "thanh_van_kiem_so_cap", quantity: 1 },
        { itemId: "bot_linh_mach", quantity: 1 }
      ],
      quests: {},
      reputation: { phi_de: 0, chatdvt: 0, hoa_tran: 0 },
      buffs: [],
      meditationStartedAt: now - 1800 * 1000,
      lastMeditationClaimAt: now - 1800 * 1000,
      partyId: null
    };

    await this.saveCharacterState(initialState, tx);
    return initialState;
  }

  async getCharacterByAccount(
    accountId: string,
    tx?: SqlTransaction
  ): Promise<CharacterSaveState | null> {
    const runner = this.resolveQueryRunner(tx);
    const res = await runner.query<Record<string, unknown>>(
      `SELECT * FROM characters WHERE account_id = $1 LIMIT 1`,
      [accountId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return this.rowToState(res.rows[0]);
  }

  async saveCharacterState(
    state: CharacterSaveState,
    tx?: SqlTransaction
  ): Promise<void> {
    const runner = this.resolveQueryRunner(tx);
    const now = Date.now();
    await runner.query(
      `
      INSERT INTO characters (
        character_id, account_id, nickname, discipline, zone_id, x, y, direction,
        realm_id, realm_stage, tu_vi, hp, max_hp, mp, max_mp, attack, defense,
        linh_thach, equipped_title, equipped_inheritance,
        inventory_json, quests_json, reputation_json, buffs_json,
        meditation_started_at, last_meditation_claim_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20,
        $21::jsonb, $22::jsonb, $23::jsonb, $24::jsonb,
        $25, $26, $27
      )
      ON CONFLICT (character_id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        discipline = EXCLUDED.discipline,
        zone_id = EXCLUDED.zone_id,
        x = EXCLUDED.x,
        y = EXCLUDED.y,
        direction = EXCLUDED.direction,
        realm_id = EXCLUDED.realm_id,
        realm_stage = EXCLUDED.realm_stage,
        tu_vi = EXCLUDED.tu_vi,
        hp = EXCLUDED.hp,
        max_hp = EXCLUDED.max_hp,
        mp = EXCLUDED.mp,
        max_mp = EXCLUDED.max_mp,
        attack = EXCLUDED.attack,
        defense = EXCLUDED.defense,
        linh_thach = EXCLUDED.linh_thach,
        equipped_title = EXCLUDED.equipped_title,
        equipped_inheritance = EXCLUDED.equipped_inheritance,
        inventory_json = EXCLUDED.inventory_json,
        quests_json = EXCLUDED.quests_json,
        reputation_json = EXCLUDED.reputation_json,
        buffs_json = EXCLUDED.buffs_json,
        meditation_started_at = EXCLUDED.meditation_started_at,
        last_meditation_claim_at = EXCLUDED.last_meditation_claim_at,
        updated_at = EXCLUDED.updated_at;
      `,
      [
        state.characterId,
        state.accountId,
        state.nickname,
        state.discipline,
        state.zoneId,
        Math.round(state.x),
        Math.round(state.y),
        state.direction,
        state.realmId,
        state.realmStage,
        Math.round(state.tuVi),
        Math.round(state.hp),
        Math.round(state.maxHp),
        Math.round(state.mp),
        Math.round(state.maxMp),
        Math.round(state.attack),
        Math.round(state.defense),
        Math.round(state.linhThach),
        state.equippedTitle,
        state.equippedInheritance,
        JSON.stringify(state.inventory),
        JSON.stringify(state.quests),
        JSON.stringify(state.reputation),
        JSON.stringify(state.buffs),
        state.meditationStartedAt,
        state.lastMeditationClaimAt,
        now
      ]
    );
  }

  async checkIdempotency(
    requestId: string,
    tx?: SqlTransaction
  ): Promise<ActionResultPayload | null> {
    const runner = this.resolveQueryRunner(tx);
    return checkLegacyIdempotency(runner, requestId);
  }

  async recordIdempotency(
    requestId: string,
    characterId: string,
    actionType: string,
    result: ActionResultPayload,
    tx?: SqlTransaction
  ): Promise<void> {
    const runner = this.resolveQueryRunner(tx);
    await recordLegacyIdempotency(runner, requestId, characterId, actionType, result);
  }

  async logEconomyEvent(
    characterId: string,
    eventType: string,
    deltaLinhThach: number,
    itemId?: string | null,
    quantity?: number,
    tx?: SqlTransaction
  ): Promise<void> {
    const runner = this.resolveQueryRunner(tx);
    await insertEconomyAuditLog(
      runner,
      characterId,
      eventType,
      deltaLinhThach,
      itemId,
      quantity
    );
  }

  async close(): Promise<void> {
    await this.executor.close();
  }

  private rowToState(row: Record<string, unknown>): CharacterSaveState {
    return {
      accountId: String(row.account_id),
      characterId: String(row.character_id),
      nickname: String(row.nickname),
      discipline: String(row.discipline) as CombatDisciplineId,
      zoneId: String(row.zone_id) as CharacterSaveState["zoneId"],
      x: Number(row.x),
      y: Number(row.y),
      direction: String(row.direction) as CharacterSaveState["direction"],
      realmId: String(row.realm_id) as CharacterSaveState["realmId"],
      realmStage: Number(row.realm_stage),
      tuVi: Number(row.tu_vi),
      hp: Number(row.hp),
      maxHp: Number(row.max_hp),
      mp: Number(row.mp),
      maxMp: Number(row.max_mp),
      attack: Number(row.attack),
      defense: Number(row.defense),
      linhThach: Number(row.linh_thach),
      equippedTitle: String(row.equipped_title),
      equippedInheritance: row.equipped_inheritance ? String(row.equipped_inheritance) : null,
      inventory: (row.inventory_json as CharacterSaveState["inventory"]) ?? [],
      quests: (row.quests_json as CharacterSaveState["quests"]) ?? {},
      reputation: (row.reputation_json as CharacterSaveState["reputation"]) ?? {},
      buffs: (row.buffs_json as CharacterSaveState["buffs"]) ?? [],
      meditationStartedAt: Number(row.meditation_started_at),
      lastMeditationClaimAt: Number(row.last_meditation_claim_at),
      partyId: null
    };
  }
}
