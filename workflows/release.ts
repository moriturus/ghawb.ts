import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout } from "@ghawb/typed-actions";

export default defineWorkflow({
  id: createWorkflowId("release"),
  name: "Release",
})
  .onPush({
    branches: ["main"],
  })
  .permissions("read-all")
  .addJob(createJobId("release"), (job) => {
    job
      .runsOn(RunnerLabel.UbuntuLatest)
      .permissions({
        contents: "write",
        "pull-requests": "write",
      })
      .uses(actionsCheckout(), "Checkout")
      .uses("oven-sh/setup-bun@v2", "Setup Bun")
      .run("bun install --frozen-lockfile", "Install Dependencies")
      .uses("changesets/action@v1", {
        name: "Create Release Pull Request",
        with: {
          version: "bun x changeset version",
          title: "chore(release): version packages",
          commit: "chore(release): version packages",
        },
        env: {
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
        },
      });
  })
  .build();
