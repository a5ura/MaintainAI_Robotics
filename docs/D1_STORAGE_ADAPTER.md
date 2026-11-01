# D1 storage prototype

## Current Phase A.2 checkpoint — November 1, 2026 UTC

Phase A.1 PR #6 is verified merged at `966c809`. Phase A.2 explicitly authorizes local storage hardening despite the unchanged index CONNECT 403, superseding A.1's deferred-expansion gate for this assignment. New D1 schema v2 provides atomic immutable manifest/chunks, verified reconstruction and quota charging; the large-evidence row-size defect is resolved locally. Default snapshot allowance is now 64 MiB/day including conservative logical overhead. Cached counts, indexed 200-record ticket/history pages and UI continuation preserve drafts and the native SQLite workflow. Legacy inline evidence and synthetic migration/backup/restart remain supported.

Actual Python Workers/JS binding execution, billed CPU/memory, pre-ASGI streamed body enforcement, account Free-only terms and hosted durability remain unverified. The total 500 MB Free storage/retention and anonymous availability gates are not solved by a daily budget. No deployment, resource provisioning, billing, real-record migration, environment publication or merge. Current evidence: [A.2 report](PHASE_A2_COMPLETION_REPORT.md) and [details](PHASE_A2_STORAGE_REPORT.md). Earlier checkpoint statements below are historical, including the previous single-row restriction and 2 MiB/day default.


**Status: locally tested domain/integrity prototype; incomplete for oversized evidence and unverified in Python Workers.** No remote database exists from this task. Schema version 1 lives in `cloudflare/migrations/0001_domain.sql`; all IDs in Wrangler configuration are explicit placeholders.

## Shared boundary

`backend/http_api.py` calls the same equipment, save-diagnosis, list/create/detail/update-ticket contract. `backend/domain.py` owns ID generation, retry-content checks, transitions, note requirements, UTC timestamps and computed deterministic seeds. SQLite remains `backend/repository.py`; D1 is `backend/d1_repository.py`. There is no second diagnostic algorithm or second ticket business-rule implementation.

D1 methods: `check_schema`, explicit `initialize`, `equipment`, `save_diagnosis`, `list_tickets`, `create_ticket`, `ticket`, `update_ticket`, plus policy `reserve`. Schema mismatch, missing binding or storage failure returns 503 with no SQLite fallback. API validation still supplies 422/404/409 semantics. Public cloud seed edits return 403; native seed-edit behavior stays unchanged.

## Transactions independently verified

D1 statements are implicit transactions. The documented `batch()` is a transaction that rolls back the entire sequence on failure. `BEGIN IMMEDIATE`, `sqlite3.Connection` and toggling foreign keys are not used by the adapter.

- **Create:** deterministic request UUID → the existing UUID5-derived primary key. Conditional INSERT + AFTER INSERT trigger creates the initial history atomically. Losing retries do not insert history; existing content is compared and mismatched UUID reuse returns 409.
- **Update:** shared validation followed by `UPDATE ... WHERE id=? AND version=? RETURNING id`. Exactly one concurrent writer wins. AFTER UPDATE trigger validates version increment and writes status/note history in the same statement. A failed history insert rolls back ticket fields and version.
- **Read:** one transactional batch reads ticket, diagnosis and sequence-ordered history consistently. Internal trigger fields and private history version tags never enter public JSON.
- **Snapshots:** INSERT-on-conflict preserves the existing full JSON; an UPDATE trigger forbids replacement. Referenced diagnoses cannot be removed through foreign-key violations. No API deletes or overwrites evidence.
- **Initialization:** schema application is explicit and transactional; repeat loader checks the existing version. Seed initialization is repeatable, inserts missing deterministic records and never resets visitor tickets or quota counters. Requests do not initialize schema or seed automatically.
- **Quotas:** atomic conditional UPSERTs in D1, shared across app instances. Reservations are conservative and separate from domain writes: a failed request may consume allowance, but a ticket/history transaction is never partially committed. A failed snapshot insert can consume reserved byte budget; retries are safe.

Genuine local D1 tests inject failed history triggers during both creation and update, failed foreign keys and failed DDL batches. They check rollback, concurrent UUID retries, version conflicts, complete immutable snapshots, seed recovery and shared limits. Hosted replication/failure semantics and Python binding interop remain unverified. Current official docs say a batch counts as **one** per-invocation D1 query, while row accounting still includes its statements.

## Known size gap — preserve evidence, never truncate

D1 documents a **2,000,000-byte maximum string/row**. A valid dense 2,000-sample request (1,790,569 bytes) generates a 2,346,790-byte snapshot. The local emulator accepted this oversized value before an explicit guard was added; therefore local SQLite/D1 acceptance is not proof of that hosted limit.

The adapter now rejects an oversized complete snapshot with explicit 503 before storing or debiting snapshot bytes, allowing row-metadata overhead. It never clips the timeline or saves a partial diagnosis. Native SQLite accepts the original input range. This is an acknowledged gap in the cloud adapter, not an approved reduction of V1 requirements. Before release, implement immutable chunked snapshot storage with atomic manifest/chunks/checksum and complete reconstruction, or obtain a Planning decision about limits. A successful small-payload D1 test does not complete that work.

## Synthetic migration and recovery

Only disposable fixtures were migrated. The tests export a fresh temporary SQLite repository, retain **all** original public columns/IDs/UTC timestamps/history sequence/full JSON, derive D1 trigger-only ticket fields and assign legacy history a private negative version tag (`-seq`) to avoid collisions with all future positive versions. The import is one D1 batch and compares original ticket detail/evidence byte-equivalent JSON after serialization, then performs another versioned update and idempotent retry. No application/user database was opened for migration.

`cloudflare/local_recovery.py` is a small **local-fixture-only** JSON exporter/restorer, bounded to 100 statements and requiring explicit disposable confirmation. It uses the loopback binding, never provider APIs. Backup includes schema marker, all five tables and exact stored snapshot strings. Restore deletes/inserts the disposable tables atomically, replaces trigger-generated history with exact saved history, and rolls back everything on a bad reference. Tests verify versions, notes, history ordering, seed, IDs, retry behavior and full evidence. It is not a production migration/backup utility.

Future real migration, separately authorized: stop writes/read-only; take an offline consistent SQLite backup using the existing backup helper; validate FK/schema/counts and snapshot hashes; export an explicit manifest; import into a separate approved destination, using staged/versioned batches with resumable checksums for larger data; compare full evidence, IDs, history and versions; switch only after review; retain rollback source. Do not mark a migration live before validation. Never execute transaction control across separate D1 HTTP calls. No import/export via R2 or other provisioned resource was used here.

`cloudflare.restart_probe` starts, terminates and restarts a separate real local emulator against the same disposable persistence directory. Full detail, repair note, diagnosis, version 2, three ordered history events, seed repeat and quota usage survive. [Evidence](PHASE_A_RECOVERY.json). This does not establish hosted browser sharing, Worker redeployment, inactivity durability or Cloudflare Time Travel recovery.

## Official references

Read November 1, 2026 UTC:

- [D1 database API and batch transactions](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/d1/worker-api/d1-database.mdx)
- [Prepared statements and binding](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/d1/worker-api/prepared-statements.mdx)
- [Foreign keys and deferred migration constraints](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/d1/sql-api/foreign-keys.mdx)
- [Row, query, parameter, storage and recovery limits](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/d1/platform/limits.mdx). The newly documented 50 MB query-result ceiling takes effect November 4, 2026; do not describe it as already enforced on this verification date.
