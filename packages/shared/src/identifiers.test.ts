import { describe, expect, it } from 'vitest';

import { InvalidIdentifierError, createJobId, createWorkflowId } from './index.ts';

describe('identifier factories', () => {
  it('preserves valid values without normalization', () => {
    expect(createWorkflowId('release_ci')).toBe('release_ci');
  });

  it('accepts hyphenated values', () => {
    expect(createJobId('build-linux')).toBe('build-linux');
  });

  it('rejects empty values', () => {
    expect(() => createWorkflowId('   ')).toThrow(InvalidIdentifierError);
  });

  it('rejects surrounding whitespace instead of trimming', () => {
    expect(() => createWorkflowId('  release_ci  ')).toThrow(InvalidIdentifierError);
  });

  it('rejects invalid characters', () => {
    expect(() => createJobId('build/linux')).toThrow(InvalidIdentifierError);
  });
});
