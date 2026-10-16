---
name: world-and-map-qa
description: Validate that a top-down Phaser RPG has genuine playable Tiled maps, correct collisions, camera following, visible portals and transitions in both directions. Use whenever editing zones, portals, spawn points, tilemaps, or reviewing a supposedly playable level.
---

# World and Map Quality Gate

## Required runtime reality

Never accept UI cards or CSS boxes as a world map. The player must traverse tiled geography with artwork, ground layer, decor, front layer, collision and spawn data. Require at least two distinct map files and a visible portal interaction.

## Review sequence

1. Read zone data, Tiled map files, portals and destination spawn keys. Validate every target resolves to an existing zone and spawn marker.
2. Check that player collider and feet/anchor align with rendered position, all solid buildings/trees/water block movement as designed.
3. Run the game in a browser. Capture actual world screenshot without modal obscuration. Test holding each WASD direction and observe a changing position and camera scroll.
4. Approach a portal, verify E prompt, press E; check loading, target tiles, correct room, correct spawn and camera. Repeat in reverse.
5. Verify duplicate presses, blocked portal, connection failure, reconnect, and renderer cleanup. Repeat with two real clients after multiplayer starts.
6. Report screenshots and exact test commands. Flag missing layers or broken textures as blockers, not accepted compromises.

## Hard pass criteria

- Town → Forest → Town works in an actual browser.
- Town and forest have genuinely different art and authored layouts.
- Hero animation and depth sorting work when walking behind foreground objects.
- Server validates portal proximity and zone whenever authoritative networking is enabled.
- No stuck black screens, ghost players, collisions left from the previous scene, or portal bounce loops.
