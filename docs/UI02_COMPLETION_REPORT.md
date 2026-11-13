# UI-02 — Workcell visualization completion report

Implementation for independent Code Review. No merge or deployment performed.

## PR #14 targeted review corrections — November 13, 2026 (UTC)

Before editing, verified a clean workspace on `feature/ui02-workcell-visualization` and fetched PR #14 metadata: open, base `main`, head exactly `0670f9d120c49d0d887ab268e7d8d3bc2b1745fc`. Corrections remain on that existing branch; no unrelated work was present or removed.

### Historical loss headline

`workcellState.ts` derives the loss timestamp and command from the first recorded present-to-absent transition in the existing `cyclePayload("drop").samples`. The selection is computed once; it does not introduce a second simulation clock, RNG draw, request or scenario model. Workcell displays that presentation headline. Secondary copy also derives the event timestamp/command and uses past tense.

| Simulation time | Existing current grip command (unchanged) | Before headline | After headline |
| --- | --- | --- | --- |
| 6 s | HOLD | OBJECT PRESENCE LOST · GRIP STILL COMMANDED | PRESENCE LOST AT 6.0s · HOLD COMMANDED AT LOSS |
| 10 s | RELEASE | OBJECT PRESENCE LOST · GRIP STILL COMMANDED | PRESENCE LOST AT 6.0s · HOLD COMMANDED AT LOSS |
| 12 s | RELEASE | OBJECT PRESENCE LOST · GRIP STILL COMMANDED | PRESENCE LOST AT 6.0s · HOLD COMMANDED AT LOSS |

Corrected 12 s captures: [1366×768](evidence/ui02/corrections/1366-drop.png), [1280×720](evidence/ui02/corrections/1280-drop.png), [390×844](evidence/ui02/corrections/390-drop.png).

Three new DOM regression cases render the real Workcell at these timestamps and assert the exact `<strong>` headline, not secondary text. They isolate the DOM through the existing no-WebGL path and also check that the underlying current grip command still changes at 10 s. All three failed with the reviewed implementation and pass after the correction. The existing M3 browser expectation now uses the corrected headline. `OperationsWorkspace.tsx` and its sensor strip are unchanged by this correction.

### WebGL recovery proof

The test-only WebGL probe now reports a renderer/context ID, live/created buffers, draw calls and triangles for the latest context, separately from aggregate counters. Recovery asserts:

- The old canvas is detached; exactly one replacement canvas exists and is visible.
- The replacement renderer has a new context ID, live and created buffer counts matching the initialized prior renderer, and its own positive draw/triangle counts. An old renderer's recorded frame cannot satisfy this wait.
- There are no uncaught page/rendering errors through recovery and subsequent unmount.
- Paused simulation time, narration call count and zero API POSTs remain unchanged; unmount returns tracked live buffers to zero.

Initial readiness, each camera preset change and replacement-renderer readiness use bounded condition polling (8 s), replacing the recovery test's fixed startup/camera/reload sleeps. The fallback disappearing remains an assertion, but is no longer the evidence that rendering recovered. No production instrumentation, endpoint or dependency was added.

### Final correction verification

- Affected frontend: **24 passed / 2 files** (including all three exact-headline cases).
- Full frontend: **134 passed / 17 files**.
- Backend: **98 passed**.
- Production TypeScript/Vite build: **PASS**; no dependency changes.
- Focused strengthened recovery: **1 passed**.
- Complete Playwright invocation: **35 passed, 1 timed out** during the legacy cycle test's final `setViewportSize` after its diagnosis/evidence assertions. The isolated `--last-failed` rerun passed **1/1** in 28.7 s with the original 60 s timeout and unchanged assertions. **All 36 unique workflows have passing results; unresolved failures: 0.** [Rerun log](evidence/ui02/corrections/playwright-rerun.txt).
- Final recovery counters: context **2 → 3**, replacement renderer **110 live / 110 created buffers**, **28 draw calls / 1,300 triangles**, **no uncaught errors**; unmount **0 tracked live buffers**. Paused time, narration count and API POST isolation assertions pass.
- All protected source/configuration diffs are empty relative to the reviewed head; served production assets match the hashes recorded before the browser suite.

Commands: affected `npm --prefix frontend test -- src/Workcell.test.tsx src/workcellVisual.test.tsx`; full `npm --prefix frontend test`; `.venv/bin/python -m pytest backend/tests -q`; `VITE_API_BASE=/api VITE_API_TIMEOUT_MS=90000 npm --prefix frontend run build`; focused recovery and full browser suite with `CHROMIUM_PATH=/usr/bin/chromium npx playwright test [e2e/ui02.spec.ts --grep 'camera and context recovery'] --workers=1` in the temporary frontend copy. The isolated browser retry uses `CHROMIUM_PATH=/usr/bin/chromium npx playwright test --last-failed --workers=1`.

Logs: [affected](evidence/ui02/corrections/affected.txt), [frontend](evidence/ui02/corrections/frontend.txt), [backend](evidence/ui02/corrections/backend.txt), [build](evidence/ui02/corrections/production-build.txt), [focused recovery](evidence/ui02/corrections/recovery.txt), [full Playwright](evidence/ui02/corrections/playwright.txt), [recovery counters](evidence/ui02/corrections/resources.json), [protected-boundary/served-asset checks](evidence/ui02/corrections/boundary-verification.txt).

Earlier verification attempts: the three new headline tests intentionally failed before the fix ([red evidence](evidence/ui02/corrections/headline-before.txt)). During concurrent verification, the existing frustum test and an existing Maintenance test each exceeded their default 5 s timeout ([affected attempt](evidence/ui02/corrections/initial-affected.txt), [full attempt](evidence/ui02/corrections/initial-frontend.txt)). Sequential reruns passed with the same assertions and default timeouts; no timing limit or protected behavior was changed to obtain a pass.

Exact correction source/test files: `frontend/src/Workcell.tsx`, `frontend/src/workcellState.ts`, new `frontend/src/Workcell.test.tsx`, `frontend/e2e/ui02.spec.ts`, `frontend/e2e/workcellProbe.ts`, and the expected-headline line in `frontend/e2e/m3.spec.ts`. Documentation/evidence: this report and `docs/evidence/ui02/corrections/`; [complete correction file manifest](evidence/ui02/corrections/changed-files.txt).

Execution remains managed Linux Chromium/software WebGL, using existing dependencies, a fresh disposable `/tmp/maintainai-ui02-review-w1qjmmls/synthetic.sqlite3` on loopback 8183 and frontend preview 5383. No Windows application or existing SQLite records were accessed. Old evidence below is retained at its reviewed-head versions rather than replacing historical screenshots. The current correction results supersede the earlier 131-test frontend count. Browser voice testing is mocked; Windows GPU/FPS, audible speech and other browser/driver behavior remain unverified. Vite's existing large Three/R3F chunk warning and the existing Starlette/AnyIO deprecation warning remain. The new jsdom test harness emits a Three.js multiple-import warning; production recovery separately checks uncaught rendering errors. No merge, deployment, paid usage, backend/database or simulation-contract change.

---

## Baseline and execution

Started with a clean existing checkout, fetched and verified main at `53f6b83bfeb5bacbb93771e6a85b73383ab25845` (merged GD-01 PR #13, with UI-01). Created `feature/ui02-workcell-visualization` from that baseline. No unrelated changes or untracked files were removed.

Executed in the managed Linux cloud workspace using existing installed dependencies. Browser checks use Chromium with software WebGL, a loopback-only disposable SQLite API on port 8182 and production preview on port 5382. The database is `/tmp/maintainai-ui02-08h1joh9/synthetic.sqlite3`; no existing local records or Windows application/database were accessed. A temporary frontend test copy adjusts legacy test URLs/proxy only; generated legacy UI-01/GD-01 evidence stays outside this checkout.

No backend, schema, API, hosting, dependency manifest, kinematics, trajectory, deterministic scenario, guide, narration or maintenance implementation changes. No paid service, resource provisioning, billing, deployment or merge.

## UI-02A–E implementation

| Phase | Implementation |
| --- | --- |
| A — Contract protection | Preserved original mathematical assertions. Added inspection of the actual declarative joint hierarchy, world rotations and TCP against existing fixture samples; actual workpiece positions through pick, transfer, release, loss/landing, offset and stop; marker semantics, seeded resolution, camera frustum and mesh budget. Existing lifecycle, guide, concurrency and export regressions remain included. |
| B — Mechanical visualization | Procedural base/shoulder/elbow housings, arm inlays, refined tool and thin TCP proxy ring; distinct workpiece finish, labelled source/destination fixtures, restrained materials, grid and non-shadow lighting. Existing link lengths, pivots, TCP/object-center representation and paths remain intact. |
| C — Fault visualization | Persistent, observation-labelled indicators for placement/release, presence-loss location, intended/observed offset, vision uncertainty with the part retained, and protective stop. Workcell receives the already resolved scenario; no random draw or diagnostic calculation is added. Sensor label is “Object at gripper.” |
| D — Camera presets | Overview, Inspection and Reset View are local presentation state. Fixed fitted viewpoints include the full existing sweep and all object paths at each aspect. No orbit/pan/free camera, simulation callback, backend request or narration callback. |
| E — Verification | Unit, backend, production-build and real-backend browser workflows, three viewport sizes, screenshots, fallback/context recovery and WebGL buffer cleanup checks. Results below. |

Scene annotations describe synthetic observations, not proven mechanical causes. Existing backend hypotheses and recommended checks remain in the investigation panel. The vision marker means unknown verification, not physical absence. The loss marker identifies the recorded loss point and its floor projection; it is not historical evidence navigation or a new collision model.

## Files changed

- `frontend/src/RobotVisual.tsx` — pure mechanical meshes and unchanged 3R transform hierarchy, extracted from Workcell.
- `frontend/src/WorkcellScene.tsx` — environment, actual workpiece and observation markers.
- `frontend/src/workcellState.ts` — pure presentation mapping from existing scenario samples.
- `frontend/src/workcellView.ts` — fixed camera presets, full-path framing and shared fixture locations.
- `frontend/src/Workcell.tsx` — scene composition, camera UI, projected labels, context fallback and listeners.
- `frontend/src/OperationsWorkspace.tsx` — clarified sensor label; consolidated old scene banners into Workcell.
- `frontend/src/style.css` — responsive camera controls, scene labels and observation panel.
- `frontend/src/workcellVisual.test.tsx` — 21 focused visual/contract tests.
- `frontend/src/GuidedFlow.test.tsx` — await lazy Maintenance handoff before the existing no-additional-requests assertion; protected behavior unchanged.
- `frontend/e2e/m3.spec.ts` — retain genuine mesh picking using the new camera projection.
- `frontend/e2e/ui02.spec.ts` — five browser workflows including scenario/viewport matrices, keyboard camera controls, domain isolation, WebGL recovery and fallback.
- `frontend/e2e/workcellProbe.ts` — browser-test-only native WebGL counters; no production telemetry endpoint.
- `docs/DEVELOPMENT_STATUS.md`, this report, and `docs/evidence/ui02/` — status and verification artifacts.

Complete path-by-path manifest: [changed files](evidence/ui02/changed-files.txt), including every screenshot and evidence artifact.

## Original implementation verification (reviewed head `0670f9d`)

Final results: **98 backend tests passed**, **131 frontend tests passed across 16 files**, **production TypeScript/Vite build passed**, and **36 Playwright workflows passed**. Final failures: **0**. The original 110 frontend tests and 31 browser workflows remain included; UI-02 adds 21 unit tests and five browser workflows.

| Command | Result |
| --- | --- |
| `.venv/bin/python -m pytest backend/tests -q` | 98 passed; one existing Starlette/AnyIO deprecation warning |
| `npm --prefix frontend test` | 131 passed / 16 files |
| `VITE_API_BASE=/api VITE_API_TIMEOUT_MS=90000 npm --prefix frontend run build` | PASS; 4.09 s Vite build; existing large-chunk warning |
| `CHROMIUM_PATH=/usr/bin/chromium npx playwright test --workers=1` in temporary frontend copy | 36 passed / 0 failed |

Logs: [backend](evidence/ui02/backend.txt), [frontend](evidence/ui02/frontend.txt), [production build](evidence/ui02/production-build.txt), [Playwright](evidence/ui02/playwright.txt), [asset/boundary verification](evidence/ui02/asset-verification.txt). The final browser suite uses the finished production build with no concurrent rebuild or application-source changes.

### Scenario matrix

Each row was exercised through the real API at **1366×768**, **1280×720** and **390×844**, at default browser zoom. All three matrices pass. [1366 results](evidence/ui02/1366-scenarios.json), [1280 results](evidence/ui02/1280-scenarios.json), [390 results](evidence/ui02/390-scenarios.json).

| Selection | Verified behavior | Result |
| --- | --- | --- |
| Valid cycle | Part follows TCP while held, releases at existing target, target ring and verified/released copy at 12 s; real normal diagnosis | PASS |
| Dropped object | Loss marker at existing 6 s TCP and its floor projection; existing dropped position retained; hold-at-loss copy; real dropped-object diagnosis | PASS |
| Positioning error | Intended and observed placement rings retain measured +0.45 m X discrepancy; real positioning-error diagnosis | PASS |
| Vision failure | Part remains at destination; marker/copy describe verification timeout/unknown; real vision-failure diagnosis | PASS |
| Unexpected robot stop | Clock and TCP freeze at 6 s; held part and persistent protective-stop indication; real unexpected-stop diagnosis | PASS |
| Seeded random failure | Seed 42 resolves to vision; response diagnosis ID equals the fixed vision scenario; no new draw | PASS |

Original golden-pose, independent mathematical, continuity, joint-limit/speed and seeded-fixture assertions pass. New tests traverse the actual rendered React hierarchy into Three world transforms, rather than asserting a duplicate FK implementation. Actual part transforms are checked against published fixtures, including source, TCP attachment, release, drop landing, positioning offset and stop.

Existing browser tests pass for pause/resume, skip/reset/manual takeover, protective stop, independent sessions, genuine mesh picking and keyboard alternatives, guide automatic/idempotent ticket creation, pending-response safety, B01 repair/resolution draft preservation, and complete JSON/Markdown exports. GD-01 speech mocks verify narration lifecycle and isolation; they do not establish audible speech on Windows.

### Screenshots and layout

**33 PNGs**: per viewport, idle, source-pick held state, mid-transfer, five deterministic outcomes, seeded-random outcome, Inspection and a full-page dropped-object view. Representative captures:

| Viewport | Initial workspace | Fault/workcell | Inspection |
| --- | --- | --- | --- |
| 1366×768 | [idle](evidence/ui02/1366-idle.png) | [drop](evidence/ui02/1366-drop.png) / [offset](evidence/ui02/1366-position.png) | [Inspection](evidence/ui02/1366-inspection.png) |
| 1280×720 | [idle](evidence/ui02/1280-idle.png) | [vision](evidence/ui02/1280-vision.png) / [stop](evidence/ui02/1280-stop.png) | [Inspection](evidence/ui02/1280-inspection.png) |
| 390×844 | [idle](evidence/ui02/390-idle.png) | [full drop page](evidence/ui02/390-full.png) / [placement](evidence/ui02/390-position.png) | [Inspection](evidence/ui02/390-inspection.png) |

Additional paused mid-transfer captures: [1366](evidence/ui02/1366-transfer.png), [1280](evidence/ui02/1280-transfer.png), [390](evidence/ui02/390-transfer.png). These use the unchanged clock/scenario and assert the existing gripper-presence signal.

All viewports pass no-horizontal-page-overflow checks through every scenario. UI-01's desktop geometry checks retain canvas, manual controls, scenario, seed and investigation summary inside the initial viewport at both desktop sizes. Mobile is a scrollable single column. Camera buttons have visible keyboard focus, pressed-state semantics and 44px mobile targets. Screenshots were visually inspected for scene/fixture visibility and annotation overlap; they are evidence captures, not pixel-perfect cross-browser comparisons.

### Performance, fallback and cleanup

[Native WebGL test counters](evidence/ui02/resources.json) sample **28 draw calls and 1,300 triangles** in the default paused scene. **110 live buffers / 110 created** remain unchanged after five Inspection/Reset View cycles. Forced context loss and explicit canvas-only recovery preserve paused time, narration call count and zero API POSTs. Navigating away leaves **0 tracked live buffers**. One context is the released availability probe; recovery creates a new renderer context. A lost context releases its buffers implicitly, so explicit deletion count is not the same as total creations. These are test-only buffer/draw counters, not total GPU memory, FPS or proof of every browser/driver's resource accounting.

Unavailable WebGL retains controls and computes a real dropped-object backend result without a canvas. Context-loss and restored listeners and the resize observer clean up on unmount; unchanged TCP path disposal remains covered by existing engineering behavior. Camera interactions do not advance the clock, invoke diagnosis/ticket callbacks, or alter narration.

Default demand rendering, DPR cap 1.5, no shadows/post-processing and procedural geometry are retained. Static environment is memoized; full-path camera fitting points are generated once and fitting runs on preset/size changes, not every animation step. The final lazy Workcell chunk is **853.02 kB / 229.81 kB gzip**; main JS **225.44 kB / 71.86 kB gzip**. Vite's large-chunk warning remains. No Windows GPU/FPS or real voice performance claim is made.

## Known limitations and review risks

- Cloud software WebGL measurements do not establish Windows GPU performance, FPS, real speech/audio or browser-specific voice availability. Owner Windows Chrome visual/audio validation remains advisable.
- TCP is still the object center during attachment. The tool is schematic; there is no new physical grasp/contact, collision, extra axis, trajectory or home return.
- Mobile uses a single column; controls/investigation require vertical scrolling. The observation panel sits below the mobile scene to avoid covering fixtures. Desktop first-viewport controls and fault summary are retained.
- Both camera presets fit the entire sweep rather than zooming into a selected fault. Labels are screen-space presentation annotations; no free camera or historical evidence-linked markers.
- An unsupported-WebGL probe briefly creates/releases a temporary context once per Workcell mount (React development Strict Mode can probe twice). Rendering failures retain simulation/evidence controls; explicit context recovery remounts only the canvas.
- Demand rendering and DPR `[1, 1.5]` are preserved; shadows and post-processing remain disabled. No large model download or new dependency. The existing Three/R3F lazy chunk still exceeds Vite's 500 kB warning threshold.
- Shared anonymous records, hosting eligibility, quotas, backup and deployment gates are unchanged. This work grants no hosting or merge approval.

Stop for independent Code Review and Planning authorization.
