import { defineConfig } from 'oxlint';

export default defineConfig({
  ignorePatterns: ['.codex', '.github', 'coverage', 'node_modules', 'tests/deno'],
});
