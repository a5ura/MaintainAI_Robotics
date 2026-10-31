# MaintainAI Robotics — Milestone 2 Completion Report

## A. Environment

- Existing managed **cloud Linux x86_64**, `/workspace/MaintainAI_Robotics`; not a verified Windows/Codex Desktop run.
- Python 3.12.14; Node 24.19.0; npm 11.9.0; Git 2.52.0. Reported cloud resources: 5 CPUs, ~34 GB RAM. Windows performance remains unverified.
- All packages/tools were already available. No dependency additions, paid APIs, billing activation, extra credits, Docker, hosting or cloud database provisioning. Actual account entitlement/incremental billing is not exposed and **$0 account cost cannot be certified**. Existing environment configuration was not changed or published.

## B. GitHub

- Repository: https://github.com/a5ura/MaintainAI_Robotics
- Verified base: `44f8d44bf171ad82f2250938298861e97b267836` (merged PR #2, with PR #1 ancestry).
- Branch: `feature/m2-diagnostics-maintenance`.
- Incremental implementation commits: `c183661` backend/rules/storage; `f7066f2` simulation/UI/integration; documentation/review commits follow in branch log.
- Branch push succeeded. Automated PR creation failed with `Post "https://api.github.com/graphql": Forbidden`. **No M2 PR exists or is claimed.**
- [Prefilled PR creation form](https://github.com/a5ura/MaintainAI_Robotics/compare/main...feature/m2-diagnostics-maintenance?expand=1&title=M2%3A+Multi-scenario+diagnostics+and+durable+maintenance+workflows&body=Adds+four+evidence-driven+failures%2C+seeded+replay+and+SQLite-backed+maintenance.+Verified%3A+91+backend+tests%2C+26+frontend+tests%2C+production+build%2C+7+browser+tests+and+a+real+backend+restart.+Full+description%3A+https%3A%2F%2Fgithub.com%2Fa5ura%2FMaintainAI_Robotics%2Fblob%2Ffeature%2Fm2-diagnostics-maintenance%2Fdocs%2FM2_PR_DESCRIPTION.md); [ready-to-use full PR description](M2_PR_DESCRIPTION.md). The remaining step is creating the PR from this pushed branch to main through configured API access or the GitHub web form. No merge performed.

## C. Implemented scenarios

| Scenario | Actual evidence and computation |
|---|---|
| Valid cycle | Original trajectory, pickup proof and verified normal placement; no false drop |
| Dropped Object | Preserved held → loss while grip commanded → independently verified missing placement; vacuum loss supports seal/supply hypothesis |
| Positioning Error | +0.45 m independent placement discrepancy, intended/commanded/observed targets, calibration age/event; >0.020 m rule; FK remains valid |
| Vision Failure | Acquisition timeout, stale frame/no reliable confidence, independent physical presence; does not automatically imply object loss |
| Unexpected Robot Stop | Running → protective stop at t=6 during expected motion, safety/controller events; clock/joints really freeze and later checkpoints are not reached |
| Random Failure | One deterministic Mulberry32 draw from explicit uint32 seed; selects among four faults, records active context and linked-ticket description; backend receives evidence only |

Rules preserve joint limits and 0.1 mm FK validation, distinguish observations/hypotheses/actions, rank ordinal evidence without probability claims, and suppress confidence for corrupt/conflicting data. Results support multiple anomalies (tested positioning+vision and independently verified drop+vision). Thresholds, event schema and competing explanations are documented in `ARCHITECTURE.md`. Shared generated fixtures are checked in both languages.

## D. Maintenance system

- Equipment: seeded R-01 and CELL-01 with metadata, status and ticket associations, retrieved through API and UI.
- Tickets: diagnosis-linked or manual creation; stable IDs, equipment, title/description, UTC timestamps, immutable backend evidence snapshot references.
- Repair/status: Open/In Progress/Resolved, required resolution notes, repair/operator notes, reopening and chronological event history.
- Storage: standard-library SQLite repository; `data/maintainai.sqlite3` by default, ignored, configurable via `MAINTAINAI_DB_PATH`. Equipment/diagnoses/tickets/history tables, foreign keys, parameterized queries, atomic transactions, schema v1, idempotent computed seed.
- Conflict safety: required expected version; competing stale updates return 409 without overwriting. UI reloads explicitly and disables editable fields while requests are pending. Tests verify two competing writes cannot silently corrupt history.
- Restart evidence: actual backend process was stopped and restarted with the same file. GET returned a byte-equivalent decoded ticket/detail snapshot: ticket `T-eb0743092e25413e`, version 2, three history entries, repair note and diagnosis `D-73b0b9f1722cb0a22de48abb`. Automated tests separately reopen the database/use a new FastAPI instance.
- This is **local durable storage**, not verified shared cloud persistence. Records on the same backend are shared/public, not visitor-private.

## E. UI

Scenario selection, explicit seed, Start/Pause/Reset, distinguishable outcomes, camera/stop/offset notices and checkpoint reachability extend the existing workcell. Diagnostic evidence links retain timestamps, measured context, focus/highlight and contradictions. Operations/Maintenance navigation preserves per-browser simulation state. Maintenance includes registry, incident list, ticket form/detail, status/repair workflow, history, snapshot inspection, loading/error/reload states and responsive layout. No broad redesign or full Guided Demo/overlays.

## F. Tests — fresh M2 runs

| Command / verification | Result |
|---|---|
| Baseline pytest / frontend / build before changes | 46 backend, 14 frontend passed; production build passed |
| `.venv/bin/python -m pytest backend/tests -q` | **91 passed**, one existing upstream AnyIO/Starlette deprecation warning |
| `npm --prefix frontend test` | **26 passed**, 5 files |
| `npm --prefix frontend run build` | TypeScript + production build **passed**; existing Three.js chunk-size warning (~1.06 MB / 294 KB gzip) |
| `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke` | **7 passed (1.7 min)** against the final built frontend and real restarted FastAPI; all faults, random replay, diagnosis ticket/status/notes/snapshot, conflict reload, manual ticket/API recovery, mobile layout and independent browser contexts |
| Real FastAPI process restart | **Passed**, ticket/note/history/version/evidence identical after restart |
| Isolated SQLite reopen / seed / concurrency / rollback tests | **Passed** as part of backend suite |

Intermediate failures were investigated, not hidden: one unsupported unit-test query option failed TypeScript; a status label blocked exact navigation; conflict reload allowed late responses to clear typed edits; mobile snapshot tables expanded the grid; a development hot reload interrupted random replay. The query/label/race/grid issues were fixed, with focused checks passing. Final browser verification uses the built frontend to prevent hot reload interference. No tests are intentionally disabled/skipped.

Browser evidence files: [maintenance desktop](m2-maintenance-desktop.png), [maintenance mobile](m2-maintenance-mobile.png), [vision](m2-vision.png), [stop](m2-stop.png), [drop desktop](m2-drop-desktop.png), [drop mobile](m2-drop-mobile.png). Software WebGL is not a Windows FPS benchmark. Synthetic development records from browser/restart checks remain in the ignored local database; test suites use isolated temporary databases.

## G. Acceptance

| # | Criterion | Status |
|---|---|---|
| 1 | Four selectable distinct failures | PASS |
| 2 | Reproducible Random Failure | PASS (all four covered in unit seeds; real seed replay verified) |
| 3 | Backend diagnosis computed from evidence | PASS |
| 4 | Relevant simulated visual outcomes, actual stop | PASS |
| 5 | Traceable observations/causes/contradictions/checks | PASS |
| 6 | Existing FK and trajectory integrity | PASS |
| 7 | Equipment/ticket backend APIs | PASS |
| 8 | Create tickets from diagnosis | PASS |
| 9 | Status/notes/history persist after restart | PASS |
| 10 | Independent browser simulations | PASS (real two-context check) |
| 11 | Automated + genuine integrated smoke | PASS — final suite: 7 passed |
| 12 | Run instructions/docs/status | PASS |
| 13 | No new billable dependencies/services | PASS for actions/dependencies; **UNVERIFIED account-level cost/entitlement** |
| 14 | Review PR prepared when access permits | UNVERIFIED — branch pushed and description/form ready; actual PR blocked by GraphQL Forbidden |

## H. Remaining issues

- Technical verification is complete. Final push/PR access outcome is recorded in section B; no full account-cost or hosted-storage claim.
- Windows/Desktop execution, laptop performance, account entitlement/cost, public deployment, hosted storage durability unverified.
- Reduced robot, simulated sensor/placement discrepancies and heuristic rules; no physical safety, sensor calibration or real controller claims. Rules conservatively suppress all detections on conflicting required evidence.
- SQLite schema v1 and latest-200 ticket listing are intentionally small; future migrations/backups/retention and production deployment hardening are not completed.
- M3: full live Guided Demo, advanced overlays, final UX/accessibility/performance checks, independently verified free hosting/shared durable storage and public smoke test. V2, Project 1 and video remain excluded.

## I. Recommendation

Technical implementation and regression verification are ready for Planning review, with actual PR creation blocked by GitHub GraphQL Forbidden. Do not merge automatically or call the entire V1 complete. Account-level cost uncertainty and hosted persistence remain explicit limitations.
