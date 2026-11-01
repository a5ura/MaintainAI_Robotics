# Phase B.0 completion report

## A. Baseline and repository

Verified `origin/main` includes merged PR #7 at `8b8491035cfcf388378376dd8b9b2e649dcfed94`, including P2 restore fix `1981590`. Branch: `feature/v1-hosting-phase-b0`, from a clean baseline. Existing managed Linux x86_64 workspace; not Windows/Desktop. Python 3.12.14, Node 24.19.0, npm 11.9, Git 2.52.0, Docker 28.4.0, actual PostgreSQL 17.11. Final revision is the delivered branch head; exact delivery SHA is recorded in the final response and can be obtained with `git rev-parse HEAD` (avoids self-referential commit hashes inside this report).

## B. Hosting recommendation

Provisional Render Free native FastAPI + Neon Free PostgreSQL + free static Pages, alternatively same-origin static serving after build verification. Neon official-source Free limits are documented; Render/Vercel pricing pages are proxy-blocked, all user-account/card/billing eligibility is unverified. Vercel native Python is a conditional second candidate, not a verified free stack. Render local disk/expiring Free database are excluded. Existing Workers/D1 remains conditional, with no renewed blocked-index attempt. See PHASE_B0_HOSTING_DECISION.md for exact sources and read-only gates.

## C. PostgreSQL implementation

Shared async maintenance SQL extracted from D1; new PostgreSQL repository, Psycopg driver, explicit schema migration/seed and FastAPI factory. SQL schema includes immutable evidence manifests/chunks, stable IDs, versioned history, FKs, distributed budgets, counts and keyset indexes. READ COMMITTED mutation transactions and REPEATABLE READ detail snapshots; pool limits and finite timeouts. No process-local correctness lock, ORM rewrite, duplicate diagnostic engine or SQLite fallback. Existing SQLite/D1 and approved public contracts remain supported. See POSTGRESQL_ADAPTER.md for files and interfaces.

## D. Data integrity

Real database tests cover one winner for concurrent expected versions, atomic history and snapshot/quota rollback, guided idempotency/content conflicts, complete evidence, corruption-safe errors, immutable evidence, stable identifiers, UTC fields, repeated seed/migrations and unknown schema rejection. Restricted runtime role works without DELETE/DDL. Existing A.2 backup validator and all 95 D1/shared regressions remain intact. PRD, diagnostic rules and robot model are unchanged.

## E. Durability

Two real Uvicorn processes share records; full diagnosis/ticket/history survives API and PostgreSQL container restart. Native archive restoration into a fresh disposable database compares all nine table fingerprints; malformed archive preserves destination. Fail-closed synthetic JSON restore compares full before/after exports, including injected transaction failure and repeated valid restore. All data synthetic. Hosted redeploy/storage/backup behavior and account durability remain unverified. See PHASE_B0_DURABILITY_REPORT.md and JSON artifacts.

## F. Hosting configuration

Review-only render.yaml and start-native.sh use explicit Pg factory, host PORT, one worker, bounded concurrency and no automatic deployment/migrations. Server-only DATABASE_URL; explicit hosted HTTPS origins; remote CA/hostname checking and preserved channel binding. Liveness avoids DB work; readiness checks schema. Optional built SPA same-origin routing is tested; separate public API URL/timeout examples and SPA redirect supplied. Network/wake failures explain manual retry without automatically replaying mutations. Migration and runtime role steps are explicit in DEPLOYMENT_PHASE_B0.md; no hosted procedure was executed.

## G. Security and anonymous access

Atomic distributed 2,000 request/250 write/64 MiB snapshot daily defaults, pre-JSON streamed body cap, seed protection, emergency read-only, bounded pagination/pool, sanitized errors, immutable snapshots, optimistic updates and no destructive public endpoints. Writes stop at a 512 MiB physical database high-water mark; this guard is not a strict allocation/retention/account-wide bound. Global quotas are exhaustible by attackers and do not guarantee availability. Health/readiness/provider traffic and monthly transfer require verification. Free provider-level controls/retention/backup policy remain release gates. A read-only fallback requires Planning approval and was not silently substituted. See PHASE_B0_SECURITY.md.

## H. Local performance

Eleven payload cases, five repeats each. Normal full API median 6.176 ms, drop 5.913 ms; 2,000-sample median 199.572 ms, exact 2 MiB request 207.408 ms, dense evidence 236.274 ms, Unicode 238.974 ms (maximum 253.574 ms). Unicode snapshot 2,826,579 bytes, complete and untruncated. Normal diagnostic Python CPU median 0.322 ms; maximum case medians 53–84 ms. DB reconstruction 0.8–22 ms; API create/retry median 7.473 ms, update 8.229 ms. Peak observed API RSS high-water 84,972 KiB (~83 MiB), current 80,416 KiB; two observed DB connections, maximum four configured per API. API was not OS memory-capped; separate Pg container was 512 MiB/one CPU. Native CPU tick values exclude PostgreSQL and are not billed Worker CPU.

7,500 retained tickets, indexed 200-record pages and 1,001 history events across six pages verified. Five concurrent reads took 10.971 ms. Full-API repetitions reuse stable diagnosis IDs (first insert, then idempotent evidence verification); separate fresh-ID database insert timings exclude HTTP and diagnosis compute. Fresh synthetic evidence inserts measured 1.612–117.616 ms (one sample/case). Exact query plans, database growth and per-case timings are in PHASE_B0_MEASUREMENTS.json. Synthetic compression/loopback timings cannot predict shared free-host memory, CPU, network or hosted cold starts. Local API readiness startup 326–356 ms only. Maximum allowed inputs were preserved; hosted resource headroom remains a gate.

## I. Cost

Only existing authorized tools, local open-source packages, disposable local infrastructure and synthetic data used. No provider accounts/resources, paid services/trials, payment methods, billing changes, deployments or real migrations. No new spending action was taken; actual account/billing totals were not available and are not certified. Neon documented $0 and caps do not prove complete-stack or account eligibility. Read-only card/hold/automatic-upgrade/hard-suspension verification remains mandatory before any resource action. Illustrative usage and capacity assumptions are in the hosting decision, not a guaranteed bill.

## J. Testing

Baseline: 97 native backend, 95 D1/shared, 41 frontend tests and TypeScript/production build passed.

| Exact final command | Result |
| --- | --- |
| `.venv/bin/python -m pytest backend/tests cloudflare/tests postgres/tests -q` | 220 passed, 0 failed/skipped (97 native + 95 D1/shared + 28 real PostgreSQL), 50.57 seconds; upstream Starlette/AnyIO deprecation warning |
| `npm --prefix frontend test` | 43 passed, 0 failed/skipped, nine files |
| `npm --prefix frontend run build` | TypeScript and production build passed; existing >500 kB Three.js bundle warning |
| `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke` — same-origin PostgreSQL | 16 passed, 0 failed/skipped (2.6 minutes) |
| Same Chromium command — SQLite API:8000 + Vite preview:5173 | 16 passed, 0 failed/skipped (2.6 minutes) |
| `.venv/bin/python -m postgres.durability_probe` | Passed: two processes, API restart, DB container restart, 200/409 race, idempotency and 413 streamed body |
| `.venv/bin/python -m postgres.native_backup_probe` | Passed: full nine-table native round trip and malformed destination preservation |
| `.venv/bin/python -m postgres.measure 53694` | Passed: 11×5 payloads, 7,500 tickets, 1,001 history events, full request metrics |
| `docker compose -f postgres/compose.yaml config --quiet` | Passed; no resources provisioned by validation |
| `sh -n scripts/start-native.sh` and `git diff --check` | Passed |

Existing local D1 ran via `npm run d1:local` against disposable emulated data. Browser PostgreSQL run uses test-only daily writes=2,000/requests=10,000 so repeated automated pagination does not exhaust production defaults. Production quota behavior is separately tested unchanged. Initial sandboxed loopback/Chromium launch was denied; authorized unrestricted local tests were used. One rerun reused counters and correctly hit 429; fixtures were reset and the complete suite rerun. An earlier D1 run was interrupted by a concurrent asset build and passed sequentially with stable assets. The first SQLite preview command used the repository root and returned 404; it was corrected to run from frontend/ and the complete suite rerun. No tests were removed/disabled. Hosted tests were not run. Machine-readable evidence and selected full logs are under evidence/b0/.

## K. GitHub

Branch: `feature/v1-hosting-phase-b0`; target main. Source groups: shared async/D1 boundary; PostgreSQL adapter, migration/driver/local/testing/probes; hosting entry point/manifest/script; frontend network configuration/tests/SPA fallback; B.0 documentation/evidence and current checkpoint links. Prepared body: PHASE_B0_PR.md. The feature branch was pushed successfully. The one PR creation attempt failed with `Post "https://api.github.com/graphql": Forbidden`; no PR was created and no GraphQL retry was made. Prepared PR body and comparison link are delivered for manual creation. Source commit: `dc163c2`; documentation/evidence follow in a separate focused commit.

No merge or deployment performed. Exact final SHA and pushed-head verification are returned with delivery. Comparison: https://github.com/a5ura/MaintainAI_Robotics/compare/main...feature/v1-hosting-phase-b0

## L. Verdict

**APPROVE FOR INDEPENDENT REVIEW**

Local native Python/PostgreSQL behavior is implemented and sufficiently tested for technical review. This is not public release approval; account eligibility, complete-stack $0 terms, hosted resources/cold wake/durability and anonymous operations remain explicit gates.

## M. Exact next action

Review this branch independently against the approved PRD and B.0 acceptance criteria. If accepted, Planning completes the read-only provider/account Free/card/hard-cap checklist before requesting separate authorization for hosted verification. Do not provision, merge or deploy as part of this phase.
