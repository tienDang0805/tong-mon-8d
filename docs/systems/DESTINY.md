# SYS-DESTINY — Tiên Thiên, Hậu Thiên, Signature & Ownership Invariants

> TD-01 • Technical design proposal v0.3 • **REVIEW_REQUIRED**  
> Existing design law from `docs/DECISIONS.md`: `GD-010..018`, `GD-015..016`, `GD-027`, `GD-041`, `GD-045`. Distinguish approved structure from the proposed catalog/balance below.

## 1. Five non-negotiable constraints

1. Character creation produces **exactly three Tiên Thiên** together. Reroll **the entire set**, unlimited times and without locking one slot. No paywall, no daily reroll quota.
2. After the player confirms the character, those **three Tiên Thiên are immutable**. Server rejects edits, swaps, deletes, item trades that affect immutable innate slots, or a second creation confirmation.
3. Hậu Thiên traits are collectibles; a character may own many but has **three activation slots**. `0..3` may be occupied when fewer are owned; never assume the player must begin with all three filled.
4. Exactly **10 Legendary-specific signature** trait IDs exist, each tied to one canonical legendary NPC. A character may **own no more than one distinct Legendary signature across ALL sources** (innate, acquired, quest, item, restore, admin grant, future trade, etc.). Generic Thần Phẩm traits do not count toward this exclusion.
5. True Disciple eligibility checks **ownership** of the correct signature, whether Tiên Thiên or Hậu Thiên **and whether Hậu Thiên is currently equipped or not**. The complete order is signature ownership → affinity → special trigger → unlock full exclusive questline → finish all six chapters → status. Ordinary NPC content and main story require no signature.

Phì Đế's ONLY currently approved signature name: **Vạn Vị Đạo Thai**. The nine other signature names/effects should remain `PROPOSED` until approved. Phì Đế food-trigger count is **UNRESOLVED** pending a substantial Food Catalog; 80 dishes or all dishes are NOT canonical requirements.

## 2. Suggested typed domain model

```ts
export type DestinyRarity = "pham" | "hoang" | "tien" | "than";
export type DestinyKind = "ordinary" | "legendary_signature";

export interface DestinyDefinition {
  id: string;
  displayNameVi: string;
  rarity: DestinyRarity;
  kind: DestinyKind;
  legendaryNpcId: string | null;
  modifiers: StatModifierDefinition[];
  specialEffects: SpecialEffectDefinition[];
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
```

`innate` exists in persisted `DestinyCollection` **only for confirmed characters**; keep rolls in a separate transient `DestinyRollDraft` (server-managed, expiring and bound to a session/account). Never persist an empty `innate` array into an active gameplay character. Activation slots contain IDs drawn from `acquiredTraitIds`, cannot duplicate an ID, and need not contain the signature for apprentice eligibility.

**Canonical trait ownership:** `owned = set(innate) UNION set(acquiredTraitIds)`. UI inventory and equipped state are projections, not independent truth. Reject duplicate acquisitions unless an authored duplicate-reward conversion policy exists.

## 3. Roll weights — delegated numeric baseline

Per slot before constraints:

| Tier | Probability |
|---|---:|
| Phàm | 50% |
| Hoàng | 30% |
| Tiên | 15% |
| Thần | 5% |

Inside Thần result: 60% Legendary category / 40% generic Thần category. One of 10 signature IDs is selected uniformly among signature definitions for that group **for now**, while generic Thần selects from the actually approved catalog; do not invent unpublished trait records merely to fill probabilities.

### Constraint-preserving roll algorithm — baseline

- Draw three independent weighted candidate traits, each chosen only from known, available registry IDs.
- Reject the **whole three-slot candidate** and redraw whenever any `traitId` is repeated or when more than one slot is a Legendary signature. Rejection sampling preserves the intended **conditional distribution** given valid sets. Do **not** keep a lucky previously rolled slot; no locked slots.
- Use a bounded attempt count (e.g., 100 attempts), with a controlled internal error if the registry cannot produce valid triples. Client must not control RNG seed or supply results.
- With independent unconstrained slots, approximate probability for at least one Legendary category is `1 - (1 - 0.05×0.60)^3 ≈ 8.73%`; one specific signature roughly `1 - (1 - 0.003)^3 ≈ 0.897%`. The actual validated-set distribution **must be simulated after constraints**; these are NOT exact production rates.
- The unlimited reroll loop is fun-first: no cost, no hard daily quota, and server may apply only reasonable anti-abuse request-rate limits against floods/DoS without converting this into a paid/limited mechanic.

Creation state machine: `DRAFT → ROLLED → DRAFT_REROLLED (any times) → CONFIRMED`. Confirm accepts an opaque server-authored `rollNonce`, verifies it belongs to session/account, is unexpired and unconsumed, validates uniqueness, writes identity + three innate traits atomically, and invalidates all draft results. Network timeout/retry returns the same persisted confirmed character rather than generating another set.

## 4. Hậu Thiên acquisition and equipped slots

Example Hậu Thiên reward sources: authored achievements, exceptional adventures, Dao stage 10, deep culinary accomplishments, rare quest outcomes. **Only explicit content definitions** may grant traits, never generic `kill X → random protected signature` reward tables.

- `acquireTrait` checks trait exists, grant policy, source-specific conditions and no duplicate ID.
- If `kind=legendary_signature`, calculate all owned signatures over innate+acquired. If a **different** signature is already owned, reject acquisition atomically (`SIGNATURE_CONFLICT`). If same ID is owned, treat as duplicate (`ALREADY_OWNED`). The grant policy may later define an authored non-signature compensation but must not silently replace one special destiny with another.
- `equipAcquiredTrait(slot, traitId)` validates `slot ∈ {0,1,2}`, ownership, duplication across other slots, skill restrictions if authored, and writes collection revision atomically.
- `unequipAcquiredTrait(slot)` leaves acquired ownership intact.
- Passive stat computation reads `innate` always + `activeAcquiredSlots` only. Gifting, questing and True Disciple checks read **owned**, not equipped.

### Trait source and effect safety

Trait definitions use typed modifiers/special effects. A Divine signature may have unique mechanics (e.g., culinary opportunity tracking for **Vạn Vị Đạo Thai**) without becoming a simplistic `+1000% damage`. The four destiny tiers are **not** the six tiers of Công pháp/Võ kỹ and do not automatically decide equipment quality. TD-01 defines modifier taxonomy; precise trait effects and catalog belong to TD-04.

## 5. NPC True Disciple projection (not full quest engine)

```ts
export interface LegendaryApprenticeshipProgress {
  npcId: string;
  exclusiveQuestlineUnlocked: boolean;
  completedChapterIds: string[];
  trueDiscipleGrantedAtMs: number | null;
}
```

Eligibility order must be evaluated in server quest conditions, with prerequisite signature ownership regardless of slot activation. Affinity and trigger achievements may be accumulated earlier, but **unlock** must not happen until signature is held. Completing the entire authored six-chapter questline grants True Disciple once; no shortcut via `equippedInheritance` or affinity threshold alone.

**Migration hazard:** old `apps/server/src/worldEngine.ts` completes a public Phì Đế dish quest and sets `equippedInheritance="phi_de"` without verifying signature. Under v0.2 this **must not imply** True Disciple. Preserve any public food blessing and historical quest progress; migrate `equippedInheritance` semantics to a cosmetic/provisional legacy flag or other explicit grandfathering policy after approval. `NARRATIVE_DESIGN.md` allows old chapter 1 to become a public introduction, not proof of the full six chapters.

## 6. Persistence and integrity

- `destiny_roll_drafts`: temporary, TTL expiry, bound to authenticated account and creationId.
- `character_destiny`: character key; confirmed innate triple; immutable confirmation timestamp; collection revision.
- `character_acquired_destiny`: one row per `(character_id, trait_id)`, with awarded source and idempotency key; no signature collision allowed.
- `character_active_destiny_slots`: `(character_id, slot_index)` unique, slot indices 0..2; FK to owned acquired trait; one trait cannot occupy two active slots.
- Model **server-side one-of-ten signature exclusion** with a serialized per-character mutation/DB lock or unique partial owner key for signature category; checking then updating without transaction is race-prone.
- The trait registry provides stable IDs; once saved, rebalancing effects must use versioned catalog and player migration rules. Deleting a catalog ID must not orphan existing saves.

Exact normalized SQL is deliberately deferred to implementation migration review; the tables above express invariants, not an instruction to rewrite the DB instantly.

## 7. Acceptance tests

`DES-01` Roll returns exactly 3 unique IDs, no more than 1 signature.  
`DES-02` Unlimited whole-set rerolls, no sub-slot lock or cost.  
`DES-03` Server rejects forged client-supplied traits or invalid roll nonce.  
`DES-04` Confirmed innate triple persists identically through reconnect/restart; cannot reroll again.  
`DES-05` 0–3 acquired slots, cannot equip unowned traits or one trait twice.  
`DES-06` Equip/unequip affects stats once, not ownership.  
`DES-07` Signature owned in Hậu Thiên but unequipped **counts for True Disciple gate**.  
`DES-08` Any grant of a second distinct signature rejected, including simultaneous requests from quest + achievement.  
`DES-09` Generic Thần Phẩm traits can coexist with a signature.  
`DES-10` Phì Đế public quest works without Vạn Vị Đạo Thai and does NOT confer Chân Truyền.  
`DES-11` Six complete exclusive chapters and all prerequisites are required for Chân Truyền.  
`DES-12` Simulate 1 million roll batches (using a seeded test RNG) to verify empirical adjusted rates, no duplicates/conflicts, and sanity of expected player rerolls.

## 8. Explicitly unresolved / next design owner

- Names and behaviors for nine Legendary signatures and 15–20 generic Thần Phẩm traits.
- Exact food-related special trigger for Phì Đế (must follow Food Catalog).
- Full affinity score scale, gifts, special events, six-chapter rewards (TD-04).
- Catalog data migration for existing accounts after confirming current deployment practices.
