import type Phaser from "phaser";
import type {
  AnimState,
  CharacterSaveState,
  Direction,
  GroundLootSnapshot,
  RoomWorldSnapshot,
  ZoneId
} from "@tong-mon-8d/shared";
import {
  formatRealmDisplay,
  ITEMS_REGISTRY,
  LEGENDARY_NPCS,
  MONSTERS_REGISTRY
} from "@tong-mon-8d/game-data";
import { SPRITE_PROFILES, resolvePlayerSpriteKey } from "../assets/SpriteProfiles.js";
import type { AnimationRegistry } from "../combat/AnimationRegistry.js";

export interface EntityVisualBundle {
  sprite: Phaser.GameObjects.Sprite;
  nameLabel: Phaser.GameObjects.Text;
  subLabel: Phaser.GameObjects.Text;
  hpBg?: Phaser.GameObjects.Rectangle;
  hpFill?: Phaser.GameObjects.Rectangle;
  auraRing?: Phaser.GameObjects.Arc;
  telegraphRing?: Phaser.GameObjects.Arc;
}

export interface DropVisualBundle {
  icon: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  data: GroundLootSnapshot;
}

export class ActorViewSystem {
  public localVisual: EntityVisualBundle | null = null;
  public localAppearanceKey = "hero_kiem_tu";
  public readonly remoteVisuals = new Map<string, EntityVisualBundle>();
  public readonly remoteAppearanceKeys = new Map<string, string>();
  public readonly npcVisuals = new Map<string, EntityVisualBundle>();
  public readonly npcOverrideAnims = new Map<
    string,
    { state: AnimState; dir: Direction; until: number }
  >();
  public readonly monsterVisuals = new Map<string, EntityVisualBundle>();
  public readonly dropVisuals = new Map<string, DropVisualBundle>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly animRegistry: AnimationRegistry
  ) {}

  public clearNonLocalActors(): void {
    for (const b of this.npcVisuals.values()) {
      this.destroyVisualBundle(b);
    }
    this.npcVisuals.clear();

    this.clearDynamicWorldActors();
  }

  public clearDynamicWorldActors(): void {
    for (const b of this.remoteVisuals.values()) {
      this.destroyVisualBundle(b);
    }
    this.remoteVisuals.clear();
    this.remoteAppearanceKeys.clear();

    for (const b of this.monsterVisuals.values()) {
      this.destroyVisualBundle(b);
    }
    this.monsterVisuals.clear();

    for (const d of this.dropVisuals.values()) {
      d.icon.destroy();
      d.label.destroy();
    }
    this.dropVisuals.clear();
  }

  public getActiveActorCount(includeNpcs = false): number {
    const localCount = this.localVisual && this.localVisual.sprite.visible ? 1 : 0;
    const npcCount = includeNpcs ? this.npcVisuals.size : 0;
    return localCount + this.remoteVisuals.size + this.monsterVisuals.size + npcCount;
  }

  public destroyVisualBundle(b: EntityVisualBundle): void {
    b.sprite.destroy();
    b.nameLabel.destroy();
    b.subLabel.destroy();
    b.hpBg?.destroy();
    b.hpFill?.destroy();
    b.auraRing?.destroy();
    b.telegraphRing?.destroy();
  }

  public setVisualBundleVisible(b: EntityVisualBundle, visible: boolean): void {
    b.sprite.setVisible(visible);
    b.nameLabel.setVisible(visible);
    b.subLabel.setVisible(visible);
    b.hpBg?.setVisible(visible);
    b.hpFill?.setVisible(visible);
    if (!visible) {
      b.auraRing?.setVisible(false);
      b.telegraphRing?.setVisible(false);
    }
  }

  public createVisualBundle(
    spriteKey: string,
    x: number,
    y: number,
    title: string,
    subtitle: string,
    nameColor: string,
    withHpBar: boolean
  ): EntityVisualBundle {
    const auraRing = this.scene.add
      .circle(x, y - 4, 18, 0xffd43b, 0.14)
      .setStrokeStyle(1.5, 0xffd452, 0.75)
      .setDepth(Math.max(8, y - 2))
      .setVisible(false);

    const telegraphRing = this.scene.add
      .circle(x, y - 4, 48, 0xe03131, 0.18)
      .setStrokeStyle(2, 0xff6b6b, 0.9)
      .setDepth(Math.max(8, y - 3))
      .setVisible(false);

    const profile = SPRITE_PROFILES[spriteKey] ?? SPRITE_PROFILES.hero_kiem_tu!;
    const is80x96 = profile.frameWidth === 80 && profile.frameHeight === 96;
    const rx = Math.round(x);
    const ry = Math.round(y);
    const hpOffsetY = is80x96 ? 82 : 44;
    const nameOffsetY = is80x96 ? 93 : 55;
    const subOffsetY = is80x96 ? 105 : 68;
    const sprite = this.scene.add
      .sprite(rx, ry, spriteKey, 0)
      .setOrigin(0.5, is80x96 ? 0.9167 : 0.9)
      .setScale(1.0)
      .setDepth(ry);

    const subLabel = this.scene.add
      .text(rx, ry - subOffsetY, subtitle, {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: "10px",
        color: "#ced4da",
        stroke: "#080b12",
        strokeThickness: 3
      })
      .setOrigin(0.5, 0.5)
      .setDepth(ry + 0.3);

    const nameLabel = this.scene.add
      .text(rx, ry - nameOffsetY, title, {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: nameColor,
        stroke: "#080b12",
        strokeThickness: 3
      })
      .setOrigin(0.5, 0.5)
      .setDepth(ry + 0.4);

    let hpBg: Phaser.GameObjects.Rectangle | undefined;
    let hpFill: Phaser.GameObjects.Rectangle | undefined;
    if (withHpBar) {
      hpBg = this.scene.add
        .rectangle(rx, ry - hpOffsetY, 38, 5, 0x0b0f17, 0.85)
        .setStrokeStyle(1, 0x343a40, 0.9)
        .setDepth(ry + 0.1);
      hpFill = this.scene.add
        .rectangle(rx - 18, ry - hpOffsetY, 36, 3, 0x51cf66, 1)
        .setOrigin(0, 0.5)
        .setDepth(ry + 0.2);
    }

    return { sprite, nameLabel, subLabel, hpBg, hpFill, auraRing, telegraphRing };
  }

  public updateVisualBundlePosition(
    b: EntityVisualBundle,
    x: number,
    y: number,
    hpRatio = 1,
    showAura = false,
    showTelegraph = false
  ): void {
    const is80x96 = b.sprite.width === 80 && b.sprite.height === 96;
    const depthY = Math.round(y);
    const hpOffsetY = is80x96 ? 84 : 44;
    const nameOffsetY = is80x96 ? 95 : 55;
    const subOffsetY = is80x96 ? 107 : 68;
    b.sprite.setPosition(x, y).setDepth(depthY);
    b.subLabel.setPosition(x, y - subOffsetY).setDepth(depthY + 0.3);
    b.nameLabel.setPosition(x, y - nameOffsetY).setDepth(depthY + 0.4);
    if (b.hpBg && b.hpFill) {
      b.hpBg.setPosition(x, y - hpOffsetY).setDepth(depthY + 0.1);
      b.hpFill
        .setPosition(x - 18, y - hpOffsetY)
        .setSize(Math.max(0, Math.min(1, hpRatio)) * 36, 3)
        .setDepth(depthY + 0.2);
    }
    if (b.auraRing) {
      b.auraRing
        .setPosition(x, y - 4)
        .setDepth(Math.max(8, depthY - 2))
        .setVisible(showAura);
    }
    if (b.telegraphRing) {
      b.telegraphRing
        .setPosition(x, y - 4)
        .setDepth(Math.max(8, depthY - 3))
        .setVisible(showTelegraph);
    }
  }

  public spawnZoneNpcs(zoneId: ZoneId): void {
    const npcsInZone = LEGENDARY_NPCS.filter((n) => n.zoneId === zoneId);
    for (const npc of npcsInZone) {
      const bundle = this.createVisualBundle(
        npc.spriteKey,
        npc.spawnX,
        npc.spawnY,
        npc.nameVi,
        `【${npc.realmDisplayVi}】`,
        npc.isTamDe ? "#ffd452" : "#63e6be",
        false
      );
      const resolved = this.animRegistry.resolveSpriteAnim(npc.spriteKey, "idle", "down");
      bundle.sprite.play(resolved.animKey, true);
      this.npcVisuals.set(npc.id, bundle);
    }
  }

  public ensureLocalVisual(
    desiredAppearanceId: string | undefined,
    localX: number,
    localY: number,
    self: CharacterSaveState | null,
    shouldShowAvatar: boolean
  ): { recreated: boolean; visual: EntityVisualBundle } {
    const desiredSpriteKey = resolvePlayerSpriteKey(desiredAppearanceId);
    let recreated = false;
    if (!this.localVisual || this.localAppearanceKey !== desiredSpriteKey) {
      if (this.localVisual) {
        this.destroyVisualBundle(this.localVisual);
      }
      this.localAppearanceKey = desiredSpriteKey;
      this.localVisual = this.createVisualBundle(
        desiredSpriteKey,
        localX,
        localY,
        self?.nickname ?? "Đạo Hữu",
        formatRealmDisplay(self?.realmId ?? "pham_nhan", self?.realmStage ?? 1),
        "#63e6be",
        true
      );
      recreated = true;
    } else {
      this.updateVisualBundlePosition(
        this.localVisual,
        localX,
        localY,
        (self?.hp ?? 100) / Math.max(1, self?.maxHp ?? 100),
        false,
        false
      );
    }
    this.setVisualBundleVisible(this.localVisual, shouldShowAvatar);
    return { recreated, visual: this.localVisual };
  }

  public syncWorldSnapshotActors(
    snapshot: RoomWorldSnapshot,
    myCharId: string | undefined
  ): void {
    const seenRemoteIds = new Set<string>();

    for (const [charId, rp] of Object.entries(snapshot.players)) {
      if (charId === myCharId) continue;
      seenRemoteIds.add(charId);
      const remoteSpriteKey = resolvePlayerSpriteKey(rp.appearanceId);
      let vis = this.remoteVisuals.get(charId);
      if (vis && this.remoteAppearanceKeys.get(charId) !== remoteSpriteKey) {
        this.destroyVisualBundle(vis);
        this.remoteVisuals.delete(charId);
        vis = undefined;
      }
      if (!vis) {
        vis = this.createVisualBundle(
          remoteSpriteKey,
          rp.x,
          rp.y,
          rp.nickname,
          `【${formatRealmDisplay(rp.realmId, rp.realmStage)}】`,
          "#4dabf7",
          true
        );
        this.remoteVisuals.set(charId, vis);
        this.remoteAppearanceKeys.set(charId, remoteSpriteKey);
      }
      vis.nameLabel.setText(rp.nickname);
      vis.subLabel.setText(`【${formatRealmDisplay(rp.realmId, rp.realmStage)}】`);
      this.updateVisualBundlePosition(
        vis,
        rp.x,
        rp.y,
        rp.hp / Math.max(1, rp.maxHp),
        rp.hasPhiDeBlessing,
        false
      );
      const resolved = this.animRegistry.resolveSpriteAnim(
        remoteSpriteKey,
        rp.anim,
        rp.direction
      );
      if (this.scene.anims.exists(resolved.animKey)) {
        vis.sprite.play(resolved.animKey, true);
      }
    }

    for (const [charId, vis] of this.remoteVisuals.entries()) {
      if (!seenRemoteIds.has(charId)) {
        this.destroyVisualBundle(vis);
        this.remoteVisuals.delete(charId);
        this.remoteAppearanceKeys.delete(charId);
      }
    }

    for (const [instId, m] of Object.entries(snapshot.monsters)) {
      const mDef = MONSTERS_REGISTRY[m.monsterId];
      const spriteKey = mDef?.spriteKey ?? "truc_lang";
      let vis = this.monsterVisuals.get(instId);
      if (!vis) {
        vis = this.createVisualBundle(
          spriteKey,
          m.x,
          m.y,
          m.name,
          `HP ${m.hp}/${m.maxHp}`,
          "#ff8787",
          true
        );
        if (vis.hpFill) {
          vis.hpFill.setFillStyle(0xe03131, 1);
        }
        this.monsterVisuals.set(instId, vis);
      }
      const alive = m.state !== "dead" && m.hp > 0;
      vis.sprite.setVisible(alive);
      vis.nameLabel.setVisible(alive);
      vis.subLabel.setVisible(alive).setText(`HP ${m.hp}/${m.maxHp}`);
      vis.hpBg?.setVisible(alive);
      vis.hpFill?.setVisible(alive);
      if (alive) {
        this.updateVisualBundlePosition(
          vis,
          m.x,
          m.y,
          m.hp / Math.max(1, m.maxHp),
          false,
          m.state === "telegraph"
        );
        const mAnimState: AnimState =
          m.state === "aggro" || m.state === "patrol"
            ? "walk"
            : m.state === "attack"
              ? "attack"
              : "idle";
        const resolved = this.animRegistry.resolveSpriteAnim(
          spriteKey,
          mAnimState,
          m.direction
        );
        if (this.scene.anims.exists(resolved.animKey)) {
          vis.sprite.play(resolved.animKey, true);
        }
      } else {
        vis.telegraphRing?.setVisible(false);
      }
    }

    const seenDrops = new Set<string>();
    for (const [dropId, d] of Object.entries(snapshot.drops)) {
      seenDrops.add(dropId);
      let dVis = this.dropVisuals.get(dropId);
      if (!dVis) {
        const icon = this.scene.add
          .sprite(d.x, d.y, "portal_ring", 1)
          .setScale(0.45)
          .setDepth(Math.max(9, d.y - 1));
        const itemDef = ITEMS_REGISTRY[d.itemId];
        const label = this.scene.add
          .text(d.x, d.y - 22, `[F] ${itemDef?.nameVi ?? d.itemId}`, {
            fontFamily: "Be Vietnam Pro, sans-serif",
            fontSize: "10px",
            fontStyle: "bold",
            color: "#ffd452",
            backgroundColor: "rgba(10,14,22,0.85)",
            padding: { x: 4, y: 2 }
          })
          .setOrigin(0.5, 0.5)
          .setDepth(d.y + 0.4);
        dVis = { icon, label, data: d };
        this.dropVisuals.set(dropId, dVis);
      } else {
        dVis.data = d;
      }
    }

    for (const [dropId, dVis] of this.dropVisuals.entries()) {
      if (!seenDrops.has(dropId)) {
        dVis.icon.destroy();
        dVis.label.destroy();
        this.dropVisuals.delete(dropId);
      }
    }
  }

  public updateNpcFacingAndAnims(
    currentZoneId: ZoneId,
    localX: number,
    localY: number,
    nowMs: number
  ): void {
    const npcsInZone = LEGENDARY_NPCS.filter((n) => n.zoneId === currentZoneId);
    for (const npc of npcsInZone) {
      const b = this.npcVisuals.get(npc.id);
      if (!b) continue;
      const ov = this.npcOverrideAnims.get(npc.id);
      if (ov && nowMs < ov.until) {
        const resOv = this.animRegistry.resolveSpriteAnim(npc.spriteKey, ov.state, ov.dir);
        if (this.scene.anims.exists(resOv.animKey)) {
          b.sprite.play(resOv.animKey, true);
        }
        continue;
      }
      const profile = SPRITE_PROFILES[npc.spriteKey];
      let nDir: Direction = "down";
      if (profile && profile.supportedDirections.length > 1) {
        const dist = Math.hypot(localX - npc.spawnX, localY - npc.spawnY);
        if (dist <= 165) {
          const dx = localX - npc.spawnX;
          const dy = localY - npc.spawnY;
          if (Math.abs(dx) > Math.abs(dy)) {
            nDir = dx < 0 ? "left" : "right";
          } else {
            nDir = dy < 0 ? "up" : "down";
          }
        }
      }
      const resNpc = this.animRegistry.resolveSpriteAnim(npc.spriteKey, "idle", nDir);
      if (
        this.scene.anims.exists(resNpc.animKey) &&
        b.sprite.anims.currentAnim?.key !== resNpc.animKey
      ) {
        b.sprite.play(resNpc.animKey, true);
      }
    }
  }
}
