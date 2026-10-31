from math import isfinite
from typing import Literal
from pydantic import BaseModel, Field, model_validator

class Event(BaseModel):
    t: float = Field(ge=0, allow_inf_nan=False)
    source: Literal["controller", "camera", "calibration", "safety"]
    code: Literal["CAMERA_TIMEOUT", "LOW_LIGHT", "FRAME_OFFSET", "TARGET_CHANGED", "PROTECTIVE_STOP", "SAFETY_GATE_OPEN", "DRIVE_WARNING", "MOTION_INTERRUPTED"]
    message: str = Field(min_length=1, max_length=300)

class Vision(BaseModel):
    acquired_t: float = Field(ge=0, allow_inf_nan=False)
    status: Literal["ok", "timeout", "no_detection"]
    confidence: float | None = Field(default=None, ge=0, le=1, allow_inf_nan=False)
    object_detected: bool | None = None

class Placement(BaseModel):
    target: tuple[float, float, float]
    commanded_target: tuple[float, float, float]
    observed: tuple[float, float, float] | None = None
    object_present: bool | None = None
    source: Literal["camera", "independent_sensor"]
    calibration_age_days: float | None = Field(default=None, ge=0, le=36500, allow_inf_nan=False)
    @model_validator(mode="after")
    def coherent_pose(self):
        vectors = (*self.target, *self.commanded_target, *(self.observed or ()))
        if not all(isfinite(v) for v in vectors):
            raise ValueError("Placement vectors must be finite")
        if self.object_present is True and self.observed is None:
            raise ValueError("A present object requires an observed pose")
        if self.object_present is False and self.observed is not None:
            raise ValueError("An absent object cannot have an observed pose")
        return self

class Controller(BaseModel):
    state: Literal["running", "protective_stop", "stopped"]
    motion_expected: bool
    safety_gate_open: bool | None = None
    drive_warning: bool | None = None

class Sample(BaseModel):
    t: float = Field(ge=0, allow_inf_nan=False)
    phase: Literal["pre-pick", "post-pick", "transport", "pre-place", "post-place"]
    tcp: tuple[float, float, float]
    joints: tuple[float, float, float]
    grip_command: bool
    object_present: bool | None = None
    pressure_kpa: float | None = Field(default=None, ge=0, le=100, allow_inf_nan=False)
    verification: Literal["source", "held", "missing", "target", "offset", "unreliable"] | None = None

    vision: Vision | None = None
    placement: Placement | None = None
    controller: Controller | None = None
    events: list[Event] = Field(default_factory=list, max_length=16)

    @model_validator(mode="after")
    def finite_vectors(self):
        if not all(isfinite(v) for v in (*self.tcp, *self.joints)):
            raise ValueError("Joint and TCP values must be finite")
        return self

class Cycle(BaseModel):
    samples: list[Sample] = Field(min_length=1, max_length=2000)

