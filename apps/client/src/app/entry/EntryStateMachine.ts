import type { EntryFlowState } from "@tong-mon-8d/shared";

export interface EntryRuntimeTelemetry {
  state: EntryFlowState;
  accountId: string | null;
  selectedCharacterId: string | null;
  rosterCount: number;
  inWorld: boolean;
  worldActorCount: number;
}

export interface EntryStateProvider {
  getAccountId(): string | null;
  getSelectedCharacterId(): string | null;
  getRosterCount(): number;
  isInWorld(): boolean;
  getWorldActorCount(): number;
}

export class EntryStateMachine {
  private currentState: EntryFlowState = "TITLE";
  private listeners = new Set<(state: EntryFlowState) => void>();

  constructor(private readonly provider: EntryStateProvider) {
    this.publishGlobalTelemetry();
  }

  public getState(): EntryFlowState {
    return this.currentState;
  }

  public setState(next: EntryFlowState): void {
    const changed = this.currentState !== next;
    this.currentState = next;
    this.publishGlobalTelemetry();
    if (changed) {
      for (const listener of this.listeners) {
        listener(next);
      }
    }
  }

  public subscribe(listener: (state: EntryFlowState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getTelemetry(): EntryRuntimeTelemetry {
    const inWorld = this.currentState === "IN_WORLD" && this.provider.isInWorld();
    return {
      state: this.currentState,
      accountId: this.provider.getAccountId(),
      selectedCharacterId: this.provider.getSelectedCharacterId(),
      rosterCount: this.provider.getRosterCount(),
      inWorld,
      worldActorCount: inWorld ? this.provider.getWorldActorCount() : 0
    };
  }

  public publishGlobalTelemetry(): EntryRuntimeTelemetry {
    const snapshot = this.getTelemetry();
    if (typeof window !== "undefined") {
      const win = window as unknown as Record<string, unknown>;
      win.__TONG_MON_ENTRY_STATE__ = snapshot;
    }
    return snapshot;
  }
}
