import type { Direction } from "@tong-mon-8d/shared";
import {
  SPRITE_PROFILES,
  buildDirectionalFrameRange,
  resolvePlayerSpriteKey
} from "../../game/assets/SpriteProfiles.js";

const imageCache = new Map<string, HTMLImageElement>();

function getOrLoadSpriteSheet(spriteKey: string): HTMLImageElement {
  const existing = imageCache.get(spriteKey);
  if (existing) {
    return existing;
  }
  const img = new Image();
  img.src = `/assets/sprites/${spriteKey}.png?v=20261019_v5`;
  imageCache.set(spriteKey, img);
  return img;
}

export class SpritePreviewAnimator {
  private rafId: number | null = null;
  private currentCanvas: HTMLCanvasElement | null = null;
  private spriteKey = "hero_kiem_tu";
  private direction: Direction = "down";
  private animState: "idle" | "walk" = "idle";
  private startTimeMs = 0;

  public attach(
    canvas: HTMLCanvasElement | null,
    appearanceId: string,
    direction: Direction,
    animState: "idle" | "walk" = "idle"
  ): void {
    this.stop();
    if (!canvas) {
      return;
    }
    this.currentCanvas = canvas;
    this.spriteKey = resolvePlayerSpriteKey(appearanceId);
    this.direction = direction;
    this.animState = animState;
    this.startTimeMs = performance.now();

    const sheet = getOrLoadSpriteSheet(this.spriteKey);
    const loop = (nowMs: number) => {
      if (!this.currentCanvas || !this.currentCanvas.isConnected) {
        this.stop();
        return;
      }
      this.drawFrame(this.currentCanvas, sheet, nowMs);
      this.rafId = window.requestAnimationFrame(loop);
    };
    this.drawFrame(canvas, sheet, this.startTimeMs);
    this.rafId = window.requestAnimationFrame(loop);
  }

  public updateState(
    appearanceId: string,
    direction: Direction,
    animState: "idle" | "walk" = "idle"
  ): void {
    this.spriteKey = resolvePlayerSpriteKey(appearanceId);
    this.direction = direction;
    this.animState = animState;
  }

  public stop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.currentCanvas = null;
  }

  private drawFrame(
    canvas: HTMLCanvasElement,
    sheet: HTMLImageElement,
    nowMs: number
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;

    const profile = SPRITE_PROFILES[this.spriteKey] ?? SPRITE_PROFILES.hero_kiem_tu!;
    const range = buildDirectionalFrameRange(
      profile.kind,
      this.animState,
      this.direction
    );
    const totalFrames = Math.max(1, range.end - range.start + 1);
    const fps = Math.max(1, range.frameRate || 6);
    const elapsedSec = Math.max(0, (nowMs - this.startTimeMs) / 1000);
    const frameOffset = Math.floor(elapsedSec * fps) % totalFrames;
    const frameIndex = range.start + frameOffset;

    const cols = Math.max(1, profile.columns);
    const col = frameIndex % cols;
    const row = Math.floor(frameIndex / cols);
    const sx = col * profile.frameWidth;
    const sy = row * profile.frameHeight;

    if (sheet.complete && sheet.naturalWidth >= sx + profile.frameWidth) {
      const scale = Math.min(w / profile.frameWidth, h / profile.frameHeight);
      const dw = Math.round(profile.frameWidth * scale);
      const dh = Math.round(profile.frameHeight * scale);
      const dx = Math.round((w - dw) / 2);
      const dy = Math.round((h - dh) / 2);
      ctx.drawImage(
        sheet,
        sx,
        sy,
        profile.frameWidth,
        profile.frameHeight,
        dx,
        dy,
        dw,
        dh
      );
    }
  }
}
