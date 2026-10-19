import type { AnimState, Direction } from "@tong-mon-8d/shared";
import type { CollisionGridData } from "../world/MapView.js";

export interface BfsTileStep {
  tx: number;
  ty: number;
  x: number;
  y: number;
  dir: Direction;
}

export function isDevOrIsolatedTestMode(): boolean {
  const isViteDev = Boolean(
    (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
  );
  if (isViteDev) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  const win = window as unknown as { __TONG_MON_TEST_MODE__?: boolean };
  if (win.__TONG_MON_TEST_MODE__ === true) {
    return true;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("e2e") === "1" || params.get("testMode") === "1";
  } catch {
    return false;
  }
}

export function findNearestWalkableTile(
  tx: number,
  ty: number,
  grid: CollisionGridData,
  isWalkableLocal: (worldX: number, worldY: number) => boolean
): [number, number] {
  const w = grid.width;
  const h = grid.height;
  const cx = Math.max(1, Math.min(w - 2, tx));
  const cy = Math.max(1, Math.min(h - 2, ty));
  if (isWalkableLocal(cx * 32 + 16, cy * 32 + 16)) {
    return [cx, cy];
  }
  for (let r = 1; r <= 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 1 || ny < 1 || nx >= w - 1 || ny >= h - 1) continue;
        if (isWalkableLocal(nx * 32 + 16, ny * 32 + 16)) {
          return [nx, ny];
        }
      }
    }
  }
  return [cx, cy];
}

export function computeBfsTilePathOnGrid(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  grid: CollisionGridData,
  isWalkableLocal: (worldX: number, worldY: number) => boolean
): BfsTileStep[] {
  const w = grid.width;
  const h = grid.height;
  const [sx, sy] = findNearestWalkableTile(
    Math.floor(startX / 32),
    Math.floor(startY / 32),
    grid,
    isWalkableLocal
  );
  const [gx, gy] = findNearestWalkableTile(
    Math.floor(targetX / 32),
    Math.floor(targetY / 32),
    grid,
    isWalkableLocal
  );

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
      if (!isWalkableLocal(nx * 32 + 16, ny * 32 + 16)) continue;
      visited.add(nKey);
      parent.set(nKey, { prev: curKey, dir: step.dir });
      queue.push([nx, ny]);
    }
  }

  if (!found) return [];
  const steps: BfsTileStep[] = [];
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

export interface WorldDebugHost {
  renderGameToText(): string;
  setLocalPositionForTest(x: number, y: number, dir?: Direction): void;
  walkBfsPathForTest(
    targetX: number,
    targetY: number,
    stepDelayMs?: number
  ): Promise<{
    ok: boolean;
    stepsWalked: number;
    start: { x: number; y: number };
    end: { x: number; y: number };
  }>;
  setLocalDirForTest(dir: Direction): void;
  setTouchVector(vx: number, vy: number): void;
  setFixedAnimTestMode(animKey: string | null): void;
  getLocomotionSample(): unknown;
  resetAnimRestartCount(): void;
  triggerHurtForTest(): void;
  setNpcAnimForTest(
    npcId: string,
    state: AnimState,
    dir: Direction,
    durationMs?: number
  ): void;
  triggerContextualInteract(): void;
  triggerSkill(skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang"): void;
  triggerPickupNearestDrop(): void;
  getCameraTelemetry(): unknown;
  setCameraZoomForTest(zoom: number): unknown;
  getMinimapTelemetry(): unknown;
  toggleMinimapSize(force?: boolean): boolean;
  refreshHudPanelsForTest(): void;
  getOcclusionTelemetry(): unknown;
  getAnimationContractTelemetry(): unknown;
  resolveSpriteAnim(
    spriteKey: string,
    state: "idle" | "walk" | "attack" | "cast" | "hurt",
    dir: Direction
  ): unknown;
}

export function registerWorldDebugHooks(host: WorldDebugHost): boolean {
  if (!isDevOrIsolatedTestMode()) {
    return false;
  }
  const win = window as unknown as Record<string, unknown>;
  win.render_game_to_text = () => host.renderGameToText();
  win.__TONG_MON_DEBUG__ = {
    teleportLocal: (x: number, y: number, dir?: Direction) => {
      host.setLocalPositionForTest(x, y, dir);
    },
    setLocalPositionForTest: (x: number, y: number, dir?: Direction) => {
      host.setLocalPositionForTest(x, y, dir);
    },
    walkBfsPathForTest: (targetX: number, targetY: number, stepDelayMs = 8) =>
      host.walkBfsPathForTest(targetX, targetY, stepDelayMs),
    setLocalDir: (dir: Direction) => {
      host.setLocalDirForTest(dir);
    },
    setTouchVector: (vx: number, vy: number) => {
      host.setTouchVector(vx, vy);
    },
    setFixedAnimTestMode: (animKey: string | null) => {
      host.setFixedAnimTestMode(animKey);
    },
    getLocomotionSample: () => host.getLocomotionSample(),
    resetAnimRestartCount: () => {
      host.resetAnimRestartCount();
    },
    triggerHurt: () => {
      host.triggerHurtForTest();
    },
    setNpcAnim: (
      npcId: string,
      state: AnimState,
      dir: Direction,
      durationMs = 2000
    ) => {
      host.setNpcAnimForTest(npcId, state, dir, durationMs);
    },
    interact: () => host.triggerContextualInteract(),
    attack: (
      skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang" = "basic_slash"
    ) => host.triggerSkill(skillId),
    pickup: () => host.triggerPickupNearestDrop(),
    getCameraTelemetry: () => host.getCameraTelemetry(),
    setCameraZoomForTest: (zoom: number) => host.setCameraZoomForTest(zoom),
    getMinimapTelemetry: () => host.getMinimapTelemetry(),
    toggleMinimapSize: (force?: boolean) => host.toggleMinimapSize(force),
    refreshHudPanelsForTest: () => {
      host.refreshHudPanelsForTest();
    },
    getOcclusionTelemetry: () => host.getOcclusionTelemetry(),
    getAnimationContractTelemetry: () => host.getAnimationContractTelemetry(),
    resolveSpriteAnim: (
      spriteKey: string,
      state: "idle" | "walk" | "attack" | "cast" | "hurt",
      dir: Direction
    ) => host.resolveSpriteAnim(spriteKey, state, dir)
  };
  return true;
}
