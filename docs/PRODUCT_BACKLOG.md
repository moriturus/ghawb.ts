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

The product backlog contains newly discovered candidate items for post-Sprint-15 planning.

- Discovery intake decision: The backlog was refilled from the Sprint 15 review/retrospective, the current specification, the syntax coverage matrix, and the README's explicit unsupported-feature list. The items below are recorded as discovery output only. They have not yet received a Product Owner priority adjustment, dependency sequencing decision, or sprint commitment.
- Discovery intake constraint reminder: Preserve the repository's explicit-boundary architecture from ADR 0001. Do not introduce YAML input or parser support into the core architecture through these items unless the specification and ADRs change first.
- Discovery intake quality reminder: For SDK-surface changes, keep the Sprint 7 rule in force — add or update shared cross-runtime conformance fixtures in the same slice.
- Historical note: Prior intake rationale, older priority adjustments, and prior sprint-selection decisions were moved to [PRODUCT_BACKLOG_HISTORY.md](./PRODUCT_BACKLOG_HISTORY.md) so this file stays focused on the active backlog.

### Item 51: Expression helper MVP

- Why: The current SDK still relies on raw `${{ }}` strings for expressions. Sprint 15 discovery identified expression helpers as the clearest remaining type-safety gap in a product that positions type safety as a primary value.
- Prerequisites: None documented. Assumption: keep raw string expressions supported for backward compatibility while the helper API is introduced incrementally.
- Implementation Plan: Design and implement a minimal expression-helper API that covers the highest-value authoring paths first, such as common `if` conditions and expression-bearing values used in job or step metadata. Preserve the existing builder-centered API style, add build-time validation where practical, update deterministic rendering and cross-runtime conformance fixtures, and document the supported helper surface in `docs/SPEC.md` and API-facing documentation.
- Definition of Done: A documented expression-helper MVP exists in the SDK, representative expression authoring paths no longer require raw string interpolation, runtime validation remains explicit, deterministic rendering is preserved, cross-runtime fixtures are updated, and code review is completed.
- Acceptance Criteria: SDK consumers can construct representative expression values through helpers instead of raw `${{ }}` strings for at least the initial supported cases. Existing raw string entry paths remain backward compatible. Invalid helper-produced expressions fail clearly at build time when validation is possible. `docs/SPEC.md` documents the MVP scope and any intentional non-goals.
- Story Points: 5 (inferred during discovery; pending refinement)
- Status: proposed
- Completed At: N/A
- Notes/Links: Discovery intake from [Sprint 15 Review](./sprint_reviews/sp15.md) and [Sprint 15 Retrospective](./sprint_retrospectives/sp15.md); see also [Specification](./SPEC.md), [Syntax Coverage](./SYNTAX_COVERAGE.md), and [ADR 0001](./adrs/0001-record-architecture-principles.md).

### Item 52: Advanced `runs-on` support

- Why: The syntax coverage matrix still lists the `runs-on.group` / `runs-on.labels` object form as unsupported. This is a concrete remaining workflow-syntax gap with practical value for self-hosted and managed-runner scenarios.
- Prerequisites: None documented.
- Implementation Plan: Extend the step-based job model, builder API, validation, deterministic renderer, and conformance fixtures to support the GitHub Actions object form of `runs-on`, covering `group` and `labels` while preserving the current string and string-array entry paths.
- Definition of Done: Step-based jobs support `runs-on` object authoring in addition to the existing forms, explicit validation covers supported and unsupported combinations, deterministic rendering preserves canonical field order, cross-runtime fixtures are updated, and code review is completed.
- Acceptance Criteria: SDK consumers can define `runs-on` with `group` and/or `labels` through a documented API. Unsupported or malformed `runs-on` object shapes fail explicitly at build time. Existing string and string-array `runs-on` behavior remains unchanged. `docs/SPEC.md` and `docs/SYNTAX_COVERAGE.md` are updated.
- Story Points: 3 (inferred during discovery; pending refinement)
- Status: proposed
- Completed At: N/A
- Notes/Links: Discovery intake from [Sprint 15 Retrospective](./sprint_retrospectives/sp15.md) and the current [Syntax Coverage](./SYNTAX_COVERAGE.md).

### Item 53: `actionlint` bridge for generated workflow verification

- Why: The README already positions `ghawb` and `actionlint` as complementary, but the current product stops at documentation. Discovery identified a gap between authoring-time safety and YAML-level static validation in the day-to-day workflow.
- Prerequisites: None documented. Assumption: `actionlint` remains an external optional tool rather than a core dependency.
- Implementation Plan: Add a CLI- or workflow-oriented verification path that can invoke `actionlint` against generated workflow files after rendering, surface clear guidance when the tool is not installed, and keep the core SDK and AST architecture independent from YAML parsing concerns.
- Definition of Done: Users have a documented supported path to run `actionlint` from the repository workflow or CLI-facing tooling, failures are reported clearly, optional-tool absence is handled explicitly, architecture boundaries remain intact, and code review is completed.
- Acceptance Criteria: A supported command or CLI mode can verify generated workflow files with `actionlint`. When `actionlint` is unavailable, the user receives a clear actionable message rather than a silent skip. The implementation does not add YAML input/parser support to the core SDK architecture. `README.md` and `docs/SPEC.md` are updated as needed.
- Story Points: 3 (inferred during discovery; pending refinement)
- Status: proposed
- Completed At: N/A
- Notes/Links: Discovery intake from [README](../README.md), [Sprint 15 Review](./sprint_reviews/sp15.md), [Sprint 15 Retrospective](./sprint_retrospectives/sp15.md), and [ADR 0001](./adrs/0001-record-architecture-principles.md).

### Item 54: API reference and cookbook documentation

- Why: Sprint 15 retrospective explicitly identified user-facing documentation beyond the README as a candidate next theme. The repository also carries API-discovery gotchas, such as the job builder's `.displayName()` naming, that are better addressed through durable reference material.
- Prerequisites: None documented.
- Implementation Plan: Add durable external-facing documentation for the SDK, covering API reference material, a cookbook of representative workflow patterns, and explicit notes for known naming or ergonomics gotchas. Keep the documentation aligned with `docs/SPEC.md`, `README.md`, and the current implemented surface.
- Definition of Done: A documented API reference and cookbook exist, representative usage paths are covered, known API gotchas are called out, relevant index links are added, and code review is completed.
- Acceptance Criteria: A user can move from the README into deeper API-facing documentation for common workflow patterns and key builder APIs. The documentation explicitly covers at least one naming/ergonomics gotcha already recorded in repository lessons. `docs/INDEX.md` is updated if new docs are added under `docs/`.
- Story Points: 3 (inferred during discovery; pending refinement)
- Status: proposed
- Completed At: N/A
- Notes/Links: Discovery intake from [Sprint 15 Retrospective](./sprint_retrospectives/sp15.md), [README](../README.md), and [Learnings](./LEARN.md).

### Item 55: Opt-in reusable-workflow YAML import package

- Why: Discovery identified a real migration and interoperability need for users who already have reusable workflows authored as committed YAML files and want to reference them from the `ghawb` API surface. The current architecture supports reusable-workflow injection for `WorkflowBuilder`, `WorkflowDefinition`, and `WorkflowRef`, but intentionally keeps YAML input out of the core SDK. An opt-in package can address this use case without weakening the SDK's explicit AST and emitter boundaries.
- Prerequisites: None documented. Constraint: the implementation must keep YAML parsing and import logic out of `@ghawb/sdk` and treat the feature as optional migration or interoperability tooling rather than as a core authoring path.
- Implementation Plan: Design and implement a separate package, tentatively `@ghawb/yaml-import` or equivalent, that can read a committed reusable workflow YAML file, validate that it is a supported `workflow_call` target, and return an object that the main API can consume through an explicit interoperability boundary. The package may depend on a YAML parser internally, but `@ghawb/sdk` must remain YAML-input-free. Scope the first slice narrowly around reusable-workflow import rather than general workflow round-tripping. Document the architectural boundary, supported input scope, failure modes, and integration path with `usesWorkflow()` or a dedicated helper.
- Definition of Done: An optional package exists that imports supported reusable-workflow YAML definitions through a documented API, validates `workflow_call` suitability, integrates with the main authoring flow through an explicit boundary, preserves the SDK's no-YAML-input contract, and is covered by tests and code review.
- Acceptance Criteria: Users can opt into a separate package to load a supported reusable workflow YAML file and pass the imported result into the `ghawb` authoring flow without adding a YAML dependency to `@ghawb/sdk`. Invalid YAML, unsupported workflow shapes, or non-reusable-workflow inputs fail with clear diagnostics. `docs/SPEC.md` and package-facing documentation describe the boundary explicitly: YAML import is optional tooling, not core SDK behavior.
- Story Points: 5 (inferred during discovery; pending refinement)
- Status: proposed
- Completed At: N/A
- Notes/Links: Discovery intake from the current [Specification](./SPEC.md), [ADR 0001](./adrs/0001-record-architecture-principles.md), [Sprint 15 Review](./sprint_reviews/sp15.md), and existing reusable-workflow object injection behavior.

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
