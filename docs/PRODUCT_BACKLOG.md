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

Sprint 9 committed `Item 24` through `Item 27` into the sprint backlog (with `Item 26` re-estimated from 4 to 5 SP during refinement). After Sprint 9 planning, a BOARD triage concretized remaining process gaps and the Sprint 8 retrospective's product improvement into new backlog items. Four items remain unselected below in priority order.

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

### Item 31: Identifier format validation hardening

- Why: Step IDs (introduced in Sprint 8, Item 23) are validated for non-blank and per-job uniqueness but not against the GitHub Actions identifier format (`^[a-zA-Z_][a-zA-Z0-9_-]*$`). This was flagged as a residual risk in the Sprint 8 review and as a product improvement in the Sprint 8 retrospective. The same gap applies to other identifier-like fields: matrix axis keys and workflow dispatch input names. Adding format validation catches malformed identifiers at SDK build time rather than deferring to GitHub Actions runtime failure.
- Prerequisites: Ideally follows Sprint 9 (Items 24–27) so that matrix axis keys and dispatch input names are already implemented when format validation is applied uniformly.
- Implementation Plan: Define a shared identifier format validator using the pattern `^[a-zA-Z_][a-zA-Z0-9_-]*$`, apply it to step IDs, matrix axis keys, workflow dispatch input names, and any other identifier-like fields, update validation error messages to include the expected format, and add test coverage for format-invalid identifiers across all affected surfaces.
- Definition of Done: All identifier-like fields are validated against the GitHub Actions identifier format at build time, validation error messages clearly state the expected format, test coverage includes format-invalid cases for every affected surface, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Step IDs starting with a digit or containing invalid characters fail at build time with a clear format error, matrix axis keys with invalid characters fail at build time, workflow dispatch input names with invalid characters fail at build time, the validator is shared across all identifier surfaces to avoid duplication, and existing valid identifiers continue to pass without regression.
- Story Points: 2
- Status: pending
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md), [sprint_reviews/sp8.md](./sprint_reviews/sp8.md), [sprint_retrospectives/sp8.md](./sprint_retrospectives/sp8.md). The identifier format pattern matches GitHub Actions documentation. The shared validator should use the existing identifier factory pattern from `@ghawb/shared`.

### Item 30: Sprint ceremony process hardening

- Why: Four Scrum Master BOARD items (closeout waiting behavior, evidence provenance in review/retro notes, clean-branch verification gate, external proof planning) have been flagged repeatedly across sprints 4–8 but never formally addressed. The PLAYBOOK.md captures adjacent guidance but leaves specific operational gaps that cause recurring ambiguity during sprint closeout and review.
- Prerequisites: None. This item is documentation and process work independent of SDK feature delivery.
- Implementation Plan: Update PLAYBOOK.md to add explicit closeout waiting behavior rules (wait / handoff / follow-up decision tree when hosted proof is pending), add evidence provenance requirements to sprint review and retrospective notes (clean snapshot vs. scoped dirty-worktree), define clean-branch or scoped-verification gate criteria before sprint closeout, and add external proof planning expectations to the planning and refinement protocol. Update CONTRIBUTING.md if any contributor-facing verification expectations change.
- Definition of Done: PLAYBOOK.md documents explicit closeout waiting behavior, evidence provenance requirements, verification gate criteria, and external proof planning expectations. The four originating BOARD items are closed. CONTRIBUTING.md is updated if applicable. The change is reviewed by a non-implementing persona.
- Acceptance Criteria: PLAYBOOK.md contains a concrete decision tree for closeout waiting behavior when hosted proof is pending, sprint review and retrospective templates require an explicit evidence provenance note, the closeout protocol includes a verification-target decision gate (clean branch or scoped file set), and the planning protocol includes an external proof requirement step.
- Story Points: 2
- Status: pending
- Completed At: N/A
- Notes/Links: [scrum_master/PLAYBOOK.md](./scrum_master/PLAYBOOK.md), [scrum_master/BOARD.md](./scrum_master/BOARD.md). Consolidates BOARD items #1, #2, #3, #5 into a single deliverable backlog item.

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
- Ordered delivery guidance: The remaining backlog is ordered Item 28 → Item 31 → Item 30 → Item 29. Item 29 must stay last. Items 31 and 30 were added during Sprint 9 BOARD triage and Product Owner priority adjustment. The Sprint 7 retrospective conformance-fixture rule is honored for all SDK-surface items.
- Sprint 9 BOARD triage decision: Eight remaining BOARD items were triaged. Four were closed as already codified in PLAYBOOK.md (#4 DoD evidence map, #6 pre-review consistency, #7 sprint-start doc rules, #8 acceptance criteria review). Four were concretized as product backlog Item 30 (#1 closeout waiting, #2 evidence provenance, #3 verification gate, #5 external proof planning). Sprint 8 retrospective product improvement (identifier format validation) was concretized as Item 31.
- Product Owner priority adjustment (Aoi Sakamoto): Reordered the backlog to Item 28 → Item 31 → Item 30 → Item 29. SDK feature gap (Item 28) first, then validation hardening (Item 31) to solidify the API surface before distribution, then process hardening (Item 30) to improve ceremonies before the capstone sprint, then distribution readiness (Item 29) last as established. Item 31 before Item 30 because external consumer quality gates outweigh internal process friction reduction.
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
