// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Maintenance, { type Detail } from "./Maintenance";
import computed from "../../fixtures/guide-diagnosis.json";
import {
  collectTicketReport,
  downloadTicketReport,
  reportMarkdown,
} from "./ticketReports";

function saved(count = 1) {
  const history = Array.from({ length: count }, (_, i) => ({
    seq: i * 3 + 1,
    ticket_id: "T-report",
    at: "2026-11-01T00:00:00Z",
    kind: i ? "note" : "created",
    body: `Saved note ${i} λ 漢字`,
    version: i + 1,
  }));
  const detail = {
    ticket: {
      id: "T-report",
      equipment_id: "R-01",
      diagnosis_id: computed.id,
      title: "Saved incident λ",
      description: "Persisted investigation",
      status: "Open",
      version: count,
      resolution_notes: "Saved resolution",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
      creation_note: "PRIVATE-TRIGGER",
    },
    diagnosis: structuredClone(computed),
    history: history.slice(0, 200),
    history_total: count,
    history_last_seq: history.at(-1)!.seq,
    ...(count > 200 ? { history_next_seq: history[199].seq } : {}),
  };
  const registry = [
    {
      id: "R-01",
      name: "Saved Robot λ",
      description: "Simulated cell",
      status: "Operational",
      ticket_count: 1,
      database_url: "PRIVATE-CONNECTION",
    },
  ];
  let reads = 0;
  const hooks = {
    page: (rows: typeof history, next: number | null) => ({
      history: rows,
      next_seq: next,
    }),
    detail: (value: typeof detail, _read: number) => value,
    fail: false,
  };
  const fetchMock = vi.fn().mockImplementation(async (url, init) => {
    expect(init.method).toBe("GET");
    const path = String(url);
    let value: unknown;
    if (path.endsWith("/equipment")) value = registry;
    else if (path.includes("/history?")) {
      if (hooks.fail)
        return {
          ok: false,
          status: 503,
          json: async () => ({ detail: "Storage unavailable" }),
        };
      const after = Number(path.split("after_seq=")[1]);
      const remaining = history.filter((row) => row.seq > after);
      const page = remaining.slice(0, 200);
      value = hooks.page(
        page,
        remaining.length > 200 ? page.at(-1)!.seq : null,
      );
    } else if (path.endsWith("/tickets/T-report"))
      value = hooks.detail(structuredClone(detail), ++reads);
    else value = [detail.ticket];
    return { ok: true, json: async () => structuredClone(value) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return { detail, history, registry, hooks, fetchMock };
}
function downloads() {
  const create = vi.fn().mockReturnValue("blob:test-report");
  const revoke = vi.fn();
  // Fetch mocks use string paths, so no URL parsing is needed in this unit suite.
  vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
  const names: string[] = [];
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
  return { create, revoke, click, names };
}
async function text(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("downloads complete saved diagnosis/evidence and all 450 history events, with public fields only", async () => {
  const data = saved(450);
  const files = downloads();
  const report = await collectTicketReport("T-report");
  expect(report.diagnosis).toEqual(computed);
  expect(report.history).toHaveLength(450);
  expect(new Set(report.history.map((row) => row.seq)).size).toBe(450);
  expect(report.history.at(-1)!.body).toBe("Saved note 449 λ 漢字");
  expect(
    data.fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/history?"),
    ),
  ).toHaveLength(2);
  downloadTicketReport(report, "json");
  const blob = files.create.mock.calls[0][0] as Blob;
  expect(blob.type).toBe("application/json;charset=utf-8");
  const output = await text(blob);
  expect(JSON.parse(output).diagnosis).toEqual(computed);
  expect(output).not.toMatch(/PRIVATE-|creation_note|database_url|ticket_id/);
  expect(JSON.parse(output).history[0]).not.toHaveProperty("version");
  expect(report.record_state).toContain("Unsaved edits");
  expect(files.names[0]).toBe("maintainai-T-report-v450.json");
  expect(document.querySelector("a[download]")).toBeNull();
  await waitFor(
    () => expect(files.revoke).toHaveBeenCalledWith("blob:test-report"),
    { timeout: 2000 },
  );
});

it("fails a continuation request instead of creating a partial download", async () => {
  const data = saved(250);
  const files = downloads();
  data.hooks.fail = true;
  await expect(collectTicketReport("T-report")).rejects.toThrow(
    "Storage unavailable",
  );
  expect(files.create).not.toHaveBeenCalled();
});

it.each([
  "duplicate",
  "missing",
  "early end",
  "missing cursor",
  "repeated cursor",
  "wrong ticket",
  "empty",
])("rejects an incomplete or invalid continuation: %s", async (mode) => {
  const data = saved(450);
  data.hooks.page = (rows, next) => {
    if (mode === "duplicate") rows[0].seq = data.history[199].seq;
    if (mode === "missing") rows.splice(3, 1);
    if (mode === "early end") next = null;
    if (mode === "missing cursor") next = undefined as unknown as null;
    if (mode === "repeated cursor") next = data.history[199].seq;
    if (mode === "wrong ticket") rows[0].ticket_id = "T-other";
    if (mode === "empty") rows = [];
    return { history: rows, next_seq: next };
  };
  await expect(collectTicketReport("T-report")).rejects.toThrow(
    "incomplete or changed",
  );
});

it.each(["version", "ticket content", "history bounds", "equipment"])(
  "detects concurrent changes to %s before download",
  async (mode) => {
    const data = saved(250);
    data.hooks.detail = (value, read) => {
      if (read === 2) {
        if (mode === "version") value.ticket.version++;
        if (mode === "ticket content") value.ticket.title = "Changed";
        if (mode === "history bounds") value.history_total++;
        if (mode === "equipment") data.registry[0].name = "Changed Robot";
      }
      return value;
    };
    await expect(collectTicketReport("T-report")).rejects.toThrow(
      "incomplete or changed",
    );
  },
);

it("supports Unicode manual tickets without a diagnosis and labels saved records", async () => {
  const data = saved();
  data.detail.ticket.diagnosis_id = null as unknown as string;
  data.detail.diagnosis = null as unknown as typeof computed;
  const report = await collectTicketReport("T-report");
  expect(report.diagnosis).toBeNull();
  expect(reportMarkdown(report)).toContain(
    "Manual ticket — no diagnosis linked",
  );
  expect(reportMarkdown(report)).toContain("Saved Robot λ");
  expect(reportMarkdown(report)).toContain("Saved records only");
});

it("escapes Markdown/HTML/link syntax and safely fences all original diagnosis evidence", async () => {
  const data = saved();
  data.detail.ticket.description =
    "<script>alert(1)</script>\n# forged\n[click](javascript:alert(1))\n```";
  data.detail.diagnosis.hypotheses[0].check +=
    " ```` <img src=x onerror=alert(1)>";
  const report = await collectTicketReport("T-report");
  const markdown = reportMarkdown(report);
  expect(markdown).toContain("&lt;script&gt;alert\\(1\\)&lt;/script&gt;");
  expect(markdown).toContain("> \\# forged");
  expect(markdown).toContain("\\[click\\]\\(javascript:alert\\(1\\)\\)");
  expect(markdown).toContain("`````json");
  expect(markdown).toContain(JSON.stringify(data.detail.diagnosis, null, 2));
  const files = downloads();
  downloadTicketReport(report, "markdown");
  expect(await text(files.create.mock.calls[0][0])).toBe(markdown);
  expect(files.names[0]).toBe("maintainai-T-report-v1.md");
});

it("refuses unsupported secret fields in diagnostic trees without discarding evidence", async () => {
  const data = saved();
  Object.assign(data.detail.diagnosis.timeline[0], { password: "PRIVATE" });
  await expect(collectTicketReport("T-report")).rejects.toThrow(
    "incomplete or changed",
  );
});

it("refuses oversized complete reports without truncation", async () => {
  const data = saved();
  data.detail.history_total = 10001;
  await expect(collectTicketReport("T-report")).rejects.toThrow(
    "browser download limit",
  );
});

it("preserves every unsaved form draft and status while exporting saved records", async () => {
  saved(250);
  const files = downloads();
  render(
    <Maintenance
      initialTicketId="T-report"
      diagnosis={null}
      fromDiagnosis={false}
      runContext=""
      onReturn={() => {}}
    />,
  );
  await screen.findByRole("button", { name: "Download JSON" });
  fireEvent.change(screen.getByLabelText("Title", { exact: true }), {
    target: { value: "Unsaved new ticket" },
  });
  fireEvent.change(screen.getByLabelText("Description", { exact: true }), {
    target: { value: "Unsaved description" },
  });
  fireEvent.change(
    screen.getByLabelText("Repair note / operator observation"),
    { target: { value: "Unsaved repair" } },
  );
  fireEvent.change(screen.getByLabelText("Ticket status", { exact: true }), {
    target: { value: "Resolved" },
  });
  fireEvent.change(screen.getByLabelText("Resolution notes"), {
    target: { value: "Unsaved resolution" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
  await waitFor(() => expect(files.create).toHaveBeenCalledOnce());
  const output = await text(files.create.mock.calls[0][0]);
  expect(output).not.toMatch(
    /Unsaved new ticket|Unsaved description|Unsaved repair|Unsaved resolution/,
  );
  expect(JSON.parse(output).ticket.status).toBe("Open");
  for (const [label, value] of [
    ["Title", "Unsaved new ticket"],
    ["Description", "Unsaved description"],
    ["Repair note / operator observation", "Unsaved repair"],
    ["Resolution notes", "Unsaved resolution"],
    ["Ticket status", "Resolved"],
  ])
    expect(screen.getByLabelText(label, { exact: true })).toHaveValue(value);
});

it("keeps repair drafts and offers safe retry after a failed continuation", async () => {
  const data = saved(250);
  const files = downloads();
  data.hooks.fail = true;
  render(
    <Maintenance
      initialTicketId="T-report"
      diagnosis={null}
      fromDiagnosis={false}
      runContext=""
      onReturn={() => {}}
    />,
  );
  await screen.findByRole("button", { name: "Download Markdown" });
  fireEvent.change(
    screen.getByLabelText("Repair note / operator observation"),
    { target: { value: "Keep this draft" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Download Markdown" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No partial file");
  expect(files.create).not.toHaveBeenCalled();
  data.hooks.fail = false;
  fireEvent.click(screen.getByRole("button", { name: "Download Markdown" }));
  await waitFor(() => expect(files.create).toHaveBeenCalledOnce());
  expect(
    screen.getByLabelText("Repair note / operator observation"),
  ).toHaveValue("Keep this draft");
});

it("discards a late export when its ticket view unmounts", async () => {
  const data = saved(250);
  const files = downloads();
  let release: () => void = () => {};
  const deferred = new Promise<void>((resolve) => {
    release = resolve;
  });
  const original = data.fetchMock.getMockImplementation()!;
  data.fetchMock.mockImplementation(async (url, init) => {
    if (String(url).includes("/history?")) await deferred;
    return original(url, init);
  });
  const view = render(
    <Maintenance
      initialTicketId="T-report"
      diagnosis={null}
      fromDiagnosis={false}
      runContext=""
      onReturn={() => {}}
    />,
  );
  await screen.findByRole("button", { name: "Download JSON" });
  fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
  await screen.findByText("Preparing complete saved report…");
  view.unmount();
  release();
  await waitFor(() =>
    expect(
      data.fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith("/tickets/T-report"),
      ).length,
    ).toBe(3),
  );
  expect(files.create).not.toHaveBeenCalled();
});
