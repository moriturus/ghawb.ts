import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

export default defineWorkflow({
  id: createWorkflowId("ci"),
  name: "CI",
})
  .onPush({
    branches: ["main"],
  })
  .onPullRequest({
    branches: ["main"],
  })
  .concurrency({
    group: "ci-${{ github.ref }}",
    cancelInProgress: true,
  })
  .addJob(createJobId("check"), (job) => {
    job
      .permissions({ contents: "read" })
      .runsOn("ubuntu-latest")
      .uses("actions/checkout@v4", {
        name: "Checkout",
      })
      .uses("oven-sh/setup-bun@v2", {
        name: "Setup Bun",
      })
      .uses("actions/setup-node@v4", {
        name: "Setup Node",
        with: {
          "node-version": "24",
        },
      })
      .uses("denoland/setup-deno@v2", {
        name: "Setup Deno",
        with: {
          "deno-version": "2.x",
        },
      })
      .run("bun install --frozen-lockfile", {
        name: "Install Dependencies",
      })
      .run("bun run verify:workflows", {
        name: "Verify Workflow Guardrails",
      })
      .run(
        "tsc -p packages/shared/tsconfig.build.json && tsc -p packages/sdk/tsconfig.build.json && tsc -p packages/cli/tsconfig.build.json",
        {
          name: "Build Packages",
        }
      )
      .run("bun run check", {
        name: "Run Bun Checks",
      })
      .run("bun run coverage", {
        name: "Run SDK Coverage",
      })
      .uses("actions/upload-artifact@v4", {
        name: "Upload Coverage Report",
        with: {
          name: "coverage-lcov",
          path: "coverage/lcov.info",
        },
      })
      .run("bun run test:vitest:node", {
        name: "Run Node Compatibility Tests",
      });
  })
  .build();
