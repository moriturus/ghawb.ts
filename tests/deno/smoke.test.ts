import { createJobId, createWorkflowId, WorkflowValidationError } from '@ghawb/shared';
import { defineWorkflow } from '@ghawb/sdk';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test('Deno can execute the Sprint 1 workflow builder', () => {
  const workflow = defineWorkflow({
    id: createWorkflowId('deno-ci'),
    name: 'Deno CI',
  })
    .onPush()
    .addJob(createJobId('test'), (job) => {
      job.runsOn('ubuntu-latest').run('deno test');
    })
    .build();

  assert(workflow.jobs[0]?.id === 'test', 'expected built workflow job id');
});

Deno.test('Deno sees the shared validation error type', () => {
  const builder = defineWorkflow({
    id: createWorkflowId('broken'),
    name: 'Broken',
  });

  let thrown: unknown;

  try {
    builder.build();
  } catch (error) {
    thrown = error;
  }

  assert(thrown instanceof WorkflowValidationError, 'expected validation error');
});
