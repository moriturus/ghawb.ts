import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout } from "@ghawb/typed-actions";

export default defineWorkflow({
  id: createWorkflowId("manual_verify"),
  name: "Manual Verify",
})
  .onWorkflowDispatch()
  .addJob(createJobId("verify"), (job) => {
    job
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
      .run("bun run verify:pre-push", "Run Manual Verification");
  })
  .build();
