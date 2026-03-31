# Sprint Backlog: Sprint 7

This document records the selected sprint backlog and planning decisions for Sprint 7.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 7: 12/15 story points.

Status: ready

Completed At: N/A

## Planning Notes

- Capacity decision: Sprint 7 capacity remains fixed at 15 story points, matching the recent sprint planning baseline.
- Selection decision: Sprint 7 commits `Item 17`, `Item 19`, and `Item 18` for a total of 12 story points.
- Ordering decision: Sprint 7 preserves required top-down backlog execution and sequences the committed work as `Item 17` -> `Item 19` -> `Item 18`.
- Dependency decision: `Item 19` stays after `Item 17` because the repository's explicit multi-workflow contract should settle before the team hardens cross-runtime proof for the widened supported surface, and `Item 18` stays after `Item 19` because the batch CLI surface should not broaden before repository guardrails are expanded and the shared SDK rendering contract is hardened across runtimes.
- Scope decision: Sprint 7 closes the remaining planned backlog with one repository-contract expansion, one cross-runtime hardening slice, and one explicit CLI ergonomics slice, while keeping repository-local workflow authoring explicit and non-discovery-based.
- Item 17 decision: The Product Owner explicitly confirmed during Sprint 7 planning that broadening the repository beyond a single committed workflow source is the intended next scope, limited to multiple committed modules under `workflows/` with deterministic source-to-output mappings and no undocumented workflow discovery.
- Item 19 decision: The cross-runtime conformance slice is limited to a shared set of representative supported workflow fixtures and expectations across Bun, Node, and Deno; it is not an exhaustive parity matrix for every adjacent or unsupported GitHub Actions shape.
- Item 18 decision: The CLI batch render slice must remain explicit-input or manifest-driven, surface partial failures clearly with non-zero exit behavior, and must not introduce undocumented repository scanning.
- Product Owner decision: Sprint 7 commits the remaining backlog in the order `Item 17` -> `Item 19` -> `Item 18`, keeping repository-contract work explicit and bringing runtime hardening ahead of additional CLI orchestration.
- Scrum Master decision: Sprint 7 is ready to start with dependency order resolved, one backlog item active at a time, explicit review-snapshot expectations preserved, and the Sprint 6 collaboration model carried forward unless a concrete impediment emerges.
- Developer decision: Existing builder-time validation, deterministic renderer ordering, explicit unsupported-shape guardrails, Bun-primary verification, Node compatibility checks, and Deno compatibility evidence remain mandatory where they apply inside the active Sprint 7 item.
- Collaboration decision: Sprint execution will keep one backlog item active at a time while using team personas within each item, with Aoi Sakamoto owning scope and acceptance decisions, Ren Takahashi owning sequencing, impediment tracking, and review readiness, Mio Kanda expected to lead SDK and architecture implementation, Haru Nishimura expected to lead validation and non-implementing review, and Yui Morita expected to support tooling and documentation follow-through within the active item.
- Buffer decision: The remaining 3 story points are intentionally left unallocated because the committed backlog is now exhausted and no additional in-order product backlog item exists.

## Committed Items

### Item 17: Support multiple committed workflow modules in repository guardrails

- Why: Sprint 4 intentionally locked the repository to a single committed workflow source, but future product growth will need more than one repository-managed workflow module without breaking the supported local authoring path.
- Prerequisites: The Product Owner confirmed during Sprint 7 planning that broadening beyond the current single-workflow contract is the intended scope, while keeping the repository-local authoring contract explicit.
- Implementation Plan: Generalize workflow generation and verification scripts to support multiple committed workflow modules under `workflows/`, keep the repository-local authoring contract explicit, and extend tests and docs so source-to-output mapping remains deterministic and reviewable.
- Definition of Done: The repository can manage multiple committed workflow source modules through the supported local path, guardrails catch drift and unsupported placement for each module, docs describe the expanded contract, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Multiple `workflows/*.ts` modules can render to matching `.github/workflows/*.yml` outputs, guardrails validate each supported mapping deterministically, and the repository does not introduce implicit workflow discovery outside the documented path.
- Story Points: 5
- Status: ready
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md), [sprint_reviews/sp4.md](../sprint_reviews/sp4.md), [sprint_retrospectives/sp4.md](../sprint_retrospectives/sp4.md), [scripts/verify-workflows.ts](../../scripts/verify-workflows.ts). Planning decision: this item stays narrowly scoped to explicit multi-module repository support under `workflows/` and must not silently widen into undocumented discovery behavior.

### Item 19: Expand the cross-runtime conformance suite for SDK rendering

- Why: `docs/SPEC.md` still leaves the cross-runtime conformance question open, and the project currently relies on Bun and Node much more heavily than Deno for executable proof.
- Prerequisites: The currently supported SDK and renderer surfaces through `Item 16` should be stable enough that a shared conformance suite does not churn with every small capability addition.
- Implementation Plan: Define a shared set of representative workflow fixtures and expectations, run them across Bun, Node, and Deno at the appropriate layer, and document which runtime differences are allowed versus treated as regressions.
- Definition of Done: The repository has a documented and executable cross-runtime conformance suite for the supported SDK rendering surface, failures are attributable to clear fixtures, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: The same representative supported workflows are exercised across the intended runtimes, conformance failures report which fixture or runtime diverged, and the test contract is documented clearly enough to guide future feature additions.
- Story Points: 3
- Status: ready
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md), [tests/node/smoke.test.ts](../../tests/node/smoke.test.ts), [tests/deno/smoke.test.ts](../../tests/deno/smoke.test.ts). Planning decision: this conformance slice uses representative supported fixtures across Bun, Node, and Deno rather than reopening scope to exhaustive every-surface parity.

### Item 18: Add a batch CLI render surface for repository workflow generation

- Why: The current CLI can render only one explicitly named module at a time, which becomes clumsy once the repository or downstream users need to generate multiple workflows consistently.
- Prerequisites: `Item 17` should be completed first so the repository's multi-workflow contract is defined before the CLI adds a higher-level batch surface around it.
- Implementation Plan: Add a narrow batch render command or manifest-driven CLI path, keep explicit inputs rather than implicit scanning, extend tests for mixed success and failure cases, and document how the new surface composes with existing guardrails.
- Definition of Done: The CLI exposes an explicit multi-workflow render surface with deterministic behavior, actionable diagnostics, matching documentation, and code review by a non-implementing persona.
- Acceptance Criteria: Users can render multiple declared workflow modules in one command, partial failures surface clearly with non-zero exit behavior, and the command does not rely on undocumented repository scanning.
- Story Points: 4
- Status: ready
- Completed At: N/A
- Notes/Links: [SPEC.md](../SPEC.md), [packages/cli/src/index.ts](../../packages/cli/src/index.ts), [scripts/verify-workflows.ts](../../scripts/verify-workflows.ts). Planning decision: this item remains explicit-input or manifest-driven and must not absorb repository-discovery behavior outside the documented Sprint 7 contract.
