import { RunnerLabel, createJobId, createWorkflowId, defineWorkflow } from "@ghawb/sdk";
import { actionsCheckout } from "@ghawb/typed-actions";

const packages = [
  "sdk",
  "shared",
  "job-helpers",
  "typed-actions",
  "yaml-import",
  "composite-actions",
  "cli",
];

export default defineWorkflow({
  id: createWorkflowId("publish"),
  name: "Publish",
})
  .onPush({
    tags: ["v*"],
  })
  .permissions("read-all")
  .addJob(createJobId("publish-npm"), (job) => {
    let baseJobs = job
      .displayName("Publish to npm")
      .runsOn(RunnerLabel.UbuntuLatest)
      .permissions({
        contents: "read",
        "id-token": "write",
      })
      .uses(actionsCheckout(), "Checkout")
      .uses("actions/setup-node@v6", {
        name: "Setup NPM",
        with: {
          "node-version": "24",
          "registry-url": "https://registry.npmjs.org",
        },
      })
      .uses("oven-sh/setup-bun@v2", "Setup Bun")
      .run("bun install --frozen-lockfile", "Install Dependencies")
      .run("bun run build:check", "Build Packages");

    for (const pack of packages) {
      baseJobs = baseJobs.run(`npm publish --workspace packages/${pack} --access public`, {
        name: `Publish to npmjs.org: ${pack}`,
        env: {
          NODE_AUTH_TOKEN: "${{ secrets.NPM_TOKEN }}",
        },
      });
    }
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
      .uses("oven-sh/setup-bun@v2", "Setup Bun")
      .run("bun install --frozen-lockfile", "Install Dependencies")
      .run("bun x jsr publish", "Publish to jsr.io");
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
