import type { JobId, WorkflowId } from '@ghawb/shared';

export type FilteredTriggerType = 'push' | 'pull_request';
export type TriggerType = FilteredTriggerType | 'workflow_dispatch' | 'schedule';

export const PULL_REQUEST_ACTIVITY_TYPES = [
  'assigned',
  'unassigned',
  'labeled',
  'unlabeled',
  'opened',
  'edited',
  'closed',
  'reopened',
  'synchronize',
  'converted_to_draft',
  'ready_for_review',
  'locked',
  'unlocked',
  'review_requested',
  'review_request_removed',
  'auto_merge_enabled',
  'auto_merge_disabled',
] as const;

export type PullRequestActivityType = (typeof PULL_REQUEST_ACTIVITY_TYPES)[number];

export interface TriggerFilter {
  readonly branches?: readonly string[];
  readonly branchesIgnore?: readonly string[];
  readonly paths?: readonly string[];
  readonly pathsIgnore?: readonly string[];
  readonly tags?: readonly string[];
  readonly tagsIgnore?: readonly string[];
}

export interface PullRequestTriggerFilter extends TriggerFilter {
  readonly types?: readonly PullRequestActivityType[];
}

export interface FilteredWorkflowTrigger extends TriggerFilter {
  readonly type: FilteredTriggerType;
  readonly types?: readonly PullRequestActivityType[];
}

export const WORKFLOW_DISPATCH_INPUT_TYPES = [
  'string',
  'boolean',
  'choice',
  'number',
  'environment',
] as const;

export type WorkflowDispatchInputType = (typeof WORKFLOW_DISPATCH_INPUT_TYPES)[number];

export interface WorkflowDispatchInput {
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: string;
  readonly type?: WorkflowDispatchInputType;
  readonly options?: readonly [string, ...string[]];
}

export type WorkflowDispatchInputs = Readonly<Record<string, WorkflowDispatchInput>>;

export interface WorkflowDispatchTrigger {
  readonly type: 'workflow_dispatch';
  readonly inputs?: WorkflowDispatchInputs;
}

export interface ScheduleTrigger {
  readonly type: 'schedule';
  readonly cron: readonly [string, ...string[]];
}

export type WorkflowTrigger = FilteredWorkflowTrigger | WorkflowDispatchTrigger | ScheduleTrigger;

export interface StepMetadata {
  readonly id?: string;
  readonly name?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly with?: Readonly<Record<string, string>>;
  readonly if?: string;
  readonly continueOnError?: boolean;
  readonly timeoutMinutes?: number;
}

export interface RunStepMetadata extends StepMetadata {
  readonly shell?: string;
  readonly workingDirectory?: string;
}

export interface RunStep extends RunStepMetadata {
  readonly kind: 'run';
  readonly run: string;
}

export interface UsesStep extends StepMetadata {
  readonly kind: 'uses';
  readonly uses: string;
}

export type WorkflowStep = RunStep | UsesStep;

export const WORKFLOW_PERMISSION_KEYS = [
  'actions',
  'artifact-metadata',
  'attestations',
  'checks',
  'contents',
  'deployments',
  'discussions',
  'id-token',
  'issues',
  'models',
  'packages',
  'pages',
  'pull-requests',
  'security-events',
  'statuses',
] as const;

export type WorkflowPermissionKey = (typeof WORKFLOW_PERMISSION_KEYS)[number];
export type WorkflowPermissionLevel = 'read' | 'write' | 'none';
export type WorkflowPermissions = Readonly<
  Partial<Record<WorkflowPermissionKey, WorkflowPermissionLevel>>
>;

export type RunsOnTarget = string | readonly [string, ...string[]];
export type MatrixAxisValues = readonly [string, ...string[]];
export type WorkflowMatrix = Readonly<Record<string, MatrixAxisValues>>;
export type MatrixIncludeEntry = Readonly<Record<string, string>>;
export type MatrixExcludeEntry = Readonly<Record<string, string>>;

export interface WorkflowStrategy {
  readonly failFast?: boolean;
  readonly maxParallel?: number;
  readonly matrix: WorkflowMatrix;
  readonly include?: readonly MatrixIncludeEntry[];
  readonly exclude?: readonly MatrixExcludeEntry[];
}

export interface WorkflowDefaultsRun {
  readonly shell?: string;
  readonly workingDirectory?: string;
}

export interface WorkflowConcurrency {
  readonly group: string;
  readonly cancelInProgress?: boolean;
}

export type WorkflowEnv = Readonly<Record<string, string>>;
export type WorkflowJobOutputs = Readonly<Record<string, string>>;

export interface WorkflowJob {
  readonly id: JobId;
  readonly if?: string;
  readonly needs?: readonly [JobId, ...JobId[]];
  readonly continueOnError?: boolean;
  readonly permissions?: WorkflowPermissions;
  readonly timeoutMinutes?: number;
  readonly defaults?: {
    readonly run: WorkflowDefaultsRun;
  };
  readonly concurrency?: WorkflowConcurrency;
  readonly env?: WorkflowEnv;
  readonly strategy?: WorkflowStrategy;
  readonly runsOn: RunsOnTarget;
  readonly outputs?: WorkflowJobOutputs;
  readonly steps: readonly WorkflowStep[];
}

export interface WorkflowDefinition {
  readonly id: WorkflowId;
  readonly name: string;
  readonly on: readonly WorkflowTrigger[];
  readonly permissions?: WorkflowPermissions;
  readonly env?: WorkflowEnv;
  readonly concurrency?: WorkflowConcurrency;
  readonly jobs: readonly WorkflowJob[];
}
