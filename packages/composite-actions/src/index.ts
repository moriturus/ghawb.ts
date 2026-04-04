import { actionRef, type ActionRef } from "@ghawb/sdk";
import { IDENTIFIER_FORMAT_SOURCE, matchesIdentifierFormat } from "@ghawb/shared";

export interface CompositeActionInput {
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: string;
}

export type CompositeActionInputs = Readonly<Record<string, CompositeActionInput>>;

export interface CompositeActionOutput {
  readonly description?: string;
  readonly value: string;
}

export type CompositeActionOutputs = Readonly<Record<string, CompositeActionOutput>>;
export type CompositeActionEnv = Readonly<Record<string, string>>;
export type CompositeActionWith = Readonly<Record<string, string>>;

export interface CompositeActionStepMetadata {
  readonly name?: string;
  readonly id?: string;
  readonly if?: string;
  readonly env?: CompositeActionEnv;
}

export interface CompositeActionRunStepMetadata extends CompositeActionStepMetadata {
  readonly shell?: string;
  readonly workingDirectory?: string;
}

export interface CompositeActionUsesStepMetadata extends CompositeActionStepMetadata {
  readonly with?: CompositeActionWith;
}

export interface CompositeActionRunStep extends CompositeActionRunStepMetadata {
  readonly kind: "run";
  readonly run: string;
}

export interface CompositeActionUsesStep extends CompositeActionUsesStepMetadata {
  readonly kind: "uses";
  readonly uses: ActionRef;
}

export type CompositeActionStep = CompositeActionRunStep | CompositeActionUsesStep;

export interface CompositeActionDefinition {
  readonly name: string;
  readonly description?: string;
  readonly inputs?: CompositeActionInputs;
  readonly outputs?: CompositeActionOutputs;
  readonly runs: {
    readonly using: "composite";
    readonly steps: readonly CompositeActionStep[];
  };
}

export interface CompositeActionRenderInputPayload {
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: string;
}

export interface CompositeActionRenderOutputPayload {
  readonly description?: string;
  readonly value: string;
}

export interface CompositeActionRenderRunStepPayload {
  readonly name?: string;
  readonly id?: string;
  readonly if?: string;
  readonly env?: CompositeActionEnv;
  readonly shell?: string;
  readonly "working-directory"?: string;
  readonly run: string;
}

export interface CompositeActionRenderUsesStepPayload {
  readonly name?: string;
  readonly id?: string;
  readonly if?: string;
  readonly env?: CompositeActionEnv;
  readonly with?: CompositeActionWith;
  readonly uses: string;
}

export type CompositeActionRenderStepPayload =
  | CompositeActionRenderRunStepPayload
  | CompositeActionRenderUsesStepPayload;

export interface CompositeActionRenderPayload {
  readonly name: string;
  readonly description?: string;
  readonly inputs?: Readonly<Record<string, CompositeActionRenderInputPayload>>;
  readonly outputs?: Readonly<Record<string, CompositeActionRenderOutputPayload>>;
  readonly runs: {
    readonly using: "composite";
    readonly steps: readonly CompositeActionRenderStepPayload[];
  };
}

export type CompositeActionEmitter<TResult> = (action: CompositeActionRenderPayload) => TResult;

export class CompositeActionValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(issues.join("\n"));
    this.name = "CompositeActionValidationError";
    this.issues = issues;
  }
}

export interface DefineCompositeActionOptions {
  readonly name: string;
  readonly description?: string;
}

interface CompositeActionDraft {
  readonly name: string;
  readonly description?: string;
  readonly inputs: Map<string, CompositeActionInput>;
  readonly outputs: Map<string, CompositeActionOutput>;
  readonly steps: CompositeActionStep[];
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}

function validateNonBlankString(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function validateIdentifier(scope: string, value: string, issues: string[]): void {
  if (value.trim().length === 0) {
    issues.push(`[${scope}] value must not be empty. Expected: non-empty string`);
    return;
  }

  if (value !== value.trim()) {
    issues.push(
      `[${scope}] value must not contain surrounding whitespace. Expected: no leading or trailing spaces`
    );
    return;
  }

  if (!matchesIdentifierFormat(value)) {
    issues.push(
      `[${scope}] value must match /${IDENTIFIER_FORMAT_SOURCE}/. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens`
    );
  }
}

function validateStringMap(
  scope: string,
  value: Readonly<Record<string, string>> | undefined,
  issues: string[]
): void {
  if (value === undefined) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (!validateNonBlankString(key)) {
      issues.push(`[${scope}] key must not be empty. Expected: non-empty string`);
    }
    if (!validateNonBlankString(entry)) {
      issues.push(`[${scope}.${key}] value must not be empty. Expected: non-empty string`);
    }
  }
}

function buildStepBasePayload(step: CompositeActionStep): {
  readonly name?: string;
  readonly id?: string;
  readonly if?: string;
  readonly env?: CompositeActionEnv;
} {
  return {
    ...(step.name !== undefined ? { name: step.name } : {}),
    ...(step.id !== undefined ? { id: step.id } : {}),
    ...(step.if !== undefined ? { if: step.if } : {}),
    ...(step.env !== undefined ? { env: step.env } : {}),
  };
}

export class CompositeActionBuilder {
  readonly #draft: CompositeActionDraft;

  constructor(options: DefineCompositeActionOptions) {
    this.#draft = {
      name: options.name,
      ...(options.description !== undefined ? { description: options.description } : {}),
      inputs: new Map(),
      outputs: new Map(),
      steps: [],
    };
  }

  input(name: string, input: CompositeActionInput = {}): this {
    this.#draft.inputs.set(name, input);
    return this;
  }

  output(name: string, output: CompositeActionOutput): this {
    this.#draft.outputs.set(name, output);
    return this;
  }

  run(command: string, metadata: CompositeActionRunStepMetadata | string = {}): this {
    const resolvedMetadata = typeof metadata === "string" ? { name: metadata } : metadata;
    this.#draft.steps.push({
      kind: "run",
      run: command,
      ...(resolvedMetadata.name !== undefined ? { name: resolvedMetadata.name } : {}),
      ...(resolvedMetadata.id !== undefined ? { id: resolvedMetadata.id } : {}),
      ...(resolvedMetadata.if !== undefined ? { if: resolvedMetadata.if } : {}),
      ...(resolvedMetadata.env !== undefined ? { env: resolvedMetadata.env } : {}),
      ...(resolvedMetadata.shell !== undefined ? { shell: resolvedMetadata.shell } : {}),
      ...(resolvedMetadata.workingDirectory !== undefined
        ? { workingDirectory: resolvedMetadata.workingDirectory }
        : {}),
    });
    return this;
  }

  uses(action: ActionRef, metadata: CompositeActionUsesStepMetadata | string = {}): this {
    const resolvedMetadata = typeof metadata === "string" ? { name: metadata } : metadata;
    this.#draft.steps.push({
      kind: "uses",
      uses: action,
      ...(resolvedMetadata.name !== undefined ? { name: resolvedMetadata.name } : {}),
      ...(resolvedMetadata.id !== undefined ? { id: resolvedMetadata.id } : {}),
      ...(resolvedMetadata.if !== undefined ? { if: resolvedMetadata.if } : {}),
      ...(resolvedMetadata.env !== undefined ? { env: resolvedMetadata.env } : {}),
      ...(resolvedMetadata.with !== undefined ? { with: resolvedMetadata.with } : {}),
    });
    return this;
  }

  build(): CompositeActionDefinition {
    const issues: string[] = [];

    if (!validateNonBlankString(this.#draft.name)) {
      issues.push("[action.name] value must not be empty. Expected: non-empty string");
    }

    if (this.#draft.description !== undefined && !validateNonBlankString(this.#draft.description)) {
      issues.push("[action.description] value must not be empty. Expected: non-empty string");
    }

    if (this.#draft.steps.length === 0) {
      issues.push("[action.runs.steps] value must not be empty. Expected: at least one step");
    }

    const builtInputs: Record<string, CompositeActionInput> = {};
    for (const [name, input] of this.#draft.inputs) {
      validateIdentifier(`action.inputs.${name}`, name, issues);
      if (input.description !== undefined && !validateNonBlankString(input.description)) {
        issues.push(
          `[action.inputs.${name}.description] value must not be empty. Expected: non-empty string`
        );
      }
      if (input.default !== undefined && !validateNonBlankString(input.default)) {
        issues.push(
          `[action.inputs.${name}.default] value must not be empty. Expected: non-empty string`
        );
      }

      builtInputs[name] = {
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.required !== undefined ? { required: input.required } : {}),
        ...(input.default !== undefined ? { default: input.default } : {}),
      };
    }

    const builtOutputs: Record<string, CompositeActionOutput> = {};
    for (const [name, output] of this.#draft.outputs) {
      validateIdentifier(`action.outputs.${name}`, name, issues);
      if (output.description !== undefined && !validateNonBlankString(output.description)) {
        issues.push(
          `[action.outputs.${name}.description] value must not be empty. Expected: non-empty string`
        );
      }
      if (!validateNonBlankString(output.value)) {
        issues.push(
          `[action.outputs.${name}.value] value must not be empty. Expected: non-empty string`
        );
      }

      builtOutputs[name] = {
        ...(output.description !== undefined ? { description: output.description } : {}),
        value: output.value,
      };
    }

    const stepIds = new Set<string>();
    const builtSteps = this.#draft.steps.map((step, index) => {
      const stepScope = `action.runs.steps[${index}]`;

      if (step.name !== undefined && !validateNonBlankString(step.name)) {
        issues.push(`[${stepScope}.name] value must not be empty. Expected: non-empty string`);
      }

      if (step.id !== undefined) {
        validateIdentifier(`${stepScope}.id`, step.id, issues);
        if (stepIds.has(step.id)) {
          issues.push(
            `[${stepScope}.id] value must be unique. Expected: no duplicate step identifiers`
          );
        }
        stepIds.add(step.id);
      }

      if (step.if !== undefined && !validateNonBlankString(step.if)) {
        issues.push(`[${stepScope}.if] value must not be empty. Expected: non-empty string`);
      }

      validateStringMap(`${stepScope}.env`, step.env, issues);

      if (step.kind === "run") {
        if (!validateNonBlankString(step.run)) {
          issues.push(`[${stepScope}.run] value must not be empty. Expected: non-empty string`);
        }
        if (step.shell !== undefined && !validateNonBlankString(step.shell)) {
          issues.push(`[${stepScope}.shell] value must not be empty. Expected: non-empty string`);
        }
        if (step.workingDirectory !== undefined && !validateNonBlankString(step.workingDirectory)) {
          issues.push(
            `[${stepScope}.working-directory] value must not be empty. Expected: non-empty string`
          );
        }

        return {
          kind: "run" as const,
          ...(step.name !== undefined ? { name: step.name } : {}),
          ...(step.id !== undefined ? { id: step.id } : {}),
          ...(step.if !== undefined ? { if: step.if } : {}),
          ...(step.env !== undefined ? { env: { ...step.env } } : {}),
          ...(step.shell !== undefined ? { shell: step.shell } : {}),
          ...(step.workingDirectory !== undefined
            ? { workingDirectory: step.workingDirectory }
            : {}),
          run: step.run,
        };
      }

      try {
        actionRef(step.uses);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        issues.push(`[${stepScope}.uses] ${message}`);
      }

      validateStringMap(`${stepScope}.with`, step.with, issues);

      return {
        kind: "uses" as const,
        ...(step.name !== undefined ? { name: step.name } : {}),
        ...(step.id !== undefined ? { id: step.id } : {}),
        ...(step.if !== undefined ? { if: step.if } : {}),
        ...(step.env !== undefined ? { env: { ...step.env } } : {}),
        ...(step.with !== undefined ? { with: { ...step.with } } : {}),
        uses: step.uses,
      };
    });

    if (issues.length > 0) {
      throw new CompositeActionValidationError(issues);
    }

    return deepFreeze({
      name: this.#draft.name,
      ...(this.#draft.description !== undefined ? { description: this.#draft.description } : {}),
      ...(Object.keys(builtInputs).length > 0 ? { inputs: builtInputs } : {}),
      ...(Object.keys(builtOutputs).length > 0 ? { outputs: builtOutputs } : {}),
      runs: {
        using: "composite" as const,
        steps: builtSteps,
      },
    });
  }
}

export function defineCompositeAction(
  options: DefineCompositeActionOptions
): CompositeActionBuilder {
  return new CompositeActionBuilder(options);
}

export function createCompositeActionRenderPayload(
  action: CompositeActionDefinition
): CompositeActionRenderPayload {
  const inputs =
    action.inputs === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(action.inputs).map(([name, input]) => [
            name,
            {
              ...(input.description !== undefined ? { description: input.description } : {}),
              ...(input.required !== undefined ? { required: input.required } : {}),
              ...(input.default !== undefined ? { default: input.default } : {}),
            },
          ])
        );

  const outputs =
    action.outputs === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(action.outputs).map(([name, output]) => [
            name,
            {
              ...(output.description !== undefined ? { description: output.description } : {}),
              value: output.value,
            },
          ])
        );

  return deepFreeze({
    name: action.name,
    ...(action.description !== undefined ? { description: action.description } : {}),
    ...(inputs !== undefined ? { inputs } : {}),
    ...(outputs !== undefined ? { outputs } : {}),
    runs: {
      using: "composite" as const,
      steps: action.runs.steps.map((step) => {
        if (step.kind === "run") {
          return {
            ...buildStepBasePayload(step),
            ...(step.shell !== undefined ? { shell: step.shell } : {}),
            ...(step.workingDirectory !== undefined
              ? { "working-directory": step.workingDirectory }
              : {}),
            run: step.run,
          };
        }

        return {
          ...buildStepBasePayload(step),
          ...(step.with !== undefined ? { with: step.with } : {}),
          uses: step.uses,
        };
      }),
    },
  });
}

export function renderCompositeAction<TResult>(
  action: CompositeActionDefinition,
  emitter: CompositeActionEmitter<TResult>
): TResult {
  return emitter(createCompositeActionRenderPayload(action));
}
