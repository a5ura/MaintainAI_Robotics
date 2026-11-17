import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { speechMock } from "./speechMock";
import { guideToAnalysis } from "./guidedController";
const output = process.env.GD02C1_EVIDENCE_DIR ?? "../docs/evidence/gd02c1";
const guide = (page: Page) =>
  page.getByRole("region", { name: "Guided Demo", exact: true });
async function aligned(page: Page, words: string) {
  const cue = (
    await guide(page).locator(".narration-text").innerText()
  ).replace(/^Narration text:\s*/, "");
  const nav = page.getByRole("navigation", {
    name: "Guided visual navigation",
  });
  await expect(nav.locator(".guide-navigation-copy > p").first()).toHaveText(
    cue,
  );
  await expect(nav).toContainText(words);
  await expect(page.locator("#guided-focus-description")).toContainText(cue);
  await expect(nav).not.toContainText("future confirmation");
}
async function stage6(page: Page) {
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await guideToAnalysis(page);
  for (const title of [
    "Evidence Investigation",
    "Diagnosis and Next Checks",
    "Maintenance Handoff",
  ]) {
    await guide(page)
      .getByRole("button", { name: "Next", exact: true })
      .click();
    await expect(guide(page).getByRole("heading")).toHaveText(title);
  }
}
for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`GD02C1 discoverable walkthrough, manual takeover and accurate saved guidance at ${viewport.width}`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    await speechMock(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    const posts: string[] = [],
      errors: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    await page.clock.install();
    await guide(page)
      .getByRole("button", { name: "Next", exact: true })
      .click();
    await page.clock.runFor(6500);
    const time = Number(await page.locator("progress").getAttribute("value"));
    const nav = page.getByRole("navigation", {
      name: "Guided visual navigation",
    });
    await expect(nav).toContainText(
      "Use Next / Previous in Walkthrough controls",
    );
    const reveal = nav.getByRole("button", {
      name: "Walkthrough controls",
      exact: true,
    });
    await expect(reveal).toHaveClass(/primary/);
    await reveal.focus();
    await page.keyboard.press("Enter");
    await expect(guide(page).getByRole("heading")).toBeFocused();
    const next = guide(page).getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeEnabled();
    await expect(next).toHaveClass(/primary/);
    const manual = page.getByRole("button", {
      name: "Start manually (exit walkthrough)",
      exact: true,
    });
    await expect(manual).not.toHaveClass(/primary/);
    await page
      .getByRole("button", { name: "Show focus area", exact: true })
      .click();
    await mkdir(output, { recursive: true });
    await page.screenshot({
      path: `${output}/${viewport.width}-manual-vs-guide.png`,
    });
    await manual.focus();
    await page.keyboard.press("Enter");
    await expect(guide(page)).toHaveCount(0);
    await page.clock.runFor(500);
    expect(
      Number(await page.locator("progress").getAttribute("value")),
    ).toBeGreaterThan(time);
    expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(0);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await stage6(page);
    await aligned(page, "only explicit confirmation");
    const panel = page.getByRole("region", {
      name: "Maintenance handoff preview",
    });
    const create = panel.getByRole("button", {
      name: "Create maintenance ticket",
      exact: true,
    });
    await page
      .getByRole("button", { name: "Show focus area", exact: true })
      .click();
    await page.screenshot({
      path: `${output}/${viewport.width}-handoff-preview.png`,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
    await create.click();
    await page.keyboard.press("Escape");
    await expect(create).toBeFocused();
    await create.click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(0);
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/tickets", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const response = await route.fetch();
      await held;
      await route.fulfill({ response });
    });
    try {
      await create.click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Confirm ticket creation", exact: true })
        .click();
      await aligned(page, "Persistence has not yet been confirmed");
      release();
      await expect(panel).toContainText("Ticket saved:");
      const id = (
        await panel.getByRole("status").locator("strong").innerText()
      ).replace("Ticket saved: ", "");
      await aligned(page, `backend confirmed maintenance ticket ${id}`);
      expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(1);
      const record = await (
        await page.request.get(`/api/tickets/${id}`)
      ).json();
      expect(
        record.history.filter((h: { kind: string }) => h.kind === "created"),
      ).toHaveLength(1);
      await page
        .getByRole("button", { name: "Show focus area", exact: true })
        .click();
      await page.screenshot({
        path: `${output}/${viewport.width}-handoff-saved.png`,
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(viewport.width);
      expect(errors).toEqual([]);
    } finally {
      release();
    }
  });
}

test("GD02C1 rejected and committed-but-lost guidance matches narration; explicit reconciliation preserves identity", async ({
  page,
}) => {
  test.setTimeout(120000);
  await speechMock(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const bodies: string[] = [];
  let id = "";
  await page.route("**/api/tickets", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    bodies.push(route.request().postData()!);
    if (bodies.length === 1)
      await route.fulfill({
        status: 403,
        json: { detail: "Synthetic read-only policy rejection" },
      });
    else if (bodies.length === 2) {
      const response = await route.fetch();
      id = (await response.json()).ticket.id;
      await route.abort("failed");
    } else await route.continue();
  });
  await page.goto("/");
  await stage6(page);
  const panel = page.getByRole("region", {
    name: "Maintenance handoff preview",
  });
  await panel
    .getByRole("button", { name: "Create maintenance ticket", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm ticket creation", exact: true })
    .click();
  await expect(panel).toContainText("Server rejected this request");
  await aligned(page, "server rejected the confirmed request");
  await mkdir(output, { recursive: true });
  await page
    .getByRole("button", { name: "Show focus area", exact: true })
    .click();
  await page.screenshot({ path: `${output}/rejected.png` });
  await panel
    .getByRole("button", { name: "Review confirmed request", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reconcile confirmed attempt", exact: true })
    .click();
  await expect(panel).toContainText("Uncertain outcome");
  await aligned(page, "ticket may already have been saved");
  await expect(
    panel.getByRole("button", {
      name: "Create maintenance ticket",
      exact: true,
    }),
  ).toBeDisabled();
  expect(bodies).toHaveLength(2);
  await page
    .getByRole("button", { name: "Show focus area", exact: true })
    .click();
  await page.screenshot({ path: `${output}/uncertain.png` });
  await panel
    .getByRole("button", { name: "Review confirmed request", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reconcile confirmed attempt", exact: true })
    .click();
  await expect(panel).toContainText(`Ticket saved: ${id}`);
  await aligned(page, `backend confirmed maintenance ticket ${id}`);
  expect(bodies).toHaveLength(3);
  expect(bodies[1]).toBe(bodies[0]);
  expect(bodies[2]).toBe(bodies[0]);
  const saved = await (await page.request.get(`/api/tickets/${id}`)).json();
  expect(
    saved.history.filter((h: { kind: string }) => h.kind === "created"),
  ).toHaveLength(1);
});
