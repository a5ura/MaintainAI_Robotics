# Milestone 2 — Multi-scenario diagnostics and maintenance

Approved assignment: extend merged M1/stabilization, without rebuilding the app or changing PRD. Base verified at `44f8d44bf171ad82f2250938298861e97b267836` (PR #2). Branch `feature/m2-diagnostics-maintenance`. Actual execution: existing cloud Linux workspace, not verified Desktop/Windows.

## Implemented scope

- Existing Dropped Object plus Positioning Error, Vision Failure, Unexpected Robot Stop, Valid Cycle and seeded Random Failure.
- Structured typed placement/camera/controller/event evidence; deterministic rules, multi-anomaly results, competing causes and traceable references; preserved FK/limits and inconclusive handling.
- Existing workcell/controls extended with meaningful outcomes and interrupted motion; scenario/seed context recorded per browser.
- API-backed equipment and diagnosis-linked/manual maintenance tickets, statuses, repair/operator notes, resolution notes, history and immutable evidence snapshots.
- Standard-library SQLite repository, configurable ignored file, schema v1, transactional idempotent seed, parameterized queries, foreign keys, optimistic version conflict rejection and temporary test databases.

## Acceptance checklist

Final PASS/FAIL/UNVERIFIED results, actual commands/counts and PR status are maintained in `M2_COMPLETION_REPORT.md`. Technical acceptance requires all four evidence-driven failures, deterministic random replay, real UI/API integration, local restart durability, independent browsers and regression verification. Local persistence never substitutes for V1 hosted shared durability.

## Verification commands

From repository root:

```sh
.venv/bin/python -m pytest backend/tests -q
npm --prefix frontend test
npm --prefix frontend run build
# With loopback backend/frontend started per README:
CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke
```

Use README Windows equivalents; Windows execution is unverified. Backend tests use isolated tmp paths, including database reopening/new app instances and concurrent competing versioned updates. Browser tests use actual services, not hardcoded diagnostic responses. Development records created by smoke tests are synthetic review data in the ignored development database.

## Boundaries and deferred work

No public hosting, cloud database provisioning, full Guided Demo, advanced overlays, broad redesign/final polish, ROS/TF/bag, hardware/real controller/Linux collectors, advanced physics/IK/planning, paid APIs, login/identity, Project 1 or video work. No dependency additions or paid resources activated. Cloud/public shared persistence, deployment, final UX/performance/accessibility pass and remaining approved V1 release requirements remain M3; V2 is deferred. Account entitlement/actual billed cost cannot be certified by repository tests.
