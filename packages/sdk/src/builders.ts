import { WorkflowValidationError, type JobId, type WorkflowId } from '@ghawb/shared';

import type {
  FilteredTriggerType,
  RunsOnTarget,
  StepMetadata,
  TriggerFilter,
  WorkflowDefinition,
  WorkflowJob,
  WorkflowStep,
  WorkflowTrigger,
} from './model.ts';

interface WorkflowStepDraft extends StepMetadata {
  readonly kind: 'run' | 'uses';
  readonly run?: string;
  readonly uses?: string;
}

interface WorkflowJobDraft {
  readonly id: JobId;
  readonly needs?: readonly JobId[];
  readonly runsOn?: string | readonly string[];
  readonly steps: readonly WorkflowStepDraft[];
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
    ...(filter.paths ? { paths: [...filter.paths] } : {}),
  };
}

function cloneTrigger(trigger: WorkflowTrigger): WorkflowTrigger {
  if (trigger.type === 'workflow_dispatch') {
    return {
      type: 'workflow_dispatch',
    };
  }

  if (trigger.type === 'schedule') {
    return {
      type: 'schedule',
      cron: [...trigger.cron] as [string, ...string[]],
    };
  }

  return {
    type: trigger.type,
    ...cloneFilter(trigger),
  };
}

function isValidCronExpression(value: string): boolean {
  const fields = value.trim().split(/\s+/);
  return fields.length === 5 && fields.every((field) => field.length > 0);
}

function cloneStepMetadata(metadata: StepMetadata): StepMetadata {
  return {
    ...(metadata.name !== undefined ? { name: metadata.name } : {}),
    ...(metadata.env ? { env: { ...metadata.env } } : {}),
    ...(metadata.with ? { with: { ...metadata.with } } : {}),
    ...(metadata.if !== undefined ? { if: metadata.if } : {}),
  };
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

  if (workflow.triggers.length === 0) {
    issues.push('workflow must define at least one trigger');
  }

  const seenTriggerTypes = new Set<string>();

  for (const trigger of workflow.triggers) {
    if (seenTriggerTypes.has(trigger.type)) {
      issues.push(`duplicate trigger "${trigger.type}"`);
      continue;
    }

    seenTriggerTypes.add(trigger.type);

    if (trigger.type === 'workflow_dispatch') {
      if ('branches' in trigger) {
        issues.push('trigger "workflow_dispatch" does not support branches');
      }

      if ('paths' in trigger) {
        issues.push('trigger "workflow_dispatch" does not support paths');
      }

      continue;
    }

    if (trigger.type === 'schedule') {
      if ('branches' in trigger) {
        issues.push('trigger "schedule" does not support branches');
      }

      if ('paths' in trigger) {
        issues.push('trigger "schedule" does not support paths');
      }

      if (trigger.cron.length === 0) {
        issues.push('trigger "schedule" must define at least one cron entry');
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
          issues.push(`trigger "schedule" cron entry "${cron}" must have exactly 5 fields`);
        }
      }

      continue;
    }

    for (const [label, values] of [
      ['branches', trigger.branches],
      ['paths', trigger.paths],
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
  }

  if (jobs.length === 0) {
    issues.push('workflow must define at least one job');
  }

  const seenJobIds = new Set<string>();

  for (const job of jobs) {
    const jobId = String(job.id);

    if (seenJobIds.has(jobId)) {
      issues.push(`duplicate job id "${jobId}"`);
    } else {
      seenJobIds.add(jobId);
    }

    if (job.runsOn === undefined) {
      issues.push(`job "${jobId}" must define runs-on`);
    } else if (typeof job.runsOn === 'string') {
      if (job.runsOn.trim().length === 0) {
        issues.push(`job "${jobId}" runs-on must not be empty`);
      }
    } else {
      if (job.runsOn.length === 0) {
        issues.push(`job "${jobId}" runs-on array must not be empty`);
      }

      if (job.runsOn.some((target) => target.trim().length === 0)) {
        issues.push(`job "${jobId}" runs-on array must not contain blank values`);
      }
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

    if (job.steps.length === 0) {
      issues.push(`job "${jobId}" must define at least one step`);
    }

    for (const [index, step] of job.steps.entries()) {
      const location = `job "${jobId}" step ${index + 1}`;
      const value = step.kind === 'run' ? step.run : step.uses;

      if (value === undefined || value.trim().length === 0) {
        issues.push(`${location} must define a non-empty ${step.kind} value`);
      }

      if (step.name !== undefined && step.name.trim().length === 0) {
        issues.push(`${location} name must not be empty`);
      }

      if (step.if !== undefined && step.if.trim().length === 0) {
        issues.push(`${location} if must not be empty`);
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
  }

  return issues;
}

function finalizeStep(step: WorkflowStepDraft): WorkflowStep {
  const base = {
    ...(step.name !== undefined ? { name: step.name.trim() } : {}),
    ...(step.env ? { env: { ...step.env } } : {}),
    ...(step.with ? { with: { ...step.with } } : {}),
    ...(step.if !== undefined ? { if: step.if.trim() } : {}),
  };

  if (step.kind === 'run') {
    return {
      kind: 'run',
      run: step.run!.trim(),
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

class JobBuilder {
  readonly id: JobId;

  private jobNeeds?: readonly JobId[];
  private jobRunsOn?: string | readonly string[];
  private readonly jobSteps: WorkflowStepDraft[] = [];

  constructor(id: JobId) {
    this.id = id;
  }

  needs(dependencies: JobId | readonly [JobId, ...JobId[]]): this {
    this.jobNeeds = (Array.isArray(dependencies) ? [...dependencies] : [dependencies]) as JobId[];
    return this;
  }

  runsOn(target: string | readonly string[]): this {
    this.jobRunsOn = Array.isArray(target) ? [...target] : target;
    return this;
  }

  run(command: string, metadata: StepMetadata = {}): this {
    this.jobSteps.push({
      kind: 'run',
      run: command,
      ...cloneStepMetadata(metadata),
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
    return {
      id: this.id,
      ...(this.jobNeeds !== undefined ? { needs: [...this.jobNeeds] } : {}),
      ...(this.jobRunsOn !== undefined ? { runsOn: this.jobRunsOn } : {}),
      steps: this.jobSteps.map((step) => ({
        kind: step.kind,
        ...(step.run !== undefined ? { run: step.run } : {}),
        ...(step.uses !== undefined ? { uses: step.uses } : {}),
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

  constructor(id: WorkflowId, name: string) {
    this.id = id;
    this.name = name;
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

  onPullRequest(filter: TriggerFilter = {}): this {
    return this.addFilteredTrigger('pull_request', filter);
  }

  onWorkflowDispatch(): this {
    this.triggers.push({
      type: 'workflow_dispatch',
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

    const jobs: WorkflowJob[] = this.jobs.map((job) => ({
      id: job.id,
      ...(job.needs !== undefined ? { needs: finalizeNeeds(job.needs) } : {}),
      runsOn: finalizeRunsOn(job.runsOn!),
      steps: job.steps.map(finalizeStep),
    }));

    return deepFreeze({
      id: this.id,
      name: this.name.trim(),
      on: this.triggers.map(cloneTrigger),
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
