# Sprint Backlog: Sprint 2

This document records the selected sprint backlog and completion history for Sprint 2.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 2: 13/15 story points.

Status: done

Completed At: 2026-03-29T20:56:17Z

## Planning Notes

- Capacity decision: Sprint 2 capacity is fixed at 15 story points.
- Selection decision: Sprint 2 commits `Item 3`, `Item 4`, and `Item 5` for a total of 13 story points.
- Ordering decision: Sprint 2 preserves the required execution order from the top of the product backlog and therefore takes the largest prefix that fits within capacity.
- Dependency decision: `Item 4` remains sequenced after `Item 3`, and `Item 5` remains sequenced after both `Item 3` and `Item 4`.
- Scope decision: Sprint 2 focuses on hardening the workflow model contract, converging Bun and Node testing on Vitest, and delivering deterministic rendering as the SDK's first end-to-end output milestone.
- Item 3 decision: Identifiers must not be normalized or case-adjusted, duplicate triggers must be rejected at builder time, and `build()` results must be deep-frozen including nested arrays and step maps such as `env` and `with`.
- Item 4 decision: Bun and Node primary unit/integration coverage moves to Vitest, Deno remains limited to smoke/compatibility coverage, Bun-run Vitest is the coverage authority, and the prior `bun:test` and `node:test` paths are removed rather than kept as compatibility wrappers.
- Item 5 decision: Rendering must stop at a deterministic JSON-like intermediate payload for an injected emitter, prioritize stable structural ordering over emitter-specific formatting preferences, and fail explicitly before emission when unsupported fields are present.
- Deferral decision: `Item 6` is deferred because adding it would raise Sprint 2 scope to 16 story points, which exceeds capacity, and splitting the item would violate the current backlog granularity.
- Buffer decision: The remaining 2 story points are intentionally left unallocated because no next in-order backlog item fits the residual capacity without replanning or re-estimation.

## Delivered Items

### Item 3: Harden Sprint 1 workflow invariants and immutable AST

- Why: The current Sprint 1 model still permits silent identifier normalization, duplicate trigger accumulation, and post-build mutation, which weakens the correctness guarantees that later rendering must rely on.
- Prerequisites: Sprint 1 must be complete so hardening work targets the actual baseline model rather than a hypothetical API.
- Implementation Plan: Tighten identifier validation to reject silent coercion, remove duplicate-trigger ambiguity from the workflow model and builders, make built workflow objects structurally immutable, and update tests plus documentation around the refined guarantees.
- Definition of Done: The Sprint 1 workflow model exposes explicit invariant guarantees for identifiers, trigger ownership, and post-build immutability, and the completed change has been code reviewed by a non-implementing persona.
- Acceptance Criteria: Identifier factories fail explicitly for surrounding-whitespace inputs; unsupported duplicate trigger definitions fail explicitly or are impossible to construct; built workflow objects cannot be mutated into an invalid state through ordinary runtime use; and regression tests cover the refined success and failure paths.
- Story Points: 5
- Status: done
- Completed At: 2026-03-29T20:56:17Z
- Notes/Links: [SPEC.md](../SPEC.md). Primary implementation persona: Mio Kanda. Review and verification personas: Haru Nishimura, Ren Takahashi.

### Item 4: Standardize Bun and Node testing on Vitest

- Why: The project's Bun and Node test surfaces will grow sharply once rendering fixtures and CLI scenarios are introduced, and the current split between `bun:test` and `node:test` will make test design, maintenance, and shared helpers more fragmented than necessary.
- Prerequisites: Sprint 1 must be complete, and Item 3 should land first so the migrated suite captures the hardened model semantics rather than churn twice.
- Implementation Plan: Introduce Vitest as the shared Bun and Node unit or integration test runner, migrate the current Bun and Node suites, keep Deno on focused smoke or compatibility coverage, explicitly define the type-check target and primary test-runner contract in repository commands, and document the intended runtime-specific testing split.
- Definition of Done: Bun and Node testing share a common Vitest-based workflow, Deno remains intentionally scoped to smoke or compatibility checks, the repository's verification commands clearly encode runtime ownership, and the completed change has been code reviewed by a non-implementing persona.
- Acceptance Criteria: Existing Bun and Node tests run under Vitest; Deno keeps a clearly separate smoke-oriented path; root quality commands and coverage expectations remain documented and reproducible; the repository explicitly documents which runtime owns primary unit or integration testing versus compatibility smoke coverage; and no current Sprint 1 guarantees lose automated coverage during migration.
- Story Points: 3
- Status: done
- Completed At: 2026-03-29T20:56:17Z
- Notes/Links: [SPEC.md](../SPEC.md). Primary implementation persona: Yui Morita. Review and verification personas: Haru Nishimura, Ren Takahashi.

### Item 5: Implement deterministic workflow rendering

- Why: The SDK is only useful if it can emit stable, valid GitHub Actions workflow files.
- Prerequisites: Item 3 must harden the current model invariants, and Item 4 should standardize the main Bun and Node test platform before renderer fixture growth begins.
- Implementation Plan: Implement the renderer, define the YAML adapter boundary, inject an emitter rather than hard-code a YAML dependency into the core, define output ordering rules, add fixture-based tests, and verify idempotent rendering behavior across repeated runs.
- Definition of Done: The renderer produces valid YAML for supported workflow constructs through an injected emitter and repeated renders produce identical output, and the completed change has been code reviewed by a non-implementing persona.
- Acceptance Criteria: Rendering tests cover representative workflows, the intermediate representation is deterministic, the same emitter and configuration produce identical output across repeated renders, and unsupported constructs fail explicitly rather than silently degrading.
- Story Points: 5
- Status: done
- Completed At: 2026-03-29T20:56:17Z
- Notes/Links: [SPEC.md](../SPEC.md). Primary implementation persona: Haru Nishimura. Review and verification personas: Mio Kanda, Ren Takahashi.

## Related Review Artifacts

- [Sprint 2 Review](../sprint_reviews/sp2.md)
- [Sprint 2 Retrospective](../sprint_retrospectives/sp2.md)
