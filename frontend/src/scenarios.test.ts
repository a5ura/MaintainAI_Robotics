import { it, expect } from "vitest";
import contract from "../../fixtures/scenarios.json";
import {
  SCENARIOS,
  resolveScenario,
  cyclePayload,
  advanceScenario,
  endTime,
  scenarioObjectPosition,
  scenarioSample,
  type Scenario,
} from "./scenarios";
import { fk, trajectory } from "./model";
it.each(Object.keys(SCENARIOS) as Scenario[])(
  "%s payload matches shared frontend/backend contract",
  (scenario) => {
    expect(cyclePayload(scenario)).toEqual(contract[scenario]);
  },
);
it("random seeds reproducibly cover all four faults without a diagnosis label", () => {
  const selected = new Set<Scenario>();
  for (let seed = 0; seed < 100; seed++) {
    const scenario = resolveScenario("random", seed);
    selected.add(scenario);
    expect(resolveScenario("random", seed)).toBe(scenario);
    expect(cyclePayload(scenario)).not.toHaveProperty("scenario");
    expect(cyclePayload(scenario)).not.toHaveProperty("seed");
  }
  expect([...selected].sort()).toEqual(["drop", "position", "stop", "vision"]);
});
it("unexpected stop clamps joints and clock at interruption and preserves pause", () => {
  expect(advanceScenario({ t: 5.9, running: true }, 1, "stop")).toEqual({
    t: 6,
    running: false,
  });
  expect(advanceScenario({ t: 3, running: false }, 1, "stop")).toEqual({
    t: 3,
    running: false,
  });
  expect(scenarioSample(9, "stop").joints).toEqual(trajectory(6));
  expect(endTime("stop")).toBe(6);
  expect(
    cyclePayload("stop").samples.some((s) => s.phase === "post-place"),
  ).toBe(false);
});
it("position discrepancy changes the observation/object, never commanded FK", () => {
  const normal = scenarioSample(12, "normal"),
    position = scenarioSample(12, "position");
  expect(position.joints).toEqual(normal.joints);
  expect(position.tcp).toEqual(fk(position.joints).tcp);
  expect(
    scenarioObjectPosition(12, "position")[0] -
      scenarioObjectPosition(12, "normal")[0],
  ).toBeCloseTo(0.45);
  expect(position.placement?.observed).not.toEqual(position.placement?.target);
});
it("camera fault does not mark a physical drop", () => {
  const row = scenarioSample(12, "vision");
  expect(row.vision?.status).toBe("timeout");
  expect(row.placement?.object_present).toBe(true);
  expect(row.verification).toBe("unreliable");
});
