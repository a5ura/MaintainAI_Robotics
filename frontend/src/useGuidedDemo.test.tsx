// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useGuidedDemo } from "./useGuidedDemo";
import type { Clock, Diagnosis } from "./model";
import computed from "../../fixtures/guide-diagnosis.json";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
function mount(strict = false) {
  vi.useFakeTimers();
  const actions = {
    reset: vi.fn(),
    selectDrop: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    showOperations: vi.fn(),
  };
  const initialProps: {
    clock: Clock;
    result: Diagnosis | null;
    error: string;
  } = { clock: { t: 0, running: false }, result: null, error: "" };
  const hook = renderHook(
    (p) => useGuidedDemo(p.clock, p.result, actions, p.error, 1000),
    { initialProps, wrapper: strict ? StrictMode : undefined },
  );
  act(() => hook.result.current.start());
  return { ...hook, actions, initialProps };
}
it.each([false, true])(
  "does not repeat initialization/entry effects on rapid events, rerenders or Strict Mode=%s",
  (strict) => {
    const h = mount(strict);
    expect(h.actions.reset).toHaveBeenCalledTimes(1);
    expect(h.actions.selectDrop).toHaveBeenCalledTimes(1);
    expect(h.actions.play).not.toHaveBeenCalled();
    const oldNext = h.result.current.next;
    act(() => {
      oldNext();
      oldNext();
    });
    expect(h.result.current.state?.stage).toBe("robot-operation");
    expect(h.actions.play).toHaveBeenCalledTimes(1);
    h.rerender({ ...h.initialProps, clock: { t: 1, running: true } });
    act(() => oldNext());
    expect(h.result.current.state?.stage).toBe("robot-operation");
    h.rerender({ ...h.initialProps, clock: { t: 6, running: false } });
    act(() => h.result.current.next());
    expect(h.actions.play).toHaveBeenCalledTimes(2);
    h.rerender({
      ...h.initialProps,
      clock: { t: 12, running: false },
      result: computed as unknown as Diagnosis,
    });
    act(() => h.result.current.previous());
    act(() => h.result.current.next());
    expect(h.actions.play).toHaveBeenCalledTimes(2);
    expect(h.actions.reset).toHaveBeenCalledTimes(1);
  },
);
it("fresh dwell is required after mode switches and resume; stale timers cannot advance", () => {
  const h = mount();
  const spy = vi.spyOn(globalThis, "setTimeout");
  act(() => h.result.current.mode("automatic"));
  const staleTimer = spy.mock.calls.at(-1)![0] as () => void;
  act(() => vi.advanceTimersByTime(900));
  act(() => h.result.current.mode("manual"));
  act(() => staleTimer());
  expect(h.result.current.state?.stage).toBe("introduction");
  act(() => h.result.current.mode("automatic"));
  act(() => vi.advanceTimersByTime(900));
  act(() => h.result.current.pause());
  act(() => vi.advanceTimersByTime(5000));
  act(() => h.result.current.resume());
  act(() => vi.advanceTimersByTime(999));
  expect(h.result.current.state?.stage).toBe("introduction");
  act(() => vi.advanceTimersByTime(1));
  expect(h.result.current.state?.stage).toBe("robot-operation");
  act(() => vi.advanceTimersByTime(20000));
  expect(h.result.current.state?.stage).toBe("robot-operation");
});
it("old callbacks cannot affect a restarted run, exited run or remounted controller", () => {
  const h = mount();
  const old = h.result.current;
  act(() => h.result.current.stop());
  act(() => old.next());
  expect(h.result.current.state).toBeNull();
  act(() => h.result.current.start());
  act(() => {
    old.next();
    old.pause();
  });
  expect(h.result.current.state?.stage).toBe("introduction");
  expect(h.result.current.state?.paused).toBe(false);
  h.unmount();
  const next = mount(true);
  act(() => old.next());
  expect(next.result.current.state?.stage).toBe("introduction");
});

it("visibility interruption wins over queued mode/navigation work and never resumes automatically", () => {
  const h = mount();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => {
    h.result.current.mode("automatic");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(h.result.current.state?.paused).toBe(true);
  act(() => vi.advanceTimersByTime(10000));
  expect(h.result.current.state?.stage).toBe("introduction");
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(h.result.current.state?.paused).toBe(true);
});

it("repeated hidden/pagehide events while paused never strand Resume", () => {
  const h = mount();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
  });
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  act(() => h.result.current.resume());
  expect(h.result.current.state?.paused).toBe(false);
  act(() => h.result.current.next());
  expect(h.result.current.state?.stage).toBe("robot-operation");
});

it("an evidence click survives Chrome's paired history events, while Back/Forward exits", () => {
  const h = mount();
  const anchor = document.createElement("a");
  anchor.href = "#evidence-E6";
  document.body.append(anchor);
  try {
    act(() => anchor.click());
    history.replaceState(null, "", "#evidence-E6");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(h.result.current.state?.stage).toBe("introduction");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(h.result.current.state).toBeNull();
  } finally {
    anchor.remove();
    history.replaceState(null, "", location.pathname);
  }
});
