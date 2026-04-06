import { describe, expect, it } from "vitest";
import { createJobId, createWorkflowId, defineWorkflow, WorkflowValidationError } from "@ghawb/sdk";
import { nodeCi } from "@ghawb/job-helpers";

describe("nodeCi", () => {
  it("builds the default checkout/setup/install/test step sequence", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_ci"),
      name: "Node CI",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").apply(nodeCi({ nodeVersion: "22" }));
      })
      .build();

    expect(workflow.jobs[0]).toEqual({
      kind: "steps",
      id: "test",
      runsOn: "ubuntu-latest",
      steps: [
        {
          kind: "uses",
          name: "Checkout",
          uses: "actions/checkout@v6",
        },
        {
          kind: "uses",
          name: "Setup Node",
          uses: "actions/setup-node@v6",
          with: {
            "node-version": "22",
          },
        },
        {
          kind: "run",
          name: "Install",
          run: "npm ci",
        },
        {
          kind: "run",
          name: "Test",
          run: "npm test",
        },
      ],
    });
  });

  it("supports custom commands and setup-node cache options", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_ci_custom"),
      name: "Node CI Custom",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").apply(
          nodeCi({
            nodeVersion: "24",
            cache: "pnpm",
            cacheDependencyPath: ["pnpm-lock.yaml", "packages/*/pnpm-lock.yaml"],
            install: "pnpm install --frozen-lockfile",
            test: "pnpm test",
          })
        );
      })
      .build();

    expect(workflow.jobs[0]).toEqual({
      kind: "steps",
      id: "test",
      runsOn: "ubuntu-latest",
      steps: [
        {
          kind: "uses",
          name: "Checkout",
          uses: "actions/checkout@v6",
        },
        {
          kind: "uses",
          name: "Setup Node",
          uses: "actions/setup-node@v6",
          with: {
            "node-version": "24",
            cache: "pnpm",
            "cache-dependency-path": "pnpm-lock.yaml\npackages/*/pnpm-lock.yaml",
          },
        },
        {
          kind: "run",
          name: "Install",
          run: "pnpm install --frozen-lockfile",
        },
        {
          kind: "run",
          name: "Test",
          run: "pnpm test",
        },
      ],
    });
  });

  it("supports string setup-node cache dependency paths", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_ci_cache_dependency_path_string"),
      name: "Node CI Cache Dependency Path String",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").apply(
          nodeCi({
            nodeVersion: "24",
            cache: "npm",
            cacheDependencyPath: "package-lock.json",
          })
        );
      })
      .build();

    expect(workflow.jobs[0]).toEqual({
      kind: "steps",
      id: "test",
      runsOn: "ubuntu-latest",
      steps: [
        {
          kind: "uses",
          name: "Checkout",
          uses: "actions/checkout@v6",
        },
        {
          kind: "uses",
          name: "Setup Node",
          uses: "actions/setup-node@v6",
          with: {
            "node-version": "24",
            cache: "npm",
            "cache-dependency-path": "package-lock.json",
          },
        },
        {
          kind: "run",
          name: "Install",
          run: "npm ci",
        },
        {
          kind: "run",
          name: "Test",
          run: "npm test",
        },
      ],
    });
  });

  it("returns the job builder for optional chaining", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_ci_chain"),
      name: "Node CI Chain",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .apply(nodeCi({ nodeVersion: "22" }))
          .run("npm run lint", "Lint");
      })
      .build();

    const steps = workflow.jobs[0]!.steps;
    expect(steps).toBeDefined();
    expect(steps).toHaveLength(5);
    expect(steps![4]).toEqual({
      kind: "run",
      name: "Lint",
      run: "npm run lint",
    });
  });

  it("keeps the positional helper signature for migration compatibility", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_ci_legacy"),
      name: "Node CI Legacy",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        nodeCi(job.runsOn("ubuntu-latest"), { nodeVersion: "22" });
      })
      .build();

    const steps = workflow.jobs[0]!.steps;
    expect(steps).toHaveLength(4);
    expect(steps![0]).toEqual({
      kind: "uses",
      name: "Checkout",
      uses: "actions/checkout@v6",
    });
  });

  it("rejects blank nodeVersion input", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("node_ci_invalid"),
        name: "Node CI Invalid",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          nodeCi(job.runsOn("ubuntu-latest"), { nodeVersion: "  " });
        })
    ).toThrowError(
      new WorkflowValidationError(['nodeCi() requires "nodeVersion" to be a non-empty string.'])
    );
  });

  it("rejects blank install input", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("node_ci_install_invalid"),
        name: "Node CI Install Invalid",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          nodeCi(job.runsOn("ubuntu-latest"), { nodeVersion: "22", install: "   " });
        })
    ).toThrowError(
      new WorkflowValidationError([
        'nodeCi() requires "install" to be omitted or a non-empty string.',
      ])
    );
  });

  it("rejects blank test input", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("node_ci_test_invalid"),
        name: "Node CI Test Invalid",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          nodeCi(job.runsOn("ubuntu-latest"), { nodeVersion: "22", test: "   " });
        })
    ).toThrowError(
      new WorkflowValidationError(['nodeCi() requires "test" to be omitted or a non-empty string.'])
    );
  });
});
