# Pre-B.2 release-readiness correction

November 11, 2026 (America/New_York). Existing managed cloud Linux x86_64 checkout `/workspace/MaintainAI_Robotics`; Desktop is the interface, not evidence of Windows execution.

## Baseline and scope

Fetched all advertised origin heads and verified a clean checkout at `a915cae8cae3b6fd4deb46f2b9c7729f41ebafa4`, equal to `origin/main`. Created `feature/v1-pre-b2-release-readiness` in the same checkout. PRs #1–9 are merged, including PR #9's export correction `1f972b0`. Historical export evidence is in [TICKET_EXPORTS_ACCEPTANCE.md](TICKET_EXPORTS_ACCEPTANCE.md).

## Correction

- Header now says **INTERACTIVE DEMO**. Maintenance says **SHARED DEMO RECORDS**, explains backend sharing and requests synthetic information only. This environment-neutral copy is accurate for native SQLite, local PostgreSQL/D1 and a future hosted backend; it makes no claim about provider, configured storage technology, public deployment or verified durability. Simulated-workcell/computed-diagnostics and no-login/public-record disclosures remain. No build variable, hostname heuristic, new API or deployment-status feature is introduced.
- `render.yaml` initially sets `DEMO_READONLY=1`, matching step 8 of the [hosted runbook](PHASE_B1_HOSTED_RUNBOOK.md). After separately authorized provisioning, read/role checks precede explicit operator enablement of writes in step 12. Current runtime enforcement is unchanged: POST/PATCH, including diagnosis persistence and guided saves, receive the existing read-only error. Read-only is not a provider spending cap and does not eliminate read/transfer costs.
- Current documentation records merged PR #9 and completed saved JSON/Markdown exports. Earlier checkpoint text and raw evidence are retained as history.
- [Hosting verification](PHASE_B1_HOSTING_VERIFICATION.md) records newly accessible official Render/Neon terms, source URLs, remaining account questions and the NO-GO decision. No actual provider account, payment, usage or eligibility is certified.

## Verification

Existing tests and assertions are preserved. No dependency installation was needed. Python 3.12.14, Node 24.19.0, npm 11.9.0 and existing Chromium were used.

| Command/check | Fresh result |
| --- | --- |
| `.venv/bin/python -m pytest backend/tests -q` | 98 passed, no failures/skips |
| `npm --prefix frontend test` | 63 passed, no failures/skips |
| `VITE_API_BASE=/api VITE_API_TIMEOUT_MS=90000 npm --prefix frontend run build` | TypeScript and production build passed with the production script's frontend settings |
| Configuration tests listed below | 9 passed, no failures/skips; no PostgreSQL connection |
| Full Chromium suite in disposable copy | 19 passed, no failures/skips (3.2 minutes) |
| Manifest/read-only enforcement probe | Passed: initial flag is 1; health 200; diagnosis/create/update 503 before database-pool access |
| `sh -n scripts/build-native.sh scripts/start-native.sh`; `git diff --check` | Passed |

Exact configuration selection:

```sh
.venv/bin/python -m pytest postgres/tests/test_runtime.py::test_explicit_configuration_and_no_fallback postgres/tests/test_runtime.py::test_hosted_cors_is_explicit_https postgres/tests/test_runtime.py::test_hosted_flag_cannot_silently_start_sqlite postgres/tests/test_release.py::test_hosted_origins_are_origins_not_urls -q
```

The standalone enforcement probe constructs the existing PostgreSQL app in read-only mode using HTTPX ASGI transport without running its database lifespan. It supplies only the admission semaphore, then verifies GET health and POST diagnosis/ticket plus PATCH ticket outcomes. No database is contacted, seeded or migrated. It is a configuration/middleware check, not live PostgreSQL proof.

Browser command is `CHROMIUM_PATH=/usr/bin/chromium npm run smoke -- --reporter=line` from `/tmp/maintainai-pre-b2/frontend`. The copied frontend uses unchanged built production assets, a fresh `/tmp/maintainai-pre-b2/browser.sqlite3`, loopback API :8014 and preview :5184. Only loopback test/proxy URLs are adapted in the disposable copy; no assertions are changed. Screenshots/timings stay under `/tmp/maintainai-pre-b2/docs`, preserving historical tracked evidence. Real downloads, complete Unicode evidence/paginated history, faults, guidance, engineering and independent sessions remain in the full suite.

Selected raw logs and structured results are committed under [evidence/pre-b2/](evidence/pre-b2/results.json).

Full real PostgreSQL/D1 suites and the install-performing `scripts/build-native.sh` were not rerun: Psycopg and root Wrangler tooling are absent. No dependencies or containers were installed/provisioned for this bounded copy/config correction. Hosted tests and Render schema validation were not performed. Existing upstream Starlette/AnyIO deprecation and 843.84 kB Three.js chunk warnings remain. No CI workflow is introduced or CI success claimed.

## B.2 decision and boundaries

**NO-GO for provisioning/deployment.** Read-only account evidence, hard no-charge controls, protected no-cost backups, actual hosted runtime/cold wake/TLS/pooling/durability and anonymous-operations acceptance remain open. Public documentation and local tests cannot close those gates. No account/resource creation, billing activation, paid service, deployment, real-data migration, environment publication or PR merge is performed or authorized. PRD, V2 deferral, robot/diagnostic algorithms, data models, quotas, exports and existing test coverage are preserved. No new dependencies or spending action.

Delivery is a pushed feature branch and a PR for independent review, never an automatic merge. Exact commit/PR and final verification are recorded in the completion response.
