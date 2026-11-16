import type { Diagnosis } from "./model";
import { useInvestigation } from "./evidenceSelection";
import { placementText, presenceText } from "./EvidenceReferences";
export default function EvidenceTimeline({
  result,
}: {
  result: Diagnosis | null;
}) {
  const investigation = useInvestigation();
  const active = investigation?.result === result;
  return (
    <section className="evidence-panel" aria-label="Evidence timeline">
      <div className="panel-top">
        <h2>Evidence timeline</h2>
        <span>SIMULATED INPUTS · CYCLE-RELATIVE TIME</span>
      </div>
      {result ? (
        <>
          <div
            className="reading-rail"
            role="group"
            aria-label="Recorded readings"
          >
            {result.timeline.map((e, index) => (
              <button
                key={`${e.id}-${index}`}
                disabled={!active}
                aria-pressed={active && investigation?.selectedId === e.id}
                onClick={() => investigation?.select(e.id)}
              >
                {e.id} · {e.t.toFixed(1)}s<small>{e.phase}</small>
              </button>
            ))}
          </div>
          <p className="evidence-help">
            Recorded samples, not a replay control. Select a reading to inspect
            it; the live robot stays unchanged. Full recorded timeline:
          </p>
          {active && investigation?.selectedId && (
            <div
              className="selected-reading-navigation"
              role="group"
              aria-label="Selected reading navigation"
            >
              <span>
                Selected {investigation.selectedId} · historical evidence
              </span>
              <button
                onClick={() => {
                  const target = document.getElementById("evidence-inspector");
                  target?.focus({ preventScroll: true });
                  target?.scrollIntoView({ block: "start" });
                }}
              >
                Inspect selected reading
              </button>
              <button
                onClick={() => {
                  const target = document.querySelector<HTMLElement>(
                    "[data-testid='workcell-stage']",
                  );
                  target?.focus({ preventScroll: true });
                  target?.scrollIntoView({ block: "center" });
                }}
              >
                View selected reading in workcell
              </button>
            </div>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>REF / TIME</th>
                  <th>PHASE</th>
                  <th>GRIP COMMAND</th>
                  <th>OBJECT AT GRIPPER</th>
                  <th>VACUUM</th>
                  <th>VERIFICATION</th>
                  <th>FK CHECK / JOINTS / TCP</th>
                  <th>EVENTS / OBSERVATIONS</th>
                </tr>
              </thead>
              <tbody>
                {result.timeline.map((e) => (
                  <tr
                    key={e.id}
                    id={`evidence-${e.id}`}
                    tabIndex={-1}
                    className={
                      active && investigation?.selectedId === e.id
                        ? "selected-evidence"
                        : undefined
                    }
                  >
                    <td>
                      {e.id} / {e.t.toFixed(1)}s
                    </td>
                    <td>{e.phase}</td>
                    <td>{e.grip_command ? "HOLD" : "RELEASE"}</td>
                    <td>{presenceText(e.object_present)}</td>
                    <td>{e.pressure_kpa ?? "UNKNOWN"} kPa</td>
                    <td>{e.verification ?? "—"}</td>
                    <td>
                      {e.kinematics
                        ? e.kinematics.valid
                          ? "CONSISTENT"
                          : "INCONSISTENT"
                        : "UNVERIFIED"}
                      <div>
                        Joints: {e.joints?.join(" / ") ?? "unavailable"} rad
                      </div>
                      <div>TCP: {e.tcp?.join(" / ") ?? "unavailable"} m</div>
                    </td>
                    <td className="engineering-cell">
                      {e.events?.map((event) => (
                        <div key={`${event.code}-${event.t}`}>
                          {event.t}s / {event.source}: {event.code} —{" "}
                          {event.message}
                        </div>
                      ))}
                      {e.vision && (
                        <div>
                          Camera: {e.vision.status}; acquired{" "}
                          {e.vision.acquired_t}s; confidence{" "}
                          {e.vision.confidence ?? "unknown"}
                        </div>
                      )}
                      {e.placement && (
                        <div>
                          Target:{" "}
                          {e.placement.target
                            .map((v) => v.toFixed(3))
                            .join(", ")}{" "}
                          / Observed: {placementText(e.placement)} (
                          {e.placement.source})
                        </div>
                      )}
                      {e.controller && (
                        <div>Controller: {e.controller.state}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="empty">
          No completed run. Evidence will appear here after backend analysis.
        </p>
      )}
    </section>
  );
}
