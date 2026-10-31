// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import computed from "../../fixtures/guide-diagnosis.json";
vi.mock("./Workcell", () => ({ default: () => <div>3D workcell</div> }));
const { App } = await import("./App");
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function response(data: unknown) {
  return { ok: true, json: async () => data };
}
const detail = {
  ticket: {
    id: "T-guide",
    equipment_id: "R-01",
    title: "Guided demo — Dropped object",
    description: "synthetic",
    status: "Open",
    version: 1,
    created_at: "2026-10-31",
    updated_at: "2026-10-31",
    resolution_notes: "",
  },
  diagnosis: computed,
  history: [],
};
it("live guide pauses, skips through real payload request, then saves a linked ticket", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn().mockImplementation(async (url, options) => {
    if (String(url).endsWith("/diagnose")) return response(computed);
    if (String(url).endsWith("/equipment"))
      return response([
        {
          id: "R-01",
          name: "Robot",
          description: "demo",
          status: "Operational",
          ticket_count: 1,
        },
      ]);
    if (String(url).endsWith("/tickets") && options.method === "GET")
      return response([detail.ticket]);
    return response(detail);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);
  expect(
    screen.queryByRole("region", { name: "Guided Demo" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Start Guided Demo" }));
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.click(screen.getByRole("button", { name: "Pause demo" }));
  const value = screen.getByRole("progressbar").getAttribute("value");
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", value);
  fireEvent.click(screen.getByRole("button", { name: "Resume demo" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip to Results" }));
  await act(async () => {});
  expect(screen.getByRole("region", { name: "Guided Demo" })).toHaveTextContent(
    "Insufficient vacuum / seal loss",
  );
  const diagnosisCall = fetchMock.mock.calls.find((c) =>
    String(c[0]).endsWith("/diagnose"),
  )!;
  const payload = JSON.parse(diagnosisCall[1].body);
  expect(payload.samples.length).toBe(11);
  expect(payload).not.toHaveProperty("scenario");
  await act(async () => vi.advanceTimersByTime(4100));
  const posts = fetchMock.mock.calls.filter(
    (c) => String(c[0]).endsWith("/tickets") && c[1].method === "POST",
  );
  expect(posts.length).toBe(1);
  const ticket = JSON.parse(posts[0][1].body);
  expect(ticket.diagnosis_id).toBe(computed.id);
  expect(ticket.request_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(screen.getByRole("region", { name: "Guided Demo" })).toHaveTextContent(
    "T-guide",
  );
});
it("manual takeover freezes simulation and prevents automatic ticket creation", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn());
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Start Guided Demo" }));
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.click(screen.getByRole("button", { name: "Take Manual Control" }));
  const progress = screen.getByRole("progressbar").getAttribute("value");
  act(() => vi.advanceTimersByTime(30000));
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", progress);
  expect(
    screen.queryByRole("region", { name: "Guided Demo" }),
  ).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("reset invalidates an in-flight diagnosis rather than surfacing old results", async () => {
  vi.useFakeTimers();
  let resolve!: (v: unknown) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    ),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Start Guided Demo" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip to Results" }));
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: /^Reset$/ }));
  await act(async () => resolve(response(computed)));
  expect(
    screen.queryByRole("heading", { name: "Dropped object" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
});
