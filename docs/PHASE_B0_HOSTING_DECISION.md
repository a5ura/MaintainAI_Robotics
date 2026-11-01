# Phase B.0 provisional hosting decision

Verified/researched November 1, 2026 UTC. **No complete public stack or user account is Free-verified.** Local engineering supports a provisional preference: native FastAPI on Render Free, external Neon Free PostgreSQL, existing frontend on free static Pages (or verified same-origin build). This preserves Python and durable shared state without retrying the blocked Pyodide route. It is conditional, not deployable approval.

| Candidate | Evidence obtained | Missing gate / decision |
| --- | --- | --- |
| Render Free Python + Neon Free + static Pages | Native local FastAPI/Pg/static integration proven; review-only Render manifest. Neon and Pages official-source documentation read. | Render Free/billing/FastAPI pages CONNECT 403. Current RAM/CPU, Python versions, external DB egress, sleep/wake, compute hours, bandwidth, card/hold, auto-billing, portfolio terms, suspension and manifest validity all unverified. Do not quote old limits as current. |
| Vercel Hobby native Python + Neon | Official Vercel FastAPI example and runtime source confirm native Python/ASGI integration exists. | Hobby terms page CONNECT 403; permanent Free eligibility, portfolio/commercial terms, card, automatic billing/overages, RAM/CPU/duration, sleep, bandwidth and external DB limits unverified. Serverless lifespan/pooling adapter not implemented/tested here. Conditional comparison only; cannot label it a genuinely free complete alternative yet. |
| Python Workers + D1 | Prior A.2 local storage/contract proof retained; 95 tests pass. | Required official Pyodide index previously CONNECT 403; no approved new access route. No retry/expansion in B.0. Wasm/JS binding runtime, billed resources, hosted persistence and account eligibility remain unverified. |

Render's ephemeral service disk and 30-day Free PostgreSQL expiry are exclusions supplied by the assignment; their current official pages were inaccessible. Never store durable records there. Use external durable PostgreSQL; service sleep/redeployment should not destroy external records, but actual hosted behavior still requires testing.

## Sources and evidence boundaries

Exact request results, URLs, byte lengths and SHA-256 hashes are in `evidence/b0/provider-sources.json`. Official source content read:

- [Neon plans](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/introduction/plans.md): Free $0/month, 100 CU-hours/project/month; 1 GB storage/project (20 GB/account), 5 GB transfer/project/month; 10 branches, forced idle suspension after five minutes, maximum 2 CU. Six-hour restore history, capped at 1 GB-month retained history, one manual snapshot. CU/transfer exhaustion suspends service until allowance renews; storage growth fails at cap. These are documentation observations, not this user's actual project settings or a no-card guarantee.
- [Neon Python guide](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/guides/python.md): native Python drivers and sample channel-binding connection URL. Psycopg preserves and supports this security option; an asyncpg prototype was discarded after local incompatibility, without weakening the URL.
- [Vercel FastAPI example](https://raw.githubusercontent.com/vercel/examples/main/python/fastapi/README.md) and [runtime source](https://raw.githubusercontent.com/vercel/vercel/main/packages/python/src/index.ts): native Python evidence, not Hobby pricing proof.
- [Pages pricing](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/pages/functions/pricing.mdx): static asset requests free/unlimited. Builds, account eligibility, transfer/application terms and this user's limits need separate verification. No Pages Functions are proposed.

Blocked official pages: https://render.com/docs/free, https://render.com/docs/billing, https://render.com/docs/deploy-fastapi, https://vercel.com/docs/plans/hobby (CONNECT 403). Guessed Neon free-tier/billing source filenames and Vercel package README returned 404; no claims rely on them. Sources on mutable main branches were hashed at observation time, not treated as immutable pricing promises.

## Read-only Planning checklist before any provisioning

- Inspect actual signed-in Render, Neon and static-host account pages; confirm eligibility and intended permanent Free plans, not trials/credits. Record date and applicable terms/region.
- Verify whether any card, verification hold, billing activation or automatic upgrade is required. **Any incremental cost/hold or paid activation fails this assignment.** Do not enter payment details or create resources during this check.
- Verify Render's exact Free runtime/RAM/CPU/Python/port/build limits, idle/wake, monthly hours/transfer, external Neon connectivity and suspension behavior. Verify portfolio usage permitted. Confirm manifest plan free and autoDeploy false in review, with no disk/database/add-ons selected.
- Verify Neon Free quotas, forced scale-to-zero and suspension at limits in the actual account; confirm no automatic paid upgrade, no destructive expiry, supported pooled TLS URL and role restrictions. Document compute/readiness traffic and backup/history limits. Confirm restore/backup storage can remain free; short provider history is not independent disaster recovery.
- Verify Pages Free static plan/build allowances and HTTPS domain/CORS URLs. No assumed domain purchase, paid analytics, uptime or add-ons.
- Establish quota monitoring and operator responsibility using included tools, protected backups and retention approval. Disable paid upgrades/add-ons where controls exist. If a hard no-spend cap cannot be established, stop before provisioning.
- Obtain separate authorization for resources, hosted tests and release. No account or hosted verification has occurred here.

## Illustrative monthly capacity, not a provider bill prediction

Assume 20 visitors/day, each two diagnoses, one ticket, two updates and eight reads: 100 writes + 160 reads/day, plus 20 health calls = about 8,400 API calls/month. Static requests are separate. At 0.4 MB evidence + 0.2 MB other data/day: roughly 18 MB/month before indexes/bloat/history. Local synthetic retained lists of 100/1,000/7,500 tickets occupied roughly 9–13 MB total; repetitive TOAST compression makes this unsuitable as a real-data capacity promise.

Example compute: 20 disjoint six-minute active windows/day × 30 days = 60 active hours; at assumed 0.25 CU average this is 15 CU-hours/month. An always-active 0.25 CU database for 730 hours would consume 182.5 CU-hours and exceed documented 100. Neither minimum CU nor wake behavior was measured hosted. Do not continuously poll database readiness or add keep-alive services.

Large evidence rereads can exceed 5 GB/month even at 2,000 requests/day. The 64 MiB/day snapshot cap could reach the 512 MiB application high-water mark in about eight days under abuse. The guard blocks writes before the documented 1 GB project limit, but account-wide storage, concurrent overshoot, indexes/bloat and quota-counter writes require monitoring; it is not a hard physical allocation reservation. Anonymous visitors can exhaust quotas and deny availability. Service suspension is acceptable for spending protection but does not establish reliable permanent anonymous writes. If defensible free operation cannot be established, Planning must approve a read-only shared/local-mutation fallback; it was not silently implemented.
