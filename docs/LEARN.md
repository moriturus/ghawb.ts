# Learnings

Use this document to capture durable lessons discovered during implementation.

## When To Add An Entry

- A mistake was easy to make and likely to recur.
- A design constraint turned out to be more important than expected.
- A runtime, tooling, or compatibility edge case affected implementation choices.
- A testing pattern or workflow significantly improved reliability.

## Entry Template

### Title

- Date:
- Context:
- What happened:
- Why it matters:
- Recommendation:
- Links:

## Entries

### Keep workflow source modules inside the repository when the CLI imports TypeScript directly

- Date: 2026-03-29
- Context: Sprint 3 introduced a CLI that imports a user-specified TypeScript workflow module and renders it to YAML.
- What happened: Temporary workflow modules created outside the repository root could not reliably resolve workspace package imports such as `@ghawb/sdk`.
- Why it matters: The CLI contract is simpler and more reproducible when authored workflow modules live inside the repository or otherwise manage their own module resolution explicitly.
- Recommendation: Keep generated and committed workflow source modules under a repository-owned directory such as `workflows/`, and reserve out-of-tree fixtures for tests that use explicit absolute imports.
- Links: [packages/cli/src/index.ts](../packages/cli/src/index.ts), [packages/cli/src/cli.test.ts](../packages/cli/src/cli.test.ts), [workflows/ci.ts](../workflows/ci.ts)

### Freeze returned workflow models, not only builder drafts

- Date: 2026-03-30
- Context: Sprint 2 tightened the workflow contract so later rendering can trust already-built definitions.
- What happened: Validation-only hardening was not enough because callers could still mutate returned workflow objects, nested arrays, or step maps after `build()`.
- Why it matters: Renderer determinism depends on stable post-build state, so immutability must apply to the published AST shape, not just to internal builder copies.
- Recommendation: When a workflow definition becomes externally observable, deep-freeze the full returned object graph, including arrays and nested records such as `env` and `with`.
- Links: [packages/sdk/src/builders.ts](../packages/sdk/src/builders.ts), [packages/sdk/src/workflow.test.ts](../packages/sdk/src/workflow.test.ts)

### Use a single Bun/Node test runner before fixture volume grows

- Date: 2026-03-30
- Context: Sprint 2 introduced renderer coverage, which would have multiplied the cost of maintaining separate `bun:test` and `node:test` suites.
- What happened: The repository converged Bun and Node coverage on Vitest while keeping Deno limited to smoke coverage.
- Why it matters: Shared helpers, failure assertions, and future renderer or CLI fixtures stay easier to evolve when Bun and Node execute the same test files under the same runner contract.
- Recommendation: Keep Bun-run Vitest as the primary repository test authority, use Node-run Vitest as compatibility confirmation, and reserve Deno for smoke-oriented checks unless a broader conformance suite is intentionally designed.
- Links: [package.json](../package.json), [vitest.config.ts](../vitest.config.ts), [tests/node/smoke.test.ts](../tests/node/smoke.test.ts)

### Omit unset optional properties in strict AST builders

- Date: 2026-03-30
- Context: Sprint 1 uses `exactOptionalPropertyTypes` with builder-produced workflow AST objects.
- What happened: Returning objects with `property: undefined` caused type errors across builder drafts and finalized model nodes even when the runtime shape was otherwise correct.
- Why it matters: Strict optional-property semantics make the model contract clearer and reduce accidental shape drift, but only if builders omit unset fields instead of writing `undefined`.
- Recommendation: For workflow model and builder code, construct optional fields through conditional object spreads so absent metadata stays absent in both drafts and finalized AST values.
- Links: [packages/sdk/src/builders.ts](../packages/sdk/src/builders.ts), [tsconfig.json](../tsconfig.json)

### Separate runtime-specific test entrypoints

- Date: 2026-03-29
- Context: Sprint 1 introduced Bun, Node, and Deno test entrypoints in the same repository.
- What happened: A single generic TypeScript type-check pass tried to load Bun and Deno globals at once, while Bun also tried to execute the Deno-only test file.
- Why it matters: Multi-runtime support becomes noisy and brittle if runtime-specific tests are not isolated by entrypoint and by type-check surface.
- Recommendation: Keep root `tsc` focused on shared code plus the Node-facing smoke path, and let Bun and Deno validate their own test files through their native runners.
- Links: [package.json](../package.json), [tsconfig.json](../tsconfig.json), [deno.json](../deno.json)
