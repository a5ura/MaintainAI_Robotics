import React, { useEffect, useRef, useState } from "react";
import Workcell from "./Workcell";
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
  const [drop, setDrop] = useState(false),
    [result, setResult] = useState<Diagnosis | null>(null);
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
      setClock((c) => advance(c, dt));
    }, 33);
    return () => clearInterval(id);
  }, [clock.running]);
  async function diagnose() {
    const run = generation.current;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          samples: SAMPLE_TIMES.map((t) => sample(t, drop)),
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const data: Diagnosis = await response.json();
      if (generation.current === run) setResult(data);
    } catch (e) {
      if (generation.current === run)
        setError(e instanceof Error ? e.message : "Diagnostic request failed");
    } finally {
      if (generation.current === run) setBusy(false);
    }
  }
  useEffect(() => {
    if (clock.t >= DURATION && !requested.current) {
      requested.current = true;
      void diagnose();
    }
  }, [clock.t]);
  function reset() {
    generation.current++;
    requested.current = false;
    setClock({ t: 0, running: false });
    setResult(null);
    setError("");
    setBusy(false);
  }
  const tcp = fk(trajectory(clock.t)).tcp;
  const sensor = sample(clock.t, drop);
  return (
    <div className="shell">
      <header>
        <a className="brand" href="#">
          M<span> / </span>MaintainAI <b>ROBOTICS</b>
        </a>
        <span className="environment">
          SIMULATED WORKCELL · COMPUTED DIAGNOSTICS
        </span>
        <span className="live-dot">LOCAL DEMO</span>
      </header>
      <main>
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
              <Workcell t={clock.t} drop={drop} />
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
                  {phase(clock.t).replaceAll("-", " ")}
                </strong>
              </div>
              <span className="time">{clock.t.toFixed(1)} / 12.0 s</span>
            </div>
            <progress aria-label="Cycle progress" max={12} value={clock.t} />
            <div className="controls">
              <button
                className="primary"
                onClick={() => setClock((c) => ({ ...c, running: true }))}
                disabled={clock.running || clock.t === 12}
              >
                Start
              </button>
              <button
                onClick={() => setClock((c) => ({ ...c, running: false }))}
                disabled={!clock.running}
              >
                Pause
              </button>
              <button onClick={reset}>Reset</button>
              <label className="scenario">
                SCENARIO
                <select
                  aria-label="Scenario"
                  value={drop ? "drop" : "normal"}
                  disabled={clock.t > 0 || clock.running}
                  onChange={(e) => setDrop(e.target.value === "drop")}
                >
                  <option value="normal">Valid cycle</option>
                  <option value="drop">Dropped object</option>
                </select>
              </label>
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
                      ? sample(c.t, drop).verification
                      : "Awaiting observation"}
                  </small>
                </div>
              ))}
            </div>
          </section>
          <aside className="diagnostics" id="diagnostics">
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
                  {result.warnings.map((w) => (
                    <p className="fault" key={w}>
                      {w}
                    </p>
                  ))}
                  <h3>CONFIRMED OBSERVATIONS</h3>
                  {result.observations.map((o) => (
                    <p className="observation" key={o.text}>
                      {o.text}
                      <small>{o.evidence.join(" · ")}</small>
                    </p>
                  ))}
                  {result.hypotheses.length > 0 && (
                    <>
                      <h3>PLAUSIBLE CAUSES</h3>
                      <p className="muted">
                        Ordinal evidence ranking · not probabilities
                      </p>
                      {result.hypotheses.map((h, i) => (
                        <details key={h.cause} open={i === 0}>
                          <summary>
                            <span>0{i + 1}</span> {h.cause}
                          </summary>
                          <p>
                            Supports: {h.support.join(", ") || "None observed"}
                            <br />
                            Contradicts:{" "}
                            {h.contradiction.join(", ") || "None observed"}
                          </p>
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
                  </tr>
                </thead>
                <tbody>
                  {result.timeline.map((e) => (
                    <tr key={e.id}>
                      <td>
                        {e.id} / {e.t.toFixed(1)}s
                      </td>
                      <td>{e.phase}</td>
                      <td>{e.grip_command ? "HOLD" : "RELEASE"}</td>
                      <td>{e.object_present ? "PRESENT" : "ABSENT"}</td>
                      <td>{e.pressure_kpa} kPa</td>
                      <td>{e.verification ?? "—"}</td>
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
          <span>MILESTONE 01 · DETERMINISTIC, EXPLAINABLE, REPRODUCIBLE</span>
        </footer>
      </main>
    </div>
  );
}
