import { createJobId, createWorkflowId, defineWorkflow } from '@ghawb/sdk';

export default defineWorkflow({
  id: createWorkflowId('manual_verify'),
  name: 'Manual Verify',
})
  .onWorkflowDispatch()
  .addJob(createJobId('verify'), (job) => {
    job
      .runsOn('ubuntu-latest')
      .uses('actions/checkout@v4', {
        name: 'Checkout',
      })
      .uses('oven-sh/setup-bun@v2', {
        name: 'Setup Bun',
      })
      .uses('actions/setup-node@v4', {
        name: 'Setup Node',
        with: {
          'node-version': '22',
        },
      })
      .uses('denoland/setup-deno@v2', {
        name: 'Setup Deno',
        with: {
          'deno-version': '2.x',
        },
      })
      .run('bun install --frozen-lockfile', {
        name: 'Install Dependencies',
      })
      .run('bun run verify:pre-push', {
        name: 'Run Manual Verification',
      });
  })
  .build();
