import {
  createJobId,
  createWorkflowId,
  defineWorkflow,
  RunnerLabel,
  type PullRequestTriggerFilter,
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
  createRenderFixture(
    'workflow_call_and_reusable_job',
    defineWorkflow({
      id: createWorkflowId('workflow_call_and_reusable_job'),
      name: 'Workflow Call And Reusable Job',
    })
      .onWorkflowCall({
        inputs: {
          environment: {
            description: 'Target environment',
            required: true,
            default: 'staging',
            type: 'string',
          },
        },
        outputs: {
          artifact_url: {
            description: 'Artifact URL',
            value: '${{ jobs.build.outputs.artifact_url }}',
          },
        },
        secrets: {
          github_token: {
            description: 'GitHub token',
            required: true,
          },
        },
      })
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('bun run build');
      })
      .addJob(createJobId('deploy'), (job) => {
        job
          .needs(createJobId('build'))
          .continueOnError(true)
          .usesWorkflow('./.github/workflows/deploy.yml@main', {
            with: {
              environment: 'production',
            },
            secrets: 'inherit',
          });
      })
      .build(),
    {
      name: 'Workflow Call And Reusable Job',
      on: {
        workflow_call: {
          inputs: {
            environment: {
              description: 'Target environment',
              required: true,
              default: 'staging',
              type: 'string',
            },
          },
          outputs: {
            artifact_url: {
              description: 'Artifact URL',
              value: '${{ jobs.build.outputs.artifact_url }}',
            },
          },
          secrets: {
            github_token: {
              description: 'GitHub token',
              required: true,
            },
          },
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
          needs: ['build'],
          'continue-on-error': true,
          secrets: 'inherit',
          with: {
            environment: 'production',
          },
          uses: './.github/workflows/deploy.yml@main',
        },
      },
    }
  ),
  createRenderFixture(
    'container_and_services',
    defineWorkflow({
      id: createWorkflowId('container_and_services'),
      name: 'Container And Services',
    })
      .onPush()
      .addJob(createJobId('containerized'), (job) => {
        job
          .runsOn('ubuntu-latest')
          .container({
            image: 'node:20',
            credentials: { username: 'user', password: '${{ secrets.DOCKER_PASSWORD }}' },
            env: { NODE_ENV: 'test' },
            ports: [80, '8080:80'],
            volumes: ['/data:/data'],
            options: '--cpus 2',
          })
          .run('npm test');
      })
      .addJob(createJobId('with_services'), (job) => {
        job
          .runsOn('ubuntu-latest')
          .services({
            postgres: {
              image: 'postgres:15',
              env: { POSTGRES_PASSWORD: 'test' },
              ports: [5432],
            },
            redis: {
              image: 'redis:7',
            },
          })
          .run('npm test');
      })
      .build(),
    {
      name: 'Container And Services',
      on: {
        push: null,
      },
      jobs: {
        containerized: {
          'runs-on': 'ubuntu-latest',
          container: {
            image: 'node:20',
            credentials: { username: 'user', password: '${{ secrets.DOCKER_PASSWORD }}' },
            env: { NODE_ENV: 'test' },
            ports: [80, '8080:80'],
            volumes: ['/data:/data'],
            options: '--cpus 2',
          },
          steps: [
            {
              run: 'npm test',
            },
          ],
        },
        with_services: {
          'runs-on': 'ubuntu-latest',
          services: {
            postgres: {
              image: 'postgres:15',
              env: { POSTGRES_PASSWORD: 'test' },
              ports: [5432],
            },
            redis: {
              image: 'redis:7',
            },
          },
          steps: [
            {
              run: 'npm test',
            },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'display_names',
    defineWorkflow({
      id: createWorkflowId('display_names'),
      name: 'Display Names',
    })
      .runName('Build ${{ github.ref_name }}')
      .onPush({
        branches: ['main'],
      })
      .addJob(createJobId('build'), (job) => {
        job.displayName('Build & Test').runsOn('ubuntu-latest').run('npm test');
      })
      .addJob(createJobId('deploy'), (job) => {
        job
          .displayName('Deploy to staging')
          .needs(createJobId('build'))
          .usesWorkflow('org/repo/.github/workflows/deploy.yml@main');
      })
      .build(),
    {
      name: 'Display Names',
      'run-name': 'Build ${{ github.ref_name }}',
      on: {
        push: {
          branches: ['main'],
        },
      },
      jobs: {
        build: {
          name: 'Build & Test',
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              run: 'npm test',
            },
          ],
        },
        deploy: {
          name: 'Deploy to staging',
          needs: ['build'],
          uses: 'org/repo/.github/workflows/deploy.yml@main',
        },
      },
    }
  ),
  createRenderFixture(
    'environment_string',
    defineWorkflow({
      id: createWorkflowId('environment_string'),
      name: 'Environment String',
    })
      .onPush({ branches: ['main'] })
      .addJob(createJobId('deploy'), (job) => {
        job.runsOn('ubuntu-latest').environment('production').run('deploy.sh');
      })
      .build(),
    {
      name: 'Environment String',
      on: { push: { branches: ['main'] } },
      jobs: {
        deploy: {
          'runs-on': 'ubuntu-latest',
          environment: 'production',
          steps: [{ run: 'deploy.sh' }],
        },
      },
    }
  ),
  createRenderFixture(
    'environment_object',
    defineWorkflow({
      id: createWorkflowId('environment_object'),
      name: 'Environment Object',
    })
      .onPush({ branches: ['main'] })
      .addJob(createJobId('deploy'), (job) => {
        job
          .runsOn('ubuntu-latest')
          .environment({ name: 'production', url: 'https://example.com' })
          .run('deploy.sh');
      })
      .build(),
    {
      name: 'Environment Object',
      on: { push: { branches: ['main'] } },
      jobs: {
        deploy: {
          'runs-on': 'ubuntu-latest',
          environment: { name: 'production', url: 'https://example.com' },
          steps: [{ run: 'deploy.sh' }],
        },
      },
    }
  ),
  createRenderFixture(
    'pull_request_target_with_types',
    defineWorkflow({
      id: createWorkflowId('pull_request_target_with_types'),
      name: 'PR Target',
    })
      .onPullRequestTarget({
        branches: ['main'],
        types: ['opened', 'synchronize', 'labeled'],
      })
      .addJob(createJobId('label_check'), (job) => {
        job.runsOn('ubuntu-latest').run('echo "checking labels"');
      })
      .build(),
    {
      name: 'PR Target',
      on: {
        pull_request_target: {
          branches: ['main'],
          types: ['opened', 'synchronize', 'labeled'],
        },
      },
      jobs: {
        label_check: {
          'runs-on': 'ubuntu-latest',
          steps: [{ run: 'echo "checking labels"' }],
        },
      },
    }
  ),
  createRenderFixture(
    'workflow_run_minimal',
    defineWorkflow({
      id: createWorkflowId('workflow_run_minimal'),
      name: 'Deploy After CI',
    })
      .onWorkflowRun({ workflows: 'CI' })
      .addJob(createJobId('deploy'), (job) => {
        job.runsOn('ubuntu-latest').run('deploy.sh');
      })
      .build(),
    {
      name: 'Deploy After CI',
      on: { workflow_run: { workflows: ['CI'] } },
      jobs: {
        deploy: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'deploy.sh' }] },
      },
    }
  ),
  createRenderFixture(
    'workflow_run_full',
    defineWorkflow({
      id: createWorkflowId('workflow_run_full'),
      name: 'Deploy On Complete',
    })
      .onWorkflowRun({
        workflows: ['CI', 'Lint'],
        types: ['completed'],
        branches: ['main', 'release/*'],
      })
      .addJob(createJobId('deploy'), (job) => {
        job.runsOn('ubuntu-latest').run('deploy.sh');
      })
      .build(),
    {
      name: 'Deploy On Complete',
      on: {
        workflow_run: {
          workflows: ['CI', 'Lint'],
          types: ['completed'],
          branches: ['main', 'release/*'],
        },
      },
      jobs: {
        deploy: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'deploy.sh' }] },
      },
    }
  ),
  createRenderFixture(
    'simple_event_with_types',
    defineWorkflow({
      id: createWorkflowId('simple_event_with_types'),
      name: 'Issue Handler',
    })
      .onEvent('issues', { types: ['opened', 'closed'] })
      .addJob(createJobId('handle'), (job) => {
        job.runsOn('ubuntu-latest').run('echo "issue event"');
      })
      .build(),
    {
      name: 'Issue Handler',
      on: { issues: { types: ['opened', 'closed'] } },
      jobs: {
        handle: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo "issue event"' }] },
      },
    }
  ),
  createRenderFixture(
    'simple_event_bare',
    defineWorkflow({
      id: createWorkflowId('simple_event_bare'),
      name: 'Fork Handler',
    })
      .onEvent('fork')
      .addJob(createJobId('notify'), (job) => {
        job.runsOn('ubuntu-latest').run('echo "forked"');
      })
      .build(),
    {
      name: 'Fork Handler',
      on: { fork: null },
      jobs: {
        notify: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo "forked"' }] },
      },
    }
  ),
  createRenderFixture(
    'repository_dispatch_with_types',
    defineWorkflow({
      id: createWorkflowId('repository_dispatch_with_types'),
      name: 'Dispatch Handler',
    })
      .onEvent('repository_dispatch', { types: ['deploy', 'rollback'] })
      .addJob(createJobId('handle'), (job) => {
        job.runsOn('ubuntu-latest').run('echo "dispatched"');
      })
      .build(),
    {
      name: 'Dispatch Handler',
      on: { repository_dispatch: { types: ['deploy', 'rollback'] } },
      jobs: {
        handle: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo "dispatched"' }] },
      },
    }
  ),
  createRenderFixture(
    'multi_trigger_with_simple_events',
    defineWorkflow({
      id: createWorkflowId('multi_trigger'),
      name: 'Multi Trigger',
    })
      .onPush({ branches: ['main'] })
      .onEvent('release', { types: ['published'] })
      .onEvent('create')
      .addJob(createJobId('build'), (job) => {
        job.runsOn('ubuntu-latest').run('npm build');
      })
      .build(),
    {
      name: 'Multi Trigger',
      on: {
        push: { branches: ['main'] },
        create: null,
        release: { types: ['published'] },
      },
      jobs: {
        build: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'npm build' }] },
      },
    }
  ),
  createRenderFixture(
    'typed_runner_labels',
    defineWorkflow({
      id: createWorkflowId('typed_runner_labels'),
      name: 'Typed Runners',
    })
      .onPush({ branches: ['main'] })
      .addJob(createJobId('linux'), (job) => {
        job.runsOn(RunnerLabel.UbuntuLatest).run('echo linux');
      })
      .addJob(createJobId('macos'), (job) => {
        job.runsOn(RunnerLabel.MacOS15).run('echo macos');
      })
      .addJob(createJobId('windows'), (job) => {
        job.runsOn(RunnerLabel.WindowsLatest).run('echo windows');
      })
      .addJob(createJobId('multi'), (job) => {
        job.runsOn([RunnerLabel.UbuntuLatest, 'self-hosted']).run('echo multi');
      })
      .build(),
    {
      name: 'Typed Runners',
      on: { push: { branches: ['main'] } },
      jobs: {
        linux: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo linux' }] },
        macos: { 'runs-on': 'macos-15', steps: [{ run: 'echo macos' }] },
        windows: { 'runs-on': 'windows-latest', steps: [{ run: 'echo windows' }] },
        multi: { 'runs-on': ['ubuntu-latest', 'self-hosted'], steps: [{ run: 'echo multi' }] },
      },
    }
  ),
  createRenderFixture(
    'all_action_ref_forms',
    defineWorkflow({
      id: createWorkflowId('all_action_ref_forms'),
      name: 'All Action Ref Forms',
    })
      .onPush()
      .addJob(createJobId('build'), (job) => {
        job
          .runsOn('ubuntu-latest')
          .uses('actions/checkout@v4', { name: 'External' })
          .uses('./my-action', { name: 'Local' })
          .uses('docker://alpine:3.8', { name: 'Docker' });
      })
      .build(),
    {
      name: 'All Action Ref Forms',
      on: { push: null },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [
            { name: 'External', uses: 'actions/checkout@v4' },
            { name: 'Local', uses: './my-action' },
            { name: 'Docker', uses: 'docker://alpine:3.8' },
          ],
        },
      },
    }
  ),
  createRenderFixture(
    'all_workflow_ref_forms',
    defineWorkflow({
      id: createWorkflowId('all_workflow_ref_forms'),
      name: 'All Workflow Ref Forms',
    })
      .onPush()
      .addJob(createJobId('external'), (job) => {
        job.usesWorkflow('org/repo/.github/workflows/ci.yml@main');
      })
      .addJob(createJobId('local'), (job) => {
        job.usesWorkflow('./.github/workflows/deploy.yml');
      })
      .build(),
    {
      name: 'All Workflow Ref Forms',
      on: { push: null },
      jobs: {
        external: {
          uses: 'org/repo/.github/workflows/ci.yml@main',
        },
        local: {
          uses: './.github/workflows/deploy.yml',
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
    name: 'invalid_workflow_call_and_reusable_job',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('invalid_workflow_call_and_reusable_job'),
        name: 'Invalid Workflow Call And Reusable Job',
      })
        .onWorkflowCall({
          inputs: {
            choice_input: {
              type: 'choice' as unknown as 'string',
              options: ['a', 'b'],
            } as unknown as import('../../packages/sdk/src/index.ts').WorkflowCallInput,
          },
          outputs: {
            'bad/name': {
              value: ' ',
            },
          } as unknown as import('../../packages/sdk/src/index.ts').WorkflowCallOutputs,
        })
        .addJob(createJobId('deploy'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .run('echo deploy')
            .usesWorkflow('./.github/workflows/deploy.yml@main', {
              secrets: {
                ' ': '${{ secrets.GITHUB_TOKEN }}',
              },
            });
        })
        .build(),
    expectedIssues: [
      'trigger "workflow_call" input "choice_input" type "choice" is not supported. Expected: one of "string", "boolean", "number", "environment"',
      'trigger "workflow_call" input "choice_input" options is not supported. Remove the options field',
      'trigger "workflow_call" output "bad/name" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
      'trigger "workflow_call" output "bad/name" value must be a non-blank string',
      'job "deploy" reusable workflow job must not define runs-on. Only step-based jobs support runs-on',
      'job "deploy" reusable workflow job must not define inline steps. Only step-based jobs support inline steps',
      'job "deploy" secrets must not contain blank keys',
    ],
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
      'trigger "pull_request" types contains unknown activity type "merged". Expected: one of "assigned", "unassigned", "labeled", "unlabeled", "opened", "edited", "closed", "reopened", "synchronize", "converted_to_draft", "ready_for_review", "locked", "unlocked", "review_requested", "review_request_removed", "auto_merge_enabled", "auto_merge_disabled"',
      'trigger "pull_request" types contains unknown activity type "approved". Expected: one of "assigned", "unassigned", "labeled", "unlabeled", "opened", "edited", "closed", "reopened", "synchronize", "converted_to_draft", "ready_for_review", "locked", "unlocked", "review_requested", "review_request_removed", "auto_merge_enabled", "auto_merge_disabled"',
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
    expectedIssues: [
      'trigger "push" must not combine branches and branches-ignore. Use one or the other, not both',
    ],
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
    expectedIssues: [
      'job "test" step 1 id must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
    ],
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
    expectedIssues: [
      'job "test" strategy.matrix axis "1os" must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
    ],
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
      'trigger "workflow_dispatch" input "environment" type "choice" requires non-empty options. Expected: a non-empty array of string options',
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
      'trigger "workflow_dispatch" input "1start" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
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
    expectedIssues: ['job "test" continue-on-error must be a boolean. Expected: true or false'],
  },
  {
    name: 'invalid_container_and_services',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('invalid_container_services'),
        name: 'Invalid Container Services',
      })
        .onPush()
        .addJob(createJobId('bad_container'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .container({ image: '  ', ports: ['  '] })
            .services({ '1bad': { image: 'redis:7' } })
            .run('bun test');
        })
        .build(),
    expectedIssues: [
      'job "bad_container" container image must be a non-blank string',
      'job "bad_container" container ports must not contain blank strings',
      'job "bad_container" service "1bad" name must match ^[a-zA-Z_][a-zA-Z0-9_-]*$. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens',
    ],
  },
  {
    name: 'reusable_workflow_rejects_container',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('reusable_with_container'),
        name: 'Reusable With Container',
      }).onPush();
      builder.addJob(createJobId('call'), (job) => {
        (job as unknown as { jobContainer: { image: string } }).jobContainer = {
          image: 'node:20',
        };
        job.usesWorkflow('org/repo/.github/workflows/ci.yml@main');
      });
      return builder.build();
    },
    expectedIssues: [
      'job "call" reusable workflow job must not define container. Only step-based jobs support container',
    ],
  },
  {
    name: 'blank_run_name',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('blank_run_name'),
        name: 'Blank Run Name',
      })
        .runName('   ')
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job.runsOn('ubuntu-latest').run('echo hi');
        })
        .build(),
    expectedIssues: ['workflow run-name must not be empty'],
  },
  {
    name: 'blank_job_name',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('blank_job_name'),
        name: 'Blank Job Name',
      })
        .onPush()
        .addJob(createJobId('test'), (job) => {
          job.displayName('  ').runsOn('ubuntu-latest').run('echo hi');
        })
        .build(),
    expectedIssues: ['job "test" name must not be empty'],
  },
  {
    name: 'blank_environment_string',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('blank_environment_string'),
        name: 'Blank Environment String',
      })
        .onPush()
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').environment('   ').run('deploy.sh');
        })
        .build(),
    expectedIssues: ['job "deploy" environment name must not be empty'],
  },
  {
    name: 'blank_environment_object_name',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('blank_environment_object_name'),
        name: 'Blank Environment Object Name',
      })
        .onPush()
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').environment({ name: '   ' }).run('deploy.sh');
        })
        .build(),
    expectedIssues: ['job "deploy" environment name must not be empty'],
  },
  {
    name: 'blank_environment_url',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('blank_environment_url'),
        name: 'Blank Environment URL',
      })
        .onPush()
        .addJob(createJobId('deploy'), (job) => {
          job
            .runsOn('ubuntu-latest')
            .environment({ name: 'production', url: '   ' })
            .run('deploy.sh');
        })
        .build(),
    expectedIssues: ['job "deploy" environment url must not be empty'],
  },
  {
    name: 'reusable_workflow_rejects_environment',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('reusable_with_environment'),
        name: 'Reusable With Environment',
      }).onPush();
      builder.addJob(createJobId('call'), (job) => {
        (job as unknown as { jobEnvironment: string }).jobEnvironment = 'production';
        job.usesWorkflow('org/repo/.github/workflows/ci.yml@main');
      });
      return builder.build();
    },
    expectedIssues: [
      'job "call" reusable workflow job must not define environment. Only step-based jobs support environment',
    ],
  },
  {
    name: 'reusable_workflow_rejects_environment_object',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('reusable_with_env_obj'),
        name: 'Reusable With Environment Object',
      }).onPush();
      builder.addJob(createJobId('call'), (job) => {
        (
          job as unknown as {
            jobEnvironment: { name: string; url: string };
          }
        ).jobEnvironment = { name: 'staging', url: 'https://staging.example.com' };
        job.usesWorkflow('org/repo/.github/workflows/ci.yml@main');
      });
      return builder.build();
    },
    expectedIssues: [
      'job "call" reusable workflow job must not define environment. Only step-based jobs support environment',
    ],
  },
  {
    name: 'pull_request_target_rejects_tags',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('prt_tags'),
        name: 'PRT Tags',
      })
        .onPullRequestTarget({ tags: ['v*'] } as unknown as PullRequestTriggerFilter)
        .addJob(createJobId('test'), (job) => {
          job.runsOn('ubuntu-latest').run('echo hi');
        })
        .build(),
    expectedIssues: [
      'trigger "pull_request_target" does not support tags. Supported: branches, branches-ignore, paths, paths-ignore, types',
    ],
  },
  {
    name: 'duplicate_pull_request_target',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('dup_prt'),
        name: 'Dup PRT',
      })
        .onPullRequestTarget()
        .onPullRequestTarget()
        .addJob(createJobId('test'), (job) => {
          job.runsOn('ubuntu-latest').run('echo hi');
        })
        .build(),
    expectedIssues: ['duplicate trigger "pull_request_target"'],
  },
  {
    name: 'workflow_run_blank_workflow_name',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('wfr_blank'),
        name: 'WFR Blank',
      })
        .onWorkflowRun({ workflows: ['CI', '  '] })
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build(),
    expectedIssues: ['trigger "workflow_run" workflows must not contain blank values'],
  },
  {
    name: 'workflow_run_rejects_tags',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('wfr_tags'),
        name: 'WFR Tags',
      });
      builder.triggers.push(
        Object.assign(
          { type: 'workflow_run' as const, workflows: ['CI'] as [string, ...string[]] },
          { tags: ['v1'] }
        ) as unknown as ReturnType<typeof builder.triggers.pop> & object
      );
      return builder
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build();
    },
    expectedIssues: [
      'trigger "workflow_run" does not support tags. Supported: workflows, types, branches, branches-ignore',
    ],
  },
  {
    name: 'workflow_run_rejects_paths',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('wfr_paths'),
        name: 'WFR Paths',
      });
      builder.triggers.push(
        Object.assign(
          { type: 'workflow_run' as const, workflows: ['CI'] as [string, ...string[]] },
          { paths: ['src/**'], pathsIgnore: ['docs/**'], tagsIgnore: ['v0.*'] }
        ) as unknown as ReturnType<typeof builder.triggers.pop> & object
      );
      return builder
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build();
    },
    expectedIssues: [
      'trigger "workflow_run" does not support paths. Supported: workflows, types, branches, branches-ignore',
      'trigger "workflow_run" does not support paths-ignore. Supported: workflows, types, branches, branches-ignore',
      'trigger "workflow_run" does not support tags-ignore. Supported: workflows, types, branches, branches-ignore',
    ],
  },
  {
    name: 'workflow_run_unknown_activity_type',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('wfr_bad_type'),
        name: 'WFR Bad Type',
      })
        .onWorkflowRun({
          workflows: ['CI'],
          types: ['failed' as 'completed'],
        })
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build(),
    expectedIssues: [
      'trigger "workflow_run" types contains unknown activity type "failed". Expected: one of "completed", "requested", "in_progress"',
    ],
  },
  {
    name: 'workflow_run_branches_mutual_exclusion',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('wfr_branch_mx'),
        name: 'WFR Branch MX',
      })
        .onWorkflowRun({
          workflows: ['CI'],
          branches: ['main'],
          branchesIgnore: ['develop'],
        })
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build(),
    expectedIssues: [
      'trigger "workflow_run" must not combine branches and branches-ignore. Use one or the other, not both',
    ],
  },
  {
    name: 'workflow_run_empty_workflows',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('wfr_empty_wf'),
        name: 'WFR Empty WF',
      });
      builder.triggers.push({
        type: 'workflow_run',
        workflows: [] as unknown as [string, ...string[]],
      });
      return builder
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build();
    },
    expectedIssues: ['trigger "workflow_run" workflows must not be empty'],
  },
  {
    name: 'workflow_run_empty_branches',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('wfr_empty_br'),
        name: 'WFR Empty BR',
      });
      builder.triggers.push({
        type: 'workflow_run',
        workflows: ['CI'] as [string, ...string[]],
        branches: [],
      });
      return builder
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build();
    },
    expectedIssues: ['trigger "workflow_run" branches must not be empty'],
  },
  {
    name: 'workflow_run_blank_branch_values',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('wfr_blank_br'),
        name: 'WFR Blank BR',
      });
      builder.triggers.push({
        type: 'workflow_run',
        workflows: ['CI'] as [string, ...string[]],
        branches: ['main', '  '],
      });
      return builder
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build();
    },
    expectedIssues: ['trigger "workflow_run" branches must not contain blank values'],
  },
  {
    name: 'workflow_run_empty_types',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('wfr_empty_ty'),
        name: 'WFR Empty Ty',
      });
      builder.triggers.push({
        type: 'workflow_run',
        workflows: ['CI'] as [string, ...string[]],
        types: [],
      });
      return builder
        .addJob(createJobId('deploy'), (job) => {
          job.runsOn('ubuntu-latest').run('deploy.sh');
        })
        .build();
    },
    expectedIssues: ['trigger "workflow_run" types must not be empty'],
  },
  {
    name: 'simple_event_unknown_activity_type',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('simple_bad_type'),
        name: 'Simple Bad Type',
      })
        .onEvent('issues', { types: ['invalid' as 'opened'] })
        .addJob(createJobId('handle'), (job) => {
          job.runsOn('ubuntu-latest').run('echo "issue event"');
        })
        .build(),
    expectedIssues: [
      'trigger "issues" types contains unknown activity type "invalid". Expected: one of "opened", "edited", "deleted", "transferred", "pinned", "unpinned", "closed", "reopened", "assigned", "unassigned", "labeled", "unlabeled", "locked", "unlocked", "milestoned", "demilestoned"',
    ],
  },
  {
    name: 'simple_event_rejects_branches',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('simple_branches'),
        name: 'Simple Branches',
      });
      builder.triggers.push(
        Object.assign({ type: 'issues' as const }, { branches: ['main'] }) as unknown as ReturnType<
          typeof builder.triggers.pop
        > &
          object
      );
      return builder
        .addJob(createJobId('handle'), (job) => {
          job.runsOn('ubuntu-latest').run('echo "issue event"');
        })
        .build();
    },
    expectedIssues: ['trigger "issues" does not support branches'],
  },
  {
    name: 'bare_event_rejects_types',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('bare_event_types'),
        name: 'Bare Event Types',
      });
      builder.triggers.push({
        type: 'fork' as const,
        types: ['created'],
      } as unknown as ReturnType<typeof builder.triggers.pop> & object);
      return builder
        .addJob(createJobId('handle'), (job) => {
          job.runsOn('ubuntu-latest').run('echo "forked"');
        })
        .build();
    },
    expectedIssues: ['trigger "fork" does not support types'],
  },
  {
    name: 'repository_dispatch_blank_type',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('dispatch_blank'),
        name: 'Dispatch Blank',
      })
        .onEvent('repository_dispatch', { types: ['deploy', '  '] })
        .addJob(createJobId('handle'), (job) => {
          job.runsOn('ubuntu-latest').run('echo "dispatched"');
        })
        .build(),
    expectedIssues: ['trigger "repository_dispatch" types must not contain blank values'],
  },
  {
    name: 'simple_event_rejects_all_filter_fields',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('simple_all_filters'),
        name: 'Simple All Filters',
      });
      builder.triggers.push(
        Object.assign(
          { type: 'issues' as const },
          {
            branchesIgnore: ['dev'],
            paths: ['src/**'],
            pathsIgnore: ['docs/**'],
            tags: ['v1'],
            tagsIgnore: ['v0.*'],
          }
        ) as unknown as ReturnType<typeof builder.triggers.pop> & object
      );
      return builder
        .addJob(createJobId('handle'), (job) => {
          job.runsOn('ubuntu-latest').run('echo "issue event"');
        })
        .build();
    },
    expectedIssues: [
      'trigger "issues" does not support branches-ignore',
      'trigger "issues" does not support paths',
      'trigger "issues" does not support paths-ignore',
      'trigger "issues" does not support tags',
      'trigger "issues" does not support tags-ignore',
    ],
  },
  {
    name: 'repository_dispatch_empty_types',
    build: () =>
      defineWorkflow({
        id: createWorkflowId('dispatch_empty_types'),
        name: 'Dispatch Empty Types',
      })
        .onEvent('repository_dispatch', { types: [] as unknown as [string] })
        .addJob(createJobId('handle'), (job) => {
          job.runsOn('ubuntu-latest').run('echo "dispatched"');
        })
        .build(),
    expectedIssues: ['trigger "repository_dispatch" types must not be empty'],
  },
  {
    name: 'simple_event_empty_types',
    build: () => {
      const builder = defineWorkflow({
        id: createWorkflowId('simple_empty_types'),
        name: 'Simple Empty Types',
      });
      builder.triggers.push({
        type: 'issues' as const,
        types: [],
      });
      return builder
        .addJob(createJobId('handle'), (job) => {
          job.runsOn('ubuntu-latest').run('echo "issue event"');
        })
        .build();
    },
    expectedIssues: ['trigger "issues" types must not be empty'],
  },
];
