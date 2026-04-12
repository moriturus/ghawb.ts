# @ghawb/sdk

Core TypeScript SDK for authoring GitHub Actions workflows with builder APIs, validation, expression helpers, typed references, and deterministic render payloads.

## Install

```bash
bunx jsr add @ghawb/sdk
```

For Deno:

```bash
deno add jsr:@ghawb/sdk
```

## Example

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
})
  .onPush({ branches: ["main"] })
  .addJob(createJobId("test"), (job) => {
    job.runsOn("ubuntu-latest").run("bun test");
  })
  .build();
```

## Scope

Use this package for workflow AST construction, validation, render payload generation, expression helpers, runner labels, action refs, and reusable workflow refs.

For command-line YAML rendering, add `@ghawb/cli`. For composite `action.yml` authoring, add `@ghawb/composite-actions`.
