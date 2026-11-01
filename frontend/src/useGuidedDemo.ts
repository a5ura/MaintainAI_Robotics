import { useEffect, useReducer, useRef } from "react";
import { guideReducer } from "./guided";
import { api } from "./api";
import type { Clock, Diagnosis } from "./model";
import type { Detail } from "./Maintenance";
type Actions = {
  reset: () => void;
  selectDrop: () => void;
  play: () => void;
  pause: () => void;
  skip: () => void;
  showOperations: () => void;
  openTicket: (id: string) => void;
};
export function useGuidedDemo(
  clock: Clock,
  result: Diagnosis | null,
  actions: Actions,
) {
  const [state, dispatch] = useReducer(guideReducer, null);
  const latest = useRef(actions);
  latest.current = actions;
  const epoch = useRef(0),
    requestId = useRef(""),
    saving = useRef(false),
    navigated = useRef(false);
  function start() {
    epoch.current++;
    requestId.current = crypto.randomUUID();
    saving.current = false;
    navigated.current = false;
    latest.current.reset();
    latest.current.selectDrop();
    latest.current.showOperations();
    dispatch({ type: "start" });
    latest.current.play();
  }
  function stop() {
    epoch.current++;
    dispatch({ type: "stop" });
  }
  function pause() {
    dispatch({ type: "pause" });
    latest.current.pause();
  }
  function resume() {
    dispatch({ type: "resume" });
    if (state?.stage === "simulation" && clock.t < 12) latest.current.play();
  }
  function takeover() {
    stop();
    latest.current.pause();
    latest.current.showOperations();
  }
  function skip() {
    dispatch({ type: "skip" });
    latest.current.skip();
  }
  useEffect(() => {
    if (state?.stage === "simulation" && !state.paused && result)
      dispatch({ type: "result" });
  }, [result, state?.stage, state?.paused]);
  useEffect(() => {
    if (
      !state ||
      state.paused ||
      state.error ||
      !["evidence", "checks"].includes(state.stage)
    )
      return;
    const id = setTimeout(() => dispatch({ type: "next" }), 4000);
    return () => clearTimeout(id);
  }, [state?.stage, state?.paused, state?.error]);
  useEffect(() => {
    if (
      state?.stage !== "saving" ||
      state.paused ||
      state.error ||
      saving.current ||
      !result?.id
    )
      return;
    const run = epoch.current;
    saving.current = true;
    void api<Detail>("/tickets", "POST", {
      equipment_id: "R-01",
      diagnosis_id: result.id,
      title: "Guided demo — " + (result.failure ?? "cycle review"),
      description:
        "Synthetic guided demonstration. " +
        result.summary +
        "\nDropped object · seed 42",
      request_id: requestId.current,
    })
      .then((detail) => {
        if (epoch.current === run)
          dispatch({ type: "saved", ticketId: detail.ticket.id });
      })
      .catch((e) => {
        if (epoch.current === run) {
          saving.current = false;
          dispatch({ type: "error", message: e.message });
        }
      });
  }, [state?.stage, state?.paused, state?.error, result]);
  useEffect(() => {
    if (
      state?.stage === "complete" &&
      !state.paused &&
      state.ticketId &&
      !navigated.current
    ) {
      navigated.current = true;
      latest.current.openTicket(state.ticketId);
    }
  }, [state?.stage, state?.paused, state?.ticketId]);
  return {
    state,
    start,
    stop,
    pause,
    resume,
    takeover,
    skip,
    retry: () => dispatch({ type: "retry" }),
  };
}
