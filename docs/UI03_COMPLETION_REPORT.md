# UI-03 Core — Diagnostic investigation completion report

UI-03-SPEC-v1.0 implementation for independent Code Review. No merge or deployment.

## Baseline and review identity

- Verified baseline: `24dc78674148d7981eedf6f2482ceed44b653e90`, UI-02 PR #14 merged into main.
- Verified clean previous UI-02 checkout at `0aa4ef62bf885d2295dc9dcc2496f57870211e89`, whose tracked tree matched the merge. Fetched current main, fast-forwarded local main and created `feature/ui03-diagnostic-investigation` from main, not the former feature branch.
- Verified implementation/evidence commit: `b89d4c8d33a29909f467dd16bd434ea328770042`.
- PR: https://github.com/a5ura/MaintainAI_Robotics/pull/15. The PR head and final completion response identify the documentation-only finalization commit following the verified implementation commit.

Execution: existing managed Linux cloud workspace with existing installed dependencies, loopback Chromium/software WebGL. No dependency installation, paid services, account changes, provisioning, hosting or deployment. No Windows application or user SQLite files accessed. The API uses fresh `/tmp/maintainai-ui03-ca7kg78z/synthetic.sqlite3` on 8184 and frontend preview on 5384. A temporary frontend test copy adjusts proxy/base URLs and legacy hardcoded browser URLs from 8000/5173 to these disposable ports. The production dist is shared by symlink; legacy generated evidence remains outside this checkout. Existing untracked/ignored user files were preserved; authorized builds refresh generated build/test artifacts only.

## Implementation by phase

| Phase | Delivered behavior |
| --- | --- |
| UI-03A | Result-object and run/context-scoped selection, explicit clearing on reset/scenario/seed/result/workspace/ticket-entry changes, stale callback guards, missing/ambiguous reference handling. Seven contract tests passed before visual integration. |
| UI-03B | Observed outcome, supporting observation links, unconfirmed leading cause and next check. Two concise observations remain initially visible; remaining observations are explicitly expandable. First warning stays visible and every additional warning is discoverable. Compact investigation orientation replaces the idle hint. |
| UI-03C | Keyboard-operable reading rail, selected table row, focused inspector with recorded signals/poses/FK/camera/placement/controller/events and complete raw JSON, plus a separate historical TCP marker and caption. Original reference destinations and the full evidence table remain; joints/TCP are additionally visible in the table. A sticky selected-reading navigation bar makes the inspector/workcell destinations discoverable after row navigation. |
| UI-03D-Core | All returned candidates initially expanded in their original backend order, with anomaly association, support, contradictions and checks in comparison columns (stacked on mobile). No global ranks, new confidence calculations or cause confirmation. |
| UI-03E | Unit/component, real-backend browser, scenario/viewport, native WebGL recovery/resource and complete existing regression verification. Results below. |

## Contracts and lifecycle

`App` supplies `useEvidenceSelection` the active result and a scope containing the existing simulation generation, scenario, seed, workspace and initial ticket context. Selection stores its originating result object and scope alongside the evidence ID. A different result or scope immediately makes it ineligible, then clears stored selection. Old selection callbacks are rejected against the latest context; existing App generation guards continue rejecting stale diagnosis responses. Reset explicitly changes scope even when deterministic replay returns the same diagnosis ID.

The provider is inactive in Maintenance. Saved-ticket references retain their existing navigation, without historical scene reconstruction. No database, API, schema, export format or verification-state contract was added.

References retain `#evidence-E…` navigation and focus behavior; clicking an active reference additionally selects its reading. Existing hash navigation still stops narration as before. Reading-rail buttons select without navigation and do not stop, restart or retime narration. The browser integration test asserts both speech/cancellation counts remain unchanged for these buttons. No guide stage/timer/narration controller was changed. An explicit “View historical marker in workcell” button scrolls/focuses the workcell without changing camera or simulation state.

Historical geometry requires finite recorded time, joints and TCP; backend-valid kinematics; finite expected TCP/error/tolerance; and consistency of recorded position metadata within the supplied backend tolerance. It uses the recorded TCP itself, never `trajectory(currentTime)`, scenario inference, or saved-ticket prose. Missing/invalid/contradictory position metadata yields no spatial geometry and retains textual inspection. The caption can remain as historical text when WebGL/spatial highlighting is unavailable. This presentation validation does not change diagnosis status or rules.

The marker is a violet wireframe octahedron and ring, independent of the live robot, gripper/object, engineering selection and UI-02 symptom markers. No clock scrubbing, robot replay, automatic camera adjustment, animation, shadows or post-processing. Demand rendering and DPR `[1, 1.5]` remain intact.

Unknown gripper readings are labelled UNKNOWN; placement with no recorded position is explicitly absent only when its presence field is false, otherwise unknown/unavailable. Recorded camera confidence is identified as camera input, not cause probability. Every candidate and reference remains backend-derived.

## Changed files

Source/components: `App.tsx`, `evidenceSelection.tsx`, `InvestigationSummary.tsx`, `EvidenceReferences.tsx`, `EvidenceTimeline.tsx`, `EvidenceInspector.tsx`, `CandidateComparison.tsx`, `EvidenceHighlight.tsx`, `DiagnosticDetails.tsx`, `Workcell.tsx`, and `style.css` under `frontend/src/`.

Tests: new `evidenceSelection.test.tsx`, `Investigation.test.tsx`, and `frontend/e2e/ui03.spec.ts`; updated summary/reference/App tests for intentional presentation changes. The legacy `cycle.spec.ts` now opens the release-candidate disclosure only if collapsed, preserving the original evidence assertions with the new expanded comparison default. Existing mathematical, diagnosis, maintenance and narration assertions remain included.

Complete path-by-path manifest: [changed files](evidence/ui03/changed-files.txt). Evidence is confined to `docs/evidence/ui03/`; old UI-01/UI-02/GD-01 artifacts are preserved.

## Final verification

| Check | Actual result |
| --- | --- |
| Initial selection contracts | 7 passed before visual integration |
| Final frontend | **147 passed / 19 files**; 13 additional tests over UI-02 |
| Backend | **98 passed**, one existing deprecation warning |
| Final TypeScript/Vite production build | **PASS** |
| Initial focused UI-03 browser suite | **6 passed** on the integration build |
| First complete browser run | **41 passed / 1 failed**: UI-01 1366×768 lazy-canvas startup timeout |
| Complete browser run on final application build | **41 passed / 1 failed**: UI-03 resource-test wait race, described below |
| Final isolated retry after test-only correction | **1 passed / 0 failed** with `--last-failed --workers=1 --timeout=120000` |

**All 42 unique browser workflows have passing results against the final application build across the last complete run and isolated retry. No clean single full-suite pass is claimed. Unresolved failures: 0.** Existing 36 workflows remain included; six new workflows cover UI-03. [Complete final-application run](evidence/ui03/playwright.txt), [isolated retry](evidence/ui03/playwright-retry.txt).

The final complete run's failing resource assertion observed a late baseline draw before historical-marker buffers were initialized (118 buffers observed versus expected growth above 118). The test now waits for both new draw activity and additional buffers, and waits for a frame after moving selection before asserting resource reuse. Assertions were strengthened with bounded conditions; no application logic, timing, geometry or production asset changed for that retry. The retry passed in 4.0 seconds.

Commands:

```sh
npm --prefix frontend test -- src/evidenceSelection.test.tsx
npm --prefix frontend test
.venv/bin/python -m pytest backend/tests -q
VITE_API_BASE=/api VITE_API_TIMEOUT_MS=90000 npm --prefix frontend run build
# Temporary frontend copy, disposable API/proxy configuration:
CHROMIUM_PATH=/usr/bin/chromium npx playwright test e2e/ui03.spec.ts --workers=1
CHROMIUM_PATH=/usr/bin/chromium npx playwright test --workers=1 --timeout=120000
```

Logs: [contracts](evidence/ui03/contracts.txt), [frontend](evidence/ui03/frontend.txt), [backend](evidence/ui03/backend.txt), [build](evidence/ui03/production-build.txt), [focused browser](evidence/ui03/focused-playwright.txt), [complete browser](evidence/ui03/playwright.txt), [assets and protected boundaries](evidence/ui03/asset-verification.txt).

Development verification initially found two outdated test expectations after adding summary references/clarifying sensor terminology (144 passed, 2 failed), and a TypeScript error from an unsupported Testing Library option in a new test. Those expectations and the helper were corrected; no mathematical assertions were removed. [Development check summary](evidence/ui03/development-checks.txt). Final counts above refer to the finished implementation. The first complete browser run recorded 41 passes and one UI-01 1366×768 timeout waiting 5 seconds for the lazy canvas while “Loading 3D workcell” remained visible. The remaining viewport cases passed. After the selected-reading navigation refinement, the final suite was rerun from the start against a fresh final build; its actual result is recorded above. [First complete run](evidence/ui03/first-complete-playwright.txt). No failed result is counted as passing.

## Scenario, viewport and screenshot evidence

The new UI-03 browser matrix exercises Valid Cycle, Dropped Object, Positioning Error, Vision Failure, Unexpected Robot Stop and seed-42 Random Failure at 1366×768, 1280×720 and 390×844. Seed 42 resolves to vision through the unchanged selector. Each result uses the real backend; selected E6 coordinates are checked against its returned timeline, candidate summaries against backend order, and API/time/TCP/camera isolation plus no horizontal overflow are asserted. Native reference navigation and keyboard button selection are both exercised.

Matrices: [1366](evidence/ui03/1366-matrix.json), [1280](evidence/ui03/1280-matrix.json), [390](evidence/ui03/390-matrix.json).

| Viewport | Historical reading alongside live scene | Recorded evidence inspector |
| --- | --- | --- |
| 1366×768 | [workcell](evidence/ui03/1366-historical.png) | [inspector](evidence/ui03/1366-inspector.png) |
| 1280×720 | [workcell](evidence/ui03/1280-historical.png) | [inspector](evidence/ui03/1280-inspector.png) |
| 390×844 | [workcell](evidence/ui03/390-historical.png) | [inspector](evidence/ui03/390-inspector.png) |

[Candidate comparison](evidence/ui03/candidate-comparison.png). Nine PNGs capture the workflow without video/large models. The selected-reading navigation and full-table context are also shown at [1366×768](evidence/ui03/1366-timeline.png) and [390×844](evidence/ui03/390-timeline.png), using a paused synthetic Guided Demo. Desktop first-viewport checks remain in UI-01 tests. Mobile remains a scrollable single column.

An additional browser test sends deliberately inconsistent synthetic TCP evidence through the real backend and verifies INCONSISTENT FK/text inspection with no spatial position. A separate test disables WebGL and verifies the usable evidence inspector without a canvas. The paused-guide test checks actual marker draws, renderer recovery with the selection retained, no time/TCP/guide/narration/API side effects, and buffer cleanup.

## Performance and resources

[Native WebGL counters](evidence/ui03/resources.json): paused dropped-object scene **30 draw calls / 1,824 triangles / 118 live buffers**; selected marker **32 calls / 2,112 triangles / 126 live buffers**. The two procedural meshes add eight buffers. Changing selected readings reuses initialized geometry buffers. Clearing selection returns to the baseline count; navigating away leaves **0 tracked live buffers**, with **no uncaught browser errors**. Forced context loss/replacement preserves the selected reading and draws with the expected replacement resources. Lost contexts release buffers implicitly, so explicit deletion totals do not equal total creations. These counters do not measure all GPU memory or certify driver behavior.

Final bundle: main JS **233.55 kB / 73.95 kB gzip**, lazy Workcell **854.05 kB / 230.19 kB gzip**, CSS **29.01 kB / 7.16 kB gzip**. Existing large-chunk warning remains. No downloaded models, dependency changes, shadows, post-processing or continuous rendering were introduced.

Final production assets are checked against pre-suite hashes and served bytes, with no concurrent rebuild during the final suite. Workcell remains lazy-loaded; final build sizes are recorded in the build log. No Windows GPU/FPS, total GPU-memory or audible-speech performance claim is made. Browser narration uses the existing mock; human comprehension is not established by automated tests.

## Exclusions and limitations

- No operator-verification outcome controls, ticket-note handoff, structured verification persistence, API/schema migration, new backend endpoint or diagnosis-rule change.
- No historical robot replay, clock scrubbing, saved-ticket 3D reconstruction, free camera, new axes/trajectories or changes to UI-02 fault markers/historical loss semantics.
- No GD-01 stage/timing/narration/automatic-save changes. Existing automatic guided ticket creation remains real and unchanged.
- No new dependencies, paid services, hosting, deployment or merge. Existing SQLite records and Windows application were untouched; write-producing tests use the fresh temporary database or existing disposable fixtures.
- Evidence selection is transient, not a persisted investigation or shared/private session. Returning from ticket context starts with no selected historical reading.
- A historical marker may be outside a preset's frustum for arbitrary externally supplied poses. The inspector still exposes recorded coordinates; the camera never moves automatically. Current built-in scenario coordinates are exercised by the matrix.
- The complete table and raw JSON remain available; very large externally supplied timelines are not virtualized. Mobile inspection requires vertical scrolling. The complete table scrolls horizontally within its own container; the inspector provides a stacked reading alternative.
- The existing Vite large Three/R3F chunk warning, Starlette/AnyIO deprecation and jsdom Three multiple-import warning remain documented in logs.
- The concise flow supports a roughly two-minute demonstration; no claim is made that a human recruiter comprehension study has passed.

## Suggested short walkthrough

Using a disposable API: run Dropped Object, open its E6 observation link, use “Inspect selected reading” to compare HOLD / absent-at-gripper / vacuum evidence, then “View historical marker in workcell.” Open full diagnostics to compare supporting versus contradicting evidence and read the backend's next check. No outcome is recorded or cause confirmed by these interactions. The five-step orientation is a demonstration target, not a measured human-comprehension result.

## Independent Code Review instructions

1. Compare main baseline `24dc786…` with the PR head; verify the protected-boundary manifest and no excluded implementation files changed.
2. Review run/result identity, context clearing, and stale callback rejection in `evidenceSelection.tsx`; check reset with identical deterministic diagnosis IDs.
3. Trace support/contradiction IDs from returned candidates through references, inspector and recorded TCP eligibility. Verify unknown/absent distinctions and no position reconstruction.
4. Confirm App clock/request generation and existing guide/narration/maintenance behavior remain unchanged; distinguish native hash-navigation behavior from pure selection buttons.
5. Review comparison ordering, full evidence preservation, keyboard focus, viewport captures and resource counters; reproduce tests only against disposable SQLite.
6. Rerun frontend/backend/build checks and the browser suite with matching temporary API/proxy/base URLs. Inspect raw logs for actual outcomes and any retries. Windows Chrome visual/audio verification remains separate.
7. Return findings to Planning. Do not merge or deploy without separate authorization.
