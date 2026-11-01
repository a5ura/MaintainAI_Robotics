import { api } from "./api";
import type { Detail, Equipment, Ticket } from "./Maintenance";
import type { Diagnosis } from "./model";

export type ReportFormat = "json" | "markdown";
type History = { seq: number; at: string; kind: string; body: string };
export type TicketReport = {
  schema_version: 1;
  exported_at: string;
  record_state: string;
  provenance: { simulation: string; diagnostics: string };
  ticket: Ticket;
  equipment: Omit<Equipment, "ticket_count">;
  diagnosis: Diagnosis | null;
  history_total: number;
  history: History[];
};
// Fail explicitly instead of truncating a report or exhausting browser memory.
const MAX_EVENTS = 10000;
const MAX_BYTES = 32 * 1024 * 1024;
const invalid = () =>
  new Error(
    "Saved records are incomplete or changed. Please retry the download.",
  );
const tooLarge = () =>
  new Error(
    "This complete report exceeds the browser download limit (10,000 events / 32 MiB).",
  );
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw invalid();
  return value as Record<string, unknown>;
}
function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function strings(value: Record<string, unknown>, keys: string[]) {
  if (keys.some((key) => typeof value[key] !== "string")) throw invalid();
  return Object.fromEntries(keys.map((key) => [key, value[key]]));
}
function ticket(value: unknown, id: string): Ticket {
  const row = object(value);
  const fields = strings(row, [
    "id",
    "equipment_id",
    "title",
    "description",
    "status",
    "resolution_notes",
    "created_at",
    "updated_at",
  ]);
  if (
    row.id !== id ||
    !integer(row.version) ||
    !["Open", "In Progress", "Resolved"].includes(String(row.status)) ||
    !(row.diagnosis_id === null || typeof row.diagnosis_id === "string")
  )
    throw invalid();
  return {
    ...fields,
    version: row.version,
    diagnosis_id: row.diagnosis_id,
  } as Ticket;
}
function diagnosis(value: unknown, id: string | null): Diagnosis | null {
  if (id === null) {
    if (value !== null) throw invalid();
    return null;
  }
  const row = object(value);
  const keys = new Set([
    "id",
    "status",
    "failure",
    "summary",
    "observations",
    "hypotheses",
    "timeline",
    "warnings",
    "ranking_basis",
    "anomalies",
  ]);
  if (
    row.id !== id ||
    Object.keys(row).some((key) => !keys.has(key)) ||
    typeof row.summary !== "string" ||
    typeof row.status !== "string" ||
    typeof row.ranking_basis !== "string" ||
    !(row.failure === null || typeof row.failure === "string") ||
    ["observations", "hypotheses", "timeline", "warnings"].some(
      (key) => !Array.isArray(row[key]),
    )
  )
    throw invalid();
  // Preserve the entire saved diagnostic tree, including extended telemetry,
  // anomalies, observations, checks and FK. Reject unexpected secret/internal
  // fields rather than silently dropping any diagnostic evidence.
  function publicTree(node: unknown) {
    if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node)) {
        if (
          /^(password|passwd|secret|token|database_url|connection_string|creation_note|last_note|last_status_note|__proto__|constructor|prototype)$/i.test(
            key,
          )
        )
          throw invalid();
        publicTree(child);
      }
    }
  }
  publicTree(row);
  return structuredClone(row) as Diagnosis;
}
function bounds(detail: Detail) {
  if (!integer(detail.history_total) || !integer(detail.history_last_seq))
    throw invalid();
  if (detail.history_total > MAX_EVENTS) throw tooLarge();
  return { total: detail.history_total, last: detail.history_last_seq };
}
function equipment(rows: Equipment[], id: string): TicketReport["equipment"] {
  if (!Array.isArray(rows)) throw invalid();
  const matches = rows.filter((row) => row.id === id);
  if (matches.length !== 1) throw invalid();
  return strings(object(matches[0]), [
    "id",
    "name",
    "description",
    "status",
  ]) as TicketReport["equipment"];
}
function bytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}
function equal(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function collectTicketReport(id: string): Promise<TicketReport> {
  const path = `/tickets/${encodeURIComponent(id)}`;
  const [initial, registry] = await Promise.all([
    api<Detail>(path),
    api<Equipment[]>("/equipment"),
  ]);
  const savedTicket = ticket(initial.ticket, id);
  const savedDiagnosis = diagnosis(initial.diagnosis, savedTicket.diagnosis_id);
  const savedEquipment = equipment(registry, savedTicket.equipment_id);
  const expected = bounds(initial);
  const history: History[] = [];
  let size = bytes(savedDiagnosis) + bytes(savedTicket) + bytes(savedEquipment);
  function append(rows: Detail["history"]) {
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 200)
      throw invalid();
    for (const value of rows) {
      const row = object(value);
      if (
        !integer(row.seq) ||
        row.seq <= (history.at(-1)?.seq ?? 0) ||
        row.seq > expected.last ||
        (row.ticket_id !== undefined && row.ticket_id !== id)
      )
        throw invalid();
      const item = {
        seq: row.seq,
        ...strings(row, ["at", "kind", "body"]),
      } as History;
      history.push(item);
      size += bytes(item);
      if (history.length > expected.total) throw invalid();
      if (size > MAX_BYTES) throw tooLarge();
    }
  }
  if (size > MAX_BYTES) throw tooLarge();
  append(initial.history);
  const firstPage = [...history];
  let cursor = initial.history_next_seq;
  while (cursor !== undefined && cursor !== null) {
    if (
      !integer(cursor) ||
      cursor !== history.at(-1)?.seq ||
      history.length >= expected.total
    )
      throw invalid();
    const page = await api<{
      history: Detail["history"];
      next_seq: number | null;
    }>(`${path}/history?after_seq=${cursor}`);
    append(page.history);
    if (page.next_seq !== null && !integer(page.next_seq)) throw invalid();
    cursor = page.next_seq ?? undefined;
  }
  if (
    history.length !== expected.total ||
    history.at(-1)?.seq !== expected.last
  )
    throw invalid();
  // History is append-only through the API, and every update increments version.
  // Recheck before making any file: never mix records from concurrent versions.
  const [final, registryAfter] = await Promise.all([
    api<Detail>(path),
    api<Equipment[]>("/equipment"),
  ]);
  if (
    !equal(ticket(final.ticket, id), savedTicket) ||
    !equal(bounds(final), expected) ||
    !equal(
      diagnosis(final.diagnosis, savedTicket.diagnosis_id),
      savedDiagnosis,
    ) ||
    !equal(equipment(registryAfter, savedTicket.equipment_id), savedEquipment)
  )
    throw invalid();
  // Verify the first page too, without trusting incidental trigger/private fields.
  const finalFirst = final.history.map((row) => ({
    seq: row.seq,
    ...strings(object(row), ["at", "kind", "body"]),
  }));
  if (
    !equal(finalFirst, firstPage) ||
    final.history_next_seq !== initial.history_next_seq
  )
    throw invalid();
  return {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    record_state: "Saved records only. Unsaved edits and drafts are excluded.",
    provenance: {
      simulation:
        "Robot, controller, ROS-style/system logs, sensors and verification are simulated V1 evidence, not physical robot telemetry.",
      diagnostics:
        "Diagnoses are computed from saved evidence by deterministic rules. Root-cause candidates are hypotheses, not proven causes or calibrated probabilities.",
    },
    ticket: savedTicket,
    equipment: savedEquipment,
    diagnosis: savedDiagnosis,
    history_total: history.length,
    history,
  };
}

// Quote arbitrary user text as literal Markdown, never raw HTML or link syntax.
function quoteText(value: unknown) {
  return String(value)
    .split(/\r?\n/)
    .map(
      (line) =>
        "> " +
        line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/[\\`*_{}\[\]()#+.!|~=-]/g, "\\$&")
          .replace(
            /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
            (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`,
          ),
    )
    .join("\n");
}
export function reportMarkdown(report: TicketReport): string {
  const { ticket: t, diagnosis: d } = report;
  const lines = [
    "# MaintainAI Robotics — saved maintenance report",
    "",
    report.record_state,
    "",
    `Exported: ${report.exported_at}`,
    "",
    "## Provenance",
    "",
    report.provenance.simulation,
    "",
    report.provenance.diagnostics,
    "",
    "## Saved ticket",
    "",
  ];
  for (const [key, value] of Object.entries(t))
    lines.push(`### ${key}`, "", quoteText(value ?? "None"), "");
  lines.push("## Saved equipment", "");
  for (const [key, value] of Object.entries(report.equipment))
    lines.push(`### ${key}`, "", quoteText(value), "");
  lines.push("## Diagnosis and root-cause candidates", "");
  if (d) {
    lines.push(
      quoteText(d.summary),
      "",
      "### Ranking basis",
      "",
      quoteText(d.ranking_basis),
      "",
    );
    for (const h of d.hypotheses)
      lines.push(
        "### Candidate",
        "",
        quoteText(h.cause),
        "",
        "Supports:",
        "",
        quoteText(h.support.join(", ") || "None"),
        "",
        "Contradicts:",
        "",
        quoteText(h.contradiction.join(", ") || "None"),
        "",
        "Recommended check:",
        "",
        quoteText(h.check),
        "",
      );
  } else lines.push("Manual ticket — no diagnosis linked.", "");
  lines.push(
    `## Complete maintenance history (${report.history_total} events)`,
    "",
  );
  for (const h of report.history)
    lines.push(
      `### Event ${h.seq}`,
      "",
      quoteText(`${h.at} · ${h.kind}`),
      "",
      quoteText(h.body),
      "",
    );
  if (d) {
    const json = JSON.stringify(d, null, 2);
    // A user-supplied backtick run cannot close this code block and inject HTML.
    let length = 3;
    for (const match of json.matchAll(/`+/g))
      length = Math.max(length, match[0].length + 1);
    const fence = "`".repeat(length);
    lines.push(
      "## Complete saved diagnosis and evidence (JSON)",
      "",
      `${fence}json`,
      json,
      fence,
      "",
    );
  }
  return lines.join("\n");
}
export function downloadTicketReport(
  report: TicketReport,
  format: ReportFormat,
) {
  const content =
    format === "json"
      ? JSON.stringify(report, null, 2) + "\n"
      : reportMarkdown(report);
  const blob = new Blob([content], {
    type:
      format === "json"
        ? "application/json;charset=utf-8"
        : "text/markdown;charset=utf-8",
  });
  if (blob.size > MAX_BYTES) throw tooLarge();
  const url = URL.createObjectURL(blob);
  const revoke = URL.revokeObjectURL.bind(URL);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `maintainai-${report.ticket.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}-v${report.ticket.version}.${format === "json" ? "json" : "md"}`;
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => revoke(url), 1000);
  }
}
