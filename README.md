# ghawb

`ghawb` is a GitHub Actions Workflow Builder for TypeScript.

The project provides an SDK and CLI that generate GitHub Actions workflow files with a strong emphasis on type safety, robustness, and idempotency.
Its GitHub Actions workflow model is built in TypeScript, while YAML emission remains pluggable through injected external libraries and concrete adapters at the CLI edge.

## Principles

- Type-safe workflow construction
- Robust and idempotent generation
- Builder-, typestate-, and branded-type-oriented design
- Test-driven development
- Pure TypeScript with zero non-Node runtime dependencies

## Status

Sprint 3 is implemented. The repository now contains the SDK workspace, branded identifier factories without silent normalization, an immutable workflow builder with explicit `build()`-time validation, Vitest as the shared Bun/Node test platform, Deno smoke coverage, a deterministic renderer with an injected emitter boundary, a CLI that renders built workflow modules into YAML files, and self-hosted CI workflow generation through `ghawb`.

## Workspace

- `packages/shared`: branded identifiers and shared validation errors
- `packages/sdk`: workflow model, builders, validation, and deterministic rendering
- `packages/cli`: CLI entrypoint, argument parsing, and YAML adapter
- `workflows`: repository-authored workflow definitions rendered into matching `.github/workflows/*.yml` files

## Quality Commands

- `bun run verify:workflows`
- `bun run verify:pre-push`
- `bun run test`
- `bun run test:vitest`
- `bun run test:vitest:node`
- `bun run lint`
- `bun run format:check`
- `bun run typecheck`
- `bun run generate:workflows`

## Verification Flow

Before opening or updating a pull request, use a branch that contains only the intended change set and verify it from the repository root.

1. Confirm the branch is scoped to the intended work with `git status --short`.
2. Run `bun run verify:pre-push`.
3. If workflow sources changed, review any intended `.github/workflows/*.yml` diff before pushing.
4. Push only after the branch still reflects the intended change set.

`bun run verify:workflows` is the dedicated workflow guardrail command. It validates the supported repository-local workflow-source convention and detects generated-workflow drift for every committed workflow mapping.

`bun run verify:pre-push` wraps `bun run verify:workflows` with the rest of the current local verification path: clean-worktree enforcement, Bun-root checks, and Node compatibility coverage.

## Workflow Authoring Convention

- Author committed workflow source modules inside the repository under [`workflows/`](./workflows).
- Keep workflow module imports explicit, and prefer repository-owned workspace packages such as `@ghawb/sdk`.
- Treat `.github/workflows/*.yml` as generated output from repository-local TypeScript source, not as the primary authoring surface.
- Render every committed workflow module with `bun run generate:workflows` after changing any workflow source module, and commit the updated generated workflow files in the same change.

## Documentation

Core project documentation lives under [docs/INDEX.md](docs/INDEX.md).

- Current specification source of truth: [docs/SPEC.md](docs/SPEC.md)
- Prioritized implementation backlog: [docs/PRODUCT_BACKLOG.md](docs/PRODUCT_BACKLOG.md)
- Architecture decisions: [docs/adrs/0001-record-architecture-principles.md](docs/adrs/0001-record-architecture-principles.md)
