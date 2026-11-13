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
  if (state.error)
    return {
      id: "save-error",
      text: "Ticket saving failed. Use the save retry control.",
    };
  if (state.stage === "simulation") {
    if (t >= 12)
      return backendError
        ? {
            id: "analysis-error",
            text: "Analysis is unavailable. Retry when the service is ready.",
          }
        : {
            id: "analysis-pending",
            text: "MaintainAI is comparing the recorded evidence.",
          };
    return t >= 6
      ? {
          id: "simulation-loss",
          text: "Simulated presence is lost while hold remains commanded.",
        }
      : INTRO_CUE;
  }
  const resultKey = result?.id ?? result?.status ?? "pending";
  if (state.stage === "evidence")
    return {
      id: `evidence-${resultKey}`,
      text:
        result?.status === "inconclusive"
          ? "Evidence is inconclusive. Review the recorded signals."
          : result?.status === "normal"
            ? "The backend reports a normal cycle."
            : "Review the backend observations and their evidence references.",
    };
  if (state.stage === "checks")
    return {
      id: `checks-${resultKey}`,
      text: result?.hypotheses.length
        ? "Possible causes need operator verification before repair."
        : "Review the evidence before identifying a cause.",
    };
  if (state.stage === "saving")
    return {
      id: `saving-${resultKey}`,
      text: "Saving this demonstration's evidence as a maintenance ticket.",
    };
  return {
    id: `complete-${state.ticketId ?? ""}`,
    text: "The ticket preserves evidence for technician review.",
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
