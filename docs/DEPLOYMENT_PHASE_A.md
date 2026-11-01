# Deployment Phase A — local feasibility only

Baseline: `a33811f060d165ac5758966eda9be06e215d9171`, merged M3 PR #4 (including `a9491d5`). Branch: `feature/v1-deployment-feasibility`. Verification date: November 1, 2026 UTC. Execution: the existing managed Linux workspace, not Windows or verified Codex Desktop execution.

**CONDITIONAL GO for further investigation; no public release.** Real local D1 integrity and Static Assets work. The actual Python Worker could not start because the environment proxy denied the required Pyodide package index. Billed CPU, Wasm memory, account eligibility and hosted durability are unverified. Large complete evidence can exceed D1's row limit; the current single-row prototype is explicitly incomplete for that case. See [compatibility](CLOUDFLARE_COMPATIBILITY.md), [storage](D1_STORAGE_ADAPTER.md), [measurements](FREE_TIER_FEASIBILITY.md), [security](PUBLIC_DEMO_SECURITY.md) and [completion report](DEPLOYMENT_PHASE_A_REPORT.md).

## Architecture and evidence boundaries

- Production proposal: unchanged React build → Workers Static Assets; `/api/*` → Python Worker using the official `workers.asgi.entrypoint`; async FastAPI → D1 binding. Browser simulations remain independent; maintenance data is shared.
- Native development remains FastAPI/Uvicorn + SQLite with the same commands, data path, rules, validation and public JSON contract.
- `backend/http_api.py`, `domain.py` and `ticket_models.py` provide one HTTP/domain implementation. Native persistence runs in its existing threadpool boundary; D1 calls are async. Worker imports do not import the SQLite adapter, native security middleware or local harness.
- **Actually exercised:** the same ASGI/domain/D1 adapter in CPython, SQL executed by genuine local workerd/Miniflare D1 through a loopback-only JavaScript transport. Static Assets served by workerd. This proves local SQL behavior, not Python/JavaScript interop or hosted Cloudflare behavior.
- `cloudflare/d1_bridge.mjs` exposes arbitrary SQL for disposable local tests only. It is never the application backend and must never be published. Only `cloudflare/entry.py` is the proposed Worker entry point.

## Reproduce on a Linux development machine

Use existing authorized compute only. All commands run from repository root. Native dependencies and frontend setup remain in README. Tests below replace **disposable emulated records**; never point them at development/user data or expose the bridge beyond loopback.

```bash
npm ci
npm --prefix frontend ci
npm --prefix frontend run build
# Terminal 1: keep running; no login/account/database creation needed.
XDG_CONFIG_HOME=/tmp/phase-a-config WRANGLER_SEND_METRICS=false npm run d1:local
```

```bash
# Terminal 2: initial schema and deterministic seed; repeatable.
.venv/bin/python -m cloudflare.local_schema
.venv/bin/python -m pytest cloudflare/tests -q
.venv/bin/python -m cloudflare.restart_probe
.venv/bin/python -m cloudflare.measure
# CPython ASGI + emulated D1, explicitly NOT a Python Worker:
.venv/bin/python -m uvicorn cloudflare.local_api:app --host 127.0.0.1 --port 8000
```

The tests and measurements share the disposable D1 binding: run them sequentially. `restart_probe` starts its own disposable emulator on 8790, stops/restarts it, verifies records/counters and removes its temporary state. Measurements overwrite only their JSON evidence files. The main harness stores ignored state in `.wrangler/d1-contract`; SQLite's `data/` is separate and untouched.

For Chromium, use the README production-preview command on 5173 and then `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke`. Preview proxies `/api` to port 8000. Do not rebuild during this check. Existing browser tests overwrite M3 screenshots/timings; avoid committing those unrelated generated changes.

## Actual Python Workers attempt (currently blocked)

The supported CLI distribution is **workers-py**, which installs the `pywrangler` command; the unrelated PyPI package named `pywrangler` is not used. Use an isolated tools environment, leaving the app's Python 3.12 environment intact:

```bash
python3.13 -m venv /tmp/phase-a-workers-tools
/tmp/phase-a-workers-tools/bin/pip install workers-py==1.17.9 workers-runtime-sdk==1.9.5 uv==0.13.6
PATH="/tmp/phase-a-workers-tools/bin:$PATH" \
  UV_CACHE_DIR=/tmp/phase-a-uv-cache \
  UV_PROJECT_ENVIRONMENT=/tmp/phase-a-project-venv \
  XDG_CONFIG_HOME=/tmp/phase-a-config WRANGLER_SEND_METRICS=false \
  npm run worker:local
```

The actual session used `/tmp/phase-a-workers-venv` as its tools directory with these same versions. Keep inherited proxy/CA settings. Do not disable TLS checks, bypass the proxy, change provider accounts, or substitute CPython execution for Wasm proof. `pywrangler` selects Python 3.14/Pyodide for compatibility date `2026-10-30`; dependency compilation failed with exit 2 at `https://index.pyodide.org/314.0.7/workers-runtime-sdk/` (proxy CONNECT denied; direct confirmation returned 403). No application endpoint ran in that VM. A valid Wasm dependency lock was **not** generated; do not treat `pyproject.toml` pins as resolved Wasm packages.

Once package access is authorized and available, repeat the exact launch, apply `cloudflare/migrations/0001_domain.sql` **locally** to that config's separate `.wrangler/state`, seed it via an operator-only local runner, and test health, validation, all scenarios and every ticket endpoint with the actual `env.DB`. The contract harness's state does not automatically initialize the separate Python Worker state. No public seed/migration route is provided.

## Boundary for the next assignment

Resolve actual Wasm startup/interop, measure authoritative CPU/memory, and implement/test immutable snapshot chunking if retaining the current maximum input contract. Then independently verify Free-only account eligibility, quota/retention policy and hosted durability. Phase A authorizes none of resource provisioning, deployment, billing, real record migration, environment publication or automatic merging. Project 1, PRD and V2 remain unchanged.
