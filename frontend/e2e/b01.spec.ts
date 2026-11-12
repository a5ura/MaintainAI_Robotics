import { test, expect } from "@playwright/test";

test("conflict reload preserves repair/resolution drafts, uses refreshed version and clears drafts on ticket switch", async ({
  page,
  request,
}) => {
  const label = `B01 audit ${Date.now()}`;
  const first = await request.post("/api/tickets", {
    data: { equipment_id: "R-01", title: `${label} A` },
  });
  expect(first.status()).toBe(201);
  const a = (await first.json()).ticket.id;
  const second = await request.post("/api/tickets", {
    data: { equipment_id: "R-01", title: `${label} B` },
  });
  expect(second.status()).toBe(201);
  await page.goto("/");
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`${label} A`) }).click();
  const panel = page.getByRole("region", {
    name: "Ticket details",
    exact: true,
  });
  const status = page.getByLabel("Ticket status", { exact: true });
  const note = page.getByRole("textbox", { name: "Repair note / operator observation", exact: true });
  const resolution = page.getByRole("textbox", { name: "Resolution notes", exact: true });
  await status.selectOption("Resolved");
  await note.fill("Unsaved repair λ");
  await resolution.fill("Unsaved resolution 漢字");
  const concurrent = await request.patch(`/api/tickets/${a}`, {
    data: {
      expected_version: 1,
      status: "In Progress",
      note: "Other client's observation",
    },
  });
  expect(concurrent.status()).toBe(200);
  await page.getByRole("button", { name: "Save update", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Ticket changed in another session",
  );
  await expect(panel).toContainText("VERSION 1");
  await page
    .getByRole("button", { name: "Reload records", exact: true })
    .click();
  await expect(panel).toContainText("VERSION 2");
  await expect(panel).toContainText("Other client's observation");
  await expect(page.getByRole("status")).toContainText(
    "Loaded saved version 2",
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(note).toHaveValue("Unsaved repair λ");
  await expect(resolution).toHaveValue("Unsaved resolution 漢字");
  await expect(status).toHaveValue("Resolved");
  // Reload performs reads only; it has not saved the preserved drafts.
  const reloaded = (await (await request.get(`/api/tickets/${a}`)).json())
    .ticket;
  expect(reloaded.version).toBe(2);
  expect(reloaded.status).toBe("In Progress");
  await page.getByRole("button", { name: "Save update", exact: true }).click();
  await expect(panel).toContainText("VERSION 3");
  const saved = await (await request.get(`/api/tickets/${a}`)).json();
  expect(saved.ticket.status).toBe("Resolved");
  expect(saved.ticket.resolution_notes).toBe("Unsaved resolution 漢字");
  expect(
    saved.history.some((event: { body: string }) =>
      event.body.includes("Unsaved repair λ"),
    ),
  ).toBe(true);
  await expect(note).toHaveValue("");
  await expect(page.getByRole("status")).toHaveCount(0);
  // A second conflict validates clearing recovered drafts on intentional selection.
  await status.selectOption("Open");
  await note.fill("Do not transfer this draft to B");
  const changed = await request.patch(`/api/tickets/${a}`, {
    data: { expected_version: 3, note: "Concurrent follow-up" },
  });
  expect(changed.status()).toBe(200);
  await page.getByRole("button", { name: "Save update", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Ticket changed in another session",
  );
  await page
    .getByRole("button", { name: "Reload records", exact: true })
    .click();
  await expect(panel).toContainText("VERSION 4");
  await expect(note).toHaveValue("Do not transfer this draft to B");
  await page.getByRole("button", { name: new RegExp(`${label} B`) }).click();
  await expect(
    panel.getByRole("heading", { name: `${label} B`, exact: true }),
  ).toBeVisible();
  await expect(note).toHaveValue("");
  await expect(status).toHaveValue("Open");
  await expect(page.getByRole("status")).toHaveCount(0);
  await status.selectOption("Resolved");
  await expect(resolution).toHaveValue("");
});
