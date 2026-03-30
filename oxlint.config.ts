import { defineConfig } from 'oxlint';

export default defineConfig({
  ignorePatterns: [
    '.agents',
    '.codex',
    '.github',
    'coverage',
    'node_modules',
    'tests/deno',
    'docs',
  ],
});
