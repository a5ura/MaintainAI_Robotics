# MaintainAI Robotics — Project 2 V1

## Current Phase B.1 checkpoint — November 1, 2026 (America/New_York)

B.0 PR #8 is merged at `8d39f2af9dee9a1d21d658950ddb15a228651848`. B.1 branch `feature/v1-hosting-phase-b1` prepares one same-origin Render Free Python service plus external Neon Free: production frontend build, hosted route/static/CORS hardening, restricted runtime SQL and constrained real PostgreSQL rehearsal. SQLite/D1, PRD, robot and diagnostic algorithms remain intact. See [B.1 setup](docs/DEPLOYMENT_PHASE_B1.md), [completion](docs/PHASE_B1_COMPLETION_REPORT.md) and future-only [B.2 runbook](docs/PHASE_B1_HOSTED_RUNBOOK.md).

No user-facing data/report download exports exist in merged V1; this B.1-listed workflow is an explicit pre-existing acceptance gap, not a passing check. Keep it open for a bounded correction before public release. Render current Free/runtime terms and all account/card/hard-cap eligibility remain unverified. No provisioning, billing, deployment, production migration, environment publication or merge. Hosted verification requires separate B.2 authorization; anonymous availability cannot be guaranteed by global quotas. Earlier checkpoint text below is historical.

## Historical Phase B.0 checkpoint — November 1, 2026 UTC

Main includes merged A.2 PR #7 at `8b8491035cfcf388378376dd8b9b2e649dcfed94`. Branch `feature/v1-hosting-phase-b0` adds a native async Psycopg/PostgreSQL adapter and explicit FastAPI hosting entry point while preserving SQLite, D1, diagnostic algorithms and the approved PRD. Real local PostgreSQL integration, independent API/process/database restart, immutable full evidence, concurrency, idempotency and protected backup/recovery are tested in managed Linux. Desktop/Windows and hosted durability remain unverified. See [B.0 setup](docs/DEPLOYMENT_PHASE_B0.md), [adapter](docs/POSTGRESQL_ADAPTER.md), [hosting gates](docs/PHASE_B0_HOSTING_DECISION.md) and [completion report](docs/PHASE_B0_COMPLETION_REPORT.md).

Render Free + Neon Free + free static hosting is provisional: Render current terms and all account-level Free/card/automatic-billing eligibility remain unverified. No public deployment, provisioning, billing activation, real-record migration, environment publication or merge is authorized/performed. No new Cloudflare/Pyodide access route was attempted. Anonymous quotas and a storage high-water guard do not guarantee permanent availability; release still requires provider/account, abuse, backup and hosted verification. Earlier checkpoint text below is historical.

## Historical Phase A.2 checkpoint — November 1, 2026 UTC

Phase A.1 PR #6 is verified merged at `966c809`. Phase A.2 explicitly authorizes local storage hardening despite the unchanged index CONNECT 403, superseding A.1's deferred-expansion gate for this assignment. New D1 schema v2 provides atomic immutable manifest/chunks, verified reconstruction and quota charging; the large-evidence row-size defect is resolved locally. Default snapshot allowance is now 64 MiB/day including conservative logical overhead. Cached counts, indexed 200-record ticket/history pages and UI continuation preserve drafts and the native SQLite workflow. Legacy inline evidence and synthetic migration/backup/restart remain supported.

Actual Python Workers/JS binding execution, billed CPU/memory, pre-ASGI streamed body enforcement, account Free-only terms and hosted durability remain unverified. The total 500 MB Free storage/retention and anonymous availability gates are not solved by a daily budget. No deployment, resource provisioning, billing, real-record migration, environment publication or merge. Current evidence: [A.2 report](docs/PHASE_A2_COMPLETION_REPORT.md) and [details](docs/DEPLOYMENT_PHASE_A2.md). Earlier checkpoint statements below are historical, including the previous single-row restriction and 2 MiB/day default.


Read `docs/PRD.md` (full approved October 31, 2026 handoff), `docs/DEVELOPMENT_STATUS.md`, and the assigned milestone before editing. Project 1 (`a5ura/MaintainAI`) is separate. V2 is deferred. Planning owns scope; Coding returns implementation evidence.

- Exactly $0 incremental spending. Do not enable billing, paid APIs, credits, hosting, or infrastructure. Use available included tooling; report exhausted allowances.
- Record actual execution location; Desktop does not imply cloud. Keep laptop workloads modest. No ROS, physics engine, GPU dependency, or LLM is needed.
- Preserve user work. Use the existing isolated checkout; no new worktree unless requested. Use feature branches, meaningful commits, reviewable PRs. Never merge without user instruction.
- Synthetic inputs are allowed; compute diagnoses from evidence. Distinguish observations, hypotheses, actions; no calibrated-probability claims.
- FK, rendered transforms, joint values, and telemetry must agree. Preserve deterministic replay and independent browser sessions.
- Run `python -m pytest backend/tests -q`, `npm --prefix frontend test`, and `npm --prefix frontend run build`. Run the documented real browser smoke check after integrated changes. Report exact results; do not claim checks that did not run.
- Do not claim hosting, shared persistence, PR creation, Desktop execution, or zero account cost without verification. Keep full later-V1 requirements in PRD/status.

## Milestone 2 implementation boundaries

- Backend rules live in `backend/diagnostics.py` and `backend/rules.py`; API schemas in `models.py`. Keep scenario labels out of rule decisions.
- `Repository` is the local SQLite adapter. Keep transactions, foreign keys, immutable diagnosis snapshots, and optimistic ticket versions. Tests must use temporary database paths/dependency overrides; never development records.
- Default DB is ignored `data/maintainai.sqlite3`; `MAINTAINAI_DB_PATH` overrides it. Local durable data does not complete hosted shared persistence.
- `fixtures/scenarios.json` is the frontend/backend contract. Regenerate with the existing esbuild CLI from `src/scenarios.ts` when evidence generation intentionally changes, then run both language suites.
- Random seed selection is per browser; debug scenario/seed appear in run context and diagnosis-linked ticket descriptions. No global active robot session.
- No M3 deployment, cloud storage, full Guided Demo, overlays, or V2 work without a new assignment.

## Milestone 3 experience and release gate

- M3 is authorized by its bounded assignment: preserve interactive default, real backend guidance, optional engineering tools and no automatic Git merge.
- Guide state/reducer and effect orchestration are separate; do not fabricate a result for Skip to Results. Cancel old UI sequences on reset/takeover; submitted writes may complete and must use stable retry IDs.
- Engineering positions, transforms and path derive from the existing joint model. Keep overlays off by default, keyboard equivalents for 3D picking, on-demand rendering and independent FK tests.
- `MAINTAINAI_PUBLIC_DEMO=1` enables only a per-process write budget, not production security. Tests must use temporary DBs; retention is dry-run unless explicitly applied with a fresh backup.
- Public hosting is gated by `docs/HOSTING_DECISION.md` and `docs/RELEASE_CHECKLIST.md`. No provider was provisioned. Do not equate local SQLite restart tests with hosted redeploy durability or assume a free-tier label proves no billing risk.


## Deployment Phase A boundaries

- Phase A authorizes local/offline Cloudflare feasibility only, from merged M3 PR #4 at `a33811f`. Keep approved PRD, frontend product behavior, Project 1 and V2 unchanged. Never provision, deploy, activate billing, migrate real records, publish the environment or merge without a new instruction.
- Read `docs/DEPLOYMENT_PHASE_A.md` and its report before extending the prototype. Root tooling is isolated from frontend/native dependency manifests. Keep all Wrangler commands local and identifiers placeholders.
- Shared domain/HTTP code serves SQLite and async D1. No native sqlite3/filesystem/threadpool fallback in Workers. Preserve atomic history, snapshots, concurrency and Guided Demo IDs.
- `cloudflare/d1_bridge.mjs`, local API, schema/recovery/measurement runners and tests are disposable loopback-only tools. Never deploy the SQL bridge; tests clear synthetic emulated tables, not `data/`.
- Report CPython+real emulated D1 separately from actual Python Workers/Wasm and hosted D1. Package resolution is blocked, so JS interop/CPU/memory/startup remain unverified. Single-row D1 snapshots cannot cover all accepted inputs; never truncate evidence or silently reduce V1 requirements.
- Run native/backend/frontend/build/browser regressions and the documented local D1 contracts sequentially against disposable state. Account costs, abuse resilience, pre-ASGI upload bounds and hosted redeploy durability remain release gates.


## Phase A.1 runtime-first checkpoint

Phase A PR #5 is verified merged at `e940a83`. A dependency-free official-pattern Worker reproduces the package-index CONNECT 403 before app initialization; supported offline CLI resolution also lacks the required SDK cache. Runtime and billed resources remain unverified. Under the assignment's blocked-index gate, storage chunking, pre-ASGI enforcement and retained-data changes are deferred. No environment configuration, hosted resource, billing, production data or deployment was changed. Current evidence and exact next experiment: [Phase A.1 report](docs/PHASE_A1_COMPLETION_REPORT.md).
