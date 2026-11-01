# Phase B.0 anonymous-demo security

No login is added; V1 remains anonymous and synthetic. Parameterized SQL, shared evidence/domain validation, immutable manifest/chunk reconstruction, optimistic ticket versions and stable Guided Demo request IDs apply across adapters. No diagnostic algorithm or product scope was changed.

## Implemented local controls

- `PostgresPolicy` reserves durable UTC-day budgets atomically in PostgreSQL: 2,000 requests, 250 writes, 64 MiB snapshot bytes including existing conservative overhead. Exhaustion returns safe 429/Retry-After. Reservations intentionally need not refund a failed request; fail closed rather than permit quota races. Health/readiness are separate and not charged.
- `DEMO_READONLY=1` rejects mutations before DB access; no silent local fallback. Seeded demo incidents cannot be modified. No public delete/reset/migration/restore route exists.
- Writes check `pg_database_size` against 512 MiB default. This is a high-water operating guard, not an atomic project-wide quota or retention solution. Concurrent requests/counter writes can overshoot slightly; physical bloat and other databases need monitoring. The provider's verified hard limits must remain the final no-spend boundary.
- Existing pre-JSON 2 MiB body limit applies to Content-Length and streamed bodies; a real chunked oversized request returned 413. Approved maximum telemetry/evidence still fits; responses can exceed 2 MiB and are not truncated.
- Bounded 200-record keyset ticket/history pages and cached equipment counts; pool maximum 4 (configurable 1–8), 20 waiting connections, finite connect/statement/lock timeouts. Uvicorn one worker/concurrency 20, application admission one active request/process bounds parsing/diagnosis memory; cross-process SQL provides correctness.
- Remote TLS hostname/CA verification and preserved channel binding. Errors sanitize SQL/credentials. Server secret DATABASE_URL never appears in frontend configuration. Explicit HTTPS origins are required in hosted mode; SQLite entry point rejects hosted mode.
- Readiness verifies schema without migrations. Liveness performs no DB call and should be the provider health check, to avoid permanently waking Neon.
- Optional static routes enforce root containment and keep unknown `/api` routes as API 404s. Browser network/wake failures are understandable; no automatic mutation retry is introduced.

## Operational controls and residual risks

Use a dedicated runtime role with only SELECT/INSERT/UPDATE and needed sequence rights; migrations/fixture recovery require an isolated owner context. A restricted local role was tested; provider permissions remain unverified. Never use local trust authentication outside loopback disposable testing.

Global budgets can be consumed maliciously; they do not identify visitors or guarantee availability. CORS is browser policy, not authentication. Body size does not limit connection duration: provider request timeouts/IP throttling and included firewall/rate limits must be verified before exposure. Health and readiness could also be abused; readiness causes DB activity. Database traffic, transfer, logs, static builds and storage need account-level hard limits. No paid bot/rate service was activated.

Possible no-cost future defenses include provider-included IP throttling/firewall and explicit endpoint limits, with privacy/NAT tradeoffs, but these are neither configured nor claimed available. Operator monitoring, emergency read-only, protected backups, and separately approved retention are necessary. No automatic purge or reduced V1 accepted input limits were introduced. If permanent anonymous writes cannot remain defensibly free, return the fallback decision to Planning.

Trusted native backups can execute database code: restore only protected archives to a new isolated destination. Synthetic JSON fixture restores reuse fail-closed A.2 preflight and transaction rollback, with complete before/after comparisons. No public restore endpoint, real-data migration, hosted secret, new resource or deployment was created.
