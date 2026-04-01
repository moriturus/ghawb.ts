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

Sprint 9 committed `Item 24` through `Item 27` into the sprint backlog (with `Item 26` re-estimated from 4 to 5 SP during refinement). Two items remain unselected below in priority order.

### Item 28: Workflow-level defaults and permissions shorthand

- Why: Workflow-level `defaults.run` (shared shell and working-directory for all jobs) and permissions shorthand forms (`read-all`, `write-all`) are commonly used in real workflows. The SDK currently supports `defaults.run` only at the job level and explicitly rejects permissions shorthand.
- Prerequisites: None directly. The existing job-level `defaults.run` and permissions object-map patterns provide clear extension models.
- Implementation Plan: Add workflow-level `defaults.run` to the workflow builder and AST, reuse the existing `DefaultsRun` validation, add shorthand permissions support (`read-all`, `write-all`) at both workflow and job levels as alternatives to object maps, validate mutual exclusion between shorthand and object-map forms, render in canonical positions, and update conformance fixtures.
- Definition of Done: Workflow-level `defaults.run` renders correctly, permissions shorthand forms are accepted alongside existing object maps, mutual exclusion is validated, rendering is deterministic, conformance fixtures cover both expansions across runtimes, SPEC.md is updated, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can set `defaults.run` at the workflow level, users can use `read-all` or `write-all` as permissions values, combining shorthand and object-map permissions on the same scope fails at build time, and the rendered YAML matches GitHub Actions expected structure.
- Story Points: 3
- Status: pending
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md). This item deliberately widens the permissions boundary documented in SPEC.md; the specification must be updated to reflect the expanded supported forms.

### Item 29: Self-hosting expansion and package distribution readiness

- Why: The two committed self-hosted workflows currently exercise only a narrow slice of the SDK surface (basic triggers, run/uses steps). Expanding self-hosted workflows to use more supported features proves the SDK in production context. Additionally, the project has no package distribution mechanism yet — preparing JSR and npm publishing configuration is a prerequisite for external adoption.
- Prerequisites: Ideally follows the SDK surface expansions (`Items 20–28`) so the self-hosted workflows can exercise the broader feature set, but can proceed with whatever SDK surface is available at execution time.
- Implementation Plan: Expand committed workflow modules to exercise more SDK features (env, permissions, concurrency, matrix, conditionals) where they naturally apply, verify the expanded self-hosting through existing guardrails, prepare `jsr.json` and `package.json` exports for publishable packages, add package entry point validation, document the distribution path in SPEC.md, and update conformance fixtures if new workflow patterns are introduced.
- Definition of Done: Self-hosted workflows exercise a materially broader slice of the supported SDK surface, guardrails verify the expanded mappings, package manifests are configured for JSR and npm publication, entry points are validated, SPEC.md documents the distribution contract, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: At least one committed workflow exercises features beyond basic triggers and steps (e.g., env, permissions, concurrency, or matrix), package exports resolve correctly for both JSR and npm consumers, and `bun run verify:workflows` passes with the expanded self-hosted surface.
- Story Points: 4
- Status: pending
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md), [jsr.json](../../jsr.json), [package.json](../../package.json). This item is intentionally last because it benefits from the widened SDK surface delivered by earlier items.

## Prioritization Notes

- Team intake decision: After Sprint 7 closeout exhausted the previously planned backlog, the whole team agreed to refill the product backlog with ten items that balance workflow-surface expansion, SDK completeness, and distribution readiness. Sprint 8 committed `Item 20` through `Item 23`. Sprint 9 committed `Item 24` through `Item 27`.
- Product Owner intake rationale (Aoi Sakamoto): Prioritize filling the most impactful SDK feature gaps first — `env` maps and trigger completeness are table-stakes for real workflow authoring. Cross-job data flow (`step id` + `job outputs`) and strategy completion follow because they unlock materially new workflow patterns. Distribution readiness is last because the SDK surface must stabilize before external consumers arrive.
- Scrum Master intake rationale (Ren Takahashi): Keep dependency order flat where possible to reduce sequencing friction. Most items have no hard prerequisites, which allows sprint planning flexibility. `Item 29` is intentionally last because it benefits from the broadened surface. The Sprint 7 retrospective rule — every workflow-surface expansion must include cross-runtime conformance fixture updates in the same slice — applies to every item in this intake.
- Developer intake rationale (Mio Kanda — SDK/Architecture): The items preserve the explicit-boundary pattern from ADR 0001. Each item adds one coherent AST surface with builder API, validation, deterministic rendering, and conformance fixtures. No item introduces implicit behavior, discovery, or YAML input.
- Developer intake rationale (Haru Nishimura — Quality/Testing): Every item explicitly includes conformance fixture updates. The ordering allows validation patterns to be established early (env, triggers) and reused in later items (outputs, strategy). Property-based testing for determinism is desirable but not required in this intake scope.
- Developer intake rationale (Yui Morita — Tooling/Workflow): Self-hosting expansion (`Item 29`) is the right capstone because it proves the broader SDK surface in the repository's own workflows. Packaging readiness in the same item gives distribution a concrete starting point without splitting it into a separate slice that might drift.
- Ordered delivery guidance: The remaining backlog (`Item 28` and `Item 29`) is ordered by priority. `Item 29` must stay last. The Sprint 7 retrospective conformance-fixture rule is honored.
- Sprint 7 retrospective guidance remains in force: every workflow-surface expansion must add or update shared cross-runtime conformance fixtures in the same slice, and the explicit repository-local workflow contract must not be silently widened.

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
