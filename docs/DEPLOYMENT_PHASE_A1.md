# Deployment Phase A.1 — runtime-first investigation

Base: merged Phase A PR #5, `e940a834857580d28791d3af50ea53d84d5d115c` (parents `a33811f` and `988c3e1`). Feature: `feature/v1-deployment-phase-a1`. Existing managed Linux workspace; no Windows/Desktop execution inferred. November 1, 2026 UTC.

**CONDITIONAL GO — ADDITIONAL PROOF REQUIRED.** Actual Python Worker remains blocked before initialization. The assignment explicitly permits only bounded offline checks in that condition. No chunking, upload interceptor, retained-data redesign or production modification was implemented. This preserves the runtime-first execution gate rather than speculatively expanding an unproved host architecture.

## Reproduce the isolated official-pattern probe

The probe uses the minimal WorkerEntrypoint/Response pattern documented in [Cloudflare's Python runtime guide](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/languages/python/how-python-workers-work.mdx). It has no FastAPI/Pydantic application dependency. It uses the same pinned official tooling as Phase A; the CLI adds its required runtime SDK automatically.

Copy the three files in `cloudflare/probes/a1_minimal` to a disposable directory, then run from that directory:

```bash
# Existing session tools; if missing, use Phase A's isolated installation instructions.
PATH=/tmp/phase-a-workers-venv/bin:$PATH \
 UV_CACHE_DIR=/tmp/phase-a-uv-cache UV_PROJECT_ENVIRONMENT=/tmp/a1-project-venv \
 XDG_CONFIG_HOME=/tmp/phase-a-config WRANGLER_SEND_METRICS=false PYWRANGLER_LOG=debug \
 timeout 50 /tmp/phase-a-workers-venv/bin/pywrangler dev --local --ip 127.0.0.1 --port 8791
```

For the supported existing-cache check, repeat with `UV_OFFLINE=true`. Keep inherited proxy and CA trust; never remove proxy settings or disable TLS. Current results: online dependency compile exit 2 (CONNECT denied); offline compile exit 1 (required SDK unavailable in the selected resolver cache). Neither started the HTTP server. No unknown mirror, alternate hostname, direct route, credential or security bypass was used.

If approved destination access is made available, retry this exact probe first and request `http://127.0.0.1:8791/`. Only after a genuine response, add a separate FastAPI/Pydantic/ASGI probe using existing app pins; then exercise the real `cloudflare/entry.py` against genuine locally bound D1. Do not substitute the CPython SQL bridge for those tests. The fixtures are local-only and must never be deployed.

## Next proof and conditional work

1. Request approved HTTPS proxy destination access to `index.pyodide.org`, initially `/314.0.7/workers-runtime-sdk/` and the resolver's package paths. Follow newly observed official artifact redirects only after checking policy. No environment draft/publication was changed here.
2. Prove minimal Python, then FastAPI/Pydantic validation and ASGI, then all real API endpoints and D1 prepare/bind/await/batch/JSON conversions. Record selected Wasm version and full failures.
3. Measure full-request authoritative CPU/memory if exposed. Local latency/native CPU are not billed CPU. If accounting is unavailable, identify separately authorized hosted Free-only metering needed; no hosted test is authorized now.
4. If still promising, implement/test immutable chunked snapshots and adjust byte budget, pre-ASGI stream bounds and measured retained-data controls. Retention of real records requires separate authorization.

Current regression commands remain those in Phase A/README. Raw results and exact evidence categories: `PHASE_A1_EVIDENCE.json` and `evidence/a1/`. The four A.1 reports distinguish new checks from Phase A's historical measurements. PRD and product behavior are unchanged; no new dependency or chargeable service was added.
