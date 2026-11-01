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
it("loads bounded history without clearing an unsaved repair draft", async () => {
  const ticket = {
    id: "T1",
    title: "Paged incident",
    status: "Open",
    version: 1,
    equipment_id: "R-01",
  };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url) => ({
      ok: true,
      json: async () => {
        const path = String(url);
        if (path.endsWith("/equipment")) return equipment;
        if (path.includes("/history?"))
          return {
            history: [
              {
                seq: 201,
                at: "now",
                kind: "note",
                body: "Older page continuation",
              },
            ],
            next_seq: null,
          };
        if (path.endsWith("/tickets/T1"))
          return {
            ticket,
            diagnosis: null,
            history: [{ seq: 1, at: "then", kind: "created", body: "Created" }],
            history_next_seq: 200,
          };
        return [ticket];
      },
    })),
  );
  render(
    <Maintenance
      initialTicketId="T1"
      diagnosis={null}
      fromDiagnosis={false}
      runContext="test"
      onReturn={() => {}}
    />,
  );
  await screen.findByRole("button", { name: "Load more history" });
  const note = screen.getByLabelText("Repair note / operator observation");
  fireEvent.change(note, { target: { value: "Keep this draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Load more history" }));
  await screen.findByText("Older page continuation");
  expect(note).toHaveValue("Keep this draft");
  expect(
    screen.queryByRole("button", { name: "Load more history" }),
  ).not.toBeInTheDocument();
});
it("loads another incident page using the last record cursor", async () => {
  const tickets = Array.from({ length: 200 }, (_, i) => ({
    id: `T${i}`,
    equipment_id: "R-01",
    title: `Incident ${i}`,
    status: "Open",
    created_at: "2026-11-01",
  }));
  const fetchMock = vi
    .fn()
    .mockImplementation(async (url) => ({
      ok: true,
      json: async () =>
        String(url).includes("after_created=")
          ? [{ ...tickets[0], id: "T-next", title: "Next page incident" }]
          : String(url).endsWith("/equipment")
            ? equipment
            : tickets,
    }));
  vi.stubGlobal("fetch", fetchMock);
  render(
    <Maintenance
      diagnosis={null}
      fromDiagnosis={false}
      runContext="test"
      onReturn={() => {}}
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Load more incidents" }),
  );
  await screen.findByText("Next page incident");
  expect(
    fetchMock.mock.calls.some(([url]) => String(url).includes("after_id=T199")),
  ).toBe(true);
  expect(
    screen.queryByRole("button", { name: "Load more incidents" }),
  ).not.toBeInTheDocument();
});
