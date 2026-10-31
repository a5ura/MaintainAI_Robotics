import { it, expect } from "vitest";
import { Matrix4, Vector3 } from "three";
import { engineeringState, executedPath, NO_OVERLAYS } from "./engineering";
import { fk, trajectory } from "./model";
it("engineering overlays default off", () => {
  expect(Object.values(NO_OVERLAYS)).toEqual([false, false, false, false]);
});
it("every frame transform matches independent Three.js world transforms", () => {
  for (let t = 0; t <= 12; t += 0.15) {
    const state = engineeringState(t);
    expect(state.pose.tcp).toEqual(fk(trajectory(t)).tcp);
    for (const frame of state.frames) {
      const expected = new Matrix4()
        .makeRotationY(frame.yaw)
        .multiply(new Matrix4().makeRotationZ(frame.pitch));
      expected.setPosition(...frame.position);
      frame.matrix.forEach((v, i) =>
        expect(v).toBeCloseTo(
          expected.elements[(i % 4) * 4 + Math.floor(i / 4)],
          10,
        ),
      );
      const actual = new Matrix4().set(
        ...(frame.matrix as Parameters<Matrix4["set"]>),
      );
      expect(actual.determinant()).toBeCloseTo(1, 10);
      expect(new Vector3().applyMatrix4(actual).toArray()).toEqual(
        frame.position,
      );
    }
  }
});
it("executed TCP path ends at actual current state without future samples", () => {
  for (const t of [0, 0.05, 3.15, 6, 12]) {
    const points = executedPath(t);
    expect(points[points.length - 1]).toEqual(fk(trajectory(t)).tcp);
    expect(points.length).toBeLessThanOrEqual(Math.floor(t * 10) + 2);
    points.forEach((p, i) =>
      expect(p).toEqual(fk(trajectory(Math.min(i / 10, t))).tcp),
    );
  }
});
