# B01 — preserve maintenance drafts after conflict reload

November 11, 2026 (America/New_York). Existing managed cloud Linux x86_64, not the owner's Windows instance. Baseline `7a789c45fc7e5405723fea569644bfb2be6f351e`, equal to freshly fetched `origin/main`; clean before work. Dedicated branch: `fix/b01-conflict-draft-preservation` in the existing checkout.

## Independent reproduction

Before changing the frontend, real Chromium opened a synthetic ticket against a fresh SQLite database at `/tmp/maintainai-b01/synthetic.sqlite3`. A second HTTP client updated the ticket, causing the browser's stale save to receive 409. After clicking Reload records, the probe waited for saved version 2 before inspecting the repair textarea. Its value changed from `UNSAVED audit technician work` to an empty string. This reproduces the reported defect after the asynchronous reload completes, not merely while the request is pending. Reproduction evidence is retained with this correction.

The disposable API uses loopback :8034 and the frontend preview :5204. The baseline production assets were tested before rebuilding with the correction. No Windows endpoint, existing development SQLite file or production record was used.

## Root cause and bounded correction

`Maintenance.tsx` reused `select` for successful saves, intentional ticket selection and conflict reloads. It always cleared repair/resolution drafts. The correction adds an explicit preservation option used only by Reload records and guarded by matching ticket identity.

- Reload updates saved detail, version, history and saved status, without issuing a PATCH or replaying the failed write.
- Repair and resolution drafts remain intact. An intentional status-selection change remains a draft; if the operator changed only notes, the selector adopts the latest server status so retry does not accidentally revert another operator's status change.
- The old conflict error clears after recovery and a status notice names the loaded version and asks the operator to review current changes before saving. A failed reload retains drafts and shows its actual error instead of claiming recovery.
- A resolution draft remains visible even if the other client has already resolved the ticket. The saved resolution remains separately visible; no automatic merge or write is attempted.
- Explicit save uses the refreshed expected version. Success clears drafts/notice normally. Intentionally choosing another ticket still resets status, repair and resolution drafts; they do not transfer between tickets.
- Export invalidation and saved-record downloads retain their existing behavior.

## Regression coverage and verification

Focused component tests cover successful and failed conflict reloads, both notes, intentional status changes, a concurrently resolved ticket, no automatic write on reload, retry at the refreshed version, post-save clearing, ticket switching, and notes-only recovery following the latest saved status. The real-browser regression uses independent API requests against SQLite to cause two conflicts, verifies preserved drafts and actual saved history/resolution, then verifies selection of another ticket clears drafts.

| Command | Fresh result |
| --- | --- |
| `.venv/bin/python -m pytest backend/tests -q` | 98 passed, no failures/skips |
| `npm --prefix frontend test` | 68 passed, no failures/skips (63 existing + 5 focused cases) |
| `VITE_API_BASE=/api VITE_API_TIMEOUT_MS=90000 npm --prefix frontend run build` | TypeScript and production build passed |
| `CHROMIUM_PATH=/usr/bin/chromium npm run smoke -- --reporter=line` in disposable copy | 20 passed, no failures/skips (3.3 minutes) |
| `git diff --check`; protected-path diff inspection | Passed; algorithms/schemas/quotas/hosting unchanged |

Python 3.12.14, Node 24.19.0, npm 11.9.0 and existing Chromium software WebGL. Existing tests/assertions are retained, including the original component-test prefix verbatim. Browser tests use a disposable copy with only loopback test/proxy URLs adapted to :5204/:8034; production assets remain stable during each run. Generated screenshots/timings stay outside tracked historical evidence. No dependency installation or schema migration.

The first added component-test attempt queried the details region before initial loading completed; it was corrected to await that region. The first browser run had 18 passes and two failures: the new test's resolution-label locator failed although its page snapshot contained the preserved value (changed to accessible textbox role), and the unchanged engineering keyboard test failed its initial skip-link focus assertion. Neither existing assertions nor application engineering behavior were altered. The final full run passed all 20 workflows, including the unchanged engineering focus assertions. No test was disabled. Selected logs and reproduction data: [evidence/b01/results.json](evidence/b01/results.json). Existing upstream AnyIO/Starlette deprecation and 843.84 kB Three.js chunk warnings remain. No real PostgreSQL/D1, hosted or Windows validation is claimed.

## Boundaries and residual risks

Only the maintenance frontend, regression tests and correction evidence change. Diagnosis/FK algorithms, backend, persistence schemas, quotas, hosting configuration and approved PRD are unchanged. No resource provisioning, billing change, deployment, merge or Windows-server modification.

Drafts remain component memory, not an autosave feature: refresh, leaving the view or intentional selection can still discard them as before. Preserved intentional status/resolution edits can differ from newer saved values; the operator must review before explicitly saving. A further concurrent update still returns the existing version conflict. Windows and hosted execution are not established by cloud SQLite tests.
