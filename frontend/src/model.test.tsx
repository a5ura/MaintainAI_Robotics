import goldenPoses from "../../fixtures/kinematics.json";
import { describe, it, expect } from "vitest";
import { isValidElement, type ReactElement } from "react";
import { Object3D, Vector3 } from "three";
import { Robot } from "./Workcell";
import {
  fk,
  trajectory,
  sample,
  advance,
  objectPosition,
  LIMITS,
  SAMPLE_TIMES,
} from "./model";
describe("kinematic integrity", () => {
  it("matches shared golden poses used by backend checks", () => {
    goldenPoses.forEach(({ joints, tcp }) =>
      fk(joints as [number, number, number]).tcp.forEach((v, i) =>
        expect(v).toBeCloseTo(tcp[i], 8),
      ),
    );
  });
  it("matches independently defined straight and vertical poses", () => {
    expect(fk([0, 0, 0]).tcp[0]).toBeCloseTo(2.7);
    expect(fk([0, 0, 0]).tcp[1]).toBeCloseTo(0.28);
    const vertical = fk([0, Math.PI / 2, 0]).tcp;
    expect(vertical[0]).toBeCloseTo(0.32);
    expect(vertical[1]).toBeCloseTo(3.3);
    expect(fk([Math.PI / 2, 0, 0]).tcp[2]).toBeCloseTo(-2.7);
    expect(fk([0, 0, Math.PI]).tcp[0]).toBeCloseTo(0.3);
  });
  // Traverse the actual Robot component elements into Three transforms, rather
  // than checking a second copy of the FK formula against itself.
  function tree(node: unknown, parent: Object3D) {
    if (Array.isArray(node)) {
      node.forEach((n) => tree(n, parent));
      return;
    }
    if (!isValidElement(node)) return;
    const el = node as ReactElement<{
      children?: unknown;
      position?: number[];
      rotation?: number[];
      name?: string;
    }>;
    if (typeof el.type === "function") {
      tree((el.type as (p: unknown) => unknown)(el.props), parent);
      return;
    }
    if (el.type !== "group" && el.type !== "mesh") return;
    const o = new Object3D();
    if (el.props.position) o.position.fromArray(el.props.position);
    if (el.props.rotation)
      o.rotation.set(...(el.props.rotation as [number, number, number]));
    o.name = el.props.name ?? "";
    parent.add(o);
    tree(el.props.children, o);
  }
  it("actual rendered hierarchy matches TCP telemetry across the cycle", () => {
    for (let t = 0; t <= 12; t += 0.125) {
      const scene = new Object3D();
      tree(Robot({ t }), scene);
      scene.updateMatrixWorld(true);
      const tcp = scene
        .getObjectByName("tcp")!
        .getWorldPosition(new Vector3())
        .toArray();
      tcp.forEach((v, i) => expect(v).toBeCloseTo(sample(t, false).tcp[i], 8));
    }
  });
  it("is deterministic, bounded and continuous", () => {
    let previous = trajectory(0);
    for (let t = 0; t <= 12; t += 0.01) {
      const q = trajectory(t);
      expect(q).toEqual(trajectory(t));
      q.forEach((v, i) => {
        expect(v).toBeGreaterThanOrEqual(LIMITS[i][0]);
        expect(v).toBeLessThanOrEqual(LIMITS[i][1]);
        expect(Math.abs(v - previous[i])).toBeLessThan(0.03);
      });
      previous = q;
    }
  });
  it("respects documented speed and acceleration bounds", () => {
    const dt = 0.001;
    for (let t = dt; t < 12 - dt; t += 0.007) {
      const a = trajectory(t - dt),
        b = trajectory(t),
        c = trajectory(t + dt);
      b.forEach((_, i) => {
        expect(Math.abs((c[i] - a[i]) / (2 * dt))).toBeLessThanOrEqual(1.6);
        expect(
          Math.abs((c[i] - 2 * b[i] + a[i]) / (dt * dt)),
        ).toBeLessThanOrEqual(5);
      });
    }
  });
  it("object follows TCP until loss, then settles; normal placement is repeatable", () => {
    expect(objectPosition(5, true)).toEqual(fk(trajectory(5)).tcp);
    expect(objectPosition(7, true)[1]).toBe(0.13);
    expect(objectPosition(12, false)).toEqual(fk(trajectory(10)).tcp);
  });
  it("samples all verification checkpoints and never sends a scenario label", () => {
    const rows = SAMPLE_TIMES.map((t) => sample(t, true));
    expect(rows.filter((r) => r.verification).map((r) => r.phase)).toEqual([
      "pre-pick",
      "post-pick",
      "pre-place",
      "post-place",
    ]);
    expect(rows[5].object_present).toBe(false);
    expect(rows[5]).not.toHaveProperty("scenario");
  });
  it("pauses, resumes and completes without overrunning", () => {
    expect(advance({ t: 3, running: false }, 1)).toEqual({
      t: 3,
      running: false,
    });
    expect(advance({ t: 3, running: true }, 1)).toEqual({
      t: 4,
      running: true,
    });
    expect(advance({ t: 11, running: true }, 3)).toEqual({
      t: 12,
      running: false,
    });
  });
});
