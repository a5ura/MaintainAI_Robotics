# GD-02C-1 — Recruiter demo polish

November 16, 2026 (America/New_York). Scope: acceptance findings F01–F03 only; independent review required. No merge, deployment or GD-02C-2 work.

## Baseline and scope

Fetched `origin/main` and verified required baseline **`512b6ad216ec79253fcfdd00fd3c3e584a4e8a26`**, including merged GD-02B-5 / PR #21. Confirmed a clean working tree, then created `feature/gd02c1-recruiter-polish` directly from that baseline. Existing branches, ignored/local/untracked files and user SQLite records were preserved. The exact final head is recorded in the PR body and completion response after committing this report; a commit cannot contain its own final SHA without changing it.

This is a presentation/documentation correction. All existing controller, persistence, UUID, diagnosis, simulation and API ownership remains unchanged. No dependency was added. No hosting, billing, migration, deployment, branch deletion or merge was performed.

## Before and after

| Finding                  | Before                                                                                                                                                                  | After                                                                                                                                                                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01 — Stage 6 guidance   | Sticky navigation and its accessible description still said confirmation was future functionality and no ticket was created, even beside a saved ticket reference       | App passes the current **readable narration explanation** to the existing visual guidance. Stage 6 uses that same text for visible guidance and the polite accessible description, independent of voice support/mute. Other stages retain their original descriptions.                                         |
| F02 — onboarding/status  | README promised automatic creation and obsolete Skip controls; current status opened with UI-02 awaiting review and listed implemented overlays/guide as remaining work | Current checkpoint identifies the verified merged baseline and six stages, Manual default, optional Automatic, confirmation, recovery limits and pending platform/hosting gates. Prior milestones retain their content under explicit historical headings.                                                     |
| F03 — competing controls | Bright manual Start competed with off-screen guide Next; the controls link had no explanation of where Next was                                                         | During the guide, the same Start button says **Start manually (exit walkthrough)** and loses its primary emphasis. Existing **Walkthrough controls** and guide **Next** receive the existing primary styling; a short sticky hint points to Next/Previous. No extra controller or navigation action was added. |

### Stage 6 state mapping

No second state machine or duplicated phase-to-message logic was introduced. `useGuideNarration` already derives readable text from the current handoff attempt; `App` supplies that existing text to `GuidedVisuals`, which uses it **only in Stage 6**. The voice engine and script selector are unchanged. Missing standalone presentation input has an accurate non-writing confirmation explanation rather than the old future-feature claim.

| State                                    | Guidance and narration convey                                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preview / confirmation not yet submitted | Review the diagnosis and proposed ticket; Create maintenance ticket opens confirmation; only explicit confirmation authorizes a persistent record. |
| Submitting                               | Confirmed request awaits a server response; persistence is not yet confirmed; do not submit another ticket.                                        |
| Confirmed success                        | Backend confirmed the **actual returned ticket reference**; no repair or operator verification is claimed.                                         |
| Confirmed rejection                      | Server rejected the confirmed request; review the displayed rejection before explicit retry of that same attempt.                                  |
| Uncertain                                | A ticket may already exist; review the retained request and reconcile the same identity rather than creating a new one.                            |

Text changes do not restart visual-guidance ownership, change progression, scroll on telemetry updates or programmatically steal focus. Existing resize/target handling remains responsible for fitting the sticky strip. Stage 6 confirmation, initial UUID generation, immutable payload, synchronous request mutex, page-session ledger and reconciliation are untouched.

### Control and documentation boundaries

The existing controls-reveal callback still scrolls/focuses the original walkthrough heading; it never advances a stage. Actual Next/Previous readiness/disabled conditions are unchanged. Manual Start still uses the existing takeover callback and resumes the same simulation without rewind. Outside the guide its label/emphasis remains **Start**. The simulation Pause control still pauses the guide while active, and simulation Reset still exits/resets; documentation distinguishes those behaviors rather than incorrectly claiming every simulation control exits.

README now distinguishes the guided confirmation path from the existing Diagnostics-to-manual-form handoff. No manual form, button callback, maintenance history, concurrency/B01 handling or export code changed. Historical requirements/reports are not rewritten into current claims. The authoritative GD-02 requirements remain the approved assignments/reports and implementation; consolidating a standalone specification remains separate work.

## Exact changed-file manifest

- `frontend/src/App.tsx` — pass the existing readable cue to visual guidance.
- `frontend/src/GuidedVisuals.tsx` — Stage 6 explanation display, accessible description and existing-navigation emphasis/hint.
- `frontend/src/guideTargets.ts` — accurate standalone Stage 6 fallback copy.
- `frontend/src/OperationsWorkspace.tsx` — conditional manual Start label/style only.
- `frontend/src/GuidedBanner.tsx` — primary class on the existing Next button only.
- `frontend/src/style.css` — scoped navigation-hint typography.
- `frontend/src/GuidedVisuals.test.tsx` — five handoff states, cue equality, no stale cross-stage copy, no phase-update focus/scroll restart.
- `frontend/src/GuidedFlow.test.tsx` — label/hierarchy and unchanged same-run manual takeover.
- `frontend/e2e/gd02c1.spec.ts` — three viewport workflows plus rejection/lost-response/reconciliation coverage.
- `README.md` — current onboarding and clearly historical checkpoints.
- `docs/DEVELOPMENT_STATUS.md` — current merged/guide status and clearly historical milestones.
- `docs/GD02C1_COMPLETION_REPORT.md` — this report.
- `docs/evidence/gd02c1/*` — the eleven screenshots and verification logs indexed below; synthetic test records only.

## Verification and isolation

Execution: existing managed Linux workspace, installed Chromium/software WebGL and installed dependencies. Speech browser cases use the existing deterministic mock. Windows voice/GPU, native screen-reader and hardware FPS acceptance are not established by these runs.

Backend tests use their existing `tmp_path` fixtures/dependency overrides, with `MAINTAINAI_DB_PATH=/tmp/gd02c1-unused-test-default.sqlite3` guarding the unused default. Browser e2e/config/src files are copied under `/tmp/maintainai-gd02c1-4pc32yal/frontend`, with installed node_modules and production dist symlinks. Only that temporary harness substitutes legacy URLs 8000/5173 with **8193/5393**. Each browser phase uses a distinct fresh disposable SQLite path; no user/Windows/default development records are used.

API, from repository root:

```sh
MAINTAINAI_DB_PATH=/tmp/maintainai-gd02c1-4pc32yal/full.sqlite3 .venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8193
```

Preview, from the temporary frontend:

```sh
./node_modules/.bin/vite preview --host 127.0.0.1 --port 5393 --strictPort
```

| Command                                                                                                                                                                                                          | Result                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm --prefix frontend test`                                                                                                                                                                                     | **215 passed / 22 files** (207 existing + 8 focused regressions)                                             |
| `.venv/bin/python -m pytest backend/tests -q`                                                                                                                                                                    | **98 passed**, one existing Starlette/AnyIO deprecation warning                                              |
| `npm --prefix frontend run build`                                                                                                                                                                                | **Passed**; existing large-chunk warning; Vite 4.23 s                                                        |
| `frontend/node_modules/.bin/tsc --project frontend/tsconfig.json --noEmit`                                                                                                                                       | **Passed**, configured production/component-test scope                                                       |
| `GD02C1_EVIDENCE_DIR=/workspace/MaintainAI_Robotics/docs/evidence/gd02c1 CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/gd02c1.spec.ts e2e/gd02b4.spec.ts --workers=1 --timeout=120000` | **8 passed together (1.8 minutes)** on `focused.sqlite3`; no retries                                         |
| Same browser environment, `./node_modules/.bin/playwright test --workers=1 --timeout=120000`                                                                                                                     | **72 passed (20.0m); zero failures/retries/skips** on fresh `full.sqlite3`; all 72 cases in one complete run |
| Changed source/test/report formatting, `git diff --check`, protected-file comparison                                                                                                                             | **Passed**; protected contract files unchanged                                                               |

The complete browser run used the final production build with no source/build changes during the run. All 72 workflows passed together without retries; the separate focused run is not combined into that count. No browser run failed or was interrupted.

The first frontend execution also passed all 215 cases, but its accompanying build caught a test-only unsupported `exact` option on a Testing Library role query. Removing that unused query option corrected typing; the final full frontend run, build and configured TypeScript check then passed. No production behavior was altered to fix the assertion. Existing non-blocking Three.js test-import, Starlette/AnyIO, large-chunk and Node color-environment warnings remain in the logs.

The configured TypeScript check does not include e2e files. The prior audit's optional strict e2e typing gap (Node declarations/existing helper typing) remains outside this correction; no type dependency/shim/configuration change was made.

### Explicit preservation checks

- Preview, Automatic playback, navigation and narration send no ticket POST without confirmation; existing complete Manual/Automatic six-stage workflows remain in the full browser suite.
- Cancel and Escape send no ticket request and restore focus. A double-confirm event still produces one request and one persisted ticket/history creation event.
- Focused C1 coverage holds a real saved response to assert submitting guidance before release, then checks the actual returned ticket reference in guidance, narration and saved history.
- Rejection coverage uses a synthetic HTTP 403 policy response, followed by a real SQLite commit whose browser response is aborted. The UI reports uncertainty and disables conflicting guided creation; explicit reconciliation sends the **byte-identical original payload/UUID**. Exactly one ticket and one creation event persist.
- Existing B-4 coverage independently retains unresolved requests across new walkthroughs/navigation and preserves manual drafts. B01 conflict/history/export coverage remains intact.
- Keyboard activation of the existing reveal link focuses the original controls heading. Manual Start exits through the same callback, preserves time and advances the same run. Primary styling/labels do not change disabled conditions.
- Screenshots and document-width assertions cover **1366×768, 1280×720 and 390×844**, with no horizontal page overflow in preview/success views. Existing native-modal accessibility, viewport, camera, FK/TCP, historical selection, WebGL recovery/resource and hidden-tab tests remain unchanged.
- Baseline comparison confirms **no changes** to backend, persistence/API/helper, confirmation/UUID logic, manual maintenance, diagnosis/rules, fixtures, model/scenarios/FK, guide reducer/controller/four-second dwell, narration controller/scripts, visual-guidance controller, dependencies or hosting configuration.

## Evidence index

These are actual application screenshots with synthetic data and speech mocks, not generated mockups or native Windows voice evidence.

| View                                          | 1366×768                                               | 1280×720                                               | 390×844                                               |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------- |
| Manual takeover versus walkthrough navigation | [Screenshot](evidence/gd02c1/1366-manual-vs-guide.png) | [Screenshot](evidence/gd02c1/1280-manual-vs-guide.png) | [Screenshot](evidence/gd02c1/390-manual-vs-guide.png) |
| Stage 6 preview                               | [Screenshot](evidence/gd02c1/1366-handoff-preview.png) | [Screenshot](evidence/gd02c1/1280-handoff-preview.png) | [Screenshot](evidence/gd02c1/390-handoff-preview.png) |
| Stage 6 actual saved reference                | [Screenshot](evidence/gd02c1/1366-handoff-saved.png)   | [Screenshot](evidence/gd02c1/1280-handoff-saved.png)   | [Screenshot](evidence/gd02c1/390-handoff-saved.png)   |

Additional state screenshots: [verified rejection](evidence/gd02c1/rejected.png), [uncertain outcome](evidence/gd02c1/uncertain.png). Logs: [frontend](evidence/gd02c1/frontend.log), [backend](evidence/gd02c1/backend.log), [build](evidence/gd02c1/build.log), [focused browser](evidence/gd02c1/focused-browser.log), [complete browser](evidence/gd02c1/full-browser.log). Configured TypeScript produced no diagnostic output on success.

## Remaining limitations and stop point

This correction addresses F01–F03 without claiming a new full platform acceptance. F04 engineering-evidence density remains deferred; no formatting of mathematical data was changed. Next/Previous still live in the original panel and require the existing highlighted reveal link when off-screen. Long Stage 6 text and previews use vertical scrolling, especially on mobile; no new navigation system was added.

Automatic dwell remains four seconds and may interrupt narration. Native Windows voices/GPU, native screen readers, longer-session profiling and hosted release gates remain as recorded in GD-02B-5. Reload recovery remains deferred; independent UUIDs/tabs/manual tickets are not globally deduplicated, and access/quota policy can deny reconciliation. No new claim of hosting, billing eligibility, safety certification or completed operator verification.

Stop after the review PR for independent Code Review and Planning review. No merge, deployment, branch deletion, new dependency or GD-02C-2 work.
