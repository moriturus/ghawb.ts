import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  validateWorkflowLayout,
  verifyWorkflowGuardrails,
} from '../../scripts/verify-workflows.ts';

describe('workflow guardrails', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((path) => rm(path, { force: true, recursive: true })));
    tempDirs.length = 0;
  });

  it('validates the supported repository workflow layout and guardrails', async () => {
    const layout = await validateWorkflowLayout(process.cwd());

    expect(layout.issues).toEqual([]);
    expect(layout.mappings).toEqual([
      {
        sourcePath: join(process.cwd(), 'workflows', 'ci.ts'),
        outputPath: join(process.cwd(), '.github', 'workflows', 'ci.yml'),
      },
    ]);
    await expect(verifyWorkflowGuardrails(process.cwd())).resolves.toEqual(layout.mappings);
  });

  it('rejects unsupported workflow source placement and orphan generated outputs', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ghawb-workflow-layout-'));
    tempDirs.push(tempDir);

    await mkdir(join(tempDir, 'workflows'), { recursive: true });
    await mkdir(join(tempDir, '.github', 'workflows'), { recursive: true });
    await writeFile(join(tempDir, 'workflows', 'ci.ts'), 'export default {};\n', 'utf8');
    await writeFile(join(tempDir, '.github', 'workflows', 'ci.yml'), 'name: CI\n', 'utf8');
    await writeFile(
      join(tempDir, '.github', 'workflows', 'bad.ts'),
      'export default {};\n',
      'utf8'
    );
    await writeFile(join(tempDir, '.github', 'workflows', 'orphan.yml'), 'name: Orphan\n', 'utf8');

    const layout = await validateWorkflowLayout(tempDir);

    expect(layout.issues).toContain(
      'unsupported workflow source placement: .github/workflows/bad.ts'
    );
    expect(layout.issues).toContain(
      'generated workflow has no supported source file: .github/workflows/orphan.yml'
    );
  });

  it('wires the dedicated workflow guardrail command through contributor flow and CI', async () => {
    const [packageJson, workflowSource, generatedWorkflow] = await Promise.all([
      readFile(join(process.cwd(), 'package.json'), 'utf8'),
      readFile(join(process.cwd(), 'workflows', 'ci.ts'), 'utf8'),
      readFile(join(process.cwd(), '.github', 'workflows', 'ci.yml'), 'utf8'),
    ]);

    expect(packageJson).toContain('"verify:workflows"');
    expect(packageJson).toContain('"verify:pre-push": "bun run scripts/verify-pre-push.ts"');
    expect(workflowSource).toContain(".run('bun run verify:workflows'");
    expect(generatedWorkflow).toContain('run: bun run verify:workflows');
  });
});
