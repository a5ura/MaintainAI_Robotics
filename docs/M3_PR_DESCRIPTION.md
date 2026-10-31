## Summary

Adds the M3 local release experience on merged M2 while preserving the approved PRD and existing diagnostics/maintenance architecture.

- Live Guided Demo runs the actual simulation, FastAPI diagnosis, evidence/checks and a real labelled maintenance ticket. Supports Pause/Resume/Reset/Skip to Results/manual takeover; interactive mode remains default.
- Optional joint angles, frames, executed TCP trajectory, transforms and real/keyboard component picking use current model state and linked evidence. Overlays default off.
- Adds lazy view loading, on-demand workcell rendering, keyboard/focus/recovery states, responsive refinements and readable diagnostics without a fixed inner scroll trap.
- Adds retry-safe guided ticket requests, opt-in local write budgets and tested offline backup/dry-run retention. No dependencies or paid services added.
- Documents current official hosting evidence, account/runtime/storage gates and public anonymous-write risks. **Nothing is deployed; public V1 is not complete.**

## Verification

- Baseline: 91 backend / 26 frontend tests and production build passed.
- Final: **97 backend tests**, **36 frontend tests**, TypeScript/production build, **13 real Chromium tests passed**.
- Browser coverage includes existing four faults/random/maintenance, live guidance/ticket flow, controls and takeover, matrix values/3D picking/keyboard access, independent sessions, API/chunk recovery and desktop/mobile layout.
- Actual backend process restart preserved guided ticket/note/version/history/evidence. Temporary DB tests cover backup/retention, limiter behavior and concurrent retry deduplication.
- JS entry 215.23 kB / 68.92 kB gzip; separate 3D chunk 843.84 / 226.69. Combined JS remains ~1067 kB; large 3D chunk warning remains. No Windows FPS claim.
- [Completion report and screenshots](https://github.com/a5ura/MaintainAI_Robotics/blob/feature/m3-experience-release/docs/M3_COMPLETION_REPORT.md).

## Deployment gate / limitations

Official Cloudflare docs support Python FastAPI, but Free's 10 ms CPU budget and a D1 adapter still need proof. Current Hugging Face compute Spaces require a paid plan and are rejected. Render's current official terms were network-blocked; no $0 guarantee is invented. Account/card/access, hosted adapter/runtime, distributed abuse controls and real cloud redeployment durability remain unverified. Local SQLite restart success is not public cloud durability. No provider, billing, record migration, environment publication, or V2 work activated.

For Planning review. Do not merge automatically.
