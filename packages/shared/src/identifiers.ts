import type { Brand } from './brand.ts';
import { InvalidIdentifierError } from './errors.ts';

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export type WorkflowId = Brand<string, 'WorkflowId'>;
export type JobId = Brand<string, 'JobId'>;

export { InvalidIdentifierError as IdentifierFormatError };

function createIdentifier<TIdentifier extends WorkflowId | JobId>(
  kind: 'workflow' | 'job',
  value: string
): TIdentifier {
  if (value.trim().length === 0) {
    throw new InvalidIdentifierError(kind, value, 'value must not be empty');
  }

  if (value !== value.trim()) {
    throw new InvalidIdentifierError(kind, value, 'value must not contain surrounding whitespace');
  }

  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new InvalidIdentifierError(kind, value, 'value must match /^[A-Za-z0-9][A-Za-z0-9_-]*$/');
  }

  return value as TIdentifier;
}

export function createWorkflowId(value: string): WorkflowId {
  return createIdentifier<WorkflowId>('workflow', value);
}

export function createJobId(value: string): JobId {
  return createIdentifier<JobId>('job', value);
}
