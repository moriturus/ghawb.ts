# Product Backlog

This document defines the prioritized product backlog for `ghawb`.

## Item Template

Every product backlog item in this document should use the following template.

```markdown
### Item ID: Short title

- Why:
- Prerequisites:
- Implementation Plan:
- Definition of Done:
- Acceptance Criteria:
- Story Points:
- Status:
- Completed At:
- Notes/Links:
```

Use `Completed At: N/A` for items that are not done yet. Once implementation and acceptance are complete, update the item to `Status: done`, record the completion timestamp in UTC, and move the item into the relevant sprint backlog record under `docs/sprint_backlogs/`.

## Operating Rules

- Product backlog items remain here until they are selected into a sprint.
- Sprint backlog execution must proceed from the top selected item downward.
- The team must not actively implement multiple sprint backlog items in parallel.
- Sprint backlog execution is collaborative across all roles, but each role must stay within its boundary defined in [TEAM.md](./TEAM.md).
- Every backlog item's Definition of Done must include completed code review.
- Code review for a backlog item must be performed by a persona other than the persona that held the primary implementation responsibility for the change.

## Current Product Backlog

The team reprioritized after Sprint 4 closeout. Sprint 5 committed `Item 10` through `Item 13`, Sprint 6 committed `Item 14` through `Item 16`, and Sprint 7 has now committed `Item 17` through `Item 19` into the sprint backlog. No product backlog items remain unselected.

No unselected product backlog items remain at this time.

## Prioritization Notes

- Team intake decision: After Sprint 4 closeout, the whole team agreed to refill the product backlog with ten items that balance workflow-surface expansion, repository ergonomics, and hardening work. Sprint 7 planning has now committed the final remaining three items into the sprint backlog.
- Product Owner final decision: Aoi Sakamoto confirmed the final committed delivery order for the previously remaining work as `Item 17` -> `Item 19` -> `Item 18`, and no unselected product backlog items remain after Sprint 7 planning.
- Product Owner rationale: keep the repository's multi-workflow contract next, then bring cross-runtime conformance hardening ahead of additional batch CLI expansion because the supported SDK contract now spans more surfaces than the existing runtime proof.
- Scrum Master rationale: keep dependency order explicit so repository-local workflow contract expansion stays isolated ahead of batch CLI work, and preserve cross-runtime hardening as visible sprint-planned work rather than folding it into feature delivery implicitly.
- Developer rationale: preserve the repository rule that repository-contract work comes before CLI expansion, but harden the expanded SDK rendering contract across runtimes before adding more CLI orchestration on top of it.
- Ordered delivery decision for the committed Sprint 7 scope: widen the repository's committed-workflow contract first (`Item 17`), then strengthen cross-runtime proof (`Item 19`), and only after that add the explicit batch CLI surface (`Item 18`).
- Sprint 4 retrospective guidance remains in force: if future scope broadens workflow authoring beyond the current repository-local and explicit path, that expansion must stay explicit in backlog text and must not silently widen existing guardrails.

## Sprint Backlog Records

- [Sprint 1 Backlog](./sprint_backlogs/sp1.md)
- [Sprint 2 Backlog](./sprint_backlogs/sp2.md)
- [Sprint 3 Backlog](./sprint_backlogs/sp3.md)
- [Sprint 4 Backlog](./sprint_backlogs/sp4.md)
- [Sprint 5 Backlog](./sprint_backlogs/sp5.md)
- [Sprint 6 Backlog](./sprint_backlogs/sp6.md)
- [Sprint 7 Backlog](./sprint_backlogs/sp7.md)
