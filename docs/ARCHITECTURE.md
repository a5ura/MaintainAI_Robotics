# Implemented architecture

React/TypeScript + Tailwind/Vite → React Three Fiber/Three.js visualization; Vite proxies `/api` → Python FastAPI/Pydantic → pure deterministic correlation rules → JSON → diagnostic UI. No database or shared mutable run state in M1. Browser clocks and run generations isolate visitors and prevent stale responses after Reset.

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

Loopback-only dev servers; no authentication or production hardening. No persistent records, real sensors, safety guarantees, calibrated confidence, hosted URL, or cloud storage. Those V1/V2 distinctions are preserved in PRD. Stop both dev processes when not needed. Rendering is capped at 1.5 device pixel ratio with low-poly geometry, no shadows, and no physics/GPU requirement beyond browser WebGL.

## Evidence traceability — stabilization

Observation, supporting, and contradictory evidence references are labelled links to focusable timeline rows (`#evidence-E…`). Links expose phase, grip command, object presence, pressure, verification, and timestamp in accessible descriptions/tooltips. Targeted rows highlight and retain keyboard focus; the timeline includes FK consistency. No supporting readings and contradictory evidence are explicitly labelled; links missing from a response are marked unavailable rather than fabricated. Hypotheses and operator checks remain distinct from observations.
