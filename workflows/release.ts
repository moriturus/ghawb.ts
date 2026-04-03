import { createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";

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
      .runsOn("ubuntu-latest")
      .permissions({
        contents: "write",
        "pull-requests": "write",
      })
      .uses("actions/checkout@v4", {
        name: "Checkout",
      })
      .uses("actions/setup-node@v4", {
        name: "Setup Node",
        with: {
          "node-version": "24",
          "registry-url": "https://registry.npmjs.org",
        },
      })
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
