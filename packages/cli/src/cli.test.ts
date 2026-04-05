import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

import { defineCompositeAction } from "@ghawb/composite-actions";

import { runCli as runCliDirect, type CliIo, type CliRunDependencies } from "./index.js";

function defineMinimalWorkflow() {
  return {
    name: "CI",
    on: [{ type: "push" as const }],
    jobs: [
      {
        kind: "steps" as const,
        id: "build",
        runsOn: "ubuntu-latest",
        steps: [{ kind: "run" as const, run: "echo ok" }],
      },
    ],
  };
}

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

function runCli(
  args: readonly string[],
  cwd: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", join(process.cwd(), "packages/cli/src/bin.ts"), ...args], {
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

  it("accepts short input and output flags for render", async () => {
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
  .onPush()
  .addJob(createJobId('test'), (job) => {
    job.runsOn('ubuntu-latest').run('echo ok');
  })
  .build();
`,
      "utf8"
    );

    const result = await runCli(["render", "-i", inputPath, "-o", outputPath], process.cwd());

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    await expect(readFile(outputPath, "utf8")).resolves.toContain("name: CI");
  });

  it("infers the default output path for supported repository-local render inputs", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);

    const workflowsDir = join(tempDir, "workflows");
    const outputPath = join(tempDir, ".github", "workflows", "ci.yml");

    await mkdir(workflowsDir, { recursive: true });
    const io = createIo();
    const originalCwd = process.cwd();

    try {
      process.chdir(tempDir);

      const exitCode = await runCliDirect(
        ["render", "--input", "workflows/ci.ts"],
        io,
        mockDeps({
          importModule: async () => ({ default: defineMinimalWorkflow() }),
          writeOutputFile: async () => {},
        })
      );

      expect(exitCode).toBe(0);
      expect(io.stderr_lines).toEqual([]);
      expect(io.stdout_lines.join("\n")).toContain(outputPath);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("infers the default output path for short render input flags", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);
    const io = createIo();
    const originalCwd = process.cwd();

    try {
      process.chdir(tempDir);

      const exitCode = await runCliDirect(
        ["render", "-i", "workflows/ci.ts"],
        io,
        mockDeps({
          importModule: async () => ({ default: defineMinimalWorkflow() }),
          writeOutputFile: async () => {},
        })
      );

      expect(exitCode).toBe(0);
      expect(io.stderr_lines).toEqual([]);
      expect(io.stdout_lines.join("\n")).toContain(join(tempDir, ".github", "workflows", "ci.yml"));
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("fails clearly when default output inference is unsupported", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);
    const io = createIo();
    const originalCwd = process.cwd();

    try {
      process.chdir(tempDir);

      const exitCode = await runCliDirect(["render", "--input", "workflow.ts"], io, mockDeps());

      expect(exitCode).toBe(1);
      expect(io.stdout_lines).toEqual([]);
      expect(io.stderr_lines.join("\n")).toContain("cannot infer default output path");
      expect(io.stderr_lines.join("\n")).toContain("pass --output explicitly");
    } finally {
      process.chdir(originalCwd);
    }
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
    expect(result.stderr).toContain(
      "default export must be a built workflow or composite action definition"
    );
  });

  it("runs actionlint after render when --lint is set", async () => {
    const io = createIo();
    const runCommandCalls: Array<{ command: string; args: readonly string[] }> = [];

    const exitCode = await runCliDirect(
      ["render", "--input", "workflow.ts", "--output", "ci.yml", "--lint"],
      io,
      mockDeps({
        importModule: async () => ({ default: defineMinimalWorkflow() }),
        writeOutputFile: async () => {},
        findExecutable: async () => "/usr/local/bin/actionlint",
        runCommand: async (command, args) => {
          runCommandCalls.push({ command, args });
          return { exitCode: 0, stdout: "", stderr: "" };
        },
      })
    );

    expect(exitCode).toBe(0);
    expect(io.stdout_lines.join("\n")).toContain("Rendered");
    expect(runCommandCalls).toHaveLength(1);
    expect(runCommandCalls[0]!.command).toBe("/usr/local/bin/actionlint");
    expect(runCommandCalls[0]!.args).toEqual([expect.stringContaining("ci.yml")]);
  });

  it("renders multiple workflow modules in one explicit render command", async () => {
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
        "render",
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

  it("accepts short input and output flags for multi-target render", async () => {
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
        "render",
        "-i",
        firstInputPath,
        "-o",
        firstOutputPath,
        "-i",
        secondInputPath,
        "-o",
        secondOutputPath,
      ],
      process.cwd()
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    await expect(readFile(firstOutputPath, "utf8")).resolves.toContain("name: First");
    await expect(readFile(secondOutputPath, "utf8")).resolves.toContain("name: Second");
  });

  it("still requires explicit output paths for additional render targets", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);

    const firstInputPath = join(tempDir, "ci.ts");
    const secondInputPath = join(tempDir, "deploy.ts");

    await writeFile(firstInputPath, "export default {};\n", "utf8");
    await writeFile(secondInputPath, "export default {};\n", "utf8");

    const result = await runCli(
      ["render", "-i", firstInputPath, "-i", secondInputPath],
      process.cwd()
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(`missing required --output argument for "${firstInputPath}"`);
  });

  it("accepts mixed long and short flags across multi-target render targets", async () => {
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
        "render",
        "--input",
        firstInputPath,
        "-o",
        firstOutputPath,
        "-i",
        secondInputPath,
        "--output",
        secondOutputPath,
      ],
      process.cwd()
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    await expect(readFile(firstOutputPath, "utf8")).resolves.toContain("name: First");
    await expect(readFile(secondOutputPath, "utf8")).resolves.toContain("name: Second");
  });

  it("accepts mixed long and short input and output flags for multi-target render", async () => {
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
        "render",
        "--input",
        firstInputPath,
        "-o",
        firstOutputPath,
        "-i",
        secondInputPath,
        "--output",
        secondOutputPath,
      ],
      process.cwd()
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    await expect(readFile(firstOutputPath, "utf8")).resolves.toContain("name: First");
    await expect(readFile(secondOutputPath, "utf8")).resolves.toContain("name: Second");
  });

  it("reports partial render failures with a non-zero exit code while keeping successful outputs", async () => {
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
        "render",
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
    expect(result.stdout).toContain(`Rendered ${validOutputPath}`);
    expect(result.stderr).toContain("Render failed:");
    expect(result.stderr).toContain(`${invalidInputPath} -> ${invalidOutputPath}`);
    expect(result.stderr).toContain(
      "default export must be a built workflow or composite action definition"
    );
    await expect(readFile(validOutputPath, "utf8")).resolves.toContain("name: Valid");
  });

  it("runs actionlint after multi-target render when --lint is set", async () => {
    const io = createIo();
    const runCommandCalls: Array<{ command: string; args: readonly string[] }> = [];

    const exitCode = await runCliDirect(
      [
        "render",
        "--input",
        "first.ts",
        "--output",
        "first.yml",
        "--input",
        "second.ts",
        "--output",
        "second.yml",
        "--lint",
      ],
      io,
      mockDeps({
        importModule: async () => ({ default: defineMinimalWorkflow() }),
        writeOutputFile: async () => {},
        findExecutable: async () => "/usr/local/bin/actionlint",
        runCommand: async (command, args) => {
          runCommandCalls.push({ command, args });
          return { exitCode: 0, stdout: "", stderr: "" };
        },
      })
    );

    expect(exitCode).toBe(0);
    expect(runCommandCalls).toHaveLength(1);
    expect(runCommandCalls[0]!.command).toBe("/usr/local/bin/actionlint");
    expect(runCommandCalls[0]!.args).toEqual([
      expect.stringContaining("first.yml"),
      expect.stringContaining("second.yml"),
    ]);
  });

  it("renders a composite action module into action.yml", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-cli-"));
    tempDirs.push(tempDir);

    const inputPath = join(tempDir, "action.ts");
    const outputPath = join(tempDir, "action.yml");

    await writeFile(
      inputPath,
      `import { defineCompositeAction } from '${join(process.cwd(), "packages/composite-actions/src/index.ts")}';

export default defineCompositeAction({
  name: 'Setup Bun',
  description: 'Install Bun and expose cache metadata',
})
  .input('bun-version', {
    description: 'Version to install',
    default: '1.3.11',
  })
  .output('cache-path', {
    value: '\${{ steps.cache.outputs.path }}',
  })
  .uses('actions/checkout@v4', 'Checkout')
  .run('echo path=$HOME/.bun/install/cache >> $GITHUB_OUTPUT', {
    name: 'Expose Cache',
    id: 'cache',
    shell: 'bash',
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
    await expect(readFile(outputPath, "utf8")).resolves.toBe(`name: Setup Bun
description: Install Bun and expose cache metadata
inputs:
  bun-version:
    description: Version to install
    default: 1.3.11
outputs:
  cache-path:
    value: \${{ steps.cache.outputs.path }}
runs:
  using: composite
  steps:
    - name: Checkout
      uses: actions/checkout@v4
    - name: Expose Cache
      id: cache
      shell: bash
      run: echo path=$HOME/.bun/install/cache >> $GITHUB_OUTPUT
`);
  });

  it("requires an explicit output path for render-action", async () => {
    const io = createIo();
    const exitCode = await runCliDirect(["render-action", "--input", "action.ts"], io, mockDeps());

    expect(exitCode).toBe(1);
    expect(io.stderr_lines.join("\n")).toContain("cannot infer default output path");
  });

  it("accepts short flags for render-action", async () => {
    const io = createIo();

    const exitCode = await runCliDirect(
      ["render-action", "-i", "action.ts", "-o", "action.yml"],
      io,
      mockDeps({
        importModule: async () => ({
          default: defineCompositeAction({ name: "Echo" }).run("echo ok").build(),
        }),
        writeOutputFile: async () => {},
      })
    );

    expect(exitCode).toBe(0);
    expect(io.stderr_lines).toEqual([]);
    expect(io.stdout_lines.join("\n")).toContain("action.yml");
  });

  it("fails clearly when the input module does not export a built composite action", async () => {
    const io = createIo();

    const exitCode = await runCliDirect(
      ["render-action", "--input", "action.ts", "--output", "action.yml"],
      io,
      mockDeps({
        importModule: async () => ({ default: {} }),
      })
    );

    expect(exitCode).toBe(1);
    expect(io.stderr_lines.join("\n")).toContain(
      "default export must be a built workflow or composite action definition"
    );
  });
});

describe("ghawb CLI lint command", () => {
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
