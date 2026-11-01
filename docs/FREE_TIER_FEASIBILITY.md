# Free-tier feasibility — November 1, 2026 UTC

**CONDITIONAL GO for investigation only.** Nothing establishes this user's account is Free-only, that the full diagnostic input range fits Free CPU/memory, or that the current single-row adapter supports all complete evidence. No deployment or paid fallback is selected.

## Three evidence categories

| Resource | Documented current Free allowance | Locally verified | Account-verified |
|---|---|---|---|
| Workers requests | 100,000/day, UTC reset | Local requests only; no hosted metering | Unverified |
| Worker CPU / memory | **10 ms/invocation / 128 MB** | Actual Python Worker unavailable; no authoritative billed CPU | Unverified |
| Startup / bundle | 1 second startup execution; 64 MiB uncompressed Worker bundle in current docs | Python bundle/startup not built or measured | Unverified |
| Static Assets | Free/unlimited asset requests, no storage charge; 20,000 files/Free Worker, 25 MiB/file | 5 build files; real local serving/SPA pass | Unverified |
| D1 row accounting | 5 million rows read/day, 100,000 rows written/day | Genuine local SQL metadata recorded; not billing | Unverified |
| D1 storage | 500 MB/database, 5 GB/account, 10 databases | Disposable local files only | Unverified |
| D1 calls | 50 queries/invocation; current docs count one `batch()` as one call | API paths use a few binding calls, not 50 independent calls | Unverified |
| D1 row / SQL / parameters | 2,000,000-byte row/string, 100 KB SQL, 100 bound parameters | Oversized local value accepted by emulator; explicit adapter guard added | Unverified hosted enforcement |
| Recovery | 7-day Free Time Travel; 10 restores/10 minutes | Synthetic local backup/restore and restart | Unverified hosted recovery |

Cloudflare documents Workers Free hard-limit errors (CPU 1102, daily requests 1027; matching Static Assets Worker-first paths return 429 at request exhaustion). D1 Free daily read/write exhaustion returns errors until UTC reset; storage exhaustion prevents growth. Paid plans can incur metered charges. These published policies do not prove no card requirement, no existing paid configuration, no other account workloads or no automatic commercial exposure for this user.

Provider credentials/identity were absent from configured cloud metadata; names-only checks found Cloudflare token/account variables unset. No account was queried, created or upgraded. No billing page, trial, credit purchase or payment flow was used. The task used existing authorized compute and public/local tooling only; no new chargeable service was activated. **Actual account spending/invoices remain unverified**, rather than inventing a $0 bill.

## Reproducible measurements

Command: `.venv/bin/python -m cloudflare.measure`. Linux x86_64, reported 5 CPUs/~34 GB RAM, CPython 3.12.14, real local workerd D1 via a loopback HTTP bridge. Fifteen repetitions per payload/operation; five concurrent update pairs. Full min/median/p95/max, process CPU, body/snapshot sizes, statuses and D1 row/duration metadata: [JSON](PHASE_A_MEASUREMENTS.json).

| Synthetic payload | Samples / request bytes | Pure validation + diagnosis median CPU (CPython ms) | ASGI + local D1 median wall ms | HTTP |
|---|---|---|---|---|
| Small | 1 / 328 | 0.029 | 117.258 | 200 |
| Normal | 11 / 3,934 | 0.203 | 117.083 | 200 |
| Dropped object | 11 / 3,889 | 0.233 | 118.732 | 200 |
| Positioning error | 11 / 4,086 | 0.250 | 119.568 | 200 |
| Vision failure | 11 / 4,056 | 0.248 | 117.472 | 200 |
| Unexpected robot stop | 6 / 2,191 | 0.133 | 120.878 | 200 |
| Multi-anomaly | 11 / 4,205 | 0.277 | 118.208 | 200 |
| Maximum sample count | 2,000 / 1,425,849 | 52.409 | 319.641 | 200 |
| Maximum body (includes ignored padding) | 2,000 / 2,097,152 | 50.971 | 320.860 | 200 |
| Dense valid evidence | 2,000 / 1,790,569 | 79.767 | 174.759 | **503, explicit row-limit gap** |

The maximum-body case fills the existing 2 MiB JSON limit with an ignored padding field to test parsing; the separate dense case exercises real evidence expansion. Max-sample/body snapshots are 1,966,070 bytes, while dense evidence is 2,346,790 bytes, above D1's documented row cap. Large-load cases are synthetic load tests, not intended demonstrations of additional faults. Multi-anomaly combines positioning and vision evidence without using scenario labels in rule decisions.

The benchmark temporarily raises only its local snapshot-byte allowance to 16 MiB/day to observe large valid requests; the checked-in policy default remains 2 MiB/day. Identical evidence IDs make repeated diagnoses idempotent. Guided ticket benchmark measures the first create plus stable-ID retries, not fifteen new tickets. Mutation and associated history/version effects are included. Concurrent updates return exactly one 200 and one 409 in all five pairs.

The JSON also records health (no DB), equipment/list/detail, Guided Demo creation/retries and ticket updates. Bridge wall time includes repeated CPython HTTP-client setup and local IPC; it is not a prediction of deployed D1 latency. Local D1 metadata duration has coarse millisecond resolution. Statement metadata count is not the per-invocation query count, since batches return metadata for several statements. Row/index writes include quota counters and history triggers. Repeated requests scan the small disposable fixture set, not a production-size database.

**CPU:** process CPU counts CPython work across its test-client threads, excludes separate workerd CPU and is not Cloudflare's accounting. I/O wait does not count toward billed CPU. Maximum-payload CPython costs above 50 ms are a warning, not proof of a particular Wasm multiplier. The **10 ms Free requirement remains UNVERIFIED**. If actual Python Workers consistently exceed it, reject this runtime architecture at $0; do not upgrade. Any smaller limits or local/read-only fallback require Planning approval.

**Memory:** process peak RSS was 103,168 KiB across the complete benchmark, including framework/data/test machinery. This is not per-request Wasm memory and cannot demonstrate a 128 MB Worker fit. Worker memory remains unverified.

**Startup:** two separate local JS/D1 emulator starts took 1,379.919 and 1,160.546 ms wall-clock to serve assets. These are developer-tool readiness times, not Python initialization, billed startup CPU or deployed cold starts. Python deployment snapshots, cold requests, resource-limit termination and inactivity wake remain unverified.

**Frontend:** 5 unchanged build outputs, largest 843,839-byte 3D chunk (224,910-byte gzip in the measurement tool). Existing Vite >500 KB chunk warning remains. Actual local Static Assets tests compare every file byte-for-byte and check nested SPA navigation. No browser/GPU performance claim for the Windows laptop is made.

## Daily usage and abuse model

A modest model: **20 visitors/day**, each 2 diagnoses, 1 ticket, 2 note/status updates and 8 reads → 100 mutating + 160 read API calls, plus 20 health calls. About 40 unique typical snapshots × ~10 KB = 0.4 MB/day, plus ~0.2 MB/day of bounded ticket/history text before indexes. Actual inputs/notes and database overhead vary. Thirty days is roughly 18 MB of payload data in this model, not a storage guarantee. At the configured snapshot ceiling alone, 30 days permits 60 MiB of new evidence; ticket/history/index overhead is additional.

Defaults share **2,000 non-health API requests**, **250 mutating HTTP requests**, and **2 MiB new snapshot JSON/day** across instances in D1. At typical indexed query sizes this is comfortably below published daily write quotas; measured metadata is in the JSON. A rough 12 domain/index rows per allowed mutation plus counters is thousands of writes/day, not 100,000. This is an estimate, not a guaranteed provider accounting bound.

Anonymous bots can spend the whole budget before recruiters arrive, call health until the account's Worker request cap, submit unique large snapshots, or append maximum-length notes. Quota rejection still costs Worker invocation CPU and D1 lookups. The read budget does not bound rows scanned: equipment counts and the global ticket sort can scan the retained ticket set. At 7,500 records, 2,000 equipment reads could exceed 5M scanned rows despite the app request limit. Retention, query/index review, measured large-data row counts and any verified free platform limits remain release gates. Do not advertise these app counters as complete DDoS or provider-quota protection.

Default caps favor containment over availability; they do not guarantee all desired demo traffic. No scheduled cleanup was provisioned or run against real data. Shared writes still require a reviewed retention/backup policy.

## Current official sources actually read

Checked November 1, 2026 UTC through provider-owned source pages:

- [Workers pricing / Free and Paid](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/pricing.mdx)
- [Workers CPU, memory, request, startup, bundle and asset limits](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/limits.mdx)
- [Static Assets billing and fail-closed routing](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/static-assets/billing-and-limitations.mdx)
- [Python/Pyodide support and lifecycle](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/languages/python/how-python-workers-work.mdx)
- [D1 pricing quotas / row accounting](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/workers/d1-pricing.mdx)
- [D1 Free exhaustion behavior](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/d1/faq-pricing.mdx)
- [D1 storage, row, query and Time Travel limits](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/d1/platform/limits.mdx). The 50 MB result limit is documented to start **November 4**, after this check.
