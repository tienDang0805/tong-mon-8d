# TD-04 — Repository Impact, Migration, Validation and Exploit Tests

> v0.6 | **DOCS-ONLY DESIGN**. The repository state reviewed is Game Design Baseline `master@d4e6e17`, the existing Phaser 4.2.1 + Colyseus 0.18.x prototype. No source code or production data has been altered.

## 1. Observed prototype implementation gaps

| Actual module | What code currently implements | Migration impact / danger |
|---|---|---|
| `packages/shared/src/index.ts` | Two `ZoneId`s, 3 fixed `CombatDisciplineId`s; `QuestProgressState` only progress status/step/count; `CharacterSaveState` includes simple inventory/reputation | New registry IDs & quest/version data need opt-in versioned types. Legacy request payloads must not be accepted as proof of item, quest or trait grant. |
| `packages/game-data/src/index.ts` | Canonical 17 realms/10 Legends, existing two zones, basic SKILLS/ITEMS/RECIPES/MONSTERS/QUEST registry, 2 monster types, public food quest | Introduce versioned content registries without rewriting canonical IDs. Proposed new map/quest/food is NOT already present. |
| `apps/server/src/worldEngine.ts` `handleAttackIntent` | On kill loops every loot entry and awards `entry.minQty` directly; ALSO spawns a claimable `GroundLootSnapshot` | Potential duplicated awards; replace with **one** `LootRoll` + XOR direct/ground `LootDelivery`; per-event ledger; proper RNG probability; avoid replacing combat code in TD-04 docs pass. |
| `apps/server/src/worldEngine.ts` `handlePickupDrop` | Checks drop exists and player distance; **does not validate `ownerCharacterId`** | Must reject unentitled players and replay/expiry, ensure atomic pickup before inventory grant. |
| `apps/server/src/worldEngine.ts` quest submit | Public food quest gives reputation/blessing and sets `equippedInheritance="phi_de"` | Legacy equipped inheritance **NOT Chân Truyền status**. Preserve public reward, isolate private route/status migration. |
| `apps/server/src/db.ts` | Accounts/characters, JSONB inventory/reputation/quests/buffs, idempotency/economy logs, save via broad upsert | Add migrations with backups, transactional grant/ledger, unique indexes per source event and per food discovery; avoid rolling partial effects on retry. Existing unique `account_id` character behavior cannot be silently overridden. |
| `maps/tan_thu_thon.tmj`, `maps/thanh_truc_lam.tmj` | Actual 32px maps and authored existing portals | Map/location IDs may require Tiled object metadata migrations only after TD-05 layout review; do not invent coordinate URLs or overwrite map files. |
| `assets/` and `.agents/skills/` | AI source+placeholder mixed visual state and `ai-art-production` policy | TD-04 produces references/asset briefs, never final replacement art; TD-05 controls generation, provenance, creative approval. |

## 2. Safe order of implementation (after full Design Freeze, NOT now)

1. Read-only backup: DB schema+rows (accounts, characters, JSONB snapshots, quests, buffs, inventory), current content manifests/maps and baseline checksum. Stage migration in copy of PGlite DB; support external PG separately.
2. Implement TD-01 identity/Character/Level/Destiny storage migration first; do not fabricate old immutable Tiên Thiên. Owner-approved option: old character can remain in `LEGACY_VIEW_ONLY`/fresh v0.2 character flow; do not silently reset or replace player state.
3. Implement TD-02 combat single server hit/kill resolution and stable `killEventId` before reward/loot migration.
4. Integrate TD-03 scheduler, objective-credit bus, manual quest accept/submission and zero-offline farm semantics.
5. Introduce TD-04 typed content registries and validated `RewardTableDef`, condition evaluator, loot XOR, food discovery, affinity, zone-object bridge in small tasks — **not one giant replacement**.
6. TD-05 author/source approved tilesets, VFX, NPC sprites and real Tiled integration; take real screenshots/playtests to release the first content pack.
7. Validate roll-back by restoring backups; verify old `phi_de_ch1_huong_thom` completion cannot mint new private line, duplicate food discovery or repeated loot.

## 3. Transactions and persistent uniqueness

At minimum require unique durable keys:

- kill: `(zoneInstanceId, spawnInstanceId, spawnGeneration)` death ordinal within an authoritative monster life; not client chosen.
- individual entitlement: `(killEventId, characterId, rewardKind/rollIndex)`.
- loot roll/delivery: `rollId`; pickup: single-use `pickupId` and owner/expiry/range validation.
- quest objective credit: `(characterId, acceptanceId, objectiveId, sourceEventId)` (TD-03).
- quest reward: `(characterId, acceptanceId, manualSubmissionEventId)` with state transition guard.
- food discovery: `(characterId, foodCatalogId)`.
- manual NPC gift: `giftEventId` / `(characterId,npcId,manualActionRequestId)`.
- daily: `(characterId,questId,periodKey)`.
- protected signature ownership: TD-01 one-of-ten check performed within same database transaction as trait grant (not just a UI disabled button).

**Atomicity:** a successful claim persists balance/inventory deltas, source-ledger entries, quest/trait/food counters and state revision in one transaction or documented durable outbox. Broad `saveCharacterState()` replacing JSONB arrays without optimistic revision/locking can lose updates under concurrent rooms; this is a concrete migration risk. No assumption that `checkIdempotency` then separate `recordIdempotency` without transaction is sufficient under concurrency.

## 4. Security, abuse & network checks

- Server-authenticate account/character; source currently accepts account nickname/guest strings and does not prove identity robustly. Do not award from client-reported kill/quest/event, gift preference, invented location or content ID.
- Only owner of ground drop can pick up during reserved window; party mode requires explicit grant metadata, not an unverified party ID.
- No passive acquisition from old quest titles or avatar image. Check signature on server even if currently unequipped.
- Never double-count food from `obtain` and `taste`; they are distinct authored events. Raw inventory stack counts never equal unique cuisine discoveries.
- No secret location/antagonist dialog/Phì Đế spoiler in unauthorized content registry projections.
- Validate per-user content input UTF-8/length, reject unknown condition types; JSON content is data not JavaScript evaluation; no external network/API fetch to install new content implicitly.
- Two connected browser windows see same monster death/HP, but two sessions controlling one character cannot claim separate rewards (TD-03 controller epoch).
- Downtime and disconnect never earn EXP/Dao XP/loot/quest kill credit; bế quan remains separate capped TD-01/03 policy.

## 5. Acceptance test matrix

| Test | Scenario | Expected |
|---|---|---|
| T4-001 | Spawned enemy dies and loot mode direct | Only inventory grant, no claimable drop |
| T4-002 | Spawned enemy dies and loot mode ground | Ground entitlement only; one inventory grant after authorized pickup |
| T4-003 | Wrong character tries to pick another character's loot | Rejected; remains claimable for owner |
| T4-004 | Two client tabs/replay two events for same kill/quest/daily | Exactly once rewards; one-controller semantics |
| T4-005 | `chance=0` and `chance=1` loot entries | Never/always rolled respectively; quantity within bounds |
| T4-006 | Character Level10 stuck at Phàm realm; valid online kill | No Character EXP; legitimate other rewards still apply |
| T4-007 | Same cuisine bought and cooked | One discovery, equal public-food-quest eligibility |
| T4-008 | 99 same food units obtained | Catalog unique discovery count remains 1 |
| T4-009 | Wrong Legendary trait and max affinity | No private six-chapter route |
| T4-010 | Hậu Thiên matching signature owned but unequipped | Eligible for signature predicate; still must clear other gates |
| T4-011 | Five private chapters plus public food quest completed | Not Chân Truyền |
| T4-012 | Main Quest traversal to Thánh Cảnh without any legendary trait | All public gates reachable and satisfiable |
| T4-013 | Locked secret portal route selected | No auto-pass or coordinates revealed |
| T4-014 | Accepted quest `visit` goal, server arrival | Eligible `visit` event once; no `talk`, `submit` or other credit |
| T4-015 | Manual NPC gift repeated with identical requestId | One item consumed and one affinity grant |
| T4-016 | Daily quest ready 23:59 and next reset | Prior claim preserved per proposed policy, no extra prior-period credit |
| T4-017 | Proposed dish/zone content pack marked DRAFT | Cannot load as public released content |
| T4-018 | Unknown item/equipment modifier ID | Reject; no unchecked stat change/heal from toggle |
| T4-019 | Two players fight single world monster | One death, eligible personal grants per approved party rule, no duplicate shared item |
| T4-020 | Owner-approved art absent | Content validation reports missing art/release gate, never marks HUMAN_APPROVED |
| T4-021 | Manual Main Quest Lv10 masked mentor interaction | Correct method/pill/story flag, does not reveal mentor identity or auto break realm |
| T4-022 | NPC public branch gives `equippedInheritance` legacy string | No server True Disciple status or protected signature minted |
| T4-023 | `main` quest has transitive condition `has_owned_destiny(legendary)` | Content registry validation fails |
| T4-024 | Alternate 6 martial Dao IDs or 7th technique rarity | Content registry validation fails |

## 6. Evidence requirements (later coding)

Unit/contract tests, seeded drop RNG property tests, PGlite/PG concurrency tests, server two-browser integration, safe backups/restores, `npm run verify:assets`, `npm test`, `npm run typecheck`, `npm run build` and real browser gameplay screenshots. TD-04 alone provides only **design-level reference checks**; it cannot claim these tests have passed on the app.
