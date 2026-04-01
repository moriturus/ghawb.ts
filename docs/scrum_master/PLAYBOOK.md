# Scrum Master Playbook

This document defines how the Scrum Master persona should execute the team-improvement TODOs tracked in [BOARD.md](./BOARD.md).

## Owner

- Primary owner: Ren Takahashi, Scrum Master persona from [TEAM.md](../TEAM.md)
- Goal: reduce avoidable ambiguity, documentation drift, and late sprint coordination overhead

## Operating Cadence

Use this playbook at three points in every sprint.

1. Sprint start
2. Sprint planning and backlog refinement
3. Sprint closeout before review

## Sprint Start Protocol

Run this protocol before implementation work expands.

The sprint branch must be created or explicitly confirmed at the beginning of sprint planning and remain the branch anchor for the rest of the sprint workflow.

### 0. Confirm role, delegation, and sequencing boundaries

Restate the team's standing working agreements before sprint execution begins.

- Confirm that Product Owner and Scrum Master personas will not act as implementers.
- Confirm that sprint backlog work will proceed from the top item downward.
- Confirm that the team will not implement multiple sprint backlog items in parallel.
- Create or confirm the sprint branch name and base branch before any planning output or item work proceeds.
- Confirm that each feature branch will be created from the latest sprint branch state.
- Confirm that item pull requests will target the sprint branch and that the sprint will close through one final sprint-branch-to-`main` pull request.
- Confirm which Developer persona is expected to carry the primary implementation responsibility for the current top item.
- Confirm how sub-agents or multi-agent collaboration will be used first for the current sprint, and which persona owns each delegated slice.
- Confirm that sprint execution does not stop merely because a response turn ended, a status report was sent, or a progress summary was provided. Execution continues to the next ready item unless a documented stop condition is met.

### 1. Confirm documentation update rules

Record which repository documents are expected to change during the sprint.

- Check whether the sprint scope affects `docs/SPEC.md`.
- Check whether product backlog status or sequencing updates will be needed in `docs/PRODUCT_BACKLOG.md`.
- Check which file under `docs/sprint_backlogs/` will record the sprint backlog state.
- Check whether a new review or retrospective note is likely to be created under `docs/`.
- Confirm whether `docs/INDEX.md` must be updated as part of the sprint.
- State explicitly which role owns each document update during the sprint.

Minimum output:

- sprint branch and base branch
- expected docs to update
- responsible role
- review point for each update

### 2. Confirm tooling expectations

Lock down the working agreement for verification before feature work begins.

- State the primary unit or integration test runner for the sprint.
- State whether Deno is part of the primary suite or smoke-only coverage.
- State the expected `typecheck` surface.
- State the root verification command that will be treated as the sprint's minimum quality gate.
- State that sprint commits will use Conventional Commits and confirm the expected commit-message convention before implementation starts.

Minimum output:

- primary test runner
- secondary or smoke runners
- `typecheck` target
- minimum closeout command
- commit-message convention

### 3. Confirm review ownership expectations

Lock down the review boundary before implementation starts.

- State that every backlog item's Definition of Done includes code review.
- State which non-implementing persona is the expected reviewer for the current top-most sprint backlog item.
- Confirm that the primary implementer for a change cannot also satisfy its review requirement.
- Confirm that backlog-item review happens on pull requests into the sprint branch and that the final sprint closeout review happens on the sprint branch pull request into `main`.
- Confirm which artifact will prove each backlog item's closeout claim, such as a passing test file, command result, generated output, or review note.

## Sprint Planning And Refinement Protocol

Use this protocol when selecting or refining backlog items.

### 1. Review acceptance criteria for ambiguity leakage

Do not accept backlog items that defer core contract decisions into dependent future work without saying so explicitly.

Reject or revise items when:

- acceptance criteria allow multiple incompatible interpretations of the same model behavior
- validation boundaries are left implicit
- ownership of runtime-specific tooling behavior is undefined
- a downstream item would be forced to resolve unresolved core-model semantics

### 2. Tighten completion language

Rewrite backlog items when needed so completion is testable.

Prefer:

- explicit supported scope
- explicit unsupported scope
- explicit validation behavior
- explicit documentation touchpoints when process changes are part of delivery
- explicit code-review completion by a non-implementing persona
- explicit evidence expected at closeout

### 3. Plan external proof requirements

Before accepting a backlog item as ready, identify any external proof the Definition of Done requires.

Resolve:

- whether hosted proof must come from push runs, pull-request runs, deployment artifacts, or other external sources
- which sprint phase (item-level or sprint-level closeout) must produce the external proof
- whether the external proof is blocking or advisory for closeout

Record the external proof plan in the sprint backlog item's notes so closeout does not depend on ad-hoc Product Owner exceptions.

## Sprint Closeout Protocol

Run this protocol before sprint review starts.

### 0. Sprint branch merge readiness

Before final closeout, confirm that the sprint branch can be merged to `main` through the planned sprint pull request.

Check:

- every committed backlog item is already merged into the sprint branch
- the sprint branch reflects the intended integrated sprint state
- the sprint closeout pull request from the sprint branch to `main` exists or is ready to open
- any final hosted proof expected for the sprint branch merge is identified explicitly
- the verification target is explicitly identified: either a clean branch verification (all changes committed, verification commands run against the branch HEAD) or a scoped file-set verification (specific changed files verified while unrelated worktree changes are acknowledged)
- if scoped verification is used, the scope boundary is documented in the sprint review notes

### 1. Pre-review consistency check

Confirm that implementation and documentation all describe the same delivered increment.

Check:

- implemented behavior in code
- tests that actually pass for the delivered scope
- `docs/PRODUCT_BACKLOG.md` status and sequencing claims
- the relevant file under `docs/sprint_backlogs/`
- `docs/SPEC.md` statements that describe the delivered behavior
- sprint review notes, if already drafted

Escalate immediately when any of these disagree:

- code says the feature works but tests do not cover it
- backlog says an item is done but the implementation is partial
- spec states stronger guarantees than the code actually provides
- review notes present assumptions as confirmed outcomes

### 2. Definition-of-Done evidence map

Before marking an item done, record which artifacts support each closeout claim.

Minimum evidence map:

- backlog item or sprint item
- claim being asserted
- proving artifact such as test, command output, or demo
- known gap if the claim is only partially proven

### 3. Review readiness decision

Do not start sprint review until one of these is true:

- the consistency check passes
- the open mismatch is explicitly documented as a known gap in the review material

### 4. Review and retrospective document closeout

When sprint review or retrospective produces repository-document changes, do not treat the ceremony as complete until those documentation changes are staged and committed, unless the user explicitly requests a discussion-only or no-commit outcome.

Check:

- the review or retrospective note exists or was intentionally skipped
- any required `docs/INDEX.md` update is present
- any sprint summary or backlog status synchronization required by the ceremony is present
- the sprint review note is committed when review documentation was written
- the sprint retrospective note is committed when retrospective documentation was written
- the sprint backlog summary status is synced when the sprint state changed
- the documentation index is synced when sprint review or retrospective docs were added
- the resulting documentation changes are committed with a Conventional Commit message
- the review or retrospective note includes an evidence provenance statement: either "evidence from clean committed snapshot at [commit/branch]" or "evidence from scoped dirty-worktree state — [description of uncommitted scope]"

### 5. Closeout waiting behavior when hosted proof is pending

When local implementation, review, and documentation are all complete but hosted proof (CI, deployment, etc.) is still pending on the sprint-level PR:

Decision tree:

1. **Wait**: If hosted proof is expected within a reasonable time window (e.g., CI pipeline < 30 minutes), keep the sprint in progress and wait for the proof to arrive before declaring closeout complete.
2. **Report pending handoff**: If hosted proof requires external action or an extended wait beyond the current session, report the sprint as "closeout pending — awaiting hosted proof" with an explicit list of remaining evidence, and schedule or document a follow-up check.
3. **Record and proceed**: If the repository or Product Owner explicitly opts out of hosted proof for the current sprint, record the decision and rationale in the sprint review notes and proceed with closeout.

Do not declare closeout complete while hosted proof is still pending unless an explicit opt-out is recorded.

### 6. Sprint-document synchronization checklist

Before declaring the sprint ceremony complete, confirm all sprint-level documents are synchronized:

- [ ] Sprint backlog file under `docs/sprint_backlogs/` — all items have final status and completion dates
- [ ] Sprint review note under `docs/sprint_reviews/` — exists or intentionally deferred with reason
- [ ] Sprint retrospective note under `docs/sprint_retrospectives/` — exists or intentionally deferred with reason
- [ ] `docs/INDEX.md` — updated with any new docs created during the sprint
- [ ] `docs/PRODUCT_BACKLOG.md` — reflects current state after sprint items delivered
- [ ] `docs/scrum_master/BOARD.md` — any resolved items moved to closed

If any synchronization step is deferred, record the reason in the sprint review or retrospective note.

## Escalation Rules

Escalate to the Product Owner when:

- acceptance criteria need scope cuts or scope expansion
- backlog ordering needs to change
- unresolved ambiguity affects product behavior rather than only process

Escalate to Developers when:

- code, tests, and docs disagree on actual delivered behavior
- verification commands are unstable or undefined
- runtime ownership is still unclear after sprint start

## Definition Of Success

This playbook is working when:

- sprint review starts from verified implementation facts
- docs drift is detected before review, not during or after it
- backlog items describe completion in a way that reduces downstream reinterpretation
- the team does not re-debate test-runner, `typecheck`, or delegation ownership mid-sprint
