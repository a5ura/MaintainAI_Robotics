import type { Diagnosis } from "./model";
import { EvidenceReferences } from "./EvidenceReferences";
import CandidateComparison from "./CandidateComparison";
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
            <CandidateComparison result={result} />
          </>
        )}
      </div>
    </section>
  );
}
