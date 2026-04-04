export interface StepOutputRef {
  outputs(name: string): string;
}

export function expr(content: string): string {
  if (content.trim().length === 0) {
    throw new Error(
      "expr content must not be empty or blank. Expected: a non-blank expression string"
    );
  }
  return `\${{ ${content} }}`;
}

export function github(property: string): string {
  if (property.trim().length === 0) {
    throw new Error(
      'github property must not be empty or blank. Expected: a context property name like "ref" or "event_name"'
    );
  }
  return `github.${property}`;
}

export function env(name: string): string {
  if (name.trim().length === 0) {
    throw new Error("env name must not be empty or blank. Expected: an environment variable name");
  }
  return `env.${name}`;
}

export function secrets(name: string): string {
  if (name.trim().length === 0) {
    throw new Error("secrets name must not be empty or blank. Expected: a secret name");
  }
  return `secrets.${name}`;
}

export function matrix(key: string): string {
  if (key.trim().length === 0) {
    throw new Error("matrix key must not be empty or blank. Expected: a matrix axis key");
  }
  return `matrix.${key}`;
}

export function inputs(name: string): string {
  if (name.trim().length === 0) {
    throw new Error("inputs name must not be empty or blank. Expected: an input name");
  }
  return `inputs.${name}`;
}

export function steps(id: string): StepOutputRef {
  if (id.trim().length === 0) {
    throw new Error("steps id must not be empty or blank. Expected: a step identifier");
  }
  return {
    outputs(name: string): string {
      if (name.trim().length === 0) {
        throw new Error("steps outputs name must not be empty or blank. Expected: an output name");
      }
      return `steps.${id}.outputs.${name}`;
    },
  };
}

export function success(): string {
  return "success()";
}

export function always(): string {
  return "always()";
}

export function cancelled(): string {
  return "cancelled()";
}

export function failure(): string {
  return "failure()";
}
