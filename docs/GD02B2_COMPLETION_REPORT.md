# GD-02B-2 — Visual guidance completion

November 16, 2026 (America/New_York). GD-02-SPEC-v1.1. This change implements visual guidance only; independent Code Review and separate merge authorization remain required. No merge or deployment.

## Baseline and scope

Clean preflight checkout: `feature/gd02b1-guided-controller` at `23e095669ba6c2425d0de6ffebf35e22a7064177`. Fetched and verified required main `3fa8f53f34afe89fb81fd13cc8dba943564ec648`, including merged GD-02B-1. Created `feature/gd02b2-visual-guidance` directly from verified main. The review PR records the final head SHA.

All existing ignored/untracked/local files and user SQLite data were preserved. Execution used the existing managed Linux workspace and installed dependencies. No new dependencies, paid services, billing, resources, migration, destructive Git commands or branch deletions.

## Implementation and stage targets

`GuidedVisuals` reads the existing controller state; it never dispatches a transition. `guideTargets.ts` maps the six stable stage IDs to real DOM anchors and a short explanation. `useGuideVisuals` owns DOM highlighting, scrolling and focus only. Its presentation state (`missing` and last explicitly revealed area) is not another walkthrough controller or evidence-selection state.

| Stage | Primary `data-guide-target` | Additional outlined areas | Purpose |
| --- | --- | --- | --- |
| Introduction | `workcell` | — | Existing simulated robot/workcell; explicit not-live-hardware disclosure |
| Robot Operation | `workcell` | `simulation-controls` | Actual motion and run controls |
| Fault Detection | `fault-status` | `fault-sensors` | Existing outcome/analysis progress and real sensor-strip state, without claiming a cause |
| Evidence Investigation | `evidence-timeline` | `evidence-inspector`, `workcell` | Actual readings, inspector and existing selected historical TCP marker |
| Diagnosis and Next Checks | `candidate-comparison` | — | Unchanged backend-ordered support, contradiction and checks |
| Maintenance Handoff | `maintenance-handoff` | — | Existing non-persisting explanation; no ticket-confirmation action |

Primary outlines are solid; secondary outlines are dashed. They attach to actual elements and resize naturally with their boxes. No mask, full-screen backdrop, pointer interception, fake telemetry, extra Three.js geometry or historical robot replay. A small sticky navigation strip exposes the current stage/why, **Show focus area**, relevant secondary-area links and **Walkthrough controls**. The original controller buttons remain in their original panel rather than being duplicated.

## Scrolling, lifecycle and focus ownership

- Activation is keyed by the existing run epoch and stage, not telemetry, narration, readiness, playback mode or pause-entry tokens. One cancellable animation frame reveals a newly available primary target. Already visible targets do not scroll. Oversized timelines/comparisons reveal their heading and the portion fitting the viewport; the whole region need not fit at once.
- Explicit links reveal/focus non-action regions or the existing walkthrough heading. The controller, clock, seed, diagnosis and evidence selection are never invoked or changed by guidance.
- Scroll positioning reserves the measured sticky-strip height. Native evidence-row scroll margins and the existing selected-reading sticky strip account for that height. Resizing can reveal the current visual area if clipped; CSS outlines cannot retain stale floating-overlay coordinates.
- Normal motion uses native smooth scrolling; reduced motion uses immediate scrolling. Turning reduced motion on, pause, hiding the tab, stage changes, exit and unmount cancel owned motion. Pointer/wheel/scroll-navigation keys can interrupt it without prevented default behavior. Native scroll completion is used rather than an elapsed timer, including when browser tests accelerate simulation time.
- Mutation observation handles target mount/removal/visibility changes. It excludes character-data changes, so telemetry text and narration callbacks do not repeatedly reveal the page. Resize observation measures the sticky strip. Observers/listeners and queued frames are cleaned up; old activations cannot reattach attributes or scroll after exit/reset.
- Automatic progression never moves keyboard focus. Explicit reveal buttons focus only non-action regions with `tabIndex=-1`; normal Tab navigation and existing controls remain available. No trap or action is activated by focus.
- An owned exit restores focus to the current Start Guided Demo button. Intentional navigation elsewhere keeps its own focus behavior, including Diagnostics focusing its workspace. Reset does not restore focus to a removed entry button.
- A persistent polite, atomic description announces stage changes and describes outlined targets. It exposes a status role only while guidance is active, avoiding an empty competing maintenance status. Mode, clock and pause rerenders do not repeat the stage announcement. Missing targets retain text/controls and a visible unavailable explanation; they do not change controller readiness.

Paused guidance keeps its current outlines. Returning from a hidden tab does not resume the walkthrough or replay its entry scroll. Stage 6 remains terminal and creates no ticket. Manual maintenance forms remain unchanged.

## Exact changed files

New presentation modules/tests:

- `frontend/src/guideTargets.ts`
- `frontend/src/useGuideVisuals.ts`
- `frontend/src/GuidedVisuals.tsx`
- `frontend/src/GuidedVisuals.test.tsx`
- `frontend/e2e/gd02b2.spec.ts`

Integration and anchors:

- `frontend/src/App.tsx` — render the presentation beside the existing shell content
- `frontend/src/OperationsWorkspace.tsx` — workcell, sensor, controls and entry anchors; non-action focus groups
- `frontend/src/InvestigationSummary.tsx`
- `frontend/src/EvidenceTimeline.tsx`
- `frontend/src/EvidenceInspector.tsx`
- `frontend/src/CandidateComparison.tsx`
- `frontend/src/GuidedBanner.tsx` — heading and existing handoff-paragraph anchors
- `frontend/src/style.css` — anchored outlines, sticky navigation, focus/scroll offsets and responsive/reduced-motion rules
- `docs/GD02B2_COMPLETION_REPORT.md`

Representative screenshot files (documentation only; no new runtime assets):

- [1366×768 workcell](evidence/gd02b2/1366-workcell.png) — `docs/evidence/gd02b2/1366-workcell.png`
- [1280×720 evidence](evidence/gd02b2/1280-evidence.png) — `docs/evidence/gd02b2/1280-evidence.png`
- [390×844 handoff](evidence/gd02b2/390-handoff.png) — `docs/evidence/gd02b2/390-handoff.png`

Protected comparison: no changes to backend/schema/repository/API contracts, `guided.ts`/`useGuidedDemo.ts` transition rules, narration controller/scripts, simulation/kinematics, diagnosis rules, Three.js rendering, historical TCP calculation, UI-03 selection controller, maintenance forms, dependencies or deployment configuration.

## Verification and disposable data

Browser execution used installed Chromium with software WebGL on managed Linux, not Windows GPU hardware. Speech-enabled cases use the existing deterministic speech mock; they do not establish installed Windows voice availability/quality. Native assistive-technology acceptance was not performed.

Tests/configuration were copied to `/tmp/maintainai-gd02b2-7n1bkalz/frontend`, symlinking existing node_modules and production dist. Only that temporary copy substitutes API/preview ports 8188/5388 for legacy 8000/5173 URLs. Legacy generated reports/screenshots stay outside the checkout.

API command: `MAINTAINAI_DB_PATH=/tmp/maintainai-gd02b2-7n1bkalz/<disposable>.sqlite3 .venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8188`. Preview command in the temporary frontend: `./node_modules/.bin/vite preview --host 127.0.0.1 --port 5388 --strictPort`. Focused, initial full and final full runs use disposable database paths; backend tests use existing temporary fixtures. No requests target user/Windows records.

| Command | Result |
| --- | --- |
| `npm --prefix frontend test -- src/GuidedVisuals.test.tsx` | Initial 15 passed / 1 assertion failure; corrected scroll-cancellation expectation |
| `npm --prefix frontend test` | Final **178 passed / 21 files** |
| `.venv/bin/python -m pytest backend/tests -q` | **98 passed**, one existing Starlette/AnyIO deprecation warning |
| `npm --prefix frontend run build` | Passed; existing large-chunk warning |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/gd02b2.spec.ts --workers=1 --timeout=120000` | Initial 4 passed / 1 Diagnostics-focus expectation failure; corrected expectation, then 6 passed including added native-motion coverage |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/b01.spec.ts e2e/gd02b2.spec.ts --workers=1 --timeout=120000` | After status-role correction: **7 passed** |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test --workers=1 --timeout=120000` | Final complete run: **53 passed (12.1 minutes), no retries** |
| `git diff --check` and protected-file comparison to the baseline | Passed; protected files unchanged |

Development failures are recorded rather than counted as passes. The first unit assertion treated cancelling ongoing smooth motion as an extra reveal; the test now distinguishes completed entry scrolling. The initial browser case incorrectly expected Diagnostics to retain button focus instead of its existing workspace focus. The first complete browser attempt found the real empty inactive guidance-status conflict with B01's maintenance notification; the guidance role is now conditional, with a focused regression. That attempt was stopped for correction: **7 passed, 1 failed, 1 interrupted, 44 not run**. It is not a complete pass or combined with later results. The earlier full frontend run passed 177 tests before adding the inactive-status regression.

The final complete run used fresh `/tmp/maintainai-gd02b2-7n1bkalz/final.sqlite3` and the completed production build with no source changes during the run. All 53 workflows passed together; earlier partial/focused results are not combined into this pass. Required 1366×768, 1280×720 and 390×844 layouts passed, including no horizontal overflow, visible outlined targets below the sticky strip, usable touch targets and mode/keyboard/resize behavior. The unchanged UI-01/UI-02/UI-03 scenario, actual FK/TCP/marker, camera/recovery/fallback/resource, narration, B01 concurrency/draft, history and export workflows also passed. No unresolved functional test failure is known. The new workflows check real deterministic Dropped Object playback, actual E6/E5 marker positions, Clear Selection, modes/Previous without rewind, keyboard navigation, owned focus restoration, hidden-tab pause, resize and unavailable targets, native smooth cancellation, reduced motion, no duplicate announcements during telemetry, zero guided ticket POSTs and unchanged maintenance records.

## Limitations and deferred work

Large regions are revealed at their heading; normal scrolling remains necessary to read an entire table/comparison. When following a distant area in Manual mode, the sticky **Walkthrough controls** link returns to the one existing control panel. No controller controls or stage state were duplicated.

No FPS, Windows GPU, native screen-reader or actual Windows speech acceptance claim. Anchored CSS does not require per-frame overlay measurement or continuous scene rendering. No new shadow, post-processing, model or dependency.

GD-02B-3 narration redesign, GD-02B-4 explicit ticket confirmation/persistence, and GD-02B-5 final acceptance remain deferred. No paid services, deployment, merge or branch deletion. Stop for independent Code Review.
