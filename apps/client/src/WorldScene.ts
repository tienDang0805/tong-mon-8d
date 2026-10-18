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
import type { HudOverlayController } from "./hud.js";
import { CameraView, type CameraTelemetry } from "./game/world/CameraView.js";

export type SpriteProfileKind =
  | "full_80x96_20row"
  | "locomotion_80x96_8row"
  | "stationary_npc_80x96_4f"
  | "legacy_48x64_16row";

export interface SpriteProfileDef {
  spriteKey: string;
  kind: SpriteProfileKind;
  frameWidth: number;
  frameHeight: number;
  supportedStates: Array<"idle" | "walk" | "attack" | "cast" | "hurt">;
  supportedDirections: Direction[];
}

export interface ResolvedSpriteAnimation {
  spriteKey: string;
  animKey: string;
  requestedState: string;
  requestedDir: Direction;
  actualState: string;
  actualDir: Direction;
  isFallback: boolean;
  fallbackReason: string | null;
}

export const SPRITE_PROFILES: Record<string, SpriteProfileDef> = {
  hero_kiem_tu: {
    spriteKey: "hero_kiem_tu",
    kind: "full_80x96_20row",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle", "walk", "attack", "cast", "hurt"],
    supportedDirections: ["down", "left", "right", "up"]
  },
  hoa_tran: {
    spriteKey: "hoa_tran",
    kind: "locomotion_80x96_8row",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle", "walk"],
    supportedDirections: ["down", "left", "right", "up"]
  },
  ngoc_tam: {
    spriteKey: "ngoc_tam",
    kind: "locomotion_80x96_8row",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle", "walk"],
    supportedDirections: ["down", "left", "right", "up"]
  },
  anh_7: {
    spriteKey: "anh_7",
    kind: "locomotion_80x96_8row",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle", "walk"],
    supportedDirections: ["down", "left", "right", "up"]
  },
  chatdvt: {
    spriteKey: "chatdvt",
    kind: "locomotion_80x96_8row",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle", "walk"],
    supportedDirections: ["down", "left", "right", "up"]
  },
  phi_de: {
    spriteKey: "phi_de",
    kind: "stationary_npc_80x96_4f",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle"],
    supportedDirections: ["down"]
  },
  rmt_de: {
    spriteKey: "rmt_de",
    kind: "stationary_npc_80x96_4f",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle"],
    supportedDirections: ["down"]
  },
  merchant_truong: {
    spriteKey: "merchant_truong",
    kind: "stationary_npc_80x96_4f",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle"],
    supportedDirections: ["down"]
  },
  dam_lon_tien_tu: {
    spriteKey: "dam_lon_tien_tu",
    kind: "stationary_npc_80x96_4f",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle"],
    supportedDirections: ["down"]
  },
  npc_ngoc_tam: {
    spriteKey: "npc_ngoc_tam",
    kind: "stationary_npc_80x96_4f",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle"],
    supportedDirections: ["down"]
  },
  thai_tai: {
    spriteKey: "thai_tai",
    kind: "stationary_npc_80x96_4f",
    frameWidth: 80,
    frameHeight: 96,
    supportedStates: ["idle"],
    supportedDirections: ["down"]
  },
  vaal_de: {
    spriteKey: "vaal_de",
    kind: "legacy_48x64_16row",
    frameWidth: 48,
    frameHeight: 64,
    supportedStates: ["idle", "walk", "attack", "cast"],
    supportedDirections: ["down", "left", "right", "up"]
  },
  truc_lang: {
    spriteKey: "truc_lang",
    kind: "legacy_48x64_16row",
    frameWidth: 48,
    frameHeight: 64,
    supportedStates: ["idle", "walk", "attack", "cast"],
    supportedDirections: ["down", "left", "right", "up"]
  },
  thanh_lan_xa: {
    spriteKey: "thanh_lan_xa",
    kind: "legacy_48x64_16row",
    frameWidth: 48,
    frameHeight: 64,
    supportedStates: ["idle", "walk", "attack", "cast"],
    supportedDirections: ["down", "left", "right", "up"]
  }
};

interface EntityVisualBundle {
  sprite: Phaser.GameObjects.Sprite;
  nameLabel: Phaser.GameObjects.Text;
  subLabel: Phaser.GameObjects.Text;
  hpBg?: Phaser.GameObjects.Rectangle;
  hpFill?: Phaser.GameObjects.Rectangle;
  auraRing?: Phaser.GameObjects.Arc;
  telegraphRing?: Phaser.GameObjects.Arc;
}

const PROP_KEYS = [
  "building_tu_duong",
  "building_tan_thu_tu_duong",
  "building_tu_bao_cac",
  "building_hong_tran_cac",
  "prop_than_dinh",
  "prop_noodle_stall",
  "prop_portal_arch",
  "prop_bamboo_cluster",
  "prop_temple_pavilion",
  "prop_peach_tree",
  "prop_stone_lantern",
  "prop_spirit_herb",
  "prop_arched_bridge",
  "prop_bridge_horizontal",
  "prop_village_stele",
  "prop_incense_brazier",
  "prop_jade_rock",
  "prop_wooden_fence"
] as const;

export class WorldScene extends Phaser.Scene {
  private net!: GameNetworkClient;
  private soundCtrl!: SoundController;
  private onInteractNpc!: (npc: LegendaryNpcDefinition) => void;
  private getHud: () => HudOverlayController | null = () => null;
  private cameraView!: CameraView;

  private currentZoneId: ZoneId = "tan_thu_thon";
  private mapLayers: Array<Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer> = [];
  private collisionGrid: { width: number; height: number; data: number[] } = {
    width: 96,
    height: 72,
    data: []
  };

  private localX = 1552;
  private localY = 1232;
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
  private animFallbackLog: ResolvedSpriteAnimation[] = [];
  private worldPropMetadata: Array<{
    id: string;
    propKey: string;
    x: number;
    baseY: number;
    depth: number;
    category: "surface_bridge" | "vertical_occluder";
  }> = [];

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
    BRACKET_LEFT: Phaser.Input.Keyboard.Key;
    BRACKET_RIGHT: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: "WorldScene" });
  }

  public bindSystems(
    net: GameNetworkClient,
    soundCtrl: SoundController,
    onInteractNpc: (npc: LegendaryNpcDefinition) => void,
    getHud?: () => HudOverlayController | null
  ): void {
    this.net = net;
    this.soundCtrl = soundCtrl;
    this.onInteractNpc = onInteractNpc;
    if (getHud) {
      this.getHud = getHud;
    }
  }

  preload(): void {
    this.load.image(
      "tan_thu_thon_v01b_tileset_32x32",
      "/assets/tilesets/tan_thu_thon_v01b_tileset_32x32.png"
    );
    this.load.image("bat_hoang_tileset", "/assets/tilesets/bat_hoang_tileset.png");
    this.load.tilemapTiledJSON("tan_thu_thon", "/maps/tan_thu_thon.tmj");
    this.load.tilemapTiledJSON("thanh_truc_lam", "/maps/thanh_truc_lam.tmj");

    for (const def of Object.values(SPRITE_PROFILES)) {
      this.load.spritesheet(def.spriteKey, `/assets/sprites/${def.spriteKey}.png`, {
        frameWidth: def.frameWidth,
        frameHeight: def.frameHeight
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
    this.cameraView = new CameraView(this);
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
      .setDepth(4600)
      .setVisible(false);

    const initialZone = this.net.selfState?.zoneId ?? this.net.getCurrentZoneId();
    const zoneDef = ZONES_REGISTRY[initialZone];
    this.localX = this.net.selfState?.x ?? zoneDef.defaultSpawn.x;
    this.localY = this.net.selfState?.y ?? zoneDef.defaultSpawn.y;
    this.localDir = this.net.selfState?.direction ?? "down";

    this.buildZoneWorld(initialZone);

    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      this.cameraView.applyResponsiveViewport(gameSize.width, gameSize.height, true);
      this.syncMinimapOverlay();
    });

    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _currentlyOver: Phaser.GameObjects.GameObject[],
        _dx: number,
        dy: number
      ) => {
        if (dy < 0) {
          this.cameraView.stepZoom(1);
        } else if (dy > 0) {
          this.cameraView.stepZoom(-1);
        }
        this.syncMinimapOverlay();
      }
    );

    this.exposeDebugHooks();
  }

  public resolveSpriteAnim(
    spriteKey: string,
    requestedState: "idle" | "walk" | "attack" | "cast" | "hurt",
    requestedDir: Direction
  ): ResolvedSpriteAnimation {
    const profile = SPRITE_PROFILES[spriteKey] ?? SPRITE_PROFILES.hero_kiem_tu!;
    const sk = profile.spriteKey;

    if (profile.kind === "stationary_npc_80x96_4f") {
      const isFallback = requestedState !== "idle" || requestedDir !== "down";
      const resolved: ResolvedSpriteAnimation = {
        spriteKey: sk,
        animKey: `${sk}_idle_down`,
        requestedState,
        requestedDir,
        actualState: "idle",
        actualDir: "down",
        isFallback,
        fallbackReason: isFallback ? "STATIONARY_NPC_SINGLE_IDLE_DOWN_STRIP" : null
      };
      if (isFallback && this.animFallbackLog.length < 64) {
        this.animFallbackLog.push(resolved);
      }
      return resolved;
    }

    if (profile.kind === "locomotion_80x96_8row") {
      const actualState =
        requestedState === "walk" || requestedState === "idle" ? requestedState : "idle";
      const isFallback = actualState !== requestedState;
      const resolved: ResolvedSpriteAnimation = {
        spriteKey: sk,
        animKey: `${sk}_${actualState}_${requestedDir}`,
        requestedState,
        requestedDir,
        actualState,
        actualDir: requestedDir,
        isFallback,
        fallbackReason: isFallback ? "S3_COMBAT_ACTION_SHEET_DEFERRED" : null
      };
      if (isFallback && this.animFallbackLog.length < 64) {
        this.animFallbackLog.push(resolved);
      }
      return resolved;
    }

    if (profile.kind === "legacy_48x64_16row") {
      const actualState = requestedState === "hurt" ? "idle" : requestedState;
      const isFallback = actualState !== requestedState;
      const resolved: ResolvedSpriteAnimation = {
        spriteKey: sk,
        animKey: `${sk}_${actualState}_${requestedDir}`,
        requestedState,
        requestedDir,
        actualState,
        actualDir: requestedDir,
        isFallback,
        fallbackReason: isFallback ? "LEGACY_16ROW_NO_HURT_ROW" : null
      };
      if (isFallback && this.animFallbackLog.length < 64) {
        this.animFallbackLog.push(resolved);
      }
      return resolved;
    }

    return {
      spriteKey: sk,
      animKey: `${sk}_${requestedState}_${requestedDir}`,
      requestedState,
      requestedDir,
      actualState: requestedState,
      actualDir: requestedDir,
      isFallback: false,
      fallbackReason: null
    };
  }

  private registerAnimations(): void {
    const dirs: Direction[] = ["down", "left", "right", "up"];

    for (const profile of Object.values(SPRITE_PROFILES)) {
      const sk = profile.spriteKey;
      if (profile.kind === "stationary_npc_80x96_4f") {
        if (!this.anims.exists(`${sk}_idle_down`)) {
          this.anims.create({
            key: `${sk}_idle_down`,
            frames: this.anims.generateFrameNumbers(sk, { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
          });
        }
        continue;
      }

      if (profile.kind === "locomotion_80x96_8row") {
        dirs.forEach((dir, dIdx) => {
          const idleRow = dIdx;
          const walkRow = 4 + dIdx;
          if (!this.anims.exists(`${sk}_idle_${dir}`)) {
            this.anims.create({
              key: `${sk}_idle_${dir}`,
              frames: this.anims.generateFrameNumbers(sk, {
                start: idleRow * 6,
                end: idleRow * 6 + 3
              }),
              frameRate: 5,
              repeat: -1
            });
          }
          if (!this.anims.exists(`${sk}_walk_${dir}`)) {
            this.anims.create({
              key: `${sk}_walk_${dir}`,
              frames: this.anims.generateFrameNumbers(sk, {
                start: walkRow * 6,
                end: walkRow * 6 + 5
              }),
              frameRate: 9,
              repeat: -1
            });
          }
        });
        continue;
      }

      const isFull20Row = profile.kind === "full_80x96_20row";
      dirs.forEach((dir, dIdx) => {
        const idleRow = dIdx;
        const walkRow = 4 + dIdx;
        const atkRow = 8 + dIdx;
        const castRow = 12 + dIdx;
        const hurtRow = 16 + dIdx;

        if (!this.anims.exists(`${sk}_idle_${dir}`)) {
          this.anims.create({
            key: `${sk}_idle_${dir}`,
            frames: this.anims.generateFrameNumbers(sk, {
              start: idleRow * 6,
              end: idleRow * 6 + 3
            }),
            frameRate: 5,
            repeat: -1
          });
        }
        if (!this.anims.exists(`${sk}_walk_${dir}`)) {
          this.anims.create({
            key: `${sk}_walk_${dir}`,
            frames: this.anims.generateFrameNumbers(sk, {
              start: walkRow * 6,
              end: walkRow * 6 + 5
            }),
            frameRate: 9,
            repeat: -1
          });
        }
        if (!this.anims.exists(`${sk}_attack_${dir}`)) {
          this.anims.create({
            key: `${sk}_attack_${dir}`,
            frames: this.anims.generateFrameNumbers(sk, {
              start: atkRow * 6,
              end: atkRow * 6 + 3
            }),
            frameRate: 11,
            repeat: 0
          });
        }
        if (!this.anims.exists(`${sk}_cast_${dir}`)) {
          this.anims.create({
            key: `${sk}_cast_${dir}`,
            frames: this.anims.generateFrameNumbers(sk, {
              start: castRow * 6,
              end: castRow * 6 + 3
            }),
            frameRate: 9,
            repeat: 0
          });
        }
        if (isFull20Row && !this.anims.exists(`${sk}_hurt_${dir}`)) {
          this.anims.create({
            key: `${sk}_hurt_${dir}`,
            frames: this.anims.generateFrameNumbers(sk, {
              start: hurtRow * 6,
              end: hurtRow * 6 + 3
            }),
            frameRate: 9,
            repeat: 0
          });
        }
      });
    }

    if (!this.anims.exists("vfx_portal_spin")) {
      this.anims.create({
        key: "vfx_portal_spin",
        frames: this.anims.generateFrameNumbers("portal_ring", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!this.anims.exists("vfx_blessing_pulse")) {
      this.anims.create({
        key: "vfx_blessing_pulse",
        frames: this.anims.generateFrameNumbers("phi_de_blessing", { start: 0, end: 3 }),
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
        F: Phaser.Input.Keyboard.KeyCodes.F,
        BRACKET_LEFT: Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET,
        BRACKET_RIGHT: Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET
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
      this.keys.BRACKET_LEFT.on("down", () => {
        if (this.isTypingInInput()) return;
        this.cameraView.stepZoom(-1);
        this.syncMinimapOverlay();
      });
      this.keys.BRACKET_RIGHT.on("down", () => {
        if (this.isTypingInInput()) return;
        this.cameraView.stepZoom(1);
        this.syncMinimapOverlay();
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
    if (appearanceId && SPRITE_PROFILES[appearanceId]) {
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
    this.worldPropMetadata = [];

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

  public buildZoneWorld(zoneId: ZoneId): void {
    this.clearZoneVisuals();
    this.currentZoneId = zoneId;
    const zoneDef = ZONES_REGISTRY[zoneId];

    const map = this.add.tilemap(zoneId);
    const tilesetName =
      zoneId === "tan_thu_thon" ? "tan_thu_thon_v01b_tileset_32x32" : "bat_hoang_tileset";
    const tileset = map.addTilesetImage(tilesetName, tilesetName, 32, 32, 0, 0);

    const rawCached = this.cache.tilemap.get(zoneId)?.data as {
      width: number;
      height: number;
      layers: Array<{ name: string; data?: number[] }>;
    };
    const colLayerData = rawCached?.layers?.find((l) => l.name === "Collision")?.data;
    const groundLayerData = rawCached?.layers?.find((l) => l.name === "Ground")?.data;
    const pathsLayerData = rawCached?.layers?.find((l) => l.name === "Paths")?.data;

    this.collisionGrid = {
      width: zoneDef.widthTiles,
      height: zoneDef.heightTiles,
      data: colLayerData ?? new Array(zoneDef.widthTiles * zoneDef.heightTiles).fill(0)
    };

    if (tileset) {
      const layerDepths: Array<{ name: string; depth: number; visible?: boolean }> = [
        { name: "Ground", depth: 1 },
        { name: "Paths", depth: 2 },
        { name: "GroundDetails", depth: 3 },
        { name: "Collision", depth: 4, visible: false },
        { name: "Interactables", depth: 5 },
        { name: "Portals", depth: 5 },
        { name: "AbovePlayer", depth: 4000 }
      ];
      for (const ld of layerDepths) {
        const layer = map.createLayer(ld.name, tileset, 0, 0);
        if (layer) {
          layer.setDepth(ld.depth);
          if (ld.visible === false) {
            layer.setVisible(false);
          }
          this.mapLayers.push(layer);
        }
      }
    }

    this.getHud()?.setMinimapStaticTileData({
      zoneId,
      widthTiles: zoneDef.widthTiles,
      heightTiles: zoneDef.heightTiles,
      tileSize: zoneDef.tileSize,
      groundGids: groundLayerData ?? new Array(zoneDef.widthTiles * zoneDef.heightTiles).fill(1),
      pathsGids: pathsLayerData ?? new Array(zoneDef.widthTiles * zoneDef.heightTiles).fill(0),
      collisionGids: this.collisionGrid.data
    });

    this.placeHighCraftLandmarks(zoneId);

    for (const portal of zoneDef.portals) {
      const ring = this.add
        .sprite(portal.x, portal.y + 8, "portal_ring", 0)
        .setDepth(7)
        .play("vfx_portal_spin");
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
        .setDepth(portal.y + 0.4);
      this.portalSprites.push(ring);
      this.sceneProps.push(label);
    }

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
      const resolved = this.resolveSpriteAnim(npc.spriteKey, "idle", "down");
      bundle.sprite.play(resolved.animKey, true);
      this.npcVisuals.set(npc.id, bundle);
    }

    const self = this.net.selfState;
    if (self && self.zoneId === zoneId) {
      this.localX = self.x;
      this.localY = self.y;
    } else if (
      this.localX <= 0 ||
      this.localY <= 0 ||
      this.localX >= zoneDef.widthTiles * zoneDef.tileSize ||
      this.localY >= zoneDef.heightTiles * zoneDef.tileSize
    ) {
      this.localX = zoneDef.defaultSpawn.x;
      this.localY = zoneDef.defaultSpawn.y;
    }

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
    } else {
      this.updateVisualBundlePosition(
        this.localVisual,
        this.localX,
        this.localY,
        (self?.hp ?? 100) / Math.max(1, self?.maxHp ?? 100),
        false,
        false
      );
    }
    const shouldShowAvatar = !this.net.isV02Mode() || Boolean(this.net.selfState);
    this.setVisualBundleVisible(this.localVisual, shouldShowAvatar);

    const worldW = zoneDef.widthTiles * zoneDef.tileSize;
    const worldH = zoneDef.heightTiles * zoneDef.tileSize;
    this.cameraView.bindWorldAndTarget(zoneId, worldW, worldH, this.localVisual.sprite);
    this.cameraView.snapToTarget(this.localX, this.localY);
    this.syncMinimapOverlay();
  }

  private placeHighCraftLandmarks(zoneId: ZoneId): void {
    const placeSurfaceBridge = (id: string, key: string, x: number, y: number, scale = 1.0) => {
      const img = this.add.image(x, y, key).setOrigin(0.5, 0.5).setScale(scale).setDepth(6);
      this.sceneProps.push(img);
      this.worldPropMetadata.push({
        id,
        propKey: key,
        x,
        baseY: y,
        depth: 6,
        category: "surface_bridge"
      });
    };

    const placeVerticalOccluder = (
      id: string,
      key: string,
      x: number,
      baseY: number,
      scale = 1.0
    ) => {
      const img = this.add
        .image(x, baseY, key)
        .setOrigin(0.5, 1.0)
        .setScale(scale)
        .setDepth(baseY);
      this.sceneProps.push(img);
      this.worldPropMetadata.push({
        id,
        propKey: key,
        x,
        baseY,
        depth: baseY,
        category: "vertical_occluder"
      });
    };

    if (zoneId === "tan_thu_thon") {
      placeSurfaceBridge("bridge_west_creek", "prop_bridge_horizontal", 27 * 32, 37 * 32, 0.72);
      placeSurfaceBridge("bridge_north_stream", "prop_arched_bridge", 58 * 32, 23 * 32, 0.84);
      placeSurfaceBridge("bridge_east_stream", "prop_arched_bridge", 58 * 32, 37 * 32, 0.84);

      placeVerticalOccluder("tan_thu_tu_duong", "building_tu_duong", 48 * 32, 23 * 32, 0.78);
      placeVerticalOccluder("cuu_long_than_dinh", "prop_than_dinh", 48 * 32, 32 * 32, 0.56);
      placeVerticalOccluder("quan_mi_lao_truong", "prop_noodle_stall", 33 * 32, 34 * 32, 0.68);
      placeVerticalOccluder("tu_bao_cac_hall", "building_tu_bao_cac", 70 * 32, 17 * 32, 0.82);
      placeVerticalOccluder("hong_tran_cac", "building_hong_tran_cac", 18 * 32, 19 * 32, 0.76);
      placeVerticalOccluder("truyen_tong_tran_arch", "prop_portal_arch", 86 * 32, 35 * 32, 0.68);

      const cauldronFire = this.add.sprite(48 * 32, 31 * 32 - 8, "phi_de_blessing", 0);
      cauldronFire.setDepth(32 * 32 + 0.05);
      cauldronFire.play("vfx_blessing_pulse");
      this.sceneProps.push(cauldronFire);

      const cauldronLabel = this.add
        .text(48 * 32, 30 * 32 - 42, "Cửu Long Thần Đỉnh", {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          color: "#ffd452",
          backgroundColor: "rgba(18, 12, 8, 0.82)",
          padding: { x: 6, y: 2 }
        })
        .setOrigin(0.5, 1)
        .setDepth(32 * 32 + 0.4);
      this.sceneProps.push(cauldronLabel);

      const decorList: Array<[string, number, number, number]> = [
        ["prop_peach_tree", 11, 16, 0.72],
        ["prop_peach_tree", 24, 16, 0.72],
        ["prop_peach_tree", 11, 25, 0.7],
        ["prop_peach_tree", 24, 27, 0.7],
        ["prop_peach_tree", 38, 25, 0.72],
        ["prop_peach_tree", 55, 26, 0.72],
        ["prop_peach_tree", 63, 14, 0.68],
        ["prop_peach_tree", 78, 15, 0.68],
        ["prop_peach_tree", 37, 44, 0.7],
        ["prop_bamboo_cluster", 75, 29, 0.75],
        ["prop_bamboo_cluster", 82, 30, 0.78],
        ["prop_bamboo_cluster", 89, 31, 0.78],
        ["prop_bamboo_cluster", 76, 44, 0.75],
        ["prop_bamboo_cluster", 84, 44, 0.78],
        ["prop_bamboo_cluster", 90, 42, 0.78],
        ["prop_bamboo_cluster", 13, 49, 0.74],
        ["prop_bamboo_cluster", 26, 51, 0.74],
        ["prop_bamboo_cluster", 14, 59, 0.74],
        ["prop_bamboo_cluster", 26, 59, 0.74],
        ["prop_bamboo_cluster", 41, 13, 0.72],
        ["prop_bamboo_cluster", 53, 13, 0.72],
        ["prop_stone_lantern", 43, 27, 0.65],
        ["prop_stone_lantern", 52, 27, 0.65],
        ["prop_stone_lantern", 45, 40, 0.65],
        ["prop_stone_lantern", 51, 40, 0.65],
        ["prop_stone_lantern", 30, 34, 0.65],
        ["prop_stone_lantern", 36, 34, 0.65],
        ["prop_stone_lantern", 65, 19, 0.65],
        ["prop_stone_lantern", 75, 19, 0.65],
        ["prop_stone_lantern", 15, 22, 0.65],
        ["prop_stone_lantern", 21, 22, 0.65],
        ["prop_stone_lantern", 80, 34, 0.65],
        ["prop_stone_lantern", 80, 40, 0.65],
        ["prop_stone_lantern", 45, 54, 0.65],
        ["prop_stone_lantern", 51, 54, 0.65],
        ["prop_village_stele", 44, 64, 0.62],
        ["prop_incense_brazier", 46, 25, 0.56],
        ["prop_incense_brazier", 50, 25, 0.56],
        ["prop_jade_rock", 14, 15, 0.58],
        ["prop_wooden_fence", 15, 49, 0.58],
        ["prop_wooden_fence", 25, 49, 0.58]
      ];
      decorList.forEach(([pk, tx, ty, sc], idx) => {
        placeVerticalOccluder(`decor_${pk}_${idx}`, pk, tx * 32 + 16, (ty + 1) * 32, sc);
      });
    } else {
      placeVerticalOccluder("forest_portal_arch", "prop_portal_arch", 128, 498, 0.68);
      const bambooCoords: Array<[number, number]> = [
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
      bambooCoords.forEach(([bx, by], idx) => {
        placeVerticalOccluder(`forest_bamboo_${idx}`, "prop_bamboo_cluster", bx, by, 0.78);
      });
      const herbCoords: Array<[number, number]> = [
        [464, 368],
        [848, 400],
        [784, 688],
        [1040, 592]
      ];
      herbCoords.forEach(([hx, hy], idx) => {
        placeVerticalOccluder(`forest_herb_${idx}`, "prop_spirit_herb", hx, hy, 0.48);
      });
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
      .setDepth(Math.max(8, y - 2))
      .setVisible(false);

    const telegraphRing = this.add
      .circle(x, y - 4, 48, 0xe03131, 0.18)
      .setStrokeStyle(2, 0xff6b6b, 0.9)
      .setDepth(Math.max(8, y - 3))
      .setVisible(false);

    const profile = SPRITE_PROFILES[spriteKey] ?? SPRITE_PROFILES.hero_kiem_tu!;
    const is80x96 = profile.frameWidth === 80 && profile.frameHeight === 96;
    const sprite = this.add
      .sprite(x, y, spriteKey, 0)
      .setOrigin(0.5, is80x96 ? 0.9167 : 0.9)
      .setScale(is80x96 ? 0.86 : 1.0)
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
      .setDepth(y + 0.3);

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
      .setDepth(y + 0.4);

    let hpBg: Phaser.GameObjects.Rectangle | undefined;
    let hpFill: Phaser.GameObjects.Rectangle | undefined;
    if (withHpBar) {
      hpBg = this.add
        .rectangle(x, y - 44, 38, 5, 0x0b0f17, 0.85)
        .setStrokeStyle(1, 0x343a40, 0.9)
        .setDepth(y + 0.1);
      hpFill = this.add
        .rectangle(x - 18, y - 44, 36, 3, 0x51cf66, 1)
        .setOrigin(0, 0.5)
        .setDepth(y + 0.2);
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
    b.subLabel.setPosition(x, y - 68).setDepth(y + 0.3);
    b.nameLabel.setPosition(x, y - 55).setDepth(y + 0.4);
    if (b.hpBg && b.hpFill) {
      b.hpBg.setPosition(x, y - 44).setDepth(y + 0.1);
      b.hpFill
        .setPosition(x - 18, y - 44)
        .setSize(Math.max(0, Math.min(1, hpRatio)) * 36, 3)
        .setDepth(y + 0.2);
    }
    if (b.auraRing) {
      b.auraRing.setPosition(x, y - 4).setDepth(Math.max(8, y - 2)).setVisible(showAura);
    }
    if (b.telegraphRing) {
      b.telegraphRing
        .setPosition(x, y - 4)
        .setDepth(Math.max(8, y - 3))
        .setVisible(showTelegraph);
    }
  }

  public syncSelfState(state: CharacterSaveState): void {
    if (state.zoneId !== this.currentZoneId && this.scene.isActive()) {
      this.localX = state.x;
      this.localY = state.y;
      this.buildZoneWorld(state.zoneId);
    }
    if (Math.hypot(state.x - this.localX, state.y - this.localY) > 72) {
      this.localX = state.x;
      this.localY = state.y;
      this.cameraView?.snapToTarget(this.localX, this.localY);
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
      const zoneDef = ZONES_REGISTRY[this.currentZoneId];
      this.cameraView?.bindWorldAndTarget(
        this.currentZoneId,
        zoneDef.widthTiles * zoneDef.tileSize,
        zoneDef.heightTiles * zoneDef.tileSize,
        this.localVisual.sprite
      );
    }
    if (this.localVisual) {
      this.setVisualBundleVisible(this.localVisual, true);
      this.localVisual.nameLabel.setText(state.nickname);
      this.localVisual.subLabel.setText(
        `【${formatRealmDisplay(state.realmId, state.realmStage)}】`
      );
      this.updateVisualBundlePosition(
        this.localVisual,
        this.localX,
        this.localY,
        state.hp / Math.max(1, state.maxHp),
        Boolean(
          state.quests.phi_de_ch1_huong_thom?.status === "completed" ||
            state.buffs.some((b) => b.slot === "blessing")
        ),
        false
      );
    }
    this.syncMinimapOverlay();
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
      const resolved = this.resolveSpriteAnim(remoteSpriteKey, rp.anim, rp.direction);
      if (this.anims.exists(resolved.animKey)) {
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
        const resolved = this.resolveSpriteAnim(spriteKey, mAnimState, m.direction);
        if (this.anims.exists(resolved.animKey)) {
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
        const icon = this.add
          .sprite(d.x, d.y, "portal_ring", 1)
          .setScale(0.45)
          .setDepth(Math.max(9, d.y - 1));
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

    this.syncMinimapOverlay();
  }

  public playCombatEventVisual(ev: CombatEventPayload): void {
    if (!this.scene.isActive()) return;
    if (ev.targetId === this.net.selfState?.characterId) {
      this.hurtAnimUntil = this.time.now + 380;
    }
    const hitSpark = this.add
      .sprite(ev.x, ev.y - 22, "combat_vfx", 4)
      .setScale(0.85)
      .setDepth(ev.y + 24);
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
      .setDepth(4500);

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
      .setDepth(this.localY + 24);
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
        .setDepth(y + 24);
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
      .setDepth(y + 24);
    fx.play(animKey);
    fx.once("animationcomplete", () => fx.destroy());
  }

  public isWalkableLocal(worldX: number, worldY: number): boolean {
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
    const idx = ty * this.collisionGrid.width + tx;
    return (this.collisionGrid.data[idx] ?? 0) === 0;
  }

  override update(_time: number, delta: number): void {
    if (!this.localVisual) return;
    const inCreation = this.net.isV02Mode() && !this.net.selfState;
    this.setVisualBundleVisible(this.localVisual, !inCreation);
    if (inCreation) {
      this.interactPromptText.setVisible(false);
      return;
    }

    let vx = this.touchVector.vx;
    let vy = this.touchVector.vy;

    if (!this.isTypingInInput() && this.keys) {
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

    const speed = 175;
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
    const resolvedLocal = this.resolveSpriteAnim(
      this.localAppearanceKey,
      this.localAnim,
      this.localDir
    );
    if (
      this.anims.exists(resolvedLocal.animKey) &&
      this.localVisual.sprite.anims.currentAnim?.key !== resolvedLocal.animKey
    ) {
      this.localVisual.sprite.play(resolvedLocal.animKey, true);
    }

    const npcsInZone = LEGENDARY_NPCS.filter((n) => n.zoneId === this.currentZoneId);
    for (const npc of npcsInZone) {
      const b = this.npcVisuals.get(npc.id);
      if (!b) continue;
      const ov = this.npcOverrideAnims.get(npc.id);
      if (ov && this.time.now < ov.until) {
        const resOv = this.resolveSpriteAnim(npc.spriteKey, ov.state, ov.dir);
        if (this.anims.exists(resOv.animKey)) {
          b.sprite.play(resOv.animKey, true);
        }
        continue;
      }
      const profile = SPRITE_PROFILES[npc.spriteKey];
      let nDir: Direction = "down";
      if (profile && profile.supportedDirections.length > 1) {
        const dist = Math.hypot(this.localX - npc.spawnX, this.localY - npc.spawnY);
        if (dist <= 165) {
          const dx = this.localX - npc.spawnX;
          const dy = this.localY - npc.spawnY;
          if (Math.abs(dx) > Math.abs(dy)) {
            nDir = dx < 0 ? "left" : "right";
          } else {
            nDir = dy < 0 ? "up" : "down";
          }
        }
      }
      const resNpc = this.resolveSpriteAnim(npc.spriteKey, "idle", nDir);
      if (
        this.anims.exists(resNpc.animKey) &&
        b.sprite.anims.currentAnim?.key !== resNpc.animKey
      ) {
        b.sprite.play(resNpc.animKey, true);
      }
    }

    if (this.time.now - this.lastMoveSentAt >= 65) {
      this.lastMoveSentAt = this.time.now;
      this.net.sendMove(this.localX, this.localY, vx, vy, this.localDir);
      this.syncMinimapOverlay();
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

  private syncMinimapOverlay(): void {
    const hud = this.getHud();
    if (!hud) return;
    const snap = this.net.worldSnapshot;
    const myCharId = this.net.selfState?.characterId ?? "";
    const remotes: RemotePlayerSnapshot[] = Object.values(snap?.players ?? {}).filter(
      (rp) => rp.characterId !== myCharId
    );
    hud.updateMinimapDynamic({
      zoneId: this.currentZoneId,
      playerX: Math.round(this.localX),
      playerY: Math.round(this.localY),
      playerDirection: this.localDir,
      cameraTelemetry: this.cameraView ? this.cameraView.getTelemetry() : null,
      remotePlayers: remotes
    });
  }

  public getCameraTelemetry(): CameraTelemetry | null {
    return this.cameraView ? this.cameraView.getTelemetry() : null;
  }

  public setCameraZoomForTest(zoom: number): CameraTelemetry | null {
    if (!this.cameraView) return null;
    this.cameraView.setZoom(zoom, true);
    this.syncMinimapOverlay();
    return this.cameraView.getTelemetry();
  }

  public setLocalPositionForTest(x: number, y: number, dir: Direction = "down"): void {
    this.localDir = dir;
    const authX = this.localX;
    const authY = this.localY;
    const bfsSteps = this.computeBfsTilePath(authX, authY, x, y);
    if (bfsSteps.length > 0) {
      for (const st of bfsSteps) {
        this.localX = st.x;
        this.localY = st.y;
        this.net.sendMove(st.x, st.y, 0, 0, st.dir);
      }
      if (this.isWalkableLocal(x, y) && Math.hypot(x - this.localX, y - this.localY) <= 64) {
        this.localX = x;
        this.localY = y;
        this.net.sendMove(x, y, 0, 0, this.localDir);
      }
    } else {
      const steps = Math.max(1, Math.ceil(Math.hypot(x - authX, y - authY) / 48));
      for (let i = 1; i <= steps; i++) {
        const ix = authX + ((x - authX) * i) / steps;
        const iy = authY + ((y - authY) * i) / steps;
        this.localX = ix;
        this.localY = iy;
        this.net.sendMove(ix, iy, 0, 0, this.localDir);
      }
    }
    if (this.localVisual) {
      const self = this.net.selfState;
      this.updateVisualBundlePosition(
        this.localVisual,
        this.localX,
        this.localY,
        (self?.hp ?? 100) / Math.max(1, self?.maxHp ?? 100),
        false,
        false
      );
      const resolved = this.resolveSpriteAnim(this.localAppearanceKey, "idle", this.localDir);
      this.localVisual.sprite.play(resolved.animKey, true);
    }
    this.cameraView?.snapToTarget(this.localX, this.localY);
    this.syncMinimapOverlay();
    this.updateInteractPrompt();
  }

  public computeBfsTilePath(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
  ): Array<{ tx: number; ty: number; x: number; y: number; dir: Direction }> {
    const w = this.collisionGrid.width;
    const h = this.collisionGrid.height;
    const sx = Math.max(1, Math.min(w - 2, Math.floor(startX / 32)));
    const sy = Math.max(1, Math.min(h - 2, Math.floor(startY / 32)));
    const gx = Math.max(1, Math.min(w - 2, Math.floor(targetX / 32)));
    const gy = Math.max(1, Math.min(h - 2, Math.floor(targetY / 32)));

    const startKey = sy * w + sx;
    const goalKey = gy * w + gx;
    if (startKey === goalKey) return [];

    const parent = new Map<number, { prev: number; dir: Direction }>();
    const visited = new Set<number>([startKey]);
    const queue: Array<[number, number]> = [[sx, sy]];
    let head = 0;

    const dirs: Array<{ dx: number; dy: number; dir: Direction }> = [
      { dx: 1, dy: 0, dir: "right" },
      { dx: -1, dy: 0, dir: "left" },
      { dx: 0, dy: 1, dir: "down" },
      { dx: 0, dy: -1, dir: "up" }
    ];

    let found = false;
    while (head < queue.length) {
      const [cx, cy] = queue[head++]!;
      const curKey = cy * w + cx;
      if (curKey === goalKey) {
        found = true;
        break;
      }
      for (const step of dirs) {
        const nx = cx + step.dx;
        const ny = cy + step.dy;
        if (nx < 1 || ny < 1 || nx >= w - 1 || ny >= h - 1) continue;
        const nKey = ny * w + nx;
        if (visited.has(nKey)) continue;
        if (!this.isWalkableLocal(nx * 32 + 16, ny * 32 + 16)) continue;
        visited.add(nKey);
        parent.set(nKey, { prev: curKey, dir: step.dir });
        queue.push([nx, ny]);
      }
    }

    if (!found) return [];
    const steps: Array<{ tx: number; ty: number; x: number; y: number; dir: Direction }> = [];
    let cur = goalKey;
    while (cur !== startKey) {
      const info = parent.get(cur);
      if (!info) break;
      const tx = cur % w;
      const ty = Math.floor(cur / w);
      steps.push({
        tx,
        ty,
        x: tx * 32 + 16,
        y: ty * 32 + 16,
        dir: info.dir
      });
      cur = info.prev;
    }
    steps.reverse();
    return steps;
  }

  public async walkBfsPathForTest(
    targetX: number,
    targetY: number,
    stepDelayMs = 8
  ): Promise<{
    ok: boolean;
    stepsWalked: number;
    start: { x: number; y: number };
    end: { x: number; y: number };
  }> {
    const start = { x: Math.round(this.localX), y: Math.round(this.localY) };
    const pathSteps = this.computeBfsTilePath(start.x, start.y, targetX, targetY);
    if (pathSteps.length === 0 && Math.hypot(start.x - targetX, start.y - targetY) > 48) {
      return { ok: false, stepsWalked: 0, start, end: start };
    }
    for (const st of pathSteps) {
      this.localDir = st.dir;
      this.localX = st.x;
      this.localY = st.y;
      if (this.localVisual) {
        this.updateVisualBundlePosition(
          this.localVisual,
          this.localX,
          this.localY,
          1,
          false,
          false
        );
        const resolved = this.resolveSpriteAnim(this.localAppearanceKey, "walk", st.dir);
        if (this.localVisual.sprite.anims.currentAnim?.key !== resolved.animKey) {
          this.localVisual.sprite.play(resolved.animKey, true);
        }
      }
      this.net.sendMove(st.x, st.y, 0, 0, st.dir);
      this.syncMinimapOverlay();
      this.updateInteractPrompt();
      if (stepDelayMs > 0) {
        await new Promise((r) => setTimeout(r, stepDelayMs));
      }
    }
    if (this.localVisual) {
      const resolved = this.resolveSpriteAnim(this.localAppearanceKey, "idle", this.localDir);
      this.localVisual.sprite.play(resolved.animKey, true);
    }
    const end = { x: Math.round(this.localX), y: Math.round(this.localY) };
    return {
      ok: true,
      stepsWalked: pathSteps.length,
      start,
      end
    };
  }

  public getOcclusionTelemetry(): {
    localPlayer: {
      x: number;
      y: number;
      spriteDepth: number;
      nameLabelDepth: number;
      currentAnimKey: string | null;
    } | null;
    npcs: Array<{
      id: string;
      spriteKey: string;
      x: number;
      y: number;
      spriteDepth: number;
      nameLabelDepth: number;
      currentAnimKey: string | null;
    }>;
    worldProps: Array<{
      id: string;
      propKey: string;
      x: number;
      baseY: number;
      depth: number;
      category: "surface_bridge" | "vertical_occluder";
    }>;
  } {
    return {
      localPlayer: this.localVisual
        ? {
            x: Math.round(this.localX),
            y: Math.round(this.localY),
            spriteDepth: this.localVisual.sprite.depth,
            nameLabelDepth: this.localVisual.nameLabel.depth,
            currentAnimKey: this.localVisual.sprite.anims.currentAnim?.key ?? null
          }
        : null,
      npcs: LEGENDARY_NPCS.filter((n) => n.zoneId === this.currentZoneId).map((npc) => {
        const b = this.npcVisuals.get(npc.id);
        return {
          id: npc.id,
          spriteKey: npc.spriteKey,
          x: Math.round(b?.sprite.x ?? npc.spawnX),
          y: Math.round(b?.sprite.y ?? npc.spawnY),
          spriteDepth: b?.sprite.depth ?? npc.spawnY,
          nameLabelDepth: b?.nameLabel.depth ?? npc.spawnY + 0.4,
          currentAnimKey: b?.sprite.anims.currentAnim?.key ?? null
        };
      }),
      worldProps: this.worldPropMetadata
    };
  }

  public getAnimationContractTelemetry(): {
    profiles: Record<string, SpriteProfileDef>;
    registeredAnimKeys: string[];
    fallbackLog: ResolvedSpriteAnimation[];
  } {
    const animKeys = Array.from(
      (this.anims as unknown as { anims: { entries: Record<string, unknown> } }).anims?.entries
        ? Object.keys(
            (this.anims as unknown as { anims: { entries: Record<string, unknown> } }).anims
              .entries
          )
        : []
    );
    return {
      profiles: SPRITE_PROFILES,
      registeredAnimKeys: animKeys,
      fallbackLog: this.animFallbackLog
    };
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
        this.setLocalPositionForTest(x, y, dir ?? this.localDir);
      },
      setLocalPositionForTest: (x: number, y: number, dir?: Direction) => {
        this.setLocalPositionForTest(x, y, dir ?? this.localDir);
      },
      walkBfsPathForTest: (targetX: number, targetY: number, stepDelayMs = 8) =>
        this.walkBfsPathForTest(targetX, targetY, stepDelayMs),
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
            .setDepth(npc.spawnY + 24);
          fx.play("vfx_lotus_cast");
          fx.once("animationcomplete", () => fx.destroy());
        } else if (npc && state === "attack") {
          this.spawnSlashEffect(npc.spawnX, npc.spawnY, dir, "kiem_khi_ung");
        }
      },
      interact: () => this.triggerContextualInteract(),
      attack: (skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang" = "basic_slash") =>
        this.triggerSkill(skillId),
      pickup: () => this.triggerPickupNearestDrop(),
      getCameraTelemetry: () => this.getCameraTelemetry(),
      setCameraZoomForTest: (zoom: number) => this.setCameraZoomForTest(zoom),
      getMinimapTelemetry: () => this.getHud()?.getMinimapTelemetry() ?? null,
      toggleMinimapSize: (force?: boolean) => this.getHud()?.toggleMinimapSize(force) ?? false,
      getOcclusionTelemetry: () => this.getOcclusionTelemetry(),
      getAnimationContractTelemetry: () => this.getAnimationContractTelemetry(),
      resolveSpriteAnim: (
        spriteKey: string,
        state: "idle" | "walk" | "attack" | "cast" | "hurt",
        dir: Direction
      ) => this.resolveSpriteAnim(spriteKey, state, dir)
    };
  }
}
