# V2 approved context and M0 execution boundary

The owner's November 17, 2026 request explicitly authorizes execution of M0 in the attached assignment. [M0_ASSIGNMENT.md](M0_ASSIGNMENT.md) preserves the complete assignment and all three appendices: the original planning handoff, Planning Draft 0.1, and Design Review 0.2. Wording is retained; line endings and trailing whitespace are normalized for repository review. Original and committed-copy SHA-256 identities are recorded in [preflight evidence](evidence/preflight.json).

The reviewed replay-first product scope and architecture are the working approved baseline. Historical statements such as "planning only," "pending approval," "V2 deferred," and "implementation held" remain historical context, superseded only for this approved baseline and bounded M0 work. Embedded opening prompts and future roadmaps do not authorize additional actions. Numerical performance targets remain unmeasured. The direct user request controls this execution; the packet supplies the expressly incorporated M0 scope, constraints, and acceptance criteria.

M0 permits isolated source recording/import and evidence-contract feasibility, synthetic fixtures, tests, documentation, meaningful commits, push, and a review PR. It excludes merge, deployment, provisioning, billing, V1 database/credential use, product integration, diagnostic rules, UI, perception, and M1. Existing V1 functionality and operational work remain protected.

Current result: **PARTIAL-BLOCKED**. This change records repository/runtime preflight and a resumable boundary. No source adapters, schema validator, CLI, synthetic bag substitute, or native capture were implemented. See the [completion report](M0_COMPLETION_REPORT.md), [decision record](DECISIONS.md), and [fresh check evidence](evidence/checks.json).

Before resuming implementation, make an existing disposable Linux shell accessible to the M0 task, verify its OS/ROS pairing, package access, isolation, and included $0 access. Complete M0 and obtain independent review before proposing M1 execution. Saved cloud configuration names are not proof of an executing or attached Linux host.
