# Scrum Master Board

This board tracks Scrum Master owned team-improvement follow-up items.

## Priority-Ordered TODO

1. Make sprint closeout waiting behavior explicit when hosted proof is still pending on the sprint-level PR.
   Scope: when local implementation, review, and documentation are already complete, decide explicitly whether the coordinator should keep waiting for hosted CI to finish, report a pending handoff state, or schedule a follow-up check so closeout expectations are not ambiguous.
2. Require sprint review and retrospective notes to reference either a clean review snapshot or an explicitly scoped working-tree evidence note.
   Scope: before finalizing review or retrospective docs, record whether the evidence comes from a clean committed snapshot or from a scoped dirty-worktree state so later readers can judge the strength of the audit trail correctly.
3. Add an explicit clean-branch or scoped-verification gate to sprint closeout.
   Scope: before declaring closeout green, confirm whether verification is expected against a clean branch or a scoped file set so unrelated worktree changes do not block the sprint unexpectedly.
4. Add an explicit Definition-of-Done evidence map to every sprint closeout.
   Scope: before marking an item done, link each completion claim to a concrete test, command result, or demo artifact so review does not discover unsupported completion claims late.
5. Tighten sprint-planning acceptance criteria for external proof before execution starts.
   Scope: resolve whether hosted proof must come from push runs, pull-request runs, deployments, or other external artifacts during planning so closeout does not depend on Product Owner exceptions.
6. Add an explicit pre-review consistency check to every sprint closeout.
   Scope: confirm implementation, tests, product backlog, sprint backlog, specification, and review notes describe the same delivered behavior before sprint review starts.
7. Define sprint-start documentation update rules.
   Scope: decide which docs must be updated during delivery, who owns each update, and when those updates are reviewed.
8. Tighten acceptance-criteria review during sprint planning.
   Scope: reject backlog items whose completion criteria allow unresolved contract ambiguity to leak into dependent future work.

## Closed Items

- (Closed during Sprint 9 planning) Standardize sprint item and closeout branches on `origin/main` rather than assuming local `main` is current. Closed as adopted practice — sprint branches are consistently created from `origin/main`.
- (Closed during Sprint 9 planning) Make delegated role ownership explicit at sprint start when multi-agent collaboration is expected. Closed as adopted practice — TEAM.md personas and sprint backlog collaboration decisions make role ownership explicit.
- (Closed during Sprint 9 planning) Align team expectations for tooling decisions and delegation at sprint start. Closed as adopted practice — sprint planning consistently records developer, collaboration, and test delegation decisions.

## Notes

- This board is for process and coordination improvements owned by the Scrum Master role.
- Product-facing implementation changes belong in [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md).
