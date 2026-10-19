import Phaser from "phaser";
import type {
  AnimState,
  CharacterSaveState,
  CombatEventPayload,
  Direction,
  EntryFlowState,
  MonsterSnapshot,
  RemotePlayerSnapshot,
  RoomWorldSnapshot,
  ZoneId
} from "@tong-mon-8d/shared";
import {
  formatRealmDisplay,
  LEGENDARY_NPCS,
  ZONES_REGISTRY,
  type LegendaryNpcDefinition
} from "@tong-mon-8d/game-data";
import type { GameNetworkClient } from "../network/GameNetworkClient.js";
import type { SoundController } from "../audio.js";
import type { HudWorldMinimapPort, WorldSceneHudPort } from "../ui/ports.js";
import { preloadWorldSceneAssets } from "./assets/RuntimeAssetBindings.js";
import {
  type ResolvedSpriteAnimation,
  type SpriteProfileDef
} from "./assets/SpriteProfiles.js";
import { AnimationRegistry } from "./combat/AnimationRegistry.js";
import { CombatVisuals } from "./combat/CombatVisuals.js";
import { CameraView, type CameraTelemetry } from "./world/CameraView.js";
import { MapView, type WorldPropMetadata } from "./world/MapView.js";
import { ActorViewSystem } from "./world/ActorViewSystem.js";
import { PlayerInputController } from "./input/PlayerInput.js";
import {
  computeBfsTilePathOnGrid,
  registerWorldDebugHooks,
  type BfsTileStep,
  type WorldDebugHost
} from "./debug/WorldDebugController.js";

export class WorldScene
  extends Phaser.Scene
  implements WorldSceneHudPort, WorldDebugHost
{
  private net!: GameNetworkClient;
  private soundCtrl!: SoundController;
  private onInteractNpc!: (npc: LegendaryNpcDefinition) => void;
  private getHud: () => HudWorldMinimapPort | null = () => null;
  private getEntryFlowState: () => EntryFlowState = () => "TITLE";

  private readonly animRegistry = new AnimationRegistry();
  private cameraView!: CameraView;
  private mapView!: MapView;
  private actorViews!: ActorViewSystem;
  private combatVisuals!: CombatVisuals;
  private playerInput!: PlayerInputController;

  private currentZoneId: ZoneId = "tan_thu_thon";
  private localX = 1552;
  private localY = 1232;
  private localDir: Direction = "down";
  private localAnim: AnimState = "idle";
  private activeActionState: "attack" | "cast" = "attack";
  private attackAnimUntil = 0;
  private hurtAnimUntil = 0;
  private lastMoveSentAt = 0;
  private lastMovedAt = 0;
  private localAnimRestartCount = 0;
  private fixedAnimTestKey: string | null = null;
  private lastRequestedDir: Direction = "down";
  private lastRequestedAnimState: AnimState = "idle";
  private lastInputVx = 0;
  private lastInputVy = 0;
  private interactPromptText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "WorldScene" });
  }

  public bindSystems(
    net: GameNetworkClient,
    soundCtrl: SoundController,
    onInteractNpc: (npc: LegendaryNpcDefinition) => void,
    getHud?: () => HudWorldMinimapPort | null,
    getEntryFlowState?: () => EntryFlowState
  ): void {
    this.net = net;
    this.soundCtrl = soundCtrl;
    this.onInteractNpc = onInteractNpc;
    if (getHud) {
      this.getHud = getHud;
    }
    if (getEntryFlowState) {
      this.getEntryFlowState = getEntryFlowState;
    }
    registerWorldDebugHooks(this);
  }

  public isPlayerInWorld(): boolean {
    if (!this.net) return false;
    if (!this.net.isV02Mode()) {
      return Boolean(this.net.selfState);
    }
    return this.getEntryFlowState() === "IN_WORLD" && Boolean(this.net.selfState);
  }

  public canAcceptGameplayInput(): boolean {
    if (!this.isPlayerInWorld()) {
      return false;
    }
    if (this.getHud()?.isBlockingOverlayOpen()) {
      return false;
    }
    return true;
  }

  public getWorldActorCount(): number {
    if (!this.isPlayerInWorld() || !this.actorViews) {
      return 0;
    }
    return this.actorViews.getActiveActorCount(false);
  }

  public resetToMenuState(): void {
    this.playerInput?.clearNavigation();
    this.actorViews?.clearDynamicWorldActors();
    if (this.actorViews?.localVisual) {
      this.actorViews.setVisualBundleVisible(this.actorViews.localVisual, false);
    }
    if (this.interactPromptText) {
      this.interactPromptText.setVisible(false);
    }
  }

  public navigateToWorldPoint(targetX: number, targetY: number): void {
    if (!this.isPlayerInWorld() || !this.playerInput) return;
    const bfsSteps = this.computeBfsTilePath(this.localX, this.localY, targetX, targetY);
    if (bfsSteps.length > 0) {
      this.playerInput.pointerTarget = null;
      this.playerInput.navWaypoints = bfsSteps.map((s) => ({ x: s.x, y: s.y }));
    } else {
      this.playerInput.navWaypoints = [];
      this.playerInput.pointerTarget = { x: targetX, y: targetY };
    }
  }

  preload(): void {
    preloadWorldSceneAssets(this.load);
  }

  create(): void {
    this.cameraView = new CameraView(this);
    this.mapView = new MapView(this);
    this.actorViews = new ActorViewSystem(this, this.animRegistry);
    this.combatVisuals = new CombatVisuals(this);
    this.playerInput = new PlayerInputController(this, {
      onSkill: (skillId) => this.triggerSkill(skillId),
      onContextualInteract: () => this.triggerContextualInteract(),
      onPickupNearestDrop: () => this.triggerPickupNearestDrop(),
      onStepZoom: (delta) => {
        this.cameraView.stepZoom(delta);
        this.syncMinimapOverlay();
      },
      canAcceptWorldPointerInput: () => this.canAcceptGameplayInput(),
      canAcceptGameplayInput: () => this.canAcceptGameplayInput()
    });

    this.animRegistry.registerAll(this.anims);
    this.playerInput.setup();

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
        if (!this.canAcceptGameplayInput()) return;
        if (dy < 0) {
          this.cameraView.stepZoom(1);
        } else if (dy > 0) {
          this.cameraView.stepZoom(-1);
        }
        this.syncMinimapOverlay();
      }
    );

    registerWorldDebugHooks(this);
  }

  public resolveSpriteAnim(
    spriteKey: string,
    requestedState: "idle" | "walk" | "attack" | "cast" | "hurt",
    requestedDir: Direction
  ): ResolvedSpriteAnimation {
    return this.animRegistry.resolveSpriteAnim(spriteKey, requestedState, requestedDir);
  }

  public setTouchVector(vx: number, vy: number): void {
    if (!this.canAcceptGameplayInput()) {
      if (this.playerInput) {
        this.playerInput.touchVector = { vx: 0, vy: 0 };
      }
      return;
    }
    if (this.playerInput) {
      this.playerInput.touchVector = { vx, vy };
    }
    if (vx !== 0 || vy !== 0) {
      this.lastMovedAt = this.time.now + 240;
    } else {
      this.net.sendMove(this.localX, this.localY, 0, 0, this.localDir);
    }
  }

  public triggerSkill(
    skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang"
  ): void {
    if (!this.canAcceptGameplayInput()) return;
    this.activeActionState = skillId === "basic_slash" ? "attack" : "cast";
    this.localAnim = this.activeActionState;
    this.attackAnimUntil = this.time.now + 390;
    if (this.actorViews.localVisual) {
      const resolved = this.resolveSpriteAnim(
        this.actorViews.localAppearanceKey,
        this.localAnim,
        this.localDir
      );
      if (this.anims.exists(resolved.animKey)) {
        this.localAnimRestartCount += 1;
        this.actorViews.localVisual.sprite.play(resolved.animKey, false);
      }
    }
    if (skillId === "basic_slash") {
      this.soundCtrl.playSlash();
    } else {
      this.soundCtrl.playSkill();
    }
    this.combatVisuals.spawnSlashEffect(this.localX, this.localY, this.localDir, skillId);
    this.net.sendAttack(skillId, this.localDir);
  }

  public triggerContextualInteract(): void {
    if (!this.canAcceptGameplayInput()) return;
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
    if (!this.canAcceptGameplayInput()) return;
    let best: { id: string; dist: number } | null = null;
    for (const [dropId, vis] of this.actorViews.dropVisuals.entries()) {
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
    if (this.playerInput) {
      this.playerInput.clearNavigation();
    }
    this.localX = spawnX;
    this.localY = spawnY;
    this.buildZoneWorld(zoneId);
  }

  public buildZoneWorld(zoneId: ZoneId): void {
    if (!this.actorViews || !this.mapView || !this.cameraView) return;
    this.actorViews.clearNonLocalActors();
    this.currentZoneId = zoneId;
    const zoneDef = ZONES_REGISTRY[zoneId];

    const minimapTileData = this.mapView.buildZoneMap(zoneId);
    this.getHud()?.setMinimapStaticTileData(minimapTileData);

    this.actorViews.spawnZoneNpcs(zoneId);

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

    const shouldShowAvatar = this.isPlayerInWorld();
    const { visual } = this.actorViews.ensureLocalVisual(
      self?.appearanceId ?? this.net.selfStateV02?.identity.appearanceId,
      this.localX,
      this.localY,
      self,
      shouldShowAvatar
    );

    const worldW = zoneDef.widthTiles * zoneDef.tileSize;
    const worldH = zoneDef.heightTiles * zoneDef.tileSize;
    this.cameraView.bindWorldAndTarget(zoneId, worldW, worldH, visual.sprite);
    this.cameraView.snapToTarget(this.localX, this.localY);
    this.syncMinimapOverlay();
  }

  public syncSelfState(state: CharacterSaveState): void {
    if (
      state.zoneId !== this.currentZoneId &&
      this.scene?.isActive() &&
      Boolean(this.actorViews)
    ) {
      this.localX = state.x;
      this.localY = state.y;
      this.buildZoneWorld(state.zoneId);
    }
    if (Math.hypot(state.x - this.localX, state.y - this.localY) > 72) {
      this.localX = state.x;
      this.localY = state.y;
      this.cameraView?.snapToTarget(this.localX, this.localY);
    }
    if (this.scene?.isActive() && this.actorViews) {
      const { recreated, visual } = this.actorViews.ensureLocalVisual(
        state.appearanceId,
        this.localX,
        this.localY,
        state,
        this.isPlayerInWorld()
      );
      if (recreated) {
        const zoneDef = ZONES_REGISTRY[this.currentZoneId];
        this.cameraView?.bindWorldAndTarget(
          this.currentZoneId,
          zoneDef.widthTiles * zoneDef.tileSize,
          zoneDef.heightTiles * zoneDef.tileSize,
          visual.sprite
        );
      }
      visual.nameLabel.setText(state.nickname);
      visual.subLabel.setText(
        `【${formatRealmDisplay(state.realmId, state.realmStage)}】`
      );
      this.actorViews.updateVisualBundlePosition(
        visual,
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
    if (
      !this.scene?.isActive() ||
      !this.actorViews ||
      !this.isPlayerInWorld() ||
      snapshot.zoneId !== this.currentZoneId
    ) {
      return;
    }
    this.actorViews.syncWorldSnapshotActors(snapshot, this.net.selfState?.characterId);
    this.syncMinimapOverlay();
  }

  public playCombatEventVisual(ev: CombatEventPayload): void {
    if (!this.scene?.isActive() || !this.actorViews || !this.combatVisuals) return;
    if (ev.targetId === this.net.selfState?.characterId) {
      this.hurtAnimUntil = this.time.now + 390;
      if (this.actorViews.localVisual && this.time.now >= this.attackAnimUntil) {
        const resolved = this.resolveSpriteAnim(
          this.actorViews.localAppearanceKey,
          "hurt",
          this.localDir
        );
        if (this.anims.exists(resolved.animKey)) {
          this.localAnimRestartCount += 1;
          this.actorViews.localVisual.sprite.play(resolved.animKey, false);
        }
      }
    }
    this.combatVisuals.playCombatEventVisual(ev);
  }

  public playCeremonyEffect(): void {
    if (!this.scene?.isActive() || !this.combatVisuals) return;
    this.soundCtrl.playCeremony();
    this.combatVisuals.playCeremonyEffect(this.localX, this.localY);
  }

  public isWalkableLocal(worldX: number, worldY: number): boolean {
    return this.mapView ? this.mapView.isWalkableLocal(worldX, worldY) : true;
  }

  override update(_time: number, delta: number): void {
    const localVisual = this.actorViews?.localVisual;
    if (!localVisual) return;
    const inWorld = this.isPlayerInWorld();
    this.actorViews.setVisualBundleVisible(localVisual, inWorld);
    if (!inWorld) {
      this.interactPromptText.setVisible(false);
      return;
    }
    if (!this.canAcceptGameplayInput()) {
      this.interactPromptText.setVisible(false);
      return;
    }

    if (this.fixedAnimTestKey) {
      this.lastInputVx = 0;
      this.lastInputVy = 0;
      const self = this.net.selfState;
      const hasBlessing = Boolean(
        self?.quests.phi_de_ch1_huong_thom?.status === "completed" ||
          self?.buffs.some((b) => b.slot === "blessing")
      );
      this.actorViews.updateVisualBundlePosition(
        localVisual,
        this.localX,
        this.localY,
        (self?.hp ?? 100) / Math.max(1, self?.maxHp ?? 100),
        hasBlessing,
        false
      );
      if (
        this.anims.exists(this.fixedAnimTestKey) &&
        (localVisual.sprite.anims.currentAnim?.key !== this.fixedAnimTestKey ||
          !localVisual.sprite.anims.isPlaying)
      ) {
        this.localAnimRestartCount += 1;
        localVisual.sprite.play(this.fixedAnimTestKey, true);
      }
      return;
    }

    const prevX = this.localX;
    const prevY = this.localY;
    const stepResult = this.playerInput.computeMovementStep(
      this.localX,
      this.localY,
      this.localDir,
      delta,
      (wx, wy) => this.isWalkableLocal(wx, wy)
    );

    this.localX = stepResult.x;
    this.localY = stepResult.y;
    this.lastInputVx = stepResult.vx;
    this.lastInputVy = stepResult.vy;
    this.lastRequestedDir = stepResult.requestedDir;
    this.localDir = stepResult.actualDir;

    const actualDx = this.localX - prevX;
    const actualDy = this.localY - prevY;
    if (stepResult.moved && (Math.abs(actualDx) > 0.001 || Math.abs(actualDy) > 0.001)) {
      this.lastMovedAt = Math.max(this.lastMovedAt, this.time.now);
    }

    const isWalking = stepResult.moved || this.time.now - this.lastMovedAt < 90;
    if (this.time.now < this.attackAnimUntil) {
      this.localAnim = this.activeActionState;
    } else if (this.time.now < this.hurtAnimUntil) {
      this.localAnim = "hurt";
    } else {
      this.localAnim = isWalking ? "walk" : "idle";
    }
    this.lastRequestedAnimState = this.localAnim;

    const self = this.net.selfState;
    const hasBlessing = Boolean(
      self?.quests.phi_de_ch1_huong_thom?.status === "completed" ||
        self?.buffs.some((b) => b.slot === "blessing")
    );
    this.actorViews.updateVisualBundlePosition(
      localVisual,
      this.localX,
      this.localY,
      (self?.hp ?? 100) / Math.max(1, self?.maxHp ?? 100),
      hasBlessing,
      false
    );
    const resolvedLocal = this.resolveSpriteAnim(
      this.actorViews.localAppearanceKey,
      this.localAnim,
      this.localDir
    );
    const isLoopingState = this.localAnim === "idle" || this.localAnim === "walk";
    if (
      this.anims.exists(resolvedLocal.animKey) &&
      (localVisual.sprite.anims.currentAnim?.key !== resolvedLocal.animKey ||
        (isLoopingState && !localVisual.sprite.anims.isPlaying))
    ) {
      this.localAnimRestartCount += 1;
      localVisual.sprite.play(resolvedLocal.animKey, true);
    }

    this.actorViews.updateNpcFacingAndAnims(
      this.currentZoneId,
      this.localX,
      this.localY,
      this.time.now
    );

    if (this.time.now - this.lastMoveSentAt >= 65) {
      this.lastMoveSentAt = this.time.now;
      this.net.sendMove(
        this.localX,
        this.localY,
        stepResult.vx,
        stepResult.vy,
        this.localDir
      );
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
          .setPosition(portal.x, portal.y - 144)
          .setVisible(true);
        return;
      }
    }

    const npcsInZone = LEGENDARY_NPCS.filter((n) => n.zoneId === this.currentZoneId);
    for (const npc of npcsInZone) {
      if (Math.hypot(this.localX - npc.spawnX, this.localY - npc.spawnY) <= 125) {
        this.interactPromptText
          .setText(`[E] Đàm Đạo: ${npc.nameVi}`)
          .setPosition(npc.spawnX, npc.spawnY - 92)
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

  public getMinimapTelemetry(): unknown {
    return this.getHud()?.getMinimapTelemetry() ?? null;
  }

  public toggleMinimapSize(force?: boolean): boolean {
    return this.getHud()?.toggleMinimapSize(force) ?? false;
  }

  public refreshHudPanelsForTest(): void {
    this.getHud()?.refreshPanels();
  }

  public setLocalDirForTest(dir: Direction): void {
    this.localDir = dir;
    this.net.sendMove(this.localX, this.localY, 0, 0, this.localDir);
  }

  public resetAnimRestartCount(): void {
    this.localAnimRestartCount = 0;
  }

  public triggerHurtForTest(): void {
    this.hurtAnimUntil = this.time.now + 390;
    if (this.actorViews.localVisual && this.time.now >= this.attackAnimUntil) {
      const resolved = this.resolveSpriteAnim(
        this.actorViews.localAppearanceKey,
        "hurt",
        this.localDir
      );
      if (this.anims.exists(resolved.animKey)) {
        this.localAnimRestartCount += 1;
        this.actorViews.localVisual.sprite.play(resolved.animKey, false);
      }
    }
  }

  public setNpcAnimForTest(
    npcId: string,
    state: AnimState,
    dir: Direction,
    durationMs = 2000
  ): void {
    this.actorViews.npcOverrideAnims.set(npcId, {
      state,
      dir,
      until: this.time.now + durationMs
    });
    const npc = LEGENDARY_NPCS.find((n) => n.id === npcId);
    if (npc && state === "cast") {
      this.combatVisuals.spawnNpcCastEffect(npc.spawnX, npc.spawnY);
    } else if (npc && state === "attack") {
      this.combatVisuals.spawnSlashEffect(npc.spawnX, npc.spawnY, dir, "kiem_khi_ung");
    }
  }

  public setLocalPositionForTest(x: number, y: number, dir: Direction = "down"): void {
    this.localDir = dir;
    this.lastMovedAt = 0;
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
    if (this.actorViews.localVisual) {
      const self = this.net.selfState;
      this.actorViews.updateVisualBundlePosition(
        this.actorViews.localVisual,
        this.localX,
        this.localY,
        (self?.hp ?? 100) / Math.max(1, self?.maxHp ?? 100),
        false,
        false
      );
      const resolved = this.resolveSpriteAnim(
        this.actorViews.localAppearanceKey,
        "idle",
        this.localDir
      );
      this.actorViews.localVisual.sprite.play(resolved.animKey, true);
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
  ): BfsTileStep[] {
    return computeBfsTilePathOnGrid(
      startX,
      startY,
      targetX,
      targetY,
      this.mapView.getCollisionGrid(),
      (wx, wy) => this.isWalkableLocal(wx, wy)
    );
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
    const subSteps = stepDelayMs >= 16 ? 4 : 1;
    const subDelay = Math.max(1, Math.round(stepDelayMs / subSteps));
    for (const st of pathSteps) {
      const fromX = this.localX;
      const fromY = this.localY;
      this.localDir = st.dir;
      for (let s = 1; s <= subSteps; s++) {
        this.localX = fromX + ((st.x - fromX) * s) / subSteps;
        this.localY = fromY + ((st.y - fromY) * s) / subSteps;
        this.lastMovedAt = this.time.now + subDelay + 80;
        this.localAnim = "walk";
        if (this.actorViews.localVisual) {
          this.actorViews.updateVisualBundlePosition(
            this.actorViews.localVisual,
            this.localX,
            this.localY,
            1,
            false,
            false
          );
          const resolved = this.resolveSpriteAnim(
            this.actorViews.localAppearanceKey,
            "walk",
            st.dir
          );
          if (
            this.actorViews.localVisual.sprite.anims.currentAnim?.key !==
              resolved.animKey ||
            !this.actorViews.localVisual.sprite.anims.isPlaying
          ) {
            this.actorViews.localVisual.sprite.play(resolved.animKey, true);
          }
        }
        if (s === subSteps) {
          this.net.sendMove(st.x, st.y, 0, 0, st.dir);
        }
        this.syncMinimapOverlay();
        this.updateInteractPrompt();
        if (stepDelayMs > 0) {
          await new Promise((r) => setTimeout(r, subDelay));
        }
      }
    }
    this.lastMovedAt = 0;
    this.localAnim = "idle";
    if (this.actorViews.localVisual) {
      const resolved = this.resolveSpriteAnim(
        this.actorViews.localAppearanceKey,
        "idle",
        this.localDir
      );
      this.actorViews.localVisual.sprite.play(resolved.animKey, true);
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
      spriteFrameIndex: number;
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
    worldProps: WorldPropMetadata[];
  } {
    const lv = this.actorViews.localVisual;
    return {
      localPlayer: lv
        ? {
            x: Math.round(this.localX),
            y: Math.round(this.localY),
            spriteDepth: lv.sprite.depth,
            nameLabelDepth: lv.nameLabel.depth,
            currentAnimKey: lv.sprite.anims.currentAnim?.key ?? null,
            spriteFrameIndex: lv.sprite.anims.currentFrame?.index ?? 0
          }
        : null,
      npcs: LEGENDARY_NPCS.filter((n) => n.zoneId === this.currentZoneId).map((npc) => {
        const b = this.actorViews.npcVisuals.get(npc.id);
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
      worldProps: this.mapView.getWorldPropMetadata()
    };
  }

  public getAnimationContractTelemetry(): {
    profiles: Record<string, SpriteProfileDef>;
    registeredAnimKeys: string[];
    fallbackLog: ResolvedSpriteAnimation[];
  } {
    return this.animRegistry.getContractTelemetry(this.anims);
  }

  public setFixedAnimTestMode(animKey: string | null): void {
    this.fixedAnimTestKey = animKey;
    this.localAnimRestartCount = 0;
    if (animKey && this.actorViews.localVisual && this.anims.exists(animKey)) {
      this.localAnimRestartCount += 1;
      this.actorViews.localVisual.sprite.play(animKey, true);
    }
  }

  public getLocomotionSample(): {
    timestampMs: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    requestedDir: Direction;
    actualDir: Direction;
    requestedAnimState: AnimState;
    animKey: string | null;
    animFrameOrderIndex: number;
    sheetFrameIndex: number;
    animRestartCount: number;
    fixedAnimTestKey: string | null;
  } {
    const lv = this.actorViews.localVisual;
    const rawFrameName = lv?.sprite.frame?.name;
    const sheetFrameIdx =
      rawFrameName !== undefined && rawFrameName !== null ? Number(rawFrameName) : 0;
    return {
      timestampMs: Math.round(this.time.now),
      x: Math.round(this.localX * 100) / 100,
      y: Math.round(this.localY * 100) / 100,
      vx: this.lastInputVx,
      vy: this.lastInputVy,
      requestedDir: this.lastRequestedDir,
      actualDir: this.localDir,
      requestedAnimState: this.lastRequestedAnimState,
      animKey: lv?.sprite.anims.currentAnim?.key ?? null,
      animFrameOrderIndex: lv?.sprite.anims.currentFrame?.index ?? 0,
      sheetFrameIndex: Number.isFinite(sheetFrameIdx) ? sheetFrameIdx : 0,
      animRestartCount: this.localAnimRestartCount,
      fixedAnimTestKey: this.fixedAnimTestKey
    };
  }

  public renderGameToText(): string {
    const self = this.net.selfState;
    const snap = this.net.worldSnapshot;
    const lv = this.actorViews?.localVisual ?? null;
    const appKey = this.actorViews?.localAppearanceKey ?? "hero_kiem_tu";
    return JSON.stringify({
      entryState: this.getEntryFlowState(),
      inWorld: this.isPlayerInWorld(),
      worldActorCount: this.getWorldActorCount(),
      zoneId: this.currentZoneId,
      zoneNameVi: ZONES_REGISTRY[this.currentZoneId].nameVi,
      v02Mode: this.net.isV02Mode(),
      v02Character: this.net.selfStateV02,
      v02ActiveRollDraft: this.net.activeRollDraft,
      localAvatarVisible: Boolean(lv?.sprite.visible),
      localAppearanceKey: appKey,
      localPlayer: {
        accountId: this.net.getAccountId(),
        nickname: self?.nickname ?? "",
        appearanceId: self?.appearanceId ?? appKey,
        level: self?.level ?? this.net.selfStateV02?.levelProgress.level ?? 1,
        x: Math.round(this.localX),
        y: Math.round(this.localY),
        direction: this.localDir,
        anim: this.localAnim,
        spriteAnimKey: lv?.sprite.anims.currentAnim?.key ?? "",
        spriteFrameIndex: lv?.sprite.anims.currentFrame?.index ?? 0,
        sheetFrameIndex: Number(lv?.sprite.frame?.name ?? 0),
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
  }
}
