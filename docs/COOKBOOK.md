# Cookbook

Practical workflow patterns using `@ghawb/sdk`. Each recipe is a self-contained example you can adapt. For the full API surface, see [API_REFERENCE.md](API_REFERENCE.md).

## Table of Contents

- [CI Pipeline](#ci-pipeline)
- [Matrix Build](#matrix-build)
- [Deploy with Environment](#deploy-with-environment)
- [Manual Dispatch with Inputs](#manual-dispatch-with-inputs)
- [Reusable Workflow](#reusable-workflow)
- [Calling a Reusable Workflow](#calling-a-reusable-workflow)
- [Self-Hosted Runners with Groups](#self-hosted-runners-with-groups)
- [Conditional Steps with Expressions](#conditional-steps-with-expressions)
- [Container Job with Services](#container-job-with-services)
- [Concurrency Control](#concurrency-control)
- [Multi-Trigger Workflow](#multi-trigger-workflow)

---

## CI Pipeline

A basic CI workflow that runs on push and pull request.

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
})
  .onPush({ branches: ["main"] })
  .onPullRequest({ branches: ["main"] })
  .addJob(createJobId("test"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4", { name: "Checkout" })
      .uses("actions/setup-node@v4", {
        name: "Setup Node",
        with: { "node-version": "22" },
      })
      .run("npm ci", { name: "Install" })
      .run("npm test", { name: "Test" });
  })
  .build();
```

---

## Matrix Build

Test across multiple OS and Node versions.

```ts
import { createJobId, createWorkflowId, defineWorkflow, matrix } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("matrix-ci"),
  name: "Matrix CI",
})
  .onPush({ branches: ["main"] })
  .addJob(createJobId("test"), (job) => {
    job
      .matrix({ os: ["ubuntu-latest", "macos-latest"], node: ["20", "22"] })
      .failFast(false)
      .runsOn(matrix("os"))
      .uses("actions/checkout@v4")
      .uses("actions/setup-node@v4", {
        with: { "node-version": matrix("node") },
      })
      .run("npm ci")
      .run("npm test");
  })
  .build();
```

---

## Deploy with Environment

Deploy to a named environment with a URL.

```ts
import { createJobId, createWorkflowId, defineWorkflow, github } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("deploy"),
  name: "Deploy",
})
  .onPush({ branches: ["main"] })
  .permissions({ contents: "read", deployments: "write" })
  .addJob(createJobId("deploy"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .environment({ name: "production", url: "https://example.com" })
      .uses("actions/checkout@v4")
      .run("npm ci && npm run build")
      .run("npm run deploy", {
        env: { DEPLOY_TOKEN: github("token") },
      });
  })
  .build();
```

---

## Manual Dispatch with Inputs

A workflow triggered manually with typed inputs.

```ts
import { createJobId, createWorkflowId, defineWorkflow, inputs } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("release"),
  name: "Release",
})
  .onWorkflowDispatch({
    inputs: {
      version: {
        description: "Release version",
        required: true,
        type: "string",
      },
      dry_run: {
        description: "Skip publish",
        required: false,
        type: "boolean",
        default: "false",
      },
    },
  })
  .addJob(createJobId("publish"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4")
      .run(`echo "Publishing version ${inputs("version")}"`)
      .run("npm publish", {
        if: inputs("dry_run") + " != 'true'",
      });
  })
  .build();
```

---

## Reusable Workflow

Define a workflow that can be called by other workflows.

```ts
import { createJobId, createWorkflowId, defineWorkflow, secrets } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("shared-build"),
  name: "Shared Build",
})
  .onWorkflowCall({
    inputs: {
      node_version: {
        description: "Node version to use",
        required: false,
        type: "string",
        default: "22",
      },
    },
    secrets: {
      npm_token: {
        description: "NPM publish token",
        required: true,
      },
    },
  })
  .addJob(createJobId("build"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4")
      .run("npm ci")
      .run("npm run build", {
        env: { NPM_TOKEN: secrets("npm_token") },
      });
  })
  .build();
```

---

## Calling a Reusable Workflow

Reference another workflow by ref string or by builder object.

```ts
import { createJobId, createWorkflowId, defineWorkflow, workflowRef } from "@ghawb/sdk";

// By ref string
export default defineWorkflow({
  id: createWorkflowId("caller"),
  name: "Caller",
})
  .onPush({ branches: ["main"] })
  .usesWorkflow(
    createJobId("build"),
    workflowRef("org/shared/.github/workflows/build.yml@main"),
    { with: { node_version: "22" }, secrets: "inherit" }
  )
  .build();
```

You can also pass a `WorkflowBuilder` or `WorkflowDefinition` directly to `usesWorkflow()`. The SDK derives the local ref and validates the target's `workflow_call` trigger at build time.

---

## Self-Hosted Runners with Groups

Use the `runs-on` object form for runner groups and labels.

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("self-hosted"),
  name: "Self-Hosted",
})
  .onPush()
  .addJob(createJobId("build"), (job) => {
    job
      .runsOn({ group: "production", labels: ["x64", "linux"] })
      .uses("actions/checkout@v4")
      .run("make build");
  })
  .build();
```

Three forms are supported: `group`-only, `labels`-only, or both together.

---

## Conditional Steps with Expressions

Use expression helpers for type-safe conditions.

```ts
import {
  createJobId, createWorkflowId, defineWorkflow,
  github, env, success, failure, steps,
} from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("conditional"),
  name: "Conditional",
})
  .onPush()
  .addJob(createJobId("check"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .run("npm test", { id: "tests" })
      .run("echo 'Tests passed!'", {
        if: success(),
      })
      .run("echo 'Tests failed!'", {
        if: failure(),
      })
      .run(`echo "Result: ${steps("tests").outputs("conclusion")}"`, {
        if: "${{ always() }}",
      });
  })
  .build();
```

---

## Container Job with Services

Run steps inside a container with a PostgreSQL service.

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("integration"),
  name: "Integration Tests",
})
  .onPush()
  .addJob(createJobId("test"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .container({
        image: "node:22",
        env: { CI: "true" },
      })
      .services({
        postgres: {
          image: "postgres:16",
          credentials: { username: "user", password: "pass" },
          env: {
            POSTGRES_DB: "test",
            POSTGRES_USER: "user",
            POSTGRES_PASSWORD: "pass",
          },
          ports: [5432],
        },
      })
      .run("npm ci")
      .run("npm test", {
        env: { DATABASE_URL: "postgresql://user:pass@postgres:5432/test" },
      });
  })
  .build();
```

---

## Concurrency Control

Prevent concurrent deployments.

```ts
import { createJobId, createWorkflowId, defineWorkflow, github } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("deploy"),
  name: "Deploy",
})
  .onPush({ branches: ["main"] })
  .concurrency({
    group: `deploy-${github("ref")}`,
    cancelInProgress: true,
  })
  .addJob(createJobId("deploy"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4")
      .run("npm run deploy");
  })
  .build();
```

---

## Multi-Trigger Workflow

Combine multiple triggers in one workflow.

```ts
import { createJobId, createWorkflowId, defineWorkflow, github } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("full-ci"),
  name: "Full CI",
})
  .onPush({
    branches: ["main"],
    paths: ["src/**", "package.json"],
  })
  .onPullRequest({
    branches: ["main"],
    types: ["opened", "synchronize"],
  })
  .onSchedule(["0 6 * * 1"])
  .addJob(createJobId("lint"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4")
      .run("npm run lint");
  })
  .addJob(createJobId("test"), (job) => {
    job
      .needs(createJobId("lint"))
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4")
      .run("npm test");
  })
  .build();
```
