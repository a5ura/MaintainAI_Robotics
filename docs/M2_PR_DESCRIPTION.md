## Summary

Extends stabilized M1 with multi-scenario diagnostics and database-backed maintenance workflows, preserving joint trajectories, forward kinematics and evidence traceability.

- Adds Positioning Error, Vision Failure and Unexpected Robot Stop alongside Dropped Object and Valid Cycle. Seeded Random Failure reproducibly selects one of four faults; no answer label is sent to the diagnosis engine.
- Adds typed placement/camera/controller/event evidence and independent deterministic rules, including multiple anomalies and conservative inconclusive results. Vision failure does not imply physical object loss; protective stop actually freezes the arm.
- Adds equipment, diagnosis-linked/manual tickets, status transitions, repair/resolution notes, history and immutable evidence snapshots through FastAPI and standard-library SQLite.
- Adds idempotent seeding, configurable local storage, transactional parameterized queries, FK constraints and optimistic version checks. Stale edits require reload; no silent overwrites.
- Extends the existing UI with maintenance navigation and responsive ticket/evidence views. Full PRD and dependencies unchanged; no M3/V2 scope.

## Verification

- Baseline: 46 backend / 14 frontend tests and build passed before edits.
- Final: **91 backend tests**, **26 frontend tests**, TypeScript/production build passed.
- **7 real Chromium integration tests passed**: normal/drop regression, positioning-to-ticket workflow, conflict recovery, status/notes/history/snapshot, vision, actual stop, seeded replay, independent contexts, manual ticket/API error recovery and responsive layout.
- Actual FastAPI process restart preserved ticket, version, repair note, history and linked evidence snapshot. Isolated database reopen, idempotency, concurrency and rollback tests passed.
- Review details and screenshots: [completion report](https://github.com/a5ura/MaintainAI_Robotics/blob/feature/m2-diagnostics-maintenance/docs/M2_COMPLETION_REPORT.md).

## Limitations

Local SQLite is not verified hosted/shared cloud durability. Windows/Codex Desktop performance and account-level entitlement/cost remain unverified. No dependencies, paid services, billing or infrastructure added. Existing upstream deprecation and ~1.06 MB Three.js bundle warning remain. Production hosting/storage, full Guided Demo, overlays and final release polish are deferred; all V2 excluded.

For Planning review. Do not merge automatically.
