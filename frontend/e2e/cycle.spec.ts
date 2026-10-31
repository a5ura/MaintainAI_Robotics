import { test, expect } from "@playwright/test";
test("real normal and dropped-object cycles use FastAPI and display evidence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.locator("progress").getAttribute("value");
  await page.waitForTimeout(400);
  expect(await page.locator("progress").getAttribute("value")).toBe(paused);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Placement verified" }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByLabel("Scenario", { exact: true }).selectOption("drop");
  const response = page.waitForResponse(
    (r) => r.url().includes("/api/diagnose") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const result = await (await response).json();
  expect(result.status).toBe("detected");
  await expect(
    page.getByRole("heading", { name: "Dropped object" }),
  ).toBeVisible();
  await expect(
    page.getByText("Insufficient vacuum / seal loss", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "E6 / 6.0s" })).toBeVisible();
  const seal = page
    .locator("details")
    .filter({ hasText: "Insufficient vacuum / seal loss" });
  await seal.getByRole("link", { name: /Supports E6 at 6.0 seconds/ }).click();
  await expect(page).toHaveURL(/#evidence-E6$/);
  await expect(page.locator("#evidence-E6")).toBeFocused();
  await expect(page.locator("#evidence-E6")).toContainText("12 kPa");
  await page
    .locator("summary")
    .filter({ hasText: "Premature release command" })
    .click();
  const release = page
    .locator("details")
    .filter({ hasText: "Premature release command" });
  await expect(release).toContainText("Limited support");
  await release
    .getByRole("link", { name: /Contradicts E6 at 6.0 seconds/ })
    .click();
  await expect(page.locator("#evidence-E6")).toBeFocused();
  await expect(page.locator("#evidence-E6")).toContainText("CONSISTENT");
  await page.screenshot({
    path: "../docs/m3-regression-drop-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "../docs/m3-regression-drop-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
