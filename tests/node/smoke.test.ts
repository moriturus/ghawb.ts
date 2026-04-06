import { describe, expect, it } from "vitest";

import { createJobId, createWorkflowId, defineWorkflow, WorkflowValidationError } from "@ghawb/sdk";

describe("node smoke coverage via Vitest", () => {
  it("can build the minimal Sprint 1 workflow slice", () => {
    const builtWorkflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(builtWorkflow.jobs[0]?.steps?.[0]?.kind).toBe("run");
  });

  it("sees explicit workflow validation errors", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("broken"),
      name: "Broken",
    });

    expect(() => builder.build()).toThrow(WorkflowValidationError);
  });
});
