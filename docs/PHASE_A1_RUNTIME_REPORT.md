# Phase A.1 runtime report

## Classification: BLOCKED, not dependency incompatibility

Current managed environment status reports current observations, enforced restricted policy, no configured provider identities/secrets and no VPN. Both the supported policy snapshot and `/etc/codex/network-policy.json` omit `index.pyodide.org` from allowed destinations. Existing package-manager hosts include PyPI/npm/GitHub, not arbitrary package indexes.

Fresh `curl -I --max-time 20 https://index.pyodide.org/314.0.7/workers-runtime-sdk/` through the inherited proxy returned **CONNECT 403**, curl exit 56, `server: envoy`. That happens before destination TLS or HTTP package content. Evidence supports proxy destination-policy denial; it does not establish destination DNS failure, bad certificates, missing package versions or app import errors. Destination DNS and TLS could not be independently verified through that denied tunnel; direct-network tests would bypass the policy and were not attempted.

## Minimal official-pattern Worker

The checked-in probe uses only `workers.Response` and `workers.WorkerEntrypoint`; no MaintainAI imports, FastAPI, Pydantic, D1 or SQL bridge. `workers-py==1.17.9` invokes its supported dependency workflow, selecting Python 3.14 for compatibility date October 30, 2026. It created the Wasm interpreter environment (`cpython-3.14.2-emscripten-wasm32-musl`) but failed **before application initialization** while resolving the required SDK at the exact denied URL. Nested `uv pip compile` exited 2 after three retries. CLI exit 1. No HTTP readiness/response was observed or claimed.

A second minimal launch using supported `UV_OFFLINE=true` and the existing official resolver cache failed with nested compile exit 1: workers-runtime-sdk could not be downloaded/read from that cache. A standalone offline compile of the empty app dependency list succeeds but omits CLI-injected SDK requirements; it is not runtime proof. The actual offline CLI launch is the relevant failure. No untrusted mirror or manual wheel substitution was attempted.

Native SDK installation and an existing Wasm interpreter download do not establish a complete official Wasm package cache. No valid runtime lock or independently usable alternative official source was established. Exact FastAPI 0.115.12/Pydantic 2.11.4 Wasm wheel compatibility remains unverified. Native versions were not changed to mask this failure.

| Check | Evidence category | Outcome |
|---|---|---|
| Proxy access to exact required index | Blocked | CONNECT 403 before TLS |
| Minimal official-pattern initialization/HTTP | Blocked | Required SDK resolution fails before imports |
| Existing official cache, actual CLI offline | Blocked | Required SDK not available in selected cache |
| FastAPI/Pydantic imports/validation in Wasm | Unverified | Minimal prerequisite never initialized |
| Real MaintainAI ASGI endpoints / D1 interop | Unverified | Not re-run as a redundant blocked full-app launch |
| Native app regression | Native CPython only | Passing suite; not Worker evidence |
| Local SQL integrity/recovery | Local D1 emulator | Passing suite; not Python/JS binding proof |

SDK 1.9.5 source inspection confirms `workers/asgi.py::process_request` drains `req.body` into an unbounded receive queue before invoking ASGI. Source hash is recorded in JSON. This is source evidence of the existing concern, not decisive runtime verification of an interceptor. No post-buffer middleware is presented as a fix.

Approved remediation needed: add the official index destination through the supported environment-configuration workflow, with user review as required, or provide a verified complete official offline cache. No configuration draft was edited/published in this task. Account credentials, paid Workers or a hosted database cannot cure an environment destination denial and were not requested.

Raw online/offline logs and CONNECT headers are committed under `docs/evidence/a1/`. This result warrants **CONDITIONAL GO**, not a technical NO-GO: neither an app incompatibility nor Free-limit failure was reproduced. Keep all runtime/resource gates unresolved until actual execution.
