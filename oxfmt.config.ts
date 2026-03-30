import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: ['.agents', '.codex', '.github', 'coverage', 'node_modules', 'docs'],
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
});
