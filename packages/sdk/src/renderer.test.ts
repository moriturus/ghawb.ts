import { describe, expect, it } from 'vitest';

import { createJobId, createWorkflowId } from '@ghawb/shared';

import type { WorkflowDefinition, WorkflowRenderPayload } from './index.ts';
import {
  WorkflowRenderError,
  createWorkflowRenderPayload,
  defineWorkflow,
  renderWorkflow,
} from './index.ts';

function emitPseudoYaml(payload: WorkflowRenderPayload): string {
  return JSON.stringify(payload, null, 2);
}

describe('workflow renderer', () => {
  it('creates a deterministic intermediate payload for representative workflows', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('ci'),
      name: 'CI',
    })
      .onPullRequest({
        branches: ['main'],
      })
      .onPush({
        branches: ['main'],
        paths: ['packages/**'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn(['ubuntu-latest', 'self-hosted']).uses('actions/checkout@v4', {
          name: 'Checkout',
        });
      })
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint', {
          env: {
            CI: 'true',
          },
          with: {
            coverage: 'true',
          },
          if: "github.event_name == 'push'",
          name: 'Lint',
        });
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: 'CI',
      on: {
        push: {
          branches: ['main'],
          paths: ['packages/**'],
        },
        pull_request: {
          branches: ['main'],
        },
      },
      jobs: {
        test: {
          'runs-on': ['ubuntu-latest', 'self-hosted'],
          steps: [
            {
              name: 'Checkout',
              uses: 'actions/checkout@v4',
            },
          ],
        },
        lint: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Lint',
              if: "github.event_name == 'push'",
              env: {
                CI: 'true',
              },
              with: {
                coverage: 'true',
              },
              run: 'bun run lint',
            },
          ],
        },
      },
    });
  });

  it('renders workflow_dispatch in canonical trigger order', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('manual'),
      name: 'Manual',
    })
      .onWorkflowDispatch()
      .onPush({
        branches: ['main'],
      })
      .onPullRequest({
        branches: ['main'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'Manual',
      on: {
        push: {
          branches: ['main'],
        },
        pull_request: {
          branches: ['main'],
        },
        workflow_dispatch: null,
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });
    expect(Object.keys(payload.on)).toEqual(['push', 'pull_request', 'workflow_dispatch']);
  });

  it('renders schedule in canonical trigger order after workflow_dispatch', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('nightly'),
      name: 'Nightly',
    })
      .onSchedule(['0 0 * * *', '30 12 * * 1-5'])
      .onWorkflowDispatch()
      .onPush({
        branches: ['main'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'Nightly',
      on: {
        push: {
          branches: ['main'],
        },
        workflow_dispatch: null,
        schedule: [{ cron: '0 0 * * *' }, { cron: '30 12 * * 1-5' }],
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });
    expect(Object.keys(payload.on)).toEqual(['push', 'workflow_dispatch', 'schedule']);
  });

  it('renders identical output across repeated runs with the same emitter', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('repeatable'),
      name: 'Repeatable',
    })
      .onPush()
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('renders workflow_dispatch deterministically as a null-payload trigger', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('manual'),
      name: 'Manual',
    })
      .onWorkflowDispatch()
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: 'Manual',
      on: {
        workflow_dispatch: null,
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });
  });

  it('renders schedule deterministically as an ordered cron-entry array', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('nightly'),
      name: 'Nightly',
    })
      .onSchedule(['0 0 * * *', '30 12 * * 1-5'])
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: 'Nightly',
      on: {
        schedule: [{ cron: '0 0 * * *' }, { cron: '30 12 * * 1-5' }],
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });
  });

  it('renders job needs in declared dependency order', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('pipeline'),
      name: 'Pipeline',
    })
      .onPush()
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run build');
      })
      .addJob(createJobId('test'), (job) => {
        job.needs(createJobId('build')).runsOn('ubuntu-latest').run('bun test');
      })
      .addJob(createJobId('deploy'), (job) => {
        job
          .needs([createJobId('build'), createJobId('test')])
          .runsOn('ubuntu-latest')
          .run('bun run deploy');
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: 'Pipeline',
      on: {
        push: null,
      },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun run build',
            },
          ],
        },
        test: {
          needs: ['build'],
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
        deploy: {
          needs: ['build', 'test'],
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun run deploy',
            },
          ],
        },
      },
    });
  });

  it('renders strategy matrices deterministically', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('matrix'),
      name: 'Matrix',
    })
      .onPush()
      .addJob(createJobId('test'), (job) => {
        job
          .strategyMatrix({
            os: ['ubuntu-latest', 'windows-latest'],
            node: ['18', '20'],
          })
          .runsOn('${{ matrix.os }}')
          .run('bun test');
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: 'Matrix',
      on: {
        push: null,
      },
      jobs: {
        test: {
          strategy: {
            matrix: {
              os: ['ubuntu-latest', 'windows-latest'],
              node: ['18', '20'],
            },
          },
          'runs-on': '${{ matrix.os }}',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('renders workflow-level and job-level permissions deterministically', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('permissions'),
      name: 'Permissions',
    })
      .onPush()
      .permissions({
        contents: 'read',
        actions: 'write',
        'pull-requests': 'none',
      })
      .addJob(createJobId('check'), (job) => {
        job
          .permissions({
            models: 'read',
            checks: 'write',
            'id-token': 'write',
          })
          .runsOn('ubuntu-latest')
          .run('bun test');
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: 'Permissions',
      on: {
        push: null,
      },
      permissions: {
        actions: 'write',
        contents: 'read',
        'pull-requests': 'none',
      },
      jobs: {
        check: {
          permissions: {
            checks: 'write',
            'id-token': 'write',
            models: 'read',
          },
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('renders execution environment metadata deterministically', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('execution_metadata'),
      name: 'Execution Metadata',
    })
      .onPush()
      .addJob(createJobId('check'), (job) => {
        job
          .timeoutMinutes(15)
          .defaultsRun({
            shell: 'bash',
            workingDirectory: './packages/sdk',
          })
          .runsOn('ubuntu-latest')
          .run('bun test', {
            shell: 'sh',
            workingDirectory: './packages/sdk',
          });
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: 'Execution Metadata',
      on: {
        push: null,
      },
      jobs: {
        check: {
          'timeout-minutes': 15,
          defaults: {
            run: {
              shell: 'bash',
              'working-directory': './packages/sdk',
            },
          },
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              shell: 'sh',
              'working-directory': './packages/sdk',
              run: 'bun test',
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('renders workflow-level and job-level concurrency deterministically', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('concurrency'),
      name: 'Concurrency',
    })
      .onPush()
      .concurrency({
        group: 'deploy',
        cancelInProgress: true,
      })
      .addJob(createJobId('check'), (job) => {
        job
          .concurrency({
            group: 'check-${{ github.ref }}',
          })
          .runsOn('ubuntu-latest')
          .run('bun test');
      })
      .build();

    expect(createWorkflowRenderPayload(workflow)).toEqual({
      name: 'Concurrency',
      on: {
        push: null,
      },
      concurrency: {
        group: 'deploy',
        'cancel-in-progress': true,
      },
      jobs: {
        check: {
          concurrency: {
            group: 'check-${{ github.ref }}',
          },
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });
    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('fails explicitly before emission when unsupported workflow fields are present', () => {
    let emitterCalls = 0;

    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported'),
      name: 'Unsupported',
      on: [
        {
          type: 'push',
        },
      ],
      jobs: [
        {
          id: createJobId('test'),
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
      defaults: {
        run: {
          shell: 'bash',
        },
      },
    } as WorkflowDefinition & {
      defaults: {
        run: {
          shell: string;
        };
      };
    };

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => {
        emitterCalls += 1;
        return emitPseudoYaml(payload);
      })
    ).toThrowError(new WorkflowRenderError('unsupported workflow field "defaults"'));
    expect(emitterCalls).toBe(0);
  });

  it('fails explicitly before emission when permissions contain unsupported keys or values', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported_permissions'),
      name: 'Unsupported Permissions',
      on: [
        {
          type: 'push',
        },
      ],
      permissions: {
        unknown: 'read',
      },
      jobs: [
        {
          id: createJobId('check'),
          permissions: {
            models: 'write',
          },
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported workflow permissions key "unknown"'));
  });

  it('fails explicitly before emission when permissions contain undefined values', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('undefined_permissions'),
      name: 'Undefined Permissions',
      on: [
        {
          type: 'push',
        },
      ],
      permissions: {
        contents: undefined,
      },
      jobs: [
        {
          id: createJobId('check'),
          permissions: {
            checks: undefined,
          },
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError('unsupported workflow permissions value "contents: undefined"')
    );
  });

  it('fails explicitly before emission when workflow_dispatch has unsupported fields', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported_dispatch'),
      name: 'Unsupported Dispatch',
      on: [
        {
          type: 'workflow_dispatch',
          inputs: {
            environment: {
              required: true,
            },
          },
        },
      ],
      jobs: [
        {
          id: createJobId('test'),
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition & {
      on: Array<
        | WorkflowDefinition['on'][number]
        | {
            type: 'workflow_dispatch';
            inputs: {
              environment: {
                required: boolean;
              };
            };
          }
      >;
    };

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(
      new WorkflowRenderError('unsupported trigger "workflow_dispatch" field "inputs"')
    );
  });

  it('fails explicitly before emission when schedule has unsupported fields', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported_schedule'),
      name: 'Unsupported Schedule',
      on: [
        {
          type: 'schedule',
          cron: ['0 0 * * *'],
          timezone: 'UTC',
        },
      ],
      jobs: [
        {
          id: createJobId('test'),
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported trigger "schedule" field "timezone"'));
  });

  it('fails explicitly before emission when a job has unsupported fields', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported_job'),
      name: 'Unsupported Job',
      on: [
        {
          type: 'push',
        },
      ],
      jobs: [
        {
          id: createJobId('build'),
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun run build',
            },
          ],
          container: {
            image: 'node:20',
          },
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported job "build" field "container"'));
  });

  it('fails explicitly before emission when execution metadata uses unsupported shapes', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported_execution_metadata'),
      name: 'Unsupported Execution Metadata',
      on: [
        {
          type: 'push',
        },
      ],
      jobs: [
        {
          id: createJobId('check'),
          timeoutMinutes: 15,
          defaults: {
            run: {
              shell: 'bash',
              env: {
                CI: 'true',
              },
            },
          },
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'uses',
              uses: 'actions/checkout@v4',
              shell: 'bash',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported defaults.run field "env"'));
  });

  it('fails explicitly before emission when concurrency uses unsupported shapes', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported_concurrency'),
      name: 'Unsupported Concurrency',
      on: [
        {
          type: 'push',
        },
      ],
      concurrency: {
        group: 'deploy',
        mode: 'replace',
      },
      jobs: [
        {
          id: createJobId('check'),
          concurrency: {
            group: 'check',
            cancelInProgress: 'yes',
          },
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported workflow concurrency field "mode"'));
  });

  it('fails explicitly before emission when concurrency uses invalid values', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('invalid_concurrency'),
      name: 'Invalid Concurrency',
      on: [
        {
          type: 'push',
        },
      ],
      concurrency: {
        group: ' ',
      },
      jobs: [
        {
          id: createJobId('check'),
          concurrency: {
            group: 'check',
            cancelInProgress: 'yes',
          },
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported workflow concurrency value "group:  "'));
  });

  it('fails explicitly before emission when execution metadata leaves defaults.run empty', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('empty_defaults_run'),
      name: 'Empty Defaults Run',
      on: [
        {
          type: 'push',
        },
      ],
      jobs: [
        {
          id: createJobId('check'),
          defaults: {
            run: {},
          },
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('defaults.run must define shell or working-directory'));
  });

  it('fails explicitly before emission when uses steps receive run-only execution metadata', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('uses_step_shell'),
      name: 'Uses Step Shell',
      on: [
        {
          type: 'push',
        },
      ],
      jobs: [
        {
          id: createJobId('check'),
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'uses',
              uses: 'actions/checkout@v4',
              shell: 'bash',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported step "uses" field "shell"'));
  });

  it('fails explicitly before emission when a job strategy has unsupported fields', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported_strategy'),
      name: 'Unsupported Strategy',
      on: [
        {
          type: 'push',
        },
      ],
      jobs: [
        {
          id: createJobId('test'),
          strategy: {
            matrix: {
              node: ['18', '20'],
            },
            customField: true,
          },
          runsOn: 'ubuntu-latest',
          steps: [
            {
              kind: 'run',
              run: 'bun test',
            },
          ],
        },
      ],
    } as unknown as WorkflowDefinition;

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported job strategy field "customField"'));
  });

  it('renders workflow-level env after permissions and before concurrency', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('workflow_env'),
      name: 'Workflow Env',
    })
      .onPush()
      .permissions({
        contents: 'read',
      })
      .env({
        CI: 'true',
        NODE_ENV: 'production',
      })
      .concurrency({
        group: 'deploy',
      })
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run build');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'Workflow Env',
      on: {
        push: null,
      },
      permissions: {
        contents: 'read',
      },
      env: {
        CI: 'true',
        NODE_ENV: 'production',
      },
      concurrency: {
        group: 'deploy',
      },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun run build',
            },
          ],
        },
      },
    });
    const topKeys = Object.keys(payload);
    expect(topKeys.indexOf('permissions')).toBeLessThan(topKeys.indexOf('env'));
    expect(topKeys.indexOf('env')).toBeLessThan(topKeys.indexOf('concurrency'));
  });

  it('renders job-level env after concurrency and before strategy', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('job_env'),
      name: 'Job Env',
    })
      .onPush()
      .addJob(createJobId('build'), (job) => {
        job
          .concurrency({
            group: 'build-${{ github.ref }}',
          })
          .env({
            NODE_ENV: 'test',
          })
          .strategyMatrix({
            os: ['ubuntu-latest', 'windows-latest'],
          })
          .runsOn('${{ matrix.os }}')
          .run('bun run build');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'Job Env',
      on: {
        push: null,
      },
      jobs: {
        build: {
          concurrency: {
            group: 'build-${{ github.ref }}',
          },
          env: {
            NODE_ENV: 'test',
          },
          strategy: {
            matrix: {
              os: ['ubuntu-latest', 'windows-latest'],
            },
          },
          'runs-on': '${{ matrix.os }}',
          steps: [
            {
              run: 'bun run build',
            },
          ],
        },
      },
    });
    const jobKeys = Object.keys(payload.jobs.build!);
    expect(jobKeys.indexOf('concurrency')).toBeLessThan(jobKeys.indexOf('env'));
    expect(jobKeys.indexOf('env')).toBeLessThan(jobKeys.indexOf('strategy'));
  });

  it('omits empty env maps from the rendered payload', () => {
    const workflowWithEmptyEnv = {
      id: createWorkflowId('empty_env'),
      name: 'Empty Env',
      on: [{ type: 'push' as const }],
      env: {},
      jobs: [
        {
          id: createJobId('build'),
          env: {},
          runsOn: 'ubuntu-latest' as const,
          steps: [{ kind: 'run' as const, run: 'bun run build' }],
        },
      ],
    } as unknown as WorkflowDefinition;

    const payload = createWorkflowRenderPayload(workflowWithEmptyEnv);

    expect(payload.env).toBeUndefined();
    expect(payload.jobs.build!.env).toBeUndefined();
  });

  it('preserves canonical field ordering when env is present with other features', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('full_env'),
      name: 'Full Env',
    })
      .onPush()
      .permissions({ contents: 'read' })
      .env({ CI: 'true' })
      .concurrency({ group: 'deploy', cancelInProgress: true })
      .addJob(createJobId('build'), (job) => {
        job
          .permissions({ checks: 'write' })
          .timeoutMinutes(30)
          .concurrency({ group: 'build' })
          .env({ NODE_ENV: 'production' })
          .strategyMatrix({ os: ['ubuntu-latest'] })
          .runsOn('${{ matrix.os }}')
          .run('bun run build');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    const topKeys = Object.keys(payload);
    expect(topKeys).toEqual(['name', 'on', 'permissions', 'env', 'concurrency', 'jobs']);

    const jobKeys = Object.keys(payload.jobs.build!);
    expect(jobKeys).toEqual([
      'permissions',
      'timeout-minutes',
      'concurrency',
      'env',
      'strategy',
      'runs-on',
      'steps',
    ]);

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('renders combined workflow-level and job-level env correctly', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('combined_env'),
      name: 'Combined Env',
    })
      .onPush()
      .env({
        CI: 'true',
      })
      .addJob(createJobId('lint'), (job) => {
        job.env({ NODE_ENV: 'test' }).runsOn('ubuntu-latest').run('bun run lint');
      })
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run build');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload.env).toEqual({ CI: 'true' });
    expect(payload.jobs.lint!.env).toEqual({ NODE_ENV: 'test' });
    expect(payload.jobs.build!.env).toBeUndefined();
  });

  it('renders pull_request trigger with types deterministically', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('pr_types'),
      name: 'PR Types',
    })
      .onPullRequest({
        branches: ['main'],
        types: ['opened', 'synchronize', 'reopened'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'PR Types',
      on: {
        pull_request: {
          branches: ['main'],
          types: ['opened', 'synchronize', 'reopened'],
        },
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('renders pull_request types alongside branches and paths', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('pr_full_filter'),
      name: 'PR Full Filter',
    })
      .onPush({
        branches: ['main'],
      })
      .onPullRequest({
        branches: ['main', 'release/**'],
        paths: ['packages/**'],
        types: ['opened', 'labeled', 'closed'],
      })
      .addJob(createJobId('check'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run check');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload.on.pull_request).toEqual({
      branches: ['main', 'release/**'],
      paths: ['packages/**'],
      types: ['opened', 'labeled', 'closed'],
    });
    expect(Object.keys(payload.on)).toEqual(['push', 'pull_request']);
  });

  it('renders push trigger with branches-ignore deterministically', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('push_branches_ignore'),
      name: 'Push Branches Ignore',
    })
      .onPush({
        branchesIgnore: ['dependabot/**', 'renovate/**'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'Push Branches Ignore',
      on: {
        push: {
          'branches-ignore': ['dependabot/**', 'renovate/**'],
        },
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('renders push trigger with tags deterministically', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('push_tags'),
      name: 'Push Tags',
    })
      .onPush({
        tags: ['v*', 'release-*'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'Push Tags',
      on: {
        push: {
          tags: ['v*', 'release-*'],
        },
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });

    expect(renderWorkflow(workflow, emitPseudoYaml)).toBe(renderWorkflow(workflow, emitPseudoYaml));
  });

  it('renders trigger payload fields in canonical order with all filter types', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('push_all_negation'),
      name: 'Push All Negation',
    })
      .onPush({
        branchesIgnore: ['dependabot/**'],
        pathsIgnore: ['docs/**'],
        tagsIgnore: ['v*-beta'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const triggerKeys = Object.keys(payload.on.push!);

    expect(triggerKeys).toEqual(['branches-ignore', 'paths-ignore', 'tags-ignore']);
  });

  it('renders pull_request with branches-ignore and paths-ignore', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('pr_negation_filters'),
      name: 'PR Negation Filters',
    })
      .onPullRequest({
        branchesIgnore: ['dependabot/**'],
        pathsIgnore: ['docs/**', '*.md'],
        types: ['opened', 'synchronize'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'PR Negation Filters',
      on: {
        pull_request: {
          'branches-ignore': ['dependabot/**'],
          'paths-ignore': ['docs/**', '*.md'],
          types: ['opened', 'synchronize'],
        },
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun test',
            },
          ],
        },
      },
    });

    const triggerKeys = Object.keys(payload.on.pull_request!);
    expect(triggerKeys).toEqual(['branches-ignore', 'paths-ignore', 'types']);
  });

  it('renders trigger payload fields in canonical order: branches, paths, types', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('pr_field_order'),
      name: 'PR Field Order',
    })
      .onPullRequest({
        branches: ['main'],
        paths: ['src/**'],
        types: ['opened', 'synchronize'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);
    const triggerKeys = Object.keys(payload.on.pull_request!);

    expect(triggerKeys).toEqual(['branches', 'paths', 'types']);
  });

  describe('step identifiers and job outputs rendering', () => {
    it('renders run step id after name and before if in payload', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('render_run_step_id'),
        name: 'Render Run Step ID',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').run('echo building', {
            name: 'Build',
            id: 'build',
            if: 'success()',
          });
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const stepPayload = payload.jobs.build!.steps[0]!;
      const stepKeys = Object.keys(stepPayload);

      expect(stepPayload).toEqual({
        name: 'Build',
        id: 'build',
        if: 'success()',
        run: 'echo building',
      });
      expect(stepKeys.indexOf('name')).toBeLessThan(stepKeys.indexOf('id'));
      expect(stepKeys.indexOf('id')).toBeLessThan(stepKeys.indexOf('if'));
    });

    it('renders uses step id in payload', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('render_uses_step_id'),
        name: 'Render Uses Step ID',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').uses('actions/checkout@v4', {
            name: 'Checkout',
            id: 'checkout',
          });
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const stepPayload = payload.jobs.build!.steps[0]!;
      const stepKeys = Object.keys(stepPayload);

      expect(stepPayload).toEqual({
        name: 'Checkout',
        id: 'checkout',
        uses: 'actions/checkout@v4',
      });
      expect(stepKeys.indexOf('name')).toBeLessThan(stepKeys.indexOf('id'));
    });

    it('does not include id in step payload when id is not set', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('no_step_id_render'),
        name: 'No Step ID Render',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').run('echo hello');
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const stepPayload = payload.jobs.build!.steps[0]!;

      expect(stepPayload).not.toHaveProperty('id');
    });

    it('renders job outputs after runs-on and before steps', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('render_job_outputs'),
        name: 'Render Job Outputs',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .outputs({
              artifact: '${{ steps.upload.outputs.artifact-url }}',
            })
            .run('echo building', { id: 'upload' });
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const jobPayload = payload.jobs.build!;
      const jobKeys = Object.keys(jobPayload);

      expect(jobPayload.outputs).toEqual({
        artifact: '${{ steps.upload.outputs.artifact-url }}',
      });
      expect(jobKeys.indexOf('runs-on')).toBeLessThan(jobKeys.indexOf('outputs'));
      expect(jobKeys.indexOf('outputs')).toBeLessThan(jobKeys.indexOf('steps'));
    });
  });

  describe('strategy completion — fail-fast, max-parallel, matrix include/exclude', () => {
    it('renders strategy with fail-fast, max-parallel, include, and exclude', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('strategy-full'),
        name: 'Strategy Full',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .strategyMatrix({
              os: ['ubuntu-latest', 'windows-latest'],
              node: ['18', '20'],
            })
            .strategyFailFast(false)
            .strategyMaxParallel(2)
            .strategyInclude([{ os: 'macos-latest', node: '22', experimental: 'true' }])
            .strategyExclude([{ os: 'windows-latest', node: '18' }])
            .runsOn('${{ matrix.os }}')
            .run('bun test');
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const strategy = payload.jobs.test!.strategy!;

      expect(strategy['fail-fast']).toBe(false);
      expect(strategy['max-parallel']).toBe(2);
      expect(strategy.matrix.os).toEqual(['ubuntu-latest', 'windows-latest']);
      expect(strategy.matrix.node).toEqual(['18', '20']);
      expect(strategy.matrix.include).toEqual([
        { os: 'macos-latest', node: '22', experimental: 'true' },
      ]);
      expect(strategy.matrix.exclude).toEqual([{ os: 'windows-latest', node: '18' }]);

      const json = renderWorkflow(workflow, emitPseudoYaml);
      const failFastIdx = json.indexOf('"fail-fast"');
      const maxParallelIdx = json.indexOf('"max-parallel"');
      const matrixIdx = json.indexOf('"matrix"');
      expect(failFastIdx).toBeLessThan(maxParallelIdx);
      expect(maxParallelIdx).toBeLessThan(matrixIdx);
    });

    it('omits empty include and exclude from strategy payload', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('strategy-empty-inc-exc'),
        name: 'Strategy Empty IncExc',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .strategyMatrix({ os: ['ubuntu-latest'] })
            .strategyInclude([])
            .strategyExclude([])
            .runsOn('${{ matrix.os }}')
            .run('bun test');
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const matrix = payload.jobs.test!.strategy!.matrix;

      expect(matrix.os).toEqual(['ubuntu-latest']);
      expect('include' in matrix).toBe(false);
      expect('exclude' in matrix).toBe(false);
    });

    it('renders strategy with fail-fast only', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('strategy-ff-only'),
        name: 'Strategy FailFast Only',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .strategyMatrix({ os: ['ubuntu-latest'] })
            .strategyFailFast(true)
            .runsOn('${{ matrix.os }}')
            .run('bun test');
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const strategy = payload.jobs.test!.strategy!;

      expect(strategy['fail-fast']).toBe(true);
      expect('max-parallel' in strategy).toBe(false);
    });

    it('renders strategy with max-parallel only', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('strategy-mp-only'),
        name: 'Strategy MaxParallel Only',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .strategyMatrix({ os: ['ubuntu-latest'] })
            .strategyMaxParallel(3)
            .runsOn('${{ matrix.os }}')
            .run('bun test');
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const strategy = payload.jobs.test!.strategy!;

      expect(strategy['max-parallel']).toBe(3);
      expect('fail-fast' in strategy).toBe(false);
    });

    it('renders strategy with include containing arbitrary keys not in matrix axes', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('strategy-arb-keys'),
        name: 'Strategy Arbitrary Keys',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .strategyMatrix({ os: ['ubuntu-latest'] })
            .strategyInclude([{ os: 'macos-latest', custom_key: 'value' }])
            .runsOn('${{ matrix.os }}')
            .run('bun test');
        })
        .build();

      const payload = createWorkflowRenderPayload(workflow);
      const include = payload.jobs.test!.strategy!.matrix.include as readonly Record<
        string,
        string
      >[];

      expect(include).toHaveLength(1);
      expect(include[0]!.os).toBe('macos-latest');
      expect(include[0]!.custom_key).toBe('value');
    });
  });
});
