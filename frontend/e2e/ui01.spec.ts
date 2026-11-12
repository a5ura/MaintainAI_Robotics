import { test, expect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const sizes = [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
];
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
}
async function initialGeometry(page: Page, height: number) {
  const elements = [
    page.locator("canvas"),
    ...["Start", "Pause", "Reset", "Start Guided Demo"].map((name) =>
      page.getByRole("button", { name, exact: true }),
    ),
    page.getByLabel("Scenario", { exact: true }),
    page.getByLabel("Reproducible seed"),
    page.getByTestId("investigation-outcome"),
  ];
  const boxes = [];
  for (const element of elements) {
    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    boxes.push({
      element: await element.evaluate(
        (el) => el.getAttribute("aria-label") || el.textContent || el.tagName,
      ),
      ...box,
    });
  }
  return boxes;
}
for (const size of sizes) {
  test(`UI01 viewport and six real presentation states ${size.width}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible();
    // Allow the unchanged lazy-loaded, demand-rendered Three scene to paint.
    await page.waitForTimeout(1500);
    const directory = "../docs/evidence/ui01/screenshots";
    await mkdir(directory, { recursive: true });
    const capture = async (state: string) => {
      await page.evaluate(() => scrollTo(0, 0));
      await noOverflow(page);
      await page.screenshot({
        path: `${directory}/${size.width}-${state}-viewport.png`,
      });
      await page.screenshot({
        path: `${directory}/${size.width}-${state}-full.png`,
        fullPage: true,
      });
    };
    if (size.width > 1000) {
      const boxes = await initialGeometry(page, size.height);
      await writeFile(
        `${directory}/${size.width}-geometry.json`,
        JSON.stringify({ viewport: size, boxes }, null, 2),
      );
    }
    await capture("idle");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Placement verified" }),
    ).toBeVisible({ timeout: 30000 });
    await capture("normal");
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    await page.getByRole("button", { name: "Pause demo", exact: true }).click();
    await capture("guided");
    await page
      .getByRole("button", { name: "Skip to Results", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Dropped object", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Take Manual Control", exact: true })
      .click();
    await capture("fault");
    await page
      .getByRole("button", { name: "Full diagnostics & evidence" })
      .click();
    await expect(
      page.getByRole("region", { name: "Diagnostics Workspace", exact: true }),
    ).toBeFocused();
    const ids = await page
      .locator('[id^="evidence-"]')
      .evaluateAll((rows) => rows.map((row) => row.id));
    expect(new Set(ids).size).toBe(ids.length);
    await page
      .locator("details")
      .filter({ hasText: "Insufficient vacuum / seal loss" })
      .getByRole("link", { name: /Supports E6 at 6.0 seconds/ })
      .click();
    await expect(page.locator("#evidence-E6")).toBeFocused();

    // A deliberately shortened synthetic request exercises a real backend
    // inconclusive response; the application never fabricates a diagnosis.
    await page.route("**/api/diagnose", async (route) => {
      const payload = route.request().postDataJSON();
      const response = await route.fetch({
        postData: JSON.stringify({ samples: payload.samples.slice(0, 1) }),
      });
      await route.fulfill({ response });
    });
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Skip to Results", exact: true })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Investigation summary", exact: true })
        .getByText("Inconclusive", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Take Manual Control", exact: true })
      .click();
    await capture("inconclusive");
    await page.unroute("**/api/diagnose");
    await page.route("**/api/diagnose", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "UI01 deliberate unavailable-service test",
        }),
      }),
    );
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Skip to Results", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Retry diagnosis", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Take Manual Control", exact: true })
      .click();
    await capture("error");
    await page.unroute("**/api/diagnose");
    await page
      .getByRole("button", { name: "Retry diagnosis", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Dropped object", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Maintenance", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "From evidence to action.",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Diagnostics", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Diagnostics Workspace", exact: true }),
    ).toBeFocused();
  });
}

test("UI01 resize preserves running and paused simulation state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Scenario", { exact: true }).selectOption("random");
  await page.getByLabel("Reproducible seed").fill("137");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.waitForTimeout(600);
  const before = Number(await page.locator("progress").getAttribute("value"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  expect(
    Number(await page.locator("progress").getAttribute("value")),
  ).toBeGreaterThan(before);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.locator("progress").getAttribute("value");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(300);
  expect(await page.locator("progress").getAttribute("value")).toBe(paused);
  await expect(page.getByLabel("Scenario", { exact: true })).toHaveValue(
    "random",
  );
  await expect(page.getByLabel("Reproducible seed")).toHaveValue("137");
  await noOverflow(page);
});
