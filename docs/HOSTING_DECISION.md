# Public hosting decision

## Current Phase B.1 checkpoint — November 1, 2026 (America/New_York)

B.0 PR #8 is merged at `8d39f2af9dee9a1d21d658950ddb15a228651848`. B.1 branch `feature/v1-hosting-phase-b1` prepares one same-origin Render Free Python service plus external Neon Free: production frontend build, hosted route/static/CORS hardening, restricted runtime SQL and constrained real PostgreSQL rehearsal. SQLite/D1, PRD, robot and diagnostic algorithms remain intact. See [B.1 setup](DEPLOYMENT_PHASE_B1.md), [completion](PHASE_B1_COMPLETION_REPORT.md) and future-only [B.2 runbook](PHASE_B1_HOSTED_RUNBOOK.md).

No user-facing data/report download exports exist in merged V1; this B.1-listed workflow is an explicit pre-existing acceptance gap, not a passing check. Keep it open for a bounded correction before public release. Render current Free/runtime terms and all account/card/hard-cap eligibility remain unverified. No provisioning, billing, deployment, production migration, environment publication or merge. Hosted verification requires separate B.2 authorization; anonymous availability cannot be guaranteed by global quotas. Earlier checkpoint text below is historical.

## Historical Phase B.0 checkpoint — November 1, 2026 UTC

Main includes merged A.2 PR #7 at `8b8491035cfcf388378376dd8b9b2e649dcfed94`. Branch `feature/v1-hosting-phase-b0` adds a native async Psycopg/PostgreSQL adapter and explicit FastAPI hosting entry point while preserving SQLite, D1, diagnostic algorithms and the approved PRD. Real local PostgreSQL integration, independent API/process/database restart, immutable full evidence, concurrency, idempotency and protected backup/recovery are tested in managed Linux. Desktop/Windows and hosted durability remain unverified. See [B.0 setup](DEPLOYMENT_PHASE_B0.md), [adapter](POSTGRESQL_ADAPTER.md), [hosting gates](PHASE_B0_HOSTING_DECISION.md) and [completion report](PHASE_B0_COMPLETION_REPORT.md).

Render Free + Neon Free + free static hosting is provisional: Render current terms and all account-level Free/card/automatic-billing eligibility remain unverified. No public deployment, provisioning, billing activation, real-record migration, environment publication or merge is authorized/performed. No new Cloudflare/Pyodide access route was attempted. Anonymous quotas and a storage high-water guard do not guarantee permanent availability; release still requires provider/account, abuse, backup and hosted verification. Earlier checkpoint text below is historical.

## Historical Phase A.2 checkpoint — November 1, 2026 UTC

Phase A.1 PR #6 is verified merged at `966c809`. Phase A.2 explicitly authorizes local storage hardening despite the unchanged index CONNECT 403, superseding A.1's deferred-expansion gate for this assignment. New D1 schema v2 provides atomic immutable manifest/chunks, verified reconstruction and quota charging; the large-evidence row-size defect is resolved locally. Default snapshot allowance is now 64 MiB/day including conservative logical overhead. Cached counts, indexed 200-record ticket/history pages and UI continuation preserve drafts and the native SQLite workflow. Legacy inline evidence and synthetic migration/backup/restart remain supported.

Actual Python Workers/JS binding execution, billed CPU/memory, pre-ASGI streamed body enforcement, account Free-only terms and hosted durability remain unverified. The total 500 MB Free storage/retention and anonymous availability gates are not solved by a daily budget. No deployment, resource provisioning, billing, real-record migration, environment publication or merge. Current evidence: [A.2 report](PHASE_A2_COMPLETION_REPORT.md) and [details](PHASE_A2_HOSTING_ALTERNATIVES.md). Earlier checkpoint statements below are historical, including the previous single-row restriction and 2 MiB/day default.


## Current Phase A update — November 1, 2026 UTC

M3 PR #4 is merged. Local D1/Static Assets and integrity/recovery work is implemented and tested; actual Python Workers startup is blocked by Pyodide index access. Billed CPU/memory, account plan/cost and hosted redeploy durability remain unverified. Dense valid evidence exceeds the prototype's single-row D1 cap; pre-ASGI body buffering and anonymous-read accounting also need resolution. **CONDITIONAL GO for further investigation; no deployment approval.** See [current Phase A evidence](DEPLOYMENT_PHASE_A_REPORT.md). No provider resources or billing were activated.

The comparison below is the historical October 31 research checkpoint; current runtime versions, quotas and technical gaps are in [Cloudflare compatibility](CLOUDFLARE_COMPATIBILITY.md) and [Free-tier feasibility](FREE_TIER_FEASIBILITY.md).

## Historical October 31 research

**Decision: do not deploy in this task.** The local M3 candidate is functional; no complete hosted architecture has passed account/cost, runtime, and durable-redeployment verification. No provider account, database, billing method, or service was created. The assignment's section 5 approval/access gate remains in force.

## Evidence and access

Current official documentation was read from provider-owned public GitHub sources (links below), not third-party free-tier roundups. Direct requests to `render.com/docs/free`, `render.com/docs/billing`, `render.com/docs/deploy-fastapi`, `neon.com/docs/introduction/free-tier`, and `supabase.com/pricing` returned proxy **HTTP 403**. Guessed Render GitHub documentation locations returned 404/repository-not-found and were not treated as evidence.

Cloud environment metadata exposed no configured provider identity/secret bindings. Names-only checks found CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, NEON_API_KEY, DATABASE_URL and RENDER_API_KEY unset. This does not prove the user lacks accounts; it means account entitlement, plan, card requirements and deploy authorization are **not verified here**. GitHub Git access does not establish hosting-provider access. No credentials were read or printed.

## Complete architecture candidates

| | A — Workers Static Assets + Python Workers/FastAPI + D1 | B — Cloudflare Pages React + native Render FastAPI + Neon Free PostgreSQL |
|---|---|---|
| Public frontend | Static Assets; static requests free/unlimited, API-only Worker routing | Pages static assets free/unlimited; 500 builds/month, 1 concurrent, 20-minute build limit, 20,000 files |
| Backend compatibility | Official Python Workers FastAPI/ASGI support; Pyodide/Wasm, Python 3.13 example | Expected native Python fit, but current Render compatibility/free/billing pages blocked; not verified |
| Central persistent store | D1, independent of individual Worker execution/deployment; requires new repository adapter | Neon managed PostgreSQL, independent of Render filesystem; requires PostgreSQL repository adapter |
| Shared anonymous records | Same-origin API → centrally bound D1; per-browser simulation state retained | Explicit public API origin/CORS → Render API → Neon; per-browser state retained |
| Free allowances verified | Workers: 100,000 API requests/day, **10 ms CPU/request**, 128 MB/isolate. D1: 5M rows read/day, 100k rows written/day, 500 MB/database, 5 GB/account, 10 databases, 50 queries/invocation. 7-day Time Travel recovery | Pages quotas above. Neon docs updated Oct 23: $0/month, 100 CU-hours/project/month, 1 GB/project (20 GB/account total), 5 GB transfer/project/month, 10 branches/project |
| Sleep/inactivity | No always-running container; Python initialization snapshot documented. No storage-expiration guarantee inferred; confirm provider account/retention terms before release | Neon compute suspends after 5 minutes idle. CU-hours/network exhaustion suspends compute until next period/upgrade; storage-growth operations fail at cap. Render cold-start/sleep/quota terms unverified |
| Overage behavior | Workers Free CPU/request exhaustion fails; static routing that invokes a Worker returns 429 at request limits. D1 Free read/write exhaustion returns errors; storage cap prevents growth. Paid-plan usage can bill, so **Free-only account verification is mandatory** | Neon Free limits suspend/refuse operations and do not delete data per official FAQ; paid plans have metered charges. Render account/billing/overage policy unverified, so $0 safety cannot be established |
| Card/eligibility | Default Workers Free access documented; an explicit no-card guarantee and this user's actual account eligibility were **not independently established** | Neon $0 plan documented; this user's card/eligibility/account configuration unverified. Render billing/card requirement unknown because official pages inaccessible |
| Required code work | Existing synchronous sqlite3/file adapter is not a D1 binding. Port repository/transactions/version checks/seeding to D1, test Python ASGI package compatibility and the **10 ms Free CPU budget**, reduce public request size if necessary | Port repository to PostgreSQL, configure backend API/CORS/build origins; verify Render startup and cold-start behavior against current 10-second client timeout |
| Restart/redeploy durability | Expected from separate managed database, **not actually tested**. Must test independent browsers, Worker redeployment and recovery | Expected from separate managed PostgreSQL, **not actually tested**. Must test Render restart/redeploy, Neon sleep/wake and cross-browser records |
| Verdict | Best evidence-backed **conditional candidate**, not a drop-in or deploy-verified solution | Complete conceptual layout, **not verified viable at $0** until current Render terms/access are available |

An alternate layout splits A's static frontend onto Cloudflare Pages while keeping Python Workers+D1. It has the same backend/storage/CPU constraints plus CORS/API-origin configuration; this is not a second independently validated backend provider.

**Why fewer than two fully verified viable architectures:** A still needs runtime/adapter/account proof; B lacks current official backend billing evidence; no configured provider access permits real durability tests. Therefore there are **zero fully verified $0 deployments**, not two purportedly free solutions. No paid fallback is selected.

## Rejected or incomplete alternatives

- **Hugging Face Docker/Gradio Spaces:** current official overview explicitly says creating compute Spaces requires a paid PRO/Team/Enterprise plan even though CPU Basic is listed at $0/hour. Static Spaces are free but cannot supply this FastAPI backend; the limited free ZeroGPU/Gradio exception is not a drop-in native FastAPI deployment. Default 50 GB disk is nonpersistent. Reject for this architecture/budget.
- **Render local SQLite:** no free persistent-volume entitlement was verified. Never treat an instance's local SQLite file as durable across service redeployment.
- **GitHub Pages:** can host a noncommercial portfolio static frontend (published site ≤1 GB, soft bandwidth 100 GB/month and 10 builds/hour), not FastAPI or a central writable database. Terms prohibit using it as free hosting for commercial SaaS/business; this project is an engineering demo. It does not solve backend/storage alone.
- **Supabase:** current pricing/eligibility/inactivity/durability terms inaccessible here. Do not repeat historical free-tier numbers as current verification.
- **Neon:** useful evidence-backed database candidate, not proof of a free native Python backend. Free-plan hard limits avoid automatic paid overages only while the account actually remains on Free; no plan upgrade is authorized.

## Recommendation and precise gate

1. Review A as the first **technical feasibility spike**, without enabling a paid plan. Confirm an existing Cloudflare account is eligible for Workers/D1 **Free only**, no required billing enrollment, no auto-upgrade/metered add-on and no incremental charges. If a card/chargeable step is required, stop; do not assume approval.
2. Provide scoped deployment access through secure environment settings (never chat/frontend secrets), after selecting the architecture. Current provider access is unverified. Read-only research of B additionally needs network access to `render.com`; this task did not change environment networking.
3. Complete/test the D1 adapter and ASGI package/runtime path, including atomic optimistic updates, idempotent guided writes and the 10 ms/128 MB limits. Local CPython tests do not validate Pyodide. If it fails the Free budget, report the $0 limitation rather than upgrading.
4. Enforce cross-instance anonymous write/read budgets at the platform/database boundary, explicit CORS, retention/backups and seed recovery. The optional local per-process limiter alone is not sufficient for distributed Workers.
5. Only after verified terms/access and the assignment's publication authorization are satisfied: deploy a labelled public demo, keep credentials server-side, then test separate browser sessions and record survival across **real service redeployment**. Back up before any approved record migration. Never migrate/publish existing records implicitly.

## Official references actually read

All checked October 31, 2026. Official source repositories are linked where website access was restricted.

- [Cloudflare FastAPI support and ASGI/static frontend example](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/languages/python/packages/fastapi.mdx)
- [Python Workers runtime/Pyodide and deployment snapshots](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/languages/python/how-python-workers-work.mdx)
- [Workers Free/Paid pricing](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/pricing.mdx)
- [Workers limits, CPU and memory](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/limits.mdx)
- [Static Assets billing/limits and fail-closed request behavior](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/static-assets/billing-and-limitations.mdx)
- [D1 pricing metrics](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/workers/d1-pricing.mdx), [Free-quota failure behavior](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/d1/faq-pricing.mdx), [database/Time Travel limits](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/d1/platform/limits.mdx)
- [Pages build/file limits](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/pages/platform/limits.mdx), [static-asset pricing](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/pages/functions/pricing.mdx)
- [Neon current plans and Free-limit consequences](https://github.com/neondatabase/website/blob/main/content/docs/introduction/plans.md), [application connection guidance](https://github.com/neondatabase/website/blob/main/content/docs/connect/connect-from-any-app.md)
- [Hugging Face current compute-plan requirement and disk limits](https://github.com/huggingface/hub-docs/blob/main/docs/hub/spaces-overview.md)
- [GitHub Pages scope and limits](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/github-pages-limits.md)

Unverified website pages attempted (not cited as read): [Render Free](https://render.com/docs/free), [Render billing](https://render.com/docs/billing), [Render FastAPI](https://render.com/docs/deploy-fastapi), [Supabase pricing](https://supabase.com/pricing). A free-tier label is not an account-specific no-billing guarantee.


## Phase A.1 runtime-first checkpoint

Phase A PR #5 is verified merged at `e940a83`. A dependency-free official-pattern Worker reproduces the package-index CONNECT 403 before app initialization; supported offline CLI resolution also lacks the required SDK cache. Runtime and billed resources remain unverified. Under the assignment's blocked-index gate, storage chunking, pre-ASGI enforcement and retained-data changes are deferred. No environment configuration, hosted resource, billing, production data or deployment was changed. Current evidence and exact next experiment: [Phase A.1 report](PHASE_A1_COMPLETION_REPORT.md).
