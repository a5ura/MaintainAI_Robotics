import type { Clock, Diagnosis } from "./model";
import { cyclePayload, endTime } from "./scenarios";

export const GUIDE_STAGES = [
  "introduction",
  "robot-operation",
  "fault-detection",
  "evidence-investigation",
  "diagnosis",
  "maintenance-handoff",
] as const;
export type GuideStage = (typeof GUIDE_STAGES)[number];
export type PlaybackMode = "manual" | "automatic";
export type Readiness = "waiting" | "ready" | "unavailable";
// Reading time begins AFTER readiness. Speech is never a prerequisite.
export const GUIDE_READING_MS = 4000;
const loss = cyclePayload("drop").samples.find(
  (row) => row.grip_command && row.object_present === false,
)!;
export const GUIDE_LOSS_TIME = loss.t;
export type Token = { epoch: number; entry: number };
export type ActiveGuide = Token & {
  stage: GuideStage;
  frontier: number;
  mode: PlaybackMode;
  paused: boolean;
  readiness: Readiness;
};
export type GuideState = ActiveGuide | null;
export function initialGuide(epoch: number): ActiveGuide {
  return {
    epoch,
    entry: 0,
    stage: "introduction",
    frontier: 0,
    mode: "manual",
    paused: false,
    readiness: "ready",
  };
}
export function guideReadiness(
  stage: GuideStage,
  clock: Clock,
  result: Diagnosis | null,
  error: string,
): Readiness {
  if (stage === "introduction") return "ready";
  if (stage === "robot-operation")
    return clock.t >= GUIDE_LOSS_TIME ? "ready" : "waiting";
  if (clock.t < endTime("drop")) return "waiting";
  if (result) return "ready";
  return error ? "unavailable" : "waiting";
}
export type GuideAction =
  | { type: "start"; epoch: number }
  | { type: "interrupt"; epoch: number; exit: boolean }
  | {
      type: "stop" | "pause" | "resume" | "next" | "previous" | "timer";
      token: Token;
    }
  | { type: "mode"; token: Token; mode: PlaybackMode }
  | { type: "observe"; token: Token; readiness: Readiness };
export function guideReducer(
  state: GuideState,
  action: GuideAction,
): GuideState {
  if (action.type === "start")
    return state && action.epoch <= state.epoch
      ? state
      : initialGuide(action.epoch);
  // Browser lifecycle interruptions apply to the current run, even if a
  // synchronous mode/navigation event has already queued a new entry.
  if (action.type === "interrupt") {
    if (!state || state.epoch !== action.epoch) return state;
    return action.exit
      ? null
      : state.paused
        ? state
        : { ...state, paused: true, entry: state.entry + 1 };
  }
  if (
    !state ||
    state.epoch !== action.token.epoch ||
    state.entry !== action.token.entry
  )
    return state;
  if (action.type === "stop") return null;
  if (action.type === "observe")
    return state.readiness === action.readiness
      ? state
      : { ...state, readiness: action.readiness };
  if (action.type === "pause" || action.type === "resume") {
    const paused = action.type === "pause";
    return state.paused === paused
      ? state
      : { ...state, paused, entry: state.entry + 1 };
  }
  if (action.type === "mode")
    return action.mode === state.mode
      ? state
      : { ...state, mode: action.mode, entry: state.entry + 1 };
  if (state.paused) return state;
  const index = GUIDE_STAGES.indexOf(state.stage);
  if (action.type === "previous")
    return index === 0
      ? state
      : {
          ...state,
          stage: GUIDE_STAGES[index - 1],
          entry: state.entry + 1,
          readiness: "waiting",
        };
  if (action.type === "timer" && state.mode !== "automatic") return state;
  if (state.readiness !== "ready" || index === GUIDE_STAGES.length - 1)
    return state;
  return {
    ...state,
    stage: GUIDE_STAGES[index + 1],
    frontier: Math.max(state.frontier, index + 1),
    entry: state.entry + 1,
    readiness: "waiting",
  };
}
