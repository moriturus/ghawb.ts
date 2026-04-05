import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  validateWorkflowLayout,
  validateWorkflowConventions,
  verifyWorkflowGuardrails,
} from "../../scripts/verify-workflows.js";

describe("workflow guardrails", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((path) => rm(path, { force: true, recursive: true })));
    tempDirs.length = 0;
  });

  it("validates the supported repository workflow layout and guardrails", async () => {
    const layout = await validateWorkflowLayout(process.cwd());

    expect(layout.issues).toEqual([]);
    expect(layout.mappings).toEqual([
      {
        sourcePath: join(process.cwd(), "workflows", "ci.ts"),
        outputPath: join(process.cwd(), ".github", "workflows", "ci.yml"),
      },
      {
        sourcePath: join(process.cwd(), "workflows", "manual-verify.ts"),
        outputPath: join(process.cwd(), ".github", "workflows", "manual-verify.yml"),
      },
      {
        sourcePath: join(process.cwd(), "workflows", "publish.ts"),
        outputPath: join(process.cwd(), ".github", "workflows", "publish.yml"),
      },
      {
        sourcePath: join(process.cwd(), "workflows", "release.ts"),
        outputPath: join(process.cwd(), ".github", "workflows", "release.yml"),
      },
    ]);
    await expect(verifyWorkflowGuardrails(process.cwd())).resolves.toEqual(layout.mappings);
  });

  it("rejects unsupported workflow source placement and orphan generated outputs", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-workflow-layout-"));
    tempDirs.push(tempDir);

    await mkdir(join(tempDir, "workflows"), { recursive: true });
    await mkdir(join(tempDir, ".github", "workflows"), { recursive: true });
    await writeFile(join(tempDir, "workflows", "ci.ts"), "export default {};\n", "utf8");
    await writeFile(join(tempDir, ".github", "workflows", "ci.yml"), "name: CI\n", "utf8");
    await writeFile(
      join(tempDir, ".github", "workflows", "bad.ts"),
      "export default {};\n",
      "utf8"
    );
    await writeFile(join(tempDir, ".github", "workflows", "legacy.yaml"), "name: Legacy\n", "utf8");
    await writeFile(join(tempDir, ".github", "workflows", "orphan.yml"), "name: Orphan\n", "utf8");

    const layout = await validateWorkflowLayout(tempDir);

    expect(layout.issues).toContain(
      "unsupported workflow source placement: .github/workflows/bad.ts"
    );
    expect(layout.issues).toContain(
      "unsupported generated workflow file: .github/workflows/legacy.yaml"
    );
    expect(layout.issues).toContain(
      "generated workflow has no supported source file: .github/workflows/orphan.yml"
    );
  });

  it("allows generation planning to detect supported mappings before outputs exist", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-workflow-layout-"));
    tempDirs.push(tempDir);

    await mkdir(join(tempDir, "workflows"), { recursive: true });
    await mkdir(join(tempDir, ".github", "workflows"), { recursive: true });
    await writeFile(join(tempDir, "workflows", "ci.ts"), "export default {};\n", "utf8");
    await writeFile(join(tempDir, "workflows", "manual-verify.ts"), "export default {};\n", "utf8");

    const strictLayout = await validateWorkflowLayout(tempDir);
    const generationLayout = await validateWorkflowLayout(tempDir, {
      requireGeneratedOutputs: false,
    });

    expect(strictLayout.issues).toContain(
      "missing generated workflow output: .github/workflows/ci.yml"
    );
    expect(strictLayout.issues).toContain(
      "missing generated workflow output: .github/workflows/manual-verify.yml"
    );
    expect(generationLayout.issues).toEqual([]);
    expect(generationLayout.mappings).toEqual([
      {
        sourcePath: join(tempDir, "workflows", "ci.ts"),
        outputPath: join(tempDir, ".github", "workflows", "ci.yml"),
      },
      {
        sourcePath: join(tempDir, "workflows", "manual-verify.ts"),
        outputPath: join(tempDir, ".github", "workflows", "manual-verify.yml"),
      },
    ]);
  });

  it("rejects workflow convention drift with source-specific diagnostics", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-workflow-conventions-"));
    tempDirs.push(tempDir);

    await mkdir(join(tempDir, "workflows"), { recursive: true });
    await mkdir(join(tempDir, ".github", "workflows"), { recursive: true });
    await writeFile(
      join(tempDir, "workflows", "ci.ts"),
      [
        'import { defineWorkflow } from "@ghawb/sdk";',
        "",
        'export default defineWorkflow({ id: { value: "ci" } as never, name: "CI" })',
        "  .onPush()",
        '  .addJob({ value: "check" } as never, (job) => {',
        '    job.uses("actions/setup-node@v4", { with: { "node-version": "22" } });',
        "  })",
        "  .build();",
        "",
      ].join("\n"),
      "utf8"
    );
    await writeFile(join(tempDir, ".github", "workflows", "ci.yml"), "name: CI\n", "utf8");

    const layout = await validateWorkflowLayout(tempDir, {
      requireGeneratedOutputs: false,
    });
    const conventionIssues = await validateWorkflowConventions(tempDir, layout.mappings);

    expect(conventionIssues).toContain(
      "repository workflow convention drift detected in workflows/ci.ts: expected Node 24 setup-node default"
    );
  });

  it("wires the dedicated workflow guardrail command through contributor flow and CI", async () => {
    const [
      packageJson,
      workflowSource,
      generatedWorkflow,
      manualWorkflowSource,
      manualGeneratedWorkflow,
    ] = await Promise.all([
      readFile(join(process.cwd(), "package.json"), "utf8"),
      readFile(join(process.cwd(), "workflows", "ci.ts"), "utf8"),
      readFile(join(process.cwd(), ".github", "workflows", "ci.yml"), "utf8"),
      readFile(join(process.cwd(), "workflows", "manual-verify.ts"), "utf8"),
      readFile(join(process.cwd(), ".github", "workflows", "manual-verify.yml"), "utf8"),
    ]);

    expect(packageJson).toContain('"verify:workflows"');
    expect(packageJson).toContain('"verify:pre-push": "bun run scripts/verify-pre-push.ts"');
    expect(packageJson).toContain('"generate:workflows": "bun run scripts/generate-workflows.ts"');
    expect(workflowSource).toContain('.run("bun run verify:workflows"');
    expect(generatedWorkflow).toContain("run: bun run verify:workflows");
    expect(manualWorkflowSource).toContain('.run("bun run verify:pre-push"');
    expect(manualGeneratedWorkflow).toContain("run: bun run verify:pre-push");
  });
});
