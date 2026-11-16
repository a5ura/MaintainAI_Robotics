import { expect, it } from "vitest";
import {
  guideNarrationCue,
  selectNarrationVoice,
  type NarrationSnapshot,
} from "./guideNarration";
import { initialGuide } from "./guided";
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
  state: initialGuide(1),
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
  [
    { state: { ...base.state!, stage: "fault-detection" }, t: 6 },
    "fault-detection:simulation-loss",
  ],
  [
    { state: { ...base.state!, stage: "fault-detection" }, t: 12 },
    "fault-detection:analysis-pending",
  ],
  [
    {
      state: { ...base.state!, stage: "fault-detection" },
      t: 12,
      backendError: "offline",
    },
    "fault-detection:analysis-error",
  ],
  [
    { state: { ...base.state!, stage: "evidence-investigation" }, result },
    "evidence-D1",
  ],
  [{ state: { ...base.state!, stage: "diagnosis" }, result }, "checks-D1"],
  [
    { state: { ...base.state!, stage: "maintenance-handoff" }, result },
    "maintenance-handoff",
  ],
] as const)("maps actual state to a stable cue %s", (patch, id) => {
  expect(guideNarrationCue({ ...base, ...patch })?.id ?? null).toBe(id);
});
it("does not assert loss or a proven root cause for normal/inconclusive results", () => {
  const state = { ...base.state!, stage: "evidence-investigation" as const };
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
    guideNarrationCue({
      ...base,
      state: { ...state, stage: "diagnosis" },
      result,
    })?.text,
  ).toContain("operator verification");
  expect(
    guideNarrationCue({
      ...base,
      state: { ...state, stage: "diagnosis" },
      result: { ...result, hypotheses: [] },
    })?.text,
  ).toBe("Review the evidence before identifying a cause.");
});
