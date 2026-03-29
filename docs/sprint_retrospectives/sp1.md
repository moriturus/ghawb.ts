# Sprint Retrospective: Sprint 1

## Summary

Sprint 1 retrospective focused on the first delivered SDK baseline and on the gaps that became visible during sprint review.

- The sprint succeeded in establishing the initial workspace, tooling baseline, minimal workflow builder, and explicit `build()`-time validation.
- The retrospective confirmed that Sprint 1 delivered a usable foundation, but also exposed contract and process issues that should be addressed before the next major expansion step.

## Role Reflections

### Product Owner

- Recognized that Sprint 1 achieved its immediate goal, but left some downstream ambiguity for later work.
- Identified the need to make completion criteria protect the next sprint, not just the current sprint.

### Scrum Master

- Noted that review preparation took too much effort reconciling code, tests, and documentation.
- Identified sprint-close consistency checks and earlier documentation ownership as process improvements.

### Developer: SDK / Architecture viewpoint

- Confirmed that the core builder-centered SDK shape is in place.
- Identified product issues around invariant strictness, trigger ownership, and post-build immutability.

### Developer: Quality / Testing viewpoint

- Confirmed that validation and multi-runtime verification paths exist.
- Identified test-platform fragmentation between Bun and Node as a scaling risk.

### Developer: Tooling / Workflow viewpoint

- Confirmed that workspace and quality-command foundations are present.
- Identified ambiguity around runtime ownership, `typecheck` scope, and verification workflow as avoidable friction.

## Grouped Improvements

### Team Improvement

- Add an explicit pre-review consistency check to sprint closeout.
- Fix documentation update expectations earlier in the sprint.
- Tighten acceptance-criteria review during sprint planning.
- Align tooling and runtime ownership earlier so the team does not rediscover those decisions mid-sprint.

### Product Improvement

- Harden Sprint 1 workflow invariants:
  - reject silent identifier coercion
  - define trigger ownership or duplicate-trigger behavior explicitly
  - make the built workflow model effectively immutable
- Standardize Bun and Node testing on Vitest.
- Clarify the runtime-specific tooling contract:
  - primary test runner
  - Deno smoke-test role
  - routine `typecheck` surface

## Follow-Up Routing

### Scrum Master Owned

Team-improvement actions were routed to [scrum_master/BOARD.md](../scrum_master/BOARD.md) as a priority-ordered TODO list.

### Product Owner Owned

Product-improvement actions were routed into [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md) and used to adjust the product priority order.

The current post-retrospective product order is:

1. Harden Sprint 1 workflow invariants and immutable AST
2. Standardize Bun and Node testing on Vitest
3. Implement deterministic workflow rendering
4. Build the CLI as the final-stage interface
5. Enable self-hosted CI/CD using `ghawb`

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp1.md](../sprint_backlogs/sp1.md)
- [scrum_master/BOARD.md](../scrum_master/BOARD.md)
- [TEAM.md](../TEAM.md)
- [sprint_reviews/sp1.md](../sprint_reviews/sp1.md)
