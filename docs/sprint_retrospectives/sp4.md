# Sprint Retrospective: Sprint 4

## Summary

Sprint 4 retrospective covered the delivered slice `Item 8` through `Item 9b`.

- The sprint restored hosted CI for the self-hosted workflow path, documented a contributor-facing verification and workflow authoring convention, and added automated workflow guardrails shared between local verification and hosted CI.
- The sprint also exposed one remaining process gap around reviewing and retrospecting from a dirty worktree, and one product-scope boundary around the current single-workflow guardrail contract.

## Role Reflections

### Product Owner

- Role-based viewpoint: Aoi Sakamoto did not implement code, but can credibly represent backlog and acceptance-criteria judgment.
- Observed that Sprint 4 delivered the intended hardening sequence in the right order: hosted CI recovery first, contributor guidance second, and automated guardrails third.
- Observed that `Item 8` required an explicit acceptance exception because the recorded hosted proof was a green push run rather than the originally stated green pull-request run.
- Wants future backlog items to avoid review-time exceptions by making external-proof expectations precise enough during planning that closeout does not depend on interpretation.

### Scrum Master

- Role-based viewpoint: Ren Takahashi did not implement code, but can credibly represent sprint flow, coordination, and review readiness.
- Observed that multi-agent role usage became more concrete during this sprint than in prior work, which reduced ambiguity about who owned implementation versus review.
- Observed that sprint review and retrospective were still recorded from a dirty worktree, which weakens the audit trail even when command evidence is strong.
- Wants sprint closeout to require either a clean review snapshot or an explicit scoped-recording rule before review and retrospective notes are finalized.

### Developer: SDK / Architecture viewpoint

- Role-based viewpoint: Mio Kanda can credibly represent the workflow authoring contract and module-boundary decisions.
- Observed that the repository now has a clearer supported path: committed workflow source stays under `workflows/`, generated output stays under `.github/workflows/`, and the guardrail command enforces that boundary.
- Observed that the current guardrail mapping intentionally matches the repository's present single committed workflow module and should not silently expand to multi-workflow support.
- Wants future workflow-surface expansion to enter through explicit backlog scope rather than incremental guardrail drift.

### Developer: Quality / Testing viewpoint

- Role-based viewpoint: Haru Nishimura can credibly represent executable proof and failure-mode coverage.
- Observed that Sprint 4 closed the main operational gap left by Sprint 3 by proving hosted CI recovery and by adding executable guardrail coverage for workflow-source placement and generated output drift.
- Observed that targeted test coverage and temporary clean-repository verification gave strong evidence, but the review record still depends on working-tree state rather than a clean committed review point.
- Wants future sprint closeout evidence to tie review documents to a clean, reproducible snapshot whenever external proof is already available.

### Developer: Tooling / Workflow viewpoint

- Role-based viewpoint: Yui Morita can credibly represent root command ergonomics, CI wiring, and contributor workflow clarity.
- Observed that `verify:pre-push` and `verify:workflows` make the intended contributor path easier to discover and align local verification with hosted CI behavior.
- Observed that moving the pre-push flow into TypeScript scripts reduced shell-specific command risk and kept the command contract more portable.
- Wants future tooling changes to preserve this pattern: one dedicated guardrail command for the narrow contract, plus one higher-level contributor flow command that composes it.

## Grouped Improvements

### Team Improvement

- Require sprint review and retrospective notes to reference either a clean review snapshot or an explicitly scoped working-tree evidence note before the documents are finalized.
- Tighten sprint-planning acceptance criteria for external proof so exceptions like push-run versus pull-request-run evidence are resolved during planning rather than at closeout.
- Keep explicit persona and delegated-role assignment at sprint start, because this sprint showed that the repository works better when implementation, review, and tooling ownership are concrete.

### Product Improvement

- Plan explicit support for multiple committed workflow modules only when the repository is ready to broaden beyond the current single-workflow guardrail contract.
- Preserve the repository-local workflow authoring boundary and guardrail structure as the default product contract until a broader workflow-surface design is intentionally specified.

## Follow-Up Routing

### Scrum Master Owned

Team-improvement actions were routed to [scrum_master/BOARD.md](../scrum_master/BOARD.md).

### Product Owner Owned

Product-improvement actions were routed to [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md) as next-scope intake guidance rather than as a newly committed backlog item.

## Links

- [SPEC.md](../SPEC.md)
- [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md)
- [sprint_backlogs/sp4.md](../sprint_backlogs/sp4.md)
- [scrum_master/BOARD.md](../scrum_master/BOARD.md)
- [TEAM.md](../TEAM.md)
- [sprint_reviews/sp4.md](../sprint_reviews/sp4.md)
