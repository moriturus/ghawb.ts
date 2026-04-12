# @ghawb/job-helpers

Opt-in job helper functions for common GitHub Actions job step sequences.

## Install

```bash
bunx jsr add @ghawb/job-helpers
```

For Deno:

```bash
deno add jsr:@ghawb/job-helpers
```

## Example

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { nodeCi } from "@ghawb/job-helpers";

export default defineWorkflow({
  id: createWorkflowId("node_ci"),
  name: "Node CI",
})
  .onPush({ branches: ["main"] })
  .addJob(createJobId("test"), (job) => {
    job.runsOn("ubuntu-latest").apply(
      nodeCi({
        nodeVersion: "24",
        install: "bun install --frozen-lockfile",
        test: "bun test",
      })
    );
  })
  .build();
```

## Helpers

- `nodeCi(options)`: checkout, setup-node, install, and test
- `nodeBootstrap(options)`: checkout, setup-node, and install

These helpers stay outside `@ghawb/sdk` so the core SDK remains focused on workflow modeling.
