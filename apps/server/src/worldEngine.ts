import fs from "node:fs";
import path from "node:path";
import type {
  ActionResultPayload,
  AttackIntentPayload,
  BreakthroughIntentPayload,
  CharacterSaveState,
  ClaimMeditationIntentPayload,
  CombatEventPayload,
  CookRecipeIntentPayload,
  Direction,
  GroundLootSnapshot,
  MonsterSnapshot,
  MoveIntentPayload,
  PartyActionIntentPayload,
  PartyStateSnapshot,
  PickupDropIntentPayload,
  PortalApprovedPayload,
  PortalIntentPayload,
  QuestActionIntentPayload,
  ShopBuyIntentPayload,
  UseItemIntentPayload,
  ZoneId
} from "@tong-mon-8d/shared";
import {
  computeActualDamage,
  computeOfflineMeditationReward,
  formatRealmDisplay,
  getNextRealmAndStage,
  getRealmRequiredTuVi,
  ITEMS_REGISTRY,
  LEGENDARY_NPCS,
  MONSTERS_REGISTRY,
  QUESTS_REGISTRY,
  REALM_PROGRESSION,
  RECIPES_REGISTRY,
  SKILLS_REGISTRY,
  ZONES_REGISTRY
} from "@tong-mon-8d/game-data";
import type { GameDatabase } from "./db.js";

interface TiledLayerData {
  name: string;
  type: string;
  width?: number;
  height?: number;
  data?: number[];
}

interface TiledMapFile {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayerData[];
}

interface ServerMonsterRuntime extends MonsterSnapshot {
  spawnX: number;
  spawnY: number;
  lastAttackAt: number;
  targetAccountId: string | null;
}

export class AuthoritativeWorldEngine {
  private db: GameDatabase;
  private collisionGrids: Record<ZoneId, { width: number; height: number; data: number[] }>;
  private monsters: Map<string, ServerMonsterRuntime> = new Map();
  private drops: Map<string, GroundLootSnapshot> = new Map();
  private parties: Map<string, PartyStateSnapshot> = new Map();
  private skillCooldowns: Map<string, number> = new Map();
  private portalLocks: Map<string, number> = new Map();
  private simulatedClockOffsetMs = 0;

  constructor(db: GameDatabase, rootDir?: string) {
    this.db = db;
    const baseDir = rootDir ?? path.resolve(import.meta.dirname, "../../..");
    this.collisionGrids = {
      tan_thu_thon: this.loadCollisionGrid(path.join(baseDir, ZONES_REGISTRY.tan_thu_thon.mapFile)),
      thanh_truc_lam: this.loadCollisionGrid(path.join(baseDir, ZONES_REGISTRY.thanh_truc_lam.mapFile))
    };
    this.initMonsters();
  }

  now(): number {
    return Date.now() + this.simulatedClockOffsetMs;
  }

  advanceSimulatedClockMs(deltaMs: number): void {
    this.simulatedClockOffsetMs += deltaMs;
  }

  private loadCollisionGrid(mapFilePath: string): { width: number; height: number; data: number[] } {
    const raw = JSON.parse(fs.readFileSync(mapFilePath, "utf8")) as TiledMapFile;
    const colLayer = raw.layers.find((l) => l.name === "Collision" && Array.isArray(l.data));
    return {
      width: raw.width,
      height: raw.height,
      data: colLayer?.data ?? new Array(raw.width * raw.height).fill(0)
    };
  }

  private initMonsters(): void {
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
          targetAccountId: null
        });
      }
    }
  }

  isWalkable(zoneId: ZoneId, worldX: number, worldY: number): boolean {
    const grid = this.collisionGrids[zoneId];
    if (!grid) {
      return false;
    }
    const tx = Math.floor(worldX / 32);
    const ty = Math.floor(worldY / 32);
    if (tx < 1 || ty < 1 || tx >= grid.width - 1 || ty >= grid.height - 1) {
      return false;
    }
    const tileVal = grid.data[ty * grid.width + tx] ?? 0;
    return tileVal === 0;
  }

  validateMovement(
    player: CharacterSaveState,
    intent: MoveIntentPayload
  ): { x: number; y: number; direction: Direction; moved: boolean } {
    const dx = intent.x - player.x;
    const dy = intent.y - player.y;
    const dist = Math.hypot(dx, dy);
    const maxStep = 64;

    let targetX = intent.x;
    let targetY = intent.y;
    if (dist > maxStep && dist > 0) {
      targetX = player.x + (dx / dist) * maxStep;
      targetY = player.y + (dy / dist) * maxStep;
    }

    const validDir: Direction = ["down", "left", "right", "up"].includes(intent.direction)
      ? intent.direction
      : player.direction;

    if (this.isWalkable(player.zoneId, targetX, targetY)) {
      const moved = Math.hypot(targetX - player.x, targetY - player.y) > 0.5;
      player.x = Math.round(targetX);
      player.y = Math.round(targetY);
      player.direction = validDir;
      return { x: player.x, y: player.y, direction: player.direction, moved };
    }

    if (this.isWalkable(player.zoneId, targetX, player.y)) {
      player.x = Math.round(targetX);
      player.direction = validDir;
      return { x: player.x, y: player.y, direction: player.direction, moved: true };
    }

    if (this.isWalkable(player.zoneId, player.x, targetY)) {
      player.y = Math.round(targetY);
      player.direction = validDir;
      return { x: player.x, y: player.y, direction: player.direction, moved: true };
    }

    player.direction = validDir;
    return { x: player.x, y: player.y, direction: player.direction, moved: false };
  }

  private async persistPlayerRuntimeState(player: CharacterSaveState): Promise<void> {
    if (
      player.identity?.creationState === "confirmed" ||
      player.characterId.startsWith("char_v02_")
    ) {
      await this.db.characterV02Actions.syncRuntimeWorldState(
        player.accountId,
        player,
        this.db.getCharacterV02ActionDefaults()
      );
      return;
    }
    await this.db.saveCharacterState(player);
  }

  async handlePortalIntent(
    player: CharacterSaveState,
    intent: PortalIntentPayload
  ): Promise<{ result: ActionResultPayload; approval?: PortalApprovedPayload }> {
    const dup = await this.db.checkIdempotency(intent.requestId);
    if (dup) {
      return { result: dup };
    }

    const now = this.now();
    const lockUntil = this.portalLocks.get(player.characterId) ?? 0;
    if (now < lockUntil) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "PORTAL_COOLDOWN",
          messageVi: "Truyền Tống Trận đang ổn định không gian, vui lòng chờ giây lát."
        }
      };
    }

    const zone = ZONES_REGISTRY[player.zoneId];
    const portal = zone.portals.find((p) => p.id === intent.portalId);
    if (!portal) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "INVALID_PORTAL",
          messageVi: "Không tìm thấy Truyền Tống Trận tại khu vực hiện tại."
        }
      };
    }

    const dist = Math.hypot(player.x - portal.x, player.y - portal.y);
    if (dist > portal.radiusPx) {
      return {
        result: {
          requestId: intent.requestId,
          ok: false,
          code: "OUT_OF_RANGE",
          messageVi: "Ngươi đứng quá xa Truyền Tống Trận."
        }
      };
    }

    this.portalLocks.set(player.characterId, now + 900);
    player.zoneId = portal.targetZoneId;
    player.x = portal.targetX;
    player.y = portal.targetY;
    await this.persistPlayerRuntimeState(player);

    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "PORTAL_OK",
      messageVi: `Đã truyền tống tới ${ZONES_REGISTRY[portal.targetZoneId].nameVi}.`
    };
    await this.db.recordIdempotency(intent.requestId, player.characterId, "portal", result);

    return {
      result,
      approval: {
        portalId: portal.id,
        targetZoneId: portal.targetZoneId,
        targetSpawnId: portal.targetSpawnId,
        spawnX: portal.targetX,
        spawnY: portal.targetY
      }
    };
  }

  getEffectiveStats(player: CharacterSaveState): {
    attack: number;
    defense: number;
    tuViMultiplier: number;
    hasPhiDeBlessing: boolean;
  } {
    const now = this.now();
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

  async handleAttackIntent(
    player: CharacterSaveState,
    intent: AttackIntentPayload
  ): Promise<{ result: ActionResultPayload; combatEvent?: CombatEventPayload }> {
    const dup = await this.db.checkIdempotency(intent.requestId);
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
    const now = this.now();
    const cdKey = `${player.characterId}:${skill.id}`;
    const readyAt = this.skillCooldowns.get(cdKey) ?? 0;
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

    const zoneMonsters = Array.from(this.monsters.values()).filter(
      (m) => m.zoneId === player.zoneId && m.state !== "dead" && m.hp > 0
    );

    let target: ServerMonsterRuntime | undefined;
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

    this.skillCooldowns.set(cdKey, now + skill.cooldownMs);
    player.mp = Math.max(0, player.mp - skill.mpCost);

    const eff = this.getEffectiveStats(player);
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
        this.addItemToInventory(player, entry.itemId, entry.minQty);
      }

      const dropId = `drop_${target.instanceId}_${now}`;
      this.drops.set(dropId, {
        dropId,
        itemId: mDef.lootTable[0].itemId,
        quantity: 1,
        ownerCharacterId: player.characterId,
        x: target.x,
        y: target.y,
        expiresAt: now + 30000
      });

      await this.db.logEconomyEvent(
        player.characterId,
        `kill_${target.monsterId}`,
        mDef.linhThachReward,
        mDef.lootTable[0].itemId,
        1
      );
    }

    await this.persistPlayerRuntimeState(player);

    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: killed ? "MONSTER_KILLED" : "HIT_OK",
      messageVi: killed
        ? `Đã tiêu diệt ${target.name}! Nhận +${mDef.tuViReward} Tu Vi, +${mDef.linhThachReward} Linh Thạch và chiến lợi phẩm.`
        : `${skill.nameVi} gây ${dmg} sát thương lên ${target.name}.`
    };
    await this.db.recordIdempotency(intent.requestId, player.characterId, "attack", result);

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
    const dup = await this.db.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const drop = this.drops.get(intent.dropId);
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

    this.drops.delete(intent.dropId);
    this.addItemToInventory(player, drop.itemId, drop.quantity);
    await this.persistPlayerRuntimeState(player);

    const itemDef = ITEMS_REGISTRY[drop.itemId];
    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "PICKUP_OK",
      messageVi: `Nhặt được ${drop.quantity}x ${itemDef?.nameVi ?? drop.itemId}.`
    };
    await this.db.recordIdempotency(intent.requestId, player.characterId, "pickup", result);
    return result;
  }

  async handleShopBuy(
    player: CharacterSaveState,
    intent: ShopBuyIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.db.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const qty = Math.max(1, Math.min(20, Math.floor(intent.quantity || 1)));
    const merchant = LEGENDARY_NPCS.find((n) => n.id === "merchant_truong");
    if (
      !merchant ||
      player.zoneId !== merchant.zoneId ||
      Math.hypot(player.x - merchant.spawnX, player.y - merchant.spawnY) > 160
    ) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "NOT_NEAR_MERCHANT",
        messageVi: "Hãy lại gần Quán Mì của Lão Trù Trương ở Tân Thủ Thôn để mua vật phẩm."
      };
    }

    const item = ITEMS_REGISTRY[intent.itemId];
    if (!item || item.buyPriceLinhThach === null) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "ITEM_NOT_FOR_SALE",
        messageVi: "Vật phẩm này không bán tại cửa hàng."
      };
    }

    const totalCost = item.buyPriceLinhThach * qty;
    if (player.linhThach < totalCost) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "INSUFFICIENT_LINH_THACH",
        messageVi: `Không đủ Linh Thạch (cần ${totalCost}, hiện có ${player.linhThach}).`
      };
    }

    player.linhThach -= totalCost;
    this.addItemToInventory(player, item.id, qty);
    await this.persistPlayerRuntimeState(player);
    await this.db.logEconomyEvent(player.characterId, "shop_buy", -totalCost, item.id, qty);

    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "BUY_OK",
      messageVi: `Đã mua ${qty}x ${item.nameVi} (-${totalCost} Linh Thạch).`
    };
    await this.db.recordIdempotency(intent.requestId, player.characterId, "shop_buy", result);
    return result;
  }

  async handleCookRecipe(
    player: CharacterSaveState,
    intent: CookRecipeIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.db.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const recipe = RECIPES_REGISTRY[intent.recipeId];
    if (!recipe) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "INVALID_RECIPE",
        messageVi: "Công thức nấu nướng không tồn tại."
      };
    }

    for (const ing of recipe.ingredients) {
      if (this.getItemCount(player, ing.itemId) < ing.quantity) {
        const ingName = ITEMS_REGISTRY[ing.itemId]?.nameVi ?? ing.itemId;
        return {
          requestId: intent.requestId,
          ok: false,
          code: "MISSING_INGREDIENTS",
          messageVi: `Thiếu nguyên liệu: cần ${ing.quantity}x ${ingName}.`
        };
      }
    }

    for (const ing of recipe.ingredients) {
      this.removeItemFromInventory(player, ing.itemId, ing.quantity);
    }

    this.addItemToInventory(player, recipe.outputItemId, recipe.outputQuantity);
    player.tuVi += recipe.tuViReward;
    await this.persistPlayerRuntimeState(player);

    const outItem = ITEMS_REGISTRY[recipe.outputItemId];
    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "COOK_OK",
      messageVi: `Chế biến thành công ${recipe.outputQuantity}x ${outItem.nameVi} (+${recipe.tuViReward} Tu Vi)!`
    };
    await this.db.recordIdempotency(intent.requestId, player.characterId, "cook", result);
    return result;
  }

  async handleUseItem(
    player: CharacterSaveState,
    intent: UseItemIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.db.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const item = ITEMS_REGISTRY[intent.itemId];
    if (!item || this.getItemCount(player, intent.itemId) < 1) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "ITEM_NOT_OWNED",
        messageVi: "Không có vật phẩm này trong hành trang."
      };
    }

    if (item.category !== "food" && item.category !== "beverage" && item.category !== "pill") {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "ITEM_NOT_CONSUMABLE",
        messageVi: "Vật phẩm này không thể trực tiếp sử dụng."
      };
    }

    this.removeItemFromInventory(player, item.id, 1);
    if (item.hpRestore) {
      player.hp = Math.min(player.maxHp, player.hp + item.hpRestore);
    }
    if (item.tuViGrant) {
      player.tuVi += item.tuViGrant;
    }
    if (item.buffSlot && item.buffDurationSec) {
      const now = this.now();
      player.buffs = player.buffs.filter((b) => b.slot !== item.buffSlot && b.expiresAt > now);
      player.buffs.push({
        buffId: `buff_${item.id}`,
        name: item.nameVi,
        slot: item.buffSlot,
        attackBonus: item.attackBonus ?? 0,
        defenseBonus: item.defenseBonus ?? 0,
        hpBonus: 0,
        tuViMultiplier: item.tuViMultiplier ?? 1.0,
        expiresAt: now + item.buffDurationSec * 1000
      });
    }

    await this.persistPlayerRuntimeState(player);
    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "USE_ITEM_OK",
      messageVi: `Đã dùng ${item.nameVi}, linh lực và huyết khí dồi dào!`
    };
    await this.db.recordIdempotency(intent.requestId, player.characterId, "use_item", result);
    return result;
  }

  async handleQuestAction(
    player: CharacterSaveState,
    intent: QuestActionIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.db.checkIdempotency(intent.requestId);
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
        messageVi: "Ngươi đã hoàn thành chương cơ duyên này rồi, không thể nhận thưởng lần hai."
      };
    }

    if (intent.action === "accept") {
      player.quests[quest.id] = {
        questId: quest.id,
        status: "active",
        stepIndex: 1,
        objectiveCount: 0
      };
      await this.persistPlayerRuntimeState(player);
      const res: ActionResultPayload = {
        requestId: intent.requestId,
        ok: true,
        code: "QUEST_ACCEPTED",
        messageVi: quest.acceptDialogueVi
      };
      await this.db.recordIdempotency(intent.requestId, player.characterId, "quest_accept", res);
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
      chosenItemId = quest.eligibleItemIds.find((id) => this.getItemCount(player, id) > 0);
    }

    if (!chosenItemId || this.getItemCount(player, chosenItemId) < 1) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "MISSING_QUEST_DISH",
        messageVi:
          "Ngươi chưa có món ăn hợp lệ (Mì Linh Mạch Thanh Trúc, Bánh Bao Linh Thú hoặc Canh Trúc Lang). Hãy mua ở Quán Mì Lão Trù Trương hoặc tự nấu!"
      };
    }

    this.removeItemFromInventory(player, chosenItemId, 1);
    const now = this.now();
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
      this.addItemToInventory(player, quest.rewardItemId, quest.rewardItemQty);
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

    await this.persistPlayerRuntimeState(player);
    await this.db.logEconomyEvent(
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
    await this.db.recordIdempotency(intent.requestId, player.characterId, "quest_submit", res);
    return res;
  }

  async handleClaimMeditation(
    player: CharacterSaveState,
    intent: ClaimMeditationIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.db.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const now = this.now();
    const elapsedSec = Math.floor((now - player.lastMeditationClaimAt) / 1000);
    if (elapsedSec < 10) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "MEDITATION_TOO_SOON",
        messageVi: "Vừa mới thu hoạch linh khí xong, hãy tĩnh tọa thêm ít nhất 10 giây."
      };
    }

    const eff = this.getEffectiveStats(player);
    const { cappedSeconds, tuViGained } = computeOfflineMeditationReward(
      elapsedSec,
      player.realmId,
      eff.tuViMultiplier
    );

    player.lastMeditationClaimAt = now;
    player.meditationStartedAt = now;
    player.tuVi += tuViGained;
    await this.persistPlayerRuntimeState(player);

    const minutes = Math.max(1, Math.round(cappedSeconds / 60));
    const cappedNote = elapsedSec > 8 * 3600 ? " (đã giới hạn tối đa 8 giờ)" : "";
    const res: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "MEDITATION_CLAIMED",
      messageVi: `Thu hoạch bế quan ${minutes} phút${cappedNote}: nhận +${tuViGained} Tu Vi!`
    };
    await this.db.recordIdempotency(intent.requestId, player.characterId, "claim_meditation", res);
    return res;
  }

  async handleBreakthrough(
    player: CharacterSaveState,
    intent: BreakthroughIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.db.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const reqTuVi = getRealmRequiredTuVi(player.realmId, player.realmStage);
    if (player.tuVi < reqTuVi) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "INSUFFICIENT_TU_VI",
        messageVi: `Chưa đủ Tu Vi để đột phá (cần ${reqTuVi}, hiện có ${player.tuVi}).`
      };
    }

    const next = getNextRealmAndStage(player.realmId, player.realmStage);
    if (!next) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "MAX_REALM",
        messageVi: "Ngươi đã đạt tới đỉnh cao cảnh giới hiện tại."
      };
    }

    const targetRealmDef = REALM_PROGRESSION.find((r) => r.id === next.realmId);
    if (
      next.isMajorBreakthrough &&
      targetRealmDef?.breakthroughItemId &&
      targetRealmDef.breakthroughItemCount > 0
    ) {
      if (this.getItemCount(player, targetRealmDef.breakthroughItemId) < targetRealmDef.breakthroughItemCount) {
        const itemName = ITEMS_REGISTRY[targetRealmDef.breakthroughItemId]?.nameVi ?? targetRealmDef.breakthroughItemId;
        return {
          requestId: intent.requestId,
          ok: false,
          code: "MISSING_BREAKTHROUGH_ITEM",
          messageVi: `Đột phá đại cảnh giới ${targetRealmDef.nameVi} cần ${targetRealmDef.breakthroughItemCount}x ${itemName}.`
        };
      }
      this.removeItemFromInventory(
        player,
        targetRealmDef.breakthroughItemId,
        targetRealmDef.breakthroughItemCount
      );
    }

    player.tuVi -= reqTuVi;
    player.realmId = next.realmId;
    player.realmStage = next.stage;

    const rDef = targetRealmDef ?? REALM_PROGRESSION[1];
    player.maxHp += rDef.hpBonusPerStage || 30;
    player.maxMp += rDef.mpBonusPerStage || 15;
    player.attack += rDef.attackBonusPerStage || 5;
    player.defense += rDef.defenseBonusPerStage || 3;
    player.hp = player.maxHp;
    player.mp = player.maxMp;

    await this.persistPlayerRuntimeState(player);

    const display = formatRealmDisplay(player.realmId, player.realmStage);
    const res: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "BREAKTHROUGH_OK",
      messageVi: `Đột phá thành công lên cảnh giới 【${display}】! Khí huyết và linh lực đại tăng!`,
      ceremony: "breakthrough_success"
    };
    await this.db.recordIdempotency(intent.requestId, player.characterId, "breakthrough", res);
    return res;
  }

  handlePartyAction(
    player: CharacterSaveState,
    intent: PartyActionIntentPayload
  ): ActionResultPayload {
    if (intent.action === "create") {
      const partyId = `party_${player.characterId}`;
      this.parties.set(partyId, {
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
        (intent.targetPartyId ? this.parties.get(intent.targetPartyId) : undefined) ??
        Array.from(this.parties.values())[0];
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
      const party = this.parties.get(player.partyId);
      if (party) {
        const idx = party.memberIds.indexOf(player.characterId);
        if (idx >= 0) {
          party.memberIds.splice(idx, 1);
          party.memberNames.splice(idx, 1);
        }
        if (party.memberIds.length === 0) {
          this.parties.delete(party.partyId);
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

  tickZoneMonsters(
    zoneId: ZoneId,
    activePlayers: Map<string, CharacterSaveState>
  ): CombatEventPayload[] {
    const now = this.now();
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
          m.telegraphUntil = 0;
        }
        continue;
      }

      let targetPlayer = m.targetAccountId ? activePlayers.get(m.targetAccountId) : undefined;
      if (!targetPlayer || targetPlayer.zoneId !== zoneId || targetPlayer.hp <= 0) {
        targetPlayer = Array.from(activePlayers.values()).find(
          (p) =>
            p.zoneId === zoneId &&
            p.hp > 0 &&
            Math.hypot(p.x - m.x, p.y - m.y) <= def.aggroRangePx
        );
        m.targetAccountId = targetPlayer?.accountId ?? null;
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
        const step = Math.min(distToPlayer - def.attackRangePx + 4, (def.moveSpeedPxPerSec * 50) / 1000);
        const nx = m.x + ((targetPlayer.x - m.x) / distToPlayer) * step;
        const ny = m.y + ((targetPlayer.y - m.y) / distToPlayer) * step;
        if (this.isWalkable(zoneId, nx, ny)) {
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
