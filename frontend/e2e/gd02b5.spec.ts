import { test, expect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { speechMock } from "./speechMock";
import { guideToAnalysis } from "./guidedController";
import { sceneProbe, expectMarkerWorld } from "./sceneProbe";
import { workcellProbe } from "./workcellProbe";

const output = process.env.GD02B5_EVIDENCE_DIR ?? "../docs/evidence/gd02b5";
const titles = [
  "Introduction",
  "Robot Operation",
  "Fault Detection",
  "Evidence Investigation",
  "Diagnosis and Next Checks",
  "Maintenance Handoff",
];
const targets = [
  "workcell",
  "workcell",
  "fault-status",
  "evidence-timeline",
  "candidate-comparison",
  "maintenance-handoff",
];
const guide = (page: Page) =>
  page.getByRole("region", { name: "Guided Demo", exact: true });
async function save(name: string, value: unknown) {
  await mkdir(output, { recursive: true });
  await writeFile(join(output, name), JSON.stringify(value, null, 2) + "\n");
}
async function keyboard(page: Page, name: string) {
  const before = await guide(page).getByRole("heading").innerText();
  const button = guide(page).getByRole("button", { name, exact: true });
  await expect(button).toBeEnabled();
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  if (name === "Next" || name === "Previous")
    await expect(guide(page).getByRole("heading")).not.toHaveText(before);
}
async function start(page: Page) {
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
}
for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`GD02B5 six-stage screenshots, evidence and keyboard dialog at ${viewport.width}`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await speechMock(page);
    await sceneProbe(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    const errors: string[] = [],
      posts: string[] = [],
      samples: unknown[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url());
    });
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    await start(page);
    await expect(guide(page).getByLabel("Playback mode")).toHaveValue("manual");
    await page.clock.install();
    async function capture(stage: number) {
      await expect(guide(page).getByRole("heading")).toHaveText(titles[stage]);
      const nav = page.getByRole("navigation", {
        name: "Guided visual navigation",
      });
      await expect(nav).toContainText(titles[stage]);
      await nav
        .getByRole("button", { name: "Show focus area", exact: true })
        .click();
      const target = page.locator(`[data-guide-target="${targets[stage]}"]`);
      await expect(target).toHaveAttribute("data-guide-highlight", "primary");
      await expect(target).toBeFocused();
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(dimensions.document).toBe(dimensions.width);
      for (const button of await nav.getByRole("button").all())
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      const focus = await target.evaluate((el) => ({
        outline: getComputedStyle(el).outlineStyle,
        color: getComputedStyle(el).outlineColor,
      }));
      expect(focus.outline).not.toBe("none");
      await page.screenshot({
        path: join(output, `${viewport.width}-stage-${stage + 1}.png`),
      });
      samples.push({
        stage: stage + 1,
        title: titles[stage],
        target: targets[stage],
        navigationText: await nav.innerText(),
        dimensions,
        focus,
        simulationTime: await page.locator("progress").getAttribute("value"),
      });
    }
    await mkdir(output, { recursive: true });
    await capture(0);
    await keyboard(page, "Next");
    await page.clock.runFor(3000);
    await capture(1);
    await expect(
      guide(page).getByRole("button", { name: "Next", exact: true }),
    ).toBeDisabled();
    await page.clock.runFor(3500);
    await expect(guide(page)).toContainText("symptom");
    await keyboard(page, "Next");
    await capture(2);
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
    );
    await page.clock.runFor(6500);
    const result = await (await response).json();
    await keyboard(page, "Next");
    await capture(3);
    const time = await page.locator("progress").getAttribute("value");
    await page
      .getByRole("group", { name: "Recorded readings" })
      .getByRole("button", { name: /^E6 ·/ })
      .click();
    await expectMarkerWorld(
      page,
      result.timeline.find((r: { id: string }) => r.id === "E6").tcp,
    );
    await expect(page.getByTestId("historical-marker")).toContainText(
      "Historical",
    );
    await page
      .getByRole("button", { name: "Clear Selection", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.__ui03Scene.read().markers))
      .toBe(0);
    await keyboard(page, "Next");
    await capture(4);
    const comparison = page.getByRole("region", {
      name: "Candidate comparison",
      exact: true,
    });
    await expect(comparison.locator("summary")).toHaveText(
      result.hypotheses.map((h: { cause: string }) => h.cause),
    );
    for (const [i, h] of result.hypotheses.entries()) {
      const card = comparison.locator("details").nth(i);
      await expect(card).toContainText(h.check);
      for (const id of h.support)
        await expect(
          card.getByRole("link", { name: new RegExp(`^Supports ${id} at `) }),
        ).toBeAttached();
      for (const id of h.contradiction)
        await expect(
          card.getByRole("link", {
            name: new RegExp(`^Contradicts ${id} at `),
          }),
        ).toBeAttached();
    }
    await keyboard(page, "Previous");
    expect(await page.locator("progress").getAttribute("value")).toBe(time);
    await keyboard(page, "Next");
    await keyboard(page, "Next");
    await capture(5);
    const panel = page.getByRole("region", {
      name: "Maintenance handoff preview",
      exact: true,
    });
    await expect(panel).toContainText(result.id);
    await expect(panel).toContainText(result.summary);
    const create = panel.getByRole("button", {
      name: "Create maintenance ticket",
      exact: true,
    });
    await create.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    const confirm = dialog.getByRole("button", {
      name: "Confirm ticket creation",
      exact: true,
    });
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirm).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    const focusAtBoundary = await dialog.evaluate((el) => ({
      contained: el.contains(document.activeElement),
      activeTag: document.activeElement?.tagName,
      activeText: document.activeElement?.textContent?.slice(0, 100),
      documentFocused: document.hasFocus(),
      modal: el.matches(":modal"),
    }));
    await save(`${viewport.width}-focus-boundary.json`, focusAtBoundary);
    await page.screenshot({
      path: join(output, `${viewport.width}-confirmation.png`),
    });
    if (!focusAtBoundary.contained) {
      // Native Chromium may transfer focus to browser chrome, never page controls.
      expect(focusAtBoundary.activeTag).toBe("BODY");
      expect(focusAtBoundary.documentFocused).toBe(false);
      expect(focusAtBoundary.modal).toBe(true);
      await page.keyboard.press("Tab");
      await expect(cancel).toBeFocused();
    }
    await cancel.focus();
    await page.keyboard.press("Tab");
    await expect(confirm).toBeFocused();
    await page.keyboard.press("Tab");
    const forwardBoundary = await dialog.evaluate((el) => ({
      contained: el.contains(document.activeElement),
      activeTag: document.activeElement?.tagName,
      documentFocused: document.hasFocus(),
      modal: el.matches(":modal"),
    }));
    if (forwardBoundary.documentFocused)
      expect(forwardBoundary.contained).toBe(true);
    else {
      expect(forwardBoundary.activeTag).toBe("BODY");
      expect(forwardBoundary.modal).toBe(true);
    }
    await cancel.focus();
    await page.evaluate(() =>
      document.querySelector<HTMLButtonElement>("header button")?.focus(),
    );
    await expect(cancel).toBeFocused();
    for (const button of [cancel, confirm])
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const bounds = await dialog.evaluate((el) => ({
      content: el.scrollWidth,
      client: el.clientWidth,
      left: el.getBoundingClientRect().left,
      right: el.getBoundingClientRect().right,
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(bounds.content).toBeLessThanOrEqual(bounds.client);
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(viewport.width);
    expect(bounds.document).toBe(viewport.width);
    await page.screenshot({
      path: join(output, `${viewport.width}-confirmation.png`),
    });
    await page.keyboard.press("Escape");
    await expect(create).toBeFocused();
    await create.click();
    await cancel.click();
    await expect(create).toBeFocused();
    expect(posts.filter((p) => p.endsWith("/api/diagnose"))).toHaveLength(1);
    expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(0);
    expect(errors).toEqual([]);
    await save(`${viewport.width}-acceptance.json`, {
      viewport,
      samples,
      bounds,
      focusAtBoundary,
      forwardBoundary,
      diagnosisId: result.id,
      postCounts: { diagnosis: 1, tickets: 0 },
      pageErrors: errors,
    });
  });
}

test("GD02B5 measured real-clock Manual walkthrough with explicit persisted handoff", async ({
  page,
}) => {
  test.setTimeout(180000);
  await speechMock(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
  const begun = performance.now();
  await start(page);
  await keyboard(page, "Next");
  await expect(
    guide(page).getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
  );
  await keyboard(page, "Next");
  const result = await (await response).json();
  await expect(
    guide(page).getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
  for (let i = 0; i < 3; i++) await keyboard(page, "Next");
  const stage6Seconds = (performance.now() - begun) / 1000;
  await page
    .getByRole("region", { name: "Maintenance handoff preview" })
    .getByRole("button", { name: "Create maintenance ticket", exact: true })
    .click();
  const saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/tickets") && r.request().method() === "POST",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm ticket creation", exact: true })
    .click();
  const detail = await (await saved).json();
  await expect(guide(page)).toContainText(`Ticket saved: ${detail.ticket.id}`);
  expect(detail.ticket.diagnosis_id).toBe(result.id);
  expect(
    detail.history.filter((h: { kind: string }) => h.kind === "created"),
  ).toHaveLength(1);
  expect(detail.ticket.status).toBe("Open");
  expect(detail.ticket.resolution_notes).toBe("");
  await save("manual-duration.json", {
    method:
      "Real wall clock, no virtual time, immediate scripted Next after readiness; excludes initial page load; not a comprehension or native speech duration",
    stage6Seconds,
    confirmedTicketSeconds: (performance.now() - begun) / 1000,
    ticketId: detail.ticket.id,
    diagnosisId: result.id,
    navigationAfterSuccess: await page
      .getByRole("navigation", { name: "Guided visual navigation" })
      .innerText(),
    handoffAfterSuccess: await guide(page)
      .getByRole("region", { name: "Maintenance handoff preview" })
      .innerText(),
  });
});

test("GD02B5 measured real-clock Automatic stage order, unfinished speech and zero tickets", async ({
  page,
}) => {
  test.setTimeout(180000);
  await speechMock(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
  const begun = performance.now(),
    entries: { stage: string; seconds: number; captionWords: number }[] = [];
  await start(page);
  entries.push({
    stage: titles[0],
    seconds: (performance.now() - begun) / 1000,
    captionWords: (await guide(page).locator(".narration-text").innerText())
      .trim()
      .split(/\s+/).length,
  });
  await guide(page).getByLabel("Playback mode").selectOption("automatic");
  for (const title of titles.slice(1)) {
    await expect(guide(page).getByRole("heading")).toHaveText(title, {
      timeout: 60000,
    });
    entries.push({
      stage: title,
      seconds: (performance.now() - begun) / 1000,
      captionWords: (await guide(page).locator(".narration-text").innerText())
        .trim()
        .split(/\s+/).length,
    });
  }
  expect(posts.filter((p) => p.endsWith("/api/diagnose"))).toHaveLength(1);
  expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(0);
  await expect(
    guide(page).getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  expect(await page.evaluate(() => !!window.__gdSpeech.active)).toBe(true);
  await save("automatic-duration.json", {
    method:
      "Real wall clock, no virtual time, existing mocks never complete speech; excludes page load",
    entries,
    stage6Seconds: (performance.now() - begun) / 1000,
    diagnosisPosts: 1,
    ticketPosts: 0,
  });
});

test("GD02B5 five same-page runs retain no selections, ticket writes or retired speech handlers", async ({
  page,
}) => {
  test.setTimeout(300000);
  await speechMock(page);
  await sceneProbe(page);
  await workcellProbe(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const posts: string[] = [],
    errors: string[] = [],
    samples: unknown[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
  const tickets = await (await page.request.get("/api/tickets")).json();
  await expect
    .poll(() =>
      page.evaluate(() => window.__ui02GPU.read().renderer?.drawCalls ?? 0),
    )
    .toBeGreaterThan(0);
  const initialGPU = await page.evaluate(() => window.__ui02GPU.read());
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  await page.evaluate(() => {
    const w = window as unknown as {
      __auditUtterances: SpeechSynthesisUtterance[];
    };
    w.__auditUtterances = [];
    const original = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (utterance) => {
      w.__auditUtterances.push(utterance);
      original(utterance);
    };
  });
  for (let run = 1; run <= 5; run++) {
    await start(page);
    await expect(page.locator("progress")).toHaveAttribute("value", "0");
    await expect(guide(page).getByLabel("Playback mode")).toHaveValue("manual");
    const result = await (await guideToAnalysis(page)).json();
    await keyboard(page, "Next");
    await page
      .getByRole("group", { name: "Recorded readings" })
      .getByRole("button", { name: /^E6 ·/ })
      .click();
    await expectMarkerWorld(
      page,
      result.timeline.find((r: { id: string }) => r.id === "E6").tcp,
    );
    await page
      .getByRole("button", { name: "Clear Selection", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.__ui03Scene.read().markers))
      .toBe(0);
    await keyboard(page, "Next");
    await keyboard(page, "Next");
    await keyboard(page, "Exit walkthrough");
    await expect(
      page.getByRole("navigation", { name: "Guided visual navigation" }),
    ).toHaveCount(0);
    await expect(page.locator("[data-guide-highlight]")).toHaveCount(0);
    const speech = await page.evaluate(() => {
      const w = window as unknown as {
        __auditUtterances: SpeechSynthesisUtterance[];
      };
      const retainedHandlers = w.__auditUtterances.filter(
        (u) => u.onstart || u.onend || u.onerror,
      ).length;
      w.__auditUtterances = [];
      window.__gdSpeech.spoken = [];
      return { retainedHandlers, active: !!window.__gdSpeech.active };
    });
    expect(speech).toEqual({ retainedHandlers: 0, active: false });
    await cdp.send("HeapProfiler.collectGarbage");
    const metrics = await cdp.send("Performance.getMetrics");
    const gpu = await page.evaluate(() => window.__ui02GPU.read());
    expect(gpu.contexts).toBe(initialGPU.contexts);
    expect(gpu.renderer!.id).toBe(initialGPU.renderer!.id);
    expect(gpu.liveBuffers).toBeGreaterThan(0);
    samples.push({
      run,
      speech,
      gpu,
      metrics: metrics.metrics.filter((m) =>
        ["JSHeapUsedSize", "Nodes", "JSEventListeners", "Documents"].includes(
          m.name,
        ),
      ),
    });
  }
  expect(posts.filter((p) => p.endsWith("/api/diagnose"))).toHaveLength(5);
  expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(0);
  expect(await (await page.request.get("/api/tickets")).json()).toEqual(
    tickets,
  );
  expect(errors).toEqual([]);
  const rendererInfo = await page.evaluate(() => {
    const gl = document.querySelector("canvas")!.getContext("webgl2")!;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: ext
        ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
      vendor: ext
        ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)
        : gl.getParameter(gl.VENDOR),
    };
  });
  await save("repeated-runs.json", {
    rendererInfo,
    initialGPU,
    method:
      "Five virtual-time simulation runs; GC-assisted CDP samples after Exit; test speech logs cleared between samples; short-run screening only, not an overnight leak or Windows GPU benchmark",
    samples,
    diagnosisPosts: 5,
    ticketPosts: 0,
    pageErrors: errors,
  });
});

test("GD02B5 in-flight confirmed response cannot redirect or overwrite a manual creation draft", async ({
  page,
}) => {
  test.setTimeout(120000);
  await speechMock(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let savedId = "";
  const bodies: unknown[] = [];
  await page.route("**/api/tickets", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    bodies.push(route.request().postDataJSON());
    const response = await route.fetch();
    savedId = (await response.json()).ticket.id;
    await held;
    await route.fulfill({ response });
  });
  try {
    await page.goto("/");
    await start(page);
    const result = await (await guideToAnalysis(page)).json();
    for (let i = 0; i < 3; i++) await keyboard(page, "Next");
    await page
      .getByRole("region", { name: "Maintenance handoff preview" })
      .getByRole("button", { name: "Create maintenance ticket", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm ticket creation", exact: true })
      .click();
    await expect.poll(() => savedId).not.toBe("");
    await expect(guide(page)).toContainText("Submitting confirmed request");
    await page
      .getByRole("button", { name: "Maintenance", exact: true })
      .click();
    await page
      .getByLabel("Title", { exact: true })
      .fill("Independent in-flight audit draft");
    await page
      .getByLabel("Description", { exact: true })
      .fill("Not the confirmed guided payload");
    const notice = page.getByRole("complementary", {
      name: "Confirmed handoff request",
    });
    await expect(notice).toContainText("Submitting confirmed request");
    release();
    await expect(notice).toContainText(`Ticket saved: ${savedId}`);
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
      "Independent in-flight audit draft",
    );
    await expect(
      page.getByRole("textbox", { name: "Description", exact: true }),
    ).toHaveValue("Not the confirmed guided payload");
    expect(bodies).toHaveLength(1);
    const persisted = await (
      await page.request.get(`/api/tickets/${savedId}`)
    ).json();
    expect(persisted.ticket.diagnosis_id).toBe(result.id);
    expect(
      persisted.history.filter((h: { kind: string }) => h.kind === "created"),
    ).toHaveLength(1);
    await save("pending-navigation.json", {
      ticketId: savedId,
      diagnosisId: result.id,
      ticketPosts: bodies.length,
      createdEvents: 1,
      titlePreserved: true,
      descriptionPreserved: true,
      method:
        "Real SQLite commit, delayed response released explicitly after in-app navigation and draft entry; no timer-only assertion",
    });
  } finally {
    release();
  }
});
