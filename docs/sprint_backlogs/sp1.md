# Sprint Backlog: Sprint 1

This document records the selected sprint backlog and completion history for Sprint 1.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 1: 15/15 story points.

Status: done

Completed At: 2026-03-29T19:50:45Z

## Planning Notes

- Capacity decision: Sprint 1 capacity is fixed at 15 story points.
- Selection decision: Sprint 1 includes `S1-1` through `S1-7` for a total of 15 story points.
- Scope decision: Sprint 1 focuses on workspace and tooling foundation plus the minimal builder-centered workflow model, not on full GitHub Actions syntax coverage.
- Trigger scope decision: Sprint 1 trigger support is limited to `push` and `pull_request` with optional `branches` and `paths`.
- Step metadata decision: Sprint 1 explicitly includes step metadata fields `name`, `env`, `with`, and `if`.
- Dependency decision: Sprint 1 implementation order is `S1-1` -> (`S1-2`, `S1-3`, `S1-4`) with `S1-5` depending on `S1-4`, `S1-6` depending on `S1-5`, and `S1-7` depending on both `S1-5` and `S1-6`.
- Deferral decision: Deterministic rendering was intentionally not pulled into Sprint 1, and post-Sprint review reprioritization now places model hardening plus Bun/Node Vitest convergence ahead of renderer delivery.
- Sequencing decision: CLI delivery remains after SDK and renderer work, consistent with the specification and ADR.
- Milestone decision: Self-hosting remains a later validation milestone after SDK, renderer, and CLI delivery.

## Delivered Items

### S1-1: Workspace and package baseline

- Why: The repository needs a stable workspace layout before any runtime-specific tooling or domain code can be added safely.
- Prerequisites: Agreement on the initial package names and the decision to prepare for a future CLI package from the start.
- Implementation Plan: Create the monorepo or workspace layout for `@ghawb/sdk`, `@ghawb/shared`, and the future `@ghawb/cli`, then add baseline package metadata and initial module boundaries.
- Definition of Done: The workspace layout exists, packages resolve correctly, and contributors can identify where SDK, shared, and future CLI code belong.
- Acceptance Criteria: The repository contains the agreed workspace structure, package naming is consistent, and the layout matches the documented architecture direction.
- Story Points: 3
- Status: done
- Completed At: 2026-03-29T19:50:45Z
- Notes/Links: Source split from former Product Backlog Item 1. [SPEC.md](../SPEC.md), [ADR 0001](../adrs/0001-record-architecture-principles.md)

### S1-2: Multi-runtime developer tooling baseline

- Why: The project quality bar requires testability and lint or format enforcement from the first implementation step across Bun, Node, and Deno.
- Prerequisites: S1-1 must exist so root and package scripts can be wired consistently.
- Implementation Plan: Add Bun, Node, and Deno test entrypoints using the selected runtime-appropriate frameworks, configure root-managed `oxlint` and `oxfmt`, and define the standard developer quality commands.
- Definition of Done: Contributors can run the agreed test, lint, format, and type-check commands from the repository root.
- Acceptance Criteria: Bun, Node, and Deno test entrypoints exist, `oxlint` and `oxfmt` are configured as project standards, and the root workflow for quality checks is documented by the repository structure.
- Story Points: 3
- Status: done
- Completed At: 2026-03-29T19:50:45Z
- Notes/Links: Source split from former Product Backlog Item 1. [SPEC.md](../SPEC.md), [ADR 0001](../adrs/0001-record-architecture-principles.md)

### S1-3: Package exports and JSR metadata baseline

- Why: The repository needs an explicit distribution contract early so package boundaries and metadata do not need to be reworked after implementation begins.
- Prerequisites: S1-1 must exist so exports and publishing metadata have concrete packages to target.
- Implementation Plan: Define the initial Node and Deno export conditions, add the baseline package metadata needed for the agreed distribution approach, and prepare the repository for future JSR publication.
- Definition of Done: The Sprint 1 packages expose an explicit initial distribution contract and include the agreed baseline metadata for future JSR publication.
- Acceptance Criteria: The relevant package manifests define the initial export conditions, the chosen ESM-only distribution direction is reflected in metadata, and JSR-oriented metadata is present where required by the agreed publication plan.
- Story Points: 1
- Status: done
- Completed At: 2026-03-29T19:50:45Z
- Notes/Links: Source split from former Product Backlog Item 1. [SPEC.md](../SPEC.md), [ADR 0001](../adrs/0001-record-architecture-principles.md)

### S1-4: Core identifier brands and factories

- Why: The model needs a first set of strongly typed identifiers before higher-level builders can preserve domain distinctions safely.
- Prerequisites: S1-1 must establish the initial workspace and shared module boundaries so branded types and factories have a stable home.
- Implementation Plan: Introduce branded types and dedicated factories for the first identifier set needed by the workflow model, such as workflow and job identifiers.
- Definition of Done: Core identifiers are modeled as branded types created only through explicit factories and covered by tests.
- Acceptance Criteria: Workflow and job identifier creation goes through dedicated factories, invalid inputs fail explicitly, and the resulting types can be consumed by later builders.
- Story Points: 2
- Status: done
- Completed At: 2026-03-29T19:50:45Z
- Notes/Links: Source split from former Product Backlog Item 2. [SPEC.md](../SPEC.md), [ADR 0001](../adrs/0001-record-architecture-principles.md)

### S1-5: Minimal workflow builder model

- Why: The project needs a first usable AST and builder slice before validation and rendering work can proceed.
- Prerequisites: S1-4 must exist so builders can consume typed identifiers.
- Implementation Plan: Implement the builder-centered AST slice for workflow name, triggers, jobs, `runs-on` including arrays, and steps covering `uses` and `run`.
- Definition of Done: A simple workflow can be expressed through builders and materialized into the internal workflow model.
- Acceptance Criteria: The model can represent a simple workflow end to end using builders, `runs-on` supports single and array forms, and steps can express both `uses` and `run`.
- Story Points: 3
- Status: done
- Completed At: 2026-03-29T19:50:45Z
- Notes/Links: Source split from former Product Backlog Item 2. [SPEC.md](../SPEC.md), [ADR 0001](../adrs/0001-record-architecture-principles.md)

### S1-6: Step and trigger metadata for the minimal slice

- Why: The minimal builder model needs enough trigger and step metadata to describe realistic simple workflows rather than only skeletal examples.
- Prerequisites: S1-5 must exist.
- Implementation Plan: Extend the Sprint 1 model slice with step metadata fields `name`, `env`, `with`, and `if`, plus trigger support for `push` and `pull_request` with optional `branches` and `paths`, without expanding to full GitHub Actions syntax coverage.
- Definition of Done: The minimal model covers step metadata fields `name`, `env`, `with`, and `if`, together with trigger support for `push` and `pull_request` using optional `branches` and `paths`, as required by Sprint 1 examples and tests.
- Acceptance Criteria: Representative simple workflows can use step metadata fields `name`, `env`, `with`, and `if` without ad hoc escape hatches; `push` and `pull_request` triggers can be expressed with optional `branches` and `paths`; and unsupported advanced trigger or step syntax remains explicitly out of scope for Sprint 1.
- Story Points: 2
- Status: done
- Completed At: 2026-03-29T19:50:45Z
- Notes/Links: Source split from former Product Backlog Item 2. [SPEC.md](../SPEC.md), [ADR 0001](../adrs/0001-record-architecture-principles.md)

### S1-7: Validation boundary and failure model

- Why: The builder workflow needs a clear point where structural validation runs and failures are surfaced predictably.
- Prerequisites: S1-5 and S1-6 must exist so validation targets the complete Sprint 1 workflow slice.
- Implementation Plan: Implement `build()`-time validation and explicit exception behavior for the complete Sprint 1 workflow slice, then add tests for valid construction paths and representative invalid definitions.
- Definition of Done: `build()` validates the complete Sprint 1 workflow slice and throws explicit exceptions for invalid definitions.
- Acceptance Criteria: Valid workflows build successfully, invalid definitions fail through explicit exceptions, and tests cover the main success and failure paths for the complete Sprint 1 scope.
- Story Points: 1
- Status: done
- Completed At: 2026-03-29T19:50:45Z
- Notes/Links: Source split from former Product Backlog Item 2. [SPEC.md](../SPEC.md), [ADR 0001](../adrs/0001-record-architecture-principles.md)

## Related Review Artifacts

- [Sprint 1 Review](../sprint_reviews/sp1.md)
- [Sprint 1 Retrospective](../sprint_retrospectives/sp1.md)
