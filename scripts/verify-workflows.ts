import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { join, parse, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

export interface WorkflowMapping {
  readonly sourcePath: string;
  readonly outputPath: string;
}

export interface WorkflowLayoutResult {
  readonly mappings: readonly WorkflowMapping[];
  readonly issues: readonly string[];
}

interface WorkflowConventionRule {
  readonly sourceBasename: string;
  readonly requiredPattern: RegExp;
  readonly failureMessage: (sourcePath: string) => string;
}

export interface ValidateWorkflowLayoutOptions {
  readonly requireGeneratedOutputs?: boolean;
}

const SUPPORTED_SOURCE_EXTENSION = ".ts";
const SUPPORTED_OUTPUT_EXTENSION = ".yml";
const WORKFLOW_CONVENTION_RULES: readonly WorkflowConventionRule[] = [
  {
    sourceBasename: "manual-verify",
    requiredPattern: /nodeVersion:\s*"24"/,
    failureMessage: (sourcePath) =>
      `repository workflow convention drift detected in ${sourcePath}: expected Node 24 setup-node default`,
  },
  {
    sourceBasename: "ci",
    requiredPattern: /nodeVersion:\s*"24"/,
    failureMessage: (sourcePath) =>
      `repository workflow convention drift detected in ${sourcePath}: expected Node 24 setup-node default`,
  },
  {
    sourceBasename: "publish",
    requiredPattern: /nodeVersion:\s*"24"/,
    failureMessage: (sourcePath) =>
      `repository workflow convention drift detected in ${sourcePath}: expected Node 24 setup-node default`,
  },
  {
    sourceBasename: "release",
    requiredPattern: /nodeVersion:\s*"24"/,
    failureMessage: (sourcePath) =>
      `repository workflow convention drift detected in ${sourcePath}: expected Node 24 setup-node default`,
  },
  {
    sourceBasename: "ci",
    requiredPattern: /bun run verify:workflows/,
    failureMessage: (sourcePath) =>
      `repository workflow convention drift detected in ${sourcePath}: expected bun run verify:workflows step`,
  },
  {
    sourceBasename: "manual-verify",
    requiredPattern: /bun run verify:pre-push/,
    failureMessage: (sourcePath) =>
      `repository workflow convention drift detected in ${sourcePath}: expected bun run verify:pre-push step`,
  },
];

function relativeFromCwd(cwd: string, target: string): string {
  return relative(cwd, target) || ".";
}

async function runCommand(
  cwd: string,
  command: string,
  args: readonly string[]
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
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
      resolvePromise({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

export async function validateWorkflowConventions(
  cwd: string,
  mappings: readonly WorkflowMapping[]
): Promise<readonly string[]> {
  const issues: string[] = [];

  for (const mapping of mappings) {
    const sourceContents = await readFile(mapping.sourcePath, "utf8");
    const sourceBasename = parse(mapping.sourcePath).name;

    for (const rule of WORKFLOW_CONVENTION_RULES) {
      if (rule.sourceBasename !== sourceBasename) {
        continue;
      }

      if (!rule.requiredPattern.test(sourceContents)) {
        issues.push(rule.failureMessage(relativeFromCwd(cwd, mapping.sourcePath)));
      }
    }
  }

  return issues;
}

export async function validateWorkflowLayout(
  cwd: string,
  options: ValidateWorkflowLayoutOptions = {}
): Promise<WorkflowLayoutResult> {
  const requireGeneratedOutputs = options.requireGeneratedOutputs ?? true;
  const sourceDirectory = resolve(cwd, "workflows");
  const outputDirectory = resolve(cwd, ".github", "workflows");
  const sourceEntries = (await readdir(sourceDirectory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name)
  );
  const outputEntries = (await readdir(outputDirectory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name)
  );
  const issues: string[] = [];

  const sourceFiles = sourceEntries.filter((entry) => entry.isFile());
  const outputFiles = outputEntries.filter((entry) => entry.isFile());

  for (const entry of sourceEntries) {
    if (!entry.isFile()) {
      issues.push(
        `unsupported workflow source placement: ${relativeFromCwd(cwd, join(sourceDirectory, entry.name))}`
      );
      continue;
    }

    if (!entry.name.endsWith(SUPPORTED_SOURCE_EXTENSION)) {
      issues.push(
        `unsupported workflow source file extension: ${relativeFromCwd(cwd, join(sourceDirectory, entry.name))}`
      );
    }
  }

  for (const entry of outputFiles) {
    if (entry.name.endsWith(".ts")) {
      issues.push(
        `unsupported workflow source placement: ${relativeFromCwd(cwd, join(outputDirectory, entry.name))}`
      );
    }
  }

  const mappings = sourceFiles
    .filter((entry) => entry.name.endsWith(SUPPORTED_SOURCE_EXTENSION))
    .map((entry) => {
      const basename = parse(entry.name).name;

      return {
        sourcePath: join(sourceDirectory, entry.name),
        outputPath: join(outputDirectory, `${basename}${SUPPORTED_OUTPUT_EXTENSION}`),
      };
    })
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));

  if (mappings.length === 0) {
    issues.push("no supported workflow source files were found under workflows/");
  }

  if (requireGeneratedOutputs) {
    for (const mapping of mappings) {
      const outputBasename = parse(mapping.outputPath).base;
      const outputEntry = outputFiles.find((entry) => entry.name === outputBasename);

      if (!outputEntry) {
        issues.push(
          `missing generated workflow output: ${relativeFromCwd(cwd, mapping.outputPath)}`
        );
      }
    }
  }

  for (const entry of outputFiles) {
    if (!entry.name.endsWith(SUPPORTED_OUTPUT_EXTENSION)) {
      issues.push(
        `unsupported generated workflow file: ${relativeFromCwd(cwd, join(outputDirectory, entry.name))}`
      );
      continue;
    }

    const basename = parse(entry.name).name;
    const matchingSource = mappings.find((mapping) => parse(mapping.sourcePath).name === basename);

    if (!matchingSource) {
      issues.push(
        `generated workflow has no supported source file: ${relativeFromCwd(cwd, join(outputDirectory, entry.name))}`
      );
    }
  }

  return {
    mappings,
    issues,
  };
}

export async function verifyWorkflowGuardrails(cwd: string): Promise<readonly WorkflowMapping[]> {
  const { mappings, issues } = await validateWorkflowLayout(cwd);

  if (issues.length > 0) {
    throw new Error(`Workflow guardrails failed:\n- ${issues.join("\n- ")}`);
  }

  const conventionIssues = await validateWorkflowConventions(cwd, mappings);

  if (conventionIssues.length > 0) {
    throw new Error(`Workflow guardrails failed:\n- ${conventionIssues.join("\n- ")}`);
  }

  const tempDir = await mkdtemp(join(tmpdir(), "ghawb-workflow-guardrails-"));

  try {
    for (const mapping of mappings) {
      const renderedOutputPath = join(tempDir, parse(mapping.outputPath).base);
      const renderResult = await runCommand(cwd, "bun", [
        "run",
        "packages/cli/src/bin.ts",
        "render",
        "--input",
        mapping.sourcePath,
        "--output",
        renderedOutputPath,
      ]);

      if (renderResult.exitCode !== 0) {
        const detail = renderResult.stderr || renderResult.stdout || "unknown render failure";
        throw new Error(
          `Workflow guardrails failed while rendering ${relativeFromCwd(cwd, mapping.sourcePath)}:\n${detail.trim()}`
        );
      }

      const [expectedContents, renderedContents] = await Promise.all([
        readFile(mapping.outputPath, "utf8"),
        readFile(renderedOutputPath, "utf8"),
      ]);

      if (expectedContents !== renderedContents) {
        throw new Error(
          `generated workflow drift detected: ${relativeFromCwd(cwd, mapping.outputPath)}`
        );
      }
    }

    return mappings;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

if (import.meta.main) {
  try {
    const mappings = await verifyWorkflowGuardrails(process.cwd());
    const outputs = mappings.map((mapping) => relativeFromCwd(process.cwd(), mapping.outputPath));
    console.log(`Verified workflow guardrails for ${outputs.join(", ")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}
