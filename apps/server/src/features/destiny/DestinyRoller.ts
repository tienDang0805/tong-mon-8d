import crypto from "node:crypto";
import type {
  DestinyDefinitionMetadata,
  DestinyRarity
} from "@tong-mon-8d/shared";
import {
  S1E_STARTER_DESTINY_CATALOG,
  validateDestinyCollection,
  validateDestinyDefinitionMetadata,
  validateDestinyTripleIds
} from "@tong-mon-8d/game-data";

export const DEFAULT_MAX_INNATE_ROLL_ATTEMPTS = 128;

export const APPROVED_PRODUCTION_DESTINY_CATALOG: Readonly<
  Record<string, DestinyDefinitionMetadata>
> = S1E_STARTER_DESTINY_CATALOG;

export const CANDIDATE_INNATE_TIER_WEIGHTS: Readonly<Record<DestinyRarity, number>> =
  Object.freeze({
    pham: 50,
    hoang: 30,
    tien: 15,
    than: 5
  });

export const CANDIDATE_THAN_SIGNATURE_WEIGHT = 60;
export const CANDIDATE_THAN_ORDINARY_WEIGHT = 40;

export type InnateDestinyRollResult =
  | {
      ok: true;
      candidateTraitIds: [string, string, string];
      attemptsUsed: number;
      rejectedCandidates: Array<[string, string, string]>;
    }
  | {
      ok: false;
      code: "CATALOG_NOT_READY";
      detail: string;
      attemptsUsed?: number;
      rejectedCandidates?: Array<[string, string, string]>;
    };

export interface RollInnateDestinyOptions {
  allowNonApprovedInCatalog?: boolean;
  randomIntFn?: (maxExclusive: number) => number;
  maxAttempts?: number;
}

function defaultCsprngInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive safe integer.");
  }
  return crypto.randomInt(0, maxExclusive);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function rollInnateDestinyTripleFromCatalog(
  catalog: Readonly<Record<string, DestinyDefinitionMetadata>>,
  options?: RollInnateDestinyOptions
): InnateDestinyRollResult {
  if (!isPlainRecord(catalog)) {
    return {
      ok: false,
      code: "CATALOG_NOT_READY",
      detail: "Destiny catalog is missing or invalid."
    };
  }

  const allowNonApproved = options?.allowNonApprovedInCatalog === true;
  const randomInt = options?.randomIntFn ?? defaultCsprngInt;
  const maxAttempts =
    options?.maxAttempts !== undefined &&
    Number.isSafeInteger(options.maxAttempts) &&
    options.maxAttempts > 0
      ? options.maxAttempts
      : DEFAULT_MAX_INNATE_ROLL_ATTEMPTS;

  const eligiblePool: DestinyDefinitionMetadata[] = [];
  for (const [key, def] of Object.entries(catalog)) {
    if (!def || typeof def !== "object" || def.id !== key) {
      continue;
    }
    const metaCheck = validateDestinyDefinitionMetadata(def);
    if (!metaCheck.ok) {
      continue;
    }
    if (!allowNonApproved && def.ownerApprovalState !== "APPROVED") {
      continue;
    }
    eligiblePool.push(def);
  }

  const ordinaryEligible = eligiblePool.filter((d) => d.kind === "ordinary");

  if (eligiblePool.length < 3 || ordinaryEligible.length < 2) {
    return {
      ok: false,
      code: "CATALOG_NOT_READY",
      detail:
        "Eligible Tiên Thiên Destiny catalog requires at least 3 traits and at least 2 ordinary non-signature traits."
    };
  }

  const byTier: Record<DestinyRarity, DestinyDefinitionMetadata[]> = {
    pham: [],
    hoang: [],
    tien: [],
    than: []
  };
  for (const def of eligiblePool) {
    byTier[def.rarity].push(def);
  }

  const availableTiers = (["pham", "hoang", "tien", "than"] as const).filter(
    (t) => byTier[t].length > 0
  );
  const totalWeight = availableTiers.reduce(
    (acc, t) => acc + CANDIDATE_INNATE_TIER_WEIGHTS[t],
    0
  );
  const signatureThan = byTier.than.filter((d) => d.kind === "legendary_signature");
  const ordinaryThan = byTier.than.filter((d) => d.kind === "ordinary");

  const sampleIndependentSlotFromFullCatalog = (): DestinyDefinitionMetadata => {
    let roll = randomInt(totalWeight);
    let chosenTier: DestinyRarity = availableTiers[0];
    for (const tier of availableTiers) {
      const w = CANDIDATE_INNATE_TIER_WEIGHTS[tier];
      if (roll < w) {
        chosenTier = tier;
        break;
      }
      roll -= w;
    }

    let tierPool = byTier[chosenTier];
    if (chosenTier === "than") {
      if (signatureThan.length > 0 && ordinaryThan.length > 0) {
        const subRoll = randomInt(
          CANDIDATE_THAN_SIGNATURE_WEIGHT + CANDIDATE_THAN_ORDINARY_WEIGHT
        );
        tierPool =
          subRoll < CANDIDATE_THAN_SIGNATURE_WEIGHT ? signatureThan : ordinaryThan;
      }
    }

    const idx = randomInt(tierPool.length);
    return tierPool[idx];
  };

  const rejectedCandidates: Array<[string, string, string]> = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const slot0 = sampleIndependentSlotFromFullCatalog();
    const slot1 = sampleIndependentSlotFromFullCatalog();
    const slot2 = sampleIndependentSlotFromFullCatalog();
    const candidateTuple: [string, string, string] = [
      slot0.id,
      slot1.id,
      slot2.id
    ];

    const tripleCheck = validateDestinyTripleIds(candidateTuple, catalog);
    if (!tripleCheck.ok) {
      rejectedCandidates.push(candidateTuple);
      continue;
    }

    const collectionCheck = validateDestinyCollection(
      {
        innate: candidateTuple,
        innateConfirmedAtMs: 1,
        acquiredTraitIds: [],
        activeAcquiredSlots: [null, null, null],
        collectionRevision: 1
      },
      catalog
    );
    if (!collectionCheck.ok) {
      rejectedCandidates.push(candidateTuple);
      continue;
    }

    return {
      ok: true,
      candidateTraitIds: candidateTuple,
      attemptsUsed: attempt,
      rejectedCandidates
    };
  }

  return {
    ok: false,
    code: "CATALOG_NOT_READY",
    detail:
      "Unable to sample a valid 3-trait Tiên Thiên Destiny triple within bounded retry limit.",
    attemptsUsed: maxAttempts,
    rejectedCandidates
  };
}
