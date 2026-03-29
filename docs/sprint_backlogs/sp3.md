# Sprint Backlog: Sprint 3

This document records the selected sprint backlog and planning decisions for Sprint 3.

## Sprint Summary

Capacity: 15 story points.

Selected implementation units for Sprint 3: 11/15 story points.

Status: done

Completed At: 2026-03-29T21:33:58Z

## Planning Notes

- Capacity decision: Sprint 3 capacity is fixed at 15 story points.
- Selection decision: Sprint 3 commits `Item 6` and `Item 7` for a total of 11 story points.
- Ordering decision: Sprint 3 preserves the required execution order from the top of the product backlog and therefore takes the largest prefix that fits within capacity.
- Dependency decision: `Item 7` remains sequenced after `Item 6` because self-hosting depends on the CLI being complete and stable enough to generate the repository's own workflow files.
- Scope decision: Sprint 3 focuses on shipping the planned CLI as the final-stage interface and then validating the full stack by self-hosting the repository's CI/CD workflows with `ghawb`.
- Item 6 decision: The initial CLI slice will use an explicit `ghawb render ...` command, accept a directly specified TypeScript module as input, require an explicit output path, add one Node-module YAML emitter dependency through a concrete adapter, and keep the error contract minimal with standard error output plus a non-zero exit code on failure.
- Item 7 decision: Self-hosting work will target the repository's CI workflow first, commit the rendered workflow YAML to the repository, expose regeneration through a root `package.json` script, fully replace the hand-written workflow once the `ghawb` version exists, and treat GitHub Actions CI success as part of acceptance even though the final commit, push, and hosted CI execution are user-run verification steps.
- Collaboration decision: Sprint execution will keep one backlog item active at a time while using team personas within each item, with Aoi Sakamoto refining acceptance scope, Ren Takahashi coordinating dependencies and review readiness, and Developer personas splitting architecture, quality, and tooling concerns only inside the current top item.
- Buffer decision: The remaining 4 story points are intentionally left unallocated because no additional in-order backlog item remains after `Item 7`.

## Committed Items

### Item 6: Build the CLI as the final-stage interface

- Why: The CLI is a useful delivery layer, but it should only be added after the SDK and renderer are complete and stable.
- Prerequisites: The SDK foundation, hardened model invariants, shared Bun/Node testing workflow, and deterministic renderer must already exist.
- Implementation Plan: Define the initial CLI command shape, connect it to the renderer through one concrete YAML emitter adapter, support writing workflow files, and add tests around command execution, stable emitted YAML text, and failure modes.
- Definition of Done: A user can invoke the CLI to render at least one workflow definition into an output file, and the completed change has been code reviewed by a non-implementing persona.
- Acceptance Criteria: The CLI reports errors clearly, writes deterministic output, exercises one concrete YAML emitter path in automated tests, and proves that a supported workflow renders to stable YAML text.
- Story Points: 3
- Status: done
- Completed At: 2026-03-29T21:33:58Z
- Notes/Links: [SPEC.md](../SPEC.md). Primary implementation persona: Mio Kanda. Review and verification personas: Haru Nishimura, Ren Takahashi.

### Item 7: Enable self-hosted CI/CD using `ghawb`

- Why: Self-hosting is an explicit project goal and validates that the tool is viable for real workflows.
- Prerequisites: The SDK, hardened model invariants, shared Bun/Node testing workflow, renderer, and CLI must be complete and capable of generating the repository's own workflow files.
- Implementation Plan: Author the repository's CI/CD workflows with `ghawb`, replace any hand-written workflow files, and document the regeneration path.
- Definition of Done: The repository's CI/CD workflow definitions are authored with `ghawb` and rendered output is committed or reproducibly generated as chosen by the implementation, and the completed change has been code reviewed by a non-implementing persona.
- Acceptance Criteria: The project can maintain its own CI/CD workflows through `ghawb` without manual YAML editing.
- Story Points: 8
- Status: done
- Completed At: 2026-03-29T21:33:58Z
- Notes/Links: [SPEC.md](../SPEC.md), [ADR 0001](../adrs/0001-record-architecture-principles.md). Primary implementation persona: Yui Morita. Review and verification personas: Haru Nishimura, Ren Takahashi.
