import { isValidElement, Fragment, type ReactElement } from "react";
import { it, expect } from "vitest";
import { Object3D, Matrix4, Vector3 } from "three";
import { Robot } from "./Workcell";
import { BaseHousing } from "./RobotVisual";
import { Workpiece, FaultMarkers, WorkcellEnvironment } from "./WorkcellScene";
import { cameraPose, viewCamera, FRAMING_POINTS, LOSS } from "./workcellView";
import { workcellState } from "./workcellState";
import { type Scenario, resolveScenario, cyclePayload } from "./scenarios";
import fixtures from "../../fixtures/scenarios.json";
// Inspect the actual declarative geometry/transform hierarchy, not a second FK.
function scene(node: unknown, parent = new Object3D()): Object3D {
  if (Array.isArray(node)) {
    node.forEach((n) => scene(n, parent));
    return parent;
  }
  if (!isValidElement(node)) return parent;
  const el = node as ReactElement<{
    children?: unknown;
    position?: number[];
    rotation?: number[];
    name?: string;
  }>;
  if (el.type === Fragment) {
    scene(el.props.children, parent);
    return parent;
  }
  if (typeof el.type === "function") {
    scene((el.type as (p: unknown) => unknown)(el.props), parent);
    return parent;
  }
  if (el.type !== "group" && el.type !== "mesh") return parent;
  const object = new Object3D();
  object.name = el.props.name ?? "";
  object.userData.mesh = el.type === "mesh";
  if (el.props.position) object.position.fromArray(el.props.position);
  if (el.props.rotation)
    object.rotation.set(...(el.props.rotation as [number, number, number]));
  parent.add(object);
  scene(el.props.children, object);
  parent.updateMatrixWorld(true);
  return parent;
}
function position(root: Object3D, name: string) {
  return root.getObjectByName(name)!.getWorldPosition(new Vector3()).toArray();
}
function equal(actual: number[], expected: readonly number[]) {
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 8));
}
it("actual 3R joint frames and TCP retain the published independent fixture transforms", () => {
  for (const row of fixtures.normal.samples) {
    const root = scene(Robot({ t: row.t }));
    equal(position(root, "tcp"), row.tcp);
    const [yaw, shoulder, elbow] = row.joints;
    for (const [name, pitch] of [
      ["joint-yaw", 0],
      ["joint-shoulder", shoulder],
      ["joint-elbow", shoulder + elbow],
    ] as const) {
      const rotation = new Matrix4().extractRotation(
        root.getObjectByName(name)!.matrixWorld,
      );
      const expected = new Matrix4()
        .makeRotationY(yaw)
        .multiply(new Matrix4().makeRotationZ(pitch));
      rotation.elements.forEach((v, i) =>
        expect(v).toBeCloseTo(expected.elements[i], 8),
      );
    }
  }
});
it("rendered part stays at source, follows held TCP, and releases at the published destination", () => {
  equal(
    position(scene(Workpiece({ t: 0, scenario: "normal" })), "workpiece"),
    fixtures.normal.samples.find((s) => s.t === 2)!.tcp,
  );
  for (const row of fixtures.normal.samples.filter((s) => s.t >= 2 && s.t < 10))
    equal(
      position(scene(Workpiece({ t: row.t, scenario: "normal" })), "workpiece"),
      row.tcp,
    );
  const target = fixtures.normal.samples.at(-1)!.placement!.observed!;
  for (const t of [10, 11, 12])
    equal(
      position(scene(Workpiece({ t, scenario: "normal" })), "workpiece"),
      target,
    );
});
it("rendered loss/landing and positioning discrepancy retain their existing world positions", () => {
  equal(
    position(scene(Workpiece({ t: 5, scenario: "drop" })), "workpiece"),
    fixtures.drop.samples.find((s) => s.t === 5)!.tcp,
  );
  equal(
    position(scene(Workpiece({ t: 6, scenario: "drop" })), "workpiece"),
    LOSS,
  );
  for (const t of [7, 12])
    equal(position(scene(Workpiece({ t, scenario: "drop" })), "workpiece"), [
      LOSS[0],
      0.13,
      LOSS[2],
    ]);
  equal(
    position(scene(Workpiece({ t: 12, scenario: "position" })), "workpiece"),
    fixtures.position.samples.at(-1)!.placement!.observed!,
  );
});
it("protective stop keeps the rendered part at the recorded interruption position", () => {
  const expected = fixtures.stop.samples.at(-1)!.tcp;
  for (const t of [6, 9, 12])
    equal(
      position(scene(Workpiece({ t, scenario: "stop" })), "workpiece"),
      expected,
    );
  equal(position(scene(Robot({ t: 6 })), "tcp"), expected);
});
it.each([
  ["normal", 0, "none"],
  ["normal", 3, "none"],
  ["normal", 10, "none"],
  ["normal", 12, "placed"],
  ["drop", 5, "none"],
  ["drop", 6, "loss"],
  ["drop", 12, "loss"],
  ["position", 10, "none"],
  ["position", 12, "offset"],
  ["vision", 11, "none"],
  ["vision", 12, "vision"],
  ["stop", 6, "stop"],
] as const)(
  "markers reflect %s at %s without a root-cause claim",
  (scenario, t, marker) => {
    const state = workcellState(t, scenario);
    expect(state.marker).toBe(marker);
    const root = scene(FaultMarkers({ t, scenario }));
    expect(!!root.getObjectByName(`indicator-${marker}`)).toBe(
      marker !== "none",
    );
    expect(state.text + state.note).not.toMatch(
      /seal loss|calibration failure|broken motor/i,
    );
  },
);
it("vision timeout preserves the physical part and labels camera uncertainty", () => {
  const state = workcellState(12, "vision");
  expect(state.text).toContain("unknown");
  expect(state.note).toContain("independently observed");
  equal(
    position(scene(Workpiece({ t: 12, scenario: "vision" })), "workpiece"),
    fixtures.vision.samples.at(-1)!.placement!.observed!,
  );
});
it("both camera presets frame the full existing sweep at desktop and mobile aspects", () => {
  for (const aspect of [848 / 348, 792 / 300, 364 / 280])
    for (const view of ["overview", "inspection"] as const) {
      const camera = viewCamera(view, aspect);
      for (const point of FRAMING_POINTS) {
        const p = new Vector3(...point).project(camera);
        expect(Math.abs(p.x)).toBeLessThan(1);
        expect(Math.abs(p.y)).toBeLessThan(1);
        expect(p.z).toBeGreaterThan(-1);
        expect(p.z).toBeLessThan(1);
      }
    }
  expect(cameraPose("overview", 2)).not.toEqual(cameraPose("inspection", 2));
});
it("procedural default and fault scenes stay within a modest mesh budget", () => {
  for (const scenario of Object.keys(fixtures) as Scenario[]) {
    const root = scene([
      WorkcellEnvironment(),
      BaseHousing({}),
      Robot({ t: 6 }),
      Workpiece({ t: 12, scenario }),
      FaultMarkers({ t: 12, scenario }),
    ]);
    let meshes = 0;
    root.traverse((o) => {
      if (o.userData.mesh) meshes++;
    });
    expect(meshes).toBeLessThanOrEqual(40);
  }
});
it("seeded visualization consumes the resolved scenario without another random draw", () => {
  for (const seed of [0, 1, 42, 137, 999]) {
    const scenario = resolveScenario("random", seed);
    expect(cyclePayload(scenario)).toEqual(fixtures[scenario]);
    equal(
      position(scene(Workpiece({ t: 12, scenario })), "workpiece"),
      position(
        scene(Workpiece({ t: 12, scenario: resolveScenario("random", seed) })),
        "workpiece",
      ),
    );
  }
});

it("pre-pick annotations do not claim a release or verification", () => {
  expect(workcellState(1, "normal").text).toBe(
    "Approaching source · part at fixture",
  );
});
