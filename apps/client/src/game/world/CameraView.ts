import Phaser from "phaser";
import type { ZoneId } from "@tong-mon-8d/shared";

export interface ResponsiveCameraProfile {
  tier: "mobile_handheld" | "hd_720p" | "fhd_1080p" | "qhd_2k" | "4k_uhd";
  defaultZoom: number;
  minZoom: number;
  safeMinZoom: number;
  maxZoom: number;
  zoomSteps: number[];
}

export interface CameraTelemetry {
  zoneId: ZoneId;
  profileTier: ResponsiveCameraProfile["tier"];
  zoom: number;
  safeMinZoom: number;
  maxZoom: number;
  worldWidthPx: number;
  worldHeightPx: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
  worldView: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  visibleWorldWidthRatio: number;
  visibleWorldHeightRatio: number;
}

export function computeResponsiveCameraProfile(
  viewportW: number,
  viewportH: number,
  worldW: number,
  worldH: number
): ResponsiveCameraProfile {
  const safeW = Math.max(320, viewportW);
  const safeH = Math.max(240, viewportH);

  let tier: ResponsiveCameraProfile["tier"] = "hd_720p";
  let defaultZoom = 1.25;
  let minZoom = 1.0;
  let maxZoom = 2.0;
  let zoomSteps = [1.0, 1.25, 1.5, 2.0];

  if (safeW <= 600) {
    tier = "mobile_handheld";
    defaultZoom = 1.0;
    minZoom = 1.0;
    maxZoom = 1.5;
    zoomSteps = [1.0, 1.25, 1.5];
  } else if (safeW >= 3200 || safeH >= 1800) {
    tier = "4k_uhd";
    defaultZoom = 4.0;
    minZoom = 3.0;
    maxZoom = 5.0;
    zoomSteps = [3.0, 4.0, 5.0];
  } else if (safeW >= 2200 || safeH >= 1300) {
    tier = "qhd_2k";
    defaultZoom = 3.0;
    minZoom = 2.0;
    maxZoom = 4.0;
    zoomSteps = [2.0, 2.5, 3.0, 4.0];
  } else if (safeW >= 1600 || safeH >= 960) {
    tier = "fhd_1080p";
    defaultZoom = 2.0;
    minZoom = 1.5;
    maxZoom = 3.0;
    zoomSteps = [1.5, 2.0, 2.5, 3.0];
  }

  const ratioFloor =
    worldW >= 2400 && worldH >= 1800
      ? Math.max(safeW / (worldW * 0.6), safeH / (worldH * 0.6))
      : minZoom;
  const safeMinZoom = Number(Math.max(minZoom, ratioFloor).toFixed(4));
  const clampedDefault = Math.max(safeMinZoom, Math.min(maxZoom, defaultZoom));
  const filteredSteps = zoomSteps.filter((z) => z + 0.001 >= safeMinZoom && z - 0.001 <= maxZoom);
  if (filteredSteps.length === 0) {
    filteredSteps.push(clampedDefault);
  }

  return {
    tier,
    defaultZoom: clampedDefault,
    minZoom,
    safeMinZoom,
    maxZoom,
    zoomSteps: filteredSteps
  };
}

export class CameraView {
  private scene: Phaser.Scene;
  private zoneId: ZoneId = "tan_thu_thon";
  private worldW = 3072;
  private worldH = 2304;
  private profile: ResponsiveCameraProfile;
  private userOverrideZoom: number | null = null;
  private followTarget: Phaser.GameObjects.GameObject | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.profile = computeResponsiveCameraProfile(
      scene.scale.width || 1280,
      scene.scale.height || 720,
      this.worldW,
      this.worldH
    );
  }

  bindWorldAndTarget(
    zoneId: ZoneId,
    worldW: number,
    worldH: number,
    target: Phaser.GameObjects.GameObject
  ): void {
    this.zoneId = zoneId;
    this.worldW = worldW;
    this.worldH = worldH;
    this.followTarget = target;
    this.userOverrideZoom = null;

    const cam = this.scene.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setRoundPixels(true);
    cam.startFollow(target, true, 0.14, 0.14, 0, -24);

    this.applyResponsiveViewport(
      this.scene.scale.width || window.innerWidth || 1280,
      this.scene.scale.height || window.innerHeight || 720,
      false
    );
  }

  applyResponsiveViewport(
    viewportW: number,
    viewportH: number,
    preserveUserOverride = true
  ): ResponsiveCameraProfile {
    const prevTier = this.profile?.tier;
    this.profile = computeResponsiveCameraProfile(viewportW, viewportH, this.worldW, this.worldH);
    if (!preserveUserOverride || prevTier !== this.profile.tier) {
      this.userOverrideZoom = null;
    }

    const desired = this.userOverrideZoom ?? this.profile.defaultZoom;
    const clamped = Math.max(this.profile.safeMinZoom, Math.min(this.profile.maxZoom, desired));
    const cam = this.scene.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.setZoom(clamped);
    cam.setRoundPixels(true);
    this.syncCameraWorldView(cam);
    return this.profile;
  }

  setZoom(targetZoom: number, isUserOverride = true): number {
    const clamped = Math.max(
      this.profile.safeMinZoom,
      Math.min(this.profile.maxZoom, Number(targetZoom) || this.profile.defaultZoom)
    );
    if (isUserOverride) {
      this.userOverrideZoom = clamped;
    }
    const cam = this.scene.cameras.main;
    cam.setZoom(clamped);
    this.syncCameraWorldView(cam);
    return clamped;
  }

  stepZoom(direction: -1 | 1): number {
    const current = this.scene.cameras.main.zoom;
    const steps = this.profile.zoomSteps;
    let closestIdx = 0;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < steps.length; i++) {
      const diff = Math.abs(steps[i]! - current);
      if (diff < bestDiff) {
        bestDiff = diff;
        closestIdx = i;
      }
    }
    const nextIdx = Math.max(0, Math.min(steps.length - 1, closestIdx + direction));
    return this.setZoom(steps[nextIdx] ?? this.profile.defaultZoom, true);
  }

  snapToTarget(x?: number, y?: number): void {
    const cam = this.scene.cameras.main;
    if (typeof x === "number" && typeof y === "number") {
      cam.centerOn(x, y - 24);
      this.syncCameraWorldView(cam);
      return;
    }
    const t = this.followTarget as { x?: number; y?: number } | null;
    if (t && typeof t.x === "number" && typeof t.y === "number") {
      cam.centerOn(t.x, t.y - 24);
      this.syncCameraWorldView(cam);
    }
  }

  private syncCameraWorldView(cam: Phaser.Cameras.Scene2D.Camera): void {
    const internalCam = cam as unknown as { preRender?: () => void };
    if (typeof internalCam.preRender === "function") {
      internalCam.preRender();
    }
  }

  getTelemetry(): CameraTelemetry {
    const cam = this.scene.cameras.main;
    this.syncCameraWorldView(cam);
    const effZoom = Math.max(0.1, cam.zoom);
    const vw = cam.width / effZoom;
    const vh = cam.height / effZoom;
    const wv = cam.worldView;
    const wx = wv && Number.isFinite(wv.x) ? wv.x : cam.scrollX;
    const wy = wv && Number.isFinite(wv.y) ? wv.y : cam.scrollY;
    return {
      zoneId: this.zoneId,
      profileTier: this.profile.tier,
      zoom: Number(cam.zoom.toFixed(4)),
      safeMinZoom: this.profile.safeMinZoom,
      maxZoom: this.profile.maxZoom,
      worldWidthPx: this.worldW,
      worldHeightPx: this.worldH,
      viewportWidthPx: cam.width,
      viewportHeightPx: cam.height,
      worldView: {
        x: Math.round(wx),
        y: Math.round(wy),
        width: Math.round(vw),
        height: Math.round(vh)
      },
      visibleWorldWidthRatio: Number((vw / Math.max(1, this.worldW)).toFixed(4)),
      visibleWorldHeightRatio: Number((vh / Math.max(1, this.worldH)).toFixed(4))
    };
  }
}
