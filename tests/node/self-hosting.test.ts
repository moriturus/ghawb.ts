import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

describe("self-hosted workflow output", () => {
  it("keeps committed workflow outputs aligned with generated sources", async () => {
    const ciWorkflowPath = join(process.cwd(), ".github", "workflows", "ci.yml");
    const manualWorkflowPath = join(process.cwd(), ".github", "workflows", "manual-verify.yml");
    const [ciContents, manualContents] = await Promise.all([
      readFile(ciWorkflowPath, "utf8"),
      readFile(manualWorkflowPath, "utf8"),
    ]);

    expect(ciContents).toContain("name: CI");
    expect(ciContents).toContain("run: bun run verify:workflows");
    expect(ciContents).toContain("run: bun run check");
    expect(ciContents).toContain("run: bun run coverage");
    expect(ciContents).toContain("uses: actions/upload-artifact@v4");
    expect(ciContents).toContain("path: coverage/lcov.info");
    expect(ciContents).toContain("run: bun run test:vitest:node");
    expect(ciContents).toContain("run: npm install --dry-run");
    expect(manualContents).toContain("name: Manual Verify");
    expect(manualContents).toContain("workflow_dispatch: null");
    expect(manualContents).toContain("run: bun run verify:pre-push");
  });

  it("keeps the root workspace dependency needed to render repository-local workflows in clean installs", async () => {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      devDependencies?: Record<string, string>;
    };

    const sdkVersion = packageJson.devDependencies?.["@ghawb/sdk"];
    expect(sdkVersion).toBeDefined();
    expect(sdkVersion).not.toMatch(/^workspace:/);
  });

  it("documents the supported pre-push verification command and workflow authoring convention", async () => {
    const packageJsonPath = join(process.cwd(), "package.json");
    const readmePath = join(process.cwd(), "README.md");
    const contributingPath = join(process.cwd(), "docs", "CONTRIBUTING.md");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };
    const readme = await readFile(readmePath, "utf8");
    const contributing = await readFile(contributingPath, "utf8");

    expect(packageJson.scripts?.["verify:workflows"]).toBe("bun run scripts/verify-workflows.ts");
    expect(packageJson.scripts?.["verify:pre-push"]).toBe("bun run scripts/verify-pre-push.ts");
    expect(packageJson.scripts?.coverage).toBe("vitest run --coverage");
    expect(readme).toContain("bun run verify:pre-push");
    expect(readme).toContain("bun run verify:workflows");
    expect(readme).toContain(
      "Author committed workflow source modules inside the repository under"
    );
    expect(readme).toContain(
      "Render every committed workflow module with `bun run generate:workflows`"
    );
    expect(contributing).toContain("bun run verify:pre-push");
    expect(contributing).toContain("bun run verify:workflows");
    expect(contributing).toContain("bun run coverage");
    expect(contributing).toContain("coverage/lcov.info");
    expect(contributing).toContain("Keep committed workflow source modules under");
    expect(contributing).toContain("render every committed workflow module");
  });
});
