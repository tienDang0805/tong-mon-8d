import fs from "node:fs";
import path from "node:path";
import type {
  CharacterSaveState,
  Direction,
  MoveIntentPayload,
  ZoneId
} from "@tong-mon-8d/shared";
import { ZONES_REGISTRY } from "@tong-mon-8d/game-data";

export interface TiledLayerData {
  name: string;
  type: string;
  width?: number;
  height?: number;
  data?: number[];
}

export interface TiledMapFile {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayerData[];
}

export interface ZoneCollisionGrid {
  width: number;
  height: number;
  data: number[];
}

export function resolveRepoRootDir(explicitRootDir?: string): string {
  if (explicitRootDir) {
    return explicitRootDir;
  }
  const candidates = [
    path.resolve(import.meta.dirname, "../../../../.."),
    path.resolve(import.meta.dirname, "../../.."),
    process.cwd()
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, ZONES_REGISTRY.tan_thu_thon.mapFile))) {
      return candidate;
    }
  }
  return candidates[0]!;
}

export class ZoneCollisionRegistry {
  public readonly collisionGrids: Record<ZoneId, ZoneCollisionGrid>;
  public readonly connectedWalkableTiles: Record<ZoneId, Set<number>>;

  constructor(rootDir?: string) {
    const baseDir = resolveRepoRootDir(rootDir);
    this.collisionGrids = {
      tan_thu_thon: this.loadCollisionGrid(
        path.join(baseDir, ZONES_REGISTRY.tan_thu_thon.mapFile)
      ),
      thanh_truc_lam: this.loadCollisionGrid(
        path.join(baseDir, ZONES_REGISTRY.thanh_truc_lam.mapFile)
      )
    };
    this.connectedWalkableTiles = {
      tan_thu_thon: this.buildConnectedWalkableTileSet("tan_thu_thon"),
      thanh_truc_lam: this.buildConnectedWalkableTileSet("thanh_truc_lam")
    };
  }

  private loadCollisionGrid(mapFilePath: string): ZoneCollisionGrid {
    const raw = JSON.parse(fs.readFileSync(mapFilePath, "utf8")) as TiledMapFile;
    const colLayer = raw.layers.find((l) => l.name === "Collision" && Array.isArray(l.data));
    return {
      width: raw.width,
      height: raw.height,
      data: colLayer?.data ?? new Array(raw.width * raw.height).fill(0)
    };
  }

  private buildConnectedWalkableTileSet(zoneId: ZoneId): Set<number> {
    const grid = this.collisionGrids[zoneId];
    const reachable = new Set<number>();
    if (!grid) {
      return reachable;
    }
    const spawn = ZONES_REGISTRY[zoneId]?.defaultSpawn ?? { x: 1552, y: 1232 };
    const startTx = Math.floor(spawn.x / 32);
    const startTy = Math.floor(spawn.y / 32);
    if (!this.isWalkable(zoneId, spawn.x, spawn.y)) {
      return reachable;
    }
    const startIdx = startTy * grid.width + startTx;
    reachable.add(startIdx);
    const queue: Array<[number, number]> = [[startTx, startTy]];
    let head = 0;
    const dirs: Array<[number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    while (head < queue.length) {
      const [cx, cy] = queue[head++]!;
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 1 || ny < 1 || nx >= grid.width - 1 || ny >= grid.height - 1) {
          continue;
        }
        const nIdx = ny * grid.width + nx;
        if (reachable.has(nIdx)) {
          continue;
        }
        if ((grid.data[nIdx] ?? 0) === 0) {
          reachable.add(nIdx);
          queue.push([nx, ny]);
        }
      }
    }
    return reachable;
  }

  isWalkable(zoneId: ZoneId, worldX: number, worldY: number): boolean {
    const grid = this.collisionGrids[zoneId];
    if (!grid) {
      return false;
    }
    const tx = Math.floor(worldX / 32);
    const ty = Math.floor(worldY / 32);
    if (tx < 1 || ty < 1 || tx >= grid.width - 1 || ty >= grid.height - 1) {
      return false;
    }
    const tileVal = grid.data[ty * grid.width + tx] ?? 0;
    return tileVal === 0;
  }

  isConnectedWalkable(zoneId: ZoneId, worldX: number, worldY: number): boolean {
    const grid = this.collisionGrids[zoneId];
    const connected = this.connectedWalkableTiles[zoneId];
    if (!grid || !connected) {
      return false;
    }
    const tx = Math.floor(worldX / 32);
    const ty = Math.floor(worldY / 32);
    if (tx < 1 || ty < 1 || tx >= grid.width - 1 || ty >= grid.height - 1) {
      return false;
    }
    return connected.has(ty * grid.width + tx);
  }

  resolveSafeZoneCoordinates(
    zoneId: ZoneId,
    worldX: number,
    worldY: number,
    options?: { isKnownCurrentMapVersion?: boolean }
  ): { x: number; y: number; migrated: boolean; reason: string } {
    const zone = ZONES_REGISTRY[zoneId] ?? ZONES_REGISTRY.tan_thu_thon;
    const grid = this.collisionGrids[zoneId];
    if (!grid) {
      return {
        x: zone.defaultSpawn.x,
        y: zone.defaultSpawn.y,
        migrated: true,
        reason: "MISSING_ZONE_GRID_DEFAULT_SPAWN"
      };
    }

    const rx = Math.round(worldX);
    const ry = Math.round(worldY);

    if (zoneId === "tan_thu_thon" && !options?.isKnownCurrentMapVersion) {
      const legacyAnchors: Array<{
        oldX: number;
        oldY: number;
        newX: number;
        newY: number;
        label: string;
      }> = [
        { oldX: 640, oldY: 512, newX: 1552, newY: 1232, label: "LEGACY_40X30_VILLAGE_CENTER" },
        { oldX: 1036, oldY: 480, newX: 2608, newY: 1200, label: "LEGACY_40X30_FROM_THANH_TRUC_LAM" },
        { oldX: 1120, oldY: 480, newX: 2608, newY: 1200, label: "LEGACY_40X30_EAST_PORTAL" },
        { oldX: 536, oldY: 368, newX: 1488, newY: 1136, label: "LEGACY_40X30_PHI_DE_APPROACH" },
        { oldX: 668, oldY: 404, newX: 1648, newY: 1136, label: "LEGACY_40X30_CHATDVT_APPROACH" },
        { oldX: 384, oldY: 392, newX: 1136, newY: 1168, label: "LEGACY_40X30_MERCHANT_TRUONG_APPROACH" },
        { oldX: 816, oldY: 296, newX: 2128, newY: 720, label: "LEGACY_40X30_RMT_DE_APPROACH" },
        { oldX: 832, oldY: 608, newX: 2384, newY: 752, label: "LEGACY_40X30_THAI_TAI_APPROACH" },
        { oldX: 256, oldY: 336, newX: 624, newY: 752, label: "LEGACY_40X30_DAM_LON_APPROACH" },
        { oldX: 256, oldY: 640, newX: 656, newY: 1744, label: "LEGACY_40X30_NGOC_TAM_APPROACH" }
      ];
      for (const anchor of legacyAnchors) {
        if (Math.hypot(rx - anchor.oldX, ry - anchor.oldY) <= 24) {
          return {
            x: anchor.newX,
            y: anchor.newY,
            migrated: true,
            reason: anchor.label
          };
        }
      }
    }

    if (this.isConnectedWalkable(zoneId, rx, ry)) {
      return { x: rx, y: ry, migrated: false, reason: "VALID_CONNECTED_WALKABLE" };
    }

    const baseTx = Math.floor(rx / 32);
    const baseTy = Math.floor(ry / 32);
    if (baseTx >= 0 && baseTy >= 0 && baseTx < grid.width && baseTy < grid.height) {
      let bestX = -1;
      let bestY = -1;
      let bestDistSq = Number.POSITIVE_INFINITY;
      for (let radius = 1; radius <= 8; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) {
              continue;
            }
            const candX = (baseTx + dx) * 32 + 16;
            const candY = (baseTy + dy) * 32 + 16;
            if (this.isConnectedWalkable(zoneId, candX, candY)) {
              const dSq = (candX - rx) * (candX - rx) + (candY - ry) * (candY - ry);
              if (dSq < bestDistSq) {
                bestDistSq = dSq;
                bestX = candX;
                bestY = candY;
              }
            }
          }
        }
        if (bestX !== -1) {
          return {
            x: bestX,
            y: bestY,
            migrated: true,
            reason: "NUDGED_TO_CONNECTED_WALKABLE_TILE"
          };
        }
      }
    }

    return {
      x: zone.defaultSpawn.x,
      y: zone.defaultSpawn.y,
      migrated: true,
      reason: "FALLBACK_DEFAULT_SPAWN"
    };
  }

  validateMovement(
    player: CharacterSaveState,
    intent: MoveIntentPayload
  ): { x: number; y: number; direction: Direction; moved: boolean } {
    const dx = intent.x - player.x;
    const dy = intent.y - player.y;
    const dist = Math.hypot(dx, dy);
    const maxStep = 64;

    let targetX = intent.x;
    let targetY = intent.y;
    if (dist > maxStep && dist > 0) {
      targetX = player.x + (dx / dist) * maxStep;
      targetY = player.y + (dy / dist) * maxStep;
    }

    const validDir: Direction = ["down", "left", "right", "up"].includes(intent.direction)
      ? intent.direction
      : player.direction;

    if (this.isWalkable(player.zoneId, targetX, targetY)) {
      const moved = Math.hypot(targetX - player.x, targetY - player.y) > 0.5;
      player.x = Math.round(targetX);
      player.y = Math.round(targetY);
      player.direction = validDir;
      return { x: player.x, y: player.y, direction: player.direction, moved };
    }

    if (this.isWalkable(player.zoneId, targetX, player.y)) {
      player.x = Math.round(targetX);
      player.direction = validDir;
      return { x: player.x, y: player.y, direction: player.direction, moved: true };
    }

    if (this.isWalkable(player.zoneId, player.x, targetY)) {
      player.y = Math.round(targetY);
      player.direction = validDir;
      return { x: player.x, y: player.y, direction: player.direction, moved: true };
    }

    player.direction = validDir;
    return { x: player.x, y: player.y, direction: player.direction, moved: false };
  }
}
