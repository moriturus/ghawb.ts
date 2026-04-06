# Sprint Review: Sprint 9

## Summary

Sprint 9 reviewed the backlog slice `Item 24`, `Item 25`, `Item 26`, and `Item 27` (14 out of 15 capacity story points, with 1 SP intentional buffer).

- The SDK now supports full strategy completion: `failFast`, `maxParallel`, matrix `include` (arbitrary keys), and `exclude` (declared-axis-only) with deterministic canonical rendering.
- Steps now support `continue-on-error` (boolean) and `timeout-minutes` (positive integer) on both `run` and `uses` steps.
- `workflow_dispatch` triggers now support optional `inputs` with per-input `description`, `required`, `default`, `type` (validated against the GitHub Actions allowlist), and `options` (required for `choice` type).
- Jobs now support `if` conditionals (non-blank string expression) and `continue-on-error` (boolean) with canonical field ordering: `if` before `needs`, `continue-on-error` after `needs`.
- Cross-runtime conformance fixtures were added in every sprint item, honoring the Sprint 7 retrospective rule.
- SPEC.md canonical ordering documentation was updated to reflect all new surfaces, including `workflow_dispatch` input field order and updated job field order.

Review note about repository state:

- This review was performed on the `sprint-9` branch after it was merged into `main` via sprint closeout PR [`#26`](https://github.com/moriturus/ghawb.ts/pull/26).
- All four item PRs ([`#22`](https://github.com/moriturus/ghawb.ts/pull/22), [`#23`](https://github.com/moriturus/ghawb.ts/pull/23), [`#24`](https://github.com/moriturus/ghawb.ts/pull/24), [`#25`](https://github.com/moriturus/ghawb.ts/pull/25)) were merged into the sprint branch with review and Product Owner acceptance recorded per item.
- Evidence provenance: review was performed against a clean worktree on the `sprint-9` branch at commit `19dfdc4`.

## Increment Demo

The reviewed increment was demonstrated in two ways.

1. Full SDK surface demo combining all four sprint items in a single workflow definition:

```sh
bun -e "
const { defineWorkflow, createWorkflowId, createJobId, createWorkflowRenderPayload } = require('./packages/sdk/src/index.ts');

const wf = defineWorkflow({ id: createWorkflowId('sprint9_demo'), name: 'Sprint 9 Demo' })
  .onWorkflowDispatch({
    environment: {
      description: 'Deploy target',
      required: true,
      default: 'staging',
      type: 'choice',
      options: ['staging', 'production'],
    },
    dry_run: {
      description: 'Simulate without applying',
      type: 'boolean',
      required: false,
    },
  })
  .onPush({ branches: ['main'] })
  .addJob(createJobId('test'), job => {
    job
      .runsOn('ubuntu-latest')
      .strategyMatrix({ os: ['ubuntu-latest', 'macos-latest'], node: ['20', '22'] })
      .strategyFailFast(false)
      .strategyMaxParallel(2)
      .strategyInclude([{ os: 'windows-latest', node: '22' }])
      .strategyExclude([{ os: 'macos-latest', node: '20' }])
      .run('npm ci', { continueOnError: true, timeoutMinutes: 5 })
      .run('npm test', { timeoutMinutes: 30 });
  })
  .addJob(createJobId('deploy'), job => {
    job
      .ifCondition(\"github.ref == 'refs/heads/main'\")
      .needs(createJobId('test'))
      .continueOnError(true)
      .runsOn('ubuntu-latest')
      .run('echo deploying');
  })
  .build();

console.log(JSON.stringify(createWorkflowRenderPayload(wf), null, 2));
"
```

Important output summary:

- The workflow rendered with all four sprint surfaces exercised: `failFast`, `maxParallel`, `include`/`exclude` in strategy; `continue-on-error` and `timeout-minutes` on steps; `workflow_dispatch` with typed inputs including `choice` with `options`; and job-level `if` and `continue-on-error` composing with `needs`.
- Canonical ordering was correct: strategy fields ordered `fail-fast`, `max-parallel`, `matrix`; matrix sub-fields ordered declared axes then `include` then `exclude`; step fields ordered `continue-on-error`, `timeout-minutes` before `run`; job fields ordered `if` before `needs` before `continue-on-error`; dispatch input fields ordered `description`, `required`, `default`, `type`, `options`.
- The rendered payload matches GitHub Actions expected YAML structure.

2. Validation edge case verification:

```sh
bun -e "
const { defineWorkflow, createWorkflowId, createJobId } = require('./packages/sdk/src/index.ts');

for (const [label, fn] of [
  ['choice without options', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onWorkflowDispatch({env: {type: 'choice'}}).addJob(createJobId('j'), j => {j.runsOn('ubuntu-latest').run('echo')}).build()],
  ['options on non-choice', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onWorkflowDispatch({env: {type: 'string', options: ['a']}}).addJob(createJobId('j'), j => {j.runsOn('ubuntu-latest').run('echo')}).build()],
  ['blank dispatch input', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onWorkflowDispatch({'': {description: 'bad'}}).addJob(createJobId('j'), j => {j.runsOn('ubuntu-latest').run('echo')}).build()],
  ['blank job if', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onPush().addJob(createJobId('j'), j => {j.ifCondition('  ').runsOn('ubuntu-latest').run('echo')}).build()],
  ['non-boolean job continueOnError', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onPush().addJob(createJobId('j'), j => {j.continueOnError('yes').runsOn('ubuntu-latest').run('echo')}).build()],
  ['exclude undeclared axis', () => defineWorkflow({id: createWorkflowId('t'), name: 'T'}).onPush().addJob(createJobId('j'), j => {j.strategyMatrix({os:['u']}).strategyExclude([{os:'u',arch:'x86'}]).runsOn('ubuntu-latest').run('echo')}).build()],
]) { try { fn(); console.log('FAIL:', label); } catch(e) { console.log('✅', label, '→', e.issues[0]); } }
"
```

Important output summary:

- `choice` type without `options`: correctly rejected with `requires non-empty options`.
- `options` on non-choice type: correctly rejected with `options is only valid when type is "choice"`.
- Blank dispatch input name: correctly rejected with `inputs must not contain blank names`.
- Blank job `if` expression: correctly rejected with `if must be a non-blank string`.
- Non-boolean job `continueOnError`: correctly rejected with `continue-on-error must be a boolean`.
- Exclude referencing undeclared axis: correctly rejected with `references undeclared axis "arch"`.

## Review Findings

The sprint delivered the full intended increment. No confirmed correctness bugs were found.

Confirmed strengths:

- All four items followed the established pattern: model extension, builder API, validation, deterministic rendering, and conformance fixtures.
- The Sprint 7 retrospective rule — cross-runtime conformance fixtures in every workflow-surface expansion — was honored in all four items.
- Item-level Product Owner acceptance was performed during sprint execution for each item, consistent with the team's acceptance-gating practice.
- Test growth was substantial: 146 → 184 Vitest tests (+38), 16 → 24 Deno conformance tests (+8).
- The `workflow_dispatch` boundary expansion (Item 26) was the most complex delivery in this sprint and was handled cleanly, including the `choice`/`options` conditional validation that motivated the re-estimation from 4 to 5 SP.
- The CI formatting failure caught during sprint closeout was a minor `oxfmt` formatting issue in `builders.ts` and `renderer.ts`, fixed in a single follow-up commit. This is a known friction point with multi-file changes and does not indicate a process gap.

Residual risks:

- Identifier format validation remains deferred. Step IDs, matrix axis keys, and workflow dispatch input names are validated for non-blank and structural correctness but not against the GitHub Actions identifier format (`^[a-zA-Z_][a-zA-Z0-9_-]*$`). Malformed identifiers (e.g., starting with a digit, containing spaces) pass SDK validation but would fail at GitHub Actions runtime. This is explicitly tracked as backlog Item 31 (identifier format validation hardening) and is the next SDK-surface item in priority order.
- The `workflow_dispatch` input `default` field accepts any string value without type-specific validation (e.g., `default: 'abc'` is accepted even when `type: 'number'`). This matches GitHub Actions' own behavior (GitHub validates defaults at runtime, not at workflow parse time), but SDK consumers may expect stricter compile-time checking. No backlog item is needed — the current behavior is correct.
- Job-level `if` accepts arbitrary string expressions without AST-level validation. This is explicitly scoped per the sprint backlog decision and consistent with the step-level `if` pattern. Expression validation, if ever needed, would be a separate feature.

Open questions:

- None blocking. The delivered increment is complete against all acceptance criteria.

## Product Owner Decision

As Product Owner, Aoi Sakamoto accepts the Sprint 9 increment as delivered.

- All four committed items met their Definition of Done and Acceptance Criteria, with item-level acceptance performed during sprint execution.
- The sprint delivered 14 story points out of 15 capacity, maintaining the intentional buffer pattern (1 SP this sprint, vs. 2 SP in Sprints 7 and 8). The smaller buffer was appropriate given the Item 26 re-estimation absorbed the complexity.
- No new defect backlog item is required from the reviewed increment.
- The residual risk about identifier format validation is already tracked as Item 31 and remains correctly prioritized as the second item in the remaining backlog (after Item 28).
- No backlog reprioritization is applied during this review. The remaining four backlog items retain their current priority order: Item 28 (workflow-level defaults and permissions shorthand) → Item 31 (identifier format validation hardening) → Item 30 (sprint ceremony process hardening) → Item 29 (self-hosting expansion and distribution readiness).
- The multi-agent sprint execution model continued to work effectively. Items 26 and 27 were executed sequentially with per-item code review by a non-implementing persona and Product Owner acceptance before merge, maintaining the review-boundary discipline established in Sprint 8.
- Sprint 9 completes the second batch of SDK surface expansion (Items 20–27 across Sprints 8 and 9). The SDK now covers a materially broader slice of the GitHub Actions workflow surface, making the remaining backlog well-positioned for the capstone distribution and self-hosting sprint.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp9.md](../sprint_backlogs/sp9.md)
- [TEAM.md](../TEAM.md)
- [packages/sdk/src/model.ts](../../packages/sdk/src/model.ts)
- [packages/sdk/src/builders.ts](../../packages/sdk/src/builders.ts)
- [packages/sdk/src/renderer.ts](../../packages/sdk/src/renderer.ts)
- [packages/sdk/src/index.ts](../../packages/sdk/src/index.ts)
- [packages/sdk/src/workflow.test.ts](../../packages/sdk/src/workflow.test.ts)
- [packages/sdk/src/renderer.test.ts](../../packages/sdk/src/renderer.test.ts)
- [tests/shared/render-conformance.fixtures.ts](../../tests/shared/render-conformance.fixtures.ts)
- [tests/deno/render-conformance.test.ts](../../tests/deno/render-conformance.test.ts)
