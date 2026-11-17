// @vitest-environment jsdom
import { StrictMode } from "react";
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
import { installSpeech } from "./testSpeech";
import computed from "../../fixtures/guide-diagnosis.json";
vi.mock("./Workcell", () => ({ default: () => <div>3D workcell</div> }));
const { App } = await import("./App");
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const response = (data: unknown) => ({ ok: true, json: async () => data });
const detail = {
  ticket: {
    id: "T-manual",
    equipment_id: "R-01",
    title: "Manual review",
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
function setup(
  diagnose: () => Promise<unknown> = async () => response(computed),
  strict = false,
  voices = true,
) {
  const speech = installSpeech(voices ? undefined : []);
  vi.useFakeTimers();
  const fetchMock = vi.fn().mockImplementation(async (url, options) => {
    const path = String(url);
    if (path.endsWith("/diagnose")) return diagnose();
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
    if (path.endsWith("/tickets") && options.method === "GET")
      return response([detail.ticket]);
    return response(detail);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    strict ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    ),
  );
  const posts = () =>
    fetchMock.mock.calls.filter(
      (c) => String(c[0]).endsWith("/tickets") && c[1].method === "POST",
    );
  return { speech, fetchMock, posts };
}
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const advance = async (ms: number) => {
  await act(async () => vi.advanceTimersByTime(ms));
};
const stage = () => within(screen.getByRole("region", { name: "Guided Demo" }));
async function runToDiagnosis() {
  click("Start Guided Demo");
  click("Next");
  await advance(6500);
  expect(stage().getByRole("button", { name: "Next" })).toBeEnabled();
  click("Next");
  await advance(6500);
}
it("complete Manual walkthrough and repeated visits never create tickets or replay run actions", async () => {
  const h = setup(undefined, true);
  click("Start Guided Demo");
  expect(stage().getByLabelText("Playback mode")).toHaveValue("manual");
  await advance(10000);
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
  expect(h.fetchMock).not.toHaveBeenCalled();
  click("Next");
  expect(stage().getByRole("heading")).toHaveTextContent("Robot Operation");
  expect(stage().getByRole("button", { name: "Next" })).toBeDisabled();
  await advance(6500);
  const lossTime = screen.getByRole("progressbar").getAttribute("value");
  await advance(10000);
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", lossTime);
  click("Next");
  await advance(6500);
  expect(stage().getByRole("heading")).toHaveTextContent("Fault Detection");
  click("Next");
  expect(stage().getByRole("heading")).toHaveTextContent(
    "Evidence Investigation",
  );
  click("Next");
  expect(stage().getByRole("heading")).toHaveTextContent(
    "Diagnosis and Next Checks",
  );
  click("Next");
  expect(stage().getByRole("heading")).toHaveTextContent("Maintenance Handoff");
  expect(stage().getByRole("button", { name: "Next" })).toBeDisabled();
  expect(
    stage().getByRole("button", { name: "Create maintenance ticket" }),
  ).toBeEnabled();
  const t = screen.getByRole("progressbar").getAttribute("value");
  for (let i = 0; i < 3; i++) {
    click("Previous");
    click("Next");
    click("Replay narration");
  }
  click("Pause demo");
  await advance(10000);
  click("Resume demo");
  fireEvent.change(stage().getByLabelText("Playback mode"), {
    target: { value: "automatic" },
  });
  await advance(30000);
  expect(stage().getByRole("heading")).toHaveTextContent("Maintenance Handoff");
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", t);
  expect(h.posts()).toHaveLength(0);
  const diagnosis = h.fetchMock.mock.calls.filter((c) =>
    String(c[0]).endsWith("/diagnose"),
  );
  expect(diagnosis).toHaveLength(1);
  const payload = JSON.parse(diagnosis[0][1].body);
  expect(payload.samples).toHaveLength(11);
  expect(payload).not.toHaveProperty("scenario");
  click("Exit walkthrough");
  click("Start Guided Demo");
  await advance(10000);
  expect(h.posts()).toHaveLength(0);
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
});
it.each([true, false])(
  "Automatic progresses with muted/unavailable speech (voice=%s), stops at Stage 6 and writes no tickets",
  async (voices) => {
    const h = setup(undefined, false, voices);
    click("Start Guided Demo");
    if (voices) click("Mute narration");
    fireEvent.change(stage().getByLabelText("Playback mode"), {
      target: { value: "automatic" },
    });
    await advance(4000);
    await advance(6500);
    await advance(4000);
    await advance(6500);
    for (let i = 0; i < 3; i++) await advance(4000);
    expect(stage().getByRole("heading")).toHaveTextContent(
      "Maintenance Handoff",
    );
    await advance(30000);
    expect(h.posts()).toHaveLength(0);
    expect(
      h.fetchMock.mock.calls.filter((c) => String(c[0]).endsWith("/diagnose")),
    ).toHaveLength(1);
  },
);
it("pending/failed diagnosis blocks both modes; restart rejects a stale run result", async () => {
  let resolve!: (value: unknown) => void;
  const h = setup(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  await runToDiagnosis();
  expect(stage().getByRole("button", { name: "Next" })).toBeDisabled();
  fireEvent.change(stage().getByLabelText("Playback mode"), {
    target: { value: "automatic" },
  });
  await advance(10000);
  expect(stage().getByRole("heading")).toHaveTextContent("Fault Detection");
  click("Reset demo");
  await act(async () => resolve(response(computed)));
  expect(screen.queryByRole("heading", { name: "Dropped object" })).toBeNull();
  expect(stage().getByRole("heading")).toHaveTextContent("Introduction");
  expect(h.posts()).toHaveLength(0);
});
it("failed diagnosis is truthful and never retried automatically", async () => {
  const h = setup(async () => {
    throw new Error("offline");
  });
  await runToDiagnosis();
  expect(stage().getByRole("status")).toHaveTextContent(
    "Diagnosis unavailable",
  );
  fireEvent.change(stage().getByLabelText("Playback mode"), {
    target: { value: "automatic" },
  });
  await advance(30000);
  expect(stage().getByRole("button", { name: "Next" })).toBeDisabled();
  expect(h.fetchMock).toHaveBeenCalledTimes(1);
  expect(h.posts()).toHaveLength(0);
});
it("hidden tabs pause the whole run until explicit Resume; history navigation exits", async () => {
  const h = setup();
  click("Start Guided Demo");
  click("Next");
  await advance(1000);
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  const t = screen.getByRole("progressbar").getAttribute("value");
  await advance(20000);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  await advance(5000);
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", t);
  expect(stage().getByRole("button", { name: "Resume demo" })).toBeEnabled();
  click("Resume demo");
  await advance(1000);
  expect(screen.getByRole("progressbar").getAttribute("value")).not.toBe(t);
  act(() => window.dispatchEvent(new PopStateEvent("popstate")));
  expect(screen.queryByRole("region", { name: "Guided Demo" })).toBeNull();
  expect(h.posts()).toHaveLength(0);
});
it("Diagnostics exits consistently, preserving available results and allowing the unchanged manual form", async () => {
  const h = setup();
  await runToDiagnosis();
  click("Diagnostics");
  expect(screen.queryByRole("region", { name: "Guided Demo" })).toBeNull();
  click("Create maintenance ticket");
  await act(async () => {
    await import("./Maintenance");
  });
  fireEvent.change(screen.getByLabelText("Title", { exact: true }), {
    target: { value: "Manual review" },
  });
  fireEvent.change(screen.getByLabelText("Description", { exact: true }), {
    target: { value: "Operator draft" },
  });
  await advance(20000);
  expect(h.posts()).toHaveLength(0);
  click("Create ticket");
  await act(async () => {});
  expect(h.posts()).toHaveLength(1);
  expect(JSON.parse(h.posts()[0][1].body)).not.toHaveProperty("request_id");
  expect(
    screen.getByRole("region", { name: "Ticket details" }),
  ).toHaveTextContent("T-manual");
  fireEvent.change(
    screen.getByLabelText("Repair note / operator observation"),
    { target: { value: "Keep this repair draft" } },
  );
  await advance(30000);
  expect(
    screen.getByLabelText("Repair note / operator observation"),
  ).toHaveValue("Keep this repair draft");
  expect(h.posts()).toHaveLength(1);
});
it("unavailable evidence shows a truthful fallback without blocking diagnosis-based stages", async () => {
  const h = setup(async () =>
    response({ ...computed, observations: [], timeline: [] }),
  );
  await runToDiagnosis();
  click("Next");
  expect(
    stage().getByText(/Expected evidence reference unavailable/),
  ).toBeVisible();
  click("Next");
  click("Next");
  expect(stage().getByRole("heading")).toHaveTextContent("Maintenance Handoff");
  expect(h.posts()).toHaveLength(0);
});

it("manual Start is clearly labelled during the guide and preserves takeover without rewinding", async () => {
  const h = setup();
  click("Start Guided Demo");
  const manual = screen.getByRole("button", {
    name: "Start manually (exit walkthrough)",
  });
  expect(manual).not.toHaveClass("primary");
  expect(
    screen.getByRole("button", { name: "Walkthrough controls" }),
  ).toHaveClass("primary");
  expect(stage().getByRole("button", { name: "Next" })).toHaveClass("primary");
  click("Next");
  await advance(6500);
  const time = Number(screen.getByRole("progressbar").getAttribute("value"));
  fireEvent.click(manual);
  expect(screen.queryByRole("region", { name: "Guided Demo" })).toBeNull();
  expect(screen.getByRole("button", { name: "Start" })).toHaveClass("primary");
  await advance(500);
  expect(
    Number(screen.getByRole("progressbar").getAttribute("value")),
  ).toBeGreaterThan(time);
  expect(h.posts()).toHaveLength(0);
});
