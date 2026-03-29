# Sprint Review: Sprint 3

## Summary

Sprint 3 reviewed the backlog slice `Item 6` through `Item 7`.

- `@ghawb/cli` now exposes an explicit `ghawb render --input <workflow.ts> --output <workflow.yml>` command.
- The CLI imports a directly specified TypeScript module, requires a built workflow definition as the default export, renders deterministic YAML through the `yaml` Node module, and exits non-zero on failure.
- The repository now authors its CI workflow in TypeScript at `workflows/ci.ts` and renders the committed output to `.github/workflows/ci.yml`.
- Root regeneration is exposed through `bun run generate:workflows`, and automated tests now cover CLI execution plus self-hosted workflow output.

## Increment Demo

The reviewed increment was demonstrated in two ways.

1. A direct self-hosting render from the repository root:

```sh
bun run generate:workflows
```

Important output summary:

- The command rendered `.github/workflows/ci.yml` from `workflows/ci.ts` without manual YAML editing.
- The generated workflow contains the expected self-hosting steps for workflow regeneration, `bun run check`, and Node compatibility coverage.

2. Repository verification commands:

```sh
bun run test:vitest
bun run test:vitest:node
bun run test:deno
bun run typecheck
bun run lint
```

Important output summary:

- Bun-run Vitest passed 19 tests, including new CLI and self-hosting coverage.
- Node-run Vitest passed the same 19 tests.
- Deno smoke coverage passed 2 tests.
- TypeScript type-checking and oxlint passed.

## Review Findings

The sprint delivered the intended CLI slice and self-hosting path. No confirmed correctness bugs were found in the reviewed increment.

Residual risks:

- Hosted GitHub Actions success is still unproven in this review because the generated workflow has not yet been committed, pushed, and executed on GitHub Actions.
- `bun run format:check` currently fails in the dirty worktree because `.codex/skills/begin-sprint-planning/agents/openai.yaml` and `.codex/skills/finish-sprint-planning/agents/openai.yaml` are not formatted. That failure is outside the Sprint 3 implementation slice, but it would block the generated CI job if those files are included in the same change set.
- The repository prefers multi-agent sprint execution, but this sprint was executed serially in the current thread. The recorded reviewer personas satisfy the documentation contract, yet the team should use explicit delegated review roles in future sprint execution when tooling permissions allow it.

## Product Owner Decision

As Product Owner, Aoi Sakamoto accepts the Sprint 3 increment as delivered and does not add a new follow-up backlog item yet.

- The next scope intake should prioritize hosted CI confirmation and any repository-hygiene cleanup required to keep `bun run check` green in committed branches.
- No further workflow-surface expansion should be prioritized ahead of proving the self-hosted path in a clean branch, because the remaining uncertainty is operational verification rather than SDK or CLI feature breadth.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp3.md](../sprint_backlogs/sp3.md)
- [TEAM.md](../TEAM.md)
- [packages/cli/src/index.ts](../../packages/cli/src/index.ts)
- [packages/cli/src/cli.test.ts](../../packages/cli/src/cli.test.ts)
- [workflows/ci.ts](../../workflows/ci.ts)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [tests/node/self-hosting.test.ts](../../tests/node/self-hosting.test.ts)
