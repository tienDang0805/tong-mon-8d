# Game Lore — Bát Hoang Tu Tiên Giới

> Baseline v0.2 | 2026-10-16 | Canonical identity preserved from `packages/game-data/src/index.ts` and `MASTER_PROMPT.md` (canonical Sections 5–7). New story extensions are labeled.

## The world and its age

**APPROVED**: Bát Hoang Tu Tiên Giới experiences the opening of **Tiên Lộ**. An era of abundant thiên kiêu, unstable powers and rediscovered wonders has begun. The protagonist grows from an ordinary mortal through the **17 playable major realms**, ultimately to **Thánh Cảnh**. An adjacent plane attempts to conquer Bát Hoang, culminating in war across the boundary between planes. Legendary cultivators have stakes in that Main Story; their private True Disciple questlines remain optional.

**APPROVED COSMOLOGY**: Saint realm is the highest *playable realm of this release* but is not metaphysically ultimate. **Đại Thánh**, **Cổ Thần** and trans-plane existence are above the protagonist's playable horizon, reserved for lore/possible future expansion. Do **not** add them as levels of the current 17-realm ladder.

**PROPOSED NAMES ONLY**: “Thiên Kiêu Kỷ Nguyên” (the era), “Hư Tịch Giới” (invading plane), “Tịch Diệt Thánh Quân — Dạ Vô Uyên” (major antagonist). The approved story specifies their *roles* but has not locked these exact names or histories.

## Fixed realm order (17 major cultivation realms + mortal prologue)

Phàm Nhân (pre-cultivation), then:

1. Luyện Khí
2. Trúc Cơ
3. Kim Đan
4. Nguyên Anh
5. Hóa Thần
6. Luyện Hư
7. Hợp Thể
8. Độ Kiếp
9. Bán Tiên
10. Chân Tiên
11. Thái Ất Kim Tiên
12. Đại La Kim Tiên
13. Trảm Nhất Đao
14. Trảm Nhị Đao
15. Trảm Tam Đao
16. Bán Thánh
17. Thánh Cảnh

Realm **labels and order are canon**; Character Level mapping is separately approved in `DECISIONS.md`. Do not mutate canonical `realmId`s in code to fit the new Level system without an explicit migration.

## The 10 Legendary NPCs — fixed identity and current realm

| Stable ID | Identity | Realm | Canonical role/relationships |
|---|---|---|---|
| `phi_de` | **Phì Đế — Đặng Văn Tiến** | Thánh Cảnh | Founder/leader, Ẩm Thực Đại Đạo; cooking or purchasing valid spiritual cuisine grants opportunities; partner of Dẩm Lồn Tiên Tử; bonded to ChatDVT. |
| `rmt_de` | **RMT Đế — Phạm Phan Trọng Khải** | Thánh Cảnh | Wealth/market Dao through **fictional game currency**, never real-money trading. |
| `vaal_de` | **Vaal Đế — Trần Vũ Hoàng Tâm** | Thánh Cảnh | Fate, choices, bounded high-risk in-world trials, not real-currency gambling. |
| `chatdvt` | **ChatDVT** | Thánh Cảnh (Thánh Thú) | Jade-cyan qilin-fox-like quadrupedal spirit beast contracted to Phì Đế; never humanoid generic mage. |
| `dam_lon_tien_tu` | **Dẩm Lồn Tiên Tử** | **UNKNOWN / Bất Minh** | Independent Dao practitioner and Phì Đế's đạo lữ. **Never invent her major realm.** |
| `ngoc_tam` | **Ngọc Tâm — Xui Xẻo Chân Quân** | Bán Thánh | Curses, karmic misfortune and reversal. Distinct from Vaal Đế. |
| `thai_tai` | **Thái Tài** | Bán Thánh | Treasure appraisal and relic provenance, distinct from RMT's wealth Dao. |
| `anh_7` | **Anh 7 — Đoàn Quang Huy** | Bán Thánh | Thất Kiếm master, tactical sword trials. |
| `gia_bao` | **Gia Bảo** | Đại La Kim Tiên | Studies Trảm Đạo; **has not canonically become Trảm Nhất Đao**. |
| `hoa_tran` | **Hòa Trần** | Thái Ất Kim Tiên | Wandering cultivator, exploration and quiet insight. |

**Tam Đế Chi Ước**: Phì Đế + RMT Đế + Vaal Đế are three sworn Dao companions at equal major realm (Saint). Historical alliance and comedic rivalry coexist; none is a subordinate of another.

## Main Story's late-game secret — OWNER APPROVED

**Spoiler intended for writers/agents only**: The Phì Đế whom the protagonist meets in this plane is **an incarnation of Ăn Uống Thiên Tôn**. Revelation comes near the conclusion of the Main Quest as the protagonist learns Saint realm is not the end of existence. **Every player** can uncover this story reveal without becoming Phì Đế's True Disciple. Vạn Vị Đạo Thai players may discover optional contextual clues without gating the reveal for others.

Do not prematurely establish the masked immortal of the Mortal → Luyện Khí prologue as Phì Đế or any other known Legendary; that person's identity is still OPEN.

## Legendary unique-destiny design

Ten and only ten special `Thần Phẩm` destinies correspond one-to-one with these ten NPCs. `phi_de` → **Vạn Vị Đạo Thai** is approved. Names for the other nine are not yet ratified; the designer's catalog candidates can be developed in a dedicated Destiny spec. Owning one prevents ever obtaining any different Legendary-specific signature, whether Tiên Thiên or Hậu Thiên.

Each Legend matters within the Main Story, but each person's six-chapter True Disciple inheritance is a separate, optional quest arc with special conditions and rewards. The old `MASTER_PROMPT.md` six-chapter outlines are *historical candidate material*; preserve interesting story beats, but retrofit the new hard signature eligibility rule and do not force these arcs into Main Quest.

## Antagonist framework (Approved roles, names proposed)

- Mortal/early realms: local beasts, corrupt spirits, minor threats in villages and forests.
- Midgame: rival sects, emerging thiên kiêu, large conflict, inexplicable planar fractures.
- Late-game: incursions from a neighboring plane, divided loyalties, key strategic battles and a supreme NPC antagonist attempting conquest.
- Finale: cross-dimensional battlefield, defense of Bát Hoang, Saint realm journey and revelation of Ăn Uống Thiên Tôn's incarnation.

The proposed invaders should possess motivation and a culture, not merely exist as farm mobs. Individual arcs, villain names and geography require human story review before being declared canon.

## Narrative tone

Xianxia mythic spectacle with humorous, recognizable 8D character voices and sincere personal discovery. Lore reverence without forcing every minor errand into a grand prophecy. No pay-to-win joke mechanized as real payment or dangerous real-money stakes.
