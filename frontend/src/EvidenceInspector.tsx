import { historicalPosition, useInvestigation } from "./evidenceSelection";
import { placementText, presenceText } from "./EvidenceReferences";
const pose = (values: number[] | undefined | null) =>
  values?.length === 3 && values.every(Number.isFinite)
    ? values.map((v) => v.toFixed(3)).join(" / ")
    : "Unavailable / invalid";
export default function EvidenceInspector() {
  const investigation = useInvestigation();
  if (!investigation?.result) return null;
  const { row, selectedId, issue, clear } = investigation;
  return (
    <section
      className="evidence-inspector"
      id="evidence-inspector"
      tabIndex={-1}
      aria-label="Evidence inspector"
    >
      <h3>Inspect recorded evidence</h3>
      {!row ? (
        <p role={selectedId ? "status" : undefined}>{issue}</p>
      ) : (
        <>
          <p className="historical-heading">
            <strong>
              Historical {row.id} ·{" "}
              {Number.isFinite(row.t)
                ? `${row.t.toFixed(1)}s`
                : "time unavailable"}
            </strong>
            <br />
            Cycle-relative reading · not the current robot state
          </p>
          <p className="muted">
            Diagnosis {investigation.result.id ?? "identifier unavailable"} ·{" "}
            {row.phase}
          </p>
          <dl className="evidence-readings">
            <dt>Grip command</dt>
            <dd>
              {row.grip_command === true
                ? "HOLD"
                : row.grip_command === false
                  ? "RELEASE"
                  : "UNKNOWN"}
            </dd>
            <dt>Object at gripper</dt>
            <dd>{presenceText(row.object_present)}</dd>
            <dt>Vacuum</dt>
            <dd>
              {row.pressure_kpa == null ? "UNKNOWN" : `${row.pressure_kpa} kPa`}
            </dd>
            <dt>Verification</dt>
            <dd>{row.verification ?? "Not sampled / unavailable"}</dd>
            <dt>Recorded joints (rad)</dt>
            <dd>{pose(row.joints)}</dd>
            <dt>Recorded TCP (m)</dt>
            <dd>{pose(row.tcp)}</dd>
            <dt>FK consistency</dt>
            <dd>
              {row.kinematics
                ? row.kinematics.valid
                  ? "CONSISTENT"
                  : "INCONSISTENT"
                : "UNVERIFIED"}
            </dd>
          </dl>
          {row.kinematics && (
            <p>
              Expected TCP: {pose(row.kinematics.expected_tcp)} m · error{" "}
              {row.kinematics.error_m ?? "unknown"} m · tolerance{" "}
              {row.kinematics.tolerance_m} m
              {row.kinematics.violations.length > 0 &&
                ` · ${row.kinematics.violations.join("; ")}`}
            </p>
          )}
          <p className="spatial-status">
            {historicalPosition(row)
              ? "Historical marker uses this recorded TCP. It does not move the live robot."
              : "Spatial highlighting unavailable: valid recorded pose and backend kinematic verification required."}
          </p>
          {row.vision && (
            <p>
              Camera: {row.vision.status} · acquired {row.vision.acquired_t}s ·
              detection {presenceText(row.vision.object_detected)} · confidence{" "}
              {row.vision.confidence ?? "unknown"} (recorded camera input, not
              cause probability)
            </p>
          )}
          {row.placement && (
            <p>
              Placement target: {pose(row.placement.target)} m · commanded:{" "}
              {pose(row.placement.commanded_target)} m · observed:{" "}
              {placementText(row.placement)} · presence{" "}
              {presenceText(row.placement.object_present)} · source{" "}
              {row.placement.source} · calibration age{" "}
              {row.placement.calibration_age_days ?? "unknown"} days
            </p>
          )}
          {row.controller && (
            <p>
              Controller: {row.controller.state} · motion expected{" "}
              {String(row.controller.motion_expected)} · safety gate open{" "}
              {row.controller.safety_gate_open == null
                ? "UNKNOWN"
                : String(row.controller.safety_gate_open)}{" "}
              · drive warning{" "}
              {row.controller.drive_warning == null
                ? "UNKNOWN"
                : String(row.controller.drive_warning)}
            </p>
          )}
          <h4>Recorded events</h4>
          {row.events?.length ? (
            <ul>
              {row.events.map((event, i) => (
                <li key={i}>
                  {event.t}s · {event.source} · {event.code}: {event.message}
                </li>
              ))}
            </ul>
          ) : (
            <p>No events recorded for this sample.</p>
          )}
          <details>
            <summary>Complete recorded reading (JSON)</summary>
            <pre>{JSON.stringify(row, null, 2)}</pre>
          </details>
          <div className="inspector-actions">
            <button
              onClick={() => {
                const stage = document.querySelector<HTMLElement>(
                  "[data-testid='workcell-stage']",
                );
                stage?.focus({ preventScroll: true });
                stage?.scrollIntoView({ block: "center" });
              }}
            >
              View historical marker in workcell
            </button>
            <button onClick={clear}>Clear evidence selection</button>
          </div>
        </>
      )}
    </section>
  );
}
