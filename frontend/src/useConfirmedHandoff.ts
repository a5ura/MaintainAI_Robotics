import { useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { api, ApiError } from "./api";
import type { Diagnosis } from "./model";
import type { Detail } from "./Maintenance";
export type Payload = Readonly<{
  equipment_id: string;
  diagnosis_id: string;
  title: string;
  description: string;
  request_id: string;
}>;
export type Preview = Readonly<{
  key: string;
  run: string;
  diagnosis: Diagnosis;
  body: Omit<Payload, "request_id">;
}>;
export type Attempt = Readonly<{
  preview: Preview;
  body: Payload;
  phase: "submitting" | "success" | "rejected" | "uncertain";
  ticketId?: string;
  message?: string;
}>;
type Confirmation = { preview: Preview; retry?: Attempt; issue?: string };
export function handoffPreview(
  result: Diagnosis | null,
  run: string,
  key: string,
): { preview: Preview | null; issue: string } {
  if (!result?.id || !result.summary || !key)
    return {
      preview: null,
      issue: "A saved current-run diagnosis is required.",
    };
  const body = Object.freeze({
    equipment_id: "R-01",
    diagnosis_id: result.id.trim(),
    title: `Guided demo — ${result.failure ?? "cycle review"}`.trim(),
    description:
      `Synthetic guided demonstration. ${result.summary}\n${run}\nNo operator verification or repair has been recorded by this walkthrough.`.trim(),
  });
  if (
    !body.diagnosis_id ||
    body.diagnosis_id.length > 80 ||
    body.title.length > 120 ||
    body.description.length > 4000
  )
    return {
      preview: null,
      issue:
        "The proposed ticket exceeds the existing API field limits; no request has been made.",
    };
  return {
    preview: Object.freeze({ key, run, diagnosis: result, body }),
    issue: "",
  };
}
// App-lifetime memory only. Stage/view changes never discard confirmed attempts.
export function useConfirmedHandoff(preview: Preview | null, enabled: boolean) {
  const [, render] = useReducer((n) => n + 1, 0);
  const entries = useRef(new Map<string, Attempt>());
  const dialog = useRef<Confirmation | null>(null);
  const mounted = useRef(false);
  const context = useMemo(
    () => ({ key: preview?.key, enabled }),
    [preview?.key, enabled],
  );
  const latest = useRef(context);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const notify = () => {
    if (mounted.current) render();
  };
  useLayoutEffect(() => {
    latest.current = context;
    if (dialog.current) {
      dialog.current = null;
      notify();
    }
  }, [context]);
  const unresolved = () =>
    [...entries.current.values()].find(
      (a) => a.phase === "submitting" || a.phase === "uncertain",
    );
  function open() {
    if (
      latest.current !== context ||
      !enabled ||
      !preview ||
      unresolved() ||
      entries.current.get(preview.key)?.phase === "success"
    )
      return;
    dialog.current = { preview, retry: entries.current.get(preview.key) };
    notify();
  }
  function review(attempt: Attempt) {
    if (
      latest.current !== context ||
      (unresolved() && unresolved() !== attempt)
    )
      return;
    if (
      entries.current.get(attempt.preview.key) !== attempt ||
      attempt.phase === "submitting" ||
      attempt.phase === "success"
    )
      return;
    dialog.current = { preview: attempt.preview, retry: attempt };
    notify();
  }
  const currentDialog = dialog.current;
  function cancel() {
    if (dialog.current === currentDialog) {
      dialog.current = null;
      notify();
    }
  }
  function confirm() {
    const selected = currentDialog;
    if (!selected || dialog.current !== selected || latest.current !== context)
      return;
    const blocked = unresolved();
    if (blocked && blocked !== selected.retry) return;
    if (
      selected.retry &&
      entries.current.get(selected.preview.key) !== selected.retry
    )
      return;
    if (
      selected.retry?.phase === "submitting" ||
      selected.retry?.phase === "success"
    )
      return;
    if (
      !selected.retry &&
      (!enabled ||
        selected.preview.key !== preview?.key ||
        typeof crypto.randomUUID !== "function")
    )
      return;
    let body: Payload;
    try {
      body =
        selected.retry?.body ??
        Object.freeze({
          ...selected.preview.body,
          request_id: crypto.randomUUID(),
        });
    } catch {
      dialog.current = {
        ...selected,
        issue:
          "Secure attempt identifier could not be generated. No request was sent.",
      };
      notify();
      return;
    }
    const submitted: Attempt = Object.freeze({
      preview: selected.preview,
      body,
      phase: "submitting",
    });
    // Ref mutex and dialog consumption precede fetch, including rapid double clicks.
    entries.current.set(selected.preview.key, submitted);
    dialog.current = null;
    notify();
    void api<Detail>("/tickets", "POST", body)
      .then((detail) => {
        if (
          typeof detail?.ticket?.id !== "string" ||
          !detail.ticket.id ||
          detail.ticket.equipment_id !== body.equipment_id ||
          detail.ticket.diagnosis_id !== body.diagnosis_id ||
          detail.ticket.title !== body.title ||
          detail.ticket.description !== body.description
        )
          throw new Error(
            "The server response could not be matched to the confirmed ticket.",
          );
        if (entries.current.get(selected.preview.key) !== submitted) return;
        entries.current.set(
          selected.preview.key,
          Object.freeze({
            ...submitted,
            phase: "success",
            ticketId: detail.ticket.id,
          }),
        );
        notify();
      })
      .catch((error) => {
        if (entries.current.get(selected.preview.key) !== submitted) return;
        // These existing validation/access/quota responses reject before a write.
        // 409, 5xx, network/timeout and malformed success remain uncertain.
        const rejected =
          selected.retry?.phase !== "uncertain" &&
          error instanceof ApiError &&
          ([401, 403, 405, 413, 422, 429].includes(error.status) ||
            (error.status === 404 &&
              ["Equipment not found", "Diagnosis not found"].includes(
                error.message,
              )));
        entries.current.set(
          selected.preview.key,
          Object.freeze({
            ...submitted,
            phase: rejected ? "rejected" : "uncertain",
            message:
              error instanceof Error ? error.message : "Unrecognized response",
          }),
        );
        notify();
      });
  }
  const attempt =
    unresolved() ?? (preview ? entries.current.get(preview.key) : undefined);
  const recent = [...entries.current.values()].at(-1);
  return {
    preview,
    attempt,
    notice: unresolved() ?? recent,
    confirmation: currentDialog,
    open,
    review,
    cancel,
    confirm,
    canCreate:
      enabled &&
      !!preview &&
      !unresolved() &&
      entries.current.get(preview.key)?.phase !== "success" &&
      typeof crypto.randomUUID === "function",
  };
}
export type Handoff = ReturnType<typeof useConfirmedHandoff>;
