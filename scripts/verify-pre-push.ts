import { spawn } from 'node:child_process';

interface CommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function runCommand(command: string, args: readonly string[]): Promise<CommandResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
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

async function ensureCleanWorktree(): Promise<void> {
  const statusResult = await runCommand('git', ['status', '--short', '--untracked-files=all']);

  if (statusResult.exitCode !== 0) {
    throw new Error(statusResult.stderr.trim() || 'failed to inspect git status');
  }

  if (statusResult.stdout.trim().length > 0) {
    throw new Error('verify:pre-push requires a clean worktree');
  }
}

async function runScript(scriptName: string): Promise<void> {
  const result = await runCommand('bun', ['run', scriptName]);

  if (result.exitCode !== 0) {
    const detail = result.stderr || result.stdout || `script "${scriptName}" failed`;
    throw new Error(detail.trim());
  }
}

if (import.meta.main) {
  try {
    await ensureCleanWorktree();
    await runScript('verify:workflows');
    await runScript('check');
    await runScript('test:vitest:node');
    console.log('Verified pre-push workflow checks');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}
