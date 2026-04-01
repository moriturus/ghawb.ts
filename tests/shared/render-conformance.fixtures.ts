import {
  createJobId,
  createWorkflowId,
  defineWorkflow,
  type WorkflowDefinition,
  type WorkflowRenderPayload,
} from '@ghawb/sdk';

export interface RenderConformanceFixture {
  readonly name: string;
  readonly workflow: WorkflowDefinition;
  readonly expectedPayload: WorkflowRenderPayload;
  readonly expectedJson: string;
}

export interface ValidationConformanceFixture {
  readonly name: string;
  readonly build: () => WorkflowDefinition;
  readonly expectedIssues: readonly string[];
}

function createRenderFixture(
  name: string,
  workflow: WorkflowDefinition,
  expectedPayload: WorkflowRenderPayload
): RenderConformanceFixture {
  return {
    name,
    workflow,
    expectedPayload,
    expectedJson: JSON.stringify(expectedPayload),
  };
}

export const renderConformanceFixtures: readonly RenderConformanceFixture[] = [
  createRenderFixture(
    'minimal_push',
    defineWorkflow({
      id: createWorkflowId('minimal_push'),
      name: 'Minimal Push',
    })
      .onPush({
        branches: ['main'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build(),
    {
      name: 'Minimal Push',
      on: {
        push: {
          branches: ['main'],
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
    }
  ),
  createRenderFixture(
    'env_workflow_and_job',
    defineWorkflow({
      id: createWorkflowId('env_workflow_and_job'),
      name: 'Env Workflow And Job',
    })
      .onPush({
        branches: ['main'],
      })
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
        job
          .concurrency({
            group: 'build-${{ github.ref }}',
          })
          .env({
            DEPLOY_TARGET: 'staging',
          })
          .runsOn('ubuntu-latest')
          .run('bun run build');
      })
      .addJob(createJobId('test'), (job) => {
        job.needs(createJobId('build')).runsOn('ubuntu-latest').run('bun test');
      })
      .build(),
    {
      name: 'Env Workflow And Job',
      on: {
        push: {
          branches: ['main'],
        },
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
          concurrency: {
            group: 'build-${{ github.ref }}',
          },
          env: {
            DEPLOY_TARGET: 'staging',
          },
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
      },
    }
  ),
  createRenderFixture(
    'workflow_defaults_and_permissions_shorthand',
    defineWorkflow({
      id: createWorkflowId('workflow_defaults_and_permissions_shorthand'),
      name: 'Workflow Defaults And Permissions Shorthand',
    })
      .onPush({
        branches: ['main'],
      })
      .permissions('read-all')
      .defaultsRun({
        shell: 'bash',
        workingDirectory: './',
      })
      .addJob(createJobId('build'), (job) => {
        job
          .permissions('write-all')
          .defaultsRun({
            shell: 'sh',
            workingDirectory: './packages/sdk',
          })
          .runsOn('ubuntu-latest')
          .run('bun run build');
      })
      .build(),
    {
      name: 'Workflow Defaults And Permissions Shorthand',
      on: {
        push: {
          branches: ['main'],
        },
      },
      permissions: 'read-all',
      defaults: {
        run: {
          shell: 'bash',
          'working-directory': './',
        },
      },
      jobs: {
        build: {
          permissions: 'write-all',
          defaults: {
            run: {
              shell: 'sh',
              'working-directory': './packages/sdk',
            },
          },
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun run build',
            },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'dispatch_and_schedule',
    defineWorkflow({
      id: createWorkflowId('dispatch_and_schedule'),
      name: 'Dispatch And Schedule',
    })
      .onPush({
        paths: ['src/**'],
      })
      .onWorkflowDispatch()
      .onSchedule(['0 0 * * *', '30 12 * * 1-5'])
      .addJob(createJobId('check'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run check');
      })
      .build(),
    {
      name: 'Dispatch And Schedule',
      on: {
        push: {
          paths: ['src/**'],
        },
        workflow_dispatch: null,
        schedule: [{ cron: '0 0 * * *' }, { cron: '30 12 * * 1-5' }],
      },
      jobs: {
        check: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun run check',
            },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'needs_pipeline',
    defineWorkflow({
      id: createWorkflowId('needs_pipeline'),
      name: 'Needs Pipeline',
    })
      .onPullRequest({
        branches: ['main'],
      })
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
          .run('bun run deploy', {
            name: 'Deploy',
          });
      })
      .build(),
    {
      name: 'Needs Pipeline',
      on: {
        pull_request: {
          branches: ['main'],
        },
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
              name: 'Deploy',
              run: 'bun run deploy',
            },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'expanded_surface',
    defineWorkflow({
      id: createWorkflowId('expanded_surface'),
      name: 'Expanded Surface',
    })
      .onWorkflowDispatch()
      .permissions({
        actions: 'read',
        contents: 'write',
      })
      .concurrency({
        group: 'expanded-surface',
        cancelInProgress: true,
      })
      .addJob(createJobId('lint'), (job) => {
        job
          .permissions({
            checks: 'write',
            'id-token': 'write',
          })
          .timeoutMinutes(15)
          .defaultsRun({
            shell: 'bash',
            workingDirectory: './packages/sdk',
          })
          .strategyMatrix({
            os: ['ubuntu-latest', 'windows-latest'],
            node: ['20', '22'],
          })
          .runsOn('${{ matrix.os }}')
          .run('bun test', {
            shell: 'sh',
            workingDirectory: './packages/sdk',
          });
      })
      .addJob(createJobId('publish'), (job) => {
        job
          .needs(createJobId('lint'))
          .concurrency({
            group: 'publish-${{ github.ref }}',
          })
          .runsOn('ubuntu-latest')
          .uses('actions/checkout@v4', {
            name: 'Checkout',
          })
          .run('bun run release', {
            name: 'Release',
          });
      })
      .build(),
    {
      name: 'Expanded Surface',
      on: {
        workflow_dispatch: null,
      },
      permissions: {
        actions: 'read',
        contents: 'write',
      },
      concurrency: {
        group: 'expanded-surface',
        'cancel-in-progress': true,
      },
      jobs: {
        lint: {
          permissions: {
            checks: 'write',
            'id-token': 'write',
          },
          'timeout-minutes': 15,
          defaults: {
            run: {
              shell: 'bash',
              'working-directory': './packages/sdk',
            },
          },
          strategy: {
            matrix: {
              os: ['ubuntu-latest', 'windows-latest'],
              node: ['20', '22'],
            },
          },
          'runs-on': '${{ matrix.os }}',
          steps: [
            {
              shell: 'sh',
              'working-directory': './packages/sdk',
              run: 'bun test',
            },
          ],
        },
        publish: {
          needs: ['lint'],
          concurrency: {
            group: 'publish-${{ github.ref }}',
          },
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout',
              uses: 'actions/checkout@v4',
            },
            {
              name: 'Release',
              run: 'bun run release',
            },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'pr_types_with_branches_and_paths',
    defineWorkflow({
      id: createWorkflowId('pr_types_with_branches_and_paths'),
      name: 'PR Types With Branches And Paths',
    })
      .onPullRequest({
        branches: ['main'],
        paths: ['packages/**'],
        types: ['opened', 'synchronize', 'labeled'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build(),
    {
      name: 'PR Types With Branches And Paths',
      on: {
        pull_request: {
          branches: ['main'],
          paths: ['packages/**'],
          types: ['opened', 'synchronize', 'labeled'],
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
    }
  ),
  createRenderFixture(
    'push_tags_with_negation_filters',
    defineWorkflow({
      id: createWorkflowId('push_tags_with_negation_filters'),
      name: 'Push Tags With Negation Filters',
    })
      .onPush({
        branchesIgnore: ['dependabot/**'],
        pathsIgnore: ['docs/**'],
        tags: ['v*', 'release-*'],
      })
      .addJob(createJobId('test'), (job) => {
        job.runsOn('ubuntu-latest').run('bun test');
      })
      .build(),
    {
      name: 'Push Tags With Negation Filters',
      on: {
        push: {
          'branches-ignore': ['dependabot/**'],
          'paths-ignore': ['docs/**'],
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
    }
  ),
  createRenderFixture(
    'step_ids_and_job_outputs',
    defineWorkflow({
      id: createWorkflowId('step_ids_and_job_outputs'),
      name: 'Step IDs and Job Outputs',
    })
      .onPush()
      .addJob(createJobId('build'), (job) => {
        job
          .runsOn('ubuntu-latest')
          .outputs({
            artifact: '${{ steps.upload.outputs.artifact-url }}',
          })
          .run('echo building', { id: 'build-step' })
          .uses('actions/upload-artifact@v4', { id: 'upload', with: { path: 'dist' } });
      })
      .build(),
    {
      name: 'Step IDs and Job Outputs',
      on: {
        push: null,
      },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          outputs: {
            artifact: '${{ steps.upload.outputs.artifact-url }}',
          },
          steps: [
            { id: 'build-step', run: 'echo building' },
            { id: 'upload', with: { path: 'dist' }, uses: 'actions/upload-artifact@v4' },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'strategy_full_surface',
    defineWorkflow({
      id: createWorkflowId('strategy_full_surface'),
      name: 'Strategy Full Surface',
    })
      .onPush()
      .addJob(createJobId('test'), (job) => {
        job
          .strategyFailFast(false)
          .strategyMaxParallel(2)
          .strategyMatrix({
            os: ['ubuntu-latest', 'windows-latest'],
            node: ['18', '20'],
          })
          .strategyInclude([{ os: 'macos-latest', node: '22', experimental: 'true' }])
          .strategyExclude([{ os: 'windows-latest', node: '18' }])
          .runsOn('${{ matrix.os }}')
          .run('bun test');
      })
      .build(),
    {
      name: 'Strategy Full Surface',
      on: {
        push: null,
      },
      jobs: {
        test: {
          strategy: {
            'fail-fast': false,
            'max-parallel': 2,
            matrix: {
              os: ['ubuntu-latest', 'windows-latest'],
              node: ['18', '20'],
              include: [{ os: 'macos-latest', node: '22', experimental: 'true' }],
              exclude: [{ os: 'windows-latest', node: '18' }],
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
    }
  ),
  createRenderFixture(
    'step_continue_on_error_and_timeout',
    defineWorkflow({
      id: createWorkflowId('step_continue_on_error_and_timeout'),
      name: 'Step Continue On Error And Timeout',
    })
      .onPush()
      .addJob(createJobId('test'), (job) => {
        job
          .runsOn('ubuntu-latest')
          .run('bun run lint', {
            name: 'Lint',
            continueOnError: true,
            timeoutMinutes: 10,
          })
          .uses('actions/checkout@v4', {
            continueOnError: false,
            timeoutMinutes: 5,
          });
      })
      .build(),
    {
      name: 'Step Continue On Error And Timeout',
      on: {
        push: null,
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Lint',
              'continue-on-error': true,
              'timeout-minutes': 10,
              run: 'bun run lint',
            },
            {
              'continue-on-error': false,
              'timeout-minutes': 5,
              uses: 'actions/checkout@v4',
            },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'dispatch_with_inputs',
    defineWorkflow({
      id: createWorkflowId('dispatch_with_inputs'),
      name: 'Dispatch With Inputs',
    })
      .onWorkflowDispatch({
        environment: {
          description: 'Target environment',
          required: true,
          default: 'staging',
          type: 'choice',
          options: ['staging', 'production'],
        },
        log_level: {
          description: 'Log verbosity',
          type: 'string',
        },
        dry_run: {
          type: 'boolean',
          required: false,
        },
      })
      .addJob(createJobId('deploy'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run deploy');
      })
      .build(),
    {
      name: 'Dispatch With Inputs',
      on: {
        workflow_dispatch: {
          inputs: {
            environment: {
              description: 'Target environment',
              required: true,
              default: 'staging',
              type: 'choice',
              options: ['staging', 'production'],
            },
            log_level: {
              description: 'Log verbosity',
              type: 'string',
            },
            dry_run: {
              required: false,
              type: 'boolean',
            },
          },
        },
      },
      jobs: {
        deploy: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'bun run deploy',
            },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'job_if_and_continue_on_error',
    defineWorkflow({
      id: createWorkflowId('job_if_and_continue_on_error'),
      name: 'Job If And Continue On Error',
    })
      .onPush({ branches: ['main'] })
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run build');
      })
      .addJob(createJobId('deploy'), (job) => {
        job
          .ifCondition("github.ref == 'refs/heads/main'")
          .needs(createJobId('build'))
          .continueOnError(true)
          .runsOn('ubuntu-latest')
          .run('echo deploy');
      })
      .build(),
    {
      name: 'Job If And Continue On Error',
      on: {
        push: {
          branches: ['main'],
        },
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
        deploy: {
          if: "github.ref == 'refs/heads/main'",
          needs: ['build'],
          'continue-on-error': true,
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'echo deploy',
            },
          ],
        },
      },
    }
  ),
];

export const validationConformanceFixtures: readonly ValidationConformanceFixture[] = [
  {
    name: 'invalid_schedule',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('invalid_schedule'),
        name: 'Invalid Schedule',
      })
        .onSchedule([' ', '0 0 * * *'])
        .addJob(createJobId('check'), (job) => {
          job.runsOn('ubuntu-latest').run('bun test');
        })
        .build(),
    expectedIssues: ['trigger "schedule" cron must not contain blank values'],
  },
  {
    name: 'blank_env_keys',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('blank_env_keys'),
        name: 'Blank Env Keys',
      })
        .onPush()
        .env({
          '': 'workflow-value',
        })
        .addJob(createJobId('build'), (job) => {
          job
            .env({
              ' ': 'job-value',
            })
            .runsOn('ubuntu-latest')
            .run('bun test');
        })
        .build(),
    expectedIssues: [
      'workflow env must not contain blank keys',
      'job "build" env must not contain blank keys',
    ],
  },
  {
    name: 'unknown_pr_activity_types',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('unknown_pr_activity_types'),
        name: 'Unknown PR Activity Types',
      })
        .onPullRequest({
          types: ['opened', 'merged' as never, 'approved' as never],
        })
        .addJob(createJobId('test'), (job) => {
          job.runsOn('ubuntu-latest').run('bun test');
        })
        .build(),
    expectedIssues: [
      'trigger "pull_request" types contains unknown activity type "merged"',
      'trigger "pull_request" types contains unknown activity type "approved"',
    ],
  },
  {
    name: 'branches_mutual_exclusion',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('branches_mutual_exclusion'),
        name: 'Branches Mutual Exclusion',
      })
        .onPush({
          branches: ['main'],
          branchesIgnore: ['dependabot/**'],
        })
        .addJob(createJobId('test'), (job) => {
          job.runsOn('ubuntu-latest').run('bun test');
        })
        .build(),
    expectedIssues: ['trigger "push" must not combine branches and branches-ignore'],
  },
  {
    name: 'step_id_duplicate_rejected',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('dup_step_id'),
        name: 'Dup Step ID',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .run('echo first', { id: 'same-id' })
            .run('echo second', { id: 'same-id' });
        })
        .build(),
    expectedIssues: ['job "test" contains duplicate step id "same-id"'],
  },
  {
    name: 'step_id_format_rejected',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('bad_step_id_format'),
        name: 'Bad Step ID Format',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job.runsOn('ubuntu-latest').run('echo first', { id: '1start' });
        })
        .build(),
    expectedIssues: ['job "test" step 1 id must match ^[a-zA-Z_][a-zA-Z0-9_-]*$'],
  },
  {
    name: 'job_output_undeclared_step_ref',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('bad_output_ref'),
        name: 'Bad Output Ref',
      })
        .onPush()
        .addJob(createJobId('build'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .outputs({ result: '${{ steps.missing.outputs.value }}' })
            .run('echo hi');
        })
        .build(),
    expectedIssues: ['job "build" outputs key "result" references undeclared step id "missing"'],
  },
  {
    name: 'strategy_exclude_undeclared_axis',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('strategy_exclude_bad'),
        name: 'Strategy Exclude Bad',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .strategyMatrix({
              os: ['ubuntu-latest'],
            })
            .strategyExclude([{ os: 'ubuntu-latest', runtime: 'node' }])
            .runsOn('ubuntu-latest')
            .run('bun test');
        })
        .build(),
    expectedIssues: [
      'job "test" strategy.matrix exclude entry 1 references undeclared axis "runtime"',
    ],
  },
  {
    name: 'matrix_axis_format_rejected',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('bad_matrix_axis_format'),
        name: 'Bad Matrix Axis Format',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .strategyMatrix({
              '1os': ['ubuntu-latest'],
            } as unknown as import('@ghawb/sdk').WorkflowMatrix)
            .runsOn('ubuntu-latest')
            .run('bun test');
        })
        .build(),
    expectedIssues: ['job "test" strategy.matrix axis "1os" must match ^[a-zA-Z_][a-zA-Z0-9_-]*$'],
  },
  {
    name: 'dispatch_choice_without_options',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('dispatch_choice_without_options'),
        name: 'Dispatch Choice Without Options',
      })
        .onWorkflowDispatch({
          environment: {
            description: 'Target environment',
            type: 'choice',
          },
        })
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('bun run deploy');
        })
        .build(),
    expectedIssues: [
      'trigger "workflow_dispatch" input "environment" type "choice" requires non-empty options',
    ],
  },
  {
    name: 'dispatch_input_name_format_rejected',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('bad_dispatch_input_name'),
        name: 'Bad Dispatch Input Name',
      })
        .onWorkflowDispatch({
          '1start': {
            description: 'bad',
          },
        } as unknown as import('@ghawb/sdk').WorkflowDispatchInputs)
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('bun run deploy');
        })
        .build(),
    expectedIssues: [
      'trigger "workflow_dispatch" input "1start" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$',
    ],
  },
  {
    name: 'job_blank_if_expression',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('job_blank_if'),
        name: 'Job Blank If',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job.ifCondition('  ').runsOn('ubuntu-latest').run('bun test');
        })
        .build(),
    expectedIssues: ['job "test" if must be a non-blank string'],
  },
  {
    name: 'job_non_boolean_continue_on_error',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('job_bad_continue'),
        name: 'Job Bad Continue',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job
            .continueOnError('yes' as unknown as boolean)
            .runsOn('ubuntu-latest')
            .run('bun test');
        })
        .build(),
    expectedIssues: ['job "test" continue-on-error must be a boolean'],
  },
];
