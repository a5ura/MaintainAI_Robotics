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
  ).toContain("Review the evidence before identifying a cause.");
});

it("uses real observation references and backend candidate/check content without verification claims", () => {
  const measured = {
    ...result,
    summary: "Measured loss at transfer",
    observations: [{ text: "Presence disagrees with hold", evidence: ["E6"] }],
    timeline: [{ id: "E6" }],
  } as unknown as Diagnosis;
  const evidence = guideNarrationCue({
    ...base,
    state: { ...base.state!, stage: "evidence-investigation" },
    result: measured,
  })!;
  expect(evidence.text).toContain("Presence disagrees with hold");
  expect(evidence.text).toContain("reference E6");
  expect(evidence.text).toContain("not the current robot pose");
  const diagnosis = guideNarrationCue({
    ...base,
    state: { ...base.state!, stage: "diagnosis" },
    result: measured,
  })!;
  expect(diagnosis.text).toContain("Possible seal loss");
  expect(diagnosis.text).toContain("Inspect");
  expect(diagnosis.text).toContain("has not completed");
  expect(
    guideNarrationCue({
      ...base,
      state: { ...base.state!, stage: "evidence-investigation" },
      result: { ...measured, timeline: [] },
    })!.text,
  ).toContain("reference is unavailable");
});
it("never announces a backend result or loss before the relevant real milestone", () => {
  const before = guideNarrationCue({
    ...base,
    state: { ...base.state!, stage: "robot-operation" },
    t: 2,
    result,
  })!;
  expect(before.text).not.toContain("Measured");
  expect(before.text).not.toContain("presence was lost");
  const atLoss = guideNarrationCue({
    ...base,
    state: { ...base.state!, stage: "fault-detection" },
    t: 6,
    result,
  })!;
  expect(atLoss.text).toContain("observed symptom");
  expect(atLoss.text).not.toContain("backend reports");
  const available = guideNarrationCue({
    ...base,
    state: { ...base.state!, stage: "fault-detection" },
    t: 12,
    result,
  })!;
  expect(available.text).toContain("Measured");
  expect(available.id).toContain("analysis-ready-D1");
});
it.each(["evidence-investigation", "diagnosis"] as const)(
  "%s handles missing and failed results truthfully",
  (stage) => {
    expect(
      guideNarrationCue({
        ...base,
        state: { ...base.state!, stage },
        result: null,
      })!.text,
    ).toContain("pending");
    expect(
      guideNarrationCue({
        ...base,
        state: { ...base.state!, stage },
        result: null,
        backendError: "offline",
      })!.text,
    ).toContain("unavailable");
  },
);
it("cue identities and content are stable across telemetry/mode changes and distinct across stages", () => {
  const state = { ...base.state!, stage: "robot-operation" as const };
  const cue = guideNarrationCue({ ...base, state, t: 1 });
  expect(
    guideNarrationCue({
      ...base,
      state: { ...state, mode: "automatic", entry: 4 },
      t: 2,
    }),
  ).toEqual(cue);
  expect(
    guideNarrationCue({
      ...base,
      state: { ...state, stage: "fault-detection" },
      t: 2,
    })!.id,
  ).not.toBe(cue!.id);
});
