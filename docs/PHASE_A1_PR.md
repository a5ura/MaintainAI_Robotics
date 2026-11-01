## Runtime-first Phase A.1 investigation

Builds on merged Phase A PR #5 (`e940a83`). Adds an isolated dependency-free official-pattern Worker probe, raw online/offline failure evidence, baseline regression logs, and the four required Phase A.1 reports. Production app, PRD and dependencies are unchanged.

The minimal probe fails before initialization at the required official Pyodide index: proxy CONNECT 403, confirmed absent destination in current enforced policy. Supported offline CLI resolution also lacks the required SDK cache. This isolates an external access blocker from FastAPI/Pydantic incompatibility; no actual Worker success or billed CPU/memory result is claimed.

**CONDITIONAL GO — ADDITIONAL PROOF REQUIRED.** Per the assignment's blocked-index gate, chunking, upload interception and retained-data changes are deferred. Existing >2 MB snapshot and daily-budget mismatch, pre-ASGI body buffering and anonymous read-cost risks remain open. Next step: approved official-index access or a complete verified official cache, then minimal→FastAPI→actual API/D1 and resource experiments.

Native/backend/frontend/build, local D1 integrity/recovery and actual Chromium results are recorded in the completion report and machine-readable evidence. No hosted resources, billing, account activation, deployment, production migration, environment publication or automatic merge.
