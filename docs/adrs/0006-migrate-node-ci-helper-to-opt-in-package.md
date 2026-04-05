# ADR 0006: Migrate Node CI Helper To Opt-In Package

- Status: Accepted
- Date: 2026-04-05
- Supersedes: [ADR 0005](./0005-retain-node-ci-helper-in-sdk.md)

## Context

Sprint 22 Item 75a completed a discovery analysis comparing three placement options for `JobBuilder.nodeCi()`:

1. keep in `@ghawb/sdk`
2. move to a new opt-in package
3. move into an existing ergonomics-oriented package

The initial discovery recommendation was to retain `nodeCi()` in `@ghawb/sdk`, recorded in [ADR 0005](./0005-retain-node-ci-helper-in-sdk.md). The Product Owner overrode that recommendation based on prior team consensus: `nodeCi()` is a concrete CI-workflow recipe that is too specific for the core workflow SDK, and keeping it there blurs the boundary between generic workflow-building primitives and opinionated job-sequence helpers.

The precedent set by [ADR 0003](./0003-separate-typed-action-wrappers-from-sdk-core.md) — moving concrete typed action wrappers out of `@ghawb/sdk` into `@ghawb/typed-actions` — applies with equal force to concrete multi-step job recipes. The same separation-of-concerns principle that moved `actionsCheckout()` and `actionsSetupNode()` into an opt-in package should move `nodeCi()` into its own opt-in package.

## Decision

We migrate `nodeCi()` from `@ghawb/sdk` to a new opt-in package, `@ghawb/job-helpers`.

The migration boundary is:

- `@ghawb/sdk` removes `JobBuilder.nodeCi()` and exports `JobBuilder` as a public type so downstream packages can reference it
- `@ghawb/job-helpers` owns the `nodeCi()` standalone function and `NodeCiOptions` type
- `@ghawb/job-helpers` depends on `@ghawb/sdk` and `@ghawb/shared`
- the API changes from `job.nodeCi(options)` to `nodeCi(job, options)` — a standalone function that accepts the job builder as its first argument and returns it for optional chaining

This supersedes [ADR 0005](./0005-retain-node-ci-helper-in-sdk.md).

## Options Considered

### Option 1: Keep `nodeCi()` in `@ghawb/sdk` (ADR 0005)

Decision: Superseded. The Product Owner determined that the migration cost is justified and that `nodeCi()` sets a harmful precedent if it remains in the core SDK alongside generic workflow-builder primitives.

### Option 2: Move `nodeCi()` to a new opt-in package (this decision)

Pros:

- enforces the same separation-of-concerns boundary as `@ghawb/typed-actions`
- keeps `@ghawb/sdk` focused on generic workflow-builder primitives
- provides a clear opt-in home for future job-sequence helpers without widening the core SDK
- the standalone function pattern (`nodeCi(job, options)`) is explicit and composable

Cons:

- breaking change for existing consumers who use `job.nodeCi()`
- requires migration guidance and documentation updates

Decision: Accepted.

### Option 3: Move `nodeCi()` into `@ghawb/typed-actions`

Decision: Rejected. `@ghawb/typed-actions` owns single-action wrappers that return typed `uses`-step objects. `nodeCi()` is a multi-step job recipe that orchestrates multiple actions and run steps. Mixing these concerns would blur the `typed-actions` boundary.

## Consequences

- Sprint 22 Item 75b proceeds with the migration implementation.
- `@ghawb/job-helpers` becomes the seventh published package in the distribution.
- Existing consumers must change `job.nodeCi(options)` to `import { nodeCi } from "@ghawb/job-helpers"` and call `nodeCi(job, options)`.
- `docs/SPEC.md`, README, Cookbook, and API Reference must be updated to reflect the new package and import path.
- Future job-sequence helpers (if any) should default to `@ghawb/job-helpers` rather than `@ghawb/sdk`.
- [ADR 0003](./0003-separate-typed-action-wrappers-from-sdk-core.md) line about `nodeCi()` remaining in SDK is superseded by this decision.
