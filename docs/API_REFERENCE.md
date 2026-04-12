# API Reference

This document covers the public API of `@ghawb/sdk`. For a quick-start guide and the canonical `ghawb render` CLI path, see the [README](../README.md). For the specification source of truth, see [SPEC.md](SPEC.md). Related opt-in packages are `@ghawb/job-helpers`, `@ghawb/typed-actions`, `@ghawb/composite-actions`, and `@ghawb/reusable-workflow-import`.

## Table of Contents

- [Workflow Builder](#workflow-builder)
- [Job Builder](#job-builder)
- [Identifiers](#identifiers)
- [Typed References](#typed-references)
- [Typed Action Wrappers](#typed-action-wrappers)
- [Expression Helpers](#expression-helpers)
- [Runner Labels](#runner-labels)
- [Renderer](#renderer)
- [Permissions](#permissions)
- [Validation](#validation)
- [Known Gotchas](#known-gotchas)

---

## Workflow Builder

### `defineWorkflow(options)`

Creates a new `WorkflowBuilder`. This is the entry point for all workflow definitions.

```ts
import { defineWorkflow, createWorkflowId } from "@ghawb/sdk";

const workflow = defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `WorkflowId` | Yes | Branded workflow identifier created via `createWorkflowId()` |
| `name` | `string` | Yes | Display name for the workflow |

**Returns:** `WorkflowBuilder`

### WorkflowBuilder Methods

#### Triggers

| Method | Description |
|--------|-------------|
| `.onPush(options?)` | Trigger on push events. Accepts `branches`, `branches-ignore`, `paths`, `paths-ignore`, `tags`, `tags-ignore` filters. |
| `.onPullRequest(options?)` | Trigger on pull request events. Accepts `branches`, `branches-ignore`, `paths`, `paths-ignore`, `types` filters. |
| `.onPullRequestTarget(options?)` | Trigger on pull_request_target events. Same filters as pull request. |
| `.onWorkflowDispatch(options?)` | Manual trigger. Accepts `inputs` map with `description`, `required`, `default`, `type`, `options`. |
| `.onWorkflowCall(options?)` | Make this workflow reusable. Accepts `inputs`, `outputs`, `secrets`. |
| `.onWorkflowRun(options)` | Trigger on other workflow completions. Requires `workflows` array. |
| `.onSchedule(crons)` | Trigger on cron schedules. |
| `.on(event)` / `.on(event, options)` | Generic trigger for any supported event type. |

#### Workflow Configuration

| Method | Description |
|--------|-------------|
| `.runName(template)` | Set `run-name` for dynamically named runs. |
| `.permissions(perms)` | Set workflow-level permissions. Accepts a map or `"read-all"` / `"write-all"`. |
| `.defaults(options)` | Set workflow-level defaults for `run` steps (`shell`, `working-directory`). |
| `.env(variables)` | Set workflow-level environment variables. |
| `.concurrency(config)` | Set workflow-level concurrency. Accepts `{ group, cancelInProgress? }`. |

#### Jobs

| Method | Description |
|--------|-------------|
| `.addJob(id, configureFn)` | Add a step-based job. The callback receives a `JobBuilder`. |

#### Build

| Method | Description |
|--------|-------------|
| `.build()` | Validate and produce a frozen `WorkflowDefinition`. Throws `WorkflowValidationError` on failure. |

---

## Job Builder

The `JobBuilder` is received in the `.addJob()` callback. It configures a single step-based job.

### Job Configuration

| Method | Description |
|--------|-------------|
| `.displayName(name)` | Set the job's display name. ⚠️ See [Known Gotchas](#known-gotchas). |
| `.runsOn(target)` | **Required.** Set the runner. Accepts a string, string array, or object `{ group?, labels? }`. |
| `.needs(deps)` | Declare job dependencies. Accepts `JobId` or `JobId[]`. |
| `.ifCondition(expr)` | Set the job-level `if` condition. |
| `.permissions(perms)` | Set job-level permissions. |
| `.environment(env)` | Set deployment environment. Accepts a string or `{ name, url? }`. |
| `.concurrency(config)` | Set job-level concurrency. |
| `.defaults(options)` | Set job-level defaults for `run` steps. |
| `.env(variables)` | Set job-level environment variables. |
| `.continueOnError(value)` | Allow the job to continue on step failure. |
| `.timeoutMinutes(minutes)` | Set job timeout. |
| `.outputs(map)` | Declare job outputs. Values reference step outputs. |
| `.apply(helper)` | Apply a generic opt-in job helper and return the job builder for chaining. |
| `.container(config)` | Run steps in a container. |
| `.services(map)` | Define service containers. |
| `.usesWorkflow(source, options?)` | Convert this job into a reusable-workflow job. `options.outputs` declares caller-side reusable workflow output names when they cannot be inferred from an injected workflow object. |

### Strategy

| Method | Description |
|--------|-------------|
| `.strategyMatrix(axes)` | Define matrix axes. Each key maps to a non-empty string array. |
| `.strategyInclude(entries)` | Add matrix include entries. |
| `.strategyExclude(entries)` | Add matrix exclude entries. |
| `.failFast(value)` | Control whether to cancel remaining jobs on failure. |
| `.maxParallel(count)` | Limit concurrent matrix jobs. |

### Steps

| Method | Description |
|--------|-------------|
| `.run(script, metadata?)` | Add a run step. |
| `.uses(action, metadata?)` | Add a uses step. Accepts either an `ActionRef` string or a typed action step object. |
| `.runScript(options, metadata?)` | Add a script file reference step. |

**Step metadata fields:** `name`, `id`, `if`, `env`, `shell`, `with`, `workingDirectory`, `continueOnError`, `timeoutMinutes`.

### Node CI and Bootstrap Helpers (`@ghawb/job-helpers`)

```ts
import { nodeBootstrap, nodeCi } from "@ghawb/job-helpers";

job.apply(nodeCi(options));
job.apply(nodeBootstrap(options));
```

`nodeCi(options)` returns a helper function for `JobBuilder.apply(...)` that appends a standard Node CI step sequence (checkout, setup-node, install, test) to the given job builder. Requires `nodeVersion` and defaults `install` to `npm ci` plus `test` to `npm test`. Optional `cache` follows the `actions/setup-node` allowlist (`npm`, `pnpm`, `yarn`), and `cacheDependencyPath` accepts either a string or string array. Existing `nodeCi(job, options)` calls remain supported as a migration path.

`nodeBootstrap(options)` returns a helper function for `JobBuilder.apply(...)` that appends a shared Node bootstrap prefix (checkout, setup-node, install) to the given job builder. It requires `nodeVersion`, defaults `install` to `npm ci`, supports the same `cache` and `cacheDependencyPath` setup-node options as the Node CI helper, and adds a `registryUrl` setup-node option for registry bootstrapping. The helper stays outside `@ghawb/sdk` and keeps follow-up steps explicit at the call site.

---

## Identifiers

### `createWorkflowId(value)`

Creates a branded `WorkflowId`. Validates the shared identifier format `^[a-zA-Z_][a-zA-Z0-9_-]*$`: the value must start with a letter or underscore and may then contain letters, digits, underscores, or hyphens.

```ts
import { createWorkflowId } from "@ghawb/sdk";
const id = createWorkflowId("my-workflow");
```

### `createJobId(value)`

Creates a branded `JobId`. Same validation rules as `WorkflowId`.

```ts
import { createJobId } from "@ghawb/sdk";
const id = createJobId("build");
```

---

## Typed References

### `actionRef(value)`

Creates a validated `ActionRef` for use in `.uses()` steps. Supports three forms:

| Form | Example |
|------|---------|
| External | `"actions/checkout@v6"` |
| Local | `"./path/to/action"` |
| Docker | `"docker://alpine:3.18"` |

```ts
import { actionRef } from "@ghawb/sdk";
const ref = actionRef("actions/checkout@v6");
```

### `workflowRef(value)`

Creates a validated `WorkflowRef` for use in `.usesWorkflow()`. Supports two forms:

| Form | Example |
|------|---------|
| External | `"owner/repo/.github/workflows/ci.yml@main"` |
| Local | `"./.github/workflows/ci.yml"` |

### `isValidActionRef(value)` / `isValidWorkflowRef(value)`

Runtime validation predicates returning `boolean`.

---

## Typed Action Wrappers

The SDK keeps the typed action core surface (`typedActionStep()` and `TypedActionStep`) and accepts typed action step objects in `.uses(...)`. Manual-first wrappers for several high-frequency first-party actions live in the opt-in `@ghawb/typed-actions` package.

Each wrapper accepts an optional second argument `{ version?: string }` to override the default action ref for that call.

### `actionsCheckout(inputs?)`

Returns a typed action wrapper for `actions/checkout@v6`.

### `actionsCache(inputs)`

Returns a typed action wrapper for `actions/cache@v5`.

### `actionsSetupNode(inputs?)`

Returns a typed action wrapper for `actions/setup-node@v6`.

### `actionsSetupPython(inputs?)`

Returns a typed action wrapper for `actions/setup-python@v6`.

### `actionsSetupGo(inputs?)`

Returns a typed action wrapper for `actions/setup-go@v6`.

### `actionsSetupJava(inputs)`

Returns a typed action wrapper for `actions/setup-java@v5`.

### `actionsSetupDotnet(inputs?)`

Returns a typed action wrapper for `actions/setup-dotnet@v5`.

### `actionsGithubScript(inputs)`

Returns a typed action wrapper for `actions/github-script@v9`.

### `actionsConfigurePages(inputs?)`

Returns a typed action wrapper for `actions/configure-pages@v6`.

### `actionsUploadPagesArtifact(inputs)`

Returns a typed action wrapper for `actions/upload-pages-artifact@v5`.

### `actionsDeployPages(inputs?)`

Returns a typed action wrapper for `actions/deploy-pages@v5`.

### `actionsLabeler(inputs?)`

Returns a typed action wrapper for `actions/labeler@v6`.

### `actionsUploadArtifact(inputs?)`

Returns a typed action wrapper for `actions/upload-artifact@v7`.

### `actionsDownloadArtifact(inputs?)`

Returns a typed action wrapper for `actions/download-artifact@v8`.

```ts
import { actionsCache, actionsCheckout, actionsSetupNode } from "@ghawb/typed-actions";

job
  .uses(actionsCheckout({ fetchDepth: 0 }), "Checkout")
  .uses(actionsCache({ path: "~/.pnpm-store", key: "pnpm-${{ runner.os }}" }), "Cache")
  .uses(
    actionsSetupNode({
      nodeVersion: "24",
      cache: "pnpm",
      packageManagerCache: true,
    }),
    "Setup Node"
  );

job.uses(actionsCheckout({}, { version: "v5" }), "Legacy Checkout");
```

Notes:

- Wrapper selection currently favors widely used, stable first-party actions across checkout, caching, language setup, GitHub maintenance, and Pages deployment paths rather than exhaustive wrapper generation.
- Wrapper versions are pinned explicitly in `@ghawb/typed-actions` rather than generated from upstream `action.yml` metadata.
- Per-call ref overrides are available through the optional `{ version }` second argument when a workflow needs an older or custom ref.
- Wrapper inputs serialize booleans and numbers into the string-valued `with` payload required by GitHub Actions.
- Multivalue wrapper inputs use newline-delimited or comma-delimited serialization when the upstream action expects those shapes.
- When a typed action step is passed to `.uses(...)`, do not also pass `metadata.with`; the typed action object owns that surface.

---

## Expression Helpers

Helpers for constructing GitHub Actions expression strings without raw `${{ }}` interpolation.

### `expr(content)`

Wraps a string in `${{ }}`. Rejects empty or blank content.

```ts
import { expr } from "@ghawb/sdk";
expr("github.ref == 'refs/heads/main'");
// → "${{ github.ref == 'refs/heads/main' }}"
```

### Context Reference Helpers

These helpers return expression fragments such as `github.ref` or `success()`. Wrap them with `expr(...)` when you need a full `${{ ... }}` string.

| Helper | Example Output |
|--------|---------------|
| `github(path)` | `github.ref` |
| `env(name)` | `env.CI` |
| `secrets(name)` | `secrets.GITHUB_TOKEN` |
| `matrix(key)` | `matrix.os` |
| `inputs(name)` | `inputs.target` |
| `steps(id).outputs(name)` | `steps.build.outputs.artifact` |
| `needs(jobId).outputs(name)` | `needs.deploy.outputs.artifact_url` |

### Literal And Operator Helpers

| Helper | Output |
|--------|--------|
| `literal("push")` | `'push'` |
| `literal(1)` | `1` |
| `literal(true)` | `true` |
| `eq(left, right)` | `github.ref == 'refs/heads/main'` |
| `ne(left, right)` | `github.ref != 'refs/heads/main'` |
| `gt(left, right)` | `steps.check.outputs.count > 1` |
| `gte(left, right)` | `steps.check.outputs.count >= 1` |
| `lt(left, right)` | `steps.check.outputs.count < 10` |
| `lte(left, right)` | `steps.check.outputs.count <= 10` |
| `and(a, b, ...)` | `success() && github.event_name == 'push'` |
| `or(a, b, ...)` | `failure() || cancelled()` |
| `not(value)` | `!cancelled()` |

### Status Check Helpers

| Helper | Output |
|--------|--------|
| `success()` | `success()` |
| `always()` | `always()` |
| `cancelled()` | `cancelled()` |
| `failure()` | `failure()` |

---

## Runner Labels

The `RunnerLabel` constant object provides typed GitHub-hosted runner labels with IDE autocomplete.

```ts
import { RunnerLabel } from "@ghawb/sdk";

job.runsOn(RunnerLabel.UbuntuLatest);    // "ubuntu-latest"
job.runsOn(RunnerLabel.MacOS15);         // "macos-15"
job.runsOn(RunnerLabel.WindowsLatest);   // "windows-latest"
```

Custom or self-hosted string labels are always accepted via the `string` fallback.

---

## Renderer

### `renderWorkflow(definition, emitter)`

Converts a `WorkflowDefinition` into its final output string by:
1. Creating an intermediate render payload via `createWorkflowRenderPayload()`
2. Passing the payload to the provided emitter function

```ts
import { renderWorkflow } from "@ghawb/sdk";
import { stringify } from "yaml";

const yaml = renderWorkflow(workflow, (payload) =>
  stringify(payload, { defaultStringType: "PLAIN", lineWidth: 0 })
);
```

### `createWorkflowRenderPayload(definition)`

Creates the intermediate JSON-like render payload without emitting. Useful when you need the payload for custom processing.

---

## Permissions

Permissions can be set at workflow or job level. Use a map for granular control or a shorthand string.

```ts
// Granular
workflow.permissions({
  contents: "read",
  pullRequests: "write",
});

// Shorthand
workflow.permissions("read-all");
```

**Available permission keys:** `actions`, `attestations`, `checks`, `contents`, `deployments`, `discussions`, `idToken`, `issues`, `packages`, `pages`, `pullRequests`, `securityEvents`, `statuses`.

---

## Validation

All validation happens at `.build()` time. The builder collects **all** validation errors before throwing, so you see every issue at once.

```ts
try {
  workflow.build();
} catch (error) {
  if (error instanceof WorkflowValidationError) {
    console.error(error.issues); // string[] of all validation failures
  }
}
```

**Key validations:**
- At least one trigger required
- Every step-based job must have `runsOn` and at least one step
- Job `needs` must reference previously declared jobs
- Action and workflow references validated against documented forms
- Empty/blank strings rejected for identifiers, labels, and expression content
- Matrix axis names validated against `^[a-zA-Z_][a-zA-Z0-9_-]*$`

---

## Known Gotchas

### `displayName()` not `name()`

The job builder method for setting a job's display name is **`.displayName()`**, not `.name()`.

This naming exists because `JobBuilder` is a class and JavaScript's `Function.prototype.name` is a built-in read-only property. Using `.name()` would shadow it, leading to confusing runtime behavior.

```ts
// ✅ Correct
job.displayName("Build and Test");

// ❌ Wrong — .name() does not exist on JobBuilder
// job.name("Build and Test");
```

The workflow builder uses `.runName()` for the `run-name` field (which also avoids the `Function.name` collision).

### Build errors are batched

The builder does **not** fail on the first validation error. It collects all issues and throws them together. This means you may see multiple errors at once — fix them all before re-running.

### Workflow definitions are deeply frozen

After `.build()`, the returned `WorkflowDefinition` and all nested objects are frozen. You cannot mutate them. This is intentional — it guarantees deterministic rendering.
