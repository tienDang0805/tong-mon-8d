import type {
  ActionResultPayload,
  AttackIntentPayload,
  CharacterSaveState,
  CombatEventPayload,
  PartyActionIntentPayload,
  PickupDropIntentPayload
} from "@tong-mon-8d/shared";
import {
  computeActualDamage,
  ITEMS_REGISTRY,
  MONSTERS_REGISTRY,
  SKILLS_REGISTRY
} from "@tong-mon-8d/game-data";
import type {
  LegacyWorldPersistencePort,
  LegacyWorldRuntimeStatePort,
  ServerMonsterRuntimeState
} from "../../infrastructure/database/LegacyWorldPorts.js";

export class LegacyCombatService {
  constructor(
    private readonly persistence: LegacyWorldPersistencePort,
    private readonly runtimeState: LegacyWorldRuntimeStatePort
  ) {}

  async handleAttackIntent(
    player: CharacterSaveState,
    intent: AttackIntentPayload
  ): Promise<{ result: ActionResultPayload; combatEvent?: CombatEventPayload }> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
    if (dup) {
      return { result: dup };
    }

    if (player.hp <= 0) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "PLAYER_DEAD",
          messageVi: "Ngươi đang trọng thương, không thể xuất chiêu."
        }
      };
    }

    const skill = SKILLS_REGISTRY[intent.skillId] ?? SKILLS_REGISTRY.basic_slash;
    const now = this.runtimeState.now();
    const cdKey = `${player.characterId}:${skill.id}`;
    const readyAt = this.runtimeState.skillCooldowns.get(cdKey) ?? 0;
    if (now < readyAt) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "SKILL_COOLDOWN",
          messageVi: "Chiêu thức đang hồi khí."
        }
      };
    }

    if (player.mp < skill.mpCost) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "NOT_ENOUGH_MP",
          messageVi: "Linh lực không đủ để thi triển chiêu thức."
        }
      };
    }

    const zoneMonsters = Array.from(this.runtimeState.monsters.values()).filter(
      (m) => m.zoneId === player.zoneId && m.state !== "dead" && m.hp > 0
    );

    let target: ServerMonsterRuntimeState | undefined;
    if (intent.targetInstanceId) {
      target = zoneMonsters.find((m) => m.instanceId === intent.targetInstanceId);
    }
    if (!target) {
      target = zoneMonsters
        .map((m) => ({ m, d: Math.hypot(m.x - player.x, m.y - player.y) }))
        .sort((a, b) => a.d - b.d)[0]?.m;
    }

    if (!target) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "NO_TARGET",
          messageVi: "Không có yêu thú sống trong phạm vi công kích."
        }
      };
    }

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist > skill.rangePx) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "OUT_OF_RANGE",
          messageVi: `Mục tiêu ở ngoài tầm đánh (${Math.round(dist)}px > ${skill.rangePx}px).`
        }
      };
    }

    this.runtimeState.skillCooldowns.set(cdKey, now + skill.cooldownMs);
    player.mp = Math.max(0, player.mp - skill.mpCost);

    const eff = this.runtimeState.getEffectiveStats(player);
    const mDef = MONSTERS_REGISTRY[target.monsterId];
    const dmg = computeActualDamage(
      eff.attack,
      skill.coefficient,
      mDef.defense,
      skill.minDamage
    );

    target.hp = Math.max(0, target.hp - dmg);
    target.targetAccountId = player.accountId;
    if (target.state === "idle" || target.state === "patrol") {
      target.state = "aggro";
    }

    let killed = false;
    if (target.hp === 0) {
      killed = true;
      target.state = "dead";
      target.respawnAt = now + mDef.respawnMs;
      target.targetAccountId = null;

      const tuViGain = Math.round(mDef.tuViReward * eff.tuViMultiplier);
      player.tuVi += tuViGain;
      player.linhThach += mDef.linhThachReward;

      for (const entry of mDef.lootTable) {
        this.runtimeState.addItemToInventory(player, entry.itemId, entry.minQty);
      }

      const dropId = `drop_${target.instanceId}_${now}`;
      this.runtimeState.drops.set(dropId, {
        dropId,
        itemId: mDef.lootTable[0].itemId,
        quantity: 1,
        ownerCharacterId: player.characterId,
        x: target.x,
        y: target.y,
        expiresAt: now + 30000
      });

      await this.persistence.logEconomyEvent(
        player.characterId,
        `kill_${target.monsterId}`,
        mDef.linhThachReward,
        mDef.lootTable[0].itemId,
        1
      );
    }

    await this.persistence.persistPlayerRuntimeState(player);

    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: killed ? "MONSTER_KILLED" : "HIT_OK",
      messageVi: killed
        ? `Đã tiêu diệt ${target.name}! Nhận +${mDef.tuViReward} Tu Vi, +${mDef.linhThachReward} Linh Thạch và chiến lợi phẩm.`
        : `${skill.nameVi} gây ${dmg} sát thương lên ${target.name}.`
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "attack",
      result
    );

    return {
      result,
      combatEvent: {
        attackerId: player.characterId,
        targetId: target.instanceId,
        skillId: skill.id,
        damage: dmg,
        targetHp: target.hp,
        targetMaxHp: target.maxHp,
        x: target.x,
        y: target.y,
        killed
      }
    };
  }

  async handlePickupDrop(
    player: CharacterSaveState,
    intent: PickupDropIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const drop = this.runtimeState.drops.get(intent.dropId);
    if (!drop) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "DROP_NOT_FOUND",
        messageVi: "Chiến lợi phẩm đã được nhặt hoặc biến mất."
      };
    }

    const dist = Math.hypot(player.x - drop.x, player.y - drop.y);
    if (dist > 110) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "DROP_TOO_FAR",
        messageVi: "Hãy lại gần chiến lợi phẩm để nhặt."
      };
    }

    this.runtimeState.drops.delete(intent.dropId);
    this.runtimeState.addItemToInventory(player, drop.itemId, drop.quantity);
    await this.persistence.persistPlayerRuntimeState(player);

    const itemDef = ITEMS_REGISTRY[drop.itemId];
    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "PICKUP_OK",
      messageVi: `Nhặt được ${drop.quantity}x ${itemDef?.nameVi ?? drop.itemId}.`
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "pickup",
      result
    );
    return result;
  }

  handlePartyAction(
    player: CharacterSaveState,
    intent: PartyActionIntentPayload
  ): ActionResultPayload {
    if (intent.action === "create") {
      const partyId = `party_${player.characterId}`;
      this.runtimeState.parties.set(partyId, {
        partyId,
        leaderCharacterId: player.characterId,
        memberIds: [player.characterId],
        memberNames: [player.nickname]
      });
      player.partyId = partyId;
      return {
        requestId: intent.requestId,
        ok: true,
        code: "PARTY_CREATED",
        messageVi: `Đã lập đội hộ pháp 【${player.nickname}】.`
      };
    }

    if (intent.action === "join") {
      const targetParty =
        (intent.targetPartyId ? this.runtimeState.parties.get(intent.targetPartyId) : undefined) ??
        Array.from(this.runtimeState.parties.values())[0];
      if (!targetParty) {
        return {
          requestId: intent.requestId,
          ok: false,
          code: "NO_PARTY_FOUND",
          messageVi: "Chưa có tổ đội nào đang mở để gia nhập."
        };
      }
      if (!targetParty.memberIds.includes(player.characterId)) {
        targetParty.memberIds.push(player.characterId);
        targetParty.memberNames.push(player.nickname);
      }
      player.partyId = targetParty.partyId;
      return {
        requestId: intent.requestId,
        ok: true,
        code: "PARTY_JOINED",
        messageVi: `Đã gia nhập tổ đội cùng ${targetParty.memberNames.join(", ")}.`
      };
    }

    if (player.partyId) {
      const party = this.runtimeState.parties.get(player.partyId);
      if (party) {
        const idx = party.memberIds.indexOf(player.characterId);
        if (idx >= 0) {
          party.memberIds.splice(idx, 1);
          party.memberNames.splice(idx, 1);
        }
        if (party.memberIds.length === 0) {
          this.runtimeState.parties.delete(party.partyId);
        }
      }
      player.partyId = null;
    }
    return {
      requestId: intent.requestId,
      ok: true,
      code: "PARTY_LEFT",
      messageVi: "Đã rời khỏi tổ đội."
    };
  }
}
