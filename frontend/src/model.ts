// Right-handed world: Y up. Base yaw about Y, shoulder/elbow about Z.
export type Vec = [number, number, number];
export type Joints = [number, number, number];
export const LINKS = [1.5, 1.2] as const;
export const BASE = 0.6;
export const TOOL = 0.32;
export const DURATION = 12;
export const LIMITS = [
  [-1, 1],
  [-1.4, 1.4],
  [-2, 2],
];
export const KEYS: { t: number; q: Joints }[] = [
  { t: 0, q: [-0.7, 0.8, -1.2] },
  { t: 2, q: [-0.7, 0.15, -0.4] },
  { t: 3, q: [-0.7, 0.15, -0.4] },
  { t: 4, q: [-0.7, 0.8, -1.2] },
  { t: 7, q: [0.7, 0.8, -1.2] },
  { t: 9, q: [0.7, 0.15, -0.4] },
  { t: 10, q: [0.7, 0.15, -0.4] },
  { t: 12, q: [0.7, 0.8, -1.2] },
];
export function fk([yaw, shoulder, elbow]: Joints): { elbow: Vec; tcp: Vec } {
  const point = (r: number, y: number): Vec => [
    r * Math.cos(yaw),
    y + BASE,
    -r * Math.sin(yaw),
  ];
  const r = LINKS[0] * Math.cos(shoulder),
    y = LINKS[0] * Math.sin(shoulder);
  return {
    elbow: point(r, y),
    tcp: point(
      r +
        LINKS[1] * Math.cos(shoulder + elbow) +
        TOOL * Math.sin(shoulder + elbow),
      y +
        LINKS[1] * Math.sin(shoulder + elbow) -
        TOOL * Math.cos(shoulder + elbow),
    ),
  };
}
export function trajectory(t: number): Joints {
  t = Math.max(0, Math.min(DURATION, t));
  const i = Math.max(
    1,
    KEYS.findIndex((k) => k.t >= t),
  );
  const a = KEYS[i - 1],
    b = KEYS[i];
  const u = (t - a.t) / (b.t - a.t);
  const s = u * u * u * (10 + u * (-15 + 6 * u)); // quintic: zero velocity/acceleration at knots
  return a.q.map((q, j) => q + (b.q[j] - q) * s) as Joints;
}
export function phase(t: number) {
  return t < 2
    ? "pre-pick"
    : t < 4
      ? "post-pick"
      : t < 8
        ? "transport"
        : t < 10
          ? "pre-place"
          : "post-place";
}
export type Sample = {
  t: number;
  phase: string;
  tcp: Vec;
  joints: Joints;
  grip_command: boolean;
  object_present: boolean | null;
  pressure_kpa: number | null;
  verification: string | null;
};
export function sample(t: number, drop: boolean): Sample {
  const lost = drop && t >= 6,
    held = t >= 2 && t < 10 && !lost;
  return {
    t,
    phase: phase(t),
    tcp: fk(trajectory(t)).tcp,
    joints: trajectory(t),
    grip_command: t >= 2 && t < 10,
    object_present: held,
    pressure_kpa: held ? 65 : t >= 2 && t < 10 ? 12 : 0,
    verification:
      t === 0
        ? "source"
        : t === 3
          ? "held"
          : t === 9
            ? lost
              ? "missing"
              : "held"
            : t === 12
              ? drop
                ? "missing"
                : "target"
              : null,
  };
}
export const SAMPLE_TIMES = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
export function objectPosition(t: number, drop: boolean): Vec {
  if (t < 2) return fk(trajectory(2)).tcp;
  if (drop && t >= 6) {
    const p = fk(trajectory(6)).tcp;
    return [p[0], Math.max(0.13, p[1] - (t - 6) * 3), p[2]];
  }
  if (t < 10) return fk(trajectory(t)).tcp;
  return fk(trajectory(10)).tcp;
}
export type Clock = { t: number; running: boolean };
export function advance(c: Clock, dt: number): Clock {
  const t = c.running ? Math.min(DURATION, c.t + Math.max(0, dt)) : c.t;
  return { t, running: c.running && t < DURATION };
}
export type Evidence = Sample & {
  id: string;
  kinematics?: {
    valid: boolean;
    expected_tcp: Vec | null;
    error_m: number | null;
    tolerance_m: number;
    violations: string[];
  };
};
export type Diagnosis = {
  status: string;
  failure: string | null;
  summary: string;
  observations: { text: string; evidence: string[] }[];
  hypotheses: {
    cause: string;
    support: string[];
    contradiction: string[];
    check: string;
  }[];
  timeline: Evidence[];
  warnings: string[];
  ranking_basis: string;
};
