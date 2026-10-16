# SYS-NPC-AFFINITY — Legendary NPCs, Gifts, Relationship & True Disciple

> TD-04 v0.6 | OWNER_REVIEW_REQUIRED; `GD-006`, `GD-014..016`, `GD-041`, `GD-045`. This file defines relationship CONTENT and prerequisite reference IDs. TD-01 owns actual destiny ownership; TD-03 owns manual quest/interaction state machine.

## 1. Ten canonical figures: stable IDs never change

| npcId | Identity | Realm | Dao / narrative role | Signature state |
|---|---|---|---|---|
| `phi_de` | Phì Đế — Đặng Văn Tiến | Thánh Cảnh | Ẩm Thực Đại Đạo, ChatDVT master, Dẩm Lồn Tiên Tử's dao companion | **Vạn Vị Đạo Thai APPROVED** |
| `rmt_de` | RMT Đế — Phạm Phan Trọng Khải | Thánh Cảnh | Fictional in-game wealth/merchant strategy | Name/effect PROPOSED |
| `vaal_de` | Vaal Đế — Trần Vũ Hoàng Tâm | Thánh Cảnh | Fate/risk with **fictional currency only** | Name/effect PROPOSED |
| `chatdvt` | ChatDVT, Phì Đế's jade-cyan quadruped spirit beast | Thánh Cảnh (Thánh Thú) | Vạn Linh/Khế Ước, loyalty with humor; **never human** | Name/effect PROPOSED |
| `dam_lon_tien_tu` | Dẩm Lồn Tiên Tử | **UNKNOWN** | Hồng Trần Tâm Đạo, independent agency | Name/effect PROPOSED |
| `ngoc_tam` | Ngọc Tâm — Xui Xẻo Chân Quân | Bán Thánh | Misfortune/karma (distinct from Vaal Đế) | Name/effect PROPOSED |
| `thai_tai` | Thái Tài | Bán Thánh | Appraisal and relic study | Name/effect PROPOSED |
| `anh_7` | Anh 7 — Đoàn Quang Huy | Bán Thánh | Seven-sword martial Dao | Name/effect PROPOSED |
| `gia_bao` | Gia Bảo | Đại La Kim Tiên | Dao severing research; stays at canonical realm until explicitly changed | Name/effect PROPOSED |
| `hoa_tran` | Hòa Trần | Thái Ất Kim Tiên | Wandering sage and exploration | Name/effect PROPOSED |

Each NPC's **public main-story role is available to all players**. Exactly one matching Legendary signature can be owned, whether Tiên Thiên or Hậu Thiên. Signature is NOT a universal requirement to interact with that NPC. General favor activities are available for NPCs without the exclusive signature except explicitly-private side content.

## 2. NPC relationship domain — typed data candidates

```ts
export interface NpcContentDef {
  id: string;
  entityType: "legendary" | "merchant" | "world_npc";
  canonicalRealmId: string;
  publicDialogueTreeId: string;
  locationIds: string[];
  affinityPolicyId: string | null;
  giftPreferenceGroupIds: string[];
  publicQuestIds: string[];
  privateQuestlineId: string | null;
  optionalSignatureTraitId: string | null;
}
export interface AffinityPolicyDef {
  id: string;
  baselineMin: number;
  baselineMax: number;
  diminishingReturnRuleId: string | null;
  giftActionCooldownMs: number;
  specialTriggerConditionId: string | null;
  thresholdBands: { id: string; min: number; accessFlags: string[] }[];
}
export interface GiftPreferenceDef {
  npcId: string;
  acceptedItemCategoryIds: string[];
  preferredCatalogTags: string[];
  rejectionReasonId: string | null;
  affinityRewardId: string;
}
export interface LegendaryApprenticeshipDef {
  npcId: string;
  requiredSignatureId: string;
  minAffinityConditionId: string;
  specialTriggerConditionId: string;
  sixChapterQuestIds: [string, string, string, string, string, string];
  graduationRewardId: string;
}
```

**`AffinityPolicyDef` candidate scale 0..1000, with separate thresholds for small talk/quest hint/special trigger**, is NOT an owner-approved number. The previously suggested `-1000..+1000` alternative remains an option; no UI progress percentage or gameplay gate should be coded until review. The function need not be linear. Crucially, gift actions always validate inventory/quantity, proximity, NPC preferences, event idempotency and authored caps, not merely client-reported `npcId`, `itemId`, `liked=true`.

## 3. Gift and choice rules

Gift is a deliberate **manual player action**, never Auto Farm, auto navigation, or unattended town-board execution. Gifts may be acquired from legitimate online loot, crafting, stores, collecting, but actual gifting requires interacting with NPC and confirming the item. Each accepted gift spends **exactly one** authored stack quantity and records `GiftEvent(characterId,npcId,itemId,grantEventId)` transactionally. Public gifts increase public favor without granting a Legendary signature or shortcutting the six-chapter chain.

Rejected gifts: use an explicitly authored decline response/consumption policy (safe baseline: don't consume until accepted), never silently charge a player. Repeated same-item gift efficiency/cooldown require a content-defined policy. Manual narrative choices can grant or reduce favor and emit a unique event; an irreversible choice is versioned and cannot be toggled by repeat packets. NPC favor belongs to the character save, not shared for the entire party.

## 4. Chân Truyền preconditions — exactly the approved order

`matching signature OWNED → affinity threshold met → NPC-specific special trigger → unlock private six-chapter questline → individually complete all six manual chapters → TRUE_DISCIPLE`.

Server condition for *visibility* of a public Legendary NPC does not include private signature. Server condition for private quest line must require matching signature; a character without it sees an ordinary optional narrative experience. Do not add a global minimum cultivation realm. Later *particular chapter* conditions may use `realmAtLeast` after separate owner design approval. True Disciple is a persisted server-issued status; title, `equippedInheritance`, buff, having given dishes or having high favor **alone** is NOT a status certificate.

A character may collect affinity with all ten NPCs; it may never acquire a second distinct Legendary signature as reward. True Disciple of one NPC does not delete another NPC's public friendship. Existing prototype `phi_de_ch1_huong_thom` and `equippedInheritance="phi_de"` should be reconciled as PUBLIC food/favor/blessing content, **not promoted to exclusive Chân Truyền** on migration.

## 5. Phì Đế special trigger and Food Catalog interface

`requiredSignature=Vạn Vị Đạo Thai` is **APPROVED**; associated special trigger involves meaningful engagement with distinct cuisines, but the **threshold (80? full catalog? fraction?) is UNRESOLVED**. `FOOD_CATALOG.md` supplies typed discovery events/taxonomy and a proposed ingredient/content seed — it does **not** choose an unauthorized threshold. The private route should be more than six identical delivery tasks and should not grant access to main-only story content; public culinary purchases/cooking both count for ordinary tasks.

## 6. Tests

`NPC-01`: all ten IDs exist exactly once; no eleventh Legendary or altered realm. `NPC-02`: signature absent means private route locked even at max favor. `NPC-03`: signature present + favor only remains locked pending special trigger. `NPC-04`: signature + favor + trigger reveals chapter 1, not status. `NPC-05`: Chân Truyền only after manual six chapters. `NPC-06`: gift spend/reward idempotent and bounded. `NPC-07`: ordinary food quest remains accessible without signature, bought OR cooked. `NPC-08`: Hậu Thiên signature ownership qualifies even if not equipped. `NPC-09`: public Main Quest and world NPC accessibility never blocked by optional signature route. `NPC-10`: Dẩm Lồn Tiên Tử realm `UNKNOWN`, ChatDVT quadrupedal beast visual spec preserved.
