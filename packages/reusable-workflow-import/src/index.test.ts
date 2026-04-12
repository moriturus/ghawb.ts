import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { importReusableWorkflow, ReusableWorkflowImportError } from "./index.js";

describe("@ghawb/reusable-workflow-import", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((path) => rm(path, { force: true, recursive: true })));
    tempDirs.length = 0;
  });

  async function createTempYaml(content: string): Promise<string> {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-reusable-workflow-import-"));
    tempDirs.push(tempDir);
    const filePath = join(tempDir, "shared-build.yml");
    await writeFile(filePath, content, "utf8");
    return filePath;
  }

  it("imports a valid reusable workflow and returns a WorkflowRef", async () => {
    const filePath = await createTempYaml(`
name: Shared Build
on:
  workflow_call:
    inputs:
      node_version:
        type: string
        required: false
        default: "22"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: npm ci
`);

    const ref = await importReusableWorkflow(filePath);
    expect(ref).toBe("./.github/workflows/shared-build.yml");
  });

  it("imports a workflow with bare workflow_call trigger", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-reusable-workflow-import-"));
    tempDirs.push(tempDir);
    const filePath = join(tempDir, "simple-reusable.yml");
    await writeFile(
      filePath,
      "name: Simple Reusable\non:\n  workflow_call:\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ok\n",
      "utf8"
    );

    const ref = await importReusableWorkflow(filePath);
    expect(ref).toBe("./.github/workflows/simple-reusable.yml");
  });

  it("imports a workflow with workflow_call alongside other triggers", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-reusable-workflow-import-"));
    tempDirs.push(tempDir);
    const filePath = join(tempDir, "dual-trigger.yml");
    await writeFile(
      filePath,
      "name: Dual Trigger\non:\n  push:\n    branches: [main]\n  workflow_call:\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n",
      "utf8"
    );

    const ref = await importReusableWorkflow(filePath);
    expect(ref).toBe("./.github/workflows/dual-trigger.yml");
  });

  it("uses the file basename for the ref, not the full path", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-reusable-workflow-import-"));
    tempDirs.push(tempDir);
    const filePath = join(tempDir, "deploy-prod.yml");
    await writeFile(
      filePath,
      "name: Deploy\non:\n  workflow_call:\njobs:\n  d:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ok\n",
      "utf8"
    );

    const ref = await importReusableWorkflow(filePath);
    expect(ref).toBe("./.github/workflows/deploy-prod.yml");
  });

  it("throws ReusableWorkflowImportError when file does not contain workflow_call trigger", async () => {
    const filePath = await createTempYaml(`
name: Not Reusable
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`);

    await expect(importReusableWorkflow(filePath)).rejects.toThrow(ReusableWorkflowImportError);
    await expect(importReusableWorkflow(filePath)).rejects.toThrow("workflow_call");
  });

  it("throws ReusableWorkflowImportError when YAML is invalid", async () => {
    const filePath = await createTempYaml("{{{{ invalid yaml");

    await expect(importReusableWorkflow(filePath)).rejects.toThrow(ReusableWorkflowImportError);
  });

  it("throws ReusableWorkflowImportError when YAML does not parse to an object", async () => {
    const filePath = await createTempYaml("just a string");

    await expect(importReusableWorkflow(filePath)).rejects.toThrow(ReusableWorkflowImportError);
    await expect(importReusableWorkflow(filePath)).rejects.toThrow("object");
  });

  it("throws ReusableWorkflowImportError when the 'on' key is missing", async () => {
    const filePath = await createTempYaml(`
name: No Triggers
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
`);

    await expect(importReusableWorkflow(filePath)).rejects.toThrow(ReusableWorkflowImportError);
    await expect(importReusableWorkflow(filePath)).rejects.toThrow("workflow_call");
  });

  it("throws when the file does not exist", async () => {
    await expect(importReusableWorkflow("/nonexistent/path.yml")).rejects.toThrow();
  });

  it("throws ReusableWorkflowImportError when file path is empty", async () => {
    await expect(importReusableWorkflow("")).rejects.toThrow(ReusableWorkflowImportError);
    await expect(importReusableWorkflow("")).rejects.toThrow("empty");
  });

  it("accepts workflow_call as a string in an on-list", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-reusable-workflow-import-"));
    tempDirs.push(tempDir);
    const filePath = join(tempDir, "list-triggers.yml");
    await writeFile(
      filePath,
      "name: List Triggers\non: [push, workflow_call]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ok\n",
      "utf8"
    );

    const ref = await importReusableWorkflow(filePath);
    expect(ref).toBe("./.github/workflows/list-triggers.yml");
  });

  it("works with dependency injection for readFile", async () => {
    const yamlContent = `
name: Injected
on:
  workflow_call:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
`;

    const ref = await importReusableWorkflow("custom-workflow.yml", {
      readFile: async () => yamlContent,
    });
    expect(ref).toBe("./.github/workflows/custom-workflow.yml");
  });

  it("derives filename by normalizing spaces and special characters in the name", async () => {
    const filePath = await createTempYaml(`
name: My Cool   Workflow!
on:
  workflow_call:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
`);

    const ref = await importReusableWorkflow(filePath);
    // Uses the file basename, not the workflow name
    expect(ref).toBe("./.github/workflows/shared-build.yml");
  });
});
