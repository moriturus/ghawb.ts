import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

function runCli(
  args: readonly string[],
  cwd: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", "packages/cli/src/bin.ts", ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

describe("ghawb CLI", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((path) => rm(path, { force: true, recursive: true })));
    tempDirs.length = 0;
  });

  it("renders a workflow module into a deterministic YAML file", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);

    const inputPath = join(tempDir, "workflow.ts");
    const outputPath = join(tempDir, "ci.yml");

    await writeFile(
      inputPath,
      `import { createJobId, createWorkflowId, defineWorkflow } from '${join(process.cwd(), "packages/sdk/src/index.ts")}';

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
      "utf8"
    );

    const result = await runCli(
      ["render", "--input", inputPath, "--output", outputPath],
      process.cwd()
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(outputPath);
    await expect(readFile(outputPath, "utf8")).resolves.toBe(`name: CI
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

  it("fails with a non-zero exit code when required arguments are missing", async () => {
    const result = await runCli(["render", "--input", "workflow.ts"], process.cwd());

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("missing required --output argument");
  });

  it("fails clearly when the input module does not export a default workflow", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);

    const inputPath = join(tempDir, "workflow.ts");
    const outputPath = join(tempDir, "ci.yml");

    await writeFile(inputPath, "export const missing = true;\n", "utf8");

    const result = await runCli(
      ["render", "--input", inputPath, "--output", outputPath],
      process.cwd()
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("default export must be a built workflow definition");
  });

  it("renders multiple workflow modules in one explicit batch command", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);

    const firstInputPath = join(tempDir, "first-workflow.ts");
    const firstOutputPath = join(tempDir, "first.yml");
    const secondInputPath = join(tempDir, "second-workflow.ts");
    const secondOutputPath = join(tempDir, "second.yml");

    await writeFile(
      firstInputPath,
      `import { createJobId, createWorkflowId, defineWorkflow } from '${join(process.cwd(), "packages/sdk/src/index.ts")}';

export default defineWorkflow({
  id: createWorkflowId('first'),
  name: 'First',
})
  .onPush()
  .addJob(createJobId('check'), (job) => {
    job.runsOn('ubuntu-latest').run('bun test');
  })
  .build();
`,
      "utf8"
    );
    await writeFile(
      secondInputPath,
      `import { createJobId, createWorkflowId, defineWorkflow } from '${join(process.cwd(), "packages/sdk/src/index.ts")}';

export default defineWorkflow({
  id: createWorkflowId('second'),
  name: 'Second',
})
  .onWorkflowDispatch()
  .addJob(createJobId('verify'), (job) => {
    job.runsOn('ubuntu-latest').run('bun run verify:workflows');
  })
  .build();
`,
      "utf8"
    );

    const result = await runCli(
      [
        "render-batch",
        "--input",
        firstInputPath,
        "--output",
        firstOutputPath,
        "--input",
        secondInputPath,
        "--output",
        secondOutputPath,
      ],
      process.cwd()
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(firstOutputPath);
    expect(result.stdout).toContain(secondOutputPath);
    await expect(readFile(firstOutputPath, "utf8")).resolves.toContain("name: First");
    await expect(readFile(secondOutputPath, "utf8")).resolves.toContain("workflow_dispatch: null");
  });

  it("reports partial batch failures with a non-zero exit code while keeping successful outputs", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);

    const validInputPath = join(tempDir, "valid-workflow.ts");
    const validOutputPath = join(tempDir, "valid.yml");
    const invalidInputPath = join(tempDir, "invalid-workflow.ts");
    const invalidOutputPath = join(tempDir, "invalid.yml");

    await writeFile(
      validInputPath,
      `import { createJobId, createWorkflowId, defineWorkflow } from '${join(process.cwd(), "packages/sdk/src/index.ts")}';

export default defineWorkflow({
  id: createWorkflowId('valid'),
  name: 'Valid',
})
  .onPush()
  .addJob(createJobId('check'), (job) => {
    job.runsOn('ubuntu-latest').run('bun test');
  })
  .build();
`,
      "utf8"
    );
    await writeFile(invalidInputPath, "export const missing = true;\n", "utf8");

    const result = await runCli(
      [
        "render-batch",
        "--input",
        validInputPath,
        "--output",
        validOutputPath,
        "--input",
        invalidInputPath,
        "--output",
        invalidOutputPath,
      ],
      process.cwd()
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain(validOutputPath);
    expect(result.stderr).toContain("Batch render failed:");
    expect(result.stderr).toContain(`${invalidInputPath} -> ${invalidOutputPath}`);
    expect(result.stderr).toContain("default export must be a built workflow definition");
    await expect(readFile(validOutputPath, "utf8")).resolves.toContain("name: Valid");
  });
});
