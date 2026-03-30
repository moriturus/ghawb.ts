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
  - `push` and `pull_request` triggers with optional `branches` and `paths`
  - `workflow_dispatch` as a manual top-level trigger without additional supported fields such as `inputs` in the current slice
  - `schedule` as a top-level trigger with one or more explicit cron entries and no additional supported fields such as `timezone`
  - top-level and job-level `permissions` maps covering the current GitHub Actions permission keys `actions`, `artifact-metadata`, `attestations`, `checks`, `contents`, `deployments`, `discussions`, `id-token`, `issues`, `models`, `packages`, `pages`, `pull-requests`, `security-events`, and `statuses`
  - job-level execution metadata covering `timeout-minutes`, `defaults.run.shell`, `defaults.run.working-directory`, and run-step `shell` plus `working-directory`
  - workflow-level and job-level `concurrency` objects with required `group` and optional `cancel-in-progress`
  - job-level `needs` dependencies referencing one or more previously declared job identifiers
  - job-level `strategy.matrix` objects whose axis keys map to non-empty string arrays
  - jobs with `runs-on` in string or string-array form
  - steps using either `uses` or `run`
  - step metadata fields `name`, `env`, `with`, and `if`
- Validation occurs at `build()` time and fails through explicit exceptions for invalid definitions.
- Identifier factories reject surrounding whitespace instead of silently normalizing values.
- Duplicate trigger definitions are rejected during `build()`.
- `workflow_dispatch` rejects unsupported trigger fields such as branch or path filters instead of silently coercing them.
- `workflow_dispatch` is currently limited to a bare manual trigger entry; unsupported adjacent shapes such as trigger inputs must fail explicitly rather than being coerced or silently ignored.
- `schedule` rejects unsupported trigger fields such as branch or path filters, requires one or more non-blank cron entries, and treats malformed cron strings as explicit validation errors.
- `permissions` currently support only explicit object maps at the workflow and job levels, reject unknown permission keys and shorthand forms such as `read-all` or `write-all`, and validate allowed access values per supported key before rendering.
- execution metadata currently supports only job `timeout-minutes`, job `defaults.run.shell`, job `defaults.run.working-directory`, and run-step `shell` plus `working-directory`; blank values and unsupported adjacent shapes still fail explicitly rather than being dropped or coerced.
- concurrency currently supports only workflow-level and job-level objects with non-blank `group` and optional boolean `cancel-in-progress`; unsupported adjacent concurrency fields still fail explicitly rather than being ignored.
- job `needs` preserves declared dependency order, rejects unknown dependency identifiers, rejects duplicate dependency entries, and currently requires each dependency to reference a previously declared job identifier.
- job `strategy.matrix` currently supports only direct axis-to-string-array mappings, rejects empty axes and malformed values explicitly, and treats broader matrix features such as `include` or `exclude` as unsupported in the current slice.
- Built workflow objects are deeply frozen, including nested trigger filters, job arrays, step arrays, and step maps such as `env` and `with`.
- Bun and Node unit/integration coverage run on Vitest, with Bun-run Vitest as the primary repository test authority.
- Deno remains intentionally scoped to smoke and compatibility coverage.
- The SDK exposes a deterministic renderer that:
  - converts supported workflow definitions into a JSON-like intermediate payload
  - injects an emitter function instead of binding the core to a YAML library
  - fails explicitly before emission when unsupported fields are present at runtime
- The CLI currently:
  - exposes `ghawb render --input <workflow.ts> --output <workflow.yml>`
  - loads a directly specified TypeScript module whose default export is a built workflow definition
  - renders YAML through one concrete adapter backed by the `yaml` Node module
  - writes deterministic workflow output files and exits non-zero on failure
- The repository self-hosts its CI workflow definition from `workflows/ci.ts` into `.github/workflows/ci.yml` through the root `generate:workflows` script.
- The supported committed-workflow authoring path is explicit and repository-local: workflow source modules live under `workflows/`, generated outputs live under `.github/workflows/`, and the project does not treat implicit workflow discovery or out-of-repository workflow source files as the supported path.
- The dedicated workflow guardrail command is `bun run verify:workflows`, which validates the supported repository-local workflow-source convention and detects generated-workflow drift for committed workflow outputs.
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
- The intermediate payload uses deterministic structural ordering: top-level `name`, `on`, `permissions`, `concurrency`, and `jobs`; canonical trigger key order (`push`, `pull_request`, `workflow_dispatch`, `schedule`); canonical permission key order (`actions`, `artifact-metadata`, `attestations`, `checks`, `contents`, `deployments`, `discussions`, `id-token`, `issues`, `models`, `packages`, `pages`, `pull-requests`, `security-events`, `statuses`); top-level concurrency field order `group`, `cancel-in-progress`; declared job order; job-local field order `needs`, `permissions`, `timeout-minutes`, `defaults`, `concurrency`, `strategy`, `runs-on`, `steps`; declared `needs` order within each job; `defaults.run` field order `shell`, `working-directory`; job concurrency field order `group`, `cancel-in-progress`; declared matrix axis order within each job strategy; and declared step order, with run-step execution metadata rendered as `shell` then `working-directory` before `run`.

## Open Questions

- TBD: how far typestate constraints should go before usability costs outweigh safety gains
- TBD: whether runtime-specific smoke tests should expand into a shared cross-runtime conformance suite beyond the Sprint 1 baseline
