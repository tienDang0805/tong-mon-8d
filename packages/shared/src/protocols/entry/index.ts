import type {
  CanonicalRealmId,
  CharacterCreationState,
  ZoneId
} from "../../ids/index.js";
import type {
  CharacterV02SnapshotPayload,
  DestinyRollDraft
} from "../character.js";

export type EntryFlowState =
  | "TITLE"
  | "ROSTER"
  | "CREATE"
  | "DESTINY_ROLL"
  | "ENTERING_WORLD"
  | "IN_WORLD";

export interface CharacterRosterEntryDto {
  characterId: string;
  accountId: string;
  name: string;
  appearanceId: string;
  creationState: CharacterCreationState;
  level: number;
  realmId: CanonicalRealmId;
  realmStage: number;
  tuVi: string;
  zoneId: ZoneId;
  x: number;
  y: number;
  linhThach: number;
  innateTraitIds: [string, string, string] | null;
  activeRollDraft: DestinyRollDraft | null;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface CharacterRosterResponsePayload {
  ok: boolean;
  code: string;
  messageVi: string;
  accountId?: string;
  characters: CharacterRosterEntryDto[];
  lastSelectedCharacterId?: string | null;
}

export interface SelectCharacterForWorldEntryRequestPayload {
  requestId?: string;
  characterId: string;
}

export interface SelectCharacterForWorldEntryResultPayload {
  ok: boolean;
  code: string;
  messageVi: string;
  character?: CharacterV02SnapshotPayload;
  targetZoneId?: ZoneId;
  spawnX?: number;
  spawnY?: number;
}
