import { test, expect } from "@playwright/test";

test("paged maintenance history preserves all events and an unsaved repair draft", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  const title = `Paged acceptance ${Date.now()}`;
  const created = await request.post("/api/tickets", {
    data: {
      equipment_id: "R-01",
      title,
      description: "Synthetic pagination verification",
    },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).ticket.id;
  for (let index = 0; index < 200; index++) {
    const response = await request.patch(`/api/tickets/${id}`, {
      data: {
        expected_version: index + 1,
        note: `Pagination evidence note ${index}`,
      },
    });
    expect(response.status()).toBe(200);
  }
  const detail = await (await request.get(`/api/tickets/${id}`)).json();
  expect(detail.history).toHaveLength(200);
  expect(detail.history_next_seq).toBeDefined();
  await page.goto("/");
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Pagination evidence note 199", { exact: true }),
  ).toHaveCount(0);
  const draft = page.getByLabel("Repair note / operator observation");
  await draft.fill("Preserve this unsaved draft while paging");
  await page.getByRole("button", { name: "Load more history" }).click();
  await expect(
    page.getByText("Pagination evidence note 199", { exact: true }),
  ).toBeVisible();
  await expect(draft).toHaveValue("Preserve this unsaved draft while paging");
  await expect(
    page.getByRole("button", { name: "Load more history" }),
  ).toHaveCount(0);
});
