import path from "node:path";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import type {
  ActionResultPayload,
  CharacterSaveState,
  CombatDisciplineId
} from "@tong-mon-8d/shared";
import { INITIAL_DISCIPLINE_STATS, ZONES_REGISTRY } from "@tong-mon-8d/game-data";

export interface SqlExecutor {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[] }>;
  close(): Promise<void>;
}

class PGliteAdapter implements SqlExecutor {
  private db: PGlite;

  constructor(dataDir?: string) {
    if (dataDir && dataDir !== "memory://") {
      fs.mkdirSync(dataDir, { recursive: true });
      this.db = new PGlite(dataDir);
    } else {
      this.db = new PGlite();
    }
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ rows: T[] }> {
    const res = await this.db.query<T>(sql, params);
    return { rows: res.rows };
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

class PgPoolAdapter implements SqlExecutor {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ rows: T[] }> {
    const res = await this.pool.query(sql, params);
    return { rows: res.rows as T[] };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export interface ResolvePgDataDirOptions {
  repoRoot?: string;
  canonicalDir?: string;
  legacyNestedDir?: string;
  cwd?: string;
}

export function isPgDataInitialized(dirPath: string): boolean {
  return fs.existsSync(path.join(dirPath, "PG_VERSION"));
}

export function resolvePgDataDir(
  rawDataDir?: string,
  options?: ResolvePgDataDirOptions
): string {
  const trimmed = (rawDataDir ?? "").trim();
  if (trimmed === "memory://") {
    return "memory://";
  }

  if (trimmed.length > 0 && path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }

  const repoRoot = path.resolve(
    options?.repoRoot ?? path.resolve(import.meta.dirname, "../../..")
  );
  const cwd = path.resolve(options?.cwd ?? process.cwd());
  const canonicalDir = path.resolve(
    options?.canonicalDir ?? path.join(repoRoot, "apps/server/data/pgdata")
  );
  const legacyNestedDir = path.resolve(
    options?.legacyNestedDir ??
      path.join(repoRoot, "apps/server/apps/server/data/pgdata")
  );

  const repoRelativeTarget = trimmed
    ? path.resolve(repoRoot, trimmed)
    : canonicalDir;
  const cwdRelativeTarget = trimmed ? path.resolve(cwd, trimmed) : canonicalDir;

  const isDefaultOrCanonicalTarget =
    trimmed === "" ||
    repoRelativeTarget === canonicalDir ||
    cwdRelativeTarget === canonicalDir ||
    repoRelativeTarget === legacyNestedDir ||
    cwdRelativeTarget === legacyNestedDir;

  if (isDefaultOrCanonicalTarget) {
    const canonicalInit = isPgDataInitialized(canonicalDir);
    const legacyInit = isPgDataInitialized(legacyNestedDir);

    if (canonicalInit && legacyInit) {
      throw new Error(
        `SPLIT_BRAIN_PGDATA_DIR: Both canonical (${canonicalDir}) and legacy (${legacyNestedDir}) PGlite directories are initialized. Consolidate or set an explicit absolute PGDATA_DIR.`
      );
    }
    if (legacyInit) {
      return legacyNestedDir;
    }
    return canonicalDir;
  }

  const repoTargetInit = isPgDataInitialized(repoRelativeTarget);
  const cwdTargetInit =
    cwdRelativeTarget !== repoRelativeTarget &&
    isPgDataInitialized(cwdRelativeTarget);

  if (repoTargetInit && cwdTargetInit) {
    throw new Error(
      `SPLIT_BRAIN_PGDATA_DIR: Both repo-relative (${repoRelativeTarget}) and cwd-relative (${cwdRelativeTarget}) PGlite directories are initialized for PGDATA_DIR=${trimmed}.`
    );
  }
  if (cwdTargetInit) {
    return cwdRelativeTarget;
  }
  return repoRelativeTarget;
}

export function loadRepoEnvIfNeeded(
  repoRoot = path.resolve(import.meta.dirname, "../../.."),
  targetEnv: NodeJS.ProcessEnv = process.env
): void {
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.charCodeAt(0) === 35) {
      continue;
    }
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) {
      continue;
    }
    const rawKey = line.slice(0, eqIndex).trim();
    const key = rawKey.startsWith("export ") ? rawKey.slice(7).trim() : rawKey;
    if (!key) {
      continue;
    }
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (
      targetEnv[key] === undefined &&
      !Object.prototype.hasOwnProperty.call(targetEnv, key)
    ) {
      targetEnv[key] = value;
    }
  }
}

export class GameDatabase {
  private executor: SqlExecutor;
  private resolvedDataDir: string | null;

  constructor(options?: {
    dataDir?: string;
    connectionString?: string;
    repoRoot?: string;
    cwd?: string;
  }) {
    const explicitDataDir = (options?.dataDir ?? "").trim();
    const rawConn =
      explicitDataDir === "memory://"
        ? (options?.connectionString ?? "")
        : (options?.connectionString ?? process.env.DATABASE_URL ?? "");
    const conn = rawConn.trim();
    if (conn) {
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
  }

  getDataDir(): string | null {
    return this.resolvedDataDir;
  }

  async init(): Promise<void> {
    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id TEXT PRIMARY KEY,
        created_at BIGINT NOT NULL
      );
    `);
    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS characters (
        character_id TEXT PRIMARY KEY,
        account_id TEXT UNIQUE NOT NULL,
        nickname TEXT NOT NULL,
        discipline TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        direction TEXT NOT NULL,
        realm_id TEXT NOT NULL,
        realm_stage INTEGER NOT NULL,
        tu_vi INTEGER NOT NULL,
        hp INTEGER NOT NULL,
        max_hp INTEGER NOT NULL,
        mp INTEGER NOT NULL,
        max_mp INTEGER NOT NULL,
        attack INTEGER NOT NULL,
        defense INTEGER NOT NULL,
        linh_thach INTEGER NOT NULL,
        equipped_title TEXT NOT NULL,
        equipped_inheritance TEXT,
        inventory_json JSONB NOT NULL,
        quests_json JSONB NOT NULL,
        reputation_json JSONB NOT NULL,
        buffs_json JSONB NOT NULL,
        meditation_started_at BIGINT NOT NULL,
        last_meditation_claim_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);
    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS idempotency_ledger (
        request_id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        result_json JSONB NOT NULL,
        created_at BIGINT NOT NULL
      );
    `);
    await this.executor.query(`
      CREATE TABLE IF NOT EXISTS economy_audit_log (
        id SERIAL PRIMARY KEY,
        character_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        delta_linh_thach INTEGER NOT NULL,
        item_id TEXT,
        quantity INTEGER,
        created_at BIGINT NOT NULL
      );
    `);
  }

  async loadOrCreateCharacter(
    accountId: string,
    nickname: string,
    discipline: CombatDisciplineId = "kiem_tu"
  ): Promise<CharacterSaveState> {
    const cleanAccount = accountId.trim().slice(0, 64) || "guest_default";
    const cleanNick = nickname.trim().slice(0, 24) || "Đạo Hữu Vô Danh";
    const validDisc: CombatDisciplineId =
      discipline in INITIAL_DISCIPLINE_STATS ? discipline : "kiem_tu";

    const existing = await this.executor.query<Record<string, unknown>>(
      `SELECT * FROM characters WHERE account_id = $1 LIMIT 1`,
      [cleanAccount]
    );
    if (existing.rows.length > 0) {
      return this.rowToState(existing.rows[0]);
    }

    const now = Date.now();
    await this.executor.query(
      `INSERT INTO accounts (account_id, created_at) VALUES ($1, $2) ON CONFLICT (account_id) DO NOTHING`,
      [cleanAccount, now]
    );

    const baseStats = INITIAL_DISCIPLINE_STATS[validDisc];
    const spawn = ZONES_REGISTRY.tan_thu_thon.defaultSpawn;
    const initialState: CharacterSaveState = {
      accountId: cleanAccount,
      characterId: `char_${cleanAccount}`,
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

    await this.saveCharacterState(initialState);
    return initialState;
  }

  async getCharacterByAccount(accountId: string): Promise<CharacterSaveState | null> {
    const res = await this.executor.query<Record<string, unknown>>(
      `SELECT * FROM characters WHERE account_id = $1 LIMIT 1`,
      [accountId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    return this.rowToState(res.rows[0]);
  }

  async saveCharacterState(state: CharacterSaveState): Promise<void> {
    const now = Date.now();
    await this.executor.query(
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

  async checkIdempotency(requestId: string): Promise<ActionResultPayload | null> {
    if (!requestId) {
      return null;
    }
    const res = await this.executor.query<{ result_json: ActionResultPayload }>(
      `SELECT result_json FROM idempotency_ledger WHERE request_id = $1 LIMIT 1`,
      [requestId]
    );
    if (res.rows.length > 0) {
      return {
        ...res.rows[0].result_json,
        ok: false,
        code: "DUPLICATE_REQUEST",
        messageVi: "Yêu cầu trùng lặp đã bị từ chối bởi máy chủ."
      };
    }
    return null;
  }

  async recordIdempotency(
    requestId: string,
    characterId: string,
    actionType: string,
    result: ActionResultPayload
  ): Promise<void> {
    if (!requestId) {
      return;
    }
    await this.executor.query(
      `INSERT INTO idempotency_ledger (request_id, character_id, action_type, result_json, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (request_id) DO NOTHING`,
      [requestId, characterId, actionType, JSON.stringify(result), Date.now()]
    );
  }

  async logEconomyEvent(
    characterId: string,
    eventType: string,
    deltaLinhThach: number,
    itemId?: string,
    quantity?: number
  ): Promise<void> {
    await this.executor.query(
      `INSERT INTO economy_audit_log (character_id, event_type, delta_linh_thach, item_id, quantity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [characterId, eventType, deltaLinhThach, itemId ?? null, quantity ?? null, Date.now()]
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
