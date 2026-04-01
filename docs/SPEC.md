# Specification

## Purpose

`ghawb` is a TypeScript SDK and CLI for building and emitting GitHub Actions workflow files.

The project is intended to make workflow construction type-safe, robust, and idempotent while covering the full GitHub Actions workflow syntax over time.

## Product Shape

- A TypeScript SDK for defining workflows programmatically
- A first-class GitHub Actions workflow domain AST owned by `ghawb`
- A shared internal model and deterministic intermediate representation that preserve correctness guarantees across authoring and rendering
- A CLI that renders authored workflow modules into workflow files

## Implemented Baseline

- The repository is organized as a workspace with `@ghawb/sdk`, `@ghawb/shared`, and `@ghawb/cli`.
- Root developer commands provide linting, formatting, type-checking, and test entrypoints across Bun, Node, and Deno.
- `@ghawb/shared` owns branded workflow and job identifiers plus validating factories.
- `@ghawb/sdk` currently supports a minimal builder-centered workflow model with:
  - workflow name and explicit workflow identifier
  - `push` and `pull_request` triggers with optional `branches`, `branches-ignore`, `paths`, and `paths-ignore` filters, with mutual exclusion enforced between positive and negative variants per trigger
  - `push` triggers with optional `tags` and `tags-ignore` filters, validated to reject these fields on `pull_request` triggers
  - `pull_request` triggers with optional `types` filter validated against the fixed allowlist of GitHub Actions pull request activity types (`assigned`, `unassigned`, `labeled`, `unlabeled`, `opened`, `edited`, `closed`, `reopened`, `synchronize`, `converted_to_draft`, `ready_for_review`, `locked`, `unlocked`, `review_requested`, `review_request_removed`, `auto_merge_enabled`, `auto_merge_disabled`); `types` is rejected on all triggers other than `pull_request`
  - `workflow_dispatch` as a manual top-level trigger with optional `inputs` supporting per-input `description` (string), `required` (boolean), `default` (string), `type` (one of `string`, `boolean`, `choice`, `number`, `environment`), and `options` (non-empty string array, required when `type` is `choice` and rejected on other types)
  - `schedule` as a top-level trigger with one or more explicit cron entries and no additional supported fields such as `timezone`
  - top-level and job-level `permissions` maps covering the current GitHub Actions permission keys `actions`, `artifact-metadata`, `attestations`, `checks`, `contents`, `deployments`, `discussions`, `id-token`, `issues`, `models`, `packages`, `pages`, `pull-requests`, `security-events`, and `statuses`
  - job-level execution metadata covering `timeout-minutes`, `defaults.run.shell`, `defaults.run.working-directory`, and run-step `shell` plus `working-directory`
  - workflow-level and job-level `concurrency` objects with required `group` and optional `cancel-in-progress`
  - workflow-level and job-level `env` maps using `Readonly<Record<string, string>>` for shared environment variables, validated to reject blank keys and omitted when empty
  - job-level `if` conditional (non-blank string expression) for conditional job execution
  - job-level `continue-on-error` (boolean) for allowing downstream jobs to proceed on failure
  - job-level `needs` dependencies referencing one or more previously declared job identifiers
  - job-level `strategy.matrix` objects whose axis keys map to non-empty string arrays, with optional `include` entries (arbitrary string key-value records), `exclude` entries (records referencing only declared axis keys), `failFast` (boolean), and `maxParallel` (positive integer)
  - jobs with `runs-on` in string or string-array form
  - steps using either `uses` or `run`
  - step metadata fields `name`, `env`, `with`, `if`, `continue-on-error` (boolean), and `timeout-minutes` (positive integer)
  - optional step `id` field with identifier validation, uniqueness enforcement within a job, and trimming during finalization
  - job-level `outputs` maps (`Readonly<Record<string, string>>`) with blank key/value rejection and `steps.<id>` referential validation against declared step IDs in the same job; non-step expression forms are accepted without referential validation
- Validation occurs at `build()` time and fails through explicit exceptions for invalid definitions.
- Identifier factories reject surrounding whitespace instead of silently normalizing values.
- Duplicate trigger definitions are rejected during `build()`.
- `workflow_dispatch` rejects unsupported trigger fields such as branch or path filters instead of silently coercing them.
- `workflow_dispatch` supports optional `inputs` with per-input metadata: `description` (string), `required` (boolean), `default` (string), `type` (validated against the allowlist `string`, `boolean`, `choice`, `number`, `environment`), and `options` (non-empty string array). Blank input names fail at build time. `options` is required when `type` is `choice` and rejected on all other types or when `type` is omitted. Inputs render in declared order within the trigger. Unsupported input field shapes still fail explicitly.
- `schedule` rejects unsupported trigger fields such as branch or path filters, requires one or more non-blank cron entries, and treats malformed cron strings as explicit validation errors.
- `permissions` currently support only explicit object maps at the workflow and job levels, reject unknown permission keys and shorthand forms such as `read-all` or `write-all`, and validate allowed access values per supported key before rendering.
- execution metadata currently supports job `timeout-minutes`, job `defaults.run.shell`, job `defaults.run.working-directory`, run-step `shell` plus `working-directory`, step-level `continue-on-error` (boolean) plus `timeout-minutes` (positive integer), job-level `if` (non-blank string expression) and job-level `continue-on-error` (boolean); blank values and unsupported adjacent shapes still fail explicitly rather than being dropped or coerced.
- concurrency currently supports only workflow-level and job-level objects with non-blank `group` and optional boolean `cancel-in-progress`; unsupported adjacent concurrency fields still fail explicitly rather than being ignored.
- job `needs` preserves declared dependency order, rejects unknown dependency identifiers, rejects duplicate dependency entries, and currently requires each dependency to reference a previously declared job identifier.
- job `strategy` supports `failFast` (boolean), `maxParallel` (positive integer), and `matrix` with direct axis-to-string-array mappings plus optional `include` and `exclude` entries; `include` entries accept arbitrary string keys including keys not declared as matrix axes, `exclude` entries must reference only declared axis keys, empty `include`/`exclude` arrays are omitted from rendering, and malformed entries fail explicitly rather than being dropped or coerced.
- Built workflow objects are deeply frozen, including nested trigger filters, job arrays, step arrays, and step maps such as `env` and `with`.
- Bun-run Vitest remains the primary repository test authority, Node-run Vitest remains the compatibility confirmation path, and a shared cross-runtime render conformance suite exercises representative supported workflow fixtures across Bun, Node, and Deno.
- Deno remains intentionally scoped to compatibility-oriented coverage outside the shared render conformance fixtures rather than the full repository test surface.
- The SDK exposes a deterministic renderer that:
  - converts supported workflow definitions into a JSON-like intermediate payload
  - injects an emitter function instead of binding the core to a YAML library
  - fails explicitly before emission when unsupported fields are present at runtime
- The CLI currently:
  - exposes `ghawb render --input <workflow.ts> --output <workflow.yml>`
  - exposes `ghawb render-batch --input <workflow.ts> --output <workflow.yml> ...` for explicit multi-workflow rendering without repository scanning
  - loads a directly specified TypeScript module whose default export is a built workflow definition
  - renders YAML through one concrete adapter backed by the `yaml` Node module
  - writes deterministic workflow output files and exits non-zero on failure, with batch mode surfacing partial failures after attempting every declared mapping
- The repository self-hosts committed workflow definitions from explicit `workflows/*.ts` modules into matching `.github/workflows/*.yml` outputs through the root `generate:workflows` script.
- The supported committed-workflow authoring path is explicit and repository-local: workflow source modules live directly under `workflows/`, generated outputs live under `.github/workflows/` with matching basenames, and the project does not treat out-of-repository workflow source files or undocumented workflow discovery outside that path as the supported contract.
- The dedicated workflow guardrail command is `bun run verify:workflows`, which validates the supported repository-local workflow-source convention and detects generated-workflow drift for every committed workflow output.
- The contributor-facing local verification path is `bun run verify:pre-push`, which checks for a clean worktree, runs `bun run verify:workflows`, runs the root Bun checks, and confirms the Node compatibility suite before push.

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
- Target 100% code coverage.
- Ensure generated workflow output is deterministic and idempotent.
- Favor explicit validation and failure modes over silent coercion.

## Functional Goals

- Emit valid GitHub Actions workflow files.
- Support the full GitHub Actions workflow syntax over time.
- Be capable of self-hosting the project's own CI/CD definitions after the CLI is complete.

## Non-Goals For The Initial Stage

- Locking a final public API surface before implementation begins
- Documenting every GitHub Actions syntax detail up front
- Defining packaging, versioning, or release automation in detail before the core model exists

## Planned Core Responsibilities

### SDK

- Model workflows, jobs, steps, triggers, permissions, strategies, and reusable fragments
- Enforce as many construction constraints as practical at compile time
- Provide a developer-friendly builder API for composing workflow definitions
- Own the GitHub Actions workflow AST and validation logic independent from YAML-specific concerns

### CLI

- Provide a thin execution layer on top of the SDK and renderer
- Render workflow definitions authored with the SDK into `.github/workflows/*.yml` outputs
- Load explicitly targeted TypeScript modules rather than scanning project state implicitly
- Fail clearly when definitions are invalid, incomplete, or not exported as the module default

### Renderer / Internal Model

- Convert the workflow AST into a stable, deterministic intermediate representation
- Use an injected YAML emitter to convert the intermediate representation into YAML output
- Keep output ordering deterministic
- Produce identical output across repeated renders when the same emitter and configuration are used

## YAML Integration

- YAML input is out of scope.
- YAML emission is supported through an injected external emitter.
- The core model must not require a specific YAML library.
- The internal AST is a GitHub Actions semantic model, not a generic YAML AST.
- Deterministic output is required for a given emitter and configuration.
- The current renderer boundary is `createWorkflowRenderPayload()` plus `renderWorkflow(workflow, emitter)`.
- The intermediate payload uses deterministic structural ordering: top-level `name`, `on`, `permissions`, `env`, `concurrency`, and `jobs`; canonical trigger key order (`push`, `pull_request`, `workflow_dispatch`, `schedule`); canonical trigger filter key order (`branches`, `branches-ignore`, `paths`, `paths-ignore`, `tags`, `tags-ignore`, `types`); `workflow_dispatch` input field order `description`, `required`, `default`, `type`, `options` with inputs rendered in declared order; canonical permission key order (`actions`, `artifact-metadata`, `attestations`, `checks`, `contents`, `deployments`, `discussions`, `id-token`, `issues`, `models`, `packages`, `pages`, `pull-requests`, `security-events`, `statuses`); top-level concurrency field order `group`, `cancel-in-progress`; declared job order; job-local field order `if`, `needs`, `continue-on-error`, `permissions`, `timeout-minutes`, `defaults`, `concurrency`, `env`, `strategy`, `runs-on`, `outputs`, `steps`; declared `needs` order within each job; `defaults.run` field order `shell`, `working-directory`; job concurrency field order `group`, `cancel-in-progress`; strategy field order `fail-fast`, `max-parallel`, `matrix`; matrix field order: declared axes in declaration order, then `include`, then `exclude`; and declared step order, with step-local field order `name`, `id`, `if`, `env`, `shell`, `with`, `working-directory`, `continue-on-error`, `timeout-minutes`, then `run` or `uses`.

## Open Questions

- TBD: how far typestate constraints should go before usability costs outweigh safety gains
