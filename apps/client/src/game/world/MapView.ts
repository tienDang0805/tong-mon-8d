import type Phaser from "phaser";
import type { ZoneId } from "@tong-mon-8d/shared";
import { ZONES_REGISTRY } from "@tong-mon-8d/game-data";
import type { MinimapStaticTileData } from "./MinimapView.js";

export interface WorldPropMetadata {
  id: string;
  propKey: string;
  x: number;
  baseY: number;
  depth: number;
  category: "surface_bridge" | "vertical_occluder";
}

export interface CollisionGridData {
  width: number;
  height: number;
  data: number[];
}

export class MapView {
  private mapLayers: Array<
    Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer
  > = [];
  private sceneProps: Phaser.GameObjects.GameObject[] = [];
  private portalSprites: Phaser.GameObjects.Sprite[] = [];
  private worldPropMetadata: WorldPropMetadata[] = [];
  private collisionGrid: CollisionGridData = {
    width: 96,
    height: 72,
    data: []
  };

  constructor(private readonly scene: Phaser.Scene) {}

  public clear(): void {
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
  }

  public buildZoneMap(zoneId: ZoneId): MinimapStaticTileData {
    this.clear();
    const zoneDef = ZONES_REGISTRY[zoneId];

    const map = this.scene.add.tilemap(zoneId);
    const tilesetName =
      zoneId === "tan_thu_thon"
        ? "tan_thu_thon_v01b_tileset_32x32"
        : "bat_hoang_tileset";
    const tileset = map.addTilesetImage(tilesetName, tilesetName, 32, 32, 0, 0);

    const rawCached = this.scene.cache.tilemap.get(zoneId)?.data as {
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

    this.placeHighCraftLandmarks(zoneId);

    for (const portal of zoneDef.portals) {
      const ring = this.scene.add
        .sprite(portal.x, portal.y + 8, "portal_ring", 0)
        .setDepth(7)
        .play("vfx_portal_spin");
      const label = this.scene.add
        .text(portal.x, portal.y - 124, portal.labelVi, {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          color: "#63e6be",
          backgroundColor: "rgba(10,14,22,0.82)",
          padding: { x: 6, y: 2 }
        })
        .setOrigin(0.5, 0.5)
        .setDepth(portal.y + 12);
      this.portalSprites.push(ring);
      this.sceneProps.push(label);
    }

    return {
      zoneId,
      widthTiles: zoneDef.widthTiles,
      heightTiles: zoneDef.heightTiles,
      tileSize: zoneDef.tileSize,
      groundGids:
        groundLayerData ?? new Array(zoneDef.widthTiles * zoneDef.heightTiles).fill(1),
      pathsGids:
        pathsLayerData ?? new Array(zoneDef.widthTiles * zoneDef.heightTiles).fill(0),
      collisionGids: this.collisionGrid.data
    };
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

  public getCollisionGrid(): CollisionGridData {
    return this.collisionGrid;
  }

  public getWorldPropMetadata(): WorldPropMetadata[] {
    return this.worldPropMetadata;
  }

  private placeHighCraftLandmarks(zoneId: ZoneId): void {
    const placeSurfaceBridge = (
      id: string,
      key: string,
      x: number,
      y: number,
      scale = 1.0
    ) => {
      const img = this.scene.add
        .image(x, y, key)
        .setOrigin(0.5, 0.5)
        .setScale(scale)
        .setDepth(6);
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
      const img = this.scene.add
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
      placeSurfaceBridge(
        "bridge_west_creek",
        "prop_bridge_horizontal",
        27 * 32,
        37 * 32,
        0.72
      );
      placeSurfaceBridge(
        "bridge_north_stream",
        "prop_arched_bridge",
        58 * 32,
        23 * 32,
        0.84
      );
      placeSurfaceBridge(
        "bridge_east_stream",
        "prop_arched_bridge",
        58 * 32,
        37 * 32,
        0.84
      );

      placeVerticalOccluder(
        "tan_thu_tu_duong",
        "building_tan_thu_tu_duong",
        48 * 32,
        23 * 32,
        0.78
      );
      placeVerticalOccluder(
        "cuu_long_than_dinh",
        "prop_than_dinh",
        48 * 32,
        32 * 32,
        0.56
      );
      placeVerticalOccluder(
        "quan_mi_lao_truong",
        "prop_noodle_stall",
        33 * 32,
        34 * 32,
        0.68
      );
      placeVerticalOccluder(
        "tu_bao_cac_hall",
        "building_tu_bao_cac",
        70 * 32,
        17 * 32,
        0.82
      );
      placeVerticalOccluder(
        "hong_tran_cac",
        "building_hong_tran_cac",
        18 * 32,
        19 * 32,
        0.76
      );
      placeVerticalOccluder(
        "truyen_tong_tran_arch",
        "prop_portal_arch",
        2768,
        1204,
        0.68
      );

      const cauldronFire = this.scene.add.sprite(
        48 * 32,
        31 * 32 - 8,
        "phi_de_blessing",
        0
      );
      cauldronFire.setDepth(32 * 32 + 0.05);
      cauldronFire.play("vfx_blessing_pulse");
      this.sceneProps.push(cauldronFire);

      const cauldronLabel = this.scene.add
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
        placeVerticalOccluder(
          `forest_bamboo_${idx}`,
          "prop_bamboo_cluster",
          bx,
          by,
          0.78
        );
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
}
