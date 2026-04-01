import {
  WORKFLOW_PERMISSION_KEYS,
  type TriggerType,
  type WorkflowDefinition,
  type WorkflowDispatchInput,
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
  readonly 'branches-ignore'?: readonly string[];
  readonly paths?: readonly string[];
  readonly 'paths-ignore'?: readonly string[];
  readonly tags?: readonly string[];
  readonly 'tags-ignore'?: readonly string[];
  readonly types?: readonly string[];
}

export interface WorkflowRenderScheduleEntryPayload {
  readonly cron: string;
}

export interface WorkflowRenderDispatchInputPayload {
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: string;
  readonly type?: string;
  readonly options?: readonly string[];
}

export interface WorkflowRenderDispatchPayload {
  readonly inputs: Readonly<Record<string, WorkflowRenderDispatchInputPayload>>;
}

export interface WorkflowRenderStepPayload {
  readonly name?: string;
  readonly id?: string;
  readonly if?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly shell?: string;
  readonly with?: Readonly<Record<string, string>>;
  readonly run?: string;
  readonly uses?: string;
  readonly 'working-directory'?: string;
  readonly 'continue-on-error'?: boolean;
  readonly 'timeout-minutes'?: number;
}

export type WorkflowRenderPermissionsPayload = WorkflowPermissions;

export interface WorkflowRenderJobPayload {
  readonly if?: string;
  readonly needs?: readonly string[];
  readonly 'continue-on-error'?: boolean;
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
    readonly 'fail-fast'?: boolean;
    readonly 'max-parallel'?: number;
    readonly matrix: Readonly<
      Record<string, readonly string[] | readonly Readonly<Record<string, string>>[]>
    >;
  };
  readonly 'runs-on': string | readonly string[];
  readonly outputs?: Readonly<Record<string, string>>;
  readonly steps: readonly WorkflowRenderStepPayload[];
}

export interface WorkflowRenderPayload {
  readonly name: string;
  readonly on: Readonly<
    Partial<
      Record<
        TriggerType,
        | WorkflowRenderTriggerPayload
        | readonly WorkflowRenderScheduleEntryPayload[]
        | WorkflowRenderDispatchPayload
        | null
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

function createDispatchInputPayload(
  input: WorkflowDispatchInput
): WorkflowRenderDispatchInputPayload {
  const payload: WorkflowRenderDispatchInputPayload = {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.required !== undefined ? { required: input.required } : {}),
    ...(input.default !== undefined ? { default: input.default } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.options ? { options: [...input.options] } : {}),
  };
  return payload;
}

function createTriggerPayload(
  trigger: WorkflowTrigger
):
  | WorkflowRenderTriggerPayload
  | readonly WorkflowRenderScheduleEntryPayload[]
  | WorkflowRenderDispatchPayload
  | null {
  if (trigger.type === 'workflow_dispatch') {
    assertAllowedKeys(trigger, ['type', 'inputs'], `trigger "${trigger.type}"`);

    if (trigger.inputs && Object.keys(trigger.inputs).length > 0) {
      const inputs: Record<string, WorkflowRenderDispatchInputPayload> = {};
      for (const [name, input] of Object.entries(trigger.inputs)) {
        inputs[name] = createDispatchInputPayload(input);
      }
      return { inputs };
    }

    return null;
  }

  if (trigger.type === 'schedule') {
    assertAllowedKeys(trigger, ['type', 'cron'], `trigger "${trigger.type}"`);
    return trigger.cron.map((cron) => ({ cron }));
  }

  assertAllowedKeys(
    trigger,
    ['type', 'branches', 'branchesIgnore', 'paths', 'pathsIgnore', 'tags', 'tagsIgnore', 'types'],
    `trigger "${trigger.type}"`
  );

  const payload: WorkflowRenderTriggerPayload = {
    ...(trigger.branches ? { branches: [...trigger.branches] } : {}),
    ...(trigger.branchesIgnore ? { 'branches-ignore': [...trigger.branchesIgnore] } : {}),
    ...(trigger.paths ? { paths: [...trigger.paths] } : {}),
    ...(trigger.pathsIgnore ? { 'paths-ignore': [...trigger.pathsIgnore] } : {}),
    ...(trigger.tags ? { tags: [...trigger.tags] } : {}),
    ...(trigger.tagsIgnore ? { 'tags-ignore': [...trigger.tagsIgnore] } : {}),
    ...(trigger.types ? { types: [...trigger.types] } : {}),
  };

  return Object.keys(payload).length === 0 ? null : payload;
}

function createStepPayload(step: WorkflowStep): WorkflowRenderStepPayload {
  if (step.kind === 'run') {
    assertAllowedKeys(
      step,
      [
        'kind',
        'id',
        'name',
        'env',
        'with',
        'if',
        'run',
        'shell',
        'workingDirectory',
        'continueOnError',
        'timeoutMinutes',
      ],
      `step "${step.kind}"`
    );

    return {
      ...(step.name !== undefined ? { name: step.name } : {}),
      ...(step.id !== undefined ? { id: step.id } : {}),
      ...(step.if !== undefined ? { if: step.if } : {}),
      ...(step.env ? { env: { ...step.env } } : {}),
      ...(step.shell !== undefined ? { shell: step.shell } : {}),
      ...(step.with ? { with: { ...step.with } } : {}),
      ...(step.workingDirectory !== undefined
        ? { 'working-directory': step.workingDirectory }
        : {}),
      ...(step.continueOnError !== undefined ? { 'continue-on-error': step.continueOnError } : {}),
      ...(step.timeoutMinutes !== undefined ? { 'timeout-minutes': step.timeoutMinutes } : {}),
      run: step.run,
    };
  }

  assertAllowedKeys(
    step,
    ['kind', 'id', 'name', 'env', 'with', 'if', 'uses', 'continueOnError', 'timeoutMinutes'],
    `step "${step.kind}"`
  );

  return {
    ...(step.name !== undefined ? { name: step.name } : {}),
    ...(step.id !== undefined ? { id: step.id } : {}),
    ...(step.if !== undefined ? { if: step.if } : {}),
    ...(step.env ? { env: { ...step.env } } : {}),
    ...(step.with ? { with: { ...step.with } } : {}),
    ...(step.continueOnError !== undefined ? { 'continue-on-error': step.continueOnError } : {}),
    ...(step.timeoutMinutes !== undefined ? { 'timeout-minutes': step.timeoutMinutes } : {}),
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
  readonly 'fail-fast'?: boolean;
  readonly 'max-parallel'?: number;
  readonly matrix: Readonly<
    Record<string, readonly string[] | readonly Readonly<Record<string, string>>[]>
  >;
} {
  assertAllowedKeys(
    strategy,
    ['failFast', 'maxParallel', 'matrix', 'include', 'exclude'],
    'job strategy'
  );

  const matrixPayload: Record<
    string,
    readonly string[] | readonly Readonly<Record<string, string>>[]
  > = createMatrixPayload(strategy.matrix);

  if (strategy.include !== undefined && strategy.include.length > 0) {
    matrixPayload.include = strategy.include.map((entry) => ({ ...entry }));
  }

  if (strategy.exclude !== undefined && strategy.exclude.length > 0) {
    matrixPayload.exclude = strategy.exclude.map((entry) => ({ ...entry }));
  }

  return {
    ...(strategy.failFast !== undefined ? { 'fail-fast': strategy.failFast } : {}),
    ...(strategy.maxParallel !== undefined ? { 'max-parallel': strategy.maxParallel } : {}),
    matrix: matrixPayload,
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
      | WorkflowRenderTriggerPayload
      | readonly WorkflowRenderScheduleEntryPayload[]
      | WorkflowRenderDispatchPayload
      | null
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
        'if',
        'needs',
        'continueOnError',
        'permissions',
        'timeoutMinutes',
        'defaults',
        'concurrency',
        'env',
        'strategy',
        'runsOn',
        'outputs',
        'steps',
      ],
      `job "${job.id}"`
    );

    jobs[String(job.id)] = {
      ...(job.if !== undefined ? { if: job.if } : {}),
      ...(job.needs ? { needs: [...job.needs] } : {}),
      ...(job.continueOnError !== undefined ? { 'continue-on-error': job.continueOnError } : {}),
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
      ...(job.outputs && Object.keys(job.outputs).length > 0
        ? { outputs: { ...job.outputs } }
        : {}),
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
