import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout, actionsSetupNode, actionsUploadArtifact } from "@ghawb/typed-actions";

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
      .runsOn(RunnerLabel.UbuntuLatest)
      .uses(actionsCheckout(), "Checkout")
      .uses("oven-sh/setup-bun@v2", {
        name: "Setup Bun",
      })
      .uses(actionsSetupNode({ nodeVersion: "24" }), "Setup Node")
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
      .run("bun run build:check", {
        name: "Build Packages",
      })
      .run("bun run check", {
        name: "Run Bun Checks",
      })
      .run("bun run coverage", {
        name: "Run SDK Coverage",
      })
      .uses(
        actionsUploadArtifact({
          name: "coverage-lcov",
          path: "coverage/lcov.info",
        }),
        "Upload Coverage Report"
      )
      .run("bun run test:vitest:node", {
        name: "Run Node Compatibility Tests",
      })
      .run("npm install --dry-run", {
        name: "Verify npm Compatibility",
      });
  })
  .build();
