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
import AppShell from "./AppShell";
import OperationsWorkspace from "./OperationsWorkspace";
import InvestigationSummary from "./InvestigationSummary";
import DiagnosticDetails from "./DiagnosticDetails";
import EvidenceTimeline from "./EvidenceTimeline";
import { fk, trajectory, type Clock, type Diagnosis } from "./model";
import "./style.css";
export function App() {
  const [clock, setClock] = useState<Clock>({ t: 0, running: false });
  const [selection, setSelection] = useState<Selection>("normal");
  const [seed, setSeed] = useState(42);
  const scenario = resolveScenario(selection, seed);
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
  const guideBanner = (
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
  );
  function createTicket() {
    guide.takeover();
    setInitialTicketId(undefined);
    setFromDiagnosis(true);
    setView("maintenance");
  }
  return (
    <AppShell
      view={view}
      onOperations={() => {
        if (guide.state) guide.takeover();
        setView("operations");
      }}
      onMaintenance={() => {
        if (guide.state) guide.takeover();
        setInitialTicketId(undefined);
        setFromDiagnosis(false);
        setView("maintenance");
      }}
      onDiagnostics={openDiagnostics}
    >
      {view === "maintenance" ? (
        <>
          {guideBanner}
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
        </>
      ) : (
        <main id="main-content" className="operations-main" tabIndex={-1}>
          <div className="workspace-heading">
            <div>
              <h1>
                Operations <span>Cell 01 / R-01</span>
              </h1>
              <p>
                Simulate a cycle. Investigate evidence. Document the repair.
              </p>
            </div>
            <span className="workspace-disclosure">
              Simulated workcell · computed diagnostics
            </span>
          </div>
          <OperationsWorkspace
            clock={clock}
            selection={selection}
            seed={seed}
            scenario={scenario}
            result={result}
            busy={busy}
            error={error}
            engineeringEnabled={engineeringEnabled}
            overlays={overlays}
            tcp={tcp}
            sensor={sensor}
            guideActive={!!guide.state}
            setSelection={setSelection}
            setSeed={setSeed}
            onStart={() => {
              if (guide.state) guide.resume();
              else setClock((c) => ({ ...c, running: true }));
            }}
            onPause={() => {
              if (guide.state) guide.pause();
              else setClock((c) => ({ ...c, running: false }));
            }}
            onReset={reset}
            onGuide={guide.start}
            canvas={
              <Workcell
                t={clock.t}
                scenario={scenario}
                engineering={engineeringEnabled}
                overlays={overlays}
                selected={selectedComponent}
                onSelect={setSelectedComponent}
              />
            }
          >
            <InvestigationSummary
              clock={clock}
              result={result}
              busy={busy}
              error={error}
              onRetry={() => void diagnose()}
              onDetails={openDiagnostics}
            />
            {guideBanner}
          </OperationsWorkspace>
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
          <DiagnosticDetails
            result={result}
            busy={busy}
            error={error}
            onCreateTicket={createTicket}
          />
          <EvidenceTimeline result={result} />
          <footer>
            <span>MAINTAINAI / ENGINEERING DEMONSTRATOR</span>
            <span>DETERMINISTIC · EXPLAINABLE · REPRODUCIBLE</span>
          </footer>
        </main>
      )}
    </AppShell>
  );
}
