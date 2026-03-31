import { spawn } from 'node:child_process';
import { relative } from 'node:path';

import { type WorkflowMapping, validateWorkflowLayout } from './verify-workflows.ts';

function relativeFromCwd(cwd: string, target: string): string {
  return relative(cwd, target) || '.';
}

async function runCommand(
  cwd: string,
  command: string,
  args: readonly string[]
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolvePromise({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

export async function generateWorkflows(cwd: string): Promise<readonly WorkflowMapping[]> {
  const { mappings, issues } = await validateWorkflowLayout(cwd, {
    requireGeneratedOutputs: false,
  });

  if (issues.length > 0) {
    throw new Error(`Workflow generation failed:\n- ${issues.join('\n- ')}`);
  }

  for (const mapping of mappings) {
    const renderResult = await runCommand(cwd, 'bun', [
      'run',
      'packages/cli/src/bin.ts',
      'render',
      '--input',
      mapping.sourcePath,
      '--output',
      mapping.outputPath,
    ]);

    if (renderResult.exitCode !== 0) {
      const detail = renderResult.stderr || renderResult.stdout || 'unknown render failure';
      throw new Error(
        `Workflow generation failed while rendering ${relativeFromCwd(cwd, mapping.sourcePath)}:\n${detail.trim()}`
      );
    }
  }

  return mappings;
}

if (import.meta.main) {
  try {
    const mappings = await generateWorkflows(process.cwd());
    const outputs = mappings.map((mapping) => relativeFromCwd(process.cwd(), mapping.outputPath));
    console.log(`Generated workflow outputs for ${outputs.join(', ')}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}
