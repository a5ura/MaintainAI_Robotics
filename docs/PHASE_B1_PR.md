## Result

Prepare the existing V1 for a single same-origin Render Free Python service with external Neon PostgreSQL. The manifest now builds/serves the production frontend, hosted routes/static caching/CORS are hardened, and explicit restricted runtime grants and a resource-limited real PostgreSQL/SCRAM rehearsal are supplied. SQLite, D1, PRD, robot and diagnostic algorithms are preserved.

## Validation

- 228 Python/backend/D1/real-PostgreSQL tests; 43 frontend tests; exact host build script and TypeScript/production build pass.
- 16 Chromium tests against constrained production startup/restricted PostgreSQL; 16 passed, zero failed/skipped (2.6 min) against SQLite.
- Real two-process/API/database restart, complete full-size evidence, safe unavailable/wrong credentials, quotas/read-only/schema failure and full-fingerprint backup/restore checks pass.

## Open acceptance and release gates

B.1 lists data/report exports, but merged V1 contains no user-facing download/export controls. This pre-existing product acceptance gap is explicitly reported; API JSON/backups are not counted as UI exports. A bounded correction is needed before fully accepting V1. Current Render Free/runtime terms and all account/card/billing/hard-cap eligibility remain unverified; hosted behavior and anonymous availability need separate approval/testing.

No resources, billing, deployment, real-record migration or merge. Review only; do not import the manifest. Complete report, exact tests and future B.2 runbook: [completion report](https://github.com/a5ura/MaintainAI_Robotics/blob/feature/v1-hosting-phase-b1/docs/PHASE_B1_COMPLETION_REPORT.md) and [future runbook](https://github.com/a5ura/MaintainAI_Robotics/blob/feature/v1-hosting-phase-b1/docs/PHASE_B1_HOSTED_RUNBOOK.md).
