import { test, expect } from "@playwright/test";
import { SCENARIOS, resolveScenario } from "../src/scenarios";
test("positioning error, diagnosis ticket, concurrent edit recovery and durable history", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByLabel("Scenario", { exact: true }).selectOption("position");
  const analysis = page.waitForResponse(
    (r) => r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const result = await (await analysis).json();
  expect(result.failure).toBe("Positioning error");
  expect(result.timeline.every((e: any) => e.kinematics.valid)).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Positioning error", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("PLACEMENT OFFSET · INDEPENDENT OBSERVATION"),
  ).toBeVisible();
  const reference = page
    .locator("details")
    .filter({ hasText: "Calibration or frame mismatch" })
    .getByRole("link", { name: /Supports/ })
    .first();
  await reference.click();
  await expect(page.locator("#evidence-E11")).toBeFocused();
  await page.getByRole("button", { name: "Create maintenance ticket" }).click();
  const title = "Placement review " + Date.now();
  await page.getByLabel("Title", { exact: true }).fill(title);
  const creation = page.waitForResponse(
    (r) => r.url().endsWith("/api/tickets") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Create ticket", exact: true })
    .click();
  const detail = await (await creation).json();
  const id = detail.ticket.id;
  expect(detail.diagnosis.id).toBe(result.id);
  expect(detail.diagnosis.failure).toBe("Positioning error");
  // Another operator updates the same record before this UI saves version 1.
  const outsider = await request.patch("/api/tickets/" + id, {
    data: { expected_version: 1, note: "Independent operator inspection" },
  });
  expect(outsider.status()).toBe(200);
  await page
    .getByLabel("Ticket status", { exact: true })
    .selectOption("In Progress");
  await page
    .getByLabel("Repair note / operator observation")
    .fill("Calibration inspected");
  await page.getByRole("button", { name: "Save update" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Ticket changed in another session",
  );
  await page.getByRole("button", { name: "Reload records" }).click();
  await expect(page.getByRole("alert")).not.toBeVisible();
  await page
    .getByLabel("Ticket status", { exact: true })
    .selectOption("In Progress");
  await page
    .getByLabel("Repair note / operator observation")
    .fill("Calibration inspected");
  await page.getByRole("button", { name: "Save update" }).click();
  await expect(
    page.getByRole("region", { name: "Ticket details" }),
  ).toContainText("VERSION 3");
  await page
    .getByLabel("Ticket status", { exact: true })
    .selectOption("Resolved");
  await page
    .getByLabel("Resolution notes", { exact: true })
    .fill("Frame corrected and independent placement check passed");
  await page.getByRole("button", { name: "Save update" }).click();
  await expect(
    page.getByRole("region", { name: "Ticket details" }),
  ).toContainText("VERSION 4");
  await page
    .getByText("Originating diagnosis and evidence snapshot", { exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Ticket details" }),
  ).toContainText(result.id);
  await page.screenshot({
    path: "../docs/m3-regression-maintenance-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "../docs/m3-regression-maintenance-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(
    page.getByRole("region", { name: "Ticket details" }),
  ).toContainText("Resolved");
  await expect(
    page.getByRole("region", { name: "Ticket details" }),
  ).toContainText("Independent operator inspection");
});
test("vision failure is unreliable verification and not physical loss", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Scenario", { exact: true }).selectOption("vision");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vision failure", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByText("CAMERA TIMEOUT · VERIFICATION UNAVAILABLE"),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Visual verification is unreliable; this does not establish a physically missing object.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/m3-regression-vision.png",
    fullPage: true,
  });
});
test("unexpected stop freezes displayed robot TCP and clock at interruption", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Scenario", { exact: true }).selectOption("stop");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Unexpected robot stop", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  const before = await page.locator(".tcp").textContent();
  await expect(page.locator("progress")).toHaveAttribute("value", "6");
  await page.waitForTimeout(700);
  expect(await page.locator(".tcp").textContent()).toBe(before);
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("Not reached")).toHaveCount(2);
  await page.screenshot({
    path: "../docs/m3-regression-stop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("progress")).toHaveAttribute("value", "0");
});
test("random failure replays same evidence for explicit seed", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Scenario", { exact: true }).selectOption("random");
  await page.getByLabel("Reproducible seed").fill("42");
  const kind = SCENARIOS[resolveScenario("random", 42)];
  await expect(page.getByTestId("run-context")).toContainText(
    kind + " · seed 42",
  );
  const results = [];
  for (let i = 0; i < 2; i++) {
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Start", exact: true }).click();
    results.push(await (await response).json());
    await expect(
      page.getByRole("heading", { name: kind, exact: true }),
    ).toBeVisible();
    if (i === 0)
      await page.getByRole("button", { name: "Reset", exact: true }).click();
  }
  expect(results[0]).toEqual(results[1]);
});
test("separate browser simulations remain independent across reset and scenario changes", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const first = await a.newPage(),
    second = await b.newPage();
  try {
    await first.goto("http://127.0.0.1:5173");
    await second.goto("http://127.0.0.1:5173");
    await first.getByLabel("Scenario", { exact: true }).selectOption("stop");
    await second.getByLabel("Scenario", { exact: true }).selectOption("vision");
    await first.getByRole("button", { name: "Start", exact: true }).click();
    await second.getByRole("button", { name: "Start", exact: true }).click();
    await first
      .getByRole("heading", { name: "Unexpected robot stop", exact: true })
      .waitFor({ timeout: 20000 });
    await second.getByRole("button", { name: "Pause", exact: true }).click();
    const paused = await second.locator("progress").getAttribute("value");
    await first.getByRole("button", { name: "Reset", exact: true }).click();
    await first
      .getByLabel("Scenario", { exact: true })
      .selectOption("position");
    expect(await second.locator("progress").getAttribute("value")).toBe(paused);
    await expect(second.getByLabel("Scenario", { exact: true })).toHaveValue(
      "vision",
    );
    await second.getByRole("button", { name: "Start", exact: true }).click();
    await expect(
      second.getByRole("heading", { name: "Vision failure", exact: true }),
    ).toBeVisible({ timeout: 30000 });
  } finally {
    await a.close();
    await b.close();
  }
});

test("manual ticket UI and initial API error recovery", async ({ page }) => {
  let failed = false;
  await page.route("**/api/equipment", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Simulated temporary storage failure" }),
      });
    } else await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Simulated temporary storage failure",
  );
  await page.getByRole("button", { name: "Reload records" }).click();
  await expect(page.getByRole("alert")).not.toBeVisible();
  await expect(
    page.getByRole("region", { name: "Equipment registry" }),
  ).toContainText("Robot R-01");
  await page
    .getByRole("button", { name: "Manual ticket", exact: true })
    .click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Manual inspection " + Date.now());
  await page
    .getByLabel("Description", { exact: true })
    .fill("Operator observation from maintenance screen.");
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/tickets") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Create ticket", exact: true })
    .click();
  const detail = await (await response).json();
  expect(detail.diagnosis).toBeNull();
  await page
    .getByText("Originating diagnosis and evidence snapshot", { exact: true })
    .click();
  await expect(
    page.getByText("No diagnosis linked to this manual ticket."),
  ).toBeVisible();
});
