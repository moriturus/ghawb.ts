import { describe, expect, it } from "vitest";

import { createJobId, createWorkflowId } from "@ghawb/shared";

import { defineWorkflow } from "./builders.js";
import {
  actionsCheckout,
  actionsDownloadArtifact,
  actionsSetupNode,
  actionsUploadArtifact,
} from "./actions.js";

describe("typed action wrappers", () => {
  it("builds checkout wrapper inputs with serialized booleans and numbers", () => {
    expect(
      actionsCheckout({
        fetchDepth: 0,
        lfs: true,
        persistCredentials: false,
        sparseCheckout: ["src", "tests"],
        submodules: "recursive",
      })
    ).toEqual({
      uses: "actions/checkout@v4",
      with: {
        "fetch-depth": "0",
        lfs: "true",
        "persist-credentials": "false",
        "sparse-checkout": "src\ntests",
        submodules: "recursive",
      },
    });
  });

  it("builds setup-node wrapper inputs with typed cache fields", () => {
    expect(
      actionsSetupNode({
        nodeVersion: "22",
        cache: "pnpm",
        cacheDependencyPath: ["pnpm-lock.yaml", "packages/*/pnpm-lock.yaml"],
        packageManagerCache: true,
      })
    ).toEqual({
      uses: "actions/setup-node@v4",
      with: {
        "node-version": "22",
        cache: "pnpm",
        "cache-dependency-path": "pnpm-lock.yaml\npackages/*/pnpm-lock.yaml",
        "package-manager-cache": "true",
      },
    });
  });

  it("builds upload/download artifact wrappers with their documented input names", () => {
    expect(
      actionsUploadArtifact({
        name: "dist",
        path: ["dist", "coverage"],
        overwrite: true,
        retentionDays: 7,
      })
    ).toEqual({
      uses: "actions/upload-artifact@v4",
      with: {
        name: "dist",
        path: "dist\ncoverage",
        overwrite: "true",
        "retention-days": "7",
      },
    });

    expect(
      actionsDownloadArtifact({
        artifactIds: [123, "456"],
        mergeMultiple: true,
        runId: 789,
      })
    ).toEqual({
      uses: "actions/download-artifact@v4",
      with: {
        "artifact-ids": "123,456",
        "merge-multiple": "true",
        "run-id": "789",
      },
    });
  });

  it("allows job.uses() to accept a typed action wrapper", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("typed-actions"),
      name: "Typed Actions",
    })
      .onPush()
      .addJob(createJobId("build"), (job) =>
        job
          .runsOn("ubuntu-latest")
          .uses(actionsCheckout({ fetchDepth: 1 }), "Checkout")
          .uses(actionsSetupNode({ nodeVersion: "22", cache: "pnpm", packageManagerCache: true }), {
            name: "Setup Node",
            id: "setup-node",
          })
      )
      .build();

    expect(workflow.jobs[0]?.steps).toEqual([
      {
        kind: "uses",
        name: "Checkout",
        uses: "actions/checkout@v4",
        with: {
          "fetch-depth": "1",
        },
      },
      {
        kind: "uses",
        name: "Setup Node",
        id: "setup-node",
        uses: "actions/setup-node@v4",
        with: {
          "node-version": "22",
          cache: "pnpm",
          "package-manager-cache": "true",
        },
      },
    ]);
  });

  it("rejects metadata.with when a typed action wrapper already defines with inputs", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("typed-actions-invalid"),
      name: "Typed Actions Invalid",
    }).onPush();

    expect(() =>
      workflow
        .addJob(createJobId("build"), (job) =>
          job.runsOn("ubuntu-latest").uses(actionsCheckout({ fetchDepth: 1 }), {
            with: {
              ref: "refs/heads/main",
            },
          } as unknown as never)
        )
        .build()
    ).toThrowError(
      'uses() does not allow "metadata.with" when the first argument is a typed action wrapper. Expected: pass typed action inputs through the wrapper function.'
    );
  });
});
