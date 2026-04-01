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

  it('preserves workflow-level env in the built model', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('workflow_env'),
      name: 'Workflow Env',
    })
      .onPush()
      .env({
        NODE_ENV: 'production',
        CI: 'true',
      })
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run build');
      })
      .build();

    expect(workflow.env).toEqual({
      NODE_ENV: 'production',
      CI: 'true',
    });
  });

  it('preserves job-level env in the built model', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('job_env'),
      name: 'Job Env',
    })
      .onPush()
      .addJob(createJobId('build'), (job) => {
        job
          .env({
            NODE_ENV: 'test',
            DEBUG: '1',
          })
          .runsOn('ubuntu-latest')
          .run('bun run build');
      })
      .build();

    expect(workflow.jobs[0]!.env).toEqual({
      NODE_ENV: 'test',
      DEBUG: '1',
    });
  });

  it('preserves both workflow-level and job-level env together', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('both_env'),
      name: 'Both Env',
    })
      .onPush()
      .env({
        CI: 'true',
      })
      .addJob(createJobId('build'), (job) => {
        job
          .env({
            NODE_ENV: 'production',
          })
          .runsOn('ubuntu-latest')
          .run('bun run build');
      })
      .build();

    expect(workflow.env).toEqual({ CI: 'true' });
    expect(workflow.jobs[0]!.env).toEqual({ NODE_ENV: 'production' });
  });

  it('rejects blank env keys at workflow level', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_workflow_env'),
      name: 'Invalid Workflow Env',
    })
      .onPush()
      .env({
        '': 'value',
        VALID: 'ok',
      })
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run build');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['workflow env must not contain blank keys'])
    );
  });

  it('rejects blank env keys at job level', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_job_env'),
      name: 'Invalid Job Env',
    })
      .onPush()
      .addJob(createJobId('build'), (job) => {
        job
          .env({
            ' ': 'value',
          })
          .runsOn('ubuntu-latest')
          .run('bun run build');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['job "build" env must not contain blank keys'])
    );
  });

  it('omits empty env maps from the built model', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('empty_env'),
      name: 'Empty Env',
    })
      .onPush()
      .env({})
      .addJob(createJobId('build'), (job) => {
        job.env({}).runsOn('ubuntu-latest').run('bun run build');
      })
      .build();

    expect(workflow.env).toBeUndefined();
    expect(workflow.jobs[0]!.env).toBeUndefined();
  });

  it('deep-freezes built env maps at workflow and job levels', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('frozen_env'),
      name: 'Frozen Env',
    })
      .onPush()
      .env({
        CI: 'true',
      })
      .addJob(createJobId('build'), (job) => {
        job
          .env({
            NODE_ENV: 'production',
          })
          .runsOn('ubuntu-latest')
          .run('bun run build');
      })
      .build();

    expect(Object.isFrozen(workflow.env)).toBe(true);
    expect(Object.isFrozen(workflow.jobs[0]!.env)).toBe(true);

    expect(() => {
      (workflow.env as Record<string, string>).CI = 'false';
    }).toThrow(TypeError);
    expect(() => {
      (workflow.jobs[0]!.env as Record<string, string>).NODE_ENV = 'dev';
    }).toThrow(TypeError);
  });

  it('preserves pull_request types in the built model', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('pr_types'),
      name: 'PR Types',
    })
      .onPullRequest({
        types: ['opened', 'synchronize', 'reopened'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: 'pull_request',
        types: ['opened', 'synchronize', 'reopened'],
      },
    ]);
  });

  it('preserves pull_request types alongside branches and paths', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('pr_types_with_filters'),
      name: 'PR Types With Filters',
    })
      .onPullRequest({
        branches: ['main', 'release/**'],
        paths: ['packages/**'],
        types: ['opened', 'labeled'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: 'pull_request',
        branches: ['main', 'release/**'],
        paths: ['packages/**'],
        types: ['opened', 'labeled'],
      },
    ]);
  });

  it('rejects unknown pull_request activity type names at build time', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('invalid_pr_types'),
      name: 'Invalid PR Types',
    })
      .onPullRequest({
        types: ['opened', 'merged' as never, 'closed', 'drafted' as never],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "pull_request" types contains unknown activity type "merged"',
        'trigger "pull_request" types contains unknown activity type "drafted"',
      ])
    );
  });

  it('rejects empty pull_request types array', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('empty_pr_types'),
      name: 'Empty PR Types',
    })
      .onPullRequest({
        types: [] as unknown as readonly ['opened'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "pull_request" types must not be empty'])
    );
  });

  it('rejects types on push trigger', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('push_with_types'),
      name: 'Push With Types',
    }).addJob(createJobId('test'), (job) => {
      job.runsOn('ubuntu-latest').run('bun test');
    });

    (
      builder.triggers as unknown as Array<{
        type: 'push';
        branches?: readonly string[];
        types?: readonly string[];
      }>
    ).push({
      type: 'push',
      branches: ['main'],
      types: ['opened'],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "push" does not support types'])
    );
  });

  it('rejects types on workflow_dispatch trigger', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('dispatch_with_types'),
      name: 'Dispatch With Types',
    }).addJob(createJobId('test'), (job) => {
      job.runsOn('ubuntu-latest').run('bun test');
    });

    (
      builder.triggers as unknown as Array<{
        type: 'workflow_dispatch';
        types?: readonly string[];
      }>
    ).push({
      type: 'workflow_dispatch',
      types: ['opened'],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "workflow_dispatch" does not support types'])
    );
  });

  it('rejects types on schedule trigger', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('schedule_with_types'),
      name: 'Schedule With Types',
    }).addJob(createJobId('test'), (job) => {
      job.runsOn('ubuntu-latest').run('bun test');
    });

    (
      builder.triggers as unknown as Array<{
        type: 'schedule';
        cron: readonly string[];
        types?: readonly string[];
      }>
    ).push({
      type: 'schedule',
      cron: ['0 0 * * *'],
      types: ['opened'],
    });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "schedule" does not support types'])
    );
  });

  it('composes pull_request types with branches, paths, and other features', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('pr_types_compose'),
      name: 'PR Types Compose',
    })
      .onPush({
        branches: ['main'],
      })
      .onPullRequest({
        branches: ['main'],
        paths: ['src/**'],
        types: ['opened', 'synchronize'],
      })
      .permissions({
        contents: 'read',
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(workflow).toMatchObject({
      on: [
        {
          type: 'push',
          branches: ['main'],
        },
        {
          type: 'pull_request',
          branches: ['main'],
          paths: ['src/**'],
          types: ['opened', 'synchronize'],
        },
      ],
      permissions: { contents: 'read' },
    });
  });

  it('deep-freezes built trigger types array', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('frozen_pr_types'),
      name: 'Frozen PR Types',
    })
      .onPullRequest({
        types: ['opened', 'closed'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const prTrigger = workflow.on[0]! as {
      type: 'pull_request';
      types: readonly string[];
    };

    expect(Object.isFrozen(prTrigger)).toBe(true);
    expect(Object.isFrozen(prTrigger.types)).toBe(true);

    expect(() => {
      (prTrigger.types as string[]).push('labeled');
    }).toThrow(TypeError);
  });

  it('preserves push trigger branchesIgnore in the built model', () => {
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

    expect(workflow.on).toEqual([
      {
        type: 'push',
        branchesIgnore: ['dependabot/**', 'renovate/**'],
      },
    ]);
  });

  it('preserves push trigger pathsIgnore in the built model', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('push_paths_ignore'),
      name: 'Push Paths Ignore',
    })
      .onPush({
        pathsIgnore: ['docs/**', '*.md'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: 'push',
        pathsIgnore: ['docs/**', '*.md'],
      },
    ]);
  });

  it('preserves push trigger tags in the built model', () => {
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

    expect(workflow.on).toEqual([
      {
        type: 'push',
        tags: ['v*', 'release-*'],
      },
    ]);
  });

  it('preserves push trigger tagsIgnore in the built model', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('push_tags_ignore'),
      name: 'Push Tags Ignore',
    })
      .onPush({
        tagsIgnore: ['v*-beta', 'v*-rc*'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(workflow.on).toEqual([
      {
        type: 'push',
        tagsIgnore: ['v*-beta', 'v*-rc*'],
      },
    ]);
  });

  it('rejects combining branches and branches-ignore on the same trigger', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('branches_mutual_exclusion'),
      name: 'Branches Mutual Exclusion',
    })
      .onPush({
        branches: ['main'],
        branchesIgnore: ['dependabot/**'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "push" must not combine branches and branches-ignore'])
    );
  });

  it('rejects combining paths and paths-ignore on the same trigger', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('paths_mutual_exclusion'),
      name: 'Paths Mutual Exclusion',
    })
      .onPush({
        paths: ['src/**'],
        pathsIgnore: ['docs/**'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "push" must not combine paths and paths-ignore'])
    );
  });

  it('rejects combining tags and tags-ignore on the same trigger', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('tags_mutual_exclusion'),
      name: 'Tags Mutual Exclusion',
    })
      .onPush({
        tags: ['v*'],
        tagsIgnore: ['v*-beta'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "push" must not combine tags and tags-ignore'])
    );
  });

  it('rejects tags on pull_request trigger', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('pr_tags'),
      name: 'PR Tags',
    })
      .onPullRequest({
        tags: ['v*'],
      } as import('./index.ts').PullRequestTriggerFilter)
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "pull_request" does not support tags'])
    );
  });

  it('rejects tagsIgnore on pull_request trigger', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('pr_tags_ignore'),
      name: 'PR Tags Ignore',
    })
      .onPullRequest({
        tagsIgnore: ['v*-beta'],
      } as import('./index.ts').PullRequestTriggerFilter)
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError(['trigger "pull_request" does not support tags-ignore'])
    );
  });

  it('rejects empty negation and tag filter arrays', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('empty_negation_arrays'),
      name: 'Empty Negation Arrays',
    })
      .onPush({
        branchesIgnore: [] as unknown as readonly [string, ...string[]],
        pathsIgnore: [] as unknown as readonly [string, ...string[]],
        tags: [] as unknown as readonly [string, ...string[]],
        tagsIgnore: [] as unknown as readonly [string, ...string[]],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "push" branches-ignore must not be empty',
        'trigger "push" paths-ignore must not be empty',
        'trigger "push" tags must not be empty',
        'trigger "push" tags-ignore must not be empty',
        'trigger "push" must not combine tags and tags-ignore',
      ])
    );
  });

  it('rejects blank values in negation and tag filter arrays', () => {
    const builder = defineWorkflow({
      id: createWorkflowId('blank_negation_values'),
      name: 'Blank Negation Values',
    })
      .onPush({
        branchesIgnore: ['dependabot/**', ' '],
        pathsIgnore: [' ', 'docs/**'],
        tags: ['v*', '  '],
        tagsIgnore: [' '],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      });

    expect(() => builder.build()).toThrowError(
      new WorkflowValidationError([
        'trigger "push" branches-ignore must not contain blank values',
        'trigger "push" paths-ignore must not contain blank values',
        'trigger "push" tags must not contain blank values',
        'trigger "push" tags-ignore must not contain blank values',
        'trigger "push" must not combine tags and tags-ignore',
      ])
    );
  });

  it('composes negation filters with existing positive filters and other features', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('negation_compose'),
      name: 'Negation Compose',
    })
      .onPush({
        branchesIgnore: ['dependabot/**'],
        pathsIgnore: ['docs/**'],
        tags: ['v*'],
      })
      .onPullRequest({
        branchesIgnore: ['renovate/**'],
        pathsIgnore: ['*.md'],
      })
      .permissions({
        contents: 'read',
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    expect(workflow).toMatchObject({
      on: [
        {
          type: 'push',
          branchesIgnore: ['dependabot/**'],
          pathsIgnore: ['docs/**'],
          tags: ['v*'],
        },
        {
          type: 'pull_request',
          branchesIgnore: ['renovate/**'],
          pathsIgnore: ['*.md'],
        },
      ],
      permissions: { contents: 'read' },
    });
  });

  it('deep-freezes built negation and tag filter arrays', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('frozen_negation_tags'),
      name: 'Frozen Negation Tags',
    })
      .onPush({
        branchesIgnore: ['dependabot/**'],
        pathsIgnore: ['docs/**'],
        tags: ['v*'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build();

    const pushTrigger = workflow.on[0]! as {
      type: 'push';
      branchesIgnore: readonly string[];
      pathsIgnore: readonly string[];
      tags: readonly string[];
    };

    expect(Object.isFrozen(pushTrigger)).toBe(true);
    expect(Object.isFrozen(pushTrigger.branchesIgnore)).toBe(true);
    expect(Object.isFrozen(pushTrigger.pathsIgnore)).toBe(true);
    expect(Object.isFrozen(pushTrigger.tags)).toBe(true);

    expect(() => {
      (pushTrigger.branchesIgnore as string[]).push('test/**');
    }).toThrow(TypeError);
    expect(() => {
      (pushTrigger.pathsIgnore as string[]).push('test/**');
    }).toThrow(TypeError);
    expect(() => {
      (pushTrigger.tags as string[]).push('v2*');
    }).toThrow(TypeError);
  });

  it('composes env with permissions and concurrency', () => {
    const workflow = defineWorkflow({
      id: createWorkflowId('env_compose'),
      name: 'Env Compose',
    })
      .onPush()
      .permissions({
        contents: 'read',
      })
      .env({
        CI: 'true',
      })
      .concurrency({
        group: 'deploy',
        cancelInProgress: true,
      })
      .addJob(createJobId('build'), (job) => {
        job
          .permissions({ checks: 'write' })
          .concurrency({ group: 'build-${{ github.ref }}' })
          .env({ NODE_ENV: 'production' })
          .runsOn('ubuntu-latest')
          .run('bun run build');
      })
      .build();

    expect(workflow).toMatchObject({
      permissions: { contents: 'read' },
      env: { CI: 'true' },
      concurrency: { group: 'deploy', cancelInProgress: true },
      jobs: [
        {
          id: 'build',
          permissions: { checks: 'write' },
          concurrency: { group: 'build-${{ github.ref }}' },
          env: { NODE_ENV: 'production' },
        },
      ],
    });
  });

  describe('step identifiers and job outputs', () => {
    it('builds a run step with an id', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('step_id_run'),
        name: 'Step ID Run',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').run('echo building', { id: 'build-step' });
        })
        .build();

      expect(workflow.jobs[0]!.steps[0]).toMatchObject({
        kind: 'run',
        id: 'build-step',
        run: 'echo building',
      });
    });

    it('builds a uses step with an id', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('step_id_uses'),
        name: 'Step ID Uses',
      })
        .onPush()
        .addJob(createJobId('checkout'), (job) => {
          job.runsOn('ubuntu-latest').uses('actions/checkout@v4', { id: 'checkout-step' });
        })
        .build();

      expect(workflow.jobs[0]!.steps[0]).toMatchObject({
        kind: 'uses',
        id: 'checkout-step',
        uses: 'actions/checkout@v4',
      });
    });

    it('builds multiple steps with unique IDs', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('multi_step_ids'),
        name: 'Multi Step IDs',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .run('echo step1', { id: 'step1' })
            .run('echo step2', { id: 'step2' })
            .uses('actions/checkout@v4', { id: 'checkout' });
        })
        .build();

      expect(workflow.jobs[0]!.steps[0]!.id).toBe('step1');
      expect(workflow.jobs[0]!.steps[1]!.id).toBe('step2');
      expect(workflow.jobs[0]!.steps[2]!.id).toBe('checkout');
    });

    it('builds steps without IDs (backwards compatible)', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('no_step_ids'),
        name: 'No Step IDs',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').run('echo hello');
        })
        .build();

      expect(workflow.jobs[0]!.steps[0]).not.toHaveProperty('id');
    });

    it('trims step IDs during finalization', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('trim_step_id'),
        name: 'Trim Step ID',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').run('echo hello', { id: '  build-step  ' });
        })
        .build();

      expect(workflow.jobs[0]!.steps[0]!.id).toBe('build-step');
    });

    it('rejects blank step IDs', () => {
      const builder = defineWorkflow({
        id: createWorkflowId('blank_step_id'),
        name: 'Blank Step ID',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').run('echo hello', { id: '  ' });
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "build" step 1 id must not be empty'])
      );
    });

    it('rejects duplicate step IDs in the same job', () => {
      const builder = defineWorkflow({
        id: createWorkflowId('dup_step_ids'),
        name: 'Dup Step IDs',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .run('echo first', { id: 'build' })
            .run('echo second', { id: 'build' });
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "test" contains duplicate step id "build"'])
      );
    });

    it('allows the same step ID in different jobs', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('cross_job_ids'),
        name: 'Cross Job IDs',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').run('echo building', { id: 'setup' });
        })
        .addJob(createJobId('test'), (job) => {
          job.runsOn('ubuntu-latest').run('echo testing', { id: 'setup' });
        })
        .build();

      expect(workflow.jobs[0]!.steps[0]!.id).toBe('setup');
      expect(workflow.jobs[1]!.steps[0]!.id).toBe('setup');
    });

    it('builds a job with outputs referencing declared step IDs', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('job_outputs'),
        name: 'Job Outputs',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .outputs({
              result: '${{ steps.upload.outputs.artifact-url }}',
            })
            .run('echo building', { id: 'upload' });
        })
        .build();

      expect(workflow.jobs[0]!.outputs).toEqual({
        result: '${{ steps.upload.outputs.artifact-url }}',
      });
    });

    it('omits empty outputs map from built workflow', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('empty_outputs'),
        name: 'Empty Outputs',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').outputs({}).run('echo hello');
        })
        .build();

      expect(workflow.jobs[0]).not.toHaveProperty('outputs');
    });

    it('rejects blank output keys', () => {
      const builder = defineWorkflow({
        id: createWorkflowId('blank_output_key'),
        name: 'Blank Output Key',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').outputs({ '': 'value' }).run('echo hello');
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "build" outputs must not contain blank keys'])
      );
    });

    it('rejects blank output values', () => {
      const builder = defineWorkflow({
        id: createWorkflowId('blank_output_value'),
        name: 'Blank Output Value',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').outputs({ key: '  ' }).run('echo hello');
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError(['job "build" outputs key "key" must not have a blank value'])
      );
    });

    it('rejects output referencing undeclared step ID', () => {
      const builder = defineWorkflow({
        id: createWorkflowId('undeclared_step_ref'),
        name: 'Undeclared Step Ref',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .outputs({ result: '${{ steps.missing.outputs.value }}' })
            .run('echo hello');
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "build" outputs key "result" references undeclared step id "missing"',
        ])
      );
    });

    it('accepts output referencing a declared step ID', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('declared_step_ref'),
        name: 'Declared Step Ref',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .outputs({ result: '${{ steps.upload.outputs.value }}' })
            .run('echo building', { id: 'upload' });
        })
        .build();

      expect(workflow.jobs[0]!.outputs).toEqual({
        result: '${{ steps.upload.outputs.value }}',
      });
    });

    it('accepts output with non-step expressions', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('non_step_expr'),
        name: 'Non Step Expr',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .outputs({
              dep_result: '${{ needs.build.outputs.result }}',
              env_val: '${{ env.FOO }}',
            })
            .run('echo hello');
        })
        .build();

      expect(workflow.jobs[0]!.outputs).toEqual({
        dep_result: '${{ needs.build.outputs.result }}',
        env_val: '${{ env.FOO }}',
      });
    });

    it('reports only invalid step references when value has multiple', () => {
      const builder = defineWorkflow({
        id: createWorkflowId('multi_step_ref'),
        name: 'Multi Step Ref',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .outputs({
              combined: '${{ steps.valid.outputs.a }}-${{ steps.invalid.outputs.b }}',
            })
            .run('echo hello', { id: 'valid' });
        });

      expect(() => builder.build()).toThrowError(
        new WorkflowValidationError([
          'job "build" outputs key "combined" references undeclared step id "invalid"',
        ])
      );
    });

    it('accepts output with no step references at all', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('no_step_ref'),
        name: 'No Step Ref',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').outputs({ result: 'literal-value' }).run('echo hello');
        })
        .build();

      expect(workflow.jobs[0]!.outputs).toEqual({ result: 'literal-value' });
    });

    it('deep-freezes built workflow step IDs', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('frozen_step_ids'),
        name: 'Frozen Step IDs',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job.runsOn('ubuntu-latest').run('echo hello', { id: 'build-step' });
        })
        .build();

      expect(Object.isFrozen(workflow.jobs[0]!.steps[0]!)).toBe(true);
      expect(() => {
        (workflow.jobs[0]!.steps[0] as unknown as Record<string, unknown>).id = 'hacked';
      }).toThrow(TypeError);
    });

    it('deep-freezes built job outputs', () => {
      const workflow = defineWorkflow({
        id: createWorkflowId('frozen_outputs'),
        name: 'Frozen Outputs',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .outputs({ result: '${{ steps.upload.outputs.value }}' })
            .run('echo building', { id: 'upload' });
        })
        .build();

      expect(Object.isFrozen(workflow.jobs[0]!.outputs)).toBe(true);
      expect(() => {
        (workflow.jobs[0]!.outputs as Record<string, string>).result = 'hacked';
      }).toThrow(TypeError);
    });
  });
});
