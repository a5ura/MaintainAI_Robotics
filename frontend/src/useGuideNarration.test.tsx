// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useGuideNarration } from "./useGuideNarration";
import type { NarrationSnapshot } from "./guideNarration";
import { fakeVoice, installSpeech } from "./testSpeech";
const sim: NarrationSnapshot = {
  state: { stage: "simulation", paused: false, skipTour: false },
  t: 0,
  result: null,
  backendError: "",
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function mount(strict = false) {
  const hook = renderHook(
    (snapshot: NarrationSnapshot) => useGuideNarration(snapshot),
    {
      initialProps: { ...sim, state: null } as NarrationSnapshot,
      wrapper: strict ? StrictMode : undefined,
    },
  );
  const begin = () => {
    act(() => hook.result.current.start());
    hook.rerender(sim);
  };
  return { ...hook, begin };
}
it("is enabled but silent before interaction; Strict Mode and clock rerenders do not duplicate speech", () => {
  const { spoken } = installSpeech();
  const h = mount(true);
  expect(h.result.current.muted).toBe(false);
  expect(spoken).toHaveLength(0);
  h.begin();
  expect(spoken).toHaveLength(1);
  expect(spoken[0].text).toContain("simulated robot");
  h.rerender({ ...sim, t: 1 });
  h.rerender({ ...sim, t: 2 });
  expect(spoken).toHaveLength(1);
  expect(h.result.current.status).toBe("speaking");
});
it("replaces rapid cues and ignores stale asynchronous speech events", () => {
  const { spoken } = installSpeech();
  const h = mount();
  h.begin();
  const oldEnd = spoken[0].onend!,
    oldError = spoken[0].onerror!;
  h.rerender({ ...sim, t: 6 });
  h.rerender({ ...sim, t: 12 });
  expect(spoken.map((s) => s.text)).toEqual([
    "This simulated robot picks, carries, and places a part.",
    "Simulated presence is lost while hold remains commanded.",
    "MaintainAI is comparing the recorded evidence.",
  ]);
  act(() => {
    oldEnd.call(spoken[0], {} as SpeechSynthesisEvent);
    oldError.call(spoken[0], {
      error: "synthesis-failed",
    } as SpeechSynthesisErrorEvent);
  });
  expect(h.result.current.status).toBe("speaking");
});
it("Mute/Unmute/Replay preserve mute across runs and never replay a stale cue", () => {
  const { spoken } = installSpeech();
  const h = mount();
  h.begin();
  act(() => h.result.current.toggleMute());
  h.rerender({ ...sim, t: 6 });
  act(() => h.result.current.replay());
  expect(spoken).toHaveLength(1);
  act(() => h.result.current.start());
  h.rerender(sim);
  expect(h.result.current.muted).toBe(true);
  expect(spoken).toHaveLength(1);
  act(() => h.result.current.toggleMute());
  expect(spoken).toHaveLength(2);
  act(() => h.result.current.replay());
  expect(spoken).toHaveLength(3);
});
it("pause cancels, Replay can read while paused, Resume restarts, and Skip replaces the old cue", () => {
  const { spoken, synth } = installSpeech();
  const h = mount();
  h.begin();
  act(() => h.result.current.pause());
  h.rerender({ ...sim, state: { ...sim.state!, paused: true } });
  expect(synth.cancel).toHaveBeenCalled();
  expect(h.result.current.status).toBe("paused");
  act(() => h.result.current.replay());
  expect(spoken).toHaveLength(2);
  act(() => h.result.current.resume());
  h.rerender(sim);
  expect(spoken).toHaveLength(3); // Resume restarts even a paused Replay.
  act(() => h.result.current.skip());
  h.rerender({ ...sim, t: 12 });
  expect(spoken.at(-1)?.text).toContain("comparing");
  const n = spoken.length;
  act(() => h.result.current.start());
  h.rerender(sim);
  expect(spoken).toHaveLength(n + 1);
  expect(spoken.at(-1)?.text).toContain("simulated robot");
});
it.each([{ voices: [] }, { voices: [fakeVoice("Remote", "en-US", false)] }])(
  "uses text only for missing or remote-only voices %s",
  ({ voices }) => {
    const { spoken } = installSpeech(voices);
    const h = mount();
    h.begin();
    expect(spoken).toHaveLength(0);
    expect(h.result.current.status).toBe("unavailable");
    act(() => h.result.current.pause());
    h.rerender({ ...sim, state: { ...sim.state!, paused: true } });
    expect(h.result.current.status).toBe("unavailable");
    expect(h.result.current.text).toContain("simulated robot");
  },
);
it("delayed discovery speaks only the current cue and repeated voice events do not replay", () => {
  const s = installSpeech([]);
  const h = mount();
  h.begin();
  h.rerender({ ...sim, t: 6 });
  act(() => s.setVoices([fakeVoice()]));
  expect(s.spoken).toHaveLength(1);
  expect(s.spoken[0].text).toContain("presence is lost");
  act(() => s.setVoices([fakeVoice()]));
  expect(s.spoken).toHaveLength(1);
  act(() => s.setVoices([fakeVoice("Remote", "en-US", false)]));
  expect(h.result.current.status).toBe("unavailable");
});
it.each(["not-allowed", "synthesis-failed", "voice-unavailable"])(
  "recovers from %s only after explicit interaction",
  (error) => {
    const s = installSpeech();
    const h = mount();
    h.begin();
    act(() =>
      s.spoken[0].onerror!.call(s.spoken[0], {
        error,
      } as SpeechSynthesisErrorEvent),
    );
    expect(h.result.current.status).toBe("error");
    h.rerender({ ...sim, t: 6 });
    expect(s.spoken).toHaveLength(1);
    act(() => h.result.current.replay());
    expect(s.spoken).toHaveLength(2);
    expect(h.result.current.status).toBe("speaking");
  },
);
it("falls back when the API is absent or throws synchronously", () => {
  vi.stubGlobal("speechSynthesis", undefined);
  const h = mount();
  h.begin();
  expect(h.result.current.status).toBe("unavailable");
  h.unmount();
  const s = installSpeech();
  s.synth.speak.mockImplementation(() => {
    throw new Error("denied");
  });
  const next = mount();
  next.begin();
  expect(next.result.current.status).toBe("error");
});
it("times out a silent engine without touching guide progression", () => {
  vi.useFakeTimers();
  const s = installSpeech();
  s.synth.speak.mockImplementation((speech) => {
    s.spoken.push(speech);
  });
  const h = mount();
  h.begin();
  act(() => vi.advanceTimersByTime(5000));
  expect(h.result.current.status).toBe("error");
  expect(s.spoken).toHaveLength(1);
});
it("hiding stops speech; becoming visible or receiving a voice event cannot restart it", () => {
  const s = installSpeech();
  const h = mount();
  h.begin();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    s.setVoices([fakeVoice()]);
  });
  h.rerender({ ...sim, t: 6 });
  expect(s.spoken).toHaveLength(1);
  act(() => h.result.current.replay());
  expect(s.spoken).toHaveLength(2);
});
it("manual navigation stays silent until explicit interaction; unmount cleans listeners and callbacks", () => {
  const s = installSpeech();
  const h = mount();
  h.begin();
  const stale = s.spoken[0].onstart!;
  act(() => h.result.current.stop());
  h.rerender({ ...sim, t: 6 });
  act(() => s.setVoices([fakeVoice()]));
  expect(s.spoken).toHaveLength(1);
  act(() => h.result.current.replay());
  const count = s.spoken.length;
  h.unmount();
  act(() => {
    s.setVoices([fakeVoice()]);
    stale.call(s.spoken[0], {} as SpeechSynthesisEvent);
  });
  expect(s.spoken).toHaveLength(count);
});
it("the completion cue survives a parent rerender and does not repeat", () => {
  const s = installSpeech();
  const h = mount();
  h.begin();
  const complete = {
    ...sim,
    state: { ...sim.state!, stage: "complete" as const, ticketId: "T1" },
  };
  h.rerender(complete);
  const count = s.spoken.length;
  h.rerender({ ...complete });
  expect(s.spoken).toHaveLength(count);
  expect(s.spoken.at(-1)?.text).toContain("technician review");
});
it("page exit stops speech and requires a new explicit interaction", () => {
  const s = installSpeech();
  const h = mount();
  h.begin();
  act(() => window.dispatchEvent(new Event("pagehide")));
  expect(h.result.current.status).toBe("stopped");
  h.rerender({ ...sim, t: 6 });
  act(() => s.setVoices([fakeVoice()]));
  expect(s.spoken).toHaveLength(1);
  act(() => h.result.current.replay());
  expect(s.spoken).toHaveLength(2);
});
it("finished utterances cannot later report errors or restart on voice discovery", () => {
  vi.useFakeTimers();
  const s = installSpeech();
  const h = mount();
  h.begin();
  const lateError = s.spoken[0].onerror!;
  act(() => s.spoken[0].onend!.call(s.spoken[0], {} as SpeechSynthesisEvent));
  act(() => {
    lateError.call(s.spoken[0], {
      error: "synthesis-failed",
    } as SpeechSynthesisErrorEvent);
    s.setVoices([fakeVoice()]);
    vi.advanceTimersByTime(30000);
  });
  expect(h.result.current.status).toBe("ready");
  expect(s.spoken).toHaveLength(1);
});

it("evidence/hash and history navigation stop narration without changing guide state", () => {
  const s = installSpeech();
  const h = mount();
  h.begin();
  act(() => window.dispatchEvent(new Event("hashchange")));
  expect(h.result.current.status).toBe("stopped");
  h.rerender({ ...sim, t: 6 });
  expect(s.spoken).toHaveLength(1);
  act(() => h.result.current.replay());
  act(() => window.dispatchEvent(new Event("popstate")));
  expect(h.result.current.status).toBe("stopped");
  expect(s.spoken).toHaveLength(2);
});
