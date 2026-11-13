import { Suspense, type ReactNode } from "react";
import ViewBoundary from "./ViewBoundary";
import { trajectory, phase, type Clock, type Diagnosis } from "./model";
import {
  SCENARIOS,
  scenarioSample,
  endTime,
  type Selection,
  type Scenario,
} from "./scenarios";
export default function OperationsWorkspace({
  clock,
  selection,
  seed,
  scenario,
  result,
  busy,
  error,
  engineeringEnabled,
  overlays,
  tcp,
  sensor,
  canvas,
  children,
  guideActive,
  onStart,
  onPause,
  onReset,
  onGuide,
  setSelection,
  setSeed,
}: {
  clock: Clock;
  selection: Selection;
  seed: number;
  scenario: Scenario;
  result: Diagnosis | null;
  busy: boolean;
  error: string;
  engineeringEnabled: boolean;
  overlays: import("./engineering").Overlays;
  tcp: number[];
  sensor: ReturnType<typeof scenarioSample>;
  canvas: ReactNode;
  children: ReactNode;
  guideActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onGuide: () => void;
  setSelection: (s: Selection) => void;
  setSeed: (n: number) => void;
}) {
  const drop = scenario === "drop";
  return (
    <div className="operations-workspace">
      {" "}
      <section className="cell-panel" aria-label="Robot workcell">
        <div className="panel-top">
          <span>01 / ROBOT WORKCELL</span>
          <span
            className={
              result
                ? `state-${result.status}`
                : error
                  ? "state-error"
                  : "state-idle"
            }
          >
            {error
              ? "BACKEND UNAVAILABLE"
              : busy
                ? "ANALYZING"
                : result
                  ? result.status.toUpperCase()
                  : clock.running
                    ? "CYCLE ACTIVE"
                    : "READY"}
          </span>
        </div>
        <div className="viewport">
          <ViewBoundary label="3D workcell">
            {" "}
            <Suspense
              fallback={
                <div className="canvas-error" role="status">
                  Loading 3D workcell…
                </div>
              }
            >
              {canvas}
            </Suspense>
          </ViewBoundary>
          {engineeringEnabled && overlays.angles && (
            <div className="angle-overlay" aria-label="Joint angle overlay">
              {trajectory(clock.t).map((q, i) => (
                <div key={i}>
                  J{i + 1} / {q.toFixed(3)} rad ·{" "}
                  {((q * 180) / Math.PI).toFixed(1)}°
                </div>
              ))}
            </div>
          )}
          <div className="viewport-label">SIMULATION • NOT LIVE HARDWARE</div>
          <div className="tcp">
            TCP / WORLD [m]
            <br />
            {tcp.map((n) => n.toFixed(3)).join(" / ")}
          </div>
        </div>
        <div className="sensor-strip">
          <span>GRIP / {sensor.grip_command ? "HOLD" : "RELEASE"}</span>
          <span
            className={drop && clock.t >= 6 && clock.t < 10 ? "fault" : "good"}
          >
            Object at gripper / {sensor.object_present ? "PRESENT" : "ABSENT"}
          </span>
          <span>VACUUM / {sensor.pressure_kpa} kPa</span>
        </div>
        <div className="transport">
          <div>
            <span className="eyebrow">CURRENT PHASE</span>
            <strong data-testid="phase">
              {scenario === "stop" && clock.t >= 6
                ? "Interrupted · transport"
                : phase(clock.t).replaceAll("-", " ")}
            </strong>
          </div>
          <span className="time">{clock.t.toFixed(1)} / 12.0 s</span>
        </div>
        <progress aria-label="Cycle progress" max={12} value={clock.t} />
        <div className="controls">
          <button
            className="primary"
            onClick={onStart}
            disabled={clock.running || clock.t >= endTime(scenario)}
          >
            Start
          </button>
          <button onClick={onPause} disabled={!clock.running}>
            Pause
          </button>
          <button onClick={onReset}>Reset</button>
          <label className="scenario">
            SCENARIO
            <select
              aria-label="Scenario"
              value={selection}
              disabled={clock.t > 0 || clock.running}
              onChange={(e) => setSelection(e.target.value as Selection)}
            >
              {Object.entries(SCENARIOS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
              <option value="random">Random failure</option>
            </select>
          </label>
          {!guideActive && (
            <button className="guide-entry" onClick={onGuide}>
              Start Guided Demo
            </button>
          )}
        </div>
        <div className="run-context">
          <label>
            Reproducible seed{" "}
            <input
              aria-label="Reproducible seed"
              type="number"
              min={0}
              max={4294967295}
              value={seed}
              disabled={clock.t > 0 || clock.running}
              onChange={(e) =>
                setSeed(
                  Math.min(
                    4294967295,
                    Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  ),
                )
              }
            />
          </label>
          <span data-testid="run-context">
            {SCENARIOS[scenario]} · seed {seed}
          </span>
        </div>
        <div className="checkpoints">
          {[
            { t: 0, label: "Pre-pick" },
            { t: 3, label: "Post-pick" },
            { t: 9, label: "Pre-place" },
            { t: 12, label: "Post-place" },
          ].map((c) => (
            <div key={c.t} className={clock.t >= c.t ? "done" : ""}>
              <span>
                {clock.t >= c.t ? "●" : "○"} {c.label}
              </span>
              <small>
                {clock.t >= c.t
                  ? (scenarioSample(c.t, scenario).verification ??
                    "No reliable observation")
                  : scenario === "stop" && clock.t >= 6
                    ? "Not reached"
                    : "Awaiting observation"}
              </small>
            </div>
          ))}
        </div>
      </section>
      <aside className="investigation-column" aria-label="Investigation">
        {children}
      </aside>
    </div>
  );
}
