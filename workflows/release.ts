import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout, actionsSetupNode } from "@ghawb/typed-actions";

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
      .uses(
        actionsSetupNode({
          nodeVersion: "24",
          registryUrl: "https://registry.npmjs.org",
        }),
        "Setup Node"
      )
      .run("npm install -g @changesets/cli", {
        name: "Install Changesets CLI",
      })
      .run("npm ci", {
        name: "Install Dependencies",
      })
      .uses("changesets/action@v1", {
        name: "Create Release Pull Request",
        with: {
          title: "chore(release): version packages",
          commit: "chore(release): version packages",
        },
        env: {
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
        },
      });
  })
  .build();
