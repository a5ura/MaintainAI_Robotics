import { useEffect, useState } from "react";
import { api } from "./api";
import { EvidenceReferences } from "./EvidenceReferences";
import type { Diagnosis } from "./model";
export type Equipment = {
  id: string;
  name: string;
  description: string;
  status: string;
  ticket_count: number;
};
export type Ticket = {
  id: string;
  equipment_id: string;
  diagnosis_id: string | null;
  title: string;
  description: string;
  status: "Open" | "In Progress" | "Resolved";
  version: number;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
};
export type Detail = {
  ticket: Ticket;
  diagnosis: Diagnosis | null;
  history: { seq: number; at: string; kind: string; body: string }[];
};
export default function Maintenance({
  diagnosis,
  fromDiagnosis,
  runContext,
  onReturn,
  initialTicketId,
}: {
  initialTicketId?: string;
  diagnosis: Diagnosis | null;
  fromDiagnosis: boolean;
  runContext: string;
  onReturn: () => void;
}) {
  const [equipment, setEquipment] = useState<Equipment[]>([]),
    [tickets, setTickets] = useState<Ticket[]>([]),
    [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState(fromDiagnosis && !!diagnosis?.id),
    [equipmentId, setEquipmentId] = useState("R-01");
  const [title, setTitle] = useState(
      fromDiagnosis ? (diagnosis?.failure ?? "Cycle investigation") : "",
    ),
    [description, setDescription] = useState(
      fromDiagnosis ? `${diagnosis?.summary ?? ""}\n${runContext}` : "",
    );
  const [status, setStatus] = useState<Ticket["status"]>("Open"),
    [note, setNote] = useState(""),
    [resolution, setResolution] = useState("");
  async function refresh() {
    const [e, t] = await Promise.all([
      api<Equipment[]>("/equipment"),
      api<Ticket[]>("/tickets"),
    ]);
    setEquipment(e);
    setTickets(t);
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Equipment[]>("/equipment"),
      api<Ticket[]>("/tickets"),
      initialTicketId
        ? api<Detail>(`/tickets/${initialTicketId}`)
        : Promise.resolve(null),
    ])
      .then(([e, t, d]) => {
        if (active) {
          setEquipment(e);
          setTickets(t);
          if (d) select(d);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialTicketId]);
  function select(d: Detail) {
    setDetail(d);
    setStatus(d.ticket.status);
    setNote("");
    setResolution("");
  }
  async function perform(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  function open(id: string) {
    void perform(async () => select(await api<Detail>(`/tickets/${id}`)));
  }
  function prepare(link: boolean) {
    setLinked(link);
    setTitle(link ? (diagnosis?.failure ?? "Cycle investigation") : "");
    setDescription(link ? `${diagnosis?.summary ?? ""}\n${runContext}` : "");
  }
  return (
    <main className="maintenance" id="main-content" tabIndex={-1}>
      <div className="eyebrow">MAINTENANCE / LOCAL DURABLE RECORDS</div>
      <div className="title-row">
        <div>
          <h1>From evidence to action.</h1>
          <p>
            Records are shared by this backend. No login or private visitor
            identity.
          </p>
        </div>
        <button onClick={onReturn}>Return to operations</button>
      </div>
      <p className="storage-notice">
        Development SQLite persists on this machine. Shared cloud storage and
        public deployment are not configured.
      </p>
      {error && (
        <div role="alert" className="error-box">
          <p>{error}</p>
          <button
            disabled={busy}
            onClick={() =>
              void perform(async () => {
                await refresh();
                if (detail)
                  select(await api<Detail>(`/tickets/${detail.ticket.id}`));
              })
            }
          >
            Reload records
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">Loading maintenance records…</p>
      ) : (
        <>
          <section aria-label="Equipment registry" className="equipment-grid">
            {equipment.map((e) => (
              <article key={e.id}>
                <span className="eyebrow">
                  {e.id} / {e.status}
                </span>
                <h2>{e.name}</h2>
                <p>{e.description}</p>
                <small>{e.ticket_count} associated tickets</small>
              </article>
            ))}
          </section>
          <div className="maintenance-layout">
            <section className="maintenance-panel">
              <h2>Incident history</h2>
              <p className="muted">
                Latest 200 records, including seeded incidents.
              </p>
              {tickets.length === 0 && <p>No incidents yet.</p>}
              <ul className="ticket-list">
                {tickets.map((t) => (
                  <li key={t.id}>
                    <button disabled={busy} onClick={() => open(t.id)}>
                      <strong>{t.title}</strong>
                      <span>
                        {t.id} · {t.equipment_id} · {t.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <h2>New maintenance ticket</h2>
              <div className="form-actions">
                <button disabled={busy} onClick={() => prepare(false)}>
                  Manual ticket
                </button>
                {diagnosis?.id && (
                  <button disabled={busy} onClick={() => prepare(true)}>
                    Use current diagnosis
                  </button>
                )}
              </div>
              <form
                aria-label="Create ticket"
                onSubmit={(e) => {
                  e.preventDefault();
                  void perform(async () => {
                    const d = await api<Detail>("/tickets", "POST", {
                      equipment_id: equipmentId,
                      title,
                      description,
                      diagnosis_id: linked ? diagnosis?.id : null,
                    });
                    select(d);
                    setTitle("");
                    setDescription("");
                    await refresh();
                  });
                }}
              >
                <p className="muted">
                  {linked
                    ? "Linked to immutable backend diagnosis " + diagnosis?.id
                    : "Manual incident — no diagnosis linked"}
                </p>
                <label>
                  Equipment
                  <select
                    aria-label="Ticket equipment"
                    disabled={busy}
                    value={equipmentId}
                    onChange={(e) => setEquipmentId(e.target.value)}
                  >
                    {equipment.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.id} · {e.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Title
                  <input
                    required
                    minLength={1}
                    maxLength={120}
                    disabled={busy}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    maxLength={4000}
                    disabled={busy}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <button
                  className="primary"
                  disabled={busy || !title.trim()}
                  type="submit"
                >
                  Create ticket
                </button>
              </form>
            </section>
            <section className="maintenance-panel" aria-label="Ticket details">
              {!detail ? (
                <>
                  <h2>Choose an incident.</h2>
                  <p>
                    Inspect its diagnosis, repair notes, and status history, or
                    create a new ticket from a completed diagnosis.
                  </p>
                </>
              ) : (
                <>
                  <span className="eyebrow">
                    {detail.ticket.id} / VERSION {detail.ticket.version}
                  </span>
                  <h2>{detail.ticket.title}</h2>
                  <p>{detail.ticket.description}</p>
                  <p>
                    Equipment: {detail.ticket.equipment_id} ·{" "}
                    <b>{detail.ticket.status}</b>
                  </p>
                  <p className="muted">
                    Created {detail.ticket.created_at} · Updated{" "}
                    {detail.ticket.updated_at}
                  </p>
                  <form
                    aria-label="Update ticket"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void perform(async () => {
                        const d = await api<Detail>(
                          `/tickets/${detail.ticket.id}`,
                          "PATCH",
                          {
                            expected_version: detail.ticket.version,
                            status,
                            note: note.trim() || null,
                            resolution_notes: resolution.trim() || null,
                          },
                        );
                        select(d);
                        await refresh();
                      });
                    }}
                  >
                    <label>
                      Ticket status
                      <select
                        aria-label="Ticket status"
                        disabled={busy}
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as Ticket["status"])
                        }
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                      </select>
                    </label>
                    <label>
                      Repair note / operator observation
                      <textarea
                        maxLength={2000}
                        disabled={busy}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </label>
                    {status === "Resolved" &&
                      detail.ticket.status !== "Resolved" && (
                        <label>
                          Resolution notes
                          <textarea
                            required
                            maxLength={2000}
                            disabled={busy}
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                          />
                        </label>
                      )}
                    <button
                      type="submit"
                      disabled={
                        busy ||
                        (status === detail.ticket.status && !note.trim())
                      }
                    >
                      Save update
                    </button>
                  </form>
                  {detail.ticket.resolution_notes && (
                    <p>
                      <b>Resolution:</b> {detail.ticket.resolution_notes}
                    </p>
                  )}
                  <h3>CHRONOLOGICAL HISTORY</h3>
                  <ol className="history">
                    {detail.history.map((h) => (
                      <li key={h.seq}>
                        <time>{h.at}</time>
                        <strong>{h.kind}</strong>
                        <p>{h.body}</p>
                      </li>
                    ))}
                  </ol>
                  <details className="snapshot">
                    <summary>
                      Originating diagnosis and evidence snapshot
                    </summary>
                    {detail.diagnosis ? (
                      <>
                        <h3>
                          {detail.diagnosis.failure ?? detail.diagnosis.status}
                        </h3>
                        <p>{detail.diagnosis.summary}</p>
                        <code>{detail.diagnosis.id}</code>
                        {detail.diagnosis.hypotheses.map((h) => (
                          <div key={`${h.anomaly}-${h.cause}`}>
                            <h3>{h.cause}</h3>
                            <EvidenceReferences
                              ids={h.support}
                              timeline={detail.diagnosis!.timeline}
                              label="Supports"
                            />
                            <EvidenceReferences
                              ids={h.contradiction}
                              timeline={detail.diagnosis!.timeline}
                              label="Contradicts"
                            />
                            <p>{h.check}</p>
                          </div>
                        ))}
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>REF/TIME</th>
                                <th>PHASE</th>
                                <th>OBSERVATION</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.diagnosis.timeline.map((row) => (
                                <tr
                                  id={`evidence-${row.id}`}
                                  key={row.id}
                                  tabIndex={-1}
                                >
                                  <td>
                                    {row.id} / {row.t}s
                                  </td>
                                  <td>{row.phase}</td>
                                  <td>
                                    Grip {row.grip_command ? "HOLD" : "RELEASE"}{" "}
                                    · object{" "}
                                    {row.object_present === null
                                      ? "UNKNOWN"
                                      : row.object_present
                                        ? "PRESENT"
                                        : "ABSENT"}{" "}
                                    · {row.pressure_kpa ?? "unknown"} kPa ·{" "}
                                    {row.verification ?? "not sampled"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p>No diagnosis linked to this manual ticket.</p>
                    )}
                  </details>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
