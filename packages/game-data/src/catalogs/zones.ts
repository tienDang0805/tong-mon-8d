import type { ZoneId } from "@tong-mon-8d/shared";

export interface PortalDefinition {
  id: string;
  labelVi: string;
  sourceZoneId: ZoneId;
  x: number;
  y: number;
  radiusPx: number;
  targetZoneId: ZoneId;
  targetSpawnId: string;
  targetX: number;
  targetY: number;
}

export interface ZoneDefinition {
  id: ZoneId;
  nameVi: string;
  subtitleVi: string;
  mapFile: string;
  widthTiles: number;
  heightTiles: number;
  tileSize: number;
  isSafeZone: boolean;
  defaultSpawn: { id: string; x: number; y: number };
  spawns: Record<string, { x: number; y: number }>;
  portals: PortalDefinition[];
  monsterSpawns: Array<{ instanceId: string; monsterId: string; x: number; y: number }>;
}

export const ZONES_REGISTRY: Record<ZoneId, ZoneDefinition> = {
  tan_thu_thon: {
    id: "tan_thu_thon",
    nameVi: "Tân Thủ Thôn",
    subtitleVi: "Thôn trang linh khí quy tụ dưới chân Bát Đại Thiên Tông",
    mapFile: "maps/tan_thu_thon.tmj",
    widthTiles: 96,
    heightTiles: 72,
    tileSize: 32,
    isSafeZone: true,
    defaultSpawn: { id: "village_center", x: 1552, y: 1232 },
    spawns: {
      village_center: { x: 1552, y: 1232 },
      from_thanh_truc_lam: { x: 2608, y: 1200 }
    },
    portals: [
      {
        id: "portal_town_to_forest",
        labelVi: "Truyền Tống Trận → Thanh Trúc Lâm",
        sourceZoneId: "tan_thu_thon",
        x: 2768,
        y: 1200,
        radiusPx: 92,
        targetZoneId: "thanh_truc_lam",
        targetSpawnId: "from_tan_thu_thon",
        targetX: 212,
        targetY: 480
      }
    ],
    monsterSpawns: []
  },
  thanh_truc_lam: {
    id: "thanh_truc_lam",
    nameVi: "Thanh Trúc Lâm",
    subtitleVi: "Rừng trúc ngàn năm ẩn chứa linh thú và tiên thảo",
    mapFile: "maps/thanh_truc_lam.tmj",
    widthTiles: 44,
    heightTiles: 32,
    tileSize: 32,
    isSafeZone: false,
    defaultSpawn: { id: "from_tan_thu_thon", x: 212, y: 480 },
    spawns: {
      from_tan_thu_thon: { x: 212, y: 480 },
      forest_shrine: { x: 640, y: 480 }
    },
    portals: [
      {
        id: "portal_forest_to_town",
        labelVi: "Truyền Tống Trận → Tân Thủ Thôn",
        sourceZoneId: "thanh_truc_lam",
        x: 128,
        y: 480,
        radiusPx: 92,
        targetZoneId: "tan_thu_thon",
        targetSpawnId: "from_thanh_truc_lam",
        targetX: 2608,
        targetY: 1200
      }
    ],
    monsterSpawns: [
      { instanceId: "mob_truc_lang_1", monsterId: "truc_lang", x: 544, y: 480 },
      { instanceId: "mob_truc_lang_2", monsterId: "truc_lang", x: 768, y: 576 },
      { instanceId: "mob_thanh_lan_xa_1", monsterId: "thanh_lan_xa", x: 896, y: 416 },
      { instanceId: "mob_thanh_lan_xa_2", monsterId: "thanh_lan_xa", x: 672, y: 736 }
    ]
  }
};
