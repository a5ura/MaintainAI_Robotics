import type { Clock, Diagnosis } from "./model";

export default function InvestigationSummary({
  clock,
  result,
  busy,
  error,
  onRetry,
  onDetails,
}: {
  clock: Clock;
  result: Diagnosis | null;
  busy: boolean;
  error: string;
  onRetry: () => void;
  onDetails: () => void;
}) {
  const state = error ? "error" : busy ? "pending" : (result?.status ?? "idle");
  const label = error
    ? "Backend unavailable"
    : busy
      ? "Analysis pending"
      : result?.status === "detected"
        ? "Fault detected"
        : result?.status === "normal"
          ? "Normal cycle"
          : result
            ? "Inconclusive"
            : clock.running
              ? "Cycle running"
              : clock.t > 0
                ? "Cycle paused"
                : "Ready to run";
  const leading = result?.hypotheses[0];
  return (
    <section
      className={`investigation-summary state-${state}`}
      aria-label="Investigation summary"
    >
      <div className="panel-top">
        <h2>Investigation</h2>
        <span>BACKEND EVIDENCE</span>
      </div>
      <div className="summary-body">
        <div className="summary-status" aria-live="polite">
          <span className={`status-pill state-${state}`}>{label}</span>
          <p className="summary-outcome" data-testid="investigation-outcome">
            {error
              ? "Diagnosis unavailable"
              : busy
                ? "Correlating cycle evidence…"
                : (result?.failure ??
                  (result?.status === "normal"
                    ? "Placement verified"
                    : result
                      ? "Review evidence"
                      : "Pick, place, investigate."))}
          </p>
        </div>
        {error ? (
          <div role="alert">
            <p>{error}</p>
            <button onClick={onRetry}>Retry diagnosis</button>
          </div>
        ) : busy ? (
          <p>The result will appear after FastAPI completes the analysis.</p>
        ) : result ? (
          <>
            <p className="summary-description">{result.summary}</p>
            {result.warnings.length > 0 && (
              <p className="summary-warning">
                {result.warnings[0]}
                {result.warnings.length > 1
                  ? ` (${result.warnings.length} warnings in full diagnostics)`
                  : ""}
              </p>
            )}
            <h3>Confirmed observations</h3>
            {result.observations.length ? (
              <ul className="summary-observations">
                {result.observations.slice(0, 2).map((o, i) => (
                  <li key={i}>{o.text}</li>
                ))}
              </ul>
            ) : (
              <p>No confirmed observations returned.</p>
            )}
            <h3>Leading hypothesis</h3>
            <p>{leading?.cause ?? "No ranked hypothesis returned."}</p>
            {leading && (
              <p className="summary-caution">Hypothesis, not a proven cause</p>
            )}
            <h3>Operator check</h3>
            <p>
              {leading?.check ??
                "No operator check returned. Review the full evidence."}
            </p>
            <p className="summary-counts">
              {result.observations.length} observations ·{" "}
              {result.hypotheses.length} hypotheses · {result.timeline.length}{" "}
              evidence rows
            </p>
          </>
        ) : (
          <>
            <p>
              Run a valid cycle or select a failure scenario. The backend
              computes the diagnosis from simulated evidence.
            </p>
            <dl className="run-summary">
              <div>
                <dt>Simulation</dt>
                <dd>
                  {clock.running ? "Running" : clock.t > 0 ? "Paused" : "Ready"}
                </dd>
              </div>
              <div>
                <dt>Cycle time</dt>
                <dd>{clock.t.toFixed(1)} / 12.0 s</dd>
              </div>
            </dl>
            <p className="summary-hint">
              Try Dropped object, or start the Guided Demo for a complete
              investigation.
            </p>
          </>
        )}
        <button className="details-entry" onClick={onDetails}>
          Full diagnostics &amp; evidence
        </button>
      </div>
    </section>
  );
}
