import { describe, expect, it } from "vitest";

import { createJobId, createWorkflowId } from "@ghawb/shared";

import type { WorkflowDefinition, WorkflowRenderPayload } from "./index.js";
import {
  WorkflowRenderError,
  createWorkflowRenderPayload,
  defineWorkflow,
  renderWorkflow,
} from "./index.js";

function emitPseudoYaml(payload: WorkflowRenderPayload): string {
  return JSON.stringify(payload, null, 2);
}

describe("workflow renderer", () => {
  it("creates a deterministic intermediate payload for representative workflows", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPullRequest({
        branches: ["main"],
      })
      .onPush({
        branches: ["main"],
        paths: ["packages/**"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn(["ubuntu-latest", "self-hosted"]).uses("actions/checkout@v4", {
          name: "Checkout",
        });
      })
      .addJob(createJobId("lint"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run lint", {
          env: {
            CI: "true",
          },
          with: {
            coverage: "true",
          },
          if: "github.event_name == 'push'",
          name: "Lint",
        });
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "CI",
      on: {
        push: {
          branches: ["main"],
          paths: ["packages/**"],
        },
        pull_request: {
          branches: ["main"],
        },
      },
      jobs: {
        test: {
          "runs-on": ["ubuntu-latest", "self-hosted"],
          steps: [
            {
              name: "Checkout",
              uses: "actions/checkout@v4",
            },
          ],
        },
        lint: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              name: "Lint",
              if: "github.event_name == 'push'",
              env: {
                CI: "true",
              },
              with: {
                coverage: "true",
              },
              run: "bun run lint",
            },
          ],
        },
      },
    });
  });

  it("renders workflow_dispatch in canonical trigger order", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("manual"),
      name: "Manual",
    })
      .onWorkflowDispatch()
      .onPush({
        branches: ["main"],
      })
      .onPullRequest({
        branches: ["main"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: "Manual",
      on: {
        push: {
          branches: ["main"],
        },
        pull_request: {
          branches: ["main"],
        },
        workflow_dispatch: null,
      },
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });
    expect(Object.keys(payload.on)).toEqual(["push", "pull_request", "workflow_dispatch"]);
  });

  it("renders schedule in canonical trigger order after workflow_dispatch", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("nightly"),
      name: "Nightly",
    })
      .onSchedule(["0 0 * * *", "30 12 * * 1-5"])
      .onWorkflowDispatch()
      .onPush({
        branches: ["main"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: "Nightly",
      on: {
        push: {
          branches: ["main"],
        },
        workflow_dispatch: null,
        schedule: [{ cron: "0 0 * * *" }, { cron: "30 12 * * 1-5" }],
      },
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });
    expect(Object.keys(payload.on)).toEqual(["push", "workflow_dispatch", "schedule"]);
  });

  it("renders workflow_call in canonical trigger order after workflow_dispatch", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("reusable_order"),
      name: "Reusable Order",
    })
      .onSchedule("0 0 * * *")
      .onWorkflowCall({
        inputs: {
          environment: {
            type: "string",
          },
        },
      })
      .onWorkflowDispatch()
      .onPush({
        branches: ["main"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(Object.keys(payload.on)).toEqual([
      "push",
      "workflow_dispatch",
      "workflow_call",
      "schedule",
    ]);
  });

  it("renders workflow_call fields in canonical order", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("workflow_call_render"),
      name: "Workflow Call Render",
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
            description: "Deploy token",
            required: true,
          },
        },
      })
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const workflowCallPayload = payload.on.workflow_call!;

    expect(workflowCallPayload).toEqual({
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
          description: "Deploy token",
          required: true,
        },
      },
    });
    expect(Object.keys(workflowCallPayload)).toEqual(["inputs", "outputs", "secrets"]);
  });

  it("renders workflow_call without inputs when only outputs are declared", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("workflow_call_outputs_only"),
      name: "Workflow Call Outputs Only",
    })
      .onWorkflowCall({
        outputs: {
          artifact_url: {
            value: "${{ jobs.build.outputs.artifact_url }}",
          },
        },
      })
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(createWorkflowRenderPayload(workflow).on.workflow_call).toEqual({
      outputs: {
        artifact_url: {
          value: "${{ jobs.build.outputs.artifact_url }}",
        },
      },
    });
  });

  it("renders workflow_call secrets with description and required", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("workflow_call_secret_render"),
      name: "Workflow Call Secret Render",
    })
      .onWorkflowCall({
        secrets: {
          token: {
            description: "Deploy token",
            required: true,
          },
        },
      })
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(createWorkflowRenderPayload(workflow).on.workflow_call).toEqual({
      secrets: {
        token: {
          description: "Deploy token",
          required: true,
        },
      },
    });
  });

  it("renders identical output across repeated runs with the same emitter", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("repeatable"),
      name: "Repeatable",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders workflow_dispatch deterministically as a null-payload trigger", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("manual"),
      name: "Manual",
    })
      .onWorkflowDispatch()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "Manual",
      on: {
        workflow_dispatch: null,
      },
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });
  });

  it("renders workflow_dispatch inputs with all fields in payload order", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("dispatch_render_full"),
      name: "Dispatch Render Full",
    })
      .onWorkflowDispatch({
        environment: {
          description: "Target environment",
          required: true,
          default: "staging",
          type: "choice",
          options: ["staging", "production"],
        },
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(createWorkflowRenderPayload(workflow).on.workflow_dispatch).toEqual({
      inputs: {
        environment: {
          description: "Target environment",
          required: true,
          default: "staging",
          type: "choice",
          options: ["staging", "production"],
        },
      },
    });
  });

  it("renders schedule deterministically as an ordered cron-entry array", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("nightly"),
      name: "Nightly",
    })
      .onSchedule(["0 0 * * *", "30 12 * * 1-5"])
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "Nightly",
      on: {
        schedule: [{ cron: "0 0 * * *" }, { cron: "30 12 * * 1-5" }],
      },
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });
  });

  it("renders job needs in declared dependency order", () => {
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

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "Pipeline",
      on: {
        push: null,
      },
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun run build",
            },
          ],
        },
        test: {
          needs: ["build"],
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
        deploy: {
          needs: ["build", "test"],
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun run deploy",
            },
          ],
        },
      },
    });
  });

  it("renders strategy matrices deterministically", () => {
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

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "Matrix",
      on: {
        push: null,
      },
      jobs: {
        test: {
          strategy: {
            matrix: {
              os: ["ubuntu-latest", "windows-latest"],
              node: ["18", "20"],
            },
          },
          "runs-on": "${{ matrix.os }}",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders workflow-level and job-level permissions deterministically", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("permissions"),
      name: "Permissions",
    })
      .onPush()
      .permissions({
        contents: "read",
        actions: "write",
        "pull-requests": "none",
      })
      .addJob(createJobId("check"), (job) => {
        job
          .permissions({
            models: "read",
            checks: "write",
            "id-token": "write",
          })
          .runsOn("ubuntu-latest")
          .run("bun test");
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "Permissions",
      on: {
        push: null,
      },
      permissions: {
        actions: "write",
        contents: "read",
        "pull-requests": "none",
      },
      jobs: {
        check: {
          permissions: {
            checks: "write",
            "id-token": "write",
            models: "read",
          },
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders workflow-level defaults and permissions shorthand deterministically", () => {
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

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "Workflow Defaults And Permissions Shorthand",
      on: {
        push: null,
      },
      permissions: "read-all",
      defaults: {
        run: {
          shell: "bash",
          "working-directory": "./",
        },
      },
      jobs: {
        check: {
          permissions: "write-all",
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders execution environment metadata deterministically", () => {
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

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "Execution Metadata",
      on: {
        push: null,
      },
      jobs: {
        check: {
          "timeout-minutes": 15,
          defaults: {
            run: {
              shell: "bash",
              "working-directory": "./packages/sdk",
            },
          },
          "runs-on": "ubuntu-latest",
          steps: [
            {
              shell: "sh",
              "working-directory": "./packages/sdk",
              run: "bun test",
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders workflow defaults.run with shell-only payloads", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("defaults_shell_only"),
      name: "Defaults Shell Only",
    })
      .onPush()
      .defaultsRun({
        shell: "bash",
      })
      .addJob(createJobId("check"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    expect(createWorkflowRenderPayload(workflow).defaults).toEqual({
      run: {
        shell: "bash",
      },
    });
  });

  it("renders workflow-level and job-level concurrency deterministically", () => {
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

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: "Concurrency",
      on: {
        push: null,
      },
      concurrency: {
        group: "deploy",
        "cancel-in-progress": true,
      },
      jobs: {
        check: {
          concurrency: {
            group: "check-${{ github.ref }}",
          },
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("fails explicitly before emission when unsupported workflow fields are present", () => {
    let emitterCalls = 0;

    const unsupportedWorkflow = {
      id: createWorkflowId("unsupported"),
      name: "Unsupported",
      on: [
        {
          type: "push",
        },
      ],
      jobs: [
        {
          kind: "steps",
          id: createJobId("test"),
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
      timeoutMinutes: 15,
    } as WorkflowDefinition & {
      timeoutMinutes: number;
    };

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => {
        emitterCalls += 1;
        return emitPseudoYaml(payload);
      })
    ).toThrowError(new WorkflowRenderError('unsupported workflow field "timeoutMinutes"'));
    expect(emitterCalls).toBe(0);
  });

  it("fails explicitly before emission when permissions contain unsupported keys or values", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("unsupported_permissions"),
      name: "Unsupported Permissions",
      on: [
        {
          type: "push",
        },
      ],
      permissions: {
        unknown: "read",
      },
      jobs: [
        {
          id: createJobId("check"),
          permissions: {
            models: "write",
          },
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError(
        'unsupported workflow permissions key "unknown". Expected: one of actions, artifact-metadata, attestations, checks, contents, deployments, discussions, id-token, issues, models, packages, pages, pull-requests, security-events, statuses'
      )
    );
  });

  it("fails explicitly before emission when permissions contain undefined values", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("undefined_permissions"),
      name: "Undefined Permissions",
      on: [
        {
          type: "push",
        },
      ],
      permissions: {
        contents: undefined,
      },
      jobs: [
        {
          id: createJobId("check"),
          permissions: {
            checks: undefined,
          },
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError(
        'unsupported workflow permissions value "contents: undefined". Expected: one of read, write, none'
      )
    );
  });

  it("fails explicitly before emission when permissions mix shorthand with object-map entries", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("mixed_permissions"),
      name: "Mixed Permissions",
      on: [
        {
          type: "push",
        },
      ],
      permissions: {
        contents: "read",
        "read-all": "write",
      },
      jobs: [
        {
          id: createJobId("check"),
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError(
        "unsupported workflow permissions shape: cannot mix shorthand with object-map entries"
      )
    );
  });

  it("fails explicitly before emission when workflow_dispatch has unsupported fields", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("unsupported_dispatch"),
      name: "Unsupported Dispatch",
      on: [
        {
          type: "workflow_dispatch",
          branches: ["main"],
        },
      ],
      jobs: [
        {
          id: createJobId("test"),
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition & {
      on: Array<
        | WorkflowDefinition["on"][number]
        | {
            type: "workflow_dispatch";
            branches: string[];
          }
      >;
    };

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError('unsupported trigger "workflow_dispatch" field "branches"')
    );
  });

  it("fails explicitly before emission when schedule has unsupported fields", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("unsupported_schedule"),
      name: "Unsupported Schedule",
      on: [
        {
          type: "schedule",
          cron: ["0 0 * * *"],
          timezone: "UTC",
        },
      ],
      jobs: [
        {
          id: createJobId("test"),
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported trigger "schedule" field "timezone"'));
  });

  it("fails explicitly before emission when a job has unsupported fields", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("unsupported_job"),
      name: "Unsupported Job",
      on: [
        {
          type: "push",
        },
      ],
      jobs: [
        {
          id: createJobId("build"),
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun run build",
            },
          ],
          unsupportedField: true,
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported job "build" field "unsupportedField"'));
  });

  it("fails explicitly before emission when execution metadata uses unsupported shapes", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("unsupported_execution_metadata"),
      name: "Unsupported Execution Metadata",
      on: [
        {
          type: "push",
        },
      ],
      jobs: [
        {
          id: createJobId("check"),
          timeoutMinutes: 15,
          defaults: {
            run: {
              shell: "bash",
              env: {
                CI: "true",
              },
            },
          },
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "uses",
              uses: "actions/checkout@v4",
              shell: "bash",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported defaults.run field "env"'));
  });

  it("fails explicitly before emission when concurrency uses unsupported shapes", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("unsupported_concurrency"),
      name: "Unsupported Concurrency",
      on: [
        {
          type: "push",
        },
      ],
      concurrency: {
        group: "deploy",
        mode: "replace",
      },
      jobs: [
        {
          id: createJobId("check"),
          concurrency: {
            group: "check",
            cancelInProgress: "yes",
          },
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported workflow concurrency field "mode"'));
  });

  it("fails explicitly before emission when concurrency uses invalid values", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("invalid_concurrency"),
      name: "Invalid Concurrency",
      on: [
        {
          type: "push",
        },
      ],
      concurrency: {
        group: " ",
      },
      jobs: [
        {
          id: createJobId("check"),
          concurrency: {
            group: "check",
            cancelInProgress: "yes",
          },
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError(
        'unsupported workflow concurrency value "group:  ". Expected: a non-blank string'
      )
    );
  });

  it("fails explicitly before emission when job concurrency cancelInProgress is not a boolean", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("invalid_job_concurrency_cancel"),
      name: "Invalid Job Concurrency Cancel",
      on: [
        {
          type: "push",
        },
      ],
      jobs: [
        {
          id: createJobId("check"),
          concurrency: {
            group: "check",
            cancelInProgress: "yes",
          },
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError('unsupported job "check" concurrency value "cancelInProgress: yes"')
    );
  });

  it("fails explicitly before emission when execution metadata leaves defaults.run empty", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("empty_defaults_run"),
      name: "Empty Defaults Run",
      on: [
        {
          type: "push",
        },
      ],
      jobs: [
        {
          id: createJobId("check"),
          defaults: {
            run: {},
          },
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError(
        "defaults.run must define shell or working-directory. Expected: at least one of shell or working-directory"
      )
    );
  });

  it("fails explicitly before emission when workflow-level defaults.run is empty", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("empty_workflow_defaults_run"),
      name: "Empty Workflow Defaults Run",
      on: [
        {
          type: "push",
        },
      ],
      defaults: {
        run: {},
      },
      jobs: [
        {
          id: createJobId("check"),
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError(
        "defaults.run must define shell or working-directory. Expected: at least one of shell or working-directory"
      )
    );
  });

  it("fails explicitly before emission when permissions shorthand is invalid", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("invalid_permissions_shorthand"),
      name: "Invalid Permissions Shorthand",
      on: [
        {
          type: "push",
        },
      ],
      permissions: "admin-all",
      jobs: [
        {
          id: createJobId("check"),
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError(
        'unsupported workflow permissions shorthand "admin-all". Expected: "read-all" or "write-all"'
      )
    );
  });

  it("fails explicitly before emission when uses steps receive run-only execution metadata", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("uses_step_shell"),
      name: "Uses Step Shell",
      on: [
        {
          type: "push",
        },
      ],
      jobs: [
        {
          id: createJobId("check"),
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "uses",
              uses: "actions/checkout@v4",
              shell: "bash",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported step "uses" field "shell"'));
  });

  it("fails explicitly before emission when a job strategy has unsupported fields", () => {
    const unsupportedWorkflow = {
      id: createWorkflowId("unsupported_strategy"),
      name: "Unsupported Strategy",
      on: [
        {
          type: "push",
        },
      ],
      jobs: [
        {
          id: createJobId("test"),
          strategy: {
            matrix: {
              node: ["18", "20"],
            },
            customField: true,
          },
          runsOn: "ubuntu-latest",
          steps: [
            {
              kind: "run",
              run: "bun test",
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported job strategy field "customField"'));
  });

  it("renders workflow-level env after permissions and before concurrency", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("workflow_env"),
      name: "Workflow Env",
    })
      .onPush()
      .permissions({
        contents: "read",
      })
      .defaultsRun({
        shell: "bash",
      })
      .env({
        CI: "true",
        NODE_ENV: "production",
      })
      .concurrency({
        group: "deploy",
      })
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run build");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: "Workflow Env",
      on: {
        push: null,
      },
      permissions: {
        contents: "read",
      },
      defaults: {
        run: {
          shell: "bash",
        },
      },
      env: {
        CI: "true",
        NODE_ENV: "production",
      },
      concurrency: {
        group: "deploy",
      },
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun run build",
            },
          ],
        },
      },
    });
    const topKeys = Object.keys(payload);
    expect(topKeys.indexOf("permissions")).toBeLessThan(topKeys.indexOf("defaults"));
    expect(topKeys.indexOf("defaults")).toBeLessThan(topKeys.indexOf("env"));
    expect(topKeys.indexOf("env")).toBeLessThan(topKeys.indexOf("concurrency"));
  });

  it("renders job-level env after concurrency and before strategy", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("job_env"),
      name: "Job Env",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job
          .concurrency({
            group: "build-${{ github.ref }}",
          })
          .env({
            NODE_ENV: "test",
          })
          .strategyMatrix({
            os: ["ubuntu-latest", "windows-latest"],
          })
          .runsOn("${{ matrix.os }}")
          .run("bun run build");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: "Job Env",
      on: {
        push: null,
      },
      jobs: {
        build: {
          concurrency: {
            group: "build-${{ github.ref }}",
          },
          env: {
            NODE_ENV: "test",
          },
          strategy: {
            matrix: {
              os: ["ubuntu-latest", "windows-latest"],
            },
          },
          "runs-on": "${{ matrix.os }}",
          steps: [
            {
              run: "bun run build",
            },
          ],
        },
      },
    });
    const jobKeys = Object.keys(payload.jobs.build!);
    expect(jobKeys.indexOf("concurrency")).toBeLessThan(jobKeys.indexOf("env"));
    expect(jobKeys.indexOf("env")).toBeLessThan(jobKeys.indexOf("strategy"));
  });

  it("omits empty env maps from the rendered payload", () => {
    const workflowWithEmptyEnv = {
      id: createWorkflowId("empty_env"),
      name: "Empty Env",
      on: [{ type: "push" as const }],
      env: {},
      jobs: [
        {
          id: createJobId("build"),
          env: {},
          runsOn: "ubuntu-latest" as const,
          steps: [{ kind: "run" as const, run: "bun run build" }],
        },
      ],
    } as unknown as WorkflowDefinition;

    const payload = createWorkflowRenderPayload(workflowWithEmptyEnv);

    expect(payload.env).toBeUndefined();
    expect(payload.jobs.build!.env).toBeUndefined();
  });

  it("preserves canonical field ordering when env is present with other features", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("full_env"),
      name: "Full Env",
    })
      .onPush()
      .permissions({ contents: "read" })
      .defaultsRun({ shell: "bash" })
      .env({ CI: "true" })
      .concurrency({ group: "deploy", cancelInProgress: true })
      .addJob(createJobId("build"), (job) => {
        job
          .permissions({ checks: "write" })
          .timeoutMinutes(30)
          .concurrency({ group: "build" })
          .env({ NODE_ENV: "production" })
          .strategyMatrix({ os: ["ubuntu-latest"] })
          .runsOn("${{ matrix.os }}")
          .run("bun run build");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    const topKeys = Object.keys(payload);
    expect(topKeys).toEqual([
      "name",
      "on",
      "permissions",
      "defaults",
      "env",
      "concurrency",
      "jobs",
    ]);

    const jobKeys = Object.keys(payload.jobs.build!);
    expect(jobKeys).toEqual([
      "permissions",
      "timeout-minutes",
      "concurrency",
      "env",
      "strategy",
      "runs-on",
      "steps",
    ]);

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders combined workflow-level and job-level env correctly", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("combined_env"),
      name: "Combined Env",
    })
      .onPush()
      .env({
        CI: "true",
      })
      .addJob(createJobId("lint"), (job) => {
        job.env({ NODE_ENV: "test" }).runsOn("ubuntu-latest").run("bun run lint");
      })
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run build");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload.env).toEqual({ CI: "true" });
    expect(payload.jobs.lint!.env).toEqual({ NODE_ENV: "test" });
    expect(payload.jobs.build!.env).toBeUndefined();
  });

  it("renders pull_request trigger with types deterministically", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("pr_types"),
      name: "PR Types",
    })
      .onPullRequest({
        branches: ["main"],
        types: ["opened", "synchronize", "reopened"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: "PR Types",
      on: {
        pull_request: {
          branches: ["main"],
          types: ["opened", "synchronize", "reopened"],
        },
      },
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders pull_request types alongside branches and paths", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("pr_full_filter"),
      name: "PR Full Filter",
    })
      .onPush({
        branches: ["main"],
      })
      .onPullRequest({
        branches: ["main", "release/**"],
        paths: ["packages/**"],
        types: ["opened", "labeled", "closed"],
      })
      .addJob(createJobId("check"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run check");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload.on.pull_request).toEqual({
      branches: ["main", "release/**"],
      paths: ["packages/**"],
      types: ["opened", "labeled", "closed"],
    });
    expect(Object.keys(payload.on)).toEqual(["push", "pull_request"]);
  });

  it("renders push trigger with branches-ignore deterministically", () => {
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

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: "Push Branches Ignore",
      on: {
        push: {
          "branches-ignore": ["dependabot/**", "renovate/**"],
        },
      },
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders push trigger with tags deterministically", () => {
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

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: "Push Tags",
      on: {
        push: {
          tags: ["v*", "release-*"],
        },
      },
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it("renders trigger payload fields in canonical order with all filter types", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("push_all_negation"),
      name: "Push All Negation",
    })
      .onPush({
        branchesIgnore: ["dependabot/**"],
        pathsIgnore: ["docs/**"],
        tagsIgnore: ["v*-beta"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const triggerKeys = Object.keys(payload.on.push!);

    expect(triggerKeys).toEqual(["branches-ignore", "paths-ignore", "tags-ignore"]);
  });

  it("renders pull_request with branches-ignore and paths-ignore", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("pr_negation_filters"),
      name: "PR Negation Filters",
    })
      .onPullRequest({
        branchesIgnore: ["dependabot/**"],
        pathsIgnore: ["docs/**", "*.md"],
        types: ["opened", "synchronize"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: "PR Negation Filters",
      on: {
        pull_request: {
          "branches-ignore": ["dependabot/**"],
          "paths-ignore": ["docs/**", "*.md"],
          types: ["opened", "synchronize"],
        },
      },
      jobs: {
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            {
              run: "bun test",
            },
          ],
        },
      },
    });

    const triggerKeys = Object.keys(payload.on.pull_request!);
    expect(triggerKeys).toEqual(["branches-ignore", "paths-ignore", "types"]);
  });

  it("renders trigger payload fields in canonical order: branches, paths, types", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("pr_field_order"),
      name: "PR Field Order",
    })
      .onPullRequest({
        branches: ["main"],
        paths: ["src/**"],
        types: ["opened", "synchronize"],
      })
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("bun test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const triggerKeys = Object.keys(payload.on.pull_request!);

    expect(triggerKeys).toEqual(["branches", "paths", "types"]);
  });

  describe("step identifiers and job outputs rendering", () => {
    it("renders run step id after name and before if in payload", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("render_run_step_id"),
        name: "Render Run Step ID",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").run("echo building", {
            name: "Build",
            id: "build",
            if: "success()",
          });
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const stepPayload = payload.jobs.build!.steps![0]!;
      const stepKeys = Object.keys(stepPayload);

      expect(stepPayload).toEqual({
        name: "Build",
        id: "build",
        if: "success()",
        run: "echo building",
      });
      expect(stepKeys.indexOf("name")).toBeLessThan(stepKeys.indexOf("id"));
      expect(stepKeys.indexOf("id")).toBeLessThan(stepKeys.indexOf("if"));
    });

    it("renders uses step id in payload", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("render_uses_step_id"),
        name: "Render Uses Step ID",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").uses("actions/checkout@v4", {
            name: "Checkout",
            id: "checkout",
          });
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const stepPayload = payload.jobs.build!.steps![0]!;
      const stepKeys = Object.keys(stepPayload);

      expect(stepPayload).toEqual({
        name: "Checkout",
        id: "checkout",
        uses: "actions/checkout@v4",
      });
      expect(stepKeys.indexOf("name")).toBeLessThan(stepKeys.indexOf("id"));
    });

    it("does not include id in step payload when id is not set", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("no_step_id_render"),
        name: "No Step ID Render",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job.runsOn("ubuntu-latest").run("echo hello");
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const stepPayload = payload.jobs.build!.steps![0]!;

      expect(stepPayload).not.toHaveProperty("id");
    });

    it("renders job outputs after runs-on and before steps", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("render_job_outputs"),
        name: "Render Job Outputs",
      })
        .onPush()
        .addJob(createJobId("build"), (job) => {
          job
            .runsOn("ubuntu-latest")
            .outputs({
              artifact: "${{ steps.upload.outputs.artifact-url }}",
            })
            .run("echo building", { id: "upload" });
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const jobPayload = payload.jobs.build!;
      const jobKeys = Object.keys(jobPayload);

      expect(jobPayload.outputs).toEqual({
        artifact: "${{ steps.upload.outputs.artifact-url }}",
      });
      expect(jobKeys.indexOf("runs-on")).toBeLessThan(jobKeys.indexOf("outputs"));
      expect(jobKeys.indexOf("outputs")).toBeLessThan(jobKeys.indexOf("steps"));
    });
  });

  describe("strategy completion — fail-fast, max-parallel, matrix include/exclude", () => {
    it("renders strategy with fail-fast, max-parallel, include, and exclude", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("strategy-full"),
        name: "Strategy Full",
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

      const payload = createWorkflowRenderPayload(workflow);
      const strategy = payload.jobs.test!.strategy!;

      expect(strategy["fail-fast"]).toBe(false);
      expect(strategy["max-parallel"]).toBe(2);
      expect(strategy.matrix.os).toEqual(["ubuntu-latest", "windows-latest"]);
      expect(strategy.matrix.node).toEqual(["18", "20"]);
      expect(strategy.matrix.include).toEqual([
        { os: "macos-latest", node: "22", experimental: "true" },
      ]);
      expect(strategy.matrix.exclude).toEqual([{ os: "windows-latest", node: "18" }]);

      const json = renderWorkflow(workflow, emitPseudoYaml);
      const failFastIdx = json.indexOf('"fail-fast"');
      const maxParallelIdx = json.indexOf('"max-parallel"');
      const matrixIdx = json.indexOf('"matrix"');
      expect(failFastIdx).toBeLessThan(maxParallelIdx);
      expect(maxParallelIdx).toBeLessThan(matrixIdx);
    });

    it("omits empty include and exclude from strategy payload", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("strategy-empty-inc-exc"),
        name: "Strategy Empty IncExc",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({ os: ["ubuntu-latest"] })
            .strategyInclude([])
            .strategyExclude([])
            .runsOn("${{ matrix.os }}")
            .run("bun test");
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const matrix = payload.jobs.test!.strategy!.matrix;

      expect(matrix.os).toEqual(["ubuntu-latest"]);
      expect("include" in matrix).toBe(false);
      expect("exclude" in matrix).toBe(false);
    });

    it("renders strategy with fail-fast only", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("strategy-ff-only"),
        name: "Strategy FailFast Only",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({ os: ["ubuntu-latest"] })
            .strategyFailFast(true)
            .runsOn("${{ matrix.os }}")
            .run("bun test");
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const strategy = payload.jobs.test!.strategy!;

      expect(strategy["fail-fast"]).toBe(true);
      expect("max-parallel" in strategy).toBe(false);
    });

    it("renders strategy with max-parallel only", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("strategy-mp-only"),
        name: "Strategy MaxParallel Only",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({ os: ["ubuntu-latest"] })
            .strategyMaxParallel(3)
            .runsOn("${{ matrix.os }}")
            .run("bun test");
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const strategy = payload.jobs.test!.strategy!;

      expect(strategy["max-parallel"]).toBe(3);
      expect("fail-fast" in strategy).toBe(false);
    });

    it("renders strategy with include containing arbitrary keys not in matrix axes", () => {
      const workflow = defineWorkflow({
        id: createWorkflowId("strategy-arb-keys"),
        name: "Strategy Arbitrary Keys",
      })
        .onPush()
        .addJob(createJobId("test"), (job) => {
          job
            .strategyMatrix({ os: ["ubuntu-latest"] })
            .strategyInclude([{ os: "macos-latest", custom_key: "value" }])
            .runsOn("${{ matrix.os }}")
            .run("bun test");
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const include = payload.jobs.test!.strategy!.matrix.include as readonly Record<
        string,
        string
      >[];

      expect(include).toHaveLength(1);
      expect(include[0]!.os).toBe("macos-latest");
      expect(include[0]!.custom_key).toBe("value");
    });
  });

  it("renders step continue-on-error and timeout-minutes in canonical position", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("render_step_continue_timeout"),
      name: "Render Step Continue Timeout",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").run("bun run lint", {
          continueOnError: true,
          timeoutMinutes: 15,
          workingDirectory: "./src",
        });
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const stepPayload = payload.jobs.build!.steps![0]!;
    const stepKeys = Object.keys(stepPayload);

    expect(stepPayload["continue-on-error"]).toBe(true);
    expect(stepPayload["timeout-minutes"]).toBe(15);
    expect(stepPayload["working-directory"]).toBe("./src");

    expect(stepKeys.indexOf("working-directory")).toBeLessThan(
      stepKeys.indexOf("continue-on-error")
    );
    expect(stepKeys.indexOf("continue-on-error")).toBeLessThan(stepKeys.indexOf("timeout-minutes"));
    expect(stepKeys.indexOf("timeout-minutes")).toBeLessThan(stepKeys.indexOf("run"));
  });

  it("renders uses step with continue-on-error and timeout-minutes", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("render_uses_continue_timeout"),
      name: "Render Uses Continue Timeout",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").uses("actions/checkout@v4", {
          continueOnError: false,
          timeoutMinutes: 5,
        });
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const stepPayload = payload.jobs.build!.steps![0]!;

    expect(stepPayload["continue-on-error"]).toBe(false);
    expect(stepPayload["timeout-minutes"]).toBe(5);
  });

  it("renders uses steps with if and env metadata", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("render_uses_if_env"),
      name: "Render Uses If Env",
    })
      .onPush()
      .addJob(createJobId("build"), (job) => {
        job.runsOn("ubuntu-latest").uses("actions/checkout@v4", {
          if: "success()",
          env: {
            CI: "true",
          },
        });
      })
      .build();

    expect(createWorkflowRenderPayload(workflow).jobs.build!.steps![0]).toEqual({
      if: "success()",
      env: {
        CI: "true",
      },
      uses: "actions/checkout@v4",
    });
  });

  it("renders reusable workflow jobs in canonical field order", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("reusable_job_render"),
      name: "Reusable Job Render",
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
          .permissions("read-all")
          .usesWorkflow("./.github/workflows/deploy.yml@main", {
            secrets: "inherit",
            with: {
              environment: "production",
            },
          });
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const deployJob = payload.jobs.deploy!;

    expect(deployJob).toEqual({
      if: "github.ref == 'refs/heads/main'",
      needs: ["build"],
      "continue-on-error": true,
      permissions: "read-all",
      secrets: "inherit",
      with: {
        environment: "production",
      },
      uses: "./.github/workflows/deploy.yml@main",
    });
    expect(Object.keys(deployJob)).toEqual([
      "if",
      "needs",
      "continue-on-error",
      "permissions",
      "secrets",
      "with",
      "uses",
    ]);
  });

  it("renders reusable workflow jobs with explicit secret maps", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("reusable_job_secret_map"),
      name: "Reusable Job Secret Map",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.usesWorkflow("./.github/workflows/deploy.yml@main", {
          secrets: {
            token: "${{ secrets.GITHUB_TOKEN }}",
          },
        });
      })
      .build();

    expect(createWorkflowRenderPayload(workflow).jobs.deploy).toEqual({
      secrets: {
        token: "${{ secrets.GITHUB_TOKEN }}",
      },
      uses: "./.github/workflows/deploy.yml@main",
    });
  });

  it("renders reusable workflow jobs without secrets", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("reusable_job_without_secrets"),
      name: "Reusable Job Without Secrets",
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

    expect(createWorkflowRenderPayload(workflow).jobs.deploy).toEqual({
      with: {
        environment: "production",
      },
      uses: "./.github/workflows/deploy.yml@main",
    });
  });

  it("renders container in canonical field order after runs-on", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("container_order"),
      name: "Container Order",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .container({
            image: "node:20",
            credentials: { username: "user", password: "pass" },
            env: { CI: "true" },
            ports: [80, "8080:80"],
            volumes: ["/data:/data"],
            options: "--cpus 2",
          })
          .run("npm test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const jobPayload = payload.jobs.test!;
    const keys = Object.keys(jobPayload);
    const runsOnIndex = keys.indexOf("runs-on");
    const containerIndex = keys.indexOf("container");
    const stepsIndex = keys.indexOf("steps");

    expect(containerIndex).toBeGreaterThan(runsOnIndex);
    expect(containerIndex).toBeLessThan(stepsIndex);

    expect(jobPayload.container).toEqual({
      image: "node:20",
      credentials: { username: "user", password: "pass" },
      env: { CI: "true" },
      ports: [80, "8080:80"],
      volumes: ["/data:/data"],
      options: "--cpus 2",
    });
  });

  it("renders services in canonical field order after container", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("services_order"),
      name: "Services Order",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .container({ image: "node:20" })
          .services({
            postgres: {
              image: "postgres:15",
              env: { POSTGRES_PASSWORD: "test" },
              ports: [5432],
            },
            redis: {
              image: "redis:7",
            },
          })
          .run("npm test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const jobPayload = payload.jobs.test!;
    const keys = Object.keys(jobPayload);
    const containerIndex = keys.indexOf("container");
    const servicesIndex = keys.indexOf("services");
    const stepsIndex = keys.indexOf("steps");

    expect(servicesIndex).toBeGreaterThan(containerIndex);
    expect(servicesIndex).toBeLessThan(stepsIndex);

    expect(jobPayload.services).toEqual({
      postgres: {
        image: "postgres:15",
        env: { POSTGRES_PASSWORD: "test" },
        ports: [5432],
      },
      redis: {
        image: "redis:7",
      },
    });
  });

  it("renders container image only without optional fields", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("container_minimal"),
      name: "Container Minimal",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").container({ image: "node:20" }).run("npm test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    expect(payload.jobs.test!.container).toEqual({ image: "node:20" });
  });

  it("omits container and services when not defined", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("no_container"),
      name: "No Container",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job.runsOn("ubuntu-latest").run("npm test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    expect(payload.jobs.test!.container).toBeUndefined();
    expect(payload.jobs.test!.services).toBeUndefined();
  });

  it("renders container fields in canonical order: image, credentials, env, ports, volumes, options", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("container_field_order"),
      name: "Container Field Order",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .container({
            image: "node:20",
            credentials: { username: "user", password: "pass" },
            env: { CI: "true" },
            ports: [80],
            volumes: ["/data:/data"],
            options: "--cpus 2",
          })
          .run("npm test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const containerKeys = Object.keys(payload.jobs.test!.container!);
    expect(containerKeys).toEqual(["image", "credentials", "env", "ports", "volumes", "options"]);
  });

  it("renders credentials fields in canonical order: username, password", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("credentials_order"),
      name: "Credentials Order",
    })
      .onPush()
      .addJob(createJobId("test"), (job) => {
        job
          .runsOn("ubuntu-latest")
          .container({
            image: "node:20",
            credentials: { username: "user", password: "pass" },
          })
          .run("npm test");
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const credKeys = Object.keys(payload.jobs.test!.container!.credentials!);
    expect(credKeys).toEqual(["username", "password"]);
  });

  it("renders a script reference step without shell as a plain run step", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.runsOn("ubuntu-latest").runScript({ path: "./scripts/deploy.sh" });
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const step = payload.jobs.deploy!.steps![0]!;
    expect(step).toEqual({ run: "./scripts/deploy.sh" });
  });

  it("renders a script reference step with shell prefix in run value", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.runsOn("ubuntu-latest").runScript({ path: "./scripts/deploy.sh", shell: "bash" });
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const step = payload.jobs.deploy!.steps![0]!;
    expect(step).toEqual({ run: "bash ./scripts/deploy.sh" });
  });

  it("renders a script reference step with metadata shell as step-level shell", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.runsOn("ubuntu-latest").runScript({ path: "./scripts/deploy.sh" }, { shell: "bash" });
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const step = payload.jobs.deploy!.steps![0]!;
    expect(step).toEqual({ shell: "bash", run: "./scripts/deploy.sh" });
  });

  it("renders a script reference step with expand mode", () => {
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

    const payload = createWorkflowRenderPayload(workflow);
    const step = payload.jobs.deploy!.steps![0]!;
    expect(step.shell).toBe("bash");
    expect(step.run).toContain('echo "Hello from script"');
  });

  it("renders a script reference step preserving metadata and field order", () => {
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
            workingDirectory: "./app",
          }
        );
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const step = payload.jobs.deploy!.steps![0]!;
    expect(step.name).toBe("Deploy");
    expect(step.id).toBe("deploy_step");
    expect(step.env).toEqual({ NODE_ENV: "production" });
    expect(step["working-directory"]).toBe("./app");
    expect(step.run).toBe("bash ./scripts/deploy.sh");

    const keys = Object.keys(step);
    expect(keys).toEqual(["name", "id", "env", "working-directory", "run"]);
  });

  it("does not emit scriptReference into the render payload", () => {
    const workflow = defineWorkflow({
      id: createWorkflowId("ci"),
      name: "CI",
    })
      .onPush()
      .addJob(createJobId("deploy"), (job) => {
        job.runsOn("ubuntu-latest").runScript({ path: "./deploy.sh", shell: "bash" });
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const step = payload.jobs.deploy!.steps![0]!;
    expect(step).not.toHaveProperty("scriptReference");
  });
});
