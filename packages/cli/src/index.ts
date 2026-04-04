import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";

import { stringify } from "yaml";

import { renderWorkflow, type WorkflowDefinition, type WorkflowRenderPayload } from "@ghawb/sdk";

export const CLI_PACKAGE_NAME = "@ghawb/cli";
export const CLI_DELIVERY_STATUS = "implemented";

export interface CliIo {
  readonly stdout: (message: string) => void;
  readonly stderr: (message: string) => void;
}

export interface CliRunDependencies extends CliIo {
  readonly importModule: (modulePath: string) => Promise<unknown>;
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
}

interface RenderCommandOptions {
  readonly target: RenderTarget;
  readonly lint: boolean;
}

interface RenderBatchCommandOptions {
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

function parseRenderArguments(args: readonly string[]): RenderCommandOptions {
  let inputPath: string | undefined;
  let outputPath: string | undefined;
  let lint = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--input") {
      inputPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--output") {
      outputPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--lint") {
      lint = true;
      continue;
    }

    throw new CliUsageError(`unknown argument "${arg}"`);
  }

  if (!inputPath) {
    throw new CliUsageError("missing required --input argument");
  }

  if (!outputPath) {
    throw new CliUsageError("missing required --output argument");
  }

  return { target: { inputPath, outputPath }, lint };
}

function parseRenderBatchArguments(args: readonly string[]): RenderBatchCommandOptions {
  const targets: RenderTarget[] = [];
  let pendingInputPath: string | undefined;
  let lint = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--input") {
      if (pendingInputPath) {
        throw new CliUsageError(`missing required --output argument for "${pendingInputPath}"`);
      }

      pendingInputPath = args[index + 1];
      index += 1;

      if (!pendingInputPath) {
        throw new CliUsageError("missing required value after --input");
      }

      continue;
    }

    if (arg === "--output") {
      const outputPath = args[index + 1];
      index += 1;

      if (!pendingInputPath) {
        throw new CliUsageError("batch render requires --input before --output");
      }

      if (!outputPath) {
        throw new CliUsageError(`missing required --output argument for "${pendingInputPath}"`);
      }

      targets.push({
        inputPath: pendingInputPath,
        outputPath,
      });
      pendingInputPath = undefined;
      continue;
    }

    if (arg === "--lint") {
      lint = true;
      continue;
    }

    throw new CliUsageError(`unknown argument "${arg}"`);
  }

  if (pendingInputPath) {
    throw new CliUsageError(`missing required --output argument for "${pendingInputPath}"`);
  }

  if (targets.length === 0) {
    throw new CliUsageError("missing required batch render targets");
  }

  return { targets, lint };
}

async function defaultImportModule(modulePath: string): Promise<unknown> {
  return import(pathToFileURL(modulePath).href);
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
    "Usage: ghawb render --input <workflow.ts> --output <workflow.yml> [--lint]",
    "       ghawb render-batch --input <workflow.ts> --output <workflow.yml> [--input <workflow.ts> --output <workflow.yml> ...] [--lint]",
    "       ghawb lint <file.yml> [<file.yml> ...]",
  ].join("\n");
}

async function renderTarget(
  target: RenderTarget,
  importModule: CliRunDependencies["importModule"],
  writeOutputFile: CliRunDependencies["writeOutputFile"]
): Promise<string> {
  const resolvedInputPath = resolve(target.inputPath);
  const resolvedOutputPath = resolve(target.outputPath);
  const loadedModule = await importModule(resolvedInputPath);
  const workflow = (loadedModule as { default?: unknown }).default;

  if (!isWorkflowDefinition(workflow)) {
    throw new Error("default export must be a built workflow definition");
  }

  const renderedYaml = renderWorkflow(workflow, emitWorkflowYaml);
  await writeOutputFile(resolvedOutputPath, renderedYaml);
  return resolvedOutputPath;
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
  const writeOutputFile = dependencies.writeOutputFile ?? defaultWriteOutputFile;
  const findExecutable = dependencies.findExecutable ?? defaultFindExecutable;
  const runCommand = dependencies.runCommand ?? defaultRunCommand;

  try {
    const [command, ...rest] = args;

    if (command === "render") {
      const { target, lint } = parseRenderArguments(rest);
      const outputPath = await renderTarget(target, importModule, writeOutputFile);
      io.stdout(`Rendered ${outputPath}`);
      return lint ? await runActionlint([outputPath], io, findExecutable, runCommand) : 0;
    }

    if (command === "render-batch") {
      const { targets, lint } = parseRenderBatchArguments(rest);
      const failures: string[] = [];
      const outputPaths: string[] = [];

      for (const target of targets) {
        try {
          const outputPath = await renderTarget(target, importModule, writeOutputFile);
          outputPaths.push(outputPath);
          io.stdout(`Rendered ${outputPath}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${target.inputPath} -> ${target.outputPath}: ${message}`);
        }
      }

      if (failures.length > 0) {
        io.stderr(`Batch render failed:\n- ${failures.join("\n- ")}`);
        return 1;
      }

      return lint ? await runActionlint(outputPaths, io, findExecutable, runCommand) : 0;
    }

    if (command === "lint") {
      return await runActionlint(rest, io, findExecutable, runCommand);
    }

    throw new CliUsageError(command ? `unknown command "${command}"` : "missing command");
  } catch (error) {
    if (error instanceof CliUsageError) {
      io.stderr(`${error.message}\n${usage()}`);
      return 1;
    }

    const message = error instanceof Error ? error.message : String(error);
    io.stderr(message);
    return 1;
  }
}
