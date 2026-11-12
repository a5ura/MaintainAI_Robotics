# UI-01 — Application shell and Operations workspace

Implementation for independent Code Review; no merge or deployment authorized.

## Baseline and execution boundary

Verified clean `main` and fetched `origin/main` at `a08f4e25ad36010f46eef3c593fe455bc94b001d` before creating `feature/ui01-operations-workspace`. Execution: managed Linux cloud workspace, November 11, 2026 (America/New_York; November 12 UTC). The existing Windows application and its SQLite records were neither accessed nor modified. No dependencies were installed and no paid service, hosting resource, billing setting or deployment was created.

Browser verification uses the production frontend build served on loopback port 5214 and FastAPI on 8044, with a dedicated synthetic SQLite database at `/tmp/maintainai-ui01/synthetic.sqlite3`. Existing running services on other ports were not used. A temporary copy of the Playwright configuration changes only the loopback port (including the two older tests with hard-coded frontend URLs); original browser assertions run unchanged except the explicitly scoped duplicate-text locators described below. Generated legacy screenshots and timing files stay outside the repository.

## Architecture and presentation

`App.tsx` remains the owner of the simulation clock, selected scenario, seed, diagnosis, busy/error state, request-generation guards, engineering settings, selected component and maintenance handoff. Its existing effects, request timing and `useGuidedDemo` callbacks remain intact. New components receive state and callbacks through props; they introduce no simulation state, backend requests or diagnostic calculations.

- `AppShell.tsx`: compact identity, cell context, Operations/Diagnostics/Maintenance navigation, skip link and explicit simulation/not-live-hardware label. Diagnostics retains in-page focus/scroll behavior within Operations.
- `OperationsWorkspace.tsx`: existing workcell, sensor indicators, phase/progress, controls, scenario/seed and Guided Demo entry. Approximately 65/35 desktop grid; single column on smaller screens. The existing lazy Workcell and error boundary remain in use.
- `InvestigationSummary.tsx`: idle/running/paused, pending, normal, detected, inconclusive and actionable error states. Presents the first two confirmed observations and the first backend-ranked hypothesis with its corresponding check; counts and an explicit full-details button expose the complete result. No invented confidence or reordering. Guided Demo narrative appears in the same investigation column.
- `DiagnosticDetails.tsx`: complete backend observations, ranked hypotheses, support/contradiction links, warnings, ranking explanation and ticket creation below the main workspace.
- `EvidenceTimeline.tsx`: one canonical complete timeline with the existing unique reference targets and keyboard focus behavior.
- `style.css`: scoped Operations layout and compact shell styling, semantic state colors, visible focus, responsive controls and local table scrolling. Engineering controls remain available below the primary workspace. No robot, camera, mesh, material, trajectory or animation changes.

The previous full diagnostics text remains available; the summary intentionally repeats a concise subset. `cycle.spec.ts` scopes its hypothesis-text assertion and `m2.spec.ts` scopes its exact vision-explanation assertion to the full Diagnostics Workspace, preserving the same content assertions when that text also appears in the summary.

## Changed-file inventory

- Frontend presentation: `frontend/src/App.tsx`, `AppShell.tsx`, `OperationsWorkspace.tsx`, `InvestigationSummary.tsx`, `DiagnosticDetails.tsx`, `EvidenceTimeline.tsx`, `style.css`.
- Component tests: `frontend/src/InvestigationSummary.test.tsx`, `frontend/src/DiagnosticDetails.test.tsx`.
- Browser tests: new `frontend/e2e/ui01.spec.ts`; locator scoping only in `cycle.spec.ts` and `m2.spec.ts`.
- Documentation/evidence: this report and `docs/evidence/ui01/` (screenshots, geometry, verification logs).

## Acceptance criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| AC-01 first viewport | PASS | Bounding rectangles for canvas, Start/Pause/Reset, scenario, seed, Guided Demo entry and outcome at 1366×768; additional 1280×720 checks. |
| AC-02 simulation fidelity | PASS | Existing model/scenario unit tests and real-cycle browser tests; model, scenario and fixture sources unchanged. |
| AC-03 diagnostic integrity | PASS | Summary state/order tests, full diagnostics and focused evidence navigation; backend ranking/rules unchanged. |
| AC-04 maintenance safety | PASS | Existing history, optimistic conflict/B01, Guided Demo handoff, and export regression tests; maintenance/export source unchanged. |
| AC-05 responsive layout | PASS | Actual document scroll-width assertions at 1366, 1280 and 390; viewport/full screenshots and resize test. |
| AC-06 regressions | PASS | Final commands/results below. |

## Verification

Final checks: **98 backend tests passed**, **78 frontend tests passed across 12 files**, **production TypeScript/Vite build passed**, **24 Playwright tests passed** (the complete 20 existing workflows plus four new UI-01 tests). Backend tests use temporary databases; browser writes are synthetic and isolated. Raw logs: [backend](evidence/ui01/backend.txt), [frontend](evidence/ui01/frontend.txt), [build](evidence/ui01/production-build.txt), [Playwright](evidence/ui01/playwright.txt).

The final production TypeScript/Vite build completed before the final browser run, including the new component test files in TypeScript checking. No concurrent rebuild or source changes occurred during final browser verification.

Commands:

```sh
.venv/bin/python -m pytest backend/tests -q
npm --prefix frontend test
VITE_API_BASE=/api VITE_API_TIMEOUT_MS=90000 npm --prefix frontend run build
# In the isolated frontend test copy, against loopback 5214/8044:
CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test
```

New focused coverage: nine summary component tests, one complete-diagnostics preservation test and four Playwright tests (three viewport/state matrices and resize during running/paused simulation). Existing B01 and maintenance/export workflows remain included in the full suite. Browser matrix tests also verify Diagnostics navigation from both Operations and Maintenance, evidence-reference focus, unique timeline IDs, Guided Demo pause/skip/takeover and diagnosis retry after a deliberate service error.

### Measured first-viewport geometry

At 1366×768, canvas bottom 531.5px; maximum essential-element bottom 736.5px. All tested x/y rectangles fit the viewport; page scroll width equals viewport width.

At 1280×720, canvas bottom 483.5px; maximum essential-element bottom 688.5px. All tested x/y rectangles fit the viewport; page scroll width equals viewport width.

## Screenshot evidence

Screenshots were captured and visually inspected in [evidence/ui01/screenshots](evidence/ui01/screenshots). Each required viewport (1366×768, 1280×720, 390×844) has both `*-viewport.png` and `*-full.png` for `idle`, `normal`, `fault`, `inconclusive`, `error` and `guided` (36 PNGs). Desktop `*-geometry.json` records bounding rectangles. Screenshots use 100% browser zoom without transforms or content hiding.

Normal and fault results come from the actual backend. The inconclusive test deliberately forwards only the first synthetic sample to the actual backend; it does not fabricate a diagnosis response. The error state deliberately returns HTTP 503 through a browser test route, then removes that route and verifies successful real diagnosis retry. The active Guided Demo screenshot pauses the genuine orchestration before any ticket write. These are reproducible test conditions, not claims about naturally occurring production failures.

## Protected behavior and limitations

No changes to backend code, API contracts, diagnostic algorithms/ranking, kinematics/model, scenarios/seed logic, fixtures, Workcell scene, Guided Demo reducer/hook/banner, Maintenance/B01, report exporters, schemas, quotas, database adapters or hosting/deployment configuration. No data migration or real-record access. App-owned state and asynchronous guards are preserved through presentation extraction.

Cloud Chromium uses software WebGL. Windows browser/GPU performance, Windows-local visual verification, assistive-technology review and hosted acceptance remain unverified. Mobile intentionally requires vertical scrolling; the complete evidence table scrolls horizontally inside its own container. The existing large Three/Workcell bundle warning remains (843.84 kB minified, 226.69 kB gzip); scene optimization belongs outside UI-01. Backend tests retain one existing Starlette/AnyIO deprecation warning.

Exploratory checks exposed duplicate-text locators, a build-overlap stale lazy-loaded asset and the old green inconclusive detail badge. Locator scoping and the presentation badge were corrected; only the successful final full-suite run is counted as acceptance.

Stop after opening the review PR. Independent Code Review and Planning approval are required before any merge or further phase.
