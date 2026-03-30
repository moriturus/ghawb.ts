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

The team reprioritized after Sprint 4 closeout. Sprint 5 committed `Item 10` through `Item 13`, Sprint 6 has now committed `Item 14` through `Item 16` into the sprint backlog, and the following backlog items remain unselected.

### Item 17: Support multiple committed workflow modules in repository guardrails

- Why: Sprint 4 intentionally locked the repository to a single committed workflow source, but future product growth will need more than one repository-managed workflow module without breaking the supported local authoring path.
- Prerequisites: This item must not start until the Product Owner explicitly confirms that broadening beyond the current single-workflow contract is the intended scope.
- Implementation Plan: Generalize workflow generation and verification scripts to support multiple committed workflow modules under `workflows/`, keep the repository-local authoring contract explicit, and extend tests and docs so source-to-output mapping remains deterministic and reviewable.
- Definition of Done: The repository can manage multiple committed workflow source modules through the supported local path, guardrails catch drift and unsupported placement for each module, docs describe the expanded contract, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: Multiple `workflows/*.ts` modules can render to matching `.github/workflows/*.yml` outputs, guardrails validate each supported mapping deterministically, and the repository does not introduce implicit workflow discovery outside the documented path.
- Story Points: 5
- Status: todo
- Completed At: N/A
- Notes/Links: [sprint_reviews/sp4.md](./sprint_reviews/sp4.md), [sprint_retrospectives/sp4.md](./sprint_retrospectives/sp4.md), [scripts/verify-workflows.ts](../scripts/verify-workflows.ts). Team discussion: this item exists because Sprint 4 explicitly warned against silently widening the single-workflow contract; Ren wanted the expansion isolated as its own backlog unit.

### Item 18: Add a batch CLI render surface for repository workflow generation

- Why: The current CLI can render only one explicitly named module at a time, which becomes clumsy once the repository or downstream users need to generate multiple workflows consistently.
- Prerequisites: `Item 17` should be completed first so the repository's multi-workflow contract is defined before the CLI adds a higher-level batch surface around it.
- Implementation Plan: Add a narrow batch render command or manifest-driven CLI path, keep explicit inputs rather than implicit scanning, extend tests for mixed success and failure cases, and document how the new surface composes with existing guardrails.
- Definition of Done: The CLI exposes an explicit multi-workflow render surface with deterministic behavior, actionable diagnostics, matching documentation, and code review by a non-implementing persona.
- Acceptance Criteria: Users can render multiple declared workflow modules in one command, partial failures surface clearly with non-zero exit behavior, and the command does not rely on undocumented repository scanning.
- Story Points: 4
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [packages/cli/src/index.ts](../packages/cli/src/index.ts), [scripts/verify-workflows.ts](../scripts/verify-workflows.ts). Team discussion: Yui pushed for a dedicated ergonomic surface once multi-workflow support exists, while Mio insisted it remain explicit rather than discovery-based.

### Item 19: Expand the cross-runtime conformance suite for SDK rendering

- Why: `docs/SPEC.md` still leaves the cross-runtime conformance question open, and the project currently relies on Bun and Node much more heavily than Deno for executable proof.
- Prerequisites: The currently supported SDK and renderer surfaces through `Item 16` should be stable enough that a shared conformance suite does not churn with every small capability addition.
- Implementation Plan: Define a shared set of representative workflow fixtures and expectations, run them across Bun, Node, and Deno at the appropriate layer, and document which runtime differences are allowed versus treated as regressions.
- Definition of Done: The repository has a documented and executable cross-runtime conformance suite for the supported SDK rendering surface, failures are attributable to clear fixtures, and the change is code reviewed by a non-implementing persona.
- Acceptance Criteria: The same representative supported workflows are exercised across the intended runtimes, conformance failures report which fixture or runtime diverged, and the test contract is documented clearly enough to guide future feature additions.
- Story Points: 3
- Status: todo
- Completed At: N/A
- Notes/Links: [SPEC.md](./SPEC.md), [tests/node/smoke.test.ts](../tests/node/smoke.test.ts), [tests/deno/smoke.test.ts](../tests/deno/smoke.test.ts). Team discussion: Haru treated this as the main quality-hardening item needed before the SDK surface grows much further.

## Prioritization Notes

- Team intake decision: After Sprint 4 closeout, the whole team agreed to refill the product backlog with ten items that balance workflow-surface expansion, repository ergonomics, and hardening work. Sprint 5 has now committed the first four of those items into the sprint backlog.
- Product Owner final decision: Aoi Sakamoto confirms that the backlog order in this document is the authoritative priority order for future sprint selection unless a later sprint review, retrospective, or urgent defect intake explicitly reprioritizes it.
- Product Owner ranked order for remaining unselected work: `Item 17` -> `Item 19` -> `Item 18`.
- Product Owner rationale: after Sprint 6 commits the next thin SDK and renderer slices for permissions, execution metadata, and concurrency, keep the repository's multi-workflow contract next, but move cross-runtime conformance hardening ahead of additional CLI expansion because the current SDK contract now spans more surfaces than the existing runtime proof.
- Scrum Master rationale: keep dependency order explicit so repository-local workflow contract expansion stays isolated ahead of batch CLI work, and preserve cross-runtime hardening as visible backlog work rather than folding it into feature delivery.
- Developer rationale: preserve the repository rule that repository-contract work comes before CLI expansion, but harden the expanded SDK rendering contract across runtimes before adding more CLI orchestration on top of it.
- Ordered delivery decision for remaining work: widen the repository's committed-workflow contract first (`Item 17`), then strengthen cross-runtime proof (`Item 19`), and only after that add the explicit batch CLI surface (`Item 18`).
- Sprint 4 retrospective guidance remains in force: if future scope broadens workflow authoring beyond the current repository-local and explicit path, that expansion must stay explicit in backlog text and must not silently widen existing guardrails.

## Sprint Backlog Records

- [Sprint 1 Backlog](./sprint_backlogs/sp1.md)
- [Sprint 2 Backlog](./sprint_backlogs/sp2.md)
- [Sprint 3 Backlog](./sprint_backlogs/sp3.md)
- [Sprint 4 Backlog](./sprint_backlogs/sp4.md)
- [Sprint 5 Backlog](./sprint_backlogs/sp5.md)
- [Sprint 6 Backlog](./sprint_backlogs/sp6.md)
