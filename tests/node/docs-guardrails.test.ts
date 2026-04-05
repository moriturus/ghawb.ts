import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateDocsContract, verifyDocsContract } from "../../scripts/verify-docs.js";

describe("docs guardrails", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((path) => rm(path, { force: true, recursive: true })));
    tempDirs.length = 0;
  });

  it("verifies the maintained docs contract for the repository", async () => {
    await expect(validateDocsContract(process.cwd())).resolves.toEqual({ issues: [] });
    await expect(verifyDocsContract(process.cwd())).resolves.toBeUndefined();
  });

  it("reports actionable drift when maintained docs lose required invariants", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "ghawb-docs-guardrails-"));
    tempDirs.push(tempDir);

    await mkdir(join(tempDir, "docs"), { recursive: true });

    await Promise.all([
      writeFile(join(tempDir, "README.md"), "# ghawb\n", "utf8"),
      writeFile(join(tempDir, "docs", "COOKBOOK.md"), "# Cookbook\n", "utf8"),
      writeFile(join(tempDir, "docs", "API_REFERENCE.md"), "# API Reference\n", "utf8"),
      writeFile(join(tempDir, "docs", "SPEC.md"), "# Specification\n", "utf8"),
    ]);

    const result = await validateDocsContract(tempDir);

    expect(result.issues).toContain(
      "docs contract drift in README.md: missing Node 24 nodeCi example"
    );
    expect(result.issues).toContain(
      "docs contract drift in docs/COOKBOOK.md: missing preferred nodeCi apply usage guidance"
    );
    expect(result.issues).toContain(
      "docs contract drift in docs/API_REFERENCE.md: missing canonical render CLI mention"
    );
    expect(result.issues).toContain(
      "docs contract drift in docs/SPEC.md: missing canonical render contract"
    );
    await expect(verifyDocsContract(tempDir)).rejects.toThrowError("Docs guardrails failed");
  });

  it("wires the dedicated docs guardrail command through contributor verification flow", async () => {
    const packageJson = JSON.parse(await readFile(join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["verify:docs"]).toBe("bun run scripts/verify-docs.ts");
    expect(packageJson.scripts["check"]).toContain("bun run verify:docs");
    expect(packageJson.scripts["verify:pre-push"]).toBe("bun run scripts/verify-pre-push.ts");
  });
});
