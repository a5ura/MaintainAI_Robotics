# B.1 hosting and strict $0 gates

## Current pre-B.2 verification — November 11, 2026 (America/New_York)

Read-only official-document lookup from the existing managed Linux environment. No authenticated Render/Neon access was available through the connected tools; signed-in dashboards were not inspected. Public documentation below is evidence about published terms, not this user's plan, remaining allowances or invoice. The November 1 record is preserved below as historical evidence.

### Published requirements verified today

- [Render Free](https://render.com/docs/free): 15-minute idle sleep, roughly one-minute wake, ephemeral filesystem and no Free persistent disk; Free Render PostgreSQL expires after 30 days. There are 750 shared workspace instance-hours monthly, with suspension on exhaustion. Bandwidth overages can be billed when a payment method exists; without one, Free services are suspended. Build overages can be billed unless a spend limit is reached; without payment or at the limit, builds stop. External-database traffic can trigger discretionary service suspension, with a paid tier described as recovery. That recovery is excluded by this project's budget. Render positions Free for hobby/testing rather than production reliability. Static sites also consume bandwidth/build allowances.
- [Render native runtimes](https://render.com/docs/native-runtimes) include Node/npm across runtimes. [Python](https://render.com/docs/python-version) and [Node](https://render.com/docs/node-version) support explicit version settings, consistent with the manifest's Python 3.12.14/Node 24.19.0 pins. Actual combined hosted build, exact Free CPU/RAM and sufficient build/transfer headroom remain unverified. The general [billing page](https://render.com/docs/billing) was inaccessible through web lookup; no account assurance is inferred.
- [Neon plans](https://neon.com/docs/introduction/plans): Free $0, 100 CU-hours/project/month, up to 2 CU, 1 GB/project and 20 GB/account Postgres storage, 5 GB/project/month public transfer, ten branches and mandatory five-minute idle suspension. Compute/transfer exhaustion suspends connections until renewal or upgrade; storage growth fails at its cap. Data is not deleted by these quota events. Suspended compute also blocks `pg_dump`, so backups must precede exhaustion. Six-hour restore history and one manual snapshot are listed; snapshot-storage pricing is also stated generally, so no-cost snapshot eligibility must be confirmed before use. No upgrade is permitted to obtain an early export.
- [Neon usage monitoring](https://neon.com/docs/introduction/monitor-usage) identifies organization billing, organization usage and project usage views. Those signed-in views were not accessed. No billing settings or plans were changed.

The [Render pricing page](https://render.com/pricing) was reachable, but the extracted page contained pricing-section placeholders rather than numeric resource/allowance tables. No numeric CPU/RAM, build or bandwidth allowance is inferred from that incomplete rendering.

### Remaining account and hosted questions — all OPEN / UNVERIFIED

| Gate | Evidence required before resource authorization |
| --- | --- |
| Eligibility | Actual Render workspace and Neon organization are permanent Free, suitable for this portfolio use; no expiring trial/credits or existing chargeable plan. |
| Card/hold | Whether signup/creation requires payment details or authorization hold; existing payment methods and automatic paid activation. Never enter a card or activate billing. |
| Hard no-charge behavior | Exact included bandwidth/build/compute/storage/history/transfer allowances and current shared-account consumption; enforcement rather than billable overages for every selected feature. Render's build spend limit is not proof of a bandwidth cap. |
| Runtime/resources | Combined pinned Python/Node build, actual Free CPU/RAM, build allowance, external Neon traffic policy and region pairing. No paid workaround. |
| Neon access | Direct owner and pooled restricted-runtime role support; real certificate/hostname/channel-binding and pooling behavior. No credentials in frontend, Git or chat. |
| Backup | Existing protected $0 independent storage, restore permissions and enough allowance to export before suspension; snapshot pricing/eligibility. No scheduled paid backup or new resource. |
| Operational acceptance | Anonymous shared-write/vandalism/quota-exhaustion risk, manual usage review and emergency shutdown; read-only still consumes transfer/compute. |
| Hosted acceptance | Actual cold wake, two-browser sharing, complete exports, restart/redeploy persistence and fresh isolated backup recovery. Not established by local tests. |

**B.2 provisioning/deployment: NO-GO.** Source correction may be reviewed independently. Keep the same-origin Render + external Neon proposal provisional. Importing the manifest creates resources and is not authorized. Only after account/cost/backup evidence and independent review may Planning request separate B.2 authorization and execute the [future runbook](PHASE_B1_HOSTED_RUNBOOK.md).

## Historical November 1, 2026 verification

Observed November 1, 2026 (America/New_York). No hosted/account verification. Exact URLs, outcomes and hashes: [provider-sources.json](evidence/b1/provider-sources.json). No proxy bypass/policy edit or new Pyodide attempt.

| Arrangement | Finding |
| --- | --- |
| A: Render Free serves React + FastAPI, Neon Free database | **Preferred provisionally:** one build/service/URL, same-origin API, fewer configuration mistakes. Local production-shaped integration proven. Render must support the pinned Node/Python build together and adequate Free resource/transfer limits; official pages currently inaccessible. |
| B: Render Static Site or Pages Free + Render Free API + Neon Free | Preserved alternative if static build/traffic strains the Python service. Adds a frontend host, public API URL and HTTPS CORS configuration. Pages static requests are documented free/unlimited; Render Static Site terms and actual accounts are unverified. No extra service created. |

Render sleep, ephemeral disk, expiring Free PostgreSQL and excessive service-initiated outbound-traffic suspension are assignment constraints to confirm in current terms. Use only external Neon for durable records. Distinguish asset/API response bandwidth, PostgreSQL uploads/queries and Neon-to-API evidence transfer; they are not one allowance. Same-origin immutable asset caching helps repeat visits but first-time clients still download roughly 1.1 MB uncompressed JS. External storage alone does not prove hosted durability.

## Historical official evidence

- https://render.com/docs/free, https://render.com/docs/billing, https://render.com/docs/native-runtimes: CONNECT 403. Exact current RAM/CPU, sleep/wake, hours/bandwidth/builds/outbound rules, compatible Node/Python versions, portfolio terms, card/hold and automatic billing/overages remain **unverified**. Guessed official GitHub docs README/free paths returned 404; no claims rely on them. Old numeric limits are not substituted.
- [Neon plans](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/introduction/plans.md): Free $0/month, 100 CU-hours/project/month, up to 2 CU, 1 GB/project and 20 GB/account PostgreSQL storage, 5 GB/project/month public transfer, ten branches; forced five-minute scale-to-zero. Six-hour restore history capped at 1 GB-month of changes, one manual snapshot, no scheduled backups on Free. CU/transfer exhaustion suspends compute until renewal/upgrade; storage-growing operations fail at the cap; quotas do not delete records. Card/automatic-upgrade assurances and this account's settings are not established.
- [Neon Python guide](https://raw.githubusercontent.com/neondatabase/website/main/content/docs/guides/python.md): native drivers and channel-binding URL. Existing Psycopg preserves channel binding and verifies remote TLS; actual Neon pooler/roles/connectivity untested.
- [Pages pricing](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/pages/functions/pricing.mdx): static requests free/unlimited when not invoking Functions. Builds, terms and account eligibility remain separate; no Functions selected.

## Read-only account checklist before B.2 authorization

1. Inspect actual signed-in plan/usage/billing pages, record date/region/terms and permanent Free portfolio eligibility. Reject trials/credits; do not create resources.
2. Establish whether signup or service creation requires card/temporary hold, activates billing or permits automatic paid upgrades. Do not enter payment details. Any compulsory charge/hold fails strict $0.
3. Confirm exact Render Free runtime, Node 24.19.0 + Python 3.12.14, resource/build/idle/transfer/outbound and external DB rules. No disk, expiring DB, cron, worker, paid monitoring, uptime or private-network add-on.
4. Confirm provider hard-stop/suspension rather than charges at **all** allowances, including existing account usage; disable paid upgrades/add-ons where supported. Application quotas are not billing caps.
5. Verify Neon region pairing, smallest Free compute (0.25 CU if offered), conservative maximum, forced sleep, direct owner/pooled runtime URLs, TLS/channel binding, custom restricted roles and storage/history/snapshot limits.
6. Confirm existing protected no-cost backup storage and restore permissions. Six-hour history is not independent disaster recovery. Option B also needs static-host Free/build/HTTPS/account checks.
7. Planning accepts best-effort anonymous availability and public-write risk, or explicitly decides safeguards/fallback. No silent authentication/local-only write substitution.
8. Obtain separate B.2 provisioning/publication/hosted-test authorization. Never request billing credentials.

Complete-stack strict $0 is still unestablished: current Render terms/access, actual card/upgrade/hard-cap behavior, outbound headroom and protected backup eligibility are the exact open gates. Local engineering remains independently reviewable.
