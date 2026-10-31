# MaintainAI Robotics — Milestone 3 Completion Report

## 1. Verified environment and repository

- Repository: https://github.com/a5ura/MaintainAI_Robotics
- Verified base/main: `76e00f2c6396f7a5614baeb1434449b88e543ca0` (merged M2 PR #3; PR #1/#2 in ancestry).
- Branch: `feature/m3-experience-release`. Initial working tree clean; existing work preserved; no worktree/rebuild of architecture, PRD or Project 1 change.
- Execution: existing managed **cloud Linux x86_64**, `/workspace/MaintainAI_Robotics`, Python 3.12.14, Node 24.19.0, Git 2.52.0 (npm 11.9.0). Desktop/Windows and physical laptop performance are not established.
- Source commits: `5e094bd` backend safety/idempotent tickets; `164df80` guide/engineering experience; final readability/docs/review commits follow in branch log.
- PR: final branch push/API attempt pending in this report draft; no PR URL claimed. No automatic merge or environment publication.

## 2. Live Guided Demo and controls

Interactive mode remains default. Start Guided Demo runs the existing dropped-object trajectory: actual synthetic loss at t=6, actual FastAPI diagnosis at t=12, returned observations/checks, then one real labelled Open maintenance ticket and automatic detail/snapshot view. Each evidence/check stage lasts four seconds; default progression is roughly 20 seconds, verified in a ~22-second browser flow including a short pause.

Pause/Resume freeze/continue the simulation and tour; Reset demo starts a new run; Reset returns to interactive state; Skip to Results skips replay and calls the real backend; Take Manual Control retains current pose/results and cancels further automatic progression. Stale diagnosis/tour effects are invalidated on reset. Already submitted server writes may finish after cancellation; immutable persisted records remain discoverable. Optional UUID request IDs make same-request and concurrent guided ticket retries idempotent (different content with reused key returns 409).

## 3. Advanced engineering correctness

Off by default, with individually optional joint readings, world/joint/TCP coordinate frames, executed-only TCP trajectory and row-major 4×4 transforms. All derive from existing joint states, link lengths, tool offset and FK; no physics/IK/planner introduced. Five frame matrices are checked against independent Three.js matrix construction over the cycle, with determinant/translation checks and existing actual render-hierarchy FK regressions.

Real mesh picking selects base/shoulder/elbow/tool context; keyboard component buttons offer equivalent access. Information links to current diagnostic readings without asserting a component fault. Chromium verified real base picking, keyboard tool selection, evidence-row focus and displayed TCP matrix values.

## 4. UX, accessibility and measured performance

Clear Operations/Diagnostics/Maintenance entry points, live guide narrative, simulated-input/computed-result labels, optional deeper engineering information, skip-to-main link, focus outlines, keyboard controls, responsive panels and chunk/backend recovery states. Hypotheses and recommended actions remain distinct from observations. Diagnostics no longer use a fixed inner scroll trap that can hide causes beside expanded engineering data.

Build measurements: entry **215.23 kB / 68.92 kB gzip**, 3D chunk **843.84 / 226.69**, maintenance **7.72 / 2.65**, CSS **16.25 / 4.66**. M2's single JS bundle was 1055.67 / 293.96. Combined M3 JS remains about 1066.79 / 298.26, so this is earlier control/UI parsing and separated views, not a total bandwidth reduction. The Three.js chunk warning remains.

Workcell renders on demand; simulation updates ~30 Hz. No continuous idle render loop, shadows, physics or new GPU dependency. [Raw navigation/resource timing](M3_PERFORMANCE.json) is a **single cached localhost reload in cloud Chromium with software WebGL**, not a public cold-load benchmark or Windows FPS guarantee. Keyboard/small-screen checks are not a full WCAG/screen-reader audit.

## 5. Fresh regression/browser results

| Command/check | Actual result |
|---|---|
| Pre-change baseline: pytest, frontend, build | 91 backend / 26 frontend passed; TypeScript/production build passed |
| `.venv/bin/python -m pytest backend/tests -q` | **97 passed**, one existing upstream AnyIO/Starlette deprecation warning |
| `npm --prefix frontend test` | **36 passed**, 8 files |
| `npm --prefix frontend run build` | **Passed** TypeScript and production build; 3D chunk-size warning remains |
| `CHROMIUM_PATH=/usr/bin/chromium npm --prefix frontend run smoke` | **13 passed (2.3 min)** on the final rebuilt frontend after the readability adjustment and backend restart |
| Real FastAPI stop/start with same SQLite file | **Passed**: guided ticket, note, version, history and immutable snapshot identical |
| Temporary DB safeguards | Passed: request-key retry/concurrency, write budget/reset/spoofed headers, backup, dry-run/apply pruning with preserved seed, wildcard-CORS refusal |

The first focused browser attempt found an ambiguous checkbox test selector matching both region and input; switching to a role-specific checkbox locator resolved it. Initial type checking also caught a misplaced optional Maintenance prop declaration, corrected before browser validation. No disabled/skipped tests or known unexplained failures. Local smoke runs create synthetic review tickets in ignored development storage; automated backend tests use temporary databases only.

Browser coverage includes all M1/M2 flows, full guided simulation/backend/ticket integration, Pause/Resume/Reset/Skip/manual takeover, stale-state cancellation, retry deduplication, engineering values/picking, guided-vs-manual independent contexts, API/chunk outage recovery, desktop/mobile width and keyboard focus.

## 6. Hosting comparison and official sources

[HOSTING_DECISION.md](HOSTING_DECISION.md) compares:

- **A:** Workers Static Assets + Python Workers FastAPI + D1 — official support/Free quotas verified in provider-owned source documentation; still conditional on account/card/no-billing, 10 ms CPU/128 MB runtime and managed-store adapter proof.
- **B:** Pages React + native Render FastAPI + Neon Free PostgreSQL — full conceptual layout; current Render free/billing/compatibility pages inaccessible here (HTTP 403), so $0 viability unverified. Neon Free quotas/fail-closed behavior were read in official docs, not assumed from old tier values.

Fewer than two fully verified viable architectures are established: **zero deploy-verified $0 solutions**, one evidence-backed conditional backend candidate. Current Hugging Face official docs require a paid plan for new Docker/Gradio compute Spaces despite CPU Basic's $0/hour listing; reject that route. Static-only hosting cannot supply FastAPI plus shared durable writes.

Key official references: [Cloudflare FastAPI](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/languages/python/packages/fastapi.mdx), [Workers Free limits](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/limits.mdx), [D1 Free consequences](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/d1/faq-pricing.mdx), [Neon current plans](https://github.com/neondatabase/website/blob/main/content/docs/introduction/plans.md), [Hugging Face compute requirement](https://github.com/huggingface/hub-docs/blob/main/docs/hub/spaces-overview.md). Full source/access/quota/card/sleep/expiration details are in HOSTING_DECISION.

## 7. Cost exposure and account unknowns

No new packages, paid services, billing methods, credits, provider resources, migrations or deployment activated. Existing development account entitlement/actual incremental charges are not visible; **$0 account cost cannot be certified**. Free-plan published quotas do not prove this user's actual plan or access. Provider credential names were checked for presence only; no configured deployment bindings were observed and no values were exposed. No paid fallback or trial is selected.

## 8. Durability and public no-login security

The local guided ticket `T-189937a33c5d56fb89d3247920ed5670` survived actual FastAPI restart at version 2 with its note/history and diagnosis `D-973774d225afd7785d537ddd`. This proves local SQLite persistence only. Shared public cross-device storage, real redeployment survival, managed-store recovery and host inactivity behavior remain **unverified**.

Existing input/SQL/version/snapshot protections remain. Opt-in `MAINTAINAI_PUBLIC_DEMO=1` adds per-process write limits (20/peer/minute, 120/global/minute; 429/Retry-After), not distributed enforcement or a daily quota guarantee. CORS is explicit and is not authentication. Offline consistent backup and dry-run retention preserve active/seed records and require a fresh backup before explicit apply. Tests used temporary data; production records were never pruned/migrated. Public bot abuse, vandalism and free-quota exhaustion remain deployment risks requiring platform budgets/retention/restore/kill-switch validation. No secrets belong in frontend or VITE_* settings.

## 9. Deployment status and exact gate

**Local M3 experience: functional and verified. Public deployment: NOT DEPLOYED / BLOCKED.** No public demo URL exists. This is not a claim that all V1 release requirements are complete.

Before proceeding: review architecture A, verify an existing Free-only no-billing/no-card-risk account and scoped deployment access; implement/test the D1 repository/ASGI runtime within Free limits (or re-evaluate B after official network access); configure distributed anonymous-write safeguards; explicitly authorize publication/record migration after backup; then verify independent public sessions and record survival across actual restart/redeployment. No automatic upgrade if any quota/runtime limit fails. RELEASE_CHECKLIST records the remaining work.

## 10. Review evidence and known limitations

- [Guided failure](m3-guided-failure.png)
- [Guided ticket desktop](m3-guided-ticket-desktop.png) / [mobile](m3-guided-ticket-mobile.png)
- [Engineering desktop](m3-engineering-desktop.png) / [mobile](m3-engineering-mobile.png)
- [M3 scope](MILESTONE_3.md), [architecture](ARCHITECTURE.md), [run instructions](../README.md), [hosting decision](HOSTING_DECISION.md), [release checklist](RELEASE_CHECKLIST.md)

No unexplained application defect remains in tested local flows. Limitations: simplified simulated robot/sensors, existing large 3D chunk, no physical safety or calibrated confidence, no formal accessibility/Windows benchmark, single-process local limiter, pending hosted adapter/runtime/access/durability. No deployment/PR URL is claimed without verification.

## 11. Acceptance

| Requirement | Result |
|---|---|
| Verified merged M2 baseline; PRD/Project 1 preserved | PASS |
| Real Guided Demo and diagnosis-to-ticket flow | PASS |
| Pause/Resume/Reset/Skip/manual controls; interactive default | PASS |
| Model-derived overlays, transforms, executed path and component evidence | PASS |
| Existing FK/diagnostics/maintenance regression | PASS |
| Keyboard focus/navigation, readable desktop/mobile and error recovery | PASS for exercised checks; full audit UNVERIFIED |
| Measured bundle sizes; modest-hardware performance | PASS measurements/on-demand design; Windows FPS UNVERIFIED |
| Backend/frontend/build and genuine browser regression | PASS — final refreshed 13-test run passed |
| Anonymous-data safeguards and retention/recovery assessment | PASS local implementation/assessment; distributed public hardening UNVERIFIED |
| Official-source provider comparison and risks | PASS research with explicit inaccessible/conditional items |
| Actual cost and hosting-account Free-only guarantee | UNVERIFIED; no billable resources activated |
| Hosted shared durability/public URL/redeployment smoke | UNVERIFIED — not deployed, blocked at gate |
| Reviewable PR | UNVERIFIED pending push/API attempt; no auto-merge |

## 12. Recommendation

Ready for Planning review of the **local M3 release candidate** with final refreshed browser results recorded; Git review handoff remains subject to API access. Keep public V1 release blocked until hosting/access/runtime/security/durability items are verified. Do not merge or publish automatically, change the PRD, or start V2.
