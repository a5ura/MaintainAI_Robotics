# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui02.spec.ts >> UI02 unavailable WebGL preserves controls and real backend diagnosis
- Location: e2e/ui02.spec.ts:296:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('3D rendering unavailable. Simulation and evidence controls remain available.', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('3D rendering unavailable. Simulation and evidence controls remain available.', { exact: true }) with timeout 5000ms
  - waiting for getByText('3D rendering unavailable. Simulation and evidence controls remain available.', { exact: true })

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- banner:
  - link "M / MaintainAI ROBOTICS Cell 01 / R-01":
    - /url: "#"
  - navigation "Workspace":
    - button "Operations" [pressed]
    - button "Diagnostics"
    - button "Maintenance"
  - text: SIMULATION Not live hardware
- paragraph
- main:
  - heading "Operations Cell 01 / R-01" [level=1]
  - paragraph: Simulate a cycle. Investigate evidence. Document the repair.
  - text: Simulated workcell · computed diagnostics
  - region "Robot workcell":
    - text: 01 / ROBOT WORKCELL READY
    - group "Simulated robotic workcell":
      - status: Loading 3D workcell…
      - text: SIMULATION • NOT LIVE HARDWARE TCP / WORLD [m] 1.549 / 0.914 / 1.305
    - text: GRIP / RELEASE Object at gripper / ABSENT VACUUM / 0 kPa CURRENT PHASE
    - strong: pre pick
    - text: 0.0 / 12.0 s
    - progressbar "Cycle progress"
    - group "Simulation controls":
      - button "Start"
      - button "Pause" [disabled]
      - button "Reset"
      - text: SCENARIO
      - combobox "Scenario":
        - option "Valid cycle" [selected]
        - option "Dropped object"
        - option "Positioning error"
        - option "Vision failure"
        - option "Unexpected robot stop"
        - option "Random failure"
      - button "Start Guided Demo"
    - text: Reproducible seed
    - spinbutton "Reproducible seed": "42"
    - text: Valid cycle · seed 42 ● Pre-pick source ○ Post-pick Awaiting observation ○ Pre-place Awaiting observation ○ Post-place Awaiting observation
  - complementary "Investigation":
    - region "Investigation summary":
      - heading "Investigation" [level=2]
      - text: BACKEND EVIDENCE Ready to run Observed outcome
      - paragraph: Pick, place, investigate.
      - paragraph: Run a valid cycle or select a failure scenario. The backend computes the diagnosis from simulated evidence.
      - term: Simulation
      - definition: Ready
      - term: Cycle time
      - definition: 0.0 / 12.0 s
      - paragraph: Run → Inspect evidence → Compare causes → Identify next check. Try Dropped object or Start Guided Demo.
      - button "Full diagnostics & evidence"
  - region "Advanced engineering view":
    - checkbox "Advanced Engineering View Optional · computed from current joint state"
    - text: Advanced Engineering View Optional · computed from current joint state
  - region "Diagnostics Workspace":
    - heading "Full diagnostics" [level=2]
    - text: RULES ENGINE
    - paragraph: Complete a cycle to inspect the backend's observations, hypotheses and evidence here.
  - region "Evidence timeline":
    - heading "Evidence timeline" [level=2]
    - text: SIMULATED INPUTS · CYCLE-RELATIVE TIME
    - paragraph: No completed run. Evidence will appear here after backend analysis.
  - text: MAINTAINAI / ENGINEERING DEMONSTRATOR DETERMINISTIC · EXPLAINABLE · REPRODUCIBLE
```

# Test source

```ts
  211 |       .toBeGreaterThan(draws);
  212 |   }
  213 |   expect(await page.locator("progress").getAttribute("value")).toBe(paused);
  214 |   expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(
  215 |     spoken,
  216 |   );
  217 |   expect(posts).toEqual([]);
  218 |   const after = await page.evaluate(() => window.__ui02GPU.read());
  219 |   expect(after.liveBuffers).toBe(before.liveBuffers);
  220 |   expect(after.createdBuffers).toBe(before.createdBuffers);
  221 |   expect(after.lastFrame!.calls).toBeLessThanOrEqual(40);
  222 |   expect(after.lastFrame!.triangles).toBeLessThan(10000);
  223 |   await page.evaluate(() => window.__ui02GPU.lose());
  224 |   await expect(
  225 |     page.getByText(
  226 |       "3D context lost. Simulation and evidence remain available.",
  227 |       { exact: true },
  228 |     ),
  229 |   ).toBeVisible();
  230 |   await page
  231 |     .getByRole("button", { name: "Reload 3D view", exact: true })
  232 |     .click();
  233 |   await expect(
  234 |     page.getByText(
  235 |       "3D context lost. Simulation and evidence remain available.",
  236 |       { exact: true },
  237 |     ),
  238 |   ).toHaveCount(0);
  239 |   await expect(page.locator("canvas")).toHaveCount(1);
  240 |   await expect(page.locator("canvas")).toBeVisible();
  241 |   expect(await originalCanvas!.evaluate((element) => element.isConnected)).toBe(
  242 |     false,
  243 |   );
  244 |   // Inspect the replacement context itself: previous renderer frames cannot pass.
  245 |   await expect
  246 |     .poll(
  247 |       () =>
  248 |         page.evaluate((previous) => {
  249 |           const renderer = window.__ui02GPU.read().renderer;
  250 |           return (
  251 |             !!renderer &&
  252 |             renderer.id > previous.id &&
  253 |             renderer.liveBuffers === previous.liveBuffers &&
  254 |             renderer.createdBuffers === previous.createdBuffers &&
  255 |             renderer.drawCalls > 0 &&
  256 |             renderer.triangles > 0
  257 |           );
  258 |         }, before.renderer!),
  259 |       { timeout: 8000 },
  260 |     )
  261 |     .toBe(true);
  262 |   const recovered = await page.evaluate(() => window.__ui02GPU.read());
  263 |   expect(renderingErrors).toEqual([]);
  264 |   expect(await page.locator("progress").getAttribute("value")).toBe(paused);
  265 |   expect(await page.evaluate(() => window.__gdSpeech.spoken.length)).toBe(
  266 |     spoken,
  267 |   );
  268 |   expect(posts).toEqual([]);
  269 |   await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  270 |   await expect(page.locator("canvas")).toHaveCount(0);
  271 |   await expect
  272 |     .poll(() => page.evaluate(() => window.__ui02GPU.read().liveBuffers), {
  273 |       timeout: 8000,
  274 |     })
  275 |     .toBe(0);
  276 |   const released = await page.evaluate(() => window.__ui02GPU.read());
  277 |   expect(renderingErrors).toEqual([]);
  278 |   await mkdir("../docs/evidence/ui02", { recursive: true });
  279 |   await writeFile(
  280 |     "../docs/evidence/ui02/resources.json",
  281 |     JSON.stringify(
  282 |       {
  283 |         environment: "Cloud Chromium / software WebGL; not Windows GPU/FPS",
  284 |         before,
  285 |         after,
  286 |         recovered,
  287 |         renderingErrors,
  288 |         released,
  289 |       },
  290 |       null,
  291 |       2,
  292 |     ),
  293 |   );
  294 | });
  295 | 
  296 | test("UI02 unavailable WebGL preserves controls and real backend diagnosis", async ({
  297 |   page,
  298 | }) => {
  299 |   await page.addInitScript(() => {
  300 |     const original = HTMLCanvasElement.prototype.getContext;
  301 |     HTMLCanvasElement.prototype.getContext = function (...args: unknown[]) {
  302 |       return args[0] === "webgl2" ? null : Reflect.apply(original, this, args);
  303 |     } as typeof original;
  304 |   });
  305 |   await page.goto("/");
  306 |   await expect(
  307 |     page.getByText(
  308 |       "3D rendering unavailable. Simulation and evidence controls remain available.",
  309 |       { exact: true },
  310 |     ),
> 311 |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  312 |   await page.clock.install();
  313 |   await page.getByLabel("Scenario", { exact: true }).selectOption("drop");
  314 |   await page.getByRole("button", { name: "Start", exact: true }).click();
  315 |   await page.clock.runFor(13000);
  316 |   await expect(
  317 |     page.getByRole("heading", { name: "Dropped object", exact: true }),
  318 |   ).toBeVisible();
  319 |   await expect(page.locator("canvas")).toHaveCount(0);
  320 |   await expect(
  321 |     page.getByRole("button", { name: "Reset", exact: true }),
  322 |   ).toBeEnabled();
  323 | });
  324 | 
```