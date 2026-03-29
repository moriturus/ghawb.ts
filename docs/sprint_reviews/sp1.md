# Sprint Review: Sprint 1

## Summary

Sprint 1 delivered the initial `ghawb` SDK baseline.

- The repository now has a workspace structure for `@ghawb/sdk`, `@ghawb/shared`, and a placeholder `@ghawb/cli`.
- Root developer commands now cover formatting, linting, type-checking, and multi-runtime testing.
- The SDK now supports the minimal workflow builder slice defined for Sprint 1.
- Validation now runs explicitly at `build()` time.

## Increment Demo

The reviewed increment demonstrated that the current SDK can build a minimal workflow model end to end.

- `@ghawb/shared` provides branded workflow and job identifiers through validating factories.
- `@ghawb/sdk` provides a builder-centered workflow API with:
  - workflow identifier and name
  - `push` and `pull_request` triggers
  - optional `branches` and `paths`
  - jobs with `runs-on` as a string or string array
  - `uses` and `run` steps
  - step metadata fields `name`, `env`, `with`, and `if`
- Invalid workflows fail explicitly during `build()`.

The review demo also confirmed that the current implementation can:

- build a representative workflow model successfully
- report explicit validation issues for incomplete definitions
- run verification paths in Bun, Node, and Deno

## Review Findings

The sprint review identified several follow-up concerns in the current implementation.

- Identifier factories currently normalize surrounding whitespace instead of rejecting it explicitly.
- The workflow model currently allows duplicate trigger accumulation, which leaves renderer behavior ambiguous.
- Built workflow objects are not yet treated as fully immutable values after validation.
- Node-side tests are not using Vitest; the current setup still relies on `node:test`, while Bun uses `bun:test`.

## Product Owner Decisions

The Product Owner reprioritized the product backlog after the sprint review.

1. Harden Sprint 1 workflow invariants and immutable AST
2. Standardize Bun and Node testing on Vitest
3. Implement deterministic workflow rendering
4. Build the CLI as the final-stage interface
5. Enable self-hosted CI/CD using `ghawb`

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp1.md](../sprint_backlogs/sp1.md)
- [TEAM.md](../TEAM.md)
