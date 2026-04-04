# Product Backlog

This document defines the prioritized product backlog for `ghawb`.

## Item Template

Every product backlog item in this document should use the following template.

```markdown
### Item ID: Short title

- Why:
- Prerequisites:
- Implementation Plan:
- Definition of Done:
- Acceptance Criteria:
- Story Points:
- Status:
- Completed At:
- Notes/Links:
```

Use `Completed At: N/A` for items that are not done yet. Once implementation and acceptance are complete, update the item to `Status: done`, record the completion timestamp in UTC, and move the item into the relevant sprint backlog record under `docs/sprint_backlogs/`.

## Operating Rules

- Product backlog items remain here until they are selected into a sprint.
- Sprint backlog execution must proceed from the top selected item downward.
- The team must not actively implement multiple sprint backlog items in parallel.
- Sprint backlog execution is collaborative across all roles, but each role must stay within its boundary defined in [TEAM.md](./TEAM.md).
- Every backlog item's Definition of Done must include completed code review.
- Code review for a backlog item must be performed by a persona other than the persona that held the primary implementation responsibility for the change.

## Current Product Backlog

### Item 65: Job preset / recipe API

- Why: Common workflow patterns (Node CI, Bun CI, pnpm install/test) are repeatedly assembled from the same builder calls. A preset or recipe API could reduce boilerplate for standard patterns and bridge the gap between the Cookbook documentation and the SDK API.
- Prerequisites: None. Benefits from typed action wrappers (Item 61) if available.
- Implementation Plan: Needs discovery. Design decisions required: preset scope (which patterns), API shape (factory functions vs. builder mixins), relationship to Cookbook recipes, package placement, and whether the right answer is an SDK API at all versus Cookbook-first guidance or a narrower helper layer.
- Definition of Done: TBD after design scoping.
- Acceptance Criteria: TBD after design scoping.
- Story Points: TBD (requires discovery before estimation)
- Status: new
- Completed At: N/A
- Notes/Links: Signal from `gpt/new_functions.md` §6. Novel concept — no prior backlog precedent.

### Item 66: CLI short flags for render input/output

- Why: `ghawb render` and `ghawb render-batch` currently require verbose `--input` / `--output` flags for every mapping. Short aliases `-i` and `-o` would reduce command noise and make repeated CLI usage less tedious, especially in batch mode and shell snippets.
- Prerequisites: None. Builds on the existing render and render-batch argument parser.
- Implementation Plan: Add `-i` as a shorthand for `--input` and `-o` as a shorthand for `--output` in both `render` and `render-batch`. Preserve existing long flags unchanged. Update CLI usage text, README examples where appropriate, and tests covering mixed long/short flag usage.
- Definition of Done: The CLI accepts `-i` / `-o` anywhere `--input` / `--output` are currently accepted, with unchanged semantics and validation behavior. Tests, docs, and code review completed.
- Acceptance Criteria: `ghawb render -i workflows/ci.ts -o .github/workflows/ci.yml` works. `ghawb render-batch` accepts repeated `-i` / `-o` pairs. Existing long-flag usage remains backward compatible.
- Story Points: 1
- Status: new
- Completed At: N/A
- Notes/Links: User-requested CLI ergonomics improvement after Sprint 18.

### Item 67: CLI inferred default output path for render

- Why: Requiring `--output` for the common case creates friction when the desired destination is the conventional `.github/workflows/<name>.yml`. Inferring the output path from the input filename would make the CLI more convenient for routine repository-local rendering.
- Prerequisites: Item 66 is adjacent but not technically required. Depends on clarifying the supported inference contract before implementation.
- Implementation Plan: Design and implement a default-output rule for `ghawb render` that derives `.github/workflows/<input-basename>.yml` when `--output` is omitted. Clarify whether the same rule applies to `render-batch`, what happens for non-`.ts` inputs, and whether inference is limited to repository-local workflow source paths. Update CLI help text, README, SPEC, and tests.
- Definition of Done: `ghawb render --input workflows/ci.ts` can emit `.github/workflows/ci.yml` without an explicit `--output`, under a documented and tested inference contract. Documentation and code review completed.
- Acceptance Criteria: Omitting `--output` on `render` writes to the inferred `.github/workflows/<basename>.yml` path for supported inputs. The inference rule is documented precisely, including error behavior when inference is unsupported or ambiguous. Existing explicit `--output` usage remains unchanged.
- Story Points: 2
- Status: new
- Completed At: N/A
- Notes/Links: User-requested CLI ergonomics improvement after Sprint 18. Requires a documented contract for output-path inference to avoid implicit behavior drift.

### Item 68: Remaining niche trigger support

- Why: The project still advertises a small set of unsupported trigger types in `README.md` and `docs/SYNTAX_COVERAGE.md`, leaving a visible syntax-coverage gap after the major trigger work is otherwise complete. Closing the remaining niche trigger set would reduce the "mostly complete except for edge cases" status of the SDK.
- Prerequisites: None. Builds on the existing trigger model/builder/validation/renderer/conformance pattern.
- Implementation Plan: Implement the remaining explicitly documented unsupported workflow triggers, starting with `branch_protection_rule` and `deployment_protection_rule`, and reconcile whether a scoped set of GitHub App events should be included in the same slice or split into a follow-up item. Update builder APIs, validation, rendering, conformance fixtures, `docs/SPEC.md`, `docs/SYNTAX_COVERAGE.md`, and README support claims.
- Definition of Done: The currently documented unsupported niche triggers are either implemented or explicitly re-scoped into a narrower follow-up backlog item with updated docs. Tests, cross-runtime conformance coverage, documentation, and code review completed.
- Acceptance Criteria: `branch_protection_rule` and `deployment_protection_rule` are supported through the SDK and renderer with documented behavior. Any remaining GitHub App event gap is documented precisely rather than described vaguely. The corresponding rows are removed or narrowed in `docs/SYNTAX_COVERAGE.md` and README.
- Story Points: 3
- Status: new
- Completed At: N/A
- Notes/Links: Intake from README "Not Yet Supported" and `docs/SYNTAX_COVERAGE.md` "Not Yet Supported Triggers".

### Item 69: Composite action definition support

- Why: Composite actions remain the only feature listed under `docs/SYNTAX_COVERAGE.md` "Not Yet Supported Features". Although they are actions-level rather than workflow-level, their absence leaves an obvious capability gap for users who want to author reusable action logic in the same type-safe ecosystem.
- Prerequisites: Needs design clarification because composite actions sit adjacent to, but outside, the current workflow-focused core contract.
- Implementation Plan: Design a composite-action authoring slice that preserves the project's architecture rules. Decisions required: whether support lives in `@ghawb/sdk` or a separate package, what action-level AST surface is needed, how metadata and outputs map to the existing validation style, and whether YAML emission remains CLI-driven or gets a dedicated action emitter path. After design clarification, implement the minimal composite-action definition surface with docs and tests.
- Definition of Done: A documented and tested path exists for authoring composite action definitions, or a deliberate package/scope split is recorded if the work must ship outside the current workflow-focused package boundary. Code review and spec/doc updates completed.
- Acceptance Criteria: Users can define a composite action through a documented API that renders valid `action.yml` output for the supported slice. The unsupported-feature entry for composite actions is removed or narrowed with explicit scope notes. Architecture and package-boundary decisions are documented.
- Story Points: 5
- Status: new
- Completed At: N/A
- Notes/Links: Intake from `docs/SYNTAX_COVERAGE.md` "Not Yet Supported Features". Likely requires design-first slicing before sprint commitment.

- Historical note: Prior intake rationale, older priority adjustments, and prior sprint-selection decisions were moved to [PRODUCT_BACKLOG_HISTORY.md](./PRODUCT_BACKLOG_HISTORY.md) so this file stays focused on the active backlog.
- Sprint 16 selection note: Items 51–55 (19 SP total) were committed to Sprint 16 after estimate validation and acceptance-criteria refinement. See [Sprint 16 Backlog](./sprint_backlogs/sp16.md) for committed scope and planning notes.
- Sprint 17 selection note: Items 57–60 (discovery intake, 6 SP) and Item 56 (prior backlog, 2 SP) were committed to Sprint 17 for a total of 8 SP. Items 57–60 address quality-gate, coverage-enforcement, documentation-accuracy, and date-integrity gaps identified during product discovery as release prerequisites. Items 61–65 were added to the backlog from feature proposals (`gpt/new_functions.md`) but deferred to post-release sprints per PO decision. See [Sprint 17 Backlog](./sprint_backlogs/sp17.md) for committed scope and planning notes.
- Sprint 18 selection note: Items 61, 62, 63, and 64 were committed to Sprint 18 for a total of 13 SP. The PO explicitly chose continued feature maturation over a `0.1.0` release decision, so Sprint 18 proceeds as a feature-expansion sprint while `0.1.0` remains unreleased. Item 65 was deferred because it still requires discovery and estimate refinement. See [Sprint 18 Backlog](./sprint_backlogs/sp18.md) for committed scope and planning notes.
- Sprint 18 review decision: Sprint 18 delivered all committed scope (Items 61–64, 13/13 SP) without carry-over. No active-backlog reprioritization is needed because only Item 65 remains. The next priority is discovery for Item 65 before Sprint 19 planning; the standing PO decision remains that `0.1.0` stays unreleased until the product is mature enough. See [Sprint 18 Review](./sprint_reviews/sp18.md).
- Sprint 18 retrospective decision: Item 65 discovery should explicitly compare at least three options before Sprint 19 planning: Cookbook-only guidance, a narrow helper API, and a broader preset/recipe layer. Sprint 18 reinforced the product preference for additive explicit APIs over magic abstractions. See [Sprint 18 Retrospective](./sprint_retrospectives/sp18.md).

## Sprint Backlog Records

- [Sprint 1 Backlog](./sprint_backlogs/sp1.md)
- [Sprint 2 Backlog](./sprint_backlogs/sp2.md)
- [Sprint 3 Backlog](./sprint_backlogs/sp3.md)
- [Sprint 4 Backlog](./sprint_backlogs/sp4.md)
- [Sprint 5 Backlog](./sprint_backlogs/sp5.md)
- [Sprint 6 Backlog](./sprint_backlogs/sp6.md)
- [Sprint 7 Backlog](./sprint_backlogs/sp7.md)
- [Sprint 8 Backlog](./sprint_backlogs/sp8.md)
- [Sprint 9 Backlog](./sprint_backlogs/sp9.md)
- [Sprint 10 Backlog](./sprint_backlogs/sp10.md)
- [Sprint 11 Backlog](./sprint_backlogs/sp11.md)
- [Sprint 12 Backlog](./sprint_backlogs/sp12.md)
- [Sprint 13 Backlog](./sprint_backlogs/sp13.md)
- [Sprint 14 Backlog](./sprint_backlogs/sp14.md)
- [Sprint 15 Backlog](./sprint_backlogs/sp15.md)
- [Sprint 16 Backlog](./sprint_backlogs/sp16.md)
- [Sprint 17 Backlog](./sprint_backlogs/sp17.md)
- [Sprint 18 Backlog](./sprint_backlogs/sp18.md)
