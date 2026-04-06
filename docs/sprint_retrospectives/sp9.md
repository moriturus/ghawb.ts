# Sprint Retrospective: Sprint 9

## Summary

Sprint 9 retrospective covers the delivered slice `Item 24`, `Item 25`, `Item 26`, and `Item 27` (14 story points out of 15 capacity).

- The sprint delivered all four committed items in backlog order: strategy completion, step-level continue-on-error and timeout-minutes, workflow dispatch trigger inputs, and job-level if and continue-on-error.
- All items followed the established repeatable pattern: model extension, builder API, validation, deterministic rendering, conformance fixtures, SPEC.md update, and PR-based review and acceptance.
- The Sprint 7 retrospective rule — cross-runtime conformance fixtures in every workflow-surface expansion — was honored in all four items.
- Sprint 8 retrospective follow-ups were substantially addressed: BOARD triage reduced open items from 11 to 4 (all concretized as Item 30), LEARN.md entries were recorded for the two Sprint 8 gotchas, and test delegation splitting was planned for 5+ SP items.
- One concrete friction point was observed: an `oxfmt` formatting failure during sprint closeout required a follow-up commit after the sprint-level PR was created.

## Role Reflections

### Product Owner — Aoi Sakamoto

- Role-based viewpoint: Aoi Sakamoto did not implement code, but can credibly represent backlog intent, acceptance sequencing, and product-priority judgment.
- Observed that the Item 26 re-estimation from 4 to 5 SP during Sprint 9 refinement was accurate. The `choice`/`options` conditional validation added meaningful complexity: `options` required when `type` is `choice`, rejected on other types, and handling the case where `type` is omitted. The 1 SP buffer reduction was absorbed correctly.
- Observed that all four items received item-level acceptance during execution with PR-based review by a non-implementing persona before merge, consistent with the acceptance-gating practice established in Sprint 8.
- Observed that the sprint review identified a residual risk about `workflow_dispatch` input `default` values not being type-validated (e.g., `default: 'abc'` accepted when `type: 'number'`). This was correctly assessed as matching GitHub Actions' own runtime behavior and not warranting a backlog item. This kind of explicit scoping decision during review is exactly what the team should continue doing.
- Wants future sprint planning to continue the explicit scoping pattern for validation boundaries: stating what is validated and what is intentionally left to GitHub Actions runtime, rather than discovering the gap during review.

### Scrum Master — Ren Takahashi

- Role-based viewpoint: Ren Takahashi did not implement code, but can credibly represent delivery flow, coordination effectiveness, and process debt status.
- Observed that the Sprint 8 retrospective's primary ask — triage the accumulated BOARD items — was successfully addressed during Sprint 9 planning. The BOARD went from 11 open items to 4, with 3 closed as adopted practice, 4 closed as codified in PLAYBOOK.md, and 4 concretized as product backlog Item 30 (sprint ceremony process hardening). This is the most substantial BOARD cleanup in the project's history.
- Observed that the sprint review included an explicit evidence provenance note ("clean worktree on sprint-9 branch at commit `19dfdc4`"), which partially addresses BOARD item #2 (evidence provenance) even though the formal process is still tracked under Item 30.
- Observed that the sprint closeout PR (#26) was merged into `main` before the sprint review was completed. This resolved the closeout waiting ambiguity that had persisted from Sprint 7 through Sprint 8 — CI passed, and the merge was completed rather than left pending.
- Observed that the remaining 4 BOARD items are all concretized as backlog Item 30, meaning the BOARD is now clean: every open item has a clear delivery path. This is a healthy state.
- Wants the team to maintain the practice of triaging BOARD items during sprint planning and not let them accumulate beyond one sprint without attention.

### Developer: SDK / Architecture — Mio Kanda

- Role-based viewpoint: Mio Kanda can credibly represent AST model design, builder contract, and renderer ordering decisions.
- Observed that the four-item pattern continued to scale cleanly. Each item extended the AST model, added builder methods with validation, rendered in canonical order, and added conformance fixtures without requiring refactoring of existing code. The architecture's extensibility was demonstrated across four different surfaces: strategy, step metadata, trigger inputs, and job metadata.
- Observed that the `workflow_dispatch` inputs expansion (Item 26) was the most architecturally interesting delivery. The `WorkflowDispatchInput` type introduced a conditional validation pattern (options required/rejected based on type) that was new to the SDK. The implementation correctly used the existing validation infrastructure without introducing new abstractions.
- Observed that the renderer's `assertAllowedKeys` pattern continued to work as a safety net. When adding `if` and `continueOnError` to the job model (Item 27), forgetting to update `assertAllowedKeys` would have caused an explicit failure rather than silently dropping the fields. This is a valuable guardrail for surface expansion.
- Observed that the renderer test for "unsupported field" needed updating when Item 26 added `inputs` support — the test previously used `inputs` as the unsupported field example and had to switch to `branches`. This is expected when expanding supported surfaces, but it means the test fixture selection should anticipate future expansion.
- Wants the team to consider adding a comment in the renderer unsupported-field test listing which fields were previously used, so future contributors understand the history when the test needs updating again.

### Developer: Quality / Testing — Haru Nishimura

- Role-based viewpoint: Haru Nishimura can credibly represent test coverage, validation behavior, and review quality.
- Observed that test growth was substantial and well-structured: 146 → 184 Vitest tests (+38), 16 → 24 Deno conformance tests (+8). The growth rate per SP was consistent with Sprint 8, suggesting the testing pattern is stable.
- Observed that a conformance fixture field ordering error was caught during Item 26 development: the `dry_run` input fixture had `type` before `required`, but the canonical order is `description`, `required`, `default`, `type`, `options`. This was caught by the conformance test (JSON string equality check), confirming that the deterministic rendering contract is working as a testing guardrail. However, it also suggests that canonical field ordering for new surfaces should be explicitly documented before writing fixtures.
- Observed that the deep-freeze test for `workflow_dispatch` inputs required a `!` non-null assertion for `trigger.inputs.env.options` because TypeScript couldn't narrow through the optional property chain. This is a minor variant of the Sprint 8 lesson about strict TypeScript narrowing and did not cause significant friction, but it's worth noting as a recurring pattern.
- Observed that the Sprint 8 retro recommendation to split large test delegations for 5+ SP items was planned in Sprint 9 but was not visibly applied during Items 26 and 27 execution. The items were completed without sub-agent delegation friction, so the recommendation may apply primarily to items with broader test surface (like Item 23's 29-minute blocking wait) rather than uniformly to all 5+ SP items.
- Wants the team to establish a convention for documenting canonical field order in SPEC.md before implementation starts, so fixture authors (whether human or sub-agent) have an unambiguous reference for field ordering.

### Developer: Tooling / Workflow — Yui Morita

- Role-based viewpoint: Yui Morita can credibly represent repository ergonomics, CI friction, and documentation alignment.
- Observed that the `oxfmt` formatting failure during sprint closeout is the same class of friction that appeared in Sprint 8. The `bun run check` pipeline correctly catches formatting issues, but the failure happens after the sprint-level PR is already created and pushed, requiring a follow-up fix commit. Running `bun run format` before committing would prevent this, but it's easy to forget when multiple files are changed.
- Observed that the Sprint 8 LEARN.md entries (exactOptionalPropertyTypes counter-examples and regex capture group narrowing) were successfully recorded, fulfilling the Sprint 8 retro ask. No new LEARN.md entries were needed during Sprint 9 — the sprint did not encounter fundamentally new gotchas.
- Observed that `docs/INDEX.md` was updated for the sprint review document, maintaining the documentation index convention.
- Observed that the CI pipeline (`bun run check`) remained reliable and caught the formatting issue before merge. The `verify:workflows` + `check` pipeline structure continued to work well.
- Wants the team to consider adding a pre-commit or pre-push hook for `bun run format:check` to catch formatting issues before they reach CI, or at minimum to add "run `bun run format`" to the sprint closeout checklist.

## Grouped Improvements

### Team Improvement

1. **Add formatting check to closeout procedure.** The `oxfmt` formatting failure during sprint closeout is a recurring friction point (appeared in both Sprint 8 and Sprint 9). Either add `bun run format` to the pre-commit workflow, add `bun run format:check` to a pre-push hook, or explicitly add "verify formatting" to the sprint closeout checklist.
2. **Document canonical field order before implementation.** Conformance fixture field ordering errors were caught by tests but could be prevented by documenting canonical field order in SPEC.md before implementation starts, giving fixture authors an unambiguous reference.
3. **Maintain BOARD triage discipline.** Sprint 9 planning successfully reduced the BOARD from 11 to 4 items. The team should continue triaging BOARD items at each sprint planning to prevent re-accumulation.
4. **Revisit test delegation splitting guidance.** The Sprint 8 retro recommendation to split test delegations for 5+ SP items was planned but not applied during Sprint 9. The recommendation should be narrowed: apply splitting when the item's test surface is broad enough to create blocking wait time (e.g., 15+ minutes), not uniformly to all 5+ SP items.

### Product Improvement

1. **Canonical field ordering documentation in SPEC.md.** SPEC.md documents the overall canonical ordering but does not always specify field order within new sub-structures before they are implemented. Adding per-surface field ordering (e.g., workflow_dispatch input fields, strategy sub-fields) to the specification before implementation would reduce fixture errors and make the contract more explicit.
2. **Renderer unsupported-field test fragility.** The renderer test for unsupported fields has now been updated twice (Sprint 9: `inputs` → `branches`) as the supported surface expands. Consider using a synthetic field name (e.g., `unsupported_test_field`) that will never become a real GitHub Actions field, rather than a real field name that may be supported in a future sprint.

## Follow-Up Routing

### Scrum Master Owned

No new BOARD item is added in this retrospective. The existing 4 BOARD items are all concretized as product backlog Item 30 and have a clear delivery path.

The team improvement items from this retrospective are operating norms that should be carried forward:

- **Formatting check at closeout**: Add to the closeout protocol in PLAYBOOK.md as a verification step. This is within scope of Item 30 (sprint ceremony process hardening) and can be folded into that item's implementation.
- **BOARD triage discipline**: Continue the Sprint 9 pattern of triaging BOARD items at each sprint planning. No additional process documentation needed — the practice is established.
- **Test delegation splitting refinement**: Narrow the guidance to "split when test surface is broad enough to create 15+ minute blocking wait" rather than "split for all 5+ SP items." This is a team norm adjustment, not a formal BOARD item.

### Product Owner Owned

No new product backlog item is added. The two product improvement observations are refinements to existing practices:

- **Canonical field ordering documentation**: This is a specification-writing practice that should be adopted going forward. When the next SDK surface expansion (Item 28) is implemented, the canonical field ordering for new sub-structures should be specified in SPEC.md before or alongside implementation. This does not require a separate backlog item.
- **Renderer unsupported-field test**: Consider switching to a synthetic field name during the next item that modifies the renderer's `assertAllowedKeys` surface. This is a low-priority test maintenance improvement, not a backlog item.

The remaining four backlog items retain their current priority order per the sprint review decision: Item 28 → Item 31 → Item 30 → Item 29.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp9.md](../sprint_backlogs/sp9.md)
- [sprint_reviews/sp9.md](../sprint_reviews/sp9.md)
- [scrum_master/BOARD.md](../scrum_master/BOARD.md)
- [TEAM.md](../TEAM.md)
- [LEARN.md](../LEARN.md)
