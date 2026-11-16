import { useEffect, useLayoutEffect, useReducer, useRef } from "react";
import {
  GUIDE_READING_MS,
  GUIDE_STAGES,
  guideReadiness,
  guideReducer,
  type PlaybackMode,
  type Token,
} from "./guided";
import type { Clock, Diagnosis } from "./model";
import { endTime } from "./scenarios";
type Actions = {
  reset: () => void;
  selectDrop: () => void;
  play: () => void;
  pause: () => void;
  showOperations: () => void;
};
// No API access and no ticket-attempt ownership: B-1 cannot persist a ticket.
export function useGuidedDemo(
  clock: Clock,
  result: Diagnosis | null,
  actions: Actions,
  error = "",
  readingMs = GUIDE_READING_MS,
) {
  const [state, dispatch] = useReducer(guideReducer, null);
  const epoch = useRef(0);
  const active = useRef<Token | null>(null);
  const latest = useRef(actions);
  const playback = useRef("");
  const internalFragment = useRef<string | null>(null);
  useLayoutEffect(() => {
    latest.current = actions;
  });
  useLayoutEffect(() => {
    active.current = state;
    return () => {
      active.current = null;
    };
  }, [state?.epoch, state?.entry]);
  const owns = (token: Token | null) =>
    !!token &&
    epoch.current === token.epoch &&
    active.current?.epoch === token.epoch &&
    active.current.entry === token.entry;
  function send(type: "next" | "previous" | "pause" | "resume" | "stop") {
    if (!owns(state)) return;
    if ((type === "next" || type === "previous") && state!.paused) return;
    if (
      type === "next" &&
      (state!.readiness !== "ready" || state!.stage === "maintenance-handoff")
    )
      return;
    // The reducer consumes entry tokens, rejecting queued duplicate/stale events.
    if (
      (type === "pause" && state!.paused) ||
      (type === "resume" && !state!.paused) ||
      (type === "previous" && state!.stage === "introduction")
    )
      return;
    if (["previous", "pause", "stop"].includes(type)) latest.current.pause();
    if (type === "stop") epoch.current++;
    dispatch({ type, token: state! });
  }
  function interrupt(exit: boolean) {
    if (!state || state.epoch !== epoch.current) return;
    const run = epoch.current;
    latest.current.pause();
    if (exit) epoch.current++;
    dispatch({ type: "interrupt", epoch: run, exit });
  }
  function start() {
    const run = ++epoch.current;
    internalFragment.current = null;
    active.current = null;
    playback.current = "";
    latest.current.reset();
    latest.current.selectDrop();
    latest.current.showOperations();
    dispatch({ type: "start", epoch: run });
    if (document.hidden)
      dispatch({ type: "interrupt", epoch: run, exit: false });
  }
  function mode(mode: PlaybackMode) {
    if (!owns(state) || state!.mode === mode) return;
    dispatch({ type: "mode", token: state!, mode });
  }
  useEffect(() => {
    if (!state || !owns(state)) return;
    dispatch({
      type: "observe",
      token: state,
      readiness: guideReadiness(state.stage, clock, result, error),
    });
    if (state.paused) return;
    const index = GUIDE_STAGES.indexOf(state.stage);
    const shouldPlay =
      index === state.frontier &&
      ((state.stage === "robot-operation" &&
        guideReadiness(state.stage, clock, result, error) === "waiting") ||
        (state.stage === "fault-detection" && clock.t < endTime("drop")));
    const shouldPause =
      state.stage === "robot-operation" && !shouldPlay && clock.running;
    const key = `${state.epoch}:${state.entry}:${shouldPlay ? "play" : "pause"}`;
    if (
      key !== playback.current &&
      ((shouldPlay && !clock.running) || shouldPause)
    ) {
      playback.current = key;
      if (shouldPlay) latest.current.play();
      else latest.current.pause();
    }
  }, [
    state?.epoch,
    state?.entry,
    state?.paused,
    clock.t,
    clock.running,
    result,
    error,
  ]);
  useEffect(() => {
    if (
      !state ||
      state.paused ||
      state.mode !== "automatic" ||
      state.readiness !== "ready" ||
      state.stage === "maintenance-handoff"
    )
      return;
    const token = state;
    const duration = Number.isFinite(readingMs)
      ? Math.max(100, Math.min(60000, readingMs))
      : GUIDE_READING_MS;
    let live = true;
    const timer = setTimeout(() => {
      if (!live || !owns(token)) return;
      dispatch({ type: "timer", token });
    }, duration);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [
    state?.epoch,
    state?.entry,
    state?.readiness,
    state?.mode,
    state?.paused,
    readingMs,
  ]);
  useEffect(() => {
    function pauseHidden() {
      if (document.hidden) interrupt(false);
    }
    function recordInternalClick(event: MouseEvent) {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      const href = anchor?.getAttribute("href");
      internalFragment.current =
        !event.defaultPrevented && href?.startsWith("#evidence-") ? href : null;
    }
    function exit() {
      // Chrome emits popstate before hashchange for a native fragment click.
      // Only the matching user click is internal; Back/Forward still exits.
      if (internalFragment.current !== location.hash) interrupt(true);
    }
    function hash() {
      const internal = internalFragment.current === location.hash;
      internalFragment.current = null;
      if (!internal) interrupt(true);
    }
    function pageHide() {
      interrupt(false);
    }
    document.addEventListener("click", recordInternalClick);
    document.addEventListener("visibilitychange", pauseHidden);
    window.addEventListener("pagehide", pageHide);
    window.addEventListener("popstate", exit);
    window.addEventListener("hashchange", hash);
    return () => {
      document.removeEventListener("click", recordInternalClick);
      document.removeEventListener("visibilitychange", pauseHidden);
      window.removeEventListener("pagehide", pageHide);
      window.removeEventListener("popstate", exit);
      window.removeEventListener("hashchange", hash);
    };
  }, [state]);
  useEffect(
    () => () => {
      latest.current.pause();
    },
    [],
  );
  return {
    state,
    start,
    stop: () => send("stop"),
    takeover: () => interrupt(true),
    pause: () => send("pause"),
    resume: () => send("resume"),
    next: () => send("next"),
    previous: () => send("previous"),
    mode,
  };
}
