import type { JobId, WorkflowId } from "@ghawb/shared";

export type FilteredTriggerType = "push" | "pull_request" | "pull_request_target";

export type SimpleEventType =
  | "check_run"
  | "check_suite"
  | "create"
  | "delete"
  | "deployment"
  | "deployment_status"
  | "discussion"
  | "discussion_comment"
  | "fork"
  | "gollum"
  | "issue_comment"
  | "issues"
  | "label"
  | "member"
  | "merge_group"
  | "milestone"
  | "page_build"
  | "public"
  | "registry_package"
  | "release"
  | "repository_dispatch"
  | "status"
  | "watch";

const SIMPLE_EVENT_TYPES: readonly string[] = [
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
];

export function isSimpleEventType(value: string): value is SimpleEventType {
  return SIMPLE_EVENT_TYPES.includes(value);
}

export const SIMPLE_EVENT_ACTIVITY_TYPES: Readonly<
  Partial<Record<SimpleEventType, readonly string[]>>
> = {
  check_run: ["created", "rerequested", "completed", "requested_action"],
  check_suite: ["completed", "requested", "rerequested"],
  discussion: [
    "created",
    "edited",
    "deleted",
    "transferred",
    "pinned",
    "unpinned",
    "labeled",
    "unlabeled",
    "locked",
    "unlocked",
    "category_changed",
    "answered",
    "unanswered",
  ],
  discussion_comment: ["created", "edited", "deleted"],
  issue_comment: ["created", "edited", "deleted"],
  issues: [
    "opened",
    "edited",
    "deleted",
    "transferred",
    "pinned",
    "unpinned",
    "closed",
    "reopened",
    "assigned",
    "unassigned",
    "labeled",
    "unlabeled",
    "locked",
    "unlocked",
    "milestoned",
    "demilestoned",
  ],
  label: ["created", "edited", "deleted"],
  member: ["added", "edited", "removed"],
  merge_group: ["checks_requested", "destroyed"],
  milestone: ["created", "closed", "opened", "edited", "deleted"],
  registry_package: ["published", "updated"],
  release: ["published", "unpublished", "created", "edited", "deleted", "prereleased", "released"],
  watch: ["started"],
};

export interface SimpleEventTrigger {
  readonly type: SimpleEventType;
  readonly types?: readonly string[];
}

export type TriggerType =
  | FilteredTriggerType
  | "workflow_dispatch"
  | "workflow_call"
  | "workflow_run"
  | "schedule"
  | SimpleEventType;

export const PULL_REQUEST_ACTIVITY_TYPES = [
  "assigned",
  "unassigned",
  "labeled",
  "unlabeled",
  "opened",
  "edited",
  "closed",
  "reopened",
  "synchronize",
  "converted_to_draft",
  "ready_for_review",
  "locked",
  "unlocked",
  "review_requested",
  "review_request_removed",
  "auto_merge_enabled",
  "auto_merge_disabled",
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
  "string",
  "boolean",
  "choice",
  "number",
  "environment",
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
  readonly type: "workflow_dispatch";
  readonly inputs?: WorkflowDispatchInputs;
}

export interface WorkflowCallInput {
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: string;
  readonly type?: WorkflowDispatchInputType;
}

export type WorkflowCallInputs = Readonly<Record<string, WorkflowCallInput>>;

export interface WorkflowCallOutput {
  readonly description?: string;
  readonly value: string;
}

export type WorkflowCallOutputs = Readonly<Record<string, WorkflowCallOutput>>;

export interface WorkflowCallSecret {
  readonly description?: string;
  readonly required?: boolean;
}

export type WorkflowCallSecrets = Readonly<Record<string, WorkflowCallSecret>>;

export interface WorkflowCallTrigger {
  readonly type: "workflow_call";
  readonly inputs?: WorkflowCallInputs;
  readonly outputs?: WorkflowCallOutputs;
  readonly secrets?: WorkflowCallSecrets;
}

export interface ScheduleTrigger {
  readonly type: "schedule";
  readonly cron: readonly [string, ...string[]];
}

export const WORKFLOW_RUN_ACTIVITY_TYPES = ["completed", "requested", "in_progress"] as const;
export type WorkflowRunActivityType = (typeof WORKFLOW_RUN_ACTIVITY_TYPES)[number];

export interface WorkflowRunTrigger {
  readonly type: "workflow_run";
  readonly workflows: readonly [string, ...string[]];
  readonly types?: readonly WorkflowRunActivityType[];
  readonly branches?: readonly string[];
  readonly branchesIgnore?: readonly string[];
}

export type WorkflowTrigger =
  | FilteredWorkflowTrigger
  | WorkflowDispatchTrigger
  | WorkflowCallTrigger
  | WorkflowRunTrigger
  | ScheduleTrigger
  | SimpleEventTrigger;

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

export interface ScriptReference {
  readonly path: string;
  readonly shell?: string;
  readonly expand?: boolean;
}

export interface RunStep extends RunStepMetadata {
  readonly kind: "run";
  readonly run: string;
  readonly scriptReference?: ScriptReference;
}

export interface UsesStep extends StepMetadata {
  readonly kind: "uses";
  readonly uses: ActionRef;
}

export type WorkflowStep = RunStep | UsesStep;

export const WORKFLOW_PERMISSION_KEYS = [
  "actions",
  "artifact-metadata",
  "attestations",
  "checks",
  "contents",
  "deployments",
  "discussions",
  "id-token",
  "issues",
  "models",
  "packages",
  "pages",
  "pull-requests",
  "security-events",
  "statuses",
] as const;

export type WorkflowPermissionKey = (typeof WORKFLOW_PERMISSION_KEYS)[number];
export type WorkflowPermissionLevel = "read" | "write" | "none";
export type WorkflowPermissionShorthand = "read-all" | "write-all";
export type WorkflowPermissionMap = Readonly<
  Partial<Record<WorkflowPermissionKey, WorkflowPermissionLevel>>
>;
export type WorkflowPermissions = WorkflowPermissionMap | WorkflowPermissionShorthand;

export const RunnerLabel = {
  UbuntuLatest: "ubuntu-latest",
  Ubuntu2404: "ubuntu-24.04",
  Ubuntu2204: "ubuntu-22.04",
  WindowsLatest: "windows-latest",
  Windows2025: "windows-2025",
  Windows2022: "windows-2022",
  MacOSLatest: "macos-latest",
  MacOS15: "macos-15",
  MacOS14: "macos-14",
  MacOS13: "macos-13",
  MacOSLarge15: "macos-15-large",
  MacOSLarge14: "macos-14-large",
  MacOSLarge13: "macos-13-large",
  MacOSXlarge15: "macos-15-xlarge",
  MacOSXlarge14: "macos-14-xlarge",
  MacOSXlarge13: "macos-13-xlarge",
} as const;

export type RunnerLabel = (typeof RunnerLabel)[keyof typeof RunnerLabel];

// -- ActionRef and WorkflowRef typed reference types --

type ExternalActionRef = `${string}/${string}@${string}`;
type LocalActionRef = `./${string}`;
type DockerActionRef = `docker://${string}`;

export type ActionRef = ExternalActionRef | LocalActionRef | DockerActionRef;

type ExternalWorkflowRef = `${string}/${string}/.github/workflows/${string}@${string}`;
type LocalWorkflowRef = `./.github/workflows/${string}`;

export type WorkflowRef = ExternalWorkflowRef | LocalWorkflowRef;

const EXTERNAL_ACTION_REF_PATTERN = /^[^/]+\/[^@]+@.+$/;
const LOCAL_ACTION_REF_PATTERN = /^\.\/.+$/;
const DOCKER_ACTION_REF_PATTERN = /^docker:\/\/.+$/;

export function isValidActionRef(value: string): value is ActionRef {
  return (
    EXTERNAL_ACTION_REF_PATTERN.test(value) ||
    LOCAL_ACTION_REF_PATTERN.test(value) ||
    DOCKER_ACTION_REF_PATTERN.test(value)
  );
}

const EXTERNAL_WORKFLOW_REF_PATTERN = /^[^/]+\/[^/]+\/\.github\/workflows\/[^@]+@.+$/;
const LOCAL_WORKFLOW_REF_PATTERN = /^\.\/\.github\/workflows\/.+$/;

export function isValidWorkflowRef(value: string): value is WorkflowRef {
  return EXTERNAL_WORKFLOW_REF_PATTERN.test(value) || LOCAL_WORKFLOW_REF_PATTERN.test(value);
}

export function actionRef(ref: string): ActionRef {
  const trimmed = ref.trim();
  if (trimmed.length === 0) {
    throw new Error(
      "actionRef value must not be empty. Expected: owner/repo@ref, ./path, or docker://image"
    );
  }
  if (!isValidActionRef(trimmed)) {
    throw new Error(
      `actionRef value "${trimmed}" is not a valid action reference. Expected: owner/repo@ref, ./path, or docker://image`
    );
  }
  return trimmed as ActionRef;
}

export function workflowRef(ref: string): WorkflowRef {
  const trimmed = ref.trim();
  if (trimmed.length === 0) {
    throw new Error(
      "workflowRef value must not be empty. Expected: owner/repo/.github/workflows/file@ref or ./.github/workflows/file"
    );
  }
  if (!isValidWorkflowRef(trimmed)) {
    throw new Error(
      `workflowRef value "${trimmed}" is not a valid workflow reference. Expected: owner/repo/.github/workflows/file@ref or ./.github/workflows/file`
    );
  }
  return trimmed as WorkflowRef;
}

export type RunsOnValue = RunnerLabel | (string & {});
export type RunsOnTarget = RunsOnValue | readonly [RunsOnValue, ...RunsOnValue[]];
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

export interface ContainerCredentials {
  readonly username: string;
  readonly password: string;
}

export type ContainerPort = number | string;
export type ContainerPorts = readonly ContainerPort[];

export interface ContainerConfig {
  readonly image: string;
  readonly credentials?: ContainerCredentials;
  readonly env?: WorkflowEnv;
  readonly ports?: ContainerPorts;
  readonly volumes?: readonly string[];
  readonly options?: string;
}

export type WorkflowServices = Readonly<Record<string, ContainerConfig>>;

export interface WorkflowJobBase {
  readonly id: JobId;
  readonly name?: string;
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
  readonly runsOn?: RunsOnTarget;
  readonly container?: ContainerConfig;
  readonly services?: WorkflowServices;
  readonly outputs?: WorkflowJobOutputs;
  readonly steps?: readonly WorkflowStep[];
  readonly secrets?: ReusableWorkflowJobSecrets;
  readonly with?: Readonly<Record<string, string>>;
  readonly uses?: WorkflowRef;
}

export type JobEnvironment = string | { readonly name: string; readonly url?: string };

export interface StepsJob extends WorkflowJobBase {
  readonly kind: "steps";
  readonly runsOn: RunsOnTarget;
  readonly environment?: JobEnvironment;
  readonly container?: ContainerConfig;
  readonly services?: WorkflowServices;
  readonly steps: readonly WorkflowStep[];
}

export type ReusableWorkflowJobSecrets = "inherit" | Readonly<Record<string, string>>;

export interface ReusableWorkflowJob extends WorkflowJobBase {
  readonly kind: "reusable-workflow";
  readonly uses: WorkflowRef;
}

export type WorkflowJob = StepsJob | ReusableWorkflowJob;

export interface WorkflowDefinition {
  readonly id: WorkflowId;
  readonly name: string;
  readonly runName?: string;
  readonly on: readonly WorkflowTrigger[];
  readonly permissions?: WorkflowPermissions;
  readonly defaults?: {
    readonly run: WorkflowDefaultsRun;
  };
  readonly env?: WorkflowEnv;
  readonly concurrency?: WorkflowConcurrency;
  readonly jobs: readonly WorkflowJob[];
}
