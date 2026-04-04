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

### Item 56: String shorthand for step name in `uses()` and `run()`

- Why: The second parameter of `uses()` and `run()` is a `StepMetadata` object, but in practice the most frequently specified field is `name` alone. Allowing `job.uses("actions/checkout@v4", "Checkout")` instead of `job.uses("actions/checkout@v4", { name: "Checkout" })` would reduce boilerplate and improve readability for everyday workflow authoring.
- Prerequisites: None.
- Implementation Plan: Widen the second parameter type of `uses()` and `run()` to `StepMetadata | string`. When a string is passed, interpret it as `{ name: value }`. Preserve full backward compatibility for existing `StepMetadata` object usage. Evaluate whether `runScript()` should receive the same treatment, since it carries a similar metadata parameter. Validation (e.g. empty-string rejection) follows the existing `name` field rules.
- Definition of Done: `uses()` and `run()` accept a string as the second parameter and interpret it as the step name. Existing object-form usage remains backward compatible. Tests and code review are completed.
- Acceptance Criteria: `job.uses("actions/checkout@v4", "Checkout")` behaves equivalently to `job.uses("actions/checkout@v4", { name: "Checkout" })`. `job.run("npm test", "Run tests")` behaves equivalently to `job.run("npm test", { name: "Run tests" })`. Existing `StepMetadata` object usage works without changes.
- Story Points: 2
- Status: new
- Completed At: N/A
- Notes/Links: Originated from PO feedback after the Sprint 16 review. Applicability to `runScript()` to be decided during implementation.

- Historical note: Prior intake rationale, older priority adjustments, and prior sprint-selection decisions were moved to [PRODUCT_BACKLOG_HISTORY.md](./PRODUCT_BACKLOG_HISTORY.md) so this file stays focused on the active backlog.
- Sprint 16 selection note: Items 51–55 (19 SP total) were committed to Sprint 16 after estimate validation and acceptance-criteria refinement. See [Sprint 16 Backlog](./sprint_backlogs/sp16.md) for committed scope and planning notes.

## Sprint Backlog Records

- [Sprint 1 Backlog](./sprint_backlogs/sp1.md)
- [Sprint 2 Backlog](./sprint_backlogs/sp2.md)
- [Sprint 3 Backlog](./sprint_backlogs/sp3.md)
- [Sprint 4 Backlog](./sprint_backlogs/sp4.md)
- [Sprint 5 Backlog](./sprint_backlogs/sp5.md)
- [Sprint 6 Backlog](./sprint_backlogs/sp6.md)
- [Sprint 7 Backlog](./sprint_backlogs/sp7.md)
- [Sprint 8 Backlog](./sprint_backlogs/sp8.md)
- [Sprint 9 Backlog](./sprint_backlogs/sp9.md)
- [Sprint 10 Backlog](./sprint_backlogs/sp10.md)
- [Sprint 11 Backlog](./sprint_backlogs/sp11.md)
- [Sprint 12 Backlog](./sprint_backlogs/sp12.md)
- [Sprint 13 Backlog](./sprint_backlogs/sp13.md)
- [Sprint 14 Backlog](./sprint_backlogs/sp14.md)
- [Sprint 15 Backlog](./sprint_backlogs/sp15.md)
- [Sprint 16 Backlog](./sprint_backlogs/sp16.md)
