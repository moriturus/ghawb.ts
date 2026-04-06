import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout } from "@ghawb/typed-actions";
import { nodeBootstrap } from "@ghawb/job-helpers";

export default defineWorkflow({
  id: createWorkflowId("publish"),
  name: "Publish",
})
  .onPush({
    tags: ["v*"],
  })
  .permissions("read-all")
  .addJob(createJobId("publish-npm"), (job) => {
    job
      .displayName("Publish to npm")
      .runsOn(RunnerLabel.UbuntuLatest)
      .permissions({ contents: "read" })
      .apply(
        nodeBootstrap({
          nodeVersion: "24",
          registryUrl: "https://registry.npmjs.org",
        })
      )
      .run("bun run build:check", {
        name: "Build Packages",
      })
      .run("npm test", {
        name: "Run Tests",
      })
      .run(
        [
          "npm publish --workspace packages/shared --access public",
          "npm publish --workspace packages/sdk --access public",
          "npm publish --workspace packages/cli --access public",
        ].join(" && "),
        {
          name: "Publish to npm",
          env: {
            NODE_AUTH_TOKEN: "${{ secrets.NPM_TOKEN }}",
          },
        }
      );
  })
  .addJob(createJobId("publish-jsr"), (job) => {
    job
      .displayName("Publish to JSR")
      .runsOn(RunnerLabel.UbuntuLatest)
      .permissions({
        contents: "read",
        "id-token": "write",
      })
      .uses(actionsCheckout(), "Checkout")
      .run("npx jsr publish", {
        name: "Publish to JSR",
      });
  })
  .addJob(createJobId("github-release"), (job) => {
    job
      .displayName("Create GitHub Release")
      .needs(["publish-npm", "publish-jsr"])
      .runsOn(RunnerLabel.UbuntuLatest)
      .permissions({
        contents: "write",
      })
      .uses(actionsCheckout(), "Checkout")
      .run(
        'gh release create "${{ github.ref_name }}" --title "${{ github.ref_name }}" --generate-notes',
        {
          name: "Create GitHub Release",
          env: {
            GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
          },
        }
      );
  })
  .build();
