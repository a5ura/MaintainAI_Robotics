import { test, expect } from "@playwright/test";
import { speechMock, david, remote } from "./speechMock";
import { guideToAnalysis } from "./guidedController";
// GD-01 speech lifecycle contracts remain; progression belongs to GD-02B-1.
for (const size of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`GD01 speech controls remain isolated with six-stage navigation ${size.width}`, async ({
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
    expect(posts).toEqual([]);
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Unmute narration", exact: true }),
    ).toBeVisible();
    expect(await page.locator("progress").getAttribute("value")).toBe(progress);
    await page.getByRole("button", { name: "Pause demo", exact: true }).click();
    await page
      .getByRole("button", { name: "Unmute narration", exact: true })
      .click();
    expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(2);
    await page
      .getByRole("button", { name: "Resume demo", exact: true })
      .click();
    expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(3);
    await guideToAnalysis(page);
    const guide = page.getByRole("region", {
      name: "Guided Demo",
      exact: true,
    });
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      guide.getByRole("group", { name: "Voice narration", exact: true }),
    ).toContainText("operator verification");
    await guide
      .getByRole("button", { name: "Pause demo", exact: true })
      .click();
    const before = posts.length;
    await guide
      .getByRole("button", { name: "Replay narration", exact: true })
      .click();
    await guide
      .getByRole("button", { name: "Mute narration", exact: true })
      .click();
    await guide
      .getByRole("button", { name: "Unmute narration", exact: true })
      .click();
    expect(posts).toHaveLength(before);
    expect(posts.filter((url) => url.endsWith("/api/tickets"))).toHaveLength(0);
    expect(posts.filter((url) => url.endsWith("/api/diagnose"))).toHaveLength(
      1,
    );
    await guide.scrollIntoViewIfNeeded();
    for (const button of await guide.getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
      expect(box!.height).toBeGreaterThanOrEqual(size.width === 390 ? 44 : 40);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(size.width);
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    expect(
      await page.evaluate(() => window.__gdSpeech.spoken.at(-1)?.text),
    ).toContain("simulated robot");
    await page
      .getByRole("button", { name: "Exit walkthrough", exact: true })
      .click();
    await expect(guide).toHaveCount(0);
  });
}
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
test("GD01 denied speech, hidden tab and manual navigation cannot restart stale narration or progression", async ({
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
  await expect(
    page.getByRole("button", { name: "Resume demo", exact: true }),
  ).toBeVisible();
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
  await expect(
    page.getByRole("region", { name: "Guided Demo", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Guided Demo", exact: true }),
  ).toHaveCount(0);
});
