// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import InvestigationSummary from "./InvestigationSummary";
import type { Diagnosis } from "./model";
afterEach(cleanup);
const result: Diagnosis = {
  status: "detected",
  failure: "Backend fault",
  summary: "Computed evidence",
  observations: [
    "First observation",
    "Second observation",
    "Third observation",
  ].map((text) => ({ text, evidence: [] })),
  hypotheses: ["Backend first", "Backend second"].map((cause) => ({
    cause,
    check: `Check ${cause}`,
    support: [],
    contradiction: [],
  })),
  timeline: [],
  warnings: [],
  ranking_basis: "ordinal",
};
function show(extra = {}) {
  const onRetry = vi.fn(),
    onDetails = vi.fn();
  render(
    <InvestigationSummary
      clock={{ t: 0, running: false }}
      result={null}
      busy={false}
      error=""
      onRetry={onRetry}
      onDetails={onDetails}
      {...extra}
    />,
  );
  return { onRetry, onDetails };
}
it.each([
  [{}, "Ready to run"],
  [{ clock: { t: 1, running: true } }, "Cycle running"],
  [{ clock: { t: 1, running: false } }, "Cycle paused"],
  [{ busy: true }, "Analysis pending"],
  [{ result }, "Fault detected"],
  [{ result: { ...result, status: "normal", failure: null } }, "Normal cycle"],
  [
    { result: { ...result, status: "inconclusive", failure: null } },
    "Inconclusive",
  ],
])("presents the actual summary state %s", (props, label) => {
  show(props);
  expect(screen.getByText(label)).toBeInTheDocument();
});
it("preserves backend order and separates observations, hypothesis and check", () => {
  show({ result });
  expect(screen.getByText("First observation")).toBeInTheDocument();
  expect(screen.getByText("Second observation")).toBeInTheDocument();
  const more = screen.getByText("More observations (1)").closest("details")!;
  expect(more.open).toBe(false);
  fireEvent.click(screen.getByText("More observations (1)"));
  expect(screen.getByText("Third observation")).toBeVisible();
  expect(screen.getByText("Backend first")).toBeInTheDocument();
  expect(screen.queryByText("Backend second")).not.toBeInTheDocument();
  expect(screen.getByText("Check Backend first")).toBeInTheDocument();
  for (const name of ["Supporting evidence", "Possible cause", "Next check"])
    expect(screen.getByRole("heading", { name })).toBeInTheDocument();
  expect(screen.getByText(/3 observations · 2 hypotheses/)).toBeInTheDocument();
});
it("prioritizes an actionable error over stale results and opens full details", () => {
  const { onRetry, onDetails } = show({
    error: "Service offline",
    result,
    busy: true,
  });
  expect(screen.getByRole("alert")).toHaveTextContent("Service offline");
  expect(screen.queryByText("Backend first")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry diagnosis" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Full diagnostics & evidence" }),
  );
  expect(onRetry).toHaveBeenCalledOnce();
  expect(onDetails).toHaveBeenCalledOnce();
});

it("keeps the first warning visible and makes every further warning discoverable", () => {
  show({
    result: {
      ...result,
      warnings: ["First warning", "Second warning", "Third warning"],
    },
  });
  expect(screen.getByText("First warning")).toBeVisible();
  const more = screen.getByText("More analysis warnings (2)");
  fireEvent.click(more);
  expect(screen.getByText("Second warning")).toBeVisible();
  expect(screen.getByText("Third warning")).toBeVisible();
});
