# @ghawb/reusable-workflow-import

Import existing reusable workflow YAML files as validated `WorkflowRef` values for `usesWorkflow(...)`.

## Install

```bash
bunx jsr add @ghawb/reusable-workflow-import
```

For Deno:

```bash
deno add jsr:@ghawb/reusable-workflow-import
```

## Example

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { importReusableWorkflow } from "@ghawb/reusable-workflow-import";

const sharedBuild = await importReusableWorkflow(".github/workflows/shared-build.yml");

export default defineWorkflow({
  id: createWorkflowId("release"),
  name: "Release",
})
  .onPush({ tags: ["v*"] })
  .addJob(createJobId("build"), (job) => {
    job.usesWorkflow(sharedBuild, {
      secrets: "inherit",
    });
  })
  .build();
```

The imported YAML file must contain a `workflow_call` trigger. Invalid YAML, missing reusable-workflow triggers, and unreadable files fail with `ReusableWorkflowImportError`.
