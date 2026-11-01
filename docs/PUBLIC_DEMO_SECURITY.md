# Anonymous public-demo security and durability

## Current Phase A.2 checkpoint — November 1, 2026 UTC

Phase A.1 PR #6 is verified merged at `966c809`. Phase A.2 explicitly authorizes local storage hardening despite the unchanged index CONNECT 403, superseding A.1's deferred-expansion gate for this assignment. New D1 schema v2 provides atomic immutable manifest/chunks, verified reconstruction and quota charging; the large-evidence row-size defect is resolved locally. Default snapshot allowance is now 64 MiB/day including conservative logical overhead. Cached counts, indexed 200-record ticket/history pages and UI continuation preserve drafts and the native SQLite workflow. Legacy inline evidence and synthetic migration/backup/restart remain supported.

Actual Python Workers/JS binding execution, billed CPU/memory, pre-ASGI streamed body enforcement, account Free-only terms and hosted durability remain unverified. The total 500 MB Free storage/retention and anonymous availability gates are not solved by a daily budget. No deployment, resource provisioning, billing, real-record migration, environment publication or merge. Current evidence: [A.2 report](PHASE_A2_COMPLETION_REPORT.md) and [details](PHASE_A2_STORAGE_REPORT.md). Earlier checkpoint statements below are historical, including the previous single-row restriction and 2 MiB/day default.


**Local feasibility controls, not public-release approval.** V1 deliberately has no login: records/notes would be shared, readable and changeable by strangers. Do not enter private information. CORS is not authentication; a script can call the API directly. No identity system or paid security service was introduced.

## Implemented and locally exercised

| Threat | Control / evidence | Remaining limitation |
|---|---|---|
| Repeated/automated requests | Atomic D1 daily request reservations, default 2,000; health exempt | Rejected calls/health still invoke Worker and can exhaust platform quota |
| Excess mutation | D1 daily write reservations, default 250; concurrent/shared-instance tests | Attackers can consume everyone else's allowance; budgets aren't per visitor |
| Unique evidence/storage growth | Default 2 MiB/day new snapshot allowance, immutable IDs, explicit row-size check | Ticket/history/index overhead and long-term growth require retention; max dense evidence needs chunking |
| Emergency containment | `DEMO_READONLY=1` rejects API writes with 503 before any D1 query | Health/reads/edge invocations remain; operator access and hosted behavior unverified |
| JSON abuse | Existing 2 MiB application body bound before JSON parsing; 2,000 samples, 16 events/sample, bounded messages/notes | SDK pre-buffering before ASGI remains a separate risk (below) |
| Seed vandalism | D1 adapter rejects public edits to `T-SEED-001`; idempotent operator seed recovery | Other anonymous visitor records remain modifiable as approved |
| Duplicate/replayed Guided Demo | Existing UUID-derived ID + compare content; SQL primary key, atomic initial history | Deliberately different UUIDs are new tickets and consume allowance |
| Lost writes | Versioned conditional update, immutable snapshots, transactionally linked history | Anyone who reloads the latest version may still vandalize public records |
| Injection/data exposure | Parameterized SQL, bounded schema validation, React's existing escaped record text; credentials only in server binding | Never publish SQL bridge, backups or provider secrets; no XSS security audit claimed |
| Backend outage/quota exhaustion | Sanitized 503/429 detail and retry header, existing frontend error states | Proxy/platform-generated 1102/1027 errors need actual hosted UX verification |

`WorkerPolicy` stores quotas in D1, not process memory. Quota reservation and domain mutation are deliberately separate; failed/invalid writes can consume budget conservatively. A failed domain history write cannot partially commit the ticket. The local SQLite `MAINTAINAI_PUBLIC_DEMO` limiter remains unchanged and is not used as a distributed Workers limit.

All policy vars are non-secret defaults in `wrangler.jsonc`. Real database/account identifiers or credentials are absent. Root `workers_dev:false`, `preview_urls:false` and local scripts express intent; they do not make an accidental deploy command safe. No deploy/login/provisioning command is authorized. The arbitrary-SQL bridge is bound to loopback and gated by a test header/flag; that header is **not** public authentication. Never use the bridge's JavaScript entry as a release entry point.

## Important pre-ASGI body gap

Inspection of installed SDK 1.9.5 `workers/asgi.py::process_request` shows it drains `req.body` into a receive queue **before** calling the ASGI app. Therefore the app's 2 MiB body limiter does not prove that a large/chunked upload is bounded before Worker memory allocation. Workers' documented Free-domain upload ceiling is much larger. This is unverified in the blocked Wasm runtime and is a release gate: add and exercise a supported pre-ASGI streamed size bound (including missing/spoofed Content-Length), or verify a genuinely free edge-enforced bound. Do not describe application validation alone as memory-exhaustion protection.

Default same-origin frontend/API needs no public cross-origin allowance. Shared API CORS defaults remain explicit localhost origins for development, never wildcard. A future separate frontend origin needs an explicit reviewed origin; CORS does not stop nonbrowser abuse. Do not trust arbitrary forwarded-IP headers as identity or introduce a paid rate-limit dependency implicitly.

## Retention, backup and recovery

No public deletion/reset/migration endpoint exists. No real records were deleted or migrated. Existing native backup/dry-run retention helpers remain unchanged. New recovery tools operate only on disposable synthetic local D1; tests verify backup/restore of all evidence/history/versions and rollback on corrupt references. SQLite-to-D1 fixture conversion is tested separately. They are not production backup automation.

Before hosted shared writes: define owner/access for encrypted external backups; inventory synthetic records and sensitive text; approve dry-run retention (candidate: resolved records/unreferenced diagnoses older than 30 days); verify references and current storage/row accounting; back up before changes; execute a separately authorized, versioned procedure; restore and compare full evidence in a disposable destination. Keep backup files out of Git/frontend assets. Seed recovery inserts missing deterministic records without overwriting visitor work or resetting budgets.

Local evidence: independent ASGI clients share records; one actual local emulator termination/restart preserves ticket version, ordered history, repair note, complete diagnosis and quota counter. Local file persistence survives that process, not an arbitrary new persistence directory. It proves neither hosted Worker redeploy survival nor Cloudflare inactivity guarantees. Documented D1 managed storage/7-day Free Time Travel remains to be tested with approved account access in Phase B.

## Availability and $0 fallback

The app counters protect a small shared allowance, not dependable anonymous availability under attack. Rejected requests cost CPU; retained-data scans can exceed D1 row quotas. No account-wide quota, firewall, trusted IP or billing configuration was verified. Hosted monitoring, operator kill-switch access, backup recovery and abuse response are still required.

If dependable shared writes/compute cannot meet verified Free limits, recommend to Planning a **read-only shared synthetic demonstration with bounded local interaction**, or another separately researched zero-cost runtime. This would change approved shared-write behavior and needs Planning approval; it has not been silently implemented as the release. A paid plan is not an option under the budget.

Official quota/runtime/security references and verification date are in [Free-tier feasibility](FREE_TIER_FEASIBILITY.md) and [compatibility](CLOUDFLARE_COMPATIBILITY.md).
