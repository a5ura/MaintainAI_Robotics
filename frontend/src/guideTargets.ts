import type { GuideStage } from "./guided";
export type GuideTarget =
  | "workcell"
  | "simulation-controls"
  | "fault-status"
  | "fault-sensors"
  | "evidence-timeline"
  | "evidence-inspector"
  | "candidate-comparison"
  | "maintenance-handoff";
export const GUIDE_TARGETS: Record<
  GuideStage,
  { title: string; why: string; primary: GuideTarget; secondary: GuideTarget[] }
> = {
  introduction: {
    title: "Introduction",
    primary: "workcell",
    secondary: [],
    why: "This is a simulated pick-and-place workcell, not live hardware.",
  },
  "robot-operation": {
    title: "Robot Operation",
    primary: "workcell",
    secondary: ["simulation-controls"],
    why: "Watch the real simulation and its run controls. The walkthrough pauses at the recorded loss milestone.",
  },
  "fault-detection": {
    title: "Fault Detection",
    primary: "fault-status",
    secondary: ["fault-sensors"],
    why: "Compare the observed loss and sensor state with actual backend analysis progress. A symptom is not a verified cause.",
  },
  "evidence-investigation": {
    title: "Evidence Investigation",
    primary: "evidence-timeline",
    secondary: ["evidence-inspector", "workcell"],
    why: "Choose a recorded reading, inspect its evidence, and view its historical TCP marker. Clear Selection leaves the live robot unchanged.",
  },
  diagnosis: {
    title: "Diagnosis and Next Checks",
    primary: "candidate-comparison",
    secondary: [],
    why: "Compare supporting and contradicting evidence in backend order. Operator checks still require verification.",
  },
  "maintenance-handoff": {
    title: "Maintenance Handoff",
    primary: "maintenance-handoff",
    secondary: [],
    why: "This walkthrough ends with an explanation of future confirmation. No maintenance ticket is created.",
  },
};
export const TARGET_LABELS: Record<GuideTarget, string> = {
  workcell: "workcell",
  "simulation-controls": "run controls",
  "fault-status": "fault status",
  "fault-sensors": "sensor strip",
  "evidence-timeline": "evidence timeline",
  "evidence-inspector": "reading inspector",
  "candidate-comparison": "diagnostic candidates",
  "maintenance-handoff": "maintenance handoff",
};
