import type { SqlQueryRunner } from "../DbPorts.js";

export interface MultiCharacterSchemaInspectionResult {
  isLegacySingleCharSchema: boolean;
  hasUniqueAccountConstraintOnCharactersV02: boolean;
  hasUniqueAccountConstraintOnRollDrafts: boolean;
  hasUniqueAccountConstraintOnLegacyCharacters: boolean;
  hasAccountPrimaryKeyOnLegacyCharacters: boolean;
  hasCharacterIdColumnOnIdempotencyLedger: boolean;
  existingCharactersV02Count: number;
  existingDraftsCount: number;
  existingReceiptsCount: number;
}

export interface MultiCharacterMigrationResult {
  migrated: boolean;
  dryRun: boolean;
  details: Record<string, unknown>;
}

function quotePgIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function getExistingPublicTables(runner: SqlQueryRunner): Promise<Set<string>> {
  const res = await runner.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('characters_v02', 'character_v02_roll_drafts', 'idempotency_ledger', 'characters')`
  );
  return new Set(res.rows.map((r) => String(r.table_name)));
}

async function findConstraintsOnColumn(
  runner: SqlQueryRunner,
  tableName: string,
  contype: "u" | "p",
  columnName: string
): Promise<string[]> {
  const res = await runner.query<{ conname: string }>(
    `SELECT DISTINCT c.conname
     FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
     WHERE t.relname = $1
       AND c.contype = $2
       AND a.attname = $3`,
    [tableName, contype, columnName]
  );
  return res.rows.map((r) => String(r.conname));
}

async function findStandaloneUniqueIndexesOnColumn(
  runner: SqlQueryRunner,
  tableName: string,
  columnName: string
): Promise<string[]> {
  const res = await runner.query<{ index_name: string }>(
    `SELECT DISTINCT i.relname AS index_name
     FROM pg_index ix
     JOIN pg_class t ON t.oid = ix.indrelid
     JOIN pg_class i ON i.oid = ix.indexrelid
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
     LEFT JOIN pg_constraint c ON c.conindid = ix.indexrelid
     WHERE t.relname = $1
       AND ix.indisunique = true
       AND ix.indisprimary = false
       AND ix.indnatts = 1
       AND a.attname = $2
       AND c.oid IS NULL`,
    [tableName, columnName]
  );
  return res.rows.map((r) => String(r.index_name));
}

async function countTableRows(runner: SqlQueryRunner, tableName: string): Promise<number> {
  const res = await runner.query<{ cnt: number | string }>(
    `SELECT COUNT(*)::int AS cnt FROM ${quotePgIdentifier(tableName)}`
  );
  return Number(res.rows[0]?.cnt ?? 0);
}

export async function inspectMultiCharacterSchemaState(
  runner: SqlQueryRunner
): Promise<MultiCharacterSchemaInspectionResult> {
  const tables = await getExistingPublicTables(runner);

  const constraintRows = await runner.query<{
    table_name: string;
    contype: string;
  }>(
    `SELECT DISTINCT t.relname AS table_name, c.contype AS contype
     FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
     WHERE t.relname IN ('characters_v02', 'character_v02_roll_drafts', 'characters')
       AND c.contype IN ('u', 'p')
       AND a.attname = 'account_id'`
  );

  const indexRows = await runner.query<{ table_name: string }>(
    `SELECT DISTINCT t.relname AS table_name
     FROM pg_index ix
     JOIN pg_class t ON t.oid = ix.indrelid
     JOIN pg_class i ON i.oid = ix.indexrelid
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
     LEFT JOIN pg_constraint c ON c.conindid = ix.indexrelid
     WHERE t.relname IN ('characters_v02', 'character_v02_roll_drafts', 'characters')
       AND ix.indisunique = true
       AND ix.indisprimary = false
       AND ix.indnatts = 1
       AND a.attname = 'account_id'
       AND c.oid IS NULL`
  );

  const uniqueAccountTables = new Set<string>();
  const primaryAccountTables = new Set<string>();
  for (const row of constraintRows.rows) {
    if (row.contype === "u") {
      uniqueAccountTables.add(String(row.table_name));
    } else if (row.contype === "p") {
      primaryAccountTables.add(String(row.table_name));
    }
  }
  for (const row of indexRows.rows) {
    uniqueAccountTables.add(String(row.table_name));
  }

  const hasUniqueAccountConstraintOnCharactersV02 =
    tables.has("characters_v02") && uniqueAccountTables.has("characters_v02");
  const hasUniqueAccountConstraintOnRollDrafts =
    tables.has("character_v02_roll_drafts") &&
    uniqueAccountTables.has("character_v02_roll_drafts");
  const hasUniqueAccountConstraintOnLegacyCharacters =
    tables.has("characters") && uniqueAccountTables.has("characters");
  const hasAccountPrimaryKeyOnLegacyCharacters =
    tables.has("characters") && primaryAccountTables.has("characters");

  const existingCharactersV02Count = tables.has("characters_v02")
    ? await countTableRows(runner, "characters_v02")
    : 0;
  const existingDraftsCount = tables.has("character_v02_roll_drafts")
    ? await countTableRows(runner, "character_v02_roll_drafts")
    : 0;

  let hasCharacterIdColumnOnIdempotencyLedger = true;
  let existingReceiptsCount = 0;
  if (tables.has("idempotency_ledger")) {
    const colRes = await runner.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'idempotency_ledger'
         AND column_name = 'character_id'`
    );
    hasCharacterIdColumnOnIdempotencyLedger = colRes.rows.length > 0;
    existingReceiptsCount = await countTableRows(runner, "idempotency_ledger");
  }

  const isLegacySingleCharSchema =
    hasUniqueAccountConstraintOnCharactersV02 ||
    hasUniqueAccountConstraintOnRollDrafts ||
    hasUniqueAccountConstraintOnLegacyCharacters ||
    hasAccountPrimaryKeyOnLegacyCharacters ||
    !hasCharacterIdColumnOnIdempotencyLedger;

  return {
    isLegacySingleCharSchema,
    hasUniqueAccountConstraintOnCharactersV02,
    hasUniqueAccountConstraintOnRollDrafts,
    hasUniqueAccountConstraintOnLegacyCharacters,
    hasAccountPrimaryKeyOnLegacyCharacters,
    hasCharacterIdColumnOnIdempotencyLedger,
    existingCharactersV02Count,
    existingDraftsCount,
    existingReceiptsCount
  };
}

export async function runMultiCharacterV02Migration(
  runner: SqlQueryRunner,
  options?: { dryRun?: boolean }
): Promise<MultiCharacterMigrationResult> {
  const dryRun = options?.dryRun === true;
  const before = await inspectMultiCharacterSchemaState(runner);
  const tables = await getExistingPublicTables(runner);

  const plannedOperations: string[] = [];
  if (before.hasUniqueAccountConstraintOnCharactersV02) {
    plannedOperations.push("drop_unique_account_on_characters_v02");
  }
  if (before.hasUniqueAccountConstraintOnRollDrafts) {
    plannedOperations.push("drop_unique_account_on_character_v02_roll_drafts");
  }
  if (!before.hasCharacterIdColumnOnIdempotencyLedger) {
    plannedOperations.push("add_character_id_to_idempotency_ledger");
  }
  if (
    before.hasAccountPrimaryKeyOnLegacyCharacters ||
    before.hasUniqueAccountConstraintOnLegacyCharacters
  ) {
    plannedOperations.push("migrate_legacy_characters_table_to_multi_character");
  }
  if (tables.has("characters_v02")) {
    plannedOperations.push("ensure_idx_characters_v02_account_created");
  }
  if (tables.has("character_v02_roll_drafts")) {
    plannedOperations.push("ensure_idx_character_v02_roll_drafts_account_char");
  }

  if (dryRun) {
    return {
      migrated: false,
      dryRun: true,
      details: {
        before,
        plannedOperations
      }
    };
  }

  const droppedConstraints: string[] = [];

  if (tables.has("characters_v02")) {
    const uConstraints = await findConstraintsOnColumn(
      runner,
      "characters_v02",
      "u",
      "account_id"
    );
    for (const conname of uConstraints) {
      await runner.query(
        `ALTER TABLE characters_v02 DROP CONSTRAINT IF EXISTS ${quotePgIdentifier(conname)}`
      );
      droppedConstraints.push(`characters_v02.${conname}`);
    }
    const uIndexes = await findStandaloneUniqueIndexesOnColumn(
      runner,
      "characters_v02",
      "account_id"
    );
    for (const idxName of uIndexes) {
      await runner.query(`DROP INDEX IF EXISTS ${quotePgIdentifier(idxName)}`);
      droppedConstraints.push(`characters_v02.${idxName}`);
    }
    await runner.query(
      `CREATE INDEX IF NOT EXISTS idx_characters_v02_account_created
       ON characters_v02 (account_id, created_at_ms ASC, character_id ASC)`
    );
  }

  if (tables.has("character_v02_roll_drafts")) {
    const uDraftConstraints = await findConstraintsOnColumn(
      runner,
      "character_v02_roll_drafts",
      "u",
      "account_id"
    );
    for (const conname of uDraftConstraints) {
      await runner.query(
        `ALTER TABLE character_v02_roll_drafts DROP CONSTRAINT IF EXISTS ${quotePgIdentifier(conname)}`
      );
      droppedConstraints.push(`character_v02_roll_drafts.${conname}`);
    }
    const uDraftIndexes = await findStandaloneUniqueIndexesOnColumn(
      runner,
      "character_v02_roll_drafts",
      "account_id"
    );
    for (const idxName of uDraftIndexes) {
      await runner.query(`DROP INDEX IF EXISTS ${quotePgIdentifier(idxName)}`);
      droppedConstraints.push(`character_v02_roll_drafts.${idxName}`);
    }
    await runner.query(
      `CREATE INDEX IF NOT EXISTS idx_character_v02_roll_drafts_account_char
       ON character_v02_roll_drafts (account_id, character_id)`
    );
  }

  if (tables.has("idempotency_ledger")) {
    if (!before.hasCharacterIdColumnOnIdempotencyLedger) {
      await runner.query(
        `ALTER TABLE idempotency_ledger
         ADD COLUMN IF NOT EXISTS character_id TEXT NOT NULL DEFAULT ''`
      );
    } else {
      await runner.query(
        `ALTER TABLE idempotency_ledger
         ALTER COLUMN character_id SET DEFAULT ''`
      );
    }

    const accountColRes = await runner.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'idempotency_ledger'
         AND column_name = 'account_id'`
    );
    if (accountColRes.rows.length > 0) {
      const pkOnAcc = await findConstraintsOnColumn(
        runner,
        "idempotency_ledger",
        "p",
        "account_id"
      );
      const pkOnChar = await findConstraintsOnColumn(
        runner,
        "idempotency_ledger",
        "p",
        "character_id"
      );
      if (pkOnAcc.length > 0 && pkOnChar.length === 0) {
        for (const conname of pkOnAcc) {
          await runner.query(
            `ALTER TABLE idempotency_ledger DROP CONSTRAINT IF EXISTS ${quotePgIdentifier(conname)}`
          );
          droppedConstraints.push(`idempotency_ledger.${conname}`);
        }
        await runner.query(
          `ALTER TABLE idempotency_ledger
           ADD PRIMARY KEY (account_id, character_id, action_type, request_id)`
        );
      }
    }
  }

  if (tables.has("characters")) {
    if (before.hasAccountPrimaryKeyOnLegacyCharacters) {
      const pkLegacy = await findConstraintsOnColumn(
        runner,
        "characters",
        "p",
        "account_id"
      );
      for (const conname of pkLegacy) {
        await runner.query(
          `ALTER TABLE characters DROP CONSTRAINT IF EXISTS ${quotePgIdentifier(conname)}`
        );
        droppedConstraints.push(`characters.${conname}`);
      }
      const uCharIdLegacy = await findConstraintsOnColumn(
        runner,
        "characters",
        "u",
        "character_id"
      );
      for (const conname of uCharIdLegacy) {
        await runner.query(
          `ALTER TABLE characters DROP CONSTRAINT IF EXISTS ${quotePgIdentifier(conname)}`
        );
        droppedConstraints.push(`characters.${conname}`);
      }
      await runner.query(`ALTER TABLE characters ADD PRIMARY KEY (character_id)`);
    }

    const uAccLegacy = await findConstraintsOnColumn(
      runner,
      "characters",
      "u",
      "account_id"
    );
    for (const conname of uAccLegacy) {
      await runner.query(
        `ALTER TABLE characters DROP CONSTRAINT IF EXISTS ${quotePgIdentifier(conname)}`
      );
      droppedConstraints.push(`characters.${conname}`);
    }
    const uAccIdxLegacy = await findStandaloneUniqueIndexesOnColumn(
      runner,
      "characters",
      "account_id"
    );
    for (const idxName of uAccIdxLegacy) {
      await runner.query(`DROP INDEX IF EXISTS ${quotePgIdentifier(idxName)}`);
      droppedConstraints.push(`characters.${idxName}`);
    }
    await runner.query(
      `CREATE INDEX IF NOT EXISTS idx_characters_account_id ON characters (account_id)`
    );
  }

  const after = await inspectMultiCharacterSchemaState(runner);

  return {
    migrated: before.isLegacySingleCharSchema,
    dryRun: false,
    details: {
      before,
      after,
      droppedConstraints
    }
  };
}
