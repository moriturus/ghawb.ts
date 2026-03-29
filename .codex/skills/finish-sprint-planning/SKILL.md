---
name: finish-sprint-planning
description: Finish sprint planning by persisting a decision-complete sprint backlog. Use when the user wants to write a sprint backlog record under `docs/sprint_backlogs/`, move selected items out of `docs/PRODUCT_BACKLOG.md`, mark sprint items ready, update related planning notes, or request a final Scrum Master readiness assessment after scope and planning decisions are already settled.
---

# Finish Sprint Planning

Run the closing half of sprint planning as a short, evidence-based workflow. Persist only the planning state that is already decided or explicitly requested by the user.

## Build Context

Read only the repository context needed to finalize the sprint backlog.

- Read the repository `AGENTS.md`, `docs/PRODUCT_BACKLOG.md`, the relevant file under `docs/sprint_backlogs/` when it exists, the specification, and team-role documents.
- Read the already chosen sprint scope and planning decisions from chat history or from a prior `begin-sprint-planning` or `refine-sprint-planning` pass.
- Identify documentation obligations such as keeping `docs/PRODUCT_BACKLOG.md`, `docs/sprint_backlogs/sp<N>.md`, and `docs/INDEX.md` aligned.

## Finish Flow

Use this order unless the user explicitly asks for a narrower finishing task.

### 1. Validate readiness to persist

- Confirm the sprint identifier, capacity, selected items, and any still-open planning decisions.
- If a decision is still required to write durable planning notes or committed scope, ask only that blocking question before editing.
- If the user already asked to create the sprint backlog or commit the sprint scope, treat that as permission to persist once blocking decisions are resolved.

### 2. Record planning notes

- Update the relevant file under `docs/sprint_backlogs/` when the user asks to persist planning.
- Record:
  - sprint capacity
  - selected items and total points
  - ordering and dependency rationale
  - scope or deferral decisions
  - item-specific implementation decisions made during planning
- Keep notes concise and durable.

### 3. Move work into the sprint backlog

- Move selected items out of `docs/PRODUCT_BACKLOG.md` and into the relevant file under `docs/sprint_backlogs/` when the sprint scope is committed.
- Preserve the standard backlog template for each item.
- When a sprint scope is being committed into the sprint backlog, selected items should normally transition into a sprint-ready status such as `ready` unless the repository uses a different explicit convention or the user asks to keep another status.
- Do not leave selected sprint items in a pre-selection state such as `todo` once they have been moved into a committed sprint backlog unless the repository docs explicitly require that convention.
- Update remaining product-backlog priority notes so they reflect only the unselected backlog.
- If a new sprint backlog Markdown file is added under `docs/`, update `docs/INDEX.md` in the same change.

### 4. Evaluate planning readiness

- When asked for a Scrum Master evaluation, adopt the Scrum Master persona defined by the repository.
- Evaluate:
  - sequencing correctness
  - dependency clarity
  - capacity realism
  - unresolved impediments
  - whether the sprint is ready to start
- Distinguish clearly between confirmed readiness, residual risks, and missing external verification steps.

## Response Shape

Default to this structure when reporting planning live:

1. Sprint scope
2. Committed items
3. Documentation updates
4. Scrum Master assessment

Omit sections the user did not ask for. Keep the language direct and specific.

## Quality Bar

- Do not present backlog moves or status changes as complete unless the files were actually updated.
- Keep `docs/PRODUCT_BACKLOG.md` and the relevant `docs/sprint_backlogs/sp<N>.md` file internally consistent after each planning edit.
- Before finishing, verify that each selected sprint item uses the committed sprint status convention expected by the repository, and correct stale pre-selection statuses such as `todo` when the sprint is being marked ready to start.
- If a new sprint backlog file is created under `docs/`, update `docs/INDEX.md` in the same change.
- Surface unused capacity, deferred items, and blocked dependencies explicitly.
- When repository docs define team personas, use them for evaluation language without inventing fictional implementation work.
- Treat this skill as the closing phase: do not reopen settled planning decisions unless persistence is blocked by a concrete unresolved issue.
