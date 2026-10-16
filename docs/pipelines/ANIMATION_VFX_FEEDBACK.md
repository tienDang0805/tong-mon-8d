# TD-05 · Animation, VFX & Authoritative Game-Feel

> v0.7 · DESIGN_BASELINE. The look and timing are creative candidates, not final art approval. Combat numbers, hit registration, reward, death and leveling remain server-owned by TD-01/02/03/04.

## 1. No text-only combat

The rendered world must respond to **intent, cast, attack, impact, death, reward, loot, cultivation and breakthrough**. A server event drives a client visual; a visual does not decide the server outcome. Auto Farm must be satisfying to watch while online and visually distinguish target selection and cooldown state without covering the world with notifications.

Typical server sequence: validated attack intent → authoritative damage/HP/reward from TD-02/04 → `CombatEvent` to clients → local presentational timeline (windup, travel, contact, number, hurt, death, drop). Client interpolation may hide network latency but never grant additional damage, second loot or extra Dao EXP. Reconnect must reconstruct server HP and presence, not resume a stale attack particle to claim a kill.

## 2. Animation families and minimum requirements

| Family | States to author | Required visual confirmation | TD dependency |
|---|---|---|---|
| Hero / humanoid NPC | idle, walk, attack, cast, hurt; transition and optional death | Multiple true directions and grounded feet, correct weapon stance | TD-01 character, TD-02 skill |
| ChatDVT / animal / enemy | species-specific idle, move, telegraph, attack, hurt, death, respawn cue | Anatomically coherent creature motion; ChatDVT four-legged | Canon NPC; TD-02 combat |
| Ground pickup | spawn, idle readable silhouette, pickup vanish/grant | Item type and ownership visible, ground/direct exclusive | TD-04 loot |
| Võ Kỹ | icon, cast anticipation, active VFX, contact impact, target reaction, cooldown | Damage reaction and skill identity; not just floating damage text | TD-02 `TechniqueDef`, event |
| Công Pháp / bế quan | breathing/cultivation stance, source-generated aura, finish or interrupt | Tu Vi state visually distinct from Auto Farm | TD-01 cultivation, TD-03 presence |
| Realm breakthrough | prerequisite ready state, deliberate player trigger, short transformation aura, clear success/failure | Never auto-breakthrough on idle EXP | TD-01 gate |
| Quest / dialogue | discoverable world hint, talk interaction, completed marker, manual reward feedback | Player must manually choose/claim; character stays in world | TD-03 quest |
| Shopping | stall idle, item inspection preview, buy/sell currency/item feedback | Item art and manual confirmation; no auto-purchase | TD-04 NPC shop |
| Dungeon / environmental | approach, portal open, entrance, hazard telegraph, interaction object animates | Distinct location and affordance, not abstract dialogue panel | TD-04 instance |

## 3. Frame/time semantics

The existing `80×96` 6x20 proof sheet defines **frame count** compatibility, not fixed durations. Proposed authorable timing ranges (not approved balancing): idle 3–6fps, walk 6–10fps, attack/cast 6–12fps depending on poses, hurt 8–12fps; use scene speed to match perceived world movement and sprite consistency. Final values must be tuned in-engine. Do not tie server damage tick to a sprite frame or Playwright screenshot timestamp. VFX and audio timings may be visually interpolated while the server confirms hit/reward.

A large monster or celestial entity may need larger sprite frames and custom collider/anchor; the artistic silhouette must not be compressed into small generic sheet dimensions. Track per asset `frameW`, `frameH`, `origin`, `scale`, animation set, logical collider footprint and layer. General runtime must support upgraded vs legacy sizes, not silently distort textures.

## 4. Telegraph, hit and visual accessibility

- Enemy windup uses pose plus a **source-generated** warning graphic/ground indicator, not only a red sentence; distinct enough from friendly combat particles.
- Ground telegraph corresponds spatially to authoritative affected area and is conservative when latency increases. UI color is supplemental; use outline/shape/animation for colorblind readability.
- Skill icon/weapon trail hue/shape signals Dao branch (six approved paths: Kiếm, Đao, Chỉ, Chưởng, Thể Tu, Pháp Tu), without hard-coding the path into the particle engine.
- Sound, camera shake, hit-stop, bloom and trails are presentation only and adjustable. Avoid uncontrolled shake/full-screen flash (motion sensitivity).
- Effects must not hide NPC trade interaction points, quest markers, boss tells or a four-legged creature's anatomy.
- Overlapping effects in 8–20 players require pooling, visibility priority and on-screen cap; **no hard numeric performance budgets are owner-approved** yet.

## 5. Human review and tests

`FX-01` each released active Võ Kỹ has unique, matching icon+pose+hit effect and traceable genuine AI source. `FX-02` no effect grants damage outside server event. `FX-03` shared monster HP/telegraph consistent across two clients despite different animations. `FX-04` death and loot emit once; respawn resets animation state. `FX-05` hidden/offline Auto Farm does not continue visible combat. `FX-06` six Dao branch VFX remain visually distinct at in-game zoom. `FX-07` target and hit remain readable with 2+ player attackers. `FX-08` reduced-motion and sound-off modes preserve essential feedback. `FX-09` missing asset cannot silently fall back to a primitive geometric flash in final production.
