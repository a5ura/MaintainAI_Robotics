# PostgreSQL adapter

`backend/async_repository.py` holds the existing async SQL/domain workflow extracted from D1. Both `D1Repository` and `PostgresRepository` inherit it; SQLite retains its existing adapter and shared domain validation. Public API shapes and Python diagnostic algorithms are unchanged. PostgreSQL-specific behavior is restricted to the adapter, driver, migration and hosting entry point.

## Files and contracts

- `postgres/driver.py`: maintained async Psycopg 3.3.6 with psycopg-pool 3.3.3; parameterized SQL, dictionary rows, explicit transaction contexts. Pool 1–8 (default maximum 4), API minimum zero, bounded 20 waiters, acquisition/connect 5 seconds, statement 15 seconds, lock 5 seconds, idle 60 seconds. Prepared statements disabled for transaction-pool compatibility. Remote TLS verifies CA/hostname and preserves `channel_binding=require`; no security parameters are stripped. Actual Neon connectivity is unverified.
- `backend/postgres_repository.py`: fixed internal SQL placeholder conversion, query/batch/schema/migrate boundaries. No general-purpose untrusted SQL translator. Errors return sanitized 503 messages; domain conflict/quota semantics retain 409/429.
- `postgres/migrations/0001_maintenance.sql`: PostgreSQL schema version 1, distinct from D1 schema/backup v2. Equipment, diagnoses, immutable manifests/chunks, tickets, versioned history, distributed budgets and cached counts. Text UTC timestamps preserve existing public representation. FKs, unique IDs/versions, checks and trigger guards protect content, counts and atomic history. Keyset indexes cover ticket pages, equipment pages, ticket diagnosis references and history.
- `postgres/local.py`: explicit migration/seed command; no public reset/migration endpoint. Test URL guard requires loopback and `_test` suffix. Versioned migration uses a transaction advisory lock, rejects unknown versions and seeds idempotently.

## Integrity and isolation

Every mutation batch uses a single PostgreSQL READ COMMITTED transaction. Constraints/conditional version updates serialize conflicting writes; exactly one expected-version update commits. Ticket plus initial history, subsequent updates plus history, immutable evidence chunks plus manifest and snapshot budget are atomic. Diagnosis content-addressed identity and canonical checksum detect changed content. Stable guided request IDs reuse one ticket; inconsistent payload returns conflict. Foreign keys prohibit invalid references. Budget UPSERT reserves atomically across processes. No process-local lock provides data correctness.

Read batches use REPEATABLE READ to reconstruct a coherent detail/snapshot while updates occur. Full evidence is verified on retrieval against its manifest, chunk indices, UTF-8 lengths, canonical checksum and diagnosis identity. Corruption fails explicitly rather than producing a partial diagnosis. Inline legacy records remain readable. PostgreSQL retains the established chunk representation for consistent validation across adapters; accepted request/snapshot limits are not reduced.

The API admits one active application request per process solely to bound memory, and Uvicorn admits 20 connections. Real independent repositories/processes test concurrent database correctness without relying on that admission gate.

## Recovery

`postgres/recovery.py` is a protected synthetic fixture tool, not imported by the production API. It reuses the P2-hardened validator in `cloudflare/local_recovery.py`: exact supported table/version sets, record types, uniqueness, references, manifest/marker bijection, chunk completeness/length/checksum/identity and legacy inline support. Complete preflight occurs before destination access. It limits exports to 100 records/table and restores to 500 total, requires explicit confirmation and `_test`, then locks tables and replaces in one transaction. Trigger disable/re-enable and identity restart are transactional. Failed validation or SQL leaves the complete exported state unchanged. It is not an operator production migration tool.

For larger synthetic datasets, `postgres/native_backup_probe.py` proves trusted native `pg_dump --format=custom` and `pg_restore --single-transaction --exit-on-error --no-owner` into a newly created disposable database. It compares counts and SHA-256 fingerprints of all nine tables. A malformed archive is rejected without changing the populated test destination. Never execute an untrusted SQL/archive backup as an owner: native archives are executable database instructions. Real restoration must use a fresh isolated destination, trusted protected backup, integrity inspection and explicit authorization; never overwrite the live database. Operator backups require secure storage outside public assets/Git; no free hosted backup destination has been verified.

See PHASE_B0_DURABILITY_REPORT.md, JSON artifacts and `postgres/tests/` for actual local results.
