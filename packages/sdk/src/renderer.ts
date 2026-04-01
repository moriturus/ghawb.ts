import {
  WORKFLOW_PERMISSION_KEYS,
  type TriggerType,
  type WorkflowDefinition,
  type WorkflowMatrix,
  type WorkflowPermissionKey,
  type WorkflowPermissionLevel,
  type WorkflowPermissions,
  type WorkflowStep,
  type WorkflowStrategy,
  type WorkflowTrigger,
} from './model.ts';

const WORKFLOW_PERMISSION_LEVELS = ['read', 'write', 'none'] as const;

const WORKFLOW_PERMISSION_ALLOWED_LEVELS: Readonly<
  Record<WorkflowPermissionKey, readonly WorkflowPermissionLevel[]>
> = {
  actions: WORKFLOW_PERMISSION_LEVELS,
  'artifact-metadata': WORKFLOW_PERMISSION_LEVELS,
  attestations: WORKFLOW_PERMISSION_LEVELS,
  checks: WORKFLOW_PERMISSION_LEVELS,
  contents: WORKFLOW_PERMISSION_LEVELS,
  deployments: WORKFLOW_PERMISSION_LEVELS,
  discussions: WORKFLOW_PERMISSION_LEVELS,
  'id-token': ['write', 'none'],
  issues: WORKFLOW_PERMISSION_LEVELS,
  models: ['read', 'none'],
  packages: WORKFLOW_PERMISSION_LEVELS,
  pages: WORKFLOW_PERMISSION_LEVELS,
  'pull-requests': WORKFLOW_PERMISSION_LEVELS,
  'security-events': WORKFLOW_PERMISSION_LEVELS,
  statuses: WORKFLOW_PERMISSION_LEVELS,
};

export class WorkflowRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowRenderError';
  }
}

export interface WorkflowRenderTriggerPayload {
  readonly branches?: readonly string[];
  readonly paths?: readonly string[];
  readonly types?: readonly string[];
}

export interface WorkflowRenderScheduleEntryPayload {
  readonly cron: string;
}

export interface WorkflowRenderStepPayload {
  readonly name?: string;
  readonly if?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly shell?: string;
  readonly with?: Readonly<Record<string, string>>;
  readonly run?: string;
  readonly uses?: string;
  readonly 'working-directory'?: string;
}

export type WorkflowRenderPermissionsPayload = WorkflowPermissions;

export interface WorkflowRenderJobPayload {
  readonly needs?: readonly string[];
  readonly permissions?: WorkflowRenderPermissionsPayload;
  readonly 'timeout-minutes'?: number;
  readonly defaults?: {
    readonly run: {
      readonly shell?: string;
      readonly 'working-directory'?: string;
    };
  };
  readonly concurrency?: {
    readonly group: string;
    readonly 'cancel-in-progress'?: boolean;
  };
  readonly env?: Readonly<Record<string, string>>;
  readonly strategy?: {
    readonly matrix: Readonly<Record<string, readonly string[]>>;
  };
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
  readonly permissions?: WorkflowRenderPermissionsPayload;
  readonly env?: Readonly<Record<string, string>>;
  readonly concurrency?: {
    readonly group: string;
    readonly 'cancel-in-progress'?: boolean;
  };
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

  assertAllowedKeys(trigger, ['type', 'branches', 'paths', 'types'], `trigger "${trigger.type}"`);

  const payload: WorkflowRenderTriggerPayload = {
    ...(trigger.branches ? { branches: [...trigger.branches] } : {}),
    ...(trigger.paths ? { paths: [...trigger.paths] } : {}),
    ...(trigger.types ? { types: [...trigger.types] } : {}),
  };

  return Object.keys(payload).length === 0 ? null : payload;
}

function createStepPayload(step: WorkflowStep): WorkflowRenderStepPayload {
  if (step.kind === 'run') {
    assertAllowedKeys(
      step,
      ['kind', 'name', 'env', 'with', 'if', 'run', 'shell', 'workingDirectory'],
      `step "${step.kind}"`
    );

    return {
      ...(step.name !== undefined ? { name: step.name } : {}),
      ...(step.if !== undefined ? { if: step.if } : {}),
      ...(step.env ? { env: { ...step.env } } : {}),
      ...(step.shell !== undefined ? { shell: step.shell } : {}),
      ...(step.with ? { with: { ...step.with } } : {}),
      ...(step.workingDirectory !== undefined
        ? { 'working-directory': step.workingDirectory }
        : {}),
      run: step.run,
    };
  }

  assertAllowedKeys(step, ['kind', 'name', 'env', 'with', 'if', 'uses'], `step "${step.kind}"`);

  return {
    ...(step.name !== undefined ? { name: step.name } : {}),
    ...(step.if !== undefined ? { if: step.if } : {}),
    ...(step.env ? { env: { ...step.env } } : {}),
    ...(step.with ? { with: { ...step.with } } : {}),
    uses: step.uses,
  };
}

function createMatrixPayload(matrix: WorkflowMatrix): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(Object.entries(matrix).map(([key, values]) => [key, [...values]]));
}

function createDefaultsRunPayload(defaultsRun: {
  readonly shell?: string;
  readonly workingDirectory?: string;
}): {
  readonly shell?: string;
  readonly 'working-directory'?: string;
} {
  assertAllowedKeys(defaultsRun, ['shell', 'workingDirectory'], 'defaults.run');

  if (defaultsRun.shell === undefined && defaultsRun.workingDirectory === undefined) {
    throw new WorkflowRenderError('defaults.run must define shell or working-directory');
  }

  return {
    ...(defaultsRun.shell !== undefined ? { shell: defaultsRun.shell } : {}),
    ...(defaultsRun.workingDirectory !== undefined
      ? { 'working-directory': defaultsRun.workingDirectory }
      : {}),
  };
}

function createConcurrencyPayload(
  concurrency: {
    readonly group: string;
    readonly cancelInProgress?: boolean;
  },
  label: string
): {
  readonly group: string;
  readonly 'cancel-in-progress'?: boolean;
} {
  assertAllowedKeys(concurrency, ['group', 'cancelInProgress'], `${label} concurrency`);

  if (typeof concurrency.group !== 'string' || concurrency.group.trim().length === 0) {
    throw new WorkflowRenderError(
      `unsupported ${label} concurrency value "group: ${concurrency.group}"`
    );
  }

  if (
    concurrency.cancelInProgress !== undefined &&
    typeof concurrency.cancelInProgress !== 'boolean'
  ) {
    throw new WorkflowRenderError(
      `unsupported ${label} concurrency value "cancelInProgress: ${concurrency.cancelInProgress}"`
    );
  }

  return {
    group: concurrency.group,
    ...(concurrency.cancelInProgress !== undefined
      ? { 'cancel-in-progress': concurrency.cancelInProgress }
      : {}),
  };
}

function createPermissionsPayload(
  permissions: WorkflowPermissions,
  label: string
): WorkflowRenderPermissionsPayload {
  for (const key of Object.keys(permissions)) {
    if (!WORKFLOW_PERMISSION_KEYS.includes(key as WorkflowPermissionKey)) {
      throw new WorkflowRenderError(`unsupported ${label} permissions key "${key}"`);
    }

    const permissionKey = key as WorkflowPermissionKey;
    const value = permissions[permissionKey];

    if (value === undefined || !WORKFLOW_PERMISSION_ALLOWED_LEVELS[permissionKey].includes(value)) {
      throw new WorkflowRenderError(
        `unsupported ${label} permissions value "${permissionKey}: ${value}"`
      );
    }
  }

  return Object.fromEntries(
    WORKFLOW_PERMISSION_KEYS.flatMap((key) =>
      permissions[key] !== undefined ? [[key, permissions[key]]] : []
    )
  ) as WorkflowRenderPermissionsPayload;
}

function createStrategyPayload(strategy: WorkflowStrategy): {
  readonly matrix: Readonly<Record<string, readonly string[]>>;
} {
  assertAllowedKeys(strategy, ['matrix'], 'job strategy');

  return {
    matrix: createMatrixPayload(strategy.matrix),
  };
}

export function createWorkflowRenderPayload(workflow: WorkflowDefinition): WorkflowRenderPayload {
  assertAllowedKeys(
    workflow,
    ['id', 'name', 'on', 'permissions', 'env', 'concurrency', 'jobs'],
    'workflow'
  );

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

  const workflowPermissions = workflow.permissions
    ? createPermissionsPayload(workflow.permissions, 'workflow')
    : undefined;
  const workflowEnv =
    workflow.env && Object.keys(workflow.env).length > 0 ? { ...workflow.env } : undefined;
  const workflowConcurrency = workflow.concurrency
    ? createConcurrencyPayload(workflow.concurrency, 'workflow')
    : undefined;

  const jobs: Record<string, WorkflowRenderJobPayload> = {};

  for (const job of workflow.jobs) {
    assertAllowedKeys(
      job,
      [
        'id',
        'needs',
        'permissions',
        'timeoutMinutes',
        'defaults',
        'concurrency',
        'env',
        'strategy',
        'runsOn',
        'steps',
      ],
      `job "${job.id}"`
    );

    jobs[String(job.id)] = {
      ...(job.needs ? { needs: [...job.needs] } : {}),
      ...(job.permissions
        ? { permissions: createPermissionsPayload(job.permissions, `job "${job.id}"`) }
        : {}),
      ...(job.timeoutMinutes !== undefined ? { 'timeout-minutes': job.timeoutMinutes } : {}),
      ...(job.defaults ? { defaults: { run: createDefaultsRunPayload(job.defaults.run) } } : {}),
      ...(job.concurrency
        ? { concurrency: createConcurrencyPayload(job.concurrency, `job "${job.id}"`) }
        : {}),
      ...(job.env && Object.keys(job.env).length > 0 ? { env: { ...job.env } } : {}),
      ...(job.strategy ? { strategy: createStrategyPayload(job.strategy) } : {}),
      'runs-on': Array.isArray(job.runsOn) ? [...job.runsOn] : job.runsOn,
      steps: job.steps.map(createStepPayload),
    };
  }

  return deepFreeze({
    name: workflow.name,
    on,
    ...(workflowPermissions ? { permissions: workflowPermissions } : {}),
    ...(workflowEnv ? { env: workflowEnv } : {}),
    ...(workflowConcurrency ? { concurrency: workflowConcurrency } : {}),
    jobs,
  });
}

export function renderWorkflow<TResult>(
  workflow: WorkflowDefinition,
  emitter: WorkflowEmitter<TResult>
): TResult {
  return emitter(createWorkflowRenderPayload(workflow));
}
