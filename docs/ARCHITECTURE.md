# Implemented architecture

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
