import { expect, type Page } from "@playwright/test";
const clocks = new WeakSet<Page>();
// Exercise the existing simulation timer; never seek time or fabricate a result.
// For tests starting in Introduction, not a substitute controller implementation.
export async function guideToAnalysis(page: Page) {
  if (!clocks.has(page)) {
    await page.clock.install();
    clocks.add(page);
  }
  const guide = page.getByRole("region", { name: "Guided Demo", exact: true });
  const resume = guide.getByRole("button", {
    name: "Resume demo",
    exact: true,
  });
  if (await resume.count()) await resume.click();
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
  );
  await guide.getByRole("button", { name: "Next", exact: true }).click();
  await page.clock.runFor(6500);
  await expect(
    guide.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
  await guide.getByRole("button", { name: "Next", exact: true }).click();
  await page.clock.runFor(6500);
  return response;
}
