# Sprint Review: Sprint 8

## Summary

Sprint 8 reviewed the backlog slice `Item 20`, `Item 21`, `Item 22`, and `Item 23` (13 out of 15 capacity story points, with 2 SP intentional buffer).

- The SDK now supports workflow-level and job-level `env` maps, extending the existing step-level `env` pattern to all three scopes.
- Push and pull_request triggers now support the full GitHub Actions filter surface: `branches-ignore`, `paths-ignore`, `tags`, `tags-ignore`, and pull request `types` activity filters.
- Steps now support optional `id` fields with per-job uniqueness validation.
- Jobs now support `outputs` maps with `steps.<id>` referential validation against declared step IDs.
- Cross-runtime conformance fixtures were added in every sprint item, honoring the Sprint 7 retrospective rule.
- SPEC.md canonical ordering documentation was updated to reflect all new surfaces.

Review note about repository state:

- This review was performed on the `sprint-8` branch. The sprint closeout PR [`#21`](https://github.com/moriturus/ghawb.ts/pull/21) targets `main` and is open for merge.
- All four item PRs ([`#17`](https://github.com/moriturus/ghawb.ts/pull/17), [`#18`](https://github.com/moriturus/ghawb.ts/pull/18), [`#19`](https://github.com/moriturus/ghawb.ts/pull/19), [`#20`](https://github.com/moriturus/ghawb.ts/pull/20)) were merged into the sprint branch with review and Product Owner acceptance recorded per item.

## Increment Demo

The reviewed increment was demonstrated in two ways.

1. Full SDK surface demo combining all four sprint items in a single workflow definition:

```sh
node -e "
const { defineWorkflow, createWorkflowId, createJobId, createWorkflowRenderPayload } = require('./packages/sdk/src/index.ts');

const wf = defineWorkflow({ id: createWorkflowId('demo'), name: 'Sprint 8 Demo' })
  .onPush({ tags: ['v*'], pathsIgnore: ['docs/**'] })
  .onPullRequest({ branches: ['main'], types: ['opened', 'synchronize'] })
  .env({ NODE_ENV: 'production', CI: 'true' })
  .addJob(createJobId('build'), job => {
    job
      .runsOn('ubuntu-latest')
      .env({ BUILD_MODE: 'release' })
      .outputs({ artifact_url: '\${{ steps.upload.outputs.url }}' })
      .run('npm ci', { id: 'install' })
      .run('npm run build', { id: 'build' })
      .uses('actions/upload-artifact@v4', { id: 'upload', with: { path: 'dist' } });
  })
  .addJob(createJobId('deploy'), job => {
    job.runsOn('ubuntu-latest').needs(createJobId('build')).run('echo deploying');
  })
  .build();

console.log(JSON.stringify(createWorkflowRenderPayload(wf), null, 2));
"
```

Important output summary:

- The workflow rendered with all four sprint surfaces exercised: workflow-level `env`, `paths-ignore` and `tags` on push trigger, `types` on pull_request trigger, step `id` fields, and job `outputs` with `steps.<id>` reference.
- Canonical ordering was correct: trigger keys ordered `push` then `pull_request`; trigger filters ordered `paths-ignore` then `tags`; job fields ordered `env`, `runs-on`, `outputs`, `steps`; step fields ordered `id` before `run`/`uses`.
- The rendered payload matches GitHub Actions expected YAML structure.

2. Validation edge case verification:

```sh
node -e "
const { defineWorkflow, createWorkflowId, createJobId } = require('./packages/sdk/src/index.ts');

// Mutual exclusion, undeclared step ref, tags on PR, duplicate step IDs
for (const [label, fn] of [
  ['branches+branchesIgnore', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onPush({branches:['main'], branchesIgnore:['wip/**']}).addJob(createJobId('j'), j => {j.runsOn('ubuntu-latest').run('echo')}).build()],
  ['undeclared step ref', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onPush().addJob(createJobId('j'), j => {j.runsOn('ubuntu-latest').outputs({url: '\${{ steps.ghost.outputs.url }}'}).run('echo')}).build()],
  ['tags on PR', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onPullRequest({tags:['v*']}).addJob(createJobId('j'), j => {j.runsOn('ubuntu-latest').run('echo')}).build()],
  ['dup step IDs', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onPush().addJob(createJobId('j'), j => {j.runsOn('ubuntu-latest').run('a',{id:'dup'}).run('b',{id:'dup'})}).build()],
]) { try { fn(); console.log('FAIL:', label); } catch(e) { console.log('✅', label, '→', e.issues[0]); } }
"
```

Important output summary:

- Mutual exclusion: `branches` + `branchesIgnore` correctly rejected.
- Undeclared step ref: output referencing `steps.ghost` correctly rejected when no step with that ID exists.
- Tags on pull_request: `tags` field on `pull_request` trigger correctly rejected.
- Duplicate step IDs: two steps with the same `id` in one job correctly rejected.
- Non-step expressions like `${{ needs.build.outputs.result }}` accepted without spurious errors.

## Review Findings

The sprint delivered the full intended increment. No confirmed correctness bugs were found.

Confirmed strengths:

- All four items followed the established pattern: model extension, builder API, validation, deterministic rendering, and conformance fixtures.
- The Sprint 7 retrospective rule — cross-runtime conformance fixtures in every workflow-surface expansion — was honored in all four items.
- Item-level Product Owner acceptance was performed during sprint execution for each item, consistent with the team's acceptance-gating practice.
- Test growth was substantial: 72 → 146 Vitest tests (+74), 7 → 16 Deno conformance tests (+9).

Residual risks:

- The `steps.<id>` referential validation uses regex pattern matching (`/steps\.([a-zA-Z_][a-zA-Z0-9_-]*)/g`) rather than full expression parsing. This is explicitly scoped per the sprint backlog decision and covers the standard GitHub Actions step ID character set, but unusual expression constructs (nested expressions, string concatenation producing step references) will not be caught. This is an acceptable tradeoff for the current SDK maturity level.
- Step IDs are not validated against the GitHub Actions identifier format (`^[a-zA-Z][a-zA-Z0-9_-]*$`) at the builder level — they are only validated for non-blank and per-job uniqueness. Malformed IDs (e.g., starting with a digit) would pass the SDK but fail at GitHub Actions runtime. A future hardening item could add format validation using the shared identifier factory pattern.
- `JobBuilder` is intentionally not exported from the public API. Users interact with it only through `addJob(id, callback)`. This is correct encapsulation but should remain a conscious decision if future API expansion needs arise.

Open questions:

- None blocking. The delivered increment is complete against all acceptance criteria.

## Product Owner Decision

As Product Owner, Aoi Sakamoto accepts the Sprint 8 increment as delivered.

- All four committed items met their Definition of Done and Acceptance Criteria, with item-level acceptance performed during sprint execution.
- The sprint delivered 13 story points out of 15 capacity, maintaining the 2 SP buffer pattern from Sprint 7.
- No new defect backlog item is required from the reviewed increment.
- The residual risk about step ID format validation (not checking `^[a-zA-Z]` prefix) is noted but does not warrant a blocking follow-up. If the team decides to add identifier format validation for step IDs, it can be addressed alongside other hardening work in a future sprint.
- No backlog reprioritization is applied during this review. The remaining 6 backlog items (`Item 24` through `Item 29`) retain their current priority order.
- The multi-agent sprint execution model continued to work effectively. Sub-agent delegation for test writing and code exploration kept the sprint velocity high while maintaining review-boundary discipline.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp8.md](../sprint_backlogs/sp8.md)
- [TEAM.md](../TEAM.md)
- [packages/sdk/src/model.ts](../../packages/sdk/src/model.ts)
- [packages/sdk/src/builders.ts](../../packages/sdk/src/builders.ts)
- [packages/sdk/src/renderer.ts](../../packages/sdk/src/renderer.ts)
- [packages/sdk/src/index.ts](../../packages/sdk/src/index.ts)
- [packages/sdk/src/workflow.test.ts](../../packages/sdk/src/workflow.test.ts)
- [packages/sdk/src/renderer.test.ts](../../packages/sdk/src/renderer.test.ts)
- [tests/shared/render-conformance.fixtures.ts](../../tests/shared/render-conformance.fixtures.ts)
- [tests/deno/render-conformance.test.ts](../../tests/deno/render-conformance.test.ts)
