// @vitest-environment jsdom
import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import computed from "../../fixtures/guide-diagnosis.json";
import type { Diagnosis } from "./model";
import { handoffPreview, useConfirmedHandoff } from "./useConfirmedHandoff";
import { HandoffConfirmation, HandoffPreview } from "./ConfirmedHandoff";
import { guideNarrationCue } from "./guideNarration";
import { initialGuide } from "./guided";
const diagnosis = computed as unknown as Diagnosis;
const preview = handoffPreview(
  diagnosis,
  "Dropped object · seed 42 · run 1",
  "1:D",
).preview!;
const ok = (body: Record<string, string>) => ({
  ok: true,
  json: async () => ({ ticket: { ...body, id: "T-confirmed" } }),
});
beforeEach(() => {
  for (const method of ["showModal", "close"] as const)
    if (!HTMLDialogElement.prototype[method])
      Object.defineProperty(HTMLDialogElement.prototype, method, {
        configurable: true,
        writable: true,
        value() {},
      });
  vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(
    function (this: HTMLDialogElement) {
      this.open = true;
    },
  );
  vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.open = false;
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function mount() {
  const fetch = vi
    .fn()
    .mockImplementation(async (_url, options) => ok(JSON.parse(options.body)));
  vi.stubGlobal("fetch", fetch);
  const h = renderHook((p) => useConfirmedHandoff(p.preview, p.enabled), {
    initialProps: { preview: preview as typeof preview | null, enabled: true },
    wrapper: StrictMode,
  });
  return { ...h, fetch };
}
it("preview and opening/cancelling confirmation never write; native Escape is cancellation", () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  function Harness() {
    const h = useConfirmedHandoff(preview, true);
    return (
      <>
        <HandoffPreview handoff={h} issue="" onView={vi.fn()} />
        <HandoffConfirmation handoff={h} />
      </>
    );
  }
  render(<Harness />);
  expect(
    screen.getByRole("region", { name: "Maintenance handoff preview" }),
  ).toHaveTextContent(diagnosis.id!);
  fireEvent.click(
    screen.getByRole("button", { name: "Create maintenance ticket" }),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Create maintenance ticket" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(fetch).not.toHaveBeenCalled();
});
it("consumes confirmation synchronously, freezes one UUID/payload and retains success through stage visits", async () => {
  const h = mount();
  const uuid = vi.spyOn(crypto, "randomUUID");
  act(() => h.result.current.open());
  const confirm = h.result.current.confirm;
  await act(async () => {
    confirm();
    confirm();
  });
  expect(h.fetch).toHaveBeenCalledTimes(1);
  expect(uuid).toHaveBeenCalledTimes(1);
  const attempt = h.result.current.attempt!;
  expect(attempt.phase).toBe("success");
  expect(Object.isFrozen(attempt.body)).toBe(true);
  expect(attempt.body.request_id).toMatch(/^[0-9a-f-]{36}$/);
  h.rerender({ preview, enabled: false });
  h.rerender({ preview, enabled: true });
  act(() => h.result.current.open());
  expect(h.result.current.confirmation).toBeNull();
  expect(h.fetch).toHaveBeenCalledTimes(1);
});
it("pending request survives exit/new run and never redirects or permits a conflicting confirmation", async () => {
  const h = mount();
  let finish!: (value: unknown) => void;
  h.fetch.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  act(() => h.result.current.open());
  act(() => h.result.current.confirm());
  const body = h.result.current.attempt!.body;
  h.rerender({ preview: null, enabled: false });
  expect(h.result.current.notice!.phase).toBe("submitting");
  const next = handoffPreview(diagnosis, "New run", "2:D").preview!;
  h.rerender({ preview: next, enabled: true });
  act(() => h.result.current.open());
  expect(h.result.current.confirmation).toBeNull();
  expect(h.result.current.canCreate).toBe(false);
  await act(async () => finish(ok(body)));
  expect(h.result.current.notice!.ticketId).toBe("T-confirmed");
  expect(h.result.current.attempt).toBeUndefined(); // Previous success belongs to its own run.
});
it("network uncertainty blocks new attempts and requires explicit same-ID reconciliation", async () => {
  const h = mount();
  h.fetch.mockRejectedValueOnce(new TypeError("lost response"));
  act(() => h.result.current.open());
  await act(async () => h.result.current.confirm());
  const original = h.result.current.attempt!;
  expect(original.phase).toBe("uncertain");
  h.rerender({ preview: null, enabled: false });
  expect(h.result.current.notice).toBe(original);
  expect(h.fetch).toHaveBeenCalledTimes(1);
  act(() => h.result.current.review(original));
  await act(async () => h.result.current.confirm());
  expect(h.fetch).toHaveBeenCalledTimes(2);
  expect(h.fetch.mock.calls[1][1].body).toBe(h.fetch.mock.calls[0][1].body);
  expect(h.result.current.notice!.phase).toBe("success");
});
it("rejected reconciliation cannot erase original uncertainty", async () => {
  const h = mount();
  h.fetch.mockRejectedValueOnce(new TypeError("timeout"));
  act(() => h.result.current.open());
  await act(async () => h.result.current.confirm());
  h.fetch.mockResolvedValueOnce({
    ok: false,
    status: 429,
    json: async () => ({ detail: "quota" }),
  });
  act(() => h.result.current.review(h.result.current.attempt!));
  await act(async () => h.result.current.confirm());
  expect(h.result.current.attempt!.phase).toBe("uncertain");
  expect(h.result.current.canCreate).toBe(false);
});
it.each([422, 403, 404, 429])(
  "initial HTTP %s is a confirmed rejection; explicit retry preserves identity",
  async (status) => {
    const h = mount();
    h.fetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => ({
        detail: status === 404 ? "Equipment not found" : "Actual rejection",
      }),
    });
    act(() => h.result.current.open());
    await act(async () => h.result.current.confirm());
    expect(h.result.current.attempt!.phase).toBe("rejected");
    expect(h.result.current.attempt!.message).toBe(
      status === 404 ? "Equipment not found" : "Actual rejection",
    );
    act(() => h.result.current.review(h.result.current.attempt!));
    await act(async () => h.result.current.confirm());
    expect(h.fetch.mock.calls[1][1].body).toBe(h.fetch.mock.calls[0][1].body);
  },
);
it.each([400, 404, 409, 500, 503])(
  "HTTP %s stays uncertain and never retries automatically",
  async (status) => {
    const h = mount();
    h.fetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => ({ detail: "Unknown commit" }),
    });
    act(() => h.result.current.open());
    await act(async () => h.result.current.confirm());
    expect(h.result.current.attempt!.phase).toBe("uncertain");
    expect(h.fetch).toHaveBeenCalledTimes(1);
  },
);
it("stale confirmation is invalid after navigation/reset; invalid preview cannot write", async () => {
  const h = mount();
  act(() => h.result.current.open());
  const old = h.result.current.confirm;
  h.rerender({ preview: null, enabled: false });
  await act(async () => old());
  expect(h.fetch).not.toHaveBeenCalled();
  expect(h.result.current.confirmation).toBeNull();
  expect(handoffPreview(null, "run", "key").preview).toBeNull();
  expect(
    handoffPreview({ ...diagnosis, summary: "x".repeat(4001) }, "run", "key")
      .preview,
  ).toBeNull();
});
it("unmatched success response is uncertain rather than a false saved claim", async () => {
  const h = mount();
  h.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ticket: { id: "unmatched" } }),
  });
  act(() => h.result.current.open());
  await act(async () => h.result.current.confirm());
  expect(h.result.current.attempt!.phase).toBe("uncertain");
});

it("UUID failure makes no request and preserves the confirmation for safe cancellation", () => {
  const h = mount();
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
    throw new Error("unavailable");
  });
  act(() => h.result.current.open());
  act(() => h.result.current.confirm());
  expect(h.fetch).not.toHaveBeenCalled();
  expect(h.result.current.confirmation!.issue).toContain("No request was sent");
});
it("a retained prior confirmation/review cannot reopen or overwrite a new run's dialog", () => {
  const h = mount();
  act(() => h.result.current.open());
  const old = h.result.current;
  h.rerender({ preview: null, enabled: false });
  h.rerender({
    preview: handoffPreview(diagnosis, "new", "2:D").preview,
    enabled: true,
  });
  act(() => h.result.current.open());
  const selected = h.result.current.confirmation;
  act(() => {
    old.confirm();
    old.cancel();
    old.open();
  });
  expect(h.result.current.confirmation).toBe(selected);
  expect(h.fetch).not.toHaveBeenCalled();
});

it.each([
  ["submitting", "Persistence has not yet been confirmed"],
  ["success", "backend confirmed maintenance ticket T-confirmed"],
  ["rejected", "server rejected"],
  ["uncertain", "ticket may already have been saved"],
] as const)(
  "Stage 6 narration accurately describes %s without claiming verification",
  (phase, text) => {
    const cue = guideNarrationCue({
      state: { ...initialGuide(1), stage: "maintenance-handoff" },
      t: 12,
      result: diagnosis,
      backendError: "",
      handoff: {
        phase,
        ticketId: phase === "success" ? "T-confirmed" : undefined,
      },
    })!;
    expect(cue.text.toLowerCase()).toContain(text.toLowerCase());
    if (phase !== "success") expect(cue.text).not.toContain("T-confirmed");
    expect(cue.text).not.toContain("repair completed");
  },
);
