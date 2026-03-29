# Sprint Review: Sprint 4

## Summary

Sprint 4 reviewed the backlog slice `Item 8` through `Item 9b`.

- Hosted GitHub Actions CI was restored for the self-hosted workflow path by fixing workspace-package resolution for `workflows/ci.ts`.
- The repository now documents a supported contributor verification flow through `bun run verify:pre-push` and a repository-local workflow authoring convention.
- The repository now exposes a dedicated workflow guardrail command, `bun run verify:workflows`, that validates workflow-source placement and detects generated-workflow drift.
- Hosted CI now runs the same workflow guardrail command that contributors can run locally.

Review note about repository state:

- This review was performed with a dirty worktree. The reviewed increment exists in the current working tree and sprint backlog records, but the review evidence below should be read as working-tree evidence rather than as a clean committed tag or release snapshot.

## Increment Demo

The reviewed increment was demonstrated in three ways.

1. Dedicated workflow guardrail command:

```sh
bun run verify:workflows
```

Important output summary:

- The command completed successfully and reported `Verified workflow guardrails for .github/workflows/ci.yml`.
- This demonstrates the dedicated root guardrail surface required by `Item 9b`.

2. Focused workflow and self-hosting regression coverage:

```sh
bun test tests/node/self-hosting.test.ts tests/node/workflow-guardrails.test.ts
```

Important output summary:

- The targeted suite passed 6 tests across 2 files.
- The tests cover committed CI workflow expectations, root command wiring, workflow-source placement validation, and generated-workflow drift detection behavior.

3. Repository type-check confirmation for the new scripts and command wiring:

```sh
bun run typecheck
```

Important output summary:

- TypeScript type-checking passed for the updated repository, including the new workflow guardrail and pre-push verification scripts.

## Review Findings

The sprint delivered its intended hardening slice. No confirmed correctness bugs were found in the reviewed increment.

Residual risks:

- `Item 8` was accepted through an explicit Product Owner exception recorded in [sp4.md](../sprint_backlogs/sp4.md) because the original acceptance text called for a green pull-request run, while the recorded hosted proof is a green push run.
- The workflow guardrail implementation currently matches the repository's present single committed workflow source, `workflows/ci.ts`. If the project later adds multiple committed workflow modules, the guardrail mapping rules may need a follow-up backlog item rather than silent expansion.
- The review was performed on a dirty worktree, so the sprint evidence is strong for current repository state but not yet tied to a distinct clean review commit in this note.

## Product Owner Decision

As Product Owner, Aoi Sakamoto accepts the Sprint 4 increment as delivered.

- The delivered priority was correct: operational hosted-CI recovery came first, contributor guidance came second, and automated workflow guardrails came third.
- No immediate follow-up backlog item is added yet, because the current repository state now has a clear local workflow verification path and matching hosted guardrail wiring.
- If future scope adds multiple committed workflow modules or broadens workflow authoring surfaces, that work should be planned explicitly rather than folded into the current guardrail contract.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp4.md](../sprint_backlogs/sp4.md)
- [TEAM.md](../TEAM.md)
- [README.md](../../README.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [scripts/verify-workflows.ts](../../scripts/verify-workflows.ts)
- [scripts/verify-pre-push.ts](../../scripts/verify-pre-push.ts)
- [workflows/ci.ts](../../workflows/ci.ts)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [tests/node/self-hosting.test.ts](../../tests/node/self-hosting.test.ts)
- [tests/node/workflow-guardrails.test.ts](../../tests/node/workflow-guardrails.test.ts)
