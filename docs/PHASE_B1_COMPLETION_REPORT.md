# B.1 completion report

November 1, 2026 (America/New_York). This separates local evidence, simulated hosting, official documentation and unexecuted hosted/account checks.

## A. Git baseline

Fetched origin/main and verified PR #8 merge `8d39f2af9dee9a1d21d658950ddb15a228651848`, parents merged A.2 and B.0 tip `07cb3a6`. Clean baseline; branch `feature/v1-hosting-phase-b1` in existing managed Linux x86_64, not Windows/Local. Python 3.12.14, Node 24.19.0, npm 11.9.0, Git 2.52.0, Docker 28.4.0, actual PostgreSQL 17.11. No additional checkout/environment provisioned. Final delivered SHA is returned in chat and obtainable with git rev-parse HEAD; this report belongs to that reviewed revision.

## B. Hosting architecture

Provisional Option A: one Render Free native Python service builds/serves React and `/api`, external Neon Free shared persistence. Fewer services, URLs and CORS/build mistakes than Option B. Static files are ephemeral artifacts, never persistent data. Free Pages/Render Static Site remains an alternative if current runtime/build/outbound terms fail. Render official pages are CONNECT 403; complete-stack Free/account/card/billing/hosted behavior unverified. See PHASE_B1_HOSTING_VERIFICATION.md for sources, hashes and exact gates. No old limits are presented as current verified facts.

## C. Implementation and exact files

- backend/http_api.py: optional generated-docs setting, unchanged local/D1 defaults.
- backend/postgres_app.py: hosted docs off, exact HTTPS origin validation, dotfile/missing-asset 404s, no-store HTML, immutable content-hashed assets and static nosniff/referrer headers.
- scripts/build-native.sh and render.yaml: reproducible existing pinned native dependencies + locked React production build, same-origin API/90-second timeout, static directory and Node version. Startup script/schema/diagnostic algorithms unchanged.
- postgres/runtime-role.sql: explicit owner-only creation/grants, no embedded credentials or destructive reset. postgres/tests/test_release.py: eight real role/static/origin regressions. postgres/release_rehearsal.py: production startup, restricted SCRAM credentials, constrained CPU/address-space, actual browser/full-size/restart/failure tests with temporary local role/HBA cleanup.
- Seven required B.1 documents: DEPLOYMENT_PHASE_B1.md, PHASE_B1_HOSTING_VERIFICATION.md, PHASE_B1_SECURITY_REVIEW.md, PHASE_B1_CAPACITY_POLICY.md, PHASE_B1_HOSTED_RUNBOOK.md, PHASE_B1_COMPLETION_REPORT.md, PHASE_B1_PR.md. Checkpoint updates: README.md, AGENTS.md, docs/ARCHITECTURE.md, DECISIONS.md, DEVELOPMENT_STATUS.md, HOSTING_DECISION.md, RELEASE_CHECKLIST.md.
- PHASE_B1_REHEARSAL.json and evidence/b1/ contain exact commands/results, source hashes and fresh durability/recovery evidence. Complete changed-path list: evidence/b1/changed-files.json. Browser-generated M3 screenshots/performance and overwritten historical B.0 probe artifacts are restored, not committed as changes.

## D. Functional compatibility

Existing Chromium tests pass all four faults, normal/deterministic Random Failure, Start/Pause/Reset, independent browser contexts, engineering/FK display, computed evidence/hypotheses, Guided Demo/manual takeover/late-response cancellation, repair-note drafts, concurrency and paginated maintenance/history. No robot/rules/PRD or frontend product code changed. No observed P0/P1 navigation/layout blocker; Windows/FPS/accessibility certification remains unverified. Optional further visual polish is outside this deployment phase.

**Pre-existing acceptance gap:** B.1 explicitly lists data/report exports. Source audit finds no user-facing download/export control in merged V1 (no Blob/download/report exporter in frontend/src). API JSON and protected database backups are not that user-facing workflow. The approved PRD mentions maintenance ticket/report generation, which existing tickets cover, but B.1's explicit export check cannot be marked passing. No previously working export was removed. Adding this product workflow exceeds B.1's instruction to fix only confirmed deployment defects; it is reported for a bounded correction before release rather than silently added or claimed complete.

## E. PostgreSQL durability

228-test suite includes real PostgreSQL initialization/repeated migration/seed, full-size/Unicode evidence, immutable snapshots, FKs, transaction rollback, atomic budgets, version races and guided idempotency. Restricted-role SQL exercises full evidence/create/resolve/note/history and denies destructive/schema DDL. Production-shaped API restarts preserve full records; an actual database stop produces safe 503 then the **same API process** reconnects and returns identical evidence/notes/history. Incorrect SCRAM password returns safe 503; credentials absent from logs. Unknown schema rejects readiness and explicit migration without record change after restoring disposable fixture version. Existing two-process durability probe separately confirms 200/409 race, stable retries and API/database restart.

Trusted native archive restored into a fresh local disposable DB with identical fingerprints/counts for all nine tables; malformed archive rejected with complete destination unchanged. Existing JSON fixture validator remains fail-closed before destructive work, with rollback and legacy compatibility. Hosted restart/redeploy/Neon backups remain unexecuted. No real records migrated.

## F. Security

Existing distributed 2000 request/250 write/64 MiB snapshot daily defaults, body/field limits, storage high-water, pool/timeouts, seed protection, idempotency, concurrency and read-only remain intact. New hosted route/static controls and explicit non-owner grants are locally verified. No public destructive API, secret in frontend or new paid/security dependency. Global budgets can be exhausted and reads/readiness can consume transfer/compute even in read-only; no guaranteed anonymous availability or provider spending cap is claimed. Actual Free hard-stop and Planning risk acceptance are gates. If defensible anonymous shared writes cannot be established, Planning needs an architecture decision; no local-only/authentication fallback was implemented. See security/capacity policy.

## G. Performance and limits

Local production startup liveness 325–378 ms across five starts; **not Render cold wake**. API one-core affinity and 512 MiB virtual-address cap; Pg separately 512 MiB/one CPU. Observed API VmHWM 88432 KiB (~86.4 MiB), RSS 74944 KiB. Eleven single-pass full API cases: normal 8.247 ms/drop 6.119 ms, 2000 samples 183.081 ms, exact 2097152-byte input 216.338 ms, dense >2 MB response 230.475 ms, Unicode 221.092 ms. Unicode HTTP UTF-8 response 2026579 bytes; canonical ASCII stored snapshot is larger and reconstructs semantically equal. Native process CPU uses 10 ms ticks (0 means below resolution, not zero work), excludes PostgreSQL and is not billed host CPU. No truncation/narrowed accepted limits. Exact JSON and B.0 repeated measurement/growth evidence are linked in capacity policy; local profile does not establish actual Render headroom or shared CPU throughput.

## H. Cost

Neon official source: Free $0, 100 CU-hours/project/month, 1 GB/project/20 GB account, 5 GB transfer/project, forced five-minute suspension, short history/one manual snapshot; exceeding compute/transfer suspends, storage growth fails without deleting data. Render current Free/runtime/billing pages are blocked; card/hold, auto-upgrade, outbound/build/compute/transfer limits and actual account eligibility are unverified. Source/read-only checklist is explicit. No account/resource creation, card, billing, trial, paid service, public URL, deployment or production migration. No new spending action; actual account invoice totals unavailable and not certified. Complete-stack strict $0 cannot yet be established.

## I. Tests and exact commands

| Command | Actual result |
| --- | --- |
| `.venv/bin/python -m pytest backend/tests cloudflare/tests postgres/tests -q` baseline | 220 passed, zero failed/skipped, 51.35 s |
| Same full command after B.1 | 228 passed, zero failed/skipped, 52.04 s (97 native + 95 D1/shared + 36 real Pg); upstream Starlette/AnyIO deprecation warning |
| `npm --prefix frontend test` | 43 passed, zero failed/skipped, nine files |
| `PATH="$PWD/.venv/bin:$PATH" ./scripts/build-native.sh` | Existing pinned Python installation, locked npm install, TypeScript/production build passed; existing Three.js chunk >500 kB warning |
| `.venv/bin/python -m postgres.release_rehearsal` | Passed; invokes `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke`: 16 passed/zero failed/skipped, 2.6 min, actual Pg/restricted SCRAM/production frontend with resource limits |
| Same Chromium command, SQLite API:8000 + frontend Vite preview:5173 | 16 passed, zero failed/skipped (2.6 min) |
| `.venv/bin/python -m postgres.durability_probe` | Passed: two real APIs, shared complete records, API+DB restart, 200/409 concurrency, stable retry/content conflict and streamed 413 |
| `.venv/bin/python -m postgres.native_backup_probe` | Passed: all nine table fingerprints equal, malformed archive destination unchanged |
| `sh -n scripts/build-native.sh scripts/start-native.sh`; Python compileall; `git diff --check` | Passed |

D1 tests use `npm run d1:local`; CPython with genuine local D1, not actual Python/Wasm proof. No tests disabled. Browser acceptance uses explicit elevated **test-only** budgets so 200 history updates/repeats do not exhaust production defaults; quota tests verify unchanged production enforcement. Provider schema validation, actual TLS/Neon pooler and hosted tests remain unexecuted. Selected logs/results are in evidence/b1/.

## J. Hosted readiness

Production-shaped local runtime/configuration and a 23-step future-only runbook are ready for review. Public acceptance is not complete: missing export UI, current Render/runtime/Free terms, account/no-charge controls, real TLS/roles/pooler, hosted wake/RAM/CPU/outbound behavior, actual restart+redeploy persistence, backup destination and anonymous operations need the documented gates. Provisioning/publication/real-data operations need separate B.2 authorization. No resource or actual URL invented.

## K. GitHub

Branch feature/v1-hosting-phase-b1 targets main. Prepared body PHASE_B1_PR.md. Source commit `504d4e9` pushed successfully. The single `gh pr create` attempt failed with `Post "https://api.github.com/graphql": Forbidden`; no PR exists and no retry was made. Prepared body and comparison link are delivered for manual PR creation. No merge or deployment. Delivered final SHA and remote-head comparison are returned in chat; no self-referential commit hash is embedded in this file. Comparison: https://github.com/a5ura/MaintainAI_Robotics/compare/main...feature/v1-hosting-phase-b1

## L. Verdict

**TARGETED FIXES REQUIRED**

The deployment engineering is locally verified and independently reviewable. The explicit B.1 data/report export acceptance item is absent in the approved merged implementation and remains unverified/unimplemented; do not present a fully accepted V1 release candidate until it is resolved. This is a pre-existing product acceptance gap, not a new deployment regression. Provider/account/hosted gates separately remain necessary before any public release.

## M. Remaining work

Review this branch and issue a bounded correction for user-facing data/report exports (formats, complete evidence/history scope and automated download checks) without changing diagnostic algorithms or persistent schema. Complete the read-only Render/Neon account/Free/card/hold/hard-cap/build/outbound/backup checklist. Only after those checks and Planning risk acceptance seek separate B.2 resource/publication authorization, then execute the hosted runbook and return actual hosted evidence. Do not merge/deploy as part of B.1.
