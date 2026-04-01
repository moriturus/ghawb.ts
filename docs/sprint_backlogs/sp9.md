# Sprint Backlog: Sprint 9

This document records the selected sprint backlog and planning decisions for Sprint 9.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 9: 14/15 story points.

Status: done

## Planning Notes

- Capacity decision: Sprint 9 capacity remains fixed at 15 story points, matching the Sprint 7 and Sprint 8 planning baseline.
- Selection decision: Sprint 9 commits `Item 24`, `Item 25`, `Item 26`, and `Item 27` for a total of 14 story points.
- Ordering decision: Sprint 9 preserves the backlog priority order and sequences the committed work as `Item 24` -> `Item 25` -> `Item 26` -> `Item 27`.
- Buffer decision: The remaining 1 story point is intentionally left unallocated. The buffer is smaller than Sprint 7 and Sprint 8 (2 SP each) because Item 26 was re-estimated from 4 to 5 SP during refinement to account for the `choice` type's `options` field.
- Dependency decision: No hard inter-item dependencies exist within the selected slice. The backlog priority order is preserved because it follows the natural AST hierarchy: strategy extension (Item 24), step-level modifiers (Item 25), trigger expansion (Item 26), job-level modifiers (Item 27).
- Scope decision: Sprint 9 fills the remaining workflow-surface gaps for strategy completeness, step and job execution modifiers, and parameterized manual triggers, continuing the SDK surface expansion from Sprint 8.
- Item 24 decision: `include` entries allow arbitrary string keys (GitHub Actions permits `include` to add new matrix columns not declared in the axis list). `exclude` entries must reference only declared axis keys. Rendering order within strategy: `fail-fast`, `max-parallel`, then `matrix` with declared axes in declaration order followed by `include` then `exclude`. Test delegation will be split into builder tests, renderer tests, and conformance fixtures as parallel sub-agents per the Sprint 8 retrospective guidance for 5+ SP items.
- Item 25 decision: `continueOnError` (boolean) and `timeoutMinutes` (positive integer) are added to both `RunStepMetadata` and `StepMetadata`, available on `run` and `uses` steps. Canonical step field order: `name`, `id`, `if`, `env`, `shell`, `with`, `working-directory`, `continue-on-error`, `timeout-minutes`, then `run` or `uses`. These render after execution modifiers and before the command body.
- Item 26 decision: The `workflow_dispatch` trigger boundary is intentionally expanded to support `inputs`. Each input supports `description` (string), `required` (boolean), `default` (string), `type` (string enum: `string`, `boolean`, `choice`, `number`, `environment`), and `options` (non-empty string array, required when `type` is `choice`). Input names are validated as non-blank. SPEC.md must be updated to reflect the expanded `workflow_dispatch` contract. Item re-estimated from 4 to 5 SP to account for the `options` field's conditional validation complexity.
- Item 27 decision: Job-level `if` renders before `needs` in canonical job-field order. Job-level `continue-on-error` renders after `needs`. Updated canonical job field order: `if`, `needs`, `continue-on-error`, `permissions`, `timeout-minutes`, `defaults`, `concurrency`, `env`, `strategy`, `runs-on`, `outputs`, `steps`.
- Identifier format validation decision: New identifier-like fields (matrix axis keys, dispatch input names) use structural validation only (non-blank, type checks, uniqueness where applicable). Format validation against GitHub Actions runtime identifier constraints is out of scope for this sprint, consistent with the Sprint 8 step ID pattern.
- Conformance fixture rule: Every item in Sprint 9 must add or update shared cross-runtime conformance fixtures in the same slice, per the Sprint 7 retrospective guidance.
- BOARD triage decision: Scrum Master BOARD items #2 (standardize branches on origin/main), #8 (make delegated role ownership explicit), and #11 (align tooling expectations at sprint start) were closed as adopted practice during Sprint 9 planning. Eight BOARD items remain open.
- Product Owner decision: Aoi Sakamoto confirmed the execution order `Item 24` -> `Item 25` -> `Item 26` -> `Item 27` and approved the Item 26 re-estimation from 4 to 5 SP to fully support the `choice` type with `options`.
- Scrum Master decision: Sprint 9 is ready to start with all planning decisions resolved, acceptance criteria sharpened through refinement, implementation risks identified, and the Sprint 8 collaboration model carried forward.
- Developer decision: Existing builder-time validation, deterministic renderer ordering, explicit unsupported-shape guardrails, Bun-primary verification, Node compatibility checks, and Deno compatibility evidence remain mandatory where they apply inside each Sprint 9 item.
- Collaboration decision: Sprint execution will keep one backlog item active at a time while using team personas within each item, with Aoi Sakamoto owning scope and acceptance decisions, Ren Takahashi owning sequencing, impediment tracking, and review readiness, Mio Kanda expected to lead SDK and architecture implementation, Haru Nishimura expected to lead validation and non-implementing review, and Yui Morita expected to support tooling and documentation follow-through within the active item.
- Test delegation decision: For items at 5+ SP (Items 24 and 26), test-writing delegation should be split into smaller parallel sub-agents (builder tests, renderer tests, conformance fixtures) per the Sprint 8 retrospective guidance to reduce blocking wait time.

## Committed Items

### Item 24: Strategy completion — fail-fast, max-parallel, and matrix include/exclude

- Why: The current `strategy.matrix` only supports direct axis-to-string-array mappings. Real workflows commonly use `include` to add extra combinations, `exclude` to remove specific entries, `fail-fast` to control failure behavior, and `max-parallel` to limit concurrency. These are needed for any non-trivial matrix strategy.
- Prerequisites: None directly, but sequenced after step IDs (`Item 23`) because matrix workflows frequently use step outputs for downstream composition.
- Implementation Plan: Extend the strategy model with optional `failFast` (boolean), `maxParallel` (positive integer), and matrix `include`/`exclude` (arrays of record objects), validate that `exclude` entries reference declared axis keys while `include` entries allow arbitrary string keys, render in canonical order (`fail-fast`, `max-parallel` before `matrix`; `include`/`exclude` after axes within matrix), and update conformance fixtures.
- Definition of Done: Strategy builders support `failFast`, `maxParallel`, `include`, and `exclude`, validation rejects malformed entries explicitly, rendering is deterministic and canonical, conformance fixtures cover the expanded strategy surface across runtimes, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can define strategy with `failFast`, `maxParallel`, and matrix `include`/`exclude` modifiers, validation rejects non-boolean `failFast`, non-positive-integer `maxParallel`, and malformed include/exclude entries, `include` entries accept arbitrary string keys including keys not declared as matrix axes, `exclude` entries referencing undeclared axis keys fail at build time, empty `include`/`exclude` arrays are omitted from rendering, the strategy composes with existing axis-based matrix declarations, and cross-runtime conformance fixtures are added in the same slice.
- Story Points: 5
- Status: done
- Completed At: 2026-04-01T07:45:00Z
- Notes/Links: [SPEC.md](../SPEC.md). ADR 0001 requires explicit validation; matrix `include`/`exclude` must not silently accept malformed entries. Test delegation should be split into parallel sub-agents per Sprint 8 retrospective guidance. PR #22 merged into sprint-9 branch.

### Item 25: Step continue-on-error and timeout-minutes

- Why: Steps in real workflows frequently need `continue-on-error` for resilience (e.g., optional linting steps) and `timeout-minutes` to prevent runaway steps. Neither is currently supported.
- Prerequisites: None.
- Implementation Plan: Add optional `continueOnError` (boolean) and `timeoutMinutes` (positive integer) fields to both `RunStepMetadata` and `StepMetadata`, extend builder metadata types, validate types strictly, render `continue-on-error` and `timeout-minutes` after `working-directory` and before `run`/`uses` in canonical step-field order, and update conformance fixtures.
- Definition of Done: Steps support optional `continue-on-error` and `timeout-minutes`, validation rejects invalid types, rendering is deterministic in the canonical step-field position, conformance fixtures cover the new fields across runtimes, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can set `continueOnError` and `timeoutMinutes` on any step (`run` or `uses`), non-boolean `continueOnError` and non-positive-integer `timeoutMinutes` fail at build time, the fields render after `working-directory` and before `run`/`uses` in canonical step-field order, and cross-runtime conformance fixtures are added in the same slice.
- Story Points: 2
- Status: done
- Completed At: 2026-04-01T08:00:00Z
- Notes/Links: [SPEC.md](../SPEC.md). Mirrors the existing job-level `timeout-minutes` validation pattern. PR #23 merged into sprint-9 branch.

### Item 26: Workflow dispatch trigger inputs

- Why: Parameterized manual triggers are one of the most-used `workflow_dispatch` features. The SDK currently supports only a bare `workflow_dispatch` entry and explicitly rejects unsupported fields. This item deliberately expands that boundary.
- Prerequisites: None directly, but sequenced after simpler items to keep the expanded trigger model stable.
- Implementation Plan: Add an `inputs` model to `workflow_dispatch` supporting `description`, `required`, `default`, `type`, and `options` fields per input, validate input names as non-blank, validate `type` against the GitHub Actions allowlist (`string`, `boolean`, `choice`, `number`, `environment`), require `options` (non-empty string array) when `type` is `choice` and reject `options` on other types, render inputs in declared order within the trigger, update SPEC.md to reflect the expanded `workflow_dispatch` contract, and update conformance fixtures.
- Definition of Done: `workflow_dispatch` triggers support optional `inputs` with per-input metadata including `options` for `choice` type, validation rejects malformed input definitions, rendering is deterministic in declared input order, conformance fixtures cover inputs across runtimes, SPEC.md is updated, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can declare named inputs with optional `description`, `required`, `default`, `type`, and `options` fields, blank input names fail at build time, `type` values are validated against the GitHub Actions allowlist (`string`, `boolean`, `choice`, `number`, `environment`), `options` is required when `type` is `choice` and rejected on other types, unsupported input field shapes fail explicitly, the rendered YAML matches GitHub Actions expected structure for dispatch inputs, and cross-runtime conformance fixtures are added in the same slice.
- Story Points: 5
- Status: done
- Completed At: 2026-04-01T10:30:00Z
- Notes/Links: [SPEC.md](../SPEC.md). This item intentionally broadens the `workflow_dispatch` supported surface, which was previously locked to a bare trigger. SPEC.md must be updated. Re-estimated from 4 to 5 SP during Sprint 9 refinement to account for `choice` type's `options` field. Test delegation should be split into parallel sub-agents per Sprint 8 retrospective guidance. PR #24 merged into sprint-9 branch.

### Item 27: Job-level conditional and continue-on-error

- Why: Job-level `if` conditionals and `continue-on-error` are commonly used for conditional deployment jobs, optional quality gates, and fan-out patterns. Neither is currently supported at the job level.
- Prerequisites: None.
- Implementation Plan: Add optional `if` (string expression) and `continueOnError` (boolean) fields to the job model, extend the job builder API, validate non-blank `if` expressions and boolean `continueOnError`, render `if` before `needs` and `continue-on-error` after `needs` in the updated canonical job-field order (`if`, `needs`, `continue-on-error`, `permissions`, `timeout-minutes`, `defaults`, `concurrency`, `env`, `strategy`, `runs-on`, `outputs`, `steps`), and update conformance fixtures.
- Definition of Done: Jobs support optional `if` and `continue-on-error`, validation rejects blank expressions and non-boolean values, rendering is deterministic in the canonical job-field position, conformance fixtures cover the new fields across runtimes, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Users can set `if` conditions and `continueOnError` on jobs, blank `if` strings fail at build time, `if` renders before `needs` and `continue-on-error` renders after `needs` in canonical job-field order, the fields compose correctly with existing job-level features like `needs` and `permissions`, and cross-runtime conformance fixtures are added in the same slice.
- Story Points: 2
- Status: done
- Completed At: 2026-04-01T10:45:00Z
- Notes/Links: [SPEC.md](../SPEC.md). The `if` field is accepted as a plain string expression; no AST-level expression validation is in scope for this item. PR #25 merged into sprint-9 branch.
