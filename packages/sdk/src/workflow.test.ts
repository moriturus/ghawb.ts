import { describe, expect, it } from "vitest";

import { createJobId, createWorkflowId, WorkflowValidationError } from "@ghawb/shared";

import { defineWorkflow, createWorkflowRenderPayload, actionRef, workflowRef } from "./index.js";
import type { ActionRef, ReusableWorkflowJob, StepsJob, WorkflowRef } from "./index.js";

describe("workflow builder", () => {
  it("builds a representative Sprint 1 workflow model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPush({
        branches: ["main"],
        paths: ["packages/**"],
      })
      .onPullRequest({
        branches: ["main"],
      })
      .addJob(createJobId("lint"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .uses("actions/checkout@v4", {
            name: "Checkout",
          })
          .run("bun run lint", {
            name: "Lint",
            if: "github.event_name == 'push'",
            env: {
              CI: "true",
            },
          });
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn(["ubuntu-latest", "self-hosted"]).run("bun test", {
          with: {
            coverage: "true",
          },
        });
      })
      .build();

    expect(workflow.id).toBe("ci");
    expect(workflow.name).toBe("CI");
    expect(workflow.on).toEqual([
      {
        type: "push",
        branches: ["main"],
        paths: ["packages/**"],
      },
      {
        type: "pull_request",
        branches: ["main"],
      },
    ]);
    expect(workflow.jobs).toEqual([
      {
        kind: "steps",
        id: "lint",
        runsOn: "ubuntu-latest",
        steps: [
          {
            kind: "uses",
            uses: "actions/checkout@v4",
            name: "Checkout",
          },
          {
            kind: "run",
            run: "bun run lint",
            name: "Lint",
            env: {
              CI: "true",
            },
            if: "github.event_name == 'push'",
          },
        ],
      },
      {
        kind: "steps",
        id: "test",
        runsOn: ["ubuntu-latest", "self-hosted"],
        steps: [
          {
            kind: "run",
            run: "bun test",
            with: {
              coverage: "true",
            },
          },
        ],
      },
    ]);
  });

  it("builds jobs with runs-on group-only object form", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("runs_on_group"),
      name: "Runs On Group",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.runsOn({ group: "production" }).run("echo deploy");
      })
      .build();

    const job = workflow.jobs[0] as StepsJob;
    expect(job.runsOn).toEqual({ group: "production" });
  });

  it("builds jobs with runs-on labels-only object form", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("runs_on_labels"),
      name: "Runs On Labels",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn({ labels: ["self-hosted", "linux"] }).run("echo build");
      })
      .build();

    const job = workflow.jobs[0] as StepsJob;
    expect(job.runsOn).toEqual({ labels: ["self-hosted", "linux"] });
  });

  it("builds jobs with runs-on group+labels object form", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("runs_on_group_labels"),
      name: "Runs On Group Labels",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn({ group: "production", labels: ["self-hosted", "x64"] }).run("echo build");
      })
      .build();

    const job = workflow.jobs[0] as StepsJob;
    expect(job.runsOn).toEqual({ group: "production", labels: ["self-hosted", "x64"] });
  });

  it("rejects runs-on object with neither group nor labels", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("empty_runs_on_obj"),
      name: "Empty Runs On Object",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn({} as any).run("echo build");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "build" runs-on object must define at least one of "group" or "labels". Expected: { group?: string; labels?: string[] }',
      ])
    );
  });

  it("rejects runs-on object with blank group", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("blank_group"),
      name: "Blank Group",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn({ group: "  " }).run("echo build");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "build" runs-on group must not be empty. Expected: a non-blank runner group name',
      ])
    );
  });

  it("rejects runs-on object with empty labels array", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("empty_labels"),
      name: "Empty Labels",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn({ labels: [] as any }).run("echo build");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "build" runs-on labels must be a non-empty array. Expected: at least one runner label',
      ])
    );
  });

  it("rejects runs-on object with blank label values", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("blank_labels"),
      name: "Blank Labels",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn({ labels: ["self-hosted", "  "] }).run("echo build");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['job "build" runs-on labels must not contain blank values'])
    );
  });

  it("builds workflows with workflow_dispatch triggers", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("manual"),
      name: "Manual",
    })
      .onWorkflowDispatch()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "workflow_dispatch",
      },
    ]);
  });

  it("builds workflows with workflow_call triggers", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("reusable"),
      name: "Reusable",
    })
      .onWorkflowCall({
        inputs: {
          environment: {
            description: "Target environment",
            required: true,
            default: "staging",
            type: "string",
          },
        },
        outputs: {
          artifact_url: {
            description: "Artifact URL",
            value: "${{ jobs.build.outputs.artifact_url }}",
          },
        },
        secrets: {
          token: {
            description: "Deployment token",
            required: true,
          },
        },
      })
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "workflow_call",
        inputs: {
          environment: {
            description: "Target environment",
            required: true,
            default: "staging",
            type: "string",
          },
        },
        outputs: {
          artifact_url: {
            description: "Artifact URL",
            value: "${{ jobs.build.outputs.artifact_url }}",
          },
        },
        secrets: {
          token: {
            description: "Deployment token",
            required: true,
          },
        },
      },
    ]);
  });

  it("builds workflows with schedule triggers", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("nightly"),
      name: "Nightly",
    })
      .onSchedule(["0 0 * * *", "30 12 * * 1-5"])
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "schedule",
        cron: ["0 0 * * *", "30 12 * * 1-5"],
      },
    ]);
  });

  it("builds workflows with ordered job dependencies", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("pipeline"),
      name: "Pipeline",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run build");
      })
      .addJob(createJobId("test"), (job) => {
        job.needs(createJobId("build")).runsOn("ubuntu-latest").run("bun test");
      })
      .addJob(createJobId("deploy"), (job) => {
        job
          .needs([createJobId("build"), createJobId("test")])
          .runsOn("ubuntu-latest")
          .run("bun run deploy");
      })
      .build();

    expect(workflow.jobs).toEqual([
      {
        kind: "steps",
        id: "build",
        runsOn: "ubuntu-latest",
        steps: [
          {
            kind: "run",
            run: "bun run build",
          },
        ],
      },
      {
        kind: "steps",
        id: "test",
        needs: ["build"],
        runsOn: "ubuntu-latest",
        steps: [
          {
            kind: "run",
            run: "bun test",
          },
        ],
      },
      {
        kind: "steps",
        id: "deploy",
        needs: ["build", "test"],
        runsOn: "ubuntu-latest",
        steps: [
          {
            kind: "run",
            run: "bun run deploy",
          },
        ],
      },
    ]);
  });

  it("builds workflows with strategy matrices", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("matrix"),
      name: "Matrix",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .strategyMatrix({
            os: ["ubuntu-latest", "windows-latest"],
            node: ["18", "20"],
          })
          .runsOn("${{ matrix.os }}")
          .run("bun test");
      })
      .build();

    expect(workflow.jobs).toEqual([
      {
        kind: "steps",
        id: "test",
        strategy: {
          matrix: {
            os: ["ubuntu-latest", "windows-latest"],
            node: ["18", "20"],
          },
        },
        runsOn: "${{ matrix.os }}",
        steps: [
          {
            kind: "run",
            run: "bun test",
          },
        ],
      },
    ]);
  });

  it("builds workflows with workflow-level and job-level permissions", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("permissions"),
      name: "Permissions",
    })
      .onPush()
      .permissions({
        actions: "read",
        contents: "write",
        "pull-requests": "none",
      })
      .addJob(createJobId("check"), (job) => {
        job
          .permissions({
            checks: "write",
            "id-token": "write",
            models: "read",
          })
          .runsOn("ubuntu-latest")
          .run("bun test");
      })
      .build();

    expect(workflow).toMatchObject({
      permissions: {
        actions: "read",
        contents: "write",
        "pull-requests": "none",
      },
      jobs: [
        {
          id: "check",
          permissions: {
            checks: "write",
            "id-token": "write",
            models: "read",
          },
        },
      ],
    });
  });

  it("builds workflows with workflow-level defaults and permissions shorthand", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("workflow_defaults_permissions_shorthand"),
      name: "Workflow Defaults And Permissions Shorthand",
    })
      .onPush()
      .permissions("read-all")
      .defaultsRun({
        shell: "bash",
        workingDirectory: "./",
      })
      .addJob(createJobId("check"), (job) => {
        job.permissions("write-all").runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow).toMatchObject({
      permissions: "read-all",
      defaults: {
        run: {
          shell: "bash",
          workingDirectory: "./",
        },
      },
      jobs: [
        {
          id: "check",
          permissions: "write-all",
        },
      ],
    });
  });

  it("builds workflows with execution environment metadata on jobs and run steps", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("execution_metadata"),
      name: "Execution Metadata",
    })
      .onPush()
      .addJob(createJobId("check"), (job) => {
        job
          .timeoutMinutes(15)
          .defaultsRun({
            shell: "bash",
            workingDirectory: "./packages/sdk",
          })
          .runsOn("ubuntu-latest")
          .run("bun test", {
            shell: "sh",
            workingDirectory: "./packages/sdk",
          });
      })
      .build();

    expect(workflow.jobs).toEqual([
      {
        kind: "steps",
        id: "check",
        timeoutMinutes: 15,
        defaults: {
          run: {
            shell: "bash",
            workingDirectory: "./packages/sdk",
          },
        },
        runsOn: "ubuntu-latest",
        steps: [
          {
            kind: "run",
            run: "bun test",
            shell: "sh",
            workingDirectory: "./packages/sdk",
          },
        ],
      },
    ]);
  });

  it("builds workflows with workflow-level and job-level concurrency controls", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("concurrency"),
      name: "Concurrency",
    })
      .onPush()
      .concurrency({
        group: "deploy",
        cancelInProgress: true,
      })
      .addJob(createJobId("check"), (job) => {
        job
          .concurrency({
            group: "check-${{ github.ref }}",
          })
          .runsOn("ubuntu-latest")
          .run("bun test");
      })
      .build();

    expect(workflow).toMatchObject({
      concurrency: {
        group: "deploy",
        cancelInProgress: true,
      },
      jobs: [
        {
          id: "check",
          concurrency: {
            group: "check-${{ github.ref }}",
          },
        },
      ],
    });
  });

  it("validates the full Sprint 1 slice at build time", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid"),
      name: "   ",
    })
      .onPush({
        branches: [],
      })
      .addJob(createJobId("job"), (job) => {
        job.runsOn(["ubuntu-latest", " "]).run("   ", {
          name: " ",
          if: " ",
          env: {
            " ": "true",
          },
        });
      })
      .addJob(createJobId("job"), (job) => {
        job.uses("actions/checkout@v4");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        "workflow name must not be empty",
        'trigger "push" branches must not be empty',
        'job "job" runs-on array must not contain blank values',
        'job "job" step 1 must define a non-empty run value',
        'job "job" step 1 name must not be empty',
        'job "job" step 1 if must not be empty',
        'job "job" step 1 env must not contain blank keys',
        'duplicate job id "job"',
        'job "job" must define runs-on. Expected: a runner label string, array of labels, or object with group/labels',
      ])
    );
  });

  it("requires at least one trigger and one job", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("empty"),
      name: "Empty",
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        "workflow must define at least one trigger. Expected: at least one trigger (e.g. push, pull_request, workflow_dispatch)",
        "workflow must define at least one job. Expected: at least one job definition",
      ])
    );
  });

  it("rejects jobs without steps", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("job_without_steps"),
      name: "Job Without Steps",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "build" must define at least one step. Expected: at least one run or uses step',
      ])
    );
  });

  it("rejects duplicate trigger definitions", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("duplicate_triggers"),
      name: "Duplicate Triggers",
    })
      .onPush({
        branches: ["main"],
      })
      .onPush({
        branches: ["release"],
      })
      .addJob(createJobId("lint"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run lint");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['duplicate trigger "push"'])
    );
  });

  it("rejects duplicate workflow_dispatch trigger definitions", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("duplicate_dispatch_triggers"),
      name: "Duplicate Dispatch Triggers",
    })
      .onWorkflowDispatch()
      .onWorkflowDispatch()
      .addJob(createJobId("lint"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run lint");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['duplicate trigger "workflow_dispatch"'])
    );
  });

  it("rejects duplicate schedule trigger definitions", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("duplicate_schedule_triggers"),
      name: "Duplicate Schedule Triggers",
    })
      .onSchedule("0 3 * * *")
      .onSchedule("0 6 * * *")
      .addJob(createJobId("lint"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run lint");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['duplicate trigger "schedule"'])
    );
  });

  it("fails explicitly when workflow_dispatch is given unsupported filters", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_dispatch"),
      name: "Invalid Dispatch",
    }).addJob(createJobId("lint"), (job) => {
      job.runsOn("ubuntu-latest").run("bun run lint");
    });

    (
      builder.triggers as unknown as Array<
        | {
            type: "workflow_dispatch";
            branches?: readonly string[];
            paths?: readonly string[];
          }
        | Record<string, never>
      >
    ).push({
      type: "workflow_dispatch",
      branches: ["main"],
      paths: ["packages/**"],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" does not support branches. Supported: inputs',
        'trigger "workflow_dispatch" does not support paths. Supported: inputs',
      ])
    );
  });

  it("fails explicitly when schedule is given blank or malformed cron entries", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_schedule"),
      name: "Invalid Schedule",
    })
      .onSchedule([" ", "* * * *", "0 0 * * * *"])
      .addJob(createJobId("lint"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run lint");
      });

    let thrown: unknown;

    try {
      builder.build();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(WorkflowValidationError);
    expect((thrown as WorkflowValidationError).issues).toHaveLength(3);
    expect((thrown as WorkflowValidationError).issues[0]).toBe(
      'trigger "schedule" cron must not contain blank values'
    );
    expect((thrown as WorkflowValidationError).issues[1]).toContain("* * * *");
    expect((thrown as WorkflowValidationError).issues[1]).toContain("exactly 5 fields");
    expect((thrown as WorkflowValidationError).issues[2]).toContain("0 0 * * * *");
    expect((thrown as WorkflowValidationError).issues[2]).toContain("exactly 5 fields");
  });

  it("fails explicitly when schedule is given unsupported filters", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_schedule_filters"),
      name: "Invalid Schedule Filters",
    }).addJob(createJobId("lint"), (job) => {
      job.runsOn("ubuntu-latest").run("bun run lint");
    });

    (
      builder.triggers as unknown as Array<
        | {
            type: "schedule";
            cron?: readonly string[];
            branches?: readonly string[];
            paths?: readonly string[];
          }
        | Record<string, never>
      >
    ).push({
      type: "schedule",
      cron: ["0 0 * * *"],
      branches: ["main"],
      paths: ["packages/**"],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "schedule" does not support branches. Supported: cron',
        'trigger "schedule" does not support paths. Supported: cron',
      ])
    );
  });

  it("rejects empty schedule trigger entries", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("empty_schedule"),
      name: "Empty Schedule",
    }).addJob(createJobId("lint"), (job) => {
      job.runsOn("ubuntu-latest").run("bun run lint");
    });

    (
      builder.triggers as unknown as Array<
        | {
            type: "schedule";
            cron: readonly string[];
          }
        | Record<string, never>
      >
    ).push({
      type: "schedule",
      cron: [],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "schedule" must define at least one cron entry. Expected: at least one cron expression',
      ])
    );
  });

  it("rejects job dependencies on unknown, duplicate, or later-declared job ids", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_needs"),
      name: "Invalid Needs",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run build");
      })
      .addJob(createJobId("deploy"), (job) => {
        job
          .needs([
            createJobId("build"),
            createJobId("build"),
            createJobId("test"),
            createJobId("missing"),
          ])
          .runsOn("ubuntu-latest")
          .run("bun run deploy");
      })
      .addJob(createJobId("test"), (job) => {
        job.needs(createJobId("deploy")).runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "deploy" needs must not contain duplicate job "build"',
        'job "deploy" needs job "test" to be declared earlier',
        'job "deploy" needs unknown job "missing"',
      ])
    );
  });

  it("rejects blank string runs-on, empty runs-on arrays, and empty needs arrays", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_runs_on_and_needs_shapes"),
      name: "Invalid Runs On And Needs Shapes",
    })
      .onPush()
      .addJob(createJobId("blanktarget"), (job) => {
        job.runsOn(" ").run("bun test");
      })
      .addJob(createJobId("emptytarget"), (job) => {
        job.runsOn([] as unknown as readonly [string, ...string[]]).run("bun test");
      })
      .addJob(createJobId("emptyneeds"), (job) => {
        job
          .needs(
            [] as unknown as readonly [import("./index.ts").JobId, ...import("./index.ts").JobId[]]
          )
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "blanktarget" runs-on must not be empty. Expected: a non-blank runner label',
        'job "emptytarget" runs-on array must not be empty. Expected: at least one runner label',
        'job "emptyneeds" needs must not be empty',
      ])
    );
  });

  it("rejects empty or malformed strategy matrices", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_matrix"),
      name: "Invalid Matrix",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .strategyMatrix({
            "": ["ubuntu-latest"],
            include: ["unexpected"],
            os: [],
            node: ["18", " "],
            runtime: [{ version: "20" }] as unknown as readonly [string, ...string[]],
          } as unknown as import("./index.ts").WorkflowMatrix)
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "test" strategy.matrix must not contain blank axis names',
        'job "test" strategy.matrix does not support axis "include". Expected: axes matching /^[a-zA-Z_][a-zA-Z0-9_-]*$/ (include and exclude are reserved)',
        'job "test" strategy.matrix axis "os" must not be empty',
        'job "test" strategy.matrix axis "node" must not contain blank values',
        'job "test" strategy.matrix axis "runtime" must contain only strings. Expected: every element to be a string',
      ])
    );
  });

  it("rejects strategy matrices without axes and with non-array axis values", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_matrix_shapes"),
      name: "Invalid Matrix Shapes",
    })
      .onPush()
      .addJob(createJobId("empty"), (job) => {
        job
          .strategyMatrix({} as import("./index.ts").WorkflowMatrix)
          .runsOn("ubuntu-latest")
          .run("bun test");
      })
      .addJob(createJobId("nonarray"), (job) => {
        job
          .strategyMatrix({
            os: "ubuntu-latest",
          } as unknown as import("./index.ts").WorkflowMatrix)
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "empty" strategy.matrix must define at least one axis. Expected: at least one axis name mapped to a string array',
        'job "nonarray" strategy.matrix axis "os" must be an array. Expected: an array of strings',
      ])
    );
  });

  it("rejects matrix axis names that do not match the identifier format", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_matrix_axis_format"),
      name: "Invalid Matrix Axis Format",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .strategyMatrix({
            "1os": ["ubuntu-latest"],
            "bad/name": ["node"],
            "axis name": ["x"],
            軸: ["y"],
          } as unknown as import("./index.ts").WorkflowMatrix)
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "test" strategy.matrix axis "1os" must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        'job "test" strategy.matrix axis "bad/name" must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        'job "test" strategy.matrix axis "axis name" must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        'job "test" strategy.matrix axis "軸" must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
      ])
    );
  });

  it("rejects invalid workflow and job permissions entries", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_permissions"),
      name: "Invalid Permissions",
    })
      .onPush()
      .permissions({
        actions: "admin" as "read",
        unknown: "read",
      } as unknown as import("./index.ts").WorkflowPermissions)
      .addJob(createJobId("check"), (job) => {
        job
          .permissions({
            contents: "write",
            models: "write",
            unknown: "none",
          } as unknown as import("./index.ts").WorkflowPermissions)
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow permissions entry "actions" must be one of read, write, none',
        'workflow permissions contains unsupported key "unknown". Expected: one of actions, artifact-metadata, attestations, checks, contents, deployments, discussions, id-token, issues, models, packages, pages, pull-requests, security-events, statuses',
        'job "check" permissions entry "models" must be one of read, none',
        'job "check" permissions contains unsupported key "unknown". Expected: one of actions, artifact-metadata, attestations, checks, contents, deployments, discussions, id-token, issues, models, packages, pages, pull-requests, security-events, statuses',
      ])
    );
  });

  it("rejects invalid workflow-level defaults and mixed permissions shapes", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_workflow_defaults_permissions"),
      name: "Invalid Workflow Defaults And Permissions",
    })
      .onPush()
      .permissions({ "read-all": "write" } as unknown as import("./index.ts").WorkflowPermissions)
      .defaultsRun({
        shell: " ",
      })
      .addJob(createJobId("check"), (job) => {
        job
          .permissions({
            contents: "read",
            "write-all": "none",
          } as unknown as import("./index.ts").WorkflowPermissions)
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow permissions must use either shorthand ("read-all"/"write-all") or an object map, not both',
        "workflow defaults.run.shell must not be empty",
        "workflow defaults.run must define shell or working-directory. Expected: at least one of shell or working-directory",
        'job "check" permissions must use either shorthand ("read-all"/"write-all") or an object map, not both',
      ])
    );
  });

  it("rejects blank workflow-level defaults.run.working-directory", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_workflow_defaults_working_directory"),
      name: "Invalid Workflow Defaults Working Directory",
    })
      .onPush()
      .defaultsRun({
        workingDirectory: " ",
      })
      .addJob(createJobId("check"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        "workflow defaults.run.working-directory must not be empty",
        "workflow defaults.run must define shell or working-directory. Expected: at least one of shell or working-directory",
      ])
    );
  });

  it("rejects invalid execution environment metadata values", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_execution_metadata"),
      name: "Invalid Execution Metadata",
    })
      .onPush()
      .addJob(createJobId("check"), (job) => {
        job
          .timeoutMinutes(0.5)
          .defaultsRun({
            shell: " ",
            workingDirectory: " ",
          })
          .runsOn("ubuntu-latest")
          .run("bun test", {
            shell: " ",
            workingDirectory: " ",
          });
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "check" timeout-minutes must be a positive integer. Expected: a whole number greater than 0',
        'job "check" defaults.run.shell must not be empty',
        'job "check" defaults.run.working-directory must not be empty',
        'job "check" step 1 shell must not be empty',
        'job "check" step 1 working-directory must not be empty',
      ])
    );
  });

  it("rejects empty job defaults.run and blank working-directory", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("empty_job_defaults_run"),
      name: "Empty Job Defaults Run",
    })
      .onPush()
      .addJob(createJobId("check"), (job) => {
        job
          .defaultsRun({
            workingDirectory: " ",
          })
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['job "check" defaults.run.working-directory must not be empty'])
    );
  });

  it("rejects a job defaults.run object with neither shell nor working-directory", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("missing_job_defaults_run_fields"),
      name: "Missing Job Defaults Run Fields",
    })
      .onPush()
      .addJob(createJobId("check"), (job) => {
        job.defaultsRun({}).runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "check" defaults.run must define shell or working-directory. Expected: at least one of shell or working-directory',
      ])
    );
  });

  it("rejects invalid concurrency values", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_concurrency"),
      name: "Invalid Concurrency",
    })
      .onPush()
      .concurrency({
        group: " ",
        cancelInProgress: "yes" as unknown as boolean,
      })
      .addJob(createJobId("check"), (job) => {
        job
          .concurrency({
            group: " ",
            cancelInProgress: "no" as unknown as boolean,
          })
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        "workflow concurrency group must not be empty",
        "workflow concurrency cancel-in-progress must be a boolean. Expected: true or false",
        'job "check" concurrency group must not be empty',
        'job "check" concurrency cancel-in-progress must be a boolean. Expected: true or false',
      ])
    );
  });

  it("rejects permissions entries with undefined values", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("undefined_permissions"),
      name: "Undefined Permissions",
    })
      .onPush()
      .permissions({
        contents: undefined,
      } as unknown as import("./index.ts").WorkflowPermissions)
      .addJob(createJobId("check"), (job) => {
        job
          .permissions({
            checks: undefined,
          } as unknown as import("./index.ts").WorkflowPermissions)
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow permissions entry "contents" must be one of read, write, none',
        'job "check" permissions entry "checks" must be one of read, write, none',
      ])
    );
  });

  it("accepts permissions shorthand values", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("permissions_shorthand"),
      name: "Permissions Shorthand",
    })
      .onPush()
      .permissions("read-all")
      .addJob(createJobId("check"), (job) => {
        job.permissions("write-all").runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.permissions).toBe("read-all");
    expect(workflow.jobs[0]?.permissions).toBe("write-all");
  });

  it("rejects invalid permissions shorthand strings", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_permissions_shorthand"),
      name: "Invalid Permissions Shorthand",
    })
      .onPush()
      .permissions("admin-all" as unknown as import("./index.ts").WorkflowPermissions)
      .addJob(createJobId("check"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow permissions must be "read-all", "write-all", or an object map',
      ])
    );
  });

  it("deep-freezes workflow output including nested arrays and maps", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("immutable"),
      name: "Immutable Workflow",
    })
      .onPush({
        branches: ["main"],
        paths: ["packages/**"],
      })
      .addJob(createJobId("lint"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run lint");
      })
      .addJob(createJobId("test"), (job) => {
        job
          .needs(createJobId("lint"))
          .strategyMatrix({
            node: ["18", "20"],
          })
          .runsOn(["ubuntu-latest", "self-hosted"])
          .run("bun test", {
            env: {
              CI: "true",
            },
            with: {
              coverage: "true",
            },
          });
      })
      .build();

    expect(Object.isFrozen(workflow)).toBe(true);
    expect(Object.isFrozen(workflow.on)).toBe(true);
    expect(Object.isFrozen(workflow.on[0]!)).toBe(true);
    expect(Object.isFrozen((workflow.on[0]! as { branches: readonly string[] }).branches)).toBe(
      true
    );
    expect(Object.isFrozen(workflow.jobs)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[0]!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.needs!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.strategy!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.strategy!.matrix)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.strategy!.matrix.node)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.steps!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.steps![0]!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.steps![0]!.env!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.steps![0]!.with!)).toBe(true);

    expect(() => {
      (workflow.on as unknown as Array<{ type: string }>).push({ type: "pull_request" });
    }).toThrow(TypeError);
    expect(() => {
      (workflow.jobs[1]!.steps![0]!.env as Record<string, string>).CI = "false";
    }).toThrow(TypeError);
  });

  it("preserves workflow-level env in the built model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("workflow_env"),
      name: "Workflow Env",
    })
      .onPush()
      .env({
        NODE_ENV: "production",
        CI: "true",
      })
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run build");
      })
      .build();

    expect(workflow.env).toEqual({
      NODE_ENV: "production",
      CI: "true",
    });
  });

  it("preserves job-level env in the built model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("job_env"),
      name: "Job Env",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job
          .env({
            NODE_ENV: "test",
            DEBUG: "1",
          })
          .runsOn("ubuntu-latest")
          .run("bun run build");
      })
      .build();

    expect(workflow.jobs[0]!.env).toEqual({
      NODE_ENV: "test",
      DEBUG: "1",
    });
  });

  it("preserves both workflow-level and job-level env together", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("both_env"),
      name: "Both Env",
    })
      .onPush()
      .env({
        CI: "true",
      })
      .addJob(createJobId("build"), (job) => {
        job
          .env({
            NODE_ENV: "production",
          })
          .runsOn("ubuntu-latest")
          .run("bun run build");
      })
      .build();

    expect(workflow.env).toEqual({ CI: "true" });
    expect(workflow.jobs[0]!.env).toEqual({ NODE_ENV: "production" });
  });

  it("rejects blank env keys at workflow level", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_workflow_env"),
      name: "Invalid Workflow Env",
    })
      .onPush()
      .env({
        "": "value",
        VALID: "ok",
      })
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run build");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(["workflow env must not contain blank keys"])
    );
  });

  it("rejects blank env keys at job level", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_job_env"),
      name: "Invalid Job Env",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job
          .env({
            " ": "value",
          })
          .runsOn("ubuntu-latest")
          .run("bun run build");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['job "build" env must not contain blank keys'])
    );
  });

  it("omits empty env maps from the built model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("empty_env"),
      name: "Empty Env",
    })
      .onPush()
      .env({})
      .addJob(createJobId("build"), (job) => {
        job.env({}).runsOn("ubuntu-latest").run("bun run build");
      })
      .build();

    expect(workflow.env).toBeUndefined();
    expect(workflow.jobs[0]!.env).toBeUndefined();
  });

  it("deep-freezes built env maps at workflow and job levels", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("frozen_env"),
      name: "Frozen Env",
    })
      .onPush()
      .env({
        CI: "true",
      })
      .addJob(createJobId("build"), (job) => {
        job
          .env({
            NODE_ENV: "production",
          })
          .runsOn("ubuntu-latest")
          .run("bun run build");
      })
      .build();

    expect(Object.isFrozen(workflow.env)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[0]!.env)).toBe(true);

    expect(() => {
      (workflow.env as Record<string, string>).CI = "false";
    }).toThrow(TypeError);
    expect(() => {
      (workflow.jobs[0]!.env as Record<string, string>).NODE_ENV = "dev";
    }).toThrow(TypeError);
  });

  it("preserves pull_request types in the built model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("pr_types"),
      name: "PR Types",
    })
      .onPullRequest({
        types: ["opened", "synchronize", "reopened"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "pull_request",
        types: ["opened", "synchronize", "reopened"],
      },
    ]);
  });

  it("preserves pull_request types alongside branches and paths", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("pr_types_with_filters"),
      name: "PR Types With Filters",
    })
      .onPullRequest({
        branches: ["main", "release/**"],
        paths: ["packages/**"],
        types: ["opened", "labeled"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "pull_request",
        branches: ["main", "release/**"],
        paths: ["packages/**"],
        types: ["opened", "labeled"],
      },
    ]);
  });

  it("rejects unknown pull_request activity type names at build time", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("invalid_pr_types"),
      name: "Invalid PR Types",
    })
      .onPullRequest({
        types: ["opened", "merged" as never, "closed", "drafted" as never],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "pull_request" types contains unknown activity type "merged". Expected: one of "assigned", "unassigned", "labeled", "unlabeled", "opened", "edited", "closed", "reopened", "synchronize", "converted_to_draft", "ready_for_review", "locked", "unlocked", "review_requested", "review_request_removed", "auto_merge_enabled", "auto_merge_disabled"',
        'trigger "pull_request" types contains unknown activity type "drafted". Expected: one of "assigned", "unassigned", "labeled", "unlabeled", "opened", "edited", "closed", "reopened", "synchronize", "converted_to_draft", "ready_for_review", "locked", "unlocked", "review_requested", "review_request_removed", "auto_merge_enabled", "auto_merge_disabled"',
      ])
    );
  });

  it("rejects empty pull_request types array", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("empty_pr_types"),
      name: "Empty PR Types",
    })
      .onPullRequest({
        types: [] as unknown as readonly ["opened"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "pull_request" types must not be empty'])
    );
  });

  it("rejects types on push trigger", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("push_with_types"),
      name: "Push With Types",
    }).addJob(createJobId("test"), (job) => {
      job.runsOn("ubuntu-latest").run("bun test");
    });

    (
      builder.triggers as unknown as Array<{
        type: "push";
        branches?: readonly string[];
        types?: readonly string[];
      }>
    ).push({
      type: "push",
      branches: ["main"],
      types: ["opened"],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "push" does not support types. Supported: branches, branches-ignore, paths, paths-ignore, tags, tags-ignore',
      ])
    );
  });

  it("rejects types on workflow_dispatch trigger", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("dispatch_with_types"),
      name: "Dispatch With Types",
    }).addJob(createJobId("test"), (job) => {
      job.runsOn("ubuntu-latest").run("bun test");
    });

    (
      builder.triggers as unknown as Array<{
        type: "workflow_dispatch";
        types?: readonly string[];
      }>
    ).push({
      type: "workflow_dispatch",
      types: ["opened"],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" does not support types. Supported: inputs',
      ])
    );
  });

  it("rejects types on schedule trigger", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("schedule_with_types"),
      name: "Schedule With Types",
    }).addJob(createJobId("test"), (job) => {
      job.runsOn("ubuntu-latest").run("bun test");
    });

    (
      builder.triggers as unknown as Array<{
        type: "schedule";
        cron: readonly string[];
        types?: readonly string[];
      }>
    ).push({
      type: "schedule",
      cron: ["0 0 * * *"],
      types: ["opened"],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "schedule" does not support types. Supported: cron'])
    );
  });

  it("composes pull_request types with branches, paths, and other features", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("pr_types_compose"),
      name: "PR Types Compose",
    })
      .onPush({
        branches: ["main"],
      })
      .onPullRequest({
        branches: ["main"],
        paths: ["src/**"],
        types: ["opened", "synchronize"],
      })
      .permissions({
        contents: "read",
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow).toMatchObject({
      on: [
        {
          type: "push",
          branches: ["main"],
        },
        {
          type: "pull_request",
          branches: ["main"],
          paths: ["src/**"],
          types: ["opened", "synchronize"],
        },
      ],
      permissions: { contents: "read" },
    });
  });

  it("deep-freezes built trigger types array", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("frozen_pr_types"),
      name: "Frozen PR Types",
    })
      .onPullRequest({
        types: ["opened", "closed"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const prTrigger = workflow.on[0]! as {
      type: "pull_request";
      types: readonly string[];
    };

    expect(Object.isFrozen(prTrigger)).toBe(true);
    expect(Object.isFrozen(prTrigger.types)).toBe(true);

    expect(() => {
      (prTrigger.types as string[]).push("labeled");
    }).toThrow(TypeError);
  });

  it("preserves push trigger branchesIgnore in the built model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("push_branches_ignore"),
      name: "Push Branches Ignore",
    })
      .onPush({
        branchesIgnore: ["dependabot/**", "renovate/**"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "push",
        branchesIgnore: ["dependabot/**", "renovate/**"],
      },
    ]);
  });

  it("preserves push trigger pathsIgnore in the built model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("push_paths_ignore"),
      name: "Push Paths Ignore",
    })
      .onPush({
        pathsIgnore: ["docs/**", "*.md"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "push",
        pathsIgnore: ["docs/**", "*.md"],
      },
    ]);
  });

  it("preserves push trigger tags in the built model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("push_tags"),
      name: "Push Tags",
    })
      .onPush({
        tags: ["v*", "release-*"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "push",
        tags: ["v*", "release-*"],
      },
    ]);
  });

  it("preserves push trigger tagsIgnore in the built model", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("push_tags_ignore"),
      name: "Push Tags Ignore",
    })
      .onPush({
        tagsIgnore: ["v*-beta", "v*-rc*"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "push",
        tagsIgnore: ["v*-beta", "v*-rc*"],
      },
    ]);
  });

  it("rejects combining branches and branches-ignore on the same trigger", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("branches_mutual_exclusion"),
      name: "Branches Mutual Exclusion",
    })
      .onPush({
        branches: ["main"],
        branchesIgnore: ["dependabot/**"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "push" must not combine branches and branches-ignore. Use one or the other, not both',
      ])
    );
  });

  it("rejects combining paths and paths-ignore on the same trigger", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("paths_mutual_exclusion"),
      name: "Paths Mutual Exclusion",
    })
      .onPush({
        paths: ["src/**"],
        pathsIgnore: ["docs/**"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "push" must not combine paths and paths-ignore. Use one or the other, not both',
      ])
    );
  });

  it("rejects combining tags and tags-ignore on the same trigger", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("tags_mutual_exclusion"),
      name: "Tags Mutual Exclusion",
    })
      .onPush({
        tags: ["v*"],
        tagsIgnore: ["v*-beta"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "push" must not combine tags and tags-ignore. Use one or the other, not both',
      ])
    );
  });

  it("rejects tags on pull_request trigger", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("pr_tags"),
      name: "PR Tags",
    })
      .onPullRequest({
        tags: ["v*"],
      } as import("./index.ts").PullRequestTriggerFilter)
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "pull_request" does not support tags. Supported: branches, branches-ignore, paths, paths-ignore, types',
      ])
    );
  });

  it("rejects tagsIgnore on pull_request trigger", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("pr_tags_ignore"),
      name: "PR Tags Ignore",
    })
      .onPullRequest({
        tagsIgnore: ["v*-beta"],
      } as import("./index.ts").PullRequestTriggerFilter)
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "pull_request" does not support tags-ignore. Supported: branches, branches-ignore, paths, paths-ignore, types',
      ])
    );
  });

  it("rejects empty negation and tag filter arrays", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("empty_negation_arrays"),
      name: "Empty Negation Arrays",
    })
      .onPush({
        branchesIgnore: [] as unknown as readonly [string, ...string[]],
        pathsIgnore: [] as unknown as readonly [string, ...string[]],
        tags: [] as unknown as readonly [string, ...string[]],
        tagsIgnore: [] as unknown as readonly [string, ...string[]],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "push" branches-ignore must not be empty',
        'trigger "push" paths-ignore must not be empty',
        'trigger "push" tags must not be empty',
        'trigger "push" tags-ignore must not be empty',
        'trigger "push" must not combine tags and tags-ignore. Use one or the other, not both',
      ])
    );
  });

  it("rejects blank values in negation and tag filter arrays", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("blank_negation_values"),
      name: "Blank Negation Values",
    })
      .onPush({
        branchesIgnore: ["dependabot/**", " "],
        pathsIgnore: [" ", "docs/**"],
        tags: ["v*", "  "],
        tagsIgnore: [" "],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "push" branches-ignore must not contain blank values',
        'trigger "push" paths-ignore must not contain blank values',
        'trigger "push" tags must not contain blank values',
        'trigger "push" tags-ignore must not contain blank values',
        'trigger "push" must not combine tags and tags-ignore. Use one or the other, not both',
      ])
    );
  });

  it("composes negation filters with existing positive filters and other features", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("negation_compose"),
      name: "Negation Compose",
    })
      .onPush({
        branchesIgnore: ["dependabot/**"],
        pathsIgnore: ["docs/**"],
        tags: ["v*"],
      })
      .onPullRequest({
        branchesIgnore: ["renovate/**"],
        pathsIgnore: ["*.md"],
      })
      .permissions({
        contents: "read",
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow).toMatchObject({
      on: [
        {
          type: "push",
          branchesIgnore: ["dependabot/**"],
          pathsIgnore: ["docs/**"],
          tags: ["v*"],
        },
        {
          type: "pull_request",
          branchesIgnore: ["renovate/**"],
          pathsIgnore: ["*.md"],
        },
      ],
      permissions: { contents: "read" },
    });
  });

  it("deep-freezes built negation and tag filter arrays", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("frozen_negation_tags"),
      name: "Frozen Negation Tags",
    })
      .onPush({
        branchesIgnore: ["dependabot/**"],
        pathsIgnore: ["docs/**"],
        tags: ["v*"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const pushTrigger = workflow.on[0]! as {
      type: "push";
      branchesIgnore: readonly string[];
      pathsIgnore: readonly string[];
      tags: readonly string[];
    };

    expect(Object.isFrozen(pushTrigger)).toBe(true);
    expect(Object.isFrozen(pushTrigger.branchesIgnore)).toBe(true);
    expect(Object.isFrozen(pushTrigger.pathsIgnore)).toBe(true);
    expect(Object.isFrozen(pushTrigger.tags)).toBe(true);

    expect(() => {
      (pushTrigger.branchesIgnore as string[]).push("test/**");
    }).toThrow(TypeError);
    expect(() => {
      (pushTrigger.pathsIgnore as string[]).push("test/**");
    }).toThrow(TypeError);
    expect(() => {
      (pushTrigger.tags as string[]).push("v2*");
    }).toThrow(TypeError);
  });

  it("composes env with permissions and concurrency", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("env_compose"),
      name: "Env Compose",
    })
      .onPush()
      .permissions({
        contents: "read",
      })
      .env({
        CI: "true",
      })
      .concurrency({
        group: "deploy",
        cancelInProgress: true,
      })
      .addJob(createJobId("build"), (job) => {
        job
          .permissions({ checks: "write" })
          .concurrency({ group: "build-${{ github.ref }}" })
          .env({ NODE_ENV: "production" })
          .runsOn("ubuntu-latest")
          .run("bun run build");
      })
      .build();

    expect(workflow).toMatchObject({
      permissions: { contents: "read" },
      env: { CI: "true" },
      concurrency: { group: "deploy", cancelInProgress: true },
      jobs: [
        {
          id: "build",
          permissions: { checks: "write" },
          concurrency: { group: "build-${{ github.ref }}" },
          env: { NODE_ENV: "production" },
        },
      ],
    });
  });

  describe("step identifiers and job outputs", () => {
    it("builds a run step with an id", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("step_id_run"),
        name: "Step ID Run",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").run("echo building", { id: "build-step" });
        })
        .build();

      expect(workflow.jobs[0]!.steps![0]).toMatchObject({
        kind: "run",
        id: "build-step",
        run: "echo building",
      });
    });

    it("builds a uses step with an id", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("step_id_uses"),
        name: "Step ID Uses",
      })
        .onPush()
        .addJob(createJobId("checkout"), (job) => {
          job.runsOn("ubuntu-latest").uses("actions/checkout@v4", { id: "checkout-step" });
        })
        .build();

      expect(workflow.jobs[0]!.steps![0]).toMatchObject({
        kind: "uses",
        id: "checkout-step",
        uses: "actions/checkout@v4",
      });
    });

    it("builds multiple steps with unique IDs", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("multi_step_ids"),
        name: "Multi Step IDs",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .run("echo step1", { id: "step1" })
            .run("echo step2", { id: "step2" })
            .uses("actions/checkout@v4", { id: "checkout" });
        })
        .build();

      expect(workflow.jobs[0]!.steps![0]!.id).toBe("step1");
      expect(workflow.jobs[0]!.steps![1]!.id).toBe("step2");
      expect(workflow.jobs[0]!.steps![2]!.id).toBe("checkout");
    });

    it("builds steps without IDs (backwards compatible)", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("no_step_ids"),
        name: "No Step IDs",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").run("echo hello");
        })
        .build();

      expect(workflow.jobs[0]!.steps![0]).not.toHaveProperty("id");
    });

    it("rejects step IDs with surrounding whitespace", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("trim_step_id"),
        name: "Trim Step ID",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").run("echo hello", { id: "  build-step  " });
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "build" step 1 id must not contain surrounding whitespace. Expected: no leading or trailing spaces',
        ])
      );
    });

    it("rejects blank step IDs", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("blank_step_id"),
        name: "Blank Step ID",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").run("echo hello", { id: "  " });
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "build" step 1 id must not be empty'])
      );
    });

    it("rejects duplicate step IDs in the same job", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("dup_step_ids"),
        name: "Dup Step IDs",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .run("echo first", { id: "build" })
            .run("echo second", { id: "build" });
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "test" contains duplicate step id "build"'])
      );
    });

    it("rejects step IDs that do not match the identifier format", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("invalid_step_id_format"),
        name: "Invalid Step ID Format",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .run("echo first", { id: "1start" })
            .run("echo second", { id: "bad/id" })
            .run("echo third", { id: "step name" })
            .run("echo fourth", { id: "ステップ" });
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "test" step 1 id must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
          'job "test" step 2 id must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
          'job "test" step 3 id must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
          'job "test" step 4 id must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        ])
      );
    });

    it("allows the same step ID in different jobs", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("cross_job_ids"),
        name: "Cross Job IDs",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").run("echo building", { id: "setup" });
        })
        .addJob(createJobId("test"), (job) => {
          job.runsOn("ubuntu-latest").run("echo testing", { id: "setup" });
        })
        .build();

      expect(workflow.jobs[0]!.steps![0]!.id).toBe("setup");
      expect(workflow.jobs[1]!.steps![0]!.id).toBe("setup");
    });

    it("builds a job with outputs referencing declared step IDs", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("job_outputs"),
        name: "Job Outputs",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .outputs({
              result: "${{ steps.upload.outputs.artifact-url }}",
            })
            .run("echo building", { id: "upload" });
        })
        .build();

      expect(workflow.jobs[0]!.outputs).toEqual({
        result: "${{ steps.upload.outputs.artifact-url }}",
      });
    });

    it("omits empty outputs map from built workflow", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("empty_outputs"),
        name: "Empty Outputs",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").outputs({}).run("echo hello");
        })
        .build();

      expect(workflow.jobs[0]).not.toHaveProperty("outputs");
    });

    it("rejects blank output keys", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("blank_output_key"),
        name: "Blank Output Key",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").outputs({ "": "value" }).run("echo hello");
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "build" outputs must not contain blank keys'])
      );
    });

    it("rejects blank output values", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("blank_output_value"),
        name: "Blank Output Value",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").outputs({ key: "  " }).run("echo hello");
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "build" outputs key "key" must not have a blank value'])
      );
    });

    it("rejects output referencing undeclared step ID", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("undeclared_step_ref"),
        name: "Undeclared Step Ref",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .outputs({ result: "${{ steps.missing.outputs.value }}" })
            .run("echo hello");
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "build" outputs key "result" references undeclared step id "missing"',
        ])
      );
    });

    it("accepts output referencing a declared step ID", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("declared_step_ref"),
        name: "Declared Step Ref",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .outputs({ result: "${{ steps.upload.outputs.value }}" })
            .run("echo building", { id: "upload" });
        })
        .build();

      expect(workflow.jobs[0]!.outputs).toEqual({
        result: "${{ steps.upload.outputs.value }}",
      });
    });

    it("accepts output with non-step expressions", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("non_step_expr"),
        name: "Non Step Expr",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .outputs({
              dep_result: "${{ needs.build.outputs.result }}",
              env_val: "${{ env.FOO }}",
            })
            .run("echo hello");
        })
        .build();

      expect(workflow.jobs[0]!.outputs).toEqual({
        dep_result: "${{ needs.build.outputs.result }}",
        env_val: "${{ env.FOO }}",
      });
    });

    it("reports only invalid step references when value has multiple", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("multi_step_ref"),
        name: "Multi Step Ref",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .outputs({
              combined: "${{ steps.valid.outputs.a }}-${{ steps.invalid.outputs.b }}",
            })
            .run("echo hello", { id: "valid" });
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "build" outputs key "combined" references undeclared step id "invalid"',
        ])
      );
    });

    it("accepts output with no step references at all", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("no_step_ref"),
        name: "No Step Ref",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").outputs({ result: "literal-value" }).run("echo hello");
        })
        .build();

      expect(workflow.jobs[0]!.outputs).toEqual({ result: "literal-value" });
    });

    it("deep-freezes built workflow step IDs", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("frozen_step_ids"),
        name: "Frozen Step IDs",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").run("echo hello", { id: "build-step" });
        })
        .build();

      expect(Object.isFrozen(workflow.jobs[0]!.steps![0]!)).toBe(true);
      expect(() => {
        (workflow.jobs[0]!.steps![0] as unknown as Record<string, unknown>).id = "hacked";
      }).toThrow(TypeError);
    });

    it("deep-freezes built job outputs", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("frozen_outputs"),
        name: "Frozen Outputs",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .outputs({ result: "${{ steps.upload.outputs.value }}" })
            .run("echo building", { id: "upload" });
        })
        .build();

      expect(Object.isFrozen(workflow.jobs[0]!.outputs)).toBe(true);
      expect(() => {
        (workflow.jobs[0]!.outputs as Record<string, string>).result = "hacked";
      }).toThrow(TypeError);
    });

    it("builds workflows with strategy fail-fast, max-parallel, include, and exclude", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("strategy_complete"),
        name: "Strategy Complete",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({
              os: ["ubuntu-latest", "windows-latest"],
              node: ["18", "20"],
            })
            .strategyFailFast(false)
            .strategyMaxParallel(2)
            .strategyInclude([{ os: "macos-latest", node: "22", experimental: "true" }])
            .strategyExclude([{ os: "windows-latest", node: "18" }])
            .runsOn("${{ matrix.os }}")
            .run("bun test");
        })
        .build();

      expect(workflow.jobs).toEqual([
        {
          kind: "steps",
          id: "test",
          strategy: {
            failFast: false,
            maxParallel: 2,
            matrix: {
              os: ["ubuntu-latest", "windows-latest"],
              node: ["18", "20"],
            },
            include: [{ os: "macos-latest", node: "22", experimental: "true" }],
            exclude: [{ os: "windows-latest", node: "18" }],
          },
          runsOn: "${{ matrix.os }}",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ]);
    });

    it("rejects invalid strategy fail-fast, max-parallel, include, and exclude values", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("invalid_strategy"),
        name: "Invalid Strategy",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({
              os: ["ubuntu-latest"],
              node: ["18"],
            })
            .strategyFailFast("yes" as unknown as boolean)
            .strategyMaxParallel(0)
            .strategyInclude([{ count: 42 as unknown as string }])
            .strategyExclude([{ runtime: "bun" }])
            .runsOn("ubuntu-latest")
            .run("bun test");
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "test" strategy.fail-fast must be a boolean. Expected: true or false',
          'job "test" strategy.max-parallel must be a positive integer. Expected: a whole number greater than 0',
          'job "test" strategy.matrix include entry 1 key "count" must be a string value. Expected: a string value',
          'job "test" strategy.matrix exclude entry 1 references undeclared axis "runtime"',
        ])
      );
    });

    it("rejects exclude entries with blank keys and non-string values", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("strategy_bad_exclude_entry"),
        name: "Strategy Bad Exclude Entry",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({
              os: ["ubuntu-latest"],
            })
            .strategyExclude([
              { "": "ubuntu-latest", os: 1 } as unknown as import("./index.ts").MatrixExcludeEntry,
            ])
            .runsOn("ubuntu-latest")
            .run("bun test");
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "test" strategy.matrix exclude entry 1 must not contain blank keys',
          'job "test" strategy.matrix exclude entry 1 references undeclared axis ""',
          'job "test" strategy.matrix exclude entry 1 key "os" must be a string value. Expected: a string value',
        ])
      );
    });

    it("rejects include and exclude entries that are not record objects", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("strategy_non_object_entries"),
        name: "Strategy Non Object Entries",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({
              os: ["ubuntu-latest"],
            })
            .strategyInclude([{ os: "ubuntu-latest" }])
            .strategyExclude([{ os: "ubuntu-latest" }])
            .runsOn("ubuntu-latest")
            .run("bun test");
        });

      (
        builder as unknown as {
          jobs: Array<{ strategy: { include: unknown[]; exclude: unknown[] } }>;
        }
      ).jobs[0]!.strategy.include = [null];
      (
        builder as unknown as {
          jobs: Array<{ strategy: { include: unknown[]; exclude: unknown[] } }>;
        }
      ).jobs[0]!.strategy.exclude = [null];

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "test" strategy.matrix include entry 1 must be a record object. Expected: a plain object with string keys',
          'job "test" strategy.matrix exclude entry 1 must be a record object. Expected: a plain object with string keys',
        ])
      );
    });

    it("rejects include entries with blank keys", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("strategy_bad_include_key"),
        name: "Strategy Bad Include Key",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({
              os: ["ubuntu-latest"],
            })
            .strategyInclude([
              { "": "ubuntu-latest" } as unknown as import("./index.ts").MatrixIncludeEntry,
            ])
            .runsOn("ubuntu-latest")
            .run("bun test");
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "test" strategy.matrix include entry 1 must not contain blank keys',
        ])
      );
    });

    it("omits empty include and exclude arrays from built strategy", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("empty_include_exclude"),
        name: "Empty Include Exclude",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({
              os: ["ubuntu-latest"],
            })
            .strategyInclude([])
            .strategyExclude([])
            .runsOn("${{ matrix.os }}")
            .run("bun test");
        })
        .build();

      const strategy = workflow.jobs[0]!.strategy!;
      expect(strategy.matrix).toEqual({ os: ["ubuntu-latest"] });
      expect("include" in strategy).toBe(false);
      expect("exclude" in strategy).toBe(false);
    });

    it("freezes strategy fail-fast, max-parallel, include, and exclude deeply", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("frozen_strategy"),
        name: "Frozen Strategy",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({
              os: ["ubuntu-latest", "windows-latest"],
              node: ["18", "20"],
            })
            .strategyFailFast(false)
            .strategyMaxParallel(2)
            .strategyInclude([{ os: "macos-latest", node: "22", experimental: "true" }])
            .strategyExclude([{ os: "windows-latest", node: "18" }])
            .runsOn("${{ matrix.os }}")
            .run("bun test");
        })
        .build();

      const strategy = workflow.jobs[0]!.strategy!;
      expect(Object.isFrozen(strategy)).toBe(true);
      expect(Object.isFrozen(strategy.include)).toBe(true);
      expect(Object.isFrozen(strategy.exclude)).toBe(true);
      expect(Object.isFrozen(strategy.include![0])).toBe(true);
      expect(Object.isFrozen(strategy.exclude![0])).toBe(true);
    });
  });

  it("builds steps with continue-on-error and timeout-minutes", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("step_continue_timeout"),
      name: "Step Continue Timeout",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .run("bun run lint", {
            continueOnError: true,
            timeoutMinutes: 30,
          })
          .uses("actions/checkout@v4", {
            continueOnError: false,
            timeoutMinutes: 10,
          });
      })
      .build();

    const steps = workflow.jobs[0]!.steps!;
    expect(steps[0]!.continueOnError).toBe(true);
    expect(steps[0]!.timeoutMinutes).toBe(30);
    expect(steps[1]!.continueOnError).toBe(false);
    expect(steps[1]!.timeoutMinutes).toBe(10);
  });

  it("rejects invalid step continue-on-error and timeout-minutes", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("bad_step_meta"),
      name: "Bad Step Meta",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("echo hi", {
          continueOnError: "yes" as unknown as boolean,
          timeoutMinutes: 0,
        });
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "test" step 1 continue-on-error must be a boolean. Expected: true or false',
        'job "test" step 1 timeout-minutes must be a positive integer. Expected: a whole number greater than 0',
      ])
    );
  });

  it("builds workflow_dispatch with inputs", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("dispatch_inputs"),
      name: "Dispatch Inputs",
    })
      .onWorkflowDispatch({
        env: {
          description: "Target environment",
          required: true,
          default: "staging",
          type: "choice",
          options: ["staging", "production"],
        },
      })
      .addJob(createJobId("deploy"), (job) => {
        job.runsOn("ubuntu-latest").run("echo deploy");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "workflow_dispatch",
        inputs: {
          env: {
            description: "Target environment",
            required: true,
            default: "staging",
            type: "choice",
            options: ["staging", "production"],
          },
        },
      },
    ]);
  });

  it("builds workflow_dispatch with minimal input (no optional fields)", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("dispatch_minimal"),
      name: "Dispatch Minimal",
    })
      .onWorkflowDispatch({
        name: {},
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "workflow_dispatch",
        inputs: {
          name: {},
        },
      },
    ]);
  });

  it("builds workflow_dispatch with input using all types", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("dispatch_all_types"),
      name: "Dispatch All Types",
    })
      .onWorkflowDispatch({
        str: { type: "string" },
        bool: { type: "boolean" },
        num: { type: "number" },
        env: { type: "environment" },
        ch: { type: "choice", options: ["a", "b"] },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "workflow_dispatch",
        inputs: {
          str: { type: "string" },
          bool: { type: "boolean" },
          num: { type: "number" },
          env: { type: "environment" },
          ch: { type: "choice", options: ["a", "b"] },
        },
      },
    ]);
  });

  it("rejects blank workflow_dispatch input names", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("dispatch_blank_name"),
      name: "Dispatch Blank Name",
    })
      .onWorkflowDispatch({
        "": { description: "bad" },
      } as unknown as Record<string, { description?: string }>)
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" inputs must not contain blank names',
      ])
    );
  });

  it("rejects non-boolean required in workflow_dispatch input", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("dispatch_bad_required"),
      name: "Dispatch Bad Required",
    })
      .onWorkflowDispatch({
        name: { required: "yes" as unknown as boolean },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" input "name" required must be a boolean. Expected: true or false',
      ])
    );
  });

  it("rejects invalid workflow_dispatch input type", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("dispatch_bad_type"),
      name: "Dispatch Bad Type",
    })
      .onWorkflowDispatch({
        name: { type: "invalid" as unknown as "string" },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" input "name" type "invalid" is not a valid input type. Expected: one of "string", "boolean", "choice", "number", "environment"',
      ])
    );
  });

  it("rejects workflow_dispatch input names that do not match the identifier format", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("dispatch_bad_input_names"),
      name: "Dispatch Bad Input Names",
    })
      .onWorkflowDispatch({
        "1start": { description: "digit-leading" },
        "bad/name": { description: "slash" },
        "input name": { description: "space" },
        入力: { description: "unicode" },
      } as unknown as import("./index.ts").WorkflowDispatchInputs)
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" input "1start" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        'trigger "workflow_dispatch" input "bad/name" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        'trigger "workflow_dispatch" input "input name" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        'trigger "workflow_dispatch" input "入力" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
      ])
    );
  });

  it("rejects choice type without options in workflow_dispatch input", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("dispatch_choice_no_opts"),
      name: "Dispatch Choice No Opts",
    })
      .onWorkflowDispatch({
        name: { type: "choice" },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" input "name" type "choice" requires non-empty options. Expected: a non-empty array of string options',
      ])
    );
  });

  it("rejects options on non-choice workflow_dispatch input type", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("dispatch_opts_non_choice"),
      name: "Dispatch Opts Non Choice",
    })
      .onWorkflowDispatch({
        name: {
          type: "string",
          options: ["a", "b"],
        } as unknown as { type: "string" },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" input "name" options is only valid when type is "choice". Remove options or set type to "choice"',
      ])
    );
  });

  it("rejects options without type in workflow_dispatch input", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("dispatch_opts_no_type"),
      name: "Dispatch Opts No Type",
    })
      .onWorkflowDispatch({
        name: {
          options: ["a", "b"],
        } as unknown as { options?: readonly [string, ...string[]] },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" input "name" options is only valid when type is "choice". Remove options or set type to "choice"',
      ])
    );
  });

  it("deep-freezes workflow_dispatch inputs", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("dispatch_frozen_inputs"),
      name: "Dispatch Frozen Inputs",
    })
      .onWorkflowDispatch({
        env: {
          description: "Target environment",
          required: true,
          default: "staging",
          type: "choice",
          options: ["staging", "production"],
        },
      })
      .addJob(createJobId("deploy"), (job) => {
        job.runsOn("ubuntu-latest").run("echo deploy");
      })
      .build();

    const trigger = workflow.on[0]! as {
      type: "workflow_dispatch";
      inputs: Record<
        string,
        {
          description?: string;
          required?: boolean;
          default?: string;
          type?: string;
          options?: readonly string[];
        }
      >;
    };

    expect(Object.isFrozen(trigger)).toBe(true);
    expect(Object.isFrozen(trigger.inputs)).toBe(true);
    expect(Object.isFrozen(trigger.inputs.env)).toBe(true);
    expect(Object.isFrozen(trigger.inputs.env!.options)).toBe(true);
  });

  it("builds workflow_call with inputs outputs and secrets", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("workflow_call_full"),
      name: "Workflow Call Full",
    })
      .onWorkflowCall({
        inputs: {
          config_path: {
            description: "Config path",
            required: false,
            default: ".github/config.json",
            type: "string",
          },
        },
        outputs: {
          artifact_url: {
            description: "Artifact URL",
            value: "${{ jobs.publish.outputs.artifact_url }}",
          },
        },
        secrets: {
          github_token: {
            description: "GitHub token",
            required: true,
          },
        },
      })
      .addJob(createJobId("publish"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run publish");
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: "workflow_call",
        inputs: {
          config_path: {
            description: "Config path",
            required: false,
            default: ".github/config.json",
            type: "string",
          },
        },
        outputs: {
          artifact_url: {
            description: "Artifact URL",
            value: "${{ jobs.publish.outputs.artifact_url }}",
          },
        },
        secrets: {
          github_token: {
            description: "GitHub token",
            required: true,
          },
        },
      },
    ]);
  });

  it("rejects workflow_call unsupported filters and types", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("workflow_call_bad_filters"),
      name: "Workflow Call Bad Filters",
    })
      .onWorkflowCall()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    (
      builder.triggers[0] as {
        type: "workflow_call";
        branches?: string[];
        paths?: string[];
        types?: string[];
      }
    ).branches = ["main"];
    (builder.triggers[0] as { type: "workflow_call"; paths?: string[] }).paths = ["src/**"];
    (builder.triggers[0] as { type: "workflow_call"; types?: string[] }).types = ["completed"];

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_call" does not support branches. Supported: inputs, outputs, secrets',
        'trigger "workflow_call" does not support paths. Supported: inputs, outputs, secrets',
        'trigger "workflow_call" does not support types. Supported: inputs, outputs, secrets',
      ])
    );
  });

  it("rejects workflow_call names that do not match the identifier format", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("workflow_call_bad_names"),
      name: "Workflow Call Bad Names",
    })
      .onWorkflowCall({
        inputs: {
          "input name": { type: "string" },
        } as unknown as import("./index.ts").WorkflowCallInputs,
        outputs: {
          "bad/name": { value: "${{ jobs.test.outputs.value }}" },
        } as unknown as import("./index.ts").WorkflowCallOutputs,
        secrets: {
          入力: { required: true },
        } as unknown as import("./index.ts").WorkflowCallSecrets,
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_call" input "input name" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        'trigger "workflow_call" output "bad/name" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
        'trigger "workflow_call" secret "入力" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
      ])
    );
  });

  it("rejects blank workflow_call input names and non-boolean required", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("workflow_call_bad_input_required"),
      name: "Workflow Call Bad Input Required",
    })
      .onWorkflowCall({
        inputs: {
          "": {
            required: "yes" as unknown as boolean,
          },
          valid_input: {
            required: "no" as unknown as boolean,
          },
        } as unknown as import("./index.ts").WorkflowCallInputs,
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_call" inputs must not contain blank names',
        'trigger "workflow_call" input "valid_input" required must be a boolean. Expected: true or false',
      ])
    );
  });

  it("rejects unsupported workflow_call input type and options", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("workflow_call_bad_input_type"),
      name: "Workflow Call Bad Input Type",
    })
      .onWorkflowCall({
        inputs: {
          choice_input: {
            type: "choice" as unknown as "string",
            options: ["a", "b"],
          } as unknown as import("./index.ts").WorkflowCallInput,
        },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_call" input "choice_input" type "choice" is not supported. Expected: one of "string", "boolean", "number", "environment"',
        'trigger "workflow_call" input "choice_input" options is not supported. Remove the options field',
      ])
    );
  });

  it("rejects invalid workflow_call input types outside the shared allowlist", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("workflow_call_invalid_input_type"),
      name: "Workflow Call Invalid Input Type",
    })
      .onWorkflowCall({
        inputs: {
          bad_input: {
            type: "invalid" as unknown as "string",
          },
        },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_call" input "bad_input" type "invalid" is not a valid input type. Expected: one of "string", "boolean", "choice", "number", "environment"',
      ])
    );
  });

  it("rejects blank workflow_call output values", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("workflow_call_blank_output"),
      name: "Workflow Call Blank Output",
    })
      .onWorkflowCall({
        outputs: {
          artifact_url: {
            value: "   ",
          },
        },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_call" output "artifact_url" value must be a non-blank string',
      ])
    );
  });

  it("rejects non-boolean workflow_call secret required values", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("workflow_call_bad_secret_required"),
      name: "Workflow Call Bad Secret Required",
    })
      .onWorkflowCall({
        secrets: {
          token: {
            required: "yes" as unknown as boolean,
          },
        },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_call" secret "token" required must be a boolean. Expected: true or false',
      ])
    );
  });

  it("rejects blank workflow_call output and secret names", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("workflow_call_blank_names"),
      name: "Workflow Call Blank Names",
    })
      .onWorkflowCall({
        outputs: {
          "": {
            value: "${{ jobs.test.outputs.value }}",
          },
        } as unknown as import("./index.ts").WorkflowCallOutputs,
        secrets: {
          " ": {
            required: true,
          },
        } as unknown as import("./index.ts").WorkflowCallSecrets,
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_call" outputs must not contain blank names',
        'trigger "workflow_call" secrets must not contain blank names',
      ])
    );
  });

  it("builds reusable workflow jobs with explicit secret bindings", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("caller"),
      name: "Caller",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job
          .ifCondition("github.ref == 'refs/heads/main'")
          .continueOnError(true)
          .usesWorkflow("./.github/workflows/deploy.yml@main", {
            with: {
              environment: "production",
            },
            secrets: {
              token: "${{ secrets.GITHUB_TOKEN }}",
            },
          });
      })
      .build();

    expect(workflow.jobs).toEqual([
      {
        kind: "reusable-workflow",
        id: "deploy",
        if: "github.ref == 'refs/heads/main'",
        continueOnError: true,
        with: {
          environment: "production",
        },
        secrets: {
          token: "${{ secrets.GITHUB_TOKEN }}",
        },
        uses: "./.github/workflows/deploy.yml@main",
      },
    ]);
  });

  it("builds reusable workflow jobs with inherit secrets shorthand", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("caller_inherit"),
      name: "Caller Inherit",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.usesWorkflow("./.github/workflows/deploy.yml@main", {
          secrets: "inherit",
        });
      })
      .build();

    expect(workflow.jobs[0]).toEqual({
      kind: "reusable-workflow",
      id: "deploy",
      secrets: "inherit",
      uses: "./.github/workflows/deploy.yml@main",
    });
  });

  it("builds reusable workflow jobs without secrets", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("caller_without_secrets"),
      name: "Caller Without Secrets",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.usesWorkflow("./.github/workflows/deploy.yml@main", {
          with: {
            environment: "production",
          },
        });
      })
      .build();

    expect(workflow.jobs[0]).toEqual({
      kind: "reusable-workflow",
      id: "deploy",
      with: {
        environment: "production",
      },
      uses: "./.github/workflows/deploy.yml@main",
    });
  });

  it("rejects reusable workflow jobs mixed with inline steps or runs-on", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("caller_mixed_job"),
      name: "Caller Mixed Job",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .run("echo deploy", {
            workingDirectory: "./scripts",
          })
          .usesWorkflow("./.github/workflows/deploy.yml@main");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "deploy" reusable workflow job must not define runs-on. Only step-based jobs support runs-on',
        'job "deploy" reusable workflow job must not define inline steps. Only step-based jobs support inline steps',
      ])
    );
  });

  it("rejects blank reusable workflow with keys and secret values", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("caller_bad_bindings"),
      name: "Caller Bad Bindings",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.usesWorkflow("./.github/workflows/deploy.yml@main", {
          with: {
            " ": "production",
          },
          secrets: {
            token: "   ",
          },
        });
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "deploy" with must not contain blank keys',
        'job "deploy" secrets key "token" must not have a blank value',
      ])
    );
  });

  it("rejects reusable workflow jobs with missing or blank uses values", () => {
    const missingUsesBuilder = defineWorkflow({
      id: createWorkflowId("caller_missing_uses"),
      name: "Caller Missing Uses",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.usesWorkflow(undefined as unknown as WorkflowRef);
      });

    const blankUsesBuilder = defineWorkflow({
      id: createWorkflowId("caller_blank_uses"),
      name: "Caller Blank Uses",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.usesWorkflow("   " as unknown as WorkflowRef);
      });

    expect(() => missingUsesBuilder.build()).toThrowError(
      new WorkflowValidationError([
        'job "deploy" reusable workflow job must define uses. Expected: a reusable workflow reference (e.g. "org/repo/.github/workflows/ci.yml@main")',
      ])
    );
    expect(() => blankUsesBuilder.build()).toThrowError(
      new WorkflowValidationError(['job "deploy" reusable workflow uses must not be empty'])
    );
  });

  it("deep-freezes workflow_call triggers and reusable workflow jobs", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("workflow_call_frozen"),
      name: "Workflow Call Frozen",
    })
      .onWorkflowCall({
        inputs: {
          target: {
            type: "string",
          },
        },
      })
      .addJob(createJobId("deploy"), (job) => {
        job.usesWorkflow("./.github/workflows/deploy.yml@main", {
          with: { target: "prod" },
          secrets: "inherit",
        });
      })
      .build();

    const trigger = workflow.on[0] as {
      type: "workflow_call";
      inputs: Record<string, { type?: string }>;
    };
    const job = workflow.jobs[0]!;

    expect(Object.isFrozen(trigger)).toBe(true);
    expect(Object.isFrozen(trigger.inputs)).toBe(true);
    expect(Object.isFrozen(trigger.inputs.target)).toBe(true);
    expect(Object.isFrozen(job)).toBe(true);
  });

  it("builds job with if condition", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("job_if"),
      name: "Job If",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job
          .ifCondition("github.ref == 'refs/heads/main'")
          .runsOn("ubuntu-latest")
          .run("echo deploy");
      })
      .build();

    expect(workflow.jobs[0]!.if).toBe("github.ref == 'refs/heads/main'");
  });

  it("builds job with continue-on-error", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("job_continue"),
      name: "Job Continue",
    })
      .onPush()
      .addJob(createJobId("lint"), (job) => {
        job.continueOnError(true).runsOn("ubuntu-latest").run("bun run lint");
      })
      .build();

    expect(workflow.jobs[0]!.continueOnError).toBe(true);
  });

  it("builds job with if and continue-on-error together", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("job_if_and_continue"),
      name: "Job If And Continue",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run build");
      })
      .addJob(createJobId("deploy"), (job) => {
        job
          .ifCondition("github.ref == 'refs/heads/main'")
          .needs(createJobId("build"))
          .continueOnError(true)
          .runsOn("ubuntu-latest")
          .run("echo deploy");
      })
      .build();

    const deployJob = workflow.jobs[1]!;
    expect(deployJob.if).toBe("github.ref == 'refs/heads/main'");
    expect(deployJob.continueOnError).toBe(true);
    expect(deployJob.needs).toEqual([createJobId("build")]);
  });

  it("rejects blank job if expression", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("job_blank_if"),
      name: "Job Blank If",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.ifCondition("  ").runsOn("ubuntu-latest").run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['job "test" if must be a non-blank string'])
    );
  });

  it("rejects non-boolean job continue-on-error", () => {
    const builder = defineWorkflow({
      id: createWorkflowId("job_bad_continue"),
      name: "Job Bad Continue",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .continueOnError("yes" as unknown as boolean)
          .runsOn("ubuntu-latest")
          .run("bun test");
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "test" continue-on-error must be a boolean. Expected: true or false',
      ])
    );
  });

  it("renders job if before needs and continue-on-error after needs", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("job_field_order"),
      name: "Job Field Order",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run build");
      })
      .addJob(createJobId("deploy"), (job) => {
        job
          .ifCondition("github.ref == 'refs/heads/main'")
          .needs(createJobId("build"))
          .continueOnError(true)
          .runsOn("ubuntu-latest")
          .run("echo deploy");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const deployPayload = payload.jobs.deploy!;
    const keys = Object.keys(deployPayload);
    const ifIndex = keys.indexOf("if");
    const needsIndex = keys.indexOf("needs");
    const continueOnErrorIndex = keys.indexOf("continue-on-error");

    expect(ifIndex).toBeLessThan(needsIndex);
    expect(needsIndex).toBeLessThan(continueOnErrorIndex);
  });

  it("deep-freezes job if and continue-on-error", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("job_freeze_if_continue"),
      name: "Job Freeze If Continue",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job
          .ifCondition("github.ref == 'refs/heads/main'")
          .continueOnError(true)
          .runsOn("ubuntu-latest")
          .run("echo deploy");
      })
      .build();

    const job = workflow.jobs[0]!;
    expect(Object.isFrozen(job)).toBe(true);
    expect(job.if).toBe("github.ref == 'refs/heads/main'");
    expect(job.continueOnError).toBe(true);
  });

  it("builds a job with container", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("container_job"),
      name: "Container Job",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .container({
            image: "node:20",
            credentials: { username: "user", password: "${{ secrets.DOCKER_PASSWORD }}" },
            env: { NODE_ENV: "test" },
            ports: [80, "8080:80"],
            volumes: ["/data:/data"],
            options: "--cpus 2",
          })
          .run("npm test");
      })
      .build();

    const job = workflow.jobs[0]!;
    expect(job.kind).toBe("steps");
    if (job.kind !== "steps") return;
    expect(job.container).toBeDefined();
    expect(job.container!.image).toBe("node:20");
    expect(job.container!.credentials).toEqual({
      username: "user",
      password: "${{ secrets.DOCKER_PASSWORD }}",
    });
    expect(job.container!.env).toEqual({ NODE_ENV: "test" });
    expect(job.container!.ports).toEqual([80, "8080:80"]);
    expect(job.container!.volumes).toEqual(["/data:/data"]);
    expect(job.container!.options).toBe("--cpus 2");
  });

  it("builds a job with services", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("services_job"),
      name: "Services Job",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .services({
            postgres: {
              image: "postgres:15",
              env: { POSTGRES_PASSWORD: "test" },
              ports: [5432],
            },
            redis: {
              image: "redis:7",
              ports: [6379],
            },
          })
          .run("npm test");
      })
      .build();

    const job = workflow.jobs[0]!;
    expect(job.kind).toBe("steps");
    if (job.kind !== "steps") return;
    expect(job.services).toBeDefined();
    expect(job.services!["postgres"]!.image).toBe("postgres:15");
    expect(job.services!["redis"]!.image).toBe("redis:7");
  });

  it("builds a job with container image only", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("container_image_only"),
      name: "Container Image Only",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").container({ image: "node:20" }).run("npm test");
      })
      .build();

    const job = workflow.jobs[0]!;
    if (job.kind !== "steps") return;
    expect(job.container).toEqual({ image: "node:20" });
  });

  it("deep-freezes container and services", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("frozen_container"),
      name: "Frozen Container",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .container({ image: "node:20", env: { CI: "true" } })
          .services({ redis: { image: "redis:7" } })
          .run("npm test");
      })
      .build();

    const job = workflow.jobs[0]!;
    expect(Object.isFrozen(job)).toBe(true);
    if (job.kind !== "steps") return;
    expect(Object.isFrozen(job.container)).toBe(true);
    expect(Object.isFrozen(job.services)).toBe(true);
  });

  it("rejects blank container image", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("blank_container_image"),
        name: "Blank Container Image",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job.runsOn("ubuntu-latest").container({ image: "  " }).run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects blank container credentials username", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("blank_cred_user"),
        name: "Blank Cred User",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .container({ image: "node:20", credentials: { username: "  ", password: "secret" } })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects blank container credentials password", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("blank_cred_pass"),
        name: "Blank Cred Pass",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .container({ image: "node:20", credentials: { username: "user", password: "  " } })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects blank container env keys", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("blank_container_env"),
        name: "Blank Container Env",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .container({ image: "node:20", env: { "": "val" } })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects non-positive integer container port", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("bad_port"),
        name: "Bad Port",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .container({ image: "node:20", ports: [-1] })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects blank string container port", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("blank_port"),
        name: "Blank Port",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .container({ image: "node:20", ports: ["  "] })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects blank container volume", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("blank_volume"),
        name: "Blank Volume",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .container({ image: "node:20", volumes: ["  "] })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects blank container options", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("blank_options"),
        name: "Blank Options",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .container({ image: "node:20", options: "  " })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects invalid service name", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("bad_service_name"),
        name: "Bad Service Name",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .services({ "1bad": { image: "redis:7" } })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects container on reusable workflow job", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("reusable_container"),
        name: "Reusable Container",
      })
        .onPush()
        .addJob(createJobId("call"), (job) => {
          (job as unknown as { jobContainer: { image: string } }).jobContainer = {
            image: "node:20",
          };
          job.usesWorkflow("org/repo/.github/workflows/ci.yml@main");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("rejects services on reusable workflow job", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("reusable_services"),
        name: "Reusable Services",
      })
        .onPush()
        .addJob(createJobId("call"), (job) => {
          (job as unknown as { jobServices: Record<string, { image: string }> }).jobServices = {
            redis: { image: "redis:7" },
          };
          job.usesWorkflow("org/repo/.github/workflows/ci.yml@main");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  it("clones container config to prevent external mutation", () => {
    const containerConfig = {
      image: "node:20",
      env: { CI: "true" },
      ports: [80] as (number | string)[],
      volumes: ["/data:/data"],
    };

    const workflow = defineWorkflow({
      id: createWorkflowId("clone_container"),
      name: "Clone Container",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").container(containerConfig).run("npm test");
      })
      .build();

    containerConfig.env.CI = "false";
    containerConfig.ports.push(443);
    containerConfig.volumes.push("/tmp:/tmp");

    const job = workflow.jobs[0]!;
    if (job.kind !== "steps") return;
    expect(job.container!.env).toEqual({ CI: "true" });
    expect(job.container!.ports).toEqual([80]);
    expect(job.container!.volumes).toEqual(["/data:/data"]);
  });

  it("validates each service entry like a container config", () => {
    expect(() =>
      defineWorkflow({
        id: createWorkflowId("bad_service_image"),
        name: "Bad Service Image",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .services({ postgres: { image: "  " } })
            .run("npm test");
        })
        .build()
    ).toThrow(WorkflowValidationError);
  });

  describe("actionRef factory", () => {
    it("accepts a valid external action reference", () => {
      expect(actionRef("actions/checkout@v4")).toBe("actions/checkout@v4");
    });

    it("accepts a valid local action reference", () => {
      expect(actionRef("./my-action")).toBe("./my-action");
    });

    it("accepts a valid Docker action reference", () => {
      expect(actionRef("docker://alpine:3.8")).toBe("docker://alpine:3.8");
    });

    it("rejects an empty string", () => {
      expect(() => actionRef("")).toThrow(Error);
    });

    it("rejects a blank string", () => {
      expect(() => actionRef("   ")).toThrow(Error);
    });

    it("rejects an invalid format without slash and at", () => {
      expect(() => actionRef("just-a-string")).toThrow(Error);
    });

    it("rejects an invalid format without at sign", () => {
      expect(() => actionRef("no-slash-no-at")).toThrow(Error);
    });
  });

  describe("workflowRef factory", () => {
    it("accepts a valid external workflow reference", () => {
      expect(workflowRef("org/repo/.github/workflows/ci.yml@main")).toBe(
        "org/repo/.github/workflows/ci.yml@main"
      );
    });

    it("accepts a valid local workflow reference", () => {
      expect(workflowRef("./.github/workflows/deploy.yml")).toBe("./.github/workflows/deploy.yml");
    });

    it("rejects an empty string", () => {
      expect(() => workflowRef("")).toThrow(Error);
    });

    it("rejects a blank string", () => {
      expect(() => workflowRef("   ")).toThrow(Error);
    });

    it("rejects an action reference format", () => {
      expect(() => workflowRef("actions/checkout@v4")).toThrow(Error);
    });

    it("rejects an invalid format", () => {
      expect(() => workflowRef("just-a-string")).toThrow(Error);
    });
  });

  describe("build validation for uses references", () => {
    it("rejects a step with an invalid uses format", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("invalid_step_uses"),
        name: "Invalid Step Uses",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").uses("just-a-string" as unknown as ActionRef);
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "build" step 1 uses value is not a valid action reference. Expected: owner/repo@ref, ./path, or docker://image',
        ])
      );
    });

    it("rejects a reusable workflow job with an invalid uses format", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("invalid_workflow_uses"),
        name: "Invalid Workflow Uses",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.usesWorkflow("actions/checkout@v4" as unknown as WorkflowRef);
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "deploy" reusable workflow uses value is not a valid workflow reference. Expected: owner/repo/.github/workflows/file@ref or ./.github/workflows/file',
        ])
      );
    });

    it("builds steps with all valid ActionRef forms", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("all_action_ref_forms"),
        name: "All Action Ref Forms",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .uses("actions/checkout@v4")
            .uses("./my-action")
            .uses("docker://alpine:3.8");
        })
        .build();

      expect(workflow.jobs[0]!.steps).toEqual([
        { kind: "uses", uses: "actions/checkout@v4" },
        { kind: "uses", uses: "./my-action" },
        { kind: "uses", uses: "docker://alpine:3.8" },
      ]);
    });

    it("builds reusable workflow jobs with all valid WorkflowRef forms", () => {
      const externalWorkflow = defineWorkflow({
        id: createWorkflowId("external_workflow_ref"),
        name: "External Workflow Ref",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.usesWorkflow("org/repo/.github/workflows/ci.yml@main");
        })
        .build();

      const localWorkflow = defineWorkflow({
        id: createWorkflowId("local_workflow_ref"),
        name: "Local Workflow Ref",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.usesWorkflow("./.github/workflows/deploy.yml");
        })
        .build();

      expect(externalWorkflow.jobs[0]!.uses).toBe("org/repo/.github/workflows/ci.yml@main");
      expect(localWorkflow.jobs[0]!.uses).toBe("./.github/workflows/deploy.yml");
    });
  });

  describe("script reference steps", () => {
    it("builds a run step from a local script path without shell", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: "./scripts/deploy.sh" });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      expect(step.kind).toBe("run");
      if (step.kind === "run") {
        expect(step.run).toBe("./scripts/deploy.sh");
        expect(step.scriptReference).toEqual({ path: "./scripts/deploy.sh" });
        expect(step.shell).toBeUndefined();
      }
    });

    it("builds a run step from a script path with shell prefix", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: "./scripts/deploy.sh", shell: "bash" });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      expect(step.kind).toBe("run");
      if (step.kind === "run") {
        expect(step.run).toBe("bash ./scripts/deploy.sh");
        expect(step.scriptReference).toEqual({ path: "./scripts/deploy.sh", shell: "bash" });
        expect(step.shell).toBeUndefined();
      }
    });

    it("builds a run step from a script path with metadata shell (step-level)", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: "./scripts/deploy.sh" }, { shell: "bash" });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      expect(step.kind).toBe("run");
      if (step.kind === "run") {
        expect(step.run).toBe("./scripts/deploy.sh");
        expect(step.shell).toBe("bash");
        expect(step.scriptReference).toEqual({ path: "./scripts/deploy.sh" });
      }
    });

    it("accepts an absolute path for script references", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: "/opt/scripts/deploy.sh", shell: "bash" });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      if (step.kind === "run") {
        expect(step.run).toBe("bash /opt/scripts/deploy.sh");
        expect(step.scriptReference).toEqual({
          path: "/opt/scripts/deploy.sh",
          shell: "bash",
        });
      }
    });

    it("accepts any non-blank shell string for script references", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: "./deploy.py", shell: "python3" });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      if (step.kind === "run") {
        expect(step.run).toBe("python3 ./deploy.py");
        expect(step.scriptReference).toEqual({ path: "./deploy.py", shell: "python3" });
      }
    });

    it("builds a script reference step with expand mode reading file contents", () => {
      const fixturePath = new URL("../../../tests/fixtures/sample-script.sh", import.meta.url)
        .pathname;

      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: fixturePath, expand: true });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      if (step.kind === "run") {
        expect(step.run).toContain('echo "Hello from script"');
        expect(step.scriptReference).toEqual({ path: fixturePath, expand: true });
        expect(step.shell).toBeUndefined();
      }
    });

    it("preserves trailing newline in expand mode (does not trim expanded script body)", () => {
      const fixturePath = new URL("../../../tests/fixtures/sample-script.sh", import.meta.url)
        .pathname;

      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: fixturePath, expand: true });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      if (step.kind === "run") {
        // Expanded file content must be preserved as-is; trailing newline must not be stripped.
        expect(step.run.endsWith("\n")).toBe(true);
      }
    });

    it("builds a script reference step with expand mode and script-reference shell", () => {
      const fixturePath = new URL("../../../tests/fixtures/sample-script.sh", import.meta.url)
        .pathname;

      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: fixturePath, shell: "bash", expand: true });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      if (step.kind === "run") {
        expect(step.run).toContain('echo "Hello from script"');
        expect(step.shell).toBe("bash");
        expect(step.scriptReference).toEqual({
          path: fixturePath,
          shell: "bash",
          expand: true,
        });
      }
    });

    it("builds a script reference step with expand mode and metadata shell", () => {
      const fixturePath = new URL("../../../tests/fixtures/sample-script.sh", import.meta.url)
        .pathname;

      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .runScript({ path: fixturePath, expand: true }, { shell: "sh" });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      if (step.kind === "run") {
        expect(step.run).toContain('echo "Hello from script"');
        expect(step.shell).toBe("sh");
        expect(step.scriptReference).toEqual({ path: fixturePath, expand: true });
      }
    });

    it("preserves step metadata on script reference steps", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript(
            { path: "./scripts/deploy.sh", shell: "bash" },
            {
              name: "Deploy",
              id: "deploy_step",
              env: { NODE_ENV: "production" },
              if: "github.ref == 'refs/heads/main'",
              continueOnError: true,
              timeoutMinutes: 30,
              workingDirectory: "./app",
            }
          );
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      if (step.kind === "run") {
        expect(step.run).toBe("bash ./scripts/deploy.sh");
        expect(step.name).toBe("Deploy");
        expect(step.id).toBe("deploy_step");
        expect(step.env).toEqual({ NODE_ENV: "production" });
        expect(step.if).toBe("github.ref == 'refs/heads/main'");
        expect(step.continueOnError).toBe(true);
        expect(step.timeoutMinutes).toBe(30);
        expect(step.workingDirectory).toBe("./app");
      }
    });

    it("rejects double shell specification at build time", () => {
      expect(() => {
        defineWorkflow({
          id: createWorkflowId("ci"),
          name: "CI",
        })
          .onPush()
          .addJob(createJobId("deploy"), (job) => {
            job
              .runsOn("ubuntu-latest")
              .runScript({ path: "./scripts/deploy.sh", shell: "bash" }, { shell: "sh" });
          })
          .build();
      }).toThrow(WorkflowValidationError);

      try {
        defineWorkflow({
          id: createWorkflowId("ci"),
          name: "CI",
        })
          .onPush()
          .addJob(createJobId("deploy"), (job) => {
            job
              .runsOn("ubuntu-latest")
              .runScript({ path: "./scripts/deploy.sh", shell: "bash" }, { shell: "sh" });
          })
          .build();
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowValidationError);
        const validationError = error as InstanceType<typeof WorkflowValidationError>;
        expect(validationError.issues).toContain(
          'job "deploy" step 1 must not define shell in both script-reference and step metadata. Expected: shell in one location only'
        );
      }
    });

    it("rejects blank script-reference path at call time", () => {
      expect(() => {
        defineWorkflow({
          id: createWorkflowId("ci"),
          name: "CI",
        })
          .onPush()
          .addJob(createJobId("deploy"), (job) => {
            job.runsOn("ubuntu-latest").runScript({ path: "" });
          })
          .build();
      }).toThrow(WorkflowValidationError);

      try {
        defineWorkflow({
          id: createWorkflowId("ci"),
          name: "CI",
        })
          .onPush()
          .addJob(createJobId("deploy"), (job) => {
            job.runsOn("ubuntu-latest").runScript({ path: "" });
          })
          .build();
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowValidationError);
        const validationError = error as InstanceType<typeof WorkflowValidationError>;
        expect(validationError.issues).toContain(
          'runScript() requires "path" to be a non-empty string.'
        );
      }
    });

    it("rejects blank script-reference shell at call time", () => {
      expect(() => {
        defineWorkflow({
          id: createWorkflowId("ci"),
          name: "CI",
        })
          .onPush()
          .addJob(createJobId("deploy"), (job) => {
            job.runsOn("ubuntu-latest").runScript({ path: "./deploy.sh", shell: "  " });
          })
          .build();
      }).toThrow(WorkflowValidationError);

      try {
        defineWorkflow({
          id: createWorkflowId("ci"),
          name: "CI",
        })
          .onPush()
          .addJob(createJobId("deploy"), (job) => {
            job.runsOn("ubuntu-latest").runScript({ path: "./deploy.sh", shell: "  " });
          })
          .build();
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowValidationError);
        const validationError = error as InstanceType<typeof WorkflowValidationError>;
        expect(validationError.issues).toContain(
          'runScript() requires "shell" to be omitted or a non-empty string.'
        );
      }
    });

    it("rejects unreadable script path in expand mode at call time", () => {
      try {
        defineWorkflow({
          id: createWorkflowId("ci"),
          name: "CI",
        })
          .onPush()
          .addJob(createJobId("deploy"), (job) => {
            job
              .runsOn("ubuntu-latest")
              .runScript({ path: "./nonexistent-script.sh", expand: true });
          })
          .build();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowValidationError);
        const validationError = error as InstanceType<typeof WorkflowValidationError>;
        expect(validationError.issues[0]).toContain(
          'runScript() could not read script at "./nonexistent-script.sh"'
        );
      }
    });

    it("freezes the built script reference deeply", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("ci"),
        name: "CI",
      })
        .onPush()
        .addJob(createJobId("deploy"), (job) => {
          job.runsOn("ubuntu-latest").runScript({ path: "./deploy.sh", shell: "bash" });
        })
        .build();

      const step = workflow.jobs[0]!.steps![0]!;
      if (step.kind === "run") {
        expect(Object.isFrozen(step.scriptReference)).toBe(true);
      }
    });

    it("maps script reference in reusable-workflow job step drafts", () => {
      expect(() => {
        defineWorkflow({
          id: createWorkflowId("ci"),
          name: "CI",
        })
          .onPush()
          .addJob(createJobId("deploy"), (job) => {
            job
              .runScript({ path: "./deploy.sh", shell: "bash" })
              .usesWorkflow("org/repo/.github/workflows/deploy.yml@main");
          })
          .build();
      }).toThrow(WorkflowValidationError);
    });
  });

  describe("usesWorkflow object injection", () => {
    it("accepts a WorkflowBuilder and derives local workflow ref", () => {
      const reusable = defineWorkflow({
        id: createWorkflowId("deploy"),
        name: "Deploy",
      }).onWorkflowCall();

      const result = defineWorkflow({
        id: createWorkflowId("caller"),
        name: "Caller",
      })
        .onPush()
        .addJob(createJobId("call_deploy"), (job) => {
          job.usesWorkflow(reusable, { secrets: "inherit" });
        })
        .build();

      const reusableJob = result.jobs[0] as ReusableWorkflowJob;
      expect(reusableJob.uses).toBe("./.github/workflows/deploy.yml");
      expect(reusableJob.secrets).toBe("inherit");
    });

    it("accepts a WorkflowDefinition and derives local workflow ref", () => {
      const reusableDefinition = defineWorkflow({
        id: createWorkflowId("shared_ci"),
        name: "Shared CI",
      })
        .onWorkflowCall()
        .addJob(createJobId("test"), (job) => {
          job.runsOn("ubuntu-latest").run("bun test");
        })
        .build();

      const result = defineWorkflow({
        id: createWorkflowId("caller"),
        name: "Caller",
      })
        .onPush()
        .addJob(createJobId("run_ci"), (job) => {
          job.usesWorkflow(reusableDefinition);
        })
        .build();

      const reusableJob = result.jobs[0] as ReusableWorkflowJob;
      expect(reusableJob.uses).toBe("./.github/workflows/shared_ci.yml");
    });

    it("rejects a WorkflowBuilder without workflow_call trigger at build time", () => {
      const notReusable = defineWorkflow({
        id: createWorkflowId("not_reusable"),
        name: "Not Reusable",
      }).onPush();

      expect(() =>
        defineWorkflow({
          id: createWorkflowId("caller"),
          name: "Caller",
        })
          .onPush()
          .addJob(createJobId("call_it"), (job) => {
            job.usesWorkflow(notReusable);
          })
          .build()
      ).toThrow(/does not declare a workflow_call trigger/);
    });

    it("rejects a WorkflowDefinition without workflow_call trigger at build time", () => {
      const notReusable = defineWorkflow({
        id: createWorkflowId("not_reusable"),
        name: "Not Reusable",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job.runsOn("ubuntu-latest").run("echo test");
        })
        .build();

      expect(() =>
        defineWorkflow({
          id: createWorkflowId("caller"),
          name: "Caller",
        })
          .onPush()
          .addJob(createJobId("call_it"), (job) => {
            job.usesWorkflow(notReusable);
          })
          .build()
      ).toThrow(/does not declare a workflow_call trigger/);
    });

    it("forwards with and secrets when using a WorkflowBuilder", () => {
      const reusable = defineWorkflow({
        id: createWorkflowId("deploy"),
        name: "Deploy",
      }).onWorkflowCall({
        inputs: { environment: { type: "string", required: true } },
        secrets: { token: { required: true } },
      });

      const result = defineWorkflow({
        id: createWorkflowId("caller"),
        name: "Caller",
      })
        .onPush()
        .addJob(createJobId("call_deploy"), (job) => {
          job.usesWorkflow(reusable, {
            with: { environment: "production" },
            secrets: { token: "${{ secrets.DEPLOY_TOKEN }}" },
          });
        })
        .build();

      const reusableJob = result.jobs[0] as ReusableWorkflowJob;
      expect(reusableJob.uses).toBe("./.github/workflows/deploy.yml");
      expect(reusableJob.with).toEqual({ environment: "production" });
      expect(reusableJob.secrets).toEqual({ token: "${{ secrets.DEPLOY_TOKEN }}" });
    });

    it("allows onWorkflowCall to be called after usesWorkflow (definition-order independence)", () => {
      const reusable = defineWorkflow({
        id: createWorkflowId("deploy"),
        name: "Deploy",
      });

      // usesWorkflow first, onWorkflowCall later
      const caller = defineWorkflow({
        id: createWorkflowId("caller"),
        name: "Caller",
      })
        .onPush()
        .addJob(createJobId("call_deploy"), (job) => {
          job.usesWorkflow(reusable, { secrets: "inherit" });
        });

      // Add workflow_call trigger AFTER usesWorkflow was called
      reusable.onWorkflowCall();

      const result = caller.build();
      const reusableJob = result.jobs[0] as ReusableWorkflowJob;
      expect(reusableJob.uses).toBe("./.github/workflows/deploy.yml");
    });

    it("continues to accept WorkflowRef strings unchanged", () => {
      const result = defineWorkflow({
        id: createWorkflowId("caller"),
        name: "Caller",
      })
        .onPush()
        .addJob(createJobId("external"), (job) => {
          job.usesWorkflow("org/repo/.github/workflows/ci.yml@main");
        })
        .addJob(createJobId("local"), (job) => {
          job.usesWorkflow("./.github/workflows/deploy.yml");
        })
        .build();

      expect((result.jobs[0] as ReusableWorkflowJob).uses).toBe(
        "org/repo/.github/workflows/ci.yml@main"
      );
      expect((result.jobs[1] as ReusableWorkflowJob).uses).toBe("./.github/workflows/deploy.yml");
    });
  });

  describe("string shorthand for step name", () => {
    it("uses() accepts a string shorthand equivalent to { name: value }", () => {
      const shorthand = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job.runsOn("ubuntu-latest").uses("actions/checkout@v4", "Checkout");
        })
        .build();

      const expanded = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job.runsOn("ubuntu-latest").uses("actions/checkout@v4", { name: "Checkout" });
        })
        .build();

      expect((shorthand.jobs[0] as StepsJob).steps).toEqual((expanded.jobs[0] as StepsJob).steps);
    });

    it("run() accepts a string shorthand equivalent to { name: value }", () => {
      const shorthand = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job.runsOn("ubuntu-latest").run("npm test", "Run tests");
        })
        .build();

      const expanded = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job.runsOn("ubuntu-latest").run("npm test", { name: "Run tests" });
        })
        .build();

      expect((shorthand.jobs[0] as StepsJob).steps).toEqual((expanded.jobs[0] as StepsJob).steps);
    });

    it("runScript() accepts a string shorthand equivalent to { name: value }", () => {
      const shorthand = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .runScript({ path: "./scripts/deploy.sh" }, "Run deploy script");
        })
        .build();

      const expanded = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .runScript({ path: "./scripts/deploy.sh" }, { name: "Run deploy script" });
        })
        .build();

      expect((shorthand.jobs[0] as StepsJob).steps).toEqual((expanded.jobs[0] as StepsJob).steps);
    });

    it("string shorthand and object form produce identical rendered YAML payloads", () => {
      const shorthand = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .uses("actions/checkout@v4", "Checkout")
            .run("npm test", "Test")
            .runScript({ path: "./scripts/deploy.sh" }, "Deploy");
        })
        .build();

      const expanded = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .uses("actions/checkout@v4", { name: "Checkout" })
            .run("npm test", { name: "Test" })
            .runScript({ path: "./scripts/deploy.sh" }, { name: "Deploy" });
        })
        .build();

      const shorthandPayload = createWorkflowRenderPayload(shorthand);
      const expandedPayload = createWorkflowRenderPayload(expanded);
      expect(shorthandPayload).toEqual(expandedPayload);
    });

    it("existing object-form usage continues to work unchanged", () => {
      const result = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .uses("actions/checkout@v4", {
              name: "Checkout",
              with: { "fetch-depth": "0" },
            })
            .run("npm test", {
              name: "Test",
              shell: "bash",
              env: { CI: "true" },
            })
            .runScript(
              { path: "./scripts/deploy.sh" },
              { name: "Deploy", workingDirectory: "./dist" }
            );
        })
        .build();

      const steps = (result.jobs[0] as StepsJob).steps;
      expect(steps[0]).toMatchObject({
        kind: "uses",
        name: "Checkout",
        with: { "fetch-depth": "0" },
      });
      expect(steps[1]).toMatchObject({
        kind: "run",
        name: "Test",
        shell: "bash",
        env: { CI: "true" },
      });
      expect(steps[2]).toMatchObject({
        kind: "run",
        name: "Deploy",
        workingDirectory: "./dist",
      });
    });

    it("string shorthand empty string is rejected by validation", () => {
      const builder = defineWorkflow({
        id: createWorkflowId("w"),
        name: "W",
      })
        .onPush()
        .addJob(createJobId("j"), (job) => {
          job.runsOn("ubuntu-latest").run("echo hi", "  ");
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "j" step 1 name must not be empty'])
      );
    });
  });
});
