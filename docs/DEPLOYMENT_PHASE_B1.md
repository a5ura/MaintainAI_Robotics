# Phase B.1 release candidate

November 1, 2026 (America/New_York). Baseline: merged B.0 PR #8, `8d39f2af9dee9a1d21d658950ddb15a228651848`. Existing managed Linux; no laptop, provider resources, account setup or public deployment. PRD, diagnostic rules and robot model unchanged.

## Changes from B.0

- render.yaml selects one Free Python service that builds/serves React. scripts/build-native.sh installs existing pinned native requirements and locked frontend dependencies, builds same-origin `/api` with 90-second wake timeout. Startup remains host PORT, one worker, bounded concurrency; no startup/build migration or reset.
- Hosted PostgreSQL disables generated API docs, requires exact HTTPS CORS origins and blocks static dotfiles. Missing Vite assets return 404; HTML no-store prevents stale releases, hashed assets cache immutably. Static responses set nosniff/referrer policy. SQLite/D1 defaults remain compatible.
- postgres/runtime-role.sql supplies reviewed non-owner grants, deliberately fails on an existing role and never embeds a password. Eight actual PostgreSQL/static/role regressions added.
- postgres/release_rehearsal.py uses the real production startup/build with temporary restricted SCRAM credentials, resource limits, 16 existing Chromium tests, full-size evidence and failure/restart checks. It changes no schema/storage design.

## Reproduction

Use [B.0 local setup](DEPLOYMENT_PHASE_B0.md). Activate .venv or prepend .venv/bin to PATH. Checks use only synthetic loopback maintainai_b0_test. Rehearsal deliberately requires the existing disposable Docker container maintainai-b0-pg on 55432 and a free port 5173; it refuses other targets. Compose's equivalent service uses a different generated container name; do not guess or point at retained data. Never expose local trust authentication publicly.

```sh
./scripts/build-native.sh
npm run d1:local
# Another terminal, once emulator ready; keep assets stable:
.venv/bin/python -m pytest backend/tests cloudflare/tests postgres/tests -q
npm --prefix frontend test
.venv/bin/python -m postgres.release_rehearsal
.venv/bin/python -m postgres.durability_probe
.venv/bin/python -m postgres.native_backup_probe
sh -n scripts/build-native.sh scripts/start-native.sh
git diff --check
```

Rehearsal owns port 5173, a marked temporary local pg_hba rule and a synthetic runtime role, cleaning them in finally. It intentionally restarts the owned PostgreSQL container; never run other database tests concurrently. API receives a 512 MiB **virtual-address** limit and one-core affinity; PostgreSQL has separate 512 MiB/one-CPU container limits. This approximates constrained hosting, not actual Render RAM/CPU. Browser pagination uses explicit test-only daily writes=2000/requests=10000; production stays 250/2000. Run SQLite browser regressions separately because shared HTTP construction changed.

Artifacts: PHASE_B1_REHEARSAL.json, evidence/b1/. Fresh B.0 probe outputs are copied there and historical B.0 artifacts restored. See completion report for exact results, [hosting gates](PHASE_B1_HOSTING_VERIFICATION.md), [security](PHASE_B1_SECURITY_REVIEW.md), [capacity](PHASE_B1_CAPACITY_POLICY.md) and future-only [runbook](PHASE_B1_HOSTED_RUNBOOK.md). No import/deployment of render.yaml is authorized in B.1.
