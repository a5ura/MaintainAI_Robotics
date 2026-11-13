import { PerspectiveCamera, Vector3 } from "three";
import { BASE, fk, trajectory, type Vec } from "./model";
import { scenarioObjectPosition } from "./scenarios";

export type CameraView = "overview" | "inspection";
export const CAMERA_VIEWS = {
  overview: {
    direction: [4.2, 3.5, 5.4] as Vec,
    target: [1.05, 0.65, 0] as Vec,
    fov: 38,
  },
  inspection: {
    direction: [5.4, 2.8, 3.6] as Vec,
    target: [1.05, 0.65, 0] as Vec,
    fov: 34,
  },
};
export const SOURCE = fk(trajectory(2)).tcp;
export const TARGET = fk(trajectory(10)).tcp;
export const LOSS = fk(trajectory(6)).tcp;

// Framing only. No alternate trajectory, clock, scenario draw or diagnostic rule.
// Built once; include the complete existing sweep and all existing object paths.
export const FRAMING_POINTS: Vec[] = [];
function include(point: Vec, pad: number) {
  for (const x of [-pad, pad])
    for (const y of [-pad, pad])
      for (const z of [-pad, pad])
        FRAMING_POINTS.push([point[0] + x, point[1] + y, point[2] + z]);
}
include([0, 0.24, 0], 0.56);
include([0, BASE, 0], 0.23);
for (let i = 0; i <= 120; i++) {
  const t = i / 10,
    pose = fk(trajectory(t));
  include(pose.elbow, 0.24);
  include(pose.tcp, 0.38);
  for (const scenario of ["normal", "drop", "position"] as const)
    include(scenarioObjectPosition(t, scenario), 0.14);
}
for (const p of [SOURCE, TARGET])
  for (const x of [-0.43, 0.43])
    for (const z of [-0.43, 0.43])
      FRAMING_POINTS.push([p[0] + x, p[1] - 0.12, p[2] + z]);

export function cameraPose(view: CameraView, aspect: number) {
  const preset = CAMERA_VIEWS[view],
    direction = new Vector3(...preset.direction).normalize();
  const right = new Vector3(0, 1, 0).cross(direction).normalize(),
    up = direction.clone().cross(right);
  const target = new Vector3(...preset.target),
    tan = Math.tan((preset.fov * Math.PI) / 360);
  const margin = aspect < 1.5 ? 0.68 : 0.83;
  let distance = 3;
  for (const point of FRAMING_POINTS) {
    const p = new Vector3(...point).sub(target),
      depth = p.dot(direction);
    distance = Math.max(
      distance,
      depth + Math.abs(p.dot(right)) / (tan * Math.max(0.1, aspect) * margin),
      depth + Math.abs(p.dot(up)) / (tan * margin),
    );
  }
  return {
    position: target
      .clone()
      .addScaledVector(direction, distance)
      .toArray() as Vec,
    target: preset.target,
    fov: preset.fov,
  };
}
export function viewCamera(view: CameraView, aspect: number) {
  const pose = cameraPose(view, aspect),
    camera = new PerspectiveCamera(pose.fov, aspect, 0.1, 60);
  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  camera.updateMatrixWorld();
  return camera;
}
