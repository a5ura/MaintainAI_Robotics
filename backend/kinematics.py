"""Independent implementation of frontend/src/model.ts's approved 3R model.

Right-handed Y-up world; metres and radians. No IK or physics required.
"""
from math import cos, sin, dist, isclose, isfinite

JOINT_LIMITS = ((-1.0, 1.0), (-1.4, 1.4), (-2.0, 2.0))
TCP_TOLERANCE_M = 0.0001  # 0.1 mm Euclidean position error


def forward_kinematics(joints):
    yaw, shoulder, elbow = joints
    reach = (1.5 * cos(shoulder) + 1.2 * cos(shoulder + elbow)
             + 0.32 * sin(shoulder + elbow))
    height = (0.6 + 1.5 * sin(shoulder) + 1.2 * sin(shoulder + elbow)
              - 0.32 * cos(shoulder + elbow))
    return (reach * cos(yaw), height, -reach * sin(yaw))


def check_kinematics(joints, tcp):
    violations = [f"Joint {i + 1} outside [{low}, {high}] rad"
                  for i, (value, (low, high)) in enumerate(zip(joints, JOINT_LIMITS))
                  if not low <= value <= high]
    # Do not evaluate FK for out-of-limit values (even finite inputs can overflow
    # when summed). Such evidence is already physically inconsistent.
    if violations:
        return {"valid": False, "expected_tcp": None, "error_m": None,
                "tolerance_m": TCP_TOLERANCE_M, "violations": violations}
    expected = forward_kinematics(joints)
    error = dist(expected, tcp)
    # Permit only 1e-12 m floating-point roundoff at the inclusive boundary.
    valid = error <= TCP_TOLERANCE_M or isclose(
        error, TCP_TOLERANCE_M, rel_tol=0, abs_tol=1e-12)
    if not valid:
        violations.append("TCP disagrees with joint-derived FK by more than 0.1 mm")
    return {"valid": valid, "expected_tcp": expected,
            "error_m": error if isfinite(error) else None,
            "tolerance_m": TCP_TOLERANCE_M, "violations": violations}
