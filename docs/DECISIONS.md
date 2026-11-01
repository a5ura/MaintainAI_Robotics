# Decisions — Milestone 1

- Preserve the supplied October 31 handoff verbatim as `docs/PRD.md`; its embedded historical prompts are context, not newer execution instructions.
- User's pasted assignment explicitly authorizes bounded M1 implementation. Use existing Project 2 repo, separate feature branch; do not touch Project 1 or merge main.
- Actual execution is the available managed Linux cloud workspace. Desktop/Windows validation is not implied. No new cloud resources or paid services are provisioned; account cost/entitlement is not visible.
- Use a 3-axis reduced arm to demonstrate coherent yaw/shoulder/elbow kinematics without heavy robotics/physics dependencies. Define explicit geometry, frames, and tool offset; no vendor fidelity claim.
- Stateless FastAPI requests and per-browser clocks isolate active runs. Shared maintenance persistence is intentionally deferred, not replaced by local storage.
- Diagnose after the complete 12-second cycle, allowing post-place confirmation; show live synthetic sensors during execution.
- Use deterministic telemetry and ordinal evidence ordering with competing causes. Incomplete/conflicting data cannot produce a confident detection.
- Frontend dependency versions and lockfile are committed. Backend direct requirements and a resolved lock snapshot support repeatable installation; no package signature/TLS verification is disabled.
- Public hosting and shared storage are unresolved. Verify current terms, no billing method/charge risk, sleep/idle limits, and restart/redeploy durability before choosing. This does not block M1. No provider claimed verified.

## M1 stabilization

- Correct current status using fetched Git merge ancestry; preserve original PR API failures as historical evidence.
- Independently reproduce existing 3R FK in lightweight Python; share golden fixtures across language tests. Keep the approved PRD/model geometry unchanged.
- Use 0.1 mm Euclidean simulation tolerance, inclusive plus 1e-12 m floating-point boundary slack. Joint limits are inclusive with no added joint slack.
- Distinguish invalid API input (422) from physically inconsistent telemetry (200/inconclusive). Suppress cause rankings and failure conclusions when kinematic evidence is inconsistent. Return per-row violations instead of inventing a new fault scenario.
- Use native accessible anchor links and target-row highlighting for traceability, preserving the existing UI architecture and adding no dependency.

## Milestone 2 implementation decisions

- Verified main includes PR #2 merge `44f8d44bf171ad82f2250938298861e97b267836`; build on it without resetting existing work or creating another worktree.
- Retain M1 FK/trajectory and API fields; add optional typed camera/placement/controller/event fields, a pure rule registry, multiple anomaly results and immutable persisted diagnostic IDs.
- Use independent fixture observations for positioning discrepancy; keep commanded robot kinematics valid. Treat failed vision as unreliable verification, not proof of physical loss. Clamp protective-stop motion at 6 seconds; recovery uses Reset only.
- Use a reproducible single Mulberry32 seed draw; record resolved scenario and seed in active context and linked ticket description. Never send a diagnostic answer label in simulation payloads.
- Use Python standard-library SQLite and a repository adapter rather than another framework or hosted account. Transactional idempotent seed, parameterized queries, foreign keys, versioned updates and temporary test databases are required. Local SQLite is not the final hosted durability solution.
- Persist diagnosis snapshots before ticket linkage; a ticket references the backend's immutable result, not a client-supplied replacement. Public/no-login semantics are explicit; no visitor-private identity claims.
- No dependency additions, Docker, external APIs, paid services, infrastructure provisioning or environment publication. Account entitlement/actual cost remains unobservable; $0 billing cannot be certified from this session.

## Milestone 3 implementation and release decisions

- Verify PR #3 merge `76e00f2c6396f7a5614baeb1434449b88e543ca0` before branching. Preserve all M1/M2 behavior and the approved PRD.
- Guide a single meaningful dropped-object investigation in ~20 seconds of automatic progression, with real backend computation and a labelled Open ticket; retain interactive default and manual takeover.
- Use idempotent optional UUID request keys for guided ticket retry/concurrency, without a schema change or replacing the existing API.
- Derive engineering values/frames/path from the approved model; use keyboard component buttons alongside real mesh picking. Disable overlays by default.
- Split optional views and render the workcell on demand. Report measured bundle components and limits; do not claim total payload savings or Windows FPS from cloud tests.
- Add opt-in local write budgets and offline backup/dry-run retention. No public reset route, login, external API or new dependency.
- Recommend only a conditional Cloudflare FastAPI/D1 feasibility route after current official-source research; no provider selection/provisioning, paid plan, record migration or deployment. Account/card terms, 10 ms runtime compatibility, managed-store adapter and redeploy durability remain release gates. See HOSTING_DECISION.


## November 1, 2026 UTC — Deployment Phase A evidence

- M3 PR #4 is verified merged at `a33811f`; use `feature/v1-deployment-feasibility` for the authorized local spike. No public deployment, billing, provider resource, actual migration, environment publication or merge.
- Reuse a shared async HTTP/domain boundary with native SQLite plus an async D1 binding adapter. Use supported atomic SQL + history triggers and D1 batches; never emulate BEGIN IMMEDIATE over HTTP.
- Genuine local D1/Static Assets, concurrency and synthetic recovery tests provide local SQL evidence only. An isolated official workers-py CLI attempt was blocked by the required Pyodide index; do not infer Wasm support or Free CPU from CPython.
- A valid dense payload yields a >2 MB immutable snapshot, exceeding the documented D1 row cap. Preserve evidence and fail explicitly; chunked storage is a release prerequisite, not an approved input reduction. Pre-ASGI upload buffering and anonymous availability also need verification.
- Verdict: **CONDITIONAL GO** to resolve technical/account gaps. Keep strict $0, no paid fallback, no-login approved requirements and V2 deferral. A read-only/local-interaction fallback, if necessary, needs a Planning decision.


## November 1, 2026 UTC — Phase A.2 reliability

Build from merged A.1 PR #6 (`966c809`) and advance local storage regardless of the single unchanged index access check. Use supported D1 transactional batches with immutable versioned manifest/ASCII TEXT chunks and SHA-256, preserving public evidence IDs and all diagnostic content. Debit actual stored canonical bytes plus conservative per-record overhead inside the same transaction; default allowance 64 MiB/day, no retry double-charge. Use cached equipment counts and indexed keyset/history pages with explicit UI continuation, not retention by silent truncation. Keep local SQLite and the Python engine; no second TypeScript engine or architecture switch. Hosting remains a Planning decision with actual runtime/account/body-bound/durability gates; no deployment or paid capacity.
