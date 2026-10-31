"""Stateless, deterministic evidence correlation. All timestamps are cycle seconds."""
from math import isfinite
from typing import Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

class Sample(BaseModel):
    t: float = Field(ge=0, allow_inf_nan=False)
    phase: Literal["pre-pick", "post-pick", "transport", "pre-place", "post-place"]
    tcp: tuple[float, float, float]
    joints: tuple[float, float, float]
    grip_command: bool
    object_present: bool | None = None
    pressure_kpa: float | None = Field(default=None, ge=0, le=100, allow_inf_nan=False)
    verification: Literal["source", "held", "missing", "target"] | None = None

    @model_validator(mode="after")
    def finite_vectors(self):
        if not all(isfinite(v) for v in (*self.tcp, *self.joints)):
            raise ValueError("Joint and TCP values must be finite")
        return self

class Cycle(BaseModel):
    samples: list[Sample] = Field(min_length=1, max_length=2000)

app = FastAPI(title="MaintainAI Robotics", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/diagnose")
def diagnose(cycle: Cycle):
    samples = sorted(cycle.samples, key=lambda s: s.t)
    timeline = []
    for i, s in enumerate(samples):
        timeline.append({"id": f"E{i+1}", **s.model_dump()})
    observations, warnings = [], []
    def evidence(predicate):
        return [e["id"] for e in timeline if predicate(e)]
    held = evidence(lambda e: e["phase"] == "post-pick" and e["object_present"] is True and e["verification"] == "held")
    held_time = next((e["t"] for e in timeline if e["id"] in held), None)
    lost = evidence(lambda e: held_time is not None and e["t"] > held_time and e["phase"] in ("transport", "pre-place") and e["grip_command"] and e["object_present"] is False)
    loss_time = next((e["t"] for e in timeline if e["id"] in lost), None)
    missing = evidence(lambda e: loss_time is not None and e["t"] > loss_time and e["phase"] == "post-place" and e["verification"] == "missing")
    target = evidence(lambda e: e["phase"] == "post-place" and e["verification"] == "target")
    low = evidence(lambda e: loss_time is not None and abs(e["t"]-loss_time) <= 1 and e["pressure_kpa"] is not None and e["pressure_kpa"] < 30 and e["grip_command"])
    release = evidence(lambda e: held_time is not None and loss_time is not None and held_time < e["t"] <= loss_time and not e["grip_command"])
    if len({s.t for s in samples}) != len(samples): warnings.append("Duplicate timestamps; temporal ordering is ambiguous.")
    if any(s.object_present is None or s.pressure_kpa is None for s in samples): warnings.append("Some sensor readings are missing.")
    contradictory = evidence(lambda e: (e["verification"] == "held" and e["object_present"] is False) or (e["verification"] == "missing" and e["object_present"] is True))
    if contradictory or (lost and target): warnings.append("Contradictory verification evidence; inspect sensors before concluding.")
    if held: observations.append({"text": "Object verified held after pick.", "evidence": held})
    if lost: observations.append({"text": "Object-presence signal lost during commanded grip before placement.", "evidence": lost})
    if missing: observations.append({"text": "Post-place verification found no object at target.", "evidence": missing})
    if low: observations.append({"text": "Vacuum magnitude fell below the 30 kPa demonstration threshold near loss.", "evidence": low})
    phase_order = {p: i for i, p in enumerate(("pre-pick", "post-pick", "transport", "pre-place", "post-place"))}
    if any(phase_order[a.phase] > phase_order[b.phase] for a, b in zip(samples, samples[1:])):
        warnings.append("Cycle phases are out of order.")
    complete = bool(held and target and any(s.phase == "pre-pick" for s in samples) and any(s.phase == "pre-place" for s in samples) and all(s.object_present is not None for s in samples))
    detected = bool(held and lost and missing and not warnings)
    status = "detected" if detected else "inconclusive" if warnings or not complete else "normal"
    hypotheses = []
    if lost:
        hypotheses = [
            {"cause": "Insufficient vacuum / seal loss", "support": low + lost, "contradiction": [], "check": "Inspect cup seal, tubing, and vacuum supply; repeat a stationary hold test."},
            {"cause": "Premature release command", "support": release, "contradiction": lost if not release else [], "check": "Check controller output timing against the gripper command trace."},
            {"cause": "Object sensor or verification error", "support": contradictory, "contradiction": lost + missing, "check": "Inspect sensor alignment and compare independent target verification with a physical count."},
        ]
        hypotheses.sort(key=lambda h: (len(h["support"]), -len(h["contradiction"])), reverse=True)
    return {"status": status, "failure": "Dropped object" if detected else None,
            "summary": "Object lost between pick and place; root cause remains a hypothesis." if detected else "Cycle completed with target verified." if status == "normal" else "Insufficient or conflicting evidence for a reliable conclusion.",
            "observations": observations, "hypotheses": hypotheses, "timeline": timeline,
            "warnings": warnings, "ranking_basis": "Ordinal rule evidence, not calibrated probabilities."}
