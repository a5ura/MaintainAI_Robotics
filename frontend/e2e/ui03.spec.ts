import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { speechMock } from "./speechMock";
import { workcellProbe } from "./workcellProbe";
import { resolveScenario } from "../src/scenarios";
import type { Diagnosis } from "../src/model";
const directory = "../docs/evidence/ui03";
for (const size of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`UI03 investigation across six scenarios at ${size.width}`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await speechMock(page);
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible();
    await page.clock.install();
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/")) requests.push(r.method() + r.url());
    });
    await mkdir(directory, { recursive: true });
    const results = [];
    for (const selection of [
      "normal",
      "drop",
      "position",
      "vision",
      "stop",
      "random",
    ] as const) {
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await page
        .getByLabel("Scenario", { exact: true })
        .selectOption(selection);
      await page.getByLabel("Reproducible seed").fill("42");
      const response = page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.clock.runFor(13000);
      const data: Diagnosis = await (await response).json();
      const reading = data.timeline.find((r) => r.id === "E6")!;
      await expect(
        page
          .getByRole("region", { name: "Candidate comparison" })
          .locator("details > summary"),
      ).toHaveText(data.hypotheses.map((h) => h.cause));
      await page
        .getByRole("button", { name: "Inspection", exact: true })
        .click();
      const progress = await page.locator("progress").getAttribute("value"),
        tcp = await page.locator(".tcp").innerText(),
        requestCount = requests.length;
      const speech = await page.evaluate(() => ({
        count: window.__gdSpeech.spoken.length,
        cancellations: window.__gdSpeech.cancellations,
      }));
      if (selection === "drop") {
        await page
          .getByRole("region", { name: "Investigation summary", exact: true })
          .getByRole("link", { name: /Observation E6 at/ })
          .click();
        await expect(page).toHaveURL(/#evidence-E6$/);
        await expect(page.locator("#evidence-E6")).toBeFocused();
      } else {
        const button = page
          .getByRole("group", { name: "Recorded readings" })
          .getByRole("button", { name: /^E6 ·/ });
        await button.focus();
        await page.keyboard.press("Enter");
        await expect(button).toBeFocused();
      }
      const inspector = page.getByRole("region", {
        name: "Evidence inspector",
      });
      await page
        .getByRole("button", { name: "Inspect selected reading", exact: true })
        .click();
      await expect(inspector).toBeFocused();
      await expect(inspector).toContainText("Historical E6 · 6.0s");
      await expect(inspector).toContainText("Recorded joints");
      await expect(page.getByTestId("historical-marker")).toHaveAttribute(
        "data-position",
        reading.tcp.join(","),
      );
      expect(await page.locator("progress").getAttribute("value")).toBe(
        progress,
      );
      expect(await page.locator(".tcp").innerText()).toBe(tcp);
      await expect(page.getByTestId("workcell-stage")).toHaveAttribute(
        "data-view",
        "inspection",
      );
      expect(requests.length).toBe(requestCount);
      // Native hash navigation retains its established narration stop; reading buttons are pure selection.
      if (selection !== "drop")
        expect(
          await page.evaluate(() => ({
            count: window.__gdSpeech.spoken.length,
            cancellations: window.__gdSpeech.cancellations,
          })),
        ).toEqual(speech);
      if (selection === "drop") {
        const contrary = page
          .getByRole("region", { name: "Candidate comparison" })
          .getByRole("link", { name: /Contradicts E6 at/ })
          .first();
        await contrary.click();
        await expect(inspector).toContainText("Historical E6");
        await page
          .getByRole("button", { name: "View historical marker in workcell" })
          .click();
        await page.evaluate(() => scrollTo(0, 0));
        await page.clock.runFor(50);
        await page.screenshot({
          path: `${directory}/${size.width}-historical.png`,
        });
        await inspector.screenshot({
          path: `${directory}/${size.width}-inspector.png`,
        });
        if (size.width === 1366)
          await page
            .getByRole("region", { name: "Candidate comparison" })
            .screenshot({ path: `${directory}/candidate-comparison.png` });
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(size.width);
      results.push({
        selection,
        resolved: resolveScenario(selection, 42),
        diagnosis: data.id,
        selected: reading.id,
        recordedTCP: reading.tcp,
        status: data.status,
      });
    }
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByTestId("historical-marker")).toHaveCount(0);
    await page.getByLabel("Scenario", { exact: true }).selectOption("normal");
    await page.getByLabel("Reproducible seed").fill("7");
    await expect(page.getByTestId("historical-marker")).toHaveCount(0);
    await writeFile(
      `${directory}/${size.width}-matrix.json`,
      JSON.stringify(results, null, 2),
    );
  });
}

test("UI03 paused guide selection draws and releases a historical marker without domain side effects", async ({
  page,
}) => {
  await speechMock(page);
  await workcellProbe(page);
  const requests: string[] = [],
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/api/")) requests.push(r.method() + r.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip to Results", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dropped object", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Replay narration", exact: true })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(() => window.__ui02GPU.read().renderer?.drawCalls ?? 0),
      { timeout: 8000 },
    )
    .toBeGreaterThan(0);
  const before = await page.evaluate(() => window.__ui02GPU.read());
  const snapshot = {
    time: await page.locator("progress").getAttribute("value"),
    tcp: await page.locator(".tcp").innerText(),
    guide: await page.locator(".guided-banner .eyebrow").innerText(),
    speech: await page.evaluate(() => ({
      count: window.__gdSpeech.spoken.length,
      cancellations: window.__gdSpeech.cancellations,
    })),
    requests: [...requests],
  };
  await page
    .getByRole("group", { name: "Recorded readings" })
    .getByRole("button", { name: /^E6 ·/ })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate((previous) => {
          const current = window.__ui02GPU.read();
          return (
            !!current.renderer &&
            current.renderer.drawCalls > previous.renderer!.drawCalls &&
            current.liveBuffers > previous.liveBuffers
          );
        }, before),
      { timeout: 8000 },
    )
    .toBe(true);
  const selected = await page.evaluate(() => window.__ui02GPU.read());
  expect(selected.liveBuffers).toBeGreaterThan(before.liveBuffers);
  await page
    .getByRole("group", { name: "Recorded readings" })
    .getByRole("button", { name: /^E5 ·/ })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(() => window.__ui02GPU.read().renderer?.drawCalls ?? 0),
      { timeout: 8000 },
    )
    .toBeGreaterThan(selected.renderer!.drawCalls);
  expect(
    (await page.evaluate(() => window.__ui02GPU.read())).createdBuffers,
  ).toBe(selected.createdBuffers);
  expect(await page.locator("progress").getAttribute("value")).toBe(
    snapshot.time,
  );
  expect(await page.locator(".tcp").innerText()).toBe(snapshot.tcp);
  expect(await page.locator(".guided-banner .eyebrow").innerText()).toBe(
    snapshot.guide,
  );
  expect(
    await page.evaluate(() => ({
      count: window.__gdSpeech.spoken.length,
      cancellations: window.__gdSpeech.cancellations,
    })),
  ).toEqual(snapshot.speech);
  expect(requests).toEqual(snapshot.requests);
  await page.evaluate(() => window.__ui02GPU.lose());
  await expect(
    page.getByText(
      "3D context lost. Simulation and evidence remain available.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reload 3D view", exact: true })
    .click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate((previous) => {
          const r = window.__ui02GPU.read().renderer;
          return (
            !!r &&
            r.id > previous.id &&
            r.drawCalls > 0 &&
            r.liveBuffers === previous.liveBuffers
          );
        }, selected.renderer!),
      { timeout: 8000 },
    )
    .toBe(true);
  await expect(page.getByTestId("historical-marker")).toContainText(
    "Historical E5",
  );
  expect(await page.locator("progress").getAttribute("value")).toBe(
    snapshot.time,
  );
  expect(requests).toEqual(snapshot.requests);
  expect(
    await page.evaluate(() => ({
      count: window.__gdSpeech.spoken.length,
      cancellations: window.__gdSpeech.cancellations,
    })),
  ).toEqual(snapshot.speech);
  await page.getByRole("button", { name: "Clear evidence selection" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__ui02GPU.read().liveBuffers), {
      timeout: 8000,
    })
    .toBe(before.liveBuffers);
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Evidence inspector" }),
  ).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.__ui02GPU.read().liveBuffers), {
      timeout: 8000,
    })
    .toBe(0);
  expect(errors).toEqual([]);
  await mkdir(directory, { recursive: true });
  await writeFile(
    `${directory}/resources.json`,
    JSON.stringify(
      {
        environment: "Cloud Chromium/software WebGL, not Windows GPU/FPS",
        before,
        selected,
        released: await page.evaluate(() => window.__ui02GPU.read()),
        errors,
      },
      null,
      2,
    ),
  );
});

test("UI03 invalid backend FK suppresses spatial highlighting but keeps complete evidence", async ({
  page,
}) => {
  await page.route("**/api/diagnose", async (route) => {
    const payload = route.request().postDataJSON();
    payload.samples.find((s: { t: number }) => s.t === 6).tcp = [999, 999, 999];
    const response = await route.fetch({ postData: JSON.stringify(payload) });
    await route.fulfill({ response });
  });
  await page.goto("/");
  await page.clock.install();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.clock.runFor(13000);
  await page
    .getByRole("group", { name: "Recorded readings" })
    .getByRole("button", { name: /^E6 ·/ })
    .click();
  const inspector = page.getByRole("region", { name: "Evidence inspector" });
  await expect(inspector).toContainText("INCONSISTENT");
  await expect(inspector).toContainText("Spatial highlighting unavailable");
  await expect(page.getByTestId("historical-marker")).toHaveAttribute(
    "data-position",
    "unavailable",
  );
  await expect(inspector).toContainText("999.000 / 999.000 / 999.000");
});

test("UI03 WebGL unavailable retains selectable evidence and text inspector", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: unknown[]) {
      return args[0] === "webgl2" ? null : Reflect.apply(original, this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByText(
      "3D rendering unavailable. Simulation and evidence controls remain available.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.clock.install();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.clock.runFor(13000);
  await page
    .getByRole("group", { name: "Recorded readings" })
    .getByRole("button", { name: /^E6 ·/ })
    .click();
  await expect(
    page.getByRole("region", { name: "Evidence inspector" }),
  ).toContainText("Historical E6");
  await expect(page.getByTestId("historical-marker")).toContainText(
    "Spatial highlighting unavailable",
  );
  await expect(page.locator("canvas")).toHaveCount(0);
});
