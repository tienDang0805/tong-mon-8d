# TD-05 · Visual Content Contract — Every Released Content Type Must Be Visible

> Version: TD-05 v0.7, 2026-10-16 · **DESIGN_BASELINE / OWNER_REVIEW_REQUIRED**. Interpretation of the owner's explicit directive: every newly authored **player-visible content object** must have its own traceable asset/render workflow and an observable in-game representation. Backend-only domain objects do not each require a sprite. This is a design specification, not implemented runtime code or blanket art approval.

## 1. Non-negotiable player-facing promise

The game is a living **Phaser 4 / Tiled Xianxia pixel world**, not a text-first business dashboard. An accepted content feature is not considered shipped when it merely adds a database record, iconless quest text, or a functioning popup. An ordinary player must be able to **encounter, recognize, interact with, and receive visual feedback from** the content where its gameplay implies world presence.

Every `ContentDef` authored under TD-04 declares a `visualProfileId`, `visualIntent`, `requiredAssetRoles[]`, `worldPresentationBindings[]`, `interactionFeedback[]`, `artStatus`, `contentStatus`, and `reviewEvidence[]` as relevant. Absence is an explicit release-blocking error for player-visible content, not permission to render anonymous rectangles or reuse random character art. Some abstract concepts—EXP numeric values, shop price logic, quest conditions, server locks—do **not** get independent sprite files; they get a mapped visible UI/world consequence wherever players encounter them.

**Single responsibility:** TD-04 owns what an NPC/item/quest/shop means and its stable ID; TD-05 owns how that approved object becomes visually legible. TD-01 owns underlying character stats/destiny; TD-02 owns skill and damage simulation; TD-03 owns online activity and manual quest state. Visual effects consume emitted authoritative events and never award items, change flags or advance stories.

## 2. Content-to-visual-profile matrix (minimum role sets)

| Content type → render profile | Required game-world representation | Required supporting asset roles | Required review evidence |
|---|---|---|---|
| Player character / human NPC / ten Legendary NPCs → `character_actor` | Animated world actor standing at true Tiled location; correct shadow, Y-depth, animation and interaction marker | Character sheet (directional idle, walk, attack/cast/hurt only when role uses them), portrait for dialogue, authored ambient aura where appropriate | Idle/walk at world zoom, interactions, screenshots against nearby background; verify **distinct silhouettes** for legendary figures |
| ChatDVT / spirit beast / monster → `creature_actor` | Physically coherent **quadruped or creature**, telegraphed attack, hit, death, shared HP and drop feedback | Species-specific directional motion, combat poses/VFX, ground contact/shadow, death/hit state | In-engine animation and co-op combat; ChatDVT NEVER human |
| Merchant / specialist vendor → `vendor_actor` | Vendor sprite positioned at identifiable counter and sign, animated greeting, manually accessible trading interaction | Vendor portrait/sprite, category sign/icon, stall props, speech / trade feedback | Screenshot: walk up, interact, browse, buy, sell, see goods change inventory |
| Town Tụ Bảo Các / shop front / dungeon entrance → `landmark_building` | Recognizable facade and traversable doorway/portal at authored coordinates; visible category signage and small interior or market-counter scene | AI-derived architecture/tiles/props/roof/door, sign art, threshold/VFX, optional interior chunks | Exterior/interior screenshot; real collision + doorway reachability |
| Region / zone / instance → `tilemap_region` | Coherent layered full scene, sightlines, walkable surfaces, depth, ambience and interactive landmarks, not bare colored ground | Generated ground/wall/foliage/roof/water material tiles, props, parallax/background if applicable, ambience/VFX | Full scene desktop and mobile, collision map overlay, portal roundtrip, minimap coverage |
| Equipment weapon → `equipment_visible` | Inventory icon **and** world/equip representation where silhouette/attack depends on the weapon; attack animation matches | Item icon, held-weapon overlay or authored sprite variant, hit swing/VFX where used | Before/after equip at world zoom, attack frame consistency |
| Other equipment → `equipment_inventory` | Distinct illustrated icon and inventory/inspect preview; visible appearance change if the item promises cosmetic silhouette | Item icon, gear thumbnail; optional coordinated character layer/sprite variant | Inventory selection and gear effect readable; no universal claim all 6 slots dynamically alter sprite |
| Food, pills, materials, manuals, quest items → `inventory_item` | Unique or documented approved shared icon **with correct item-specific silhouette**; if dropped/picked, illustrated ground pickup; consumption/learning feedback | Inventory icon; ground drop icon when drop is allowed; food/cauldron steam, pill sparkle, manual study feedback where used | Shop list icon, inventory tooltip, ground drop or use moment where relevant |
| Võ Kỹ/Thần Thông → `active_skill` | Hotbar icon + **visible skill animation/telegraph/contact/impact** attached to actor/target; combat must not be just text and numbers | Skill icon, attack/cast poses, projectile/hit VFX, enemy warning telegraph, readable cooldown overlay | Actual GIF/video/still of cast, hit, miss/blocked, target reaction; verify against TD-02 server event |
| Công Pháp → `cultivation_method` | Illustrated manual/scroll + representative cultivation aura or stance when practicing/advancing; not combat spam | Manual cover/icon, cultivation aura/VFX (source-generated), breakthrough ceremony treatment | Cultivation UI + player visible meditation/breakthrough moment |
| Mệnh cách / Đạo Cảnh / Achievement → `progression_symbol` | Artified emblem/card/badge + distinct in-game activation or earned milestone feedback; no standalone character on map needed | Symbol/icon, discovery or level-up VFX, optional short animated motif | Character panel and in-world gain/equip cue; canonical rarity clearly labeled |
| Quest, NPC dialogue, town-board job → `quest_visual` | **World-target anchor**: person, object, landmark or quest board; temporary marker and feedback after human interaction | NPC/board art, objective prop, minimap/map marker, optional illustration/short cutscene, completion VFX | Screenshot pathfinding ends at target, manual action works; Q journal is supplementary |
| Bí Cảnh combat / point-click → `instance_scene` | Distinct illustrated stage/room/props/interaction hotspots and hand-authored encounter VFX; no pure menu dungeon | Location tilesets, layered set dressing, puzzle/choice props, transition VFX | Player navigates and performs manual branch; auto farm cannot choose story response |
| World reward/drop/pickup → `loot_feedback` | Item sprite in world if ground method; distinct grant animation if direct-to-inventory | Ground icon / collection arc / toast and inventory icon | Exactly one delivery path and correct visibility with TD-04 reward event |
| Pure server/data objects (`ConditionDef`, price version, EXP curve, cooldown timer) → `system_only` | No independent world art, but any player-facing state gets **existing, approved** relevant feedback binding | Reference shared UI skin/feedback definition; no unique sprite requirement | Visual binding audit for each player-facing outcome |

**Important:** A `visualProfileId` is a reusable *pipeline recipe*, not permission to reuse the exact same drawing for unrelated NPCs, monsters, weapons or buildings. A shareable generic icon, effect or terrain tile must declare semantic fit and human approval. `Thái Tài` and `Gia Bảo` cannot ship with inherited placeholder aliases from `hoa_tran` / `hero_kiem_tu` as final artwork.

## 3. Data contracts (design sketches, not code changes)

```ts
export type VisualProfile =
  | 'character_actor' | 'creature_actor' | 'vendor_actor'
  | 'landmark_building' | 'tilemap_region'
  | 'equipment_visible' | 'equipment_inventory'
  | 'inventory_item' | 'active_skill' | 'cultivation_method'
  | 'progression_symbol' | 'quest_visual' | 'instance_scene'
  | 'loot_feedback' | 'system_only';

export type ArtLifecycle =
  | 'PROPOSED' | 'TECHNICALLY_VERIFIED' | 'HUMAN_APPROVED'
  | 'REJECTED' | 'PLACEHOLDER';

export interface VisualBindingDef {
  contentId: string;
  visualProfileId: VisualProfile;
  assetIds: string[];
  requiredRoles: string[];
  optionalRoles: string[];
  anchorLocationId?: string;
  gameplayEventBindings: string[];
  reviewEvidenceIds: string[];
  visualState: ArtLifecycle;
  renderReviewState: 'NOT_TESTED' | 'TECHNICALLY_VERIFIED' | 'HUMAN_APPROVED';
}

export interface AssetSourceProvenanceDef {
  assetId: string;
  semanticRole: string;
  origin: 'GENUINE_GENERATIVE_SOURCE' | 'APPROVED_GENERATIVE_DERIVATIVE';
  sourcePaths: string[];
  sha256: string[];
  authoringSpecPath: string;
  transformPipelineVersion: string;
  outputPaths: string[];
  exactFrameOrTileMetadata: Record<string, string | number>;
  artLifecycle: ArtLifecycle;
}
```

Do not add production `VisualBindingDef` records with a nonexistent `assetId`. For missing art, create a **DRAFT visual requirement**; keep legacy placeholders only to preserve existing prototype playability. A draft may be playtested using clearly marked placeholder art but **cannot be promoted to final RELEASED content** under the owner's new requirement. No fake `HUMAN_APPROVED` flag.

## 4. Visual readiness validation

- `VIS-01` a new active monster or vendor cannot reach RELEASED if actor animation, in-world placement or reviewed sprite is missing.
- `VIS-02` a new shop cannot reach RELEASED if physical Tụ Bảo Các/counter/sign and genuine shop browse feedback are missing. A standalone shop popup only is insufficient.
- `VIS-03` a new skill cannot reach RELEASED with only an icon or text damage; require cast/impact/target response.
- `VIS-04` an item cannot reach RELEASED without an approved image for the contexts where it appears (inventory; drop/held as applicable).
- `VIS-05` quest target must resolve to world location/actor/prop; public quest cannot be a popup-only JSON entry.
- `VIS-06` `system_only` classification requires explicit justification and human review if it influences a visible feature.
- `VIS-07` no secret unreleased Legendary item/realm/story illustrations leaked in ordinary shop catalog, tooltip or publicly accessible asset index.
- `VIS-08` all render references validated against manifest and actual Phaser/Tiled asset keys; no silent missing texture fallback.

## 5. Formal release intersection

A content pack becomes `RELEASED` only if **all** apply: content/schema authorized (TD-04), correct server simulation (TD-01/02), online/manual interaction semantics verified (TD-03), required art technically passes (TD-05), **human creative review** at gameplay zoom has approved its necessary production assets and scene integration, and playtest captures are attached. Individual item icon approval is not blanket approval of the full scene. The existing Phase 0 technical `PASS` is not final art sign-off.
