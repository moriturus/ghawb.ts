import { actionRef, typedActionStep, type TypedActionStep } from "@ghawb/sdk";

export interface TypedActionWrapperOptions {
  readonly version?: string;
}

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

export interface ActionsCacheInputs {
  readonly path: string | readonly string[];
  readonly key: string;
  readonly restoreKeys?: string | readonly string[];
  readonly uploadChunkSize?: number;
  readonly enableCrossOsArchive?: boolean;
  readonly failOnCacheMiss?: boolean;
  readonly lookupOnly?: boolean;
  readonly saveAlways?: boolean;
}

export interface ActionsSetupPythonInputs {
  readonly pythonVersion?: string;
  readonly pythonVersionFile?: string;
  readonly cache?: "pip" | "pipenv" | "poetry";
  readonly architecture?: "x86" | "x64" | "arm64";
  readonly checkLatest?: boolean;
  readonly token?: string;
  readonly cacheDependencyPath?: string | readonly string[];
  readonly updateEnvironment?: boolean;
  readonly allowPrereleases?: boolean;
  readonly freethreaded?: boolean;
}

export interface ActionsSetupGoInputs {
  readonly goVersion?: string;
  readonly goVersionFile?: string;
  readonly checkLatest?: boolean;
  readonly token?: string;
  readonly cache?: boolean;
  readonly cacheDependencyPath?: string | readonly string[];
  readonly architecture?: string;
}

export interface ActionsSetupJavaInputs {
  readonly javaVersion?: string;
  readonly javaVersionFile?: string;
  readonly distribution: string;
  readonly javaPackage?: "jdk" | "jre" | "jdk+fx" | "jre+fx";
  readonly architecture?: string;
  readonly jdkFile?: string;
  readonly checkLatest?: boolean;
  readonly serverId?: string;
  readonly serverUsername?: string;
  readonly serverPassword?: string;
  readonly settingsPath?: string;
  readonly overwriteSettings?: boolean;
  readonly gpgPrivateKey?: string;
  readonly gpgPassphrase?: string;
  readonly cache?: "maven" | "gradle" | "sbt";
  readonly cacheDependencyPath?: string | readonly string[];
  readonly token?: string;
  readonly mvnToolchainId?: string;
  readonly mvnToolchainVendor?: string;
}

export interface ActionsSetupDotnetInputs {
  readonly dotnetVersion?: string | readonly string[];
  readonly dotnetQuality?: "daily" | "signed" | "validated" | "preview" | "ga";
  readonly globalJsonFile?: string;
  readonly sourceUrl?: string;
  readonly owner?: string;
  readonly configFile?: string;
  readonly cache?: boolean;
  readonly cacheDependencyPath?: string | readonly string[];
}

export interface ActionsGithubScriptInputs {
  readonly script: string;
  readonly githubToken?: string;
  readonly debug?: boolean;
  readonly userAgent?: string;
  readonly previews?: string | readonly string[];
  readonly resultEncoding?: "string" | "json";
  readonly retries?: number;
  readonly retryExemptStatusCodes?: string | number | readonly (string | number)[];
  readonly baseUrl?: string;
}

export interface ActionsConfigurePagesInputs {
  readonly staticSiteGenerator?: "nuxt" | "next" | "gatsby" | "sveltekit";
  readonly generatorConfigFile?: string;
  readonly token?: string;
  readonly enablement?: boolean;
}

export interface ActionsUploadPagesArtifactInputs {
  readonly name?: string;
  readonly path: string;
  readonly retentionDays?: number;
}

export interface ActionsDeployPagesInputs {
  readonly token?: string;
  readonly timeout?: number;
  readonly errorCount?: number;
  readonly reportingInterval?: number;
  readonly artifactName?: string;
  readonly preview?: boolean;
}

export interface ActionsLabelerInputs {
  readonly repoToken?: string;
  readonly configurationPath?: string;
  readonly syncLabels?: boolean;
  readonly dot?: boolean;
  readonly prNumber?: string | number | readonly (string | number)[];
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

type ActionsCacheWithKey =
  | "path"
  | "key"
  | "restore-keys"
  | "upload-chunk-size"
  | "enableCrossOsArchive"
  | "fail-on-cache-miss"
  | "lookup-only"
  | "save-always";

type ActionsSetupPythonWithKey =
  | "python-version"
  | "python-version-file"
  | "cache"
  | "architecture"
  | "check-latest"
  | "token"
  | "cache-dependency-path"
  | "update-environment"
  | "allow-prereleases"
  | "freethreaded";

type ActionsSetupGoWithKey =
  | "go-version"
  | "go-version-file"
  | "check-latest"
  | "token"
  | "cache"
  | "cache-dependency-path"
  | "architecture";

type ActionsSetupJavaWithKey =
  | "java-version"
  | "java-version-file"
  | "distribution"
  | "java-package"
  | "architecture"
  | "jdkFile"
  | "check-latest"
  | "server-id"
  | "server-username"
  | "server-password"
  | "settings-path"
  | "overwrite-settings"
  | "gpg-private-key"
  | "gpg-passphrase"
  | "cache"
  | "cache-dependency-path"
  | "token"
  | "mvn-toolchain-id"
  | "mvn-toolchain-vendor";

type ActionsSetupDotnetWithKey =
  | "dotnet-version"
  | "dotnet-quality"
  | "global-json-file"
  | "source-url"
  | "owner"
  | "config-file"
  | "cache"
  | "cache-dependency-path";

type ActionsGithubScriptWithKey =
  | "script"
  | "github-token"
  | "debug"
  | "user-agent"
  | "previews"
  | "result-encoding"
  | "retries"
  | "retry-exempt-status-codes"
  | "base-url";

type ActionsConfigurePagesWithKey =
  | "static_site_generator"
  | "generator_config_file"
  | "token"
  | "enablement";

type ActionsUploadPagesArtifactWithKey = "name" | "path" | "retention-days";

type ActionsDeployPagesWithKey =
  | "token"
  | "timeout"
  | "error_count"
  | "reporting_interval"
  | "artifact_name"
  | "preview";

type ActionsLabelerWithKey =
  | "repo-token"
  | "configuration-path"
  | "sync-labels"
  | "dot"
  | "pr-number";

export type ActionsCheckoutWith = Readonly<Partial<Record<ActionsCheckoutWithKey, string>>>;
export type ActionsSetupNodeWith = Readonly<Partial<Record<ActionsSetupNodeWithKey, string>>>;
export type ActionsUploadArtifactWith = Readonly<
  Partial<Record<ActionsUploadArtifactWithKey, string>>
>;
export type ActionsDownloadArtifactWith = Readonly<
  Partial<Record<ActionsDownloadArtifactWithKey, string>>
>;
export type ActionsCacheWith = Readonly<Partial<Record<ActionsCacheWithKey, string>>>;
export type ActionsSetupPythonWith = Readonly<Partial<Record<ActionsSetupPythonWithKey, string>>>;
export type ActionsSetupGoWith = Readonly<Partial<Record<ActionsSetupGoWithKey, string>>>;
export type ActionsSetupJavaWith = Readonly<Partial<Record<ActionsSetupJavaWithKey, string>>>;
export type ActionsSetupDotnetWith = Readonly<Partial<Record<ActionsSetupDotnetWithKey, string>>>;
export type ActionsGithubScriptWith = Readonly<Partial<Record<ActionsGithubScriptWithKey, string>>>;
export type ActionsConfigurePagesWith = Readonly<
  Partial<Record<ActionsConfigurePagesWithKey, string>>
>;
export type ActionsUploadPagesArtifactWith = Readonly<
  Partial<Record<ActionsUploadPagesArtifactWithKey, string>>
>;
export type ActionsDeployPagesWith = Readonly<Partial<Record<ActionsDeployPagesWithKey, string>>>;
export type ActionsLabelerWith = Readonly<Partial<Record<ActionsLabelerWithKey, string>>>;

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

function createActionReference(actionName: string, defaultVersion: string, version?: string) {
  const resolvedVersion = version?.trim() ?? defaultVersion;

  if (resolvedVersion.length === 0) {
    throw new Error('typed action wrapper option "version" must not be empty');
  }

  return actionRef(`${actionName}@${resolvedVersion}`);
}

export function actionsCheckout(
  inputs: ActionsCheckoutInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsCheckoutWith> {
  return typedActionStep(createActionReference("actions/checkout", "v6", options.version), {
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
  inputs: ActionsSetupNodeInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsSetupNodeWith> {
  return typedActionStep(createActionReference("actions/setup-node", "v6", options.version), {
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
  inputs: ActionsUploadArtifactInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsUploadArtifactWith> {
  return typedActionStep(createActionReference("actions/upload-artifact", "v7", options.version), {
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
  inputs: ActionsDownloadArtifactInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsDownloadArtifactWith> {
  return typedActionStep(
    createActionReference("actions/download-artifact", "v8", options.version),
    {
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
    }
  );
}

export function actionsCache(
  inputs: ActionsCacheInputs,
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsCacheWith> {
  return typedActionStep(createActionReference("actions/cache", "v5", options.version), {
    path: toMultilineString(inputs.path),
    key: inputs.key,
    ...(inputs.restoreKeys !== undefined
      ? { "restore-keys": toMultilineString(inputs.restoreKeys) }
      : {}),
    ...(inputs.uploadChunkSize !== undefined
      ? { "upload-chunk-size": toNumberString(inputs.uploadChunkSize) }
      : {}),
    ...(inputs.enableCrossOsArchive !== undefined
      ? { enableCrossOsArchive: toBooleanString(inputs.enableCrossOsArchive) }
      : {}),
    ...(inputs.failOnCacheMiss !== undefined
      ? { "fail-on-cache-miss": toBooleanString(inputs.failOnCacheMiss) }
      : {}),
    ...(inputs.lookupOnly !== undefined
      ? { "lookup-only": toBooleanString(inputs.lookupOnly) }
      : {}),
    ...(inputs.saveAlways !== undefined
      ? { "save-always": toBooleanString(inputs.saveAlways) }
      : {}),
  });
}

export function actionsSetupPython(
  inputs: ActionsSetupPythonInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsSetupPythonWith> {
  return typedActionStep(createActionReference("actions/setup-python", "v6", options.version), {
    ...(inputs.pythonVersion !== undefined ? { "python-version": inputs.pythonVersion } : {}),
    ...(inputs.pythonVersionFile !== undefined
      ? { "python-version-file": inputs.pythonVersionFile }
      : {}),
    ...(inputs.cache !== undefined ? { cache: inputs.cache } : {}),
    ...(inputs.architecture !== undefined ? { architecture: inputs.architecture } : {}),
    ...(inputs.checkLatest !== undefined
      ? { "check-latest": toBooleanString(inputs.checkLatest) }
      : {}),
    ...(inputs.token !== undefined ? { token: inputs.token } : {}),
    ...(inputs.cacheDependencyPath !== undefined
      ? { "cache-dependency-path": toMultilineString(inputs.cacheDependencyPath) }
      : {}),
    ...(inputs.updateEnvironment !== undefined
      ? { "update-environment": toBooleanString(inputs.updateEnvironment) }
      : {}),
    ...(inputs.allowPrereleases !== undefined
      ? { "allow-prereleases": toBooleanString(inputs.allowPrereleases) }
      : {}),
    ...(inputs.freethreaded !== undefined
      ? { freethreaded: toBooleanString(inputs.freethreaded) }
      : {}),
  });
}

export function actionsSetupGo(
  inputs: ActionsSetupGoInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsSetupGoWith> {
  return typedActionStep(createActionReference("actions/setup-go", "v6", options.version), {
    ...(inputs.goVersion !== undefined ? { "go-version": inputs.goVersion } : {}),
    ...(inputs.goVersionFile !== undefined ? { "go-version-file": inputs.goVersionFile } : {}),
    ...(inputs.checkLatest !== undefined
      ? { "check-latest": toBooleanString(inputs.checkLatest) }
      : {}),
    ...(inputs.token !== undefined ? { token: inputs.token } : {}),
    ...(inputs.cache !== undefined ? { cache: toBooleanString(inputs.cache) } : {}),
    ...(inputs.cacheDependencyPath !== undefined
      ? { "cache-dependency-path": toMultilineString(inputs.cacheDependencyPath) }
      : {}),
    ...(inputs.architecture !== undefined ? { architecture: inputs.architecture } : {}),
  });
}

export function actionsSetupJava(
  inputs: ActionsSetupJavaInputs,
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsSetupJavaWith> {
  return typedActionStep(createActionReference("actions/setup-java", "v5", options.version), {
    ...(inputs.javaVersion !== undefined ? { "java-version": inputs.javaVersion } : {}),
    ...(inputs.javaVersionFile !== undefined
      ? { "java-version-file": inputs.javaVersionFile }
      : {}),
    distribution: inputs.distribution,
    ...(inputs.javaPackage !== undefined ? { "java-package": inputs.javaPackage } : {}),
    ...(inputs.architecture !== undefined ? { architecture: inputs.architecture } : {}),
    ...(inputs.jdkFile !== undefined ? { jdkFile: inputs.jdkFile } : {}),
    ...(inputs.checkLatest !== undefined
      ? { "check-latest": toBooleanString(inputs.checkLatest) }
      : {}),
    ...(inputs.serverId !== undefined ? { "server-id": inputs.serverId } : {}),
    ...(inputs.serverUsername !== undefined ? { "server-username": inputs.serverUsername } : {}),
    ...(inputs.serverPassword !== undefined ? { "server-password": inputs.serverPassword } : {}),
    ...(inputs.settingsPath !== undefined ? { "settings-path": inputs.settingsPath } : {}),
    ...(inputs.overwriteSettings !== undefined
      ? { "overwrite-settings": toBooleanString(inputs.overwriteSettings) }
      : {}),
    ...(inputs.gpgPrivateKey !== undefined ? { "gpg-private-key": inputs.gpgPrivateKey } : {}),
    ...(inputs.gpgPassphrase !== undefined ? { "gpg-passphrase": inputs.gpgPassphrase } : {}),
    ...(inputs.cache !== undefined ? { cache: inputs.cache } : {}),
    ...(inputs.cacheDependencyPath !== undefined
      ? { "cache-dependency-path": toMultilineString(inputs.cacheDependencyPath) }
      : {}),
    ...(inputs.token !== undefined ? { token: inputs.token } : {}),
    ...(inputs.mvnToolchainId !== undefined ? { "mvn-toolchain-id": inputs.mvnToolchainId } : {}),
    ...(inputs.mvnToolchainVendor !== undefined
      ? { "mvn-toolchain-vendor": inputs.mvnToolchainVendor }
      : {}),
  });
}

export function actionsSetupDotnet(
  inputs: ActionsSetupDotnetInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsSetupDotnetWith> {
  return typedActionStep(createActionReference("actions/setup-dotnet", "v5", options.version), {
    ...(inputs.dotnetVersion !== undefined
      ? { "dotnet-version": toMultilineString(inputs.dotnetVersion) }
      : {}),
    ...(inputs.dotnetQuality !== undefined ? { "dotnet-quality": inputs.dotnetQuality } : {}),
    ...(inputs.globalJsonFile !== undefined ? { "global-json-file": inputs.globalJsonFile } : {}),
    ...(inputs.sourceUrl !== undefined ? { "source-url": inputs.sourceUrl } : {}),
    ...(inputs.owner !== undefined ? { owner: inputs.owner } : {}),
    ...(inputs.configFile !== undefined ? { "config-file": inputs.configFile } : {}),
    ...(inputs.cache !== undefined ? { cache: toBooleanString(inputs.cache) } : {}),
    ...(inputs.cacheDependencyPath !== undefined
      ? { "cache-dependency-path": toMultilineString(inputs.cacheDependencyPath) }
      : {}),
  });
}

export function actionsGithubScript(
  inputs: ActionsGithubScriptInputs,
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsGithubScriptWith> {
  return typedActionStep(createActionReference("actions/github-script", "v9", options.version), {
    script: inputs.script,
    ...(inputs.githubToken !== undefined ? { "github-token": inputs.githubToken } : {}),
    ...(inputs.debug !== undefined ? { debug: toBooleanString(inputs.debug) } : {}),
    ...(inputs.userAgent !== undefined ? { "user-agent": inputs.userAgent } : {}),
    ...(inputs.previews !== undefined ? { previews: toCommaSeparatedString(inputs.previews) } : {}),
    ...(inputs.resultEncoding !== undefined ? { "result-encoding": inputs.resultEncoding } : {}),
    ...(inputs.retries !== undefined ? { retries: toNumberString(inputs.retries) } : {}),
    ...(inputs.retryExemptStatusCodes !== undefined
      ? {
          "retry-exempt-status-codes": toCommaSeparatedString(inputs.retryExemptStatusCodes),
        }
      : {}),
    ...(inputs.baseUrl !== undefined ? { "base-url": inputs.baseUrl } : {}),
  });
}

export function actionsConfigurePages(
  inputs: ActionsConfigurePagesInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsConfigurePagesWith> {
  return typedActionStep(createActionReference("actions/configure-pages", "v6", options.version), {
    ...(inputs.staticSiteGenerator !== undefined
      ? { static_site_generator: inputs.staticSiteGenerator }
      : {}),
    ...(inputs.generatorConfigFile !== undefined
      ? { generator_config_file: inputs.generatorConfigFile }
      : {}),
    ...(inputs.token !== undefined ? { token: inputs.token } : {}),
    ...(inputs.enablement !== undefined ? { enablement: toBooleanString(inputs.enablement) } : {}),
  });
}

export function actionsUploadPagesArtifact(
  inputs: ActionsUploadPagesArtifactInputs,
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsUploadPagesArtifactWith> {
  return typedActionStep(
    createActionReference("actions/upload-pages-artifact", "v5", options.version),
    {
      ...(inputs.name !== undefined ? { name: inputs.name } : {}),
      path: inputs.path,
      ...(inputs.retentionDays !== undefined
        ? { "retention-days": toNumberString(inputs.retentionDays) }
        : {}),
    }
  );
}

export function actionsDeployPages(
  inputs: ActionsDeployPagesInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsDeployPagesWith> {
  return typedActionStep(createActionReference("actions/deploy-pages", "v5", options.version), {
    ...(inputs.token !== undefined ? { token: inputs.token } : {}),
    ...(inputs.timeout !== undefined ? { timeout: toNumberString(inputs.timeout) } : {}),
    ...(inputs.errorCount !== undefined ? { error_count: toNumberString(inputs.errorCount) } : {}),
    ...(inputs.reportingInterval !== undefined
      ? { reporting_interval: toNumberString(inputs.reportingInterval) }
      : {}),
    ...(inputs.artifactName !== undefined ? { artifact_name: inputs.artifactName } : {}),
    ...(inputs.preview !== undefined ? { preview: toBooleanString(inputs.preview) } : {}),
  });
}

export function actionsLabeler(
  inputs: ActionsLabelerInputs = {},
  options: TypedActionWrapperOptions = {}
): TypedActionStep<ActionsLabelerWith> {
  return typedActionStep(createActionReference("actions/labeler", "v6", options.version), {
    ...(inputs.repoToken !== undefined ? { "repo-token": inputs.repoToken } : {}),
    ...(inputs.configurationPath !== undefined
      ? { "configuration-path": inputs.configurationPath }
      : {}),
    ...(inputs.syncLabels !== undefined
      ? { "sync-labels": toBooleanString(inputs.syncLabels) }
      : {}),
    ...(inputs.dot !== undefined ? { dot: toBooleanString(inputs.dot) } : {}),
    ...(inputs.prNumber !== undefined
      ? { "pr-number": toCommaSeparatedString(inputs.prNumber) }
      : {}),
  });
}
