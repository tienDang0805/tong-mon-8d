import type {
  CharacterSaveState,
  CombatEventPayload,
  GroundLootSnapshot,
  MonsterSnapshot,
  PartyStateSnapshot,
  ZoneId
} from "@tong-mon-8d/shared";
import {
  computeActualDamage,
  MONSTERS_REGISTRY,
  ZONES_REGISTRY
} from "@tong-mon-8d/game-data";
import type { AuthoritativeClock } from "../../infrastructure/time/Clock.js";
import type { ZoneCollisionRegistry } from "./ZoneCollision.js";

export interface ServerMonsterRuntime extends MonsterSnapshot {
  spawnX: number;
  spawnY: number;
  lastAttackAt: number;
  targetAccountId: string | null;
  targetCharacterId?: string | null;
}

export class MonsterRuntimeManager {
  public readonly monsters = new Map<string, ServerMonsterRuntime>();
  public readonly drops = new Map<string, GroundLootSnapshot>();
  public readonly parties = new Map<string, PartyStateSnapshot>();
  public readonly skillCooldowns = new Map<string, number>();
  public readonly portalLocks = new Map<string, number>();

  constructor(
    private readonly clock: AuthoritativeClock,
    private readonly collision: ZoneCollisionRegistry
  ) {
    this.initMonsters();
  }

  initMonsters(): void {
    this.monsters.clear();
    for (const zone of Object.values(ZONES_REGISTRY)) {
      for (const spawn of zone.monsterSpawns) {
        const def = MONSTERS_REGISTRY[spawn.monsterId];
        if (!def) {
          continue;
        }
        this.monsters.set(spawn.instanceId, {
          instanceId: spawn.instanceId,
          monsterId: spawn.monsterId,
          name: def.nameVi,
          zoneId: zone.id,
          x: spawn.x,
          y: spawn.y,
          spawnX: spawn.x,
          spawnY: spawn.y,
          direction: "down",
          state: "idle",
          hp: def.maxHp,
          maxHp: def.maxHp,
          telegraphUntil: 0,
          respawnAt: 0,
          lastAttackAt: 0,
          targetAccountId: null,
          targetCharacterId: null
        });
      }
    }
  }

  clearTargetForAccount(zoneId: ZoneId, accountId: string, characterId?: string): void {
    for (const m of this.monsters.values()) {
      if (m.zoneId !== zoneId) {
        continue;
      }
      if (
        m.targetAccountId === accountId &&
        (!characterId || !m.targetCharacterId || m.targetCharacterId === characterId)
      ) {
        m.targetAccountId = null;
        m.targetCharacterId = null;
        if (m.state === "aggro" || m.state === "telegraph" || m.state === "attack") {
          m.state = "idle";
          m.telegraphUntil = 0;
        }
      }
    }
  }

  getEffectiveStats(player: CharacterSaveState): {
    attack: number;
    defense: number;
    tuViMultiplier: number;
    hasPhiDeBlessing: boolean;
  } {
    const now = this.clock.now();
    player.buffs = player.buffs.filter((b) => b.expiresAt > now);
    let attack = player.attack;
    let defense = player.defense;
    let tuViMultiplier = 1.0;
    let hasPhiDeBlessing = Boolean(
      player.quests.phi_de_ch1_huong_thom?.status === "completed"
    );

    for (const b of player.buffs) {
      attack += b.attackBonus;
      defense += b.defenseBonus;
      tuViMultiplier = Math.max(tuViMultiplier, b.tuViMultiplier);
      if (b.slot === "blessing") {
        hasPhiDeBlessing = true;
      }
    }
    return { attack, defense, tuViMultiplier, hasPhiDeBlessing };
  }

  tickZoneMonsters(
    zoneId: ZoneId,
    activePlayers: Map<string, CharacterSaveState>
  ): CombatEventPayload[] {
    const now = this.clock.now();
    const events: CombatEventPayload[] = [];

    for (const [dropId, drop] of this.drops.entries()) {
      if (now >= drop.expiresAt) {
        this.drops.delete(dropId);
      }
    }

    for (const m of this.monsters.values()) {
      if (m.zoneId !== zoneId) {
        continue;
      }
      const def = MONSTERS_REGISTRY[m.monsterId];
      if (m.state === "dead") {
        if (now >= m.respawnAt) {
          m.hp = def.maxHp;
          m.x = m.spawnX;
          m.y = m.spawnY;
          m.state = "idle";
          m.targetAccountId = null;
          m.targetCharacterId = null;
          m.telegraphUntil = 0;
        }
        continue;
      }

      let targetPlayer = m.targetAccountId ? activePlayers.get(m.targetAccountId) : undefined;
      if (
        !targetPlayer ||
        (m.targetCharacterId && targetPlayer.characterId !== m.targetCharacterId) ||
        targetPlayer.zoneId !== zoneId ||
        targetPlayer.hp <= 0
      ) {
        targetPlayer = Array.from(activePlayers.values()).find(
          (p) =>
            p.zoneId === zoneId &&
            p.hp > 0 &&
            Math.hypot(p.x - m.x, p.y - m.y) <= def.aggroRangePx
        );
        m.targetAccountId = targetPlayer?.accountId ?? null;
        m.targetCharacterId = targetPlayer?.characterId ?? null;
      }

      if (!targetPlayer) {
        const distFromSpawn = Math.hypot(m.x - m.spawnX, m.y - m.spawnY);
        if (distFromSpawn > 6) {
          m.x += Math.round(((m.spawnX - m.x) / distFromSpawn) * 4);
          m.y += Math.round(((m.spawnY - m.y) / distFromSpawn) * 4);
          m.state = "patrol";
        } else {
          m.state = "idle";
        }
        continue;
      }

      const leashDist = Math.hypot(m.x - m.spawnX, m.y - m.spawnY);
      if (leashDist > def.leashRangePx) {
        m.targetAccountId = null;
        m.targetCharacterId = null;
        m.x = m.spawnX;
        m.y = m.spawnY;
        m.hp = def.maxHp;
        m.state = "idle";
        continue;
      }

      const distToPlayer = Math.hypot(targetPlayer.x - m.x, targetPlayer.y - m.y);
      m.direction =
        Math.abs(targetPlayer.x - m.x) > Math.abs(targetPlayer.y - m.y)
          ? targetPlayer.x < m.x
            ? "left"
            : "right"
          : targetPlayer.y < m.y
            ? "up"
            : "down";

      if (distToPlayer > def.attackRangePx) {
        m.state = "aggro";
        const step = Math.min(
          distToPlayer - def.attackRangePx + 4,
          (def.moveSpeedPxPerSec * 50) / 1000
        );
        const nx = m.x + ((targetPlayer.x - m.x) / distToPlayer) * step;
        const ny = m.y + ((targetPlayer.y - m.y) / distToPlayer) * step;
        if (this.collision.isWalkable(zoneId, nx, ny)) {
          m.x = Math.round(nx);
          m.y = Math.round(ny);
        }
      } else {
        if (m.state !== "telegraph" && now - m.lastAttackAt >= def.attackCooldownMs) {
          m.state = "telegraph";
          m.telegraphUntil = now + def.telegraphMs;
        } else if (m.state === "telegraph" && now >= m.telegraphUntil) {
          m.state = "attack";
          m.lastAttackAt = now;
          const eff = this.getEffectiveStats(targetPlayer);
          const dmg = computeActualDamage(def.attack, 1.0, eff.defense, 4);
          targetPlayer.hp = Math.max(1, targetPlayer.hp - dmg);
          events.push({
            attackerId: m.instanceId,
            targetId: targetPlayer.characterId,
            skillId: "monster_bite",
            damage: dmg,
            targetHp: targetPlayer.hp,
            targetMaxHp: targetPlayer.maxHp,
            x: targetPlayer.x,
            y: targetPlayer.y,
            killed: false
          });
        }
      }
    }

    return events;
  }

  getZoneMonsters(zoneId: ZoneId): Record<string, MonsterSnapshot> {
    const out: Record<string, MonsterSnapshot> = {};
    for (const m of this.monsters.values()) {
      if (m.zoneId === zoneId) {
        out[m.instanceId] = {
          instanceId: m.instanceId,
          monsterId: m.monsterId,
          name: m.name,
          zoneId: m.zoneId,
          x: m.x,
          y: m.y,
          direction: m.direction,
          state: m.state,
          hp: m.hp,
          maxHp: m.maxHp,
          telegraphUntil: m.telegraphUntil,
          respawnAt: m.respawnAt
        };
      }
    }
    return out;
  }

  getZoneDrops(zoneId: ZoneId): Record<string, GroundLootSnapshot> {
    const out: Record<string, GroundLootSnapshot> = {};
    if (zoneId !== "thanh_truc_lam") {
      return out;
    }
    for (const d of this.drops.values()) {
      out[d.dropId] = { ...d };
    }
    return out;
  }

  getPartiesSnapshot(): Record<string, PartyStateSnapshot> {
    const out: Record<string, PartyStateSnapshot> = {};
    for (const p of this.parties.values()) {
      out[p.partyId] = { ...p };
    }
    return out;
  }

  getItemCount(player: CharacterSaveState, itemId: string): number {
    return player.inventory
      .filter((s) => s.itemId === itemId)
      .reduce((acc, s) => acc + s.quantity, 0);
  }

  addItemToInventory(player: CharacterSaveState, itemId: string, quantity: number): void {
    const existing = player.inventory.find((s) => s.itemId === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      player.inventory.push({ itemId, quantity });
    }
  }

  removeItemFromInventory(player: CharacterSaveState, itemId: string, quantity: number): void {
    const existing = player.inventory.find((s) => s.itemId === itemId);
    if (!existing) {
      return;
    }
    existing.quantity -= quantity;
    if (existing.quantity <= 0) {
      player.inventory = player.inventory.filter((s) => s.itemId !== itemId);
    }
  }
}
