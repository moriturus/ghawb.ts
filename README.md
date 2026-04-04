# ghawb

**Build GitHub Actions workflows and composite actions in TypeScript with full type safety, deterministic output, and zero non-Node dependencies.**

`ghawb` replaces hand-written YAML with fluent TypeScript builders that validate your workflow or composite action at construction time, catch mistakes before CI ever runs, and render deterministic YAML you can commit alongside your source.

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

const workflow = defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
})
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .addJob(createJobId("test"), (job) => {
    job.runsOn("ubuntu-latest").nodeCi({ nodeVersion: "22" });
  })
  .build();

export default workflow;
```

## Install

```bash
# npm
npm install @ghawb/sdk

# pnpm
pnpm add @ghawb/sdk

# yarn
yarn add @ghawb/sdk

# bun
bun add @ghawb/sdk
```

For CLI rendering to YAML:

```bash
npm install @ghawb/cli    # or pnpm / yarn / bun
```

For opt-in typed wrappers around common first-party actions:

```bash
npm install @ghawb/typed-actions    # or pnpm / yarn / bun
```

For opt-in composite action authoring:

```bash
npm install @ghawb/composite-actions    # or pnpm / yarn / bun
```

> **Runtime support:** Node 24+, Bun 1.x, Deno 2.x.
> The SDK and shared packages have zero production dependencies beyond Node built-ins.

## Quick Start

### 1. Define a workflow

Create a file (e.g. `workflows/ci.ts`):

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
})
  .onPush({ branches: ["main"] })
  .addJob(createJobId("build"), (job) => {
    job.runsOn("ubuntu-latest").nodeCi({ nodeVersion: "22" }).run("npm run build", "Build");
  })
  .build();
```

### 2. Render to YAML

```bash
npx ghawb render -i workflows/ci.ts
```

### 3. Commit both files

Treat the `.yml` as generated output from your TypeScript source.

## Examples

### CI with Concurrency

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
})
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .concurrency({
    group: "ci-${{ github.ref }}",
    cancelInProgress: true,
  })
  .addJob(createJobId("check"), (job) => {
    job.runsOn("ubuntu-latest").permissions({ contents: "read" }).nodeCi({ nodeVersion: "22" });
  })
  .build();
```

### Deployment with Environment

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("deploy"),
  name: "Deploy",
})
  .onPush({ branches: ["main"] })
  .addJob(createJobId("deploy"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .environment({ name: "production", url: "https://example.com" })
      .permissions({ contents: "read", deployments: "write" })
      .uses("actions/checkout@v4")
      .run("npm ci")
      .run("npm run build")
      .run("npm run deploy");
  })
  .build();
```

### Matrix Build

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("matrix"),
  name: "Matrix CI",
})
  .onPush({ branches: ["main"] })
  .addJob(createJobId("test"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .strategyMatrix({
        node: ["20", "22", "24"],
        os: ["ubuntu-latest", "windows-latest"],
      })
      .uses("actions/checkout@v4")
      .uses("actions/setup-node@v4", {
        with: { "node-version": "${{ matrix.node }}" },
      })
      .run("npm ci")
      .run("npm test");
  })
  .build();
```

### Typed Action Wrappers

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import {
  actionsCache,
  actionsCheckout,
  actionsSetupNode,
  actionsUploadArtifact,
} from "@ghawb/typed-actions";

export default defineWorkflow({
  id: createWorkflowId("typed-actions"),
  name: "Typed Actions",
})
  .onPush({ branches: ["main"] })
  .addJob(createJobId("build"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .uses(actionsCheckout({ fetchDepth: 0 }), "Checkout")
      .uses(
        actionsSetupNode({
          nodeVersion: "22",
          cache: "pnpm",
          cacheDependencyPath: ["pnpm-lock.yaml", "packages/*/pnpm-lock.yaml"],
        }),
        "Setup Node"
      )
      .uses(
        actionsCache({
          path: "~/.pnpm-store",
          key: "pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}",
          restoreKeys: "pnpm-${{ runner.os }}-",
        }),
        "Cache Store"
      )
      .run("pnpm install --frozen-lockfile")
      .run("pnpm test")
      .uses(actionsUploadArtifact({ name: "coverage", path: "coverage" }), "Upload Coverage");
  })
  .build();
```

Use `@ghawb/typed-actions` when you want autocomplete and typed `with` inputs for stable, common actions. Use raw `.uses("owner/repo@ref", { with: ... })` for one-off actions that do not justify a wrapper, and prefer `job.nodeCi()` when the default Node CI sequence is sufficient without action-level customization.

### Reusable Workflow

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("release"),
  name: "Release",
})
  .onPush({ tags: ["v*"] })
  .addJob(createJobId("publish"), (job) => {
    job
      .permissions({ contents: "read", packages: "write" })
      .usesWorkflow("octo-org/shared-workflows/.github/workflows/publish.yml@main", {
        with: { artifact: "dist" },
        outputs: ["artifact_url"],
        secrets: "inherit",
      });
  })
  .build();
```

## CLI Usage

The `@ghawb/cli` package provides the `ghawb` command.

```bash
# Render a single workflow
ghawb render -i workflows/ci.ts

# Render a composite action definition
ghawb render-action -i actions/setup-bun.ts -o actions/setup-bun/action.yml

# Render multiple workflows in one pass
ghawb render-batch \
  -i workflows/ci.ts      -o .github/workflows/ci.yml \
  -i workflows/deploy.ts  -o .github/workflows/deploy.yml
```

The CLI dynamically imports your TypeScript module and renders it to YAML using the bundled YAML adapter. `render` validates the default export is a `WorkflowDefinition` and, for the supported repository-local path `workflows/<name>.ts`, infers `.github/workflows/<name>.yml` when `--output` is omitted. `render-action` validates the default export is a built composite action definition and always requires an explicit `--output` path for the first slice.

## Supported Features

The SDK covers the majority of the [GitHub Actions workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions):

- **Triggers:** `push`, `pull_request`, `pull_request_target`, `workflow_dispatch`, `workflow_call`, `workflow_run`, `schedule`, `branch_protection_rule`, and 20+ simple event types with activity-type filtering
- **Jobs:** step-based and reusable-workflow jobs with `needs` dependency validation
- **Steps:** `run` (inline commands), `uses` (action references), script file references with optional expand mode
- **Strategy:** `matrix` with include/exclude, `fail-fast`, `max-parallel`
- **Permissions:** granular per-key maps and `read-all` / `write-all` shorthand, at workflow and job level
- **Environment:** named environments with optional URL, per-job and per-step `env` maps
- **Concurrency:** group-based with optional `cancel-in-progress`
- **Container & Services:** image, credentials, ports, volumes, Docker options
- **Defaults:** `defaults.run` for shell and working-directory
- **Step metadata:** `id`, `if`, `name`, `shell`, `working-directory`, `with`, `env`, `continue-on-error`, `timeout-minutes`
- **Typed helpers:** `actionRef()` / `workflowRef()` for validated references, `RunnerLabel` constants for standard runners
- **Typed action core:** `typedActionStep()` plus `TypedActionStep` for typed `uses` objects in the SDK
- **Opt-in typed action wrappers:** `@ghawb/typed-actions` exports typed wrappers for common first-party actions including checkout, cache, setup-node, setup-python, setup-go, setup-java, setup-dotnet, github-script, Pages deployment actions, labeler, and artifact upload/download
- **Opt-in composite actions:** `@ghawb/composite-actions` exports `defineCompositeAction()` plus a dedicated `ghawb render-action` path for the first composite-action slice (`name`, `description`, `inputs`, `outputs`, and ordered composite `runs.steps`)
- **Expression helpers:** `expr()`, context accessors (`github`, `env`, `secrets`, `matrix`, `inputs`, `steps`, `needs`), status-check functions (`success`, `failure`, `always`, `cancelled`), and comparison/logical helpers (`literal`, `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `and`, `or`, `not`) for type-safe `${{ }}` construction
- **Identifiers:** branded `WorkflowId` and `JobId` types with format validation

For the full support matrix, see [docs/SYNTAX_COVERAGE.md](docs/SYNTAX_COVERAGE.md).

### Still Limited Or Unsupported

- Composite actions currently support only the Sprint 20 initial slice: `name`, optional `description`, optional `inputs`, optional `outputs`, and composite `runs.steps` using `run`/`uses` plus `name`, `id`, `if`, `env`, `with`, `shell`, and `working-directory`
- A few GitHub App-only or deprecated webhook events are not modeled as workflow triggers (`deployment_protection_rule`, `installation*`, classic `project*`)

## Validation

The SDK validates workflows at `build()` time. If your workflow has structural issues, you get a `WorkflowValidationError` with an array of diagnostic issues — no CI round-trip required.

Validated constraints include: required triggers, non-empty job lists, step presence, identifier format, `needs` referential integrity, `outputs` step-reference validation, duplicate step IDs, permission-level correctness, cron format, matrix axis rules, double-shell rejection on script references, and more.

### Complementary YAML Validation with actionlint

The SDK catches structural and type-level problems at construction time, but it does not validate the _rendered_ YAML against GitHub's full runtime semantics. For YAML-level static analysis of generated workflow files, use the built-in CLI bridge:

```bash
# After rendering, verify the generated YAML with actionlint
ghawb render -i workflows/ci.ts
ghawb lint .github/workflows/ci.yml

# Render and lint in one step
ghawb render -i workflows/ci.ts --lint

# Lint multiple files
ghawb lint .github/workflows/*.yml
```

If `actionlint` is not installed, the CLI will exit with a clear message and installation instructions. You can also invoke [actionlint](https://github.com/rhysd/actionlint) directly:

```bash
actionlint .github/workflows/ci.yml
```

Using `ghawb` and `actionlint` together gives you type-safe construction _and_ YAML-level validation.

## Architecture

```
packages/
├── shared/   Branded identifiers (WorkflowId, JobId) and shared validation errors
├── sdk/      Workflow model, fluent builders, validation, deterministic renderer
├── composite-actions/  Opt-in composite action builder, validation, and renderer
├── typed-actions/      Opt-in typed wrappers for common action refs
├── yaml-import/        Opt-in reusable-workflow YAML import
└── cli/                CLI entrypoint, argument parsing, YAML adapter (yaml library)
```

- **Pure TypeScript** — no code generation, no macros, no build plugins.
- **Zero non-Node dependencies** in the SDK and shared packages.
- **Deterministic rendering** — the same builder input always produces the same YAML output.
- **Pluggable emission** — the renderer produces a structured payload; YAML serialization is injected at the CLI edge.

## Coverage

This project maintains **100% SDK line, statement, and function coverage** as measured by Vitest's v8 provider over `packages/sdk/src/`, with a **98% branch threshold**. This covers the workflow model, builders, validation, and renderer.

Coverage does not extend to the CLI package, shared utilities, or workflow source files. In this project, "100% coverage" refers to the primary SDK coverage bar over `packages/sdk/src/`, while branch coverage intentionally uses a slightly lower floor for a small set of low-value branches.

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the contributor verification flow and workflow authoring conventions.

### Verification Commands

```bash
bun run verify:pre-push    # Full pre-push verification (recommended)
bun run verify:workflows   # Workflow guardrail checks only
bun run check              # Format + lint + typecheck + tests
bun run coverage           # SDK line coverage with lcov output
bun run test               # Vitest + Deno tests
bun run test:vitest:node   # Node compatibility tests
bun run generate:workflows # Re-render all workflow sources
```

### Workflow Authoring Convention

Author committed workflow source modules inside the repository under [`workflows/`](./workflows). Treat `.github/workflows/*.yml` as generated output. Render every committed workflow module with `bun run generate:workflows` after changes, and commit the updated YAML alongside the source.

## Documentation

- [Specification](docs/SPEC.md) — current source of truth for behavior and constraints
- [Syntax Coverage](docs/SYNTAX_COVERAGE.md) — supported/unsupported workflow syntax matrix
- [Contributing](docs/CONTRIBUTING.md) — verification flow and workflow authoring guidance
- [Changelog](CHANGELOG.md) — release history
- [Releasing](RELEASING.md) — release workflow and publishing
- [Security](SECURITY.md) — vulnerability reporting policy
- [Support](SUPPORT.md) — support channels and compatibility policy
- [Documentation Index](docs/INDEX.md) — full list of project docs

## License

[Apache-2.0](LICENSE)
