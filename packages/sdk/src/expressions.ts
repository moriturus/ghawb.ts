export interface StepOutputRef {
  outputs(name: string): string;
}

export interface NeedsOutputRef {
  outputs(name: string): string;
}

export type ExpressionLiteral = string | number | boolean | null;

function assertExpressionFragment(name: string, value: string): void {
  if (value.trim().length === 0) {
    throw new Error(
      `${name} must not be empty or blank. Expected: a non-blank expression fragment`
    );
  }
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

export function needs(id: string): NeedsOutputRef {
  if (id.trim().length === 0) {
    throw new Error("needs id must not be empty or blank. Expected: a job identifier");
  }
  return {
    outputs(name: string): string {
      if (name.trim().length === 0) {
        throw new Error("needs outputs name must not be empty or blank. Expected: an output name");
      }
      return `needs.${id}.outputs.${name}`;
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

export function literal(value: ExpressionLiteral): string {
  if (typeof value === "string") {
    return `'${value.replaceAll("'", "''")}'`;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("literal number must be finite. Expected: a JSON-compatible number");
    }
    return `${value}`;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return "null";
}

export function eq(left: string, right: string): string {
  assertExpressionFragment("eq left operand", left);
  assertExpressionFragment("eq right operand", right);
  return `${left} == ${right}`;
}

export function ne(left: string, right: string): string {
  assertExpressionFragment("ne left operand", left);
  assertExpressionFragment("ne right operand", right);
  return `${left} != ${right}`;
}

export function gt(left: string, right: string): string {
  assertExpressionFragment("gt left operand", left);
  assertExpressionFragment("gt right operand", right);
  return `${left} > ${right}`;
}

export function gte(left: string, right: string): string {
  assertExpressionFragment("gte left operand", left);
  assertExpressionFragment("gte right operand", right);
  return `${left} >= ${right}`;
}

export function lt(left: string, right: string): string {
  assertExpressionFragment("lt left operand", left);
  assertExpressionFragment("lt right operand", right);
  return `${left} < ${right}`;
}

export function lte(left: string, right: string): string {
  assertExpressionFragment("lte left operand", left);
  assertExpressionFragment("lte right operand", right);
  return `${left} <= ${right}`;
}

export function and(...operands: readonly [string, string, ...string[]]): string {
  for (const operand of operands) {
    assertExpressionFragment("and operand", operand);
  }
  return operands.join(" && ");
}

export function or(...operands: readonly [string, string, ...string[]]): string {
  for (const operand of operands) {
    assertExpressionFragment("or operand", operand);
  }
  return operands.join(" || ");
}

export function not(operand: string): string {
  assertExpressionFragment("not operand", operand);
  return `!${operand}`;
}
