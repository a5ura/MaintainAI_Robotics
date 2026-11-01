# MaintainAI Robotics — Phase A.1 Completion Report

## A. Environment and baseline

Repository `a5ura/MaintainAI_Robotics`; verified main/PR #5 merge `e940a834857580d28791d3af50ea53d84d5d115c`; clean initial tree; branch `feature/v1-deployment-phase-a1`. Existing managed Linux x86_64, not verified Windows/Desktop. Native Python 3.12.14, tool Python 3.13.5, Node 24.19.0, npm 11.9.0, Git 2.52.0, Wrangler 4.156.0, workers-py 1.17.9, SDK 1.9.5, uv 0.13.6. No dependencies added.

## B. Package-index investigation

Exact URL: `https://index.pyodide.org/314.0.7/workers-runtime-sdk/`. Fresh inherited-proxy request returned CONNECT 403 before destination TLS. Current enforced restricted policy omits this destination; no VPN configured. Classified as proxy destination-policy denial, not DNS/certificate/package incompatibility. No bypass or TLS weakening. Actual supported offline CLI attempt also fails: required SDK unavailable in selected official resolver cache. No usable alternate official package source established. Approved remediation: official destination access through the environment workflow or verified complete offline cache. No draft/publication changed.

## C. Actual Python Worker

Minimal official-pattern Worker fixture added without FastAPI/Pydantic or app imports. Real pywrangler selected Wasm Python 3.14.2, but required SDK compilation failed with exit 2 (CLI exit 1) before initialization. Offline compile exit 1. No successful Worker requests. FastAPI/Pydantic imports, ASGI endpoints, real D1 prepare/bind/promises/array/JSON/batch interop remain **UNVERIFIED**. Redundant full-app launch deferred after minimal prerequisite failure. CPython/local D1 tests are separate evidence.

## D. Resource feasibility

New real Worker sample count: zero. CPU, memory, initialization, cold/first request, D1 invocation metrics and maximum-input resource behavior remain **UNVERIFIED**. Historical Phase A native timing is labelled historical, never billed CPU. See `PHASE_A1_RESOURCE_MEASUREMENTS.md` for the exact post-access measurement protocol. No new native benchmark substituted for runtime proof.

## E. Early feasibility decision

**CONDITIONAL GO.** Runtime remains plausibly viable but access prevents decisive compatibility/resource proof. Neither technical failure nor Free-plan success was reproduced. The assignment's section 3.3 explicitly limits further work to bounded offline checks while index access remains blocked.

## F. Snapshot storage

Deferred under that gate. Existing single-row guard remains unchanged; full input support is incomplete. No chunk schema, manifest, checksum, concurrency/migration implementation is claimed. The known 2.35 MB valid snapshot also exceeds the unchanged ~2 MiB/day allowance. Both defects must be resolved together after runtime proof; no truncation or PRD narrowing.

## G. Request upload safety

SDK source/hash inspection confirms receive-queue body buffering before ASGI. No pre-ASGI interceptor was implemented or claimed verified; streamed/absent/misleading-length/concurrent-upload tests require actual runtime access. Existing app validation is defense in depth, not proof of early memory protection.

## H. D1 quotas and retention

Existing shared quotas, indexes, seed protection and read-only mode unchanged and locally regression tested. New retained-volume benchmarks/pagination/retention deferred; historical Phase A metadata remains historical. Read scans and long-lived history growth remain unresolved. No real records pruned or migrated. Resource report explains future chunk-count/byte-budget accounting without inventing measured values.

## I. Tests

Fresh commands, raw outputs and evidence categories: `PHASE_A1_EVIDENCE.json`, `docs/evidence/a1/`.

- `.venv/bin/python -m pytest backend/tests -q`: **97 passed**, native CPython/temporary SQLite.
- `npm --prefix frontend test`: **39 passed**.
- `npm --prefix frontend run build`: TypeScript/production build **passed**.
- `.venv/bin/python -m pytest cloudflare/tests -q`: **44 passed**, genuine local D1 via labelled CPython transport; includes integrity/recovery/Static Assets.
- `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke`: **15 passed (2.5m)**, actual Chromium against native SQLite API.
- Minimal real Python CLI online/offline: **blocked**, not skipped passes. No new decisive Wasm, chunking or stream-bound tests ran.

Upstream Starlette/AnyIO deprecation, Node color and Vite 3D chunk warnings remain. Verbatim CLI logs preserve their original alignment/CRLF (including trailing whitespace). No existing tests disabled. No production source was changed after baselines, so duplicate full-suite reruns are unnecessary. Generated M3 screenshots/timing are restored after browser completion.

## J. Cost and security

No new resource, account, billing enrollment, paid trial/capacity, dependency, hosted deployment, actual-record migration or environment publication. Existing authorized compute only. Provider account eligibility/actual charges and hosted durability remain unverified; configured provider identities/secrets absent. CORS is not authentication; anonymous availability and Free accounting are not proven. No secrets in committed evidence.

## K. GitHub

Probe/evidence commit: `3d85a59` on pushed branch `feature/v1-deployment-phase-a1`, targeting main and referencing merged PR #5. `gh pr create --repo a5ura/MaintainAI_Robotics --base main --head feature/v1-deployment-phase-a1 --title "Investigate Phase A.1 Python Worker runtime access" --body-file docs/PHASE_A1_PR.md` returned exit 1: `Post "https://api.github.com/graphql": Forbidden`. **No new PR is confirmed.** [Create PR](https://github.com/a5ura/MaintainAI_Robotics/compare/main...feature/v1-deployment-phase-a1?expand=1) with [prepared description](PHASE_A1_PR.md). Git push succeeded independently. Final documentation commit/remote SHA is returned in the final handoff; no merge performed.

Changed files: isolated three-file minimal probe; four required A.1 reports; raw logs and JSON evidence; prepared PR body; README/AGENTS and current compatibility/hosting/release/status notes. Production application, approved PRD, Project 1 and V2 unchanged. Final pushed HEAD is supplied in the completion handoff.

## L. Final recommendation

**CONDITIONAL GO — ADDITIONAL PROOF REQUIRED.** The smallest remaining experiment is approved HTTPS access to the exact official index, then rerun the minimal probe with existing pins. Continue to FastAPI/Pydantic/ASGI and genuine D1 only after success, and retain UNVERIFIED for billed CPU if local tooling cannot expose it. Do not repeat a broad Cloudflare build-out while access remains unchanged. Chunking/budget correction, pre-ASGI bounds and retained-data controls remain gated. No Phase B authorization or public release is implied.
