import {
  WORKFLOW_PERMISSION_KEYS,
  isRunsOnObject,
  isSimpleEventType,
  type ActionRef,
  type ContainerConfig,
  type FilteredWorkflowTrigger,
  type RunsOnObject,
  type SimpleEventTrigger,
  type TriggerType,
  type WorkflowDefinition,
  type WorkflowCallInput,
  type WorkflowCallOutput,
  type WorkflowCallSecret,
  type WorkflowDispatchInput,
  type WorkflowMatrix,
  type WorkflowPermissionKey,
  type WorkflowPermissionLevel,
  type WorkflowPermissionShorthand,
  type WorkflowPermissions,
  type WorkflowRef,
  type WorkflowRunTrigger,
  type WorkflowServices,
  type WorkflowStep,
  type WorkflowStrategy,
  type WorkflowTrigger,
} from "./model.js";

const WORKFLOW_PERMISSION_LEVELS = ["read", "write", "none"] as const;

const WORKFLOW_PERMISSION_ALLOWED_LEVELS: Readonly<
  Record<WorkflowPermissionKey, readonly WorkflowPermissionLevel[]>
> = {
  actions: WORKFLOW_PERMISSION_LEVELS,
  "artifact-metadata": WORKFLOW_PERMISSION_LEVELS,
  attestations: WORKFLOW_PERMISSION_LEVELS,
  checks: WORKFLOW_PERMISSION_LEVELS,
  contents: WORKFLOW_PERMISSION_LEVELS,
  deployments: WORKFLOW_PERMISSION_LEVELS,
  discussions: WORKFLOW_PERMISSION_LEVELS,
  "id-token": ["write", "none"],
  issues: WORKFLOW_PERMISSION_LEVELS,
  models: ["read", "none"],
  packages: WORKFLOW_PERMISSION_LEVELS,
  pages: WORKFLOW_PERMISSION_LEVELS,
  "pull-requests": WORKFLOW_PERMISSION_LEVELS,
  "security-events": WORKFLOW_PERMISSION_LEVELS,
  statuses: WORKFLOW_PERMISSION_LEVELS,
};

export class WorkflowRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowRenderError";
  }
}

export interface WorkflowRenderTriggerPayload {
  readonly branches?: readonly string[];
  readonly "branches-ignore"?: readonly string[];
  readonly paths?: readonly string[];
  readonly "paths-ignore"?: readonly string[];
  readonly tags?: readonly string[];
  readonly "tags-ignore"?: readonly string[];
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

export interface WorkflowRenderWorkflowCallOutputPayload {
  readonly description?: string;
  readonly value: string;
}

export interface WorkflowRenderWorkflowCallSecretPayload {
  readonly description?: string;
  readonly required?: boolean;
}

export interface WorkflowRenderWorkflowCallPayload {
  readonly inputs?: Readonly<Record<string, WorkflowRenderDispatchInputPayload>>;
  readonly outputs?: Readonly<Record<string, WorkflowRenderWorkflowCallOutputPayload>>;
  readonly secrets?: Readonly<Record<string, WorkflowRenderWorkflowCallSecretPayload>>;
}

export interface WorkflowRenderWorkflowRunPayload {
  readonly workflows: readonly string[];
  readonly types?: readonly string[];
  readonly branches?: readonly string[];
  readonly "branches-ignore"?: readonly string[];
}

export interface WorkflowRenderStepPayload {
  readonly name?: string;
  readonly id?: string;
  readonly if?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly shell?: string;
  readonly with?: Readonly<Record<string, string>>;
  readonly run?: string;
  readonly uses?: ActionRef;
  readonly "working-directory"?: string;
  readonly "continue-on-error"?: boolean;
  readonly "timeout-minutes"?: number;
}

export type WorkflowRenderPermissionsPayload = WorkflowPermissions;

export interface WorkflowRenderContainerCredentialsPayload {
  readonly username: string;
  readonly password: string;
}

export interface WorkflowRenderContainerPayload {
  readonly image: string;
  readonly credentials?: WorkflowRenderContainerCredentialsPayload;
  readonly env?: Readonly<Record<string, string>>;
  readonly ports?: readonly (number | string)[];
  readonly volumes?: readonly string[];
  readonly options?: string;
}

export interface WorkflowRenderRunsOnObjectPayload {
  readonly group?: string;
  readonly labels?: readonly string[];
}

interface WorkflowRenderJobPayloadBase {
  readonly name?: string;
  readonly if?: string;
  readonly needs?: readonly string[];
  readonly "continue-on-error"?: boolean;
  readonly permissions?: WorkflowRenderPermissionsPayload;
  readonly "timeout-minutes"?: number;
  readonly defaults?: {
    readonly run: {
      readonly shell?: string;
      readonly "working-directory"?: string;
    };
  };
  readonly concurrency?: {
    readonly group: string;
    readonly "cancel-in-progress"?: boolean;
  };
  readonly env?: Readonly<Record<string, string>>;
  readonly strategy?: {
    readonly "fail-fast"?: boolean;
    readonly "max-parallel"?: number;
    readonly matrix: Readonly<
      Record<string, readonly string[] | readonly Readonly<Record<string, string>>[]>
    >;
  };
  readonly "runs-on"?: string | readonly string[] | WorkflowRenderRunsOnObjectPayload;
  readonly container?: WorkflowRenderContainerPayload;
  readonly services?: Readonly<Record<string, WorkflowRenderContainerPayload>>;
  readonly outputs?: Readonly<Record<string, string>>;
  readonly steps?: readonly WorkflowRenderStepPayload[];
  readonly secrets?: "inherit" | Readonly<Record<string, string>>;
  readonly with?: Readonly<Record<string, string>>;
  readonly uses?: WorkflowRef;
}

export interface WorkflowRenderStepsJobPayload extends WorkflowRenderJobPayloadBase {
  readonly "runs-on": string | readonly string[] | WorkflowRenderRunsOnObjectPayload;
  readonly environment?: string | { readonly name: string; readonly url?: string };
  readonly container?: WorkflowRenderContainerPayload;
  readonly services?: Readonly<Record<string, WorkflowRenderContainerPayload>>;
  readonly steps: readonly WorkflowRenderStepPayload[];
}

export interface WorkflowRenderReusableWorkflowJobPayload extends WorkflowRenderJobPayloadBase {
  readonly uses: WorkflowRef;
}

export type WorkflowRenderJobPayload =
  | WorkflowRenderStepsJobPayload
  | WorkflowRenderReusableWorkflowJobPayload;

export interface WorkflowRenderPayload {
  readonly name: string;
  readonly "run-name"?: string;
  readonly on: Readonly<
    Partial<
      Record<
        TriggerType,
        | WorkflowRenderTriggerPayload
        | readonly WorkflowRenderScheduleEntryPayload[]
        | WorkflowRenderDispatchPayload
        | WorkflowRenderWorkflowCallPayload
        | WorkflowRenderWorkflowRunPayload
        | null
      >
    >
  >;
  readonly permissions?: WorkflowRenderPermissionsPayload;
  readonly defaults?: {
    readonly run: {
      readonly shell?: string;
      readonly "working-directory"?: string;
    };
  };
  readonly env?: Readonly<Record<string, string>>;
  readonly concurrency?: {
    readonly group: string;
    readonly "cancel-in-progress"?: boolean;
  };
  readonly jobs: Readonly<Record<string, WorkflowRenderJobPayload>>;
}

export type WorkflowEmitter<TResult> = (payload: WorkflowRenderPayload) => TResult;

function isPermissionsShorthand(value: unknown): value is WorkflowPermissionShorthand {
  return value === "read-all" || value === "write-all";
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
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

function createWorkflowCallInputPayload(
  input: WorkflowCallInput
): WorkflowRenderDispatchInputPayload {
  return {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.required !== undefined ? { required: input.required } : {}),
    ...(input.default !== undefined ? { default: input.default } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
  };
}

function createWorkflowCallOutputPayload(
  output: WorkflowCallOutput
): WorkflowRenderWorkflowCallOutputPayload {
  return {
    ...(output.description !== undefined ? { description: output.description } : {}),
    value: output.value,
  };
}

function createWorkflowCallSecretPayload(
  secret: WorkflowCallSecret
): WorkflowRenderWorkflowCallSecretPayload {
  return {
    ...(secret.description !== undefined ? { description: secret.description } : {}),
    ...(secret.required !== undefined ? { required: secret.required } : {}),
  };
}

function createTriggerPayload(
  trigger: WorkflowTrigger
):
  | WorkflowRenderTriggerPayload
  | readonly WorkflowRenderScheduleEntryPayload[]
  | WorkflowRenderDispatchPayload
  | WorkflowRenderWorkflowCallPayload
  | WorkflowRenderWorkflowRunPayload
  | null {
  if (trigger.type === "workflow_dispatch") {
    assertAllowedKeys(trigger, ["type", "inputs"], `trigger "${trigger.type}"`);

    if (trigger.inputs && Object.keys(trigger.inputs).length > 0) {
      const inputs: Record<string, WorkflowRenderDispatchInputPayload> = {};
      for (const [name, input] of Object.entries(trigger.inputs)) {
        inputs[name] = createDispatchInputPayload(input);
      }
      return { inputs };
    }

    return null;
  }

  if (trigger.type === "schedule") {
    assertAllowedKeys(trigger, ["type", "cron"], `trigger "${trigger.type}"`);
    return trigger.cron.map((cron) => ({ cron }));
  }

  if (trigger.type === "workflow_call") {
    assertAllowedKeys(
      trigger,
      ["type", "inputs", "outputs", "secrets"],
      `trigger "${trigger.type}"`
    );

    const inputs =
      trigger.inputs && Object.keys(trigger.inputs).length > 0
        ? Object.fromEntries(
            Object.entries(trigger.inputs).map(([name, input]) => [
              name,
              createWorkflowCallInputPayload(input),
            ])
          )
        : undefined;
    const outputs =
      trigger.outputs && Object.keys(trigger.outputs).length > 0
        ? Object.fromEntries(
            Object.entries(trigger.outputs).map(([name, output]) => [
              name,
              createWorkflowCallOutputPayload(output),
            ])
          )
        : undefined;
    const secrets =
      trigger.secrets && Object.keys(trigger.secrets).length > 0
        ? Object.fromEntries(
            Object.entries(trigger.secrets).map(([name, secret]) => [
              name,
              createWorkflowCallSecretPayload(secret),
            ])
          )
        : undefined;

    return {
      ...(inputs ? { inputs } : {}),
      ...(outputs ? { outputs } : {}),
      ...(secrets ? { secrets } : {}),
    };
  }

  if (trigger.type === "workflow_run") {
    const wfTrigger = trigger as WorkflowRunTrigger;
    assertAllowedKeys(
      trigger,
      ["type", "workflows", "types", "branches", "branchesIgnore"],
      `trigger "${trigger.type}"`
    );

    return {
      workflows: [...wfTrigger.workflows],
      ...(wfTrigger.types ? { types: [...wfTrigger.types] } : {}),
      ...(wfTrigger.branches ? { branches: [...wfTrigger.branches] } : {}),
      ...(wfTrigger.branchesIgnore ? { "branches-ignore": [...wfTrigger.branchesIgnore] } : {}),
    };
  }

  if (isSimpleEventType(trigger.type)) {
    const simpleTrigger = trigger as SimpleEventTrigger;
    assertAllowedKeys(trigger, ["type", "types"], `trigger "${trigger.type}"`);

    if (simpleTrigger.types && simpleTrigger.types.length > 0) {
      return { types: [...simpleTrigger.types] };
    }

    return null;
  }

  assertAllowedKeys(
    trigger,
    ["type", "branches", "branchesIgnore", "paths", "pathsIgnore", "tags", "tagsIgnore", "types"],
    `trigger "${trigger.type}"`
  );

  const filteredTrigger = trigger as FilteredWorkflowTrigger;
  const payload: WorkflowRenderTriggerPayload = {
    ...(filteredTrigger.branches ? { branches: [...filteredTrigger.branches] } : {}),
    ...(filteredTrigger.branchesIgnore
      ? { "branches-ignore": [...filteredTrigger.branchesIgnore] }
      : {}),
    ...(filteredTrigger.paths ? { paths: [...filteredTrigger.paths] } : {}),
    ...(filteredTrigger.pathsIgnore ? { "paths-ignore": [...filteredTrigger.pathsIgnore] } : {}),
    ...(filteredTrigger.tags ? { tags: [...filteredTrigger.tags] } : {}),
    ...(filteredTrigger.tagsIgnore ? { "tags-ignore": [...filteredTrigger.tagsIgnore] } : {}),
    ...(filteredTrigger.types ? { types: [...filteredTrigger.types] } : {}),
  };

  return Object.keys(payload).length === 0 ? null : payload;
}

function createStepPayload(step: WorkflowStep): WorkflowRenderStepPayload {
  if (step.kind === "run") {
    assertAllowedKeys(
      step,
      [
        "kind",
        "id",
        "name",
        "env",
        "with",
        "if",
        "run",
        "shell",
        "workingDirectory",
        "continueOnError",
        "timeoutMinutes",
        "scriptReference",
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
        ? { "working-directory": step.workingDirectory }
        : {}),
      ...(step.continueOnError !== undefined ? { "continue-on-error": step.continueOnError } : {}),
      ...(step.timeoutMinutes !== undefined ? { "timeout-minutes": step.timeoutMinutes } : {}),
      run: step.run,
    };
  }

  assertAllowedKeys(
    step,
    ["kind", "id", "name", "env", "with", "if", "uses", "continueOnError", "timeoutMinutes"],
    `step "${step.kind}"`
  );

  return {
    ...(step.name !== undefined ? { name: step.name } : {}),
    ...(step.id !== undefined ? { id: step.id } : {}),
    ...(step.if !== undefined ? { if: step.if } : {}),
    ...(step.env ? { env: { ...step.env } } : {}),
    ...(step.with ? { with: { ...step.with } } : {}),
    ...(step.continueOnError !== undefined ? { "continue-on-error": step.continueOnError } : {}),
    ...(step.timeoutMinutes !== undefined ? { "timeout-minutes": step.timeoutMinutes } : {}),
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
  readonly "working-directory"?: string;
} {
  assertAllowedKeys(defaultsRun, ["shell", "workingDirectory"], "defaults.run");

  if (defaultsRun.shell === undefined && defaultsRun.workingDirectory === undefined) {
    throw new WorkflowRenderError(
      "defaults.run must define shell or working-directory. Expected: at least one of shell or working-directory"
    );
  }

  return {
    ...(defaultsRun.shell !== undefined ? { shell: defaultsRun.shell } : {}),
    ...(defaultsRun.workingDirectory !== undefined
      ? { "working-directory": defaultsRun.workingDirectory }
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
  readonly "cancel-in-progress"?: boolean;
} {
  assertAllowedKeys(concurrency, ["group", "cancelInProgress"], `${label} concurrency`);

  if (typeof concurrency.group !== "string" || concurrency.group.trim().length === 0) {
    throw new WorkflowRenderError(
      `unsupported ${label} concurrency value "group: ${concurrency.group}". Expected: a non-blank string`
    );
  }

  if (
    concurrency.cancelInProgress !== undefined &&
    typeof concurrency.cancelInProgress !== "boolean"
  ) {
    throw new WorkflowRenderError(
      `unsupported ${label} concurrency value "cancelInProgress: ${concurrency.cancelInProgress}"`
    );
  }

  return {
    group: concurrency.group,
    ...(concurrency.cancelInProgress !== undefined
      ? { "cancel-in-progress": concurrency.cancelInProgress }
      : {}),
  };
}

function createPermissionsPayload(
  permissions: WorkflowPermissions,
  label: string
): WorkflowRenderPermissionsPayload {
  if (typeof permissions === "string") {
    if (!isPermissionsShorthand(permissions)) {
      throw new WorkflowRenderError(
        `unsupported ${label} permissions shorthand "${permissions}". Expected: "read-all" or "write-all"`
      );
    }

    return permissions;
  }

  if (Object.keys(permissions).some((key) => key === "read-all" || key === "write-all")) {
    throw new WorkflowRenderError(
      `unsupported ${label} permissions shape: cannot mix shorthand with object-map entries`
    );
  }

  for (const key of Object.keys(permissions)) {
    if (!WORKFLOW_PERMISSION_KEYS.includes(key as WorkflowPermissionKey)) {
      throw new WorkflowRenderError(
        `unsupported ${label} permissions key "${key}". Expected: one of ${WORKFLOW_PERMISSION_KEYS.join(", ")}`
      );
    }

    const permissionKey = key as WorkflowPermissionKey;
    const value = permissions[permissionKey];

    if (value === undefined || !WORKFLOW_PERMISSION_ALLOWED_LEVELS[permissionKey].includes(value)) {
      throw new WorkflowRenderError(
        `unsupported ${label} permissions value "${permissionKey}: ${value}". Expected: one of ${WORKFLOW_PERMISSION_ALLOWED_LEVELS[permissionKey].join(", ")}`
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
  readonly "fail-fast"?: boolean;
  readonly "max-parallel"?: number;
  readonly matrix: Readonly<
    Record<string, readonly string[] | readonly Readonly<Record<string, string>>[]>
  >;
} {
  assertAllowedKeys(
    strategy,
    ["failFast", "maxParallel", "matrix", "include", "exclude"],
    "job strategy"
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
    ...(strategy.failFast !== undefined ? { "fail-fast": strategy.failFast } : {}),
    ...(strategy.maxParallel !== undefined ? { "max-parallel": strategy.maxParallel } : {}),
    matrix: matrixPayload,
  };
}

function createRunsOnObjectPayload(obj: RunsOnObject): WorkflowRenderRunsOnObjectPayload {
  return {
    ...(obj.group !== undefined ? { group: obj.group } : {}),
    ...(obj.labels !== undefined ? { labels: [...obj.labels] } : {}),
  };
}

function createContainerPayload(container: ContainerConfig): WorkflowRenderContainerPayload {
  return {
    image: container.image,
    ...(container.credentials
      ? {
          credentials: {
            username: container.credentials.username,
            password: container.credentials.password,
          },
        }
      : {}),
    ...(container.env && Object.keys(container.env).length > 0
      ? { env: { ...container.env } }
      : {}),
    ...(container.ports && container.ports.length > 0 ? { ports: [...container.ports] } : {}),
    ...(container.volumes && container.volumes.length > 0
      ? { volumes: [...container.volumes] }
      : {}),
    ...(container.options !== undefined ? { options: container.options } : {}),
  };
}

function createServicesPayload(
  services: WorkflowServices
): Readonly<Record<string, WorkflowRenderContainerPayload>> {
  return Object.fromEntries(
    Object.entries(services).map(([key, value]) => [key, createContainerPayload(value)])
  );
}

export function createWorkflowRenderPayload(workflow: WorkflowDefinition): WorkflowRenderPayload {
  assertAllowedKeys(
    workflow,
    ["id", "name", "runName", "on", "permissions", "defaults", "env", "concurrency", "jobs"],
    "workflow"
  );

  const on: Partial<
    Record<
      TriggerType,
      | WorkflowRenderTriggerPayload
      | readonly WorkflowRenderScheduleEntryPayload[]
      | WorkflowRenderDispatchPayload
      | WorkflowRenderWorkflowCallPayload
      | WorkflowRenderWorkflowRunPayload
      | null
    >
  > = {};

  for (const triggerType of [
    "push",
    "pull_request",
    "pull_request_target",
    "workflow_dispatch",
    "workflow_call",
    "workflow_run",
    "schedule",
    "branch_protection_rule",
    "check_run",
    "check_suite",
    "create",
    "delete",
    "deployment",
    "deployment_status",
    "discussion",
    "discussion_comment",
    "fork",
    "gollum",
    "issue_comment",
    "issues",
    "label",
    "member",
    "merge_group",
    "milestone",
    "page_build",
    "public",
    "registry_package",
    "release",
    "repository_dispatch",
    "status",
    "watch",
  ] as const) {
    const trigger = workflow.on.find((candidate) => candidate.type === triggerType);

    if (trigger) {
      on[triggerType] = createTriggerPayload(trigger);
    }
  }

  const workflowPermissions = workflow.permissions
    ? createPermissionsPayload(workflow.permissions, "workflow")
    : undefined;
  const workflowDefaults = workflow.defaults
    ? { defaults: { run: createDefaultsRunPayload(workflow.defaults.run) } }
    : undefined;
  const workflowEnv =
    workflow.env && Object.keys(workflow.env).length > 0 ? { ...workflow.env } : undefined;
  const workflowConcurrency = workflow.concurrency
    ? createConcurrencyPayload(workflow.concurrency, "workflow")
    : undefined;

  const jobs: Record<string, WorkflowRenderJobPayload> = {};

  for (const job of workflow.jobs) {
    if (job.kind === "reusable-workflow") {
      assertAllowedKeys(
        job,
        [
          "kind",
          "id",
          "name",
          "if",
          "needs",
          "continueOnError",
          "permissions",
          "outputNames",
          "secrets",
          "with",
          "uses",
        ],
        `job "${job.id}"`
      );

      jobs[String(job.id)] = {
        ...(job.name !== undefined ? { name: job.name } : {}),
        ...(job.if !== undefined ? { if: job.if } : {}),
        ...(job.needs ? { needs: [...job.needs] } : {}),
        ...(job.continueOnError !== undefined ? { "continue-on-error": job.continueOnError } : {}),
        ...(job.permissions
          ? { permissions: createPermissionsPayload(job.permissions, `job "${job.id}"`) }
          : {}),
        ...(job.secrets !== undefined
          ? { secrets: job.secrets === "inherit" ? "inherit" : { ...job.secrets } }
          : {}),
        ...(job.with && Object.keys(job.with).length > 0 ? { with: { ...job.with } } : {}),
        uses: job.uses,
      };
      continue;
    }

    assertAllowedKeys(
      job,
      [
        "kind",
        "id",
        "name",
        "if",
        "needs",
        "continueOnError",
        "permissions",
        "timeoutMinutes",
        "defaults",
        "concurrency",
        "env",
        "strategy",
        "runsOn",
        "environment",
        "container",
        "services",
        "outputs",
        "steps",
      ],
      `job "${job.id}"`
    );

    jobs[String(job.id)] = {
      ...(job.name !== undefined ? { name: job.name } : {}),
      ...(job.if !== undefined ? { if: job.if } : {}),
      ...(job.needs ? { needs: [...job.needs] } : {}),
      ...(job.continueOnError !== undefined ? { "continue-on-error": job.continueOnError } : {}),
      ...(job.permissions
        ? { permissions: createPermissionsPayload(job.permissions, `job "${job.id}"`) }
        : {}),
      ...(job.timeoutMinutes !== undefined ? { "timeout-minutes": job.timeoutMinutes } : {}),
      ...(job.defaults ? { defaults: { run: createDefaultsRunPayload(job.defaults.run) } } : {}),
      ...(job.concurrency
        ? { concurrency: createConcurrencyPayload(job.concurrency, `job "${job.id}"`) }
        : {}),
      ...(job.env && Object.keys(job.env).length > 0 ? { env: { ...job.env } } : {}),
      ...(job.strategy ? { strategy: createStrategyPayload(job.strategy) } : {}),
      "runs-on": isRunsOnObject(job.runsOn!)
        ? createRunsOnObjectPayload(job.runsOn as RunsOnObject)
        : Array.isArray(job.runsOn)
          ? [...job.runsOn]
          : job.runsOn,
      ...(job.environment !== undefined
        ? {
            environment:
              typeof job.environment === "string"
                ? job.environment
                : {
                    name: job.environment.name,
                    ...(job.environment.url !== undefined ? { url: job.environment.url } : {}),
                  },
          }
        : {}),
      ...(job.container ? { container: createContainerPayload(job.container) } : {}),
      ...(job.services && Object.keys(job.services).length > 0
        ? { services: createServicesPayload(job.services) }
        : {}),
      ...(job.outputs && Object.keys(job.outputs).length > 0
        ? { outputs: { ...job.outputs } }
        : {}),
      steps: job.steps.map(createStepPayload),
    };
  }

  return deepFreeze({
    name: workflow.name,
    ...(workflow.runName !== undefined ? { "run-name": workflow.runName } : {}),
    on,
    ...(workflowPermissions ? { permissions: workflowPermissions } : {}),
    ...workflowDefaults,
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
