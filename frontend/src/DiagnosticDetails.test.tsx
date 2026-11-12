// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import DiagnosticDetails from "./DiagnosticDetails";
import fixture from "../../fixtures/guide-diagnosis.json";
import type { Diagnosis } from "./model";
afterEach(cleanup);
it("retains complete backend observations, hypothesis order, references and ticket entry", () => {
  // JSON fixtures widen fixed-length vectors to arrays at import time.
  const result = fixture as unknown as Diagnosis;
  const onCreateTicket = vi.fn();
  render(
    <DiagnosticDetails
      result={{ ...result, id: "synthetic-diagnosis" }}
      busy={false}
      error=""
      onCreateTicket={onCreateTicket}
    />,
  );
  for (const observation of result.observations)
    expect(
      screen.getByText(observation.text, { exact: true }),
    ).toBeInTheDocument();
  const summaries = Array.from(
    screen
      .getByRole("region", { name: "Diagnostics Workspace" })
      .querySelectorAll("details > summary"),
  );
  expect(summaries).toHaveLength(result.hypotheses.length);
  result.hypotheses.forEach((hypothesis, i) => {
    expect(summaries[i]).toHaveTextContent(hypothesis.cause);
    expect(
      screen.getByText(hypothesis.check, { exact: true }),
    ).toBeInTheDocument();
  });
  expect(
    screen.getByRole("link", { name: /Supports E6 at 6.0 seconds/ }),
  ).toHaveAttribute("href", "#evidence-E6");
  fireEvent.click(
    screen.getByRole("button", { name: "Create maintenance ticket" }),
  );
  expect(onCreateTicket).toHaveBeenCalledOnce();
});
