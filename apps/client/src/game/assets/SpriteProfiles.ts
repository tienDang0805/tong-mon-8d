import type { Direction } from "@tong-mon-8d/shared";
import runtimeProjection from "./runtimeAnimationProjection.json" with { type: "json" };

export type SpriteProfileKind =
  | "full_80x96_20row"
  | "full_80x96_20row_8walk"
  | "locomotion_80x96_8row"
  | "stationary_npc_80x96_4f"
  | "legacy_48x64_16row";

export interface SpriteStateLayoutDef {
  startRow: number;
  rowCount: number;
  framesPerRow: number;
  fps: number;
  repeat: number;
}

export interface SpriteProfileDef {
  spriteKey: string;
  kind: SpriteProfileKind;
  sheetWidth?: number;
  sheetHeight?: number;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows?: number;
  supportedStates: Array<"idle" | "walk" | "attack" | "cast" | "hurt">;
  supportedDirections: Direction[];
  stateLayout?: Partial<Record<"idle" | "walk" | "attack" | "cast" | "hurt", SpriteStateLayoutDef>>;
  referenceId?: string;
}

export interface ResolvedSpriteAnimation {
  spriteKey: string;
  animKey: string;
  requestedState: string;
  requestedDir: Direction;
  actualState: string;
  actualDir: Direction;
  isFallback: boolean;
  fallbackReason: string | null;
}

type ProjectionProfileEntry = {
  kind: SpriteProfileKind;
  sheetWidth?: number;
  sheetHeight?: number;
  frameWidth: number;
  frameHeight: number;
  columns?: number;
  rows?: number;
  supportedStates: Array<"idle" | "walk" | "attack" | "cast" | "hurt">;
  supportedDirections: Direction[];
  stateLayout?: Partial<Record<"idle" | "walk" | "attack" | "cast" | "hurt", SpriteStateLayoutDef>>;
};

const projectionProfiles = runtimeProjection.profiles as Record<string, ProjectionProfileEntry>;
const projectionBindings = runtimeProjection.spriteBindings as Record<
  string,
  { profileId: string; referenceId: string; role: string }
>;

export const SPRITE_PROFILES: Record<string, SpriteProfileDef> = Object.fromEntries(
  Object.entries(projectionBindings).map(([spriteKey, binding]) => {
    const prof = projectionProfiles[binding.profileId];
    if (!prof) {
      throw new Error(`Unknown animation profileId '${binding.profileId}' for sprite '${spriteKey}'`);
    }
    return [
      spriteKey,
      {
        spriteKey,
        kind: prof.kind,
        sheetWidth: prof.sheetWidth,
        sheetHeight: prof.sheetHeight,
        frameWidth: prof.frameWidth,
        frameHeight: prof.frameHeight,
        columns: prof.columns ?? (prof.kind === "stationary_npc_80x96_4f" ? 4 : 6),
        rows: prof.rows,
        supportedStates: [...prof.supportedStates],
        supportedDirections: [...prof.supportedDirections],
        stateLayout: prof.stateLayout,
        referenceId: binding.referenceId
      }
    ];
  })
);

export function resolvePlayerSpriteKey(appearanceId?: string): string {
  if (appearanceId && SPRITE_PROFILES[appearanceId]) {
    return appearanceId;
  }
  return "hero_kiem_tu";
}

export function resolveSpriteProfileId(spriteKey: string): SpriteProfileKind {
  return SPRITE_PROFILES[spriteKey]?.kind ?? "full_80x96_20row";
}

export function getProfileDimensions(profileId: SpriteProfileKind): {
  sheetWidth: number;
  sheetHeight: number;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
} {
  const prof = projectionProfiles[profileId];
  if (!prof) {
    throw new Error(`Unknown animation profileId '${profileId}'`);
  }
  return {
    sheetWidth: prof.sheetWidth ?? 0,
    sheetHeight: prof.sheetHeight ?? 0,
    frameWidth: prof.frameWidth,
    frameHeight: prof.frameHeight,
    columns: prof.columns ?? (prof.kind === "stationary_npc_80x96_4f" ? 4 : 6),
    rows: prof.rows ?? 1
  };
}

const DIR_ROW_OFFSET: Record<Direction, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3
};

export function buildDirectionalFrameRange(
  profileId: SpriteProfileKind,
  state: "idle" | "walk" | "attack" | "cast" | "hurt",
  dir: Direction
): {
  start: number;
  end: number;
  frameRate: number;
  repeat: number;
} {
  const prof = projectionProfiles[profileId];
  if (!prof) {
    throw new Error(`Unknown animation profileId '${profileId}'`);
  }
  const cols = prof.columns ?? (prof.kind === "stationary_npc_80x96_4f" ? 4 : 6);
  const layout = prof.stateLayout?.[state];
  const startRow = layout?.startRow ?? 0;
  const framesPerRow = layout?.framesPerRow ?? cols;
  const dirOffset = prof.kind === "stationary_npc_80x96_4f" ? 0 : DIR_ROW_OFFSET[dir];
  const row = startRow + dirOffset;
  const start = row * cols;
  return {
    start,
    end: start + framesPerRow - 1,
    frameRate: layout?.fps ?? 8,
    repeat: layout?.repeat ?? -1
  };
}
