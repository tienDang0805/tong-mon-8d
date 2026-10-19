import type {
  BaseAttributeKey,
  CanonicalRealmId,
  CharacterCreationState,
  DestinyKind,
  DestinyRarity,
  Direction,
  ZoneId
} from "../ids/index.js";
import type { ActiveBuff, InventoryItemStack } from "./combat.js";
import type { QuestProgressState } from "./quest.js";

export type BaseAttributes = Record<BaseAttributeKey, number>;

export interface CharacterIdentity {
  characterId: string;
  accountId: string;
  name: string;
  appearanceId: string;
  createdAtMs: number;
  creationState: CharacterCreationState;
  revision: number;
}

export interface CharacterLevelProgress {
  level: number;
  expTowardNext: string;
  freeAttributePoints: number;
  allocated: BaseAttributes;
  earnedPermanent: BaseAttributes;
}

export interface DestinyDefinitionMetadata {
  id: string;
  displayNameVi: string;
  rarity: DestinyRarity;
  kind: DestinyKind;
  legendaryNpcId: string | null;
  ownerApprovalState: "APPROVED" | "PROPOSED";
}

export interface DestinyStarterDefinition extends DestinyDefinitionMetadata {
  descriptionVi: string;
  flatPreRealmAttributeBonuses: Partial<BaseAttributes>;
  bonusApprovalState: "DESIGN_BASELINE";
  narrativeState: "APPROVED" | "DESIGN_BASELINE" | "NOT_DESIGNED";
}

export interface CharacterAppearanceOption {
  id: string;
  displayNameVi: string;
  subtitleVi: string;
  spriteKey: string;
  portraitUrl: string;
}

export interface DestinyCollection {
  innate: [string, string, string];
  innateConfirmedAtMs: number;
  acquiredTraitIds: string[];
  activeAcquiredSlots: [string | null, string | null, string | null];
  collectionRevision: number;
}

export interface DestinyRollDraft {
  characterCreationId: string;
  rollNonce: string;
  candidateTraitIds: [string, string, string];
  expiresAtMs: number;
}

export interface GuestAuthIssueRequestPayload {
  requestId?: string;
}

export interface GuestAuthVerifyRequestPayload {
  requestId?: string;
  guestToken: string;
}

export interface GuestAuthResultPayload {
  requestId?: string;
  ok: boolean;
  code: string;
  messageVi: string;
  accountId?: string;
  guestToken?: string;
  activeRollDraft?: DestinyRollDraft | null;
}

export interface CreateCharacterV02DraftIntentPayload {
  requestId: string;
  name: string;
  appearanceId?: string;
}

export interface RollInnateDestinyV02IntentPayload {
  requestId: string;
  characterId?: string;
}

export interface ConfirmInnateDestinyV02IntentPayload {
  requestId: string;
  rollNonce: string;
  characterId?: string;
}

export interface AllocateAttributePointV02IntentPayload {
  requestId: string;
  attributeId: BaseAttributeKey;
  characterId?: string;
}

export interface EquipAcquiredDestinyV02IntentPayload {
  requestId: string;
  slotIndex: 0 | 1 | 2;
  traitId: string;
  characterId?: string;
}

export interface UnequipAcquiredDestinyV02IntentPayload {
  requestId: string;
  slotIndex: 0 | 1 | 2;
  characterId?: string;
}

export interface CharacterV02SnapshotPayload {
  schemaVersion: 2;
  rulesetVersion: string;
  identity: CharacterIdentity;
  levelProgress: CharacterLevelProgress;
  cultivation: {
    realmId: CanonicalRealmId;
    realmStage: number;
    tuVi: string;
  };
  destiny: DestinyCollection | null;
  attributes?: {
    origin: BaseAttributes;
    destinyBonuses: BaseAttributes;
    preRealm: BaseAttributes;
    effective: BaseAttributes;
    realmFactor: number;
  };
  resources: {
    currentHp: number;
    currentMp: number;
  };
  derivedStats: {
    maxHp: number;
    maxMp: number;
    physicalAttack: number;
    spiritualAttack: number;
    physicalDefense: number;
    spiritualDefense: number;
    moveSpeedRating: number;
    cultivationRateRating: number;
  };
  world: {
    zoneId: ZoneId;
    x: number;
    y: number;
    direction: Direction;
    linhThach: number;
    equippedTitle: string;
    equippedInheritance: string | null;
    inventory: InventoryItemStack[];
    quests: Record<string, QuestProgressState>;
    reputation: Record<string, number>;
    buffs: ActiveBuff[];
    meditationStartedAtMs: number;
    lastMeditationClaimAtMs: number;
  };
  updatedAtMs: number;
}

export interface CharacterV02ActionResultPayload {
  requestId: string;
  ok: boolean;
  code: string;
  messageVi: string;
  character?: CharacterV02SnapshotPayload;
  rollDraft?: DestinyRollDraft;
}
