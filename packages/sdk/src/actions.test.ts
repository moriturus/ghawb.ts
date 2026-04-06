import { describe, expect, it } from "vitest";

import { createJobId, createWorkflowId } from "@ghawb/shared";

import { defineWorkflow } from "./builders.js";
import { typedActionStep } from "./actions.js";

describe("typedActionStep", () => {
  it("omits with when no inputs are provided", () => {
    expect(typedActionStep("actions/checkout@v6")).toEqual({ uses: "actions/checkout@v6" });
  });

  it("omits with when inputs are empty", () => {
    expect(typedActionStep("actions/checkout@v6", {})).toEqual({ uses: "actions/checkout@v6" });
  });

  it("preserves explicit with inputs", () => {
    const action = typedActionStep("actions/setup-node@v6", {
      "node-version": "22",
      cache: "pnpm",
    });

    expect(action).toEqual({
      uses: "actions/setup-node@v6",
      with: {
        "node-version": "22",
        cache: "pnpm",
      },
    });
  });

  it("allows job.uses() to accept a typed action step", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("typed-actions"),
      name: "Typed Actions",
    })
      .onPush()
      .addJob(createJobId("build"), (job) =>
        job
          .runsOn("ubuntu-latest")
          .uses(typedActionStep("actions/checkout@v6", { "fetch-depth": "1" }), "Checkout")
          .uses(
            typedActionStep("actions/setup-node@v6", {
              "node-version": "22",
              cache: "pnpm",
              "package-manager-cache": "true",
            }),
            {
              name: "Setup Node",
              id: "setup-node",
            }
          )
      )
      .build();

    expect(workflow.jobs[0]?.steps).toEqual([
      {
        kind: "uses",
        name: "Checkout",
        uses: "actions/checkout@v6",
        with: {
          "fetch-depth": "1",
        },
      },
      {
        kind: "uses",
        name: "Setup Node",
        id: "setup-node",
        uses: "actions/setup-node@v6",
        with: {
          "node-version": "22",
          cache: "pnpm",
          "package-manager-cache": "true",
        },
      },
    ]);
  });

  it("rejects metadata.with when a typed action step already defines with inputs", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("typed-actions-invalid"),
      name: "Typed Actions Invalid",
    }).onPush();

    expect(() =>
      workflow
        .addJob(createJobId("build"), (job) =>
          job
            .runsOn("ubuntu-latest")
            .uses(typedActionStep("actions/checkout@v6", { "fetch-depth": "1" }), {
              with: {
                ref: "refs/heads/main",
              },
            } as unknown as never)
        )
        .build()
    ).toThrowError(
      'uses() does not allow "metadata.with" when the first argument is a typed action step. Expected: pass typed action inputs through the typed action object.'
    );
  });
});
