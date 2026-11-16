import type { Diagnosis } from "./model";
import { EvidenceReferences } from "./EvidenceReferences";
export default function CandidateComparison({ result }: { result: Diagnosis }) {
  return (
    <section className="candidate-comparison" aria-label="Candidate comparison">
      <h3>Compare possible causes</h3>
      <p className="muted">
        Backend order within each anomaly · hypotheses, not confirmed causes or
        probabilities. Compare the evidence before identifying the next check.
      </p>
      {!result.hypotheses.length && (
        <p>No candidates returned. Review the observations and uncertainty.</p>
      )}
      {result.hypotheses.map((h, i) => (
        <details
          className="candidate-card"
          key={`${h.anomaly ?? ""}-${h.cause}-${i}`}
          open
        >
          <summary>{h.cause}</summary>
          {h.anomaly && (
            <p className="candidate-group">Related anomaly: {h.anomaly}</p>
          )}
          <div className="candidate-columns">
            <div>
              <h4>Supporting evidence</h4>
              {!h.support.length && (
                <p className="limited-support">
                  Limited support: no supporting readings.
                </p>
              )}
              <EvidenceReferences
                ids={h.support}
                timeline={result.timeline}
                label="Supports"
              />
            </div>
            <div>
              <h4>Contradicting evidence</h4>
              {h.contradiction.length > 0 && (
                <p className="limited-support">
                  Contradictory evidence exists. This is not a confirmed cause.
                </p>
              )}
              <EvidenceReferences
                ids={h.contradiction}
                timeline={result.timeline}
                label="Contradicts"
              />
            </div>
            <div>
              <h4>Operator check</h4>
              <p>{h.check}</p>
            </div>
          </div>
        </details>
      ))}
    </section>
  );
}
