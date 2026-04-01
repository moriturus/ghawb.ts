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

### Item 36: Display name fields (`run-name` and job `name`)

- Why: The GPT review syntax matrix identified `run-name` (workflow-level) and `jobs.<job_id>.name` (job-level) as unsupported. Both are widely used in real CI workflows for dynamic run naming and readable job display names. They are simple string fields with no complex validation beyond non-blank requirements.
- Prerequisites: None.
- Implementation Plan: Add optional `runName` to the workflow model, add optional `name` to the job model, add builder methods, add render payload entries at the correct canonical positions, add validation (non-blank string), add conformance fixtures.
- Definition of Done: Both fields are modeled, buildable, validated, rendered in canonical order, covered by unit tests and cross-runtime conformance fixtures, and documented in SPEC.md. Code review completed.
- Acceptance Criteria: `run-name` renders immediately after `name` at workflow level. Job `name` renders as the first field before `if` in both step-based and reusable-workflow job field orders. Blank values are rejected at build time. Expressions are accepted as string values.
- Story Points: 2
- Status: ready
- Completed At: N/A
- Notes/Links: [syntax-support-matrix.md](../gpt_reviews/syntax-support-matrix.md)

### Item 37: Job deployment `environment` support

- Why: The GPT review identified `jobs.<job_id>.environment` as unsupported. Environment is required for deployment protection rules and environment-scoped secrets in GitHub Actions. It supports both a simple string form (name only) and an object form with `name` and optional `url`.
- Prerequisites: None.
- Implementation Plan: Add `Environment` type to the model (string | {name, url}). Add builder method on the job builder. Add validation (non-blank name, non-blank url if present). Add render payload entry in the step-based job field order. Add conformance fixtures for both string and object forms.
- Definition of Done: Environment field is modeled, buildable, validated, rendered in canonical order, covered by unit tests and cross-runtime conformance fixtures, and documented in SPEC.md. Reusable-workflow jobs reject `environment` at build time. Code review completed.
- Acceptance Criteria: String form renders as `environment: <name>`. Object form renders as `environment: { name: ..., url: ... }`. Blank `name` rejected. Blank `url` rejected when present. Reusable-workflow jobs reject environment. Canonical field position defined before implementation per Sprint 9 rule.
- Story Points: 3
- Status: ready
- Completed At: N/A
- Notes/Links: [syntax-support-matrix.md](../gpt_reviews/syntax-support-matrix.md)

### Item 38: `pull_request_target` trigger

- Why: The GPT review identified `pull_request_target` as unsupported. It is used in workflows that need access to repository secrets when processing PRs from forks — a common pattern for CI on open-source projects. It shares the same filter structure as `pull_request` (branches, paths, types).
- Prerequisites: None.
- Implementation Plan: Add `pull_request_target` to the trigger model reusing the `pull_request` filter infrastructure (branches, branches-ignore, paths, paths-ignore, types with the same activity type allowlist). Add builder method. Add rendering in the canonical trigger key order. Add validation following `pull_request` rules. Add conformance fixtures.
- Definition of Done: `pull_request_target` trigger is modeled, buildable, validated, rendered, covered by unit tests and cross-runtime conformance fixtures, and documented in SPEC.md with canonical trigger key order updated. Code review completed.
- Acceptance Criteria: Same filter options as `pull_request`. Same activity type allowlist. Same mutual exclusion rules for branch/path filters. Tags/tags-ignore rejected. Renders in canonical trigger order. Duplicate trigger rejected at build time.
- Story Points: 2
- Status: ready
- Completed At: N/A
- Notes/Links: [syntax-support-matrix.md](../gpt_reviews/syntax-support-matrix.md)

### Item 39: `workflow_run` trigger

- Why: The GPT review identified `workflow_run` as unsupported. It enables "deploy after CI passes" and other workflow-chaining patterns by triggering based on the completion or status of other workflows. It has a unique shape distinct from other triggers.
- Prerequisites: None.
- Implementation Plan: Add `workflow_run` trigger to the model with required `workflows` (non-empty string array of workflow names), optional `types` (allowlist: `completed`, `requested`, `in_progress`), and optional `branches`/`branches-ignore` filters (with mutual exclusion). Add builder method, rendering, and validation. Add conformance fixtures.
- Definition of Done: `workflow_run` trigger is modeled, buildable, validated, rendered in canonical trigger order, covered by unit tests and cross-runtime conformance fixtures, and documented in SPEC.md. Code review completed.
- Acceptance Criteria: `workflows` is required and must be a non-empty array of non-blank strings. `types` validated against the fixed allowlist. `branches` and `branches-ignore` are mutually exclusive. `paths`/`tags` filters rejected. Duplicate trigger rejected at build time.
- Story Points: 3
- Status: ready
- Completed At: N/A
- Notes/Links: [syntax-support-matrix.md](../gpt_reviews/syntax-support-matrix.md)

### Item 40: Simple event triggers expansion

- Why: The GPT review identified many event trigger families as unsupported. Most GitHub Actions event triggers follow a simple pattern: an event name with an optional `types` array filtered against a per-event allowlist (or no types at all). Implementing these as a batch significantly widens the syntax coverage percentage at lower marginal cost than individually scoping each one.
- Prerequisites: None.
- Implementation Plan: Add a batch of simple event triggers to the model. Each trigger is either types-only (with a per-event allowlist) or no-configuration. Planned events: `issues`, `issue_comment`, `release`, `create`, `delete`, `fork`, `gollum`, `watch`, `label`, `milestone`, `discussion`, `discussion_comment`, `check_run`, `check_suite`, `deployment`, `deployment_status`, `member`, `merge_group`, `page_build`, `public`, `registry_package`, `status`. For `repository_dispatch`, support optional `types` as client-defined string array without a fixed allowlist. Add builder methods, validation, rendering (all in canonical trigger key order), and conformance fixtures for representative events.
- Definition of Done: All listed event triggers are modeled, buildable, validated, rendered in canonical trigger order, covered by unit tests with representative conformance fixtures, and documented in SPEC.md. Unsupported trigger fields (branch/path/tag filters on events that don't support them) are rejected at build time. Code review completed.
- Acceptance Criteria: Each event trigger renders correctly in isolation and in combination with existing triggers. Events with `types` validate against their per-event allowlist. Events without configurable fields render as bare event keys. `repository_dispatch` accepts arbitrary `types` strings. Duplicate triggers rejected. At least 4 representative conformance fixtures (types-only event, no-config event, repository_dispatch, multi-trigger combination).
- Story Points: 5
- Status: ready
- Completed At: N/A
- Notes/Links: [syntax-support-matrix.md](../gpt_reviews/syntax-support-matrix.md)

### Item 41: Release packaging for npm consumers

- Why: The GPT review identified packaging as the single highest-leverage commercial readiness gap. The current packages ship TypeScript source directly and the CLI requires Bun. Mainstream npm consumers expect built ESM JavaScript with `.d.ts` type declarations and a `node`-executable CLI binary. Without this, adoption by typical Node/npm users is blocked.
- Prerequisites: None (can proceed independently of syntax items).
- Implementation Plan: Add a build step to each package that emits ESM `.js` and `.d.ts` files into `dist/`. Update `package.json` exports to point to `dist/` for npm consumers while preserving source-oriented exports in `jsr.json` for JSR/Bun/Deno. Change CLI shebang from `#!/usr/bin/env bun` to `#!/usr/bin/env node`. Add a `prepublishOnly` or `prepack` script that runs the build. Validate install-to-success from a clean external directory. Update CI to verify built artifacts.
- Definition of Done: All three packages emit built artifacts suitable for npm consumers. CLI is executable via `node`. JSR source publishing remains functional. Build step integrated into CI. Install-to-success validated from a clean directory. SPEC.md distribution section updated. Code review completed.
- Acceptance Criteria: `npm pack` produces a tarball with `dist/` containing `.js` and `.d.ts` files. `npx ghawb render --help` works without Bun installed. JSR publishing continues to use source exports. No runtime regression in Bun, Node, or Deno test suites.
- Story Points: 5
- Status: ready
- Completed At: N/A
- Notes/Links: [commercial-readiness.md](../gpt_reviews/commercial-readiness.md)

### Item 42: Governance and trust documents

- Why: The GPT review identified missing governance assets (CHANGELOG, SECURITY, SUPPORT, versioning) as a commercial readiness gap. External consumers expect these trust signals before adopting a dependency. The project version is still `0.0.0`.
- Prerequisites: None.
- Implementation Plan: Create `CHANGELOG.md` with a conventional-changelog or manual structure. Create `SECURITY.md` with a vulnerability reporting policy. Create `SUPPORT.md` (or an equivalent support section in the README) with issue-reporting guidance, support expectations, and response-time disclaimers. Define a compatibility policy covering supported runtimes and Node versions. Bump version from `0.0.0` to `0.1.0` across all packages. Update SPEC.md to reflect the versioning decision.
- Definition of Done: CHANGELOG.md, SECURITY.md, SUPPORT.md, and compatibility policy exist. Version is `0.1.0` in all package manifests. SPEC.md updated. Code review completed.
- Acceptance Criteria: CHANGELOG.md documents the current feature set as the `0.1.0` entry. SECURITY.md includes a vulnerability reporting process. SUPPORT.md defines where and how to report issues, expected response cadence, and scope of support. Compatibility policy states supported Bun, Node, and Deno version ranges. All `package.json` and `jsr.json` files reflect `0.1.0`.
- Story Points: 3
- Status: ready
- Completed At: N/A
- Notes/Links: [commercial-readiness.md](../gpt_reviews/commercial-readiness.md)

### Item 43: README rewrite and external documentation

- Why: The GPT review found the README is solid for contributors but underpowered for external evaluation. External consumers need a clear value proposition, install instructions, minimal examples, supported-feature summary, and known limitations. The review also recommends publishing an explicit compatibility and unsupported-feature matrix, documenting recommended use with `actionlint`, and precisely describing the scope of the project's "100% coverage" claim (SDK line coverage, not full-surface coverage) to avoid overstating quality messaging.
- Prerequisites: Item 41 (release packaging) should land first so install instructions reference built artifacts. Can begin in parallel if install section is updated last.
- Implementation Plan: Rewrite README with the structure recommended by the review: value proposition, minimal example, install instructions (npm/pnpm/yarn/bun), generated YAML example, supported feature summary, known limitations, CLI usage, verification guidance, links to docs. Add a supported/unsupported syntax summary (can reference the syntax matrix). Add multiple minimal examples for common workflow patterns (CI, deployment, matrix, reusable workflows). Add a section documenting recommended complementary use with `actionlint` for YAML-level static analysis. Clarify coverage language to specify "100% SDK line coverage" rather than unqualified "100% coverage" to address the review's quality messaging weakness.
- Definition of Done: README is rewritten for external consumers. At least 3 minimal examples included. Supported/unsupported feature summary present. Install instructions cover npm, pnpm, yarn, and bun. `actionlint` complementary usage documented. Coverage scope language clarified. All examples verified to compile and render valid YAML. Code review completed.
- Acceptance Criteria: A new user can read the README, install the SDK, write a basic workflow, and render it to YAML following only the README instructions. Known limitations are explicitly listed. The README does not overstate type-safety breadth (addresses review weakness #4). Coverage descriptions specify "SDK line coverage" scope (addresses review weakness #3). `actionlint` is mentioned as a recommended complementary tool for generated YAML validation.
- Story Points: 3
- Status: ready
- Completed At: N/A
- Notes/Links: [commercial-readiness.md](../gpt_reviews/commercial-readiness.md), [overview.md](../gpt_reviews/overview.md)

### Item 44: Typed runner labels for `runs-on`

- Why: The GPT review identified that the project's type-safety claims outrun some important surfaces, with runner labels as the primary example. Currently `runs-on` accepts any string or string array. Adding known GitHub-hosted runner label constants and a union type improves both type safety and the developer experience with IDE autocomplete.
- Prerequisites: None.
- Implementation Plan: Define a `RunnerLabel` union type covering known GitHub-hosted runners (e.g., `ubuntu-latest`, `ubuntu-24.04`, `ubuntu-22.04`, `windows-latest`, `windows-2025`, `windows-2022`, `macos-latest`, `macos-15`, `macos-14`, `macos-13`, and larger runner variants). The `runs-on` builder method accepts `RunnerLabel | string` (or arrays thereof) so custom/self-hosted labels remain supported. Add validation that warns or documents when a label is not in the known set. Export the runner label constants for SDK consumers. Add conformance fixtures.
- Definition of Done: Runner label constants are defined and exported. `runs-on` builder method accepts typed labels with string fallback. Known labels documented in SPEC.md. Conformance fixtures updated. Code review completed.
- Acceptance Criteria: SDK consumers can use `RunnerLabel.UbuntuLatest` or equivalent constants. Custom string labels continue to work. The type system guides users toward known labels via autocomplete. No breaking change to existing `runs-on` string usage.
- Story Points: 3
- Status: ready
- Completed At: N/A
- Notes/Links: [commercial-readiness.md](../gpt_reviews/commercial-readiness.md), [overview.md](../gpt_reviews/overview.md)

### Item 45: Release automation workflow

- Why: The GPT review's Release Improvement Proposal recommends an automated release workflow covering changesets or equivalent versioning, release PRs, tagged npm/JSR publishing, and GitHub Releases with changelog notes. Without this, every release requires manual version bumps, manual publishing, and manual changelog updates — which is error-prone and scales poorly.
- Prerequisites: Item 41 (release packaging) and Item 42 (governance) should land first so the build pipeline and initial CHANGELOG structure exist before automation wraps them.
- Implementation Plan: Adopt changesets (or conventional-changelog with a release script) as the version management system. Add a changeset or release-note requirement to user-facing PRs. Create a release workflow that generates a release PR from `main` with aggregated changelog entries and version bumps. Add a publish workflow triggered by tagged releases that publishes npm and JSR artifacts. Generate GitHub Releases with changelog notes from the release tag. Self-host the release workflow using the SDK if feasible.
- Definition of Done: A release workflow exists that automates version bumps, changelog generation, npm publishing, JSR publishing, and GitHub Release creation. The workflow is tested end-to-end (dry-run or actual publish to a test scope). SPEC.md distribution section updated. Code review completed.
- Acceptance Criteria: Merging a release PR triggers npm and JSR publishing. GitHub Releases are created automatically with changelog notes. Version bumps are consistent across all package manifests. The release workflow is documented in the README or a RELEASING.md guide.
- Story Points: 5
- Status: ready
- Completed At: N/A
- Notes/Links: [commercial-readiness.md §Release Improvement Proposal](../gpt_reviews/commercial-readiness.md)

### Item 46: Type-safety deepening (`uses` helpers, expression helpers, typed action wrappers)

- Why: The GPT review identifies that several important workflow surfaces still rely on raw string literals: `uses` action references, expression strings, and generic `with` payloads. The review explicitly recommends strengthening type safety beyond runner labels to reduce the gap between "typed workflow builder" and "workflow builder with stringly-typed islands." This item addresses the review's Type-Safety Direction priorities #2–4.
- Prerequisites: Item 44 (typed runner labels) should land first as the simpler type-safety introduction. The broader syntax items (36–40) should also be complete so the type-safe surface applies to the widest possible API.
- Implementation Plan: Phase 1: Design a typed `uses` helper that accepts `owner/repo@ref` components and produces validated action reference strings, with branded-type or template-literal-type safety. Phase 2: Introduce expression helper functions for common GitHub Actions contexts (`github.event`, `secrets.*`, `env.*`, `steps.<id>.outputs.*`, `needs.<id>.outputs.*`) that produce validated expression strings. Phase 3: Add typed wrappers for high-value actions (e.g., `actions/checkout`, `actions/setup-node`) with typed `with` payloads. Each phase follows TDD with conformance fixtures. The design must preserve backward compatibility — raw strings must remain accepted alongside typed helpers.
- Definition of Done: At least Phase 1 (typed `uses` helpers) is implemented with builder API, validation, and tests. Phase 2 and 3 scope is confirmed or deferred based on design findings. All changes maintain backward compatibility with existing string-based usage. SPEC.md updated. Code review completed.
- Acceptance Criteria: SDK consumers can construct action references via a typed helper instead of raw strings. The type system catches malformed references at compile time. Raw string `uses` values continue to work without changes. Expression helpers (if implemented) produce correctly formatted `${{ }}` strings. No breaking change to the existing API.
- Story Points: 5
- Status: ready
- Completed At: N/A
- Notes/Links: [overview.md §Type-Safety Direction](../gpt_reviews/overview.md), [commercial-readiness.md §Type-Safety Improvement Proposal](../gpt_reviews/commercial-readiness.md)

- Team intake decision: After Sprint 7 closeout exhausted the previously planned backlog, the whole team agreed to refill the product backlog with ten items that balance workflow-surface expansion, SDK completeness, and distribution readiness. Sprint 8 committed `Item 20` through `Item 23`. Sprint 9 committed `Item 24` through `Item 27`.
- Product Owner intake rationale (Aoi Sakamoto): Prioritize filling the most impactful SDK feature gaps first — `env` maps and trigger completeness are table-stakes for real workflow authoring. Cross-job data flow (`step id` + `job outputs`) and strategy completion follow because they unlock materially new workflow patterns. Distribution readiness is last because the SDK surface must stabilize before external consumers arrive.
- Scrum Master intake rationale (Ren Takahashi): Keep dependency order flat where possible to reduce sequencing friction. Most items have no hard prerequisites, which allows sprint planning flexibility. `Item 29` is intentionally last because it benefits from the broadened surface. The Sprint 7 retrospective rule — every workflow-surface expansion must include cross-runtime conformance fixture updates in the same slice — applies to every item in this intake.
- Developer intake rationale (Mio Kanda — SDK/Architecture): The items preserve the explicit-boundary pattern from ADR 0001. Each item adds one coherent AST surface with builder API, validation, deterministic rendering, and conformance fixtures. No item introduces implicit behavior, discovery, or YAML input.
- Developer intake rationale (Haru Nishimura — Quality/Testing): Every item explicitly includes conformance fixture updates. The ordering allows validation patterns to be established early (env, triggers) and reused in later items (outputs, strategy). Property-based testing for determinism is desirable but not required in this intake scope.
- Developer intake rationale (Yui Morita — Tooling/Workflow): Self-hosting expansion (`Item 29`) is the right capstone because it proves the broader SDK surface in the repository's own workflows. Packaging readiness in the same item gives distribution a concrete starting point without splitting it into a separate slice that might drift.
- Ordered delivery guidance: The remaining backlog was ordered Item 33 → Item 35 → Item 30 → Item 29. Item 29 must stay last. Sprint 10 committed Items 28, 31, 34, and 32 (resequenced: coverage gate before workflow_call). Sprint 11 committed the final four items (Items 33, 35, 30, 29) in the documented priority order. The Sprint 7 retrospective conformance-fixture rule is honored for all SDK-surface items.
- Sprint 10 selection decision: Sprint 10 commits Item 28 (3 SP), Item 31 (2 SP), Item 34 (2 SP), and Item 32 (5 SP) for 12 SP with a 3 SP buffer. Item 34 was resequenced ahead of Item 32 within the sprint because the coverage gate rationale — "validates the 100% coverage goal before more surfaces are added" — favors activating enforcement before the largest surface expansion. The Product Owner approved the intra-sprint resequencing. Item 32's 5 SP estimate was confirmed during refinement (discriminated union complexity already priced in). Canonical field orders for new surfaces (workflow-level defaults position, reusable-workflow job fields, workflow_call trigger fields) were pre-defined during refinement per Sprint 9 retrospective guidance.
- Sprint 9 BOARD triage decision: Eight remaining BOARD items were triaged. Four were closed as already codified in PLAYBOOK.md (#4 DoD evidence map, #6 pre-review consistency, #7 sprint-start doc rules, #8 acceptance criteria review). Four were concretized as product backlog Item 30 (#1 closeout waiting, #2 evidence provenance, #3 verification gate, #5 external proof planning). Sprint 8 retrospective product improvement (identifier format validation) was concretized as Item 31.
- Product Owner priority adjustment (Aoi Sakamoto): Reordered the backlog to Item 28 → Item 31 → Item 30 → Item 29. SDK feature gap (Item 28) first, then validation hardening (Item 31) to solidify the API surface before distribution, then process hardening (Item 30) to improve ceremonies before the capstone sprint, then distribution readiness (Item 29) last as established. Item 31 before Item 30 because external consumer quality gates outweigh internal process friction reduction.
- GPT review intake decision (post-Sprint 9): An external GPT review evaluated the project and identified feature coverage breadth as the primary weakness (commercial quality 6.6/10). The review confirmed Items 28 and 31 as high-priority, and recommended adding broader syntax coverage, coverage measurement, and error diagnostic improvement. The team conducted a full intake discussion below.
- Team GPT review discussion (Mio Kanda — SDK/Architecture): `workflow_call` is architecturally significant because it introduces a new job variant — a reusable-workflow job has `uses` at the job level instead of `steps`. This requires a discriminated union in the job model and mutual exclusion validation. Container/services is a separate but well-scoped surface extension following existing patterns. Both items follow ADR 0001's explicit-boundary pattern and can reuse the existing validation, rendering, and conformance infrastructure.
- Team GPT review discussion (Haru Nishimura — Quality/Testing): Coverage measurement is overdue. The project claims 100% coverage as a goal but has no measurement. Adding a coverage gate is low-effort (Vitest supports it natively) and high-value for credibility. The error diagnostic improvement item is cross-cutting — it touches all existing validation surfaces — so it should come after the validation surfaces stabilize. Sequencing it after Item 31 (identifier validation) and Item 32 (workflow_call) ensures the diagnostic style is applied uniformly.
- Team GPT review discussion (Yui Morita — Tooling/Workflow): Coverage CI gate is straightforward with Vitest's built-in v8 provider. The `coverage` script and CI integration should take 2 SP at most. Error diagnostic improvement is more subjective — the team should agree on a message format convention before implementation starts.
- Team GPT review discussion (Ren Takahashi — Scrum Master): The four new items add 13 SP to the remaining backlog (was 11 SP, now 24 SP). That's roughly 1.5 additional sprints of work. The items are well-scoped and have clear sequencing. Coverage measurement (Item 34) can be placed early because it's infrastructure with no feature dependency. Error diagnostics (Item 35) should come after identifier validation and workflow_call so the diagnostic style applies to the broadest surface.
- Product Owner GPT review priority adjustment (Aoi Sakamoto): The GPT review confirms the team's existing strategy — fill feature gaps first, harden second, distribute last. The review's strongest signal is that feature coverage breadth is the primary weakness. Accordingly: Item 28 stays first (immediate gap fill). Item 31 stays second (validation hardening confirmed by GPT as priority #2). Item 32 (workflow_call) is placed third because it is the single highest-value missing feature — it enables an entirely new composition pattern. Item 34 (coverage) is placed fourth because it is low-effort infrastructure that validates the 100% coverage goal before more surfaces are added. Item 33 (container/services) is placed fifth as the next syntax expansion. Item 35 (error diagnostics) is placed sixth because it is cross-cutting and benefits from a stabilized surface. Item 30 (process hardening) remains before the capstone. Item 29 (distribution) remains last. This order optimizes for the GPT review's recommendation: feature breadth → validation → infrastructure → quality → process → distribution.
- Sprint 7 retrospective guidance remains in force: every workflow-surface expansion must add or update shared cross-runtime conformance fixtures in the same slice, and the explicit repository-local workflow contract must not be silently widened.
- Sprint 11 selection decision: Sprint 11 commits Item 33 (3 SP), Item 35 (3 SP), Item 30 (2 SP), and Item 29 (4 SP) for 12 SP with a 3 SP buffer. This is the final sprint — all remaining product backlog items are committed in the documented priority order. The Product Owner confirmed the execution order: Item 33 → Item 35 → Item 30 → Item 29. Item 35 benefits from Item 33 landing first so the container/services validation surface adopts the new diagnostic message format from the start. Item 29 stays last per the established capstone rule. An error message enrichment convention was approved during planning: `[scope] [field] [constraint]. Expected: [format/values]. [optional fix suggestion]`, preserving existing prefix structure.
- Post-Sprint 11 GPT review intake decision: A second external GPT review evaluated the project after all 35 items were delivered. The overall score rose from 6.6/10 to 8/10, confirming that the core implementation quality is high. The review identified three gap themes: (1) syntax coverage breadth (60% practical / 30% full GitHub Docs surface), (2) commercial release maturity (packaging, governance, documentation — rated "medium-low"), and (3) type-safety depth (runner labels, uses references, expression helpers still string-typed). The review's #1 recommendation is to prepare the project for external consumption rather than continuing to refine only the core. The team conducted a full intake discussion below. A subsequent coverage audit identified five additional gaps in the initial intake; the team added Items 45–46 and amended Items 42–43 to achieve full review coverage.
- Team GPT review discussion (Mio Kanda — SDK/Architecture): The syntax coverage items are mechanically familiar — they follow the same model/builder/validation/rendering/conformance pattern used for the last 20+ items. `pull_request_target` directly reuses `pull_request` infrastructure. `workflow_run` introduces a new trigger shape (required `workflows` list) but nothing architecturally novel. The simple event triggers batch (Item 40) is large in count (~23 events) but low in per-event complexity — most are "event name + optional types allowlist." Display names and environment are single-field additions. Release packaging (Item 41) is the only architecturally significant change: it introduces a build step for the first time, which changes the development and publishing workflow. This should be scoped carefully so the source-first development experience (Bun/JSR/Deno) is not degraded. Typed runner labels (Item 44) are a modest type-safety improvement — they add a known-label union type without breaking the existing string fallback. The deeper type-safety items (Item 46 — typed `uses` helpers, expression helpers, typed action wrappers) are architecturally more ambitious. They require careful API design to preserve backward compatibility while adding genuine compile-time safety. A phased approach with Phase 1 (`uses` helpers) delivered first and Phases 2–3 scoped during implementation is the right way to manage design risk. Release automation (Item 45) is tooling infrastructure that wraps the packaging pipeline from Item 41 — it should come after packaging and governance are established.
- Team GPT review discussion (Haru Nishimura — Quality/Testing): The Sprint 7 conformance-fixture rule applies to all syntax-expansion items (Items 36–40, 44). Each must include cross-runtime conformance fixtures in the same slice. The simple event triggers batch (Item 40) should include at least 4 representative conformance fixtures rather than one per event — the pattern is uniform enough that representative coverage is sufficient without testing all 23 events individually. The governance item (Item 42) introduces `CHANGELOG.md`, `SECURITY.md`, and `SUPPORT.md` which don't need code tests, but the version bump to `0.1.0` must be verified across all package manifests. The README rewrite (Item 43) should include examples that actually compile and render — ideally verified in CI or at least manually during code review. The `actionlint` guidance in Item 43 is important: it clarifies that `ghawb` handles authoring-time safety while `actionlint` handles YAML-level static analysis, and the two are complementary rather than competing. The coverage scope clarification (also Item 43) resolves the review's weakness #3 — "100% SDK line coverage" is precise and defensible, while unqualified "100% coverage" is not. For Item 46 (type-safety deepening), the phased approach is essential — we should validate the `uses` helper design with real tests before committing to expression helpers or action wrappers.
- Team GPT review discussion (Yui Morita — Tooling/Workflow): Release packaging (Item 41) is the item I'm most interested in. The current source-only publishing works for Bun and JSR but is a real barrier for npm consumers. The build step should use `tsc` for type declarations and a bundler or `tsc` emit for ESM output. The CLI shebang change from `bun` to `node` is simple but important for mainstream adoption. I'd suggest we also add a `prepublishOnly` script so `npm publish` always includes fresh built artifacts. Release automation (Item 45) extends this with a proper release workflow — changesets is the natural fit for our monorepo workspace. The key decision is whether to use `@changesets/cli` or a lighter custom script. For the README (Item 43), the review's proposed structure is good — one-paragraph value proposition, install instructions for all package managers, and a generated YAML example are the minimum. The `actionlint` documentation will help users understand that `ghawb` and `actionlint` serve different layers and should be used together. I can help with the install instructions, CLI usage, and `actionlint` guidance sections.
- Team GPT review discussion (Ren Takahashi — Scrum Master): The eleven items total 39 SP, which is roughly 2.5–3 sprints at our 15 SP capacity. Dependencies are mostly flat: Items 36–40 and 44 are independent syntax expansions. Item 42 (governance) is independent of everything. Item 41 (packaging) is independent of syntax. Item 43 (README) has a soft dependency on Item 41 for install instructions but can be started in parallel. Item 45 (release automation) depends on both Item 41 and Item 42. Item 46 (type-safety deepening) depends on Item 44 and benefits from Items 36–40 being complete. The dependency chain is: `{36–40, 44}` (flat) → `{41, 42}` (flat) → `43` (soft dep on 41) → `45` (depends on 41+42) → `46` (depends on 44, benefits from 36–40). This is manageable — the first sprint can mix syntax and commercial readiness, and the later sprints handle automation and type-safety.
- Product Owner GPT review priority adjustment (Aoi Sakamoto): The second GPT review recommends prioritizing external readiness, but the stakeholder direction is clear: syntax coverage breadth and type-safety depth should come first, with external readiness deferred until the SDK surface is substantially more complete. The current 60% practical coverage is not enough to justify packaging and publishing — external consumers who adopt early will immediately hit missing features, undermining trust. The proven strategy from Sprints 1–11 — syntax first, package last — continues to apply. Final priority order: Item 36 (display names, 2 SP) first — visibly missing in every CI workflow, cheap to add. Item 37 (environment, 3 SP) second — deployment workflows require this. Item 38 (pull_request_target, 2 SP) third — fills a common open-source CI pattern. Item 39 (workflow_run, 3 SP) fourth — enables CI-to-deploy chaining. Item 40 (event triggers, 5 SP) fifth — the largest syntax breadth expansion, bringing practical coverage well above 60%. Item 44 (typed runner labels, 3 SP) sixth — the first concrete type-safety deepening step. Item 46 (type-safety deepening, 5 SP) seventh — typed `uses` helpers, expression helpers, action wrappers in phased delivery. Item 43 (README, 3 SP) eighth — rewrite for external consumers once the SDK surface is substantially wider. Item 41 (packaging, 5 SP) ninth — npm build pipeline after the product is worth packaging. Item 42 (governance, 3 SP) tenth — trust signals ship alongside packaging. Item 45 (release automation, 5 SP) last — automates the pipeline after all other pieces are in place. This order optimizes for: syntax breadth → type-safety deepening → external readiness. Items 36+37+38+39+40 (15 SP) form a "syntax breadth sprint," Items 44+46+43 (11 SP) form a "type-safety + docs sprint," and Items 41+42+45 (13 SP) form an "external readiness sprint." Exact sprint cuts will be determined during sprint planning.

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
