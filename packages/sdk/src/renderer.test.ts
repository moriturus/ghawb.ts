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
});
