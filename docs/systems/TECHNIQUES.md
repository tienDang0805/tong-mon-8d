# SYS-TECHNIQUES — Công Pháp, Võ Kỹ and Loadout Contracts

> Version: TD-02 draft v0.4 | Owner review pending | Based on Game Design Baseline v0.2 and owner-approved TD-01 direction. This file is **not yet an implementation instruction**.
> Authority: `GD-024`, `GD-030`–`GD-032`, `GD-034`. Numerical slot counts, coefficients and cooldowns are `DESIGN_BASELINE`, not newly owner-approved rules.

## 1. Canonical split — two different kinds of techniques

**Công pháp** is the practitioner's cultivation method. It influences Tu Vi gain, learning/comprehension, base or derived stat passives and cultivation requirements; it is **not** a spammed damage spell. **Võ kỹ** is an executable combat technique (attack, defensive stance, buff, healing, control), possibly with a passive while slotted, and must belong to exactly one of the six martial Dao paths for mastery attribution.

The shared six quality tiers for **both** are `pham`, `linh`, `hoang`, `dia`, `thien`, `than` (Phàm, Linh, Hoàng, Địa, Thiên, Thần). These are different from destiny's four tiers (Phàm, Hoàng, Tiên, Thần). An item's or gear's quality ladder is not automatically these six tiers.

Characters may learn across all six paths. There is **no permanent class lock**. The legacy `discipline = kiem_tu|phap_tu|the_tu` in `CharacterSaveState` is a provisional start style, not this new Dao identity.

## 2. Draft typed definitions (illustrative contracts, no runtime file changes)

```ts
export type TechniqueTier = "pham" | "linh" | "hoang" | "dia" | "thien" | "than";
export type DaoPathId = "kiem" | "dao" | "chi" | "chuong" | "the_tu" | "phap_tu";
export type TechniqueKind = "cong_phap" | "vo_ky";
export type EffectKind = "physical_damage" | "spiritual_damage" | "shield" | "heal" | "buff" | "control";

export interface TechniqueRequirements {
  attributes?: Partial<Record<"the_phach" | "luc_dao" | "linh_tinh" | "than_phap" | "than_thuc" | "ngo_tinh", number>>;
  minDaoStage?: { pathId: DaoPathId; stage: number };
  minRealmId?: string;
  questFlag?: string;
  itemPrerequisiteId?: string;
}

export interface TechniqueEffect {
  kind: EffectKind;
  target: "self" | "single_enemy" | "area_enemies" | "allied_target";
  coefficient?: number;
  maxTargets?: number;
  radiusPx?: number;
  durationMs?: number;
  typedModifierIds?: string[];
}

export interface TechniqueDef {
  id: string;
  kind: TechniqueKind;
  nameVi: string;
  tier: TechniqueTier;
  daoPathId?: DaoPathId;
  requirements: TechniqueRequirements;
  effects: TechniqueEffect[];
  castMs: number;
  cooldownMs: number;
  spiritCost: number;
  rangePx: number;
  animationAssetId: string;
  version: number;
}

export interface KnownTechniqueState {
  techniqueId: string;
  learnedAt: number;
  proficiency: number;
}

export interface TechniqueLoadout {
  mainCultivationMethodId: string | null;
  basicAttackTechniqueId: string | null;
  activeCombatTechniqueIds: string[];
  revision: number;
}
```

Contract details: all IDs reference a validated `TechniqueDef` registry. `daoPathId` must exist for martial damage/control techniques; cultivation methods have **no fake combat path**. In a production schema, use a discriminated union for `cong_phap` versus `vo_ky`, so a Công pháp cannot receive invalid combat-only fields. The flat interface above is an early review sketch.

`EffectKind`, formulas, requirements and VFX references are registry data, never eval'ed text supplied by the client. `minRealmId` is an **optional per-technique rule**, NOT a global rule gating Dao Cảnh based on major realm. A Phàm Nhân can learn eligible basic martial skills; in principle a Luyện Khí can advance a Dao path all the way to 10 through exceptional practice and trials.

## 3. Equipped vs learned — bounded power

- **Owner-approved**: learned skills and methods are collectible, no permanent choice of one of three classes, and equipped active Võ kỹ can provide bounded passive stats.
- **TD-02 candidate**: equip 1 primary Công pháp + 1 basic martial attack + up to **4 active Võ kỹ**; no unlimited simultaneous cultivation methods or martial passives.
- Learning a technique does not automatically give its passive. Only an explicitly authorized `alwaysOnWhenLearned` effect may apply from library ownership; such exemptions should be rare and subject to balance tests.
- Only equipped and currently valid active skills can be scheduled by the Auto Combat Engine (TD-03); auto policy cannot execute unlearned, unslotted, inactive or unaffordable skills.
- `swapLoadout` validates ownership, slot count, duplicates, requirements and combat-safe transitions. Switching to a forbidden loadout must not temporarily stack both sets' passives. Avoid unlimited hot-swapping in active combat; candidate policy is only between encounters or with a bounded penalty.
- A main Công pháp may grant **cultivation-only** effects even when not in combat; it is not itself an auto attack pattern.

## 4. Rarity as design budget rather than universal numeric multiplier

Technique power is encoded through its **authored effect coefficients, costs, cooldowns, target caps and conditional mechanics**. Do **not** multiply damage by a generic `qualityMultiplier` again at runtime: that double-counts rarity if a Thần skill already has higher authored numbers. Proposed orientation for *single-target comparable offensive* techniques, at equivalent character growth:

| Tier | Suggested coefficient band | Additional design budget |
|---|---:|---|
| Phàm | 0.80–1.15 | Simple effect, available early |
| Linh | 1.00–1.40 | Better efficiency or simple utility |
| Hoàng | 1.20–1.70 | Clear specialization, conditional advantage |
| Địa | 1.40–2.00 | Skill combos, stronger status or defensive identity |
| Thiên | 1.60–2.40 | High-performance synergy and demanding cost/requirements |
| Thần | 1.80–2.80 | A distinct, bounded mechanic; rare source |

**These ranges are review-only.** A 2.8x skill with long cast/cooldown may yield less DPS than a faster 1.5x skill; a shield/heal/control technique has no comparable coefficient. Area skills must trade target count and resource cost against single-target burst. Thần techniques are primarily Legendary six-chapter route rewards or exceptionally rare world opportunities, never ordinary town-shop inventory. Non-signature players must still be able to obtain powerful Thần techniques through exceptional **ordinary** game routes.

## 5. Dao-specific martial examples — candidate content, not finalized assets

| Path | Illustration | Primary behavior | Possible tactical identity |
|---|---|---|---|
| Kiếm | `Thanh Vân Trảm` (legacy basic slash name) | Fast close-range physical damage | Single-target sustained attacks |
| Đao | `Liệt Phong Đao` | Arc slash hitting a small cone | Cleave/AOE farming |
| Chỉ | `Phá Huyệt Chỉ` | Precise hit and short debuff | Focused boss damage |
| Chưởng | `Huyền Sơn Chưởng` | Area palm shock and interruption | Crowd control and stagger |
| Thể Tu | `Kim Cương Hộ Thể` | Temporary damage mitigation | Sustain/survival |
| Pháp Tu | `Thanh Lôi Pháp Ấn` | Ranged spiritual AOE | Casting and group farming |

The current repository has `basic_slash` (`J`, 450ms CD, 0 MP), `kiem_khi_ung` (`K`, 2200ms CD, 12 MP), and `ho_the_kim_quang` (`L`, 4000ms CD, 18 MP). Retain these stable IDs as legacy compatibility aliases **until explicit migration**; do not assume their current labels, rarity or Dao mapping are canon. The current type `AttackIntentPayload.skillId` is a 3-member union and the server falls back to `basic_slash` for unknown IDs. Under the new contract **unknown/unlearned skill IDs must fail closed**, not silently turn into free basic attacks.

## 6. Auto combat skill policy — defines inputs, NOT the auto engine

`AutoCombatPolicy` (fully designed in TD-03) may order eligible slotted skills by: target count, minimum enemy HP, available MP, current HP, protection priority, cooldown readiness and player-defined skill priority. It must never bypass costs/cooldowns. Recommend normalized server-scheduled tick with bounded rate and animation timing, independent of browser frame rate.

Example behavior: when surrounded, a slotted Đao area skill may be selected; when low HP, a slotted Thể Tu shield takes priority; when MP is insufficient, a legal basic attack is used. **The player defines the build; the server executes valid combat intent only while online.** Auto farm cannot run with the browser disconnected.

## 7. Skill access and upgrade invariants

- A learned technique must have an explicit acquisition source, requirements, owner and stable ID.
- Confirm prerequisites at learning time **and** when equipping; if a temporary requirement becomes unmet, suspend the skill rather than leaking its passive.
- Skill proficiency tracks its own progress if implemented; **do not conflate it with Dao Cảnh** or Character Level.
- Every applied modifier has a stable `sourceId` and `modifierId` resolved by the TD-01 `Stat Calculation Engine`; effects are removed when source/slot expires.
- Cooldown reduction is bounded (initial candidate `0–30%`), and minimum global interval between valid skill effects candidate **350ms**. No rapid spam exploit through low-tier zero-MP skills.
- Mana, range, line of sight, target life, item consumption and AoE max target count are enforced on server. One AoE effect may hit several enemies, but cannot mint multiple Dao mastery ticks by repeating one attack event.

## 8. Acceptance tests and deferred items

`TECH-01`: invalid technique or missing ownership rejected; no implicit basic slash fallback.  
`TECH-02`: both technique kinds share the exact 6-tier enum; destiny enum stays distinct.  
`TECH-03`: Dao paths are six non-exclusive skill classifications.  
`TECH-04`: a learned but unslotted passive contributes nothing.  
`TECH-05`: equipping/removing/replacing technique removes old modifier exactly once.  
`TECH-06`: zero MP/cooldown/cast animation anti-spam enforced.  
`TECH-07`: area damage never grants more than one Dao credited technique execution.  
`TECH-08`: manual and auto use the same authoritative skill execution path.  
`TECH-09`: requirements cannot be bypassed by forged technique ID/network payload.  
`TECH-10`: non-signature path remains capable of learning an exceptional Thần-tier technique.

**Deferred**: Final four-slot count, technique power bands, production catalog, ultimate Thần mechanics, element/resistance system, exact PvP combat balance, and UI animation/VFX authoring. TD-04 owns item acquisition; TD-05 owns new art generation.
