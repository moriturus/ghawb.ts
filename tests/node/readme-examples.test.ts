/**
 * Verify that every code example in the README compiles and produces
 * a valid WorkflowDefinition that can be rendered without errors.
 */
import { describe, expect, it } from "vitest";
import {
  createJobId,
  createWorkflowId,
  createWorkflowRenderPayload,
  defineWorkflow,
} from "@ghawb/sdk";
import {
  actionsCache,
  actionsCheckout,
  actionsSetupNode,
  actionsUploadArtifact,
} from "@ghawb/typed-actions";
import { nodeCi } from "@ghawb/job-helpers";

describe("README examples", () => {
  it("hero example: basic CI", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPush({ branches: ["main"] })
      .onPullRequest({ branches: ["main"] })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").apply(nodeCi({ nodeVersion: "24" }));
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    expect(payload.name).toBe("CI");
    expect(Object.keys(payload.jobs)).toHaveLength(1);
    expect(payload.jobs["test"]).toBeDefined();
  });

  it("CI with concurrency", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPush({ branches: ["main"] })
      .onPullRequest({ branches: ["main"] })
      .concurrency({
        group: "ci-${{ github.ref }}",
        cancelInProgress: true,
      })
      .addJob(createJobId("check"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .permissions({ contents: "read" })
          .apply(nodeCi({ nodeVersion: "24" }));
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    expect(payload.name).toBe("CI");
    expect(payload.concurrency).toBeDefined();
    expect(payload.concurrency!.group).toBe("ci-${{ github.ref }}");
  });

  it("deployment with environment", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("deploy"),
      name: "Deploy",
    })
      .onPush({ branches: ["main"] })
      .addJob(createJobId("deploy"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .environment({ name: "production", url: "https://example.com" })
          .permissions({ contents: "read", deployments: "write" })
          .uses("actions/checkout@v6")
          .run("npm ci")
          .run("npm run build")
          .run("npm run deploy");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    expect(payload.name).toBe("Deploy");
    expect(Object.keys(payload.jobs)).toHaveLength(1);
  });

  it("matrix build", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("matrix"),
      name: "Matrix CI",
    })
      .onPush({ branches: ["main"] })
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .strategyMatrix({
            node: ["20", "22", "24"],
            os: ["ubuntu-latest", "windows-latest"],
          })
          .uses("actions/checkout@v6")
          .uses("actions/setup-node@v6", {
            with: { "node-version": "${{ matrix.node }}" },
          })
          .run("npm ci")
          .run("npm test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    expect(payload.name).toBe("Matrix CI");
    expect(payload.jobs["test"]).toBeDefined();
  });

  it("reusable workflow", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("release"),
      name: "Release",
    })
      .onPush({ tags: ["v*"] })
      .addJob(createJobId("publish"), (job) => {
        job
          .permissions({ contents: "read", packages: "write" })
          .usesWorkflow("octo-org/shared-workflows/.github/workflows/publish.yml@main", {
            with: { artifact: "dist" },
            secrets: "inherit",
          });
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    expect(payload.name).toBe("Release");
    const publishJob = payload.jobs["publish"];
    expect(publishJob).toBeDefined();
    expect(publishJob!["uses"]).toBe(
      "octo-org/shared-workflows/.github/workflows/publish.yml@main"
    );
  });

  it("typed action wrappers", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("typed-actions"),
      name: "Typed Actions",
    })
      .onPush({ branches: ["main"] })
      .addJob(createJobId("build"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .uses(actionsCheckout({ fetchDepth: 0 }), "Checkout")
          .uses(
            actionsSetupNode({
              nodeVersion: "24",
              cache: "pnpm",
              cacheDependencyPath: ["pnpm-lock.yaml", "packages/*/pnpm-lock.yaml"],
            }),
            "Setup Node"
          )
          .uses(
            actionsCache({
              path: "~/.pnpm-store",
              key: "pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}",
              restoreKeys: "pnpm-${{ runner.os }}-",
            }),
            "Cache Store"
          )
          .run("pnpm install --frozen-lockfile")
          .run("pnpm test")
          .uses(actionsUploadArtifact({ name: "coverage", path: "coverage" }), "Upload Coverage");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    expect(payload.name).toBe("Typed Actions");
    const buildJob = payload.jobs["build"];
    expect(buildJob).toBeDefined();
    expect(buildJob!["steps"]).toHaveLength(6);
  });
});
