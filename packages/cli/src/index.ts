import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { stringify } from 'yaml';

import { renderWorkflow, type WorkflowDefinition, type WorkflowRenderPayload } from '@ghawb/sdk';

export const CLI_PACKAGE_NAME = '@ghawb/cli';
export const CLI_DELIVERY_STATUS = 'implemented';

export interface CliIo {
  readonly stdout: (message: string) => void;
  readonly stderr: (message: string) => void;
}

export interface CliRunDependencies extends CliIo {
  readonly importModule: (modulePath: string) => Promise<unknown>;
  readonly writeOutputFile: (outputPath: string, contents: string) => Promise<void>;
}

interface RenderTarget {
  readonly inputPath: string;
  readonly outputPath: string;
}

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}

function emitWorkflowYaml(payload: WorkflowRenderPayload): string {
  return `${stringify(payload, {
    defaultStringType: 'PLAIN',
    lineWidth: 0,
    simpleKeys: true,
  })}`;
}

function isWorkflowDefinition(value: unknown): value is WorkflowDefinition {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<WorkflowDefinition>;
  return (
    typeof candidate.name === 'string' &&
    Array.isArray(candidate.on) &&
    Array.isArray(candidate.jobs)
  );
}

function parseRenderArguments(args: readonly string[]): RenderTarget {
  let inputPath: string | undefined;
  let outputPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      inputPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--output') {
      outputPath = args[index + 1];
      index += 1;
      continue;
    }

    throw new CliUsageError(`unknown argument "${arg}"`);
  }

  if (!inputPath) {
    throw new CliUsageError('missing required --input argument');
  }

  if (!outputPath) {
    throw new CliUsageError('missing required --output argument');
  }

  return {
    inputPath,
    outputPath,
  };
}

function parseRenderBatchArguments(args: readonly string[]): readonly RenderTarget[] {
  const targets: RenderTarget[] = [];
  let pendingInputPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      if (pendingInputPath) {
        throw new CliUsageError(`missing required --output argument for "${pendingInputPath}"`);
      }

      pendingInputPath = args[index + 1];
      index += 1;

      if (!pendingInputPath) {
        throw new CliUsageError('missing required value after --input');
      }

      continue;
    }

    if (arg === '--output') {
      const outputPath = args[index + 1];
      index += 1;

      if (!pendingInputPath) {
        throw new CliUsageError('batch render requires --input before --output');
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

    throw new CliUsageError(`unknown argument "${arg}"`);
  }

  if (pendingInputPath) {
    throw new CliUsageError(`missing required --output argument for "${pendingInputPath}"`);
  }

  if (targets.length === 0) {
    throw new CliUsageError('missing required batch render targets');
  }

  return targets;
}

async function defaultImportModule(modulePath: string): Promise<unknown> {
  return import(pathToFileURL(modulePath).href);
}

async function defaultWriteOutputFile(outputPath: string, contents: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents, 'utf8');
}

function usage(): string {
  return [
    'Usage: ghawb render --input <workflow.ts> --output <workflow.yml>',
    '       ghawb render-batch --input <workflow.ts> --output <workflow.yml> [--input <workflow.ts> --output <workflow.yml> ...]',
  ].join('\n');
}

async function renderTarget(
  target: RenderTarget,
  importModule: CliRunDependencies['importModule'],
  writeOutputFile: CliRunDependencies['writeOutputFile']
): Promise<string> {
  const resolvedInputPath = resolve(target.inputPath);
  const resolvedOutputPath = resolve(target.outputPath);
  const loadedModule = await importModule(resolvedInputPath);
  const workflow = (loadedModule as { default?: unknown }).default;

  if (!isWorkflowDefinition(workflow)) {
    throw new Error('default export must be a built workflow definition');
  }

  const renderedYaml = renderWorkflow(workflow, emitWorkflowYaml);
  await writeOutputFile(resolvedOutputPath, renderedYaml);
  return resolvedOutputPath;
}

export async function runCli(
  args: readonly string[],
  io: CliIo,
  dependencies: Partial<Omit<CliRunDependencies, keyof CliIo>> = {}
): Promise<number> {
  const importModule = dependencies.importModule ?? defaultImportModule;
  const writeOutputFile = dependencies.writeOutputFile ?? defaultWriteOutputFile;

  try {
    const [command, ...rest] = args;

    if (command === 'render') {
      const outputPath = await renderTarget(
        parseRenderArguments(rest),
        importModule,
        writeOutputFile
      );
      io.stdout(`Rendered ${outputPath}`);
      return 0;
    }

    if (command === 'render-batch') {
      const targets = parseRenderBatchArguments(rest);
      const failures: string[] = [];

      for (const target of targets) {
        try {
          const outputPath = await renderTarget(target, importModule, writeOutputFile);
          io.stdout(`Rendered ${outputPath}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${target.inputPath} -> ${target.outputPath}: ${message}`);
        }
      }

      if (failures.length > 0) {
        io.stderr(`Batch render failed:\n- ${failures.join('\n- ')}`);
        return 1;
      }

      return 0;
    }

    throw new CliUsageError(command ? `unknown command "${command}"` : 'missing command');
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
