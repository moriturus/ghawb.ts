import { createJobId, createWorkflowId, defineWorkflow } from '@ghawb/sdk';

export default defineWorkflow({
  id: createWorkflowId('publish'),
  name: 'Publish',
})
  .onPush({
    tags: ['v*'],
  })
  .permissions('read-all')
  .addJob(createJobId('publish-npm'), (job) => {
    job
      .displayName('Publish to npm')
      .runsOn('ubuntu-latest')
      .permissions({ contents: 'read' })
      .uses('actions/checkout@v4', {
        name: 'Checkout',
      })
      .uses('actions/setup-node@v4', {
        name: 'Setup Node',
        with: {
          'node-version': '24',
          'registry-url': 'https://registry.npmjs.org',
        },
      })
      .run('npm ci', {
        name: 'Install Dependencies',
      })
      .run(
        'tsc -p packages/shared/tsconfig.build.json && tsc -p packages/sdk/tsconfig.build.json && tsc -p packages/cli/tsconfig.build.json',
        {
          name: 'Build Packages',
        }
      )
      .run('npm test', {
        name: 'Run Tests',
      })
      .run(
        [
          'npm publish --workspace packages/shared --access public',
          'npm publish --workspace packages/sdk --access public',
          'npm publish --workspace packages/cli --access public',
        ].join(' && '),
        {
          name: 'Publish to npm',
          env: {
            NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}',
          },
        }
      );
  })
  .addJob(createJobId('publish-jsr'), (job) => {
    job
      .displayName('Publish to JSR')
      .runsOn('ubuntu-latest')
      .permissions({
        contents: 'read',
        'id-token': 'write',
      })
      .uses('actions/checkout@v4', {
        name: 'Checkout',
      })
      .run('npx jsr publish', {
        name: 'Publish to JSR',
      });
  })
  .addJob(createJobId('github-release'), (job) => {
    job
      .displayName('Create GitHub Release')
      .needs(['publish-npm', 'publish-jsr'])
      .runsOn('ubuntu-latest')
      .permissions({
        contents: 'write',
      })
      .uses('actions/checkout@v4', {
        name: 'Checkout',
      })
      .run(
        'gh release create "${{ github.ref_name }}" --title "${{ github.ref_name }}" --generate-notes',
        {
          name: 'Create GitHub Release',
          env: {
            GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
          },
        }
      );
  })
  .build();
