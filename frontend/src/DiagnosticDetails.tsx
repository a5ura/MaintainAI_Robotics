import type { Diagnosis } from "./model";
import { EvidenceReferences } from "./EvidenceReferences";
export default function DiagnosticDetails({
  result,
  busy,
  error,
  onCreateTicket,
}: {
  result: Diagnosis | null;
  busy: boolean;
  error: string;
  onCreateTicket: () => void;
}) {
  return (
    <section
      className="diagnostic-details"
      id="diagnostics"
      tabIndex={-1}
      aria-label="Diagnostics Workspace"
    >
      <div className="panel-top">
        <h2>Full diagnostics</h2>
        <span>RULES ENGINE</span>
      </div>
      <div className="diagnosis-body">
        {!result && !busy && !error && (
          <p>
            Complete a cycle to inspect the backend's observations, hypotheses
            and evidence here.
          </p>
        )}
        {busy && <p>Correlating cycle evidence…</p>}
        {error && (
          <p>
            Diagnosis unavailable. Use Retry diagnosis in the investigation
            summary.
          </p>
        )}
        {result && (
          <>
            <span className={`result-badge state-${result.status}`}>
              {result.status.toUpperCase()}
            </span>
            <h2>
              {result.failure ??
                (result.status === "normal"
                  ? "Placement verified"
                  : "Review evidence")}
            </h2>
            <p>{result.summary}</p>
            {result.id && (
              <button onClick={onCreateTicket}>
                Create maintenance ticket
              </button>
            )}
            {(result.anomalies?.length ?? 0) > 1 && (
              <p className="fault">
                {result.anomalies!.length} independently detected anomalies
              </p>
            )}
            {result.warnings.map((w) => (
              <p className="fault" key={w}>
                {w}
              </p>
            ))}
            <h3>CONFIRMED OBSERVATIONS</h3>
            {result.observations.map((o) => (
              <div className="observation" key={o.text}>
                {o.text}
                <EvidenceReferences
                  ids={o.evidence}
                  timeline={result.timeline}
                  label="Observation"
                />
              </div>
            ))}
            {result.hypotheses.length > 0 && (
              <>
                <h3>PLAUSIBLE CAUSES</h3>
                <p className="muted">
                  Ordinal evidence ranking · not probabilities. Select a
                  reference to inspect its measured timeline row.
                </p>
                {result.hypotheses.map((h, i) => (
                  <details key={`${h.anomaly ?? ""}-${h.cause}`} open={i === 0}>
                    <summary>
                      <span>0{i + 1}</span> {h.cause}
                    </summary>
                    {h.support.length === 0 && (
                      <p className="limited-support">
                        Limited support: no supporting readings.
                      </p>
                    )}
                    {h.contradiction.length > 0 && (
                      <p className="limited-support">
                        Contradictory evidence exists. This is not a confirmed
                        cause.
                      </p>
                    )}
                    <EvidenceReferences
                      ids={h.support}
                      timeline={result.timeline}
                      label="Supports"
                    />
                    <EvidenceReferences
                      ids={h.contradiction}
                      timeline={result.timeline}
                      label="Contradicts"
                    />
                    {h.anomaly && (
                      <p className="muted">Related anomaly: {h.anomaly}</p>
                    )}
                    <b>OPERATOR CHECK</b>
                    <p>{h.check}</p>
                  </details>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
