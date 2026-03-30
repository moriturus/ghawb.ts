import type { JobId, WorkflowId } from '@ghawb/shared';

export type FilteredTriggerType = 'push' | 'pull_request';
export type TriggerType = FilteredTriggerType | 'workflow_dispatch' | 'schedule';

export interface TriggerFilter {
  readonly branches?: readonly string[];
  readonly paths?: readonly string[];
}

export interface FilteredWorkflowTrigger extends TriggerFilter {
  readonly type: FilteredTriggerType;
}

export interface WorkflowDispatchTrigger {
  readonly type: 'workflow_dispatch';
}

export interface ScheduleTrigger {
  readonly type: 'schedule';
  readonly cron: readonly [string, ...string[]];
}

export type WorkflowTrigger = FilteredWorkflowTrigger | WorkflowDispatchTrigger | ScheduleTrigger;

export interface StepMetadata {
  readonly name?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly with?: Readonly<Record<string, string>>;
  readonly if?: string;
}

export interface RunStep extends StepMetadata {
  readonly kind: 'run';
  readonly run: string;
}

export interface UsesStep extends StepMetadata {
  readonly kind: 'uses';
  readonly uses: string;
}

export type WorkflowStep = RunStep | UsesStep;

export type RunsOnTarget = string | readonly [string, ...string[]];
export type MatrixAxisValues = readonly [string, ...string[]];
export type WorkflowMatrix = Readonly<Record<string, MatrixAxisValues>>;

export interface WorkflowStrategy {
  readonly matrix: WorkflowMatrix;
}

export interface WorkflowJob {
  readonly id: JobId;
  readonly needs?: readonly [JobId, ...JobId[]];
  readonly strategy?: WorkflowStrategy;
  readonly runsOn: RunsOnTarget;
  readonly steps: readonly WorkflowStep[];
}

export interface WorkflowDefinition {
  readonly id: WorkflowId;
  readonly name: string;
  readonly on: readonly WorkflowTrigger[];
  readonly jobs: readonly WorkflowJob[];
}
