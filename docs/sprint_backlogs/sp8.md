# Sprint Backlog: Sprint 8

This document records the selected sprint backlog and planning decisions for Sprint 8.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 8: 13/15 story points.

Status: ready

## Planning Notes

- Capacity decision: Sprint 8 capacity remains fixed at 15 story points, matching the recent sprint planning baseline.
- Selection decision: Sprint 8 commits `Item 20`, `Item 21`, `Item 22`, and `Item 23` for a total of 13 story points.
- Ordering decision: Sprint 8 preserves the backlog priority order and sequences the committed work as `Item 20` -> `Item 21` -> `Item 22` -> `Item 23`.
- Dependency decision: `Item 23` is sequenced last because job `outputs` benefit from a settled `env` model (Item 20) for consistent rendering order. Items 21 and 22 are both trigger-scoped and independent, but Item 21 (activity types) comes first because it establishes the trigger-extension pattern before Item 22 (negation filters) adds mutual-exclusion complexity.
- Scope decision: Sprint 8 fills the most impactful SDK surface gaps for real workflow authoring — env maps, trigger completeness, and cross-job data flow — while keeping the scope narrower than the full backlog to maintain the buffer pattern established in Sprint 7.
- Buffer decision: The remaining 2 story points are intentionally left unallocated, matching the Sprint 7 pattern of keeping deliberate buffer rather than pulling lower-priority items out of order.
- Item 20 decision: Workflow-level `env` renders after `permissions` and before `defaults`/`concurrency` in canonical order. Job-level `env` renders after `concurrency` and before `strategy`. The existing step-level `env` pattern (`Readonly<Record<string, string>>`) extends directly to both levels.
- Item 21 decision: Pull request activity types are validated against a fixed allowlist based on GitHub Actions documentation. The `types` field is rejected on all triggers other than `pull_request`. The allowlist includes: `assigned`, `unassigned`, `labeled`, `unlabeled`, `opened`, `edited`, `closed`, `reopened`, `synchronize`, `converted_to_draft`, `ready_for_review`, `locked`, `unlocked`, `review_requested`, `review_request_removed`, `auto_merge_enabled`, `auto_merge_disabled`.
- Item 22 decision: `tags` and `tags-ignore` are valid only on `push` triggers; specifying them on `pull_request` must fail at build time. Mutual exclusion between positive and negative filter variants (`branches`/`branches-ignore`, `paths`/`paths-ignore`, `tags`/`tags-ignore`) is enforced per trigger. Builder API uses camelCase (`branchesIgnore`, `pathsIgnore`, `tagsIgnore`) rendering to kebab-case in output.
- Item 23 decision: Job output values containing `steps.<id>` reference patterns are validated against declared step IDs in the same job. Other expression forms (`needs.*`, `env.*`, literals, complex expressions) are accepted without referential validation. Step `id` renders before `if` in step payload. Job `outputs` renders after `runs-on` and before `steps` in job payload.
- Product Owner decision: Aoi Sakamoto confirmed the execution order `Item 20` -> `Item 21` -> `Item 22` -> `Item 23`, reasoning that it follows the SDK user's natural workflow authoring sequence and escalates complexity incrementally.
- Scrum Master decision: Sprint 8 is ready to start with all planning decisions resolved, acceptance criteria sharpened through refinement, implementation risks identified, and the Sprint 7 collaboration model carried forward.
- Developer decision: Existing builder-time validation, deterministic renderer ordering, explicit unsupported-shape guardrails, Bun-primary verification, Node compatibility checks, and Deno compatibility evidence remain mandatory where they apply inside each Sprint 8 item.
- Collaboration decision: Sprint execution will keep one backlog item active at a time while using team personas within each item, with Aoi Sakamoto owning scope and acceptance decisions, Ren Takahashi owning sequencing, impediment tracking, and review readiness, Mio Kanda expected to lead SDK and architecture implementation, Haru Nishimura expected to lead validation and non-implementing review, and Yui Morita expected to support tooling and documentation follow-through within the active item.
- Conformance fixture rule: Every item in Sprint 8 must add or update shared cross-runtime conformance fixtures in the same slice, per the Sprint 7 retrospective guidance.

## Committed Items

### Item 20: Workflow-level and job-level environment variable maps

- Why: Nearly every real GitHub Actions workflow uses `env` at the workflow or job level. The SDK currently supports `env` only at the step level, leaving a fundamental gap for users defining shared environment configuration.
- Prerequisites: None. The existing step-level `env` pattern provides a clear model to extend.
- Implementation Plan: Add `env` support to the workflow AST at both workflow and job levels, extend the builder API with `.env()` methods on `WorkflowBuilder` and `JobBuilder`, define deterministic rendering order for the `env` block, add validation that rejects blank keys, and update cross-runtime conformance fixtures.
- Definition of Done: Workflow-level and job-level `env` maps render deterministically, validation rejects malformed entries explicitly, conformance fixtures cover the new surface across Bun/Node/Deno, docs and SPEC.md are updated, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can declare `env` on both workflow and job builders, workflow-level `env` renders after `permissions` and before `defaults`/`concurrency`, job-level `env` renders after `concurrency` and before `strategy`, blank keys are rejected at build time, empty env maps are omitted from rendering, existing step-level `env` behavior is unchanged, and cross-runtime conformance fixtures are added in the same slice.
- Story Points: 3
- Status: done
- Completed At: 2026-04-01T01:00:00Z
- Notes/Links: [SPEC.md](../SPEC.md). Sprint 7 retrospective requires cross-runtime conformance fixture updates in the same slice as any workflow-surface expansion. PR #17 merged into sprint-8 branch.

### Item 21: Pull request activity type filters

- Why: The `types` field on `pull_request` triggers (e.g., `opened`, `synchronize`, `reopened`) is one of the most commonly used trigger filters in real workflows, and the SDK currently does not support it.
- Prerequisites: None. The existing trigger filter model can be extended.
- Implementation Plan: Add a `types` array to the `pull_request` trigger builder, validate accepted activity type names against a fixed allowlist based on GitHub Actions documentation, reject unknown types explicitly, reject `types` on non-`pull_request` triggers, render the `types` field in deterministic order, and update conformance fixtures.
- Definition of Done: Pull request triggers support an optional `types` filter, validation rejects unknown type names, rendering is deterministic, conformance fixtures cover the new filter across runtimes, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can specify `types` on pull request triggers (e.g., `['opened', 'synchronize']`), accepted types are validated against the fixed allowlist (`assigned`, `unassigned`, `labeled`, `unlabeled`, `opened`, `edited`, `closed`, `reopened`, `synchronize`, `converted_to_draft`, `ready_for_review`, `locked`, `unlocked`, `review_requested`, `review_request_removed`, `auto_merge_enabled`, `auto_merge_disabled`), unknown type names fail at build time, `types` on `push`, `workflow_dispatch`, or `schedule` triggers fails at build time, the filter composes cleanly with existing `branches` and `paths` filters, and cross-runtime conformance fixtures are added in the same slice.
- Story Points: 2
- Status: ready
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md). Scope is limited to `pull_request` activity types and does not extend to other event-specific type filters in this slice.

### Item 22: Trigger filter negation and tag filters

- Why: Real workflows commonly use `branches-ignore`, `paths-ignore`, `tags`, and `tags-ignore` to scope push and pull_request triggers. The SDK only supports positive `branches` and `paths` filters today.
- Prerequisites: None. The existing trigger filter model provides the extension point.
- Implementation Plan: Add `branches-ignore`, `paths-ignore`, `tags`, and `tags-ignore` fields to the trigger filter model, enforce mutual exclusion between positive and negative variants, restrict `tags`/`tags-ignore` to `push` triggers only, add builder methods for each using camelCase (`branchesIgnore`, `pathsIgnore`, `tags`, `tagsIgnore`), render in canonical kebab-case order, and update conformance fixtures.
- Definition of Done: Push and pull_request triggers support negation and tag filters, mutual exclusion is validated at build time, rendering is deterministic and canonical, conformance fixtures cover the new filters across runtimes, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can declare `branchesIgnore`, `pathsIgnore`, `tags`, and `tagsIgnore` on push and pull_request triggers, combining positive and negative variants on the same filter type fails explicitly (e.g., `branches` + `branchesIgnore` on the same trigger), `tags` and `tagsIgnore` on `pull_request` triggers fail at build time, rendering uses kebab-case (`branches-ignore`, `paths-ignore`, `tags-ignore`), tag filters work on push triggers, and cross-runtime conformance fixtures are added in the same slice.
- Story Points: 3
- Status: ready
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md). GitHub Actions enforces mutual exclusion between `branches` and `branches-ignore` on the same trigger; this item must replicate that constraint.

### Item 23: Step identifiers and job output declarations

- Why: Cross-job data flow is a fundamental GitHub Actions composition pattern. It requires step `id` fields (to capture step outputs) and job-level `outputs` maps (to expose values to downstream jobs). Neither is currently supported.
- Prerequisites: None directly, but this item is sequenced after `Item 20` because job `outputs` benefit from a settled `env` model for consistent rendering order.
- Implementation Plan: Add an optional `id` field to the step model with identifier validation, add a job-level `outputs` map that references step output expressions, validate step `id` uniqueness within a job, validate `steps.<id>` reference patterns in output values against declared step IDs while allowing other expression forms, render `id` before `if` in step payload and `outputs` after `runs-on` before `steps` in job payload, and update conformance fixtures.
- Definition of Done: Steps support optional `id` fields, jobs support optional `outputs` maps, validation enforces uniqueness and referential integrity for `steps.<id>` patterns, rendering is deterministic, conformance fixtures cover step IDs and job outputs across runtimes, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can assign IDs to steps and declare job outputs referencing those IDs, duplicate step IDs within a job fail at build time, output values containing `steps.<id>` patterns referencing undeclared step IDs fail at build time, other expression forms in output values are accepted without referential validation, blank `id` values and blank output keys and values fail at build time, step `id` renders before `if` in step payload, job `outputs` renders after `runs-on` and before `steps` in job payload, the rendered YAML matches GitHub Actions expected structure, and cross-runtime conformance fixtures are added in the same slice.
- Story Points: 5
- Status: ready
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md). This item unlocks the cross-job data-passing pattern that many multi-job workflows depend on. The `steps.<id>` reference validation uses pattern matching, not full expression parsing.
