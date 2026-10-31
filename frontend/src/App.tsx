import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import EngineeringPanel from "./EngineeringPanel";
import GuidedBanner from "./GuidedBanner";
import ViewBoundary from "./ViewBoundary";
import { api } from "./api";
import { useGuidedDemo } from "./useGuidedDemo";
import { NO_OVERLAYS, type ComponentId, type Overlays } from "./engineering";
const Workcell = lazy(() => import("./Workcell"));
const Maintenance = lazy(() => import("./Maintenance"));
import {
  SCENARIOS,
  resolveScenario,
  advanceScenario,
  scenarioSample,
  cyclePayload,
  endTime,
  type Selection,
} from "./scenarios";
import { EvidenceReferences } from "./EvidenceReferences";
import {
  advance,
  DURATION,
  fk,
  trajectory,
  phase,
  sample,
  SAMPLE_TIMES,
  type Clock,
  type Diagnosis,
} from "./model";
import "./style.css";
export function App() {
  const [clock, setClock] = useState<Clock>({ t: 0, running: false });
  const [selection, setSelection] = useState<Selection>("normal");
  const [seed, setSeed] = useState(42);
  const scenario = resolveScenario(selection, seed),
    drop = scenario === "drop";
  const [view, setView] = useState<"operations" | "maintenance">("operations");
  const [fromDiagnosis, setFromDiagnosis] = useState(false);
  const [initialTicketId, setInitialTicketId] = useState<string | undefined>();
  const [engineeringEnabled, setEngineeringEnabled] = useState(false);
  const [overlays, setOverlays] = useState<Overlays>(NO_OVERLAYS);
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentId | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const generation = useRef(0),
    requested = useRef(false);
  useEffect(() => {
    if (!clock.running) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      setClock((c) => advanceScenario(c, dt, scenario));
    }, 33);
    return () => clearInterval(id);
  }, [clock.running, scenario]);
  async function diagnose() {
    const run = generation.current;
    setBusy(true);
    setError("");
    try {
      const data = await api<Diagnosis>(
        "/diagnose",
        "POST",
        cyclePayload(scenario),
      );
      if (generation.current === run) setResult(data);
    } catch (e) {
      if (generation.current === run)
        setError(e instanceof Error ? e.message : "Diagnostic request failed");
    } finally {
      if (generation.current === run) setBusy(false);
    }
  }
  useEffect(() => {
    if (clock.t >= endTime(scenario) && !requested.current) {
      requested.current = true;
      void diagnose();
    }
  }, [clock.t]);
  function resetSimulation() {
    generation.current++;
    requested.current = false;
    setClock({ t: 0, running: false });
    setResult(null);
    setError("");
    setBusy(false);
  }
  const guide = useGuidedDemo(clock, result, {
    reset: resetSimulation,
    selectDrop: () => {
      setSelection("drop");
      setSeed(42);
    },
    play: () => setClock((c) => ({ ...c, running: true })),
    pause: () => setClock((c) => ({ ...c, running: false })),
    skip: () => setClock({ t: 12, running: false }),
    showOperations: () => setView("operations"),
    openTicket: (id) => {
      setInitialTicketId(id);
      setFromDiagnosis(false);
      setView("maintenance");
    },
  });
  function reset() {
    guide.stop();
    resetSimulation();
  }
  function openDiagnostics() {
    setView("operations");
    setTimeout(() => {
      const section = document.getElementById("diagnostics");
      section?.focus();
      section?.scrollIntoView({ block: "start" });
    }, 0);
  }
  const tcp = fk(trajectory(clock.t)).tcp;
  const sensor = scenarioSample(clock.t, scenario);
  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header>
        <a className="brand" href="#">
          M<span> / </span>MaintainAI <b>ROBOTICS</b>
        </a>
        <span className="environment">
          SIMULATED WORKCELL · COMPUTED DIAGNOSTICS
        </span>
        <span className="live-dot">LOCAL DEMO</span>
      </header>
      <nav className="workspace-nav" aria-label="Workspace">
        <button
          aria-pressed={view === "operations"}
          onClick={() => {
            if (guide.state) guide.takeover();
            setView("operations");
          }}
        >
          Operations
        </button>
        <button
          aria-pressed={view === "maintenance"}
          onClick={() => {
            if (guide.state) guide.takeover();
            setInitialTicketId(undefined);
            setFromDiagnosis(false);
            setView("maintenance");
          }}
        >
          Maintenance
        </button>
        <button onClick={openDiagnostics}>Diagnostics</button>
      </nav>
      <GuidedBanner
        state={guide.state}
        t={clock.t}
        result={result}
        backendError={error}
        onPause={guide.pause}
        onResume={guide.resume}
        onReset={guide.start}
        onSkip={guide.skip}
        onManual={guide.takeover}
        onRetry={guide.retry}
      />
      {view === "maintenance" ? (
        <ViewBoundary label="Maintenance">
          <Suspense
            fallback={
              <main id="main-content" role="status">
                Loading maintenance…
              </main>
            }
          >
            <Maintenance
              initialTicketId={initialTicketId}
              diagnosis={result}
              fromDiagnosis={fromDiagnosis}
              runContext={`${SCENARIOS[scenario]} · seed ${seed}`}
              onReturn={() => {
                if (guide.state) guide.takeover();
                setView("operations");
              }}
            />
          </Suspense>
        </ViewBoundary>
      ) : (
        <main id="main-content" tabIndex={-1}>
          <div className="eyebrow">OPERATIONS / CELL 01</div>
          <div className="title-row">
            <div>
              <h1>
                Precision in motion.
                <br />
                <span>Clarity when it stops.</span>
              </h1>
              <p>A robotic failure investigation, grounded in evidence.</p>
            </div>
            <div className="cell-tag">
              R-01 <span>3-AXIS DEMONSTRATOR</span>
            </div>
          </div>
          {!guide.state && (
            <section
              className="demo-entry"
              aria-label="Guided demo introduction"
            >
              <div>
                <b>A failure investigation in under a minute.</b>
                <p>
                  Run a live simulated failure, compute its diagnosis and create
                  one labelled demo maintenance ticket.
                </p>
              </div>
              <button className="primary" onClick={guide.start}>
                Start Guided Demo
              </button>
            </section>
          )}
          <div className="workspace">
            <section className="cell-panel">
              <div className="panel-top">
                <span>01 / ROBOT WORKCELL</span>
                <span
                  className={result?.status === "detected" ? "fault" : "good"}
                >
                  {result?.status === "detected"
                    ? "FAULT DETECTED"
                    : clock.running
                      ? "CYCLE ACTIVE"
                      : clock.t === 12
                        ? "CYCLE COMPLETE"
                        : "STANDBY"}
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
                    <Workcell
                      t={clock.t}
                      scenario={scenario}
                      engineering={engineeringEnabled}
                      overlays={overlays}
                      selected={selectedComponent}
                      onSelect={setSelectedComponent}
                    />
                  </Suspense>
                </ViewBoundary>
                {engineeringEnabled && overlays.angles && (
                  <div
                    className="angle-overlay"
                    aria-label="Joint angle overlay"
                  >
                    {trajectory(clock.t).map((q, i) => (
                      <div key={i}>
                        J{i + 1} / {q.toFixed(3)} rad ·{" "}
                        {((q * 180) / Math.PI).toFixed(1)}°
                      </div>
                    ))}
                  </div>
                )}
                {drop && clock.t >= 6 && clock.t < 12 && (
                  <div className="outcome-banner" role="status">
                    OBJECT PRESENCE LOST · GRIP STILL COMMANDED
                  </div>
                )}
                {scenario === "stop" && clock.t >= 6 && (
                  <div className="outcome-banner" role="status">
                    PROTECTIVE STOP · CYCLE INTERRUPTED
                  </div>
                )}
                {scenario === "vision" && clock.t >= 12 && (
                  <div className="outcome-banner" role="status">
                    CAMERA TIMEOUT · VERIFICATION UNAVAILABLE
                  </div>
                )}
                {scenario === "position" && clock.t >= 12 && (
                  <div className="outcome-banner" role="status">
                    PLACEMENT OFFSET · INDEPENDENT OBSERVATION
                  </div>
                )}
                <div className="viewport-label">
                  SIMULATION • NOT LIVE HARDWARE
                </div>
                <div className="tcp">
                  TCP / WORLD [m]
                  <br />
                  {tcp.map((n) => n.toFixed(3)).join(" / ")}
                </div>
              </div>
              <div className="sensor-strip">
                <span>GRIP / {sensor.grip_command ? "HOLD" : "RELEASE"}</span>
                <span
                  className={
                    drop && clock.t >= 6 && clock.t < 10 ? "fault" : "good"
                  }
                >
                  OBJECT / {sensor.object_present ? "PRESENT" : "ABSENT"}
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
                  onClick={() => {
                    if (guide.state) guide.resume();
                    else setClock((c) => ({ ...c, running: true }));
                  }}
                  disabled={clock.running || clock.t >= endTime(scenario)}
                >
                  Start
                </button>
                <button
                  onClick={() => {
                    if (guide.state) guide.pause();
                    else setClock((c) => ({ ...c, running: false }));
                  }}
                  disabled={!clock.running}
                >
                  Pause
                </button>
                <button onClick={reset}>Reset</button>
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
              <EngineeringPanel
                t={clock.t}
                enabled={engineeringEnabled}
                setEnabled={setEngineeringEnabled}
                overlays={overlays}
                setOverlays={setOverlays}
                selected={selectedComponent}
                setSelected={setSelectedComponent}
                result={result}
              />
            </section>
            <aside
              className="diagnostics"
              id="diagnostics"
              tabIndex={-1}
              aria-label="Diagnostics Workspace"
            >
              <div className="panel-top">
                <span>02 / DIAGNOSTICS</span>
                <span>RULES ENGINE</span>
              </div>
              <div className="diagnosis-body" aria-live="polite">
                {!result && !busy && !error && (
                  <>
                    <div className="radar">◎</div>
                    <h2>Every signal tells a story.</h2>
                    <p>
                      Run a cycle to collect sensor readings and checkpoint
                      observations. The backend correlates the evidence when the
                      cycle completes.
                    </p>
                    <div className="instruction">
                      <b>Try the failure path</b>
                      <p>
                        Select Dropped object, then Start. Watch the grip signal
                        change during transport.
                      </p>
                    </div>
                  </>
                )}
                {busy && <p>Correlating cycle evidence…</p>}
                {error && (
                  <div role="alert">
                    <h2>Backend unavailable</h2>
                    <p>{error}</p>
                    <button onClick={() => void diagnose()}>
                      Retry diagnosis
                    </button>
                  </div>
                )}
                {result && (
                  <>
                    <span
                      className={
                        "result-badge " +
                        (result.status === "detected" ? "fault" : "good")
                      }
                    >
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
                      <button
                        onClick={() => {
                          setFromDiagnosis(true);
                          setView("maintenance");
                        }}
                      >
                        Create maintenance ticket
                      </button>
                    )}
                    {(result.anomalies?.length ?? 0) > 1 && (
                      <p className="fault">
                        {result.anomalies!.length} independently detected
                        anomalies
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
                          <details
                            key={`${h.anomaly ?? ""}-${h.cause}`}
                            open={i === 0}
                          >
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
                                Contradictory evidence exists. This is not a
                                confirmed cause.
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
                              <p className="muted">
                                Related anomaly: {h.anomaly}
                              </p>
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
            </aside>
          </div>
          <section className="evidence-panel">
            <div className="panel-top">
              <span>03 / EVIDENCE TIMELINE</span>
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
                              {e.placement.target
                                .map((v) => v.toFixed(3))
                                .join(", ")}{" "}
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
                No completed run. Evidence will appear here after backend
                analysis.
              </p>
            )}
          </section>
          <footer>
            <span>MAINTAINAI / ENGINEERING DEMONSTRATOR</span>
            <span>MILESTONE 03 · DETERMINISTIC, EXPLAINABLE, REPRODUCIBLE</span>
          </footer>
        </main>
      )}
    </div>
  );
}
