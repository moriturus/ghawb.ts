# Repository Agent Guide

This file defines repository-specific instructions for contributors and coding agents working in `ghawb`.

## Scope

- Keep changes focused on the requested task.
- Do not modify unrelated files or behavior.
- Prefer small, reviewable changes over broad speculative edits.

## Documentation Responsibilities

- Treat `docs/SPEC.md` as the current specification source of truth.
- When code or behavior changes, inspect `docs/SPEC.md` and update it if the documented behavior no longer matches reality.
- When any Markdown file is added under `docs/`, update `docs/INDEX.md`.
- Keep `docs/PRODUCT_BACKLOG.md` and the relevant files under `docs/sprint_backlogs/` aligned with the current implementation plan and status.
- Record durable implementation lessons, mistakes, or gotchas in `docs/LEARN.md` when they would help future work.
- When YAML adapter boundaries or workflow AST ownership rules change, update both `docs/SPEC.md` and the relevant ADRs in the same change.
- When delivery order changes, keep `docs/SPEC.md`, `docs/PRODUCT_BACKLOG.md`, the relevant sprint backlog files, and relevant ADRs aligned.

## ADR Rules

- Record architectural decisions under `docs/adrs/`.
- Use the filename format `NNNN-short-kebab-case.md`.
- Increment ADR numbers sequentially.
- Add links to relevant ADRs from backlog items or specification sections when they materially affect implementation.

## Engineering Constraints

- Practice test-driven development by default.
- Maintain 100% code coverage as a project goal.
- Use Conventional Commits for commit messages, including sprint item commits and sprint closeout commits.
- Keep the implementation 100% Pure TypeScript.
- Do not introduce dependencies outside Node modules.
- Do not add YAML input or parser support to the core architecture unless the specification and ADRs are updated first.
- Keep core workflow AST construction, builders, and validation independent from any concrete YAML library.
- Prioritize SDK and renderer work ahead of CLI work.
- Treat self-hosting changes as post-CLI work.
- Treat Bun as the standard development environment while preserving compatibility with Node and Deno.
- Consider package manager compatibility across npm, yarn, and pnpm where tooling choices matter.

## Sprint Execution

- When executing sprint backlog items, prioritize using sub-agents or multi-agent collaboration in alignment with the personas defined in `docs/TEAM.md`.
- Create a dedicated sprint branch at sprint start from the agreed sprint base.
- Create each backlog item's feature branch from the latest sprint branch state rather than directly from `main`.
- Target backlog-item pull requests at the sprint branch rather than at `main`.
- After the final committed sprint item is integrated into the sprint branch, create one sprint-level pull request from the sprint branch into `main`.
- Use the Product Owner persona to refine scope, acceptance criteria, and sequencing decisions before or alongside implementation when backlog interpretation is needed.
- Use the Scrum Master persona to track dependencies, risks, impediments, and task ordering across concurrent work.
- Use Developer personas to split implementation by concern, such as SDK architecture, validation or testing, and tooling or packaging, when parallel work is beneficial.
- Keep delegated work scoped to the smallest reviewable unit that still maps clearly to one of the defined team personas.
- Reflect any durable changes to team operating expectations in `docs/TEAM.md`.

## Change Verification

- Verify that new or changed documents remain internally consistent.
- Check links between `README.md`, `docs/INDEX.md`, `docs/SPEC.md`, backlog entries, and ADRs when editing docs.
- Surface assumptions explicitly instead of presenting unresolved details as settled.
