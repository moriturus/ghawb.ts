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
];
