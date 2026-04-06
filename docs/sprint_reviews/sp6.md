# Sprint Review: Sprint 6

## Summary

Sprint 6 reviewed the backlog slice `Item 14` through `Item 16`.

- The SDK now supports top-level and job-level `permissions` with explicit validation and deterministic rendering.
- The SDK now supports the approved execution-metadata slice: job `timeout-minutes`, job `defaults.run.shell`, job `defaults.run.working-directory`, and run-step `shell` plus `working-directory`.
- The SDK now supports workflow-level and job-level `concurrency` with required `group` and optional `cancel-in-progress`.
- The specification and sprint backlog record now describe the supported boundaries and deterministic payload ordering for the Sprint 6 slices.

Review note about repository state:

- This review was performed with a dirty worktree because the repository root contains an untracked `.codex-worktrees/` directory. The reviewed increment itself is present on `main` and in merged sprint artifacts, but this review should still be read as current-working-tree evidence rather than as a separately tagged release snapshot.

## Increment Demo

The reviewed increment was demonstrated in three ways.

1. Focused SDK builder and renderer regression coverage under Bun:

```sh
bun run test:vitest -- packages/sdk/src/workflow.test.ts packages/sdk/src/renderer.test.ts
```

Important output summary:

- The targeted suite passed 47 tests across 2 files.
- The passing cases cover supported `permissions`, execution metadata, and `concurrency` surfaces.
- The failing-path coverage now also checks unsupported keys, invalid values, empty `defaults.run`, and unsupported adjacent `concurrency` shapes.

2. Focused SDK builder and renderer regression coverage under Node:

```sh
node ./node_modules/vitest/vitest.mjs run packages/sdk/src/workflow.test.ts packages/sdk/src/renderer.test.ts
```

Important output summary:

- The same 47 tests passed under the Node compatibility path.
- This demonstrates that the Sprint 6 SDK slices are not only Bun-green but also match the intended Node verification surface.

3. Repository type-check confirmation:

```sh
bun run typecheck
```

Important output summary:

- TypeScript type-checking passed on the current `main` state.
- This confirms the new workflow model, builder, and renderer additions remain type-consistent at the repository level.

## Review Findings

The sprint delivered the intended increment. No confirmed correctness bugs were found in the reviewed Sprint 6 surfaces.

Residual risks:

- Cross-runtime executable proof is still concentrated in Bun and Node. Deno remains smoke-only, and the repository still lacks the broader conformance evidence explicitly called out by the open question in [SPEC.md](../SPEC.md) and backlog `Item 19`.
- The review was performed with a dirty worktree because `.codex-worktrees/` is untracked in the repository root. That does not invalidate the merged Sprint 6 code, but it weakens the cleanliness of the review snapshot compared with a fully clean tree.

Open questions:

- Whether the next sprint should harden the shared SDK rendering contract across Bun, Node, and Deno before widening more repository or CLI surface area.

## Product Owner Decision

As Product Owner, Aoi Sakamoto accepts the Sprint 6 increment as delivered.

- The delivered priority was correct inside the sprint: permissions first, execution metadata second, and concurrency third.
- No new defect backlog item is required for the reviewed increment.
- Priority is adjusted for the remaining backlog to bring hardening forward ahead of additional CLI surface expansion:
  - keep `Item 17` next, because the repository's committed multi-workflow contract is still the highest-value explicit product step
  - move `Item 19` ahead of `Item 18`, because cross-runtime conformance hardening is now more important than widening the batch CLI surface on top of an only partially hardened SDK contract

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp6.md](../sprint_backlogs/sp6.md)
- [TEAM.md](../TEAM.md)
- [README.md](../../README.md)
- [packages/sdk/src/model.ts](../../packages/sdk/src/model.ts)
- [packages/sdk/src/builders.ts](../../packages/sdk/src/builders.ts)
- [packages/sdk/src/renderer.ts](../../packages/sdk/src/renderer.ts)
- [packages/sdk/src/workflow.test.ts](../../packages/sdk/src/workflow.test.ts)
- [packages/sdk/src/renderer.test.ts](../../packages/sdk/src/renderer.test.ts)
- [tests/node/smoke.test.ts](../../tests/node/smoke.test.ts)
- [tests/deno/smoke.test.ts](../../tests/deno/smoke.test.ts)
