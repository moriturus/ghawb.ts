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
    coverage: {
      provider: 'v8',
      include: ['packages/sdk/src/**/*.ts'],
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 100,
      },
    },
  },
});
