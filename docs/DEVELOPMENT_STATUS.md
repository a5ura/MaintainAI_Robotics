# Development status — November 1, 2026 UTC

## Current Phase B.1 checkpoint — November 1, 2026 (America/New_York)

B.0 PR #8 is merged at `8d39f2af9dee9a1d21d658950ddb15a228651848`. B.1 branch `feature/v1-hosting-phase-b1` prepares one same-origin Render Free Python service plus external Neon Free: production frontend build, hosted route/static/CORS hardening, restricted runtime SQL and constrained real PostgreSQL rehearsal. SQLite/D1, PRD, robot and diagnostic algorithms remain intact. See [B.1 setup](DEPLOYMENT_PHASE_B1.md), [completion](PHASE_B1_COMPLETION_REPORT.md) and future-only [B.2 runbook](PHASE_B1_HOSTED_RUNBOOK.md).

No user-facing data/report download exports exist in merged V1; this B.1-listed workflow is an explicit pre-existing acceptance gap, not a passing check. Keep it open for a bounded correction before public release. Render current Free/runtime terms and all account/card/hard-cap eligibility remain unverified. No provisioning, billing, deployment, production migration, environment publication or merge. Hosted verification requires separate B.2 authorization; anonymous availability cannot be guaranteed by global quotas. Earlier checkpoint text below is historical.

## Historical Phase B.0 checkpoint — November 1, 2026 UTC

Main includes merged A.2 PR #7 at `8b8491035cfcf388378376dd8b9b2e649dcfed94`. Branch `feature/v1-hosting-phase-b0` adds a native async Psycopg/PostgreSQL adapter and explicit FastAPI hosting entry point while preserving SQLite, D1, diagnostic algorithms and the approved PRD. Real local PostgreSQL integration, independent API/process/database restart, immutable full evidence, concurrency, idempotency and protected backup/recovery are tested in managed Linux. Desktop/Windows and hosted durability remain unverified. See [B.0 setup](DEPLOYMENT_PHASE_B0.md), [adapter](POSTGRESQL_ADAPTER.md), [hosting gates](PHASE_B0_HOSTING_DECISION.md) and [completion report](PHASE_B0_COMPLETION_REPORT.md).

Render Free + Neon Free + free static hosting is provisional: Render current terms and all account-level Free/card/automatic-billing eligibility remain unverified. No public deployment, provisioning, billing activation, real-record migration, environment publication or merge is authorized/performed. No new Cloudflare/Pyodide access route was attempted. Anonymous quotas and a storage high-water guard do not guarantee permanent availability; release still requires provider/account, abuse, backup and hosted verification. Earlier checkpoint text below is historical.

## Historical Phase A.2 checkpoint

Baseline: merged PR #6 `966c809d6f716949c3183f84bb39ce970071a266`. Branch `feature/v1-deployment-phase-a2`, existing managed Linux. Lossless immutable chunked snapshots, atomic corrected storage charging, bounded maintenance queries/UI pagination, migration and synthetic recovery are implemented locally. The single authorized index check still returns CONNECT 403; no retry loop or runtime proof is claimed. [A.2 completion report](PHASE_A2_COMPLETION_REPORT.md) records current tests, measurements, hosting ranking and GitHub outcome. PRD/Project 1/V2 unchanged; public V1 remains unreleased.


## Historical Phase A.1 checkpoint

Main includes merged PR #5 `e940a834857580d28791d3af50ea53d84d5d115c`. Branch: `feature/v1-deployment-phase-a1`, existing managed Linux. Minimal actual-CLI online/offline probes remain blocked before Worker initialization by enforced index access and unavailable SDK cache. Conditional expansions deferred under the explicit runtime-first gate; app/PRD unchanged. See [A.1 completion report](PHASE_A1_COMPLETION_REPORT.md) for current regression and GitHub results. Older Phase A PR-access statements below are historical; PR #5 is now merged.



## Historical Deployment Phase A checkpoint

- M1/M2/M3 are complete and merged. Fetched `origin/main` includes M3 PR #4 merge `a33811f060d165ac5758966eda9be06e215d9171`, including manual takeover fix `a9491d5`. Older PR-access statements below describe their original checkpoints, not current merge status.
- Phase A branch: `feature/v1-deployment-feasibility`, created from that clean main. Existing managed Linux workspace; Windows/Desktop execution and account costs remain unverified.
- One shared async HTTP/domain boundary; native SQLite retained; local D1 schema/adapter, atomic history triggers, shared quotas/read-only/seed protection and synthetic recovery tooling added. No frontend feature changes.
- Verification: 97 native backend tests, 39 frontend tests, TypeScript/production build, 44 new adapter/integrity/policy/static-asset/recovery tests, actual emulator restart and 15 Chromium tests against CPython + genuine local D1 pass. Baseline also passed 15 Chromium tests against SQLite.
- **Actual Python Workers startup is blocked** by the required Pyodide package index being denied by the proxy; no Wasm endpoint or billed CPU/memory result is claimed. Dense valid evidence exceeds D1's row cap and is explicitly rejected without truncation; the adapter is incomplete for that input class. SDK pre-ASGI upload buffering, large-data read accounting and anonymous availability remain release gates.
- **CONDITIONAL GO** for further technical investigation, not deployment approval. No public URL, provider resource, billing activation, real record migration, environment publication or automatic merge. PRD/Project 1/V2 unchanged.
- Source pushed on the Phase A branch; `gh pr create` returned `Post "https://api.github.com/graphql": Forbidden`, so no Phase A PR is confirmed. Prepared body and compare link are in the report.
- Current Git handoff, exact evidence, limitations and next action: [Deployment Phase A report](DEPLOYMENT_PHASE_A_REPORT.md). Public V1 release remains incomplete.

## Historical M3 implementation checkpoint

- Verified `origin/main` includes M2 PR #3: https://github.com/a5ura/MaintainAI_Robotics/pull/3, merged at `76e00f2c6396f7a5614baeb1434449b88e543ca0` (parents: PR #2 merge `44f8d44bf171ad82f2250938298861e97b267836` and M2 tip `7f2fcb53f32319eba78a22a489cdd7bbb2a352ef`). This is fetched Git merge-history evidence, not API merged-at metadata.
- M3 branch: `feature/m3-experience-release`; clean baseline; no reset of user work, additional worktree or automatic merge.
- Execution remains existing managed cloud Linux x86_64, `/workspace/MaintainAI_Robotics`; Python 3.12.14, Node 24.19.0, npm 11.9.0, Git 2.52.0. Windows/Desktop and account cost remain unverified.
- Baseline before M3 behavior changes: 91 backend tests, 26 frontend tests and production build passed. Current implementation adds live guidance, engineering tools and release safeguards; fresh results are in M3_COMPLETION_REPORT.
- Fresh M3 verification: 97 backend tests, 36 frontend tests, production build and 13 real Chromium tests passed. No skipped tests; existing upstream deprecation/3D chunk-size warnings remain.
- Source commits: `5e094bd` retry-safe ticket/security helpers, `164df80` guided/engineering UI, followed by final readability/docs/review commits.
- Real process-restart check retained guided ticket `T-189937a33c5d56fb89d3247920ed5670`, version 2, repair note/history and diagnosis `D-973774d225afd7785d537ddd` with its immutable evidence. This is local SQLite proof, not hosted redeploy durability.
- Deployment: **not performed / blocked**. HOSTING_DECISION records official-source evidence, candidate comparisons and exact account/network/runtime/adapter gates. No provider, billing, credentials, record migration, public URL or environment publication was activated.
- M3 branch pushed; automated PR creation returned `Post "https://api.github.com/graphql": Forbidden`. No M3 PR or merge is claimed; a prefilled web form and description are provided in the report.
- Current review/PR status and acceptance: [M3 completion report](M3_COMPLETION_REPORT.md); full public V1 remains incomplete until release gates pass.

## Historical M2 baseline and execution

- Fetched `origin/main` includes PR #2 merge `44f8d44bf171ad82f2250938298861e97b267836`, with PR #1 and stabilized M1 in its ancestry. PR #2: https://github.com/a5ura/MaintainAI_Robotics/pull/2 — merged, verified from Git merge history. API merged-at metadata remains unavailable.
- M2 branch: `feature/m2-diagnostics-maintenance`, created from that clean verified main. Main is not modified or merged by this task.
- Execution: existing managed cloud Linux x86_64, `/workspace/MaintainAI_Robotics`; Python 3.12.14, Node 24.19.0, npm 11.9.0, Git 2.52.0. Cloud-reported 5 CPUs and ~34 GB memory; these are not Windows laptop measurements or guaranteed limits.
- Baseline before behavior changes: 46 backend tests, 14 frontend tests, TypeScript/production build passed.
- Implementation commits: `c183661` (backend/rules/storage) and `f7066f2` (simulation/UI/integration), followed by documentation/review commits.
- Four evidence-driven failures, deterministic seeded random selection, maintenance APIs/UI and local durable SQLite are implemented. Fresh checks: 91 backend tests, 26 frontend tests, TypeScript/build and 7 integrated Chromium tests passed. Branch pushed; new PR creation failed with `Post "https://api.github.com/graphql": Forbidden`. No M2 PR exists or was merged. Full fresh verification and PR/access status: [M2 completion report](M2_COMPLETION_REPORT.md).
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
