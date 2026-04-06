import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { nodeBootstrap } from "@ghawb/job-helpers";

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
      .apply(
        nodeBootstrap({
          nodeVersion: "24",
          registryUrl: "https://registry.npmjs.org",
        })
      )
      .run("npm install -g @changesets/cli", {
        name: "Install Changesets CLI",
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
