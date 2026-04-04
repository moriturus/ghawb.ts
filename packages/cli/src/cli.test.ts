import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { runCli as runCliDirect, type CliIo, type CliRunDependencies } from "./index.js";

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

describe("ghawb CLI lint command", () => {
  function createIo(): CliIo & { stdout_lines: string[]; stderr_lines: string[] } {
    const stdout_lines: string[] = [];
    const stderr_lines: string[] = [];
    return {
      stdout_lines,
      stderr_lines,
      stdout(message: string) {
        stdout_lines.push(message);
      },
      stderr(message: string) {
        stderr_lines.push(message);
      },
    };
  }

  function mockDeps(
    overrides: Partial<Omit<CliRunDependencies, keyof CliIo>> = {}
  ): Partial<Omit<CliRunDependencies, keyof CliIo>> {
    return {
      importModule: async () => ({}),
      writeOutputFile: async () => {},
      findExecutable: async () => undefined,
      runCommand: async () => ({ exitCode: 0, stdout: "", stderr: "" }),
      ...overrides,
    };
  }

  it("exits non-zero with install instructions when actionlint is not found", async () => {
    const io = createIo();
    const exitCode = await runCliDirect(
      ["lint", "workflow.yml"],
      io,
      mockDeps({ findExecutable: async () => undefined })
    );

    expect(exitCode).toBe(1);
    expect(io.stderr_lines.join("\n")).toContain("actionlint");
    expect(io.stderr_lines.join("\n")).toContain("https://github.com/rhysd/actionlint");
    expect(io.stderr_lines.join("\n")).toContain("not installed");
  });

  it("exits zero when actionlint passes on all files", async () => {
    const io = createIo();
    const runCommandCalls: Array<{ command: string; args: readonly string[] }> = [];

    const exitCode = await runCliDirect(
      ["lint", "ci.yml", "deploy.yml"],
      io,
      mockDeps({
        findExecutable: async (name) =>
          name === "actionlint" ? "/usr/local/bin/actionlint" : undefined,
        runCommand: async (command, args) => {
          runCommandCalls.push({ command, args });
          return { exitCode: 0, stdout: "", stderr: "" };
        },
      })
    );

    expect(exitCode).toBe(0);
    expect(runCommandCalls).toHaveLength(1);
    expect(runCommandCalls[0]!.command).toBe("/usr/local/bin/actionlint");
    expect(runCommandCalls[0]!.args).toContain("ci.yml");
    expect(runCommandCalls[0]!.args).toContain("deploy.yml");
  });

  it("exits non-zero and surfaces actionlint errors", async () => {
    const io = createIo();
    const lintOutput = 'ci.yml:10:5: property "unknown" is not defined in object type\n';

    const exitCode = await runCliDirect(
      ["lint", "ci.yml"],
      io,
      mockDeps({
        findExecutable: async () => "/usr/local/bin/actionlint",
        runCommand: async () => ({ exitCode: 1, stdout: lintOutput, stderr: "" }),
      })
    );

    expect(exitCode).toBe(1);
    expect(io.stdout_lines.join("\n")).toContain("not defined in object type");
  });

  it("surfaces actionlint stderr output on failure", async () => {
    const io = createIo();

    const exitCode = await runCliDirect(
      ["lint", "ci.yml"],
      io,
      mockDeps({
        findExecutable: async () => "/usr/local/bin/actionlint",
        runCommand: async () => ({
          exitCode: 1,
          stdout: "",
          stderr: "fatal: something went wrong",
        }),
      })
    );

    expect(exitCode).toBe(1);
    expect(io.stderr_lines.join("\n")).toContain("fatal: something went wrong");
  });

  it("fails with usage error when no files are provided", async () => {
    const io = createIo();
    const exitCode = await runCliDirect(["lint"], io, mockDeps());

    expect(exitCode).toBe(1);
    expect(io.stderr_lines.join("\n")).toContain("lint requires at least one file");
  });
});
