# MaintainAI Robotics — Deployment Phase A Completion Report

Verification: November 1, 2026 UTC. Local/offline feasibility only. **V1 has not been publicly released.**

## A. Repository and environment

- Repository: `a5ura/MaintainAI_Robotics`; base `a33811f060d165ac5758966eda9be06e215d9171`, fetched merge of M3 PR #4, including acceptance fix `a9491d5`.
- Feature branch: `feature/v1-deployment-feasibility`, created from clean main; no user changes overwritten or main merge performed.
- Source implementation commit: `5868415d29c634d7437d64b6e939e26b42f91630` (shared API/domain + D1 adapter, tooling and tests). Documentation/evidence follows as a separate commit; final branch HEAD is returned in the final Git handoff rather than embedding a commit's own hash inside its contents.
- Actual execution: existing managed cloud Linux x86_64, `/workspace/MaintainAI_Robotics`, reported 5 CPUs/~34 GB RAM. Windows laptop/Codex Desktop execution is unverified; no Windows workload was started.
- Native Python 3.12.14; tool Python 3.13.5; Node 24.19.0; npm 11.9.0; Git 2.52.0; Wrangler 4.156.0/workerd package 1.20261023.1. Isolated workers-py 1.17.9, SDK 1.9.5, uv 0.13.6. CLI selected Wasm Python 3.14.2 for compatibility date October 30; downloading/selecting an interpreter is not app execution.

## B. Python Workers

- FastAPI support is officially documented. Proposed ASGI entry: `cloudflare/entry.py`, `Default = workers.asgi.entrypoint(app)`, reusing the shared API and D1-only dependency.
- Existing FastAPI 0.115.12 / Pydantic 2.11.4 pins retained. Exact compatible Wasm wheels, Pydantic initialization and Python/JS promise/array/result conversion remain **UNVERIFIED**. No valid Wasm lock was generated.
- Every shared endpoint/D1 dependency is async. Worker request imports exclude native sqlite3, filesystem persistence, native per-process limiter and local test transport. SQLite remains available through `backend.app`.
- Actual local Worker launch: **BLOCKED**, dependency compilation exit 2 before app import. Required `index.pyodide.org/314.0.7/workers-runtime-sdk/` request failed through the proxy; independent confirmation returned HTTP 403. No policy bypass or TLS weakening.
- Actual Wasm results for health, diagnose, equipment, list/create/detail/update tickets: **all unverified**, not skipped passes.
- Equivalent endpoint/validation/scenario behavior passed in CPython ASGI + genuine local D1. Real workerd Static Assets served every unchanged build file and SPA navigation; combined Python/asset routing is unverified.
- SDK inspection also identifies pre-ASGI request-body queue buffering; the application's body bound alone cannot establish early Wasm memory protection.

## C. D1 adapter

- One shared HTTP/domain contract, existing native SQLite adapter plus async `backend/d1_repository.py`; no second ticket algorithm, mock SQL or local-file fallback in Worker requests.
- Methods: schema/version check; explicit seed initialize; equipment; save diagnosis; list/create/detail/update ticket; shared budget reservation.
- Schema v1: equipment, full JSON diagnoses, tickets, history and request budgets, with FKs/indexes, immutable evidence trigger and transactional ticket/history triggers.
- Atomic create + initial history, atomic conditional update + associated history, D1 batch rollback and consistent detail reads tested with genuine local D1. No emulated BEGIN across calls.
- Existing stable UUID5 request-derived ticket IDs, changed-content 409, optimistic version conflicts, seed idempotency/recovery, UTC timestamps and chronological history preserved. Public cloud seed edits are protected; native SQLite behavior remains unchanged.
- **Incomplete for large evidence:** a valid dense payload yields 2,346,790 bytes of snapshot JSON, beyond D1's 2,000,000-byte row cap. Guard returns explicit 503 without truncation or partial persistence. Chunked immutable storage is still required for the full existing input range. Emulator acceptance of oversized rows was not treated as hosted proof.
- Disposable SQLite fixture export/import and D1 JSON backup/restore preserve full snapshots, public IDs, repair notes, histories and versions. No actual development/user records were migrated. Real larger migrations require a separately reviewed staged tool and authorization.
- Native SQLite regression: all 97 tests pass; unchanged native data path/requirements and development commands.

## D. Runtime feasibility

- [Raw measurements](PHASE_A_MEASUREMENTS.json), command `.venv/bin/python -m cloudflare.measure`: 10 synthetic payloads, 15 repetitions each; health, equipment, ticket list/detail, Guided Demo retry/create and update operations; 5 concurrent update pairs, all one 200 + one 409.
- Pure CPython validation/diagnosis median: 0.029 ms for one sample; 0.133–0.277 ms for typical scenarios/multi-anomaly; 50.971–52.409 ms for 2,000-sample/max-body; 79.767 ms for dense evidence. Wall-clock API measurements include CPython HTTP bridge overhead and are not deployed latency predictions.
- Dense-evidence API measurement returns the expected 503 for the storage gap; other measured endpoint cases succeed. The benchmark's snapshot budget is explicitly raised locally to observe large inputs.
- **Authoritative Worker CPU/Free 10 ms fit: UNVERIFIED.** CPython CPU and wall latency are not billed Cloudflare CPU. Max-payload costs warn of a substantial risk; no paid upgrade is an option.
- CPython process peak RSS 103,168 KiB across the benchmark; Wasm peak/128 MB fit unverified.
- Two local JS/D1 emulator starts: 1,379.919 and 1,160.546 ms wall readiness, not Python cold-start or startup CPU. Actual Python initialization/snapshot/hosted resource-limit errors unverified.
- Frontend build has five files; largest 3D JS chunk 843,839 bytes. Existing chunk warning remains; workerd asset serving verified locally. Windows physical GPU/performance unverified.

## E. Security and durability

- Anonymous public records remain intentionally shared; no login added. Parameterized SQL and existing validation/escaped UI remain. CORS is explicitly not authentication.
- Implemented D1-atomic daily global request/write/new-snapshot-byte reservations; defaults 2,000/250/2 MiB; tests cover concurrent reservation and separate ASGI instances. Rejected/invalid requests may consume reservations conservatively.
- `DEMO_READONLY=1` rejects writes before D1 access. Health/read paths, 2 MiB application body validation and seed protection tested. Public errors are sanitized and quota responses include retry guidance.
- Important limitations: health/rejected calls still consume platform resources; budgets can be exhausted by bots; read scans grow with retained records; the SDK buffers body chunks before ASGI middleware. Pre-ASGI size bounds, retention, large-data row counts, operator controls and hosted abuse resilience remain release gates.
- Local restore rolls back on invalid references and preserves all evidence/history; seed recovery preserves visitor work. Local emulator stop/restart preserves version 2, three history events, repair note, complete diagnosis and quota counter; see [restart evidence](PHASE_A_RECOVERY.json).
- Hosted browser sharing, Worker redeployment, inactivity guarantees and Time Travel recovery: **UNVERIFIED**. Local files do not prove hosted durability. No public delete/reset or production migration endpoint exists.
- If dependable anonymous shared writes cannot fit verified $0 limits, propose a read-only shared demonstration with bounded local interaction for Planning approval; no requirement was silently changed.

## F. Costs

- Documented Free: Workers 100k requests/day, 10 ms CPU, 128 MB; static assets free/unlimited requests; D1 5M rows read/day, 100k written/day, 500 MB/database, 5 GB/account, 10 databases, 50 calls/invocation (batch counts as one), 7-day Time Travel. Current sources/dates and caveats: [feasibility](FREE_TIER_FEASIBILITY.md).
- Account plan, card requirements, eligibility, existing paid settings, actual quotas and invoices: **UNVERIFIED**; provider identities/secrets were not configured. Public documentation is not account evidence.
- No provider service/resource, billing enrollment, trial, API credit purchase, new paid compute, remote database or deployment activated. Only existing authorized compute and local/public tooling were used. No independently verified account spending total is claimed.
- Practical model: 20 visitors/day, 100 mutations + 160 reads + 20 health calls, ~0.6 MB/day payload growth before indexes. Anonymous abuse and retained-data scans can exhaust Free quotas; defaults do not prove dependable public availability.

## G. Testing

Exact commands/evidence categories and earlier failures: [verification artifact](PHASE_A_VERIFICATION.json).

| Check | Actual result |
|---|---|
| Baseline backend / frontend / build / SQLite Chromium | 97 / 39 / pass / 15 passed |
| `.venv/bin/python -m pytest backend/tests -q` | **97 passed** |
| `npm --prefix frontend test` | **39 passed** |
| `npm --prefix frontend run build` | **TypeScript + production build passed** |
| `.venv/bin/python -m pytest cloudflare/tests -q` | **44 passed**, no skips; real local D1 SQL and Static Assets |
| `.venv/bin/python -m cloudflare.restart_probe` | **Passed**, actual local emulator termination/restart |
| `.venv/bin/python -m cloudflare.measure` | **Completed**, expected dense-snapshot 503 recorded |
| `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke` | **15 passed (2.6m)** against CPython + genuine local D1 |
| `npm run worker:local` with isolated tools | **Blocked before app initialization**, resolver exit 2 |

Chromium covers all four faults, Random Failure determinism, independent sessions, Guided Demo live/skip/reset/retry, overlays/picking, ticket lifecycle/conflict recovery and pending automatic-save/manual takeover regressions. Existing upstream Starlette/AnyIO deprecation, Node color warning and large 3D chunk warning remain. An initial sandboxed TestClient run stalled before output; it was stopped and the complete suite passed outside socket restrictions. Early new-test syntax/JSON tuple-list expectation errors were corrected before final passing runs. No failing tests were hidden or removed; the actual Python runtime and hosted checks remain explicitly unverified. Generated M3 screenshots/timings were restored to avoid unrelated changes.

## H. GitHub

- Source commit pushed: `5868415d29c634d7437d64b6e939e26b42f91630`; documentation/evidence committed separately with final HEAD reported in the completion message.
- Automated creation attempted with `gh pr create --repo a5ura/MaintainAI_Robotics --base main --head feature/v1-deployment-feasibility --title "Evaluate Cloudflare Python Workers and D1 feasibility" --body-file /tmp/phase-a-pr-body.md`.
- Result: exit 1, `Post "https://api.github.com/graphql": Forbidden`. **No Phase A PR was created or confirmed.** Git push access succeeded independently; it does not establish API access.
- [Create/review PR targeting main](https://github.com/a5ura/MaintainAI_Robotics/compare/main...feature/v1-deployment-feasibility?expand=1).
- Prepared exact body: [DEPLOYMENT_PHASE_A_PR.md](DEPLOYMENT_PHASE_A_PR.md). Suggested title: **Evaluate Cloudflare Python Workers and D1 feasibility**.
- No merge, hosted publication or environment configuration publication was performed.

Files changed: native API/repository boundary; new shared domain/schemas/async API and D1 adapter; Cloudflare entry/policy/schema/local test/recovery/measurement tools and tests; pinned root npm/Python tooling and two local configs; the six required Phase A documents, raw JSON evidence, prepared PR body and README/AGENTS/architecture/decisions/status/hosting/release updates. Approved `docs/PRD.md`, frontend code/manifests, backend requirements/diagnostic algorithms, Project 1 and V2 are unchanged. No automatic merge.

## I. Feasibility decision

**CONDITIONAL GO.** Local D1 atomicity, concurrency, idempotency, small full evidence, recovery and unchanged browser behavior are promising. Actual Python/Wasm initialization and binding interop, authoritative Free CPU/memory, complete oversized-evidence storage, pre-ASGI upload bounds, sustained anonymous availability and account-specific cost/durability evidence remain missing. This is approval to consider the smallest next technical investigation, not permission to deploy or a claim that the full D1 adapter is production-complete.

## J. Next recommended action

Authorize/enable access to the required official Pyodide package index in the existing development environment, without a paid resource or proxy bypass. Re-run the pinned actual Python Worker locally, exercise every endpoint against its D1 binding and measure authoritative CPU/memory where available. If local tooling cannot expose billed CPU, keep that gate unverified rather than infer it from wall time.

Before any public decision, separately complete and test immutable chunked snapshot storage and pre-ASGI streamed body limits against the full input range; investigate large retained-data row scans and retention. Then perform a read-only Free-only account/eligibility/billing review. Hosted provisioning, publication and real data migration remain separately gated by Planning and explicit Phase B authorization. If actual Free limits fail, return a researched $0 alternative/fallback decision to Planning; do not purchase capacity.
