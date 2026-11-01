# Implemented architecture

## Current Phase B.0 checkpoint — November 1, 2026 UTC

Main includes merged A.2 PR #7 at `8b8491035cfcf388378376dd8b9b2e649dcfed94`. Branch `feature/v1-hosting-phase-b0` adds a native async Psycopg/PostgreSQL adapter and explicit FastAPI hosting entry point while preserving SQLite, D1, diagnostic algorithms and the approved PRD. Real local PostgreSQL integration, independent API/process/database restart, immutable full evidence, concurrency, idempotency and protected backup/recovery are tested in managed Linux. Desktop/Windows and hosted durability remain unverified. See [B.0 setup](DEPLOYMENT_PHASE_B0.md), [adapter](POSTGRESQL_ADAPTER.md), [hosting gates](PHASE_B0_HOSTING_DECISION.md) and [completion report](PHASE_B0_COMPLETION_REPORT.md).

Render Free + Neon Free + free static hosting is provisional: Render current terms and all account-level Free/card/automatic-billing eligibility remain unverified. No public deployment, provisioning, billing activation, real-record migration, environment publication or merge is authorized/performed. No new Cloudflare/Pyodide access route was attempted. Anonymous quotas and a storage high-water guard do not guarantee permanent availability; release still requires provider/account, abuse, backup and hosted verification. Earlier checkpoint text below is historical.

## Historical Phase A.2 checkpoint — November 1, 2026 UTC

Phase A.1 PR #6 is verified merged at `966c809`. Phase A.2 explicitly authorizes local storage hardening despite the unchanged index CONNECT 403, superseding A.1's deferred-expansion gate for this assignment. New D1 schema v2 provides atomic immutable manifest/chunks, verified reconstruction and quota charging; the large-evidence row-size defect is resolved locally. Default snapshot allowance is now 64 MiB/day including conservative logical overhead. Cached counts, indexed 200-record ticket/history pages and UI continuation preserve drafts and the native SQLite workflow. Legacy inline evidence and synthetic migration/backup/restart remain supported.

Actual Python Workers/JS binding execution, billed CPU/memory, pre-ASGI streamed body enforcement, account Free-only terms and hosted durability remain unverified. The total 500 MB Free storage/retention and anonymous availability gates are not solved by a daily budget. No deployment, resource provisioning, billing, real-record migration, environment publication or merge. Current evidence: [A.2 report](PHASE_A2_COMPLETION_REPORT.md) and [details](DEPLOYMENT_PHASE_A2.md). Earlier checkpoint statements below are historical, including the previous single-row restriction and 2 MiB/day default.


React/TypeScript + Tailwind/Vite → React Three Fiber/Three.js visualization; Vite proxies `/api` → Python FastAPI/Pydantic → pure deterministic correlation rules → JSON → diagnostic UI. M2 adds local SQLite maintenance records, with no shared mutable run state. Browser clocks and run generations isolate visitors and prevent stale responses after Reset.

## Robot and cycle

Reduced 3-revolute-joint demonstrator, not a vendor robot: base yaw about world Y, shoulder and elbow about local Z. Right-handed Y-up world, metres/radians/seconds. Base height 0.6 m; links 1.5 and 1.2 m; local tool offset (0, -0.32, 0) m. Joint limits: yaw ±1, shoulder ±1.4, elbow ±2 radians.

Let a=shoulder, b=elbow, c=yaw. TCP radial reach is `1.5 cos(a) + 1.2 cos(a+b) + 0.32 sin(a+b)`. Height is `0.6 + 1.5 sin(a) + 1.2 sin(a+b) - 0.32 cos(a+b)`. World position is `(r cos(c), height, -r sin(c))`. Full visual transforms use nested Three groups; their tool world position is tested against the analytic TCP. Tool orientation follows `Ry(c) Rz(a+b)`; no orientation controller or IK.

`src/model.ts` defines fixed knots over a 12-second cycle, interpolated with quintic smoothstep (zero velocity and acceleration at knots). Finite-difference tests enforce 1.6 rad/s speed and 5 rad/s² acceleration limits for this trajectory. Start advances a bounded simulation clock, Pause freezes it, Reset clears the run/results. Background timer delays are capped; elapsed cycle time can lag wall time. State at any cycle time is deterministic.

The object is attached to the TCP from pick until release, or detached at t=6 in the fault scenario and lowered to the floor with a simple bounded visual fall. This is not physics. Source/target platforms match the placement height. No collision solver, joint torque, or real control loop.

## Evidence contract

`GET /api/health` → `{status:"ok"}`.

`POST /api/diagnose` accepts `{samples:[...]}` (1–2000 rows). Each row contains `t` (nonnegative finite cycle seconds), `phase` (pre-pick/post-pick/transport/pre-place/post-place), `joints` (3 radians), `tcp` (3 metres), `grip_command` (boolean), nullable `object_present`, nullable `pressure_kpa` (vacuum magnitude 0–100), nullable `verification` (source/held/missing/target).

No scenario name is accepted or required. Input arrays are sorted by time and evidence IDs assigned in that order. Duplicated timestamps, out-of-order phases, missing sensor values, and selected contradictory observations produce an inconclusive result. Malformed payloads produce HTTP 422. Joint/TCP vectors must be finite. Malformed/nonfinite values return HTTP 422 with safe validation details (no nonfinite input echoed into JSON). Structurally valid but physically inconsistent telemetry returns HTTP 200 with `status: inconclusive`, `failure: null`, per-evidence warnings, and no ranked hypotheses from corrupted kinematics.

The backend independently reproduces the approved 3R model in `backend/kinematics.py` and enforces inclusive joint limits (yaw ±1, shoulder ±1.4, elbow ±2 radians). Euclidean TCP position error must be ≤0.0001 m (0.1 mm), with at most 1e-12 m absolute boundary roundoff. This accommodates floating-point/serialization rounding in exact simulated trajectories, not real sensor uncertainty. Each timeline entry includes `kinematics: {valid, expected_tcp, error_m, tolerance_m, violations}`. Out-of-limit vectors are rejected as inconsistent before FK evaluation; for unrepresentably large distance error, `error_m` is null and validity remains false.

Frontend/backend golden-pose regression fixtures live in `fixtures/kinematics.json`; both implementations are tested against the same simple geometries. Browser regression tests additionally send actual frontend cycle trajectories to backend validation.

Detection requires verified held post-pick → later absence during commanded grip before place → later missing post-place verification, without input-quality warnings. Vacuum <30 kPa within 1 s of loss supports seal/supply loss. Premature release and sensor error remain competing hypotheses with explicit supporting/contradicting evidence. Cause order uses count of supporting evidence, then fewer contradictions; it is a transparent demonstration heuristic, not probability or proof.

Response: `status` (normal/detected/inconclusive), nullable `failure`, `summary`, `observations` with evidence IDs, `hypotheses` with `cause/support/contradiction/check`, normalized `timeline`, `warnings`, `ranking_basis`.

## Simulated versus computed

Simulated: grip command, object sensor, pressure, verification observations, cycle phases, bounded visual fall. Computed: joint interpolation, FK, nested visual transforms, temporal correlation, anomaly status, cause ranking. The frontend reconstructs checkpoint telemetry from the completed deterministic run, not from a hardware recorder. Rule tests use independent fixtures; browser tests verify live backend integration.

## Operational boundaries

Loopback-only dev servers; no authentication or production hardening. Local maintenance records are persisted by M2; there are no real sensors, safety guarantees, calibrated confidence, hosted URL, or verified cloud storage. Those V1/V2 distinctions are preserved in PRD. Stop both dev processes when not needed. Rendering is capped at 1.5 device pixel ratio with low-poly geometry, no shadows, and no physics/GPU requirement beyond browser WebGL.

## Evidence traceability — stabilization

Observation, supporting, and contradictory evidence references are labelled links to focusable timeline rows (`#evidence-E…`). Links expose phase, grip command, object presence, pressure, verification, and timestamp in accessible descriptions/tooltips. Targeted rows highlight and retain keyboard focus; the timeline includes FK consistency. No supporting readings and contradictory evidence are explicitly labelled; links missing from a response are marked unavailable rather than fabricated. Hypotheses and operator checks remain distinct from observations.

## M2 shared evidence and rules

`backend/models.py` retains the M1 sample contract and adds optional structured fields:

- `vision`: acquisition time (cycle seconds), status (`ok`, `timeout`, `no_detection`), nullable confidence 0–1, nullable detected-object reading.
- `placement`: intended target, commanded target, independently observed pose (metres), object presence, source (`camera` or `independent_sensor`), calibration age (days). Present objects require observed poses; absent objects cannot have one. All vectors are finite.
- `controller`: state (`running`, `protective_stop`, `stopped`), expected motion, nullable safety-gate and drive-warning signals.
- `events`: at most 16 timestamped controller/camera/calibration/safety events per sample; enum codes and messages up to 300 characters. Events must be within 1 second of the containing sample. A sample and its events share a stable evidence ID; UI displays source, code, timestamp and message.

Verification values additionally support `offset` and `unreliable`. Legacy M1 payloads remain accepted. Requests are bounded to 2 MiB before JSON parsing and at most 2,000 samples. Nonfinite/malformed values remain 422; inconsistent FK or conflicting evidence remains inconclusive. The backend never reads a selected scenario name to diagnose.

`backend/diagnostics.py` preserves M1 pickup/loss/post-place correlation and uses the scenario-independent rule registry in `rules.py`:

| Computed anomaly | Rule | Competing explanations |
|---|---|---|
| Dropped object | Verified held → loss during commanded grip → missing post-place; failed vision alone cannot prove absence | Vacuum/seal loss, premature release, sensor error |
| Positioning error | Reliable independently observed object >0.020 m Euclidean distance from intended target (1e-12 m boundary roundoff) | Frame/calibration mismatch, wrong commanded target, observation error |
| Vision failure | Timeout/no detection, absent confidence, confidence <0.5, or image age >1.0 s | Acquisition/communication, lighting/occlusion, physical absence contradicted by independent presence |
| Unexpected stop | Prior running state → stopped/protective-stop during expected motion with an interruption event; subsequent joints must remain stationary within 1e-6 rad | Safety circuit, drive/controller, program interruption |

Calibration age >30 days or a correlated frame-offset event supports the frame hypothesis, without proving causation. Missing signals do not supply evidence. Future image timestamps, uncorrelated events, reliable target/absence conflicts, safety-gate contradictions, or motion after a claimed stop prevent confident conclusions. Ordinal ranking uses unique supporting references, then fewer contradictions; no probabilities. Independent simultaneous anomalies are returned together (tested with positioning+vision and independently verified drop+vision). Conflicting inputs conservatively suppress all detected anomalies and cause rankings.

Response preserves `failure`, `summary`, `observations`, `hypotheses`, `timeline`, `warnings`, `ranking_basis` and adds `anomalies[]` plus stable content-derived `id`. A diagnosis snapshot is stored before returning the result; rules remain pure and independently testable. Cause records identify their related anomaly. A diagnosis's timestamped evidence and checks remain immutable when linked to tickets.

## M2 simulation integrity

`frontend/src/scenarios.ts` generates structured evidence from the existing trajectory and FK. The normal trajectory, joint limits, speed/acceleration bounds and tool geometry are unchanged.

- Dropped object retains the M1 visual loss at 6 seconds.
- Positioning keeps commanded joints/TCP coherent; independent placement observation and the released object show +0.45 m X discrepancy, with a calibration event. This is simulated frame/observation discrepancy, not corrupted analytic FK or physical simulation.
- Vision leaves the placed object present while post-place camera acquisition times out (4-second-old frame, no reliable confidence). The independent fixture sensor contradicts physical absence. UI marks camera verification unavailable.
- Unexpected stop clamps time and arm joints at 6 seconds; the object remains held. Later checkpoints are explicitly not reached. Start cannot resume a protective stop; Reset begins a fresh run. No bypass-safety guidance.
- Random uses a documented single Mulberry32 draw from a uint32 seed to choose one of four faults. The explicit seed and resolved scenario appear in active run context and are copied into diagnosis-linked ticket descriptions. The generated payload contains no scenario/answer label. Replaying the same seed produces identical evidence and diagnostic ID.

Each browser owns the clock, scenario, seed and request generation. Navigation to Maintenance preserves that browser's simulation. No active-cycle global exists on the backend. Tests include two independent browser contexts and reset/scenario isolation.

## M2 persistence and API

Standard-library SQLite adapter: `backend/repository.py`; HTTP/schema boundary: `maintenance.py`. Default file is `<repo>/data/maintainai.sqlite3` (ignored), overridden by `MAINTAINAI_DB_PATH`. It is local durability, not verified cross-device cloud storage.

Schema v1 (`PRAGMA user_version`): equipment; immutable JSON diagnoses; tickets (equipment/diagnosis foreign keys, title/description/status/resolution, integer version and UTC timestamps); ticket_history (monotonic sequence, timestamp, kind, body). Parameterized SQL, foreign keys, per-operation connections and `BEGIN IMMEDIATE` protect transactions. Five-second SQLite busy timeout returns a retryable 503 on lock exhaustion. No open connection or mutable cycle is shared between requests. History uses sequence order to resolve timestamp ties.

Initialization and deterministic seeded equipment/resolved incident are one idempotent transaction. The seed diagnosis is computed through the real rules. Existing records are never reseeded over user edits. Version 0 initializes v1; version >1 is refused (503), not silently downgraded. Future changes require a numbered transactional migration and backup; never delete the database as an upgrade strategy.

| Endpoint | Behavior |
|---|---|
| `GET /api/equipment` | Equipment metadata/status and associated ticket counts |
| `GET /api/tickets?equipment_id=…` | Latest 200 ticket summaries, optional equipment filter |
| `POST /api/tickets` | Equipment ID, title (1–120), description (≤4000), optional persisted diagnosis ID; returns 201 detail |
| `GET /api/tickets/{id}` | Ticket, immutable diagnosis/evidence snapshot, chronological history |
| `PATCH /api/tickets/{id}` | Required `expected_version`, optional status, note (≤2000), resolution notes (≤2000) |

Transitions: Open ↔ In Progress; either may resolve; Resolved may reopen to Open. Resolution requires notes. Adding a note also increments version. Stale expected version returns 409 without applying changes; UI offers reload instead of overwriting. Missing references return 404, invalid/no-op updates 422. Ticket UUID-derived IDs are stable; diagnosis IDs derive from canonical computed content. Both notes and status/history commit together. Records are shared by users of the same backend and are not private. This is not production security hardening; hosting, retention/backups and production durability remain M3 decisions.

## M3 live guidance

Interactive mode remains default. `guided.ts` defines a reducer for simulation → evidence → checks → saving → complete; `useGuidedDemo.ts` orchestrates existing simulation clock, FastAPI and ticket APIs. Start selects the deterministic dropped-object case. Input loss occurs at t=6; the actual completed cycle reaches FastAPI at t=12. The evidence/checks stages each advance after 4 seconds unless paused. The narrative reads observations/hypotheses/checks from the returned result, not a cached diagnosis.

Pause freezes the clock/tour; Resume continues the stage. Reset demo starts a new labelled run. Skip to Results advances deterministic simulation time to its endpoint and invokes the real backend; it does not fabricate results. Take Manual Control stops the tour and freezes current pose while retaining available results. Request generations invalidate stale diagnosis responses after simulation reset; a separate guide epoch prevents old auto-navigation/saves from changing a newer UI sequence.

The guide creates one labelled synthetic Open maintenance ticket and opens its real detail/snapshot. POST accepts optional UUID `request_id`; its deterministic ticket ID and transaction lookup make retries/concurrent repeats idempotent. Reusing the same key with different original content returns 409. No schema migration is required; existing ticket IDs and manual workflows remain valid. Resetting/closing/taking over cannot undo a write already committed on the server; such a ticket remains discoverable in Maintenance. Retrying the same submitted guide request does not create a second ticket.

## M3 engineering view

Overlays default off. `engineering.ts` derives current joint angles, five frame origins/orientations, an executed-only TCP path and row-major 4×4 transforms. For world translation `(x,y,z)`, yaw `c` and pitch `a`, rotation is `Ry(c) Rz(a)`:

```
[ cos(c)cos(a)  -cos(c)sin(a)  sin(c)  x ]
[ sin(a)        cos(a)        0       y ]
[-sin(c)cos(a)   sin(c)sin(a)  cos(c)  z ]
[ 0             0            0       1 ]
```

Shoulder pitch uses J2; elbow/TCP pitch uses J2+J3; translations come from the existing FK/tool offset. Frame axes use the same rotations as nested render groups. Unit checks compare against independent Three.js matrices and existing rendered-hierarchy/FK tests. The TCP polyline samples only times already executed (0.1-second steps plus current endpoint), not the future nominal trajectory.

Clickable base/shoulder/elbow/tool meshes highlight selection; equivalent named buttons provide keyboard access. Component context shows axes/dimensions/live TCP and real related evidence references, explicitly not a proven component fault. Transform tables and angle values update with actual current simulation time; protective stop therefore freezes them too.

## M3 UX and performance

React lazy/Suspense splits Workcell and Maintenance; loading states and error boundaries contain chunk/render failures with an application reload recovery. Operations/Diagnostics/Maintenance navigation, skip-to-main link, focusable evidence rows, clear focus outlines, labelled controls, readable non-trapping diagnostic content and responsive panels extend the existing UI. `VITE_API_BASE` can specify a public API root at build time (default `/api`); it must never contain credentials. Explicit server CORS origins are configured via `MAINTAINAI_ALLOWED_ORIGINS` (wildcard refused).

R3F uses on-demand rendering; simulation state updates at ~30 Hz, with no continuous idle render loop. Low-poly meshes, no shadows, capped DPR and small optional helpers remain. Observed build: initial entry 215.23 kB / 68.92 kB gzip, Workcell 843.84 / 226.69, Maintenance 7.72 / 2.65, CSS 16.25 / 4.66. The main entry is smaller than M2's 1055.67 / 293.96 single bundle; combined JS is ~1066.79 / 298.26 and the 3D chunk still loads on Operations. This is responsiveness/code-loading separation, not a claimed total bandwidth reduction. The 3D chunk-size warning remains. Cloud software WebGL checks and navigation timing do not establish Windows FPS or accessibility certification.

## M3 anonymous-demo safeguards and maintenance

Existing body/field limits, parameterized SQL, foreign keys, immutable snapshots and optimistic versions remain. Optional `MAINTAINAI_PUBLIC_DEMO=1` enables a 60-second fixed-window write budget (20 per peer, 120 process total; bounded 4096 peers; forwarded headers ignored). Invalid write attempts count; reads remain available; 429 includes Retry-After. Defaults leave local tests/development unaffected. This is single-process protection, reset on restart, not a distributed quota/billing limit or authentication.

`python -m backend.manage backup` uses SQLite's consistent backup API without overwriting an existing destination. `prune` defaults to dry-run; explicit `--apply --backup NEW_FILE` removes only old resolved non-seed tickets and old unreferenced diagnoses in a transaction. History is removed atomically; Open/In Progress and seed records remain. Applied pruning takes a write reservation before a separate consistent backup. Commands were tested on temporary databases only; no real/production records were migrated or pruned. A hosted D1/PostgreSQL adapter needs its own backup/retention implementation and deployment validation.

See `HOSTING_DECISION.md` and `RELEASE_CHECKLIST.md` for the public-write threat model, Free-plan/access gate, runtime/adapter gaps and unverified cloud durability. No public endpoint or database was provisioned.


## Deployment Phase A extension (local prototype, November 1, 2026 UTC)

Native `backend.app` still uses SQLite. `backend.http_api.build_app` provides a shared async HTTP boundary; `backend.domain` and `ticket_models` provide shared maintenance rules/validation. Native repository calls use the threadpool; async D1 calls await the binding directly. The diagnostic algorithms, frontend model and browser session state are unchanged.

Proposed `cloudflare.entry` uses the official Workers ASGI entrypoint, with D1-only dependencies and no local-file fallback. SQL triggers couple ticket mutation/history atomically; conditional versions and existing UUID-derived IDs preserve concurrent/retry semantics. Static Assets route `/api/*` to the Worker and other paths to the unchanged SPA. D1 budgets are shared, unlike the optional native process limiter.

Actually exercised: CPython ASGI + async D1 adapter, with SQL evaluated by genuine local workerd D1, and separate real Static Assets tests. The actual Python VM failed package resolution before app startup; this is not Worker compatibility proof. Large complete snapshots exceed the D1 single-row cap; this adapter is explicitly incomplete for that case. [Phase A](DEPLOYMENT_PHASE_A.md), [storage contract](D1_STORAGE_ADAPTER.md) and [security gaps](PUBLIC_DEMO_SECURITY.md) define the remaining boundaries. No hosted deployment or new approved product requirement follows from this prototype.
