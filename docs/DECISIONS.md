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
