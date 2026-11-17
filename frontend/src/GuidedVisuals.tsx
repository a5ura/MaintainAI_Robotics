import { GUIDE_STAGES, type GuideState } from "./guided";
import { GUIDE_TARGETS, TARGET_LABELS } from "./guideTargets";
import { useGuideVisuals } from "./useGuideVisuals";
export default function GuidedVisuals({
  state,
  handoffExplanation,
}: {
  state: GuideState;
  handoffExplanation?: string;
}) {
  const visuals = useGuideVisuals(state);
  const spec = state ? GUIDE_TARGETS[state.stage] : null;
  // Reuse the current readable narration cue, independent of speech support/mute.
  // This is presentation only; attempt and guide ownership remain in App.
  const why =
    state?.stage === "maintenance-handoff"
      ? handoffExplanation || spec?.why
      : spec?.why;
  return (
    <>
      <p
        id="guided-focus-description"
        className="guide-sr-only"
        role={state ? "status" : undefined}
        aria-live="polite"
        aria-atomic="true"
      >
        {state && spec
          ? `Stage ${GUIDE_STAGES.indexOf(state.stage) + 1} of 6. ${spec.title}. ${why}`
          : ""}
      </p>
      {state && spec && (
        <nav
          className="guide-navigation"
          data-guide-navigation
          aria-label="Guided visual navigation"
        >
          <div className="guide-navigation-copy">
            <strong>
              Stage {GUIDE_STAGES.indexOf(state.stage) + 1} / 6 · {spec.title}
              {state.paused ? " · Paused" : ""}
            </strong>
            <p>{why}</p>
            <p className="guide-controls-hint">
              Use Next / Previous in Walkthrough controls.
            </p>
          </div>
          <div className="guide-navigation-actions">
            <button onClick={() => visuals.reveal(spec.primary)}>
              Show focus area
            </button>
            {spec.secondary.map((id) => (
              <button key={id} onClick={() => visuals.reveal(id)}>
                Show {TARGET_LABELS[id]}
              </button>
            ))}
            <button className="primary" onClick={visuals.controls}>
              Walkthrough controls
            </button>
          </div>
          {visuals.missing && (
            <p className="guide-target-unavailable">
              Focus area is unavailable. Walkthrough controls and text remain
              available.
            </p>
          )}
        </nav>
      )}
    </>
  );
}
