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

Sprint 11 committed `Item 33`, `Item 35`, `Item 30`, and `Item 29` (12 SP) into the sprint backlog. The product backlog is now empty — all items from the post-Sprint 7 intake and post-Sprint 9 GPT review intake have been selected into sprints.

## Prioritization Notes

- Team intake decision: After Sprint 7 closeout exhausted the previously planned backlog, the whole team agreed to refill the product backlog with ten items that balance workflow-surface expansion, SDK completeness, and distribution readiness. Sprint 8 committed `Item 20` through `Item 23`. Sprint 9 committed `Item 24` through `Item 27`.
- Product Owner intake rationale (Aoi Sakamoto): Prioritize filling the most impactful SDK feature gaps first — `env` maps and trigger completeness are table-stakes for real workflow authoring. Cross-job data flow (`step id` + `job outputs`) and strategy completion follow because they unlock materially new workflow patterns. Distribution readiness is last because the SDK surface must stabilize before external consumers arrive.
- Scrum Master intake rationale (Ren Takahashi): Keep dependency order flat where possible to reduce sequencing friction. Most items have no hard prerequisites, which allows sprint planning flexibility. `Item 29` is intentionally last because it benefits from the broadened surface. The Sprint 7 retrospective rule — every workflow-surface expansion must include cross-runtime conformance fixture updates in the same slice — applies to every item in this intake.
- Developer intake rationale (Mio Kanda — SDK/Architecture): The items preserve the explicit-boundary pattern from ADR 0001. Each item adds one coherent AST surface with builder API, validation, deterministic rendering, and conformance fixtures. No item introduces implicit behavior, discovery, or YAML input.
- Developer intake rationale (Haru Nishimura — Quality/Testing): Every item explicitly includes conformance fixture updates. The ordering allows validation patterns to be established early (env, triggers) and reused in later items (outputs, strategy). Property-based testing for determinism is desirable but not required in this intake scope.
- Developer intake rationale (Yui Morita — Tooling/Workflow): Self-hosting expansion (`Item 29`) is the right capstone because it proves the broader SDK surface in the repository's own workflows. Packaging readiness in the same item gives distribution a concrete starting point without splitting it into a separate slice that might drift.
- Ordered delivery guidance: The remaining backlog was ordered Item 33 → Item 35 → Item 30 → Item 29. Item 29 must stay last. Sprint 10 committed Items 28, 31, 34, and 32 (resequenced: coverage gate before workflow_call). Sprint 11 committed the final four items (Items 33, 35, 30, 29) in the documented priority order. The Sprint 7 retrospective conformance-fixture rule is honored for all SDK-surface items.
- Sprint 10 selection decision: Sprint 10 commits Item 28 (3 SP), Item 31 (2 SP), Item 34 (2 SP), and Item 32 (5 SP) for 12 SP with a 3 SP buffer. Item 34 was resequenced ahead of Item 32 within the sprint because the coverage gate rationale — "validates the 100% coverage goal before more surfaces are added" — favors activating enforcement before the largest surface expansion. The Product Owner approved the intra-sprint resequencing. Item 32's 5 SP estimate was confirmed during refinement (discriminated union complexity already priced in). Canonical field orders for new surfaces (workflow-level defaults position, reusable-workflow job fields, workflow_call trigger fields) were pre-defined during refinement per Sprint 9 retrospective guidance.
- Sprint 9 BOARD triage decision: Eight remaining BOARD items were triaged. Four were closed as already codified in PLAYBOOK.md (#4 DoD evidence map, #6 pre-review consistency, #7 sprint-start doc rules, #8 acceptance criteria review). Four were concretized as product backlog Item 30 (#1 closeout waiting, #2 evidence provenance, #3 verification gate, #5 external proof planning). Sprint 8 retrospective product improvement (identifier format validation) was concretized as Item 31.
- Product Owner priority adjustment (Aoi Sakamoto): Reordered the backlog to Item 28 → Item 31 → Item 30 → Item 29. SDK feature gap (Item 28) first, then validation hardening (Item 31) to solidify the API surface before distribution, then process hardening (Item 30) to improve ceremonies before the capstone sprint, then distribution readiness (Item 29) last as established. Item 31 before Item 30 because external consumer quality gates outweigh internal process friction reduction.
- GPT review intake decision (post-Sprint 9): An external GPT review evaluated the project and identified feature coverage breadth as the primary weakness (commercial quality 6.6/10). The review confirmed Items 28 and 31 as high-priority, and recommended adding broader syntax coverage, coverage measurement, and error diagnostic improvement. The team conducted a full intake discussion below.
- Team GPT review discussion (Mio Kanda — SDK/Architecture): `workflow_call` is architecturally significant because it introduces a new job variant — a reusable-workflow job has `uses` at the job level instead of `steps`. This requires a discriminated union in the job model and mutual exclusion validation. Container/services is a separate but well-scoped surface extension following existing patterns. Both items follow ADR 0001's explicit-boundary pattern and can reuse the existing validation, rendering, and conformance infrastructure.
- Team GPT review discussion (Haru Nishimura — Quality/Testing): Coverage measurement is overdue. The project claims 100% coverage as a goal but has no measurement. Adding a coverage gate is low-effort (Vitest supports it natively) and high-value for credibility. The error diagnostic improvement item is cross-cutting — it touches all existing validation surfaces — so it should come after the validation surfaces stabilize. Sequencing it after Item 31 (identifier validation) and Item 32 (workflow_call) ensures the diagnostic style is applied uniformly.
- Team GPT review discussion (Yui Morita — Tooling/Workflow): Coverage CI gate is straightforward with Vitest's built-in v8 provider. The `coverage` script and CI integration should take 2 SP at most. Error diagnostic improvement is more subjective — the team should agree on a message format convention before implementation starts.
- Team GPT review discussion (Ren Takahashi — Scrum Master): The four new items add 13 SP to the remaining backlog (was 11 SP, now 24 SP). That's roughly 1.5 additional sprints of work. The items are well-scoped and have clear sequencing. Coverage measurement (Item 34) can be placed early because it's infrastructure with no feature dependency. Error diagnostics (Item 35) should come after identifier validation and workflow_call so the diagnostic style applies to the broadest surface.
- Product Owner GPT review priority adjustment (Aoi Sakamoto): The GPT review confirms the team's existing strategy — fill feature gaps first, harden second, distribute last. The review's strongest signal is that feature coverage breadth is the primary weakness. Accordingly: Item 28 stays first (immediate gap fill). Item 31 stays second (validation hardening confirmed by GPT as priority #2). Item 32 (workflow_call) is placed third because it is the single highest-value missing feature — it enables an entirely new composition pattern. Item 34 (coverage) is placed fourth because it is low-effort infrastructure that validates the 100% coverage goal before more surfaces are added. Item 33 (container/services) is placed fifth as the next syntax expansion. Item 35 (error diagnostics) is placed sixth because it is cross-cutting and benefits from a stabilized surface. Item 30 (process hardening) remains before the capstone. Item 29 (distribution) remains last. This order optimizes for the GPT review's recommendation: feature breadth → validation → infrastructure → quality → process → distribution.
- Sprint 7 retrospective guidance remains in force: every workflow-surface expansion must add or update shared cross-runtime conformance fixtures in the same slice, and the explicit repository-local workflow contract must not be silently widened.
- Sprint 11 selection decision: Sprint 11 commits Item 33 (3 SP), Item 35 (3 SP), Item 30 (2 SP), and Item 29 (4 SP) for 12 SP with a 3 SP buffer. This is the final sprint — all remaining product backlog items are committed in the documented priority order. The Product Owner confirmed the execution order: Item 33 → Item 35 → Item 30 → Item 29. Item 35 benefits from Item 33 landing first so the container/services validation surface adopts the new diagnostic message format from the start. Item 29 stays last per the established capstone rule. An error message enrichment convention was approved during planning: `[scope] [field] [constraint]. Expected: [format/values]. [optional fix suggestion]`, preserving existing prefix structure.

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
