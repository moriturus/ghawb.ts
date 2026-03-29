import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'packages/cli/src/**/*.test.ts',
      'packages/shared/src/**/*.test.ts',
      'packages/sdk/src/**/*.test.ts',
      'tests/node/**/*.test.ts',
    ],
  },
});
