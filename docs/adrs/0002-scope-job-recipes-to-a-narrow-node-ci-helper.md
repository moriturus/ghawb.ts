# ADR 0002: Scope Job Recipes To A Narrow Node CI Helper

- Status: Accepted
- Date: 2026-04-04

## Context

Sprint 19 Item 65 requires a discovery decision for repeated job patterns before implementation begins. The team must explicitly compare three options:

1. Cookbook-only guidance
2. A narrow helper API
3. A broader preset / recipe layer

The current repository shows repeated CI-oriented job-step sequences across product docs and self-hosted workflow sources. The repeated pattern is a mostly linear sequence of checkout, runtime setup, dependency install, and verification commands, especially for Node-oriented jobs:

- `README.md` repeats `actions/checkout@v6` + `actions/setup-node@v6` + `npm ci` + test/build commands in multiple examples.
- `docs/COOKBOOK.md` repeats the same pattern in the CI and matrix recipes.
- `workflows/publish.ts` and `workflows/release.ts` repeat checkout plus setup-node plus package-manager commands.
- `workflows/ci.ts` and `workflows/manual-verify.ts` extend the same shape with additional runtime setup and verification steps.

Sprint 18 already established two relevant product constraints:

- the product prefers additive, explicit APIs over magic abstraction layers
- typed action wrappers are now an accepted pattern inside `@ghawb/sdk`

Sprint 19 Item 66 needs a backlog-ready implementation slice with no major remaining design questions.

## Decision

We reject a broad preset / recipe layer for Sprint 19 and choose a narrow helper API in `@ghawb/sdk` as the first implementation slice.

The first implementation slice will target one concrete repeated pattern only:

- a Node CI step sequence inside a step-based job

The Item 66 implementation boundary is:

- package: `@ghawb/sdk`
- surface: one additive `JobBuilder` helper for a Node CI sequence
- scope: append the standard `checkout -> setup-node -> install -> test` step flow to an existing job
- reuse: build on existing `actionsCheckout()` and `actionsSetupNode()` typed wrappers rather than introducing a second abstraction stack
- non-goals: whole-workflow presets, multi-job orchestration, Bun- and pnpm-specific preset families, trigger defaults, runner defaults, permissions defaults, or a new package

The preferred public shape for Item 66 is a single job-level helper with explicit options, for example `job.nodeCi(...)`, rather than a new package or a declarative recipe DSL. The exact option names may follow repository naming conventions during implementation, but the helper must remain constrained to a Node CI step sequence and must not widen into a generic preset framework in Sprint 19.

## Options Considered

### Option 1: Cookbook-only guidance

Pros:

- smallest documentation-only change
- no new API surface
- no architectural risk

Cons:

- does not reduce repeated authoring boilerplate in user code
- does not satisfy Item 66's requirement to provide a concrete reusable slice with less boilerplate than the builder-only path
- leaves the same repeated step sequence duplicated across repository examples and likely user workflows

Decision: Rejected.

### Option 2: Narrow helper API

Pros:

- additive and explicit, matching the repository's architecture principles
- reuses the recently introduced typed action wrappers instead of bypassing them
- yields measurable boilerplate reduction in one sprint-safe slice
- keeps scope local to `@ghawb/sdk` and to one repeated pattern

Cons:

- introduces a new builder convenience surface that must be documented and tested carefully
- still leaves broader "recipe layer" questions for later discovery if the product ever needs them

Decision: Accepted.

### Option 3: Broader preset / recipe layer

Pros:

- potentially unifies multiple workflow patterns under one conceptual model
- could scale to more languages and job families later

Cons:

- too many open questions remain about package boundary, abstraction level, preset composition, and long-term API stability
- creates avoidable Sprint 19 risk by combining discovery and framework design
- conflicts with the product preference for narrow, explicit additions unless proven necessary

Decision: Rejected for Sprint 19.

## Consequences

- Item 66 can proceed without further discovery about package placement or whether Sprint 19 should create a new recipe subsystem.
- `docs/SPEC.md` should be updated during Item 66 implementation to describe the new helper once it exists in code.
- README and/or Cookbook examples should demonstrate the reduced-boilerplate Node CI path during Item 66.
- Broader preset families remain a possible future backlog theme only if repeated evidence accumulates beyond the first Node CI step sequence.
