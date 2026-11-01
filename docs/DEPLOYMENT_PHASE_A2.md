# Deployment Phase A.2 — reliable evidence and database hardening

Base: merged Phase A.1 PR #6, `966c809d6f716949c3183f84bb39ce970071a266`. Branch: `feature/v1-deployment-phase-a2`. Execution: existing managed Linux x86_64, November 1, 2026 UTC; Windows/Desktop execution is not inferred.

This milestone implements code independently of the blocked Python runtime: versioned lossless D1 snapshots, atomic storage charging, bounded ticket/history pages, cached equipment counts, local migration/recovery and genuine D1 retained-data measurements. No replacement diagnostic engine, deployment, hosted resource, billing, actual-record migration or automatic merge.

## Run and verify locally

Keep normal native commands from README; SQLite and existing records remain supported. For disposable emulated D1, use the pinned tools already documented in `DEPLOYMENT_PHASE_A.md`:

```bash
npm ci
npm --prefix frontend ci
npm --prefix frontend run build
# Terminal 1 (loopback only, never publish the SQL bridge)
XDG_CONFIG_HOME=/tmp/phase-a-config WRANGLER_SEND_METRICS=false npm run d1:local
```

```bash
# Terminal 2; only disposable local D1, no production data
.venv/bin/python -m cloudflare.local_schema
.venv/bin/python -m pytest backend/tests cloudflare/tests -q
.venv/bin/python -m cloudflare.restart_probe
.venv/bin/python -m cloudflare.a2_measure
npm --prefix frontend test
npm --prefix frontend run build
```

Run tests and measurements sequentially: they reset the shared disposable D1 fixture tables. `a2_measure` leaves a large synthetic dataset; clear only these disposable tables/reinitialize before a clean browser run. Native `data/` is never targeted by these tests. The restart probe uses its own temporary emulator/persistence directory and checks v1→v2 migration and large evidence across a real process stop/start.

For actual Chromium, start `.venv/bin/python -m uvicorn cloudflare.local_api:app --host 127.0.0.1 --port 8000`, serve the frontend production preview on 5173 as in README, then `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke`. This API is explicitly **CPython + genuine emulated D1**, not Python Workers/Wasm. Restore generated M3 screenshots/timings after review to avoid unrelated commits.

## Interfaces and operational boundaries

- Existing diagnosis response/IDs and ticket evidence contract are unchanged. Legacy inline snapshots remain readable; new snapshots use manifest/chunks.
- Default ticket list remains an array of latest 200. Optional `after_created`/`after_id` keyset parameters load subsequent pages, with optional equipment filter.
- Ticket detail's history is at most 200 rows. Only when more exist, `history_next_seq` is added. `GET /api/tickets/{id}/history?after_seq=N` returns `{history,next_seq}`. UI loads more without resetting selection or drafts. SQLite provides the same pagination interface.
- New default D1 snapshot allowance: **64 MiB/day**, charged atomically for canonical stored bytes plus 16 KiB per chunk and 16 KiB per manifest as conservative logical overhead. Request/write caps remain 2,000/250 per UTC day; none guarantee availability or account-specific billing safety.
- Numbered additive schema migration `0002_snapshots.sql` is local-tested and repeatable through the loader. No real records were migrated. Never initialize by deleting a user database.
- Local fixture export/restore validates checksums and has explicit small-fixture limits. It is not a production backup service. Production retention, migration and destructive recovery require separate authorization.

One official index recheck still returned CONNECT 403. No further runtime retries or access-control bypass. Actual Python/JS binding execution, billed CPU/memory, pre-ASGI streamed body protection, hosted durability and account Free-only eligibility remain release blockers. See the storage, hosting alternatives and completion reports for evidence and next decisions.
