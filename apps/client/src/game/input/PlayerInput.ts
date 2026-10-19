import Phaser from "phaser";
import type { Direction } from "@tong-mon-8d/shared";

export interface PlayerInputCallbacks {
  onSkill(skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang"): void;
  onContextualInteract(): void;
  onPickupNearestDrop(): void;
  onStepZoom(delta: -1 | 1): void;
  canAcceptWorldPointerInput(): boolean;
  canAcceptGameplayInput?: () => boolean;
}

export class PlayerInputController {
  public pointerTarget: { x: number; y: number } | null = null;
  public navWaypoints: Array<{ x: number; y: number }> = [];
  public touchVector = { vx: 0, vy: 0 };

  private keys?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    UP: Phaser.Input.Keyboard.Key;
    LEFT: Phaser.Input.Keyboard.Key;
    DOWN: Phaser.Input.Keyboard.Key;
    RIGHT: Phaser.Input.Keyboard.Key;
    ONE: Phaser.Input.Keyboard.Key;
    TWO: Phaser.Input.Keyboard.Key;
    THREE: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
    K: Phaser.Input.Keyboard.Key;
    L: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    F: Phaser.Input.Keyboard.Key;
    BRACKET_LEFT: Phaser.Input.Keyboard.Key;
    BRACKET_RIGHT: Phaser.Input.Keyboard.Key;
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: PlayerInputCallbacks
  ) {}

  private canAct(): boolean {
    if (this.isTypingInInput()) {
      return false;
    }
    if (this.callbacks.canAcceptGameplayInput) {
      return this.callbacks.canAcceptGameplayInput();
    }
    return this.callbacks.canAcceptWorldPointerInput();
  }

  public clearNavigation(): void {
    this.pointerTarget = null;
    this.navWaypoints = [];
    this.touchVector = { vx: 0, vy: 0 };
  }

  public setup(): void {
    if (this.scene.input.keyboard) {
      const keys = this.scene.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        UP: Phaser.Input.Keyboard.KeyCodes.UP,
        LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
        DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
        RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
        TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
        THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
        J: Phaser.Input.Keyboard.KeyCodes.J,
        K: Phaser.Input.Keyboard.KeyCodes.K,
        L: Phaser.Input.Keyboard.KeyCodes.L,
        E: Phaser.Input.Keyboard.KeyCodes.E,
        F: Phaser.Input.Keyboard.KeyCodes.F,
        BRACKET_LEFT: Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET,
        BRACKET_RIGHT: Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET
      }) as NonNullable<typeof this.keys>;
      this.keys = keys;

      const triggerSlash = () => {
        if (!this.canAct()) return;
        this.callbacks.onSkill("basic_slash");
      };
      const triggerKiemKhi = () => {
        if (!this.canAct()) return;
        this.callbacks.onSkill("kiem_khi_ung");
      };
      const triggerHoThe = () => {
        if (!this.canAct()) return;
        this.callbacks.onSkill("ho_the_kim_quang");
      };

      keys.J.on("down", triggerSlash);
      keys.ONE.on("down", triggerSlash);
      keys.K.on("down", triggerKiemKhi);
      keys.TWO.on("down", triggerKiemKhi);
      keys.L.on("down", triggerHoThe);
      keys.THREE.on("down", triggerHoThe);

      keys.E.on("down", () => {
        if (!this.canAct()) return;
        this.callbacks.onContextualInteract();
      });
      keys.F.on("down", () => {
        if (!this.canAct()) return;
        this.callbacks.onPickupNearestDrop();
      });
      keys.BRACKET_LEFT.on("down", () => {
        if (!this.canAct()) return;
        this.callbacks.onStepZoom(-1);
      });
      keys.BRACKET_RIGHT.on("down", () => {
        if (!this.canAct()) return;
        this.callbacks.onStepZoom(1);
      });
    }

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.canAct()) return;
      if (!this.callbacks.canAcceptWorldPointerInput()) return;
      const worldPt = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.navWaypoints = [];
      this.pointerTarget = { x: worldPt.x, y: worldPt.y };
    });
  }

  public isTypingInInput(): boolean {
    const active = document.activeElement;
    return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  }

  public computeMovementStep(
    localX: number,
    localY: number,
    localDir: Direction,
    deltaMs: number,
    isWalkableLocal: (worldX: number, worldY: number) => boolean
  ): {
    x: number;
    y: number;
    vx: number;
    vy: number;
    requestedDir: Direction;
    actualDir: Direction;
    moved: boolean;
  } {
    if (!this.canAct()) {
      return {
        x: localX,
        y: localY,
        vx: 0,
        vy: 0,
        requestedDir: localDir,
        actualDir: localDir,
        moved: false
      };
    }

    let vx = this.touchVector.vx;
    let vy = this.touchVector.vy;

    if (this.keys) {
      if (this.keys.A.isDown || this.keys.LEFT.isDown) vx -= 1;
      if (this.keys.D.isDown || this.keys.RIGHT.isDown) vx += 1;
      if (this.keys.W.isDown || this.keys.UP.isDown) vy -= 1;
      if (this.keys.S.isDown || this.keys.DOWN.isDown) vy += 1;
    }

    if (vx !== 0 || vy !== 0) {
      this.pointerTarget = null;
      this.navWaypoints = [];
    } else if (this.navWaypoints.length > 0) {
      while (this.navWaypoints.length > 0) {
        const wp = this.navWaypoints[0]!;
        const dx = wp.x - localX;
        const dy = wp.y - localY;
        const d = Math.hypot(dx, dy);
        if (d <= 12) {
          this.navWaypoints.shift();
        } else {
          vx = dx / d;
          vy = dy / d;
          break;
        }
      }
    } else if (this.pointerTarget) {
      const dx = this.pointerTarget.x - localX;
      const dy = this.pointerTarget.y - localY;
      const d = Math.hypot(dx, dy);
      if (d > 10) {
        vx = dx / d;
        vy = dy / d;
      } else {
        this.pointerTarget = null;
      }
    }

    const speed = 175;
    let nextX = localX;
    let nextY = localY;
    let moved = false;
    let reqDir: Direction = localDir;
    let actualDir: Direction = localDir;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      const nx = vx / len;
      const ny = vy / len;
      if (Math.abs(nx) >= Math.abs(ny)) {
        reqDir = nx < 0 ? "left" : "right";
      } else {
        reqDir = ny < 0 ? "up" : "down";
      }
      const step = (speed * Math.min(deltaMs, 50)) / 1000;
      const tryX = localX + nx * step;
      const tryY = localY + ny * step;
      if (isWalkableLocal(tryX, tryY)) {
        nextX = tryX;
        nextY = tryY;
        moved = true;
      } else if (Math.abs(nx) > 0.001 && isWalkableLocal(tryX, localY)) {
        nextX = tryX;
        moved = true;
      } else if (Math.abs(ny) > 0.001 && isWalkableLocal(localX, tryY)) {
        nextY = tryY;
        moved = true;
      }
      const actualDx = nextX - localX;
      const actualDy = nextY - localY;
      if (moved && (Math.abs(actualDx) > 0.01 || Math.abs(actualDy) > 0.01)) {
        if (Math.abs(actualDx) >= Math.abs(actualDy) * 0.95) {
          actualDir = actualDx < 0 ? "left" : "right";
        } else {
          actualDir = actualDy < 0 ? "up" : "down";
        }
      } else {
        actualDir = reqDir;
      }
    }

    return {
      x: nextX,
      y: nextY,
      vx,
      vy,
      requestedDir: reqDir,
      actualDir,
      moved
    };
  }
}
