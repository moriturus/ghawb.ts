import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: ['.codex', '.github'],
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
});
