# ghawb

**Build GitHub Actions workflows in TypeScript with full type safety, deterministic output, and zero non-Node dependencies.**

`ghawb` replaces hand-written YAML with a fluent TypeScript builder that validates your workflows at construction time, catches mistakes before CI ever runs, and renders deterministic YAML you can commit alongside your source.

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

const workflow = defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
})
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .addJob(createJobId("test"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4")
      .uses("actions/setup-node@v4", { with: { "node-version": "22" } })
      .run("npm ci", { name: "Install" })
      .run("npm test", { name: "Test" });
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
    job
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4")
      .run("npm ci")
      .run("npm run build")
      .run("npm test");
  })
  .build();
```

### 2. Render to YAML

```bash
npx ghawb render --input workflows/ci.ts --output .github/workflows/ci.yml
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
    job
      .runsOn("ubuntu-latest")
      .permissions({ contents: "read" })
      .uses("actions/checkout@v4")
      .run("npm ci")
      .run("npm test");
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
ghawb render --input workflows/ci.ts --output .github/workflows/ci.yml

# Render multiple workflows in one pass
ghawb render-batch \
  --input workflows/ci.ts      --output .github/workflows/ci.yml \
  --input workflows/deploy.ts  --output .github/workflows/deploy.yml
```

The CLI dynamically imports your TypeScript module, validates the default export is a `WorkflowDefinition`, and renders it to YAML using the bundled YAML adapter.

## Supported Features

The SDK covers the majority of the [GitHub Actions workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions):

- **Triggers:** `push`, `pull_request`, `pull_request_target`, `workflow_dispatch`, `workflow_call`, `workflow_run`, `schedule`, and 20+ simple event types with activity-type filtering
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
- **Typed action wrappers:** `actionsCheckout()`, `actionsSetupNode()`, `actionsUploadArtifact()`, and `actionsDownloadArtifact()` for typed `with` inputs on common first-party actions
- **Expression helpers:** `expr()`, context accessors (`github`, `env`, `secrets`, `matrix`, `inputs`, `steps`, `needs`), status-check functions (`success`, `failure`, `always`, `cancelled`), and comparison/logical helpers (`literal`, `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `and`, `or`, `not`) for type-safe `${{ }}` construction
- **Identifiers:** branded `WorkflowId` and `JobId` types with format validation

For the full support matrix, see [docs/SYNTAX_COVERAGE.md](docs/SYNTAX_COVERAGE.md).

### Not Yet Supported

- Composite action definitions (actions-level, not workflow-level)
- A small number of niche trigger types (`branch_protection_rule`, `deployment_protection_rule`, GitHub App events)

## Validation

The SDK validates workflows at `build()` time. If your workflow has structural issues, you get a `WorkflowValidationError` with an array of diagnostic issues — no CI round-trip required.

Validated constraints include: required triggers, non-empty job lists, step presence, identifier format, `needs` referential integrity, `outputs` step-reference validation, duplicate step IDs, permission-level correctness, cron format, matrix axis rules, double-shell rejection on script references, and more.

### Complementary YAML Validation with actionlint

The SDK catches structural and type-level problems at construction time, but it does not validate the _rendered_ YAML against GitHub's full runtime semantics. For YAML-level static analysis of generated workflow files, use the built-in CLI bridge:

```bash
# After rendering, verify the generated YAML with actionlint
ghawb render --input workflows/ci.ts --output .github/workflows/ci.yml
ghawb lint .github/workflows/ci.yml

# Render and lint in one step
ghawb render --input workflows/ci.ts --output .github/workflows/ci.yml --lint

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
└── cli/      CLI entrypoint, argument parsing, YAML adapter (yaml library)
```

- **Pure TypeScript** — no code generation, no macros, no build plugins.
- **Zero non-Node dependencies** in the SDK and shared packages.
- **Deterministic rendering** — the same builder input always produces the same YAML output.
- **Pluggable emission** — the renderer produces a structured payload; YAML serialization is injected at the CLI edge.

## Coverage

This project maintains **100% SDK line coverage** as measured by Vitest's v8 provider over `packages/sdk/src/`. This covers the workflow model, builders, validation, and renderer.

Coverage does not extend to the CLI package, shared utilities, or workflow source files. "100% coverage" in this project always means SDK line coverage specifically.

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
