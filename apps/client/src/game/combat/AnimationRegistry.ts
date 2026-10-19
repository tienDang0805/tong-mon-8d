import type Phaser from "phaser";
import type { Direction } from "@tong-mon-8d/shared";
import {
  SPRITE_PROFILES,
  type ResolvedSpriteAnimation,
  type SpriteProfileDef
} from "../assets/SpriteProfiles.js";

export class AnimationRegistry {
  private readonly fallbackLog: ResolvedSpriteAnimation[] = [];

  public registerAll(anims: Phaser.Animations.AnimationManager): void {
    const dirs: Direction[] = ["down", "left", "right", "up"];

    for (const profile of Object.values(SPRITE_PROFILES)) {
      const sk = profile.spriteKey;
      const cols = profile.columns ?? 6;
      const layout = profile.stateLayout;

      if (profile.kind === "stationary_npc_80x96_4f") {
        const idleSpec = layout?.idle ?? { startRow: 0, rowCount: 1, framesPerRow: 4, fps: 5, repeat: -1 };
        if (!anims.exists(`${sk}_idle_down`)) {
          anims.create({
            key: `${sk}_idle_down`,
            frames: anims.generateFrameNumbers(sk, {
              start: idleSpec.startRow * cols,
              end: idleSpec.startRow * cols + idleSpec.framesPerRow - 1
            }),
            frameRate: idleSpec.fps,
            repeat: idleSpec.repeat
          });
        }
        continue;
      }

      if (profile.kind === "locomotion_80x96_8row") {
        const idleSpec = layout?.idle ?? { startRow: 0, rowCount: 4, framesPerRow: 4, fps: 5, repeat: -1 };
        const walkSpec = layout?.walk ?? { startRow: 4, rowCount: 4, framesPerRow: 6, fps: 10, repeat: -1 };
        dirs.forEach((dir, dIdx) => {
          const idleRow = idleSpec.startRow + dIdx;
          const walkRow = walkSpec.startRow + dIdx;
          if (!anims.exists(`${sk}_idle_${dir}`)) {
            anims.create({
              key: `${sk}_idle_${dir}`,
              frames: anims.generateFrameNumbers(sk, {
                start: idleRow * cols,
                end: idleRow * cols + idleSpec.framesPerRow - 1
              }),
              frameRate: idleSpec.fps,
              repeat: idleSpec.repeat
            });
          }
          if (!anims.exists(`${sk}_walk_${dir}`)) {
            anims.create({
              key: `${sk}_walk_${dir}`,
              frames: anims.generateFrameNumbers(sk, {
                start: walkRow * cols,
                end: walkRow * cols + walkSpec.framesPerRow - 1
              }),
              frameRate: walkSpec.fps,
              repeat: walkSpec.repeat
            });
          }
        });
        continue;
      }

      const isFull20Row =
        profile.kind === "full_80x96_20row" || profile.kind === "full_80x96_20row_8walk";
      const idleSpec = layout?.idle ?? { startRow: 0, rowCount: 4, framesPerRow: 4, fps: 5, repeat: -1 };
      const walkSpec = layout?.walk ?? {
        startRow: 4,
        rowCount: 4,
        framesPerRow: profile.kind === "full_80x96_20row_8walk" ? 8 : 6,
        fps: 10,
        repeat: -1
      };
      const atkSpec = layout?.attack ?? { startRow: 8, rowCount: 4, framesPerRow: 4, fps: 10, repeat: 0 };
      const castSpec = layout?.cast ?? { startRow: 12, rowCount: 4, framesPerRow: 4, fps: 10, repeat: 0 };
      const hurtSpec = layout?.hurt ?? { startRow: 16, rowCount: 4, framesPerRow: 4, fps: 10, repeat: 0 };

      dirs.forEach((dir, dIdx) => {
        const idleRow = idleSpec.startRow + dIdx;
        const walkRow = walkSpec.startRow + dIdx;
        const atkRow = atkSpec.startRow + dIdx;
        const castRow = castSpec.startRow + dIdx;
        const hurtRow = hurtSpec.startRow + dIdx;

        if (!anims.exists(`${sk}_idle_${dir}`)) {
          anims.create({
            key: `${sk}_idle_${dir}`,
            frames: anims.generateFrameNumbers(sk, {
              start: idleRow * cols,
              end: idleRow * cols + idleSpec.framesPerRow - 1
            }),
            frameRate: idleSpec.fps,
            repeat: idleSpec.repeat
          });
        }
        if (!anims.exists(`${sk}_walk_${dir}`)) {
          anims.create({
            key: `${sk}_walk_${dir}`,
            frames: anims.generateFrameNumbers(sk, {
              start: walkRow * cols,
              end: walkRow * cols + walkSpec.framesPerRow - 1
            }),
            frameRate: walkSpec.fps,
            repeat: walkSpec.repeat
          });
        }
        if (!anims.exists(`${sk}_attack_${dir}`)) {
          anims.create({
            key: `${sk}_attack_${dir}`,
            frames: anims.generateFrameNumbers(sk, {
              start: atkRow * cols,
              end: atkRow * cols + atkSpec.framesPerRow - 1
            }),
            frameRate: atkSpec.fps,
            repeat: atkSpec.repeat
          });
        }
        if (!anims.exists(`${sk}_cast_${dir}`)) {
          anims.create({
            key: `${sk}_cast_${dir}`,
            frames: anims.generateFrameNumbers(sk, {
              start: castRow * cols,
              end: castRow * cols + castSpec.framesPerRow - 1
            }),
            frameRate: castSpec.fps,
            repeat: castSpec.repeat
          });
        }
        if (isFull20Row && !anims.exists(`${sk}_hurt_${dir}`)) {
          anims.create({
            key: `${sk}_hurt_${dir}`,
            frames: anims.generateFrameNumbers(sk, {
              start: hurtRow * cols,
              end: hurtRow * cols + hurtSpec.framesPerRow - 1
            }),
            frameRate: hurtSpec.fps,
            repeat: hurtSpec.repeat
          });
        }
      });
    }

    if (!anims.exists("vfx_portal_spin")) {
      anims.create({
        key: "vfx_portal_spin",
        frames: anims.generateFrameNumbers("portal_ring", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!anims.exists("vfx_blessing_pulse")) {
      anims.create({
        key: "vfx_blessing_pulse",
        frames: anims.generateFrameNumbers("phi_de_blessing", { start: 0, end: 3 }),
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
      if (!anims.exists(vd.key)) {
        anims.create({
          key: vd.key,
          frames: anims.generateFrameNumbers("combat_vfx", {
            start: vd.row * 4,
            end: vd.row * 4 + 3
          }),
          frameRate: vd.rate,
          repeat: vd.repeat
        });
      }
    }
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
      if (isFallback && this.fallbackLog.length < 64) {
        this.fallbackLog.push(resolved);
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
      if (isFallback && this.fallbackLog.length < 64) {
        this.fallbackLog.push(resolved);
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
      if (isFallback && this.fallbackLog.length < 64) {
        this.fallbackLog.push(resolved);
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

  public getContractTelemetry(anims: Phaser.Animations.AnimationManager): {
    profiles: Record<string, SpriteProfileDef>;
    registeredAnimKeys: string[];
    fallbackLog: ResolvedSpriteAnimation[];
  } {
    const entries = (anims as unknown as { anims?: { entries?: Record<string, unknown> } })
      .anims?.entries;
    const animKeys = entries ? Object.keys(entries) : [];
    return {
      profiles: SPRITE_PROFILES,
      registeredAnimKeys: animKeys,
      fallbackLog: this.fallbackLog
    };
  }
}
