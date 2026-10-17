import Phaser from "phaser";
import type {
  AnimState,
  CharacterSaveState,
  CombatEventPayload,
  Direction,
  GroundLootSnapshot,
  MonsterSnapshot,
  RemotePlayerSnapshot,
  RoomWorldSnapshot,
  ZoneId
} from "@tong-mon-8d/shared";
import {
  formatRealmDisplay,
  ITEMS_REGISTRY,
  LEGENDARY_NPCS,
  MONSTERS_REGISTRY,
  ZONES_REGISTRY,
  type LegendaryNpcDefinition
} from "@tong-mon-8d/game-data";
import type { GameNetworkClient } from "./network.js";
import type { SoundController } from "./audio.js";

interface EntityVisualBundle {
  sprite: Phaser.GameObjects.Sprite;
  nameLabel: Phaser.GameObjects.Text;
  subLabel: Phaser.GameObjects.Text;
  hpBg?: Phaser.GameObjects.Rectangle;
  hpFill?: Phaser.GameObjects.Rectangle;
  auraRing?: Phaser.GameObjects.Arc;
  telegraphRing?: Phaser.GameObjects.Arc;
}

const DIR_INDEX: Record<Direction, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3
};

const SPRITE_KEYS = [
  "hero_kiem_tu",
  "phi_de",
  "chatdvt",
  "merchant_truong",
  "hoa_tran",
  "dam_lon_tien_tu",
  "truc_lang",
  "thanh_lan_xa",
  "rmt_de",
  "vaal_de",
  "anh_7",
  "ngoc_tam"
] as const;

const MULTI_POSE_SPRITES = new Set<string>([
  "hero_kiem_tu",
  "phi_de",
  "dam_lon_tien_tu"
]);

const PROP_KEYS = [
  "prop_noodle_stall",
  "prop_than_dinh",
  "prop_portal_arch",
  "prop_bamboo_cluster",
  "prop_temple_pavilion",
  "prop_peach_tree",
  "prop_stone_lantern",
  "prop_spirit_herb"
] as const;

export class WorldScene extends Phaser.Scene {
  private net!: GameNetworkClient;
  private soundCtrl!: SoundController;
  private onInteractNpc!: (npc: LegendaryNpcDefinition) => void;

  private currentZoneId: ZoneId = "tan_thu_thon";
  private mapLayers: Array<Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer> = [];
  private collisionGrid: { width: number; height: number; data: number[] } = {
    width: 40,
    height: 30,
    data: []
  };

  private localX = 640;
  private localY = 512;
  private localDir: Direction = "down";
  private localAnim: AnimState = "idle";
  private attackAnimUntil = 0;
  private hurtAnimUntil = 0;
  private lastMoveSentAt = 0;
  private pointerTarget: { x: number; y: number } | null = null;
  private touchVector = { vx: 0, vy: 0 };

  private localVisual: EntityVisualBundle | null = null;
  private localAppearanceKey = "hero_kiem_tu";
  private remoteVisuals = new Map<string, EntityVisualBundle>();
  private remoteAppearanceKeys = new Map<string, string>();
  private npcVisuals = new Map<string, EntityVisualBundle>();
  private npcOverrideAnims = new Map<string, { state: AnimState; dir: Direction; until: number }>();
  private monsterVisuals = new Map<string, EntityVisualBundle>();
  private dropVisuals = new Map<
    string,
    { icon: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text; data: GroundLootSnapshot }
  >();
  private sceneProps: Phaser.GameObjects.GameObject[] = [];
  private portalSprites: Phaser.GameObjects.Sprite[] = [];
  private interactPromptText!: Phaser.GameObjects.Text;

  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    UP: Phaser.Input.Keyboard.Key;
    LEFT: Phaser.Input.Keyboard.Key;
    DOWN: Phaser.Input.Keyboard.Key;
    RIGHT: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
    K: Phaser.Input.Keyboard.Key;
    L: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    F: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: "WorldScene" });
  }

  public bindSystems(
    net: GameNetworkClient,
    soundCtrl: SoundController,
    onInteractNpc: (npc: LegendaryNpcDefinition) => void
  ): void {
    this.net = net;
    this.soundCtrl = soundCtrl;
    this.onInteractNpc = onInteractNpc;
  }

  preload(): void {
    this.load.image("bat_hoang_tileset", "/assets/tilesets/bat_hoang_tileset.png");
    this.load.tilemapTiledJSON("tan_thu_thon", "/maps/tan_thu_thon.tmj");
    this.load.tilemapTiledJSON("thanh_truc_lam", "/maps/thanh_truc_lam.tmj");

    for (const sk of SPRITE_KEYS) {
      const isMulti = MULTI_POSE_SPRITES.has(sk);
      this.load.spritesheet(sk, `/assets/sprites/${sk}.png`, {
        frameWidth: isMulti ? 80 : 48,
        frameHeight: isMulti ? 96 : 64
      });
    }

    for (const pk of PROP_KEYS) {
      this.load.image(pk, `/assets/props/${pk}.png`);
    }

    this.load.spritesheet("portal_ring", "/assets/vfx/portal_ring.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("phi_de_blessing", "/assets/vfx/phi_de_blessing.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("combat_vfx", "/assets/vfx/combat_vfx.png", {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create(): void {
    this.registerAnimations();
    this.setupInputs();

    this.interactPromptText = this.add
      .text(0, 0, "", {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#ffd452",
        backgroundColor: "rgba(10,14,22,0.88)",
        padding: { x: 6, y: 3 }
      })
      .setOrigin(0.5, 1)
      .setDepth(3500)
      .setVisible(false);

    const initialZone = this.net.selfState?.zoneId ?? this.net.getCurrentZoneId();
    if (this.net.selfState) {
      this.localX = this.net.selfState.x;
      this.localY = this.net.selfState.y;
      this.localDir = this.net.selfState.direction;
    }
    this.buildZoneWorld(initialZone);
    this.exposeDebugHooks();
  }

  private registerAnimations(): void {
    const baseStates: Array<{ name: AnimState; baseRow: number; count: number; rate: number; repeat: number }> = [
      { name: "idle", baseRow: 0, count: 4, rate: 5, repeat: -1 },
      { name: "walk", baseRow: 4, count: 6, rate: 9, repeat: -1 },
      { name: "attack", baseRow: 8, count: 4, rate: 11, repeat: 0 },
      { name: "cast", baseRow: 12, count: 4, rate: 9, repeat: 0 },
      { name: "hurt", baseRow: 16, count: 4, rate: 9, repeat: 0 }
    ];
    const dirs: Direction[] = ["down", "left", "right", "up"];

    for (const sk of SPRITE_KEYS) {
      const isMulti = MULTI_POSE_SPRITES.has(sk);
      for (const st of baseStates) {
        if (st.name === "hurt" && !isMulti) continue;
        for (const dir of dirs) {
          const row = st.baseRow + DIR_INDEX[dir];
          const animKey = `${sk}_${st.name}_${dir}`;
          if (!this.anims.exists(animKey)) {
            const frames: Phaser.Types.Animations.AnimationFrame[] = [];
            for (let i = 0; i < st.count; i++) {
              frames.push({ key: sk, frame: row * 6 + i });
            }
            this.anims.create({
              key: animKey,
              frames,
              frameRate: st.rate,
              repeat: st.repeat
            });
          }
        }
      }
    }

    if (!this.anims.exists("vfx_portal_spin")) {
      this.anims.create({
        key: "vfx_portal_spin",
        frames: this.anims.generateFrameNumbers("portal_ring", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }

    const vfxDefs: Array<{ key: string; row: number; rate: number; repeat: number }> = [
      { key: "vfx_slash_arc", row: 0, rate: 14, repeat: 0 },
      { key: "vfx_kiem_khi_ung", row: 1, rate: 12, repeat: 0 },
      { key: "vfx_ho_the_kim_quang", row: 2, rate: 10, repeat: 0 },
      { key: "vfx_lotus_cast", row: 3, rate: 10, repeat: 0 }
    ];
    for (const vd of vfxDefs) {
      if (!this.anims.exists(vd.key)) {
        this.anims.create({
          key: vd.key,
          frames: this.anims.generateFrameNumbers("combat_vfx", {
            start: vd.row * 4,
            end: vd.row * 4 + 3
          }),
          frameRate: vd.rate,
          repeat: vd.repeat
        });
      }
    }
  }

  private setupInputs(): void {
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        UP: Phaser.Input.Keyboard.KeyCodes.UP,
        LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
        DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
        RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        J: Phaser.Input.Keyboard.KeyCodes.J,
        K: Phaser.Input.Keyboard.KeyCodes.K,
        L: Phaser.Input.Keyboard.KeyCodes.L,
        E: Phaser.Input.Keyboard.KeyCodes.E,
        F: Phaser.Input.Keyboard.KeyCodes.F
      }) as typeof this.keys;

      this.keys.J.on("down", () => {
        if (this.isTypingInInput()) return;
        this.triggerSkill("basic_slash");
      });
      this.keys.K.on("down", () => {
        if (this.isTypingInInput()) return;
        this.triggerSkill("kiem_khi_ung");
      });
      this.keys.L.on("down", () => {
        if (this.isTypingInInput()) return;
        this.triggerSkill("ho_the_kim_quang");
      });
      this.keys.E.on("down", () => {
        if (this.isTypingInInput()) return;
        this.triggerContextualInteract();
      });
      this.keys.F.on("down", () => {
        if (this.isTypingInInput()) return;
        this.triggerPickupNearestDrop();
      });
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isTypingInInput()) return;
      if (this.net.isV02Mode() && !this.net.selfState) return;
      const worldPt = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.pointerTarget = { x: worldPt.x, y: worldPt.y };
    });
  }

  private isTypingInInput(): boolean {
    const active = document.activeElement;
    return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  }

  private resolvePlayerSpriteKey(appearanceId?: string): string {
    if (appearanceId && (SPRITE_KEYS as readonly string[]).includes(appearanceId)) {
      return appearanceId;
    }
    return "hero_kiem_tu";
  }

  private setVisualBundleVisible(b: EntityVisualBundle, visible: boolean): void {
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

  public setTouchVector(vx: number, vy: number): void {
    this.touchVector = { vx, vy };
  }

  public triggerSkill(skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang"): void {
    if (this.net.isV02Mode() && !this.net.selfState) return;
    this.localAnim = skillId === "basic_slash" ? "attack" : "cast";
    this.attackAnimUntil = this.time.now + 380;
    if (skillId === "basic_slash") {
      this.soundCtrl.playSlash();
    } else {
      this.soundCtrl.playSkill();
    }
    this.spawnSlashEffect(this.localX, this.localY, this.localDir, skillId);
    this.net.sendAttack(skillId, this.localDir);
  }

  public triggerContextualInteract(): void {
    if (this.net.isV02Mode() && !this.net.selfState) return;
    const zoneDef = ZONES_REGISTRY[this.currentZoneId];
    for (const portal of zoneDef.portals) {
      if (Math.hypot(this.localX - portal.x, this.localY - portal.y) <= portal.radiusPx) {
        this.soundCtrl.playPortal();
        this.net.sendPortal(portal.id);
        return;
      }
    }

    const zoneNpcs = LEGENDARY_NPCS.filter((n) => n.zoneId === this.currentZoneId);
    let nearest: { npc: LegendaryNpcDefinition; dist: number } | null = null;
    for (const npc of zoneNpcs) {
      const dist = Math.hypot(this.localX - npc.spawnX, this.localY - npc.spawnY);
      if (dist <= 135 && (!nearest || dist < nearest.dist)) {
        nearest = { npc, dist };
      }
    }
    if (nearest) {
      this.onInteractNpc(nearest.npc);
    }
  }

  public triggerPickupNearestDrop(): void {
    if (this.net.isV02Mode() && !this.net.selfState) return;
    let best: { id: string; dist: number } | null = null;
    for (const [dropId, vis] of this.dropVisuals.entries()) {
      const d = Math.hypot(this.localX - vis.data.x, this.localY - vis.data.y);
      if (d <= 105 && (!best || d < best.dist)) {
        best = { id: dropId, dist: d };
      }
    }
    if (best) {
      this.soundCtrl.playCoin();
      this.net.sendPickupDrop(best.id);
    }
  }

  public switchZone(zoneId: ZoneId, spawnX: number, spawnY: number): void {
    this.pointerTarget = null;
    this.localX = spawnX;
    this.localY = spawnY;
    this.buildZoneWorld(zoneId);
  }

  private clearZoneVisuals(): void {
    for (const l of this.mapLayers) {
      l.destroy();
    }
    this.mapLayers = [];

    for (const p of this.sceneProps) {
      p.destroy();
    }
    this.sceneProps = [];

    for (const ps of this.portalSprites) {
      ps.destroy();
    }
    this.portalSprites = [];

    for (const b of this.npcVisuals.values()) {
      this.destroyVisualBundle(b);
    }
    this.npcVisuals.clear();

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

  private destroyVisualBundle(b: EntityVisualBundle): void {
    b.sprite.destroy();
    b.nameLabel.destroy();
    b.subLabel.destroy();
    b.hpBg?.destroy();
    b.hpFill?.destroy();
    b.auraRing?.destroy();
    b.telegraphRing?.destroy();
  }

  private buildZoneWorld(zoneId: ZoneId): void {
    this.clearZoneVisuals();
    this.currentZoneId = zoneId;
    const zoneDef = ZONES_REGISTRY[zoneId];

    const map = this.add.tilemap(zoneId);
    const tileset = map.addTilesetImage("bat_hoang_tileset", "bat_hoang_tileset", 32, 32, 0, 0);

    const rawCached = this.cache.tilemap.get(zoneId)?.data as {
      width: number;
      height: number;
      layers: Array<{ name: string; data?: number[] }>;
    };
    const colLayerData = rawCached?.layers?.find((l) => l.name === "Collision")?.data;
    this.collisionGrid = {
      width: zoneDef.widthTiles,
      height: zoneDef.heightTiles,
      data: colLayerData ?? new Array(zoneDef.widthTiles * zoneDef.heightTiles).fill(0)
    };

    if (tileset) {
      const layerDepths: Array<{ name: string; depth: number }> = [
        { name: "Ground", depth: 1 },
        { name: "Paths", depth: 2 },
        { name: "GroundDetails", depth: 3 },
        { name: "Collision", depth: 4 },
        { name: "Interactables", depth: 5 },
        { name: "AbovePlayer", depth: 2200 }
      ];
      for (const ld of layerDepths) {
        const layer = map.createLayer(ld.name, tileset, 0, 0);
        if (layer) {
          layer.setDepth(ld.depth);
          this.mapLayers.push(layer);
        }
      }
    }

    this.placeHighCraftLandmarks(zoneId);

    for (const portal of zoneDef.portals) {
      const ring = this.add
        .sprite(portal.x, portal.y + 8, "portal_ring", 0)
        .setDepth(portal.y - 2)
        .play("vfx_portal_spin");
      const arch = this.add
        .image(portal.x, portal.y, "prop_portal_arch")
        .setOrigin(0.5, 0.85)
        .setDepth(portal.y);
      const label = this.add
        .text(portal.x, portal.y - 78, portal.labelVi, {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          color: "#63e6be",
          backgroundColor: "rgba(10,14,22,0.82)",
          padding: { x: 6, y: 2 }
        })
        .setOrigin(0.5, 0.5)
        .setDepth(portal.y + 100);
      this.portalSprites.push(ring);
      this.sceneProps.push(arch, label);
    }

    const npcsInZone = LEGENDARY_NPCS.filter((n) => n.zoneId === zoneId);
    for (const npc of npcsInZone) {
      const bundle = this.createVisualBundle(
        npc.spriteKey,
        npc.spawnX,
        npc.spawnY,
        npc.nameVi,
        `【${npc.realmDisplayVi}】`,
        "#ffd452",
        false
      );
      bundle.sprite.play(`${npc.spriteKey}_idle_down`, true);
      this.npcVisuals.set(npc.id, bundle);
    }

    const self = this.net.selfState;
    const desiredSpriteKey = this.resolvePlayerSpriteKey(
      self?.appearanceId ?? this.net.selfStateV02?.identity.appearanceId
    );
    if (!this.localVisual || this.localAppearanceKey !== desiredSpriteKey) {
      if (this.localVisual) {
        this.destroyVisualBundle(this.localVisual);
      }
      this.localAppearanceKey = desiredSpriteKey;
      this.localVisual = this.createVisualBundle(
        desiredSpriteKey,
        this.localX,
        this.localY,
        self?.nickname ?? "Đạo Hữu",
        formatRealmDisplay(self?.realmId ?? "pham_nhan", self?.realmStage ?? 1),
        "#63e6be",
        true
      );
    }
    const shouldShowAvatar = !this.net.isV02Mode() || Boolean(this.net.selfState);
    this.setVisualBundleVisible(this.localVisual, shouldShowAvatar);

    const worldW = zoneDef.widthTiles * zoneDef.tileSize;
    const worldH = zoneDef.heightTiles * zoneDef.tileSize;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.localVisual.sprite, true, 0.14, 0.14);
  }

  private placeHighCraftLandmarks(zoneId: ZoneId): void {
    const addProp = (key: string, x: number, y: number, scale = 1.0, depthOffset = 0) => {
      const img = this.add
        .image(x, y, key)
        .setOrigin(0.5, 0.9)
        .setScale(scale)
        .setDepth(y + depthOffset);
      this.sceneProps.push(img);
    };

    if (zoneId === "tan_thu_thon") {
      addProp("prop_temple_pavilion", 384, 240, 1.2);
      addProp("prop_temple_pavilion", 672, 240, 1.2);
      addProp("prop_temple_pavilion", 960, 272, 1.2);
      addProp("prop_noodle_stall", 352, 360, 1.0);
      addProp("prop_than_dinh", 536, 332, 0.85);
      addProp("prop_peach_tree", 208, 256, 1.05, 40);
      addProp("prop_peach_tree", 208, 620, 1.05, 40);
      addProp("prop_peach_tree", 910, 620, 1.05, 40);
      addProp("prop_peach_tree", 1072, 280, 1.05, 40);
      addProp("prop_stone_lantern", 336, 436, 0.85);
      addProp("prop_stone_lantern", 780, 436, 0.85);
      addProp("prop_stone_lantern", 1030, 436, 0.85);
      addProp("prop_stone_lantern", 1030, 545, 0.85);
    } else {
      const bambooCoords = [
        [270, 220],
        [410, 240],
        [540, 215],
        [810, 220],
        [1010, 240],
        [1160, 270],
        [280, 720],
        [460, 770],
        [910, 750],
        [1130, 720],
        [370, 610],
        [1070, 410]
      ];
      for (const [bx, by] of bambooCoords) {
        addProp("prop_bamboo_cluster", bx, by, 1.05, 36);
      }
      const herbCoords = [
        [464, 368],
        [848, 400],
        [784, 688],
        [1040, 592]
      ];
      for (const [hx, hy] of herbCoords) {
        addProp("prop_spirit_herb", hx, hy, 0.8);
      }
    }
  }

  private createVisualBundle(
    spriteKey: string,
    x: number,
    y: number,
    title: string,
    subtitle: string,
    nameColor: string,
    withHpBar: boolean
  ): EntityVisualBundle {
    const auraRing = this.add
      .circle(x, y - 4, 18, 0xffd43b, 0.14)
      .setStrokeStyle(1.5, 0xffd452, 0.75)
      .setDepth(y - 2)
      .setVisible(false);

    const telegraphRing = this.add
      .circle(x, y - 4, 48, 0xe03131, 0.18)
      .setStrokeStyle(2, 0xff6b6b, 0.9)
      .setDepth(y - 3)
      .setVisible(false);

    const isMulti = MULTI_POSE_SPRITES.has(spriteKey);
    const sprite = this.add
      .sprite(x, y, spriteKey, 0)
      .setOrigin(0.5, isMulti ? 0.9167 : 0.9)
      .setScale(isMulti ? 0.82 : 1.0)
      .setDepth(y);

    const subLabel = this.add
      .text(x, y - 68, subtitle, {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: "10px",
        color: "#ced4da",
        stroke: "#080b12",
        strokeThickness: 3
      })
      .setOrigin(0.5, 0.5)
      .setDepth(y + 120);

    const nameLabel = this.add
      .text(x, y - 55, title, {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: nameColor,
        stroke: "#080b12",
        strokeThickness: 3
      })
      .setOrigin(0.5, 0.5)
      .setDepth(y + 121);

    let hpBg: Phaser.GameObjects.Rectangle | undefined;
    let hpFill: Phaser.GameObjects.Rectangle | undefined;
    if (withHpBar) {
      hpBg = this.add
        .rectangle(x, y - 44, 38, 5, 0x0b0f17, 0.85)
        .setStrokeStyle(1, 0x343a40, 0.9)
        .setDepth(y + 118);
      hpFill = this.add
        .rectangle(x - 18, y - 44, 36, 3, 0x51cf66, 1)
        .setOrigin(0, 0.5)
        .setDepth(y + 119);
    }

    return { sprite, nameLabel, subLabel, hpBg, hpFill, auraRing, telegraphRing };
  }

  private updateVisualBundlePosition(
    b: EntityVisualBundle,
    x: number,
    y: number,
    hpRatio = 1,
    showAura = false,
    showTelegraph = false
  ): void {
    b.sprite.setPosition(x, y).setDepth(y);
    b.subLabel.setPosition(x, y - 68).setDepth(y + 120);
    b.nameLabel.setPosition(x, y - 55).setDepth(y + 121);
    if (b.hpBg && b.hpFill) {
      b.hpBg.setPosition(x, y - 44).setDepth(y + 118);
      b.hpFill
        .setPosition(x - 18, y - 44)
        .setSize(Math.max(0, Math.min(1, hpRatio)) * 36, 3)
        .setDepth(y + 119);
    }
    if (b.auraRing) {
      b.auraRing.setPosition(x, y - 4).setDepth(y - 2).setVisible(showAura);
    }
    if (b.telegraphRing) {
      b.telegraphRing.setPosition(x, y - 4).setDepth(y - 3).setVisible(showTelegraph);
    }
  }

  public syncSelfState(state: CharacterSaveState): void {
    if (state.zoneId !== this.currentZoneId && this.scene.isActive()) {
      this.buildZoneWorld(state.zoneId);
    }
    if (Math.hypot(state.x - this.localX, state.y - this.localY) > 72) {
      this.localX = state.x;
      this.localY = state.y;
    }
    const desiredSpriteKey = this.resolvePlayerSpriteKey(state.appearanceId);
    if (this.localVisual && this.localAppearanceKey !== desiredSpriteKey && this.scene.isActive()) {
      this.destroyVisualBundle(this.localVisual);
      this.localAppearanceKey = desiredSpriteKey;
      this.localVisual = this.createVisualBundle(
        desiredSpriteKey,
        this.localX,
        this.localY,
        state.nickname,
        `【${formatRealmDisplay(state.realmId, state.realmStage)}】`,
        "#63e6be",
        true
      );
      this.cameras.main.startFollow(this.localVisual.sprite, true, 0.14, 0.14);
    }
    if (this.localVisual) {
      this.setVisualBundleVisible(this.localVisual, true);
      this.localVisual.nameLabel.setText(state.nickname);
      this.localVisual.subLabel.setText(
        `【${formatRealmDisplay(state.realmId, state.realmStage)}】`
      );
    }
  }

  public syncWorldSnapshot(snapshot: RoomWorldSnapshot): void {
    if (!this.scene.isActive() || snapshot.zoneId !== this.currentZoneId) {
      return;
    }

    const myCharId = this.net.selfState?.characterId;
    const seenRemoteIds = new Set<string>();

    for (const [charId, rp] of Object.entries(snapshot.players)) {
      if (charId === myCharId) continue;
      seenRemoteIds.add(charId);
      const remoteSpriteKey = this.resolvePlayerSpriteKey(rp.appearanceId);
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
      const animKey = `${remoteSpriteKey}_${rp.anim}_${rp.direction}`;
      if (this.anims.exists(animKey)) {
        vis.sprite.play(animKey, true);
      }
    }

    for (const [charId, vis] of this.remoteVisuals.entries()) {
      if (!seenRemoteIds.has(charId)) {
        this.destroyVisualBundle(vis);
        this.remoteVisuals.delete(charId);
        this.remoteAppearanceKeys.delete(charId);
      }
    }

    const seenMonsters = new Set<string>();
    for (const [instId, m] of Object.entries(snapshot.monsters)) {
      seenMonsters.add(instId);
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
        const animKey = `${spriteKey}_${mAnimState}_${m.direction}`;
        if (this.anims.exists(animKey)) {
          vis.sprite.play(animKey, true);
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
        const icon = this.add
          .sprite(d.x, d.y, "portal_ring", 1)
          .setScale(0.45)
          .setDepth(d.y - 1);
        const itemDef = ITEMS_REGISTRY[d.itemId];
        const label = this.add
          .text(d.x, d.y - 22, `[F] ${itemDef?.nameVi ?? d.itemId}`, {
            fontFamily: "Be Vietnam Pro, sans-serif",
            fontSize: "10px",
            fontStyle: "bold",
            color: "#ffd452",
            backgroundColor: "rgba(10,14,22,0.85)",
            padding: { x: 4, y: 2 }
          })
          .setOrigin(0.5, 0.5)
          .setDepth(d.y + 80);
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

  public playCombatEventVisual(ev: CombatEventPayload): void {
    if (!this.scene.isActive()) return;
    if (ev.targetId === this.net.selfState?.characterId) {
      this.hurtAnimUntil = this.time.now + 380;
    }
    const hitSpark = this.add
      .sprite(ev.x, ev.y - 22, "combat_vfx", 4)
      .setScale(0.85)
      .setDepth(ev.y + 110);
    hitSpark.play("vfx_kiem_khi_ung");
    hitSpark.once("animationcomplete", () => hitSpark.destroy());

    const isKill = ev.killed;
    const dmgText = this.add
      .text(ev.x, ev.y - 36, isKill ? `-${ev.damage} TRẢM!` : `-${ev.damage}`, {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: isKill ? "15px" : "13px",
        fontStyle: "bold",
        color: isKill ? "#ffd452" : "#ff6b6b",
        stroke: "#080b12",
        strokeThickness: 3
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3200);

    this.tweens.add({
      targets: dmgText,
      y: ev.y - 72,
      alpha: 0,
      duration: 720,
      ease: "Cubic.easeOut",
      onComplete: () => dmgText.destroy()
    });
  }

  public playCeremonyEffect(): void {
    if (!this.scene.isActive()) return;
    this.soundCtrl.playCeremony();
    const ring = this.add
      .sprite(this.localX, this.localY - 16, "combat_vfx", 12)
      .setScale(1.4)
      .setDepth(this.localY + 150);
    ring.play("vfx_lotus_cast");
    this.tweens.add({
      targets: ring,
      scale: 2.2,
      alpha: 0,
      duration: 1100,
      onComplete: () => ring.destroy()
    });
  }

  private spawnSlashEffect(x: number, y: number, dir: Direction, skillId: string): void {
    const offsetMap: Record<Direction, { dx: number; dy: number; rot: number }> = {
      down: { dx: 0, dy: 28, rot: Math.PI / 2 },
      up: { dx: 0, dy: -28, rot: -Math.PI / 2 },
      left: { dx: -28, dy: 0, rot: Math.PI },
      right: { dx: 28, dy: 0, rot: 0 }
    };
    const off = offsetMap[dir];
    if (skillId === "ho_the_kim_quang") {
      const shield = this.add
        .sprite(x, y - 20, "combat_vfx", 8)
        .setScale(1.25)
        .setDepth(y + 95);
      shield.play("vfx_ho_the_kim_quang");
      this.tweens.add({
        targets: shield,
        scale: 1.5,
        alpha: 0,
        duration: 460,
        onComplete: () => shield.destroy()
      });
      return;
    }

    const animKey = skillId === "basic_slash" ? "vfx_slash_arc" : "vfx_kiem_khi_ung";
    const startFrame = skillId === "basic_slash" ? 0 : 4;
    const fx = this.add
      .sprite(x + off.dx, y - 20 + off.dy, "combat_vfx", startFrame)
      .setRotation(skillId === "basic_slash" ? off.rot : 0)
      .setScale(skillId === "basic_slash" ? 1.05 : 1.3)
      .setDepth(y + 95);
    fx.play(animKey);
    fx.once("animationcomplete", () => fx.destroy());
  }

  private isWalkableLocal(worldX: number, worldY: number): boolean {
    const tx = Math.floor(worldX / 32);
    const ty = Math.floor(worldY / 32);
    if (
      tx < 1 ||
      ty < 1 ||
      tx >= this.collisionGrid.width - 1 ||
      ty >= this.collisionGrid.height - 1
    ) {
      return false;
    }
    const cell = this.collisionGrid.data[ty * this.collisionGrid.width + tx] ?? 0;
    return cell === 0;
  }

  update(_time: number, delta: number): void {
    if (!this.localVisual) return;
    if (this.net.isV02Mode() && !this.net.selfState) {
      this.setVisualBundleVisible(this.localVisual, false);
      this.interactPromptText.setVisible(false);
      return;
    }
    this.setVisualBundleVisible(this.localVisual, true);

    let vx = this.touchVector.vx;
    let vy = this.touchVector.vy;

    if (this.keys && !this.isTypingInInput()) {
      if (this.keys.A.isDown || this.keys.LEFT.isDown) vx -= 1;
      if (this.keys.D.isDown || this.keys.RIGHT.isDown) vx += 1;
      if (this.keys.W.isDown || this.keys.UP.isDown) vy -= 1;
      if (this.keys.S.isDown || this.keys.DOWN.isDown) vy += 1;
    }

    if (vx !== 0 || vy !== 0) {
      this.pointerTarget = null;
    } else if (this.pointerTarget) {
      const dx = this.pointerTarget.x - this.localX;
      const dy = this.pointerTarget.y - this.localY;
      const d = Math.hypot(dx, dy);
      if (d > 10) {
        vx = dx / d;
        vy = dy / d;
      } else {
        this.pointerTarget = null;
      }
    }

    const speed = 155;
    let moved = false;
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      const nx = vx / len;
      const ny = vy / len;
      if (Math.abs(nx) > Math.abs(ny)) {
        this.localDir = nx < 0 ? "left" : "right";
      } else {
        this.localDir = ny < 0 ? "up" : "down";
      }
      const step = (speed * delta) / 1000;
      const tryX = this.localX + nx * step;
      const tryY = this.localY + ny * step;
      if (this.isWalkableLocal(tryX, tryY)) {
        this.localX = tryX;
        this.localY = tryY;
        moved = true;
      } else if (this.isWalkableLocal(tryX, this.localY)) {
        this.localX = tryX;
        moved = true;
      } else if (this.isWalkableLocal(this.localX, tryY)) {
        this.localY = tryY;
        moved = true;
      }
    }

    if (this.time.now < this.attackAnimUntil) {
      this.localAnim = this.localAnim === "cast" ? "cast" : "attack";
    } else if (this.time.now < this.hurtAnimUntil) {
      this.localAnim = "hurt";
    } else {
      this.localAnim = moved ? "walk" : "idle";
    }

    const self = this.net.selfState;
    const hasBlessing = Boolean(
      self?.quests.phi_de_ch1_huong_thom?.status === "completed" ||
        self?.buffs.some((b) => b.slot === "blessing")
    );
    this.updateVisualBundlePosition(
      this.localVisual,
      this.localX,
      this.localY,
      (self?.hp ?? 100) / Math.max(1, self?.maxHp ?? 100),
      hasBlessing,
      false
    );
    const animKey = `${this.localAppearanceKey}_${this.localAnim}_${this.localDir}`;
    if (this.anims.exists(animKey)) {
      this.localVisual.sprite.play(animKey, true);
    }

    const npcsInZone = LEGENDARY_NPCS.filter((n) => n.zoneId === this.currentZoneId);
    for (const npc of npcsInZone) {
      const b = this.npcVisuals.get(npc.id);
      if (!b) continue;
      const ov = this.npcOverrideAnims.get(npc.id);
      if (ov && this.time.now < ov.until) {
        const k = `${npc.spriteKey}_${ov.state}_${ov.dir}`;
        if (this.anims.exists(k)) {
          b.sprite.play(k, true);
        }
        continue;
      }
      const dist = Math.hypot(this.localX - npc.spawnX, this.localY - npc.spawnY);
      let nDir: Direction = "down";
      if (dist <= 165) {
        const dx = this.localX - npc.spawnX;
        const dy = this.localY - npc.spawnY;
        if (Math.abs(dx) > Math.abs(dy)) {
          nDir = dx < 0 ? "left" : "right";
        } else {
          nDir = dy < 0 ? "up" : "down";
        }
      }
      const k = `${npc.spriteKey}_idle_${nDir}`;
      if (this.anims.exists(k)) {
        b.sprite.play(k, true);
      }
    }

    if (this.time.now - this.lastMoveSentAt >= 65) {
      this.lastMoveSentAt = this.time.now;
      this.net.sendMove(this.localX, this.localY, vx, vy, this.localDir);
    }

    this.updateInteractPrompt();
  }

  private updateInteractPrompt(): void {
    const zoneDef = ZONES_REGISTRY[this.currentZoneId];
    for (const portal of zoneDef.portals) {
      if (Math.hypot(this.localX - portal.x, this.localY - portal.y) <= portal.radiusPx) {
        this.interactPromptText
          .setText(`[E] ${portal.labelVi}`)
          .setPosition(portal.x, portal.y - 96)
          .setVisible(true);
        return;
      }
    }

    const npcsInZone = LEGENDARY_NPCS.filter((n) => n.zoneId === this.currentZoneId);
    for (const npc of npcsInZone) {
      if (Math.hypot(this.localX - npc.spawnX, this.localY - npc.spawnY) <= 125) {
        this.interactPromptText
          .setText(`[E] Đàm Đạo: ${npc.nameVi}`)
          .setPosition(npc.spawnX, npc.spawnY - 82)
          .setVisible(true);
        return;
      }
    }

    this.interactPromptText.setVisible(false);
  }

  private exposeDebugHooks(): void {
    const win = window as unknown as Record<string, unknown>;
    win.render_game_to_text = () => {
      const self = this.net.selfState;
      const snap = this.net.worldSnapshot;
      return JSON.stringify({
        zoneId: this.currentZoneId,
        zoneNameVi: ZONES_REGISTRY[this.currentZoneId].nameVi,
        v02Mode: this.net.isV02Mode(),
        v02Character: this.net.selfStateV02,
        v02ActiveRollDraft: this.net.activeRollDraft,
        localAvatarVisible: Boolean(this.localVisual?.sprite.visible),
        localAppearanceKey: this.localAppearanceKey,
        localPlayer: {
          accountId: this.net.getAccountId(),
          nickname: self?.nickname ?? "",
          appearanceId: self?.appearanceId ?? this.localAppearanceKey,
          level: self?.level ?? this.net.selfStateV02?.levelProgress.level ?? 1,
          x: Math.round(this.localX),
          y: Math.round(this.localY),
          direction: this.localDir,
          anim: this.localAnim,
          spriteAnimKey: this.localVisual?.sprite.anims.currentAnim?.key ?? "",
          spriteFrameIndex: this.localVisual?.sprite.anims.currentFrame?.index ?? 0,
          realmId: self?.realmId ?? "pham_nhan",
          realmStage: self?.realmStage ?? 1,
          tuVi: self?.tuVi ?? 0,
          linhThach: self?.linhThach ?? 0,
          hp: self?.hp ?? 0,
          maxHp: self?.maxHp ?? 0,
          inventory: self?.inventory ?? [],
          quests: self?.quests ?? {},
          buffs: self?.buffs ?? []
        },
        remotePlayers: Object.values(snap?.players ?? {}).filter(
          (p: RemotePlayerSnapshot) => p.characterId !== self?.characterId
        ),
        monsters: Object.values(snap?.monsters ?? {}).map((m: MonsterSnapshot) => ({
          instanceId: m.instanceId,
          monsterId: m.monsterId,
          name: m.name,
          x: m.x,
          y: m.y,
          hp: m.hp,
          maxHp: m.maxHp,
          state: m.state
        })),
        drops: Object.values(snap?.drops ?? {})
      });
    };

    win.__TONG_MON_DEBUG__ = {
      teleportLocal: (x: number, y: number, dir?: Direction) => {
        if (dir) {
          this.localDir = dir;
        }
        const steps = Math.max(1, Math.ceil(Math.hypot(x - this.localX, y - this.localY) / 48));
        const sx = this.localX;
        const sy = this.localY;
        for (let i = 1; i <= steps; i++) {
          const ix = sx + ((x - sx) * i) / steps;
          const iy = sy + ((y - sy) * i) / steps;
          this.localX = ix;
          this.localY = iy;
          this.net.sendMove(ix, iy, 0, 0, this.localDir);
        }
      },
      setLocalDir: (dir: Direction) => {
        this.localDir = dir;
        this.net.sendMove(this.localX, this.localY, 0, 0, this.localDir);
      },
      triggerHurt: () => {
        this.hurtAnimUntil = this.time.now + 550;
      },
      setNpcAnim: (npcId: string, state: AnimState, dir: Direction, durationMs = 2000) => {
        this.npcOverrideAnims.set(npcId, {
          state,
          dir,
          until: this.time.now + durationMs
        });
        const npc = LEGENDARY_NPCS.find((n) => n.id === npcId);
        if (npc && state === "cast") {
          const fx = this.add
            .sprite(npc.spawnX, npc.spawnY - 18, "combat_vfx", 12)
            .setScale(1.25)
            .setDepth(npc.spawnY + 95);
          fx.play("vfx_lotus_cast");
          fx.once("animationcomplete", () => fx.destroy());
        } else if (npc && state === "attack") {
          this.spawnSlashEffect(npc.spawnX, npc.spawnY, dir, "kiem_khi_ung");
        }
      },
      interact: () => this.triggerContextualInteract(),
      attack: (skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang" = "basic_slash") =>
        this.triggerSkill(skillId),
      pickup: () => this.triggerPickupNearestDrop()
    };
  }
}
