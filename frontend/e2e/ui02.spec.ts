import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { speechMock } from "./speechMock";
import { workcellProbe } from "./workcellProbe";
import { resolveScenario } from "../src/scenarios";
const sizes = [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
];
const names = {
  normal: "Placement verified",
  drop: "Dropped object",
  position: "Positioning error",
  vision: "Vision failure",
  stop: "Unexpected robot stop",
};
for (const size of sizes) {
  test(`UI02 scenario visuals and camera layout ${size.width}`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await speechMock(page);
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible();
    await page.waitForTimeout(800);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(size.width);
    if (size.width > 1000)
      for (const button of ["Start", "Pause", "Reset", "Start Guided Demo"]) {
        const b = await page
          .getByRole("button", { name: button, exact: true })
          .boundingBox();
        expect(b!.y + b!.height).toBeLessThanOrEqual(size.height);
      }
    await page.clock.install();
    const dir = "../docs/evidence/ui02";
    await mkdir(dir, { recursive: true });
    const completed = [];
    for (const selection of [
      "normal",
      "drop",
      "position",
      "vision",
      "stop",
      "random",
    ] as const) {
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await page
        .getByLabel("Scenario", { exact: true })
        .selectOption(selection);
      if (selection === "random")
        await page.getByLabel("Reproducible seed").fill("42");
      const scenario =
        selection === "random" ? resolveScenario("random", 42) : selection;
      const response = page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Start", exact: true }).click();
      if (selection === "normal") {
        await page.clock.runFor(2800);
        await page.getByRole("button", { name: "Pause", exact: true }).click();
        await expect(
          page.getByText("Object at gripper / PRESENT", { exact: true }),
        ).toBeVisible();
        await page.screenshot({ path: `${dir}/${size.width}-held.png` });
        const paused = await page.locator("progress").getAttribute("value");
        await page
          .getByRole("button", { name: "Inspection", exact: true })
          .click();
        await page.clock.runFor(100);
        await expect(page.getByTestId("workcell-stage")).toHaveAttribute(
          "data-view",
          "inspection",
        );
        expect(await page.locator("progress").getAttribute("value")).toBe(
          paused,
        );
        await page
          .getByRole("button", { name: "Reset View", exact: true })
          .click();
        await page.getByRole("button", { name: "Start", exact: true }).click();
      }
      await page.clock.runFor(13000);
      const result = await (await response).json();
      await expect(
        page.getByRole("heading", { name: names[scenario], exact: true }),
      ).toBeVisible();
      await expect(page.locator("progress")).toHaveAttribute(
        "value",
        scenario === "stop" ? "6" : "12",
      );
      const status = page.getByTestId("scene-status");
      if (scenario === "normal")
        await expect(status).toContainText("Placement verified · released");
      if (scenario === "drop")
        await expect(status).toContainText("Presence lost · 6.0 s");
      if (scenario === "position")
        await expect(status).toContainText("+0.45 m X offset");
      if (scenario === "vision") {
        await expect(status).toContainText("result unknown");
        await expect(status).toContainText("independently observed");
      }
      if (scenario === "stop")
        await expect(status).toContainText("Motion frozen");
      await page.evaluate(() => scrollTo(0, 0));
      await page.clock.runFor(50);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(size.width);
      await page.screenshot({ path: `${dir}/${size.width}-${selection}.png` });
      if (selection === "drop")
        await page.screenshot({
          path: `${dir}/${size.width}-full.png`,
          fullPage: true,
        });
      if (selection === "normal") {
        await page
          .getByRole("button", { name: "Inspection", exact: true })
          .focus();
        await page.keyboard.press("Enter");
        await page.clock.runFor(50);
        await expect(
          page.getByRole("button", { name: "Inspection", exact: true }),
        ).toBeFocused();
        await expect(
          page.getByRole("button", { name: "Inspection", exact: true }),
        ).toHaveAttribute("aria-pressed", "true");
        await page.screenshot({ path: `${dir}/${size.width}-inspection.png` });
        await page
          .getByRole("button", { name: "Reset View", exact: true })
          .click();
      }
      completed.push({
        selection,
        resolved: scenario,
        status: result.status,
        failure: result.failure,
        id: result.id,
      });
    }
    expect(completed.at(-1)!.id).toBe(
      completed.find((r) => r.selection === resolveScenario("random", 42))!.id,
    );
    await writeFile(
      `${dir}/${size.width}-scenarios.json`,
      JSON.stringify(completed, null, 2),
    );
  });
}

test("UI02 camera and context recovery preserve narration/time and release WebGL resources", async ({
  page,
}) => {
  await speechMock(page);
  await workcellProbe(page);
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(1000);
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Replay narration", exact: true })
    .click();
  const paused = await page.locator("progress").getAttribute("value"),
    spoken = await page.evaluate(() => window.__gdSpeech.spoken.length);
  const before = await page.evaluate(() => window.__ui02GPU.read());
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Inspection", exact: true }).click();
    await page.waitForTimeout(60);
    await page.getByRole("button", { name: "Reset View", exact: true }).click();
    await page.waitForTimeout(60);
  }
  expect(await page.locator("progress").getAttribute("value")).toBe(paused);
  expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(
    spoken,
  );
  expect(posts).toEqual([]);
  const after = await page.evaluate(() => window.__ui02GPU.read());
  expect(after.liveBuffers).toBe(before.liveBuffers);
  expect(after.createdBuffers).toBe(before.createdBuffers);
  expect(after.lastFrame!.calls).toBeLessThanOrEqual(40);
  expect(after.lastFrame!.triangles).toBeLessThan(10000);
  await page.evaluate(() => window.__ui02GPU.lose());
  await expect(
    page.getByText(
      "3D context lost. Simulation and evidence remain available.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reload 3D view", exact: true })
    .click();
  await expect(
    page.getByText(
      "3D context lost. Simulation and evidence remain available.",
      { exact: true },
    ),
  ).toHaveCount(0);
  await page.waitForTimeout(800);
  expect(await page.locator("progress").getAttribute("value")).toBe(paused);
  expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(
    spoken,
  );
  expect(posts).toEqual([]);
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.__ui02GPU.read().liveBuffers), {
      timeout: 8000,
    })
    .toBe(0);
  const released = await page.evaluate(() => window.__ui02GPU.read());
  await mkdir("../docs/evidence/ui02", { recursive: true });
  await writeFile(
    "../docs/evidence/ui02/resources.json",
    JSON.stringify(
      {
        environment: "Cloud Chromium / software WebGL; not Windows GPU/FPS",
        before,
        after,
        released,
      },
      null,
      2,
    ),
  );
});

test("UI02 unavailable WebGL preserves controls and real backend diagnosis", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: unknown[]) {
      return args[0] === "webgl2" ? null : Reflect.apply(original, this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByText(
      "3D rendering unavailable. Simulation and evidence controls remain available.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.clock.install();
  await page.getByLabel("Scenario", { exact: true }).selectOption("drop");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.clock.runFor(13000);
  await expect(
    page.getByRole("heading", { name: "Dropped object", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reset", exact: true }),
  ).toBeEnabled();
});
