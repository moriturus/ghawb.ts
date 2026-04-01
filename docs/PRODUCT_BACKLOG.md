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

Sprint 9 committed `Item 24` through `Item 27` into the sprint backlog (with `Item 26` re-estimated from 4 to 5 SP during refinement). After Sprint 9, an external GPT-based review evaluated the project on three axes (commercial quality 6.6/10, OSS quality 8.0/10, maintainer mergability: high) and identified feature coverage breadth as the primary weakness. The team conducted a backlog intake to address the review findings, adding four new items (Items 32–35) alongside the four existing items (Items 28–31). Sprint 10 committed `Item 28`, `Item 31`, `Item 34`, and `Item 32` (12 SP, resequenced: coverage gate before workflow_call). Four items remain unselected below in priority order.

### Item 33: Job container and services

- Why: Running jobs inside Docker containers and with service containers (databases, caches, etc.) is a common pattern in CI workflows. The external GPT review identified container/services as part of the broader syntax gap. Adding container support enables the SDK to express integration-testing and deployment workflows that require controlled execution environments.
- Prerequisites: Item 28 (workflow-level defaults) should land first because container jobs often combine with workflow-level defaults. No hard dependency on Item 32 (workflow_call).
- Implementation Plan: Add optional `container` to the job model with `image` (required string), `credentials` (username/password), `env`, `ports`, `volumes`, and `options`. Add optional `services` map to the job model where each service has the same shape as `container`. Validate required fields (image must be non-blank), validate that ports are valid port mappings, render `container` and `services` in canonical job-field positions. Update conformance fixtures. Update SPEC.md.
- Definition of Done: Jobs support optional `container` with image, credentials, env, ports, volumes, and options. Jobs support optional `services` map with per-service container configuration. Validation rejects malformed entries. Rendering is deterministic. Conformance fixtures cover container and services across runtimes. SPEC.md is updated. The change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can define a job with a `container` image and configuration. Users can define service containers for a job. Blank or missing container images fail at build time. Container and services compose correctly with existing job features. Cross-runtime conformance fixtures are added.
- Story Points: 3
- Status: pending
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md). Container and services follow the same explicit-boundary pattern from ADR 0001. Port mapping validation should handle both number and string forms (`8080` and `8080:8080`).

### Item 35: Validation error diagnostic improvement

- Why: The SDK currently fails explicitly on invalid definitions, but error messages are terse — they state what is wrong without explaining the expected format or suggesting corrections. The external GPT review identified error diagnostic quality as important for both commercial quality and developer experience. Improving error messages reduces the feedback loop for SDK users and makes the validation system more self-documenting.
- Prerequisites: Item 31 (identifier validation) should land first so format-related errors benefit from the improved diagnostic style from the start. No hard dependency on other items.
- Implementation Plan: Audit existing validation error messages across all surfaces (triggers, jobs, steps, strategy, permissions, identifiers). Enrich messages to include expected format, valid value ranges, or valid alternatives where applicable. Add fix suggestions for common mistakes (e.g., "did you mean `read-all`?" for unknown permission values). Ensure error messages are consistent in tone and structure. Add test coverage for enriched messages. Consider adding an error code system for programmatic error handling.
- Definition of Done: Validation error messages include expected formats and valid alternatives where applicable. Error message style is consistent across all validation surfaces. Tests verify enriched messages. SPEC.md documents the error reporting contract. The change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Identifier format errors include the expected pattern. Type validation errors include the set of valid values. Permissions errors list the valid permission keys. Error messages follow a consistent structure (what failed, what was expected, optionally how to fix). Existing error assertion tests are updated to match enriched messages.
- Story Points: 3
- Status: pending
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md). This item touches validation messages across all existing surfaces, so the scope is cross-cutting. The implementation should avoid breaking existing programmatic error handling patterns (e.g., `error.issues` array structure).

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
- Prerequisites: Ideally follows the SDK surface expansions (`Items 20–28`, and optionally `Items 32–33`) so the self-hosted workflows can exercise the broader feature set, but can proceed with whatever SDK surface is available at execution time.
- Implementation Plan: Expand committed workflow modules to exercise more SDK features (env, permissions, concurrency, matrix, conditionals, container/services if available) where they naturally apply, verify the expanded self-hosting through existing guardrails, prepare `jsr.json` and `package.json` exports for publishable packages, add package entry point validation, document the distribution path in SPEC.md, and update conformance fixtures if new workflow patterns are introduced.
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
- Ordered delivery guidance: The remaining backlog is ordered Item 33 → Item 35 → Item 30 → Item 29. Item 29 must stay last. Sprint 10 committed Items 28, 31, 34, and 32 (resequenced: coverage gate before workflow_call). The Sprint 7 retrospective conformance-fixture rule is honored for all SDK-surface items.
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
