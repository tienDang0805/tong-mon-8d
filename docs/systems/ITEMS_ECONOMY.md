# SYS-ITEMS-ECONOMY — Items, Equipment, Loot, Rewards and Party Entitlement

> TD-04 v0.6 | OWNER_REVIEW_REQUIRED. `GD-030..034`, `GD-037`, `GD-045`. TD-01 owns stat/level formulas; TD-02 owns damage, attack outcomes and Dao XP; TD-03 owns online combat activities, pickup and quest credit. TD-04 supplies data and economy predicates only.

## 1. Item categories and identities

`ItemDef.id` is immutable and globally unique; an inventory stack references this ID plus only metadata required for nonfungible qualities. Inventories, ground drops and rewards represent ONE logical item ownership event with stable provenance. Candidate categories: `consumable_hp`, `consumable_mp`, `pill`, `spiritual_food`, `ingredient`, `gathered_material`, `equipment`, `cultivation_manual`, `martial_manual`, `quest_item`, `inheritance_token`, `currency_token`, `cosmetic`.

```ts
export type ItemCategory = "consumable_hp" | "consumable_mp" | "pill" | "spiritual_food" | "ingredient" | "gathered_material" | "equipment" | "cultivation_manual" | "martial_manual" | "quest_item" | "inheritance_token" | "currency_token" | "cosmetic";
export type EquipmentSlot = "head" | "robe" | "weapon" | "offhand" | "footwear" | "accessory";
export type BindPolicy = "unbound" | "bind_on_equip" | "soulbound";
export type ItemUseEffect =
  | { kind: "restore_resource"; resource: "hp" | "mp"; amount: number }
  | { kind: "grant_tu_vi"; amount: string }
  | { kind: "apply_timed_modifier"; modifierGroupId: string; durationSec: number }
  | { kind: "unlock_recipe"; recipeId: string }
  | { kind: "grant_manual"; techniqueId: string }
  | { kind: "complete_validated_consumption"; eventKind: string };
export interface ItemDef {
  id: string;
  version: number;
  nameVi: string;
  category: ItemCategory;
  stackMax: number;
  bindPolicy: BindPolicy;
  sellable: boolean;
  tradeable: boolean;
  iconAssetId: string | null;
  equipmentSlot: EquipmentSlot | null;
  requirementsConditionId: string | null;
  modifierSetIds: string[];
  effect: ItemUseEffect | null;
  economyBandId: string;
}
```

Equipment has **six candidate slots per TD-01/`GD-037`**. Do NOT equate equipment rarity to Destiny's **4 tiers** or Công Pháp/Võ Kỹ's **6 tiers**; equipment quality ladder is `UNRESOLVED`, define in a separate approved catalog. Each equipped item contributes typed TD-01 `StatModifier`s with stable `sourceId`; equip/unequip recalculates sources rather than permanently adding attack to saved stats. Repeated equip toggles never heal HP/MP. Player does not acquire Thần Võ Kỹ merely because an equipment item's name contains `Thần`.

## 2. Item catalog mapping to the actual prototype

Existing IDs read from `packages/game-data/src/index.ts`, not newly guaranteed art:

| Existing ID | Existing use | New contract | Governance |
|---|---|---|---|
| `mi_linh_thach_thanh_truc` | Qualified food / bought or cooked | `FoodCatalogEntry` + `ItemDef(spiritual_food)` | LEGACY COMPATIBILITY |
| `banh_bao_linh_thu` | Qualified food | Same | LEGACY COMPATIBILITY |
| `canh_truc_lang_linh_thao` | Qualified food / recipe | Same | LEGACY COMPATIBILITY |
| `tra_thanh_tam_tinh_khi` | Beverage/buff | Authored beverage with bounded buff group | LEGACY COMPATIBILITY |
| `tu_khi_dan_so_cap` | Pill and breakthrough assistance | Validate once per explicit breakthrough, no silent extra rewards | LEGACY COMPATIBILITY |
| `thanh_van_kiem_so_cap` | Starter equipment + ATK | Equip via modifier source; current item not proof of a learned Võ Kỹ | LEGACY COMPATIBILITY |
| `nanh_truc_lang`, `vay_thanh_lan` | Monster materials | Valid loot table entries | LEGACY COMPATIBILITY |

`FoodCatalogEntry` details are owned by `FOOD_CATALOG.md`. New proposed entries must be clearly namespaced and accompanied by approved sources/art before production.

## 3. Single-delivery loot contract — prevents existing double loot

One monster death event: `killEventId = (zoneInstanceId, spawnInstanceId, spawnGeneration, defeatOrdinal)` generated only once by TD-02's server resolution. Distinguish `LootRoll` from `LootDelivery`. For each resolved roll and eligible character, choose **EXACTLY ONE** delivery form:

`DIRECT_INVENTORY` → insert inventory grant and source event ledger, no claimable ground instance.

`GROUND_RESERVED` → create one reserved pickup entitlement for a specific owner/party (expiry, range), no inventory grant until legitimate pickup. Auto pickup in TD-03 must use same claim transaction as manual pickup.

A displayed loot sparkle or corpse can be cosmetic and not claimable if direct mode is used. **Never spawn a second claimable item as a visual flourish.** Logical keys: `rollId` unique `(killEventId, characterId, lootEntryId, rollIndex)`; `deliveryId` unique from `rollId`; `pickupId` single-use. Server-seeded deterministic RNG; `chance` and quantity ranges validated and rolled once, not simply every `minQty`. A `pick` requires proven ownership, expiry, range, destination capacity and `unclaimed` state; `ownerCharacterId` is not client-chosen.

At present `handleAttackIntent` unconditionally loops `lootTable` inserting `entry.minQty` into inventory and additionally makes a ground drop. `handlePickupDrop` checks distance but does not check `ownerCharacterId` or claim transaction. **This is migration risk, not an authorization to edit code during docs design.** Migration must remove duplicate awards, add owner check and durable atomic claim.

## 4. Rewards and economics

```ts
export type RewardComponent =
  | { kind: "character_exp"; amount: string }
  | { kind: "tu_vi"; amount: string }
  | { kind: "linh_thach"; amount: string }
  | { kind: "item"; itemId: string; quantity: number; delivery: "DIRECT_INVENTORY" | "GROUND_RESERVED" }
  | { kind: "affinity"; npcId: string; amount: number }
  | { kind: "story_flag"; flagId: string }
  | { kind: "achievement"; achievementId: string }
  | { kind: "acquired_destiny"; traitId: string }
  | { kind: "technique_unlock"; techniqueId: string };
export interface RewardTableDef {
  id: string;
  version: number;
  sourceKind: "monster_kill" | "quest_submit" | "achievement" | "instance_clear" | "craft" | "manual_grant";
  components: RewardComponent[];
  repeatPolicyId: string;
  uniqueClaimScope: "event_character" | "quest_acceptance" | "once_character" | "period_character";
}
```

**No raw `grantLegendarySignature` reward from generic monsters, town quests, cooking count or free gift rewards**. An exceptional future route may author acquired signature only after TD-01 exclusion enforcement and owner approval. Invalid grant cannot drop current signature, replace its ID, or silently grant an alternate Legendary signature. Use explicit authorized fallback/claim error.

Character EXP award invokes TD-01's `AwardExperience`: level cap discards EXP (no bank), other valid rewards continue. Tu Vi never automatically translates into EXP. TD-02 Dao XP generated only by legitimate eligible technique usage, not as a generic loot bonus. `SkillEffect` and `ItemEffect` remain disjoint. All server currencies are virtual gameplay-only Linh Thạch; there is **no real-money trading or monetary gambling**. Shop sink/sell rewards use atomic inventory debit/credit, no negative balances, bounded prices and stable audit reason.

## 5. Party kill eligibility — review candidate

A 2–4 player party is a shared activity but **each character has a separate reward/quest entitlement**. Proposed baseline: for a committed monster death, eligible players have authenticated presence **and** authored participation in combat (damage, tanked damage or verified support within combat window) and are within authorized proximity/range; exact range/window/minimum contribution are **UNRESOLVED numbers** for TD-02/03 integration playtest. Do NOT award to a silent nearby alt tab just because party membership exists. Reward division model (`personal rolls` vs shared pool) is a choice owner must approve, and should never accidentally multiply limited shared boss items.

Ensure two connections/tabs of one character cannot claim separate entitlements; each grant keyed by `characterId`, not browser session. World-visible monster HP syncs to all clients, but per-character inventory/quest progress does not leak. One credited kill may count toward multiple already active valid **per-character objectives** without minting the base monster reward twice. Auto Farm and manual attacks feed the same `killEventId` ledger.

## 6. Anti-duplication and balance checks

`ITEM-01` each awarded entry direct XOR ground; `ITEM-02` reconnect/retry idempotent; `ITEM-03` wrong player fails reserved pickup; `ITEM-04` roll respects chance/quantity, reproducible seeded; `ITEM-05` no cross-tab duplication; `ITEM-06` double quest submit rejected; `ITEM-07` equipped item grants modifier once, no accumulated ATK; `ITEM-08` quest item consumption atomic on claim; `ITEM-09` capped Level EXP does not turn into free Tu Vi; `ITEM-10` no protected signature through generic loot; `ITEM-11` Luong/Thạch never negative; `ITEM-12` legacy ID compatibility protected.

**Balance is not approved**: specific sale prices, repairs/taxes, healing consumable caps, food stack durations, drop percentages, spawn rates, potion demand and economy sources/sinks are content data that require TD-02 simulation + real TD-03 online AFK rewards/hour before shipping.
