# GD-02B-1 — Six-stage Guided Demo controller

November 16, 2026 (America/New_York). Scope: GD-02B-1 under GD-02-SPEC-v1.1. This is an intermediate controller/safety phase, not the completed GD-02 experience. Independent Code Review and separate merge authorization are required. No merge or deployment.

## Baseline and safeguards

Verified clean preflight checkout: `feature/gd02a-clear-selection` at `052074e32847f86bee6f7960b8f40dc0dfebcf1f`. Fetched `main` and verified the expected GD-02A merge, `cdb271d94fa5d028f23388cf34c6ae3017d68b6b`. Created `feature/gd02b1-guided-controller` directly from that verified baseline. Final head is recorded in the review PR.

Existing ignored/local/untracked files were preserved. No destructive Git operations, branch deletions, dependency installations, account/resource/billing changes or Windows application/database access.

## Implementation

`guided.ts` defines stable stage IDs, Manual/Automatic modes, explicit `waiting`/`ready`/`unavailable` readiness, paused state, run epoch and stage-entry token. Inactive/exited presentation is null; exit invalidates the run epoch. The reducer accepts explicit start, observe, next, previous, timer, mode, pause/resume, stop and lifecycle-interruption events. Duplicate or obsolete entry events cannot advance twice. `frontier` records the furthest stage entered without owning simulation time or historical robot replay.

| Stage | Entry and readiness |
| --- | --- |
| Introduction | Reset the demonstration once, select Dropped Object/seed 42, keep clock at zero and paused. Ready for Next; Manual is default. |
| Robot Operation | Use the existing play callback. Wait for clock to reach the existing recorded loss milestone, derived from the dropped-object payload's first absent-object/HOLD reading. Pause on the first update at or beyond that milestone; do not clamp/rewind time or change the engine. |
| Fault Detection | Continue the same run to its existing end time. Distinguish simulation progress, diagnosis pending, available result and error. Only a real result permits Next. |
| Evidence Investigation | Require that run's diagnosis; retain existing reference links, inspector, timeline and marker selection. Missing references have a truthful fallback. |
| Diagnosis and Next Checks | Use backend observations/candidates/checks. The complete comparison remains available unchanged; no new ranking or verification outcome. |
| Maintenance Handoff | Terminal non-persisting explanation. No active Create Ticket action, automatic redirect or claim that a ticket was saved. |

`GUIDE_READING_MS` centralizes the initial **4,000 ms after readiness** policy. The hook accepts a bounded reading-duration override (100–60,000 ms) for configuration/tests. Automatic needs both readiness and its dwell; speech completion is not a dependency. Stage 6 never schedules progression. Mode changes and Resume start a fresh dwell. Pause disables Next/Previous until Resume; mode, Replay, Reset and Exit remain available.

Previous pauses guide-owned playback and revisits explanations without resetting/replaying backend work. Returning to unfinished eligible work resumes the same run. Available diagnosis and evidence survive stage/mode changes. Exit pauses playback, cancels guide timers and removes the banner while preserving run data. Reset explicitly initializes a fresh run.

Operations, Diagnostics, Maintenance and manual-ticket handoff exit consistently. Using manual Start/scenario/seed controls exits guide ownership. Browser Back/Forward and navigation away exit. Native evidence-fragment clicks remain in the walkthrough; Chrome emits both `popstate` and `hashchange`, so a matching recorded internal click is distinguished from history traversal. Existing evidence-link narration-stop semantics remain. Hidden/pagehide pauses the whole walkthrough; becoming visible never resumes it. Repeated hide events cannot strand Resume.

## Ownership and persistence boundary

- App retains the unchanged clock/engine and existing generation/requested diagnosis guards. Stage navigation does not call the diagnosis API, reset generation or fabricate a result. Only a fresh Start/Reset resets the run; an explicit existing Retry diagnosis remains available after failure.
- The guide hook has **no API import, ticket UUID/payload, ticket-save effect, save retry or ticket-navigation callback**. No replacement persistence mechanism or partially active confirmation action exists.
- Reducer epoch/entry checks reject old events. Timer cleanup also permanently invalidates its effect activation, covering already queued callbacks and Strict Mode replay. Browser interruptions apply to the current run even when a mode/navigation event is queued.
- A submitted diagnosis can finish after guide exit and populate the same current simulation's result. It cannot resurrect the guide. Start/Reset invalidates old diagnosis responses using App's existing generation guard.
- Backend diagnosis snapshot persistence is preserved and is distinct from maintenance-ticket creation.
- Manual maintenance forms and backend idempotency remain unchanged. The existing external handoff navigates to a form; only its explicit submission writes a ticket.

## Narration compatibility

`guideNarration.ts` maps the new stage IDs onto existing short introduction/loss/analysis/evidence/check cues, with truthful historical-loss wording and a non-saving handoff cue. It distinguishes an available result from pending analysis. `useGuideNarration.ts` is unchanged: user activation, local-English voice selection, mute preference, Replay, watchdogs, cancellation, stale speech-event guards and text fallback remain intact. Narration never schedules a stage, simulation or API operation. Stage-qualified cue IDs replace speech even when neighboring stages share a sentence; retained old speech callbacks cannot report an error on the new utterance. Final scripts and narration-aware timing are deferred to GD-02B-3.

## Exact files changed

Application:

- `frontend/src/guided.ts`
- `frontend/src/useGuidedDemo.ts`
- `frontend/src/App.tsx`
- `frontend/src/GuidedBanner.tsx`
- `frontend/src/guideNarration.ts`
- `frontend/src/style.css` — scoped 44px native walkthrough-control targets only

Unit/component coverage:

- `frontend/src/guided.test.ts`
- `frontend/src/useGuidedDemo.test.tsx` (new)
- `frontend/src/GuidedFlow.test.tsx`
- `frontend/src/GuidedBanner.test.tsx`
- `frontend/src/guideNarration.test.ts`
- `frontend/src/useGuideNarration.test.tsx`

Browser coverage:

- `frontend/e2e/guidedController.ts` (new test helper; runs existing simulation timers, never seeks/fabricates results)
- `frontend/e2e/gd02b1.spec.ts` (new)
- `frontend/e2e/gd01.spec.ts`
- `frontend/e2e/m3.spec.ts`
- `frontend/e2e/ui01.spec.ts`
- `frontend/e2e/ui03.spec.ts`

Documentation: `docs/GD02B1_COMPLETION_REPORT.md`.

Legacy Skip/automatic-save expectations were deliberately migrated to explicit stage navigation, zero-write assertions and manual handoff. The impossible pending-guide-save case was replaced by pending-diagnosis/manual-draft isolation. Backend idempotency and mathematical/rendering assertions remain covered. No backend, schema/repository, simulation/kinematics, diagnosis-rule, Three.js rendering, UI-03 selection-controller, maintenance-form, dependency or hosting changes.

## Verification and safe execution

Execution: managed Linux cloud workspace and installed Chromium/software WebGL. Speech-enabled browser cases use the existing deterministic speech mock; installed Windows voice quality/availability is not established. Browser test files/configuration were copied under `/tmp/maintainai-gd02b1-way_kb1w/frontend`; existing node_modules and production dist were symlinked. Only that disposable copy substitutes API/preview ports 8187/5387 for legacy 8000/5173 URLs. Generated legacy screenshots and reports remain outside the checkout.

API: `MAINTAINAI_DB_PATH=/tmp/maintainai-gd02b1-way_kb1w/<disposable>.sqlite3 .venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8187`. Preview in the temporary frontend: `./node_modules/.bin/vite preview --host 127.0.0.1 --port 5387 --strictPort`. Focused/first full/final browser runs use separate disposable database paths. Backend tests use existing temporary fixtures. Browser tests intentionally submit synthetic diagnosis/manual-ticket requests only to these disposable databases.

| Command | Result |
| --- | --- |
| `npm --prefix frontend test` | 161 passed / 20 files |
| `.venv/bin/python -m pytest backend/tests -q` | 98 passed; existing Starlette/AnyIO deprecation warning |
| `npm --prefix frontend run build` | Passed; existing large-chunk warning |
| `npm --prefix frontend test -- src/useGuidedDemo.test.tsx` | Navigation correction: 7 passed |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/gd02b1.spec.ts e2e/gd01.spec.ts --workers=1 --timeout=120000` | Pre-navigation-correction focused run: 11 passed |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test --workers=1 --timeout=120000` | Final complete run: **47 passed (14.4 minutes), no retries** |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/m3.spec.ts --grep 'guided real evidence|pending diagnosis cannot' --workers=1 --timeout=120000` | Navigation correction: 2 passed |
| `git diff --check` and protected-file comparison against the baseline | Passed; protected files unchanged |

Development history is not counted as a final pass: mid-migration builds rejected legacy-stage fixtures and imported JSON tuple casts; one reducer-test comparison and one fake-timer spy setup needed correction. The first focused browser run had 6 passes/4 failures: three undersized navigation-control targets (39.5px, corrected with scoped sizing) and an Automatic ready-window assertion that passed an isolated diagnostic retry. The subsequent focused run passed all 11 cases. The first full attempt found the actual paired-history-event evidence-navigation bug; it was stopped for correction with **29 passed, 1 failed, 1 interrupted, 16 not run**. The interrupted pending-diagnosis test was not counted as a failure or pass. Held-response fixtures use bounded arrival waits and release their gates in finally blocks. A second complete-suite attempt was deliberately stopped to add the final same-sentence speech-boundary protection: 14 passed, 1 interrupted, 32 not run; no failed case in that attempt. It is not counted as a complete pass.

Earlier focused unit commands were `npm --prefix frontend test -- src/guided.test.ts src/GuidedFlow.test.tsx src/guideNarration.test.ts src/useGuideNarration.test.tsx src/GuidedBanner.test.tsx` (42 passed, 1 test-comparison failure) and `npm --prefix frontend test -- src/guided.test.ts src/useGuidedDemo.test.tsx` (8 passed, 1 fake-timer-harness failure). Both were corrected before the passing full suites; intermediate full runs passed 158/159/160 tests as coverage grew. The diagnostic browser retry command was `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/gd02b1.spec.ts --grep 'Automatic waits' --workers=1 --timeout=120000` (1 passed).

The final complete browser run used fresh `/tmp/maintainai-gd02b1-way_kb1w/full-verified.sqlite3` and the completed production build, with no source changes during that run. All 47 workflows passed in one run without isolated retries. Earlier development/aborted runs above are not combined into this result.

The final suite verifies all five fixed scenarios plus seeded random, UI-01 viewports and resizing, UI-02 rendered geometry/camera/context recovery/fallback/resources, UI-03 actual historical marker transforms and Clear Selection, complete Manual/Automatic walkthroughs, speech fallback/isolation, pending/error gates, no duplicate diagnosis from stage navigation, zero guided ticket POSTs, maintenance-record preservation, explicit manual ticket creation, backend idempotency, B01 conflicts/drafts, history pagination and JSON/Markdown exports. Required viewport coverage is 1366×768, 1280×720 and 390×844. No remaining failed workflow is known.

## Deferred functionality and limitations

No spotlight/overlay or automatic scrolling (GD-02B-2), final narration redesign/timing refinement (GD-02B-3), ticket confirmation/attempt ledger or persistence pathway (GD-02B-4), or GD-02B-5 implementation was begun. Regression work here verifies B-1; it does not claim the complete GD-02 acceptance phase is finished.

The walkthrough intentionally ends without creating a ticket. Operators can exit and use the unchanged manual maintenance form. Previous does not replay historical robot motion. Windows browser/voice/GPU and native assistive-technology acceptance remain unverified; no FPS or Windows performance claim is made. Public hosting and account eligibility remain outside scope.
