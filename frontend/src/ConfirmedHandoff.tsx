import { useLayoutEffect, useRef } from "react";
import type { Handoff, Preview, Attempt } from "./useConfirmedHandoff";
export function AttemptStatus({ attempt }: { attempt: Attempt }) {
  return (
    <div role="status" className={`handoff-status handoff-${attempt.phase}`}>
      <strong>
        {attempt.phase === "submitting"
          ? "Submitting confirmed request…"
          : attempt.phase === "success"
            ? `Ticket saved: ${attempt.ticketId}`
            : attempt.phase === "rejected"
              ? "Server rejected this request"
              : "Uncertain outcome — ticket may have been saved"}
      </strong>
      <p>
        {attempt.preview.run} · Diagnosis {attempt.body.diagnosis_id}
      </p>
      {attempt.message && <p>{attempt.message}</p>}
      {attempt.phase === "uncertain" && (
        <p>
          Do not start another submission. Review this request to reconcile
          using exactly the same attempt ID and payload. A network error does
          not prove failure. Keep this page open: attempt recovery after a
          browser reload is not supported.
        </p>
      )}
      <p>Attempt reference: {attempt.body.request_id}</p>
    </div>
  );
}
function Essential({ preview }: { preview: Preview }) {
  return (
    <dl className="handoff-fields">
      <dt>Equipment</dt>
      <dd>{preview.body.equipment_id} · Simulated workcell</dd>
      <dt>Run</dt>
      <dd>{preview.run}</dd>
      <dt>Diagnosis</dt>
      <dd>{preview.body.diagnosis_id}</dd>
      <dt>Title</dt>
      <dd>{preview.body.title}</dd>
      <dt>Description</dt>
      <dd>{preview.body.description}</dd>
      <dt>Proposed initial status</dt>
      <dd>Open · no repair or verification recorded</dd>
    </dl>
  );
}
export function HandoffPreview({
  handoff,
  issue,
  onView,
}: {
  handoff: Handoff;
  issue: string;
  onView: (id: string) => void;
}) {
  const { preview, attempt } = handoff;
  return (
    <section
      data-guide-target="maintenance-handoff"
      tabIndex={-1}
      aria-label="Maintenance handoff preview"
      className="handoff-preview"
    >
      <p>
        <strong>Review the maintenance handoff</strong>
      </p>
      {preview ? (
        <>
          <Essential preview={preview} />
          <details>
            <summary>
              Recorded evidence, candidate explanations and limitations
            </summary>
            <p>
              Observed outcome:{" "}
              {preview.diagnosis.failure ?? preview.diagnosis.status}.{" "}
              {preview.diagnosis.summary}
            </p>
            {preview.diagnosis.observations.map((o, i) => (
              <p key={i}>
                Observation: {o.text} · References:{" "}
                {o.evidence.join(", ") || "unavailable"}
              </p>
            ))}
            {preview.diagnosis.hypotheses.map((h, i) => (
              <div key={i}>
                <p>Candidate explanation: {h.cause}</p>
                <p>
                  Supporting references:{" "}
                  {h.support.join(", ") || "none returned"}. Contradicting
                  references: {h.contradiction.join(", ") || "none returned"}.
                </p>
                <p>Recommended verification: {h.check}</p>
              </div>
            ))}
            <p>
              Uncertainty: {preview.diagnosis.status}.{" "}
              {preview.diagnosis.ranking_basis}
            </p>
            {preview.diagnosis.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
            <p>
              These are simulated observations and backend candidates, not
              completed inspections or confirmed repairs. Full evidence remains
              linked through the immutable diagnosis.
            </p>
          </details>
        </>
      ) : (
        <p>{issue || "No valid current-run handoff is available."}</p>
      )}
      {attempt ? (
        <>
          <AttemptStatus attempt={attempt} />
          {attempt.phase === "success" ? (
            <button onClick={() => onView(attempt.ticketId!)}>
              View saved ticket
            </button>
          ) : (
            attempt.phase !== "submitting" && (
              <button onClick={() => handoff.review(attempt)}>
                Review confirmed request
              </button>
            )
          )}
        </>
      ) : (
        <p>
          No maintenance ticket has been saved by this walkthrough. Creating one
          requires a separate explicit confirmation.
        </p>
      )}
      {attempt?.phase !== "success" && (
        <button disabled={!handoff.canCreate} onClick={handoff.open}>
          Create maintenance ticket
        </button>
      )}
      {!handoff.canCreate && !attempt && preview && (
        <p>
          Confirmation is unavailable in this browser or an earlier request
          remains unresolved.
        </p>
      )}
    </section>
  );
}
export function HandoffNotice({
  handoff,
  onView,
}: {
  handoff: Handoff;
  onView: (id: string) => void;
}) {
  const attempt = handoff.notice;
  if (!attempt) return null;
  return (
    <aside aria-label="Confirmed handoff request" className="handoff-notice">
      <AttemptStatus attempt={attempt} />
      {attempt.phase === "success" ? (
        <button onClick={() => onView(attempt.ticketId!)}>
          Open confirmed ticket
        </button>
      ) : (
        attempt.phase !== "submitting" && (
          <button onClick={() => handoff.review(attempt)}>
            Review retained request
          </button>
        )
      )}
    </aside>
  );
}
export function HandoffConfirmation({ handoff }: { handoff: Handoff }) {
  const ref = useRef<HTMLDialogElement>(null);
  const confirmation = handoff.confirmation;
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!confirmation || !dialog) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>("[data-cancel]")?.focus();
    return () => {
      if (dialog.open) dialog.close();
      // React can remove the dialog before native close restores focus.
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [confirmation]);
  if (!confirmation) return null;
  return (
    <dialog
      ref={ref}
      aria-labelledby="handoff-confirm-title"
      aria-describedby="handoff-confirm-warning"
      onCancel={(e) => {
        e.preventDefault();
        handoff.cancel();
      }}
      onClose={() => {
        if (!ref.current?.open) handoff.cancel();
      }}
      className="handoff-dialog"
    >
      <h2 id="handoff-confirm-title">
        {confirmation.retry
          ? "Review confirmed request"
          : "Confirm maintenance handoff"}
      </h2>
      <p id="handoff-confirm-warning">
        {confirmation.retry
          ? "This will resend the original confirmed payload with exactly the same attempt identifier. The existing backend returns that ticket if already saved, or creates it if absent. It does not authorize a new ticket identity."
          : "Confirming creates a persistent shared maintenance record. It does not record a repair or completed operator check."}
      </p>
      {confirmation.issue && <p role="alert">{confirmation.issue}</p>}
      <Essential preview={confirmation.preview} />
      <div className="handoff-dialog-actions">
        <button data-cancel onClick={handoff.cancel}>
          Cancel
        </button>
        <button onClick={handoff.confirm}>
          {confirmation.retry
            ? "Reconcile confirmed attempt"
            : "Confirm ticket creation"}
        </button>
      </div>
    </dialog>
  );
}
