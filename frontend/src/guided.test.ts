import { expect, it } from "vitest";
import {
  GUIDE_STAGES,
  initialGuide,
  guideReducer,
  guideReadiness,
  GUIDE_LOSS_TIME,
  type ActiveGuide,
  type GuideAction,
} from "./guided";
import computed from "../../fixtures/guide-diagnosis.json";
import type { Diagnosis } from "./model";
const result = computed as unknown as Diagnosis;
function event(
  state: ActiveGuide,
  type: "next" | "previous" | "pause" | "resume" | "timer",
) {
  return guideReducer(state, { type, token: state }) as ActiveGuide;
}
it("starts Manual and orders all six stages with a terminal non-persisting handoff", () => {
  let state = initialGuide(1);
  expect(state.mode).toBe("manual");
  for (const stage of GUIDE_STAGES) {
    expect(state.stage).toBe(stage);
    state = { ...state, readiness: "ready" };
    const old = state;
    state = event(state, "next");
    if (stage === "maintenance-handoff") expect(state).toEqual(old);
  }
  expect(state).not.toHaveProperty("ticketId");
});
it("waiting, unavailable, paused and manual timer events cannot advance", () => {
  for (const readiness of ["waiting", "unavailable"] as const) {
    const state = { ...initialGuide(1), readiness };
    expect(event(state, "next")).toBe(state);
  }
  const state = initialGuide(1);
  expect(event(state, "timer")).toBe(state);
  const paused = event(state, "pause");
  expect(event(paused, "next")).toBe(paused);
  expect(event(paused, "resume").stage).toBe(state.stage);
});
it("mode, pause and navigation invalidate old entry tokens; old epochs never advance restarted runs", () => {
  const old = initialGuide(1);
  const state = guideReducer(old, {
    type: "mode",
    token: old,
    mode: "automatic",
  }) as ActiveGuide;
  const stale: GuideAction = { type: "timer", token: old };
  expect(guideReducer(state, stale)).toBe(state);
  const moved = event(state, "timer");
  expect(moved.stage).toBe("robot-operation");
  expect(guideReducer(moved, { type: "next", token: state })).toBe(moved);
  const restarted = initialGuide(2);
  expect(guideReducer(restarted, stale)).toBe(restarted);
  expect(guideReducer(null, stale)).toBeNull();
});
it("Previous preserves frontier and re-entry never implies rewinding", () => {
  let state = initialGuide(1);
  state = event(state, "next");
  state = event({ ...state, readiness: "ready" }, "next");
  const back = event(state, "previous");
  expect(back.stage).toBe("robot-operation");
  expect(back.frontier).toBe(2);
  expect(back).not.toHaveProperty("clock");
});
it("readiness uses real loss/run/diagnosis state, not reading timers", () => {
  const clock = { t: GUIDE_LOSS_TIME - 0.01, running: true };
  expect(guideReadiness("robot-operation", clock, null, "")).toBe("waiting");
  expect(
    guideReadiness(
      "robot-operation",
      { t: GUIDE_LOSS_TIME, running: false },
      null,
      "",
    ),
  ).toBe("ready");
  expect(
    guideReadiness("fault-detection", { t: 8, running: true }, result, ""),
  ).toBe("waiting");
  for (const stage of GUIDE_STAGES.slice(2)) {
    expect(guideReadiness(stage, { t: 12, running: false }, null, "")).toBe(
      "waiting",
    );
    expect(
      guideReadiness(stage, { t: 12, running: false }, null, "offline"),
    ).toBe("unavailable");
    expect(guideReadiness(stage, { t: 12, running: false }, result, "")).toBe(
      "ready",
    );
  }
});
