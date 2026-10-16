# SYS-FOOD-CATALOG — Cuisine Discovery, Buying/Cooking, and Phì Đế's Dao

> TD-04 v0.6 | OWNER_REVIEW_REQUIRED. The actual **numerical food-trigger threshold is UNRESOLVED** under `GD-045`. Public purchased and self-cooked qualifying food always count equivalently for public Phì Đế food quests. The proposed catalog entries below are CONTENT PROPOSALS, not implemented canon.

## 1. Separation of culinary mechanics

**Inventory item** = an owned stack with an item ID/quality. **Recipe** = a way to craft item(s) with ingredients, station and server cost. **Food Catalog entry** = a persistent discovery record that a character has legitimately encountered/consumed/tasted/unlocked a unique authored cuisine. **Public food quest** = normal bought/cooked qualifying item and manual NPC submission. **Private Phì Đế Chân Truyền** = Signature Vạn Vị Đạo Thai ownership + favor + special trigger + manual six chapters. They must not collapse into the same boolean.

Neither merely holding 100 duplicate bowls nor purchasing the same bowl repeatedly counts as 100 *unique* dishes. Count uniqueness from stable `foodCatalogId`, once per character per approved discovery rule, not from free-text item names, stack quantities or price paid.

## 2. Schema and discovery provenance

```ts
export interface FoodCatalogEntryDef {
  id: string;
  itemId: string;
  nameVi: string;
  cuisineGroupId: string;
  regionTagIds: string[];
  rarityLabel: string;
  approvedAcquisitionRoutes: ("buy" | "cook" | "quest_reward" | "event" | "trade")[];
  discoveryPolicy: "first_legitimate_obtain" | "first_manual_taste" | "first_manual_submit";
  publiclyQualifiesForPhiDe: boolean;
  catalogActiveFromVersion: number;
  assetIconId: string | null;
}
export interface FoodDiscoveryRecord {
  characterId: string;
  foodCatalogId: string;
  firstSourceEventId: string;
  firstObtainedRoute: string;
  firstDiscoveredAtServerMs: number;
  catalogRevision: number;
}
```

**Design recommendation:** `first_manual_taste` as the default *culinary knowledge* event for a deeper Phì Đế discovery route; `first_legitimate_obtain` could apply to some beginner foods. Player must choose to taste/consume via legitimate UI or perform an explicitly authored NPC interaction; **auto pickup never auto tastes/cooks/feeds NPC**. If initial main-story objective requests `obtain`, normal online farm looting may count that objective by TD-03 but it does not imply cuisine mastered. Food discovery events cannot be retroactively created from client-submitted history.

Each discovery is unique on `(characterId, foodCatalogId)`; legitimate buy/cook paths may both reveal the same catalog entry but create only one record, preserving first-route provenance. Discovery should persist after consuming/discarding the dish. Never grant a Legendary signature simply for discovery count. The culinary collection provides story gates/rewards only where a versioned quest/reward definition explicitly says so.

## 3. Candidate food content batches — NOT owner-approved items

Three already existing qualifying food items from v0.1 are **LEGACY_COMPAT**, not a newly authored catalog count. Other named ideas below are **PROPOSED** and should only become content after region, ingredients, icon/texture and balance approval.

| Batch | Food / catalog ID | Current or candidate status | Example acquisition |
|---|---|---|---|
| Beginner village | `mi_linh_thach_thanh_truc` — Mì Linh Mạch Thanh Trúc | Existing item ID; proposed catalog record | Buy or cook |
| Beginner village | `banh_bao_linh_thu` — Bánh Bao Linh Thú | Existing item ID; proposed catalog record | Buy |
| Beginner village | `canh_truc_lang_linh_thao` — Canh Trúc Lang Linh Thảo | Existing item ID; proposed catalog record | Buy or cook |
| Beginner village | `food_chao_tan_linh` — Cháo Tân Linh | PROPOSED NEW ID | Buy/cook beginner |
| Beginner village | `food_banh_truc_non` — Bánh Trúc Non | PROPOSED NEW ID | Starter recipe |
| Beginner village | `food_tra_moc_tam` — Trà Mộc Tâm | PROPOSED NEW ID | Vendor or herb tea |
| Regional forest | `food_thit_lang_huong_truc` — Thịt Lang Hương Trúc | PROPOSED NEW ID | Wolf hunt → cooking |
| Regional forest | `food_canh_duoc_thao` — Canh Dược Thảo | PROPOSED NEW ID | Gather+craft |
| Regional forest | `food_com_linh_truc` — Cơm Linh Trúc | PROPOSED NEW ID | Regional quest recipe |
| Regional forest | `food_nam_suong_linh` — Nấm Sương Linh | PROPOSED NEW ID | Exploration vendor |
| Sect cooking | `food_thap_vi_dinh` — Thập Vị Đỉnh | PROPOSED NEW ID | Special station |
| Sect cooking | `food_tu_linh_banh` — Tứ Linh Bánh | PROPOSED NEW ID | Event recipe |
| Sect cooking | `food_dai_tiec_tan_mon` — Đại Tiệc Tân Môn | PROPOSED NEW ID | Multi-ingredient feast |
| Sect cooking | `food_hoa_dao_tra` — Hoa Đào Trà | PROPOSED NEW ID | Optional tea |
| High Dao feast | `food_cuu_thien_tien_yen` — Cửu Thiên Tiên Yến | PROPOSED NEW ID | High-tier story event |
| High Dao feast | `food_van_vi_chung_dao` — Vạn Vị Chứng Đạo | PROPOSED NEW ID | Deep personal culinary challenge |
| High Dao feast | `food_huyen_linh_suong` — Huyền Linh Sương | PROPOSED NEW ID | Exceptional discovery |
| High Dao feast | `food_thien_tam_mi` — Thiên Tâm Mì | PROPOSED NEW ID | Legendary banquet hint |

**These 18 examples are an authoring seed, not the total size of Bát Hoang's food universe.** Do not equate “18 catalog entries in a draft” with “must taste 18 to unlock Phì Đế” or silently turn it into an `allCatalogEntries` gate. Food unlock condition may later involve regional variety, meaningful choices and special story flag rather than pure count. Original suggestion of 80 or full catalog remains NOT approved.

## 4. Food/Alchemy/Trade interactions

- Ingredients from gathering, valid online kills, shops and story rewards. Cooking requires **manual interaction** with correct station/recipe, validating quantities, recipe learned, cooldown, and a single transaction of consume ingredients → create output + related rewards.
- Purchased and cooked versions of a qualifying meal are both valid for the **same ordinary quest item requirement**, unless a later private challenge *explicitly* says it tests cooking technique and is separately approved. No player forced to cook to complete public main-story content.
- Existing buff categories `meal`, `beverage`, `pill` are treated as independent consumption slot candidates; TD-01 owns effect caps; TD-04 supplies effect source IDs and expiration, TD-03 auto farm may use a legally owned medicine policy but **cannot auto cook/buy or hand in food**.
- Crafted output quality and edible content taxonomy are independent of Destiny rarity; there is no implicit “Thần-Phẩm food means automatically grants Thần mệnh cách.”
- First-time tasting/food discovery may grant bounded XP/Tu Vi/achievement if explicitly authored; such grants need idempotent source events and TD-01 Level caps, no generic free trait grants.

## 5. Phì Đế food gating without unsafe canon changes

Allow the special trigger engine to express a *future owner-approved* `foodCatalogDiversity` or `foodDiscoveryCountAtLeast` condition, but **no numeric target is declared in this file**. Stage the catalog in waves: (1) village usable catalog, (2) forest ingredients, (3) town/sect cuisines, (4) grand feasts. Present owner with active content count, accessibility and expected completion time **before** choosing the protected private route threshold.

Public `/phi_de` quest success → public blessing/reputation; this does **not** grant `phi_de` signature, `TRUE_DISCIPLE`, or auto finish a six-chapter chapter. Main story final Phì Đế twist is universal, cannot be locked behind the private culinary catalog.

## 6. Verification

`FOOD-01`: same dish purchased and cooked validates public quest; `FOOD-02`: discovery of same `foodCatalogId` via two routes counts once; `FOOD-03`: stack quantity 99 counts once; `FOOD-04`: online loot does not auto consume/taste; `FOOD-05`: catalog persisted after consumption; `FOOD-06`: public food does not mint protected signature; `FOOD-07`: no food threshold hard-coded without owner decision; `FOOD-08`: secret catalog entries not leaked; `FOOD-09`: recipe spend and output atomic; `FOOD-10`: each new item and icon reference validated or explicitly deferred as unapproved production artwork.
