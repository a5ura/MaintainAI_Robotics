# GD-02B-3 — Narration synchronization

November 16, 2026 (America/New_York). GD-02-SPEC-v1.1. Review PR only: no merge, deployment or branch deletion. GD-02B-4/5 remain deferred.

## Baseline and implementation

Verified clean checkout, fetched required main `69b7d4c3c392e93edae62a0049bb5813282ac640` containing GD-02B-2, and created `feature/gd02b3-narration-sync` directly from it. Final head is recorded in the review PR. Existing ignored/local/untracked files and SQLite records were preserved.

Expanded the existing pure cue selector with stage-specific scripts and real backend observation/candidate/check text. Existing speech lifecycle ownership remains in `useGuideNarration`; it has no simulation, diagnosis, scrolling, focus, evidence-selection or ticket callbacks. No second walkthrough controller or timing gate was introduced.

Exact changed files:

- `frontend/src/guideNarration.ts` — scripts, actual-state variants, unique-reference fallback; existing voice preference unchanged
- `frontend/src/useGuideNarration.ts` — speaking watchdog from 30 to 60 seconds; five-second silent-start watchdog unchanged
- `frontend/src/guideNarration.test.ts` — script/actual-data/readiness/identity assertions
- `frontend/src/useGuideNarration.test.tsx` — updated scripts, mode/run isolation and long-speech completion coverage
- `frontend/e2e/gd02b3.spec.ts` — three viewport Manual workflows and Automatic preemption/fallback
- `docs/GD02B3_COMPLETION_REPORT.md`

## Scripts and actual-state cue mapping

The authoritative complete strings/templates are in [guideNarration.ts](../frontend/src/guideNarration.ts). No script changes controller readiness. Script duration is not used as a clock.

| Stage/condition | Cue identity | Script/content |
| --- | --- | --- |
| Introduction | `simulation-intro` | “Welcome to MaintainAI Robotics. This simulated robot picks, carries, and places a part. We will follow its signals, investigate an observed failure, and review what a maintenance technician should verify. These are simulated inputs analyzed by the application, not live hardware telemetry. You can pause, read, or replay each explanation.” |
| Robot Operation, before loss | `robot-operation` | “Watch the simulated robot pick up, transport, and place the part. Its joints follow the existing deterministic trajectory. The object-at-gripper signal describes presence, while the grip command describes what was requested. Comparing commands with observations matters: a commanded hold alone does not prove that the object remains attached.” |
| Operation/Fault, recorded loss reached | `<stage>:simulation-loss` | “Simulated presence was lost while hold was commanded at the loss.” Explains that this is a symptom, not a verified cause, and that the same cycle continues to verification before backend analysis. Loss readiness uses the existing `GUIDE_LOSS_TIME`; no second domain calculation. |
| Operation/Fault, run ended and diagnosis pending | `<stage>:analysis-pending` | “MaintainAI is comparing the recorded evidence.” Explains that the cycle finished but the real backend result is pending; narration cannot accelerate/repeat the request or name an unsupported cause. |
| Operation/Fault, failed diagnosis | `<stage>:analysis-error` | “Analysis is unavailable.” Explains that no diagnosis can be claimed from the failed request, results are not filled in, and retry is explicit. |
| Operation/Fault, result available after run end | `<stage>:analysis-ready-<result>` | States normal/inconclusive status or quotes the backend summary, then explains that observations must precede candidate explanations and that an explanation is not mechanical proof. A prematurely supplied result is not narrated before the run milestone. |
| Evidence Investigation | `evidence-<result>` | States actual outcome and first actual backend observation when available. Names a supporting reference only if it resolves uniquely in the actual timeline; otherwise explains that a unique reference is unavailable. Explains timeline selection, recorded signals, historical tool center point versus live pose, and Clear Selection without rewind. No evidence is selected by narration. |
| Diagnosis and Next Checks | `checks-<result>` | States actual outcome. Quotes the first backend candidate and its recommended check when applicable; normal/no-candidate results do not imply an established repair. Explains displayed supporting/contradicting evidence, backend order, required operator verification and that no checks/root cause/repair outcome were completed by this walkthrough. |
| Evidence/Diagnosis without a result | `<stage>:analysis-pending/error` | Truthful pending/unavailable fallback; no fabricated observations or causes. |
| Maintenance Handoff | `maintenance-handoff` | “Findings would be handed to maintenance with their diagnosis reference, recorded evidence, and recommended checks. No maintenance ticket has been saved. Ticket confirmation is not available in this walkthrough yet. Existing maintenance records are separate from this unsaved handoff, and any future repair outcome still needs an operator's verification.” |

Static scripts are roughly a paragraph each. Actual summaries/observations/checks can make Evidence/Diagnosis longer; no synthetic details are added to fill time. Local voice rate and actual backend text determine duration; no measured Windows duration claim is made.

## Lifecycle, timing and fallback

- Existing synchronous user-activated Start reads the new introduction, never a previous run's cue. The narration run counter and generation guard invalidate old utterances on reset/start.
- Stage-qualified phase IDs invalidate neighboring stages even when sharing a loss explanation. Stable result IDs/text prevent rerender/mode/telemetry replay; revisiting a different stage can narrate again.
- Cancellation clears owned speech handlers/watchdogs before replacing speech. Retained old start/end/error callbacks cannot mutate the new narration state. Strict Mode, rapid transitions and run reset remain covered.
- Pause cancels; explicit Resume restarts the current eligible cue. Replay reads without advancing or resuming the controller. Mute preference survives runs; unmute respects pause. Exit/unmount/navigation and hidden/pagehide stop owned speech. Returning visible does not restart it.
- Local English voices only, preferring Microsoft David when available. Delayed discovery reads only the current cue. Missing/remote-only voices and absent/throwing APIs give readable text fallback without waiting for discovery or blocking progression. Synthesis errors require explicit recovery rather than an automatic retry loop. No microphone, cloud TTS, credentials or paid API.
- Five seconds bounds a silent start; sixty seconds bounds a started utterance. The longer speaking watchdog accommodates legitimate 15–35-second-plus scripts without falsely declaring failure at thirty seconds. It changes narration failure handling only.
- Manual Next/Previous and Automatic progression remain owned by unchanged GD-02B-1. **Automatic still uses four seconds after readiness. Speech completion never advances a stage or extends that timer.** Longer speech is intentionally preempted. For complete explanations, use Manual; any longer/per-stage dwell needs separate Planning approval, not a silent change here.
- GD-02B-2 targeting/scrolling/focus code is unchanged. Narration and visual guidance use the same stage. Speech cannot reveal targets, move focus, select readings or issue requests. Stage 6 remains non-persisting; manual maintenance stays separate and unchanged.

## Verification

Managed Linux, installed Chromium/software WebGL and existing dependencies; no installation or paid service. Speech browser tests use the existing deterministic mock, including unfinished utterances, missing voices and retained stale error callbacks. This tests lifecycle/synchronization, not installed Windows voice quality or hardware performance.

Browser tests/config were copied to `/tmp/maintainai-gd02b3-1ah45q53/frontend`, with node_modules/dist symlinks and temporary 8189/5389 substitutions for legacy 8000/5173 URLs. API command: `MAINTAINAI_DB_PATH=/tmp/maintainai-gd02b3-1ah45q53/<disposable>.sqlite3 .venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8189`. Preview: `./node_modules/.bin/vite preview --host 127.0.0.1 --port 5389 --strictPort`. Focused and full browser runs use distinct disposable databases; backend tests use existing temporary fixtures. No Windows/user records were accessed.

| Command | Result |
| --- | --- |
| `npm --prefix frontend test` | Final **185 passed / 21 files**; earlier content-only run 178 passed before added coverage |
| `.venv/bin/python -m pytest backend/tests -q` | **98 passed**, existing Starlette/AnyIO deprecation warning |
| `npm --prefix frontend run build` | Passed, existing large-chunk warning |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/gd02b3.spec.ts --workers=1 --timeout=120000` | **4 passed** |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test --workers=1 --timeout=120000` | **57 passed (12.6 minutes), no retries** |
| `git diff --check` and protected-file comparison against baseline | Passed; protected files unchanged |

The final full browser suite ran against fresh `/tmp/maintainai-gd02b3-1ah45q53/full.sqlite3` and the completed production build, with no source changes during the run. All 57 cases passed together without retries. No failed or interrupted test run occurred in this phase; partial runs are not combined into this result. New workflows cover 1366×768, 1280×720 and 390×844, actual diagnosis text, narration/visual-stage alignment, historical selection/Clear Selection, no rewind, Replay focus/target/request isolation, hidden pause/Resume, unfinished-speech Automatic progression, stale callbacks, missing voices and zero guided ticket POSTs. Existing full-suite coverage retains manual maintenance and all previous simulation/rendering/visual-guidance/draft/export safeguards.

## Limits and deferred work

Automatic mode may interrupt these longer scripts after its existing reading interval; this is intentional and separately changing that interval is only a recommendation for Planning. Actual Windows voices, pronunciation/duration, native screen readers and Windows GPU/FPS remain unverified. No complete GD-02B-5 acceptance claim.

No backend/API/schema, simulation/kinematics, diagnosis rules, controller readiness/transitions/timing, historical TCP, UI-03 selection, GD-02B-2 targeting/scrolling, maintenance persistence, dependencies or hosting changes. GD-02B-4 ticket confirmation and GD-02B-5 final acceptance remain deferred. Stop after the review PR; do not merge or deploy.
