import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, parse, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";

import { parse as parseYaml, stringify } from "yaml";

import {
  renderCompositeAction,
  type CompositeActionDefinition,
  type CompositeActionRenderPayload,
} from "@ghawb/composite-actions";
import { renderWorkflow, type WorkflowDefinition, type WorkflowRenderPayload } from "@ghawb/sdk";

export const CLI_PACKAGE_NAME = "@ghawb/cli";
export const CLI_DELIVERY_STATUS = "implemented";

export interface CliIo {
  readonly stdout: (message: string) => void;
  readonly stderr: (message: string) => void;
}

export interface CliRunDependencies extends CliIo {
  readonly importModule: (modulePath: string) => Promise<unknown>;
  readonly readFile: (filePath: string) => Promise<string>;
  readonly writeOutputFile: (outputPath: string, contents: string) => Promise<void>;
  readonly findExecutable: (name: string) => Promise<string | undefined>;
  readonly runCommand: (
    command: string,
    args: readonly string[]
  ) => Promise<{ exitCode: number; stdout: string; stderr: string }>;
}

interface RenderTarget {
  readonly inputPath: string;
  readonly outputPath: string;
  readonly configPath?: string;
}

interface RenderCommandOptions {
  readonly targets: readonly RenderTarget[];
  readonly lint: boolean;
}

interface RenderConfigManifest {
  readonly targets: readonly RenderTarget[];
  readonly lint: boolean;
}

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

function emitWorkflowYaml(payload: WorkflowRenderPayload): string {
  return `${stringify(payload, {
    defaultStringType: "PLAIN",
    lineWidth: 0,
    simpleKeys: true,
  })}`;
}

function emitCompositeActionYaml(payload: CompositeActionRenderPayload): string {
  return `${stringify(payload, {
    defaultStringType: "PLAIN",
    lineWidth: 0,
    simpleKeys: true,
  })}`;
}

function isWorkflowDefinition(value: unknown): value is WorkflowDefinition {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorkflowDefinition>;
  return (
    typeof candidate.name === "string" &&
    Array.isArray(candidate.on) &&
    Array.isArray(candidate.jobs)
  );
}

function isCompositeActionDefinition(value: unknown): value is CompositeActionDefinition {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CompositeActionDefinition>;
  return (
    typeof candidate.name === "string" &&
    candidate.runs !== undefined &&
    candidate.runs.using === "composite" &&
    Array.isArray(candidate.runs.steps)
  );
}

function isInputFlag(arg: string | undefined): boolean {
  return arg === "--input" || arg === "-i";
}

function isOutputFlag(arg: string | undefined): boolean {
  return arg === "--output" || arg === "-o";
}

function isConfigFlag(arg: string | undefined): boolean {
  return arg === "--config";
}

function isBulkConfigFlag(arg: string | undefined): boolean {
  return arg === "--bulk";
}

function inferDefaultRenderOutputPath(inputPath: string): string {
  const resolvedInputPath = resolve(inputPath);
  const sourceDirectory = resolve("workflows");
  const relativeSourcePath = relative(sourceDirectory, resolvedInputPath);

  if (
    relativeSourcePath.length === 0 ||
    relativeSourcePath.startsWith("..") ||
    isAbsolute(relativeSourcePath) ||
    dirname(relativeSourcePath) !== "." ||
    extname(relativeSourcePath) !== ".ts"
  ) {
    throw new CliUsageError(
      `cannot infer default output path for "${inputPath}". Expected: a repository-local workflow source at workflows/<name>.ts; otherwise pass --output explicitly`
    );
  }

  return join(".github", "workflows", `${parse(relativeSourcePath).name}.yml`);
}

function parseBooleanTomlValue(value: string, sourcePath: string, lineNumber: number): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new CliUsageError(
    `invalid TOML boolean at ${sourcePath}:${lineNumber}. Expected true or false`
  );
}

function parseQuotedTomlString(value: string, sourcePath: string, lineNumber: number): string {
  if (
    value.length < 2 ||
    !(
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
  ) {
    throw new CliUsageError(
      `invalid TOML string at ${sourcePath}:${lineNumber}. Expected a quoted string`
    );
  }

  if (value.startsWith('"')) {
    try {
      return JSON.parse(value) as string;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new CliUsageError(`invalid TOML string at ${sourcePath}:${lineNumber}: ${message}`);
    }
  }

  return value.slice(1, -1);
}

function stripTomlInlineComment(line: string): string {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\" && inDoubleQuote) {
      escaped = true;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === "#" && !inSingleQuote && !inDoubleQuote) {
      return line.slice(0, index).trimEnd();
    }
  }

  return line;
}

function parseTomlRenderConfig(contents: string, sourcePath: string): unknown {
  const manifest: { lint?: boolean; targets: Array<{ input?: string; output?: string }> } = {
    targets: [],
  };
  let currentTarget: { input?: string; output?: string } | undefined;

  for (const [index, rawLine] of contents.split(/\r?\n/u).entries()) {
    const lineNumber = index + 1;
    const line = stripTomlInlineComment(rawLine).trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    if (line === "[[targets]]") {
      currentTarget = {};
      manifest.targets.push(currentTarget);
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      throw new CliUsageError(
        `invalid TOML syntax at ${sourcePath}:${lineNumber}. Expected key = value`
      );
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (key.length === 0 || rawValue.length === 0) {
      throw new CliUsageError(
        `invalid TOML syntax at ${sourcePath}:${lineNumber}. Expected key = value`
      );
    }

    if (key === "lint") {
      manifest.lint = parseBooleanTomlValue(rawValue, sourcePath, lineNumber);
      continue;
    }

    if (key === "input" || key === "output") {
      if (!currentTarget) {
        throw new CliUsageError(
          `invalid TOML config at ${sourcePath}:${lineNumber}. Target fields must be declared inside [[targets]]`
        );
      }

      currentTarget[key] = parseQuotedTomlString(rawValue, sourcePath, lineNumber);
      continue;
    }

    throw new CliUsageError(`unsupported TOML key "${key}" at ${sourcePath}:${lineNumber}`);
  }

  return manifest;
}

function parseTomlArrayValue(value: string, sourcePath: string, lineNumber: number): unknown[] {
  if (!value.startsWith("[") || !value.endsWith("]")) {
    throw new CliUsageError(
      `invalid TOML array at ${sourcePath}:${lineNumber}. Expected a [value, ...] array`
    );
  }

  const inner = value.slice(1, -1).trim();
  if (inner.length === 0) {
    return [];
  }

  const parts: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (const char of inner) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\" && inDoubleQuote) {
      current += char;
      escaped = true;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === "," && !inSingleQuote && !inDoubleQuote) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (inSingleQuote || inDoubleQuote || escaped) {
    throw new CliUsageError(`invalid TOML array at ${sourcePath}:${lineNumber}`);
  }

  parts.push(current.trim());
  return parts.map((part) => parseTomlScalarValue(part, sourcePath, lineNumber));
}

function parseTomlScalarValue(value: string, sourcePath: string, lineNumber: number): unknown {
  if (value.startsWith("[") && value.endsWith("]")) {
    return parseTomlArrayValue(value, sourcePath, lineNumber);
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return parseQuotedTomlString(value, sourcePath, lineNumber);
  }

  if (value === "true" || value === "false") {
    return parseBooleanTomlValue(value, sourcePath, lineNumber);
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  throw new CliUsageError(
    `invalid TOML value at ${sourcePath}:${lineNumber}. Expected a string, boolean, number, or array`
  );
}

function parseTomlDataConfig(contents: string, sourcePath: string): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  for (const [index, rawLine] of contents.split(/\r?\n/u).entries()) {
    const lineNumber = index + 1;
    const line = stripTomlInlineComment(rawLine).trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    if (line.startsWith("[") && line.endsWith("]")) {
      throw new CliUsageError(
        `unsupported TOML section at ${sourcePath}:${lineNumber}. Injected config only supports top-level key/value pairs`
      );
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      throw new CliUsageError(
        `invalid TOML syntax at ${sourcePath}:${lineNumber}. Expected key = value`
      );
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (key.length === 0 || rawValue.length === 0) {
      throw new CliUsageError(
        `invalid TOML syntax at ${sourcePath}:${lineNumber}. Expected key = value`
      );
    }

    config[key] = parseTomlScalarValue(rawValue, sourcePath, lineNumber);
  }

  return config;
}

function validateRenderTarget(value: unknown, sourceName: string, index: number): RenderTarget {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CliUsageError(
      `invalid render target at ${sourceName} targets[${index}]. Expected an object with string input and output fields`
    );
  }

  const candidate = value as Record<string, unknown>;
  const inputPath = candidate["input"];
  const outputPath = candidate["output"];
  const configPath = candidate["config"];

  if (typeof inputPath !== "string" || inputPath.trim().length === 0) {
    throw new CliUsageError(
      `invalid render target at ${sourceName} targets[${index}]. "input" must be a non-empty string`
    );
  }

  if (typeof outputPath !== "string" || outputPath.trim().length === 0) {
    throw new CliUsageError(
      `invalid render target at ${sourceName} targets[${index}]. "output" must be a non-empty string`
    );
  }

  if (configPath !== undefined && (typeof configPath !== "string" || configPath.trim().length === 0)) {
    throw new CliUsageError(
      `invalid render target at ${sourceName} targets[${index}]. "config" must be a non-empty string when provided`
    );
  }

  return {
    inputPath,
    outputPath,
    ...(typeof configPath === "string" ? { configPath } : {}),
  };
}

function validateRenderConfigManifest(value: unknown, sourceName: string): RenderConfigManifest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CliUsageError(
      `invalid render config in ${sourceName}. Expected an object with a "targets" array`
    );
  }

  const candidate = value as Record<string, unknown>;
  const rawTargets = candidate["targets"];

  if (!Array.isArray(rawTargets) || rawTargets.length === 0) {
    throw new CliUsageError(
      `invalid render config in ${sourceName}. "targets" must be a non-empty array`
    );
  }

  if (candidate["lint"] !== undefined && typeof candidate["lint"] !== "boolean") {
    throw new CliUsageError(
      `invalid render config in ${sourceName}. "lint" must be a boolean when provided`
    );
  }

  return {
    targets: rawTargets.map((target, index) => validateRenderTarget(target, sourceName, index)),
    lint: candidate["lint"] === true,
  };
}

function parseRenderConfigManifest(contents: string, configPath: string): RenderConfigManifest {
  const extension = extname(configPath).toLowerCase();
  let parsed: unknown;

  try {
    if (extension === ".json") {
      parsed = JSON.parse(contents) as unknown;
    } else if (extension === ".yaml" || extension === ".yml") {
      parsed = parseYaml(contents);
    } else if (extension === ".toml") {
      parsed = parseTomlRenderConfig(contents, configPath);
    } else {
      throw new CliUsageError(
        `unsupported config format for "${configPath}". Expected one of: .json, .yaml, .yml, .toml`
      );
    }
  } catch (error) {
    if (error instanceof CliUsageError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new CliUsageError(`failed to parse render config "${configPath}": ${message}`);
  }

  return validateRenderConfigManifest(parsed, configPath);
}

async function parseRenderArguments(
  args: readonly string[],
  readConfigFile: CliRunDependencies["readFile"]
): Promise<RenderCommandOptions> {
  const targets: RenderTarget[] = [];
  let manifestTargets: readonly RenderTarget[] = [];
  let currentInputPath: string | undefined;
  let currentOutputPath: string | undefined;
  let currentConfigPath: string | undefined;
  let lint = false;
  let explicitTargetsStarted = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (isBulkConfigFlag(arg)) {
      const configPath = args[index + 1];

      if (!configPath) {
        throw new CliUsageError("missing required --bulk argument");
      }

      let configContents: string;
      try {
        configContents = await readConfigFile(configPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new CliUsageError(`failed to read render config "${configPath}": ${message}`);
      }

      const config = parseRenderConfigManifest(configContents, configPath);
      manifestTargets = config.targets;
      lint = config.lint;
      currentInputPath = undefined;
      currentOutputPath = undefined;
      currentConfigPath = undefined;
      explicitTargetsStarted = false;
      index += 1;
      continue;
    }

    if (isInputFlag(arg)) {
      if (!explicitTargetsStarted) {
        targets.length = 0;
        explicitTargetsStarted = true;
      }

      if (currentInputPath !== undefined) {
        if (currentOutputPath === undefined) {
          throw new CliUsageError(`missing required --output argument for "${currentInputPath}"`);
        }

        targets.push({
          inputPath: currentInputPath,
          outputPath: currentOutputPath,
          ...(currentConfigPath ? { configPath: currentConfigPath } : {}),
        });
        currentOutputPath = undefined;
        currentConfigPath = undefined;
      }

      currentInputPath = args[index + 1];
      index += 1;
      continue;
    }

    if (isOutputFlag(arg)) {
      currentOutputPath = args[index + 1];
      index += 1;
      continue;
    }

    if (isConfigFlag(arg)) {
      const configPath = args[index + 1];

      if (!configPath) {
        throw new CliUsageError("missing required --config argument");
      }

      if (!currentInputPath) {
        throw new CliUsageError("--config must follow an --input argument");
      }

      currentConfigPath = configPath;
      index += 1;
      continue;
    }

    if (arg === "--lint") {
      lint = true;
      continue;
    }

    throw new CliUsageError(`unknown argument "${arg}"`);
  }

  if (currentInputPath !== undefined) {
    if (!currentOutputPath) {
      currentOutputPath = inferDefaultRenderOutputPath(currentInputPath);
    }

    targets.push({
      inputPath: currentInputPath,
      outputPath: currentOutputPath,
      ...(currentConfigPath ? { configPath: currentConfigPath } : {}),
    });
  }

  if (targets.length === 0) {
    targets.push(...manifestTargets);
  }

  if (targets.length === 0) {
    throw new CliUsageError("missing required --input argument");
  }

  return { targets, lint };
}

async function defaultImportModule(modulePath: string): Promise<unknown> {
  const parsedPath = parse(modulePath);
  const aliasPath = join(
    parsedPath.dir,
    `${parsedPath.name}.ghawb-import-${Date.now()}-${Math.random().toString(16).slice(2)}${parsedPath.ext}`
  );

  await copyFile(modulePath, aliasPath);

  try {
    return await import(pathToFileURL(aliasPath).href);
  } finally {
    await rm(aliasPath, { force: true });
  }
}

async function defaultReadFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

async function defaultWriteOutputFile(outputPath: string, contents: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents, "utf8");
}

async function defaultFindExecutable(name: string): Promise<string | undefined> {
  const command = process.platform === "win32" ? "where" : "which";
  return new Promise((resolve) => {
    execFile(command, [name], (error, stdout) => {
      resolve(error ? undefined : stdout.trim().split("\n")[0]);
    });
  });
}

async function defaultRunCommand(
  command: string,
  args: readonly string[]
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(command, [...args], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && "status" in error && typeof error.status === "number") {
        resolve({ exitCode: error.status, stdout, stderr });
      } else if (error) {
        resolve({ exitCode: 1, stdout, stderr });
      } else {
        resolve({ exitCode: 0, stdout, stderr });
      }
    });
  });
}

function usage(): string {
  return [
    "Usage: ghawb render [--bulk <render-plan.{json,yaml,yml,toml}>] [(--input|-i) <module.ts> [--config <define-config.{json,yaml,yml,toml}>] [(--output|-o) <output.yml>] ...] [--lint]",
    "       ghawb lint <file.yml> [<file.yml> ...]",
  ].join("\n");
}

function parseDataConfig(contents: string, configPath: string): unknown {
  const extension = extname(configPath).toLowerCase();

  try {
    if (extension === ".json") {
      return JSON.parse(contents) as unknown;
    }

    if (extension === ".yaml" || extension === ".yml") {
      return parseYaml(contents);
    }

    if (extension === ".toml") {
      return parseTomlDataConfig(contents, configPath);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliUsageError(`failed to parse injected config "${configPath}": ${message}`);
  }

  throw new CliUsageError(
    `unsupported injected config format for "${configPath}". Expected one of: .json, .yaml, .yml, .toml`
  );
}

const SDK_RENDER_CONFIG_SYMBOL = Symbol.for("@ghawb/sdk/render-config");

function setInjectedRenderConfig(value: unknown): void {
  (globalThis as Record<PropertyKey, unknown>)[SDK_RENDER_CONFIG_SYMBOL] = value;
}

function clearInjectedRenderConfig(): void {
  delete (globalThis as Record<PropertyKey, unknown>)[SDK_RENDER_CONFIG_SYMBOL];
}

async function renderTarget(
  target: RenderTarget,
  readConfigFile: CliRunDependencies["readFile"],
  importModule: CliRunDependencies["importModule"],
  writeOutputFile: CliRunDependencies["writeOutputFile"]
): Promise<string> {
  const resolvedInputPath = resolve(target.inputPath);
  const resolvedOutputPath = resolve(target.outputPath);
  let injectedConfig: unknown = undefined;

  if (target.configPath) {
    const resolvedConfigPath = resolve(target.configPath);
    let configContents: string;
    try {
      configContents = await readConfigFile(resolvedConfigPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new CliUsageError(`failed to read injected config "${target.configPath}": ${message}`);
    }

    injectedConfig = parseDataConfig(configContents, target.configPath);
  }

  let loadedModule: unknown;
  setInjectedRenderConfig(injectedConfig);
  try {
    loadedModule = await importModule(resolvedInputPath);
  } finally {
    clearInjectedRenderConfig();
  }
  const entryPoint = (loadedModule as { default?: unknown }).default;

  if (isWorkflowDefinition(entryPoint)) {
    const renderedYaml = renderWorkflow(entryPoint, emitWorkflowYaml);
    await writeOutputFile(resolvedOutputPath, renderedYaml);
    return resolvedOutputPath;
  }

  if (isCompositeActionDefinition(entryPoint)) {
    const renderedYaml = renderCompositeAction(entryPoint, emitCompositeActionYaml);
    await writeOutputFile(resolvedOutputPath, renderedYaml);
    return resolvedOutputPath;
  }

  throw new Error("default export must be a built workflow or composite action definition");
}

async function runActionlint(
  files: readonly string[],
  io: CliIo,
  findExecutable: CliRunDependencies["findExecutable"],
  runCommand: CliRunDependencies["runCommand"]
): Promise<number> {
  if (files.length === 0) {
    throw new CliUsageError("lint requires at least one file argument");
  }

  const actionlintPath = await findExecutable("actionlint");

  if (!actionlintPath) {
    io.stderr(
      [
        "actionlint is not installed or not found on PATH.",
        "",
        "Install it from: https://github.com/rhysd/actionlint",
        "",
        "  brew install actionlint              # macOS (Homebrew)",
        "  go install github.com/rhysd/actionlint/cmd/actionlint@latest  # Go",
        "  choco install actionlint             # Windows (Chocolatey)",
        "",
        "See https://github.com/rhysd/actionlint#install for more options.",
      ].join("\n")
    );
    return 1;
  }

  const result = await runCommand(actionlintPath, files);
  if (result.stdout.trim().length > 0) io.stdout(result.stdout.trimEnd());
  if (result.stderr.trim().length > 0) io.stderr(result.stderr.trimEnd());
  return result.exitCode === 0 ? 0 : 1;
}

export async function runCli(
  args: readonly string[],
  io: CliIo,
  dependencies: Partial<Omit<CliRunDependencies, keyof CliIo>> = {}
): Promise<number> {
  const importModule = dependencies.importModule ?? defaultImportModule;
  const readConfigFile = dependencies.readFile ?? defaultReadFile;
  const writeOutputFile = dependencies.writeOutputFile ?? defaultWriteOutputFile;
  const findExecutable = dependencies.findExecutable ?? defaultFindExecutable;
  const runCommand = dependencies.runCommand ?? defaultRunCommand;

  try {
    const [command, ...rest] = args;

    if (command === "render") {
      const { targets, lint } = await parseRenderArguments(rest, readConfigFile);
      const renderedOutputs: string[] = [];
      const failures: string[] = [];

      for (const target of targets) {
        try {
          const outputPath = await renderTarget(target, readConfigFile, importModule, writeOutputFile);
          renderedOutputs.push(outputPath);
          io.stdout(`Rendered ${outputPath}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`Render failed: ${target.inputPath} -> ${target.outputPath}\n${message}`);
        }
      }

      if (failures.length > 0) {
        io.stderr(failures.join("\n"));
        return 1;
      }

      return lint ? await runActionlint(renderedOutputs, io, findExecutable, runCommand) : 0;
    }

    if (command === "lint") {
      return await runActionlint(rest, io, findExecutable, runCommand);
    }

    throw new CliUsageError(command ? `unknown command "${command}"` : "missing command");
  } catch (error) {
    clearInjectedRenderConfig();
    if (error instanceof CliUsageError) {
      io.stderr(`${error.message}\n${usage()}`);
      return 1;
    }

    const message = error instanceof Error ? error.message : String(error);
    io.stderr(message);
    return 1;
  }
}
