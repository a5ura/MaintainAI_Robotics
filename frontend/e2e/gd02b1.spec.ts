import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { speechMock } from "./speechMock";
import { guideToAnalysis } from "./guidedController";
import { sceneProbe, expectMarkerWorld } from "./sceneProbe";
for (const size of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`GD02B1 Manual lifecycle and zero ticket writes at ${size.width}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await speechMock(page);
    await sceneProbe(page);
    await page.setViewportSize(size);
    const posts: string[] = [],
      errors: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    const records = await (await page.request.get("/api/tickets")).json();
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    const guide = page.getByRole("region", {
      name: "Guided Demo",
      exact: true,
    });
    await expect(guide.getByLabel("Playback mode")).toHaveValue("manual");
    await expect(page.locator("progress")).toHaveAttribute("value", "0");
    const diagnosis = await (await guideToAnalysis(page)).json();
    await expect(
      guide.getByRole("button", { name: "Next", exact: true }),
    ).toBeEnabled();
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await expect(guide.getByRole("heading")).toHaveText(
      "Evidence Investigation",
    );
    for (const id of ["E6", "E5"]) {
      await page
        .getByRole("group", { name: "Recorded readings" })
        .getByRole("button", { name: new RegExp(`^${id} ·`) })
        .click();
      await expectMarkerWorld(
        page,
        diagnosis.timeline.find((r: { id: string }) => r.id === id).tcp,
      );
    }
    await page
      .getByRole("button", { name: "Clear Selection", exact: true })
      .focus();
    await page.keyboard.press(size.width === 390 ? "Space" : "Enter");
    await expect
      .poll(() => page.evaluate(() => window.__ui03Scene.read().markers))
      .toBe(0);
    await expect(
      page.getByRole("region", { name: "Evidence inspector" }),
    ).toContainText("Select a recorded reading");
    const time = await page.locator("progress").getAttribute("value");
    const tcp = await page.locator(".tcp").innerText();
    await guide.getByRole("button", { name: "Previous", exact: true }).click();
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await expect(guide.getByRole("heading")).toHaveText(
      "Diagnosis and Next Checks",
    );
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await expect(guide.getByRole("heading")).toHaveText("Maintenance Handoff");
    await expect(
      guide.getByRole("button", { name: "Next", exact: true }),
    ).toBeDisabled();
    await expect(
      guide.getByRole("button", { name: /Create.*ticket/ }),
    ).toHaveCount(0);
    for (let i = 0; i < 2; i++) {
      await guide
        .getByRole("button", { name: "Previous", exact: true })
        .click();
      await guide.getByRole("button", { name: "Next", exact: true }).click();
      await guide
        .getByRole("button", { name: "Replay narration", exact: true })
        .click();
    }
    await guide
      .getByRole("button", { name: "Pause demo", exact: true })
      .click();
    await guide.getByLabel("Playback mode").selectOption("automatic");
    await page.clock.runFor(5000);
    await guide
      .getByRole("button", { name: "Resume demo", exact: true })
      .click();
    await page.clock.runFor(10000);
    await expect(guide.getByRole("heading")).toHaveText("Maintenance Handoff");
    expect(await page.locator("progress").getAttribute("value")).toBe(time);
    expect(await page.locator(".tcp").innerText()).toBe(tcp);
    expect(posts.filter((url) => url.endsWith("/api/diagnose"))).toHaveLength(
      1,
    );
    expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
    expect(await (await page.request.get("/api/tickets")).json()).toEqual(
      records,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(size.width);
    await mkdir("../docs/evidence/gd02b1", { recursive: true });
    await guide.screenshot({
      path: `../docs/evidence/gd02b1/${size.width}-handoff.png`,
    });
    await guide
      .getByRole("button", { name: "Exit walkthrough", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    await page.clock.runFor(10000);
    await expect(guide.getByRole("heading")).toHaveText("Introduction");
    expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
    expect(errors).toEqual([]);
  });
}
test("GD02B1 Automatic waits for real milestones and diagnosis, ends without ticket confirmation", async ({
  page,
}) => {
  test.setTimeout(120000);
  await speechMock(page, []);
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/");
  await page.clock.install();
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  const guide = page.getByRole("region", { name: "Guided Demo", exact: true });
  await guide.getByLabel("Playback mode").selectOption("automatic");
  await page.clock.runFor(4000);
  await expect(guide.getByRole("heading")).toHaveText("Robot Operation");
  await page.clock.runFor(6500);
  await expect(
    guide.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
  await page.clock.runFor(4000);
  await expect(guide.getByRole("heading")).toHaveText("Fault Detection");
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/diagnose"),
  );
  await page.clock.runFor(6500);
  await response;
  await expect(
    guide.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
  for (let i = 0; i < 3; i++) await page.clock.runFor(4000);
  await expect(guide.getByRole("heading")).toHaveText("Maintenance Handoff");
  await page.clock.runFor(20000);
  expect(posts.filter((url) => url.endsWith("/api/diagnose"))).toHaveLength(1);
  expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
});

test("GD02B1 pending/error diagnosis cannot be bypassed by modes or repeated navigation", async ({
  page,
}) => {
  test.setTimeout(120000);
  await speechMock(page);
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  let received = false;
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.route("**/api/diagnose", async (route) => {
    received = true;
    await gate;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Deliberate GD02B1 outage" }),
    });
  });
  try {
    await page.goto("/");
    await page.clock.install();
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    const guide = page.getByRole("region", {
      name: "Guided Demo",
      exact: true,
    });
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await page.clock.runFor(6500);
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await page.clock.runFor(6500);
    await expect.poll(() => received, { timeout: 15000 }).toBe(true);
    await guide.getByLabel("Playback mode").selectOption("automatic");
    await page.clock.runFor(5000);
    await expect(guide.getByRole("heading")).toHaveText("Fault Detection");
    await expect(
      guide.getByRole("button", { name: "Next", exact: true }),
    ).toBeDisabled();
    await guide.getByLabel("Playback mode").selectOption("manual");
    await guide.getByRole("button", { name: "Previous", exact: true }).click();
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    const error = page.waitForResponse((r) =>
      r.url().endsWith("/api/diagnose"),
    );
    release();
    await error;
    await expect(guide.getByRole("status")).toContainText(
      "Diagnosis unavailable",
    );
    await guide.getByLabel("Playback mode").selectOption("automatic");
    await page.clock.runFor(20000);
    await expect(guide.getByRole("heading")).toHaveText("Fault Detection");
    expect(posts.filter((url) => url.endsWith("/api/diagnose"))).toHaveLength(
      1,
    );
    expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
    await guide
      .getByRole("button", { name: "Exit walkthrough", exact: true })
      .click();
  } finally {
    release();
  }
});
