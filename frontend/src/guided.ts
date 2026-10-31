export type GuideStage =
  | "simulation"
  | "evidence"
  | "checks"
  | "saving"
  | "complete";
export type GuideState = {
  stage: GuideStage;
  paused: boolean;
  skipTour: boolean;
  ticketId?: string;
  error?: string;
} | null;
export type GuideAction =
  | {
      type:
        | "start"
        | "stop"
        | "pause"
        | "resume"
        | "result"
        | "next"
        | "skip"
        | "retry";
    }
  | { type: "saved"; ticketId: string }
  | { type: "error"; message: string };
export function guideReducer(
  state: GuideState,
  action: GuideAction,
): GuideState {
  if (action.type === "start")
    return { stage: "simulation", paused: false, skipTour: false };
  if (action.type === "stop") return null;
  if (!state) return state;
  switch (action.type) {
    case "pause":
      return { ...state, paused: true };
    case "resume":
      return { ...state, paused: false };
    case "skip":
      return {
        ...state,
        skipTour: true,
        paused: false,
        ...(state.stage === "evidence" ? { stage: "checks" as const } : {}),
      };
    case "result":
      return state.stage === "simulation" && !state.paused
        ? { ...state, stage: state.skipTour ? "checks" : "evidence" }
        : state;
    case "next":
      return state.paused
        ? state
        : state.stage === "evidence"
          ? { ...state, stage: "checks" }
          : state.stage === "checks"
            ? { ...state, stage: "saving" }
            : state;
    case "saved":
      return {
        ...state,
        stage: "complete",
        ticketId: action.ticketId,
        error: undefined,
      };
    case "error":
      return { ...state, error: action.message };
    case "retry":
      return { ...state, error: undefined };
    default:
      return state;
  }
}
