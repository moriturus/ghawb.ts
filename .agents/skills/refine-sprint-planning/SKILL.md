---
name: refine-sprint-planning
description: Refine sprint planning after initial scope selection. Use when the user wants to reconcile Product Owner, Scrum Master, and Developer viewpoints, split or resequence backlog items, adjust story points, sharpen acceptance criteria, close unresolved planning decisions, or persist the refined sprint backlog when they explicitly ask to commit it.
---

# Refine Sprint Planning

## Overview

Run the middle decision-closing phase of sprint planning. Use repository evidence first, converge role-based planning input into a decision-complete sprint slice, and persist docs only when the user explicitly commits the refined plan.

## Build Context

- Read the repository `AGENTS.md`, `docs/PRODUCT_BACKLOG.md`, the relevant `docs/sprint_backlogs/sp<N>.md` file when it exists, the specification, team-role documents, and only the planning or review docs needed to resolve the current question.
- Rebuild the current sprint-planning state from repository evidence and prior chat turns before asking follow-up questions.
- Distinguish between discoverable facts, unresolved product decisions, and implementation or verification tradeoffs.
- Treat the current top product-backlog items, prerequisites, story points, and ordering rules as the planning baseline unless the user explicitly asks to reconsider them.

## Refinement Flow

Use this order unless the user explicitly asks for a narrower refinement task.

### 1. Restate the current sprint plan

- State which sprint or planning slice is being refined.
- Summarize current candidate items, ordering constraints, capacity, and any explicit repository process rules that govern selection or persistence.
- Make clear which parts are already decided versus still open.

### 2. Close planning gaps

- Resolve only the decisions that materially affect scope, sequence, estimates, acceptance, or sprint readiness.
- Prefer short targeted questions grouped by backlog item or decision area.
- If an answer is discoverable from repository docs, derive it instead of asking.
- Preserve explicit role boundaries when interpreting viewpoints from the Product Owner, Scrum Master, and Developer personas.

### 3. Refine the backlog slice

- Split items only when doing so improves execution clarity, acceptance clarity, or sequencing realism.
- Re-estimate story points only when scope, complexity, or item boundaries materially changed.
- Keep the revised sprint slice in strict delivery order and call out residual capacity explicitly.
- When a new issue appears that should not be absorbed into the active item, recommend creating a separate backlog item instead of silently expanding scope.

### 4. Decide whether to persist

- If the user is still exploring or discussing tradeoffs, stop after presenting the refined plan and committed decisions.
- If the user explicitly asks to confirm or persist the sprint backlog, update the relevant sprint backlog doc, move selected items out of the product backlog when appropriate, and keep related planning docs aligned.
- When persistence would overlap heavily with the closing workflow, keep the work compatible with `finish-sprint-planning` conventions rather than inventing a separate document format.

## Decision Categories

- Product Owner decisions:
  - item inclusion or deferral
  - ordering adjustments
  - scope cuts
  - acceptance-criteria tightening
- Scrum Master decisions:
  - dependency sequencing
  - sprint readiness
  - impediment handling
  - buffer or capacity treatment
- Developer decisions:
  - item splitting
  - re-estimation
  - verification feasibility
  - whether a newly discovered problem belongs in the current item or a new backlog item

## Response Shape

Default to this structure when reporting planning live:

1. Sprint scope
2. Refined items
3. Committed decisions
4. Open decisions
5. Documentation updates
6. Scrum Master assessment

Omit sections the user did not ask for. Keep the language direct and specific.

## Quality Bar

- Do not reopen settled decisions unless new evidence makes them unsafe.
- Do not ask questions whose answers are already discoverable from repository docs.
- Distinguish clearly between refinement, recommendation, and persisted backlog changes.
- Keep role-based viewpoints grounded in repository-defined personas instead of inventing fictional implementation work.
- If persisting from this skill, keep `docs/PRODUCT_BACKLOG.md`, `docs/sprint_backlogs/sp<N>.md`, and `docs/INDEX.md` internally consistent.
- Hand off to `finish-sprint-planning` when the user wants a dedicated closing pass rather than combined refinement and persistence.
