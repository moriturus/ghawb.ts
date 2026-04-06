---
name: product-dicovery
description: Run evidence-based product discovery before backlog refill or sprint planning. Use when the user wants to identify the next product opportunities, synthesize signals from retrospectives, sprint reviews, specs, backlog state, docs gaps, issues, or user feedback, turn those signals into candidate backlog items or themes, and clarify what should be prioritized next without starting implementation.
---

# Product Dicovery

Run a short product-discovery workflow that converts repository evidence into actionable product options. Prefer concrete signals from the repo over intuition, and keep scope-definition work separate from implementation and sprint execution.

## Build Discovery Context

Read only the sources needed to explain the next product opportunities.

- Read the repository `AGENTS.md`, `docs/SPEC.md`, `docs/PRODUCT_BACKLOG.md`, and `docs/TEAM.md`.
- Read the latest sprint review and sprint retrospective first when the backlog is empty or the next direction is unclear.
- Read `docs/LEARN.md`, `README.md`, ADRs, and relevant sprint backlog records only when they materially affect opportunity selection.
- Search for direct signals such as repeated limitations, postponed ideas, testing pain, API naming friction, packaging gaps, or docs gaps.
- Distinguish confirmed evidence from inference. Quote the source file and section in your notes.

## Discovery Flow

Use this order unless the user asks for a narrower task.

### 1. Restate the discovery goal

- State what decision the discovery should support.
- State the evidence scope, such as the latest sprint only, all delivered work, or a specific product area.
- State whether the output should stop at themes, produce backlog candidates, or persist backlog updates.

### 2. Gather signals

- Extract concrete product signals from reviews, retrospectives, backlog state, spec gaps, open issues, and user-provided feedback.
- Group signals by problem area rather than by document.
- Prefer repeated or high-impact signals over one-off observations.
- Call out constraints that must remain intact, such as architecture boundaries, workflow ownership rules, or package-manager compatibility expectations.

### 3. Form opportunity themes

- Turn the raw signals into a small set of themes with clear user or product value.
- Name the problem, affected user, likely value, and major risks or unknowns for each theme.
- Separate feature expansion, quality/stabilization, docs or adoption work, and process-only work.
- Remove themes that are merely implementation ideas without a clear problem statement.

### 4. Convert themes into candidate backlog items

- When the user wants actionable planning output, draft backlog-ready item candidates using the repository backlog template.
- Include `Why`, `Prerequisites`, `Implementation Plan`, `Definition of Done`, `Acceptance Criteria`, `Story Points`, `Status`, `Completed At`, and `Notes/Links`.
- Keep candidates small enough for sprint planning. Split oversized themes before handing them off.
- State assumptions explicitly when story points, prerequisites, or sequencing are inferred rather than documented.

### 5. Recommend next action

- Recommend one of these endings explicitly:
  - stop at discovery themes
  - refine the candidate items further
  - persist new backlog items
  - continue with `begin-sprint-planning`
- Hand off to `refine-sprint-planning` when item sizing, sequencing, or acceptance criteria still need work.
- Hand off to `finish-sprint-planning` only after discovery output has already been converted into decision-complete backlog records and the user wants persistence.

## Repo-Specific Heuristics

- In this repository, treat an empty `docs/PRODUCT_BACKLOG.md` as a discovery trigger, not as permission to invent items without evidence.
- Start from Sprint 15 review and retrospective evidence when the user asks what should come after the delivered backlog.
- Preserve documented architectural constraints from `docs/SPEC.md` and ADRs. Do not propose YAML parser support, implicit workflow discovery, or dependency choices that violate repository rules unless the discovery result explicitly includes a spec or ADR change.
- Prefer backlog items that can be validated with the project's existing test-first and documentation-alignment expectations.
- Keep discovery output distinct from sprint commitment. Discovery proposes options; sprint planning commits to ordered work.

## Response Shape

Default to this structure when reporting discovery:

1. Discovery scope
2. Key signals
3. Opportunity themes
4. Candidate backlog items
5. Recommendation

Omit sections the user did not ask for. Keep the output evidence-based and specific.

## Quality Bar

- Do not skip source citations when presenting product signals.
- Do not present speculative product direction as settled fact.
- Do not jump from one signal directly to a large multi-sprint initiative without intermediate slices.
- Do not start implementation, branch creation, or sprint execution from this skill alone.
- Do not persist backlog changes unless the user explicitly asks for repository updates.
