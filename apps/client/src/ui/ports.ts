import type {
  CharacterSaveState,
  CharacterV02SnapshotPayload,
  RoomWorldSnapshot
} from "@tong-mon-8d/shared";
import type { CameraTelemetry } from "../game/world/CameraView.js";
import type {
  MinimapDynamicInput,
  MinimapStaticTileData,
  MinimapTelemetry
} from "../game/world/MinimapView.js";

export interface WorldSceneHudPort {
  triggerSkill(skillId: "basic_slash" | "kiem_khi_ung" | "ho_the_kim_quang"): void;
  triggerContextualInteract(): void;
  triggerPickupNearestDrop(): void;
  setTouchVector(vx: number, vy: number): void;
  navigateToWorldPoint(targetX: number, targetY: number): void;
  playCeremonyEffect(): void;
  getCameraTelemetry(): CameraTelemetry | null;
}

export interface HudWorldMinimapPort {
  setMinimapStaticTileData(data: MinimapStaticTileData): void;
  updateMinimapDynamic(input: MinimapDynamicInput): void;
  toggleMinimapSize(forceState?: boolean): boolean;
  getMinimapTelemetry(): MinimapTelemetry;
  isBlockingOverlayOpen(): boolean;
  refreshPanels(
    self?: CharacterSaveState,
    snap?: RoomWorldSnapshot,
    selfV02?: CharacterV02SnapshotPayload
  ): void;
}
