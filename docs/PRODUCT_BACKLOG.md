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

### Item 79: Standardize repository-owned workflows and examples on Node 24 defaults

- Why: The product compatibility policy is already `Node 24+`, but repository-owned workflow sources and public examples still contain older Node 22 defaults. That drift weakens the self-hosting story and makes the most visible examples lag behind the documented runtime contract.
- Prerequisites: None.
- Implementation Plan: Audit committed `workflows/*.ts`, README examples, Cookbook examples, and reusable-workflow snippets for Node version defaults, then update the maintained defaults and examples to Node 24 where they represent the current recommended path. Regenerate affected workflow YAML and update any specification text that still embeds older defaults.
- Definition of Done: Repository-owned workflow sources and maintained public examples consistently use Node 24 as the default version where the project intends to model the recommended path, generated workflow outputs stay in sync, and the change completes with code review.
- Acceptance Criteria: `workflows/manual-verify.ts` no longer pins Node 22, maintained README/Cookbook examples no longer present Node 22 as the default happy path, generated `.github/workflows/*.yml` outputs are updated when source modules change, and docs/SPEC remain internally consistent with the `Node 24+` compatibility policy.
- Story Points: 2
- Status: proposed
- Completed At: N/A
- Notes/Links: Intake created from Sprint 23 product discovery and Product Owner reprioritization. Evidence: [Specification](./SPEC.md), [README](../README.md), [Cookbook](./COOKBOOK.md), and committed workflow sources under [`workflows/`](../workflows).

### Item 80: Extend workflow guardrails to enforce current repository authoring conventions

- Why: `bun run verify:workflows` currently proves layout correctness and generated-workflow drift, but it does not enforce the repository's current self-hosting conventions such as the agreed Node default and other maintained workflow-authoring expectations. That leaves convention drift detectable only through manual review.
- Prerequisites: Item 79. The repository should first settle the current preferred workflow defaults before turning them into automated guardrails.
- Implementation Plan: Extend the existing workflow guardrail path, or add a closely related command within the same verification surface, so committed workflow source modules are checked against a reviewed set of repository-owned conventions. Keep the scope narrow to the repository's self-hosted workflow contract rather than attempting broad GitHub Actions style linting.
- Definition of Done: The repository's workflow guardrail path fails when committed workflow sources drift from the reviewed self-hosting conventions, the supported convention set is documented, and the change completes with code review.
- Acceptance Criteria: At least the maintained Node default and other agreed current workflow-source conventions are checked automatically; the new checks integrate with the existing `verify:workflows` / `verify:pre-push` flow; failures name the drifting source module clearly; and the new guardrail remains scoped to repository-owned workflow conventions rather than generic workflow linting.
- Story Points: 3
- Status: proposed
- Completed At: N/A
- Notes/Links: Intake created from Sprint 23 product discovery. Evidence: [Sprint 23 Review](./sprint_reviews/sp23.md), [Contributing](./CONTRIBUTING.md), and [`scripts/verify-workflows.ts`](../scripts/verify-workflows.ts).

### Item 81: Fold `render-batch` into `render` and deprecate the batch-specific command

- Why: The current CLI splits workflow rendering across `render` and `render-batch`, but the two commands differ only in whether they accept one target or multiple explicit `--input` / `--output` pairs. That extra command surface increases learning cost without providing a distinct product capability.
- Prerequisites: None.
- Implementation Plan: Extend `ghawb render` so it accepts either one target or multiple explicit `--input` / `--output` pairs, preserve the existing single-target output-path inference only when exactly one target is rendered, and keep `render-batch` as a compatibility alias that delegates to the unified `render` path with deprecation guidance.
- Definition of Done: The primary workflow-rendering contract is a single `render` command that supports both single-target and multi-target authoring flows, compatibility coverage exists for the migrated batch path, documentation is updated, and the change completes with code review.
- Acceptance Criteria: `ghawb render -i a.ts -o a.yml -i b.ts -o b.yml` succeeds as the supported multi-target path; single-target inference for `workflows/<name>.ts` still works only when a single render target is present; `render-batch` remains available only as a compatibility/deprecation path; tests cover both direct multi-target rendering and the alias behavior; docs and SPEC describe `render` as the canonical command.
- Story Points: 3
- Status: proposed
- Completed At: N/A
- Notes/Links: Intake created from Product Owner follow-up after Sprint 23 discovery. Rationale: batch-specific command surface is redundant when rendering semantics remain otherwise identical. See [Sprint 23 Review](./sprint_reviews/sp23.md) and [Specification](./SPEC.md).

### Item 82: Unify `render-action` under `render` with explicit kind selection or safe export auto-detection

- Why: Unlike `render-batch`, `render-action` still reflects a real distinction in rendered artifact type and validation behavior, but the long-term CLI can still be simpler if workflow and composite-action rendering converge behind one `render` entrypoint.
- Prerequisites: Item 81. The workflow rendering contract should be unified first so action unification builds on the final `render` shape rather than on a superseded command split.
- Implementation Plan: Design and implement a single-entry rendering contract for workflows and composite actions, choosing either an explicit `--kind workflow|action` flag or safe export-type auto-detection as the supported path. Preserve existing validation clarity, keep workflow-only output inference scoped to supported workflow sources, and provide a compatibility path for existing `render-action` callers before eventual removal.
- Definition of Done: `render` can handle both workflow and composite-action rendering through one reviewed contract, the chosen disambiguation strategy is documented and tested, backward compatibility is handled explicitly, and the change completes with code review.
- Acceptance Criteria: The unified command makes it clear whether the input is treated as a workflow or composite action; invalid or ambiguous inputs fail with explicit diagnostics; workflow output inference remains limited to the documented `workflows/<name>.ts` path; composite-action output handling remains explicit unless a reviewed replacement is adopted; `render-action` is either a deprecated alias or remains only as a temporary compatibility shim; docs and SPEC reflect the new canonical CLI.
- Story Points: 5
- Status: proposed
- Completed At: N/A
- Notes/Links: Intake created from Product Owner follow-up after Sprint 23 discovery. This item intentionally keeps the design choice between `--kind` and safe export auto-detection open inside the backlog item because both are plausible unification paths and should be decided during implementation refinement. See [Sprint 23 Review](./sprint_reviews/sp23.md) and [Specification](./SPEC.md).

### Item 83: Design CLI config-manifest support for workflow and action rendering

- Why: Users want to inject render configuration through JSON, YAML, or TOML files, but the CLI does not yet define a stable config schema, precedence order, or command-scope boundary for that capability. The config contract should be designed after the canonical `render` command surface is settled so the first config slice targets the right abstraction.
- Prerequisites: Item 81. Item 82 may inform the final scope, but this item should at minimum decide whether composite-action rendering is in scope or intentionally deferred for the first config slice.
- Implementation Plan: Define a CLI-owned config schema and precedence model for render commands, covering allowed target declarations, format support (JSON / YAML / TOML), flag-overrides-config behavior, and explicit out-of-scope cases. Keep the responsibility at the CLI edge rather than expanding the SDK or core renderer into a general config-loading layer.
- Definition of Done: A reviewed CLI config contract exists for render flows, the scope boundary is documented in SPEC and CLI-facing docs, and the chosen contract is ready to implement without reopening the command-surface decisions from Items 81 and 82.
- Acceptance Criteria: The config design states how multiple targets are declared, how JSON/YAML/TOML inputs are interpreted, what wins between CLI flags and config values, whether composite-action rendering is supported in the first slice, and which invalid shapes fail explicitly; the design keeps config parsing at the CLI boundary rather than in the SDK.
- Story Points: 2
- Status: proposed
- Completed At: N/A
- Notes/Links: Intake created from Sprint 23 product discovery and direct user request for config-file injection. Evidence: [`packages/cli/src/index.ts`](../packages/cli/src/index.ts), [ADR 0001](./adrs/0001-record-architecture-principles.md), and [Specification](./SPEC.md).

### Item 84: Add JSON/YAML/TOML config-file injection support to the CLI render flow

- Why: The CLI currently requires direct command-line declaration of render targets, which is workable for ad hoc usage but repetitive for stable repository workflows. A reviewed config-manifest path would make repeated rendering flows easier to maintain and easier to combine with self-hosted workflow generation.
- Prerequisites: Item 83.
- Implementation Plan: Implement the approved config-loading path for JSON, YAML, and TOML manifests, add validation and diagnostics for invalid configs, wire the result into the canonical `render` flow, and cover the supported happy/error paths with CLI tests. Preserve explicit errors and keep SDK/core packages free of config parsing concerns.
- Definition of Done: The CLI can load supported render configuration files from JSON, YAML, and TOML according to the reviewed contract, tests cover the supported precedence and error behavior, docs are updated, and the change completes with code review.
- Acceptance Criteria: Equivalent JSON/YAML/TOML manifests drive equivalent render behavior; invalid config structure fails with explicit diagnostics; flag overrides behave exactly as documented; the implementation works with the canonical `render` command shape; and docs/SPEC describe the new supported path clearly.
- Story Points: 5
- Status: proposed
- Completed At: N/A
- Notes/Links: Intake created from Sprint 23 product discovery and direct user request for config-file injection. See [Specification](./SPEC.md) and [`packages/cli/src/cli.test.ts`](../packages/cli/src/cli.test.ts).

### Item 85: Resync README, Cookbook, and API-facing docs with the current product contract

- Why: Public docs are part of the product surface, and recent discovery confirmed concrete drift across Node defaults, self-hosting examples, and CLI expectations. The repository has already treated docs alignment as a deliverable in sprint review, so the remaining product-discovery output should explicitly track documentation sync work.
- Prerequisites: Items 79, 81, and any earlier accepted CLI contract changes that materially alter the recommended authoring path.
- Implementation Plan: Audit README, Cookbook, API reference, and adjacent user-facing docs for contract drift against the shipped implementation and the newly accepted backlog decisions. Update examples, command guidance, package-boundary guidance, and cross-links so the published docs present one consistent product story.
- Definition of Done: Maintained public docs reflect the current implementation and accepted product decisions, the examples are internally consistent, and the change completes with code review.
- Acceptance Criteria: README, Cookbook, and API-facing docs align on Node 24 defaults, the canonical render command surface, current package boundaries, and current helper usage patterns; affected cross-links remain correct; and no known public-doc contradiction remains across those maintained surfaces.
- Story Points: 2
- Status: proposed
- Completed At: N/A
- Notes/Links: Intake created from Sprint 23 product discovery. Evidence: [Sprint 23 Review](./sprint_reviews/sp23.md), [README](../README.md), [Cookbook](./COOKBOOK.md), and [API Reference](./API_REFERENCE.md).

### Item 86: Add automated drift checks for maintained docs and examples

- Why: Updating docs once is not enough if the repository lacks an automated way to detect when maintained examples drift from the product contract again. Discovery identified repeated value in using repository-owned examples as product proof, so those examples should gain stronger automated protection.
- Prerequisites: Item 85. The repository should first align the maintained docs with the intended product contract before codifying drift detection against that contract.
- Implementation Plan: Add a narrow automated verification path for maintained docs and examples, such as snippet-oriented checks, invariant assertions, or other documentation guardrails that fit the repository's tooling. Focus on the highest-value contract surfaces rather than trying to compile or execute every documentation fragment.
- Definition of Done: The repository has a reviewed automated mechanism that detects drift in the highest-value maintained docs/examples, the new checks are documented, and the change completes with code review.
- Acceptance Criteria: At least the maintained Node default, canonical render command guidance, and key helper/example conventions are checked automatically in README/Cookbook/API-facing docs; failures are actionable; and the new guardrail integrates cleanly with the repository's existing verification flow without broad speculative tooling.
- Story Points: 3
- Status: proposed
- Completed At: N/A
- Notes/Links: Intake created from Sprint 23 product discovery. Evidence: [Sprint 23 Review](./sprint_reviews/sp23.md), [Sprint 23 Retrospective](./sprint_retrospectives/sp23.md), and [Contributing](./CONTRIBUTING.md).

## Notes

- Sprint 23 product-discovery decision: New intake after Sprint 23 created Items 79–86. The Product Owner prioritized repository-owned Node 24 and workflow-convention hardening first (Items 79–80), then CLI surface simplification (Items 81–82), then config-manifest design and implementation (Items 83–84), and finally public-doc sync plus drift protection (Items 85–86).
- Historical note: Prior intake rationale, older priority adjustments, and prior sprint-selection decisions were moved to [PRODUCT_BACKLOG_HISTORY.md](./PRODUCT_BACKLOG_HISTORY.md) so this file stays focused on the active backlog.
- Sprint 16 selection note: Items 51–55 (19 SP total) were committed to Sprint 16 after estimate validation and acceptance-criteria refinement. See [Sprint 16 Backlog](./sprint_backlogs/sp16.md) for committed scope and planning notes.
- Sprint 17 selection note: Items 57–60 (discovery intake, 6 SP) and Item 56 (prior backlog, 2 SP) were committed to Sprint 17 for a total of 8 SP. Items 57–60 address quality-gate, coverage-enforcement, documentation-accuracy, and date-integrity gaps identified during product discovery as release prerequisites. Items 61–65 were added to the backlog from feature proposals (`gpt/new_functions.md`) but deferred to post-release sprints per PO decision. See [Sprint 17 Backlog](./sprint_backlogs/sp17.md) for committed scope and planning notes.
- Sprint 18 selection note: Items 61, 62, 63, and 64 were committed to Sprint 18 for a total of 13 SP. The PO explicitly chose continued feature maturation over a `0.1.0` release decision, so Sprint 18 proceeds as a feature-expansion sprint while `0.1.0` remains unreleased. Item 65 was deferred because it still requires discovery and estimate refinement. See [Sprint 18 Backlog](./sprint_backlogs/sp18.md) for committed scope and planning notes.
- Sprint 18 review decision: Sprint 18 delivered all committed scope (Items 61–64, 13/13 SP) without carry-over. No active-backlog reprioritization is needed because only Item 65 remains. The next priority is discovery for Item 65 before Sprint 19 planning; the standing PO decision remains that `0.1.0` stays unreleased until the product is mature enough. See [Sprint 18 Review](./sprint_reviews/sp18.md).
- Sprint 18 retrospective decision: Item 65 discovery should explicitly compare at least three options before Sprint 19 planning: Cookbook-only guidance, a narrow helper API, and a broader preset/recipe layer. Sprint 18 reinforced the product preference for additive explicit APIs over magic abstractions. See [Sprint 18 Retrospective](./sprint_retrospectives/sp18.md).
- Sprint 19 selection note: Items 65 and 66 were committed to Sprint 19 for a total of 5 SP. The PO chose to preserve a focused discovery-first sequence for the job preset / recipe theme rather than mixing lower-priority CLI, trigger, or composite-action work into the sprint. Items 67 and later remain active backlog in unchanged priority order unless superseded by later intake decisions. See [Sprint 19 Backlog](./sprint_backlogs/sp19.md) for committed scope and planning notes.
- Sprint 19 discovery decision: Item 65 completed by selecting a narrow helper API in `@ghawb/sdk` as the first reusable job-pattern slice and rejecting both cookbook-only guidance and a broader preset framework for Sprint 19. The implementation target for Item 66 is one additive Node CI job helper for the repeated `checkout -> setup-node -> install -> test` sequence. See [ADR 0002](./adrs/0002-scope-job-recipes-to-a-narrow-node-ci-helper.md).
- Sprint 19 review decision: Sprint 19 delivered all committed scope (Items 65 and 66, 5/5 SP) without carry-over. No active-backlog reprioritization was needed at sprint close, and later backlog intake should append behind the standing post-Sprint-19 order unless the Product Owner explicitly reorders items. See [Sprint 19 Review](./sprint_reviews/sp19.md).
- Sprint 19 retrospective decision: Future recipe-style product work should treat `nodeCi()` as evidence for a narrow additive-helper path, not as implicit approval for a broader preset framework. Keep using discovery-first slicing when backlog items still contain unresolved API-boundary questions. See [Sprint 19 Retrospective](./sprint_retrospectives/sp19.md).
- Sprint 20 selection note: `Ad hoc A1`, Items 67, 68, 69, 70a, 70b, 71, and 72 were committed to Sprint 20 for a total of 18 SP. The PO inserted the `npm ci` lockfile/workspace repair as an ad hoc readiness item, split Item 70 into a discovery spike plus a first implementation slice, and deferred Item 73 so Sprint 20 keeps a small planning buffer while preserving strict backlog order. See [Sprint 20 Backlog](./sprint_backlogs/sp20.md) for committed scope and planning notes.
- Sprint 20 review decision: Sprint 20 delivered all committed scope (8/8 items, 18/18 SP) without feature carry-over, and the immediate repository defect from the failing hosted CI closeout was repaired in merged PR #87. The Product Owner has since re-ranked the remaining backlog so hardening-oriented Items 74 and 76 come before Item 73, while the closeout rule still stands that future sprint PRs must wait for hosted GitHub Actions success, not just local verification. See [Sprint 20 Review](./sprint_reviews/sp20.md).
- Sprint 20 retrospective decision: The Product Owner re-ranked the active backlog after Sprint 20 so hardening work now preempts broader documentation or package-boundary expansion: Item 74 first for self-hosted workflow-definition modernization, Item 76 next for stronger Deno compatibility evidence, then Item 73 documentation expansion, and finally Item 75 package-boundary refactoring. This follows the retrospective guidance to prioritize hardening whenever repository-contract drift is discovered. See [Sprint 20 Retrospective](./sprint_retrospectives/sp20.md).
- Sprint 21 selection note: Items 74, 76, and 73 were committed to Sprint 21 for a total of 9 SP. The Product Owner intentionally accepts 11 SP of residual capacity rather than mixing unresolved package-boundary work into a hardening-first sprint. Original Item 75 was split into `Item 75a` (discovery) and `Item 75b` (implementation) and both remain in the product backlog behind the committed Sprint 21 scope. See [Sprint 21 Backlog](./sprint_backlogs/sp21.md) for committed scope and planning notes.
- Sprint 21 review decision: Sprint 21 delivered all committed scope (Items 74, 76, and 73, 9/9 SP) without carry-over. No active-backlog reprioritization is needed; the next backlog order remains Item 75a followed by Item 75b, and the discovery-first gate on package-boundary work remains in force. See [Sprint 21 Review](./sprint_reviews/sp21.md).
- Sprint 21 retrospective decision: Sprint 21 validated the hardening-first delivery order and did not justify reprioritizing the active backlog ahead of Item 75a. The Product Owner appended Item 77 as a separate follow-up for the bounded `@ghawb/yaml-import` Deno compatibility gap discovered during Sprint 21, behind the standing active order of Item 75a then Item 75b. See [Sprint 21 Retrospective](./sprint_retrospectives/sp21.md).
- Sprint 22 selection note: Items 75a and 75b were committed to Sprint 22 for a total of 5 SP. `Item 75b` remains gated on the Item 75a discovery outcome, and the Product Owner explicitly chose not to pull Item 77 into Sprint 22 if discovery recommends retaining `nodeCi()` in `@ghawb/sdk`. See [Sprint 22 Backlog](./sprint_backlogs/sp22.md) for committed scope and planning notes.
- Sprint 22 discovery decision: Item 75a initially recommended retaining `nodeCi()` in `@ghawb/sdk`, but the Product Owner overrode that recommendation based on prior team consensus that `nodeCi()` is too specific for the core SDK. Corrected decision: migrate `nodeCi()` to a new opt-in package `@ghawb/job-helpers`. See [ADR 0005](./adrs/0005-retain-node-ci-helper-in-sdk.md) (superseded) and [ADR 0006](./adrs/0006-migrate-node-ci-helper-to-opt-in-package.md).
- Sprint 22 delivery note: Sprint 22 delivered all committed scope (Items 75a and 75b, 5/5 SP). `nodeCi()` migrated from `@ghawb/sdk` to `@ghawb/job-helpers` per the corrected discovery decision. PR #92 (Item 75a docs) and PR #93 (Item 75b implementation) both merged into sprint-22 branch. See [Sprint 22 Backlog](./sprint_backlogs/sp22.md).
- Sprint 23 selection note: Items 77 and 78 were committed to Sprint 23 for a total of 5 SP. The Product Owner intentionally accepts 15 SP of residual capacity because these are the only active backlog items and the repository forbids skipping order or pulling speculative new work into the sprint simply to fill capacity. See [Sprint 23 Backlog](./sprint_backlogs/sp23.md) for committed scope and planning notes.
- Sprint 23 review decision: Sprint 23 delivered all committed scope (Items 77 and 78, 5/5 SP) without carry-over. No active-backlog reprioritization is needed because no active backlog items remain after sprint closeout; future work should come from new backlog intake or product discovery rather than from reopening Sprint 23 scope. See [Sprint 23 Review](./sprint_reviews/sp23.md).
- Sprint 23 retrospective decision: Sprint 23 validated the narrow hardening-first closeout of the active backlog. The next planning input should come from new backlog intake or product discovery, and any future helper ergonomics work should extend the generic `JobBuilder.apply(...)` pattern rather than reintroducing helper-specific methods into `@ghawb/sdk`. See [Sprint 23 Retrospective](./sprint_retrospectives/sp23.md).

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
- [Sprint 19 Backlog](./sprint_backlogs/sp19.md)
- [Sprint 20 Backlog](./sprint_backlogs/sp20.md)
- [Sprint 21 Backlog](./sprint_backlogs/sp21.md)
- [Sprint 22 Backlog](./sprint_backlogs/sp22.md)
- [Sprint 23 Backlog](./sprint_backlogs/sp23.md)
