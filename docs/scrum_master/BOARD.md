# Scrum Master Board

This board tracks Scrum Master owned team-improvement follow-up items.

## Priority-Ordered TODO

- (Opened during Sprint 20 retrospective) Add a sprint-closeout check requiring explicit hosted GitHub Actions success confirmation immediately before merging the sprint PR.
- (Opened during Sprint 20 retrospective) Add a post-closeout cleanup check requiring merged item branches and the sprint branch to be deleted locally and on `origin`.
- (Opened during Sprint 20 retrospective) Add a closeout check that package-surface changes have been reflected in committed workflow sources and generated workflow YAML before merge.
- (Opened during Sprint 19 retrospective) Add a sprint-start check requiring the agreed sprint branch to be pushed to `origin` before the first backlog-item PR is opened.
- (Opened during Sprint 19 retrospective) Add an item-closeout check requiring durable PR/review evidence before a sprint backlog item can be marked `done`.
- (Opened during Sprint 18 retrospective) Clarify in TEAM.md and/or PLAYBOOK.md that sub-agent or multi-agent collaboration is preferred when it materially helps, but is not mandatory for every small, tightly coupled, sequential sprint item.
- (Opened during Sprint 18 retrospective) Add a sprint-review evidence expectation to the closeout protocol: each delivered item should leave behind one minimal demo command or proof artifact that can be reused during sprint review.
- (Opened during Sprint 17 retrospective) Add README feature-status sync check to the sprint closeout protocol in PLAYBOOK.md. When a sprint delivers a feature that changes the supported/unsupported boundary, the closeout checklist should verify the README reflects the change before the sprint closes.
- (Opened during Sprint 17 retrospective) Add pre-execution validation step to the sprint start protocol in PLAYBOOK.md. Re-run acceptance checks against the sprint branch base at sprint start to detect items whose criteria are already satisfied, converting them to explicit "already done" acknowledgments during planning rather than execution.

## Recently Closed

- (Closed during Sprint 16 retrospective) Document new-package root config checklist as a LEARN.md entry. Closed: LEARN.md entry "New-package root config checklist" added covering the 5-file update ceremony (vitest.config.ts, tsconfig.json, deno.json, jsr.json, package.json).

## Closed Items

- (Closed during Sprint 15 — Item 50) Consider adding `tsc` compilation to `bun run check` or a pre-push hook to close the Bun-vs-tsc type checking gap that caused a CI failure in Sprint 14. See [LEARN.md](../LEARN.md) for the recorded lesson. Closed: per-package `tsconfig.build.json` compilation added to `bun run check` via `build:check` script.
- (Closed during Sprint 11 — Item 30) Make sprint closeout waiting behavior explicit when hosted proof is still pending on the sprint-level PR. Closed as codified in PLAYBOOK.md — Closeout Protocol step 5 defines the waiting behavior decision tree.
- (Closed during Sprint 11 — Item 30) Require sprint review and retrospective notes to reference either a clean review snapshot or an explicitly scoped working-tree evidence note. Closed as codified in PLAYBOOK.md — Closeout Protocol step 4 requires evidence provenance statements.
- (Closed during Sprint 11 — Item 30) Add an explicit clean-branch or scoped-verification gate to sprint closeout. Closed as codified in PLAYBOOK.md — Closeout Protocol step 0 defines verification target identification.
- (Closed during Sprint 11 — Item 30) Tighten sprint-planning acceptance criteria for external proof before execution starts. Closed as codified in PLAYBOOK.md — Planning Protocol step 3 defines external proof planning.
- (Closed during Sprint 11 — Item 30) Make it explicit that sprint execution does not stop at a response-turn boundary when committed sprint items remain. Closed as codified in PLAYBOOK.md — Sprint Start Protocol step 0 includes no-false-stop confirmation.
- (Closed during Sprint 11 — Item 30) Add sprint-summary and sprint-document synchronization to the closeout checklist. Closed as codified in PLAYBOOK.md — Closeout Protocol step 6 defines the synchronization checklist.
- (Closed during Sprint 9 planning) Standardize sprint item and closeout branches on `origin/main` rather than assuming local `main` is current. Closed as adopted practice — sprint branches are consistently created from `origin/main`.
- (Closed during Sprint 9 planning) Make delegated role ownership explicit at sprint start when multi-agent collaboration is expected. Closed as adopted practice — TEAM.md personas and sprint backlog collaboration decisions make role ownership explicit.
- (Closed during Sprint 9 planning) Align team expectations for tooling decisions and delegation at sprint start. Closed as adopted practice — sprint planning consistently records developer, collaboration, and test delegation decisions.
- (Closed during Sprint 9 BOARD triage) Add an explicit Definition-of-Done evidence map to every sprint closeout. Closed as codified in PLAYBOOK.md — Closeout Protocol step 2 defines the evidence map structure and minimum evidence requirements.
- (Closed during Sprint 9 BOARD triage) Add an explicit pre-review consistency check to every sprint closeout. Closed as codified in PLAYBOOK.md — Closeout Protocol step 1 defines the consistency check procedure and escalation rules.
- (Closed during Sprint 9 BOARD triage) Define sprint-start documentation update rules. Closed as codified in PLAYBOOK.md — Sprint Start Protocol step 1 defines documentation update rules with minimum output requirements.
- (Closed during Sprint 9 BOARD triage) Tighten acceptance-criteria review during sprint planning. Closed as codified in PLAYBOOK.md — Planning Protocol steps 1-2 define ambiguity detection and completion language tightening.

## Notes

- This board is for process and coordination improvements owned by the Scrum Master role.
- Product-facing implementation changes belong in [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md).
