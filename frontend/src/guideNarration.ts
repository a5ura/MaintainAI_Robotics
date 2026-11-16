import type { GuideState } from "./guided";
import type { Diagnosis } from "./model";

export type NarrationCue = { id: string; text: string };
export type NarrationSnapshot = {
  state: GuideState;
  t: number;
  result: Diagnosis | null;
  backendError: string;
};
export const INTRO_CUE: NarrationCue = {
  id: "simulation-intro",
  text: "This simulated robot picks, carries, and places a part.",
};

// Presentation only: these cues never infer a cause or advance the guide.
export function guideNarrationCue({
  state,
  t,
  result,
  backendError,
}: NarrationSnapshot): NarrationCue | null {
  if (!state) return null;
  if (state.stage === "introduction") return INTRO_CUE;
  if (state.stage === "robot-operation" || state.stage === "fault-detection") {
    if (t >= 12 && result)
      return {
        id: `${state.stage}:analysis-ready-${result.id ?? result.status}`,
        text: "Review the backend observations and their evidence references.",
      };
    if (t >= 12)
      return backendError
        ? {
            id: `${state.stage}:analysis-error`,
            text: "Analysis is unavailable. Retry when the service is ready.",
          }
        : {
            id: `${state.stage}:analysis-pending`,
            text: "MaintainAI is comparing the recorded evidence.",
          };
    return t >= 6
      ? {
          id: `${state.stage}:simulation-loss`,
          text: "Simulated presence was lost while hold was commanded at the loss.",
        }
      : { ...INTRO_CUE, id: "robot-operation" };
  }
  const resultKey = result?.id ?? result?.status ?? "pending";
  if (state.stage === "evidence-investigation")
    return {
      id: `evidence-${resultKey}`,
      text:
        result?.status === "inconclusive"
          ? "Evidence is inconclusive. Review the recorded signals."
          : result?.status === "normal"
            ? "The backend reports a normal cycle."
            : "Review the backend observations and their evidence references.",
    };
  if (state.stage === "diagnosis")
    return {
      id: `checks-${resultKey}`,
      text: result?.hypotheses.length
        ? "Possible causes need operator verification before repair."
        : "Review the evidence before identifying a cause.",
    };
  return {
    id: "maintenance-handoff",
    text: "Ticket confirmation is not available in this walkthrough yet. No maintenance ticket has been saved.",
  };
}

export function selectNarrationVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const eligible = voices.filter(
    (v) => v.localService === true && v.lang.toLowerCase().startsWith("en"),
  );
  return (
    eligible.find(
      (v) =>
        /microsoft david\b/i.test(v.name) && v.lang.toLowerCase() === "en-us",
    ) ??
    eligible.find((v) => v.default) ??
    eligible[0]
  );
}
