# Milestone 1 Stabilization Report

## Repository and baseline

- Repository: https://github.com/a5ura/MaintainAI_Robotics
- Branch: `fix/m1-stabilization`.
- Verified base: `ad1fdfe0b162c324883850974ef1ca0c6bdb9c2e` on fetched `origin/main`.
- M1 PR #1: https://github.com/a5ura/MaintainAI_Robotics/pull/1 — merged, verified by fetched merge subject and both parents (initial main and M1 feature tip). GitHub API metadata remains unavailable.
- Stabilization commits: use this branch's `git log`; review PR creation is pending the authenticated API attempt. No stabilization merge authorized or performed.

## Actual execution

Existing managed cloud Linux x86_64 environment, `/workspace/MaintainAI_Robotics`. Python 3.12.14, Node 24.19.0, npm 11.9.0, Git 2.52.0. Codex Desktop/Windows execution and laptop performance are unverified. Published environment configuration was not modified or republished.

## Findings addressed

**A — Documentation:** Corrected current PR #1 merged state and exact merge SHA; retained original API failures and original 19-backend/10-frontend/1-browser outcomes as historical reports, not fresh executions. Annotated the historical completion report and documented current stabilization implementation separately.

**B — Kinematics:** Independent lightweight Python reproduction of the approved 3-axis geometry; inclusive ±1/±1.4/±2 rad joint limits. Euclidean TCP error tolerance is 0.0001 m (0.1 mm) with only 1e-12 m absolute floating-point boundary slack. Shared golden poses test frontend/backend consistency. Structurally invalid/nonfinite data returns 422. Finite but inconsistent telemetry returns 200/inconclusive, failure null, per-evidence warnings and per-row integrity details; cause ranking is suppressed for inconsistent kinematics. Huge finite vectors fail gracefully without overflow. Normal and coherent dropped-object behavior is preserved.

**C — Traceability:** Supporting/contradicting and observation reference links identify timestamped rows. Accessible descriptions/tooltips expose phase, command, object sensor, vacuum and verification. Native links focus/highlight the corresponding timeline row, with FK consistency visible. Limited or contradictory support is labelled explicitly; missing references are marked unavailable. Existing layout and architecture retained; no new frontend infrastructure.

## Fresh stabilization verification — October 31, 2026

| Exact command | New result |
|---|---|
| `.venv/bin/python -m pytest backend/tests -q` | **46 passed**, 1 existing upstream AnyIO/Starlette deprecation warning |
| `npm --prefix frontend test` | **14 passed**, 3 files |
| `npm --prefix frontend run build` | TypeScript + production build **passed**; existing large-bundle warning (~1.04 MB JS / 290 KB gzip) |
| `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke` | **1 passed** (28.0 s); actual normal/fault backend integration, pause/resume/reset, link navigation/focus, pressure and FK cell contents, responsive width, no page errors |
| `git diff --check` | Passed |

Backend additions: 27 parametrized cases covering shared valid poses, TCP mismatch in normal/fault cycles, all six joint-limit boundaries and violations, inclusive TCP tolerance boundary, Euclidean rather than per-axis error, nonfinite inputs, vector dimensions and huge finite values. Existing 19 detector/API checks retained with physically coherent fixtures. Frontend additions: 1 shared FK-fixture check plus 3 traceability component checks, with real integrated hypothesis navigation in the browser test.

Browser evidence: [desktop](stabilization-desktop.png), [mobile](stabilization-mobile.png). Software WebGL Chromium was actually executed; these are not Windows performance measurements. Test/client socket operations required execution sandbox escalation. No new failed tests remain in this stabilization run.

## Files and scope

- Backend: `kinematics.py`, `app.py`, corrected detector fixtures, new `test_kinematics.py`.
- Frontend: new `EvidenceReferences` component/tests; App/type/style integration; shared model fixture test; tsconfig JSON import support; updated browser regression.
- Shared: `fixtures/kinematics.json`.
- Docs: current status, architecture, decision notes, historical report annotation, refreshed computed sample, this report, PR description and new screenshots.

Approved PRD, V1 roadmap, Project 1, package manifests and dependency locks unchanged. No M2/V2, hosting, database or paid dependency introduced.

## Remaining limitations and recommendation

Account entitlement/actual incremental cost, Windows/Codex Desktop performance, public deployment and persistent cloud storage remain unverified. No purchase, billing activation, paid API, additional credits or new infrastructure was performed. FK checks validate position and joint bounds for the simplified model, not collisions, dynamic limits, real sensors or physical safety. The 0.1 mm tolerance is simulation-specific.

Recommendation: **technical fixes ready for Planning review**, with PR availability subject to GitHub API access. No automatic merge.
