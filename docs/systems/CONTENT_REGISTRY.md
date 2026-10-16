# SYS-CONTENT-REGISTRY — Stable IDs, Predicates, Rewards and Validation

> TD-04 v0.6 | OWNER_REVIEW_REQUIRED. This is the **authoring/data-contract layer**, not a second gameplay engine. TD-01/02/03 continue to own character, combat and quest state transitions.

## 1. Registry partition and package metadata

| Registry / owner | Has | Does not own |
|---|---|---|
| TD-04 `ZoneContentDef`, `LocationDef`, `PortalEdgeDef`, `EncounterAreaDef`, `InstanceContentDef` | World graph, authored Tiled bindings, encounter zones, authorized access | Pathfinding scheduler or actual route execution (TD-03) |
| TD-04 `ItemDef`, `RecipeDef`, `FoodCatalogEntryDef`, `RewardTableDef`, `LootTableDef` | Items, acquisition source, drop policy, economy | TD-01 stat/EXP math or TD-02 combat damage and death |
| TD-04 `NpcContentDef`, `AffinityPolicyDef`, `GiftPreferenceDef` | NPC data and manual gift predicates | TD-01 signature exclusivity or TD-03 quest lifecycle |
| TD-04 quest content instances | Authored `QuestDef` using TD-03 schema | New quest state machine / auto turn-in |
| TD-04 generic `ConditionDef`, `EffectDef` | Data-driven prerequisite and authorized effect requests | Client-executed scripts or bypassing server domain validation |
| TD-05 asset registry/art manifest | Actual approved visual refs, provenance, source images | Content approval of gameplay difficulty or trait mechanic |

One stable logical ID per content definition; names and descriptions are localized display text, never database identity. Use `definitionVersion` and `contentPackId`, explicit `status: DRAFT|OWNER_APPROVED|RELEASED|ARCHIVED` for *content release*, distinct from TD-05 artwork `HUMAN_APPROVED`. Merely designing a feature does **not** mark it implemented or released.

```ts
export interface ContentPackDef {
  id: string;
  definitionVersion: number;
  status: "DRAFT" | "OWNER_APPROVED" | "RELEASED" | "ARCHIVED";
  requiresPackIds: string[];
  includedDefinitionIds: string[];
  rulesetVersion: string;
  sourceSpecPaths: string[];
  ownerApprovalDecisionIds: string[];
}
```

## 2. Declarative ConditionDef: no arbitrary code or client authority

```ts
export type ConditionDef =
  | { kind: "all"; conditions: ConditionDef[] }
  | { kind: "any"; conditions: ConditionDef[] }
  | { kind: "not"; condition: ConditionDef }
  | { kind: "always" }
  | { kind: "has_owned_destiny"; traitId: string }
  | { kind: "affinity_at_least"; npcId: string; value: number }
  | { kind: "has_item"; itemId: string; quantity: number }
  | { kind: "character_level_at_least"; level: number }
  | { kind: "realm_at_least"; realmId: string }
  | { kind: "dao_stage_at_least"; daoPathId: string; stage: number }
  | { kind: "quest_status"; questId: string; status: string }
  | { kind: "story_flag"; flagId: string; equals: boolean }
  | { kind: "food_discovered_count_at_least"; cuisineGroupId: string | null; count: number }
  | { kind: "location_revealed"; locationId: string }
  | { kind: "period_available"; periodRuleId: string };
```

`has_owned_destiny` checks TD-01 union of innate+acquired irrespective of Hậu Thiên activation. `realm_at_least` is an available *authored condition type*, **not permission to add a universal minimum realm to all Legendary routes**. `food_discovered_count_at_least` exists structurally but **MUST NOT be configured as Phì Đế's special trigger without separate numerical approval**. Hidden character story fields and secret condition predicates are evaluated server-side and never sent as raw trees to unauthorized clients.

Eval rules: reject unexpected kinds, invalid values, unbounded nesting (candidate max depth 8), cyclic references, missing IDs, pathological OR/NOT combinations and conditions whose stable references cross unpublished packs; fail closed, no `eval`/embedded JavaScript or executable content from players. A `not(always)` always false; `all([])` and `any([])` semantics must be explicitly deterministic (candidate reject empty operands, rather than silently truthy). Version and test the predicate evaluator as a pure function with authoritative snapshot, not an ad hoc if-else in each NPC.

## 3. Authorized EffectDef vocabulary (commands, not direct mutations)

```ts
export type EffectDef =
  | { kind: "request_reward_claim"; rewardTableId: string }
  | { kind: "request_item_consumption"; itemId: string; quantity: number }
  | { kind: "request_story_flag"; flagId: string; value: boolean }
  | { kind: "request_unlock_quest"; questId: string }
  | { kind: "request_affinity_change"; npcId: string; delta: number }
  | { kind: "request_food_discovery"; foodCatalogId: string }
  | { kind: "request_achievement"; achievementId: string };
```

All effects are **requests to domain handlers** with explicit actor, source event and ruleset version. Only TD-01 may grant EXP/stats/signatures; only the TD-02 death resolution may generate kill authority; only TD-03 quest engine may accept and complete quest instances. TD-04 data never directly calls SQL to set a special signature or claims the same reward from multiple effect paths. Source event ids are idempotent; currency/item transaction and quest state commit together or use documented durable outbox where cross-service atomicity is unavailable.

## 4. Authoring/release validation pipeline

1. Identify scope and canon: ensure `AGENTS.md`, `docs/DECISIONS.md`, accepted TDs and current code ruleset versions are read.
2. Create a **DRAFT content pack**: author IDs, regions/conditions, QA examples, proposed narrative and art briefs; do not fabricate owner approval.
3. Validate referenced IDs, uniqueness, condition arity/cycles, rewards, range/type safety, current 17 realms and ten Legendary identities, exact six Dao paths, four Destiny and six Technique rarity ladders.
4. Run budget checks: TD-01 Level caps/EXP; TD-02 representative build survival/TTK and realm oppression; TD-03 online presence/reward/quest idempotency. Verify ordinary starter content works for a Phàm-oriented player.
5. Require cross-system gate: main story cannot transitively require protected Legendary signature, NPC private route cannot bypass prerequisite chain, ground/direct loot exclusive, Food Catalog threshold unresolved remains unconfigured.
6. TD-05 prepares actual generated visuals only AFTER art spec/authorization; production art source/provenance and human sign-off required, no image generation fallback to code-drawn tiles/VFX.
7. Test server events, save migration and two-browser live playtest before mark `RELEASED`; record content pack version and evidence, update `PROJECT_STATUS.md`.

## 5. Release candidate matrix and sample pack

**Candidate content pack** `starter_v02_content_draft`: `tan_thu_thon`, `thanh_truc_lam`, three existing food item IDs, `truc_lang`, `thanh_lan_xa`, two-way legacy portals, `main_pham_*` candidate quest IDs and `side_town_food_intro`. All existing IDs are preserved. New candidate `food_*` and `main_pham_*` IDs only become released after explicit owner review, real validation and art sign-off. Never claim that content placeholders or code generation are production art.

## 6. Validation IDs

`REG-01` duplicate ID rejected across loaded packs. `REG-02` broken entity links rejected. `REG-03` inappropriate objective target type rejected. `REG-04` target hidden location not returned to unauthorised client. `REG-05` unknown condition kind rejected. `REG-06` condition cycles/depth invalid. `REG-07` a `main` quest with any transitive signature/private True Disciple prerequisite rejected. `REG-08` equipment quality does not silently inherit destiny rarity. `REG-09` draft content cannot be instantiated as released. `REG-10` reward table references must exist. `REG-11` no auto-skill attack definitions in NPC/quest content. `REG-12` art references marked pending if no HUMAN_APPROVED visuals. `REG-13` proposal and status flags preserved across Design Freeze.
