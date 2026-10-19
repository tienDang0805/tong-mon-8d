import type {
  ActionResultPayload,
  CharacterSaveState,
  CookRecipeIntentPayload,
  ShopBuyIntentPayload,
  UseItemIntentPayload
} from "@tong-mon-8d/shared";
import {
  ITEMS_REGISTRY,
  LEGENDARY_NPCS,
  RECIPES_REGISTRY
} from "@tong-mon-8d/game-data";
import type {
  LegacyWorldPersistencePort,
  LegacyWorldRuntimeStatePort
} from "../../infrastructure/database/LegacyWorldPorts.js";

export class LegacyCommerceService {
  constructor(
    private readonly persistence: LegacyWorldPersistencePort,
    private readonly runtimeState: LegacyWorldRuntimeStatePort
  ) {}

  async handleShopBuy(
    player: CharacterSaveState,
    intent: ShopBuyIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
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
        messageVi:
          "Hãy lại gần Quán Mì của Lão Trù Trương ở Tân Thủ Thôn để mua vật phẩm."
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
    this.runtimeState.addItemToInventory(player, item.id, qty);
    await this.persistence.persistPlayerRuntimeState(player);
    await this.persistence.logEconomyEvent(
      player.characterId,
      "shop_buy",
      -totalCost,
      item.id,
      qty
    );

    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "BUY_OK",
      messageVi: `Đã mua ${qty}x ${item.nameVi} (-${totalCost} Linh Thạch).`
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "shop_buy",
      result
    );
    return result;
  }

  async handleCookRecipe(
    player: CharacterSaveState,
    intent: CookRecipeIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
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
      if (this.runtimeState.getItemCount(player, ing.itemId) < ing.quantity) {
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
      this.runtimeState.removeItemFromInventory(player, ing.itemId, ing.quantity);
    }

    this.runtimeState.addItemToInventory(player, recipe.outputItemId, recipe.outputQuantity);
    player.tuVi += recipe.tuViReward;
    await this.persistence.persistPlayerRuntimeState(player);

    const outItem = ITEMS_REGISTRY[recipe.outputItemId];
    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "COOK_OK",
      messageVi: `Chế biến thành công ${recipe.outputQuantity}x ${outItem.nameVi} (+${recipe.tuViReward} Tu Vi)!`
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "cook",
      result
    );
    return result;
  }

  async handleUseItem(
    player: CharacterSaveState,
    intent: UseItemIntentPayload
  ): Promise<ActionResultPayload> {
    const dup = await this.persistence.checkIdempotency(intent.requestId);
    if (dup) {
      return dup;
    }

    const item = ITEMS_REGISTRY[intent.itemId];
    if (!item || this.runtimeState.getItemCount(player, intent.itemId) < 1) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "ITEM_NOT_OWNED",
        messageVi: "Không có vật phẩm này trong hành trang."
      };
    }

    if (
      item.category !== "food" &&
      item.category !== "beverage" &&
      item.category !== "pill"
    ) {
      return {
        requestId: intent.requestId,
        ok: false,
        code: "ITEM_NOT_CONSUMABLE",
        messageVi: "Vật phẩm này không thể trực tiếp sử dụng."
      };
    }

    this.runtimeState.removeItemFromInventory(player, item.id, 1);
    if (item.hpRestore) {
      player.hp = Math.min(player.maxHp, player.hp + item.hpRestore);
    }
    if (item.tuViGrant) {
      player.tuVi += item.tuViGrant;
    }
    if (item.buffSlot && item.buffDurationSec) {
      const now = this.runtimeState.now();
      player.buffs = player.buffs.filter(
        (b) => b.slot !== item.buffSlot && b.expiresAt > now
      );
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

    await this.persistence.persistPlayerRuntimeState(player);
    const result: ActionResultPayload = {
      requestId: intent.requestId,
      ok: true,
      code: "USE_ITEM_OK",
      messageVi: `Đã dùng ${item.nameVi}, linh lực và huyết khí dồi dào!`
    };
    await this.persistence.recordIdempotency(
      intent.requestId,
      player.characterId,
      "use_item",
      result
    );
    return result;
  }
}
