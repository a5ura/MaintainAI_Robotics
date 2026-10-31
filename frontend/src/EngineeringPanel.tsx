import {
  COMPONENTS,
  engineeringState,
  type ComponentId,
  type Overlays,
} from "./engineering";
import { EvidenceReferences } from "./EvidenceReferences";
import type { Diagnosis } from "./model";
export default function EngineeringPanel({
  t,
  enabled,
  setEnabled,
  overlays,
  setOverlays,
  selected,
  setSelected,
  result,
}: {
  t: number;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  overlays: Overlays;
  setOverlays: (v: Overlays) => void;
  selected: ComponentId | null;
  setSelected: (v: ComponentId) => void;
  result: Diagnosis | null;
}) {
  const state = enabled ? engineeringState(t) : null;
  const related =
    selected && result
      ? result.timeline
          .filter((e) =>
            selected === "tool"
              ? e.grip_command || e.verification === "missing"
              : selected === "base"
                ? !!e.placement
                : !!e.controller || !e.kinematics?.valid,
          )
          .slice(-4)
          .map((e) => e.id)
      : [];
  return (
    <section
      className="engineering-panel"
      aria-label="Advanced engineering view"
    >
      <label className="engineering-switch">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Advanced Engineering View{" "}
        <span>Optional · computed from current joint state</span>
      </label>
      {state && (
        <>
          <div className="overlay-controls">
            {(
              [
                ["angles", "Joint angles"],
                ["frames", "Coordinate frames"],
                ["path", "TCP trajectory"],
                ["transforms", "Transforms"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={overlays[key]}
                  onChange={(e) =>
                    setOverlays({ ...overlays, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <p className="muted">
            Frames: right-handed Y-up world. Angles: radians/degrees. Positions:
            metres. Path: executed TCP positions only. Select a component here
            or click it in the 3D cell.
          </p>
          <div
            className="component-buttons"
            role="group"
            aria-label="Robot components"
          >
            {Object.entries(COMPONENTS).map(([id, c]) => (
              <button
                key={id}
                aria-pressed={selected === id}
                onClick={() => setSelected(id as ComponentId)}
              >
                {c.name}
              </button>
            ))}
          </div>
          {overlays.angles && (
            <dl className="joint-readings">
              {state.joints.map((q, i) => (
                <div key={i}>
                  <dt>J{i + 1}</dt>
                  <dd>
                    {q.toFixed(4)} rad / {((q * 180) / Math.PI).toFixed(1)}°
                    <small>Limit [{state.limits[i].join(", ")}] rad</small>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {selected && (
            <div
              className="component-info"
              role="region"
              aria-label="Component information"
            >
              <h3>{COMPONENTS[selected].name}</h3>
              <p>
                Axis: {COMPONENTS[selected].axis}.{" "}
                {COMPONENTS[selected].description}
              </p>
              <p>
                Current TCP:{" "}
                {state.pose.tcp.map((v) => v.toFixed(4)).join(" / ")} m
              </p>
              {result ? (
                <>
                  <p className="muted">
                    Relevant readings, not a proven component fault:
                  </p>
                  <EvidenceReferences
                    ids={related}
                    timeline={result.timeline}
                    label="Inspect"
                  />
                </>
              ) : (
                <p className="muted">
                  Run a cycle for backend-computed evidence links.
                </p>
              )}
            </div>
          )}
          {overlays.transforms && (
            <details className="transform-details">
              <summary>World transforms · row-major 4×4</summary>
              {state.frames.map((f) => (
                <div key={f.name}>
                  <h3>{f.name}</h3>
                  <table aria-label={`${f.name} transform`}>
                    <tbody>
                      {[0, 1, 2, 3].map((row) => (
                        <tr key={row}>
                          {f.matrix
                            .slice(row * 4, row * 4 + 4)
                            .map((v, col) => (
                              <td key={col}>{v.toFixed(4)}</td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </details>
          )}
        </>
      )}
    </section>
  );
}
