import type {
  DestinyCollection,
  DestinyDefinitionMetadata
} from "@tong-mon-8d/shared";
import { validateDestinyCollection } from "@tong-mon-8d/game-data";

function isNonEmptyTrimmedString(value: unknown, maxLength: number): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed === value && value.length <= maxLength;
}

function isPositiveSafeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function validateDestinyCollectionStructure(
  destiny: unknown,
  destinyCatalog?: Readonly<Record<string, DestinyDefinitionMetadata>>
): { ok: true; value: DestinyCollection } | { ok: false; detail: string } {
  if (typeof destiny !== "object" || destiny === null || Array.isArray(destiny)) {
    return { ok: false, detail: "destiny must be a non-null object when confirmed." };
  }
  const raw = destiny as Record<string, unknown>;
  if (!Array.isArray(raw.innate) || raw.innate.length !== 3) {
    return { ok: false, detail: "destiny.innate must be a 3-element tuple." };
  }
  const innateSet = new Set<string>();
  const innateTuple: [string, string, string] = ["", "", ""];
  for (let i = 0; i < 3; i += 1) {
    const id = raw.innate[i];
    if (!isNonEmptyTrimmedString(id, 128)) {
      return { ok: false, detail: "destiny.innate trait IDs must be non-empty strings." };
    }
    if (innateSet.has(id)) {
      return { ok: false, detail: "destiny.innate cannot contain duplicate trait IDs." };
    }
    innateSet.add(id);
    innateTuple[i] = id;
  }
  if (!isPositiveSafeInt(raw.innateConfirmedAtMs)) {
    return { ok: false, detail: "destiny.innateConfirmedAtMs must be a positive safe integer." };
  }
  if (!isPositiveSafeInt(raw.collectionRevision)) {
    return { ok: false, detail: "destiny.collectionRevision must be a positive safe integer." };
  }
  if (!Array.isArray(raw.acquiredTraitIds)) {
    return { ok: false, detail: "destiny.acquiredTraitIds must be an array." };
  }
  const acquiredSet = new Set<string>();
  const acquiredList: string[] = [];
  for (const rawId of raw.acquiredTraitIds) {
    if (!isNonEmptyTrimmedString(rawId, 128)) {
      return { ok: false, detail: "acquiredTraitIds entries must be non-empty strings." };
    }
    if (innateSet.has(rawId)) {
      return { ok: false, detail: "acquiredTraitIds cannot overlap with innate traits." };
    }
    if (acquiredSet.has(rawId)) {
      return { ok: false, detail: "acquiredTraitIds cannot contain duplicates." };
    }
    acquiredSet.add(rawId);
    acquiredList.push(rawId);
  }
  if (!Array.isArray(raw.activeAcquiredSlots) || raw.activeAcquiredSlots.length !== 3) {
    return { ok: false, detail: "destiny.activeAcquiredSlots must be a 3-element tuple." };
  }
  const activeSeen = new Set<string>();
  const activeTuple: [string | null, string | null, string | null] = [null, null, null];
  for (let i = 0; i < 3; i += 1) {
    const slotVal = raw.activeAcquiredSlots[i];
    if (slotVal === null) {
      activeTuple[i] = null;
      continue;
    }
    if (typeof slotVal !== "string" || !acquiredSet.has(slotVal)) {
      return {
        ok: false,
        detail: "activeAcquiredSlots entries must be null or owned in acquiredTraitIds."
      };
    }
    if (activeSeen.has(slotVal)) {
      return {
        ok: false,
        detail: "activeAcquiredSlots cannot equip the same trait in multiple slots."
      };
    }
    activeSeen.add(slotVal);
    activeTuple[i] = slotVal;
  }

  const normalized: DestinyCollection = {
    innate: innateTuple,
    innateConfirmedAtMs: raw.innateConfirmedAtMs,
    acquiredTraitIds: acquiredList,
    activeAcquiredSlots: activeTuple,
    collectionRevision: raw.collectionRevision
  };

  if (destinyCatalog !== undefined) {
    const catalogCheck = validateDestinyCollection(normalized, destinyCatalog);
    if (!catalogCheck.ok) {
      return {
        ok: false,
        detail: `Destiny catalog validation failed with code ${catalogCheck.code}.`
      };
    }
  }

  return { ok: true, value: normalized };
}
