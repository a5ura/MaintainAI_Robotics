import { GUIDE_LOSS_TIME, type GuideState } from "./guided";
import { endTime } from "./scenarios";
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
  text: "Welcome to MaintainAI Robotics. This simulated robot picks, carries, and places a part. We will follow its signals, investigate an observed failure, and review what a maintenance technician should verify. These are simulated inputs analyzed by the application, not live hardware telemetry. You can pause, read, or replay each explanation.",
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
  const resultKey = result?.id ?? result?.status ?? "pending";
  const outcome =
    result?.status === "normal"
      ? "The backend reports a normal cycle."
      : result?.status === "inconclusive"
        ? "The backend reports inconclusive evidence."
        : result
          ? `The backend reports: ${result.summary}`
          : "";
  if (state.stage === "robot-operation" || state.stage === "fault-detection") {
    if (t >= endTime("drop") && result)
      return {
        id: `${state.stage}:analysis-ready-${resultKey}`,
        text: `${outcome} This result comes from recorded cycle evidence. Review its observations before considering candidate causes; an explanation is not proof of a mechanical failure.`,
      };
    if (t >= endTime("drop"))
      return backendError
        ? {
            id: `${state.stage}:analysis-error`,
            text: "Analysis is unavailable. The cycle has finished, but no diagnosis can be claimed from this failed request. The recorded simulation remains visible. Retry diagnosis explicitly in the workspace when the service is ready, or exit the walkthrough. Speech cannot retry the request or fill in a result.",
          }
        : {
            id: `${state.stage}:analysis-pending`,
            text: "MaintainAI is comparing the recorded evidence. The simulated cycle has finished; the backend result is still pending. Sensor readings and events support the investigation, but we should wait for the actual analysis before naming candidate causes. Narration does not accelerate or repeat that request.",
          };
    if (t >= GUIDE_LOSS_TIME)
      return {
        id: `${state.stage}:simulation-loss`,
        text: "Simulated presence was lost while hold was commanded at the loss. This is an observed symptom, not a verified root cause. Compare the presence and vacuum signals with the recorded event. The same cycle will continue to verification before backend analysis; we have not established which physical component, if any, would require repair.",
      };
    return {
      id: state.stage,
      text: "Watch the simulated robot pick up, transport, and place the part. Its joints follow the existing deterministic trajectory. The object-at-gripper signal describes presence, while the grip command describes what was requested. Comparing commands with observations matters: a commanded hold alone does not prove that the object remains attached.",
    };
  }
  if (state.stage === "maintenance-handoff")
    return {
      id: "maintenance-handoff",
      text: "Findings would be handed to maintenance with their diagnosis reference, recorded evidence, and recommended checks. No maintenance ticket has been saved. Ticket confirmation is not available in this walkthrough yet. Existing maintenance records are separate from this unsaved handoff, and any future repair outcome still needs an operator's verification.",
    };
  if (!result)
    return {
      id: `${state.stage}:analysis-${backendError ? "error" : "pending"}`,
      text: backendError
        ? "Analysis is unavailable. No backend result is available for this explanation. Use an explicit diagnosis retry or exit; no candidate cause or verification outcome will be invented."
        : "The diagnosis is still pending. Wait for the actual backend result before reviewing its evidence or candidate causes. The walkthrough remains usable without speech.",
    };
  if (state.stage === "evidence-investigation") {
    const observation = result.observations[0];
    const reference = observation?.evidence.find(
      (id) => result.timeline.filter((row) => row.id === id).length === 1,
    );
    return {
      id: `evidence-${resultKey}`,
      text: `${outcome} ${observation ? `One backend observation is: ${observation.text}` : "No observations were returned; review the available evidence and uncertainty."} ${reference ? `Its reference ${reference} identifies a recorded reading.` : "A unique supporting reference is unavailable; do not assume a reading exists."} Select a timeline reading to inspect its signals. A historical tool center point marker describes that reading, not the current robot pose. Clear Selection removes the historical selection without rewinding the robot.`,
    };
  }
  const candidate = result.hypotheses[0];
  return {
    id: `checks-${resultKey}`,
    text: `${outcome} ${candidate && result.status !== "normal" ? `The first backend candidate is: ${candidate.cause}. Its recommended check is: ${candidate.check}.` : "Review the evidence before identifying a cause. No candidate repair is established here."} Compare supporting and contradicting evidence in the displayed backend order. These explanations require operator verification; the walkthrough has not completed those checks or confirmed a root cause. A recommended check is not a recorded repair outcome.`,
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
