import { readFile as nodeReadFile } from "node:fs/promises";
import { basename } from "node:path";

import { parse } from "yaml";

import { type WorkflowRef, workflowRef } from "@ghawb/sdk";

export class YamlImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YamlImportError";
  }
}

export interface ImportDependencies {
  readonly readFile: (filePath: string) => Promise<string>;
}

async function defaultReadFile(filePath: string): Promise<string> {
  return nodeReadFile(filePath, "utf8");
}

function hasWorkflowCallTrigger(onValue: unknown): boolean {
  if (onValue === null || onValue === undefined) return false;

  // on: { workflow_call: ... }
  if (typeof onValue === "object" && !Array.isArray(onValue)) {
    return "workflow_call" in (onValue as Record<string, unknown>);
  }

  // on: [push, workflow_call]
  if (Array.isArray(onValue)) {
    return onValue.includes("workflow_call");
  }

  // on: workflow_call (string shorthand)
  if (typeof onValue === "string") {
    return onValue === "workflow_call";
  }

  return false;
}

/**
 * Import a reusable workflow YAML file and return a `WorkflowRef` suitable
 * for passing to `usesWorkflow()`.
 *
 * The file must contain a `workflow_call` trigger in its `on` key.
 * The returned ref uses the file's basename as a local workflow reference.
 *
 * @param filePath - Path to the YAML workflow file
 * @param dependencies - Optional dependency overrides for testing
 * @returns A validated `WorkflowRef` string
 */
export async function importReusableWorkflow(
  filePath: string,
  dependencies: Partial<ImportDependencies> = {}
): Promise<WorkflowRef> {
  if (!filePath || filePath.trim().length === 0) {
    throw new YamlImportError("File path must not be empty");
  }

  const readFile = dependencies.readFile ?? defaultReadFile;

  let content: string;
  try {
    content = await readFile(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new YamlImportError(`Failed to read file "${filePath}": ${message}`);
  }

  let parsed: unknown;
  try {
    parsed = parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new YamlImportError(`Failed to parse YAML in "${filePath}": ${message}`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new YamlImportError(
      `Expected "${filePath}" to contain a YAML object, but got ${parsed === null ? "null" : typeof parsed}`
    );
  }

  const workflow = parsed as Record<string, unknown>;

  if (!hasWorkflowCallTrigger(workflow["on"] ?? workflow["true"])) {
    throw new YamlImportError(
      `Workflow "${filePath}" does not contain a workflow_call trigger. ` +
        "Only reusable workflows (those with workflow_call in their 'on' key) can be imported."
    );
  }

  const filename = basename(filePath);
  return workflowRef(`./.github/workflows/${filename}`);
}
