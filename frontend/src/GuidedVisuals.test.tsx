// @vitest-environment jsdom
import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import GuidedVisuals from "./GuidedVisuals";
import { initialGuide, GUIDE_STAGES, type ActiveGuide } from "./guided";
import { GUIDE_TARGETS } from "./guideTargets";
import { visibleTarget, useGuideVisuals } from "./useGuideVisuals";
import { renderHook } from "@testing-library/react";
let frames: Map<number, FrameRequestCallback>, nextFrame: number;
let mutations: MutationCallback[],
  resizes: ResizeObserverCallback[],
  disconnects: ReturnType<typeof vi.fn>[];
let reduced: boolean;
let mediaChange: (() => void) | undefined;
const rect = (top: number, height = 80) => ({
  top,
  bottom: top + height,
  height,
  width: 300,
  left: 0,
  right: 300,
  x: 0,
  y: top,
  toJSON: () => ({}),
});
beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  mutations = [];
  resizes = [];
  disconnects = [];
  reduced = false;
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => frames.delete(id)),
  );
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_: string, cb: () => void) => {
        mediaChange = cb;
      },
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "MutationObserver",
    class {
      disconnect = vi.fn();
      observe = vi.fn();
      constructor(cb: MutationCallback) {
        mutations.push(cb);
        disconnects.push(this.disconnect);
      }
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      disconnect = vi.fn();
      observe = vi.fn();
      constructor(cb: ResizeObserverCallback) {
        resizes.push(cb);
        disconnects.push(this.disconnect);
      }
    },
  );
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
    function (this: HTMLElement) {
      return (this.hidden || this.style.display === "none"
        ? []
        : [rect(1000)]) as unknown as DOMRectList;
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return this.hasAttribute("data-guide-navigation")
        ? rect(0, 100)
        : rect(1000);
    },
  );
});
afterEach(() => {
  cleanup();
  document.querySelectorAll("[data-fixture]").forEach((e) => e.remove());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function frame() {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((cb) => cb(0));
  });
}
function target(id: string) {
  const element = document.createElement("section");
  element.dataset.guideTarget = id;
  element.dataset.fixture = "true";
  element.tabIndex = -1;
  document.body.append(element);
  return element;
}
function changeDOM() {
  act(() => mutations.forEach((cb) => cb([], {} as MutationObserver)));
}
it.each(GUIDE_STAGES)(
  "maps stage %s onto actual primary and secondary anchors",
  (stage) => {
    const spec = GUIDE_TARGETS[stage];
    const primary = target(spec.primary);
    const secondary = spec.secondary.map(target);
    render(<GuidedVisuals state={{ ...initialGuide(1), stage }} />);
    frame();
    expect(primary).toHaveAttribute("data-guide-highlight", "primary");
    secondary.forEach((e) =>
      expect(e).toHaveAttribute("data-guide-highlight", "secondary"),
    );
    expect(primary).toHaveAttribute(
      "aria-describedby",
      "guided-focus-description",
    );
    expect(screen.getByRole("status")).toHaveTextContent(spec.title);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  },
);
it("does not scroll, steal focus or announce again on clock/readiness/mode/pause rerenders", () => {
  target("workcell");
  const field = document.createElement("input");
  field.dataset.fixture = "true";
  document.body.append(field);
  field.focus();
  const { rerender } = render(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  act(() => window.dispatchEvent(new Event("scrollend")));
  const live = screen.getByRole("status");
  const announcement = live.textContent;
  rerender(
    <GuidedVisuals state={{ ...initialGuide(1), paused: true, entry: 1 }} />,
  );
  rerender(
    <GuidedVisuals
      state={{ ...initialGuide(1), mode: "automatic", entry: 2 }}
    />,
  );
  frame();
  expect(scrollTo).toHaveBeenCalledTimes(1);
  expect(field).toHaveFocus();
  expect(live.textContent).toBe(announcement);
});
it("skips unnecessary scrolling when the target is already clearly visible", () => {
  const primary = target("workcell");
  primary.getBoundingClientRect = () => rect(150, 100) as DOMRect;
  render(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  expect(scrollTo).not.toHaveBeenCalled();
});
it("reduced motion is immediate and changing the preference cancels owned smooth scrolling", () => {
  target("workcell");
  const { rerender } = render(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  expect(scrollTo).toHaveBeenLastCalledWith(
    expect.objectContaining({ behavior: "smooth" }),
  );
  reduced = true;
  act(() => mediaChange?.());
  expect(scrollTo).toHaveBeenLastCalledWith(
    expect.objectContaining({ behavior: "instant" }),
  );
  rerender(<GuidedVisuals state={initialGuide(2)} />);
  frame();
  expect(scrollTo).toHaveBeenLastCalledWith(
    expect.objectContaining({ behavior: "instant" }),
  );
});
it("handles missing, hidden, removed and replaced targets without leaving stale highlights", () => {
  render(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  expect(screen.getByText(/Focus area is unavailable/)).toBeVisible();
  const element = target("workcell");
  element.hidden = true;
  changeDOM();
  expect(visibleTarget(element)).toBe(false);
  element.hidden = false;
  changeDOM();
  frame();
  expect(element).toHaveAttribute("data-guide-highlight");
  element.remove();
  changeDOM();
  expect(element).not.toHaveAttribute("data-guide-highlight");
  const replacement = target("workcell");
  changeDOM();
  frame();
  expect(replacement).toHaveAttribute("data-guide-highlight", "primary");
});
it("stale frames and observer callbacks cannot scroll or reattach after exit/reset", () => {
  const element = target("workcell");
  element.setAttribute("aria-describedby", "original");
  const { rerender, unmount } = render(
    <GuidedVisuals state={initialGuide(1)} />,
  );
  const stale = [...frames.values()][0];
  const oldMutation = mutations[0];
  const oldResize = resizes[0];
  rerender(<GuidedVisuals state={null} />);
  act(() => {
    stale(0);
    oldMutation([], {} as MutationObserver);
    oldResize([], {} as ResizeObserver);
  });
  expect(scrollTo).not.toHaveBeenCalled();
  expect(element).not.toHaveAttribute("data-guide-highlight");
  expect(element).toHaveAttribute("aria-describedby", "original");
  expect(document.documentElement).not.toHaveAttribute("data-guide-active");
  rerender(<GuidedVisuals state={initialGuide(2)} />);
  frame();
  expect(element).toHaveAttribute("data-guide-highlight");
  unmount();
  expect(disconnects.every((fn) => fn.mock.calls.length === 1)).toBe(true);
});
it("updates bounds natively and reveals on viewport resize without changing stage", () => {
  target("workcell");
  render(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  act(() => window.dispatchEvent(new Event("scrollend")));
  vi.mocked(scrollTo).mockClear();
  act(() => window.dispatchEvent(new Event("resize")));
  frame();
  expect(scrollTo).toHaveBeenCalledWith(
    expect.objectContaining({ behavior: "instant" }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Stage 1 of 6");
});
it("focuses only explicit non-action targets and restores focus on owned exit", () => {
  const entry = document.createElement("button");
  entry.dataset.guideStart = "";
  entry.dataset.fixture = "true";
  document.body.append(entry);
  const primary = target("workcell");
  const { rerender } = render(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  fireEvent.click(screen.getByRole("button", { name: "Show focus area" }));
  frame();
  expect(primary).toHaveFocus();
  rerender(<GuidedVisuals state={null} />);
  expect(entry).toHaveFocus();
});
it("does not steal focus from intentional navigation away", () => {
  target("workcell");
  const nav = document.createElement("button");
  nav.dataset.fixture = "true";
  document.body.append(nav);
  const { rerender } = render(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  nav.focus();
  rerender(<GuidedVisuals state={null} />);
  expect(nav).toHaveFocus();
});
it("Strict Mode cleanup leaves one activation; retained previous-stage navigation stays invalid", () => {
  const primary = target("workcell");
  target("fault-status");
  const h = renderHook(
    ({ state }: { state: ActiveGuide }) => useGuideVisuals(state),
    { initialProps: { state: initialGuide(1) }, wrapper: StrictMode },
  );
  const old = h.result.current.reveal;
  h.rerender({ state: { ...initialGuide(1), stage: "fault-detection" } });
  frame();
  act(() => window.dispatchEvent(new Event("scrollend")));
  vi.mocked(scrollTo).mockClear();
  h.rerender({ state: initialGuide(1) });
  frame();
  act(() => window.dispatchEvent(new Event("scrollend")));
  vi.mocked(scrollTo).mockClear();
  act(() => old("workcell"));
  frame();
  expect(scrollTo).not.toHaveBeenCalled();
  expect(primary).toHaveAttribute("data-guide-highlight");
  h.unmount();
  expect(primary).not.toHaveAttribute("data-guide-highlight");
});
it("hidden tabs and user input cancel owned motion without replaying it on visibility return", () => {
  target("workcell");
  render(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  vi.mocked(scrollTo).mockClear();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  frame();
  expect(scrollTo).not.toHaveBeenCalled();
});

it("inactive guidance exposes no empty status role that competes with maintenance notifications", () => {
  const { rerender } = render(<GuidedVisuals state={null} />);
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("navigation")).toBeNull();
  target("workcell");
  rerender(<GuidedVisuals state={initialGuide(1)} />);
  frame();
  expect(screen.getByRole("status")).toHaveTextContent("Introduction");
  rerender(<GuidedVisuals state={null} />);
  expect(screen.queryByRole("status")).toBeNull();
});
