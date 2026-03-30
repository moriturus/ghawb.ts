# Sprint Backlog: Sprint 6

This document records the selected sprint backlog and planning decisions for Sprint 6.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 6: 12/15 story points.

Status: in progress

Completed At: N/A

## Planning Notes

- Capacity decision: Sprint 6 capacity is fixed at 15 story points, matching the recent sprint planning baseline.
- Selection decision: Sprint 6 commits `Item 14`, `Item 15`, and `Item 16` for a total of 12 story points.
- Ordering decision: Sprint 6 preserves the required execution order from the top of the product backlog and executes the selected items as `Item 14` -> `Item 15` -> `Item 16`.
- Dependency decision: `Item 15` remains sequenced after `Item 14` because permissions support is the highest-priority remaining SDK safety gap, and `Item 16` remains sequenced after `Item 15` because job-level execution metadata conventions should settle before another workflow and job control surface is introduced.
- Scope decision: Sprint 6 focuses on three thin SDK and renderer expansions for practical GitHub Actions authoring before any repository-contract, CLI, or conformance-suite broadening.
- Item 14 decision: The sprint will support top-level and job-level `permissions` objects using the full set of known GitHub Actions permission keys, with each key limited to the explicit values `read`, `write`, or `none`; shorthand forms such as `read-all` and `write-all` remain out of scope and must still fail clearly.
- Item 15 decision: The initial execution-metadata slice is limited to job `timeout-minutes`, job `defaults.run.shell`, job `defaults.run.working-directory`, and run-step `shell` plus `working-directory`; adjacent metadata surfaces remain unsupported and must fail explicitly rather than being coerced.
- Item 16 decision: The initial concurrency slice is limited to workflow-level and job-level `concurrency` objects containing a required non-blank `group` and an optional boolean `cancel-in-progress`, with unsupported concurrency shapes still rejected before emission.
- Product Owner decision: Sprint 6 keeps the committed item order and preserves explicit supported-boundary documentation for each new surface rather than bundling shorthand or adjacent GitHub Actions fields into the same item.
- Scrum Master decision: Sprint 6 should start with explicit ownership of implementation, validation, review, and documentation follow-through for the active item, and each item must carry durable completion evidence into closeout.
- Developer decision: Existing builder-time validation, deterministic renderer ordering, unsupported-field guardrails, and Bun-primary plus Node-compatibility verification remain mandatory for every Sprint 6 item.
- Collaboration decision: Sprint execution will keep one backlog item active at a time while using team personas within each item, with Aoi Sakamoto owning scope and acceptance decisions, Ren Takahashi owning sequencing, impediment tracking, and review readiness, Mio Kanda expected to lead AST and SDK implementation, Haru Nishimura expected to lead validation and non-implementing review, and Yui Morita expected to support tooling and documentation follow-through within the active item.
- Buffer decision: The remaining 3 story points are intentionally left unallocated because `Item 17` would raise Sprint 6 scope to 17 story points and no smaller in-order backlog item exists after `Item 16`.

## Committed Items

### Item 14: Support workflow and job permissions

- Why: Real GitHub Actions workflows need explicit `permissions` control for least-privilege execution, and the current renderer even treats permissions as unsupported runtime fields.
- Prerequisites: The renderer's unsupported-field guardrail behavior from Sprint 2 must be preserved for still-unsupported keys.
- Implementation Plan: Add top-level and job-level permissions modeling, validate supported permission scopes explicitly, extend rendering in deterministic key order, and add regression tests covering both acceptance and still-unsupported permission shapes.
- Definition of Done: The SDK and renderer support the agreed permissions surface with explicit validation, unsupported permission structures still fail clearly, docs reflect the new support boundary, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A workflow can emit supported top-level and job-level `permissions`, invalid permission entries fail explicitly, workflows that use unsupported permission structures still produce actionable errors rather than silent degradation, and the supported permission-key surface covers the full set of known GitHub Actions permission keys without shorthand permission forms.
- Story Points: 4
- Status: done
- Completed At: 2026-03-30T17:26:53Z
- Notes/Links: [SPEC.md](../SPEC.md), [packages/sdk/src/renderer.test.ts](../../packages/sdk/src/renderer.test.ts), [TEAM.md](../TEAM.md), [PR #9](https://github.com/moriturus/ghawb.ts/pull/9). Planning decision: Aoi prioritized this as the highest-value safety feature after matrix support, and Sprint 6 fixes the supported boundary at top-level and job-level permission maps spanning all currently known GitHub Actions permission keys while leaving shorthand forms such as `read-all` and `write-all` out of scope. Closeout evidence: commit [`dd17480`](https://github.com/moriturus/ghawb.ts/commit/dd17480), PR review record by Haru Nishimura at [review #4032168587](https://github.com/moriturus/ghawb.ts/pull/9#pullrequestreview-4032168587), Product Owner acceptance by Aoi Sakamoto at [issue comment](https://github.com/moriturus/ghawb.ts/pull/9#issuecomment-4156790267), and verification via `bun test packages/sdk/src/workflow.test.ts packages/sdk/src/renderer.test.ts`, `bun run typecheck`, `bun run test:vitest`, and `bun run test:vitest:node`.

### Item 15: Support execution environment metadata on jobs and run steps

- Why: Practical workflow authoring needs `timeout-minutes`, `defaults.run.shell`, and `defaults.run.working-directory` style execution controls to avoid ad hoc shell duplication and brittle step definitions.
- Prerequisites: The team must agree on the initial execution-metadata slice so the first implementation does not overreach into every optional GitHub Actions field at once.
- Implementation Plan: Introduce a bounded first slice of execution-environment metadata for jobs and run steps, validate empty and conflicting values explicitly, extend rendering deterministically, and add representative builder and renderer coverage.
- Definition of Done: The agreed execution-metadata slice is supported end-to-end through builder, validation, and rendering, unsupported adjacent fields still fail clearly, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A supported workflow can define the agreed timeout and run-default fields without manual escape hatches, blank metadata values fail explicitly, emitted YAML preserves deterministic field ordering, and the supported Sprint 6 slice is limited to job `timeout-minutes`, job `defaults.run.shell`, job `defaults.run.working-directory`, and run-step `shell` plus `working-directory`.
- Story Points: 5
- Status: done
- Completed At: 2026-03-30T17:33:28Z
- Notes/Links: [SPEC.md](../SPEC.md), [TEAM.md](../TEAM.md), [PR #10](https://github.com/moriturus/ghawb.ts/pull/10). Planning decision: Yui surfaced repeated workflow-authoring friction around shell and working-directory repetition, and Aoi accepted a narrow metadata slice rather than a broad unbounded field dump. Closeout evidence: commit [`a5084b4`](https://github.com/moriturus/ghawb.ts/commit/a5084b4), PR review record by Haru Nishimura at [review #4032220548](https://github.com/moriturus/ghawb.ts/pull/10#pullrequestreview-4032220548), Product Owner acceptance by Aoi Sakamoto at [issue comment](https://github.com/moriturus/ghawb.ts/pull/10#issuecomment-4156842056), and verification via `bun test packages/sdk/src/workflow.test.ts packages/sdk/src/renderer.test.ts`, `bun run typecheck`, `bun run test:vitest`, and `bun run test:vitest:node`.

### Item 16: Support workflow and job concurrency controls

- Why: Concurrency is a common operational safeguard for canceling superseded runs and protecting shared environments, and its absence limits the usefulness of generated workflows in real repositories.
- Prerequisites: `Item 15` should land first so job-level execution metadata conventions are in place before introducing another job and workflow control surface.
- Implementation Plan: Add explicit concurrency modeling for workflow and job scopes, validate required group values and cancellation options, render the supported shape deterministically, and cover representative cancellation policies in tests.
- Definition of Done: The SDK can express the agreed concurrency controls with explicit validation and deterministic rendering, docs describe the supported boundary, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Supported workflows can emit top-level and job-level concurrency blocks, missing or blank concurrency groups fail explicitly, unsupported concurrency shapes still fail before emission, and the Sprint 6 slice is limited to `concurrency.group` plus optional boolean `concurrency.cancel-in-progress`.
- Story Points: 3
- Status: done
- Completed At: 2026-03-30T17:37:41Z
- Notes/Links: [SPEC.md](../SPEC.md), [README.md](../../README.md), [PR #11](https://github.com/moriturus/ghawb.ts/pull/11). Planning decision: Aoi ranked this after permissions and execution metadata because it is operationally valuable but less foundational than the remaining permissions and execution-control work, and Sprint 6 keeps the supported shape to the smallest deterministic concurrency object that unlocks common GitHub Actions use cases. Closeout evidence: commit [`a867e81`](https://github.com/moriturus/ghawb.ts/commit/a867e81), PR review record by Haru Nishimura at [review #4032243481](https://github.com/moriturus/ghawb.ts/pull/11#pullrequestreview-4032243481), Product Owner acceptance by Aoi Sakamoto at [issue comment](https://github.com/moriturus/ghawb.ts/pull/11#issuecomment-4156870368), and verification via `bun run typecheck`, `bun run test:vitest`, and `bun run test:vitest:node`.
