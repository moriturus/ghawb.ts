import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface DocsGuardrailResult {
  readonly issues: readonly string[];
}

interface FileInvariant {
  readonly description: string;
  readonly pattern: RegExp;
  readonly mode?: "required" | "forbidden";
}

interface FileContract {
  readonly path: string;
  readonly invariants: readonly FileInvariant[];
}

const FILE_CONTRACTS: readonly FileContract[] = [
  {
    path: "README.md",
    invariants: [
      {
        description: "Node 24 nodeCi example",
        pattern: /nodeCi\(\{\s*nodeVersion: "24"\s*\}\)/u,
      },
      {
        description: "canonical render --input guidance",
        pattern: /ghawb render --input workflows\/ci\.ts/u,
      },
      {
        description: "config manifest guidance",
        pattern: /ghawb render --bulk ghawb\.render\.json/u,
      },
      {
        description: "retired config-manifest heading",
        mode: "forbidden",
        pattern: /Render from a config manifest/u,
      },
      {
        description: "retired config-manifest CLI example",
        mode: "forbidden",
        pattern: /ghawb render --config ghawb\.render\.json/u,
      },
      {
        description: "retired CLI-owned config manifest wording",
        mode: "forbidden",
        pattern: /CLI-owned config manifest through --config <file>/u,
      },
      {
        description: "@ghawb\\/job-helpers package guidance",
        pattern: /@ghawb\/job-helpers/u,
      },
      {
        description: "preferred nodeCi apply usage",
        pattern: /job\.apply\(nodeCi\(options\)\)/u,
      },
    ],
  },
  {
    path: join("docs", "COOKBOOK.md"),
    invariants: [
      {
        description: "Node 24 nodeCi example",
        pattern: /nodeCi\(\{\s*nodeVersion: "24"\s*\}\)/u,
      },
      {
        description: "Node 24 reusable workflow default",
        pattern: /default: "24"/u,
      },
      {
        description: "preferred nodeCi apply usage guidance",
        pattern: /Prefer `job\.apply\(nodeCi\(\.\.\.\)\)` from `@ghawb\/job-helpers`/u,
      },
    ],
  },
  {
    path: join("docs", "API_REFERENCE.md"),
    invariants: [
      {
        description: "Node 24 typed action example",
        pattern: /actionsSetupNode\(\{\s*nodeVersion: "24"/u,
      },
      {
        description: "canonical render CLI mention",
        pattern: /canonical `ghawb render` CLI path/u,
      },
      {
        description: "related opt-in package guidance",
        pattern: /@ghawb\/job-helpers/u,
      },
    ],
  },
  {
    path: join("docs", "SPEC.md"),
    invariants: [
      {
        description: "@ghawb\\/job-helpers workspace listing",
        pattern: /@ghawb\/job-helpers/u,
      },
      {
        description: "Node 24 nodeCi contract",
        pattern: /job\.apply\(nodeCi\(\{\s*nodeVersion: "24"\s*\}\)\)/u,
      },
      {
        description: "canonical render contract",
        pattern: /ghawb render.*--bulk.*--input <module\.ts>.*--config <data/u,
      },
      {
        description: "render-plan manifest contract",
        pattern: /ghawb render` accepts an explicit render-plan manifest file through `--bulk <file>`/u,
      },
      {
        description: "retired config-manifest contract wording",
        mode: "forbidden",
        pattern: /config-manifest contract is intentionally CLI-owned/u,
      },
    ],
  },
];

export async function validateDocsContract(cwd: string): Promise<DocsGuardrailResult> {
  const issues: string[] = [];

  for (const fileContract of FILE_CONTRACTS) {
    const absolutePath = join(cwd, fileContract.path);
    let contents: string;

    try {
      contents = await readFile(absolutePath, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(`failed to read ${fileContract.path}: ${message}`);
      continue;
    }

    for (const invariant of fileContract.invariants) {
      const matches = invariant.pattern.test(contents);
      const isForbidden = invariant.mode === "forbidden";

      if ((isForbidden && matches) || (!isForbidden && !matches)) {
        issues.push(
          `docs contract drift in ${fileContract.path}: ${isForbidden ? "found" : "missing"} ${invariant.description}`
        );
      }
    }
  }

  return { issues };
}

export async function verifyDocsContract(cwd: string): Promise<void> {
  const result = await validateDocsContract(cwd);

  if (result.issues.length > 0) {
    throw new Error(`Docs guardrails failed:\n- ${result.issues.join("\n- ")}`);
  }
}

if (import.meta.main) {
  try {
    await verifyDocsContract(process.cwd());
    console.log("Verified docs guardrails");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}
