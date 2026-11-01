# Phase A.2 storage and quota report

## Representation and integrity

Schema v2 adds `snapshot_manifests` and `snapshot_chunks` referencing the unchanged `diagnoses` identity table. A manifest records stable diagnosis ID, `json-ascii-v1` format/schema version, full byte length, chunk count, SHA-256, UTC creation time and storage charge/budget metadata. New diagnosis rows contain a small format marker; old inline JSON remains readable.

`backend/snapshots.py` serializes deterministic sorted compact JSON, preserving complete evidence/IDs/numeric values. ASCII escapes make every TEXT byte boundary safe: each chunk is at most **262,144 stored bytes**, without base64 or unverified BLOB/JsProxy conversions. An escape sequence may span chunks; only the complete reconstructed string is decoded. Compared with UTF-8, Unicode escaping can expand storage; actual canonical stored bytes are charged, not original request size.

The diagnosis marker, manifest and all chunks are inserted in **one documented D1 transactional batch**. There is no BEGIN spanning HTTP calls. The manifest's AFTER INSERT budget trigger participates in that transaction. A failed chunk, quota reservation or constraint aborts the whole batch, including byte charging. No incomplete new snapshot is exposed by the adapter.

Primary keys and BEFORE INSERT conflict checks serialize concurrent attempts. Identical manifest/chunk retries are no-ops and do not debit storage twice. Conflicting content under an ID returns 409. Racing legacy inline records are protected by a manifest-parent guard; existing valid evidence is never silently replaced. UPDATE and direct partial DELETE triggers protect manifests/chunks; out-of-range/conflicting chunk INSERTs are forbidden. Only removing a whole **unreferenced** diagnosis can cascade, allowing separately authorized cleanup without partial evidence deletion. Public APIs expose no deletion/reset.

Every chunked read verifies format/version, identity, contiguous order, count, exact length and SHA-256 before returning JSON. Missing/corrupt evidence returns sanitized 503 requiring operator recovery. Legacy malformed/missing format records also fail safely. SHA-256 detects corruption; it is not authentication against an administrator who rewrites the database and guards.

## Size and query bounds

The accepted API retains the existing **2 MiB request / 2,000 sample** range. The known dense valid diagnostic (formerly 2,346,790 bytes with noncompact serialization) now stores **2,216,579 canonical bytes in 9 chunks** and round-trips completely. No timeline truncation or input reduction. Unicode multichunk and maximum sample/body payloads are regression targets. There is no new single-row 2 MB rejection.

Reconstruction fetches **16 chunks per query**, at most 4 MiB of stored text per page, below 8.5 MiB with JSON transport escaping. It never returns many complete snapshots in one query. This accounts for D1's announced 50 MB query-result ceiling starting November 4, 2026. Per-statement parameters are far below 100. Current D1 documentation counts a transactional batch as one per-invocation call, not one per contained SQL statement. The measured dense save/load/retry take 2/2/3 binding calls, below Free's 50-call limit; actual Wasm execution/accounting is unverified.

## Atomic budget policy

The old 2 MiB/day allowance could not admit the valid dense result. Defaults now permit **64 MiB/day** of charged new snapshot storage. Charge = actual canonical payload bytes + 16 KiB per chunk + 16 KiB manifest allowance, covering logical metadata/index/page overhead conservatively in measured fixtures. It is not a physical-space meter or a guarantee about Cloudflare's storage accounting. The dense result is charged **2,380,419 bytes**; roughly 28 such results fit an otherwise unused day's allowance. A failed write charges zero; retries of identical persisted data charge zero; simultaneous distinct writers cannot overspend. Reservation resets by UTC date. No refund on deletion avoids reuse of the daily allowance through churn.

The request and HTTP write caps remain 2,000/day and 250/day; failed requests may consume those separate reservations conservatively. No paid capacity is enabled. The 64 MiB ceiling is a containment maximum, not expected usage or a promise of anonymous availability. Sustaining that ceiling for 30 days exceeds a Free 500 MB database: total capacity, retention and availability remain **deployment blockers**, even though individual valid requests now fit. An attacker can consume everyone's quota; hard provider exhaustion must fail closed.

A modest 20-visitor/day example with 2 typical diagnoses each is approximately 0.4 MB actual evidence/day plus tickets/history. Logical charging is higher (~1–2 MB/day depending on chunk/manifest overhead). Thirty days of this modest traffic fits the documented capacity comfortably, but continuous unresolved histories and abusive traffic require operator monitoring and an approved retention policy. No production deletion or scheduled cleanup was run.

## Measured retained data (genuine local D1, not hosted billing)

Command: `.venv/bin/python -m cloudflare.a2_measure`; raw artifact `PHASE_A2_MEASUREMENTS.json`. Single observations at each fixture size; no invented percentiles or hosted CPU figures. Wall time includes CPython HTTP-client/loopback transport overhead. SQL duration has millisecond granularity.

| Operation | 100 tickets | 1,000 tickets | 7,500 tickets |
|---|---:|---:|---:|
| Equipment counts: rows read | 4 | 4 | 4 |
| Global/filtered first page: rows read | 101 | 200 | 200 |
| Global continuation: rows read | 4 | 411 | 468 |

Counts now come from transactional `equipment_ticket_counts`, initialized from legacy records and maintained with ticket create/delete triggers. Composite indexes support global and filtered order. Continuation merges two separately bounded indexed ranges; it avoids a retained-table scan for the mixed descending-time/ascending-ID cursor. Metadata counts scanned/internal rows, not just returned rows. Tests traverse timestamp ties without gaps/duplicates on both adapters.

A ticket with **2,501 history events** reads 203 rows for initial detail and at most 201 for each continuation. History and lists cap returned rows at 200 with explicit continuation; the UI offers load-more controls and preserves unsaved notes. No history is purged. SQLite's maintenance API provides equivalent pages.

The measured local database was ~4.75 MB after 7,500 synthetic tickets and ~10.1 MB after 2,500 long notes; the dense snapshot increased local size by ~2.23 MB. These are emulator `size_after` values including schema/index allocation, not physical-host quota certification. Dense save wrote 24 rows including indexes/metadata/budget, reconstructed with 10 reads, and retry wrote zero. SQL plans confirm the covering list/history indexes. The real local engine is used; the CPython SQL transport does not prove Python Worker binding conversion.

## Migration, backup and recovery

`cloudflare.local_schema` transactionally applies missing numbered migrations and refuses unknown versions. Fresh schema creation, repeat initialization and real v1→v2 conversion are tested, preserving legacy evidence and seeded records. Native SQLite schema/data remain unchanged.

The local fixture exporter uses bounded response pages (including small pages for legacy inline JSON). It supports v1 and v2 fixture restore and verifies manifest/chunk integrity **before destination deletion**. Restore disables/recreates only the quota trigger inside the same atomic fixture transaction so historical bytes are not charged again; failure rolls back the trigger and all records. Derived equipment counts rebuild from ticket triggers. Export/restore requires quiesced disposable state; small fixture bounds and a maximum 100-statement restore are explicit. Larger production exports need a separately reviewed staged operator tool, not this test helper.

Actual local emulator termination/restart preserves large chunked Unicode evidence, linked ticket/history/notes/version, quota counter and repeated seed initialization. `PHASE_A2_RECOVERY.json` records this and legacy migration. This is not hosted redeployment or Time Travel proof.

Before production retention: enter read-only, stop writers, take a complete verified backup in approved protected storage; dry-run candidate resolved non-seed tickets and unreferenced evidence; preserve Open/In Progress and seed data; inspect FK/history/count consistency; execute separately authorized whole-diagnosis cleanup, validate and retain rollback backup. No public reset route or production apply command is introduced.
