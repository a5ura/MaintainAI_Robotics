# MaintainAI Robotics — Project 2 V1

Read `docs/PRD.md` (full approved October 31, 2026 handoff), `docs/DEVELOPMENT_STATUS.md`, and the assigned milestone before editing. Project 1 (`a5ura/MaintainAI`) is separate. V2 is deferred. Planning owns scope; Coding returns implementation evidence.

- Exactly $0 incremental spending. Do not enable billing, paid APIs, credits, hosting, or infrastructure. Use available included tooling; report exhausted allowances.
- Record actual execution location; Desktop does not imply cloud. Keep laptop workloads modest. No ROS, physics engine, GPU dependency, or LLM is needed.
- Preserve user work. Use the existing isolated checkout; no new worktree unless requested. Use feature branches, meaningful commits, reviewable PRs. Never merge without user instruction.
- Synthetic inputs are allowed; compute diagnoses from evidence. Distinguish observations, hypotheses, actions; no calibrated-probability claims.
- FK, rendered transforms, joint values, and telemetry must agree. Preserve deterministic replay and independent browser sessions.
- Run `python -m pytest backend/tests -q`, `npm --prefix frontend test`, and `npm --prefix frontend run build`. Run the documented real browser smoke check after integrated changes. Report exact results; do not claim checks that did not run.
- Do not claim hosting, shared persistence, PR creation, Desktop execution, or zero account cost without verification. Keep full later-V1 requirements in PRD/status.

## Milestone 2 implementation boundaries

- Backend rules live in `backend/diagnostics.py` and `backend/rules.py`; API schemas in `models.py`. Keep scenario labels out of rule decisions.
- `Repository` is the local SQLite adapter. Keep transactions, foreign keys, immutable diagnosis snapshots, and optimistic ticket versions. Tests must use temporary database paths/dependency overrides; never development records.
- Default DB is ignored `data/maintainai.sqlite3`; `MAINTAINAI_DB_PATH` overrides it. Local durable data does not complete hosted shared persistence.
- `fixtures/scenarios.json` is the frontend/backend contract. Regenerate with the existing esbuild CLI from `src/scenarios.ts` when evidence generation intentionally changes, then run both language suites.
- Random seed selection is per browser; debug scenario/seed appear in run context and diagnosis-linked ticket descriptions. No global active robot session.
- No M3 deployment, cloud storage, full Guided Demo, overlays, or V2 work without a new assignment.

## Milestone 3 experience and release gate

- M3 is authorized by its bounded assignment: preserve interactive default, real backend guidance, optional engineering tools and no automatic Git merge.
- Guide state/reducer and effect orchestration are separate; do not fabricate a result for Skip to Results. Cancel old UI sequences on reset/takeover; submitted writes may complete and must use stable retry IDs.
- Engineering positions, transforms and path derive from the existing joint model. Keep overlays off by default, keyboard equivalents for 3D picking, on-demand rendering and independent FK tests.
- `MAINTAINAI_PUBLIC_DEMO=1` enables only a per-process write budget, not production security. Tests must use temporary DBs; retention is dry-run unless explicitly applied with a fresh backup.
- Public hosting is gated by `docs/HOSTING_DECISION.md` and `docs/RELEASE_CHECKLIST.md`. No provider was provisioned. Do not equate local SQLite restart tests with hosted redeploy durability or assume a free-tier label proves no billing risk.
