# B.2 future-only hosted deployment runbook

**Do not execute in B.1.** Resolve the pre-existing missing user-facing data/report exports before release acceptance; do not count API JSON/backup tooling as that UI workflow. Requires independent review, Planning risk acceptance, strict $0 account checks and separate resource/publication authorization. `<...>` values are future placeholders; no public endpoint exists. Stop on any card/hold/trial/paid activation, missing hard cap or incompatible Free build. Never record secrets in Git/chat/history/logs.

## Account and Neon preparation (after separate authorization)

1. Complete the read-only [account checklist](PHASE_B1_HOSTING_VERIFICATION.md); record plans/regions/terms, no billing/card/hold/auto-upgrade and hard suspension. Verify protected existing no-cost backup storage and operator permissions. Obtain B.2 authorization before resource setup.
2. Create **one Neon Free project** in the closest common Render/Neon region. Use smallest Free compute (0.25 CU if offered), conservative max, forced five-minute sleep, no replica/paid networking/add-ons. Inspect displayed $0 before submitting. No expiring database/trial.
3. Create application database/owner and obtain direct owner + pooled runtime endpoint fields. Driver verifies remote CA/hostname and preserves channel_binding=require. Never weaken TLS.
4. In the reviewed checkout/venv, securely load OWNER_DATABASE_URL from approved secret storage (never VITE or build arguments). Explicitly migrate/seed, then repeat to verify no duplicates:

```sh
DATABASE_URL="$OWNER_DATABASE_URL" .venv/bin/python -m postgres.local
```

Unknown versions fail closed; no request/startup migration/reset. Before future migrations, take/verify backup.

5. Apply restricted grants and set password via prompts, replacing non-secret placeholders first:

```sh
psql 'host=<DIRECT_HOST> port=5432 dbname=<APP_DB> user=<OWNER> sslmode=verify-full sslrootcert=system channel_binding=require' --password --set=ON_ERROR_STOP=1 --file=postgres/runtime-role.sql
psql 'host=<DIRECT_HOST> port=5432 dbname=<APP_DB> user=<OWNER> sslmode=verify-full sslrootcert=system channel_binding=require' --password --command='\password maintainai_runtime'
```

Role script refuses existing roles; inspect existing grants under review rather than blindly reusing. Confirm no DELETE/CREATE/ALTER/ownership/elevated membership. If provider cannot support it, stop; never make API owner to proceed. Form the secret pooled runtime URL using this role/password only. Owner stays in controlled operator context.

## Render and frontend

6. Create one native Python **Free** service at the reviewed repository SHA, matching region/root directory. Disable auto-deploy/previews. No disk, Render database, worker, cron, paid build/observability/uptime service. Blueprint import creates resources: only authorized B.2 may import render.yaml.
7. Confirm Python 3.12.14 plus Node 24.19.0/npm together. Build `./scripts/build-native.sh`; start `./scripts/start-native.sh`. Build locks frontend API to `/api`, timeout 90000 ms, and never migrates. Startup honors PORT, one worker/concurrency20, no access log/debug/generated docs. If native build tools/Free limits fail, stop and return the incompatibility; do not buy a tier.
8. Set server secret DATABASE_URL to **restricted runtime pooled URL**; MAINTAINAI_HOSTED=1, MAINTAINAI_STATIC_DIR=frontend/dist, PG_POOL_MAX=4. Initially DEMO_READONLY=1. Set daily requests=2000/writes=250/snapshot bytes=67108864/database high-water=536870912 unless Planning approves lower operational budgets; preserve accepted input limits.
9. Obtain provider-assigned HTTPS origin during authorized service setup with deployment held. Set MAINTAINAI_ALLOWED_ORIGINS to that exact HTTPS origin without slash/path/query/credentials. Do not guess it. If provider cannot expose hostname before initial deployment, resolve that setup flow before publication. Same-origin frontend needs no separate hostname/API root. Option B requires separately checked static-host configuration and actual HTTPS API/CORS values before selection.
10. Deploy only authorized reviewed SHA after inspecting Free/no paid resources. Record real URL/build/start logs without secrets. Platform health `/api/health` does not query DB. Use `/api/ready` manually, never a continuous DB keep-alive.

## Actual hosted verification (not established by B.1)

11. Check HTTPS root/nested SPA refresh, correct JS/CSS MIME/nosniff and immutable hash caching, HTML no-store; assets/dotfiles/docs API paths return expected 404. Inspect frontend assets for secrets.
12. Verify health/readiness, read-only rejection and working reads; then explicitly enable writes for approved synthetic acceptance. Verify actual runtime user has no owner rights and bounded pool.
13. Two real browsers: 3D Start/Pause/Reset, four faults + deterministic Random Failure, four checkpoints, computed explanations/evidence/checks, full-size Unicode evidence and report/data exports. Guided Demo creates one ticket; stable retries reuse it. Manual takeover/late responses and temporary errors preserve selection/unsaved repair notes. No blind automatic POST retries.
14. Create synthetic diagnosis/ticket/status/note in browser A, read full history/evidence in B; competing expected versions produce one success. Verify seed/input 413/pagination/idempotency conflict, quota/read-only in an isolated test budget without exhausting real monthly allowance.
15. Stop/restart and redeploy same compatible API version; compare complete IDs, evidence, versions, status, notes/history in both browsers. Allow real Render/Neon sleep and measure actual wake/error recovery; do not substitute local timings or install keep-alive.
16. Test incorrect credentials/unavailable DB and restore connectivity only in approved synthetic settings; safe 503, no SQL/credentials in public errors/logs, same API reconnects. Test schema failure in isolated disposable state, never corrupt the live schema.
17. Inspect quota rows, pg_database_size and provider account/project compute/storage/history/transfer/outbound usage. Confirm no owner secret in API, no paid changes or billing activation/charges. Apply capacity warning/suspension policy; external Neon alone is not guaranteed durability.

## Protected synthetic backup and fresh recovery

18. Use existing trusted machine/storage and matching modern PostgreSQL/libpq tools with system-root support, no paid scheduler. Set B1_BACKUP_DIR to a fresh protected directory; use direct endpoint/password prompts:

```sh
umask 077
pg_dump --dbname='host=<DIRECT_HOST> port=5432 dbname=<APP_DB> user=<BACKUP_OWNER> sslmode=verify-full sslrootcert=system channel_binding=require' --password --format=custom --no-owner --file="$B1_BACKUP_DIR/synthetic.dump"
sha256sum "$B1_BACKUP_DIR/synthetic.dump" > "$B1_BACKUP_DIR/synthetic.dump.sha256"
pg_restore --list "$B1_BACKUP_DIR/synthetic.dump" > "$B1_BACKUP_DIR/archive-index.txt"
```

Record app/schema version and full table counts/fingerprints using postgres/native_backup_probe.py query patterns. Protect metadata too. Never commit/upload dumps to frontend or Render disk. A listed archive can still execute malicious SQL: source/hash/trust must be established first.

19. After explicit authorization, create a **fresh empty disposable database** within verified Free storage/branch limits; confirm provider creation permissions first. Never use live destination. Restore only trusted protected archive, without --clean:

```sh
sha256sum --check "$B1_BACKUP_DIR/synthetic.dump.sha256"
pg_restore --dbname='host=<DIRECT_HOST> port=5432 dbname=<FRESH_DISPOSABLE_TEST_DB> user=<RESTORE_OWNER> sslmode=verify-full sslrootcert=system channel_binding=require' --password --single-transaction --exit-on-error --no-owner "$B1_BACKUP_DIR/synthetic.dump"
```

20. Compare all nine schema/application/budget/count tables, full evidence, IDs/status/notes/versions/history and guided retries. Attempt malformed archive only against populated **disposable** state and compare complete before/after. Existing JSON fixture restore remains preflight-validated/guarded, not a production migration tool. Delete only separately authorized disposable resources after evidence collection.

## Approval, rollback and shutdown

21. Recheck actual provider dashboards: Free, no card/billing/paid activation/charges, current usage/terms. If strict $0 not established, withhold release. Return actual URL, reviewed SHA, hosted tests, backup evidence and limitations to Planning for public-release approval.
22. Regression rollback: emergency read-only, protected backup, manually redeploy last reviewed compatible SHA. B.1 schema stays v1; never reset/drop/migrate backward to roll back code. Verify full records/readiness.
23. Abuse/cost shutdown: suspend Render service and disable auto-deploy; read-only alone still permits transfer/compute. Preserve Neon data/backup and forced sleep. Verify suspension/Free usage. Database/account deletion, real-record migration/restoration or local-only fallback requires separate permission.
