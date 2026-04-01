import type { Brand } from './brand.ts';
import { InvalidIdentifierError } from './errors.ts';

export const IDENTIFIER_FORMAT_SOURCE = '^[a-zA-Z_][a-zA-Z0-9_-]*$';
export const IDENTIFIER_FORMAT_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;

export type WorkflowId = Brand<string, 'WorkflowId'>;
export type JobId = Brand<string, 'JobId'>;

export { InvalidIdentifierError as IdentifierFormatError };

export function matchesIdentifierFormat(value: string): boolean {
  return IDENTIFIER_FORMAT_PATTERN.test(value);
}

function createIdentifier<TIdentifier extends WorkflowId | JobId>(
  kind: 'workflow' | 'job',
  value: string
): TIdentifier {
  if (value.trim().length === 0) {
    throw new InvalidIdentifierError(kind, value, 'value must not be empty');
  }

  if (value !== value.trim()) {
    throw new InvalidIdentifierError(
      kind,
      value,
      'value must not contain surrounding whitespace. Expected: no leading or trailing spaces'
    );
  }

  if (!IDENTIFIER_FORMAT_PATTERN.test(value)) {
    throw new InvalidIdentifierError(
      kind,
      value,
      `value must match /${IDENTIFIER_FORMAT_SOURCE}/. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens`
    );
  }

  return value as TIdentifier;
}

export function createWorkflowId(value: string): WorkflowId {
  return createIdentifier<WorkflowId>('workflow', value);
}

export function createJobId(value: string): JobId {
  return createIdentifier<JobId>('job', value);
}
