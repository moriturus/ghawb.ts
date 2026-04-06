import { describe, expect, it } from "vitest";
import { createJobId, createWorkflowId, defineWorkflow, WorkflowValidationError } from "@ghawb/sdk";
import { nodeBootstrap } from "@ghawb/job-helpers";

describe("nodeBootstrap", () => {
  it("builds the default checkout/setup/install step sequence", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_bootstrap"),
      name: "Node Bootstrap",
    })
      .onPush()
      .addJob(createJobId("setup"), (job) => {
        job.runsOn("ubuntu-latest").apply(nodeBootstrap({ nodeVersion: "22" }));
      })
      .build();

    expect(workflow.jobs[0]).toEqual({
      kind: "steps",
      id: "setup",
      runsOn: "ubuntu-latest",
      steps: [
        {
          kind: "uses",
          name: "Checkout",
          uses: "actions/checkout@v4",
        },
        {
          kind: "uses",
          name: "Setup Node",
          uses: "actions/setup-node@v4",
          with: {
            "node-version": "22",
          },
        },
        {
          kind: "run",
          name: "Install",
          run: "npm ci",
        },
      ],
    });
  });

  it("supports custom install commands and setup-node options", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_bootstrap_custom"),
      name: "Node Bootstrap Custom",
    })
      .onPush()
      .addJob(createJobId("setup"), (job) => {
        job.runsOn("ubuntu-latest").apply(
          nodeBootstrap({
            nodeVersion: "24",
            install: "pnpm install --frozen-lockfile",
            cache: "pnpm",
            cacheDependencyPath: ["pnpm-lock.yaml", "packages/*/pnpm-lock.yaml"],
            registryUrl: "https://registry.npmjs.org",
          })
        );
      })
      .build();

    expect(workflow.jobs[0]).toEqual({
      kind: "steps",
      id: "setup",
      runsOn: "ubuntu-latest",
      steps: [
        {
          kind: "uses",
          name: "Checkout",
          uses: "actions/checkout@v4",
        },
        {
          kind: "uses",
          name: "Setup Node",
          uses: "actions/setup-node@v4",
          with: {
            "node-version": "24",
            cache: "pnpm",
            "cache-dependency-path": "pnpm-lock.yaml\npackages/*/pnpm-lock.yaml",
            "registry-url": "https://registry.npmjs.org",
          },
        },
        {
          kind: "run",
          name: "Install",
          run: "pnpm install --frozen-lockfile",
        },
      ],
    });
  });

  it("supports string cache dependency paths", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_bootstrap_cache_dependency_path_string"),
      name: "Node Bootstrap Cache Dependency Path String",
    })
      .onPush()
      .addJob(createJobId("setup"), (job) => {
        job.runsOn("ubuntu-latest").apply(
          nodeBootstrap({
            nodeVersion: "24",
            cache: "npm",
            cacheDependencyPath: "package-lock.json",
          })
        );
      })
      .build();

    expect(workflow.jobs[0]).toEqual({
      kind: "steps",
      id: "setup",
      runsOn: "ubuntu-latest",
      steps: [
        {
          kind: "uses",
          name: "Checkout",
          uses: "actions/checkout@v4",
        },
        {
          kind: "uses",
          name: "Setup Node",
          uses: "actions/setup-node@v4",
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
      ],
    });
  });

  it("returns the job builder for chaining", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("node_bootstrap_chain"),
      name: "Node Bootstrap Chain",
    })
      .onPush()
      .addJob(createJobId("setup"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .apply(nodeBootstrap({ nodeVersion: "22" }))
          .run("npm test", "Test");
      })
      .build();

    const steps = workflow.jobs[0]!.steps;
    expect(steps).toBeDefined();
    expect(steps).toHaveLength(4);
    expect(steps![3]).toEqual({
      kind: "run",
      name: "Test",
      run: "npm test",
    });
  });

  it("rejects blank nodeVersion input", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("node_bootstrap_invalid"),
        name: "Node Bootstrap Invalid",
      })
        .onPush()
        .addJob(createJobId("setup"), (job) => {
          job.runsOn("ubuntu-latest").apply(nodeBootstrap({ nodeVersion: "  " }));
        })
    ).toThrowError(
      new WorkflowValidationError([
        'nodeBootstrap() requires "nodeVersion" to be a non-empty string.',
      ])
    );
  });

  it("rejects blank install input", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("node_bootstrap_install_invalid"),
        name: "Node Bootstrap Install Invalid",
      })
        .onPush()
        .addJob(createJobId("setup"), (job) => {
          job.runsOn("ubuntu-latest").apply(nodeBootstrap({ nodeVersion: "22", install: "   " }));
        })
    ).toThrowError(
      new WorkflowValidationError([
        'nodeBootstrap() requires "install" to be omitted or a non-empty string.',
      ])
    );
  });

  it("rejects blank registryUrl input", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("node_bootstrap_registry_invalid"),
        name: "Node Bootstrap Registry Invalid",
      })
        .onPush()
        .addJob(createJobId("setup"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .apply(nodeBootstrap({ nodeVersion: "22", registryUrl: "   " }));
        })
    ).toThrowError(
      new WorkflowValidationError([
        'nodeBootstrap() requires "registryUrl" to be omitted or a non-empty string.',
      ])
    );
  });
});
