# MaintainAI Robotics

## Current Guided Demo checkpoint — November 16, 2026 (America/New_York)

Verified main `512b6ad216ec79253fcfdd00fd3c3e584a4e8a26` includes UI-01–03 and GD-02B-1–5 through merged PR #21. The six-stage Guided Demo uses the actual deterministic Dropped Object scenario, seed 42, and backend-computed evidence. **Manual is the default**; optional Automatic mode waits for readiness plus four seconds and never creates a ticket. Maintenance creation requires a separate explicit confirmation.

GD-02B-5 assessed the application as conditionally ready for a controlled Manual recruiter demonstration; native Windows voice/GPU and screen-reader acceptance remain untested. GD-02C-1 addresses guidance/onboarding/control presentation for review; it does not authorize deployment or change persistence. See [acceptance report](docs/GD02B5_FINAL_ACCEPTANCE_REPORT.md), [polish report](docs/GD02C1_COMPLETION_REPORT.md), and [current development status](docs/DEVELOPMENT_STATUS.md). The dated checkpoints below are historical, including their original blockers and authorizations. Existing hosting/billing/backup gates remain in force.

## Historical pre-B.2 checkpoint — November 11, 2026 (America/New_York)

PRs #1–9 are merged. Verified `origin/main` baseline: `a915cae8cae3b6fd4deb46f2b9c7729f41ebafa4` (PR #9), including saved per-ticket JSON/Markdown exports in `1f972b0`. Complete evidence/history, captured-version checks and draft preservation are implemented; see [export acceptance](docs/TICKET_EXPORTS_ACCEPTANCE.md). Earlier statements that exports are missing or PR #9 is unmerged describe historical checkpoints.

The authorized pre-B.2 correction uses environment-neutral demo/shared-record copy, preserving simulated-input/computed-result disclosure, and sets the initial Render manifest to `DEMO_READONLY=1`. It does not claim that a build proves hosting or durability. Runtime algorithms, schemas, SQLite/D1/PostgreSQL and existing workflows are unchanged. See [correction evidence](docs/PRE_B2_RELEASE_READINESS.md).

Official Render/Neon documentation is now readable through web lookup; the dated [hosting checklist](docs/PHASE_B1_HOSTING_VERIFICATION.md) supersedes the earlier public-document access blocker. Actual account eligibility, card/hold/billing/overage controls, protected backup storage and hosted build/wake/TLS/redeploy durability remain unverified. **B.2 provisioning/deployment: NO-GO pending those gates, independent review and separate authorization.** No hosting resources, billing, deployment, data migration or merge is authorized in this correction. Strict $0 and V2 deferral remain unchanged.

## Historical Phase B.1 checkpoint — November 1, 2026 (America/New_York)

B.0 PR #8 is merged at `8d39f2af9dee9a1d21d658950ddb15a228651848`. B.1 branch `feature/v1-hosting-phase-b1` prepares one same-origin Render Free Python service plus external Neon Free: production frontend build, hosted route/static/CORS hardening, restricted runtime SQL and constrained real PostgreSQL rehearsal. SQLite/D1, PRD, robot and diagnostic algorithms remain intact. See [B.1 setup](docs/DEPLOYMENT_PHASE_B1.md), [completion](docs/PHASE_B1_COMPLETION_REPORT.md) and future-only [B.2 runbook](docs/PHASE_B1_HOSTED_RUNBOOK.md).

Authorized PR #9 follow-up implements per-ticket saved JSON/Markdown downloads, complete validated history pagination, captured-version checks and draft preservation. See [export acceptance](docs/TICKET_EXPORTS_ACCEPTANCE.md) for local checks and limits. The previously missing download workflow is now implemented; public-release approval remains separate. Render current Free/runtime terms and all account/card/hard-cap eligibility remain unverified. No provisioning, billing, deployment, production migration, environment publication or merge. Hosted verification requires separate B.2 authorization; anonymous availability cannot be guaranteed by global quotas. Earlier checkpoint text below is historical.

## Historical Phase B.0 checkpoint — November 1, 2026 UTC

Main includes merged A.2 PR #7 at `8b8491035cfcf388378376dd8b9b2e649dcfed94`. Branch `feature/v1-hosting-phase-b0` adds a native async Psycopg/PostgreSQL adapter and explicit FastAPI hosting entry point while preserving SQLite, D1, diagnostic algorithms and the approved PRD. Real local PostgreSQL integration, independent API/process/database restart, immutable full evidence, concurrency, idempotency and protected backup/recovery are tested in managed Linux. Desktop/Windows and hosted durability remain unverified. See [B.0 setup](docs/DEPLOYMENT_PHASE_B0.md), [adapter](docs/POSTGRESQL_ADAPTER.md), [hosting gates](docs/PHASE_B0_HOSTING_DECISION.md) and [completion report](docs/PHASE_B0_COMPLETION_REPORT.md).

Render Free + Neon Free + free static hosting is provisional: Render current terms and all account-level Free/card/automatic-billing eligibility remain unverified. No public deployment, provisioning, billing activation, real-record migration, environment publication or merge is authorized/performed. No new Cloudflare/Pyodide access route was attempted. Anonymous quotas and a storage high-water guard do not guarantee permanent availability; release still requires provider/account, abuse, backup and hosted verification. Earlier checkpoint text below is historical.

## Historical Phase A.2 checkpoint — November 1, 2026 UTC

Phase A.1 PR #6 is verified merged at `966c809`. Phase A.2 explicitly authorizes local storage hardening despite the unchanged index CONNECT 403, superseding A.1's deferred-expansion gate for this assignment. New D1 schema v2 provides atomic immutable manifest/chunks, verified reconstruction and quota charging; the large-evidence row-size defect is resolved locally. Default snapshot allowance is now 64 MiB/day including conservative logical overhead. Cached counts, indexed 200-record ticket/history pages and UI continuation preserve drafts and the native SQLite workflow. Legacy inline evidence and synthetic migration/backup/restart remain supported.

Actual Python Workers/JS binding execution, billed CPU/memory, pre-ASGI streamed body enforcement, account Free-only terms and hosted durability remain unverified. The total 500 MB Free storage/retention and anonymous availability gates are not solved by a daily budget. No deployment, resource provisioning, billing, real-record migration, environment publication or merge. Current evidence: [A.2 report](docs/PHASE_A2_COMPLETION_REPORT.md) and [details](docs/DEPLOYMENT_PHASE_A2.md). Earlier checkpoint statements below are historical, including the previous single-row restriction and 2 MiB/day default.


Evidence-driven investigation of a simulated three-joint robot: four failure scenarios, reproducible Random Failure, six-stage Guided Demo, optional model-derived engineering tools, and diagnosis-linked maintenance records with JSON/Markdown exports. No paid API or dedicated GPU is required. Local operation does not establish hosted durability.

## Run locally

Prerequisites: Python 3.12+, Node.js 22+ and npm, Git. Validated on Linux / Python 3.12.14 / Node 24.19.0; Windows commands below are provided but have not been executed on Windows.

From repository root, create an isolated Python environment:

```sh
python -m venv .venv
# Linux/macOS:
.venv/bin/python -m pip install -r backend/requirements.lock
.venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

On Windows PowerShell, use these commands instead of the two `.venv/bin` commands:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock
.\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

In a second terminal, from repository root:

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open the Vite address printed in the terminal (port 5173). Frontend `/api` requests proxy to FastAPI on port 8000. Keep both terminals running. Stop with Ctrl+C. These are development services, not public hosting. Backend OpenAPI is available on its `/docs` route.

## Database configuration

SQLite initializes/seeds idempotently on first API access. Default: `data/maintainai.sqlite3`, ignored by Git. Records survive backend restarts while that file is retained. To choose another file, set `MAINTAINAI_DB_PATH` **before** starting the backend:

```sh
export MAINTAINAI_DB_PATH=/absolute/path/maintainai.sqlite3
```

```powershell
$env:MAINTAINAI_DB_PATH = 'C:\path\maintainai.sqlite3'
```

Use a local writable path. No external database account is needed. Equipment, tickets, history and immutable diagnostic evidence are shared by visitors of this backend; they are not private. This does **not** satisfy V1 hosted shared storage or prove cloud durability. Back up the file while the backend is stopped; do not commit or casually delete it. Schema is v1; newer unsupported versions are refused rather than overwritten.

## Guided experience and engineering tools

Interactive simulation is the initial workspace. **Start Guided Demo** selects Dropped Object, seed 42, in **Manual** playback. Use the highlighted **Walkthrough controls** link to find Next, Previous, Pause/Resume, Reset demo and Exit walkthrough. Next respects readiness; Previous revisits explanations without rewinding the robot or repeating diagnosis. During the walkthrough, **Start manually (exit walkthrough)** leaves guide ownership and resumes the existing manual simulation; it is not the guide's Next action. The simulation Pause control pauses the active guide; simulation Reset exits and resets the run.

The six stages are **Introduction → Robot Operation → Fault Detection → Evidence Investigation → Diagnosis and Next Checks → Maintenance Handoff**. Optional **Automatic** playback advances only after each stage is ready plus the existing four-second dwell, independently of speech completion. Long narration may be interrupted; Manual is recommended for a first-time recruiter presentation. Mute/Replay and readable captions remain available, with text-only fallback when local speech is unavailable. There is no Skip control.

Stage 6 previews the actual diagnosis and proposed ticket. **Create maintenance ticket** opens confirmation; only **Confirm ticket creation** sends the persistent-record request. Cancel, Escape, reaching Stage 6, playback, narration and navigation never create a ticket. After confirmed success, **View saved ticket** opens the linked maintenance record; no repair or physical verification is claimed. The separate Diagnostics handoff still opens the existing manual maintenance form.

A confirmed request can finish after navigation or exit. Pending/uncertain attempts retain their UUID and immutable payload across in-app navigation and new walkthroughs in the same page session. Review and explicitly reconcile an uncertain request using that same identity; do not assume a network error means no ticket was saved. Reload recovery is deferred, separate tabs/UUIDs are not globally deduplicated, and access/quota policy can block reconciliation. Use synthetic information only. Starting another tour is not a recovery for an unresolved attempt.

**Advanced Engineering View** is off by default. Enable joint angles, frames, executed TCP path or transforms individually. Click a robot component or use the named component buttons with the keyboard to inspect axes/live values and linked evidence. No IK/physics engine or hardware is involved.

## Demo walkthrough

1. Start the default Valid cycle. Pause/resume if desired. At 12 cycle seconds, target verification produces a normal backend result.
2. Reset. Select Dropped object. Start. At 6 cycle seconds, vacuum magnitude falls and object presence is lost despite a HOLD command; the object visibly falls.
3. At completion, review the computed diagnosis, observations, evidence references, and cause-specific operator checks. Expand other hypotheses. Inspect the timestamped timeline.
4. Reset and select Positioning error: independent placement is offset while robot FK remains coherent. Vision failure instead marks verification unavailable while the object remains present. Unexpected robot stop physically freezes the arm at 6 seconds; later checkpoints are not reached.
5. Select Random failure and set an explicit seed. Its resolved scenario is displayed; reset/replay retains the seed and reproduces evidence. Seed/context are copied into diagnosis-linked ticket descriptions.
6. Outside Guided Demo, the completed Diagnostics **Create maintenance ticket** action opens the manual form; select equipment and submit explicitly. Within Guided Demo, use the Stage 6 preview and separate confirmation instead. Inspect the saved evidence snapshot; add operator/repair notes, mark In Progress, then resolve with resolution notes. Maintenance navigation also supports manual tickets and seeded historical incidents. Stale edits require a reload rather than silently replacing another operator's changes.
7. Reset for a reproducible new run. Scenario selection is locked during a run. Each browser owns its own clock; backend requests are stateless.

All sensor, event, and verification inputs are simulated. FK, transforms, evidence correlation, fault detection, and hypothesis ranking are computed. Vacuum threshold is a demonstration parameter, not a validated robot safety threshold. Hypotheses are not proven root causes; ranking is not a probability.

## Verification

```sh
# Windows: substitute .\.venv\Scripts\python.exe for .venv/bin/python
.venv/bin/python -m pytest backend/tests -q
npm --prefix frontend test
npm --prefix frontend run build
```

With both services running, execute `npm --prefix frontend run smoke`. Playwright needs a Chromium installation: either `cd frontend` and `npx playwright install chromium`, or set `CHROMIUM_PATH` to an existing Chromium executable. In this cloud environment: `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke`. The smoke test performs real normal/failure cycles and writes desktop/mobile screenshots to `docs/`. It uses software rendering for test portability. It does not validate physical GPU performance.

## Project context

- [Approved full V1 PRD](docs/PRD.md)
- [Architecture and API](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Verified development status](docs/DEVELOPMENT_STATUS.md)
- [Milestone scope and report](docs/MILESTONE_1.md)

The simulation scenarios, engineering overlays, six-stage Guided Demo, confirmed handoff and maintenance exports are implemented. Remaining acceptance includes native Windows voice/GPU, native screen readers, longer-session profiling and release hardening. Public hosting/shared durability and account eligibility/cost remain unverified; no deployment follows from local tests. V2 is excluded. See the current status and acceptance reports above.

## Optional public-demo safeguards (not a deployment)

Set `MAINTAINAI_PUBLIC_DEMO=1` before backend startup to enable per-process write budgets: 20/peer/minute, 120/process/minute; reads remain available. Rate limits reset on restart and do not cover distributed replicas or guarantee provider quotas. Set `MAINTAINAI_ALLOWED_ORIGINS` to explicit comma-separated frontend origins for a separately hosted API; wildcard CORS is refused. `VITE_API_BASE` is an optional **public API root** at frontend build time (default `/api`), never a database URL/key.

Offline local maintenance, from repository root (Windows: use `.\.venv\Scripts\python.exe`):

```sh
.venv/bin/python -m backend.manage backup --database data/maintainai.sqlite3 --output data/backups/manual.sqlite3
.venv/bin/python -m backend.manage prune --database data/maintainai.sqlite3 --days 30
# Dry-run above. Applying requires explicit authorization and a new backup path:
# .venv/bin/python -m backend.manage prune --database data/maintainai.sqlite3 --days 30 --apply --backup data/backups/before-prune.sqlite3
```

Backups refuse to overwrite files. Retention preserves seed and active tickets; it is not scheduled automatically. No command was applied to production. Public deployment requires [hosting review](docs/HOSTING_DECISION.md) and the [release checklist](docs/RELEASE_CHECKLIST.md). Local SQLite restart success does not establish public durability.

## M2 verification and review

See [Milestone 2 scope/results](docs/MILESTONE_2.md) and [completion report](docs/M2_COMPLETION_REPORT.md). New backend tests use temporary databases only (including new-app/reopen and competing-update checks); they do not modify development records. Shared scenario contract: `fixtures/scenarios.json`. Chromium tests exercise all faults, deterministic replay, linked-ticket repair/history, stale-edit recovery and isolated browser simulations. Screenshots are review artifacts, not a Windows FPS benchmark.

## Historical M3 review and limitations

See [M3 scope/results](docs/MILESTONE_3.md), [completion report](docs/M3_COMPLETION_REPORT.md), [hosting decision with current official references](docs/HOSTING_DECISION.md), and [release checklist](docs/RELEASE_CHECKLIST.md). No public URL is deployed or verified. Official Cloudflare docs support FastAPI on Python Workers, but a D1 adapter, Free CPU-budget validation and account/billing/access checks are still required. Current Hugging Face docs require a paid plan for new compute Spaces; that route is rejected. No service, upgrade or paid fallback was activated.

For repeatable browser checks, serve the built frontend without hot reload in terminal 2: `cd frontend` then `node_modules/.bin/vite preview --host 127.0.0.1 --port 5173 --strictPort` (Windows: `npx vite preview --host 127.0.0.1 --port 5173 --strictPort`). Keep FastAPI running in terminal 1, then run the smoke command from terminal 3. Do not edit/rebuild during a run.


## Deployment Phase A: local Cloudflare feasibility

M3 PR #4 is merged at `a33811f`; V1 is **not publicly deployed**. The local Workers/D1 investigation is on `feature/v1-deployment-feasibility`. Start with [Phase A commands and boundaries](docs/DEPLOYMENT_PHASE_A.md) and [completion report](docs/DEPLOYMENT_PHASE_A_REPORT.md).

The existing native commands above still use SQLite. Root `package.json`/`pyproject.toml` are separate, pinned local Cloudflare tooling; frontend dependencies are unchanged. Local D1/Static Assets and integrity/recovery tests work, but actual Python Workers startup is blocked by Pyodide index access, Free CPU is unverified, and oversized evidence needs chunked storage. The SQL transport is a loopback-only disposable test harness and must never be published. Account eligibility, hosted durability and public-release safeguards remain unverified. No deploy/billing/resource provisioning is authorized by these setup commands.


## Phase A.1 runtime-first checkpoint

Phase A PR #5 is verified merged at `e940a83`. A dependency-free official-pattern Worker reproduces the package-index CONNECT 403 before app initialization; supported offline CLI resolution also lacks the required SDK cache. Runtime and billed resources remain unverified. Under the assignment's blocked-index gate, storage chunking, pre-ASGI enforcement and retained-data changes are deferred. No environment configuration, hosted resource, billing, production data or deployment was changed. Current evidence and exact next experiment: [Phase A.1 report](docs/PHASE_A1_COMPLETION_REPORT.md).
