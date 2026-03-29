import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('self-hosted workflow output', () => {
  it('keeps the committed CI workflow aligned with the generated source', async () => {
    const workflowPath = join(process.cwd(), '.github', 'workflows', 'ci.yml');
    const contents = await readFile(workflowPath, 'utf8');

    expect(contents).toContain('name: CI');
    expect(contents).toContain('run: bun run verify:workflows');
    expect(contents).toContain('run: bun run check');
    expect(contents).toContain('run: bun run test:vitest:node');
  });

  it('keeps the root workspace dependency needed to render repository-local workflows in clean installs', async () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.devDependencies?.['@ghawb/sdk']).toBe('workspace:*');
  });

  it('documents the supported pre-push verification command and workflow authoring convention', async () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const readmePath = join(process.cwd(), 'README.md');
    const contributingPath = join(process.cwd(), 'docs', 'CONTRIBUTING.md');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const readme = await readFile(readmePath, 'utf8');
    const contributing = await readFile(contributingPath, 'utf8');

    expect(packageJson.scripts?.['verify:workflows']).toBe('bun run scripts/verify-workflows.ts');
    expect(packageJson.scripts?.['verify:pre-push']).toBe('bun run scripts/verify-pre-push.ts');
    expect(readme).toContain('bun run verify:pre-push');
    expect(readme).toContain('bun run verify:workflows');
    expect(readme).toContain(
      'Author committed workflow source modules inside the repository under'
    );
    expect(contributing).toContain('bun run verify:pre-push');
    expect(contributing).toContain('bun run verify:workflows');
    expect(contributing).toContain('Keep committed workflow source modules under');
  });
});
