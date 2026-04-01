import {
  IDENTIFIER_FORMAT_SOURCE,
  WorkflowValidationError,
  matchesIdentifierFormat,
  type JobId,
  type WorkflowId,
} from '@ghawb/shared';

import {
  WORKFLOW_PERMISSION_KEYS,
  PULL_REQUEST_ACTIVITY_TYPES,
  WORKFLOW_DISPATCH_INPUT_TYPES,
  type ContainerConfig,
  type FilteredTriggerType,
  type MatrixAxisValues,
  type MatrixExcludeEntry,
  type MatrixIncludeEntry,
  type PullRequestActivityType,
  type PullRequestTriggerFilter,
  type RunStepMetadata,
  type RunsOnTarget,
  type StepMetadata,
  type TriggerFilter,
  type WorkflowConcurrency,
  type WorkflowDefinition,
  type WorkflowDefaultsRun,
  type WorkflowCallInput,
  type WorkflowCallInputs,
  type WorkflowCallOutput,
  type WorkflowCallOutputs,
  type WorkflowCallSecret,
  type WorkflowCallSecrets,
  type WorkflowDispatchInput,
  type WorkflowDispatchInputs,
  type WorkflowDispatchInputType,
  type WorkflowEnv,
  type ReusableWorkflowJobSecrets,
  type ReusableWorkflowJob,
  type StepsJob,
  type WorkflowJob,
  type WorkflowJobOutputs,
  type WorkflowMatrix,
  type WorkflowPermissionKey,
  type WorkflowPermissionLevel,
  type WorkflowPermissionMap,
  type WorkflowPermissionShorthand,
  type WorkflowPermissions,
  type WorkflowServices,
  type WorkflowStrategy,
  type WorkflowStep,
  type WorkflowTrigger,
} from './model.ts';

interface WorkflowStepDraft extends StepMetadata {
  readonly kind: 'run' | 'uses';
  readonly run?: string;
  readonly shell?: string;
  readonly uses?: string;
  readonly workingDirectory?: string;
}

interface WorkflowJobDraftBase {
  readonly id: JobId;
  readonly name?: string;
  readonly if?: string;
  readonly needs?: readonly JobId[];
  readonly continueOnError?: boolean;
  readonly permissions?: WorkflowPermissions;
}

interface StepsJobDraft extends WorkflowJobDraftBase {
  readonly kind: 'steps';
  readonly timeoutMinutes?: number;
  readonly defaults?: {
    readonly run: WorkflowDefaultsRun;
  };
  readonly concurrency?: WorkflowConcurrency;
  readonly env?: WorkflowEnv;
  readonly strategy?: {
    readonly failFast?: boolean;
    readonly maxParallel?: number;
    readonly matrix: Readonly<Record<string, readonly unknown[] | unknown>>;
    readonly include?: readonly Readonly<Record<string, unknown>>[];
    readonly exclude?: readonly Readonly<Record<string, unknown>>[];
  };
  readonly runsOn?: string | readonly string[];
  readonly container?: ContainerConfig;
  readonly services?: WorkflowServices;
  readonly outputs?: WorkflowJobOutputs;
  readonly steps: readonly WorkflowStepDraft[];
}

interface ReusableWorkflowJobDraft extends WorkflowJobDraftBase {
  readonly kind: 'reusable-workflow';
  readonly secrets?: ReusableWorkflowJobSecrets;
  readonly with?: Readonly<Record<string, string>>;
  readonly uses?: string;
  readonly steps: readonly WorkflowStepDraft[];
  readonly runsOn?: string | readonly string[];
  readonly container?: ContainerConfig;
  readonly services?: WorkflowServices;
}

type WorkflowJobDraft = StepsJobDraft | ReusableWorkflowJobDraft;

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

function isPermissionsShorthand(value: unknown): value is WorkflowPermissionShorthand {
  return value === 'read-all' || value === 'write-all';
}

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

function cloneFilter(filter: TriggerFilter): TriggerFilter {
  return {
    ...(filter.branches ? { branches: [...filter.branches] } : {}),
    ...(filter.branchesIgnore ? { branchesIgnore: [...filter.branchesIgnore] } : {}),
    ...(filter.paths ? { paths: [...filter.paths] } : {}),
    ...(filter.pathsIgnore ? { pathsIgnore: [...filter.pathsIgnore] } : {}),
    ...(filter.tags ? { tags: [...filter.tags] } : {}),
    ...(filter.tagsIgnore ? { tagsIgnore: [...filter.tagsIgnore] } : {}),
  };
}

function clonePullRequestFilter(filter: PullRequestTriggerFilter): PullRequestTriggerFilter {
  return {
    ...cloneFilter(filter),
    ...(filter.types ? { types: [...filter.types] } : {}),
  };
}

function cloneTrigger(trigger: WorkflowTrigger): WorkflowTrigger {
  if (trigger.type === 'workflow_dispatch') {
    return {
      type: 'workflow_dispatch',
      ...(trigger.inputs ? { inputs: cloneDispatchInputs(trigger.inputs) } : {}),
    };
  }

  if (trigger.type === 'schedule') {
    return {
      type: 'schedule',
      cron: [...trigger.cron] as [string, ...string[]],
    };
  }

  if (trigger.type === 'workflow_call') {
    return {
      type: 'workflow_call',
      ...(trigger.inputs ? { inputs: cloneWorkflowCallInputs(trigger.inputs) } : {}),
      ...(trigger.outputs ? { outputs: cloneWorkflowCallOutputs(trigger.outputs) } : {}),
      ...(trigger.secrets ? { secrets: cloneWorkflowCallSecrets(trigger.secrets) } : {}),
    };
  }

  return {
    type: trigger.type,
    ...cloneFilter(trigger),
    ...(trigger.types ? { types: [...trigger.types] } : {}),
  };
}

function cloneDispatchInputs(inputs: WorkflowDispatchInputs): WorkflowDispatchInputs {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => [name, cloneDispatchInput(input)])
  );
}

function cloneDispatchInput(input: WorkflowDispatchInput): WorkflowDispatchInput {
  return {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.required !== undefined ? { required: input.required } : {}),
    ...(input.default !== undefined ? { default: input.default } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.options ? { options: [...input.options] as [string, ...string[]] } : {}),
  };
}

function cloneWorkflowCallInputs(inputs: WorkflowCallInputs): WorkflowCallInputs {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => [name, cloneWorkflowCallInput(input)])
  );
}

function cloneWorkflowCallInput(input: WorkflowCallInput): WorkflowCallInput {
  return {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.required !== undefined ? { required: input.required } : {}),
    ...(input.default !== undefined ? { default: input.default } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...('options' in (input as object)
      ? { options: [...((input as { options?: readonly string[] }).options ?? [])] }
      : {}),
  };
}

function cloneWorkflowCallOutputs(outputs: WorkflowCallOutputs): WorkflowCallOutputs {
  return Object.fromEntries(
    Object.entries(outputs).map(([name, output]) => [name, cloneWorkflowCallOutput(output)])
  );
}

function cloneWorkflowCallOutput(output: WorkflowCallOutput): WorkflowCallOutput {
  return {
    ...(output.description !== undefined ? { description: output.description } : {}),
    value: output.value,
  };
}

function cloneWorkflowCallSecrets(secrets: WorkflowCallSecrets): WorkflowCallSecrets {
  return Object.fromEntries(
    Object.entries(secrets).map(([name, secret]) => [name, cloneWorkflowCallSecret(secret)])
  );
}

function cloneWorkflowCallSecret(secret: WorkflowCallSecret): WorkflowCallSecret {
  return {
    ...(secret.description !== undefined ? { description: secret.description } : {}),
    ...(secret.required !== undefined ? { required: secret.required } : {}),
  };
}

function isValidCronExpression(value: string): boolean {
  const fields = value.trim().split(/\s+/);
  return fields.length === 5 && fields.every((field) => field.length > 0);
}

function cloneStepMetadata(metadata: StepMetadata): StepMetadata {
  return {
    ...(metadata.id !== undefined ? { id: metadata.id } : {}),
    ...(metadata.name !== undefined ? { name: metadata.name } : {}),
    ...(metadata.env ? { env: { ...metadata.env } } : {}),
    ...(metadata.with ? { with: { ...metadata.with } } : {}),
    ...(metadata.if !== undefined ? { if: metadata.if } : {}),
    ...(metadata.continueOnError !== undefined
      ? { continueOnError: metadata.continueOnError }
      : {}),
    ...(metadata.timeoutMinutes !== undefined ? { timeoutMinutes: metadata.timeoutMinutes } : {}),
  };
}

function cloneRunStepMetadata(metadata: RunStepMetadata): RunStepMetadata {
  return {
    ...cloneStepMetadata(metadata),
    ...(metadata.shell !== undefined ? { shell: metadata.shell } : {}),
    ...(metadata.workingDirectory !== undefined
      ? { workingDirectory: metadata.workingDirectory }
      : {}),
  };
}

function clonePermissions(permissions: WorkflowPermissions): WorkflowPermissions {
  return typeof permissions === 'string' ? permissions : { ...permissions };
}

function canonicalizePermissions(permissions: WorkflowPermissions): WorkflowPermissions {
  if (typeof permissions === 'string') {
    return permissions;
  }

  return Object.fromEntries(
    WORKFLOW_PERMISSION_KEYS.flatMap((key) =>
      permissions[key] !== undefined ? [[key, permissions[key]]] : []
    )
  ) as WorkflowPermissionMap;
}

function cloneMatrix(
  matrix: Readonly<Record<string, readonly unknown[] | unknown>>
): Readonly<Record<string, readonly unknown[] | unknown>> {
  return Object.fromEntries(
    Object.entries(matrix).map(([key, values]) => [
      key,
      Array.isArray(values) ? [...values] : values,
    ])
  );
}

function cloneDefaultsRun(defaultsRun: WorkflowDefaultsRun): WorkflowDefaultsRun {
  return {
    ...(defaultsRun.shell !== undefined ? { shell: defaultsRun.shell } : {}),
    ...(defaultsRun.workingDirectory !== undefined
      ? { workingDirectory: defaultsRun.workingDirectory }
      : {}),
  };
}

function cloneConcurrency(concurrency: WorkflowConcurrency): WorkflowConcurrency {
  return {
    group: concurrency.group,
    ...(concurrency.cancelInProgress !== undefined
      ? { cancelInProgress: concurrency.cancelInProgress }
      : {}),
  };
}

function cloneEnv(env: WorkflowEnv): WorkflowEnv {
  return { ...env };
}

function cloneContainerConfig(config: ContainerConfig): ContainerConfig {
  return {
    image: config.image,
    ...(config.credentials ? { credentials: { ...config.credentials } } : {}),
    ...(config.env ? { env: { ...config.env } } : {}),
    ...(config.ports ? { ports: [...config.ports] } : {}),
    ...(config.volumes ? { volumes: [...config.volumes] } : {}),
    ...(config.options !== undefined ? { options: config.options } : {}),
  };
}

function cloneServices(services: WorkflowServices): WorkflowServices {
  return Object.fromEntries(
    Object.entries(services).map(([key, value]) => [key, cloneContainerConfig(value)])
  );
}

function createValidationIssues(
  workflow: WorkflowBuilder,
  jobs: readonly WorkflowJobDraft[]
): string[] {
  const issues: string[] = [];
  const allJobIds = new Set(jobs.map((job) => String(job.id)));

  if (workflow.name.trim().length === 0) {
    issues.push('workflow name must not be empty');
  }

  if (workflow.getRunName() !== undefined && workflow.getRunName()!.trim().length === 0) {
    issues.push('workflow run-name must not be empty');
  }

  if (workflow.triggers.length === 0) {
    issues.push(
      'workflow must define at least one trigger. Expected: at least one trigger (e.g. push, pull_request, workflow_dispatch)'
    );
  }

  const seenTriggerTypes = new Set<string>();

  validatePermissions('workflow', workflow.getPermissions(), issues);
  if (workflow.getDefaults() !== undefined) {
    const { run } = workflow.getDefaults()!;

    if (run.shell !== undefined && run.shell.trim().length === 0) {
      issues.push('workflow defaults.run.shell must not be empty');
    }

    if (run.workingDirectory !== undefined && run.workingDirectory.trim().length === 0) {
      issues.push('workflow defaults.run.working-directory must not be empty');
    }

    if (
      (run.shell === undefined || run.shell.trim().length === 0) &&
      (run.workingDirectory === undefined || run.workingDirectory.trim().length === 0)
    ) {
      issues.push(
        'workflow defaults.run must define shell or working-directory. Expected: at least one of shell or working-directory'
      );
    }
  }
  validateEnv('workflow', workflow.getEnv(), issues);
  validateConcurrency('workflow', workflow.getConcurrency(), issues);

  for (const trigger of workflow.triggers) {
    if (seenTriggerTypes.has(trigger.type)) {
      issues.push(`duplicate trigger "${trigger.type}"`);
      continue;
    }

    seenTriggerTypes.add(trigger.type);

    if (trigger.type === 'workflow_dispatch') {
      if ('branches' in trigger) {
        issues.push('trigger "workflow_dispatch" does not support branches. Supported: inputs');
      }

      if ('paths' in trigger) {
        issues.push('trigger "workflow_dispatch" does not support paths. Supported: inputs');
      }

      if ('types' in trigger) {
        issues.push('trigger "workflow_dispatch" does not support types. Supported: inputs');
      }

      if (trigger.inputs !== undefined) {
        for (const [inputName, input] of Object.entries(trigger.inputs)) {
          if (inputName.trim().length === 0) {
            issues.push('trigger "workflow_dispatch" inputs must not contain blank names');
            continue;
          }

          validateIdentifierLike(
            `trigger "workflow_dispatch" input "${inputName}"`,
            inputName,
            issues,
            'name'
          );

          if (input.required !== undefined && typeof input.required !== 'boolean') {
            issues.push(
              `trigger "workflow_dispatch" input "${inputName}" required must be a boolean. Expected: true or false`
            );
          }

          if (input.type !== undefined) {
            if (!WORKFLOW_DISPATCH_INPUT_TYPES.includes(input.type as WorkflowDispatchInputType)) {
              issues.push(
                `trigger "workflow_dispatch" input "${inputName}" type "${input.type}" is not a valid input type. Expected: one of "string", "boolean", "choice", "number", "environment"`
              );
            }

            if (input.type === 'choice') {
              if (input.options === undefined || input.options.length === 0) {
                issues.push(
                  `trigger "workflow_dispatch" input "${inputName}" type "choice" requires non-empty options. Expected: a non-empty array of string options`
                );
              }
            } else if (input.options !== undefined) {
              issues.push(
                `trigger "workflow_dispatch" input "${inputName}" options is only valid when type is "choice". Remove options or set type to "choice"`
              );
            }
          } else if (input.options !== undefined) {
            issues.push(
              `trigger "workflow_dispatch" input "${inputName}" options is only valid when type is "choice". Remove options or set type to "choice"`
            );
          }
        }
      }

      continue;
    }

    if (trigger.type === 'workflow_call') {
      if ('branches' in trigger) {
        issues.push(
          'trigger "workflow_call" does not support branches. Supported: inputs, outputs, secrets'
        );
      }

      if ('paths' in trigger) {
        issues.push(
          'trigger "workflow_call" does not support paths. Supported: inputs, outputs, secrets'
        );
      }

      if ('types' in trigger) {
        issues.push(
          'trigger "workflow_call" does not support types. Supported: inputs, outputs, secrets'
        );
      }

      if (trigger.inputs !== undefined) {
        for (const [inputName, input] of Object.entries(trigger.inputs)) {
          if (inputName.trim().length === 0) {
            issues.push('trigger "workflow_call" inputs must not contain blank names');
            continue;
          }

          validateIdentifierLike(
            `trigger "workflow_call" input "${inputName}"`,
            inputName,
            issues,
            'name'
          );

          if (input.required !== undefined && typeof input.required !== 'boolean') {
            issues.push(
              `trigger "workflow_call" input "${inputName}" required must be a boolean. Expected: true or false`
            );
          }

          if (input.type !== undefined) {
            if (!WORKFLOW_DISPATCH_INPUT_TYPES.includes(input.type as WorkflowDispatchInputType)) {
              issues.push(
                `trigger "workflow_call" input "${inputName}" type "${input.type}" is not a valid input type. Expected: one of "string", "boolean", "choice", "number", "environment"`
              );
            }

            if (input.type === 'choice') {
              issues.push(
                `trigger "workflow_call" input "${inputName}" type "choice" is not supported. Expected: one of "string", "boolean", "number", "environment"`
              );
            }
          }

          if ('options' in (input as object)) {
            issues.push(
              `trigger "workflow_call" input "${inputName}" options is not supported. Remove the options field`
            );
          }
        }
      }

      if (trigger.outputs !== undefined) {
        for (const [outputName, output] of Object.entries(trigger.outputs)) {
          if (outputName.trim().length === 0) {
            issues.push('trigger "workflow_call" outputs must not contain blank names');
            continue;
          }

          validateIdentifierLike(
            `trigger "workflow_call" output "${outputName}"`,
            outputName,
            issues,
            'name'
          );

          if (typeof output.value !== 'string' || output.value.trim().length === 0) {
            issues.push(
              `trigger "workflow_call" output "${outputName}" value must be a non-blank string`
            );
          }
        }
      }

      if (trigger.secrets !== undefined) {
        for (const [secretName, secret] of Object.entries(trigger.secrets)) {
          if (secretName.trim().length === 0) {
            issues.push('trigger "workflow_call" secrets must not contain blank names');
            continue;
          }

          validateIdentifierLike(
            `trigger "workflow_call" secret "${secretName}"`,
            secretName,
            issues,
            'name'
          );

          if (secret.required !== undefined && typeof secret.required !== 'boolean') {
            issues.push(
              `trigger "workflow_call" secret "${secretName}" required must be a boolean. Expected: true or false`
            );
          }
        }
      }

      continue;
    }

    if (trigger.type === 'schedule') {
      if ('branches' in trigger) {
        issues.push('trigger "schedule" does not support branches. Supported: cron');
      }

      if ('paths' in trigger) {
        issues.push('trigger "schedule" does not support paths. Supported: cron');
      }

      if ('types' in trigger) {
        issues.push('trigger "schedule" does not support types. Supported: cron');
      }

      if (trigger.cron.length === 0) {
        issues.push(
          'trigger "schedule" must define at least one cron entry. Expected: at least one cron expression'
        );
        continue;
      }

      if (trigger.cron.some((value) => value.trim().length === 0)) {
        issues.push('trigger "schedule" cron must not contain blank values');
      }

      for (const cron of trigger.cron) {
        if (cron.trim().length === 0) {
          continue;
        }

        if (!isValidCronExpression(cron)) {
          issues.push(
            `trigger "schedule" cron entry "${cron}" must have exactly 5 fields. Expected: "minute hour day month weekday" (e.g. "0 12 * * 1-5")`
          );
        }
      }

      continue;
    }

    for (const [label, values] of [
      ['branches', trigger.branches],
      ['branches-ignore', trigger.branchesIgnore],
      ['paths', trigger.paths],
      ['paths-ignore', trigger.pathsIgnore],
      ['tags', trigger.tags],
      ['tags-ignore', trigger.tagsIgnore],
    ] as const) {
      if (values === undefined) {
        continue;
      }

      if (values.length === 0) {
        issues.push(`trigger "${trigger.type}" ${label} must not be empty`);
        continue;
      }

      if (values.some((value) => value.trim().length === 0)) {
        issues.push(`trigger "${trigger.type}" ${label} must not contain blank values`);
      }
    }

    if (trigger.branches !== undefined && trigger.branchesIgnore !== undefined) {
      issues.push(
        `trigger "${trigger.type}" must not combine branches and branches-ignore. Use one or the other, not both`
      );
    }

    if (trigger.paths !== undefined && trigger.pathsIgnore !== undefined) {
      issues.push(
        `trigger "${trigger.type}" must not combine paths and paths-ignore. Use one or the other, not both`
      );
    }

    if (trigger.tags !== undefined && trigger.tagsIgnore !== undefined) {
      issues.push(
        `trigger "${trigger.type}" must not combine tags and tags-ignore. Use one or the other, not both`
      );
    }

    if (trigger.type === 'pull_request') {
      if (trigger.tags !== undefined) {
        issues.push(
          'trigger "pull_request" does not support tags. Supported: branches, branches-ignore, paths, paths-ignore, types'
        );
      }

      if (trigger.tagsIgnore !== undefined) {
        issues.push(
          'trigger "pull_request" does not support tags-ignore. Supported: branches, branches-ignore, paths, paths-ignore, types'
        );
      }
    }

    if (trigger.types !== undefined) {
      if (trigger.type !== 'pull_request') {
        issues.push(
          `trigger "${trigger.type}" does not support types. Supported: branches, branches-ignore, paths, paths-ignore, tags, tags-ignore`
        );
      } else {
        if (trigger.types.length === 0) {
          issues.push('trigger "pull_request" types must not be empty');
        }

        for (const activityType of trigger.types) {
          if (!PULL_REQUEST_ACTIVITY_TYPES.includes(activityType as PullRequestActivityType)) {
            issues.push(
              `trigger "pull_request" types contains unknown activity type "${activityType}". Expected: one of ${PULL_REQUEST_ACTIVITY_TYPES.map((t) => `"${t}"`).join(', ')}`
            );
          }
        }
      }
    }
  }

  if (jobs.length === 0) {
    issues.push('workflow must define at least one job. Expected: at least one job definition');
  }

  const seenJobIds = new Set<string>();

  for (const job of jobs) {
    const jobId = String(job.id);

    if (seenJobIds.has(jobId)) {
      issues.push(`duplicate job id "${jobId}"`);
    } else {
      seenJobIds.add(jobId);
    }

    if (job.name !== undefined && job.name.trim().length === 0) {
      issues.push(`job "${jobId}" name must not be empty`);
    }

    if (job.needs !== undefined) {
      if (job.needs.length === 0) {
        issues.push(`job "${jobId}" needs must not be empty`);
      }

      const seenNeeds = new Set<string>();

      for (const dependency of job.needs) {
        const dependencyId = String(dependency);

        if (seenNeeds.has(dependencyId)) {
          issues.push(`job "${jobId}" needs must not contain duplicate job "${dependencyId}"`);
          continue;
        }

        seenNeeds.add(dependencyId);

        if (!allJobIds.has(dependencyId)) {
          issues.push(`job "${jobId}" needs unknown job "${dependencyId}"`);
          continue;
        }

        if (!seenJobIds.has(dependencyId)) {
          issues.push(`job "${jobId}" needs job "${dependencyId}" to be declared earlier`);
        }
      }
    }

    if (job.if !== undefined) {
      if (typeof job.if !== 'string' || job.if.trim().length === 0) {
        issues.push(`job "${jobId}" if must be a non-blank string`);
      }
    }

    if (job.continueOnError !== undefined) {
      if (typeof job.continueOnError !== 'boolean') {
        issues.push(`job "${jobId}" continue-on-error must be a boolean. Expected: true or false`);
      }
    }

    validatePermissions(`job "${jobId}"`, job.permissions, issues);

    if (job.kind === 'reusable-workflow') {
      if (job.uses === undefined) {
        issues.push(
          `job "${jobId}" reusable workflow job must define uses. Expected: a reusable workflow reference (e.g. "org/repo/.github/workflows/ci.yml@main")`
        );
      } else if (job.uses.trim().length === 0) {
        issues.push(`job "${jobId}" reusable workflow uses must not be empty`);
      }

      if (job.runsOn !== undefined) {
        issues.push(
          `job "${jobId}" reusable workflow job must not define runs-on. Only step-based jobs support runs-on`
        );
      }

      if (job.steps.length > 0) {
        issues.push(
          `job "${jobId}" reusable workflow job must not define inline steps. Only step-based jobs support inline steps`
        );
      }

      if (job.with !== undefined && Object.keys(job.with).some((key) => key.trim().length === 0)) {
        issues.push(`job "${jobId}" with must not contain blank keys`);
      }

      if (job.secrets !== undefined && job.secrets !== 'inherit') {
        if (Object.keys(job.secrets).some((key) => key.trim().length === 0)) {
          issues.push(`job "${jobId}" secrets must not contain blank keys`);
        }

        for (const [key, value] of Object.entries(job.secrets)) {
          if (value.trim().length === 0) {
            issues.push(`job "${jobId}" secrets key "${key}" must not have a blank value`);
          }
        }
      }

      if (job.container !== undefined) {
        issues.push(
          `job "${jobId}" reusable workflow job must not define container. Only step-based jobs support container`
        );
      }
      if (job.services !== undefined) {
        issues.push(
          `job "${jobId}" reusable workflow job must not define services. Only step-based jobs support services`
        );
      }

      continue;
    }

    if (job.runsOn === undefined) {
      issues.push(
        `job "${jobId}" must define runs-on. Expected: a runner label string or array of labels`
      );
    } else if (typeof job.runsOn === 'string') {
      if (job.runsOn.trim().length === 0) {
        issues.push(`job "${jobId}" runs-on must not be empty. Expected: a non-blank runner label`);
      }
    } else {
      if (job.runsOn.length === 0) {
        issues.push(
          `job "${jobId}" runs-on array must not be empty. Expected: at least one runner label`
        );
      }

      if (job.runsOn.some((target) => target.trim().length === 0)) {
        issues.push(`job "${jobId}" runs-on array must not contain blank values`);
      }
    }

    if (job.timeoutMinutes !== undefined) {
      if (!Number.isInteger(job.timeoutMinutes) || job.timeoutMinutes <= 0) {
        issues.push(
          `job "${jobId}" timeout-minutes must be a positive integer. Expected: a whole number greater than 0`
        );
      }
    }

    if (job.defaults !== undefined) {
      const { run } = job.defaults;

      if (run.shell !== undefined && run.shell.trim().length === 0) {
        issues.push(`job "${jobId}" defaults.run.shell must not be empty`);
      }

      if (run.workingDirectory !== undefined && run.workingDirectory.trim().length === 0) {
        issues.push(`job "${jobId}" defaults.run.working-directory must not be empty`);
      }

      if (run.shell === undefined && run.workingDirectory === undefined) {
        issues.push(
          `job "${jobId}" defaults.run must define shell or working-directory. Expected: at least one of shell or working-directory`
        );
      }
    }

    validateConcurrency(`job "${jobId}"`, job.concurrency, issues);

    validateEnv(`job "${jobId}"`, job.env, issues);

    if (job.strategy !== undefined) {
      if (job.strategy.failFast !== undefined && typeof job.strategy.failFast !== 'boolean') {
        issues.push(`job "${jobId}" strategy.fail-fast must be a boolean. Expected: true or false`);
      }

      if (job.strategy.maxParallel !== undefined) {
        if (!Number.isInteger(job.strategy.maxParallel) || job.strategy.maxParallel <= 0) {
          issues.push(
            `job "${jobId}" strategy.max-parallel must be a positive integer. Expected: a whole number greater than 0`
          );
        }
      }

      const matrixEntries = Object.entries(job.strategy.matrix);

      if (matrixEntries.length === 0) {
        issues.push(
          `job "${jobId}" strategy.matrix must define at least one axis. Expected: at least one axis name mapped to a string array`
        );
      }

      const declaredAxisKeys = new Set<string>();

      for (const [axis, values] of matrixEntries) {
        if (axis.trim().length === 0) {
          issues.push(`job "${jobId}" strategy.matrix must not contain blank axis names`);
          continue;
        }

        validateIdentifierLike(`job "${jobId}" strategy.matrix axis "${axis}"`, axis, issues);

        if (axis === 'include' || axis === 'exclude') {
          issues.push(
            `job "${jobId}" strategy.matrix does not support axis "${axis}". Expected: axes matching /^[a-zA-Z_][a-zA-Z0-9_-]*$/ (include and exclude are reserved)`
          );
        }

        declaredAxisKeys.add(axis);

        if (!Array.isArray(values)) {
          issues.push(
            `job "${jobId}" strategy.matrix axis "${axis}" must be an array. Expected: an array of strings`
          );
          continue;
        }

        if (values.length === 0) {
          issues.push(`job "${jobId}" strategy.matrix axis "${axis}" must not be empty`);
          continue;
        }

        for (const value of values) {
          if (typeof value !== 'string') {
            issues.push(
              `job "${jobId}" strategy.matrix axis "${axis}" must contain only strings. Expected: every element to be a string`
            );
            continue;
          }

          if (value.trim().length === 0) {
            issues.push(
              `job "${jobId}" strategy.matrix axis "${axis}" must not contain blank values`
            );
          }
        }
      }

      if (job.strategy.include !== undefined) {
        for (const [entryIndex, entry] of job.strategy.include.entries()) {
          if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
            issues.push(
              `job "${jobId}" strategy.matrix include entry ${entryIndex + 1} must be a record object. Expected: a plain object with string keys`
            );
            continue;
          }

          for (const [key, value] of Object.entries(entry)) {
            if (key.trim().length === 0) {
              issues.push(
                `job "${jobId}" strategy.matrix include entry ${entryIndex + 1} must not contain blank keys`
              );
            }

            if (typeof value !== 'string') {
              issues.push(
                `job "${jobId}" strategy.matrix include entry ${entryIndex + 1} key "${key}" must be a string value. Expected: a string value`
              );
            }
          }
        }
      }

      if (job.strategy.exclude !== undefined) {
        for (const [entryIndex, entry] of job.strategy.exclude.entries()) {
          if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
            issues.push(
              `job "${jobId}" strategy.matrix exclude entry ${entryIndex + 1} must be a record object. Expected: a plain object with string keys`
            );
            continue;
          }

          for (const [key, value] of Object.entries(entry)) {
            if (key.trim().length === 0) {
              issues.push(
                `job "${jobId}" strategy.matrix exclude entry ${entryIndex + 1} must not contain blank keys`
              );
            }

            if (!declaredAxisKeys.has(key)) {
              issues.push(
                `job "${jobId}" strategy.matrix exclude entry ${entryIndex + 1} references undeclared axis "${key}"`
              );
            }

            if (typeof value !== 'string') {
              issues.push(
                `job "${jobId}" strategy.matrix exclude entry ${entryIndex + 1} key "${key}" must be a string value. Expected: a string value`
              );
            }
          }
        }
      }
    }

    if (job.container !== undefined) {
      validateContainerConfig(`job "${jobId}" container`, job.container, issues);
    }

    if (job.services !== undefined) {
      for (const [serviceName, serviceConfig] of Object.entries(job.services)) {
        validateIdentifierLike(
          `job "${jobId}" service "${serviceName}"`,
          serviceName,
          issues,
          'name'
        );
        validateContainerConfig(`job "${jobId}" service "${serviceName}"`, serviceConfig, issues);
      }
    }

    if (job.steps.length === 0) {
      issues.push(
        `job "${jobId}" must define at least one step. Expected: at least one run or uses step`
      );
    }

    const stepIds = new Set<string>();

    for (const [index, step] of job.steps.entries()) {
      const location = `job "${jobId}" step ${index + 1}`;
      const value = step.kind === 'run' ? step.run : step.uses;

      if (value === undefined || value.trim().length === 0) {
        issues.push(`${location} must define a non-empty ${step.kind} value`);
      }

      if (step.id !== undefined) {
        if (step.id.trim().length === 0) {
          issues.push(`${location} id must not be empty`);
        } else if (step.id !== step.id.trim()) {
          issues.push(
            `${location} id must not contain surrounding whitespace. Expected: no leading or trailing spaces`
          );
        } else if (!matchesIdentifierFormat(step.id)) {
          issues.push(
            `${location} id must match ${IDENTIFIER_FORMAT_SOURCE}. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens`
          );
        } else if (stepIds.has(step.id)) {
          issues.push(`job "${jobId}" contains duplicate step id "${step.id}"`);
        } else {
          stepIds.add(step.id);
        }
      }

      if (step.name !== undefined && step.name.trim().length === 0) {
        issues.push(`${location} name must not be empty`);
      }

      if (step.if !== undefined && step.if.trim().length === 0) {
        issues.push(`${location} if must not be empty`);
      }

      if (step.kind === 'run') {
        if (step.shell !== undefined && step.shell.trim().length === 0) {
          issues.push(`${location} shell must not be empty`);
        }

        if (step.workingDirectory !== undefined && step.workingDirectory.trim().length === 0) {
          issues.push(`${location} working-directory must not be empty`);
        }
      }

      if (step.continueOnError !== undefined && typeof step.continueOnError !== 'boolean') {
        issues.push(`${location} continue-on-error must be a boolean. Expected: true or false`);
      }

      if (step.timeoutMinutes !== undefined) {
        if (!Number.isInteger(step.timeoutMinutes) || step.timeoutMinutes <= 0) {
          issues.push(
            `${location} timeout-minutes must be a positive integer. Expected: a whole number greater than 0`
          );
        }
      }

      for (const [label, record] of [
        ['env', step.env],
        ['with', step.with],
      ] as const) {
        if (record === undefined) {
          continue;
        }

        if (Object.keys(record).some((key) => key.trim().length === 0)) {
          issues.push(`${location} ${label} must not contain blank keys`);
        }
      }
    }

    if (job.outputs !== undefined) {
      for (const [key, value] of Object.entries(job.outputs)) {
        if (key.trim().length === 0) {
          issues.push(`job "${jobId}" outputs must not contain blank keys`);
        }

        if (value.trim().length === 0) {
          issues.push(`job "${jobId}" outputs key "${key}" must not have a blank value`);
        }

        const stepRefPattern = /steps\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
        let match: RegExpExecArray | null;

        while ((match = stepRefPattern.exec(value)) !== null) {
          const referencedId = match[1] ?? '';

          if (referencedId.length > 0 && !stepIds.has(referencedId)) {
            issues.push(
              `job "${jobId}" outputs key "${key}" references undeclared step id "${referencedId}"`
            );
          }
        }
      }
    }
  }

  return issues;
}

function validatePermissions(
  owner: string,
  permissions: WorkflowPermissions | undefined,
  issues: string[]
): void {
  if (permissions === undefined) {
    return;
  }

  if (typeof permissions === 'string') {
    if (!isPermissionsShorthand(permissions)) {
      issues.push(`${owner} permissions must be "read-all", "write-all", or an object map`);
    }

    return;
  }

  if (Object.keys(permissions).some((key) => key === 'read-all' || key === 'write-all')) {
    issues.push(
      `${owner} permissions must use either shorthand ("read-all"/"write-all") or an object map, not both`
    );
    return;
  }

  for (const key of Object.keys(permissions)) {
    if (!WORKFLOW_PERMISSION_KEYS.includes(key as WorkflowPermissionKey)) {
      issues.push(
        `${owner} permissions contains unsupported key "${key}". Expected: one of ${WORKFLOW_PERMISSION_KEYS.join(', ')}`
      );
      continue;
    }

    const permissionKey = key as WorkflowPermissionKey;
    const value = permissions[permissionKey];

    const allowedLevels = WORKFLOW_PERMISSION_ALLOWED_LEVELS[permissionKey];

    if (value === undefined || !allowedLevels.includes(value)) {
      issues.push(
        `${owner} permissions entry "${permissionKey}" must be one of ${allowedLevels.join(', ')}`
      );
    }
  }
}

function validateConcurrency(
  owner: string,
  concurrency: WorkflowConcurrency | undefined,
  issues: string[]
): void {
  if (concurrency === undefined) {
    return;
  }

  if (concurrency.group.trim().length === 0) {
    issues.push(`${owner} concurrency group must not be empty`);
  }

  if (
    concurrency.cancelInProgress !== undefined &&
    typeof concurrency.cancelInProgress !== 'boolean'
  ) {
    issues.push(
      `${owner} concurrency cancel-in-progress must be a boolean. Expected: true or false`
    );
  }
}

function validateEnv(owner: string, env: WorkflowEnv | undefined, issues: string[]): void {
  if (env === undefined) {
    return;
  }

  if (Object.keys(env).some((key) => key.trim().length === 0)) {
    issues.push(`${owner} env must not contain blank keys`);
  }
}

function validateContainerConfig(owner: string, config: ContainerConfig, issues: string[]): void {
  if (typeof config.image !== 'string' || config.image.trim().length === 0) {
    issues.push(`${owner} image must be a non-blank string`);
  }

  if (config.credentials !== undefined) {
    if (
      typeof config.credentials.username !== 'string' ||
      config.credentials.username.trim().length === 0
    ) {
      issues.push(`${owner} credentials username must be a non-blank string`);
    }
    if (
      typeof config.credentials.password !== 'string' ||
      config.credentials.password.trim().length === 0
    ) {
      issues.push(`${owner} credentials password must be a non-blank string`);
    }
  }

  validateEnv(`${owner}`, config.env, issues);

  if (config.ports !== undefined) {
    for (const port of config.ports) {
      if (typeof port === 'number') {
        if (!Number.isInteger(port) || port <= 0) {
          issues.push(
            `${owner} ports must contain positive integers. Expected: whole numbers greater than 0`
          );
        }
      } else if (typeof port === 'string') {
        if (port.trim().length === 0) {
          issues.push(`${owner} ports must not contain blank strings`);
        }
      }
    }
  }

  if (config.volumes !== undefined) {
    for (const volume of config.volumes) {
      if (volume.trim().length === 0) {
        issues.push(`${owner} volumes must not contain blank strings`);
      }
    }
  }

  if (config.options !== undefined) {
    if (typeof config.options !== 'string' || config.options.trim().length === 0) {
      issues.push(`${owner} options must be a non-blank string`);
    }
  }
}

function validateIdentifierLike(
  location: string,
  value: string,
  issues: string[],
  label?: string
): void {
  if (!matchesIdentifierFormat(value)) {
    issues.push(
      `${location}${label ? ` ${label}` : ''} must match ${IDENTIFIER_FORMAT_SOURCE}. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens`
    );
  }
}

function finalizeStep(step: WorkflowStepDraft): WorkflowStep {
  const base = {
    ...(step.id !== undefined ? { id: step.id } : {}),
    ...(step.name !== undefined ? { name: step.name.trim() } : {}),
    ...(step.env ? { env: { ...step.env } } : {}),
    ...(step.with ? { with: { ...step.with } } : {}),
    ...(step.if !== undefined ? { if: step.if.trim() } : {}),
    ...(step.continueOnError !== undefined ? { continueOnError: step.continueOnError } : {}),
    ...(step.timeoutMinutes !== undefined ? { timeoutMinutes: step.timeoutMinutes } : {}),
  };

  if (step.kind === 'run') {
    return {
      kind: 'run',
      run: step.run!.trim(),
      ...(step.shell !== undefined ? { shell: step.shell.trim() } : {}),
      ...(step.workingDirectory !== undefined
        ? { workingDirectory: step.workingDirectory.trim() }
        : {}),
      ...base,
    };
  }

  return {
    kind: 'uses',
    uses: step.uses!.trim(),
    ...base,
  };
}

function finalizeRunsOn(runsOn: string | readonly string[]): RunsOnTarget {
  if (typeof runsOn === 'string') {
    return runsOn.trim();
  }

  return runsOn.map((target) => target.trim()) as [string, ...string[]];
}

function finalizeNeeds(needs: readonly JobId[]): readonly [JobId, ...JobId[]] {
  return [...needs] as [JobId, ...JobId[]];
}

function finalizeMatrixAxisValues(values: readonly unknown[]): MatrixAxisValues {
  return values.map((value) => String(value).trim()) as unknown as MatrixAxisValues;
}

function finalizeMatrix(
  matrix: Readonly<Record<string, readonly unknown[] | unknown>>
): WorkflowMatrix {
  return Object.fromEntries(
    Object.entries(matrix).map(([key, values]) => [
      key,
      finalizeMatrixAxisValues(values as readonly unknown[]),
    ])
  );
}

function finalizeIncludeEntry(entry: Readonly<Record<string, unknown>>): MatrixIncludeEntry {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => [key, String(value).trim()])
  );
}

function finalizeExcludeEntry(entry: Readonly<Record<string, unknown>>): MatrixExcludeEntry {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => [key, String(value).trim()])
  );
}

function finalizeStrategy(strategy: {
  readonly failFast?: boolean;
  readonly maxParallel?: number;
  readonly matrix: Readonly<Record<string, readonly unknown[] | unknown>>;
  readonly include?: readonly Readonly<Record<string, unknown>>[];
  readonly exclude?: readonly Readonly<Record<string, unknown>>[];
}): WorkflowStrategy {
  return {
    ...(strategy.failFast !== undefined ? { failFast: strategy.failFast } : {}),
    ...(strategy.maxParallel !== undefined ? { maxParallel: strategy.maxParallel } : {}),
    matrix: finalizeMatrix(strategy.matrix),
    ...(strategy.include !== undefined && strategy.include.length > 0
      ? { include: strategy.include.map(finalizeIncludeEntry) }
      : {}),
    ...(strategy.exclude !== undefined && strategy.exclude.length > 0
      ? { exclude: strategy.exclude.map(finalizeExcludeEntry) }
      : {}),
  };
}

function finalizeDefaultsRun(defaultsRun: WorkflowDefaultsRun): WorkflowDefaultsRun {
  return {
    ...(defaultsRun.shell !== undefined ? { shell: defaultsRun.shell.trim() } : {}),
    ...(defaultsRun.workingDirectory !== undefined
      ? { workingDirectory: defaultsRun.workingDirectory.trim() }
      : {}),
  };
}

function finalizeReusableWorkflowJobSecrets(
  secrets: ReusableWorkflowJobSecrets
): ReusableWorkflowJobSecrets {
  if (secrets === 'inherit') {
    return secrets;
  }

  return Object.fromEntries(Object.entries(secrets).map(([key, value]) => [key, value.trim()]));
}

class JobBuilder {
  readonly id: JobId;

  private jobName?: string;
  private jobIf?: string;
  private jobNeeds?: readonly JobId[];
  private jobContinueOnError?: boolean;
  private jobPermissions?: WorkflowPermissions;
  private jobTimeoutMinutes?: number;
  private jobDefaults?: {
    readonly run: WorkflowDefaultsRun;
  };
  private jobConcurrency?: WorkflowConcurrency;
  private jobEnv?: WorkflowEnv;
  private jobStrategy?: {
    readonly failFast?: boolean;
    readonly maxParallel?: number;
    readonly matrix: Readonly<Record<string, readonly unknown[] | unknown>>;
    readonly include?: readonly Readonly<Record<string, unknown>>[];
    readonly exclude?: readonly Readonly<Record<string, unknown>>[];
  };
  private jobRunsOn?: string | readonly string[];
  private jobContainer?: ContainerConfig;
  private jobServices?: WorkflowServices;
  private jobOutputs?: WorkflowJobOutputs;
  private jobKind: 'steps' | 'reusable-workflow' = 'steps';
  private jobUses?: string;
  private jobWith?: Readonly<Record<string, string>>;
  private jobSecrets?: ReusableWorkflowJobSecrets;
  private readonly jobSteps: WorkflowStepDraft[] = [];

  constructor(id: JobId) {
    this.id = id;
  }

  displayName(name: string): this {
    this.jobName = name;
    return this;
  }

  ifCondition(expression: string): this {
    this.jobIf = expression;
    return this;
  }

  needs(dependencies: JobId | readonly [JobId, ...JobId[]]): this {
    this.jobNeeds = (Array.isArray(dependencies) ? [...dependencies] : [dependencies]) as JobId[];
    return this;
  }

  continueOnError(continueOnError: boolean): this {
    this.jobContinueOnError = continueOnError;
    return this;
  }

  permissions(permissions: WorkflowPermissions): this {
    this.jobPermissions = clonePermissions(permissions);
    return this;
  }

  timeoutMinutes(timeoutMinutes: number): this {
    this.jobTimeoutMinutes = timeoutMinutes;
    return this;
  }

  defaultsRun(defaultsRun: WorkflowDefaultsRun): this {
    this.jobDefaults = {
      run: cloneDefaultsRun(defaultsRun),
    };
    return this;
  }

  concurrency(concurrency: WorkflowConcurrency): this {
    this.jobConcurrency = cloneConcurrency(concurrency);
    return this;
  }

  env(env: WorkflowEnv): this {
    this.jobEnv = cloneEnv(env);
    return this;
  }

  strategyMatrix(matrix: WorkflowMatrix): this {
    this.jobStrategy = {
      ...this.jobStrategy,
      matrix: cloneMatrix(matrix),
    };
    return this;
  }

  strategyFailFast(failFast: boolean): this {
    this.jobStrategy = {
      ...(this.jobStrategy ?? { matrix: {} }),
      failFast,
    };
    return this;
  }

  strategyMaxParallel(maxParallel: number): this {
    this.jobStrategy = {
      ...(this.jobStrategy ?? { matrix: {} }),
      maxParallel,
    };
    return this;
  }

  strategyInclude(include: readonly MatrixIncludeEntry[]): this {
    this.jobStrategy = {
      ...(this.jobStrategy ?? { matrix: {} }),
      include: include.map((entry) => ({ ...entry })),
    };
    return this;
  }

  strategyExclude(exclude: readonly MatrixExcludeEntry[]): this {
    this.jobStrategy = {
      ...(this.jobStrategy ?? { matrix: {} }),
      exclude: exclude.map((entry) => ({ ...entry })),
    };
    return this;
  }

  runsOn(target: string | readonly string[]): this {
    this.jobRunsOn = Array.isArray(target) ? [...target] : target;
    return this;
  }

  container(config: ContainerConfig): this {
    this.jobContainer = cloneContainerConfig(config);
    return this;
  }

  services(services: WorkflowServices): this {
    this.jobServices = cloneServices(services);
    return this;
  }

  outputs(outputs: WorkflowJobOutputs): this {
    this.jobOutputs = { ...outputs };
    return this;
  }

  usesWorkflow(
    workflow: string,
    options: Readonly<{
      with?: Readonly<Record<string, string>>;
      secrets?: ReusableWorkflowJobSecrets;
    }> = {}
  ): this {
    this.jobKind = 'reusable-workflow';
    this.jobUses = workflow;
    if (options.with !== undefined) {
      this.jobWith = { ...options.with };
    } else {
      delete this.jobWith;
    }

    if (options.secrets !== undefined) {
      this.jobSecrets = options.secrets === 'inherit' ? 'inherit' : { ...options.secrets };
    } else {
      delete this.jobSecrets;
    }
    return this;
  }

  run(command: string, metadata: RunStepMetadata = {}): this {
    this.jobSteps.push({
      kind: 'run',
      run: command,
      ...cloneRunStepMetadata(metadata),
    });
    return this;
  }

  uses(action: string, metadata: StepMetadata = {}): this {
    this.jobSteps.push({
      kind: 'uses',
      uses: action,
      ...cloneStepMetadata(metadata),
    });
    return this;
  }

  toDraft(): WorkflowJobDraft {
    if (this.jobKind === 'reusable-workflow') {
      return {
        kind: 'reusable-workflow',
        id: this.id,
        ...(this.jobName !== undefined ? { name: this.jobName } : {}),
        ...(this.jobIf !== undefined ? { if: this.jobIf } : {}),
        ...(this.jobNeeds !== undefined ? { needs: [...this.jobNeeds] } : {}),
        ...(this.jobContinueOnError !== undefined
          ? { continueOnError: this.jobContinueOnError }
          : {}),
        ...(this.jobPermissions !== undefined
          ? { permissions: clonePermissions(this.jobPermissions) }
          : {}),
        ...(this.jobUses !== undefined ? { uses: this.jobUses } : {}),
        ...(this.jobWith !== undefined ? { with: { ...this.jobWith } } : {}),
        ...(this.jobSecrets !== undefined
          ? {
              secrets: this.jobSecrets === 'inherit' ? 'inherit' : { ...this.jobSecrets },
            }
          : {}),
        ...(this.jobRunsOn !== undefined ? { runsOn: this.jobRunsOn } : {}),
        ...(this.jobContainer !== undefined
          ? { container: cloneContainerConfig(this.jobContainer) }
          : {}),
        ...(this.jobServices !== undefined ? { services: cloneServices(this.jobServices) } : {}),
        steps: this.jobSteps.map((step) => ({
          kind: step.kind,
          ...(step.run !== undefined ? { run: step.run } : {}),
          ...(step.shell !== undefined ? { shell: step.shell } : {}),
          ...(step.uses !== undefined ? { uses: step.uses } : {}),
          ...(step.workingDirectory !== undefined
            ? { workingDirectory: step.workingDirectory }
            : {}),
          ...cloneStepMetadata(step),
        })),
      };
    }

    return {
      kind: 'steps',
      id: this.id,
      ...(this.jobName !== undefined ? { name: this.jobName } : {}),
      ...(this.jobIf !== undefined ? { if: this.jobIf } : {}),
      ...(this.jobNeeds !== undefined ? { needs: [...this.jobNeeds] } : {}),
      ...(this.jobContinueOnError !== undefined
        ? { continueOnError: this.jobContinueOnError }
        : {}),
      ...(this.jobPermissions !== undefined
        ? { permissions: clonePermissions(this.jobPermissions) }
        : {}),
      ...(this.jobTimeoutMinutes !== undefined ? { timeoutMinutes: this.jobTimeoutMinutes } : {}),
      ...(this.jobDefaults !== undefined
        ? { defaults: { run: cloneDefaultsRun(this.jobDefaults.run) } }
        : {}),
      ...(this.jobConcurrency !== undefined
        ? { concurrency: cloneConcurrency(this.jobConcurrency) }
        : {}),
      ...(this.jobEnv !== undefined ? { env: cloneEnv(this.jobEnv) } : {}),
      ...(this.jobStrategy !== undefined
        ? {
            strategy: {
              ...(this.jobStrategy.failFast !== undefined
                ? { failFast: this.jobStrategy.failFast }
                : {}),
              ...(this.jobStrategy.maxParallel !== undefined
                ? { maxParallel: this.jobStrategy.maxParallel }
                : {}),
              matrix: cloneMatrix(this.jobStrategy.matrix),
              ...(this.jobStrategy.include !== undefined
                ? { include: this.jobStrategy.include.map((entry) => ({ ...entry })) }
                : {}),
              ...(this.jobStrategy.exclude !== undefined
                ? { exclude: this.jobStrategy.exclude.map((entry) => ({ ...entry })) }
                : {}),
            },
          }
        : {}),
      ...(this.jobRunsOn !== undefined ? { runsOn: this.jobRunsOn } : {}),
      ...(this.jobContainer !== undefined
        ? { container: cloneContainerConfig(this.jobContainer) }
        : {}),
      ...(this.jobServices !== undefined ? { services: cloneServices(this.jobServices) } : {}),
      ...(this.jobOutputs !== undefined ? { outputs: { ...this.jobOutputs } } : {}),
      steps: this.jobSteps.map((step) => ({
        kind: step.kind,
        ...(step.run !== undefined ? { run: step.run } : {}),
        ...(step.shell !== undefined ? { shell: step.shell } : {}),
        ...(step.uses !== undefined ? { uses: step.uses } : {}),
        ...(step.workingDirectory !== undefined ? { workingDirectory: step.workingDirectory } : {}),
        ...cloneStepMetadata(step),
      })),
    };
  }
}

export class WorkflowBuilder {
  readonly id: WorkflowId;
  readonly name: string;
  readonly triggers: WorkflowTrigger[] = [];

  private readonly jobs: WorkflowJobDraft[] = [];
  private runNameDraft?: string;
  private permissionsDraft?: WorkflowPermissions;
  private defaultsDraft?: {
    readonly run: WorkflowDefaultsRun;
  };
  private envDraft?: WorkflowEnv;
  private concurrencyDraft?: WorkflowConcurrency;

  constructor(id: WorkflowId, name: string) {
    this.id = id;
    this.name = name;
  }

  runName(runName: string): this {
    this.runNameDraft = runName;
    return this;
  }

  getRunName(): string | undefined {
    return this.runNameDraft;
  }

  private addFilteredTrigger(type: FilteredTriggerType, filter: TriggerFilter): this {
    this.triggers.push({
      type,
      ...cloneFilter(filter),
    });
    return this;
  }

  onPush(filter: TriggerFilter = {}): this {
    return this.addFilteredTrigger('push', filter);
  }

  onPullRequest(filter: PullRequestTriggerFilter = {}): this {
    this.triggers.push({
      type: 'pull_request',
      ...clonePullRequestFilter(filter),
    });
    return this;
  }

  onWorkflowDispatch(inputs?: WorkflowDispatchInputs): this {
    this.triggers.push({
      type: 'workflow_dispatch',
      ...(inputs ? { inputs: cloneDispatchInputs(inputs) } : {}),
    });
    return this;
  }

  onWorkflowCall(
    config: Readonly<{
      inputs?: WorkflowCallInputs;
      outputs?: WorkflowCallOutputs;
      secrets?: WorkflowCallSecrets;
    }> = {}
  ): this {
    this.triggers.push({
      type: 'workflow_call',
      ...(config.inputs ? { inputs: cloneWorkflowCallInputs(config.inputs) } : {}),
      ...(config.outputs ? { outputs: cloneWorkflowCallOutputs(config.outputs) } : {}),
      ...(config.secrets ? { secrets: cloneWorkflowCallSecrets(config.secrets) } : {}),
    });
    return this;
  }

  onSchedule(cron: string | readonly [string, ...string[]]): this {
    this.triggers.push({
      type: 'schedule',
      cron: (Array.isArray(cron) ? [...cron] : [cron]) as [string, ...string[]],
    });
    return this;
  }

  permissions(permissions: WorkflowPermissions): this {
    this.permissionsDraft = clonePermissions(permissions);
    return this;
  }

  getPermissions(): WorkflowPermissions | undefined {
    return this.permissionsDraft;
  }

  defaultsRun(defaultsRun: WorkflowDefaultsRun): this {
    this.defaultsDraft = {
      run: cloneDefaultsRun(defaultsRun),
    };
    return this;
  }

  getDefaults():
    | {
        readonly run: WorkflowDefaultsRun;
      }
    | undefined {
    return this.defaultsDraft;
  }

  env(env: WorkflowEnv): this {
    this.envDraft = cloneEnv(env);
    return this;
  }

  getEnv(): WorkflowEnv | undefined {
    return this.envDraft;
  }

  concurrency(concurrency: WorkflowConcurrency): this {
    this.concurrencyDraft = cloneConcurrency(concurrency);
    return this;
  }

  getConcurrency(): WorkflowConcurrency | undefined {
    return this.concurrencyDraft;
  }

  addJob(id: JobId, configure: (job: JobBuilder) => void): this {
    const builder = new JobBuilder(id);
    configure(builder);
    this.jobs.push(builder.toDraft());
    return this;
  }

  build(): WorkflowDefinition {
    const issues = createValidationIssues(this, this.jobs);

    if (issues.length > 0) {
      throw new WorkflowValidationError(issues);
    }

    const jobs: WorkflowJob[] = this.jobs.map((job) => {
      if (job.kind === 'reusable-workflow') {
        return {
          kind: 'reusable-workflow',
          id: job.id,
          ...(job.name !== undefined ? { name: job.name.trim() } : {}),
          ...(job.if !== undefined ? { if: job.if } : {}),
          ...(job.needs !== undefined ? { needs: finalizeNeeds(job.needs) } : {}),
          ...(job.continueOnError !== undefined ? { continueOnError: job.continueOnError } : {}),
          ...(job.permissions !== undefined
            ? { permissions: canonicalizePermissions(job.permissions) }
            : {}),
          ...(job.secrets !== undefined
            ? { secrets: finalizeReusableWorkflowJobSecrets(job.secrets) }
            : {}),
          ...(job.with !== undefined && Object.keys(job.with).length > 0
            ? { with: { ...job.with } }
            : {}),
          uses: job.uses!.trim(),
        } satisfies ReusableWorkflowJob;
      }

      return {
        kind: 'steps',
        id: job.id,
        ...(job.name !== undefined ? { name: job.name.trim() } : {}),
        ...(job.if !== undefined ? { if: job.if } : {}),
        ...(job.needs !== undefined ? { needs: finalizeNeeds(job.needs) } : {}),
        ...(job.continueOnError !== undefined ? { continueOnError: job.continueOnError } : {}),
        ...(job.permissions !== undefined
          ? { permissions: canonicalizePermissions(job.permissions) }
          : {}),
        ...(job.timeoutMinutes !== undefined ? { timeoutMinutes: job.timeoutMinutes } : {}),
        ...(job.defaults !== undefined
          ? { defaults: { run: finalizeDefaultsRun(job.defaults.run) } }
          : {}),
        ...(job.concurrency !== undefined
          ? { concurrency: cloneConcurrency(job.concurrency) }
          : {}),
        ...(job.env !== undefined && Object.keys(job.env).length > 0
          ? { env: cloneEnv(job.env) }
          : {}),
        ...(job.strategy !== undefined ? { strategy: finalizeStrategy(job.strategy) } : {}),
        runsOn: finalizeRunsOn(job.runsOn!),
        ...(job.container !== undefined ? { container: cloneContainerConfig(job.container) } : {}),
        ...(job.services !== undefined ? { services: cloneServices(job.services) } : {}),
        ...(job.outputs !== undefined && Object.keys(job.outputs).length > 0
          ? { outputs: { ...job.outputs } }
          : {}),
        steps: job.steps.map(finalizeStep),
      } satisfies StepsJob;
    });

    return deepFreeze({
      id: this.id,
      name: this.name.trim(),
      ...(this.runNameDraft !== undefined ? { runName: this.runNameDraft.trim() } : {}),
      on: this.triggers.map(cloneTrigger),
      ...(this.permissionsDraft !== undefined
        ? { permissions: canonicalizePermissions(this.permissionsDraft) }
        : {}),
      ...(this.defaultsDraft !== undefined
        ? { defaults: { run: finalizeDefaultsRun(this.defaultsDraft.run) } }
        : {}),
      ...(this.envDraft !== undefined && Object.keys(this.envDraft).length > 0
        ? { env: cloneEnv(this.envDraft) }
        : {}),
      ...(this.concurrencyDraft !== undefined
        ? { concurrency: cloneConcurrency(this.concurrencyDraft) }
        : {}),
      jobs,
    });
  }
}

export function defineWorkflow(
  input: Readonly<{
    id: WorkflowId;
    name: string;
  }>
): WorkflowBuilder {
  return new WorkflowBuilder(input.id, input.name);
}
