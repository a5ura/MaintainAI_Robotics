import { test, expect, type Page } from "@playwright/test";
import { speechMock } from "./speechMock";
import { guideToAnalysis } from "./guidedController";
async function stage6(page: Page) {
  await page
    .getByRole("button", { name: "Start Guided Demo", exact: true })
    .click();
  const diagnosis = await (await guideToAnalysis(page)).json();
  const guide = page.getByRole("region", { name: "Guided Demo", exact: true });
  for (let i = 0; i < 3; i++)
    await guide.getByRole("button", { name: "Next", exact: true }).click();
  await expect(guide.getByRole("heading")).toHaveText("Maintenance Handoff");
  return diagnosis;
}
for (const size of [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`GD02B4 explicit confirmation, cancellation and persisted history at ${size.width}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await speechMock(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(size);
    const posts: { url: string; body: Record<string, string> }[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST")
        posts.push({ url: r.url(), body: r.postDataJSON() });
    });
    await page.goto("/");
    const diagnosis = await stage6(page);
    const panel = page.getByRole("region", {
      name: "Maintenance handoff preview",
    });
    await expect(panel).toContainText(diagnosis.id);
    await expect(panel).toContainText(diagnosis.hypotheses[0].cause);
    const create = panel.getByRole("button", {
      name: "Create maintenance ticket",
      exact: true,
    });
    await create.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("persistent shared maintenance record");
    await expect(
      dialog.getByRole("button", { name: "Cancel", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(create).toBeFocused();
    await create.click();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(create).toBeFocused();
    expect(posts.filter((p) => p.url.endsWith("/api/tickets"))).toHaveLength(0);
    await create.click();
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/tickets") && r.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Confirm ticket creation", exact: true })
      .evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
    const detail = await (await response).json();
    await expect(panel).toContainText(`Ticket saved: ${detail.ticket.id}`);
    await expect(
      page
        .getByRole("region", { name: "Guided Demo", exact: true })
        .getByRole("heading"),
    ).toHaveText("Maintenance Handoff");
    expect(posts.filter((p) => p.url.endsWith("/api/tickets"))).toHaveLength(1);
    expect(posts.filter((p) => p.url.endsWith("/api/diagnose"))).toHaveLength(
      1,
    );
    expect(
      posts.find((p) => p.url.endsWith("/api/tickets"))!.body.request_id,
    ).toMatch(/^[0-9a-f-]{36}$/);
    await panel
      .getByRole("button", { name: "View saved ticket", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Ticket details", exact: true }),
    ).toContainText(detail.ticket.id);
    const saved = await (
      await page.request.get(`/api/tickets/${detail.ticket.id}`)
    ).json();
    expect(saved.diagnosis.id).toBe(diagnosis.id);
    expect(
      saved.history.filter((h: { kind: string }) => h.kind === "created"),
    ).toHaveLength(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(size.width);
  });
}
test("GD02B4 committed-but-lost response survives new runs/navigation; reconciliation is same-ID and preserves manual drafts", async ({
  page,
}) => {
  test.setTimeout(180000);
  await speechMock(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const bodies: Record<string, string>[] = [];
  let savedId = "";
  await page.route("**/api/tickets", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    bodies.push(route.request().postDataJSON());
    if (bodies.length === 1) {
      const response = await route.fetch();
      savedId = (await response.json()).ticket.id;
      await route.abort("failed");
    } else await route.continue();
  });
  await page.goto("/");
  await stage6(page);
  let panel = page.getByRole("region", { name: "Maintenance handoff preview" });
  await panel
    .getByRole("button", { name: "Create maintenance ticket", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm ticket creation", exact: true })
    .click();
  await expect(panel).toContainText("Uncertain outcome");
  expect(bodies).toHaveLength(1);
  await page
    .getByRole("region", { name: "Guided Demo", exact: true })
    .getByRole("button", { name: "Exit walkthrough", exact: true })
    .click();
  await stage6(page);
  panel = page.getByRole("region", { name: "Maintenance handoff preview" });
  await expect(
    panel.getByRole("button", {
      name: "Create maintenance ticket",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(panel).toContainText(bodies[0].request_id);
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Keep my independent manual draft");
  const notice = page.getByRole("complementary", {
    name: "Confirmed handoff request",
  });
  await notice
    .getByRole("button", { name: "Review retained request", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  expect(bodies).toHaveLength(1);
  await notice
    .getByRole("button", { name: "Review retained request", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reconcile confirmed attempt", exact: true })
    .click();
  await expect(notice).toContainText(`Ticket saved: ${savedId}`);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Keep my independent manual draft",
  );
  expect(bodies).toHaveLength(2);
  expect(bodies[1]).toEqual(bodies[0]);
  const stored = await (
    await page.request.get(`/api/tickets/${savedId}`)
  ).json();
  expect(
    stored.history.filter((h: { kind: string }) => h.kind === "created"),
  ).toHaveLength(1);
  const listed = await (await page.request.get("/api/tickets")).json();
  expect(listed.filter((t: { id: string }) => t.id === savedId)).toHaveLength(
    1,
  );
});
