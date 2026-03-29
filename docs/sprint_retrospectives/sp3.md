# Sprint Retrospective: Sprint 3

## Summary

Sprint 3 retrospective covered the delivered slice `Item 6` through `Item 7`.

- The sprint shipped the first usable CLI command, a concrete YAML emitter adapter, committed self-hosted CI workflow generation, and automated verification for both CLI execution and generated workflow content.
- The sprint also exposed one remaining operational gap in hosted CI proof and one process gap around keeping closeout verification green in a dirty worktree.

## Role Reflections

### Product Owner

- Role-based viewpoint: Aoi Sakamoto did not implement code, but can credibly represent backlog and acceptance-criteria judgment.
- Observed that Sprint 3 delivered the intended product slice: the CLI now proves the YAML emission boundary and the repository can maintain its own CI workflow source without manual YAML editing.
- Observed that the remaining uncertainty is no longer feature scope but operational confirmation on hosted GitHub Actions and branch hygiene around `bun run check`.
- Wants the next scope intake to favor operational proof and repository hygiene ahead of new workflow-surface expansion.

### Scrum Master

- Role-based viewpoint: Ren Takahashi did not implement code, but can credibly represent sprint flow, coordination, and review readiness.
- Observed that Sprint 3 closed with strong implementation evidence, but `format:check` could still be blocked by unrelated dirty-worktree files outside the sprint slice.
- Observed that the repository prefers sub-agents or multi-agent collaboration, yet the sprint was executed serially in one thread, so the intended role split was documented more than operationalized.
- Wants sprint execution to include an explicit clean-branch or scoped-verification check before declaring closeout green, and wants delegated role ownership to be made concrete when the workflow expects it.

### Developer: SDK / Architecture viewpoint

- Role-based viewpoint: Mio Kanda can credibly represent the CLI contract and module-boundary work.
- Observed that keeping the SDK renderer emitter-agnostic while placing the concrete `yaml` dependency in the CLI preserved the architecture rule from the specification.
- Observed that direct TypeScript module loading is workable, but only predictable when workflow source modules stay inside the repository or otherwise control their own dependency resolution.
- Wants future workflow authoring conventions to stay explicit and repository-local rather than introducing implicit discovery or global scanning.

### Developer: Quality / Testing viewpoint

- Role-based viewpoint: Haru Nishimura can credibly represent the executable proof and failure-mode coverage.
- Observed that Sprint 3 corrected the prior review gap by adding end-to-end assertions for emitted YAML text and self-hosted workflow content.
- Observed that the remaining validation gap is external: local tests prove generation, but not hosted execution on GitHub Actions.
- Wants future self-hosting items to define which verification stops locally and which must be proven on the hosted platform before the item can be treated as fully closed.

### Developer: Tooling / Workflow viewpoint

- Role-based viewpoint: Yui Morita can credibly represent command ergonomics, manifest updates, and workflow-generation support.
- Observed that `bun run generate:workflows` gives the repository a clear regeneration path and makes the self-hosting workflow easier to maintain.
- Observed that root verification still depends on repository state cleanliness, so tooling ergonomics alone do not prevent unrelated files from breaking the closeout path.
- Wants branch hygiene and generated-file checks to be stated earlier in sprint execution so the final verification path matches what CI will actually run.

## Grouped Improvements

### Team Improvement

- Add an explicit clean-branch or scoped-verification gate before sprint closeout so unrelated dirty-worktree files do not surprise the team at the end.
- Make multi-agent or delegated role usage explicit at sprint start when the repository expects persona-based collaboration, including who owns implementation, review, and verification.
- State which verification steps are local closeout checks versus hosted-platform checks before work begins.

### Product Improvement

- Prove the self-hosted CI path on GitHub Actions after commit and push, then capture any workflow adjustments that hosted execution reveals.
- Keep workflow source modules repository-local and explicit so CLI import behavior stays reproducible as more workflows are added.

## Follow-Up Routing

### Scrum Master Owned

Team-improvement actions were routed to [scrum_master/BOARD.md](../scrum_master/BOARD.md).

### Product Owner Owned

Product-improvement actions were routed to [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md) as next-scope intake guidance rather than as a newly committed backlog item.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp3.md](../sprint_backlogs/sp3.md)
- [scrum_master/BOARD.md](../scrum_master/BOARD.md)
- [TEAM.md](../TEAM.md)
- [sprint_reviews/sp3.md](../sprint_reviews/sp3.md)
