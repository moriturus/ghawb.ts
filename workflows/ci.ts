import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout, actionsUploadArtifact } from "@ghawb/typed-actions";

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
      .uses("oven-sh/setup-bun@v2", "Setup Bun")
      .uses("denoland/setup-deno@v2", {
        name: "Setup Deno",
        with: {
          "deno-version": "2.x",
        },
      })
      .run("bun install --frozen-lockfile", "Install Dependencies")
      .run("bun run verify:workflows", "Verify Workflow Guardrails")
      .run("bun run check", "Run Bun Checks")
      .run("bun run coverage", "Run SDK Coverage")
      .uses(
        actionsUploadArtifact({
          name: "coverage-lcov",
          path: "coverage/lcov.info",
        }),
        "Upload Coverage Report"
      );
  })
  .build();
