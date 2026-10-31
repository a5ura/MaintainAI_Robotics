// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
vi.mock("./Workcell", () => ({ default: () => <div>3D workcell</div> }));
const { App } = await import("./App");
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("Start, Pause, Reset preserve simulation lifecycle", () => {
  vi.useFakeTimers();
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  act(() => vi.advanceTimersByTime(3300));
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  const phase = screen.getByTestId("phase").textContent;
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByTestId("phase")).toHaveTextContent(phase!);
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByTestId("phase")).toHaveTextContent("pre pick");
});
it("renders computed backend results and evidence references", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "detected",
        failure: "Dropped object",
        summary: "Computed test evidence",
        observations: [{ text: "Signal lost", evidence: ["E3"] }],
        hypotheses: [],
        timeline: [],
        warnings: [],
        ranking_basis: "ordinal",
      }),
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  await act(async () => vi.advanceTimersByTime(13000));
  expect(
    screen.getByRole("heading", { name: "Dropped object" }),
  ).toBeInTheDocument();
  expect(screen.getByText("E3 · reference unavailable")).toBeInTheDocument();
  const payload = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(payload.samples.length).toBe(11);
});
it("shows an actionable backend error", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Network failure")),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  await act(async () => vi.advanceTimersByTime(13000));
  expect(screen.getByRole("alert")).toHaveTextContent("Network failure");
  expect(screen.getByRole("button", { name: "Retry diagnosis" })).toBeEnabled();
});
