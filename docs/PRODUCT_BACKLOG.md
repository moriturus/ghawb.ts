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

No unselected product backlog items remain after Sprint 4 planning. Add new backlog items here only after reprioritization or new scope intake.

## Prioritization Notes

- Product Owner decision: Sprint 4 commits the current follow-on scope as `Item 8`, `Item 9a`, and `Item 9b` in that order.
- Delivery order decision: Hosted CI recovery remains first, followed by contributor-facing guidance, followed by automated guardrails that enforce the clarified supported path.
- Sprint review carry-over: Hosted CI confirmation and repository-hygiene work were selected into Sprint 4 and no unselected carry-over remains.
- Sprint retrospective carry-over: Repository-local workflow-source conventions and clean-branch verification are now committed Sprint 4 scope rather than future intake guidance.
- Sprint 4 retrospective guidance: if future scope adds multiple committed workflow modules or broadens workflow authoring surfaces, create an explicit backlog item for that expansion instead of silently widening the current single-workflow guardrail contract.

## Sprint Backlog Records

- [Sprint 1 Backlog](./sprint_backlogs/sp1.md)
- [Sprint 2 Backlog](./sprint_backlogs/sp2.md)
- [Sprint 3 Backlog](./sprint_backlogs/sp3.md)
- [Sprint 4 Backlog](./sprint_backlogs/sp4.md)
