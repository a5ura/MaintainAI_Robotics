import type { Diagnosis } from "./model";
export default function EvidenceTimeline({
  result,
}: {
  result: Diagnosis | null;
}) {
  return (
    <section className="evidence-panel" aria-label="Evidence timeline">
      <div className="panel-top">
        <h2>Evidence timeline</h2>
        <span>SIMULATED INPUTS · CYCLE-RELATIVE TIME</span>
      </div>
      {result ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>REF / TIME</th>
                <th>PHASE</th>
                <th>GRIP COMMAND</th>
                <th>OBJECT SENSOR</th>
                <th>VACUUM</th>
                <th>VERIFICATION</th>
                <th>FK CHECK</th>
                <th>EVENTS / OBSERVATIONS</th>
              </tr>
            </thead>
            <tbody>
              {result.timeline.map((e) => (
                <tr key={e.id} id={`evidence-${e.id}`} tabIndex={-1}>
                  <td>
                    {e.id} / {e.t.toFixed(1)}s
                  </td>
                  <td>{e.phase}</td>
                  <td>{e.grip_command ? "HOLD" : "RELEASE"}</td>
                  <td>
                    {e.object_present === null
                      ? "UNKNOWN"
                      : e.object_present
                        ? "PRESENT"
                        : "ABSENT"}
                  </td>
                  <td>{e.pressure_kpa ?? "UNKNOWN"} kPa</td>
                  <td>{e.verification ?? "—"}</td>
                  <td>
                    {e.kinematics
                      ? e.kinematics.valid
                        ? "CONSISTENT"
                        : "INCONSISTENT"
                      : "UNVERIFIED"}
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
                        {e.placement.target.map((v) => v.toFixed(3)).join(", ")}{" "}
                        / Observed:{" "}
                        {e.placement.observed
                          ?.map((v) => v.toFixed(3))
                          .join(", ") ?? "absent"}{" "}
                        ({e.placement.source})
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
      ) : (
        <p className="empty">
          No completed run. Evidence will appear here after backend analysis.
        </p>
      )}
    </section>
  );
}
