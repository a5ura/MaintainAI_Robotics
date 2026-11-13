// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it } from "vitest";
import type { Diagnosis, Evidence } from "./model";
import { scenarioSample } from "./scenarios";
import {
  EvidenceSelectionContext,
  useEvidenceSelection,
} from "./evidenceSelection";
import EvidenceInspector from "./EvidenceInspector";
import EvidenceTimeline from "./EvidenceTimeline";
import CandidateComparison from "./CandidateComparison";
import { EvidenceReferences } from "./EvidenceReferences";
import EvidenceHighlight from "./EvidenceHighlight";
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
const data: Diagnosis = {
  id: "D1",
  status: "detected",
  failure: "Drop",
  summary: "Backend result",
  observations: [],
  warnings: [],
  ranking_basis: "ordinal",
  timeline: [row],
  hypotheses: [
    {
      cause: "First",
      support: ["E6"],
      contradiction: [],
      check: "Check first",
      anomaly: "Drop",
    },
    {
      cause: "Second",
      support: [],
      contradiction: ["E6", "missing"],
      check: "Check second",
      anomaly: "Other",
    },
  ],
};
function Harness({
  result = data,
  scope = "run",
}: {
  result?: Diagnosis;
  scope?: string;
}) {
  const selection = useEvidenceSelection(result, scope);
  return (
    <EvidenceSelectionContext.Provider value={selection}>
      <EvidenceReferences
        ids={["E6"]}
        timeline={result.timeline}
        label="Observation"
      />
      <EvidenceInspector />
      <EvidenceTimeline result={result} />
      <CandidateComparison result={result} />
      <button onClick={() => selection.select("missing")}>Missing</button>
    </EvidenceSelectionContext.Provider>
  );
}
afterEach(cleanup);
it("connects actual reference links and keyboard-capable reading controls to one inspector", () => {
  render(<Harness />);
  const link = screen.getByRole("link", { name: /Observation E6 at/ });
  expect(link).toHaveAttribute("href", "#evidence-E6");
  fireEvent.click(link);
  const inspector = screen.getByRole("region", { name: "Evidence inspector" });
  expect(inspector).toHaveTextContent("Historical E6 · 6.0s");
  expect(inspector).toHaveTextContent("12 kPa");
  expect(screen.getByRole("button", { name: /E6 · 6.0s/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(link).toHaveAttribute("aria-current", "true");
  fireEvent.click(
    screen.getByRole("button", { name: "Clear evidence selection" }),
  );
  expect(inspector).not.toHaveTextContent("Historical E6");
  fireEvent.click(screen.getByRole("button", { name: /E6 · 6.0s/ }));
  expect(inspector).toHaveTextContent("Historical E6");
});
it("preserves every candidate in backend order and support/contradiction membership", () => {
  render(<Harness />);
  const comparison = screen.getByRole("region", {
    name: "Candidate comparison",
  });
  const cards = comparison.querySelectorAll("details");
  expect(
    [...cards].map((card) => card.querySelector("summary")!.textContent),
  ).toEqual(["First", "Second"]);
  expect([...cards].every((card) => card.open)).toBe(true);
  expect(
    within(cards[0]).getByRole("link", { name: /Supports E6/ }),
  ).toBeVisible();
  expect(
    within(cards[1]).getByRole("link", { name: /Contradicts E6/ }),
  ).toBeVisible();
  expect(cards[1]).toHaveTextContent("Limited support");
  expect(cards[1]).toHaveTextContent("missing · reference unavailable");
  expect(cards[1]).toHaveTextContent("Check second");
});
it("shows unknown and invalid recorded evidence without claiming absence or a valid position", () => {
  const unknown = {
    ...row,
    object_present: null,
    pressure_kpa: null,
    verification: null,
    tcp: [NaN, 0, 0],
    kinematics: undefined,
    placement: {
      target: [0, 0, 0],
      commanded_target: [0, 0, 0],
      observed: null,
      object_present: null,
      source: "independent_sensor",
    },
  } as Evidence;
  render(<Harness result={{ ...data, timeline: [unknown] }} />);
  fireEvent.click(screen.getByRole("button", { name: /E6 ·/ }));
  const inspector = screen.getByRole("region", { name: "Evidence inspector" });
  expect(inspector).toHaveTextContent("UNKNOWN");
  expect(inspector).toHaveTextContent("unknown / position unavailable");
  expect(inspector).toHaveTextContent("Spatial highlighting unavailable");
  expect(EvidenceHighlight({ row: unknown })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Missing" }));
  expect(inspector).toHaveTextContent("reference unavailable or ambiguous");
});
it("renders the marker at the recorded TCP, independently of live trajectory and camera", () => {
  const marker = EvidenceHighlight({ row })!;
  expect(marker.props.position).toBe(row.tcp);
  expect(marker.props.name).toBe("historical-evidence");
});
it("clears the inspector on run, ticket-context and diagnosis replacement", () => {
  const { rerender } = render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: /E6 ·/ }));
  rerender(<Harness scope="ticket" />);
  expect(
    screen.getByRole("region", { name: "Evidence inspector" }),
  ).not.toHaveTextContent("Historical E6");
  rerender(<Harness result={{ ...data }} />);
  expect(
    screen.getByRole("region", { name: "Evidence inspector" }),
  ).not.toHaveTextContent("Historical E6");
});
