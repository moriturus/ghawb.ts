# @ghawb/typed-actions

Typed wrappers for common GitHub Actions. Each helper returns a typed action step object that can be passed to `job.uses(...)` from `@ghawb/sdk`.

## Install

```bash
bunx jsr add @ghawb/typed-actions
```

For Deno:

```bash
deno add jsr:@ghawb/typed-actions
```

## Example

```ts
import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout, actionsUploadArtifact } from "@ghawb/typed-actions";

export default defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
})
  .onPush({ branches: ["main"] })
  .addJob(createJobId("test"), (job) => {
    job
      .runsOn("ubuntu-latest")
      .uses(actionsCheckout({ fetchDepth: 0 }), "Checkout")
      .run("bun test")
      .uses(actionsUploadArtifact({ name: "coverage", path: "coverage" }), "Upload Coverage");
  })
  .build();
```

## Included Helpers

The package includes wrappers for checkout, cache, setup-node, setup-python, setup-go, setup-java, setup-dotnet, github-script, GitHub Pages actions, labeler, and artifact upload/download actions.
