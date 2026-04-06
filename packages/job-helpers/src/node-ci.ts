import { JobBuilder } from "@ghawb/sdk";
import { WorkflowValidationError } from "@ghawb/shared";

export interface NodeCiOptions {
  readonly nodeVersion: string;
  readonly install?: string;
  readonly test?: string;
  readonly cache?: "npm" | "pnpm" | "yarn";
  readonly cacheDependencyPath?: string | readonly string[];
}

function applyNodeCi(job: JobBuilder, options: NodeCiOptions): JobBuilder {
  if (typeof options.nodeVersion !== "string" || options.nodeVersion.trim().length === 0) {
    throw new WorkflowValidationError([
      'nodeCi() requires "nodeVersion" to be a non-empty string.',
    ]);
  }

  if (options.install !== undefined && options.install.trim().length === 0) {
    throw new WorkflowValidationError([
      'nodeCi() requires "install" to be omitted or a non-empty string.',
    ]);
  }

  if (options.test !== undefined && options.test.trim().length === 0) {
    throw new WorkflowValidationError([
      'nodeCi() requires "test" to be omitted or a non-empty string.',
    ]);
  }

  const setupNodeWith: Record<string, string> = {
    "node-version": options.nodeVersion.trim(),
  };

  if (options.cache !== undefined) {
    setupNodeWith.cache = options.cache;
  }

  const cacheDependencyPath = options.cacheDependencyPath;

  if (cacheDependencyPath !== undefined) {
    const serializedCacheDependencyPath =
      typeof cacheDependencyPath === "string"
        ? cacheDependencyPath
        : cacheDependencyPath.join("\n");

    setupNodeWith["cache-dependency-path"] = serializedCacheDependencyPath;
  }

  job.uses("actions/checkout@v6", "Checkout");
  job.uses("actions/setup-node@v6", {
    name: "Setup Node",
    with: setupNodeWith,
  });
  job.run(options.install ?? "npm ci", "Install");
  job.run(options.test ?? "npm test", "Test");
  return job;
}

export function nodeCi(options: NodeCiOptions): (job: JobBuilder) => JobBuilder;
export function nodeCi(job: JobBuilder, options: NodeCiOptions): JobBuilder;
export function nodeCi(
  jobOrOptions: JobBuilder | NodeCiOptions,
  maybeOptions?: NodeCiOptions
): JobBuilder | ((job: JobBuilder) => JobBuilder) {
  if (jobOrOptions instanceof JobBuilder) {
    if (maybeOptions === undefined) {
      throw new WorkflowValidationError([
        'nodeCi() requires "options" when called with a JobBuilder. Expected: nodeCi(job, options) or nodeCi(options)',
      ]);
    }

    return applyNodeCi(jobOrOptions, maybeOptions);
  }

  return (job) => applyNodeCi(job, jobOrOptions);
}
