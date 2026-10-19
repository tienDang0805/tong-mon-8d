export interface QuestProgressState {
  questId: string;
  status: "not_started" | "active" | "completed";
  stepIndex: number;
  objectiveCount: number;
  completedAt?: number;
}

export interface QuestActionIntentPayload {
  npcId: string;
  questId: string;
  action: "accept" | "submit" | "advance";
  submittedItemId?: string;
  requestId: string;
}
