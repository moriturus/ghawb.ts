import { JobBuilder } from "@ghawb/sdk";
import { WorkflowValidationError } from "@ghawb/shared";

export interface NodeBootstrapOptions {
  readonly nodeVersion: string;
  readonly install?: string;
  readonly cache?: "npm" | "pnpm" | "yarn";
  readonly cacheDependencyPath?: string | readonly string[];
  readonly registryUrl?: string;
}

function applyNodeBootstrap(job: JobBuilder, options: NodeBootstrapOptions): JobBuilder {
  if (typeof options.nodeVersion !== "string" || options.nodeVersion.trim().length === 0) {
    throw new WorkflowValidationError([
      'nodeBootstrap() requires "nodeVersion" to be a non-empty string.',
    ]);
  }

  if (options.install !== undefined && options.install.trim().length === 0) {
    throw new WorkflowValidationError([
      'nodeBootstrap() requires "install" to be omitted or a non-empty string.',
    ]);
  }

  if (options.registryUrl !== undefined && options.registryUrl.trim().length === 0) {
    throw new WorkflowValidationError([
      'nodeBootstrap() requires "registryUrl" to be omitted or a non-empty string.',
    ]);
  }

  const setupNodeWith: Record<string, string> = {
    "node-version": options.nodeVersion.trim(),
  };

  if (options.cache !== undefined) {
    setupNodeWith.cache = options.cache;
  }

  if (options.registryUrl !== undefined) {
    setupNodeWith["registry-url"] = options.registryUrl.trim();
  }

  const cacheDependencyPath = options.cacheDependencyPath;

  if (cacheDependencyPath !== undefined) {
    const serializedCacheDependencyPath =
      typeof cacheDependencyPath === "string"
        ? cacheDependencyPath
        : cacheDependencyPath.join("\n");

    setupNodeWith["cache-dependency-path"] = serializedCacheDependencyPath;
  }

  job.uses("actions/checkout@v4", "Checkout");
  job.uses("actions/setup-node@v4", {
    name: "Setup Node",
    with: setupNodeWith,
  });
  job.run(options.install ?? "npm ci", "Install");
  return job;
}

export function nodeBootstrap(options: NodeBootstrapOptions): (job: JobBuilder) => JobBuilder {
  return (job) => applyNodeBootstrap(job, options);
}
