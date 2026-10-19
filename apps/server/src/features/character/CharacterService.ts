import type {
  CharacterRosterEntryDto,
  CharacterSaveState,
  CharacterV02ActionResultPayload,
  CharacterV02SnapshotPayload,
  DestinyDefinitionMetadata,
  DestinyRollDraft
} from "@tong-mon-8d/shared";
import type {
  CharacterV02RepositoryHost,
  SqlQueryRunner,
  SqlTransaction
} from "../../infrastructure/database/DbPorts.js";
import {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_INNATE_TIER_WEIGHTS,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  DEFAULT_MAX_INNATE_ROLL_ATTEMPTS,
  rollInnateDestinyTripleFromCatalog,
  type InnateDestinyRollResult,
  type RollInnateDestinyOptions
} from "../destiny/DestinyRoller.js";
import {
  CHARACTER_V02_ROLL_DRAFTS_INDEX_DDL,
  CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL,
  DEFAULT_ROLL_DRAFT_TTL_MS,
  executeConfirmInnateDestiny,
  executeCreateCharacterDraft,
  executeDeleteCharacter,
  executeRollInnateDestiny,
  queryActiveRollDraftForCharacter
} from "./CharacterCreationCommands.js";
import {
  executeAllocateAttributePoint,
  executeAwardCharacterExpServerOnly,
  executeEquipAcquiredDestinyTrait,
  executeGrantAcquiredDestinyTraitServerOnly,
  executeSyncRuntimeWorldState,
  executeUnequipAcquiredDestinyTrait
} from "./CharacterProgressionCommands.js";
import { CharacterV02Repository } from "./CharacterRepository.js";
import { toCharacterV02Snapshot } from "./CharacterSnapshot.js";
import { isNonEmptyTrimmedString } from "./CharacterValidation.js";

export {
  APPROVED_PRODUCTION_DESTINY_CATALOG,
  CANDIDATE_INNATE_TIER_WEIGHTS,
  CANDIDATE_THAN_ORDINARY_WEIGHT,
  CANDIDATE_THAN_SIGNATURE_WEIGHT,
  CHARACTER_V02_ROLL_DRAFTS_INDEX_DDL,
  CHARACTER_V02_ROLL_DRAFTS_TABLE_DDL,
  DEFAULT_MAX_INNATE_ROLL_ATTEMPTS,
  DEFAULT_ROLL_DRAFT_TTL_MS,
  rollInnateDestinyTripleFromCatalog,
  toCharacterV02Snapshot,
  type InnateDestinyRollResult,
  type RollInnateDestinyOptions
};

export interface CharacterV02ActionOptions {
  destinyCatalog?: Readonly<Record<string, DestinyDefinitionMetadata>>;
  allowNonApprovedCatalogInTests?: boolean;
  nowMs?: number;
  rollDraftTtlMs?: number;
  randomIntFn?: (maxExclusive: number) => number;
  maxRollAttempts?: number;
}

export interface ServerOnlyGrantAcquiredDestinyParams {
  accountId: string;
  characterId?: string;
  requestId: string;
  traitId: string;
}

export interface ServerOnlyAwardCharacterExpParams {
  accountId: string;
  characterId?: string;
  requestId: string;
  expDelta: bigint | number | string;
}

export type OwnedCharacterSnapshotLookupResult =
  | {
      ok: true;
      snapshot: CharacterV02SnapshotPayload;
      activeRollDraft: DestinyRollDraft | null;
    }
  | {
      ok: false;
      code: "CHARACTER_NOT_FOUND" | "CHARACTER_OWNERSHIP_FORBIDDEN";
      messageVi: string;
    };

export class CharacterV02ActionService {
  constructor(
    private readonly host: CharacterV02RepositoryHost,
    private readonly repository: CharacterV02Repository
  ) {}

  private runAtomic = <T>(
    tx: SqlTransaction | undefined,
    fn: (runner: SqlQueryRunner, activeTx: SqlTransaction) => Promise<T>
  ): Promise<T> => {
    if (tx !== undefined) {
      const runner = this.host.resolveQueryRunner(tx);
      return fn(runner, tx);
    }
    return this.host.withTransaction(async (managedTx) => {
      const runner = this.host.resolveQueryRunner(managedTx);
      return fn(runner, managedTx);
    });
  };

  private resolveCatalog(
    options?: CharacterV02ActionOptions
  ): Readonly<Record<string, DestinyDefinitionMetadata>> {
    return options?.destinyCatalog ?? APPROVED_PRODUCTION_DESTINY_CATALOG;
  }

  private resolveNowMs(options?: CharacterV02ActionOptions): number {
    if (
      options?.nowMs !== undefined &&
      Number.isSafeInteger(options.nowMs) &&
      options.nowMs > 0
    ) {
      return options.nowMs;
    }
    return Date.now();
  }

  createCharacterDraft(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeCreateCharacterDraft({
      runAtomic: this.runAtomic,
      repository: this.repository,
      accountId,
      rawIntent,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      tx
    });
  }

  rollInnateDestiny(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeRollInnateDestiny({
      runAtomic: this.runAtomic,
      repository: this.repository,
      accountId,
      rawIntent,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      options,
      tx
    });
  }

  confirmInnateDestiny(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeConfirmInnateDestiny({
      runAtomic: this.runAtomic,
      repository: this.repository,
      accountId,
      rawIntent,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      tx
    });
  }

  deleteCharacter(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeDeleteCharacter({
      runAtomic: this.runAtomic,
      repository: this.repository,
      accountId,
      rawIntent,
      catalog: this.resolveCatalog(options),
      tx
    });
  }

  allocateAttributePoint(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeAllocateAttributePoint({
      runAtomic: this.runAtomic,
      repository: this.repository,
      accountId,
      rawIntent,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      tx
    });
  }

  equipAcquiredDestinyTrait(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeEquipAcquiredDestinyTrait({
      runAtomic: this.runAtomic,
      repository: this.repository,
      accountId,
      rawIntent,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      tx
    });
  }

  unequipAcquiredDestinyTrait(
    accountId: string,
    rawIntent: unknown,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeUnequipAcquiredDestinyTrait({
      runAtomic: this.runAtomic,
      repository: this.repository,
      accountId,
      rawIntent,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      tx
    });
  }

  grantAcquiredDestinyTraitServerOnly(
    grantParams: ServerOnlyGrantAcquiredDestinyParams,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeGrantAcquiredDestinyTraitServerOnly({
      runAtomic: this.runAtomic,
      repository: this.repository,
      grantParams,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      tx
    });
  }

  awardCharacterExpServerOnly(
    awardParams: ServerOnlyAwardCharacterExpParams,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02ActionResultPayload> {
    return executeAwardCharacterExpServerOnly({
      runAtomic: this.runAtomic,
      repository: this.repository,
      awardParams,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      tx
    });
  }

  getActiveRollDraftForCharacter(
    accountId: string,
    characterId: string,
    nowMs = Date.now(),
    tx?: SqlTransaction
  ): Promise<DestinyRollDraft | null> {
    const runner = this.host.resolveQueryRunner(tx);
    return queryActiveRollDraftForCharacter(runner, accountId, characterId, nowMs);
  }

  async listCharacterRoster(
    accountId: string,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterRosterEntryDto[]> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanAccount, 128)) {
      return [];
    }
    const catalog = this.resolveCatalog(options);
    const list = await this.repository.listCharactersByAccount(
      cleanAccount,
      { destinyCatalog: catalog },
      tx
    );
    const roster: CharacterRosterEntryDto[] = [];
    for (const charState of list) {
      if (charState.identity.creationState !== "confirmed") {
        continue;
      }
      roster.push({
        characterId: charState.identity.characterId,
        accountId: charState.identity.accountId,
        name: charState.identity.name,
        appearanceId: charState.identity.appearanceId,
        creationState: charState.identity.creationState,
        level: charState.levelProgress.level,
        realmId: charState.cultivation.realmId,
        realmStage: charState.cultivation.realmStage,
        tuVi: charState.cultivation.tuVi,
        zoneId: charState.world.zoneId,
        x: charState.world.x,
        y: charState.world.y,
        linhThach: charState.world.linhThach,
        innateTraitIds:
          charState.destiny
            ? ([...charState.destiny.innate] as [string, string, string])
            : null,
        activeRollDraft: null,
        createdAtMs: charState.identity.createdAtMs,
        updatedAtMs: charState.updatedAtMs
      });
    }
    return roster;
  }

  async getOwnedCharacterSnapshot(
    accountId: string,
    characterId: string,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<OwnedCharacterSnapshotLookupResult> {
    const cleanAccount = typeof accountId === "string" ? accountId.trim() : "";
    const cleanCharId = typeof characterId === "string" ? characterId.trim() : "";
    if (!isNonEmptyTrimmedString(cleanCharId, 128)) {
      return {
        ok: false,
        code: "CHARACTER_NOT_FOUND",
        messageVi: "Không tìm thấy nhân vật v0.2 theo yêu cầu."
      };
    }
    const catalog = this.resolveCatalog(options);
    const nowMs = this.resolveNowMs(options);
    const found = await this.repository.getByCharacterId(
      cleanCharId,
      { destinyCatalog: catalog },
      tx
    );
    if (!found) {
      return {
        ok: false,
        code: "CHARACTER_NOT_FOUND",
        messageVi: "Không tìm thấy nhân vật v0.2 theo yêu cầu."
      };
    }
    if (found.identity.accountId !== cleanAccount) {
      return {
        ok: false,
        code: "CHARACTER_OWNERSHIP_FORBIDDEN",
        messageVi: "Nhân vật không thuộc quyền sở hữu của tài khoản hiện tại."
      };
    }
    const snapshot = toCharacterV02Snapshot(found, catalog);
    const activeRollDraft =
      found.identity.creationState === "draft"
        ? await this.getActiveRollDraftForCharacter(cleanAccount, cleanCharId, nowMs, tx)
        : null;
    return {
      ok: true,
      snapshot,
      activeRollDraft
    };
  }

  syncRuntimeWorldState(
    accountId: string,
    runtimeState: CharacterSaveState,
    options?: CharacterV02ActionOptions,
    tx?: SqlTransaction
  ): Promise<CharacterV02SnapshotPayload | null> {
    return executeSyncRuntimeWorldState({
      runAtomic: this.runAtomic,
      repository: this.repository,
      accountId,
      runtimeState,
      catalog: this.resolveCatalog(options),
      nowMs: this.resolveNowMs(options),
      tx
    });
  }
}
