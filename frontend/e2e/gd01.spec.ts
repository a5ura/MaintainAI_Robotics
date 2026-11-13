import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { speechMock, david, remote } from "./speechMock";

for (const size of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`GD01 controls remain independent and responsive ${size.width}`, async ({
    page,
  }) => {
    await speechMock(page);
    await page.setViewportSize(size);
    const posts: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url());
    });
    await page.goto("/");
    expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(0);
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.__gdSpeech.spoken.length))
      .toBe(1);
    expect(
      await page.evaluate(() => window.__gdSpeech.spoken[0].voice?.name),
    ).toContain("Microsoft David");
    await page.getByRole("button", { name: "Pause demo", exact: true }).click();
    const progress = await page.locator("progress").getAttribute("value");
    await page
      .getByRole("button", { name: "Replay narration", exact: true })
      .click();
    expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(2);
    await page
      .getByRole("button", { name: "Mute narration", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Replay narration", exact: true }),
    ).toBeDisabled();
    await page.waitForTimeout(150);
    expect(await page.locator("progress").getAttribute("value")).toBe(progress);
    expect(posts).toEqual([]);
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Unmute narration", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(2);
    await page.getByRole("button", { name: "Pause demo", exact: true }).click();
    await page
      .getByRole("button", { name: "Unmute narration", exact: true })
      .click();
    expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(2);
    await page
      .getByRole("button", { name: "Resume demo", exact: true })
      .click();
    expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(3);
    await page
      .getByRole("button", { name: "Skip to Results", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Dropped object", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Pause demo", exact: true }).click();
    await expect(
      page.getByRole("group", { name: "Voice narration", exact: true }),
    ).toContainText("operator verification");
    const controls = page.getByRole("group", {
      name: "Voice narration",
      exact: true,
    });
    await controls.getByRole("button", { name: "Replay narration" }).click();
    await controls.getByRole("button", { name: "Mute narration" }).click();
    await controls.getByRole("button", { name: "Unmute narration" }).click();
    expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
    expect(posts.filter((url) => url.endsWith("/api/diagnose"))).toHaveLength(
      1,
    );
    const dir = "../docs/evidence/gd01";
    await mkdir(dir, { recursive: true });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/${size.width}-viewport.png` });
    await page.screenshot({
      path: `${dir}/${size.width}-full.png`,
      fullPage: true,
    });
    await controls.scrollIntoViewIfNeeded();
    const boxes = [];
    for (const button of await controls.getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
      expect(box!.height).toBeGreaterThanOrEqual(size.width === 390 ? 44 : 40);
      boxes.push(box);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(size.width);
    await page.screenshot({ path: `${dir}/${size.width}-controls.png` });
    await writeFile(
      `${dir}/${size.width}-geometry.json`,
      JSON.stringify({ viewport: size, buttons: boxes }, null, 2),
    );
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    expect(
      await page.evaluate(() => window.__gdSpeech.spoken.at(-1)?.text),
    ).toContain("simulated robot");
    await page
      .getByRole("button", { name: "Take Manual Control", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Guided Demo", exact: true }),
    ).toHaveCount(0);
    expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
  });
}

test("GD01 real cycle and automatic save survive completion handoff", async ({
  page,
}) => {
  test.setTimeout(60000);
  await speechMock(page);
  const posts: { url: string; body: Record<string, unknown> }[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST")
      posts.push({ url: r.url(), body: r.postDataJSON() });
  });
  await page.goto("/");
  const saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/tickets") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.__gdSpeech.spoken.some((s) =>
            s.text.includes("presence is lost"),
          ),
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  await expect(
    page.getByRole("region", { name: "Guided Demo", exact: true }),
  ).toContainText("Connect the observations", { timeout: 20000 });
  await page
    .getByRole("button", { name: "Replay narration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mute narration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unmute narration", exact: true })
    .click();
  const detail = await (await saved).json();
  await expect(
    page.getByRole("region", { name: "Ticket details", exact: true }),
  ).toContainText(detail.ticket.id);
  await expect
    .poll(() => page.evaluate(() => window.__gdSpeech.active?.text))
    .toContain("technician review");
  expect(
    await page.evaluate(
      () =>
        window.__gdSpeech.spoken.filter((s) =>
          s.text.includes("technician review"),
        ).length,
    ),
  ).toBe(1);
  const before = posts.length;
  await page
    .getByRole("button", { name: "Replay narration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mute narration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unmute narration", exact: true })
    .click();
  expect(posts).toHaveLength(before);
  const tickets = posts.filter((p) => p.url.endsWith("/api/tickets"));
  expect(tickets).toHaveLength(1);
  expect(tickets[0].body.request_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(tickets[0].body.diagnosis_id).toBe(detail.diagnosis.id);
  expect(posts.filter((p) => p.url.endsWith("/api/diagnose"))).toHaveLength(1);
});
for (const voices of [[], [remote]]) {
  test(`GD01 ${voices.length ? "remote-only" : "missing"} voices fall back and recover after discovery`, async ({
    page,
  }) => {
    await speechMock(page, voices);
    await page.goto("/");
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    await expect(
      page.getByRole("group", { name: "Voice narration", exact: true }),
    ).toContainText("Text-only");
    expect(await page.evaluate(() => window.__gdSpeech.spoken)).toEqual([]);
    await page.getByRole("button", { name: "Pause demo", exact: true }).click();
    await page.evaluate((voice) => window.__gdSpeech.setVoices([voice]), david);
    expect(await page.evaluate(() => window.__gdSpeech.spoken)).toEqual([]);
    await page
      .getByRole("button", { name: "Replay narration", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => window.__gdSpeech.spoken[0].voice?.localService,
      ),
    ).toBe(true);
  });
}

test("GD01 denied speech, hidden tab and manual navigation never restart stale narration", async ({
  page,
}) => {
  await speechMock(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await page.evaluate(() => window.__gdSpeech.fail("not-allowed"));
  await expect(
    page.getByRole("group", { name: "Voice narration", exact: true }),
  ).toContainText("Use Replay to retry");
  await page
    .getByRole("button", { name: "Replay narration", exact: true })
    .click();
  const count = await page.evaluate(() => window.__gdSpeech.spoken.length);
  await page.evaluate(() => {
    window.__gdSpeech.hide(true);
    window.__gdSpeech.hide(false);
    window.__gdSpeech.setVoices(window.__gdSpeech.voices);
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(
    count,
  );
  await page
    .getByRole("button", { name: "Replay narration", exact: true })
    .click();
  expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(
    count + 1,
  );
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  expect(await page.evaluate(() => window.__gdSpeech.active)).toBeNull();
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Guided Demo", exact: true }),
  ).toHaveCount(0);
});
