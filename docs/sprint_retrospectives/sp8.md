# Sprint Retrospective: Sprint 8

## Summary

Sprint 8 retrospective covers the delivered slice `Item 20`, `Item 21`, `Item 22`, and `Item 23` (13 story points out of 15 capacity).

- The sprint delivered all four committed items in backlog order: env maps, PR activity type filters, trigger filter negation and tags, and step identifiers with job output declarations.
- All items followed the same repeatable pattern: model extension, builder API, validation, deterministic rendering, sub-agent-delegated test writing, SPEC.md update, and PR-based review and acceptance.
- The Sprint 7 retrospective rule — cross-runtime conformance fixtures in every workflow-surface expansion — was honored in all four items.
- Two concrete friction points were observed: the `exactOptionalPropertyTypes` gotcha recurred in sub-agent test output, and the largest item's sub-agent delegation created a long blocking wait for test writing.

## Role Reflections

### Product Owner — Aoi Sakamoto

- Role-based viewpoint: Aoi Sakamoto did not implement code, but can credibly represent backlog intent, acceptance sequencing, and product-priority judgment.
- Observed that the execution order (env → PR types → negation/tags → step IDs and outputs) correctly escalated complexity while keeping each item self-contained. The incremental trigger-extension pattern (Item 21 before Item 22) was the right sequencing call.
- Observed that all four items received item-level acceptance during execution rather than being batched at sprint end. This kept acceptance concrete and grounded in fresh implementation evidence.
- Observed that the sprint review identified a residual risk (step IDs not format-validated against `^[a-zA-Z]` prefix) that was not caught during any item's acceptance criteria check. This suggests that acceptance criteria for identifier-adjacent features should include explicit format-validation expectations in future planning.
- Wants future sprint planning to include explicit format-validation expectations when new identifier-like fields are introduced, so the gap between SDK acceptance and GitHub Actions runtime behavior is intentionally scoped rather than accidentally missed.

### Scrum Master — Ren Takahashi

- Role-based viewpoint: Ren Takahashi did not implement code, but can credibly represent delivery flow, coordination friction, and process debt.
- Observed that the sprint branch and item-branch workflow continued to scale cleanly across four items: each item used its own feature branch, PR into the sprint branch, non-implementing review record, Product Owner acceptance record, and merge before the next item started.
- Observed that the sprint closeout PR (#21) remains open at retrospective time. The Sprint 7 BOARD item about making closeout waiting behavior explicit has not been addressed and the same ambiguity persisted into Sprint 8.
- Observed that the BOARD.md now carries 11 open process improvement items accumulated across sprints 4–7. None were addressed during Sprint 8 execution. While none are blocking, the growing list represents process debt that risks becoming stale if not periodically triaged.
- Wants the team to triage the accumulated BOARD items at the next sprint planning and either close items that are no longer relevant or schedule concrete follow-through for the highest-priority ones.

### Developer: SDK / Architecture — Mio Kanda

- Role-based viewpoint: Mio Kanda can credibly represent AST model design, builder contract, and renderer ordering decisions.
- Observed that the four-item pattern (model type → builder method → clone/validate → finalize → render → assertAllowedKeys) was highly repeatable. Each item extended the established contract without requiring architectural changes or refactoring existing code.
- Observed that the `WorkflowJobOutputs` type alias followed the same `Readonly<Record<string, string>>` pattern as `WorkflowEnv`, keeping the model consistent. The `steps.<id>` referential validation was scoped to regex pattern matching as planned, without attempting full expression parsing.
- Observed one type error during Item 23 implementation: regex match group `match[1]` is `string | undefined` under strict TypeScript, requiring a `?? ''` guard. This was caught by the typecheck pass, not by the developer beforehand.
- Wants future items that introduce regex-based validation to include explicit type-narrowing for capture groups in the implementation plan, since `strictNullChecks` and `exactOptionalPropertyTypes` make this a recurring concern.

### Developer: Quality / Testing — Haru Nishimura

- Role-based viewpoint: Haru Nishimura can credibly represent test coverage, sub-agent delegation quality, and validation behavior.
- Observed that sub-agent delegation for test writing was effective across all four items, producing comprehensive coverage (74 new Vitest tests, 9 new Deno conformance tests) without requiring significant rework.
- Observed that the `exactOptionalPropertyTypes` gotcha recurred in Item 22: the test-writing sub-agent produced `tagsIgnore: undefined` despite the prompt explicitly warning against it. The fix was simple (remove the explicit `undefined`), but this is the same class of error that was documented in LEARN.md during Sprint 1. The sub-agent prompt reinforcement is not sufficient to prevent this reliably.
- Observed that the Item 23 test-writing sub-agent took approximately 29 minutes to complete, during which the coordinating agent was blocked polling for completion. This is the longest single sub-agent delegation observed in the project. For large items (5+ SP), the blocking wait reduces overall throughput.
- Wants the team to consider splitting large test-writing delegations into smaller parallel sub-agents (e.g., builder tests and renderer tests as separate delegations) when the item scope is large enough that a single agent creates a throughput bottleneck.

### Developer: Tooling / Workflow — Yui Morita

- Role-based viewpoint: Yui Morita can credibly represent repository ergonomics, contributor friction, and documentation alignment.
- Observed that `bun run check` remained the reliable single verification command throughout all four items. The format → lint → typecheck → test pipeline caught real issues (formatting in Item 20, type errors in Items 22 and 23) without requiring manual intervention beyond fixing the flagged code.
- Observed that SPEC.md was updated in every item and the canonical ordering documentation was kept current, including the new trigger filter key order and the expanded step and job field orders. INDEX.md was also updated for the sprint review document.
- Observed that the `docs/LEARN.md` was not updated during Sprint 8 despite encountering a recurring gotcha (`exactOptionalPropertyTypes` in sub-agent output) and a new one (regex capture group type narrowing). These are the kinds of lessons LEARN.md is designed to preserve.
- Wants the recurring `exactOptionalPropertyTypes` sub-agent issue and the regex capture group type narrowing to be recorded in LEARN.md so they are surfaced to future contributors and sub-agent prompts.

## Grouped Improvements

### Team Improvement

1. **Triage accumulated BOARD items.** The Scrum Master BOARD carries 11 open process improvement items from sprints 4–7, none addressed in Sprint 8. The next sprint planning should triage these and either close stale items or schedule concrete follow-through.
2. **Split large test-writing delegations.** When a backlog item is 5+ SP, consider splitting test delegation into smaller parallel sub-agents (builder tests, renderer tests, conformance fixtures) to reduce blocking wait time.
3. **Reinforce `exactOptionalPropertyTypes` in sub-agent context.** The current warning in sub-agent prompts is not preventing the recurrence. Consider adding a concrete counter-example (showing the wrong code and the fix) rather than a rule statement alone.
4. **Record new LEARN.md entries promptly.** Sprint 8 encountered two learnable gotchas (recurring `exactOptionalPropertyTypes` in sub-agent output, regex capture group type narrowing) that should have been recorded in LEARN.md during the sprint.

### Product Improvement

1. **Step ID format validation.** Step IDs are currently validated only for non-blank and per-job uniqueness but not against the GitHub Actions identifier format (`^[a-zA-Z][a-zA-Z0-9_-]*$`). A future hardening item could add format validation using the shared identifier factory pattern. The Product Owner noted this is not blocking in the sprint review.
2. **Acceptance criteria for identifier-like fields.** Future sprint planning should explicitly scope whether new identifier fields require format validation against GitHub Actions runtime constraints or only structural validation (blank, uniqueness).

## Follow-Up Routing

### Scrum Master Owned

No new BOARD item is added in this retrospective. The existing BOARD items remain relevant and the primary follow-up is to triage them at the next sprint planning:

- BOARD item #1 (sprint closeout waiting behavior) was not resolved and the same ambiguity appeared again in Sprint 8.
- BOARD items #2–11 remain open and unaddressed.

The team improvement items (split large test delegations, reinforce `exactOptionalPropertyTypes`, record LEARN.md entries promptly) are process expectations that should be carried forward as operating norms rather than formal BOARD items.

### Product Owner Owned

No new product backlog item is added. The step ID format validation gap was acknowledged in the sprint review as a non-blocking residual risk. If the Product Owner decides it warrants a formal hardening item, it can be scoped during the next backlog intake or sprint planning cycle.

The remaining 6 backlog items (`Item 24` through `Item 29`) retain their current priority order per the sprint review decision.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp8.md](../sprint_backlogs/sp8.md)
- [sprint_reviews/sp8.md](../sprint_reviews/sp8.md)
- [scrum_master/BOARD.md](../scrum_master/BOARD.md)
- [TEAM.md](../TEAM.md)
- [LEARN.md](../LEARN.md)
