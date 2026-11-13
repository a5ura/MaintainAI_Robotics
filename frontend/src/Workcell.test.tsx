// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Workcell from "./Workcell";
import { scenarioSample } from "./scenarios";

beforeEach(() => {
  // Exercise the real Workcell DOM independently of GPU availability.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it.each([6, 10, 12])(
  "displays the historical loss headline at %s seconds",
  (t) => {
    render(<Workcell t={t} scenario="drop" />);
    const headline = screen.getByTestId("scene-status").querySelector("strong");
    expect(headline?.textContent).toBe(
      "PRESENCE LOST AT 6.0s · HOLD COMMANDED AT LOSS",
    );
    expect(headline).not.toHaveTextContent("GRIP STILL COMMANDED");
    expect(scenarioSample(t, "drop").grip_command).toBe(t < 10);
  },
);
