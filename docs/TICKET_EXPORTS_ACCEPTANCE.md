# PR #9 follow-up — saved maintenance report downloads

November 1, 2026 (America/New_York). Reviewed baseline: `67f2a3fc2d238c6d7e8e4ecd0ce9fec11894c40f`, existing branch `feature/v1-hosting-phase-b1`. This is the explicitly authorized correction to the independent review's export gap. Original B.1 reports describe their earlier checkpoint; current export acceptance is recorded here. PRD, robot, diagnostic algorithms, storage schemas, hosting architecture and infrastructure are unchanged.

## User workflow and file contents

Open a saved maintenance ticket and choose **Download JSON** or **Download Markdown**. Both are labelled **saved records only**. Unsaved new-ticket title/description, repair notes, selected status and resolution drafts remain untouched and are excluded. Download failures use a separate retryable message, without reloading the form. Navigation/selection invalidates a late download.

Files identify the ticket and captured saved version in their names. They include public ticket fields, saved equipment identity, timestamps, resolution notes, all operator/history events, and the complete linked diagnosis (summary, anomalies, observations, root-cause candidates, supporting/contradictory references, recommended checks, telemetry/logs/sensors/calibration/FK and warnings). Manual tickets explicitly have no diagnosis. Provenance identifies simulated signals and computed rule outputs without calibrated-probability claims. JSON is versioned (`schema_version: 1`); Markdown presents the report plus the complete saved diagnosis in a safely fenced JSON block.

Ticket/equipment/history use explicit public-field projection, excluding SQL trigger/private fields and connection metadata. Diagnostic content is retained in full; unexpected top-level schema or secret/internal fields fail closed rather than dropping evidence. This does not redact sensitive text a visitor deliberately saves in public notes; existing synthetic/public-data rules still apply.

## Consistency and read-only guarantees

- Additive detail-response fields `history_total` and `history_last_seq` anchor a complete history read. SQLite reads ticket/diagnosis/history/bounds within one read transaction; D1/PostgreSQL include bounds in the existing atomic read batch. No schema migration or new endpoint.
- Fresh GETs retrieve saved detail/equipment, then all 200-record continuation pages. Strict positive sequence ordering, ticket identity, advancing cursors, declared count and final sequence detect missing/duplicate/malformed/early-ending pages. Failed retrieval never produces a partial file.
- Re-read the saved ticket, diagnosis, first history page/bounds and equipment identity before making a Blob. Version/content/bounds changes reject the export; a successful report identifies its verified captured version. It is not guaranteed to remain the newest version after download.
- Export code issues GET only and does not alter tickets, diagnosis snapshots, histories, equipment or drafts. Existing request-budget accounting still applies to GET requests; those operational counters may change. No write/reset/migration endpoint or quota exemption is introduced.
- Complete browser reports are bounded to 10,000 history events and 32 MiB. Exceeding either limit returns an explicit error; it never truncates records/evidence or deletes stored data. Full accepted diagnostic snapshots fit and are tested. Files use safe ticket/version names and temporary object URLs are revoked.
- User text in readable Markdown is quoted/escaped rather than interpreted as HTML/link/heading syntax. Full diagnosis JSON uses a fence longer than any embedded backtick run.

## Acceptance checklist

- [x] JSON preserves complete diagnosis/evidence, including saved large Unicode telemetry.
- [x] Histories beyond 200 events include every page without duplicates (450-event unit fixture; 203-event real-browser workflow).
- [x] Failed continuation and missing/repeated/invalid cursors, missing/duplicate/cross-ticket/empty rows and early termination reject partial reports.
- [x] Concurrent saved version/content/equipment/history changes are detected; successful files name their captured saved version.
- [x] Unicode and manual tickets without diagnoses work in both formats.
- [x] Unsaved title, description, repair, status and resolution drafts survive successful downloads and retryable errors. Late unmounted-view results create no file.
- [x] Export requests are GET-only; complete repository before/after state is unchanged by metadata reads. Existing operational quota accounting is retained.
- [x] Markdown safely represents hostile user text/backticks; exports exclude internal trigger/connection fields. Blob cleanup and filenames tested.
- [x] Real Chromium: all 19 workflows pass on PostgreSQL and the same 19 pass on SQLite.
- [ ] Hosted/public verification: **not performed and not claimed**. Account/card/billing/hard-cap, protected backup, hosted TLS/pooling/sleep/redeploy and explicit B.2 authorization gates remain open.

## Exact verification

Existing managed Linux, Python 3.12.14, Node 24.19.0, actual local PostgreSQL 17.11, real local D1 emulator and Chromium software WebGL. All inputs synthetic; no laptop, account, resource provisioning, billing, deployment, real migration or merge.

| Command | Result |
| --- | --- |
| `.venv/bin/python -m pytest backend/tests cloudflare/tests postgres/tests -q` | 230 passed, zero failed/skipped (98 native + 95 D1/shared + 37 real Pg), upstream AnyIO warning |
| `npm --prefix frontend test` | 63 passed, zero failed/skipped (43 existing + 20 export tests) |
| `npm --prefix frontend run build` | TypeScript/production build passed, existing Three.js chunk-size warning |
| `.venv/bin/python -m postgres.release_rehearsal` | 19 Chromium tests passed, zero failed/skipped; 11 full-size payloads plus restricted SCRAM/resource-limit/restart/failure checks passed |
| `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke` against SQLite | 19 passed, zero failed/skipped (2.7 min) |
| `git diff --check` and Python compileall | Passed |

The full browser suite contains the same 19 workflows on each adapter, not 38 distinct tests. Three new workflows exercise actual downloaded JSON/Markdown files, complete saved evidence/history, drafts, failed continuation, concurrent changes, manual Unicode/hostile text and >2 MB output. Initial browser assertions compared JSON textual key order; corrected to parse Markdown's JSON and compare full values because PostgreSQL stores canonical key order. No application data was lost and no tests were disabled. A textarea assertion was changed to an accessible-role locator after typing. An initial test-only mock-context TypeScript annotation was corrected before the passing build.

Keep frontend assets stable while D1/browser checks run. Existing `npm run d1:local` and disposable PostgreSQL setup are documented in DEPLOYMENT_PHASE_B1.md. The production rehearsal now reads Chromium's actual pass count rather than hard-coding 16. It reuses restricted SCRAM credentials, local resource limits and restart/failure checks; fresh follow-up evidence is separate from historical B.1 artifacts. SQLite runs with a fresh temporary database on 8000 and Vite preview from frontend/ on 5173. Raw results: evidence/ticket-exports/.

## Delivery and remaining gates

Delivery targets existing PR #9 and branch `feature/v1-hosting-phase-b1`. The final commit SHA and remote-head verification are returned with completion. No replacement PR or merge.

This resolves the explicitly authorized download acceptance gap locally. Return the correction for independent review. Public deployment still requires the unchanged B.2 account/cost/hosted-verification runbook and separate authorization. No new dependencies, infrastructure, paid service, public URL or merge.
