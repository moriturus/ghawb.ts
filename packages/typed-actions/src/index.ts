import { typedActionStep, type TypedActionStep } from "@ghawb/sdk";

export interface ActionsCheckoutInputs {
  readonly repository?: string;
  readonly ref?: string;
  readonly token?: string;
  readonly sshKey?: string;
  readonly sshKnownHosts?: string;
  readonly sshStrict?: boolean;
  readonly sshUser?: string;
  readonly persistCredentials?: boolean;
  readonly path?: string;
  readonly clean?: boolean;
  readonly filter?: string;
  readonly sparseCheckout?: string | readonly string[];
  readonly sparseCheckoutConeMode?: boolean;
  readonly fetchDepth?: number;
  readonly fetchTags?: boolean;
  readonly showProgress?: boolean;
  readonly lfs?: boolean;
  readonly submodules?: boolean | "recursive";
  readonly setSafeDirectory?: boolean;
  readonly githubServerUrl?: string;
}

export interface ActionsSetupNodeInputs {
  readonly alwaysAuth?: boolean;
  readonly nodeVersion?: string;
  readonly nodeVersionFile?: string;
  readonly architecture?: string;
  readonly checkLatest?: boolean;
  readonly registryUrl?: string;
  readonly scope?: string;
  readonly token?: string;
  readonly cache?: "npm" | "pnpm" | "yarn";
  readonly cacheDependencyPath?: string | readonly string[];
  readonly packageManagerCache?: boolean;
  readonly mirror?: string;
  readonly mirrorToken?: string;
}

export interface ActionsUploadArtifactInputs {
  readonly name?: string;
  readonly path?: string | readonly string[];
  readonly ifNoFilesFound?: "warn" | "error" | "ignore";
  readonly retentionDays?: number;
  readonly compressionLevel?: number;
  readonly overwrite?: boolean;
  readonly includeHiddenFiles?: boolean;
}

export interface ActionsDownloadArtifactInputs {
  readonly name?: string;
  readonly artifactIds?: string | number | readonly (string | number)[];
  readonly path?: string;
  readonly pattern?: string;
  readonly mergeMultiple?: boolean;
  readonly githubToken?: string;
  readonly repository?: string;
  readonly runId?: string | number;
  readonly skipDecompress?: boolean;
  readonly digestMismatch?: "ignore" | "info" | "warn" | "error";
}

type ActionsCheckoutWithKey =
  | "repository"
  | "ref"
  | "token"
  | "ssh-key"
  | "ssh-known-hosts"
  | "ssh-strict"
  | "ssh-user"
  | "persist-credentials"
  | "path"
  | "clean"
  | "filter"
  | "sparse-checkout"
  | "sparse-checkout-cone-mode"
  | "fetch-depth"
  | "fetch-tags"
  | "show-progress"
  | "lfs"
  | "submodules"
  | "set-safe-directory"
  | "github-server-url";

type ActionsSetupNodeWithKey =
  | "always-auth"
  | "node-version"
  | "node-version-file"
  | "architecture"
  | "check-latest"
  | "registry-url"
  | "scope"
  | "token"
  | "cache"
  | "cache-dependency-path"
  | "package-manager-cache"
  | "mirror"
  | "mirror-token";

type ActionsUploadArtifactWithKey =
  | "name"
  | "path"
  | "if-no-files-found"
  | "retention-days"
  | "compression-level"
  | "overwrite"
  | "include-hidden-files";

type ActionsDownloadArtifactWithKey =
  | "name"
  | "artifact-ids"
  | "path"
  | "pattern"
  | "merge-multiple"
  | "github-token"
  | "repository"
  | "run-id"
  | "skip-decompress"
  | "digest-mismatch";

export type ActionsCheckoutWith = Readonly<Partial<Record<ActionsCheckoutWithKey, string>>>;
export type ActionsSetupNodeWith = Readonly<Partial<Record<ActionsSetupNodeWithKey, string>>>;
export type ActionsUploadArtifactWith = Readonly<
  Partial<Record<ActionsUploadArtifactWithKey, string>>
>;
export type ActionsDownloadArtifactWith = Readonly<
  Partial<Record<ActionsDownloadArtifactWithKey, string>>
>;

function toBooleanString(value: boolean): string {
  return value ? "true" : "false";
}

function toNumberString(value: number): string {
  return String(value);
}

function toMultilineString(value: string | readonly string[]): string {
  return typeof value === "string" ? value : value.join("\n");
}

function toCommaSeparatedString(value: string | number | readonly (string | number)[]): string {
  if (!Array.isArray(value)) {
    return String(value);
  }

  return value.map((part) => String(part)).join(",");
}

export function actionsCheckout(
  inputs: ActionsCheckoutInputs = {}
): TypedActionStep<ActionsCheckoutWith> {
  return typedActionStep("actions/checkout@v4", {
    ...(inputs.repository !== undefined ? { repository: inputs.repository } : {}),
    ...(inputs.ref !== undefined ? { ref: inputs.ref } : {}),
    ...(inputs.token !== undefined ? { token: inputs.token } : {}),
    ...(inputs.sshKey !== undefined ? { "ssh-key": inputs.sshKey } : {}),
    ...(inputs.sshKnownHosts !== undefined ? { "ssh-known-hosts": inputs.sshKnownHosts } : {}),
    ...(inputs.sshStrict !== undefined ? { "ssh-strict": toBooleanString(inputs.sshStrict) } : {}),
    ...(inputs.sshUser !== undefined ? { "ssh-user": inputs.sshUser } : {}),
    ...(inputs.persistCredentials !== undefined
      ? { "persist-credentials": toBooleanString(inputs.persistCredentials) }
      : {}),
    ...(inputs.path !== undefined ? { path: inputs.path } : {}),
    ...(inputs.clean !== undefined ? { clean: toBooleanString(inputs.clean) } : {}),
    ...(inputs.filter !== undefined ? { filter: inputs.filter } : {}),
    ...(inputs.sparseCheckout !== undefined
      ? { "sparse-checkout": toMultilineString(inputs.sparseCheckout) }
      : {}),
    ...(inputs.sparseCheckoutConeMode !== undefined
      ? { "sparse-checkout-cone-mode": toBooleanString(inputs.sparseCheckoutConeMode) }
      : {}),
    ...(inputs.fetchDepth !== undefined
      ? { "fetch-depth": toNumberString(inputs.fetchDepth) }
      : {}),
    ...(inputs.fetchTags !== undefined ? { "fetch-tags": toBooleanString(inputs.fetchTags) } : {}),
    ...(inputs.showProgress !== undefined
      ? { "show-progress": toBooleanString(inputs.showProgress) }
      : {}),
    ...(inputs.lfs !== undefined ? { lfs: toBooleanString(inputs.lfs) } : {}),
    ...(inputs.submodules !== undefined
      ? {
          submodules:
            typeof inputs.submodules === "string"
              ? inputs.submodules
              : toBooleanString(inputs.submodules),
        }
      : {}),
    ...(inputs.setSafeDirectory !== undefined
      ? { "set-safe-directory": toBooleanString(inputs.setSafeDirectory) }
      : {}),
    ...(inputs.githubServerUrl !== undefined
      ? { "github-server-url": inputs.githubServerUrl }
      : {}),
  });
}

export function actionsSetupNode(
  inputs: ActionsSetupNodeInputs = {}
): TypedActionStep<ActionsSetupNodeWith> {
  return typedActionStep("actions/setup-node@v4", {
    ...(inputs.alwaysAuth !== undefined
      ? { "always-auth": toBooleanString(inputs.alwaysAuth) }
      : {}),
    ...(inputs.nodeVersion !== undefined ? { "node-version": inputs.nodeVersion } : {}),
    ...(inputs.nodeVersionFile !== undefined
      ? { "node-version-file": inputs.nodeVersionFile }
      : {}),
    ...(inputs.architecture !== undefined ? { architecture: inputs.architecture } : {}),
    ...(inputs.checkLatest !== undefined
      ? { "check-latest": toBooleanString(inputs.checkLatest) }
      : {}),
    ...(inputs.registryUrl !== undefined ? { "registry-url": inputs.registryUrl } : {}),
    ...(inputs.scope !== undefined ? { scope: inputs.scope } : {}),
    ...(inputs.token !== undefined ? { token: inputs.token } : {}),
    ...(inputs.cache !== undefined ? { cache: inputs.cache } : {}),
    ...(inputs.cacheDependencyPath !== undefined
      ? { "cache-dependency-path": toMultilineString(inputs.cacheDependencyPath) }
      : {}),
    ...(inputs.packageManagerCache !== undefined
      ? { "package-manager-cache": toBooleanString(inputs.packageManagerCache) }
      : {}),
    ...(inputs.mirror !== undefined ? { mirror: inputs.mirror } : {}),
    ...(inputs.mirrorToken !== undefined ? { "mirror-token": inputs.mirrorToken } : {}),
  });
}

export function actionsUploadArtifact(
  inputs: ActionsUploadArtifactInputs = {}
): TypedActionStep<ActionsUploadArtifactWith> {
  return typedActionStep("actions/upload-artifact@v4", {
    ...(inputs.name !== undefined ? { name: inputs.name } : {}),
    ...(inputs.path !== undefined ? { path: toMultilineString(inputs.path) } : {}),
    ...(inputs.ifNoFilesFound !== undefined ? { "if-no-files-found": inputs.ifNoFilesFound } : {}),
    ...(inputs.retentionDays !== undefined
      ? { "retention-days": toNumberString(inputs.retentionDays) }
      : {}),
    ...(inputs.compressionLevel !== undefined
      ? { "compression-level": toNumberString(inputs.compressionLevel) }
      : {}),
    ...(inputs.overwrite !== undefined ? { overwrite: toBooleanString(inputs.overwrite) } : {}),
    ...(inputs.includeHiddenFiles !== undefined
      ? { "include-hidden-files": toBooleanString(inputs.includeHiddenFiles) }
      : {}),
  });
}

export function actionsDownloadArtifact(
  inputs: ActionsDownloadArtifactInputs = {}
): TypedActionStep<ActionsDownloadArtifactWith> {
  return typedActionStep("actions/download-artifact@v4", {
    ...(inputs.name !== undefined ? { name: inputs.name } : {}),
    ...(inputs.artifactIds !== undefined
      ? { "artifact-ids": toCommaSeparatedString(inputs.artifactIds) }
      : {}),
    ...(inputs.path !== undefined ? { path: inputs.path } : {}),
    ...(inputs.pattern !== undefined ? { pattern: inputs.pattern } : {}),
    ...(inputs.mergeMultiple !== undefined
      ? { "merge-multiple": toBooleanString(inputs.mergeMultiple) }
      : {}),
    ...(inputs.githubToken !== undefined ? { "github-token": inputs.githubToken } : {}),
    ...(inputs.repository !== undefined ? { repository: inputs.repository } : {}),
    ...(inputs.runId !== undefined ? { "run-id": String(inputs.runId) } : {}),
    ...(inputs.skipDecompress !== undefined
      ? { "skip-decompress": toBooleanString(inputs.skipDecompress) }
      : {}),
    ...(inputs.digestMismatch !== undefined ? { "digest-mismatch": inputs.digestMismatch } : {}),
  });
}
