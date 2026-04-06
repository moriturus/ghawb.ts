# Sprint Review: Sprint 2

## Summary

Sprint 2 reviewed the backlog slice `Item 3` through `Item 5`.

- `@ghawb/shared` now rejects surrounding whitespace in identifier factories instead of silently normalizing values.
- `@ghawb/sdk` now rejects duplicate trigger definitions during `build()` and returns deeply frozen workflow objects.
- Bun and Node now share a Vitest-based test workflow, while Deno remains a smoke and compatibility path.
- The SDK now exposes a deterministic renderer boundary that creates a JSON-like intermediate payload and delegates final emission to an injected emitter.

## Increment Demo

The reviewed increment was demonstrated in two ways.

1. A direct renderer demo from the repository root:

```sh
bun --eval "import { createJobId, createWorkflowId, defineWorkflow, createWorkflowRenderPayload } from './packages/sdk/src/index.ts'; const workflow = defineWorkflow({ id: createWorkflowId('demo'), name: 'Demo' }).onPush({ branches: ['main'] }).addJob(createJobId('test'), (job) => { job.runsOn('ubuntu-latest').run('bun test', { env: { CI: 'true' } }); }).build(); console.log(JSON.stringify(createWorkflowRenderPayload(workflow), null, 2));"
```

Important output summary:

- The payload preserved deterministic top-level ordering as `name`, `on`, and `jobs`.
- The `push` trigger rendered as a single keyed object rather than an ambiguous trigger list.
- The job rendered with `'runs-on': 'ubuntu-latest'` and the step preserved its `env` map plus `run` command.

2. Repository verification commands:

```sh
bun run test
```

Important output summary:

- Vitest passed 15 tests across shared identifiers, workflow builder behavior, renderer behavior, and Node smoke coverage.
- Deno smoke coverage passed 2 tests.

## Review Findings

The sprint delivered the intended contract hardening and deterministic payload boundary. No confirmed correctness bugs were found in the reviewed implementation.

Residual risk:

- Sprint 2 proves deterministic intermediate rendering, but it does not yet demonstrate an end-to-end YAML emission path with a concrete emitter. The backlog item text accepts an injected emitter boundary, but the Definition of Done for Item 5 says the renderer produces valid YAML for supported constructs. That claim is not yet evidenced by a repository test or demo using a real YAML emitter.

## Product Owner Decision

As Product Owner, Aoi Sakamoto keeps `Item 6` as the next backlog priority, but narrows its acceptance expectations.

- The first CLI slice should include one concrete YAML emitter adapter and at least one end-to-end assertion that a supported workflow renders to stable YAML text.
- No additional workflow-surface expansion should happen ahead of that proof, because the current remaining ambiguity is at the final emission boundary, not in the builder contract.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp2.md](../sprint_backlogs/sp2.md)
- [TEAM.md](../TEAM.md)
- [packages/shared/src/identifiers.ts](../../packages/shared/src/identifiers.ts)
- [packages/sdk/src/builders.ts](../../packages/sdk/src/builders.ts)
- [packages/sdk/src/renderer.ts](../../packages/sdk/src/renderer.ts)
- [packages/sdk/src/renderer.test.ts](../../packages/sdk/src/renderer.test.ts)
