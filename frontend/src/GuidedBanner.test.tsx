// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import GuidedBanner from "./GuidedBanner";
import type { NarrationControls } from "./useGuideNarration";
afterEach(cleanup);
function show(narration: Partial<NarrationControls> = {}) {
  const controls = {
    muted: false,
    status: "ready" as const,
    supported: true,
    voiceName: "Microsoft David",
    text: "A visible cue",
    toggleMute: vi.fn(),
    replay: vi.fn(),
    ...narration,
  };
  const actions = {
    onPause: vi.fn(),
    onResume: vi.fn(),
    onReset: vi.fn(),
    onSkip: vi.fn(),
    onManual: vi.fn(),
    onRetry: vi.fn(),
  };
  render(
    <GuidedBanner
      state={{ stage: "simulation", paused: false, skipTour: false }}
      t={0}
      result={null}
      backendError=""
      narration={controls}
      {...actions}
    />,
  );
  return { controls, actions };
}
it("keeps text visible and narration actions isolated from guide actions", () => {
  const { controls, actions } = show();
  expect(
    screen.getByText(/The arm follows its joint trajectory/),
  ).toBeInTheDocument();
  expect(screen.getByText(/A visible cue/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mute narration" }));
  fireEvent.click(screen.getByRole("button", { name: "Replay narration" }));
  expect(controls.toggleMute).toHaveBeenCalledOnce();
  expect(controls.replay).toHaveBeenCalledOnce();
  Object.values(actions).forEach((action) =>
    expect(action).not.toHaveBeenCalled(),
  );
});
it("shows text-only fallback and leaves the existing guide controls usable", () => {
  show({ supported: false, status: "unavailable" });
  expect(
    screen.getByText(/Text-only · no local English voice/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Replay narration" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Skip to Results" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Pause demo" })).toBeEnabled();
});
