# GD-01 — Guided Demo voice narration

Implementation for independent Code Review. No merge or deployment performed.

## Baseline and boundaries

Verified clean workspace, fetched `origin/main`, and synchronized local main to `e1ee492d585951077929e7e7305364e8b8cd8206` (merged UI-01 PR #12). Created `feature/gd01-guided-voice-narration` from that exact baseline. No unrelated/user-supplied untracked artifacts were deleted or overwritten; authorized builds refreshed generated frontend build output.

Execution: managed Linux cloud workspace, November 12, 2026 (America/New_York). No Windows application/database access, real-record migration, dependency installation, paid service, external TTS API, hosting resource, billing action or deployment. Tests use existing installed tooling.

The API uses disposable `/tmp/maintainai-gd01-s14s61xz/synthetic.sqlite3` on loopback 8171; the production frontend preview uses loopback 5371. A temporary frontend test copy changes only the proxy/base URL and older hard-coded browser URLs from 8000/5173 to 8171/5371. Legacy browser screenshots/timing artifacts remain outside the repository; UI-01's committed evidence is preserved.

## Architecture

- `guideNarration.ts`: pure cue mapping from actual guide stage, simulation time, backend result and errors; strict local-English voice selection. Prefers Microsoft David with `en-US`, then another local English voice. Remote and non-English voices are excluded. No network requests, voice downloads or synthesis service dependencies.
- `useGuideNarration.ts`: App-level speech controller with its own run/generation guards, current-cue deduplication, voice discovery, mute preference, explicit retry and cleanup. It imports no API helper and receives no simulation/ticket callbacks.
- `App.tsx`: wraps existing Start/Pause/Resume/Skip/Reset/navigation callbacks with narration actions. Automatic ticket handoff is left intact and does not stop completion speech.
- `GuidedBanner.tsx` and `style.css`: accessible Mute/Unmute and Replay controls, narration status and visible cue text. Original guide explanations, hypothesis caveat, evidence links and controls remain available. Existing UI-01 layout is preserved; touch targets are at least 44px at 390px width.

The guide reducer and orchestration files (`guided.ts`, `useGuidedDemo.ts`) are unchanged. App still owns the original clock, scenario/seed, diagnosis/request guards and maintenance selection. Speech completion changes speech status only; it cannot advance the guide or initiate API calls.

## Cue scripts

| Actual state | Narration |
| --- | --- |
| Simulation introduction | This simulated robot picks, carries, and places a part. |
| Simulation reaches 6 seconds | Simulated presence is lost while hold remains commanded. |
| Simulation finished; waiting for diagnosis | MaintainAI is comparing the recorded evidence. |
| Evidence review | Review the backend observations and their evidence references. |
| Normal backend result | The backend reports a normal cycle. |
| Inconclusive backend result | Evidence is inconclusive. Review the recorded signals. |
| Checks with ranked hypotheses | Possible causes need operator verification before repair. |
| Checks without ranked hypotheses | Review the evidence before identifying a cause. |
| Saving | Saving this demonstration's evidence as a maintenance ticket. |
| Complete | The ticket preserves evidence for technician review. |
| Analysis error | Analysis is unavailable. Retry when the service is ready. |
| Ticket-save error | Ticket saving failed. Use the save retry control. |

Scripts describe simulated observations and backend status without declaring a hypothesis a proven cause. Full backend hypotheses and corresponding checks remain in the existing text. No diagnostic calculations, ranking, confidence values or extra telemetry were added.

## Lifecycle and safety

- Narration starts enabled but does not speak before explicit interaction. Start speaks the introduction from the click handler when an eligible voice is already available.
- Stage changes replace outdated speech. The four-second evidence/check timers remain unchanged; cues can be interrupted. No speech queue builds up behind the simulation.
- Pause cancels speech; Resume restarts the current cue. Replay can read while the guide remains paused and does not resume guide timers.
- Mute cancels immediately; its preference persists across guide runs for the current page session. Unmute speaks the current cue unless the guide is paused. Reloading the page restores the enabled default.
- Skip invalidates old speech and reconciles against the guide's resulting state. Reset starts a fresh narration run alongside the existing fresh guide run.
- Manual takeover, workspace navigation, evidence/hash navigation and history navigation stop narration. Automatic Maintenance handoff permits the completion cue to finish.
- Hidden tabs/page exit stop speech and require explicit interaction before narration resumes. They do not change the existing guide/ticket behavior.
- Unmount removes listeners, clears watchdogs, detaches utterance handlers and cancels owned speech. Generation guards reject late callbacks; voice-list updates cannot replay a consumed cue or bypass a suspension.
- Unsupported APIs, missing/remote-only voices and discovery failures retain text-only operation. Delayed discovery uses only the current cue. Browser denial/synthesis failure offers explicit Replay retry without a retry loop.
- Narration-only watchdogs fall back after no speech start for five seconds or no completion for thirty seconds after start. They never control simulation or API timing.

### Maintenance creation remains automatic

The unchanged `saving` stage POSTs a ticket when unpaused/error-free, with a diagnosis ID and no save already in progress. No additional confirmation is required. Each guide Start/Reset gets a fresh UUID; retries reuse that run's request ID. Existing backend deterministic identity/content checks prevent duplicate records for the same request. Epoch/save/navigation guards are unchanged.

Mute, Unmute and Replay never call Start/Reset, diagnosis, stage transitions or ticket APIs. Integration checks exercise these controls both before analysis and after Maintenance handoff, asserting no additional API calls. Existing real-backend idempotency, pending-response/takeover and B01 workflows remain in the full browser suite.

A save already submitted may still commit after Pause/Reset/takeover; narration does not change or undo this existing behavior.

## Verification

Final results: **98 backend tests passed**, **110 frontend tests passed across 15 files**, **production TypeScript/Vite build passed**, and **31 Playwright workflows passed**. Final failures: **0**. The frontend adds 32 tests to the 78-test baseline; Playwright adds seven workflows to the 24-workflow baseline. All existing suites remain included.

Logs: [backend](evidence/gd01/backend.txt), [frontend](evidence/gd01/frontend.txt), [production build](evidence/gd01/production-build.txt), [Playwright](evidence/gd01/playwright.txt). The final browser run uses the finished production build without concurrent source/build changes; [asset checks](evidence/gd01/asset-verification.txt) confirm served bundle hashes remain unchanged.

| Acceptance area | Result |
| --- | --- |
| Default enabled; no speech before interaction | PASS |
| David preference; local English only; text fallback and discovery | PASS |
| Current-stage cues and independent controls | PASS |
| Strict Mode, stale events, errors, hidden/page/navigation cleanup | PASS |
| Automatic handoff and unchanged API/ticket behavior | PASS |
| UI-01 geometry/overflow and responsive narration controls | PASS |
| Complete backend/frontend/build/browser regressions | PASS |
| Real audible playback / Windows Chrome output | UNVERIFIED; not claimed |

Executed commands:

```sh
.venv/bin/python -m pytest backend/tests -q
npm --prefix frontend test
VITE_API_BASE=/api VITE_API_TIMEOUT_MS=90000 npm --prefix frontend run build
# Temporary test copy against loopback 5371/8171:
CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test
```

New coverage includes pure scripts/voice selection, Strict Mode and lifecycle/error cases, banner control isolation and text fallback, plus seven GD-01 browser workflows. Existing Guided Flow component coverage is strengthened to verify narration does not change API behavior. The existing M3/UI-01 browser workflows use the same deterministic speech mock, including the separate guided browser context; their original application assertions remain intact.

Browser speech is mocked; simulation, backend analysis, ticket persistence and maintenance/export regression workflows use real application code and disposable state. This does **not** verify audible playback or voice quality. The owner reports Windows Chrome exposes local Microsoft David/Mark/Zira; that is owner-provided information, not audio verification performed here.

## UI evidence

Nine screenshots were captured and visually inspected in [docs/evidence/gd01](evidence/gd01). Each of 1366×768, 1280×720 and 390×844 has viewport, full-page and focused-control screenshots plus button geometry. Controls and overflow are asserted using actual bounding rectangles/document scroll width. Evidence shows mocked voice metadata and must not be interpreted as proof of real audio playback.

## Protected functionality and limitations

No changes to robot/kinematic/scenario sources or fixtures, diagnostic algorithms/evidence ranking, API contracts, guide reducer/timers/save orchestration, Maintenance/B01, optimistic concurrency, exporters, schemas, quotas, database adapters, hosting configuration or dependency manifests. No Windows-running application or existing SQLite records were modified. Only the isolated synthetic test database received test writes.

Speech quality, pronunciation, device output, browser autoplay policies and actual Windows Chrome playback remain unverified. Voice availability can change by browser/device; localService is browser-provided metadata. The implementation refuses remote voices and provides text fallback rather than promising audio everywhere. Short stage timing may interrupt speech; visible text and paused Replay remain the complete-reading path. Narration cancellation affects the window's speech-synthesis queue; this controller is the application's only speech owner.

Existing Workcell bundle-size and Starlette/AnyIO deprecation warnings remain. Cloud software WebGL and mocked speech do not establish Windows GPU/audio behavior or hosted acceptance. No implementation or verification blocker will be closed using a claim of real audio playback.

Changed-file inventory: `frontend/src/App.tsx`, `GuidedBanner.tsx`, `style.css`; new `guideNarration.ts` and `useGuideNarration.ts`; new `guideNarration.test.ts`, `useGuideNarration.test.tsx`, `GuidedBanner.test.tsx` and `testSpeech.ts`; strengthened `GuidedFlow.test.tsx`; new `frontend/e2e/gd01.spec.ts` and `speechMock.ts`; mock setup only in existing `m3.spec.ts` and `ui01.spec.ts`; this report and `docs/evidence/gd01/`.

Stop after opening the PR for independent Code Review; do not merge or deploy.
