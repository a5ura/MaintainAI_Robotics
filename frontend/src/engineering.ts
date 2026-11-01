import { BASE, LINKS, LIMITS, fk, trajectory, type Vec } from "./model";
export type ComponentId = "base" | "shoulder" | "elbow" | "tool";
export type Overlays = {
  angles: boolean;
  frames: boolean;
  path: boolean;
  transforms: boolean;
};
export const NO_OVERLAYS: Overlays = {
  angles: false,
  frames: false,
  path: false,
  transforms: false,
};
export const COMPONENTS: Record<
  ComponentId,
  { name: string; axis: string; description: string }
> = {
  base: {
    name: "Base / J1",
    axis: "World Y",
    description:
      "Yaw rotates the arm around the workcell. Frame/calibration observations are relevant here.",
  },
  shoulder: {
    name: "Shoulder / J2",
    axis: "Local Z",
    description:
      "Shoulder pitch moves the 1.5 m upper arm. The pose is commanded, not measured from hardware.",
  },
  elbow: {
    name: "Elbow / J3",
    axis: "Local Z",
    description:
      "Elbow pitch moves the 1.2 m forearm. Controller interruptions and joint evidence are relevant here.",
  },
  tool: {
    name: "Tool / vacuum gripper",
    axis: "Offset −0.32 m local Y",
    description:
      "TCP follows the joint-derived tool transform. Grip command, vacuum and object presence are simulated inputs.",
  },
};
// Row-major homogeneous world transform: Ry(yaw) Rz(pitch), with world translation.
export function transform(position: Vec, yaw: number, pitch: number): number[] {
  const c = Math.cos(yaw),
    s = Math.sin(yaw),
    a = Math.cos(pitch),
    b = Math.sin(pitch);
  return [
    c * a,
    -c * b,
    s,
    position[0],
    b,
    a,
    0,
    position[1],
    -s * a,
    s * b,
    c,
    position[2],
    0,
    0,
    0,
    1,
  ];
}
export function engineeringState(t: number) {
  const joints = trajectory(t),
    pose = fk(joints),
    [yaw, shoulder, elbow] = joints;
  return {
    joints,
    pose,
    limits: LIMITS,
    links: LINKS,
    frames: [
      { name: "World", position: [0, 0, 0] as Vec, yaw: 0, pitch: 0 },
      { name: "Base / J1", position: [0, BASE, 0] as Vec, yaw, pitch: 0 },
      {
        name: "Shoulder / J2",
        position: [0, BASE, 0] as Vec,
        yaw,
        pitch: shoulder,
      },
      {
        name: "Elbow / J3",
        position: pose.elbow,
        yaw,
        pitch: shoulder + elbow,
      },
      { name: "TCP", position: pose.tcp, yaw, pitch: shoulder + elbow },
    ].map((frame) => ({
      ...frame,
      matrix: transform(frame.position, frame.yaw, frame.pitch),
    })),
  };
}
export function executedPath(t: number): Vec[] {
  const times = Array.from(
    { length: Math.floor(t * 10) + 1 },
    (_, i) => i / 10,
  );
  if (times[times.length - 1] !== t) times.push(t);
  return times.map((time) => fk(trajectory(time)).tcp);
}
