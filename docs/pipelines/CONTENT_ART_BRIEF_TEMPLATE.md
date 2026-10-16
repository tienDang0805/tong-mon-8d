# TD-05 · Content-to-Art Production Brief & Render Handoff Template

> v0.7 · Design template only. Instantiate **one brief for each player-facing content pack** being produced, reusing asset roles only when visual-semantic fit is justified.

## 1. Minimum brief (copy and fill as Markdown/YAML-like fields)

| Field | Expected value or rule |
|---|---|
| `contentId` | Stable TD-04 registry ID; never invent a different runtime ID only for art |
| `contentType` | `npc`, `monster`, `item`, `skill`, `shop`, `zone`, `quest`, `instance`, `equipment`, `progression` |
| `canonRefs[]` | `GD-*`, specific Lore/TD specs, NPC constraints (incl. spoilering, hidden affiliations) |
| `scopeStatus` | `APPROVED_DIRECTION`, `DESIGN_BASELINE`, `PROPOSED`, `UNRESOLVED`; art is separate lifecycle |
| `visualProfileId` | Enum from `VISUAL_CONTENT_CONTRACT.md` |
| `worldAnchor` | `zoneId`, authored location/portal/object ID and scene-binding method, or `UI_ONLY` with justification |
| `references[]` | Human-approved image/master ref or explicit PROPOSED example, no false approval |
| `neededAssetRoles[]` | Every role with `required=true`, e.g. spritesheet/portrait/tiles/prop/icon/VFX |
| `animationContract` | States, directions, frame counts & feet anchor; allow per-creature reviewed variation |
| `interactionBindings[]` | Specific TD-03 quest/navigation, TD-02 combat or TD-04 shop/reward event types |
| `sceneExamples[]` | Exact in-world moments proving value; at least one screenshot with menu closed |
| `providerAndRights` | Confirm actual genuine generator available, source provenance and rights metadata |
| `outputPaths[]` | Proposed runtime paths and manifest registration; no collisions with old assets |
| `reviewChecklist[]` | Source sheet, contact sheet, atlas preview, in-game screenshot/video, owner decision |

## 2. Example A — Tụ Bảo Các starter market (`PROPOSED LAYOUT`)

| Property | Brief |
|---|---|
| Target | ShopDef `shop_tan_thu_tu_bao_cac` (new candidate ID, **not in released game**) and linked merchant vendor defs |
| Required scene | Authored marketplace building or approved counter cluster within actual Tân Thủ Thôn map, readable from spawn route |
| AI art sources | Roof facade, carved jade sign, wooden doors, counter, shelf variants, pill vessels, scroll racks, weapon displays, warm lanterns, trader actor portraits/sheets |
| Behavior | World counter range → manual interact → same TD-04 ShopService → category search/filter → manual BUY/SELL → immediate return to same world |
| Mandatory test | Walk from spawn, see facade and vendor, buy eligible item, sell owned item, have Linh Thạch deducted/credited once, close UI and move again |
| Creative hold | Actual facade design, counter vs hall layout, palette and vendor identities require human review |

**No physical shop art → content cannot be claimed as released even if shop modal and backend both work.**

## 3. Example B — New Trúc Lang attack visual (`EXISTING ENTITY, ART UPGRADE`)

| Property | Brief |
|---|---|
| Existing ID | `truc_lang` from `MONSTERS_REGISTRY` — preserve it |
| Source role | AI-generation-original quadruped wolf with jade/ash bamboo-forest affinity; directional motion reference consistent across poses |
| Required frames | Appropriate locomotion, pre-attack telegraph, actual attack, hurt, death; actor feet align with Tiled hitbox |
| Emitted event mapping | TD-02 server damage & death events trigger client animation/VFX; no client-side award |
| Evidence | Actual 2-browser forest combat clip, target HP matches, animation shows clear windup and hit, correct one-of loot feedback |
| Hold | Do not auto-generate fake side/back anatomy through mirroring or assume a human 80×96 template fits the wolf |

## 4. Example C — New Võ Kỹ (`FUTURE CONTENT DRAFT`)

| Property | Brief |
|---|---|
| TD-02 source | `TechniqueDef` with exact Dao path, quality, server cooldown/MP, unlock conditions; no substitute formula in art spec |
| Art roles | Illustrated hotbar icon, cast/attack pose, direction-appropriate projectile/trail (if technique needs it), distinct hit and target reaction sprites, telegraph where authored |
| Runtime | Server sends recognized skill event; Phaser plays generated animation on matching actor/target ID; visual effects never become hit authority |
| Evidence | Recorded cast start, target contact, actual server HP change, miss/blocked if supported, cooldown indicator |

## 5. Example D — New Main Quest scene (`FUTURE CONTENT DRAFT`)

- The quest must reference an actual NPC, board, object, region landmark or instance entrance; asset plan includes at least that world anchor and the manual interaction cue.
- Optional short character portrait dialogue is acceptable; **dialogue alone is not an encounter**.
- Navigation arrives and stops. Human chooses any consequence, and reward preview uses semantic icon art.
- Late-story Phì Đế reveal must have story spoiler metadata preventing early asset loading/exposure.

## 6. Generation package acceptance record (template)

| Checkpoint | State | Evidence |
|---|---|---|
| Source art generated, stored, SHA-256 recorded | NOT_EXECUTED | — |
| Human approves master style/identity | NOT_EXECUTED | — |
| Asset processed into real runtime format | NOT_EXECUTED | — |
| Asset registry/scene and animation references resolve | NOT_EXECUTED | — |
| Gameplay event maps to visual state | NOT_EXECUTED | — |
| Two-browser playtest / world screenshots | NOT_EXECUTED | — |
| Human approves final visible scene | NOT_EXECUTED | — |

Do not transform this template into a claims-of-completion report until the actual future execution has evidence.
