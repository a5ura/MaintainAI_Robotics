## Problem and behavior

Builds on merged Phase A.1 PR #6 (`966c809`). A valid dense diagnosis previously exceeded D1's 2 MB row limit and its default daily storage budget. This PR stores complete immutable evidence in versioned SHA-256 manifests and 256 KiB chunks, atomically with byte-budget charging. Retries charge once; failed chunks roll back all evidence and allowance; corrupt data fails safely. Existing diagnosis IDs/JSON, ticket links, legacy inline evidence and native SQLite remain supported.

It also replaces retained-ticket count scans with transactional counts, adds covering indexes and bounded cursor/history pages, and provides UI continuation without erasing unsaved repair notes. Fixture-only migration/export/restore/restart tools preserve complete evidence. No silent retention or production migration.

## Evidence

- Native/shared backend and adapter suite: 163 passed; frontend: 41 passed; TypeScript/build pass.
- Real local D1 measurements at 100/1,000/7,500 tickets: equipment reads stay at 4; first pages 200; continuation 468 at 7,500; history pages at most 201.
- Dense valid evidence: 2,216,579 canonical bytes / 9 chunks, complete reconstruction; 24 rows written; identical retry zero writes.
- Atomic quota/rollback, concurrent retries/conflicts, corruption, legacy migration, backup/restore and actual emulator restart verified.
- Actual Chromium results and exact commands recorded in the A.2 completion report and raw evidence, including a new real API/history pagination test.

## Boundaries and hosting decision

**APPROVE FOR INDEPENDENT REVIEW**, not deployment approval. The single authorized Pyodide access check still returns CONNECT 403. Actual Python Workers/JS interop, billed CPU/memory, pre-ASGI upload protection, account-specific $0 eligibility and hosted durability remain unverified. The 64 MiB/day application storage allowance is not a total-capacity/retention or availability guarantee.

Current official-source ranking compares Python Workers+D1, native Python+durable Postgres, and a separately approved TS backend alternative. Render Free/billing evidence remains blocked; no full stack is account-verified free. No new diagnostic engine, public deployment, hosted resource, billing activation, real-record migration, environment publication or automatic merge. PRD/Project 1/V2 unchanged.
