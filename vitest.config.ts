import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@ghawb/shared": resolve(root, "packages/shared/src/index.ts"),
      "@ghawb/sdk": resolve(root, "packages/sdk/src/index.ts"),
      "@ghawb/composite-actions": resolve(root, "packages/composite-actions/src/index.ts"),
      "@ghawb/typed-actions": resolve(root, "packages/typed-actions/src/index.ts"),
      "@ghawb/cli": resolve(root, "packages/cli/src/index.ts"),
      "@ghawb/yaml-import": resolve(root, "packages/yaml-import/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: [
      "packages/cli/src/**/*.test.ts",
      "packages/composite-actions/src/**/*.test.ts",
      "packages/shared/src/**/*.test.ts",
      "packages/sdk/src/**/*.test.ts",
      "packages/typed-actions/src/**/*.test.ts",
      "packages/yaml-import/src/**/*.test.ts",
      "tests/node/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: ["packages/sdk/src/**/*.ts"],
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 98,
      },
    },
  },
});
