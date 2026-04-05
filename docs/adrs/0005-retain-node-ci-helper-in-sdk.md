# ADR 0005: Retain Node CI Helper In SDK

- Status: Accepted
- Date: 2026-04-05

## Context

Sprint 22 Item 75a requires a fresh discovery decision for the package boundary around `JobBuilder.nodeCi()`.

Sprint 19 already selected a narrow additive Node CI helper in `@ghawb/sdk` through [ADR 0002](./0002-scope-job-recipes-to-a-narrow-node-ci-helper.md). Sprint 21 then reinforced two constraints that shape any reconsideration:

1. hardening and documentation work should not force package churn without clear product benefit
2. discovery-first handling remains the preferred path for unresolved package-boundary questions

The repository now has more package-boundary evidence than it did in Sprint 19:

- `@ghawb/sdk` remains the default starting point for workflow authoring and already documents `job.nodeCi()` as part of that path
- [ADR 0003](./0003-separate-typed-action-wrappers-from-sdk-core.md) moved concrete action wrappers into `@ghawb/typed-actions` while explicitly keeping `nodeCi()` in `@ghawb/sdk`
- the self-hosted `workflows/*.ts` sources now prefer typed action wrappers for action-level reuse and do not depend on `nodeCi()` for their current shape

Sprint 22 Item 75a must compare at least three options:

1. keep `nodeCi()` in `@ghawb/sdk`
2. move it to a new opt-in package
3. move it into an existing ergonomics-oriented package if that boundary remains coherent

## Decision

We retain `JobBuilder.nodeCi()` in `@ghawb/sdk` and do not proceed with a migration item in Sprint 22.

The selected boundary is:

- `@ghawb/sdk` continues to own workflow-builder convenience methods that append explicit job steps
- `@ghawb/typed-actions` remains limited to concrete single-action wrappers that return typed action-step objects
- no new package is introduced for high-level job helpers in this slice

Sprint 22 therefore stops after Item 75a and does not execute Item 75b.

## Options Considered

### Option 1: Keep `nodeCi()` in `@ghawb/sdk`

Pros:

- matches the already shipped SDK-centric authoring story and avoids breaking the documented "start with `@ghawb/sdk`" path
- keeps the helper beside adjacent job-builder methods such as `.run()`, `.uses()`, and `.usesWorkflow()`
- preserves public API stability and avoids migration churn across README, Cookbook, API reference, specification, and tests
- aligns with ADR 0003, which already separated typed wrappers from SDK core while explicitly retaining `nodeCi()` in SDK

Cons:

- leaves the broader "high-level helper package" theme unresolved for future evidence if the product later grows beyond a single narrow helper

Decision: Accepted.

### Option 2: Move `nodeCi()` to a new opt-in package

Pros:

- would keep higher-level convenience helpers out of the core workflow SDK if a broader helper family emerges later
- could provide a future home for multiple job-sequence helpers without widening `@ghawb/sdk`

Cons:

- creates immediate migration and compatibility cost for one shipped helper with limited current pressure
- requires either a breaking API move or a compatibility shim that preserves the current SDK surface anyway
- introduces new package, publishing, testing, and documentation overhead before the product has evidence that a helper family exists

Decision: Rejected.

### Option 3: Move `nodeCi()` into an existing ergonomics-oriented package

Pros:

- reuses an already published opt-in package instead of creating another one

Cons:

- `@ghawb/typed-actions` owns single-action wrappers, not multi-step job recipes
- moving `nodeCi()` there would blur the boundary between typed action objects and workflow-builder step orchestration
- no other existing package provides a coherent home for job-level workflow helper sequences

Decision: Rejected.

## Consequences

- Sprint 22 Item 75a is decision-complete once the sprint backlog records this retained boundary and the rejected alternatives.
- Sprint 22 Item 75b does not proceed, because its migration prerequisite was not approved.
- `docs/SPEC.md` remains accurate as written because the shipped package boundary does not change.
- If future evidence reopens this theme, the smallest safe migration path is additive first: create a dedicated helper package, keep SDK compatibility for at least one release, and only then consider deprecation.
