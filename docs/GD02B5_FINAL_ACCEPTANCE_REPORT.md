# GD-02B-5 — Final acceptance and recruiter demonstration readiness

Audit date: November 16, 2026 (America/New_York; execution logs use UTC and continue into November 17). GD-02-SPEC-v1.1 acceptance assignment. Review only: no merge or deployment.

## 1. Baseline, authority and scope

Required and fetched `origin/main`: **`0b5aab03d696ba5ea6b6138a702abc96c184fa22`**, merging PR #20 / GD-02B-4. The existing checkout was clean before creating `audit/gd02b5-final-acceptance` directly from that baseline. Existing branches, ignored files and user SQLite records were preserved. The exact final audit head is recorded in the PR body and handoff after committing this report, avoiding a self-referential commit hash.

No standalone GD-02-SPEC-v1.1 file/link was found. Planning explicitly confirmed its absence and authorized using the B-1–B-4 assignments and completion reports, merged implementation/tests and this B-5 assignment. Those materials are the audit contract. A future consolidated specification is a separate documentation change. No new requirement or load-time SLA is inferred from the missing document.

Permitted changes here are this report, non-sensitive evidence, a new browser acceptance test and one existing browser-test startup allowance. **No production frontend/backend, simulation, diagnosis, evidence, controller, narration, maintenance, schema, API, dependency or hosting changes.** No remediation of the application findings below was performed.

Execution: managed Linux cloud workspace `/workspace/MaintainAI_Robotics`, Debian 13 x86_64, Python 3.12.14, Node 24.19.0, Chromium 154.0.8037.57. Browser flags explicitly select ANGLE/SwiftShader. No accessible Windows environment or native screen reader was found. Installed tools only; no dependencies, accounts, paid services, billing, resources or deployment were introduced.

## 2. Isolation, commands and regression results

Backend pytest uses its autouse `tmp_path` Repository/dependency override. The process also receives `MAINTAINAI_DB_PATH=/tmp/gd02b5-unused-test-default.sqlite3` to protect the default path if a test bypasses that fixture. Browser runs use distinct newly created SQLite files under `/tmp/maintainai-gd02b5-2l5odjbx/`: `full.sqlite3` for the baseline, `audit.sqlite3` for additional/diagnostic checks and persona review, and `final.sqlite3` for the final complete run. These contain only seeded/synthetic data. No user/Windows database was opened, migrated or modified; no database/profile is committed.

The temporary harness copies baseline e2e/config/src files and symlinks installed node_modules and the built dist. Only temporary URLs substitute **8192/5392** for legacy 8000/5173. API command, from repository root:

```sh
MAINTAINAI_DB_PATH=/tmp/maintainai-gd02b5-2l5odjbx/final.sqlite3 .venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8192
```

Preview command, from the temporary frontend:

```sh
./node_modules/.bin/vite preview --host 127.0.0.1 --port 5392 --strictPort
```

Commands below are recorded with a Python `subprocess`/`perf_counter` wrapper; wall durations include process startup. It changes no test behavior. `/usr/bin/time` was absent: the first timing-wrapper setup exited 127 before executing any tests. Native backend time is also reported by pytest.

| Command                                                                                                                                    | Result                                                          | Wall duration                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------ |
| `npm --prefix frontend test`                                                                                                               | **207 passed / 22 files**                                       | 24.041 s                                         |
| `.venv/bin/python -m pytest backend/tests -q`                                                                                              | **98 passed**, one existing Starlette/AnyIO deprecation warning | 2.335 s; pytest 1.29 s                           |
| `npm --prefix frontend run build`                                                                                                          | **Passed**, existing >500 kB chunk warning                      | 9.184 s                                          |
| `frontend/node_modules/.bin/tsc --project frontend/tsconfig.json --noEmit`                                                                 | **Passed**, configured production scope                         | 9.158 s                                          |
| Baseline full Playwright command below                                                                                                     | **60 passed, 1 failed**, no retries/skips                       | 827.414 s                                        |
| Unchanged failing case, `--grep 'UI02 unavailable WebGL' --repeat-each=3`                                                                  | **3 passed** diagnostic executions; not a full-suite pass       | 15.641 s                                         |
| Final full Playwright command below                                                                                                        | **68 passed, zero failures/retries/skips**                      | 933.656 s wall; 932.734 s reported by Playwright |
| `frontend/node_modules/.bin/prettier --check frontend/e2e/gd02b5.spec.ts frontend/e2e/ui02.spec.ts docs/GD02B5_FINAL_ACCEPTANCE_REPORT.md` | Passed for changed tests and this report                        | —                                                |
| `git diff --check` and protected-file comparison to baseline                                                                               | Passed; production and protected files unchanged                | —                                                |

Final browser command, in the temporary frontend:

```sh
GD02B5_EVIDENCE_DIR=/workspace/MaintainAI_Robotics/docs/evidence/gd02b5 CHROMIUM_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test --workers=1 --timeout=120000 --reporter=line,json
```

Baseline command is identical without `GD02B5_EVIDENCE_DIR`, before copying the new audit test. Baseline tests/config were otherwise unchanged except temporary ports. The final command runs **all 61 pre-existing cases plus all 7 added cases together** against fresh disposable state and the unchanged production build. No partial or isolated results are combined to claim a complete pass.

### Failure investigation and test-only corrections

The baseline WebGL-unavailable case failed its default five-second message assertion. Its error snapshot still shows **“Loading 3D workcell…”**, before the lazy workcell had mounted. Three unchanged isolated executions then passed. This supports, but does not conclusively prove, a lazy-load/host-timing cause. `ui02.spec.ts` now waits up to **15 seconds for the same fallback message**, matching existing workcell startup checks. No sleep, skipped assertion, replacement backend result or production fix was added. The actual fallback/controls/real diagnosis assertions remain intact. The original failure evidence is retained; the audit does not describe the initial baseline run as green or establish a five-/15-second product SLA.

Additional test development is fully disclosed in [execution history](evidence/gd02b5/execution-history.json): first seven-case run **2 passed / 5 failed**; diagnostic subset **1 passed / 2 failed**; revised seven-case run **5 passed / 2 failed**; final targeted viewport run **3 passed together**. Causes were over-specific native dialog tab-wrap expectations, counting the WebGL capability probe as an extra renderer, a dynamic textarea-label selector, and pressing successive keyboard actions before the new stage/readiness committed (one 120-second timeout). Corrections use actual native focus state, a warmed renderer baseline, the textbox's semantic accessible name and condition-based readiness/stage waits. No application change or arbitrary sleep hides these results. The final complete run is reported separately.

An optional expanded strict e2e TypeScript check (`tsc --project /tmp/maintainai-gd02b5-2l5odjbx/tsconfig.audit.json --noEmit`) **failed**, 1.934 s: missing Node declarations for built-in imports/process and existing `workcellProbe.ts` implicit-`this` errors. The checked-in production config includes `src`, not e2e. No dependency/shim or relaxed compiler setting was introduced. Full strict e2e typing is an acceptance/tooling gap, not a failed production TypeScript check. No configured lint/format CI script was found; installed Prettier is used only for the changed test/report files. Formatting and Git-check durations were not separately timed. Browser runs also emit the non-blocking Node NO_COLOR/FORCE_COLOR warning, preserved in their logs.

## 3. Six-stage acceptance matrix

All scenario checks use the actual Dropped Object simulation, seed 42, existing engine and real FastAPI diagnosis. Virtual-time regression cases run the existing timers; timed demonstrations below do not accelerate them.

| Stage                         | Verified behavior and evidence                                                                                                                                                                                                                  | Status                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1 — Introduction              | Cell 01 / R-01, explicit simulated/not-live-hardware labels, Manual default, matching caption/primary workcell target; zero ticket POSTs                                                                                                        | PASS                                                             |
| 2 — Robot Operation           | Same 3R engine, attachment/trajectory/FK contracts retained; real loss milestone at approximately 6 s pauses that run. HOLD, object presence and vacuum distinguish command from observation. Previous does not rewind                          | PASS                                                             |
| 3 — Fault Detection           | Same cycle resumes to end; observed loss appears before backend diagnosis. Pending/error states do not fabricate a result or bypass readiness; explicit retry only                                                                              | PASS                                                             |
| 4 — Evidence Investigation    | Actual backend timeline; E6 marker's rendered world transform matches recorded TCP within existing 1e-8 m assertion. E5/E11 provide before/after context. Live pose versus historical marker is labelled; Clear Selection clears without rewind | PASS                                                             |
| 5 — Diagnosis and Next Checks | Backend order and actual supporting/contradicting references/checks preserved. Normal/inconclusive/no-result/error handling covered by unit/browser regressions; recommendations never become completed verification                            | PASS                                                             |
| 6 — Maintenance Handoff       | Actual equipment/run/diagnosis/description, non-writing preview, explicit confirmation, Cancel/Escape zero writes, one ticket linked to the correct immutable diagnosis and one creation-history event; Open with no resolution/repair claim    | PASS functional safety; **FAIL guidance-copy consistency (F01)** |

The canonical Dropped Object run is detected, not inconclusive. Inconclusive behavior is covered by existing computed-rule/frontend fixtures and pure cue tests; this report does not claim a native six-stage inconclusive live scenario was demonstrated. All five fixed scenarios plus seeded-random selection/replay retain the existing broader regression coverage.

## 4. Manual, Automatic and narration

Manual Next/Previous readiness, pause/resume, mode changes, reset/exit, stale generations and pending/error gates are exercised. Navigating/replaying does not create another diagnosis; Previous retains the same clock/result. Automatic requires readiness and the unchanged **4,000 ms dwell after readiness**, stops at Stage 6 and sends no ticket POST. Mocks deliberately leave utterances unfinished, so progression proves speech completion is not a gate. Hidden/pagehide tests dispatch browser lifecycle events: becoming visible requires explicit Resume. No real Windows tab/OS integration claim follows from those synthetic events.

Narration tests cover six actual-stage scripts, result-dependent pending/error/normal/inconclusive/available text, local-English voice preference, missing/remote voices, throwing APIs, Mute/Replay, stale callbacks, cancellation on pause/exit/navigation and no telemetry rerender replay. Stage 6 pending/rejected/uncertain/saved scripts match submission state. No unsupported root cause, completed physical inspection or calibrated cause probability is asserted. Speech tests and persona screenshots use the existing mocks, **not an installed Microsoft voice**.

**Four seconds is contract-compliant but too short for an unassisted first-time reading of the longer evidence/check captions.** The measured Automatic stage entries and word counts are in [automatic-duration.json](evidence/gd02b5/automatic-duration.json); the evidence/check captions contain roughly 64/78 words in this run and are intentionally preempted. Observed title-entry times are detected by assertion polling and are not exact timer-fire timestamps; the four-second policy is verified by source and deterministic timer tests. This is an accepted timing limitation, not a silently changed rule. Use Manual for the recruiter presentation. A longer/per-stage dwell or optional speech-aware presentation policy needs a separate Planning decision.

## 5. Ticket safety and persistence boundary

The existing server derives a deterministic primary key from UUID `request_id` and validates the same equipment/diagnosis/title/description on reuse. SQLite atomically creates the ticket plus creation history; same-identity replay returns that existing ticket. There is **no request-ID lookup endpoint**: explicit reconciliation is the existing same-UUID, byte-identical POST, which may return an existing ticket or create it if the original never committed. No new backend contract is inferred.

| Safety condition                                      | Verification                                                                                                                                         | Status                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| No POST before confirmation; Cancel/Escape            | Complete Manual/Automatic flows and new viewport/dialog checks                                                                                       | PASS                                                            |
| One request for rapid duplicate confirmation          | Existing browser double-click and synchronous-ref mutex unit coverage                                                                                | PASS                                                            |
| Navigation while request is in flight                 | Real commit, held response, navigate to Maintenance, fill Title/Description, release response: one saved ticket/event, same view and drafts retained | PASS                                                            |
| Lost response after commit                            | Existing B-4 route fetch commits then aborts; old attempt survives exit/new guide/navigation and blocks conflicting guided creation                  | PASS                                                            |
| Stable UUID/payload reconciliation                    | Both recorded POST bodies equal; one persisted ticket/created event, no automatic retry                                                              | PASS                                                            |
| Confirmed rejection versus unknown                    | Known pre-write rejection, generic 404/409/5xx, timeout/network and mismatched 2xx; unsuccessful reconciliation cannot erase original uncertainty    | PASS in component tests; lost response also real browser/SQLite |
| Unverified response cannot claim success              | ID and confirmed fields must match; malformed/mismatched success remains uncertain                                                                   | PASS in component tests                                         |
| Existing manual maintenance, B01, history and exports | Full baseline/regression workflows; independent draft preserved across late response                                                                 | PASS                                                            |

Accepted limits: reload recovery is deferred and no browser durable storage exists; separate UUIDs, tabs and independent manual tickets are not globally deduplicated; read-only/access/quota policy can block reconciliation, leaving uncertainty rather than authorizing a new identity. This is not a global exactly-once promise. Use synthetic records and retain the page if a confirmed attempt becomes uncertain. The unresolved-attempt lock covers the guided handoff; existing independent manual forms are unchanged. If Planning intends to lock those forms as well, that cross-workflow policy is a specification gap requiring an explicit decision, not an inferred change to this audit's acceptance contract.

## 6. Responsive, visual and accessibility assessment

All six stages were inspected/captured at **1366×768, 1280×720 and 390×844**. Document widths equal viewport widths in every captured stage, and dialog content/bounds fit. The evidence table may scroll inside its own container; no horizontal page overflow was observed. Long IDs wrap. Buttons, native select, preview, confirmation actions and targeted areas remain reachable; tested guide/navigation/dialog touch targets are at least 44 px. Long tables/previews require vertical scrolling; this is not a claim that every panel fits one viewport.

Actual screenshots show a restrained, coherent workcell, explicit simulation labels, source/destination, distinct loss marker and command/presence signals. Desktop and mobile candidate sections separate support, contradiction and operator checks. F01/F03/F04 record remaining comprehension/polish issues. Two controls named Create maintenance ticket lead to distinct flows (guided confirmation versus the existing Diagnostics-to-manual-form handoff); group context distinguishes them, but the shared label can confuse a newcomer. This is a further reason to review the control wording under F03, not a permission to alter manual persistence. Readability here is an agent visual inspection and browser layout check, not a human usability study or measured contrast audit.

Browser-supported accessibility checks cover named controls/regions, keyboard activation, focus outlines, native modal semantics, both dialog buttons, inert background, Escape/Cancel and focus restoration; missing-target fallback, reduced-motion scrolling, no Automatic focus stealing and hidden-tab Resume remain in baseline tests. Native Chromium sometimes includes the **scrollable dialog itself** in tab order, or transfers focus to **browser chrome** (`document.hasFocus() === false`, active BODY). Returning Tab restores modal focus. Tests distinguish these from focus reaching a background application control; they do not force a browser-specific two-button loop.

Keyboard-only traversal probe: **PASS — all six stages, E6 selection/Clear Selection and confirmation Cancel/Escape reached using real Tab/Shift+Tab/Enter/Escape; no clicks or programmatic focus, one diagnosis and zero ticket POSTs**. Programmatic-focus-plus-Enter tests alone are not treated as proof of complete Tab traversal. The additional [native-key traversal log](evidence/gd02b5/keyboard-traversal.json) records 192 Tab/Shift+Tab keystrokes for its scripted route, visible focus at target controls and a logical initial order (skip link, product link, workspace navigation, camera/run controls, then walkthrough controls). This is not a minimum keystroke count; dense reference-link traversal remains a usability consideration under F03/F04.

Native screen reader: **NOT TESTED**; none available. Native Windows voice: **NOT TESTED**. No WCAG certification, native announcement/pronunciation/voice-quality or complete assistive-technology acceptance is claimed. Status roles/text are browser-inspected, not actual screen-reader speech.

## 7. Resource and platform evidence

The renderer reports **ANGLE / Vulkan / SwiftShader Device (Subzero)**, Google software renderer. The five same-page run probe records native WebGL buffers/contexts, DOM/listener/document counts and GC-assisted CDP heap samples after Exit, clearing only its own test speech logs. Each run sends one diagnosis, zero tickets, clears historical selection/highlights, and retires speech handlers. See [repeated-runs.json](evidence/gd02b5/repeated-runs.json).

Across runs 1–5, the instrumented context count stayed **2** (capability probe plus one renderer), renderer ID stayed **2**, live buffers stayed **118**, documents **1**, DOM nodes **1,109**, listeners **242**, and retired speech-handler count **0**. GC-assisted JS heap increased from **8,776,436 to 9,792,092 bytes** (about **0.97 MiB**); increments diminished over the five samples, but this is not proof of a leak-free application. All five runs issued one diagnosis each, zero ticket POSTs and left the existing synthetic ticket list unchanged. No unexpected page errors were captured in that case.

Existing context-loss/recovery tests require a visible replacement canvas, a newly drawn frame and initialized buffers, preserve time/narration/request isolation and check disposal. No unbounded leak, overnight stability or hardware throughput guarantee follows from this short run. The heap trend warrants a longer profile before a prolonged public session. No FPS, CPU/GPU utilization or Windows responsiveness figure is invented.

| Capability                                                                   | Acceptance status                                                            |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Linux/SwiftShader rendering, FK/TCP, camera, fallback/recovery               | Verified through regression within the stated software-rendering environment |
| Five repeated browser-page walkthroughs                                      | Verified short-run screening only                                            |
| Actual Windows OS/browser/GPU, FPS stability, utilization, long-duration use | **NOT TESTED — no Windows environment**                                      |
| Native Windows local voices, pronunciation, real audible cancellation/replay | **NOT TESTED — no Windows environment**                                      |
| Native screen reader                                                         | **NOT TESTED — no installed reader**                                         |
| Hosted network, cold wake, production billing/quotas/durability              | **NOT TESTED / outside this audit**; prior hosting gates remain              |

## 8. Recruiter-persona review and measured durations

A Codex-led, real-clock browser inspection followed all stages, inspected E6/E5/E11, cleared selection, compared the three actual candidates/checks, reviewed/cancelled confirmation, explicitly saved and opened the linked ticket. No virtual-time advancement or artificial reading sleeps were used. Reading/inspection/tool-interaction time is included. This is a recruiter persona evaluation, not a recruited human study and not a native-voice timing measurement.

| Walkthrough                   | Measured elapsed and boundary                                                                                                   | Interpretation                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Manual functional driver      | **13.268 s to Stage 6; 13.672 s through confirmed save**; excludes initial page load                                            | Fast scripted navigation after readiness, not a comprehension benchmark |
| Automatic functional driver   | **32.893 s to Stage 6**; excludes initial page load                                                                             | Real clock, unchanged dwell, unfinished speech mock; no ticket          |
| Concise persona demonstration | **204.793 s (3m24.79s)** through review completion; ticket confirmed at **181.236 s**, saved-ticket navigation at **181.334 s** | Within 3–5-minute target for this agent-led presentation                |

The persona reached evidence investigation at **107.108 s**, with the failure already explained. It conveyed the eight requested story points: simulated robot operation; observed loss; recorded presence/pressure/timing and independent verification; backend-ordered candidate explanations; checks requiring operator verification; and an explicitly confirmed persistent maintenance record. E5 shows PRESENT/65 kPa/HOLD, E6 ABSENT/12 kPa/HOLD, and E11 independent target absence. These are recorded synthetic inputs, not live hardware. Camera confidence 0.98 is explicitly labelled a recorded input, not cause probability. FK and diagnosis are computed; physical verification is not performed; saved ticket state is real persistence in the disposable backend.

The persona driver printed all timing/request observations but its artifact-export GET used a relative URL without an APIRequestContext baseURL. That harness step failed after the walkthrough. The measured values were transcribed from its terminal output; a **read-only** SQLite query of the same disposable database independently confirmed the ticket, diagnosis link, Open status, empty resolution and exactly one creation event. Its page-error array was not exported, so this interactive run has no verified zero-error claim; the automated acceptance cases independently check page errors. This is disclosed in [recruiter-review.json](evidence/gd02b5/recruiter-review.json), not counted as an application failure or another timing run.

## 9. Findings, severity and demonstration impact

No verified P0 or P1 production finding was identified. The following are verified usability/documentation findings; recommended corrections are **not implemented**.

| ID  | Severity / component                                                | Reproduction; expected versus actual                                                                                                                                                                                                                                           | Evidence; recommendation; demo blocker                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F01 | **P2 — Stage 6 visual guidance** (`guideTargets.ts`)                | Reach Stage 6, explicitly save. Expected guidance to explain the current confirmation workflow and avoid contradicting saved state. Actual sticky/live-description text still says “future confirmation. No maintenance ticket is created,” alongside a saved ticket reference | [Manual state capture](evidence/gd02b5/manual-duration.json), Stage 6 screenshots. Update bounded Stage 6 guidance wording/state mapping in a separately approved correction. **Does not block a briefed live Manual demo; correct before an unattended recruiter presentation.**                            |
| F02 | **P2 — repository onboarding** (`README.md:77`, status entry point) | Read Guided experience instructions, then use current guide. Expected current behavior. README promises automatic creation and obsolete Skip controls; DEVELOPMENT_STATUS opens with UI-02 awaiting review despite the newer merged baseline                                   | Baseline source inspection and current full workflow. Refresh current instructions and explicitly label historical checkpoints in a separately reviewed documentation change. **Does not block a presenter-led app demo; undermines repository self-service credibility.**                                   |
| F03 | **P2 — operations versus guide control hierarchy**                  | Start guide, advance to loss at 6 s, use Show focus area at 1366×768. Expected a first-time viewer to identify walkthrough continuation readily. Bright manual Start is visible while guide Next is below the viewport; Start intentionally takes over/exits the guide         | [Actual 6 s persona screenshot](evidence/gd02b5/recruiter-robot-operation.png), existing takeover code/tests. Presenter should use Walkthrough controls → Next; Planning can consider clearer takeover copy/emphasis without changing ownership/timing. **Recoverable; no blocker for briefed Manual demo.** |
| F04 | **P3 — engineering evidence density**                               | Open Evidence Investigation on desktop/mobile. Expected quick scanning for a first-time visitor. Raw FK/TCP values include long floating-point strings and optional engineering detail alongside fault evidence                                                                | Stage 4 screenshots / inspector. Consider shorter display formatting/progressive disclosure while preserving stored values and mathematical assertions. **Non-blocking optional polish.**                                                                                                                    |

The initial WebGL deadline failure is a **P3 test-reliability finding corrected only in test code**, with a remaining cold-load profiling gap; it is not proven to be a production fallback defect. Four-second narration truncation is an approved/accepted design limitation and separate improvement recommendation, not a regression. Untested Windows/AT/hosting capabilities are acceptance gaps, not invented defects.

## 10. Verdict, gaps and next actions

**CONDITIONALLY READY — core regression and ticket safety pass for a controlled, synthetic-data Manual recruiter demonstration. F01–F03 need briefing or separately approved correction for a polished unattended presentation; Windows/native speech/native screen-reader and long-session acceptance remain incomplete.**

This decision is for the existing simulated application in a controlled, synthetic-data Manual presentation. It is **not** full Windows acceptance, permission to publish a public recruiter URL, hosting/billing eligibility, merge approval or complete public V1 release certification.

Planning actions:

1. Review this audit/PR and authorize a small separate Stage 6 guidance/onboarding-copy correction for F01/F02; decide whether to address the control-hierarchy wording in F03.
2. Use **Manual** for the recruiter demonstration, identify simulation explicitly, compare E5/E6/E11, name hypotheses as candidates and demonstrate confirmation with synthetic data. Prefer the approximately 3m25s reviewed path over unassisted Automatic captions.
3. Before claiming Windows readiness, perform an owner-run rehearsal on the actual Windows machine/browser with a disposable database. Record OS/browser/CPU/GPU and measurement method; check real local English voices, pronunciation, long speech, rapid navigation/cancel, Mute/Replay/Resume, repeated runs, load/render responsiveness and WebGL recovery. Record actual performance figures if measured.
4. Perform a real native screen-reader walkthrough and accessibility review before broad accessibility claims. Define desired cold-load and prolonged-session acceptance targets; profile those rather than assuming them. A strict e2e typing setup/new type dependency requires separate approval.
5. Consolidate the approved GD-02 requirements into a version-controlled specification later. Maintain existing hosting/security/billing/backup gates; no provisioning or deployment follows from this report.

## 11. Evidence index and changed-file boundary

All PNGs are screenshots of the actual production build in Chromium using synthetic data; no generated mockups. Speech labels use test mocks and do not prove native Windows voices. Re-running the audit test writes evidence only to the configured directory; it must point at a disposable backend.

| Stage                   | 1366×768                                            | 1280×720                                            | 390×844                                            |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| Introduction            | [Screenshot](evidence/gd02b5/1366-stage-1.png)      | [Screenshot](evidence/gd02b5/1280-stage-1.png)      | [Screenshot](evidence/gd02b5/390-stage-1.png)      |
| Robot Operation         | [Screenshot](evidence/gd02b5/1366-stage-2.png)      | [Screenshot](evidence/gd02b5/1280-stage-2.png)      | [Screenshot](evidence/gd02b5/390-stage-2.png)      |
| Fault Detection         | [Screenshot](evidence/gd02b5/1366-stage-3.png)      | [Screenshot](evidence/gd02b5/1280-stage-3.png)      | [Screenshot](evidence/gd02b5/390-stage-3.png)      |
| Evidence Investigation  | [Screenshot](evidence/gd02b5/1366-stage-4.png)      | [Screenshot](evidence/gd02b5/1280-stage-4.png)      | [Screenshot](evidence/gd02b5/390-stage-4.png)      |
| Diagnosis / Next Checks | [Screenshot](evidence/gd02b5/1366-stage-5.png)      | [Screenshot](evidence/gd02b5/1280-stage-5.png)      | [Screenshot](evidence/gd02b5/390-stage-5.png)      |
| Maintenance Handoff     | [Screenshot](evidence/gd02b5/1366-stage-6.png)      | [Screenshot](evidence/gd02b5/1280-stage-6.png)      | [Screenshot](evidence/gd02b5/390-stage-6.png)      |
| Confirmation            | [Screenshot](evidence/gd02b5/1366-confirmation.png) | [Screenshot](evidence/gd02b5/1280-confirmation.png) | [Screenshot](evidence/gd02b5/390-confirmation.png) |

Machine-readable layout/focus, durations, five-run metrics, pending-response proof and persona observations are under [evidence/gd02b5](evidence/gd02b5). [Execution history](evidence/gd02b5/execution-history.json) preserves exact commands/statuses/errors, original full-run failure and all focused runs. [Original WebGL failure](evidence/gd02b5/baseline-webgl-failure.md) and [draft-selector diagnostic](evidence/gd02b5/pending-draft-selector-diagnostic.md) distinguish application state from fixture assumptions. Native/backend/build/TypeScript logs and final browser summary are indexed there. No raw SQLite files or credentials are included.

Changed application source: **none**. Changed tests: `frontend/e2e/gd02b5.spec.ts` (seven acceptance cases); `frontend/e2e/ui02.spec.ts` (one bounded startup wait plus explanatory comment). Documentation/evidence: this report and `docs/evidence/gd02b5/*`. No branch deletion, merge, deployment or remediation. Stop for independent Code Review and Planning review.
