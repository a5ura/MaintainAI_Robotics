import { it, expect } from "vitest";
import { guideReducer, type GuideState } from "./guided";
it("guidance cannot progress while paused; resume retains stage", () => {
  let state = guideReducer(null, { type: "start" });
  state = guideReducer(state, { type: "pause" });
  expect(guideReducer(state, { type: "result" })).toEqual(state);
  expect(guideReducer(state, { type: "next" })).toEqual(state);
  state = guideReducer(state, { type: "resume" });
  state = guideReducer(state, { type: "result" });
  expect(state?.stage).toBe("evidence");
  state = guideReducer(state, { type: "next" });
  expect(state?.stage).toBe("checks");
  state = guideReducer(state, { type: "next" });
  expect(state?.stage).toBe("saving");
  state = guideReducer(state, { type: "saved", ticketId: "T1" });
  expect(state?.ticketId).toBe("T1");
});
it("skip results still waits for actual result, then moves to checks", () => {
  let state = guideReducer(null, { type: "start" });
  state = guideReducer(state, { type: "skip" });
  expect(state?.stage).toBe("simulation");
  state = guideReducer(state, { type: "result" });
  expect(state?.stage).toBe("checks");
});
it("manual control stops progression and reset begins a fresh guide", () => {
  const stopped = guideReducer(guideReducer(null, { type: "start" }), {
    type: "stop",
  });
  expect(stopped).toBeNull();
  expect(guideReducer(stopped, { type: "result" })).toBeNull();
  expect(guideReducer(stopped, { type: "start" })).toEqual({
    stage: "simulation",
    paused: false,
    skipTour: false,
  });
});
it("ticket errors preserve the workflow for an explicit safe retry", () => {
  const state: GuideState = { stage: "saving", paused: false, skipTour: false };
  const failed = guideReducer(state, { type: "error", message: "unavailable" });
  expect(failed?.error).toBe("unavailable");
  expect(guideReducer(failed, { type: "retry" })?.error).toBeUndefined();
});
