# ADR 0003: Separate Typed Action Wrappers From SDK Core

- Status: Accepted
- Date: 2026-04-05

## Context

Sprint 18 introduced manual-first typed wrappers for common first-party actions inside `@ghawb/sdk`.

Stakeholder feedback after Sprint 19 clarified two constraints:

1. `TypedAction` core support should remain in `@ghawb/sdk`.
2. Concrete wrapper sets should move to a separate opt-in library.

The same feedback also clarified naming style: public TypeScript APIs should follow the repository's TypeScript-style camelCase and PascalCase conventions such as `exampleUrl` and `nodeCi`, rather than forcing all-uppercase acronym segments.

## Decision

We keep the typed action core in `@ghawb/sdk` and move concrete common-action wrappers into a new opt-in package, `@ghawb/typed-actions`.

The boundary is:

- `@ghawb/sdk` owns `TypedActionStep`, `TypedActionWithMap`, and `typedActionStep()`
- `@ghawb/sdk` continues to accept typed action-step objects in `job.uses(...)`
- `@ghawb/typed-actions` owns concrete wrappers such as `actionsCheckout()` and `actionsSetupNode()`
- `JobBuilder.nodeCi()` remains in `@ghawb/sdk` and keeps TypeScript-style naming
- acronym-containing identifiers follow normal TypeScript style, for example `nodeCi`, `exampleUrl`, `githubServerUrl`, and `runId`

## Consequences

- SDK consumers can keep using typed action-step support without pulling in opinionated wrapper sets.
- Consumers who want high-frequency wrapper helpers can opt into `@ghawb/typed-actions`.
- Documentation must distinguish the SDK core typed-action surface from the optional wrapper package.
- Future wrapper additions should default to `@ghawb/typed-actions` unless there is a stronger architecture reason to keep them elsewhere.
