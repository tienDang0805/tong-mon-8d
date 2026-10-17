export type ZoneId = "tan_thu_thon" | "thanh_truc_lam";

export type Direction = "down" | "left" | "right" | "up";

export type AnimState = "idle" | "walk" | "attack" | "cast" | "hurt";

export type CombatDisciplineId = "kiem_tu" | "phap_tu" | "the_tu";

export type CanonicalRealmId =
  | "pham_nhan"
  | "luyen_khi"
  | "truc_co"
  | "kim_dan"
  | "nguyen_anh"
  | "hoa_than"
  | "luyen_hu"
  | "hop_the"
  | "do_kiep"
  | "ban_tien"
  | "chan_tien"
  | "thai_at_kim_tien"
  | "dai_la_kim_tien"
  | "tram_nhat_dao"
  | "tram_nhi_dao"
  | "tram_tam_dao"
  | "ban_thanh"
  | "thanh_canh";

export type NpcRealmId = CanonicalRealmId | "UNKNOWN";

export type DiscipleTier =
  | "stranger"
  | "huu_duyen"
  | "duoc_chu_y"
  | "ky_danh"
  | "noi_mon"
  | "chan_truyen";

export type FoodQualityTier =
  | "binh_thuong"
  | "ngon_mieng"
  | "thuong_pham"
  | "cuc_pham"
  | "tien_tru"
  | "thanh_yen";

export type BuffSlotCategory = "meal" | "beverage" | "pill" | "blessing";

export interface ActiveBuff {
  buffId: string;
  name: string;
  slot: BuffSlotCategory;
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
  tuViMultiplier: number;
  expiresAt: number;
}

export interface InventoryItemStack {
  itemId: string;
  quantity: number;
  quality?: FoodQualityTier;
}

export interface QuestProgressState {
  questId: string;
  status: "not_started" | "active" | "completed";
  stepIndex: number;
  objectiveCount: number;
  completedAt?: number;
}

export type BaseAttributeKey =
  | "the_phach"
  | "luc_dao"
  | "linh_tinh"
  | "than_phap"
  | "than_thuc"
  | "ngo_tinh";

export type BaseAttributes = Record<BaseAttributeKey, number>;

export type CharacterCreationState = "draft" | "confirmed";

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

export type DestinyRarity = "pham" | "hoang" | "tien" | "than";

export type DestinyKind = "ordinary" | "legendary_signature";

export interface DestinyDefinitionMetadata {
  id: string;
  displayNameVi: string;
  rarity: DestinyRarity;
  kind: DestinyKind;
  legendaryNpcId: string | null;
  ownerApprovalState: "APPROVED" | "PROPOSED";
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

export interface CharacterSaveState {
  accountId: string;
  characterId: string;
  nickname: string;
  discipline: CombatDisciplineId;
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  realmId: CanonicalRealmId;
  realmStage: number;
  tuVi: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  linhThach: number;
  equippedTitle: string;
  equippedInheritance: string | null;
  inventory: InventoryItemStack[];
  quests: Record<string, QuestProgressState>;
  reputation: Record<string, number>;
  buffs: ActiveBuff[];
  meditationStartedAt: number;
  lastMeditationClaimAt: number;
  partyId: string | null;
  identity?: CharacterIdentity;
  levelProgress?: CharacterLevelProgress;
  destiny?: DestinyCollection | null;
  rulesetVersion?: string;
}

export interface RemotePlayerSnapshot {
  sessionId: string;
  characterId: string;
  nickname: string;
  discipline: CombatDisciplineId;
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  anim: AnimState;
  hp: number;
  maxHp: number;
  realmId: CanonicalRealmId;
  realmStage: number;
  equippedTitle: string;
  hasPhiDeBlessing: boolean;
  partyId: string | null;
}

export interface MonsterSnapshot {
  instanceId: string;
  monsterId: string;
  name: string;
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  state: "idle" | "patrol" | "aggro" | "attack" | "telegraph" | "dead";
  hp: number;
  maxHp: number;
  telegraphUntil: number;
  respawnAt: number;
}

export interface GroundLootSnapshot {
  dropId: string;
  itemId: string;
  quantity: number;
  ownerCharacterId: string;
  x: number;
  y: number;
  expiresAt: number;
}

export interface PartyStateSnapshot {
  partyId: string;
  leaderCharacterId: string;
  memberIds: string[];
  memberNames: string[];
}

export interface RoomWorldSnapshot {
  zoneId: ZoneId;
  serverTime: number;
  players: Record<string, RemotePlayerSnapshot>;
  monsters: Record<string, MonsterSnapshot>;
  drops: Record<string, GroundLootSnapshot>;
  parties: Record<string, PartyStateSnapshot>;
}

export interface MoveIntentPayload {
  seq: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: Direction;
}

export interface AttackIntentPayload {
  skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang";
  targetInstanceId?: string;
  direction: Direction;
  requestId: string;
}

export interface PortalIntentPayload {
  portalId: string;
  requestId: string;
}

export interface ShopBuyIntentPayload {
  npcId: string;
  itemId: string;
  quantity: number;
  requestId: string;
}

export interface CookRecipeIntentPayload {
  recipeId: string;
  requestId: string;
}

export interface UseItemIntentPayload {
  itemId: string;
  requestId: string;
}

export interface QuestActionIntentPayload {
  npcId: string;
  questId: string;
  action: "accept" | "submit" | "advance";
  submittedItemId?: string;
  requestId: string;
}

export interface ClaimMeditationIntentPayload {
  requestId: string;
}

export interface BreakthroughIntentPayload {
  requestId: string;
}

export interface PickupDropIntentPayload {
  dropId: string;
  requestId: string;
}

export interface PartyActionIntentPayload {
  action: "create" | "join" | "leave";
  targetPartyId?: string;
  requestId: string;
}

export interface ChatMessagePayload {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface CombatEventPayload {
  attackerId: string;
  targetId: string;
  skillId: string;
  damage: number;
  targetHp: number;
  targetMaxHp: number;
  x: number;
  y: number;
  killed: boolean;
}

export interface PortalApprovedPayload {
  portalId: string;
  targetZoneId: ZoneId;
  targetSpawnId: string;
  spawnX: number;
  spawnY: number;
}

export interface ActionResultPayload {
  requestId: string;
  ok: boolean;
  code: string;
  messageVi: string;
  ceremony?: "phi_de_blessing" | "breakthrough_success";
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
}

export interface CreateCharacterV02DraftIntentPayload {
  requestId: string;
  name: string;
  appearanceId?: string;
}

export interface RollInnateDestinyV02IntentPayload {
  requestId: string;
}

export interface ConfirmInnateDestinyV02IntentPayload {
  requestId: string;
  rollNonce: string;
}

export interface AllocateAttributePointV02IntentPayload {
  requestId: string;
  attributeId: BaseAttributeKey;
}

export interface EquipAcquiredDestinyV02IntentPayload {
  requestId: string;
  slotIndex: 0 | 1 | 2;
  traitId: string;
}

export interface UnequipAcquiredDestinyV02IntentPayload {
  requestId: string;
  slotIndex: 0 | 1 | 2;
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
