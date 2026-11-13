import { useEffect, useRef, useState } from "react";
import {
  guideNarrationCue,
  INTRO_CUE,
  selectNarrationVoice,
  type NarrationCue,
  type NarrationSnapshot,
} from "./guideNarration";

type NarrationStatus =
  | "ready"
  | "speaking"
  | "paused"
  | "muted"
  | "unavailable"
  | "error"
  | "stopped";
export type NarrationControls = {
  muted: boolean;
  status: NarrationStatus;
  supported: boolean;
  voiceName: string;
  text: string;
  toggleMute: () => void;
  replay: () => void;
};

// This App-level controller has no simulation callbacks or API access.
export function useGuideNarration(snapshot: NarrationSnapshot) {
  const supported =
    typeof window !== "undefined" &&
    !!window.speechSynthesis &&
    typeof window.speechSynthesis.getVoices === "function" &&
    typeof window.speechSynthesis.speak === "function" &&
    typeof window.speechSynthesis.cancel === "function" &&
    typeof window.SpeechSynthesisUtterance === "function";
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<NarrationStatus>("unavailable");
  const [voiceName, setVoiceName] = useState("");
  const [revision, setRevision] = useState(0);
  const cue = guideNarrationCue(snapshot);
  const latest = useRef({ snapshot, cue });
  latest.current = { snapshot, cue };
  const voice = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generation = useRef(0),
    run = useRef(0),
    lastKey = useRef("");
  const started = useRef(false),
    blocked = useRef(false),
    failed = useRef(false);
  const mute = useRef(false),
    controlPaused = useRef(false);

  function cancel() {
    generation.current++;
    clearTimeout(watchdog.current);
    if (utterance.current) {
      utterance.current.onstart = null;
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* text remains usable */
      }
    }
  }
  function discover() {
    if (!supported) return undefined;
    try {
      const voices = window.speechSynthesis.getVoices();
      // Keep an available selected voice during a run; voiceschanged must not
      // restart an utterance just because a more preferred voice appeared.
      const previous = voice.current;
      const matching =
        previous &&
        voices.find(
          (v) =>
            v.voiceURI === previous.voiceURI &&
            v.name === previous.name &&
            v.lang === previous.lang &&
            v.localService === true &&
            v.lang.toLowerCase().startsWith("en"),
        );
      voice.current = matching ? previous : selectNarrationVoice(voices);
    } catch {
      voice.current = undefined;
    }
    setVoiceName(voice.current?.name ?? "");
    return voice.current;
  }
  function play(current: NarrationCue | null, allowPaused = false) {
    if (
      !current ||
      !started.current ||
      blocked.current ||
      failed.current ||
      mute.current ||
      document.hidden
    )
      return;
    if (
      !allowPaused &&
      (controlPaused.current || latest.current.snapshot.state?.paused)
    )
      return;
    const selected = voice.current;
    if (!supported || !selected) {
      setStatus("unavailable");
      return;
    }
    const key = `${run.current}:${current.id}:${current.text}`;
    if (lastKey.current === key) return;
    cancel();
    lastKey.current = key;
    const token = generation.current;
    const isCurrent = () => generation.current === token;
    const fail = () => {
      if (!isCurrent()) return;
      failed.current = true;
      cancel();
      setStatus("error");
    };
    try {
      const speech = new window.SpeechSynthesisUtterance(current.text);
      speech.voice = selected;
      speech.lang = selected.lang;
      speech.rate = 1;
      utterance.current = speech;
      speech.onstart = () => {
        if (isCurrent()) {
          clearTimeout(watchdog.current);
          watchdog.current = setTimeout(fail, 30000);
          setStatus("speaking");
        }
      };
      speech.onend = () => {
        if (isCurrent()) {
          clearTimeout(watchdog.current);
          utterance.current = null;
          generation.current++;
          setStatus("ready");
        }
      };
      speech.onerror = (event) => {
        if (!isCurrent()) return;
        if (event.error === "canceled" || event.error === "interrupted") {
          cancel();
          setStatus("stopped");
        } else fail();
      };
      // A silent engine must not leave a permanent "speaking" indicator.
      watchdog.current = setTimeout(fail, 5000);
      window.speechSynthesis.speak(speech);
    } catch {
      fail();
    }
  }
  function start() {
    cancel();
    run.current++;
    lastKey.current = "";
    started.current = true;
    blocked.current = false;
    failed.current = false;
    controlPaused.current = false;
    voice.current = undefined;
    discover();
    if (mute.current) setStatus("muted");
    else play(INTRO_CUE, true); // synchronous user activation; never the previous run's cue
  }
  function stop() {
    started.current = false;
    blocked.current = true;
    cancel();
    lastKey.current = "";
    setStatus(mute.current ? "muted" : "stopped");
  }
  function pause() {
    controlPaused.current = true;
    cancel();
    lastKey.current = "";
    setStatus(
      mute.current ? "muted" : voice.current ? "paused" : "unavailable",
    );
  }
  function resume() {
    cancel();
    lastKey.current = "";
    controlPaused.current = false;
    blocked.current = false;
    started.current = true;
    failed.current = false;
    discover();
    play(latest.current.cue, true);
  }
  function skip() {
    cancel();
    lastKey.current = "";
    controlPaused.current = false;
    started.current = true;
    blocked.current = false;
    failed.current = false;
    // Reconcile after the guide's existing skip callback updates its own state.
    setRevision((n) => n + 1);
  }
  function replay() {
    if (mute.current) return;
    cancel();
    lastKey.current = "";
    blocked.current = false;
    started.current = true;
    failed.current = false;
    discover();
    play(latest.current.cue, true);
  }
  function toggleMute() {
    mute.current = !mute.current;
    setMuted(mute.current);
    cancel();
    lastKey.current = "";
    if (mute.current) setStatus("muted");
    else {
      blocked.current = false;
      started.current = true;
      failed.current = false;
      discover();
      if (latest.current.snapshot.state?.paused || controlPaused.current)
        setStatus(voice.current ? "paused" : "unavailable");
      else play(latest.current.cue);
    }
  }
  useEffect(() => {
    function voicesChanged() {
      const previous = voice.current;
      const selected = discover();
      if (!selected) {
        cancel();
        lastKey.current = "";
        if (!mute.current) setStatus("unavailable");
      } else {
        if (previous && previous !== selected && utterance.current) {
          cancel();
          lastKey.current = "";
        }
        if (utterance.current && previous === selected) return;
        if (mute.current) setStatus("muted");
        else if (blocked.current) setStatus("stopped");
        else if (failed.current) setStatus("error");
        else if (controlPaused.current || latest.current.snapshot.state?.paused)
          setStatus("paused");
        else if (!started.current) setStatus("ready");
        else play(latest.current.cue);
      }
    }
    function visibilityChanged() {
      if (document.hidden) {
        blocked.current = true;
        cancel();
        lastKey.current = "";
        setStatus(mute.current ? "muted" : "stopped");
      }
    }
    function pageHide() {
      blocked.current = true;
      cancel();
      lastKey.current = "";
      setStatus(mute.current ? "muted" : "stopped");
    }
    voicesChanged();
    if (supported)
      window.speechSynthesis.addEventListener?.("voiceschanged", voicesChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("pagehide", pageHide);
    window.addEventListener("hashchange", stop);
    window.addEventListener("popstate", stop);
    return () => {
      cancel();
      if (supported)
        window.speechSynthesis.removeEventListener?.(
          "voiceschanged",
          voicesChanged,
        );
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("pagehide", pageHide);
      window.removeEventListener("hashchange", stop);
      window.removeEventListener("popstate", stop);
    };
  }, [supported]);
  useEffect(() => {
    if (!cue) {
      cancel();
      lastKey.current = "";
      return;
    }
    if (snapshot.state?.paused) {
      cancel();
      lastKey.current = "";
      if (!mute.current) setStatus(voice.current ? "paused" : "unavailable");
    } else {
      // Stage changes replace speech even while muted/suspended/failed.
      play(cue);
    }
  }, [cue?.id, cue?.text, snapshot.state?.paused, revision]);
  return {
    muted,
    status,
    supported,
    voiceName,
    text: cue?.text ?? "",
    toggleMute,
    replay,
    start,
    stop,
    pause,
    resume,
    skip,
  };
}
