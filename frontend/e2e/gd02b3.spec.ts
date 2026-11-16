import { test, expect, type Page } from "@playwright/test";
import { speechMock } from "./speechMock";
import { guideToAnalysis } from "./guidedController";
async function aligned(page: Page, title: string, words: string) {
  const guide = page.getByRole("region", { name: "Guided Demo", exact: true });
  await expect(guide.getByRole("heading")).toHaveText(title);
  await expect(
    page.getByRole("navigation", { name: "Guided visual navigation" }),
  ).toContainText(title);
  await expect
    .poll(() => page.evaluate(() => window.__gdSpeech.active?.text ?? ""))
    .toContain(words);
  const text = await page.evaluate(() => window.__gdSpeech.active!.text);
  await expect(guide.locator(".narration-text")).toContainText(text);
}
for (const size of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`GD02B3 narration follows real Manual stages and remains presentation-only at ${size.width}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await speechMock(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(size);
    const posts: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url());
    });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Start Guided Demo", exact: true })
      .click();
    const guide = page.getByRole("region", {
      name: "Guided Demo",
      exact: true,
    });
    await aligned(page, "Introduction", "MaintainAI Robotics");
    const result = await (await guideToAnalysis(page)).json();
    await aligned(page, "Fault Detection", result.summary);
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await aligned(
      page,
      "Evidence Investigation",
      "historical tool center point",
    );
    const time = await page.locator("progress").getAttribute("value");
    await page
      .getByRole("group", { name: "Recorded readings" })
      .getByRole("button", { name: /^E6 ·/ })
      .click();
    await page
      .getByRole("button", { name: "Clear Selection", exact: true })
      .click();
    await expect(page.getByTestId("historical-marker")).toHaveCount(0);
    const area = await page
      .locator('[data-guide-highlight="primary"]')
      .getAttribute("data-guide-target");
    const count = posts.length;
    await guide
      .getByRole("button", { name: "Replay narration", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      guide.getByRole("button", { name: "Replay narration", exact: true }),
    ).toBeFocused();
    expect(
      await page
        .locator('[data-guide-highlight="primary"]')
        .getAttribute("data-guide-target"),
    ).toBe(area);
    expect(posts).toHaveLength(count);
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await aligned(
      page,
      "Diagnosis and Next Checks",
      result.hypotheses[0].cause,
    );
    await guide.getByRole("button", { name: "Previous", exact: true }).click();
    await aligned(page, "Evidence Investigation", "recorded reading");
    expect(await page.locator("progress").getAttribute("value")).toBe(time);
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await guide.getByRole("button", { name: "Next", exact: true }).click();
    await aligned(
      page,
      "Maintenance Handoff",
      "No maintenance ticket has been saved",
    );
    await page.evaluate(() => window.__gdSpeech.hide(true));
    await expect(
      guide.getByRole("button", { name: "Resume demo", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.__gdSpeech.hide(false));
    expect(await page.evaluate(() => window.__gdSpeech.active)).toBeNull();
    await guide
      .getByRole("button", { name: "Resume demo", exact: true })
      .click();
    await aligned(page, "Maintenance Handoff", "No maintenance ticket");
    expect(posts.filter((p) => p.endsWith("/api/diagnose"))).toHaveLength(1);
    expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(0);
  });
}
test("GD02B3 Automatic preempts unfinished speech and missing voices never block progression", async ({
  page,
}) => {
  test.setTimeout(120000);
  await speechMock(page);
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
  await guide.getByLabel("Playback mode").selectOption("automatic");
  await page.evaluate(() => {
    const s = window.__gdSpeech.active!;
    const oldError = s.onerror!;
    (
      window as unknown as { __oldNarrationError: () => void }
    ).__oldNarrationError = () =>
      oldError.call(s, {
        error: "synthesis-failed",
      } as SpeechSynthesisErrorEvent);
  });
  // Mock utterances never finish: advancement therefore proves speech is not a gate.
  await page.clock.runFor(4000);
  await aligned(page, "Robot Operation", "deterministic trajectory");
  await page.evaluate(() =>
    (
      window as unknown as { __oldNarrationError: () => void }
    ).__oldNarrationError(),
  );
  await expect(guide.locator(".narration-status")).toContainText(
    "Narration speaking",
  );
  await page.evaluate(() => window.__gdSpeech.setVoices([]));
  await expect(
    guide.getByRole("group", { name: "Voice narration" }),
  ).toContainText("Text-only");
  await page.clock.runFor(6500);
  await page.clock.runFor(4000);
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
  await expect(guide.locator(".narration-text")).toContainText(
    "No maintenance ticket has been saved",
  );
  expect(posts.filter((p) => p.endsWith("/api/diagnose"))).toHaveLength(1);
  expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(0);
});
