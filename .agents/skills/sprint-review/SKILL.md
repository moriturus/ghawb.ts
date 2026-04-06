---
name: sprint-review
description: Run a structured sprint review for a completed sprint. Use when the user asks to start or summarize a sprint review, demo the current increment, identify implementation problems, capture Product Owner priority adjustment decisions, or write sprint review notes into repository documentation such as `docs/sprint_reviews/*.md`, `docs/sprint_backlogs/*.md`, `docs/PRODUCT_BACKLOG.md`, or specification updates.
---

# Sprint Review

Run the review as a short evidence-based workflow. Focus on the increment that actually exists in the repository, not on the original sprint intent alone. By default, when the repository already uses sprint review documents under `docs/sprint_reviews/`, do not stop at a live summary: write or update the sprint review note in the same turn unless the user explicitly asks for discussion only.

## Build Context

Read only the minimum repository context needed to review the sprint.

- Read the repository `AGENTS.md`, the relevant sprint backlog under `docs/sprint_backlogs/`, `docs/PRODUCT_BACKLOG.md`, the specification, and any existing team or process docs.
- Identify the sprint scope, acceptance criteria, and current implementation state.
- Check for dirty-worktree changes before assuming what was delivered in the sprint.
- Prefer direct evidence from code, tests, commands, and docs over narrative summaries.

## Review Flow

Use this order unless the user explicitly asks for something narrower.

### 1. Restate the sprint target

- State which sprint or backlog slice is under review.
- Summarize the intended increment and completion criteria in a few lines.

### 2. Demo the increment

- Run or inspect the smallest concrete demo that proves the delivered behavior.
- Prefer real commands over hypothetical examples.
- Show the important output in summarized form.
- If the sprint produced no runnable artifact, demo the increment through tests, generated files, or typed API usage.

### 3. Evaluate review findings

- Look for gaps between delivered behavior and sprint intent.
- Prioritize bugs, ambiguous contracts, validation holes, missing tests, and scale risks.
- Distinguish clearly between confirmed issues, residual risks, and open questions.
- If there are no material findings, state that explicitly.

### 4. Capture Product Owner decisions

- When backlog interpretation or priority adjustment is requested, adopt the Product Owner persona defined by the repository.
- Treat sprint review as a venue for Product Owner priority adjustment, release judgment, and follow-up scope decisions, not as the primary acceptance gate for individual backlog items.
- Assume item-level Product Owner acceptance should already have happened during sprint execution after implementation and verification.
- Adjust priority based on delivery risk, product value, and how much future work depends on the current ambiguity being resolved first.
- Prefer hardening work ahead of surface-area expansion when the current increment has contract gaps.
- When the repository prefers sub-agents or multi-agent collaboration, reflect that expectation in review notes when it materially affected execution or should affect next-sprint planning.

### 5. Record the review

- Write a concise sprint review note when the user asks for documentation.
- If the repository already has a `docs/sprint_reviews/` convention, treat documentation as the default closeout path for a sprint review even when the user does not separately ask for a file.
- Include:
  - delivered increment summary
  - demo scope
  - key findings
  - Product Owner decisions or backlog changes
  - relevant links to spec, backlog, and review artifacts
- Record sprint-specific completion facts in `docs/sprint_backlogs/sp<N>.md` and product-priority decisions in `docs/PRODUCT_BACKLOG.md` when the repository uses that split structure.
- If adding a new document under `docs/`, update the documentation index if the repository requires it.
- If the skill writes or updates repository files as part of the review, stage and commit those changes in the same turn unless the user explicitly asks for a no-commit result.

## Default Documentation Behavior

- When this skill is invoked for a completed sprint review and the repository contains `docs/sprint_reviews/`, create or update the corresponding `docs/sprint_reviews/sp<N>.md` note by default.
- Only skip writing the review note when the user explicitly asks for a verbal summary, brainstorming, or a no-file response.
- Treat the written sprint review as part of the normal completion path for this skill, not as an optional extra follow-up.
- When documentation is written, treat the closing commit as part of the normal completion path for this skill, not as optional follow-up work.

## Response Shape

Default to this structure when reporting the review live:

1. Sprint target
2. Increment demo
3. Findings
4. Product Owner decision
5. Follow-up documentation

Keep the language direct and specific. Do not pad the review with retrospective ceremony unless the user asks for it.

## Quality Bar

- Verify claims against the repository before stating them.
- Use exact file references and concrete command results when possible.
- Do not mark a sprint item as complete unless the implemented behavior and validation actually support that claim.
- Do not use sprint review as the moment when a backlog item first becomes accepted; if item-level Product Owner acceptance is missing, call that out as a process gap instead of silently accepting it here.
- Surface conflicts between backlog text, spec text, and implementation text instead of smoothing them over.
