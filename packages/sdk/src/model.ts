import type { JobId, WorkflowId } from '@ghawb/shared';

export type TriggerType = 'push' | 'pull_request';

export interface TriggerFilter {
  readonly branches?: readonly string[];
  readonly paths?: readonly string[];
}

export interface WorkflowTrigger extends TriggerFilter {
  readonly type: TriggerType;
}

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

export interface WorkflowJob {
  readonly id: JobId;
  readonly runsOn: RunsOnTarget;
  readonly steps: readonly WorkflowStep[];
}

export interface WorkflowDefinition {
  readonly id: WorkflowId;
  readonly name: string;
  readonly on: readonly WorkflowTrigger[];
  readonly jobs: readonly WorkflowJob[];
}
