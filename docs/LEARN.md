# Learnings

Use this document to capture durable lessons discovered during implementation.

## When To Add An Entry

- A mistake was easy to make and likely to recur.
- A design constraint turned out to be more important than expected.
- A runtime, tooling, or compatibility edge case affected implementation choices.
- A testing pattern or workflow significantly improved reliability.

## Entry Template

### Title

- Date:
- Context:
- What happened:
- Why it matters:
- Recommendation:
- Links:

## Dating Convention

Entry dates reflect the UTC date of the git commit that introduced the entry, derived from `git log` evidence. When a lesson is discovered during sprint execution but documented later (e.g., during a retrospective), use the commit date of the documentation change, not the date the lesson was originally encountered.

## Entries

### Guard Deno against parser debug env probes in source-first packages

- Date: 2026-04-05
- Context: Sprint 23, Item 77 (`@ghawb/yaml-import` Deno compatibility hardening).
- What happened: The `yaml` package used by `@ghawb/yaml-import` reads `process.env.LOG_TOKENS` and `process.env.LOG_STREAM` inside its parser and composer paths. Under Deno's Node-compat layer, those debug-only checks trigger `--allow-env` permission prompts even for ordinary parse calls.
- Why it matters: Source-first Deno package entrypoints can inherit surprising permission requirements from transitive Node-oriented dependencies even when the application code itself does not need those permissions.
- Recommendation: When a source-first package must stay Deno-compatible, inspect transitive dependencies for debug or logging probes against `process.env` and neutralize them in the narrowest possible scope rather than broadening the package's runtime permission requirements.
- Links: [packages/yaml-import/src/index.ts](../packages/yaml-import/src/index.ts), [tests/deno/public-entrypoints.test.ts](../tests/deno/public-entrypoints.test.ts)

### Keep workflow source modules inside the repository when the CLI imports TypeScript directly

- Date: 2026-03-29
- Context: Sprint 3 introduced a CLI that imports a user-specified TypeScript workflow module and renders it to YAML.
- What happened: Temporary workflow modules created outside the repository root could not reliably resolve workspace package imports such as `@ghawb/sdk`.
- Why it matters: The CLI contract is simpler and more reproducible when authored workflow modules live inside the repository or otherwise manage their own module resolution explicitly.
- Recommendation: Keep generated and committed workflow source modules under a repository-owned directory such as `workflows/`, and reserve out-of-tree fixtures for tests that use explicit absolute imports.
- Links: [packages/cli/src/index.ts](../packages/cli/src/index.ts), [packages/cli/src/cli.test.ts](../packages/cli/src/cli.test.ts), [workflows/ci.ts](../workflows/ci.ts)

### Freeze returned workflow models, not only builder drafts

- Date: 2026-03-30
- Context: Sprint 2 tightened the workflow contract so later rendering can trust already-built definitions.
- What happened: Validation-only hardening was not enough because callers could still mutate returned workflow objects, nested arrays, or step maps after `build()`.
- Why it matters: Renderer determinism depends on stable post-build state, so immutability must apply to the published AST shape, not just to internal builder copies.
- Recommendation: When a workflow definition becomes externally observable, deep-freeze the full returned object graph, including arrays and nested records such as `env` and `with`.
- Links: [packages/sdk/src/builders.ts](../packages/sdk/src/builders.ts), [packages/sdk/src/workflow.test.ts](../packages/sdk/src/workflow.test.ts)

### Use a single Bun/Node test runner before fixture volume grows

- Date: 2026-03-30
- Context: Sprint 2 introduced renderer coverage, which would have multiplied the cost of maintaining separate `bun:test` and `node:test` suites.
- What happened: The repository converged Bun and Node coverage on Vitest while keeping Deno limited to smoke coverage.
- Why it matters: Shared helpers, failure assertions, and future renderer or CLI fixtures stay easier to evolve when Bun and Node execute the same test files under the same runner contract.
- Recommendation: Keep Bun-run Vitest as the primary repository test authority, use Node-run Vitest as compatibility confirmation, and reserve Deno for smoke-oriented checks unless a broader conformance suite is intentionally designed.
- Links: [package.json](../package.json), [vitest.config.ts](../vitest.config.ts), [tests/node/smoke.test.ts](../tests/node/smoke.test.ts)

### Omit unset optional properties in strict AST builders

- Date: 2026-03-30
- Context: Sprint 1 uses `exactOptionalPropertyTypes` with builder-produced workflow AST objects.
- What happened: Returning objects with `property: undefined` caused type errors across builder drafts and finalized model nodes even when the runtime shape was otherwise correct.
- Why it matters: Strict optional-property semantics make the model contract clearer and reduce accidental shape drift, but only if builders omit unset fields instead of writing `undefined`.
- Recommendation: For workflow model and builder code, construct optional fields through conditional object spreads so absent metadata stays absent in both drafts and finalized AST values.
- Links: [packages/sdk/src/builders.ts](../packages/sdk/src/builders.ts), [tsconfig.json](../tsconfig.json)

### Separate runtime-specific test entrypoints

- Date: 2026-03-29
- Context: Sprint 1 introduced Bun, Node, and Deno test entrypoints in the same repository.
- What happened: A single generic TypeScript type-check pass tried to load Bun and Deno globals at once, while Bun also tried to execute the Deno-only test file.
- Why it matters: Multi-runtime support becomes noisy and brittle if runtime-specific tests are not isolated by entrypoint and by type-check surface.
- Recommendation: Keep root `tsc` focused on shared code plus the Node-facing smoke path, and let Bun and Deno validate their own test files through their native runners.
- Links: [package.json](../package.json), [tsconfig.json](../tsconfig.json), [deno.json](../deno.json)

### Sub-agent prompts must include counter-examples for exactOptionalPropertyTypes

- Date: 2026-04-01
- Context: Sprint 8, Item 22 (trigger filter negation and tag filters).
- What happened: A test-writing sub-agent produced `tagsIgnore: undefined` in a test fixture despite the prompt explicitly warning against it. This is the same class of error that was first documented as a lesson during Sprint 1 and that is reinforced in AGENTS.md. The warning-only approach is not sufficient to prevent the recurrence.
- Why it matters: Under `exactOptionalPropertyTypes: true`, writing `prop: undefined` for an optional property is a type error. When sub-agents produce this pattern, it requires manual correction after the delegation completes.
- Recommendation: Include a concrete counter-example in sub-agent prompts showing the wrong code (`tags: undefined`) and the correct alternative (omit the property entirely, or use conditional spread `...(tags ? { tags } : {})`). Rule statements without examples are less effective at preventing this class of mistake.
- Links: [tsconfig.json](../tsconfig.json), [AGENTS.md](../AGENTS.md)

### Narrow regex capture groups under strict TypeScript

- Date: 2026-04-01
- Context: Sprint 8, Item 23 (step identifiers and job output declarations).
- What happened: The `steps.<id>` referential validation used `String.prototype.matchAll()` to extract step IDs from output value expressions. The regex match group `match[1]` is typed as `string | undefined` under `strictNullChecks`, but the developer initially treated it as `string` without narrowing. The type-check pass caught the error.
- Why it matters: Regex capture groups always have an `undefined` element type in their match arrays under strict TypeScript, even when the group is not optional in the pattern. Forgetting to narrow creates type errors that are only caught at the type-check stage rather than at authoring time.
- Recommendation: Always apply a nullish coalescing guard (`match[1] ?? ''`) or an explicit truthiness check when reading regex capture groups. Treat every `match[N]` access (where N > 0) as potentially `undefined` regardless of the pattern structure.
- Links: [builders.ts](../packages/sdk/src/builders.ts)

### Sub-agent prompts must require format-before-verify

- Date: 2026-04-02
- Context: Sprint 11, Item 35 (validation diagnostic enrichment).
- What happened: The sub-agent performing the cross-cutting validation message enrichment did not run `bun run format` before its verification step. The coordinator had to intervene to format the code and verify the result. This is the same class of formatting friction noted in Sprint 9 and Sprint 10.
- Why it matters: When sub-agents skip formatting, the coordinator loses time debugging whether test failures are logic errors or style violations. For cross-cutting changes that touch many files (Item 35 touched ~70 messages across 3 source files), the formatting delta can be large and confusing.
- Recommendation: Include a standardized verification suffix in every sub-agent delegation prompt: `bun run format && bun run check && bun run coverage`. Make it explicit that format must run first, not after tests.
- Links: [AGENTS.md](../AGENTS.md), [TEAM.md](./TEAM.md)

### Sub-agents must not commit temporary test files

- Date: 2026-04-02
- Context: Sprint 11, Item 33 (container and services).
- What happened: The sub-agent committed a stray `test-yaml-render.ts` temporary file alongside the Item 33 deliverables. The coordinator had to `git rm` it and amend the commit.
- Why it matters: Temporary artifacts in commits create noise in reviews and can break CI if they contain invalid imports or duplicate test names. The cleanup cost is small but avoidable.
- Recommendation: Add an explicit cleanup instruction to sub-agent prompts: "Before committing, verify that `git status` shows only files that are part of the deliverable. Remove any temporary test or scratch files."
- Links: [AGENTS.md](../AGENTS.md)

### Job builder method is `displayName()`, not `name()`

- Date: 2026-04-02
- Context: Sprint 12, Item 36 (display name fields).
- What happened: The job-level `name` field is set via `.displayName()` on the job builder, not `.name()`. The method was named `displayName` to avoid a collision with the built-in `Function.name` property on class instances. Developers exploring the API naturally try `.name()` first, which does not exist.
- Why it matters: The naming asymmetry — `.runName()` at workflow level vs. `.displayName()` at job level — is not obvious from the render key names (`run-name` and `name` respectively). Without documentation, SDK consumers will hit a runtime "not a function" error rather than a type error.
- Recommendation: Document the `displayName()` naming decision explicitly in SPEC.md and in API-facing documentation. When future builder methods could collide with standard JavaScript property or method names, use a disambiguating prefix and document the rationale in the same commit.
- Links: [packages/sdk/src/builders.ts](../packages/sdk/src/builders.ts), [docs/SPEC.md](./SPEC.md)

### Keep npm build output separate from source-first exports

- Date: 2026-04-03
- Context: Sprint 13, Item 41 (release packaging for npm consumers).
- What happened: The packaging slice used `.js`-extension imports, per-package `tsconfig.build.json` files, `dist/` output, and dual exports so npm consumers get built JavaScript while Bun, Deno, and JSR keep resolving source files directly.
- Why it matters: This split lets the repository support mainstream npm publishing without giving up source-first development ergonomics or JSR publishing.
- Recommendation: When adding or changing release packaging, keep three surfaces aligned in the same change: source imports, build output (`dist/`), and source-first manifests (`jsr.json` / `package.json` source conditions). Make the CLI entry’s Node shebang explicit at the same time.
- Links: [packages/sdk/package.json](../packages/sdk/package.json), [packages/cli/package.json](../packages/cli/package.json), [packages/shared/package.json](../packages/shared/package.json), [packages/*/tsconfig.build.json](../packages)

### Bun runtime accepts mismatched constructor argument types that strict tsc rejects

- Date: 2026-04-03
- Context: Sprint 14, Item 47 (run script reference support).
- What happened: `runScript()` passed a plain `string` to `new WorkflowValidationError(...)` which expects `readonly string[]`. Bun's runtime TypeScript execution accepted this silently, so all local tests passed. CI's `tsc` step (TypeScript 5.9.3 strict mode) caught the type mismatch and failed.
- Why it matters: Bun transpiles TypeScript to JavaScript without full type checking, so constructor argument mismatches and other type-level errors are invisible at runtime. The CI pipeline runs `tsc` with strict settings, creating a gap between local development and CI.
- Recommendation: Run `npx tsc -p tsconfig.build.json` locally before pushing changes that create new error-throwing call sites or modify constructor signatures. Consider adding a pre-push hook for `tsc` to catch these mismatches before they reach CI.
- Links: [packages/sdk/src/builders.ts](../packages/sdk/src/builders.ts), [packages/shared/src/errors.ts](../packages/shared/src/errors.ts)

### npm arborist crashes on bun's node_modules layout

- Date: 2026-04-03
- Context: Sprint 15, Item 49 (fix npm install/ci failure caused by workspace: protocol).
- What happened: Running `npm install` in a repository where `node_modules` was previously populated by `bun install` caused npm's arborist to crash with `Cannot read properties of null (reading 'matches')`. The root cause is bun's `.bun/` directory layout inside `node_modules`, which npm's dependency tree walker does not expect.
- Why it matters: The project's primary development environment uses Bun, but npm compatibility is a stated goal. Switching between package managers without a clean slate creates silent failures that are difficult to diagnose.
- Recommendation: Always run `rm -rf node_modules packages/*/node_modules` before switching from `bun install` to `npm install` or vice versa. Do not assume that one package manager can operate on another's `node_modules` tree.
- Links: [package.json](../package.json), [package-lock.json](../package-lock.json)

### New-package root config checklist

- Date: 2026-04-04
- Context: Sprint 16, Item 55 (opt-in YAML import package) added the fourth package to the monorepo.
- What happened: Adding `@ghawb/yaml-import` required coordinated updates across five root configuration files. Missing any single update causes silent test discovery failures or module resolution errors that are difficult to diagnose.
- Why it matters: The five-file update ceremony is easy to forget, and each missing update produces a different class of failure (tests not found, imports not resolved, build:check not covering the package, Deno imports missing, JSR workspace incomplete).
- Recommendation: When adding a new package to the monorepo, update all five root files in the same commit: (1) `vitest.config.ts` — add test include glob and resolve alias, (2) `tsconfig.json` — add paths alias, (3) `deno.json` — add import mapping, (4) `jsr.json` — add to workspace members, (5) `package.json` — add to `build:check` script.
- Links: [vitest.config.ts](../vitest.config.ts), [tsconfig.json](../tsconfig.json), [deno.json](../deno.json), [jsr.json](../jsr.json), [package.json](../package.json)

### Parameterize test helpers to avoid latent basename collisions

- Date: 2026-04-04
- Context: Sprint 16, Item 55 (opt-in YAML import package) test suite.
- What happened: A `createTempYaml()` test helper always wrote to a fixed filename (`shared-build.yml`). Three tests expected different basenames in the returned `WorkflowRef` and failed because the helper's embedded filename did not match the test's intent.
- Why it matters: Test helpers with hardcoded embedded values create latent bugs when tests are written independently. The failure message ("expected list-triggers.yml, got shared-build.yml") is confusing because it does not point at the helper as the root cause.
- Recommendation: Design test helpers to accept explicit parameters for any value they embed in their output (filenames, paths, identifiers). When a helper creates files, require the caller to specify the filename rather than defaulting to a constant.
- Links: [packages/yaml-import/src/index.test.ts](../packages/yaml-import/src/index.test.ts)

### New workspace packages require manual updates to multiple root configs

- Date: 2025-07-25
- Context: Sprint 22, Item 75b (migrate nodeCi to @ghawb/job-helpers).
- What happened: Adding a new workspace package required touching six root-level config files beyond the package itself: `tsconfig.json` (paths), `deno.json` (imports), `vitest.config.ts` (alias + test include), `jsr.json` (workspace array), `package.json` (build:check script), and `bun.lock`/`deno.lock`. The root `package.json` workspace glob (`"packages/*"`) auto-discovers for npm/bun, but all other configs need explicit entries.
- Why it matters: Forgetting any one of these configs causes subtle failures: missing path aliases break imports, missing vitest includes silently skip tests, missing jsr workspace entries break JSR publishing. A checklist or automation would prevent gaps.
- Recommendation: When adding a new workspace package, follow a checklist: (1) package scaffolding (package.json, jsr.json, deno.json, tsconfig.build.json, src/index.ts), (2) root tsconfig.json paths, (3) root deno.json imports, (4) vitest.config.ts alias + test include, (5) jsr.json workspace, (6) package.json build:check, (7) bun install + deno cache.
- Links: [ADR 0006](adrs/0006-migrate-node-ci-helper-to-opt-in-package.md), [packages/job-helpers](../packages/job-helpers/)
