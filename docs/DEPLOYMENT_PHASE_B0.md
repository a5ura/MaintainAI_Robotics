# Phase B.0: native Python + PostgreSQL release preparation

## Status and boundary

November 1, 2026 UTC. Implemented and tested in the existing managed Linux workspace, not Windows or Codex Desktop. Baseline merged A.2: `8b8491035cfcf388378376dd8b9b2e649dcfed94`. No public service, account, database, billing, production migration or deployment was created. This package is for review, not permission to import the manifest.

SQLite remains the ordinary local default; D1 remains a conditional prototype. PostgreSQL is explicitly selected by its entry point. Approved PRD, diagnosis rules, fixtures and robot model are unchanged.

## Reproduce locally

Python 3.12, Node 24, Docker and loopback networking are required for the PostgreSQL integration checks. Frontend-only work does not require PostgreSQL.

```sh
python -m venv .venv
.venv/bin/pip install -r backend/requirements.txt -r backend/requirements-postgres.txt
npm ci
npm --prefix frontend ci
docker compose -f postgres/compose.yaml config --quiet
docker compose -f postgres/compose.yaml up -d
export POSTGRES_TEST_URL=postgresql://postgres@127.0.0.1:55432/maintainai_b0_test
export DATABASE_URL="$POSTGRES_TEST_URL"
.venv/bin/python -m postgres.local
npm --prefix frontend run build
MAINTAINAI_STATIC_DIR=frontend/dist .venv/bin/python -m uvicorn backend.postgres_app:create_app --factory --host 127.0.0.1 --port 5173 --limit-concurrency 20
```

Compose uses a named local volume, 512 MiB/one CPU, pinned PostgreSQL 17 image and **loopback-only trust authentication**. Never expose that authentication publicly. Stop with `docker compose -f postgres/compose.yaml stop`; `down -v` destroys only this disposable volume. In this workspace, equivalent `docker run` infrastructure was used, without a named volume: restart durability is proven, container-deletion durability is not. Managed Docker may require the explicit local Unix socket and authorized sandbox access; do not redirect to a remote daemon.

Alternative development remains the documented SQLite API on port 8000 with Vite. For PostgreSQL with Vite, use the existing `/api` development proxy to an API on port 8000. Same-origin built static serving above was actually browser-tested. Do not run both services on the same port.

## Verification

Run sequentially against disposable state; D1 and PostgreSQL tests reset synthetic tables. Keep frontend assets stable during D1/browser tests.

```sh
npm run d1:local
# Another terminal, after emulator is ready:
.venv/bin/python -m pytest backend/tests cloudflare/tests postgres/tests -q
npm --prefix frontend test
npm --prefix frontend run build
CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke
.venv/bin/python -m postgres.durability_probe
.venv/bin/python -m postgres.native_backup_probe
# Set B0_API_PID to the actual local API PID listening on 5173 first.
.venv/bin/python -m postgres.measure "$B0_API_PID"
```

The durability probe owns ports 8011/8012 and explicitly restarts its named disposable container. Review its source before using outside this exact local setup. The backup probe uses local Docker `pg_dump`/`pg_restore`, a uniquely named fresh test destination and no production credentials. The measurement runner documents its arguments in source; it resets the guarded local test database. Do not run probes concurrently with browser checks or retained data.

## Future hosted procedure — NOT executed

1. Complete all read-only account/Free gates in PHASE_B0_HOSTING_DECISION.md and obtain separate authorization for provisioning/hosted verification.
2. Inspect `render.yaml` against the then-current provider schema; choose Free explicitly, disable automatic deployments, do not attach a paid disk or Render database. The manifest currently builds the API only.
3. Create an approved durable external PostgreSQL database only after authorization. Store its URL exclusively as a server secret. Use the provider's pooled URL where recommended. Driver enforces remote `sslmode=verify-full`, preserves channel binding and uses system roots. Never weaken TLS to troubleshoot.
4. Use an owner connection for the explicit `DATABASE_URL=... python -m postgres.local` migration/seed operation. Do not run migrations on requests or every application start. Take/verify a protected backup before any later schema migration. Create a separate runtime role: CONNECT, schema USAGE, SELECT/INSERT/UPDATE on application tables and sequence USAGE/SELECT; no DELETE, CREATE or ALTER. Local restricted-role behavior was tested. Provider role-management permissions remain unverified.
5. Set `MAINTAINAI_HOSTED=1`, explicit comma-separated HTTPS `MAINTAINAI_ALLOWED_ORIGINS`, bounded PG_POOL_MAX=4, and review the quota flags in `postgres/.env.example`. Set `DEMO_READONLY=1` for an incident; restart configuration to apply. No SQLite fallback exists in this entry point.
6. Run `./scripts/start-native.sh`: one Uvicorn worker, host-provided PORT, concurrency 20. `/api/health` is liveness without a DB query; `/api/ready` verifies connectivity and schema. Do not continuously poll readiness: it would keep a sleeping database active.
7. Build frontend with only public `VITE_API_BASE` pointing at the authorized HTTPS API and optional `VITE_API_TIMEOUT_MS=90000`. Free static Pages is a conditional option; `frontend/public/_redirects` supplies SPA fallback. No URL is fabricated. For same-origin hosting, separately ensure the build has Node available, build frontend and set MAINTAINAI_STATIC_DIR=frontend/dist. The current API-only Render manifest does not build static assets.
8. Verify two real browsers, full evidence, drafts, Guided Demo, CORS, missing configuration, quota/read-only errors, TLS, cold wake, restart/redeploy durability, backup/restore into a fresh destination and account usage before any public release approval.

No paid keep-alive, background job, cloud database reset, deployment or automatic upgrade is part of this procedure. Hosted cold starts, provider memory/CPU and actual account charges remain unverified.
