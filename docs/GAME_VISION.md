# Game Vision — Tông Môn 8D: Tu Tiên Chi Lộ

> Baseline v0.2 | 2026-10-16 | Status: OWNER-APPROVED OVERALL VISION; details need technical validation.

## Elevator pitch

A browser-playable **2D pixel-art online AFK cultivation RPG** for friends in **Bát Hoang Tu Tiên Giới**. Every player starts as a mortal with three rolled immutable innate destinies; decides what to farm, which Dao arts to master, how to build stats/skills/gear, whom to befriend and which quests to pursue. **Combat farming is automated while connected**, but exploration decisions, quest interactions and story consequences belong to the player. Players share a world yet follow distinct optional Legendary inheritance paths.

## Four experiential pillars

1. **A living illustrated world**: real Phaser playfield, Tiled zones, recognizable landmarks, animated players/NPCs/monsters, readable combat and in-world interactions; never a dashboard pretending to be an RPG.
2. **AFK tactical preparation**: equip techniques, set skill priority and healing policy, select appropriate zone; watch server-authoritative auto battles and obtain truthful EXP, Dao mastery and loot **while online**.
3. **Two progressions plus Dao mastery**: independent Character EXP/Level and Tu Vi/realm breakthrough, plus six independent 10-stage martial-mastery paths, gear, consumables, cooking and acquired destinies.
4. **A long narrative plus optional destinies**: one all-access Main Quest from Mortal to playable Saint, ten world-shaping Legends and ten signature-gated True Disciple side routes with six chapters apiece.

## Player fantasy and loops

- **2–5-minute check-in**: inspect inventory/EXP/quest, spend free attribute points, give a gift, configure a plan, claim *eligible* offline meditation reward.
- **15–60-minute connected AFK session**: select zone, activate auto-farm, level up, improve Dao skill, collect food ingredients, tune consumables, explore manually or auto-navigate to known quest objectives.
- **20–45-minute co-op session**: share a region with friends, party/fight a boss, tackle combat instance, compare build efficiency, trade legitimate items or complete separate quest objectives.
- **Long horizon**: realm breakthroughs, higher-quality techniques, rare Hậu Thiên, harder zones, story reveals and optional Legendary True Disciple progress.

## Agency boundary — especially important

**AUTO**: target acquisition, combat skill pattern, legitimate loot collection during live session; navigation to tracked quest place; eligibility-safe meditation time computation.

**MANUAL**: quest acquisition, dialogue, interaction, item hand-in, choices with consequences, decisions in point-and-click Bí Cảnh, gear/strategy configuration, realm breakthroughs subject to quest/trial conditions. Valid auto-combat kill credit can advance an accepted quest's objective counter; that does not make it an auto quest.

**STOP WHEN DISCONNECTED**: auto-monster combat and farm rewards. **Exception**: prearranged offline meditation/bế quan (existing capped 8-hour Tu Vi design), not unattended quest/loot/Character EXP farming.

## Art direction and production

- Phaser 4 browser client; Colyseus authoritative multiplayer and durable server persistence; top-down/three-quarter 2D pixel art, 32x32 map tile grid, Tiled `.tmj` maps.
- Existing 80x96/48x64 mixed sprite pipeline is a **technical proof**, not a creatively approved final look.
- New production visual art must derive from real generative model sources, with raw-source provenance, deterministic processing, game-zoom previews and explicit human approval. No unauthorized paid API or quiet procedural production fallback.

## Target and anti-goals

- Launch for a small group (~8–20 simultaneous friends), not thousand-player infrastructure; play for fun, no monetization or pay-to-win.
- No mandatory manual attack spamming; no automated story decision-making.
- No system where becoming a Legendary's disciple is necessary to complete the main story, access ordinary levels or reach Saint realm.
- No design that depends on producing all 10 Legendary domains, 60 quests, hundreds of items and perfect art before a first vertical slice.
- No false claim that old Milestones A–F are an approved production-quality game.

## First compelling vertical slice — gameplay proof

Starting in Tân Thủ Thôn: customize and roll innate destinies → Lv 1–10 as Phàm Nhân → accept/read Main Quest and reach Thanh Trúc Lâm → configure safe online Auto Farm, visibly fight/loot and gain EXP → interact with a masked immortal → receive starter công pháp and breakthrough pill → break through to Luyện Khí → participate in ordinary Phì Đế culinary events (purchased or cooked food) → see signature-specific **hint** about his optional Legendary questline. Quests are performed by the player; pathfinding only helps travel. Two real browsers must see shared server-authoritative combat.

This is a **design goal**, not a claim the current prototype already implements it.
