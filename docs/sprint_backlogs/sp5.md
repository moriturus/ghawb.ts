# Sprint Backlog: Sprint 5

This document records the selected sprint backlog and planning decisions for Sprint 5.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 5: 13/15 story points.

Status: done

Completed At: 2026-03-30T16:50:56Z

## Planning Notes

- Capacity decision: Sprint 5 capacity is fixed at 15 story points, matching the recent sprint planning baseline used in Sprint 1 through Sprint 4.
- Selection decision: Sprint 5 commits `Item 10`, `Item 11`, `Item 12`, and `Item 13` for a total of 13 story points.
- Ordering decision: Sprint 5 preserves the required execution order from the top of the product backlog and therefore takes the largest prefix that fits within capacity.
- Dependency decision: `Item 11` remains sequenced after `Item 10` because trigger-surface expansion should move from `workflow_dispatch` to `schedule` without reopening the trigger model twice, and `Item 13` remains sequenced after `Item 12` because job dependency modeling should settle before matrix expansion increases job-shape complexity.
- Scope decision: Sprint 5 focuses on thin SDK and renderer expansions for common GitHub Actions trigger and job-authoring paths before any broader permissions, execution-control, repository-contract, or CLI surface work.
- Item 10 decision: The initial `workflow_dispatch` slice must stay AST-first, validate unsupported shapes explicitly, preserve deterministic rendering, and update documentation for the supported trigger boundary.
- Item 11 decision: The initial `schedule` slice must support one or more explicit cron entries under `on.schedule`, reject blank or malformed schedules explicitly, and preserve stable emitted trigger ordering.
- Item 12 decision: The initial `needs` slice must validate referenced job identifiers and duplicate dependency values before emission while preserving declared dependency order in rendered output.
- Item 13 decision: The initial matrix slice stays intentionally narrow: support a single `strategy.matrix` object whose keys map to non-empty arrays, reject empty arrays and malformed matrix shapes explicitly, and leave broader matrix features such as `include` or `exclude` as future backlog intake rather than silent scope creep.
- External proof decision: Sprint 5 closeout should treat a green pull-request GitHub Actions run for the relevant change as the default hosted proof artifact unless a later backlog refinement records an explicit exception.
- Documentation decision: Sprint 5 delivery is expected to update `docs/SPEC.md` as each committed item lands, update `docs/PRODUCT_BACKLOG.md` and this sprint backlog record during closeout, and update `docs/INDEX.md` only if new Markdown artifacts are added beyond this sprint backlog file.
- Tooling decision: Bun-run Vitest remains the primary automated test authority, Node-run Vitest remains the compatibility confirmation path, Deno remains smoke-only coverage, `bun run typecheck` remains the typecheck surface, and `bun run verify:pre-push` remains the minimum closeout command.
- Collaboration decision: Sprint execution will keep one backlog item active at a time while using team personas within each item, with Aoi Sakamoto owning scope and acceptance decisions, Ren Takahashi owning sequencing and review readiness, Mio Kanda expected to lead the AST and SDK implementation slices for the top trigger items, Haru Nishimura expected to own validation and review coverage, and Yui Morita expected to support tooling and documentation follow-through within the active item.
- Buffer decision: The remaining 2 story points are intentionally left unallocated because `Item 14` would raise Sprint 5 scope to 17 story points and no smaller in-order backlog item exists after `Item 13`.

## Committed Items

### Item 10: Support manual workflow dispatch triggers

- Why: `workflow_dispatch` is one of the most common GitHub Actions entrypoints for release, maintenance, and recovery flows, and the current SDK cannot model it at all.
- Prerequisites: The current trigger model and renderer contract from Sprint 1 and Sprint 2 must remain deterministic and emitter-agnostic.
- Implementation Plan: Extend the workflow AST and builder API to support `workflow_dispatch`, validate its allowed shape explicitly, render it deterministically, and cover representative success and failure cases in Bun and Node tests.
- Definition of Done: The SDK can build and render workflows with `workflow_dispatch`, invalid definitions fail explicitly, documentation reflects the new supported trigger, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A representative workflow can emit a top-level `workflow_dispatch` trigger, the builder does not silently coerce invalid trigger definitions, and rendering remains deterministic across repeated runs.
- Story Points: 2
- Status: done
- Completed At: 2026-03-30T13:28:43Z
- Notes/Links: [SPEC.md](../SPEC.md), [TEAM.md](../TEAM.md), [PR #1](https://github.com/moriturus/ghawb.ts/pull/1). Planning decision: Sprint 5 keeps this slice AST-first and validation-driven, and expects Mio Kanda to carry the primary implementation responsibility with Haru Nishimura as the preferred non-implementing reviewer. Closeout evidence: commit [`f431c23`](https://github.com/moriturus/ghawb.ts/commit/f431c239b8ee10fd1089e280afe0db0bd859b298), PR [`#1`](https://github.com/moriturus/ghawb.ts/pull/1) merged at `2026-03-30T13:28:43Z`, hosted check run [`check`](https://github.com/moriturus/ghawb.ts/actions/runs/23747108284/job/69178583410) succeeded, non-implementing review comment recorded on the PR, and Product Owner acceptance recorded in [issue comment](https://github.com/moriturus/ghawb.ts/pull/1#issuecomment-4155099289).

### Item 11: Support scheduled workflow triggers

- Why: Many practical CI and maintenance workflows rely on cron-based `schedule` triggers, and their absence blocks a meaningful class of GitHub Actions workflows.
- Prerequisites: `Item 10` should land first so trigger-surface expansion proceeds from the simplest manual trigger to the first structured time-based trigger without reopening trigger modeling decisions twice.
- Implementation Plan: Add `schedule` trigger support with explicit cron-list modeling and validation, extend deterministic rendering for schedule arrays, and document the supported schedule contract and failure cases.
- Definition of Done: The SDK can express scheduled workflows with explicit validation and deterministic rendering, tests cover success and failure paths, and the completed change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A workflow can emit one or more cron schedules under `on.schedule`, blank or malformed schedule entries fail explicitly, and emitted trigger ordering remains stable.
- Story Points: 3
- Status: done
- Completed At: 2026-03-30T13:47:16Z
- Notes/Links: [SPEC.md](../SPEC.md), [LEARN.md](../LEARN.md), [PR #3](https://github.com/moriturus/ghawb.ts/pull/3). Planning decision: Sprint 5 treats this as the second trigger-surface slice immediately after `Item 10`, with hosted proof expectations aligned to a green pull-request run at closeout. Closeout evidence: commit [`5c4fab0`](https://github.com/moriturus/ghawb.ts/commit/5c4fab0d6f19a3c7f0e663252163e4e34435e03c), PR [`#3`](https://github.com/moriturus/ghawb.ts/pull/3) hosted check run [`check`](https://github.com/moriturus/ghawb.ts/actions/runs/23748049809/job/69181977408) succeeded, non-implementing review comment recorded on the PR, and Product Owner acceptance recorded in [issue comment](https://github.com/moriturus/ghawb.ts/pull/3#issuecomment-4155181425).

### Item 12: Support job dependency graphs with `needs`

- Why: Without `needs`, the SDK cannot express basic multi-job pipelines with explicit execution order, which sharply limits real workflow composition.
- Prerequisites: Existing job identifier validation and immutable built-workflow guarantees must remain intact.
- Implementation Plan: Extend the workflow job model and builder surface to support `needs`, validate referenced job identifiers and duplicate dependency values, render dependency arrays deterministically, and add regression tests for topological and failure cases.
- Definition of Done: Supported workflows can declare job dependencies through the SDK, invalid dependency references fail explicitly before emission, documentation reflects the new job capability, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Jobs can depend on one or more previously declared job identifiers, unknown or duplicate `needs` entries fail explicitly, and the rendered YAML preserves declared dependency order.
- Story Points: 3
- Status: done
- Completed At: 2026-03-30T13:56:44Z
- Notes/Links: [SPEC.md](../SPEC.md), [adrs/0001-record-architecture-principles.md](../adrs/0001-record-architecture-principles.md), [PR #5](https://github.com/moriturus/ghawb.ts/pull/5). Planning decision: Sprint 5 positions this as the first job-graph feature before any higher-cardinality job expansion. Closeout evidence: commit [`eb61e7a`](https://github.com/moriturus/ghawb.ts/commit/eb61e7a68973eec5089174a525f45ac3b0cbf9fe), PR [`#5`](https://github.com/moriturus/ghawb.ts/pull/5) merged at `2026-03-30T13:56:44Z`, hosted check run [`check`](https://github.com/moriturus/ghawb.ts/actions/runs/23748467811/job/69183481373) succeeded, non-implementing review comment recorded on the PR, and Product Owner acceptance recorded in [issue comment](https://github.com/moriturus/ghawb.ts/pull/5#issuecomment-4155244370).

### Item 13: Support matrix strategy on jobs

- Why: Matrix builds are core GitHub Actions functionality for runtime and platform coverage, and they are currently impossible to author through `ghawb`.
- Prerequisites: `Item 12` should be completed first so multi-job dependency modeling is settled before adding higher-cardinality job expansion.
- Implementation Plan: Add job strategy and matrix modeling to the AST and builder API, validate supported matrix shapes and empty-value failures, render deterministic matrix objects, and demonstrate representative Bun, Node, or Deno variant workflows.
- Definition of Done: The SDK supports a bounded initial matrix strategy surface with explicit validation and deterministic rendering, tests cover representative matrices, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A job can define a supported strategy matrix, invalid empty or malformed matrix definitions fail explicitly, and repeated renders produce identical YAML structure for the same matrix input.
- Story Points: 5
- Status: done
- Completed At: 2026-03-30T16:50:56Z
- Notes/Links: [SPEC.md](../SPEC.md), [README.md](../../README.md), [PR #7](https://github.com/moriturus/ghawb.ts/pull/7). Planning decision: the Sprint 5 slice is intentionally limited to a single `strategy.matrix` object whose keys map to non-empty arrays, leaving broader matrix features such as `include` and `exclude` for future backlog intake. Closeout evidence: commit [`6d9dd0a`](https://github.com/moriturus/ghawb.ts/commit/6d9dd0addae852515a260e00f182334e90e04987), PR [`#7`](https://github.com/moriturus/ghawb.ts/pull/7) merged at `2026-03-30T16:50:56Z`, hosted check run [`check`](https://github.com/moriturus/ghawb.ts/actions/runs/23756633217/job/69212970895) succeeded, non-implementing review comment recorded on the PR, and Product Owner acceptance recorded in [issue comment](https://github.com/moriturus/ghawb.ts/pull/7#issuecomment-4156546408).
