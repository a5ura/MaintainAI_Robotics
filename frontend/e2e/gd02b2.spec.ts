import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { speechMock } from "./speechMock";
import { sceneProbe, expectMarkerWorld } from "./sceneProbe";
import { guideToAnalysis } from "./guidedController";
async function audit(page: Page) {
  await page.addInitScript(() => {
    const scroll = window.scrollTo.bind(window);
    const log = {
      scrolls: [] as { top: number; behavior: string }[],
      announcements: [] as string[],
    };
    Object.defineProperty(window, "__guidanceAudit", { value: log });
    window.scrollTo = ((options: ScrollToOptions) => {
      log.scrolls.push({
        top: options.top ?? window.scrollY,
        behavior: options.behavior ?? "auto",
      });
      scroll(options);
    }) as typeof window.scrollTo;
    document.addEventListener("DOMContentLoaded", () => {
      new MutationObserver((records) => {
        if (
          records.some((r) =>
            (r.target instanceof Element
              ? r.target
              : r.target.parentElement
            )?.closest("#guided-focus-description"),
          )
        )
          log.announcements.push(
            document.getElementById("guided-focus-description")?.textContent ??
              "",
          );
      }).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
  });
}
async function visibleFocus(page: Page, id: string) {
  const target = page.locator(`[data-guide-target="${id}"]`);
  await expect(target).toHaveAttribute(
    "data-guide-highlight",
    /primary|secondary/,
  );
  await expect
    .poll(
      async () => {
        const box = await target.boundingBox();
        const nav = await page
          .getByRole("navigation", { name: "Guided visual navigation" })
          .boundingBox();
        return (
          !!box &&
          !!nav &&
          box.y >= nav.y + nav.height - 2 &&
          box.y < (await page.evaluate(() => innerHeight)) - 40
        );
      },
      { timeout: 8000 },
    )
    .toBe(true);
}
for (const size of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`GD02B2 real Manual investigation and guidance at ${size.width}`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await speechMock(page);
    await sceneProbe(page);
    await audit(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
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
    const nav = page.getByRole("navigation", {
      name: "Guided visual navigation",
    });
    const guide = page.getByRole("region", {
      name: "Guided Demo",
      exact: true,
    });
    await mkdir("../docs/evidence/gd02b2", { recursive: true });
    await expect(nav).toContainText("Stage 1 / 6");
    await visibleFocus(page, "workcell");
    await page.screenshot({
      path: `../docs/evidence/gd02b2/${size.width}-workcell.png`,
    });
    const diagnosis = await (await guideToAnalysis(page)).json();
    await nav
      .getByRole("button", { name: "Show focus area", exact: true })
      .click();
    await visibleFocus(page, "fault-status");
    await expect(
      page.locator('[data-guide-target="fault-status"]'),
    ).toBeFocused();
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await visibleFocus(page, "evidence-timeline");
    await page.screenshot({
      path: `../docs/evidence/gd02b2/${size.width}-evidence.png`,
    });
    const rail = page.getByRole("group", { name: "Recorded readings" });
    for (const id of ["E6", "E5"]) {
      await rail.getByRole("button", { name: new RegExp(`^${id} ·`) }).click();
      await expectMarkerWorld(
        page,
        diagnosis.timeline.find((r: { id: string }) => r.id === id).tcp,
      );
    }
    const time = await page.locator("progress").getAttribute("value");
    await guide.getByLabel("Playback mode").selectOption("automatic");
    await guide.getByLabel("Playback mode").selectOption("manual");
    await expect(rail.getByRole("button", { name: /^E5 ·/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await nav
      .getByRole("button", { name: "Show reading inspector", exact: true })
      .click();
    await visibleFocus(page, "evidence-inspector");
    await expect(page.locator("#evidence-inspector")).toBeFocused();
    await nav
      .getByRole("button", { name: "Show workcell", exact: true })
      .click();
    await visibleFocus(page, "workcell");
    await page
      .getByRole("button", { name: "Clear Selection", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.__ui03Scene.read().markers))
      .toBe(0);
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await visibleFocus(page, "candidate-comparison");
    await guide.getByRole("button", { name: "Previous", exact: true }).click();
    await visibleFocus(page, "evidence-timeline");
    expect(await page.locator("progress").getAttribute("value")).toBe(time);
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await visibleFocus(page, "maintenance-handoff");
    await expect(guide).toContainText("No maintenance ticket has been saved");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(size.width);
    for (const button of await nav.getByRole("button").all())
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await mkdir("../docs/evidence/gd02b2", { recursive: true });
    await page.screenshot({
      path: `../docs/evidence/gd02b2/${size.width}-handoff.png`,
    });
    await guide
      .getByRole("button", { name: "Exit walkthrough", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(nav).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Start Guided Demo", exact: true }),
    ).toBeFocused();
    await expect(page.locator("[data-guide-highlight]")).toHaveCount(0);
    expect(posts.filter((url) => url.endsWith("/api/diagnose"))).toHaveLength(
      1,
    );
    expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
    expect(await (await page.request.get("/api/tickets")).json()).toEqual(
      records,
    );
    expect(errors).toEqual([]);
  });
}
test("GD02B2 Automatic guidance never steals focus or couples scrolling to telemetry", async ({
  page,
}) => {
  test.setTimeout(120000);
  await speechMock(page, []);
  await audit(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
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
  const mode = guide.getByLabel("Playback mode");
  await mode.selectOption("automatic");
  await mode.focus();
  await page.clock.runFor(4000);
  await expect(guide.getByRole("heading")).toHaveText("Robot Operation");
  const before = await page.evaluate(
    () =>
      (window as unknown as { __guidanceAudit: { announcements: string[] } })
        .__guidanceAudit.announcements.length,
  );
  await page.clock.runFor(2000);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __guidanceAudit: { announcements: string[] } })
          .__guidanceAudit.announcements.length,
    ),
  ).toBe(before);
  await page.clock.runFor(4500);
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
  await visibleFocus(page, "maintenance-handoff");
  await expect(mode).toBeFocused();
  expect(posts.filter((url) => url.endsWith("/api/diagnose"))).toHaveLength(1);
  expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as {
          __guidanceAudit: { scrolls: { behavior: string }[] };
        }
      ).__guidanceAudit.scrolls.every((s) => s.behavior === "instant"),
    ),
  ).toBe(true);
});
test("GD02B2 keyboard navigation, resize, missing targets and hidden-tab pause remain isolated", async ({
  page,
}) => {
  test.setTimeout(120000);
  await speechMock(page);
  await audit(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/");
  await page.clock.install();
  const start = page.getByRole("button", {
    name: "Start Guided Demo",
    exact: true,
  });
  for (
    let i = 0;
    i < 20 && !(await start.evaluate((el) => el === document.activeElement));
    i++
  )
    await page.keyboard.press("Tab");
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");
  const nav = page.getByRole("navigation", {
    name: "Guided visual navigation",
  });
  const controls = nav.getByRole("button", {
    name: "Walkthrough controls",
    exact: true,
  });
  await controls.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.locator('[data-guide-target="walkthrough-controls"]'),
  ).toBeFocused();
  const guide = page.getByRole("region", { name: "Guided Demo", exact: true });
  await guide.getByRole("button", { name: "Next", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.clock.runFor(1000);
  await page.evaluate(() => window.__gdSpeech.hide(true));
  const time = await page.locator("progress").getAttribute("value");
  await page.clock.runFor(5000);
  await page.evaluate(() => window.__gdSpeech.hide(false));
  await expect(
    guide.getByRole("button", { name: "Resume demo", exact: true }),
  ).toBeVisible();
  expect(await page.locator("progress").getAttribute("value")).toBe(time);
  await page.setViewportSize({ width: 390, height: 844 });
  await visibleFocus(page, "workcell");
  await nav
    .getByRole("button", { name: "Show focus area", exact: true })
    .click();
  await visibleFocus(page, "workcell");
  await page
    .locator('[data-guide-target="workcell"]')
    .evaluate((el) => el.setAttribute("hidden", ""));
  await expect(nav).toContainText("Focus area is unavailable");
  await expect(page.locator('[data-guide-highlight="primary"]')).toHaveCount(0);
  await page
    .locator('[data-guide-target="workcell"]')
    .evaluate((el) => el.removeAttribute("hidden"));
  await expect(page.locator('[data-guide-target="workcell"]')).toHaveAttribute(
    "data-guide-highlight",
    "primary",
  );
  await guide.getByRole("button", { name: "Resume demo", exact: true }).click();
  await page.clock.runFor(1000);
  expect(
    Number(await page.locator("progress").getAttribute("value")),
  ).toBeGreaterThan(Number(time));
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await expect(nav).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Diagnostics Workspace", exact: true }),
  ).toBeFocused();
  await expect(page.locator("[data-guide-highlight]")).toHaveCount(0);
  expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
});

test("GD02B2 native smooth motion is cancelled by exit and reset leaves no stale target", async ({
  page,
}) => {
  await speechMock(page);
  await audit(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  const nav = page.getByRole("navigation", {
    name: "Guided visual navigation",
  });
  await nav
    .getByRole("button", { name: "Walkthrough controls", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __guidanceAudit: { scrolls: { behavior: string }[] };
            }
          ).__guidanceAudit.scrolls.filter((s) => s.behavior === "smooth")
            .length,
      ),
    )
    .toBeGreaterThan(0);
  await page.evaluate(() =>
    window.dispatchEvent(new PopStateEvent("popstate")),
  );
  await expect(nav).toHaveCount(0);
  await expect(page.locator("[data-guide-highlight]")).toHaveCount(0);
  const scrolls = await page.evaluate(
    () =>
      (
        window as unknown as {
          __guidanceAudit: { scrolls: { behavior: string }[] };
        }
      ).__guidanceAudit.scrolls,
  );
  expect(scrolls.some((s) => s.behavior === "instant")).toBe(true);
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  const guide = page.getByRole("region", { name: "Guided Demo", exact: true });
  await guide.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.locator('[data-guide-highlight="primary"]')).toHaveCount(1);
  await expect(page.locator('[data-guide-target="workcell"]')).toHaveAttribute(
    "data-guide-highlight",
    "primary",
  );
  expect(posts).toEqual([]);
});
