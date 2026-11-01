# B.1 anonymous-demo security review

Reuses [B.0 controls](PHASE_B0_SECURITY.md): distributed atomic request/write/snapshot budgets, parameterized SQL, complete evidence validation, pre-JSON 2 MiB streamed body bound, immutable checksums, guided IDs, optimistic versions, seed protection, 200-record pages, pool/timeouts, sanitized errors, read-only switch and storage high-water guard. No destructive public endpoint. Shared records remain public/synthetic; no login, private identity, CAPTCHA, paid protection or new data model.

B.1 disables hosted generated docs, validates exact HTTPS origins, blocks static dotfiles, returns missing hashed assets as 404 and avoids stale HTML caching. Static nosniff/referrer headers and immutable hash caching are low-risk controls. Dedicated SQL grants are tested through complete ticket/evidence/status/note/history flows and deny DELETE/CREATE/ALTER. Owner credentials stay outside API runtime. Rehearsal uses actual restricted SCRAM credentials, wrong-password safe 503 and checks random credentials never appear in API logs. Frontend contains only public `/api`/timeout settings. No untested CSP restricting WebGL is added.

## Availability gate

An anonymous visitor can consume global budgets, repeatedly read large evidence, vandalize public notes or wake the database. CORS is not authentication. Readiness bypasses daily request charging; do not poll it continuously. Liveness does not query the DB. Rejected traffic can still consume provider CPU/transfer; size and concurrency bounds do not stop slow connections or guarantee availability. No arbitrary forwarded-IP header is trusted.

Included provider IP/firewall/throttling could help, but its Free availability and trusted-proxy semantics remain unverified. Manual usage checks, emergency read-only, caching and hard provider suspension limit exposure; read-only still allows read transfer/compute, so suspend API if necessary. No paid monitoring/keep-alive activated.

**Before public exposure:** verify hard no-charge limits and obtain Planning acceptance of bounded best-effort availability and shared-write risk. If fully anonymous permanent shared writes cannot be defensibly supported under actual Free policies, return an **architecture decision**, not a silent requirement reduction. No fundamental local runtime incompatibility has been demonstrated. This is not production security certification; provider proxy/timeouts and current dependency advisories still require hosted-environment review. No resources, billing, real-data migration or deployment occurred.
