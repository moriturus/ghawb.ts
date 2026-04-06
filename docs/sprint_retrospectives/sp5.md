# Sprint Retrospective: Sprint 5

## Summary

Sprint 5 retrospective covered the delivered slice `Item 10` through `Item 13`.

- The sprint added four thin SDK and renderer expansions in planned order: `workflow_dispatch`, `schedule`, job `needs`, and job `strategy.matrix`.
- The sprint preserved the project pattern of explicit validation, deterministic rendering, and specification alignment for each new surface.
- The sprint also exposed one recurring process friction around local branch state during PR merge and closeout, while leaving one product hardening gap around the still-unsupported `permissions` surface as the next highest-priority backlog item.

## Role Reflections

### Product Owner

- Role-based viewpoint: Aoi Sakamoto did not implement code, but can credibly represent backlog and acceptance-criteria judgment.
- Observed that Sprint 5 delivered the planned prefix of high-value workflow authoring features without widening adjacent unsupported GitHub Actions shapes by accident.
- Observed that the narrow-slice approach worked well: each item landed with explicit validation and documentation instead of bundling multiple adjacent features into one ambiguous contract.
- Wants the next sprint to keep prioritizing high-value SDK surfaces only when the unsupported boundary remains explicit in backlog text and in `docs/SPEC.md`.

### Scrum Master

- Role-based viewpoint: Ren Takahashi did not implement code, but can credibly represent sprint flow, coordination, and review readiness.
- Observed that item-by-item PR isolation, review evidence capture, and Product Owner acceptance worked more consistently than in prior sprints.
- Observed that local `main` branch divergence still created avoidable friction during PR merge and closeout even though GitHub-side merge state was correct.
- Wants sprint execution to standardize `origin/main` as the authoritative branch base for new item and closeout branches so local branch drift does not interrupt closeout flow.

### Developer: SDK / Architecture viewpoint

- Role-based viewpoint: Mio Kanda can credibly represent the workflow AST, builder API, and renderer contract decisions.
- Observed that the SDK now covers a more practical minimum GitHub Actions authoring path while keeping the core AST independent from YAML-library concerns.
- Observed that the repository successfully preserved deterministic ordering across triggers, job dependencies, and matrix axes as the workflow surface expanded.
- Wants future work to continue enforcing bounded slices such as explicit `permissions` support rather than accepting partially modeled runtime shapes.

### Developer: Quality / Testing viewpoint

- Role-based viewpoint: Haru Nishimura can credibly represent executable proof, validation behavior, and failure-mode coverage.
- Observed that every Sprint 5 item shipped with explicit success and failure tests across the primary Bun and Node paths, with Deno remaining smoke-only by design.
- Observed that review evidence capture on the PR became more durable once non-implementing review comments were added automatically instead of being treated as a manual follow-up.
- Wants the team to keep hardening the closeout path so verification, review evidence, and hosted proof remain routine rather than rediscovered per item.

### Developer: Tooling / Workflow viewpoint

- Role-based viewpoint: Yui Morita can credibly represent repository workflow ergonomics and contributor-facing command flow.
- Observed that the repository commands stayed stable while the SDK surface expanded, which made feature delivery faster than introducing new task-level tooling during the sprint.
- Observed that the PR workflow itself, not the code, caused the main operational friction: draft-to-ready handling and local branch divergence produced noisy merge steps.
- Wants the team to document the expected branch-base and closeout behavior more explicitly so the routine sprint path is less sensitive to local git state.

## Grouped Improvements

### Team Improvement

- Standardize new sprint item branches and closeout branches on `origin/main` rather than assuming local `main` is current enough for merge and closeout operations.
- Keep automatic PR review-record creation in the sprint execution path so non-implementing review evidence is captured as part of normal flow rather than as an afterthought.
- Preserve the current item-by-item delivery pattern because Sprint 5 showed that small, reviewable PRs made acceptance and closeout materially cleaner.

### Product Improvement

- Keep `Item 14` as the highest-priority next slice because explicit `permissions` support is the largest remaining practical gap in the current GitHub Actions surface.
- Preserve the current narrow boundary for matrix support until a later backlog item intentionally broadens into `include`, `exclude`, or other strategy-adjacent features.
- Keep the cross-runtime conformance expansion visible as backlog work rather than assuming Bun and Node coverage alone are enough for long-term SDK confidence.

## Follow-Up Routing

### Scrum Master Owned

Team-improvement actions were routed to [scrum_master/BOARD.md](../scrum_master/BOARD.md).

### Product Owner Owned

Product-improvement actions were routed to [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md) as priority guidance for the next sprint rather than as a new backlog item.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp5.md](../sprint_backlogs/sp5.md)
- [scrum_master/BOARD.md](../scrum_master/BOARD.md)
- [TEAM.md](../TEAM.md)
- [sprint_reviews/sp5.md](../sprint_reviews/sp5.md)
