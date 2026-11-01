# B.1 capacity and recovery operating policy

Recommendation only, no retention/account change. Reuse [B.0 measurements](PHASE_B0_MEASUREMENTS.json), [recovery boundaries](POSTGRESQL_ADAPTER.md) and PHASE_B1_REHEARSAL.json. Repetitive synthetic TOAST compression cannot predict real growth.

| Item | Default / recommended manual action |
| --- | --- |
| Daily UTC budgets | 2000 requests, 250 writes, 64 MiB canonical snapshot bytes + existing conservative overhead. Failed attempts may consume reservations; anonymous visitors can exhaust global quotas. |
| Capacity guard | Writes stop at 512 MiB pg_database_size, below documented Neon 1 GB/project. Not atomic allocation/project-wide accounting; concurrent writes, counters, history, bloat and other branches require monitoring. |
| Storage warning | Review at 256 MiB/unexpected growth; recommended read-only and investigation at 384 MiB. These are manual policy thresholds, not installed alerts. Never silently purge shared records. |
| Connections | One worker, pool maximum four (configurable 1–8), finite timeouts, no prepared statements. Pooled runtime URL, direct operator URL. |
| Monthly usage | Inspect included console after public events and at least daily while writable. Investigate at 50% compute/transfer; pause writes at 75% if they drive usage; suspend API before 90% if reads/compute remain unsafe. No paid/polling monitor. |
| Backup | Protected manual trusted archive before migration and at least daily during shared writes; proposed RPO up to 24 hours, not guaranteed. Verify fresh isolated restore each release. Provider six-hour history/one snapshot is supplementary; independent free backup storage remains a gate. |

B.0 illustrative usage remains 20 visitors/day, two diagnoses/one ticket/two updates/eight reads: about 8400 API calls/month including health and assumed 18 MB/month before indexes/bloat. Neither is an observed public workload. Twenty separate six-minute active windows/day at 0.25 CU would consume 15 CU-hours/month; always-active 0.25 CU for 730 hours uses 182.5 against documented 100. Do not keep Neon awake by readiness polling.

At 64 MiB/day abuse could reach 512 MiB in eight days. Roughly 1700 rereads of a 2.83 MB snapshot approach 5 GB before protocol/other transfer; daily request budgets do not enforce monthly transfer. Render first-visitor assets/API responses and service-initiated PostgreSQL traffic have separate unverified limits. Option B can offload static assets if Free terms require it; no switch/provisioning here.

## Recovery and incident handling

Store trusted pg_dump custom archives with protected umask/directory, schema/commit/date/counts/SHA-256 metadata outside Git/frontend/Render ephemeral disk. Keep passwords in prompts/secret storage, not logs/arguments. Listing an archive is not untrusted-SQL validation. Restore only a verified trusted archive into a **new isolated disposable destination**, --single-transaction --exit-on-error --no-owner, without --clean. Compare all tables, full evidence, IDs/notes/versions/history/counters and guided retries. Malformed restores must preserve complete destination state. Existing synthetic JSON restore performs fail-closed preflight before destructive work and remains explicitly guarded.

For incidents: record usage/symptom, enable DEMO_READONLY=1, preserve backup and inspect. Read-only still consumes reads/compute: suspend API if limits remain at risk, preserving Neon data/export rights and scale-to-zero. No automatic paid upgrade, silent purge or recurring paid job. Any retention, production restore, real-record migration or fallback requires explicit authorization and validated backup. Exact future commands are in [runbook](PHASE_B1_HOSTED_RUNBOOK.md).
