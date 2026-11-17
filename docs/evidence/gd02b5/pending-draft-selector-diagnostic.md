# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gd02b5.spec.ts >> GD02B5 in-flight confirmed response cannot redirect or overwrite a manual creation draft
- Location: e2e/gd02b5.spec.ts:456:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByLabel('Description', { exact: true })
Expected: "Not the confirmed guided payload"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" getByLabel('Description', { exact: true }) with timeout 5000ms
  - waiting for getByLabel('Description', { exact: true })

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- banner:
  - link "M / MaintainAI ROBOTICS Cell 01 / R-01":
    - /url: "#"
  - navigation "Workspace":
    - button "Operations"
    - button "Diagnostics"
    - button "Maintenance" [pressed]
  - text: SIMULATION Not live hardware
- paragraph
- complementary "Confirmed handoff request":
  - status:
    - strong: "Ticket saved: T-13e2b214a2365876a646e1052f782214"
    - paragraph: Dropped object · seed 42 · page-session run 1 · Diagnosis D-973774d225afd7785d537ddd
    - paragraph: "Attempt reference: 7787dfe1-a065-43ae-8206-1e15936b0de7"
  - button "Open confirmed ticket"
- main:
  - text: MAINTENANCE / SHARED DEMO RECORDS
  - heading "From evidence to action." [level=1]
  - paragraph: Records are shared by this backend. No login or private visitor identity.
  - button "Return to operations"
  - paragraph: Saved records are shared by visitors using this backend. Use synthetic information only; do not enter private or sensitive data.
  - region "Equipment registry":
    - article:
      - text: CELL-01 / Operational
      - heading "Workcell 01" [level=2]
      - paragraph: Source fixture, target fixture and verification sensors
      - text: 0 associated tickets
    - article:
      - text: R-01 / Operational
      - heading "Robot R-01" [level=2]
      - paragraph: 3-axis pick-and-place demonstrator
      - text: 3 associated tickets
  - heading "Incident history" [level=2]
  - paragraph: Records are loaded in pages of up to 200, including seeded incidents.
  - list:
    - listitem:
      - button "Guided demo — Dropped object T-13e2b214a2365876a646e1052f782214 · R-01 · Open":
        - strong: Guided demo — Dropped object
        - text: T-13e2b214a2365876a646e1052f782214 · R-01 · Open
    - listitem:
      - button "Guided demo — Dropped object T-f1ef213a11fd5c53a81b8550c08c5606 · R-01 · Open":
        - strong: Guided demo — Dropped object
        - text: T-f1ef213a11fd5c53a81b8550c08c5606 · R-01 · Open
    - listitem:
      - button "Historical grip loss T-SEED-001 · R-01 · Resolved":
        - strong: Historical grip loss
        - text: T-SEED-001 · R-01 · Resolved
  - heading "New maintenance ticket" [level=2]
  - button "Manual ticket"
  - button "Use current diagnosis"
  - form "Create ticket":
    - paragraph: Manual incident — no diagnosis linked
    - text: Equipment
    - combobox "Ticket equipment":
      - option "CELL-01 · Workcell 01"
      - option "R-01 · Robot R-01" [selected]
    - text: Title
    - textbox "Title": Independent in-flight audit draft
    - text: Description
    - textbox "Description": Not the confirmed guided payload
    - button "Create ticket"
  - region "Ticket details":
    - heading "Choose an incident." [level=2]
    - paragraph: Inspect its diagnosis, repair notes, and status history, or create a new ticket from a completed diagnosis.
```

# Test source

```ts
  409 |     });
  410 |     expect(speech).toEqual({ retainedHandlers: 0, active: false });
  411 |     await cdp.send("HeapProfiler.collectGarbage");
  412 |     const metrics = await cdp.send("Performance.getMetrics");
  413 |     const gpu = await page.evaluate(() => window.__ui02GPU.read());
  414 |     expect(gpu.contexts).toBe(1);
  415 |     expect(gpu.liveBuffers).toBeGreaterThan(0);
  416 |     samples.push({
  417 |       run,
  418 |       speech,
  419 |       gpu,
  420 |       metrics: metrics.metrics.filter((m) =>
  421 |         ["JSHeapUsedSize", "Nodes", "JSEventListeners", "Documents"].includes(
  422 |           m.name,
  423 |         ),
  424 |       ),
  425 |     });
  426 |   }
  427 |   expect(posts.filter((p) => p.endsWith("/api/diagnose"))).toHaveLength(5);
  428 |   expect(posts.filter((p) => p.endsWith("/api/tickets"))).toHaveLength(0);
  429 |   expect(await (await page.request.get("/api/tickets")).json()).toEqual(
  430 |     tickets,
  431 |   );
  432 |   expect(errors).toEqual([]);
  433 |   const rendererInfo = await page.evaluate(() => {
  434 |     const gl = document.querySelector("canvas")!.getContext("webgl2")!;
  435 |     const ext = gl.getExtension("WEBGL_debug_renderer_info");
  436 |     return {
  437 |       renderer: ext
  438 |         ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
  439 |         : gl.getParameter(gl.RENDERER),
  440 |       vendor: ext
  441 |         ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)
  442 |         : gl.getParameter(gl.VENDOR),
  443 |     };
  444 |   });
  445 |   await save("repeated-runs.json", {
  446 |     rendererInfo,
  447 |     method:
  448 |       "Five virtual-time simulation runs; GC-assisted CDP samples after Exit; test speech logs cleared between samples; short-run screening only, not an overnight leak or Windows GPU benchmark",
  449 |     samples,
  450 |     diagnosisPosts: 5,
  451 |     ticketPosts: 0,
  452 |     pageErrors: errors,
  453 |   });
  454 | });
  455 | 
  456 | test("GD02B5 in-flight confirmed response cannot redirect or overwrite a manual creation draft", async ({
  457 |   page,
  458 | }) => {
  459 |   test.setTimeout(120000);
  460 |   await speechMock(page);
  461 |   await page.emulateMedia({ reducedMotion: "reduce" });
  462 |   let release!: () => void;
  463 |   const held = new Promise<void>((resolve) => {
  464 |     release = resolve;
  465 |   });
  466 |   let savedId = "";
  467 |   const bodies: unknown[] = [];
  468 |   await page.route("**/api/tickets", async (route) => {
  469 |     if (route.request().method() !== "POST") return route.continue();
  470 |     bodies.push(route.request().postDataJSON());
  471 |     const response = await route.fetch();
  472 |     savedId = (await response.json()).ticket.id;
  473 |     await held;
  474 |     await route.fulfill({ response });
  475 |   });
  476 |   try {
  477 |     await page.goto("/");
  478 |     await start(page);
  479 |     const result = await (await guideToAnalysis(page)).json();
  480 |     for (let i = 0; i < 3; i++) await keyboard(page, "Next");
  481 |     await page
  482 |       .getByRole("region", { name: "Maintenance handoff preview" })
  483 |       .getByRole("button", { name: "Create maintenance ticket", exact: true })
  484 |       .click();
  485 |     await page
  486 |       .getByRole("dialog")
  487 |       .getByRole("button", { name: "Confirm ticket creation", exact: true })
  488 |       .click();
  489 |     await expect.poll(() => savedId).not.toBe("");
  490 |     await expect(guide(page)).toContainText("Submitting confirmed request");
  491 |     await page
  492 |       .getByRole("button", { name: "Maintenance", exact: true })
  493 |       .click();
  494 |     await page
  495 |       .getByLabel("Title", { exact: true })
  496 |       .fill("Independent in-flight audit draft");
  497 |     await page
  498 |       .getByLabel("Description", { exact: true })
  499 |       .fill("Not the confirmed guided payload");
  500 |     const notice = page.getByRole("complementary", {
  501 |       name: "Confirmed handoff request",
  502 |     });
  503 |     await expect(notice).toContainText("Submitting confirmed request");
  504 |     release();
  505 |     await expect(notice).toContainText(`Ticket saved: ${savedId}`);
  506 |     await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
  507 |       "Independent in-flight audit draft",
  508 |     );
> 509 |     await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
      |                                                                   ^ Error: expect(locator).toHaveValue(expected) failed
  510 |       "Not the confirmed guided payload",
  511 |     );
  512 |     expect(bodies).toHaveLength(1);
  513 |     const persisted = await (
  514 |       await page.request.get(`/api/tickets/${savedId}`)
  515 |     ).json();
  516 |     expect(persisted.ticket.diagnosis_id).toBe(result.id);
  517 |     expect(
  518 |       persisted.history.filter((h: { kind: string }) => h.kind === "created"),
  519 |     ).toHaveLength(1);
  520 |     await save("pending-navigation.json", {
  521 |       ticketId: savedId,
  522 |       diagnosisId: result.id,
  523 |       ticketPosts: bodies.length,
  524 |       createdEvents: 1,
  525 |       titlePreserved: true,
  526 |       descriptionPreserved: true,
  527 |       method:
  528 |         "Real SQLite commit, delayed response released explicitly after in-app navigation and draft entry; no timer-only assertion",
  529 |     });
  530 |   } finally {
  531 |     release();
  532 |   }
  533 | });
  534 | 
```