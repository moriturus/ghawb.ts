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

The team reprioritized after Sprint 4 closeout and added the following unselected backlog items.

### Item 10: Support manual workflow dispatch triggers

- Why: `workflow_dispatch` is one of the most common GitHub Actions entrypoints for release, maintenance, and recovery flows, and the current SDK cannot model it at all.
- Prerequisites: The current trigger model and renderer contract from Sprint 1 and Sprint 2 must remain deterministic and emitter-agnostic.
- Implementation Plan: Extend the workflow AST and builder API to support `workflow_dispatch`, validate its allowed shape explicitly, render it deterministically, and cover representative success and failure cases in Bun and Node tests.
- Definition of Done: The SDK can build and render workflows with `workflow_dispatch`, invalid definitions fail explicitly, documentation reflects the new supported trigger, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A representative workflow can emit a top-level `workflow_dispatch` trigger, the builder does not silently coerce invalid trigger definitions, and rendering remains deterministic across repeated runs.
- Story Points: 2
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [TEAM.md](./TEAM.md). Team discussion: Aoi prioritized this as the smallest high-value workflow-surface expansion, Mio wants it to stay an AST-first change, and Haru requires explicit validation coverage before broader trigger expansion.

### Item 11: Support scheduled workflow triggers

- Why: Many practical CI and maintenance workflows rely on cron-based `schedule` triggers, and their absence blocks a meaningful class of GitHub Actions workflows.
- Prerequisites: `Item 10` should land first so trigger-surface expansion proceeds from the simplest manual trigger to the first structured time-based trigger without reopening trigger modeling decisions twice.
- Implementation Plan: Add `schedule` trigger support with explicit cron-list modeling and validation, extend deterministic rendering for schedule arrays, and document the supported schedule contract and failure cases.
- Definition of Done: The SDK can express scheduled workflows with explicit validation and deterministic rendering, tests cover success and failure paths, and the completed change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A workflow can emit one or more cron schedules under `on.schedule`, blank or malformed schedule entries fail explicitly, and emitted trigger ordering remains stable.
- Story Points: 3
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [LEARN.md](./LEARN.md). Team discussion: Aoi grouped this immediately after `workflow_dispatch` because both expand trigger coverage, and Haru flagged schedule validation as the minimum quality bar for accepting time-based trigger support.

### Item 12: Support job dependency graphs with `needs`

- Why: Without `needs`, the SDK cannot express basic multi-job pipelines with explicit execution order, which sharply limits real workflow composition.
- Prerequisites: Existing job identifier validation and immutable built-workflow guarantees must remain intact.
- Implementation Plan: Extend the workflow job model and builder surface to support `needs`, validate referenced job identifiers and duplicate dependency values, render dependency arrays deterministically, and add regression tests for topological and failure cases.
- Definition of Done: Supported workflows can declare job dependencies through the SDK, invalid dependency references fail explicitly before emission, documentation reflects the new job capability, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Jobs can depend on one or more previously declared job identifiers, unknown or duplicate `needs` entries fail explicitly, and the rendered YAML preserves declared dependency order.
- Story Points: 3
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [adrs/0001-record-architecture-principles.md](./adrs/0001-record-architecture-principles.md). Team discussion: Mio argued this is the first essential job-graph feature, Aoi agreed because it unlocks realistic CI composition, and Ren wanted it sequenced before broader matrix expansion.

### Item 13: Support matrix strategy on jobs

- Why: Matrix builds are core GitHub Actions functionality for runtime and platform coverage, and they are currently impossible to author through `ghawb`.
- Prerequisites: `Item 12` should be completed first so multi-job dependency modeling is settled before adding higher-cardinality job expansion.
- Implementation Plan: Add job strategy and matrix modeling to the AST and builder API, validate supported matrix shapes and empty-value failures, render deterministic matrix objects, and demonstrate representative Bun, Node, or Deno variant workflows.
- Definition of Done: The SDK supports a bounded initial matrix strategy surface with explicit validation and deterministic rendering, tests cover representative matrices, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A job can define a supported strategy matrix, invalid empty or malformed matrix definitions fail explicitly, and repeated renders produce identical YAML structure for the same matrix input.
- Story Points: 5
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [README.md](../README.md). Team discussion: Aoi wants matrix support as the first major feature after dependency graphs, while Haru asked to keep the initial slice narrow enough that deterministic rendering and validation remain credible.

### Item 14: Support workflow and job permissions

- Why: Real GitHub Actions workflows need explicit `permissions` control for least-privilege execution, and the current renderer even treats permissions as unsupported runtime fields.
- Prerequisites: The renderer's unsupported-field guardrail behavior from Sprint 2 must be preserved for still-unsupported keys.
- Implementation Plan: Add top-level and job-level permissions modeling, validate supported permission scopes explicitly, extend rendering in deterministic key order, and add regression tests covering both acceptance and still-unsupported permission shapes.
- Definition of Done: The SDK and renderer support the agreed permissions surface with explicit validation, unsupported permission structures still fail clearly, docs reflect the new support boundary, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A workflow can emit supported top-level and job-level `permissions`, invalid permission entries fail explicitly, and workflows that use unsupported permission structures still produce actionable errors rather than silent degradation.
- Story Points: 4
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [packages/sdk/src/renderer.test.ts](../packages/sdk/src/renderer.test.ts). Team discussion: Aoi prioritized this as the highest-value safety feature after matrix support, and Mio explicitly wants the supported boundary documented so renderer guarantees stay honest.

### Item 15: Support execution environment metadata on jobs and run steps

- Why: Practical workflow authoring needs `timeout-minutes`, `defaults.run.shell`, and `defaults.run.working-directory` style execution controls to avoid ad hoc shell duplication and brittle step definitions.
- Prerequisites: The team must agree on the initial execution-metadata slice so the first implementation does not overreach into every optional GitHub Actions field at once.
- Implementation Plan: Introduce a bounded first slice of execution-environment metadata for jobs and run steps, validate empty and conflicting values explicitly, extend rendering deterministically, and add representative builder and renderer coverage.
- Definition of Done: The agreed execution-metadata slice is supported end-to-end through builder, validation, and rendering, unsupported adjacent fields still fail clearly, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: A supported workflow can define the agreed timeout and run-default fields without manual escape hatches, blank metadata values fail explicitly, and emitted YAML preserves deterministic field ordering.
- Story Points: 5
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [TEAM.md](./TEAM.md). Team discussion: Yui surfaced repeated workflow-authoring friction around shell and working-directory repetition, and Aoi accepted a narrow metadata slice rather than a broad unbounded field dump.

### Item 16: Support workflow and job concurrency controls

- Why: Concurrency is a common operational safeguard for canceling superseded runs and protecting shared environments, and its absence limits the usefulness of generated workflows in real repositories.
- Prerequisites: `Item 15` should land first so job-level execution metadata conventions are in place before introducing another job and workflow control surface.
- Implementation Plan: Add explicit concurrency modeling for workflow and job scopes, validate required group values and cancellation options, render the supported shape deterministically, and cover representative cancellation policies in tests.
- Definition of Done: The SDK can express the agreed concurrency controls with explicit validation and deterministic rendering, docs describe the supported boundary, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Supported workflows can emit top-level and job-level concurrency blocks, missing or blank concurrency groups fail explicitly, and unsupported concurrency shapes still fail before emission.
- Story Points: 3
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [README.md](../README.md). Team discussion: Aoi ranked this after permissions and execution metadata because it is operationally valuable but less foundational than trigger and dependency coverage.

### Item 17: Support multiple committed workflow modules in repository guardrails

- Why: Sprint 4 intentionally locked the repository to a single committed workflow source, but future product growth will need more than one repository-managed workflow module without breaking the supported local authoring path.
- Prerequisites: This item must not start until the Product Owner explicitly confirms that broadening beyond the current single-workflow contract is the intended scope.
- Implementation Plan: Generalize workflow generation and verification scripts to support multiple committed workflow modules under `workflows/`, keep the repository-local authoring contract explicit, and extend tests and docs so source-to-output mapping remains deterministic and reviewable.
- Definition of Done: The repository can manage multiple committed workflow source modules through the supported local path, guardrails catch drift and unsupported placement for each module, docs describe the expanded contract, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Multiple `workflows/*.ts` modules can render to matching `.github/workflows/*.yml` outputs, guardrails validate each supported mapping deterministically, and the repository does not introduce implicit workflow discovery outside the documented path.
- Story Points: 5
- Status: todo
- Completed At: N/A
- Notes/Links: [sprint_reviews/sp4.md](./sprint_reviews/sp4.md), [sprint_retrospectives/sp4.md](./sprint_retrospectives/sp4.md), [scripts/verify-workflows.ts](../scripts/verify-workflows.ts). Team discussion: this item exists because Sprint 4 explicitly warned against silently widening the single-workflow contract; Ren wanted the expansion isolated as its own backlog unit.

### Item 18: Add a batch CLI render surface for repository workflow generation

- Why: The current CLI can render only one explicitly named module at a time, which becomes clumsy once the repository or downstream users need to generate multiple workflows consistently.
- Prerequisites: `Item 17` should be completed first so the repository's multi-workflow contract is defined before the CLI adds a higher-level batch surface around it.
- Implementation Plan: Add a narrow batch render command or manifest-driven CLI path, keep explicit inputs rather than implicit scanning, extend tests for mixed success and failure cases, and document how the new surface composes with existing guardrails.
- Definition of Done: The CLI exposes an explicit multi-workflow render surface with deterministic behavior, actionable diagnostics, matching documentation, and code review by a non-implementing persona.
- Acceptance Criteria: Users can render multiple declared workflow modules in one command, partial failures surface clearly with non-zero exit behavior, and the command does not rely on undocumented repository scanning.
- Story Points: 4
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [packages/cli/src/index.ts](../packages/cli/src/index.ts), [scripts/verify-workflows.ts](../scripts/verify-workflows.ts). Team discussion: Yui pushed for a dedicated ergonomic surface once multi-workflow support exists, while Mio insisted it remain explicit rather than discovery-based.

### Item 19: Expand the cross-runtime conformance suite for SDK rendering

- Why: `docs/SPEC.md` still leaves the cross-runtime conformance question open, and the project currently relies on Bun and Node much more heavily than Deno for executable proof.
- Prerequisites: The currently supported SDK and renderer surfaces through `Item 16` should be stable enough that a shared conformance suite does not churn with every small capability addition.
- Implementation Plan: Define a shared set of representative workflow fixtures and expectations, run them across Bun, Node, and Deno at the appropriate layer, and document which runtime differences are allowed versus treated as regressions.
- Definition of Done: The repository has a documented and executable cross-runtime conformance suite for the supported SDK rendering surface, failures are attributable to clear fixtures, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: The same representative supported workflows are exercised across the intended runtimes, conformance failures report which fixture or runtime diverged, and the test contract is documented clearly enough to guide future feature additions.
- Story Points: 3
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [tests/node/smoke.test.ts](../tests/node/smoke.test.ts), [tests/deno/smoke.test.ts](../tests/deno/smoke.test.ts). Team discussion: Haru treated this as the main quality-hardening item needed before the SDK surface grows much further.

## Prioritization Notes

- Team intake decision: After Sprint 4 closeout, the whole team agreed to refill the product backlog with ten items that balance workflow-surface expansion, repository ergonomics, and hardening work.
- Product Owner final decision: Aoi Sakamoto confirms that the backlog order in this document is the authoritative priority order for future sprint selection unless a later sprint review, retrospective, or urgent defect intake explicitly reprioritizes it.
- Product Owner ranked order: `Item 10` -> `Item 11` -> `Item 12` -> `Item 13` -> `Item 14` -> `Item 15` -> `Item 16` -> `Item 17` -> `Item 18` -> `Item 19`.
- Product Owner rationale: prioritize the smallest SDK features that unlock common GitHub Actions authoring paths first, especially triggers, job graphs, and permissions, before wider CLI ergonomics.
- Scrum Master rationale: keep dependency order explicit so trigger work lands before richer job modeling, repository-local workflow contract expansion stays isolated as its own step, and hardening work remains visible rather than disappearing into feature items.
- Developer rationale: preserve the repository rule that SDK and renderer work come before CLI expansion, require explicit validation and deterministic rendering for each new surface, and treat adjacent unsupported fields as future backlog intake instead of silent scope creep.
- Ordered delivery decision: deliver thin SDK and renderer slices first (`Item 10` through `Item 16`), then widen the repository's committed-workflow contract and the CLI surface (`Item 17` and `Item 18`), and finally strengthen cross-runtime proof (`Item 19`).
- Sprint 4 retrospective guidance remains in force: if future scope broadens workflow authoring beyond the current repository-local and explicit path, that expansion must stay explicit in backlog text and must not silently widen existing guardrails.

## Sprint Backlog Records

- [Sprint 1 Backlog](./sprint_backlogs/sp1.md)
- [Sprint 2 Backlog](./sprint_backlogs/sp2.md)
- [Sprint 3 Backlog](./sprint_backlogs/sp3.md)
- [Sprint 4 Backlog](./sprint_backlogs/sp4.md)
