# ADR 0004: Separate Composite Action Authoring From Workflow SDK

- Status: Accepted
- Date: 2026-04-05

## Context

Sprint 20 Item 70a requires a discovery decision for composite action support before implementation begins.

Composite actions are the only remaining entry under [docs/SYNTAX_COVERAGE.md](../SYNTAX_COVERAGE.md) "Not Yet Supported Features", but three architecture questions remained open:

1. Should composite action authoring live in `@ghawb/sdk` or in a separate package?
2. Should emission reuse the existing `ghawb render` workflow flow or use a dedicated action-emitter path?
3. What is the smallest initial supported slice that makes `Item 70b` implementation-safe?

The current product boundary is strongly workflow-centric:

- `@ghawb/sdk` owns the workflow AST, workflow builders, workflow validation, and workflow rendering.
- `@ghawb/cli` currently renders workflow definitions only and its `render` command is documented around `workflows/*.ts -> .github/workflows/*.yml`.
- Existing opt-in packages (`@ghawb/typed-actions`, `@ghawb/reusable-workflow-import`) are used when functionality is valuable but should not widen the core workflow SDK boundary.

The repository architecture principles also bias toward explicit boundaries, additive surfaces, and avoiding convenience-driven abstraction that weakens the core domain model.

## Decision

We keep composite action authoring out of `@ghawb/sdk` and choose a separate opt-in package plus a dedicated CLI action-emitter flow for the first implementation slice.

The selected boundary for `Item 70b` is:

- package: a new opt-in package dedicated to composite action authoring
- core SDK impact: `@ghawb/sdk` remains workflow-focused and does not absorb an action-definition AST
- CLI path: use a dedicated action-emitter flow in `@ghawb/cli` rather than overloading the existing workflow `render` command
- first output artifact: explicit `action.yml` emission for a single authored composite action definition

The recommended minimal first slice is:

- required action metadata: `name`
- optional action metadata: `description`
- optional `inputs` with `description`, `required`, and `default`
- optional `outputs` with `description` and `value`
- `runs.using: "composite"` with ordered `steps`
- step surface aligned to the existing workflow-step subset where it maps cleanly: `name`, `id`, `if`, `env`, `run`, `uses`, `with`, `shell`, and `working-directory`

The first slice explicitly excludes:

- branding metadata (`branding`, icon, color)
- pre/post execution hooks and other non-core action metadata
- action packaging/publishing automation
- workflow-oriented concepts such as triggers, jobs, permissions, concurrency, environments, services, and runner selection
- overloading `ghawb render` to auto-detect workflow versus action definitions
- implicit output-path inference in the first action-emission slice

## Options Considered

### Option 1: Host composite action authoring in `@ghawb/sdk`

Pros:

- reuses the existing package immediately
- may allow some shared step-model reuse without another package

Cons:

- widens a workflow-specific SDK into a mixed workflow/action surface
- muddies AST ownership by combining two top-level GitHub Actions document types in one core package
- increases the chance that future workflow convenience decisions are constrained by action-specific concerns

Decision: Rejected.

### Option 2: Separate opt-in package for composite action authoring

Pros:

- preserves the workflow-focused boundary of `@ghawb/sdk`
- matches the repository's recent preference for opt-in packages when the feature is useful but architecturally distinct
- keeps `Item 70b` small and reviewable

Cons:

- introduces another package to document and publish
- may duplicate some step-shape logic initially until shared extraction is justified

Decision: Accepted.

### Option 3: Reuse existing `ghawb render` for both workflows and actions

Pros:

- fewer CLI commands
- superficially simpler to explain

Cons:

- creates input-type ambiguity at the CLI boundary
- complicates output-path defaults because workflow and action conventions differ
- weakens the current clear repository-local workflow contract

Decision: Rejected.

### Option 4: Dedicated action-emitter flow in the existing CLI package

Pros:

- keeps the YAML adapter boundary in `@ghawb/cli`
- avoids a second CLI package while preserving explicit command intent
- lets action emission evolve without destabilizing workflow rendering UX

Cons:

- adds one more command path to document and test

Decision: Accepted.

## Consequences

- `Item 70b` can implement a first composite action slice without reopening package-boundary or CLI-path questions.
- `docs/SPEC.md` should record that composite action support remains pending in code, but the planned first slice is a separate opt-in package plus a dedicated CLI action-emitter flow.
- `docs/SYNTAX_COVERAGE.md` can continue to list composite actions as unsupported while noting the discovery-selected first-slice boundary.
- If shared step logic between workflows and composite actions becomes substantial, extraction should happen only after `Item 70b` proves the common surface, not preemptively during discovery.
