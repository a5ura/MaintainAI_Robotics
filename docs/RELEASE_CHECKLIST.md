# V1 release checklist

## Current Phase B.1 checkpoint — November 1, 2026 (America/New_York)

B.0 PR #8 is merged at `8d39f2af9dee9a1d21d658950ddb15a228651848`. B.1 branch `feature/v1-hosting-phase-b1` prepares one same-origin Render Free Python service plus external Neon Free: production frontend build, hosted route/static/CORS hardening, restricted runtime SQL and constrained real PostgreSQL rehearsal. SQLite/D1, PRD, robot and diagnostic algorithms remain intact. See [B.1 setup](DEPLOYMENT_PHASE_B1.md), [completion](PHASE_B1_COMPLETION_REPORT.md) and future-only [B.2 runbook](PHASE_B1_HOSTED_RUNBOOK.md).

No user-facing data/report download exports exist in merged V1; this B.1-listed workflow is an explicit pre-existing acceptance gap, not a passing check. Keep it open for a bounded correction before public release. Render current Free/runtime terms and all account/card/hard-cap eligibility remain unverified. No provisioning, billing, deployment, production migration, environment publication or merge. Hosted verification requires separate B.2 authorization; anonymous availability cannot be guaranteed by global quotas. Earlier checkpoint text below is historical.

## Historical Phase B.0 checkpoint — November 1, 2026 UTC

Main includes merged A.2 PR #7 at `8b8491035cfcf388378376dd8b9b2e649dcfed94`. Branch `feature/v1-hosting-phase-b0` adds a native async Psycopg/PostgreSQL adapter and explicit FastAPI hosting entry point while preserving SQLite, D1, diagnostic algorithms and the approved PRD. Real local PostgreSQL integration, independent API/process/database restart, immutable full evidence, concurrency, idempotency and protected backup/recovery are tested in managed Linux. Desktop/Windows and hosted durability remain unverified. See [B.0 setup](DEPLOYMENT_PHASE_B0.md), [adapter](POSTGRESQL_ADAPTER.md), [hosting gates](PHASE_B0_HOSTING_DECISION.md) and [completion report](PHASE_B0_COMPLETION_REPORT.md).

Render Free + Neon Free + free static hosting is provisional: Render current terms and all account-level Free/card/automatic-billing eligibility remain unverified. No public deployment, provisioning, billing activation, real-record migration, environment publication or merge is authorized/performed. No new Cloudflare/Pyodide access route was attempted. Anonymous quotas and a storage high-water guard do not guarantee permanent availability; release still requires provider/account, abuse, backup and hosted verification. Earlier checkpoint text below is historical.

## Historical Phase A.2 checkpoint — November 1, 2026 UTC

Phase A.1 PR #6 is verified merged at `966c809`. Phase A.2 explicitly authorizes local storage hardening despite the unchanged index CONNECT 403, superseding A.1's deferred-expansion gate for this assignment. New D1 schema v2 provides atomic immutable manifest/chunks, verified reconstruction and quota charging; the large-evidence row-size defect is resolved locally. Default snapshot allowance is now 64 MiB/day including conservative logical overhead. Cached counts, indexed 200-record ticket/history pages and UI continuation preserve drafts and the native SQLite workflow. Legacy inline evidence and synthetic migration/backup/restart remain supported.

Actual Python Workers/JS binding execution, billed CPU/memory, pre-ASGI streamed body enforcement, account Free-only terms and hosted durability remain unverified. The total 500 MB Free storage/retention and anonymous availability gates are not solved by a daily budget. No deployment, resource provisioning, billing, real-record migration, environment publication or merge. Current evidence: [A.2 report](PHASE_A2_COMPLETION_REPORT.md) and [details](PHASE_A2_STORAGE_REPORT.md). Earlier checkpoint statements below are historical, including the previous single-row restriction and 2 MiB/day default.


This separates the locally verified M3 experience from a public V1 release. **Do not mark V1 deployed based on local tests.**

## Local release candidate

- [x] Preserve merged M1/M2 diagnostics, kinematic validation and maintenance behavior.
- [x] Real simulation/backend Guided Demo, controls, observations/checks and API ticket flow implemented.
- [x] Optional model-derived engineering values/frames/path/transforms and component selection implemented.
- [x] Input limits, immutable snapshots, optimistic writes and retry-safe guided ticket IDs.
- [x] Optional single-process anonymous write limiter and explicit-origin CORS configuration.
- [x] Offline consistent SQLite backup and dry-run retention/recovery helpers tested on temporary data.
- [x] Final full regression/browser results recorded in M3 report: 97 backend, 39 frontend, build and 15 browser tests passed after the M3 acceptance fix; Phase A reruns those and adds 44 local D1/adapter tests.
- [ ] Windows laptop performance and browser/GPU fallback verified (not established by cloud software WebGL).
- [ ] Keyboard/contrast/screen-reader/accessibility review beyond the documented smoke checks.

## Anonymous shared-data threat model

Anyone can create synthetic incidents, add notes or change statuses; no visitor-private identity exists. CORS is not authentication. A bot can exhaust free compute/storage, vandalize public notes, enumerate records or make data unavailable at hard quotas. Do not enter private/sensitive information in public demo records. React escapes record text; SQL uses parameters; notes/fields/body sizes are bounded. Database credentials must never appear in frontend code or `VITE_*` variables.

Before public use:

- [ ] Confirm Free-only account/quotas, no billing/card requirement or auto-upgrade; stop on any chargeable flow.
- [ ] Add distributed/platform rate/read/write/daily budgets and monitor quota usage. Local `MAINTAINAI_PUBLIC_DEMO=1` gives 20 writes/peer/minute, 120 writes/process/minute, ignores spoofed forwarded-IP headers and returns 429/Retry-After. It resets on restart and does not aggregate multiple instances; **it does not guarantee a daily provider quota**.
- [ ] Confirm trusted client-IP handling behind the selected proxy; never trust arbitrary X-Forwarded-For.
- [ ] Enforce explicit CORS origins and configure the actual public API root. `VITE_API_BASE` is public, never a database credential.
- [ ] Approve retention policy (suggested: resolved synthetic tickets/unreferenced diagnoses older than 30 days), backup location/restore rights, seed recovery and storage ceilings. Do not apply a retention command to production without explicit authorization.
- [ ] Maintain an operator kill switch/fail-closed write path, with helpful quota/maintenance error states. No public reset/delete endpoint.
- [ ] Re-evaluate dependency/runtime security for the chosen host; current local tests are not production-hardening certification.

## Hosting and durability gate

- [ ] Select an architecture after reviewing `HOSTING_DECISION.md`; all account-specific access/cost items remain unverified.
- [ ] Implement and verify the selected managed-store adapter; local sqlite3 is not a D1/PostgreSQL connection.
- [ ] Verify real host runtime/package compatibility, CPU/memory/cold-start limits and public error recovery.
- [ ] Scope server-side credentials; confirm no source/bundle/database backup contains secrets.
- [ ] Explicitly authorize publication and any record migration after backup.
- [ ] Deploy frontend/backend/database without enabling paid features, upgrades, trials or credits.
- [ ] Verify two independent browser sessions and shared maintenance record visibility.
- [ ] Verify record/note/evidence survival across actual backend restart **and redeployment**, plus managed-store inactivity/wake behavior.
- [ ] Verify recovery/backup restore against a disposable database before relying on it.
- [ ] Record public URL, exact deployed commit, account plan/cost evidence and public smoke outcomes.

## Git review

- [x] M3 PR #4 merged; baseline verified at `a33811f`.
- [ ] Review the Phase A feature branch/PR and completion report; do not auto-merge.
- [ ] Confirm PRD/Project 1 unchanged and no billable resources introduced.
- [ ] Return `M3_COMPLETION_REPORT.md` to Planning for signoff. Local M3 completion does not complete public V1 release.


## Deployment Phase A evidence and remaining gates

- [x] Preserve SQLite and shared HTTP/domain behavior; genuine local D1 atomicity, concurrency, idempotency, full small snapshots and synthetic migration/backup restore tested.
- [x] Shared D1 request/write/byte reservations, read-only mode and seed protection locally tested; real emulator restart preserves records and counters.
- [x] Real workerd Static Assets/SPA serving and all 15 Chromium regressions against CPython + local D1 pass.
- [ ] Launch actual Python Worker, resolve exact Wasm dependency pins, verify ASGI and Python/JS binding conversion at every endpoint.
- [ ] Demonstrate authoritative Free 10 ms CPU / 128 MB memory, including all maximum accepted inputs and cold initialization.
- [x] Phase A.2 replaces single-row new evidence with tested immutable chunked storage, preserving maximum accepted fixtures and complete evidence; actual Python Worker interop remains separately unverified.
- [ ] Bound streamed uploads before the SDK's ASGI receive-queue buffering, including missing/spoofed Content-Length.
- [ ] Verify large-data row accounting, retention, backup access/recovery, anonymous availability and any truly free platform controls.
- [ ] Independently confirm Free-only account eligibility/no billing exposure; obtain explicit Phase B provisioning/publication authorization and prove hosted durability/redeployment.

Current verdict/details: [Deployment Phase A report](DEPLOYMENT_PHASE_A_REPORT.md). Local controls do not complete the unchecked public-release gates above.


## Phase A.1 runtime-first checkpoint

Phase A PR #5 is verified merged at `e940a83`. A dependency-free official-pattern Worker reproduces the package-index CONNECT 403 before app initialization; supported offline CLI resolution also lacks the required SDK cache. Runtime and billed resources remain unverified. Under the assignment's blocked-index gate, storage chunking, pre-ASGI enforcement and retained-data changes are deferred. No environment configuration, hosted resource, billing, production data or deployment was changed. Current evidence and exact next experiment: [Phase A.1 report](PHASE_A1_COMPLETION_REPORT.md).


## Phase A.2 independent-review gate

- [x] Atomic chunked evidence/byte charging; identical retry, conflict, rollback, checksum/corruption and complete large-fixture recovery verified on real local D1.
- [x] Bounded indexed ticket/history pages, transactional counts and UI continuation/draft preservation; native SQLite retained.
- [x] Real v1 migration/emulator restart and fixture backup/restore; no actual records migrated.
- [x] Current primary-source hosting alternatives ranked; no architecture switched or resource activated.
- [ ] Independent review of A.2 branch; automated PR creation blocked by GraphQL Forbidden, prepared body/compare link in report.
- [ ] Actual Python/Wasm/JS binding, billed CPU/memory, pre-ASGI streamed limits, Free-only account eligibility, total-capacity/retention, hosted backup/redeploy proof and explicit publication authorization still required.
