# MaintainAI Robotics

Evidence-driven robotic failure investigation. **Milestone 2:** a 3-axis pick-and-place demonstrator, preserved FK integrity, four evidence-driven diagnoses, reproducible Random Failure, and local SQLite maintenance records. No paid APIs, login, GPU, Docker, or external runtime service.

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

## Demo walkthrough

1. Start the default Valid cycle. Pause/resume if desired. At 12 cycle seconds, target verification produces a normal backend result.
2. Reset. Select Dropped object. Start. At 6 cycle seconds, vacuum magnitude falls and object presence is lost despite a HOLD command; the object visibly falls.
3. At completion, review the computed diagnosis, observations, evidence references, and cause-specific operator checks. Expand other hypotheses. Inspect the timestamped timeline.
4. Reset and select Positioning error: independent placement is offset while robot FK remains coherent. Vision failure instead marks verification unavailable while the object remains present. Unexpected robot stop physically freezes the arm at 6 seconds; later checkpoints are not reached.
5. Select Random failure and set an explicit seed. Its resolved scenario is displayed; reset/replay retains the seed and reproduces evidence. Seed/context are copied into diagnosis-linked ticket descriptions.
6. From a completed diagnosis, choose **Create maintenance ticket**, select equipment and submit. Inspect the saved evidence snapshot; add operator/repair notes, mark In Progress, then resolve with resolution notes. Maintenance navigation also supports manual tickets and seeded historical incidents. Stale edits require a reload rather than silently replacing another operator's changes.
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

Remaining V1 includes verified shared cloud persistence, engineering overlays, full Guided Demo, production deployment, and final UX/accessibility/performance hardening. Four failures, Random Failure and local maintenance records are implemented in M2. V2 is excluded. Public hosting and shared durability have **not** been verified; no service has been provisioned. Account entitlement/cost must be verified separately from dependency license cost.

## M2 verification and review

See [Milestone 2 scope/results](docs/MILESTONE_2.md) and [completion report](docs/M2_COMPLETION_REPORT.md). New backend tests use temporary databases only (including new-app/reopen and competing-update checks); they do not modify development records. Shared scenario contract: `fixtures/scenarios.json`. Chromium tests exercise all faults, deterministic replay, linked-ticket repair/history, stale-edit recovery and isolated browser simulations. Screenshots are review artifacts, not a Windows FPS benchmark.
