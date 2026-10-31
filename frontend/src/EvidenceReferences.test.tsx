// @vitest-environment jsdom
import { it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EvidenceReferences } from "./EvidenceReferences";
import type { Evidence } from "./model";
const row: Evidence = {
  id: "E6",
  t: 6,
  phase: "transport",
  tcp: [1, 1, 0],
  joints: [0, 0, 0],
  grip_command: true,
  object_present: false,
  pressure_kpa: 12,
  verification: null,
};
afterEach(cleanup);
it("exposes measured support and contradiction links to matching timeline rows", () => {
  render(
    <>
      <EvidenceReferences ids={["E6"]} timeline={[row]} label="Supports" />
      <EvidenceReferences ids={["E6"]} timeline={[row]} label="Contradicts" />
    </>,
  );
  for (const label of ["Supports", "Contradicts"]) {
    const link = screen.getByRole("link", {
      name: new RegExp(`${label} E6 at 6.0 seconds`),
    });
    expect(link).toHaveAttribute("href", "#evidence-E6");
    expect(link).toHaveAttribute(
      "title",
      expect.stringContaining("vacuum 12 kPa"),
    );
    expect(link).toHaveAccessibleName(expect.stringContaining("object ABSENT"));
    expect(link).toHaveAccessibleName(expect.stringContaining("transport"));
  }
});
it("marks missing references instead of fabricating a link", () => {
  render(<EvidenceReferences ids={["E99"]} timeline={[]} label="Supports" />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText("E99 · reference unavailable")).toBeInTheDocument();
});
it("shows no support and unknown sensor values honestly", () => {
  const { rerender } = render(
    <EvidenceReferences ids={[]} timeline={[]} label="Supports" />,
  );
  expect(screen.getByText("None observed")).toBeInTheDocument();
  rerender(
    <EvidenceReferences
      ids={["E6"]}
      timeline={[{ ...row, object_present: null, pressure_kpa: null }]}
      label="Supports"
    />,
  );
  expect(screen.getByRole("link")).toHaveAccessibleName(
    expect.stringContaining("object UNKNOWN · vacuum unknown kPa"),
  );
});
