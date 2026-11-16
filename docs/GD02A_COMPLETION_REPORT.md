# GD-02A — Clear Selection completion

November 16, 2026 (America/New_York). Implemented GD-02A only under GD-02-SPEC-v1.1; GD-02B was not started. Independent Code Review and explicit merge authorization remain required. No merge or deployment.

## Baseline and scope

- Verified clean checkout before editing: `feature/ui03-diagnostic-investigation`, HEAD `2cdf8d82e52921712e224f43e6ce40976395f111`.
- Fetched and verified remote main at `7f3fe387142cd71973fbe33af2031b83a31d513a` (merged UI-03 PR #15). The preceding checkout has identical files to this merge.
- Created `feature/gd02a-clear-selection` directly from verified `origin/main`. Remote main remained at the approved SHA during final checks. The PR records the final head SHA.
- Existing local, ignored and untracked files were preserved. No destructive Git operations, dependency installations, hosting or billing actions.

## Implementation and exact changed files

1. `frontend/src/OperationsWorkspace.tsx`: use the existing investigation context and render a native **Clear Selection** button immediately after Reset whenever `selectedId` is non-null, including unresolved references. Invoke the existing epoch-protected `clear()` directly. Hide the button when nothing is selected. Existing styles and responsive control wrapping are sufficient; no CSS change.
2. `frontend/src/Investigation.test.tsx`: test the actual workspace control, E6 → E5 replacement, clearing/reselection, unresolved references, immutable diagnosis/candidate order and running/paused transport isolation. Preserve all previous tests.
3. `frontend/e2e/ui03.spec.ts`: extend existing scenario/viewport and paused-guide workflows to exercise the new control, Enter/Space, inspector/timeline reset, reselection and state/API isolation. Add an ambiguous-reference case using a deliberately duplicated reading in a disposable API response.
4. `frontend/e2e/sceneProbe.ts`: extend the existing test-only probe to read actual live joint/TCP/workpiece world matrices and camera world matrix. This supports independent before/after pose and orientation comparisons; no production telemetry or debug endpoint.
5. `docs/GD02A_COMPLETION_REPORT.md`: this report.

Only five lines were added to application source. No changes to `evidenceSelection.tsx`, backend, schemas, API contracts, diagnosis algorithms, simulation/FK, scenarios, workcell rendering, guide/narration controllers, hosting configuration or dependencies.

## Verification

Execution location: managed Linux cloud workspace, installed Chromium with software WebGL; not Windows hardware.

| Command | Result |
| --- | --- |
| `npm --prefix frontend test -- src/Investigation.test.tsx src/evidenceSelection.test.tsx` | Final focused run: 17 passed / 2 files |
| `npm --prefix frontend test` | Final full run: 152 passed / 19 files |
| `.venv/bin/python -m pytest backend/tests -q` | 98 passed; one existing Starlette/AnyIO deprecation warning |
| `npm --prefix frontend run build` | Passed; existing large-chunk warning |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/ui03.spec.ts --workers=1 --timeout=120000` | 6 passed, 1 failed on initial canvas readiness |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/ui03.spec.ts --grep 'invalid backend FK' --workers=1 --timeout=120000` | Isolated retry: 1 passed |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/gd01.spec.ts e2e/ui01.spec.ts e2e/b01.spec.ts e2e/exports.spec.ts --workers=1 --timeout=120000` | 14 passed, 1 failed on lazy Maintenance readiness |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/gd01.spec.ts --grep 'real cycle and automatic save' --workers=1 --timeout=120000` | Isolated retry: 1 passed |
| `git diff --check` and protected-file comparison against baseline | Passed; protected files unchanged |

All **22 distinct browser workflows executed have passing results across these runs**. This is not a clean single-run browser-suite pass or a claim that the complete browser suite ran. No automatic retries were configured for these commands.

Development failures: the first production build rejected unsupported Testing Library `exact` options in the new unit test. Those options were removed; final full tests and build passed. The first focused browser run timed out after five seconds waiting for the initial canvas in the existing invalid-FK workflow. The broader run timed out after five seconds while the existing guide-completion workflow displayed “Loading maintenance…”; the ticket had already been saved and the guide reached COMPLETE. Both passed isolated retries without application/test changes. No remaining failed workflow; the observed readiness flakiness remains a limitation.

### Browser evidence and safety

Browser commands ran from `/tmp/maintainai-gd02a-uyxvgm8d/frontend`, a temporary source/test copy with existing `node_modules` and production `dist` symlinks. Its existing proxy/base URLs were adjusted from 8000/5173 to isolated loopback ports 8186/5386; legacy evidence output stayed outside the repository. These test-environment adjustments were not committed.

The API was started with:

```sh
MAINTAINAI_DB_PATH=/tmp/maintainai-gd02a-uyxvgm8d/synthetic.sqlite3 .venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8186
```

The broader browser run used a restarted API with a second fresh database, `/tmp/maintainai-gd02a-uyxvgm8d/broader.sqlite3`. Preview command in the temporary frontend: `./node_modules/.bin/vite preview --host 127.0.0.1 --port 5386 --strictPort`. Backend tests use existing temporary-database fixtures. No tests accessed Windows-running applications or user SQLite records. Guide/maintenance regression tests intentionally create synthetic tickets only in disposable databases.

- All five fixed scenarios plus seeded random passed at **1366×768, 1280×720 and 390×844**, including no horizontal page overflow.
- E6 and E5 markers are checked against recorded TCPs through actual Three.js world transforms. Clear Selection removes the scene group and inspector/timeline selection; E6 can be selected again.
- Actual live robot/workpiece matrices and camera orientation/position remain equal across clearing. Clock, transport state, Inspection preset, diagnosis summary, candidate order, guide pause/stage, speech counters and page API requests remain unchanged.
- Paused-guide checks compare maintenance records before/after clearing. Marker resources are released; WebGL recovery and text-only fallback remain covered.
- Missing/ambiguous references can be cleared and do not retain the previous marker. Existing monotonic-epoch, stale callback and Strict Mode tests remain intact and pass.

## Limitations and review boundary

Windows browser/voice/GPU behavior and native assistive-technology testing were not performed. Cloud software-WebGL results do not establish Windows FPS. Existing short lazy-loading readiness assertions showed the two recorded transient failures. No new performance claims are made.

Existing GD-01 automatic ticket behavior remains unchanged; explicit confirmation belongs to separately authorized GD-02B work. Stop at the review PR: do not merge or deploy.
