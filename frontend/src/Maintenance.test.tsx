// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Maintenance from "./Maintenance";
import { api } from "./api";
import type { Diagnosis } from "./model";
const equipment = [
  {
    id: "R-01",
    name: "Robot",
    description: "Test robot",
    status: "Operational",
    ticket_count: 0,
  },
];
const diagnosis: Diagnosis = {
  id: "D-computed",
  status: "detected",
  failure: "Positioning error",
  summary: "Measured offset",
  observations: [],
  hypotheses: [],
  timeline: [],
  warnings: [],
  ranking_basis: "ordinal",
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("creates a ticket linked to backend diagnosis ID, not a supplied replacement snapshot", async () => {
  const fetchMock = vi.fn().mockImplementation(async (url, options) => {
    const path = String(url);
    if (path.endsWith("/equipment"))
      return { ok: true, json: async () => equipment };
    if (options.method === "POST")
      return {
        ok: true,
        json: async () => ({
          ticket: {
            id: "T1",
            title: "Positioning error",
            status: "Open",
            version: 1,
            equipment_id: "R-01",
          },
          diagnosis,
          history: [],
        }),
      };
    return { ok: true, json: async () => [] };
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <Maintenance
      diagnosis={diagnosis}
      fromDiagnosis={true}
      runContext="Positioning error · seed 42"
      onReturn={() => {}}
    />,
  );
  await screen.findByText("New maintenance ticket");
  fireEvent.click(screen.getByRole("button", { name: "Create ticket" }));
  await waitFor(() =>
    expect(
      screen.getByRole("region", { name: "Ticket details" }),
    ).toHaveTextContent("T1"),
  );
  const call = fetchMock.mock.calls.find((c) => c[1]?.method === "POST")!;
  const body = JSON.parse(call[1].body);
  expect(screen.getByLabelText("Ticket status", { exact: true })).toHaveValue(
    "Open",
  );
  expect(body.diagnosis_id).toBe("D-computed");
  expect(body).not.toHaveProperty("diagnosis");
  expect(body.description).toContain("seed 42");
});
it("shows API errors and supports retrying the registry request", async () => {
  let fail = true;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url) => {
      if (fail)
        return {
          ok: false,
          status: 503,
          json: async () => ({ detail: "Storage busy" }),
        };
      return {
        ok: true,
        json: async () => (String(url).endsWith("/equipment") ? equipment : []),
      };
    }),
  );
  render(
    <Maintenance
      diagnosis={null}
      fromDiagnosis={false}
      runContext=""
      onReturn={() => {}}
    />,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Storage busy");
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: "Reload records" }));
  expect(screen.getByLabelText("Title", { exact: true })).toBeDisabled();
  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole("region", { name: "Equipment registry" }),
  ).toHaveTextContent("Robot");
});
it("API helper preserves conflict message for safe reload instead of silent overwrite", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        detail: "Ticket changed in another session. Reload before updating.",
      }),
    }),
  );
  await expect(
    api("/tickets/T1", "PATCH", { expected_version: 1, note: "repair" }),
  ).rejects.toThrow("Reload before updating");
});
