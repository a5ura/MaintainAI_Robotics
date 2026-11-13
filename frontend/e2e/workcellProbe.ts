import type { Page } from "@playwright/test";
declare global {
  interface Window {
    __ui02GPU: {
      read: () => {
        contexts: number;
        renderer: {
          id: number;
          liveBuffers: number;
          createdBuffers: number;
          drawCalls: number;
          triangles: number;
        } | null;
        liveBuffers: number;
        createdBuffers: number;
        deletedBuffers: number;
        lastFrame: { calls: number; triangles: number } | null;
      };
      lose: () => void;
    };
  }
}
// Test-only native WebGL instrumentation; no production metrics endpoint or API.
export async function workcellProbe(page: Page) {
  await page.addInitScript(() => {
    const seen = new WeakSet<object>(),
      records: {
        buffers: Set<WebGLBuffer>;
        created: number;
        deleted: number;
        drawCalls: number;
        triangles: number;
      }[] = [];
    const frames = new Map<number, { calls: number; triangles: number }>();
    let stamp = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      raf((time) => {
        stamp = time;
        callback(time);
        stamp = 0;
      });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: unknown[]) {
      const gl = Reflect.apply(
        original,
        this,
        args,
      ) as WebGL2RenderingContext | null;
      if (gl && args[0] === "webgl2" && !seen.has(gl)) {
        seen.add(gl);
        const record = {
          buffers: new Set<WebGLBuffer>(),
          created: 0,
          deleted: 0,
          drawCalls: 0,
          triangles: 0,
        };
        records.push(record);
        const create = gl.createBuffer.bind(gl),
          remove = gl.deleteBuffer.bind(gl);
        gl.createBuffer = () => {
          const b = create();
          if (b) {
            record.buffers.add(b);
            record.created++;
          }
          return b;
        };
        gl.deleteBuffer = (buffer) => {
          if (buffer && record.buffers.delete(buffer)) record.deleted++;
          remove(buffer);
        };
        this.addEventListener("webglcontextlost", () => record.buffers.clear());
        function count(mode: number, n: number) {
          record.drawCalls++;
          if (mode === 4) record.triangles += n / 3;
          const key = stamp || performance.now();
          let frame = frames.get(key);
          if (!frame) {
            frame = { calls: 0, triangles: 0 };
            frames.set(key, frame);
            if (frames.size > 20) frames.delete(frames.keys().next().value!);
          }
          frame.calls++;
          if (mode === 4) frame.triangles += n / 3;
        }
        const elements = gl.drawElements.bind(gl),
          arrays = gl.drawArrays.bind(gl);
        gl.drawElements = (mode, n, type, offset) => {
          count(mode, n);
          elements(mode, n, type, offset);
        };
        gl.drawArrays = (mode, first, n) => {
          count(mode, n);
          arrays(mode, first, n);
        };
      }
      return gl;
    } as typeof original;
    window.__ui02GPU = {
      read: () => ({
        contexts: records.length,
        renderer: records.length
          ? {
              id: records.length,
              liveBuffers: records.at(-1)!.buffers.size,
              createdBuffers: records.at(-1)!.created,
              drawCalls: records.at(-1)!.drawCalls,
              triangles: records.at(-1)!.triangles,
            }
          : null,
        liveBuffers: records.reduce((sum, r) => sum + r.buffers.size, 0),
        createdBuffers: records.reduce((sum, r) => sum + r.created, 0),
        deletedBuffers: records.reduce((sum, r) => sum + r.deleted, 0),
        lastFrame: [...frames.values()].at(-1) ?? null,
      }),
      lose: () => {
        const gl = document.querySelector("canvas")?.getContext("webgl2");
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
      },
    };
  });
}
