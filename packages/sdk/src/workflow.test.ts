import { describe, expect, it } from 'vitest';

import { createJobId, createWorkflowId, WorkflowValidationError } from '@ghawb/shared';

import { defineWorkflow } from './index.ts';

describe('workflow builder', () => {
  it('builds a representative Sprint 1 workflow model', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('ci'),
      name: 'CI',
    })
      .onPush({
        branches: ['main'],
        paths: ['packages/**'],
      })
      .onPullRequest({
        branches: ['main'],
      })
      .addJob(createJobId('lint'), (job) => {
        job
          .runsOn('ubuntu-latest')
          .uses('actions/checkout@v4', {
            name: 'Checkout',
          })
          .run('bun run lint', {
            name: 'Lint',
            if: "github.event_name == 'push'",
            env: {
              CI: 'true',
            },
          });
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn(['ubuntu-latest', 'self-hosted']).run('bun test', {
          with: {
            coverage: 'true',
          },
        });
      })
      .build();

    expect(workflow.id).toBe('ci');
    expect(workflow.name).toBe('CI');
    expect(workflow.on).toEqual([
      {
        type: 'push',
        branches: ['main'],
        paths: ['packages/**'],
      },
      {
        type: 'pull_request',
        branches: ['main'],
      },
    ]);
    expect(workflow.jobs).toEqual([
      {
        id: 'lint',
        runsOn: 'ubuntu-latest',
        steps: [
          {
            kind: 'uses',
            uses: 'actions/checkout@v4',
            name: 'Checkout',
          },
          {
            kind: 'run',
            run: 'bun run lint',
            name: 'Lint',
            env: {
              CI: 'true',
            },
            if: "github.event_name == 'push'",
          },
        ],
      },
      {
        id: 'test',
        runsOn: ['ubuntu-latest', 'self-hosted'],
        steps: [
          {
            kind: 'run',
            run: 'bun test',
            with: {
              coverage: 'true',
            },
          },
        ],
      },
    ]);
  });

  it('builds workflows with workflow_dispatch triggers', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('manual'),
      name: 'Manual',
    })
      .onWorkflowDispatch()
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: 'workflow_dispatch',
      },
    ]);
  });

  it('builds workflows with schedule triggers', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('nightly'),
      name: 'Nightly',
    })
      .onSchedule(['0 0 * * *', '30 12 * * 1-5'])
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: 'schedule',
        cron: ['0 0 * * *', '30 12 * * 1-5'],
      },
    ]);
  });


  it('validates the full Sprint 1 slice at build time', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid'),
      name: '   ',
    })
      .onPush({
        branches: [],
      })
      .addJob(createJobId('job'), (job) => {
        job.runsOn(['ubuntu-latest', ' ']).run('   ', {
          name: ' ',
          if: ' ',
          env: {
            ' ': 'true',
          },
        });
      })
      .addJob(createJobId('job'), (job) => {
        job.uses('actions/checkout@v4');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow name must not be empty',
        'trigger "push" branches must not be empty',
        'job "job" runs-on array must not contain blank values',
        'job "job" step 1 must define a non-empty run value',
        'job "job" step 1 name must not be empty',
        'job "job" step 1 if must not be empty',
        'job "job" step 1 env must not contain blank keys',
        'duplicate job id "job"',
        'job "job" must define runs-on',
      ])
    );
  });

  it('requires at least one trigger and one job', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('empty'),
      name: 'Empty',
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow must define at least one trigger',
        'workflow must define at least one job',
      ])
    );
  });

  it('rejects duplicate trigger definitions', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('duplicate_triggers'),
      name: 'Duplicate Triggers',
    })
      .onPush({
        branches: ['main'],
      })
      .onPush({
        branches: ['release'],
      })
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['duplicate trigger "push"'])
    );
  });

  it('rejects duplicate workflow_dispatch trigger definitions', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('duplicate_dispatch_triggers'),
      name: 'Duplicate Dispatch Triggers',
    })
      .onWorkflowDispatch()
      .onWorkflowDispatch()
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['duplicate trigger "workflow_dispatch"'])
    );
  });

  it('rejects duplicate schedule trigger definitions', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('duplicate_schedule_triggers'),
      name: 'Duplicate Schedule Triggers',
    })
      .onSchedule(['0 0 * * *'])
      .onSchedule(['30 12 * * 1-5'])
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['duplicate trigger "schedule"'])
    );
  });

  it('rejects duplicate schedule trigger definitions', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('duplicate_schedule_triggers'),
      name: 'Duplicate Schedule Triggers',
    })
      .onSchedule('0 3 * * *')
      .onSchedule('0 6 * * *')
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['duplicate trigger "schedule"'])
    );
  });

  it('rejects duplicate schedule trigger definitions', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('duplicate_schedule_triggers'),
      name: 'Duplicate Schedule Triggers',
    })
      .onSchedule('0 0 * * *')
      .onSchedule('30 12 * * 1')
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['duplicate trigger "schedule"'])
    );
  });

  it('fails explicitly when workflow_dispatch is given unsupported filters', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_dispatch'),
      name: 'Invalid Dispatch',
    }).addJob(createJobId('lint'), (job) => {
      job.runsOn('ubuntu-latest').run('bun run lint');
    });

    (
      builder.triggers as unknown as Array<
        | {
            type: 'workflow_dispatch';
            branches?: readonly string[];
            paths?: readonly string[];
          }
        | Record<string, never>
      >
    ).push({
      type: 'workflow_dispatch',
      branches: ['main'],
      paths: ['packages/**'],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "workflow_dispatch" does not support branches',
        'trigger "workflow_dispatch" does not support paths',
      ])
    );
  });

  it('fails explicitly when schedule is given blank or malformed cron entries', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_schedule'),
      name: 'Invalid Schedule',
    })
      .onSchedule([' ', '* * * *', '0 0 * * * *'])
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "schedule" cron must not contain blank values',
        'trigger "schedule" cron entry "* * * *" must have exactly 5 fields',
        'trigger "schedule" cron entry "0 0 * * * *" must have exactly 5 fields',
      ])
    );
  });

  it('fails explicitly when schedule is given unsupported filters', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_schedule_filters'),
      name: 'Invalid Schedule Filters',
    }).addJob(createJobId('lint'), (job) => {
      job.runsOn('ubuntu-latest').run('bun run lint');
    });

    (
      builder.triggers as unknown as Array<
        | {
            type: 'schedule';
            cron?: readonly string[];
            branches?: readonly string[];
            paths?: readonly string[];
          }
        | Record<string, never>
      >
    ).push({
      type: 'schedule',
      cron: ['0 0 * * *'],
      branches: ['main'],
      paths: ['packages/**'],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "schedule" does not support branches',
        'trigger "schedule" does not support paths',
      ])
    );
  });

  it('fails explicitly when schedule has empty, blank, or malformed cron entries', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_schedule'),
      name: 'Invalid Schedule',
    }).addJob(createJobId('lint'), (job) => {
      job.runsOn('ubuntu-latest').run('bun run lint');
    });

    (
      builder.triggers as unknown as Array<
        | {
            type: 'schedule';
            cron?: readonly string[];
          }
        | Record<string, never>
      >
    ).push(
      {
        type: 'schedule',
        cron: [],
      },
      {
        type: 'schedule',
        cron: ['   ', '0 3 * * *'],
      },
      {
        type: 'schedule',
        cron: ['0 3 * *'],
      }
    );

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "schedule" must define at least one cron entry',
        'duplicate trigger "schedule"',
        'duplicate trigger "schedule"',
      ])
    );
  });

  it('rejects empty and malformed schedule entries', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_schedule'),
      name: 'Invalid Schedule',
    })
      .onSchedule(['', '0 0 * *', '0 0 * * *'])
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "schedule" cron must not contain blank values',
        'trigger "schedule" cron entry "0 0 * *" must have exactly 5 fields',
      ])
    );
  });

  it('rejects empty and malformed schedule trigger entries', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_schedule'),
      name: 'Invalid Schedule',
    }).addJob(createJobId('lint'), (job) => {
      job.runsOn('ubuntu-latest').run('bun run lint');
    });

    (
      builder.triggers as unknown as Array<
        | {
            type: 'schedule';
            cron: readonly string[];
          }
        | Record<string, never>
      >
    ).push({
      type: 'schedule',
      cron: ['', '0 0 * *', '0 0 * * *'],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "schedule" cron must not contain blank values',
        'trigger "schedule" cron entry "0 0 * *" must have exactly 5 fields',
      ])
    );
  });

  it('deep-freezes workflow output including nested arrays and maps', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('immutable'),
      name: 'Immutable Workflow',
    })
      .onPush({
        branches: ['main'],
        paths: ['packages/**'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn(['ubuntu-latest', 'self-hosted']).run('bun test', {
          env: {
            CI: 'true',
          },
          with: {
            coverage: 'true',
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
    expect(Object.isFrozen(workflow.jobs[0]!.steps)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[0]!.steps[0]!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[0]!.steps[0]!.env!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[0]!.steps[0]!.with!)).toBe(true);

    expect(() => {
      (workflow.on as unknown as Array<{ type: string }>).push({ type: 'pull_request' });
    }).toThrow(TypeError);
    expect(() => {
      (workflow.jobs[0]!.steps[0]!.env as Record<string, string>).CI = 'false';
    }).toThrow(TypeError);
  });
});
