import { describe, expect, it } from 'vitest';

import {
  IDENTIFIER_FORMAT_SOURCE,
  InvalidIdentifierError,
  createJobId,
  createWorkflowId,
  matchesIdentifierFormat,
} from './index.js';

describe('identifier factories', () => {
  it('preserves valid values without normalization', () => {
    expect(createWorkflowId('release_ci')).toBe('release_ci');
  });

  it('accepts hyphenated values', () => {
    expect(createJobId('build-linux')).toBe('build-linux');
  });

  it('accepts leading underscores', () => {
    expect(createWorkflowId('_release_ci')).toBe('_release_ci');
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

  it('rejects leading digits', () => {
    expect(() => createJobId('1build')).toThrowError(
      new InvalidIdentifierError(
        'job',
        '1build',
        `value must match /${IDENTIFIER_FORMAT_SOURCE}/. Expected: a letter or underscore start, followed by letters, digits, underscores, or hyphens`
      )
    );
  });

  it('rejects unicode characters', () => {
    expect(() => createWorkflowId('リリース')).toThrow(InvalidIdentifierError);
  });

  it('exposes the shared identifier format matcher', () => {
    expect(matchesIdentifierFormat('step_id')).toBe(true);
    expect(matchesIdentifierFormat('1step')).toBe(false);
  });
});
