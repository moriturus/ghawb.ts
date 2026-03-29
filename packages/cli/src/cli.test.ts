import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

function runCli(
  args: readonly string[],
  cwd: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['run', 'packages/cli/src/bin.ts', ...args], {
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
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

describe('ghawb CLI', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((path) => rm(path, { force: true, recursive: true })));
    tempDirs.length = 0;
  });

  it('renders a workflow module into a deterministic YAML file', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ghawb-cli-'));
    tempDirs.push(tempDir);

    const inputPath = join(tempDir, 'workflow.ts');
    const outputPath = join(tempDir, 'ci.yml');

    await writeFile(
      inputPath,
      `import { createJobId, createWorkflowId, defineWorkflow } from '${join(process.cwd(), 'packages/sdk/src/index.ts')}';

export default defineWorkflow({
  id: createWorkflowId('ci'),
  name: 'CI',
})
  .onPush({
    branches: ['main'],
  })
  .addJob(createJobId('test'), (job) => {
    job
      .runsOn('ubuntu-latest')
      .uses('actions/checkout@v4', {
        name: 'Checkout',
      })
      .run('bun run test', {
        name: 'Test',
      });
  })
  .build();
`,
      'utf8'
    );

    const result = await runCli(
      ['render', '--input', inputPath, '--output', outputPath],
      process.cwd()
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(outputPath);
    await expect(readFile(outputPath, 'utf8')).resolves.toBe(`name: CI
on:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Test
        run: bun run test
`);
  });

  it('fails with a non-zero exit code when required arguments are missing', async () => {
    const result = await runCli(['render', '--input', 'workflow.ts'], process.cwd());

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('missing required --output argument');
  });

  it('fails clearly when the input module does not export a default workflow', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ghawb-cli-'));
    tempDirs.push(tempDir);

    const inputPath = join(tempDir, 'workflow.ts');
    const outputPath = join(tempDir, 'ci.yml');

    await writeFile(inputPath, 'export const missing = true;\n', 'utf8');

    const result = await runCli(
      ['render', '--input', inputPath, '--output', outputPath],
      process.cwd()
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('default export must be a built workflow definition');
  });
});
