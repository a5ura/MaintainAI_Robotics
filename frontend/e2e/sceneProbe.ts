import { expect, type Page } from "@playwright/test";

export type SceneSnapshot = {
  canvases: number;
  markers: number;
  world: number[] | null;
  local: number[] | null;
  meshWorld: number[][];
  ancestors: number;
};
declare global {
  interface Window {
    __ui03Scene: { read: () => SceneSnapshot };
  }
}
// Observe the production reconciler's existing DevTools commit hook in this
// browser test only. No app bundle changes, DOM coordinate guesses or endpoints.
export async function sceneProbe(page: Page) {
  await page.addInitScript(() => {
    type Node = {
      name: string;
      isMesh?: boolean;
      parent: Node | null;
      position: { toArray: () => number[] };
      matrixWorld: { elements: number[] };
      updateWorldMatrix: (parents: boolean, children: boolean) => void;
      traverse: (callback: (node: Node) => void) => void;
    };
    type Store = {
      getState: () => {
        scene: Node & { isScene?: boolean };
        gl: { domElement: HTMLCanvasElement };
        internal: { active: boolean };
      };
    };
    const stores = new Set<Store>();
    let rendererId = 0;
    Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
      configurable: true,
      value: {
        supportsFiber: true,
        inject: () => ++rendererId,
        onCommitFiberRoot: (_id: number, root: { containerInfo?: Store }) => {
          if (typeof root.containerInfo?.getState === "function")
            stores.add(root.containerInfo);
        },
        onCommitFiberUnmount: () => {},
      },
    });
    const world = (node: Node) => {
      // Three's actual matrixWorld includes every transformed ancestor.
      node.updateWorldMatrix(true, false);
      return node.matrixWorld.elements.slice(12, 15);
    };
    window.__ui03Scene = {
      read: () => {
        const active = [...stores]
          .map((store) => store.getState())
          .filter(
            (state) =>
              state.scene?.isScene &&
              state.internal.active &&
              state.gl.domElement.isConnected,
          );
        const markers: Node[] = [];
        for (const state of active)
          state.scene.traverse((node) => {
            if (node.name === "historical-evidence") markers.push(node);
          });
        const marker = markers.length === 1 ? markers[0] : null;
        const meshes: number[][] = [];
        if (marker)
          marker.traverse((node) => {
            if (node.isMesh) meshes.push(world(node));
          });
        let ancestors = 0;
        for (let parent = marker?.parent; parent; parent = parent.parent)
          ancestors++;
        return {
          canvases: active.length,
          markers: markers.length,
          world: marker ? world(marker) : null,
          local: marker?.position.toArray() ?? null,
          meshWorld: meshes,
          ancestors,
        };
      },
    };
  });
}
// CPU Three.js world matrices use double precision. 1e-8 m tolerates numerical
// roundoff while remaining 10,000x tighter than the backend's 1e-4 m FK tolerance.
export async function expectMarkerWorld(page: Page, expected: number[]) {
  expect(expected).toHaveLength(3);
  expect(expected.every(Number.isFinite)).toBe(true);
  await expect
    .poll(
      async () => {
        const scene = await page.evaluate(() => window.__ui03Scene.read());
        if (
          scene.canvases !== 1 ||
          scene.markers !== 1 ||
          !scene.world ||
          scene.meshWorld.length !== 2
        )
          return Infinity;
        return Math.max(
          ...[scene.world, ...scene.meshWorld].flatMap((point) =>
            point.map((value, i) => Math.abs(value - expected[i])),
          ),
        );
      },
      { timeout: 8000 },
    )
    .toBeLessThanOrEqual(1e-8);
  return page.evaluate(() => window.__ui03Scene.read());
}
