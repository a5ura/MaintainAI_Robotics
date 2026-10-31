import type { GuideState } from "./guided";
import type { Diagnosis } from "./model";
import { EvidenceReferences } from "./EvidenceReferences";
export default function GuidedBanner({
  state,
  t,
  result,
  backendError,
  onPause,
  onResume,
  onReset,
  onSkip,
  onManual,
  onRetry,
}: {
  state: GuideState;
  t: number;
  result: Diagnosis | null;
  backendError: string;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
  onManual: () => void;
  onRetry: () => void;
}) {
  if (!state) return null;
  const titles = {
    simulation:
      t < 6
        ? "Watch a real simulated cycle"
        : "Compare commanded grip with object presence",
    evidence: "Connect the observations",
    checks: "Review possible causes and operator checks",
    saving: "Save the computed diagnosis as a ticket",
    complete: "Evidence preserved. Ready for a technician.",
  };
  return (
    <section className="guided-banner" aria-label="Guided Demo">
      <div className="eyebrow">
        LIVE GUIDED DEMO / {state.stage.toUpperCase()}{" "}
        {state.paused ? "· PAUSED" : ""}
      </div>
      <h2>{titles[state.stage]}</h2>
      {state.stage === "simulation" && (
        <p>
          {t < 6
            ? "The arm follows its joint trajectory. At transfer, watch the object and vacuum signal."
            : t < 12
              ? "The synthetic presence signal is lost while HOLD remains commanded. Post-place verification will complete the evidence."
              : backendError
                ? "Backend request failed. Retry diagnosis in the workspace below; results are never fabricated."
                : "Computing the result through FastAPI…"}
        </p>
      )}
      {state.stage === "evidence" && result && (
        <div>
          {result.observations.slice(0, 3).map((o) => (
            <div key={o.text}>
              <p>{o.text}</p>
              <EvidenceReferences
                ids={o.evidence}
                timeline={result.timeline}
                label="Inspect"
              />
            </div>
          ))}
        </div>
      )}
      {state.stage === "checks" && result && (
        <>
          <p>{result.hypotheses[0]?.cause ?? result.summary}</p>
          <p>
            <b>Recommended check:</b>{" "}
            {result.hypotheses[0]?.check ??
              "Inspect the evidence before drawing a conclusion."}
          </p>
          <p className="muted">
            A plausible cause is not a proven root cause. Next, save this real
            backend result into a labelled demo ticket.
          </p>
        </>
      )}
      {state.stage === "saving" && (
        <p>
          Writing the diagnosis reference and immutable evidence snapshot
          through the maintenance API.
        </p>
      )}
      {state.stage === "complete" && (
        <p>
          Ticket <strong>{state.ticketId}</strong> was returned by the backend.
          Inspect its diagnosis, evidence and history in Maintenance.
        </p>
      )}
      {state.error && (
        <div role="alert">
          <p>{state.error}</p>
          <button onClick={onRetry}>Retry demo ticket save</button>
        </div>
      )}
      <div className="guide-controls">
        {state.paused ? (
          <button onClick={onResume}>Resume demo</button>
        ) : (
          <button onClick={onPause} disabled={state.stage === "complete"}>
            Pause demo
          </button>
        )}
        <button onClick={onReset}>Reset demo</button>
        <button
          onClick={onSkip}
          disabled={state.stage === "saving" || state.stage === "complete"}
        >
          Skip to Results
        </button>
        <button onClick={onManual}>Take Manual Control</button>
      </div>
    </section>
  );
}
