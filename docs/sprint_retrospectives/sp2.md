# Sprint Retrospective: Sprint 2

## Summary

Sprint 2 retrospective covered the delivered slice `Item 3` through `Item 5`.

- The sprint shipped stricter identifier and trigger invariants, a deeply frozen built workflow model, a shared Bun and Node Vitest workflow, and a deterministic renderer boundary.
- The sprint also exposed one remaining product gap at the YAML emission boundary and one process gap in how the team decides a sprint item is truly review-ready.

## Role Reflections

### Product Owner

- Role-based viewpoint: Aoi Sakamoto did not implement code, but can credibly represent backlog and acceptance-criteria judgment.
- Observed that Sprint 2 delivered the intended hardening work and renderer boundary, but the Item 5 Definition of Done described valid YAML output more strongly than the current repository evidence supports.
- Wants the next backlog slice to prove the emission boundary with a concrete YAML adapter before adding more workflow-surface area.

### Scrum Master

- Role-based viewpoint: Ren Takahashi did not implement code, but can credibly represent sprint flow, review readiness, and documentation consistency.
- Observed that Sprint 2 closeout still relied on a late review pass to notice that the renderer had only been proven to the intermediate payload boundary, not to emitted YAML.
- Wants sprint closeout to require explicit evidence mapping from each backlog item's Definition of Done to concrete tests or demos before the item is marked done.

### Developer: SDK / Architecture viewpoint

- Role-based viewpoint: Mio Kanda can credibly represent the workflow-contract hardening work.
- Observed that rejecting normalization and duplicate triggers made the AST contract stronger and easier for later rendering to trust.
- Wants the next sprint to keep the renderer boundary explicit and avoid coupling the SDK core to a specific YAML library.

### Developer: Quality / Testing viewpoint

- Role-based viewpoint: Haru Nishimura can credibly represent the deterministic rendering and verification work.
- Observed that the Vitest migration reduced test fragmentation and made renderer assertions easier to write, but current tests still stop short of proving YAML emission correctness.
- Wants one end-to-end YAML assertion in the next sprint so the renderer claim is backed by executable evidence rather than only by payload-level tests.

### Developer: Tooling / Workflow viewpoint

- Role-based viewpoint: Yui Morita can credibly represent the repository-command and tooling ergonomics work.
- Observed that the unified Vitest path made root verification clearer for Bun and Node, while Deno stayed intentionally small and understandable.
- Wants sprint-start checklists to state not only the primary runner but also the concrete evidence expected for each backlog item's closeout claim.

## Grouped Improvements

### Team Improvement

- Require backlog-item closeout to include an explicit evidence map from Definition of Done to concrete command output, test file, or demo artifact.
- State the expected review artifact for each sprint item at sprint start, not only the expected test runner and documents.

### Product Improvement

- Prove the renderer's YAML emission path with one concrete injected emitter before expanding workflow-surface scope again.
- Keep the SDK core emitter-agnostic while making the first YAML adapter and stable emitted-text assertion part of the next delivery slice.

## Follow-Up Routing

### Scrum Master Owned

Team-improvement actions were routed to [scrum_master/BOARD.md](../scrum_master/BOARD.md).

### Product Owner Owned

Product-improvement actions were routed to [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md) by tightening the next CLI slice expectations around concrete YAML emission proof.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp2.md](../sprint_backlogs/sp2.md)
- [scrum_master/BOARD.md](../scrum_master/BOARD.md)
- [TEAM.md](../TEAM.md)
- [sprint_reviews/sp2.md](../sprint_reviews/sp2.md)
