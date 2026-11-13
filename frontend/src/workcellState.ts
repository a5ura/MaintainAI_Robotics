import { cyclePayload, scenarioSample, type Scenario } from "./scenarios";
import type { Vec } from "./model";
import { LOSS, SOURCE, TARGET } from "./workcellView";
// Reuse the first recorded present-to-absent transition; no second event clock.
const lossEvent = cyclePayload("drop").samples.find(
  (row, index, rows) =>
    index > 0 && rows[index - 1].object_present && !row.object_present,
)!;
const lossCommand = lossEvent.grip_command ? "HOLD" : "RELEASE";
export type SceneIndicator = {
  headline?: string;
  tone: "neutral" | "normal" | "warning" | "fault";
  text: string;
  note: string;
  marker: "none" | "placed" | "loss" | "offset" | "vision" | "stop";
  point: Vec;
  observed?: Vec;
};
export function workcellState(t: number, scenario: Scenario): SceneIndicator {
  const row = scenarioSample(t, scenario);
  const base: SceneIndicator = {
    tone: "neutral",
    text:
      t === 0
        ? "Ready for pick and place"
        : t < 2
          ? "Approaching source · part at fixture"
          : row.object_present
            ? "Part held at gripper"
            : "Released · verification pending",
    note: "Simulated observations · not a root-cause diagnosis",
    marker: "none",
    point: SOURCE,
  };
  if (scenario === "stop" && t >= 6)
    return {
      ...base,
      tone: "fault",
      text: "Protective stop · 6.0 s",
      note: "Motion frozen · gripper remains holding the part",
      marker: "stop",
      point: LOSS,
    };
  if (scenario === "drop" && t >= lossEvent.t)
    return {
      ...base,
      tone: "fault",
      headline: `PRESENCE LOST AT ${lossEvent.t.toFixed(1)}s · ${lossCommand} COMMANDED AT LOSS`,
      text: `Presence lost · ${lossEvent.t.toFixed(1)} s`,
      note: `${lossCommand} was commanded at loss · cause requires verification`,
      marker: "loss",
      point: LOSS,
    };
  if (t >= 12 && row.vision?.status === "timeout")
    return {
      ...base,
      tone: "warning",
      text: "Vision timeout · result unknown",
      note: "Part remains independently observed at destination",
      marker: "vision",
      point: TARGET,
    };
  if (t >= 12 && scenario === "position" && row.placement?.observed)
    return {
      ...base,
      tone: "warning",
      text: "Intended / observed placement",
      note: `Independent observation · +${(row.placement.observed[0] - row.placement.target[0]).toFixed(2)} m X offset`,
      marker: "offset",
      point: TARGET,
      observed: row.placement.observed,
    };
  if (t >= 12 && row.verification === "target")
    return {
      ...base,
      tone: "normal",
      text: "Placement verified · released",
      note: "Part is at destination; absence at gripper is expected",
      marker: "placed",
      point: TARGET,
    };
  if (scenario === "position" && t >= 10)
    return {
      ...base,
      tone: "warning",
      text: "Simulated offset · verification pending",
    };
  return base;
}
