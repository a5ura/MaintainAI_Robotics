## Problem and change

The completed V1 application uses native SQLite and cannot be assumed to run unchanged in Python Workers with D1. This PR adds a bounded local feasibility prototype: one shared async FastAPI/domain boundary, a D1 adapter/schema with atomic ticket/history writes, shared quotas/read-only/seed protection, and disposable recovery/measurement tools. Native SQLite and the complete frontend remain supported and unchanged in behavior.

## Verified evidence

- Base: merged M3 PR #4, `a33811f060d165ac5758966eda9be06e215d9171`.
- 97 native backend tests; 39 frontend tests; TypeScript/production build pass.
- 44 new contracts/integrity/policy/recovery/Static Assets tests pass against genuine local workerd D1 (CPython adapter transport, not mocked SQL or Python Worker proof).
- All 15 actual Chromium tests pass against CPython FastAPI + local D1, including pending Guided Demo saves/manual takeover, all failures, random replay, overlays and maintenance workflows. Baseline SQLite Chromium tests also passed.
- A real local emulator stop/restart preserves ticket version, evidence, history, repair notes and budget counter. Disposable SQLite-to-D1 migration and backup/restore preserve full snapshots; failed transactions/restore roll back.
- Ten representative/bounded payloads measured with 15 repetitions, plus query/mutation measurements and concurrent conflicts. Raw evidence and exact commands are committed in Phase A docs/JSON.

## Feasibility verdict: CONDITIONAL GO

This is ready for technical review, **not deployment approval**:

- Actual Python Worker launch is blocked before app initialization by proxy denial of the required Pyodide package index. Exact Wasm packages, ASGI endpoints and Python/JS binding interop remain unverified.
- Authoritative Free 10 ms CPU, 128 MB memory and cold starts are unverified. Maximum 2,000-sample inputs take roughly 51–80 ms of CPython compute; those figures are a risk indicator, not billed Worker CPU.
- A valid 1.79 MB request produces 2.35 MB of complete evidence, exceeding D1's documented 2,000,000-byte row cap. The adapter is explicitly incomplete for that class and returns 503 without truncating evidence. Chunked immutable storage is required before release.
- The installed ASGI SDK buffers request bodies before application middleware; a pre-ASGI streamed bound needs proof. Shared app counters do not guarantee anonymous availability or provider read quotas as retained records grow.
- Free-only account eligibility, billing configuration, hosted durability/redeployment and operator backup/recovery remain unverified.

Six Phase A documents, updated project context/release gates, a prepared Planning report, and raw measurement/recovery/verification artifacts distinguish documented limits, local evidence and account verification.

No public deployment, provider resource, billing activation, paid fallback, real record migration, environment publication or automatic merge. PRD, frontend source/dependency manifests, native backend requirements, diagnostic algorithms, Project 1 and V2 scope are unchanged.
