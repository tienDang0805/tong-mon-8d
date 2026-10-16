# Narrative & Quest Design — Baseline v0.2

> Date: 2026-10-16 | Main quest topology and True Disciple hard prerequisites: APPROVED. Arc titles, full dialogue, antagonists' names and quest content: PROPOSED or pending.

## Canonical narrative separation

1. **Main Quest**: Common across all character builds and destiny rolls. Travels from Phàm Nhân to playable Thánh Cảnh, involves all 10 Legendary NPCs, concludes in cross-dimensional conflict and reveals Ăn Uống Thiên Tôn's incarnation. **No Legendary signature or True Disciple status is needed.**
2. **Side Quests**: Village residents, factions, crafting, commerce, local crises, exploration. Rewards normal RPG progression.
3. **Special Quests**: Rare events, conditional branches, Bí Cảnh discoveries; includes distinct **Legendary True Disciple** questlines.
4. **Daily Quests**: Repeatable authored objectives and bounded rewards.
5. **Town Quest Boards**: Local jobs (hunt, gather, deliver etc.), user must manually accept and turn in.

Player personally activates and resolves quests. Auto-navigation *only travels* to objectives; kill/gather events from legitimate online automation may satisfy objective counters in accepted quests. Major choices remain manual and persisted per character.

## Protagonist Main Quest structure — seven PROPOSED macro arcs

| Arc | Level/realm band (rough) | Shared journey | Major clue |
|---|---|---|---|
| I. Phàm Nhân Vấn Đạo | Mortal/Luyện Khí | Tân Thủ Thôn, forest disturbances, meet **identity-unknown masked immortal**, receive starter công pháp + breakthrough pill; enter cultivation | An omen of the opening Tiên Lộ |
| II. Thiên Kiêu Xuất Thế | Trúc Cơ–Kim Đan | Travel, rivals, beginner sect/faction conflicts, multiple Legendary encounters | Ancient ruins awaken |
| III. Bát Hoang Phong Vân | Nguyên Anh–Luyện Hư | Cross-regional factions and hidden history | Unnatural planar fractures |
| IV. Tiên Lộ Tranh Phong | Hợp Thể–Độ Kiếp | Grand ruins and Tiên Lộ race | Incursion is not accidental |
| V. Chân Tiên Vấn Giới | Bán Tiên–Chân Tiên | Investigate origin, encounter foreign characters | Enemy's survival motive |
| VI. Trảm Đạo Khai Thiên | Thái Ất–Trảm Tam Đao | World-scale mobilization, Legendary actions | A dimensional war is imminent |
| VII. Thánh Nhân Chi Chiến | Bán Thánh–Thánh Cảnh | Cross-dimensional battlefield, supreme antagonist, final defense of Bát Hoang | Phì Đế is an incarnation of **Ăn Uống Thiên Tôn** |

**Only the full-journey premise, 10 main appearances, cross-planar endgame and Phì Đế secret are APPROVED.** Macro arc names, exact realm bands, conflict beats and enemy naming are writer scaffolding awaiting story owner approval. Planned higher-world realms **Đại Thánh / Cổ Thần** remain offscreen lore, not playable.

## Chapter 1 design boundary — Mortal to Luyện Khí

Required invariant: Character starts **Phàm Nhân Lv 1–10**. During Main Quest, user *personally* proceeds through a meaningful encounter with a **hidden immortal of unknown identity**, is granted **a basic cultivation method** and **a breakthrough pill**, completes the event and breakthroughs into **Luyện Khí**. Do not reveal the immortal to be Phì Đế without explicit later approval.

Proposed beat sequence: introduction/character creation → village errand and forest anomaly → legitimate online farming opportunity in Thanh Trúc Lâm → player finds immortal via quest objective (auto navigation may guide only) → choices/dialogue → beginner technique and pill → player activates breakthrough → new Level cap and additional world objectives → Phì Đế ordinary culinary subplot (purchased or cooked dish). End-of-chapter reward/details need authored quest spec; not existing production script.

## The exclusive True Disciple state machine — HARD RULE

`UNBOUND/INELIGIBLE` → `SIGNATURE_OWNED` → `AFFINITY_MET` → `SPECIAL_TRIGGER_MET` → `SPECIAL_QUESTLINE_UNLOCKED` → `ALL_SIX_CHAPTERS_COMPLETED` → `TRUE_DISCIPLE`

The invariant check always starts with **matching one-of-ten signature destiny ownership**. Other gift/affinity/event flags may be accumulated earlier, but may not grant eligibility until signature matches. Questline should fail closed if a reward or save attempts to assign a second Legend signature.

**Chân Truyền is wholly optional**: no ordinary chapter, zone level band, Character Level, realm breakthrough or common quest may require one. Legendary NPCs may show up in universal Main Quest as allies/opponents/advisers regardless of the player's private apprenticeship.

### Phì Đế first detailed Legendary candidate

- Signature: **Vạn Vị Đạo Thai**, uniquely bound to `phi_de`.
- Gifts are the primary means of increasing affection; special events/choices add affinity.
- Special trigger must relate meaningfully to **eating/tasting a breadth of qualifying dishes**, not raw item spamming; **“eat 80 distinct dishes” was a speculative example**, not approved.
- Food can be **bought or cooked**. The rules must avoid disadvantaging non-cooks in the **ordinary** path; the detailed signature path may contain unique tests, but content requirements need separate approval.
- Six-chapter True Disciple arc is exclusive; legacy `Vạn Vị Thành Đạo` chapter currently in repo may be reused as **public introduction** or retrofitted after migration analysis, but do not silently treat an existing one-off blessing quest as completion of the new signature-gated inheritance.
- Divine-tier techniques/skills primarily unlock through or advance within completed Legendary inheritance; do not grant full Saint combat power instantly.

### Ten signature-only lines (framework, not complete story)

| NPC ID | Story flavor | Fully authored? |
|---|---|---|
| `phi_de` | Culinary dao and incarnational mystery | NO — first to detail |
| `rmt_de` | Wealth, fictional economy, artifact strategy | NO |
| `vaal_de` | Fate, bounded risky choices | NO |
| `chatdvt` | Spirit beast bonds, loyalty, protection | NO |
| `dam_lon_tien_tu` | Heart/relationships, independent history; realm UNKNOWN | NO |
| `ngoc_tam` | Misfortune and reversed karma | NO |
| `thai_tai` | Appraisal, hidden treasure histories | NO |
| `anh_7` | Thất Kiếm and sword Dao | NO |
| `gia_bao` | Dao severing, remains Đại La unless explicitly changed | NO |
| `hoa_tran` | Wanderer, enlightenment through journey | NO |

Every line will eventually contain **six distinctive chapters** with NPC dialogue, concrete tasks, growth, reward, meaningful tests and a finale. Do not fabricate all 60 full playable quests in one iteration. Preserve reusable legacy `MASTER_PROMPT` storyline hooks as PROPOSED creative material.

## Generic condition/quest definitions (requirements for technical phase)

Suggested stable trigger kinds: `hasDestiny`, `affinityAtLeast`, `realmAtLeast`, `characterLevelAtLeast`, `daoMasteryAtLeast`, `hasItem`, `foodCatalogCountAtLeast`, `hasAchievement`, `questState`, `hasFlag`, `visitedZone`, `storyChoice`. Effects: `setFlag`, `advanceQuest`, `awardItem`, `grantExp`, `grantTuVi`, `grantHauThien`, `modifyAffinity`, `unlockZone`, `unlockTechnique`.

Conditions are **declarative and composable** (AND/OR/NOT) and evaluated on server; no per-NPC `if` spaghetti. Stable `npcId`, `questId`, `traitId`, `zoneId`, `itemId`, transaction id and `characterId` for save migration, replay and reward idempotence.

## Multiplayer narrative rules

Shared monsters, visuals and world events may serve players simultaneously, while **quest acceptance, dialogue options, reputation, legendary signature, consequence flags and chapters belong to each individual character**. Party contributions require explicit quest rules. One player cannot advance another's exclusive True Disciple path just by joining their combat room.

## Spoiler handling

The masked immortal's identity is OPEN; Ăn Uống Thiên Tôn twist is APPROVED LATE-GAME SPOILER. Public early NPC interaction should not casually spoil it. A player without Phì Đế signature still receives the universal reveal.
