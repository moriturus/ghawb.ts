export class InvalidIdentifierError extends Error {
  readonly kind: string;
  readonly value: string;

  constructor(kind: string, value: string, reason: string) {
    super(`${kind} identifier "${value}" is invalid: ${reason}`);
    this.name = 'InvalidIdentifierError';
    this.kind = kind;
    this.value = value;
  }
}

export class WorkflowValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Workflow validation failed:\n- ${issues.join('\n- ')}`);
    this.name = 'WorkflowValidationError';
    this.issues = issues;
  }
}
