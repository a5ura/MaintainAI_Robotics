# V1 release checklist

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
- [ ] Replace single-row evidence storage with tested immutable chunked storage for the complete approved input range; no truncation or silent requirement change.
- [ ] Bound streamed uploads before the SDK's ASGI receive-queue buffering, including missing/spoofed Content-Length.
- [ ] Verify large-data row accounting, retention, backup access/recovery, anonymous availability and any truly free platform controls.
- [ ] Independently confirm Free-only account eligibility/no billing exposure; obtain explicit Phase B provisioning/publication authorization and prove hosted durability/redeployment.

Current verdict/details: [Deployment Phase A report](DEPLOYMENT_PHASE_A_REPORT.md). Local controls do not complete the unchecked public-release gates above.
