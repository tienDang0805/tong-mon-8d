export { REALM_PROGRESSION, type RealmDefinition } from "./catalogs/realms.js";
export { LEGENDARY_NPCS, type LegendaryNpcDefinition } from "./catalogs/npcs.js";
export { ITEMS_REGISTRY, type ItemDefinition } from "./catalogs/items.js";
export { RECIPES_REGISTRY, type CulinaryRecipeDefinition } from "./catalogs/recipes.js";
export { SKILLS_REGISTRY, type SkillDefinition } from "./catalogs/techniques.js";
export { MONSTERS_REGISTRY, type MonsterDefinition } from "./catalogs/monsters.js";
export {
  ZONES_REGISTRY,
  type PortalDefinition,
  type ZoneDefinition
} from "./catalogs/zones.js";
export { QUESTS_REGISTRY, type QuestDefinition } from "./catalogs/quests.js";
export {
  COMBAT_MITIGATION_K,
  computeActualDamage,
  computeOfflineMeditationReward,
  formatRealmDisplay,
  getNextRealmAndStage,
  getRealmRequiredTuVi,
  INITIAL_DISCIPLINE_STATS,
  OFFLINE_MEDITATION_CAP_SECONDS
} from "./rules/legacyProgression.js";
export {
  runPlaystyleSimulations,
  type SimulationProfileResult
} from "./rules/legacySimulator.js";
export {
  allocateSingleAttributePoint,
  BASE_ATTRIBUTE_KEYS,
  createZeroBaseAttributes,
  formatExpDecimalString,
  getRealmLevelBand,
  isAtNonSaintMajorRealmLevelCap,
  isBaseAttributeKey,
  isLevelAllowedForRealm,
  isNonNegativeDecimalIntString,
  isValidRealmStage,
  meetsMajorRealmBreakthroughLevelAndStagePrerequisite,
  parseExpDecimalString,
  sumBaseAttributes,
  validateBaseAttributes,
  validateCharacterLevelProgress
} from "./rules/characterContracts.js";
export type {
  AllocateSingleAttributeResult,
  BaseAttributesValidationResult,
  CharacterLevelProgressValidationResult,
  RealmLevelBand
} from "./rules/characterContracts.js";
export {
  APPROVED_CHARACTER_V02_APPEARANCES,
  BASE_ATTRIBUTE_LABELS_VI,
  CANONICAL_LEGENDARY_NPC_IDS,
  computeActiveDestinyPreRealmAttributeBonuses,
  DESTINY_RARITIES,
  DESTINY_RARITY_LABELS_VI,
  formatDestinyTraitBonusSummaryVi,
  getOwnedDestinyTraitIds,
  hasOwnedDestinyTrait,
  isApprovedCharacterV02AppearanceId,
  isDestinyRarity,
  S1E_STARTER_DESTINY_CATALOG,
  S1E_STARTER_DESTINY_CATALOG_VERSION,
  validateDestinyCollection,
  validateDestinyDefinitionMetadata,
  validateDestinyRollDraftShape,
  validateDestinyTripleIds
} from "./catalogs/destinies.js";
export type {
  DestinyCollectionValidationResult,
  DestinyDefinitionMetadataValidationResult,
  DestinyRollDraftShapeValidationResult,
  DestinyTripleValidationResult
} from "./catalogs/destinies.js";
export {
  applyCandidateCharacterExpGrant,
  CANDIDATE_DERIVED_STAT_COEFFICIENTS,
  CANDIDATE_ORIGIN_BASE_ATTRIBUTE,
  CANDIDATE_REALM_BASE_GROWTH,
  CANDIDATE_REALM_STAGE_SPAN_BONUS,
  CANDIDATE_SAINT_ACCELERATION_START_LEVEL,
  computeCandidateBaselineStatSnapshot,
  computeCandidateDerivedStatsFromEffectiveAttributes,
  computeCandidateEffectiveBaseAttributes,
  computeCandidateExpToNextLevel,
  computeCandidateRealmStageFactor,
  computeCandidateTotalExpForLevelSpan,
  createCandidateOriginBaseAttributes,
  getCandidateExpToNextLevelBigInt,
  getCandidateExpToNextLevelDecimal,
  getCandidateRealmStageFactor,
  MAX_SINGLE_GRANT_LEVEL_ADVANCEMENTS,
  MAX_SUPPORTED_EXP_BIGINT,
  MAX_SUPPORTED_EXP_DECIMAL_DIGITS,
  TD01_CANDIDATE_NUMERIC_APPROVAL_STATE,
  TD01_CANDIDATE_RULESET_VERSION
} from "./rules/td01Numeric.js";
export type {
  CandidateBaselineStatSnapshot,
  CandidateBaselineStatSnapshotErrorCode,
  CandidateBaselineStatSnapshotResult,
  CandidateCharacterExpGrantResult,
  CandidateCharacterExpGrantSuccess,
  CandidateDerivedStats,
  CandidateDerivedStatsResult,
  CandidateEffectiveBaseAttributesResult,
  CandidateExpCostValidationCode,
  CandidateExpGrantErrorCode,
  CandidateExpGrantStopReason,
  CandidateExpToNextResult,
  CandidateLevelSpanExpCostResult,
  CandidateRealmStageFactorResult
} from "./rules/td01Numeric.js";
