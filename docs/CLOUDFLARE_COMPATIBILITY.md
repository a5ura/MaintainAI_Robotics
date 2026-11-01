# Cloudflare compatibility — November 1, 2026 UTC

## Exact tools and runtime selection

| Component | Observed version / status |
|---|---|
| Existing app Python | CPython 3.12.14, Linux x86_64 |
| Tools interpreter | CPython 3.13.5, isolated `/tmp` venv |
| Python CLI | `workers-py==1.17.9` providing `pywrangler` |
| SDK / resolver | `workers-runtime-sdk==1.9.5`, isolated `uv==0.13.6` (CLI requires ≥0.13.4) |
| Node / npm / Git | 24.19.0 / 11.9.0 / 2.52.0 |
| Wrangler / workerd package | 4.156.0 / 1.20261023.1, root npm lock |
| Config | `python_workers`, compatibility date `2026-10-30` |
| Selected Wasm | CLI selected Python 3.14; downloaded `cpython-3.14.2-emscripten-wasm32-musl`; package index `314.0.7` |
| Toolchain-created native venv | CLI also installed CPython 3.14.8; this is not Worker execution |
| Existing app pins retained | FastAPI 0.115.12; Pydantic 2.11.4; native backend requirements unchanged |

The CLI's compatibility metadata selects 3.14 from September 8, 2026, 3.13 from September 29, 2025 and earlier 3.12 fallback. Date November 1 was initially rejected by the installed local runtime as newer than its supported October 30 date; both checked-in configs use the supported date. Do not assume the historical Python 3.13 examples describe this config's VM.

## Findings

| Question | Documented | Actual local evidence |
|---|---|---|
| FastAPI / ASGI support | Official `from workers import asgi; Default = asgi.entrypoint(app)` | Entry point provided; actual VM launch blocked before app import |
| Pydantic / compiled dependencies | Pyodide-compatible wheels required; native wheels alone do not prove compatibility | Exact existing pins' Wasm resolution/startup **UNVERIFIED** |
| Diagnostic engine / JSON validation | Pure Python rules and existing Pydantic schemas reused | CPython regressions pass; execution in Wasm **UNVERIFIED** |
| Async dependencies | Workers should avoid native blocking/threadpool request paths | Every shared route and D1 dependency is async; actual ASGI/JS promise translation **UNVERIFIED** |
| D1 binding | `prepare().bind().all()` and transactional `batch()` | Genuine local D1 SQL via transport; actual Python JsProxy array/result conversion **UNVERIFIED** |
| Filesystem / sqlite3 | Local files are not central persistence | Worker import graph excludes native repository and local harness; no file fallback. Native SQLite stays available |
| Static frontend | Static Assets, SPA fallback, API-only Worker routing | Actual workerd served built HTML/assets byte-for-byte and nested SPA navigation; combined Python/API asset routing **UNVERIFIED** |
| CPU / memory / startup snapshot | Free 10 ms CPU, 128 MB; deployment snapshot documented | No actual Python VM startup, authoritative CPU, Wasm memory or hosted snapshot test |

The `native()` D1 result conversion explicitly serializes JSON from JS; `binding_array()` uses Pyodide's `to_js` for the batch statement array. These paths remain unverified until a real Python Worker reaches a database-backed endpoint. CPython tests deliberately exercise a separate, labelled transport rather than pretending to test JsProxy behavior.

## Blocked command and failure

`npm run worker:local` with isolated tools, proxy and CA trust preserved. First attempt exposed old resolver version 0.12.23; upgraded only the isolated resolver to 0.13.6. Second attempt reached Wasm package resolution and failed:

```text
uv pip compile pyproject.toml ... --python cpython-3.14.2-emscripten-wasm32-musl
  --extra-index-url https://index.pyodide.org/314.0.7 --no-build ...
Exit code: 2
Failed to fetch .../workers-runtime-sdk/
client error (Connect): tunnel error: unsuccessful
```

Independent request confirmed HTTP 403 through the existing proxy. This is a network/package-resolution blocker, not evidence that the app initialized and failed. No network-policy bypass or unverified dependency upgrade was attempted. No endpoint results, Worker CPU values or public URLs are claimed from that launch.

## Official sources read

Checked November 1, 2026 UTC, via provider-owned sources through the configured proxy:

- [FastAPI and ASGI example](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/languages/python/packages/fastapi.mdx)
- [Pyodide runtime, compatibility versions, deployment snapshots](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/languages/python/how-python-workers-work.mdx)
- [Official workers-py project / CLI](https://github.com/cloudflare/workers-py), [ASGI implementation](https://github.com/cloudflare/workers-py/blob/main/packages/runtime-sdk/src/workers/asgi.py)
- [Workers limits](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/limits.mdx)
- [Static Assets billing/routing](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/static-assets/billing-and-limitations.mdx)

Account entitlement and hosted behavior are separate, unverified evidence categories.


## Phase A.1 runtime-first checkpoint

Phase A PR #5 is verified merged at `e940a83`. A dependency-free official-pattern Worker reproduces the package-index CONNECT 403 before app initialization; supported offline CLI resolution also lacks the required SDK cache. Runtime and billed resources remain unverified. Under the assignment's blocked-index gate, storage chunking, pre-ASGI enforcement and retained-data changes are deferred. No environment configuration, hosted resource, billing, production data or deployment was changed. Current evidence and exact next experiment: [Phase A.1 report](PHASE_A1_COMPLETION_REPORT.md).
