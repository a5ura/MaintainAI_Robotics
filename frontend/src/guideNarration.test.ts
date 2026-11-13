import { expect, it } from "vitest";
import {
  guideNarrationCue,
  selectNarrationVoice,
  type NarrationSnapshot,
} from "./guideNarration";
import { fakeVoice } from "./testSpeech";
import type { Diagnosis } from "./model";
const result: Diagnosis = {
  id: "D1",
  status: "detected",
  failure: "Dropped object",
  summary: "Measured",
  hypotheses: [
    {
      cause: "Possible seal loss",
      check: "Inspect",
      support: [],
      contradiction: [],
    },
  ],
  observations: [],
  timeline: [],
  warnings: [],
  ranking_basis: "ordinal",
};
const base: NarrationSnapshot = {
  state: { stage: "simulation", paused: false, skipTour: false },
  t: 0,
  result: null,
  backendError: "",
};
it("selects David before a local default; never selects remote or non-English voices", () => {
  const david = fakeVoice(),
    mark = fakeVoice("Microsoft Mark", "en-US", true, true);
  expect(
    selectNarrationVoice([
      fakeVoice("Remote", "en-US", false, true),
      mark,
      david,
    ]),
  ).toBe(david);
  expect(selectNarrationVoice([mark])).toBe(mark);
  expect(
    selectNarrationVoice([
      fakeVoice("Remote", "en-US", false),
      fakeVoice("French", "fr-FR"),
    ]),
  ).toBeUndefined();
  expect(selectNarrationVoice([])).toBeUndefined();
});
it.each([
  [{ state: null }, null],
  [{}, "simulation-intro"],
  [{ t: 6 }, "simulation-loss"],
  [{ t: 12 }, "analysis-pending"],
  [{ t: 12, backendError: "offline" }, "analysis-error"],
  [{ state: { ...base.state!, stage: "evidence" }, result }, "evidence-D1"],
  [{ state: { ...base.state!, stage: "checks" }, result }, "checks-D1"],
  [{ state: { ...base.state!, stage: "saving" }, result }, "saving-D1"],
  [
    { state: { ...base.state!, stage: "complete", ticketId: "T1" }, result },
    "complete-T1",
  ],
  [
    { state: { ...base.state!, stage: "saving", error: "failed" } },
    "save-error",
  ],
] as const)("maps actual state to a stable cue %s", (patch, id) => {
  expect(guideNarrationCue({ ...base, ...patch })?.id ?? null).toBe(id);
});
it("does not assert loss or a proven root cause for normal/inconclusive results", () => {
  const state = { ...base.state!, stage: "evidence" as const };
  expect(
    guideNarrationCue({
      ...base,
      state,
      result: { ...result, status: "inconclusive" },
    })?.text,
  ).toContain("inconclusive");
  expect(
    guideNarrationCue({
      ...base,
      state,
      result: { ...result, status: "normal" },
    })?.text,
  ).toContain("normal cycle");
  expect(
    guideNarrationCue({ ...base, state: { ...state, stage: "checks" }, result })
      ?.text,
  ).toContain("operator verification");
  expect(
    guideNarrationCue({
      ...base,
      state: { ...state, stage: "checks" },
      result: { ...result, hypotheses: [] },
    })?.text,
  ).toBe("Review the evidence before identifying a cause.");
});
