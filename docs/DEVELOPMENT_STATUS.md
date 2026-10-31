# Development status — October 31, 2026

## Current M2 baseline and execution — independently verified

- Fetched `origin/main` includes PR #2 merge `44f8d44bf171ad82f2250938298861e97b267836`, with PR #1 and stabilized M1 in its ancestry. PR #2: https://github.com/a5ura/MaintainAI_Robotics/pull/2 — merged, verified from Git merge history. API merged-at metadata remains unavailable.
- M2 branch: `feature/m2-diagnostics-maintenance`, created from that clean verified main. Main is not modified or merged by this task.
- Execution: existing managed cloud Linux x86_64, `/workspace/MaintainAI_Robotics`; Python 3.12.14, Node 24.19.0, npm 11.9.0, Git 2.52.0. Cloud-reported 5 CPUs and ~34 GB memory; these are not Windows laptop measurements or guaranteed limits.
- Baseline before behavior changes: 46 backend tests, 14 frontend tests, TypeScript/production build passed.
- Implementation commits: `c183661` (backend/rules/storage) and `f7066f2` (simulation/UI/integration), followed by documentation/review commits.
- Four evidence-driven failures, deterministic seeded random selection, maintenance APIs/UI and local durable SQLite are implemented. Full fresh verification and PR/access status: [M2 completion report](M2_COMPLETION_REPORT.md).
- Real FastAPI stop/restart verification preserved ticket `T-eb0743092e25413e`, version 2, three history events, operator note and immutable linked diagnosis/evidence. This proves the local file survives that process restart, not cloud durability.
- No environment configuration was reapplied or published, and no new dependency, paid API/service, billing, credits, hosting or cloud database was activated. Account entitlement/actual incremental charges remain unverified.

## Historical stabilization GitHub state

- PR #1: https://github.com/a5ura/MaintainAI_Robotics/pull/1 — **merged into main**.
- Merge commit: `ad1fdfe0b162c324883850974ef1ca0c6bdb9c2e`, fetched from `origin/main`. Its parents are initial main `cbba271e95e86cabf3e152793140faec67c63a34` and M1 tip `940a183ff0362fe3d4c221b3e3c346c90c63f37b`; commit subject identifies PR #1. This is Git-history verification; API metadata such as exact merged-at time remains unavailable (`Forbidden`).
- Stabilization branch: `fix/m1-stabilization`, created from that verified merge, with a clean working tree before edits. No stabilization merge performed.
- Actual stabilization execution: published environment's existing managed cloud Linux workspace `/workspace/MaintainAI_Robotics`; Python 3.12.14, Node 24.19.0, npm 11.9.0, Git 2.52.0. This does not verify Codex Desktop or Windows execution.
- Stabilization branch pushed at implementation commit `ba77812`; automated new PR creation failed with `Post "https://api.github.com/graphql": Forbidden`. At the original stabilization handoff no PR had been created by the coding agent; the user subsequently created and merged PR #2, as verified above.
- Current stabilization results and review status: [stabilization report](STABILIZATION_REPORT.md).

## Historical M1 execution and repository

- Execution: existing managed cloud Linux x86_64 environment, **not** a verified Codex Desktop/Windows execution. No new environment was provisioned.
- Workspace: `/workspace/MaintainAI_Robotics`.
- Project 2 repository: https://github.com/a5ura/MaintainAI_Robotics (separate from Project 1).
- Base: `cbba271e95e86cabf3e152793140faec67c63a34` (Initial commit). Clean initial checkout contained README and LICENSE only. Remote main matched base; no newer remote branches existed during preflight. PR enumeration was blocked by API access.
- Feature branch: `feature/m1-robot-simulation-diagnostics`.
- At original implementation handoff, main had not been changed by the coding agent. The user subsequently merged PR #1; see current state above.
- Initial implementation commit: `003bf70`; subsequent evidence/report fixes are on this feature branch (use `git log` for exact current hashes).
- Git read and feature-branch push verified. GitHub REST request and `gh pr create` failed with `Forbidden` at `api.github.com`; This was the original PR creation blocker, subsequently resolved by the user for PR #1. Do not infer current API authorization from successful native Git authentication.
- Python 3.12.14, Node 24.19.0, npm 11.9.0, Git 2.52.0. Cloud reports 5 processors and approximately 34 GB memory, not laptop capacity or guaranteed limits.
- Windows laptop execution and performance remain unverified. README includes PowerShell commands.

## Historical M1 implementation

M1 technical vertical slice implemented: React/TypeScript/Tailwind/Three.js/R3F workcell, 3-axis joint trajectories, analytic FK plus rendered transform checks, live sensors, Start/Pause/Reset, four verification checkpoints, deterministic Dropped Object scenario, stateless FastAPI correlation, observations, competing hypotheses, evidence timeline, operator checks, and recoverable backend error state.

## Historical M1 verification — previously reported, not fresh stabilization runs

| Command / check | Result |
|---|---|
| `.venv/bin/python -m pytest backend/tests -q` | 19 passed; one upstream AnyIO/Starlette deprecation warning |
| `npm --prefix frontend test` | 10 passed across 2 files |
| `npm --prefix frontend run build` | Passed TypeScript and production build; Three.js bundle approximately 1.04 MB / 290 KB gzip, with chunk-size warning |
| `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke` | 1 real integrated test passed: normal cycle, pause/resume, reset, dropped-object cycle, backend response, UI evidence, responsive layout and no page errors |
| Local FastAPI HTTP request | 200, computed `detected` response; sample saved in `sample-diagnosis.json` |
| Git feature push | Succeeded |
| Original automated GitHub PR creation attempt | Blocked: `Post https://api.github.com/graphql: Forbidden` |

The first Playwright 1.52 runner stalled under Node 24; updating to 1.64.1 restored discovery. An intermediate browser run was interrupted by source-edit hot reload and timed out; the subsequent stable-source integrated run passed. Backend socket-based tests and browser/service commands required the available execution sandbox escalation; sandbox restrictions did not indicate an application fault.

Review screenshots: [desktop](m1-desktop.png), [mobile](m1-mobile.png). Chromium used software WebGL; this is not a laptop FPS/performance benchmark. The FK test traverses actual rendered component transforms, compared with independently defined expected poses and analytic telemetry. Speed/acceleration tests enforce 1.6 rad/s and 5 rad/s² bounds on the selected trajectory.

## Historical M1 acceptance summary (with current PR correction)

PASS: running frontend/backend; repeatable pick/place; joint/FK/render consistency; Start/Pause/Reset; four checkpoints; reproducible dropped-object failure; computed detection; traceable observations/hypotheses/checks; malformed/missing/conflicting telemetry handling; automated tests; browser integration; responsive screenshots; run documentation; full V1 PRD preservation; committed/pushed feature branch.

RESOLVED for M1: the original automated PR attempt was blocked by API access, but the user created and merged PR #1. Its original PR body remains in `PR_DESCRIPTION.md` as history. Automated API access still returns Forbidden in stabilization; this is separate from PR #1's merged state.

UNVERIFIED: execution through Codex Desktop, Windows run/performance, account incremental cost/entitlement, public hosting, shared persistent storage, deployment. M1 is technically implemented and verified in this cloud instance, not a claim of full V1 completion.

## Cost and remaining scope

No purchases, paid APIs, billing activation, hosting/storage provisioning, or extra credits were performed. Dependencies are freely installable; no paid runtime service is required. Account entitlement and actual billed incremental cost are not exposed to this session, so **$0 account cost cannot be certified**. Do not activate a chargeable service or continue after an allowance is exhausted.

M2 now implements all four failures, Random Failure, equipment/tickets/history and local SQLite persistence. Remaining V1: verified shared persistent cloud records, engineering overlays, full Guided Demo, public production deployment and final UX/accessibility/performance validation. Full approved requirements remain in `PRD.md`. V2, Project 1, and video work are deferred.

Next milestone recommendation after M2 review: full Guided Demo, advanced overlays and final UX/performance/accessibility pass, with verified zero-cost deployment/storage preparation. Separately verify free hosting/storage terms, no billing requirement, quotas, sleep behavior, and durability across restart/redeploy before deployment. No provider is yet verified.
