# Sprint Review: Sprint 7

## Summary

Sprint 7 reviewed the backlog slice `Item 17`, `Item 19`, and `Item 18`.

- The repository now supports multiple committed workflow source modules under [`workflows/`](../../workflows) with deterministic `.github/workflows/*.yml` mappings enforced by the workflow guardrails.
- The SDK now has a shared cross-runtime render conformance suite that exercises representative supported fixtures across Bun, Node, and Deno.
- The CLI now supports explicit multi-workflow rendering through `ghawb render-batch`, and the repository helper `bun run generate:workflows` now routes through that explicit batch surface.
- The specification and sprint backlog record now describe the expanded repository-local workflow contract, the cross-runtime conformance contract, and the explicit batch CLI boundary.

Review note about repository state:

- This review was performed with a clean worktree on `main`. The reviewed increment is present on `origin/main` via Sprint 7 closeout PR [`#16`](https://github.com/moriturus/ghawb.ts/pull/16).

## Increment Demo

The reviewed increment was demonstrated in four ways.

1. Workflow guardrail verification for multiple committed workflow mappings:

```sh
bun run verify:workflows
```

Important output summary:

- The command completed successfully.
- The guardrail verified both `.github/workflows/ci.yml` and `.github/workflows/manual-verify.yml`.
- This confirms the Sprint 7 repository contract now covers more than one committed workflow mapping without undocumented discovery.

2. Explicit multi-workflow batch rendering through the CLI:

```sh
bun run packages/cli/src/bin.ts render-batch \
  --input ./workflows/ci.ts --output ./.github/workflows/ci.yml \
  --input ./workflows/manual-verify.ts --output ./.github/workflows/manual-verify.yml
```

Important output summary:

- The command rendered both declared workflow mappings successfully.
- The CLI output reported each generated output path explicitly.
- This demonstrates the Sprint 7 batch CLI surface stays explicit-input based rather than adding repository scanning.

3. Bun/Node-side conformance and CLI regression coverage:

```sh
bun test tests/node/render-conformance.test.ts packages/cli/src/cli.test.ts tests/node/generate-workflows.test.ts
```

Important output summary:

- The targeted suite passed 11 tests across 3 files.
- The passing cases cover shared render conformance fixtures, explicit batch CLI rendering, partial batch failure behavior, and the repository generation helper.

4. Deno-side render conformance coverage:

```sh
deno test tests/deno/render-conformance.test.ts
```

Important output summary:

- The Deno conformance suite passed 5 tests.
- The same representative fixture contract now executes on Deno instead of leaving the widened supported rendering surface at smoke-only proof.

## Review Findings

The sprint delivered the intended increment. No confirmed correctness bugs were found in the reviewed Sprint 7 surfaces.

Residual risks:

- The repository has completed the currently committed backlog and now has no unselected product backlog items. Further scope should be reintroduced deliberately through backlog intake rather than by extending the current Sprint 7 surfaces implicitly.
- The shared cross-runtime suite is intentionally representative rather than exhaustive. That is consistent with Sprint 7 scope, but any future workflow-surface expansion should add fixture coverage at the same time instead of assuming the current representative set is sufficient.

Open questions:

- Which next backlog slice should be introduced now that the previously planned work through Sprint 7 is exhausted.

## Product Owner Decision

As Product Owner, Aoi Sakamoto accepts the Sprint 7 increment as delivered.

- The sprint kept the intended order and dependency discipline: repository contract first, runtime hardening second, CLI ergonomics third.
- No new defect backlog item is required from the reviewed increment.
- No backlog reprioritization was applied during this review because the product backlog is currently exhausted. The next planning cycle should start by defining new intake rather than by extending Sprint 7 implicitly.
- The sprint's multi-agent execution model was appropriate for this increment. Scope clarification, review evidence, and execution sequencing remained explicit instead of being folded into ad hoc implementation decisions.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp7.md](../sprint_backlogs/sp7.md)
- [TEAM.md](../TEAM.md)
- [README.md](../../README.md)
- [packages/cli/src/index.ts](../../packages/cli/src/index.ts)
- [packages/cli/src/cli.test.ts](../../packages/cli/src/cli.test.ts)
- [scripts/generate-workflows.ts](../../scripts/generate-workflows.ts)
- [scripts/verify-workflows.ts](../../scripts/verify-workflows.ts)
- [tests/shared/render-conformance.fixtures.ts](../../tests/shared/render-conformance.fixtures.ts)
- [tests/node/render-conformance.test.ts](../../tests/node/render-conformance.test.ts)
- [tests/deno/render-conformance.test.ts](../../tests/deno/render-conformance.test.ts)
- [workflows/ci.ts](../../workflows/ci.ts)
- [workflows/manual-verify.ts](../../workflows/manual-verify.ts)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [.github/workflows/manual-verify.yml](../../.github/workflows/manual-verify.yml)
