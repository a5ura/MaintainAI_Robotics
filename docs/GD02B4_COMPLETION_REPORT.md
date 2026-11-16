# GD-02B-4 — Confirmed maintenance handoff

November 16, 2026 (America/New_York). GD-02-SPEC-v1.1. Implementation, disposable testing and review PR only; no merge, deployment or GD-02B-5 work.

## Baseline and changed files

Fetched `origin/main`, verified required baseline `68a9173e9980f0785949c97fded067c0f3315fdb`, and confirmed a clean working tree before creating `feature/gd02b4-confirmed-handoff` directly from that baseline. Existing ignored/local files and user SQLite records were preserved. The PR body and completion response record the exact final base/head SHAs after committing this report; the head cannot be embedded in its own commit without changing that SHA.

Exact changed-file manifest:

- `frontend/src/useConfirmedHandoff.ts` — preview validation, immutable payload/UUID ownership, App-lifetime attempt ledger, request mutex, response classification and explicit reconciliation.
- `frontend/src/ConfirmedHandoff.tsx` — actual-data preview, native modal confirmation, retained status and explicit saved-ticket navigation.
- `frontend/src/ConfirmedHandoff.test.tsx` — confirmation, identity, race, retention, error and Stage 6 narration regressions.
- `frontend/src/App.tsx` — App-lifetime ownership and integration; explicit ticket-view action only.
- `frontend/src/GuidedBanner.tsx` — Stage 6 handoff slot and accurate terminal-stage copy.
- `frontend/src/guideNarration.ts` — Stage 6 preview/submission/outcome scripts only.
- `frontend/src/api.ts` — typed HTTP status error while retaining existing error messages and request behavior.
- `frontend/src/style.css` — scoped preview/dialog/status styles and responsive touch targets.
- `frontend/src/GuidedFlow.test.tsx` — replace deferred Stage 6 action assertion; retain no-write safeguards.
- `frontend/e2e/gd02b1.spec.ts` — same required Stage 6 assertion migration, preserving Automatic/no-write tests.
- `frontend/e2e/m3.spec.ts` — current Stage 6 copy and scope the existing separate manual-create button selector.
- `frontend/e2e/gd02b4.spec.ts` — real confirmation/persistence/history, viewport accessibility and committed-but-lost response reconciliation.
- `docs/GD02B4_COMPLETION_REPORT.md` — this report.

## Verified existing API and persistence contract

`TicketCreate` in `backend/ticket_models.py` already accepts an optional UUID `request_id`; `equipment_id` and `diagnosis_id` have 80-character limits, `title` 120, `description` 4,000. Existing models strip surrounding whitespace. This frontend validates the proposed strings against those limits without silently truncating evidence or changing API behavior.

`backend/domain.py::ticket_identity` derives the ticket primary key deterministically from the UUID using UUID5. `check_reuse` requires matching equipment, diagnosis, title and description; incompatible identity reuse is rejected with HTTP 409. SQLite creation in `backend/repository.py` checks identity and creates the ticket plus one `created` history record in one transaction. The async repository uses conflict-safe insertion and insert-trigger history. These contracts already exist and are unchanged. Backend regression coverage includes the existing adapters; the new browser exercise directly verifies real SQLite persistence.

There is **no request-ID lookup endpoint**. Reconciliation uses the supported `POST /api/tickets` with the **original UUID and byte-identical confirmed payload**, only after another explicit review/confirmation. The backend returns the matching existing ticket or creates it if the first attempt never persisted. A replay consumes existing request/quota checks and may still be rejected; there is no automatic retry or new endpoint.

Server-side duplicate prevention is reliable for identical payloads using the same supported request identity. It does **not** deduplicate separate UUIDs, separate tabs or independent manual tickets describing the same incident. Reload recovery is deferred; a new page session loses the retained identity and cannot safely infer whether a prior uncertain request persisted. The uncertain-state warning tells the operator to keep the page open. No global exactly-once guarantee is claimed.

## Preview mapping and explicit confirmation

| Display | Actual source / meaning |
| --- | --- |
| Equipment | `R-01`, the existing simulated Cell 01 workcell; no live-hardware claim |
| Run | Current resolved scenario label, existing seed and controller page-session epoch |
| Diagnosis reference | Current backend `Diagnosis.id`; required before enabling creation |
| Observed outcome/evidence | Backend failure/status, summary, observations and their returned evidence references |
| Candidate explanations | Backend hypotheses with existing supporting/contradicting references, recommended checks, order and uncertainty |
| Limitations | Backend status, ranking basis and warnings; synthetic-input and unverified-repair disclosure |
| Proposed title | `Guided demo — <actual failure>` or cycle-review fallback |
| Proposed description | Actual summary, scenario/seed/run reference and explicit no-verification/no-repair disclosure |
| Proposed status | Existing API initial `Open`; it is not an operator verification result |

The preview includes essential fields directly and detailed backend evidence/candidates in an expandable section. The ticket links the already-saved immutable diagnosis rather than copying or recalculating a diagnosis. No additional diagnosis request prepares or confirms a handoff.

`Create maintenance ticket` opens a separate native modal with essential fields, a persistent shared-record warning, Cancel and Confirm ticket creation. Only the final button generates the initial UUID and issues a ticket POST. Cancel, Escape, stage entry, Automatic progression, replay, pause/resume, exit and navigation do not create a ticket. Invalid/missing/oversized current-run data or unavailable secure UUID generation cannot submit.

## State, identity and lifecycle

Preview and confirmation make no request. On confirmation, the hook freezes the string payload and request UUID, consumes the current confirmation and records `submitting` **synchronously before fetch**. Duplicate events cannot reuse the consumed dialog or overlap an existing unresolved attempt. UUID-generation failure shows an error and sends nothing.

| State | Behavior |
| --- | --- |
| Preview | Review current actual data; no ticket write |
| Confirmation | Captured preview awaits explicit authorization; Cancel/Escape discard only this unsubmitted dialog |
| Submitting | Stable confirmed UUID/payload; block further conflicting submissions |
| Confirmed success | Validate returned ticket ID and matching confirmed fields, then show saved reference; no automatic navigation |
| Confirmed rejection | Show actual server message; explicit retry keeps original UUID/payload |
| Uncertain outcome | Ticket may exist; retain request, block new creates and offer explicit same-identity reconciliation |

Initial access/router/size/validation/quota rejections (401/403/405/413/422/429) and the existing specific pre-write 404 messages `Equipment not found` / `Diagnosis not found` are classified as rejected. Generic 400/404, 409, 5xx, network errors, rejected timeout promises, malformed success and mismatched returned payloads remain uncertain. A successful create can commit before detail retrieval fails; a generic 404 must therefore not be treated as proof of no persistence. If an **already uncertain** attempt's reconciliation receives even a pre-write rejection, the original outcome remains uncertain.

The App-lifetime map retains confirmed attempts through stage changes, Exit, Diagnostics, Operations, Maintenance and a new Guided Demo. The global notice attributes an old attempt to its original run/diagnosis. An unresolved old attempt blocks creation from another run; a completed old attempt does not masquerade as a new run's ticket. Context and object-identity guards invalidate stale confirmations and ignore superseded responses. Network completion never changes guide state, selected evidence, manual drafts or navigation. Viewing a saved ticket requires an explicit separate action.

There is no localStorage, sessionStorage or durable browser state. The unchanged API helper retains its existing `AbortSignal.timeout` (10 seconds by default, configured within 1–120 seconds). While pending, the request blocks conflicting creation; a timeout or network failure becomes uncertain, never proof that the server did not commit. This hook adds no timer or automatic retry. Closed/reloaded pages require manual record review; durable recovery belongs to a separately approved phase.

## Accessibility and unchanged integrations

Native `<dialog>` supplies modal semantics and browser focus containment. It has an accessible title/description, initially focuses Cancel, handles Escape as cancellation and explicitly restores the connected opening control on Cancel/Escape when React removes the modal. Status uses a live `role=status` region, with text distinguishing pending/success/rejection/uncertainty. Touch targets are at least 44 pixels, long references wrap, and the modal scrolls within the viewport. No new motion is introduced; reduced-motion browser coverage uses the existing preference.

Stage 6 narration alone reflects preview, pending, confirmed, rejected or uncertain status. Narration has no submission callback. Existing guide reducer, readiness, four-second Automatic dwell, speech lifecycle, other scripts, highlighting, hidden-tab behavior and evidence selection are unchanged. Existing manual maintenance forms, history/concurrency/B01 draft handling and exports are unchanged. The shared API helper only exposes HTTP status on the same errors those forms already display.

## Verification

Execution: managed Linux with installed Chromium/software WebGL and existing dependencies. No packages, paid services, hosting resources or Windows application changes. Speech tests use the established deterministic mock; no claim of Windows voices, native screen-reader testing or GPU/FPS verification.

Temporary browser harness: copied e2e/config files under `/tmp/maintainai-gd02b4-1pm0gw7t/frontend`, symlinking installed node_modules and production dist. Only temporary harness URLs change 8000/5173 to 8190/5390. Start API using `MAINTAINAI_DB_PATH=/tmp/maintainai-gd02b4-1pm0gw7t/<run>.sqlite3 .venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8190`, and preview using `./node_modules/.bin/vite preview --host 127.0.0.1 --port 5390 --strictPort`. Focused and full runs use fresh distinct disposable databases; native backend tests use their temporary fixtures. User/Windows records and default development data are not used.

| Command | Final result |
| --- | --- |
| `npm --prefix frontend test` | **207 passed / 22 files** |
| `.venv/bin/python -m pytest backend/tests -q` | **98 passed**, one existing Starlette/AnyIO deprecation warning |
| `npm --prefix frontend run build` | **Passed**, 3.50 seconds Vite build; existing large-chunk warning |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test e2e/gd02b4.spec.ts --workers=1 --timeout=120000` | **4 passed together (45.7 seconds)** on `focused2.sqlite3` after the focus fix |
| `CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test --workers=1 --timeout=120000` | **61 passed together (14.2 minutes), no retries**, fresh `full.sqlite3` |
| `node check-handoff-layout.cjs` (temporary harness, additional layout probe) | **3 viewport checks passed**; preview and modal page widths exactly 1366/1280/390; modal content widths 556/556/338 equal available client width; bounds inside viewport; Escape returns focus; **zero ticket POSTs** |
| `git diff --check`, changed-file manifest and protected-file comparison against baseline | **Passed**; exact 13-file manifest, protected files unchanged |

The final full browser run used the completed production build with no source/build changes during the run. It includes Manual and Automatic progression without pre-confirmation ticket writes, all required viewports, real persisted ticket/linked diagnosis/one created history entry, rapid duplicate confirmation, no extra diagnosis request, aborted response after a real server commit, navigation/new-run blocking and identical-UUID reconciliation. Reconciliation completion while in Maintenance preserves an independent manual title draft and never redirects automatically. Existing browser cases retain manual maintenance, history, optimistic concurrency/B01, exports, seeded replay, FK/rendering, WebGL fallback/recovery, camera/resource and UI-03 evidence protections.

The additional temporary layout probe runs the real deterministic guide to Stage 6 at each required viewport, checks actual document/dialog bounds and content overflow, and cancels with Escape. It saves diagnoses only in the disposable database, never tickets. It is recorded separately from the 61-test suite rather than inflating that count. No full browser run was interrupted or failed; the earlier focused failure and repeat are disclosed below.

Development failures are disclosed rather than combined into a passing result: the first unit run had 181 passing/18 failing (199 total), caused by absent jsdom dialog-method spies and legacy single-heading selectors; the related build caught an unsupported test-only `fireEvent.cancel` API. Corrected native-dialog fixtures, preview title hierarchy and cancel-event dispatch produced 199 passing tests/build success. Subsequent added regressions produced 201 and then 203 passing tests. The first focused browser run had 1 passing/3 failing: all three viewport cases caught native focus return after Escape. Explicit restoration fixed this real accessibility issue; the repeat focused run passed all four together. No test was weakened or removed to hide these failures.

## Limits and stop point

Strictly page-session recovery, not durable cross-reload recovery or cross-tab incident deduplication. Same-ID reconciliation may be denied by read-only/quota/access policy and must remain unresolved rather than silently switching identity. Public anonymous record protections and hosting gates remain the existing repository policy; this change does not grant deployment or paid usage. Existing large-chunk build and backend deprecation warnings remain. Native screen readers and actual Windows speech/hardware behavior remain unverified. No GD-02B-5 acceptance claim.

No backend, schema, simulation/kinematics, deterministic scenario, historical TCP, evidence-selection, controller timing/readiness, manual maintenance form, deployment, dependency or hosting file changes. Stop after the review PR for independent Code Review.
