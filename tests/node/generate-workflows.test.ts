import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { generateWorkflows } from "../../scripts/generate-workflows.js";

describe("workflow generation script", () => {
  it("renders every committed workflow module to its matching generated output", async () => {
    const mappings = await generateWorkflows(process.cwd());

    expect(mappings).toEqual([
      {
        sourcePath: join(process.cwd(), "workflows", "ci.ts"),
        outputPath: join(process.cwd(), ".github", "workflows", "ci.yml"),
      },
      {
        sourcePath: join(process.cwd(), "workflows", "manual-verify.ts"),
        outputPath: join(process.cwd(), ".github", "workflows", "manual-verify.yml"),
      },
      {
        sourcePath: join(process.cwd(), "workflows", "publish.ts"),
        outputPath: join(process.cwd(), ".github", "workflows", "publish.yml"),
      },
      {
        sourcePath: join(process.cwd(), "workflows", "release.ts"),
        outputPath: join(process.cwd(), ".github", "workflows", "release.yml"),
      },
    ]);

    const [ciOutput, manualOutput, publishOutput, releaseOutput] = await Promise.all([
      readFile(join(process.cwd(), ".github", "workflows", "ci.yml"), "utf8"),
      readFile(join(process.cwd(), ".github", "workflows", "manual-verify.yml"), "utf8"),
      readFile(join(process.cwd(), ".github", "workflows", "publish.yml"), "utf8"),
      readFile(join(process.cwd(), ".github", "workflows", "release.yml"), "utf8"),
    ]);

    expect(ciOutput).toContain("name: CI");
    expect(manualOutput).toContain("name: Manual Verify");
    expect(manualOutput).toContain("workflow_dispatch: null");
    expect(publishOutput).toContain("name: Publish");
    expect(publishOutput).toContain("tags:");
    expect(releaseOutput).toContain("name: Release");
    expect(releaseOutput).toContain("changesets/action@v1");
  });
});
