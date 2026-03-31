# Contributing Workflow Guidance

This document records the supported contributor path for verification and workflow authoring in `ghawb`.

## Clean-Branch Verification

Run verification from the repository root on a branch whose worktree is clean and contains only the intended committed change set.

1. Inspect branch state with `git status --short` and clear tracked or untracked leftovers before running the final verification command.
2. Run `bun run verify:pre-push`.
3. Inspect generated workflow diffs before pushing when the change touched [`workflows/`](../workflows) or `.github/workflows/`.
4. Push only when the remaining diff matches the intended branch scope.

`bun run verify:workflows` is the dedicated workflow guardrail command shared by local verification and hosted CI. It:

1. validates the supported repository-local workflow-source placement under `workflows/`
2. rejects unsupported source placement under `.github/workflows/`
3. renders every committed workflow source module and fails on generated-workflow drift

`bun run verify:pre-push` wraps that guardrail command and follows the rest of the repository's local pre-push path:

1. `bun run verify:workflows`
2. `bun run check`
3. `bun run test:vitest:node`

This command fails if the worktree is not clean, including untracked files. It is a contributor-facing verification shortcut, not a replacement for hosted CI proof when a backlog item explicitly requires hosted confirmation.

## Repository-Local Workflow Authoring

- Keep committed workflow source modules under [`workflows/`](../workflows).
- Do not rely on out-of-repository workflow source files for committed project workflows.
- Keep workflow entrypoints explicit by passing the intended module to `ghawb render` or the root `generate:workflows` command.
- Use `bun run generate:workflows` to render every committed workflow module, and commit generated `.github/workflows/*.yml` updates together with the source change that produced them.

## Related Commands

- `bun run generate:workflows`: render every committed workflow module under [`workflows/`](../workflows)
- `bun run verify:workflows`: validate workflow-source placement and generated-workflow drift
- `bun run verify:pre-push`: run the local pre-push verification path that matches the current hosted CI sequence
- `bun run check`: run format, lint, type-check, Bun Vitest, and Deno smoke checks
