# MaintainAI Robotics

Evidence-driven robotic failure investigation. **Milestone 1:** a 3-axis pick-and-place demonstrator, forward kinematics, simulated telemetry, and FastAPI-computed Dropped Object diagnostics. No paid APIs, login, GPU, Docker, or external runtime service.

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

## Demo walkthrough

1. Start the default Valid cycle. Pause/resume if desired. At 12 cycle seconds, target verification produces a normal backend result.
2. Reset. Select Dropped object. Start. At 6 cycle seconds, vacuum magnitude falls and object presence is lost despite a HOLD command; the object visibly falls.
3. At completion, review the computed diagnosis, observations, evidence references, and cause-specific operator checks. Expand other hypotheses. Inspect the timestamped timeline.
4. Reset for a reproducible new run. Scenario selection is locked during a run. Each browser owns its own clock; backend requests are stateless.

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

Remaining V1 includes three more failures, Random Failure, maintenance records, shared cloud persistence, engineering overlays, Guided Demo, and public deployment. V2 is excluded. Public hosting and shared durability have **not** been verified; no service has been provisioned. Account entitlement/cost must be verified separately from dependency license cost.
