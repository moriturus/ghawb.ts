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

### Item 73: Enrich README and COOKBOOK for stronger onboarding and recipe coverage

- Why: The current README and COOKBOOK cover the baseline surfaces, but they are still relatively thin as onboarding material. Stronger examples, decision guidance, and recipe coverage would reduce time-to-first-success and make the project easier to evaluate without reading the full specification.
- Prerequisites: None. May absorb the output of Item 72 if the Product Owner later chooses to sequence documentation work incrementally.
- Implementation Plan: Expand `README.md` and `docs/COOKBOOK.md` with better onboarding structure, more representative workflow examples, clearer package-boundary guidance, and stronger cross-links into API/SPEC material. Favor practical scenarios over exhaustive repetition, and keep examples aligned with the current public API and supported feature set.
- Definition of Done: README and COOKBOOK are materially more useful as user-facing onboarding docs, with improved examples, clearer guidance, updated links, and code review completed.
- Acceptance Criteria: README better explains when to use `@ghawb/sdk`, `@ghawb/typed-actions`, `@ghawb/cli`, and `@ghawb/yaml-import`; COOKBOOK gains additional high-value recipes beyond the current baseline set; examples are internally consistent with the current implementation and documentation set.
- Story Points: 3
- Status: new
- Completed At: N/A
- Notes/Links: User-requested documentation backlog intake focused on stronger onboarding and recipe depth rather than a single API slice.

### Item 74: Rewrite committed `workflows/` sources to use the latest authoring features

- Why: The repository's committed `workflows/*.ts` files are the project's most visible self-hosting examples, but they still reflect older authoring patterns in places. Rewriting them to use the latest stable authoring features would both reduce maintenance friction and turn the repository itself into a stronger proof point for `@ghawb/sdk`, `@ghawb/typed-actions`, and adjacent ergonomics work.
- Prerequisites: None, but the work should stay aligned with the current supported feature set and should not force new APIs just to make the rewrite possible.
- Implementation Plan: Audit the committed `workflows/*.ts` modules and refactor them to use the current preferred surfaces where that materially improves clarity or maintenance. Candidate upgrades include `job.nodeCi()`, typed action wrappers from `@ghawb/typed-actions`, current runner-label constants, clearer reusable patterns already supported by the SDK, and removal of stale hand-written step sequences where the newer abstractions are now stable. Regenerate `.github/workflows/*.yml`, update any affected docs, and verify that self-hosting guardrails and hosted-CI-facing workflow contracts remain green.
- Definition of Done: The committed workflow source modules under `workflows/` consistently reflect the repository's current recommended authoring style where applicable, generated workflow YAML stays in sync, review is complete, and the rewrite does not introduce behavior drift or reduce explicitness.
- Acceptance Criteria: At least the primary committed CI/publish workflow sources are rewritten to use the latest stable authoring features already shipped by the repository. The generated `.github/workflows/*.yml` files are updated from those sources. `bun run verify:workflows`, `bun run check`, and the relevant Node compatibility verification continue to pass after the rewrite.
- Story Points: 3
- Status: new
- Completed At: N/A
- Notes/Links: User-requested backlog intake to modernize self-hosted workflow definitions so repository examples track the current public authoring surface rather than older transitional patterns.

### Item 75: Move high-level job helpers such as `nodeCi()` into an opt-in package

- Why: `@ghawb/sdk` is primarily the core workflow AST, builder, validation, and rendering surface. High-specificity job helpers such as `nodeCi()` introduce a more opinionated layer that feels closer to `@ghawb/typed-actions` than to the core SDK boundary. Moving that class of helper into an opt-in package would make the package boundaries more coherent and keep the core SDK focused on workflow primitives plus low-level authoring helpers.
- Prerequisites: None, but the work should treat the current `nodeCi()` surface as shipped behavior and therefore plan an explicit migration path rather than silently breaking existing users.
- Implementation Plan: Define the target package boundary for high-level job helpers, likely as a new opt-in package or as part of an existing ergonomics-oriented package if the boundary remains coherent. Move `nodeCi()` behind that package boundary, provide a migration path for current users, update self-hosted workflow examples and docs, and verify that the resulting surface still supports the repository's preferred explicit-authoring model without drifting into a broad preset framework.
- Definition of Done: High-level job helpers are no longer part of the core `@ghawb/sdk` package surface, an opt-in package boundary and migration story are documented, self-hosted examples and docs use the new import path where appropriate, and review plus verification are complete.
- Acceptance Criteria: `nodeCi()` or its equivalent is provided through an opt-in package rather than the core SDK. Existing users have a documented migration path. `docs/SPEC.md`, API docs, and any affected self-hosted workflow sources are updated to reflect the new boundary. Verification proves the refactor does not break the supported authoring contract.
- Story Points: 3
- Status: new
- Completed At: N/A
- Notes/Links: User-requested backlog intake to align high-level job helpers with the same opt-in packaging principle already used for typed action wrappers and composite action authoring.

## Notes

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
- Sprint 20 review decision: Sprint 20 delivered all committed scope (8/8 items, 18/18 SP) without feature carry-over, so Item 73 remains the next active backlog priority. The sprint closeout PR was incorrectly merged despite a failing hosted CI check, but the immediate repository defect was repaired in merged PR #87 and hosted CI is green again. Future sprint closeout PRs must wait for hosted GitHub Actions success, not just local verification. See [Sprint 20 Review](./sprint_reviews/sp20.md).
- Sprint 20 retrospective decision: Keep Item 73 as the next active backlog item, but prioritize hardening over further surface expansion whenever sprint closeout reveals repository-contract drift such as stale workflow definitions or broken hosted quality gates. See [Sprint 20 Retrospective](./sprint_retrospectives/sp20.md).

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
