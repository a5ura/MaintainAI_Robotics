// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import {
  historicalPosition,
  resolveEvidence,
  useEvidenceSelection,
} from "./evidenceSelection";
import type { Diagnosis, Evidence } from "./model";
import { scenarioSample } from "./scenarios";
const row: Evidence = {
  ...scenarioSample(6, "drop"),
  id: "E6",
  kinematics: {
    valid: true,
    expected_tcp: scenarioSample(6, "drop").tcp,
    error_m: 0,
    tolerance_m: 0.001,
    violations: [],
  },
};
const diagnosis = { id: "D1", timeline: [row] } as Diagnosis;
afterEach(cleanup);
it("scopes selection to the result object, not E6 or a repeatable diagnosis ID alone", () => {
  const { result, rerender } = renderHook(
    ({ data, scope }) => useEvidenceSelection(data, scope),
    { initialProps: { data: diagnosis, scope: "run-1" } },
  );
  act(() => result.current.select("E6"));
  expect(result.current.row).toBe(row);
  const stale = result.current.select;
  rerender({ data: { ...diagnosis }, scope: "run-1" });
  expect(result.current.selectedId).toBeNull();
  act(() => stale("E6"));
  expect(result.current.selectedId).toBeNull();
});
it.each(["reset", "scenario", "seed", "ticket"])(
  "clears and rejects stale callbacks on %s context change",
  (change) => {
    const { result, rerender } = renderHook(
      ({ scope }) => useEvidenceSelection(diagnosis, scope),
      { initialProps: { scope: "initial" } },
    );
    const stale = result.current.select;
    act(() => stale("E6"));
    rerender({ scope: change });
    expect(result.current.selectedId).toBeNull();
    act(() => stale("E6"));
    expect(result.current.selectedId).toBeNull();
    rerender({ scope: "initial" });
    expect(result.current.selectedId).toBeNull();
  },
);
it("retains an unavailable-reference explanation without fabricating a row", () => {
  expect(resolveEvidence(diagnosis, "missing").row).toBeNull();
  expect(
    resolveEvidence({ ...diagnosis, timeline: [row, row] }, "E6").issue,
  ).toContain("ambiguous");
});
it("permits only finite recorded positions with backend-valid kinematics", () => {
  expect(historicalPosition(row)).toBe(row.tcp);
  for (const invalid of [
    null,
    { ...row, tcp: [NaN, 0, 0] },
    { ...row, tcp: new Array(3) },
    { ...row, joints: [] },
    { ...row, t: NaN },
    { ...row, kinematics: undefined },
    { ...row, kinematics: { ...row.kinematics, expected_tcp: null } },
    { ...row, kinematics: { ...row.kinematics, expected_tcp: [999, 0, 0] } },
    { ...row, kinematics: { ...row.kinematics, error_m: 1 } },
    { ...row, kinematics: { ...row.kinematics, valid: false } },
  ])
    expect(historicalPosition(invalid as Evidence | null)).toBeNull();
});
