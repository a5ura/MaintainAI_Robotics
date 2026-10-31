import { test, expect } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";
import { writeFile } from "node:fs/promises";
import { engineeringState } from "../src/engineering";

test("guided live failure, evidence, checks and real idempotent maintenance ticket", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("checkbox", { name: /Advanced Engineering View/ }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("region", { name: "Guided Demo", exact: true }),
  ).toHaveCount(0);
  const diagnosisResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await expect(
    page.getByText("OBJECT PRESENCE LOST · GRIP STILL COMMANDED", {
      exact: true,
    }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Pause demo", exact: true }).click();
  await page.screenshot({
    path: "../docs/m3-guided-failure.png",
    fullPage: true,
  });
  const paused = await page.locator("progress").getAttribute("value");
  await page.waitForTimeout(300);
  expect(await page.locator("progress").getAttribute("value")).toBe(paused);
  await page.getByRole("button", { name: "Resume demo", exact: true }).click();
  const diagnosis = await (await diagnosisResponse).json();
  expect(diagnosis.failure).toBe("Dropped object");
  await expect(
    page.getByRole("region", { name: "Guided Demo", exact: true }),
  ).toContainText("Connect the observations");
  await page.getByRole("button", { name: "Pause demo", exact: true }).click();
  await page
    .getByRole("region", { name: "Guided Demo", exact: true })
    .getByRole("link", { name: /Inspect E6 at 6.0 seconds/ })
    .click();
  await expect(page.locator("#evidence-E6")).toBeFocused();
  const saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/tickets") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Resume demo", exact: true }).click();
  const response = await saved;
  const ticket = await response.json();
  const body = response.request().postDataJSON();
  expect(ticket.diagnosis.id).toBe(diagnosis.id);
  expect(body.request_id).toMatch(/^[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("region", { name: "Ticket details", exact: true }),
  ).toContainText(ticket.ticket.id);
  await expect(
    page.getByRole("region", { name: "Guided Demo", exact: true }),
  ).toContainText(ticket.ticket.id);
  const retry = await request.post("/api/tickets", { data: body });
  expect(retry.status()).toBe(201);
  expect((await retry.json()).ticket.id).toBe(ticket.ticket.id);
  await page
    .getByText("Originating diagnosis and evidence snapshot", { exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Ticket details", exact: true }),
  ).toContainText(diagnosis.id);
  await page.screenshot({
    path: "../docs/m3-guided-ticket-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "../docs/m3-guided-ticket-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("guided reset, skip and manual takeover preserve real results without auto-writing", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/api/tickets") && r.method() === "POST")
      writes.push(r.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  expect(
    Number(await page.locator("progress").getAttribute("value")),
  ).toBeLessThan(1);
  await page
    .getByRole("button", { name: "Skip to Results", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dropped object", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Take Manual Control", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Guided Demo", exact: true }),
  ).toHaveCount(0);
  await page.waitForTimeout(4500);
  expect(writes).toEqual([]);
  await expect(
    page.getByRole("heading", { name: "Dropped object", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("progress")).toHaveAttribute("value", "0");
});

test("engineering model values, real 3D component picking and keyboard navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page
    .getByRole("checkbox", { name: /Advanced Engineering View/ })
    .check();
  for (const label of [
    "Joint angles",
    "Coordinate frames",
    "TCP trajectory",
    "Transforms",
  ]) {
    await expect(page.getByLabel(label, { exact: true })).not.toBeChecked();
    await page.getByLabel(label, { exact: true }).check();
  }
  await page
    .getByText("World transforms · row-major 4×4", { exact: true })
    .click();
  const matrix = engineeringState(0).frames.find(
    (f) => f.name === "TCP",
  )!.matrix;
  const cells = page
    .getByRole("table", { name: "TCP transform", exact: true })
    .getByRole("cell");
  expect(await cells.allTextContents()).toEqual(
    matrix.map((v) => v.toFixed(4)),
  );
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const camera = new PerspectiveCamera(43, box.width / box.height, 0.1, 1000);
  camera.position.set(5, 4.2, 6);
  camera.lookAt(0.9, 0.5, 0);
  camera.updateMatrixWorld();
  const point = new Vector3(0, 0.24, 0).project(camera);
  await page.mouse.click(
    box.x + ((point.x + 1) * box.width) / 2,
    box.y + ((1 - point.y) * box.height) / 2,
  );
  await expect(
    page.getByRole("region", { name: "Component information", exact: true }),
  ).toContainText("Base / J1");
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip to Results", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dropped object", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Take Manual Control", exact: true })
    .click();
  const tool = page.getByRole("button", {
    name: "Tool / vacuum gripper",
    exact: true,
  });
  await tool.focus();
  await page.keyboard.press("Enter");
  const info = page.getByRole("region", {
    name: "Component information",
    exact: true,
  });
  await expect(info).toContainText("not a proven component fault");
  await info
    .getByRole("link", { name: /Inspect/ })
    .first()
    .click();
  await expect(page.locator("tr:target")).toBeFocused();
  await page.screenshot({
    path: "../docs/m3-engineering-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "../docs/m3-engineering-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("guided backend error recovers through real API retry", async ({
  page,
}) => {
  let failed = false;
  await page.route("**/api/diagnose", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Temporary diagnosis outage" }),
      });
    } else await route.continue();
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip to Results", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Temporary diagnosis outage",
  );
  await expect(
    page.getByRole("heading", { name: "Dropped object", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Retry diagnosis", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dropped object", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Take Manual Control", exact: true })
    .click();
});

test("3D lazy-load error is contained and application reload recovers", async ({
  page,
}) => {
  await page.route("**/Workcell-*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "3D workcell could not load",
  );
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeEnabled();
  await page.unroute("**/Workcell-*.js");
  await page
    .getByRole("button", { name: "Reload application", exact: true })
    .click();
  await expect(page.locator("canvas")).toBeVisible();
  const timings = await page.evaluate(() => ({
    environment:
      "Cloud Chromium software WebGL; not a Windows performance benchmark",
    navigation: (
      performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming
    )?.toJSON(),
    paint: performance
      .getEntriesByType("paint")
      .map((p) => ({ name: p.name, startTime: p.startTime })),
    javascript: performance
      .getEntriesByType("resource")
      .filter((r) => r.name.includes(".js"))
      .map((r) => ({
        name: r.name.split("/").pop(),
        duration: r.duration,
        encodedBodySize: (r as PerformanceResourceTiming).encodedBodySize,
      })),
  }));
  await writeFile(
    "../docs/M3_PERFORMANCE.json",
    JSON.stringify(timings, null, 2) + "\n",
  );
});

test("guided pause/reset stays isolated from another browser simulation", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const guided = await a.newPage(),
    manual = await b.newPage();
  try {
    await guided.goto("http://127.0.0.1:5173");
    await manual.goto("http://127.0.0.1:5173");
    await guided
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    await manual.getByLabel("Scenario", { exact: true }).selectOption("stop");
    await manual.getByRole("button", { name: "Start", exact: true }).click();
    await expect(
      manual.getByRole("heading", {
        name: "Unexpected robot stop",
        exact: true,
      }),
    ).toBeVisible({ timeout: 20000 });
    await guided
      .getByRole("button", { name: "Pause demo", exact: true })
      .click();
    await guided
      .getByRole("button", { name: "Reset demo", exact: true })
      .click();
    await expect(manual.locator("progress")).toHaveAttribute("value", "6");
    await expect(manual.getByLabel("Scenario", { exact: true })).toHaveValue(
      "stop",
    );
    await expect(
      manual.getByRole("heading", {
        name: "Unexpected robot stop",
        exact: true,
      }),
    ).toBeVisible();
    await guided
      .getByRole("button", { name: "Take Manual Control", exact: true })
      .click();
  } finally {
    await a.close();
    await b.close();
  }
});
