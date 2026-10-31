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

function ticketWorkflow(deferAutomaticSave = false) {
  let finishAutomatic!: () => void;
  let manual = {
    ...detail,
    ticket: { ...detail.ticket, id: "T-manual", title: "Manual review" },
  };
  const fetchMock = vi.fn().mockImplementation(async (url, options) => {
    const path = String(url);
    if (path.endsWith("/diagnose")) return response(computed);
    if (path.endsWith("/equipment"))
      return response([
        {
          id: "R-01",
          name: "Robot",
          description: "demo",
          status: "Operational",
          ticket_count: 1,
        },
      ]);
    if (path.endsWith("/tickets") && options.method === "POST") {
      const body = JSON.parse(options.body);
      if (body.request_id) {
        if (!deferAutomaticSave) return response(detail);
        return new Promise((resolve) => {
          finishAutomatic = () => resolve(response(detail));
        });
      }
      manual = {
        ...manual,
        ticket: {
          ...manual.ticket,
          title: body.title,
          description: body.description,
        },
      };
      return response(manual);
    }
    if (path.endsWith("/tickets")) return response([manual.ticket]);
    return response(path.endsWith("/T-guide") ? detail : manual);
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    fetchMock,
    finishAutomatic: () => finishAutomatic(),
    posts: () =>
      fetchMock.mock.calls.filter(
        (c) => String(c[0]).endsWith("/tickets") && c[1].method === "POST",
      ),
  };
}

async function skipGuidedReplay() {
  fireEvent.click(screen.getByRole("button", { name: "Start Guided Demo" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip to Results" }));
  await act(async () => {});
}

it("manual ticket creation cancels the guide without replacing unsaved form details", async () => {
  vi.useFakeTimers();
  const workflow = ticketWorkflow();
  render(<App />);
  await skipGuidedReplay();
  fireEvent.click(
    screen.getByRole("button", { name: "Create maintenance ticket" }),
  );
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("Title", { exact: true }), {
    target: { value: "Manual investigation draft" },
  });
  fireEvent.change(screen.getByLabelText("Description", { exact: true }), {
    target: { value: "Keep these operator details" },
  });
  await act(async () => vi.advanceTimersByTime(10000));
  expect(workflow.posts()).toHaveLength(0);
  expect(
    screen.queryByRole("region", { name: "Guided Demo" }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("Title", { exact: true })).toHaveValue(
    "Manual investigation draft",
  );
  expect(screen.getByLabelText("Description", { exact: true })).toHaveValue(
    "Keep these operator details",
  );
});

it("an already-pending guide save cannot select its ticket or erase manual repair-note drafts", async () => {
  vi.useFakeTimers();
  const workflow = ticketWorkflow(true);
  render(<App />);
  await skipGuidedReplay();
  await act(async () => vi.advanceTimersByTime(4100));
  expect(workflow.posts()).toHaveLength(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Create maintenance ticket" }),
  );
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("Title", { exact: true }), {
    target: { value: "Manual review" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create ticket" }));
  await act(async () => {});
  fireEvent.change(
    screen.getByLabelText("Repair note / operator observation"),
    { target: { value: "Unsaved repair note must remain" } },
  );
  fireEvent.change(screen.getByLabelText("Ticket status", { exact: true }), {
    target: { value: "In Progress" },
  });
  fireEvent.change(screen.getByLabelText("Title", { exact: true }), {
    target: { value: "Next incident draft" },
  });
  fireEvent.change(screen.getByLabelText("Description", { exact: true }), {
    target: { value: "Do not replace this draft" },
  });
  await act(async () => workflow.finishAutomatic());
  await act(async () => vi.advanceTimersByTime(10000));
  expect(workflow.posts()).toHaveLength(2); // One submitted guide save, one intentional manual save.
  expect(
    screen.getByRole("region", { name: "Ticket details" }),
  ).toHaveTextContent("T-manual");
  expect(
    screen.getByRole("region", { name: "Ticket details" }),
  ).not.toHaveTextContent("T-guide");
  expect(
    screen.getByLabelText("Repair note / operator observation"),
  ).toHaveValue("Unsaved repair note must remain");
  expect(screen.getByLabelText("Ticket status", { exact: true })).toHaveValue(
    "In Progress",
  );
  expect(screen.getByLabelText("Title", { exact: true })).toHaveValue(
    "Next incident draft",
  );
  expect(screen.getByLabelText("Description", { exact: true })).toHaveValue(
    "Do not replace this draft",
  );
  expect(
    workflow.fetchMock.mock.calls.some((c) =>
      String(c[0]).endsWith("/T-guide"),
    ),
  ).toBe(false);
});

it("manual ticket creation clears the selection from a previously completed guide", async () => {
  vi.useFakeTimers();
  const workflow = ticketWorkflow();
  render(<App />);
  await skipGuidedReplay();
  await act(async () => vi.advanceTimersByTime(4100));
  expect(
    screen.getByRole("region", { name: "Ticket details" }),
  ).toHaveTextContent("T-guide");
  fireEvent.click(screen.getByRole("button", { name: "Return to operations" }));
  const reads = workflow.fetchMock.mock.calls.filter((c) =>
    String(c[0]).endsWith("/T-guide"),
  ).length;
  fireEvent.click(
    screen.getByRole("button", { name: "Create maintenance ticket" }),
  );
  await act(async () => {});
  expect(
    screen.getByRole("region", { name: "Ticket details" }),
  ).toHaveTextContent("Choose an incident.");
  expect(
    workflow.fetchMock.mock.calls.filter((c) =>
      String(c[0]).endsWith("/T-guide"),
    ),
  ).toHaveLength(reads);
});
