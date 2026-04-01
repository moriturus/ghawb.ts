# Scrum Master Board

This board tracks Scrum Master owned team-improvement follow-up items.

## Priority-Ordered TODO

1. Make sprint closeout waiting behavior explicit when hosted proof is still pending on the sprint-level PR.
   Scope: when local implementation, review, and documentation are already complete, decide explicitly whether the coordinator should keep waiting for hosted CI to finish, report a pending handoff state, or schedule a follow-up check so closeout expectations are not ambiguous.
   Status: Concretized as product backlog Item 30 (sprint ceremony process hardening).
2. Require sprint review and retrospective notes to reference either a clean review snapshot or an explicitly scoped working-tree evidence note.
   Scope: before finalizing review or retrospective docs, record whether the evidence comes from a clean committed snapshot or from a scoped dirty-worktree state so later readers can judge the strength of the audit trail correctly.
   Status: Concretized as product backlog Item 30 (sprint ceremony process hardening).
3. Add an explicit clean-branch or scoped-verification gate to sprint closeout.
   Scope: before declaring closeout green, confirm whether verification is expected against a clean branch or a scoped file set so unrelated worktree changes do not block the sprint unexpectedly.
   Status: Concretized as product backlog Item 30 (sprint ceremony process hardening).
4. Tighten sprint-planning acceptance criteria for external proof before execution starts.
   Scope: resolve whether hosted proof must come from push runs, pull-request runs, deployments, or other external artifacts during planning so closeout does not depend on Product Owner exceptions.
   Status: Concretized as product backlog Item 30 (sprint ceremony process hardening).
5. Make it explicit that sprint execution does not stop at a response-turn boundary when committed sprint items remain.
   Scope: when using scripted sprint-execution workflows such as `do-sprint`, require the coordinator to continue to the next ready item unless a documented stop condition is hit, instead of treating a status report or turn boundary as implicit completion.
   Status: Concretized as product backlog Item 30 (sprint ceremony process hardening).
6. Add sprint-summary and sprint-document synchronization to the closeout checklist.
   Scope: before calling sprint closeout complete, confirm that the sprint backlog summary status, sprint review note, retrospective note, and documentation index are all updated or intentionally deferred with a recorded reason.
   Status: Concretized as product backlog Item 30 (sprint ceremony process hardening).

## Closed Items

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
