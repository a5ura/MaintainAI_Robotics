# MaintainAI Robotics — Deployment Phase A.2 Completion Report

November 1, 2026 UTC. Local implementation/verification only. V1 is not publicly released.

## A. Repository and baseline

Repository `a5ura/MaintainAI_Robotics`; fetched main includes merged Phase A.1 PR #6 at **`966c809d6f716949c3183f84bb39ce970071a266`**, parents `e940a83` and `5199f94`. Initial worktree clean; branch `feature/v1-deployment-phase-a2`. Existing managed cloud Linux x86_64, not Windows/Desktop proof. Python 3.12.14; Node 24.19.0; npm 11.9.0; Git 2.52.0; Wrangler 4.156.0; workerd package 1.20261023.1. No new dependencies. Implementation and report commits/final remote SHA are returned in the Git handoff.

## B. Implementation

Added schema v2 and shared portable snapshot serialization/integrity helpers; async D1 chunk persistence/reconstruction with atomic byte charging; version-aware local migrations; protected immutable rows; compatible legacy inline reads; guarded fixture backup/restore; transactional equipment counts; indexed ticket cursors and bounded history; matching native SQLite pagination; frontend load-more controls preserving drafts; new unit/contract/browser tests and reproducible retained-data/restart measurements. Diagnostic algorithms, approved PRD, Project 1 and V2 are unchanged. No second engine or hosting architecture switch.

## C. Chunked snapshot storage

Manifest: stable ID, format/schema, total stored bytes, ordered chunk count, SHA-256, UTC timestamp, storage/budget metadata. Each FK-linked chunk is at most 256 KiB ASCII TEXT, avoiding base64 and unverified binary binding conversions. One D1 transactional batch inserts marker, manifest, chunks and the trigger's quota debit. Failed chunks/quotas/constraints roll back everything. Idempotent retries charge once; mismatched IDs/content return 409; conflicting concurrent and legacy races cannot replace original evidence. Database triggers prevent overwrite, partial deletion and invalid extra chunks.

Reads fetch at most 16 chunks/query and validate count/order/length/checksum/identity before decoding. Corrupt/missing data returns safe 503. Ticket evidence remains complete; legacy inline records are supported. Maximum accepted 2,000-sample and 2 MiB-body fixtures round-trip, as does dense valid evidence: **2,216,579 canonical stored bytes / 9 chunks**, corresponding to the former >2 MB single-row failure. Unicode multichunk fixtures, migration, rollback, concurrent retries, corruption, ticket links and recovery are tested. No new accepted-input restriction or evidence truncation.

## D. Budget and storage

Default new-snapshot allowance corrected to **64 MiB/day**. Charge uses actual canonical stored bytes plus 16 KiB per chunk and 16 KiB per manifest allowance for conservative logical overhead. Dense evidence charge **2,380,419 bytes**. Identical retries and failed transactions add zero charge; simultaneous distinct saves cannot overspend. This is a logical storage budget, not a provider-space meter. Request/write reservations remain 2,000/250 per UTC day and may count failed HTTP attempts conservatively.

Measured emulator database ~4.75 MB for 7,500 tickets, ~10.1 MB after 2,500 long notes, ~2.23 MB extra for dense evidence; raw `size_after`/row metrics are in `PHASE_A2_MEASUREMENTS.json`. A modest 20-visitor/day model fits comfortably; sustained abuse at 64 MiB/day cannot fit 500 MB over a month. Total capacity, approved retention and anonymous availability remain public-deployment blockers. Increasing the application allowance does not increase provider Free quotas or authorize billing.

## E. D1 query performance

Synthetic fixtures: **100 / 1,000 / 7,500 tickets**, plus **2,501 events** on one ticket. Actual local D1 metadata, not returned-row guesses:

- Cached equipment counts: **4 rows read at all sizes**; maintained transactionally on ticket creation/deletion and rebuilt by migration/fixture restore.
- Global/filtered first pages: at most **200 rows read** in these fixtures. New covering indexes support both patterns.
- Indexed continuation merges two bounded ranges; at 7,500 tickets global and filtered continuations read **468 rows**, not 7,500. Scanned/internal rows differ from returned rows.
- History initial detail: **203 rows read**; continuation at most **201**, returning up to 200 and a cursor. UI retrieves all events across pages without clearing repair drafts. Native SQLite exposes equivalent behavior.
- Dense snapshot save: **24 rows written** including indexes/metadata; load **10 rows read**; retry **zero writes**. Binding calls save/load/retry: **2 / 2 / 3**. A documented D1 batch counts as one call, while its statements still contribute row costs.

Single observations at increasing sizes, with raw statement/call/time/size metadata and query plans; no unsupported percentile or hosted-billing claims. Response pages account for the announced November 4 50 MB result cap. No real records purged. Fixture export/restore is bounded and quiesced; larger protected operator backups and production retention require separate review/authorization. Unresolved tickets are never silently expired.

## F. Security

Preserved anonymous/no-login experience, parameterized SQL, explicit CORS (not authentication), optimistic versions, Guided Demo UUID idempotency, seed protection, distributed D1 counters, read-only kill switch and safe quota/storage errors. New integrity guards and atomic budget charging strengthen storage safety. No public destructive endpoint.

Installed supported SDK inspection still shows request buffering before ASGI middleware. An official Worker entry point can intercept requests in principle, but actual request-stream/cancellation/ASGI interoperability remains blocked; no undocumented SDK modification or unverified interceptor was shipped. **Pre-ASGI streamed upload protection remains an explicit release blocker**; app-level size validation remains defense in depth. Hosted abuse resistance, monitoring, backup permissions and account-wide quota enforcement remain unverified.

## G. Cloudflare runtime

Performed exactly **one** bounded official index check through inherited proxy/TLS settings: `curl -I --max-time 20 https://index.pyodide.org/314.0.7/workers-runtime-sdk/` returned curl exit 56, **CONNECT 403 before destination TLS**. Stopped retrying as assigned. No mirror, TLS weakening, bypass, environment draft or publication. Actual Python Workers execution, Python/JS D1 conversions, billed CPU, Wasm memory and cold starts remain **UNVERIFIED**. All new persistence metrics are CPython + genuine local workerd D1, not Python Worker proof.

## H. Alternative hosting

Current primary-source comparison, URL/access evidence and ranked recommendation: [hosting alternatives](PHASE_A2_HOSTING_ALTERNATIVES.md).

1. **A: Python Workers + D1** remains conditional first choice to reuse existing implementation; actual runtime/resource and account evidence must pass.
2. **B: static + native Python host + Neon Free** is the next investigation if A fails. Neon documents $0/month, 100 CU-hours/project, 1 GB/project, 5 GB transfer and forced 5-minute idle suspension. Render Free/billing pages were blocked; actual free Python-host eligibility, RAM, sleep and card requirements are unverified. Neon alone is not a complete free deployment.
3. **C: JS/TS serverless + D1** is only a Planning architecture-change proposal. No Python engine translation implemented; CPU fit and parity would still need proof.

No qualifying extra option D was established. Current Hugging Face documentation excludes a no-paid-plan Docker/FastAPI solution despite free CPU Basic hourly pricing. No complete stack is account-verified at $0; no architecture switch or provider activation occurred.

## I. Tests

Baseline before implementation: **97 backend / 39 frontend / 44 adapter tests and TypeScript/build passed**. Chromium integration was exercised after integrated changes, not claimed as a separate pre-edit run.

Final results:

- `.venv/bin/python -m pytest backend/tests cloudflare/tests -q`: **163 passed** (97 existing backend plus 66 shared-adapter/policy/integrity/storage tests; SQLite contracts and genuine local D1 distinguished in fixtures), **0 skipped**.
- `npm --prefix frontend test`: **41 passed**, including history draft preservation and incident cursor loading.
- `npm --prefix frontend run build`: **TypeScript + production build passed**.
- `.venv/bin/python -m cloudflare.restart_probe`: **passed**, real isolated emulator termination/restart, additive v1 migration, large chunked evidence/notes/history/versions/budget and seed repeat preserved.
- `.venv/bin/python -m cloudflare.a2_measure`: **completed**, fixture sizes and raw D1 metadata above; not Worker CPU.
- Chromium: **16 passed (3.1m)** in the full final suite against genuine local D1; preserved native SQLite passed the original **15 tests (2.6m)** plus the new pagination test separately (**1 passed, 3.1s**). The new case creates 201 real API history events and verifies page continuation preserves an unsaved repair draft.

Normal/all four failures/Random replay, independent browser sessions, live Guided Demo and pending-save/manual takeover regressions remain covered. No existing test disabled. Existing snapshot-conflict and oversized-payload assertions were updated to the new required semantics: explicit D1 conflict and successful large round-trip, with native SQLite preservation intact. During development, one fixture exceeded the local harness's 100-statement batch cap and one new UI test used an incomplete label; both were corrected before passing runs. Upstream Starlette/AnyIO, Node color and Vite 3D chunk warnings remain. Actual Wasm/pre-ASGI/hosted tests remain blocked/unverified, not reported as skipped passes.

Commands/raw outputs/evidence categories: `PHASE_A2_EVIDENCE.json`, `docs/evidence/a2/`, measurement/recovery JSON. Generated M3 screenshots/timings are restored after browser checks; no unrelated artifact changes.

## J. Costs

No new dependency, provider resource, account, billing enrollment, paid trial/API/capacity, public deployment, production migration, environment publication or merge. Existing authorized managed compute only. Current cloud metadata exposes no provider identity/secret bindings. Actual account eligibility, Free-only settings, payment requirements, quotas and invoices are unverified; no account-specific $0 spending certification is invented. No paid fallback selected.

## K. GitHub

Implementation commit **`c5c78380cd297a4bc81e8ee0774038e275e28c19`** pushed to `feature/v1-deployment-phase-a2`, targeting main and referencing merged PR #6. A separate documentation/evidence commit follows; the final remote SHA is supplied in the completion message.

Attempted exactly once: `gh pr create --repo a5ura/MaintainAI_Robotics --base main --head feature/v1-deployment-phase-a2 --title "Complete D1 snapshot reliability and evaluate zero-cost hosting alternatives" --body-file docs/PHASE_A2_PR.md`. Result: exit 1, `Post "https://api.github.com/graphql": Forbidden`. **No A.2 PR was created or confirmed.** Git push succeeded independently.

[Create/review PR](https://github.com/a5ura/MaintainAI_Robotics/compare/main...feature/v1-deployment-phase-a2?expand=1), using the [prepared PR description](PHASE_A2_PR.md). No repeated API attempts or automatic merge.

Changed files: shared snapshot helper; D1 repository/schema v2; native pagination/shared API; Worker budget default; local migration/backup/restart/measurement tools; adapter/integrity/HTTP/UI/browser tests; four required A.2 docs plus raw evidence/PR description; current architecture/storage/hosting/security/release/status/README/AGENTS/decision notes. PRD, diagnostic rules/model/kinematics, Project 1 and V2 unchanged. Final pushed commit is supplied in the completion handoff; no automatic merge.

## L. Verdict

**APPROVE FOR INDEPENDENT REVIEW.** The local reliability milestone is implemented and tested, including complete large evidence and bounded maintenance access. This approves technical review of the branch, **not public deployment or a hosting selection**. Before public release, Planning must resolve actual Python/Wasm/full-request Free CPU/memory, supported pre-ASGI body bounds, Free-only account/billing eligibility, total-capacity/retention/anonymous availability, protected production backup and real hosted redeployment/recovery. If Python Workers fails the Free workload, return to the ranked alternatives without purchasing capacity or starting a second engine without approval.
