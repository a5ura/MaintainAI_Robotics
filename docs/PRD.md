# MaintainAI Robotics — Project 2 V1 Planning Handoff
**Originally prepared:** October 30, 2026  
**Revised:** October 31, 2026  
**Destination:** ChatGPT Project **“MaintainAI Robotics Project 2 V1 Planning”**.  
**Companion project:** **“MaintainAI Robotics Project 2 V1 Coding”**, using **Codex Desktop app** for implementation.

**Purpose:** Upload this revised handoff to the Planning project's files and use the opening prompt in Section 10. It preserves the established product requirements, V1/V2 scope, background, architecture, and strict $0 budget. Planning maintains decisions and prepares bounded assignments; Coding implements them and returns evidence of the results. The two project folders organize conversations and context; the application source lives in a separate Project 2 Git repository.

> **Current status:** Project 1 software is complete. At the last confirmed checkpoint, Project 2 **V1 PRD/planning was complete and V1 coding had not started**. V2 remains a future roadmap. This revision changes organization and development workflow only; it does not verify newer implementation progress. **Immediate next task: establish the Planning baseline and prepare the first Codex Desktop coding handoff, including repository and execution-location checks.**
---

## 1. Project identity, purpose, and audience

**Working name:** MaintainAI Robotics (Project 2)  
**Relationship:** Separate successor portfolio project to **MaintainAI (Project 1)**. It builds on lessons and a few maintenance-management concepts but must have its **own repository and application**, not simply extend the old Streamlit UI.

**Product concept:** An **evidence-driven robotic failure investigation and troubleshooting platform**. The app demonstrates how a robotics deployment/integration engineer can observe a failed pick-and-place cycle, gather relevant robot and system evidence, correlate signals, form competing root-cause hypotheses, guide a technician through verification, and document the resolution.

**Primary audience:** Robotics hiring managers, recruiters, and engineers reviewing an interactive, public, portfolio-quality demonstration.

**Career positioning:** First and foremost **robotics deployment / integration / reliability engineering**; also demonstrates robotics software engineering and applied AI engineering. The app should showcase engineering reasoning, diagnostic workflows, and usable software—not a generic chatbot or pretty-but-fake dashboard.

**Differentiation:** Compared with general robotics observability/fleet tools (Foxglove, InOrbit, Formant), V1 should emphasize **one deep, coherent failure investigation with traceable evidence and actionable troubleshooting**. Do not claim commercial tools lack these capabilities or that Project 2 is uniquely novel.

---

## 2. Non-negotiable user requirements

1. **Exactly $0.00 spend.** No paid APIs, paid infrastructure, surprise charges, trials that roll into charges, or paid credits. Prefer genuinely free services with no billing method required. Do not activate any service that can bill the user without explicit approval. If no truly free solution meets all requirements, report the constraint honestly and propose a zero-cost compromise rather than spending.
2. **Codex Desktop app for development.** The user tried Codex Cloud and encountered issues, and has chosen the desktop app as the implementation interface. Keep local workloads lightweight on the user's aging Windows laptop and minimize manual code copying. The app UI does not determine execution location: confirm whether a task runs locally or in a configured cloud environment before implementation. Cloud execution is optional and is not a prerequisite for beginning V1. See Section 7.
3. **Autonomous implementation.** Give Codex substantial, well-scoped assignments with acceptance tests; let it implement and iterate, but review milestone outcomes and PRs. The user does not want another long requirements interview.
4. **GitHub is the source of truth.** New Project 2 repo, feature branches, meaningful commits/pushes, test results, PRs, stable `main`. Codex's chat and ChatGPT's chat do not automatically share full context; commit durable project instructions/status files into the repo.
5. **Outstanding UI/UX.** Project 1's interface was rated **0/10** by the user. Project 2 must be polished, clear, visually impressive, responsive, and easy for a recruiter to explore without explanation.
6. **Real computation behind the demo.** Synthetic input data are acceptable, but diagnostic results must be **computed** from events, telemetry, timestamps, and rules. No hardcoded diagnosis cards merely animated to look intelligent.
7. **No login for public V1.** Recruiters should open a URL and immediately explore the app.
8. **Independent concurrent sessions.** Different visitors must be able to run simulations without interfering with each other's active simulations.
9. **Shared persistent maintenance data.** Seeded incidents/tickets and newly created records should live in a **central cloud-backed store**, survive restarts/redeploys, and be visible across browsers/devices. Browser-local-only persistence is **not** sufficient. Without login, records are shared/public; do not promise user-private identity or private cross-device recovery.
10. **V1/V2 discipline.** If a proposed feature requires real robot integration, production telemetry, complex physics/IK, or major platform scope, identify it as a V2 candidate rather than expanding V1.
11. **Speed.** Aggressive **3 focused development days** for a demonstrable V1, with 1–2 days contingency if needed. This is a target, not a guaranteed delivery time.
12. **Concise collaboration.** The user prefers direct, practical, brief responses, no emojis, and minimal repetitive clarification.

---

## 3. Scope split: V1 versus V2

### V1 — Build now
A **public, interactive, browser-based robotics diagnostics demo**:
- One simulated industrial robot arm performing a pick-and-place task.
- Realistic, visually understandable robot motion.
- Four injectable failure scenarios.
- Automated fault detection, timestamped evidence collection, evidence correlation, ranked possible causes, suggested troubleshooting.
- Guided visual investigation and optional advanced engineering data.
- Maintenance records, tickets, issue history, and diagnostic-to-ticket linkage.
- Default interactive mode and automatic guided-demo mode.
- Polished UI, automated tests, public deployment, and GitHub documentation.

### V2 — Explicitly deferred
- Real ROS 2 subscriptions/topics/bags and TF integration.
- Real robot-controller/pendant and Linux log collectors.
- Live robot telemetry and robust synchronization across sources.
- Physical robot hardware and deployment.
- Sophisticated perception pipelines, advanced simulation/physics, IK/motion planning beyond V1's trajectory playback/forward kinematics.
- More advanced ML/AI diagnostic models, production-grade integrations, and broader robot/fleet support.

**V2 status:** Vision established only. No detailed V2 PRD, architecture, code, tests, or deployment yet. Complete V1 first.

---

## 4. Finalized V1 product requirements

### 4.1 Landing screen and navigation
- Open on a clean **Operations Dashboard** with robot/cell status, current cycle, recent events, and clear navigation.
- A critical failure should be obvious and surface an action to enter the **Diagnostics Workspace**.
- Users can easily return to the dashboard.
- Keep default UI simple; progressively reveal detailed technical data.

### 4.2 Robot simulation and operator controls
- Render **one lightweight 3D industrial robot arm** in a pick-and-place workcell.
- Browser performance matters; no dedicated GPU requirement.
- Controls: **Start**, **Pause**, **Reset**.
- Failure selector: **Dropped Object**, **Positioning Error**, **Vision Failure**, **Unexpected Robot Stop**, plus **Random Failure**.
- **Interactive mode is the default.** User triggers or observes failures and investigates them.
- **Guided Demo** automatically demonstrates a real simulation/backend workflow, **not prerecorded footage**; can pause and take manual control.
- Show realistic phases of a pick-and-place cycle, including the **four verification images/checkpoints** envisioned originally: **pre-pick, post-pick, pre-place, post-place**. For V1 these may be generated/simulated verification observations, not physical camera captures.
- Example main scenario: robot appears to complete a place motion, but post-place verification detects a failed placement and triggers an investigation.

### 4.3 Simulation engineering integrity
- Use **predefined plausible joint-space trajectories** and **actual forward kinematics** to derive end-effector positions/transforms.
- Joint values, TCP motion, displayed frames, and diagnostic telemetry must be mutually consistent.
- Avoid a full rigid-body physics engine, advanced IK solver, or production motion planner in V1.
- Toggleable overlays (off by default): **joint angles/positions**, **coordinate frames**, **TCP trajectory**, and **clickable joints/components** with information.
- Engineering visuals should support the diagnostic story rather than clutter the primary UI.

### 4.4 Four failure scenarios
1. **Dropped object** — e.g., gripper/release/timing or grip-detection evidence; diagnose from the observed sequence, not a hardcoded label.
2. **Positioning error** — e.g., discrepancy between target and observed placement or frame/calibration evidence.
3. **Vision failure** — e.g., failed/missing/low-confidence detection or verification.
4. **Unexpected robot stop** — e.g., controller stop/protective stop and correlated event sequence.

Each scenario needs:
- Synthetic but plausible raw inputs (joint/pose data, events, sensors, controller-style logs, verification observations).
- Fault detection and timestamps.
- More than one possible cause when appropriate.
- Evidence that **supports or contradicts** hypotheses.
- Recommended human verification/corrective actions.
- Ability to generate a maintenance ticket/report.

Do not assert a cause as proven unless the evidence truly supports it. Support multiple or simultaneous causes when inputs warrant them.

### 4.5 Diagnostics Workspace
**First layer (plain English):**
- What happened?
- When/where in the cycle?
- Which observations are confirmed?
- What are the most plausible causes, and why?
- What should the operator check next?

**Advanced Engineering View (optional):**
- Timestamped robot/controller/ROS-style/Linux-style logs **simulated for V1**.
- Joint readings, sensor values, poses/transforms, graphs, calibration recency, verification outcomes.
- Evidence timeline, component highlighting, traceability from each hypothesis to specific evidence.
- Guided investigation that walks through relevant evidence and components.
- **Skip to Results** option.

**Epistemic rules:** Distinguish **observations**, **hypotheses**, and **suggested actions**. If showing confidence, do **not** present unvalidated rule scores as statistically calibrated probabilities.

### 4.6 Diagnostic engine
- Python backend actually ingests synthetic cycle/event/telemetry payloads.
- Detects anomalies using deterministic, explainable rules.
- Correlates timestamped evidence across sources.
- Ranks plausible causes, including competing explanations and potentially concurrent faults.
- Outputs structured evidence, candidate causes, and next-step checks.
- No paid cloud LLM required. A robust rules-first V1 is preferred to superficial generative AI.
- Backend endpoints should be independently testable.

### 4.7 Maintenance management
Reuse the *concepts*, not necessarily the implementation, from Project 1:
- Equipment registry.
- Incident/maintenance tickets.
- Ticket status, diagnosis, repair notes, and resolution history.
- Historical issues and links between diagnosis evidence and tickets.
- Seeded demonstration data.
- Persistent records shared through the hosted backend.

Keep the maintenance module lean and directly relevant to robotic fault investigation; do not rebuild every Project 1 feature.

### 4.8 Demo and presentation quality
- Recruiter should understand the value in the first minute.
- Provide an attractive default dashboard, an obvious failure injection path, and a guided demonstration.
- Actual working behavior takes priority over decorative animation.
- Clear loading/error/empty states; responsive layout; accessible interactions where practical.
- Document which signals are **simulated** and which diagnostics are **computed**.

---

## 5. Chosen technical architecture

**Frontend**
- React + TypeScript.
- Tailwind CSS for styling.
- Three.js / React Three Fiber for 3D robot visualization.
- A lightweight state-management approach; avoid needless infrastructure.

**Backend**
- Python + FastAPI.
- Structured API endpoints for robot sessions/cycles, simulated telemetry, fault diagnosis, evidence, equipment, and tickets.
- Explainable rules engine and reproducible synthetic scenarios.
- Unit/integration tests.

**Persistence**
- **SQLite preferred** if a genuinely free host supplies a persistent volume that survives restarts/redeploys.
- If free SQLite volume is unavailable, choose an actually free centrally persistent alternative with no charge risk; don't stall the project by reopening product requirements.
- Explicitly verify host limits, idle/sleep behavior, data durability, and whether credit-card/billing enrollment is required.
- Frontend local storage alone does not satisfy the shared persistence requirement.

**Infrastructure**
- Separate GitHub repository, independent of Project 1.
- Codex Desktop app for development/testing, with the actual local or optional cloud execution environment recorded for each milestone.
- Public recruiter-facing frontend/backend deployment later.
- No paid cloud LLM, external API, or hardware required.

**Important unresolved item:** A **verified, genuinely $0 hosting + persistent shared database solution has not been selected**. Research/validate this before deployment; initial coding should not wait for the choice. Free-tier availability and terms can change.

---

## 6. Implementation plan and checkpoints

**Working target: 3 focused days, with contingency.**

### Day 1 — Vertical slice
- Initialize new repository and clean project structure.
- Configure frontend/backend and testing.
- Render robot and pick-and-place animation using coherent joint trajectories + forward kinematics.
- Implement **one complete failure** through actual backend diagnostic logic.
- Expose evidence and a first diagnostic UI.
- Commit, test, push, and prepare reviewable PR.

### Day 2 — Core breadth
- Implement all four failure types plus Random Failure.
- Evidence timeline, multiple root-cause hypotheses, recommended checks.
- Maintenance tickets/equipment/history.
- Shared database abstraction and seeded records.
- Integrate UI and backend; tests and PR.

### Day 3 — Experience and release
- Guided Demo (real automated workflow, pause/takeover).
- Advanced engineering overlays and investigation.
- UX polish, responsive behavior, accessibility/performance pass.
- Automated regression/e2e checks, README, architecture/limitations documentation.
- Verify and deploy to free public hosting; smoke test public URL.
- Contingency if hosting or defects need additional time.

**First Codex assignment should be substantial but bounded:** establish project skeleton, robot simulation, FastAPI, one failure scenario, diagnostic evidence, tests, and a PR. Avoid asking Codex to build the entire platform in one unreviewed monolithic change.

**Definition of done for V1:**
- Browser demo works without login.
- Independent visitors can run simulations.
- Four distinct fault scenarios drive real backend computations.
- Traceable evidence and meaningful competing hypotheses.
- Tickets persist in shared cloud storage and survive restarts/redeploys.
- Guided mode and advanced view work.
- No billable dependency.
- Public URL, clean repo, docs, and passing tests.

---

## 7. Planning and Coding projects; Codex Desktop workflow

### 7.1 Two project folders for each project/version

The user's organizational pattern is **one Planning project and one Coding project** for each project/version. For this work, use these names:

| Project | Responsibility | Material to keep there |
|---|---|---|
| **MaintainAI Robotics Project 2 V1 Planning** | Maintain product decisions, evaluate tradeoffs, define milestones, and review outcomes. | This handoff, approved PRD, decision log, acceptance criteria, current status, and coding assignments. |
| **MaintainAI Robotics Project 2 V1 Coding** | Use Codex Desktop to implement, run, debug, test, and document the approved milestones. | Current coding packet, repository/workspace location, implementation discussions, test evidence, and milestone completion reports. |

Project 1's Planning and Coding projects remain separate. Keep V2 ideas in this handoff's deferred roadmap until V1 is operational; this organizational change adds no V2 implementation work.

**Planning's next deliverable is a coding packet, not another requirements interview.** Use the settled scope as the baseline, resolve only operational blockers, and prepare the first bounded assignment. Routine implementation choices can be delegated to Codex and recorded for review. Do not begin application implementation merely because this document has been uploaded to Planning.

### 7.2 Desktop UI, execution environment, and deployment are separate

- **Codex Desktop app:** the chosen interface for issuing implementation tasks and reviewing results.
- **Local execution:** commands, dependency installation, builds, and tests use the selected computer and project files. A local Git worktree is a separate checkout on that same computer, not a cloud sandbox.
- **Optional cloud execution:** a remote task uses a separately configured, accessible cloud environment. Its files and services differ from the local machine's; local files are not automatically available remotely.
- **Public application hosting:** the eventual recruiter-facing frontend, FastAPI service, and persistent shared database are a separate deployment decision. Using the desktop app or a development cloud environment does not host the finished app.

The desktop interface does **not** mean execution is entirely in the cloud, nor does local command execution imply offline/local model inference. Verify the selected task environment rather than inferring it from the app name. Official guidance: [Codex environments](https://learn.chatgpt.com/docs/environments/modes).

**Execution decision remains open.** Prepare the first assignment for the desktop app; its preflight should identify the actual workspace and available runtime. A usable local setup can start V1 without resolving the earlier cloud issues. If local resources are insufficient, assess an optional cloud route against access, reliability, and the $0 constraint before choosing it. Do not assume a task continues when the laptop sleeps; that depends on its execution environment and task state.

**Laptop context:** Windows Dell G7 (2019), Intel i7-8750H, 16 GB RAM, GTX 1060 Max-Q. Minimize unnecessary background services and heavy installations. Full robot physics, ROS 2, and GPU-heavy development remain outside V1.

**Cost rule also covers development tooling:** use only already-available access within included limits or a verified free option. Do not assume the desktop app, cloud tasks, API usage, credits, or hosting have unlimited free use. Do not purchase a plan, enable paid API billing, or buy extra credits. If an allowance is exhausted, report the blocker and use a zero-cost fallback or wait.

### 7.3 Setup sequence to prepare in Planning and carry out in Coding

1. **Establish the baseline in Planning.** Review this handoff, record the last confirmed implementation status, and prepare Milestone 1 with the acceptance criteria in Sections 6 and 10. Preserve the full PRD in the coding packet so details are not lost in a short prompt.
2. **Verify or create the separate Project 2 repository.** `MaintainAI-Robotics` remains a suggested name, not a confirmed repository. Reuse an appropriate existing Project 2 repository if one is verified. Keep Project 1's code separate.
3. **Open the Project 2 workspace in Codex Desktop.** For local execution, open or clone the repository into its own local directory and select that folder. Check the working directory, branch, existing files, Git state, and installed Python/Node/Git versions before modifying the app. A ChatGPT project folder or uploaded Markdown file is not itself a runnable repository.
4. **Record the execution location.** Use the desktop app's current environment controls to verify local versus cloud. For local work, inspect existing dependencies and set up only what the milestone needs. Use an isolated branch or worktree as appropriate. If choosing cloud later, verify its configuration, repository access, costs, and file availability explicitly.
5. **Commit durable context.** Suggested files: `AGENTS.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/DEVELOPMENT_STATUS.md`, and `docs/MILESTONE_1.md`. Include run/test instructions. Keep secrets out of these files.
6. **Run the bounded implementation assignment.** Codex implements the vertical slice, runs appropriate tests, checks the UI, and records run instructions, limitations, and actual results. Use platform-appropriate setup instructions rather than assuming a Linux cloud shell.
7. **Review and checkpoint.** Review the desktop diff and test evidence, commit/push the branch, and prepare a reviewable GitHub PR when authenticated access is available. The user reviews/approves merges; keep `main` stable. An unavailable GitHub connection is a reported blocker, not a reason to claim a PR exists.
8. **Return a completion report to Planning.** Review actual behavior against acceptance criteria, update the decision/status records, and prepare the next coding milestone. Free public hosting and durable storage validation can proceed without delaying the first vertical slice.

The app provides local environment setup/actions and Git review controls; use what is available in the installed version. See [Local environments and Git tools](https://learn.chatgpt.com/docs/environments/local-environment). Do not require connecting a repository to Codex Cloud for this desktop workflow.

**Do not claim a repository, local checkout, cloud environment, coding run, PR, or deployment exists until verified.** This document prepares the workflow; it does not perform setup.

### 7.4 Explicit handoff between Planning and Coding

Do not rely on automatic full-context synchronization between the two projects, separate chats, or repository files. Transfer the current documents deliberately and identify their revision date. Repository documentation should reflect approved decisions; Planning should receive the latest implementation report before issuing the next assignment.

**Planning → Coding packet:**
- Project name, milestone objective, and handoff revision/date.
- Full approved V1 PRD, V2 exclusions, architecture, $0 constraint, and relevant decision log.
- Repository/workspace path, branch/base commit if known, and confirmed execution location; mark unknown values as unverified.
- The specific implementation scope, explicit exclusions, observable acceptance criteria, required verification, and expected deliverables.
- Authority to make routine implementation choices within the approved scope; escalate actual scope/cost blockers without repeating settled questions.

**Coding → Planning completion report:**
- What changed and which acceptance criteria passed, failed, or remain unverified.
- Repository, branch, commit, and PR link where available; actual local/cloud execution location.
- Tests run with results; screenshots or demo evidence where helpful; working run instructions.
- Known defects, limitations, dependencies, and any decisions or blockers requiring Planning input.
- Updated status/documentation paths and a proposed next milestone.

Planning owns the approved scope and priority. Coding owns the implementation evidence. Keep both aligned through these explicit exchanges.

---

## 8. Project 1 context to preserve (not the current coding target)

**Name:** MaintainAI (Project 1)  
**Repo:** https://github.com/a5ura/MaintainAI  
**Status:** Software development completed, documented, tested, and published to GitHub. Latest checkpoint reported in prior project planning: `0466c726bbea9fbfe99c5a8b6ad95b9faff484a9` (historical; verify current HEAD if needed).

**Stack:** Python/Streamlit/SQLite, local MiniLM/Sentence Transformers semantic retrieval, optional consent-gated Gemini-compatible generation, synthetic data.

**Completed capabilities:**
- Equipment registry, issue and finding management, history/dashboard.
- SQLite persistence and validated transactional CSV imports.
- Repeatable synthetic seed data (five equipment records, twenty issues, seven log entries).
- Similar-issues semantic retrieval with provenance/freshness handling.
- Deterministic fault patterns (including warning-to-error and repeated failures).
- Guided evidence review/troubleshooting.
- Optional cloud RAG with retrieval-only fallback.
- Regression testing (historically 909 passing tests), README and screenshots.

**Why Project 2 is separate:** Project 1 is a functional engineering proof-of-concept, but the user found its Streamlit UI extremely confusing. Project 2 aims for a superior React/3D experience and a more robotics-specific evidence-correlation story. Reuse **equipment/history, tickets, historical incidents, and diagnostic-to-ticket links** only as needed; do not import Project 1's whole architecture or rework its UI.

**Video work:** Project 1's portfolio video is a **separate ongoing workstream**; the user explicitly asked to set it aside while beginning Project 2. Do not derail Project 2 implementation with video planning.

---

## 9. Decisions made versus still open

### Settled — do not reopen without a real blocker
- V1 before V2.
- One robot, pick-and-place.
- Four failure scenarios and Random Failure.
- Interactive default + live Guided Demo.
- Evidence-based deterministic diagnostics.
- 3D simulation with coherent trajectories and forward kinematics.
- React/TypeScript/Tailwind/React Three Fiber + Python FastAPI.
- Lean maintenance module.
- No-login public experience.
- Independent simulation sessions.
- Shared persistent cloud records.
- Strict $0 budget.
- Codex Desktop app as the coding interface, with execution location verified separately.
- Separate Planning and Coding project folders for Project 2 V1, with explicit document/status handoffs.
- Frequent GitHub checkpoints/PR reviews.
- Fast development target.

### Open operational decisions
- Exact new GitHub repository name and creation.
- Actual Project 2 repository/local workspace and Codex Desktop setup.
- Local versus optional cloud execution for the first milestone; no cloud environment is assumed or required.
- Verified zero-cost public hosting and persistence provider.
- Implementation-specific schema, API routes, robot model/kinematic parameters, and UI visual system—delegate sensible choices to Codex, document them, and review.
- Precise failure signal thresholds, rule scoring, and test fixtures—engineer and validate during implementation.
- Final deployed URL and production smoke tests.

**Do not treat unverified hosting or a planned Codex run as completed.**

---

## 10. Starting the new Planning project

### 10.1 How to use this file

1. Create or open **MaintainAI Robotics Project 2 V1 Planning** in ChatGPT.
2. Upload this revised Markdown handoff to its project files. Use this revision as the current handoff so the old cloud-first instructions are not reused.
3. Start a conversation there with the opening prompt below.
4. Keep **MaintainAI Robotics Project 2 V1 Coding** as the companion implementation project. Transfer the approved coding packet into its Codex Desktop workflow when ready; include the full PRD as well as the milestone prompt.

### 10.2 Opening prompt for Planning — copy into the new conversation

> We are continuing **MaintainAI Robotics — Project 2 V1** in **MaintainAI Robotics Project 2 V1 Planning**. Read the attached revised handoff as our established project context and approved V1 PRD. Project 1 software is complete and separate; set its video work aside. V1 requirements are complete, but coding had not started at the last confirmed checkpoint. Verify any newer progress before updating that status. V2 remains deferred.
>
> I organize each project into two ChatGPT project folders: **Planning** and **Coding**. This project is for requirements, decisions, milestone preparation, and review. Its companion is **MaintainAI Robotics Project 2 V1 Coding**, where I will use **Codex Desktop app** for implementation. Do not restart product planning or ask me to repeat settled requirements. Prepare what I need to hand to Codex; do not start implementing the app in this Planning conversation.
>
> The desktop app is our chosen interface. Treat local versus cloud execution as a separate setup decision. Do not assume the desktop app runs entirely in the cloud, requires Codex Cloud, or makes local workloads disappear. Keep the Windows laptop workload modest and record the actual execution environment before coding. Our budget remains **strictly $0.00**, including any incremental development, API, infrastructure, and hosting costs.
>
> First, give me a concise starting-state summary and a practical setup checklist that identifies only unresolved operational decisions. Then prepare a self-contained **Milestone 1 coding packet**: the approved PRD and constraints, suggested repository context files, an exact Codex Desktop task prompt, scope/exclusions, acceptance criteria, verification steps, and a completion-report template for returning results to Planning. Mark unknown repository/workspace/environment details as unverified rather than inventing them.
>
> Milestone 1 is a working React/TypeScript 3D pick-and-place simulation with coherent joint trajectories and forward kinematics, a FastAPI backend, one computed evidence-driven failure diagnosis, an initial diagnostic UI, tests, run instructions, and a reviewable GitHub PR when access is configured. Preserve the other V1 requirements for later milestones. Verify genuinely free public hosting and shared persistent storage separately without delaying the first coding milestone. Keep your responses concise and practical.

### 10.3 Milestone 1 acceptance criteria for the coding packet

- App starts in the verified development environment selected through Codex Desktop; its location and setup/run instructions are documented.
- Robot animates a repeatable pick-and-place cycle.
- At least one failure is injected and detected by the Python backend.
- UI displays observations, evidence timeline, plausible causes, and next checks.
- Forward-kinematics results match displayed robot state.
- Appropriate tests run and pass; report actual results and any unverified checks.
- GitHub PR is ready for review when repository access is available, with run instructions and current status documented. If blocked, provide the reviewable local changes and state the exact remaining GitHub step; do not call that a completed PR.

This milestone is a vertical slice. V1 is complete only when **all** requirements and the definition of done in Sections 2–6 have been met.

### 10.4 Planning's expected output before transfer to Coding

- A short baseline/status summary and the remaining operational setup checklist.
- Current PRD and decision record, retaining all four failures and all deferred V2 items.
- A Milestone 1 task prompt that explicitly instructs Codex to read the full PRD and context files.
- Acceptance and verification checklist, repository documentation plan, and expected branch/PR deliverables.
- A completion-report template matching Section 7.4 so actual results can return to Planning.

No new feature planning or provider purchase is needed to prepare this packet. Resolve setup choices with available evidence and sensible defaults; ask only when a missing decision truly blocks the next step.

---

## 11. Handoff integrity notes

This revised file preserves the prior handoff's product requirements and background while updating the development interface, project organization, setup workflow, and opening prompt. It is a **planning/continuity artifact**, not evidence that code or infrastructure has been created. Implementation details remain delegated to Codex within the approved scope.

**Last confirmed product status from the original handoff (October 30, 2026):**
- **Project 1:** software complete.
- **Project 2 V1:** product requirements complete; **0% confirmed coding**.
- **Project 2 V2:** conceptual roadmap only.

**Updated workflow decision (October 31, 2026):**
- Separate **MaintainAI Robotics Project 2 V1 Planning** and **MaintainAI Robotics Project 2 V1 Coding** project folders.
- Use **Codex Desktop app** for coding; confirm local versus optional cloud execution separately.
- Preserve all V1/V2 requirements and the strict **$0.00** budget.
- **Next action:** upload this file to Planning → prepare the Milestone 1 coding packet → transfer it to Coding → verify the repository/workspace and execution environment → implement and review the first vertical slice → return results to Planning.

Product scope, failure scenarios, technical architecture, deadline target, and public hosting/persistence requirements are unchanged. No newer coding progress, repository creation, environment setup, or deployment was verified as part of this document revision.
