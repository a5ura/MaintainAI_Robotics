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
