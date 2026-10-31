"""M1 evidence correlation, extended by independent M2 rules. No selector labels."""
import json
from hashlib import sha256
from backend.models import Cycle
from backend.kinematics import check_kinematics
from backend.rules import evaluate_rules, unreliable_vision

def analyze(cycle: Cycle):
    samples = sorted(cycle.samples, key=lambda s: s.t)
    timeline = []
    for i, s in enumerate(samples):
        timeline.append({"id": f"E{i+1}", **s.model_dump(),
                         "kinematics": check_kinematics(s.joints, s.tcp)})
    observations, warnings = [], []
    inconsistent = [e for e in timeline if not e["kinematics"]["valid"]]
    for e in inconsistent:
        warnings.append(f"{e['id']} at {e['t']:g}s: inconsistent kinematic telemetry; "
                        + "; ".join(e["kinematics"]["violations"]))
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
    for e in timeline:
        if any(abs(event["t"] - e["t"]) > 1 for event in e["events"]):
            warnings.append(f"{e['id']}: controller/camera event is not time-correlated to its sample.")
        vision=e["vision"]
        if vision and vision["acquired_t"] > e["t"]:
            warnings.append(f"{e['id']}: observation timestamp is in the future.")
        if vision and not unreliable_vision(e) and vision["object_detected"] is False and e["verification"] == "target":
            warnings.append(f"{e['id']}: reliable visual absence conflicts with target verification.")
        if e["controller"] and e["controller"]["safety_gate_open"] is False and any(event["code"]=="SAFETY_GATE_OPEN" for event in e["events"]):
            warnings.append(f"{e['id']}: safety gate event conflicts with controller signal.")
        placement=e["placement"]
        if placement and placement["object_present"] is True and e["verification"] == "missing":
            warnings.append(f"{e['id']}: independent placement conflicts with missing verification.")
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
    # A failed camera does not independently prove physical absence.
    unreliable_missing = [e for e in timeline if e["id"] in missing and unreliable_vision(e)
                          and not (e["placement"] and e["placement"]["source"] == "independent_sensor"
                                   and e["placement"]["object_present"] is False)]
    detected = bool(held and lost and missing and not warnings and not unreliable_missing)
    status = "detected" if detected else "inconclusive" if warnings or not complete else "normal"
    hypotheses = []
    if lost and not inconsistent:
        hypotheses = [
            {"cause": "Insufficient vacuum / seal loss", "support": list(dict.fromkeys(low + lost)), "contradiction": [], "check": "Inspect cup seal, tubing, and vacuum supply; repeat a stationary hold test."},
            {"cause": "Premature release command", "support": release, "contradiction": lost if not release else [], "check": "Check controller output timing against the gripper command trace."},
            {"cause": "Object sensor or verification error", "support": contradictory, "contradiction": lost + missing, "check": "Inspect sensor alignment and compare independent target verification with a physical count."},
        ]
        hypotheses.sort(key=lambda h: (len(h["support"]), -len(h["contradiction"])), reverse=True)
    anomalies = []
    if detected:
        anomalies.append({"kind": "Dropped object", "summary": "Object lost between pick and place; root cause remains a hypothesis.", "observations": observations.copy(), "hypotheses": hypotheses})
    additional, rule_warnings = evaluate_rules(timeline)
    warnings.extend(rule_warnings)
    if warnings:
        anomalies = []  # Do not turn conflicting or invalid evidence into certainty.
    else:
        anomalies.extend(additional)
    all_observations = observations + [o for a in additional for o in a["observations"]]
    all_hypotheses = [dict(h, anomaly=a["kind"]) for a in anomalies for h in a["hypotheses"]]
    status = "detected" if anomalies else "inconclusive" if warnings or not complete or unreliable_missing else "normal"
    summary = " ".join(a["summary"] for a in anomalies) if anomalies else "Cycle completed with target verified." if status == "normal" else "Insufficient or conflicting evidence for a reliable conclusion."
    result = {"status": status, "failure": " + ".join(a["kind"] for a in anomalies) or None,
              "summary": summary, "observations": all_observations, "hypotheses": all_hypotheses,
              "timeline": timeline, "warnings": warnings, "anomalies": anomalies,
              "ranking_basis": "Ordinal rule evidence, not calibrated probabilities."}
    result["id"] = "D-" + sha256(json.dumps(result, sort_keys=True).encode()).hexdigest()[:24]
    return result
