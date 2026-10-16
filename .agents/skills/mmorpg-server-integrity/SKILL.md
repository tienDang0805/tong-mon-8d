---
name: mmorpg-server-integrity
description: Verify server authoritative world state for a small Colyseus MMO, including movement, portal room transitions, shared mobs, combat, loot, quests, persistence and reconnect safety. Use for all networking and persistent economy work.
---

# Small-MMO Server Integrity

## Authority boundary

A browser is untrusted. It sends movement, attack, interaction and transaction intents, never authoritative outcomes. Server validates the actor's realm, position, distance, cooldown, zone, alive state, inventory and authorization. Database transaction owns rewards/currency/items.

## Gate

1. Open two browser clients with distinct characters, connect to same zone and confirm each observes the other.
2. Move A through a server-authorized portal to a second room and check B's visibility/room membership. Move B to follow. Confirm all remote state is correct, including return path.
3. Attack one monster and assert HP/damage is identical across clients. Confirm both do not each spawn their own local enemy.
4. Disconnect/reconnect A in combat and across portals; no ghost avatars or repeated rewards.
5. Replay `claim`, `loot`, `trade`, `breakthrough`, `quest-complete` messages and ensure duplicates cannot grant additional resources.
6. Test invalid attack range, speed, zone, item ID, negative quantity, oversized chat and spamming.
7. Save a test character, restart server, restore correct zone/position/inventory/realm/quest.

## Evidence

Record executable test, 2-browser recording or screenshots, server state/log IDs, known issues and observed latency. Never write `multiplayer working` when only chat and client-side combat work.
