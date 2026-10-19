import { LEGENDARY_NPCS, ZONES_REGISTRY } from "@tong-mon-8d/game-data";
import type { Direction, RemotePlayerSnapshot, ZoneId } from "@tong-mon-8d/shared";
import type { CameraTelemetry } from "./CameraView";

export interface MinimapStaticTileData {
  zoneId: ZoneId;
  widthTiles: number;
  heightTiles: number;
  tileSize: number;
  groundGids: number[];
  pathsGids: number[];
  collisionGids: number[];
}

export interface MinimapDynamicInput {
  zoneId: ZoneId;
  playerX: number;
  playerY: number;
  playerDirection: Direction;
  cameraTelemetry: CameraTelemetry | null;
  remotePlayers: RemotePlayerSnapshot[];
}

export interface MinimapTelemetry {
  mounted: boolean;
  mountCount: number;
  staticDrawCount: number;
  dynamicDrawCount: number;
  zoneId: ZoneId;
  isExpanded: boolean;
  canvasWidth: number;
  canvasHeight: number;
  playerMarker: { x: number; y: number };
  cameraRect: { x: number; y: number; width: number; height: number } | null;
  markerCounts: {
    npcs: number;
    portals: number;
    cauldron: number;
    remotePlayers: number;
  };
}

export class MinimapView {
  private mountEl: HTMLElement;
  private rootEl: HTMLDivElement;
  private headerEl: HTMLDivElement;
  private titleEl: HTMLSpanElement;
  private coordsEl: HTMLSpanElement;
  private toggleBtnEl: HTMLButtonElement;
  private stageEl: HTMLDivElement;
  private staticCanvas: HTMLCanvasElement;
  private dynamicCanvas: HTMLCanvasElement;
  private legendEl: HTMLDivElement;

  private mountCount = 0;
  private staticDrawCount = 0;
  private dynamicDrawCount = 0;
  private isExpanded = false;
  private currentZoneId: ZoneId | null = null;
  private cachedTileData: Map<ZoneId, MinimapStaticTileData> = new Map();
  private lastDynamicInput: MinimapDynamicInput | null = null;
  private lastTelemetry: MinimapTelemetry;

  constructor(mountEl: HTMLElement) {
    this.mountEl = mountEl;
    this.mountCount = 1;

    this.rootEl = document.createElement("div");
    this.rootEl.className = "hud-minimap-card";
    this.rootEl.id = "hud-minimap-card";

    this.headerEl = document.createElement("div");
    this.headerEl.className = "hud-minimap-header";

    this.titleEl = document.createElement("span");
    this.titleEl.className = "hud-minimap-title";
    this.titleEl.textContent = "Bản Đồ Linh Giới";

    this.coordsEl = document.createElement("span");
    this.coordsEl.className = "hud-minimap-coords";
    this.coordsEl.id = "hud-minimap-coords";
    this.coordsEl.textContent = "(48, 38)";

    this.toggleBtnEl = document.createElement("button");
    this.toggleBtnEl.type = "button";
    this.toggleBtnEl.className = "hud-minimap-toggle-btn";
    this.toggleBtnEl.id = "btn-toggle-minimap-size";
    this.toggleBtnEl.title = "Phóng to / Thu nhỏ Bản đồ";
    this.toggleBtnEl.textContent = "⤢";
    this.toggleBtnEl.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.toggleExpanded();
    });

    this.headerEl.appendChild(this.titleEl);
    this.headerEl.appendChild(this.coordsEl);
    this.headerEl.appendChild(this.toggleBtnEl);

    this.stageEl = document.createElement("div");
    this.stageEl.className = "hud-minimap-stage";
    this.stageEl.id = "hud-minimap-stage";

    this.staticCanvas = document.createElement("canvas");
    this.staticCanvas.className = "hud-minimap-canvas hud-minimap-static";
    this.staticCanvas.width = 288;
    this.staticCanvas.height = 216;

    this.dynamicCanvas = document.createElement("canvas");
    this.dynamicCanvas.className = "hud-minimap-canvas hud-minimap-dynamic";
    this.dynamicCanvas.width = 288;
    this.dynamicCanvas.height = 216;

    this.stageEl.appendChild(this.staticCanvas);
    this.stageEl.appendChild(this.dynamicCanvas);

    this.legendEl = document.createElement("div");
    this.legendEl.className = "hud-minimap-legend";
    this.legendEl.innerHTML = `
      <span class="mm-dot mm-self"></span><span>Đạo Hữu</span>
      <span class="mm-dot mm-npc"></span><span>Tiên Nhân</span>
      <span class="mm-dot mm-portal"></span><span>Trận Pháp</span>
    `;

    this.rootEl.appendChild(this.headerEl);
    this.rootEl.appendChild(this.stageEl);
    this.rootEl.appendChild(this.legendEl);

    this.mountEl.replaceChildren(this.rootEl);

    this.lastTelemetry = {
      mounted: true,
      mountCount: this.mountCount,
      staticDrawCount: 0,
      dynamicDrawCount: 0,
      zoneId: "tan_thu_thon",
      isExpanded: false,
      canvasWidth: 168,
      canvasHeight: 126,
      playerMarker: { x: 1552, y: 1232 },
      cameraRect: null,
      markerCounts: { npcs: 0, portals: 0, cauldron: 0, remotePlayers: 0 }
    };
  }

  setStaticTileData(data: MinimapStaticTileData): void {
    this.cachedTileData.set(data.zoneId, data);
    if (this.currentZoneId !== data.zoneId) {
      this.currentZoneId = data.zoneId;
      this.rebuildStaticLayer(data.zoneId);
    }
    if (this.lastDynamicInput && this.lastDynamicInput.zoneId === this.currentZoneId) {
      this.renderDynamicOverlay(this.lastDynamicInput);
    }
  }

  toggleExpanded(forceState?: boolean): boolean {
    const next = typeof forceState === "boolean" ? forceState : !this.isExpanded;
    if (next === this.isExpanded) {
      return this.isExpanded;
    }
    this.isExpanded = next;
    this.rootEl.classList.toggle("is-expanded", this.isExpanded);
    const topRightEl = this.mountEl.closest(".hud-top-right");
    topRightEl?.classList.toggle("is-expanded", this.isExpanded);
    if (this.lastDynamicInput && this.lastDynamicInput.zoneId === this.currentZoneId) {
      this.renderDynamicOverlay(this.lastDynamicInput);
    }
    return this.isExpanded;
  }

  updateDynamic(input: MinimapDynamicInput): void {
    this.lastDynamicInput = input;
    if (this.currentZoneId && input.zoneId !== this.currentZoneId) {
      return;
    }
    if (!this.currentZoneId && this.cachedTileData.has(input.zoneId)) {
      this.currentZoneId = input.zoneId;
      this.rebuildStaticLayer(input.zoneId);
    }
    this.renderDynamicOverlay(input);
  }

  private rebuildStaticLayer(zoneId: ZoneId): void {
    const ctx = this.staticCanvas.getContext("2d");
    if (!ctx) return;

    const w = this.staticCanvas.width;
    const h = this.staticCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const zoneDef = ZONES_REGISTRY[zoneId] ?? ZONES_REGISTRY.tan_thu_thon;
    this.titleEl.textContent = zoneDef.nameVi;

    const tileData = this.cachedTileData.get(zoneId);
    const cols = tileData?.widthTiles ?? zoneDef.widthTiles;
    const rows = tileData?.heightTiles ?? zoneDef.heightTiles;
    const cellW = w / cols;
    const cellH = h / rows;

    ctx.fillStyle = "#14261c";
    ctx.fillRect(0, 0, w, h);

    if (tileData) {
      for (let ty = 0; ty < rows; ty++) {
        for (let tx = 0; tx < cols; tx++) {
          const idx = ty * cols + tx;
          const g = tileData.groundGids[idx] ?? 0;
          const p = tileData.pathsGids[idx] ?? 0;
          const c = tileData.collisionGids[idx] ?? 0;

          let color = "#1f3d2b";
          if (zoneId === "tan_thu_thon") {
            if (g === 9 || g === 10) {
              color = "#1c6b82";
            } else if (g === 13) {
              color = "#252b33";
            } else if (g === 3) {
              color = "#183324";
            } else if (g === 4) {
              color = "#2d3c2e";
            }
            if (p === 5 || p === 6 || p === 8) {
              color = "#8b8574";
            } else if (p === 7) {
              color = "#d6c89f";
            } else if (p === 12) {
              color = "#a67c46";
            } else if (p === 15) {
              color = "#6b5a45";
            } else if (p === 16) {
              color = "#3b95b8";
            }
            if (c !== 0 && g !== 9 && g !== 10 && g !== 13) {
              color = "#3e352d";
            }
          } else {
            if (c !== 0) {
              color = "#16291e";
            } else if (p !== 0) {
              color = "#6d6753";
            } else {
              color = "#23422e";
            }
          }

          ctx.fillStyle = color;
          ctx.fillRect(
            Math.floor(tx * cellW),
            Math.floor(ty * cellH),
            Math.ceil(cellW),
            Math.ceil(cellH)
          );
        }
      }
    }

    ctx.strokeStyle = "rgba(245, 197, 66, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);

    this.staticDrawCount += 1;
  }

  private renderDynamicOverlay(input: MinimapDynamicInput): void {
    const ctx = this.dynamicCanvas.getContext("2d");
    if (!ctx) return;

    const w = this.dynamicCanvas.width;
    const h = this.dynamicCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const zoneDef = ZONES_REGISTRY[input.zoneId] ?? ZONES_REGISTRY.tan_thu_thon;
    const worldW = zoneDef.widthTiles * zoneDef.tileSize;
    const worldH = zoneDef.heightTiles * zoneDef.tileSize;
    const scaleX = w / Math.max(1, worldW);
    const scaleY = h / Math.max(1, worldH);

    const tx = Math.floor(input.playerX / 32);
    const ty = Math.floor(input.playerY / 32);
    this.coordsEl.textContent = `(${tx}, ${ty})`;

    let camRectOut: { x: number; y: number; width: number; height: number } | null = null;
    if (input.cameraTelemetry) {
      const wv = input.cameraTelemetry.worldView;
      const rx = Math.max(0, Math.min(w, wv.x * scaleX));
      const ry = Math.max(0, Math.min(h, wv.y * scaleY));
      const rw = Math.max(8, Math.min(w - rx, wv.width * scaleX));
      const rh = Math.max(6, Math.min(h - ry, wv.height * scaleY));
      ctx.strokeStyle = "rgba(255, 224, 130, 0.9)";
      ctx.lineWidth = 1.25;
      ctx.strokeRect(rx, ry, rw, rh);
      camRectOut = {
        x: Number(rx.toFixed(2)),
        y: Number(ry.toFixed(2)),
        width: Number(rw.toFixed(2)),
        height: Number(rh.toFixed(2))
      };
    }

    let cauldronCount = 0;
    if (input.zoneId === "tan_thu_thon") {
      cauldronCount = 1;
      const cx = 1536 * scaleX;
      const cy = 992 * scaleY;
      ctx.fillStyle = "#ff922b";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const portals = zoneDef.portals ?? [];
    for (const portal of portals) {
      const px = portal.x * scaleX;
      const py = portal.y * scaleY;
      ctx.fillStyle = "#4dabf7";
      ctx.strokeStyle = "#e7f5ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const zoneNpcs = LEGENDARY_NPCS.filter((n) => n.zoneId === input.zoneId);
    for (const npc of zoneNpcs) {
      const nx = npc.spawnX * scaleX;
      const ny = npc.spawnY * scaleY;
      ctx.fillStyle = npc.isTamDe ? "#ffd43b" : "#63e6be";
      ctx.beginPath();
      ctx.arc(nx, ny, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    let remoteCount = 0;
    for (const rp of input.remotePlayers) {
      remoteCount += 1;
      const rpx = rp.x * scaleX;
      const rpy = rp.y * scaleY;
      ctx.fillStyle = "#74c0fc";
      ctx.beginPath();
      ctx.arc(rpx, rpy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const selfX = Math.max(3, Math.min(w - 3, input.playerX * scaleX));
    const selfY = Math.max(3, Math.min(h - 3, input.playerY * scaleY));
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#d9480f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(selfX, selfY, 4.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.dynamicDrawCount += 1;
    this.lastTelemetry = {
      mounted: this.rootEl.isConnected,
      mountCount: this.mountCount,
      staticDrawCount: this.staticDrawCount,
      dynamicDrawCount: this.dynamicDrawCount,
      zoneId: input.zoneId,
      isExpanded: this.isExpanded,
      canvasWidth: this.isExpanded ? 288 : 168,
      canvasHeight: this.isExpanded ? 216 : 126,
      playerMarker: {
        x: Number(selfX.toFixed(2)),
        y: Number(selfY.toFixed(2))
      },
      cameraRect: camRectOut,
      markerCounts: {
        npcs: zoneNpcs.length,
        portals: portals.length,
        cauldron: cauldronCount,
        remotePlayers: remoteCount
      }
    };
  }

  getTelemetry(): MinimapTelemetry {
    return {
      ...this.lastTelemetry,
      mounted: this.rootEl.isConnected
    };
  }
}
