# Phase A.2 final acceptance — PR #7 restore preflight

Reviewed baseline: `45cbc72452ae04650af8aa4e2cb709b364a5a165` on `feature/v1-deployment-phase-a2`. Existing managed Linux workspace; no hosting work or architecture change.

## Root cause and correction

`restore_fixture` interpreted absent tables as empty and validated only manifests present in the file. A backup retaining a chunked diagnosis marker but omitting its manifest/chunks could therefore pass validation and replace a valid disposable database with incomplete evidence.

`cloudflare/local_recovery.py::validate_fixture` now validates the complete format without any destination access:

- Version is an actual integer, exactly 1 or 2; `synthetic_only` must be true.
- v1 requires exactly equipment, diagnoses, tickets, ticket_history and request_budgets. v2 additionally requires snapshot_manifests and snapshot_chunks. Missing/unexpected tables are rejected, not defaulted to empty. Valid v1 alone receives explicit empty v2-only tables after validation of its exact table set.
- Tables must be lists of exact, schema-shaped record dictionaries, with typed/null-safe fields, valid status/version/range values, unique primary identities and unique history event identities. Foreign references are validated before SQL.
- Inline JSON is strictly decoded, rejects duplicate JSON keys/nonstandard constants, and must retain its diagnosis identity. Legacy inline records remain supported.
- Chunk markers and manifests must form exactly matching identity sets. Every manifest has an appropriate canonical marker; every chunk has a manifest. No orphan or missing counterpart is permitted.
- Existing shared verification checks format/version, logical chunk order/count/completeness, byte lengths, checksum and diagnosis identity. Corruption is rejected before destination queries or deletion.
- Validated rows are copied before the first await. Mutating the caller's backup during a later database await cannot invalidate the validated restore plan.

`restore_fixture` checks fixture size before destination access, then retains the existing single transactional D1 batch, parameterized inserts, quota-trigger removal/recreation and rollback safeguards. No storage schema, diagnostic algorithm or public product behavior was changed.

## Compatibility and regressions

Added 29 cases to `cloudflare/tests/test_chunked.py`:

- 25 damaged-export cases: missing table; missing manifest; missing manifest/chunks with marker retained; orphan manifest/chunk; missing middle chunk; corrupt content; wrong checksum/count/length; unsupported/boolean version; malformed table/row; missing/extra column; duplicate diagnosis/chunk/ticket identities; invalid equipment/history references; mismatched inline identity; unexpected table; duplicate inline identity keys; invalid inline JSON.
- Every rejection starts with a populated valid destination, verifies **zero destination binding calls** during rejection, then compares its complete before/after exports.
- Valid legacy v1 and complete v2 restores are each repeated twice, with complete export equality.
- An injected SQL failure after valid preflight proves atomic rollback preserves all exported data and the quota trigger.
- A caller-mutation regression proves restoration uses the validated copy rather than later-damaged input.

Existing v1-to-v2 migration, SQLite fixture conversion, chunk recovery, immutable evidence and real emulator restart tests remain enabled.

## Verification

| Command | Result |
|---|---|
| `.venv/bin/python -m pytest cloudflare/tests/test_chunked.py cloudflare/tests/test_recovery.py -q` | **52 passed**, 0 failed/skipped |
| `.venv/bin/python -m pytest backend/tests cloudflare/tests -q` | **192 passed**, 0 failed/skipped |
| `npm --prefix frontend test` | **41 passed** |
| `npm --prefix frontend run build` | TypeScript/production build **passed** |
| `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke` | **16 passed (2.6m)**, actual Chromium |
| `.venv/bin/python -m cloudflare.restart_probe` | **Passed**: genuine isolated emulator restart, legacy v1 migration, large chunked evidence/history/notes/versions/budget preserved |

Affected/full adapter tests execute SQL in genuine local D1 through the existing labelled CPython transport. Chromium uses an isolated temporary native SQLite backend, avoiding cross-test mutation of D1 fixture state. Neither proves hosted Python Workers execution. Existing Starlette/AnyIO deprecation, Node color and large 3D chunk warnings remain. No tests disabled. Generated screenshots/timings/restart metrics are restored rather than committed as unrelated changes.

## Delivery and boundaries

Only recovery validation, its regressions and this report change. Existing PR #7's Git head was verified at the reviewed baseline before work; the final pushed SHA and PR-head comparison are returned in the completion handoff. No replacement PR or merge command is used.

No known unresolved defect remains in this acceptance scope. Previously documented deployment/runtime/account gates are unchanged. No purchases, new dependencies, hosted resources, billing activation, deployment, environment publication or real-record migration; only existing authorized compute and disposable synthetic fixtures. Recommend final independent/Planning acceptance of this narrow fix after reviewing the updated PR.
