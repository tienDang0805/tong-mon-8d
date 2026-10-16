# Game Design — Systems Blueprint v0.2

> Date: 2026-10-16 | Scope: game-mechanics overview and interfaces between systems. **Not yet an approved numeric balancing specification.** See `DECISIONS.md` for ratified constraints and delegated baseline values.

## 1. Core player loop and separation of responsibility

Character creation (three immutable innate destinies) → player chooses main/side quest, region, technique loadout and consumables → **online** Auto Farm yields verified loot and Character/Dao EXP → player manually turns in quests, explores, gifts and chooses story responses → bế quan/cultivation provides Tu Vi → realm breakthrough opens a new Level cap/map band → better techniques/equipment/Hậu Thiên shape build → repeat. Optional Legendary True Disciple paths do not gate this loop.

The server is authoritative on position, target validity, combat, EXP, inventory, rolls, traits, quest state, favor, maps and reward idempotency. Client controls presentation and sends intents. Auto-navigation is movement assistance only; no quest completion automation.

## 2. Progression: two primary bars and six independent masteries

### Character Level vs realm

- Phàm Nhân: **Lv 1–10** (main-story breakthrough at cap).
- Seventeen major cultivation realms, exactly **20 Character Levels per major realm** (Lv 11–350); Saint Lv **351+** with escalating experience, no new playable major realm.
- Every **level-up grants exactly one freely allocatable point into a base attribute**. Character EXP is earned via gameplay (primarily valid monster combat and quests); **Tu Vi** is a separate resource for cultivation and breakthrough.
- Reaching the current realm's Character-Level cap blocks further level ups until breakthrough. It must not disable quests, farming, Dao mastery or inventory actions. Overflow rules to be simulated and approved later.
- Realm-stage progression (existing code has minor stages) multiplies/scales **base-derived stats**, but must not simply double-count Level power. Exact coefficients and stage-to-Level mapping are pending.

| Realm | Levels | Realm | Levels |
|---|---:|---|---:|
| Phàm Nhân | 1–10 | Luyện Khí | 11–30 |
| Trúc Cơ | 31–50 | Kim Đan | 51–70 |
| Nguyên Anh | 71–90 | Hóa Thần | 91–110 |
| Luyện Hư | 111–130 | Hợp Thể | 131–150 |
| Độ Kiếp | 151–170 | Bán Tiên | 171–190 |
| Chân Tiên | 191–210 | Thái Ất Kim Tiên | 211–230 |
| Đại La Kim Tiên | 231–250 | Trảm Nhất Đao | 251–270 |
| Trảm Nhị Đao | 271–290 | Trảm Tam Đao | 291–310 |
| Bán Thánh | 311–330 | Thánh Cảnh | 331–350, then 351+ |

### Six base stats (delegated DESIGN_BASELINE)

| Stat | Primary role | Representative derived stats |
|---|---|---|
| **Thể Phách** | Constitution | Max HP, physical sustain/defense |
| **Lực Đạo** | Physical force | Physical attack |
| **Linh Tính** | Spirit aptitude | Max MP/Linh Lực, magical attack |
| **Thân Pháp** | Agility | Move/attack execution, dodge eligibility |
| **Thần Thức** | Spirit perception | Magical accuracy, status resistance/perception |
| **Ngộ Tính** | Comprehension | Cultivation/manual comprehension & Dao practice efficiency |

**Proposed modifier pipeline**, subject to simulation:

`CoreStat = (OriginBase + AllocatedFromLevel + EarnedPermanent) × RealmStageFactor`

`EffectiveStat = (CoreStat + ValidFlatBonuses) × (1 + BoundedPercentBonuses)`

Then derive HP/MP, physical/spiritual ATK and DEF, crit/evasion etc. Define deterministic order, snapshot semantics, per-bucket caps, active-buff expiry and server recomputation. **Never** mutate and persist accumulated final ATK through ad hoc events; persist source factors and rederive safely, keeping dynamic current HP/MP separately.

### Dao mastery is NOT a cultivation realm

Six independent paths: **Kiếm, Đao, Chỉ, Chưởng, Thể Tu, Pháp Tu**. Each: 10 Dao stages. Even a Luyện Khí character **may** in principle master Kiếm Đạo to 10, but must meet extremely high requirements and complete trials. Do not hard-gate Dao stage by major cultivation realm.

| Dao stage | Candidate label | State |
|---|---|---|
| 1 | Sơ Thức | PROPOSED NAME |
| 2 | Nhập Môn | PROPOSED NAME |
| 3 | Tiểu Thành | PROPOSED NAME |
| 4 | Đại Thành | PROPOSED NAME |
| 5 | Viên Mãn | PROPOSED NAME |
| 6 | Hóa Cảnh | PROPOSED NAME |
| 7 | Nhập Ý | PROPOSED NAME |
| 8 | Thông Huyền | PROPOSED NAME |
| 9 | Quy Nhất | PROPOSED NAME |
| 10 | Chứng Đạo | PROPOSED NAME |

Advance **3→4, 6→7, 9→10** only after a path-appropriate Bí Cảnh test (combat or point-and-click); EXP alone never grants these breakthroughs. Valid skill use on eligible monsters, training, rare pills and adventures gain Dao EXP. Higher mastery levels require much more practice and stronger or more effective technique quality; weak Phàm skills should become inefficient but **not categorically illegal**.

Stage 10 yields a remarkable path achievement; **Kiếm Đạo 10 → Kiếm Tiên** plus an acquired destiny reward (approved concept, precise effect pending). Names of other five capstone titles are PROPOSED. Trials should test mastery/strategy, not merely a raw Realm stat check.

## 3. Destiny system — one persistent identity, selectable power

- Three **Tiên Thiên** roll together, reroll whole set infinitely, cannot lock sub-slots, immutable on confirmation.
- 4 quality tiers: Phàm / Hoàng / Tiên / Thần. Per-slot rarity DESIGN_BASELINE `50/30/15/5`; Thần subgroup split candidate `60%` Legendary signatures and `40%` general; simulate collision-adjusted probabilities.
- Many **Hậu Thiên** may be unlocked; exactly **3 active Hậu Thiên slots**. Store `ownedTraitIds` independently of `activeTraitIds`.
- **One-of-ten Legendary constraint** across *all acquired and innate traits*, enforced transactionally on server, reward engines, account restore and trades. `Vạn Vị Đạo Thai` binds to `phi_de`.
- Signature ownership satisfies only the *first prerequisite* of a Legendary questline; favor, special trigger, full six-chapter completion required. No bonus can silently grant another signature. Any invalid second-signature grant must be rejected or replaced through an explicitly authored alternate reward.
- Generic god-tier destinies (combat, defense, cultivation, alchemy, cooking, exploration...) are distinct from ten protected Legendary signatures; exact catalog and effects pending.

## 4. Techniques and combat disciplines

Two systems, both quality **Phàm, Linh, Hoàng, Địa, Thiên, Thần**:

| | Công pháp | Võ kỹ |
|---|---|---|
| Purpose | Cultivation methods | Active combat skill, may include equipped passive |
| Core effects | Stat modifiers, Tu Vi gain, cultivation effectiveness | Damage/healing/defense/status effects; optional passive |
| Learn requirements | Stats and/or realm/story/other conditions | Stats and path-specific Dao mastery; optional story/equipment requirement |
| Mastery | Technique comprehension/proficiency (separate from Dao Cảnh) | Skill proficiency + contribution to corresponding Dao mastery |
| Loadout rule (DESIGN_BASELINE) | One active main cultivation method to prevent unbounded passive stacking | Finite active skill slots; passives apply only when equipped unless explicitly exempt |

A character can study multiple martial paths and learn many techniques. Six paths are **mastery classifications**, not six permanently exclusive character classes. Technique rarity influences effectiveness and sophistication, but overpowered passive multiplication must be capped. Thần-quality technique is chiefly a Chân Truyền reward or exceedingly rare extraordinary opportunity.

## 5. Combat baseline (requires simulation before code)

Potential damage categories: physical and spiritual; advanced dual-type skills later. Proposed foundation:

`RawDamage = EffectiveAttack × SkillCoefficient × (100 / (100 + TargetDefense))`

Apply **bounded** crit, penetration, buffs and relevant realm suppression in an explicitly ordered pipeline. Server decides hit, damage, HP, cooldown, costs, kill, reward. Phaser shows animation/VFX/interpolation. Do not introduce a universal, undocumented additive `CombatPower` multiplier.

### Threat tiers and map balance

Zone monsters have **fixed realm and stat bands**. Tune common threats around a cohesive **Tiên Phẩm** representative build at target realm/Level:

| Representative build | Intended encounter feel | Numeric baseline (illustrative only) |
|---|---|---:|
| Phàm-quality overall | Very difficult / poor farm efficiency | ~45% of Tier target |
| Hoàng-quality overall | Hard; costly healing | ~70% |
| Tiên-quality overall | Viable with noticeable risk | 100% |
| Thần-quality overall | More comfortable, better efficiency | ~140% |

This is **not** an automatic average of item rarities. Evaluate time-to-kill, death rate, potion cost, rewards/hour for multiple builds. A Luyện Khí normally cannot auto-farm Trúc Cơ monsters; over-realm victories are reserved for exceptional item/skill/consumable/team advantages. Use scalable realm-suppression curves, not binary `realm < mobRealm ⇒ zero damage`.

## 6. Online AFK Engine — bounded autonomy

- **Auto Farm online only**: target search in chosen valid zone, movement/attack pattern, server-validated skill cooldown/MP, medicine thresholds, loot capture and repeated combat. Stop on disconnect/presence expiry; reconnect cannot double-award.
- **Auto Navigation**: compute path to tracked quest NPC/point within authorized zone graph, switch zone only through valid portals, stop at destination, no interaction/quest auto-hand-in.
- **Quest**: player manually accepts, selects quest and critical dialogue, interacts, submits objectives/rewards. Kill credits earned through legitimate auto combat count for an already active mission. `Q` toggles full journal.
- **Bế Quan**: is an alternate selected activity providing Tu Vi; existing server has offline meditation capped ≤8 hours. **No online/offline triple-dipping** with combat farm. Offline eligibility and tracking are separate technical work.
- **No autoplay for important point-and-click story decisions**. Point-and-click Bí Cảnh and combat Bí Cảnh have explicit completion logic; combat instances can automate skills, but player makes consequential navigation/choice decisions.

## 7. Equipment, item and economy contracts (initial data model goals)

Equipment categories DESIGN_BASELINE: head, robe/body, weapon, defensive/offhand/artefact, footwear, accessory. Each has `id`, slot, quality, requirements, stat modifiers, restrictions, source, icon/sprite reference. Do not assume equipment uses destiny's 4-tier quality scheme: settle the equipment quality ladder separately.

Item groups: consumables HP/MP, pills (EXP/Tu Vi/breakthrough/Dao cultivation), food/spiritual dishes, gathering materials, equipment, manual/tome, quest items, special inheritance tokens and currencies. Type-driven effects and transactionally enforced stack/consume/gift/trade rules. Standard food buffs must be bounded; inherited historical candidate has one meal + one beverage + one pill buff slot, pending detailed design.

RMT Đế's economy uses **earned fictional Linh Thạch** only. Vaal events use fictional in-game systems and must not require real-world gambling. No real-money payments. Party and reward calculations need ownership/idempotency and exploit protections.

## 8. Achievement & Hậu Thiên reward framework

Data-driven achievement definitions: qualifying kill counts, first breakthroughs, reaching Dao 10 and passing trials, cooking/trying unique dishes, clearing instances and exploring relevant world milestones. Award an explicit item, title, stat unlock, recipe or acquired destiny; not every achievement must grant a destiny. Server tracks persistent counters and event deduplication. One-of-ten Legendary signatures may not be granted through generic achievement tables.

Sample candidate achievements: `Sát Phạt Chi Tâm`, `Bách Chiến Bất Khuất`, `Kiếm Tiên`, `Đan Đạo Sơ Thành`, `Thiên Địa Thực Khách`, `Bế Quan Khổ Tu`, `Bí Cảnh Hành Giả`. All numeric thresholds and Hậu Thiên identity/rewards remain **PROPOSED**.

## 9. Affinity and True Disciple

Affinity rises **chiefly via gifts**; special events and player decisions also contribute. Each NPC has preferences, diminishing/limited repeated gifts (exact threshold DESIGN_BASELINE), and milestone dialogues. Affinity is not sufficient for signature-gated quests. For Phì Đế, ordinary buying/cooking/eating, event participation and relationship are available to all; his exclusive arc requires **Vạn Vị Đạo Thai**, affinity, a special food-related achievement trigger and a full six-chapter questline. The sample “eat 80 dishes” is **not locked** until Food Catalog supports the design.

### Boundary between existing prototype and new design

Current `packages/game-data` and `apps/server` represent an earlier 3-style manual action prototype, legacy Level/realm rules and an old Phì Đế chapter. These are migration targets, not evidence this new blueprint is implemented. Phase 1B.0 is a **docs-only** baseline. Author technical specifications before changing the data model or persistence.
