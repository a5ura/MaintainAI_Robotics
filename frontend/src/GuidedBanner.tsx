import { GUIDE_STAGES, type GuideState, type PlaybackMode } from "./guided";
import type { NarrationControls } from "./useGuideNarration";
import type { Diagnosis } from "./model";
import { EvidenceReferences } from "./EvidenceReferences";
export default function GuidedBanner({
  state,
  narration,
  t,
  result,
  backendError,
  onPause,
  onResume,
  onReset,
  onExit,
  onNext,
  onPrevious,
  onMode,
}: {
  state: GuideState;
  narration: NarrationControls;
  t: number;
  result: Diagnosis | null;
  backendError: string;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onExit: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onMode: (mode: PlaybackMode) => void;
}) {
  if (!state) return null;
  const titles = {
    introduction: "Introduction",
    "robot-operation": "Robot Operation",
    "fault-detection": "Fault Detection",
    "evidence-investigation": "Evidence Investigation",
    diagnosis: "Diagnosis and Next Checks",
    "maintenance-handoff": "Maintenance Handoff",
  };
  return (
    <section className="guided-banner" aria-label="Guided Demo">
      <div className="eyebrow">
        LIVE GUIDED DEMO / {state.stage.toUpperCase()}{" "}
        {state.paused ? "· PAUSED" : ""}
      </div>
      <h2>{titles[state.stage]}</h2>
      <p>
        Stage {GUIDE_STAGES.indexOf(state.stage) + 1} of 6 ·{" "}
        {state.mode === "manual" ? "Manual" : "Automatic"}
      </p>
      <label>
        Playback mode{" "}
        <select
          aria-label="Playback mode"
          value={state.mode}
          onChange={(e) => onMode(e.target.value as PlaybackMode)}
        >
          <option value="manual">Manual</option>
          <option value="automatic">Automatic</option>
        </select>
      </label>
      <p role="status">
        {state.readiness === "unavailable"
          ? "Diagnosis unavailable. Retry diagnosis explicitly in the workspace, or exit."
          : state.readiness === "waiting"
            ? t < 12
              ? "Waiting for the simulation milestone."
              : "Diagnosis pending. Waiting for the backend result."
            : state.stage === "maintenance-handoff"
              ? "Walkthrough ends here. No ticket has been created."
              : "Ready to advance."}
      </p>
      {state.stage === "introduction" && (
        <p>
          This simulated robot picks, carries, and places a part. Follow the
          Dropped Object demonstration, seed 42. Next opens Robot Operation;
          Previous revisits explanations without rewinding.
        </p>
      )}

      {(state.stage === "robot-operation" ||
        state.stage === "fault-detection") && (
        <p>
          {t < 6
            ? "The arm follows its joint trajectory. At transfer, watch the object and vacuum signal."
            : t < 12
              ? "Object presence was lost while HOLD was commanded at the loss. Post-place verification will complete the evidence."
              : result
                ? result.summary
                : backendError
                  ? "Backend request failed. Retry diagnosis in the workspace below; results are never fabricated."
                  : "Computing the result through FastAPI…"}
        </p>
      )}
      {state.stage === "evidence-investigation" && result && (
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
      {state.stage === "diagnosis" && result && (
        <>
          <p>{result.hypotheses[0]?.cause ?? result.summary}</p>
          <p>
            <b>Recommended check:</b>{" "}
            {result.hypotheses[0]?.check ??
              "Inspect the evidence before drawing a conclusion."}
          </p>
          <p className="muted">
            A plausible cause is not a proven root cause. Operator checks
            require real verification; this walkthrough does not record an
            outcome.
          </p>
        </>
      )}
      {state.stage === "evidence-investigation" &&
        result &&
        !result.observations.some((o) =>
          o.evidence.some((id) => result.timeline.some((row) => row.id === id)),
        ) && (
          <p>
            Expected evidence reference unavailable. Review the available
            recorded readings; no evidence is fabricated.
          </p>
        )}
      {state.stage === "maintenance-handoff" && (
        <p>
          Ticket creation is not available in this walkthrough yet. Explicit
          confirmation is deferred to GD-02B-4. No maintenance ticket has been
          saved. Existing manual maintenance forms remain available outside the
          walkthrough.
        </p>
      )}
      <div
        className="narration-panel"
        role="group"
        aria-label="Voice narration"
      >
        <div className="narration-actions">
          <button onClick={narration.toggleMute} aria-pressed={narration.muted}>
            {narration.muted ? "Unmute narration" : "Mute narration"}
          </button>
          <button
            onClick={narration.replay}
            disabled={narration.muted || !narration.supported}
          >
            Replay narration
          </button>
        </div>
        <p className="narration-status" aria-live="polite">
          {narration.status === "unavailable"
            ? "Text-only · no local English voice available."
            : narration.status === "error"
              ? "Voice unavailable · text remains available. Use Replay to retry."
              : narration.status === "muted"
                ? "Narration muted · text remains available."
                : narration.status === "paused"
                  ? "Narration paused · Replay reads this cue without resuming the demo."
                  : narration.status === "stopped"
                    ? "Narration stopped · use Replay to continue."
                    : narration.status === "speaking"
                      ? "Narration speaking"
                      : "Narration ready"}
          {narration.voiceName &&
          !["unavailable", "error"].includes(narration.status)
            ? ` · ${narration.voiceName}`
            : ""}
        </p>
        <p className="narration-text">
          <b>Narration text:</b> {narration.text}
        </p>
      </div>
      <div className="guide-controls">
        {state.paused ? (
          <button onClick={onResume}>Resume demo</button>
        ) : (
          <button onClick={onPause}>Pause demo</button>
        )}
        <button onClick={onReset}>Reset demo</button>
        <button
          onClick={onPrevious}
          disabled={state.paused || state.stage === "introduction"}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={
            state.paused ||
            state.readiness !== "ready" ||
            state.stage === "maintenance-handoff"
          }
        >
          Next
        </button>
        <button onClick={onExit}>Exit walkthrough</button>
      </div>
    </section>
  );
}
