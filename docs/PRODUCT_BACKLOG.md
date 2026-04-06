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

## Notes

- Sprint 25 review decision: Sprint 25 delivered all committed scope (Items 84-86, 10/10 SP) and the merged increment now ships the narrower CLI contract `--bulk` for render plans plus per-target `--config` exposed through `getRenderConfig<T>()`. No active backlog items are reopened immediately, but the next backlog intake should prioritize contract consolidation across sprint records and public docs before any further CLI surface expansion. See [Sprint 25 Review](./sprint_reviews/sp25.md).
- Sprint 25 retrospective decision: The next planning input should treat CLI config-contract consolidation as both a product-hardening and documentation-consistency theme. In particular, remaining stale `--config` manifest wording and the documented TOML injection scope should be resolved before broader CLI feature growth. See [Sprint 25 Retrospective](./sprint_retrospectives/sp25.md).
- Sprint 26 selection decision: Sprint 26 commits Items 87, 88, 89, and 90 for a total of 10 SP. The Product Owner accepts 10 SP of residual capacity because the remaining backlog is intentionally smaller than the standing 20 SP capacity, and the repository does not permit padding the sprint with speculative work just to consume points. See [Sprint 26 Backlog](./sprint_backlogs/sp26.md).
- Sprint 24 selection note: Sprint 24 kept the standing 20 SP capacity and committed 17 SP, leaving 3 SP residual. The Product Owner prioritized user-facing CLI simplicity and explicit support for both workflow and composite-action flows, while deferring Item 84 to preserve capacity after the refined scope expanded.
- Sprint 23 product-discovery decision: New intake after Sprint 23 created Items 79–86. The Product Owner prioritized repository-owned Node 24 and workflow-convention hardening first, then CLI surface simplification, then config-manifest design and implementation, and finally public-doc sync plus drift protection.
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
