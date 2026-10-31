# Milestone 1 — Functional vertical slice

Scope: React/TypeScript/Tailwind/R3F workcell, coherent joint trajectories and FK, Start/Pause/Reset, four simulated verification checkpoints, FastAPI Dropped Object correlation, initial diagnostic UI, tests, documentation, and an unmerged reviewable feature branch/PR where permissions allow.

Excluded: remaining three faults, Random Failure, complete tickets/equipment/history, shared cloud persistence, engineering overlays, complete Guided Demo, production deployment, all V2, Project 1/video work. The complete requirements remain in PRD.

## Acceptance record

See `DEVELOPMENT_STATUS.md` for verified test/PR outcomes. Required criteria:

- Working frontend and FastAPI integration.
- Repeatable normal pick/transport/place and visible dropped object.
- Joint/FK/rendered TCP consistency.
- Start, Pause, Reset; four verification checkpoints.
- Computed detection with temporal evidence, competing causes, operator checks.
- Missing/malformed/conflicting telemetry handled without false certainty.
- UI observations, evidence timeline, errors, status, and responsive layout.
- Unit/integration tests, production build, genuine browser smoke test.
- Exact run instructions and full V1 scope preserved.
- Reviewable PR, or exact permission/API blocker and preserved local commits.

## Completion report structure

1. Execution environment: actual OS/location/workspace, resource and cost limitations.
2. Git: repo, branch, base, implementation commits, verified PR URL or precise blocker.
3. Implementation and architecture.
4. Simulation integrity: model, FK, joint trajectories, actual tests.
5. Diagnostics: evidence, rules, hypotheses, sample output.
6. Testing: commands, counts, outcomes, genuine browser findings.
7. Run instructions: README platform-specific commands.
8. Acceptance: Pass / Fail / Unverified per criterion.
9. Limitations: actual defects, environment/access/cost unknowns, deferred work.
10. Next milestone: remaining faults and maintenance data design, keeping storage/hosting verification separate.
