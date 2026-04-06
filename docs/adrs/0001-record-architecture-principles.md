# ADR 0001: Record Architecture Principles

- Status: Accepted
- Date: 2026-03-30

## Context

`ghawb` is intended to generate GitHub Actions workflow files from TypeScript definitions while prioritizing type safety, robustness, and idempotency. The project concept also sets strong implementation constraints around Pure TypeScript, dependency minimization, TDD, and broad runtime compatibility.

The repository needs an initial architectural baseline before implementation starts so that later design and backlog decisions can be evaluated consistently.

## Decision

We adopt the following architecture principles:

1. The product will be implemented as a TypeScript SDK, with a CLI added after the SDK and renderer are complete.
2. Type safety is a primary design goal, not a secondary validation layer.
3. Builder patterns are the default authoring model for developer-facing APIs.
4. Typestate techniques should be used where they materially improve compile-time guarantees.
5. Branded types should be used where domain-specific values benefit from stronger distinction than plain primitives provide.
6. Workflow generation must be deterministic and idempotent.
7. The implementation must remain 100% Pure TypeScript.
8. External dependencies must be limited to Node modules.
9. The GitHub Actions workflow AST is a first-class internal domain model implemented in Pure TypeScript.
10. YAML emission is handled through an external emitter adapter supplied through injection rather than a fixed core dependency.
11. Bun is the standard development environment, while Node and Deno compatibility remain project goals.
12. The project should be developed with TDD and maintain 100% coverage as a standing quality target.

## Consequences

- The public API may be more explicit and constrained than a loosely typed convenience-first design.
- Some GitHub Actions constructs may require staged builders or validated intermediate types instead of plain object literals.
- Runtime compatibility and dependency policy must be evaluated for every tooling and library choice.
- The core architecture should expose a serialization boundary or emitter interface instead of binding directly to one YAML package.
- YAML input and round-trip fidelity are not part of the current product requirements.
- Adapter selection and integration must preserve deterministic output requirements for a given emitter and configuration.
- CLI delivery and self-hosting follow the SDK and renderer rather than driving their design.
- Rendering and test strategies must prioritize determinism and reproducibility from the beginning.
- Architectural shortcuts that weaken compile-time guarantees should be rejected unless they clearly improve usability without undermining core goals.
