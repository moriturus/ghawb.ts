# Specification

## Purpose

`ghawb` is a TypeScript SDK and CLI for building and emitting GitHub Actions workflow files and composite action metadata files.

The project is intended to make workflow construction type-safe, robust, and idempotent while covering the full GitHub Actions workflow syntax over time.

## Product Shape

- A TypeScript SDK for defining workflows programmatically
- A first-class GitHub Actions workflow domain AST owned by `ghawb`
- A shared internal model and deterministic intermediate representation that preserve correctness guarantees across authoring and rendering
- Opt-in packages for adjacent GitHub Actions authoring surfaces that should stay outside the core workflow SDK boundary
- A CLI that renders authored workflow or composite action modules into YAML files

## Implemented Baseline

- The repository is organized as a workspace with `@ghawb/sdk`, `@ghawb/shared`, `@ghawb/job-helpers`, `@ghawb/composite-actions`, `@ghawb/typed-actions`, `@ghawb/cli`, and `@ghawb/yaml-import`.
- Root developer commands provide linting, formatting, type-checking, and test entrypoints across Bun, Node, and Deno.
- `@ghawb/shared` owns branded workflow and job identifiers plus validating factories, using the shared identifier format `^[a-zA-Z_][a-zA-Z0-9_-]*$`.
- `@ghawb/sdk` currently supports a minimal builder-centered workflow model with:
  - workflow name and explicit workflow identifier
  - `push` and `pull_request` triggers with optional `branches`, `branches-ignore`, `paths`, and `paths-ignore` filters, with mutual exclusion enforced between positive and negative variants per trigger
  - `push` triggers with optional `tags` and `tags-ignore` filters, validated to reject these fields on `pull_request` triggers
  - `pull_request` triggers with optional `types` filter validated against the fixed allowlist of GitHub Actions pull request activity types (`assigned`, `unassigned`, `labeled`, `unlabeled`, `opened`, `edited`, `closed`, `reopened`, `synchronize`, `converted_to_draft`, `ready_for_review`, `locked`, `unlocked`, `review_requested`, `review_request_removed`, `auto_merge_enabled`, `auto_merge_disabled`); `types` is rejected on all triggers other than `pull_request`
  - `workflow_dispatch` as a manual top-level trigger with optional `inputs` whose names must match `^[a-zA-Z_][a-zA-Z0-9_-]*$`, supporting per-input `description` (string), `required` (boolean), `default` (string), `type` (one of `string`, `boolean`, `choice`, `number`, `environment`), and `options` (non-empty string array, required when `type` is `choice` and rejected on other types)
  - `workflow_call` as a reusable top-level trigger with optional `inputs`, `outputs`, and `secrets`; input, output, and secret names must match `^[a-zA-Z_][a-zA-Z0-9_-]*$`; inputs support `description`, `required`, `default`, and `type`; outputs support `description` and required `value`; secrets support `description` and `required`
  - `schedule` as a top-level trigger with one or more explicit cron entries and no additional supported fields such as `timezone`
  - `workflow_run` as a top-level trigger enabling "deploy after CI passes" patterns, requiring a non-empty `workflows` array of non-blank workflow names, with optional `types` validated against the allowlist `completed`, `requested`, `in_progress`, optional `branches` / `branches-ignore` (mutually exclusive), and rejection of unsupported fields `paths`, `paths-ignore`, `tags`, `tags-ignore`
  - top-level and job-level `permissions` using either explicit maps covering the current GitHub Actions permission keys `actions`, `artifact-metadata`, `attestations`, `checks`, `contents`, `deployments`, `discussions`, `id-token`, `issues`, `models`, `packages`, `pages`, `pull-requests`, `security-events`, and `statuses`, or the shorthand forms `read-all` and `write-all`
  - workflow-level and job-level execution metadata covering `defaults.run.shell`, `defaults.run.working-directory`, job `timeout-minutes`, and run-step `shell` plus `working-directory`
  - workflow-level and job-level `concurrency` objects with required `group` and optional `cancel-in-progress`
  - workflow-level and job-level `env` maps using `Readonly<Record<string, string>>` for shared environment variables, validated to reject blank keys and omitted when empty
  - job-level `if` conditional (non-blank string expression) for conditional job execution
  - job-level `continue-on-error` (boolean) for allowing downstream jobs to proceed on failure
  - job-level `needs` dependencies referencing one or more previously declared job identifiers
  - job-level `strategy.matrix` objects whose axis keys must match `^[a-zA-Z_][a-zA-Z0-9_-]*$` and map to non-empty string arrays, with optional `include` entries (arbitrary string key-value records), `exclude` entries (records referencing only declared axis keys), `failFast` (boolean), and `maxParallel` (positive integer)
  - discriminated job variants: step-based jobs with `runs-on` in string, string-array, or object form (`{ group?: string; labels?: string[] }`) plus inline `steps`, and reusable-workflow jobs with job-level `uses` typed as `WorkflowRef`, optional `with`, and `secrets` as either an explicit map or the shorthand `inherit`
  - reusable-workflow object injection: `usesWorkflow()` accepts a `ReusableWorkflowSource` union of `WorkflowRef | WorkflowBuilder | WorkflowDefinition`; when a `WorkflowBuilder` or `WorkflowDefinition` is passed, the SDK derives the local ref as `./.github/workflows/${id}.yml` and validates at the caller's `build()` time that the target declares a `workflow_call` trigger; definition order is unconstrained — `onWorkflowCall()` may be called after `usesWorkflow()`
  - caller-side reusable workflow outputs support: `usesWorkflow()` accepts optional output names for external `WorkflowRef` strings and automatically infers output names from injected reusable workflow objects that declare `workflow_call.outputs`; the built reusable-workflow job retains those output names for SDK-side access and validation while the rendered YAML remains the standard GitHub Actions reusable-workflow job shape without a caller-side `outputs` field
  - typed runner labels via a `RunnerLabel` const object providing known GitHub-hosted runner constants (e.g., `RunnerLabel.UbuntuLatest`, `RunnerLabel.MacOS15`, `RunnerLabel.WindowsLatest`) with IDE autocomplete support; custom or self-hosted string labels remain accepted through `string` fallback
  - typed action references via `ActionRef` template-literal type covering three forms: external (`owner/repo@ref`), local (`./path`), and Docker (`docker://image`); factory function `actionRef()` validates and returns typed values; `build()` validates all step `uses` values at runtime regardless of entry path
  - typed action core support in `@ghawb/sdk` via `TypedActionStep` and `typedActionStep()` so `job.uses(...)` can accept typed `uses` objects without coupling the core builder to concrete action wrapper sets
  - opt-in composite action authoring via `@ghawb/composite-actions`, which keeps actions-level definition state out of the workflow-focused `@ghawb/sdk` package while providing a builder-centered first slice for `name`, optional `description`, optional `inputs`, optional `outputs`, and ordered composite `runs.steps`
  - opt-in typed action wrappers for common first-party actions via `@ghawb/typed-actions`; the package now covers checkout, cache, setup-node, setup-python, setup-go, setup-java, setup-dotnet, github-script, configure-pages, upload-pages-artifact, deploy-pages, labeler, and upload/download-artifact with pinned major refs and typed `with` surfaces; each helper returns a typed action-step object with autocompleted input names and string-serialized `with` values for use with `job.uses(...)`
- a generic `JobBuilder.apply(helper)` hook for opt-in job helpers, plus narrow additive Node CI/bootstrap helpers in `@ghawb/job-helpers`; the preferred builder-style path is `job.apply(nodeCi({ nodeVersion: "24" }))` for the full CI path or `job.apply(nodeBootstrap({ nodeVersion: "24" }))` for the bootstrap prefix, while legacy `nodeCi(job, options)` remains supported for migration; `nodeCi` appends explicit `checkout`, `setup-node`, `install`, and `test` steps to a job builder for the common single-job Node CI path and accepts `NodeCiOptions` with `nodeVersion` (required), `install?`, `test?`, `cache?`, `cacheDependencyPath?`; `nodeBootstrap` appends explicit `checkout`, `setup-node`, and `install` steps and accepts `NodeBootstrapOptions` with `nodeVersion` (required), `install?`, `cache?`, `cacheDependencyPath?`, and `registryUrl?`
  - typed reusable-workflow references via `WorkflowRef` template-literal type covering two forms: external (`owner/repo/.github/workflows/file@ref`) and local (`./.github/workflows/file`); factory function `workflowRef()` validates and returns typed values; `build()` validates all reusable-workflow job `uses` values at runtime regardless of entry path
  - steps using either `uses` (typed as `ActionRef`) or `run`
  - step metadata fields `name`, `env`, `with`, `if`, `continue-on-error` (boolean), and `timeout-minutes` (positive integer); the metadata parameter of `uses()`, `run()`, and `runScript()` also accepts a plain `string` as shorthand for `{ name: value }`, e.g., `job.uses("actions/checkout@v4", "Checkout")` is equivalent to `job.uses("actions/checkout@v4", { name: "Checkout" })`; `uses()` also accepts typed action-step objects as its first argument, and when one is used the `with` inputs must come from the typed action object rather than `metadata.with`
  - optional step `id` field whose value must match `^[a-zA-Z_][a-zA-Z0-9_-]*$`, with uniqueness enforcement within a job and explicit rejection of surrounding whitespace instead of trimming
  - run-step script references via `runScript()` supporting local file paths (relative or absolute), optional shell-prefix execution (`run: "{shell} {path}"`), and optional expand mode that reads the referenced file body into the emitted `run` value at construction time; script references are stored on the built step as `scriptReference` metadata for traceability but are not emitted into the rendered workflow payload; `build()` rejects double shell specification when both the script-reference config and step metadata define `shell`; blank script-reference paths and blank script-reference shells are rejected at build time; Windows-specific quoting is not supported in this slice
  - job-level `outputs` maps (`Readonly<Record<string, string>>`) with blank key/value rejection and `steps.<id>` referential validation against declared step IDs in the same job; non-step expression forms are accepted without referential validation
  - expression helpers: an additive helper API for constructing GitHub Actions expression strings without raw `${{ }}` interpolation; the `expr(content)` wrapper produces syntactically valid `${{ content }}` strings and rejects empty or blank content at construction time; context reference helpers `github(property)`, `env(name)`, `secrets(name)`, `matrix(key)`, `inputs(name)`, `steps(id).outputs(name)`, and `needs(jobId).outputs(name)` produce context path strings (e.g., `github.ref`, `env.CI`, `steps.build.outputs.result`, `needs.deploy.outputs.artifact_url`); status-check function helpers `success()`, `always()`, `cancelled()`, and `failure()` produce function call strings (e.g., `success()`); literal and operator helpers `literal(value)`, `eq(left, right)`, `ne(left, right)`, `gt(left, right)`, `gte(left, right)`, `lt(left, right)`, `lte(left, right)`, `and(...operands)`, `or(...operands)`, and `not(value)` produce comparison and logical expressions without requiring raw operator strings; all existing raw `string` entry points remain backward compatible; semantic expression evaluation (operator precedence, type coercion, runtime context availability) is an explicit non-goal for this helper family
- Validation occurs at `build()` time and fails through explicit exceptions for invalid definitions.
- The SDK exposes `getRenderConfig<T>()`, which returns an optional render-time config object injected by the CLI for the module currently being rendered; when no CLI config is provided, the function returns `undefined`.
- Validation error messages follow the convention `[scope] [field] [constraint]. Expected: [format/values]`. The `[scope] [field] [constraint]` prefix is preserved for programmatic compatibility. Format, type, value-constraint, and unsupported-feature messages include expected values or alternatives. Blank/empty and boolean messages are enriched only when added guidance is non-trivial.
- Identifier factories reject surrounding whitespace instead of silently normalizing values, and require the shared format `^[a-zA-Z_][a-zA-Z0-9_-]*$`.
- Duplicate trigger definitions are rejected during `build()`.
- `workflow_dispatch` rejects unsupported trigger fields such as branch or path filters instead of silently coercing them.
- `workflow_dispatch` supports optional `inputs` with per-input metadata: `description` (string), `required` (boolean), `default` (string), `type` (validated against the allowlist `string`, `boolean`, `choice`, `number`, `environment`), and `options` (non-empty string array). Input names must match `^[a-zA-Z_][a-zA-Z0-9_-]*$`; blank, digit-leading, whitespace-containing, unicode, or otherwise malformed names fail at build time. `options` is required when `type` is `choice` and rejected on all other types or when `type` is omitted. Inputs render in declared order within the trigger. Unsupported input field shapes still fail explicitly.
- `workflow_call` rejects unsupported trigger fields such as branch, path, or `types` filters. `workflow_call.inputs` support `description`, `required`, `default`, and `type`, reuse the `workflow_dispatch` type allowlist, and reject `choice` plus `options`. `workflow_call.outputs` require non-blank `value` strings and support optional `description`. `workflow_call.secrets` support optional `description` and boolean `required`. Input, output, and secret names must match `^[a-zA-Z_][a-zA-Z0-9_-]*$`.
- `schedule` rejects unsupported trigger fields such as branch or path filters, requires one or more non-blank cron entries, and treats malformed cron strings as explicit validation errors.
- `workflow_run` rejects unsupported trigger fields `paths`, `paths-ignore`, `tags`, and `tags-ignore`. Requires a non-empty `workflows` array of non-blank workflow names. Optional `types` are validated against the allowlist `completed`, `requested`, `in_progress`. Optional `branches` / `branches-ignore` are mutually exclusive, non-empty, and reject blank values.
- `branch_protection_rule` is supported as a types-only event through `.onEvent("branch_protection_rule", { types? })`, validates the activity-type allowlist `created`, `edited`, `deleted`, and otherwise follows the simple-event trigger pattern.
- `permissions` currently support explicit object maps and the shorthand forms `read-all` / `write-all` at both workflow and job levels, reject unknown permission keys, reject mixed shorthand-plus-map shapes on the same scope, and validate allowed access values per supported key before rendering.
- execution metadata currently supports workflow-level and job-level `defaults.run.shell`, workflow-level and job-level `defaults.run.working-directory`, job `timeout-minutes`, run-step `shell` plus `working-directory`, step-level `continue-on-error` (boolean) plus `timeout-minutes` (positive integer), job-level `if` (non-blank string expression) and job-level `continue-on-error` (boolean); blank values and unsupported adjacent shapes still fail explicitly rather than being dropped or coerced.
- concurrency currently supports only workflow-level and job-level objects with non-blank `group` and optional boolean `cancel-in-progress`; unsupported adjacent concurrency fields still fail explicitly rather than being ignored.
- job `needs` preserves declared dependency order, rejects unknown dependency identifiers, rejects duplicate dependency entries, and currently requires each dependency to reference a previously declared job identifier.
- job `strategy` supports `failFast` (boolean), `maxParallel` (positive integer), and `matrix` with direct axis-to-string-array mappings whose axis names must match `^[a-zA-Z_][a-zA-Z0-9_-]*$`, plus optional `include` and `exclude` entries; `include` entries accept arbitrary string keys including keys not declared as matrix axes, `exclude` entries must reference only declared axis keys, empty `include`/`exclude` arrays are omitted from rendering, and malformed entries fail explicitly rather than being dropped or coerced.
- reusable-workflow jobs use a discriminated union path distinct from step-based jobs, require job-level `uses` typed as `WorkflowRef` (validated against the two documented reference forms), accept optional `with` bindings and `secrets` as either an explicit string map or `inherit`, and reject mixing reusable-workflow `uses` with step-based `runs-on` or inline `steps`. `usesWorkflow()` also accepts `WorkflowBuilder` and `WorkflowDefinition` objects via the `ReusableWorkflowSource` union type; object injection derives `./.github/workflows/${id}.yml` and validates the target's `workflow_call` trigger at the caller's `build()` time for definition-order independence.
- step-based jobs support optional `container` and `services` fields. A `container` config requires a non-blank `image` string and supports optional `credentials` (non-blank `username` and `password`), `env` (follows standard env validation), `ports` (numeric ports must be positive integers, string ports must be non-blank), `volumes` (non-blank strings), and `options` (non-blank string). `services` is a map of identifier-format keys to container configs following the same validation. Reusable-workflow jobs reject `container` and `services` at build time.
- Built workflow objects are deeply frozen, including nested trigger filters, job arrays, step arrays, and step maps such as `env` and `with`.
- Bun-run Vitest remains the primary repository test authority, Node-run Vitest remains the compatibility confirmation path, and a shared cross-runtime render conformance suite exercises representative supported workflow fixtures across Bun, Node, and Deno.
- Deno remains intentionally scoped to compatibility-oriented coverage rather than the full repository test surface; the Deno suite combines the shared render conformance fixtures with representative public-entrypoint and authoring-flow checks for supported packages, including `@ghawb/yaml-import`.
- The SDK exposes a deterministic renderer that:
  - converts supported workflow definitions into a JSON-like intermediate payload
  - injects an emitter function instead of binding the core to a YAML library
  - fails explicitly before emission when unsupported fields are present at runtime
- The CLI currently:
  - exposes `ghawb render [--bulk <render-plan.{json,yaml,yml,toml}>] [--input <module.ts> [--config <data.{json,yaml,yml,toml}>] [--output <output.yml>]] ...` with short aliases `-i` and `-o`; when `--output` is omitted, inference is limited to the supported repository-local `workflows/<name>.ts` convention and derives `.github/workflows/<name>.yml`; when multiple explicit `--input` / `--output` pairs are provided, the command renders each pair in order without repository scanning
  - exposes `ghawb lint <file.yml> [<file.yml> ...]` for verifying generated workflow YAML files with `actionlint`; when `actionlint` is not found on `PATH`, the CLI exits non-zero with a clear message naming the missing tool and linking to installation instructions
  - loads a directly specified TypeScript module whose default export is a built workflow or composite action definition
  - supports per-target render-time config injection through `--config`, which is bound to the immediately preceding `--input`; the CLI parses JSON, YAML, or a flat top-level TOML object/array subset and exposes the resulting value through `@ghawb/sdk`'s `getRenderConfig()`
  - renders YAML through one concrete adapter backed by the `yaml` Node module
  - writes deterministic workflow or composite-action output files and exits non-zero on failure, with multi-target render surfacing partial failures after attempting every declared mapping
- The CLI render-plan manifest contract is intentionally CLI-owned and keeps parsing outside the SDK:
  - `ghawb render` accepts an explicit render-plan manifest file through `--bulk <file>` rather than implicit repository discovery
  - `--config` is bound to the immediately preceding `--input` for per-target render-time config injection, while `--bulk` remains the manifest entrypoint
  - supported manifest formats are JSON, YAML, and TOML
  - a manifest declares one or more render targets using the same `input` / `output` shape as the explicit CLI path, plus optional per-target `config`
  - configuration values from the manifest are overridden by later CLI flags on the same invocation
  - the supported manifest shape is a top-level object with a non-empty `targets` array of `{ input, output, config? }` objects and an optional boolean `lint`
  - artifact classification remains the responsibility of `render`'s safe export auto-detection; the manifest describes targets and defaults, not a separate workflow-vs-composite-action command split
  - unsupported shapes, ambiguous target declarations, and missing required target fields fail explicitly at the CLI boundary
- The repository self-hosts committed workflow definitions from explicit `workflows/*.ts` modules into matching `.github/workflows/*.yml` outputs through the root `generate:workflows` script.
- The supported committed-workflow authoring path is explicit and repository-local: workflow source modules live directly under `workflows/`, generated outputs live under `.github/workflows/` with matching basenames, and the project does not treat out-of-repository workflow source files or undocumented workflow discovery outside that path as the supported contract.
- The dedicated workflow guardrail command is `bun run verify:workflows`, which validates the supported repository-local workflow-source convention and detects generated-workflow drift for every committed workflow output.
- The dedicated docs guardrail command is `bun run verify:docs`, which checks the maintained README / Cookbook / API Reference / SPEC contract for Node 24 defaults, canonical render guidance, package-boundary guidance, and preferred helper usage patterns.
- The contributor-facing local verification path is `bun run verify:pre-push`, which checks for a clean worktree, runs `bun run verify:workflows`, runs the root Bun checks (including `bun run verify:docs`), runs `bun run coverage`, and confirms the Node compatibility suite before push.

## Design Constraints

- Prefer builder-style authoring APIs.
- Use typestate techniques where they improve compile-time correctness for workflow construction.
- Use branded types where they help distinguish domain-specific identifiers and validated values.
- Keep the implementation 100% Pure TypeScript.
- Do not depend on non-Node modules.
- Implement workflow AST construction with TypeScript language features and Node-module-based dependencies only.
- Keep the core AST, builders, and validation layers independent from any concrete YAML library.
- Use Bun as the primary development environment.
- Preserve compatibility targets for Node and Deno.
- Consider compatibility with npm, yarn, and pnpm in developer workflows and package distribution.

## Quality Requirements

- Follow test-driven development as the default implementation approach.
- Target 100% SDK line coverage. The "100% coverage" claim refers specifically to line, statement, and function coverage of `packages/sdk/src/` as measured by `bun run coverage` using Vitest's v8 provider. Branch coverage has a known exception: defensive branches in type-narrowed union code that are unreachable by design (e.g., exhaustive discriminant checks) are not counted as missing coverage.
- Measure `packages/sdk/src/` coverage with `bun run coverage` using Vitest's v8 provider, emit lcov output to `coverage/lcov.info`, and fail CI when configured coverage thresholds regress.
- Coverage thresholds enforced in `vitest.config.ts`: lines 100%, statements 100%, functions 100%, branches 98%. The branch threshold is set to 98% rather than 100% because a small set of low-value branches remains, including intentional defense-in-depth paths in type-narrowed union code and serializer/helper branches whose incremental value is lower than the cost of contorting tests or implementation solely for branch closure. The project still treats 100% lines, statements, and functions over `packages/sdk/src/` as the primary coverage bar.
- Ensure generated workflow output is deterministic and idempotent.
- Favor explicit validation and failure modes over silent coercion.

## Functional Goals

- Emit valid GitHub Actions workflow files.
- Support the full GitHub Actions workflow syntax over time.
- Be capable of self-hosting the project's own CI/CD definitions after the CLI is complete.

## Non-Goals For The Initial Stage

- Locking a final public API surface before implementation begins
- Documenting every GitHub Actions syntax detail up front
- Defining packaging, versioning, or release automation in detail before the core model exists (now implemented — see [Distribution](#distribution))

Composite action support currently covers only the Sprint 20 initial slice through the separate `@ghawb/composite-actions` package. The CLI auto-detects workflow versus composite-action modules behind the canonical `ghawb render` command. Advanced action metadata such as branding and pre/post hooks remains intentionally unsupported.

## Planned Core Responsibilities

### SDK

- Model workflows, jobs, steps, triggers, permissions, strategies, and reusable fragments
- Enforce as many construction constraints as practical at compile time
- Provide a developer-friendly builder API for composing workflow definitions
- Own the GitHub Actions workflow AST and validation logic independent from YAML-specific concerns

### CLI

- Provide a thin execution layer on top of the SDK and renderer
- Render workflow and composite action definitions authored with the SDK and `@ghawb/composite-actions` into `.github/workflows/*.yml` and explicit `action.yml` outputs through a single `render` command with safe export auto-detection
- Load explicitly targeted TypeScript modules rather than scanning project state implicitly
- Fail clearly when definitions are invalid, incomplete, or not exported as the module default
- Verify generated workflow files with `actionlint` through a dedicated `lint` command; exit non-zero with actionable install instructions when `actionlint` is not available on `PATH`
- `ghawb render` supports an opt-in `--lint` flag that runs the same `actionlint` verification after successful rendering and exits non-zero on missing tooling or lint failures

### Renderer / Internal Model

- Convert the workflow AST into a stable, deterministic intermediate representation
- Use an injected YAML emitter to convert the intermediate representation into YAML output
- Keep output ordering deterministic
- Produce identical output across repeated renders when the same emitter and configuration are used

## YAML Integration

- YAML input is out of scope for the core SDK (`@ghawb/sdk`).
- YAML emission is supported through an injected external emitter.
- The core model must not require a specific YAML library.
- The internal AST is a GitHub Actions semantic model, not a generic YAML AST.
- Deterministic output is required for a given emitter and configuration.
- The current renderer boundary is `createWorkflowRenderPayload()` plus `renderWorkflow(workflow, emitter)` for workflows, and `createCompositeActionRenderPayload()` plus `renderCompositeAction(action, emitter)` for composite actions.
- An opt-in `@ghawb/yaml-import` package provides reusable-workflow YAML import without adding YAML input to the core SDK. It reads a workflow YAML file from a file-system path, validates that it contains a `workflow_call` trigger, and returns a `WorkflowRef` suitable for `usesWorkflow()`. The package depends on a YAML parser internally but does not re-export it. Under Deno, the import path hardens around the parser's debug-only `process.env` probes so representative import flows do not require `--allow-env`. Invalid YAML, missing `workflow_call` triggers, and non-object YAML content produce clear `YamlImportError` diagnostics.
- The intermediate payload uses deterministic structural ordering: workflow payloads render top-level `name`, `run-name`, `on`, `permissions`, `defaults`, `env`, `concurrency`, and `jobs`; canonical trigger key order (`push`, `pull_request`, `pull_request_target`, `workflow_dispatch`, `workflow_call`, `workflow_run`, `schedule`, `branch_protection_rule`, `check_run`, `check_suite`, `create`, `delete`, `deployment`, `deployment_status`, `discussion`, `discussion_comment`, `fork`, `gollum`, `issue_comment`, `issues`, `label`, `member`, `merge_group`, `milestone`, `page_build`, `public`, `registry_package`, `release`, `repository_dispatch`, `status`, `watch`); canonical trigger filter key order (`branches`, `branches-ignore`, `paths`, `paths-ignore`, `tags`, `tags-ignore`, `types`); `workflow_dispatch` input field order `description`, `required`, `default`, `type`, `options` with inputs rendered in declared order; `workflow_call` trigger field order `inputs`, `outputs`, `secrets`, with per-input field order `description`, `required`, `default`, `type`, per-output field order `description`, `value`, and per-secret field order `description`, `required`; `workflow_run` trigger field order `workflows`, `types`, `branches`, `branches-ignore`; simple event triggers render with `types` when present or `null` for bare events; canonical permission key order (`actions`, `artifact-metadata`, `attestations`, `checks`, `contents`, `deployments`, `discussions`, `id-token`, `issues`, `models`, `packages`, `pages`, `pull-requests`, `security-events`, `statuses`) when a map form is used; top-level concurrency field order `group`, `cancel-in-progress`; declared job order; step-based job field order `name`, `if`, `needs`, `continue-on-error`, `permissions`, `timeout-minutes`, `defaults`, `concurrency`, `env`, `strategy`, `runs-on`, `environment`, `container`, `services`, `outputs`, `steps`; container field order `image`, `credentials`, `env`, `ports`, `volumes`, `options`; container credentials field order `username`, `password`; service map keys rendered in declared order with each service following the same container field order; reusable-workflow job field order `name`, `if`, `needs`, `continue-on-error`, `permissions`, `secrets`, `with`, `uses`; declared `needs` order within each job; `defaults.run` field order `shell`, `working-directory`; job concurrency field order `group`, `cancel-in-progress`; strategy field order `fail-fast`, `max-parallel`, `matrix`; matrix field order: declared axes in declaration order, then `include`, then `exclude`; declared step order, with workflow step-local field order `name`, `id`, `if`, `env`, `shell`, `with`, `working-directory`, `continue-on-error`, `timeout-minutes`, then `run` or `uses`; and composite-action payloads render top-level `name`, `description`, `inputs`, `outputs`, `runs`, with composite `runs` ordered as `using`, `steps`, action input field order `description`, `required`, `default`, action output field order `description`, `value`, and composite step field order `name`, `id`, `if`, `env`, `shell`, `working-directory`, `with`, then `run` or `uses`.

## Distribution

- The SDK is published as seven packages: `@ghawb/sdk` (core workflow builder and renderer), `@ghawb/shared` (shared types, identifiers, and errors), `@ghawb/composite-actions` (opt-in composite action authoring and rendering), `@ghawb/typed-actions` (opt-in typed wrappers for common actions), `@ghawb/job-helpers` (opt-in high-level job helpers such as `nodeCi()` and `nodeBootstrap()`), `@ghawb/cli` (YAML generation CLI), and `@ghawb/yaml-import` (opt-in reusable-workflow YAML import).
- Each package declares exports through both `package.json` (npm) and `jsr.json` (JSR) manifests. The `package.json` exports map uses `dist/` for npm consumers (`types`, `import`, `default` conditions) and `src/` for source-first runtimes (`bun`, `deno` conditions). The `jsr.json` exports continue to point to `src/` for JSR/Bun/Deno source-first publishing.
- The root `jsr.json` uses JSR workspace configuration to coordinate multi-package publishing.
- Package entry points: `@ghawb/sdk`, `@ghawb/shared`, `@ghawb/composite-actions`, `@ghawb/typed-actions`, `@ghawb/job-helpers`, and `@ghawb/yaml-import` export from `./src/index.ts` (source) and `./dist/index.js` (built). `@ghawb/cli` exports from `./src/index.ts` and `./dist/index.js` and provides a `ghawb` binary entry at `./dist/bin.js` with a `#!/usr/bin/env node` shebang.
- All packages use `"type": "module"`. Source files use `.js`-extension imports (TypeScript standard interop style) for compatibility with `tsc` emit. Bun resolves `./foo.js` to `./foo.ts` in source-first mode.
- Each package has a `tsconfig.build.json` that extends the root `tsconfig.json` and adds `declaration: true`, `noEmit: false`, and `outDir: ./dist` for npm build output. The root `tsconfig.json` retains `noEmit: true` for source-first development.
- Each package defines `prepublishOnly: tsc -p tsconfig.build.json` to ensure build artifacts are generated before publishing.
- CI verifies the build step (`tsc -p tsconfig.build.json` in each package) before tests, simulating publish-time verification on every push.
- Version `0.1.0` is the initial release, covering all Sprint 1–13 deliverables.
- Release automation uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation. The published workspace packages are currently released in lockstep versioning. The release flow is: add changesets → merge to main → release PR created automatically → merge release PR → create git tag → tag-triggered publish workflow publishes to npm, JSR, and creates a GitHub Release. See [RELEASING.md](../RELEASING.md) for the full workflow.
- Governance documents (`CHANGELOG.md`, `SECURITY.md`, `SUPPORT.md`, `RELEASING.md`) are maintained in the repository root.
- Compatibility policy: Node 24+, Bun 1.x, Deno 2.x.

## Open Questions

- TBD: how far typestate constraints should go before usability costs outweigh safety gains
