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

  it('renders schedule triggers in canonical trigger order', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('scheduled'),
      name: 'Scheduled',
    })
      .onSchedule(['0 3 * * *', '30 9 * * 1'])
      .onWorkflowDispatch()
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'Scheduled',
      on: {
        workflow_dispatch: null,
        schedule: [{ cron: '0 3 * * *' }, { cron: '30 9 * * 1' }],
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
    expect(Object.keys(payload.on)).toEqual(['workflow_dispatch', 'schedule']);
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

  it('renders schedule triggers in canonical trigger order', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('nightly'),
      name: 'Nightly',
    })
      .onWorkflowDispatch()
      .onSchedule(['0 0 * * *', '30 12 * * 1'])
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const payload = createWorkflowRenderPayload(workflow);

    expect(payload).toEqual({
      name: 'Nightly',
      on: {
        workflow_dispatch: null,
        schedule: [{ cron: '0 0 * * *' }, { cron: '30 12 * * 1' }],
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
    expect(Object.keys(payload.on)).toEqual(['workflow_dispatch', 'schedule']);
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
      permissions: {
        contents: 'read',
      },
    } as WorkflowDefinition & {
      permissions: {
        contents: string;
      };
    };

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => {
        emitterCalls += 1;
        return emitPseudoYaml(payload);
      })
    ).toThrowError(new WorkflowRenderError('unsupported workflow field "permissions"'));
    expect(emitterCalls).toBe(0);
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
    } as unknown as WorkflowDefinition & {
      on: Array<
        | WorkflowDefinition['on'][number]
        | {
            type: 'schedule';
            cron: readonly string[];
            timezone: string;
          }
      >;
    };

    expect(() =>
      renderWorkflow(unsupportedWorkflow, (payload) => emitPseudoYaml(payload))
    ).toThrowError(new WorkflowRenderError('unsupported trigger "schedule" field "timezone"'));
  });

  it('fails explicitly before emission when schedule has unsupported fields', () => {
    const unsupportedWorkflow = {
      id: createWorkflowId('unsupported_schedule'),
      name: 'Unsupported Schedule',
      on: [
        {
          type: 'schedule',
          cron: ['0 3 * * *'],
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
});
