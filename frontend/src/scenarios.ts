import {
  advance,
  DURATION,
  fk,
  trajectory,
  sample,
  objectPosition,
  SAMPLE_TIMES,
  type Clock,
  type Sample,
  type Vec,
} from "./model";
export const SCENARIOS = {
  normal: "Valid cycle",
  drop: "Dropped object",
  position: "Positioning error",
  vision: "Vision failure",
  stop: "Unexpected robot stop",
} as const;
export type Scenario = keyof typeof SCENARIOS;
export type Selection = Scenario | "random";
export const STOP_TIME = 6;
export const PLACEMENT_OFFSET = 0.45;
export type Event = {
  t: number;
  source: "controller" | "camera" | "calibration" | "safety";
  code: string;
  message: string;
};
export type Vision = {
  acquired_t: number;
  status: "ok" | "timeout" | "no_detection";
  confidence: number | null;
  object_detected: boolean | null;
};
export type Placement = {
  target: Vec;
  commanded_target: Vec;
  observed: Vec | null;
  object_present: boolean | null;
  source: "camera" | "independent_sensor";
  calibration_age_days: number | null;
};
export type Controller = {
  state: "running" | "protective_stop" | "stopped";
  motion_expected: boolean;
  safety_gate_open: boolean | null;
  drive_warning: boolean | null;
};
export type ScenarioSample = Sample & {
  vision?: Vision;
  placement?: Placement;
  controller?: Controller;
  events?: Event[];
};
export function resolveScenario(selection: Selection, seed: number): Scenario {
  if (selection !== "random") return selection;
  // Mulberry32: one deterministic draw from an explicit uint32 seed.
  let n = (seed + 0x6d2b79f5) >>> 0;
  n = Math.imul(n ^ (n >>> 15), n | 1);
  n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
  return (["drop", "position", "vision", "stop"] as Scenario[])[
    Math.floor((((n ^ (n >>> 14)) >>> 0) / 4294967296) * 4)
  ];
}
export function endTime(scenario: Scenario) {
  return scenario === "stop" ? STOP_TIME : DURATION;
}
export function advanceScenario(
  clock: Clock,
  dt: number,
  scenario: Scenario,
): Clock {
  const next = advance(clock, dt),
    t = Math.min(next.t, endTime(scenario));
  return { t, running: next.running && t < endTime(scenario) };
}
export function scenarioSample(t: number, scenario: Scenario): ScenarioSample {
  t = Math.min(t, endTime(scenario));
  const row: ScenarioSample = {
    ...sample(t, scenario === "drop"),
    controller: {
      state: "running",
      motion_expected: t < 12,
      safety_gate_open: false,
      drive_warning: false,
    },
    events: [],
  };
  if (scenario === "stop" && t >= STOP_TIME) {
    row.controller = {
      state: "protective_stop",
      motion_expected: true,
      safety_gate_open: true,
      drive_warning: false,
    };
    row.events = [
      {
        t,
        source: "safety",
        code: "SAFETY_GATE_OPEN",
        message: "Synthetic safety gate opened during transfer.",
      },
      {
        t,
        source: "controller",
        code: "PROTECTIVE_STOP",
        message:
          "Controller halted expected joint motion; authorized recovery required.",
      },
    ];
  }
  if (t === 12) {
    const target = fk(trajectory(10)).tcp;
    const observed: Vec = [
      target[0] + (scenario === "position" ? PLACEMENT_OFFSET : 0),
      target[1],
      target[2],
    ];
    row.placement = {
      target,
      commanded_target: target,
      observed: scenario === "drop" ? null : observed,
      object_present: scenario !== "drop",
      source: "independent_sensor",
      calibration_age_days: scenario === "position" ? 90 : 2,
    };
    row.vision = {
      acquired_t: t,
      status: "ok",
      confidence: 0.98,
      object_detected: scenario !== "drop",
    };
    if (scenario === "position") {
      row.verification = "offset";
      row.events = [
        {
          t,
          source: "calibration",
          code: "FRAME_OFFSET",
          message:
            "Independent fixture measurement shows +0.45 m X discrepancy; calibration age 90 days.",
        },
      ];
    }
    if (scenario === "vision") {
      row.verification = "unreliable";
      row.vision = {
        acquired_t: 8,
        status: "timeout",
        confidence: null,
        object_detected: null,
      };
      row.events = [
        {
          t,
          source: "camera",
          code: "CAMERA_TIMEOUT",
          message: "No fresh image received at post-place verification.",
        },
      ];
    }
  }
  return row;
}
export function cyclePayload(scenario: Scenario) {
  return {
    samples: SAMPLE_TIMES.filter((t) => t <= endTime(scenario)).map((t) =>
      scenarioSample(t, scenario),
    ),
  };
}
export function scenarioObjectPosition(t: number, scenario: Scenario): Vec {
  const p = objectPosition(Math.min(t, endTime(scenario)), scenario === "drop");
  return scenario === "position" && t >= 10
    ? [p[0] + PLACEMENT_OFFSET * Math.min((t - 10) / 2, 1), p[1], p[2]]
    : p;
}
