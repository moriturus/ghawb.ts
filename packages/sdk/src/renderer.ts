import type { TriggerType, WorkflowDefinition, WorkflowStep, WorkflowTrigger } from './model.ts';

export class WorkflowRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowRenderError';
  }
}

export interface WorkflowRenderTriggerPayload {
  readonly branches?: readonly string[];
  readonly paths?: readonly string[];
}

export interface WorkflowRenderScheduleEntryPayload {
  readonly cron: string;
}

export interface WorkflowRenderStepPayload {
  readonly name?: string;
  readonly if?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly with?: Readonly<Record<string, string>>;
  readonly run?: string;
  readonly uses?: string;
}

export interface WorkflowRenderJobPayload {
  readonly 'runs-on': string | readonly string[];
  readonly steps: readonly WorkflowRenderStepPayload[];
}

export interface WorkflowRenderPayload {
  readonly name: string;
  readonly on: Readonly<
    Partial<
      Record<
        TriggerType,
        WorkflowRenderTriggerPayload | readonly WorkflowRenderScheduleEntryPayload[] | null
      >
    >
  >;
  readonly jobs: Readonly<Record<string, WorkflowRenderJobPayload>>;
}

export type WorkflowEmitter<TResult> = (payload: WorkflowRenderPayload) => TResult;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return value;
}

function assertAllowedKeys(value: object, allowedKeys: readonly string[], label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw new WorkflowRenderError(`unsupported ${label} field "${key}"`);
    }
  }
}

function createTriggerPayload(
  trigger: WorkflowTrigger
): WorkflowRenderTriggerPayload | readonly WorkflowRenderScheduleEntryPayload[] | null {
  if (trigger.type === 'workflow_dispatch') {
    assertAllowedKeys(trigger, ['type'], `trigger "${trigger.type}"`);
    return null;
  }

  if (trigger.type === 'schedule') {
    assertAllowedKeys(trigger, ['type', 'cron'], `trigger "${trigger.type}"`);
    return trigger.cron.map((cron) => ({ cron }));
  }

  assertAllowedKeys(trigger, ['type', 'branches', 'paths'], `trigger "${trigger.type}"`);

  const payload: WorkflowRenderTriggerPayload = {
    ...(trigger.branches ? { branches: [...trigger.branches] } : {}),
    ...(trigger.paths ? { paths: [...trigger.paths] } : {}),
  };

  return Object.keys(payload).length === 0 ? null : payload;
}

function createStepPayload(step: WorkflowStep): WorkflowRenderStepPayload {
  assertAllowedKeys(
    step,
    ['kind', 'name', 'env', 'with', 'if', 'run', 'uses'],
    `step "${step.kind}"`
  );

  if (step.kind === 'run') {
    return {
      ...(step.name !== undefined ? { name: step.name } : {}),
      ...(step.if !== undefined ? { if: step.if } : {}),
      ...(step.env ? { env: { ...step.env } } : {}),
      ...(step.with ? { with: { ...step.with } } : {}),
      run: step.run,
    };
  }

  return {
    ...(step.name !== undefined ? { name: step.name } : {}),
    ...(step.if !== undefined ? { if: step.if } : {}),
    ...(step.env ? { env: { ...step.env } } : {}),
    ...(step.with ? { with: { ...step.with } } : {}),
    uses: step.uses,
  };
}

export function createWorkflowRenderPayload(workflow: WorkflowDefinition): WorkflowRenderPayload {
  assertAllowedKeys(workflow, ['id', 'name', 'on', 'jobs'], 'workflow');

  const on: Partial<
    Record<
      TriggerType,
      WorkflowRenderTriggerPayload | readonly WorkflowRenderScheduleEntryPayload[] | null
    >
  > = {};

  for (const triggerType of ['push', 'pull_request', 'workflow_dispatch', 'schedule'] as const) {
    const trigger = workflow.on.find((candidate) => candidate.type === triggerType);

    if (trigger) {
      on[triggerType] = createTriggerPayload(trigger);
    }
  }

  const jobs: Record<string, WorkflowRenderJobPayload> = {};

  for (const job of workflow.jobs) {
    assertAllowedKeys(job, ['id', 'runsOn', 'steps'], `job "${job.id}"`);

    jobs[String(job.id)] = {
      'runs-on': Array.isArray(job.runsOn) ? [...job.runsOn] : job.runsOn,
      steps: job.steps.map(createStepPayload),
    };
  }

  return deepFreeze({
    name: workflow.name,
    on,
    jobs,
  });
}

export function renderWorkflow<TResult>(
  workflow: WorkflowDefinition,
  emitter: WorkflowEmitter<TResult>
): TResult {
  return emitter(createWorkflowRenderPayload(workflow));
}
