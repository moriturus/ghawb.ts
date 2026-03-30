---
name: sprint-retrospective
description: Run a structured sprint retrospective for a completed sprint. Use when the user asks to start or summarize a sprint retrospective, collect reflections from repository-defined roles or personas, identify team and product improvement ideas, group retrospective outputs into process versus product actions, or record follow-up items into repository documentation such as `docs/scrum_master/BOARD.md`, `docs/PRODUCT_BACKLOG.md`, `docs/sprint_backlogs/*.md`, or retrospective notes.
---

# Sprint Retrospective

Run the retrospective as a short, role-aware reflection workflow. Focus on what was actually done in the sprint, what friction appeared, and which improvements should change team process versus product direction.

## Build Context

Read only the repository context needed to run a grounded retrospective.

- Read the repository `AGENTS.md`, the relevant sprint backlog under `docs/sprint_backlogs/`, `docs/PRODUCT_BACKLOG.md`, team-role definitions, and any sprint review or retrospective notes that already exist.
- Confirm which sprint or backlog slice is being discussed.
- Distinguish between actual work performed and role-based perspective taking.
- Prefer evidence from completed work, review findings, and decisions already captured in docs over vague recollection.

## Retrospective Flow

Use this order unless the user explicitly asks for a narrower retrospective.

### 1. Restate the retrospective scope

- State which sprint or delivery slice is under discussion.
- Summarize what the sprint aimed to deliver and what actually shipped.

### 2. Gather role-based reflections

- Use the repository's defined team roles or personas when they exist.
- For each requested role, report:
  - what work that role can credibly claim or represent
  - what problems that role observed
  - what that role wants improved next
- When the repository prefers sub-agents or multi-agent collaboration, include whether that expectation was used effectively or needs process follow-up.
- If a role did not literally execute work, make that explicit and present the reflection as a role-based viewpoint rather than fabricated parallel labor.

### 3. Consolidate improvement proposals

- Merge overlapping suggestions across roles.
- Separate confirmed process issues from product or implementation issues.
- Keep improvements concrete enough to turn into action items.

### 4. Group actions into team versus product improvement

- Team improvement:
  - process clarity
  - planning quality
  - documentation workflow
  - review readiness
  - coordination and role ownership
- Product improvement:
  - implementation gaps
  - architecture hardening
  - testing platform changes
  - delivery-scope changes that belong in the product backlog

### 5. Route actions to the correct owner

- Send team-improvement actions to the Scrum Master path, such as `docs/scrum_master/BOARD.md` or a coordination TODO list.
- Send product-improvement actions to the Product Owner path, such as `docs/PRODUCT_BACKLOG.md`, the relevant `docs/sprint_backlogs/*.md`, backlog items, or priority adjustment.
- When the repository defines role docs, respect those role boundaries.

### 6. Record the retrospective

- When the user asks for documentation, write concise retrospective notes.
- Include:
  - sprint scope
  - role-based reflections
  - grouped improvements
  - Scrum Master owned follow-ups
  - Product Owner owned follow-ups
- When the repository uses split backlog records, keep sprint-specific notes in `docs/sprint_backlogs/sp<N>.md` and product-priority follow-ups in `docs/PRODUCT_BACKLOG.md`.
- Update documentation indexes when the repository requires it.

## Response Shape

Default to this structure when reporting the retrospective live:

1. Sprint scope
2. Role reflections
3. Team improvements
4. Product improvements
5. Follow-up documentation

Keep the language direct and specific. Avoid generic retrospective phrases that are not tied to the repository's actual work.

## Quality Bar

- Do not invent individual contributions that did not happen.
- Clearly distinguish role-based viewpoint from literal execution when using personas.
- Turn repeated complaints into actionable follow-up items instead of repeating them verbatim.
- Keep team-improvement items process-owned and product-improvement items backlog-owned.
- Verify any claimed backlog or documentation updates against the repository before reporting them as complete.
