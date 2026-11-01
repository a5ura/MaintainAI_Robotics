## Problem and result

Prepare V1 for native Python hosting with durable shared PostgreSQL while retaining the existing SQLite and D1 paths. This adds a real async Psycopg adapter, explicit migrations, transactional evidence/history/quota integrity, bounded native FastAPI runtime, optional same-origin SPA serving and review-only hosting configuration. Diagnostic algorithms and approved PRD are unchanged.

## Validation

- 220 backend/D1/PostgreSQL tests; 43 frontend tests; TypeScript/production build.
- 16 passed against native PostgreSQL and 16 passed, 0 failed/skipped (2.6 minutes) against SQLite, actual Chromium.
- Real PostgreSQL two-process/API+database restart, competing writes/idempotency, full-size Unicode evidence, fail-closed fixtures and native archive round trip with full-table fingerprints.
- Local measurements include 11 payload cases, 7,500 retained tickets and 1,001 history events.

See [completion report](https://github.com/a5ura/MaintainAI_Robotics/blob/feature/v1-hosting-phase-b0/docs/PHASE_B0_COMPLETION_REPORT.md), [setup](https://github.com/a5ura/MaintainAI_Robotics/blob/feature/v1-hosting-phase-b0/docs/DEPLOYMENT_PHASE_B0.md), [adapter](https://github.com/a5ura/MaintainAI_Robotics/blob/feature/v1-hosting-phase-b0/docs/POSTGRESQL_ADAPTER.md) and [hosting decision](https://github.com/a5ura/MaintainAI_Robotics/blob/feature/v1-hosting-phase-b0/docs/PHASE_B0_HOSTING_DECISION.md) for reproduction/evidence.

## Release boundary

Render Free + Neon Free + free static hosting is provisional. Render current terms and all account-level Free/card/billing eligibility are unverified; hosted cold starts, resource headroom, redeploy durability, backups and anonymous quota abuse remain release gates. No deployment, hosted resources, billing, actual-record migration, scope expansion or merge. No new spending action. Review only; do not deploy this manifest.
