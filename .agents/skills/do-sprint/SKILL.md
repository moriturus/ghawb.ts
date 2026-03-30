---
name: do-sprint
description: Execute a repository sprint backlog under explicit Scrum personas and repository rules. Use when Codex is asked to start, drive, or complete sprint backlog work, coordinate Product Owner and Scrum Master decisions, split implementation across Developer personas, or run a sprint item with sub-agent or multi-agent collaboration while preserving backlog order and review boundaries.
---

# Do Sprint

## Overview

Execute the current sprint backlog one item at a time under explicit team personas. Gate execution on backlog readiness first, prefer sub-agent or multi-agent collaboration inside each current item, and keep Product Owner and Scrum Master personas out of implementation work. By default, continue from one backlog item to the next in sprint order until every committed item is `done` or a stop condition is hit.

Each sprint should normally run on a dedicated sprint branch. Each backlog item should normally be delivered on its own feature branch created from the latest sprint branch state, reviewed through its own pull request targeting the sprint branch, and the sprint branch itself should be merged back to `main` only through a final sprint-level pull request.

## Run Order

1. Read the repository-local `AGENTS.md`, `docs/TEAM.md`, the target sprint backlog under `docs/sprint_backlogs/`, and any backlog or spec files needed for the current top item.
2. Identify the target sprint backlog explicitly. Do not guess between multiple sprint files.
3. Check every committed item in that sprint backlog before doing implementation work.
4. Stop immediately if any sprint backlog item is not `ready`.
5. Announce the active personas and the current top-most item before making changes.
6. Prefer sub-agents or multi-agent collaboration for the current item when the environment supports it.
7. Create or confirm the sprint branch first, then create or confirm a dedicated feature branch for the current item from the latest sprint branch state before implementation work starts.
8. Execute only the current top-most ready item. Do not implement multiple backlog items in parallel.
9. Verify, review, obtain Product Owner acceptance for the item, and update docs that must stay aligned with the change.
10. After the current item reaches `done`, merge it into the sprint branch, re-read the sprint backlog, and continue with the next top-most item that is not done on a new item branch from the updated sprint branch.
11. After every committed sprint item is `done`, open the sprint-level pull request from the sprint branch into `main`, verify the final sprint closeout proof, and only then stop.

## Ready Gate

- Inspect every selected or committed item in the target sprint backlog.
- Require each item to be marked `Status: ready` before sprint execution starts.
- Treat missing status, alternate wording, or ambiguous readiness as not ready.
- If any item is not ready, stop without editing code and report the blocking items with exact file references and statuses.
- Do not downgrade this gate because the top item alone looks ready. The whole sprint backlog must be ready before execution continues.

## Persona Declaration

Declare the personas before implementation. Use the persona names defined in `docs/TEAM.md` instead of inventing ad hoc roles. Treat persona assignment as required setup, not optional narration.

- Product Owner: refine scope, acceptance criteria, and ordering decisions.
- Scrum Master: coordinate dependencies, impediments, execution order, and review readiness.
- Developer persona or personas: implement, test, and review within explicit concern boundaries.

State the assignment in the work plan in plain language, for example:

```text
Product Owner: Aoi Sakamoto
Scrum Master: Ren Takahashi
Implementation: Mio Kanda
Validation/Review: Haru Nishimura
Tooling support: Yui Morita
```

Always include the persona declaration explicitly in the response before implementation starts for the current item. When sprint execution continues to the next item, restate the persona assignment for that new item even if the names did not change.

Keep these role boundaries:

- Do not let the Product Owner or Scrum Master persona author production code or tests.
- Keep code review with a persona other than the primary implementation owner.
- Split Developer work by concern only inside the current backlog item.

## Multi-Agent Preference

Prefer delegated work over a single-agent pass when sub-agents are available.

- Keep one coordinating main agent.
- Delegate small, reviewable tasks that map cleanly to personas from `docs/TEAM.md`.
- Use Product Owner delegation for scope refinement and acceptance-criteria clarification.
- Use Scrum Master delegation for dependency checks, impediment tracking, and execution sequencing.
- Use Developer delegations for architecture, implementation, validation, tooling, or review slices.
- Keep delegated tasks on the same backlog item. Do not use multi-agent work to advance multiple backlog items at once.
- When the current item finishes, end or reuse delegations as needed, then open a new delegation plan for the next backlog item instead of carrying multi-item implementation in parallel.
- If sub-agents are unavailable, continue locally but keep the same persona mapping explicit in the written plan.

## Execution Workflow

### 1. Build Context

- Read the current sprint backlog file, `docs/TEAM.md`, and any linked spec or ADR material needed for the top item.
- Confirm the sprint backlog order and start from the top-most item that is not done.
- Capture prerequisites, definition of done, acceptance criteria, and linked docs before coding.
- Repeat this context refresh after each completed item so execution always resumes from the latest backlog state.

### 2. Publish the Sprint Plan

Before editing files, publish a short execution plan that includes:

- target sprint backlog file
- ready gate result
- active backlog item
- persona assignments with explicit names from `docs/TEAM.md`
- sprint branch plan
- item branch and PR plan
- delegation plan for sub-agents or a note that the environment cannot delegate
- verification plan

### 3. Prepare The Item Branch

- Create or confirm a dedicated sprint branch before item implementation starts unless the user explicitly provided an existing sprint branch.
- Create or switch to a dedicated feature branch for the current backlog item from the latest sprint branch state before editing files unless the user explicitly provided an existing item branch.
- Prefer one backlog item per branch and one pull request per backlog item.
- Keep branch naming explicit and item-scoped so review history maps cleanly back to the sprint backlog.
- Target the current item's pull request at the sprint branch rather than `main`.
- Do not mix later sprint items into the current item's branch or pull request.

### 4. Execute the Current Item

- Let the Product Owner persona clarify scope if backlog language is ambiguous.
- Let the Scrum Master persona confirm dependencies and review path.
- Let Developer personas implement only what is needed for the active item.
- Use Conventional Commits for any commit created during the sprint, including item-level implementation commits and final sprint closeout commits.
- Follow repository engineering rules such as TDD, coverage expectations, and documentation alignment.

### 5. Verify, Review, And Accept The Item

- Run relevant tests, build steps, and checks for the changed surface.
- Perform code review through a persona other than the implementation owner.
- Open or update the current item's pull request once the branch is ready for review.
- Treat the pull request into the sprint branch as the normal review vehicle for the item unless the repository or user explicitly requires a different review path.
- After the pull request exists, add a pull-request review record automatically under the non-implementing review persona instead of stopping at PR creation.
- Prefer a real GitHub review submission on the pull request so the review record is durable and visible in the normal review surface.
- If the same GitHub account authored the pull request and GitHub blocks self-approval, fall back to a review comment or review-request comment that clearly records the non-implementing persona's findings and states whether any blocking issues remain.
- Do not report review as missing merely because self-approval is impossible from the current account when a durable pull-request review comment can still be recorded.
- After implementation and verification are complete, have the Product Owner persona check the item's Definition of Done and Acceptance Criteria directly.
- Product Owner acceptance happens item-by-item after implementation and verification, not later during sprint review.
- Confirm the backlog item satisfies its full definition of done before moving on.
- Do not treat implementation-complete, locally verified, or review-complete work as a done backlog item when any explicit Definition of Done or Acceptance Criteria evidence is still missing.
- If a backlog item requires external proof such as a hosted CI run, pull request status, deployment artifact, or review record, keep the item in progress until that proof exists.
- Do not mark the item `done` until code review is complete, the Product Owner has accepted the item against DoD and Acceptance Criteria, and the required pull-request-based evidence is present when the workflow expects it.
- Do not mark the sprint item complete, done, closed, or satisfied when any required closeout evidence is still pending.

### 6. Sync Project Records

Update project records when the change requires it:

- `docs/SPEC.md` when behavior or architectural constraints changed
- `docs/PRODUCT_BACKLOG.md` and `docs/sprint_backlogs/` when status or delivery records changed
- `docs/INDEX.md` when new docs are added under `docs/`
- `docs/LEARN.md` when a durable lesson or gotcha should be preserved
- relevant ADRs when architectural decisions changed
- Update sprint or backlog status records only after the item's full Definition of Done is met.

### 7. Continue Through The Sprint

- After an item is marked `done`, merge it into the sprint branch, re-read the sprint backlog, and identify the next top-most committed item that is not done.
- Publish a refreshed short plan for that next item before editing again, including a fresh explicit persona declaration.
- Continue item-by-item until all committed sprint items are `done`.
- After the final committed item is done, open the sprint closeout pull request from the sprint branch to `main`, verify the sprint-level hosted proof when required, and only then stop.
- Do not stop merely because one item finished if later committed sprint items are still pending and no stop condition applies.

## Completion Gate

- Treat the backlog item's Definition of Done as the final completion gate, not as a suggestion.
- Require all explicit Acceptance Criteria, review expectations, and evidence requirements to be satisfied before declaring the item complete.
- Require item-level Product Owner acceptance after implementation and verification and before declaring the item complete.
- Require the item to be isolated on its own feature branch, reviewed through its own pull request into the sprint branch, and merged into the sprint branch before the sprint moves on.
- Require the sprint branch itself to be merged into `main` through a final sprint-level pull request before treating the sprint as complete.
- Treat a pull-request review comment recorded under the non-implementing persona as acceptable review evidence when GitHub account constraints prevent formal self-approval from the current session.
- If code changes are ready but an external proof step remains pending, report the item as in progress with a short list of remaining completion blockers.
- Do not advance to the next backlog item while the current item is still missing required completion evidence.
- Treat the sprint itself as complete only when every committed backlog item is `done`.

## Stop Conditions

Stop and report instead of pushing forward when any of these are true:

- any sprint backlog item is not `ready`
- the target sprint backlog cannot be identified confidently
- the next active item is blocked by missing prerequisites
- repository instructions conflict and the conflict cannot be resolved from local docs
- required review cannot be performed under the persona boundary rules
- a sprint branch cannot be established or the sprint-level pull-request path into `main` cannot be established
- a dedicated item branch or normal pull-request review path cannot be established for the current item
- Product Owner acceptance for the current item cannot be performed after implementation and verification
- the current item's Definition of Done cannot yet be fully satisfied, even if implementation work is otherwise complete
- all committed sprint backlog items are already `done`

## Output Contract

When using this skill, make the sprint state obvious in the response.

- Start by naming the target sprint and the current active item.
- State whether the ready gate passed or failed.
- Name the personas in use with explicit assignment lines such as `Product Owner: ...`, `Scrum Master: ...`, `Implementation: ...`, `Validation/Review: ...`, and `Tooling support: ...` when applicable.
- State the sprint branch and the current item branch.
- State the current item branch and pull request plan or status.
- State whether sub-agents or multi-agent collaboration will be used.
- State explicitly whether the current item is `in progress` or `done` against its Definition of Done.
- State whether Product Owner acceptance for the current item is still pending or completed.
- State whether sprint execution is continuing to the next item, waiting on the sprint closeout pull request, or has stopped, and why.
- If any DoD evidence is still missing, name the missing evidence and do not present the item as complete.
- If execution is blocked, stop there and list blockers instead of proposing implementation details.
