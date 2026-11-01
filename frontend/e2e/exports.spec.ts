import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { cyclePayload } from "../src/scenarios";

function markdownDiagnosis(markdown: string) {
  const match = markdown.match(/\n(`{3,})json\n([\s\S]*?)\n\1(?:\n|$)/);
  expect(match, "complete saved diagnosis code block").not.toBeNull();
  return JSON.parse(match![2]);
}

test("saved JSON and Markdown downloads include complete diagnosis/history and preserve every draft without maintenance writes", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  const diagnosis = await (
    await request.post("/api/diagnose", { data: cyclePayload("drop") })
  ).json();
  const title = `Export linked ${Date.now()} λ`;
  const created = await request.post("/api/tickets", {
    data: {
      equipment_id: "R-01",
      title,
      description: "Saved investigation",
      diagnosis_id: diagnosis.id,
    },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).ticket.id;
  for (let i = 0; i < 200; i++) {
    const response = await request.patch(`/api/tickets/${id}`, {
      data: {
        expected_version: i + 1,
        note: `Saved export note ${i} 漢字`,
        ...(i === 0
          ? { status: "Resolved", resolution_notes: "Saved repair verified" }
          : i === 1
            ? { status: "Open" }
            : {}),
      },
    });
    expect(response.status()).toBe(200);
  }
  const before = await (await request.get(`/api/tickets/${id}`)).json();
  expect(before.history_total).toBe(203);
  const mutations: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/") && r.method() !== "GET")
      mutations.push(r.method());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await page.getByLabel("Title", { exact: true }).fill("Unsaved new ticket");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Unsaved description");
  await page
    .getByLabel("Repair note / operator observation")
    .fill("Unsaved repair");
  await page
    .getByLabel("Ticket status", { exact: true })
    .selectOption("Resolved");
  await page
    .getByLabel("Resolution notes", { exact: true })
    .fill("Unsaved resolution");
  const jsonPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const jsonFile = await jsonPending;
  expect(jsonFile.suggestedFilename()).toBe(`maintainai-${id}-v201.json`);
  const jsonText = await readFile((await jsonFile.path())!, "utf8");
  const report = JSON.parse(jsonText);
  expect(report.diagnosis).toEqual(diagnosis);
  expect(report.equipment.id).toBe("R-01");
  expect(report.ticket.status).toBe("Open");
  expect(report.ticket.resolution_notes).toBe("Saved repair verified");
  expect(report.history).toHaveLength(203);
  expect(
    new Set(report.history.map((row: { seq: number }) => row.seq)).size,
  ).toBe(203);
  expect(report.history.at(-1).body).toBe("Saved export note 199 漢字");
  expect(jsonText).not.toMatch(
    /Unsaved new ticket|Unsaved description|Unsaved repair|Unsaved resolution|creation_note|last_status_note|database_url/,
  );
  const markdownPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  const markdownFile = await markdownPending;
  expect(markdownFile.suggestedFilename()).toBe(`maintainai-${id}-v201.md`);
  const markdown = await readFile((await markdownFile.path())!, "utf8");
  expect(markdown).toContain("Saved records only");
  expect(markdown).toContain("Saved export note 199 漢字");
  expect(markdownDiagnosis(markdown)).toEqual(diagnosis);
  expect(markdown).not.toContain("Unsaved repair");
  for (const [label, value] of [
    ["Title", "Unsaved new ticket"],
    ["Description", "Unsaved description"],
    ["Repair note / operator observation", "Unsaved repair"],
    ["Resolution notes", "Unsaved resolution"],
    ["Ticket status", "Resolved"],
  ])
    await expect(
      page.getByRole(label === "Ticket status" ? "combobox" : "textbox", {
        name: label,
        exact: true,
      }),
    ).toHaveValue(value);
  expect(await (await request.get(`/api/tickets/${id}`)).json()).toEqual(
    before,
  );
  expect(mutations).toEqual([]);
});

test("failed or concurrently changed exports create no partial file; manual Unicode Markdown/JSON work after retry", async ({
  page,
  request,
}) => {
  const title = `Manual export ${Date.now()} 漢字`;
  const description =
    "<img src=x onerror=alert(1)>\n# forged heading\n[click](javascript:alert(1))\n```";
  const created = await request.post("/api/tickets", {
    data: { equipment_id: "R-01", title, description },
  });
  const id = (await created.json()).ticket.id;
  await request.patch(`/api/tickets/${id}`, {
    data: {
      expected_version: 1,
      note: "Saved Unicode note λ",
      status: "In Progress",
    },
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await page
    .getByLabel("Repair note / operator observation")
    .fill("Keep unsaved manual draft");
  const files: string[] = [];
  page.on("download", (d) => files.push(d.suggestedFilename()));
  // Simulate a broken continuation contract even though this ticket fits a page.
  let mode = "fail";
  let reads = 0;
  await page.route(`**/api/tickets/${id}`, async (route) => {
    const response = await route.fetch();
    const detail = await response.json();
    if (mode === "fail") {
      detail.history_total = 201;
      detail.history_next_seq = detail.history.at(-1).seq;
    } else if (mode === "change" && ++reads === 2) {
      const changed = await request.patch(`/api/tickets/${id}`, {
        data: { expected_version: 2, note: "Concurrent saved edit" },
      });
      expect(changed.status()).toBe(200);
      await route.fulfill({ response: await route.fetch() });
      return;
    }
    await route.fulfill({ response, json: detail });
  });
  await page.route(`**/api/tickets/${id}/history?*`, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Temporary history outage" }),
    }),
  );
  await page.getByRole("button", { name: "Download JSON" }).click();
  await expect(page.getByRole("alert")).toContainText("No partial file");
  expect(files).toEqual([]);
  mode = "change";
  await page.getByRole("button", { name: "Download JSON" }).click();
  await expect(page.getByRole("alert")).toContainText("incomplete or changed");
  expect(files).toEqual([]);
  mode = "success";
  const jsonPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const json = JSON.parse(
    await readFile((await (await jsonPending).path())!, "utf8"),
  );
  expect(json.diagnosis).toBeNull();
  expect(json.ticket.version).toBe(3);
  expect(json.history).toHaveLength(4);
  const markdownPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  const markdown = await readFile(
    (await (await markdownPending).path())!,
    "utf8",
  );
  expect(markdown).toContain("Manual ticket — no diagnosis linked");
  expect(markdown).toContain("&lt;img src\\=x onerror\\=alert\\(1\\)&gt;");
  expect(markdown).toContain("> \\# forged heading");
  expect(markdown).not.toContain("\n<img");
  expect(markdown).toContain("Saved Unicode note λ");
  await expect(
    page.getByLabel("Repair note / operator observation"),
  ).toHaveValue("Keep unsaved manual draft");
  expect(files).toHaveLength(2);
});

test("large Unicode saved evidence downloads intact as JSON and Markdown", async ({
  page,
  request,
}) => {
  const base = cyclePayload("normal").samples;
  const samples = Array.from({ length: 2000 }, (_, i) => {
    const t = (12 * i) / 1999;
    const row = structuredClone(base.filter((s) => s.t <= t).at(-1)!);
    return {
      ...row,
      t,
      events: [
        {
          t,
          source: "controller",
          code: "DRIVE_WARNING",
          message: "λ".repeat(100),
        },
        {
          t,
          source: "controller",
          code: "DRIVE_WARNING",
          message: "x".repeat(100),
        },
      ],
    };
  });
  expect(Buffer.byteLength(JSON.stringify({ samples }))).toBeLessThanOrEqual(
    2 * 1024 * 1024,
  );
  const response = await request.post("/api/diagnose", { data: { samples } });
  expect(response.status()).toBe(200);
  const diagnosis = await response.json();
  const title = `Full evidence export ${Date.now()}`;
  const created = await request.post("/api/tickets", {
    data: { equipment_id: "R-01", title, diagnosis_id: diagnosis.id },
  });
  expect(created.status()).toBe(201);
  await page.goto("/");
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const json = await readFile((await (await pending).path())!, "utf8");
  expect(Buffer.byteLength(json)).toBeGreaterThan(2 * 1024 * 1024);
  expect(JSON.parse(json).diagnosis).toEqual(diagnosis);
  expect(JSON.parse(json).diagnosis.timeline).toHaveLength(2000);
  const markdownPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  const markdown = await readFile(
    (await (await markdownPending).path())!,
    "utf8",
  );
  expect(markdownDiagnosis(markdown)).toEqual(diagnosis);
});
