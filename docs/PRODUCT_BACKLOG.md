# Product Backlog

This document defines the prioritized product backlog for `ghawb`.

## Item Template

Every product backlog item in this document should use the following template.

```markdown
### Item ID: Short title

- Why:
- Prerequisites:
- Implementation Plan:
- Definition of Done:
- Acceptance Criteria:
- Story Points:
- Status:
- Completed At:
- Notes/Links:
```

Use `Completed At: N/A` for items that are not done yet. Once implementation and acceptance are complete, update the item to `Status: done`, record the completion timestamp in UTC, and move the item into the relevant sprint backlog record under `docs/sprint_backlogs/`.

## Operating Rules

- Product backlog items remain here until they are selected into a sprint.
- Sprint backlog execution must proceed from the top selected item downward.
- The team must not actively implement multiple sprint backlog items in parallel.
- Sprint backlog execution is collaborative across all roles, but each role must stay within its boundary defined in [TEAM.md](./TEAM.md).
- Every backlog item's Definition of Done must include completed code review.
- Code review for a backlog item must be performed by a persona other than the persona that held the primary implementation responsibility for the change.

## Current Product Backlog

### Item 56: String shorthand for step name in `uses()` and `run()`

- Why: `uses()` と `run()` の第二パラメータは `StepMetadata` オブジェクトだが、実際の使用で最も頻繁に指定されるフィールドは `name` のみである。`job.uses("actions/checkout@v4", { name: "Checkout" })` のようなボイラープレートを `job.uses("actions/checkout@v4", "Checkout")` と短縮できれば、日常的なワークフロー記述の可読性と簡潔さが向上する。
- Prerequisites: None.
- Implementation Plan: `uses()` と `run()` の第二パラメータの型を `StepMetadata | string` に拡張し、文字列が渡された場合は `{ name: value }` として解釈する。既存の `StepMetadata` オブジェクト渡しは後方互換で維持する。`runScript()` も同様のメタデータパラメータを持つため、スコープに含めるか判断する。バリデーション（空文字列拒否など）は既存の `name` フィールドのルールに従う。
- Definition of Done: `uses()` と `run()` が第二パラメータとして文字列を受け付け `name` として解釈する。既存のオブジェクト渡しが後方互換で動作する。テストとコードレビューが完了している。
- Acceptance Criteria: `job.uses("actions/checkout@v4", "Checkout")` が `{ name: "Checkout", uses: "actions/checkout@v4" }` と等価に動作する。`job.run("npm test", "Run tests")` が `{ name: "Run tests", run: "npm test" }` と等価に動作する。既存の `StepMetadata` オブジェクト渡しは変更なく動作する。
- Story Points: 2
- Status: new
- Completed At: N/A
- Notes/Links: Sprint 16 review後のPOフィードバックから発案。`runScript()` への適用は実装時に判断する。

- Historical note: Prior intake rationale, older priority adjustments, and prior sprint-selection decisions were moved to [PRODUCT_BACKLOG_HISTORY.md](./PRODUCT_BACKLOG_HISTORY.md) so this file stays focused on the active backlog.
- Sprint 16 selection note: Items 51–55 (19 SP total) were committed to Sprint 16 after estimate validation and acceptance-criteria refinement. See [Sprint 16 Backlog](./sprint_backlogs/sp16.md) for committed scope and planning notes.

## Sprint Backlog Records

- [Sprint 1 Backlog](./sprint_backlogs/sp1.md)
- [Sprint 2 Backlog](./sprint_backlogs/sp2.md)
- [Sprint 3 Backlog](./sprint_backlogs/sp3.md)
- [Sprint 4 Backlog](./sprint_backlogs/sp4.md)
- [Sprint 5 Backlog](./sprint_backlogs/sp5.md)
- [Sprint 6 Backlog](./sprint_backlogs/sp6.md)
- [Sprint 7 Backlog](./sprint_backlogs/sp7.md)
- [Sprint 8 Backlog](./sprint_backlogs/sp8.md)
- [Sprint 9 Backlog](./sprint_backlogs/sp9.md)
- [Sprint 10 Backlog](./sprint_backlogs/sp10.md)
- [Sprint 11 Backlog](./sprint_backlogs/sp11.md)
- [Sprint 12 Backlog](./sprint_backlogs/sp12.md)
- [Sprint 13 Backlog](./sprint_backlogs/sp13.md)
- [Sprint 14 Backlog](./sprint_backlogs/sp14.md)
- [Sprint 15 Backlog](./sprint_backlogs/sp15.md)
- [Sprint 16 Backlog](./sprint_backlogs/sp16.md)
