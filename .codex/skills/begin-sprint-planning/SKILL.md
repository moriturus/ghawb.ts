---
name: begin-sprint-planning
description: Start sprint planning from a repository backlog and team process docs. Use when the user wants to identify the next sprint scope, choose candidate backlog items under a capacity limit, capture ordering and dependency rationale, and surface the first set of unresolved planning decisions before refinement or persistence.
---

# Begin Sprint Planning

Run the opening half of sprint planning as a short, evidence-based workflow. Prefer repository backlog rules and team-process documents over ad hoc planning habits.

## Build Context

Read only the repository context needed to plan the sprint.

- Read the repository `AGENTS.md`, `docs/PRODUCT_BACKLOG.md`, the relevant file under `docs/sprint_backlogs/` when it exists, the specification, and team-role documents.
- Identify sprint-planning rules such as ordering constraints, dependency rules, status conventions, capacity handling, and documentation obligations.
- Confirm the sprint identifier, capacity, and any user-supplied scope limits before selecting work.
- Prefer direct evidence from backlog items, story points, prerequisites, and documented priorities over intuition.

## Planning Flow

Use this order unless the user explicitly asks for a narrower planning task.

### 1. Restate the planning scope

- State which sprint is being planned.
- State the available capacity and any non-default constraints.
- Summarize the current top product-backlog candidates and ordering rules in a few lines.

### 2. Select candidate items

- Respect product backlog priority and explicit sequencing rules before trying to maximize point usage.
- Treat the default selection rule as the largest in-order prefix that fits capacity unless repository documents define a different rule.
- Call out residual capacity explicitly when it cannot be used without violating order, dependencies, or granularity.
- When the repository prefers sub-agents or multi-agent collaboration, capture any planning decision about how delegated work will be used during sprint execution.
- If the user asks only for recommendation, stop after giving the proposed sprint scope and rationale.

### 3. Resolve planning decisions

- Ask only for decisions that materially affect implementation or acceptance.
- Prefer short, targeted questions grouped by backlog item.
- Capture answers as explicit planning decisions rather than leaving them implicit in chat history.
- If information is discoverable from repository docs, derive it there instead of asking.
- Continue asking step by step when the user prefers sequential questions instead of one large batch.

### 4. Hand off to finish

- When candidate items and remaining planning decisions are clear, hand off to `refine-sprint-planning` if scope, estimates, ordering, or acceptance still need work.
- Hand off directly to `finish-sprint-planning` only when the plan is already decision-complete and the user wants persistence.
- Stop before editing backlog documents unless the user explicitly asks to persist immediately and there are no unresolved planning decisions.

## Response Shape

Default to this structure when reporting planning live:

1. Sprint scope
2. Proposed items
3. Open decisions
4. Scrum Master assessment

Omit sections the user did not ask for. Keep the language direct and specific.

## Quality Bar

- Do not skip documented ordering rules just to fill capacity more tightly.
- Do not ask questions whose answers are already discoverable from repository docs.
- Surface unused capacity, deferred items, and blocked dependencies explicitly.
- Distinguish clearly between proposal-stage decisions and persisted backlog updates.
- When repository docs define team personas, use them for evaluation language without inventing fictional implementation work.
- Treat this skill as the opening phase: propose scope and expose open decisions, but do not absorb the full refinement phase by default.
