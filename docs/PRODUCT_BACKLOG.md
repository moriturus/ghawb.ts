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

### Item 61: Typed action wrappers (Phase 3 of type-safety deepening)

- Why: The current `uses()` accepts a typed `ActionRef` string, but `with` remains a plain `Record<string, string>`. Typed action wrappers (e.g. `actionsCheckout()`, `actionsSetupNode()`) would make `with` parameters type-safe for frequently used actions, reducing configuration errors and improving IDE autocomplete. This was originally Phase 3 of Item 46 and has been consistently identified as the highest-value remaining type-safety improvement.
- Prerequisites: None (Phase 1 typed refs delivered Sprint 13, Phase 2 expression helpers delivered Sprint 16).
- Implementation Plan: Design and implement typed wrapper functions for high-value GitHub Actions. Key design decisions required: manual type definitions vs. code generation from `action.yml` metadata, initial action set selection, action version drift strategy, and package placement (`@ghawb/sdk` vs. separate package). Phased delivery recommended.
- Definition of Done: At least the initial set of typed action wrappers exists with type-safe `with` parameters. Design decisions documented. Tests, `docs/SPEC.md`, and code review completed.
- Acceptance Criteria: Typed wrappers provide IDE autocomplete for `with` parameters. Existing `uses()` string path remains backward compatible. Design rationale for action selection and versioning strategy is documented.
- Story Points: 5–8 (requires estimate refinement after design scoping)
- Status: new
- Completed At: N/A
- Notes/Links: Originally Phase 3 of Item 46. Referenced in `docs/SYNTAX_COVERAGE.md` "Not Yet Supported." Signal from `gpt/new_functions.md` §1 (highest priority new feature proposal).

### Item 62: CLI render+lint integration (`--lint` flag)

- Why: Users currently run `ghawb render` and `ghawb lint` as separate commands. Integrating `actionlint` verification into the render pipeline via a `--lint` flag would reduce the two-step workflow to one step, matching the workflow already recommended in the README.
- Prerequisites: None (builds on Item 53 actionlint bridge, delivered Sprint 16).
- Implementation Plan: Add a `--lint` flag to `render` and `render-batch` commands. When set, invoke `actionlint` on the generated output file(s) after successful rendering. Reuse the existing `lint` command infrastructure (`findExecutable`, `runCommand` DI). Surface `actionlint` output inline. When `actionlint` is not found and `--lint` is specified, exit non-zero with the existing install message.
- Definition of Done: `ghawb render --input ... --output ... --lint` renders and then verifies the output with `actionlint` in a single invocation. Tests and code review completed.
- Acceptance Criteria: `--lint` flag triggers `actionlint` verification after rendering. Missing `actionlint` exits non-zero with install guidance. Existing render behavior without `--lint` is unchanged.
- Story Points: 2
- Status: new
- Completed At: N/A
- Notes/Links: Signal from `gpt/new_functions.md` §3. Builds on Sprint 16 Item 53 infrastructure.

### Item 63: Reusable workflow caller-side outputs

- Why: The SDK supports defining outputs on reusable workflows (`workflow_call.outputs`) but does not yet support consuming those outputs on the caller side. This gap limits SDK-managed multi-workflow data flow.
- Prerequisites: None.
- Implementation Plan: Extend the reusable-workflow job model, builder API, validation, and renderer to support reading outputs from a `usesWorkflow()` job. Follow the standard model/builder/validation/renderer/conformance pattern.
- Definition of Done: Caller-side reusable workflow output access is supported through the builder API. Validation, rendering, and conformance fixtures updated. `docs/SPEC.md` and `docs/SYNTAX_COVERAGE.md` updated. Tests and code review completed.
- Acceptance Criteria: SDK consumers can access outputs from reusable workflow jobs. Rendering matches GitHub Actions expected YAML structure. Feature removed from "Not Yet Supported" in `docs/SYNTAX_COVERAGE.md`.
- Story Points: 3
- Status: new
- Completed At: N/A
- Notes/Links: Listed in `docs/SYNTAX_COVERAGE.md` "Not Yet Supported." Signal from `gpt/new_functions.md` §4.

### Item 64: Expression helper expansion (operators and comparisons)

- Why: The expression helper MVP (Item 51, Sprint 16) covers context references and status-check functions. Users still fall back to raw `${{ }}` strings for comparisons, logical operators, and common conditional patterns. Expanding helpers to cover these would reduce raw-string reliance.
- Prerequisites: None (builds on Item 51 expression helper MVP, delivered Sprint 16).
- Implementation Plan: Design and implement comparison operators, logical operators, and common conditional patterns as composable expression helpers. Preserve the existing `expr()` wrapper and context helpers. Maintain the explicit non-goal of semantic expression evaluation per `docs/SPEC.md`.
- Definition of Done: Expression helpers cover comparison and logical operations. Composability with existing helpers is preserved. Tests, `docs/SPEC.md`, and code review completed.
- Acceptance Criteria: SDK consumers can construct comparison and logical expressions through helpers instead of raw strings. Existing helper API remains backward compatible. Semantic evaluation remains an explicit non-goal.
- Story Points: 3–5 (requires estimate refinement after design scoping)
- Status: new
- Completed At: N/A
- Notes/Links: Sprint 16 retrospective §Product Improvements #3 identified this theme. Signal from `gpt/new_functions.md` §5.

### Item 65: Job preset / recipe API

- Why: Common workflow patterns (Node CI, Bun CI, pnpm install/test) are repeatedly assembled from the same builder calls. A preset or recipe API could reduce boilerplate for standard patterns and bridge the gap between the Cookbook documentation and the SDK API.
- Prerequisites: None. Benefits from typed action wrappers (Item 61) if available.
- Implementation Plan: Needs discovery. Design decisions required: preset scope (which patterns), API shape (factory functions vs. builder mixins), relationship to Cookbook recipes, and package placement.
- Definition of Done: TBD after design scoping.
- Acceptance Criteria: TBD after design scoping.
- Story Points: TBD (requires discovery before estimation)
- Status: new
- Completed At: N/A
- Notes/Links: Signal from `gpt/new_functions.md` §6. Novel concept — no prior backlog precedent.

- Historical note: Prior intake rationale, older priority adjustments, and prior sprint-selection decisions were moved to [PRODUCT_BACKLOG_HISTORY.md](./PRODUCT_BACKLOG_HISTORY.md) so this file stays focused on the active backlog.
- Sprint 16 selection note: Items 51–55 (19 SP total) were committed to Sprint 16 after estimate validation and acceptance-criteria refinement. See [Sprint 16 Backlog](./sprint_backlogs/sp16.md) for committed scope and planning notes.
- Sprint 17 selection note: Items 57–60 (discovery intake, 6 SP) and Item 56 (prior backlog, 2 SP) were committed to Sprint 17 for a total of 8 SP. Items 57–60 address quality-gate, coverage-enforcement, documentation-accuracy, and date-integrity gaps identified during product discovery as release prerequisites. Items 61–65 were added to the backlog from feature proposals (`gpt/new_functions.md`) but deferred to post-release sprints per PO decision. See [Sprint 17 Backlog](./sprint_backlogs/sp17.md) for committed scope and planning notes.

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
