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

  it('builds workflows with ordered job dependencies', () => {
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

    expect(workflow.jobs).toEqual([
      {
        id: 'build',
        runsOn: 'ubuntu-latest',
        steps: [
          {
            kind: 'run',
            run: 'bun run build',
          },
        ],
      },
      {
        id: 'test',
        needs: ['build'],
        runsOn: 'ubuntu-latest',
        steps: [
          {
            kind: 'run',
            run: 'bun test',
          },
        ],
      },
      {
        id: 'deploy',
        needs: ['build', 'test'],
        runsOn: 'ubuntu-latest',
        steps: [
          {
            kind: 'run',
            run: 'bun run deploy',
          },
        ],
      },
    ]);
  });

  it('builds workflows with strategy matrices', () => {
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

    expect(workflow.jobs).toEqual([
      {
        id: 'test',
        strategy: {
          matrix: {
            os: ['ubuntu-latest', 'windows-latest'],
            node: ['18', '20'],
          },
        },
        runsOn: '${{ matrix.os }}',
        steps: [
          {
            kind: 'run',
            run: 'bun test',
          },
        ],
      },
    ]);
  });

  it('builds workflows with workflow-level and job-level permissions', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('permissions'),
      name: 'Permissions',
    })
      .onPush()
      .permissions({
        actions: 'read',
        contents: 'write',
        'pull-requests': 'none',
      })
      .addJob(createJobId('check'), (job) => {
        job
          .permissions({
            checks: 'write',
            'id-token': 'write',
            models: 'read',
          })
          .runsOn('ubuntu-latest')
          .run('bun test');
      })
      .build();

    expect(workflow).toMatchObject({
      permissions: {
        actions: 'read',
        contents: 'write',
        'pull-requests': 'none',
      },
      jobs: [
        {
          id: 'check',
          permissions: {
            checks: 'write',
            'id-token': 'write',
            models: 'read',
          },
        },
      ],
    });
  });

  it('builds workflows with execution environment metadata on jobs and run steps', () => {
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

    expect(workflow.jobs).toEqual([
      {
        id: 'check',
        timeoutMinutes: 15,
        defaults: {
          run: {
            shell: 'bash',
            workingDirectory: './packages/sdk',
          },
        },
        runsOn: 'ubuntu-latest',
        steps: [
          {
            kind: 'run',
            run: 'bun test',
            shell: 'sh',
            workingDirectory: './packages/sdk',
          },
        ],
      },
    ]);
  });

  it('builds workflows with workflow-level and job-level concurrency controls', () => {
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

    expect(workflow).toMatchObject({
      concurrency: {
        group: 'deploy',
        cancelInProgress: true,
      },
      jobs: [
        {
          id: 'check',
          concurrency: {
            group: 'check-${{ github.ref }}',
          },
        },
      ],
    });
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
      .onSchedule('0 3 * * *')
      .onSchedule('0 6 * * *')
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
    expect((thrown as WorkflowValidationError).issues[1]).toContain('* * * *');
    expect((thrown as WorkflowValidationError).issues[1]).toContain('exactly 5 fields');
    expect((thrown as WorkflowValidationError).issues[2]).toContain('0 0 * * * *');
    expect((thrown as WorkflowValidationError).issues[2]).toContain('exactly 5 fields');
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

  it('rejects empty schedule trigger entries', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('empty_schedule'),
      name: 'Empty Schedule',
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
      cron: [],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "schedule" must define at least one cron entry'])
    );
  });

  it('rejects job dependencies on unknown, duplicate, or later-declared job ids', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_needs'),
      name: 'Invalid Needs',
    })
      .onPush()
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run build');
      })
      .addJob(createJobId('deploy'), (job) => {
        job
          .needs([
            createJobId('build'),
            createJobId('build'),
            createJobId('test'),
            createJobId('missing'),
          ])
          .runsOn('ubuntu-latest')
          .run('bun run deploy');
      })
      .addJob(createJobId('test'), (job) => {
        job.needs(createJobId('deploy')).runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "deploy" needs must not contain duplicate job "build"',
        'job "deploy" needs job "test" to be declared earlier',
        'job "deploy" needs unknown job "missing"',
      ])
    );
  });

  it('rejects empty or malformed strategy matrices', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_matrix'),
      name: 'Invalid Matrix',
    })
      .onPush()
      .addJob(createJobId('test'), (job) => {
        job
          .strategyMatrix({
            '': ['ubuntu-latest'],
            include: ['unexpected'],
            os: [],
            node: ['18', ' '],
            runtime: [{ version: '20' }] as unknown as readonly [string, ...string[]],
          } as unknown as import('./index.ts').WorkflowMatrix)
          .runsOn('ubuntu-latest')
          .run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "test" strategy.matrix must not contain blank axis names',
        'job "test" strategy.matrix does not support axis "include"',
        'job "test" strategy.matrix axis "os" must not be empty',
        'job "test" strategy.matrix axis "node" must not contain blank values',
        'job "test" strategy.matrix axis "runtime" must contain only strings',
      ])
    );
  });

  it('rejects invalid workflow and job permissions entries', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_permissions'),
      name: 'Invalid Permissions',
    })
      .onPush()
      .permissions({
        actions: 'admin' as 'read',
        unknown: 'read',
      } as unknown as import('./index.ts').WorkflowPermissions)
      .addJob(createJobId('check'), (job) => {
        job
          .permissions({
            contents: 'write',
            models: 'write',
            unknown: 'none',
          } as unknown as import('./index.ts').WorkflowPermissions)
          .runsOn('ubuntu-latest')
          .run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow permissions entry "actions" must be one of read, write, none',
        'workflow permissions contains unsupported key "unknown"',
        'job "check" permissions entry "models" must be one of read, none',
        'job "check" permissions contains unsupported key "unknown"',
      ])
    );
  });

  it('rejects invalid execution environment metadata values', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_execution_metadata'),
      name: 'Invalid Execution Metadata',
    })
      .onPush()
      .addJob(createJobId('check'), (job) => {
        job
          .timeoutMinutes(0.5)
          .defaultsRun({
            shell: ' ',
            workingDirectory: ' ',
          })
          .runsOn('ubuntu-latest')
          .run('bun test', {
            shell: ' ',
            workingDirectory: ' ',
          });
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'job "check" timeout-minutes must be a positive integer',
        'job "check" defaults.run.shell must not be empty',
        'job "check" defaults.run.working-directory must not be empty',
        'job "check" step 1 shell must not be empty',
        'job "check" step 1 working-directory must not be empty',
      ])
    );
  });

  it('rejects invalid concurrency values', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_concurrency'),
      name: 'Invalid Concurrency',
    })
      .onPush()
      .concurrency({
        group: ' ',
        cancelInProgress: 'yes' as unknown as boolean,
      })
      .addJob(createJobId('check'), (job) => {
        job
          .concurrency({
            group: ' ',
            cancelInProgress: 'no' as unknown as boolean,
          })
          .runsOn('ubuntu-latest')
          .run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow concurrency group must not be empty',
        'workflow concurrency cancel-in-progress must be a boolean',
        'job "check" concurrency group must not be empty',
        'job "check" concurrency cancel-in-progress must be a boolean',
      ])
    );
  });

  it('rejects permissions entries with undefined values', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('undefined_permissions'),
      name: 'Undefined Permissions',
    })
      .onPush()
      .permissions({
        contents: undefined,
      } as unknown as import('./index.ts').WorkflowPermissions)
      .addJob(createJobId('check'), (job) => {
        job
          .permissions({
            checks: undefined,
          } as unknown as import('./index.ts').WorkflowPermissions)
          .runsOn('ubuntu-latest')
          .run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'workflow permissions entry "contents" must be one of read, write, none',
        'job "check" permissions entry "checks" must be one of read, write, none',
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
      .addJob(createJobId('lint'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run lint');
      })
      .addJob(createJobId('test'), (job) => {
        job
          .needs(createJobId('lint'))
          .strategyMatrix({
            node: ['18', '20'],
          })
          .runsOn(['ubuntu-latest', 'self-hosted'])
          .run('bun test', {
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
    expect(Object.isFrozen(workflow.jobs[1]!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.needs!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.strategy!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.strategy!.matrix)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.strategy!.matrix.node)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.steps)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.steps[0]!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.steps[0]!.env!)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[1]!.steps[0]!.with!)).toBe(true);

    expect(() => {
      (workflow.on as unknown as Array<{ type: string }>).push({ type: 'pull_request' });
    }).toThrow(TypeError);
    expect(() => {
      (workflow.jobs[1]!.steps[0]!.env as Record<string, string>).CI = 'false';
    }).toThrow(TypeError);
  });
});
