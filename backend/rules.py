"""Scenario-independent computations over typed, timestamped evidence rows."""
from math import dist

POSITION_TOLERANCE_M = 0.02
VISION_MIN_CONFIDENCE = 0.5
VISION_MAX_AGE_S = 1.0
CALIBRATION_STALE_DAYS = 30

def unreliable_vision(row):
    v = row["vision"]
    return bool(v and (v["status"] != "ok" or v["confidence"] is None
                      or v["confidence"] < VISION_MIN_CONFIDENCE
                      or row["t"]-v["acquired_t"] > VISION_MAX_AGE_S))

def hypothesis(cause, support, contradiction, check):
    return {"cause": cause, "support": list(dict.fromkeys(support)),
            "contradiction": list(dict.fromkeys(contradiction)), "check": check}

def anomaly(kind, summary, observations, hypotheses):
    hypotheses.sort(key=lambda h:(len(h["support"]), -len(h["contradiction"])),reverse=True)
    return dict(kind=kind, summary=summary, observations=observations, hypotheses=hypotheses)

def positioning(rows):
    warnings, bad = [], []
    for e in rows:
        p=e["placement"]
        if not p or p["object_present"] is not True or p["observed"] is None: continue
        if p["source"] == "camera" and (not e["vision"] or unreliable_vision(e)):
            warnings.append(f"{e['id']}: placement observation lacks reliable verification.")
            continue
        if dist(p["target"],p["observed"]) > POSITION_TOLERANCE_M + 1e-12:
            bad.append(e)
    if not bad: return [], warnings
    ids=[e["id"] for e in bad]
    frame=[e["id"] for e in bad if any(v["code"]=="FRAME_OFFSET" for v in e["events"]) or (e["placement"]["calibration_age_days"] or 0)>CALIBRATION_STALE_DAYS]
    wrong=[e["id"] for e in bad if dist(e["placement"]["target"],e["placement"]["commanded_target"])>POSITION_TOLERANCE_M+1e-12]
    independent=[e["id"] for e in bad if e["placement"]["source"]=="independent_sensor"]
    observations=[{"text": f"Placement discrepancy {dist(e['placement']['target'],e['placement']['observed']):.3f} m exceeds 0.020 m tolerance.", "evidence":[e["id"]]} for e in bad]
    return [anomaly("Positioning error", "An independently observed placement differs from the intended target.", observations, [
        hypothesis("Calibration or frame mismatch",frame,[],"Verify the target frame and calibration against a known reference before correcting offsets."),
        hypothesis("Incorrect commanded placement target",wrong,[i for i in ids if i not in wrong],"Compare the programmed target with the approved fixture coordinates."),
        hypothesis("Placement observation error",[],independent,"Check the observation device against an independent measurement; do not assume the robot frame is wrong."),
    ])], warnings

def vision_failure(rows):
    bad=[e for e in rows if unreliable_vision(e)]
    if not bad: return [], []
    ids=[e["id"] for e in bad]
    timeout=[e["id"] for e in bad if e["vision"]["status"]=="timeout" or any(v["code"]=="CAMERA_TIMEOUT" for v in e["events"])]
    light=[e["id"] for e in bad if any(v["code"]=="LOW_LIGHT" for v in e["events"])]
    present=[e["id"] for e in bad if (e["placement"] and e["placement"]["object_present"] is True and e["placement"]["source"]=="independent_sensor") or e["object_present"] is True]
    return [anomaly("Vision failure", "Visual verification is unreliable; this does not establish a physically missing object.",
        [{"text": f"Verification {e['vision']['status']}; age {e['t']-e['vision']['acquired_t']:.1f}s; confidence {e['vision']['confidence'] if e['vision']['confidence'] is not None else 'unknown'}.","evidence":[e["id"]]} for e in bad], [
        hypothesis("Camera acquisition or communication timeout",timeout,[],"Inspect camera power, connection and acquisition timestamps; retry an observation."),
        hypothesis("Illumination or occlusion",light,timeout,"Inspect lighting and lens obstruction, then compare a fresh image."),
        hypothesis("Object physically absent",[],present,"Check object presence with an independent sensor or direct inspection before diagnosing a physical loss."),
    ])], []

def unexpected_stop(rows):
    bad=[]
    for i,e in enumerate(rows):
        c=e["controller"]
        prior=any(p["controller"] and p["controller"]["state"]=="running" and p["t"]<e["t"] for p in rows[:i])
        interrupted=any(v["code"] in ("PROTECTIVE_STOP","MOTION_INTERRUPTED") for v in e["events"])
        if c and c["state"] in ("stopped","protective_stop") and c["motion_expected"] and prior and interrupted: bad.append(e)
    candidates=[e for e in rows if e["controller"] and e["controller"]["state"] in ("stopped","protective_stop") and e["controller"]["motion_expected"]]
    if len(candidates)!=len(bad):
        return [], ["Stop evidence lacks a prior running state or timestamped interruption event."]
    if not bad: return [], []
    ids=[e["id"] for e in bad]
    # Samples taken after interruption must remain at the recorded stop joints.
    first=bad[0]
    if any(any(abs(a-b)>1e-6 for a,b in zip(e["joints"],first["joints"])) for e in rows if e["t"]>first["t"]):
        return [], [f"{first['id']}: robot moves after a reported stop; interrupted-cycle evidence conflicts."]
    gate=[e["id"] for e in bad if e["controller"]["safety_gate_open"] is True]
    closed=[e["id"] for e in bad if e["controller"]["safety_gate_open"] is False]
    drive=[e["id"] for e in bad if e["controller"]["drive_warning"] is True]
    healthy=[e["id"] for e in bad if e["controller"]["drive_warning"] is False]
    return [anomaly("Unexpected robot stop", "Controller interrupted commanded motion; the cycle did not complete.",
      [{"text":"Controller entered a stop state during expected motion.","evidence":ids}], [
        hypothesis("Safety gate or protective circuit opened",gate,closed,"Inspect the safety area and authorized safety indications. Follow the approved recovery procedure; never bypass an interlock."),
        hypothesis("Drive or controller interruption",drive,healthy,"Read the controller fault history and follow the manufacturer's authorized recovery procedure."),
        hypothesis("Motion-program interruption",ids,gate,"Inspect the program event sequence and stop request source before an authorized restart."),
      ])], []

RULES=(positioning,vision_failure,unexpected_stop)
def evaluate_rules(rows):
    anomalies,warnings=[],[]
    for rule in RULES:
        found,issues=rule(rows);anomalies.extend(found);warnings.extend(issues)
    return anomalies,warnings
