# Sprint Backlog: Sprint 4

This document records the selected sprint backlog and planning decisions for Sprint 4.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 4: 8/15 story points.

Status: done

Completed At: 2026-03-30T12:46:42Z

## Planning Notes

- Capacity decision: Sprint 4 capacity is fixed at 15 story points.
- Selection decision: Sprint 4 commits `Item 8`, `Item 9a`, and `Item 9b` for a total of 8 story points.
- Ordering decision: Sprint 4 preserves the required execution order from the top of the product backlog and executes the selected items as `Item 8` -> `Item 9a` -> `Item 9b`.
- Dependency decision: `Item 9a` remains sequenced after `Item 8` because the team wants contributor guidance to build on a known-green hosted CI baseline, and `Item 9b` remains sequenced after `Item 9a` because automated guardrails should enforce an already-clarified supported path.
- Scope decision: Sprint 4 focuses on restoring hosted CI for the current self-hosted workflow path, then tightening contributor-facing verification guidance, then adding automated checks for the same supported path.
- Item 8 decision: Done means a pull request carrying the fix reaches green hosted GitHub Actions CI. The implementation is limited to repairing the current `@ghawb/sdk` resolution failure in `Render Workflows`; if a different hosted failure appears, the Product Owner will create a separate backlog item instead of expanding this item.
- Item 9a decision: The first guardrail slice prioritizes command and documentation ergonomics over new automation so contributors can follow the supported clean-branch verification and repository-local workflow authoring path without ambiguity.
- Item 9b decision: The second guardrail slice adds automated checks for generated-workflow drift and workflow-source validation only after the supported path is explicit in commands and docs.
- Product Owner decision: Sprint 4 will not reopen scope, ordering, or capacity. The remaining planning work is limited to making completion evidence, documentation touchpoints, and guardrail surfaces explicit for the already committed items.
- Scrum Master decision: Each Sprint 4 item must record its closeout evidence in the sprint artifact itself so review can distinguish local verification from hosted-platform proof without reinterpreting the Definition of Done during closeout.
- Developer decision: Workflow-source guidance and workflow guardrails must preserve the existing explicit, repository-local authoring path and must not introduce implicit workflow discovery, out-of-repository authoring support, or new workflow-surface expansion as part of Sprint 4.
- Item 8 evidence decision: Closeout evidence for `Item 8` must include a linkable pull request or commit reference, the hosted GitHub Actions run identifier or URL that proves the repaired change reached green, and a short note describing the local reproduction or verification path used before pushing.
- Item 9a documentation decision: `Item 9a` must update contributor-facing guidance in `README.md` and at least one durable project document under `docs/`, and may add or refine root commands only when those commands directly support the documented clean-branch verification flow or repository-local workflow authoring convention.
- Item 9b guardrail decision: `Item 9b` must expose its checks through a dedicated root verification command that is runnable locally and from CI, and the same guardrail command or an explicit wrapper around it must be wired into the hosted verification path so drift and workflow-source violations are detected the same way before and after push.
- Collaboration decision: Sprint execution will keep one backlog item active at a time while using team personas within each item, with Aoi Sakamoto controlling scope and follow-on backlog intake, Ren Takahashi coordinating sequencing and review readiness, and Developer personas splitting architecture, quality, and tooling concerns only inside the current active item.
- Buffer decision: The remaining 7 story points are intentionally left unallocated because no additional in-order backlog item remains after `Item 9b`.

## Committed Items

### Item 8: Restore hosted GitHub Actions CI to green

- Why: The repository now self-hosts its CI workflow, but hosted GitHub Actions is currently failing in run `23742800766` at `Render Workflows` with `Cannot find module '@ghawb/sdk' from '/home/runner/work/ghawb.ts/ghawb.ts/workflows/ci.ts'`. Local `bun run check` passing is not enough to preserve merge confidence if the hosted path is red, and Sprint 3 acceptance remains operationally incomplete until the hosted path is proven.
- Prerequisites: `Item 7` must already be complete, and the team must have access to the failing GitHub Actions run details needed to reproduce the hosted failure path.
- Implementation Plan: Reproduce the hosted failure from GitHub Actions logs, map it to an equivalent local verification path where possible, update the generated workflow, CLI execution path, or repository configuration to remove the workspace-module resolution failure, and add regression coverage or documentation so the same failure mode is caught before merge.
- Definition of Done: The hosted CI workflow passes on GitHub Actions for the repaired change, the completed fix has been code reviewed by a non-implementing persona, the failure cause plus verification path are recorded clearly enough for future triage, and the sprint closeout records the hosted proof artifact together with the local reproduction or verification note.
- Acceptance Criteria: The `Render Workflows` step no longer fails with the current `@ghawb/sdk` resolution error, the committed fix removes the hosted CI failure without requiring manual YAML edits, a pull request containing the fix reaches green hosted GitHub Actions CI, and the closeout evidence names the proving hosted run plus the pre-push local verification path.
- Story Points: 3
- Status: done
- Completed At: 2026-03-30T12:29:31Z
- Notes/Links: [Sprint 3 Review](../sprint_reviews/sp3.md), [Sprint 3 Retrospective](../sprint_retrospectives/sp3.md), [TEAM.md](../TEAM.md), [workflows/ci.ts](../../workflows/ci.ts), [ci.yml](../../.github/workflows/ci.yml). Planning decision: scope is limited to the current `@ghawb/sdk` resolution failure; any newly discovered hosted CI failure becomes a separate Product Owner backlog item. Closeout evidence: commit [`0cf4b5c`](https://github.com/moriturus/ghawb.ts/commit/0cf4b5c7721c4c984437d1694138deefba79f999), hosted GitHub Actions run [`23744675163`](https://github.com/moriturus/ghawb.ts/actions/runs/23744675163), local verification note: `bun test tests/node/self-hosting.test.ts`, `bun run generate:workflows`, and `bun run test:vitest:node` passed before hosted confirmation. Review note: code review completed by the non-implementing validation persona. Product Owner exception: this item is accepted as done for Sprint 4 by explicit user direction even though the original acceptance text called for a green pull-request run rather than a green push run.

### Item 9a: Clarify clean-branch verification and repository-local workflow authoring guidance

- Why: Sprint 3 records show that closeout verification can still be surprised by dirty-worktree state and that direct TypeScript workflow imports remain predictable only when workflow source modules stay repository-local and explicit. Contributors need a clearer supported path before the team enforces it with additional automation.
- Prerequisites: `Item 8` should be completed first so the guidance reflects a known-green hosted CI baseline.
- Implementation Plan: Improve repository commands and contributor-facing documentation so contributors can discover the expected clean-branch verification flow and repository-local workflow authoring convention before opening or updating a pull request, using `README.md` plus durable project docs under `docs/` as the primary guidance surfaces.
- Definition of Done: Contributors can follow a documented command and documentation path for supported verification and workflow authoring across `README.md` and the relevant project docs, and the completed change has been code reviewed by a non-implementing persona.
- Acceptance Criteria: The repository provides clear command and documentation guidance for clean-branch verification, explicitly documents the repository-local workflow-source convention, aligns that guidance with the CI path the project relies on, and limits any added root commands to ones that directly support the documented supported path.
- Story Points: 2
- Status: done
- Completed At: 2026-03-30T12:29:31Z
- Notes/Links: [Sprint 3 Review](../sprint_reviews/sp3.md), [Sprint 3 Retrospective](../sprint_retrospectives/sp3.md), [LEARN.md](../LEARN.md), [TEAM.md](../TEAM.md), [README.md](../../README.md), [CONTRIBUTING.md](../CONTRIBUTING.md), [SPEC.md](../SPEC.md). Planning decision: this slice intentionally prioritizes command and documentation ergonomics before adding new automated checks. Required guidance surfaces are `README.md` and at least one durable project document under `docs/`. Closeout evidence: root command `bun run verify:pre-push`, contributor guidance in `README.md` and `docs/CONTRIBUTING.md`, normative supported-path language in `docs/SPEC.md`, local verification via `bun test tests/node/self-hosting.test.ts`, and a clean temporary repository run of `bun run verify:pre-push`. Review note: code review completed by a non-implementing validation persona, and the review confirmed the change does not overreach into `Item 9b`.

### Item 9b: Add automated guardrails for generated-workflow drift and workflow-source validation

- Why: Once the supported contributor path is explicit, the repository should catch generated-workflow drift and unsupported workflow-source placement automatically before hosted CI discovers them too late.
- Prerequisites: `Item 9a` should be completed first so the automated checks enforce a documented supported path rather than inventing one implicitly.
- Implementation Plan: Add automated checks that detect generated-workflow drift and validate the supported workflow-source convention, expose them through a dedicated root verification command for local use, and align CI to run the same guardrail command or an explicit wrapper around it.
- Definition of Done: The repository automatically detects the targeted guardrail failures before hosted CI through a reproducible local command and matching CI wiring, and the completed change has been code reviewed by a non-implementing persona.
- Acceptance Criteria: The repository includes automated detection for generated-workflow drift and unsupported workflow-source placement, those checks match the contributor verification path established in `Item 9a`, and the local root command and hosted CI path enforce the same guardrail behavior.
- Story Points: 3
- Status: done
- Completed At: 2026-03-30T12:46:42Z
- Notes/Links: [Sprint 3 Review](../sprint_reviews/sp3.md), [Sprint 3 Retrospective](../sprint_retrospectives/sp3.md), [LEARN.md](../LEARN.md), [TEAM.md](../TEAM.md), [README.md](../../README.md), [CONTRIBUTING.md](../CONTRIBUTING.md), [SPEC.md](../SPEC.md), [workflows/ci.ts](../../workflows/ci.ts), [ci.yml](../../.github/workflows/ci.yml), [scripts/verify-workflows.ts](../../scripts/verify-workflows.ts). Planning decision: this slice follows `Item 9a` and enforces the documented supported path rather than broadening workflow feature scope. The preferred verification surface is a dedicated root guardrail command shared by local usage and CI. Closeout evidence: root command `bun run verify:workflows`, wrapper command `bun run verify:pre-push`, hosted CI wiring updated to call `bun run verify:workflows`, local verification via `bun test tests/node/self-hosting.test.ts tests/node/workflow-guardrails.test.ts` and `bun run typecheck`, and clean temporary repository verification via `bun run verify:workflows` plus `bun run verify:pre-push`. Review note: code review completed by a non-implementing validation persona for the guardrail slice.
