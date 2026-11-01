# Phase A.1 resource evidence

No full-request Python Worker measurements are available: the dependency-free prerequisite fails before app initialization. Consequently **Worker CPU, memory, startup execution, first request, D1 binding timing, serialization/validation cost and resource-limit errors are UNVERIFIED**. There are no successful real Worker requests, so no median/p95/max values or samples can legitimately be reported. Failed resolver retries are not Worker cold starts.

The installed runtime selection is Python 3.14/Pyodide, while native tests use CPython 3.12.14. Those are separate execution environments. New native regression wall times in raw logs are test-run timing, not request CPU. No native benchmark was repeated to substitute for blocked runtime proof.

Historical Phase A measurements remain in `PHASE_A_MEASUREMENTS.json`: 15 repetitions per payload; 2,000-sample workloads around 51–80 ms native compute; dense valid request 1,790,569 bytes → 2,346,790-byte complete snapshot; max body 2,097,152 bytes. These are **native CPython/local D1 only**, not new A.1 results. They justify caution, not a claim that Cloudflare's billed 10 ms CPU or 128 MB memory limit is satisfied or conclusively violated. Published limits and dates remain in `FREE_TIER_FEASIBILITY.md`; no new account verification was performed.

## Measurement protocol after access is restored

First prove the minimal probe, then actual FastAPI validation and real D1 operations. Use at least 15 independent requests per representative case; separate first request from warmed requests. Cover health/equipment; normal and all four failures; deterministic Random Failure replay; multi-anomaly; Guided Demo diagnosis/create/retry; lists/detail/update; concurrent expected-version edits; typical, max-sample, max-body and dense valid inputs. Retain response statuses, raw runtime traces, measured environment/version, body/result bytes, D1 metadata and failure details. Record median/high percentile/worst only for metrics actually exposed.

Capture end-to-end latency separately from authoritative Worker CPU. Measure the entire request, including validation, analysis, JSON conversion, quotas and D1 interaction; do not infer CPU from SQL time or one function's native timing. Observe peak memory/concurrent large uploads and real resource-limit errors. If local tools expose no authoritative billed accounting, retain UNVERIFIED and specify a separately authorized, Free-only hosted metrics experiment for Planning; no automatic hosted test is allowed.

## Deferred capacity decisions

No new quota/index/retention decision is justified by runtime evidence. Existing 2 MiB/day snapshot budget is smaller than the known valid 2.35 MB result; chunking alone will not fix it. Preserve this as an explicit open defect. A later policy must permit at least one approved maximum result and bound concurrency/storage growth without changing PRD.

A potential 256 KiB chunk design would need roughly 9 chunks for the known 2.35 MB snapshot, plus manifest, index and quota writes; actual maximum serialization size and metadata must be measured before selecting defaults. This is a forecast, not implemented or measured D1 row accounting. Existing default shared limits are unchanged. Retained-data scans, long-lived unresolved histories and orphan cleanup still need genuine D1 metadata across increasing fixture sizes, safe backup and separately authorized retention. No actual records were removed or migrated.
