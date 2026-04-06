import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout, actionsSetupNode } from "@ghawb/typed-actions";

export default defineWorkflow({
  id: createWorkflowId("manual_verify"),
  name: "Manual Verify",
})
  .onWorkflowDispatch()
  .addJob(createJobId("verify"), (job) => {
    job
      .runsOn(RunnerLabel.UbuntuLatest)
      .uses(actionsCheckout(), "Checkout")
      .uses("oven-sh/setup-bun@v2", {
        name: "Setup Bun",
      })
      .uses(actionsSetupNode({ nodeVersion: "22" }), "Setup Node")
      .uses("denoland/setup-deno@v2", {
        name: "Setup Deno",
        with: {
          "deno-version": "2.x",
        },
      })
      .run("bun install --frozen-lockfile", {
        name: "Install Dependencies",
      })
      .run("bun run verify:pre-push", {
        name: "Run Manual Verification",
      });
  })
  .build();
