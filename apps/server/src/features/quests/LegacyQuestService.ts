import type {
  ActionResultPayload,
  CharacterSaveState,
  QuestActionIntentPayload
} from "@tong-mon-8d/shared";
import {
  LEGENDARY_NPCS,
  QUESTS_REGISTRY
} from "@tong-mon-8d/game-data";
import type {
  LegacyWorldPersistencePort,
  LegacyWorldRuntimeStatePort
} from "../../infrastructure/database/LegacyWorldPorts.js";

export class LegacyQuestService {
  constructor(
    private readonly persistence: LegacyWorldPersistencePort,
    private readonly runtimeState: LegacyWorldRuntimeStatePort
  ) {}

  async handleQuestAction(
    player: CharacterSaveState,
    intent: QuestActionIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const quest = QUESTS_REGISTRY[intent.questId];
    if (!quest) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "QUEST_NOT_FOUND",
        messageVi: "Không tìm thấy cơ duyên nhiệm vụ này."
      };
    }

    const npc = LEGENDARY_NPCS.find((n) => n.id === quest.npcId);
    if (
      !npc ||
      player.zoneId !== npc.zoneId ||
      Math.hypot(player.x - npc.spawnX, player.y - npc.spawnY) > 165
    ) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "NOT_NEAR_NPC",
        messageVi: `Hãy lại gần ${npc?.nameVi ?? "NPC"} để đàm đạo.`
      };
    }

    const current = player.quests[quest.id] ?? {
      questId: quest.id,
      status: "not_started",
      stepIndex: 0,
      objectiveCount: 0
    };

    if (current.status === "completed") {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "QUEST_ALREADY_COMPLETED",
        messageVi:
          "Ngươi đã hoàn thành chương cơ duyên này rồi, không thể nhận thưởng lần hai."
      };
    }

    if (intent.action === "accept") {
      player.quests[quest.id] = {
        questId: quest.id,
        status: "active",
        stepIndex: 1,
        objectiveCount: 0
      };
      await this.persistence.persistPlayerRuntimeState(player);
      const res: ActionResultPayload = {
        requestId: intent.requestId,
        ok: true,
        code: "QUEST_ACCEPTED",
        messageVi: quest.acceptDialogueVi
      };
      await this.persistence.recordIdempotency(
        intent.requestId,
        player.characterId,
        "quest_accept",
        res
      );
      return res;
    }

    let chosenItemId = intent.submittedItemId;
    if (chosenItemId && !quest.eligibleItemIds.includes(chosenItemId)) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "INVALID_QUEST_ITEM",
        messageVi: "Vật phẩm dâng lên không hợp khẩu vị Ẩm Thực Đại Đạo của Phì Đế!"
      };
    }
    if (!chosenItemId) {
      chosenItemId = quest.eligibleItemIds.find(
        (id) => this.runtimeState.getItemCount(player, id) > 0
      );
    }

    if (!chosenItemId || this.runtimeState.getItemCount(player, chosenItemId) < 1) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "MISSING_QUEST_DISH",
        messageVi:
          "Ngươi chưa có món ăn hợp lệ (Mì Linh Mạch Thanh Trúc, Bánh Bao Linh Thú hoặc Canh Trúc Lang). Hãy mua ở Quán Mì Lão Trù Trương hoặc tự nấu!"
      };
    }

    this.runtimeState.removeItemFromInventory(player, chosenItemId, 1);
    const now = this.runtimeState.now();
    player.quests[quest.id] = {
      questId: quest.id,
      status: "completed",
      stepIndex: 2,
      objectiveCount: 1,
      completedAt: now
    };
    player.tuVi += quest.rewardTuVi;
    player.linhThach += quest.rewardLinhThach;
    player.reputation[quest.npcId] = (player.reputation[quest.npcId] ?? 0) + 100;

    if (quest.rewardItemId && quest.rewardItemQty) {
      this.runtimeState.addItemToInventory(
        player,
        quest.rewardItemId,
        quest.rewardItemQty
      );
    }
    if (quest.rewardTitleVi) {
      player.equippedTitle = quest.rewardTitleVi;
      player.equippedInheritance = "phi_de";
    }
    if (quest.grantsPhiDeBlessing) {
      player.buffs = player.buffs.filter((b) => b.slot !== "blessing");
      player.buffs.push({
        buffId: "phi_de_kim_quang_blessing",
        name: "Thực Đạo Kim Quang Chúc Phúc",
        slot: "blessing",
        attackBonus: 10,
        defenseBonus: 8,
        hpBonus: 40,
        tuViMultiplier: 1.35,
        expiresAt: now + 3600 * 1000
      });
    }

    await this.persistence.persistPlayerRuntimeState(player);
    await this.persistence.logEconomyEvent(
      player.characterId,
      `quest_complete_${quest.id}`,
      quest.rewardLinhThach,
      quest.rewardItemId,
      quest.rewardItemQty
    );

    const res: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "QUEST_COMPLETED",
      messageVi: quest.submitDialogueVi,
      ceremony: "phi_de_blessing"
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "quest_submit",
      res
    );
    return res;
  }
}
