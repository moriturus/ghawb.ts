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

### 0. Confirm role, delegation, and sequencing boundaries

Restate the team's standing working agreements before sprint execution begins.

- Confirm that Product Owner and Scrum Master personas will not act as implementers.
- Confirm that sprint backlog work will proceed from the top item downward.
- Confirm that the team will not implement multiple sprint backlog items in parallel.
- Confirm which Developer persona is expected to carry the primary implementation responsibility for the current top item.
- Confirm how sub-agents or multi-agent collaboration will be used first for the current sprint, and which persona owns each delegated slice.

### 1. Confirm documentation update rules

Record which repository documents are expected to change during the sprint.

- Check whether the sprint scope affects `docs/SPEC.md`.
- Check whether product backlog status or sequencing updates will be needed in `docs/PRODUCT_BACKLOG.md`.
- Check which file under `docs/sprint_backlogs/` will record the sprint backlog state.
- Check whether a new review or retrospective note is likely to be created under `docs/`.
- Confirm whether `docs/INDEX.md` must be updated as part of the sprint.
- State explicitly which role owns each document update during the sprint.

Minimum output:

- expected docs to update
- responsible role
- review point for each update

### 2. Confirm tooling expectations

Lock down the working agreement for verification before feature work begins.

- State the primary unit or integration test runner for the sprint.
- State whether Deno is part of the primary suite or smoke-only coverage.
- State the expected `typecheck` surface.
- State the root verification command that will be treated as the sprint's minimum quality gate.

Minimum output:

- primary test runner
- secondary or smoke runners
- `typecheck` target
- minimum closeout command

### 3. Confirm review ownership expectations

Lock down the review boundary before implementation starts.

- State that every backlog item's Definition of Done includes code review.
- State which non-implementing persona is the expected reviewer for the current top-most sprint backlog item.
- Confirm that the primary implementer for a change cannot also satisfy its review requirement.
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

## Sprint Closeout Protocol

Run this protocol before sprint review starts.

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
